/**
 * Rate Limiting Tests
 *
 * Tests to verify that API rate limiting is working correctly.
 * Ensures limits are enforced, appropriate errors are returned,
 * and rate limit headers are present in responses.
 *
 * @module routes/__tests__/ratelimit.test
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, jest } from '@jest/globals';
import request from 'supertest';
import express, { type Express, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import Database from 'better-sqlite3';
import { createTables } from '../../db/schema.js';
import { playRoutes, scoreRoutes, leaderboardRoutes, prizeRoutes } from '../index.js';

// ============================================================================
// Test Setup
// ============================================================================

let app: Express;
let db: Database.Database;

beforeAll(() => {
  // Set required environment variables for testing
  process.env.ARCADE_WALLET_ADDRESS = '0x1234567890123456789012345678901234567890';
  process.env.USDC_CONTRACT_ADDRESS = '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0';
  process.env.FACILITATOR_URL = 'https://facilitator.cronoslabs.org';
  process.env.NODE_ENV = 'test';
});

beforeEach(() => {
  // Create fresh in-memory database for each test
  db = new Database(':memory:');
  createTables(db);

  // Override getDatabase to use test database
  const dbModule = require('../../db/index.js');
  (global as any).__originalGetDatabase = dbModule.getDatabase;
  dbModule.getDatabase = () => db;
});

afterEach(() => {
  // Restore original getDatabase
  if ((global as any).__originalGetDatabase) {
    const dbModule = require('../../db/index.js');
    dbModule.getDatabase = (global as any).__originalGetDatabase;
    delete (global as any).__originalGetDatabase;
  }

  // Close database
  db.close();

  // Clear any timers set by rate limiter
  jest.clearAllTimers();
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create an Express app with rate limiting configured.
 *
 * @param maxRequests - Maximum requests allowed per window
 * @param windowMs - Time window in milliseconds
 * @returns Configured Express application
 */
function createRateLimitedApp(maxRequests: number, windowMs: number): Express {
  const testApp = express();

  // Apply rate limiting
  const limiter = rateLimit({
    windowMs,
    max: maxRequests,
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    message: 'Too many requests from this IP, please try again later.',
    // For testing, we need to use in-memory store (default)
    // In production, use Redis or similar for distributed systems
  });

  testApp.use(express.json());
  testApp.use(limiter);

  // Mount all API routes
  testApp.use('/api/v1/play', playRoutes);
  testApp.use('/api/v1/score', scoreRoutes);
  testApp.use('/api/v1/leaderboard', leaderboardRoutes);
  testApp.use('/api/v1/prize', prizeRoutes);

  return testApp;
}

/**
 * Create a game session in the database for testing.
 */
function createTestSession(params: {
  sessionId: string;
  gameType: string;
  playerAddress: string;
  paymentTxHash: string;
  amountPaidUsdc: number;
  status?: 'active' | 'completed' | 'expired';
}): void {
  const {
    sessionId,
    gameType,
    playerAddress,
    paymentTxHash,
    amountPaidUsdc,
    status = 'active',
  } = params;

  db.prepare(
    `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc, status)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(sessionId, gameType, playerAddress, paymentTxHash, amountPaidUsdc, status);
}

// ============================================================================
// Rate Limiting Basic Functionality Tests
// ============================================================================

describe('Rate Limiting: Basic Functionality', () => {
  it('should allow requests within the rate limit', async () => {
    // Create app with limit of 5 requests per 1 minute
    app = createRateLimitedApp(5, 60000);

    // Make 5 requests (all should succeed)
    for (let i = 1; i <= 5; i++) {
      const response = await request(app).get('/api/v1/leaderboard/snake/daily');

      // All requests within limit should succeed (200 for leaderboard)
      expect(response.status).toBe(200);
      expect(response.headers['ratelimit-limit']).toBe('5');
      expect(response.headers['ratelimit-remaining']).toBe(String(5 - i));
    }
  });

  it('should return 429 when rate limit is exceeded', async () => {
    // Create app with very low limit: 3 requests per 1 minute
    app = createRateLimitedApp(3, 60000);

    // Make 3 requests (should succeed)
    for (let i = 1; i <= 3; i++) {
      const response = await request(app).get('/api/v1/leaderboard/snake/daily');
      expect(response.status).toBe(200);
    }

    // 4th request should be rate limited
    const exceededResponse = await request(app).get('/api/v1/leaderboard/snake/daily');

    expect(exceededResponse.status).toBe(429);
    expect(exceededResponse.body.message).toBeDefined();
    expect(exceededResponse.body.message).toContain('Too many requests');
  });

  it('should enforce rate limit per IP address', async () => {
    // Create app with limit of 2 requests per minute
    app = createRateLimitedApp(2, 60000);

    // Make 2 requests from same IP (should succeed)
    const response1 = await request(app).get('/api/v1/leaderboard/tetris/daily');
    const response2 = await request(app).get('/api/v1/leaderboard/pong/daily');

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);

    // 3rd request from same IP (should fail)
    const response3 = await request(app).get('/api/v1/leaderboard/breakout/daily');

    expect(response3.status).toBe(429);
  });
});

// ============================================================================
// Rate Limit Headers Tests
// ============================================================================

describe('Rate Limiting: HTTP Headers', () => {
  beforeEach(() => {
    // Create app with 10 requests per minute for header testing
    app = createRateLimitedApp(10, 60000);
  });

  it('should include RateLimit-Limit header in all responses', async () => {
    const response = await request(app).get('/api/v1/leaderboard/snake/daily');

    expect(response.status).toBe(200);
    expect(response.headers['ratelimit-limit']).toBe('10');
  });

  it('should include RateLimit-Remaining header showing requests left', async () => {
    // First request
    const response1 = await request(app).get('/api/v1/leaderboard/snake/daily');
    expect(response1.headers['ratelimit-remaining']).toBe('9');

    // Second request
    const response2 = await request(app).get('/api/v1/leaderboard/tetris/daily');
    expect(response2.headers['ratelimit-remaining']).toBe('8');

    // Third request
    const response3 = await request(app).get('/api/v1/leaderboard/pong/daily');
    expect(response3.headers['ratelimit-remaining']).toBe('7');
  });

  it('should include RateLimit-Reset header with timestamp', async () => {
    const beforeRequest = Math.floor(Date.now() / 1000);
    const response = await request(app).get('/api/v1/leaderboard/snake/daily');
    const afterRequest = Math.floor(Date.now() / 1000);

    expect(response.headers['ratelimit-reset']).toBeDefined();

    // Parse the reset timestamp
    const resetTime = parseInt(response.headers['ratelimit-reset'] as string, 10);

    // Reset time should be in the future (current time + window)
    expect(resetTime).toBeGreaterThan(beforeRequest);

    // Reset time should be approximately 60 seconds from now (with some tolerance)
    const expectedReset = afterRequest + 60;
    expect(resetTime).toBeGreaterThanOrEqual(expectedReset - 5);
    expect(resetTime).toBeLessThanOrEqual(expectedReset + 5);
  });

  it('should include Retry-After header when rate limit exceeded', async () => {
    // Exhaust the rate limit
    for (let i = 1; i <= 10; i++) {
      await request(app).get('/api/v1/leaderboard/snake/daily');
    }

    // Next request should be rate limited
    const response = await request(app).get('/api/v1/leaderboard/snake/daily');

    expect(response.status).toBe(429);
    expect(response.headers['retry-after']).toBeDefined();

    // Retry-After should be in seconds (approximately 60 for our window)
    const retryAfter = parseInt(response.headers['retry-after'] as string, 10);
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(60);
  });

  it('should show RateLimit-Remaining as 0 when limit reached', async () => {
    // Exhaust the rate limit (10 requests)
    let lastResponse;
    for (let i = 1; i <= 10; i++) {
      lastResponse = await request(app).get('/api/v1/leaderboard/snake/daily');
    }

    // Last successful request should show 0 remaining
    expect(lastResponse?.headers['ratelimit-remaining']).toBe('0');
  });
});

// ============================================================================
// Rate Limit Window Reset Tests
// ============================================================================

describe('Rate Limiting: Window Reset', () => {
  it('should reset rate limit after window expires', async () => {
    // Use a very short window (1 second) for testing
    app = createRateLimitedApp(2, 1000); // 2 requests per 1 second

    // Make 2 requests (exhaust limit)
    const response1 = await request(app).get('/api/v1/leaderboard/snake/daily');
    const response2 = await request(app).get('/api/v1/leaderboard/snake/daily');

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);

    // 3rd request should be rate limited
    const response3 = await request(app).get('/api/v1/leaderboard/snake/daily');
    expect(response3.status).toBe(429);

    // Wait for window to reset (1.1 seconds to be safe)
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // After window reset, requests should work again
    const response4 = await request(app).get('/api/v1/leaderboard/snake/daily');
    expect(response4.status).toBe(200);
    expect(response4.headers['ratelimit-remaining']).toBe('1');
  });

  it('should track remaining requests correctly across window boundary', async () => {
    // Short window for testing
    app = createRateLimitedApp(3, 500); // 3 requests per 0.5 seconds

    // Make 2 requests
    await request(app).get('/api/v1/leaderboard/snake/daily');
    const response2 = await request(app).get('/api/v1/leaderboard/snake/daily');

    expect(response2.headers['ratelimit-remaining']).toBe('1');

    // Wait for window to reset
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Should have full quota again
    const response3 = await request(app).get('/api/v1/leaderboard/snake/daily');
    expect(response3.headers['ratelimit-remaining']).toBe('2');
  });
});

// ============================================================================
// Error Message Tests
// ============================================================================

describe('Rate Limiting: Error Messages', () => {
  beforeEach(() => {
    // Low limit for testing error cases
    app = createRateLimitedApp(2, 60000);
  });

  it('should return informative error message when rate limit exceeded', async () => {
    // Exhaust limit
    await request(app).get('/api/v1/leaderboard/snake/daily');
    await request(app).get('/api/v1/leaderboard/snake/daily');

    // Exceed limit
    const response = await request(app).get('/api/v1/leaderboard/snake/daily');

    expect(response.status).toBe(429);
    expect(response.body).toBeDefined();
    expect(response.body.message).toBeDefined();
    expect(response.body.message).toContain('Too many requests');
  });

  it('should include helpful information in rate limit error', async () => {
    // Exhaust limit
    await request(app).get('/api/v1/leaderboard/snake/daily');
    await request(app).get('/api/v1/leaderboard/snake/daily');

    // Exceed limit
    const response = await request(app).get('/api/v1/leaderboard/snake/daily');

    expect(response.status).toBe(429);

    // Error response should have standard structure
    expect(response.body.message).toBeTruthy();
    expect(typeof response.body.message).toBe('string');

    // Should mention "try again later" or similar guidance
    expect(response.body.message.toLowerCase()).toMatch(/try again|wait|later/);
  });

  it('should return consistent error format for rate limited requests', async () => {
    // Exhaust limit
    await request(app).get('/api/v1/leaderboard/snake/daily');
    await request(app).get('/api/v1/leaderboard/tetris/daily');

    // Exceed limit on different endpoints
    const response1 = await request(app).get('/api/v1/leaderboard/pong/daily');
    const response2 = await request(app).get('/api/v1/leaderboard/breakout/daily');

    // Both should have same structure
    expect(response1.status).toBe(429);
    expect(response2.status).toBe(429);
    expect(response1.body.message).toBe(response2.body.message);
  });
});

// ============================================================================
// Rate Limiting Across Different Endpoints Tests
// ============================================================================

describe('Rate Limiting: Multiple Endpoints', () => {
  beforeEach(() => {
    // Global rate limit applies to all endpoints
    app = createRateLimitedApp(5, 60000);
  });

  it('should apply rate limit globally across all API endpoints', async () => {
    // Make requests to different endpoints
    await request(app).get('/api/v1/leaderboard/snake/daily'); // 1
    await request(app).get('/api/v1/leaderboard/tetris/weekly'); // 2
    await request(app).get('/api/v1/prize/pong/daily'); // 3
    await request(app).get('/api/v1/leaderboard/breakout/daily'); // 4

    const response5 = await request(app).get('/api/v1/leaderboard/snake/alltime'); // 5
    expect(response5.status).toBe(200);
    expect(response5.headers['ratelimit-remaining']).toBe('0');

    // 6th request to any endpoint should be rate limited
    const response6 = await request(app).get('/api/v1/prize/tetris/daily');
    expect(response6.status).toBe(429);
  });

  it('should count POST requests toward rate limit', async () => {
    // Create a test session for score submission
    createTestSession({
      sessionId: 'rate-test-session',
      gameType: 'snake',
      playerAddress: '0xRATE0000000000000000000000000000000000TE',
      paymentTxHash: '0xRATE000000000000000000000000000000000000000000000000000000000000',
      amountPaidUsdc: 0.01,
      status: 'active',
    });

    // Mix of GET and POST requests
    await request(app).get('/api/v1/leaderboard/snake/daily'); // 1
    await request(app).get('/api/v1/prize/snake/daily'); // 2
    await request(app).post('/api/v1/score/submit').send({
      // 3
      sessionId: 'rate-test-session',
      score: 100,
      playerAddress: '0xRATE0000000000000000000000000000000000TE',
    });
    await request(app).get('/api/v1/leaderboard/tetris/daily'); // 4
    await request(app).get('/api/v1/leaderboard/pong/daily'); // 5

    // 6th request should be rate limited
    const response6 = await request(app).get('/api/v1/leaderboard/snake/alltime');
    expect(response6.status).toBe(429);
  });

  it('should track requests correctly for mixed successful and failed requests', async () => {
    // Mix of successful and failed requests (both count toward limit)
    await request(app).get('/api/v1/leaderboard/snake/daily'); // 1 - success (200)
    await request(app).get('/api/v1/leaderboard/invalid-game/daily'); // 2 - fail (400)
    await request(app).get('/api/v1/prize/snake/daily'); // 3 - success or fail depending on DB
    await request(app).post('/api/v1/score/submit').send({
      // 4 - fail (404 - session not found)
      sessionId: 'nonexistent',
      score: 100,
      playerAddress: '0x0000000000000000000000000000000000000000',
    });

    // All requests count, regardless of success/failure
    const response5 = await request(app).get('/api/v1/leaderboard/snake/weekly');
    expect(response5.headers['ratelimit-remaining']).toBe('0');

    // 6th request should be rate limited
    const response6 = await request(app).get('/api/v1/leaderboard/tetris/daily');
    expect(response6.status).toBe(429);
  });
});

// ============================================================================
// Realistic Usage Scenarios Tests
// ============================================================================

describe('Rate Limiting: Realistic Usage Scenarios', () => {
  it('should handle typical gameplay session within limits', async () => {
    // Realistic limit for gameplay: 100 requests per 15 minutes
    app = createRateLimitedApp(100, 15 * 60 * 1000);

    // Simulate a typical 15-minute gaming session
    // - Player checks leaderboard: 5 requests
    // - Player plays 10 games (each game: 1 score submit + 1 leaderboard check): 20 requests
    // - Player checks prize pools: 5 requests
    // Total: ~30 requests (well within limit)

    // Leaderboard checks
    for (let i = 0; i < 5; i++) {
      const response = await request(app).get('/api/v1/leaderboard/snake/daily');
      expect(response.status).toBe(200);
    }

    // Prize pool checks
    for (let i = 0; i < 5; i++) {
      const response = await request(app).get('/api/v1/prize/snake/daily');
      // May be 200 or 404 depending on DB state
      expect([200, 404]).toContain(response.status);
    }

    // Game sessions (score submissions + leaderboard checks)
    for (let i = 1; i <= 10; i++) {
      const sessionId = `game-session-${i}`;
      const playerAddress = '0xGAMEPLAYER0000000000000000000000000000';

      createTestSession({
        sessionId,
        gameType: 'snake',
        playerAddress,
        paymentTxHash: `0xGAME${i.toString().padStart(58, '0')}`,
        amountPaidUsdc: 0.01,
        status: 'active',
      });

      // Submit score
      const scoreResponse = await request(app)
        .post('/api/v1/score/submit')
        .send({
          sessionId,
          score: 100 + i * 50,
          playerAddress,
        });
      expect(scoreResponse.status).toBe(200);

      // Check leaderboard after each game
      const leaderboardResponse = await request(app).get('/api/v1/leaderboard/snake/daily');
      expect(leaderboardResponse.status).toBe(200);
    }

    // Verify still have requests remaining
    const finalResponse = await request(app).get('/api/v1/leaderboard/snake/alltime');
    expect(finalResponse.status).toBe(200);

    const remaining = parseInt(finalResponse.headers['ratelimit-remaining'] as string, 10);
    expect(remaining).toBeGreaterThan(50); // Should have plenty left
  });

  it('should prevent abuse from excessive requests', async () => {
    // Moderate limit for abuse prevention: 20 requests per minute
    app = createRateLimitedApp(20, 60000);

    // Simulate abusive behavior: rapid-fire requests
    for (let i = 1; i <= 20; i++) {
      const response = await request(app).get('/api/v1/leaderboard/snake/daily');
      expect(response.status).toBe(200);
    }

    // 21st request should be blocked
    const blockedResponse = await request(app).get('/api/v1/leaderboard/snake/daily');
    expect(blockedResponse.status).toBe(429);
    expect(blockedResponse.body.message).toContain('Too many requests');
  });
});
