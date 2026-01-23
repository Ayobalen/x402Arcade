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

// Cleanup utilities
export {
  // Database cleanup
  clearAllTables,
  clearTable,
  resetDatabase,
  getTableRowCount,
  verifyDatabaseEmpty,
  // Mock server cleanup
  registerMockServer,
  unregisterMockServer,
  clearMockServers,
  getActiveMockServers,
  isMockServerRegistered,
  clearAllJestMocks,
  resetAllJestMocks,
  restoreAllJestMocks,
  // Environment cleanup
  captureEnvironment,
  resetEnvironment,
  initEnvironmentTracking,
  restoreOriginalEnvironment,
  setEnvWithCleanup,
  // Timer cleanup
  trackTimeout,
  trackInterval,
  untrackTimeout,
  untrackInterval,
  cleanupTimers,
  trackedSetTimeout,
  trackedSetInterval,
  getTrackedTimerCounts,
  runAllFakeTimers,
  advanceFakeTimers,
  // Comprehensive cleanup
  testCleanup,
  fullTestCleanup,
  globalTeardown,
  createCleanupScope,
  withCleanup,
  assertCleanupSuccessful,
  // Types
  type DatabaseConnection,
  type MockServer,
  type EnvironmentSnapshot,
  type TimerTracking,
  type CleanupStats,
} from './cleanup-helpers';

// Environment helpers
export {
  TEST_ENV,
  parseEnvFile,
  findEnvTestPath,
  loadTestEnv,
  resetTestEnv,
  isTestEnvironmentLoaded,
  withTestEnv,
  getRequiredEnv,
  getOptionalEnv,
  getEnvNumber,
  getEnvBoolean,
  REQUIRED_TEST_ENV_VARS,
  validateTestEnv,
  assertTestEnvConfigured,
  getMockFacilitatorUrl,
  getMockRpcUrl,
  createTestEnvSetup,
  createIsolatedTestEnvSetup,
  type TestEnvironment,
  type PartialTestEnvironment,
} from './env-helpers';
