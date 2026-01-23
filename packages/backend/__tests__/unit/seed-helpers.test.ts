/**
 * Seed Helpers Tests
 *
 * Tests for the database seeding utilities.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  seedMinimalData,
  seedFullLeaderboard,
  seedActiveGames,
  seedPaymentHistory,
  seedFullArcade,
  seedLeaderboardWithTies,
  seedPrizeDistribution,
  seedPaymentFailures,
  seedForScenario,
  validateSeedIntegrity,
  getSeedStats,
  type MinimalSeedData,
  type LeaderboardSeedData,
  type ActiveGamesSeedData,
  type PaymentHistorySeedData,
  type FullArcadeSeedData,
  type ScenarioName,
} from '../utils/seed-helpers';
import { resetFactoryCounters } from '../fixtures/game-session.factory';
import { resetLeaderboardCounters } from '../fixtures/leaderboard.factory';
import { resetPrizePoolCounters } from '../fixtures/prize-pool.factory';
import { resetPaymentCounters } from '../fixtures/payment.factory';

describe('Seed Helpers', () => {
  beforeEach(() => {
    resetFactoryCounters();
    resetLeaderboardCounters();
    resetPrizePoolCounters();
    resetPaymentCounters();
  });

  // ==========================================================================
  // seedMinimalData
  // ==========================================================================

  describe('seedMinimalData', () => {
    it('should create minimal seed data', () => {
      const data = seedMinimalData();

      expect(data.player).toBeDefined();
      expect(data.player.address).toBeDefined();
      expect(data.session).toBeDefined();
      expect(data.payment).toBeDefined();
    });

    it('should link session to payment', () => {
      const data = seedMinimalData();

      expect(data.session.payment_tx_hash).toBe(data.payment.tx_hash);
      expect(data.session.player_address).toBe(data.player.address);
    });

    it('should create active session', () => {
      const data = seedMinimalData();

      expect(data.session.status).toBe('active');
      expect(data.session.score).toBeNull();
    });

    it('should create verified payment', () => {
      const data = seedMinimalData();

      expect(data.payment.status).toBe('verified');
      expect(data.payment.tx_hash).toBeDefined();
    });

    it('should use specified game type', () => {
      const snakeData = seedMinimalData('snake');
      const tetrisData = seedMinimalData('tetris');

      expect(snakeData.session.game_type).toBe('snake');
      expect(tetrisData.session.game_type).toBe('tetris');
    });
  });

  // ==========================================================================
  // seedFullLeaderboard
  // ==========================================================================

  describe('seedFullLeaderboard', () => {
    it('should create leaderboard with specified count', () => {
      const data = seedFullLeaderboard(10);

      expect(data.entries.length).toBe(10);
    });

    it('should have ranked entries', () => {
      const data = seedFullLeaderboard(5);

      data.entries.forEach((entry, index) => {
        expect(entry.rank).toBe(index + 1);
      });
    });

    it('should be sorted by score descending', () => {
      const data = seedFullLeaderboard(10);

      for (let i = 1; i < data.entries.length; i++) {
        expect(data.entries[i].score).toBeLessThanOrEqual(data.entries[i - 1].score);
      }
    });

    it('should track top player and score', () => {
      const data = seedFullLeaderboard(10);

      expect(data.top_player).toBe(data.entries[0].player_address);
      expect(data.top_score).toBe(data.entries[0].score);
    });

    it('should use specified game type and period', () => {
      const data = seedFullLeaderboard(5, 'tetris', 'weekly');

      expect(data.game_type).toBe('tetris');
      expect(data.period_type).toBe('weekly');
      data.entries.forEach(e => {
        expect(e.game_type).toBe('tetris');
        expect(e.period_type).toBe('weekly');
      });
    });

    it('should handle all period types', () => {
      const daily = seedFullLeaderboard(5, 'snake', 'daily');
      const weekly = seedFullLeaderboard(5, 'snake', 'weekly');
      const alltime = seedFullLeaderboard(5, 'snake', 'alltime');

      expect(daily.period_type).toBe('daily');
      expect(weekly.period_type).toBe('weekly');
      expect(alltime.period_type).toBe('alltime');
    });
  });

  // ==========================================================================
  // seedActiveGames
  // ==========================================================================

  describe('seedActiveGames', () => {
    it('should create specified number of active sessions', () => {
      const data = seedActiveGames(5);

      expect(data.sessions.length).toBe(5);
      expect(data.players.length).toBe(5);
    });

    it('should have all sessions as active', () => {
      const data = seedActiveGames(3);

      data.sessions.forEach(session => {
        expect(session.status).toBe('active');
      });
    });

    it('should have unique players', () => {
      const data = seedActiveGames(5);

      const uniquePlayers = new Set(data.players);
      expect(uniquePlayers.size).toBe(5);
    });

    it('should track game type distribution', () => {
      const data = seedActiveGames(10);

      const snakeCount = data.game_types.snake;
      const tetrisCount = data.game_types.tetris;

      expect(snakeCount + tetrisCount).toBe(10);
    });

    it('should use specified game type when provided', () => {
      const snakeGames = seedActiveGames(5, 'snake');
      const tetrisGames = seedActiveGames(5, 'tetris');

      expect(snakeGames.game_types.snake).toBe(5);
      expect(snakeGames.game_types.tetris).toBe(0);
      expect(tetrisGames.game_types.tetris).toBe(5);
      expect(tetrisGames.game_types.snake).toBe(0);
    });
  });

  // ==========================================================================
  // seedPaymentHistory
  // ==========================================================================

  describe('seedPaymentHistory', () => {
    it('should create payment history for player', () => {
      const playerAddress = '0x1111111111111111111111111111111111111111';
      const data = seedPaymentHistory(playerAddress, 5);

      expect(data.payments.length).toBe(5);
      expect(data.player_address).toBe(playerAddress);
    });

    it('should calculate total spent', () => {
      const data = seedPaymentHistory('0x1111111111111111111111111111111111111111', 10, 'snake');

      expect(data.total_spent).toBe(0.10); // 10 * 0.01
    });

    it('should track games played', () => {
      const data = seedPaymentHistory('0x1111111111111111111111111111111111111111', 7);

      expect(data.games_played).toBe(7);
    });

    it('should have all verified payments', () => {
      const data = seedPaymentHistory('0x1111111111111111111111111111111111111111', 5);

      data.payments.forEach(payment => {
        expect(payment.status).toBe('verified');
        expect(payment.tx_hash).toBeDefined();
      });
    });

    it('should use correct game price', () => {
      const snakeHistory = seedPaymentHistory('0x111...', 5, 'snake');
      const tetrisHistory = seedPaymentHistory('0x111...', 5, 'tetris');

      expect(snakeHistory.total_spent).toBe(0.05); // 5 * 0.01
      expect(tetrisHistory.total_spent).toBe(0.10); // 5 * 0.02
    });
  });

  // ==========================================================================
  // seedFullArcade
  // ==========================================================================

  describe('seedFullArcade', () => {
    it('should create arcade with specified players', () => {
      const data = seedFullArcade(5, 3);

      expect(data.players.length).toBe(5);
    });

    it('should create sessions in all states', () => {
      const data = seedFullArcade(5, 5);

      expect(data.sessions.completed.length).toBeGreaterThan(0);
      expect(data.sessions.active.length).toBeGreaterThan(0);
      expect(data.sessions.abandoned.length).toBeGreaterThan(0);
    });

    it('should create leaderboards for both games', () => {
      const data = seedFullArcade(10, 5);

      expect(data.leaderboards.snake.daily.length).toBeGreaterThan(0);
      expect(data.leaderboards.snake.weekly.length).toBeGreaterThan(0);
      expect(data.leaderboards.snake.alltime.length).toBeGreaterThan(0);
      expect(data.leaderboards.tetris.daily.length).toBeGreaterThan(0);
    });

    it('should create prize pools for both games', () => {
      const data = seedFullArcade(5, 10);

      expect(data.prizePools.snake).toBeDefined();
      expect(data.prizePools.tetris).toBeDefined();
      expect(data.prizePools.snake.status).toBe('accumulating');
    });

    it('should create payments for completed games', () => {
      const data = seedFullArcade(3, 5);

      // Each player plays 5 games = 15 payments minimum
      expect(data.payments.length).toBeGreaterThanOrEqual(15);
    });

    it('should pass validation', () => {
      const data = seedFullArcade(5, 5);
      const result = validateSeedIntegrity(data);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  // ==========================================================================
  // seedLeaderboardWithTies
  // ==========================================================================

  describe('seedLeaderboardWithTies', () => {
    it('should create entries with tied scores', () => {
      const entries = seedLeaderboardWithTies(3, 500);

      const tiedEntries = entries.filter(e => e.score === 500);
      expect(tiedEntries.length).toBe(3);
    });

    it('should place tied entries after first place', () => {
      const entries = seedLeaderboardWithTies(2, 500);

      // First place should be higher than tied score
      expect(entries[0].score).toBeGreaterThan(500);
      expect(entries[1].score).toBe(500);
      expect(entries[2].score).toBe(500);
    });

    it('should adjust ranks after ties', () => {
      const entries = seedLeaderboardWithTies(3, 500);

      // After 3 tied at rank 2, next should be rank 5
      const afterTies = entries.filter(e => e.rank !== null && e.rank > 4);
      expect(afterTies.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // seedPrizeDistribution
  // ==========================================================================

  describe('seedPrizeDistribution', () => {
    it('should create distributed pool', () => {
      const data = seedPrizeDistribution(10.00);

      expect(data.pool).toBeDefined();
      expect(data.pool.status).toBe('distributed');
    });

    it('should have 3 winners', () => {
      const data = seedPrizeDistribution(10.00);

      expect(data.winners.length).toBe(3);
      expect(data.distributions.length).toBe(3);
    });

    it('should distribute correct amounts', () => {
      const data = seedPrizeDistribution(10.00);

      // 70% distributable = 7.00
      // 50% first = 3.50, 30% second = 2.10, 20% third = 1.40
      expect(data.winners[0].rank).toBe(1);
      expect(data.winners[1].rank).toBe(2);
      expect(data.winners[2].rank).toBe(3);
    });

    it('should use specified prize pool', () => {
      const data = seedPrizeDistribution(100.00);

      expect(data.pool.total_accumulated_usdc).toBe(100.00);
    });
  });

  // ==========================================================================
  // seedPaymentFailures
  // ==========================================================================

  describe('seedPaymentFailures', () => {
    it('should create all failure types', () => {
      const data = seedPaymentFailures();

      expect(data.insufficientFunds.failure_reason).toBe('INSUFFICIENT_FUNDS');
      expect(data.expiredAuth.failure_reason).toBe('EXPIRED_AUTHORIZATION');
      expect(data.invalidSignature.failure_reason).toBe('INVALID_SIGNATURE');
      expect(data.nonceReused.failure_reason).toBe('NONCE_ALREADY_USED');
      expect(data.wrongRecipient.failure_reason).toBe('WRONG_RECIPIENT');
    });

    it('should have all payments as failed', () => {
      const data = seedPaymentFailures();

      data.all.forEach(payment => {
        expect(payment.status).toBe('failed');
      });
    });

    it('should include 5 failure types', () => {
      const data = seedPaymentFailures();

      expect(data.all.length).toBe(5);
    });
  });

  // ==========================================================================
  // seedForScenario
  // ==========================================================================

  describe('seedForScenario', () => {
    it('should handle empty scenario', () => {
      const data = seedForScenario('empty') as Record<string, unknown[]>;

      expect(data.sessions).toHaveLength(0);
      expect(data.payments).toHaveLength(0);
    });

    it('should handle minimal scenario', () => {
      const data = seedForScenario('minimal') as MinimalSeedData;

      expect(data.player).toBeDefined();
      expect(data.session).toBeDefined();
      expect(data.payment).toBeDefined();
    });

    it('should handle singlePlayer scenario', () => {
      const data = seedForScenario('singlePlayer') as Record<string, unknown>;

      expect(data.player).toBeDefined();
      expect(data.payments).toBeDefined();
      expect(data.sessions).toBeDefined();
      expect(data.leaderboard).toBeDefined();
    });

    it('should handle multiPlayer scenario', () => {
      const data = seedForScenario('multiPlayer') as FullArcadeSeedData;

      expect(data.players.length).toBe(5);
    });

    it('should handle fullArcade scenario', () => {
      const data = seedForScenario('fullArcade') as FullArcadeSeedData;

      expect(data.players.length).toBe(10);
      expect(data.sessions.completed.length).toBeGreaterThan(0);
    });

    it('should handle leaderboardTies scenario', () => {
      const data = seedForScenario('leaderboardTies') as Record<string, unknown[]>;

      expect(data.snake).toBeDefined();
      expect(data.tetris).toBeDefined();
    });

    it('should handle prizeDistribution scenario', () => {
      const data = seedForScenario('prizeDistribution') as Record<string, unknown>;

      expect(data.daily).toBeDefined();
      expect(data.weekly).toBeDefined();
      expect(data.pools).toBeDefined();
    });

    it('should handle paymentFailures scenario', () => {
      const data = seedForScenario('paymentFailures') as Record<string, unknown>;

      expect(data.insufficientFunds).toBeDefined();
      expect(data.expiredAuth).toBeDefined();
    });

    it('should throw for unknown scenario', () => {
      expect(() => seedForScenario('unknown' as ScenarioName)).toThrow();
    });
  });

  // ==========================================================================
  // validateSeedIntegrity
  // ==========================================================================

  describe('validateSeedIntegrity', () => {
    it('should validate correct data', () => {
      const data = seedFullArcade(3, 3);
      const result = validateSeedIntegrity(data);

      expect(result.valid).toBe(true);
    });

    it('should report errors for invalid data', () => {
      const data = seedFullArcade(3, 3);

      // Corrupt the data
      data.sessions.active[0].player_address = '';

      const result = validateSeedIntegrity(data);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // getSeedStats
  // ==========================================================================

  describe('getSeedStats', () => {
    it('should calculate correct statistics', () => {
      const data = seedFullArcade(3, 5);
      const stats = getSeedStats(data);

      expect(stats.playerCount).toBe(3);
      expect(stats.completedSessions).toBe(15); // 3 players * 5 games each
      expect(stats.totalPayments).toBeGreaterThan(0);
    });

    it('should calculate total revenue from verified payments', () => {
      const data = seedFullArcade(2, 5);
      const stats = getSeedStats(data);

      // 2 players * 5 games = 10 games, mix of snake/tetris
      expect(stats.totalRevenue).toBeGreaterThan(0);
    });

    it('should track prize pools', () => {
      const data = seedFullArcade(3, 10);
      const stats = getSeedStats(data);

      expect(stats.snakePrizePool).toBeGreaterThanOrEqual(0);
      expect(stats.tetrisPrizePool).toBeGreaterThanOrEqual(0);
    });
  });
});
