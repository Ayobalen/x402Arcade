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
export type GameType = 'snake' | 'tetris' | 'pong' | 'breakout' | 'space_invaders';

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

  /**
   * Add funds to prize pools from a game payment.
   *
   * Takes a portion of the game payment (PRIZE_POOL_PERCENTAGE) and adds it
   * to both the daily and weekly prize pools for the specified game type.
   *
   * Uses UPSERT to create new pools if they don't exist, or update existing ones.
   * Pools are identified by (game_type, period_type, period_date) UNIQUE constraint.
   *
   * @param params - Parameters for adding to prize pool
   * @param params.gameType - Type of game (snake, tetris, pong, etc.)
   * @param params.amountUsdc - Full payment amount in USDC
   * @returns Object with daily and weekly pool totals after update
   *
   * @example
   * ```typescript
   * // Add $0.01 game payment to prize pools
   * const result = service.addToPrizePool({
   *   gameType: 'snake',
   *   amountUsdc: 0.01
   * });
   * // Result: { dailyTotal: 0.007, weeklyTotal: 0.007 }
   * // (70% of $0.01 goes to each pool)
   * ```
   */
  addToPrizePool(params: { gameType: GameType; amountUsdc: number }): {
    dailyTotal: number;
    weeklyTotal: number;
  } {
    const { gameType, amountUsdc } = params;

    // Calculate prize contribution (70% of payment)
    const prizeContribution = amountUsdc * PRIZE_POOL_PERCENTAGE;

    // Get current period dates
    const today = this.getTodayDate();
    const weekStart = this.getWeekStart();

    // UPSERT daily pool
    const upsertDaily = this.db.prepare(`
      INSERT INTO prize_pools (game_type, period_type, period_date, total_amount_usdc, total_games, status)
      VALUES (?, 'daily', ?, ?, 1, 'active')
      ON CONFLICT(game_type, period_type, period_date)
      DO UPDATE SET
        total_amount_usdc = total_amount_usdc + excluded.total_amount_usdc,
        total_games = total_games + 1
      RETURNING total_amount_usdc
    `);

    // UPSERT weekly pool
    const upsertWeekly = this.db.prepare(`
      INSERT INTO prize_pools (game_type, period_type, period_date, total_amount_usdc, total_games, status)
      VALUES (?, 'weekly', ?, ?, 1, 'active')
      ON CONFLICT(game_type, period_type, period_date)
      DO UPDATE SET
        total_amount_usdc = total_amount_usdc + excluded.total_amount_usdc,
        total_games = total_games + 1
      RETURNING total_amount_usdc
    `);

    // Execute both UPSERTS
    const dailyResult = upsertDaily.get(gameType, today, prizeContribution) as {
      total_amount_usdc: number;
    };
    const weeklyResult = upsertWeekly.get(gameType, weekStart, prizeContribution) as {
      total_amount_usdc: number;
    };

    return {
      dailyTotal: dailyResult.total_amount_usdc,
      weeklyTotal: weeklyResult.total_amount_usdc,
    };
  }

  /**
   * Get the current active prize pool for a specific game and period.
   *
   * Retrieves the active pool for the current period (today for daily, this week for weekly).
   * Returns null if no pool exists yet for the current period.
   *
   * @param params - Parameters for retrieving pool
   * @param params.gameType - Type of game (snake, tetris, etc.)
   * @param params.periodType - Period type (daily or weekly)
   * @returns PrizePool object or null if no pool exists
   *
   * @example
   * ```typescript
   * // Get today's snake daily pool
   * const pool = service.getCurrentPool({
   *   gameType: 'snake',
   *   periodType: 'daily'
   * });
   * // Returns: { id: 1, gameType: 'snake', periodType: 'daily', totalAmountUsdc: 0.07, ... } or null
   * ```
   */
  getCurrentPool(params: { gameType: GameType; periodType: PeriodType }): PrizePool | null {
    const { gameType, periodType } = params;

    // Calculate current period date
    const periodDate = periodType === 'daily' ? this.getTodayDate() : this.getWeekStart();

    // Query for the current pool
    const query = this.db.prepare(`
      SELECT
        id,
        game_type as gameType,
        period_type as periodType,
        period_date as periodDate,
        total_amount_usdc as totalAmountUsdc,
        total_games as totalGames,
        status,
        winner_address as winnerAddress,
        payout_tx_hash as payoutTxHash,
        created_at as createdAt,
        finalized_at as finalizedAt
      FROM prize_pools
      WHERE game_type = ? AND period_type = ? AND period_date = ?
    `);

    const result = query.get(gameType, periodType, periodDate) as PrizePool | undefined;

    return result ?? null;
  }

  /**
   * Get historical prize pools for a specific game and period.
   *
   * Retrieves past prize pools ordered by most recent first.
   * Useful for displaying prize history and analytics.
   * Supports pagination via limit and offset parameters.
   *
   * @param params - Query parameters
   * @param params.gameType - Type of game (snake, tetris, etc.)
   * @param params.periodType - Period type (daily or weekly)
   * @param params.limit - Maximum number of pools to return (default: 10)
   * @param params.offset - Number of pools to skip for pagination (default: 0)
   * @returns Array of PrizePool objects ordered by period_date descending
   *
   * @example
   * ```typescript
   * // Get the last 5 daily snake pools
   * const history = service.getPoolHistory({
   *   gameType: 'snake',
   *   periodType: 'daily',
   *   limit: 5,
   *   offset: 0
   * });
   * // Returns: [today's pool, yesterday's pool, ...]
   * ```
   */
  getPoolHistory(params: {
    gameType: GameType;
    periodType: PeriodType;
    limit?: number;
    offset?: number;
  }): PrizePool[] {
    const { gameType, periodType, limit = 10, offset = 0 } = params;

    // Query for historical pools, ordered by most recent first
    const query = this.db.prepare(`
      SELECT
        id,
        game_type as gameType,
        period_type as periodType,
        period_date as periodDate,
        total_amount_usdc as totalAmountUsdc,
        total_games as totalGames,
        status,
        winner_address as winnerAddress,
        payout_tx_hash as payoutTxHash,
        created_at as createdAt,
        finalized_at as finalizedAt
      FROM prize_pools
      WHERE game_type = ? AND period_type = ?
      ORDER BY period_date DESC
      LIMIT ? OFFSET ?
    `);

    const results = query.all(gameType, periodType, limit, offset) as PrizePool[];

    return results;
  }

  /**
   * Finalize a prize pool and determine the winner.
   *
   * Called at the end of a period (daily/weekly) to close the pool and select
   * the winner based on the highest score in the leaderboard.
   * Updates the pool status from 'active' to 'finalized' and sets the winner address.
   *
   * @param params - Parameters for finalizing pool
   * @param params.gameType - Type of game (snake, tetris, etc.)
   * @param params.periodType - Period type (daily or weekly)
   * @param params.periodDate - Period identifier to finalize (YYYY-MM-DD)
   * @returns Finalized PrizePool with winner, or null if pool doesn't exist or already finalized
   *
   * @throws Error if pool is already paid out
   *
   * @example
   * ```typescript
   * // Finalize yesterday's daily snake pool
   * const finalizedPool = service.finalizePool({
   *   gameType: 'snake',
   *   periodType: 'daily',
   *   periodDate: '2026-01-23'
   * });
   * // Returns: { ..., status: 'finalized', winnerAddress: '0x123...', finalizedAt: '2026-01-24T00:00:00.000Z' }
   * ```
   */
  finalizePool(params: {
    gameType: GameType;
    periodType: PeriodType;
    periodDate: string;
  }): PrizePool | null {
    const { gameType, periodType, periodDate } = params;

    // First, get the pool to verify it exists and is active
    const getPoolStmt = this.db.prepare(`
      SELECT
        id,
        game_type as gameType,
        period_type as periodType,
        period_date as periodDate,
        total_amount_usdc as totalAmountUsdc,
        total_games as totalGames,
        status,
        winner_address as winnerAddress,
        payout_tx_hash as payoutTxHash,
        created_at as createdAt,
        finalized_at as finalizedAt
      FROM prize_pools
      WHERE game_type = ? AND period_type = ? AND period_date = ?
    `);

    const pool = getPoolStmt.get(gameType, periodType, periodDate) as PrizePool | undefined;

    // Return null if pool doesn't exist
    if (!pool) {
      return null;
    }

    // Throw error if pool is already paid (can't re-finalize)
    if (pool.status === 'paid') {
      throw new Error(`Pool for ${gameType} ${periodType} ${periodDate} is already paid out`);
    }

    // Return existing pool if already finalized (idempotent)
    if (pool.status === 'finalized') {
      return pool;
    }

    // Query leaderboard for the top player of this period
    const getWinnerStmt = this.db.prepare(`
      SELECT player_address
      FROM leaderboard_entries
      WHERE game_type = ? AND period_type = ? AND period_date = ?
      ORDER BY score DESC
      LIMIT 1
    `);

    const winner = getWinnerStmt.get(gameType, periodType, periodDate) as
      | { player_address: string }
      | undefined;

    // If no players for this period, return null (can't finalize empty pool)
    if (!winner) {
      return null;
    }

    // Update pool to finalized status with winner
    const updateStmt = this.db.prepare(`
      UPDATE prize_pools
      SET
        status = 'finalized',
        winner_address = ?,
        finalized_at = datetime('now')
      WHERE game_type = ? AND period_type = ? AND period_date = ?
    `);

    updateStmt.run(winner.player_address, gameType, periodType, periodDate);

    // Return the updated pool
    const updatedPool = getPoolStmt.get(gameType, periodType, periodDate) as PrizePool;

    return updatedPool;
  }

  /**
   * Record a successful prize payout transaction.
   *
   * Updates the pool status from 'finalized' to 'paid' and stores the blockchain
   * transaction hash. Called after the prize has been successfully transferred
   * to the winner on-chain.
   *
   * @param params - Parameters for recording payout
   * @param params.poolId - ID of the prize pool
   * @param params.payoutTxHash - Blockchain transaction hash of the payout
   * @returns Updated PrizePool with payout info, or null if pool doesn't exist
   *
   * @throws Error if pool is not in 'finalized' status
   *
   * @example
   * ```typescript
   * // Record payout for pool ID 42
   * const paidPool = service.recordPayout({
   *   poolId: 42,
   *   payoutTxHash: '0xabcdef1234567890...'
   * });
   * // Returns: { ..., status: 'paid', payoutTxHash: '0xabcdef...' }
   * ```
   */
  recordPayout(params: { poolId: number; payoutTxHash: string }): PrizePool | null {
    const { poolId, payoutTxHash } = params;

    // Get the pool to verify it exists and is finalized
    const getPoolStmt = this.db.prepare(`
      SELECT
        id,
        game_type as gameType,
        period_type as periodType,
        period_date as periodDate,
        total_amount_usdc as totalAmountUsdc,
        total_games as totalGames,
        status,
        winner_address as winnerAddress,
        payout_tx_hash as payoutTxHash,
        created_at as createdAt,
        finalized_at as finalizedAt
      FROM prize_pools
      WHERE id = ?
    `);

    const pool = getPoolStmt.get(poolId) as PrizePool | undefined;

    // Return null if pool doesn't exist
    if (!pool) {
      return null;
    }

    // Throw error if pool is not finalized (must be finalized before payout)
    if (pool.status !== 'finalized') {
      throw new Error(
        `Pool ID ${poolId} is not finalized (status: ${pool.status}). Must finalize before recording payout.`
      );
    }

    // Update pool to paid status with transaction hash
    const updateStmt = this.db.prepare(`
      UPDATE prize_pools
      SET
        status = 'paid',
        payout_tx_hash = ?
      WHERE id = ?
    `);

    updateStmt.run(payoutTxHash, poolId);

    // Return the updated pool
    const updatedPool = getPoolStmt.get(poolId) as PrizePool;

    // Audit trail is maintained in the database via payout_tx_hash field
    // External logging service can be integrated here if needed

    return updatedPool;
  }

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
