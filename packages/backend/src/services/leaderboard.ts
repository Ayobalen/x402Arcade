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
   * Uses INSERT OR REPLACE to handle the UNIQUE constraint on
   * (game_type, player_address, period_type, period_date).
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

    // Prepared statement for checking existing score
    const checkStmt = this.db.prepare(`
      SELECT score
      FROM leaderboard_entries
      WHERE game_type = ?
        AND player_address = ?
        AND period_type = ?
        AND period_date = ?
    `);

    // Prepared statement for inserting/replacing entry
    const insertStmt = this.db.prepare(`
      INSERT OR REPLACE INTO leaderboard_entries (
        session_id,
        game_type,
        player_address,
        score,
        period_type,
        period_date,
        rank
      )
      VALUES (?, ?, ?, ?, ?, ?, NULL)
    `);

    // Process each period
    for (const period of periods) {
      const { periodType, periodDate } = period;

      // Check if entry exists and compare scores
      const existing = checkStmt.get(gameType, playerAddress, periodType, periodDate) as
        | { score: number }
        | undefined;

      // Only insert/update if:
      // 1. No existing entry (first score)
      // 2. New score is higher than existing score (high score logic)
      if (!existing || score > existing.score) {
        insertStmt.run(sessionId, gameType, playerAddress, score, periodType, periodDate);
      }
    }
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
