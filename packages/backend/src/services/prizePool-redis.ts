/**
 * Redis-based Prize Pool Service for Vercel KV
 */

import type { VercelKV } from '@vercel/kv';
import { RedisKeys, type PrizePoolHash } from '../db/schema.js';
import type { GameType } from './game.js';

export type PeriodType = 'daily' | 'weekly';
export type PoolStatus = 'active' | 'finalized' | 'paid';

export interface PrizePool {
  gameType: GameType;
  periodType: PeriodType;
  periodDate: string;
  totalAmountUsdc: number;
  totalGames: number;
  status: PoolStatus;
  winnerAddress: string | null;
  payoutTxHash: string | null;
  createdAt: string;
  finalizedAt: string | null;
}

export class PrizePoolServiceRedis {
  private kv: VercelKV;

  constructor(kv: VercelKV) {
    this.kv = kv;
  }

  /**
   * Get or create a prize pool
   */
  async getOrCreatePool(
    gameType: GameType,
    periodType: PeriodType,
    periodDate: string
  ): Promise<PrizePool> {
    const key = RedisKeys.prizePool(gameType, periodType, periodDate);
    const existing = await this.kv.hgetall<PrizePoolHash>(key);

    if (existing) {
      return this.hashToPool(existing);
    }

    // Create new pool
    const now = new Date().toISOString();
    const poolData: PrizePoolHash = {
      gameType,
      periodType,
      periodDate,
      totalAmountUsdc: '0',
      totalGames: '0',
      status: 'active',
      winnerAddress: null,
      payoutTxHash: null,
      createdAt: now,
      finalizedAt: null,
    };

    await this.kv.hset(key, poolData);
    await this.kv.sadd(RedisKeys.activePrizePools(), key);

    return this.hashToPool(poolData);
  }

  /**
   * Add funds to a prize pool
   */
  async addFunds(
    gameType: GameType,
    periodType: PeriodType,
    periodDate: string,
    amount: number
  ): Promise<void> {
    const key = RedisKeys.prizePool(gameType, periodType, periodDate);

    // Use HINCRBYFLOAT to atomically increment
    await Promise.all([
      this.kv.hincrbyfloat(key, 'totalAmountUsdc', amount),
      this.kv.hincrby(key, 'totalGames', 1),
    ]);
  }

  /**
   * Add payment to prize pool (API compatibility)
   */
  async addToPrizePool(
    gameType: GameType,
    amountUsdc: number,
    prizePoolPercentage: number
  ): Promise<void> {
    const periods = PrizePoolServiceRedis.getCurrentPeriods();
    const prizeAmount = (amountUsdc * prizePoolPercentage) / 100;

    // Add to both daily and weekly pools
    await Promise.all([
      this.getOrCreatePool(gameType, 'daily', periods.daily),
      this.addFunds(gameType, 'daily', periods.daily, prizeAmount),
      this.getOrCreatePool(gameType, 'weekly', periods.weekly),
      this.addFunds(gameType, 'weekly', periods.weekly, prizeAmount),
    ]);
  }

  /**
   * Get current pool for a game (API compatibility)
   */
  async getCurrentPool(gameType: GameType, periodType: PeriodType): Promise<PrizePool | null> {
    const periods = PrizePoolServiceRedis.getCurrentPeriods();
    const periodDate = periodType === 'daily' ? periods.daily : periods.weekly;
    return this.getPool(gameType, periodType, periodDate);
  }

  /**
   * Get pool history (API compatibility)
   */
  async getPoolHistory(
    gameType: GameType,
    periodType: PeriodType,
    limit: number = 10
  ): Promise<PrizePool[]> {
    // For now, return active and finalized pools
    // In production, you'd scan by date pattern
    const active = await this.getActivePools();
    return active
      .filter((p) => p.gameType === gameType && p.periodType === periodType)
      .slice(0, limit);
  }

  /**
   * Get a prize pool
   */
  async getPool(
    gameType: GameType,
    periodType: PeriodType,
    periodDate: string
  ): Promise<PrizePool | null> {
    const key = RedisKeys.prizePool(gameType, periodType, periodDate);
    const data = await this.kv.hgetall<PrizePoolHash>(key);

    if (!data) return null;
    return this.hashToPool(data);
  }

  /**
   * Finalize a prize pool with winner
   */
  async finalizePool(
    gameType: GameType,
    periodType: PeriodType,
    periodDate: string,
    winnerAddress: string
  ): Promise<void> {
    const key = RedisKeys.prizePool(gameType, periodType, periodDate);
    const now = new Date().toISOString();

    await Promise.all([
      this.kv.hset(key, {
        status: 'finalized',
        winnerAddress: winnerAddress.toLowerCase(),
        finalizedAt: now,
      }),
      this.kv.srem(RedisKeys.activePrizePools(), key),
      this.kv.sadd(RedisKeys.finalizedPrizePools(), key),
    ]);
  }

  /**
   * Mark pool as paid
   */
  async markAsPaid(
    gameType: GameType,
    periodType: PeriodType,
    periodDate: string,
    txHash: string
  ): Promise<void> {
    const key = RedisKeys.prizePool(gameType, periodType, periodDate);

    await Promise.all([
      this.kv.hset(key, {
        status: 'paid',
        payoutTxHash: txHash,
      }),
      this.kv.srem(RedisKeys.finalizedPrizePools(), key),
    ]);
  }

  /**
   * Get all active pools
   */
  async getActivePools(): Promise<PrizePool[]> {
    const keys = await this.kv.smembers(RedisKeys.activePrizePools());
    const pools: PrizePool[] = [];

    for (const key of keys) {
      const data = await this.kv.hgetall<PrizePoolHash>(key);
      if (data) {
        pools.push(this.hashToPool(data));
      }
    }

    return pools;
  }

  private hashToPool(hash: PrizePoolHash): PrizePool {
    return {
      gameType: hash.gameType as GameType,
      periodType: hash.periodType,
      periodDate: hash.periodDate,
      totalAmountUsdc: parseFloat(hash.totalAmountUsdc),
      totalGames: parseInt(hash.totalGames),
      status: hash.status,
      winnerAddress: hash.winnerAddress,
      payoutTxHash: hash.payoutTxHash,
      createdAt: hash.createdAt,
      finalizedAt: hash.finalizedAt,
    };
  }

  /**
   * Get current period identifiers
   */
  static getCurrentPeriods(): { daily: string; weekly: string } {
    const now = new Date();
    const daily = now.toISOString().split('T')[0]; // YYYY-MM-DD

    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    const weekly = `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;

    return { daily, weekly };
  }
}
