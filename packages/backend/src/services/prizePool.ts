/**
 * Prize Pool Service
 *
 * Service for managing prize pools that accumulate from game payments.
 * Players compete for daily and weekly jackpots, with 70% of all game
 * payments funding the prize pools.
 *
 * Prize Pool Mechanics:
 * - 70% of each game payment goes to the prize pool
 * - 30% goes to platform operational costs
 * - Separate pools for each game type (snake, tetris, pong, etc.)
 * - Separate pools for each period (daily, weekly)
 * - Winner is the player with the highest score when period ends
 * - Prize is paid out on-chain via USDC transfer
 *
 * Prize Pool Lifecycle:
 * 1. Active: Pool is accumulating funds from new games
 * 2. Finalized: Period ended, winner determined, ready for payout
 * 3. Paid: Winner has been paid, pool closed
 *
 * @module services/prizePool
 */

// ============================================================================
// Constants
// ============================================================================

/**
 * Percentage of each game payment that goes to the prize pool.
 * The remaining percentage goes to platform operational costs.
 *
 * @example
 * ```typescript
 * // For a $0.01 game payment:
 * // Prize pool gets: $0.01 * 0.70 = $0.007
 * // Platform gets: $0.01 * 0.30 = $0.003
 * ```
 */
export const PRIZE_POOL_PERCENTAGE = 0.7;

// ============================================================================
// Types
// ============================================================================

/**
 * Prize pool period types.
 */
export type PeriodType = 'daily' | 'weekly';

/**
 * Supported game types.
 */
export type GameType =
  | 'snake'
  | 'tetris'
  | 'pong'
  | 'pong-phaser'
  | 'breakout'
  | 'space_invaders'
  | 'space-invaders';

/**
 * Prize pool status lifecycle.
 *
 * Status transitions:
 * 1. active: Pool is currently accumulating funds from new games
 * 2. finalized: Period has ended, winner determined, ready for payout
 * 3. paid: Winner has been paid, pool is closed
 *
 * @example
 * ```typescript
 * // Pool lifecycle flow
 * active -> finalized -> paid
 * ```
 */
export type PoolStatus = 'active' | 'finalized' | 'paid';

/**
 * Prize pool data structure.
 *
 * Represents a prize pool for a specific game, period, and date.
 */
export interface PrizePool {
  /** Auto-incrementing pool ID */
  id: number;
  /** Type of game */
  gameType: GameType;
  /** Period type (daily, weekly) */
  periodType: PeriodType;
  /** Period identifier (YYYY-MM-DD for daily, YYYY-MM-DD for week start) */
  periodDate: string;
  /** Total amount in the pool (USDC) */
  totalAmountUsdc: number;
  /** Total number of games played in this pool */
  totalGames: number;
  /** Pool status (active, finalized, paid) */
  status: PoolStatus;
  /** Winner's wallet address (null until finalized) */
  winnerAddress: string | null;
  /** Payout transaction hash (null until paid) */
  payoutTxHash: string | null;
  /** Pool creation timestamp */
  createdAt: string;
  /** Finalization timestamp (null until finalized) */
  finalizedAt: string | null;
}

/**
 * Top contributor data structure.
 *
 * Represents a player who contributed the most to a prize pool period.
 */
export interface TopContributor {
  /** Player's wallet address */
  playerAddress: string;
  /** Total amount contributed in USDC */
  totalContribution: number;
  /** Number of games played during this period */
  gamesPlayed: number;
}

/**
 * Daily statistics data structure.
 *
 * Aggregate statistics for all game types on a specific day.
 * Used for analytics dashboards and reporting.
 */
export interface DailyStats {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Total number of games played across all game types */
  totalGames: number;
  /** Total USDC collected in prize pools across all games */
  totalPrizePoolUsdc: number;
  /** Number of active game types (games with at least one pool) */
  activeGames: number;
  /** Per-game breakdown (optional) */
  gameBreakdown?: Array<{
    gameType: GameType;
    totalGames: number;
    totalPrizePoolUsdc: number;
  }>;
}

/**
 * Weekly statistics data structure.
 *
 * Aggregate statistics for all game types during a specific week.
 * Used for weekly reporting and trend analysis.
 */
export interface WeeklyStats {
  /** Week start date (Monday) in YYYY-MM-DD format */
  weekStart: string;
  /** Total number of games played across all game types during the week */
  totalGames: number;
  /** Total USDC collected in prize pools across all games during the week */
  totalPrizePoolUsdc: number;
  /** Number of active game types (games with at least one pool) */
  activeGames: number;
  /** Per-game breakdown (optional) */
  gameBreakdown?: Array<{
    gameType: GameType;
    totalGames: number;
    totalPrizePoolUsdc: number;
  }>;
}

// ============================================================================
// PrizePoolService Class
// ============================================================================

/**
 * PrizePoolService class for managing prize pools and payouts.
 *
 * This service provides methods for:
 * - Adding funds to prize pools from game payments
 * - Getting current pool balances
 * - Finalizing pools and determining winners
 * - Recording payout transactions
 *
 * @example
 * ```typescript
 * import { getDatabase } from '../db';
 * const prizePoolService = new PrizePoolService(getDatabase());
 *
 * // Add funds to the daily pool
 * await prizePoolService.addToPool({
 *   gameType: 'snake',
 *   periodType: 'daily',
 *   amountUsdc: 0.007  // 70% of $0.01 game payment
 * });
 * ```
 */

// Re-export Redis-based service
export { PrizePoolServiceRedis as PrizePoolService } from './prizePool-redis.js';
