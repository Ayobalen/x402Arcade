/**
 * Leaderboard Factory Tests
 *
 * Tests for the leaderboard fixture factories.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  createLeaderboardEntry,
  createRankedEntry,
  createDailyLeaderboard,
  createWeeklyLeaderboard,
  createAllTimeLeaderboard,
  createTiedEntries,
  createLeaderboardWithTies,
  createPlayerLeaderboardHistory,
  createPlayerDailyHistory,
  createRankedLeaderboard,
  createMultiGameLeaderboard,
  calculatePrizeDistribution,
  createLeaderboardWithPrizes,
  isValidLeaderboardEntry,
  isProperlyRanked,
  resetLeaderboardCounters,
  getToday,
  getWeekStart,
  getDaysAgo,
  getWeeksAgo,
  PRIZE_DISTRIBUTION,
  PRIZE_POOL_CONFIG,
  SCORE_RANGES,
  type LeaderboardEntry,
  type PeriodType,
  type GameType,
} from '../fixtures/leaderboard.factory';
import { TEST_ADDRESSES, generateWalletAddress } from '../fixtures/game-session.factory';

describe('Leaderboard Factory', () => {
  beforeEach(() => {
    resetLeaderboardCounters();
  });

  // ==========================================================================
  // Constants
  // ==========================================================================

  describe('Constants', () => {
    it('should have correct prize distribution', () => {
      expect(PRIZE_DISTRIBUTION.first).toBe(50);
      expect(PRIZE_DISTRIBUTION.second).toBe(30);
      expect(PRIZE_DISTRIBUTION.third).toBe(20);
      expect(PRIZE_DISTRIBUTION.first + PRIZE_DISTRIBUTION.second + PRIZE_DISTRIBUTION.third).toBe(100);
    });

    it('should have correct prize pool config', () => {
      expect(PRIZE_POOL_CONFIG.poolPercentage).toBe(70);
      expect(PRIZE_POOL_CONFIG.minimumPool).toBe(0.10);
      expect(PRIZE_POOL_CONFIG.distributionPeriods).toContain('daily');
      expect(PRIZE_POOL_CONFIG.distributionPeriods).toContain('weekly');
    });

    it('should have score ranges for each game type', () => {
      expect(SCORE_RANGES.snake).toBeDefined();
      expect(SCORE_RANGES.snake.min).toBeLessThan(SCORE_RANGES.snake.max);
      expect(SCORE_RANGES.tetris).toBeDefined();
      expect(SCORE_RANGES.tetris.min).toBeLessThan(SCORE_RANGES.tetris.max);
    });
  });

  // ==========================================================================
  // Utility Functions
  // ==========================================================================

  describe('Utility Functions', () => {
    describe('getToday', () => {
      it('should return date in YYYY-MM-DD format', () => {
        const today = getToday();
        expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });

      it('should return current date', () => {
        const today = getToday();
        const now = new Date();
        const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        expect(today).toBe(expected);
      });
    });

    describe('getWeekStart', () => {
      it('should return date in YYYY-MM-DD format', () => {
        const weekStart = getWeekStart();
        expect(weekStart).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });

      it('should return a Monday', () => {
        const weekStart = getWeekStart();
        // Parse the date string as local date
        const [year, month, day] = weekStart.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        expect(date.getDay()).toBe(1); // Monday (local time)
      });

      it('should handle custom date', () => {
        // Create a date that is definitely a Wednesday in local time
        const customDate = new Date(2026, 0, 14); // January 14, 2026 (Wednesday)
        const weekStart = getWeekStart(customDate);
        expect(weekStart).toBe('2026-01-12'); // Monday of that week
      });
    });

    describe('getDaysAgo', () => {
      it('should return correct date for days ago', () => {
        const threeDaysAgo = getDaysAgo(3);
        const expected = new Date();
        expected.setDate(expected.getDate() - 3);
        expect(threeDaysAgo).toBe(expected.toISOString().split('T')[0]);
      });

      it('should return today for 0 days ago', () => {
        expect(getDaysAgo(0)).toBe(getToday());
      });
    });

    describe('getWeeksAgo', () => {
      it('should return week start from weeks ago', () => {
        const twoWeeksAgo = getWeeksAgo(2);
        const expected = new Date();
        expected.setDate(expected.getDate() - 14);
        expect(twoWeeksAgo).toBe(getWeekStart(expected));
      });
    });

    describe('resetLeaderboardCounters', () => {
      it('should reset entry counter', () => {
        const entry1 = createLeaderboardEntry();
        const entry2 = createLeaderboardEntry();

        resetLeaderboardCounters();

        const entry3 = createLeaderboardEntry();
        expect(entry3.id).toBe(1);
      });
    });
  });

  // ==========================================================================
  // createLeaderboardEntry
  // ==========================================================================

  describe('createLeaderboardEntry', () => {
    it('should create entry with default values', () => {
      const entry = createLeaderboardEntry();

      expect(entry.id).toBeDefined();
      expect(entry.session_id).toBeDefined();
      expect(entry.game_type).toBe('snake');
      expect(entry.player_address).toBe(TEST_ADDRESSES.player1);
      expect(entry.score).toBeGreaterThanOrEqual(SCORE_RANGES.snake.min);
      expect(entry.period_type).toBe('daily');
      expect(entry.period_date).toBe(getToday());
      expect(entry.rank).toBeNull();
      expect(entry.created_at).toBeDefined();
    });

    it('should accept custom values', () => {
      const customAddress = generateWalletAddress();
      const entry = createLeaderboardEntry({
        game_type: 'tetris',
        player_address: customAddress,
        score: 5000,
        period_type: 'weekly',
        rank: 1,
      });

      expect(entry.game_type).toBe('tetris');
      expect(entry.player_address).toBe(customAddress);
      expect(entry.score).toBe(5000);
      expect(entry.period_type).toBe('weekly');
      expect(entry.rank).toBe(1);
    });

    it('should set correct period_date based on period_type', () => {
      const daily = createLeaderboardEntry({ period_type: 'daily' });
      expect(daily.period_date).toBe(getToday());

      const weekly = createLeaderboardEntry({ period_type: 'weekly' });
      expect(weekly.period_date).toBe(getWeekStart());

      const alltime = createLeaderboardEntry({ period_type: 'alltime' });
      expect(alltime.period_date).toBe('2026-01-01');
    });

    it('should create valid entries', () => {
      const entry = createLeaderboardEntry();
      expect(isValidLeaderboardEntry(entry)).toBe(true);
    });

    it('should generate unique IDs', () => {
      const entry1 = createLeaderboardEntry();
      const entry2 = createLeaderboardEntry();
      expect(entry1.id).not.toBe(entry2.id);
    });
  });

  // ==========================================================================
  // createRankedEntry
  // ==========================================================================

  describe('createRankedEntry', () => {
    it('should create entry with specified rank and score', () => {
      const entry = createRankedEntry(1, 999);

      expect(entry.rank).toBe(1);
      expect(entry.score).toBe(999);
    });

    it('should accept additional options', () => {
      const entry = createRankedEntry(2, 500, {
        game_type: 'tetris',
        period_type: 'weekly',
      });

      expect(entry.rank).toBe(2);
      expect(entry.score).toBe(500);
      expect(entry.game_type).toBe('tetris');
      expect(entry.period_type).toBe('weekly');
    });
  });

  // ==========================================================================
  // createDailyLeaderboard
  // ==========================================================================

  describe('createDailyLeaderboard', () => {
    it('should create specified number of entries', () => {
      const leaderboard = createDailyLeaderboard(10);
      expect(leaderboard.length).toBe(10);
    });

    it('should have daily period type', () => {
      const leaderboard = createDailyLeaderboard(5);
      leaderboard.forEach(entry => {
        expect(entry.period_type).toBe('daily');
      });
    });

    it('should use today by default', () => {
      const leaderboard = createDailyLeaderboard(5);
      const today = getToday();
      leaderboard.forEach(entry => {
        expect(entry.period_date).toBe(today);
      });
    });

    it('should accept custom date', () => {
      const customDate = getDaysAgo(3);
      const leaderboard = createDailyLeaderboard(5, customDate);
      leaderboard.forEach(entry => {
        expect(entry.period_date).toBe(customDate);
      });
    });

    it('should have unique player addresses', () => {
      const leaderboard = createDailyLeaderboard(10);
      const addresses = leaderboard.map(e => e.player_address);
      const uniqueAddresses = new Set(addresses);
      expect(uniqueAddresses.size).toBe(10);
    });

    it('should be sorted by score descending', () => {
      const leaderboard = createDailyLeaderboard(10);
      expect(isProperlyRanked(leaderboard)).toBe(true);
    });

    it('should have consecutive ranks', () => {
      const leaderboard = createDailyLeaderboard(10);
      leaderboard.forEach((entry, index) => {
        expect(entry.rank).toBe(index + 1);
      });
    });

    it('should use specified game type', () => {
      const leaderboard = createDailyLeaderboard(5, undefined, 'tetris');
      leaderboard.forEach(entry => {
        expect(entry.game_type).toBe('tetris');
      });
    });
  });

  // ==========================================================================
  // createWeeklyLeaderboard
  // ==========================================================================

  describe('createWeeklyLeaderboard', () => {
    it('should create specified number of entries', () => {
      const leaderboard = createWeeklyLeaderboard(10);
      expect(leaderboard.length).toBe(10);
    });

    it('should have weekly period type', () => {
      const leaderboard = createWeeklyLeaderboard(5);
      leaderboard.forEach(entry => {
        expect(entry.period_type).toBe('weekly');
      });
    });

    it('should use current week start by default', () => {
      const leaderboard = createWeeklyLeaderboard(5);
      const weekStart = getWeekStart();
      leaderboard.forEach(entry => {
        expect(entry.period_date).toBe(weekStart);
      });
    });

    it('should accept custom week start as Date', () => {
      // Create a date that is definitely a Wednesday in local time
      const customDate = new Date(2026, 0, 14); // January 14, 2026 (Wednesday)
      const leaderboard = createWeeklyLeaderboard(5, customDate);
      leaderboard.forEach(entry => {
        expect(entry.period_date).toBe('2026-01-12'); // Monday of that week
      });
    });

    it('should accept custom week start as string', () => {
      const leaderboard = createWeeklyLeaderboard(5, '2026-01-06');
      leaderboard.forEach(entry => {
        expect(entry.period_date).toBe('2026-01-06');
      });
    });

    it('should be sorted by score descending', () => {
      const leaderboard = createWeeklyLeaderboard(10);
      expect(isProperlyRanked(leaderboard)).toBe(true);
    });

    it('should have higher scores than daily (more games)', () => {
      const daily = createDailyLeaderboard(5);
      const weekly = createWeeklyLeaderboard(5);

      // Top weekly score should generally be higher
      expect(weekly[0].score).toBeGreaterThan(daily[0].score * 0.8);
    });
  });

  // ==========================================================================
  // createAllTimeLeaderboard
  // ==========================================================================

  describe('createAllTimeLeaderboard', () => {
    it('should create specified number of entries', () => {
      const leaderboard = createAllTimeLeaderboard(50);
      expect(leaderboard.length).toBe(50);
    });

    it('should have alltime period type', () => {
      const leaderboard = createAllTimeLeaderboard(5);
      leaderboard.forEach(entry => {
        expect(entry.period_type).toBe('alltime');
      });
    });

    it('should have fixed period date', () => {
      const leaderboard = createAllTimeLeaderboard(5);
      leaderboard.forEach(entry => {
        expect(entry.period_date).toBe('2026-01-01');
      });
    });

    it('should have varied creation dates', () => {
      const leaderboard = createAllTimeLeaderboard(10);
      const createdDates = leaderboard.map(e => e.created_at);
      const uniqueDates = new Set(createdDates);
      expect(uniqueDates.size).toBeGreaterThan(1);
    });

    it('should be sorted by score descending', () => {
      const leaderboard = createAllTimeLeaderboard(20);
      expect(isProperlyRanked(leaderboard)).toBe(true);
    });

    it('should have higher scores than weekly', () => {
      const weekly = createWeeklyLeaderboard(5);
      const alltime = createAllTimeLeaderboard(5);

      // Top all-time score should generally be higher
      expect(alltime[0].score).toBeGreaterThan(weekly[0].score * 0.8);
    });
  });

  // ==========================================================================
  // createTiedEntries
  // ==========================================================================

  describe('createTiedEntries', () => {
    it('should create specified number of entries', () => {
      const ties = createTiedEntries(3, 500);
      expect(ties.length).toBe(3);
    });

    it('should have same score for all entries', () => {
      const ties = createTiedEntries(5, 1000);
      ties.forEach(entry => {
        expect(entry.score).toBe(1000);
      });
    });

    it('should have unique player addresses', () => {
      const ties = createTiedEntries(5, 500);
      const addresses = ties.map(e => e.player_address);
      const uniqueAddresses = new Set(addresses);
      expect(uniqueAddresses.size).toBe(5);
    });

    it('should have different creation times for tie-breaking', () => {
      const ties = createTiedEntries(3, 500);
      const times = ties.map(e => new Date(e.created_at).getTime());

      // Each entry should have different time
      expect(new Set(times).size).toBe(3);

      // Times should be in increasing order
      for (let i = 1; i < times.length; i++) {
        expect(times[i]).toBeGreaterThan(times[i - 1]);
      }
    });

    it('should accept custom options', () => {
      const ties = createTiedEntries(3, 750, {
        game_type: 'tetris',
        period_type: 'weekly',
      });

      ties.forEach(entry => {
        expect(entry.score).toBe(750);
        expect(entry.game_type).toBe('tetris');
        expect(entry.period_type).toBe('weekly');
      });
    });
  });

  // ==========================================================================
  // createLeaderboardWithTies
  // ==========================================================================

  describe('createLeaderboardWithTies', () => {
    it('should create leaderboard with specified ties', () => {
      const leaderboard = createLeaderboardWithTies(10, [{ rank: 2, count: 2 }]);
      expect(leaderboard.length).toBe(10);

      // Check for tie at rank 2
      const rank2Entries = leaderboard.filter(e => e.rank === 2);
      expect(rank2Entries.length).toBe(2);
      expect(rank2Entries[0].score).toBe(rank2Entries[1].score);
    });

    it('should handle multiple tie positions', () => {
      const leaderboard = createLeaderboardWithTies(10, [
        { rank: 2, count: 2 },
        { rank: 5, count: 3 },
      ]);

      const rank2 = leaderboard.filter(e => e.rank === 2);
      const rank5 = leaderboard.filter(e => e.rank === 5);

      expect(rank2.length).toBe(2);
      expect(rank5.length).toBe(3);
    });

    it('should properly skip ranks after ties', () => {
      const leaderboard = createLeaderboardWithTies(10, [{ rank: 2, count: 3 }]);

      // After 3-way tie at rank 2, next rank should be 5
      const ranksAfterTie = leaderboard.filter(e => e.rank !== null && e.rank > 2);
      expect(ranksAfterTie[0].rank).toBeGreaterThanOrEqual(5);
    });
  });

  // ==========================================================================
  // createPlayerLeaderboardHistory
  // ==========================================================================

  describe('createPlayerLeaderboardHistory', () => {
    it('should create entries for all three period types', () => {
      const history = createPlayerLeaderboardHistory(TEST_ADDRESSES.player1);

      expect(history.length).toBe(3);

      const periodTypes = history.map(e => e.period_type);
      expect(periodTypes).toContain('daily');
      expect(periodTypes).toContain('weekly');
      expect(periodTypes).toContain('alltime');
    });

    it('should have same player address for all entries', () => {
      const address = generateWalletAddress();
      const history = createPlayerLeaderboardHistory(address);

      history.forEach(entry => {
        expect(entry.player_address).toBe(address);
      });
    });

    it('should have increasing scores (daily < weekly < alltime)', () => {
      const history = createPlayerLeaderboardHistory(TEST_ADDRESSES.player1);

      const daily = history.find(e => e.period_type === 'daily')!;
      const weekly = history.find(e => e.period_type === 'weekly')!;
      const alltime = history.find(e => e.period_type === 'alltime')!;

      expect(weekly.score).toBeGreaterThan(daily.score);
      expect(alltime.score).toBeGreaterThan(weekly.score);
    });

    it('should use specified game type', () => {
      const history = createPlayerLeaderboardHistory(TEST_ADDRESSES.player1, 'tetris');

      history.forEach(entry => {
        expect(entry.game_type).toBe('tetris');
      });
    });
  });

  // ==========================================================================
  // createPlayerDailyHistory
  // ==========================================================================

  describe('createPlayerDailyHistory', () => {
    it('should create specified number of daily entries', () => {
      const history = createPlayerDailyHistory(TEST_ADDRESSES.player1, 7);
      expect(history.length).toBe(7);
    });

    it('should have same player address for all entries', () => {
      const address = generateWalletAddress();
      const history = createPlayerDailyHistory(address, 5);

      history.forEach(entry => {
        expect(entry.player_address).toBe(address);
      });
    });

    it('should have daily period type for all entries', () => {
      const history = createPlayerDailyHistory(TEST_ADDRESSES.player1, 5);

      history.forEach(entry => {
        expect(entry.period_type).toBe('daily');
      });
    });

    it('should have different dates for each entry', () => {
      const history = createPlayerDailyHistory(TEST_ADDRESSES.player1, 7);
      const dates = history.map(e => e.period_date);
      const uniqueDates = new Set(dates);
      expect(uniqueDates.size).toBe(7);
    });

    it('should have ranks assigned', () => {
      const history = createPlayerDailyHistory(TEST_ADDRESSES.player1, 5);

      history.forEach(entry => {
        expect(entry.rank).not.toBeNull();
        expect(entry.rank).toBeGreaterThanOrEqual(1);
        expect(entry.rank).toBeLessThanOrEqual(10);
      });
    });
  });

  // ==========================================================================
  // createRankedLeaderboard
  // ==========================================================================

  describe('createRankedLeaderboard', () => {
    it('should create leaderboard with metadata', () => {
      const result = createRankedLeaderboard(10, 'daily', 'snake');

      expect(result.entries.length).toBe(10);
      expect(result.period_type).toBe('daily');
      expect(result.game_type).toBe('snake');
      expect(result.total_players).toBe(10);
      expect(result.top_score).toBe(result.entries[0].score);
    });

    it('should create different leaderboards by period type', () => {
      const daily = createRankedLeaderboard(5, 'daily');
      const weekly = createRankedLeaderboard(5, 'weekly');
      const alltime = createRankedLeaderboard(5, 'alltime');

      expect(daily.period_type).toBe('daily');
      expect(weekly.period_type).toBe('weekly');
      expect(alltime.period_type).toBe('alltime');
    });

    it('should have properly ranked entries', () => {
      const result = createRankedLeaderboard(10);
      expect(isProperlyRanked(result.entries)).toBe(true);
    });
  });

  // ==========================================================================
  // createMultiGameLeaderboard
  // ==========================================================================

  describe('createMultiGameLeaderboard', () => {
    it('should create leaderboards for both games', () => {
      const result = createMultiGameLeaderboard(10);

      expect(result.snake.length).toBe(10);
      expect(result.tetris.length).toBe(10);
    });

    it('should have correct game types', () => {
      const result = createMultiGameLeaderboard(5);

      result.snake.forEach(e => expect(e.game_type).toBe('snake'));
      result.tetris.forEach(e => expect(e.game_type).toBe('tetris'));
    });

    it('should use specified period type', () => {
      const result = createMultiGameLeaderboard(5, 'weekly');

      result.snake.forEach(e => expect(e.period_type).toBe('weekly'));
      result.tetris.forEach(e => expect(e.period_type).toBe('weekly'));
    });
  });

  // ==========================================================================
  // calculatePrizeDistribution
  // ==========================================================================

  describe('calculatePrizeDistribution', () => {
    it('should distribute prizes to top 3', () => {
      const entries = createDailyLeaderboard(5);
      const distribution = calculatePrizeDistribution(100, entries);

      expect(distribution.length).toBe(3);
    });

    it('should calculate correct percentages', () => {
      const entries = createDailyLeaderboard(5);
      const distribution = calculatePrizeDistribution(100, entries);

      expect(distribution[0].prize_amount).toBe(50); // 50%
      expect(distribution[1].prize_amount).toBe(30); // 30%
      expect(distribution[2].prize_amount).toBe(20); // 20%
    });

    it('should round to 2 decimal places', () => {
      const entries = createDailyLeaderboard(5);
      const distribution = calculatePrizeDistribution(33.33, entries);

      distribution.forEach(d => {
        const decimals = (d.prize_amount.toString().split('.')[1] || '').length;
        expect(decimals).toBeLessThanOrEqual(2);
      });
    });

    it('should handle fewer than 3 entries', () => {
      const entries = createDailyLeaderboard(2);
      const distribution = calculatePrizeDistribution(100, entries);

      expect(distribution.length).toBe(2);
    });

    it('should include correct ranks', () => {
      const entries = createDailyLeaderboard(5);
      const distribution = calculatePrizeDistribution(100, entries);

      expect(distribution[0].rank).toBe(1);
      expect(distribution[1].rank).toBe(2);
      expect(distribution[2].rank).toBe(3);
    });
  });

  // ==========================================================================
  // createLeaderboardWithPrizes
  // ==========================================================================

  describe('createLeaderboardWithPrizes', () => {
    it('should create leaderboard with prize data', () => {
      const result = createLeaderboardWithPrizes(10, 100);

      expect(result.entries.length).toBe(10);
      expect(result.prizes.length).toBe(3);
    });

    it('should match top 3 entries to prizes', () => {
      const result = createLeaderboardWithPrizes(10, 100);

      for (let i = 0; i < 3; i++) {
        expect(result.prizes[i].player_address).toBe(result.entries[i].player_address);
      }
    });

    it('should use specified period type', () => {
      const result = createLeaderboardWithPrizes(10, 100, 'weekly');

      result.entries.forEach(e => {
        expect(e.period_type).toBe('weekly');
      });
    });
  });

  // ==========================================================================
  // Validation Utilities
  // ==========================================================================

  describe('isValidLeaderboardEntry', () => {
    it('should return true for valid entries', () => {
      expect(isValidLeaderboardEntry(createLeaderboardEntry())).toBe(true);
      expect(isValidLeaderboardEntry(createRankedEntry(1, 500))).toBe(true);
    });

    it('should return false for null/undefined', () => {
      expect(isValidLeaderboardEntry(null)).toBe(false);
      expect(isValidLeaderboardEntry(undefined)).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(isValidLeaderboardEntry('string')).toBe(false);
      expect(isValidLeaderboardEntry(123)).toBe(false);
      expect(isValidLeaderboardEntry([])).toBe(false);
    });

    it('should return false for objects with missing fields', () => {
      expect(isValidLeaderboardEntry({})).toBe(false);
      expect(isValidLeaderboardEntry({ id: 1 })).toBe(false);
    });

    it('should return false for invalid field values', () => {
      const entry = createLeaderboardEntry();

      expect(isValidLeaderboardEntry({ ...entry, game_type: 'invalid' })).toBe(false);
      expect(isValidLeaderboardEntry({ ...entry, period_type: 'invalid' })).toBe(false);
      expect(isValidLeaderboardEntry({ ...entry, score: 'high' })).toBe(false);
    });
  });

  describe('isProperlyRanked', () => {
    it('should return true for properly sorted leaderboard', () => {
      const leaderboard = createDailyLeaderboard(10);
      expect(isProperlyRanked(leaderboard)).toBe(true);
    });

    it('should return true for empty leaderboard', () => {
      expect(isProperlyRanked([])).toBe(true);
    });

    it('should return true for single entry', () => {
      expect(isProperlyRanked([createRankedEntry(1, 500)])).toBe(true);
    });

    it('should return false for unsorted leaderboard', () => {
      const entries = [
        createRankedEntry(1, 100),
        createRankedEntry(2, 500), // Higher score but lower rank - invalid
      ];
      expect(isProperlyRanked(entries)).toBe(false);
    });

    it('should return true for entries with same score (ties)', () => {
      const ties = createTiedEntries(3, 500);
      // Assign same rank for ties
      ties.forEach(e => (e.rank = 1));
      expect(isProperlyRanked(ties)).toBe(true);
    });
  });
});
