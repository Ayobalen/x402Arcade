/**
 * Leaderboard Fixture Factory
 *
 * Generates leaderboard test data with ranking and time-based scenarios.
 * Provides comprehensive factories for daily, weekly, and all-time leaderboards.
 *
 * @example
 * ```typescript
 * import {
 *   createLeaderboardEntry,
 *   createDailyLeaderboard,
 *   createWeeklyLeaderboard,
 *   createAllTimeLeaderboard,
 *   createTiedEntries,
 * } from '../fixtures/leaderboard.factory';
 *
 * const entry = createLeaderboardEntry();
 * const daily = createDailyLeaderboard(10);
 * const weekly = createWeeklyLeaderboard(10, new Date());
 * const allTime = createAllTimeLeaderboard(100);
 * const ties = createTiedEntries(3, 500);
 * ```
 */

import { TEST_ADDRESSES, generateWalletAddress } from './game-session.factory';

// ============================================================================
// Types
// ============================================================================

export type GameType = 'snake' | 'tetris';
export type PeriodType = 'daily' | 'weekly' | 'alltime';

/**
 * Leaderboard entry database record structure.
 */
export interface LeaderboardEntry {
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

/**
 * Options for creating a leaderboard entry.
 */
export interface CreateLeaderboardEntryOptions {
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

/**
 * Ranked leaderboard with metadata.
 */
export interface RankedLeaderboard {
  entries: LeaderboardEntry[];
  period_type: PeriodType;
  period_date: string;
  game_type: GameType;
  total_players: number;
  top_score: number;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Prize pool distribution percentages by rank.
 */
export const PRIZE_DISTRIBUTION = {
  first: 50,   // 50% to first place
  second: 30,  // 30% to second place
  third: 20,   // 20% to third place
} as const;

/**
 * Prize pool configuration.
 */
export const PRIZE_POOL_CONFIG = {
  /** Percentage of payments that go to prize pool */
  poolPercentage: 70,
  /** Minimum prize pool amount before distribution */
  minimumPool: 0.10,
  /** Distribution intervals */
  distributionPeriods: ['daily', 'weekly'] as PeriodType[],
};

/**
 * Default score ranges by game type.
 */
export const SCORE_RANGES = {
  snake: { min: 10, max: 500, avg: 150 },
  tetris: { min: 100, max: 10000, avg: 2000 },
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

let entryCounter = 0;

/**
 * Reset the entry counter for test isolation.
 */
export function resetLeaderboardCounters(): void {
  entryCounter = 0;
}

/**
 * Generate a unique session ID.
 */
function generateSessionId(): string {
  entryCounter++;
  return `session_${Date.now()}_${entryCounter}`;
}

/**
 * Get today's date formatted as YYYY-MM-DD.
 * Uses local time for consistent results.
 */
export function getToday(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get the start of the current ISO week (Monday).
 * Uses local time for consistent results across timezones.
 */
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  // Calculate days to subtract to get to Monday
  // Sunday (0) -> subtract 6 days
  // Monday (1) -> subtract 0 days
  // Tuesday (2) -> subtract 1 day, etc.
  const daysToSubtract = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - daysToSubtract);
  // Format as YYYY-MM-DD using local time
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${dayOfMonth}`;
}

/**
 * Get a date N days ago.
 */
export function getDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

/**
 * Get a date N weeks ago (start of that week).
 */
export function getWeeksAgo(weeks: number): string {
  const d = new Date();
  d.setDate(d.getDate() - weeks * 7);
  return getWeekStart(d);
}

/**
 * Generate a random score within a range.
 */
function generateScore(gameType: GameType = 'snake'): number {
  const range = SCORE_RANGES[gameType];
  return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
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
      return '2026-01-01'; // Fixed date for all-time
  }
}

// ============================================================================
// Core Factory Functions
// ============================================================================

/**
 * Create a leaderboard entry with sensible defaults.
 *
 * @param options - Optional overrides for any entry field
 * @returns A leaderboard entry object
 *
 * @example
 * ```typescript
 * const entry = createLeaderboardEntry();
 * const topEntry = createLeaderboardEntry({ score: 999, rank: 1 });
 * const tetrisEntry = createLeaderboardEntry({ game_type: 'tetris' });
 * ```
 */
export function createLeaderboardEntry(
  options: CreateLeaderboardEntryOptions = {}
): LeaderboardEntry {
  entryCounter++;

  const game_type = options.game_type ?? 'snake';
  const period_type = options.period_type ?? 'daily';
  const period_date = options.period_date ?? getPeriodDate(period_type);

  return {
    id: options.id ?? entryCounter,
    session_id: options.session_id ?? generateSessionId(),
    game_type,
    player_address: options.player_address ?? TEST_ADDRESSES.player1,
    score: options.score ?? generateScore(game_type),
    period_type,
    period_date,
    rank: options.rank ?? null,
    created_at: options.created_at ?? new Date().toISOString(),
  };
}

/**
 * Create a ranked leaderboard entry (with rank assigned).
 *
 * @param rank - The rank position (1 = first place)
 * @param score - The player's score
 * @param options - Optional overrides
 * @returns A ranked leaderboard entry
 */
export function createRankedEntry(
  rank: number,
  score: number,
  options: CreateLeaderboardEntryOptions = {}
): LeaderboardEntry {
  return createLeaderboardEntry({
    ...options,
    rank,
    score,
  });
}

// ============================================================================
// Period-Based Factory Functions
// ============================================================================

/**
 * Create a daily leaderboard with sorted entries.
 *
 * @param count - Number of entries to generate
 * @param date - Optional date (defaults to today)
 * @param gameType - Game type (defaults to snake)
 * @returns Array of ranked leaderboard entries sorted by score descending
 *
 * @example
 * ```typescript
 * const today = createDailyLeaderboard(10);
 * const yesterday = createDailyLeaderboard(10, getDaysAgo(1));
 * ```
 */
export function createDailyLeaderboard(
  count: number,
  date?: string,
  gameType: GameType = 'snake'
): LeaderboardEntry[] {
  const period_date = date ?? getToday();
  const entries: LeaderboardEntry[] = [];

  // Generate unique players with decreasing scores
  const baseScore = SCORE_RANGES[gameType].max;
  const scoreStep = Math.floor(baseScore / (count + 1));

  for (let i = 0; i < count; i++) {
    const score = baseScore - (i * scoreStep) + Math.floor(Math.random() * (scoreStep / 2));
    entries.push(
      createLeaderboardEntry({
        player_address: generateWalletAddress(),
        score: Math.max(score, SCORE_RANGES[gameType].min),
        period_type: 'daily',
        period_date,
        game_type: gameType,
        rank: i + 1,
      })
    );
  }

  return entries;
}

/**
 * Create a weekly leaderboard with date ranges.
 *
 * @param count - Number of entries to generate
 * @param weekStart - Start of the week (defaults to current week)
 * @param gameType - Game type (defaults to snake)
 * @returns Array of ranked leaderboard entries for the week
 *
 * @example
 * ```typescript
 * const thisWeek = createWeeklyLeaderboard(10);
 * const lastWeek = createWeeklyLeaderboard(10, getWeeksAgo(1));
 * ```
 */
export function createWeeklyLeaderboard(
  count: number,
  weekStart?: string | Date,
  gameType: GameType = 'snake'
): LeaderboardEntry[] {
  let period_date: string;

  if (!weekStart) {
    period_date = getWeekStart();
  } else if (weekStart instanceof Date) {
    period_date = getWeekStart(weekStart);
  } else {
    period_date = weekStart;
  }

  const entries: LeaderboardEntry[] = [];
  const baseScore = SCORE_RANGES[gameType].max * 1.5; // Higher scores for weekly (more games)
  const scoreStep = Math.floor(baseScore / (count + 1));

  for (let i = 0; i < count; i++) {
    const score = Math.floor(baseScore - (i * scoreStep) + Math.random() * (scoreStep / 2));
    entries.push(
      createLeaderboardEntry({
        player_address: generateWalletAddress(),
        score: Math.max(score, SCORE_RANGES[gameType].min),
        period_type: 'weekly',
        period_date,
        game_type: gameType,
        rank: i + 1,
      })
    );
  }

  return entries;
}

/**
 * Create an all-time leaderboard for persistent rankings.
 *
 * @param count - Number of entries to generate
 * @param gameType - Game type (defaults to snake)
 * @returns Array of ranked all-time leaderboard entries
 *
 * @example
 * ```typescript
 * const allTime = createAllTimeLeaderboard(100);
 * const tetrisAllTime = createAllTimeLeaderboard(50, 'tetris');
 * ```
 */
export function createAllTimeLeaderboard(
  count: number,
  gameType: GameType = 'snake'
): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = [];
  const baseScore = SCORE_RANGES[gameType].max * 3; // Highest scores for all-time
  const scoreStep = Math.floor(baseScore / (count + 1));

  // All-time entries have varied creation dates
  const now = Date.now();
  const msPerDay = 86400000;

  for (let i = 0; i < count; i++) {
    const score = Math.floor(baseScore - (i * scoreStep) + Math.random() * (scoreStep / 2));
    const daysAgo = Math.floor(Math.random() * 365); // Random date within past year
    const created = new Date(now - daysAgo * msPerDay);

    entries.push(
      createLeaderboardEntry({
        player_address: generateWalletAddress(),
        score: Math.max(score, SCORE_RANGES[gameType].min),
        period_type: 'alltime',
        period_date: '2026-01-01',
        game_type: gameType,
        rank: i + 1,
        created_at: created.toISOString(),
      })
    );
  }

  return entries;
}

// ============================================================================
// Tie-Breaking Factory Functions
// ============================================================================

/**
 * Create entries with tied scores for tie-breaking tests.
 *
 * @param count - Number of tied entries to create
 * @param score - The score all entries share
 * @param options - Optional overrides applied to all entries
 * @returns Array of leaderboard entries with the same score
 *
 * @example
 * ```typescript
 * // Create 3 players tied at 500 points
 * const ties = createTiedEntries(3, 500);
 *
 * // Create ties with custom period
 * const weeklyTies = createTiedEntries(5, 1000, { period_type: 'weekly' });
 * ```
 */
export function createTiedEntries(
  count: number,
  score: number,
  options: CreateLeaderboardEntryOptions = {}
): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = [];
  const baseTime = Date.now();

  for (let i = 0; i < count; i++) {
    // Different creation times for tie-breaking by "first to achieve"
    const created = new Date(baseTime - (count - i) * 1000); // 1 second apart

    entries.push(
      createLeaderboardEntry({
        ...options,
        player_address: generateWalletAddress(),
        score,
        created_at: created.toISOString(),
        // Ranks might be the same or different based on tie-breaking rules
        rank: options.rank ?? null,
      })
    );
  }

  return entries;
}

/**
 * Create a leaderboard with some tied entries at specific ranks.
 *
 * @param totalEntries - Total entries in leaderboard
 * @param tiesConfig - Array of { rank, count } for tied positions
 * @param gameType - Game type
 * @returns Array of entries with specified ties
 *
 * @example
 * ```typescript
 * // Create leaderboard where 2nd and 3rd place are tied
 * const board = createLeaderboardWithTies(10, [{ rank: 2, count: 2 }]);
 * ```
 */
export function createLeaderboardWithTies(
  totalEntries: number,
  tiesConfig: Array<{ rank: number; count: number }>,
  gameType: GameType = 'snake'
): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = [];
  const baseScore = SCORE_RANGES[gameType].max;

  let currentRank = 1;
  let entryIndex = 0;

  while (entryIndex < totalEntries) {
    const tieConfig = tiesConfig.find(t => t.rank === currentRank);

    if (tieConfig) {
      // Create tied entries
      const score = baseScore - (currentRank - 1) * 50;
      const tiedEntries = createTiedEntries(tieConfig.count, score, {
        game_type: gameType,
        rank: currentRank,
      });
      entries.push(...tiedEntries);
      entryIndex += tieConfig.count;
      currentRank += tieConfig.count; // Skip ranks for tied positions
    } else {
      // Create single entry
      const score = baseScore - (currentRank - 1) * 50;
      entries.push(
        createRankedEntry(currentRank, score, {
          player_address: generateWalletAddress(),
          game_type: gameType,
        })
      );
      entryIndex++;
      currentRank++;
    }
  }

  return entries.slice(0, totalEntries);
}

// ============================================================================
// Player-Specific Factories
// ============================================================================

/**
 * Create a player's leaderboard history across all periods.
 *
 * @param playerAddress - Player's wallet address
 * @param gameType - Game type
 * @returns Array of entries for daily, weekly, and all-time periods
 */
export function createPlayerLeaderboardHistory(
  playerAddress: string,
  gameType: GameType = 'snake'
): LeaderboardEntry[] {
  return [
    // Today's entry
    createLeaderboardEntry({
      player_address: playerAddress,
      game_type: gameType,
      period_type: 'daily',
      period_date: getToday(),
      score: 500,
      rank: 5,
    }),
    // This week's entry (higher score from multiple games)
    createLeaderboardEntry({
      player_address: playerAddress,
      game_type: gameType,
      period_type: 'weekly',
      period_date: getWeekStart(),
      score: 750,
      rank: 3,
    }),
    // All-time entry (best score ever)
    createLeaderboardEntry({
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
 * Create multiple days of leaderboard data for a player.
 *
 * @param playerAddress - Player's wallet address
 * @param days - Number of days to generate
 * @param gameType - Game type
 * @returns Array of daily entries over the specified period
 */
export function createPlayerDailyHistory(
  playerAddress: string,
  days: number,
  gameType: GameType = 'snake'
): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = [];

  for (let i = 0; i < days; i++) {
    // Simulate improving scores over time
    const baseScore = 100 + i * 20;
    const variance = Math.floor(Math.random() * 50) - 25;
    const score = Math.max(SCORE_RANGES[gameType].min, baseScore + variance);

    entries.push(
      createLeaderboardEntry({
        player_address: playerAddress,
        game_type: gameType,
        period_type: 'daily',
        period_date: getDaysAgo(days - 1 - i),
        score,
        rank: Math.floor(Math.random() * 10) + 1, // Random rank 1-10
      })
    );
  }

  return entries;
}

// ============================================================================
// Aggregated Factories
// ============================================================================

/**
 * Create a complete leaderboard dataset with metadata.
 *
 * @param count - Number of entries
 * @param periodType - Period type
 * @param gameType - Game type
 * @returns Ranked leaderboard with metadata
 */
export function createRankedLeaderboard(
  count: number,
  periodType: PeriodType = 'daily',
  gameType: GameType = 'snake'
): RankedLeaderboard {
  let entries: LeaderboardEntry[];

  switch (periodType) {
    case 'daily':
      entries = createDailyLeaderboard(count, undefined, gameType);
      break;
    case 'weekly':
      entries = createWeeklyLeaderboard(count, undefined, gameType);
      break;
    case 'alltime':
      entries = createAllTimeLeaderboard(count, gameType);
      break;
  }

  return {
    entries,
    period_type: periodType,
    period_date: entries[0]?.period_date ?? getPeriodDate(periodType),
    game_type: gameType,
    total_players: count,
    top_score: entries[0]?.score ?? 0,
  };
}

/**
 * Create leaderboard entries for multiple games.
 *
 * @param countPerGame - Entries per game type
 * @param periodType - Period type
 * @returns Object with snake and tetris leaderboards
 */
export function createMultiGameLeaderboard(
  countPerGame: number,
  periodType: PeriodType = 'daily'
): {
  snake: LeaderboardEntry[];
  tetris: LeaderboardEntry[];
} {
  return {
    snake: createRankedLeaderboard(countPerGame, periodType, 'snake').entries,
    tetris: createRankedLeaderboard(countPerGame, periodType, 'tetris').entries,
  };
}

// ============================================================================
// Prize Pool Factories
// ============================================================================

/**
 * Calculate prize distribution for top players.
 *
 * @param prizePool - Total prize pool amount
 * @param entries - Top 3 leaderboard entries
 * @returns Array of { player_address, prize_amount }
 */
export function calculatePrizeDistribution(
  prizePool: number,
  entries: LeaderboardEntry[]
): Array<{ player_address: string; prize_amount: number; rank: number }> {
  const distribution: Array<{ player_address: string; prize_amount: number; rank: number }> = [];
  const topThree = entries.slice(0, 3);

  if (topThree[0]) {
    distribution.push({
      player_address: topThree[0].player_address,
      prize_amount: Math.round(prizePool * PRIZE_DISTRIBUTION.first / 100 * 100) / 100,
      rank: 1,
    });
  }

  if (topThree[1]) {
    distribution.push({
      player_address: topThree[1].player_address,
      prize_amount: Math.round(prizePool * PRIZE_DISTRIBUTION.second / 100 * 100) / 100,
      rank: 2,
    });
  }

  if (topThree[2]) {
    distribution.push({
      player_address: topThree[2].player_address,
      prize_amount: Math.round(prizePool * PRIZE_DISTRIBUTION.third / 100 * 100) / 100,
      rank: 3,
    });
  }

  return distribution;
}

/**
 * Create a leaderboard with prize distribution data.
 *
 * @param count - Number of entries
 * @param prizePool - Prize pool amount
 * @param periodType - Period type
 * @returns Leaderboard entries with prize data for top 3
 */
export function createLeaderboardWithPrizes(
  count: number,
  prizePool: number,
  periodType: PeriodType = 'daily'
): {
  entries: LeaderboardEntry[];
  prizes: Array<{ player_address: string; prize_amount: number; rank: number }>;
} {
  const { entries } = createRankedLeaderboard(count, periodType);
  const prizes = calculatePrizeDistribution(prizePool, entries);

  return { entries, prizes };
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validate that a leaderboard entry has all required fields.
 *
 * @param entry - Entry to validate
 * @returns Whether the entry is valid
 */
export function isValidLeaderboardEntry(entry: unknown): entry is LeaderboardEntry {
  if (!entry || typeof entry !== 'object') return false;

  const e = entry as Record<string, unknown>;

  return (
    typeof e.id === 'number' &&
    typeof e.session_id === 'string' &&
    (e.game_type === 'snake' || e.game_type === 'tetris') &&
    typeof e.player_address === 'string' &&
    typeof e.score === 'number' &&
    (e.period_type === 'daily' || e.period_type === 'weekly' || e.period_type === 'alltime') &&
    typeof e.period_date === 'string' &&
    (e.rank === null || typeof e.rank === 'number') &&
    typeof e.created_at === 'string'
  );
}

/**
 * Validate that a leaderboard is properly sorted by score descending.
 *
 * @param entries - Leaderboard entries
 * @returns Whether the entries are properly sorted
 */
export function isProperlyRanked(entries: LeaderboardEntry[]): boolean {
  for (let i = 1; i < entries.length; i++) {
    // Score should be less than or equal to previous
    if (entries[i].score > entries[i - 1].score) {
      return false;
    }
    // Rank should increase (or stay same for ties)
    if (entries[i].rank !== null && entries[i - 1].rank !== null) {
      if (entries[i].rank! < entries[i - 1].rank!) {
        return false;
      }
    }
  }
  return true;
}
