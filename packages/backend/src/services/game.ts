/**
 * Game Service
 *
 * Core service for managing game sessions with x402 payment integration.
 * This module provides the main functions for starting, managing, and completing games.
 *
 * @module services/game
 */

import { v4 as uuidv4 } from 'uuid';
import type { PaymentPayload } from '../server/x402/types.js';
import { createDefaultX402Config, validatePaymentPayload } from '../server/x402/types.js';
import {
  settlePaymentRequest,
  isSettlementSuccess,
  extractSettlementError,
  type SettlementRawResponse,
} from '../server/x402/settlement.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Supported game types in the arcade.
 */
export type GameType = 'snake' | 'tetris' | 'pong' | 'breakout' | 'space_invaders';

/**
 * Game session status.
 */
export type SessionStatus = 'pending' | 'active' | 'completed' | 'expired' | 'failed';

/**
 * Game session information.
 */
export interface GameSession {
  /** Unique session identifier */
  id: string;
  /** Type of game being played */
  gameType: GameType;
  /** Player's wallet address */
  playerAddress: string;
  /** Payment transaction hash */
  paymentTxHash: string;
  /** Amount paid in USDC (smallest units) */
  amountPaid: string;
  /** Session status */
  status: SessionStatus;
  /** Session creation timestamp (ISO string) */
  createdAt: string;
  /** Session start timestamp when game actually begins */
  startedAt?: string;
  /** Session completion timestamp */
  completedAt?: string;
  /** Final game score */
  score?: number;
  /** Game duration in milliseconds */
  durationMs?: number;
}

/**
 * Payment requirements for a game.
 */
export interface GamePaymentRequirement {
  /** Game type */
  gameType: GameType;
  /** Required payment amount in USDC (smallest units) */
  amount: string;
  /** Recipient wallet address */
  recipient: string;
  /** Chain ID for the payment */
  chainId: number;
  /** Token address for payment */
  tokenAddress: string;
  /** Token name */
  tokenName: string;
  /** Token decimals */
  tokenDecimals: number;
  /** Human-readable description */
  description: string;
  /** API endpoint for the game */
  endpoint: string;
}

/**
 * Options for starting a game.
 */
export interface StartGameOptions {
  /** Type of game to start */
  gameType: GameType;
  /** Player's wallet address */
  playerAddress: string;
  /** The signed payment payload */
  paymentPayload: PaymentPayload;
  /** Skip actual settlement (for testing) */
  skipSettlement?: boolean;
}

/**
 * Result of starting a game.
 */
export interface StartGameResult {
  /** Whether the game started successfully */
  success: boolean;
  /** The game session (if successful) */
  session?: GameSession;
  /** Error message (if failed) */
  error?: string;
  /** Error code (if failed) */
  errorCode?: string;
  /** Settlement response (if payment was settled) */
  settlement?: SettlementRawResponse;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Game prices in USDC (smallest units, 6 decimals).
 * 10000 = $0.01 USDC
 */
export const GAME_PRICES: Record<GameType, string> = {
  snake: '10000',        // $0.01
  tetris: '20000',       // $0.02
  pong: '10000',         // $0.01
  breakout: '15000',     // $0.015
  space_invaders: '25000', // $0.025
};

/**
 * Game descriptions for payment requirements.
 */
export const GAME_DESCRIPTIONS: Record<GameType, string> = {
  snake: 'Play Snake - Classic arcade action',
  tetris: 'Play Tetris - Stack and clear',
  pong: 'Play Pong - Retro paddle game',
  breakout: 'Play Breakout - Break the bricks',
  space_invaders: 'Play Space Invaders - Defend Earth',
};

/**
 * Session timeout in milliseconds (30 minutes).
 */
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

// ============================================================================
// In-Memory Session Store (for MVP - replace with database in production)
// ============================================================================

const sessions = new Map<string, GameSession>();

/**
 * Get a session by ID.
 */
export function getSession(sessionId: string): GameSession | undefined {
  return sessions.get(sessionId);
}

/**
 * Get all sessions for a player.
 */
export function getPlayerSessions(playerAddress: string): GameSession[] {
  return Array.from(sessions.values())
    .filter(s => s.playerAddress.toLowerCase() === playerAddress.toLowerCase());
}

/**
 * Get active session for a player.
 */
export function getActiveSession(playerAddress: string): GameSession | undefined {
  return Array.from(sessions.values())
    .find(s =>
      s.playerAddress.toLowerCase() === playerAddress.toLowerCase() &&
      (s.status === 'active' || s.status === 'pending')
    );
}

/**
 * Save a session to the store.
 */
function saveSession(session: GameSession): void {
  sessions.set(session.id, session);
}

/**
 * Clear all sessions (for testing).
 */
export function clearSessions(): void {
  sessions.clear();
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Get payment requirements for a specific game type.
 *
 * Returns the information needed for a client to construct a payment
 * for playing a game.
 *
 * @param gameType - The type of game
 * @param arcadeWalletAddress - The arcade's wallet address to receive payments
 * @returns Payment requirements for the game
 *
 * @example
 * ```typescript
 * const requirements = getPaymentRequirements('snake', process.env.ARCADE_WALLET);
 * // Client uses this to construct and sign the payment
 * ```
 */
export function getPaymentRequirements(
  gameType: GameType,
  arcadeWalletAddress: string
): GamePaymentRequirement {
  const config = createDefaultX402Config(arcadeWalletAddress, GAME_PRICES[gameType]);

  return {
    gameType,
    amount: GAME_PRICES[gameType],
    recipient: arcadeWalletAddress,
    chainId: config.chainId,
    tokenAddress: config.tokenAddress,
    tokenName: config.tokenName,
    tokenDecimals: config.tokenDecimals,
    description: GAME_DESCRIPTIONS[gameType],
    endpoint: `/api/play/${gameType}`,
  };
}

/**
 * Start a game session with payment.
 *
 * This is the main function for starting a game. It:
 * 1. Validates the payment payload
 * 2. Verifies the payment amount matches the game price
 * 3. Settles the payment with the facilitator
 * 4. Creates and returns a game session
 *
 * @param options - Options for starting the game
 * @returns Result containing the game session or error
 *
 * @example
 * ```typescript
 * const result = await startGame({
 *   gameType: 'snake',
 *   playerAddress: '0x1234...',
 *   paymentPayload: parsedPaymentPayload,
 * });
 *
 * if (result.success) {
 *   console.log('Game started:', result.session.id);
 * } else {
 *   console.error('Failed to start:', result.error);
 * }
 * ```
 */
export async function startGame(options: StartGameOptions): Promise<StartGameResult> {
  const { gameType, playerAddress, paymentPayload, skipSettlement = false } = options;

  // Step 1: Validate the payment payload
  const validation = validatePaymentPayload(paymentPayload);
  if (!validation.valid) {
    return {
      success: false,
      error: `Invalid payment payload: ${validation.errors.join(', ')}`,
      errorCode: 'INVALID_PAYLOAD',
    };
  }

  // Step 2: Verify the payment amount matches the game price
  const expectedAmount = GAME_PRICES[gameType];
  if (paymentPayload.value !== expectedAmount) {
    return {
      success: false,
      error: `Payment amount mismatch: expected ${expectedAmount}, got ${paymentPayload.value}`,
      errorCode: 'AMOUNT_MISMATCH',
    };
  }

  // Step 3: Verify the player address matches the payment sender
  if (paymentPayload.from.toLowerCase() !== playerAddress.toLowerCase()) {
    return {
      success: false,
      error: 'Payment sender does not match player address',
      errorCode: 'SENDER_MISMATCH',
    };
  }

  // Step 4: Check for existing active session
  const existingSession = getActiveSession(playerAddress);
  if (existingSession) {
    return {
      success: false,
      error: 'Player already has an active game session',
      errorCode: 'SESSION_EXISTS',
      session: existingSession,
    };
  }

  // Step 5: Settle the payment (unless skipped for testing)
  let settlement: SettlementRawResponse | undefined;
  let txHash = paymentPayload.nonce; // Use nonce as fallback for testing

  if (!skipSettlement) {
    // Get arcade wallet from environment
    const arcadeWallet = process.env.ARCADE_WALLET_ADDRESS || paymentPayload.to;
    const config = createDefaultX402Config(arcadeWallet, expectedAmount);

    try {
      settlement = await settlePaymentRequest(paymentPayload, config);

      if (!isSettlementSuccess(settlement)) {
        const error = extractSettlementError(settlement);
        return {
          success: false,
          error: error?.message || 'Payment settlement failed',
          errorCode: error?.code || 'SETTLEMENT_FAILED',
          settlement,
        };
      }

      txHash = settlement.data.transaction.hash || txHash;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Settlement failed',
        errorCode: 'SETTLEMENT_ERROR',
      };
    }
  }

  // Step 6: Create the game session
  const session: GameSession = {
    id: uuidv4(),
    gameType,
    playerAddress,
    paymentTxHash: txHash,
    amountPaid: paymentPayload.value,
    status: 'active',
    createdAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
  };

  // Save the session
  saveSession(session);

  return {
    success: true,
    session,
    settlement,
  };
}

/**
 * Complete a game session with a score.
 *
 * @param sessionId - The session ID
 * @param score - The final score
 * @returns Updated session or error
 */
export function completeGame(
  sessionId: string,
  score: number
): { success: boolean; session?: GameSession; error?: string } {
  const session = getSession(sessionId);

  if (!session) {
    return { success: false, error: 'Session not found' };
  }

  if (session.status !== 'active') {
    return { success: false, error: `Cannot complete session with status: ${session.status}` };
  }

  const startedAt = session.startedAt ? new Date(session.startedAt).getTime() : Date.now();
  const durationMs = Date.now() - startedAt;

  const updatedSession: GameSession = {
    ...session,
    status: 'completed',
    score,
    completedAt: new Date().toISOString(),
    durationMs,
  };

  saveSession(updatedSession);

  return { success: true, session: updatedSession };
}

/**
 * Expire a game session.
 *
 * @param sessionId - The session ID
 * @returns Whether the session was expired
 */
export function expireSession(sessionId: string): boolean {
  const session = getSession(sessionId);

  if (!session || session.status !== 'active') {
    return false;
  }

  const updatedSession: GameSession = {
    ...session,
    status: 'expired',
    completedAt: new Date().toISOString(),
  };

  saveSession(updatedSession);
  return true;
}

/**
 * Check and expire old sessions.
 * Should be called periodically to clean up abandoned sessions.
 */
export function expireOldSessions(): number {
  const now = Date.now();
  let expiredCount = 0;

  for (const session of sessions.values()) {
    if (session.status === 'active') {
      const createdAt = new Date(session.createdAt).getTime();
      if (now - createdAt > SESSION_TIMEOUT_MS) {
        expireSession(session.id);
        expiredCount++;
      }
    }
  }

  return expiredCount;
}
