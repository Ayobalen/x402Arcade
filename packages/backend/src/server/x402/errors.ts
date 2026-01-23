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

/**
 * Validation error details interface
 *
 * Structured information about a validation failure.
 */
export interface ValidationErrorDetails {
  /**
   * The field/property that failed validation
   */
  field: string;

  /**
   * The expected value or constraint description
   */
  expected?: unknown;

  /**
   * The actual value that was received
   */
  actual?: unknown;

  /**
   * Additional context about the validation failure
   */
  context?: Record<string, unknown>;
}

/**
 * X402ValidationError - Specialized error class for payment validation failures
 *
 * Extends X402Error with additional validation-specific metadata including
 * the field that failed validation, expected vs actual values, and
 * convenience factory methods for common validation scenarios.
 *
 * @example
 * ```typescript
 * // Throw a validation error with field details
 * throw new X402ValidationError(
 *   'Invalid payment amount',
 *   'AMOUNT_MISMATCH',
 *   { field: 'value', expected: '10000', actual: '5000' }
 * );
 *
 * // Use static factory methods
 * throw X402ValidationError.invalidField('from', 'valid Ethereum address', 'invalid-address');
 * throw X402ValidationError.missingField('signature');
 * throw X402ValidationError.typeMismatch('value', 'string', typeof receivedValue);
 *
 * // Handle in error middleware
 * if (err instanceof X402ValidationError) {
 *   console.error(`Validation failed on field: ${err.field}`);
 *   console.error(`Expected: ${err.expected}, Got: ${err.actual}`);
 * }
 * ```
 */
export class X402ValidationError extends X402Error {
  /**
   * The field that failed validation
   */
  public readonly field: string;

  /**
   * The expected value or constraint
   */
  public readonly expected?: unknown;

  /**
   * The actual value that was received
   */
  public readonly actual?: unknown;

  /**
   * Additional validation context
   */
  public readonly context?: Record<string, unknown>;

  /**
   * Create a new X402ValidationError
   *
   * @param message - Human-readable error message
   * @param errorCode - Machine-readable validation error code
   * @param validationDetails - Details about the validation failure
   */
  constructor(
    message: string,
    errorCode: X402ValidationErrorCode,
    validationDetails: ValidationErrorDetails,
  ) {
    // Build details object with validation info
    const details: Record<string, unknown> = {
      field: validationDetails.field,
    };

    if (validationDetails.expected !== undefined) {
      details.expected = validationDetails.expected;
    }

    if (validationDetails.actual !== undefined) {
      details.actual = validationDetails.actual;
    }

    if (validationDetails.context) {
      details.context = validationDetails.context;
    }

    // All validation errors return 400 Bad Request
    super(message, errorCode, 400, details);

    this.name = 'X402ValidationError';
    this.field = validationDetails.field;
    this.expected = validationDetails.expected;
    this.actual = validationDetails.actual;
    this.context = validationDetails.context;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, X402ValidationError);
    }
  }

  /**
   * Serialize to JSON with validation-specific details
   */
  override toJSON(): {
    error: {
      code: X402ErrorCode;
      message: string;
      field: string;
      expected?: unknown;
      actual?: unknown;
      context?: Record<string, unknown>;
      timestamp: string;
    };
  } {
    return {
      error: {
        code: this.errorCode,
        message: this.message,
        field: this.field,
        ...(this.expected !== undefined && { expected: this.expected }),
        ...(this.actual !== undefined && { actual: this.actual }),
        ...(this.context && { context: this.context }),
        timestamp: this.timestamp,
      },
    };
  }

  /**
   * Convert to string for logging
   */
  override toString(): string {
    const parts = [`X402ValidationError [${this.errorCode}]: ${this.message}`];
    parts.push(`  Field: ${this.field}`);
    if (this.expected !== undefined) {
      parts.push(`  Expected: ${JSON.stringify(this.expected)}`);
    }
    if (this.actual !== undefined) {
      parts.push(`  Actual: ${JSON.stringify(this.actual)}`);
    }
    return parts.join('\n');
  }

  // ============================================================
  // Static Factory Methods - Field Validation Errors
  // ============================================================

  /**
   * Create an Invalid Field error
   *
   * Used when a field has an invalid value.
   *
   * @param field - The field name that is invalid
   * @param expected - Description of expected value/format
   * @param actual - The actual value received
   * @returns X402ValidationError with INVALID_PAYLOAD code
   */
  static invalidField(field: string, expected: string, actual: unknown): X402ValidationError {
    return new X402ValidationError(
      `Invalid value for field '${field}': expected ${expected}`,
      'INVALID_PAYLOAD',
      { field, expected, actual },
    );
  }

  /**
   * Create a Missing Field error
   *
   * Used when a required field is missing.
   *
   * @param field - The missing field name
   * @returns X402ValidationError with INVALID_PAYLOAD code
   */
  static missingField(field: string): X402ValidationError {
    return new X402ValidationError(
      `Missing required field: '${field}'`,
      'INVALID_PAYLOAD',
      { field, expected: 'present', actual: 'missing' },
    );
  }

  /**
   * Create a Type Mismatch error
   *
   * Used when a field has the wrong type.
   *
   * @param field - The field name with wrong type
   * @param expectedType - The expected type
   * @param actualType - The actual type received
   * @returns X402ValidationError with INVALID_PAYLOAD code
   */
  static typeMismatch(
    field: string,
    expectedType: string,
    actualType: string,
  ): X402ValidationError {
    return new X402ValidationError(
      `Type mismatch for field '${field}': expected ${expectedType}, got ${actualType}`,
      'INVALID_PAYLOAD',
      { field, expected: expectedType, actual: actualType },
    );
  }

  // ============================================================
  // Static Factory Methods - x402 Protocol Validation Errors
  // ============================================================

  /**
   * Create a Version Mismatch error
   *
   * Used when the x402 protocol version is not supported.
   *
   * @param actual - The received version
   * @param expected - The expected version (default: '1')
   * @returns X402ValidationError with INVALID_VERSION code
   */
  static versionMismatch(actual: string, expected: string = '1'): X402ValidationError {
    return new X402ValidationError(
      `Unsupported x402 version: ${actual}`,
      'INVALID_VERSION',
      { field: 'x402Version', expected, actual },
    );
  }

  /**
   * Create a Scheme Mismatch error
   *
   * Used when the payment scheme is not supported.
   *
   * @param actual - The received scheme
   * @param expected - The expected scheme (default: 'exact')
   * @returns X402ValidationError with INVALID_SCHEME code
   */
  static schemeMismatch(actual: string, expected: string = 'exact'): X402ValidationError {
    return new X402ValidationError(
      `Unsupported payment scheme: ${actual}`,
      'INVALID_SCHEME',
      { field: 'scheme', expected, actual },
    );
  }

  /**
   * Create a Network Mismatch error
   *
   * Used when the network identifier doesn't match.
   *
   * @param actual - The received network
   * @param expected - The expected network
   * @returns X402ValidationError with INVALID_NETWORK code
   */
  static networkMismatch(actual: string, expected: string): X402ValidationError {
    return new X402ValidationError(
      `Invalid network: expected ${expected}, got ${actual}`,
      'INVALID_NETWORK',
      { field: 'network', expected, actual },
    );
  }

  // ============================================================
  // Static Factory Methods - Address Validation Errors
  // ============================================================

  /**
   * Create an Invalid Address error
   *
   * Used when an address field is not a valid Ethereum address.
   *
   * @param field - The field name ('from', 'to', 'payTo')
   * @param actual - The invalid address value
   * @returns X402ValidationError with INVALID_PAYLOAD code
   */
  static invalidAddress(field: string, actual: string): X402ValidationError {
    return new X402ValidationError(
      `Invalid Ethereum address for '${field}': ${actual}`,
      'INVALID_PAYLOAD',
      {
        field,
        expected: 'valid Ethereum address (0x + 40 hex characters)',
        actual,
      },
    );
  }

  /**
   * Create a Recipient Mismatch error
   *
   * Used when the payment recipient doesn't match the expected address.
   *
   * @param expected - The expected recipient address
   * @param actual - The actual recipient in the payment
   * @returns X402ValidationError with RECIPIENT_MISMATCH code
   */
  static recipientMismatch(expected: string, actual: string): X402ValidationError {
    return new X402ValidationError(
      'Payment recipient does not match expected address',
      'RECIPIENT_MISMATCH',
      { field: 'to', expected, actual },
    );
  }

  // ============================================================
  // Static Factory Methods - Amount Validation Errors
  // ============================================================

  /**
   * Create an Amount Mismatch error
   *
   * Used when the payment amount is incorrect.
   *
   * @param expected - The expected amount
   * @param actual - The actual amount received
   * @param context - Optional additional context (e.g., currency)
   * @returns X402ValidationError with AMOUNT_MISMATCH code
   */
  static amountMismatch(
    expected: string | bigint,
    actual: string | bigint,
    context?: { currency?: string; minAmount?: string },
  ): X402ValidationError {
    return new X402ValidationError(
      `Payment amount mismatch: expected ${expected}, received ${actual}`,
      'AMOUNT_MISMATCH',
      {
        field: 'value',
        expected: String(expected),
        actual: String(actual),
        context,
      },
    );
  }

  /**
   * Create an Invalid Amount error
   *
   * Used when the amount format is invalid or non-positive.
   *
   * @param actual - The invalid amount value
   * @param reason - Reason why the amount is invalid
   * @returns X402ValidationError with INVALID_PAYLOAD code
   */
  static invalidAmount(actual: unknown, reason: string): X402ValidationError {
    return new X402ValidationError(
      `Invalid payment amount: ${reason}`,
      'INVALID_PAYLOAD',
      {
        field: 'value',
        expected: 'positive numeric string (uint256)',
        actual,
        context: { reason },
      },
    );
  }

  // ============================================================
  // Static Factory Methods - Signature Validation Errors
  // ============================================================

  /**
   * Create an Invalid Signature Component error
   *
   * Used when a signature component (v, r, or s) is invalid.
   *
   * @param component - The signature component ('v', 'r', or 's')
   * @param actual - The invalid value
   * @param expected - Description of expected format
   * @returns X402ValidationError with INVALID_PAYLOAD code
   */
  static invalidSignatureComponent(
    component: 'v' | 'r' | 's',
    actual: unknown,
    expected?: string,
  ): X402ValidationError {
    const expectedFormat =
      expected ??
      (component === 'v'
        ? '27, 28, or valid EIP-155 value (chainId * 2 + 35/36)'
        : '0x-prefixed hex string (64 hex characters / 32 bytes)');

    return new X402ValidationError(
      `Invalid signature component '${component}'`,
      'INVALID_PAYLOAD',
      {
        field: component,
        expected: expectedFormat,
        actual,
        context: { signatureComponent: component },
      },
    );
  }

  /**
   * Create an Invalid Signature Format error
   *
   * Used when multiple signature components are invalid.
   * Aggregates all signature-related validation errors.
   *
   * @param errors - Array of signature validation error messages
   * @param components - Object with the invalid signature components
   * @returns X402ValidationError with INVALID_PAYLOAD code
   *
   * @example
   * ```typescript
   * throw X402ValidationError.invalidSignatureFormat(
   *   ['Invalid v value: 0', 'Invalid r value format: 0x123'],
   *   { v: 0, r: '0x123', s: '0x...' }
   * );
   * ```
   */
  static invalidSignatureFormat(
    errors: string[],
    components?: { v?: unknown; r?: unknown; s?: unknown },
  ): X402ValidationError {
    return new X402ValidationError(
      'Invalid signature format',
      'INVALID_PAYLOAD',
      {
        field: 'signature',
        expected: {
          v: '27, 28, or valid EIP-155 value',
          r: '0x-prefixed 64 hex characters (32 bytes)',
          s: '0x-prefixed 64 hex characters (32 bytes)',
        },
        actual: components,
        context: {
          signatureErrors: errors,
          help: 'The signature v value must be 27, 28, or a valid EIP-155 value (chainId * 2 + 35/36). The r and s values must be 32-byte hex strings with 0x prefix.',
        },
      },
    );
  }

  /**
   * Create an Invalid Nonce error
   *
   * Used when the authorization nonce format is invalid.
   *
   * @param actual - The invalid nonce value
   * @returns X402ValidationError with INVALID_PAYLOAD code
   */
  static invalidNonce(actual: string): X402ValidationError {
    return new X402ValidationError(
      'Invalid nonce format',
      'INVALID_PAYLOAD',
      {
        field: 'nonce',
        expected: '0x-prefixed hex string (32 bytes / 64 hex characters)',
        actual,
      },
    );
  }

  // ============================================================
  // Static Factory Methods - Timestamp Validation Errors
  // ============================================================

  /**
   * Create an Authorization Expired error
   *
   * Used when the authorization's validBefore time has passed.
   *
   * @param validBefore - The authorization's expiration timestamp
   * @param currentTime - The current timestamp
   * @returns X402ValidationError with AUTHORIZATION_EXPIRED code
   */
  static authorizationExpired(
    validBefore: string | number,
    currentTime?: number,
  ): X402ValidationError {
    const now = currentTime ?? Math.floor(Date.now() / 1000);
    return new X402ValidationError(
      'Payment authorization has expired',
      'AUTHORIZATION_EXPIRED',
      {
        field: 'validBefore',
        expected: `timestamp > ${now}`,
        actual: String(validBefore),
        context: {
          currentTime: now,
          expiredAt: String(validBefore),
          expiredAgo: `${now - Number(validBefore)} seconds ago`,
        },
      },
    );
  }

  /**
   * Create an Authorization Not Yet Valid error
   *
   * Used when the authorization's validAfter time has not been reached.
   *
   * @param validAfter - The authorization's start timestamp
   * @param currentTime - The current timestamp
   * @returns X402ValidationError with AUTHORIZATION_NOT_YET_VALID code
   */
  static authorizationNotYetValid(
    validAfter: string | number,
    currentTime?: number,
  ): X402ValidationError {
    const now = currentTime ?? Math.floor(Date.now() / 1000);
    return new X402ValidationError(
      'Payment authorization is not yet valid',
      'AUTHORIZATION_NOT_YET_VALID',
      {
        field: 'validAfter',
        expected: `timestamp <= ${now}`,
        actual: String(validAfter),
        context: {
          currentTime: now,
          validFrom: String(validAfter),
          validIn: `${Number(validAfter) - now} seconds`,
        },
      },
    );
  }

  /**
   * Create an Invalid Timestamp error
   *
   * Used when a timestamp field has an invalid format.
   *
   * @param field - The timestamp field name ('validAfter' or 'validBefore')
   * @param actual - The invalid timestamp value
   * @returns X402ValidationError with INVALID_PAYLOAD code
   */
  static invalidTimestamp(
    field: 'validAfter' | 'validBefore',
    actual: unknown,
  ): X402ValidationError {
    return new X402ValidationError(
      `Invalid timestamp for '${field}'`,
      'INVALID_PAYLOAD',
      {
        field,
        expected: 'numeric string (Unix timestamp in seconds)',
        actual,
      },
    );
  }

  // ============================================================
  // Static Factory Methods - Header Validation Errors
  // ============================================================

  /**
   * Create a Missing Header error
   *
   * Used when the X-Payment header is missing.
   *
   * @returns X402ValidationError with MISSING_HEADER code
   */
  static missingHeader(): X402ValidationError {
    return new X402ValidationError(
      'X-Payment header is required',
      'MISSING_HEADER',
      { field: 'X-Payment', expected: 'base64-encoded JSON', actual: 'missing' },
    );
  }

  /**
   * Create an Invalid JSON error
   *
   * Used when the payment header cannot be parsed as JSON.
   *
   * @param parseError - The JSON parse error message
   * @returns X402ValidationError with INVALID_JSON code
   */
  static invalidJson(parseError?: string): X402ValidationError {
    return new X402ValidationError(
      'Invalid payment header format',
      'INVALID_JSON',
      {
        field: 'X-Payment',
        expected: 'valid base64-encoded JSON',
        actual: 'unparseable',
        context: parseError ? { parseError } : undefined,
      },
    );
  }

  // ============================================================
  // Static Utility Methods
  // ============================================================

  /**
   * Create a Missing Required Fields error
   *
   * Used when one or more required fields are missing from the payload.
   * Includes the list of missing fields and the expected schema for reference.
   *
   * @param missingFields - Array of missing field names
   * @param schema - The payload schema definition for reference
   * @returns X402ValidationError with INVALID_PAYLOAD code and 400 status
   *
   * @example
   * ```typescript
   * // Error response format:
   * {
   *   "error": {
   *     "code": "INVALID_PAYLOAD",
   *     "message": "Missing required fields: from, to, value",
   *     "field": "from, to, value",
   *     "expected": "all required fields present",
   *     "actual": "missing: from, to, value",
   *     "context": {
   *       "missingFields": ["from", "to", "value"],
   *       "missingCount": 3,
   *       "schema": { ... }
   *     }
   *   }
   * }
   * ```
   */
  static missingRequiredFields(
    missingFields: string[],
    schema: {
      requiredFields: readonly {
        readonly name: string;
        readonly type: string;
        readonly description: string;
      }[];
    },
  ): X402ValidationError {
    const fieldList = missingFields.join(', ');
    const schemaForMissing = schema.requiredFields
      .filter((f) => missingFields.includes(f.name))
      .map((f) => ({
        field: f.name,
        type: f.type,
        description: f.description,
      }));

    return new X402ValidationError(
      `Missing required fields: ${fieldList}`,
      'INVALID_PAYLOAD',
      {
        field: fieldList,
        expected: 'all required fields present',
        actual: `missing: ${fieldList}`,
        context: {
          missingFields,
          missingCount: missingFields.length,
          schema: {
            missingFieldDefinitions: schemaForMissing,
            allRequiredFields: schema.requiredFields.map((f) => f.name),
          },
        },
      },
    );
  }

  /**
   * Create an X402ValidationError from multiple validation errors
   *
   * Combines multiple field errors into a single validation error.
   *
   * @param errors - Array of validation error messages
   * @param details - Array of field details
   * @returns X402ValidationError with INVALID_PAYLOAD code
   */
  static fromMultipleErrors(
    errors: string[],
    details?: ValidationErrorDetails[],
  ): X402ValidationError {
    const fields = details?.map((d) => d.field).join(', ') ?? 'multiple fields';
    return new X402ValidationError(
      `Multiple validation errors: ${errors.join('; ')}`,
      'INVALID_PAYLOAD',
      {
        field: fields,
        context: {
          errorCount: errors.length,
          errors,
          fieldDetails: details,
        },
      },
    );
  }

  /**
   * Check if an error is an X402ValidationError
   *
   * Type guard for error handling.
   *
   * @param error - The error to check
   * @returns True if error is an X402ValidationError
   */
  static isValidationError(error: unknown): error is X402ValidationError {
    return error instanceof X402ValidationError;
  }

  /**
   * Get all validation error codes
   *
   * Returns an array of all X402ValidationErrorCode values.
   * Useful for documentation and testing.
   *
   * @returns Array of validation error codes
   */
  static getValidationErrorCodes(): X402ValidationErrorCode[] {
    return [
      'MISSING_HEADER',
      'INVALID_JSON',
      'INVALID_VERSION',
      'INVALID_SCHEME',
      'INVALID_NETWORK',
      'INVALID_PAYLOAD',
      'AMOUNT_MISMATCH',
      'RECIPIENT_MISMATCH',
      'AUTHORIZATION_EXPIRED',
      'AUTHORIZATION_NOT_YET_VALID',
    ];
  }
}

/**
 * Facilitator Response Details
 *
 * Structured information about the facilitator response that led to a settlement error.
 */
export interface FacilitatorResponseDetails {
  /**
   * HTTP status code from the facilitator
   */
  statusCode?: number;

  /**
   * Error code from the facilitator response
   */
  errorCode?: string;

  /**
   * Error message from the facilitator response
   */
  errorMessage?: string;

  /**
   * Raw response body (for debugging)
   */
  rawResponse?: unknown;

  /**
   * Request ID for tracking (if provided by facilitator)
   */
  requestId?: string;

  /**
   * Time taken for the request in milliseconds
   */
  requestDurationMs?: number;
}

/**
 * X402SettlementError - Specialized error class for facilitator settlement failures
 *
 * Extends X402Error with additional settlement-specific metadata including
 * facilitator response details, retry indication, and convenience factory
 * methods for common settlement failure scenarios.
 *
 * Settlement errors typically result in HTTP 502 Bad Gateway responses since
 * the failure is with the upstream facilitator service, not the client's request.
 *
 * @example
 * ```typescript
 * // Throw a settlement error with facilitator details
 * throw new X402SettlementError(
 *   'Settlement failed due to insufficient balance',
 *   'INSUFFICIENT_BALANCE',
 *   {
 *     statusCode: 400,
 *     errorCode: 'INSUFFICIENT_BALANCE',
 *     errorMessage: 'Payer has insufficient USDC balance'
 *   }
 * );
 *
 * // Use factory methods for common errors
 * throw X402SettlementError.timeout(30000);
 * throw X402SettlementError.networkError(new Error('ECONNREFUSED'));
 * throw X402SettlementError.facilitatorRejection({
 *   statusCode: 400,
 *   errorCode: 'NONCE_ALREADY_USED'
 * });
 *
 * // Check if an error can be retried
 * if (err instanceof X402SettlementError && err.canRetry) {
 *   await retrySettlement();
 * }
 *
 * // Handle in error middleware
 * if (err instanceof X402SettlementError) {
 *   console.error(`Settlement failed: ${err.errorCode}`);
 *   console.error(`Facilitator: ${JSON.stringify(err.facilitatorResponse)}`);
 *   return res.status(err.httpStatus).json(err.toJSON());
 * }
 * ```
 */
export class X402SettlementError extends X402Error {
  /**
   * Details from the facilitator response
   */
  public readonly facilitatorResponse?: FacilitatorResponseDetails;

  /**
   * Whether this error indicates the settlement could be retried
   */
  public readonly canRetry: boolean;

  /**
   * Suggested retry delay in milliseconds (if retryable)
   */
  public readonly retryAfterMs?: number;

  /**
   * The settlement phase where the error occurred
   */
  public readonly phase: 'request' | 'response' | 'timeout' | 'unknown';

  /**
   * Create a new X402SettlementError
   *
   * @param message - Human-readable error message
   * @param errorCode - Machine-readable settlement error code
   * @param facilitatorResponse - Details from the facilitator response
   * @param options - Additional error options
   */
  constructor(
    message: string,
    errorCode: X402SettlementErrorCode,
    facilitatorResponse?: FacilitatorResponseDetails,
    options?: {
      canRetry?: boolean;
      retryAfterMs?: number;
      phase?: 'request' | 'response' | 'timeout' | 'unknown';
    },
  ) {
    // Settlement errors return 502 Bad Gateway by default
    // This indicates the facilitator (upstream) failed
    super(
      message,
      errorCode,
      502,
      facilitatorResponse
        ? {
            facilitatorStatusCode: facilitatorResponse.statusCode,
            facilitatorErrorCode: facilitatorResponse.errorCode,
            facilitatorMessage: facilitatorResponse.errorMessage,
            requestId: facilitatorResponse.requestId,
            requestDurationMs: facilitatorResponse.requestDurationMs,
          }
        : undefined,
    );

    this.name = 'X402SettlementError';
    this.facilitatorResponse = facilitatorResponse;
    this.canRetry = options?.canRetry ?? false;
    this.retryAfterMs = options?.retryAfterMs;
    this.phase = options?.phase ?? 'unknown';

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, X402SettlementError);
    }
  }

  /**
   * Serialize to JSON with settlement-specific details
   */
  override toJSON(): {
    error: {
      code: X402ErrorCode;
      message: string;
      details?: Record<string, unknown>;
      timestamp: string;
      canRetry: boolean;
      retryAfterMs?: number;
      facilitator?: {
        statusCode?: number;
        errorCode?: string;
        errorMessage?: string;
        requestId?: string;
      };
    };
  } {
    return {
      error: {
        code: this.errorCode,
        message: this.message,
        ...(this.details && { details: this.details }),
        timestamp: this.timestamp,
        canRetry: this.canRetry,
        ...(this.retryAfterMs !== undefined && { retryAfterMs: this.retryAfterMs }),
        ...(this.facilitatorResponse && {
          facilitator: {
            statusCode: this.facilitatorResponse.statusCode,
            errorCode: this.facilitatorResponse.errorCode,
            errorMessage: this.facilitatorResponse.errorMessage,
            requestId: this.facilitatorResponse.requestId,
          },
        }),
      },
    };
  }

  /**
   * Convert to string for logging
   */
  override toString(): string {
    const parts = [`X402SettlementError [${this.errorCode}]: ${this.message}`];
    parts.push(`  Phase: ${this.phase}`);
    parts.push(`  Can Retry: ${this.canRetry}`);
    if (this.retryAfterMs !== undefined) {
      parts.push(`  Retry After: ${this.retryAfterMs}ms`);
    }
    if (this.facilitatorResponse) {
      if (this.facilitatorResponse.statusCode) {
        parts.push(`  Facilitator Status: ${this.facilitatorResponse.statusCode}`);
      }
      if (this.facilitatorResponse.errorCode) {
        parts.push(`  Facilitator Error Code: ${this.facilitatorResponse.errorCode}`);
      }
      if (this.facilitatorResponse.errorMessage) {
        parts.push(`  Facilitator Message: ${this.facilitatorResponse.errorMessage}`);
      }
      if (this.facilitatorResponse.requestId) {
        parts.push(`  Request ID: ${this.facilitatorResponse.requestId}`);
      }
    }
    return parts.join('\n');
  }

  // ============================================================
  // Static Factory Methods - Timeout Errors (504)
  // ============================================================

  /**
   * Create a Timeout error
   *
   * Used when the facilitator request times out.
   * These errors are typically retryable.
   *
   * @param timeoutMs - Timeout duration in milliseconds
   * @param requestId - Optional request ID for tracking
   * @returns X402SettlementError with TIMEOUT code
   */
  static timeout(
    timeoutMs?: number,
    requestId?: string,
  ): X402SettlementError {
    const error = new X402SettlementError(
      `Settlement request timed out${timeoutMs ? ` after ${timeoutMs}ms` : ''}`,
      'TIMEOUT',
      {
        requestId,
        requestDurationMs: timeoutMs,
      },
      {
        canRetry: true,
        retryAfterMs: 1000, // Suggest 1s retry delay
        phase: 'timeout',
      },
    );

    // Override to 504 Gateway Timeout for timeout errors
    Object.defineProperty(error, 'httpStatus', { value: 504 });

    return error;
  }

  /**
   * Create a Connection Timeout error
   *
   * Used when the connection to the facilitator cannot be established.
   *
   * @param timeoutMs - Connection timeout duration
   * @returns X402SettlementError with TIMEOUT code
   */
  static connectionTimeout(timeoutMs?: number): X402SettlementError {
    const error = new X402SettlementError(
      `Connection to facilitator timed out${timeoutMs ? ` after ${timeoutMs}ms` : ''}`,
      'TIMEOUT',
      { requestDurationMs: timeoutMs },
      {
        canRetry: true,
        retryAfterMs: 2000, // Suggest longer delay for connection issues
        phase: 'request',
      },
    );

    Object.defineProperty(error, 'httpStatus', { value: 504 });

    return error;
  }

  // ============================================================
  // Static Factory Methods - Network Errors (502)
  // ============================================================

  /**
   * Create a Network Error
   *
   * Used when communication with the facilitator fails.
   * These errors are typically retryable.
   *
   * @param cause - The underlying error that caused the network failure
   * @param requestId - Optional request ID for tracking
   * @returns X402SettlementError with NETWORK_ERROR code
   */
  static networkError(
    cause?: Error | string,
    requestId?: string,
  ): X402SettlementError {
    const message = cause instanceof Error ? cause.message : cause;
    return new X402SettlementError(
      `Failed to communicate with facilitator${message ? `: ${message}` : ''}`,
      'NETWORK_ERROR',
      {
        requestId,
        errorMessage: message,
      },
      {
        canRetry: true,
        retryAfterMs: 1000,
        phase: 'request',
      },
    );
  }

  /**
   * Create a DNS Resolution error
   *
   * Used when the facilitator hostname cannot be resolved.
   *
   * @param hostname - The hostname that failed to resolve
   * @returns X402SettlementError with NETWORK_ERROR code
   */
  static dnsError(hostname: string): X402SettlementError {
    return new X402SettlementError(
      `Failed to resolve facilitator hostname: ${hostname}`,
      'NETWORK_ERROR',
      { errorMessage: `DNS resolution failed for ${hostname}` },
      {
        canRetry: true,
        retryAfterMs: 5000, // Longer delay for DNS issues
        phase: 'request',
      },
    );
  }

  /**
   * Create a Connection Refused error
   *
   * Used when the facilitator refuses the connection.
   *
   * @param url - The URL that refused the connection
   * @returns X402SettlementError with NETWORK_ERROR code
   */
  static connectionRefused(url?: string): X402SettlementError {
    return new X402SettlementError(
      `Facilitator refused connection${url ? `: ${url}` : ''}`,
      'NETWORK_ERROR',
      { errorMessage: 'ECONNREFUSED' },
      {
        canRetry: true,
        retryAfterMs: 5000,
        phase: 'request',
      },
    );
  }

  /**
   * Create a Connection Reset error
   *
   * Used when the facilitator resets the connection mid-request.
   *
   * @returns X402SettlementError with NETWORK_ERROR code
   */
  static connectionReset(): X402SettlementError {
    return new X402SettlementError(
      'Facilitator reset the connection',
      'NETWORK_ERROR',
      { errorMessage: 'ECONNRESET' },
      {
        canRetry: true,
        retryAfterMs: 1000,
        phase: 'request',
      },
    );
  }

  // ============================================================
  // Static Factory Methods - Facilitator Errors (502)
  // ============================================================

  /**
   * Create a Facilitator Rejection error
   *
   * Used when the facilitator returns an error response.
   * Retryability depends on the error code.
   *
   * @param response - Details from the facilitator response
   * @returns X402SettlementError with appropriate code
   */
  static facilitatorRejection(
    response: FacilitatorResponseDetails,
  ): X402SettlementError {
    const errorCode = X402SettlementError.mapFacilitatorErrorCode(
      response.errorCode,
    );

    const canRetry = X402SettlementError.isRetryableErrorCode(errorCode);

    return new X402SettlementError(
      response.errorMessage || `Facilitator rejected settlement: ${response.errorCode}`,
      errorCode,
      response,
      {
        canRetry,
        retryAfterMs: canRetry ? 1000 : undefined,
        phase: 'response',
      },
    );
  }

  /**
   * Create a Facilitator Unavailable error
   *
   * Used when the facilitator returns 503 Service Unavailable.
   *
   * @param retryAfterMs - Retry-After header value (if provided)
   * @param requestId - Optional request ID for tracking
   * @returns X402SettlementError with FACILITATOR_ERROR code
   */
  static facilitatorUnavailable(
    retryAfterMs?: number,
    requestId?: string,
  ): X402SettlementError {
    return new X402SettlementError(
      'Facilitator service is temporarily unavailable',
      'FACILITATOR_ERROR',
      {
        statusCode: 503,
        errorCode: 'SERVICE_UNAVAILABLE',
        requestId,
      },
      {
        canRetry: true,
        retryAfterMs: retryAfterMs || 5000,
        phase: 'response',
      },
    );
  }

  /**
   * Create a Facilitator Internal Error
   *
   * Used when the facilitator returns 500 Internal Server Error.
   *
   * @param response - Details from the facilitator response
   * @returns X402SettlementError with FACILITATOR_ERROR code
   */
  static facilitatorInternalError(
    response?: FacilitatorResponseDetails,
  ): X402SettlementError {
    return new X402SettlementError(
      'Facilitator experienced an internal error',
      'FACILITATOR_ERROR',
      {
        statusCode: 500,
        ...response,
      },
      {
        canRetry: true,
        retryAfterMs: 2000,
        phase: 'response',
      },
    );
  }

  /**
   * Create a Rate Limited error
   *
   * Used when the facilitator rate limits the request.
   *
   * @param retryAfterMs - Time to wait before retrying
   * @param requestId - Optional request ID for tracking
   * @returns X402SettlementError with FACILITATOR_ERROR code
   */
  static rateLimited(
    retryAfterMs?: number,
    requestId?: string,
  ): X402SettlementError {
    return new X402SettlementError(
      'Facilitator rate limited the request',
      'FACILITATOR_ERROR',
      {
        statusCode: 429,
        errorCode: 'RATE_LIMITED',
        requestId,
      },
      {
        canRetry: true,
        retryAfterMs: retryAfterMs || 10000,
        phase: 'response',
      },
    );
  }

  // ============================================================
  // Static Factory Methods - Non-Retryable Settlement Errors
  // ============================================================

  /**
   * Create an Invalid Signature error
   *
   * Used when the facilitator rejects the payment signature.
   * This is NOT retryable - the signature is invalid.
   *
   * @param response - Details from the facilitator response
   * @returns X402SettlementError with INVALID_SIGNATURE code
   */
  static invalidSignature(
    response?: FacilitatorResponseDetails,
  ): X402SettlementError {
    return new X402SettlementError(
      'Facilitator rejected payment: invalid signature',
      'INVALID_SIGNATURE',
      response,
      {
        canRetry: false,
        phase: 'response',
      },
    );
  }

  /**
   * Create an Insufficient Balance error
   *
   * Used when the payer doesn't have enough tokens.
   * This is NOT retryable - user needs to add funds.
   *
   * @param payer - The payer's address
   * @param response - Details from the facilitator response
   * @returns X402SettlementError with INSUFFICIENT_BALANCE code
   */
  static insufficientBalance(
    payer?: string,
    response?: FacilitatorResponseDetails,
  ): X402SettlementError {
    return new X402SettlementError(
      `Insufficient token balance${payer ? ` for ${payer}` : ''}`,
      'INSUFFICIENT_BALANCE',
      response,
      {
        canRetry: false,
        phase: 'response',
      },
    );
  }

  /**
   * Create a Nonce Already Used error
   *
   * Used when the authorization nonce has been used before.
   * This is NOT retryable - a new authorization is needed.
   *
   * @param nonce - The duplicate nonce
   * @param response - Details from the facilitator response
   * @returns X402SettlementError with NONCE_ALREADY_USED code
   */
  static nonceAlreadyUsed(
    nonce?: string,
    response?: FacilitatorResponseDetails,
  ): X402SettlementError {
    return new X402SettlementError(
      `Authorization nonce has already been used${nonce ? `: ${nonce}` : ''}`,
      'NONCE_ALREADY_USED',
      response,
      {
        canRetry: false,
        phase: 'response',
      },
    );
  }

  /**
   * Create an Expired Authorization error
   *
   * Used when the authorization has passed its validBefore time.
   * This is NOT retryable - a new authorization is needed.
   *
   * @param validBefore - The expiration timestamp
   * @param response - Details from the facilitator response
   * @returns X402SettlementError with EXPIRED_AUTHORIZATION code
   */
  static expiredAuthorization(
    validBefore?: string | number,
    response?: FacilitatorResponseDetails,
  ): X402SettlementError {
    return new X402SettlementError(
      `Authorization has expired${validBefore ? `: validBefore=${validBefore}` : ''}`,
      'EXPIRED_AUTHORIZATION',
      response,
      {
        canRetry: false,
        phase: 'response',
      },
    );
  }

  /**
   * Create an Invalid Token error
   *
   * Used when the token is not supported by the facilitator.
   * This is NOT retryable - configuration issue.
   *
   * @param tokenAddress - The invalid token address
   * @param response - Details from the facilitator response
   * @returns X402SettlementError with INVALID_TOKEN code
   */
  static invalidToken(
    tokenAddress?: string,
    response?: FacilitatorResponseDetails,
  ): X402SettlementError {
    return new X402SettlementError(
      `Token not supported${tokenAddress ? `: ${tokenAddress}` : ''}`,
      'INVALID_TOKEN',
      response,
      {
        canRetry: false,
        phase: 'response',
      },
    );
  }

  /**
   * Create an Unsupported Chain error
   *
   * Used when the chain is not supported by the facilitator.
   * This is NOT retryable - configuration issue.
   *
   * @param chainId - The unsupported chain ID
   * @param response - Details from the facilitator response
   * @returns X402SettlementError with UNSUPPORTED_CHAIN code
   */
  static unsupportedChain(
    chainId?: number,
    response?: FacilitatorResponseDetails,
  ): X402SettlementError {
    return new X402SettlementError(
      `Chain not supported${chainId ? `: ${chainId}` : ''}`,
      'UNSUPPORTED_CHAIN',
      response,
      {
        canRetry: false,
        phase: 'response',
      },
    );
  }

  // ============================================================
  // Static Utility Methods
  // ============================================================

  /**
   * Map facilitator error code to X402SettlementErrorCode
   *
   * Converts error codes from the facilitator API to standard error codes.
   *
   * @param code - The facilitator error code
   * @returns Standardized X402SettlementErrorCode
   */
  static mapFacilitatorErrorCode(
    code: string | undefined,
  ): X402SettlementErrorCode {
    if (!code) return 'FACILITATOR_ERROR';

    const codeMap: Record<string, X402SettlementErrorCode> = {
      INVALID_SIGNATURE: 'INVALID_SIGNATURE',
      BAD_SIGNATURE: 'INVALID_SIGNATURE',
      EXPIRED_AUTHORIZATION: 'EXPIRED_AUTHORIZATION',
      AUTHORIZATION_EXPIRED: 'EXPIRED_AUTHORIZATION',
      INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
      INSUFFICIENT_FUNDS: 'INSUFFICIENT_BALANCE',
      NONCE_ALREADY_USED: 'NONCE_ALREADY_USED',
      NONCE_USED: 'NONCE_ALREADY_USED',
      INVALID_TOKEN: 'INVALID_TOKEN',
      UNSUPPORTED_TOKEN: 'INVALID_TOKEN',
      UNSUPPORTED_CHAIN: 'UNSUPPORTED_CHAIN',
      INVALID_CHAIN: 'UNSUPPORTED_CHAIN',
      TIMEOUT: 'TIMEOUT',
      NETWORK_ERROR: 'NETWORK_ERROR',
    };

    return codeMap[code.toUpperCase()] || 'FACILITATOR_ERROR';
  }

  /**
   * Check if an error code is retryable
   *
   * Some errors are inherently non-retryable (e.g., invalid signature).
   *
   * @param code - The error code to check
   * @returns True if the error could be resolved by retrying
   */
  static isRetryableErrorCode(code: X402SettlementErrorCode): boolean {
    const nonRetryable: X402SettlementErrorCode[] = [
      'INVALID_SIGNATURE',
      'EXPIRED_AUTHORIZATION',
      'INSUFFICIENT_BALANCE',
      'NONCE_ALREADY_USED',
      'INVALID_TOKEN',
      'UNSUPPORTED_CHAIN',
    ];

    return !nonRetryable.includes(code);
  }

  /**
   * Create an X402SettlementError from an unknown error
   *
   * Wraps any error as an X402SettlementError for consistent handling.
   *
   * @param error - The error to wrap
   * @param requestId - Optional request ID for tracking
   * @returns X402SettlementError instance
   */
  static fromError(error: unknown, requestId?: string): X402SettlementError {
    if (error instanceof X402SettlementError) {
      return error;
    }

    if (error instanceof X402Error) {
      return new X402SettlementError(
        error.message,
        (error.errorCode as X402SettlementErrorCode) || 'FACILITATOR_ERROR',
        {
          requestId,
          errorMessage: error.message,
        },
        {
          canRetry: false,
          phase: 'unknown',
        },
      );
    }

    if (error instanceof Error) {
      // Check for common network error patterns
      const message = error.message.toLowerCase();

      if (message.includes('timeout') || message.includes('etimedout')) {
        return X402SettlementError.timeout(undefined, requestId);
      }

      if (message.includes('econnrefused')) {
        return X402SettlementError.connectionRefused();
      }

      if (message.includes('econnreset')) {
        return X402SettlementError.connectionReset();
      }

      if (message.includes('enotfound') || message.includes('getaddrinfo')) {
        return X402SettlementError.dnsError('facilitator');
      }

      return X402SettlementError.networkError(error, requestId);
    }

    return new X402SettlementError(
      String(error),
      'FACILITATOR_ERROR',
      { requestId, errorMessage: String(error) },
      {
        canRetry: false,
        phase: 'unknown',
      },
    );
  }

  /**
   * Create from HTTP response
   *
   * Parses an HTTP response and creates an appropriate settlement error.
   *
   * @param statusCode - HTTP status code
   * @param body - Response body
   * @param requestId - Optional request ID for tracking
   * @param requestDurationMs - Optional request duration
   * @returns X402SettlementError instance
   */
  static fromHttpResponse(
    statusCode: number,
    body: unknown,
    requestId?: string,
    requestDurationMs?: number,
  ): X402SettlementError {
    const response: FacilitatorResponseDetails = {
      statusCode,
      requestId,
      requestDurationMs,
      rawResponse: body,
    };

    // Extract error details from body
    if (body && typeof body === 'object') {
      const bodyObj = body as Record<string, unknown>;
      if (bodyObj.error && typeof bodyObj.error === 'object') {
        const errorObj = bodyObj.error as Record<string, unknown>;
        response.errorCode = String(errorObj.code || '');
        response.errorMessage = String(errorObj.message || '');
      } else if (bodyObj.code) {
        response.errorCode = String(bodyObj.code);
        response.errorMessage = String(bodyObj.message || '');
      }
    }

    // Handle specific HTTP status codes
    if (statusCode === 429) {
      return X402SettlementError.rateLimited(undefined, requestId);
    }

    if (statusCode === 503) {
      return X402SettlementError.facilitatorUnavailable(undefined, requestId);
    }

    if (statusCode === 500) {
      return X402SettlementError.facilitatorInternalError(response);
    }

    if (statusCode >= 500) {
      return new X402SettlementError(
        `Facilitator server error: ${statusCode}`,
        'FACILITATOR_ERROR',
        response,
        {
          canRetry: true,
          retryAfterMs: 2000,
          phase: 'response',
        },
      );
    }

    // 4xx errors are typically not retryable
    return X402SettlementError.facilitatorRejection(response);
  }

  /**
   * Check if an error is an X402SettlementError
   *
   * Type guard for error handling.
   *
   * @param error - The error to check
   * @returns True if error is an X402SettlementError
   */
  static isSettlementError(error: unknown): error is X402SettlementError {
    return error instanceof X402SettlementError;
  }

  /**
   * Get all settlement error codes
   *
   * Returns an array of all X402SettlementErrorCode values.
   *
   * @returns Array of settlement error codes
   */
  static getSettlementErrorCodes(): X402SettlementErrorCode[] {
    return [
      'INVALID_SIGNATURE',
      'EXPIRED_AUTHORIZATION',
      'INSUFFICIENT_BALANCE',
      'NONCE_ALREADY_USED',
      'INVALID_TOKEN',
      'UNSUPPORTED_CHAIN',
      'FACILITATOR_ERROR',
      'NETWORK_ERROR',
      'TIMEOUT',
    ];
  }
}
