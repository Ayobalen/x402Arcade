/**
 * Game Service
 *
 * Core service for managing game sessions with x402 payment integration.
 * This module provides the main functions for starting, managing, and completing games.
 *
 * @module services/game
 */

import { v4 as uuidv4 } from 'uuid';
import type { Database as DatabaseType } from 'better-sqlite3';
import type { PaymentPayload } from '../server/x402/types.js';
import { createDefaultX402Config, validatePaymentPayload } from '../server/x402/types.js';
import {
  settlePaymentRequest,
  isSettlementSuccess,
  extractSettlementError,
  type SettlementRawResponse,
} from '../server/x402/settlement.js';
import { assertValidScore } from '../lib/score-validation.js';

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
 *
 * Maps database columns to camelCase properties for use in the application.
 * Database schema: game_sessions table
 */
export interface GameSession {
  /** Unique session identifier (maps to: id) */
  id: string;
  /** Type of game being played (maps to: game_type) */
  gameType: 'snake' | 'tetris';
  /** Player's wallet address (maps to: player_address) */
  playerAddress: string;
  /** Payment transaction hash (maps to: payment_tx_hash) */
  paymentTxHash: string;
  /** Amount paid in USDC, in smallest units (maps to: amount_paid_usdc) */
  amountPaidUsdc: number;
  /** Final game score, null if not completed (maps to: score) */
  score: number | null;
  /** Session status (maps to: status) */
  status: 'active' | 'completed' | 'expired';
  /** Session creation timestamp ISO string (maps to: created_at) */
  createdAt: string;
  /** Session completion timestamp ISO string (maps to: completed_at) */
  completedAt: string | null;
  /** Game duration in milliseconds (maps to: game_duration_ms) */
  gameDurationMs: number | null;
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
 * Parameters for creating a game session.
 *
 * Used when creating a new session record in the database after
 * successful payment settlement.
 */
export interface CreateSessionParams {
  /** Type of game being played */
  gameType: 'snake' | 'tetris';
  /** Player's wallet address */
  playerAddress: string;
  /** Blockchain transaction hash for the payment */
  paymentTxHash: string;
  /** Amount paid in USDC (smallest units, 6 decimals) */
  amountPaidUsdc: number;
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

/**
 * Options for retrieving player sessions.
 */
export interface GetPlayerSessionsOptions {
  /** Player's wallet address */
  playerAddress: string;
  /** Filter by game type (optional) */
  gameType?: GameType;
  /** Filter by session status (optional) */
  status?: SessionStatus;
  /** Maximum number of sessions to return (default: 50) */
  limit?: number;
  /** Number of sessions to skip for pagination (default: 0) */
  offset?: number;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Game prices in USDC (smallest units, 6 decimals).
 * 10000 = $0.01 USDC
 */
export const GAME_PRICES: Record<GameType, string> = {
  snake: '10000', // $0.01
  tetris: '20000', // $0.02
  pong: '10000', // $0.01
  breakout: '15000', // $0.015
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
 * Session timeout in milliseconds (15 minutes).
 * Optimized for arcade gaming - balances value perception with engagement.
 */
export const SESSION_TIMEOUT_MS = 15 * 60 * 1000;

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
  return Array.from(sessions.values()).filter(
    (s) => s.playerAddress.toLowerCase() === playerAddress.toLowerCase()
  );
}

/**
 * Get active session for a player.
 */
export function getActiveSession(playerAddress: string): GameSession | undefined {
  return Array.from(sessions.values()).find(
    (s) => s.playerAddress.toLowerCase() === playerAddress.toLowerCase() && s.status === 'active'
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
    gameType: gameType as 'snake' | 'tetris',
    playerAddress,
    paymentTxHash: txHash,
    amountPaidUsdc: parseFloat(paymentPayload.value),
    score: null,
    status: 'active',
    createdAt: new Date().toISOString(),
    completedAt: null,
    gameDurationMs: null,
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
 * @throws {ScoreValidationError} If the score is invalid
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

  // Validate score before accepting it
  // This will throw ScoreValidationError if invalid
  const validatedScore = assertValidScore(score, session.gameType);

  const startedAt = new Date(session.createdAt).getTime();
  const gameDurationMs = Date.now() - startedAt;

  const updatedSession: GameSession = {
    ...session,
    status: 'completed',
    score: validatedScore,
    completedAt: new Date().toISOString(),
    gameDurationMs,
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

// ============================================================================
// Session ID Extraction and Validation
// ============================================================================

/**
 * Session ID format regex.
 * Valid session IDs are UUIDs (v4 format).
 */
const SESSION_ID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate a session ID format.
 *
 * @param sessionId - The session ID to validate
 * @returns Whether the session ID is a valid UUID v4
 *
 * @example
 * ```typescript
 * if (isValidSessionId(sessionId)) {
 *   const session = getSession(sessionId);
 * }
 * ```
 */
export function isValidSessionId(sessionId: string): boolean {
  if (!sessionId || typeof sessionId !== 'string') {
    return false;
  }
  return SESSION_ID_REGEX.test(sessionId);
}

/**
 * Result of extracting a session ID from a response.
 */
export interface ExtractSessionResult {
  /** Whether extraction was successful */
  success: boolean;
  /** The extracted session ID (if successful) */
  sessionId?: string;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Extract and validate session ID from a game start response.
 *
 * This function parses the response body from the startGame API
 * and extracts the session ID if the payment was successful.
 *
 * @param responseBody - The response body from the game start endpoint
 * @returns Extraction result with session ID or error
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/play/snake', {
 *   method: 'POST',
 *   headers: { 'X-Payment': encodedPayment },
 * });
 * const body = await response.json();
 * const result = extractSessionId(body);
 *
 * if (result.success) {
 *   console.log('Session ID:', result.sessionId);
 *   // Store in state and start game
 * }
 * ```
 */
export function extractSessionId(responseBody: unknown): ExtractSessionResult {
  // Validate response body is an object
  if (!responseBody || typeof responseBody !== 'object') {
    return {
      success: false,
      error: 'Invalid response body: expected object',
    };
  }

  const body = responseBody as Record<string, unknown>;

  // Check if this was a successful response
  if (body.success === false) {
    return {
      success: false,
      error: (body.error as string) || 'Request failed',
    };
  }

  // Extract session from various possible response structures
  let sessionId: string | undefined;

  // Direct sessionId field
  if (typeof body.sessionId === 'string') {
    sessionId = body.sessionId;
  }
  // Nested in session object
  else if (body.session && typeof (body.session as Record<string, unknown>).id === 'string') {
    sessionId = (body.session as Record<string, unknown>).id as string;
  }
  // Nested in data object
  else if (body.data && typeof (body.data as Record<string, unknown>).sessionId === 'string') {
    sessionId = (body.data as Record<string, unknown>).sessionId as string;
  }
  // Nested in data.session
  else if (
    body.data &&
    (body.data as Record<string, unknown>).session &&
    typeof ((body.data as Record<string, unknown>).session as Record<string, unknown>).id ===
      'string'
  ) {
    sessionId = ((body.data as Record<string, unknown>).session as Record<string, unknown>)
      .id as string;
  }

  // Validate session ID was found
  if (!sessionId) {
    return {
      success: false,
      error: 'No session ID found in response',
    };
  }

  // Validate session ID format
  if (!isValidSessionId(sessionId)) {
    return {
      success: false,
      error: `Invalid session ID format: ${sessionId}`,
    };
  }

  return {
    success: true,
    sessionId,
  };
}

/**
 * Parse a successful game start response and return the session.
 *
 * This is a convenience function that extracts the session ID and
 * retrieves the full session object from the store.
 *
 * @param responseBody - The response body from the game start endpoint
 * @returns The game session or null if extraction/lookup failed
 *
 * @example
 * ```typescript
 * const session = parseGameStartResponse(responseBody);
 * if (session) {
 *   console.log('Playing:', session.gameType);
 * }
 * ```
 */
export function parseGameStartResponse(responseBody: unknown): GameSession | null {
  const result = extractSessionId(responseBody);

  if (!result.success || !result.sessionId) {
    return null;
  }

  return getSession(result.sessionId) || null;
}

// ============================================================================
// GameService Class (Database-backed)
// ============================================================================

/**
 * GameService class for managing game sessions with database persistence.
 *
 * This class provides a clean API for game session operations using
 * dependency injection for testability.
 *
 * @example
 * ```typescript
 * import { getDatabase } from '../db';
 * const gameService = new GameService(getDatabase());
 *
 * // Create a session
 * const session = gameService.createSession({
 *   gameType: 'snake',
 *   playerAddress: '0x1234...',
 *   paymentTxHash: '0xabcd...',
 *   amountPaidUsdc: 0.01
 * });
 * ```
 */
export class GameService {
  /**
   * Database instance for persistence
   */
  private db: DatabaseType;

  /**
   * Create a new GameService instance
   *
   * @param database - SQLite database instance
   */
  constructor(database: DatabaseType) {
    this.db = database;
  }

  /**
   * Create a new game session
   *
   * Inserts a new session record into the database with the provided parameters.
   * Generates a UUID for the session ID and sets initial status to 'active'.
   *
   * @param params - Session creation parameters
   * @returns The created game session
   * @throws Error if database insert fails or constraint is violated
   *
   * @example
   * ```typescript
   * const session = gameService.createSession({
   *   gameType: 'snake',
   *   playerAddress: '0x1234...',
   *   paymentTxHash: '0xabcd...',
   *   amountPaidUsdc: 0.01
   * });
   * console.log('Session created:', session.id);
   * ```
   */
  createSession(params: CreateSessionParams): GameSession {
    const { gameType, playerAddress, paymentTxHash, amountPaidUsdc } = params;

    // Bug #10 fix: Normalize player address to lowercase for database
    // Database has CHECK constraint: player_address = lower(player_address)
    const normalizedAddress = playerAddress.toLowerCase();

    // Generate a unique session ID
    const sessionId = uuidv4();
    const now = new Date().toISOString();

    try {
      // Insert the new session into the database
      const stmt = this.db.prepare(`
        INSERT INTO game_sessions (
          id,
          game_type,
          player_address,
          payment_tx_hash,
          amount_paid_usdc,
          score,
          status,
          created_at,
          completed_at,
          game_duration_ms
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        sessionId,
        gameType,
        normalizedAddress,
        paymentTxHash,
        amountPaidUsdc,
        null, // score (null until game is completed)
        'active', // initial status
        now, // created_at
        null, // completed_at (null until game is completed)
        null // game_duration_ms (null until game is completed)
      );

      // Return the created session
      return {
        id: sessionId,
        gameType,
        playerAddress: normalizedAddress,
        paymentTxHash,
        amountPaidUsdc,
        score: null,
        status: 'active',
        createdAt: now,
        completedAt: null,
        gameDurationMs: null,
      };
    } catch (error) {
      // Handle constraint violations and other database errors
      if (error instanceof Error) {
        // Check for UNIQUE constraint violation on payment_tx_hash
        if (error.message.includes('UNIQUE constraint failed: game_sessions.payment_tx_hash')) {
          throw new Error(`Payment transaction hash already used: ${paymentTxHash}`);
        }
        // Re-throw other errors
        throw new Error(`Failed to create game session: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get a game session by ID
   *
   * Retrieves a session from the database by its unique identifier.
   * Returns null if the session does not exist.
   *
   * @param id - The session ID to look up
   * @returns The game session or null if not found
   *
   * @example
   * ```typescript
   * const session = gameService.getSession('550e8400-e29b-41d4-a716-446655440000');
   * if (session) {
   *   console.log('Found session for player:', session.playerAddress);
   * } else {
   *   console.log('Session not found');
   * }
   * ```
   */
  getSession(id: string): GameSession | null {
    try {
      // Use SQL aliases to map snake_case columns to camelCase directly
      const stmt = this.db.prepare(`
        SELECT
          id,
          game_type AS gameType,
          player_address AS playerAddress,
          payment_tx_hash AS paymentTxHash,
          amount_paid_usdc AS amountPaidUsdc,
          score,
          status,
          created_at AS createdAt,
          completed_at AS completedAt,
          game_duration_ms AS gameDurationMs
        FROM game_sessions
        WHERE id = ?
      `);

      const row = stmt.get(id) as GameSession | undefined;

      if (!row) {
        return null;
      }

      // Row is already in camelCase format from SQL aliases
      return row;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get game session: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Complete a game session with final score
   *
   * Updates the session status to 'completed', records the score,
   * sets the completion timestamp, and calculates game duration.
   *
   * @param id - The session ID to complete
   * @param score - The final score achieved by the player
   * @returns The updated game session
   * @throws Error if session not found, not active, or database update fails
   *
   * @example
   * ```typescript
   * const session = gameService.completeSession(
   *   '550e8400-e29b-41d4-a716-446655440000',
   *   15000
   * );
   * console.log('Game completed with score:', session.score);
   * ```
   */
  completeSession(id: string, score: number): GameSession {
    // Step 1: Verify session exists
    const session = this.getSession(id);

    if (!session) {
      throw new Error(`Session not found: ${id}`);
    }

    // Step 2: Verify session status is active
    if (session.status !== 'active') {
      throw new Error(`Cannot complete session with status: ${session.status}`);
    }

    // Step 3: Calculate game duration
    const completedAt = new Date().toISOString();
    const startedAt = new Date(session.createdAt).getTime();
    const completedAtMs = new Date(completedAt).getTime();
    const gameDurationMs = completedAtMs - startedAt;

    try {
      // Step 4: Execute UPDATE query with atomic status validation
      // WHERE clause ensures the session is still active (prevents race conditions)
      const stmt = this.db.prepare(`
        UPDATE game_sessions
        SET
          score = ?,
          status = 'completed',
          completed_at = ?,
          game_duration_ms = ?
        WHERE id = ? AND status = 'active'
      `);

      const result = stmt.run(score, completedAt, gameDurationMs, id);

      // Step 5: Verify that the update actually affected a row
      // If changes is 0, the session either doesn't exist or isn't active
      if (result.changes === 0) {
        // Re-fetch to provide better error message
        const currentSession = this.getSession(id);
        if (!currentSession) {
          throw new Error(`Session not found: ${id}`);
        }
        throw new Error(`Cannot complete session with status: ${currentSession.status}`);
      }

      // Step 6: Return updated session
      return {
        ...session,
        score,
        status: 'completed',
        completedAt,
        gameDurationMs,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to complete game session: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get active session for a player and game type
   *
   * Finds the player's current active session for a specific game type.
   * This enforces the single-session-per-game rule: a player can only have
   * one active session per game type at a time.
   *
   * Sessions are considered stale if they exceed SESSION_TIMEOUT_MS (30 minutes).
   * Stale sessions are automatically expired before returning.
   *
   * @param playerAddress - The player's wallet address
   * @param gameType - The type of game to check for
   * @returns The active session or null if none exists
   *
   * @example
   * ```typescript
   * const activeSession = gameService.getActiveSession(
   *   '0x1234567890abcdef1234567890abcdef12345678',
   *   'snake'
   * );
   *
   * if (activeSession) {
   *   console.log('Player already has an active game:', activeSession.id);
   * } else {
   *   // Allow player to start a new game
   * }
   * ```
   */
  getActiveSession(playerAddress: string, gameType: GameType): GameSession | null {
    try {
      // Use SQL aliases to map snake_case columns to camelCase directly
      const stmt = this.db.prepare(`
        SELECT
          id,
          game_type AS gameType,
          player_address AS playerAddress,
          payment_tx_hash AS paymentTxHash,
          amount_paid_usdc AS amountPaidUsdc,
          score,
          status,
          created_at AS createdAt,
          completed_at AS completedAt,
          game_duration_ms AS gameDurationMs
        FROM game_sessions
        WHERE player_address = ? AND game_type = ? AND status = 'active'
        ORDER BY created_at DESC
        LIMIT 1
      `);

      const row = stmt.get(playerAddress.toLowerCase(), gameType) as GameSession | undefined;

      if (!row) {
        return null;
      }

      // Check if session is stale (exceeded timeout)
      const createdAt = new Date(row.createdAt).getTime();
      const now = Date.now();
      const sessionAge = now - createdAt;

      if (sessionAge > SESSION_TIMEOUT_MS) {
        // Session is stale - expire it
        this.expireSession(row.id);
        return null;
      }

      return row;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get active session: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Expire a game session
   *
   * Marks an active session as expired. This is typically done when:
   * - A session exceeds SESSION_TIMEOUT_MS without completion
   * - Cleanup processes run to remove stale sessions
   *
   * @param id - The session ID to expire
   * @returns Whether the session was successfully expired
   *
   * @example
   * ```typescript
   * const expired = gameService.expireSession('550e8400-e29b-41d4-a716-446655440000');
   * if (expired) {
   *   console.log('Session expired');
   * }
   * ```
   */
  expireSession(id: string): boolean {
    try {
      const completedAt = new Date().toISOString();

      const stmt = this.db.prepare(`
        UPDATE game_sessions
        SET
          status = 'expired',
          completed_at = ?
        WHERE id = ? AND status = 'active'
      `);

      const result = stmt.run(completedAt, id);

      return result.changes > 0;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to expire session: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get player's game sessions with filtering and pagination
   *
   * Retrieves a player's game history with support for:
   * - Filtering by game type
   * - Filtering by session status
   * - Pagination (limit + offset)
   * - Most recent sessions first
   *
   * @param options - Query options for filtering and pagination
   * @returns Array of game sessions matching the criteria
   *
   * @example
   * ```typescript
   * // Get player's recent games (all types, all statuses)
   * const recentGames = gameService.getPlayerSessions({
   *   playerAddress: '0x1234567890abcdef1234567890abcdef12345678',
   *   limit: 10
   * });
   *
   * // Get player's completed Snake games
   * const snakeGames = gameService.getPlayerSessions({
   *   playerAddress: '0x1234567890abcdef1234567890abcdef12345678',
   *   gameType: 'snake',
   *   status: 'completed'
   * });
   *
   * // Paginate through player's history
   * const page2 = gameService.getPlayerSessions({
   *   playerAddress: '0x1234567890abcdef1234567890abcdef12345678',
   *   limit: 20,
   *   offset: 20
   * });
   * ```
   */
  getPlayerSessions(options: GetPlayerSessionsOptions): GameSession[] {
    const { playerAddress, gameType, status, limit = 50, offset = 0 } = options;

    try {
      // Build dynamic WHERE clause based on filters
      const whereClauses: string[] = ['player_address = ?'];
      const params: (string | number)[] = [playerAddress.toLowerCase()];

      if (gameType) {
        whereClauses.push('game_type = ?');
        params.push(gameType);
      }

      if (status) {
        whereClauses.push('status = ?');
        params.push(status);
      }

      const whereClause = whereClauses.join(' AND ');

      // Add limit and offset to params
      params.push(limit, offset);

      // Use SQL aliases to map snake_case columns to camelCase directly
      const stmt = this.db.prepare(`
        SELECT
          id,
          game_type AS gameType,
          player_address AS playerAddress,
          payment_tx_hash AS paymentTxHash,
          amount_paid_usdc AS amountPaidUsdc,
          score,
          status,
          created_at AS createdAt,
          completed_at AS completedAt,
          game_duration_ms AS gameDurationMs
        FROM game_sessions
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `);

      const rows = stmt.all(...params) as GameSession[];

      return rows;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get player sessions: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Expire old active sessions
   *
   * Marks active sessions as expired if they exceed the specified age.
   * Sessions are considered abandoned if they remain active for more than
   * maxAgeMinutes without completion.
   *
   * This method should be called periodically (e.g., via cron job) to clean up
   * stale sessions and free up resources.
   *
   * @param maxAgeMinutes - Maximum age in minutes before expiring (default: 30)
   * @returns Number of sessions that were expired
   *
   * @example
   * ```typescript
   * // Expire sessions older than 30 minutes (default)
   * const expiredCount = gameService.expireOldSessions();
   * console.log(`Expired ${expiredCount} stale sessions`);
   *
   * // Use custom timeout (e.g., 15 minutes)
   * const expiredCount = gameService.expireOldSessions(15);
   * ```
   */
  expireOldSessions(maxAgeMinutes: number = 30): number {
    try {
      const completedAt = new Date().toISOString();

      // Calculate threshold timestamp using SQLite datetime functions
      // datetime('now', '-N minutes') calculates the cutoff time
      const stmt = this.db.prepare(`
        UPDATE game_sessions
        SET
          status = 'expired',
          completed_at = ?
        WHERE status = 'active'
          AND created_at < datetime('now', '-${maxAgeMinutes} minutes')
      `);

      const result = stmt.run(completedAt);

      return result.changes;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to expire old sessions: ${error.message}`);
      }
      throw error;
    }
  }
}
