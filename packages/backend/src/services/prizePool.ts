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
   * Calculate the actual payout amount for a prize pool.
   *
   * Determines the final USDC amount to be paid to the winner after applying
   * any platform fees and minimum payout thresholds. Currently, the full pool
   * amount is paid out (100% of accumulated funds) with no additional fees,
   * as the platform fee was already taken during game payment processing.
   *
   * Future enhancements could include:
   * - Additional platform fee on payouts (e.g., 5%)
   * - Minimum payout thresholds (e.g., $1.00)
   * - Maximum payout caps
   * - Tax withholding for certain jurisdictions
   *
   * @param params - Parameters for calculating payout
   * @param params.poolId - ID of the prize pool (optional if pool provided)
   * @param params.pool - PrizePool object (optional if poolId provided)
   * @returns Final payout amount in USDC
   *
   * @throws Error if neither poolId nor pool is provided
   * @throws Error if pool doesn't exist
   *
   * @example
   * ```typescript
   * // Calculate payout by pool ID
   * const amount = service.calculatePrizeAmount({ poolId: 42 });
   * // Returns: 0.21 (full pool amount)
   *
   * // Calculate payout with pool object
   * const pool = service.getCurrentPool({ gameType: 'snake', periodType: 'daily' });
   * const amount = service.calculatePrizeAmount({ pool });
   * // Returns: 0.21 (full pool amount)
   * ```
   */
  calculatePrizeAmount(params: { poolId?: number; pool?: PrizePool }): number {
    const { poolId, pool } = params;

    // Validate input
    if (!poolId && !pool) {
      throw new Error('Either poolId or pool must be provided');
    }

    // Get the pool if only poolId was provided
    let prizePool: PrizePool | null = pool ?? null;

    if (!prizePool && poolId) {
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

      prizePool = (getPoolStmt.get(poolId) as PrizePool | undefined) ?? null;
    }

    // Verify pool exists
    if (!prizePool) {
      throw new Error(`Prize pool not found: ${poolId}`);
    }

    // Get the total pool amount
    const poolTotal = prizePool.totalAmountUsdc;

    // Currently, we pay out the full amount (no additional platform fee)
    // The 30% platform fee was already taken during game payment processing
    // (only 70% of each payment went to the prize pool)
    const payoutAmount = poolTotal;

    // Future enhancement: Apply platform fee on payout if configured
    // const PAYOUT_PLATFORM_FEE = 0.05; // 5% example
    // payoutAmount = poolTotal * (1 - PAYOUT_PLATFORM_FEE);

    // Future enhancement: Enforce minimum payout threshold
    // const MINIMUM_PAYOUT = 1.00; // $1.00 minimum example
    // if (payoutAmount < MINIMUM_PAYOUT) {
    //   return 0; // Don't pay out if below minimum
    // }

    return payoutAmount;
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

  /**
   * Get aggregate statistics for a specific day across all game types.
   *
   * Retrieves and aggregates data from all daily prize pools for a given date.
   * Useful for analytics dashboards, daily reports, and platform monitoring.
   *
   * This method:
   * 1. Queries all daily prize pools for the specified date
   * 2. Sums total games and prize pool amounts across all game types
   * 3. Counts number of active game types
   * 4. Optionally includes per-game breakdown
   *
   * @param params - Parameters for retrieving daily stats
   * @param params.date - Date in YYYY-MM-DD format (defaults to today)
   * @param params.includeBreakdown - Include per-game breakdown (default: false)
   * @returns DailyStats object with aggregate data
   *
   * @example
   * ```typescript
   * // Get stats for today
   * const stats = service.getDailyStats();
   * // Returns: { date: '2026-01-24', totalGames: 42, totalPrizePoolUsdc: 0.294, activeGames: 3 }
   *
   * // Get stats for a specific date with breakdown
   * const statsWithBreakdown = service.getDailyStats({
   *   date: '2026-01-23',
   *   includeBreakdown: true
   * });
   * // Returns: { date: '2026-01-23', ..., gameBreakdown: [{ gameType: 'snake', totalGames: 20, ... }, ...] }
   * ```
   */
  getDailyStats(params?: { date?: string; includeBreakdown?: boolean }): DailyStats {
    const { date = this.getTodayDate(), includeBreakdown = false } = params || {};

    // Query all daily pools for this date
    const query = this.db.prepare(`
      SELECT
        game_type as gameType,
        total_games as totalGames,
        total_amount_usdc as totalAmountUsdc
      FROM prize_pools
      WHERE period_type = 'daily' AND period_date = ?
    `);

    const pools = query.all(date) as Array<{
      gameType: GameType;
      totalGames: number;
      totalAmountUsdc: number;
    }>;

    // Aggregate the stats
    let totalGames = 0;
    let totalPrizePoolUsdc = 0;
    const activeGames = pools.length;

    for (const pool of pools) {
      totalGames += pool.totalGames;
      totalPrizePoolUsdc += pool.totalAmountUsdc;
    }

    // Build result
    const result: DailyStats = {
      date,
      totalGames,
      totalPrizePoolUsdc,
      activeGames,
    };

    // Add breakdown if requested
    if (includeBreakdown) {
      result.gameBreakdown = pools.map((pool) => ({
        gameType: pool.gameType,
        totalGames: pool.totalGames,
        totalPrizePoolUsdc: pool.totalAmountUsdc,
      }));
    }

    return result;
  }

  /**
   * Get aggregate statistics for a specific week across all game types.
   *
   * Retrieves and aggregates data from all weekly prize pools for a given week.
   * Useful for weekly reports, trend analysis, and performance monitoring.
   *
   * This method:
   * 1. Queries all weekly prize pools for the specified week
   * 2. Sums total games and prize pool amounts across all game types
   * 3. Counts number of active game types
   * 4. Optionally includes per-game breakdown
   *
   * @param params - Parameters for retrieving weekly stats
   * @param params.weekStart - Week start date (Monday) in YYYY-MM-DD format (defaults to current week)
   * @param params.includeBreakdown - Include per-game breakdown (default: false)
   * @returns WeeklyStats object with aggregate data
   *
   * @example
   * ```typescript
   * // Get stats for current week
   * const stats = service.getWeeklyStats();
   * // Returns: { weekStart: '2026-01-20', totalGames: 156, totalPrizePoolUsdc: 1.092, activeGames: 4 }
   *
   * // Get stats for a specific week with breakdown
   * const statsWithBreakdown = service.getWeeklyStats({
   *   weekStart: '2026-01-13',
   *   includeBreakdown: true
   * });
   * // Returns: { weekStart: '2026-01-13', ..., gameBreakdown: [{ gameType: 'snake', totalGames: 50, ... }, ...] }
   * ```
   */
  getWeeklyStats(params?: { weekStart?: string; includeBreakdown?: boolean }): WeeklyStats {
    const { weekStart = this.getWeekStart(), includeBreakdown = false } = params || {};

    // Query all weekly pools for this week
    const query = this.db.prepare(`
      SELECT
        game_type as gameType,
        total_games as totalGames,
        total_amount_usdc as totalAmountUsdc
      FROM prize_pools
      WHERE period_type = 'weekly' AND period_date = ?
    `);

    const pools = query.all(weekStart) as Array<{
      gameType: GameType;
      totalGames: number;
      totalAmountUsdc: number;
    }>;

    // Aggregate the stats
    let totalGames = 0;
    let totalPrizePoolUsdc = 0;
    const activeGames = pools.length;

    for (const pool of pools) {
      totalGames += pool.totalGames;
      totalPrizePoolUsdc += pool.totalAmountUsdc;
    }

    // Build result
    const result: WeeklyStats = {
      weekStart,
      totalGames,
      totalPrizePoolUsdc,
      activeGames,
    };

    // Add breakdown if requested
    if (includeBreakdown) {
      result.gameBreakdown = pools.map((pool) => ({
        gameType: pool.gameType,
        totalGames: pool.totalGames,
        totalPrizePoolUsdc: pool.totalAmountUsdc,
      }));
    }

    return result;
  }

  /**
   * Get the top contributor (player who paid the most) for a prize pool period.
   *
   * Finds the player who contributed the most USDC to a specific game's prize pool
   * during a given period. Useful for bonus rewards, recognition, or analytics.
   *
   * This method:
   * 1. Queries game_sessions for the specified game type and period
   * 2. Groups by player_address
   * 3. Sums amount_paid_usdc per player
   * 4. Counts games played per player
   * 5. Returns the player with the highest total contribution
   *
   * Note: Contributions are based on full payment amounts, not just the prize pool portion.
   * The actual prize pool contribution is amount_paid_usdc * PRIZE_POOL_PERCENTAGE (70%).
   *
   * @param params - Parameters for finding top contributor
   * @param params.gameType - Type of game (snake, tetris, etc.)
   * @param params.periodType - Period type (daily or weekly)
   * @param params.periodDate - Period identifier (YYYY-MM-DD format)
   * @returns TopContributor object or null if no players for this period
   *
   * @example
   * ```typescript
   * // Get top contributor for today's snake pool
   * const topPlayer = service.getTopContributor({
   *   gameType: 'snake',
   *   periodType: 'daily',
   *   periodDate: '2026-01-24'
   * });
   * // Returns: { playerAddress: '0x123...', totalContribution: 0.05, gamesPlayed: 5 }
   * // (Player paid $0.05 total across 5 games)
   * ```
   */
  getTopContributor(params: {
    gameType: GameType;
    periodType: PeriodType;
    periodDate: string;
  }): TopContributor | null {
    const { gameType, periodType, periodDate } = params;

    // Calculate date range for the period
    let startDate: string;
    let endDate: string;

    if (periodType === 'daily') {
      // For daily: period_date is the exact day (YYYY-MM-DD)
      startDate = periodDate + 'T00:00:00';
      endDate = periodDate + 'T23:59:59';
    } else {
      // For weekly: period_date is Monday, week ends on Sunday
      const weekStart = new Date(periodDate + 'T00:00:00Z');
      const weekEnd = new Date(weekStart);
      weekEnd.setUTCDate(weekStart.getUTCDate() + 6); // Add 6 days to get Sunday

      startDate = periodDate + 'T00:00:00';
      endDate = weekEnd.toISOString().split('T')[0] + 'T23:59:59';
    }

    // Query to find top contributor for this period
    const query = this.db.prepare(`
      SELECT
        player_address as playerAddress,
        SUM(amount_paid_usdc) as totalContribution,
        COUNT(*) as gamesPlayed
      FROM game_sessions
      WHERE game_type = ?
        AND created_at >= ?
        AND created_at <= ?
        AND status = 'completed'
      GROUP BY player_address
      ORDER BY totalContribution DESC
      LIMIT 1
    `);

    const result = query.get(gameType, startDate, endDate) as TopContributor | undefined;

    return result ?? null;
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
