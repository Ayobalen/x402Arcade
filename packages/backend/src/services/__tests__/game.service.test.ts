/**
 * GameService Tests
 *
 * Tests for the database-backed GameService class.
 */

import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import { initializeSchema } from '../../db/schema';
import { GameService } from '../game';

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
        '0xoldtxhash',
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
        '0xrecenttxhash',
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
        '0xoldtxhash',
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
        '0xcompletedtxhash',
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
        '0xexpiredtxhash',
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
        '0xrecenttxhash',
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
          `0xtxhash${i}`,
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
        '0xoldtxhash',
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
