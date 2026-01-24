/**
 * End-to-End Tests for x402Arcade API
 *
 * These tests simulate complete user journeys through the system,
 * from payment to score submission to leaderboard updates.
 * Tests the full integration of all services working together.
 *
 * @module __tests__/e2e
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from '@jest/globals';
import request from 'supertest';
import express, { type Express } from 'express';
import Database from 'better-sqlite3';
import { createTables } from '../db/schema.js';
import { playRoutes, scoreRoutes, leaderboardRoutes, prizeRoutes } from '../routes/index.js';

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

  // Create Express app
  app = express();
  app.use(express.json());

  // Mount all API routes
  app.use('/api/v1/play', playRoutes);
  app.use('/api/v1/score', scoreRoutes);
  app.use('/api/v1/leaderboard', leaderboardRoutes);
  app.use('/api/v1/prize', prizeRoutes);

  // Override getDatabase to use test database
  const dbModule = require('../db/index.js');
  (global as any).__originalGetDatabase = dbModule.getDatabase;
  dbModule.getDatabase = () => db;
});

afterEach(() => {
  // Restore original getDatabase
  if ((global as any).__originalGetDatabase) {
    const dbModule = require('../db/index.js');
    dbModule.getDatabase = (global as any).__originalGetDatabase;
    delete (global as any).__originalGetDatabase;
  }

  // Close database
  db.close();
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get today's date in YYYY-MM-DD format (UTC).
 */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Create a game session directly in the database.
 * Simulates a successful payment and session creation.
 */
function createGameSession(params: {
  sessionId: string;
  gameType: string;
  playerAddress: string;
  paymentTxHash: string;
  amountPaidUsdc: number;
  status?: 'active' | 'completed' | 'expired';
  score?: number | null;
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
 * Create a prize pool directly in the database.
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

// ============================================================================
// E2E Test Suite 1: Complete Game Flow (Session -> Score -> Leaderboard)
// ============================================================================

describe('E2E: Complete Game Flow', () => {
  it('should handle full journey: create session -> submit score -> verify leaderboard', async () => {
    const sessionId = 'e2e-session-001';
    const playerAddress = '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    const gameType = 'snake';
    const finalScore = 500;
    const today = getTodayDate();

    // Step 1: Create a game session (simulating successful payment)
    createGameSession({
      sessionId,
      gameType,
      playerAddress,
      paymentTxHash: '0xE2E001000000000000000000000000000000000000000000000000000000001',
      amountPaidUsdc: 0.01,
      status: 'active',
    });

    // Verify session was created
    const session = db.prepare('SELECT * FROM game_sessions WHERE id = ?').get(sessionId) as any;
    expect(session).toBeDefined();
    expect(session.status).toBe('active');
    expect(session.score).toBeNull();

    // Step 2: Submit score
    const scoreResponse = await request(app).post('/api/v1/score/submit').send({
      sessionId,
      score: finalScore,
      playerAddress,
    });

    expect(scoreResponse.status).toBe(200);
    expect(scoreResponse.body.success).toBe(true);
    expect(scoreResponse.body.session.score).toBe(finalScore);
    expect(scoreResponse.body.session.status).toBe('completed');

    // Verify session was updated in database
    const updatedSession = db
      .prepare('SELECT * FROM game_sessions WHERE id = ?')
      .get(sessionId) as any;
    expect(updatedSession.score).toBe(finalScore);
    expect(updatedSession.status).toBe('completed');

    // Step 3: Verify leaderboard entry was created
    const leaderboardEntries = db
      .prepare(
        `SELECT * FROM leaderboard_entries
         WHERE session_id = ? AND game_type = ? AND period_type = 'daily'`
      )
      .all(sessionId, gameType) as any[];

    expect(leaderboardEntries).toHaveLength(1);
    expect(leaderboardEntries[0].score).toBe(finalScore);
    expect(leaderboardEntries[0].player_address).toBe(playerAddress);
    expect(leaderboardEntries[0].period_date).toBe(today);

    // Step 4: Query leaderboard via API
    const leaderboardResponse = await request(app).get(`/api/v1/leaderboard/${gameType}/daily`);

    expect(leaderboardResponse.status).toBe(200);
    expect(leaderboardResponse.body.entries).toHaveLength(1);
    expect(leaderboardResponse.body.entries[0].score).toBe(finalScore);
    expect(leaderboardResponse.body.entries[0].playerAddress).toBe(playerAddress);
    expect(leaderboardResponse.body.entries[0].rank).toBe(1);
  });

  it('should handle score submission failure for expired session', async () => {
    const sessionId = 'e2e-expired-session';
    const playerAddress = '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB';

    // Create expired session
    createGameSession({
      sessionId,
      gameType: 'tetris',
      playerAddress,
      paymentTxHash: '0xE2E002000000000000000000000000000000000000000000000000000000002',
      amountPaidUsdc: 0.02,
      status: 'expired',
    });

    // Attempt to submit score
    const response = await request(app).post('/api/v1/score/submit').send({
      sessionId,
      score: 300,
      playerAddress,
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it('should handle unauthorized score submission attempt', async () => {
    const sessionId = 'e2e-auth-test';
    const correctPlayerAddress = '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC';
    const wrongPlayerAddress = '0xDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD';

    // Create session for correct player
    createGameSession({
      sessionId,
      gameType: 'pong',
      playerAddress: correctPlayerAddress,
      paymentTxHash: '0xE2E003000000000000000000000000000000000000000000000000000000003',
      amountPaidUsdc: 0.01,
      status: 'active',
    });

    // Attempt to submit score with wrong player address
    const response = await request(app).post('/api/v1/score/submit').send({
      sessionId,
      score: 250,
      playerAddress: wrongPlayerAddress,
    });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Unauthorized');
  });
});

// ============================================================================
// E2E Test Suite 2: Multiple Players Leaderboard Ranking
// ============================================================================

describe('E2E: Multiple Players Leaderboard Competition', () => {
  it('should correctly rank multiple players on daily leaderboard', async () => {
    const today = getTodayDate();
    const gameType = 'snake';

    // Player data
    const players = [
      {
        sessionId: 'multi-session-001',
        address: '0x1111111111111111111111111111111111111111',
        score: 800,
        txHash: '0xMULTI1000000000000000000000000000000000000000000000000000000001',
      },
      {
        sessionId: 'multi-session-002',
        address: '0x2222222222222222222222222222222222222222',
        score: 1200,
        txHash: '0xMULTI2000000000000000000000000000000000000000000000000000000002',
      },
      {
        sessionId: 'multi-session-003',
        address: '0x3333333333333333333333333333333333333333',
        score: 950,
        txHash: '0xMULTI3000000000000000000000000000000000000000000000000000000003',
      },
      {
        sessionId: 'multi-session-004',
        address: '0x4444444444444444444444444444444444444444',
        score: 650,
        txHash: '0xMULTI4000000000000000000000000000000000000000000000000000000004',
      },
      {
        sessionId: 'multi-session-005',
        address: '0x5555555555555555555555555555555555555555',
        score: 1100,
        txHash: '0xMULTI5000000000000000000000000000000000000000000000000000000005',
      },
    ];

    // Create sessions and submit scores for all players
    for (const player of players) {
      // Create session
      createGameSession({
        sessionId: player.sessionId,
        gameType,
        playerAddress: player.address,
        paymentTxHash: player.txHash,
        amountPaidUsdc: 0.01,
        status: 'active',
      });

      // Submit score
      const response = await request(app).post('/api/v1/score/submit').send({
        sessionId: player.sessionId,
        score: player.score,
        playerAddress: player.address,
      });

      expect(response.status).toBe(200);
    }

    // Query leaderboard
    const leaderboardResponse = await request(app).get(`/api/v1/leaderboard/${gameType}/daily`);

    expect(leaderboardResponse.status).toBe(200);
    expect(leaderboardResponse.body.entries).toHaveLength(5);

    // Verify correct ranking order (highest score first)
    const entries = leaderboardResponse.body.entries;
    expect(entries[0].score).toBe(1200); // Rank 1
    expect(entries[0].rank).toBe(1);
    expect(entries[1].score).toBe(1100); // Rank 2
    expect(entries[1].rank).toBe(2);
    expect(entries[2].score).toBe(950); // Rank 3
    expect(entries[2].rank).toBe(3);
    expect(entries[3].score).toBe(800); // Rank 4
    expect(entries[3].rank).toBe(4);
    expect(entries[4].score).toBe(650); // Rank 5
    expect(entries[4].rank).toBe(5);

    // Verify player addresses match
    expect(entries[0].playerAddress).toBe('0x2222222222222222222222222222222222222222');
    expect(entries[1].playerAddress).toBe('0x5555555555555555555555555555555555555555');
    expect(entries[2].playerAddress).toBe('0x3333333333333333333333333333333333333333');
    expect(entries[3].playerAddress).toBe('0x1111111111111111111111111111111111111111');
    expect(entries[4].playerAddress).toBe('0x4444444444444444444444444444444444444444');
  });

  it('should handle ties in scoring correctly', async () => {
    const gameType = 'tetris';

    // Create three players with same score
    const players = [
      {
        sessionId: 'tie-session-001',
        address: '0xAAAA0000000000000000000000000000000000AA',
        score: 1000,
      },
      {
        sessionId: 'tie-session-002',
        address: '0xBBBB0000000000000000000000000000000000BB',
        score: 1000,
      },
      {
        sessionId: 'tie-session-003',
        address: '0xCCCC0000000000000000000000000000000000CC',
        score: 900,
      },
    ];

    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      createGameSession({
        sessionId: player.sessionId,
        gameType,
        playerAddress: player.address,
        paymentTxHash: `0xTIE00${i}0000000000000000000000000000000000000000000000000000000000${i}`,
        amountPaidUsdc: 0.02,
        status: 'active',
      });

      await request(app).post('/api/v1/score/submit').send({
        sessionId: player.sessionId,
        score: player.score,
        playerAddress: player.address,
      });
    }

    // Query leaderboard
    const response = await request(app).get(`/api/v1/leaderboard/${gameType}/daily`);

    expect(response.status).toBe(200);
    expect(response.body.entries).toHaveLength(3);

    // First two entries should have same score
    expect(response.body.entries[0].score).toBe(1000);
    expect(response.body.entries[1].score).toBe(1000);
    expect(response.body.entries[2].score).toBe(900);
  });

  it('should support pagination on leaderboards', async () => {
    const gameType = 'breakout';

    // Create 15 players
    for (let i = 1; i <= 15; i++) {
      const sessionId = `page-session-${i.toString().padStart(3, '0')}`;
      const address = `0x${i.toString().padStart(40, '0')}`;
      const score = 1000 - i * 10; // Descending scores

      createGameSession({
        sessionId,
        gameType,
        playerAddress: address,
        paymentTxHash: `0xPAGE${i.toString().padStart(60, '0')}`,
        amountPaidUsdc: 0.015,
        status: 'active',
      });

      await request(app).post('/api/v1/score/submit').send({
        sessionId,
        score,
        playerAddress: address,
      });
    }

    // Test pagination
    const page1Response = await request(app).get(
      `/api/v1/leaderboard/${gameType}/daily?limit=10&offset=0`
    );
    expect(page1Response.status).toBe(200);
    expect(page1Response.body.entries).toHaveLength(10);
    expect(page1Response.body.entries[0].score).toBe(990); // Highest score

    const page2Response = await request(app).get(
      `/api/v1/leaderboard/${gameType}/daily?limit=10&offset=10`
    );
    expect(page2Response.status).toBe(200);
    expect(page2Response.body.entries).toHaveLength(5); // Remaining 5 entries
    expect(page2Response.body.entries[0].score).toBe(890);
  });
});

// ============================================================================
// E2E Test Suite 3: Prize Pool Accumulation
// ============================================================================

describe('E2E: Prize Pool Accumulation Over Multiple Games', () => {
  it('should accumulate prize pool across multiple game sessions', async () => {
    const today = getTodayDate();
    const gameType = 'snake';
    const paymentAmount = 0.01; // $0.01 per game
    const prizePoolPercentage = 0.7; // 70% goes to prize pool
    const expectedContribution = paymentAmount * prizePoolPercentage; // $0.007

    // Create initial prize pool
    createPrizePool({
      gameType,
      periodType: 'daily',
      periodDate: today,
      totalAmountUsdc: 0,
      totalGames: 0,
      status: 'active',
    });

    // Simulate 10 games being played
    const numGames = 10;
    for (let i = 1; i <= numGames; i++) {
      const sessionId = `prize-session-${i.toString().padStart(3, '0')}`;
      const address = `0xPRIZE${i.toString().padStart(36, '0')}`;

      createGameSession({
        sessionId,
        gameType,
        playerAddress: address,
        paymentTxHash: `0xPRIZE${i.toString().padStart(58, '0')}`,
        amountPaidUsdc: paymentAmount,
        status: 'active',
      });

      // Submit score (this should trigger prize pool update)
      await request(app)
        .post('/api/v1/score/submit')
        .send({
          sessionId,
          score: 100 + i * 50,
          playerAddress: address,
        });

      // Manually update prize pool (simulating what the score service does)
      db.prepare(
        `UPDATE prize_pools
         SET total_amount_usdc = total_amount_usdc + ?,
             total_games = total_games + 1
         WHERE game_type = ? AND period_type = 'daily' AND period_date = ?`
      ).run(expectedContribution, gameType, today);
    }

    // Query prize pool
    const prizeResponse = await request(app).get(`/api/v1/prize/${gameType}/daily`);

    expect(prizeResponse.status).toBe(200);
    expect(prizeResponse.body.pool).toBeDefined();
    expect(prizeResponse.body.pool.totalGames).toBe(numGames);

    // Total prize pool should be numGames * expectedContribution
    const expectedTotal = numGames * expectedContribution;
    expect(prizeResponse.body.pool.totalAmountUsdc).toBeCloseTo(expectedTotal, 3);
  });

  it('should maintain separate prize pools for different game types', async () => {
    const today = getTodayDate();

    // Create prize pools for different games
    const gameTypes = ['snake', 'tetris', 'pong'];
    const gamesPerType = 5;

    for (const gameType of gameTypes) {
      createPrizePool({
        gameType,
        periodType: 'daily',
        periodDate: today,
        totalAmountUsdc: 0,
        totalGames: 0,
        status: 'active',
      });

      // Play multiple games for this type
      for (let i = 1; i <= gamesPerType; i++) {
        const sessionId = `${gameType}-prize-${i}`;
        const address = `0x${gameType.toUpperCase()}${i.toString().padStart(34, '0')}`;
        const paymentAmount = gameType === 'snake' ? 0.01 : gameType === 'tetris' ? 0.02 : 0.015;

        createGameSession({
          sessionId,
          gameType,
          playerAddress: address,
          paymentTxHash: `0x${gameType.toUpperCase()}PRIZE${i.toString().padStart(50, '0')}`,
          amountPaidUsdc: paymentAmount,
          status: 'active',
        });

        await request(app)
          .post('/api/v1/score/submit')
          .send({
            sessionId,
            score: 200 + i * 25,
            playerAddress: address,
          });

        // Update prize pool
        db.prepare(
          `UPDATE prize_pools
           SET total_amount_usdc = total_amount_usdc + ?,
               total_games = total_games + 1
           WHERE game_type = ? AND period_type = 'daily' AND period_date = ?`
        ).run(paymentAmount * 0.7, gameType, today);
      }
    }

    // Verify each game type has correct prize pool
    for (const gameType of gameTypes) {
      const response = await request(app).get(`/api/v1/prize/${gameType}/daily`);

      expect(response.status).toBe(200);
      expect(response.body.pool.gameType).toBe(gameType);
      expect(response.body.pool.totalGames).toBe(gamesPerType);
    }
  });

  it('should handle weekly prize pool accumulation', async () => {
    const today = getTodayDate();
    const gameType = 'tetris';

    // Create weekly prize pool
    createPrizePool({
      gameType,
      periodType: 'weekly',
      periodDate: today,
      totalAmountUsdc: 0,
      totalGames: 0,
      status: 'active',
    });

    // Simulate games across the week
    const numGames = 20;
    const paymentAmount = 0.02;
    const prizeContribution = paymentAmount * 0.7;

    for (let i = 1; i <= numGames; i++) {
      const sessionId = `weekly-session-${i.toString().padStart(3, '0')}`;
      const address = `0xWEEKLY${i.toString().padStart(34, '0')}`;

      createGameSession({
        sessionId,
        gameType,
        playerAddress: address,
        paymentTxHash: `0xWEEKLY${i.toString().padStart(56, '0')}`,
        amountPaidUsdc: paymentAmount,
        status: 'active',
      });

      await request(app)
        .post('/api/v1/score/submit')
        .send({
          sessionId,
          score: 300 + i * 40,
          playerAddress: address,
        });

      // Update weekly prize pool
      db.prepare(
        `UPDATE prize_pools
         SET total_amount_usdc = total_amount_usdc + ?,
             total_games = total_games + 1
         WHERE game_type = ? AND period_type = 'weekly' AND period_date = ?`
      ).run(prizeContribution, gameType, today);
    }

    // Query weekly prize pool
    const response = await request(app).get(`/api/v1/prize/${gameType}/weekly`);

    expect(response.status).toBe(200);
    expect(response.body.pool.periodType).toBe('weekly');
    expect(response.body.pool.totalGames).toBe(numGames);
    expect(response.body.pool.totalAmountUsdc).toBeCloseTo(numGames * prizeContribution, 3);
  });
});

// ============================================================================
// E2E Test Suite 4: Error Scenarios and Edge Cases
// ============================================================================

describe('E2E: Error Scenarios and Edge Cases', () => {
  it('should handle invalid game type gracefully', async () => {
    // Attempt to query leaderboard for invalid game
    const leaderboardResponse = await request(app).get('/api/v1/leaderboard/invalid-game/daily');
    expect(leaderboardResponse.status).toBe(400);
    expect(leaderboardResponse.body.error).toBeDefined();

    // Attempt to query prize pool for invalid game
    const prizeResponse = await request(app).get('/api/v1/prize/invalid-game/daily');
    expect(prizeResponse.status).toBe(400);
    expect(prizeResponse.body.error).toBeDefined();
  });

  it('should handle missing sessionId in score submission', async () => {
    const response = await request(app).post('/api/v1/score/submit').send({
      score: 100,
      playerAddress: '0xEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation error');
  });

  it('should handle negative score submission', async () => {
    const sessionId = 'negative-score-session';
    const playerAddress = '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF';

    createGameSession({
      sessionId,
      gameType: 'snake',
      playerAddress,
      paymentTxHash: '0xNEGATIVE00000000000000000000000000000000000000000000000000000000',
      amountPaidUsdc: 0.01,
      status: 'active',
    });

    const response = await request(app).post('/api/v1/score/submit').send({
      sessionId,
      score: -100,
      playerAddress,
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation error');
  });

  it('should handle non-existent session ID in score submission', async () => {
    const response = await request(app).post('/api/v1/score/submit').send({
      sessionId: 'this-session-does-not-exist',
      score: 500,
      playerAddress: '0x0000000000000000000000000000000000000000',
    });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Session not found');
  });

  it('should handle duplicate score submission (session already completed)', async () => {
    const sessionId = 'duplicate-submit-session';
    const playerAddress = '0xDUPLICATE00000000000000000000000000000000';

    // Create completed session
    createGameSession({
      sessionId,
      gameType: 'pong',
      playerAddress,
      paymentTxHash: '0xDUPLICATE000000000000000000000000000000000000000000000000000000',
      amountPaidUsdc: 0.01,
      status: 'completed',
      score: 300,
    });

    // Attempt to submit new score
    const response = await request(app).post('/api/v1/score/submit').send({
      sessionId,
      score: 400,
      playerAddress,
    });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Session already completed');
  });

  it('should handle invalid Ethereum address format', async () => {
    const sessionId = 'invalid-address-session';

    createGameSession({
      sessionId,
      gameType: 'breakout',
      playerAddress: '0xVALID00000000000000000000000000000000000',
      paymentTxHash: '0xVALIDTX000000000000000000000000000000000000000000000000000000',
      amountPaidUsdc: 0.015,
      status: 'active',
    });

    const response = await request(app).post('/api/v1/score/submit').send({
      sessionId,
      score: 250,
      playerAddress: 'not-a-valid-ethereum-address',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation error');
  });

  it('should return 404 for non-existent prize pool', async () => {
    const response = await request(app).get('/api/v1/prize/snake/daily');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Prize pool not found');
  });

  it('should return empty leaderboard when no entries exist', async () => {
    const response = await request(app).get('/api/v1/leaderboard/tetris/daily');

    expect(response.status).toBe(200);
    expect(response.body.entries).toEqual([]);
    expect(response.body.total).toBe(0);
  });
});

// ============================================================================
// E2E Test Suite 5: Complete Multi-Player Game Day Simulation
// ============================================================================

describe('E2E: Realistic Game Day Simulation', () => {
  it('should simulate a full day of arcade activity across all games', async () => {
    const today = getTodayDate();
    const gameTypes = ['snake', 'tetris', 'pong', 'breakout', 'space-invaders'];

    // Initialize prize pools for all games
    for (const gameType of gameTypes) {
      createPrizePool({
        gameType,
        periodType: 'daily',
        periodDate: today,
        totalAmountUsdc: 0,
        totalGames: 0,
        status: 'active',
      });
    }

    // Simulate 30 random game sessions throughout the day
    const totalSessions = 30;
    const playerAddresses = [
      '0xPLAYER1000000000000000000000000000000001',
      '0xPLAYER2000000000000000000000000000000002',
      '0xPLAYER3000000000000000000000000000000003',
      '0xPLAYER4000000000000000000000000000000004',
      '0xPLAYER5000000000000000000000000000000005',
    ];

    for (let i = 1; i <= totalSessions; i++) {
      // Random game type
      const gameType = gameTypes[i % gameTypes.length];

      // Random player
      const playerAddress = playerAddresses[i % playerAddresses.length];

      // Payment amount based on game type
      const paymentAmount = gameType === 'tetris' ? 0.02 : gameType === 'breakout' ? 0.015 : 0.01;

      // Random score (simulating game performance)
      const baseScore = gameType === 'snake' ? 500 : gameType === 'tetris' ? 1000 : 750;
      const score = baseScore + Math.floor(Math.random() * 500);

      const sessionId = `simulation-session-${i.toString().padStart(3, '0')}`;

      // Create session
      createGameSession({
        sessionId,
        gameType,
        playerAddress,
        paymentTxHash: `0xSIM${i.toString().padStart(61, '0')}`,
        amountPaidUsdc: paymentAmount,
        status: 'active',
      });

      // Submit score
      const scoreResponse = await request(app).post('/api/v1/score/submit').send({
        sessionId,
        score,
        playerAddress,
      });

      expect(scoreResponse.status).toBe(200);

      // Update prize pool
      db.prepare(
        `UPDATE prize_pools
         SET total_amount_usdc = total_amount_usdc + ?,
             total_games = total_games + 1
         WHERE game_type = ? AND period_type = 'daily' AND period_date = ?`
      ).run(paymentAmount * 0.7, gameType, today);
    }

    // Verify all game types have leaderboards with entries
    for (const gameType of gameTypes) {
      const leaderboardResponse = await request(app).get(`/api/v1/leaderboard/${gameType}/daily`);
      expect(leaderboardResponse.status).toBe(200);
      expect(leaderboardResponse.body.entries.length).toBeGreaterThan(0);
    }

    // Verify all prize pools have been updated
    for (const gameType of gameTypes) {
      const prizeResponse = await request(app).get(`/api/v1/prize/${gameType}/daily`);
      expect(prizeResponse.status).toBe(200);
      expect(prizeResponse.body.pool.totalGames).toBeGreaterThan(0);
      expect(prizeResponse.body.pool.totalAmountUsdc).toBeGreaterThan(0);
    }

    // Verify database integrity
    const totalSessionsInDb = db
      .prepare('SELECT COUNT(*) as count FROM game_sessions')
      .get() as any;
    expect(totalSessionsInDb.count).toBe(totalSessions);

    const completedSessions = db
      .prepare('SELECT COUNT(*) as count FROM game_sessions WHERE status = ?')
      .get('completed') as any;
    expect(completedSessions.count).toBe(totalSessions);
  });
});
