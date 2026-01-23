/**
 * Game Session Factory Tests
 *
 * Tests for the game session fixture factories.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  createGameSession,
  createActiveSession,
  createCompletedSession,
  createAbandonedSession,
  createExpiredSession,
  createPayment,
  createSessionWithPayment,
  createCompletedSessionWithPayment,
  createGameSessions,
  createPlayerHistory,
  createLeaderboardDataset,
  createMixedStateSessions,
  isValidSession,
  isValidPayment,
  resetFactoryCounters,
  generateSessionId,
  generateTxHash,
  generateWalletAddress,
  generateScore,
  generateGameDuration,
  GAME_PRICES,
  TEST_ADDRESSES,
  SESSION_TIMEOUT_MS,
  type GameSession,
  type Payment,
} from '../fixtures/game-session.factory';

describe('Game Session Factory', () => {
  beforeEach(() => {
    resetFactoryCounters();
  });

  // ==========================================================================
  // Constants
  // ==========================================================================

  describe('Constants', () => {
    it('should have correct game prices', () => {
      expect(GAME_PRICES.snake).toBe(0.01);
      expect(GAME_PRICES.tetris).toBe(0.02);
    });

    it('should have test addresses', () => {
      expect(TEST_ADDRESSES.player1).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(TEST_ADDRESSES.player2).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(TEST_ADDRESSES.player3).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(TEST_ADDRESSES.arcade).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(TEST_ADDRESSES.facilitator).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should have session timeout', () => {
      expect(SESSION_TIMEOUT_MS).toBe(30 * 60 * 1000);
    });
  });

  // ==========================================================================
  // Utility Functions
  // ==========================================================================

  describe('Utility Functions', () => {
    describe('generateSessionId', () => {
      it('should generate unique IDs', () => {
        const id1 = generateSessionId();
        const id2 = generateSessionId();
        expect(id1).not.toBe(id2);
      });

      it('should include timestamp and counter', () => {
        const id = generateSessionId();
        expect(id).toMatch(/^session_\d+_\d+$/);
      });
    });

    describe('generateTxHash', () => {
      it('should generate valid 66-character hash', () => {
        const hash = generateTxHash();
        expect(hash).toMatch(/^0x[a-f0-9]{64}$/);
      });

      it('should generate unique hashes', () => {
        const hashes = new Set<string>();
        for (let i = 0; i < 100; i++) {
          hashes.add(generateTxHash());
        }
        expect(hashes.size).toBe(100);
      });
    });

    describe('generateWalletAddress', () => {
      it('should generate valid 42-character address', () => {
        const address = generateWalletAddress();
        expect(address).toMatch(/^0x[a-f0-9]{40}$/);
      });

      it('should generate unique addresses', () => {
        const addresses = new Set<string>();
        for (let i = 0; i < 100; i++) {
          addresses.add(generateWalletAddress());
        }
        expect(addresses.size).toBe(100);
      });
    });

    describe('generateScore', () => {
      it('should generate scores within default range', () => {
        for (let i = 0; i < 100; i++) {
          const score = generateScore();
          expect(score).toBeGreaterThanOrEqual(50);
          expect(score).toBeLessThanOrEqual(1000);
        }
      });

      it('should respect custom range', () => {
        for (let i = 0; i < 100; i++) {
          const score = generateScore(100, 200);
          expect(score).toBeGreaterThanOrEqual(100);
          expect(score).toBeLessThanOrEqual(200);
        }
      });
    });

    describe('generateGameDuration', () => {
      it('should generate duration within default range', () => {
        for (let i = 0; i < 100; i++) {
          const duration = generateGameDuration();
          expect(duration).toBeGreaterThanOrEqual(30000);
          expect(duration).toBeLessThanOrEqual(300000);
        }
      });

      it('should respect custom range', () => {
        for (let i = 0; i < 100; i++) {
          const duration = generateGameDuration(60000, 120000);
          expect(duration).toBeGreaterThanOrEqual(60000);
          expect(duration).toBeLessThanOrEqual(120000);
        }
      });
    });

    describe('resetFactoryCounters', () => {
      it('should reset session counter', () => {
        const id1 = generateSessionId();
        const id2 = generateSessionId();

        resetFactoryCounters();

        const id3 = generateSessionId();
        // After reset, counter starts fresh
        expect(id3).toMatch(/_1$/);
      });
    });
  });

  // ==========================================================================
  // createGameSession
  // ==========================================================================

  describe('createGameSession', () => {
    it('should create session with default values', () => {
      const session = createGameSession();

      expect(session.id).toBeDefined();
      expect(session.game_type).toBe('snake');
      expect(session.player_address).toBe(TEST_ADDRESSES.player1);
      expect(session.payment_tx_hash).toMatch(/^0x[a-f0-9]{64}$/);
      expect(session.amount_paid_usdc).toBe(GAME_PRICES.snake);
      expect(session.status).toBe('active');
      expect(session.score).toBeNull();
      expect(session.created_at).toBeDefined();
      expect(session.completed_at).toBeNull();
      expect(session.game_duration_ms).toBeNull();
    });

    it('should accept custom game type', () => {
      const session = createGameSession({ game_type: 'tetris' });

      expect(session.game_type).toBe('tetris');
      expect(session.amount_paid_usdc).toBe(GAME_PRICES.tetris);
    });

    it('should accept custom player address', () => {
      const address = '0xcustom0000000000000000000000000000000001';
      const session = createGameSession({ player_address: address });

      expect(session.player_address).toBe(address);
    });

    it('should accept custom status', () => {
      const session = createGameSession({ status: 'completed' });

      expect(session.status).toBe('completed');
      expect(session.score).not.toBeNull();
      expect(session.completed_at).not.toBeNull();
    });

    it('should accept Date objects for timestamps', () => {
      const created = new Date('2024-01-01T00:00:00Z');
      const session = createGameSession({ created_at: created });

      expect(session.created_at).toBe(created.toISOString());
    });

    it('should accept all custom values', () => {
      const options = {
        id: 'custom-id',
        game_type: 'tetris' as const,
        player_address: '0xcustom',
        payment_tx_hash: '0xtx123',
        amount_paid_usdc: 0.05,
        score: 500,
        status: 'completed' as const,
        created_at: '2024-01-01T00:00:00Z',
        completed_at: '2024-01-01T00:05:00Z',
        game_duration_ms: 300000,
      };

      const session = createGameSession(options);

      expect(session.id).toBe('custom-id');
      expect(session.game_type).toBe('tetris');
      expect(session.player_address).toBe('0xcustom');
      expect(session.payment_tx_hash).toBe('0xtx123');
      expect(session.amount_paid_usdc).toBe(0.05);
      expect(session.score).toBe(500);
      expect(session.status).toBe('completed');
      expect(session.created_at).toBe('2024-01-01T00:00:00Z');
      expect(session.completed_at).toBe('2024-01-01T00:05:00Z');
      expect(session.game_duration_ms).toBe(300000);
    });

    it('should create valid session objects', () => {
      const session = createGameSession();
      expect(isValidSession(session)).toBe(true);
    });
  });

  // ==========================================================================
  // createActiveSession
  // ==========================================================================

  describe('createActiveSession', () => {
    it('should create session with active status', () => {
      const session = createActiveSession();

      expect(session.status).toBe('active');
      expect(session.score).toBeNull();
      expect(session.completed_at).toBeNull();
      expect(session.game_duration_ms).toBeNull();
    });

    it('should accept custom values while maintaining active status', () => {
      const session = createActiveSession({
        game_type: 'tetris',
        player_address: TEST_ADDRESSES.player2,
      });

      expect(session.status).toBe('active');
      expect(session.game_type).toBe('tetris');
      expect(session.player_address).toBe(TEST_ADDRESSES.player2);
    });

    it('should ignore score override for active sessions', () => {
      const session = createActiveSession({ score: 999 });

      expect(session.score).toBeNull();
    });
  });

  // ==========================================================================
  // createCompletedSession
  // ==========================================================================

  describe('createCompletedSession', () => {
    it('should create session with completed status', () => {
      const session = createCompletedSession(500);

      expect(session.status).toBe('completed');
      expect(session.score).toBe(500);
      expect(session.completed_at).not.toBeNull();
      expect(session.game_duration_ms).not.toBeNull();
    });

    it('should generate random score if not provided', () => {
      const session = createCompletedSession();

      expect(session.status).toBe('completed');
      expect(session.score).toBeGreaterThanOrEqual(50);
      expect(session.score).toBeLessThanOrEqual(1000);
    });

    it('should set created_at before completed_at', () => {
      const session = createCompletedSession(500);

      const created = new Date(session.created_at);
      const completed = new Date(session.completed_at!);

      expect(created.getTime()).toBeLessThanOrEqual(completed.getTime());
    });

    it('should accept custom values', () => {
      const session = createCompletedSession(999, {
        game_type: 'tetris',
        game_duration_ms: 60000,
      });

      expect(session.score).toBe(999);
      expect(session.game_type).toBe('tetris');
      expect(session.game_duration_ms).toBe(60000);
    });
  });

  // ==========================================================================
  // createAbandonedSession
  // ==========================================================================

  describe('createAbandonedSession', () => {
    it('should create session with expired status', () => {
      const session = createAbandonedSession();

      expect(session.status).toBe('expired');
      expect(session.score).toBeNull();
      expect(session.completed_at).toBeNull();
    });

    it('should set created_at in the past', () => {
      const session = createAbandonedSession();
      const now = Date.now();
      const created = new Date(session.created_at).getTime();

      // Should be at least SESSION_TIMEOUT_MS ago
      expect(now - created).toBeGreaterThan(SESSION_TIMEOUT_MS);
    });

    it('should accept custom values', () => {
      const session = createAbandonedSession({
        game_type: 'tetris',
        player_address: TEST_ADDRESSES.player3,
      });

      expect(session.status).toBe('expired');
      expect(session.game_type).toBe('tetris');
      expect(session.player_address).toBe(TEST_ADDRESSES.player3);
    });
  });

  // ==========================================================================
  // createExpiredSession (alias)
  // ==========================================================================

  describe('createExpiredSession', () => {
    it('should be an alias for createAbandonedSession', () => {
      expect(createExpiredSession).toBe(createAbandonedSession);
    });
  });

  // ==========================================================================
  // createPayment
  // ==========================================================================

  describe('createPayment', () => {
    it('should create payment with default values', () => {
      const payment = createPayment();

      expect(payment.tx_hash).toMatch(/^0x[a-f0-9]{64}$/);
      expect(payment.from_address).toBe(TEST_ADDRESSES.player1);
      expect(payment.to_address).toBe(TEST_ADDRESSES.arcade);
      expect(payment.amount_usdc).toBe(GAME_PRICES.snake);
      expect(payment.purpose).toBe('game_payment');
      expect(payment.status).toBe('confirmed');
    });

    it('should accept custom values', () => {
      const payment = createPayment({
        tx_hash: '0xcustom',
        from_address: TEST_ADDRESSES.player2,
        amount_usdc: 0.05,
        purpose: 'prize_payout',
        status: 'pending',
      });

      expect(payment.tx_hash).toBe('0xcustom');
      expect(payment.from_address).toBe(TEST_ADDRESSES.player2);
      expect(payment.amount_usdc).toBe(0.05);
      expect(payment.purpose).toBe('prize_payout');
      expect(payment.status).toBe('pending');
    });

    it('should create valid payment objects', () => {
      const payment = createPayment();
      expect(isValidPayment(payment)).toBe(true);
    });

    it('should assign incrementing IDs', () => {
      resetFactoryCounters();
      const payment1 = createPayment();
      const payment2 = createPayment();

      expect(payment1.id).toBe(1);
      expect(payment2.id).toBe(2);
    });
  });

  // ==========================================================================
  // createSessionWithPayment
  // ==========================================================================

  describe('createSessionWithPayment', () => {
    it('should create linked session and payment', () => {
      const { session, payment } = createSessionWithPayment();

      expect(session.payment_tx_hash).toBe(payment.tx_hash);
      expect(session.player_address).toBe(payment.from_address);
      expect(session.amount_paid_usdc).toBe(payment.amount_usdc);
    });

    it('should use provided payment', () => {
      const existingPayment = createPayment({
        tx_hash: '0xcustompayment',
        amount_usdc: 0.05,
      });

      const { session, payment } = createSessionWithPayment(existingPayment);

      expect(session.payment_tx_hash).toBe('0xcustompayment');
      expect(session.amount_paid_usdc).toBe(0.05);
      expect(payment).toBe(existingPayment);
    });

    it('should use session options for payment', () => {
      const { session, payment } = createSessionWithPayment(undefined, {
        game_type: 'tetris',
        player_address: TEST_ADDRESSES.player2,
      });

      expect(session.game_type).toBe('tetris');
      expect(session.amount_paid_usdc).toBe(GAME_PRICES.tetris);
      expect(payment.amount_usdc).toBe(GAME_PRICES.tetris);
      expect(payment.from_address).toBe(TEST_ADDRESSES.player2);
    });
  });

  // ==========================================================================
  // createCompletedSessionWithPayment
  // ==========================================================================

  describe('createCompletedSessionWithPayment', () => {
    it('should create completed session with linked payment', () => {
      const { session, payment } = createCompletedSessionWithPayment(500);

      expect(session.status).toBe('completed');
      expect(session.score).toBe(500);
      expect(session.payment_tx_hash).toBe(payment.tx_hash);
    });

    it('should accept custom payment and options', () => {
      const customPayment = createPayment({ amount_usdc: 0.02 });
      const { session, payment } = createCompletedSessionWithPayment(999, customPayment, {
        game_type: 'tetris',
      });

      expect(session.score).toBe(999);
      expect(session.game_type).toBe('tetris');
      expect(payment).toBe(customPayment);
    });
  });

  // ==========================================================================
  // Batch Factory Functions
  // ==========================================================================

  describe('createGameSessions', () => {
    it('should create specified number of sessions', () => {
      const sessions = createGameSessions(5);

      expect(sessions.length).toBe(5);
      sessions.forEach((s) => expect(isValidSession(s)).toBe(true));
    });

    it('should apply options to all sessions', () => {
      const sessions = createGameSessions(3, { game_type: 'tetris' });

      sessions.forEach((s) => expect(s.game_type).toBe('tetris'));
    });
  });

  describe('createPlayerHistory', () => {
    it('should create sessions for a specific player', () => {
      const playerAddress = generateWalletAddress();
      const history = createPlayerHistory(playerAddress, 5);

      expect(history.length).toBe(5);
      history.forEach((s) => {
        expect(s.player_address).toBe(playerAddress);
        expect(s.status).toBe('completed');
      });
    });

    it('should create sessions with varying scores', () => {
      const history = createPlayerHistory(TEST_ADDRESSES.player1, 10);
      const scores = history.map((s) => s.score!);

      // Scores should vary but generally trend upward
      expect(new Set(scores).size).toBeGreaterThan(1);
    });

    it('should create sessions with different timestamps', () => {
      const history = createPlayerHistory(TEST_ADDRESSES.player1, 5);
      const timestamps = history.map((s) => new Date(s.created_at).getTime());

      // Each timestamp should be different and in order
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeGreaterThan(timestamps[i - 1]);
      }
    });

    it('should use specified game type', () => {
      const history = createPlayerHistory(TEST_ADDRESSES.player1, 3, 'tetris');

      history.forEach((s) => {
        expect(s.game_type).toBe('tetris');
        expect(s.amount_paid_usdc).toBe(GAME_PRICES.tetris);
      });
    });
  });

  describe('createLeaderboardDataset', () => {
    it('should create sessions for multiple players', () => {
      const dataset = createLeaderboardDataset(3, 5);

      expect(dataset.length).toBe(15); // 3 players x 5 sessions

      // Extract unique player addresses
      const uniquePlayers = new Set(dataset.map((s) => s.player_address));
      expect(uniquePlayers.size).toBe(3);
    });

    it('should use specified game type', () => {
      const dataset = createLeaderboardDataset(2, 2, 'tetris');

      dataset.forEach((s) => expect(s.game_type).toBe('tetris'));
    });
  });

  describe('createMixedStateSessions', () => {
    it('should create sessions in all states', () => {
      const { active, completed, abandoned, all } = createMixedStateSessions();

      expect(active.length).toBeGreaterThan(0);
      expect(completed.length).toBeGreaterThan(0);
      expect(abandoned.length).toBeGreaterThan(0);
      expect(all.length).toBe(active.length + completed.length + abandoned.length);
    });

    it('should have correct status for each category', () => {
      const { active, completed, abandoned } = createMixedStateSessions();

      active.forEach((s) => expect(s.status).toBe('active'));
      completed.forEach((s) => expect(s.status).toBe('completed'));
      abandoned.forEach((s) => expect(s.status).toBe('expired'));
    });

    it('should include both game types', () => {
      const { all } = createMixedStateSessions();

      const snakeSessions = all.filter((s) => s.game_type === 'snake');
      const tetrisSessions = all.filter((s) => s.game_type === 'tetris');

      expect(snakeSessions.length).toBeGreaterThan(0);
      expect(tetrisSessions.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Validation Utilities
  // ==========================================================================

  describe('isValidSession', () => {
    it('should return true for valid sessions', () => {
      expect(isValidSession(createGameSession())).toBe(true);
      expect(isValidSession(createActiveSession())).toBe(true);
      expect(isValidSession(createCompletedSession(500))).toBe(true);
      expect(isValidSession(createAbandonedSession())).toBe(true);
    });

    it('should return false for null/undefined', () => {
      expect(isValidSession(null)).toBe(false);
      expect(isValidSession(undefined)).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(isValidSession('string')).toBe(false);
      expect(isValidSession(123)).toBe(false);
      expect(isValidSession([])).toBe(false);
    });

    it('should return false for objects with missing fields', () => {
      expect(isValidSession({})).toBe(false);
      expect(isValidSession({ id: 'test' })).toBe(false);
    });

    it('should return false for objects with invalid field types', () => {
      const session = createGameSession();

      expect(isValidSession({ ...session, id: 123 })).toBe(false);
      expect(isValidSession({ ...session, game_type: 'invalid' })).toBe(false);
      expect(isValidSession({ ...session, status: 'invalid' })).toBe(false);
    });
  });

  describe('isValidPayment', () => {
    it('should return true for valid payments', () => {
      expect(isValidPayment(createPayment())).toBe(true);
    });

    it('should return false for null/undefined', () => {
      expect(isValidPayment(null)).toBe(false);
      expect(isValidPayment(undefined)).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(isValidPayment('string')).toBe(false);
      expect(isValidPayment(123)).toBe(false);
    });

    it('should return false for objects with missing fields', () => {
      expect(isValidPayment({})).toBe(false);
      expect(isValidPayment({ tx_hash: '0x123' })).toBe(false);
    });

    it('should return false for objects with invalid purpose', () => {
      const payment = createPayment();
      expect(isValidPayment({ ...payment, purpose: 'invalid' })).toBe(false);
    });
  });
});
