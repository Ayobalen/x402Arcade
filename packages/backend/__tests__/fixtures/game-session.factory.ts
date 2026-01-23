/**
 * Game Session Fixture Factory
 *
 * Generates game session test data with various states for backend testing.
 * Extends the base factory from @x402arcade/shared with backend-specific utilities.
 *
 * @example
 * ```typescript
 * import {
 *   createGameSession,
 *   createActiveSession,
 *   createCompletedSession,
 *   createAbandonedSession,
 *   createSessionWithPayment,
 * } from '../fixtures/game-session.factory';
 *
 * const session = createGameSession();
 * const activeGame = createActiveSession({ game_type: 'tetris' });
 * const completedGame = createCompletedSession(500);
 * const abandonedGame = createAbandonedSession();
 * const paidSession = createSessionWithPayment(payment);
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export type GameType = 'snake' | 'tetris';
export type SessionStatus = 'active' | 'completed' | 'expired';

/**
 * Game session database record structure.
 */
export interface GameSession {
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

/**
 * Options for creating a game session.
 */
export interface CreateGameSessionOptions {
  id?: string;
  game_type?: GameType;
  player_address?: string;
  payment_tx_hash?: string;
  amount_paid_usdc?: number;
  score?: number | null;
  status?: SessionStatus;
  created_at?: string | Date;
  completed_at?: string | Date | null;
  game_duration_ms?: number | null;
}

/**
 * Payment record structure for linking sessions to payments.
 */
export interface Payment {
  id?: number;
  tx_hash: string;
  from_address: string;
  to_address: string;
  amount_usdc: number;
  purpose: 'game_payment' | 'prize_payout';
  status: string;
  created_at?: string;
  confirmed_at?: string | null;
}

/**
 * Session with linked payment information.
 */
export interface SessionWithPayment {
  session: GameSession;
  payment: Payment;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Game prices in USDC.
 */
export const GAME_PRICES = {
  snake: 0.01,
  tetris: 0.02,
} as const;

/**
 * Common test wallet addresses.
 * Using valid hex characters only (0-9, a-f, A-F).
 */
export const TEST_ADDRESSES = {
  player1: '0x1111111111111111111111111111111111111111',
  player2: '0x2222222222222222222222222222222222222222',
  player3: '0x3333333333333333333333333333333333333333',
  arcade: '0xA0CADE0000000000000000000000000000000001',
  facilitator: '0xFAC1110000000000000000000000000000000001',
};

/**
 * Session timeout in milliseconds (30 minutes).
 */
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * Average game duration for completed sessions.
 */
export const AVG_GAME_DURATION_MS = 120000; // 2 minutes

// ============================================================================
// Utility Functions
// ============================================================================

let sessionCounter = 0;
let paymentCounter = 0;

/**
 * Reset counters for test isolation.
 */
export function resetFactoryCounters(): void {
  sessionCounter = 0;
  paymentCounter = 0;
}

/**
 * Generate a unique session ID.
 */
export function generateSessionId(): string {
  sessionCounter++;
  return `session_${Date.now()}_${sessionCounter}`;
}

/**
 * Generate a random transaction hash.
 */
export function generateTxHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

/**
 * Generate a random wallet address.
 */
export function generateWalletAddress(): string {
  const chars = '0123456789abcdef';
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
}

/**
 * Convert a Date or string to ISO string.
 */
function toISOString(date: Date | string | null | undefined): string | null {
  if (date === null || date === undefined) return null;
  if (typeof date === 'string') return date;
  return date.toISOString();
}

/**
 * Generate a random score within a range.
 */
export function generateScore(min = 50, max = 1000): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random game duration within typical ranges.
 */
export function generateGameDuration(min = 30000, max = 300000): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ============================================================================
// Core Factory Functions
// ============================================================================

/**
 * Create a game session with sensible defaults.
 *
 * @param options - Optional overrides for any session field
 * @returns A game session object
 *
 * @example
 * ```typescript
 * const session = createGameSession();
 * const tetrisSession = createGameSession({ game_type: 'tetris' });
 * const specificPlayer = createGameSession({ player_address: '0x123...' });
 * ```
 */
export function createGameSession(options: CreateGameSessionOptions = {}): GameSession {
  const id = options.id ?? generateSessionId();
  const status = options.status ?? 'active';
  const game_type = options.game_type ?? 'snake';

  // Set amount based on game type if not provided
  const amount_paid_usdc = options.amount_paid_usdc ?? GAME_PRICES[game_type];

  // Auto-set completed_at and duration for completed sessions
  let completed_at = toISOString(options.completed_at);
  let game_duration_ms = options.game_duration_ms ?? null;

  if (status === 'completed' && !completed_at) {
    completed_at = new Date().toISOString();
    game_duration_ms = options.game_duration_ms ?? generateGameDuration();
  }

  return {
    id,
    game_type,
    player_address: options.player_address ?? TEST_ADDRESSES.player1,
    payment_tx_hash: options.payment_tx_hash ?? generateTxHash(),
    amount_paid_usdc,
    score: options.score ?? (status === 'completed' ? generateScore() : null),
    status,
    created_at: toISOString(options.created_at) ?? new Date().toISOString(),
    completed_at,
    game_duration_ms,
  };
}

/**
 * Create an active game session (game in progress).
 *
 * @param options - Optional overrides
 * @returns An active game session
 *
 * @example
 * ```typescript
 * const activeGame = createActiveSession();
 * const tetrisActive = createActiveSession({ game_type: 'tetris' });
 * ```
 */
export function createActiveSession(options: CreateGameSessionOptions = {}): GameSession {
  return createGameSession({
    ...options,
    status: 'active',
    score: null,
    completed_at: null,
    game_duration_ms: null,
  });
}

/**
 * Create a completed game session with a score.
 *
 * @param score - The final score (optional, random if not provided)
 * @param options - Optional overrides
 * @returns A completed game session
 *
 * @example
 * ```typescript
 * const completedGame = createCompletedSession(500);
 * const highScore = createCompletedSession(9999, { player_address: topPlayer });
 * ```
 */
export function createCompletedSession(
  score?: number,
  options: CreateGameSessionOptions = {}
): GameSession {
  const created = new Date(Date.now() - AVG_GAME_DURATION_MS);
  const gameDuration = options.game_duration_ms ?? generateGameDuration();

  return createGameSession({
    ...options,
    status: 'completed',
    score: score ?? generateScore(),
    created_at: options.created_at ?? created.toISOString(),
    completed_at: options.completed_at ?? new Date().toISOString(),
    game_duration_ms: gameDuration,
  });
}

/**
 * Create an abandoned game session (timed out without completion).
 *
 * Abandoned sessions occur when a player starts a game but doesn't submit
 * a score before the session timeout. These are marked as 'expired'.
 *
 * @param options - Optional overrides
 * @returns An abandoned (expired) game session
 *
 * @example
 * ```typescript
 * const abandonedGame = createAbandonedSession();
 * const abandonedTetris = createAbandonedSession({ game_type: 'tetris' });
 * ```
 */
export function createAbandonedSession(options: CreateGameSessionOptions = {}): GameSession {
  // Session started more than 30 minutes ago (past timeout)
  const created = new Date(Date.now() - SESSION_TIMEOUT_MS - 60000);

  return createGameSession({
    ...options,
    status: 'expired',
    score: null,
    created_at: options.created_at ?? created.toISOString(),
    completed_at: null,
    game_duration_ms: null,
  });
}

/**
 * Create an expired game session.
 * Alias for createAbandonedSession for semantic clarity.
 */
export const createExpiredSession = createAbandonedSession;

// ============================================================================
// Payment-Linked Factory Functions
// ============================================================================

/**
 * Create a payment record.
 *
 * @param options - Payment options
 * @returns A payment record
 */
export function createPayment(options: Partial<Payment> = {}): Payment {
  paymentCounter++;

  return {
    id: options.id ?? paymentCounter,
    tx_hash: options.tx_hash ?? generateTxHash(),
    from_address: options.from_address ?? TEST_ADDRESSES.player1,
    to_address: options.to_address ?? TEST_ADDRESSES.arcade,
    amount_usdc: options.amount_usdc ?? GAME_PRICES.snake,
    purpose: options.purpose ?? 'game_payment',
    status: options.status ?? 'confirmed',
    created_at: options.created_at ?? new Date().toISOString(),
    confirmed_at: options.confirmed_at ?? new Date().toISOString(),
  };
}

/**
 * Create a game session linked to a payment record.
 *
 * Ensures the session's payment_tx_hash matches the payment's tx_hash,
 * and the amounts are consistent.
 *
 * @param payment - Payment record to link (optional, creates one if not provided)
 * @param sessionOptions - Optional session overrides
 * @returns Session and payment objects with matching tx_hash
 *
 * @example
 * ```typescript
 * // Create session with new payment
 * const { session, payment } = createSessionWithPayment();
 *
 * // Create session with existing payment
 * const existingPayment = createPayment({ tx_hash: '0x123...', amount_usdc: 0.02 });
 * const { session } = createSessionWithPayment(existingPayment);
 *
 * // Create session with custom options
 * const { session, payment } = createSessionWithPayment(undefined, {
 *   game_type: 'tetris',
 *   player_address: '0xabc...',
 * });
 * ```
 */
export function createSessionWithPayment(
  payment?: Payment,
  sessionOptions: CreateGameSessionOptions = {}
): SessionWithPayment {
  // Create or use provided payment
  const actualPayment = payment ?? createPayment({
    from_address: sessionOptions.player_address,
    amount_usdc: sessionOptions.amount_paid_usdc ??
      (sessionOptions.game_type === 'tetris' ? GAME_PRICES.tetris : GAME_PRICES.snake),
  });

  // Create session linked to payment
  const session = createGameSession({
    ...sessionOptions,
    player_address: sessionOptions.player_address ?? actualPayment.from_address,
    payment_tx_hash: actualPayment.tx_hash,
    amount_paid_usdc: sessionOptions.amount_paid_usdc ?? actualPayment.amount_usdc,
  });

  return { session, payment: actualPayment };
}

/**
 * Create a completed session with linked payment.
 *
 * @param score - The final score
 * @param payment - Optional payment record
 * @param sessionOptions - Optional session overrides
 * @returns Session and payment with matching data
 */
export function createCompletedSessionWithPayment(
  score: number,
  payment?: Payment,
  sessionOptions: CreateGameSessionOptions = {}
): SessionWithPayment {
  const { session: baseSession, payment: actualPayment } = createSessionWithPayment(
    payment,
    sessionOptions
  );

  const completedSession = createCompletedSession(score, {
    ...baseSession,
    ...sessionOptions,
  });

  return { session: completedSession, payment: actualPayment };
}

// ============================================================================
// Batch Factory Functions
// ============================================================================

/**
 * Create multiple game sessions.
 *
 * @param count - Number of sessions to create
 * @param options - Options applied to all sessions
 * @returns Array of game sessions
 */
export function createGameSessions(
  count: number,
  options: CreateGameSessionOptions = {}
): GameSession[] {
  return Array.from({ length: count }, () => createGameSession(options));
}

/**
 * Create a player's game history with varying scores over time.
 *
 * @param playerAddress - Player's wallet address
 * @param count - Number of sessions
 * @param gameType - Game type (default: snake)
 * @returns Array of completed sessions with increasing scores over time
 *
 * @example
 * ```typescript
 * const history = createPlayerHistory('0x123...', 10, 'tetris');
 * // Returns 10 tetris sessions with scores and timestamps spread over days
 * ```
 */
export function createPlayerHistory(
  playerAddress: string,
  count: number,
  gameType: GameType = 'snake'
): GameSession[] {
  return Array.from({ length: count }, (_, index) => {
    // Simulate improving scores over time
    const baseScore = 100 + index * 50;
    const variance = Math.floor(Math.random() * 50) - 25;
    const score = Math.max(0, baseScore + variance);

    // Sessions spread over past days
    const daysAgo = count - index;
    const created = new Date(Date.now() - daysAgo * 86400000);

    return createCompletedSession(score, {
      player_address: playerAddress,
      game_type: gameType,
      created_at: created.toISOString(),
    });
  });
}

/**
 * Create a leaderboard-ready dataset with multiple players.
 *
 * @param playersCount - Number of players
 * @param sessionsPerPlayer - Sessions per player
 * @param gameType - Game type
 * @returns Array of sessions suitable for leaderboard testing
 */
export function createLeaderboardDataset(
  playersCount: number,
  sessionsPerPlayer: number,
  gameType: GameType = 'snake'
): GameSession[] {
  const sessions: GameSession[] = [];

  for (let p = 0; p < playersCount; p++) {
    const playerAddress = generateWalletAddress();
    const playerSessions = createPlayerHistory(
      playerAddress,
      sessionsPerPlayer,
      gameType
    );
    sessions.push(...playerSessions);
  }

  return sessions;
}

/**
 * Create sessions in various states for comprehensive testing.
 *
 * @returns Object with sessions in different states
 */
export function createMixedStateSessions(): {
  active: GameSession[];
  completed: GameSession[];
  abandoned: GameSession[];
  all: GameSession[];
} {
  const active = [
    createActiveSession({ game_type: 'snake' }),
    createActiveSession({ game_type: 'tetris' }),
  ];

  const completed = [
    createCompletedSession(100, { game_type: 'snake' }),
    createCompletedSession(500, { game_type: 'snake' }),
    createCompletedSession(200, { game_type: 'tetris' }),
  ];

  const abandoned = [
    createAbandonedSession({ game_type: 'snake' }),
    createAbandonedSession({ game_type: 'tetris' }),
  ];

  return {
    active,
    completed,
    abandoned,
    all: [...active, ...completed, ...abandoned],
  };
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validate that a session object has all required fields.
 *
 * @param session - Session to validate
 * @returns Whether the session is valid
 */
export function isValidSession(session: unknown): session is GameSession {
  if (!session || typeof session !== 'object') return false;

  const s = session as Record<string, unknown>;

  return (
    typeof s.id === 'string' &&
    (s.game_type === 'snake' || s.game_type === 'tetris') &&
    typeof s.player_address === 'string' &&
    typeof s.payment_tx_hash === 'string' &&
    typeof s.amount_paid_usdc === 'number' &&
    (s.score === null || typeof s.score === 'number') &&
    (s.status === 'active' || s.status === 'completed' || s.status === 'expired') &&
    typeof s.created_at === 'string' &&
    (s.completed_at === null || typeof s.completed_at === 'string') &&
    (s.game_duration_ms === null || typeof s.game_duration_ms === 'number')
  );
}

/**
 * Validate that a payment object has all required fields.
 *
 * @param payment - Payment to validate
 * @returns Whether the payment is valid
 */
export function isValidPayment(payment: unknown): payment is Payment {
  if (!payment || typeof payment !== 'object') return false;

  const p = payment as Record<string, unknown>;

  return (
    typeof p.tx_hash === 'string' &&
    typeof p.from_address === 'string' &&
    typeof p.to_address === 'string' &&
    typeof p.amount_usdc === 'number' &&
    (p.purpose === 'game_payment' || p.purpose === 'prize_payout') &&
    typeof p.status === 'string'
  );
}
