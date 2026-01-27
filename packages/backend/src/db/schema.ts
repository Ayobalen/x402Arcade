/**
 * Redis Data Structure Definitions
 *
 * Documents the Redis key patterns and data structures used in x402Arcade.
 * Using Vercel KV (Redis) for high-performance gaming data storage.
 *
 * @module db/schema
 */

/**
 * Redis Key Patterns
 *
 * All keys follow a hierarchical naming convention: entity:identifier:field
 *
 * Game Sessions:
 * - session:{sessionId}              → Hash: Complete game session data
 * - session:player:{playerAddress}   → Set: Session IDs for a player
 * - session:payment:{txHash}         → String: Session ID (for deduplication)
 * - sessions:active                  → Set: Active session IDs
 * - sessions:completed               → Set: Completed session IDs
 *
 * Leaderboards (using Redis Sorted Sets):
 * - leaderboard:{gameType}:daily:{date}              → ZSet: Daily leaderboard (score → playerId)
 * - leaderboard:{gameType}:weekly:{weekId}           → ZSet: Weekly leaderboard
 * - leaderboard:{gameType}:alltime                   → ZSet: All-time leaderboard
 * - leaderboard:entry:{gameType}:{playerId}:{period} → Hash: Detailed leaderboard entry
 *
 * Prize Pools:
 * - prizepool:{gameType}:{periodType}:{date}         → Hash: Prize pool data
 * - prizepools:active                                → Set: Active prize pool keys
 * - prizepools:finalized                             → Set: Finalized prize pool keys
 *
 * Payments Audit:
 * - payment:{txHash}                    → Hash: Payment record
 * - payments:player:{address}           → List: Payment tx hashes for player (newest first)
 * - payments:all                        → List: All payment tx hashes (audit log)
 */

/**
 * Game Session Data Structure (Redis Hash)
 *
 * Key: session:{sessionId}
 * Fields:
 * - id: Session UUID
 * - gameType: snake | tetris | pong | pong-phaser | breakout | space-invaders
 * - playerAddress: Ethereum address (lowercase, 42 chars)
 * - paymentTxHash: Transaction hash (66 chars)
 * - amountPaidUsdc: Amount in USDC (string, e.g., "0.01")
 * - score: Final score (string number, null if not completed)
 * - status: active | completed | expired
 * - createdAt: ISO 8601 timestamp
 * - completedAt: ISO 8601 timestamp (null if not completed)
 * - gameDurationMs: Duration in milliseconds (null if not completed)
 */
export interface GameSessionHash extends Record<string, string | null> {
  id: string;
  gameType: string;
  playerAddress: string;
  paymentTxHash: string;
  amountPaidUsdc: string;
  score: string | null;
  status: 'active' | 'completed' | 'expired';
  createdAt: string;
  completedAt: string | null;
  gameDurationMs: string | null;
}

/**
 * Leaderboard Entry (Redis Hash)
 *
 * Key: leaderboard:entry:{gameType}:{playerId}:{period}
 * Fields:
 * - sessionId: Reference to game session
 * - gameType: Game type
 * - playerAddress: Player address
 * - score: Score achieved
 * - periodType: daily | weekly | alltime
 * - periodDate: Date string (YYYY-MM-DD or YYYY-WXX or 'alltime')
 * - rank: Current rank (calculated from sorted set)
 * - createdAt: ISO 8601 timestamp
 */
export interface LeaderboardEntryHash {
  sessionId: string;
  gameType: string;
  playerAddress: string;
  score: string;
  periodType: 'daily' | 'weekly' | 'alltime';
  periodDate: string;
  rank: string;
  createdAt: string;
}

/**
 * Prize Pool Data Structure (Redis Hash)
 *
 * Key: prizepool:{gameType}:{periodType}:{date}
 * Fields:
 * - gameType: Game type
 * - periodType: daily | weekly
 * - periodDate: Period identifier (YYYY-MM-DD or YYYY-WXX)
 * - totalAmountUsdc: Accumulated USDC amount (string)
 * - totalGames: Number of games played (string number)
 * - status: active | finalized | paid
 * - winnerAddress: Winner's address (null if not finalized)
 * - payoutTxHash: Payout transaction hash (null if not paid)
 * - createdAt: ISO 8601 timestamp
 * - finalizedAt: ISO 8601 timestamp (null if not finalized)
 */
export interface PrizePoolHash extends Record<string, string | null> {
  gameType: string;
  periodType: 'daily' | 'weekly';
  periodDate: string;
  totalAmountUsdc: string;
  totalGames: string;
  status: 'active' | 'finalized' | 'paid';
  winnerAddress: string | null;
  payoutTxHash: string | null;
  createdAt: string;
  finalizedAt: string | null;
}

/**
 * Payment Record (Redis Hash)
 *
 * Key: payment:{txHash}
 * Fields:
 * - txHash: Transaction hash
 * - fromAddress: Sender address
 * - toAddress: Recipient address
 * - amountUsdc: Amount in USDC (string)
 * - purpose: game_payment | prize_payout
 * - status: pending | confirmed | failed
 * - createdAt: ISO 8601 timestamp
 * - confirmedAt: ISO 8601 timestamp (null if not confirmed)
 */
export interface PaymentHash {
  txHash: string;
  fromAddress: string;
  toAddress: string;
  amountUsdc: string;
  purpose: 'game_payment' | 'prize_payout';
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: string;
  confirmedAt: string | null;
}

/**
 * Helper functions for Redis key generation
 */
export const RedisKeys = {
  // Game Sessions
  session: (id: string) => `session:${id}`,
  sessionsByPlayer: (playerAddress: string) => `session:player:${playerAddress}`,
  sessionByPayment: (txHash: string) => `session:payment:${txHash}`,
  activeSessions: () => 'sessions:active',
  completedSessions: () => 'sessions:completed',

  // Leaderboards (Sorted Sets)
  leaderboard: (gameType: string, periodType: string, periodDate: string) =>
    `leaderboard:${gameType}:${periodType}:${periodDate}`,
  leaderboardEntry: (gameType: string, playerAddress: string, period: string) =>
    `leaderboard:entry:${gameType}:${playerAddress}:${period}`,

  // Prize Pools
  prizePool: (gameType: string, periodType: string, periodDate: string) =>
    `prizepool:${gameType}:${periodType}:${periodDate}`,
  activePrizePools: () => 'prizepools:active',
  finalizedPrizePools: () => 'prizepools:finalized',

  // Payments
  payment: (txHash: string) => `payment:${txHash}`,
  paymentsByPlayer: (playerAddress: string) => `payments:player:${playerAddress}`,
  allPayments: () => 'payments:all',
};

/**
 * Initialize Redis data structures
 *
 * For Redis, there's no schema to initialize, but this function
 * can be used for any setup logic or data migrations.
 */
export async function initializeSchema() {
  // Redis is schemaless - no initialization needed
  // This function exists for API compatibility with SQLite version
  return Promise.resolve();
}
