/**
 * API Integration Tests
 *
 * Example tests demonstrating supertest usage for x402Arcade API testing.
 * These tests show how to use the supertest-setup utilities.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  getTestApp,
  createTestApp,
  createTestAgent,
  resetTestApp,
  getRequestLog,
  clearRequestLog,
  setupApiTest,
  assertJsonSuccess,
  assertNotFound,
  assertBadRequest,
  createPaymentRequest,
  createWalletAuthRequest,
  createGameSessionBody,
  createScoreSubmissionBody,
  TEST_WALLETS,
  type TestAppConfig,
} from '../setup/supertest-setup';
import request from 'supertest';

describe('API Integration Tests', () => {
  beforeEach(() => {
    setupApiTest(true); // Reset app for each test
  });

  afterEach(() => {
    clearRequestLog();
  });

  // ==========================================================================
  // Health Endpoint Tests
  // ==========================================================================

  describe('GET /health', () => {
    it('should return 200 OK with status', async () => {
      const response = await request(getTestApp()).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return valid ISO timestamp', async () => {
      const response = await request(getTestApp()).get('/health');

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });

    it('should be logged for debugging', async () => {
      // Clear and create fresh app for isolated logging
      clearRequestLog();
      const app = createTestApp();

      await request(app).get('/health');

      const log = getRequestLog();
      // Find the health endpoint log entry
      const healthLog = log.find((l) => l.path === '/health' && l.method === 'GET');
      expect(healthLog).toBeDefined();
      expect(healthLog?.method).toBe('GET');
      expect(healthLog?.path).toBe('/health');
      expect(healthLog?.responseStatus).toBe(200);
    });
  });

  // ==========================================================================
  // API Info Endpoint Tests
  // ==========================================================================

  describe('GET /api', () => {
    it('should return API info', async () => {
      const response = await request(getTestApp()).get('/api');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        name: 'x402Arcade API',
        version: '0.1.0',
        environment: 'test',
        message: 'Insert a Penny, Play for Glory',
      });
    });
  });

  // ==========================================================================
  // 404 Handling Tests
  // ==========================================================================

  describe('404 Not Found', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(getTestApp()).get('/unknown/route');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Not Found',
        code: 'NOT_FOUND',
      });
    });

    it('should return 404 with JSON content type', async () => {
      const response = await request(getTestApp()).get('/does-not-exist');

      assertNotFound(response);
    });
  });

  // ==========================================================================
  // Custom App Configuration Tests
  // ==========================================================================

  describe('createTestApp', () => {
    it('should create app with custom routes', async () => {
      const customApp = createTestApp({
        routes: [
          {
            method: 'get',
            path: '/custom',
            handler: (_req, res) => res.json({ custom: true }),
          },
        ],
      });

      const response = await request(customApp).get('/custom');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ custom: true });
    });

    it('should create app with custom middleware', async () => {
      const customApp = createTestApp({
        middleware: [
          (_req, res, next) => {
            res.setHeader('X-Custom-Header', 'test');
            next();
          },
        ],
      });

      const response = await request(customApp).get('/health');

      expect(response.headers['x-custom-header']).toBe('test');
    });

    it('should create app with custom error handler', async () => {
      const customApp = createTestApp({
        routes: [
          {
            method: 'get',
            path: '/error',
            handler: () => {
              throw new Error('Test error');
            },
          },
        ],
        errorHandler: (err, _req, res, _next) => {
          res.status(500).json({ customError: err.message });
        },
      });

      const response = await request(customApp).get('/error');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ customError: 'Test error' });
    });
  });

  // ==========================================================================
  // Test Agent Tests
  // ==========================================================================

  describe('createTestAgent', () => {
    it('should create a reusable test agent', async () => {
      const agent = createTestAgent();

      const response1 = await agent.get('/health');
      const response2 = await agent.get('/api');

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });
  });

  // ==========================================================================
  // Request Logging Tests
  // ==========================================================================

  describe('Request Logging', () => {
    // These tests verify request logging, so we need fresh logs
    beforeEach(() => {
      clearRequestLog();
    });

    it('should log all requests', async () => {
      // Create fresh app for this test to get isolated logs
      const app = createTestApp();

      await request(app).get('/health');
      await request(app).get('/api');
      await request(app).get('/unknown');

      const log = getRequestLog();
      // Verify each request was logged by finding them in order
      const healthLog = log.find((l) => l.path === '/health');
      const apiLog = log.find((l) => l.path === '/api');
      const unknownLog = log.find((l) => l.path === '/unknown');

      expect(healthLog).toBeDefined();
      expect(apiLog).toBeDefined();
      expect(unknownLog).toBeDefined();
    });

    it('should log request body for POST requests', async () => {
      const customApp = createTestApp({
        routes: [
          {
            method: 'post',
            path: '/echo',
            handler: (req, res) => res.json(req.body),
          },
        ],
      });

      await request(customApp)
        .post('/echo')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json');

      const log = getRequestLog();
      // Last entry should be our POST request
      const postLog = log.find((l) => l.method === 'POST' && l.path === '/echo');
      expect(postLog).toBeDefined();
      expect(postLog?.body).toEqual({ test: 'data' });
    });

    it('should log response status and body', async () => {
      // Create fresh app for isolated logging
      const app = createTestApp();

      await request(app).get('/api');

      const log = getRequestLog();
      const apiLog = log.find((l) => l.path === '/api');
      expect(apiLog).toBeDefined();
      expect(apiLog?.responseStatus).toBe(200);
      expect(apiLog?.responseBody).toHaveProperty('name', 'x402Arcade API');
    });

    it('should log request duration', async () => {
      // Create fresh app for isolated logging
      const app = createTestApp();

      await request(app).get('/health');

      const log = getRequestLog();
      const healthLog = log.find((l) => l.path === '/health');
      expect(healthLog).toBeDefined();
      expect(healthLog?.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  // ==========================================================================
  // Assertion Helper Tests
  // ==========================================================================

  describe('Assertion Helpers', () => {
    describe('assertJsonSuccess', () => {
      it('should pass for 200 JSON response', async () => {
        const response = await request(getTestApp()).get('/health');
        expect(() => assertJsonSuccess(response)).not.toThrow();
      });
    });

    describe('assertNotFound', () => {
      it('should pass for 404 response', async () => {
        const response = await request(getTestApp()).get('/unknown');
        expect(() => assertNotFound(response)).not.toThrow();
      });
    });

    describe('assertBadRequest', () => {
      it('should pass for 400 response', async () => {
        const customApp = createTestApp({
          routes: [
            {
              method: 'post',
              path: '/validate',
              handler: (_req, res) =>
                res.status(400).json({ error: 'Invalid input' }),
            },
          ],
        });

        const response = await request(customApp).post('/validate');
        expect(() => assertBadRequest(response)).not.toThrow();
      });

      it('should validate error message', async () => {
        const customApp = createTestApp({
          routes: [
            {
              method: 'post',
              path: '/validate',
              handler: (_req, res) =>
                res.status(400).json({ error: 'Missing required field' }),
            },
          ],
        });

        const response = await request(customApp).post('/validate');
        expect(() =>
          assertBadRequest(response, 'Missing required field')
        ).not.toThrow();
      });
    });
  });

  // ==========================================================================
  // Authentication Request Helpers Tests
  // ==========================================================================

  describe('Authentication Request Helpers', () => {
    describe('createPaymentRequest', () => {
      it('should add X-Payment header', async () => {
        const customApp = createTestApp({
          routes: [
            {
              method: 'post',
              path: '/play',
              handler: (req, res) =>
                res.json({ paymentHeader: req.headers['x-payment'] }),
            },
          ],
        });

        const response = await createPaymentRequest(
          customApp,
          'post',
          '/play',
          'mock-payment-header'
        );

        expect(response.body.paymentHeader).toBe('mock-payment-header');
      });
    });

    describe('createWalletAuthRequest', () => {
      it('should add X-Wallet-Address header', async () => {
        const customApp = createTestApp({
          routes: [
            {
              method: 'get',
              path: '/profile',
              handler: (req, res) =>
                res.json({ wallet: req.headers['x-wallet-address'] }),
            },
          ],
        });

        const response = await createWalletAuthRequest(
          customApp,
          'get',
          '/profile',
          TEST_WALLETS.player1
        );

        expect(response.body.wallet).toBe(TEST_WALLETS.player1);
      });
    });
  });

  // ==========================================================================
  // Test Data Helper Tests
  // ==========================================================================

  describe('Test Data Helpers', () => {
    describe('createGameSessionBody', () => {
      it('should create snake game session body by default', () => {
        const body = createGameSessionBody();

        expect(body).toEqual({
          gameType: 'snake',
          playerAddress: TEST_WALLETS.player1,
        });
      });

      it('should accept custom game type and player', () => {
        const body = createGameSessionBody('tetris', TEST_WALLETS.player2);

        expect(body).toEqual({
          gameType: 'tetris',
          playerAddress: TEST_WALLETS.player2,
        });
      });
    });

    describe('createScoreSubmissionBody', () => {
      it('should create score submission body', () => {
        const body = createScoreSubmissionBody('session-123', 5000);

        expect(body).toHaveProperty('sessionId', 'session-123');
        expect(body).toHaveProperty('score', 5000);
        expect(body).toHaveProperty('playerAddress', TEST_WALLETS.player1);
        expect(body).toHaveProperty('gameDurationMs');
        expect(body.gameDurationMs).toBeGreaterThanOrEqual(30000);
      });
    });
  });

  // ==========================================================================
  // JSON Body Parsing Tests
  // ==========================================================================

  describe('JSON Body Parsing', () => {
    it('should parse JSON request bodies', async () => {
      const customApp = createTestApp({
        routes: [
          {
            method: 'post',
            path: '/echo',
            handler: (req, res) => res.json({ received: req.body }),
          },
        ],
      });

      const testData = {
        name: 'test',
        value: 123,
        nested: { foo: 'bar' },
      };

      const response = await request(customApp)
        .post('/echo')
        .send(testData)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.received).toEqual(testData);
    });

    it('should parse URL-encoded bodies', async () => {
      const customApp = createTestApp({
        routes: [
          {
            method: 'post',
            path: '/form',
            handler: (req, res) => res.json({ received: req.body }),
          },
        ],
      });

      const response = await request(customApp)
        .post('/form')
        .send('name=test&value=123')
        .set('Content-Type', 'application/x-www-form-urlencoded');

      expect(response.status).toBe(200);
      expect(response.body.received).toEqual({
        name: 'test',
        value: '123',
      });
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe('Error Handling', () => {
    it('should handle synchronous errors', async () => {
      const customApp = createTestApp({
        routes: [
          {
            method: 'get',
            path: '/sync-error',
            handler: () => {
              throw new Error('Sync error');
            },
          },
        ],
      });

      const response = await request(customApp).get('/sync-error');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Sync error');
      expect(response.body).toHaveProperty('code', 'INTERNAL_ERROR');
    });

    it('should handle errors with custom status codes', async () => {
      const customApp = createTestApp({
        routes: [
          {
            method: 'get',
            path: '/custom-error',
            handler: () => {
              const error = new Error('Custom error') as Error & {
                statusCode: number;
              };
              error.statusCode = 422;
              throw error;
            },
          },
        ],
      });

      const response = await request(customApp).get('/custom-error');

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('error', 'Custom error');
    });

    it('should include stack trace in non-production', async () => {
      process.env.NODE_ENV = 'test';

      const customApp = createTestApp({
        routes: [
          {
            method: 'get',
            path: '/stack-error',
            handler: () => {
              throw new Error('Stack trace test');
            },
          },
        ],
      });

      const response = await request(customApp).get('/stack-error');

      expect(response.body).toHaveProperty('stack');
      expect(response.body.stack).toContain('Error: Stack trace test');
    });
  });

  // ==========================================================================
  // CORS Tests
  // ==========================================================================

  describe('CORS', () => {
    it('should allow all origins by default', async () => {
      const response = await request(getTestApp())
        .get('/health')
        .set('Origin', 'http://example.com');

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });

    it('should allow custom CORS origin', async () => {
      const customApp = createTestApp({
        corsOrigin: 'http://localhost:5173',
      });

      const response = await request(customApp)
        .get('/health')
        .set('Origin', 'http://localhost:5173');

      expect(response.headers['access-control-allow-origin']).toBe(
        'http://localhost:5173'
      );
    });
  });
});
