/**
 * GameService Tests
 *
 * Tests for the database-backed GameService class.
 */

import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import { initializeSchema } from '../../db/schema';
import { GameService } from '../game';

// Helper to generate valid 66-char tx hash (0x + 64 hex chars)
const makeTxHash = (prefix: string): string => {
  const hex = prefix.toLowerCase().replace(/[^a-f0-9]/g, '');
  return '0x' + hex.padEnd(64, '0').slice(0, 64);
};

describe('GameService', () => {
  let db: DatabaseType;
  let gameService: GameService;

  beforeEach(() => {
    // Create an in-memory database for testing
    db = new Database(':memory:');
    initializeSchema(db);
    gameService = new GameService(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('createSession', () => {
    it('should create a valid session', () => {
      const params = {
        gameType: 'snake' as const,
        playerAddress: '0x1234567890abcdef1234567890abcdef12345678',
        paymentTxHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        amountPaidUsdc: 0.01,
      };

      const session = gameService.createSession(params);

      // Verify session structure
      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
      expect(session.gameType).toBe('snake');
      expect(session.playerAddress).toBe(params.playerAddress);
      expect(session.paymentTxHash).toBe(params.paymentTxHash);
      expect(session.amountPaidUsdc).toBe(0.01);
      expect(session.score).toBeNull();
      expect(session.status).toBe('active');
      expect(session.createdAt).toBeDefined();
      expect(session.completedAt).toBeNull();
      expect(session.gameDurationMs).toBeNull();
    });

    it('should reject duplicate payment hash', () => {
      const params = {
        gameType: 'snake' as const,
        playerAddress: '0x1234567890abcdef1234567890abcdef12345678',
        paymentTxHash: makeTxHash(
          'd0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0'
        ),
        amountPaidUsdc: 0.01,
      };

      // Create first session
      gameService.createSession(params);

      // Try to create second session with same payment hash
      expect(() => {
        gameService.createSession(params);
      }).toThrow(/Payment transaction hash already used/);
    });

    it('should persist session to database', () => {
      const params = {
        gameType: 'tetris' as const,
        playerAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        paymentTxHash: makeTxHash(
          'pe12121212121212121212121212121212121212121212121212121212121212'
        ),
        amountPaidUsdc: 0.02,
      };

      const session = gameService.createSession(params);

      // Verify session exists in database
      const retrieved = gameService.getSession(session.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(session.id);
      expect(retrieved?.gameType).toBe('tetris');
      expect(retrieved?.playerAddress).toBe(params.playerAddress);
    });
  });

  describe('getSession', () => {
    it('should return null for missing ID', () => {
      const session = gameService.getSession('non-existent-id');
      expect(session).toBeNull();
    });

    it('should retrieve existing session', () => {
      const params = {
        gameType: 'snake' as const,
        playerAddress: '0x1234567890abcdef1234567890abcdef12345678',
        paymentTxHash: makeTxHash(
          '9e12121212121212121212121212121212121212121212121212121212121212'
        ),
        amountPaidUsdc: 0.01,
      };

      const created = gameService.createSession(params);
      const retrieved = gameService.getSession(created.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.gameType).toBe(created.gameType);
      expect(retrieved?.playerAddress).toBe(created.playerAddress);
      expect(retrieved?.paymentTxHash).toBe(created.paymentTxHash);
      expect(retrieved?.amountPaidUsdc).toBe(created.amountPaidUsdc);
    });
  });

  describe('completeSession', () => {
    it('should update score and status', () => {
      const params = {
        gameType: 'snake' as const,
        playerAddress: '0x1234567890abcdef1234567890abcdef12345678',
        paymentTxHash: makeTxHash(
          'c012121212121212121212121212121212121212121212121212121212121212'
        ),
        amountPaidUsdc: 0.01,
      };

      const session = gameService.createSession(params);
      const score = 15000;

      const completed = gameService.completeSession(session.id, score);

      expect(completed.status).toBe('completed');
      expect(completed.score).toBe(score);
      expect(completed.completedAt).not.toBeNull();
      expect(completed.gameDurationMs).not.toBeNull();
      expect(completed.gameDurationMs).toBeGreaterThan(0);
    });

    it('should fail for non-active sessions', () => {
      const params = {
        gameType: 'snake' as const,
        playerAddress: '0x1234567890abcdef1234567890abcdef12345678',
        paymentTxHash: makeTxHash(
          'fa11111111111111111111111111111111111111111111111111111111111111'
        ),
        amountPaidUsdc: 0.01,
      };

      const session = gameService.createSession(params);

      // Complete session once
      gameService.completeSession(session.id, 10000);

      // Try to complete again
      expect(() => {
        gameService.completeSession(session.id, 20000);
      }).toThrow(/Cannot complete session with status: completed/);
    });

    it('should fail for non-existent session', () => {
      expect(() => {
        gameService.completeSession('non-existent-id', 10000);
      }).toThrow(/Session not found/);
    });

    it('should calculate game duration correctly', () => {
      const params = {
        gameType: 'snake' as const,
        playerAddress: '0x1234567890abcdef1234567890abcdef12345678',
        paymentTxHash: makeTxHash(
          'd012121212121212121212121212121212121212121212121212121212121212'
        ),
        amountPaidUsdc: 0.01,
      };

      const session = gameService.createSession(params);

      // Wait a tiny bit to ensure duration > 0
      const start = Date.now();
      while (Date.now() - start < 10) {
        // busy wait 10ms
      }

      const completed = gameService.completeSession(session.id, 15000);

      expect(completed.gameDurationMs).not.toBeNull();
      expect(completed.gameDurationMs).toBeGreaterThanOrEqual(10);
    });
  });

  describe('getActiveSession', () => {
    it('should find active session for player', () => {
      const params = {
        gameType: 'snake' as const,
        playerAddress: '0x1234567890abcdef1234567890abcdef12345678',
        paymentTxHash: makeTxHash(
          'ac11111111111111111111111111111111111111111111111111111111111111'
        ),
        amountPaidUsdc: 0.01,
      };

      const created = gameService.createSession(params);
      const active = gameService.getActiveSession(params.playerAddress, 'snake');

      expect(active).not.toBeNull();
      expect(active?.id).toBe(created.id);
      expect(active?.status).toBe('active');
    });

    it('should return null when no active session exists', () => {
      const active = gameService.getActiveSession(
        '0x1234567890abcdef1234567890abcdef12345678',
        'snake'
      );

      expect(active).toBeNull();
    });

    it('should not return completed sessions', () => {
      const params = {
        gameType: 'snake' as const,
        playerAddress: '0x1234567890abcdef1234567890abcdef12345678',
        paymentTxHash: makeTxHash(
          'c0de111111111111111111111111111111111111111111111111111111111111'
        ),
        amountPaidUsdc: 0.01,
      };

      const session = gameService.createSession(params);
      gameService.completeSession(session.id, 10000);

      const active = gameService.getActiveSession(params.playerAddress, 'snake');
      expect(active).toBeNull();
    });

    it('should auto-expire stale sessions', () => {
      // Create a session from 31 minutes ago
      const oldTimestamp = new Date(Date.now() - 31 * 60 * 1000).toISOString();
      db.prepare(
        `
        INSERT INTO game_sessions (
          id, game_type, player_address, payment_tx_hash,
          amount_paid_usdc, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        'stale-session-id',
        'snake',
        '0x1234567890abcdef1234567890abcdef12345678',
        makeTxHash('5a1e111111111111111111111111111111111111111111111111111111111111'),
        0.01,
        'active',
        oldTimestamp
      );

      const active = gameService.getActiveSession(
        '0x1234567890abcdef1234567890abcdef12345678',
        'snake'
      );

      // Should return null because session is stale
      expect(active).toBeNull();

      // Verify session was expired
      const session = gameService.getSession('stale-session-id');
      expect(session?.status).toBe('expired');
    });
  });

  describe('expireSession', () => {
    it('should expire an active session', () => {
      const params = {
        gameType: 'snake' as const,
        playerAddress: '0x1234567890abcdef1234567890abcdef12345678',
        paymentTxHash: makeTxHash(
          'e012121212121212121212121212121212121212121212121212121212121212'
        ),
        amountPaidUsdc: 0.01,
      };

      const session = gameService.createSession(params);
      const result = gameService.expireSession(session.id);

      expect(result).toBe(true);

      const expired = gameService.getSession(session.id);
      expect(expired?.status).toBe('expired');
      expect(expired?.completedAt).not.toBeNull();
    });

    it('should return false for non-existent session', () => {
      const result = gameService.expireSession('non-existent-id');
      expect(result).toBe(false);
    });

    it('should return false for already completed session', () => {
      const params = {
        gameType: 'snake' as const,
        playerAddress: '0x1234567890abcdef1234567890abcdef12345678',
        paymentTxHash: makeTxHash(
          'a1c0111111111111111111111111111111111111111111111111111111111111'
        ),
        amountPaidUsdc: 0.01,
      };

      const session = gameService.createSession(params);
      gameService.completeSession(session.id, 10000);

      const result = gameService.expireSession(session.id);
      expect(result).toBe(false);
    });
  });

  describe('getPlayerSessions', () => {
    beforeEach(() => {
      // Create multiple sessions for testing
      const player1 = '0x1111111111111111111111111111111111111111';
      const player2 = '0x2222222222222222222222222222222222222222';

      // Player 1: 2 snake games, 1 tetris game
      gameService.createSession({
        gameType: 'snake',
        playerAddress: player1,
        paymentTxHash: makeTxHash(
          '1111111111111111111111111111111111111111111111111111111111111111'
        ),
        amountPaidUsdc: 0.01,
      });

      gameService.createSession({
        gameType: 'snake',
        playerAddress: player1,
        paymentTxHash: makeTxHash(
          '2222222222222222222222222222222222222222222222222222222222222222'
        ),
        amountPaidUsdc: 0.01,
      });

      const tetrisSession = gameService.createSession({
        gameType: 'tetris',
        playerAddress: player1,
        paymentTxHash: makeTxHash(
          '3333333333333333333333333333333333333333333333333333333333333333'
        ),
        amountPaidUsdc: 0.02,
      });

      // Complete one session
      gameService.completeSession(tetrisSession.id, 25000);

      // Player 2: 1 snake game
      gameService.createSession({
        gameType: 'snake',
        playerAddress: player2,
        paymentTxHash: makeTxHash(
          '4444444444444444444444444444444444444444444444444444444444444444'
        ),
        amountPaidUsdc: 0.01,
      });
    });

    it('should get all sessions for a player', () => {
      const sessions = gameService.getPlayerSessions({
        playerAddress: '0x1111111111111111111111111111111111111111',
      });

      expect(sessions).toHaveLength(3);
    });

    it('should filter by game type', () => {
      const sessions = gameService.getPlayerSessions({
        playerAddress: '0x1111111111111111111111111111111111111111',
        gameType: 'snake',
      });

      expect(sessions).toHaveLength(2);
      expect(sessions.every((s) => s.gameType === 'snake')).toBe(true);
    });

    it('should filter by status', () => {
      const sessions = gameService.getPlayerSessions({
        playerAddress: '0x1111111111111111111111111111111111111111',
        status: 'completed',
      });

      expect(sessions).toHaveLength(1);
      expect(sessions[0].status).toBe('completed');
    });

    it('should support pagination', () => {
      const page1 = gameService.getPlayerSessions({
        playerAddress: '0x1111111111111111111111111111111111111111',
        limit: 2,
        offset: 0,
      });

      const page2 = gameService.getPlayerSessions({
        playerAddress: '0x1111111111111111111111111111111111111111',
        limit: 2,
        offset: 2,
      });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(1);
    });

    it('should return sessions in descending order by created_at', () => {
      const sessions = gameService.getPlayerSessions({
        playerAddress: '0x1111111111111111111111111111111111111111',
      });

      expect(sessions).toHaveLength(3);

      // Verify descending order
      for (let i = 0; i < sessions.length - 1; i++) {
        const current = new Date(sessions[i].createdAt).getTime();
        const next = new Date(sessions[i + 1].createdAt).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });
  });

  describe('expireOldSessions', () => {
    it('should expire sessions older than default 30 minutes', () => {
      // Create a session from 31 minutes ago (should be expired)
      const oldTimestamp = new Date(Date.now() - 31 * 60 * 1000).toISOString();
      db.prepare(
        `
        INSERT INTO game_sessions (
          id, game_type, player_address, payment_tx_hash,
          amount_paid_usdc, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        'old-session-id',
        'snake',
        '0x1234567890abcdef1234567890abcdef12345678',
        makeTxHash('01d0111111111111111111111111111111111111111111111111111111111111'),
        0.01,
        'active',
        oldTimestamp
      );

      // Create a recent session (should NOT be expired)
      const recentTimestamp = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      db.prepare(
        `
        INSERT INTO game_sessions (
          id, game_type, player_address, payment_tx_hash,
          amount_paid_usdc, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        'recent-session-id',
        'tetris',
        '0xabcdef1234567890abcdef1234567890abcdef12',
        makeTxHash('1ece111111111111111111111111111111111111111111111111111111111111'),
        0.02,
        'active',
        recentTimestamp
      );

      // Expire old sessions
      const expiredCount = gameService.expireOldSessions();

      // Verify count
      expect(expiredCount).toBe(1);

      // Verify old session was expired
      const oldSession = gameService.getSession('old-session-id');
      expect(oldSession).not.toBeNull();
      expect(oldSession?.status).toBe('expired');
      expect(oldSession?.completedAt).not.toBeNull();

      // Verify recent session is still active
      const recentSession = gameService.getSession('recent-session-id');
      expect(recentSession).not.toBeNull();
      expect(recentSession?.status).toBe('active');
      expect(recentSession?.completedAt).toBeNull();
    });

    it('should use custom maxAgeMinutes parameter', () => {
      // Create a session from 16 minutes ago (older than 15 min threshold)
      const oldTimestamp = new Date(Date.now() - 16 * 60 * 1000).toISOString();
      db.prepare(
        `
        INSERT INTO game_sessions (
          id, game_type, player_address, payment_tx_hash,
          amount_paid_usdc, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        'old-session-id',
        'snake',
        '0x1234567890abcdef1234567890abcdef12345678',
        makeTxHash('01d0222222222222222222222222222222222222222222222222222222222222'),
        0.01,
        'active',
        oldTimestamp
      );

      // Expire sessions older than 15 minutes
      const expiredCount = gameService.expireOldSessions(15);

      // Verify count
      expect(expiredCount).toBe(1);

      // Verify session was expired
      const session = gameService.getSession('old-session-id');
      expect(session?.status).toBe('expired');
    });

    it('should not expire completed sessions', () => {
      // Create an old completed session
      const oldTimestamp = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour ago
      db.prepare(
        `
        INSERT INTO game_sessions (
          id, game_type, player_address, payment_tx_hash,
          amount_paid_usdc, status, created_at, completed_at, score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        'completed-session-id',
        'snake',
        '0x1234567890abcdef1234567890abcdef12345678',
        makeTxHash('c0de222222222222222222222222222222222222222222222222222222222222'),
        0.01,
        'completed',
        oldTimestamp,
        new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        15000
      );

      // Try to expire old sessions
      const expiredCount = gameService.expireOldSessions();

      // Verify no sessions were expired
      expect(expiredCount).toBe(0);

      // Verify completed session is still completed
      const session = gameService.getSession('completed-session-id');
      expect(session?.status).toBe('completed');
    });

    it('should not expire already expired sessions', () => {
      // Create an old expired session
      const oldTimestamp = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      db.prepare(
        `
        INSERT INTO game_sessions (
          id, game_type, player_address, payment_tx_hash,
          amount_paid_usdc, status, created_at, completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        'expired-session-id',
        'snake',
        '0x1234567890abcdef1234567890abcdef12345678',
        makeTxHash('e012222222222222222222222222222222222222222222222222222222222222'),
        0.01,
        'expired',
        oldTimestamp,
        new Date(Date.now() - 30 * 60 * 1000).toISOString()
      );

      // Try to expire old sessions
      const expiredCount = gameService.expireOldSessions();

      // Verify no sessions were expired
      expect(expiredCount).toBe(0);

      // Verify session is still expired (not double-processed)
      const session = gameService.getSession('expired-session-id');
      expect(session?.status).toBe('expired');
    });

    it('should return 0 when no sessions need expiring', () => {
      // Create only recent active sessions
      const recentTimestamp = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      db.prepare(
        `
        INSERT INTO game_sessions (
          id, game_type, player_address, payment_tx_hash,
          amount_paid_usdc, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        'recent-session-id',
        'tetris',
        '0x1234567890abcdef1234567890abcdef12345678',
        makeTxHash('1ece222222222222222222222222222222222222222222222222222222222222'),
        0.02,
        'active',
        recentTimestamp
      );

      // Try to expire old sessions
      const expiredCount = gameService.expireOldSessions();

      // Verify no sessions were expired
      expect(expiredCount).toBe(0);

      // Verify session is still active
      const session = gameService.getSession('recent-session-id');
      expect(session?.status).toBe('active');
    });

    it('should expire multiple old sessions at once', () => {
      // Create 3 old active sessions
      const oldTimestamp = new Date(Date.now() - 45 * 60 * 1000).toISOString();

      for (let i = 1; i <= 3; i++) {
        db.prepare(
          `
          INSERT INTO game_sessions (
            id, game_type, player_address, payment_tx_hash,
            amount_paid_usdc, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `
        ).run(
          `old-session-${i}`,
          'snake',
          `0x${i.toString().padStart(40, '0')}`,
          makeTxHash(`${i.toString(16).padStart(64, '0')}`),
          0.01,
          'active',
          oldTimestamp
        );
      }

      // Expire old sessions
      const expiredCount = gameService.expireOldSessions();

      // Verify count
      expect(expiredCount).toBe(3);

      // Verify all sessions were expired
      for (let i = 1; i <= 3; i++) {
        const session = gameService.getSession(`old-session-${i}`);
        expect(session?.status).toBe('expired');
        expect(session?.completedAt).not.toBeNull();
      }
    });

    it('should set completed_at timestamp when expiring', () => {
      // Create an old session
      const oldTimestamp = new Date(Date.now() - 45 * 60 * 1000).toISOString();
      db.prepare(
        `
        INSERT INTO game_sessions (
          id, game_type, player_address, payment_tx_hash,
          amount_paid_usdc, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        'old-session-id',
        'snake',
        '0x1234567890abcdef1234567890abcdef12345678',
        makeTxHash('01d0333333333333333333333333333333333333333333333333333333333333'),
        0.01,
        'active',
        oldTimestamp
      );

      // Record time before expiring
      const beforeExpire = new Date().toISOString();

      // Expire old sessions
      gameService.expireOldSessions();

      // Record time after expiring
      const afterExpire = new Date().toISOString();

      // Verify completed_at was set
      const session = gameService.getSession('old-session-id');
      expect(session?.completedAt).not.toBeNull();

      // Verify completed_at is recent (within test execution window)
      const completedAt = session?.completedAt;
      expect(completedAt).toBeDefined();
      if (completedAt) {
        expect(completedAt >= beforeExpire).toBe(true);
        expect(completedAt <= afterExpire).toBe(true);
      }
    });
  });
});
