/**
 * Integration Test Harness - Tests
 *
 * Tests for the IntegrationTestHarness class.
 */

import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import {
  IntegrationTestHarness,
  createHarness,
  createSetupHarness,
  createIntegrationTestSetup,
  TEST_WALLETS,
} from './harness';

// ============================================================================
// IntegrationTestHarness Tests
// ============================================================================

describe('IntegrationTestHarness', () => {
  let harness: IntegrationTestHarness;

  afterEach(async () => {
    if (harness) {
      await harness.teardown();
    }
  });

  describe('constructor', () => {
    it('should create harness with default config', () => {
      harness = new IntegrationTestHarness();

      expect(harness).toBeInstanceOf(IntegrationTestHarness);
      expect(harness.getState().isSetup).toBe(false);
    });

    it('should create harness with custom config', () => {
      harness = new IntegrationTestHarness({
        enableLogging: true,
        useInMemoryDb: false,
      });

      expect(harness).toBeInstanceOf(IntegrationTestHarness);
    });
  });

  describe('setup()', () => {
    it('should set up the harness', async () => {
      harness = createHarness();

      await harness.setup();

      expect(harness.getState().isSetup).toBe(true);
    });

    it('should initialize Express app', async () => {
      harness = createHarness();

      await harness.setup();

      expect(harness.getApp()).toBeDefined();
    });

    it('should initialize database', async () => {
      harness = createHarness({ useInMemoryDb: true });

      await harness.setup();

      expect(harness.getDatabase()).toBeDefined();
    });

    it('should initialize mock facilitator', async () => {
      harness = createHarness({ enableFacilitatorMock: true });

      await harness.setup();

      expect(harness.getFacilitatorMock()).toBeDefined();
    });

    it('should initialize mock blockchain', async () => {
      harness = createHarness({ enableBlockchainMock: true });

      await harness.setup();

      expect(harness.getBlockchainMock()).toBeDefined();
    });

    it('should warn if already set up', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      harness = createHarness();

      await harness.setup();
      await harness.setup(); // Second call

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('already set up'));
      warnSpy.mockRestore();
    });
  });

  describe('teardown()', () => {
    it('should clean up all resources', async () => {
      harness = createHarness();
      await harness.setup();

      await harness.teardown();

      expect(harness.getState().isSetup).toBe(false);
    });

    it('should be safe to call multiple times', async () => {
      harness = createHarness();
      await harness.setup();

      await harness.teardown();
      await harness.teardown(); // Should not throw

      expect(harness.getState().isSetup).toBe(false);
    });

    it('should be safe to call without setup', async () => {
      harness = createHarness();

      // Should not throw
      await harness.teardown();

      expect(harness.getState().isSetup).toBe(false);
    });
  });

  describe('reset()', () => {
    it('should clear database', async () => {
      harness = createHarness();
      await harness.setup();

      await harness.reset();

      const db = harness.getDatabase();
      expect(db).toBeDefined();
    });

    it('should increment test count', async () => {
      harness = createHarness();
      await harness.setup();

      expect(harness.getState().testCount).toBe(0);

      await harness.reset();
      expect(harness.getState().testCount).toBe(1);

      await harness.reset();
      expect(harness.getState().testCount).toBe(2);
    });

    it('should clear request log', async () => {
      harness = createHarness();
      await harness.setup();

      const client = harness.getClient();
      await client.get('/health').execute();
      expect(harness.getRequestLog().length).toBe(1);

      await harness.reset();

      expect(harness.getRequestLog().length).toBe(0);
    });

    it('should setup if not already set up', async () => {
      harness = createHarness();

      await harness.reset();

      expect(harness.getState().isSetup).toBe(true);
    });
  });

  describe('getClient()', () => {
    beforeEach(async () => {
      harness = createHarness();
      await harness.setup();
    });

    it('should throw if harness not set up', async () => {
      harness = createHarness();
      // Don't call setup

      expect(() => harness.getClient()).toThrow(/not set up/);
    });

    it('should return client with agent', async () => {
      const client = harness.getClient();

      expect(client.agent).toBeDefined();
    });

    it('should make GET requests', async () => {
      const client = harness.getClient();

      const response = await client.get('/health').execute();

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });

    it('should make POST requests', async () => {
      const client = harness.getClient();

      const response = await client
        .post('/api/play')
        .withPayment('0.01')
        .send({ game_type: 'snake' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle payment required responses', async () => {
      const client = harness.getClient();

      const response = await client.post('/api/play').send({ game_type: 'snake' });

      expect(response.status).toBe(402);
      expect(response.body.error).toBe('Payment Required');
    });

    it('should set wallet context with asWallet()', async () => {
      const client = harness.getClient();
      const customWallet = '0xCUSTOM_WALLET_ADDRESS_000000000000000';

      client.asWallet(customWallet);

      expect(harness.getState().currentWallet).toBe(customWallet);
    });

    it('should set admin context with asAdmin()', async () => {
      const client = harness.getClient();

      client.asAdmin();

      expect(harness.getState().currentWallet).toBe(TEST_WALLETS.admin);
    });

    it('should set player context with asPlayer()', async () => {
      const client = harness.getClient();

      client.asPlayer();

      expect(harness.getState().currentWallet).toBe(TEST_WALLETS.player1);
    });

    it('should set custom player with asPlayer(address)', async () => {
      const client = harness.getClient();

      client.asPlayer(TEST_WALLETS.player2);

      expect(harness.getState().currentWallet).toBe(TEST_WALLETS.player2);
    });

    it('should clear context with asGuest()', async () => {
      const client = harness.getClient();
      client.asPlayer();

      client.asGuest();

      expect(harness.getState().currentWallet).toBeNull();
    });

    it('should chain wallet methods', async () => {
      const client = harness.getClient();

      const result = client.asAdmin().asPlayer().asGuest();

      expect(result).toBe(client);
      expect(harness.getState().currentWallet).toBeNull();
    });

    it('should add custom headers', async () => {
      const client = harness.getClient();

      const response = await client
        .get('/health')
        .withHeader('X-Custom-Header', 'test-value')
        .execute();

      expect(response.status).toBe(200);
    });

    it('should log requests', async () => {
      const client = harness.getClient();

      await client.get('/health').execute();
      await client.get('/api').execute();

      const log = harness.getRequestLog();
      expect(log.length).toBe(2);
      expect(log[0].path).toBe('/health');
      expect(log[1].path).toBe('/api');
    });
  });

  describe('getApp()', () => {
    it('should throw if harness not set up', () => {
      harness = createHarness();

      expect(() => harness.getApp()).toThrow(/not set up/);
    });

    it('should return Express app', async () => {
      harness = createHarness();
      await harness.setup();

      const app = harness.getApp();

      expect(app).toBeDefined();
      expect(typeof app).toBe('function');
    });
  });
});

// ============================================================================
// Factory Functions Tests
// ============================================================================

describe('Factory Functions', () => {
  let harness: IntegrationTestHarness;

  afterEach(async () => {
    if (harness) {
      await harness.teardown();
    }
  });

  describe('createHarness()', () => {
    it('should create uninitialized harness', () => {
      harness = createHarness();

      expect(harness.getState().isSetup).toBe(false);
    });

    it('should accept configuration', () => {
      harness = createHarness({
        enableLogging: true,
        enableFacilitatorMock: false,
      });

      expect(harness).toBeInstanceOf(IntegrationTestHarness);
    });
  });

  describe('createSetupHarness()', () => {
    it('should create and setup harness', async () => {
      harness = await createSetupHarness();

      expect(harness.getState().isSetup).toBe(true);
    });

    it('should accept configuration', async () => {
      harness = await createSetupHarness({
        enableBlockchainMock: false,
      });

      expect(harness.getState().isSetup).toBe(true);
      expect(harness.getBlockchainMock()).toBeNull();
    });
  });
});

// ============================================================================
// Jest Integration Tests
// ============================================================================

describe('Jest Integration', () => {
  describe('createIntegrationTestSetup()', () => {
    it('should return setup/teardown hooks', () => {
      const setup = createIntegrationTestSetup();

      expect(typeof setup.beforeAll).toBe('function');
      expect(typeof setup.afterAll).toBe('function');
      expect(typeof setup.beforeEach).toBe('function');
      expect(typeof setup.afterEach).toBe('function');
      expect(typeof setup.getHarness).toBe('function');
    });

    it('should work as complete lifecycle', async () => {
      const setup = createIntegrationTestSetup();

      // Setup
      await setup.beforeAll();

      // Get harness
      const harness = setup.getHarness();
      expect(harness.getState().isSetup).toBe(true);

      // Reset between tests
      await setup.beforeEach();
      expect(harness.getState().testCount).toBe(1);

      // Run test
      const client = harness.getClient();
      const response = await client.get('/health').execute();
      expect(response.status).toBe(200);

      // Teardown
      await setup.afterAll();
      expect(harness.getState().isSetup).toBe(false);
    });

    it('should throw if getHarness called before setup', () => {
      const setup = createIntegrationTestSetup();

      expect(() => setup.getHarness()).toThrow(/not set up/);
    });
  });
});

// ============================================================================
// API Endpoint Tests (Example Integration Tests)
// ============================================================================

describe('Example Integration Tests', () => {
  let harness: IntegrationTestHarness;

  beforeAll(async () => {
    harness = createHarness();
    await harness.setup();
  });

  afterAll(async () => {
    await harness.teardown();
  });

  beforeEach(async () => {
    await harness.reset();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const client = harness.getClient();

      const response = await client.get('/health').execute();

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('API Info', () => {
    it('should return API information', async () => {
      const client = harness.getClient();

      const response = await client.get('/api').execute();

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('x402Arcade API');
      expect(response.body.version).toBe('0.1.0');
    });
  });

  describe('Game Play Flow', () => {
    it('should return 402 without payment', async () => {
      const client = harness.getClient();

      const response = await client.post('/api/play').send({ game_type: 'snake' });

      expect(response.status).toBe(402);
      expect(response.body.error).toBe('Payment Required');
      expect(response.body.requirements).toBeDefined();
      expect(response.body.requirements.amount).toBe('0.01');
    });

    it('should accept payment and start game', async () => {
      const client = harness.getClient().asPlayer();

      const response = await client
        .post('/api/play')
        .withPayment('0.01')
        .send({ game_type: 'snake' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.session_id).toBeDefined();
      expect(response.body.game_type).toBe('snake');
    });

    it('should handle tetris game with higher price', async () => {
      const client = harness.getClient().asPlayer();

      const response = await client
        .post('/api/play')
        .withPayment('0.02')
        .send({ game_type: 'tetris' });

      expect(response.status).toBe(200);
      expect(response.body.game_type).toBe('tetris');
    });
  });

  describe('Score Submission', () => {
    it('should accept valid score', async () => {
      const client = harness.getClient().asPlayer();

      const response = await client.post('/api/score').send({
        session_id: 'session_123',
        score: 500,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.score).toBe(500);
    });

    it('should reject invalid score submission', async () => {
      const client = harness.getClient().asPlayer();

      const response = await client.post('/api/score').send({
        session_id: 'session_123',
        // Missing score
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Leaderboard', () => {
    it('should return leaderboard entries', async () => {
      const client = harness.getClient();

      const response = await client.get('/api/leaderboard').execute();

      expect(response.status).toBe(200);
      expect(response.body.entries).toBeInstanceOf(Array);
      expect(response.body.entries.length).toBeGreaterThan(0);
    });

    it('should filter by game type', async () => {
      const client = harness.getClient();

      const response = await client
        .get('/api/leaderboard?game_type=tetris')
        .execute();

      expect(response.status).toBe(200);
      expect(response.body.game_type).toBe('tetris');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const client = harness.getClient();

      const response = await client.get('/unknown/route').execute();

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not Found');
    });
  });
});

// ============================================================================
// Request Logging Tests
// ============================================================================

describe('Request Logging', () => {
  let harness: IntegrationTestHarness;

  beforeAll(async () => {
    harness = createHarness();
    await harness.setup();
  });

  afterAll(async () => {
    await harness.teardown();
  });

  beforeEach(async () => {
    await harness.reset();
  });

  it('should log request method and path', async () => {
    const client = harness.getClient();

    await client.get('/health').execute();

    const log = harness.getRequestLog();
    expect(log[0].method).toBe('GET');
    expect(log[0].path).toBe('/health');
  });

  it('should log response status', async () => {
    const client = harness.getClient();

    await client.get('/health').execute();

    const log = harness.getRequestLog();
    expect(log[0].status).toBe(200);
  });

  it('should log request duration', async () => {
    const client = harness.getClient();

    await client.get('/health').execute();

    const log = harness.getRequestLog();
    expect(log[0].durationMs).toBeGreaterThanOrEqual(0);
  });

  it('should log timestamp', async () => {
    const client = harness.getClient();
    const before = new Date();

    await client.get('/health').execute();

    const log = harness.getRequestLog();
    const after = new Date();
    expect(log[0].timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(log[0].timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('should log request body for POST', async () => {
    const client = harness.getClient();
    const body = { game_type: 'snake' };

    await client.post('/api/play').withPayment('0.01').send(body);

    const log = harness.getRequestLog();
    expect(log[0].body).toEqual(body);
  });
});

// ============================================================================
// Mock Configuration Tests
// ============================================================================

describe('Mock Configuration', () => {
  let harness: IntegrationTestHarness;

  beforeAll(async () => {
    harness = createHarness();
    await harness.setup();
  });

  afterAll(async () => {
    await harness.teardown();
  });

  beforeEach(async () => {
    await harness.reset();
  });

  describe('setFacilitatorToFail()', () => {
    it('should configure facilitator to fail', () => {
      harness.setFacilitatorToFail('INSUFFICIENT_FUNDS');

      const mock = harness.getFacilitatorMock();
      expect(mock).toBeDefined();
      // The mock should now return failure on next settlement
    });
  });

  describe('setFacilitatorToSucceed()', () => {
    it('should configure facilitator to succeed', () => {
      const txHash = '0x' + '1'.repeat(64);
      harness.setFacilitatorToSucceed(txHash);

      const mock = harness.getFacilitatorMock();
      expect(mock).toBeDefined();
    });
  });

  describe('setBlockNumber()', () => {
    it('should configure blockchain block number', () => {
      harness.setBlockNumber(2000000);

      const mock = harness.getBlockchainMock();
      expect(mock).toBeDefined();
    });
  });
});
