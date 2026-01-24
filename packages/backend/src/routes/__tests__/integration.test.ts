/**
 * Integration Tests for API Routes
 *
 * Tests the full request/response cycle for all API routes using supertest.
 * Uses an in-memory database for isolated testing.
 *
 * @module routes/__tests__/integration.test
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import request from 'supertest';
import express, { type Express } from 'express';
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
});

beforeEach(() => {
  // Create in-memory database
  db = new Database(':memory:');
  createTables(db);

  // Create Express app
  app = express();
  app.use(express.json());

  // Mount routes
  app.use('/api/v1/play', playRoutes);
  app.use('/api/v1/score', scoreRoutes);
  app.use('/api/v1/leaderboard', leaderboardRoutes);
  app.use('/api/v1/prize', prizeRoutes);

  // Override getDatabase to use test database
  // This ensures routes use our in-memory test database
  const originalGetDatabase = require('../../db/index.js').getDatabase;
  require('../../db/index.js').getDatabase = () => db;

  // Store original for cleanup
  (global as any).__originalGetDatabase = originalGetDatabase;
});

afterEach(() => {
  // Restore original getDatabase
  if ((global as any).__originalGetDatabase) {
    require('../../db/index.js').getDatabase = (global as any).__originalGetDatabase;
    delete (global as any).__originalGetDatabase;
  }

  // Close database
  db.close();
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a test game session in the database.
 * Used to test routes that require an existing session.
 */
function createTestSession(params: {
  sessionId: string;
  gameType: string;
  playerAddress: string;
  paymentTxHash: string;
  amountPaidUsdc: number;
  status?: 'active' | 'completed' | 'expired';
  score?: number;
}): void {
  const {
    sessionId,
    gameType,
    playerAddress,
    paymentTxHash,
    amountPaidUsdc,
    status = 'active',
    score = null,
  } = params;

  db.prepare(
    `INSERT INTO game_sessions (id, game_type, player_address, payment_tx_hash, amount_paid_usdc, score, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(sessionId, gameType, playerAddress, paymentTxHash, amountPaidUsdc, score, status);
}

/**
 * Create a leaderboard entry in the database.
 * Used to test leaderboard routes with data.
 */
function createLeaderboardEntry(params: {
  sessionId: string;
  gameType: string;
  playerAddress: string;
  score: number;
  periodType: 'daily' | 'weekly' | 'alltime';
  periodDate: string;
  rank?: number;
}): void {
  const { sessionId, gameType, playerAddress, score, periodType, periodDate, rank = null } = params;

  db.prepare(
    `INSERT INTO leaderboard_entries (session_id, game_type, player_address, score, period_type, period_date, rank)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(sessionId, gameType, playerAddress, score, periodType, periodDate, rank);
}

/**
 * Create a prize pool in the database.
 * Used to test prize pool routes with data.
 */
function createPrizePool(params: {
  gameType: string;
  periodType: 'daily' | 'weekly';
  periodDate: string;
  totalAmountUsdc: number;
  totalGames: number;
  status?: 'active' | 'finalized' | 'paid';
}): void {
  const {
    gameType,
    periodType,
    periodDate,
    totalAmountUsdc,
    totalGames,
    status = 'active',
  } = params;

  db.prepare(
    `INSERT INTO prize_pools (game_type, period_type, period_date, total_amount_usdc, total_games, status)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(gameType, periodType, periodDate, totalAmountUsdc, totalGames, status);
}

/**
 * Get today's date in YYYY-MM-DD format (UTC).
 */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// ============================================================================
// Play Routes Tests
// ============================================================================

describe('POST /api/v1/play/:gameType', () => {
  it('should return 402 when no payment header is provided', async () => {
    const response = await request(app).post('/api/v1/play/snake').send({});

    expect(response.status).toBe(402);
    expect(response.headers['x-payment-required']).toBeDefined();
  });

  it('should return 400 for invalid game type', async () => {
    const response = await request(app).post('/api/v1/play/invalid-game').send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid game type');
  });

  it('should accept valid game types', async () => {
    const validGameTypes = ['snake', 'tetris', 'pong', 'breakout', 'space-invaders'];

    for (const gameType of validGameTypes) {
      const response = await request(app).post(`/api/v1/play/${gameType}`).send({});

      // Should return 402 (payment required) not 400 (invalid game type)
      expect(response.status).toBe(402);
    }
  });

  // Note: Full x402 payment flow testing requires mocking the facilitator
  // This is covered in separate x402-specific integration tests
});

// ============================================================================
// Score Routes Tests
// ============================================================================

describe('POST /api/v1/score/submit', () => {
  it('should return 400 when sessionId is missing', async () => {
    const response = await request(app).post('/api/v1/score/submit').send({
      score: 100,
      playerAddress: '0x1234567890123456789012345678901234567890',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation error');
    expect(response.body.message).toContain('sessionId');
  });

  it('should return 400 when playerAddress is missing', async () => {
    const response = await request(app).post('/api/v1/score/submit').send({
      sessionId: 'test-session-123',
      score: 100,
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation error');
    expect(response.body.message).toContain('playerAddress');
  });

  it('should return 400 when playerAddress has invalid format', async () => {
    const response = await request(app).post('/api/v1/score/submit').send({
      sessionId: 'test-session-123',
      score: 100,
      playerAddress: 'invalid-address',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation error');
    expect(response.body.message).toContain('valid Ethereum address');
  });

  it('should return 404 when session does not exist', async () => {
    const response = await request(app).post('/api/v1/score/submit').send({
      sessionId: 'nonexistent-session',
      score: 100,
      playerAddress: '0x1234567890123456789012345678901234567890',
    });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Session not found');
  });

  it('should submit score for valid active session', async () => {
    // Create an active session
    const sessionId = 'test-session-active';
    const playerAddress = '0x1234567890123456789012345678901234567890';

    createTestSession({
      sessionId,
      gameType: 'snake',
      playerAddress,
      paymentTxHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      amountPaidUsdc: 0.01,
      status: 'active',
    });

    const response = await request(app).post('/api/v1/score/submit').send({
      sessionId,
      score: 150,
      playerAddress,
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.session).toBeDefined();
    expect(response.body.session.score).toBe(150);
    expect(response.body.session.status).toBe('completed');
  });

  it('should return 400 for negative score', async () => {
    // Create an active session
    const sessionId = 'test-session-negative';
    const playerAddress = '0x1234567890123456789012345678901234567890';

    createTestSession({
      sessionId,
      gameType: 'snake',
      playerAddress,
      paymentTxHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      amountPaidUsdc: 0.01,
      status: 'active',
    });

    const response = await request(app).post('/api/v1/score/submit').send({
      sessionId,
      score: -50,
      playerAddress,
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation error');
  });

  it('should return 409 when session already completed', async () => {
    // Create a completed session
    const sessionId = 'test-session-completed';
    const playerAddress = '0x1234567890123456789012345678901234567890';

    createTestSession({
      sessionId,
      gameType: 'snake',
      playerAddress,
      paymentTxHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      amountPaidUsdc: 0.01,
      status: 'completed',
      score: 100,
    });

    const response = await request(app).post('/api/v1/score/submit').send({
      sessionId,
      score: 200,
      playerAddress,
    });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Session already completed');
  });

  it('should enforce address ownership', async () => {
    // Create an active session for one player
    const sessionId = 'test-session-ownership';
    const correctPlayerAddress = '0x1111111111111111111111111111111111111111';
    const wrongPlayerAddress = '0x2222222222222222222222222222222222222222';

    createTestSession({
      sessionId,
      gameType: 'snake',
      playerAddress: correctPlayerAddress,
      paymentTxHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      amountPaidUsdc: 0.01,
      status: 'active',
    });

    // Try to submit score with wrong player address
    const response = await request(app).post('/api/v1/score/submit').send({
      sessionId,
      score: 100,
      playerAddress: wrongPlayerAddress,
    });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Unauthorized');
  });
});

// ============================================================================
// Leaderboard Routes Tests
// ============================================================================

describe('GET /api/v1/leaderboard/:gameType/:periodType', () => {
  it('should return 400 for invalid game type', async () => {
    const response = await request(app).get('/api/v1/leaderboard/invalid-game/daily');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation error');
    expect(response.body.message).toContain('Game type');
  });

  it('should return 400 for invalid period type', async () => {
    const response = await request(app).get('/api/v1/leaderboard/snake/invalid-period');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation error');
    expect(response.body.message).toContain('Period type');
  });

  it('should return empty array when no leaderboard entries exist', async () => {
    const response = await request(app).get('/api/v1/leaderboard/snake/daily');

    expect(response.status).toBe(200);
    expect(response.body.entries).toEqual([]);
    expect(response.body.total).toBe(0);
  });

  it('should return leaderboard entries for daily period', async () => {
    const today = getTodayDate();
    const sessionId1 = 'session-1';
    const sessionId2 = 'session-2';

    // Create sessions first
    createTestSession({
      sessionId: sessionId1,
      gameType: 'snake',
      playerAddress: '0x1111111111111111111111111111111111111111',
      paymentTxHash: '0xaaa1111111111111111111111111111111111111111111111111111111111111',
      amountPaidUsdc: 0.01,
      status: 'completed',
      score: 200,
    });

    createTestSession({
      sessionId: sessionId2,
      gameType: 'snake',
      playerAddress: '0x2222222222222222222222222222222222222222',
      paymentTxHash: '0xbbb2222222222222222222222222222222222222222222222222222222222222',
      amountPaidUsdc: 0.01,
      status: 'completed',
      score: 150,
    });

    // Create leaderboard entries
    createLeaderboardEntry({
      sessionId: sessionId1,
      gameType: 'snake',
      playerAddress: '0x1111111111111111111111111111111111111111',
      score: 200,
      periodType: 'daily',
      periodDate: today,
      rank: 1,
    });

    createLeaderboardEntry({
      sessionId: sessionId2,
      gameType: 'snake',
      playerAddress: '0x2222222222222222222222222222222222222222',
      score: 150,
      periodType: 'daily',
      periodDate: today,
      rank: 2,
    });

    const response = await request(app).get('/api/v1/leaderboard/snake/daily');

    expect(response.status).toBe(200);
    expect(response.body.entries).toHaveLength(2);
    expect(response.body.total).toBe(2);
    expect(response.body.entries[0].score).toBe(200);
    expect(response.body.entries[0].rank).toBe(1);
    expect(response.body.entries[1].score).toBe(150);
    expect(response.body.entries[1].rank).toBe(2);
  });

  it('should respect limit parameter', async () => {
    const today = getTodayDate();

    // Create 5 leaderboard entries
    for (let i = 1; i <= 5; i++) {
      const sessionId = `session-limit-${i}`;
      createTestSession({
        sessionId,
        gameType: 'tetris',
        playerAddress: `0x${i.toString().padStart(40, '0')}`,
        paymentTxHash: `0x${i.toString().padStart(64, '0')}`,
        amountPaidUsdc: 0.02,
        status: 'completed',
        score: 100 + i,
      });

      createLeaderboardEntry({
        sessionId,
        gameType: 'tetris',
        playerAddress: `0x${i.toString().padStart(40, '0')}`,
        score: 100 + i,
        periodType: 'daily',
        periodDate: today,
        rank: i,
      });
    }

    const response = await request(app).get('/api/v1/leaderboard/tetris/daily?limit=3');

    expect(response.status).toBe(200);
    expect(response.body.entries).toHaveLength(3);
  });

  it('should support weekly period type', async () => {
    const today = getTodayDate();
    const sessionId = 'session-weekly';

    createTestSession({
      sessionId,
      gameType: 'pong',
      playerAddress: '0x3333333333333333333333333333333333333333',
      paymentTxHash: '0xccc3333333333333333333333333333333333333333333333333333333333333',
      amountPaidUsdc: 0.01,
      status: 'completed',
      score: 500,
    });

    createLeaderboardEntry({
      sessionId,
      gameType: 'pong',
      playerAddress: '0x3333333333333333333333333333333333333333',
      score: 500,
      periodType: 'weekly',
      periodDate: today,
      rank: 1,
    });

    const response = await request(app).get('/api/v1/leaderboard/pong/weekly');

    expect(response.status).toBe(200);
    expect(response.body.entries).toHaveLength(1);
    expect(response.body.entries[0].score).toBe(500);
  });

  it('should support alltime period type', async () => {
    const sessionId = 'session-alltime';

    createTestSession({
      sessionId,
      gameType: 'breakout',
      playerAddress: '0x4444444444444444444444444444444444444444',
      paymentTxHash: '0xddd4444444444444444444444444444444444444444444444444444444444444',
      amountPaidUsdc: 0.015,
      status: 'completed',
      score: 1000,
    });

    createLeaderboardEntry({
      sessionId,
      gameType: 'breakout',
      playerAddress: '0x4444444444444444444444444444444444444444',
      score: 1000,
      periodType: 'alltime',
      periodDate: 'alltime',
      rank: 1,
    });

    const response = await request(app).get('/api/v1/leaderboard/breakout/alltime');

    expect(response.status).toBe(200);
    expect(response.body.entries).toHaveLength(1);
    expect(response.body.entries[0].score).toBe(1000);
  });
});

// ============================================================================
// Prize Pool Routes Tests
// ============================================================================

describe('GET /api/v1/prize/:gameType/:periodType', () => {
  it('should return 400 for invalid game type', async () => {
    const response = await request(app).get('/api/v1/prize/invalid-game/daily');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation error');
    expect(response.body.message).toContain('Game type');
  });

  it('should return 400 for invalid period type', async () => {
    const response = await request(app).get('/api/v1/prize/snake/invalid-period');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation error');
    expect(response.body.message).toContain('Period type');
  });

  it('should return 404 when no prize pool exists', async () => {
    const response = await request(app).get('/api/v1/prize/snake/daily');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Prize pool not found');
  });

  it('should return prize pool for daily period', async () => {
    const today = getTodayDate();

    createPrizePool({
      gameType: 'snake',
      periodType: 'daily',
      periodDate: today,
      totalAmountUsdc: 0.07,
      totalGames: 10,
      status: 'active',
    });

    const response = await request(app).get('/api/v1/prize/snake/daily');

    expect(response.status).toBe(200);
    expect(response.body.pool).toBeDefined();
    expect(response.body.pool.gameType).toBe('snake');
    expect(response.body.pool.periodType).toBe('daily');
    expect(response.body.pool.totalAmountUsdc).toBeCloseTo(0.07, 2);
    expect(response.body.pool.totalGames).toBe(10);
    expect(response.body.pool.status).toBe('active');
  });

  it('should return prize pool for weekly period', async () => {
    const today = getTodayDate();

    createPrizePool({
      gameType: 'tetris',
      periodType: 'weekly',
      periodDate: today,
      totalAmountUsdc: 0.14,
      totalGames: 10,
      status: 'active',
    });

    const response = await request(app).get('/api/v1/prize/tetris/weekly');

    expect(response.status).toBe(200);
    expect(response.body.pool).toBeDefined();
    expect(response.body.pool.gameType).toBe('tetris');
    expect(response.body.pool.periodType).toBe('weekly');
    expect(response.body.pool.totalAmountUsdc).toBeCloseTo(0.14, 2);
  });

  it('should return prize pool with all fields', async () => {
    const today = getTodayDate();

    createPrizePool({
      gameType: 'pong',
      periodType: 'daily',
      periodDate: today,
      totalAmountUsdc: 0.21,
      totalGames: 30,
      status: 'active',
    });

    const response = await request(app).get('/api/v1/prize/pong/daily');

    expect(response.status).toBe(200);
    expect(response.body.pool).toHaveProperty('id');
    expect(response.body.pool).toHaveProperty('gameType');
    expect(response.body.pool).toHaveProperty('periodType');
    expect(response.body.pool).toHaveProperty('periodDate');
    expect(response.body.pool).toHaveProperty('totalAmountUsdc');
    expect(response.body.pool).toHaveProperty('totalGames');
    expect(response.body.pool).toHaveProperty('status');
    expect(response.body.pool).toHaveProperty('winnerAddress');
    expect(response.body.pool).toHaveProperty('createdAt');
  });

  it('should handle different game types separately', async () => {
    const today = getTodayDate();

    // Create pools for different games
    createPrizePool({
      gameType: 'snake',
      periodType: 'daily',
      periodDate: today,
      totalAmountUsdc: 0.07,
      totalGames: 10,
      status: 'active',
    });

    createPrizePool({
      gameType: 'tetris',
      periodType: 'daily',
      periodDate: today,
      totalAmountUsdc: 0.14,
      totalGames: 7,
      status: 'active',
    });

    const snakeResponse = await request(app).get('/api/v1/prize/snake/daily');
    const tetrisResponse = await request(app).get('/api/v1/prize/tetris/daily');

    expect(snakeResponse.body.pool.totalAmountUsdc).toBeCloseTo(0.07, 2);
    expect(snakeResponse.body.pool.totalGames).toBe(10);

    expect(tetrisResponse.body.pool.totalAmountUsdc).toBeCloseTo(0.14, 2);
    expect(tetrisResponse.body.pool.totalGames).toBe(7);
  });
});

// ============================================================================
// Cross-Route Integration Tests
// ============================================================================

describe('Cross-Route Integration', () => {
  it('should handle complete game flow: session -> score -> leaderboard', async () => {
    const sessionId = 'integration-session';
    const playerAddress = '0x5555555555555555555555555555555555555555';
    const today = getTodayDate();

    // Step 1: Create a game session (normally via /play route)
    createTestSession({
      sessionId,
      gameType: 'snake',
      playerAddress,
      paymentTxHash: '0xeee5555555555555555555555555555555555555555555555555555555555555',
      amountPaidUsdc: 0.01,
      status: 'active',
    });

    // Step 2: Submit score
    const scoreResponse = await request(app).post('/api/v1/score/submit').send({
      sessionId,
      score: 250,
      playerAddress,
    });

    expect(scoreResponse.status).toBe(200);

    // Step 3: Manually create leaderboard entry (normally done by score service)
    createLeaderboardEntry({
      sessionId,
      gameType: 'snake',
      playerAddress,
      score: 250,
      periodType: 'daily',
      periodDate: today,
      rank: 1,
    });

    // Step 4: Check leaderboard
    const leaderboardResponse = await request(app).get('/api/v1/leaderboard/snake/daily');

    expect(leaderboardResponse.status).toBe(200);
    expect(leaderboardResponse.body.entries).toHaveLength(1);
    expect(leaderboardResponse.body.entries[0].score).toBe(250);
    expect(leaderboardResponse.body.entries[0].playerAddress).toBe(playerAddress);
  });

  it('should handle multiple games contributing to prize pool', async () => {
    const today = getTodayDate();

    // Create prize pool
    createPrizePool({
      gameType: 'tetris',
      periodType: 'daily',
      periodDate: today,
      totalAmountUsdc: 0,
      totalGames: 0,
      status: 'active',
    });

    // Simulate multiple games (normally prize pool is updated via /play route)
    // Update prize pool manually
    db.prepare(
      `UPDATE prize_pools
       SET total_amount_usdc = total_amount_usdc + ?,
           total_games = total_games + 1
       WHERE game_type = ? AND period_type = ? AND period_date = ?`
    ).run(0.014, 'tetris', 'daily', today); // 70% of $0.02

    db.prepare(
      `UPDATE prize_pools
       SET total_amount_usdc = total_amount_usdc + ?,
           total_games = total_games + 1
       WHERE game_type = ? AND period_type = ? AND period_date = ?`
    ).run(0.014, 'tetris', 'daily', today);

    db.prepare(
      `UPDATE prize_pools
       SET total_amount_usdc = total_amount_usdc + ?,
           total_games = total_games + 1
       WHERE game_type = ? AND period_type = ? AND period_date = ?`
    ).run(0.014, 'tetris', 'daily', today);

    // Check prize pool
    const prizeResponse = await request(app).get('/api/v1/prize/tetris/daily');

    expect(prizeResponse.status).toBe(200);
    expect(prizeResponse.body.pool.totalGames).toBe(3);
    expect(prizeResponse.body.pool.totalAmountUsdc).toBeCloseTo(0.042, 2);
  });
});
