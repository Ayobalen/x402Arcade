/**
 * Database Module
 *
 * Initializes and exports the Vercel KV (Redis) connection.
 * Provides high-performance in-memory database operations.
 *
 * @module db
 */

import { kv } from '@vercel/kv';

/**
 * Redis client instance from Vercel KV
 * Automatically configured via environment variables:
 * - KV_REST_API_URL
 * - KV_REST_API_TOKEN
 */
export const db = kv;

/**
 * Initialize the database connection
 *
 * For Vercel KV, initialization happens automatically via environment variables.
 * This function exists for API compatibility but doesn't need to do anything.
 *
 * @returns KV client instance
 */
export function initDatabase() {
  // Vercel KV is initialized automatically from environment variables
  // No explicit initialization needed
  return db;
}

/**
 * Get the database instance
 *
 * @returns KV client instance
 */
export function getDatabase() {
  return db;
}

/**
 * Close the database connection
 *
 * For Vercel KV, connections are managed automatically.
 * This function exists for API compatibility.
 */
export function closeDatabase(): void {
  // Vercel KV connections are managed automatically
  // No explicit cleanup needed
}

// Default export for convenience
export default { initDatabase, getDatabase, closeDatabase, db };
