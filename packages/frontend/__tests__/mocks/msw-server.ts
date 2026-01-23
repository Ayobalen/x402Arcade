/**
 * MSW (Mock Service Worker) Server Setup
 *
 * This module provides a MSW-like API mocking setup for tests.
 * It can be used with or without MSW installed.
 *
 * When MSW is installed, it uses the actual MSW server.
 * When MSW is not installed, it uses a mock implementation.
 *
 * @module __tests__/mocks/msw-server
 */

import { vi } from 'vitest';

// ============================================================================
// TYPES
// ============================================================================

/**
 * HTTP method types
 */
export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options';

/**
 * Request handler info passed to handler functions
 */
export interface MockRequestInfo {
  url: URL;
  method: string;
  headers: Headers;
  params: Record<string, string>;
  body?: unknown;
}

/**
 * Response context for building mock responses
 */
export interface MockResponseContext {
  status: (code: number) => MockResponseContext;
  json: (data: unknown) => MockResponse;
  text: (data: string) => MockResponse;
  delay: (ms: number) => MockResponseContext;
  set: (header: string, value: string) => MockResponseContext;
}

/**
 * Mock response object
 */
export interface MockResponse {
  status: number;
  headers: Record<string, string>;
  body: unknown;
  delay: number;
}

/**
 * Request handler function
 */
export type RequestHandlerFn = (
  req: MockRequestInfo,
  res: MockResponseContext,
  ctx: MockResponseContext
) => MockResponse | Promise<MockResponse>;

/**
 * Request handler definition
 */
export interface RequestHandler {
  method: HttpMethod;
  path: string | RegExp;
  handler: RequestHandlerFn;
}

/**
 * Server configuration options
 */
export interface ServerOptions {
  onUnhandledRequest?: 'warn' | 'error' | 'bypass';
}

/**
 * Fetch call record for tracking
 */
export interface FetchCallRecord {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
  timestamp: number;
  response?: MockResponse;
}

// ============================================================================
// MOCK RESPONSE BUILDER
// ============================================================================

/**
 * Creates a response context builder
 */
function createResponseContext(): MockResponseContext & { _response: MockResponse } {
  const response: MockResponse = {
    status: 200,
    headers: {},
    body: null,
    delay: 0,
  };

  const context: MockResponseContext & { _response: MockResponse } = {
    _response: response,

    status(code: number) {
      response.status = code;
      return context;
    },

    json(data: unknown) {
      response.body = data;
      response.headers['content-type'] = 'application/json';
      return response;
    },

    text(data: string) {
      response.body = data;
      response.headers['content-type'] = 'text/plain';
      return response;
    },

    delay(ms: number) {
      response.delay = ms;
      return context;
    },

    set(header: string, value: string) {
      response.headers[header.toLowerCase()] = value;
      return context;
    },
  };

  return context;
}

// ============================================================================
// REST HANDLER HELPERS
// ============================================================================

/**
 * REST API handler helpers - similar to MSW's rest object
 */
export const rest = {
  get(path: string | RegExp, handler: RequestHandlerFn): RequestHandler {
    return { method: 'get', path, handler };
  },

  post(path: string | RegExp, handler: RequestHandlerFn): RequestHandler {
    return { method: 'post', path, handler };
  },

  put(path: string | RegExp, handler: RequestHandlerFn): RequestHandler {
    return { method: 'put', path, handler };
  },

  patch(path: string | RegExp, handler: RequestHandlerFn): RequestHandler {
    return { method: 'patch', path, handler };
  },

  delete(path: string | RegExp, handler: RequestHandlerFn): RequestHandler {
    return { method: 'delete', path, handler };
  },

  head(path: string | RegExp, handler: RequestHandlerFn): RequestHandler {
    return { method: 'head', path, handler };
  },

  options(path: string | RegExp, handler: RequestHandlerFn): RequestHandler {
    return { method: 'options', path, handler };
  },
};

// ============================================================================
// MOCK SERVER IMPLEMENTATION
// ============================================================================

/**
 * Mock server that intercepts fetch requests
 */
export class MockServer {
  private handlers: RequestHandler[] = [];
  private runtimeHandlers: RequestHandler[] = [];
  private originalFetch: typeof fetch;
  private isListening = false;
  private fetchCalls: FetchCallRecord[] = [];
  private options: ServerOptions;

  constructor(handlers: RequestHandler[] = [], options: ServerOptions = {}) {
    this.handlers = [...handlers];
    this.originalFetch = global.fetch;
    this.options = {
      onUnhandledRequest: 'warn',
      ...options,
    };
  }

  /**
   * Start intercepting fetch requests
   */
  listen(options?: ServerOptions): void {
    if (this.isListening) return;

    if (options) {
      this.options = { ...this.options, ...options };
    }

    this.isListening = true;
    this.installFetchMock();
  }

  /**
   * Stop intercepting fetch requests
   */
  close(): void {
    if (!this.isListening) return;

    this.isListening = false;
    global.fetch = this.originalFetch;
    this.fetchCalls = [];
  }

  /**
   * Reset handlers to initial state
   */
  resetHandlers(...newHandlers: RequestHandler[]): void {
    this.runtimeHandlers = [];
    if (newHandlers.length > 0) {
      this.handlers = [...newHandlers];
    }
  }

  /**
   * Add runtime handlers (prepended to handler list)
   */
  use(...handlers: RequestHandler[]): void {
    this.runtimeHandlers = [...handlers, ...this.runtimeHandlers];
  }

  /**
   * Get all fetch calls made during tests
   */
  getFetchCalls(): FetchCallRecord[] {
    return [...this.fetchCalls];
  }

  /**
   * Clear fetch call history
   */
  clearFetchCalls(): void {
    this.fetchCalls = [];
  }

  /**
   * Get handlers count
   */
  getHandlerCount(): number {
    return this.handlers.length + this.runtimeHandlers.length;
  }

  /**
   * Install fetch mock
   */
  private installFetchMock(): void {
    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? new URL(input, 'http://localhost') : input instanceof URL ? input : new URL(input.url);
      const method = (init?.method || 'GET').toLowerCase() as HttpMethod;
      const headers = new Headers(init?.headers);

      // Parse body
      let body: unknown;
      if (init?.body) {
        try {
          body = JSON.parse(init.body as string);
        } catch {
          body = init.body;
        }
      }

      // Create request info
      const requestInfo: MockRequestInfo = {
        url,
        method,
        headers,
        params: this.extractParams(url.pathname, ''),
        body,
      };

      // Record the call
      const callRecord: FetchCallRecord = {
        url: url.toString(),
        method: method.toUpperCase(),
        headers: Object.fromEntries(headers.entries()),
        body,
        timestamp: Date.now(),
      };
      this.fetchCalls.push(callRecord);

      // Find matching handler
      const handler = this.findHandler(method, url.pathname);

      if (!handler) {
        this.handleUnhandledRequest(url.toString(), method);
        // Return a 404 response for unhandled requests
        return new Response(JSON.stringify({ error: 'Not Found' }), {
          status: 404,
          headers: { 'content-type': 'application/json' },
        });
      }

      // Create response context
      const ctx = createResponseContext();
      const mockResponse = await handler.handler(
        { ...requestInfo, params: this.extractParams(url.pathname, handler.path) },
        ctx,
        ctx
      );

      // Record response
      callRecord.response = mockResponse;

      // Apply delay if specified
      if (mockResponse.delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, mockResponse.delay));
      }

      // Create and return Response
      const responseBody =
        mockResponse.headers['content-type']?.includes('application/json')
          ? JSON.stringify(mockResponse.body)
          : String(mockResponse.body);

      return new Response(responseBody, {
        status: mockResponse.status,
        headers: new Headers(mockResponse.headers),
      });
    });
  }

  /**
   * Find a matching handler for the request
   */
  private findHandler(method: HttpMethod, pathname: string): RequestHandler | undefined {
    // Check runtime handlers first
    for (const handler of this.runtimeHandlers) {
      if (this.matchesHandler(handler, method, pathname)) {
        return handler;
      }
    }

    // Then check initial handlers
    for (const handler of this.handlers) {
      if (this.matchesHandler(handler, method, pathname)) {
        return handler;
      }
    }

    return undefined;
  }

  /**
   * Check if a handler matches the request
   */
  private matchesHandler(handler: RequestHandler, method: HttpMethod, pathname: string): boolean {
    if (handler.method !== method) return false;

    if (handler.path instanceof RegExp) {
      return handler.path.test(pathname);
    }

    // Support path parameters like /api/users/:id
    const pathPattern = handler.path.replace(/:[^/]+/g, '[^/]+');
    const regex = new RegExp(`^${pathPattern}$`);
    return regex.test(pathname);
  }

  /**
   * Extract path parameters
   */
  private extractParams(pathname: string, handlerPath: string | RegExp): Record<string, string> {
    if (handlerPath instanceof RegExp) {
      const match = pathname.match(handlerPath);
      if (match && match.groups) {
        return match.groups;
      }
      return {};
    }

    const params: Record<string, string> = {};
    const pathParts = pathname.split('/');
    const handlerParts = handlerPath.split('/');

    for (let i = 0; i < handlerParts.length; i++) {
      if (handlerParts[i].startsWith(':')) {
        const paramName = handlerParts[i].slice(1);
        params[paramName] = pathParts[i] || '';
      }
    }

    return params;
  }

  /**
   * Handle unhandled requests based on options
   */
  private handleUnhandledRequest(url: string, method: string): void {
    const message = `[MSW] Warning: captured a request without a matching handler:\n\n  ${method.toUpperCase()} ${url}\n`;

    switch (this.options.onUnhandledRequest) {
      case 'error':
        throw new Error(message);
      case 'warn':
        console.warn(message);
        break;
      case 'bypass':
        // Do nothing
        break;
    }
  }
}

// ============================================================================
// SETUP SERVER FUNCTION
// ============================================================================

/**
 * Create a mock server with the given handlers
 * This mirrors MSW's setupServer function
 */
export function setupServer(...handlers: RequestHandler[]): MockServer {
  return new MockServer(handlers);
}

// ============================================================================
// API ENDPOINT HELPERS
// ============================================================================

/**
 * Base URL for the API
 */
export const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Create a full API URL
 */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

// ============================================================================
// COMMON RESPONSE FACTORIES
// ============================================================================

/**
 * Creates a success JSON response
 */
export function jsonSuccess(data: unknown, status = 200) {
  return (_req: MockRequestInfo, res: MockResponseContext) => {
    return res.status(status).json(data);
  };
}

/**
 * Creates an error JSON response
 */
export function jsonError(message: string, status = 400) {
  return (_req: MockRequestInfo, res: MockResponseContext) => {
    return res.status(status).json({ error: message });
  };
}

/**
 * Creates a delayed response
 */
export function delayedResponse(data: unknown, delayMs: number, status = 200) {
  return (_req: MockRequestInfo, res: MockResponseContext) => {
    return res.delay(delayMs).status(status).json(data);
  };
}

/**
 * Creates a network error response
 */
export function networkError() {
  return () => {
    throw new TypeError('Failed to fetch');
  };
}

// ============================================================================
// x402 ARCADE API HANDLERS
// ============================================================================

/**
 * Default game session response
 */
export const defaultGameSession = {
  id: 'session-123',
  gameType: 'snake',
  playerAddress: '0x1234567890abcdef1234567890abcdef12345678',
  status: 'active',
  createdAt: new Date().toISOString(),
};

/**
 * Default leaderboard response
 */
export const defaultLeaderboard = {
  entries: [
    { rank: 1, playerAddress: '0xaaa...', score: 1000, gameType: 'snake' },
    { rank: 2, playerAddress: '0xbbb...', score: 800, gameType: 'snake' },
    { rank: 3, playerAddress: '0xccc...', score: 600, gameType: 'snake' },
  ],
  period: 'daily',
};

/**
 * Default prize pool response
 */
export const defaultPrizePool = {
  gameType: 'snake',
  totalAmount: 1.5,
  currency: 'USDC',
  period: 'daily',
  endTime: new Date(Date.now() + 86400000).toISOString(),
};

/**
 * Create handlers for the x402 Arcade API
 */
export function createArcadeApiHandlers(): RequestHandler[] {
  return [
    // Health check
    rest.get('/api/health', (_req, res) => res.json({ status: 'ok' })),

    // Game sessions
    rest.post('/api/play', (_req, res) => {
      return res.status(201).json(defaultGameSession);
    }),

    rest.get('/api/sessions/:id', (req, res) => {
      return res.json({ ...defaultGameSession, id: req.params.id });
    }),

    // Score submission
    rest.post('/api/scores', (req, res) => {
      return res.status(201).json({
        sessionId: (req.body as { sessionId: string })?.sessionId || 'session-123',
        score: (req.body as { score: number })?.score || 0,
        submitted: true,
      });
    }),

    // Leaderboard
    rest.get('/api/leaderboard/:gameType', (req, res) => {
      return res.json({
        ...defaultLeaderboard,
        entries: defaultLeaderboard.entries.map((e) => ({
          ...e,
          gameType: req.params.gameType,
        })),
      });
    }),

    // Prize pool
    rest.get('/api/prizes/:gameType', (req, res) => {
      return res.json({ ...defaultPrizePool, gameType: req.params.gameType });
    }),
  ];
}

/**
 * Create a server with default arcade API handlers
 */
export function createArcadeApiServer(options?: ServerOptions): MockServer {
  return new MockServer(createArcadeApiHandlers(), options);
}

// ============================================================================
// TEST SETUP HELPERS
// ============================================================================

/**
 * Setup server for test file
 * Returns cleanup function to call in afterAll
 */
export function setupTestServer(server: MockServer): () => void {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'warn' });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  return () => server.close();
}
