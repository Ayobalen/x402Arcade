/**
 * Common Game Types
 *
 * Shared types and enums used across the game template system.
 * These types are referenced by IGame, GameMetadata, and all hooks/components.
 */

/**
 * Game identifiers
 * Add new games here as they're implemented
 */
export type GameId =
  | 'snake'
  | 'pong'
  | 'tetris'
  | 'breakout'
  | 'space-invaders'
  | 'flappy-bird'
  | 'minesweeper';

/**
 * Game difficulty levels
 * All games should support at least 'normal' difficulty
 */
export type GameDifficulty = 'easy' | 'normal' | 'hard' | 'expert';

/**
 * Game state during gameplay
 * - idle: Game not yet started (initial state)
 * - playing: Game loop running, user can interact
 * - paused: Game loop stopped, can be resumed
 * - over: Game ended, showing final score
 */
export type GameState = 'idle' | 'playing' | 'paused' | 'over';

/**
 * Payment status for game session
 * - pending: Waiting for user to initiate payment
 * - processing: Payment being processed by x402 facilitator
 * - paid: Payment successful, game can start
 * - failed: Payment failed, show error
 */
export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed';

/**
 * Input key action types
 * - down: Key pressed
 * - up: Key released
 */
export type KeyAction = 'down' | 'up';

/**
 * Game sound effects
 * Games can use these standard sounds or define custom ones
 */
export type GameSound =
  | 'move'
  | 'collect'
  | 'hit'
  | 'lose'
  | 'win'
  | 'pause'
  | 'resume'
  | 'level-up'
  | 'game-over';

/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  score: number;
  timestamp: number;
  displayName?: string;
}

/**
 * Game session data from backend
 */
export interface GameSession {
  id: string;
  gameId: GameId;
  walletAddress: string;
  paymentStatus: PaymentStatus;
  score: number;
  difficulty: GameDifficulty;
  startedAt: number;
  endedAt?: number;
}

/**
 * Payment data for x402 flow
 */
export interface PaymentData {
  amount: number; // in USDC
  gameId: GameId;
  difficulty: GameDifficulty;
  signature?: string; // EIP-3009 signature
  nonce?: string;
  deadline?: number;
}

/**
 * Game control configuration
 */
export interface GameControls {
  primary: string[]; // Main movement/action keys (e.g., arrow keys)
  secondary?: string[]; // Alternative controls (e.g., WASD)
  pause: string; // Pause key (usually Space or Esc)
  restart?: string; // Restart key (optional)
}

/**
 * Game difficulty configuration
 */
export interface DifficultyConfig {
  default: GameDifficulty;
  available: GameDifficulty[];
}

/**
 * Game pricing configuration
 */
export interface PricingConfig {
  baseCost: number; // Cost in USDC (e.g., 0.01)
  difficultyMultiplier?: Record<GameDifficulty, number>; // Optional multipliers by difficulty
}

/**
 * Error types specific to games
 */
export class GameError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'GameError';
  }
}

/**
 * Common error codes
 */
export const GameErrorCode = {
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  WALLET_NOT_CONNECTED: 'WALLET_NOT_CONNECTED',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  GAME_INIT_FAILED: 'GAME_INIT_FAILED',
  SCORE_SUBMIT_FAILED: 'SCORE_SUBMIT_FAILED',
} as const;

export type GameErrorCodeType = (typeof GameErrorCode)[keyof typeof GameErrorCode];
