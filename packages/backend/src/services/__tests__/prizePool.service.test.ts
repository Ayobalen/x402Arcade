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
import { PrizePoolService, PRIZE_POOL_PERCENTAGE, type PrizePool } from '../prizePool';
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

// ============================================================================
// getTopContributor Method Tests
// ============================================================================

describe('PrizePoolService - getTopContributor', () => {
  it('should return null when no players for the period', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const result = prizePoolService.getTopContributor({
      gameType: 'snake',
      periodType: 'daily',
      periodDate: getTodayDate(),
    });

    expect(result).toBeNull();
  });

  it('should return top contributor for daily period', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    // Insert game sessions for multiple players
    db.prepare(
      `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc, status, created_at, completed_at)
       VALUES
         ('session-1', 'snake', '0xplayer1', '0xtx1', 0.01, 'completed', ?, datetime('now')),
         ('session-2', 'snake', '0xplayer2', '0xtx2', 0.02, 'completed', ?, datetime('now')),
         ('session-3', 'snake', '0xplayer1', '0xtx3', 0.01, 'completed', ?, datetime('now'))`
    ).run(today + 'T12:00:00', today + 'T12:05:00', today + 'T12:10:00');

    const result = prizePoolService.getTopContributor({
      gameType: 'snake',
      periodType: 'daily',
      periodDate: today,
    });

    // Player2 contributed $0.02, Player1 contributed $0.02 total (2 games * $0.01)
    // It's a tie, but Player2 should win because they appear first in DESC order
    expect(result).not.toBeNull();
    expect(result?.totalContribution).toBeCloseTo(0.02, 10);
    expect(['0xplayer1', '0xplayer2']).toContain(result?.playerAddress);
  });

  it('should aggregate multiple games from the same player', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    // Insert 5 games from one player
    db.prepare(
      `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc, status, created_at, completed_at)
       VALUES
         ('s1', 'tetris', '0xwhale', '0xt1', 0.02, 'completed', ?, datetime('now')),
         ('s2', 'tetris', '0xwhale', '0xt2', 0.02, 'completed', ?, datetime('now')),
         ('s3', 'tetris', '0xwhale', '0xt3', 0.02, 'completed', ?, datetime('now')),
         ('s4', 'tetris', '0xwhale', '0xt4', 0.02, 'completed', ?, datetime('now')),
         ('s5', 'tetris', '0xwhale', '0xt5', 0.02, 'completed', ?, datetime('now'))`
    ).run(
      today + 'T10:00:00',
      today + 'T10:05:00',
      today + 'T10:10:00',
      today + 'T10:15:00',
      today + 'T10:20:00'
    );

    const result = prizePoolService.getTopContributor({
      gameType: 'tetris',
      periodType: 'daily',
      periodDate: today,
    });

    expect(result).not.toBeNull();
    expect(result?.playerAddress).toBe('0xwhale');
    expect(result?.totalContribution).toBeCloseTo(0.1, 10); // 5 * $0.02
    expect(result?.gamesPlayed).toBe(5);
  });

  it('should count games played correctly', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    db.prepare(
      `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc, status, created_at, completed_at)
       VALUES
         ('g1', 'pong', '0xtopplayer', '0xa1', 0.015, 'completed', ?, datetime('now')),
         ('g2', 'pong', '0xtopplayer', '0xa2', 0.015, 'completed', ?, datetime('now')),
         ('g3', 'pong', '0xtopplayer', '0xa3', 0.015, 'completed', ?, datetime('now'))`
    ).run(today + 'T14:00:00', today + 'T14:10:00', today + 'T14:20:00');

    const result = prizePoolService.getTopContributor({
      gameType: 'pong',
      periodType: 'daily',
      periodDate: today,
    });

    expect(result?.gamesPlayed).toBe(3);
  });

  it('should only include completed sessions', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    // Mix of completed and active sessions
    db.prepare(
      `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc, status, created_at, completed_at)
       VALUES
         ('c1', 'snake', '0xuser1', '0xh1', 0.01, 'completed', ?, datetime('now')),
         ('c2', 'snake', '0xuser1', '0xh2', 0.01, 'completed', ?, datetime('now')),
         ('a1', 'snake', '0xuser1', '0xh3', 0.01, 'active', ?, NULL)`
    ).run(today + 'T09:00:00', today + 'T09:05:00', today + 'T09:10:00');

    const result = prizePoolService.getTopContributor({
      gameType: 'snake',
      periodType: 'daily',
      periodDate: today,
    });

    // Should only count the 2 completed games
    expect(result?.totalContribution).toBeCloseTo(0.02, 10);
    expect(result?.gamesPlayed).toBe(2);
  });

  it('should filter by game type correctly', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    // Sessions for different game types
    db.prepare(
      `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc, status, created_at, completed_at)
       VALUES
         ('sn1', 'snake', '0xmixed', '0xm1', 0.01, 'completed', ?, datetime('now')),
         ('te1', 'tetris', '0xmixed', '0xm2', 0.02, 'completed', ?, datetime('now')),
         ('po1', 'pong', '0xmixed', '0xm3', 0.015, 'completed', ?, datetime('now'))`
    ).run(today + 'T11:00:00', today + 'T11:05:00', today + 'T11:10:00');

    const snakeResult = prizePoolService.getTopContributor({
      gameType: 'snake',
      periodType: 'daily',
      periodDate: today,
    });

    const tetrisResult = prizePoolService.getTopContributor({
      gameType: 'tetris',
      periodType: 'daily',
      periodDate: today,
    });

    expect(snakeResult?.totalContribution).toBeCloseTo(0.01, 10);
    expect(tetrisResult?.totalContribution).toBeCloseTo(0.02, 10);
  });

  it('should work with weekly periods', () => {
    const getWeekStart = (prizePoolService as any).getWeekStart.bind(prizePoolService);
    const weekStart = getWeekStart();

    // Calculate a date within the week (e.g., Wednesday)
    const wednesday = new Date(weekStart + 'T00:00:00Z');
    wednesday.setUTCDate(wednesday.getUTCDate() + 2);
    const wednesdayStr = wednesday.toISOString().split('T')[0];

    db.prepare(
      `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc, status, created_at, completed_at)
       VALUES
         ('w1', 'breakout', '0xweekly', '0xw1', 0.01, 'completed', ?, datetime('now')),
         ('w2', 'breakout', '0xweekly', '0xw2', 0.01, 'completed', ?, datetime('now'))`
    ).run(weekStart + 'T10:00:00', wednesdayStr + 'T15:00:00');

    const result = prizePoolService.getTopContributor({
      gameType: 'breakout',
      periodType: 'weekly',
      periodDate: weekStart,
    });

    expect(result).not.toBeNull();
    expect(result?.playerAddress).toBe('0xweekly');
    expect(result?.totalContribution).toBeCloseTo(0.02, 10);
    expect(result?.gamesPlayed).toBe(2);
  });

  it('should not include sessions from different periods', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    // Calculate yesterday
    const yesterday = new Date(today + 'T00:00:00Z');
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Sessions from today and yesterday
    db.prepare(
      `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc, status, created_at, completed_at)
       VALUES
         ('t1', 'snake', '0xtime', '0xt1', 0.01, 'completed', ?, datetime('now')),
         ('y1', 'snake', '0xtime', '0xt2', 0.01, 'completed', ?, datetime('now'))`
    ).run(today + 'T12:00:00', yesterdayStr + 'T12:00:00');

    const todayResult = prizePoolService.getTopContributor({
      gameType: 'snake',
      periodType: 'daily',
      periodDate: today,
    });

    // Should only count today's session
    expect(todayResult?.totalContribution).toBeCloseTo(0.01, 10);
    expect(todayResult?.gamesPlayed).toBe(1);
  });

  it('should handle multiple players and return highest contributor', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    db.prepare(
      `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc, status, created_at, completed_at)
       VALUES
         ('p1', 'space_invaders', '0xlow', '0xp1', 0.01, 'completed', ?, datetime('now')),
         ('p2', 'space_invaders', '0xmed', '0xp2', 0.02, 'completed', ?, datetime('now')),
         ('p3', 'space_invaders', '0xmed', '0xp3', 0.02, 'completed', ?, datetime('now')),
         ('p4', 'space_invaders', '0xhigh', '0xp4', 0.03, 'completed', ?, datetime('now')),
         ('p5', 'space_invaders', '0xhigh', '0xp5', 0.03, 'completed', ?, datetime('now')),
         ('p6', 'space_invaders', '0xhigh', '0xp6', 0.03, 'completed', ?, datetime('now'))`
    ).run(
      today + 'T08:00:00',
      today + 'T08:05:00',
      today + 'T08:10:00',
      today + 'T08:15:00',
      today + 'T08:20:00',
      today + 'T08:25:00'
    );

    const result = prizePoolService.getTopContributor({
      gameType: 'space_invaders',
      periodType: 'daily',
      periodDate: today,
    });

    // 0xhigh should win with 3 * $0.03 = $0.09
    expect(result?.playerAddress).toBe('0xhigh');
    expect(result?.totalContribution).toBeCloseTo(0.09, 10);
    expect(result?.gamesPlayed).toBe(3);
  });

  it('should handle fractional USDC amounts correctly', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    db.prepare(
      `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc, status, created_at, completed_at)
       VALUES
         ('f1', 'tetris', '0xfrac', '0xf1', 0.013, 'completed', ?, datetime('now')),
         ('f2', 'tetris', '0xfrac', '0xf2', 0.017, 'completed', ?, datetime('now')),
         ('f3', 'tetris', '0xfrac', '0xf3', 0.021, 'completed', ?, datetime('now'))`
    ).run(today + 'T16:00:00', today + 'T16:05:00', today + 'T16:10:00');

    const result = prizePoolService.getTopContributor({
      gameType: 'tetris',
      periodType: 'daily',
      periodDate: today,
    });

    // 0.013 + 0.017 + 0.021 = 0.051
    expect(result?.totalContribution).toBeCloseTo(0.051, 10);
  });

  it('should handle large contribution amounts', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    db.prepare(
      `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc, status, created_at, completed_at)
       VALUES
         ('b1', 'pong', '0xbig', '0xb1', 10.0, 'completed', ?, datetime('now')),
         ('b2', 'pong', '0xbig', '0xb2', 10.0, 'completed', ?, datetime('now'))`
    ).run(today + 'T20:00:00', today + 'T20:05:00');

    const result = prizePoolService.getTopContributor({
      gameType: 'pong',
      periodType: 'daily',
      periodDate: today,
    });

    expect(result?.totalContribution).toBe(20.0);
  });

  it('should return null for future dates with no data', () => {
    // Use a future date
    const futureDate = '2099-12-31';

    const result = prizePoolService.getTopContributor({
      gameType: 'snake',
      periodType: 'daily',
      periodDate: futureDate,
    });

    expect(result).toBeNull();
  });

  it('should return null for past dates with no data', () => {
    const pastDate = '2020-01-01';

    const result = prizePoolService.getTopContributor({
      gameType: 'tetris',
      periodType: 'daily',
      periodDate: pastDate,
    });

    expect(result).toBeNull();
  });

  it('should handle edge case of single game played', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    db.prepare(
      `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc, status, created_at, completed_at)
       VALUES ('solo', 'breakout', '0xsolo', '0xsolo1', 0.01, 'completed', ?, datetime('now'))`
    ).run(today + 'T13:00:00');

    const result = prizePoolService.getTopContributor({
      gameType: 'breakout',
      periodType: 'daily',
      periodDate: today,
    });

    expect(result).not.toBeNull();
    expect(result?.playerAddress).toBe('0xsolo');
    expect(result?.totalContribution).toBeCloseTo(0.01, 10);
    expect(result?.gamesPlayed).toBe(1);
  });
});

// ============================================================================
// getDailyStats Method Tests
// ============================================================================

describe('PrizePoolService - getDailyStats', () => {
  it('should return zero stats when no pools exist', () => {
    const result = prizePoolService.getDailyStats();

    expect(result.totalGames).toBe(0);
    expect(result.totalPrizePoolUsdc).toBe(0);
    expect(result.activeGames).toBe(0);
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should default to today if no date provided', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const expectedDate = getTodayDate();

    const result = prizePoolService.getDailyStats();

    expect(result.date).toBe(expectedDate);
  });

  it('should aggregate stats from a single game type', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    // Add games to snake pool
    prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });
    prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });
    prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });

    const result = prizePoolService.getDailyStats({ date: today });

    expect(result.totalGames).toBe(3);
    expect(result.totalPrizePoolUsdc).toBeCloseTo(0.021, 10); // 3 * (70% of $0.01)
    expect(result.activeGames).toBe(1);
  });

  it('should aggregate stats from multiple game types', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    // Add games to different pools
    prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });
    prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });
    prizePoolService.addToPrizePool({ gameType: 'tetris', amountUsdc: 0.02 });
    prizePoolService.addToPrizePool({ gameType: 'pong', amountUsdc: 0.015 });

    const result = prizePoolService.getDailyStats({ date: today });

    expect(result.totalGames).toBe(4);
    // (2 * 0.007) + 0.014 + 0.0105 = 0.0385
    expect(result.totalPrizePoolUsdc).toBeCloseTo(0.0385, 10);
    expect(result.activeGames).toBe(3);
  });

  it('should not include gameBreakdown by default', () => {
    prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });

    const result = prizePoolService.getDailyStats();

    expect(result.gameBreakdown).toBeUndefined();
  });

  it('should include gameBreakdown when requested', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });
    prizePoolService.addToPrizePool({ gameType: 'tetris', amountUsdc: 0.02 });

    const result = prizePoolService.getDailyStats({ date: today, includeBreakdown: true });

    expect(result.gameBreakdown).toBeDefined();
    expect(result.gameBreakdown).toHaveLength(2);
  });

  it('should have correct per-game breakdown values', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });
    prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });
    prizePoolService.addToPrizePool({ gameType: 'tetris', amountUsdc: 0.02 });

    const result = prizePoolService.getDailyStats({ date: today, includeBreakdown: true });

    const snakeBreakdown = result.gameBreakdown?.find((g) => g.gameType === 'snake');
    const tetrisBreakdown = result.gameBreakdown?.find((g) => g.gameType === 'tetris');

    expect(snakeBreakdown?.totalGames).toBe(2);
    expect(snakeBreakdown?.totalPrizePoolUsdc).toBeCloseTo(0.014, 10);
    expect(tetrisBreakdown?.totalGames).toBe(1);
    expect(tetrisBreakdown?.totalPrizePoolUsdc).toBeCloseTo(0.014, 10);
  });

  it('should only include daily pools, not weekly', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    // Add games (creates both daily and weekly pools)
    prizePoolService.addToPrizePool({ gameType: 'pong', amountUsdc: 0.015 });

    const result = prizePoolService.getDailyStats({ date: today });

    // Should only count the daily pool, not weekly
    expect(result.totalGames).toBe(1);
    expect(result.totalPrizePoolUsdc).toBeCloseTo(0.0105, 10);
  });

  it('should work with a specific date parameter', () => {
    const specificDate = '2026-01-20';

    // Manually create a pool for a specific date
    db.prepare(
      `INSERT INTO prize_pools (game_type, period_type, period_date, total_amount_usdc, total_games, status)
       VALUES ('snake', 'daily', ?, 0.05, 5, 'active')`
    ).run(specificDate);

    const result = prizePoolService.getDailyStats({ date: specificDate });

    expect(result.date).toBe(specificDate);
    expect(result.totalGames).toBe(5);
    expect(result.totalPrizePoolUsdc).toBeCloseTo(0.05, 10);
  });

  it('should handle multiple games of same type correctly', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    // Add 10 games to the same pool
    for (let i = 0; i < 10; i++) {
      prizePoolService.addToPrizePool({ gameType: 'breakout', amountUsdc: 0.01 });
    }

    const result = prizePoolService.getDailyStats({ date: today });

    expect(result.totalGames).toBe(10);
    expect(result.totalPrizePoolUsdc).toBeCloseTo(0.07, 10); // 10 * 0.007
    expect(result.activeGames).toBe(1);
  });

  it('should handle all five game types', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    // Add one game for each type
    prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });
    prizePoolService.addToPrizePool({ gameType: 'tetris', amountUsdc: 0.02 });
    prizePoolService.addToPrizePool({ gameType: 'pong', amountUsdc: 0.015 });
    prizePoolService.addToPrizePool({ gameType: 'breakout', amountUsdc: 0.01 });
    prizePoolService.addToPrizePool({ gameType: 'space_invaders', amountUsdc: 0.025 });

    const result = prizePoolService.getDailyStats({ date: today, includeBreakdown: true });

    expect(result.activeGames).toBe(5);
    expect(result.gameBreakdown).toHaveLength(5);
    expect(result.totalGames).toBe(5);
  });

  it('should handle large numbers correctly', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    // Simulate a busy day
    for (let i = 0; i < 100; i++) {
      prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });
    }

    const result = prizePoolService.getDailyStats({ date: today });

    expect(result.totalGames).toBe(100);
    expect(result.totalPrizePoolUsdc).toBeCloseTo(0.7, 10); // 100 * 0.007
  });

  it('should handle fractional USDC amounts correctly', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    prizePoolService.addToPrizePool({ gameType: 'tetris', amountUsdc: 0.013 });
    prizePoolService.addToPrizePool({ gameType: 'tetris', amountUsdc: 0.017 });

    const result = prizePoolService.getDailyStats({ date: today });

    // (0.013 + 0.017) * 0.7 = 0.021
    expect(result.totalPrizePoolUsdc).toBeCloseTo(0.021, 10);
  });

  it('should return zero stats for future dates', () => {
    const futureDate = '2099-12-31';

    const result = prizePoolService.getDailyStats({ date: futureDate });

    expect(result.date).toBe(futureDate);
    expect(result.totalGames).toBe(0);
    expect(result.totalPrizePoolUsdc).toBe(0);
    expect(result.activeGames).toBe(0);
  });

  it('should return zero stats for past dates with no data', () => {
    const pastDate = '2020-01-01';

    const result = prizePoolService.getDailyStats({ date: pastDate });

    expect(result.date).toBe(pastDate);
    expect(result.totalGames).toBe(0);
    expect(result.totalPrizePoolUsdc).toBe(0);
    expect(result.activeGames).toBe(0);
  });

  it('should have correct structure with includeBreakdown=false', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    prizePoolService.addToPrizePool({ gameType: 'pong', amountUsdc: 0.015 });

    const result = prizePoolService.getDailyStats({ date: today, includeBreakdown: false });

    expect(result).toHaveProperty('date');
    expect(result).toHaveProperty('totalGames');
    expect(result).toHaveProperty('totalPrizePoolUsdc');
    expect(result).toHaveProperty('activeGames');
    expect(result).not.toHaveProperty('gameBreakdown');
  });

  it('should have correct structure with includeBreakdown=true', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    prizePoolService.addToPrizePool({ gameType: 'space_invaders', amountUsdc: 0.025 });

    const result = prizePoolService.getDailyStats({ date: today, includeBreakdown: true });

    expect(result).toHaveProperty('date');
    expect(result).toHaveProperty('totalGames');
    expect(result).toHaveProperty('totalPrizePoolUsdc');
    expect(result).toHaveProperty('activeGames');
    expect(result).toHaveProperty('gameBreakdown');
    expect(Array.isArray(result.gameBreakdown)).toBe(true);
  });
});

// ============================================================================
// getWeeklyStats Method Tests
// ============================================================================

describe('PrizePoolService - getWeeklyStats', () => {
  it('should return zero stats when no pools exist', () => {
    const result = prizePoolService.getWeeklyStats();

    expect(result.totalGames).toBe(0);
    expect(result.totalPrizePoolUsdc).toBe(0);
    expect(result.activeGames).toBe(0);
    expect(result.weekStart).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should default to current week if no weekStart provided', () => {
    const getWeekStart = (prizePoolService as any).getWeekStart.bind(prizePoolService);
    const expectedWeekStart = getWeekStart();

    const result = prizePoolService.getWeeklyStats();

    expect(result.weekStart).toBe(expectedWeekStart);
  });

  it('should aggregate stats from a single game type', () => {
    const getWeekStart = (prizePoolService as any).getWeekStart.bind(prizePoolService);
    const weekStart = getWeekStart();

    // Add games to snake pool (creates both daily and weekly pools)
    prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });
    prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });
    prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });

    const result = prizePoolService.getWeeklyStats({ weekStart });

    expect(result.totalGames).toBe(3);
    expect(result.totalPrizePoolUsdc).toBeCloseTo(0.021, 10); // 3 * (70% of $0.01)
    expect(result.activeGames).toBe(1);
  });

  it('should aggregate stats from multiple game types', () => {
    const getWeekStart = (prizePoolService as any).getWeekStart.bind(prizePoolService);
    const weekStart = getWeekStart();

    // Add games to different pools
    prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });
    prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });
    prizePoolService.addToPrizePool({ gameType: 'tetris', amountUsdc: 0.02 });
    prizePoolService.addToPrizePool({ gameType: 'pong', amountUsdc: 0.015 });

    const result = prizePoolService.getWeeklyStats({ weekStart });

    expect(result.totalGames).toBe(4);
    // (2 * 0.007) + 0.014 + 0.0105 = 0.0385
    expect(result.totalPrizePoolUsdc).toBeCloseTo(0.0385, 10);
    expect(result.activeGames).toBe(3);
  });

  it('should not include gameBreakdown by default', () => {
    prizePoolService.addToPrizePool({ gameType: 'breakout', amountUsdc: 0.01 });

    const result = prizePoolService.getWeeklyStats();

    expect(result.gameBreakdown).toBeUndefined();
  });

  it('should include gameBreakdown when requested', () => {
    const getWeekStart = (prizePoolService as any).getWeekStart.bind(prizePoolService);
    const weekStart = getWeekStart();

    prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });
    prizePoolService.addToPrizePool({ gameType: 'tetris', amountUsdc: 0.02 });

    const result = prizePoolService.getWeeklyStats({ weekStart, includeBreakdown: true });

    expect(result.gameBreakdown).toBeDefined();
    expect(result.gameBreakdown).toHaveLength(2);
  });

  it('should have correct per-game breakdown values', () => {
    const getWeekStart = (prizePoolService as any).getWeekStart.bind(prizePoolService);
    const weekStart = getWeekStart();

    prizePoolService.addToPrizePool({ gameType: 'pong', amountUsdc: 0.015 });
    prizePoolService.addToPrizePool({ gameType: 'pong', amountUsdc: 0.015 });
    prizePoolService.addToPrizePool({ gameType: 'space_invaders', amountUsdc: 0.025 });

    const result = prizePoolService.getWeeklyStats({ weekStart, includeBreakdown: true });

    const pongBreakdown = result.gameBreakdown?.find((g) => g.gameType === 'pong');
    const siBreakdown = result.gameBreakdown?.find((g) => g.gameType === 'space_invaders');

    expect(pongBreakdown?.totalGames).toBe(2);
    expect(pongBreakdown?.totalPrizePoolUsdc).toBeCloseTo(0.021, 10);
    expect(siBreakdown?.totalGames).toBe(1);
    expect(siBreakdown?.totalPrizePoolUsdc).toBeCloseTo(0.0175, 10);
  });

  it('should only include weekly pools, not daily', () => {
    const getWeekStart = (prizePoolService as any).getWeekStart.bind(prizePoolService);
    const weekStart = getWeekStart();

    // Add games (creates both daily and weekly pools)
    prizePoolService.addToPrizePool({ gameType: 'tetris', amountUsdc: 0.02 });

    const result = prizePoolService.getWeeklyStats({ weekStart });

    // Should only count the weekly pool
    expect(result.totalGames).toBe(1);
    expect(result.totalPrizePoolUsdc).toBeCloseTo(0.014, 10);
  });

  it('should work with a specific weekStart parameter', () => {
    const specificWeek = '2026-01-13'; // A Monday

    // Manually create a pool for a specific week
    db.prepare(
      `INSERT INTO prize_pools (game_type, period_type, period_date, total_amount_usdc, total_games, status)
       VALUES ('breakout', 'weekly', ?, 0.35, 25, 'active')`
    ).run(specificWeek);

    const result = prizePoolService.getWeeklyStats({ weekStart: specificWeek });

    expect(result.weekStart).toBe(specificWeek);
    expect(result.totalGames).toBe(25);
    expect(result.totalPrizePoolUsdc).toBeCloseTo(0.35, 10);
  });

  it('should handle multiple games of same type correctly', () => {
    const getWeekStart = (prizePoolService as any).getWeekStart.bind(prizePoolService);
    const weekStart = getWeekStart();

    // Add 20 games to the same pool
    for (let i = 0; i < 20; i++) {
      prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });
    }

    const result = prizePoolService.getWeeklyStats({ weekStart });

    expect(result.totalGames).toBe(20);
    expect(result.totalPrizePoolUsdc).toBeCloseTo(0.14, 10); // 20 * 0.007
    expect(result.activeGames).toBe(1);
  });

  it('should handle all five game types', () => {
    const getWeekStart = (prizePoolService as any).getWeekStart.bind(prizePoolService);
    const weekStart = getWeekStart();

    // Add one game for each type
    prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });
    prizePoolService.addToPrizePool({ gameType: 'tetris', amountUsdc: 0.02 });
    prizePoolService.addToPrizePool({ gameType: 'pong', amountUsdc: 0.015 });
    prizePoolService.addToPrizePool({ gameType: 'breakout', amountUsdc: 0.01 });
    prizePoolService.addToPrizePool({ gameType: 'space_invaders', amountUsdc: 0.025 });

    const result = prizePoolService.getWeeklyStats({ weekStart, includeBreakdown: true });

    expect(result.activeGames).toBe(5);
    expect(result.gameBreakdown).toHaveLength(5);
    expect(result.totalGames).toBe(5);
  });

  it('should handle large numbers correctly', () => {
    const getWeekStart = (prizePoolService as any).getWeekStart.bind(prizePoolService);
    const weekStart = getWeekStart();

    // Simulate a busy week
    for (let i = 0; i < 500; i++) {
      prizePoolService.addToPrizePool({ gameType: 'tetris', amountUsdc: 0.02 });
    }

    const result = prizePoolService.getWeeklyStats({ weekStart });

    expect(result.totalGames).toBe(500);
    expect(result.totalPrizePoolUsdc).toBeCloseTo(7.0, 10); // 500 * 0.014
  });

  it('should return zero stats for future weeks with no data', () => {
    const futureWeek = '2099-12-27'; // A Monday in future

    const result = prizePoolService.getWeeklyStats({ weekStart: futureWeek });

    expect(result.weekStart).toBe(futureWeek);
    expect(result.totalGames).toBe(0);
    expect(result.totalPrizePoolUsdc).toBe(0);
    expect(result.activeGames).toBe(0);
  });

  it('should return zero stats for past weeks with no data', () => {
    const pastWeek = '2020-01-06'; // A Monday in 2020

    const result = prizePoolService.getWeeklyStats({ weekStart: pastWeek });

    expect(result.weekStart).toBe(pastWeek);
    expect(result.totalGames).toBe(0);
    expect(result.totalPrizePoolUsdc).toBe(0);
    expect(result.activeGames).toBe(0);
  });

  it('should have correct structure with includeBreakdown=false', () => {
    const getWeekStart = (prizePoolService as any).getWeekStart.bind(prizePoolService);
    const weekStart = getWeekStart();

    prizePoolService.addToPrizePool({ gameType: 'pong', amountUsdc: 0.015 });

    const result = prizePoolService.getWeeklyStats({ weekStart, includeBreakdown: false });

    expect(result).toHaveProperty('weekStart');
    expect(result).toHaveProperty('totalGames');
    expect(result).toHaveProperty('totalPrizePoolUsdc');
    expect(result).toHaveProperty('activeGames');
    expect(result).not.toHaveProperty('gameBreakdown');
  });

  it('should have correct structure with includeBreakdown=true', () => {
    const getWeekStart = (prizePoolService as any).getWeekStart.bind(prizePoolService);
    const weekStart = getWeekStart();

    prizePoolService.addToPrizePool({ gameType: 'breakout', amountUsdc: 0.01 });

    const result = prizePoolService.getWeeklyStats({ weekStart, includeBreakdown: true });

    expect(result).toHaveProperty('weekStart');
    expect(result).toHaveProperty('totalGames');
    expect(result).toHaveProperty('totalPrizePoolUsdc');
    expect(result).toHaveProperty('activeGames');
    expect(result).toHaveProperty('gameBreakdown');
    expect(Array.isArray(result.gameBreakdown)).toBe(true);
  });
});

// ============================================================================
// getPoolHistory Method Tests
// ============================================================================

describe('PrizePoolService - getPoolHistory', () => {
  it('should return empty array when no pools exist', () => {
    const result = prizePoolService.getPoolHistory({
      gameType: 'snake',
      periodType: 'daily',
    });

    expect(result).toEqual([]);
  });

  it('should return pools for the specified game type', () => {
    // Create pools for different dates
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });

    // Create a pool for yesterday
    const yesterday = new Date(today + 'T00:00:00Z');
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    db.prepare(
      `INSERT INTO prize_pools (game_type, period_type, period_date, total_amount_usdc, total_games, status)
       VALUES ('snake', 'daily', ?, 0.05, 5, 'active')`
    ).run(yesterdayStr);

    const result = prizePoolService.getPoolHistory({
      gameType: 'snake',
      periodType: 'daily',
    });

    expect(result.length).toBe(2);
    expect(result.every((p) => p.gameType === 'snake')).toBe(true);
  });

  it('should return pools ordered by most recent first', () => {
    // Create pools for three different dates
    db.prepare(
      `INSERT INTO prize_pools (game_type, period_type, period_date, total_amount_usdc, total_games, status)
       VALUES
         ('tetris', 'daily', '2026-01-20', 0.1, 10, 'finalized'),
         ('tetris', 'daily', '2026-01-21', 0.2, 20, 'finalized'),
         ('tetris', 'daily', '2026-01-22', 0.3, 30, 'active')`
    ).run();

    const result = prizePoolService.getPoolHistory({
      gameType: 'tetris',
      periodType: 'daily',
    });

    expect(result.length).toBe(3);
    expect(result[0].periodDate).toBe('2026-01-22');
    expect(result[1].periodDate).toBe('2026-01-21');
    expect(result[2].periodDate).toBe('2026-01-20');
  });

  it('should filter by period type correctly', () => {
    // Add to both daily and weekly pools
    prizePoolService.addToPrizePool({ gameType: 'pong', amountUsdc: 0.015 });

    const dailyHistory = prizePoolService.getPoolHistory({
      gameType: 'pong',
      periodType: 'daily',
    });

    const weeklyHistory = prizePoolService.getPoolHistory({
      gameType: 'pong',
      periodType: 'weekly',
    });

    expect(dailyHistory.length).toBe(1);
    expect(dailyHistory[0].periodType).toBe('daily');
    expect(weeklyHistory.length).toBe(1);
    expect(weeklyHistory[0].periodType).toBe('weekly');
  });

  it('should respect limit parameter', () => {
    // Create 5 pools
    for (let i = 0; i < 5; i++) {
      const date = `2026-01-${20 + i}`;
      db.prepare(
        `INSERT INTO prize_pools (game_type, period_type, period_date, total_amount_usdc, total_games, status)
         VALUES ('breakout', 'daily', ?, 0.1, 10, 'active')`
      ).run(date);
    }

    const result = prizePoolService.getPoolHistory({
      gameType: 'breakout',
      periodType: 'daily',
      limit: 3,
    });

    expect(result.length).toBe(3);
  });

  it('should default limit to 10', () => {
    // Create 15 pools
    for (let i = 0; i < 15; i++) {
      const date = `2026-01-${10 + i}`;
      db.prepare(
        `INSERT INTO prize_pools (game_type, period_type, period_date, total_amount_usdc, total_games, status)
         VALUES ('space_invaders', 'weekly', ?, 0.1, 10, 'active')`
      ).run(date);
    }

    const result = prizePoolService.getPoolHistory({
      gameType: 'space_invaders',
      periodType: 'weekly',
    });

    expect(result.length).toBe(10);
  });

  it('should respect offset parameter', () => {
    // Create 5 pools
    for (let i = 0; i < 5; i++) {
      const date = `2026-01-${20 + i}`;
      db.prepare(
        `INSERT INTO prize_pools (game_type, period_type, period_date, total_amount_usdc, total_games, status)
         VALUES ('snake', 'daily', ?, 0.1, 10, 'active')`
      ).run(date);
    }

    const result = prizePoolService.getPoolHistory({
      gameType: 'snake',
      periodType: 'daily',
      offset: 2,
      limit: 10,
    });

    expect(result.length).toBe(3);
    expect(result[0].periodDate).toBe('2026-01-22');
  });

  it('should default offset to 0', () => {
    // Create 3 pools
    db.prepare(
      `INSERT INTO prize_pools (game_type, period_type, period_date, total_amount_usdc, total_games, status)
       VALUES
         ('tetris', 'daily', '2026-01-20', 0.1, 10, 'active'),
         ('tetris', 'daily', '2026-01-21', 0.2, 20, 'active'),
         ('tetris', 'daily', '2026-01-22', 0.3, 30, 'active')`
    ).run();

    const result = prizePoolService.getPoolHistory({
      gameType: 'tetris',
      periodType: 'daily',
      limit: 2,
    });

    expect(result.length).toBe(2);
    expect(result[0].periodDate).toBe('2026-01-22');
    expect(result[1].periodDate).toBe('2026-01-21');
  });

  it('should include all pool fields', () => {
    prizePoolService.addToPrizePool({ gameType: 'pong', amountUsdc: 0.015 });

    const result = prizePoolService.getPoolHistory({
      gameType: 'pong',
      periodType: 'daily',
    });

    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('gameType');
    expect(result[0]).toHaveProperty('periodType');
    expect(result[0]).toHaveProperty('periodDate');
    expect(result[0]).toHaveProperty('totalAmountUsdc');
    expect(result[0]).toHaveProperty('totalGames');
    expect(result[0]).toHaveProperty('status');
    expect(result[0]).toHaveProperty('winnerAddress');
    expect(result[0]).toHaveProperty('payoutTxHash');
    expect(result[0]).toHaveProperty('createdAt');
    expect(result[0]).toHaveProperty('finalizedAt');
  });

  it('should include pools with all statuses', () => {
    // Create pools with different statuses
    db.prepare(
      `INSERT INTO prize_pools (game_type, period_type, period_date, total_amount_usdc, total_games, status)
       VALUES
         ('breakout', 'daily', '2026-01-20', 0.1, 10, 'active'),
         ('breakout', 'daily', '2026-01-21', 0.2, 20, 'finalized'),
         ('breakout', 'daily', '2026-01-22', 0.3, 30, 'paid')`
    ).run();

    const result = prizePoolService.getPoolHistory({
      gameType: 'breakout',
      periodType: 'daily',
    });

    expect(result.length).toBe(3);
    expect(result.some((p) => p.status === 'active')).toBe(true);
    expect(result.some((p) => p.status === 'finalized')).toBe(true);
    expect(result.some((p) => p.status === 'paid')).toBe(true);
  });

  it('should not include pools from different game types', () => {
    prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });
    prizePoolService.addToPrizePool({ gameType: 'tetris', amountUsdc: 0.02 });

    const result = prizePoolService.getPoolHistory({
      gameType: 'snake',
      periodType: 'daily',
    });

    expect(result.every((p) => p.gameType === 'snake')).toBe(true);
  });

  it('should handle pagination correctly', () => {
    // Create 20 pools
    for (let i = 0; i < 20; i++) {
      const date = `2026-01-${10 + i}`;
      db.prepare(
        `INSERT INTO prize_pools (game_type, period_type, period_date, total_amount_usdc, total_games, status)
         VALUES ('space_invaders', 'daily', ?, 0.1, 10, 'active')`
      ).run(date);
    }

    // Page 1 (first 5)
    const page1 = prizePoolService.getPoolHistory({
      gameType: 'space_invaders',
      periodType: 'daily',
      limit: 5,
      offset: 0,
    });

    // Page 2 (next 5)
    const page2 = prizePoolService.getPoolHistory({
      gameType: 'space_invaders',
      periodType: 'daily',
      limit: 5,
      offset: 5,
    });

    expect(page1.length).toBe(5);
    expect(page2.length).toBe(5);
    expect(page1[0].periodDate).not.toBe(page2[0].periodDate);
  });
});

// ============================================================================
// finalizePool Method Tests
// ============================================================================

describe('PrizePoolService - finalizePool', () => {
  it('should return null when pool does not exist', () => {
    const result = prizePoolService.finalizePool({
      gameType: 'snake',
      periodType: 'daily',
      periodDate: '2026-01-01',
    });

    expect(result).toBeNull();
  });

  it('should return null when no players have scores for the period', () => {
    // Create a pool but no leaderboard entries
    prizePoolService.addToPrizePool({ gameType: 'tetris', amountUsdc: 0.02 });

    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const result = prizePoolService.finalizePool({
      gameType: 'tetris',
      periodType: 'daily',
      periodDate: getTodayDate(),
    });

    expect(result).toBeNull();
  });

  it('should set winner to player with highest score', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    // Create pool
    prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });

    // Add leaderboard entries with different scores
    db.prepare(
      `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
       VALUES
         ('s1', 'snake', '0xplayer1', 100, 'daily', ?),
         ('s2', 'snake', '0xplayer2', 200, 'daily', ?),
         ('s3', 'snake', '0xplayer3', 150, 'daily', ?)`
    ).run(today, today, today);

    const result = prizePoolService.finalizePool({
      gameType: 'snake',
      periodType: 'daily',
      periodDate: today,
    });

    expect(result).not.toBeNull();
    expect(result?.winnerAddress).toBe('0xplayer2');
  });

  it('should update status to finalized', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    prizePoolService.addToPrizePool({ gameType: 'pong', amountUsdc: 0.015 });

    db.prepare(
      `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
       VALUES ('p1', 'pong', '0xwinner', 500, 'daily', ?)`
    ).run(today);

    const result = prizePoolService.finalizePool({
      gameType: 'pong',
      periodType: 'daily',
      periodDate: today,
    });

    expect(result?.status).toBe('finalized');
  });

  it('should set finalizedAt timestamp', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    prizePoolService.addToPrizePool({ gameType: 'breakout', amountUsdc: 0.01 });

    db.prepare(
      `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
       VALUES ('b1', 'breakout', '0xchampion', 999, 'daily', ?)`
    ).run(today);

    const result = prizePoolService.finalizePool({
      gameType: 'breakout',
      periodType: 'daily',
      periodDate: today,
    });

    expect(result?.finalizedAt).not.toBeNull();
    expect(typeof result?.finalizedAt).toBe('string');
  });

  it('should be idempotent when pool already finalized', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    prizePoolService.addToPrizePool({ gameType: 'space_invaders', amountUsdc: 0.025 });

    db.prepare(
      `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
       VALUES ('si1', 'space_invaders', '0xplayer1', 800, 'daily', ?)`
    ).run(today);

    // Finalize once
    const firstResult = prizePoolService.finalizePool({
      gameType: 'space_invaders',
      periodType: 'daily',
      periodDate: today,
    });

    // Finalize again
    const secondResult = prizePoolService.finalizePool({
      gameType: 'space_invaders',
      periodType: 'daily',
      periodDate: today,
    });

    expect(firstResult?.id).toBe(secondResult?.id);
    expect(firstResult?.status).toBe('finalized');
    expect(secondResult?.status).toBe('finalized');
    expect(firstResult?.winnerAddress).toBe(secondResult?.winnerAddress);
  });

  it('should throw error when pool is already paid', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    prizePoolService.addToPrizePool({ gameType: 'tetris', amountUsdc: 0.02 });

    db.prepare(
      `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
       VALUES ('t1', 'tetris', '0xwinner', 300, 'daily', ?)`
    ).run(today);

    // Finalize
    const finalized = prizePoolService.finalizePool({
      gameType: 'tetris',
      periodType: 'daily',
      periodDate: today,
    });

    // Record payout
    prizePoolService.recordPayout({
      poolId: finalized!.id,
      payoutTxHash: '0xabcdef123',
    });

    // Try to finalize again
    expect(() => {
      prizePoolService.finalizePool({
        gameType: 'tetris',
        periodType: 'daily',
        periodDate: today,
      });
    }).toThrow('is already paid out');
  });

  it('should work with weekly periods', () => {
    const getWeekStart = (prizePoolService as any).getWeekStart.bind(prizePoolService);
    const weekStart = getWeekStart();

    prizePoolService.addToPrizePool({ gameType: 'pong', amountUsdc: 0.015 });

    db.prepare(
      `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
       VALUES ('w1', 'pong', '0xweeklywinner', 1000, 'weekly', ?)`
    ).run(weekStart);

    const result = prizePoolService.finalizePool({
      gameType: 'pong',
      periodType: 'weekly',
      periodDate: weekStart,
    });

    expect(result).not.toBeNull();
    expect(result?.winnerAddress).toBe('0xweeklywinner');
    expect(result?.periodType).toBe('weekly');
  });

  it('should preserve pool amount and games count', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    // Add multiple games
    prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });
    prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });
    prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });

    const beforeFinalize = prizePoolService.getCurrentPool({
      gameType: 'snake',
      periodType: 'daily',
    });

    db.prepare(
      `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
       VALUES ('final', 'snake', '0xplayer', 500, 'daily', ?)`
    ).run(today);

    const afterFinalize = prizePoolService.finalizePool({
      gameType: 'snake',
      periodType: 'daily',
      periodDate: today,
    });

    expect(afterFinalize?.totalAmountUsdc).toBe(beforeFinalize?.totalAmountUsdc);
    expect(afterFinalize?.totalGames).toBe(beforeFinalize?.totalGames);
  });

  it('should handle tie scores by returning first player', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    prizePoolService.addToPrizePool({ gameType: 'breakout', amountUsdc: 0.01 });

    // Two players with same score
    db.prepare(
      `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
       VALUES
         ('tie1', 'breakout', '0xplayer1', 500, 'daily', ?),
         ('tie2', 'breakout', '0xplayer2', 500, 'daily', ?)`
    ).run(today, today);

    const result = prizePoolService.finalizePool({
      gameType: 'breakout',
      periodType: 'daily',
      periodDate: today,
    });

    expect(result).not.toBeNull();
    expect(['0xplayer1', '0xplayer2']).toContain(result?.winnerAddress);
  });

  it('should only finalize specific game type', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    // Create pools for two games
    prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });
    prizePoolService.addToPrizePool({ gameType: 'tetris', amountUsdc: 0.02 });

    // Add leaderboard entries for both
    db.prepare(
      `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
       VALUES
         ('s1', 'snake', '0xsnake', 100, 'daily', ?),
         ('t1', 'tetris', '0xtetris', 200, 'daily', ?)`
    ).run(today, today);

    // Finalize only snake
    prizePoolService.finalizePool({
      gameType: 'snake',
      periodType: 'daily',
      periodDate: today,
    });

    const snakePool = prizePoolService.getCurrentPool({
      gameType: 'snake',
      periodType: 'daily',
    });

    const tetrisPool = prizePoolService.getCurrentPool({
      gameType: 'tetris',
      periodType: 'daily',
    });

    expect(snakePool?.status).toBe('finalized');
    expect(tetrisPool?.status).toBe('active');
  });

  it('should include all pool fields in returned object', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    prizePoolService.addToPrizePool({ gameType: 'space_invaders', amountUsdc: 0.025 });

    db.prepare(
      `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
       VALUES ('si', 'space_invaders', '0xplayer', 750, 'daily', ?)`
    ).run(today);

    const result = prizePoolService.finalizePool({
      gameType: 'space_invaders',
      periodType: 'daily',
      periodDate: today,
    });

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
// recordPayout Method Tests
// ============================================================================

describe('PrizePoolService - recordPayout', () => {
  it('should return null when pool does not exist', () => {
    const result = prizePoolService.recordPayout({
      poolId: 999,
      payoutTxHash: '0xabcdef',
    });

    expect(result).toBeNull();
  });

  it('should throw error when pool is not finalized', () => {
    // Create active pool
    prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });

    const pool = prizePoolService.getCurrentPool({
      gameType: 'snake',
      periodType: 'daily',
    });

    expect(() => {
      prizePoolService.recordPayout({
        poolId: pool!.id,
        payoutTxHash: '0x123',
      });
    }).toThrow('is not finalized');
  });

  it('should update status to paid', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    prizePoolService.addToPrizePool({ gameType: 'tetris', amountUsdc: 0.02 });

    db.prepare(
      `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
       VALUES ('t1', 'tetris', '0xwinner', 300, 'daily', ?)`
    ).run(today);

    const finalized = prizePoolService.finalizePool({
      gameType: 'tetris',
      periodType: 'daily',
      periodDate: today,
    });

    const paid = prizePoolService.recordPayout({
      poolId: finalized!.id,
      payoutTxHash: '0xabc123',
    });

    expect(paid?.status).toBe('paid');
  });

  it('should set payout transaction hash', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    prizePoolService.addToPrizePool({ gameType: 'pong', amountUsdc: 0.015 });

    db.prepare(
      `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
       VALUES ('p1', 'pong', '0xchamp', 400, 'daily', ?)`
    ).run(today);

    const finalized = prizePoolService.finalizePool({
      gameType: 'pong',
      periodType: 'daily',
      periodDate: today,
    });

    const txHash = '0xdef456789';
    const paid = prizePoolService.recordPayout({
      poolId: finalized!.id,
      payoutTxHash: txHash,
    });

    expect(paid?.payoutTxHash).toBe(txHash);
  });

  it('should preserve winner address', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    prizePoolService.addToPrizePool({ gameType: 'breakout', amountUsdc: 0.01 });

    db.prepare(
      `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
       VALUES ('b1', 'breakout', '0xwinner123', 550, 'daily', ?)`
    ).run(today);

    const finalized = prizePoolService.finalizePool({
      gameType: 'breakout',
      periodType: 'daily',
      periodDate: today,
    });

    const paid = prizePoolService.recordPayout({
      poolId: finalized!.id,
      payoutTxHash: '0xtxhash',
    });

    expect(paid?.winnerAddress).toBe('0xwinner123');
  });

  it('should preserve pool amount and games count', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    prizePoolService.addToPrizePool({ gameType: 'space_invaders', amountUsdc: 0.025 });
    prizePoolService.addToPrizePool({ gameType: 'space_invaders', amountUsdc: 0.025 });

    db.prepare(
      `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
       VALUES ('si1', 'space_invaders', '0xplayer', 800, 'daily', ?)`
    ).run(today);

    const finalized = prizePoolService.finalizePool({
      gameType: 'space_invaders',
      periodType: 'daily',
      periodDate: today,
    });

    const paid = prizePoolService.recordPayout({
      poolId: finalized!.id,
      payoutTxHash: '0xpayout',
    });

    expect(paid?.totalAmountUsdc).toBe(finalized?.totalAmountUsdc);
    expect(paid?.totalGames).toBe(finalized?.totalGames);
  });

  it('should preserve finalizedAt timestamp', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });

    db.prepare(
      `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
       VALUES ('s1', 'snake', '0xsnake', 200, 'daily', ?)`
    ).run(today);

    const finalized = prizePoolService.finalizePool({
      gameType: 'snake',
      periodType: 'daily',
      periodDate: today,
    });

    const paid = prizePoolService.recordPayout({
      poolId: finalized!.id,
      payoutTxHash: '0xpayment',
    });

    expect(paid?.finalizedAt).toBe(finalized?.finalizedAt);
  });

  it('should handle Cronos transaction hash format', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    prizePoolService.addToPrizePool({ gameType: 'tetris', amountUsdc: 0.02 });

    db.prepare(
      `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
       VALUES ('t1', 'tetris', '0xuser', 350, 'daily', ?)`
    ).run(today);

    const finalized = prizePoolService.finalizePool({
      gameType: 'tetris',
      periodType: 'daily',
      periodDate: today,
    });

    const cronosTxHash = '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890';
    const paid = prizePoolService.recordPayout({
      poolId: finalized!.id,
      payoutTxHash: cronosTxHash,
    });

    expect(paid?.payoutTxHash).toBe(cronosTxHash);
    expect(paid?.payoutTxHash?.length).toBe(66); // 0x + 64 hex chars
  });

  it('should work with weekly pools', () => {
    const getWeekStart = (prizePoolService as any).getWeekStart.bind(prizePoolService);
    const weekStart = getWeekStart();

    prizePoolService.addToPrizePool({ gameType: 'pong', amountUsdc: 0.015 });

    db.prepare(
      `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
       VALUES ('w1', 'pong', '0xweekly', 900, 'weekly', ?)`
    ).run(weekStart);

    const finalized = prizePoolService.finalizePool({
      gameType: 'pong',
      periodType: 'weekly',
      periodDate: weekStart,
    });

    const paid = prizePoolService.recordPayout({
      poolId: finalized!.id,
      payoutTxHash: '0xweeklypayout',
    });

    expect(paid?.status).toBe('paid');
    expect(paid?.periodType).toBe('weekly');
  });

  it('should include all pool fields in returned object', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    prizePoolService.addToPrizePool({ gameType: 'breakout', amountUsdc: 0.01 });

    db.prepare(
      `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
       VALUES ('b1', 'breakout', '0xplayer', 600, 'daily', ?)`
    ).run(today);

    const finalized = prizePoolService.finalizePool({
      gameType: 'breakout',
      periodType: 'daily',
      periodDate: today,
    });

    const paid = prizePoolService.recordPayout({
      poolId: finalized!.id,
      payoutTxHash: '0xfinal',
    });

    expect(paid).toHaveProperty('id');
    expect(paid).toHaveProperty('gameType');
    expect(paid).toHaveProperty('periodType');
    expect(paid).toHaveProperty('periodDate');
    expect(paid).toHaveProperty('totalAmountUsdc');
    expect(paid).toHaveProperty('totalGames');
    expect(paid).toHaveProperty('status');
    expect(paid).toHaveProperty('winnerAddress');
    expect(paid).toHaveProperty('payoutTxHash');
    expect(paid).toHaveProperty('createdAt');
    expect(paid).toHaveProperty('finalizedAt');
  });

  it('should handle multiple payouts for different pools', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    // Create two pools
    prizePoolService.addToPrizePool({ gameType: 'snake', amountUsdc: 0.01 });
    prizePoolService.addToPrizePool({ gameType: 'tetris', amountUsdc: 0.02 });

    db.prepare(
      `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
       VALUES
         ('s1', 'snake', '0xsnake', 100, 'daily', ?),
         ('t1', 'tetris', '0xtetris', 200, 'daily', ?)`
    ).run(today, today);

    const finalizedSnake = prizePoolService.finalizePool({
      gameType: 'snake',
      periodType: 'daily',
      periodDate: today,
    });

    const finalizedTetris = prizePoolService.finalizePool({
      gameType: 'tetris',
      periodType: 'daily',
      periodDate: today,
    });

    const paidSnake = prizePoolService.recordPayout({
      poolId: finalizedSnake!.id,
      payoutTxHash: '0xsnakepayout',
    });

    const paidTetris = prizePoolService.recordPayout({
      poolId: finalizedTetris!.id,
      payoutTxHash: '0xtetrispayout',
    });

    expect(paidSnake?.status).toBe('paid');
    expect(paidTetris?.status).toBe('paid');
    expect(paidSnake?.payoutTxHash).toBe('0xsnakepayout');
    expect(paidTetris?.payoutTxHash).toBe('0xtetrispayout');
  });

  it('should verify complete pool lifecycle', () => {
    const getTodayDate = (prizePoolService as any).getTodayDate.bind(prizePoolService);
    const today = getTodayDate();

    // 1. Create pool (active)
    prizePoolService.addToPrizePool({ gameType: 'space_invaders', amountUsdc: 0.025 });
    const activePool = prizePoolService.getCurrentPool({
      gameType: 'space_invaders',
      periodType: 'daily',
    });
    expect(activePool?.status).toBe('active');
    expect(activePool?.winnerAddress).toBeNull();
    expect(activePool?.payoutTxHash).toBeNull();
    expect(activePool?.finalizedAt).toBeNull();

    // 2. Add leaderboard entry
    db.prepare(
      `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
       VALUES ('si1', 'space_invaders', '0xchampion', 1000, 'daily', ?)`
    ).run(today);

    // 3. Finalize pool
    const finalized = prizePoolService.finalizePool({
      gameType: 'space_invaders',
      periodType: 'daily',
      periodDate: today,
    });
    expect(finalized?.status).toBe('finalized');
    expect(finalized?.winnerAddress).toBe('0xchampion');
    expect(finalized?.payoutTxHash).toBeNull();
    expect(finalized?.finalizedAt).not.toBeNull();

    // 4. Record payout
    const paid = prizePoolService.recordPayout({
      poolId: finalized!.id,
      payoutTxHash: '0xfullcycle',
    });
    expect(paid?.status).toBe('paid');
    expect(paid?.winnerAddress).toBe('0xchampion');
    expect(paid?.payoutTxHash).toBe('0xfullcycle');
    expect(paid?.finalizedAt).not.toBeNull();
  });
});
