/**
 * x402 Payment Middleware Types
 *
 * Type definitions for the x402 HTTP payment protocol implementation.
 * x402 enables gasless micropayments using EIP-3009 signed authorizations.
 *
 * @module server/x402/types
 * @see https://eips.ethereum.org/EIPS/eip-3009 - Transfer With Authorization
 */

import type { Request, Response, NextFunction } from 'express';
import type {
  EIP712Domain,
  TransferWithAuthorizationMessage,
  SignedTransferWithAuthorization,
} from '../../lib/chain/constants.js';
import {
  isValidAddress,
  formatUSDC,
  getUsdcEip712Domain,
  getTxUrl,
  USDC_NAME,
  USDC_DECIMALS,
  USDC_VERSION,
  CRONOS_TESTNET_CHAIN_ID,
  getUsdcContractAddress,
  getFacilitatorBaseUrl,
} from '../../lib/chain/constants.js';
import { X402ValidationError } from './errors.js';

/**
 * x402 Middleware Configuration
 *
 * Configuration options for setting up the x402 payment middleware.
 * This interface defines all the parameters needed to process x402 payments.
 *
 * @example
 * ```typescript
 * const config: X402Config = {
 *   payTo: '0x1234...5678', // Arcade wallet address
 *   paymentAmount: parseUSDC(0.01), // 1 cent in smallest units
 *   tokenAddress: USDC_CONTRACT_ADDRESS,
 *   tokenName: USDC_NAME,
 *   tokenDecimals: USDC_DECIMALS,
 *   facilitatorUrl: getFacilitatorBaseUrl(),
 *   chainId: CRONOS_TESTNET_CHAIN_ID,
 * };
 * ```
 */
export interface X402Config {
  /**
   * The recipient address for payments (arcade wallet)
   * Must be a valid Ethereum address format (0x + 40 hex chars)
   */
  payTo: string;

  /**
   * The payment amount in token's smallest units (e.g., 10000 for $0.01 USDC)
   * Can be a bigint or string for uint256 compatibility
   */
  paymentAmount: bigint | string;

  /**
   * The ERC-20 token contract address for payments
   * Must support EIP-3009 transferWithAuthorization
   */
  tokenAddress: string;

  /**
   * The token name for EIP-712 domain construction
   * Must match the deployed contract's name() function
   */
  tokenName: string;

  /**
   * The token decimals for display purposes
   * USDC uses 6 decimals, most tokens use 18
   */
  tokenDecimals: number;

  /**
   * The token version for EIP-712 domain construction
   * Must match the deployed contract's domain separator version
   * @default '1' for testnet, '2' for mainnet
   */
  tokenVersion?: string;

  /**
   * The x402 facilitator service URL for payment settlement
   * The facilitator executes the signed authorization on-chain
   */
  facilitatorUrl: string;

  /**
   * The blockchain chain ID for transaction validation
   * Used in EIP-712 domain to prevent cross-chain replay attacks
   */
  chainId: number;

  /**
   * Optional: Maximum age of payment authorization in seconds
   * Rejects authorizations with validBefore too far in the future
   * @default 3600 (1 hour)
   */
  maxAuthorizationAge?: number;

  /**
   * Optional: Minimum validity window for authorization in seconds
   * Rejects authorizations that expire too soon
   * @default 60 (1 minute)
   */
  minValidityWindow?: number;

  /**
   * Optional: Enable debug logging for payment processing
   * @default false
   */
  debug?: boolean;
}

/**
 * x402 Payment Requirement Response
 *
 * The response payload returned with HTTP 402 Payment Required status.
 * Contains all information the client needs to construct a valid payment.
 */
export interface X402PaymentRequirement {
  /**
   * Protocol version identifier
   */
  x402Version: '1';

  /**
   * Array of accepted payment schemes (currently only 'exact' supported)
   */
  accepts: Array<{
    /**
     * Payment scheme identifier
     */
    scheme: 'exact';

    /**
     * Network/chain identifier
     */
    network: string;

    /**
     * Required payment amount in smallest units
     */
    maxAmountRequired: string;

    /**
     * Resource being purchased (route or description)
     */
    resource: string;

    /**
     * Human-readable description of the payment
     */
    description?: string;

    /**
     * MIME type of the response after successful payment
     */
    mimeType?: string;

    /**
     * Address to receive the payment
     */
    payTo: string;

    /**
     * Timestamp after which payment is no longer accepted
     */
    maxTimeoutSeconds?: number;

    /**
     * Token contract details
     */
    asset: {
      address: string;
      name: string;
      decimals: number;
      symbol: string;
    };

    /**
     * EIP-712 domain for signing
     */
    eip712Domain: EIP712Domain;
  }>;
}

/**
 * HTTP 402 Payment Required Response Body
 *
 * The complete response body returned when a protected endpoint is accessed
 * without valid payment. This interface provides a cleaner, domain-specific
 * view of the 402 response that includes chainId and tokenAddress explicitly.
 *
 * **HTTP Response:**
 * ```
 * HTTP/1.1 402 Payment Required
 * Content-Type: application/json
 *
 * {
 *   "x402Version": "1",
 *   "accepts": [...],
 *   "amount": "10000",
 *   "currency": "USDC",
 *   "payTo": "0x...",
 *   "chainId": 338,
 *   "tokenAddress": "0x...",
 *   "description": "Pay to play Snake game",
 *   "resource": "/api/play/snake"
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Creating a 402 response
 * const response: PaymentRequiredResponse = {
 *   x402Version: '1',
 *   accepts: [{
 *     scheme: 'exact',
 *     network: 'cronos-testnet',
 *     maxAmountRequired: '10000',
 *     resource: '/api/play/snake',
 *     payTo: arcadeWallet,
 *     asset: { address: USDC_ADDRESS, name: 'USDC', decimals: 6, symbol: 'USDC' },
 *     eip712Domain: { ... }
 *   }],
 *   amount: '10000',
 *   currency: 'USDC',
 *   payTo: arcadeWallet,
 *   chainId: 338,
 *   tokenAddress: USDC_ADDRESS,
 *   description: 'Pay to play Snake game',
 *   resource: '/api/play/snake'
 * };
 * ```
 */
export interface PaymentRequiredResponse {
  /**
   * Protocol version identifier
   */
  x402Version: '1';

  /**
   * Array of accepted payment methods (from X402PaymentRequirement)
   * Contains detailed payment scheme information
   */
  accepts: X402PaymentRequirement['accepts'];

  /**
   * Payment amount in token's smallest units (e.g., "10000" for $0.01 USDC)
   * String representation for uint256 compatibility
   */
  amount: string;

  /**
   * Token symbol (e.g., "USDC")
   * Human-readable currency identifier
   */
  currency: string;

  /**
   * The recipient address for payments (arcade wallet)
   * Must be a valid Ethereum address format (0x + 40 hex chars)
   */
  payTo: string;

  /**
   * The blockchain chain ID for the payment
   * Used to ensure payment is made on the correct network
   * @example 338 for Cronos Testnet
   */
  chainId: number;

  /**
   * The ERC-20 token contract address supporting EIP-3009
   * @example '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0' for devUSDC.e
   */
  tokenAddress: string;

  /**
   * Human-readable description of the payment
   * @example "Pay $0.01 to play Snake"
   */
  description?: string;

  /**
   * The resource being purchased (typically the route path)
   * @example "/api/play/snake"
   */
  resource?: string;

  /**
   * Maximum time in seconds the payment offer is valid
   * @default 3600 (1 hour)
   */
  maxTimeoutSeconds?: number;
}

/**
 * Create a PaymentRequiredResponse from X402 configuration
 *
 * Factory function to construct the 402 response body from the
 * middleware configuration. Used by the x402 middleware when
 * returning a 402 Payment Required response.
 *
 * @param config - The X402 middleware configuration
 * @param resource - The resource path being accessed
 * @param description - Optional description of the payment
 * @returns PaymentRequiredResponse ready to send as JSON
 *
 * @example
 * ```typescript
 * const response = createPaymentRequiredResponse(
 *   x402Config,
 *   '/api/play/snake',
 *   'Pay $0.01 to play Snake game'
 * );
 * res.status(402).json(response);
 * ```
 */
export function createPaymentRequiredResponse(
  config: X402Config,
  resource: string,
  description?: string
): PaymentRequiredResponse {
  const amount =
    typeof config.paymentAmount === 'bigint'
      ? config.paymentAmount.toString()
      : String(config.paymentAmount);

  const eip712Domain = getUsdcEip712Domain();

  return {
    x402Version: '1',
    accepts: [
      {
        scheme: 'exact',
        network: `cronos-${config.chainId === 338 ? 'testnet' : 'mainnet'}`,
        maxAmountRequired: amount,
        resource,
        description,
        payTo: config.payTo,
        asset: {
          address: config.tokenAddress,
          name: config.tokenName,
          decimals: config.tokenDecimals,
          symbol: 'USDC',
        },
        eip712Domain,
      },
    ],
    amount,
    currency: 'USDC',
    payTo: config.payTo,
    chainId: config.chainId,
    tokenAddress: config.tokenAddress,
    description,
    resource,
    maxTimeoutSeconds: config.maxAuthorizationAge || 3600,
  };
}

/**
 * x402 Payment Header (X-Payment)
 *
 * The payment header sent by the client to fulfill a 402 requirement.
 * Contains the signed EIP-3009 authorization and payment version.
 */
export interface X402PaymentHeader {
  /**
   * Protocol version (must match x402Version from requirement)
   */
  x402Version: '1';

  /**
   * Payment scheme being used
   */
  scheme: 'exact';

  /**
   * Network/chain being used for payment
   */
  network: string;

  /**
   * The signed authorization payload
   */
  payload: SignedTransferWithAuthorization;
}

/**
 * x402 Payment Payload (Decoded X-Payment Header Content)
 *
 * The fully decoded and flattened payment payload from the X-Payment header.
 * This interface provides a convenient flat structure for working with
 * payment data, combining the authorization message and signature fields.
 *
 * @example
 * ```typescript
 * // Decoding from X-Payment header
 * const header = req.headers['x-payment'];
 * const decoded = JSON.parse(Buffer.from(header, 'base64').toString());
 * const payload: PaymentPayload = {
 *   version: decoded.x402Version,
 *   scheme: decoded.scheme,
 *   network: decoded.network,
 *   from: decoded.payload.message.from,
 *   to: decoded.payload.message.to,
 *   value: decoded.payload.message.value,
 *   validAfter: decoded.payload.message.validAfter,
 *   validBefore: decoded.payload.message.validBefore,
 *   nonce: decoded.payload.message.nonce,
 *   v: decoded.payload.v,
 *   r: decoded.payload.r,
 *   s: decoded.payload.s,
 * };
 * ```
 */
export interface PaymentPayload {
  /**
   * Protocol version identifier
   */
  version: '1';

  /**
   * Payment scheme (currently only 'exact' supported)
   */
  scheme: 'exact';

  /**
   * Network/chain identifier (e.g., 'cronos-testnet')
   */
  network: string;

  /**
   * Sender's address (the player paying)
   * Must be a valid Ethereum address (0x + 40 hex chars)
   */
  from: string;

  /**
   * Recipient's address (the arcade wallet)
   * Must be a valid Ethereum address (0x + 40 hex chars)
   */
  to: string;

  /**
   * Payment value in token's smallest units
   * Represented as a string for uint256 compatibility
   */
  value: string;

  /**
   * Unix timestamp (seconds) after which the authorization is valid
   * Typically '0' for immediate validity
   */
  validAfter: string;

  /**
   * Unix timestamp (seconds) before which the authorization is valid
   * Authorization expires after this time
   */
  validBefore: string;

  /**
   * Unique 32-byte nonce to prevent replay attacks
   * Hex string with 0x prefix (66 characters total)
   */
  nonce: string;

  /**
   * ECDSA signature recovery identifier (27 or 28)
   */
  v: number;

  /**
   * First 32 bytes of the ECDSA signature
   * Hex string with 0x prefix
   */
  r: string;

  /**
   * Second 32 bytes of the ECDSA signature
   * Hex string with 0x prefix
   */
  s: string;
}

/**
 * Convert X402PaymentHeader to flat PaymentPayload
 *
 * Extracts and flattens the payment data from the structured header format
 * into a more convenient flat interface for processing.
 *
 * @param header - The X402PaymentHeader to convert
 * @returns Flattened PaymentPayload
 *
 * @example
 * ```typescript
 * const payload = headerToPayload(x402Header);
 * console.log(payload.from, payload.to, payload.value);
 * ```
 */
export function headerToPayload(header: X402PaymentHeader): PaymentPayload {
  // Bug #1 fix: Handle both old (with message wrapper) and new (flat) structures
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload = header.payload as any;
  const message = payload.message || payload; // Use message if exists, otherwise use payload directly

  // Bug #7 fix: Handle combined signature (new) or split v/r/s (old)
  let v: number, r: string, s: string;

  if (payload.signature) {
    // New format: combined signature "0x{r}{s}{v}"
    const sig = payload.signature.startsWith('0x') ? payload.signature.slice(2) : payload.signature;
    // Signature is 65 bytes: r (32) + s (32) + v (1)
    r = '0x' + sig.slice(0, 64);
    s = '0x' + sig.slice(64, 128);
    v = parseInt(sig.slice(128, 130), 16);
  } else {
    // Old format: separate v/r/s fields
    v = payload.v;
    r = payload.r;
    s = payload.s;
  }

  return {
    version: header.x402Version,
    scheme: header.scheme,
    network: header.network,
    from: message.from,
    to: message.to,
    value: typeof message.value === 'bigint' ? message.value.toString() : String(message.value),
    validAfter:
      typeof message.validAfter === 'bigint'
        ? message.validAfter.toString()
        : String(message.validAfter),
    validBefore:
      typeof message.validBefore === 'bigint'
        ? message.validBefore.toString()
        : String(message.validBefore),
    nonce: message.nonce,
    v,
    r,
    s,
  };
}

/**
 * Convert flat PaymentPayload back to X402PaymentHeader format
 *
 * Reconstructs the structured header format from a flat payload.
 * Useful for creating test data or reconstructing headers.
 *
 * @param payload - The PaymentPayload to convert
 * @returns Structured X402PaymentHeader
 */
export function payloadToHeader(payload: PaymentPayload): X402PaymentHeader {
  return {
    x402Version: payload.version,
    scheme: payload.scheme,
    network: payload.network,
    payload: {
      message: {
        from: payload.from,
        to: payload.to,
        value: payload.value,
        validAfter: payload.validAfter,
        validBefore: payload.validBefore,
        nonce: payload.nonce,
      },
      v: payload.v,
      r: payload.r,
      s: payload.s,
    },
  };
}

/**
 * Options for creating a PaymentPayload
 *
 * Provides a structured way to specify all the components needed
 * to construct a complete payment payload for the X-Payment header.
 */
export interface CreatePaymentPayloadOptions {
  /**
   * Message fields from the EIP-3009 TransferWithAuthorization
   */
  message: {
    /**
     * Sender's address (the player paying)
     * Must be a valid Ethereum address (0x + 40 hex chars)
     */
    from: string;

    /**
     * Recipient's address (the arcade wallet)
     * Must be a valid Ethereum address (0x + 40 hex chars)
     */
    to: string;

    /**
     * Payment value in token's smallest units
     * Can be bigint, number, or string for flexibility
     */
    value: bigint | number | string;

    /**
     * Unix timestamp (seconds) after which the authorization is valid
     * Typically '0' for immediate validity
     * Can be number or string
     */
    validAfter: number | string;

    /**
     * Unix timestamp (seconds) before which the authorization is valid
     * Authorization expires after this time
     * Can be number or string
     */
    validBefore: number | string;

    /**
     * Unique 32-byte nonce to prevent replay attacks
     * Hex string with 0x prefix (66 characters total)
     */
    nonce: string;
  };

  /**
   * ECDSA signature components
   */
  signature: {
    /**
     * Signature recovery identifier
     * Can be 27, 28 (legacy) or EIP-155 values (chainId * 2 + 35/36)
     */
    v: number;

    /**
     * First 32 bytes of the ECDSA signature
     * Hex string with 0x prefix
     */
    r: string;

    /**
     * Second 32 bytes of the ECDSA signature
     * Hex string with 0x prefix
     */
    s: string;
  };

  /**
   * Network identifier
   * @default 'cronos-testnet'
   */
  network?: string;
}

/**
 * Create a PaymentPayload from message and signature components
 *
 * Constructs a complete PaymentPayload that can be used to create
 * an X-Payment header for x402 payment requests.
 *
 * This function handles:
 * - Converting bigint/number values to strings
 * - Setting default version ('1') and scheme ('exact')
 * - Setting default network if not provided
 *
 * @param options - The message fields and signature components
 * @returns A complete PaymentPayload ready for use
 *
 * @example
 * ```typescript
 * // Create a payment payload from signature data
 * const payload = createPaymentPayload({
 *   message: {
 *     from: '0x1234567890abcdef1234567890abcdef12345678',
 *     to: '0xabcdef1234567890abcdef1234567890abcdef12',
 *     value: 10000n, // $0.01 in USDC smallest units
 *     validAfter: 0,
 *     validBefore: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
 *     nonce: '0x' + '1234'.repeat(16),
 *   },
 *   signature: {
 *     v: 27,
 *     r: '0x' + 'ab'.repeat(32),
 *     s: '0x' + 'cd'.repeat(32),
 *   },
 *   network: 'cronos-testnet',
 * });
 *
 * // Convert to X402PaymentHeader and encode for X-Payment header
 * const header = payloadToHeader(payload);
 * const encoded = Buffer.from(JSON.stringify(header)).toString('base64');
 * ```
 */
export function createPaymentPayload(options: CreatePaymentPayloadOptions): PaymentPayload {
  const { message, signature, network = 'cronos-testnet' } = options;

  // Convert value to string (handles bigint, number, string)
  const valueString =
    typeof message.value === 'bigint' ? message.value.toString() : String(message.value);

  // Convert timestamps to strings
  const validAfterString =
    typeof message.validAfter === 'number'
      ? message.validAfter.toString()
      : String(message.validAfter);

  const validBeforeString =
    typeof message.validBefore === 'number'
      ? message.validBefore.toString()
      : String(message.validBefore);

  return {
    // Protocol metadata
    version: '1',
    scheme: 'exact',
    network,

    // Message fields
    from: message.from,
    to: message.to,
    value: valueString,
    validAfter: validAfterString,
    validBefore: validBeforeString,
    nonce: message.nonce,

    // Signature components
    v: signature.v,
    r: signature.r,
    s: signature.s,
  };
}

/**
 * Encode a PaymentPayload as a base64 X-Payment header string
 *
 * Converts a PaymentPayload to the X402PaymentHeader format and encodes it
 * as base64 for use in the X-Payment HTTP header.
 *
 * This is the complete pipeline for constructing a payment header:
 * 1. PaymentPayload → X402PaymentHeader (via payloadToHeader)
 * 2. X402PaymentHeader → JSON string
 * 3. JSON string → Base64 encoded string
 *
 * @param payload - The PaymentPayload to encode
 * @returns Base64-encoded X-Payment header string
 *
 * @example
 * ```typescript
 * // Create and encode a payment payload for an HTTP request
 * const payload = createPaymentPayload({
 *   message: { from, to, value, validAfter, validBefore, nonce },
 *   signature: { v, r, s },
 * });
 *
 * const xPaymentHeader = encodePaymentPayload(payload);
 *
 * // Use in fetch request
 * const response = await fetch('/api/play/snake', {
 *   method: 'POST',
 *   headers: {
 *     'X-Payment': xPaymentHeader,
 *   },
 * });
 * ```
 */
export function encodePaymentPayload(payload: PaymentPayload): string {
  // Convert to structured header format
  const header = payloadToHeader(payload);
  // Encode as JSON then base64
  const json = JSON.stringify(header);
  return Buffer.from(json).toString('base64');
}

/**
 * PaymentPayload field schema definition
 *
 * Describes all required fields in a PaymentPayload for validation
 * and error reporting purposes.
 */
export const PAYMENT_PAYLOAD_SCHEMA = {
  requiredFields: [
    { name: 'version', type: 'string', description: "Protocol version (must be '1')" },
    { name: 'scheme', type: 'string', description: "Payment scheme (must be 'exact')" },
    {
      name: 'network',
      type: 'string',
      description: 'Network/chain identifier (e.g., cronos-testnet)',
    },
    { name: 'from', type: 'string', description: 'Sender address (0x + 40 hex chars)' },
    { name: 'to', type: 'string', description: 'Recipient address (0x + 40 hex chars)' },
    {
      name: 'value',
      type: 'string',
      description: 'Payment amount in smallest units (positive integer string)',
    },
    {
      name: 'validAfter',
      type: 'string',
      description: 'Unix timestamp (seconds) after which authorization is valid',
    },
    {
      name: 'validBefore',
      type: 'string',
      description: 'Unix timestamp (seconds) before which authorization is valid',
    },
    { name: 'nonce', type: 'string', description: 'Unique 32-byte nonce (0x + 64 hex chars)' },
    {
      name: 'v',
      type: 'number',
      description: 'ECDSA signature recovery id (27, 28, or EIP-155 value)',
    },
    { name: 'r', type: 'string', description: 'ECDSA signature r component (0x + 64 hex chars)' },
    { name: 's', type: 'string', description: 'ECDSA signature s component (0x + 64 hex chars)' },
  ] as const,
} as const;

/**
 * Check for missing required fields in a PaymentPayload
 *
 * Validates that all required fields are present (not undefined/null/empty).
 * This should be called before validatePaymentPayload() to provide better
 * error messages for missing vs invalid fields.
 *
 * @param obj - The object to check (typically from JSON.parse)
 * @returns Result with list of missing fields and schema information
 *
 * @example
 * ```typescript
 * const result = checkMissingPayloadFields({ version: '1' });
 * if (!result.valid) {
 *   // result.missingFields = ['scheme', 'network', 'from', ...]
 *   // result.schema contains field definitions for error response
 * }
 * ```
 */
export function checkMissingPayloadFields(obj: Record<string, unknown>): {
  valid: boolean;
  missingFields: string[];
  schema: typeof PAYMENT_PAYLOAD_SCHEMA;
} {
  const missingFields: string[] = [];

  for (const field of PAYMENT_PAYLOAD_SCHEMA.requiredFields) {
    const value = obj[field.name];

    // Check for missing (undefined, null) or empty string
    if (value === undefined || value === null) {
      missingFields.push(field.name);
    } else if (field.type === 'string' && value === '') {
      missingFields.push(field.name);
    }
  }

  return {
    valid: missingFields.length === 0,
    missingFields,
    schema: PAYMENT_PAYLOAD_SCHEMA,
  };
}

/**
 * Validate an ECDSA signature v value
 *
 * The v value can be:
 * - 27 or 28 (legacy recovery id)
 * - EIP-155 values: chainId * 2 + 35 or chainId * 2 + 36
 *
 * EIP-155 v values for common chains:
 * - Cronos Testnet (338): 711, 712
 * - Cronos Mainnet (25): 85, 86
 * - Ethereum Mainnet (1): 37, 38
 *
 * @param v - The v value to validate
 * @param chainId - Optional chainId for strict EIP-155 validation
 * @returns true if v is a valid signature recovery value
 *
 * @example
 * ```typescript
 * isValidSignatureV(27)    // => true (legacy)
 * isValidSignatureV(28)    // => true (legacy)
 * isValidSignatureV(711)   // => true (EIP-155 for chainId 338)
 * isValidSignatureV(712)   // => true (EIP-155 for chainId 338)
 * isValidSignatureV(0)     // => false (invalid)
 * isValidSignatureV(26)    // => false (invalid)
 * ```
 */
export function isValidSignatureV(v: number, chainId?: number): boolean {
  // Must be a positive integer
  if (!Number.isInteger(v) || v < 0) {
    return false;
  }

  // Legacy v values (pre-EIP-155)
  if (v === 27 || v === 28) {
    return true;
  }

  // EIP-155 v values: v = chainId * 2 + 35 or v = chainId * 2 + 36
  // For any v >= 35, we can derive the chainId and parity
  if (v >= 35) {
    // If a specific chainId is provided, validate against it
    if (chainId !== undefined) {
      const expectedV1 = chainId * 2 + 35;
      const expectedV2 = chainId * 2 + 36;
      return v === expectedV1 || v === expectedV2;
    }

    // Otherwise, check that v follows the EIP-155 pattern
    // v - 35 should be even (for recovery id 0) or v - 36 should be even (for recovery id 1)
    const possibleChainId1 = (v - 35) / 2; // If recovery id is 0
    const possibleChainId2 = (v - 36) / 2; // If recovery id is 1

    // At least one should result in a valid positive integer chainId
    return (
      (Number.isInteger(possibleChainId1) && possibleChainId1 > 0) ||
      (Number.isInteger(possibleChainId2) && possibleChainId2 > 0)
    );
  }

  return false;
}

/**
 * Normalize an EIP-155 v value to legacy format (27 or 28)
 *
 * Converts EIP-155 v values to standard 27/28 format for signature verification.
 *
 * @param v - The v value to normalize
 * @returns 27 or 28
 * @throws Error if v is not a valid signature v value
 *
 * @example
 * ```typescript
 * normalizeSignatureV(27)   // => 27
 * normalizeSignatureV(28)   // => 28
 * normalizeSignatureV(711)  // => 27 (chainId 338, recovery id 0)
 * normalizeSignatureV(712)  // => 28 (chainId 338, recovery id 1)
 * ```
 */
export function normalizeSignatureV(v: number): 27 | 28 {
  if (v === 27 || v === 28) {
    return v;
  }

  if (v >= 35) {
    // EIP-155: recovery_id = v - (chainId * 2 + 35)
    // If (v - 35) is even, recovery_id is 0 (maps to 27)
    // If (v - 35) is odd, recovery_id is 1 (maps to 28)
    const recoveryId = (v - 35) % 2;
    return recoveryId === 0 ? 27 : 28;
  }

  throw new Error(`Invalid signature v value: ${v}`);
}

/**
 * Validate a PaymentPayload structure
 *
 * Checks that all required fields are present and have valid formats.
 *
 * @param payload - The payload to validate
 * @returns Validation result with error details if invalid
 */
export function validatePaymentPayload(payload: PaymentPayload): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Version check
  if (payload.version !== '1') {
    errors.push(`Invalid version: ${payload.version}, expected '1'`);
  }

  // Scheme check
  if (payload.scheme !== 'exact') {
    errors.push(`Invalid scheme: ${payload.scheme}, expected 'exact'`);
  }

  // Network check
  if (!payload.network || typeof payload.network !== 'string') {
    errors.push('Missing or invalid network');
  }

  // Address validation
  if (!isValidAddress(payload.from)) {
    errors.push(`Invalid 'from' address: ${payload.from}`);
  }

  if (!isValidAddress(payload.to)) {
    errors.push(`Invalid 'to' address: ${payload.to}`);
  }

  // Value validation (must be positive number string)
  if (!payload.value || !/^\d+$/.test(payload.value)) {
    errors.push(`Invalid value: ${payload.value}`);
  } else if (BigInt(payload.value) <= 0n) {
    errors.push('Value must be positive');
  }

  // Timestamp validation
  if (!payload.validAfter || !/^\d+$/.test(payload.validAfter)) {
    errors.push(`Invalid validAfter: ${payload.validAfter}`);
  }

  if (!payload.validBefore || !/^\d+$/.test(payload.validBefore)) {
    errors.push(`Invalid validBefore: ${payload.validBefore}`);
  }

  // Nonce validation (0x + 64 hex chars = 66 total)
  if (!/^0x[a-fA-F0-9]{64}$/.test(payload.nonce)) {
    errors.push(`Invalid nonce format: ${payload.nonce}`);
  }

  // Signature validation
  // v can be 27, 28 (legacy) or EIP-155 values (chainId * 2 + 35 or chainId * 2 + 36)
  // EIP-155 v values for common chains:
  //   Cronos Testnet (338): 711, 712
  //   Cronos Mainnet (25): 85, 86
  //   Ethereum (1): 37, 38
  if (!isValidSignatureV(payload.v)) {
    errors.push(`Invalid v value: ${payload.v}, expected 27, 28, or valid EIP-155 value`);
  }

  // r and s must be exactly 32 bytes (64 hex chars) with 0x prefix
  if (!/^0x[a-fA-F0-9]{64}$/.test(payload.r)) {
    errors.push(
      `Invalid r value format: ${payload.r}, expected 0x-prefixed 64 hex characters (32 bytes)`
    );
  }

  if (!/^0x[a-fA-F0-9]{64}$/.test(payload.s)) {
    errors.push(
      `Invalid s value format: ${payload.s}, expected 0x-prefixed 64 hex characters (32 bytes)`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Parse payment payload from JSON string
 *
 * Parses a JSON string representation of a payment payload and validates
 * it against the PaymentPayload schema. This is the main entry point for
 * processing incoming X-Payment headers after base64 decoding.
 *
 * @param jsonString - The JSON string to parse
 * @returns Typed and validated PaymentPayload object
 * @throws {X402ValidationError} If JSON parsing fails or validation fails
 *
 * @example
 * ```typescript
 * // Typical usage flow:
 * const base64Header = req.headers['x-payment'];
 * const jsonString = Buffer.from(base64Header, 'base64').toString('utf-8');
 *
 * try {
 *   const payload = parsePaymentPayload(jsonString);
 *   // Payload is typed and validated
 *   console.log(payload.from, payload.to, payload.value);
 * } catch (error) {
 *   if (error instanceof X402ValidationError) {
 *     console.error('Invalid payment:', error.field, error.expected, error.actual);
 *   }
 * }
 * ```
 */
export function parsePaymentPayload(jsonString: string): PaymentPayload {
  // Step 1: Parse JSON string to object
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (error) {
    throw X402ValidationError.invalidJson(
      error instanceof Error ? error.message : 'Invalid JSON format'
    );
  }

  // Step 2: Ensure parsed result is an object
  if (!parsed || typeof parsed !== 'object') {
    throw X402ValidationError.typeMismatch('payload', 'object', typeof parsed);
  }

  const obj = parsed as Record<string, unknown>;

  // Step 3: Check for missing required fields FIRST
  // Handle version field aliasing (x402Version -> version)
  const objWithVersion = {
    ...obj,
    version: obj.version ?? obj.x402Version,
  };
  const missingCheck = checkMissingPayloadFields(objWithVersion);
  if (!missingCheck.valid) {
    throw X402ValidationError.missingRequiredFields(
      missingCheck.missingFields,
      missingCheck.schema
    );
  }

  // Step 4: Extract and type-check required fields
  const payload: PaymentPayload = {
    version: String(obj.version ?? obj.x402Version ?? '') as '1',
    scheme: String(obj.scheme ?? '') as 'exact',
    network: String(obj.network ?? ''),
    from: String(obj.from ?? ''),
    to: String(obj.to ?? ''),
    value: String(obj.value ?? ''),
    validAfter: String(obj.validAfter ?? ''),
    validBefore: String(obj.validBefore ?? ''),
    nonce: String(obj.nonce ?? ''),
    v: typeof obj.v === 'number' ? obj.v : parseInt(String(obj.v ?? '0'), 10),
    r: String(obj.r ?? ''),
    s: String(obj.s ?? ''),
  };

  // Step 5: Validate against PaymentPayload schema (for format validation)
  const validation = validatePaymentPayload(payload);
  if (!validation.valid) {
    throw X402ValidationError.fromMultipleErrors(
      validation.errors,
      validation.errors.map((err) => {
        // Extract field name from error message
        const fieldMatch = err.match(/Invalid '?(\w+)'?/);
        const field = fieldMatch ? fieldMatch[1] : 'unknown';
        return { field, expected: 'valid value', actual: 'invalid' };
      })
    );
  }

  return payload;
}

/**
 * Parse X402 payment header from base64-encoded string
 *
 * Combines base64 decoding with JSON parsing and validation.
 * This is the complete pipeline for processing incoming X-Payment headers.
 *
 * @param base64Header - The base64-encoded X-Payment header value
 * @returns Parsed X402PaymentHeader object
 * @throws {X402ValidationError} If decoding, parsing, or validation fails
 *
 * @example
 * ```typescript
 * const header = req.headers['x-payment'] as string;
 * try {
 *   const payment = parseX402Header(header);
 *   // payment is fully typed and validated
 * } catch (error) {
 *   if (error instanceof X402ValidationError) {
 *     res.status(400).json(error.toJSON());
 *   }
 * }
 * ```
 */
export function parseX402Header(base64Header: string): X402PaymentHeader {
  // Step 1: Base64 decode
  let jsonString: string;
  try {
    jsonString = Buffer.from(base64Header, 'base64').toString('utf-8');
  } catch (_error) {
    throw X402ValidationError.invalidJson('Invalid base64 encoding');
  }

  // Step 2: Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (error) {
    throw X402ValidationError.invalidJson(
      error instanceof Error ? error.message : 'Invalid JSON format'
    );
  }

  // Step 3: Validate structure
  if (!parsed || typeof parsed !== 'object') {
    throw X402ValidationError.typeMismatch('X-Payment', 'object', typeof parsed);
  }

  const obj = parsed as Record<string, unknown>;

  // Step 4: Validate version
  if (obj.x402Version !== '1') {
    throw X402ValidationError.versionMismatch(String(obj.x402Version ?? 'missing'));
  }

  // Step 5: Validate scheme
  if (obj.scheme !== 'exact') {
    throw X402ValidationError.schemeMismatch(String(obj.scheme ?? 'missing'));
  }

  // Step 6: Validate network
  if (!obj.network || typeof obj.network !== 'string') {
    throw X402ValidationError.missingField('network');
  }

  // Step 7: Validate payload structure
  if (!obj.payload || typeof obj.payload !== 'object') {
    throw X402ValidationError.missingField('payload');
  }

  const payloadObj = obj.payload as Record<string, unknown>;

  // Validate message in payload
  if (!payloadObj.message || typeof payloadObj.message !== 'object') {
    throw X402ValidationError.missingField('payload.message');
  }

  // Validate signature components
  if (typeof payloadObj.v !== 'number' || (payloadObj.v !== 27 && payloadObj.v !== 28)) {
    throw X402ValidationError.invalidSignatureComponent('v', payloadObj.v);
  }

  if (typeof payloadObj.r !== 'string' || !/^0x[a-fA-F0-9]{64}$/.test(payloadObj.r)) {
    throw X402ValidationError.invalidSignatureComponent('r', payloadObj.r);
  }

  if (typeof payloadObj.s !== 'string' || !/^0x[a-fA-F0-9]{64}$/.test(payloadObj.s)) {
    throw X402ValidationError.invalidSignatureComponent('s', payloadObj.s);
  }

  // Type-cast and return
  return parsed as X402PaymentHeader;
}

/**
 * x402 Settlement Request (Structured Format)
 *
 * The request sent to the facilitator to settle a payment.
 * This interface uses a structured format with authorization and signature
 * as separate objects for clarity and type safety.
 *
 * **Request Flow:**
 * 1. Receive signed authorization from player via X-Payment header
 * 2. Parse and validate the payment header
 * 3. Construct SettlementRequest with chainId and tokenAddress
 * 4. POST to facilitator settle endpoint
 * 5. Facilitator executes transferWithAuthorization on-chain
 * 6. Receive SettlementResponse with transaction details
 *
 * @example
 * ```typescript
 * const request: X402SettlementRequest = {
 *   authorization: {
 *     from: playerAddress,
 *     to: arcadeWallet,
 *     value: '10000',
 *     validAfter: '0',
 *     validBefore: '1735689600',
 *     nonce: '0x1234...5678'
 *   },
 *   signature: { v: 27, r: '0x...', s: '0x...' },
 *   chainId: 338,
 *   tokenAddress: '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0'
 * };
 * ```
 *
 * @see https://facilitator.cronoslabs.org/docs - Facilitator API Documentation
 * @see https://eips.ethereum.org/EIPS/eip-3009 - Transfer With Authorization
 */
export interface X402SettlementRequest {
  /**
   * The authorization message that was signed by the payer
   * Contains from, to, value, validAfter, validBefore, nonce
   */
  authorization: TransferWithAuthorizationMessage;

  /**
   * ECDSA signature components
   * Split signature format for contract verification
   */
  signature: {
    /** Signature recovery identifier (27 or 28) */
    v: number;
    /** First 32 bytes of the ECDSA signature (0x + 64 hex chars) */
    r: string;
    /** Second 32 bytes of the ECDSA signature (0x + 64 hex chars) */
    s: string;
  };

  /**
   * The blockchain chain ID for the settlement
   * Used to ensure the settlement happens on the correct network
   * @example 338 for Cronos Testnet
   */
  chainId: number;

  /**
   * The ERC-20 token contract address
   * Must be a token that supports EIP-3009 transferWithAuthorization
   * @example '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0' for devUSDC.e
   */
  tokenAddress: string;
}

/**
 * Settlement Request (Facilitator API Format)
 *
 * Alternative settlement request format that matches the exact Cronos Labs
 * facilitator API specification where signature components are nested
 * inside the authorization object.
 *
 * **Facilitator API POST /v2/x402/settle:**
 * ```json
 * {
 *   "authorization": {
 *     "from": "0x...",
 *     "to": "0x...",
 *     "value": "10000",
 *     "validAfter": "0",
 *     "validBefore": "1735689600",
 *     "nonce": "0x...",
 *     "v": 27,
 *     "r": "0x...",
 *     "s": "0x..."
 *   },
 *   "chainId": 338,
 *   "tokenAddress": "0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0"
 * }
 * ```
 *
 * Use `createSettlementRequest()` to convert from X402SettlementRequest
 * to this API format.
 *
 * @see https://facilitator.cronoslabs.org/docs - Facilitator API Documentation
 */
export interface SettlementRequest {
  /**
   * The authorization message with signature components
   */
  authorization: {
    from: string;
    to: string;
    value: string;
    validAfter: string;
    validBefore: string;
    nonce: string;
    v: number;
    r: string;
    s: string;
  };

  /**
   * The blockchain chain ID
   */
  chainId: number;

  /**
   * The token contract address
   */
  tokenAddress: string;
}

/**
 * Create a settlement request from structured data
 *
 * Converts the structured X402SettlementRequest format (with separate
 * authorization and signature objects) to the SettlementRequest format
 * expected by the facilitator API.
 *
 * @param request - The structured settlement request
 * @returns SettlementRequest in facilitator API format
 *
 * @example
 * ```typescript
 * const structured: X402SettlementRequest = {
 *   authorization: { from, to, value, validAfter, validBefore, nonce },
 *   signature: { v, r, s },
 *   chainId: 338,
 *   tokenAddress: USDC_ADDRESS
 * };
 *
 * const apiRequest = createSettlementRequest(structured);
 * const response = await fetch(getFacilitatorSettleUrl(), {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify(apiRequest)
 * });
 * ```
 */
export function createSettlementRequest(request: X402SettlementRequest): SettlementRequest {
  return {
    authorization: {
      from: request.authorization.from,
      to: request.authorization.to,
      value:
        typeof request.authorization.value === 'bigint'
          ? request.authorization.value.toString()
          : String(request.authorization.value),
      validAfter:
        typeof request.authorization.validAfter === 'bigint'
          ? request.authorization.validAfter.toString()
          : String(request.authorization.validAfter),
      validBefore:
        typeof request.authorization.validBefore === 'bigint'
          ? request.authorization.validBefore.toString()
          : String(request.authorization.validBefore),
      nonce: request.authorization.nonce,
      v: request.signature.v,
      r: request.signature.r,
      s: request.signature.s,
    },
    chainId: request.chainId,
    tokenAddress: request.tokenAddress,
  };
}

/**
 * Create a settlement request from payment payload and config
 *
 * Convenience function to create a SettlementRequest directly from
 * the parsed PaymentPayload and x402 configuration.
 *
 * @param payload - The parsed payment payload from X-Payment header
 * @param config - The x402 configuration
 * @returns SettlementRequest ready for facilitator API
 *
 * @example
 * ```typescript
 * const payload = headerToPayload(x402Header);
 * const settlementReq = createSettlementRequestFromPayload(payload, x402Config);
 * ```
 */
export function createSettlementRequestFromPayload(
  payload: PaymentPayload,
  config: X402Config,
  paymentHeader: string,
  resource: string
): SettlementRequest {
  // Determine network name from chain ID
  const networkMap: Record<number, string> = {
    338: 'cronos-testnet',
    25: 'cronos-mainnet',
  };
  const network = networkMap[config.chainId] || `chain-${config.chainId}`;

  return {
    x402Version: 1,
    paymentHeader,
    paymentRequirements: {
      scheme: 'exact',
      network,
      maxAmountRequired:
        typeof config.paymentAmount === 'bigint'
          ? config.paymentAmount.toString()
          : config.paymentAmount,
      payTo: config.payTo,
      asset: config.tokenAddress,
      resource,
      description: `Payment for ${resource}`,
      mimeType: 'application/json',
      maxTimeoutSeconds: 300,
    },
  };
}

/**
 * Validate a settlement request before sending to facilitator
 *
 * Performs comprehensive validation on the settlement request to catch
 * issues before making the API call.
 *
 * @param request - The settlement request to validate
 * @returns Validation result with any errors found
 *
 * @example
 * ```typescript
 * const validation = validateSettlementRequest(request);
 * if (!validation.valid) {
 *   console.error('Settlement request invalid:', validation.errors);
 *   return;
 * }
 * // Proceed with settlement
 * ```
 */
export function validateSettlementRequest(request: SettlementRequest): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate addresses
  if (!isValidAddress(request.authorization.from)) {
    errors.push(`Invalid 'from' address: ${request.authorization.from}`);
  }

  if (!isValidAddress(request.authorization.to)) {
    errors.push(`Invalid 'to' address: ${request.authorization.to}`);
  }

  if (!isValidAddress(request.tokenAddress)) {
    errors.push(`Invalid token address: ${request.tokenAddress}`);
  }

  // Validate value
  if (!request.authorization.value || !/^\d+$/.test(request.authorization.value)) {
    errors.push(`Invalid value: ${request.authorization.value}`);
  } else if (BigInt(request.authorization.value) <= 0n) {
    errors.push('Value must be positive');
  }

  // Validate timestamps
  if (!/^\d+$/.test(request.authorization.validAfter)) {
    errors.push(`Invalid validAfter: ${request.authorization.validAfter}`);
  }

  if (!/^\d+$/.test(request.authorization.validBefore)) {
    errors.push(`Invalid validBefore: ${request.authorization.validBefore}`);
  }

  // Validate nonce (32 bytes = 64 hex chars + 0x prefix = 66 chars)
  if (!/^0x[a-fA-F0-9]{64}$/.test(request.authorization.nonce)) {
    errors.push(`Invalid nonce format: ${request.authorization.nonce}`);
  }

  // Validate signature
  if (request.authorization.v !== 27 && request.authorization.v !== 28) {
    errors.push(`Invalid v value: ${request.authorization.v}, expected 27 or 28`);
  }

  if (!/^0x[a-fA-F0-9]{64}$/.test(request.authorization.r)) {
    errors.push(`Invalid r value format: ${request.authorization.r}`);
  }

  if (!/^0x[a-fA-F0-9]{64}$/.test(request.authorization.s)) {
    errors.push(`Invalid s value format: ${request.authorization.s}`);
  }

  // Validate chainId
  if (!request.chainId || request.chainId <= 0) {
    errors.push(`Invalid chainId: ${request.chainId}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * x402 Settlement Response
 *
 * The response from the facilitator after settlement attempt.
 * This interface represents the internal representation of a settlement result,
 * enriched with additional metadata beyond what the facilitator API returns.
 *
 * @example
 * ```typescript
 * // Successful settlement
 * const success: X402SettlementResponse = {
 *   success: true,
 *   transactionHash: '0x1234...5678',
 *   blockNumber: 12345678,
 *   settledAt: '2026-01-23T12:00:00.000Z'
 * };
 *
 * // Failed settlement
 * const failed: X402SettlementResponse = {
 *   success: false,
 *   errorCode: 'INSUFFICIENT_BALANCE',
 *   errorMessage: 'Payer has insufficient USDC balance',
 *   settledAt: '2026-01-23T12:00:00.000Z'
 * };
 * ```
 */
export interface X402SettlementResponse {
  /**
   * Whether the settlement was successful
   */
  success: boolean;

  /**
   * The on-chain transaction hash (if successful)
   * Hex string with 0x prefix, 66 characters total
   */
  transactionHash?: string;

  /**
   * The block number containing the transaction (if confirmed)
   */
  blockNumber?: number;

  /**
   * Error code if settlement failed
   * @see X402SettlementErrorCode for standard error codes
   */
  errorCode?: string;

  /**
   * Human-readable error message if settlement failed
   */
  errorMessage?: string;

  /**
   * ISO timestamp when the settlement was processed
   * Set by the middleware after receiving facilitator response
   */
  settledAt: string;
}

/**
 * Settlement Response (Facilitator API Format)
 *
 * The raw response structure returned by the Cronos Labs facilitator API.
 * This interface matches the exact format of the /v2/x402/settle response.
 *
 * **Success Response:**
 * ```json
 * {
 *   "success": true,
 *   "transaction": {
 *     "hash": "0x...",
 *     "blockNumber": 12345678
 *   }
 * }
 * ```
 *
 * **Error Response:**
 * ```json
 * {
 *   "success": false,
 *   "error": {
 *     "code": "INSUFFICIENT_BALANCE",
 *     "message": "Payer has insufficient USDC balance"
 *   }
 * }
 * ```
 *
 * Use `parseSettlementResponse()` to convert this API response
 * to the internal X402SettlementResponse format.
 *
 * @see https://facilitator.cronoslabs.org/docs - Facilitator API Documentation
 */
export interface SettlementResponse {
  // V1 API format
  success?: boolean;
  transaction?: {
    hash: string;
    blockNumber: number;
  };
  error?: {
    code: string;
    message: string;
  };

  // V2 API format (event-based) - Bug #4 fix: Correct event names
  x402Version?: number;
  event?: 'payment.settled' | 'payment.failed';
  network?: string;
  timestamp?: string;
  transactionHash?: string;
  txHash?: string; // Bug #9 fix: Facilitator returns 'txHash' not 'transactionHash'
  blockNumber?: number;
}

/**
 * Parse facilitator API response to internal format
 *
 * Converts the raw facilitator API SettlementResponse to the
 * enriched X402SettlementResponse format used internally.
 *
 * @param response - The raw facilitator API response
 * @param settledAt - Optional timestamp override (defaults to now)
 * @returns Internal settlement response format
 *
 * @example
 * ```typescript
 * const apiResponse = await fetch(facilitatorUrl).then(r => r.json());
 * const settlement = parseSettlementResponse(apiResponse);
 *
 * if (settlement.success) {
 *   console.log(`Settled in tx ${settlement.transactionHash}`);
 * } else {
 *   console.error(`Settlement failed: ${settlement.errorMessage}`);
 * }
 * ```
 */
export function parseSettlementResponse(
  response: SettlementResponse,
  settledAt?: Date
): X402SettlementResponse {
  const timestamp = (settledAt ?? new Date()).toISOString();

  // Handle V2 event-based format
  if (response.event) {
    // Bug #4 fix: Correct event name is 'payment.settled' not 'payment.success'
    // Bug #9 fix: Facilitator returns 'txHash' not 'transactionHash'
    const txHash = response.txHash || response.transactionHash;
    if (response.event === 'payment.settled' && txHash && response.blockNumber) {
      return {
        success: true,
        transactionHash: txHash,
        blockNumber: response.blockNumber,
        settledAt: response.timestamp || timestamp,
      };
    }

    // V2 failure
    return {
      success: false,
      errorCode: 'FACILITATOR_ERROR',
      errorMessage: typeof response.error === 'string' ? response.error : 'Payment failed',
      settledAt: response.timestamp || timestamp,
    };
  }

  // Handle V1 format
  if (response.success && response.transaction) {
    return {
      success: true,
      transactionHash: response.transaction.hash,
      blockNumber: response.transaction.blockNumber,
      settledAt: timestamp,
    };
  }

  return {
    success: false,
    errorCode: response.error?.code ?? 'UNKNOWN_ERROR',
    errorMessage: response.error?.message ?? 'Settlement failed with unknown error',
    settledAt: timestamp,
  };
}

/**
 * Create a successful settlement response
 *
 * Factory function to create a success response with proper typing.
 *
 * @param transactionHash - The on-chain transaction hash
 * @param blockNumber - The block number containing the transaction
 * @param settledAt - Optional timestamp override
 * @returns Successful settlement response
 *
 * @example
 * ```typescript
 * const response = createSuccessSettlementResponse(
 *   '0x1234567890abcdef...',
 *   12345678
 * );
 * ```
 */
export function createSuccessSettlementResponse(
  transactionHash: string,
  blockNumber: number,
  settledAt?: Date
): X402SettlementResponse {
  return {
    success: true,
    transactionHash,
    blockNumber,
    settledAt: (settledAt ?? new Date()).toISOString(),
  };
}

/**
 * Create a failed settlement response
 *
 * Factory function to create an error response with proper typing.
 *
 * @param errorCode - The error code
 * @param errorMessage - Human-readable error message
 * @param settledAt - Optional timestamp override
 * @returns Failed settlement response
 *
 * @example
 * ```typescript
 * const response = createFailedSettlementResponse(
 *   'INSUFFICIENT_BALANCE',
 *   'Payer has insufficient USDC balance'
 * );
 * ```
 */
export function createFailedSettlementResponse(
  errorCode: string,
  errorMessage: string,
  settledAt?: Date
): X402SettlementResponse {
  return {
    success: false,
    errorCode,
    errorMessage,
    settledAt: (settledAt ?? new Date()).toISOString(),
  };
}

/**
 * Check if a settlement response indicates success
 *
 * Type guard to narrow settlement response type.
 *
 * @param response - The settlement response to check
 * @returns True if settlement was successful
 */
export function isSuccessfulSettlement(
  response: X402SettlementResponse
): response is X402SettlementResponse & {
  success: true;
  transactionHash: string;
  blockNumber: number;
} {
  return (
    response.success === true &&
    typeof response.transactionHash === 'string' &&
    response.transactionHash.length > 0
  );
}

/**
 * x402 Settlement Error Codes
 *
 * Standard error codes returned by the facilitator on settlement failure.
 */
export type X402SettlementErrorCode =
  | 'INVALID_SIGNATURE'
  | 'EXPIRED_AUTHORIZATION'
  | 'INSUFFICIENT_BALANCE'
  | 'NONCE_ALREADY_USED'
  | 'INVALID_TOKEN'
  | 'UNSUPPORTED_CHAIN'
  | 'FACILITATOR_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT';

/**
 * x402 Payment Verification Result
 *
 * The result of verifying an incoming X-Payment header.
 */
export interface X402VerificationResult {
  /**
   * Whether the payment header is valid and ready for settlement
   */
  valid: boolean;

  /**
   * The parsed payment header (if valid)
   */
  payment?: X402PaymentHeader;

  /**
   * Error message (if invalid)
   */
  error?: string;

  /**
   * Specific validation error code
   */
  errorCode?: X402ValidationErrorCode;
}

/**
 * x402 Validation Error Codes
 *
 * Error codes for payment header validation failures.
 */
export type X402ValidationErrorCode =
  | 'MISSING_HEADER'
  | 'INVALID_JSON'
  | 'INVALID_VERSION'
  | 'INVALID_SCHEME'
  | 'INVALID_NETWORK'
  | 'INVALID_PAYLOAD'
  | 'AMOUNT_MISMATCH'
  | 'RECIPIENT_MISMATCH'
  | 'AUTHORIZATION_EXPIRED'
  | 'AUTHORIZATION_NOT_YET_VALID';

/**
 * Payment Information (Verified and Settled)
 *
 * Contains the verified payment information attached to requests after
 * successful validation and settlement. This interface provides a clean,
 * domain-oriented view of the payment suitable for business logic.
 *
 * @example
 * ```typescript
 * // Access in route handler after x402 middleware
 * app.post('/api/play', x402Middleware, (req: X402Request, res) => {
 *   const { paymentInfo } = req.x402!;
 *
 *   console.log(`Player ${paymentInfo.payer} paid ${paymentInfo.amountUsdc}`);
 *   console.log(`Transaction: ${paymentInfo.transactionHash}`);
 *
 *   // Start game session
 *   const session = createGameSession({
 *     playerId: paymentInfo.payer,
 *     paymentTxHash: paymentInfo.transactionHash,
 *     amountPaid: paymentInfo.amount,
 *   });
 * });
 * ```
 */
export interface PaymentInfo {
  /**
   * The payer's wallet address (player)
   * Verified from the signed authorization
   */
  payer: string;

  /**
   * The recipient's wallet address (arcade)
   * Verified to match the configured payTo address
   */
  recipient: string;

  /**
   * Payment amount in token's smallest units (e.g., 10000 for $0.01 USDC)
   * Represented as bigint for precise calculations
   */
  amount: bigint;

  /**
   * Payment amount in human-readable USDC format (e.g., "0.01")
   * Convenience field for logging and display
   */
  amountUsdc: string;

  /**
   * The token contract address used for payment
   */
  tokenAddress: string;

  /**
   * The blockchain chain ID where the payment was settled
   */
  chainId: number;

  /**
   * The on-chain transaction hash after successful settlement
   * This is the proof of payment
   */
  transactionHash: string;

  /**
   * The block number containing the settlement transaction
   */
  blockNumber: number;

  /**
   * ISO timestamp when the payment was settled
   */
  settledAt: string;

  /**
   * ISO timestamp when the payment was received (pre-settlement)
   */
  receivedAt: string;

  /**
   * The unique nonce used in this authorization
   * Useful for tracking and preventing replay
   */
  nonce: string;

  /**
   * Authorization validity window start
   */
  validAfter: string;

  /**
   * Authorization validity window end
   */
  validBefore: string;
}

/**
 * Payment Info Builder Options
 *
 * Options for creating a PaymentInfo object from settlement data.
 */
export interface PaymentInfoOptions {
  payload: PaymentPayload;
  settlement: X402SettlementResponse;
  config: X402Config;
  receivedAt?: Date;
}

/**
 * Create PaymentInfo from settlement result
 *
 * Constructs a clean PaymentInfo object from the raw settlement data.
 *
 * @param options - Payment info construction options
 * @returns PaymentInfo object ready for use in business logic
 */
export function createPaymentInfo(options: PaymentInfoOptions): PaymentInfo {
  const { payload, settlement, config, receivedAt = new Date() } = options;

  const amount = BigInt(payload.value);

  return {
    payer: payload.from,
    recipient: payload.to,
    amount,
    amountUsdc: formatUSDC(amount),
    tokenAddress: config.tokenAddress,
    chainId: config.chainId,
    transactionHash: settlement.transactionHash || '',
    blockNumber: settlement.blockNumber || 0,
    settledAt: new Date().toISOString(),
    receivedAt: receivedAt.toISOString(),
    nonce: payload.nonce,
    validAfter: payload.validAfter,
    validBefore: payload.validBefore,
  };
}

/**
 * Create pending PaymentInfo (pre-settlement)
 *
 * Creates a PaymentInfo object for a payment that's been validated
 * but not yet settled. Useful for tracking pending payments.
 *
 * @param payload - The validated payment payload
 * @param config - The x402 configuration
 * @returns Partial PaymentInfo without settlement data
 */
export function createPendingPaymentInfo(
  payload: PaymentPayload,
  config: X402Config
): Omit<PaymentInfo, 'transactionHash' | 'blockNumber' | 'settledAt'> {
  const amount = BigInt(payload.value);

  return {
    payer: payload.from,
    recipient: payload.to,
    amount,
    amountUsdc: formatUSDC(amount),
    tokenAddress: config.tokenAddress,
    chainId: config.chainId,
    receivedAt: new Date().toISOString(),
    nonce: payload.nonce,
    validAfter: payload.validAfter,
    validBefore: payload.validBefore,
  };
}

/**
 * x402 Middleware Context
 *
 * Extended Express request with x402 payment information.
 */
export interface X402Request extends Request {
  /**
   * The verified payment information (set after successful verification)
   */
  x402?: {
    /** The raw payment header from the request */
    payment: X402PaymentHeader;

    /** The flattened payment payload */
    payload: PaymentPayload;

    /** Settlement response from facilitator (if settled) */
    settlement?: X402SettlementResponse;

    /** Verified and processed payment info (after settlement) */
    paymentInfo?: PaymentInfo;

    /** The x402 configuration used */
    config: X402Config;

    /** ISO timestamp when payment was received */
    receivedAt: string;
  };
}

/**
 * x402 Middleware Function Type
 *
 * Express middleware function signature for x402 payment processing.
 */
export type X402Middleware = (
  req: X402Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

/**
 * x402 Payment Handler Options
 *
 * Options for customizing x402 middleware behavior per-route.
 */
export interface X402HandlerOptions {
  /**
   * Override the default payment amount for this route
   */
  paymentAmount?: bigint | string;

  /**
   * Custom description for the payment requirement
   */
  description?: string;

  /**
   * Resource identifier for the payment
   */
  resource?: string;

  /**
   * Custom payment validation function
   * Return true to accept, false to reject with 402
   */
  validatePayment?: (payment: X402PaymentHeader) => boolean | Promise<boolean>;

  /**
   * Callback after successful settlement
   */
  onSettlement?: (settlement: X402SettlementResponse, req: X402Request) => void | Promise<void>;

  /**
   * Skip settlement and accept payment header only (for testing)
   * @default false
   */
  skipSettlement?: boolean;
}

/**
 * Create default x402 configuration for Cronos Testnet
 *
 * Factory function to create a properly configured X402Config
 * with sensible defaults for the Cronos Testnet environment.
 *
 * @param payTo - The wallet address to receive payments
 * @param paymentAmount - The amount to charge per request
 * @returns Configured X402Config object
 *
 * @example
 * ```typescript
 * const config = createDefaultX402Config(
 *   process.env.ARCADE_WALLET_ADDRESS!,
 *   parseUSDC(0.01)
 * );
 * ```
 */
export function createDefaultX402Config(payTo: string, paymentAmount: bigint | string): X402Config {
  return {
    payTo,
    paymentAmount,
    tokenAddress: getUsdcContractAddress(),
    tokenName: USDC_NAME,
    tokenDecimals: USDC_DECIMALS,
    tokenVersion: USDC_VERSION,
    facilitatorUrl: getFacilitatorBaseUrl(),
    chainId: CRONOS_TESTNET_CHAIN_ID,
    maxAuthorizationAge: 3600, // 1 hour
    minValidityWindow: 60, // 1 minute
    debug: process.env.NODE_ENV !== 'production',
  };
}

/**
 * Validate an X402Config object
 *
 * Checks that all required fields are present and valid.
 *
 * @param config - The configuration to validate
 * @returns true if valid, throws Error if invalid
 */
export function validateX402Config(config: X402Config): boolean {
  if (!config.payTo || !isValidAddress(config.payTo)) {
    throw new Error(`Invalid payTo address: ${config.payTo}`);
  }

  if (!config.tokenAddress || !isValidAddress(config.tokenAddress)) {
    throw new Error(`Invalid tokenAddress: ${config.tokenAddress}`);
  }

  if (!config.paymentAmount) {
    throw new Error('paymentAmount is required');
  }

  const amount =
    typeof config.paymentAmount === 'bigint' ? config.paymentAmount : BigInt(config.paymentAmount);

  if (amount <= 0n) {
    throw new Error('paymentAmount must be positive');
  }

  if (!config.tokenName) {
    throw new Error('tokenName is required');
  }

  if (config.tokenDecimals === undefined || config.tokenDecimals < 0) {
    throw new Error('tokenDecimals must be a non-negative number');
  }

  if (!config.facilitatorUrl) {
    throw new Error('facilitatorUrl is required');
  }

  try {
    new URL(config.facilitatorUrl);
  } catch {
    throw new Error(`Invalid facilitatorUrl: ${config.facilitatorUrl}`);
  }

  if (!config.chainId || config.chainId <= 0) {
    throw new Error('chainId must be a positive number');
  }

  return true;
}

/**
 * X-Payment-Response Payload
 *
 * The payload structure for the X-Payment-Response header sent after
 * successful payment settlement. This header confirms the payment was
 * processed and provides transaction details to the client.
 *
 * **Response Header Format:**
 * ```
 * X-Payment-Response: <base64-encoded JSON>
 * ```
 *
 * **Decoded JSON Structure:**
 * ```json
 * {
 *   "success": true,
 *   "transactionHash": "0x...",
 *   "blockNumber": 12345678,
 *   "explorerUrl": "https://explorer.cronos.org/testnet/tx/0x...",
 *   "settledAt": "2026-01-23T12:00:00.000Z",
 *   "chainId": 338,
 *   "network": "cronos-testnet"
 * }
 * ```
 *
 * @example
 * ```typescript
 * // After successful settlement in middleware
 * const responsePayload = createPaymentResponsePayload(settlement, config);
 * const header = encodePaymentResponseHeader(responsePayload);
 * res.setHeader('X-Payment-Response', header);
 * ```
 */
export interface PaymentResponsePayload {
  /**
   * Indicates successful payment settlement
   */
  success: true;

  /**
   * The on-chain transaction hash
   * Hex string with 0x prefix, 66 characters total
   */
  transactionHash: string;

  /**
   * The block number containing the settlement transaction
   */
  blockNumber: number;

  /**
   * Full URL to view the transaction on the block explorer
   * @example "https://explorer.cronos.org/testnet/tx/0x..."
   */
  explorerUrl: string;

  /**
   * ISO timestamp when the payment was settled
   */
  settledAt: string;

  /**
   * The blockchain chain ID where the payment was settled
   * @example 338 for Cronos Testnet
   */
  chainId: number;

  /**
   * Human-readable network identifier
   * @example "cronos-testnet"
   */
  network: string;
}

/**
 * Create a PaymentResponsePayload from settlement result
 *
 * Constructs the payment response payload to be sent in the
 * X-Payment-Response header after successful settlement.
 *
 * @param settlement - The settlement response from the facilitator
 * @param config - The x402 configuration (for chainId)
 * @returns PaymentResponsePayload ready for encoding
 *
 * @example
 * ```typescript
 * const responsePayload = createPaymentResponsePayload(settlement, config);
 * // => {
 * //   success: true,
 * //   transactionHash: "0x...",
 * //   blockNumber: 12345678,
 * //   explorerUrl: "https://explorer.cronos.org/testnet/tx/0x...",
 * //   settledAt: "2026-01-23T12:00:00.000Z",
 * //   chainId: 338,
 * //   network: "cronos-testnet"
 * // }
 * ```
 */
export function createPaymentResponsePayload(
  settlement: X402SettlementResponse,
  config: X402Config
): PaymentResponsePayload {
  const network = `cronos-${config.chainId === 338 ? 'testnet' : 'mainnet'}`;

  return {
    success: true,
    transactionHash: settlement.transactionHash || '',
    blockNumber: settlement.blockNumber || 0,
    explorerUrl: getTxUrl(settlement.transactionHash || ''),
    settledAt: settlement.settledAt,
    chainId: config.chainId,
    network,
  };
}

/**
 * Encode a PaymentResponsePayload as a base64 string for the X-Payment-Response header
 *
 * Converts the payment response payload to JSON and base64-encodes it
 * for transmission in the HTTP header.
 *
 * @param payload - The payment response payload to encode
 * @returns Base64-encoded JSON string
 *
 * @example
 * ```typescript
 * const header = encodePaymentResponseHeader(responsePayload);
 * res.setHeader('X-Payment-Response', header);
 * ```
 */
export function encodePaymentResponseHeader(payload: PaymentResponsePayload): string {
  const json = JSON.stringify(payload);
  return Buffer.from(json).toString('base64');
}

/**
 * Decode a base64-encoded X-Payment-Response header
 *
 * Parses the base64-encoded header value back into a PaymentResponsePayload.
 * Useful for clients receiving the response header.
 *
 * @param base64Header - The base64-encoded header value
 * @returns Decoded PaymentResponsePayload
 * @throws Error if decoding or parsing fails
 *
 * @example
 * ```typescript
 * const header = response.headers.get('X-Payment-Response');
 * const payload = decodePaymentResponseHeader(header);
 * console.log(`Transaction: ${payload.transactionHash}`);
 * console.log(`Explorer: ${payload.explorerUrl}`);
 * ```
 */
export function decodePaymentResponseHeader(base64Header: string): PaymentResponsePayload {
  try {
    const json = Buffer.from(base64Header, 'base64').toString('utf-8');
    return JSON.parse(json) as PaymentResponsePayload;
  } catch (error) {
    throw new Error(
      `Failed to decode X-Payment-Response header: ${
        error instanceof Error ? error.message : 'Invalid format'
      }`
    );
  }
}

/**
 * Set the X-Payment-Response header on an Express response
 *
 * Convenience function to create the payment response payload,
 * encode it, and set the header in one call.
 *
 * @param res - Express Response object
 * @param settlement - The settlement response from the facilitator
 * @param config - The x402 configuration
 * @returns The encoded header value (for logging/debugging)
 *
 * @example
 * ```typescript
 * // In middleware after successful settlement
 * const encodedHeader = setPaymentResponseHeader(res, settlement, config);
 * console.log('[x402] Set X-Payment-Response header:', encodedHeader);
 * ```
 */
export function setPaymentResponseHeader(
  res: { setHeader: (name: string, value: string) => void },
  settlement: X402SettlementResponse,
  config: X402Config
): string {
  const payload = createPaymentResponsePayload(settlement, config);
  const encodedHeader = encodePaymentResponseHeader(payload);
  res.setHeader('X-Payment-Response', encodedHeader);
  return encodedHeader;
}

// Export all types for external use
export type { EIP712Domain, TransferWithAuthorizationMessage, SignedTransferWithAuthorization };
