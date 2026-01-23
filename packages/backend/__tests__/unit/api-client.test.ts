/**
 * Tests for API Test Client
 *
 * Verifies that the TestApiClient wrapper provides proper typing,
 * authentication support, and response assertion helpers.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import express, { Application, Request, Response } from 'express';
import { TestApiClient, createTestApiClient, assertResponse, ApiResponse } from '../utils';

describe('API Test Client', () => {
  let app: Application;
  let client: TestApiClient;

  beforeEach(() => {
    // Create a simple test Express app
    app = express();
    app.use(express.json());

    // Simple routes for testing
    app.get('/test', (_req: Request, res: Response) => {
      res.json({ message: 'Hello, World!' });
    });

    app.get('/api/users', (_req: Request, res: Response) => {
      res.json([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ]);
    });

    app.get('/api/users/:id', (req: Request, res: Response) => {
      const id = parseInt(req.params.id);
      if (id === 1) {
        res.json({ id: 1, name: 'Alice' });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    });

    app.post('/api/users', (req: Request, res: Response) => {
      const { name } = req.body;
      if (!name) {
        res.status(400).json({ error: 'Name is required' });
        return;
      }
      res.status(201).json({ id: 3, name });
    });

    app.put('/api/users/:id', (req: Request, res: Response) => {
      const { name } = req.body;
      res.json({ id: parseInt(req.params.id), name });
    });

    app.patch('/api/users/:id', (req: Request, res: Response) => {
      const { name } = req.body;
      res.json({ id: parseInt(req.params.id), name, patched: true });
    });

    app.delete('/api/users/:id', (_req: Request, res: Response) => {
      res.status(204).send();
    });

    // Auth-protected route
    app.get('/api/protected', (req: Request, res: Response) => {
      const token = req.header('X-Payment');
      if (!token) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      res.json({ authenticated: true, token });
    });

    // Headers echo route
    app.get('/api/echo-headers', (req: Request, res: Response) => {
      res.json({
        customHeader: req.header('X-Custom-Header'),
        contentType: req.header('Content-Type'),
      });
    });

    // Query params echo route
    app.get('/api/search', (req: Request, res: Response) => {
      res.json({ query: req.query });
    });

    // Payment required route (402)
    app.post('/api/play', (req: Request, res: Response) => {
      const payment = req.header('X-Payment');
      if (!payment) {
        res.status(402).json({
          error: 'Payment required',
          paymentInfo: { amount: 0.01, currency: 'USDC' },
        });
        return;
      }
      res.json({ sessionId: 'test-session-123', gameType: 'snake' });
    });

    client = new TestApiClient(app);
  });

  describe('TestApiClient', () => {
    describe('constructor', () => {
      it('should create a client with default config', () => {
        const testClient = new TestApiClient(app);
        expect(testClient).toBeInstanceOf(TestApiClient);
      });

      it('should create a client with custom base path', () => {
        const testClient = new TestApiClient(app, { basePath: '/api' });
        expect(testClient).toBeInstanceOf(TestApiClient);
      });
    });

    describe('GET requests', () => {
      it('should make a GET request and return typed response', async () => {
        const response = await client.get<{ message: string }>('/test');

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Hello, World!');
        expect(response.ok).toBe(true);
      });

      it('should handle base path configuration', async () => {
        const apiClient = new TestApiClient(app, { basePath: '/api' });
        const response = await apiClient.get<Array<{ id: number; name: string }>>('/users');

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(2);
      });

      it('should handle query parameters', async () => {
        const response = await client.get<{ query: { name: string; page: string } }>(
          '/api/search',
          {
            query: { name: 'test', page: 1 },
          }
        );

        expect(response.status).toBe(200);
        expect(response.body.query.name).toBe('test');
        expect(response.body.query.page).toBe('1');
      });

      it('should return 404 for non-existent resources', async () => {
        const response = await client.get<{ error: string }>('/api/users/999');

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('User not found');
      });
    });

    describe('POST requests', () => {
      it('should make a POST request with body', async () => {
        const response = await client.post<{ id: number; name: string }>('/api/users', {
          name: 'Charlie',
        });

        expect(response.status).toBe(201);
        expect(response.body.id).toBe(3);
        expect(response.body.name).toBe('Charlie');
      });

      it('should handle POST without body', async () => {
        const response = await client.post<{ error: string }>('/api/users');

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Name is required');
      });
    });

    describe('PUT requests', () => {
      it('should make a PUT request with body', async () => {
        const response = await client.put<{ id: number; name: string }>('/api/users/1', {
          name: 'Updated Name',
        });

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(1);
        expect(response.body.name).toBe('Updated Name');
      });
    });

    describe('PATCH requests', () => {
      it('should make a PATCH request with body', async () => {
        const response = await client.patch<{ id: number; name: string; patched: boolean }>(
          '/api/users/1',
          { name: 'Patched Name' }
        );

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(1);
        expect(response.body.patched).toBe(true);
      });
    });

    describe('DELETE requests', () => {
      it('should make a DELETE request', async () => {
        const response = await client.delete('/api/users/1');

        expect(response.status).toBe(204);
      });
    });

    describe('Authentication', () => {
      it('should include X-Payment header when authToken is provided', async () => {
        const response = await client.get<{ authenticated: boolean; token: string }>(
          '/api/protected',
          {
            authToken: 'test-token-123',
          }
        );

        expect(response.status).toBe(200);
        expect(response.body.authenticated).toBe(true);
        expect(response.body.token).toBe('test-token-123');
      });

      it('should return 401 without auth token', async () => {
        const response = await client.get<{ error: string }>('/api/protected');

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Authentication required');
      });

      it('should use default auth token when set', async () => {
        client.setDefaultAuthToken('default-token');

        const response = await client.get<{ authenticated: boolean; token: string }>(
          '/api/protected'
        );

        expect(response.status).toBe(200);
        expect(response.body.token).toBe('default-token');
      });

      it('should clear default auth token', async () => {
        client.setDefaultAuthToken('default-token');
        client.clearDefaultAuthToken();

        const response = await client.get<{ error: string }>('/api/protected');

        expect(response.status).toBe(401);
      });
    });

    describe('Custom headers', () => {
      it('should include custom headers in request', async () => {
        const response = await client.get<{ customHeader: string }>('/api/echo-headers', {
          headers: { 'X-Custom-Header': 'custom-value' },
        });

        expect(response.status).toBe(200);
        expect(response.body.customHeader).toBe('custom-value');
      });

      it('should use default headers from config', async () => {
        const clientWithHeaders = new TestApiClient(app, {
          defaultHeaders: { 'X-Custom-Header': 'default-value' },
        });

        const response = await clientWithHeaders.get<{ customHeader: string }>('/api/echo-headers');

        expect(response.body.customHeader).toBe('default-value');
      });
    });

    describe('Payment Required (402)', () => {
      it('should handle 402 Payment Required response', async () => {
        const response = await client.post<{
          error: string;
          paymentInfo: { amount: number; currency: string };
        }>('/api/play');

        expect(response.status).toBe(402);
        expect(response.body.error).toBe('Payment required');
        expect(response.body.paymentInfo.amount).toBe(0.01);
      });

      it('should process payment with X-Payment header', async () => {
        const response = await client.post<{ sessionId: string; gameType: string }>(
          '/api/play',
          {},
          { authToken: 'payment-auth-token' }
        );

        expect(response.status).toBe(200);
        expect(response.body.sessionId).toBe('test-session-123');
      });
    });

    describe('raw()', () => {
      it('should provide raw supertest agent', async () => {
        const raw = client.raw();
        expect(raw).toBeDefined();

        const response = await raw.get('/test');
        expect(response.status).toBe(200);
      });
    });
  });

  describe('createTestApiClient', () => {
    it('should create a TestApiClient instance', () => {
      const testClient = createTestApiClient(app);
      expect(testClient).toBeInstanceOf(TestApiClient);
    });

    it('should accept configuration', () => {
      const testClient = createTestApiClient(app, { basePath: '/api' });
      expect(testClient).toBeInstanceOf(TestApiClient);
    });
  });

  describe('assertResponse', () => {
    describe('isSuccess', () => {
      it('should pass for 2xx status codes', () => {
        const response: ApiResponse<unknown> = {
          status: 200,
          body: {},
          headers: {},
          ok: true,
        };

        expect(() => assertResponse.isSuccess(response)).not.toThrow();
      });

      it('should throw for non-2xx status codes', () => {
        const response: ApiResponse<unknown> = {
          status: 400,
          body: { error: 'Bad Request' },
          headers: {},
          ok: false,
        };

        expect(() => assertResponse.isSuccess(response)).toThrow(/Expected success status/);
      });
    });

    describe('hasStatus', () => {
      it('should pass when status matches', () => {
        const response: ApiResponse<unknown> = {
          status: 201,
          body: {},
          headers: {},
          ok: true,
        };

        expect(() => assertResponse.hasStatus(response, 201)).not.toThrow();
      });

      it('should throw when status does not match', () => {
        const response: ApiResponse<unknown> = {
          status: 200,
          body: {},
          headers: {},
          ok: true,
        };

        expect(() => assertResponse.hasStatus(response, 201)).toThrow(/Expected status 201, got 200/);
      });
    });

    describe('status helpers', () => {
      it('isOk should check for 200', () => {
        const response: ApiResponse<unknown> = { status: 200, body: {}, headers: {}, ok: true };
        expect(() => assertResponse.isOk(response)).not.toThrow();
      });

      it('isCreated should check for 201', () => {
        const response: ApiResponse<unknown> = { status: 201, body: {}, headers: {}, ok: true };
        expect(() => assertResponse.isCreated(response)).not.toThrow();
      });

      it('isNoContent should check for 204', () => {
        const response: ApiResponse<unknown> = { status: 204, body: {}, headers: {}, ok: true };
        expect(() => assertResponse.isNoContent(response)).not.toThrow();
      });

      it('isBadRequest should check for 400', () => {
        const response: ApiResponse<unknown> = { status: 400, body: {}, headers: {}, ok: false };
        expect(() => assertResponse.isBadRequest(response)).not.toThrow();
      });

      it('isUnauthorized should check for 401', () => {
        const response: ApiResponse<unknown> = { status: 401, body: {}, headers: {}, ok: false };
        expect(() => assertResponse.isUnauthorized(response)).not.toThrow();
      });

      it('isPaymentRequired should check for 402', () => {
        const response: ApiResponse<unknown> = { status: 402, body: {}, headers: {}, ok: false };
        expect(() => assertResponse.isPaymentRequired(response)).not.toThrow();
      });

      it('isForbidden should check for 403', () => {
        const response: ApiResponse<unknown> = { status: 403, body: {}, headers: {}, ok: false };
        expect(() => assertResponse.isForbidden(response)).not.toThrow();
      });

      it('isNotFound should check for 404', () => {
        const response: ApiResponse<unknown> = { status: 404, body: {}, headers: {}, ok: false };
        expect(() => assertResponse.isNotFound(response)).not.toThrow();
      });

      it('isServerError should check for 500', () => {
        const response: ApiResponse<unknown> = { status: 500, body: {}, headers: {}, ok: false };
        expect(() => assertResponse.isServerError(response)).not.toThrow();
      });
    });

    describe('hasProperty', () => {
      it('should pass when property exists', () => {
        const response: ApiResponse<{ id: number }> = {
          status: 200,
          body: { id: 1 },
          headers: {},
          ok: true,
        };

        expect(() => assertResponse.hasProperty(response, 'id')).not.toThrow();
      });

      it('should throw when property does not exist', () => {
        const response: ApiResponse<{ name: string }> = {
          status: 200,
          body: { name: 'test' },
          headers: {},
          ok: true,
        };

        expect(() => assertResponse.hasProperty(response, 'id' as keyof typeof response.body)).toThrow(
          /Expected body to have property/
        );
      });
    });

    describe('bodyMatches', () => {
      it('should pass when body matches expected shape', () => {
        const response: ApiResponse<{ id: number; name: string }> = {
          status: 200,
          body: { id: 1, name: 'Alice' },
          headers: {},
          ok: true,
        };

        expect(() => assertResponse.bodyMatches(response, { id: 1 })).not.toThrow();
      });

      it('should throw when body does not match', () => {
        const response: ApiResponse<{ id: number }> = {
          status: 200,
          body: { id: 1 },
          headers: {},
          ok: true,
        };

        expect(() => assertResponse.bodyMatches(response, { id: 2 })).toThrow(
          /Expected body.id to be 2, got 1/
        );
      });
    });

    describe('hasHeader', () => {
      it('should pass when header exists', () => {
        const response: ApiResponse<unknown> = {
          status: 200,
          body: {},
          headers: { 'content-type': 'application/json' },
          ok: true,
        };

        expect(() => assertResponse.hasHeader(response, 'content-type')).not.toThrow();
      });

      it('should pass when header has expected value', () => {
        const response: ApiResponse<unknown> = {
          status: 200,
          body: {},
          headers: { 'content-type': 'application/json' },
          ok: true,
        };

        expect(() =>
          assertResponse.hasHeader(response, 'content-type', 'application/json')
        ).not.toThrow();
      });

      it('should throw when header does not exist', () => {
        const response: ApiResponse<unknown> = {
          status: 200,
          body: {},
          headers: {},
          ok: true,
        };

        expect(() => assertResponse.hasHeader(response, 'x-custom')).toThrow(
          /Expected response to have header/
        );
      });
    });

    describe('isArrayWithLength', () => {
      it('should pass when array has expected length', () => {
        const response: ApiResponse<number[]> = {
          status: 200,
          body: [1, 2, 3],
          headers: {},
          ok: true,
        };

        expect(() => assertResponse.isArrayWithLength(response, 3)).not.toThrow();
      });

      it('should throw when body is not an array', () => {
        const response: ApiResponse<unknown> = {
          status: 200,
          body: { items: [] },
          headers: {},
          ok: true,
        };

        expect(() => assertResponse.isArrayWithLength(response as ApiResponse<unknown[]>, 0)).toThrow(
          /Expected body to be an array/
        );
      });

      it('should throw when array length does not match', () => {
        const response: ApiResponse<number[]> = {
          status: 200,
          body: [1, 2],
          headers: {},
          ok: true,
        };

        expect(() => assertResponse.isArrayWithLength(response, 3)).toThrow(
          /Expected array length 3, got 2/
        );
      });
    });

    describe('isArrayWithMinLength', () => {
      it('should pass when array has at least min length', () => {
        const response: ApiResponse<number[]> = {
          status: 200,
          body: [1, 2, 3],
          headers: {},
          ok: true,
        };

        expect(() => assertResponse.isArrayWithMinLength(response, 2)).not.toThrow();
      });

      it('should throw when array is too short', () => {
        const response: ApiResponse<number[]> = {
          status: 200,
          body: [1],
          headers: {},
          ok: true,
        };

        expect(() => assertResponse.isArrayWithMinLength(response, 2)).toThrow(
          /Expected array length >= 2, got 1/
        );
      });
    });
  });
});
