/**
 * Backend Test Utility Helpers
 *
 * Reusable test utilities for common testing patterns in the Express backend.
 */

import { jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';

/**
 * Create a mock Express Request object.
 * Useful for unit testing route handlers and middleware.
 *
 * @param overrides - Partial request properties to override defaults
 * @returns Mock Request object
 */
export function createMockRequest(
  overrides: Partial<Request> & {
    body?: Record<string, unknown>;
    params?: Record<string, string>;
    query?: Record<string, string>;
    headers?: Record<string, string>;
  } = {}
): Request {
  const req = {
    body: {},
    params: {},
    query: {},
    headers: {},
    cookies: {},
    signedCookies: {},
    path: '/',
    method: 'GET',
    baseUrl: '',
    originalUrl: '/',
    protocol: 'http',
    secure: false,
    ip: '127.0.0.1',
    ips: [],
    hostname: 'localhost',
    fresh: false,
    stale: true,
    xhr: false,
    get: jest.fn((header: string) => {
      const headers = (overrides.headers || {}) as Record<string, string>;
      return headers[header.toLowerCase()];
    }),
    header: jest.fn((header: string) => {
      const headers = (overrides.headers || {}) as Record<string, string>;
      return headers[header.toLowerCase()];
    }),
    accepts: jest.fn(),
    acceptsCharsets: jest.fn(),
    acceptsEncodings: jest.fn(),
    acceptsLanguages: jest.fn(),
    is: jest.fn(),
    range: jest.fn(),
    ...overrides,
  } as unknown as Request;

  return req;
}

/**
 * Create a mock Express Response object.
 * Useful for unit testing route handlers and middleware.
 *
 * @param overrides - Partial response properties to override defaults
 * @returns Mock Response object with Jest mocks
 */
export function createMockResponse(
  overrides: Partial<Response> = {}
): Response & {
  _status: number;
  _json: unknown;
  _data: string;
  _headers: Record<string, string>;
} {
  const res = {
    _status: 200,
    _json: null as unknown,
    _data: '',
    _headers: {} as Record<string, string>,

    status: jest.fn(function (this: typeof res, code: number) {
      this._status = code;
      return this;
    }),

    json: jest.fn(function (this: typeof res, data: unknown) {
      this._json = data;
      return this;
    }),

    send: jest.fn(function (this: typeof res, data: string) {
      this._data = data;
      return this;
    }),

    end: jest.fn(function (this: typeof res) {
      return this;
    }),

    set: jest.fn(function (
      this: typeof res,
      header: string | Record<string, string>,
      value?: string
    ) {
      if (typeof header === 'object') {
        Object.assign(this._headers, header);
      } else if (value !== undefined) {
        this._headers[header.toLowerCase()] = value;
      }
      return this;
    }),

    setHeader: jest.fn(function (this: typeof res, name: string, value: string) {
      this._headers[name.toLowerCase()] = value;
      return this;
    }),

    get: jest.fn(function (this: typeof res, header: string) {
      return this._headers[header.toLowerCase()];
    }),

    redirect: jest.fn(),
    render: jest.fn(),
    type: jest.fn(function (this: typeof res) {
      return this;
    }),
    cookie: jest.fn(function (this: typeof res) {
      return this;
    }),
    clearCookie: jest.fn(function (this: typeof res) {
      return this;
    }),
    attachment: jest.fn(function (this: typeof res) {
      return this;
    }),
    download: jest.fn(),
    format: jest.fn(),
    links: jest.fn(function (this: typeof res) {
      return this;
    }),
    location: jest.fn(function (this: typeof res) {
      return this;
    }),
    vary: jest.fn(function (this: typeof res) {
      return this;
    }),

    headersSent: false,
    locals: {},
    app: {} as unknown,

    ...overrides,
  } as Response & {
    _status: number;
    _json: unknown;
    _data: string;
    _headers: Record<string, string>;
  };

  return res;
}

/**
 * Create a mock NextFunction for middleware testing.
 *
 * @returns Mock next function with Jest mock
 */
export function createMockNext(): NextFunction & jest.Mock {
  return jest.fn() as NextFunction & jest.Mock;
}

/**
 * Create a full Express test context with request, response, and next.
 *
 * @param reqOverrides - Request overrides
 * @returns Object with req, res, and next
 */
export function createExpressContext(
  reqOverrides: Partial<Request> & {
    body?: Record<string, unknown>;
    params?: Record<string, string>;
    query?: Record<string, string>;
    headers?: Record<string, string>;
  } = {}
) {
  return {
    req: createMockRequest(reqOverrides),
    res: createMockResponse(),
    next: createMockNext(),
  };
}

/**
 * Test fixture factory for creating game sessions.
 */
export const gameSessionFactory = {
  create(
    overrides: Partial<{
      id: string;
      game_type: 'snake' | 'tetris';
      player_address: string;
      payment_tx_hash: string;
      amount_paid_usdc: number;
      score: number | null;
      status: 'active' | 'completed' | 'expired';
      created_at: string;
    }> = {}
  ) {
    const id = overrides.id || `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    return {
      id,
      game_type: 'snake' as const,
      player_address: '0x' + '1'.repeat(40),
      payment_tx_hash: '0x' + '2'.repeat(64),
      amount_paid_usdc: 0.01,
      score: null,
      status: 'active' as const,
      created_at: new Date().toISOString(),
      completed_at: null,
      game_duration_ms: null,
      ...overrides,
    };
  },
};

/**
 * Test fixture factory for creating leaderboard entries.
 */
export const leaderboardEntryFactory = {
  create(
    overrides: Partial<{
      id: number;
      session_id: string;
      game_type: 'snake' | 'tetris';
      player_address: string;
      score: number;
      period_type: 'daily' | 'weekly' | 'alltime';
      period_date: string;
      rank: number | null;
    }> = {}
  ) {
    return {
      id: overrides.id || Math.floor(Math.random() * 10000),
      session_id: `session_${Date.now()}`,
      game_type: 'snake' as const,
      player_address: '0x' + '1'.repeat(40),
      score: 100,
      period_type: 'daily' as const,
      period_date: new Date().toISOString().split('T')[0],
      rank: null,
      created_at: new Date().toISOString(),
      ...overrides,
    };
  },
};

/**
 * Test fixture factory for creating payments.
 */
export const paymentFactory = {
  create(
    overrides: Partial<{
      id: number;
      tx_hash: string;
      from_address: string;
      to_address: string;
      amount_usdc: number;
      purpose: 'game_payment' | 'prize_payout';
      status: string;
    }> = {}
  ) {
    return {
      id: overrides.id || Math.floor(Math.random() * 10000),
      tx_hash: '0x' + Math.random().toString(16).slice(2).padEnd(64, '0'),
      from_address: '0x' + '1'.repeat(40),
      to_address: '0x' + '2'.repeat(40),
      amount_usdc: 0.01,
      purpose: 'game_payment' as const,
      status: 'pending',
      created_at: new Date().toISOString(),
      confirmed_at: null,
      ...overrides,
    };
  },
};

/**
 * Wait for a specified amount of time.
 * Useful for testing async operations.
 *
 * @param ms - Milliseconds to wait
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a mock database connection for testing.
 * Returns mock functions for common database operations.
 */
export function createMockDatabase() {
  return {
    run: jest.fn(),
    get: jest.fn(),
    all: jest.fn(),
    prepare: jest.fn(() => ({
      run: jest.fn(),
      get: jest.fn(),
      all: jest.fn(),
      finalize: jest.fn(),
    })),
    exec: jest.fn(),
    close: jest.fn(),
  };
}

/**
 * Environment variable helper for tests.
 * Temporarily sets environment variables and restores them after.
 */
export function withEnv(env: Record<string, string>, fn: () => Promise<void> | void) {
  const original: Record<string, string | undefined> = {};

  return async () => {
    // Save original values
    for (const key of Object.keys(env)) {
      original[key] = process.env[key];
      process.env[key] = env[key];
    }

    try {
      await fn();
    } finally {
      // Restore original values
      for (const [key, value] of Object.entries(original)) {
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      }
    }
  };
}
