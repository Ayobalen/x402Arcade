/**
 * x402 Payment Middleware Factory
 *
 * Creates configured Express middleware for x402 HTTP payment processing.
 * The middleware handles the 402 Payment Required flow:
 * 1. Returns 402 with payment requirements when no X-Payment header is present
 * 2. Validates and settles payments when X-Payment header is provided
 * 3. Attaches verified payment info to the request for downstream handlers
 *
 * @module server/x402/middleware
 * @see https://eips.ethereum.org/EIPS/eip-3009 - Transfer With Authorization
 */

import type { Response, NextFunction } from 'express';
import {
  type X402Config,
  type X402Request,
  type X402Middleware,
  type X402PaymentHeader,
  type X402HandlerOptions,
  type X402SettlementResponse,
  type SettlementRequest,
  type SettlementResponse,
  createPaymentRequiredResponse,
  headerToPayload,
  validatePaymentPayload,
  createSettlementRequestFromPayload,
  validateSettlementRequest,
  parseSettlementResponse,
  createPaymentInfo,
  validateX402Config,
  setPaymentResponseHeader,
  PAYMENT_PAYLOAD_SCHEMA,
} from './types.js';
import { X402Error, X402ValidationError } from './errors.js';
import { getDefaultNonceStore } from './nonce-store.js';

/**
 * Create x402 Payment Middleware
 *
 * Factory function that creates an Express middleware instance configured
 * for x402 payment processing. The middleware enforces payment requirements
 * on protected routes and settles payments via the x402 facilitator.
 *
 * **Payment Flow:**
 * 1. Client requests protected resource without payment
 * 2. Middleware returns 402 with PaymentRequiredResponse
 * 3. Client signs EIP-3009 authorization and retries with X-Payment header
 * 4. Middleware validates and settles via facilitator
 * 5. On success, request continues with paymentInfo attached
 *
 * @param config - x402 configuration including payTo, amount, token details
 * @returns Configured Express middleware function
 *
 * @example
 * ```typescript
 * const x402 = createX402Middleware({
 *   payTo: process.env.ARCADE_WALLET_ADDRESS!,
 *   paymentAmount: parseUSDC(0.01),
 *   tokenAddress: USDC_CONTRACT_ADDRESS,
 *   tokenName: USDC_NAME,
 *   tokenDecimals: USDC_DECIMALS,
 *   facilitatorUrl: getFacilitatorBaseUrl(),
 *   chainId: CRONOS_TESTNET_CHAIN_ID,
 * });
 *
 * app.post('/api/play/snake', x402, (req: X402Request, res) => {
 *   const { paymentInfo } = req.x402!;
 *   // Start game session with verified payment
 * });
 * ```
 *
 * @throws {Error} If config is invalid
 */
export function createX402Middleware(config: X402Config): X402Middleware {
  // Validate configuration at creation time
  validateX402Config(config);

  // Return the middleware function
  return async function x402Middleware(
    req: X402Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Check for X-Payment header
      const paymentHeader = req.headers['x-payment'] as string | undefined;

      if (!paymentHeader) {
        // Return 402 Payment Required
        const resource = req.path;
        const description = `Pay to access ${resource}`;
        const paymentRequired = createPaymentRequiredResponse(
          config,
          resource,
          description,
        );

        // Encode the payment requirements for X-Payment-Required header
        const encodedRequirements = Buffer.from(
          JSON.stringify(paymentRequired),
        ).toString('base64');

        // Set response headers
        res.setHeader('X-Payment-Required', encodedRequirements);
        res.setHeader('X-Payment-Version', '1');

        res.status(402).json(paymentRequired);
        return;
      }

      // Record when we received the payment
      const receivedAt = new Date();

      // Step 1: Decode base64-encoded X-Payment header
      let decoded: string;
      try {
        decoded = Buffer.from(paymentHeader, 'base64').toString('utf-8');

        // Validate the decoded string looks like JSON (starts with { or [)
        // This helps catch corrupt base64 that decodes to garbage
        if (!decoded.trim().startsWith('{') && !decoded.trim().startsWith('[')) {
          throw new Error('Decoded content is not valid JSON structure');
        }
      } catch (error) {
        // Log malformed base64 payload attempt for security monitoring
        console.warn('[x402] Malformed base64 payload attempt:', {
          headerLength: paymentHeader.length,
          headerPreview: paymentHeader.substring(0, 50) + (paymentHeader.length > 50 ? '...' : ''),
          error: error instanceof Error ? error.message : String(error),
          clientIp: req.ip || req.headers['x-forwarded-for'] || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
          timestamp: new Date().toISOString(),
        });

        throw X402ValidationError.invalidJson(
          `Invalid base64 encoding: ${error instanceof Error ? error.message : 'malformed payload'}. ` +
          'Expected format: base64-encoded JSON string containing x402 payment data',
        );
      }

      // Step 2: Parse the decoded JSON string
      let paymentData: X402PaymentHeader;
      try {
        paymentData = JSON.parse(decoded) as X402PaymentHeader;
      } catch (error) {
        // Log JSON parse failure for debugging
        if (config.debug) {
          console.warn('[x402] JSON parse failure:', {
            decodedPreview: decoded.substring(0, 100) + (decoded.length > 100 ? '...' : ''),
            error: error instanceof Error ? error.message : String(error),
          });
        }

        throw X402Error.invalidJson(
          error instanceof Error ? error.message : 'Invalid JSON structure',
        );
      }

      // Validate protocol version
      if (paymentData.x402Version !== '1') {
        throw X402Error.invalidVersion(paymentData.x402Version || 'missing');
      }

      // Validate payment scheme
      if (paymentData.scheme !== 'exact') {
        throw X402Error.invalidScheme(paymentData.scheme || 'missing');
      }

      // Convert to flat payload for easier validation
      const payload = headerToPayload(paymentData);

      // Validate payload structure
      const validation = validatePaymentPayload(payload);
      if (!validation.valid) {
        // Check for signature-specific errors and log them
        const signatureErrors = validation.errors.filter(
          (err) =>
            err.includes('Invalid v value') ||
            err.includes('Invalid r value') ||
            err.includes('Invalid s value'),
        );

        if (signatureErrors.length > 0) {
          // Log invalid signature attempts for security monitoring
          console.warn('[x402] Invalid signature format detected:', {
            from: payload.from,
            signatureErrors,
            v: payload.v,
            rFormat: payload.r ? `${payload.r.substring(0, 10)}...` : 'missing',
            sFormat: payload.s ? `${payload.s.substring(0, 10)}...` : 'missing',
            timestamp: new Date().toISOString(),
          });
        }

        throw X402Error.invalidPayload(validation.errors);
      }

      // Validate payment amount meets or exceeds requirement
      // Use BigInt comparison for precision - allow overpayment (>=)
      const requiredAmount =
        typeof config.paymentAmount === 'bigint'
          ? config.paymentAmount
          : BigInt(config.paymentAmount);

      const payloadAmount = BigInt(payload.value);

      if (payloadAmount < requiredAmount) {
        throw X402Error.amountMismatch(
          requiredAmount.toString(),
          payload.value,
        );
      }

      // Validate payment recipient matches our configured payTo address
      // Normalize both addresses to checksummed format for consistent comparison
      const normalizedPayloadTo = payload.to.toLowerCase();
      const normalizedConfigPayTo = config.payTo.toLowerCase();

      // Log recipient verification for debugging
      if (config.debug) {
        console.log('[x402] Verifying payment recipient:', {
          payloadTo: payload.to,
          configPayTo: config.payTo,
          normalizedPayloadTo,
          normalizedConfigPayTo,
          matches: normalizedPayloadTo === normalizedConfigPayTo,
        });
      }

      if (normalizedPayloadTo !== normalizedConfigPayTo) {
        // Log recipient mismatch
        console.warn('[x402] Payment recipient mismatch:', {
          expected: config.payTo,
          received: payload.to,
        });
        throw X402ValidationError.recipientMismatch(config.payTo, payload.to);
      }

      // Validate authorization timing with clock skew tolerance
      // Allow 30 seconds of tolerance for clock drift between client and server
      const CLOCK_SKEW_TOLERANCE_SECONDS = 30;
      const now = Math.floor(Date.now() / 1000);
      const validAfter = parseInt(payload.validAfter, 10);
      const validBefore = parseInt(payload.validBefore, 10);

      // Check if authorization is not yet valid (with tolerance)
      if (now + CLOCK_SKEW_TOLERANCE_SECONDS < validAfter) {
        throw X402Error.authorizationNotYetValid(payload.validAfter);
      }

      // Check if authorization has expired (with tolerance)
      if (now - CLOCK_SKEW_TOLERANCE_SECONDS >= validBefore) {
        throw X402Error.authorizationExpired(payload.validBefore);
      }

      // Verify nonce hasn't been used before (replay attack prevention)
      const nonceStore = getDefaultNonceStore();
      const nonceUsed = await nonceStore.isUsed(payload.nonce);
      if (nonceUsed) {
        throw X402Error.nonceAlreadyUsed(payload.nonce);
      }

      // Create settlement request
      const settlementRequest = createSettlementRequestFromPayload(
        payload,
        config,
      );

      // Validate settlement request
      const settlementValidation = validateSettlementRequest(settlementRequest);
      if (!settlementValidation.valid) {
        throw X402Error.invalidPayload(settlementValidation.errors);
      }

      // Settle payment via facilitator
      const settlement = await settlePayment(
        settlementRequest,
        config.facilitatorUrl,
        config.debug,
      );

      // Check if settlement was successful
      if (!settlement.success) {
        // Map facilitator error to X402Error
        if (settlement.errorCode) {
          throw X402Error.fromSettlementErrorCode(
            settlement.errorCode as Parameters<typeof X402Error.fromSettlementErrorCode>[0],
            settlement.errorMessage,
          );
        }
        throw X402Error.facilitatorError(
          settlement.errorMessage || 'Settlement failed',
        );
      }

      // Mark nonce as used after successful settlement
      await nonceStore.markUsed(payload.nonce, {
        from: payload.from,
        transactionHash: settlement.transactionHash,
      });

      // Create verified payment info
      const paymentInfo = createPaymentInfo({
        payload,
        settlement,
        config,
        receivedAt,
      });

      // Attach x402 data to request
      req.x402 = {
        payment: paymentData,
        payload,
        settlement,
        paymentInfo,
        config,
        receivedAt: receivedAt.toISOString(),
      };

      // Set X-Payment-Response header with settlement confirmation
      // This allows clients to access transaction details from the response headers
      const responseHeader = setPaymentResponseHeader(res, settlement, config);

      if (config.debug) {
        console.log('[x402] Set X-Payment-Response header:', {
          transactionHash: settlement.transactionHash,
          blockNumber: settlement.blockNumber,
          encodedLength: responseHeader.length,
        });
      }

      // Continue to next handler
      next();
    } catch (error) {
      // Handle x402 errors
      if (error instanceof X402Error) {
        res.status(error.httpStatus).json(error.toJSON());
        return;
      }

      // Wrap unknown errors
      const wrappedError = X402Error.wrap(error);
      res.status(wrappedError.httpStatus).json(wrappedError.toJSON());
    }
  };
}

/**
 * Check if a settlement response indicates a retryable 5xx error
 *
 * @param statusCode - The HTTP status code
 * @returns true if the status code is a 5xx error that should be retried
 */
function isRetryableStatusCode(statusCode: number): boolean {
  // Only retry on 5xx server errors
  return statusCode >= 500 && statusCode < 600;
}

/**
 * Check if a settlement error is transient and retryable
 *
 * @param error - The error to check
 * @returns true if the error is transient (network/5xx) and should be retried
 */
function isTransientSettlementError(error: Error): boolean {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  // Network errors are retryable
  if (
    message.includes('econnrefused') ||
    message.includes('econnreset') ||
    message.includes('etimedout') ||
    message.includes('enotfound') ||
    message.includes('socket hang up') ||
    message.includes('network error') ||
    message.includes('fetch failed') ||
    (name.includes('typeerror') && message.includes('fetch'))
  ) {
    return true;
  }

  // Timeout errors are retryable
  if (
    message.includes('timeout') ||
    message.includes('timed out') ||
    name.includes('timeout')
  ) {
    return true;
  }

  // 5xx HTTP status codes in error message are retryable
  const statusMatch = message.match(/\bhttp\s*5\d{2}\b/i);
  if (statusMatch) {
    return true;
  }

  // Check for specific 5xx error patterns
  if (
    message.includes('internal server error') ||
    message.includes('bad gateway') ||
    message.includes('service unavailable') ||
    message.includes('gateway timeout')
  ) {
    return true;
  }

  return false;
}

/**
 * Calculate exponential backoff delay with jitter
 *
 * @param attempt - Current attempt number (1-indexed)
 * @param baseDelayMs - Base delay in milliseconds
 * @param maxDelayMs - Maximum delay cap in milliseconds
 * @returns Delay in milliseconds
 */
function calculateBackoff(
  attempt: number,
  baseDelayMs: number = 500,
  maxDelayMs: number = 10000,
): number {
  // Exponential backoff: baseDelay * 2^(attempt-1)
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt - 1);
  // Add jitter (+-10%) to prevent thundering herd
  const jitter = exponentialDelay * (0.1 * (Math.random() * 2 - 1));
  const delay = Math.round(exponentialDelay + jitter);
  return Math.min(delay, maxDelayMs);
}

/**
 * Sleep for the specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Settle a payment via the x402 facilitator with retry logic
 *
 * Sends the signed authorization to the facilitator service for on-chain
 * execution. The facilitator pays gas fees and returns the transaction receipt.
 *
 * Implements exponential backoff retry for transient failures:
 * - Retries on 5xx HTTP errors and network errors only
 * - Maximum 3 retry attempts (4 total including initial)
 * - Total timeout budget of 60 seconds
 * - Exponential backoff starting at 500ms
 *
 * @param request - The settlement request with authorization and signature
 * @param facilitatorUrl - The base URL of the facilitator service
 * @param debug - Whether to log debug information
 * @returns Settlement response with transaction details or error
 */
async function settlePayment(
  request: SettlementRequest,
  facilitatorUrl: string,
  debug?: boolean,
): Promise<X402SettlementResponse> {
  const settleUrl = facilitatorUrl.endsWith('/')
    ? `${facilitatorUrl}v2/x402/settle`
    : `${facilitatorUrl}/v2/x402/settle`;

  // Retry configuration
  const MAX_RETRIES = 3;
  const TOTAL_TIMEOUT_MS = 60000; // 60 seconds total budget
  const REQUEST_TIMEOUT_MS = 30000; // 30 seconds per request
  const BASE_DELAY_MS = 500;
  const MAX_DELAY_MS = 10000;

  if (debug) {
    console.log('[x402] Settling payment:', {
      from: request.authorization.from,
      to: request.authorization.to,
      value: request.authorization.value,
      url: settleUrl,
    });
  }

  const startTime = Date.now();
  let lastError: Error | undefined;
  let attempt = 0;

  while (attempt <= MAX_RETRIES) {
    attempt++;
    const elapsedMs = Date.now() - startTime;
    const remainingTimeoutMs = TOTAL_TIMEOUT_MS - elapsedMs;

    // Check if we've exceeded the total timeout budget
    if (remainingTimeoutMs <= 0) {
      if (debug) {
        console.log(
          `[x402] Timeout budget exhausted after ${elapsedMs}ms (${attempt - 1} attempts)`,
        );
      }
      throw X402Error.timeout(TOTAL_TIMEOUT_MS);
    }

    try {
      if (debug && attempt > 1) {
        console.log(
          `[x402] Retry attempt ${attempt}/${MAX_RETRIES + 1}, elapsed: ${elapsedMs}ms`,
        );
      }

      // Create abort controller for request timeout (30 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      let response: Response;
      try {
        response = await fetch(settleUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(request),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      // Check if this is a retryable 5xx error
      if (isRetryableStatusCode(response.status)) {
        const statusError = new Error(
          `HTTP ${response.status}: ${response.statusText}`,
        );

        // Check if we should retry
        if (attempt <= MAX_RETRIES) {
          const delay = calculateBackoff(attempt, BASE_DELAY_MS, MAX_DELAY_MS);
          const effectiveDelay = Math.min(delay, remainingTimeoutMs - 100);

          if (effectiveDelay > 0) {
            if (debug) {
              console.log(
                `[x402] Retry ${attempt}: ${response.status} error, waiting ${effectiveDelay}ms before retry`,
              );
            }
            lastError = statusError;
            await sleep(effectiveDelay);
            continue;
          }
        }

        // No more retries or no time left
        throw X402Error.facilitatorError(
          `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      // For 4xx errors, don't retry but parse the error response
      if (!response.ok) {
        let errorData: SettlementResponse;
        try {
          errorData = (await response.json()) as SettlementResponse;
        } catch {
          throw X402Error.facilitatorError(
            `HTTP ${response.status}: ${response.statusText}`,
          );
        }

        return parseSettlementResponse(errorData);
      }

      // Success
      const data = (await response.json()) as SettlementResponse;

      if (debug) {
        console.log('[x402] Settlement response:', data);
        if (attempt > 1) {
          console.log(
            `[x402] Success after ${attempt} attempts, total time: ${Date.now() - startTime}ms`,
          );
        }
      }

      return parseSettlementResponse(data);
    } catch (error) {
      // Don't retry X402Errors (they're already processed errors)
      if (error instanceof X402Error) {
        throw error;
      }

      const err = error instanceof Error ? error : new Error(String(error));
      lastError = err;

      // Check if this is a transient error that should be retried
      if (attempt <= MAX_RETRIES && isTransientSettlementError(err)) {
        const delay = calculateBackoff(attempt, BASE_DELAY_MS, MAX_DELAY_MS);
        const remainingAfterError = TOTAL_TIMEOUT_MS - (Date.now() - startTime);
        const effectiveDelay = Math.min(delay, remainingAfterError - 100);

        if (effectiveDelay > 0) {
          if (debug) {
            console.log(
              `[x402] Retry ${attempt}: ${err.message}, waiting ${effectiveDelay}ms before retry`,
            );
          }
          await sleep(effectiveDelay);
          continue;
        }
      }

      // Not retryable or no retries left
      if (error instanceof TypeError && err.message.includes('fetch')) {
        throw X402Error.networkError(err.message);
      }

      throw X402Error.facilitatorError(err.message);
    }
  }

  // Should not reach here, but handle it gracefully
  throw X402Error.facilitatorError(
    lastError?.message || 'Max retries exceeded',
  );
}

/**
 * Create x402 middleware with route-specific options
 *
 * Creates a middleware that combines global config with per-route overrides.
 * Useful for routes that need different payment amounts or validation.
 *
 * @param config - Base x402 configuration
 * @param options - Route-specific options to merge
 * @returns Configured Express middleware
 *
 * @example
 * ```typescript
 * const baseConfig = createDefaultX402Config(ARCADE_WALLET, parseUSDC(0.01));
 *
 * // Premium game with higher price
 * app.post('/api/play/tetris', createX402MiddlewareWithOptions(baseConfig, {
 *   paymentAmount: parseUSDC(0.02),
 *   description: 'Pay $0.02 to play Tetris',
 *   onSettlement: async (settlement) => {
 *     await recordPayment(settlement);
 *   }
 * }), gameHandler);
 * ```
 */
export function createX402MiddlewareWithOptions(
  config: X402Config,
  options: X402HandlerOptions,
): X402Middleware {
  // Merge config with options
  const mergedConfig: X402Config = {
    ...config,
    paymentAmount: options.paymentAmount ?? config.paymentAmount,
  };

  // Create base middleware
  const baseMiddleware = createX402Middleware(mergedConfig);

  // Wrap with options handling
  return async function x402MiddlewareWithOptions(
    req: X402Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    // If skipSettlement is enabled, just validate and skip
    if (options.skipSettlement) {
      const paymentHeader = req.headers['x-payment'] as string | undefined;

      if (!paymentHeader) {
        const resource = options.resource || req.path;
        const description =
          options.description || `Pay to access ${resource}`;
        const paymentRequired = createPaymentRequiredResponse(
          mergedConfig,
          resource,
          description,
        );
        res.status(402).json(paymentRequired);
        return;
      }

      // Parse and validate but don't settle
      try {
        const decoded = Buffer.from(paymentHeader, 'base64').toString('utf-8');
        const paymentData = JSON.parse(decoded) as X402PaymentHeader;
        const payload = headerToPayload(paymentData);

        // Custom validation if provided
        if (options.validatePayment) {
          const isValid = await options.validatePayment(paymentData);
          if (!isValid) {
            throw X402Error.invalidPayload(['Custom validation failed']);
          }
        }

        // Attach to request without settlement
        req.x402 = {
          payment: paymentData,
          payload,
          config: mergedConfig,
          receivedAt: new Date().toISOString(),
        };

        next();
      } catch (error) {
        if (error instanceof X402Error) {
          res.status(error.httpStatus).json(error.toJSON());
          return;
        }
        const wrapped = X402Error.wrap(error);
        res.status(wrapped.httpStatus).json(wrapped.toJSON());
      }
      return;
    }

    // Use base middleware for standard flow
    await baseMiddleware(req, res, async (err?: unknown) => {
      if (err) {
        next(err);
        return;
      }

      // Call onSettlement callback if provided
      if (options.onSettlement && req.x402?.settlement) {
        try {
          await options.onSettlement(req.x402.settlement, req);
        } catch (error) {
          console.error('[x402] onSettlement callback error:', error);
          // Don't fail the request, just log the error
        }
      }

      next();
    });
  };
}

/**
 * Create a minimal x402 middleware that only checks for payment header
 *
 * Useful for development/testing where you want to skip actual settlement
 * but still verify the payment header structure.
 *
 * @param config - x402 configuration for 402 response generation
 * @returns Middleware that validates but doesn't settle
 */
export function createX402MockMiddleware(config: X402Config): X402Middleware {
  validateX402Config(config);

  return async function x402MockMiddleware(
    req: X402Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const paymentHeader = req.headers['x-payment'] as string | undefined;

    if (!paymentHeader) {
      const paymentRequired = createPaymentRequiredResponse(
        config,
        req.path,
        `[MOCK] Pay to access ${req.path}`,
      );
      res.status(402).json(paymentRequired);
      return;
    }

    try {
      const decoded = Buffer.from(paymentHeader, 'base64').toString('utf-8');
      const paymentData = JSON.parse(decoded) as X402PaymentHeader;
      const payload = headerToPayload(paymentData);

      // Validate structure only
      const validation = validatePaymentPayload(payload);
      if (!validation.valid) {
        throw X402Error.invalidPayload(validation.errors);
      }

      // Create mock settlement response
      const mockSettlement: X402SettlementResponse = {
        success: true,
        transactionHash: '0x' + 'mock'.repeat(16),
        blockNumber: 12345678,
        settledAt: new Date().toISOString(),
      };

      req.x402 = {
        payment: paymentData,
        payload,
        settlement: mockSettlement,
        paymentInfo: createPaymentInfo({
          payload,
          settlement: mockSettlement,
          config,
        }),
        config,
        receivedAt: new Date().toISOString(),
      };

      // Set X-Payment-Response header for mock settlement too
      setPaymentResponseHeader(res, mockSettlement, config);

      next();
    } catch (error) {
      if (error instanceof X402Error) {
        res.status(error.httpStatus).json(error.toJSON());
        return;
      }
      const wrapped = X402Error.wrap(error);
      res.status(wrapped.httpStatus).json(wrapped.toJSON());
    }
  };
}

/**
 * Type guard to check if request has x402 payment info
 *
 * @param req - Express request to check
 * @returns True if request has verified payment info
 */
export function hasPaymentInfo(
  req: X402Request,
): req is X402Request & { x402: NonNullable<X402Request['x402']> } {
  return req.x402 !== undefined && req.x402.paymentInfo !== undefined;
}

/**
 * Extract payment info from request or throw
 *
 * Utility function for route handlers to get payment info
 * with guaranteed type safety.
 *
 * @param req - X402Request to extract payment info from
 * @returns Payment info
 * @throws {X402Error} If payment info is not present
 */
export function getPaymentInfo(req: X402Request) {
  if (!req.x402?.paymentInfo) {
    throw X402Error.internalError(
      'Payment info not found on request - ensure x402 middleware ran',
    );
  }
  return req.x402.paymentInfo;
}
