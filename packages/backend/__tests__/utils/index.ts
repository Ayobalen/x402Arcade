/**
 * Backend Test Utilities - Central Export
 *
 * Import all test helpers from this file:
 * import { createMockRequest, createMockResponse, gameSessionFactory } from '../utils';
 */

export {
  createMockRequest,
  createMockResponse,
  createMockNext,
  createExpressContext,
  gameSessionFactory,
  leaderboardEntryFactory,
  paymentFactory,
  wait,
  createMockDatabase,
  withEnv,
} from './test-helpers';

// Database test utilities
export {
  createTestDatabase,
  clearTestDatabase,
  closeTestDatabase,
  seedTestData,
  withTestDatabase,
  createSeededTestDatabase,
  testDataGenerators,
  type TestDatabase,
  type TestDatabaseContext,
  type SeedGameSession,
  type SeedLeaderboardEntry,
  type SeedPrizePool,
  type SeedPayment,
  type SeedData,
} from './db-test-utils';

// API test client utilities
export {
  TestApiClient,
  createTestApiClient,
  assertResponse,
  type ApiResponse,
  type RequestOptions,
  type TestApiClientConfig,
} from './api-client';

// Authentication test helpers
export {
  TEST_WALLETS,
  generateTestWalletAddress,
  generateTestWallet,
  resetWalletCounter,
  createMockPaymentHeader,
  parsePaymentHeader,
  createAuthenticatedRequest,
  createUnauthenticatedRequest,
  asAdmin,
  asUser,
  asGuest,
  asNewUser,
  verifyAuthRequired,
  verifyPaymentRequired,
  verifyAccessDenied,
  createMiddlewareTestContext,
  createMockAuthMiddleware,
  createAuthOptions,
  testAuthStates,
  type TestWallet,
  type X402PaymentHeader,
  type AuthContext,
} from './auth-helpers';
