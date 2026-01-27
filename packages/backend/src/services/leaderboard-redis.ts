/**
 * Redis-based Leaderboard Service
 */

import type { Redis } from 'ioredis';
import { RedisKeys } from '../db/schema.js';
import type { GameType } from './game.js';

export type PeriodType = 'daily' | 'weekly' | 'alltime';

export interface LeaderboardEntry {
  rank: number;
  playerAddress: string;
  score: number;
  gameType: GameType;
  periodType: PeriodType;
  periodDate: string;
}

export class LeaderboardServiceRedis {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * Add score to leaderboard (upsert - keeps highest score)
   */
  async addScore(
    gameType: GameType,
    playerAddress: string,
    score: number,
    periodType: PeriodType,
    periodDate: string
  ): Promise<void> {
    const key = RedisKeys.leaderboard(gameType, periodType, periodDate);
    const normalizedAddress = playerAddress.toLowerCase();

    // Check if player already has a score
    const existingScoreStr = await this.redis.zscore(key, normalizedAddress);
    const existingScore = existingScoreStr ? parseFloat(existingScoreStr) : null;

    // Only update if new score is higher or no existing score
    if (!existingScore || score > existingScore) {
      await this.redis.zadd(key, score, normalizedAddress);

      // Store detailed entry
      const entryKey = RedisKeys.leaderboardEntry(
        gameType,
        normalizedAddress,
        `${periodType}:${periodDate}`
      );
      await this.redis.hset(entryKey, {
        playerAddress: normalizedAddress,
        score: score.toString(),
        gameType,
        periodType,
        periodDate,
        updatedAt: new Date().toISOString(),
      } as any);
    }
  }

  /**
   * Alias for addScore (API compatibility)
   */
  async addEntry(
    _sessionId: string,
    gameType: GameType,
    playerAddress: string,
    score: number
  ): Promise<void> {
    const periods = LeaderboardServiceRedis.getCurrentPeriods();

    // Add to all three leaderboards
    await Promise.all([
      this.addScore(gameType, playerAddress, score, 'daily', periods.daily),
      this.addScore(gameType, playerAddress, score, 'weekly', periods.weekly),
      this.addScore(gameType, playerAddress, score, 'alltime', 'alltime'),
    ]);
  }

  /**
   * Alias for getTopPlayers (API compatibility)
   */
  async getTopScores(
    gameType: GameType,
    periodType: PeriodType,
    periodDate: string,
    limit: number = 10
  ): Promise<LeaderboardEntry[]> {
    return this.getTopPlayers(gameType, periodType, periodDate, limit);
  }

  /**
   * Get top N players for a leaderboard
   */
  async getTopPlayers(
    gameType: GameType,
    periodType: PeriodType,
    periodDate: string,
    limit: number = 10
  ): Promise<LeaderboardEntry[]> {
    const key = RedisKeys.leaderboard(gameType, periodType, periodDate);

    // Get top scores with ZREVRANGE (highest to lowest)
    const results = await this.redis.zrevrange(key, 0, limit - 1, 'WITHSCORES');

    const entries: LeaderboardEntry[] = [];
    for (let i = 0; i < results.length; i += 2) {
      const playerAddress = results[i] as string;
      const score = parseFloat(results[i + 1] as string);

      entries.push({
        rank: Math.floor(i / 2) + 1,
        playerAddress,
        score,
        gameType,
        periodType,
        periodDate,
      });
    }

    return entries;
  }

  /**
   * Get player rank and score
   */
  async getPlayerRank(
    gameType: GameType,
    playerAddress: string,
    periodType: PeriodType,
    periodDate: string
  ): Promise<{ rank: number; score: number } | null> {
    const key = RedisKeys.leaderboard(gameType, periodType, periodDate);
    const normalizedAddress = playerAddress.toLowerCase();

    const [scoreStr, rank] = await Promise.all([
      this.redis.zscore(key, normalizedAddress),
      this.redis.zrevrank(key, normalizedAddress),
    ]);

    if (scoreStr === null || rank === null) {
      return null;
    }

    return {
      rank: rank + 1, // Redis ranks are 0-indexed
      score: parseFloat(scoreStr),
    };
  }

  /**
   * Get current period identifiers
   */
  static getCurrentPeriods(): { daily: string; weekly: string } {
    const now = new Date();
    const daily = now.toISOString().split('T')[0]; // YYYY-MM-DD

    // Calculate week number
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    const weekly = `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;

    return { daily, weekly };
  }
}
