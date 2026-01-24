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
});
