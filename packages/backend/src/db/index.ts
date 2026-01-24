/**
 * Database Module
 *
 * Initializes and exports the SQLite database connection using better-sqlite3.
 * Provides synchronous, high-performance database operations.
 *
 * @module db
 */

import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import { env } from '../config/env.js';

/**
 * SQLite database instance
 */
export let db: DatabaseType;

/**
 * Initialize the database connection
 *
 * Creates or opens the SQLite database at the configured path.
 * Enables WAL mode for better performance and concurrency.
 *
 * @returns Database instance
 */
export function initDatabase(): DatabaseType {
  const dbPath = env.DATABASE_PATH;

  // Create database connection
  db = new Database(dbPath, {
    // eslint-disable-next-line no-console
    verbose: env.NODE_ENV === 'development' ? console.log : undefined,
  });

  // Enable Write-Ahead Logging for better performance
  db.pragma('journal_mode = WAL');

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  return db;
}

/**
 * Get the database instance
 *
 * @throws Error if database is not initialized
 * @returns Database instance
 */
export function getDatabase(): DatabaseType {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
  }
}
