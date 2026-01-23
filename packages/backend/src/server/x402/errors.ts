/**
 * x402 Payment Error Classes
 *
 * Custom error classes for handling x402 payment processing errors.
 * These errors provide structured error information for both internal
 * handling and HTTP response generation.
 *
 * @module server/x402/errors
 */

import type { X402ValidationErrorCode, X402SettlementErrorCode } from './types.js';

/**
 * Standard x402 error codes
 *
 * Combined codes from validation and settlement phases.
 */
export type X402ErrorCode = X402ValidationErrorCode | X402SettlementErrorCode | 'INTERNAL_ERROR';

/**
 * X402Error - Base error class for x402 payment errors
 *
 * A custom error class that provides structured error information
 * including error codes and HTTP status codes for proper response handling.
 *
 * @example
 * ```typescript
 * // Throw a generic x402 error
 * throw new X402Error('Payment validation failed', 'INVALID_PAYLOAD', 400);
 *
 * // Use factory methods for common errors
 * throw X402Error.paymentRequired('USDC payment required to play');
 * throw X402Error.invalidSignature();
 * throw X402Error.insufficientBalance('0x1234...5678');
 *
 * // In error handler
 * app.use((err, req, res, next) => {
 *   if (err instanceof X402Error) {
 *     return res.status(err.httpStatus).json(err.toJSON());
 *   }
 *   next(err);
 * });
 * ```
 */
export class X402Error extends Error {
  /**
   * Machine-readable error code for programmatic handling
   */
  public readonly errorCode: X402ErrorCode;

  /**
   * HTTP status code to return in the response
   */
  public readonly httpStatus: number;

  /**
   * Additional error details for debugging
   */
  public readonly details?: Record<string, unknown>;

  /**
   * ISO timestamp when the error occurred
   */
  public readonly timestamp: string;

  /**
   * Create a new X402Error
   *
   * @param message - Human-readable error message
   * @param errorCode - Machine-readable error code
   * @param httpStatus - HTTP status code (default: 400)
   * @param details - Additional error context
   */
  constructor(
    message: string,
    errorCode: X402ErrorCode,
    httpStatus: number = 400,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'X402Error';
    this.errorCode = errorCode;
    this.httpStatus = httpStatus;
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace for where the error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, X402Error);
    }
  }

  /**
   * Serialize error to JSON format for HTTP responses
   *
   * @returns Structured error object
   */
  toJSON(): {
    error: {
      code: X402ErrorCode;
      message: string;
      details?: Record<string, unknown>;
      timestamp: string;
    };
  } {
    return {
      error: {
        code: this.errorCode,
        message: this.message,
        ...(this.details && { details: this.details }),
        timestamp: this.timestamp,
      },
    };
  }

  /**
   * Convert to string for logging
   */
  toString(): string {
    return `X402Error [${this.errorCode}]: ${this.message}`;
  }

  // ============================================================
  // Static Factory Methods - Payment Required (402)
  // ============================================================

  /**
   * Create a Payment Required error (HTTP 402)
   *
   * Used when no payment header is present and payment is required.
   *
   * @param message - Custom message (default: 'Payment required')
   * @returns X402Error with 402 status
   */
  static paymentRequired(message: string = 'Payment required'): X402Error {
    return new X402Error(message, 'MISSING_HEADER', 402);
  }

  // ============================================================
  // Static Factory Methods - Validation Errors (400)
  // ============================================================

  /**
   * Create a Missing Header error
   *
   * Used when X-Payment header is missing.
   */
  static missingHeader(): X402Error {
    return new X402Error(
      'X-Payment header is required',
      'MISSING_HEADER',
      402,
    );
  }

  /**
   * Create an Invalid JSON error
   *
   * Used when the payment header cannot be parsed as JSON.
   *
   * @param parseError - Optional parse error message
   */
  static invalidJson(parseError?: string): X402Error {
    return new X402Error(
      'Invalid payment header format',
      'INVALID_JSON',
      400,
      parseError ? { parseError } : undefined,
    );
  }

  /**
   * Create an Invalid Version error
   *
   * Used when the x402 version is not supported.
   *
   * @param version - The invalid version received
   */
  static invalidVersion(version: string): X402Error {
    return new X402Error(
      `Unsupported x402 version: ${version}`,
      'INVALID_VERSION',
      400,
      { receivedVersion: version, supportedVersion: '1' },
    );
  }

  /**
   * Create an Invalid Scheme error
   *
   * Used when the payment scheme is not supported.
   *
   * @param scheme - The invalid scheme received
   */
  static invalidScheme(scheme: string): X402Error {
    return new X402Error(
      `Unsupported payment scheme: ${scheme}`,
      'INVALID_SCHEME',
      400,
      { receivedScheme: scheme, supportedSchemes: ['exact'] },
    );
  }

  /**
   * Create an Invalid Network error
   *
   * Used when the network/chain ID doesn't match.
   *
   * @param network - The invalid network received
   * @param expected - The expected network
   */
  static invalidNetwork(network: string, expected?: string): X402Error {
    return new X402Error(
      `Invalid network: ${network}`,
      'INVALID_NETWORK',
      400,
      { receivedNetwork: network, ...(expected && { expectedNetwork: expected }) },
    );
  }

  /**
   * Create an Invalid Payload error
   *
   * Used when the payment payload structure is invalid.
   *
   * @param errors - List of validation errors
   */
  static invalidPayload(errors: string[]): X402Error {
    return new X402Error(
      'Invalid payment payload',
      'INVALID_PAYLOAD',
      400,
      { validationErrors: errors },
    );
  }

  /**
   * Create an Amount Mismatch error
   *
   * Used when the payment amount doesn't match the required amount.
   *
   * @param expected - Expected amount
   * @param received - Received amount
   */
  static amountMismatch(expected: string, received: string): X402Error {
    return new X402Error(
      `Payment amount mismatch: expected ${expected}, received ${received}`,
      'AMOUNT_MISMATCH',
      400,
      { expectedAmount: expected, receivedAmount: received },
    );
  }

  /**
   * Create a Recipient Mismatch error
   *
   * Used when the payment recipient doesn't match the configured address.
   *
   * @param expected - Expected recipient address
   * @param received - Received recipient address
   */
  static recipientMismatch(expected: string, received: string): X402Error {
    return new X402Error(
      'Payment recipient mismatch',
      'RECIPIENT_MISMATCH',
      400,
      { expectedRecipient: expected, receivedRecipient: received },
    );
  }

  /**
   * Create an Authorization Expired error
   *
   * Used when the authorization has passed its validBefore time.
   *
   * @param validBefore - The expiration timestamp
   */
  static authorizationExpired(validBefore: string): X402Error {
    return new X402Error(
      'Payment authorization has expired',
      'AUTHORIZATION_EXPIRED',
      400,
      { validBefore, currentTime: new Date().toISOString() },
    );
  }

  /**
   * Create an Authorization Not Yet Valid error
   *
   * Used when the authorization has not yet reached its validAfter time.
   *
   * @param validAfter - The start timestamp
   */
  static authorizationNotYetValid(validAfter: string): X402Error {
    return new X402Error(
      'Payment authorization is not yet valid',
      'AUTHORIZATION_NOT_YET_VALID',
      400,
      { validAfter, currentTime: new Date().toISOString() },
    );
  }

  // ============================================================
  // Static Factory Methods - Settlement Errors (500/502)
  // ============================================================

  /**
   * Create an Invalid Signature error
   *
   * Used when the ECDSA signature verification fails.
   */
  static invalidSignature(): X402Error {
    return new X402Error(
      'Invalid payment signature',
      'INVALID_SIGNATURE',
      400,
    );
  }

  /**
   * Create an Insufficient Balance error
   *
   * Used when the payer doesn't have enough tokens.
   *
   * @param payer - The payer's address
   */
  static insufficientBalance(payer?: string): X402Error {
    return new X402Error(
      'Insufficient token balance',
      'INSUFFICIENT_BALANCE',
      400,
      payer ? { payerAddress: payer } : undefined,
    );
  }

  /**
   * Create a Nonce Already Used error
   *
   * Used when the authorization nonce has been used before.
   *
   * @param nonce - The duplicate nonce
   */
  static nonceAlreadyUsed(nonce?: string): X402Error {
    return new X402Error(
      'Authorization nonce has already been used',
      'NONCE_ALREADY_USED',
      400,
      nonce ? { nonce } : undefined,
    );
  }

  /**
   * Create an Invalid Token error
   *
   * Used when the token address is not supported.
   *
   * @param tokenAddress - The invalid token address
   */
  static invalidToken(tokenAddress?: string): X402Error {
    return new X402Error(
      'Token not supported for x402 payments',
      'INVALID_TOKEN',
      400,
      tokenAddress ? { tokenAddress } : undefined,
    );
  }

  /**
   * Create an Unsupported Chain error
   *
   * Used when the chain ID is not supported by the facilitator.
   *
   * @param chainId - The unsupported chain ID
   */
  static unsupportedChain(chainId?: number): X402Error {
    return new X402Error(
      'Chain not supported for x402 payments',
      'UNSUPPORTED_CHAIN',
      400,
      chainId ? { chainId } : undefined,
    );
  }

  /**
   * Create a Facilitator Error
   *
   * Used when the facilitator returns an unexpected error.
   *
   * @param message - Error message from facilitator
   * @param details - Additional error details
   */
  static facilitatorError(
    message: string = 'Facilitator service error',
    details?: Record<string, unknown>,
  ): X402Error {
    return new X402Error(
      message,
      'FACILITATOR_ERROR',
      502,
      details,
    );
  }

  /**
   * Create a Network Error
   *
   * Used when communication with the facilitator fails.
   *
   * @param message - Error message
   */
  static networkError(message: string = 'Failed to communicate with facilitator'): X402Error {
    return new X402Error(
      message,
      'NETWORK_ERROR',
      502,
    );
  }

  /**
   * Create a Timeout Error
   *
   * Used when the settlement request times out.
   *
   * @param timeoutMs - Timeout duration in milliseconds
   */
  static timeout(timeoutMs?: number): X402Error {
    return new X402Error(
      'Settlement request timed out',
      'TIMEOUT',
      504,
      timeoutMs ? { timeoutMs } : undefined,
    );
  }

  /**
   * Create an Internal Error
   *
   * Used for unexpected internal errors during payment processing.
   *
   * @param message - Error message
   * @param details - Additional error details
   */
  static internalError(
    message: string = 'Internal payment processing error',
    details?: Record<string, unknown>,
  ): X402Error {
    return new X402Error(
      message,
      'INTERNAL_ERROR',
      500,
      details,
    );
  }

  // ============================================================
  // Static Utility Methods
  // ============================================================

  /**
   * Create an X402Error from a settlement error code
   *
   * Maps facilitator error codes to appropriate X402Error instances.
   *
   * @param code - The settlement error code
   * @param message - Optional custom message
   * @returns Appropriate X402Error instance
   */
  static fromSettlementErrorCode(
    code: X402SettlementErrorCode,
    message?: string,
  ): X402Error {
    switch (code) {
      case 'INVALID_SIGNATURE':
        return X402Error.invalidSignature();
      case 'EXPIRED_AUTHORIZATION':
        return new X402Error(
          message ?? 'Authorization has expired',
          'AUTHORIZATION_EXPIRED',
          400,
        );
      case 'INSUFFICIENT_BALANCE':
        return X402Error.insufficientBalance();
      case 'NONCE_ALREADY_USED':
        return X402Error.nonceAlreadyUsed();
      case 'INVALID_TOKEN':
        return X402Error.invalidToken();
      case 'UNSUPPORTED_CHAIN':
        return X402Error.unsupportedChain();
      case 'FACILITATOR_ERROR':
        return X402Error.facilitatorError(message);
      case 'NETWORK_ERROR':
        return X402Error.networkError(message);
      case 'TIMEOUT':
        return X402Error.timeout();
      default:
        return X402Error.internalError(message ?? `Unknown error: ${code}`);
    }
  }

  /**
   * Check if an error is an X402Error
   *
   * Type guard for error handling.
   *
   * @param error - The error to check
   * @returns True if error is an X402Error
   */
  static isX402Error(error: unknown): error is X402Error {
    return error instanceof X402Error;
  }

  /**
   * Wrap an unknown error as an X402Error
   *
   * Converts any error to an X402Error for consistent handling.
   *
   * @param error - The error to wrap
   * @returns X402Error instance
   */
  static wrap(error: unknown): X402Error {
    if (error instanceof X402Error) {
      return error;
    }

    if (error instanceof Error) {
      return X402Error.internalError(error.message, {
        originalError: error.name,
        stack: error.stack,
      });
    }

    return X402Error.internalError(String(error));
  }
}
