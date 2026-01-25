/**
 * Prize Pool Calculation Job
 *
 * Finalizes expired prize pools and determines winners.
 * Runs daily at midnight to close the previous day's pools.
 *
 * Tasks:
 * 1. Find all active prize pools whose period has ended
 * 2. For each pool, determine the winner (highest score)
 * 3. Mark the pool as 'finalized' with winner address
 * 4. Log results for audit trail
 *
 * @module jobs/prizepoolCalculation
 */

/* eslint-disable no-console */
// Console logging is essential for background job monitoring

import type { PrizePoolService, PeriodType, GameType } from '../services/prizePool.js';
import type { LeaderboardService } from '../services/leaderboard.js';

/**
 * Prize pool calculation job result
 */
export interface PrizePoolCalculationResult {
  /** Number of pools processed */
  poolsProcessed: number;
  /** Number of pools finalized */ poolsFinalized: number;
  /** List of finalized pools with winner details */
  finalizedPools: Array<{
    poolId: number;
    gameType: GameType;
    periodType: PeriodType;
    periodDate: string;
    winnerAddress: string | null;
    totalAmount: number;
  }>;
  /** Any errors encountered */
  errors: Array<{
    poolId: number;
    error: string;
  }>;
}

/**
 * Get the period date for yesterday (for daily pools)
 */
function getYesterdayDate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Get the previous week's start date (for weekly pools)
 */
function getPreviousWeekStart(): string {
  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 7);

  // Get Monday of that week
  const day = lastWeek.getDay();
  const diff = lastWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  const monday = new Date(lastWeek.setDate(diff));

  return monday.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Run the prize pool calculation job
 *
 * @param prizePoolService - Prize pool service instance
 * @param leaderboardService - Leaderboard service instance
 * @returns Job execution result
 */
export function runPrizePoolCalculation(
  prizePoolService: PrizePoolService,
  leaderboardService: LeaderboardService
): PrizePoolCalculationResult {
  const result: PrizePoolCalculationResult = {
    poolsProcessed: 0,
    poolsFinalized: 0,
    finalizedPools: [],
    errors: [],
  };

  try {
    const gameTypes: GameType[] = ['snake', 'tetris', 'pong', 'breakout', 'space_invaders'];
    const yesterdayDate = getYesterdayDate();
    const previousWeekStart = getPreviousWeekStart();

    // Process daily pools for yesterday
    for (const gameType of gameTypes) {
      try {
        result.poolsProcessed++;

        // Get the active pool for yesterday
        // Note: getCurrentPool won't work for yesterday, so we try to finalize directly
        // and handle the error if the pool doesn't exist or is already finalized

        // Get the leaderboard winner for this period
        const topPlayers = leaderboardService.getTopScores({
          gameType,
          periodType: 'daily',
          limit: 1,
        });

        // Finalize the pool (this will fail gracefully if pool doesn't exist)
        const pool = prizePoolService.finalizePool({
          gameType,
          periodType: 'daily',
          periodDate: yesterdayDate,
        });

        if (!pool) {
          // No pool exists for yesterday - this is fine, maybe no games were played
          continue;
        }

        const winnerAddress = topPlayers.length > 0 ? topPlayers[0].playerAddress : null;

        result.poolsFinalized++;
        result.finalizedPools.push({
          poolId: pool.id,
          gameType: pool.gameType,
          periodType: pool.periodType,
          periodDate: pool.periodDate,
          winnerAddress,
          totalAmount: pool.totalAmountUsdc,
        });

        console.log(`✅ Finalized daily pool #${pool.id} (${gameType}, ${yesterdayDate})`);
        if (winnerAddress) {
          console.log(`   Winner: ${winnerAddress} - Prize: ${pool.totalAmountUsdc} USDC`);
        } else {
          console.log(`   No winner (no games played)`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.errors.push({
          poolId: 0, // Unknown at this point
          error: `Daily pool for ${gameType}: ${errorMessage}`,
        });
        console.error(`❌ Error finalizing daily pool (${gameType}):`, errorMessage);
      }
    }

    // Process weekly pools for last week (runs on Mondays only)
    const today = new Date();
    if (today.getDay() === 1) {
      // Today is Monday - process last week's pools
      for (const gameType of gameTypes) {
        try {
          result.poolsProcessed++;

          const topPlayers = leaderboardService.getTopScores({
            gameType,
            periodType: 'weekly',
            limit: 1,
          });

          const pool = prizePoolService.finalizePool({
            gameType,
            periodType: 'weekly',
            periodDate: previousWeekStart,
          });

          if (!pool) {
            continue;
          }

          const winnerAddress = topPlayers.length > 0 ? topPlayers[0].playerAddress : null;

          result.poolsFinalized++;
          result.finalizedPools.push({
            poolId: pool.id,
            gameType: pool.gameType,
            periodType: pool.periodType,
            periodDate: pool.periodDate,
            winnerAddress,
            totalAmount: pool.totalAmountUsdc,
          });

          console.log(`✅ Finalized weekly pool #${pool.id} (${gameType}, ${previousWeekStart})`);
          if (winnerAddress) {
            console.log(`   Winner: ${winnerAddress} - Prize: ${pool.totalAmountUsdc} USDC`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          result.errors.push({
            poolId: 0,
            error: `Weekly pool for ${gameType}: ${errorMessage}`,
          });
          console.error(`❌ Error finalizing weekly pool (${gameType}):`, errorMessage);
        }
      }
    }

    console.log(`\n📊 Prize Pool Calculation Summary:`);
    console.log(`   Pools processed: ${result.poolsProcessed}`);
    console.log(`   Pools finalized: ${result.poolsFinalized}`);
    console.log(`   Errors: ${result.errors.length}`);

    return result;
  } catch (error) {
    console.error('❌ Prize pool calculation job failed:', error);
    throw error;
  }
}
