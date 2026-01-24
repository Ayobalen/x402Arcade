/**
 * Tests for Authentication Test Helpers
 *
 * Verifies that the auth helpers provide proper wallet generation,
 * payment header creation, and authentication context utilities.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import express, { type Application, type Request, type Response } from 'express';
import {
  TEST_WALLETS,
  generateTestWalletAddress,
  generateTestWallet,
  resetWalletCounter,
  createMockPaymentHeader,
  parsePaymentHeader,
  createAuthenticatedRequest,
  createUnauthenticatedRequest,
  asAdmin,
  asUser,
  asGuest,
  asNewUser,
  verifyAuthRequired,
  verifyPaymentRequired,
  verifyAccessDenied,
  createMiddlewareTestContext,
  createMockAuthMiddleware,
  createAuthOptions,
  testAuthStates,
  TestApiClient,
  type ApiResponse,
} from '../utils';

describe('Authentication Test Helpers', () => {
  describe('TEST_WALLETS', () => {
    it('should provide predefined admin wallet', () => {
      expect(TEST_WALLETS.admin).toBeDefined();
      expect(TEST_WALLETS.admin.address).toMatch(/^0x/);
      expect(TEST_WALLETS.admin.role).toBe('admin');
    });

    it('should provide predefined user wallets', () => {
      expect(TEST_WALLETS.user).toBeDefined();
      expect(TEST_WALLETS.user2).toBeDefined();
      expect(TEST_WALLETS.user.address).not.toBe(TEST_WALLETS.user2.address);
      expect(TEST_WALLETS.user.role).toBe('user');
    });

    it('should provide guest wallet', () => {
      expect(TEST_WALLETS.guest).toBeDefined();
      expect(TEST_WALLETS.guest.role).toBe('guest');
    });

    it('should provide arcade platform wallet', () => {
      expect(TEST_WALLETS.arcade).toBeDefined();
      expect(TEST_WALLETS.arcade.address).toMatch(/^0x/);
    });

    it('should have unique addresses for all wallets', () => {
      const addresses = [
        TEST_WALLETS.admin.address,
        TEST_WALLETS.user.address,
        TEST_WALLETS.user2.address,
        TEST_WALLETS.arcade.address,
      ];
      const uniqueAddresses = new Set(addresses);
      expect(uniqueAddresses.size).toBe(addresses.length);
    });
  });

  describe('generateTestWalletAddress', () => {
    beforeEach(() => {
      resetWalletCounter();
    });

    it('should generate valid Ethereum-style addresses', () => {
      const address = generateTestWalletAddress();
      expect(address).toMatch(/^0x[A-Z0-9]{40}$/);
    });

    it('should generate unique addresses on each call', () => {
      const address1 = generateTestWalletAddress();
      const address2 = generateTestWalletAddress();
      const address3 = generateTestWalletAddress();

      expect(address1).not.toBe(address2);
      expect(address2).not.toBe(address3);
      expect(address1).not.toBe(address3);
    });

    it('should include prefix in address', () => {
      const address = generateTestWalletAddress('PLAYER');
      expect(address).toContain('PLAYER');
    });

    it('should truncate long prefixes', () => {
      const address = generateTestWalletAddress('VERYLONGPREFIX');
      expect(address.length).toBe(42); // Standard Ethereum address length
    });
  });

  describe('resetWalletCounter', () => {
    it('should reset the counter for reproducible tests', () => {
      generateTestWalletAddress();
      generateTestWalletAddress();
      resetWalletCounter();

      const address1 = generateTestWalletAddress();
      resetWalletCounter();
      const address2 = generateTestWalletAddress();

      expect(address1).toBe(address2);
    });
  });

  describe('generateTestWallet', () => {
    beforeEach(() => {
      resetWalletCounter();
    });

    it('should generate a complete wallet object', () => {
      const wallet = generateTestWallet();

      expect(wallet.address).toMatch(/^0x/);
      expect(wallet.privateKey).toMatch(/^0x[a-f0-9]{64}$/);
      expect(wallet.role).toBe('user');
    });

    it('should respect role parameter', () => {
      const adminWallet = generateTestWallet('admin');
      const userWallet = generateTestWallet('user');
      const guestWallet = generateTestWallet('guest');

      expect(adminWallet.role).toBe('admin');
      expect(userWallet.role).toBe('user');
      expect(guestWallet.role).toBe('guest');
    });

    it('should generate unique wallets', () => {
      const wallet1 = generateTestWallet();
      const wallet2 = generateTestWallet();

      expect(wallet1.address).not.toBe(wallet2.address);
      expect(wallet1.privateKey).not.toBe(wallet2.privateKey);
    });
  });

  describe('createMockPaymentHeader', () => {
    it('should create a valid payment header', () => {
      const header = createMockPaymentHeader({
        from: TEST_WALLETS.user.address,
      });

      expect(header).toBeDefined();
      expect(typeof header).toBe('string');
    });

    it('should include required fields when parsed', () => {
      const header = createMockPaymentHeader({
        from: TEST_WALLETS.user.address,
      });

      const parsed = parsePaymentHeader(header);

      expect(parsed.version).toBeDefined();
      expect(parsed.amount).toBeDefined();
      expect(parsed.token).toBeDefined();
      expect(parsed.from).toBe(TEST_WALLETS.user.address);
      expect(parsed.to).toBeDefined();
      expect(parsed.nonce).toBeDefined();
      expect(parsed.deadline).toBeDefined();
      expect(parsed.signature).toBeDefined();
    });

    it('should use provided options', () => {
      const customAmount = '50000';
      const header = createMockPaymentHeader({
        from: TEST_WALLETS.user.address,
        amount: customAmount,
      });

      const parsed = parsePaymentHeader(header);
      expect(parsed.amount).toBe(customAmount);
    });

    it('should use devUSDC.e token address by default', () => {
      const header = createMockPaymentHeader({
        from: TEST_WALLETS.user.address,
      });

      const parsed = parsePaymentHeader(header);
      expect(parsed.token).toBe('0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0');
    });

    it('should have deadline in the future', () => {
      const header = createMockPaymentHeader({
        from: TEST_WALLETS.user.address,
      });

      const parsed = parsePaymentHeader(header);
      const deadline = parseInt(parsed.deadline);
      const now = Math.floor(Date.now() / 1000);

      expect(deadline).toBeGreaterThan(now);
    });
  });

  describe('createAuthenticatedRequest', () => {
    it('should create a request with wallet address header', () => {
      const req = createAuthenticatedRequest(TEST_WALLETS.user);

      expect(req.headers).toBeDefined();
      expect(req.header('x-wallet-address')).toBe(TEST_WALLETS.user.address);
    });

    it('should include payment header when requested', () => {
      const req = createAuthenticatedRequest(TEST_WALLETS.user, {
        includePayment: true,
      });

      expect(req.header('x-payment')).toBeDefined();
    });

    it('should include custom body', () => {
      const req = createAuthenticatedRequest(TEST_WALLETS.user, {
        body: { game_type: 'snake' },
      });

      expect(req.body).toEqual({ game_type: 'snake' });
    });

    it('should include custom params', () => {
      const req = createAuthenticatedRequest(TEST_WALLETS.user, {
        params: { sessionId: 'abc123' },
      });

      expect(req.params).toEqual({ sessionId: 'abc123' });
    });
  });

  describe('createUnauthenticatedRequest', () => {
    it('should create a request without auth headers', () => {
      const req = createUnauthenticatedRequest();

      expect(req.header('x-wallet-address')).toBeUndefined();
      expect(req.header('x-payment')).toBeUndefined();
    });

    it('should include custom body and params', () => {
      const req = createUnauthenticatedRequest({
        body: { test: true },
        params: { id: '123' },
      });

      expect(req.body).toEqual({ test: true });
      expect(req.params).toEqual({ id: '123' });
    });
  });

  describe('Context Helpers', () => {
    describe('asAdmin', () => {
      it('should return admin context', () => {
        const ctx = asAdmin();

        expect(ctx.wallet).toBe(TEST_WALLETS.admin);
        expect(ctx.wallet.role).toBe('admin');
      });

      it('should provide createRequest function', () => {
        const ctx = asAdmin();
        const req = ctx.createRequest();

        expect(req.header('x-wallet-address')).toBe(TEST_WALLETS.admin.address);
      });

      it('should provide payment header', () => {
        const ctx = asAdmin();

        expect(ctx.paymentHeader).toBeDefined();
        const parsed = parsePaymentHeader(ctx.paymentHeader);
        expect(parsed.from).toBe(TEST_WALLETS.admin.address);
      });
    });

    describe('asUser', () => {
      it('should return user context with default wallet', () => {
        const ctx = asUser();

        expect(ctx.wallet.role).toBe('user');
        expect(ctx.wallet.address).toBe(TEST_WALLETS.user.address);
      });

      it('should accept custom wallet', () => {
        const customWallet = generateTestWallet('user');
        const ctx = asUser(customWallet);

        expect(ctx.wallet).toBe(customWallet);
      });
    });

    describe('asGuest', () => {
      it('should return guest context', () => {
        const ctx = asGuest();

        expect(ctx.wallet.role).toBe('guest');
      });

      it('should create unauthenticated requests', () => {
        const ctx = asGuest();
        const req = ctx.createRequest();

        // Guest requests should not have wallet header
        expect(req.header('x-wallet-address')).toBeUndefined();
      });

      it('should have empty payment header', () => {
        const ctx = asGuest();

        expect(ctx.paymentHeader).toBe('');
      });
    });

    describe('asNewUser', () => {
      beforeEach(() => {
        resetWalletCounter();
      });

      it('should create a new unique user context', () => {
        const ctx1 = asNewUser();
        const ctx2 = asNewUser();

        expect(ctx1.wallet.address).not.toBe(ctx2.wallet.address);
      });

      it('should have user role', () => {
        const ctx = asNewUser();

        expect(ctx.wallet.role).toBe('user');
      });
    });
  });

  describe('Verification Helpers', () => {
    describe('verifyAuthRequired', () => {
      it('should pass for 401 status', () => {
        const response: ApiResponse<unknown> = {
          status: 401,
          body: { error: 'Unauthorized' },
          headers: {},
          ok: false,
        };

        expect(() => verifyAuthRequired(response)).not.toThrow();
      });

      it('should pass for 402 status', () => {
        const response: ApiResponse<unknown> = {
          status: 402,
          body: { error: 'Payment required' },
          headers: {},
          ok: false,
        };

        expect(() => verifyAuthRequired(response)).not.toThrow();
      });

      it('should throw for 200 status', () => {
        const response: ApiResponse<unknown> = {
          status: 200,
          body: {},
          headers: {},
          ok: true,
        };

        expect(() => verifyAuthRequired(response)).toThrow(/Expected authentication to be required/);
      });
    });

    describe('verifyPaymentRequired', () => {
      it('should pass for 402 status', () => {
        const response: ApiResponse<unknown> = {
          status: 402,
          body: {},
          headers: {},
          ok: false,
        };

        expect(() => verifyPaymentRequired(response)).not.toThrow();
      });

      it('should throw for non-402 status', () => {
        const response: ApiResponse<unknown> = {
          status: 200,
          body: {},
          headers: {},
          ok: true,
        };

        expect(() => verifyPaymentRequired(response)).toThrow(/Expected payment to be required/);
      });
    });

    describe('verifyAccessDenied', () => {
      it('should pass for 403 status', () => {
        const response: ApiResponse<unknown> = {
          status: 403,
          body: {},
          headers: {},
          ok: false,
        };

        expect(() => verifyAccessDenied(response)).not.toThrow();
      });

      it('should throw for non-403 status', () => {
        const response: ApiResponse<unknown> = {
          status: 200,
          body: {},
          headers: {},
          ok: true,
        };

        expect(() => verifyAccessDenied(response)).toThrow(/Expected access to be denied/);
      });
    });
  });

  describe('createMiddlewareTestContext', () => {
    it('should create complete middleware context', () => {
      const ctx = createMiddlewareTestContext();

      expect(ctx.req).toBeDefined();
      expect(ctx.res).toBeDefined();
      expect(ctx.next).toBeDefined();
      expect(ctx.wallet).toBeDefined();
    });

    it('should use provided wallet', () => {
      const ctx = createMiddlewareTestContext(TEST_WALLETS.admin);

      expect(ctx.wallet).toBe(TEST_WALLETS.admin);
      expect(ctx.req.header('x-wallet-address')).toBe(TEST_WALLETS.admin.address);
    });

    it('should default to user wallet', () => {
      const ctx = createMiddlewareTestContext();

      expect(ctx.wallet).toBe(TEST_WALLETS.user);
    });
  });

  describe('createMockAuthMiddleware', () => {
    it('should create a mock middleware function', () => {
      const middleware = createMockAuthMiddleware();

      expect(typeof middleware).toBe('function');
      expect(middleware).toHaveProperty('mock');
    });

    it('should attach wallet to request when header present', () => {
      const middleware = createMockAuthMiddleware();
      const req = createAuthenticatedRequest(TEST_WALLETS.admin);
      const res = {} as Response;
      const next = jest.fn();

      middleware(req, res, next);

      expect((req as Request & { wallet?: unknown }).wallet).toBeDefined();
      expect(next).toHaveBeenCalled();
    });

    it('should use default wallet when no header', () => {
      const middleware = createMockAuthMiddleware(TEST_WALLETS.admin);
      const req = createUnauthenticatedRequest();
      const res = {} as Response;
      const next = jest.fn();

      middleware(req, res, next);

      expect((req as Request & { wallet?: unknown }).wallet).toBeDefined();
    });
  });

  describe('createAuthOptions', () => {
    it('should create options with wallet header', () => {
      const options = createAuthOptions(TEST_WALLETS.user);

      expect(options.headers['x-wallet-address']).toBe(TEST_WALLETS.user.address);
    });

    it('should include payment header when requested', () => {
      const options = createAuthOptions(TEST_WALLETS.user, true);

      expect(options.authToken).toBeDefined();
    });

    it('should not include payment by default', () => {
      const options = createAuthOptions(TEST_WALLETS.user);

      expect(options.authToken).toBeUndefined();
    });
  });

  describe('testAuthStates', () => {
    let app: Application;
    let client: TestApiClient;

    beforeEach(() => {
      app = express();
      app.use(express.json());

      // Route that requires authentication
      app.get('/protected', (req: Request, res: Response) => {
        const wallet = req.header('x-wallet-address');
        if (!wallet) {
          res.status(401).json({ error: 'Unauthorized' });
          return;
        }
        res.json({ success: true });
      });

      // Route that requires admin
      app.get('/admin-only', (req: Request, res: Response) => {
        const wallet = req.header('x-wallet-address');
        if (!wallet) {
          res.status(401).json({ error: 'Unauthorized' });
          return;
        }
        if (wallet !== TEST_WALLETS.admin.address) {
          res.status(403).json({ error: 'Forbidden' });
          return;
        }
        res.json({ success: true });
      });

      client = new TestApiClient(app);
    });

    it('should test multiple auth states', async () => {
      await expect(
        testAuthStates(client, 'get', '/protected', {
          guest: 401,
          user: 200,
          admin: 200,
        })
      ).resolves.not.toThrow();
    });

    it('should detect auth state mismatches', async () => {
      await expect(
        testAuthStates(client, 'get', '/protected', {
          guest: 200, // This is wrong - should be 401
        })
      ).rejects.toThrow(/Auth state test failures/);
    });

    it('should test admin-only routes', async () => {
      await expect(
        testAuthStates(client, 'get', '/admin-only', {
          guest: 401,
          user: 403,
          admin: 200,
        })
      ).resolves.not.toThrow();
    });
  });
});
