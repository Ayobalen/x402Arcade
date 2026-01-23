/**
 * Tests for MSW API Mock Handlers
 *
 * Comprehensive tests for all x402 Arcade API mock handlers.
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { setupServer } from '../msw-server';
import {
  handlers,
  authHandlers,
  gameHandlers,
  leaderboardHandlers,
  paymentHandlers,
  errorHandlers,
  // State management
  clearMockAuthState,
  clearMockSessions,
  clearMockLeaderboards,
  clearMockPayments,
  clearErrorSimulations,
  resetAllMockState,
  initializeAllMockData,
  initializeMockLeaderboards,
  // Mock data factories
  generateSessionId,
  generateTxHash,
  generateAddress,
  generateNonce,
  createMockSession,
  createMockLeaderboardEntry,
  createMockLeaderboard,
  createPaymentRequirement,
  // Session utilities
  getMockSession,
  setMockSession,
  // Error simulation
  simulateError,
  // Scenario handlers
  unauthenticatedHandlers,
  paymentFailureHandlers,
  insufficientFundsHandlers,
  maintenanceModeHandlers,
} from './index';

// ============================================================================
// MOCK DATA FACTORY TESTS
// ============================================================================

describe('Mock Data Factories', () => {
  describe('generateSessionId', () => {
    it('should generate unique session IDs', () => {
      const id1 = generateSessionId();
      const id2 = generateSessionId();
      expect(id1).not.toBe(id2);
    });

    it('should start with "session-"', () => {
      const id = generateSessionId();
      expect(id).toMatch(/^session-/);
    });
  });

  describe('generateTxHash', () => {
    it('should generate valid transaction hash format', () => {
      const hash = generateTxHash();
      expect(hash).toMatch(/^0x[a-f0-9]{64}$/);
    });

    it('should generate unique hashes', () => {
      const hash1 = generateTxHash();
      const hash2 = generateTxHash();
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('generateAddress', () => {
    it('should generate valid Ethereum address format', () => {
      const address = generateAddress();
      expect(address).toMatch(/^0x[a-f0-9]{40}$/);
    });

    it('should generate unique addresses', () => {
      const addr1 = generateAddress();
      const addr2 = generateAddress();
      expect(addr1).not.toBe(addr2);
    });
  });

  describe('generateNonce', () => {
    it('should generate unique nonces', () => {
      const nonce1 = generateNonce();
      const nonce2 = generateNonce();
      expect(nonce1).not.toBe(nonce2);
    });

    it('should start with "nonce-"', () => {
      const nonce = generateNonce();
      expect(nonce).toMatch(/^nonce-/);
    });
  });

  describe('createMockSession', () => {
    it('should create session with default values', () => {
      const session = createMockSession();
      expect(session).toMatchObject({
        gameType: 'snake',
        status: 'active',
        score: 0,
        completedAt: null,
        duration: null,
      });
      expect(session.id).toBeDefined();
      expect(session.playerAddress).toBeDefined();
      expect(session.startedAt).toBeDefined();
      expect(session.paymentTxHash).toBeDefined();
    });

    it('should allow overriding values', () => {
      const session = createMockSession({
        gameType: 'tetris',
        score: 1000,
        status: 'completed',
      });
      expect(session.gameType).toBe('tetris');
      expect(session.score).toBe(1000);
      expect(session.status).toBe('completed');
    });
  });

  describe('createMockLeaderboardEntry', () => {
    it('should create entry with specified rank', () => {
      const entry = createMockLeaderboardEntry(1);
      expect(entry.rank).toBe(1);
      expect(entry.playerAddress).toBeDefined();
      expect(entry.score).toBeGreaterThan(0);
      expect(entry.gameType).toBe('snake');
      expect(entry.achievedAt).toBeDefined();
    });

    it('should allow overriding values', () => {
      const entry = createMockLeaderboardEntry(5, {
        gameType: 'tetris',
        score: 5000,
      });
      expect(entry.rank).toBe(5);
      expect(entry.gameType).toBe('tetris');
      expect(entry.score).toBe(5000);
    });
  });

  describe('createMockLeaderboard', () => {
    it('should create leaderboard with default 10 entries', () => {
      const leaderboard = createMockLeaderboard();
      expect(leaderboard).toHaveLength(10);
    });

    it('should create leaderboard with specified count', () => {
      const leaderboard = createMockLeaderboard('tetris', 5);
      expect(leaderboard).toHaveLength(5);
      expect(leaderboard.every((e) => e.gameType === 'tetris')).toBe(true);
    });

    it('should have sequential ranks', () => {
      const leaderboard = createMockLeaderboard('snake', 10);
      leaderboard.forEach((entry, i) => {
        expect(entry.rank).toBe(i + 1);
      });
    });
  });

  describe('createPaymentRequirement', () => {
    it('should create valid payment requirement', () => {
      const req = createPaymentRequirement();
      expect(req.x402Version).toBe('1');
      expect(req.accepts).toHaveLength(1);
      expect(req.accepts[0].scheme).toBe('exact');
      expect(req.accepts[0].network).toBe('cronos-testnet');
    });

    it('should accept custom values', () => {
      const req = createPaymentRequirement('20000', '/api/play/tetris', 'Pay for Tetris');
      expect(req.accepts[0].maxAmountRequired).toBe('20000');
      expect(req.accepts[0].resource).toBe('/api/play/tetris');
      expect(req.accepts[0].description).toBe('Pay for Tetris');
    });
  });
});

// ============================================================================
// STATE MANAGEMENT TESTS
// ============================================================================

describe('State Management', () => {
  it('should clear auth state', () => {
    // This should not throw
    clearMockAuthState();
  });

  it('should clear sessions', () => {
    const session = createMockSession();
    setMockSession(session);
    expect(getMockSession(session.id)).toBeDefined();

    clearMockSessions();
    expect(getMockSession(session.id)).toBeUndefined();
  });

  it('should clear leaderboards', () => {
    clearMockLeaderboards();
    initializeMockLeaderboards();
    // Should not throw
  });

  it('should clear payments', () => {
    clearMockPayments();
    // Should not throw
  });

  it('should clear error simulations', () => {
    clearErrorSimulations();
    // Should not throw
  });

  it('should reset all mock state', () => {
    resetAllMockState();
    // Should not throw
  });

  it('should initialize all mock data', () => {
    initializeAllMockData();
    // Should not throw
  });
});

// ============================================================================
// AUTH HANDLER TESTS
// ============================================================================

describe('Auth Handlers', () => {
  const server = setupServer(...authHandlers);

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'bypass' });
  });

  afterEach(() => {
    server.resetHandlers();
    clearMockAuthState();
  });

  afterAll(() => {
    server.close();
  });

  describe('GET /api/auth/nonce', () => {
    it('should return nonce for valid address', async () => {
      const address = generateAddress();
      const response = await fetch(`http://localhost/api/auth/nonce?address=${address}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.nonce).toBeDefined();
      expect(data.message).toContain(data.nonce);
    });

    it('should return 400 without address', async () => {
      const response = await fetch('http://localhost/api/auth/nonce');
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate with valid signature', async () => {
      const address = generateAddress();

      // First get nonce
      await fetch(`http://localhost/api/auth/nonce?address=${address}`);

      // Then login
      const response = await fetch('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature: '0xmocksignature' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.address).toBe(address.toLowerCase());
    });

    it('should fail without nonce', async () => {
      const response = await fetch('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: generateAddress(), signature: '0xsig' }),
      });
      expect(response.status).toBe(400);
    });

    it('should fail without required fields', async () => {
      const response = await fetch('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await fetch('http://localhost/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: generateAddress() }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('GET /api/auth/verify', () => {
    it('should verify authenticated user', async () => {
      const address = generateAddress();

      // Setup: get nonce and login
      await fetch(`http://localhost/api/auth/nonce?address=${address}`);
      await fetch('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature: '0xsig' }),
      });

      // Verify
      const response = await fetch(`http://localhost/api/auth/verify?address=${address}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isAuthenticated).toBe(true);
    });

    it('should return 401 for unauthenticated user', async () => {
      const response = await fetch(`http://localhost/api/auth/verify?address=${generateAddress()}`);
      expect(response.status).toBe(401);
    });

    it('should return 400 without address', async () => {
      const response = await fetch('http://localhost/api/auth/verify');
      expect(response.status).toBe(400);
    });
  });
});

// ============================================================================
// GAME HANDLER TESTS
// ============================================================================

describe('Game Handlers', () => {
  const server = setupServer(...gameHandlers);

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'bypass' });
  });

  afterEach(() => {
    server.resetHandlers();
    clearMockSessions();
  });

  afterAll(() => {
    server.close();
  });

  describe('POST /api/play', () => {
    it('should return 402 without payment header', async () => {
      const response = await fetch('http://localhost/api/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameType: 'snake' }),
      });

      expect(response.status).toBe(402);
      const data = await response.json();
      expect(data.x402Version).toBe('1');
      expect(data.accepts).toBeDefined();
    });

    it('should create session with payment header', async () => {
      const response = await fetch('http://localhost/api/play', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Payment': 'mock-payment-header',
        },
        body: JSON.stringify({ gameType: 'tetris' }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.session.gameType).toBe('tetris');
      expect(data.session.status).toBe('active');
    });
  });

  describe('GET /api/sessions/:id', () => {
    it('should return session by ID', async () => {
      // Create a session first
      const session = createMockSession({ gameType: 'snake' });
      setMockSession(session);

      const response = await fetch(`http://localhost/api/sessions/${session.id}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.session.id).toBe(session.id);
    });

    it('should return 404 for non-existent session', async () => {
      const response = await fetch('http://localhost/api/sessions/nonexistent');
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/sessions/:id/action', () => {
    it('should accept action for active session', async () => {
      const session = createMockSession({ status: 'active' });
      setMockSession(session);

      const response = await fetch(`http://localhost/api/sessions/${session.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'move', data: { direction: 'up' } }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should reject action for completed session', async () => {
      const session = createMockSession({ status: 'completed' });
      setMockSession(session);

      const response = await fetch(`http://localhost/api/sessions/${session.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'move' }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/sessions/:id/complete', () => {
    it('should complete session with score', async () => {
      const session = createMockSession({ status: 'active' });
      setMockSession(session);

      const response = await fetch(`http://localhost/api/sessions/${session.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: 1500 }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.session.status).toBe('completed');
      expect(data.session.score).toBe(1500);
      expect(data.session.completedAt).toBeDefined();
    });

    it('should reject completing already completed session', async () => {
      const session = createMockSession({ status: 'completed' });
      setMockSession(session);

      const response = await fetch(`http://localhost/api/sessions/${session.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: 100 }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/sessions/:id/pause', () => {
    it('should pause active session', async () => {
      const session = createMockSession({ status: 'active' });
      setMockSession(session);

      const response = await fetch(`http://localhost/api/sessions/${session.id}/pause`, {
        method: 'POST',
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.session.status).toBe('paused');
    });

    it('should reject pausing non-active session', async () => {
      const session = createMockSession({ status: 'completed' });
      setMockSession(session);

      const response = await fetch(`http://localhost/api/sessions/${session.id}/pause`, {
        method: 'POST',
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/sessions/:id/resume', () => {
    it('should resume paused session', async () => {
      const session = createMockSession({ status: 'paused' });
      setMockSession(session);

      const response = await fetch(`http://localhost/api/sessions/${session.id}/resume`, {
        method: 'POST',
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.session.status).toBe('active');
    });

    it('should reject resuming non-paused session', async () => {
      const session = createMockSession({ status: 'active' });
      setMockSession(session);

      const response = await fetch(`http://localhost/api/sessions/${session.id}/resume`, {
        method: 'POST',
      });

      expect(response.status).toBe(400);
    });
  });
});

// ============================================================================
// LEADERBOARD HANDLER TESTS
// ============================================================================

describe('Leaderboard Handlers', () => {
  const server = setupServer(...leaderboardHandlers);

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'bypass' });
  });

  afterEach(() => {
    server.resetHandlers();
    clearMockLeaderboards();
  });

  afterAll(() => {
    server.close();
  });

  describe('GET /api/leaderboard/:gameType', () => {
    it('should return leaderboard for game type', async () => {
      const response = await fetch('http://localhost/api/leaderboard/snake');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.gameType).toBe('snake');
      expect(data.period).toBe('daily');
      expect(Array.isArray(data.entries)).toBe(true);
    });

    it('should respect period parameter', async () => {
      const response = await fetch('http://localhost/api/leaderboard/tetris?period=weekly');
      const data = await response.json();

      expect(data.period).toBe('weekly');
    });

    it('should respect limit parameter', async () => {
      const response = await fetch('http://localhost/api/leaderboard/snake?limit=5');
      const data = await response.json();

      expect(data.entries.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/leaderboard/:gameType/personal', () => {
    it('should return personal stats', async () => {
      const address = generateAddress();
      const response = await fetch(
        `http://localhost/api/leaderboard/snake/personal?address=${address}`
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.playerAddress).toBe(address);
      expect(data.highScore).toBeDefined();
      expect(data.totalGames).toBeDefined();
      expect(data.rank).toBeDefined();
    });

    it('should require address', async () => {
      const response = await fetch('http://localhost/api/leaderboard/snake/personal');
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/leaderboard/submit', () => {
    it('should submit score', async () => {
      const response = await fetch('http://localhost/api/leaderboard/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: generateSessionId(),
          gameType: 'snake',
          score: 2500,
          playerAddress: generateAddress(),
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.entry).toBeDefined();
      expect(data.entry.score).toBe(2500);
    });

    it('should require mandatory fields', async () => {
      const response = await fetch('http://localhost/api/leaderboard/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });
  });
});

// ============================================================================
// PAYMENT HANDLER TESTS
// ============================================================================

describe('Payment Handlers', () => {
  const server = setupServer(...paymentHandlers);

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'bypass' });
  });

  afterEach(() => {
    server.resetHandlers();
    clearMockPayments();
  });

  afterAll(() => {
    server.close();
  });

  describe('POST /api/payment/initiate', () => {
    it('should return payment requirements', async () => {
      const response = await fetch('http://localhost/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameType: 'snake' }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.paymentRequired).toBe(true);
      expect(data.requirement).toBeDefined();
      expect(data.validUntil).toBeDefined();
    });

    it('should return different amount for tetris', async () => {
      const response = await fetch('http://localhost/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameType: 'tetris' }),
      });

      const data = await response.json();
      expect(data.requirement.accepts[0].maxAmountRequired).toBe('20000');
    });
  });

  describe('POST /api/payment/verify', () => {
    it('should verify valid payment', async () => {
      const txHash = generateTxHash();
      const response = await fetch('http://localhost/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionHash: txHash, expectedAmount: '10000' }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.valid).toBe(true);
      expect(data.transactionHash).toBe(txHash);
      expect(data.blockNumber).toBeDefined();
    });

    it('should require transaction hash', async () => {
      const response = await fetch('http://localhost/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/payment/history', () => {
    it('should return payment history', async () => {
      const address = generateAddress();
      const response = await fetch(`http://localhost/api/payment/history?address=${address}`);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.payments)).toBe(true);
      expect(data.total).toBeDefined();
    });

    it('should require address', async () => {
      const response = await fetch('http://localhost/api/payment/history');
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/prizes/:gameType', () => {
    it('should return prize pool info', async () => {
      const response = await fetch('http://localhost/api/prizes/snake');

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.gameType).toBe('snake');
      expect(data.totalAmount).toBeDefined();
      expect(data.currency).toBe('USDC');
      expect(data.endTime).toBeDefined();
      expect(data.currentLeader).toBeDefined();
    });
  });
});

// ============================================================================
// ERROR HANDLER TESTS
// ============================================================================

describe('Error Handlers', () => {
  const server = setupServer(...errorHandlers);

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'bypass' });
  });

  afterEach(() => {
    server.resetHandlers();
    clearErrorSimulations();
  });

  afterAll(() => {
    server.close();
  });

  describe('GET /api/health', () => {
    it('should return healthy status', async () => {
      const response = await fetch('http://localhost/api/health');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
    });
  });

  describe('Error endpoints', () => {
    it('should return 500 error', async () => {
      const response = await fetch('http://localhost/api/error/500');
      expect(response.status).toBe(500);
    });

    it('should return 401 error', async () => {
      const response = await fetch('http://localhost/api/error/401');
      expect(response.status).toBe(401);
    });

    it('should return 403 error', async () => {
      const response = await fetch('http://localhost/api/error/403');
      expect(response.status).toBe(403);
    });

    it('should return 404 error', async () => {
      const response = await fetch('http://localhost/api/error/404');
      expect(response.status).toBe(404);
    });

    it('should return 429 rate limit error', async () => {
      const response = await fetch('http://localhost/api/error/429');
      expect(response.status).toBe(429);
      expect(response.headers.get('retry-after')).toBe('60');
    });
  });

  describe('Slow endpoint', () => {
    it('should delay response', async () => {
      const start = Date.now();
      const response = await fetch('http://localhost/api/slow?delay=100');
      const elapsed = Date.now() - start;

      expect(response.status).toBe(200);
      // Allow some tolerance
      expect(elapsed).toBeGreaterThanOrEqual(90);
    });
  });
});

// ============================================================================
// ERROR SIMULATION TESTS
// ============================================================================

describe('Error Simulation', () => {
  const server = setupServer(...errorHandlers);

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'bypass' });
  });

  afterEach(() => {
    server.resetHandlers();
    clearErrorSimulations();
  });

  afterAll(() => {
    server.close();
  });

  it('should simulate server error', async () => {
    simulateError({
      endpoint: '/api/health',
      method: 'get',
      errorType: 'server',
      statusCode: 500,
      errorMessage: 'Simulated server error',
    });

    const response = await fetch('http://localhost/api/health');
    expect(response.status).toBe(500);
  });

  it('should simulate network error', async () => {
    simulateError({
      endpoint: '/api/health',
      method: 'get',
      errorType: 'network',
    });

    await expect(fetch('http://localhost/api/health')).rejects.toThrow('Failed to fetch');
  });
});

// ============================================================================
// SCENARIO HANDLER TESTS
// ============================================================================

describe('Scenario Handler Sets', () => {
  describe('Unauthenticated Handlers', () => {
    const server = setupServer(...unauthenticatedHandlers);

    beforeAll(() => {
      server.listen({ onUnhandledRequest: 'bypass' });
    });

    afterAll(() => {
      server.close();
    });

    it('should return 401 for verify', async () => {
      const response = await fetch(`http://localhost/api/auth/verify?address=${generateAddress()}`);
      expect(response.status).toBe(401);
    });

    it('should return 401 for play', async () => {
      const response = await fetch('http://localhost/api/play', { method: 'POST' });
      expect(response.status).toBe(401);
    });
  });

  describe('Payment Failure Handlers', () => {
    const server = setupServer(...paymentFailureHandlers);

    beforeAll(() => {
      server.listen({ onUnhandledRequest: 'bypass' });
    });

    afterAll(() => {
      server.close();
    });

    it('should return payment verification failure', async () => {
      const response = await fetch('http://localhost/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionHash: generateTxHash() }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.valid).toBe(false);
    });
  });

  describe('Insufficient Funds Handlers', () => {
    const server = setupServer(...insufficientFundsHandlers);

    beforeAll(() => {
      server.listen({ onUnhandledRequest: 'bypass' });
    });

    afterAll(() => {
      server.close();
    });

    it('should return insufficient funds error', async () => {
      const response = await fetch('http://localhost/api/play', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Payment': 'mock-payment',
        },
        body: JSON.stringify({ gameType: 'snake' }),
      });

      expect(response.status).toBe(402);
      const data = await response.json();
      expect(data.errorCode).toBe('INSUFFICIENT_BALANCE');
    });
  });

  describe('Maintenance Mode Handlers', () => {
    const server = setupServer(...maintenanceModeHandlers);

    beforeAll(() => {
      server.listen({ onUnhandledRequest: 'bypass' });
    });

    afterAll(() => {
      server.close();
    });

    it('should return maintenance mode response', async () => {
      const response = await fetch('http://localhost/api/health');

      expect(response.status).toBe(503);
      const data = await response.json();
      expect(data.status).toBe('maintenance');
      expect(data.estimatedEndTime).toBeDefined();
    });
  });
});

// ============================================================================
// COMBINED HANDLERS TEST
// ============================================================================

describe('Combined Handlers', () => {
  const server = setupServer(...handlers);

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'bypass' });
  });

  afterEach(() => {
    server.resetHandlers();
    resetAllMockState();
  });

  afterAll(() => {
    server.close();
  });

  it('should have all handler categories', () => {
    expect(handlers.length).toBeGreaterThan(0);
    expect(authHandlers.length).toBeGreaterThan(0);
    expect(gameHandlers.length).toBeGreaterThan(0);
    expect(leaderboardHandlers.length).toBeGreaterThan(0);
    expect(paymentHandlers.length).toBeGreaterThan(0);
    expect(errorHandlers.length).toBeGreaterThan(0);
  });

  it('should handle full game flow', async () => {
    const address = generateAddress();

    // 1. Get nonce
    const nonceRes = await fetch(`http://localhost/api/auth/nonce?address=${address}`);
    expect(nonceRes.status).toBe(200);

    // 2. Login
    const loginRes = await fetch('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, signature: '0xsig' }),
    });
    expect(loginRes.status).toBe(200);

    // 3. Initiate payment
    const paymentRes = await fetch('http://localhost/api/payment/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameType: 'snake' }),
    });
    expect(paymentRes.status).toBe(200);

    // 4. Start game (with payment)
    const playRes = await fetch('http://localhost/api/play', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Payment': 'mock-payment',
      },
      body: JSON.stringify({ gameType: 'snake' }),
    });
    expect(playRes.status).toBe(201);
    const { session } = await playRes.json();

    // 5. Complete game
    const completeRes = await fetch(`http://localhost/api/sessions/${session.id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: 1234 }),
    });
    expect(completeRes.status).toBe(200);

    // 6. Submit to leaderboard
    const submitRes = await fetch('http://localhost/api/leaderboard/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: session.id,
        gameType: 'snake',
        score: 1234,
        playerAddress: address,
      }),
    });
    expect(submitRes.status).toBe(201);

    // 7. Check leaderboard
    const leaderboardRes = await fetch('http://localhost/api/leaderboard/snake');
    expect(leaderboardRes.status).toBe(200);
  });
});
