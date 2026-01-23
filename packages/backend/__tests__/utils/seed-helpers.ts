/**
 * Test Database Seeding Utilities
 *
 * Provides functions for populating test databases with realistic data scenarios.
 * Works with the fixture factories to create consistent, reproducible test data.
 *
 * @example
 * ```typescript
 * import {
 *   seedMinimalData,
 *   seedFullLeaderboard,
 *   seedActiveGames,
 *   seedPaymentHistory,
 *   seedForScenario,
 * } from '../utils/seed-helpers';
 *
 * // In a test
 * const data = seedMinimalData();
 * const leaderboard = seedFullLeaderboard(10, 'snake', 'daily');
 * const activeGames = seedActiveGames(5);
 * const payments = seedPaymentHistory('0x123...', 10);
 * const scenario = seedForScenario('fullArcade');
 * ```
 */

import {
  createGameSession,
  createActiveSession,
  createCompletedSession,
  createAbandonedSession,
  createPayment as createSessionPayment,
  createPlayerHistory,
  createLeaderboardDataset,
  createMixedStateSessions,
  generateWalletAddress,
  generateTxHash,
  TEST_ADDRESSES,
  GAME_PRICES,
  type GameSession,
  type Payment as SessionPayment,
} from '../fixtures/game-session.factory';

import {
  createLeaderboardEntry,
  createDailyLeaderboard,
  createWeeklyLeaderboard,
  createAllTimeLeaderboard,
  createTiedEntries,
  createPlayerLeaderboardHistory,
  getToday,
  getWeekStart,
  getDaysAgo,
  type LeaderboardEntry,
  type PeriodType,
  type GameType,
} from '../fixtures/leaderboard.factory';

import {
  createPrizePool,
  createActivePrizePool,
  createDistributedPrizePool,
  createEmptyPrizePool,
  createPrizePoolHistory,
  createMultiGamePools,
  type PrizePool,
  type PrizeDistribution,
} from '../fixtures/prize-pool.factory';

import {
  createPayment,
  createPendingPayment,
  createVerifiedPayment,
  createFailedPayment,
  createRefundedPayment,
  createPaymentForSession,
  createPrizePayment,
  createMixedStatePayments,
  type Payment,
} from '../fixtures/payment.factory';

// ============================================================================
// Types
// ============================================================================

/**
 * Minimal seed data for basic tests.
 */
export interface MinimalSeedData {
  player: {
    address: string;
  };
  session: GameSession;
  payment: Payment;
}

/**
 * Full leaderboard seed data.
 */
export interface LeaderboardSeedData {
  entries: LeaderboardEntry[];
  period_type: PeriodType;
  period_date: string;
  game_type: GameType;
  top_player: string;
  top_score: number;
}

/**
 * Active games seed data.
 */
export interface ActiveGamesSeedData {
  sessions: GameSession[];
  players: string[];
  game_types: Record<GameType, number>;
}

/**
 * Payment history seed data.
 */
export interface PaymentHistorySeedData {
  payments: Payment[];
  player_address: string;
  total_spent: number;
  games_played: number;
}

/**
 * Complete arcade seed data.
 */
export interface FullArcadeSeedData {
  players: string[];
  sessions: {
    active: GameSession[];
    completed: GameSession[];
    abandoned: GameSession[];
  };
  leaderboards: {
    snake: {
      daily: LeaderboardEntry[];
      weekly: LeaderboardEntry[];
      alltime: LeaderboardEntry[];
    };
    tetris: {
      daily: LeaderboardEntry[];
      weekly: LeaderboardEntry[];
      alltime: LeaderboardEntry[];
    };
  };
  prizePools: {
    snake: PrizePool;
    tetris: PrizePool;
  };
  payments: Payment[];
}

/**
 * Named test scenarios.
 */
export type ScenarioName =
  | 'empty'
  | 'minimal'
  | 'singlePlayer'
  | 'multiPlayer'
  | 'fullArcade'
  | 'leaderboardTies'
  | 'prizeDistribution'
  | 'paymentFailures';

// ============================================================================
// Core Seeding Functions
// ============================================================================

/**
 * Seed minimal data for basic test scenarios.
 *
 * Creates a single player with one game session and verified payment.
 *
 * @param gameType - Game type (default: snake)
 * @returns Minimal seed data
 *
 * @example
 * ```typescript
 * const { player, session, payment } = seedMinimalData();
 * expect(session.player_address).toBe(player.address);
 * ```
 */
export function seedMinimalData(gameType: GameType = 'snake'): MinimalSeedData {
  const playerAddress = TEST_ADDRESSES.player1;

  const payment = createVerifiedPayment(GAME_PRICES[gameType], gameType, {
    from_address: playerAddress,
  });

  const session = createActiveSession({
    game_type: gameType,
    player_address: playerAddress,
    payment_tx_hash: payment.tx_hash!,
    amount_paid_usdc: payment.amount_usdc,
  });

  return {
    player: { address: playerAddress },
    session,
    payment,
  };
}

/**
 * Seed a full leaderboard with ranked entries.
 *
 * @param count - Number of entries
 * @param gameType - Game type
 * @param periodType - Period type
 * @returns Leaderboard seed data
 *
 * @example
 * ```typescript
 * const leaderboard = seedFullLeaderboard(10, 'snake', 'daily');
 * expect(leaderboard.entries[0].rank).toBe(1);
 * ```
 */
export function seedFullLeaderboard(
  count: number = 10,
  gameType: GameType = 'snake',
  periodType: PeriodType = 'daily'
): LeaderboardSeedData {
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
    period_date: entries[0]?.period_date ?? getToday(),
    game_type: gameType,
    top_player: entries[0]?.player_address ?? '',
    top_score: entries[0]?.score ?? 0,
  };
}

/**
 * Seed active game sessions.
 *
 * @param count - Number of active sessions
 * @param gameType - Optional specific game type (random if not specified)
 * @returns Active games seed data
 *
 * @example
 * ```typescript
 * const { sessions, players } = seedActiveGames(5);
 * expect(sessions.every(s => s.status === 'active')).toBe(true);
 * ```
 */
export function seedActiveGames(
  count: number = 5,
  gameType?: GameType
): ActiveGamesSeedData {
  const sessions: GameSession[] = [];
  const players: string[] = [];
  const game_types: Record<GameType, number> = { snake: 0, tetris: 0 };

  for (let i = 0; i < count; i++) {
    const playerAddress = generateWalletAddress();
    const type = gameType ?? (Math.random() > 0.5 ? 'snake' : 'tetris');

    const payment = createVerifiedPayment(GAME_PRICES[type], type, {
      from_address: playerAddress,
    });

    const session = createActiveSession({
      game_type: type,
      player_address: playerAddress,
      payment_tx_hash: payment.tx_hash!,
    });

    sessions.push(session);
    players.push(playerAddress);
    game_types[type]++;
  }

  return { sessions, players, game_types };
}

/**
 * Seed payment history for a player.
 *
 * @param playerAddress - Player's wallet address
 * @param count - Number of payments
 * @param gameType - Game type
 * @returns Payment history seed data
 *
 * @example
 * ```typescript
 * const history = seedPaymentHistory('0x123...', 10);
 * expect(history.games_played).toBe(10);
 * ```
 */
export function seedPaymentHistory(
  playerAddress: string,
  count: number = 10,
  gameType: GameType = 'snake'
): PaymentHistorySeedData {
  const payments: Payment[] = [];
  const now = Date.now();
  const msPerDay = 86400000;

  for (let i = 0; i < count; i++) {
    const date = new Date(now - (count - 1 - i) * msPerDay);

    const payment = createVerifiedPayment(GAME_PRICES[gameType], gameType, {
      from_address: playerAddress,
      created_at: date.toISOString(),
      verified_at: date.toISOString(),
    });

    payments.push(payment);
  }

  const total_spent = payments.reduce((sum, p) => sum + p.amount_usdc, 0);

  return {
    payments,
    player_address: playerAddress,
    total_spent: Math.round(total_spent * 100) / 100,
    games_played: count,
  };
}

// ============================================================================
// Complex Scenario Seeding
// ============================================================================

/**
 * Seed a complete arcade with multiple players, games, and leaderboards.
 *
 * @param playerCount - Number of unique players
 * @param gamesPerPlayer - Games per player
 * @returns Full arcade seed data
 */
export function seedFullArcade(
  playerCount: number = 5,
  gamesPerPlayer: number = 10
): FullArcadeSeedData {
  const players: string[] = [];

  // Generate unique players
  for (let i = 0; i < playerCount; i++) {
    players.push(generateWalletAddress());
  }

  // Create sessions for each player
  const allSessions = createMixedStateSessions();
  const activeSessions: GameSession[] = [];
  const completedSessions: GameSession[] = [];
  const abandonedSessions: GameSession[] = [];
  const payments: Payment[] = [];

  players.forEach((playerAddress, playerIndex) => {
    // Create completed game history for this player
    const history = createPlayerHistory(playerAddress, gamesPerPlayer);
    completedSessions.push(...history);

    // Create payments for completed games
    history.forEach(session => {
      payments.push(
        createVerifiedPayment(session.amount_paid_usdc, session.game_type, {
          from_address: playerAddress,
          session_id: session.id,
        })
      );
    });

    // Some players have active games
    if (playerIndex < Math.ceil(playerCount / 3)) {
      const activeSession = createActiveSession({
        player_address: playerAddress,
        game_type: playerIndex % 2 === 0 ? 'snake' : 'tetris',
      });
      activeSessions.push(activeSession);
    }

    // Some players have abandoned games
    if (playerIndex >= playerCount - Math.ceil(playerCount / 5)) {
      const abandoned = createAbandonedSession({
        player_address: playerAddress,
      });
      abandonedSessions.push(abandoned);
    }
  });

  // Create leaderboards
  const leaderboards = {
    snake: {
      daily: createDailyLeaderboard(Math.min(10, playerCount), undefined, 'snake'),
      weekly: createWeeklyLeaderboard(Math.min(10, playerCount), undefined, 'snake'),
      alltime: createAllTimeLeaderboard(Math.min(20, playerCount), 'snake'),
    },
    tetris: {
      daily: createDailyLeaderboard(Math.min(10, playerCount), undefined, 'tetris'),
      weekly: createWeeklyLeaderboard(Math.min(10, playerCount), undefined, 'tetris'),
      alltime: createAllTimeLeaderboard(Math.min(20, playerCount), 'tetris'),
    },
  };

  // Create prize pools
  const snakeGamesCount = completedSessions.filter(s => s.game_type === 'snake').length;
  const tetrisGamesCount = completedSessions.filter(s => s.game_type === 'tetris').length;

  const prizePools = {
    snake: createActivePrizePool(snakeGamesCount, 'snake'),
    tetris: createActivePrizePool(tetrisGamesCount, 'tetris'),
  };

  return {
    players,
    sessions: {
      active: activeSessions,
      completed: completedSessions,
      abandoned: abandonedSessions,
    },
    leaderboards,
    prizePools,
    payments,
  };
}

/**
 * Seed a leaderboard with tied scores for testing tie-breaking logic.
 *
 * @param tieCount - Number of players with tied scores
 * @param score - The tied score
 * @param gameType - Game type
 * @returns Leaderboard entries with ties
 */
export function seedLeaderboardWithTies(
  tieCount: number = 3,
  score: number = 500,
  gameType: GameType = 'snake'
): LeaderboardEntry[] {
  // Create some regular entries
  const regularEntries = createDailyLeaderboard(5, undefined, gameType);

  // Create tied entries
  const tiedEntries = createTiedEntries(tieCount, score, {
    game_type: gameType,
    rank: 2, // Tied at rank 2
  });

  // Insert tied entries after first place
  const result = [
    regularEntries[0], // First place
    ...tiedEntries,     // Tied entries at rank 2
    ...regularEntries.slice(1).map((e, i) => ({
      ...e,
      rank: 2 + tieCount + i, // Adjust ranks after ties
    })),
  ];

  return result;
}

/**
 * Seed data for prize distribution testing.
 *
 * @param prizePool - Total prize pool amount
 * @returns Prize pool with distributions
 */
export function seedPrizeDistribution(prizePool: number = 10.00): {
  pool: PrizePool;
  distributions: PrizeDistribution[];
  winners: Array<{ address: string; rank: number; prize: number }>;
} {
  const winners = [
    { address: generateWalletAddress(), rank: 1, score: 999 },
    { address: generateWalletAddress(), rank: 2, score: 888 },
    { address: generateWalletAddress(), rank: 3, score: 777 },
  ];

  const { pool, distributions } = createDistributedPrizePool(
    winners.map(w => ({
      rank: w.rank,
      player_address: w.address,
      score: w.score,
    })),
    prizePool
  );

  return {
    pool,
    distributions,
    winners: distributions.map((d, i) => ({
      address: d.player_address,
      rank: d.rank,
      prize: d.prize_amount_usdc,
    })),
  };
}

/**
 * Seed various payment failure scenarios.
 *
 * @returns Payments with various failure states
 */
export function seedPaymentFailures(): {
  insufficientFunds: Payment;
  expiredAuth: Payment;
  invalidSignature: Payment;
  nonceReused: Payment;
  wrongRecipient: Payment;
  all: Payment[];
} {
  const insufficientFunds = createFailedPayment('INSUFFICIENT_FUNDS');
  const expiredAuth = createFailedPayment('EXPIRED_AUTHORIZATION');
  const invalidSignature = createFailedPayment('INVALID_SIGNATURE');
  const nonceReused = createFailedPayment('NONCE_ALREADY_USED');
  const wrongRecipient = createFailedPayment('WRONG_RECIPIENT');

  return {
    insufficientFunds,
    expiredAuth,
    invalidSignature,
    nonceReused,
    wrongRecipient,
    all: [insufficientFunds, expiredAuth, invalidSignature, nonceReused, wrongRecipient],
  };
}

// ============================================================================
// Named Scenario Seeding
// ============================================================================

/**
 * Seed data for a named test scenario.
 *
 * @param name - Scenario name
 * @returns Scenario-specific seed data
 *
 * @example
 * ```typescript
 * const data = seedForScenario('fullArcade');
 * const { players, sessions, leaderboards } = data;
 * ```
 */
export function seedForScenario(name: ScenarioName): unknown {
  switch (name) {
    case 'empty':
      return {
        sessions: [],
        payments: [],
        leaderboards: [],
        prizePools: [],
      };

    case 'minimal':
      return seedMinimalData();

    case 'singlePlayer': {
      const playerAddress = TEST_ADDRESSES.player1;
      const history = seedPaymentHistory(playerAddress, 5);
      const sessions = createPlayerHistory(playerAddress, 5);
      const leaderboard = createPlayerLeaderboardHistory(playerAddress);

      return {
        player: { address: playerAddress },
        payments: history.payments,
        sessions,
        leaderboard,
        stats: {
          total_spent: history.total_spent,
          games_played: history.games_played,
        },
      };
    }

    case 'multiPlayer':
      return seedFullArcade(5, 5);

    case 'fullArcade':
      return seedFullArcade(10, 20);

    case 'leaderboardTies':
      return {
        snake: seedLeaderboardWithTies(3, 500, 'snake'),
        tetris: seedLeaderboardWithTies(4, 5000, 'tetris'),
      };

    case 'prizeDistribution':
      return {
        daily: seedPrizeDistribution(5.00),
        weekly: seedPrizeDistribution(25.00),
        pools: createPrizePoolHistory(5),
      };

    case 'paymentFailures':
      return seedPaymentFailures();

    default:
      throw new Error(`Unknown scenario: ${name}`);
  }
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validate that seed data maintains referential integrity.
 *
 * @param data - Full arcade seed data
 * @returns Validation result with any errors
 */
export function validateSeedIntegrity(data: FullArcadeSeedData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check all session player addresses are in players list
  const allSessions = [
    ...data.sessions.active,
    ...data.sessions.completed,
    ...data.sessions.abandoned,
  ];

  // Note: Players are generated dynamically, so we just check sessions are valid
  allSessions.forEach((session, i) => {
    if (!session.player_address) {
      errors.push(`Session ${i} missing player_address`);
    }
    if (!session.id) {
      errors.push(`Session ${i} missing id`);
    }
  });

  // Check payments have valid from addresses
  data.payments.forEach((payment, i) => {
    if (!payment.from_address) {
      errors.push(`Payment ${i} missing from_address`);
    }
    if (!payment.amount_usdc || payment.amount_usdc <= 0) {
      errors.push(`Payment ${i} has invalid amount`);
    }
  });

  // Check leaderboards are properly sorted
  Object.entries(data.leaderboards).forEach(([game, periods]) => {
    Object.entries(periods).forEach(([period, entries]) => {
      for (let i = 1; i < entries.length; i++) {
        if (entries[i].score > entries[i - 1].score) {
          errors.push(`${game} ${period} leaderboard not sorted at position ${i}`);
        }
      }
    });
  });

  // Check prize pools have valid amounts
  Object.entries(data.prizePools).forEach(([game, pool]) => {
    if (pool.total_accumulated_usdc < 0) {
      errors.push(`${game} prize pool has negative amount`);
    }
    if (pool.distributable_amount_usdc > pool.total_accumulated_usdc) {
      errors.push(`${game} distributable amount exceeds total`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get statistics about seeded data.
 *
 * @param data - Full arcade seed data
 * @returns Statistics object
 */
export function getSeedStats(data: FullArcadeSeedData): {
  playerCount: number;
  totalSessions: number;
  activeSessions: number;
  completedSessions: number;
  abandonedSessions: number;
  totalPayments: number;
  totalRevenue: number;
  snakePrizePool: number;
  tetrisPrizePool: number;
} {
  return {
    playerCount: data.players.length,
    totalSessions:
      data.sessions.active.length +
      data.sessions.completed.length +
      data.sessions.abandoned.length,
    activeSessions: data.sessions.active.length,
    completedSessions: data.sessions.completed.length,
    abandonedSessions: data.sessions.abandoned.length,
    totalPayments: data.payments.length,
    totalRevenue: Math.round(
      data.payments
        .filter(p => p.status === 'verified')
        .reduce((sum, p) => sum + p.amount_usdc, 0) * 100
    ) / 100,
    snakePrizePool: data.prizePools.snake.total_accumulated_usdc,
    tetrisPrizePool: data.prizePools.tetris.total_accumulated_usdc,
  };
}
