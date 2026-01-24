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
      expect(indexNames).toContain('idx_sessions_created');
    });

    it('should create idx_sessions_player on player_address column', () => {
      initializeSchema(db);

      // Get index details from sqlite_master
      const indexSql = db
        .prepare(`SELECT sql FROM sqlite_master WHERE type='index' AND name='idx_sessions_player'`)
        .get() as { sql: string } | undefined;

      expect(indexSql).toBeDefined();
      expect(indexSql?.sql).toContain('player_address');
      expect(indexSql?.sql).toContain('game_sessions');
    });

    it('should create idx_sessions_status on status column', () => {
      initializeSchema(db);

      const indexSql = db
        .prepare(`SELECT sql FROM sqlite_master WHERE type='index' AND name='idx_sessions_status'`)
        .get() as { sql: string } | undefined;

      expect(indexSql).toBeDefined();
      expect(indexSql?.sql).toContain('status');
      expect(indexSql?.sql).toContain('game_sessions');
    });

    it('should create idx_sessions_game_type on game_type column', () => {
      initializeSchema(db);

      const indexSql = db
        .prepare(
          `SELECT sql FROM sqlite_master WHERE type='index' AND name='idx_sessions_game_type'`
        )
        .get() as { sql: string } | undefined;

      expect(indexSql).toBeDefined();
      expect(indexSql?.sql).toContain('game_type');
      expect(indexSql?.sql).toContain('game_sessions');
    });

    it('should create idx_sessions_created on created_at DESC', () => {
      initializeSchema(db);

      const indexSql = db
        .prepare(`SELECT sql FROM sqlite_master WHERE type='index' AND name='idx_sessions_created'`)
        .get() as { sql: string } | undefined;

      expect(indexSql).toBeDefined();
      expect(indexSql?.sql).toContain('created_at');
      expect(indexSql?.sql).toContain('DESC');
      expect(indexSql?.sql).toContain('game_sessions');
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

    it('should create leaderboard_entries table', () => {
      initializeSchema(db);

      const tableExists = db
        .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='leaderboard_entries'`)
        .get();

      expect(tableExists).toBeDefined();
      expect(tableExists).toHaveProperty('name', 'leaderboard_entries');
    });

    it('should create leaderboard_entries table with correct columns', () => {
      initializeSchema(db);

      const columns = db.prepare(`PRAGMA table_info(leaderboard_entries)`).all() as Array<{
        name: string;
        type: string;
        notnull: number;
        dflt_value: string | null;
        pk: number;
      }>;

      const columnNames = columns.map((col) => col.name);

      // Verify all required columns are present
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('session_id');
      expect(columnNames).toContain('game_type');
      expect(columnNames).toContain('player_address');
      expect(columnNames).toContain('score');
      expect(columnNames).toContain('period_type');
      expect(columnNames).toContain('period_date');
      expect(columnNames).toContain('rank');
      expect(columnNames).toContain('created_at');
    });

    it('should set id as primary key AUTOINCREMENT for leaderboard_entries', () => {
      initializeSchema(db);

      const columns = db.prepare(`PRAGMA table_info(leaderboard_entries)`).all() as Array<{
        name: string;
        type: string;
        pk: number;
      }>;

      const idColumn = columns.find((col) => col.name === 'id');
      expect(idColumn?.type).toBe('INTEGER');
      expect(idColumn?.pk).toBe(1); // Primary key
    });

    it('should enforce game_type NOT NULL for leaderboard_entries', () => {
      initializeSchema(db);

      const columns = db.prepare(`PRAGMA table_info(leaderboard_entries)`).all() as Array<{
        name: string;
        notnull: number;
      }>;

      const gameTypeColumn = columns.find((col) => col.name === 'game_type');
      expect(gameTypeColumn?.notnull).toBe(1); // 1 = NOT NULL
    });

    it('should enforce player_address NOT NULL for leaderboard_entries', () => {
      initializeSchema(db);

      const columns = db.prepare(`PRAGMA table_info(leaderboard_entries)`).all() as Array<{
        name: string;
        notnull: number;
      }>;

      const playerAddressColumn = columns.find((col) => col.name === 'player_address');
      expect(playerAddressColumn?.notnull).toBe(1); // 1 = NOT NULL
    });

    it('should enforce score NOT NULL for leaderboard_entries', () => {
      initializeSchema(db);

      const columns = db.prepare(`PRAGMA table_info(leaderboard_entries)`).all() as Array<{
        name: string;
        notnull: number;
      }>;

      const scoreColumn = columns.find((col) => col.name === 'score');
      expect(scoreColumn?.notnull).toBe(1); // 1 = NOT NULL
    });

    it('should enforce period_type CHECK constraint (daily/weekly/alltime)', () => {
      initializeSchema(db);

      // First create a valid game_session for foreign key reference
      const validAddress = '0x1234567890123456789012345678901234567890';
      const validTxHash = '0x' + 'a'.repeat(64);
      db.prepare(
        `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
         VALUES ('session-1', 'snake', '${validAddress}', '${validTxHash}', 0.01)`
      ).run();

      // Valid period_type: 'daily'
      expect(() => {
        db.prepare(
          `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
           VALUES ('session-1', 'snake', '${validAddress}', 100, 'daily', '2026-01-24')`
        ).run();
      }).not.toThrow();

      // Valid period_type: 'weekly'
      expect(() => {
        db.prepare(
          `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
           VALUES ('session-1', 'snake', '${validAddress}', 100, 'weekly', '2026-W04')`
        ).run();
      }).not.toThrow();

      // Valid period_type: 'alltime'
      expect(() => {
        db.prepare(
          `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
           VALUES ('session-1', 'snake', '${validAddress}', 100, 'alltime', 'alltime')`
        ).run();
      }).not.toThrow();

      // Invalid period_type should fail
      expect(() => {
        db.prepare(
          `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
           VALUES ('session-1', 'snake', '${validAddress}', 100, 'invalid', '2026-01-24')`
        ).run();
      }).toThrow();
    });

    it('should enforce period_date NOT NULL for leaderboard_entries', () => {
      initializeSchema(db);

      const columns = db.prepare(`PRAGMA table_info(leaderboard_entries)`).all() as Array<{
        name: string;
        notnull: number;
      }>;

      const periodDateColumn = columns.find((col) => col.name === 'period_date');
      expect(periodDateColumn?.notnull).toBe(1); // 1 = NOT NULL
    });

    it('should auto-set created_at timestamp for leaderboard_entries', () => {
      initializeSchema(db);

      // Create a valid game_session for foreign key reference
      const validAddress = '0x1234567890123456789012345678901234567890';
      const validTxHash = '0x' + 'a'.repeat(64);
      db.prepare(
        `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
         VALUES ('session-2', 'snake', '${validAddress}', '${validTxHash}', 0.01)`
      ).run();

      // Insert leaderboard entry without specifying created_at
      db.prepare(
        `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
         VALUES ('session-2', 'snake', '${validAddress}', 200, 'daily', '2026-01-24')`
      ).run();

      const row = db
        .prepare(`SELECT created_at FROM leaderboard_entries WHERE session_id = 'session-2'`)
        .get() as {
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

    it('should enforce UNIQUE constraint on (session_id, period_type)', () => {
      initializeSchema(db);

      // Create a valid game_session for foreign key reference
      const validAddress = '0x1234567890123456789012345678901234567890';
      const validTxHash = '0x' + 'a'.repeat(64);
      db.prepare(
        `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
         VALUES ('session-3', 'snake', '${validAddress}', '${validTxHash}', 0.01)`
      ).run();

      // First insert should work
      db.prepare(
        `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
         VALUES ('session-3', 'snake', '${validAddress}', 300, 'daily', '2026-01-24')`
      ).run();

      // Second insert with same session_id and period_type should fail
      expect(() => {
        db.prepare(
          `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
           VALUES ('session-3', 'snake', '${validAddress}', 400, 'daily', '2026-01-24')`
        ).run();
      }).toThrow();

      // But different period_type should work
      expect(() => {
        db.prepare(
          `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
           VALUES ('session-3', 'snake', '${validAddress}', 400, 'weekly', '2026-W04')`
        ).run();
      }).not.toThrow();
    });

    it('should create indexes for leaderboard_entries', () => {
      initializeSchema(db);

      const indexes = db
        .prepare(
          `SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='leaderboard_entries'`
        )
        .all() as Array<{ name: string }>;

      const indexNames = indexes.map((idx) => idx.name);

      expect(indexNames).toContain('idx_leaderboard_game_period');
      expect(indexNames).toContain('idx_leaderboard_score');
    });

    it('should create idx_leaderboard_game_period composite index', () => {
      initializeSchema(db);

      const indexSql = db
        .prepare(
          `SELECT sql FROM sqlite_master WHERE type='index' AND name='idx_leaderboard_game_period'`
        )
        .get() as { sql: string } | undefined;

      expect(indexSql).toBeDefined();
      expect(indexSql?.sql).toContain('game_type');
      expect(indexSql?.sql).toContain('period_type');
      expect(indexSql?.sql).toContain('period_date');
      expect(indexSql?.sql).toContain('leaderboard_entries');
    });

    it('should create idx_leaderboard_score on score DESC', () => {
      initializeSchema(db);

      const indexSql = db
        .prepare(
          `SELECT sql FROM sqlite_master WHERE type='index' AND name='idx_leaderboard_score'`
        )
        .get() as { sql: string } | undefined;

      expect(indexSql).toBeDefined();
      expect(indexSql?.sql).toContain('score');
      expect(indexSql?.sql).toContain('DESC');
      expect(indexSql?.sql).toContain('leaderboard_entries');
    });
  });
});
