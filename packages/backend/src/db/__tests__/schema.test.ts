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
      expect(indexNames).toContain('idx_leaderboard_player');
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

    it('should create idx_leaderboard_player on player_address', () => {
      initializeSchema(db);

      const indexSql = db
        .prepare(
          `SELECT sql FROM sqlite_master WHERE type='index' AND name='idx_leaderboard_player'`
        )
        .get() as { sql: string } | undefined;

      expect(indexSql).toBeDefined();
      expect(indexSql?.sql).toContain('player_address');
      expect(indexSql?.sql).toContain('leaderboard_entries');
    });

    it('should enforce UNIQUE constraint on (game_type, player_address, period_type, period_date)', () => {
      initializeSchema(db);

      // Create game sessions for foreign key references
      const validAddress = '0x1234567890123456789012345678901234567890';
      const validTxHash1 = '0x' + 'a'.repeat(64);
      const validTxHash2 = '0x' + 'b'.repeat(64);

      db.prepare(
        `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
         VALUES ('session-unique-1', 'snake', '${validAddress}', '${validTxHash1}', 0.01)`
      ).run();

      db.prepare(
        `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
         VALUES ('session-unique-2', 'snake', '${validAddress}', '${validTxHash2}', 0.01)`
      ).run();

      // First entry should succeed
      db.prepare(
        `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
         VALUES ('session-unique-1', 'snake', '${validAddress}', 500, 'daily', '2026-01-24')`
      ).run();

      // Second entry with same game/player/period should fail (even with different session_id)
      expect(() => {
        db.prepare(
          `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
           VALUES ('session-unique-2', 'snake', '${validAddress}', 600, 'daily', '2026-01-24')`
        ).run();
      }).toThrow();

      // But different period_type should work
      expect(() => {
        db.prepare(
          `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
           VALUES ('session-unique-2', 'snake', '${validAddress}', 600, 'weekly', '2026-W04')`
        ).run();
      }).not.toThrow();
    });

    it('should allow UPSERT pattern with INSERT OR REPLACE for high scores', () => {
      initializeSchema(db);

      const validAddress = '0x1234567890123456789012345678901234567890';
      const validTxHash1 = '0x' + 'c'.repeat(64);
      const validTxHash2 = '0x' + 'd'.repeat(64);

      // Create two game sessions
      db.prepare(
        `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
         VALUES ('session-upsert-1', 'tetris', '${validAddress}', '${validTxHash1}', 0.02)`
      ).run();

      db.prepare(
        `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
         VALUES ('session-upsert-2', 'tetris', '${validAddress}', '${validTxHash2}', 0.02)`
      ).run();

      // Insert initial score
      db.prepare(
        `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
         VALUES ('session-upsert-1', 'tetris', '${validAddress}', 1000, 'daily', '2026-01-24')`
      ).run();

      // Verify initial entry exists
      let entry = db
        .prepare(
          `SELECT score, session_id FROM leaderboard_entries
           WHERE game_type='tetris' AND player_address='${validAddress}' AND period_type='daily' AND period_date='2026-01-24'`
        )
        .get() as { score: number; session_id: string };

      expect(entry.score).toBe(1000);
      expect(entry.session_id).toBe('session-upsert-1');

      // Use INSERT OR REPLACE to update with higher score
      db.prepare(
        `INSERT OR REPLACE INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
         VALUES ('session-upsert-2', 'tetris', '${validAddress}', 2000, 'daily', '2026-01-24')`
      ).run();

      // Verify entry was replaced (score and session_id updated)
      entry = db
        .prepare(
          `SELECT score, session_id FROM leaderboard_entries
           WHERE game_type='tetris' AND player_address='${validAddress}' AND period_type='daily' AND period_date='2026-01-24'`
        )
        .get() as { score: number; session_id: string };

      expect(entry.score).toBe(2000);
      expect(entry.session_id).toBe('session-upsert-2');

      // Verify only ONE entry exists for this player/game/period
      const count = db
        .prepare(
          `SELECT COUNT(*) as count FROM leaderboard_entries
           WHERE game_type='tetris' AND player_address='${validAddress}' AND period_type='daily' AND period_date='2026-01-24'`
        )
        .get() as { count: number };

      expect(count.count).toBe(1);
    });

    it('should allow different players to have entries for same game/period', () => {
      initializeSchema(db);

      const player1 = '0x1111111111111111111111111111111111111111';
      const player2 = '0x2222222222222222222222222222222222222222';
      const validTxHash1 = '0x' + 'e'.repeat(64);
      const validTxHash2 = '0x' + 'f'.repeat(64);

      // Create game sessions for both players
      db.prepare(
        `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
         VALUES ('session-multi-1', 'pong', '${player1}', '${validTxHash1}', 0.01)`
      ).run();

      db.prepare(
        `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc)
         VALUES ('session-multi-2', 'pong', '${player2}', '${validTxHash2}', 0.01)`
      ).run();

      // Both players should be able to have entries for the same game/period
      expect(() => {
        db.prepare(
          `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
           VALUES ('session-multi-1', 'pong', '${player1}', 15, 'daily', '2026-01-24')`
        ).run();
      }).not.toThrow();

      expect(() => {
        db.prepare(
          `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date)
           VALUES ('session-multi-2', 'pong', '${player2}', 18, 'daily', '2026-01-24')`
        ).run();
      }).not.toThrow();

      // Verify both entries exist
      const count = db
        .prepare(
          `SELECT COUNT(*) as count FROM leaderboard_entries
           WHERE game_type='pong' AND period_type='daily' AND period_date='2026-01-24'`
        )
        .get() as { count: number };

      expect(count.count).toBe(2);
    });

    it('should create prize_pools table', () => {
      initializeSchema(db);

      const tableExists = db
        .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='prize_pools'`)
        .get();

      expect(tableExists).toBeDefined();
      expect(tableExists).toHaveProperty('name', 'prize_pools');
    });

    it('should create prize_pools table with correct columns', () => {
      initializeSchema(db);

      const columns = db.prepare(`PRAGMA table_info(prize_pools)`).all() as Array<{
        name: string;
        type: string;
        notnull: number;
        dflt_value: string | null;
        pk: number;
      }>;

      const columnNames = columns.map((col) => col.name);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('game_type');
      expect(columnNames).toContain('period_type');
      expect(columnNames).toContain('period_date');
      expect(columnNames).toContain('total_amount_usdc');
      expect(columnNames).toContain('total_games');
      expect(columnNames).toContain('status');
      expect(columnNames).toContain('winner_address');
      expect(columnNames).toContain('payout_tx_hash');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('finalized_at');
    });

    it('should set id as primary key AUTOINCREMENT for prize_pools', () => {
      initializeSchema(db);

      const columns = db.prepare(`PRAGMA table_info(prize_pools)`).all() as Array<{
        name: string;
        type: string;
        pk: number;
      }>;

      const idColumn = columns.find((col) => col.name === 'id');
      expect(idColumn?.type).toBe('INTEGER');
      expect(idColumn?.pk).toBe(1);
    });

    it('should enforce period_type CHECK constraint for prize_pools (daily/weekly only)', () => {
      initializeSchema(db);

      // Valid: 'daily'
      expect(() => {
        db.prepare(
          `INSERT INTO prize_pools (game_type, period_type, period_date)
           VALUES ('snake', 'daily', '2026-01-24')`
        ).run();
      }).not.toThrow();

      // Valid: 'weekly'
      expect(() => {
        db.prepare(
          `INSERT INTO prize_pools (game_type, period_type, period_date)
           VALUES ('tetris', 'weekly', '2026-W04')`
        ).run();
      }).not.toThrow();

      // Invalid: 'alltime' (prize pools are only for daily/weekly, not alltime)
      expect(() => {
        db.prepare(
          `INSERT INTO prize_pools (game_type, period_type, period_date)
           VALUES ('pong', 'alltime', 'alltime')`
        ).run();
      }).toThrow();

      // Invalid: random value
      expect(() => {
        db.prepare(
          `INSERT INTO prize_pools (game_type, period_type, period_date)
           VALUES ('breakout', 'invalid', '2026-01-24')`
        ).run();
      }).toThrow();
    });

    it('should default total_amount_usdc to 0 for prize_pools', () => {
      initializeSchema(db);

      db.prepare(
        `INSERT INTO prize_pools (game_type, period_type, period_date)
         VALUES ('snake', 'daily', '2026-01-24')`
      ).run();

      const row = db
        .prepare(
          `SELECT total_amount_usdc FROM prize_pools
           WHERE game_type='snake' AND period_type='daily' AND period_date='2026-01-24'`
        )
        .get() as { total_amount_usdc: number };

      expect(row.total_amount_usdc).toBe(0);
    });

    it('should default total_games to 0 for prize_pools', () => {
      initializeSchema(db);

      db.prepare(
        `INSERT INTO prize_pools (game_type, period_type, period_date)
         VALUES ('tetris', 'weekly', '2026-W04')`
      ).run();

      const row = db
        .prepare(
          `SELECT total_games FROM prize_pools
           WHERE game_type='tetris' AND period_type='weekly' AND period_date='2026-W04'`
        )
        .get() as { total_games: number };

      expect(row.total_games).toBe(0);
    });

    it('should enforce status CHECK constraint for prize_pools (active/finalized/paid)', () => {
      initializeSchema(db);

      // Valid: 'active' (default)
      expect(() => {
        db.prepare(
          `INSERT INTO prize_pools (game_type, period_type, period_date, status)
           VALUES ('snake', 'daily', '2026-01-25', 'active')`
        ).run();
      }).not.toThrow();

      // Valid: 'finalized'
      expect(() => {
        db.prepare(
          `INSERT INTO prize_pools (game_type, period_type, period_date, status)
           VALUES ('tetris', 'daily', '2026-01-25', 'finalized')`
        ).run();
      }).not.toThrow();

      // Valid: 'paid'
      expect(() => {
        db.prepare(
          `INSERT INTO prize_pools (game_type, period_type, period_date, status)
           VALUES ('pong', 'daily', '2026-01-25', 'paid')`
        ).run();
      }).not.toThrow();

      // Invalid: random status
      expect(() => {
        db.prepare(
          `INSERT INTO prize_pools (game_type, period_type, period_date, status)
           VALUES ('breakout', 'daily', '2026-01-25', 'invalid')`
        ).run();
      }).toThrow();
    });

    it('should default status to active for prize_pools', () => {
      initializeSchema(db);

      db.prepare(
        `INSERT INTO prize_pools (game_type, period_type, period_date)
         VALUES ('snake', 'daily', '2026-01-26')`
      ).run();

      const row = db
        .prepare(
          `SELECT status FROM prize_pools
           WHERE game_type='snake' AND period_type='daily' AND period_date='2026-01-26'`
        )
        .get() as { status: string };

      expect(row.status).toBe('active');
    });

    it('should auto-set created_at timestamp for prize_pools', () => {
      initializeSchema(db);

      db.prepare(
        `INSERT INTO prize_pools (game_type, period_type, period_date)
         VALUES ('tetris', 'daily', '2026-01-27')`
      ).run();

      const row = db
        .prepare(
          `SELECT created_at FROM prize_pools
           WHERE game_type='tetris' AND period_type='daily' AND period_date='2026-01-27'`
        )
        .get() as { created_at: string };

      expect(row.created_at).toBeDefined();
      expect(row.created_at).not.toBeNull();
      expect(row.created_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);

      const createdDate = new Date(row.created_at + 'Z');
      const now = new Date();
      const diffMs = now.getTime() - createdDate.getTime();
      expect(diffMs).toBeLessThan(5000);
      expect(diffMs).toBeGreaterThanOrEqual(0);
    });

    it('should enforce UNIQUE constraint on (game_type, period_type, period_date) for prize_pools', () => {
      initializeSchema(db);

      // First insert should succeed
      db.prepare(
        `INSERT INTO prize_pools (game_type, period_type, period_date)
         VALUES ('snake', 'daily', '2026-01-28')`
      ).run();

      // Second insert with same game/period should fail
      expect(() => {
        db.prepare(
          `INSERT INTO prize_pools (game_type, period_type, period_date)
           VALUES ('snake', 'daily', '2026-01-28')`
        ).run();
      }).toThrow();

      // But different game_type should work
      expect(() => {
        db.prepare(
          `INSERT INTO prize_pools (game_type, period_type, period_date)
           VALUES ('tetris', 'daily', '2026-01-28')`
        ).run();
      }).not.toThrow();

      // And different period_type should work
      expect(() => {
        db.prepare(
          `INSERT INTO prize_pools (game_type, period_type, period_date)
           VALUES ('snake', 'weekly', '2026-W04')`
        ).run();
      }).not.toThrow();

      // And different period_date should work
      expect(() => {
        db.prepare(
          `INSERT INTO prize_pools (game_type, period_type, period_date)
           VALUES ('snake', 'daily', '2026-01-29')`
        ).run();
      }).not.toThrow();
    });

    it('should allow NULL for winner_address and payout_tx_hash in prize_pools', () => {
      initializeSchema(db);

      db.prepare(
        `INSERT INTO prize_pools (game_type, period_type, period_date, winner_address, payout_tx_hash)
         VALUES ('snake', 'daily', '2026-01-30', NULL, NULL)`
      ).run();

      const row = db
        .prepare(
          `SELECT winner_address, payout_tx_hash FROM prize_pools
           WHERE game_type='snake' AND period_type='daily' AND period_date='2026-01-30'`
        )
        .get() as { winner_address: string | null; payout_tx_hash: string | null };

      expect(row.winner_address).toBeNull();
      expect(row.payout_tx_hash).toBeNull();
    });

    it('should create indexes for prize_pools', () => {
      initializeSchema(db);

      const indexes = db
        .prepare(`SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='prize_pools'`)
        .all() as Array<{ name: string }>;

      const indexNames = indexes.map((idx) => idx.name);

      expect(indexNames).toContain('idx_prize_pools_status');
      expect(indexNames).toContain('idx_prize_pools_game_period');
    });

    it('should create idx_prize_pools_status on status column', () => {
      initializeSchema(db);

      const indexSql = db
        .prepare(
          `SELECT sql FROM sqlite_master WHERE type='index' AND name='idx_prize_pools_status'`
        )
        .get() as { sql: string } | undefined;

      expect(indexSql).toBeDefined();
      expect(indexSql?.sql).toContain('status');
      expect(indexSql?.sql).toContain('prize_pools');
    });

    it('should create idx_prize_pools_game_period composite index', () => {
      initializeSchema(db);

      const indexSql = db
        .prepare(
          `SELECT sql FROM sqlite_master WHERE type='index' AND name='idx_prize_pools_game_period'`
        )
        .get() as { sql: string } | undefined;

      expect(indexSql).toBeDefined();
      expect(indexSql?.sql).toContain('game_type');
      expect(indexSql?.sql).toContain('period_type');
      expect(indexSql?.sql).toContain('period_date');
      expect(indexSql?.sql).toContain('prize_pools');
    });
  });

  describe('payments table', () => {
    it('should create payments table with all columns', () => {
      initializeSchema(db);

      const columns = db.prepare(`PRAGMA table_info(payments)`).all() as Array<{
        name: string;
        type: string;
        notnull: number;
        dflt_value: string | null;
      }>;

      const columnNames = columns.map((col) => col.name);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('tx_hash');
      expect(columnNames).toContain('from_address');
      expect(columnNames).toContain('to_address');
      expect(columnNames).toContain('amount_usdc');
      expect(columnNames).toContain('purpose');
      expect(columnNames).toContain('status');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('confirmed_at');
    });

    it('should enforce AUTOINCREMENT on payments.id', () => {
      initializeSchema(db);

      db.prepare(
        `INSERT INTO payments (tx_hash, from_address, to_address, amount_usdc, purpose)
         VALUES ('0x1234', '0xplayer', '0xarcade', 0.01, 'game_payment')`
      ).run();

      db.prepare(
        `INSERT INTO payments (tx_hash, from_address, to_address, amount_usdc, purpose)
         VALUES ('0x5678', '0xplayer', '0xarcade', 0.02, 'game_payment')`
      ).run();

      const rows = db.prepare(`SELECT id FROM payments ORDER BY id`).all() as Array<{ id: number }>;

      expect(rows[0].id).toBe(1);
      expect(rows[1].id).toBe(2);
    });

    it('should enforce UNIQUE constraint on tx_hash', () => {
      initializeSchema(db);

      db.prepare(
        `INSERT INTO payments (tx_hash, from_address, to_address, amount_usdc, purpose)
         VALUES ('0xabc123', '0xplayer', '0xarcade', 0.01, 'game_payment')`
      ).run();

      // Duplicate tx_hash should fail
      expect(() => {
        db.prepare(
          `INSERT INTO payments (tx_hash, from_address, to_address, amount_usdc, purpose)
           VALUES ('0xabc123', '0xanother', '0xarcade', 0.02, 'game_payment')`
        ).run();
      }).toThrow();
    });

    it('should enforce NOT NULL constraints on required fields', () => {
      initializeSchema(db);

      // Missing tx_hash
      expect(() => {
        db.prepare(
          `INSERT INTO payments (from_address, to_address, amount_usdc, purpose)
           VALUES ('0xplayer', '0xarcade', 0.01, 'game_payment')`
        ).run();
      }).toThrow();

      // Missing from_address
      expect(() => {
        db.prepare(
          `INSERT INTO payments (tx_hash, to_address, amount_usdc, purpose)
           VALUES ('0x1111', '0xarcade', 0.01, 'game_payment')`
        ).run();
      }).toThrow();

      // Missing to_address
      expect(() => {
        db.prepare(
          `INSERT INTO payments (tx_hash, from_address, amount_usdc, purpose)
           VALUES ('0x2222', '0xplayer', 0.01, 'game_payment')`
        ).run();
      }).toThrow();

      // Missing amount_usdc
      expect(() => {
        db.prepare(
          `INSERT INTO payments (tx_hash, from_address, to_address, purpose)
           VALUES ('0x3333', '0xplayer', '0xarcade', 'game_payment')`
        ).run();
      }).toThrow();

      // Missing purpose
      expect(() => {
        db.prepare(
          `INSERT INTO payments (tx_hash, from_address, to_address, amount_usdc)
           VALUES ('0x4444', '0xplayer', '0xarcade', 0.01)`
        ).run();
      }).toThrow();
    });

    it('should enforce CHECK constraint on amount_usdc (positive only)', () => {
      initializeSchema(db);

      // Positive amount should work
      expect(() => {
        db.prepare(
          `INSERT INTO payments (tx_hash, from_address, to_address, amount_usdc, purpose)
           VALUES ('0xpositive', '0xplayer', '0xarcade', 0.01, 'game_payment')`
        ).run();
      }).not.toThrow();

      // Zero amount should fail
      expect(() => {
        db.prepare(
          `INSERT INTO payments (tx_hash, from_address, to_address, amount_usdc, purpose)
           VALUES ('0xzero', '0xplayer', '0xarcade', 0, 'game_payment')`
        ).run();
      }).toThrow();

      // Negative amount should fail
      expect(() => {
        db.prepare(
          `INSERT INTO payments (tx_hash, from_address, to_address, amount_usdc, purpose)
           VALUES ('0xnegative', '0xplayer', '0xarcade', -0.01, 'game_payment')`
        ).run();
      }).toThrow();
    });

    it('should enforce CHECK constraint on purpose (game_payment or prize_payout)', () => {
      initializeSchema(db);

      // Valid purpose: game_payment
      expect(() => {
        db.prepare(
          `INSERT INTO payments (tx_hash, from_address, to_address, amount_usdc, purpose)
           VALUES ('0xgame1', '0xplayer', '0xarcade', 0.01, 'game_payment')`
        ).run();
      }).not.toThrow();

      // Valid purpose: prize_payout
      expect(() => {
        db.prepare(
          `INSERT INTO payments (tx_hash, from_address, to_address, amount_usdc, purpose)
           VALUES ('0xprize1', '0xarcade', '0xwinner', 10.0, 'prize_payout')`
        ).run();
      }).not.toThrow();

      // Invalid purpose
      expect(() => {
        db.prepare(
          `INSERT INTO payments (tx_hash, from_address, to_address, amount_usdc, purpose)
           VALUES ('0xinvalid', '0xplayer', '0xarcade', 0.01, 'refund')`
        ).run();
      }).toThrow();
    });

    it('should enforce CHECK constraint on status (pending, confirmed, failed)', () => {
      initializeSchema(db);

      // Valid status: pending (default)
      const result1 = db
        .prepare(
          `INSERT INTO payments (tx_hash, from_address, to_address, amount_usdc, purpose)
           VALUES ('0xstatus1', '0xplayer', '0xarcade', 0.01, 'game_payment')`
        )
        .run();

      const row1 = db
        .prepare(`SELECT status FROM payments WHERE id = ?`)
        .get(result1.lastInsertRowid) as { status: string };
      expect(row1.status).toBe('pending');

      // Valid status: confirmed
      expect(() => {
        db.prepare(
          `INSERT INTO payments (tx_hash, from_address, to_address, amount_usdc, purpose, status)
           VALUES ('0xstatus2', '0xplayer', '0xarcade', 0.01, 'game_payment', 'confirmed')`
        ).run();
      }).not.toThrow();

      // Valid status: failed
      expect(() => {
        db.prepare(
          `INSERT INTO payments (tx_hash, from_address, to_address, amount_usdc, purpose, status)
           VALUES ('0xstatus3', '0xplayer', '0xarcade', 0.01, 'game_payment', 'failed')`
        ).run();
      }).not.toThrow();

      // Invalid status
      expect(() => {
        db.prepare(
          `INSERT INTO payments (tx_hash, from_address, to_address, amount_usdc, purpose, status)
           VALUES ('0xstatus4', '0xplayer', '0xarcade', 0.01, 'game_payment', 'processing')`
        ).run();
      }).toThrow();
    });

    it('should auto-set created_at with ISO 8601 format', () => {
      initializeSchema(db);

      const beforeInsert = new Date();

      const result = db
        .prepare(
          `INSERT INTO payments (tx_hash, from_address, to_address, amount_usdc, purpose)
           VALUES ('0xtime1', '0xplayer', '0xarcade', 0.01, 'game_payment')`
        )
        .run();

      const afterInsert = new Date();

      const row = db
        .prepare(`SELECT created_at FROM payments WHERE id = ?`)
        .get(result.lastInsertRowid) as { created_at: string };

      expect(row.created_at).toBeDefined();
      expect(row.created_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);

      const createdDate = new Date(row.created_at + 'Z'); // Add Z for UTC
      expect(createdDate.getTime()).toBeGreaterThanOrEqual(beforeInsert.getTime() - 5000);
      expect(createdDate.getTime()).toBeLessThanOrEqual(afterInsert.getTime() + 5000);
    });

    it('should allow NULL for confirmed_at', () => {
      initializeSchema(db);

      const result = db
        .prepare(
          `INSERT INTO payments (tx_hash, from_address, to_address, amount_usdc, purpose, confirmed_at)
           VALUES ('0xconfirm1', '0xplayer', '0xarcade', 0.01, 'game_payment', NULL)`
        )
        .run();

      const row = db
        .prepare(`SELECT confirmed_at FROM payments WHERE id = ?`)
        .get(result.lastInsertRowid) as { confirmed_at: string | null };

      expect(row.confirmed_at).toBeNull();
    });

    it('should accept ISO 8601 timestamps for confirmed_at', () => {
      initializeSchema(db);

      const confirmedTime = '2026-01-24 15:30:00';

      const result = db
        .prepare(
          `INSERT INTO payments (tx_hash, from_address, to_address, amount_usdc, purpose, confirmed_at)
           VALUES ('0xconfirm2', '0xplayer', '0xarcade', 0.01, 'game_payment', ?)`
        )
        .run(confirmedTime);

      const row = db
        .prepare(`SELECT confirmed_at FROM payments WHERE id = ?`)
        .get(result.lastInsertRowid) as { confirmed_at: string };

      expect(row.confirmed_at).toBe(confirmedTime);
    });

    it('should create indexes for payments', () => {
      initializeSchema(db);

      const indexes = db
        .prepare(`SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='payments'`)
        .all() as Array<{ name: string }>;

      const indexNames = indexes.map((idx) => idx.name);

      expect(indexNames).toContain('idx_payments_tx_hash');
      expect(indexNames).toContain('idx_payments_from_address');
      expect(indexNames).toContain('idx_payments_purpose_status');
      expect(indexNames).toContain('idx_payments_created_at');
    });

    it('should support audit trail queries (revenue calculation)', () => {
      initializeSchema(db);

      // Insert test payments
      db.prepare(
        `INSERT INTO payments (tx_hash, from_address, to_address, amount_usdc, purpose, status)
         VALUES ('0xrev1', '0xplayer1', '0xarcade', 0.01, 'game_payment', 'confirmed')`
      ).run();

      db.prepare(
        `INSERT INTO payments (tx_hash, from_address, to_address, amount_usdc, purpose, status)
         VALUES ('0xrev2', '0xplayer2', '0xarcade', 0.02, 'game_payment', 'confirmed')`
      ).run();

      db.prepare(
        `INSERT INTO payments (tx_hash, from_address, to_address, amount_usdc, purpose, status)
         VALUES ('0xrev3', '0xplayer3', '0xarcade', 0.01, 'game_payment', 'pending')`
      ).run();

      db.prepare(
        `INSERT INTO payments (tx_hash, from_address, to_address, amount_usdc, purpose, status)
         VALUES ('0xprize1', '0xarcade', '0xwinner', 5.0, 'prize_payout', 'confirmed')`
      ).run();

      // Revenue calculation: confirmed game payments only
      const revenue = db
        .prepare(
          `SELECT SUM(amount_usdc) as total FROM payments
           WHERE purpose = 'game_payment' AND status = 'confirmed'`
        )
        .get() as { total: number };

      expect(revenue.total).toBe(0.03); // 0.01 + 0.02
    });

    it('should support transaction verification by tx_hash', () => {
      initializeSchema(db);

      const txHash = '0xverify123abc456def';

      db.prepare(
        `INSERT INTO payments (tx_hash, from_address, to_address, amount_usdc, purpose)
         VALUES (?, '0xplayer', '0xarcade', 0.01, 'game_payment')`
      ).run(txHash);

      const row = db.prepare(`SELECT * FROM payments WHERE tx_hash = ?`).get(txHash) as {
        tx_hash: string;
        from_address: string;
        to_address: string;
        amount_usdc: number;
      };

      expect(row).toBeDefined();
      expect(row.tx_hash).toBe(txHash);
      expect(row.from_address).toBe('0xplayer');
      expect(row.to_address).toBe('0xarcade');
      expect(row.amount_usdc).toBe(0.01);
    });
  });
});
