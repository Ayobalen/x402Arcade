/**
 * Unit tests for PrizePoolService
 *
 * Tests for prize pool management including accumulation,
 * finalization, and payout tracking.
 *
 * @module services/__tests__/prizePool.service.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { PrizePoolService, PRIZE_POOL_PERCENTAGE } from '../prizePool';
import { createTables } from '../../db/schema';

// ============================================================================
// Test Setup
// ============================================================================

let db: Database.Database;
let prizePoolService: PrizePoolService;

beforeEach(() => {
  // Create in-memory database for testing
  db = new Database(':memory:');
  createTables(db);
  prizePoolService = new PrizePoolService(db);
});

afterEach(() => {
  db.close();
});

// ============================================================================
// Helper Method Tests
// ============================================================================

describe('PrizePoolService - Helper Methods', () => {
  describe('getTodayDate', () => {
    it('should return a string', () => {
      // Access private method via reflection for testing
      const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
      const result = getTodayDate();
      expect(typeof result).toBe('string');
    });

    it('should return date in YYYY-MM-DD format', () => {
      const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
      const result = getTodayDate();
      // Test format: YYYY-MM-DD (4 digits, hyphen, 2 digits, hyphen, 2 digits)
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return valid date components', () => {
      const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
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
      const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
      const result = getTodayDate();

      // Compare with UTC date
      const now = new Date();
      const expectedDate = now.toISOString().split('T')[0];

      expect(result).toBe(expectedDate);
    });
  });

  describe('getWeekStart', () => {
    it('should return a string', () => {
      const getWeekStart = (prizePoolService as any).getWeekStart.bind(prizePoolService);
      const result = getWeekStart();
      expect(typeof result).toBe('string');
    });

    it('should return date in YYYY-MM-DD format', () => {
      const getWeekStart = (prizePoolService as any).getWeekStart.bind(prizePoolService);
      const result = getWeekStart();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return a Monday (day 1 of the week)', () => {
      const getWeekStart = (prizePoolService as any).getWeekStart.bind(prizePoolService);
      const result = getWeekStart();

      // Parse the date and check if it's a Monday
      const date = new Date(result + 'T00:00:00Z');
      const dayOfWeek = date.getUTCDay();

      // Monday = 1
      expect(dayOfWeek).toBe(1);
    });

    it('should return a date in the past or today', () => {
      const getWeekStart = (prizePoolService as any).getWeekStart.bind(prizePoolService);
      const result = getWeekStart();

      const weekStart = new Date(result + 'T00:00:00Z');
      const now = new Date();

      // Week start should be <= now
      expect(weekStart.getTime()).toBeLessThanOrEqual(now.getTime());
    });

    it('should return Monday when today is Monday', () => {
      const getWeekStart = (prizePoolService as any).getWeekStart.bind(prizePoolService);
      const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);

      const today = new Date(getTodayDate() + 'T00:00:00Z');

      // Only run this assertion if today is Monday
      if (today.getUTCDay() === 1) {
        const result = getWeekStart();
        expect(result).toBe(getTodayDate());
      }
    });

    it('should handle Sunday correctly (go back 6 days to Monday)', () => {
      const getWeekStart = (prizePoolService as any).getWeekStart.bind(prizePoolService);
      const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);

      const today = new Date(getTodayDate() + 'T00:00:00Z');

      // Only run this assertion if today is Sunday
      if (today.getUTCDay() === 0) {
        const result = getWeekStart();
        const weekStart = new Date(result + 'T00:00:00Z');

        // Should be 6 days before today
        const expectedStart = new Date(today);
        expectedStart.setUTCDate(today.getUTCDate() - 6);

        expect(result).toBe(expectedStart.toISOString().split('T')[0]);
      }
    });
  });
});

// ============================================================================
// addToPrizePool Method Tests
// ============================================================================

describe('PrizePoolService - addToPrizePool', () => {
  it('should create new daily pool when none exists', () => {
    const result = prizePoolService.addToPrizePool({
      gameType: 'snake',
      amountUsdc: 0.01,
    });

    // 70% of $0.01 = $0.007
    expect(result.dailyTotal).toBe(0.007);
  });

  it('should create new weekly pool when none exists', () => {
    const result = prizePoolService.addToPrizePool({
      gameType: 'snake',
      amountUsdc: 0.01,
    });

    // 70% of $0.01 = $0.007
    expect(result.weeklyTotal).toBe(0.007);
  });

  it('should accumulate multiple payments to daily pool', () => {
    // First payment
    prizePoolService.addToPrizePool({
      gameType: 'snake',
      amountUsdc: 0.01,
    });

    // Second payment
    const result = prizePoolService.addToPrizePool({
      gameType: 'snake',
      amountUsdc: 0.01,
    });

    // 2 * (70% of $0.01) = $0.014
    expect(result.dailyTotal).toBe(0.014);
  });

  it('should accumulate multiple payments to weekly pool', () => {
    // First payment
    prizePoolService.addToPrizePool({
      gameType: 'snake',
      amountUsdc: 0.01,
    });

    // Second payment
    const result = prizePoolService.addToPrizePool({
      gameType: 'snake',
      amountUsdc: 0.01,
    });

    // 2 * (70% of $0.01) = $0.014
    expect(result.weeklyTotal).toBe(0.014);
  });

  it('should calculate prize contribution using PRIZE_POOL_PERCENTAGE', () => {
    const paymentAmount = 0.02; // $0.02 payment
    const result = prizePoolService.addToPrizePool({
      gameType: 'tetris',
      amountUsdc: paymentAmount,
    });

    const expectedContribution = paymentAmount * PRIZE_POOL_PERCENTAGE;
    expect(result.dailyTotal).toBe(expectedContribution);
    expect(result.weeklyTotal).toBe(expectedContribution);
  });

  it('should handle different game types separately', () => {
    // Add to snake pool
    prizePoolService.addToPrizePool({
      gameType: 'snake',
      amountUsdc: 0.01,
    });

    // Add to tetris pool
    const tetrisResult = prizePoolService.addToPrizePool({
      gameType: 'tetris',
      amountUsdc: 0.02,
    });

    // Tetris pool should only have its own payment
    expect(tetrisResult.dailyTotal).toBe(0.02 * PRIZE_POOL_PERCENTAGE);
  });

  it('should increment total_games counter on each payment', () => {
    // Add 3 payments
    prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });
    prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });
    prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });

    // Query the daily pool
    const pool = db
      .prepare(
        `
      SELECT total_games FROM prize_pools
      WHERE game_type = 'snake' AND period_type = 'daily'
    `
      )
      .get() as { total_games: number };

    expect(pool.total_games).toBe(3);
  });

  it('should set status to "active" for new pools', () => {
    prizePoolService.addToPrizePool({
      gameType: 'snake',
      amountUsdc: 0.01,
    });

    const dailyPool = db
      .prepare(
        `
      SELECT status FROM prize_pools
      WHERE game_type = 'snake' AND period_type = 'daily'
    `
      )
      .get() as { status: string };

    expect(dailyPool.status).toBe('active');
  });

  it('should use getTodayDate for daily pool period_date', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const expectedDate = getTodayDate();

    prizePoolService.addToPrizePool({
      gameType: 'snake',
      amountUsdc: 0.01,
    });

    const pool = db
      .prepare(
        `
      SELECT period_date FROM prize_pools
      WHERE game_type = 'snake' AND period_type = 'daily'
    `
      )
      .get() as { period_date: string };

    expect(pool.period_date).toBe(expectedDate);
  });

  it('should use getWeekStart for weekly pool period_date', () => {
    const getWeekStart = (prizePoolService as any).getWeekStart.bind(prizePoolService);
    const expectedDate = getWeekStart();

    prizePoolService.addToPrizePool({
      gameType: 'snake',
      amountUsdc: 0.01,
    });

    const pool = db
      .prepare(
        `
      SELECT period_date FROM prize_pools
      WHERE game_type = 'snake' AND period_type = 'weekly'
    `
      )
      .get() as { period_date: string };

    expect(pool.period_date).toBe(expectedDate);
  });

  it('should handle small payment amounts with floating point precision', () => {
    const result = prizePoolService.addToPrizePool({
      gameType: 'snake',
      amountUsdc: 0.01,
    });

    // 0.01 * 0.70 = 0.007
    // Check within floating point tolerance
    expect(result.dailyTotal).toBeCloseTo(0.007, 10);
  });

  it('should handle larger payment amounts correctly', () => {
    const result = prizePoolService.addToPrizePool({
      gameType: 'pong',
      amountUsdc: 1.0,
    });

    // 1.0 * 0.70 = 0.70
    expect(result.dailyTotal).toBe(0.7);
    expect(result.weeklyTotal).toBe(0.7);
  });

  it('should create pools with null winner_address and payout_tx_hash', () => {
    prizePoolService.addToPrizePool({
      gameType: 'snake',
      amountUsdc: 0.01,
    });

    const pool = db
      .prepare(
        `
      SELECT winner_address, payout_tx_hash FROM prize_pools
      WHERE game_type = 'snake' AND period_type = 'daily'
    `
      )
      .get() as { winner_address: string | null; payout_tx_hash: string | null };

    expect(pool.winner_address).toBeNull();
    expect(pool.payout_tx_hash).toBeNull();
  });

  it('should handle multiple game types independently in daily pools', () => {
    prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });
    prizePoolService.addToPrizePool({ gameType: 'tetris', amountUsdc: 0.02 });
    prizePoolService.addToPrizePool({ gameType: 'pong', amountUsdc: 0.015 });

    const pools = db
      .prepare(`SELECT game_type, total_amount_usdc FROM prize_pools WHERE period_type = 'daily'`)
      .all() as Array<{
      game_type: string;
      total_amount_usdc: number;
    }>;

    expect(pools).toHaveLength(3);
    expect(pools.find((p) => p.game_type === 'snake')?.total_amount_usdc).toBeCloseTo(0.007, 10);
    expect(pools.find((p) => p.game_type === 'tetris')?.total_amount_usdc).toBeCloseTo(0.014, 10);
    expect(pools.find((p) => p.game_type === 'pong')?.total_amount_usdc).toBeCloseTo(0.0105, 10);
  });
});

// ============================================================================
// getCurrentPool Method Tests
// ============================================================================

describe('PrizePoolService - getCurrentPool', () => {
  it('should return null when no pool exists for the period', () => {
    const result = prizePoolService.getCurrentPool({
      gameType: 'snake',
      periodType: 'daily',
    });

    expect(result).toBeNull();
  });

  it('should return daily pool after it is created', () => {
    // Create a pool
    prizePoolService.addToPrizePool({
      gameType: 'snake',
      amountUsdc: 0.01,
    });

    // Retrieve it
    const result = prizePoolService.getCurrentPool({
      gameType: 'snake',
      periodType: 'daily',
    });

    expect(result).not.toBeNull();
    expect(result?.gameType).toBe('snake');
    expect(result?.periodType).toBe('daily');
  });

  it('should return weekly pool after it is created', () => {
    // Create a pool
    prizePoolService.addToPrizePool({
      gameType: 'tetris',
      amountUsdc: 0.02,
    });

    // Retrieve it
    const result = prizePoolService.getCurrentPool({
      gameType: 'tetris',
      periodType: 'weekly',
    });

    expect(result).not.toBeNull();
    expect(result?.gameType).toBe('tetris');
    expect(result?.periodType).toBe('weekly');
  });

  it('should return correct total amount', () => {
    // Add $0.01 * 3 = $0.03, so prize pool gets $0.021
    prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });
    prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });
    prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });

    const result = prizePoolService.getCurrentPool({
      gameType: 'snake',
      periodType: 'daily',
    });

    expect(result?.totalAmountUsdc).toBeCloseTo(0.021, 10);
  });

  it('should return correct total games count', () => {
    prizePoolService.addToPrizePool({ gameType: 'pong', amountUsdc: 0.01 });
    prizePoolService.addToPrizePool({ gameType: 'pong', amountUsdc: 0.01 });
    prizePoolService.addToPrizePool({ gameType: 'pong', amountUsdc: 0.01 });
    prizePoolService.addToPrizePool({ gameType: 'pong', amountUsdc: 0.01 });

    const result = prizePoolService.getCurrentPool({
      gameType: 'pong',
      periodType: 'daily',
    });

    expect(result?.totalGames).toBe(4);
  });

  it('should return status as "active" for new pools', () => {
    prizePoolService.addToPrizePool({
      gameType: 'snake',
      amountUsdc: 0.01,
    });

    const result = prizePoolService.getCurrentPool({
      gameType: 'snake',
      periodType: 'daily',
    });

    expect(result?.status).toBe('active');
  });

  it('should return null winner_address for active pools', () => {
    prizePoolService.addToPrizePool({
      gameType: 'breakout',
      amountUsdc: 0.01,
    });

    const result = prizePoolService.getCurrentPool({
      gameType: 'breakout',
      periodType: 'daily',
    });

    expect(result?.winnerAddress).toBeNull();
  });

  it('should return null payout_tx_hash for active pools', () => {
    prizePoolService.addToPrizePool({
      gameType: 'space_invaders',
      amountUsdc: 0.01,
    });

    const result = prizePoolService.getCurrentPool({
      gameType: 'space_invaders',
      periodType: 'daily',
    });

    expect(result?.payoutTxHash).toBeNull();
  });

  it('should use getTodayDate for daily period calculation', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const expectedDate = getTodayDate();

    prizePoolService.addToPrizePool({
      gameType: 'snake',
      amountUsdc: 0.01,
    });

    const result = prizePoolService.getCurrentPool({
      gameType: 'snake',
      periodType: 'daily',
    });

    expect(result?.periodDate).toBe(expectedDate);
  });

  it('should use getWeekStart for weekly period calculation', () => {
    const getWeekStart = (prizePoolService as any).getWeekStart.bind(prizePoolService);
    const expectedDate = getWeekStart();

    prizePoolService.addToPrizePool({
      gameType: 'tetris',
      amountUsdc: 0.02,
    });

    const result = prizePoolService.getCurrentPool({
      gameType: 'tetris',
      periodType: 'weekly',
    });

    expect(result?.periodDate).toBe(expectedDate);
  });

  it('should not return pools from different game types', () => {
    // Create snake pool
    prizePoolService.addToPrizePool({
      gameType: 'snake',
      amountUsdc: 0.01,
    });

    // Try to get tetris pool
    const result = prizePoolService.getCurrentPool({
      gameType: 'tetris',
      periodType: 'daily',
    });

    expect(result).toBeNull();
  });

  it('should return pool with auto-generated id', () => {
    prizePoolService.addToPrizePool({
      gameType: 'pong',
      amountUsdc: 0.015,
    });

    const result = prizePoolService.getCurrentPool({
      gameType: 'pong',
      periodType: 'daily',
    });

    expect(result?.id).toBeGreaterThan(0);
  });

  it('should return pool with createdAt timestamp', () => {
    prizePoolService.addToPrizePool({
      gameType: 'snake',
      amountUsdc: 0.01,
    });

    const result = prizePoolService.getCurrentPool({
      gameType: 'snake',
      periodType: 'daily',
    });

    expect(result?.createdAt).toBeTruthy();
    expect(typeof result?.createdAt).toBe('string');
  });

  it('should return null finalizedAt for active pools', () => {
    prizePoolService.addToPrizePool({
      gameType: 'breakout',
      amountUsdc: 0.01,
    });

    const result = prizePoolService.getCurrentPool({
      gameType: 'breakout',
      periodType: 'weekly',
    });

    expect(result?.finalizedAt).toBeNull();
  });

  it('should map all database columns to PrizePool interface', () => {
    prizePoolService.addToPrizePool({
      gameType: 'space_invaders',
      amountUsdc: 0.025,
    });

    const result = prizePoolService.getCurrentPool({
      gameType: 'space_invaders',
      periodType: 'daily',
    });

    // Verify all PrizePool interface fields are present
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('gameType');
    expect(result).toHaveProperty('periodType');
    expect(result).toHaveProperty('periodDate');
    expect(result).toHaveProperty('totalAmountUsdc');
    expect(result).toHaveProperty('totalGames');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('winnerAddress');
    expect(result).toHaveProperty('payoutTxHash');
    expect(result).toHaveProperty('createdAt');
    expect(result).toHaveProperty('finalizedAt');
  });
});

// ============================================================================
// calculatePrizeAmount Method Tests
// ============================================================================

describe('PrizePoolService - calculatePrizeAmount', () => {
  it('should throw error if neither poolId nor pool is provided', () => {
    expect(() => {
      prizePoolService.calculatePrizeAmount({});
    }).toThrow('Either poolId or pool must be provided');
  });

  it('should throw error if pool does not exist', () => {
    expect(() => {
      prizePoolService.calculatePrizeAmount({ poolId: 999 });
    }).toThrow('Prize pool not found: 999');
  });

  it('should calculate payout amount using poolId', () => {
    // Create a pool with known amount
    prizePoolService.addToPrizePool({
      gameType: 'snake',
      amountUsdc: 0.01,
    });

    const pool = prizePoolService.getCurrentPool({
      gameType: 'snake',
      periodType: 'daily',
    });

    const amount = prizePoolService.calculatePrizeAmount({ poolId: pool!.id });

    // Should return full pool amount (70% of $0.01 = $0.007)
    expect(amount).toBeCloseTo(0.007, 10);
  });

  it('should calculate payout amount using pool object', () => {
    // Create a pool
    prizePoolService.addToPrizePool({
      gameType: 'tetris',
      amountUsdc: 0.02,
    });

    const pool = prizePoolService.getCurrentPool({
      gameType: 'tetris',
      periodType: 'daily',
    });

    const amount = prizePoolService.calculatePrizeAmount({ pool: pool! });

    // Should return full pool amount (70% of $0.02 = $0.014)
    expect(amount).toBeCloseTo(0.014, 10);
  });

  it('should return full pool amount with no additional fees', () => {
    // Add multiple payments to accumulate a larger pool
    prizePoolService.addToPrizePool({ gameType: 'pong', amountUsdc: 0.01 });
    prizePoolService.addToPrizePool({ gameType: 'pong', amountUsdc: 0.01 });
    prizePoolService.addToPrizePool({ gameType: 'pong', amountUsdc: 0.01 });
    prizePoolService.addToPrizePool({ gameType: 'pong', amountUsdc: 0.01 });
    prizePoolService.addToPrizePool({ gameType: 'pong', amountUsdc: 0.01 });

    const pool = prizePoolService.getCurrentPool({
      gameType: 'pong',
      periodType: 'daily',
    });

    const amount = prizePoolService.calculatePrizeAmount({ poolId: pool!.id });

    // Should return full pool amount (5 * 70% of $0.01 = $0.035)
    expect(amount).toBeCloseTo(0.035, 10);
  });

  it('should handle pools with zero amount', () => {
    // Manually create a pool with zero amount (edge case)
    db.prepare(
      `INSERT INTO prize_pools (game_type, period_type, period_date, total_amount_usdc, total_games, status)
       VALUES ('snake', 'daily', '2026-01-01', 0, 0, 'active')`
    ).run();

    const pool = db
      .prepare(
        `SELECT id, game_type as gameType, period_type as periodType, period_date as periodDate,
                total_amount_usdc as totalAmountUsdc, total_games as totalGames, status,
                winner_address as winnerAddress, payout_tx_hash as payoutTxHash,
                created_at as createdAt, finalized_at as finalizedAt
         FROM prize_pools WHERE game_type = 'snake' AND period_date = '2026-01-01'`
      )
      .get() as PrizePool;

    const amount = prizePoolService.calculatePrizeAmount({ pool });

    expect(amount).toBe(0);
  });

  it('should handle pools with large amounts', () => {
    // Create a pool with a large payment
    prizePoolService.addToPrizePool({
      gameType: 'breakout',
      amountUsdc: 100.0,
    });

    const pool = prizePoolService.getCurrentPool({
      gameType: 'breakout',
      periodType: 'daily',
    });

    const amount = prizePoolService.calculatePrizeAmount({ poolId: pool!.id });

    // Should return full pool amount (70% of $100 = $70)
    expect(amount).toBe(70.0);
  });

  it('should work with finalized pools', () => {
    // Create a pool
    prizePoolService.addToPrizePool({
      gameType: 'space_invaders',
      amountUsdc: 0.015,
    });

    // Add a leaderboard entry so we can finalize
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    db.prepare(
      `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
       VALUES ('session-1', 'space_invaders', '0xPlayer1', 100, 'daily', ?)`
    ).run(getTodayDate());

    // Finalize the pool
    const finalizedPool = prizePoolService.finalizePool({
      gameType: 'space_invaders',
      periodType: 'daily',
      periodDate: getTodayDate(),
    });

    const amount = prizePoolService.calculatePrizeAmount({ pool: finalizedPool! });

    // Should still return full pool amount
    expect(amount).toBeCloseTo(0.0105, 10);
  });

  it('should work with paid pools', () => {
    // Create and finalize a pool
    prizePoolService.addToPrizePool({
      gameType: 'tetris',
      amountUsdc: 0.02,
    });

    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    db.prepare(
      `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
       VALUES ('session-2', 'tetris', '0xWinner', 200, 'daily', ?)`
    ).run(getTodayDate());

    const finalizedPool = prizePoolService.finalizePool({
      gameType: 'tetris',
      periodType: 'daily',
      periodDate: getTodayDate(),
    });

    // Record payout
    const paidPool = prizePoolService.recordPayout({
      poolId: finalizedPool!.id,
      payoutTxHash: '0xabcdef123456',
    });

    const amount = prizePoolService.calculatePrizeAmount({ pool: paidPool! });

    // Should still return full pool amount even after payout
    expect(amount).toBeCloseTo(0.014, 10);
  });

  it('should handle weekly pools', () => {
    prizePoolService.addToPrizePool({
      gameType: 'pong',
      amountUsdc: 0.05,
    });

    const pool = prizePoolService.getCurrentPool({
      gameType: 'pong',
      periodType: 'weekly',
    });

    const amount = prizePoolService.calculatePrizeAmount({ poolId: pool!.id });

    // Should return full pool amount (70% of $0.05 = $0.035)
    expect(amount).toBeCloseTo(0.035, 10);
  });

  it('should handle pools with fractional cents', () => {
    // Test floating point precision
    prizePoolService.addToPrizePool({
      gameType: 'snake',
      amountUsdc: 0.013, // Results in 0.0091 in pool
    });

    const pool = prizePoolService.getCurrentPool({
      gameType: 'snake',
      periodType: 'daily',
    });

    const amount = prizePoolService.calculatePrizeAmount({ pool: pool! });

    expect(amount).toBeCloseTo(0.0091, 10);
  });

  it('should prefer provided pool object over poolId', () => {
    // Create two pools
    prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });
    prizePoolService.addToPrizePool({ gameType: 'tetris', amountUsdc: 0.02 });

    const snakePool = prizePoolService.getCurrentPool({
      gameType: 'snake',
      periodType: 'daily',
    });
    const tetrisPool = prizePoolService.getCurrentPool({
      gameType: 'tetris',
      periodType: 'daily',
    });

    // Provide both poolId and pool, should use pool object
    const amount = prizePoolService.calculatePrizeAmount({
      poolId: snakePool!.id,
      pool: tetrisPool!,
    });

    // Should use tetris pool amount (70% of $0.02 = $0.014)
    expect(amount).toBeCloseTo(0.014, 10);
  });

  it('should return exact pool total for integer USDC amounts', () => {
    prizePoolService.addToPrizePool({
      gameType: 'breakout',
      amountUsdc: 10.0,
    });

    const pool = prizePoolService.getCurrentPool({
      gameType: 'breakout',
      periodType: 'daily',
    });

    const amount = prizePoolService.calculatePrizeAmount({ poolId: pool!.id });

    // Should return exactly 70% of $10 = $7.00
    expect(amount).toBe(7.0);
  });

  it('should handle accumulated pools correctly', () => {
    // Simulate a busy day with many players
    for (let i = 0; i < 100; i++) {
      prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });
    }

    const pool = prizePoolService.getCurrentPool({
      gameType: 'snake',
      periodType: 'daily',
    });

    const amount = prizePoolService.calculatePrizeAmount({ pool: pool! });

    // Should return 100 * (70% of $0.01) = $0.70
    expect(amount).toBeCloseTo(0.7, 10);
  });
});
