/**
 * Database Schema Definitions
 *
 * SQL table schemas for the x402Arcade application.
 * All tables use SQLite with better-sqlite3.
 *
 * @module db/schema
 */

import type { Database as DatabaseType } from 'better-sqlite3';

/**
 * Game Sessions Table Schema
 *
 * Tracks individual paid game sessions. Each row represents one game play
 * that was paid for via x402 payment protocol.
 *
 * Columns:
 * - id: Unique session identifier (UUID)
 * - game_type: Type of game played (snake, tetris, pong, breakout, space-invaders)
 * - player_address: Ethereum address of the player
 * - payment_tx_hash: On-chain transaction hash for payment verification
 * - amount_paid_usdc: Amount paid in USDC (decimal, e.g., 0.01)
 * - score: Final score achieved (NULL if game not completed)
 * - status: Session status (active, completed, expired)
 * - created_at: ISO timestamp when session was created
 * - completed_at: ISO timestamp when game ended (NULL if active)
 * - game_duration_ms: Duration of game in milliseconds (NULL if not completed)
 */
export const GAME_SESSIONS_TABLE = `
CREATE TABLE IF NOT EXISTS game_sessions (
    id TEXT PRIMARY KEY,
    game_type TEXT NOT NULL CHECK (game_type IN ('snake', 'tetris', 'pong', 'breakout', 'space-invaders')),
    player_address TEXT NOT NULL,
    payment_tx_hash TEXT NOT NULL UNIQUE,
    amount_paid_usdc REAL NOT NULL,
    score INTEGER,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT,
    game_duration_ms INTEGER
);
`;

/**
 * Game Sessions Indexes
 *
 * Optimizes common query patterns:
 * - Player lookup: Find all sessions for a player
 * - Status filtering: Find active/completed/expired sessions
 */
export const GAME_SESSIONS_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_sessions_player ON game_sessions(player_address);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_game_type ON game_sessions(game_type);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON game_sessions(created_at);
`;

/**
 * Initialize database schema
 *
 * Creates all tables and indexes if they don't exist.
 * Safe to call multiple times (uses IF NOT EXISTS).
 *
 * @param db - better-sqlite3 database instance
 */
export function initializeSchema(db: DatabaseType): void {
  // Create game_sessions table
  db.exec(GAME_SESSIONS_TABLE);

  // Create indexes for game_sessions
  db.exec(GAME_SESSIONS_INDEXES);
}
