/**
 * Test Cleanup Utilities - Tests
 *
 * Comprehensive tests for cleanup-helpers.ts ensuring proper test isolation.
 */

import { jest, describe, it, expect, beforeEach, afterEach, afterAll } from '@jest/globals';
import {
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
} from './cleanup-helpers';

// ============================================================================
// Mock Database
// ============================================================================

/**
 * Create a mock database for testing.
 */
function createMockDatabase(): DatabaseConnection & {
  _data: Map<string, unknown[]>;
  _closed: boolean;
} {
  const _data = new Map<string, unknown[]>();
  let _closed = false;

  // Initialize tables
  const tables = ['game_sessions', 'leaderboard_entries', 'prize_pools', 'payments'];
  tables.forEach(t => _data.set(t, []));

  return {
    _data,
    get _closed() { return _closed; },
    exec(sql: string) {
      if (_closed) throw new Error('Database is closed');

      // Handle DELETE FROM
      const deleteMatch = sql.match(/DELETE FROM (\w+)/i);
      if (deleteMatch) {
        const tableName = deleteMatch[1];
        if (tableName === 'sqlite_sequence') {
          return; // Ignore sequence reset
        }
        if (!_data.has(tableName)) {
          throw new Error(`no such table: ${tableName}`);
        }
        _data.set(tableName, []);
        return;
      }

      // Handle PRAGMA
      if (sql.includes('PRAGMA')) {
        return;
      }
    },
    prepare(sql: string) {
      if (_closed) throw new Error('Database is closed');

      const deleteMatch = sql.match(/DELETE FROM (\w+)/i);
      const countMatch = sql.match(/SELECT COUNT\(\*\) as count FROM (\w+)/i);

      return {
        run: (..._args: unknown[]) => {
          if (deleteMatch) {
            const tableName = deleteMatch[1];
            const data = _data.get(tableName);
            const changes = data?.length ?? 0;
            _data.set(tableName, []);
            return { changes };
          }
          return { changes: 0 };
        },
        get: (..._args: unknown[]) => {
          if (countMatch) {
            const tableName = countMatch[1];
            const data = _data.get(tableName);
            return { count: data?.length ?? 0 };
          }
          return null;
        },
        all: (..._args: unknown[]) => [],
      };
    },
    close() {
      _closed = true;
    },
    pragma(_key: string) {
      return null;
    },
  };
}

/**
 * Add test data to mock database.
 */
function seedMockDatabase(db: ReturnType<typeof createMockDatabase>, table: string, count: number) {
  const data = db._data.get(table) ?? [];
  for (let i = 0; i < count; i++) {
    data.push({ id: i + 1 });
  }
  db._data.set(table, data);
}

// ============================================================================
// Database Cleanup Tests
// ============================================================================

describe('Database Cleanup', () => {
  let mockDb: ReturnType<typeof createMockDatabase>;

  beforeEach(() => {
    mockDb = createMockDatabase();
  });

  afterEach(() => {
    clearMockServers();
    cleanupTimers();
  });

  describe('clearAllTables', () => {
    it('should clear all default tables', () => {
      // Seed data
      seedMockDatabase(mockDb, 'game_sessions', 5);
      seedMockDatabase(mockDb, 'leaderboard_entries', 10);
      seedMockDatabase(mockDb, 'prize_pools', 3);
      seedMockDatabase(mockDb, 'payments', 8);

      const clearedCount = clearAllTables(mockDb);

      expect(clearedCount).toBe(4);
      expect(mockDb._data.get('game_sessions')).toHaveLength(0);
      expect(mockDb._data.get('leaderboard_entries')).toHaveLength(0);
      expect(mockDb._data.get('prize_pools')).toHaveLength(0);
      expect(mockDb._data.get('payments')).toHaveLength(0);
    });

    it('should clear custom list of tables', () => {
      seedMockDatabase(mockDb, 'game_sessions', 5);
      seedMockDatabase(mockDb, 'payments', 3);

      const clearedCount = clearAllTables(mockDb, ['game_sessions', 'payments']);

      expect(clearedCount).toBe(2);
      expect(mockDb._data.get('game_sessions')).toHaveLength(0);
      expect(mockDb._data.get('payments')).toHaveLength(0);
    });

    it('should handle non-existent tables gracefully', () => {
      const clearedCount = clearAllTables(mockDb, ['nonexistent_table']);

      expect(clearedCount).toBe(0);
    });

    it('should handle empty database', () => {
      const clearedCount = clearAllTables(mockDb);

      expect(clearedCount).toBe(4);
    });
  });

  describe('clearTable', () => {
    it('should clear a specific table', () => {
      seedMockDatabase(mockDb, 'game_sessions', 10);

      const changes = clearTable(mockDb, 'game_sessions');

      expect(changes).toBe(10);
      expect(mockDb._data.get('game_sessions')).toHaveLength(0);
    });

    it('should return 0 for empty table', () => {
      const changes = clearTable(mockDb, 'game_sessions');

      expect(changes).toBe(0);
    });
  });

  describe('resetDatabase', () => {
    it('should clear tables and not seed if no seed function', async () => {
      seedMockDatabase(mockDb, 'game_sessions', 5);

      await resetDatabase(mockDb);

      expect(mockDb._data.get('game_sessions')).toHaveLength(0);
    });

    it('should clear tables and run seed function', async () => {
      seedMockDatabase(mockDb, 'game_sessions', 5);

      await resetDatabase(mockDb, (db) => {
        const data = (db as ReturnType<typeof createMockDatabase>)._data.get('game_sessions') ?? [];
        data.push({ id: 1, seeded: true });
        (db as ReturnType<typeof createMockDatabase>)._data.set('game_sessions', data);
      });

      expect(mockDb._data.get('game_sessions')).toHaveLength(1);
    });

    it('should support async seed functions', async () => {
      await resetDatabase(mockDb, async (db) => {
        await Promise.resolve();
        const data = (db as ReturnType<typeof createMockDatabase>)._data.get('payments') ?? [];
        data.push({ id: 1 });
        (db as ReturnType<typeof createMockDatabase>)._data.set('payments', data);
      });

      expect(mockDb._data.get('payments')).toHaveLength(1);
    });
  });

  describe('getTableRowCount', () => {
    it('should return correct count', () => {
      seedMockDatabase(mockDb, 'game_sessions', 7);

      const count = getTableRowCount(mockDb, 'game_sessions');

      expect(count).toBe(7);
    });

    it('should return 0 for empty table', () => {
      const count = getTableRowCount(mockDb, 'game_sessions');

      expect(count).toBe(0);
    });
  });

  describe('verifyDatabaseEmpty', () => {
    it('should return true for empty database', () => {
      const isEmpty = verifyDatabaseEmpty(mockDb);

      expect(isEmpty).toBe(true);
    });

    it('should return false if any table has data', () => {
      seedMockDatabase(mockDb, 'payments', 1);

      const isEmpty = verifyDatabaseEmpty(mockDb);

      expect(isEmpty).toBe(false);
    });

    it('should check specific tables', () => {
      seedMockDatabase(mockDb, 'game_sessions', 5);

      // Check only payments (which is empty)
      const isEmpty = verifyDatabaseEmpty(mockDb, ['payments']);

      expect(isEmpty).toBe(true);
    });
  });
});

// ============================================================================
// Mock Server Cleanup Tests
// ============================================================================

describe('Mock Server Cleanup', () => {
  afterEach(() => {
    clearMockServers();
    cleanupTimers();
  });

  describe('registerMockServer', () => {
    it('should register a mock server', () => {
      const server: MockServer = {
        name: 'test-server',
        cleanup: jest.fn(),
        isActive: () => true,
      };

      registerMockServer(server);

      expect(isMockServerRegistered('test-server')).toBe(true);
    });

    it('should allow multiple servers', () => {
      const server1: MockServer = {
        name: 'server-1',
        cleanup: jest.fn(),
        isActive: () => true,
      };
      const server2: MockServer = {
        name: 'server-2',
        cleanup: jest.fn(),
        isActive: () => false,
      };

      registerMockServer(server1);
      registerMockServer(server2);

      expect(isMockServerRegistered('server-1')).toBe(true);
      expect(isMockServerRegistered('server-2')).toBe(true);
    });
  });

  describe('unregisterMockServer', () => {
    it('should unregister and cleanup a server', () => {
      const cleanupFn = jest.fn();
      const server: MockServer = {
        name: 'test-server',
        cleanup: cleanupFn,
        isActive: () => true,
      };

      registerMockServer(server);
      unregisterMockServer('test-server');

      expect(cleanupFn).toHaveBeenCalled();
      expect(isMockServerRegistered('test-server')).toBe(false);
    });

    it('should handle unregistering non-existent server', () => {
      // Should not throw
      unregisterMockServer('non-existent');
    });
  });

  describe('clearMockServers', () => {
    it('should clear all registered servers', () => {
      const cleanup1 = jest.fn();
      const cleanup2 = jest.fn();

      registerMockServer({ name: 's1', cleanup: cleanup1, isActive: () => true });
      registerMockServer({ name: 's2', cleanup: cleanup2, isActive: () => true });

      const cleared = clearMockServers();

      expect(cleared).toBe(2);
      expect(cleanup1).toHaveBeenCalled();
      expect(cleanup2).toHaveBeenCalled();
      expect(isMockServerRegistered('s1')).toBe(false);
      expect(isMockServerRegistered('s2')).toBe(false);
    });

    it('should return 0 for empty registry', () => {
      const cleared = clearMockServers();

      expect(cleared).toBe(0);
    });

    it('should handle cleanup errors gracefully', () => {
      registerMockServer({
        name: 'error-server',
        cleanup: () => { throw new Error('Cleanup failed'); },
        isActive: () => true,
      });

      // Should not throw - errors are logged but not propagated
      const cleared = clearMockServers();

      // Cleared count only includes successful cleanups
      expect(cleared).toBe(0);
      // But server should still be removed from registry
      expect(isMockServerRegistered('error-server')).toBe(false);
    });
  });

  describe('getActiveMockServers', () => {
    it('should return only active servers', () => {
      registerMockServer({ name: 'active', cleanup: jest.fn(), isActive: () => true });
      registerMockServer({ name: 'inactive', cleanup: jest.fn(), isActive: () => false });

      const active = getActiveMockServers();

      expect(active).toEqual(['active']);
    });

    it('should return empty array if no active servers', () => {
      registerMockServer({ name: 'inactive', cleanup: jest.fn(), isActive: () => false });

      const active = getActiveMockServers();

      expect(active).toEqual([]);
    });
  });
});

// ============================================================================
// Jest Mock Cleanup Tests
// ============================================================================

describe('Jest Mock Cleanup', () => {
  afterEach(() => {
    clearMockServers();
    cleanupTimers();
  });

  describe('clearAllJestMocks', () => {
    it('should clear mock call history', () => {
      const mockFn = jest.fn();
      mockFn('test');

      expect(mockFn).toHaveBeenCalledTimes(1);

      clearAllJestMocks();

      expect(mockFn).toHaveBeenCalledTimes(0);
    });
  });

  describe('resetAllJestMocks', () => {
    it('should reset mock implementations', () => {
      const mockFn = jest.fn().mockReturnValue('mocked');

      expect(mockFn()).toBe('mocked');

      resetAllJestMocks();

      expect(mockFn()).toBeUndefined();
    });
  });

  describe('restoreAllJestMocks', () => {
    it('should restore spied functions', () => {
      const obj = { method: () => 'original' };
      jest.spyOn(obj, 'method').mockReturnValue('mocked');

      expect(obj.method()).toBe('mocked');

      restoreAllJestMocks();

      // After restore, original implementation is back
      expect(obj.method()).toBe('original');
    });
  });
});

// ============================================================================
// Environment Variable Cleanup Tests
// ============================================================================

describe('Environment Variable Cleanup', () => {
  // Store original env for safety
  const originalEnv = { ...process.env };

  afterEach(() => {
    // Restore for safety
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }
    for (const [key, value] of Object.entries(originalEnv)) {
      process.env[key] = value;
    }
    clearMockServers();
    cleanupTimers();
  });

  describe('captureEnvironment', () => {
    it('should capture current environment', () => {
      process.env.TEST_VAR = 'test-value';

      const snapshot = captureEnvironment();

      expect(snapshot.env.TEST_VAR).toBe('test-value');
      expect(snapshot.timestamp).toBeLessThanOrEqual(Date.now());
    });

    it('should create a copy not a reference', () => {
      process.env.TEST_VAR = 'original';
      const snapshot = captureEnvironment();

      process.env.TEST_VAR = 'modified';

      expect(snapshot.env.TEST_VAR).toBe('original');
    });
  });

  describe('resetEnvironment', () => {
    it('should restore environment to snapshot', () => {
      process.env.TEST_VAR = 'original';
      const snapshot = captureEnvironment();

      process.env.TEST_VAR = 'modified';
      process.env.NEW_VAR = 'new-value';

      const restored = resetEnvironment(snapshot);

      expect(restored).toBeGreaterThan(0);
      expect(process.env.TEST_VAR).toBe('original');
      expect(process.env.NEW_VAR).toBeUndefined();
    });

    it('should handle undefined values in snapshot', () => {
      const snapshot: EnvironmentSnapshot = {
        env: { SHOULD_EXIST: 'value' },
        timestamp: Date.now(),
      };

      process.env.SHOULD_NOT_EXIST = 'temp';

      resetEnvironment(snapshot);

      expect(process.env.SHOULD_NOT_EXIST).toBeUndefined();
    });
  });

  describe('setEnvWithCleanup', () => {
    it('should set env vars and return cleanup function', () => {
      const cleanup = setEnvWithCleanup({
        TEST_A: 'value-a',
        TEST_B: 'value-b',
      });

      expect(process.env.TEST_A).toBe('value-a');
      expect(process.env.TEST_B).toBe('value-b');

      cleanup();

      expect(process.env.TEST_A).toBeUndefined();
      expect(process.env.TEST_B).toBeUndefined();
    });

    it('should restore original values on cleanup', () => {
      process.env.EXISTING_VAR = 'original';

      const cleanup = setEnvWithCleanup({
        EXISTING_VAR: 'modified',
      });

      expect(process.env.EXISTING_VAR).toBe('modified');

      cleanup();

      expect(process.env.EXISTING_VAR).toBe('original');
    });
  });

  describe('initEnvironmentTracking / restoreOriginalEnvironment', () => {
    it('should track and restore environment', () => {
      // First call captures original state
      initEnvironmentTracking();

      process.env.TRACKED_VAR = 'temporary';

      const restored = restoreOriginalEnvironment();

      expect(restored).toBeGreaterThanOrEqual(0);
    });
  });
});

// ============================================================================
// Timer Cleanup Tests
// ============================================================================

describe('Timer Cleanup', () => {
  afterEach(() => {
    clearMockServers();
    cleanupTimers();
  });

  describe('trackTimeout / untrackTimeout', () => {
    it('should track and untrack timeouts', () => {
      const timeout = setTimeout(() => {}, 10000);

      trackTimeout(timeout);
      expect(getTrackedTimerCounts().timeouts).toBe(1);

      untrackTimeout(timeout);
      expect(getTrackedTimerCounts().timeouts).toBe(0);

      clearTimeout(timeout);
    });
  });

  describe('trackInterval / untrackInterval', () => {
    it('should track and untrack intervals', () => {
      const interval = setInterval(() => {}, 10000);

      trackInterval(interval);
      expect(getTrackedTimerCounts().intervals).toBe(1);

      untrackInterval(interval);
      expect(getTrackedTimerCounts().intervals).toBe(0);

      clearInterval(interval);
    });
  });

  describe('cleanupTimers', () => {
    it('should clear all tracked timers', () => {
      const timeout1 = setTimeout(() => {}, 10000);
      const timeout2 = setTimeout(() => {}, 10000);
      const interval1 = setInterval(() => {}, 10000);

      trackTimeout(timeout1);
      trackTimeout(timeout2);
      trackInterval(interval1);

      const cleared = cleanupTimers();

      expect(cleared).toBe(3);
      expect(getTrackedTimerCounts()).toEqual({ timeouts: 0, intervals: 0 });
    });

    it('should return 0 if no timers tracked', () => {
      const cleared = cleanupTimers();

      expect(cleared).toBe(0);
    });
  });

  describe('trackedSetTimeout', () => {
    it('should create and track a timeout', (done) => {
      const callback = jest.fn(() => {
        expect(callback).toHaveBeenCalled();
        // After callback, timeout should be untracked
        expect(getTrackedTimerCounts().timeouts).toBe(0);
        done();
      });

      trackedSetTimeout(callback, 10);

      expect(getTrackedTimerCounts().timeouts).toBe(1);
    });

    it('should be cleanable before firing', () => {
      const callback = jest.fn();

      trackedSetTimeout(callback, 10000);
      expect(getTrackedTimerCounts().timeouts).toBe(1);

      cleanupTimers();

      expect(getTrackedTimerCounts().timeouts).toBe(0);
    });
  });

  describe('trackedSetInterval', () => {
    it('should create and track an interval', () => {
      const callback = jest.fn();

      trackedSetInterval(callback, 10000);

      expect(getTrackedTimerCounts().intervals).toBe(1);

      cleanupTimers();
      expect(getTrackedTimerCounts().intervals).toBe(0);
    });
  });

  describe('getTrackedTimerCounts', () => {
    it('should return correct counts', () => {
      const t1 = setTimeout(() => {}, 10000);
      const t2 = setTimeout(() => {}, 10000);
      const i1 = setInterval(() => {}, 10000);

      trackTimeout(t1);
      trackTimeout(t2);
      trackInterval(i1);

      const counts = getTrackedTimerCounts();

      expect(counts).toEqual({ timeouts: 2, intervals: 1 });

      // Cleanup
      cleanupTimers();
    });
  });
});

// ============================================================================
// Comprehensive Cleanup Tests
// ============================================================================

describe('Comprehensive Cleanup', () => {
  let mockDb: ReturnType<typeof createMockDatabase>;

  beforeEach(() => {
    mockDb = createMockDatabase();
  });

  afterEach(() => {
    clearMockServers();
    cleanupTimers();
  });

  describe('testCleanup', () => {
    it('should clear mocks, servers, and timers', () => {
      const mockFn = jest.fn();
      mockFn('test');

      registerMockServer({ name: 'test', cleanup: jest.fn(), isActive: () => true });
      trackTimeout(setTimeout(() => {}, 10000));

      const stats = testCleanup();

      expect(stats.mockServersCleared).toBe(1);
      expect(stats.timersCleared).toBe(1);
      expect(stats.cleanupTime).toBeGreaterThanOrEqual(0);
      expect(mockFn).toHaveBeenCalledTimes(0);
    });
  });

  describe('fullTestCleanup', () => {
    it('should clear everything including database', () => {
      seedMockDatabase(mockDb, 'game_sessions', 5);
      registerMockServer({ name: 'test', cleanup: jest.fn(), isActive: () => true });
      trackTimeout(setTimeout(() => {}, 10000));

      const stats = fullTestCleanup(mockDb);

      expect(stats.tablesCleared).toBe(4);
      expect(stats.mockServersCleared).toBe(1);
      expect(stats.timersCleared).toBe(1);
      expect(stats.cleanupTime).toBeGreaterThanOrEqual(0);
    });

    it('should work without database', () => {
      registerMockServer({ name: 'test', cleanup: jest.fn(), isActive: () => true });

      const stats = fullTestCleanup();

      expect(stats.tablesCleared).toBe(0);
      expect(stats.mockServersCleared).toBe(1);
    });
  });

  describe('globalTeardown', () => {
    it('should perform complete teardown', async () => {
      seedMockDatabase(mockDb, 'payments', 3);
      registerMockServer({ name: 'test', cleanup: jest.fn(), isActive: () => true });
      trackInterval(setInterval(() => {}, 10000));

      const stats = await globalTeardown(mockDb);

      expect(stats.tablesCleared).toBe(4);
      expect(stats.mockServersCleared).toBe(1);
      expect(stats.timersCleared).toBe(1);
      expect(mockDb._closed).toBe(true);
    });

    it('should work without database', async () => {
      const stats = await globalTeardown();

      expect(stats.tablesCleared).toBe(0);
    });

    it('should handle database close errors gracefully', async () => {
      const badDb = createMockDatabase();
      badDb.close = () => { throw new Error('Close failed'); };

      // Should not throw
      await globalTeardown(badDb);
    });
  });

  describe('createCleanupScope', () => {
    it('should create a scope that tracks state', () => {
      const scope = createCleanupScope();

      scope.enter();

      process.env.SCOPED_VAR = 'temp';
      registerMockServer({ name: 'scoped', cleanup: jest.fn(), isActive: () => true });

      const stats = scope.exit();

      expect(stats.mockServersCleared).toBe(1);
    });
  });

  describe('withCleanup', () => {
    it('should run function with automatic cleanup', async () => {
      seedMockDatabase(mockDb, 'game_sessions', 5);

      const result = await withCleanup(async () => {
        registerMockServer({ name: 'test', cleanup: jest.fn(), isActive: () => true });
        return 'done';
      }, mockDb);

      expect(result).toBe('done');
      expect(mockDb._data.get('game_sessions')).toHaveLength(0);
      expect(isMockServerRegistered('test')).toBe(false);
    });

    it('should cleanup even on error', async () => {
      registerMockServer({ name: 'pre-error', cleanup: jest.fn(), isActive: () => true });

      await expect(
        withCleanup(async () => {
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');

      expect(isMockServerRegistered('pre-error')).toBe(false);
    });
  });

  describe('assertCleanupSuccessful', () => {
    it('should pass when everything is clean', () => {
      expect(() => assertCleanupSuccessful(mockDb)).not.toThrow();
    });

    it('should fail when timers are pending', () => {
      trackTimeout(setTimeout(() => {}, 10000));

      expect(() => assertCleanupSuccessful()).toThrow(/timeouts.*still pending/);

      cleanupTimers();
    });

    it('should fail when mock servers are active', () => {
      registerMockServer({ name: 'active', cleanup: jest.fn(), isActive: () => true });

      expect(() => assertCleanupSuccessful()).toThrow(/mock servers still active/);

      clearMockServers();
    });

    it('should fail when database is not empty', () => {
      seedMockDatabase(mockDb, 'payments', 1);

      expect(() => assertCleanupSuccessful(mockDb)).toThrow(/Database tables are not empty/);
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Cleanup Integration', () => {
  let mockDb: ReturnType<typeof createMockDatabase>;

  beforeEach(() => {
    mockDb = createMockDatabase();
  });

  afterEach(() => {
    clearMockServers();
    cleanupTimers();
  });

  it('should maintain isolation between tests (test 1)', async () => {
    // Set up some state
    seedMockDatabase(mockDb, 'game_sessions', 10);
    process.env.ISOLATION_TEST = 'test1';
    registerMockServer({ name: 'isolation', cleanup: jest.fn(), isActive: () => true });
    trackTimeout(setTimeout(() => {}, 10000));

    // Verify state
    expect(mockDb._data.get('game_sessions')).toHaveLength(10);
    expect(process.env.ISOLATION_TEST).toBe('test1');

    // Clean up
    fullTestCleanup(mockDb);
    delete process.env.ISOLATION_TEST;
  });

  it('should maintain isolation between tests (test 2)', () => {
    // Verify previous test's state is gone
    expect(mockDb._data.get('game_sessions')).toHaveLength(0);
    expect(process.env.ISOLATION_TEST).toBeUndefined();
    expect(isMockServerRegistered('isolation')).toBe(false);
    expect(getTrackedTimerCounts().timeouts).toBe(0);
  });

  it('should handle rapid cleanup cycles', async () => {
    for (let i = 0; i < 10; i++) {
      // Set up state
      seedMockDatabase(mockDb, 'payments', i + 1);
      registerMockServer({ name: `server-${i}`, cleanup: jest.fn(), isActive: () => true });
      trackTimeout(setTimeout(() => {}, 10000));

      // Clean up
      const stats = fullTestCleanup(mockDb);

      expect(stats.mockServersCleared).toBe(1);
      expect(stats.timersCleared).toBe(1);
      expect(getTrackedTimerCounts().timeouts).toBe(0);
    }
  });

  it('should work with async/await patterns', async () => {
    await withCleanup(async () => {
      // Simulate async operations
      await Promise.resolve();

      seedMockDatabase(mockDb, 'leaderboard_entries', 5);
      registerMockServer({ name: 'async-test', cleanup: jest.fn(), isActive: () => true });

      await Promise.resolve();

      expect(mockDb._data.get('leaderboard_entries')).toHaveLength(5);
    }, mockDb);

    // Verify cleanup happened
    expect(mockDb._data.get('leaderboard_entries')).toHaveLength(0);
    expect(isMockServerRegistered('async-test')).toBe(false);
  });
});

// Global cleanup
afterAll(async () => {
  await globalTeardown();
});
