/**
 * Database Schema Tests
 *
 * Tests for database schema initialization and table creation.
 */

import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import { initializeSchema } from '../schema';

describe('Database Schema', () => {
  let db: DatabaseType;

  beforeEach(() => {
    // Create an in-memory database for testing
    db = new Database(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  describe('initializeSchema', () => {
    it('should create game_sessions table', () => {
      initializeSchema(db);

      // Query sqlite_master to check if table exists
      const tableExists = db
        .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='game_sessions'`)
        .get();

      expect(tableExists).toBeDefined();
      expect(tableExists).toHaveProperty('name', 'game_sessions');
    });

    it('should create game_sessions table with correct columns', () => {
      initializeSchema(db);

      // Get table info
      const columns = db.prepare(`PRAGMA table_info(game_sessions)`).all() as Array<{
        name: string;
        type: string;
        notnull: number;
        dflt_value: string | null;
        pk: number;
      }>;

      const columnNames = columns.map((col) => col.name);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('game_type');
      expect(columnNames).toContain('player_address');
      expect(columnNames).toContain('payment_tx_hash');
      expect(columnNames).toContain('amount_paid_usdc');
      expect(columnNames).toContain('score');
      expect(columnNames).toContain('status');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('completed_at');
      expect(columnNames).toContain('game_duration_ms');
    });

    it('should set id as primary key', () => {
      initializeSchema(db);

      const columns = db.prepare(`PRAGMA table_info(game_sessions)`).all() as Array<{
        name: string;
        pk: number;
      }>;

      const idColumn = columns.find((col) => col.name === 'id');
      expect(idColumn?.pk).toBe(1);
    });

    it('should create indexes for game_sessions', () => {
      initializeSchema(db);

      const indexes = db
        .prepare(`SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='game_sessions'`)
        .all() as Array<{ name: string }>;

      const indexNames = indexes.map((idx) => idx.name);

      expect(indexNames).toContain('idx_sessions_player');
      expect(indexNames).toContain('idx_sessions_status');
      expect(indexNames).toContain('idx_sessions_game_type');
      expect(indexNames).toContain('idx_sessions_created_at');
    });

    it('should be safe to call multiple times (idempotent)', () => {
      // First call
      initializeSchema(db);

      // Second call should not throw
      expect(() => {
        initializeSchema(db);
      }).not.toThrow();

      // Table should still exist
      const tableExists = db
        .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='game_sessions'`)
        .get();

      expect(tableExists).toBeDefined();
    });

    it('should enforce game_type CHECK constraint', () => {
      initializeSchema(db);

      // Valid game types should work
      expect(() => {
        db.prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
           VALUES ('test-1', 'snake', '0x123', 'tx1', 0.01)`
        ).run();
      }).not.toThrow();

      // Invalid game type should fail
      expect(() => {
        db.prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
           VALUES ('test-2', 'invalid', '0x456', 'tx2', 0.01)`
        ).run();
      }).toThrow();
    });

    it('should enforce status CHECK constraint', () => {
      initializeSchema(db);

      // Valid status should work
      expect(() => {
        db.prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc, status)
           VALUES ('test-1', 'snake', '0x123', 'tx1', 0.01, 'active')`
        ).run();
      }).not.toThrow();

      // Invalid status should fail
      expect(() => {
        db.prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc, status)
           VALUES ('test-2', 'snake', '0x456', 'tx2', 0.01, 'invalid')`
        ).run();
      }).toThrow();
    });

    it('should default status to active', () => {
      initializeSchema(db);

      db.prepare(
        `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
         VALUES ('test-1', 'snake', '0x123', 'tx1', 0.01)`
      ).run();

      const row = db.prepare(`SELECT status FROM game_sessions WHERE id = 'test-1'`).get() as {
        status: string;
      };

      expect(row.status).toBe('active');
    });

    it('should enforce payment_tx_hash uniqueness', () => {
      initializeSchema(db);

      // First insert should work
      db.prepare(
        `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
         VALUES ('test-1', 'snake', '0x123', 'tx-unique', 0.01)`
      ).run();

      // Second insert with same tx_hash should fail
      expect(() => {
        db.prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
           VALUES ('test-2', 'snake', '0x456', 'tx-unique', 0.01)`
        ).run();
      }).toThrow();
    });
  });
});
