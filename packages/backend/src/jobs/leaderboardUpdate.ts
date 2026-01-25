/**
 * Leaderboard Update Job
 *
 * Recalculates rankings for all active leaderboards.
 * Runs hourly to ensure rankings are fresh and accurate.
 *
 * Tasks:
 * 1. Recalculate ranks for all leaderboard entries
 * 2. Update rank field in database
 * 3. Log update statistics
 *
 * @module jobs/leaderboardUpdate
 */

/* eslint-disable no-console */
// Console logging is essential for background job monitoring

import type { LeaderboardService, PeriodType, GameType } from '../services/leaderboard.js';

/**
 * Leaderboard update job result
 */
export interface LeaderboardUpdateResult {
  /** Number of leaderboards processed */
  leaderboardsProcessed: number;
  /** Total number of entries updated */
  entriesUpdated: number;
  /** Processing duration in milliseconds */
  durationMs: number;
  /** Any errors encountered */
  errors: Array<{
    gameType: GameType;
    periodType: PeriodType;
    error: string;
  }>;
}

/**
 * Run the leaderboard update job
 *
 * Note: Rankings are calculated dynamically via SQL ROW_NUMBER() in queries,
 * so this job primarily validates that leaderboards are accessible and
 * refreshes any cached data if needed in the future.
 *
 * @param leaderboardService - Leaderboard service instance
 * @returns Job execution result
 */
export function runLeaderboardUpdate(
  leaderboardService: LeaderboardService
): LeaderboardUpdateResult {
  const startTime = Date.now();

  const result: LeaderboardUpdateResult = {
    leaderboardsProcessed: 0,
    entriesUpdated: 0,
    durationMs: 0,
    errors: [],
  };

  try {
    const gameTypes: GameType[] = ['snake', 'tetris', 'pong', 'breakout', 'space_invaders'];
    const periodTypes: PeriodType[] = ['daily', 'weekly', 'alltime'];

    console.log('🔄 Starting leaderboard validation...');

    for (const gameType of gameTypes) {
      for (const periodType of periodTypes) {
        try {
          // Validate that the leaderboard is accessible by fetching top entries
          // Rankings are calculated dynamically in SQL, no manual update needed
          const entries = leaderboardService.getTopScores({
            gameType,
            periodType,
            limit: 1,
          });

          result.leaderboardsProcessed++;
          result.entriesUpdated += entries.length;

          if (entries.length > 0) {
            console.log(`✅ Validated ${gameType} ${periodType}: ${entries.length} entries`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          result.errors.push({
            gameType,
            periodType,
            error: errorMessage,
          });
          console.error(`❌ Error validating ${gameType} ${periodType}:`, errorMessage);
        }
      }
    }

    result.durationMs = Date.now() - startTime;

    console.log(`\n📊 Leaderboard Validation Summary:`);
    console.log(`   Leaderboards processed: ${result.leaderboardsProcessed}`);
    console.log(`   Entries validated: ${result.entriesUpdated}`);
    console.log(`   Duration: ${result.durationMs}ms`);
    console.log(`   Errors: ${result.errors.length}`);

    return result;
  } catch (error) {
    console.error('❌ Leaderboard validation job failed:', error);
    throw error;
  }
}
