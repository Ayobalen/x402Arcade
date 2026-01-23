/**
 * Mock Leaderboard Entry Factory
 *
 * Generates test leaderboard data.
 */

import { testAddresses } from './user.factory';
import type { GameType } from './game-session.factory';

export type PeriodType = 'daily' | 'weekly' | 'alltime';

export interface MockLeaderboardEntry {
  id: number;
  session_id: string;
  game_type: GameType;
  player_address: string;
  score: number;
  period_type: PeriodType;
  period_date: string;
  rank: number | null;
  created_at: string;
}

export interface CreateMockLeaderboardEntryOptions {
  id?: number;
  session_id?: string;
  game_type?: GameType;
  player_address?: string;
  score?: number;
  period_type?: PeriodType;
  period_date?: string;
  rank?: number | null;
  created_at?: string;
}

let entryCounter = 0;

/**
 * Get the current date formatted for period_date.
 */
function getCurrentPeriodDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get the start of the current week (ISO week starts Monday).
 */
function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  now.setDate(diff);
  return now.toISOString().split('T')[0];
}

/**
 * Create a mock leaderboard entry with sensible defaults.
 *
 * @param overrides - Optional overrides for any entry field
 * @returns A mock leaderboard entry object
 *
 * @example
 * const entry = createMockLeaderboardEntry();
 * const topScore = createMockLeaderboardEntry({ score: 1000, rank: 1 });
 */
export function createMockLeaderboardEntry(
  overrides: CreateMockLeaderboardEntryOptions = {}
): MockLeaderboardEntry {
  entryCounter++;

  const period_type = overrides.period_type ?? 'daily';
  let period_date = overrides.period_date;

  if (!period_date) {
    switch (period_type) {
      case 'daily':
        period_date = getCurrentPeriodDate();
        break;
      case 'weekly':
        period_date = getWeekStart();
        break;
      case 'alltime':
        period_date = '2026-01-01';
        break;
    }
  }

  return {
    id: overrides.id ?? entryCounter,
    session_id: overrides.session_id ?? `session_${Date.now()}_${entryCounter}`,
    game_type: overrides.game_type ?? 'snake',
    player_address: overrides.player_address ?? testAddresses.player1,
    score: overrides.score ?? Math.floor(Math.random() * 500) + 50,
    period_type,
    period_date,
    rank: overrides.rank ?? null,
    created_at: overrides.created_at ?? new Date().toISOString(),
  };
}

/**
 * Create a ranked leaderboard entry.
 */
export function createRankedEntry(
  rank: number,
  score: number,
  overrides: CreateMockLeaderboardEntryOptions = {}
): MockLeaderboardEntry {
  return createMockLeaderboardEntry({
    ...overrides,
    rank,
    score,
  });
}

/**
 * Create a complete leaderboard (top N players).
 *
 * @param count - Number of entries
 * @param gameType - Game type
 * @param periodType - Period type
 * @returns Array of ranked leaderboard entries
 */
export function createLeaderboard(
  count: number,
  gameType: GameType = 'snake',
  periodType: PeriodType = 'daily'
): MockLeaderboardEntry[] {
  // Generate addresses for unique players
  const addresses = Array.from({ length: count }, (_, i) =>
    `0x${(i + 1).toString().padStart(40, '0')}`
  );

  // Generate decreasing scores
  const baseScore = 1000;
  return addresses.map((address, index) =>
    createRankedEntry(index + 1, baseScore - index * 50, {
      player_address: address,
      game_type: gameType,
      period_type: periodType,
    })
  );
}

/**
 * Create entries for a specific player across multiple periods.
 */
export function createPlayerLeaderboardHistory(
  playerAddress: string,
  gameType: GameType = 'snake'
): MockLeaderboardEntry[] {
  const today = new Date();

  return [
    // Today's entry
    createMockLeaderboardEntry({
      player_address: playerAddress,
      game_type: gameType,
      period_type: 'daily',
      period_date: today.toISOString().split('T')[0],
      score: 500,
      rank: 5,
    }),
    // This week's entry
    createMockLeaderboardEntry({
      player_address: playerAddress,
      game_type: gameType,
      period_type: 'weekly',
      period_date: getWeekStart(),
      score: 750,
      rank: 3,
    }),
    // All-time entry
    createMockLeaderboardEntry({
      player_address: playerAddress,
      game_type: gameType,
      period_type: 'alltime',
      period_date: '2026-01-01',
      score: 1200,
      rank: 15,
    }),
  ];
}

/**
 * Prize pool calculation constants.
 */
export const prizePoolConfig = {
  /** Percentage of payments that go to prize pool */
  poolPercentage: 70,
  /** Minimum prize pool amount before distribution */
  minimumPool: 0.10,
};

/**
 * Calculate prize pool from game payments.
 */
export function calculatePrizePool(
  totalPayments: number,
  percentage: number = prizePoolConfig.poolPercentage
): number {
  return Math.round((totalPayments * percentage / 100) * 100) / 100;
}
