/**
 * MSW API Mock Handlers
 *
 * Comprehensive mock handlers for all x402 Arcade backend API endpoints.
 * These handlers provide realistic mock responses for testing frontend components.
 *
 * @module __tests__/mocks/handlers
 */

import { rest, type RequestHandler, type MockRequestInfo, type MockResponseContext } from '../msw-server';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Game types supported by the arcade
 */
export type GameType = 'snake' | 'tetris' | 'pong' | 'breakout' | 'space-invaders';

/**
 * Game session status
 */
export type SessionStatus = 'pending' | 'active' | 'paused' | 'completed' | 'expired';

/**
 * Game session data structure
 */
export interface GameSession {
  id: string;
  gameType: GameType;
  playerAddress: string;
  status: SessionStatus;
  score: number;
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
  paymentTxHash: string;
}

/**
 * Leaderboard entry structure
 */
export interface LeaderboardEntry {
  rank: number;
  playerAddress: string;
  score: number;
  gameType: GameType;
  achievedAt: string;
}

/**
 * Payment requirement for 402 response
 */
export interface PaymentRequirement {
  x402Version: '1';
  accepts: Array<{
    scheme: 'exact';
    network: string;
    maxAmountRequired: string;
    resource: string;
    description: string;
    payTo: string;
    asset: {
      address: string;
      name: string;
      decimals: number;
      symbol: string;
    };
  }>;
}

/**
 * Payment verification result
 */
export interface PaymentVerification {
  valid: boolean;
  transactionHash?: string;
  blockNumber?: number;
  amount?: string;
  error?: string;
}

/**
 * User auth info
 */
export interface AuthInfo {
  address: string;
  isConnected: boolean;
  nonce: string;
  signature?: string;
}

// ============================================================================
// MOCK DATA FACTORIES
// ============================================================================

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a mock transaction hash
 */
export function generateTxHash(): string {
  return `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
}

/**
 * Generate a mock wallet address
 */
export function generateAddress(): string {
  return `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
}

/**
 * Generate a nonce for authentication
 */
export function generateNonce(): string {
  return `nonce-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Create a mock game session
 */
export function createMockSession(overrides: Partial<GameSession> = {}): GameSession {
  const now = new Date().toISOString();
  return {
    id: generateSessionId(),
    gameType: 'snake',
    playerAddress: '0x1234567890abcdef1234567890abcdef12345678',
    status: 'active',
    score: 0,
    startedAt: now,
    completedAt: null,
    duration: null,
    paymentTxHash: generateTxHash(),
    ...overrides,
  };
}

/**
 * Create a mock leaderboard entry
 */
export function createMockLeaderboardEntry(
  rank: number,
  overrides: Partial<LeaderboardEntry> = {}
): LeaderboardEntry {
  return {
    rank,
    playerAddress: generateAddress(),
    score: Math.floor(Math.random() * 10000) + (100 - rank) * 100,
    gameType: 'snake',
    achievedAt: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
    ...overrides,
  };
}

/**
 * Create mock leaderboard data
 */
export function createMockLeaderboard(
  gameType: GameType = 'snake',
  count: number = 10
): LeaderboardEntry[] {
  return Array.from({ length: count }, (_, i) =>
    createMockLeaderboardEntry(i + 1, { gameType })
  );
}

/**
 * Create a 402 payment requirement response
 */
export function createPaymentRequirement(
  amount: string = '10000',
  resource: string = '/api/play',
  description: string = 'Pay to play Snake - $0.01 USDC'
): PaymentRequirement {
  return {
    x402Version: '1',
    accepts: [
      {
        scheme: 'exact',
        network: 'cronos-testnet',
        maxAmountRequired: amount,
        resource,
        description,
        payTo: '0xArcadeWallet1234567890abcdef1234567890ab',
        asset: {
          address: '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0',
          name: 'Bridged USDC (Stargate)',
          decimals: 6,
          symbol: 'devUSDC.e',
        },
      },
    ],
  };
}

// ============================================================================
// AUTH HANDLERS
// ============================================================================

/**
 * Storage for mock auth state (simulates server-side sessions)
 */
const mockAuthState: Map<string, AuthInfo> = new Map();

/**
 * Clear mock auth state (call in beforeEach)
 */
export function clearMockAuthState(): void {
  mockAuthState.clear();
}

/**
 * Auth handlers for authentication endpoints
 */
export const authHandlers: RequestHandler[] = [
  // Get nonce for signing
  rest.get('/api/auth/nonce', (req, res) => {
    const address = req.url.searchParams.get('address');
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const nonce = generateNonce();
    mockAuthState.set(address.toLowerCase(), {
      address: address.toLowerCase(),
      isConnected: false,
      nonce,
    });

    return res.json({ nonce, message: `Sign this message to authenticate: ${nonce}` });
  }),

  // Login with signature
  rest.post('/api/auth/login', (req, res) => {
    const body = req.body as { address?: string; signature?: string };
    const { address, signature } = body;

    if (!address || !signature) {
      return res.status(400).json({ error: 'Address and signature are required' });
    }

    const authInfo = mockAuthState.get(address.toLowerCase());
    if (!authInfo) {
      return res.status(400).json({ error: 'No nonce found. Request a nonce first.' });
    }

    // In mock, we just accept any signature
    authInfo.isConnected = true;
    authInfo.signature = signature;
    mockAuthState.set(address.toLowerCase(), authInfo);

    return res.json({
      success: true,
      address: address.toLowerCase(),
      message: 'Successfully authenticated',
    });
  }),

  // Logout
  rest.post('/api/auth/logout', (req, res) => {
    const body = req.body as { address?: string };
    const { address } = body;

    if (address) {
      mockAuthState.delete(address.toLowerCase());
    }

    return res.json({ success: true, message: 'Successfully logged out' });
  }),

  // Verify current session
  rest.get('/api/auth/verify', (req, res) => {
    const address = req.url.searchParams.get('address');
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const authInfo = mockAuthState.get(address.toLowerCase());
    if (!authInfo || !authInfo.isConnected) {
      return res.status(401).json({ error: 'Not authenticated', isAuthenticated: false });
    }

    return res.json({
      isAuthenticated: true,
      address: authInfo.address,
    });
  }),
];

// ============================================================================
// GAME HANDLERS
// ============================================================================

/**
 * Storage for mock game sessions
 */
const mockSessions: Map<string, GameSession> = new Map();

/**
 * Clear mock sessions (call in beforeEach)
 */
export function clearMockSessions(): void {
  mockSessions.clear();
}

/**
 * Get a mock session by ID
 */
export function getMockSession(id: string): GameSession | undefined {
  return mockSessions.get(id);
}

/**
 * Set a mock session
 */
export function setMockSession(session: GameSession): void {
  mockSessions.set(session.id, session);
}

/**
 * Game handlers for game session endpoints
 */
export const gameHandlers: RequestHandler[] = [
  // Start new game session (requires x402 payment)
  rest.post('/api/play', (req, res) => {
    const paymentHeader = req.headers.get('x-payment');

    // If no payment header, return 402 Payment Required
    if (!paymentHeader) {
      return res
        .status(402)
        .set('X-Payment-Required', 'true')
        .json(createPaymentRequirement());
    }

    // Parse game type from body
    const body = req.body as { gameType?: GameType };
    const gameType = body.gameType || 'snake';

    // Create and store the session
    const session = createMockSession({
      gameType,
      paymentTxHash: generateTxHash(),
    });
    mockSessions.set(session.id, session);

    return res.status(201).json({
      success: true,
      session,
    });
  }),

  // Get session by ID
  rest.get('/api/sessions/:id', (req, res) => {
    const { id } = req.params;
    const session = mockSessions.get(id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    return res.json({ session });
  }),

  // Send game action (move, input, etc.)
  rest.post('/api/sessions/:id/action', (req, res) => {
    const { id } = req.params;
    const session = mockSessions.get(id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ error: `Session is ${session.status}, not active` });
    }

    const body = req.body as { action?: string; data?: unknown };

    // Just acknowledge the action - game logic is client-side
    return res.json({
      success: true,
      sessionId: id,
      action: body.action,
      timestamp: Date.now(),
    });
  }),

  // Complete game session
  rest.post('/api/sessions/:id/complete', (req, res) => {
    const { id } = req.params;
    const session = mockSessions.get(id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status === 'completed') {
      return res.status(400).json({ error: 'Session already completed' });
    }

    const body = req.body as { score?: number };
    const completedAt = new Date().toISOString();
    const duration = Date.now() - new Date(session.startedAt).getTime();

    // Update session
    session.status = 'completed';
    session.score = body.score || 0;
    session.completedAt = completedAt;
    session.duration = duration;
    mockSessions.set(id, session);

    return res.json({
      success: true,
      session,
    });
  }),

  // Pause game session
  rest.post('/api/sessions/:id/pause', (req, res) => {
    const { id } = req.params;
    const session = mockSessions.get(id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ error: `Cannot pause session with status: ${session.status}` });
    }

    session.status = 'paused';
    mockSessions.set(id, session);

    return res.json({ success: true, session });
  }),

  // Resume game session
  rest.post('/api/sessions/:id/resume', (req, res) => {
    const { id } = req.params;
    const session = mockSessions.get(id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status !== 'paused') {
      return res.status(400).json({ error: `Cannot resume session with status: ${session.status}` });
    }

    session.status = 'active';
    mockSessions.set(id, session);

    return res.json({ success: true, session });
  }),
];

// ============================================================================
// LEADERBOARD HANDLERS
// ============================================================================

/**
 * Mock leaderboard data storage
 */
const mockLeaderboards: Map<string, LeaderboardEntry[]> = new Map();

/**
 * Initialize mock leaderboards with default data
 */
export function initializeMockLeaderboards(): void {
  const games: GameType[] = ['snake', 'tetris', 'pong', 'breakout', 'space-invaders'];
  games.forEach((game) => {
    mockLeaderboards.set(`${game}-daily`, createMockLeaderboard(game, 10));
    mockLeaderboards.set(`${game}-weekly`, createMockLeaderboard(game, 20));
    mockLeaderboards.set(`${game}-alltime`, createMockLeaderboard(game, 50));
  });
}

/**
 * Clear mock leaderboards
 */
export function clearMockLeaderboards(): void {
  mockLeaderboards.clear();
}

/**
 * Leaderboard handlers
 */
export const leaderboardHandlers: RequestHandler[] = [
  // Get leaderboard for game type
  rest.get('/api/leaderboard/:gameType', (req, res) => {
    const { gameType } = req.params;
    const period = req.url.searchParams.get('period') || 'daily';
    const limit = parseInt(req.url.searchParams.get('limit') || '10', 10);

    const key = `${gameType}-${period}`;
    let entries = mockLeaderboards.get(key);

    // Generate default data if not found
    if (!entries) {
      entries = createMockLeaderboard(gameType as GameType, 50);
      mockLeaderboards.set(key, entries);
    }

    return res.json({
      gameType,
      period,
      entries: entries.slice(0, limit),
      totalEntries: entries.length,
    });
  }),

  // Get personal stats for a player
  rest.get('/api/leaderboard/:gameType/personal', (req, res) => {
    const { gameType } = req.params;
    const address = req.url.searchParams.get('address');

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    // Generate mock personal stats
    const highScore = Math.floor(Math.random() * 5000) + 500;
    const totalGames = Math.floor(Math.random() * 100) + 5;
    const rank = Math.floor(Math.random() * 1000) + 1;

    return res.json({
      gameType,
      playerAddress: address,
      highScore,
      totalGames,
      rank,
      averageScore: Math.floor(highScore * 0.6),
      lastPlayed: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
    });
  }),

  // Submit score to leaderboard
  rest.post('/api/leaderboard/submit', (req, res) => {
    const body = req.body as {
      sessionId?: string;
      gameType?: GameType;
      score?: number;
      playerAddress?: string;
    };

    if (!body.sessionId || !body.score || !body.gameType) {
      return res.status(400).json({ error: 'sessionId, gameType, and score are required' });
    }

    // Create leaderboard entry
    const entry: LeaderboardEntry = {
      rank: 0, // Will be calculated
      playerAddress: body.playerAddress || '0x1234567890abcdef1234567890abcdef12345678',
      score: body.score,
      gameType: body.gameType,
      achievedAt: new Date().toISOString(),
    };

    // Add to daily leaderboard and recalculate ranks
    const key = `${body.gameType}-daily`;
    let entries = mockLeaderboards.get(key) || [];
    entries.push(entry);
    entries.sort((a, b) => b.score - a.score);
    entries = entries.map((e, i) => ({ ...e, rank: i + 1 }));
    mockLeaderboards.set(key, entries);

    const newRank = entries.findIndex((e) => e.score === body.score) + 1;

    return res.status(201).json({
      success: true,
      entry: { ...entry, rank: newRank },
      isNewHighScore: newRank <= 10,
    });
  }),
];

// ============================================================================
// PAYMENT HANDLERS
// ============================================================================

/**
 * Mock payment history storage
 */
let mockPayments: Array<{
  transactionHash: string;
  playerAddress: string;
  amount: string;
  timestamp: string;
  purpose: string;
  status: 'pending' | 'confirmed' | 'failed';
}> = [];

/**
 * Clear mock payments
 */
export function clearMockPayments(): void {
  mockPayments = [];
}

/**
 * Payment handlers
 */
export const paymentHandlers: RequestHandler[] = [
  // Initiate payment (get payment requirements)
  rest.post('/api/payment/initiate', (req, res) => {
    const body = req.body as { gameType?: GameType; playerAddress?: string };

    const amount = body.gameType === 'tetris' ? '20000' : '10000';
    const description = `Pay to play ${body.gameType || 'Snake'} - $${
      body.gameType === 'tetris' ? '0.02' : '0.01'
    } USDC`;

    return res.json({
      paymentRequired: true,
      requirement: createPaymentRequirement(amount, '/api/play', description),
      validUntil: new Date(Date.now() + 300000).toISOString(), // 5 minutes
    });
  }),

  // Verify payment (check if payment was successful)
  rest.post('/api/payment/verify', (req, res) => {
    const body = req.body as { transactionHash?: string; expectedAmount?: string };

    if (!body.transactionHash) {
      return res.status(400).json({ error: 'transactionHash is required' });
    }

    // Simulate successful verification
    const verification: PaymentVerification = {
      valid: true,
      transactionHash: body.transactionHash,
      blockNumber: Math.floor(Math.random() * 1000000) + 10000000,
      amount: body.expectedAmount || '10000',
    };

    // Add to mock payments
    mockPayments.push({
      transactionHash: body.transactionHash,
      playerAddress: '0x1234567890abcdef1234567890abcdef12345678',
      amount: verification.amount || '10000',
      timestamp: new Date().toISOString(),
      purpose: 'game_payment',
      status: 'confirmed',
    });

    return res.json(verification);
  }),

  // Get payment history for a player
  rest.get('/api/payment/history', (req, res) => {
    const address = req.url.searchParams.get('address');
    const limit = parseInt(req.url.searchParams.get('limit') || '20', 10);

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    // Return mock payments filtered by address
    const playerPayments = mockPayments
      .filter((p) => p.playerAddress.toLowerCase() === address.toLowerCase())
      .slice(0, limit);

    // If no payments, generate some mock history
    if (playerPayments.length === 0) {
      const mockHistory = Array.from({ length: 5 }, (_, i) => ({
        transactionHash: generateTxHash(),
        playerAddress: address,
        amount: i % 2 === 0 ? '10000' : '20000',
        timestamp: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
        purpose: 'game_payment',
        status: 'confirmed' as const,
      }));
      return res.json({
        payments: mockHistory,
        total: mockHistory.length,
      });
    }

    return res.json({
      payments: playerPayments,
      total: playerPayments.length,
    });
  }),

  // Get prize pool information
  rest.get('/api/prizes/:gameType', (req, res) => {
    const { gameType } = req.params;
    const period = req.url.searchParams.get('period') || 'daily';

    const totalAmount = Math.floor(Math.random() * 1000 + 100) / 100; // $1-$11

    return res.json({
      gameType,
      period,
      totalAmount: totalAmount.toFixed(2),
      currency: 'USDC',
      totalGames: Math.floor(totalAmount * 100),
      endTime: new Date(Date.now() + 86400000).toISOString(),
      currentLeader: {
        address: generateAddress(),
        score: Math.floor(Math.random() * 10000) + 5000,
      },
    });
  }),
];

// ============================================================================
// ERROR HANDLERS
// ============================================================================

/**
 * Error simulation configuration
 */
interface ErrorSimulation {
  endpoint: string;
  method: 'get' | 'post' | 'put' | 'delete';
  errorType: 'network' | 'server' | 'auth' | 'validation' | 'notfound' | 'ratelimit';
  errorMessage?: string;
  statusCode?: number;
}

/**
 * Active error simulations
 */
let activeErrorSimulations: ErrorSimulation[] = [];

/**
 * Enable error simulation for testing
 */
export function simulateError(simulation: ErrorSimulation): void {
  activeErrorSimulations.push(simulation);
}

/**
 * Clear all error simulations
 */
export function clearErrorSimulations(): void {
  activeErrorSimulations = [];
}

/**
 * Check if there's an active error simulation for a request
 */
function checkErrorSimulation(
  endpoint: string,
  method: string
): ErrorSimulation | undefined {
  return activeErrorSimulations.find(
    (s) => s.endpoint === endpoint && s.method === method.toLowerCase()
  );
}

/**
 * Error handlers for testing error scenarios
 */
export const errorHandlers: RequestHandler[] = [
  // Health check endpoint
  rest.get('/api/health', (req, res) => {
    const simulation = checkErrorSimulation('/api/health', 'get');
    if (simulation) {
      if (simulation.errorType === 'network') {
        throw new TypeError('Failed to fetch');
      }
      return res.status(simulation.statusCode || 500).json({
        error: simulation.errorMessage || 'Internal server error',
      });
    }
    return res.json({ status: 'ok', timestamp: Date.now() });
  }),

  // Generic 500 error endpoint for testing
  rest.get('/api/error/500', (_req, res) => {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Something went wrong on the server',
    });
  }),

  // Generic 401 error endpoint for testing
  rest.get('/api/error/401', (_req, res) => {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }),

  // Generic 403 error endpoint for testing
  rest.get('/api/error/403', (_req, res) => {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have permission to access this resource',
    });
  }),

  // Generic 404 error endpoint for testing
  rest.get('/api/error/404', (_req, res) => {
    return res.status(404).json({
      error: 'Not Found',
      message: 'The requested resource was not found',
    });
  }),

  // Rate limit error endpoint for testing
  rest.get('/api/error/429', (_req, res) => {
    return res
      .status(429)
      .set('Retry-After', '60')
      .json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: 60,
      });
  }),

  // Slow response endpoint for testing loading states
  rest.get('/api/slow', (req, res) => {
    const delay = parseInt(req.url.searchParams.get('delay') || '2000', 10);
    return res.delay(delay).json({ message: 'This was a slow response', delay });
  }),
];

// ============================================================================
// COMBINED HANDLERS
// ============================================================================

/**
 * All handlers combined for easy setup
 */
export const handlers: RequestHandler[] = [
  ...authHandlers,
  ...gameHandlers,
  ...leaderboardHandlers,
  ...paymentHandlers,
  ...errorHandlers,
];

/**
 * Reset all mock state
 */
export function resetAllMockState(): void {
  clearMockAuthState();
  clearMockSessions();
  clearMockLeaderboards();
  clearMockPayments();
  clearErrorSimulations();
}

/**
 * Initialize all mock data
 */
export function initializeAllMockData(): void {
  initializeMockLeaderboards();
}

// ============================================================================
// HANDLER SETS FOR SPECIFIC TEST SCENARIOS
// ============================================================================

/**
 * Handlers for unauthenticated user scenarios
 */
export const unauthenticatedHandlers: RequestHandler[] = [
  rest.get('/api/auth/verify', (_req, res) => {
    return res.status(401).json({ error: 'Not authenticated', isAuthenticated: false });
  }),
  rest.post('/api/play', (_req, res) => {
    return res.status(401).json({ error: 'Authentication required' });
  }),
];

/**
 * Handlers for payment failure scenarios
 */
export const paymentFailureHandlers: RequestHandler[] = [
  rest.post('/api/payment/verify', (_req, res) => {
    return res.status(400).json({
      valid: false,
      error: 'Payment verification failed',
      errorCode: 'INVALID_SIGNATURE',
    });
  }),
];

/**
 * Handlers for insufficient funds scenarios
 */
export const insufficientFundsHandlers: RequestHandler[] = [
  rest.post('/api/play', (req, res) => {
    const paymentHeader = req.headers.get('x-payment');
    if (paymentHeader) {
      return res.status(402).json({
        error: 'Insufficient funds',
        errorCode: 'INSUFFICIENT_BALANCE',
        required: '10000',
        available: '5000',
      });
    }
    return res.status(402).json(createPaymentRequirement());
  }),
];

/**
 * Handlers for maintenance mode scenarios
 */
export const maintenanceModeHandlers: RequestHandler[] = [
  rest.get('/api/health', (_req, res) => {
    return res.status(503).json({
      status: 'maintenance',
      message: 'The arcade is currently under maintenance. Please try again later.',
      estimatedEndTime: new Date(Date.now() + 3600000).toISOString(),
    });
  }),
];

export default handlers;
