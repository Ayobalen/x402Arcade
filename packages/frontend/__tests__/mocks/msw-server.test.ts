/**
 * MSW Server Mock Tests
 *
 * Tests for the MSW-like API mocking server.
 *
 * @module __tests__/mocks/msw-server.test
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import {
  // Core
  MockServer,
  setupServer,
  rest,
  // Types
  type MockRequestInfo,
  type MockResponseContext,
  type RequestHandler,
  type FetchCallRecord,
  // Helpers
  apiUrl,
  API_BASE_URL,
  jsonSuccess,
  jsonError,
  delayedResponse,
  networkError,
  // Arcade API
  createArcadeApiHandlers,
  createArcadeApiServer,
  defaultGameSession,
  defaultLeaderboard,
  defaultPrizePool,
} from './msw-server';

describe('MSW Server Mock', () => {
  // ============================================================================
  // REST HANDLER HELPERS TESTS
  // ============================================================================

  describe('rest helper', () => {
    it('creates GET handler', () => {
      const handler = rest.get('/api/test', (_req, res) => res.json({ test: true }));
      expect(handler.method).toBe('get');
      expect(handler.path).toBe('/api/test');
    });

    it('creates POST handler', () => {
      const handler = rest.post('/api/test', (_req, res) => res.json({ created: true }));
      expect(handler.method).toBe('post');
    });

    it('creates PUT handler', () => {
      const handler = rest.put('/api/test/:id', (_req, res) => res.json({ updated: true }));
      expect(handler.method).toBe('put');
    });

    it('creates PATCH handler', () => {
      const handler = rest.patch('/api/test/:id', (_req, res) => res.json({ patched: true }));
      expect(handler.method).toBe('patch');
    });

    it('creates DELETE handler', () => {
      const handler = rest.delete('/api/test/:id', (_req, res) => res.json({ deleted: true }));
      expect(handler.method).toBe('delete');
    });

    it('supports RegExp paths', () => {
      const handler = rest.get(/\/api\/test\/\d+/, (_req, res) => res.json({ match: true }));
      expect(handler.path).toBeInstanceOf(RegExp);
    });
  });

  // ============================================================================
  // MOCK SERVER TESTS
  // ============================================================================

  describe('MockServer', () => {
    let server: MockServer;
    let originalFetch: typeof fetch;

    beforeEach(() => {
      originalFetch = global.fetch;
    });

    afterEach(() => {
      if (server) {
        server.close();
      }
      global.fetch = originalFetch;
    });

    describe('initialization', () => {
      it('creates server with handlers', () => {
        const handlers = [
          rest.get('/api/test', (_req, res) => res.json({ test: true })),
        ];
        server = new MockServer(handlers);
        expect(server.getHandlerCount()).toBe(1);
      });

      it('creates server without handlers', () => {
        server = new MockServer();
        expect(server.getHandlerCount()).toBe(0);
      });
    });

    describe('listen/close', () => {
      it('listen installs fetch mock', () => {
        server = new MockServer([]);
        server.listen();

        expect(vi.isMockFunction(global.fetch)).toBe(true);
      });

      it('close restores original fetch', () => {
        server = new MockServer([]);
        server.listen();
        server.close();

        expect(global.fetch).toBe(originalFetch);
      });

      it('listen with options sets onUnhandledRequest', () => {
        server = new MockServer([]);
        server.listen({ onUnhandledRequest: 'bypass' });
        // Should not throw or warn for unhandled requests
      });
    });

    describe('request handling', () => {
      beforeEach(() => {
        server = new MockServer([
          rest.get('/api/users', (_req, res) => res.json({ users: [] })),
          rest.get('/api/users/:id', (req, res) => res.json({ id: req.params.id })),
          rest.post('/api/users', (req, res) => res.status(201).json(req.body)),
        ]);
        server.listen({ onUnhandledRequest: 'bypass' });
      });

      it('handles GET requests', async () => {
        const response = await fetch('http://localhost/api/users');
        const data = await response.json();

        expect(response.ok).toBe(true);
        expect(data).toEqual({ users: [] });
      });

      it('handles path parameters', async () => {
        const response = await fetch('http://localhost/api/users/123');
        const data = await response.json();

        expect(data).toEqual({ id: '123' });
      });

      it('handles POST requests with body', async () => {
        const response = await fetch('http://localhost/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Test User' }),
        });
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data).toEqual({ name: 'Test User' });
      });

      it('returns 404 for unhandled routes', async () => {
        const response = await fetch('http://localhost/api/unknown');

        expect(response.status).toBe(404);
      });
    });

    describe('response context', () => {
      beforeEach(() => {
        server = new MockServer([
          rest.get('/api/status', (_req, res) => res.status(202).json({ accepted: true })),
          rest.get('/api/text', (_req, res) => res.text('Hello World')),
          rest.get('/api/headers', (_req, res) =>
            res.set('X-Custom-Header', 'test-value').json({ ok: true })
          ),
        ]);
        server.listen({ onUnhandledRequest: 'bypass' });
      });

      it('sets custom status code', async () => {
        const response = await fetch('http://localhost/api/status');
        expect(response.status).toBe(202);
      });

      it('returns text response', async () => {
        const response = await fetch('http://localhost/api/text');
        const text = await response.text();

        expect(response.headers.get('content-type')).toBe('text/plain');
        expect(text).toBe('Hello World');
      });

      it('sets custom headers', async () => {
        const response = await fetch('http://localhost/api/headers');

        expect(response.headers.get('x-custom-header')).toBe('test-value');
      });
    });

    describe('delay', () => {
      beforeEach(() => {
        vi.useFakeTimers();
        server = new MockServer([
          rest.get('/api/slow', (_req, res) => res.delay(100).json({ slow: true })),
        ]);
        server.listen({ onUnhandledRequest: 'bypass' });
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('delays response', async () => {
        const promise = fetch('http://localhost/api/slow');

        // Response should not be ready yet
        await vi.advanceTimersByTimeAsync(50);

        // Advance past delay
        await vi.advanceTimersByTimeAsync(60);

        const response = await promise;
        const data = await response.json();

        expect(data).toEqual({ slow: true });
      });
    });

    describe('use() for runtime handlers', () => {
      beforeEach(() => {
        server = new MockServer([
          rest.get('/api/data', (_req, res) => res.json({ original: true })),
        ]);
        server.listen({ onUnhandledRequest: 'bypass' });
      });

      it('adds runtime handlers', () => {
        server.use(rest.get('/api/new', (_req, res) => res.json({ new: true })));

        expect(server.getHandlerCount()).toBe(2);
      });

      it('runtime handlers take precedence', async () => {
        server.use(rest.get('/api/data', (_req, res) => res.json({ overridden: true })));

        const response = await fetch('http://localhost/api/data');
        const data = await response.json();

        expect(data).toEqual({ overridden: true });
      });
    });

    describe('resetHandlers', () => {
      beforeEach(() => {
        server = new MockServer([
          rest.get('/api/data', (_req, res) => res.json({ original: true })),
        ]);
        server.listen({ onUnhandledRequest: 'bypass' });
      });

      it('removes runtime handlers', async () => {
        server.use(rest.get('/api/data', (_req, res) => res.json({ overridden: true })));
        server.resetHandlers();

        const response = await fetch('http://localhost/api/data');
        const data = await response.json();

        expect(data).toEqual({ original: true });
      });

      it('can replace all handlers', async () => {
        server.resetHandlers(
          rest.get('/api/data', (_req, res) => res.json({ replaced: true }))
        );

        const response = await fetch('http://localhost/api/data');
        const data = await response.json();

        expect(data).toEqual({ replaced: true });
      });
    });

    describe('fetch call tracking', () => {
      beforeEach(() => {
        server = new MockServer([
          rest.get('/api/test', (_req, res) => res.json({ test: true })),
          rest.post('/api/test', (_req, res) => res.json({ created: true })),
        ]);
        server.listen({ onUnhandledRequest: 'bypass' });
      });

      it('records fetch calls', async () => {
        await fetch('http://localhost/api/test');

        const calls = server.getFetchCalls();
        expect(calls).toHaveLength(1);
        expect(calls[0].url).toContain('/api/test');
        expect(calls[0].method).toBe('GET');
      });

      it('records multiple calls', async () => {
        await fetch('http://localhost/api/test');
        await fetch('http://localhost/api/test', { method: 'POST' });

        const calls = server.getFetchCalls();
        expect(calls).toHaveLength(2);
        expect(calls[0].method).toBe('GET');
        expect(calls[1].method).toBe('POST');
      });

      it('records request body', async () => {
        await fetch('http://localhost/api/test', {
          method: 'POST',
          body: JSON.stringify({ data: 'test' }),
        });

        const calls = server.getFetchCalls();
        expect(calls[0].body).toEqual({ data: 'test' });
      });

      it('clearFetchCalls resets history', async () => {
        await fetch('http://localhost/api/test');
        server.clearFetchCalls();

        expect(server.getFetchCalls()).toHaveLength(0);
      });
    });
  });

  // ============================================================================
  // SETUP SERVER FUNCTION TESTS
  // ============================================================================

  describe('setupServer', () => {
    it('creates MockServer instance', () => {
      const server = setupServer(
        rest.get('/api/test', (_req, res) => res.json({ test: true }))
      );

      expect(server).toBeInstanceOf(MockServer);
      expect(server.getHandlerCount()).toBe(1);
    });
  });

  // ============================================================================
  // RESPONSE FACTORY TESTS
  // ============================================================================

  describe('Response Factories', () => {
    let server: MockServer;

    afterEach(() => {
      if (server) server.close();
    });

    describe('jsonSuccess', () => {
      it('returns success response', async () => {
        server = setupServer(
          rest.get('/api/data', jsonSuccess({ success: true }))
        );
        server.listen({ onUnhandledRequest: 'bypass' });

        const response = await fetch('http://localhost/api/data');
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({ success: true });
      });

      it('accepts custom status', async () => {
        server = setupServer(
          rest.get('/api/data', jsonSuccess({ created: true }, 201))
        );
        server.listen({ onUnhandledRequest: 'bypass' });

        const response = await fetch('http://localhost/api/data');
        expect(response.status).toBe(201);
      });
    });

    describe('jsonError', () => {
      it('returns error response', async () => {
        server = setupServer(
          rest.get('/api/error', jsonError('Bad Request'))
        );
        server.listen({ onUnhandledRequest: 'bypass' });

        const response = await fetch('http://localhost/api/error');
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toEqual({ error: 'Bad Request' });
      });

      it('accepts custom status', async () => {
        server = setupServer(
          rest.get('/api/error', jsonError('Not Found', 404))
        );
        server.listen({ onUnhandledRequest: 'bypass' });

        const response = await fetch('http://localhost/api/error');
        expect(response.status).toBe(404);
      });
    });

    describe('delayedResponse', () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('delays the response', async () => {
        server = setupServer(
          rest.get('/api/slow', delayedResponse({ done: true }, 200))
        );
        server.listen({ onUnhandledRequest: 'bypass' });

        const promise = fetch('http://localhost/api/slow');
        await vi.advanceTimersByTimeAsync(250);

        const response = await promise;
        const data = await response.json();

        expect(data).toEqual({ done: true });
      });
    });

    describe('networkError', () => {
      it('throws network error', async () => {
        server = setupServer(
          rest.get('/api/error', networkError())
        );
        server.listen({ onUnhandledRequest: 'bypass' });

        await expect(fetch('http://localhost/api/error')).rejects.toThrow('Failed to fetch');
      });
    });
  });

  // ============================================================================
  // API URL HELPERS TESTS
  // ============================================================================

  describe('API URL Helpers', () => {
    it('API_BASE_URL is defined', () => {
      expect(API_BASE_URL).toBe('http://localhost:3001/api');
    });

    it('apiUrl creates full URL', () => {
      expect(apiUrl('/users')).toBe('http://localhost:3001/api/users');
      expect(apiUrl('users')).toBe('http://localhost:3001/api/users');
    });
  });

  // ============================================================================
  // ARCADE API HANDLERS TESTS
  // ============================================================================

  describe('Arcade API Handlers', () => {
    let server: MockServer;

    beforeEach(() => {
      server = createArcadeApiServer({ onUnhandledRequest: 'bypass' });
      server.listen();
    });

    afterEach(() => {
      server.close();
    });

    it('handles health check', async () => {
      const response = await fetch('http://localhost/api/health');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data).toEqual({ status: 'ok' });
    });

    it('handles play endpoint', async () => {
      const response = await fetch('http://localhost/api/play', { method: 'POST' });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe(defaultGameSession.id);
      expect(data.status).toBe('active');
    });

    it('handles session fetch', async () => {
      const response = await fetch('http://localhost/api/sessions/custom-id');
      const data = await response.json();

      expect(data.id).toBe('custom-id');
    });

    it('handles score submission', async () => {
      const response = await fetch('http://localhost/api/scores', {
        method: 'POST',
        body: JSON.stringify({ sessionId: 'test-123', score: 500 }),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.sessionId).toBe('test-123');
      expect(data.score).toBe(500);
      expect(data.submitted).toBe(true);
    });

    it('handles leaderboard fetch', async () => {
      const response = await fetch('http://localhost/api/leaderboard/tetris');
      const data = await response.json();

      expect(data.entries).toHaveLength(3);
      expect(data.entries[0].gameType).toBe('tetris');
    });

    it('handles prize pool fetch', async () => {
      const response = await fetch('http://localhost/api/prizes/snake');
      const data = await response.json();

      expect(data.gameType).toBe('snake');
      expect(data.currency).toBe('USDC');
    });
  });

  // ============================================================================
  // INTEGRATION EXAMPLE TESTS
  // ============================================================================

  describe('Integration Examples', () => {
    let server: MockServer;

    beforeEach(() => {
      server = setupServer(
        rest.get('/api/user', (_req, res) => res.json({ id: 1, name: 'Test' })),
        rest.post('/api/login', (req, res) => {
          const body = req.body as { username: string; password: string };
          if (body.username === 'admin' && body.password === 'secret') {
            return res.json({ token: 'jwt-token-123' });
          }
          return res.status(401).json({ error: 'Invalid credentials' });
        })
      );
      server.listen({ onUnhandledRequest: 'bypass' });
    });

    afterEach(() => {
      server.resetHandlers();
      server.close();
    });

    it('typical fetch test flow', async () => {
      const response = await fetch('http://localhost/api/user');
      const user = await response.json();

      expect(user).toEqual({ id: 1, name: 'Test' });
    });

    it('authentication flow test', async () => {
      // Successful login
      const successResponse = await fetch('http://localhost/api/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'admin', password: 'secret' }),
      });
      const successData = await successResponse.json();

      expect(successResponse.ok).toBe(true);
      expect(successData.token).toBe('jwt-token-123');

      // Failed login
      const failResponse = await fetch('http://localhost/api/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'admin', password: 'wrong' }),
      });

      expect(failResponse.status).toBe(401);
    });

    it('overriding handlers for specific tests', async () => {
      // Override for this test only
      server.use(
        rest.get('/api/user', (_req, res) => res.json({ id: 2, name: 'Override' }))
      );

      const response = await fetch('http://localhost/api/user');
      const user = await response.json();

      expect(user.name).toBe('Override');
    });

    it('verifying fetch was called correctly', async () => {
      await fetch('http://localhost/api/user');
      await fetch('http://localhost/api/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'test' }),
      });

      const calls = server.getFetchCalls();

      expect(calls).toHaveLength(2);
      expect(calls[0].method).toBe('GET');
      expect(calls[1].method).toBe('POST');
      expect(calls[1].body).toEqual({ username: 'test' });
    });
  });
});
