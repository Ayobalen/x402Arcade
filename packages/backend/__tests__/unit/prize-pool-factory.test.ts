/**
 * Prize Pool Factory Tests
 *
 * Tests for the prize pool fixture factories.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  createPrizePool,
  createActivePrizePool,
  createDistributedPrizePool,
  createPrizeDistribution,
  createCustomDistribution,
  createEmptyPrizePool,
  createLockedPrizePool,
  createDistributingPrizePool,
  createPrizePoolHistory,
  createMultiGamePools,
  createMinimumThresholdPool,
  createBelowThresholdPool,
  createPartialPayoutPool,
  isValidPrizePool,
  isValidPrizeDistribution,
  distributionsMatchTotal,
  distributionPercentagesValid,
  resetPrizePoolCounters,
  calculatePlatformFee,
  calculateDistributableAmount,
  calculatePrizeForRank,
  DEFAULT_DISTRIBUTION,
  PLATFORM_FEE_PERCENTAGE,
  MINIMUM_DISTRIBUTION_THRESHOLD,
  GAME_PRICES,
  type PrizePool,
  type PrizeDistribution,
  type Winner,
} from '../fixtures/prize-pool.factory';
import { generateWalletAddress } from '../fixtures/game-session.factory';

describe('Prize Pool Factory', () => {
  beforeEach(() => {
    resetPrizePoolCounters();
  });

  // ==========================================================================
  // Constants
  // ==========================================================================

  describe('Constants', () => {
    it('should have correct default distribution', () => {
      expect(DEFAULT_DISTRIBUTION.first).toBe(50);
      expect(DEFAULT_DISTRIBUTION.second).toBe(30);
      expect(DEFAULT_DISTRIBUTION.third).toBe(20);
      expect(DEFAULT_DISTRIBUTION.first + DEFAULT_DISTRIBUTION.second + DEFAULT_DISTRIBUTION.third).toBe(100);
    });

    it('should have correct platform fee percentage', () => {
      expect(PLATFORM_FEE_PERCENTAGE).toBe(30);
    });

    it('should have minimum distribution threshold', () => {
      expect(MINIMUM_DISTRIBUTION_THRESHOLD).toBe(0.10);
    });

    it('should have game prices', () => {
      expect(GAME_PRICES.snake).toBe(0.01);
      expect(GAME_PRICES.tetris).toBe(0.02);
    });
  });

  // ==========================================================================
  // Utility Functions
  // ==========================================================================

  describe('Utility Functions', () => {
    describe('calculatePlatformFee', () => {
      it('should calculate default 30% fee', () => {
        expect(calculatePlatformFee(10.00)).toBe(3.00);
        expect(calculatePlatformFee(1.00)).toBe(0.30);
      });

      it('should accept custom fee percentage', () => {
        expect(calculatePlatformFee(10.00, 20)).toBe(2.00);
        expect(calculatePlatformFee(10.00, 50)).toBe(5.00);
      });

      it('should round to 2 decimal places', () => {
        const fee = calculatePlatformFee(3.33);
        expect(fee).toBe(1.00); // 3.33 * 0.30 = 0.999 rounded
      });
    });

    describe('calculateDistributableAmount', () => {
      it('should calculate amount after fee', () => {
        expect(calculateDistributableAmount(10.00)).toBe(7.00);
        expect(calculateDistributableAmount(1.00)).toBe(0.70);
      });

      it('should accept custom fee percentage', () => {
        expect(calculateDistributableAmount(10.00, 20)).toBe(8.00);
        expect(calculateDistributableAmount(10.00, 50)).toBe(5.00);
      });
    });

    describe('calculatePrizeForRank', () => {
      it('should calculate prize for each rank', () => {
        const distributable = 10.00;
        expect(calculatePrizeForRank(distributable, 1)).toBe(5.00); // 50%
        expect(calculatePrizeForRank(distributable, 2)).toBe(3.00); // 30%
        expect(calculatePrizeForRank(distributable, 3)).toBe(2.00); // 20%
      });

      it('should accept custom distribution', () => {
        const custom = { first: 40, second: 35, third: 25 };
        const distributable = 10.00;
        expect(calculatePrizeForRank(distributable, 1, custom)).toBe(4.00);
        expect(calculatePrizeForRank(distributable, 2, custom)).toBe(3.50);
        expect(calculatePrizeForRank(distributable, 3, custom)).toBe(2.50);
      });

      it('should return third place percentage for ranks beyond 3', () => {
        // Ranks beyond 3 fall through to 'third' in the current implementation
        // This is a reasonable behavior for "other winners" category
        expect(calculatePrizeForRank(10.00, 4)).toBe(2.00); // 20% (third)
        expect(calculatePrizeForRank(10.00, 0)).toBe(2.00); // 20% (third)
      });
    });

    describe('resetPrizePoolCounters', () => {
      it('should reset pool counter', () => {
        createPrizePool();
        createPrizePool();

        resetPrizePoolCounters();

        const pool = createPrizePool();
        expect(pool.id).toBe(1);
      });

      it('should reset distribution counter', () => {
        createPrizeDistribution();
        createPrizeDistribution();

        resetPrizePoolCounters();

        const dist = createPrizeDistribution();
        expect(dist.id).toBe(1);
      });
    });
  });

  // ==========================================================================
  // createPrizePool
  // ==========================================================================

  describe('createPrizePool', () => {
    it('should create pool with default values', () => {
      const pool = createPrizePool();

      expect(pool.id).toBeDefined();
      expect(pool.game_type).toBe('snake');
      expect(pool.period_type).toBe('daily');
      expect(pool.period_date).toBeDefined();
      expect(pool.total_accumulated_usdc).toBe(1.00);
      expect(pool.platform_fee_usdc).toBe(0.30);
      expect(pool.distributable_amount_usdc).toBe(0.70);
      expect(pool.status).toBe('accumulating');
      expect(pool.distribution_tx_hash).toBeNull();
      expect(pool.distributed_at).toBeNull();
      expect(pool.created_at).toBeDefined();
      expect(pool.updated_at).toBeDefined();
    });

    it('should accept custom values', () => {
      const pool = createPrizePool({
        game_type: 'tetris',
        period_type: 'weekly',
        total_accumulated_usdc: 50.00,
        status: 'locked',
      });

      expect(pool.game_type).toBe('tetris');
      expect(pool.period_type).toBe('weekly');
      expect(pool.total_accumulated_usdc).toBe(50.00);
      expect(pool.status).toBe('locked');
    });

    it('should calculate fees correctly for custom total', () => {
      const pool = createPrizePool({ total_accumulated_usdc: 100.00 });

      expect(pool.platform_fee_usdc).toBe(30.00);
      expect(pool.distributable_amount_usdc).toBe(70.00);
    });

    it('should create valid pool objects', () => {
      const pool = createPrizePool();
      expect(isValidPrizePool(pool)).toBe(true);
    });

    it('should generate unique IDs', () => {
      const pool1 = createPrizePool();
      const pool2 = createPrizePool();
      expect(pool1.id).not.toBe(pool2.id);
    });
  });

  // ==========================================================================
  // createActivePrizePool
  // ==========================================================================

  describe('createActivePrizePool', () => {
    it('should calculate total from games played', () => {
      const pool = createActivePrizePool(100);

      // 100 games * $0.01 = $1.00
      expect(pool.total_accumulated_usdc).toBe(1.00);
      expect(pool.status).toBe('accumulating');
    });

    it('should use game-specific price', () => {
      const snakePool = createActivePrizePool(100, 'snake');
      const tetrisPool = createActivePrizePool(100, 'tetris');

      expect(snakePool.total_accumulated_usdc).toBe(1.00); // 100 * $0.01
      expect(tetrisPool.total_accumulated_usdc).toBe(2.00); // 100 * $0.02
    });

    it('should use specified period type', () => {
      const daily = createActivePrizePool(50, 'snake', 'daily');
      const weekly = createActivePrizePool(50, 'snake', 'weekly');

      expect(daily.period_type).toBe('daily');
      expect(weekly.period_type).toBe('weekly');
    });
  });

  // ==========================================================================
  // createDistributedPrizePool
  // ==========================================================================

  describe('createDistributedPrizePool', () => {
    const mockWinners: Winner[] = [
      { rank: 1, player_address: '0x1111111111111111111111111111111111111111', score: 999 },
      { rank: 2, player_address: '0x2222222222222222222222222222222222222222', score: 888 },
      { rank: 3, player_address: '0x3333333333333333333333333333333333333333', score: 777 },
    ];

    it('should create pool with distributed status', () => {
      const { pool } = createDistributedPrizePool(mockWinners, 10.00);

      expect(pool.status).toBe('distributed');
      expect(pool.distribution_tx_hash).toBeDefined();
      expect(pool.distributed_at).toBeDefined();
    });

    it('should create distributions for each winner', () => {
      const { distributions } = createDistributedPrizePool(mockWinners, 10.00);

      expect(distributions.length).toBe(3);
      expect(distributions[0].rank).toBe(1);
      expect(distributions[1].rank).toBe(2);
      expect(distributions[2].rank).toBe(3);
    });

    it('should calculate correct prize amounts', () => {
      const { pool, distributions } = createDistributedPrizePool(mockWinners, 10.00);

      // Distributable = 10 - 30% fee = 7.00
      expect(pool.distributable_amount_usdc).toBe(7.00);

      expect(distributions[0].prize_amount_usdc).toBe(3.50); // 50% of 7
      expect(distributions[1].prize_amount_usdc).toBe(2.10); // 30% of 7
      expect(distributions[2].prize_amount_usdc).toBe(1.40); // 20% of 7
    });

    it('should have matching player addresses', () => {
      const { distributions } = createDistributedPrizePool(mockWinners, 10.00);

      expect(distributions[0].player_address).toBe(mockWinners[0].player_address);
      expect(distributions[1].player_address).toBe(mockWinners[1].player_address);
      expect(distributions[2].player_address).toBe(mockWinners[2].player_address);
    });

    it('should mark distributions as paid', () => {
      const { distributions } = createDistributedPrizePool(mockWinners, 10.00);

      distributions.forEach(d => {
        expect(d.payout_tx_hash).toBeDefined();
        expect(d.paid_at).toBeDefined();
      });
    });

    it('should handle fewer than 3 winners', () => {
      const twoWinners = mockWinners.slice(0, 2);
      const { distributions } = createDistributedPrizePool(twoWinners, 10.00);

      expect(distributions.length).toBe(2);
    });
  });

  // ==========================================================================
  // createPrizeDistribution
  // ==========================================================================

  describe('createPrizeDistribution', () => {
    it('should create distribution with default values', () => {
      const dist = createPrizeDistribution();

      expect(dist.id).toBeDefined();
      expect(dist.pool_id).toBe(1);
      expect(dist.rank).toBe(1);
      expect(dist.player_address).toBeDefined();
      expect(dist.prize_amount_usdc).toBe(0.50);
      expect(dist.percentage).toBe(50);
      expect(dist.payout_tx_hash).toBeNull();
      expect(dist.paid_at).toBeNull();
      expect(dist.created_at).toBeDefined();
    });

    it('should accept custom values', () => {
      const customAddress = generateWalletAddress();
      const dist = createPrizeDistribution({
        pool_id: 5,
        rank: 2,
        player_address: customAddress,
        prize_amount_usdc: 3.00,
        percentage: 30,
      });

      expect(dist.pool_id).toBe(5);
      expect(dist.rank).toBe(2);
      expect(dist.player_address).toBe(customAddress);
      expect(dist.prize_amount_usdc).toBe(3.00);
      expect(dist.percentage).toBe(30);
    });

    it('should create valid distribution objects', () => {
      const dist = createPrizeDistribution();
      expect(isValidPrizeDistribution(dist)).toBe(true);
    });
  });

  // ==========================================================================
  // createCustomDistribution
  // ==========================================================================

  describe('createCustomDistribution', () => {
    it('should create distributions with custom percentages', () => {
      const dists = createCustomDistribution([40, 35, 25], 10.00);

      expect(dists.length).toBe(3);
      expect(dists[0].percentage).toBe(40);
      expect(dists[1].percentage).toBe(35);
      expect(dists[2].percentage).toBe(25);
    });

    it('should calculate correct prize amounts', () => {
      const dists = createCustomDistribution([40, 35, 25], 10.00);

      expect(dists[0].prize_amount_usdc).toBe(4.00);
      expect(dists[1].prize_amount_usdc).toBe(3.50);
      expect(dists[2].prize_amount_usdc).toBe(2.50);
    });

    it('should assign correct ranks', () => {
      const dists = createCustomDistribution([50, 30, 20], 5.00);

      expect(dists[0].rank).toBe(1);
      expect(dists[1].rank).toBe(2);
      expect(dists[2].rank).toBe(3);
    });

    it('should throw error if percentages do not sum to 100', () => {
      expect(() => createCustomDistribution([40, 40, 10])).toThrow();
      expect(() => createCustomDistribution([50, 30, 30])).toThrow();
    });

    it('should support more than 3 places', () => {
      const dists = createCustomDistribution([40, 25, 20, 10, 5], 100.00);

      expect(dists.length).toBe(5);
      expect(dists[3].rank).toBe(4);
      expect(dists[4].rank).toBe(5);
    });
  });

  // ==========================================================================
  // createEmptyPrizePool
  // ==========================================================================

  describe('createEmptyPrizePool', () => {
    it('should create pool with zero amounts', () => {
      const pool = createEmptyPrizePool();

      expect(pool.total_accumulated_usdc).toBe(0);
      expect(pool.platform_fee_usdc).toBe(0);
      expect(pool.distributable_amount_usdc).toBe(0);
    });

    it('should have accumulating status', () => {
      const pool = createEmptyPrizePool();
      expect(pool.status).toBe('accumulating');
    });

    it('should accept game type and period', () => {
      const pool = createEmptyPrizePool('tetris', 'weekly');

      expect(pool.game_type).toBe('tetris');
      expect(pool.period_type).toBe('weekly');
    });
  });

  // ==========================================================================
  // Status-Based Factories
  // ==========================================================================

  describe('createLockedPrizePool', () => {
    it('should create pool with locked status', () => {
      const pool = createLockedPrizePool(20.00);

      expect(pool.status).toBe('locked');
      expect(pool.total_accumulated_usdc).toBe(20.00);
    });
  });

  describe('createDistributingPrizePool', () => {
    it('should create pool with distributing status', () => {
      const pool = createDistributingPrizePool(15.00);

      expect(pool.status).toBe('distributing');
      expect(pool.total_accumulated_usdc).toBe(15.00);
      expect(pool.distribution_tx_hash).toBeDefined();
    });
  });

  // ==========================================================================
  // Batch Factory Functions
  // ==========================================================================

  describe('createPrizePoolHistory', () => {
    it('should create specified number of pools', () => {
      const history = createPrizePoolHistory(5);
      expect(history.length).toBe(5);
    });

    it('should have most recent pool accumulating', () => {
      const history = createPrizePoolHistory(5);
      expect(history[0].status).toBe('accumulating');
    });

    it('should have older pools distributed', () => {
      const history = createPrizePoolHistory(5);
      history.slice(1).forEach(pool => {
        expect(pool.status).toBe('distributed');
        expect(pool.distribution_tx_hash).toBeDefined();
        expect(pool.distributed_at).toBeDefined();
      });
    });

    it('should use specified game type', () => {
      const history = createPrizePoolHistory(3, 'daily', 'tetris');
      history.forEach(pool => {
        expect(pool.game_type).toBe('tetris');
      });
    });
  });

  describe('createMultiGamePools', () => {
    it('should create pools for both game types', () => {
      const pools = createMultiGamePools();

      expect(pools.snake).toBeDefined();
      expect(pools.tetris).toBeDefined();
      expect(pools.snake.game_type).toBe('snake');
      expect(pools.tetris.game_type).toBe('tetris');
    });

    it('should calculate totals from games played', () => {
      const pools = createMultiGamePools('daily', 100, 50);

      expect(pools.snake.total_accumulated_usdc).toBe(1.00); // 100 * 0.01
      expect(pools.tetris.total_accumulated_usdc).toBe(1.00); // 50 * 0.02
    });

    it('should use specified period type', () => {
      const pools = createMultiGamePools('weekly');

      expect(pools.snake.period_type).toBe('weekly');
      expect(pools.tetris.period_type).toBe('weekly');
    });
  });

  // ==========================================================================
  // Test Scenario Factories
  // ==========================================================================

  describe('createMinimumThresholdPool', () => {
    it('should create pool at minimum viable amount', () => {
      const { pool, distributions } = createMinimumThresholdPool();

      expect(pool.status).toBe('distributed');
      expect(pool.distributable_amount_usdc).toBeGreaterThanOrEqual(MINIMUM_DISTRIBUTION_THRESHOLD);
    });

    it('should have 3 winners', () => {
      const { distributions } = createMinimumThresholdPool();
      expect(distributions.length).toBe(3);
    });
  });

  describe('createBelowThresholdPool', () => {
    it('should create pool below minimum threshold', () => {
      const pool = createBelowThresholdPool();

      expect(pool.status).toBe('accumulating');
      expect(pool.total_accumulated_usdc).toBeLessThan(MINIMUM_DISTRIBUTION_THRESHOLD);
    });
  });

  describe('createPartialPayoutPool', () => {
    it('should create pool with mixed payout states', () => {
      const { pool, distributions } = createPartialPayoutPool();

      expect(pool.status).toBe('distributing');
      expect(distributions.length).toBe(3);
    });

    it('should have first winner paid', () => {
      const { distributions } = createPartialPayoutPool();

      expect(distributions[0].payout_tx_hash).toBeDefined();
      expect(distributions[0].paid_at).toBeDefined();
    });

    it('should have remaining winners unpaid', () => {
      const { distributions } = createPartialPayoutPool();

      expect(distributions[1].payout_tx_hash).toBeNull();
      expect(distributions[1].paid_at).toBeNull();
      expect(distributions[2].payout_tx_hash).toBeNull();
      expect(distributions[2].paid_at).toBeNull();
    });
  });

  // ==========================================================================
  // Validation Utilities
  // ==========================================================================

  describe('isValidPrizePool', () => {
    it('should return true for valid pools', () => {
      expect(isValidPrizePool(createPrizePool())).toBe(true);
      expect(isValidPrizePool(createActivePrizePool(50))).toBe(true);
      expect(isValidPrizePool(createEmptyPrizePool())).toBe(true);
    });

    it('should return false for null/undefined', () => {
      expect(isValidPrizePool(null)).toBe(false);
      expect(isValidPrizePool(undefined)).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(isValidPrizePool('string')).toBe(false);
      expect(isValidPrizePool(123)).toBe(false);
      expect(isValidPrizePool([])).toBe(false);
    });

    it('should return false for objects with missing fields', () => {
      expect(isValidPrizePool({})).toBe(false);
      expect(isValidPrizePool({ id: 1 })).toBe(false);
    });

    it('should return false for invalid field values', () => {
      const pool = createPrizePool();

      expect(isValidPrizePool({ ...pool, game_type: 'invalid' })).toBe(false);
      expect(isValidPrizePool({ ...pool, status: 'invalid' })).toBe(false);
      expect(isValidPrizePool({ ...pool, total_accumulated_usdc: 'not a number' })).toBe(false);
    });
  });

  describe('isValidPrizeDistribution', () => {
    it('should return true for valid distributions', () => {
      expect(isValidPrizeDistribution(createPrizeDistribution())).toBe(true);
    });

    it('should return false for null/undefined', () => {
      expect(isValidPrizeDistribution(null)).toBe(false);
      expect(isValidPrizeDistribution(undefined)).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(isValidPrizeDistribution('string')).toBe(false);
      expect(isValidPrizeDistribution(123)).toBe(false);
    });

    it('should return false for objects with missing fields', () => {
      expect(isValidPrizeDistribution({})).toBe(false);
    });
  });

  describe('distributionsMatchTotal', () => {
    it('should return true when distributions match total', () => {
      const dists = createCustomDistribution([50, 30, 20], 10.00);
      expect(distributionsMatchTotal(dists, 10.00)).toBe(true);
    });

    it('should return false when distributions do not match', () => {
      const dists = createCustomDistribution([50, 30, 20], 10.00);
      expect(distributionsMatchTotal(dists, 15.00)).toBe(false);
    });

    it('should respect tolerance for rounding', () => {
      const dists = createCustomDistribution([50, 30, 20], 3.33);
      // Due to rounding: 1.67 + 1.00 + 0.67 = 3.34
      expect(distributionsMatchTotal(dists, 3.33, 0.02)).toBe(true);
    });
  });

  describe('distributionPercentagesValid', () => {
    it('should return true when percentages sum to 100', () => {
      const dists = createCustomDistribution([50, 30, 20], 10.00);
      expect(distributionPercentagesValid(dists)).toBe(true);
    });

    it('should return true for custom split that sums to 100', () => {
      const dists = createCustomDistribution([40, 35, 25], 10.00);
      expect(distributionPercentagesValid(dists)).toBe(true);
    });

    it('should handle 5-way split', () => {
      const dists = createCustomDistribution([40, 25, 20, 10, 5], 10.00);
      expect(distributionPercentagesValid(dists)).toBe(true);
    });
  });
});
