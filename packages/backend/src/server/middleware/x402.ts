/**
 * x402 Payment Middleware
 *
 * Express middleware that implements the x402 HTTP Payment Protocol for
 * gasless micropayments using EIP-3009 signed authorizations.
 *
 * ## Overview
 *
 * The x402 protocol enables HTTP-native payments where:
 * 1. Client requests a protected resource
 * 2. Server responds with 402 Payment Required + payment requirements
 * 3. Client signs an EIP-3009 authorization and sends in X-Payment header
 * 4. Server verifies and settles via the facilitator
 * 5. Client receives the requested resource
 *
 * ## Usage
 *
 * ```typescript
 * import { createX402Middleware } from './middleware/x402.js';
 * import { parseUSDC } from '../lib/chain/constants.js';
 *
 * // Create the middleware with configuration
 * const x402 = createX402Middleware({
 *   payTo: process.env.ARCADE_WALLET_ADDRESS!,
 *   paymentAmount: parseUSDC(0.01), // $0.01 USDC
 *   tokenAddress: '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0',
 *   tokenName: 'Bridged USDC (Stargate)',
 *   tokenDecimals: 6,
 *   facilitatorUrl: 'https://facilitator.cronoslabs.org',
 *   chainId: 338,
 * });
 *
 * // Apply to protected routes
 * app.post('/api/play/snake', x402, (req, res) => {
 *   // Payment has been verified and settled
 *   const { paymentInfo } = req.x402!;
 *   console.log(`Player ${paymentInfo.payer} paid ${paymentInfo.amountUsdc}`);
 *
 *   // Start game session
 *   res.json({ sessionId: createGameSession(paymentInfo) });
 * });
 * ```
 *
 * ## Payment Flow
 *
 * 1. **No X-Payment header**: Returns 402 with payment requirements
 * 2. **Valid X-Payment header**:
 *    - Decodes and validates the payment header
 *    - Verifies authorization timestamps and amounts
 *    - Settles with the facilitator
 *    - Attaches payment info to request and calls next()
 * 3. **Invalid header**: Returns appropriate error (400/401/502)
 *
 * ## Error Handling
 *
 * The middleware uses X402Error, X402ValidationError, and X402SettlementError
 * for structured error handling:
 *
 * - **402 Payment Required**: No payment header, or payment needed
 * - **400 Bad Request**: Invalid payment header or validation failed
 * - **502 Bad Gateway**: Facilitator settlement failed
 * - **504 Gateway Timeout**: Facilitator request timed out
 *
 * @module server/middleware/x402
 * @see https://eips.ethereum.org/EIPS/eip-3009 - Transfer With Authorization
 */

import type { Response, NextFunction } from 'express';
import type {
  X402Config,
  X402Request,
  X402Middleware,
  X402HandlerOptions,
  X402PaymentHeader,
  PaymentPayload,
  PaymentRequiredResponse,
  SettlementResponse,
} from '../x402/types.js';
import {
  createDefaultX402Config,
  validateX402Config,
  createPaymentRequiredResponse,
  headerToPayload,
  validatePaymentPayload,
  createSettlementRequestFromPayload,
  parseSettlementResponse,
  createPaymentInfo,
  isSuccessfulSettlement,
} from '../x402/types.js';
import { X402Error, X402ValidationError, X402SettlementError } from '../x402/errors.js';
import { getFacilitatorSettleUrl } from '../../lib/chain/constants.js';
import { getDefaultNonceStore } from '../x402/nonce-store.js';

/**
 * Create an x402 payment middleware instance
 *
 * Returns an Express middleware that enforces x402 payment requirements.
 * Configure with your arcade wallet address, payment amount, and chain settings.
 *
 * @param config - x402 middleware configuration
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * const x402 = createX402Middleware({
 *   payTo: '0x1234567890abcdef1234567890abcdef12345678',
 *   paymentAmount: 10000n, // $0.01 in USDC smallest units
 *   tokenAddress: USDC_CONTRACT_ADDRESS,
 *   tokenName: USDC_NAME,
 *   tokenDecimals: USDC_DECIMALS,
 *   facilitatorUrl: getFacilitatorBaseUrl(),
 *   chainId: CRONOS_TESTNET_CHAIN_ID,
 * });
 *
 * app.post('/api/play/:game', x402, gameController);
 * ```
 */
export function createX402Middleware(config: X402Config): X402Middleware {
  // Validate configuration at creation time
  validateX402Config(config);

  return async (req: X402Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const receivedAt = new Date();

      // Check for X-Payment header
      const paymentHeader = req.headers['x-payment'] as string | undefined;

      if (!paymentHeader) {
        // No payment header - return 402 Payment Required
        const paymentRequired = createPaymentRequiredResponse(
          config,
          req.path,
          `Pay to access ${req.path}`
        );

        // Encode the payment requirements for X-Payment-Required header
        const encodedRequirements = Buffer.from(JSON.stringify(paymentRequired)).toString('base64');

        // Set response headers
        res.setHeader('X-Payment-Required', encodedRequirements);
        res.setHeader('X-Payment-Version', '1');

        res.status(402).json(paymentRequired);
        return;
      }

      // Decode and parse the payment header
      const payment = decodePaymentHeader(paymentHeader);

      // Convert to flat payload for easier processing
      const payload = headerToPayload(payment);

      // Validate the payment payload
      const validation = validatePaymentPayload(payload);
      if (!validation.valid) {
        throw X402ValidationError.fromMultipleErrors(validation.errors);
      }

      // Verify payment amount meets or exceeds required amount
      // Use BigInt comparison for precision - overpayment is allowed
      const requiredAmount =
        typeof config.paymentAmount === 'bigint'
          ? config.paymentAmount
          : BigInt(config.paymentAmount);

      const paidAmount = BigInt(payload.value);

      if (paidAmount < requiredAmount) {
        throw X402ValidationError.amountMismatch(requiredAmount.toString(), payload.value, {
          currency: 'USDC',
          minAmount: requiredAmount.toString(),
        });
      }

      // Verify payment recipient matches configuration
      if (payload.to.toLowerCase() !== config.payTo.toLowerCase()) {
        throw X402ValidationError.recipientMismatch(config.payTo, payload.to);
      }

      // Verify authorization timestamps with clock skew tolerance
      // Allow 30 seconds of tolerance for clock drift between client and server
      const CLOCK_SKEW_TOLERANCE_SECONDS = 30;
      const now = Math.floor(Date.now() / 1000);
      const validAfter = parseInt(payload.validAfter, 10);
      const validBefore = parseInt(payload.validBefore, 10);

      // Check if authorization is not yet valid (with tolerance for slightly early timestamps)
      // now + tolerance >= validAfter means authorization is valid
      if (now + CLOCK_SKEW_TOLERANCE_SECONDS < validAfter) {
        throw X402ValidationError.authorizationNotYetValid(payload.validAfter, now);
      }

      // Check if authorization has expired (with tolerance for slightly late timestamps)
      // now - tolerance < validBefore means authorization is still valid
      if (now - CLOCK_SKEW_TOLERANCE_SECONDS >= validBefore) {
        throw X402ValidationError.authorizationExpired(payload.validBefore, now);
      }

      // Verify nonce hasn't been used before (replay attack prevention)
      const nonceStore = getDefaultNonceStore();
      const nonceUsed = await nonceStore.isUsed(payload.nonce);
      if (nonceUsed) {
        throw X402Error.nonceAlreadyUsed(payload.nonce);
      }

      // Create settlement request with original payment header and resource path
      const settlementRequest = createSettlementRequestFromPayload(
        payload,
        config,
        paymentHeader,
        req.path
      );

      // Bug #3 fix: Verify payment first before settling
      const verifyResponse = await verifyWithFacilitator(settlementRequest, config);

      if (!verifyResponse.isValid) {
        throw X402ValidationError.signatureInvalid(
          verifyResponse.invalidReason || 'Payment verification failed'
        );
      }

      // Settle with the facilitator
      const settlementResponse = await settleWithFacilitator(settlementRequest, config);

      // Check if settlement was successful
      if (!isSuccessfulSettlement(settlementResponse)) {
        throw X402SettlementError.facilitatorRejection({
          errorCode: settlementResponse.errorCode,
          errorMessage: settlementResponse.errorMessage,
        });
      }

      // Mark nonce as used after successful settlement
      await nonceStore.markUsed(payload.nonce, {
        from: payload.from,
        transactionHash: settlementResponse.transactionHash,
      });

      // Create payment info for downstream handlers
      const paymentInfo = createPaymentInfo({
        payload,
        settlement: settlementResponse,
        config,
        receivedAt,
      });

      // Attach payment context to request
      req.x402 = {
        payment,
        payload,
        settlement: settlementResponse,
        paymentInfo,
        config,
        receivedAt: receivedAt.toISOString(),
      };

      // Continue to route handler
      next();
    } catch (error) {
      // Handle known x402 errors
      if (error instanceof X402SettlementError) {
        res.status(error.httpStatus).json(error.toJSON());
        return;
      }

      if (error instanceof X402ValidationError) {
        res.status(error.httpStatus).json(error.toJSON());
        return;
      }

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
 * Convert URL-safe base64 to standard base64
 *
 * URL-safe base64 uses '-' instead of '+' and '_' instead of '/'
 * and may omit padding '=' characters.
 *
 * @param urlSafeBase64 - The URL-safe base64 string
 * @returns Standard base64 string
 */
function urlSafeBase64ToStandard(urlSafeBase64: string): string {
  // Replace URL-safe characters with standard base64 characters
  let standardBase64 = urlSafeBase64.replace(/-/g, '+').replace(/_/g, '/');

  // Add padding if needed
  const padding = standardBase64.length % 4;
  if (padding) {
    standardBase64 += '='.repeat(4 - padding);
  }

  return standardBase64;
}

/**
 * Decode the X-Payment header from base64 JSON
 *
 * Handles both standard base64 and URL-safe base64 encoding.
 *
 * @param header - The base64-encoded X-Payment header value
 * @returns Decoded X402PaymentHeader object
 * @throws X402ValidationError if the header cannot be decoded
 */
function decodePaymentHeader(header: string): X402PaymentHeader {
  try {
    // Detect if the header is URL-safe base64 (contains - or _)
    const isUrlSafe = /-|_/.test(header);
    const base64String = isUrlSafe ? urlSafeBase64ToStandard(header) : header;

    const decoded = Buffer.from(base64String, 'base64').toString('utf-8');
    const payment = JSON.parse(decoded) as X402PaymentHeader;

    // Basic structure validation
    if (payment.x402Version !== '1') {
      throw X402ValidationError.versionMismatch(String(payment.x402Version));
    }

    if (payment.scheme !== 'exact') {
      throw X402ValidationError.schemeMismatch(String(payment.scheme));
    }

    // Bug #1 fix: Accept new flat structure (no message wrapper)
    if (!payment.payload) {
      throw X402ValidationError.missingField('payload');
    }

    // Validate required fields in flat structure
    if (!payment.payload.from || !payment.payload.to || !payment.payload.value) {
      throw X402ValidationError.missingField('payload fields (from/to/value)');
    }

    return payment;
  } catch (error) {
    if (error instanceof X402ValidationError) {
      throw error;
    }

    if (error instanceof SyntaxError) {
      throw X402ValidationError.invalidJson(error.message);
    }

    throw X402ValidationError.invalidJson(
      error instanceof Error ? error.message : 'Unknown parse error'
    );
  }
}

/**
 * Verify payment with the facilitator (Bug #3 fix)
 *
 * @param request - The settlement request
 * @param config - The x402 configuration
 * @returns Verify response from facilitator
 * @throws X402SettlementError if verification fails
 */
async function verifyWithFacilitator(
  request: ReturnType<typeof createSettlementRequestFromPayload>,
  config: X402Config
): Promise<{ isValid: boolean; invalidReason?: string }> {
  const verifyUrl = config.facilitatorUrl
    ? `${config.facilitatorUrl}/v2/x402/verify`
    : `${getFacilitatorSettleUrl().replace('/settle', '/verify')}`;
  const startTime = Date.now();

  try {
    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X402-Version': '1',
      },
      body: JSON.stringify(request),
    });

    const body = (await response.json()) as { isValid: boolean; invalidReason?: string };

    if (!response.ok) {
      const requestDurationMs = Date.now() - startTime;
      throw X402SettlementError.fromHttpResponse(
        response.status,
        body,
        undefined,
        requestDurationMs
      );
    }

    return body;
  } catch (error) {
    if (error instanceof X402SettlementError) {
      throw error;
    }

    throw X402SettlementError.fromError(error);
  }
}

/**
 * Settle payment with the facilitator
 *
 * @param request - The settlement request
 * @param config - The x402 configuration
 * @returns Settlement response from facilitator
 * @throws X402SettlementError if settlement fails
 */
async function settleWithFacilitator(
  request: ReturnType<typeof createSettlementRequestFromPayload>,
  config: X402Config
): Promise<ReturnType<typeof parseSettlementResponse>> {
  // Use config.facilitatorUrl if provided, otherwise default
  const settleUrl = config.facilitatorUrl
    ? `${config.facilitatorUrl}/v2/x402/settle`
    : getFacilitatorSettleUrl();
  const startTime = Date.now();

  try {
    const response = await fetch(settleUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X402-Version': '1',
      },
      body: JSON.stringify(request),
    });

    const requestDurationMs = Date.now() - startTime;
    const body = (await response.json()) as SettlementResponse;

    if (!response.ok) {
      throw X402SettlementError.fromHttpResponse(
        response.status,
        body,
        undefined,
        requestDurationMs
      );
    }

    return parseSettlementResponse(body);
  } catch (error) {
    if (error instanceof X402SettlementError) {
      throw error;
    }

    throw X402SettlementError.fromError(error);
  }
}

/**
 * Create an x402 middleware with custom per-route options
 *
 * Allows overriding configuration for specific routes while
 * using a shared base configuration.
 *
 * @param baseConfig - Base x402 configuration
 * @param options - Per-route options
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * const x402Base = createDefaultX402Config(arcadeWallet, parseUSDC(0.01));
 *
 * // Snake costs $0.01
 * app.post('/api/play/snake',
 *   createX402WithOptions(x402Base, { description: 'Play Snake' }),
 *   snakeController
 * );
 *
 * // Tetris costs $0.02
 * app.post('/api/play/tetris',
 *   createX402WithOptions(x402Base, {
 *     paymentAmount: parseUSDC(0.02),
 *     description: 'Play Tetris'
 *   }),
 *   tetrisController
 * );
 * ```
 */
export function createX402WithOptions(
  baseConfig: X402Config,
  options: X402HandlerOptions
): X402Middleware {
  const config: X402Config = {
    ...baseConfig,
    ...(options.paymentAmount !== undefined && { paymentAmount: options.paymentAmount }),
  };

  // Validate merged configuration
  validateX402Config(config);

  return createX402Middleware(config);
}

/**
 * Create a default x402 middleware for Cronos Testnet
 *
 * Convenience function that uses default chain configuration.
 *
 * @param payTo - The wallet address to receive payments
 * @param paymentAmount - The payment amount in smallest units
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * const x402 = createDefaultX402(
 *   process.env.ARCADE_WALLET!,
 *   parseUSDC(0.01)
 * );
 *
 * app.post('/api/play', x402, gameController);
 * ```
 */
export function createDefaultX402(payTo: string, paymentAmount: bigint | string): X402Middleware {
  const config = createDefaultX402Config(payTo, paymentAmount);
  return createX402Middleware(config);
}

// Re-export types for convenience
export type {
  X402Config,
  X402Request,
  X402Middleware,
  X402HandlerOptions,
  X402PaymentHeader,
  PaymentPayload,
  PaymentRequiredResponse,
};
