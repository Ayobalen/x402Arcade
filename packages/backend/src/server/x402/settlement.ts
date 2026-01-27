/**
 * x402 Facilitator Settlement Request
 *
 * Handles sending validated payment authorizations to the x402 facilitator
 * for on-chain settlement. This module provides a reusable, standalone
 * settlement request function that can be used by the middleware or
 * called directly for custom payment flows.
 *
 * @module server/x402/settlement
 * @see https://facilitator.cronoslabs.org/docs - Facilitator API Documentation
 * @see https://eips.ethereum.org/EIPS/eip-3009 - Transfer With Authorization
 */

import type {
  SettlementRequest,
  SettlementResponse,
  X402Config,
  PaymentPayload,
} from './types.js';
import { createSettlementRequestFromPayload, validateSettlementRequest } from './types.js';
import { X402Error } from './errors.js';

/**
 * Settlement request timeout in milliseconds
 *
 * The maximum time to wait for a response from the facilitator.
 * Set to 30 seconds as a reasonable balance between allowing
 * time for blockchain confirmation and responsiveness.
 */
export const SETTLEMENT_REQUEST_TIMEOUT_MS = 30000;

/**
 * Settlement Request Options
 *
 * Configuration options for making a settlement request to the facilitator.
 */
export interface SettlementRequestOptions {
  /**
   * The base URL of the facilitator service
   * @example 'https://facilitator.cronoslabs.org'
   */
  facilitatorUrl: string;

  /**
   * Optional timeout in milliseconds
   * @default 30000 (30 seconds)
   */
  timeoutMs?: number;

  /**
   * Optional Authorization header value
   * Required by some facilitator configurations
   * @example 'Bearer your-api-key'
   */
  authorization?: string;

  /**
   * Optional additional headers to include in the request
   */
  additionalHeaders?: Record<string, string>;

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;
}

/**
 * Settlement Raw Response
 *
 * The raw response from the facilitator settle endpoint.
 * This preserves the complete response for processing by the caller.
 */
export interface SettlementRawResponse {
  /**
   * The HTTP status code from the facilitator
   */
  status: number;

  /**
   * The HTTP status text from the facilitator
   */
  statusText: string;

  /**
   * Whether the HTTP request was successful (2xx status)
   */
  ok: boolean;

  /**
   * The parsed JSON response body
   * Contains SettlementResponse structure on success,
   * or error details on failure
   */
  data: SettlementResponse | Record<string, unknown>;

  /**
   * The raw response headers
   */
  headers: Record<string, string>;

  /**
   * Time taken for the request in milliseconds
   */
  requestTimeMs: number;
}

/**
 * Build the facilitator settle endpoint URL
 *
 * Constructs the full URL for the settlement endpoint from the base URL.
 *
 * @param facilitatorUrl - The base URL of the facilitator service
 * @returns Full URL for the settle endpoint
 *
 * @example
 * buildSettleUrl('https://facilitator.cronoslabs.org')
 * // => 'https://facilitator.cronoslabs.org/v2/x402/settle'
 */
export function buildSettleUrl(facilitatorUrl: string): string {
  // Remove trailing slash if present
  const baseUrl = facilitatorUrl.replace(/\/$/, '');
  return `${baseUrl}/v2/x402/settle`;
}

/**
 * Construct a SettlementRequest from payment payload and config
 *
 * Creates a properly formatted settlement request object ready to be
 * sent to the facilitator API.
 *
 * @param payload - The validated payment payload from X-Payment header
 * @param config - The x402 configuration containing chain and token details
 * @returns Constructed SettlementRequest object
 *
 * @example
 * ```typescript
 * const payload = headerToPayload(parsedHeader);
 * const request = constructSettlementRequest(payload, x402Config);
 * ```
 */
export function constructSettlementRequest(
  payload: PaymentPayload,
  config: Pick<X402Config, 'chainId' | 'tokenAddress'>,
  paymentHeader?: string,
  resource?: string,
): SettlementRequest {
  return createSettlementRequestFromPayload(
    payload,
    config as X402Config,
    paymentHeader || '',
    resource || '/unknown',
  );
}

/**
 * Send a settlement request to the facilitator
 *
 * Makes a POST request to the facilitator's settle endpoint with the
 * signed authorization. Returns the raw response for processing by the caller.
 *
 * **Request Flow:**
 * 1. Validate the settlement request structure
 * 2. Construct the full endpoint URL
 * 3. Set appropriate headers (Content-Type, Accept, Authorization if provided)
 * 4. Send POST request with 30 second timeout
 * 5. Return raw response for processing
 *
 * **Headers Set:**
 * - Content-Type: application/json
 * - Accept: application/json
 * - Authorization: (if provided in options)
 * - Any additional headers from options
 *
 * @param request - The settlement request with authorization and signature
 * @param options - Request configuration options
 * @returns Raw response from the facilitator
 * @throws {X402Error} On network errors or timeout
 *
 * @example
 * ```typescript
 * const response = await sendSettlementRequest(settlementRequest, {
 *   facilitatorUrl: 'https://facilitator.cronoslabs.org',
 *   authorization: 'Bearer api-key',
 *   timeoutMs: 30000,
 *   debug: true,
 * });
 *
 * if (response.ok && response.data.success) {
 *   console.log('Settlement successful:', response.data.transaction);
 * } else {
 *   console.error('Settlement failed:', response.data.error);
 * }
 * ```
 */
export async function sendSettlementRequest(
  request: SettlementRequest,
  options: SettlementRequestOptions,
): Promise<SettlementRawResponse> {
  const {
    facilitatorUrl,
    timeoutMs = SETTLEMENT_REQUEST_TIMEOUT_MS,
    authorization,
    additionalHeaders = {},
    debug = false,
  } = options;

  // Validate the settlement request before sending
  const validation = validateSettlementRequest(request);
  if (!validation.valid) {
    throw X402Error.invalidPayload(validation.errors);
  }

  // Build the settle endpoint URL
  const settleUrl = buildSettleUrl(facilitatorUrl);

  // Construct headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...additionalHeaders,
  };

  // Add Authorization header if provided
  if (authorization) {
    headers['Authorization'] = authorization;
  }

  if (debug) {
    console.log('[x402-settlement] Sending settlement request:', {
      url: settleUrl,
      from: request.authorization.from,
      to: request.authorization.to,
      value: request.authorization.value,
      chainId: request.chainId,
      tokenAddress: request.tokenAddress,
      timeout: timeoutMs,
      hasAuth: !!authorization,
    });
  }

  const startTime = Date.now();

  // Create abort controller for timeout (30 seconds default)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(settleUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const requestTimeMs = Date.now() - startTime;

    // Extract response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // Parse response body
    let data: SettlementResponse | Record<string, unknown>;
    try {
      data = (await response.json()) as SettlementResponse | Record<string, unknown>;
    } catch {
      // If JSON parsing fails, create an error response
      data = {
        success: false,
        error: {
          code: 'INVALID_RESPONSE',
          message: `Invalid JSON response from facilitator: ${response.statusText}`,
        },
      };
    }

    if (debug) {
      console.log('[x402-settlement] Received response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        requestTimeMs,
        data,
      });
    }

    return {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      data,
      headers: responseHeaders,
      requestTimeMs,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    const requestTimeMs = Date.now() - startTime;

    if (debug) {
      console.error('[x402-settlement] Request failed:', {
        error: error instanceof Error ? error.message : String(error),
        requestTimeMs,
      });
    }

    // Handle abort (timeout) error
    if (error instanceof Error && error.name === 'AbortError') {
      throw X402Error.timeout(timeoutMs);
    }

    // Handle network errors
    if (error instanceof TypeError && String(error).includes('fetch')) {
      throw X402Error.networkError(error.message);
    }

    // Re-throw other errors wrapped as facilitator error
    throw X402Error.facilitatorError(
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Settle a payment via the facilitator (convenience function)
 *
 * High-level function that constructs the settlement request from a payment
 * payload and sends it to the facilitator. Returns the raw response.
 *
 * This is a convenience wrapper that combines:
 * 1. constructSettlementRequest()
 * 2. sendSettlementRequest()
 *
 * @param payload - The validated payment payload from X-Payment header
 * @param config - The x402 configuration
 * @param options - Optional request configuration overrides
 * @returns Raw response from the facilitator
 *
 * @example
 * ```typescript
 * const response = await settlePaymentRequest(payload, x402Config, {
 *   debug: true,
 * });
 *
 * if (response.ok && response.data.success) {
 *   const { transactionHash, blockNumber } = response.data.transaction;
 *   console.log(`Payment settled: ${transactionHash}`);
 * }
 * ```
 */
export async function settlePaymentRequest(
  payload: PaymentPayload,
  config: X402Config,
  options?: Partial<Omit<SettlementRequestOptions, 'facilitatorUrl'>>,
): Promise<SettlementRawResponse> {
  // Construct the settlement request from payload and config
  const settlementRequest = constructSettlementRequest(payload, config);

  // Send the request to the facilitator
  return sendSettlementRequest(settlementRequest, {
    facilitatorUrl: config.facilitatorUrl,
    debug: config.debug,
    ...options,
  });
}

/**
 * Check if a settlement response indicates success
 *
 * Type guard to check if the response data is a successful settlement.
 *
 * @param response - The raw settlement response
 * @returns true if settlement was successful
 *
 * @example
 * ```typescript
 * const response = await sendSettlementRequest(request, options);
 * if (isSettlementSuccess(response)) {
 *   const txHash = response.data.transaction.hash;
 * }
 * ```
 */
export function isSettlementSuccess(
  response: SettlementRawResponse,
): response is SettlementRawResponse & {
  data: SettlementResponse & { success: true; transaction: { hash: string; blockNumber: number } };
} {
  return (
    response.ok &&
    'success' in response.data &&
    response.data.success === true &&
    'transaction' in response.data &&
    response.data.transaction !== undefined
  );
}

/**
 * Extract error details from a settlement response
 *
 * Helper to extract error code and message from a failed settlement response.
 *
 * @param response - The raw settlement response
 * @returns Error details or undefined if no error
 *
 * @example
 * ```typescript
 * const response = await sendSettlementRequest(request, options);
 * if (!response.ok) {
 *   const error = extractSettlementError(response);
 *   console.error(`Settlement failed: ${error?.code} - ${error?.message}`);
 * }
 * ```
 */
export function extractSettlementError(
  response: SettlementRawResponse,
): { code: string; message: string } | undefined {
  if ('error' in response.data && response.data.error) {
    const error = response.data.error as { code?: string; message?: string };
    return {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'Unknown settlement error',
    };
  }

  // If response is not ok but no error object, create generic error
  if (!response.ok) {
    return {
      code: `HTTP_${response.status}`,
      message: response.statusText || `HTTP ${response.status} error`,
    };
  }

  return undefined;
}
