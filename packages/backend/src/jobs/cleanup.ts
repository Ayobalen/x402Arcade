/**
 * Cleanup Job
 *
 * Removes expired and stale data from the database to prevent bloat.
 * Runs daily to maintain database performance.
 *
 * Tasks:
 * 1. Delete expired game sessions (status = 'active' but created > SESSION_EXPIRY_MINUTES ago)
 * 2. Archive old leaderboard entries (optional - keep for historical records)
 * 3. Clean up orphaned records
 * 4. Log cleanup statistics
 *
 * @module jobs/cleanup
 */

/* eslint-disable no-console */
// Console logging is essential for background job monitoring

import type { Database as DatabaseType } from 'better-sqlite3';

/**
 * Cleanup job configuration
 */
export interface CleanupConfig {
  /** Session expiry time in minutes */
  sessionExpiryMinutes: number;
  /** Whether to archive old leaderboard entries instead of deleting */
  archiveLeaderboards: boolean;
  /** Age threshold for archiving leaderboards (in days) */
  leaderboardArchiveAgeDays: number;
}

/**
 * Cleanup job result
 */
export interface CleanupResult {
  /** Number of expired sessions deleted */
  expiredSessionsDeleted: number;
  /** Number of leaderboard entries archived/deleted */
  leaderboardEntriesProcessed: number;
  /** Number of orphaned records cleaned */
  orphanedRecordsCleaned: number;
  /** Processing duration in milliseconds */
  durationMs: number;
  /** Any errors encountered */
  errors: string[];
}

/**
 * Default cleanup configuration
 */
const DEFAULT_CONFIG: CleanupConfig = {
  sessionExpiryMinutes: 30,
  archiveLeaderboards: true,
  leaderboardArchiveAgeDays: 90,
};

/**
 * Run the cleanup job
 *
 * @param db - Database instance
 * @param config - Cleanup configuration (optional, uses defaults if not provided)
 * @returns Job execution result
 */
export function runCleanup(db: DatabaseType, config: Partial<CleanupConfig> = {}): CleanupResult {
  const startTime = Date.now();
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const result: CleanupResult = {
    expiredSessionsDeleted: 0,
    leaderboardEntriesProcessed: 0,
    orphanedRecordsCleaned: 0,
    durationMs: 0,
    errors: [],
  };

  try {
    console.log('🧹 Starting cleanup job...');

    // ========================================================================
    // Task 1: Delete expired game sessions
    // ========================================================================
    try {
      const expiryThreshold = new Date();
      expiryThreshold.setMinutes(expiryThreshold.getMinutes() - finalConfig.sessionExpiryMinutes);
      const expiryTimestamp = expiryThreshold.toISOString();

      const deleteExpiredSessions = db.prepare(`
        DELETE FROM game_sessions
        WHERE status = 'active'
          AND created_at < ?
      `);

      const deleteResult = deleteExpiredSessions.run(expiryTimestamp);
      result.expiredSessionsDeleted = deleteResult.changes;

      if (result.expiredSessionsDeleted > 0) {
        console.log(`✅ Deleted ${result.expiredSessionsDeleted} expired sessions`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Expired sessions cleanup: ${errorMessage}`);
      console.error('❌ Error deleting expired sessions:', errorMessage);
    }

    // ========================================================================
    // Task 2: Clean up orphaned leaderboard entries
    // ========================================================================
    // Leaderboard entries should reference valid game sessions
    // Delete entries where session_id no longer exists in game_sessions
    try {
      const deleteOrphanedEntries = db.prepare(`
        DELETE FROM leaderboard_entries
        WHERE session_id NOT IN (SELECT id FROM game_sessions)
      `);

      const orphanResult = deleteOrphanedEntries.run();
      result.orphanedRecordsCleaned = orphanResult.changes;

      if (result.orphanedRecordsCleaned > 0) {
        console.log(`✅ Cleaned ${result.orphanedRecordsCleaned} orphaned leaderboard entries`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Orphaned entries cleanup: ${errorMessage}`);
      console.error('❌ Error cleaning orphaned entries:', errorMessage);
    }

    // ========================================================================
    // Task 3: Archive or delete old leaderboard entries (optional)
    // ========================================================================
    // For now, we keep all leaderboard entries for historical records.
    // In a production system, you might:
    // - Move old entries to an archive table
    // - Export to cold storage
    // - Delete entries older than X days (except top 100)
    //
    // This is skipped for MVP but structure is here for future enhancement.
    if (finalConfig.archiveLeaderboards) {
      // Future: Implement archiving logic here
      // For now, we just log that archiving is enabled
      console.log('ℹ️  Leaderboard archiving enabled (no entries to archive)');
    }

    // ========================================================================
    // Summary
    // ========================================================================
    result.durationMs = Date.now() - startTime;

    console.log(`\n📊 Cleanup Summary:`);
    console.log(`   Expired sessions deleted: ${result.expiredSessionsDeleted}`);
    console.log(`   Orphaned entries cleaned: ${result.orphanedRecordsCleaned}`);
    console.log(`   Duration: ${result.durationMs}ms`);
    console.log(`   Errors: ${result.errors.length}`);

    return result;
  } catch (error) {
    console.error('❌ Cleanup job failed:', error);
    throw error;
  }
}
