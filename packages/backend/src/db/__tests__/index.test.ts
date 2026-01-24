/**
 * Database Initialization Tests
 *
 * Tests for database initialization flow including directory creation,
 * WAL mode setting, and error handling.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { initDatabase, getDatabase, closeDatabase, db } from '../index.js';

// Mock the env module
vi.mock('../../config/env.js', () => ({
  env: {
    DATABASE_PATH: ':memory:',
    NODE_ENV: 'test',
  },
}));

// Mock the schema initialization
vi.mock('../schema.js', () => ({
  initializeSchema: vi.fn(),
}));

describe('Database Initialization', () => {
  afterEach(() => {
    // Clean up: close database if it's open
    try {
      closeDatabase();
    } catch {
      // Ignore errors if database wasn't initialized
    }

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('initDatabase', () => {
    it('should create database instance with :memory: path', () => {
      const database = initDatabase();

      expect(database).toBeDefined();
      expect(database).toBeInstanceOf(Database);
      expect(database.open).toBe(true);
    });

    it('should enable WAL mode after initialization', () => {
      const database = initDatabase();

      // Query the journal_mode pragma to verify WAL is enabled
      const journalMode = database.pragma('journal_mode', { simple: true });

      expect(journalMode).toBe('wal');
    });

    it('should enable foreign keys after initialization', () => {
      const database = initDatabase();

      // Query the foreign_keys pragma to verify it's enabled
      const foreignKeys = database.pragma('foreign_keys', { simple: true });

      expect(foreignKeys).toBe(1); // 1 = ON, 0 = OFF
    });

    it('should set busy_timeout pragma', () => {
      const database = initDatabase();

      // Query the busy_timeout pragma
      const busyTimeout = database.pragma('busy_timeout', { simple: true });

      expect(busyTimeout).toBe(5000); // 5000ms = 5 seconds
    });

    it('should call initializeSchema during initialization', async () => {
      const { initializeSchema } = await import('../schema.js');

      initDatabase();

      expect(initializeSchema).toHaveBeenCalledTimes(1);
      expect(initializeSchema).toHaveBeenCalledWith(expect.any(Database));
    });

    it('should be idempotent - multiple calls should work', () => {
      const database1 = initDatabase();
      const database2 = initDatabase();

      // Both should return a valid database instance
      expect(database1).toBeDefined();
      expect(database2).toBeDefined();

      // Both should be open
      expect(database1.open).toBe(true);
      expect(database2.open).toBe(true);

      // Note: The second call creates a new database instance,
      // replacing the previous one. This is expected behavior.
    });
  });

  describe('getDatabase', () => {
    it('should return the database instance after initialization', () => {
      initDatabase();
      const database = getDatabase();

      expect(database).toBeDefined();
      expect(database).toBeInstanceOf(Database);
      expect(database.open).toBe(true);
    });

    it('should throw error if database is not initialized', () => {
      // Don't initialize the database
      expect(() => getDatabase()).toThrow('Database not initialized. Call initDatabase() first.');
    });
  });

  describe('closeDatabase', () => {
    it('should close the database connection', () => {
      const database = initDatabase();

      expect(database.open).toBe(true);

      closeDatabase();

      expect(database.open).toBe(false);
    });

    it('should handle closing when database is not initialized', () => {
      // Should not throw error when database is not initialized
      expect(() => closeDatabase()).not.toThrow();
    });

    it('should allow re-initialization after close', () => {
      const database1 = initDatabase();
      closeDatabase();

      // Re-initialize
      const database2 = initDatabase();

      expect(database2).toBeDefined();
      expect(database2.open).toBe(true);
    });
  });
});

describe('Database Initialization - File System Tests', () => {
  // These tests cannot run in the sandbox due to better-sqlite3 native module restrictions
  // They are designed to be run manually outside the sandbox

  describe('initDatabase with file path', () => {
    it.skip('should create database directory if it does not exist', () => {
      // This test requires:
      // 1. Unmock the env module to use a real file path
      // 2. Use a temporary directory
      // 3. Verify that the directory is created
      //
      // Example implementation:
      // const testPath = '/tmp/test-arcade-db/arcade.db';
      // const database = initDatabase();
      // expect(fs.existsSync(dirname(testPath))).toBe(true);
    });

    it.skip('should handle invalid file paths gracefully', () => {
      // This test requires:
      // 1. Set DATABASE_PATH to an invalid path (e.g., '/invalid/path/db.sqlite')
      // 2. Call initDatabase()
      // 3. Expect it to throw an error with a clear message
      //
      // Example:
      // env.DATABASE_PATH = '/invalid/readonly/path/db.sqlite';
      // expect(() => initDatabase()).toThrow('Failed to create database directory');
    });

    it.skip('should handle permission errors gracefully', () => {
      // This test requires:
      // 1. Set DATABASE_PATH to a directory without write permissions
      // 2. Call initDatabase()
      // 3. Expect it to throw an error
      //
      // Example:
      // env.DATABASE_PATH = '/root/db.sqlite'; // No write permission
      // expect(() => initDatabase()).toThrow();
    });

    it.skip('should not create directory for :memory: database', () => {
      // This test verifies that directory creation is skipped for :memory:
      // It's already covered by the in-memory tests above, but could be
      // explicitly verified by checking that no filesystem operations occur.
    });
  });
});
