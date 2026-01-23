/**
 * Integration Test Harness
 *
 * Provides a comprehensive test harness for full-stack integration testing.
 * This harness manages the complete test environment including:
 * - Express application with all middleware and routes
 * - In-memory SQLite database
 * - Mock x402 facilitator server
 * - Mock blockchain RPC provider
 * - Test API client with authentication helpers
 *
 * @example
 * ```typescript
 * import { IntegrationTestHarness, createHarness } from '../integration/harness';
 *
 * describe('Feature Integration Tests', () => {
 *   let harness: IntegrationTestHarness;
 *
 *   beforeAll(async () => {
 *     harness = createHarness();
 *     await harness.setup();
 *   });
 *
 *   afterAll(async () => {
 *     await harness.teardown();
 *   });
 *
 *   beforeEach(async () => {
 *     await harness.reset();
 *   });
 *
 *   it('should process payment and start game', async () => {
 *     const client = harness.getClient();
 *     const response = await client.post('/api/play')
 *       .withPayment('0.01')
 *       .send({ game_type: 'snake' });
 *
 *     expect(response.status).toBe(200);
 *   });
 * });
 * ```
 */

import express, { Express, Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import cors from 'cors';
import supertest, { SuperTest, Test } from 'supertest';
import {
  loadTestEnv,
  resetTestEnv,
  getRequiredEnv,
  getEnvNumber,
  getEnvBoolean,
  TEST_ENV,
} from '../utils/env-helpers';
import {
  clearAllTables,
  clearMockServers,
  cleanupTimers,
  registerMockServer,
  type DatabaseConnection,
  type MockServer,
} from '../utils/cleanup-helpers';
import {
  MockFacilitatorServer,
  createTestFacilitatorServer,
} from '../mocks/facilitator-mock';
import {
  MockWeb3Provider,
  createTestProvider,
  CRONOS_TESTNET,
} from '../mocks/blockchain-mock';

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration options for the test harness.
 */
export interface HarnessConfig {
  /** Enable request logging for debugging (default: false) */
  enableLogging?: boolean;
  /** Use in-memory database (default: true) */
  useInMemoryDb?: boolean;
  /** Auto-reset database between tests (default: true) */
  autoResetDb?: boolean;
  /** Enable mock facilitator server (default: true) */
  enableFacilitatorMock?: boolean;
  /** Enable mock blockchain provider (default: true) */
  enableBlockchainMock?: boolean;
  /** Custom middleware to inject */
  customMiddleware?: express.RequestHandler[];
  /** Facilitator mock configuration */
  facilitatorConfig?: {
    defaultSuccessful?: boolean;
    latencyMs?: number;
  };
  /** Blockchain mock configuration */
  blockchainConfig?: {
    chainId?: number;
    blockNumber?: number;
  };
}

/**
 * API client with convenience methods.
 */
export interface HarnessClient {
  /** Base supertest agent */
  agent: SuperTest<Test>;

  /** Make authenticated GET request */
  get: (path: string) => ChainableRequest;

  /** Make authenticated POST request */
  post: (path: string) => ChainableRequest;

  /** Make authenticated PUT request */
  put: (path: string) => ChainableRequest;

  /** Make authenticated DELETE request */
  delete: (path: string) => ChainableRequest;

  /** Set wallet address for subsequent requests */
  asWallet: (address: string) => HarnessClient;

  /** Set admin context */
  asAdmin: () => HarnessClient;

  /** Set player context */
  asPlayer: (address?: string) => HarnessClient;

  /** Clear authentication context */
  asGuest: () => HarnessClient;
}

/**
 * Chainable request builder.
 */
export interface ChainableRequest {
  /** Add x402 payment header */
  withPayment: (amountUsdc: string, options?: PaymentHeaderOptions) => ChainableRequest;

  /** Add authorization header */
  withAuth: (address?: string) => ChainableRequest;

  /** Add custom header */
  withHeader: (name: string, value: string) => ChainableRequest;

  /** Set request body */
  send: (body: unknown) => Promise<supertest.Response>;

  /** Execute request without body */
  execute: () => Promise<supertest.Response>;
}

/**
 * Options for generating payment headers.
 */
export interface PaymentHeaderOptions {
  /** Override sender address */
  fromAddress?: string;
  /** Override recipient address */
  toAddress?: string;
  /** Override nonce */
  nonce?: string;
  /** Override expiration */
  validAfter?: number;
  validBefore?: number;
}

/**
 * Harness state tracking.
 */
export interface HarnessState {
  isSetup: boolean;
  testCount: number;
  currentWallet: string | null;
  dbRowCounts: Record<string, number>;
}

/**
 * Request log entry for debugging.
 */
export interface RequestLogEntry {
  timestamp: Date;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  body?: unknown;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_HARNESS_CONFIG: Required<HarnessConfig> = {
  enableLogging: false,
  useInMemoryDb: true,
  autoResetDb: true,
  enableFacilitatorMock: true,
  enableBlockchainMock: true,
  customMiddleware: [],
  facilitatorConfig: {
    defaultSuccessful: true,
    latencyMs: 0,
  },
  blockchainConfig: {
    chainId: 338, // Cronos testnet
    blockNumber: 1000000,
  },
};

/** Test wallet addresses */
export const TEST_WALLETS = {
  admin: '0xADM1N000000000000000000000000000000000000',
  player1: '0xPLAYER1000000000000000000000000000000001',
  player2: '0xPLAYER2000000000000000000000000000000002',
  player3: '0xPLAYER3000000000000000000000000000000003',
  arcade: '0xARCADE0000000000000000000000000000000000',
};

// ============================================================================
// Mock Database (In-Memory)
// ============================================================================

/**
 * Create an in-memory mock database.
 */
function createMockDatabase(): DatabaseConnection & { _data: Map<string, unknown[]> } {
  const _data = new Map<string, unknown[]>();
  let _closed = false;

  // Initialize tables
  const tables = ['game_sessions', 'leaderboard_entries', 'prize_pools', 'payments'];
  tables.forEach(t => _data.set(t, []));

  return {
    _data,
    exec(sql: string) {
      if (_closed) throw new Error('Database is closed');

      const deleteMatch = sql.match(/DELETE FROM (\w+)/i);
      if (deleteMatch) {
        const tableName = deleteMatch[1];
        if (tableName === 'sqlite_sequence') return;
        if (!_data.has(tableName)) throw new Error(`no such table: ${tableName}`);
        _data.set(tableName, []);
        return;
      }

      if (sql.includes('PRAGMA')) return;
    },
    prepare(sql: string) {
      if (_closed) throw new Error('Database is closed');

      const deleteMatch = sql.match(/DELETE FROM (\w+)/i);
      const countMatch = sql.match(/SELECT COUNT\(\*\) as count FROM (\w+)/i);
      const insertMatch = sql.match(/INSERT INTO (\w+)/i);
      const selectMatch = sql.match(/SELECT .+ FROM (\w+)/i);

      return {
        run: (...args: unknown[]) => {
          if (deleteMatch) {
            const tableName = deleteMatch[1];
            const data = _data.get(tableName);
            const changes = data?.length ?? 0;
            _data.set(tableName, []);
            return { changes };
          }
          if (insertMatch) {
            const tableName = insertMatch[1];
            const data = _data.get(tableName) ?? [];
            data.push(args[0] ?? {});
            _data.set(tableName, data);
            return { changes: 1 };
          }
          return { changes: 0 };
        },
        get: (..._args: unknown[]) => {
          if (countMatch) {
            const tableName = countMatch[1];
            const data = _data.get(tableName);
            return { count: data?.length ?? 0 };
          }
          if (selectMatch) {
            const tableName = selectMatch[1];
            const data = _data.get(tableName);
            return data?.[0] ?? null;
          }
          return null;
        },
        all: (..._args: unknown[]) => {
          if (selectMatch) {
            const tableName = selectMatch[1];
            return _data.get(tableName) ?? [];
          }
          return [];
        },
      };
    },
    close() {
      _closed = true;
    },
    pragma(_key: string) {
      return null;
    },
  };
}

// ============================================================================
// Integration Test Harness Class
// ============================================================================

/**
 * Integration Test Harness for full-stack testing.
 *
 * Manages the complete test environment with automatic setup and cleanup.
 */
export class IntegrationTestHarness {
  private config: Required<HarnessConfig>;
  private app: Express | null = null;
  private db: DatabaseConnection | null = null;
  private facilitatorMock: MockFacilitatorServer | null = null;
  private blockchainMock: MockWeb3Provider | null = null;
  private requestLog: RequestLogEntry[] = [];
  private state: HarnessState = {
    isSetup: false,
    testCount: 0,
    currentWallet: null,
    dbRowCounts: {},
  };

  constructor(config: HarnessConfig = {}) {
    this.config = { ...DEFAULT_HARNESS_CONFIG, ...config };
  }

  // ==========================================================================
  // Lifecycle Methods
  // ==========================================================================

  /**
   * Set up the test harness.
   *
   * Initializes all components:
   * - Loads test environment variables
   * - Creates Express application
   * - Initializes in-memory database
   * - Starts mock servers
   *
   * @returns Promise that resolves when setup is complete
   */
  async setup(): Promise<void> {
    if (this.state.isSetup) {
      console.warn('Harness already set up. Call reset() instead.');
      return;
    }

    // Load test environment
    loadTestEnv();

    // Create Express app
    this.app = this.createApp();

    // Initialize database
    if (this.config.useInMemoryDb) {
      this.db = createMockDatabase();
    }

    // Initialize mock facilitator
    if (this.config.enableFacilitatorMock) {
      this.facilitatorMock = createTestFacilitatorServer({
        defaultSuccessful: this.config.facilitatorConfig.defaultSuccessful,
        latency: this.config.facilitatorConfig.latencyMs,
      });
      registerMockServer({
        name: 'facilitator',
        cleanup: () => this.facilitatorMock?.reset(),
        isActive: () => this.facilitatorMock !== null,
      });
    }

    // Initialize mock blockchain
    if (this.config.enableBlockchainMock) {
      this.blockchainMock = createTestProvider({
        ...CRONOS_TESTNET,
        chainId: this.config.blockchainConfig.chainId,
      });
      registerMockServer({
        name: 'blockchain',
        cleanup: () => this.blockchainMock?.reset(),
        isActive: () => this.blockchainMock !== null,
      });
    }

    this.state.isSetup = true;
  }

  /**
   * Tear down the test harness.
   *
   * Cleans up all resources:
   * - Closes database connection
   * - Stops mock servers
   * - Resets environment variables
   * - Clears timers
   *
   * @returns Promise that resolves when teardown is complete
   */
  async teardown(): Promise<void> {
    if (!this.state.isSetup) {
      return;
    }

    // Clean up database
    if (this.db) {
      clearAllTables(this.db);
      this.db.close();
      this.db = null;
    }

    // Clean up mock servers
    clearMockServers();
    this.facilitatorMock = null;
    this.blockchainMock = null;

    // Clean up timers
    cleanupTimers();

    // Reset environment
    resetTestEnv();

    // Clear request log
    this.requestLog = [];

    // Reset state
    this.state = {
      isSetup: false,
      testCount: 0,
      currentWallet: null,
      dbRowCounts: {},
    };

    this.app = null;
  }

  /**
   * Reset the harness state between tests.
   *
   * Clears database, resets mocks, but keeps app running.
   *
   * @returns Promise that resolves when reset is complete
   */
  async reset(): Promise<void> {
    if (!this.state.isSetup) {
      await this.setup();
      return;
    }

    // Clear database
    if (this.db) {
      clearAllTables(this.db);
    }

    // Reset mock servers
    if (this.facilitatorMock) {
      this.facilitatorMock.reset();
    }
    if (this.blockchainMock) {
      this.blockchainMock.reset();
    }

    // Clear request log
    this.requestLog = [];

    // Update state
    this.state.testCount++;
    this.state.currentWallet = null;
    this.state.dbRowCounts = {};
  }

  // ==========================================================================
  // Client Methods
  // ==========================================================================

  /**
   * Get a configured API client for making requests.
   *
   * @returns API client with convenience methods
   */
  getClient(): HarnessClient {
    if (!this.app) {
      throw new Error('Harness not set up. Call setup() first.');
    }

    const agent = supertest(this.app);
    let currentWallet: string | null = this.state.currentWallet;

    const makeRequest = (method: 'get' | 'post' | 'put' | 'delete', path: string): ChainableRequest => {
      const headers: Record<string, string> = {};
      let paymentHeader: string | null = null;

      const chainable: ChainableRequest = {
        withPayment: (amountUsdc: string, options?: PaymentHeaderOptions) => {
          paymentHeader = this.createPaymentHeader(amountUsdc, options);
          headers['X-Payment'] = paymentHeader;
          return chainable;
        },
        withAuth: (address?: string) => {
          const wallet = address ?? currentWallet ?? TEST_WALLETS.player1;
          headers['X-Wallet-Address'] = wallet;
          return chainable;
        },
        withHeader: (name: string, value: string) => {
          headers[name] = value;
          return chainable;
        },
        send: async (body: unknown) => {
          const start = Date.now();
          let req = agent[method](path);

          // Apply headers
          for (const [name, value] of Object.entries(headers)) {
            req = req.set(name, value);
          }

          const response = await req.send(body);

          // Log request
          this.logRequest(method.toUpperCase(), path, response.status, Date.now() - start, body);

          return response;
        },
        execute: async () => {
          const start = Date.now();
          let req = agent[method](path);

          // Apply headers
          for (const [name, value] of Object.entries(headers)) {
            req = req.set(name, value);
          }

          const response = await req;

          // Log request
          this.logRequest(method.toUpperCase(), path, response.status, Date.now() - start);

          return response;
        },
      };

      return chainable;
    };

    const client: HarnessClient = {
      agent,
      get: (path: string) => makeRequest('get', path),
      post: (path: string) => makeRequest('post', path),
      put: (path: string) => makeRequest('put', path),
      delete: (path: string) => makeRequest('delete', path),
      asWallet: (address: string) => {
        currentWallet = address;
        this.state.currentWallet = address;
        return client;
      },
      asAdmin: () => {
        currentWallet = TEST_WALLETS.admin;
        this.state.currentWallet = TEST_WALLETS.admin;
        return client;
      },
      asPlayer: (address?: string) => {
        currentWallet = address ?? TEST_WALLETS.player1;
        this.state.currentWallet = currentWallet;
        return client;
      },
      asGuest: () => {
        currentWallet = null;
        this.state.currentWallet = null;
        return client;
      },
    };

    return client;
  }

  /**
   * Get the raw Express app for direct access.
   */
  getApp(): Express {
    if (!this.app) {
      throw new Error('Harness not set up. Call setup() first.');
    }
    return this.app;
  }

  /**
   * Get the database connection.
   */
  getDatabase(): DatabaseConnection | null {
    return this.db;
  }

  /**
   * Get the mock facilitator server.
   */
  getFacilitatorMock(): MockFacilitatorServer | null {
    return this.facilitatorMock;
  }

  /**
   * Get the mock blockchain provider.
   */
  getBlockchainMock(): MockWeb3Provider | null {
    return this.blockchainMock;
  }

  /**
   * Get the request log for debugging.
   */
  getRequestLog(): RequestLogEntry[] {
    return [...this.requestLog];
  }

  /**
   * Get the current harness state.
   */
  getState(): HarnessState {
    return { ...this.state };
  }

  // ==========================================================================
  // Mock Configuration Methods
  // ==========================================================================

  /**
   * Configure facilitator mock to fail settlements.
   */
  setFacilitatorToFail(errorCode: string = 'INSUFFICIENT_FUNDS'): void {
    if (this.facilitatorMock) {
      // Use setAlwaysFail with the error code cast to expected type
      this.facilitatorMock.setAlwaysFail(errorCode as any);
    }
  }

  /**
   * Configure facilitator mock to succeed (clear error state).
   */
  setFacilitatorToSucceed(_txHash?: string): void {
    if (this.facilitatorMock) {
      // Clear any forced failure mode
      this.facilitatorMock.setAlwaysFail(null);
    }
  }

  /**
   * Configure blockchain mock to return specific block number.
   */
  setBlockNumber(blockNumber: number): void {
    if (this.blockchainMock) {
      this.blockchainMock.setBlockNumber(blockNumber);
    }
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Create the Express application with all middleware.
   */
  private createApp(): Express {
    const app = express();

    // Standard middleware
    app.use(cors({ origin: '*' }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Custom middleware
    for (const middleware of this.config.customMiddleware) {
      app.use(middleware);
    }

    // Request logging (if enabled)
    if (this.config.enableLogging) {
      app.use((req: Request, _res: Response, next: NextFunction) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
        next();
      });
    }

    // Health check endpoint
    app.get('/health', (_req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // API info endpoint
    app.get('/api', (_req: Request, res: Response) => {
      res.json({
        name: 'x402Arcade API',
        version: '0.1.0',
        environment: 'test',
        message: 'Insert a Penny, Play for Glory',
      });
    });

    // Game play endpoint (mock)
    app.post('/api/play', (req: Request, res: Response) => {
      const paymentHeader = req.headers['x-payment'];

      if (!paymentHeader) {
        return res.status(402).json({
          error: 'Payment Required',
          requirements: {
            amount: req.body?.game_type === 'tetris' ? '0.02' : '0.01',
            currency: 'USDC',
            recipient: TEST_WALLETS.arcade,
          },
        });
      }

      // Validate payment header
      if (typeof paymentHeader !== 'string' || paymentHeader.length < 10) {
        return res.status(400).json({ error: 'Invalid payment header' });
      }

      res.json({
        success: true,
        session_id: `session_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        game_type: req.body?.game_type ?? 'snake',
        message: 'Game started!',
      });
    });

    // Score submission endpoint (mock)
    app.post('/api/score', (req: Request, res: Response) => {
      const { session_id, score } = req.body ?? {};

      if (!session_id || typeof score !== 'number') {
        return res.status(400).json({ error: 'Invalid request' });
      }

      res.json({
        success: true,
        session_id,
        score,
        rank: Math.floor(Math.random() * 100) + 1,
      });
    });

    // Leaderboard endpoint (mock)
    app.get('/api/leaderboard', (req: Request, res: Response) => {
      const { game_type = 'snake', period = 'daily' } = req.query;

      res.json({
        game_type,
        period,
        entries: [
          { rank: 1, player_address: TEST_WALLETS.player1, score: 1000 },
          { rank: 2, player_address: TEST_WALLETS.player2, score: 900 },
          { rank: 3, player_address: TEST_WALLETS.player3, score: 800 },
        ],
      });
    });

    // 404 handler
    app.use((_req: Request, res: Response) => {
      res.status(404).json({ error: 'Not Found' });
    });

    // Error handler
    app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Error:', err);
      res.status(500).json({ error: err.message ?? 'Internal Server Error' });
    });

    return app;
  }

  /**
   * Create a mock x402 payment header.
   */
  private createPaymentHeader(amountUsdc: string, options?: PaymentHeaderOptions): string {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      version: '1',
      amount: amountUsdc,
      currency: 'USDC',
      from: options?.fromAddress ?? this.state.currentWallet ?? TEST_WALLETS.player1,
      to: options?.toAddress ?? TEST_WALLETS.arcade,
      nonce: options?.nonce ?? `nonce_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      validAfter: options?.validAfter ?? now,
      validBefore: options?.validBefore ?? now + 3600,
      signature: `0x${'0'.repeat(130)}`,
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Log a request for debugging.
   */
  private logRequest(
    method: string,
    path: string,
    status: number,
    durationMs: number,
    body?: unknown
  ): void {
    this.requestLog.push({
      timestamp: new Date(),
      method,
      path,
      status,
      durationMs,
      body,
    });

    if (this.config.enableLogging) {
      console.log(`[${method}] ${path} -> ${status} (${durationMs}ms)`);
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new integration test harness.
 *
 * @param config - Optional configuration
 * @returns New IntegrationTestHarness instance
 */
export function createHarness(config?: HarnessConfig): IntegrationTestHarness {
  return new IntegrationTestHarness(config);
}

/**
 * Create a harness and automatically set it up.
 *
 * @param config - Optional configuration
 * @returns Promise resolving to set up harness
 */
export async function createSetupHarness(config?: HarnessConfig): Promise<IntegrationTestHarness> {
  const harness = createHarness(config);
  await harness.setup();
  return harness;
}

// ============================================================================
// Jest Integration Helpers
// ============================================================================

/**
 * Create Jest setup/teardown hooks for integration tests.
 *
 * @param config - Optional harness configuration
 * @returns Object with beforeAll, afterAll, beforeEach, afterEach, and harness getter
 *
 * @example
 * ```typescript
 * const { beforeAll, afterAll, beforeEach, getHarness } = createIntegrationTestSetup();
 *
 * beforeAll(setupFn);
 * afterAll(teardownFn);
 * beforeEach(resetFn);
 *
 * it('should work', () => {
 *   const harness = getHarness();
 *   const client = harness.getClient();
 *   // ...
 * });
 * ```
 */
export function createIntegrationTestSetup(config?: HarnessConfig) {
  let harness: IntegrationTestHarness;

  return {
    beforeAll: async () => {
      harness = createHarness(config);
      await harness.setup();
    },
    afterAll: async () => {
      if (harness) {
        await harness.teardown();
      }
    },
    beforeEach: async () => {
      if (harness) {
        await harness.reset();
      }
    },
    afterEach: () => {
      // Additional cleanup if needed
    },
    getHarness: () => {
      if (!harness || !harness.getState().isSetup) {
        throw new Error('Harness not set up. Ensure beforeAll has been called.');
      }
      return harness;
    },
  };
}
