/**
 * Database Module
 *
 * Initializes and exports the Redis connection using ioredis.
 * Provides high-performance in-memory database operations.
 *
 * @module db
 */

import Redis from 'ioredis';

let redisClient: Redis | null = null;

/**
 * Redis client instance
 * Configured via REDIS_URL environment variable
 */
export const db = {
  get client(): Redis {
    return getDatabase();
  }
};

/**
 * Initialize the database connection
 *
 * @returns Redis client instance
 */
export function initDatabase(): Redis {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is not set');
    }

    console.log('[Database] Initializing Redis connection...');

    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redisClient.on('connect', () => {
      console.log('[Database] Connected to Redis successfully');
    });

    redisClient.on('error', (err) => {
      console.error('[Database] Redis connection error:', err.message);
    });
  }

  return redisClient;
}

/**
 * Get the database instance
 *
 * @returns Redis client instance
 */
export function getDatabase(): Redis {
  if (!redisClient) {
    return initDatabase();
  }
  return redisClient;
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (redisClient) {
    console.log('[Database] Closing Redis connection...');
    redisClient.disconnect();
    redisClient = null;
  }
}

// Default export for convenience
export default { initDatabase, getDatabase, closeDatabase, db };
