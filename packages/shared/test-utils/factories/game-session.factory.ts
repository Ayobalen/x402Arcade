/**
 * Mock Game Session Factory
 *
 * Generates test game session data.
 */

import { testAddresses } from './user.factory';

export type GameType = 'snake' | 'tetris';
export type SessionStatus = 'active' | 'completed' | 'expired';

export interface MockGameSession {
  id: string;
  game_type: GameType;
  player_address: string;
  payment_tx_hash: string;
  amount_paid_usdc: number;
  score: number | null;
  status: SessionStatus;
  created_at: string;
  completed_at: string | null;
  game_duration_ms: number | null;
}

export interface CreateMockGameSessionOptions {
  id?: string;
  game_type?: GameType;
  player_address?: string;
  payment_tx_hash?: string;
  amount_paid_usdc?: number;
  score?: number | null;
  status?: SessionStatus;
  created_at?: string;
  completed_at?: string | null;
  game_duration_ms?: number | null;
}

let sessionCounter = 0;

/**
 * Generate a random transaction hash.
 */
function generateTxHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

/**
 * Create a mock game session with sensible defaults.
 *
 * @param overrides - Optional overrides for any session field
 * @returns A mock game session object
 *
 * @example
 * const session = createMockGameSession();
 * const tetrisSession = createMockGameSession({ game_type: 'tetris' });
 * const completedSession = createMockGameSession({ status: 'completed', score: 150 });
 */
export function createMockGameSession(
  overrides: CreateMockGameSessionOptions = {}
): MockGameSession {
  sessionCounter++;

  const id = overrides.id ?? `session_${Date.now()}_${sessionCounter}`;
  const status = overrides.status ?? 'active';
  const game_type = overrides.game_type ?? 'snake';

  // Set amount based on game type if not provided
  const amount = overrides.amount_paid_usdc ?? (game_type === 'snake' ? 0.01 : 0.02);

  // Auto-set completed_at and duration for completed sessions
  let completed_at = overrides.completed_at ?? null;
  let game_duration_ms = overrides.game_duration_ms ?? null;

  if (status === 'completed' && !completed_at) {
    completed_at = new Date().toISOString();
    game_duration_ms = overrides.game_duration_ms ?? Math.floor(Math.random() * 300000) + 30000; // 30s - 5min
  }

  return {
    id,
    game_type,
    player_address: overrides.player_address ?? testAddresses.player1,
    payment_tx_hash: overrides.payment_tx_hash ?? generateTxHash(),
    amount_paid_usdc: amount,
    score: overrides.score ?? (status === 'completed' ? Math.floor(Math.random() * 1000) : null),
    status,
    created_at: overrides.created_at ?? new Date().toISOString(),
    completed_at,
    game_duration_ms,
  };
}

/**
 * Create an active game session.
 */
export function createActiveSession(
  overrides: CreateMockGameSessionOptions = {}
): MockGameSession {
  return createMockGameSession({
    ...overrides,
    status: 'active',
    score: null,
    completed_at: null,
    game_duration_ms: null,
  });
}

/**
 * Create a completed game session with score.
 */
export function createCompletedSession(
  score: number,
  overrides: CreateMockGameSessionOptions = {}
): MockGameSession {
  const created = new Date(Date.now() - 60000); // Started 1 min ago
  return createMockGameSession({
    ...overrides,
    status: 'completed',
    score,
    created_at: overrides.created_at ?? created.toISOString(),
    completed_at: overrides.completed_at ?? new Date().toISOString(),
    game_duration_ms: overrides.game_duration_ms ?? 60000,
  });
}

/**
 * Create an expired game session.
 */
export function createExpiredSession(
  overrides: CreateMockGameSessionOptions = {}
): MockGameSession {
  const created = new Date(Date.now() - 3600000); // 1 hour ago
  return createMockGameSession({
    ...overrides,
    status: 'expired',
    score: null,
    created_at: created.toISOString(),
  });
}

/**
 * Create multiple game sessions for a player.
 */
export function createPlayerHistory(
  playerAddress: string,
  count: number,
  gameType: GameType = 'snake'
): MockGameSession[] {
  return Array.from({ length: count }, (_, index) =>
    createCompletedSession(
      Math.floor(Math.random() * 500) + (index * 50), // Increasing scores over time
      {
        player_address: playerAddress,
        game_type: gameType,
        created_at: new Date(Date.now() - (count - index) * 86400000).toISOString(),
      }
    )
  );
}

/**
 * Game-specific price constants.
 */
export const gamePrices = {
  snake: 0.01,
  tetris: 0.02,
} as const;
