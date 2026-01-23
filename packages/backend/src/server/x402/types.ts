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
  description?: string,
): PaymentRequiredResponse {
  const { getUsdcEip712Domain } = require('../../lib/chain/constants.js');

  const amount =
    typeof config.paymentAmount === 'bigint'
      ? config.paymentAmount.toString()
      : String(config.paymentAmount);

  const eip712Domain = getUsdcEip712Domain(config.chainId);

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
  return {
    version: header.x402Version,
    scheme: header.scheme,
    network: header.network,
    from: header.payload.message.from,
    to: header.payload.message.to,
    value:
      typeof header.payload.message.value === 'bigint'
        ? header.payload.message.value.toString()
        : String(header.payload.message.value),
    validAfter:
      typeof header.payload.message.validAfter === 'bigint'
        ? header.payload.message.validAfter.toString()
        : String(header.payload.message.validAfter),
    validBefore:
      typeof header.payload.message.validBefore === 'bigint'
        ? header.payload.message.validBefore.toString()
        : String(header.payload.message.validBefore),
    nonce: header.payload.message.nonce,
    v: header.payload.v,
    r: header.payload.r,
    s: header.payload.s,
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

  // Import validator at runtime
  const { isValidAddress } = require('../../lib/chain/constants.js');

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
  if (payload.v !== 27 && payload.v !== 28) {
    errors.push(`Invalid v value: ${payload.v}, expected 27 or 28`);
  }

  if (!/^0x[a-fA-F0-9]{64}$/.test(payload.r)) {
    errors.push(`Invalid r value format: ${payload.r}`);
  }

  if (!/^0x[a-fA-F0-9]{64}$/.test(payload.s)) {
    errors.push(`Invalid s value format: ${payload.s}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
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
   * Combined authorization message with signature
   * This is the format expected by the facilitator API
   */
  authorization: {
    /** Token sender's address (the signer/payer) */
    from: string;
    /** Token recipient's address (the arcade) */
    to: string;
    /** Amount to transfer in smallest units (as string for uint256) */
    value: string;
    /** Unix timestamp after which the authorization is valid */
    validAfter: string;
    /** Unix timestamp before which the authorization is valid */
    validBefore: string;
    /** Unique 32-byte nonce (0x + 64 hex chars) */
    nonce: string;
    /** ECDSA signature recovery identifier (27 or 28) */
    v: number;
    /** First 32 bytes of the ECDSA signature */
    r: string;
    /** Second 32 bytes of the ECDSA signature */
    s: string;
  };

  /**
   * The blockchain chain ID for the settlement
   * @example 338 for Cronos Testnet
   */
  chainId: number;

  /**
   * The ERC-20 token contract address supporting EIP-3009
   * @example '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0' for devUSDC.e
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
export function createSettlementRequest(
  request: X402SettlementRequest,
): SettlementRequest {
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
): SettlementRequest {
  return {
    authorization: {
      from: payload.from,
      to: payload.to,
      value: payload.value,
      validAfter: payload.validAfter,
      validBefore: payload.validBefore,
      nonce: payload.nonce,
      v: payload.v,
      r: payload.r,
      s: payload.s,
    },
    chainId: config.chainId,
    tokenAddress: config.tokenAddress,
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
  // Import validator at runtime to avoid circular deps
  const { isValidAddress } = require('../../lib/chain/constants.js');

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
  /**
   * Whether the settlement was successful
   */
  success: boolean;

  /**
   * Transaction details (present if success is true)
   */
  transaction?: {
    /**
     * The on-chain transaction hash
     * Hex string with 0x prefix
     */
    hash: string;

    /**
     * The block number containing the transaction
     */
    blockNumber: number;
  };

  /**
   * Error details (present if success is false)
   */
  error?: {
    /**
     * Machine-readable error code
     * @see X402SettlementErrorCode for standard codes
     */
    code: string;

    /**
     * Human-readable error description
     */
    message: string;
  };
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
  settledAt?: Date,
): X402SettlementResponse {
  const timestamp = (settledAt ?? new Date()).toISOString();

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
  settledAt?: Date,
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
  settledAt?: Date,
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
  response: X402SettlementResponse,
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

  // Import formatUSDC at runtime
  const { formatUSDC } = require('../../lib/chain/constants.js');

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
  config: X402Config,
): Omit<PaymentInfo, 'transactionHash' | 'blockNumber' | 'settledAt'> {
  const { formatUSDC } = require('../../lib/chain/constants.js');

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
  next: NextFunction,
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
  onSettlement?: (
    settlement: X402SettlementResponse,
    req: X402Request,
  ) => void | Promise<void>;

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
export function createDefaultX402Config(
  payTo: string,
  paymentAmount: bigint | string,
): X402Config {
  // Import from chain constants at runtime to avoid circular deps
  const {
    USDC_NAME,
    USDC_DECIMALS,
    USDC_VERSION,
    CRONOS_TESTNET_CHAIN_ID,
    getUsdcContractAddress,
    getFacilitatorBaseUrl,
  } = require('../../lib/chain/constants.js');

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
  // Import validator at runtime
  const { isValidAddress } = require('../../lib/chain/constants.js');

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
    typeof config.paymentAmount === 'bigint'
      ? config.paymentAmount
      : BigInt(config.paymentAmount);

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

// Export all types for external use
export type {
  EIP712Domain,
  TransferWithAuthorizationMessage,
  SignedTransferWithAuthorization,
};
