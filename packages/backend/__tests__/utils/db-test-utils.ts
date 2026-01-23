/**
 * Database Test Utilities
 *
 * Provides in-memory SQLite database utilities for fast, isolated testing.
 * Uses better-sqlite3 for synchronous operations and easy cleanup.
 */

import Database from 'better-sqlite3';

// Database schema matching the application's production schema
const SCHEMA = `
-- Game sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
    id TEXT PRIMARY KEY,
    game_type TEXT NOT NULL CHECK (game_type IN ('snake', 'tetris')),
    player_address TEXT NOT NULL,
    payment_tx_hash TEXT NOT NULL UNIQUE,
    amount_paid_usdc REAL NOT NULL,
    score INTEGER,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT,
    game_duration_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_sessions_player ON game_sessions(player_address);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON game_sessions(status);

-- Leaderboard entries table
CREATE TABLE IF NOT EXISTS leaderboard_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL REFERENCES game_sessions(id),
    game_type TEXT NOT NULL,
    player_address TEXT NOT NULL,
    score INTEGER NOT NULL,
    period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'alltime')),
    period_date TEXT NOT NULL,
    rank INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(session_id, period_type)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_game_period ON leaderboard_entries(game_type, period_type, period_date);
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard_entries(score DESC);

-- Prize pools table
CREATE TABLE IF NOT EXISTS prize_pools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_type TEXT NOT NULL,
    period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly')),
    period_date TEXT NOT NULL,
    total_amount_usdc REAL NOT NULL DEFAULT 0,
    total_games INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'finalized', 'paid')),
    winner_address TEXT,
    payout_tx_hash TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    finalized_at TEXT,
    UNIQUE(game_type, period_type, period_date)
);

-- Payments audit table
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tx_hash TEXT NOT NULL UNIQUE,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    amount_usdc REAL NOT NULL,
    purpose TEXT NOT NULL CHECK (purpose IN ('game_payment', 'prize_payout')),
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    confirmed_at TEXT
);
`;

// Type for the database connection
export type TestDatabase = Database.Database;

/**
 * Create an in-memory SQLite database for testing.
 * The database is completely isolated and ephemeral.
 *
 * @returns An in-memory SQLite database connection
 */
export function createTestDatabase(): TestDatabase {
  const db = new Database(':memory:');

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Apply the schema
  db.exec(SCHEMA);

  return db;
}

/**
 * Clear all data from the test database while preserving the schema.
 * Useful for resetting state between tests.
 *
 * @param db - The database connection to clear
 */
export function clearTestDatabase(db: TestDatabase): void {
  // Disable foreign key checks temporarily
  db.pragma('foreign_keys = OFF');

  // Delete all data from tables in correct order (respecting foreign key references)
  db.exec(`
    DELETE FROM leaderboard_entries;
    DELETE FROM payments;
    DELETE FROM prize_pools;
    DELETE FROM game_sessions;
  `);

  // Re-enable foreign key checks
  db.pragma('foreign_keys = ON');
}

/**
 * Close the test database connection.
 * Should be called after tests complete to free resources.
 *
 * @param db - The database connection to close
 */
export function closeTestDatabase(db: TestDatabase): void {
  db.close();
}

// Seed data types
export interface SeedGameSession {
  id: string;
  game_type: 'snake' | 'tetris';
  player_address: string;
  payment_tx_hash: string;
  amount_paid_usdc: number;
  score?: number | null;
  status?: 'active' | 'completed' | 'expired';
  created_at?: string;
  completed_at?: string | null;
  game_duration_ms?: number | null;
}

export interface SeedLeaderboardEntry {
  session_id: string;
  game_type: 'snake' | 'tetris';
  player_address: string;
  score: number;
  period_type: 'daily' | 'weekly' | 'alltime';
  period_date: string;
  rank?: number | null;
}

export interface SeedPrizePool {
  game_type: 'snake' | 'tetris';
  period_type: 'daily' | 'weekly';
  period_date: string;
  total_amount_usdc?: number;
  total_games?: number;
  status?: 'active' | 'finalized' | 'paid';
  winner_address?: string | null;
}

export interface SeedPayment {
  tx_hash: string;
  from_address: string;
  to_address: string;
  amount_usdc: number;
  purpose: 'game_payment' | 'prize_payout';
  status?: string;
}

export interface SeedData {
  gameSessions?: SeedGameSession[];
  leaderboardEntries?: SeedLeaderboardEntry[];
  prizePools?: SeedPrizePool[];
  payments?: SeedPayment[];
}

/**
 * Seed the test database with test data.
 * Allows quick setup of common test scenarios.
 *
 * @param db - The database connection to seed
 * @param data - The seed data to insert
 */
export function seedTestData(db: TestDatabase, data: SeedData): void {
  // Seed game sessions
  if (data.gameSessions) {
    const insertSession = db.prepare(`
      INSERT INTO game_sessions (
        id, game_type, player_address, payment_tx_hash, amount_paid_usdc,
        score, status, created_at, completed_at, game_duration_ms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const session of data.gameSessions) {
      insertSession.run(
        session.id,
        session.game_type,
        session.player_address,
        session.payment_tx_hash,
        session.amount_paid_usdc,
        session.score ?? null,
        session.status ?? 'active',
        session.created_at ?? new Date().toISOString(),
        session.completed_at ?? null,
        session.game_duration_ms ?? null
      );
    }
  }

  // Seed leaderboard entries
  if (data.leaderboardEntries) {
    const insertEntry = db.prepare(`
      INSERT INTO leaderboard_entries (
        session_id, game_type, player_address, score, period_type, period_date, rank
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const entry of data.leaderboardEntries) {
      insertEntry.run(
        entry.session_id,
        entry.game_type,
        entry.player_address,
        entry.score,
        entry.period_type,
        entry.period_date,
        entry.rank ?? null
      );
    }
  }

  // Seed prize pools
  if (data.prizePools) {
    const insertPool = db.prepare(`
      INSERT INTO prize_pools (
        game_type, period_type, period_date, total_amount_usdc, total_games, status, winner_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const pool of data.prizePools) {
      insertPool.run(
        pool.game_type,
        pool.period_type,
        pool.period_date,
        pool.total_amount_usdc ?? 0,
        pool.total_games ?? 0,
        pool.status ?? 'active',
        pool.winner_address ?? null
      );
    }
  }

  // Seed payments
  if (data.payments) {
    const insertPayment = db.prepare(`
      INSERT INTO payments (
        tx_hash, from_address, to_address, amount_usdc, purpose, status
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const payment of data.payments) {
      insertPayment.run(
        payment.tx_hash,
        payment.from_address,
        payment.to_address,
        payment.amount_usdc,
        payment.purpose,
        payment.status ?? 'pending'
      );
    }
  }
}

/**
 * Context object for withTestDatabase wrapper.
 */
export interface TestDatabaseContext {
  db: TestDatabase;
}

/**
 * Higher-order function for automatic database setup and teardown.
 * Creates a fresh in-memory database, runs the test, then cleans up.
 *
 * @param fn - The test function to run with database context
 * @returns A function that can be used as a Jest test
 */
export function withTestDatabase(
  fn: (ctx: TestDatabaseContext) => Promise<void> | void
): () => Promise<void> {
  return async () => {
    const db = createTestDatabase();
    const ctx: TestDatabaseContext = { db };

    try {
      await fn(ctx);
    } finally {
      closeTestDatabase(db);
    }
  };
}

/**
 * Create a test database with pre-seeded data.
 * Convenience function combining createTestDatabase and seedTestData.
 *
 * @param data - The seed data to insert
 * @returns An in-memory SQLite database with the seeded data
 */
export function createSeededTestDatabase(data: SeedData): TestDatabase {
  const db = createTestDatabase();
  seedTestData(db, data);
  return db;
}

// Test data generators for common scenarios
export const testDataGenerators = {
  /**
   * Generate a unique wallet address for testing.
   */
  walletAddress(index: number = 0): string {
    return '0x' + (index + 1).toString().padStart(40, '0');
  },

  /**
   * Generate a unique transaction hash for testing.
   */
  txHash(index: number = 0): string {
    return '0x' + (index + 1).toString().padStart(64, 'a');
  },

  /**
   * Generate a unique session ID for testing.
   */
  sessionId(index: number = 0): string {
    return `session_test_${index}_${Date.now()}`;
  },

  /**
   * Generate a date string for testing (today - daysAgo).
   */
  dateString(daysAgo: number = 0): string {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  },

  /**
   * Generate a complete game session for seeding.
   */
  gameSession(index: number = 0, overrides: Partial<SeedGameSession> = {}): SeedGameSession {
    return {
      id: this.sessionId(index),
      game_type: index % 2 === 0 ? 'snake' : 'tetris',
      player_address: this.walletAddress(index),
      payment_tx_hash: this.txHash(index),
      amount_paid_usdc: index % 2 === 0 ? 0.01 : 0.02,
      score: null,
      status: 'active',
      ...overrides,
    };
  },

  /**
   * Generate multiple game sessions for seeding.
   */
  gameSessions(count: number, overrides: Partial<SeedGameSession> = {}): SeedGameSession[] {
    return Array.from({ length: count }, (_, i) => this.gameSession(i, overrides));
  },
};
