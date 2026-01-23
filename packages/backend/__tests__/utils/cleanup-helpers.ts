/**
 * Test Cleanup Utilities
 *
 * Provides comprehensive cleanup functions for ensuring test isolation.
 * These utilities help prevent test pollution by cleaning up:
 * - Database state
 * - Mock servers and HTTP interceptors
 * - Environment variables
 * - Timers (setTimeout, setInterval)
 * - Module caches
 *
 * @example
 * ```typescript
 * import {
 *   clearAllTables,
 *   clearMockServers,
 *   resetEnvironment,
 *   cleanupTimers,
 *   globalTeardown,
 * } from '../utils/cleanup-helpers';
 *
 * // In a test
 * afterEach(async () => {
 *   await clearAllTables(db);
 *   clearMockServers();
 *   cleanupTimers();
 * });
 *
 * afterAll(async () => {
 *   await globalTeardown();
 * });
 * ```
 */

import { jest } from '@jest/globals';

// ============================================================================
// Types
// ============================================================================

/**
 * Database connection interface (compatible with better-sqlite3).
 */
export interface DatabaseConnection {
  exec: (sql: string) => void;
  prepare: (sql: string) => {
    run: (...args: unknown[]) => { changes: number };
    get: (...args: unknown[]) => unknown;
    all: (...args: unknown[]) => unknown[];
  };
  close: () => void;
  pragma: (key: string) => unknown;
}

/**
 * Mock server interface for tracking registered mocks.
 */
export interface MockServer {
  name: string;
  cleanup: () => void;
  isActive: () => boolean;
}

/**
 * Environment snapshot for restoration.
 */
export interface EnvironmentSnapshot {
  env: Record<string, string | undefined>;
  timestamp: number;
}

/**
 * Timer tracking for cleanup.
 */
export interface TimerTracking {
  timeouts: Set<NodeJS.Timeout>;
  intervals: Set<NodeJS.Timeout>;
}

/**
 * Cleanup statistics.
 */
export interface CleanupStats {
  tablesCleared: number;
  mockServersCleared: number;
  envVarsRestored: number;
  timersCleared: number;
  cleanupTime: number;
}

// ============================================================================
// State Management
// ============================================================================

/**
 * Registry of active mock servers.
 */
const mockServerRegistry: Map<string, MockServer> = new Map();

/**
 * Original environment state.
 */
let originalEnvironment: EnvironmentSnapshot | null = null;

/**
 * Timer tracking.
 */
const timerTracking: TimerTracking = {
  timeouts: new Set(),
  intervals: new Set(),
};

/**
 * Database table names to clear.
 */
const DATABASE_TABLES = [
  'game_sessions',
  'leaderboard_entries',
  'prize_pools',
  'payments',
] as const;

// ============================================================================
// Database Cleanup
// ============================================================================

/**
 * Clear all tables in the test database.
 *
 * Removes all rows from known tables while preserving table structure.
 * Uses TRUNCATE-like behavior with DELETE FROM for SQLite compatibility.
 *
 * @param db - Database connection
 * @param tables - Optional custom list of tables to clear
 * @returns Number of tables cleared
 *
 * @example
 * ```typescript
 * afterEach(() => {
 *   clearAllTables(testDb);
 * });
 * ```
 */
export function clearAllTables(
  db: DatabaseConnection,
  tables: readonly string[] = DATABASE_TABLES
): number {
  let cleared = 0;

  // Disable foreign key checks temporarily
  try {
    db.exec('PRAGMA foreign_keys = OFF;');
  } catch {
    // Some test databases may not support this pragma
  }

  for (const table of tables) {
    try {
      db.exec(`DELETE FROM ${table};`);
      // Reset auto-increment counter for SQLite
      try {
        db.exec(`DELETE FROM sqlite_sequence WHERE name='${table}';`);
      } catch {
        // Table may not use autoincrement
      }
      cleared++;
    } catch (error) {
      // Table may not exist - that's fine in some test scenarios
      if (error instanceof Error && !error.message.includes('no such table')) {
        throw error;
      }
    }
  }

  // Re-enable foreign key checks
  try {
    db.exec('PRAGMA foreign_keys = ON;');
  } catch {
    // Ignore if not supported
  }

  return cleared;
}

/**
 * Clear a specific table in the database.
 *
 * @param db - Database connection
 * @param tableName - Name of table to clear
 * @returns Number of rows deleted
 */
export function clearTable(db: DatabaseConnection, tableName: string): number {
  const stmt = db.prepare(`DELETE FROM ${tableName}`);
  const result = stmt.run();
  return result.changes;
}

/**
 * Reset database to initial state with optional seed data.
 *
 * @param db - Database connection
 * @param seedFn - Optional function to seed initial data
 */
export async function resetDatabase(
  db: DatabaseConnection,
  seedFn?: (db: DatabaseConnection) => void | Promise<void>
): Promise<void> {
  clearAllTables(db);

  if (seedFn) {
    await seedFn(db);
  }
}

/**
 * Get count of rows in a table.
 *
 * @param db - Database connection
 * @param tableName - Table name
 * @returns Row count
 */
export function getTableRowCount(db: DatabaseConnection, tableName: string): number {
  const stmt = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`);
  const result = stmt.get() as { count: number };
  return result.count;
}

/**
 * Verify database is empty (all tables have zero rows).
 *
 * @param db - Database connection
 * @param tables - Tables to check
 * @returns True if all tables are empty
 */
export function verifyDatabaseEmpty(
  db: DatabaseConnection,
  tables: readonly string[] = DATABASE_TABLES
): boolean {
  for (const table of tables) {
    try {
      const count = getTableRowCount(db, table);
      if (count > 0) {
        return false;
      }
    } catch {
      // Table doesn't exist - consider it empty
    }
  }
  return true;
}

// ============================================================================
// Mock Server Cleanup
// ============================================================================

/**
 * Register a mock server for tracking and cleanup.
 *
 * @param server - Mock server to register
 */
export function registerMockServer(server: MockServer): void {
  mockServerRegistry.set(server.name, server);
}

/**
 * Unregister a mock server.
 *
 * @param name - Name of server to unregister
 */
export function unregisterMockServer(name: string): void {
  const server = mockServerRegistry.get(name);
  if (server) {
    server.cleanup();
    mockServerRegistry.delete(name);
  }
}

/**
 * Clear all registered mock servers.
 *
 * Calls cleanup() on each registered mock server and removes them from registry.
 *
 * @returns Number of mock servers cleared
 *
 * @example
 * ```typescript
 * afterEach(() => {
 *   clearMockServers();
 * });
 * ```
 */
export function clearMockServers(): number {
  let cleared = 0;

  for (const [name, server] of mockServerRegistry) {
    try {
      server.cleanup();
      cleared++;
    } catch (error) {
      console.warn(`Failed to cleanup mock server '${name}':`, error);
    }
  }

  mockServerRegistry.clear();
  return cleared;
}

/**
 * Get list of active mock servers.
 *
 * @returns Array of active mock server names
 */
export function getActiveMockServers(): string[] {
  return Array.from(mockServerRegistry.entries())
    .filter(([_, server]) => server.isActive())
    .map(([name]) => name);
}

/**
 * Check if a mock server is registered.
 *
 * @param name - Server name
 * @returns True if registered
 */
export function isMockServerRegistered(name: string): boolean {
  return mockServerRegistry.has(name);
}

/**
 * Clear all Jest mocks (restoring original implementations).
 *
 * This clears:
 * - Mock return values
 * - Mock implementations
 * - Mock call history
 */
export function clearAllJestMocks(): void {
  jest.clearAllMocks();
}

/**
 * Reset all Jest mocks to their initial state.
 *
 * This resets:
 * - Mock implementations (if any)
 * - Mock return values
 * - Mock call counts and arguments
 */
export function resetAllJestMocks(): void {
  jest.resetAllMocks();
}

/**
 * Restore all mocked modules to their original implementations.
 */
export function restoreAllJestMocks(): void {
  jest.restoreAllMocks();
}

// ============================================================================
// Environment Variable Cleanup
// ============================================================================

/**
 * Capture current environment state for later restoration.
 *
 * @returns Environment snapshot
 *
 * @example
 * ```typescript
 * let envSnapshot: EnvironmentSnapshot;
 *
 * beforeEach(() => {
 *   envSnapshot = captureEnvironment();
 * });
 *
 * afterEach(() => {
 *   resetEnvironment(envSnapshot);
 * });
 * ```
 */
export function captureEnvironment(): EnvironmentSnapshot {
  return {
    env: { ...process.env },
    timestamp: Date.now(),
  };
}

/**
 * Reset environment variables to a previous snapshot.
 *
 * @param snapshot - Environment snapshot to restore
 * @returns Number of variables restored
 *
 * @example
 * ```typescript
 * afterEach(() => {
 *   resetEnvironment(originalEnv);
 * });
 * ```
 */
export function resetEnvironment(snapshot: EnvironmentSnapshot): number {
  let restored = 0;

  // Get all current env vars
  const currentKeys = Object.keys(process.env);
  const snapshotKeys = Object.keys(snapshot.env);

  // Remove vars that weren't in snapshot
  for (const key of currentKeys) {
    if (!(key in snapshot.env)) {
      delete process.env[key];
      restored++;
    }
  }

  // Restore vars from snapshot
  for (const key of snapshotKeys) {
    const snapshotValue = snapshot.env[key];
    if (process.env[key] !== snapshotValue) {
      if (snapshotValue === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = snapshotValue;
      }
      restored++;
    }
  }

  return restored;
}

/**
 * Initialize environment tracking for automatic cleanup.
 *
 * Call this at the start of your test suite to enable automatic env restoration.
 */
export function initEnvironmentTracking(): void {
  if (!originalEnvironment) {
    originalEnvironment = captureEnvironment();
  }
}

/**
 * Restore original environment (from initialization).
 *
 * @returns Number of variables restored, or 0 if no original was captured
 */
export function restoreOriginalEnvironment(): number {
  if (!originalEnvironment) {
    return 0;
  }
  return resetEnvironment(originalEnvironment);
}

/**
 * Set environment variables with automatic cleanup registration.
 *
 * @param vars - Variables to set
 * @returns Cleanup function to restore original values
 */
export function setEnvWithCleanup(vars: Record<string, string>): () => void {
  const original: Record<string, string | undefined> = {};

  for (const [key, value] of Object.entries(vars)) {
    original[key] = process.env[key];
    process.env[key] = value;
  }

  return () => {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  };
}

// ============================================================================
// Timer Cleanup
// ============================================================================

/**
 * Track a timeout for later cleanup.
 *
 * @param timeout - Timeout to track
 */
export function trackTimeout(timeout: NodeJS.Timeout): void {
  timerTracking.timeouts.add(timeout);
}

/**
 * Track an interval for later cleanup.
 *
 * @param interval - Interval to track
 */
export function trackInterval(interval: NodeJS.Timeout): void {
  timerTracking.intervals.add(interval);
}

/**
 * Untrack a timeout.
 *
 * @param timeout - Timeout to untrack
 */
export function untrackTimeout(timeout: NodeJS.Timeout): void {
  timerTracking.timeouts.delete(timeout);
}

/**
 * Untrack an interval.
 *
 * @param interval - Interval to untrack
 */
export function untrackInterval(interval: NodeJS.Timeout): void {
  timerTracking.intervals.delete(interval);
}

/**
 * Clean up all tracked timers (timeouts and intervals).
 *
 * Clears all tracked setTimeout and setInterval calls.
 *
 * @returns Number of timers cleared
 *
 * @example
 * ```typescript
 * afterEach(() => {
 *   cleanupTimers();
 * });
 * ```
 */
export function cleanupTimers(): number {
  let cleared = 0;

  for (const timeout of timerTracking.timeouts) {
    clearTimeout(timeout);
    cleared++;
  }
  timerTracking.timeouts.clear();

  for (const interval of timerTracking.intervals) {
    clearInterval(interval);
    cleared++;
  }
  timerTracking.intervals.clear();

  return cleared;
}

/**
 * Create a tracked setTimeout that will be cleaned up automatically.
 *
 * @param callback - Callback function
 * @param ms - Milliseconds delay
 * @returns Timeout reference
 */
export function trackedSetTimeout(callback: () => void, ms: number): NodeJS.Timeout {
  const timeout = setTimeout(() => {
    timerTracking.timeouts.delete(timeout);
    callback();
  }, ms);
  timerTracking.timeouts.add(timeout);
  return timeout;
}

/**
 * Create a tracked setInterval that will be cleaned up automatically.
 *
 * @param callback - Callback function
 * @param ms - Milliseconds interval
 * @returns Interval reference
 */
export function trackedSetInterval(callback: () => void, ms: number): NodeJS.Timeout {
  const interval = setInterval(callback, ms);
  timerTracking.intervals.add(interval);
  return interval;
}

/**
 * Get count of tracked timers.
 *
 * @returns Object with timeout and interval counts
 */
export function getTrackedTimerCounts(): { timeouts: number; intervals: number } {
  return {
    timeouts: timerTracking.timeouts.size,
    intervals: timerTracking.intervals.size,
  };
}

/**
 * Run all pending Jest fake timers to completion.
 *
 * This is useful when using jest.useFakeTimers().
 */
export function runAllFakeTimers(): void {
  jest.runAllTimers();
}

/**
 * Advance Jest fake timers by a specific amount.
 *
 * @param ms - Milliseconds to advance
 */
export function advanceFakeTimers(ms: number): void {
  jest.advanceTimersByTime(ms);
}

// ============================================================================
// Comprehensive Cleanup
// ============================================================================

/**
 * Perform complete cleanup after each test.
 *
 * Cleans up:
 * - Jest mocks
 * - Mock servers
 * - Timers
 *
 * Note: Database cleanup should be done separately with the db instance.
 *
 * @returns Cleanup statistics
 *
 * @example
 * ```typescript
 * afterEach(() => {
 *   testCleanup();
 * });
 * ```
 */
export function testCleanup(): Omit<CleanupStats, 'tablesCleared' | 'envVarsRestored'> {
  const start = Date.now();

  clearAllJestMocks();
  const mockServersCleared = clearMockServers();
  const timersCleared = cleanupTimers();

  return {
    mockServersCleared,
    timersCleared,
    cleanupTime: Date.now() - start,
  };
}

/**
 * Perform complete cleanup including database.
 *
 * @param db - Database connection (optional)
 * @returns Full cleanup statistics
 */
export function fullTestCleanup(db?: DatabaseConnection): CleanupStats {
  const start = Date.now();

  let tablesCleared = 0;
  if (db) {
    tablesCleared = clearAllTables(db);
  }

  clearAllJestMocks();
  const mockServersCleared = clearMockServers();
  const envVarsRestored = restoreOriginalEnvironment();
  const timersCleared = cleanupTimers();

  return {
    tablesCleared,
    mockServersCleared,
    envVarsRestored,
    timersCleared,
    cleanupTime: Date.now() - start,
  };
}

/**
 * Global teardown function for Jest afterAll hook.
 *
 * Performs comprehensive cleanup at the end of a test suite:
 * - Restores all Jest mocks
 * - Clears all mock servers
 * - Restores original environment
 * - Clears all timers
 *
 * @param db - Optional database connection to close
 * @returns Cleanup statistics
 *
 * @example
 * ```typescript
 * afterAll(async () => {
 *   await globalTeardown(testDb);
 * });
 * ```
 */
export async function globalTeardown(db?: DatabaseConnection): Promise<CleanupStats> {
  const start = Date.now();

  let tablesCleared = 0;

  // Close database if provided
  if (db) {
    try {
      tablesCleared = clearAllTables(db);
      db.close();
    } catch (error) {
      console.warn('Error closing database during teardown:', error);
    }
  }

  // Restore all mocks
  restoreAllJestMocks();

  // Clear all mock servers
  const mockServersCleared = clearMockServers();

  // Restore environment
  const envVarsRestored = restoreOriginalEnvironment();
  originalEnvironment = null;

  // Clear all timers
  const timersCleared = cleanupTimers();

  return {
    tablesCleared,
    mockServersCleared,
    envVarsRestored,
    timersCleared,
    cleanupTime: Date.now() - start,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a cleanup scope that automatically restores state.
 *
 * @returns Object with enter/exit functions
 *
 * @example
 * ```typescript
 * const scope = createCleanupScope();
 * scope.enter();
 * // ... do test work ...
 * scope.exit(); // Restores all state
 * ```
 */
export function createCleanupScope(): {
  enter: () => void;
  exit: () => CleanupStats;
} {
  let envSnapshot: EnvironmentSnapshot | null = null;

  return {
    enter() {
      envSnapshot = captureEnvironment();
      initEnvironmentTracking();
    },
    exit() {
      const stats = fullTestCleanup();
      envSnapshot = null;
      return stats;
    },
  };
}

/**
 * Run a function with automatic cleanup.
 *
 * @param fn - Function to run
 * @param db - Optional database connection
 * @returns Result of the function
 *
 * @example
 * ```typescript
 * const result = await withCleanup(async () => {
 *   // ... test code ...
 *   return someValue;
 * }, testDb);
 * ```
 */
export async function withCleanup<T>(
  fn: () => T | Promise<T>,
  db?: DatabaseConnection
): Promise<T> {
  const scope = createCleanupScope();
  scope.enter();

  try {
    return await fn();
  } finally {
    if (db) {
      clearAllTables(db);
    }
    scope.exit();
  }
}

/**
 * Assert that cleanup was successful.
 *
 * @param db - Database connection
 * @throws Error if cleanup verification fails
 */
export function assertCleanupSuccessful(db?: DatabaseConnection): void {
  // Verify no timers are pending
  const timerCounts = getTrackedTimerCounts();
  if (timerCounts.timeouts > 0 || timerCounts.intervals > 0) {
    throw new Error(
      `Cleanup failed: ${timerCounts.timeouts} timeouts and ${timerCounts.intervals} intervals still pending`
    );
  }

  // Verify no mock servers are active
  const activeMocks = getActiveMockServers();
  if (activeMocks.length > 0) {
    throw new Error(`Cleanup failed: ${activeMocks.length} mock servers still active: ${activeMocks.join(', ')}`);
  }

  // Verify database is empty
  if (db && !verifyDatabaseEmpty(db)) {
    throw new Error('Cleanup failed: Database tables are not empty');
  }
}
