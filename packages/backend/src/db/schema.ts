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
 * - game_type: Type of game played (snake, tetris, pong, pong-phaser, breakout, space-invaders)
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
    game_type TEXT NOT NULL CHECK (game_type IN ('snake', 'tetris', 'pong', 'pong-phaser', 'breakout', 'space-invaders')),
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
 * - game_type: Denormalized from game_sessions (snake, tetris, pong, pong-phaser, breakout, space-invaders)
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
 * Prize Pools Table Schema
 *
 * Tracks accumulated prize pools for daily and weekly competitions.
 * A percentage of each game payment (PRIZE_POOL_PERCENTAGE from env config)
 * is added to the prize pool for the current period.
 *
 * Prize Pool Mechanics:
 * - For each game payment (e.g., $0.01 USDC):
 *   - 70% (configurable) goes to the prize pool
 *   - 30% (configurable) goes to platform revenue
 * - Prize pools are segregated by:
 *   - game_type (snake, tetris, pong, breakout, space-invaders)
 *   - period_type (daily or weekly)
 *   - period_date (e.g., '2026-01-24' for daily, '2026-W04' for weekly)
 *
 * Columns:
 * - id: Auto-incrementing primary key
 * - game_type: Type of game (snake, tetris, pong, pong-phaser, breakout, space-invaders)
 *     - Each game has its own separate prize pool
 * - period_type: Competition period ('daily' or 'weekly')
 *     - CHECK constraint enforces valid values
 *     - Note: 'alltime' is NOT a prize pool period (no prize for all-time leaderboard)
 * - period_date: Period identifier (TEXT NOT NULL)
 *     - Format: 'YYYY-MM-DD' for daily (e.g., '2026-01-24')
 *     - Format: 'YYYY-WXX' for weekly (e.g., '2026-W04' for week 4)
 *     - Used to identify which time period this pool belongs to
 * - total_amount_usdc: Accumulated prize pool in USDC (REAL NOT NULL DEFAULT 0)
 *     - Incremented each time a player pays to play this game in this period
 *     - Calculated: payment_amount * PRIZE_POOL_PERCENTAGE
 *     - Example: $0.01 payment * 70% = $0.007 added to pool
 * - total_games: Total number of games played in this period (INTEGER NOT NULL DEFAULT 0)
 *     - Incremented each time a game session is created
 *     - Used for analytics and verification
 * - status: Prize pool lifecycle status (TEXT NOT NULL DEFAULT 'active')
 *     - CHECK constraint enforces: 'active', 'finalized', 'paid'
 *     - Status transitions:
 *       1. 'active' (default): Period is ongoing, pool is still accumulating
 *       2. 'finalized': Period ended, winner determined, awaiting payout
 *       3. 'paid': Prize has been sent to winner (terminal state)
 *     - Cron job finalizes pools at end of period and determines winner
 * - winner_address: Ethereum address of the winner (TEXT, NULL until finalized)
 *     - NULL when status is 'active' (period still ongoing)
 *     - Set when status transitions to 'finalized' (winner determined from leaderboard)
 *     - Remains set when status transitions to 'paid'
 *     - Format: 42-character hex address (0x + 40 hex digits, lowercase)
 * - payout_tx_hash: On-chain transaction hash for prize payout (TEXT, NULL until paid)
 *     - NULL when status is 'active' or 'finalized'
 *     - Set when status transitions to 'paid' (prize sent)
 *     - Format: 66-character hex hash (0x + 64 hex digits)
 *     - Can be used to verify payout on blockchain explorer
 * - created_at: Pool creation timestamp (TEXT NOT NULL, auto-set)
 *     - ISO 8601 format: 'YYYY-MM-DD HH:MM:SS'
 *     - UTC timezone
 *     - Automatically set when pool is first created
 * - finalized_at: Pool finalization timestamp (TEXT, NULL until finalized)
 *     - NULL when status is 'active'
 *     - Set when status transitions to 'finalized' or 'paid'
 *     - Marks when the competition period ended and winner was determined
 *
 * Constraints:
 * - UNIQUE(game_type, period_type, period_date): One pool per game per period
 *     - Prevents duplicate pools for the same game/period combination
 *     - Application should use INSERT OR IGNORE to create pools, then UPDATE to add funds
 *
 * Prize Pool Rotation (Cron Job Logic):
 * 1. Daily pools: Finalized at midnight UTC, winner determined from daily leaderboard
 * 2. Weekly pools: Finalized at Sunday midnight UTC, winner determined from weekly leaderboard
 * 3. Finalization process:
 *    - Set status to 'finalized'
 *    - Query leaderboard_entries for highest score in this game/period
 *    - Set winner_address to the top player's address
 *    - Set finalized_at timestamp
 * 4. Payout process (separate job or manual):
 *    - Send USDC from arcade wallet to winner_address
 *    - Set payout_tx_hash to the transaction hash
 *    - Set status to 'paid'
 */
export const PRIZE_POOLS_TABLE = `
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
`;

/**
 * Prize Pools Indexes
 *
 * Optimizes prize pool query patterns:
 * - Status lookup: Find active/finalized/paid pools (idx_prize_pools_status)
 * - Game + period lookup: Find pool for specific game and period (idx_prize_pools_game_period)
 */
export const PRIZE_POOLS_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_prize_pools_status ON prize_pools(status);
CREATE INDEX IF NOT EXISTS idx_prize_pools_game_period ON prize_pools(game_type, period_type, period_date);
`;

/**
 * Payments Audit Table Schema
 *
 * Immutable audit log of all payment transactions for accounting and dispute resolution.
 *
 * Purpose:
 * - Complete financial record of all money moving through the platform
 * - Supports regulatory compliance (AML, KYC, tax reporting)
 * - Enables dispute resolution with verifiable on-chain proof
 * - Provides analytics for revenue tracking and business intelligence
 *
 * Audit Trail Guarantees:
 * - Records are NEVER updated or deleted (append-only log)
 * - Each record has a unique blockchain transaction hash for verification
 * - Timestamps are immutable and server-controlled (not client-provided)
 * - All amounts are logged in USDC (6 decimals) for consistent accounting
 *
 * Columns:
 * - id: Auto-incrementing primary key for sequential ordering
 * - tx_hash: Blockchain transaction hash (TEXT NOT NULL UNIQUE)
 *     - Format: 66-character hex string (0x + 64 hex digits)
 *     - Uniqueness ensures no duplicate transaction logging
 *     - Can be verified on Cronos Explorer
 * - from_address: Sender's Ethereum address (TEXT NOT NULL)
 *     - For game_payment: Player's wallet address
 *     - For prize_payout: Arcade wallet address
 *     - Format: 42-character hex address (0x + 40 hex digits, lowercase)
 * - to_address: Recipient's Ethereum address (TEXT NOT NULL)
 *     - For game_payment: Arcade wallet address
 *     - For prize_payout: Winner's wallet address
 *     - Format: 42-character hex address (0x + 40 hex digits, lowercase)
 * - amount_usdc: Payment amount in USDC (REAL NOT NULL)
 *     - Stored as decimal with 6 decimals precision (USDC standard)
 *     - Example: 0.01 = $0.01 USDC
 *     - CHECK constraint ensures positive amounts only
 * - purpose: Transaction purpose (TEXT NOT NULL)
 *     - CHECK constraint enforces: 'game_payment', 'prize_payout'
 *     - game_payment: Player pays to play a game
 *     - prize_payout: Arcade pays prize to winner
 * - status: Transaction status (TEXT NOT NULL DEFAULT 'pending')
 *     - pending: Transaction submitted but not yet confirmed on-chain
 *     - confirmed: Transaction included in a block
 *     - failed: Transaction reverted or rejected
 *     - Note: In x402 flow, most transactions are confirmed immediately by facilitator
 * - created_at: Record creation timestamp (TEXT NOT NULL, auto-set)
 *     - ISO 8601 format: 'YYYY-MM-DD HH:MM:SS'
 *     - UTC timezone
 *     - Set when payment is initiated (before blockchain confirmation)
 * - confirmed_at: Blockchain confirmation timestamp (TEXT, NULL until confirmed)
 *     - NULL when status is 'pending' or 'failed'
 *     - Set when status transitions to 'confirmed'
 *     - Marks when transaction was included in a block
 *
 * Regulatory Compliance Notes:
 * - Retention Policy: Records MUST be retained for 7 years minimum (financial regulations)
 * - Access Control: Read-only access for auditors, accountants
 * - Data Export: Support CSV/JSON export for tax reporting and audits
 * - Privacy: Player addresses are pseudonymous (no PII stored in this table)
 *
 * Query Patterns:
 * - Revenue calculation: SUM(amount_usdc) WHERE purpose = 'game_payment' AND status = 'confirmed'
 * - Prize payouts: SUM(amount_usdc) WHERE purpose = 'prize_payout' AND status = 'confirmed'
 * - Player history: SELECT * WHERE from_address = ? AND purpose = 'game_payment' ORDER BY created_at DESC
 * - Transaction verification: SELECT * WHERE tx_hash = ?
 */
export const PAYMENTS_TABLE = `
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tx_hash TEXT NOT NULL UNIQUE,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    amount_usdc REAL NOT NULL CHECK (amount_usdc > 0),
    purpose TEXT NOT NULL CHECK (purpose IN ('game_payment', 'prize_payout')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    confirmed_at TEXT
);
`;

/**
 * Payments Indexes
 *
 * Optimizes payment audit query patterns:
 * - Transaction lookup: Find payment by blockchain tx hash (idx_payments_tx_hash)
 * - Player history: Find all payments from a specific address (idx_payments_from_address)
 * - Recipient queries: Find all payments to a specific address (idx_payments_to_address)
 * - Revenue analysis: Filter by purpose and status (idx_payments_purpose_status)
 * - Time-based queries: Sort by creation time (idx_payments_created_at)
 */
export const PAYMENTS_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_payments_tx_hash ON payments(tx_hash);
CREATE INDEX IF NOT EXISTS idx_payments_from_address ON payments(from_address);
CREATE INDEX IF NOT EXISTS idx_payments_to_address ON payments(to_address);
CREATE INDEX IF NOT EXISTS idx_payments_purpose_status ON payments(purpose, status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
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

  // Create prize_pools table
  db.exec(PRIZE_POOLS_TABLE);

  // Create indexes for prize_pools
  db.exec(PRIZE_POOLS_INDEXES);

  // Create payments audit table
  db.exec(PAYMENTS_TABLE);

  // Create indexes for payments
  db.exec(PAYMENTS_INDEXES);
}
