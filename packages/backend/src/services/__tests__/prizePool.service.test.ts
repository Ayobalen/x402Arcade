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
