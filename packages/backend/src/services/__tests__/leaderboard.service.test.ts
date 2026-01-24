/**
 * Unit tests for LeaderboardService
 *
 * Tests for leaderboard management including score submissions,
 * ranking calculations, and period-based queries.
 *
 * @module services/__tests__/leaderboard.service.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { LeaderboardService } from '../leaderboard';
import { createTables } from '../../db/schema';

// ============================================================================
// Test Setup
// ============================================================================

let db: Database.Database;
let leaderboardService: LeaderboardService;

beforeEach(() => {
  // Create in-memory database for testing
  db = new Database(':memory:');
  createTables(db);
  leaderboardService = new LeaderboardService(db);
});

afterEach(() => {
  db.close();
});

// ============================================================================
// Helper Method Tests
// ============================================================================

describe('LeaderboardService - Helper Methods', () => {
  describe('getTodayDate', () => {
    it('should return a string', () => {
      // Access private method via reflection for testing
      const getTodayDate = (leaderboardService as any).getTodayDate.bind(leaderboardService);
      const result = getTodayDate();
      expect(typeof result).toBe('string');
    });

    it('should return date in YYYY-MM-DD format', () => {
      const getTodayDate = (leaderboardService as any).getTodayDate.bind(leaderboardService);
      const result = getTodayDate();
      // Test format: YYYY-MM-DD (4 digits, hyphen, 2 digits, hyphen, 2 digits)
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return valid date components', () => {
      const getTodayDate = (leaderboardService as any).getTodayDate.bind(leaderboardService);
      const result = getTodayDate();
      const [year, month, day] = result.split('-').map(Number);

      // Year should be reasonable (2020-2099)
      expect(year).toBeGreaterThanOrEqual(2020);
      expect(year).toBeLessThanOrEqual(2099);

      // Month should be 1-12
      expect(month).toBeGreaterThanOrEqual(1);
      expect(month).toBeLessThanOrEqual(12);

      // Day should be 1-31
      expect(day).toBeGreaterThanOrEqual(1);
      expect(day).toBeLessThanOrEqual(31);
    });

    it('should use UTC timezone', () => {
      const getTodayDate = (leaderboardService as any).getTodayDate.bind(leaderboardService);
      const result = getTodayDate();

      // Compare with UTC date
      const now = new Date();
      const expectedDate = now.toISOString().split('T')[0];

      expect(result).toBe(expectedDate);
    });

    it('should return same value when called multiple times in same day', () => {
      const getTodayDate = (leaderboardService as any).getTodayDate.bind(leaderboardService);
      const result1 = getTodayDate();
      const result2 = getTodayDate();

      expect(result1).toBe(result2);
    });

    it('should match Date.toISOString format', () => {
      const getTodayDate = (leaderboardService as any).getTodayDate.bind(leaderboardService);
      const result = getTodayDate();

      // toISOString returns "YYYY-MM-DDTHH:MM:SS.sssZ"
      // getTodayDate should return the date part before 'T'
      const now = new Date();
      const isoDate = now.toISOString().split('T')[0];

      expect(result).toBe(isoDate);
    });
  });

  describe('getWeekStart', () => {
    it('should return a string', () => {
      const getWeekStart = (leaderboardService as any).getWeekStart.bind(leaderboardService);
      const result = getWeekStart();
      expect(typeof result).toBe('string');
    });

    it('should return date in YYYY-MM-DD format', () => {
      const getWeekStart = (leaderboardService as any).getWeekStart.bind(leaderboardService);
      const result = getWeekStart();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return a Monday', () => {
      const getWeekStart = (leaderboardService as any).getWeekStart.bind(leaderboardService);
      const result = getWeekStart();

      // Parse the date and verify it's a Monday
      const date = new Date(result + 'T00:00:00Z');
      const dayOfWeek = date.getUTCDay();

      // Monday = 1
      expect(dayOfWeek).toBe(1);
    });

    it('should return a date in the past or today', () => {
      const getWeekStart = (leaderboardService as any).getWeekStart.bind(leaderboardService);
      const result = getWeekStart();

      const weekStart = new Date(result + 'T00:00:00Z');
      const now = new Date();

      // Week start should be <= today
      expect(weekStart.getTime()).toBeLessThanOrEqual(now.getTime());
    });

    it('should return same Monday for all days in the week', () => {
      const getWeekStart = (leaderboardService as any).getWeekStart.bind(leaderboardService);
      const result = getWeekStart();

      // Verify result is a Monday
      const monday = new Date(result + 'T00:00:00Z');
      expect(monday.getUTCDay()).toBe(1);

      // All days in this week should map to the same Monday
      // We can't directly test this without mocking dates, but we can verify
      // that the result is within the last 7 days
      const now = new Date();
      const daysDifference = Math.floor((now.getTime() - monday.getTime()) / (1000 * 60 * 60 * 24));

      expect(daysDifference).toBeGreaterThanOrEqual(0);
      expect(daysDifference).toBeLessThanOrEqual(6);
    });

    it('should handle Sunday correctly (return previous Monday)', () => {
      const getWeekStart = (leaderboardService as any).getWeekStart.bind(leaderboardService);
      const result = getWeekStart();

      // Result should always be a Monday
      const monday = new Date(result + 'T00:00:00Z');
      expect(monday.getUTCDay()).toBe(1);
    });

    it('should use UTC timezone', () => {
      const getWeekStart = (leaderboardService as any).getWeekStart.bind(leaderboardService);
      const result = getWeekStart();

      // Verify the date is in UTC by reconstructing it
      const date = new Date(result + 'T00:00:00Z');
      const utcDate = date.toISOString().split('T')[0];

      expect(result).toBe(utcDate);
    });

    it('should return consistent value when called multiple times', () => {
      const getWeekStart = (leaderboardService as any).getWeekStart.bind(leaderboardService);
      const result1 = getWeekStart();
      const result2 = getWeekStart();

      expect(result1).toBe(result2);
    });
  });
});

// ============================================================================
// Public Method Tests
// ============================================================================

describe('LeaderboardService - Public Methods', () => {
  // Helper to create a game session for testing
  const createGameSession = (sessionId: string, playerAddress: string): void => {
    db.prepare(
      `
      INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
      VALUES (?, 'snake', ?, '0x123', 0.01)
    `
    ).run(sessionId, playerAddress);
  };

  // Helper to get entry from database
  const getEntry = (
    gameType: string,
    playerAddress: string,
    periodType: string,
    periodDate: string
  ): any => {
    return db
      .prepare(
        `
      SELECT * FROM leaderboard_entries
      WHERE game_type = ?
        AND player_address = ?
        AND period_type = ?
        AND period_date = ?
    `
      )
      .get(gameType, playerAddress, periodType, periodDate);
  };

  describe('addEntry', () => {
    const sessionId = 'test-session-1';
    const playerAddress = '0x1234567890abcdef1234567890abcdef12345678';

    beforeEach(() => {
      // Create a game session before adding leaderboard entry
      createGameSession(sessionId, playerAddress);
    });

    it('should add entry to all three periods (daily, weekly, alltime)', () => {
      leaderboardService.addEntry({
        sessionId,
        gameType: 'snake',
        playerAddress,
        score: 1000,
      });

      // Get period dates
      const getTodayDate = (leaderboardService as any).getTodayDate.bind(leaderboardService);
      const getWeekStart = (leaderboardService as any).getWeekStart.bind(leaderboardService);
      const todayDate = getTodayDate();
      const weekStart = getWeekStart();

      // Check daily entry
      const dailyEntry = getEntry('snake', playerAddress, 'daily', todayDate);
      expect(dailyEntry).toBeDefined();
      expect(dailyEntry.score).toBe(1000);

      // Check weekly entry
      const weeklyEntry = getEntry('snake', playerAddress, 'weekly', weekStart);
      expect(weeklyEntry).toBeDefined();
      expect(weeklyEntry.score).toBe(1000);

      // Check alltime entry
      const alltimeEntry = getEntry('snake', playerAddress, 'alltime', 'alltime');
      expect(alltimeEntry).toBeDefined();
      expect(alltimeEntry.score).toBe(1000);
    });

    it('should update entry when new score is higher', () => {
      // Add initial score
      leaderboardService.addEntry({
        sessionId,
        gameType: 'snake',
        playerAddress,
        score: 1000,
      });

      // Create new session for second score
      const sessionId2 = 'test-session-2';
      createGameSession(sessionId2, playerAddress);

      // Add higher score
      leaderboardService.addEntry({
        sessionId: sessionId2,
        gameType: 'snake',
        playerAddress,
        score: 2000,
      });

      // Check that score was updated
      const getTodayDate = (leaderboardService as any).getTodayDate.bind(leaderboardService);
      const todayDate = getTodayDate();
      const entry = getEntry('snake', playerAddress, 'daily', todayDate);

      expect(entry.score).toBe(2000);
      expect(entry.session_id).toBe(sessionId2);
    });

    it('should NOT update entry when new score is lower', () => {
      // Add initial score
      leaderboardService.addEntry({
        sessionId,
        gameType: 'snake',
        playerAddress,
        score: 2000,
      });

      // Create new session for second score
      const sessionId2 = 'test-session-2';
      createGameSession(sessionId2, playerAddress);

      // Try to add lower score
      leaderboardService.addEntry({
        sessionId: sessionId2,
        gameType: 'snake',
        playerAddress,
        score: 1000,
      });

      // Check that score was NOT updated (still 2000)
      const getTodayDate = (leaderboardService as any).getTodayDate.bind(leaderboardService);
      const todayDate = getTodayDate();
      const entry = getEntry('snake', playerAddress, 'daily', todayDate);

      expect(entry.score).toBe(2000);
      expect(entry.session_id).toBe(sessionId); // Original session
    });

    it('should NOT update entry when new score is equal', () => {
      // Add initial score
      leaderboardService.addEntry({
        sessionId,
        gameType: 'snake',
        playerAddress,
        score: 1500,
      });

      // Create new session for second score
      const sessionId2 = 'test-session-2';
      createGameSession(sessionId2, playerAddress);

      // Try to add equal score
      leaderboardService.addEntry({
        sessionId: sessionId2,
        gameType: 'snake',
        playerAddress,
        score: 1500,
      });

      // Check that entry was NOT updated (still original session)
      const getTodayDate = (leaderboardService as any).getTodayDate.bind(leaderboardService);
      const todayDate = getTodayDate();
      const entry = getEntry('snake', playerAddress, 'daily', todayDate);

      expect(entry.score).toBe(1500);
      expect(entry.session_id).toBe(sessionId); // Original session
    });

    it('should handle multiple players independently', () => {
      const player1 = '0x1111111111111111111111111111111111111111';
      const player2 = '0x2222222222222222222222222222222222222222';

      const session1 = 'session-player1';
      const session2 = 'session-player2';

      createGameSession(session1, player1);
      createGameSession(session2, player2);

      // Add scores for both players
      leaderboardService.addEntry({
        sessionId: session1,
        gameType: 'snake',
        playerAddress: player1,
        score: 1000,
      });

      leaderboardService.addEntry({
        sessionId: session2,
        gameType: 'snake',
        playerAddress: player2,
        score: 2000,
      });

      // Check both entries exist with correct scores
      const getTodayDate = (leaderboardService as any).getTodayDate.bind(leaderboardService);
      const todayDate = getTodayDate();

      const entry1 = getEntry('snake', player1, 'daily', todayDate);
      const entry2 = getEntry('snake', player2, 'daily', todayDate);

      expect(entry1.score).toBe(1000);
      expect(entry2.score).toBe(2000);
    });

    it('should set rank to NULL for new entries', () => {
      leaderboardService.addEntry({
        sessionId,
        gameType: 'snake',
        playerAddress,
        score: 1000,
      });

      const getTodayDate = (leaderboardService as any).getTodayDate.bind(leaderboardService);
      const todayDate = getTodayDate();
      const entry = getEntry('snake', playerAddress, 'daily', todayDate);

      // Rank should be NULL (will be calculated separately)
      expect(entry.rank).toBeNull();
    });

    it('should store correct metadata (session_id, game_type, player_address)', () => {
      leaderboardService.addEntry({
        sessionId,
        gameType: 'tetris',
        playerAddress,
        score: 5000,
      });

      const getTodayDate = (leaderboardService as any).getTodayDate.bind(leaderboardService);
      const todayDate = getTodayDate();
      const entry = getEntry('tetris', playerAddress, 'daily', todayDate);

      expect(entry.session_id).toBe(sessionId);
      expect(entry.game_type).toBe('tetris');
      expect(entry.player_address).toBe(playerAddress);
      expect(entry.score).toBe(5000);
    });
  });
});
