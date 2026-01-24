/**
 * API Test Client
 *
 * A typed wrapper around supertest for consistent API testing patterns.
 * Provides automatic JSON parsing, type inference, and authentication support.
 */

import request, { type Response, type Test } from 'supertest';
import type { Application } from 'express';

/**
 * Standard API response structure.
 */
export interface ApiResponse<T = unknown> {
  status: number;
  body: T;
  headers: Record<string, string | string[] | undefined>;
  ok: boolean;
  error?: Error;
}

/**
 * Request options for API calls.
 */
export interface RequestOptions {
  /** Authentication token to include in X-Payment header */
  authToken?: string;
  /** Custom headers to include */
  headers?: Record<string, string>;
  /** Query parameters */
  query?: Record<string, string | number | boolean>;
  /** Expected content type (defaults to application/json) */
  contentType?: string;
}

/**
 * Configuration for the test API client.
 */
export interface TestApiClientConfig {
  /** Base path for all requests (e.g., '/api') */
  basePath?: string;
  /** Default headers to include in all requests */
  defaultHeaders?: Record<string, string>;
  /** Default auth token for authenticated requests */
  defaultAuthToken?: string;
}

/**
 * Test API Client - wraps supertest for typed API testing.
 *
 * @example
 * ```typescript
 * const client = new TestApiClient(app, { basePath: '/api' });
 *
 * // GET request with type inference
 * const { body, status } = await client.get<GameSession[]>('/sessions');
 *
 * // POST request with body
 * const { body } = await client.post<GameSession>('/play', {
 *   game_type: 'snake',
 *   player_address: '0x123...'
 * });
 *
 * // Authenticated request
 * const { body } = await client.get<LeaderboardEntry[]>('/leaderboard', {
 *   authToken: 'my-auth-token'
 * });
 * ```
 */
export class TestApiClient {
  private app: Application;
  private config: TestApiClientConfig;

  constructor(app: Application, config: TestApiClientConfig = {}) {
    this.app = app;
    this.config = {
      basePath: '',
      defaultHeaders: {},
      ...config,
    };
  }

  /**
   * Build the full URL path.
   */
  private buildPath(path: string): string {
    const basePath = this.config.basePath || '';
    const normalizedBase = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${normalizedBase}${normalizedPath}`;
  }

  /**
   * Apply common request configuration.
   */
  private applyOptions(req: Test, options: RequestOptions = {}): Test {
    // Apply default headers
    if (this.config.defaultHeaders) {
      for (const [key, value] of Object.entries(this.config.defaultHeaders)) {
        req = req.set(key, value);
      }
    }

    // Apply custom headers
    if (options.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        req = req.set(key, value);
      }
    }

    // Apply authentication
    const authToken = options.authToken || this.config.defaultAuthToken;
    if (authToken) {
      req = req.set('X-Payment', authToken);
    }

    // Apply query parameters
    if (options.query) {
      req = req.query(options.query);
    }

    // Set content type
    if (options.contentType) {
      req = req.set('Content-Type', options.contentType);
    }

    return req;
  }

  /**
   * Convert supertest response to typed ApiResponse.
   */
  private toApiResponse<T>(response: Response): ApiResponse<T> {
    return {
      status: response.status,
      body: response.body as T,
      headers: response.headers as Record<string, string | string[] | undefined>,
      ok: response.ok,
      error: response.error || undefined,
    };
  }

  /**
   * Perform a GET request.
   *
   * @param path - The request path
   * @param options - Request options
   * @returns Typed API response
   */
  async get<T = unknown>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const fullPath = this.buildPath(path);
    let req = request(this.app).get(fullPath);
    req = this.applyOptions(req, options);

    const response = await req;
    return this.toApiResponse<T>(response);
  }

  /**
   * Perform a POST request.
   *
   * @param path - The request path
   * @param body - Request body
   * @param options - Request options
   * @returns Typed API response
   */
  async post<T = unknown>(
    path: string,
    body?: Record<string, unknown>,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const fullPath = this.buildPath(path);
    let req = request(this.app).post(fullPath);
    req = this.applyOptions(req, options);

    if (body) {
      req = req.send(body);
    }

    const response = await req;
    return this.toApiResponse<T>(response);
  }

  /**
   * Perform a PUT request.
   *
   * @param path - The request path
   * @param body - Request body
   * @param options - Request options
   * @returns Typed API response
   */
  async put<T = unknown>(
    path: string,
    body?: Record<string, unknown>,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const fullPath = this.buildPath(path);
    let req = request(this.app).put(fullPath);
    req = this.applyOptions(req, options);

    if (body) {
      req = req.send(body);
    }

    const response = await req;
    return this.toApiResponse<T>(response);
  }

  /**
   * Perform a PATCH request.
   *
   * @param path - The request path
   * @param body - Request body
   * @param options - Request options
   * @returns Typed API response
   */
  async patch<T = unknown>(
    path: string,
    body?: Record<string, unknown>,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const fullPath = this.buildPath(path);
    let req = request(this.app).patch(fullPath);
    req = this.applyOptions(req, options);

    if (body) {
      req = req.send(body);
    }

    const response = await req;
    return this.toApiResponse<T>(response);
  }

  /**
   * Perform a DELETE request.
   *
   * @param path - The request path
   * @param options - Request options
   * @returns Typed API response
   */
  async delete<T = unknown>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const fullPath = this.buildPath(path);
    let req = request(this.app).delete(fullPath);
    req = this.applyOptions(req, options);

    const response = await req;
    return this.toApiResponse<T>(response);
  }

  /**
   * Set default authentication token for all subsequent requests.
   */
  setDefaultAuthToken(token: string | undefined): void {
    this.config.defaultAuthToken = token;
  }

  /**
   * Clear default authentication token.
   */
  clearDefaultAuthToken(): void {
    this.config.defaultAuthToken = undefined;
  }

  /**
   * Get the raw supertest agent for custom requests.
   */
  raw(): ReturnType<typeof request> {
    return request(this.app);
  }
}

/**
 * Response assertion helpers for common API test patterns.
 */
export const assertResponse = {
  /**
   * Assert that response indicates success (2xx status).
   */
  isSuccess<T>(response: ApiResponse<T>): void {
    if (response.status < 200 || response.status >= 300) {
      throw new Error(
        `Expected success status (2xx), got ${response.status}: ${JSON.stringify(response.body)}`
      );
    }
  },

  /**
   * Assert that response has specific status code.
   */
  hasStatus<T>(response: ApiResponse<T>, expectedStatus: number): void {
    if (response.status !== expectedStatus) {
      throw new Error(
        `Expected status ${expectedStatus}, got ${response.status}: ${JSON.stringify(response.body)}`
      );
    }
  },

  /**
   * Assert that response is 200 OK.
   */
  isOk<T>(response: ApiResponse<T>): void {
    assertResponse.hasStatus(response, 200);
  },

  /**
   * Assert that response is 201 Created.
   */
  isCreated<T>(response: ApiResponse<T>): void {
    assertResponse.hasStatus(response, 201);
  },

  /**
   * Assert that response is 204 No Content.
   */
  isNoContent<T>(response: ApiResponse<T>): void {
    assertResponse.hasStatus(response, 204);
  },

  /**
   * Assert that response is 400 Bad Request.
   */
  isBadRequest<T>(response: ApiResponse<T>): void {
    assertResponse.hasStatus(response, 400);
  },

  /**
   * Assert that response is 401 Unauthorized.
   */
  isUnauthorized<T>(response: ApiResponse<T>): void {
    assertResponse.hasStatus(response, 401);
  },

  /**
   * Assert that response is 402 Payment Required.
   */
  isPaymentRequired<T>(response: ApiResponse<T>): void {
    assertResponse.hasStatus(response, 402);
  },

  /**
   * Assert that response is 403 Forbidden.
   */
  isForbidden<T>(response: ApiResponse<T>): void {
    assertResponse.hasStatus(response, 403);
  },

  /**
   * Assert that response is 404 Not Found.
   */
  isNotFound<T>(response: ApiResponse<T>): void {
    assertResponse.hasStatus(response, 404);
  },

  /**
   * Assert that response is 500 Internal Server Error.
   */
  isServerError<T>(response: ApiResponse<T>): void {
    assertResponse.hasStatus(response, 500);
  },

  /**
   * Assert that response body has specific property.
   */
  hasProperty<T>(response: ApiResponse<T>, property: keyof T): void {
    if (!(property in (response.body as object))) {
      throw new Error(
        `Expected body to have property "${String(property)}", got: ${JSON.stringify(response.body)}`
      );
    }
  },

  /**
   * Assert that response body matches expected shape.
   */
  bodyMatches<T>(response: ApiResponse<T>, expected: Partial<T>): void {
    const body = response.body as Record<string, unknown>;
    for (const [key, value] of Object.entries(expected)) {
      if (body[key] !== value) {
        throw new Error(
          `Expected body.${key} to be ${JSON.stringify(value)}, got ${JSON.stringify(body[key])}`
        );
      }
    }
  },

  /**
   * Assert that response has specific header.
   */
  hasHeader<T>(response: ApiResponse<T>, header: string, expectedValue?: string): void {
    const headerValue = response.headers[header.toLowerCase()];
    if (headerValue === undefined) {
      throw new Error(`Expected response to have header "${header}"`);
    }
    if (expectedValue !== undefined && headerValue !== expectedValue) {
      throw new Error(`Expected header "${header}" to be "${expectedValue}", got "${headerValue}"`);
    }
  },

  /**
   * Assert that response body is an array with expected length.
   */
  isArrayWithLength<T>(response: ApiResponse<T[]>, expectedLength: number): void {
    if (!Array.isArray(response.body)) {
      throw new Error(`Expected body to be an array, got: ${typeof response.body}`);
    }
    if (response.body.length !== expectedLength) {
      throw new Error(`Expected array length ${expectedLength}, got ${response.body.length}`);
    }
  },

  /**
   * Assert that response body is an array with at least specified length.
   */
  isArrayWithMinLength<T>(response: ApiResponse<T[]>, minLength: number): void {
    if (!Array.isArray(response.body)) {
      throw new Error(`Expected body to be an array, got: ${typeof response.body}`);
    }
    if (response.body.length < minLength) {
      throw new Error(`Expected array length >= ${minLength}, got ${response.body.length}`);
    }
  },
};

/**
 * Create a test API client with the given Express app.
 *
 * @param app - The Express application
 * @param config - Optional configuration
 * @returns A new TestApiClient instance
 */
export function createTestApiClient(
  app: Application,
  config: TestApiClientConfig = {}
): TestApiClient {
  return new TestApiClient(app, config);
}
