/**
 * Unit Tests for x402 Payment Middleware
 *
 * Tests the core x402 middleware functionality including:
 * - Middleware factory function
 * - 402 Payment Required response generation
 * - X-Payment header parsing
 * - Payment payload validation
 * - Amount verification (BigInt comparison)
 * - Nonce uniqueness checking
 * - Facilitator settlement (mocked)
 *
 * @module server/middleware/__tests__/x402.test
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import express, { type Application, type Request, type Response } from 'express';
import request from 'supertest';

import { createX402Middleware } from '../x402.js';
import { type X402Config, type X402Request } from '../../x402/types.js';
import {
  resetDefaultNonceStore,
  getDefaultNonceStore,
} from '../../x402/nonce-store.js';
import {
  CRONOS_TESTNET_CHAIN_ID,
  DEFAULT_USDC_CONTRACT_ADDRESS,
} from '../../../lib/chain/constants.js';

// ============================================================================
// Test Constants
// ============================================================================

const TEST_ARCADE_WALLET = '0xA0CADE0000000000000000000000000000000001';
const TEST_PLAYER_WALLET = '0xP1AYER0000000000000000000000000000000001';
const TEST_FACILITATOR_URL = 'https://test-facilitator.example.com';

const DEFAULT_CONFIG: X402Config = {
  payTo: TEST_ARCADE_WALLET,
  paymentAmount: 10000n, // 0.01 USDC
  tokenAddress: DEFAULT_USDC_CONTRACT_ADDRESS,
  tokenName: 'devUSDC.e',
  tokenDecimals: 6,
  facilitatorUrl: TEST_FACILITATOR_URL,
  chainId: CRONOS_TESTNET_CHAIN_ID,
};

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Generate a valid test payment header matching the X402PaymentHeader interface
 */
function createTestPaymentHeader(options: {
  from?: string;
  to?: string;
  value?: string;
  validAfter?: string;
  validBefore?: string;
  nonce?: string;
} = {}): string {
  const now = Math.floor(Date.now() / 1000);

  // Generate unique nonce if not provided
  const nonce = options.nonce ?? '0x' + Math.random().toString(16).slice(2).padEnd(64, '0');

  const header = {
    x402Version: '1',
    scheme: 'exact',
    network: 'cronos-testnet',
    payload: {
      message: {
        from: options.from ?? TEST_PLAYER_WALLET,
        to: options.to ?? TEST_ARCADE_WALLET,
        value: options.value ?? '10000',
        validAfter: options.validAfter ?? '0',
        validBefore: options.validBefore ?? String(now + 3600), // 1 hour from now
        nonce: nonce,
      },
      // EIP-712 signature components (v, r, s)
      v: 27,
      r: '0x' + 'a'.repeat(64),
      s: '0x' + 'b'.repeat(64),
    },
  };

  return Buffer.from(JSON.stringify(header)).toString('base64');
}

/**
 * Generate an expired payment header
 */
function createExpiredPaymentHeader(): string {
  const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago

  return createTestPaymentHeader({
    validBefore: String(pastTime),
  });
}

/**
 * Generate a not-yet-valid payment header
 */
function createFuturePaymentHeader(): string {
  const futureTime = Math.floor(Date.now() / 1000) + 7200; // 2 hours from now

  return createTestPaymentHeader({
    validAfter: String(futureTime),
    validBefore: String(futureTime + 3600),
  });
}

/**
 * Generate a payment header with insufficient amount
 */
function createInsufficientAmountHeader(): string {
  return createTestPaymentHeader({
    value: '5000', // 0.005 USDC (less than required 0.01)
  });
}

/**
 * Generate a payment header with wrong recipient
 */
function createWrongRecipientHeader(): string {
  return createTestPaymentHeader({
    to: '0xWRONG000000000000000000000000000000001',
  });
}

// ============================================================================
// Mock Setup
// ============================================================================

// Mock the facilitator fetch
const mockFetch = jest.fn<typeof fetch>();
global.fetch = mockFetch;

// Mock successful settlement response
function mockSuccessfulSettlement(txHash = '0x' + 'b'.repeat(64)) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => ({
      success: true,
      transactionHash: txHash,
      blockNumber: 12345678,
    }),
  } as unknown as globalThis.Response);
}

// Mock failed settlement response
function mockFailedSettlement(
  errorCode: string = 'SETTLEMENT_FAILED',
  errorMessage: string = 'Settlement failed'
) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status: 402,
    json: async () => ({
      success: false,
      errorCode,
      errorMessage,
    }),
  } as unknown as globalThis.Response);
}

// ============================================================================
// Tests
// ============================================================================

describe('x402 Middleware', () => {
  let app: Application;

  beforeEach(() => {
    // Reset state
    resetDefaultNonceStore();
    mockFetch.mockReset();

    // Create fresh Express app
    app = express();
    app.use(express.json());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Middleware Factory Tests
  // --------------------------------------------------------------------------

  describe('createX402Middleware', () => {
    it('should create middleware function', () => {
      const middleware = createX402Middleware(DEFAULT_CONFIG);
      expect(typeof middleware).toBe('function');
    });

    it('should throw on invalid config', () => {
      expect(() =>
        createX402Middleware({
          ...DEFAULT_CONFIG,
          payTo: 'invalid-address',
        })
      ).toThrow();
    });

    it('should throw on missing payTo address', () => {
      const invalidConfig = { ...DEFAULT_CONFIG };
      delete (invalidConfig as Record<string, unknown>).payTo;

      expect(() => createX402Middleware(invalidConfig as X402Config)).toThrow();
    });

    it('should accept bigint paymentAmount', () => {
      const middleware = createX402Middleware({
        ...DEFAULT_CONFIG,
        paymentAmount: 10000n,
      });
      expect(typeof middleware).toBe('function');
    });

    it('should accept string paymentAmount', () => {
      const middleware = createX402Middleware({
        ...DEFAULT_CONFIG,
        paymentAmount: '10000',
      });
      expect(typeof middleware).toBe('function');
    });
  });

  // --------------------------------------------------------------------------
  // 402 Response Generation Tests
  // --------------------------------------------------------------------------

  describe('402 Payment Required Response', () => {
    it('should return 402 when no X-Payment header', async () => {
      const middleware = createX402Middleware(DEFAULT_CONFIG);
      app.get('/protected', middleware, (req: Request, res: Response) => {
        res.json({ success: true });
      });

      const response = await request(app).get('/protected');

      expect(response.status).toBe(402);
      expect(response.body.error).toBe('Payment Required');
    });

    it('should include payment requirements in 402 response', async () => {
      const middleware = createX402Middleware(DEFAULT_CONFIG);
      app.get('/protected', middleware, (req: Request, res: Response) => {
        res.json({ success: true });
      });

      const response = await request(app).get('/protected');

      expect(response.status).toBe(402);
      expect(response.body.paymentRequirements).toBeDefined();
      expect(response.body.paymentRequirements.amount).toBe('10000');
      expect(response.body.paymentRequirements.payTo).toBe(TEST_ARCADE_WALLET);
    });

    it('should include X-Payment-Required header', async () => {
      const middleware = createX402Middleware(DEFAULT_CONFIG);
      app.get('/protected', middleware, (req: Request, res: Response) => {
        res.json({ success: true });
      });

      const response = await request(app).get('/protected');

      expect(response.headers['x-payment-required']).toBeDefined();
    });

    it('should include resource path in requirements', async () => {
      const middleware = createX402Middleware(DEFAULT_CONFIG);
      app.get('/api/play/snake', middleware, (req: Request, res: Response) => {
        res.json({ success: true });
      });

      const response = await request(app).get('/api/play/snake');

      expect(response.status).toBe(402);
      expect(response.body.paymentRequirements.resource).toBe('/api/play/snake');
    });
  });

  // --------------------------------------------------------------------------
  // Header Parsing Tests
  // --------------------------------------------------------------------------

  describe('X-Payment Header Parsing', () => {
    it('should parse valid base64-encoded header', async () => {
      mockSuccessfulSettlement();

      const middleware = createX402Middleware(DEFAULT_CONFIG);
      app.post('/protected', middleware, (req: X402Request, res: Response) => {
        res.json({
          success: true,
          payload: req.x402?.payload,
        });
      });

      const header = createTestPaymentHeader();
      const response = await request(app)
        .post('/protected')
        .set('X-Payment', header);

      expect(response.status).toBe(200);
      expect(response.body.payload).toBeDefined();
    });

    it('should reject invalid base64', async () => {
      const middleware = createX402Middleware(DEFAULT_CONFIG);
      app.post('/protected', middleware, (req: Request, res: Response) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .post('/protected')
        .set('X-Payment', '!!!invalid-base64!!!');

      expect(response.status).toBe(402);
      expect(response.body.code).toMatch(/INVALID/i);
    });

    it('should reject invalid JSON in header', async () => {
      const middleware = createX402Middleware(DEFAULT_CONFIG);
      app.post('/protected', middleware, (req: Request, res: Response) => {
        res.json({ success: true });
      });

      const invalidJson = Buffer.from('not json').toString('base64');
      const response = await request(app)
        .post('/protected')
        .set('X-Payment', invalidJson);

      expect(response.status).toBe(402);
    });

    it('should reject wrong x402Version', async () => {
      const middleware = createX402Middleware(DEFAULT_CONFIG);
      app.post('/protected', middleware, (req: Request, res: Response) => {
        res.json({ success: true });
      });

      const header = {
        x402Version: '99',
        scheme: 'exact',
        payload: {
          signature: '0x' + 'a'.repeat(130),
          message: {
            from: TEST_PLAYER_WALLET,
            to: TEST_ARCADE_WALLET,
            value: '10000',
            validAfter: '0',
            validBefore: String(Math.floor(Date.now() / 1000) + 3600),
            nonce: '0x' + '1'.repeat(64),
          },
        },
      };

      const response = await request(app)
        .post('/protected')
        .set('X-Payment', Buffer.from(JSON.stringify(header)).toString('base64'));

      expect(response.status).toBe(402);
      expect(response.body.code).toMatch(/VERSION/i);
    });
  });

  // --------------------------------------------------------------------------
  // Payload Validation Tests
  // --------------------------------------------------------------------------

  describe('Payment Payload Validation', () => {
    it('should reject missing from address', async () => {
      const middleware = createX402Middleware(DEFAULT_CONFIG);
      app.post('/protected', middleware, (req: Request, res: Response) => {
        res.json({ success: true });
      });

      const header = {
        x402Version: '1',
        scheme: 'exact',
        payload: {
          signature: '0x' + 'a'.repeat(130),
          message: {
            // from: TEST_PLAYER_WALLET, // Missing!
            to: TEST_ARCADE_WALLET,
            value: '10000',
            validAfter: '0',
            validBefore: String(Math.floor(Date.now() / 1000) + 3600),
            nonce: '0x' + '1'.repeat(64),
          },
        },
      };

      const response = await request(app)
        .post('/protected')
        .set('X-Payment', Buffer.from(JSON.stringify(header)).toString('base64'));

      expect(response.status).toBe(402);
    });

    it('should reject invalid address format', async () => {
      const middleware = createX402Middleware(DEFAULT_CONFIG);
      app.post('/protected', middleware, (req: Request, res: Response) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .post('/protected')
        .set('X-Payment', createTestPaymentHeader({ from: 'invalid' }));

      expect(response.status).toBe(402);
    });

    it('should reject invalid nonce format', async () => {
      const middleware = createX402Middleware(DEFAULT_CONFIG);
      app.post('/protected', middleware, (req: Request, res: Response) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .post('/protected')
        .set('X-Payment', createTestPaymentHeader({ nonce: '0x123' })); // Too short

      expect(response.status).toBe(402);
    });
  });

  // --------------------------------------------------------------------------
  // Amount Verification Tests
  // --------------------------------------------------------------------------

  describe('Payment Amount Verification', () => {
    it('should accept exact payment amount', async () => {
      mockSuccessfulSettlement();

      const middleware = createX402Middleware(DEFAULT_CONFIG);
      app.post('/protected', middleware, (req: Request, res: Response) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .post('/protected')
        .set('X-Payment', createTestPaymentHeader({ value: '10000' }));

      expect(response.status).toBe(200);
    });

    it('should accept overpayment', async () => {
      mockSuccessfulSettlement();

      const middleware = createX402Middleware(DEFAULT_CONFIG);
      app.post('/protected', middleware, (req: Request, res: Response) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .post('/protected')
        .set('X-Payment', createTestPaymentHeader({ value: '20000' })); // 2x amount

      expect(response.status).toBe(200);
    });

    it('should reject insufficient payment', async () => {
      const middleware = createX402Middleware(DEFAULT_CONFIG);
      app.post('/protected', middleware, (req: Request, res: Response) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .post('/protected')
        .set('X-Payment', createInsufficientAmountHeader());

      expect(response.status).toBe(402);
      expect(response.body.code).toMatch(/AMOUNT/i);
    });

    it('should use BigInt for precise comparison', async () => {
      mockSuccessfulSettlement();

      // Use a large amount that would lose precision with floats
      const bigAmountConfig: X402Config = {
        ...DEFAULT_CONFIG,
        paymentAmount: BigInt('9007199254740993'), // Larger than MAX_SAFE_INTEGER
      };

      const middleware = createX402Middleware(bigAmountConfig);
      app.post('/protected', middleware, (req: Request, res: Response) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .post('/protected')
        .set('X-Payment', createTestPaymentHeader({ value: '9007199254740993' }));

      expect(response.status).toBe(200);
    });
  });

  // --------------------------------------------------------------------------
  // Recipient Verification Tests
  // --------------------------------------------------------------------------

  describe('Payment Recipient Verification', () => {
    it('should accept correct recipient', async () => {
      mockSuccessfulSettlement();

      const middleware = createX402Middleware(DEFAULT_CONFIG);
      app.post('/protected', middleware, (req: Request, res: Response) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .post('/protected')
        .set('X-Payment', createTestPaymentHeader({ to: TEST_ARCADE_WALLET }));

      expect(response.status).toBe(200);
    });

    it('should reject wrong recipient', async () => {
      const middleware = createX402Middleware(DEFAULT_CONFIG);
      app.post('/protected', middleware, (req: Request, res: Response) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .post('/protected')
        .set('X-Payment', createWrongRecipientHeader());

      expect(response.status).toBe(402);
      expect(response.body.code).toMatch(/RECIPIENT/i);
    });

    it('should use case-insensitive address comparison', async () => {
      mockSuccessfulSettlement();

      const middleware = createX402Middleware(DEFAULT_CONFIG);
      app.post('/protected', middleware, (req: Request, res: Response) => {
        res.json({ success: true });
      });

      // Same address but different case
      const response = await request(app)
        .post('/protected')
        .set('X-Payment', createTestPaymentHeader({ to: TEST_ARCADE_WALLET.toLowerCase() }));

      expect(response.status).toBe(200);
    });
  });

  // --------------------------------------------------------------------------
  // Timestamp Validation Tests
  // --------------------------------------------------------------------------

  describe('Authorization Timestamp Validation', () => {
    it('should accept valid timestamp range', async () => {
      mockSuccessfulSettlement();

      const middleware = createX402Middleware(DEFAULT_CONFIG);
      app.post('/protected', middleware, (req: Request, res: Response) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .post('/protected')
        .set('X-Payment', createTestPaymentHeader());

      expect(response.status).toBe(200);
    });

    it('should reject expired authorization', async () => {
      const middleware = createX402Middleware(DEFAULT_CONFIG);
      app.post('/protected', middleware, (req: Request, res: Response) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .post('/protected')
        .set('X-Payment', createExpiredPaymentHeader());

      expect(response.status).toBe(402);
      expect(response.body.code).toMatch(/EXPIRED/i);
    });

    it('should reject not-yet-valid authorization', async () => {
      const middleware = createX402Middleware(DEFAULT_CONFIG);
      app.post('/protected', middleware, (req: Request, res: Response) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .post('/protected')
        .set('X-Payment', createFuturePaymentHeader());

      expect(response.status).toBe(402);
      expect(response.body.code).toMatch(/NOT.*VALID|EARLY/i);
    });

    it('should allow clock skew tolerance', async () => {
      mockSuccessfulSettlement();

      const middleware = createX402Middleware(DEFAULT_CONFIG);
      app.post('/protected', middleware, (req: Request, res: Response) => {
        res.json({ success: true });
      });

      // validAfter is 10 seconds in the future (within 30s tolerance)
      const now = Math.floor(Date.now() / 1000);
      const response = await request(app)
        .post('/protected')
        .set('X-Payment', createTestPaymentHeader({
          validAfter: String(now + 10),
          validBefore: String(now + 3600),
        }));

      expect(response.status).toBe(200);
    });
  });

  // --------------------------------------------------------------------------
  // Nonce Uniqueness Tests
  // --------------------------------------------------------------------------

  describe('Nonce Uniqueness Check', () => {
    it('should accept new nonce', async () => {
      mockSuccessfulSettlement();

      const middleware = createX402Middleware(DEFAULT_CONFIG);
      app.post('/protected', middleware, (req: Request, res: Response) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .post('/protected')
        .set('X-Payment', createTestPaymentHeader({ nonce: '0x' + 'a'.repeat(64) }));

      expect(response.status).toBe(200);
    });

    it('should reject reused nonce', async () => {
      mockSuccessfulSettlement();

      const middleware = createX402Middleware(DEFAULT_CONFIG);
      app.post('/protected', middleware, (req: Request, res: Response) => {
        res.json({ success: true });
      });

      const nonce = '0x' + 'b'.repeat(64);
      const header = createTestPaymentHeader({ nonce });

      // First request succeeds
      const response1 = await request(app)
        .post('/protected')
        .set('X-Payment', header);

      expect(response1.status).toBe(200);

      // Second request with same nonce fails
      const response2 = await request(app)
        .post('/protected')
        .set('X-Payment', header);

      expect(response2.status).toBe(402);
      expect(response2.body.code).toMatch(/NONCE/i);
    });

    it('should store nonce after successful settlement', async () => {
      mockSuccessfulSettlement();

      const middleware = createX402Middleware(DEFAULT_CONFIG);
      app.post('/protected', middleware, (req: Request, res: Response) => {
        res.json({ success: true });
      });

      const nonce = '0x' + 'c'.repeat(64);
      const header = createTestPaymentHeader({ nonce });

      await request(app)
        .post('/protected')
        .set('X-Payment', header);

      // Check nonce is stored
      const nonceStore = getDefaultNonceStore();
      const isUsed = await nonceStore.isUsed(nonce);
      expect(isUsed).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Settlement Tests
  // --------------------------------------------------------------------------

  describe('Facilitator Settlement', () => {
    it('should call facilitator on valid payment', async () => {
      mockSuccessfulSettlement();

      const middleware = createX402Middleware(DEFAULT_CONFIG);
      app.post('/protected', middleware, (req: Request, res: Response) => {
        res.json({ success: true });
      });

      await request(app)
        .post('/protected')
        .set('X-Payment', createTestPaymentHeader());

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('settle'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should attach settlement info to request', async () => {
      const txHash = '0x' + 'd'.repeat(64);
      mockSuccessfulSettlement(txHash);

      const middleware = createX402Middleware(DEFAULT_CONFIG);
      app.post('/protected', middleware, (req: X402Request, res: Response) => {
        res.json({
          success: true,
          transactionHash: req.x402?.settlement?.transactionHash,
        });
      });

      const response = await request(app)
        .post('/protected')
        .set('X-Payment', createTestPaymentHeader());

      expect(response.status).toBe(200);
      expect(response.body.transactionHash).toBe(txHash);
    });

    it('should return error on settlement failure', async () => {
      mockFailedSettlement('INSUFFICIENT_FUNDS', 'Insufficient USDC balance');

      const middleware = createX402Middleware(DEFAULT_CONFIG);
      app.post('/protected', middleware, (req: Request, res: Response) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .post('/protected')
        .set('X-Payment', createTestPaymentHeader());

      expect(response.status).toBe(402);
    });
  });

  // --------------------------------------------------------------------------
  // PaymentInfo Attachment Tests
  // --------------------------------------------------------------------------

  describe('PaymentInfo Attachment', () => {
    it('should attach paymentInfo to request', async () => {
      mockSuccessfulSettlement();

      const middleware = createX402Middleware(DEFAULT_CONFIG);
      app.post('/protected', middleware, (req: X402Request, res: Response) => {
        res.json({
          success: true,
          hasPaymentInfo: !!req.x402?.paymentInfo,
          payer: req.x402?.paymentInfo?.payer,
        });
      });

      const response = await request(app)
        .post('/protected')
        .set('X-Payment', createTestPaymentHeader({ from: TEST_PLAYER_WALLET }));

      expect(response.status).toBe(200);
      expect(response.body.hasPaymentInfo).toBe(true);
      expect(response.body.payer?.toLowerCase()).toBe(TEST_PLAYER_WALLET.toLowerCase());
    });

    it('should include amount in paymentInfo', async () => {
      mockSuccessfulSettlement();

      const middleware = createX402Middleware(DEFAULT_CONFIG);
      app.post('/protected', middleware, (req: X402Request, res: Response) => {
        res.json({
          success: true,
          amountUsdc: req.x402?.paymentInfo?.amountUsdc,
        });
      });

      const response = await request(app)
        .post('/protected')
        .set('X-Payment', createTestPaymentHeader({ value: '10000' }));

      expect(response.status).toBe(200);
      expect(response.body.amountUsdc).toBe(0.01);
    });

    it('should include transaction hash in paymentInfo', async () => {
      const txHash = '0x' + 'e'.repeat(64);
      mockSuccessfulSettlement(txHash);

      const middleware = createX402Middleware(DEFAULT_CONFIG);
      app.post('/protected', middleware, (req: X402Request, res: Response) => {
        res.json({
          success: true,
          transactionHash: req.x402?.paymentInfo?.transactionHash,
        });
      });

      const response = await request(app)
        .post('/protected')
        .set('X-Payment', createTestPaymentHeader());

      expect(response.status).toBe(200);
      expect(response.body.transactionHash).toBe(txHash);
    });

    it('should include receivedAt timestamp', async () => {
      mockSuccessfulSettlement();

      const middleware = createX402Middleware(DEFAULT_CONFIG);
      app.post('/protected', middleware, (req: X402Request, res: Response) => {
        res.json({
          success: true,
          receivedAt: req.x402?.receivedAt,
        });
      });

      const before = new Date().toISOString();
      const response = await request(app)
        .post('/protected')
        .set('X-Payment', createTestPaymentHeader());
      const after = new Date().toISOString();

      expect(response.status).toBe(200);
      expect(response.body.receivedAt).toBeDefined();
      expect(response.body.receivedAt >= before).toBe(true);
      expect(response.body.receivedAt <= after).toBe(true);
    });
  });
});
