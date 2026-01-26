/**
 * Game Session Hook
 *
 * Wraps the working payment flow pattern from Game.tsx.
 * Provides a unified interface for game session management including:
 * - x402 payment flow
 * - Session creation and restoration
 * - Score submission
 * - Prize pool fetching
 *
 * This hook WRAPS existing working hooks (useX402, useWallet, useScoreSubmission)
 * instead of reimplementing them. It extracts the pattern from Snake's Game.tsx.
 *
 * @module games/hooks/useGameSession
 */

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useX402 } from '@/hooks/useX402';
import { useScoreSubmission } from '@/hooks/useScoreSubmission';
import { createPaymentHeader } from '@/config/x402Client';
import type { GameMetadata } from '../types/GameMetadata';
import type { PaymentStatus } from '../types/GameTypes';

// ============================================================================
// Types
// ============================================================================

/**
 * Prize pool information
 */
export interface PrizePool {
  /** Daily prize pool amount in USDC */
  daily: number | null;
  /** Weekly prize pool amount in USDC */
  weekly?: number | null;
  /** All-time prize pool amount in USDC */
  allTime?: number | null;
}

/**
 * Game session state
 */
export interface GameSessionState {
  /** Session ID from backend (null if not paid yet) */
  sessionId: string | null;
  /** Current payment status */
  paymentStatus: PaymentStatus;
  /** Whether payment is being processed */
  isProcessing: boolean;
  /** Payment error message if any */
  errorMessage: string | null;
  /** Prize pool information */
  prizePool: PrizePool;
  /** Whether wallet is ready */
  walletReady: boolean;
  /** Connected wallet address */
  walletAddress: string | null;
}

/**
 * Hook return type
 */
export interface UseGameSessionReturn extends GameSessionState {
  /** Initiate payment flow */
  handlePayment: () => Promise<void>;
  /** Submit final score */
  submitScore: (score: number) => Promise<void>;
  /** Score submission state */
  scoreSubmission: {
    isSubmitting: boolean;
    isSuccess: boolean;
    isError: boolean;
    error: { code: string; message: string; retryable: boolean } | null;
  };
}

// ============================================================================
// Configuration
// ============================================================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Session expiry time (15 minutes)
const SESSION_EXPIRY_MS = 15 * 60 * 1000;

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Custom hook for managing game sessions.
 *
 * Wraps the payment flow, session management, and score submission
 * patterns from Snake's Game.tsx into a reusable hook.
 *
 * @param metadata - Game metadata including pricing and ID
 * @returns Game session state and methods
 *
 * @example
 * ```tsx
 * function MyGamePage() {
 *   const session = useGameSession(myGameMetadata);
 *
 *   if (!session.sessionId) {
 *     return <PaymentGate
 *       gameInfo={myGameMetadata}
 *       onPay={session.handlePayment}
 *       isProcessing={session.isProcessing}
 *       error={session.errorMessage}
 *     />;
 *   }
 *
 *   return <MyGame
 *     sessionId={session.sessionId}
 *     onGameOver={session.submitScore}
 *   />;
 * }
 * ```
 */
export function useGameSession(metadata: GameMetadata): UseGameSessionReturn {
  // ========================================
  // External Hooks
  // ========================================

  const { isReady: walletReady, address: walletAddress } = useWallet();
  const { createAuthorization, status: x402Status, error: x402Error } = useX402();
  const scoreSubmissionHook = useScoreSubmission();

  // ========================================
  // Local State
  // ========================================

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [prizePool, setPrizePool] = useState<PrizePool>({
    daily: null,
    weekly: null,
    allTime: null,
  });

  // Derive payment status from x402 hook and local state
  const paymentStatus: PaymentStatus = sessionId
    ? 'paid'
    : isProcessing
      ? 'processing'
      : x402Status === 'signing'
        ? 'processing'
        : 'pending';

  // ========================================
  // Prize Pool Fetching
  // ========================================

  /**
   * Fetch current prize pools from backend
   */
  useEffect(() => {
    const fetchPrizePools = async () => {
      try {
        // Fetch daily pool (primary)
        const dailyRes = await fetch(`${API_URL}/api/v1/prize/${metadata.id}/daily`);

        if (dailyRes.ok) {
          const dailyData = await dailyRes.json();
          setPrizePool((prev) => ({
            ...prev,
            daily: dailyData.pool.totalAmountUsdc,
          }));
        }
      } catch {
        // Silently fail - prize pool is not critical for page load
      }
    };

    fetchPrizePools();
  }, [metadata.id]);

  // ========================================
  // Session Restoration
  // ========================================

  /**
   * Restore session from localStorage on mount
   * Sessions expire after 15 minutes
   */
  useEffect(() => {
    if (sessionId) return; // Already have session

    const storedSessionId = localStorage.getItem(`game_session_${metadata.id}`);
    const storedTimestamp = localStorage.getItem(`game_session_${metadata.id}_timestamp`);

    if (storedSessionId && storedTimestamp) {
      const sessionAge = Date.now() - parseInt(storedTimestamp);

      // If session is less than 15 minutes old, restore it
      if (sessionAge < SESSION_EXPIRY_MS) {
        setSessionId(storedSessionId);
      } else {
        // Session expired, clean up
        localStorage.removeItem(`game_session_${metadata.id}`);
        localStorage.removeItem(`game_session_${metadata.id}_timestamp`);
      }
    }
  }, [metadata.id, sessionId]);

  // ========================================
  // Payment Flow
  // ========================================

  /**
   * Handle x402 payment flow
   * Extracted from Game.tsx:185-274
   *
   * Steps:
   * 1. Call backend endpoint (returns 402)
   * 2. Get EIP-3009 signature from wallet
   * 3. Retry with signed payment
   * 4. Store session ID on success
   */
  const handlePayment = useCallback(async () => {
    if (!walletReady || !walletAddress) {
      setErrorMessage('Please connect your wallet to play');
      return;
    }

    const gamePrice = metadata.pricing.baseCost.toString();

    try {
      setIsProcessing(true);
      setErrorMessage(null);

      // Step 1: Get arcade wallet address from initial request
      const initialResponse = await fetch(`${API_URL}/api/v1/play/${metadata.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (initialResponse.status !== 402) {
        throw new Error('Expected 402 Payment Required response');
      }

      // Parse x402 payment requirements
      const paymentRequired = initialResponse.headers.get('X-Payment-Required');
      if (!paymentRequired) {
        throw new Error('Missing X-Payment-Required header');
      }

      const paymentInfo = JSON.parse(atob(paymentRequired));
      const arcadeWallet = paymentInfo.payTo as `0x${string}`;

      // Step 2: Create EIP-3009 authorization
      const authorization = await createAuthorization({
        to: arcadeWallet,
        amount: gamePrice,
        validitySeconds: 3600,
      });

      // Step 3: Encode authorization for X-Payment header
      const paymentHeader = createPaymentHeader({
        network: 'cronos-testnet',
        message: {
          from: authorization.message.from,
          to: authorization.message.to,
          value: authorization.message.value.toString(),
          validAfter: authorization.message.validAfter.toString(),
          validBefore: authorization.message.validBefore.toString(),
          nonce: authorization.message.nonce,
        },
        v: authorization.v,
        r: authorization.r,
        s: authorization.s,
        asset: paymentInfo.tokenAddress,
      });

      // Step 4: Retry request with signed payment
      const paymentResponse = await fetch(`${API_URL}/api/v1/play/${metadata.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Payment': paymentHeader,
        },
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.message || 'Payment failed');
      }

      const result = await paymentResponse.json();

      // Store session ID in localStorage for restoration on page reload
      if (result.sessionId) {
        localStorage.setItem(`game_session_${metadata.id}`, result.sessionId);
        localStorage.setItem(`game_session_${metadata.id}_timestamp`, Date.now().toString());
      }

      setSessionId(result.sessionId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  }, [walletReady, walletAddress, metadata.id, metadata.pricing.baseCost, createAuthorization]);

  // ========================================
  // Score Submission
  // ========================================

  /**
   * Submit final score to backend
   * Wraps useScoreSubmission hook
   */
  const submitScore = useCallback(
    async (score: number) => {
      if (!sessionId) {
        // eslint-disable-next-line no-console
        console.error('Cannot submit score: no session ID');
        return;
      }

      await scoreSubmissionHook.submit(sessionId, score);
    },
    [sessionId, scoreSubmissionHook]
  );

  // ========================================
  // Return Hook API
  // ========================================

  return {
    // Session state
    sessionId,
    paymentStatus,
    isProcessing,
    errorMessage: errorMessage || (x402Error ? x402Error.message : null),
    prizePool,
    walletReady,
    walletAddress,

    // Actions
    handlePayment,
    submitScore,

    // Score submission state
    scoreSubmission: {
      isSubmitting: scoreSubmissionHook.isSubmitting,
      isSuccess: scoreSubmissionHook.isSuccess,
      isError: scoreSubmissionHook.isError,
      error: scoreSubmissionHook.error,
    },
  };
}

export default useGameSession;
