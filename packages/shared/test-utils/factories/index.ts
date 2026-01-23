/**
 * Test Factories - Central Export
 *
 * Import all test factories from this file:
 * import { createMockUser, createMockGameSession, createMockTransaction } from '@x402arcade/shared/test-utils/factories';
 */

// User factories
export {
  createMockUser,
  createMockUsers,
  createDeterministicUser,
  testAddresses,
  type MockUser,
  type CreateMockUserOptions,
} from './user.factory';

// Game session factories
export {
  createMockGameSession,
  createActiveSession,
  createCompletedSession,
  createExpiredSession,
  createPlayerHistory,
  gamePrices,
  type MockGameSession,
  type CreateMockGameSessionOptions,
  type GameType,
  type SessionStatus,
} from './game-session.factory';

// Transaction factories
export {
  createMockTransaction,
  createPendingPayment,
  createConfirmedPayment,
  createPrizePayout,
  createFailedTransaction,
  createMockX402Header,
  testTxHashes,
  type MockTransaction,
  type CreateMockTransactionOptions,
  type TransactionPurpose,
  type TransactionStatus,
  type X402PaymentHeader,
} from './transaction.factory';

// Leaderboard factories
export {
  createMockLeaderboardEntry,
  createRankedEntry,
  createLeaderboard,
  createPlayerLeaderboardHistory,
  calculatePrizePool,
  prizePoolConfig,
  type MockLeaderboardEntry,
  type CreateMockLeaderboardEntryOptions,
  type PeriodType,
} from './leaderboard.factory';
