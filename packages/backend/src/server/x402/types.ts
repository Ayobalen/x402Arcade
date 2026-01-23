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
 * x402 Settlement Request
 *
 * The request sent to the facilitator to settle a payment.
 */
export interface X402SettlementRequest {
  /**
   * The authorization message that was signed
   */
  authorization: TransferWithAuthorizationMessage;

  /**
   * Signature components
   */
  signature: {
    v: number;
    r: string;
    s: string;
  };

  /**
   * The chain ID for the settlement
   */
  chainId: number;

  /**
   * The token contract address
   */
  tokenAddress: string;
}

/**
 * x402 Settlement Response
 *
 * The response from the facilitator after settlement attempt.
 */
export interface X402SettlementResponse {
  /**
   * Whether the settlement was successful
   */
  success: boolean;

  /**
   * The on-chain transaction hash (if successful)
   */
  transactionHash?: string;

  /**
   * The block number containing the transaction (if confirmed)
   */
  blockNumber?: number;

  /**
   * Error code if settlement failed
   */
  errorCode?: string;

  /**
   * Human-readable error message if settlement failed
   */
  errorMessage?: string;
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
 * x402 Middleware Context
 *
 * Extended Express request with x402 payment information.
 */
export interface X402Request extends Request {
  /**
   * The verified payment information (set after successful verification)
   */
  x402?: {
    payment: X402PaymentHeader;
    settlement?: X402SettlementResponse;
    config: X402Config;
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
