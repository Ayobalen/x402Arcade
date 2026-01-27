/**
 * Redis-based Game Service
 */

import { v4 as uuidv4 } from 'uuid';
import type { Redis } from 'ioredis';
import { RedisKeys, type GameSessionHash } from '../db/schema.js';
import type {
  GameType,
  GameSession,
  CreateSessionParams,
  GetPlayerSessionsOptions,
} from './game.js';

export const SESSION_TIMEOUT_MS = 15 * 60 * 1000;

/**
 * GameService for Redis
 */
export class GameServiceRedis {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * Create a new game session
   */
  async createSession(params: CreateSessionParams): Promise<GameSession> {
    const { gameType, playerAddress, paymentTxHash, amountPaidUsdc } = params;
    const normalizedAddress = playerAddress.toLowerCase();
    const sessionId = uuidv4();
    const now = new Date().toISOString();

    // Check for duplicate payment
    const existingSession = await this.redis.get(RedisKeys.sessionByPayment(paymentTxHash));
    if (existingSession) {
      throw new Error(`Payment transaction hash already used: ${paymentTxHash}`);
    }

    const sessionData: GameSessionHash = {
      id: sessionId,
      gameType,
      playerAddress: normalizedAddress,
      paymentTxHash,
      amountPaidUsdc: amountPaidUsdc.toString(),
      score: null,
      status: 'active',
      createdAt: now,
      completedAt: null,
      gameDurationMs: null,
    };

    // Store session hash
    await this.redis.hset(RedisKeys.session(sessionId), sessionData as any);

    // Add to indexes
    await Promise.all([
      this.redis.sadd(RedisKeys.sessionsByPlayer(normalizedAddress), sessionId),
      this.redis.sadd(RedisKeys.activeSessions(), sessionId),
      this.redis.set(RedisKeys.sessionByPayment(paymentTxHash), sessionId),
    ]);

    return this.hashToSession(sessionData);
  }

  /**
   * Get session by ID
   */
  async getSession(id: string): Promise<GameSession | null> {
    const data = await this.redis.hgetall(RedisKeys.session(id));
    if (!data || Object.keys(data).length === 0) return null;
    return this.hashToSession(data as GameSessionHash);
  }

  /**
   * Complete a session
   */
  async completeSession(id: string, score: number): Promise<GameSession> {
    const session = await this.getSession(id);
    if (!session) {
      throw new Error(`Session not found: ${id}`);
    }
    if (session.status !== 'active') {
      throw new Error(`Cannot complete session with status: ${session.status}`);
    }

    const completedAt = new Date().toISOString();
    const gameDurationMs = Date.now() - new Date(session.createdAt).getTime();

    await Promise.all([
      this.redis.hset(RedisKeys.session(id), {
        score: score.toString(),
        status: 'completed',
        completedAt,
        gameDurationMs: gameDurationMs.toString(),
      } as any),
      this.redis.srem(RedisKeys.activeSessions(), id),
      this.redis.sadd(RedisKeys.completedSessions(), id),
    ]);

    return {
      ...session,
      score,
      status: 'completed',
      completedAt,
      gameDurationMs,
    };
  }

  /**
   * Get active session for player/game
   */
  async getActiveSession(playerAddress: string, gameType: GameType): Promise<GameSession | null> {
    const normalizedAddress = playerAddress.toLowerCase();
    const sessionIds = await this.redis.smembers(RedisKeys.sessionsByPlayer(normalizedAddress));

    for (const sessionId of sessionIds) {
      const session = await this.getSession(sessionId);
      if (session && session.status === 'active' && session.gameType === gameType) {
        // Check if stale
        const age = Date.now() - new Date(session.createdAt).getTime();
        if (age > SESSION_TIMEOUT_MS) {
          await this.expireSession(sessionId);
          return null;
        }
        return session;
      }
    }
    return null;
  }

  /**
   * Expire a session
   */
  async expireSession(id: string): Promise<boolean> {
    const session = await this.getSession(id);
    if (!session || session.status !== 'active') {
      return false;
    }

    const completedAt = new Date().toISOString();
    await Promise.all([
      this.redis.hset(RedisKeys.session(id), {
        status: 'expired',
        completedAt,
      } as any),
      this.redis.srem(RedisKeys.activeSessions(), id),
    ]);

    return true;
  }

  /**
   * Get player sessions
   */
  async getPlayerSessions(options: GetPlayerSessionsOptions): Promise<GameSession[]> {
    const { playerAddress, gameType, status, limit = 50 } = options;
    const normalizedAddress = playerAddress.toLowerCase();

    const sessionIds = await this.redis.smembers(RedisKeys.sessionsByPlayer(normalizedAddress));
    const sessions: GameSession[] = [];

    for (const sessionId of sessionIds) {
      if (sessions.length >= limit) break;

      const session = await this.getSession(sessionId);
      if (!session) continue;

      if (gameType && session.gameType !== gameType) continue;
      if (status && session.status !== status) continue;

      sessions.push(session);
    }

    return sessions.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Expire old sessions
   */
  async expireOldSessions(maxAgeMinutes: number = 30): Promise<number> {
    const activeIds = await this.redis.smembers(RedisKeys.activeSessions());
    const maxAge = maxAgeMinutes * 60 * 1000;
    let count = 0;

    for (const sessionId of activeIds) {
      const session = await this.getSession(sessionId);
      if (!session) continue;

      const age = Date.now() - new Date(session.createdAt).getTime();
      if (age > maxAge) {
        await this.expireSession(sessionId);
        count++;
      }
    }

    return count;
  }

  private hashToSession(hash: GameSessionHash): GameSession {
    return {
      id: hash.id,
      gameType: hash.gameType as GameType,
      playerAddress: hash.playerAddress,
      paymentTxHash: hash.paymentTxHash,
      amountPaidUsdc: parseFloat(hash.amountPaidUsdc),
      score: hash.score ? parseInt(hash.score) : null,
      status: hash.status as 'active' | 'completed' | 'expired',
      createdAt: hash.createdAt,
      completedAt: hash.completedAt,
      gameDurationMs: hash.gameDurationMs ? parseInt(hash.gameDurationMs) : null,
    };
  }
}
