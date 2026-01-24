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

import type { Database as DatabaseType } from 'better-sqlite3';

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
export type GameType = 'snake' | 'tetris' | 'pong' | 'breakout' | 'space_invaders';

/**
 * Prize pool status lifecycle.
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
export class PrizePoolService {
  /**
   * Database instance for persistence
   */
  private db: DatabaseType;

  /**
   * Create a new PrizePoolService instance
   *
   * @param database - SQLite database instance
   */
  constructor(database: DatabaseType) {
    this.db = database;
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  // TODO: Implement prize pool methods
  // - addToPool: Add funds from a game payment
  // - getCurrentPool: Get the active pool for a game/period
  // - finalizePool: End a period and determine the winner
  // - recordPayout: Record the payout transaction

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Get today's date in YYYY-MM-DD format (UTC).
   *
   * Returns the current date in ISO 8601 date format using UTC timezone.
   * This ensures consistent date calculations regardless of server timezone.
   *
   * @returns Today's date string in YYYY-MM-DD format
   *
   * @example
   * ```typescript
   * const today = this.getTodayDate();
   * // Returns: "2026-01-24"
   * ```
   *
   * @private
   */
  private getTodayDate(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  /**
   * Get the Monday of the current week in YYYY-MM-DD format (UTC).
   *
   * Calculates the start of the current week (Monday) for weekly prize pools.
   * Uses UTC timezone for consistency. ISO week starts on Monday (day 1).
   *
   * Algorithm:
   * 1. Get current UTC date
   * 2. Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
   * 3. Calculate days to subtract to reach Monday
   * 4. Subtract those days to get Monday's date
   *
   * @returns Monday of current week in YYYY-MM-DD format
   *
   * @example
   * ```typescript
   * // If today is Friday, Jan 24, 2026
   * const weekStart = this.getWeekStart();
   * // Returns: "2026-01-19" (the preceding Monday)
   * ```
   *
   * @private
   */
  private getWeekStart(): string {
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Calculate days to subtract to reach Monday
    // If Sunday (0), go back 6 days
    // If Monday (1), go back 0 days
    // If Tuesday (2), go back 1 day, etc.
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    // Create a new date and subtract the calculated days
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - daysToSubtract);

    return monday.toISOString().split('T')[0];
  }
}
