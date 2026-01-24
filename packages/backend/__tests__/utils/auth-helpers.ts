/**
 * Authentication Test Helpers
 *
 * Utilities for testing authenticated endpoints with various wallet states,
 * payment signatures, and permissions in the x402Arcade application.
 */

import { jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import { createMockRequest, createMockResponse, createMockNext } from './test-helpers';
import { type TestApiClient, type ApiResponse } from './api-client';

/**
 * Test wallet configuration.
 */
export interface TestWallet {
  address: string;
  privateKey: string;
  role: 'admin' | 'user' | 'guest';
}

/**
 * Predefined test wallets for common scenarios.
 */
export const TEST_WALLETS = {
  /** Admin wallet with full permissions */
  admin: {
    address: '0xADMIN0000000000000000000000000000000001',
    privateKey: '0x' + 'a'.repeat(64),
    role: 'admin' as const,
  },
  /** Regular user wallet */
  user: {
    address: '0xUSER00000000000000000000000000000000001',
    privateKey: '0x' + 'b'.repeat(64),
    role: 'user' as const,
  },
  /** Another user wallet for multi-user testing */
  user2: {
    address: '0xUSER00000000000000000000000000000000002',
    privateKey: '0x' + 'c'.repeat(64),
    role: 'user' as const,
  },
  /** Guest/unauthenticated wallet */
  guest: {
    address: '0x0000000000000000000000000000000000000000',
    privateKey: '0x' + '0'.repeat(64),
    role: 'guest' as const,
  },
  /** Arcade platform wallet (receives payments) */
  arcade: {
    address: '0xA0CADE0000000000000000000000000000000001',
    privateKey: '0x' + 'd'.repeat(64),
    role: 'admin' as const,
  },
};

/**
 * Counter for generating unique wallet addresses.
 */
let walletCounter = 0;

/**
 * Generate a unique test wallet address.
 * Each call generates a new unique address.
 *
 * @param prefix - Optional prefix for the address (for identification in logs)
 * @returns A unique Ethereum-style address
 */
export function generateTestWalletAddress(prefix: string = 'TEST'): string {
  walletCounter++;
  const paddedCounter = walletCounter.toString().padStart(4, '0');
  const paddedPrefix = prefix.toUpperCase().slice(0, 6).padEnd(6, '0');
  // 40 hex chars total: 6 prefix + 4 counter + 30 padding
  return `0x${paddedPrefix}${paddedCounter}${'0'.repeat(30)}`;
}

/**
 * Reset the wallet counter (useful for test isolation).
 */
export function resetWalletCounter(): void {
  walletCounter = 0;
}

/**
 * Generate a complete test wallet with address and private key.
 *
 * @param role - The role for this test wallet
 * @returns A complete TestWallet object
 */
export function generateTestWallet(role: 'admin' | 'user' | 'guest' = 'user'): TestWallet {
  const address = generateTestWalletAddress(role.toUpperCase());
  const privateKey = '0x' + Math.random().toString(16).slice(2).padEnd(64, '0');
  return { address, privateKey, role };
}

/**
 * x402 Payment header structure.
 */
export interface X402PaymentHeader {
  /** Signature version */
  version: string;
  /** Payment amount in token units */
  amount: string;
  /** Token contract address */
  token: string;
  /** Payer's wallet address */
  from: string;
  /** Recipient's wallet address */
  to: string;
  /** Unique nonce */
  nonce: string;
  /** Expiration timestamp */
  deadline: string;
  /** EIP-3009 signature */
  signature: string;
}

/**
 * Create a mock x402 payment header.
 * This simulates the payment authorization that would come from a real wallet.
 *
 * @param options - Payment header options
 * @returns Encoded payment header string
 */
export function createMockPaymentHeader(
  options: Partial<X402PaymentHeader> & { from: string }
): string {
  const header: X402PaymentHeader = {
    version: '1',
    amount: '10000', // 0.01 USDC (6 decimals)
    token: '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0', // devUSDC.e
    to: TEST_WALLETS.arcade.address,
    nonce: Math.random().toString(16).slice(2, 18),
    deadline: (Math.floor(Date.now() / 1000) + 3600).toString(), // 1 hour from now
    signature: '0x' + Math.random().toString(16).slice(2).padEnd(130, '0'),
    ...options,
  };

  // Encode as base64 JSON (simplified format for testing)
  return Buffer.from(JSON.stringify(header)).toString('base64');
}

/**
 * Parse a mock payment header back to its components.
 *
 * @param headerValue - The encoded header value
 * @returns Parsed payment header
 */
export function parsePaymentHeader(headerValue: string): X402PaymentHeader {
  const decoded = Buffer.from(headerValue, 'base64').toString('utf-8');
  return JSON.parse(decoded) as X402PaymentHeader;
}

/**
 * Create an authenticated mock request with wallet context.
 *
 * @param wallet - The wallet to authenticate as
 * @param options - Additional request options
 * @returns Mock Request with authentication headers
 */
export function createAuthenticatedRequest(
  wallet: TestWallet,
  options: {
    body?: Record<string, unknown>;
    params?: Record<string, string>;
    query?: Record<string, string>;
    includePayment?: boolean;
    paymentAmount?: number;
  } = {}
): Request {
  const headers: Record<string, string> = {
    'x-wallet-address': wallet.address,
  };

  // Add payment header if requested
  if (options.includePayment) {
    const amount = options.paymentAmount ?? 10000; // 0.01 USDC default
    headers['x-payment'] = createMockPaymentHeader({
      from: wallet.address,
      amount: amount.toString(),
    });
  }

  return createMockRequest({
    body: options.body ?? {},
    params: options.params ?? {},
    query: options.query ?? {},
    headers,
  });
}

/**
 * Create an unauthenticated mock request (no wallet context).
 *
 * @param options - Request options
 * @returns Mock Request without authentication
 */
export function createUnauthenticatedRequest(
  options: {
    body?: Record<string, unknown>;
    params?: Record<string, string>;
    query?: Record<string, string>;
  } = {}
): Request {
  return createMockRequest({
    body: options.body ?? {},
    params: options.params ?? {},
    query: options.query ?? {},
    headers: {},
  });
}

/**
 * Authentication context for testing different user types.
 */
export interface AuthContext {
  wallet: TestWallet;
  createRequest: (options?: {
    body?: Record<string, unknown>;
    params?: Record<string, string>;
    query?: Record<string, string>;
    includePayment?: boolean;
  }) => Request;
  paymentHeader: string;
}

/**
 * Create an authentication context as an admin user.
 */
export function asAdmin(): AuthContext {
  const wallet = TEST_WALLETS.admin;
  return {
    wallet,
    createRequest: (options = {}) => createAuthenticatedRequest(wallet, options),
    paymentHeader: createMockPaymentHeader({ from: wallet.address }),
  };
}

/**
 * Create an authentication context as a regular user.
 */
export function asUser(wallet?: TestWallet): AuthContext {
  const userWallet = wallet ?? TEST_WALLETS.user;
  return {
    wallet: userWallet,
    createRequest: (options = {}) => createAuthenticatedRequest(userWallet, options),
    paymentHeader: createMockPaymentHeader({ from: userWallet.address }),
  };
}

/**
 * Create an authentication context as a guest (unauthenticated).
 */
export function asGuest(): AuthContext {
  const wallet = TEST_WALLETS.guest;
  return {
    wallet,
    createRequest: (options = {}) => createUnauthenticatedRequest(options),
    paymentHeader: '', // Guests don't have payment headers
  };
}

/**
 * Create authentication context with a new unique wallet.
 */
export function asNewUser(): AuthContext {
  const wallet = generateTestWallet('user');
  return {
    wallet,
    createRequest: (options = {}) => createAuthenticatedRequest(wallet, options),
    paymentHeader: createMockPaymentHeader({ from: wallet.address }),
  };
}

/**
 * Verify that an endpoint requires authentication.
 * Calls the endpoint without auth and expects 401 or 402.
 *
 * @param response - The response from an unauthenticated request
 * @throws Error if authentication was not required
 */
export function verifyAuthRequired<T>(response: ApiResponse<T>): void {
  const authRequiredStatuses = [401, 402];
  if (!authRequiredStatuses.includes(response.status)) {
    throw new Error(
      `Expected authentication to be required (401 or 402), but got ${response.status}. ` +
        `Body: ${JSON.stringify(response.body)}`
    );
  }
}

/**
 * Verify that an endpoint requires payment (402).
 *
 * @param response - The response from a request without payment
 * @throws Error if payment was not required
 */
export function verifyPaymentRequired<T>(response: ApiResponse<T>): void {
  if (response.status !== 402) {
    throw new Error(
      `Expected payment to be required (402), but got ${response.status}. ` +
        `Body: ${JSON.stringify(response.body)}`
    );
  }
}

/**
 * Verify that an endpoint denies access (403).
 *
 * @param response - The response from a forbidden request
 * @throws Error if access was not denied
 */
export function verifyAccessDenied<T>(response: ApiResponse<T>): void {
  if (response.status !== 403) {
    throw new Error(
      `Expected access to be denied (403), but got ${response.status}. ` +
        `Body: ${JSON.stringify(response.body)}`
    );
  }
}

/**
 * Create a middleware testing context with pre-configured auth.
 */
export function createMiddlewareTestContext(wallet?: TestWallet) {
  const effectiveWallet = wallet ?? TEST_WALLETS.user;

  return {
    req: createAuthenticatedRequest(effectiveWallet),
    res: createMockResponse(),
    next: createMockNext(),
    wallet: effectiveWallet,
  };
}

/**
 * Mock the authentication middleware for testing.
 * This allows testing routes without actual wallet signature verification.
 */
export function createMockAuthMiddleware(defaultWallet?: TestWallet) {
  return jest.fn((req: Request, res: Response, next: NextFunction) => {
    const walletHeader = req.header('x-wallet-address');

    if (walletHeader) {
      // Attach wallet info to request
      (req as Request & { wallet?: TestWallet }).wallet = {
        address: walletHeader,
        privateKey: '0x' + '0'.repeat(64),
        role: walletHeader === TEST_WALLETS.admin.address ? 'admin' : 'user',
      };
    } else if (defaultWallet) {
      (req as Request & { wallet?: TestWallet }).wallet = defaultWallet;
    }

    next();
  });
}

/**
 * Create request options for TestApiClient with authentication.
 *
 * @param wallet - The wallet to authenticate as
 * @param includePayment - Whether to include payment header
 * @returns Request options object
 */
export function createAuthOptions(
  wallet: TestWallet,
  includePayment: boolean = false
): { authToken?: string; headers: Record<string, string> } {
  const headers: Record<string, string> = {
    'x-wallet-address': wallet.address,
  };

  const options: { authToken?: string; headers: Record<string, string> } = { headers };

  if (includePayment) {
    options.authToken = createMockPaymentHeader({ from: wallet.address });
  }

  return options;
}

/**
 * Helper to test an endpoint with multiple authentication states.
 *
 * @param client - The TestApiClient instance
 * @param method - HTTP method
 * @param path - Request path
 * @param expectations - Expected status codes for each auth state
 */
export async function testAuthStates(
  client: TestApiClient,
  method: 'get' | 'post' | 'put' | 'delete',
  path: string,
  expectations: {
    guest?: number;
    user?: number;
    admin?: number;
    withPayment?: number;
  }
): Promise<void> {
  const results: Array<{ state: string; expected: number; actual: number }> = [];

  // Helper to make requests with proper signature based on method
  const makeRequest = async (options?: { headers?: Record<string, string>; authToken?: string }) => {
    if (method === 'get' || method === 'delete') {
      // GET and DELETE have signature: (path, options)
      return client[method](path, options);
    } else {
      // POST and PUT have signature: (path, body, options)
      return client[method](path, undefined, options);
    }
  };

  // Test as guest
  if (expectations.guest !== undefined) {
    const response = await makeRequest();
    results.push({
      state: 'guest',
      expected: expectations.guest,
      actual: response.status,
    });
  }

  // Test as user
  if (expectations.user !== undefined) {
    const response = await makeRequest({
      headers: { 'x-wallet-address': TEST_WALLETS.user.address },
    });
    results.push({
      state: 'user',
      expected: expectations.user,
      actual: response.status,
    });
  }

  // Test as admin
  if (expectations.admin !== undefined) {
    const response = await makeRequest({
      headers: { 'x-wallet-address': TEST_WALLETS.admin.address },
    });
    results.push({
      state: 'admin',
      expected: expectations.admin,
      actual: response.status,
    });
  }

  // Test with payment
  if (expectations.withPayment !== undefined) {
    const response = await makeRequest({
      authToken: createMockPaymentHeader({ from: TEST_WALLETS.user.address }),
    });
    results.push({
      state: 'withPayment',
      expected: expectations.withPayment,
      actual: response.status,
    });
  }

  // Check all expectations
  const failures = results.filter((r) => r.expected !== r.actual);
  if (failures.length > 0) {
    const messages = failures.map(
      (f) => `${f.state}: expected ${f.expected}, got ${f.actual}`
    );
    throw new Error(`Auth state test failures:\n${messages.join('\n')}`);
  }
}
