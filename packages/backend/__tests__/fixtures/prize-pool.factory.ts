/**
 * Prize Pool Fixture Factory
 *
 * Generates prize pool test data for various scenarios including active pools,
 * distributed pools, and custom distribution configurations.
 *
 * @example
 * ```typescript
 * import {
 *   createPrizePool,
 *   createActivePrizePool,
 *   createDistributedPrizePool,
 *   createCustomDistribution,
 *   createEmptyPrizePool,
 * } from '../fixtures/prize-pool.factory';
 *
 * const pool = createPrizePool();
 * const active = createActivePrizePool(100, 50);
 * const distributed = createDistributedPrizePool(winners);
 * const custom = createCustomDistribution([40, 35, 25]);
 * const empty = createEmptyPrizePool();
 * ```
 */

import { TEST_ADDRESSES, generateWalletAddress, generateTxHash } from './game-session.factory';
import { type PeriodType, getToday, getWeekStart } from './leaderboard.factory';

// ============================================================================
// Types
// ============================================================================

export type GameType = 'snake' | 'tetris';
export type PoolStatus = 'accumulating' | 'locked' | 'distributing' | 'distributed';

/**
 * Prize pool database record structure.
 */
export interface PrizePool {
  id: number;
  game_type: GameType;
  period_type: PeriodType;
  period_date: string;
  total_accumulated_usdc: number;
  platform_fee_usdc: number;
  distributable_amount_usdc: number;
  status: PoolStatus;
  distribution_tx_hash: string | null;
  distributed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Prize distribution record for a winner.
 */
export interface PrizeDistribution {
  id: number;
  pool_id: number;
  rank: number;
  player_address: string;
  prize_amount_usdc: number;
  percentage: number;
  payout_tx_hash: string | null;
  paid_at: string | null;
  created_at: string;
}

/**
 * Winner entry for distribution.
 */
export interface Winner {
  rank: number;
  player_address: string;
  score: number;
}

/**
 * Options for creating a prize pool.
 */
export interface CreatePrizePoolOptions {
  id?: number;
  game_type?: GameType;
  period_type?: PeriodType;
  period_date?: string;
  total_accumulated_usdc?: number;
  platform_fee_usdc?: number;
  distributable_amount_usdc?: number;
  status?: PoolStatus;
  distribution_tx_hash?: string | null;
  distributed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Options for creating a prize distribution.
 */
export interface CreateDistributionOptions {
  id?: number;
  pool_id?: number;
  rank?: number;
  player_address?: string;
  prize_amount_usdc?: number;
  percentage?: number;
  payout_tx_hash?: string | null;
  paid_at?: string | null;
  created_at?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default prize distribution percentages.
 */
export const DEFAULT_DISTRIBUTION = {
  first: 50,
  second: 30,
  third: 20,
} as const;

/**
 * Platform fee percentage (taken before distribution).
 */
export const PLATFORM_FEE_PERCENTAGE = 30;

/**
 * Minimum prize pool to trigger distribution (in USDC).
 */
export const MINIMUM_DISTRIBUTION_THRESHOLD = 0.10;

/**
 * Game prices used for calculating pool amounts.
 */
export const GAME_PRICES = {
  snake: 0.01,
  tetris: 0.02,
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

let poolCounter = 0;
let distributionCounter = 0;

/**
 * Reset counters for test isolation.
 */
export function resetPrizePoolCounters(): void {
  poolCounter = 0;
  distributionCounter = 0;
}

/**
 * Calculate platform fee from total amount.
 */
export function calculatePlatformFee(
  totalAmount: number,
  feePercentage: number = PLATFORM_FEE_PERCENTAGE
): number {
  return Math.round(totalAmount * feePercentage / 100 * 100) / 100;
}

/**
 * Calculate distributable amount after platform fee.
 */
export function calculateDistributableAmount(
  totalAmount: number,
  feePercentage: number = PLATFORM_FEE_PERCENTAGE
): number {
  const fee = calculatePlatformFee(totalAmount, feePercentage);
  return Math.round((totalAmount - fee) * 100) / 100;
}

/**
 * Calculate prize amount for a specific rank.
 */
export function calculatePrizeForRank(
  distributableAmount: number,
  rank: number,
  distribution: Record<string, number> = DEFAULT_DISTRIBUTION
): number {
  const rankKey = rank === 1 ? 'first' : rank === 2 ? 'second' : 'third';
  const percentage = distribution[rankKey] || 0;
  return Math.round(distributableAmount * percentage / 100 * 100) / 100;
}

/**
 * Get period date based on period type.
 */
function getPeriodDate(periodType: PeriodType): string {
  switch (periodType) {
    case 'daily':
      return getToday();
    case 'weekly':
      return getWeekStart();
    case 'alltime':
      return '2026-01-01';
  }
}

// ============================================================================
// Core Factory Functions
// ============================================================================

/**
 * Create a prize pool with sensible defaults.
 *
 * @param options - Optional overrides for any pool field
 * @returns A prize pool object
 *
 * @example
 * ```typescript
 * const pool = createPrizePool();
 * const tetrisPool = createPrizePool({ game_type: 'tetris' });
 * ```
 */
export function createPrizePool(options: CreatePrizePoolOptions = {}): PrizePool {
  poolCounter++;

  const totalAmount = options.total_accumulated_usdc ?? 1.00;
  const platformFee = options.platform_fee_usdc ?? calculatePlatformFee(totalAmount);
  const distributableAmount = options.distributable_amount_usdc ?? calculateDistributableAmount(totalAmount);
  const periodType = options.period_type ?? 'daily';
  const now = new Date().toISOString();

  return {
    id: options.id ?? poolCounter,
    game_type: options.game_type ?? 'snake',
    period_type: periodType,
    period_date: options.period_date ?? getPeriodDate(periodType),
    total_accumulated_usdc: totalAmount,
    platform_fee_usdc: platformFee,
    distributable_amount_usdc: distributableAmount,
    status: options.status ?? 'accumulating',
    distribution_tx_hash: options.distribution_tx_hash ?? null,
    distributed_at: options.distributed_at ?? null,
    created_at: options.created_at ?? now,
    updated_at: options.updated_at ?? now,
  };
}

/**
 * Create an active prize pool that is accumulating fees.
 *
 * @param gamesPlayed - Number of games played contributing to pool
 * @param gameType - Type of game
 * @param periodType - Period type
 * @returns An accumulating prize pool
 *
 * @example
 * ```typescript
 * const active = createActivePrizePool(100);
 * const tetrisActive = createActivePrizePool(50, 'tetris');
 * ```
 */
export function createActivePrizePool(
  gamesPlayed: number,
  gameType: GameType = 'snake',
  periodType: PeriodType = 'daily'
): PrizePool {
  const gamePrice = GAME_PRICES[gameType];
  const totalAmount = Math.round(gamesPlayed * gamePrice * 100) / 100;

  return createPrizePool({
    game_type: gameType,
    period_type: periodType,
    total_accumulated_usdc: totalAmount,
    status: 'accumulating',
  });
}

/**
 * Create a prize pool that has been distributed to winners.
 *
 * @param winners - Array of winners (top 3 players)
 * @param totalAmount - Total pool amount before distribution
 * @param options - Additional pool options
 * @returns A distributed prize pool with distributions
 *
 * @example
 * ```typescript
 * const winners = [
 *   { rank: 1, player_address: '0x111...', score: 999 },
 *   { rank: 2, player_address: '0x222...', score: 888 },
 *   { rank: 3, player_address: '0x333...', score: 777 },
 * ];
 * const { pool, distributions } = createDistributedPrizePool(winners, 10.00);
 * ```
 */
export function createDistributedPrizePool(
  winners: Winner[],
  totalAmount: number = 10.00,
  options: CreatePrizePoolOptions = {}
): {
  pool: PrizePool;
  distributions: PrizeDistribution[];
} {
  const now = new Date();
  const distributedAt = now.toISOString();
  const txHash = generateTxHash();

  const pool = createPrizePool({
    ...options,
    total_accumulated_usdc: totalAmount,
    status: 'distributed',
    distribution_tx_hash: txHash,
    distributed_at: distributedAt,
    updated_at: distributedAt,
  });

  const distributions = winners.slice(0, 3).map((winner) =>
    createPrizeDistribution({
      pool_id: pool.id,
      rank: winner.rank,
      player_address: winner.player_address,
      prize_amount_usdc: calculatePrizeForRank(pool.distributable_amount_usdc, winner.rank),
      percentage: winner.rank === 1 ? DEFAULT_DISTRIBUTION.first :
                  winner.rank === 2 ? DEFAULT_DISTRIBUTION.second :
                  DEFAULT_DISTRIBUTION.third,
      payout_tx_hash: generateTxHash(),
      paid_at: distributedAt,
    })
  );

  return { pool, distributions };
}

/**
 * Create a prize distribution record.
 *
 * @param options - Distribution options
 * @returns A prize distribution record
 */
export function createPrizeDistribution(
  options: CreateDistributionOptions = {}
): PrizeDistribution {
  distributionCounter++;

  return {
    id: options.id ?? distributionCounter,
    pool_id: options.pool_id ?? 1,
    rank: options.rank ?? 1,
    player_address: options.player_address ?? TEST_ADDRESSES.player1,
    prize_amount_usdc: options.prize_amount_usdc ?? 0.50,
    percentage: options.percentage ?? DEFAULT_DISTRIBUTION.first,
    payout_tx_hash: options.payout_tx_hash ?? null,
    paid_at: options.paid_at ?? null,
    created_at: options.created_at ?? new Date().toISOString(),
  };
}

/**
 * Create a custom prize distribution configuration.
 *
 * @param percentages - Array of percentages for each rank [first, second, third, ...]
 * @param distributableAmount - Total amount to distribute
 * @returns Array of distribution records with custom percentages
 *
 * @example
 * ```typescript
 * // 40/35/25 split instead of default 50/30/20
 * const custom = createCustomDistribution([40, 35, 25], 10.00);
 * ```
 */
export function createCustomDistribution(
  percentages: number[],
  distributableAmount: number = 1.00
): PrizeDistribution[] {
  // Validate percentages sum to 100
  const total = percentages.reduce((sum, p) => sum + p, 0);
  if (Math.abs(total - 100) > 0.01) {
    throw new Error(`Percentages must sum to 100, got ${total}`);
  }

  return percentages.map((percentage, index) => {
    const prizeAmount = Math.round(distributableAmount * percentage / 100 * 100) / 100;
    return createPrizeDistribution({
      rank: index + 1,
      player_address: generateWalletAddress(),
      prize_amount_usdc: prizeAmount,
      percentage,
    });
  });
}

/**
 * Create an empty prize pool (no games played yet).
 *
 * @param gameType - Game type
 * @param periodType - Period type
 * @returns An empty prize pool with zero amounts
 *
 * @example
 * ```typescript
 * const empty = createEmptyPrizePool();
 * const emptyTetris = createEmptyPrizePool('tetris', 'weekly');
 * ```
 */
export function createEmptyPrizePool(
  gameType: GameType = 'snake',
  periodType: PeriodType = 'daily'
): PrizePool {
  return createPrizePool({
    game_type: gameType,
    period_type: periodType,
    total_accumulated_usdc: 0,
    platform_fee_usdc: 0,
    distributable_amount_usdc: 0,
    status: 'accumulating',
  });
}

// ============================================================================
// Status-Based Factory Functions
// ============================================================================

/**
 * Create a locked prize pool (ready for distribution but not yet processed).
 *
 * @param totalAmount - Total pool amount
 * @param options - Additional pool options
 * @returns A locked prize pool
 */
export function createLockedPrizePool(
  totalAmount: number = 10.00,
  options: CreatePrizePoolOptions = {}
): PrizePool {
  return createPrizePool({
    ...options,
    total_accumulated_usdc: totalAmount,
    status: 'locked',
  });
}

/**
 * Create a prize pool that is currently being distributed.
 *
 * @param totalAmount - Total pool amount
 * @param options - Additional pool options
 * @returns A distributing prize pool
 */
export function createDistributingPrizePool(
  totalAmount: number = 10.00,
  options: CreatePrizePoolOptions = {}
): PrizePool {
  return createPrizePool({
    ...options,
    total_accumulated_usdc: totalAmount,
    status: 'distributing',
    distribution_tx_hash: generateTxHash(),
  });
}

// ============================================================================
// Batch Factory Functions
// ============================================================================

/**
 * Create prize pools for multiple periods.
 *
 * @param count - Number of pools to create
 * @param periodType - Period type
 * @param gameType - Game type
 * @returns Array of prize pools with sequential period dates
 */
export function createPrizePoolHistory(
  count: number,
  periodType: PeriodType = 'daily',
  gameType: GameType = 'snake'
): PrizePool[] {
  const pools: PrizePool[] = [];
  const baseDate = new Date();

  for (let i = 0; i < count; i++) {
    const date = new Date(baseDate);

    if (periodType === 'daily') {
      date.setDate(date.getDate() - i);
    } else if (periodType === 'weekly') {
      date.setDate(date.getDate() - i * 7);
    }

    const periodDate = periodType === 'daily'
      ? getToday().replace(/\d{2}$/, String(date.getDate()).padStart(2, '0'))
      : getWeekStart(date);

    // Older pools are distributed, most recent is accumulating
    const status: PoolStatus = i === 0 ? 'accumulating' : 'distributed';
    const totalAmount = 1 + Math.random() * 10; // Random amount between 1-11

    const pool = createPrizePool({
      game_type: gameType,
      period_type: periodType,
      period_date: periodDate,
      total_accumulated_usdc: Math.round(totalAmount * 100) / 100,
      status,
      ...(status === 'distributed' && {
        distribution_tx_hash: generateTxHash(),
        distributed_at: date.toISOString(),
      }),
    });

    pools.push(pool);
  }

  return pools;
}

/**
 * Create pools for all game types for a specific period.
 *
 * @param periodType - Period type
 * @param snakeGames - Games played for snake
 * @param tetrisGames - Games played for tetris
 * @returns Object with snake and tetris pools
 */
export function createMultiGamePools(
  periodType: PeriodType = 'daily',
  snakeGames: number = 50,
  tetrisGames: number = 30
): {
  snake: PrizePool;
  tetris: PrizePool;
} {
  return {
    snake: createActivePrizePool(snakeGames, 'snake', periodType),
    tetris: createActivePrizePool(tetrisGames, 'tetris', periodType),
  };
}

// ============================================================================
// Test Scenario Factories
// ============================================================================

/**
 * Create a pool with distributions at the minimum threshold.
 *
 * @returns Pool and distributions at minimum viable amount
 */
export function createMinimumThresholdPool(): {
  pool: PrizePool;
  distributions: PrizeDistribution[];
} {
  const winners: Winner[] = [
    { rank: 1, player_address: generateWalletAddress(), score: 100 },
    { rank: 2, player_address: generateWalletAddress(), score: 90 },
    { rank: 3, player_address: generateWalletAddress(), score: 80 },
  ];

  // Calculate minimum games needed to reach threshold
  const minimumTotalNeeded = MINIMUM_DISTRIBUTION_THRESHOLD / (1 - PLATFORM_FEE_PERCENTAGE / 100);
  const totalAmount = Math.ceil(minimumTotalNeeded * 100) / 100;

  return createDistributedPrizePool(winners, totalAmount);
}

/**
 * Create a pool below the minimum threshold (should not be distributed).
 *
 * @returns Pool that's below minimum threshold
 */
export function createBelowThresholdPool(): PrizePool {
  const totalAmount = MINIMUM_DISTRIBUTION_THRESHOLD * 0.5; // Half the minimum
  return createPrizePool({
    total_accumulated_usdc: totalAmount,
    status: 'accumulating',
  });
}

/**
 * Create a pool with partial payouts (some winners paid, some pending).
 *
 * @returns Pool with mixed payout states
 */
export function createPartialPayoutPool(): {
  pool: PrizePool;
  distributions: PrizeDistribution[];
} {
  const pool = createDistributingPrizePool(10.00);
  const now = new Date().toISOString();

  const distributions = [
    createPrizeDistribution({
      pool_id: pool.id,
      rank: 1,
      prize_amount_usdc: calculatePrizeForRank(pool.distributable_amount_usdc, 1),
      percentage: DEFAULT_DISTRIBUTION.first,
      payout_tx_hash: generateTxHash(),
      paid_at: now,
    }),
    createPrizeDistribution({
      pool_id: pool.id,
      rank: 2,
      prize_amount_usdc: calculatePrizeForRank(pool.distributable_amount_usdc, 2),
      percentage: DEFAULT_DISTRIBUTION.second,
      payout_tx_hash: null, // Not yet paid
      paid_at: null,
    }),
    createPrizeDistribution({
      pool_id: pool.id,
      rank: 3,
      prize_amount_usdc: calculatePrizeForRank(pool.distributable_amount_usdc, 3),
      percentage: DEFAULT_DISTRIBUTION.third,
      payout_tx_hash: null, // Not yet paid
      paid_at: null,
    }),
  ];

  return { pool, distributions };
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validate that a prize pool has all required fields.
 *
 * @param pool - Pool to validate
 * @returns Whether the pool is valid
 */
export function isValidPrizePool(pool: unknown): pool is PrizePool {
  if (!pool || typeof pool !== 'object') return false;

  const p = pool as Record<string, unknown>;

  return (
    typeof p.id === 'number' &&
    (p.game_type === 'snake' || p.game_type === 'tetris') &&
    (p.period_type === 'daily' || p.period_type === 'weekly' || p.period_type === 'alltime') &&
    typeof p.period_date === 'string' &&
    typeof p.total_accumulated_usdc === 'number' &&
    typeof p.platform_fee_usdc === 'number' &&
    typeof p.distributable_amount_usdc === 'number' &&
    (p.status === 'accumulating' || p.status === 'locked' || p.status === 'distributing' || p.status === 'distributed') &&
    (p.distribution_tx_hash === null || typeof p.distribution_tx_hash === 'string') &&
    (p.distributed_at === null || typeof p.distributed_at === 'string') &&
    typeof p.created_at === 'string' &&
    typeof p.updated_at === 'string'
  );
}

/**
 * Validate that a prize distribution has all required fields.
 *
 * @param distribution - Distribution to validate
 * @returns Whether the distribution is valid
 */
export function isValidPrizeDistribution(distribution: unknown): distribution is PrizeDistribution {
  if (!distribution || typeof distribution !== 'object') return false;

  const d = distribution as Record<string, unknown>;

  return (
    typeof d.id === 'number' &&
    typeof d.pool_id === 'number' &&
    typeof d.rank === 'number' &&
    typeof d.player_address === 'string' &&
    typeof d.prize_amount_usdc === 'number' &&
    typeof d.percentage === 'number' &&
    (d.payout_tx_hash === null || typeof d.payout_tx_hash === 'string') &&
    (d.paid_at === null || typeof d.paid_at === 'string') &&
    typeof d.created_at === 'string'
  );
}

/**
 * Validate that distributions sum to the correct total.
 *
 * @param distributions - Array of distributions
 * @param expectedTotal - Expected total distributable amount
 * @param tolerance - Allowed difference due to rounding (default 0.01)
 * @returns Whether the distributions sum correctly
 */
export function distributionsMatchTotal(
  distributions: PrizeDistribution[],
  expectedTotal: number,
  tolerance: number = 0.01
): boolean {
  const actualTotal = distributions.reduce((sum, d) => sum + d.prize_amount_usdc, 0);
  return Math.abs(actualTotal - expectedTotal) <= tolerance;
}

/**
 * Validate that distribution percentages sum to 100.
 *
 * @param distributions - Array of distributions
 * @returns Whether the percentages sum to 100
 */
export function distributionPercentagesValid(distributions: PrizeDistribution[]): boolean {
  const total = distributions.reduce((sum, d) => sum + d.percentage, 0);
  return Math.abs(total - 100) < 0.01;
}
