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
 * - player_address: Ethereum address of the player (42-char hex: 0x + 40 hex digits, lowercase for consistency)
 * - payment_tx_hash: On-chain transaction hash for payment verification (66-char hex: 0x + 64 hex digits, UNIQUE to prevent replay)
 * - amount_paid_usdc: Amount paid in USDC (REAL, decimal precision, e.g., 0.01, 0.02)
 *     - Stored as REAL (floating point) for human-readable decimal values
 *     - CHECK constraint ensures positive amounts only
 *     - Note: For critical financial calculations, atomic units (INTEGER) would provide exact precision
 *     - For this arcade application, REAL is acceptable as amounts are small ($0.01-$0.02)
 * - score: Final score achieved by the player (INTEGER, NULL until game completion)
 *     - NULL indicates game has not yet been completed
 *     - Only set when player finishes the game and submits their score
 *     - CHECK constraint ensures non-negative scores (score >= 0 when not NULL)
 *     - Application layer performs additional game-specific validation (e.g., max scores per game type)
 * - status: Session lifecycle status (TEXT NOT NULL DEFAULT 'active')
 *     - CHECK constraint enforces one of: 'active', 'completed', 'expired'
 *     - Status transitions:
 *       1. 'active' (default): Game session created after payment, player is playing
 *       2. 'completed': Player finished game and submitted score (score becomes non-NULL)
 *       3. 'expired': Session timed out without score submission (SESSION_EXPIRY_MINUTES passed)
 *     - State machine rules:
 *       - active → completed (when score submitted)
 *       - active → expired (when timeout occurs without completion)
 *       - completed/expired are terminal states (no further transitions)
 * - created_at: Session creation timestamp (TEXT NOT NULL DEFAULT datetime('now'))
 *     - ISO 8601 format: 'YYYY-MM-DD HH:MM:SS' (e.g., '2026-01-24 14:30:45')
 *     - SQLite datetime('now') generates UTC timestamps
 *     - Automatically set when row is inserted
 * - completed_at: Session completion timestamp (TEXT, NULL if not completed)
 *     - NULL when status is 'active' (game still in progress)
 *     - Set when status transitions to 'completed' or 'expired'
 *     - ISO 8601 format, same as created_at
 *     - Application layer should set this when finalizing the session
 * - game_duration_ms: Duration of game in milliseconds (NULL if not completed)
 *
 * Address Format Notes:
 * - All addresses should be stored in lowercase for consistent querying
 * - Application code should normalize addresses to lowercase before insertion
 * - Queries can use case-insensitive LIKE or direct equality since all are lowercase
 */
export const GAME_SESSIONS_TABLE = `
CREATE TABLE IF NOT EXISTS game_sessions (
    id TEXT PRIMARY KEY,
    game_type TEXT NOT NULL CHECK (game_type IN ('snake', 'tetris', 'pong', 'breakout', 'space-invaders')),
    player_address TEXT NOT NULL CHECK (
        length(player_address) = 42 AND
        player_address LIKE '0x%' AND
        player_address = lower(player_address)
    ),
    payment_tx_hash TEXT NOT NULL UNIQUE CHECK (
        length(payment_tx_hash) = 66 AND
        payment_tx_hash LIKE '0x%'
    ),
    amount_paid_usdc REAL NOT NULL CHECK (amount_paid_usdc > 0),
    score INTEGER CHECK (score IS NULL OR score >= 0),
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
 * - Player lookup: Find all sessions for a player (idx_sessions_player)
 * - Status filtering: Find active/completed/expired sessions (idx_sessions_status)
 * - Game type filtering: Find sessions by game type (idx_sessions_game_type)
 * - Chronological ordering: Sort sessions by creation time descending (idx_sessions_created)
 *     - DESC ordering optimizes "most recent first" queries (common pattern for leaderboards, history)
 */
export const GAME_SESSIONS_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_sessions_player ON game_sessions(player_address);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_game_type ON game_sessions(game_type);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON game_sessions(created_at DESC);
`;

/**
 * Leaderboard Entries Table Schema
 *
 * Denormalized table for efficient leaderboard queries. This table stores
 * high scores from completed game sessions, duplicating some data to avoid
 * expensive joins when displaying leaderboards.
 *
 * Denormalization Strategy:
 * - Data is written once per completed game session (insert-only, no updates)
 * - Duplicates game_type, player_address, and score from game_sessions
 * - Enables fast leaderboard queries without JOIN operations
 * - Trade-off: slight storage increase for significant query performance gain
 *
 * Columns:
 * - id: Auto-incrementing primary key
 * - session_id: Reference to game_sessions.id (the source of this leaderboard entry)
 *     - Foreign key constraint ensures referential integrity
 *     - UNIQUE constraint with period_type prevents duplicate entries for same session/period
 * - game_type: Denormalized from game_sessions (snake, tetris, pong, breakout, space-invaders)
 *     - Allows filtering leaderboards by game without JOIN
 * - player_address: Denormalized from game_sessions (42-char hex, lowercase)
 *     - Allows player identification without JOIN
 * - score: Denormalized from game_sessions (INTEGER NOT NULL)
 *     - The score achieved in this game session
 *     - Must be non-negative (validated at game_sessions level)
 * - period_type: Leaderboard period ('daily', 'weekly', 'alltime')
 *     - CHECK constraint enforces valid period types
 *     - Same session can appear in multiple period types (daily, weekly, alltime)
 * - period_date: Period identifier (TEXT NOT NULL)
 *     - Format: 'YYYY-MM-DD' for daily (e.g., '2026-01-24')
 *     - Format: 'YYYY-WXX' for weekly (e.g., '2026-W04' for week 4)
 *     - Value: 'alltime' for all-time leaderboard
 *     - Used with period_type to partition leaderboards by time
 * - rank: Calculated rank within the period (INTEGER, nullable)
 *     - NULL when entry is first created
 *     - Updated by cron job that recalculates rankings periodically
 *     - Lower number = higher rank (1 = first place)
 * - created_at: Timestamp when entry was added (TEXT NOT NULL, auto-set)
 *     - ISO 8601 format: 'YYYY-MM-DD HH:MM:SS'
 *     - UTC timezone
 *
 * Constraints:
 * - UNIQUE(session_id, period_type): Prevents duplicate entries for same session/period
 *     - A session can appear once per period type (once in daily, once in weekly, once in alltime)
 * - UNIQUE(game_type, player_address, period_type, period_date): Ensures one entry per player per game per period
 *     - Enables UPSERT pattern: when player plays multiple times, keep only their highest score
 *     - Application should use INSERT OR REPLACE to update entries when new high score is achieved
 *     - This constraint takes precedence: if player plays multiple sessions, only the best score remains
 *
 * UPSERT Pattern (Application Logic):
 * When a player completes a game session:
 * 1. Check if player already has an entry for this game/period
 * 2. If yes and new score > existing score: UPDATE entry (or INSERT OR REPLACE)
 * 3. If yes and new score <= existing score: Skip insertion
 * 4. If no: INSERT new entry
 *
 * Note: With UNIQUE(game_type, player_address, period_type, period_date), attempting to insert
 * a second entry for the same player/game/period will fail unless using INSERT OR REPLACE
 *
 * Partitioning Strategy (for large datasets):
 * - Current approach: Single table with period_type and period_date columns
 * - For future scaling (millions of entries):
 *     1. Partition by period_type (separate tables: leaderboard_daily, leaderboard_weekly, leaderboard_alltime)
 *     2. Archive old periods (move completed daily/weekly periods to archive tables)
 *     3. Use table partitioning features in production database (e.g., PostgreSQL PARTITION BY)
 * - SQLite does not support native partitioning, so manual table splitting would be needed
 * - For hackathon demo, single table is sufficient
 */
export const LEADERBOARD_ENTRIES_TABLE = `
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
    UNIQUE(session_id, period_type),
    UNIQUE(game_type, player_address, period_type, period_date)
);
`;

/**
 * Leaderboard Entries Indexes
 *
 * Optimizes leaderboard query patterns:
 * - Game + period lookup: Find leaderboard for specific game and time period (idx_leaderboard_game_period)
 * - Score ordering: Sort entries by score descending (highest scores first) (idx_leaderboard_score)
 * - Player lookup: Find all leaderboard entries for a specific player (idx_leaderboard_player)
 *
 * Composite Index Strategy:
 * - idx_leaderboard_game_period is a composite index on (game_type, period_type, period_date)
 * - This index can be used for queries filtering by:
 *   1. game_type alone (leftmost prefix)
 *   2. game_type + period_type (left prefix)
 *   3. game_type + period_type + period_date (full index)
 * - The primary query pattern (top N scores for game X in period Y) uses all three columns
 * - Combined with idx_leaderboard_score, SQLite can efficiently: filter by game/period, then sort by score
 */
export const LEADERBOARD_ENTRIES_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_leaderboard_game_period ON leaderboard_entries(game_type, period_type, period_date);
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard_entries(score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_player ON leaderboard_entries(player_address);
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

  // Create leaderboard_entries table
  db.exec(LEADERBOARD_ENTRIES_TABLE);

  // Create indexes for leaderboard_entries
  db.exec(LEADERBOARD_ENTRIES_INDEXES);
}
