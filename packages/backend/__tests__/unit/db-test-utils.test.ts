/**
 * Tests for Database Test Utilities
 *
 * Verifies that the in-memory SQLite database utilities provide
 * proper isolation, seeding, and cleanup functionality.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  createTestDatabase,
  clearTestDatabase,
  closeTestDatabase,
  seedTestData,
  withTestDatabase,
  createSeededTestDatabase,
  testDataGenerators,
  type TestDatabase,
} from '../utils';

describe('Database Test Utilities', () => {
  describe('createTestDatabase', () => {
    let db: TestDatabase;

    afterEach(() => {
      if (db) {
        closeTestDatabase(db);
      }
    });

    it('should create an in-memory database', () => {
      db = createTestDatabase();
      expect(db).toBeDefined();
      expect(db.open).toBe(true);
    });

    it('should create all required tables', () => {
      db = createTestDatabase();

      // Query sqlite_master to get all tables
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        .all() as { name: string }[];

      const tableNames = tables.map((t) => t.name);

      expect(tableNames).toContain('game_sessions');
      expect(tableNames).toContain('leaderboard_entries');
      expect(tableNames).toContain('prize_pools');
      expect(tableNames).toContain('payments');
    });

    it('should have foreign keys enabled', () => {
      db = createTestDatabase();
      const result = db.pragma('foreign_keys') as { foreign_keys: number }[];
      expect(result[0].foreign_keys).toBe(1);
    });

    it('should create isolated databases', () => {
      const db1 = createTestDatabase();
      const db2 = createTestDatabase();

      // Insert into db1
      db1
        .prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run('session1', 'snake', '0x123', '0xabc', 0.01);

      // db2 should be empty
      const db1Count = (
        db1.prepare('SELECT COUNT(*) as count FROM game_sessions').get() as { count: number }
      ).count;
      const db2Count = (
        db2.prepare('SELECT COUNT(*) as count FROM game_sessions').get() as { count: number }
      ).count;

      expect(db1Count).toBe(1);
      expect(db2Count).toBe(0);

      closeTestDatabase(db1);
      closeTestDatabase(db2);
    });
  });

  describe('clearTestDatabase', () => {
    let db: TestDatabase;

    beforeEach(() => {
      db = createTestDatabase();
    });

    afterEach(() => {
      closeTestDatabase(db);
    });

    it('should clear all data from game_sessions', () => {
      // Insert test data
      db.prepare(
        `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
         VALUES (?, ?, ?, ?, ?)`
      ).run('session1', 'snake', '0x123', '0xabc', 0.01);

      const beforeCount = (
        db.prepare('SELECT COUNT(*) as count FROM game_sessions').get() as { count: number }
      ).count;
      expect(beforeCount).toBe(1);

      clearTestDatabase(db);

      const afterCount = (
        db.prepare('SELECT COUNT(*) as count FROM game_sessions').get() as { count: number }
      ).count;
      expect(afterCount).toBe(0);
    });

    it('should clear all data from all tables', () => {
      // Insert data into each table
      db.prepare(
        `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
         VALUES (?, ?, ?, ?, ?)`
      ).run('session1', 'snake', '0x123', '0xabc', 0.01);

      db.prepare(
        `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run('session1', 'snake', '0x123', 100, 'daily', '2026-01-23');

      db.prepare(
        `INSERT INTO prize_pools (game_type, period_type, period_date)
         VALUES (?, ?, ?)`
      ).run('snake', 'daily', '2026-01-23');

      db.prepare(
        `INSERT INTO payments (tx_hash, from_address, to_address, amount_usdc, purpose)
         VALUES (?, ?, ?, ?, ?)`
      ).run('0xdef', '0x123', '0x456', 0.01, 'game_payment');

      clearTestDatabase(db);

      // Check all tables are empty
      const tables = ['game_sessions', 'leaderboard_entries', 'prize_pools', 'payments'];
      for (const table of tables) {
        const count = (
          db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number }
        ).count;
        expect(count).toBe(0);
      }
    });

    it('should preserve the schema after clearing', () => {
      clearTestDatabase(db);

      // Should be able to insert data after clearing
      expect(() => {
        db.prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
           VALUES (?, ?, ?, ?, ?)`
        ).run('new_session', 'snake', '0x123', '0xabc', 0.01);
      }).not.toThrow();
    });
  });

  describe('seedTestData', () => {
    let db: TestDatabase;

    beforeEach(() => {
      db = createTestDatabase();
    });

    afterEach(() => {
      closeTestDatabase(db);
    });

    it('should seed game sessions', () => {
      seedTestData(db, {
        gameSessions: [
          {
            id: 'session1',
            game_type: 'snake',
            player_address: '0x111',
            payment_tx_hash: '0xaaa',
            amount_paid_usdc: 0.01,
          },
          {
            id: 'session2',
            game_type: 'tetris',
            player_address: '0x222',
            payment_tx_hash: '0xbbb',
            amount_paid_usdc: 0.02,
          },
        ],
      });

      const sessions = db.prepare('SELECT * FROM game_sessions ORDER BY id').all() as Array<{
        id: string;
        game_type: string;
        amount_paid_usdc: number;
      }>;

      expect(sessions).toHaveLength(2);
      expect(sessions[0].id).toBe('session1');
      expect(sessions[0].game_type).toBe('snake');
      expect(sessions[1].id).toBe('session2');
      expect(sessions[1].game_type).toBe('tetris');
    });

    it('should seed leaderboard entries', () => {
      // First create a game session (foreign key reference)
      seedTestData(db, {
        gameSessions: [
          {
            id: 'session1',
            game_type: 'snake',
            player_address: '0x111',
            payment_tx_hash: '0xaaa',
            amount_paid_usdc: 0.01,
          },
        ],
        leaderboardEntries: [
          {
            session_id: 'session1',
            game_type: 'snake',
            player_address: '0x111',
            score: 500,
            period_type: 'daily',
            period_date: '2026-01-23',
          },
        ],
      });

      const entries = db.prepare('SELECT * FROM leaderboard_entries').all() as Array<{
        session_id: string;
        score: number;
      }>;

      expect(entries).toHaveLength(1);
      expect(entries[0].session_id).toBe('session1');
      expect(entries[0].score).toBe(500);
    });

    it('should seed prize pools', () => {
      seedTestData(db, {
        prizePools: [
          {
            game_type: 'snake',
            period_type: 'daily',
            period_date: '2026-01-23',
            total_amount_usdc: 1.5,
            total_games: 150,
          },
        ],
      });

      const pools = db.prepare('SELECT * FROM prize_pools').all() as Array<{
        game_type: string;
        total_amount_usdc: number;
        total_games: number;
      }>;

      expect(pools).toHaveLength(1);
      expect(pools[0].game_type).toBe('snake');
      expect(pools[0].total_amount_usdc).toBe(1.5);
      expect(pools[0].total_games).toBe(150);
    });

    it('should seed payments', () => {
      seedTestData(db, {
        payments: [
          {
            tx_hash: '0xpayment1',
            from_address: '0x111',
            to_address: '0x222',
            amount_usdc: 0.01,
            purpose: 'game_payment',
          },
        ],
      });

      const payments = db.prepare('SELECT * FROM payments').all() as Array<{
        tx_hash: string;
        purpose: string;
      }>;

      expect(payments).toHaveLength(1);
      expect(payments[0].tx_hash).toBe('0xpayment1');
      expect(payments[0].purpose).toBe('game_payment');
    });
  });

  describe('withTestDatabase', () => {
    it('should provide a database context', async () => {
      let capturedDb: TestDatabase | null = null;

      await withTestDatabase(({ db }) => {
        capturedDb = db;
        expect(db).toBeDefined();
        expect(db.open).toBe(true);
      })();

      // Database should be closed after the test
      expect(capturedDb!.open).toBe(false);
    });

    it('should clean up database even if test throws', async () => {
      let capturedDb: TestDatabase | null = null;

      try {
        await withTestDatabase(({ db }) => {
          capturedDb = db;
          throw new Error('Test error');
        })();
      } catch {
        // Expected
      }

      // Database should still be closed
      expect(capturedDb!.open).toBe(false);
    });

    it('should support async tests', async () => {
      await withTestDatabase(async ({ db }) => {
        // Simulate async operation
        await new Promise((resolve) => setTimeout(resolve, 10));

        db.prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
           VALUES (?, ?, ?, ?, ?)`
        ).run('async_session', 'snake', '0x123', '0xabc', 0.01);

        const count = (
          db.prepare('SELECT COUNT(*) as count FROM game_sessions').get() as { count: number }
        ).count;
        expect(count).toBe(1);
      })();
    });
  });

  describe('createSeededTestDatabase', () => {
    it('should create and seed database in one step', () => {
      const db = createSeededTestDatabase({
        gameSessions: [
          {
            id: 'quick_session',
            game_type: 'snake',
            player_address: '0x111',
            payment_tx_hash: '0xaaa',
            amount_paid_usdc: 0.01,
          },
        ],
      });

      const count = (
        db.prepare('SELECT COUNT(*) as count FROM game_sessions').get() as { count: number }
      ).count;
      expect(count).toBe(1);

      closeTestDatabase(db);
    });
  });

  describe('testDataGenerators', () => {
    it('should generate unique wallet addresses', () => {
      const addr1 = testDataGenerators.walletAddress(0);
      const addr2 = testDataGenerators.walletAddress(1);

      expect(addr1).toMatch(/^0x[0-9]+$/);
      expect(addr2).toMatch(/^0x[0-9]+$/);
      expect(addr1).not.toBe(addr2);
    });

    it('should generate unique transaction hashes', () => {
      const hash1 = testDataGenerators.txHash(0);
      const hash2 = testDataGenerators.txHash(1);

      expect(hash1).toMatch(/^0x[a-z0-9]+$/);
      expect(hash2).toMatch(/^0x[a-z0-9]+$/);
      expect(hash1).not.toBe(hash2);
    });

    it('should generate valid date strings', () => {
      const today = testDataGenerators.dateString(0);
      const yesterday = testDataGenerators.dateString(1);

      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(yesterday).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(today).not.toBe(yesterday);
    });

    it('should generate complete game sessions', () => {
      const session = testDataGenerators.gameSession(0);

      expect(session.id).toBeDefined();
      expect(session.game_type).toBe('snake');
      expect(session.player_address).toBeDefined();
      expect(session.payment_tx_hash).toBeDefined();
      expect(session.amount_paid_usdc).toBe(0.01);
    });

    it('should generate multiple game sessions', () => {
      const sessions = testDataGenerators.gameSessions(5);

      expect(sessions).toHaveLength(5);

      // Check alternating game types
      expect(sessions[0].game_type).toBe('snake');
      expect(sessions[1].game_type).toBe('tetris');
      expect(sessions[2].game_type).toBe('snake');
    });

    it('should apply overrides to generated sessions', () => {
      const session = testDataGenerators.gameSession(0, {
        status: 'completed',
        score: 1000,
      });

      expect(session.status).toBe('completed');
      expect(session.score).toBe(1000);
    });
  });

  describe('Database Isolation', () => {
    it('should provide complete isolation between tests', async () => {
      // Simulate first test
      const results1 = await withTestDatabase(async ({ db }) => {
        db.prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
           VALUES (?, ?, ?, ?, ?)`
        ).run('isolation_test_1', 'snake', '0x123', '0xabc', 0.01);

        return (
          db.prepare('SELECT COUNT(*) as count FROM game_sessions').get() as { count: number }
        ).count;
      })();

      // Note: results1 is undefined because withTestDatabase doesn't return the function's result
      // Let's verify isolation differently

      // Simulate second test - should have fresh database
      await withTestDatabase(({ db }) => {
        const count = (
          db.prepare('SELECT COUNT(*) as count FROM game_sessions').get() as { count: number }
        ).count;
        expect(count).toBe(0); // Should be empty - proving isolation
      })();
    });

    it('should not share state between sequential database creations', () => {
      const db1 = createTestDatabase();

      db1
        .prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run('shared_test', 'snake', '0x123', '0xabc', 0.01);

      closeTestDatabase(db1);

      // Create new database - should be empty
      const db2 = createTestDatabase();
      const count = (
        db2.prepare('SELECT COUNT(*) as count FROM game_sessions').get() as { count: number }
      ).count;
      expect(count).toBe(0);

      closeTestDatabase(db2);
    });
  });
});
