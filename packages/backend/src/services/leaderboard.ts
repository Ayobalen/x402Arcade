/**
 * Leaderboard Service
 *
 * Service for managing high score tracking with support for daily, weekly,
 * and all-time leaderboards. Handles score submissions, ranking calculations,
 * and leaderboard queries.
 *
 * @module services/leaderboard
 */

import type { Database as DatabaseType } from 'better-sqlite3';

// ============================================================================
// Types
// ============================================================================

/**
 * Leaderboard period types.
 */
export type PeriodType = 'daily' | 'weekly' | 'alltime';

/**
 * Supported game types.
 */
export type GameType = 'snake' | 'tetris' | 'pong' | 'breakout' | 'space_invaders';

/**
 * Leaderboard entry data structure.
 *
 * Represents a single entry in the leaderboard table.
 */
export interface LeaderboardEntry {
  /** Auto-incrementing entry ID */
  id: number;
  /** Reference to game session ID */
  sessionId: string;
  /** Type of game */
  gameType: GameType;
  /** Player's wallet address */
  playerAddress: string;
  /** Score achieved */
  score: number;
  /** Period type (daily, weekly, alltime) */
  periodType: PeriodType;
  /** Period identifier (YYYY-MM-DD, YYYY-WXX, or 'alltime') */
  periodDate: string;
  /** Rank within the period (1 = first place, null if not yet ranked) */
  rank: number | null;
  /** Entry creation timestamp */
  createdAt: string;
}

/**
 * Player ranking details.
 *
 * Used when checking a specific player's position on the leaderboard.
 * Includes contextual information about their standing relative to others.
 */
export interface PlayerRanking {
  /** Player's rank (1 = first place) */
  rank: number;
  /** Player's score */
  score: number;
  /** Total number of players on this leaderboard */
  totalPlayers: number;
  /** Player's percentile (top X%, e.g., 10 means top 10%) */
  percentile: number;
}

// ============================================================================
// LeaderboardService Class
// ============================================================================

/**
 * LeaderboardService class for managing high scores and rankings.
 *
 * This service provides methods for:
 * - Adding scores to leaderboards
 * - Retrieving top scores for a period
 * - Getting player rankings
 * - Calculating and updating rankings
 *
 * @example
 * ```typescript
 * import { getDatabase } from '../db';
 * const leaderboardService = new LeaderboardService(getDatabase());
 *
 * // Add a score to leaderboards
 * await leaderboardService.addScore({
 *   sessionId: 'session-uuid',
 *   gameType: 'snake',
 *   playerAddress: '0x1234...',
 *   score: 15000
 * });
 * ```
 */
export class LeaderboardService {
  /**
   * Database instance for persistence
   */
  private db: DatabaseType;

  /**
   * Create a new LeaderboardService instance
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
   * Add a new score entry to the leaderboard.
   *
   * Records a score across all three leaderboard periods (daily, weekly, alltime).
   * Only updates existing entries if the new score is higher (high score logic).
   *
   * Uses INSERT ... ON CONFLICT DO UPDATE with CASE WHEN to implement
   * conditional UPSERT based on score comparison. The UNIQUE constraint on
   * (game_type, player_address, period_type, period_date) triggers the conflict.
   *
   * UPSERT Logic:
   * - If no existing entry: INSERT new entry
   * - If existing entry with lower score: UPDATE session_id, score, and created_at
   * - If existing entry with higher/equal score: Keep existing values (no-op update)
   *
   * @param params - Entry parameters
   * @param params.sessionId - Game session ID reference
   * @param params.gameType - Type of game
   * @param params.playerAddress - Player's wallet address
   * @param params.score - Score achieved
   *
   * @example
   * ```typescript
   * leaderboardService.addEntry({
   *   sessionId: 'uuid-123',
   *   gameType: 'snake',
   *   playerAddress: '0x1234...',
   *   score: 15000
   * });
   * ```
   */
  addEntry(params: {
    sessionId: string;
    gameType: GameType;
    playerAddress: string;
    score: number;
  }): void {
    const { sessionId, gameType, playerAddress, score } = params;

    // Get period identifiers
    const todayDate = this.getTodayDate();
    const weekStart = this.getWeekStart();

    // Define periods to update
    const periods: Array<{ periodType: PeriodType; periodDate: string }> = [
      { periodType: 'daily', periodDate: todayDate },
      { periodType: 'weekly', periodDate: weekStart },
      { periodType: 'alltime', periodDate: 'alltime' },
    ];

    // UPSERT query with high score logic
    // Uses INSERT OR REPLACE with subquery to preserve higher score
    // The UNIQUE constraint on (game_type, player_address, period_type, period_date)
    // triggers the REPLACE when a duplicate key is encountered
    const upsertStmt = this.db.prepare(`
      INSERT INTO leaderboard_entries (
        session_id,
        game_type,
        player_address,
        score,
        period_type,
        period_date,
        rank
      )
      VALUES (?, ?, ?, ?, ?, ?, NULL)
      ON CONFLICT(game_type, player_address, period_type, period_date)
      DO UPDATE SET
        session_id = CASE
          WHEN excluded.score > score THEN excluded.session_id
          ELSE session_id
        END,
        score = CASE
          WHEN excluded.score > score THEN excluded.score
          ELSE score
        END,
        created_at = CASE
          WHEN excluded.score > score THEN datetime('now')
          ELSE created_at
        END
    `);

    // Process each period
    for (const period of periods) {
      const { periodType, periodDate } = period;
      upsertStmt.run(sessionId, gameType, playerAddress, score, periodType, periodDate);
    }
  }

  /**
   * Get the top N scores for a specific game and period.
   *
   * Retrieves the highest scores from the leaderboard, ordered by score descending.
   * Calculates rank dynamically using ROW_NUMBER() window function.
   *
   * @param params - Query parameters
   * @param params.gameType - Type of game to query
   * @param params.periodType - Period type (daily, weekly, alltime)
   * @param params.limit - Maximum number of entries to return (default: 10)
   *
   * @returns Array of leaderboard entries with computed ranks
   *
   * @example
   * ```typescript
   * const topScores = leaderboardService.getTopScores({
   *   gameType: 'snake',
   *   periodType: 'daily',
   *   limit: 10
   * });
   * // Returns top 10 scores for snake game today
   * ```
   */
  getTopScores(params: {
    gameType: GameType;
    periodType: PeriodType;
    limit?: number;
  }): LeaderboardEntry[] {
    const { gameType, periodType, limit = 10 } = params;

    // Calculate the period_date based on periodType
    let periodDate: string;
    if (periodType === 'daily') {
      periodDate = this.getTodayDate();
    } else if (periodType === 'weekly') {
      periodDate = this.getWeekStart();
    } else {
      // alltime
      periodDate = 'alltime';
    }

    // Query with ROW_NUMBER() window function for ranking
    // SQLite supports window functions since version 3.25.0 (2018-09-15)
    const stmt = this.db.prepare(`
      SELECT
        id,
        session_id,
        game_type,
        player_address,
        score,
        period_type,
        period_date,
        ROW_NUMBER() OVER (ORDER BY score DESC) as rank,
        created_at
      FROM leaderboard_entries
      WHERE game_type = ?
        AND period_type = ?
        AND period_date = ?
      ORDER BY score DESC
      LIMIT ?
    `);

    const rows = stmt.all(gameType, periodType, periodDate, limit) as Array<{
      id: number;
      session_id: string;
      game_type: string;
      player_address: string;
      score: number;
      period_type: string;
      period_date: string;
      rank: number;
      created_at: string;
    }>;

    // Map database rows to LeaderboardEntry objects with camelCase
    return rows.map((row) => ({
      id: row.id,
      sessionId: row.session_id,
      gameType: row.game_type as GameType,
      playerAddress: row.player_address,
      score: row.score,
      periodType: row.period_type as PeriodType,
      periodDate: row.period_date,
      rank: row.rank,
      createdAt: row.created_at,
    }));
  }

  /**
   * Get today's leaderboard for a specific game.
   *
   * Convenience method that retrieves the highest scores from today for a game.
   * This is equivalent to calling getTopScores with periodType='daily'.
   *
   * @param params - Query parameters
   * @param params.gameType - Type of game to query
   * @param params.limit - Maximum number of entries to return (default: 10)
   *
   * @returns Array of daily leaderboard entries with computed ranks
   *
   * @example
   * ```typescript
   * const todayScores = leaderboardService.getDailyLeaderboard({
   *   gameType: 'snake',
   *   limit: 20
   * });
   * // Returns top 20 snake scores from today
   * ```
   */
  getDailyLeaderboard(params: { gameType: GameType; limit?: number }): LeaderboardEntry[] {
    return this.getTopScores({
      gameType: params.gameType,
      periodType: 'daily',
      limit: params.limit,
    });
  }

  /**
   * Get this week's leaderboard for a specific game.
   *
   * Convenience method that retrieves the highest scores from this week for a game.
   * This is equivalent to calling getTopScores with periodType='weekly'.
   * The week starts on Monday (ISO week standard).
   *
   * @param params - Query parameters
   * @param params.gameType - Type of game to query
   * @param params.limit - Maximum number of entries to return (default: 10)
   *
   * @returns Array of weekly leaderboard entries with computed ranks
   *
   * @example
   * ```typescript
   * const weeklyScores = leaderboardService.getWeeklyLeaderboard({
   *   gameType: 'snake',
   *   limit: 30
   * });
   * // Returns top 30 snake scores from this week
   * ```
   */
  getWeeklyLeaderboard(params: { gameType: GameType; limit?: number }): LeaderboardEntry[] {
    return this.getTopScores({
      gameType: params.gameType,
      periodType: 'weekly',
      limit: params.limit,
    });
  }

  /**
   * Get the all-time leaderboard for a specific game.
   *
   * Convenience method that retrieves the highest scores of all time for a game.
   * This is equivalent to calling getTopScores with periodType='alltime'.
   *
   * @param params - Query parameters
   * @param params.gameType - Type of game to query
   * @param params.limit - Maximum number of entries to return (default: 10)
   *
   * @returns Array of all-time leaderboard entries with computed ranks
   *
   * @example
   * ```typescript
   * const allTimeScores = leaderboardService.getAllTimeLeaderboard({
   *   gameType: 'snake',
   *   limit: 50
   * });
   * // Returns top 50 snake scores of all time
   * ```
   */
  getAllTimeLeaderboard(params: { gameType: GameType; limit?: number }): LeaderboardEntry[] {
    return this.getTopScores({
      gameType: params.gameType,
      periodType: 'alltime',
      limit: params.limit,
    });
  }

  /**
   * Get a specific player's ranking and statistics.
   *
   * Retrieves the player's rank, score, and percentile for a specific game and period.
   * Returns null if the player has no entry for the specified game/period.
   *
   * Algorithm:
   * 1. Get player's score for the period
   * 2. Count total players with scores in the period
   * 3. Calculate rank by counting players with higher scores + 1
   * 4. Calculate percentile as (rank / totalPlayers) * 100
   *
   * @param params - Query parameters
   * @param params.gameType - Type of game
   * @param params.playerAddress - Player's wallet address
   * @param params.periodType - Period type (daily, weekly, alltime)
   *
   * @returns Player ranking information, or null if player has no entry
   *
   * @example
   * ```typescript
   * const ranking = leaderboardService.getPlayerRanking({
   *   gameType: 'snake',
   *   playerAddress: '0x1234...',
   *   periodType: 'daily'
   * });
   * // Returns: { rank: 5, score: 1500, totalPlayers: 100, percentile: 5.0 }
   * ```
   */
  getPlayerRanking(params: {
    gameType: GameType;
    playerAddress: string;
    periodType: PeriodType;
  }): PlayerRanking | null {
    const { gameType, playerAddress, periodType } = params;

    // Calculate the period_date based on periodType
    let periodDate: string;
    if (periodType === 'daily') {
      periodDate = this.getTodayDate();
    } else if (periodType === 'weekly') {
      periodDate = this.getWeekStart();
    } else {
      // alltime
      periodDate = 'alltime';
    }

    // Get player's score for the period
    const playerStmt = this.db.prepare(`
      SELECT score
      FROM leaderboard_entries
      WHERE game_type = ?
        AND player_address = ?
        AND period_type = ?
        AND period_date = ?
    `);

    const playerRow = playerStmt.get(gameType, playerAddress, periodType, periodDate) as
      | { score: number }
      | undefined;

    // Player has no entry for this period
    if (!playerRow) {
      return null;
    }

    const playerScore = playerRow.score;

    // Count total players in the period
    const totalStmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM leaderboard_entries
      WHERE game_type = ?
        AND period_type = ?
        AND period_date = ?
    `);

    const totalRow = totalStmt.get(gameType, periodType, periodDate) as {
      count: number;
    };
    const totalPlayers = totalRow.count;

    // Calculate rank by counting players with higher scores + 1
    // Rank 1 = highest score, rank 2 = second highest, etc.
    const rankStmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM leaderboard_entries
      WHERE game_type = ?
        AND period_type = ?
        AND period_date = ?
        AND score > ?
    `);

    const rankRow = rankStmt.get(gameType, periodType, periodDate, playerScore) as {
      count: number;
    };
    const rank = rankRow.count + 1;

    // Calculate percentile (what percentage of players the user is better than or equal to)
    // Example: rank 1 out of 100 = top 1% (100 - (1/100)*100 = 99% percentile)
    // Example: rank 5 out of 100 = top 5% (100 - (5/100)*100 = 95% percentile)
    const percentile = totalPlayers > 0 ? ((totalPlayers - rank + 1) / totalPlayers) * 100 : 0;

    return {
      rank,
      score: playerScore,
      totalPlayers,
      percentile: Math.round(percentile * 10) / 10, // Round to 1 decimal place
    };
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
   * Calculates the start of the current week (Monday) for weekly leaderboard periods.
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
