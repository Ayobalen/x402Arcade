/**
 * Supertest Setup for x402Arcade API Testing
 *
 * Provides a configured Express test app and utilities for HTTP assertion testing.
 * Uses supertest for making HTTP requests to the Express app without starting a server.
 *
 * @example
 * ```typescript
 * import { getTestApp, request, createAuthenticatedRequest } from '../setup/supertest-setup';
 *
 * describe('API Tests', () => {
 *   it('should return health status', async () => {
 *     const response = await request(getTestApp()).get('/health');
 *     expect(response.status).toBe(200);
 *     expect(response.body.status).toBe('ok');
 *   });
 * });
 * ```
 */

import express, { Express, Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import supertest, { SuperTest, Test } from 'supertest';
import { jest } from '@jest/globals';

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration options for the test app.
 */
export interface TestAppConfig {
  /** Enable request/response logging (default: false in tests) */
  enableLogging?: boolean;
  /** Custom CORS origin (default: '*') */
  corsOrigin?: string;
  /** Enable helmet security headers (default: false in tests) */
  enableHelmet?: boolean;
  /** Custom middleware to add before routes */
  middleware?: express.RequestHandler[];
  /** Custom routes to add */
  routes?: Array<{
    method: 'get' | 'post' | 'put' | 'patch' | 'delete';
    path: string;
    handler: express.RequestHandler;
  }>;
  /** Custom error handler */
  errorHandler?: ErrorRequestHandler;
}

/**
 * Request log entry for debugging.
 */
export interface RequestLogEntry {
  timestamp: Date;
  method: string;
  path: string;
  query: Record<string, unknown>;
  body: unknown;
  headers: Record<string, string | string[] | undefined>;
  responseStatus?: number;
  responseBody?: unknown;
  durationMs?: number;
}

// ============================================================================
// Request Logger
// ============================================================================

/** Global request log for debugging test failures */
let requestLog: RequestLogEntry[] = [];

/**
 * Get all logged requests.
 */
export function getRequestLog(): RequestLogEntry[] {
  return [...requestLog];
}

/**
 * Clear the request log.
 */
export function clearRequestLog(): void {
  requestLog = [];
}

/**
 * Get the last logged request.
 */
export function getLastRequest(): RequestLogEntry | undefined {
  return requestLog[requestLog.length - 1];
}

/**
 * Middleware that logs requests and responses for debugging.
 */
function createLoggingMiddleware(): express.RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    let logged = false;

    const entry: RequestLogEntry = {
      timestamp: new Date(),
      method: req.method,
      path: req.path,
      query: req.query as Record<string, unknown>,
      body: req.body,
      headers: req.headers as Record<string, string | string[] | undefined>,
    };

    const logEntry = (body: unknown, isJson: boolean) => {
      if (logged) return; // Prevent double-logging
      logged = true;
      entry.responseStatus = res.statusCode;
      // Store JSON objects directly, parse strings if they look like JSON
      if (isJson) {
        entry.responseBody = body;
      } else if (typeof body === 'string') {
        try {
          entry.responseBody = JSON.parse(body);
        } catch {
          entry.responseBody = body;
        }
      } else {
        entry.responseBody = body;
      }
      entry.durationMs = Date.now() - startTime;
      requestLog.push(entry);
    };

    // Capture response data
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    res.json = function (body: unknown) {
      logEntry(body, true);
      return originalJson(body);
    };

    res.send = function (body: unknown) {
      logEntry(body, false);
      return originalSend(body);
    };

    next();
  };
}

// ============================================================================
// Test App Factory
// ============================================================================

/**
 * Default error handler for test app.
 */
const defaultErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

/**
 * Create a configured Express test app.
 *
 * @param config - Configuration options
 * @returns Configured Express application
 *
 * @example
 * ```typescript
 * // Basic test app
 * const app = createTestApp();
 *
 * // With custom routes
 * const app = createTestApp({
 *   routes: [
 *     { method: 'get', path: '/test', handler: (req, res) => res.json({ ok: true }) }
 *   ]
 * });
 * ```
 */
export function createTestApp(config: TestAppConfig = {}): Express {
  const app = express();

  // Security middleware (disabled by default in tests for simplicity)
  if (config.enableHelmet) {
    app.use(helmet());
  }

  // CORS
  app.use(
    cors({
      origin: config.corsOrigin || '*',
      credentials: true,
    })
  );

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging (always enabled for test debugging)
  app.use(createLoggingMiddleware());

  // Console logging (optional)
  if (config.enableLogging) {
    app.use((req, _res, next) => {
      console.log(`[TEST] ${req.method} ${req.path}`);
      next();
    });
  }

  // Custom middleware
  if (config.middleware) {
    config.middleware.forEach((mw) => app.use(mw));
  }

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API info endpoint
  app.get('/api', (_req, res) => {
    res.json({
      name: 'x402Arcade API',
      version: '0.1.0',
      environment: 'test',
      message: 'Insert a Penny, Play for Glory',
    });
  });

  // Custom routes
  if (config.routes) {
    config.routes.forEach(({ method, path, handler }) => {
      app[method](path, handler);
    });
  }

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      error: 'Not Found',
      code: 'NOT_FOUND',
    });
  });

  // Error handler
  app.use(config.errorHandler || defaultErrorHandler);

  return app;
}

// ============================================================================
// Singleton Test App
// ============================================================================

let testApp: Express | null = null;

/**
 * Get the singleton test app instance.
 * Creates a new instance if one doesn't exist.
 *
 * @param config - Optional configuration (only used on first call)
 * @returns The test Express application
 *
 * @example
 * ```typescript
 * const app = getTestApp();
 * const response = await request(app).get('/health');
 * ```
 */
export function getTestApp(config?: TestAppConfig): Express {
  if (!testApp) {
    testApp = createTestApp(config);
  }
  return testApp;
}

/**
 * Reset the singleton test app.
 * Use this in beforeEach/afterEach to get a clean app.
 */
export function resetTestApp(): void {
  testApp = null;
  clearRequestLog();
}

// ============================================================================
// Supertest Helpers
// ============================================================================

/**
 * Re-export supertest's request function for convenience.
 */
export { default as request } from 'supertest';

/**
 * Create a supertest agent bound to the test app.
 *
 * @param app - Optional custom app (defaults to singleton)
 * @returns Supertest agent
 *
 * @example
 * ```typescript
 * const agent = createTestAgent();
 * await agent.get('/health').expect(200);
 * ```
 */
export function createTestAgent(app?: Express): SuperTest<Test> {
  return supertest(app || getTestApp());
}

// ============================================================================
// Request Builders with Authentication
// ============================================================================

/**
 * Create a request with X-Payment header for x402 testing.
 *
 * @param app - Express app
 * @param method - HTTP method
 * @param path - Request path
 * @param paymentHeader - Base64-encoded payment header
 * @returns Supertest request with payment header
 */
export function createPaymentRequest(
  app: Express,
  method: 'get' | 'post' | 'put' | 'delete',
  path: string,
  paymentHeader: string
): Test {
  const agent = supertest(app);
  return agent[method](path).set('X-Payment', paymentHeader);
}

/**
 * Create a request with wallet authentication header.
 *
 * @param app - Express app
 * @param method - HTTP method
 * @param path - Request path
 * @param walletAddress - Player's wallet address
 * @returns Supertest request with auth header
 */
export function createWalletAuthRequest(
  app: Express,
  method: 'get' | 'post' | 'put' | 'delete',
  path: string,
  walletAddress: string
): Test {
  const agent = supertest(app);
  return agent[method](path).set('X-Wallet-Address', walletAddress);
}

// ============================================================================
// Response Assertion Helpers
// ============================================================================

/**
 * Assert that a response is a successful JSON response.
 */
export function assertJsonSuccess(response: supertest.Response): void {
  expect(response.status).toBe(200);
  expect(response.type).toMatch(/json/);
}

/**
 * Assert that a response is a 201 Created response.
 */
export function assertCreated(response: supertest.Response): void {
  expect(response.status).toBe(201);
  expect(response.type).toMatch(/json/);
}

/**
 * Assert that a response is a 400 Bad Request response.
 */
export function assertBadRequest(
  response: supertest.Response,
  expectedError?: string
): void {
  expect(response.status).toBe(400);
  expect(response.type).toMatch(/json/);
  if (expectedError) {
    expect(response.body.error).toContain(expectedError);
  }
}

/**
 * Assert that a response is a 401 Unauthorized response.
 */
export function assertUnauthorized(response: supertest.Response): void {
  expect(response.status).toBe(401);
  expect(response.type).toMatch(/json/);
}

/**
 * Assert that a response is a 402 Payment Required response.
 */
export function assertPaymentRequired(response: supertest.Response): void {
  expect(response.status).toBe(402);
  expect(response.type).toMatch(/json/);
  expect(response.body).toHaveProperty('requirements');
}

/**
 * Assert that a response is a 403 Forbidden response.
 */
export function assertForbidden(response: supertest.Response): void {
  expect(response.status).toBe(403);
  expect(response.type).toMatch(/json/);
}

/**
 * Assert that a response is a 404 Not Found response.
 */
export function assertNotFound(response: supertest.Response): void {
  expect(response.status).toBe(404);
  expect(response.type).toMatch(/json/);
}

/**
 * Assert that a response is a 500 Internal Server Error response.
 */
export function assertInternalError(response: supertest.Response): void {
  expect(response.status).toBe(500);
  expect(response.type).toMatch(/json/);
}

// ============================================================================
// Test Data Helpers
// ============================================================================

/**
 * Common test wallet addresses.
 */
export const TEST_WALLETS = {
  player1: '0x1111111111111111111111111111111111111111',
  player2: '0x2222222222222222222222222222222222222222',
  player3: '0x3333333333333333333333333333333333333333',
  arcade: '0xA0CADE0000000000000000000000000000000001',
  facilitator: '0xFAC1110000000000000000000000000000000001',
};

/**
 * Create a mock game session request body.
 */
export function createGameSessionBody(
  gameType: 'snake' | 'tetris' = 'snake',
  playerAddress: string = TEST_WALLETS.player1
) {
  return {
    gameType,
    playerAddress,
  };
}

/**
 * Create a mock score submission request body.
 */
export function createScoreSubmissionBody(
  sessionId: string,
  score: number,
  playerAddress: string = TEST_WALLETS.player1
) {
  return {
    sessionId,
    score,
    playerAddress,
    gameDurationMs: Math.floor(Math.random() * 300000) + 30000, // 30s to 5min
  };
}

// ============================================================================
// Jest Integration
// ============================================================================

/**
 * Setup function to be called in beforeEach for API tests.
 * Clears request log and optionally resets the test app.
 *
 * @param resetApp - Whether to reset the test app instance
 */
export function setupApiTest(resetApp = false): void {
  clearRequestLog();
  if (resetApp) {
    resetTestApp();
  }
}

/**
 * Teardown function to be called in afterEach for API tests.
 * Logs failed requests for debugging.
 *
 * @param testFailed - Whether the current test failed
 */
export function teardownApiTest(testFailed = false): void {
  if (testFailed) {
    console.log('=== Request Log (for debugging) ===');
    getRequestLog().forEach((entry, i) => {
      console.log(`[${i}] ${entry.method} ${entry.path} -> ${entry.responseStatus}`);
      if (entry.responseBody) {
        console.log('    Response:', JSON.stringify(entry.responseBody, null, 2));
      }
    });
    console.log('===================================');
  }
}

/**
 * Create a Jest describe block with API test setup/teardown.
 *
 * @param name - Test suite name
 * @param fn - Test suite function
 *
 * @example
 * ```typescript
 * describeApiTest('Health Endpoint', () => {
 *   it('should return ok status', async () => {
 *     const response = await request(getTestApp()).get('/health');
 *     expect(response.status).toBe(200);
 *   });
 * });
 * ```
 */
export function describeApiTest(name: string, fn: () => void): void {
  describe(name, () => {
    beforeEach(() => {
      setupApiTest();
    });

    afterEach(() => {
      // Note: Can't easily detect test failure in Jest, so we always clear
      clearRequestLog();
    });

    fn();
  });
}
