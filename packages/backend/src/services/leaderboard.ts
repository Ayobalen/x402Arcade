/**
 * Leaderboard Service
 *
 * Service for managing high score tracking with support for daily, weekly,
 * and all-time leaderboards. Handles score submissions, ranking calculations,
 * and leaderboard queries.
 *
 * @module services/leaderboard
 */

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
export type GameType =
  | 'snake'
  | 'tetris'
  | 'pong'
  | 'pong-phaser'
  | 'breakout'
  | 'space_invaders'
  | 'space-invaders';

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

// Re-export Redis-based service
export { LeaderboardServiceRedis as LeaderboardService } from './leaderboard-redis.js';
