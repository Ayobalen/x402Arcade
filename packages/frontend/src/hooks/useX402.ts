/**
 * x402 Payment Hook
 *
 * React hook for handling x402 HTTP payment protocol interactions.
 * This hook provides the frontend interface for gasless USDC payments
 * using EIP-3009 transferWithAuthorization.
 *
 * The x402 payment flow:
 * 1. User attempts to access a protected resource
 * 2. Server returns 402 Payment Required with payment requirements
 * 3. User signs an EIP-3009 authorization with their wallet
 * 4. Payment is included in the retry request via X-Payment header
 * 5. Server settles the payment via the facilitator and grants access
 *
 * @module hooks/useX402
 * @see https://eips.ethereum.org/EIPS/eip-3009 - Transfer With Authorization
 * @see https://eips.ethereum.org/EIPS/eip-712 - EIP-712 Typed Data Standard
 */

import { useCallback, useState } from 'react';
import {
  TRANSFER_WITH_AUTHORIZATION_TYPES,
  TRANSFER_WITH_AUTHORIZATION_PRIMARY_TYPE,
  getUsdcEip712Domain,
  createTransferWithAuthorizationMessage,
  generateNonce,
  parseSignature,
  parseUSDC,
  formatUSDC,
  type TransferWithAuthorizationMessage,
  type SignatureComponents,
  type SignedTransferWithAuthorization,
} from '../config/eip3009';
import { CRONOS_TESTNET_CHAIN_ID, USDC_CONTRACT_ADDRESS } from '../config/chain';
import { useWallet } from './useWallet';

// ============================================================================
// Types
// ============================================================================

/**
 * Payment status states
 */
export type PaymentStatus =
  | 'idle' // No payment in progress
  | 'signing' // Waiting for user to sign
  | 'settling' // Payment being processed
  | 'success' // Payment completed successfully
  | 'error'; // Payment failed

/**
 * Payment error information
 */
export interface PaymentError {
  /** Error code for programmatic handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Whether the payment can be retried */
  retryable: boolean;
}

/**
 * Payment request parameters
 */
export interface PaymentRequest {
  /** Recipient wallet address */
  to: `0x${string}`;
  /** Amount in USDC (human-readable, e.g., "0.01") */
  amount: string | number;
  /** Optional validity duration in seconds (default: 3600) */
  validitySeconds?: number;
  /** Optional metadata for the payment */
  metadata?: Record<string, unknown>;
}

/**
 * Payment result information
 */
export interface PaymentResult {
  /** The signed authorization */
  authorization: SignedTransferWithAuthorization;
  /** Transaction hash if settlement completed */
  transactionHash?: string;
  /** Block number of the settlement transaction */
  blockNumber?: number;
}

/**
 * Hook state
 */
export interface UseX402State {
  /** Current payment status */
  status: PaymentStatus;
  /** Error information if status is 'error' */
  error: PaymentError | null;
  /** Last successful payment result */
  lastPayment: PaymentResult | null;
  /** Whether a payment is in progress */
  isPending: boolean;
  /** Whether the wallet is connected and ready */
  isReady: boolean;
}

/**
 * Hook actions
 */
export interface UseX402Actions {
  /**
   * Initiate a payment
   * @param request - Payment request parameters
   * @returns Promise resolving to the payment result
   */
  pay: (request: PaymentRequest) => Promise<PaymentResult>;
  /**
   * Reset the hook state (clears error, status, and lastPayment)
   */
  reset: () => void;
  /**
   * Clear only the error state for retry attempts
   * Keeps status as 'idle' and preserves lastPayment
   */
  clearError: () => void;
  /**
   * Create a signed authorization without submitting
   * @param request - Payment request parameters
   * @returns Promise resolving to the signed authorization
   */
  createAuthorization: (request: PaymentRequest) => Promise<SignedTransferWithAuthorization>;
}

/**
 * Hook options
 */
export interface UseX402Options {
  /** Optional callback when payment succeeds */
  onSuccess?: (result: PaymentResult) => void;
  /** Optional callback when payment fails */
  onError?: (error: PaymentError) => void;
  /** Whether to auto-reset after success (default: false) */
  autoReset?: boolean;
  /** Auto-reset delay in milliseconds (default: 3000) */
  autoResetDelay?: number;
}

/**
 * Hook return value
 */
export interface UseX402Result extends UseX402State, UseX402Actions {}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * useX402 - React hook for x402 payment interactions
 *
 * Provides a simple interface for creating and submitting x402 payments
 * using EIP-3009 transferWithAuthorization.
 *
 * @param options - Hook configuration options
 * @returns Hook state and actions
 *
 * @example
 * ```tsx
 * function PaymentButton() {
 *   const { pay, status, error, isPending } = useX402({
 *     onSuccess: (result) => console.log('Paid!', result.transactionHash),
 *     onError: (error) => console.error('Failed:', error.message),
 *   })
 *
 *   const handlePay = async () => {
 *     try {
 *       await pay({
 *         to: '0x1234...5678',
 *         amount: '0.01', // $0.01 USDC
 *       })
 *     } catch (e) {
 *       // Error handled by onError callback
 *     }
 *   }
 *
 *   return (
 *     <button onClick={handlePay} disabled={isPending}>
 *       {isPending ? 'Processing...' : 'Pay $0.01'}
 *     </button>
 *   )
 * }
 * ```
 */
export function useX402(options: UseX402Options = {}): UseX402Result {
  const { onSuccess, onError, autoReset = false, autoResetDelay = 3000 } = options;

  // State
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [error, setError] = useState<PaymentError | null>(null);
  const [lastPayment, setLastPayment] = useState<PaymentResult | null>(null);

  // Wallet integration
  const { isReady: walletReady, address, signTypedData } = useWallet();

  // Derived state
  const isPending = status === 'signing' || status === 'settling';
  const isReady = walletReady;

  /**
   * Reset hook state
   */
  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setLastPayment(null);
  }, []);

  /**
   * Clear error state for retry attempts
   *
   * Resets error to null and sets status to 'idle' so the user
   * can attempt another payment. Preserves lastPayment for reference.
   */
  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') {
      setStatus('idle');
    }
  }, [status]);

  /**
   * Handle successful payment
   */
  const handleSuccess = useCallback(
    (result: PaymentResult) => {
      setStatus('success');
      setLastPayment(result);
      onSuccess?.(result);

      if (autoReset) {
        setTimeout(reset, autoResetDelay);
      }
    },
    [onSuccess, autoReset, autoResetDelay, reset]
  );

  /**
   * Handle payment error
   */
  const handleError = useCallback(
    (paymentError: PaymentError) => {
      setStatus('error');
      setError(paymentError);
      onError?.(paymentError);
    },
    [onError]
  );

  /**
   * Create a signed authorization
   *
   * Creates the EIP-3009 authorization message and requests a signature
   * from the connected wallet.
   */
  const createAuthorization = useCallback(
    async (request: PaymentRequest): Promise<SignedTransferWithAuthorization> => {
      if (!walletReady || !address) {
        throw new Error('Wallet not connected or not ready');
      }

      // Parse amount to smallest units
      const amountInSmallestUnits =
        typeof request.amount === 'string'
          ? parseUSDC(request.amount)
          : parseUSDC(request.amount.toString());

      // Generate unique nonce
      const nonce = generateNonce();

      // Calculate validity window
      const validitySeconds = request.validitySeconds || 3600; // Default 1 hour
      const now = Math.floor(Date.now() / 1000);
      const validAfter = 0;
      const validBefore = now + validitySeconds;

      // Create EIP-3009 message
      const message = createTransferWithAuthorizationMessage({
        from: address,
        to: request.to,
        value: amountInSmallestUnits,
        validAfter: BigInt(validAfter),
        validBefore: BigInt(validBefore),
        nonce,
      });

      // Get EIP-712 domain
      const domain = getUsdcEip712Domain(CRONOS_TESTNET_CHAIN_ID, USDC_CONTRACT_ADDRESS);

      // Sign the message
      const signature = await signTypedData({
        domain: {
          name: domain.name,
          version: domain.version,
          chainId: domain.chainId,
          verifyingContract: domain.verifyingContract,
        },
        types: TRANSFER_WITH_AUTHORIZATION_TYPES,
        primaryType: TRANSFER_WITH_AUTHORIZATION_PRIMARY_TYPE,
        message: {
          from: message.from,
          to: message.to,
          value: message.value.toString(),
          validAfter: message.validAfter.toString(),
          validBefore: message.validBefore.toString(),
          nonce: message.nonce,
        },
      });

      // Parse signature components
      const { v, r, s } = parseSignature(signature);

      // Return signed authorization
      return {
        message,
        v,
        r,
        s,
      };
    },
    [walletReady, address, signTypedData]
  );

  /**
   * Initiate a payment
   *
   * Creates a signed authorization and optionally submits it for settlement.
   */
  const pay = useCallback(
    async (request: PaymentRequest): Promise<PaymentResult> => {
      if (isPending) {
        throw new Error('Payment already in progress');
      }

      try {
        setStatus('signing');
        setError(null);

        const authorization = await createAuthorization(request);

        setStatus('settling');

        // TODO: Submit to backend/facilitator
        // For now, just return the authorization
        const result: PaymentResult = {
          authorization,
        };

        handleSuccess(result);
        return result;
      } catch (e) {
        const paymentError: PaymentError = {
          code: 'PAYMENT_FAILED',
          message: e instanceof Error ? e.message : 'Unknown error',
          retryable: true,
        };
        handleError(paymentError);
        throw e;
      }
    },
    [isPending, createAuthorization, handleSuccess, handleError]
  );

  return {
    // State
    status,
    error,
    lastPayment,
    isPending,
    isReady,
    // Actions
    pay,
    reset,
    clearError,
    createAuthorization,
  };
}

// ============================================================================
// Utility Exports
// ============================================================================

// Re-export useful types and utilities from config
export {
  TRANSFER_WITH_AUTHORIZATION_TYPES,
  TRANSFER_WITH_AUTHORIZATION_PRIMARY_TYPE,
  getUsdcEip712Domain,
  createTransferWithAuthorizationMessage,
  generateNonce,
  parseSignature,
  parseUSDC,
  formatUSDC,
  CRONOS_TESTNET_CHAIN_ID,
  USDC_CONTRACT_ADDRESS,
};
export type {
  TransferWithAuthorizationMessage,
  SignatureComponents,
  SignedTransferWithAuthorization,
};
