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
           VALUES ('test-1', 'snake', '0x1234567890123456789012345678901234567890', 'tx1', 0.01)`
        ).run();
      }).not.toThrow();

      // Invalid game type should fail
      expect(() => {
        db.prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
           VALUES ('test-2', 'invalid', '0xabcdef1234567890123456789012345678901234', 'tx2', 0.01)`
        ).run();
      }).toThrow();
    });

    it('should enforce status CHECK constraint', () => {
      initializeSchema(db);

      const validAddress = '0x1234567890123456789012345678901234567890';

      // Valid status: 'active'
      expect(() => {
        db.prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc, status)
           VALUES ('test-1', 'snake', '${validAddress}', '0x${'a'.repeat(64)}1', 0.01, 'active')`
        ).run();
      }).not.toThrow();

      // Valid status: 'completed'
      expect(() => {
        db.prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc, status)
           VALUES ('test-2', 'snake', '${validAddress}', '0x${'a'.repeat(64)}2', 0.01, 'completed')`
        ).run();
      }).not.toThrow();

      // Valid status: 'expired'
      expect(() => {
        db.prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc, status)
           VALUES ('test-3', 'snake', '${validAddress}', '0x${'a'.repeat(64)}3', 0.01, 'expired')`
        ).run();
      }).not.toThrow();

      // Invalid status should fail
      expect(() => {
        db.prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc, status)
           VALUES ('test-4', 'snake', '${validAddress}', '0x${'a'.repeat(64)}4', 0.01, 'invalid')`
        ).run();
      }).toThrow();

      // Invalid status: 'pending' should fail
      expect(() => {
        db.prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc, status)
           VALUES ('test-5', 'snake', '${validAddress}', '0x${'a'.repeat(64)}5', 0.01, 'pending')`
        ).run();
      }).toThrow();
    });

    it('should default status to active', () => {
      initializeSchema(db);

      db.prepare(
        `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
         VALUES ('test-1', 'snake', '0x1234567890123456789012345678901234567890', 'tx1', 0.01)`
      ).run();

      const row = db.prepare(`SELECT status FROM game_sessions WHERE id = 'test-1'`).get() as {
        status: string;
      };

      expect(row.status).toBe('active');
    });

    it('should enforce payment_tx_hash uniqueness', () => {
      initializeSchema(db);

      // First insert should work (using valid lowercase address)
      db.prepare(
        `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
         VALUES ('test-1', 'snake', '0x1234567890123456789012345678901234567890', 'tx-unique', 0.01)`
      ).run();

      // Second insert with same tx_hash should fail
      expect(() => {
        db.prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
           VALUES ('test-2', 'snake', '0xabcdef1234567890123456789012345678901234', 'tx-unique', 0.01)`
        ).run();
      }).toThrow();
    });

    it('should enforce player_address format (42 characters, 0x prefix, lowercase)', () => {
      initializeSchema(db);

      const validTxHash = '0x' + 'a'.repeat(64);

      // Valid lowercase address should work
      expect(() => {
        db.prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
           VALUES ('test-1', 'snake', '0x1234567890123456789012345678901234567890', '${validTxHash}1', 0.01)`
        ).run();
      }).not.toThrow();

      // Invalid: too short
      expect(() => {
        db.prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
           VALUES ('test-2', 'snake', '0x123', '${validTxHash}2', 0.01)`
        ).run();
      }).toThrow();

      // Invalid: missing 0x prefix
      expect(() => {
        db.prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
           VALUES ('test-3', 'snake', '1234567890123456789012345678901234567890ab', '${validTxHash}3', 0.01)`
        ).run();
      }).toThrow();

      // Invalid: uppercase (not lowercase)
      expect(() => {
        db.prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
           VALUES ('test-4', 'snake', '0x1234567890123456789012345678901234567ABC', '${validTxHash}4', 0.01)`
        ).run();
      }).toThrow();
    });

    it('should enforce payment_tx_hash format (66 characters, 0x prefix)', () => {
      initializeSchema(db);

      const validAddress = '0x1234567890123456789012345678901234567890';

      // Valid 66-character tx hash should work
      const validTxHash = '0x' + 'a'.repeat(64);
      expect(() => {
        db.prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
           VALUES ('test-1', 'snake', '${validAddress}', '${validTxHash}', 0.01)`
        ).run();
      }).not.toThrow();

      // Invalid: too short
      expect(() => {
        db.prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
           VALUES ('test-2', 'snake', '${validAddress}', '0x123', 0.01)`
        ).run();
      }).toThrow();

      // Invalid: missing 0x prefix
      expect(() => {
        db.prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
           VALUES ('test-3', 'snake', '${validAddress}', '${'a'.repeat(66)}', 0.01)`
        ).run();
      }).toThrow();

      // Invalid: too long
      expect(() => {
        db.prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
           VALUES ('test-4', 'snake', '${validAddress}', '0x${'a'.repeat(65)}', 0.01)`
        ).run();
      }).toThrow();
    });

    it('should enforce amount_paid_usdc CHECK constraint (must be positive)', () => {
      initializeSchema(db);

      const validAddress = '0x1234567890123456789012345678901234567890';
      const validTxHash = '0x' + 'a'.repeat(64);

      // Valid positive amounts should work
      expect(() => {
        db.prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
           VALUES ('test-1', 'snake', '${validAddress}', '${validTxHash}1', 0.01)`
        ).run();
      }).not.toThrow();

      expect(() => {
        db.prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
           VALUES ('test-2', 'snake', '${validAddress}', '${validTxHash}2', 0.02)`
        ).run();
      }).not.toThrow();

      expect(() => {
        db.prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
           VALUES ('test-3', 'snake', '${validAddress}', '${validTxHash}3', 1.5)`
        ).run();
      }).not.toThrow();

      // Invalid: zero amount should fail
      expect(() => {
        db.prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
           VALUES ('test-4', 'snake', '${validAddress}', '${validTxHash}4', 0)`
        ).run();
      }).toThrow();

      // Invalid: negative amount should fail
      expect(() => {
        db.prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
           VALUES ('test-5', 'snake', '${validAddress}', '${validTxHash}5', -0.01)`
        ).run();
      }).toThrow();
    });

    it('should enforce score CHECK constraint (NULL or non-negative)', () => {
      initializeSchema(db);

      const validAddress = '0x1234567890123456789012345678901234567890';
      const validTxHash = '0x' + 'a'.repeat(64);

      // Valid: NULL score (game not completed yet)
      expect(() => {
        db.prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc, score)
           VALUES ('test-1', 'snake', '${validAddress}', '${validTxHash}1', 0.01, NULL)`
        ).run();
      }).not.toThrow();

      // Valid: Omitting score defaults to NULL
      expect(() => {
        db.prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
           VALUES ('test-2', 'snake', '${validAddress}', '${validTxHash}2', 0.01)`
        ).run();
      }).not.toThrow();

      // Valid: zero score
      expect(() => {
        db.prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc, score)
           VALUES ('test-3', 'snake', '${validAddress}', '${validTxHash}3', 0.01, 0)`
        ).run();
      }).not.toThrow();

      // Valid: positive scores
      expect(() => {
        db.prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc, score)
           VALUES ('test-4', 'snake', '${validAddress}', '${validTxHash}4', 0.01, 100)`
        ).run();
      }).not.toThrow();

      expect(() => {
        db.prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc, score)
           VALUES ('test-5', 'snake', '${validAddress}', '${validTxHash}5', 0.01, 999999)`
        ).run();
      }).not.toThrow();

      // Invalid: negative score should fail
      expect(() => {
        db.prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc, score)
           VALUES ('test-6', 'snake', '${validAddress}', '${validTxHash}6', 0.01, -1)`
        ).run();
      }).toThrow();

      expect(() => {
        db.prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc, score)
           VALUES ('test-7', 'snake', '${validAddress}', '${validTxHash}7', 0.01, -100)`
        ).run();
      }).toThrow();
    });

    it('should default score to NULL when not provided', () => {
      initializeSchema(db);

      const validAddress = '0x1234567890123456789012345678901234567890';
      const validTxHash = '0x' + 'a'.repeat(64);

      db.prepare(
        `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
         VALUES ('test-1', 'snake', '${validAddress}', '${validTxHash}', 0.01)`
      ).run();

      const row = db.prepare(`SELECT score FROM game_sessions WHERE id = 'test-1'`).get() as {
        score: number | null;
      };

      expect(row.score).toBeNull();
    });

    it('should auto-set created_at timestamp when row inserted', () => {
      initializeSchema(db);

      const validAddress = '0x1234567890123456789012345678901234567890';
      const validTxHash = '0x' + 'a'.repeat(64);

      db.prepare(
        `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
         VALUES ('test-1', 'snake', '${validAddress}', '${validTxHash}', 0.01)`
      ).run();

      const row = db.prepare(`SELECT created_at FROM game_sessions WHERE id = 'test-1'`).get() as {
        created_at: string;
      };

      // Verify created_at is set
      expect(row.created_at).toBeDefined();
      expect(row.created_at).not.toBeNull();

      // Verify ISO 8601 format: 'YYYY-MM-DD HH:MM:SS'
      expect(row.created_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);

      // Verify timestamp is recent (within last 5 seconds)
      const createdDate = new Date(row.created_at + 'Z'); // Add Z for UTC
      const now = new Date();
      const diffMs = now.getTime() - createdDate.getTime();
      expect(diffMs).toBeLessThan(5000); // Less than 5 seconds ago
      expect(diffMs).toBeGreaterThanOrEqual(0); // Not in future
    });

    it('should default completed_at to NULL', () => {
      initializeSchema(db);

      const validAddress = '0x1234567890123456789012345678901234567890';
      const validTxHash = '0x' + 'a'.repeat(64);

      db.prepare(
        `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
         VALUES ('test-1', 'snake', '${validAddress}', '${validTxHash}', 0.01)`
      ).run();

      const row = db
        .prepare(`SELECT completed_at FROM game_sessions WHERE id = 'test-1'`)
        .get() as {
        completed_at: string | null;
      };

      expect(row.completed_at).toBeNull();
    });

    it('should accept ISO 8601 timestamps for completed_at', () => {
      initializeSchema(db);

      const validAddress = '0x1234567890123456789012345678901234567890';
      const validTxHash = '0x' + 'a'.repeat(64);
      const completedTimestamp = '2026-01-24 14:30:45';

      expect(() => {
        db.prepare(
          `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc, completed_at)
           VALUES ('test-1', 'snake', '${validAddress}', '${validTxHash}', 0.01, '${completedTimestamp}')`
        ).run();
      }).not.toThrow();

      const row = db
        .prepare(`SELECT completed_at FROM game_sessions WHERE id = 'test-1'`)
        .get() as {
        completed_at: string;
      };

      expect(row.completed_at).toBe(completedTimestamp);
    });
  });
});
