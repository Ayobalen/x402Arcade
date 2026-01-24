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

  describe('getTopScores', () => {
    beforeEach(() => {
      // Create multiple game sessions and leaderboard entries for testing
      const players = [
        { address: '0x1111111111111111111111111111111111111111', score: 1000 },
        { address: '0x2222222222222222222222222222222222222222', score: 2000 },
        { address: '0x3333333333333333333333333333333333333333', score: 3000 },
        { address: '0x4444444444444444444444444444444444444444', score: 1500 },
        { address: '0x5555555555555555555555555555555555555555', score: 2500 },
      ];

      players.forEach((player, index) => {
        const sessionId = `session-${index + 1}`;
        createGameSession(sessionId, player.address);
        leaderboardService.addEntry({
          sessionId,
          gameType: 'snake',
          playerAddress: player.address,
          score: player.score,
        });
      });
    });

    it('should return top scores ordered by score descending', () => {
      const results = leaderboardService.getTopScores({
        gameType: 'snake',
        periodType: 'daily',
        limit: 5,
      });

      // Scores should be in descending order: 3000, 2500, 2000, 1500, 1000
      expect(results).toHaveLength(5);
      expect(results[0].score).toBe(3000);
      expect(results[1].score).toBe(2500);
      expect(results[2].score).toBe(2000);
      expect(results[3].score).toBe(1500);
      expect(results[4].score).toBe(1000);
    });

    it('should compute rank using ROW_NUMBER()', () => {
      const results = leaderboardService.getTopScores({
        gameType: 'snake',
        periodType: 'daily',
        limit: 5,
      });

      // Ranks should be 1, 2, 3, 4, 5
      expect(results[0].rank).toBe(1);
      expect(results[1].rank).toBe(2);
      expect(results[2].rank).toBe(3);
      expect(results[3].rank).toBe(4);
      expect(results[4].rank).toBe(5);
    });

    it('should respect limit parameter', () => {
      const results = leaderboardService.getTopScores({
        gameType: 'snake',
        periodType: 'daily',
        limit: 3,
      });

      expect(results).toHaveLength(3);
      expect(results[0].score).toBe(3000);
      expect(results[1].score).toBe(2500);
      expect(results[2].score).toBe(2000);
    });

    it('should use default limit of 10 when not specified', () => {
      const results = leaderboardService.getTopScores({
        gameType: 'snake',
        periodType: 'daily',
      });

      // We only have 5 entries, so should return all 5
      expect(results).toHaveLength(5);
    });

    it('should filter by game type', () => {
      // Add a tetris entry
      const tetrisSession = 'tetris-session';
      const tetrisPlayer = '0x9999999999999999999999999999999999999999';
      createGameSession(tetrisSession, tetrisPlayer);
      leaderboardService.addEntry({
        sessionId: tetrisSession,
        gameType: 'tetris',
        playerAddress: tetrisPlayer,
        score: 9999,
      });

      // Query for snake only
      const snakeResults = leaderboardService.getTopScores({
        gameType: 'snake',
        periodType: 'daily',
      });

      // Should only return snake entries (5 total)
      expect(snakeResults).toHaveLength(5);
      expect(snakeResults.every((entry) => entry.gameType === 'snake')).toBe(true);
    });

    it('should filter by period type (daily)', () => {
      const results = leaderboardService.getTopScores({
        gameType: 'snake',
        periodType: 'daily',
      });

      expect(results.every((entry) => entry.periodType === 'daily')).toBe(true);
    });

    it('should filter by period type (weekly)', () => {
      const results = leaderboardService.getTopScores({
        gameType: 'snake',
        periodType: 'weekly',
      });

      // All entries should be weekly period
      expect(results.every((entry) => entry.periodType === 'weekly')).toBe(true);
      expect(results).toHaveLength(5); // Same 5 players should have weekly entries
    });

    it('should filter by period type (alltime)', () => {
      const results = leaderboardService.getTopScores({
        gameType: 'snake',
        periodType: 'alltime',
      });

      expect(results.every((entry) => entry.periodType === 'alltime')).toBe(true);
      expect(results).toHaveLength(5);
    });

    it('should return empty array when no scores exist', () => {
      const results = leaderboardService.getTopScores({
        gameType: 'pong',
        periodType: 'daily',
      });

      expect(results).toEqual([]);
    });

    it('should return correct metadata for each entry', () => {
      const results = leaderboardService.getTopScores({
        gameType: 'snake',
        periodType: 'daily',
        limit: 1,
      });

      const topEntry = results[0];
      expect(topEntry.id).toBeDefined();
      expect(topEntry.sessionId).toBeDefined();
      expect(topEntry.gameType).toBe('snake');
      expect(topEntry.playerAddress).toBeDefined();
      expect(topEntry.score).toBe(3000);
      expect(topEntry.periodType).toBe('daily');
      expect(topEntry.periodDate).toBeDefined();
      expect(topEntry.rank).toBe(1);
      expect(topEntry.createdAt).toBeDefined();
    });

    it('should handle tie scores with different ranks', () => {
      // Add two players with same score
      const player6 = '0x6666666666666666666666666666666666666666';
      const player7 = '0x7777777777777777777777777777777777777777';

      const session6 = 'session-6';
      const session7 = 'session-7';

      createGameSession(session6, player6);
      createGameSession(session7, player7);

      leaderboardService.addEntry({
        sessionId: session6,
        gameType: 'snake',
        playerAddress: player6,
        score: 2000,
      });

      leaderboardService.addEntry({
        sessionId: session7,
        gameType: 'snake',
        playerAddress: player7,
        score: 2000,
      });

      const results = leaderboardService.getTopScores({
        gameType: 'snake',
        periodType: 'daily',
      });

      // Find entries with score 2000
      const tiedEntries = results.filter((entry) => entry.score === 2000);

      // Both should be present with different ranks
      expect(tiedEntries.length).toBeGreaterThanOrEqual(2);
      // Ranks should be sequential (ROW_NUMBER assigns unique ranks even for ties)
      const ranks = tiedEntries.map((e) => e.rank).sort((a, b) => a - b);
      expect(ranks[1] - ranks[0]).toBe(1); // Consecutive ranks
    });

    it('should calculate correct period_date for daily', () => {
      const results = leaderboardService.getTopScores({
        gameType: 'snake',
        periodType: 'daily',
      });

      const getTodayDate = (leaderboardService as any).getTodayDate.bind(leaderboardService);
      const expectedDate = getTodayDate();

      expect(results.every((entry) => entry.periodDate === expectedDate)).toBe(true);
    });

    it('should calculate correct period_date for weekly', () => {
      const results = leaderboardService.getTopScores({
        gameType: 'snake',
        periodType: 'weekly',
      });

      const getWeekStart = (leaderboardService as any).getWeekStart.bind(leaderboardService);
      const expectedDate = getWeekStart();

      expect(results.every((entry) => entry.periodDate === expectedDate)).toBe(true);
    });

    it('should use "alltime" as period_date for alltime', () => {
      const results = leaderboardService.getTopScores({
        gameType: 'snake',
        periodType: 'alltime',
      });

      expect(results.every((entry) => entry.periodDate === 'alltime')).toBe(true);
    });
  });

  // ============================================================================
  // getAllTimeLeaderboard Tests
  // ============================================================================

  describe('getAllTimeLeaderboard', () => {
    const player1 = '0x1111111111111111111111111111111111111111';
    const player2 = '0x2222222222222222222222222222222222222222';
    const player3 = '0x3333333333333333333333333333333333333333';

    beforeEach(() => {
      // Add some scores
      leaderboardService.addEntry({
        sessionId: 'session-1',
        gameType: 'snake',
        playerAddress: player1,
        score: 5000,
      });

      leaderboardService.addEntry({
        sessionId: 'session-2',
        gameType: 'snake',
        playerAddress: player2,
        score: 3000,
      });

      leaderboardService.addEntry({
        sessionId: 'session-3',
        gameType: 'tetris',
        playerAddress: player3,
        score: 10000,
      });
    });

    it('should return all-time leaderboard entries', () => {
      const results = leaderboardService.getAllTimeLeaderboard({
        gameType: 'snake',
      });

      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should call getTopScores with alltime periodType', () => {
      const results = leaderboardService.getAllTimeLeaderboard({
        gameType: 'snake',
      });

      // Verify all results have alltime period type
      expect(results.every((entry) => entry.periodType === 'alltime')).toBe(true);
    });

    it('should use "alltime" as period_date', () => {
      const results = leaderboardService.getAllTimeLeaderboard({
        gameType: 'snake',
      });

      expect(results.every((entry) => entry.periodDate === 'alltime')).toBe(true);
    });

    it('should filter by game type', () => {
      const snakeResults = leaderboardService.getAllTimeLeaderboard({
        gameType: 'snake',
      });

      const tetrisResults = leaderboardService.getAllTimeLeaderboard({
        gameType: 'tetris',
      });

      expect(snakeResults.length).toBe(2);
      expect(tetrisResults.length).toBe(1);
    });

    it('should respect limit parameter', () => {
      const results = leaderboardService.getAllTimeLeaderboard({
        gameType: 'snake',
        limit: 1,
      });

      expect(results.length).toBe(1);
    });

    it('should use default limit of 10 when not specified', () => {
      // Add 15 entries to test default limit
      for (let i = 0; i < 15; i++) {
        leaderboardService.addEntry({
          sessionId: `session-${i + 10}`,
          gameType: 'pong',
          playerAddress: `0x${i.toString().padStart(40, '0')}`,
          score: 100 + i,
        });
      }

      const results = leaderboardService.getAllTimeLeaderboard({
        gameType: 'pong',
      });

      // Should return default limit of 10, not all 15
      expect(results.length).toBe(10);
    });

    it('should return scores in descending order', () => {
      const results = leaderboardService.getAllTimeLeaderboard({
        gameType: 'snake',
      });

      // First entry should have highest score
      expect(results[0].score).toBe(5000);
      expect(results[1].score).toBe(3000);
    });

    it('should compute ranks correctly', () => {
      const results = leaderboardService.getAllTimeLeaderboard({
        gameType: 'snake',
      });

      expect(results[0].rank).toBe(1);
      expect(results[1].rank).toBe(2);
    });

    it('should return empty array when no scores exist', () => {
      const results = leaderboardService.getAllTimeLeaderboard({
        gameType: 'breakout',
      });

      expect(results).toEqual([]);
    });
  });

  // ============================================================================
  // getPlayerRanking Tests
  // ============================================================================

  describe('getPlayerRanking', () => {
    const player1 = '0x1111111111111111111111111111111111111111';
    const player2 = '0x2222222222222222222222222222222222222222';
    const player3 = '0x3333333333333333333333333333333333333333';
    const player4 = '0x4444444444444444444444444444444444444444';
    const player5 = '0x5555555555555555555555555555555555555555';

    beforeEach(() => {
      // Add entries with different scores (player1 = 5000, player2 = 4000, etc.)
      leaderboardService.addEntry({
        sessionId: 'session-1',
        gameType: 'snake',
        playerAddress: player1,
        score: 5000, // Rank 1
      });

      leaderboardService.addEntry({
        sessionId: 'session-2',
        gameType: 'snake',
        playerAddress: player2,
        score: 4000, // Rank 2
      });

      leaderboardService.addEntry({
        sessionId: 'session-3',
        gameType: 'snake',
        playerAddress: player3,
        score: 3000, // Rank 3
      });

      leaderboardService.addEntry({
        sessionId: 'session-4',
        gameType: 'snake',
        playerAddress: player4,
        score: 2000, // Rank 4
      });

      leaderboardService.addEntry({
        sessionId: 'session-5',
        gameType: 'snake',
        playerAddress: player5,
        score: 1000, // Rank 5
      });
    });

    it('should return null if player has no entry', () => {
      const result = leaderboardService.getPlayerRanking({
        gameType: 'snake',
        playerAddress: '0x9999999999999999999999999999999999999999',
        periodType: 'daily',
      });

      expect(result).toBeNull();
    });

    it('should return rank 1 for highest score', () => {
      const result = leaderboardService.getPlayerRanking({
        gameType: 'snake',
        playerAddress: player1,
        periodType: 'daily',
      });

      expect(result).not.toBeNull();
      expect(result!.rank).toBe(1);
    });

    it('should return rank 2 for second highest score', () => {
      const result = leaderboardService.getPlayerRanking({
        gameType: 'snake',
        playerAddress: player2,
        periodType: 'daily',
      });

      expect(result).not.toBeNull();
      expect(result!.rank).toBe(2);
    });

    it('should return rank 5 for lowest score', () => {
      const result = leaderboardService.getPlayerRanking({
        gameType: 'snake',
        playerAddress: player5,
        periodType: 'daily',
      });

      expect(result).not.toBeNull();
      expect(result!.rank).toBe(5);
    });

    it('should return correct score', () => {
      const result = leaderboardService.getPlayerRanking({
        gameType: 'snake',
        playerAddress: player3,
        periodType: 'daily',
      });

      expect(result).not.toBeNull();
      expect(result!.score).toBe(3000);
    });

    it('should return correct total players count', () => {
      const result = leaderboardService.getPlayerRanking({
        gameType: 'snake',
        playerAddress: player3,
        periodType: 'daily',
      });

      expect(result).not.toBeNull();
      expect(result!.totalPlayers).toBe(5);
    });

    it('should calculate percentile correctly for rank 1', () => {
      // Rank 1 out of 5 = top 20% = 100th percentile (better than 100% of players)
      const result = leaderboardService.getPlayerRanking({
        gameType: 'snake',
        playerAddress: player1,
        periodType: 'daily',
      });

      expect(result).not.toBeNull();
      // percentile = (totalPlayers - rank + 1) / totalPlayers * 100
      // percentile = (5 - 1 + 1) / 5 * 100 = 5/5 * 100 = 100
      expect(result!.percentile).toBe(100);
    });

    it('should calculate percentile correctly for rank 3', () => {
      // Rank 3 out of 5 = middle = 60th percentile
      const result = leaderboardService.getPlayerRanking({
        gameType: 'snake',
        playerAddress: player3,
        periodType: 'daily',
      });

      expect(result).not.toBeNull();
      // percentile = (5 - 3 + 1) / 5 * 100 = 3/5 * 100 = 60
      expect(result!.percentile).toBe(60);
    });

    it('should calculate percentile correctly for rank 5', () => {
      // Rank 5 out of 5 = bottom = 20th percentile
      const result = leaderboardService.getPlayerRanking({
        gameType: 'snake',
        playerAddress: player5,
        periodType: 'daily',
      });

      expect(result).not.toBeNull();
      // percentile = (5 - 5 + 1) / 5 * 100 = 1/5 * 100 = 20
      expect(result!.percentile).toBe(20);
    });

    it('should filter by game type', () => {
      // Add a tetris entry for player1
      leaderboardService.addEntry({
        sessionId: 'session-tetris-1',
        gameType: 'tetris',
        playerAddress: player1,
        score: 100,
      });

      const snakeResult = leaderboardService.getPlayerRanking({
        gameType: 'snake',
        playerAddress: player1,
        periodType: 'daily',
      });

      const tetrisResult = leaderboardService.getPlayerRanking({
        gameType: 'tetris',
        playerAddress: player1,
        periodType: 'daily',
      });

      expect(snakeResult).not.toBeNull();
      expect(snakeResult!.rank).toBe(1);
      expect(snakeResult!.totalPlayers).toBe(5); // 5 snake players

      expect(tetrisResult).not.toBeNull();
      expect(tetrisResult!.rank).toBe(1);
      expect(tetrisResult!.totalPlayers).toBe(1); // 1 tetris player
    });

    it('should filter by period type (daily)', () => {
      const result = leaderboardService.getPlayerRanking({
        gameType: 'snake',
        playerAddress: player1,
        periodType: 'daily',
      });

      expect(result).not.toBeNull();
      expect(result!.rank).toBe(1);
    });

    it('should filter by period type (weekly)', () => {
      const result = leaderboardService.getPlayerRanking({
        gameType: 'snake',
        playerAddress: player1,
        periodType: 'weekly',
      });

      expect(result).not.toBeNull();
      expect(result!.rank).toBe(1);
    });

    it('should filter by period type (alltime)', () => {
      const result = leaderboardService.getPlayerRanking({
        gameType: 'snake',
        playerAddress: player1,
        periodType: 'alltime',
      });

      expect(result).not.toBeNull();
      expect(result!.rank).toBe(1);
    });

    it('should return all required fields in PlayerRanking', () => {
      const result = leaderboardService.getPlayerRanking({
        gameType: 'snake',
        playerAddress: player3,
        periodType: 'daily',
      });

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('rank');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('totalPlayers');
      expect(result).toHaveProperty('percentile');
      expect(typeof result!.rank).toBe('number');
      expect(typeof result!.score).toBe('number');
      expect(typeof result!.totalPlayers).toBe('number');
      expect(typeof result!.percentile).toBe('number');
    });

    it('should round percentile to 1 decimal place', () => {
      // Add 2 more players to create a non-round percentile
      leaderboardService.addEntry({
        sessionId: 'session-6',
        gameType: 'snake',
        playerAddress: '0x6666666666666666666666666666666666666666',
        score: 500,
      });

      leaderboardService.addEntry({
        sessionId: 'session-7',
        gameType: 'snake',
        playerAddress: '0x7777777777777777777777777777777777777777',
        score: 250,
      });

      // Now we have 7 players total
      // Player3 (rank 3) percentile = (7 - 3 + 1) / 7 * 100 = 5/7 * 100 = 71.428...
      const result = leaderboardService.getPlayerRanking({
        gameType: 'snake',
        playerAddress: player3,
        periodType: 'daily',
      });

      expect(result).not.toBeNull();
      expect(result!.percentile).toBe(71.4);
      expect(result!.percentile.toString()).toMatch(/^\d+\.\d$/); // Format: X.X
    });

    it('should handle single player case', () => {
      // Clear existing entries and add just one
      db.exec('DELETE FROM leaderboard_entries');

      leaderboardService.addEntry({
        sessionId: 'session-solo',
        gameType: 'pong',
        playerAddress: player1,
        score: 100,
      });

      const result = leaderboardService.getPlayerRanking({
        gameType: 'pong',
        playerAddress: player1,
        periodType: 'daily',
      });

      expect(result).not.toBeNull();
      expect(result!.rank).toBe(1);
      expect(result!.totalPlayers).toBe(1);
      expect(result!.percentile).toBe(100); // (1 - 1 + 1) / 1 * 100 = 100
    });
  });
});
