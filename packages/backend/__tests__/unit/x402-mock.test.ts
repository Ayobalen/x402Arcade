/**
 * Tests for x402 Payment Mock Utilities
 *
 * Verifies that the mock utilities correctly simulate the x402 payment protocol
 * for testing without real blockchain transactions.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import express, { Application, Request, Response } from 'express';
import request from 'supertest';
import {
  MockX402Server,
  DEFAULT_PAYMENT_REQUIREMENTS,
  GAME_PRICES,
  createX402Middleware,
  createMockPaymentHeader,
  createExpiredPaymentHeader,
  createWrongAmountPaymentHeader,
  createInvalidSignaturePaymentHeader,
  assertPaymentRequired,
  assertPaymentSuccess,
  assertPaymentFailed,
  createMockFacilitatorClient,
  createTestX402Server,
  type X402PaymentHeader,
  type PaymentRequirements,
  type SettlementResult,
} from '../mocks/x402-mock';

describe('x402 Payment Mock Utilities', () => {
  describe('DEFAULT_PAYMENT_REQUIREMENTS', () => {
    it('should have correct Cronos testnet configuration', () => {
      expect(DEFAULT_PAYMENT_REQUIREMENTS.network).toBe('cronos-testnet');
      expect(DEFAULT_PAYMENT_REQUIREMENTS.maxChainId).toBe(338);
    });

    it('should have correct devUSDC.e token address', () => {
      expect(DEFAULT_PAYMENT_REQUIREMENTS.token).toBe('0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0');
    });

    it('should have facilitator URL', () => {
      expect(DEFAULT_PAYMENT_REQUIREMENTS.facilitatorUrl).toBe('https://facilitator.cronoslabs.org');
    });
  });

  describe('GAME_PRICES', () => {
    it('should have snake price at 0.01 USDC', () => {
      expect(GAME_PRICES.snake).toBe('10000');
    });

    it('should have tetris price at 0.02 USDC', () => {
      expect(GAME_PRICES.tetris).toBe('20000');
    });
  });

  describe('MockX402Server', () => {
    let mockServer: MockX402Server;

    beforeEach(() => {
      mockServer = new MockX402Server();
    });

    describe('constructor', () => {
      it('should create server with default requirements', () => {
        const requirements = mockServer.getRequirements();
        expect(requirements.amount).toBe(DEFAULT_PAYMENT_REQUIREMENTS.amount);
        expect(requirements.token).toBe(DEFAULT_PAYMENT_REQUIREMENTS.token);
      });

      it('should accept custom default requirements', () => {
        const customServer = new MockX402Server({
          defaultRequirements: { amount: '50000' },
        });
        expect(customServer.getRequirements().amount).toBe('50000');
      });
    });

    describe('setRequirements', () => {
      it('should update payment requirements', () => {
        mockServer.setRequirements({ amount: '20000', resource: 'tetris' });
        const requirements = mockServer.getRequirements();
        expect(requirements.amount).toBe('20000');
        expect(requirements.resource).toBe('tetris');
      });

      it('should preserve other requirements when updating', () => {
        const originalToken = mockServer.getRequirements().token;
        mockServer.setRequirements({ amount: '30000' });
        expect(mockServer.getRequirements().token).toBe(originalToken);
      });
    });

    describe('reset', () => {
      it('should reset to default requirements', () => {
        mockServer.setRequirements({ amount: '99999' });
        mockServer.reset();
        expect(mockServer.getRequirements().amount).toBe(DEFAULT_PAYMENT_REQUIREMENTS.amount);
      });

      it('should clear settlement history', async () => {
        const header = createMockPaymentHeader({
          from: '0xTEST000000000000000000000000000000000001',
        });
        const parsedHeader = mockServer.parsePaymentHeader(header);
        await mockServer.settle(parsedHeader);

        expect(mockServer.getSettlementHistory().length).toBe(1);
        mockServer.reset();
        expect(mockServer.getSettlementHistory().length).toBe(0);
      });
    });

    describe('mockPaymentRequired', () => {
      it('should return 402 status', () => {
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis(),
        } as unknown as Response;

        mockServer.mockPaymentRequired(mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(402);
      });

      it('should return payment requirements in body', () => {
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis(),
        } as unknown as Response;

        mockServer.mockPaymentRequired(mockRes);

        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'Payment Required',
            code: 'PAYMENT_REQUIRED',
            requirements: expect.objectContaining({
              token: DEFAULT_PAYMENT_REQUIREMENTS.token,
              amount: DEFAULT_PAYMENT_REQUIREMENTS.amount,
            }),
          })
        );
      });

      it('should accept custom requirements', () => {
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis(),
        } as unknown as Response;

        mockServer.mockPaymentRequired(mockRes, { amount: '50000' });

        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            requirements: expect.objectContaining({
              amount: '50000',
            }),
          })
        );
      });
    });

    describe('mockPaymentVerified', () => {
      it('should return 200 status', () => {
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis(),
        } as unknown as Response;

        mockServer.mockPaymentVerified(mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
      });

      it('should include success flag and txHash', () => {
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis(),
        } as unknown as Response;

        mockServer.mockPaymentVerified(mockRes);

        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            txHash: expect.stringMatching(/^0x[a-f0-9]{64}$/),
          })
        );
      });

      it('should merge custom data', () => {
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis(),
        } as unknown as Response;

        mockServer.mockPaymentVerified(mockRes, { sessionId: 'abc123' });

        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            sessionId: 'abc123',
          })
        );
      });
    });

    describe('mockPaymentFailed', () => {
      it('should return 402 status with error code', () => {
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis(),
        } as unknown as Response;

        mockServer.mockPaymentFailed(mockRes, 'INSUFFICIENT_FUNDS');

        expect(mockRes.status).toHaveBeenCalledWith(402);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 'INSUFFICIENT_FUNDS',
          })
        );
      });

      it('should use default error message for known codes', () => {
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis(),
        } as unknown as Response;

        mockServer.mockPaymentFailed(mockRes, 'INSUFFICIENT_FUNDS');

        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'Insufficient USDC balance',
          })
        );
      });

      it('should accept custom error message', () => {
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis(),
        } as unknown as Response;

        mockServer.mockPaymentFailed(mockRes, 'CUSTOM_ERROR', 'Custom error message');

        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'Custom error message',
          })
        );
      });
    });

    describe('validatePaymentHeader', () => {
      it('should return valid for correct header', () => {
        const header = createMockPaymentHeader({
          from: '0xTEST000000000000000000000000000000000001',
        });

        const result = mockServer.validatePaymentHeader(header);

        expect(result.valid).toBe(true);
        expect(result.header).toBeDefined();
      });

      it('should fail for missing header', () => {
        const result = mockServer.validatePaymentHeader(undefined);

        expect(result.valid).toBe(false);
        expect(result.errorCode).toBe('MISSING_HEADER');
      });

      it('should fail for wrong amount', () => {
        const header = createWrongAmountPaymentHeader(
          '0xTEST000000000000000000000000000000000001',
          '99999'
        );

        const result = mockServer.validatePaymentHeader(header);

        expect(result.valid).toBe(false);
        expect(result.errorCode).toBe('WRONG_AMOUNT');
      });

      it('should fail for expired payment', () => {
        const header = createExpiredPaymentHeader(
          '0xTEST000000000000000000000000000000000001'
        );

        const result = mockServer.validatePaymentHeader(header);

        expect(result.valid).toBe(false);
        expect(result.errorCode).toBe('EXPIRED_PAYMENT');
      });

      it('should fail for invalid signature', () => {
        const header = createInvalidSignaturePaymentHeader(
          '0xTEST000000000000000000000000000000000001'
        );

        const result = mockServer.validatePaymentHeader(header);

        expect(result.valid).toBe(false);
        expect(result.errorCode).toBe('INVALID_SIGNATURE');
      });

      it('should fail for reused nonce', async () => {
        const header = createMockPaymentHeader({
          from: '0xTEST000000000000000000000000000000000001',
        });

        // First validation and settlement
        const parsed = mockServer.parsePaymentHeader(header);
        await mockServer.settle(parsed);

        // Second validation should fail
        const result = mockServer.validatePaymentHeader(header);

        expect(result.valid).toBe(false);
        expect(result.errorCode).toBe('NONCE_ALREADY_USED');
      });
    });

    describe('settle', () => {
      it('should return successful settlement by default', async () => {
        const header = createMockPaymentHeader({
          from: '0xTEST000000000000000000000000000000000001',
        });
        const parsed = mockServer.parsePaymentHeader(header);

        const result = await mockServer.settle(parsed);

        expect(result.success).toBe(true);
        expect(result.txHash).toMatch(/^0x[a-f0-9]{64}$/);
      });

      it('should record settlement in history', async () => {
        const header = createMockPaymentHeader({
          from: '0xTEST000000000000000000000000000000000001',
        });
        const parsed = mockServer.parsePaymentHeader(header);

        await mockServer.settle(parsed);

        const history = mockServer.getSettlementHistory();
        expect(history.length).toBe(1);
        expect(history[0].header.from).toBe(parsed.from);
        expect(history[0].result.success).toBe(true);
      });

      it('should fail when alwaysFail is set', async () => {
        const failServer = new MockX402Server({ alwaysFail: true });
        const header = createMockPaymentHeader({
          from: '0xTEST000000000000000000000000000000000001',
        });
        const parsed = failServer.parsePaymentHeader(header);

        const result = await failServer.settle(parsed);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('should respect latency configuration', async () => {
        const slowServer = new MockX402Server({ latency: 100 });
        const header = createMockPaymentHeader({
          from: '0xTEST000000000000000000000000000000000001',
        });
        const parsed = slowServer.parsePaymentHeader(header);

        const start = Date.now();
        await slowServer.settle(parsed);
        const elapsed = Date.now() - start;

        expect(elapsed).toBeGreaterThanOrEqual(90); // Allow some tolerance
      });

      it('should use custom validator when provided', async () => {
        const customValidator = jest.fn<(h: X402PaymentHeader) => SettlementResult>().mockReturnValue({
          success: false,
          error: 'Custom validation failed',
          errorCode: 'CUSTOM_ERROR',
        });

        const customServer = new MockX402Server({
          settlementValidator: customValidator,
        });

        const header = createMockPaymentHeader({
          from: '0xTEST000000000000000000000000000000000001',
        });
        const parsed = customServer.parsePaymentHeader(header);

        const result = await customServer.settle(parsed);

        expect(customValidator).toHaveBeenCalledWith(parsed);
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('CUSTOM_ERROR');
      });
    });
  });

  describe('createX402Middleware', () => {
    let app: Application;
    let mockServer: MockX402Server;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      mockServer = new MockX402Server();

      // Protected route
      app.post('/api/play', createX402Middleware(mockServer), (req: Request, res: Response) => {
        const x402Data = (req as Request & { x402?: { header: X402PaymentHeader; txHash: string } }).x402;
        res.json({
          success: true,
          sessionId: 'test-session',
          txHash: x402Data?.txHash,
        });
      });
    });

    it('should return 402 when no payment header', async () => {
      const response = await request(app).post('/api/play');

      expect(response.status).toBe(402);
      expect(response.body.code).toBe('PAYMENT_REQUIRED');
    });

    it('should process valid payment and call next', async () => {
      const header = createMockPaymentHeader({
        from: '0xTEST000000000000000000000000000000000001',
      });

      const response = await request(app)
        .post('/api/play')
        .set('X-Payment', header);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.sessionId).toBe('test-session');
      expect(response.body.txHash).toMatch(/^0x[a-f0-9]{64}$/);
    });

    it('should reject expired payment', async () => {
      const header = createExpiredPaymentHeader(
        '0xTEST000000000000000000000000000000000001'
      );

      const response = await request(app)
        .post('/api/play')
        .set('X-Payment', header);

      expect(response.status).toBe(402);
      expect(response.body.code).toBe('EXPIRED_PAYMENT');
    });

    it('should reject wrong amount', async () => {
      const header = createWrongAmountPaymentHeader(
        '0xTEST000000000000000000000000000000000001',
        '1' // Wrong amount
      );

      const response = await request(app)
        .post('/api/play')
        .set('X-Payment', header);

      expect(response.status).toBe(402);
      expect(response.body.code).toBe('WRONG_AMOUNT');
    });

    it('should support custom callbacks', async () => {
      const onPaymentRequired = jest.fn((req: Request, res: Response) => {
        res.status(402).json({ custom: true });
      });

      const customApp = express();
      customApp.use(express.json());
      customApp.post('/api/custom', createX402Middleware(mockServer, { onPaymentRequired }));

      const response = await request(customApp).post('/api/custom');

      expect(onPaymentRequired).toHaveBeenCalled();
      expect(response.body.custom).toBe(true);
    });
  });

  describe('Payment Header Helpers', () => {
    describe('createMockPaymentHeader', () => {
      it('should create valid base64-encoded header', () => {
        const header = createMockPaymentHeader({
          from: '0xTEST000000000000000000000000000000000001',
        });

        // Should be valid base64
        expect(() => Buffer.from(header, 'base64')).not.toThrow();

        // Should decode to valid JSON
        const decoded = JSON.parse(Buffer.from(header, 'base64').toString('utf-8'));
        expect(decoded.from).toBe('0xTEST000000000000000000000000000000000001');
      });

      it('should include all required fields', () => {
        const header = createMockPaymentHeader({
          from: '0xTEST000000000000000000000000000000000001',
        });

        const decoded = JSON.parse(Buffer.from(header, 'base64').toString('utf-8'));

        expect(decoded.version).toBeDefined();
        expect(decoded.amount).toBeDefined();
        expect(decoded.token).toBeDefined();
        expect(decoded.from).toBeDefined();
        expect(decoded.to).toBeDefined();
        expect(decoded.nonce).toBeDefined();
        expect(decoded.deadline).toBeDefined();
        expect(decoded.signature).toBeDefined();
      });

      it('should use default requirements', () => {
        const header = createMockPaymentHeader({
          from: '0xTEST000000000000000000000000000000000001',
        });

        const decoded = JSON.parse(Buffer.from(header, 'base64').toString('utf-8'));

        expect(decoded.amount).toBe(DEFAULT_PAYMENT_REQUIREMENTS.amount);
        expect(decoded.token).toBe(DEFAULT_PAYMENT_REQUIREMENTS.token);
        expect(decoded.to).toBe(DEFAULT_PAYMENT_REQUIREMENTS.recipient);
      });

      it('should use custom requirements when provided', () => {
        const customRequirements: PaymentRequirements = {
          ...DEFAULT_PAYMENT_REQUIREMENTS,
          amount: '50000',
          recipient: '0xCUSTOM00000000000000000000000000000001',
        };

        const header = createMockPaymentHeader(
          { from: '0xTEST000000000000000000000000000000000001' },
          customRequirements
        );

        const decoded = JSON.parse(Buffer.from(header, 'base64').toString('utf-8'));

        expect(decoded.amount).toBe('50000');
        expect(decoded.to).toBe('0xCUSTOM00000000000000000000000000000001');
      });
    });

    describe('createExpiredPaymentHeader', () => {
      it('should create header with past deadline', () => {
        const header = createExpiredPaymentHeader(
          '0xTEST000000000000000000000000000000000001'
        );

        const decoded = JSON.parse(Buffer.from(header, 'base64').toString('utf-8'));
        const deadline = parseInt(decoded.deadline);
        const now = Math.floor(Date.now() / 1000);

        expect(deadline).toBeLessThan(now);
      });
    });

    describe('createWrongAmountPaymentHeader', () => {
      it('should create header with specified wrong amount', () => {
        const header = createWrongAmountPaymentHeader(
          '0xTEST000000000000000000000000000000000001',
          '12345'
        );

        const decoded = JSON.parse(Buffer.from(header, 'base64').toString('utf-8'));

        expect(decoded.amount).toBe('12345');
      });
    });

    describe('createInvalidSignaturePaymentHeader', () => {
      it('should create header with invalid signature format', () => {
        const header = createInvalidSignaturePaymentHeader(
          '0xTEST000000000000000000000000000000000001'
        );

        const decoded = JSON.parse(Buffer.from(header, 'base64').toString('utf-8'));

        expect(decoded.signature).not.toMatch(/^0x[a-f0-9]+$/);
      });
    });
  });

  describe('Assertion Helpers', () => {
    describe('assertPaymentRequired', () => {
      it('should pass for valid 402 response', () => {
        const res = {
          status: 402,
          body: {
            code: 'PAYMENT_REQUIRED',
            requirements: { amount: '10000' },
          },
        };

        expect(() => assertPaymentRequired(res)).not.toThrow();
      });

      it('should fail for non-402 status', () => {
        const res = {
          status: 200,
          body: {},
        };

        expect(() => assertPaymentRequired(res)).toThrow(/Expected 402/);
      });

      it('should fail for wrong code', () => {
        const res = {
          status: 402,
          body: { code: 'WRONG_CODE', requirements: {} },
        };

        expect(() => assertPaymentRequired(res)).toThrow(/Expected code PAYMENT_REQUIRED/);
      });

      it('should validate expected amount', () => {
        const res = {
          status: 402,
          body: {
            code: 'PAYMENT_REQUIRED',
            requirements: { amount: '20000' },
          },
        };

        expect(() => assertPaymentRequired(res, '10000')).toThrow(/Expected amount/);
        expect(() => assertPaymentRequired(res, '20000')).not.toThrow();
      });
    });

    describe('assertPaymentSuccess', () => {
      it('should pass for valid success response', () => {
        const res = {
          status: 200,
          body: {
            success: true,
            txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          },
        };

        expect(() => assertPaymentSuccess(res)).not.toThrow();
      });

      it('should fail for non-200 status', () => {
        const res = {
          status: 402,
          body: {},
        };

        expect(() => assertPaymentSuccess(res)).toThrow(/Expected 200 OK/);
      });

      it('should fail for missing success flag', () => {
        const res = {
          status: 200,
          body: { txHash: '0x...' },
        };

        expect(() => assertPaymentSuccess(res)).toThrow(/Expected success: true/);
      });

      it('should fail for missing txHash', () => {
        const res = {
          status: 200,
          body: { success: true },
        };

        expect(() => assertPaymentSuccess(res)).toThrow(/Expected txHash/);
      });
    });

    describe('assertPaymentFailed', () => {
      it('should pass for 402 with error code', () => {
        const res = {
          status: 402,
          body: { code: 'INSUFFICIENT_FUNDS' },
        };

        expect(() => assertPaymentFailed(res)).not.toThrow();
      });

      it('should validate expected error code', () => {
        const res = {
          status: 402,
          body: { code: 'WRONG_CODE' },
        };

        expect(() => assertPaymentFailed(res, 'EXPECTED_CODE')).toThrow(/Expected error code/);
      });
    });
  });

  describe('Factory Functions', () => {
    describe('createMockFacilitatorClient', () => {
      it('should create mock with jest functions', () => {
        const client = createMockFacilitatorClient();

        expect(client.settle).toBeDefined();
        expect(client.verify).toBeDefined();
        expect(client.getSupported).toBeDefined();
      });

      it('should allow mocking return values', async () => {
        const client = createMockFacilitatorClient();
        client.settle.mockResolvedValue({
          success: true,
          txHash: '0xmocktx',
        });

        const result = await client.settle({} as X402PaymentHeader);
        expect(result.txHash).toBe('0xmocktx');
      });
    });

    describe('createTestX402Server', () => {
      it('should create success scenario server', async () => {
        const server = createTestX402Server('success');
        const header = createMockPaymentHeader({
          from: '0xTEST000000000000000000000000000000000001',
        });
        const parsed = server.parsePaymentHeader(header);

        const result = await server.settle(parsed);
        expect(result.success).toBe(true);
      });

      it('should create fail scenario server', async () => {
        const server = createTestX402Server('fail');
        const header = createMockPaymentHeader({
          from: '0xTEST000000000000000000000000000000000001',
        });
        const parsed = server.parsePaymentHeader(header);

        const result = await server.settle(parsed);
        expect(result.success).toBe(false);
      });

      it('should create slow scenario server', async () => {
        const server = createTestX402Server('slow');
        const header = createMockPaymentHeader({
          from: '0xTEST000000000000000000000000000000000001',
        });
        const parsed = server.parsePaymentHeader(header);

        const start = Date.now();
        await server.settle(parsed);
        const elapsed = Date.now() - start;

        expect(elapsed).toBeGreaterThanOrEqual(400); // Allow some tolerance
      });
    });
  });
});
