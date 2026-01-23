/**
 * Facilitator Mock Server Tests
 *
 * Comprehensive tests for the x402 facilitator mock implementation.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  MockFacilitatorServer,
  DEFAULT_FACILITATOR_CONFIG,
  CRONOS_TESTNET_NETWORK,
  CRONOS_MAINNET_NETWORK,
  DEV_USDC_TOKEN,
  ERROR_MESSAGES,
  generateMockTxHash,
  generateMockBlockNumber,
  resetFacilitatorCounters,
  decodePaymentHeader,
  encodePaymentHeader,
  createMockPaymentHeaderV2,
  generateSuccessfulSettlement,
  generateFailedSettlement,
  generateSuccessfulVerification,
  generateFailedVerification,
  generateSuccessfulRefund,
  generateFailedRefund,
  createTestFacilitatorServer,
  assertSettlementSuccess,
  assertSettlementFailed,
  assertVerificationSuccess,
  assertVerificationFailed,
  assertRefundSuccess,
  assertRefundFailed,
  type SettlementRequest,
  type X402PaymentHeaderV2,
  type FacilitatorErrorCode,
} from '../mocks/facilitator-mock';

describe('Facilitator Mock Server', () => {
  let facilitator: MockFacilitatorServer;

  beforeEach(() => {
    resetFacilitatorCounters();
    facilitator = new MockFacilitatorServer({ enableLogging: true });
  });

  afterEach(() => {
    facilitator.reset();
  });

  // ==========================================================================
  // Constants and Configuration Tests
  // ==========================================================================

  describe('Constants', () => {
    it('should have correct default facilitator config', () => {
      expect(DEFAULT_FACILITATOR_CONFIG).toEqual({
        baseUrl: 'https://facilitator.cronoslabs.org',
        settleEndpoint: '/v2/x402/settle',
        verifyEndpoint: '/v2/x402/verify',
        refundEndpoint: '/v2/x402/refund',
        supportedEndpoint: '/v2/x402/supported',
      });
    });

    it('should have correct Cronos testnet network info', () => {
      expect(CRONOS_TESTNET_NETWORK).toEqual({
        chainId: 338,
        name: 'Cronos Testnet',
        testnet: true,
        facilitatorAddress: '0x0000000000000000000000000000000000000402',
      });
    });

    it('should have correct Cronos mainnet network info', () => {
      expect(CRONOS_MAINNET_NETWORK).toEqual({
        chainId: 25,
        name: 'Cronos',
        testnet: false,
        facilitatorAddress: '0x0000000000000000000000000000000000000402',
      });
    });

    it('should have correct devUSDC.e token info', () => {
      expect(DEV_USDC_TOKEN).toEqual({
        address: '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0',
        symbol: 'devUSDC.e',
        name: 'Bridged USDC (Stargate)',
        decimals: 6,
        chainIds: [338],
      });
    });

    it('should have error messages for all error codes', () => {
      const errorCodes: FacilitatorErrorCode[] = [
        'INVALID_SIGNATURE',
        'EXPIRED_AUTHORIZATION',
        'INSUFFICIENT_BALANCE',
        'NONCE_ALREADY_USED',
        'WRONG_RECIPIENT',
        'WRONG_AMOUNT',
        'UNSUPPORTED_NETWORK',
        'UNSUPPORTED_TOKEN',
        'TRANSACTION_NOT_FOUND',
        'TRANSACTION_PENDING',
        'TRANSACTION_FAILED',
        'REFUND_ALREADY_PROCESSED',
        'REFUND_WINDOW_EXPIRED',
        'INTERNAL_ERROR',
        'RATE_LIMITED',
        'SERVICE_UNAVAILABLE',
      ];

      for (const code of errorCodes) {
        expect(ERROR_MESSAGES[code]).toBeDefined();
        expect(typeof ERROR_MESSAGES[code]).toBe('string');
        expect(ERROR_MESSAGES[code].length).toBeGreaterThan(0);
      }
    });
  });

  // ==========================================================================
  // Utility Functions Tests
  // ==========================================================================

  describe('Utility Functions', () => {
    describe('generateMockTxHash', () => {
      it('should generate a valid transaction hash', () => {
        const txHash = generateMockTxHash();
        expect(txHash).toMatch(/^0x[a-f0-9]{64}$/);
      });

      it('should generate unique hashes', () => {
        const hashes = new Set<string>();
        for (let i = 0; i < 100; i++) {
          hashes.add(generateMockTxHash());
        }
        expect(hashes.size).toBe(100);
      });
    });

    describe('generateMockBlockNumber', () => {
      it('should generate a positive block number', () => {
        const blockNumber = generateMockBlockNumber();
        expect(blockNumber).toBeGreaterThan(0);
      });

      it('should generate increasing block numbers', () => {
        const block1 = generateMockBlockNumber();
        const block2 = generateMockBlockNumber();
        const block3 = generateMockBlockNumber();
        expect(block2).toBeGreaterThan(block1);
        expect(block3).toBeGreaterThan(block2);
      });
    });

    describe('resetFacilitatorCounters', () => {
      it('should reset counters to initial values', () => {
        // Generate some values to change counters
        generateMockTxHash();
        generateMockBlockNumber();

        // Reset
        resetFacilitatorCounters();

        // After reset, the first generated hash should start with counter value 1001
        const txHash = generateMockTxHash();
        expect(txHash.substring(2, 10)).toBe('000003e9'); // 1001 in hex
      });
    });

    describe('encodePaymentHeader / decodePaymentHeader', () => {
      it('should encode and decode a payment header', () => {
        const header: X402PaymentHeaderV2 = {
          version: '2',
          authorization: {
            from: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
            to: '0xabcdef1234567890abcdef1234567890abcdef12' as `0x${string}`,
            value: '10000',
            validAfter: '0',
            validBefore: '9999999999',
            nonce: '0x1234567890123456789012345678901234567890' as `0x${string}`,
            signature: '0x' + 'ab'.repeat(65) as `0x${string}`,
          },
        };

        const encoded = encodePaymentHeader(header);
        const decoded = decodePaymentHeader(encoded);

        expect(decoded).toEqual(header);
      });

      it('should return null for invalid base64', () => {
        const decoded = decodePaymentHeader('invalid!!!');
        expect(decoded).toBeNull();
      });

      it('should return null for invalid JSON', () => {
        const encoded = Buffer.from('not json').toString('base64');
        const decoded = decodePaymentHeader(encoded);
        expect(decoded).toBeNull();
      });
    });

    describe('createMockPaymentHeaderV2', () => {
      it('should create a valid encoded payment header', () => {
        const encoded = createMockPaymentHeaderV2({
          from: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
        });

        expect(typeof encoded).toBe('string');
        expect(encoded.length).toBeGreaterThan(0);

        const decoded = decodePaymentHeader(encoded);
        expect(decoded).not.toBeNull();
        expect(decoded?.version).toBe('2');
        expect(decoded?.authorization.from).toBe(
          '0x1234567890abcdef1234567890abcdef12345678'
        );
      });

      it('should use custom values when provided', () => {
        const customTo = '0xcustom0000000000000000000000000000000001' as `0x${string}`;
        const customValue = '50000';
        const customNonce = '0xabc123' as `0x${string}`;

        const encoded = createMockPaymentHeaderV2({
          from: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
          to: customTo,
          value: customValue,
          nonce: customNonce,
        });

        const decoded = decodePaymentHeader(encoded);
        expect(decoded?.authorization.to).toBe(customTo);
        expect(decoded?.authorization.value).toBe(customValue);
        expect(decoded?.authorization.nonce).toBe(customNonce);
      });

      it('should set validBefore to future timestamp by default', () => {
        const now = Math.floor(Date.now() / 1000);
        const encoded = createMockPaymentHeaderV2({
          from: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
        });

        const decoded = decodePaymentHeader(encoded);
        const validBefore = parseInt(decoded?.authorization.validBefore || '0');
        expect(validBefore).toBeGreaterThan(now);
      });
    });
  });

  // ==========================================================================
  // MockFacilitatorServer Class Tests
  // ==========================================================================

  describe('MockFacilitatorServer', () => {
    describe('constructor', () => {
      it('should create server with default configuration', () => {
        const server = new MockFacilitatorServer();
        const config = server.getConfig();

        expect(config.baseUrl).toBe(DEFAULT_FACILITATOR_CONFIG.baseUrl);
        expect(config.latency).toBe(0);
        expect(config.failRate).toBe(0);
        expect(config.enableLogging).toBe(false);
      });

      it('should accept custom configuration', () => {
        const server = new MockFacilitatorServer({
          latency: 100,
          failRate: 0.1,
          enableLogging: true,
        });

        const config = server.getConfig();
        expect(config.latency).toBe(100);
        expect(config.failRate).toBe(0.1);
        expect(config.enableLogging).toBe(true);
      });
    });

    describe('configure', () => {
      it('should update configuration', () => {
        facilitator.configure({ latency: 200 });
        expect(facilitator.getConfig().latency).toBe(200);
      });

      it('should merge with existing configuration', () => {
        facilitator.configure({ latency: 100 });
        facilitator.configure({ failRate: 0.5 });

        const config = facilitator.getConfig();
        expect(config.latency).toBe(100);
        expect(config.failRate).toBe(0.5);
      });
    });

    describe('reset', () => {
      it('should clear all settlements', async () => {
        const paymentHeader = createMockPaymentHeaderV2({
          from: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
        });

        await facilitator.settle({ paymentHeader });
        expect(facilitator.getSettlements().size).toBe(1);

        facilitator.reset();
        expect(facilitator.getSettlements().size).toBe(0);
      });

      it('should clear used nonces', async () => {
        const paymentHeader = createMockPaymentHeaderV2({
          from: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
          nonce: '0xuniquenonce1234567890123456789012' as `0x${string}`,
        });

        await facilitator.settle({ paymentHeader });
        expect(facilitator.getUsedNonces().size).toBe(1);

        facilitator.reset();
        expect(facilitator.getUsedNonces().size).toBe(0);
      });

      it('should clear request log', async () => {
        await facilitator.settle({
          paymentHeader: createMockPaymentHeaderV2({
            from: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
          }),
        });

        expect(facilitator.getRequestLog().length).toBeGreaterThan(0);

        facilitator.reset();
        expect(facilitator.getRequestLog().length).toBe(0);
      });
    });

    describe('setAlwaysFail', () => {
      it('should cause all settlements to fail', async () => {
        facilitator.setAlwaysFail('INTERNAL_ERROR');

        const result = await facilitator.settle({
          paymentHeader: createMockPaymentHeaderV2({
            from: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
          }),
        });

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INTERNAL_ERROR');
      });

      it('should be cleared when set to null', async () => {
        facilitator.setAlwaysFail('INTERNAL_ERROR');
        facilitator.setAlwaysFail(null);

        const result = await facilitator.settle({
          paymentHeader: createMockPaymentHeaderV2({
            from: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
          }),
        });

        expect(result.success).toBe(true);
      });
    });

    describe('setLatency', () => {
      it('should add latency to requests', async () => {
        facilitator.setLatency(100);

        const start = Date.now();
        await facilitator.settle({
          paymentHeader: createMockPaymentHeaderV2({
            from: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
          }),
        });
        const elapsed = Date.now() - start;

        expect(elapsed).toBeGreaterThanOrEqual(100);
      });
    });
  });

  // ==========================================================================
  // Settlement Tests
  // ==========================================================================

  describe('settle', () => {
    describe('successful settlement', () => {
      it('should return successful settlement for valid payment', async () => {
        const result = await facilitator.settle({
          paymentHeader: createMockPaymentHeaderV2({
            from: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
          }),
        });

        expect(result.success).toBe(true);
        expect(result.txHash).toMatch(/^0x[a-f0-9]{64}$/);
        expect(result.blockNumber).toBeGreaterThan(0);
        expect(result.timestamp).toBeGreaterThan(0);
      });

      it('should store settlement for later verification', async () => {
        const result = await facilitator.settle({
          paymentHeader: createMockPaymentHeaderV2({
            from: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
          }),
        });

        const settlements = facilitator.getSettlements();
        expect(settlements.has(result.txHash!)).toBe(true);
      });

      it('should mark nonce as used', async () => {
        const nonce = '0x' + 'a'.repeat(32) as `0x${string}`;
        const from = '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`;

        await facilitator.settle({
          paymentHeader: createMockPaymentHeaderV2({ from, nonce }),
        });

        expect(facilitator.isNonceUsed(from, nonce)).toBe(true);
      });
    });

    describe('validation errors', () => {
      it('should fail for expired authorization', async () => {
        const expiredTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
        const result = await facilitator.settle({
          paymentHeader: createMockPaymentHeaderV2({
            from: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
            validUntil: expiredTime,
          }),
        });

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('EXPIRED_AUTHORIZATION');
      });

      it('should fail for reused nonce', async () => {
        const nonce = '0x' + 'b'.repeat(32) as `0x${string}`;
        const from = '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`;

        // First settlement should succeed
        const result1 = await facilitator.settle({
          paymentHeader: createMockPaymentHeaderV2({ from, nonce }),
        });
        expect(result1.success).toBe(true);

        // Second settlement with same nonce should fail
        const result2 = await facilitator.settle({
          paymentHeader: createMockPaymentHeaderV2({ from, nonce }),
        });
        expect(result2.success).toBe(false);
        expect(result2.errorCode).toBe('NONCE_ALREADY_USED');
      });

      it('should fail for wrong recipient', async () => {
        const result = await facilitator.settle({
          paymentHeader: createMockPaymentHeaderV2({
            from: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
            to: '0xwrong000000000000000000000000000000001' as `0x${string}`,
          }),
          recipient: '0xexpected00000000000000000000000000000001',
        });

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('WRONG_RECIPIENT');
      });

      it('should fail for wrong amount', async () => {
        const result = await facilitator.settle({
          paymentHeader: createMockPaymentHeaderV2({
            from: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
            value: '5000',
          }),
          amount: '10000',
        });

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('WRONG_AMOUNT');
      });

      it('should fail for invalid payment header', async () => {
        const result = await facilitator.settle({
          paymentHeader: 'invalid-header',
        });

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INVALID_SIGNATURE');
      });
    });

    describe('custom validator', () => {
      it('should use custom settlement validator when provided', async () => {
        const customFacilitator = new MockFacilitatorServer({
          settlementValidator: () => ({
            success: false,
            error: 'Custom validation failed',
            errorCode: 'INSUFFICIENT_BALANCE',
          }),
        });

        const result = await customFacilitator.settle({
          paymentHeader: createMockPaymentHeaderV2({
            from: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
          }),
        });

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INSUFFICIENT_BALANCE');
        expect(result.error).toBe('Custom validation failed');
      });
    });

    describe('request logging', () => {
      it('should log settlement requests', async () => {
        await facilitator.settle({
          paymentHeader: createMockPaymentHeaderV2({
            from: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
          }),
        });

        const log = facilitator.getRequestLog();
        expect(log.length).toBe(1);
        expect(log[0].endpoint).toBe('/v2/x402/settle');
        expect(log[0].method).toBe('POST');
        expect(log[0].durationMs).toBeGreaterThanOrEqual(0);
      });
    });
  });

  // ==========================================================================
  // Verification Tests
  // ==========================================================================

  describe('verify', () => {
    describe('successful verification', () => {
      it('should verify a settled transaction', async () => {
        // First settle a payment
        const settlement = await facilitator.settle({
          paymentHeader: createMockPaymentHeaderV2({
            from: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
          }),
        });

        // Then verify it
        const verification = await facilitator.verify({
          txHash: settlement.txHash!,
        });

        expect(verification.verified).toBe(true);
        expect(verification.transaction).toBeDefined();
        expect(verification.transaction?.txHash).toBe(settlement.txHash);
      });

      it('should include transaction details in verification', async () => {
        const from = '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`;
        const to = '0xarcade00000000000000000000000000000001' as `0x${string}`;
        const value = '10000';

        const settlement = await facilitator.settle({
          paymentHeader: createMockPaymentHeaderV2({ from, to, value }),
        });

        const verification = await facilitator.verify({
          txHash: settlement.txHash!,
        });

        expect(verification.transaction?.from).toBe(from);
        expect(verification.transaction?.to).toBe(to);
        expect(verification.transaction?.amount).toBe(value);
        expect(verification.transaction?.blockNumber).toBeGreaterThan(0);
        expect(verification.transaction?.confirmations).toBeGreaterThan(0);
      });
    });

    describe('verification failures', () => {
      it('should fail for unknown transaction', async () => {
        const verification = await facilitator.verify({
          txHash: '0x' + 'f'.repeat(64),
        });

        expect(verification.verified).toBe(false);
        expect(verification.errorCode).toBe('TRANSACTION_NOT_FOUND');
      });

      it('should fail for mismatched from address', async () => {
        const settlement = await facilitator.settle({
          paymentHeader: createMockPaymentHeaderV2({
            from: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
          }),
        });

        const verification = await facilitator.verify({
          txHash: settlement.txHash!,
          from: '0xdifferent0000000000000000000000000000001',
        });

        expect(verification.verified).toBe(false);
      });

      it('should fail for mismatched to address', async () => {
        const settlement = await facilitator.settle({
          paymentHeader: createMockPaymentHeaderV2({
            from: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
            to: '0xrecipient000000000000000000000000000001' as `0x${string}`,
          }),
        });

        const verification = await facilitator.verify({
          txHash: settlement.txHash!,
          to: '0xdifferent0000000000000000000000000000001',
        });

        expect(verification.verified).toBe(false);
      });

      it('should fail for mismatched amount', async () => {
        const settlement = await facilitator.settle({
          paymentHeader: createMockPaymentHeaderV2({
            from: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
            value: '10000',
          }),
        });

        const verification = await facilitator.verify({
          txHash: settlement.txHash!,
          amount: '50000',
        });

        expect(verification.verified).toBe(false);
        expect(verification.errorCode).toBe('WRONG_AMOUNT');
      });
    });

    describe('custom validator', () => {
      it('should use custom verification validator when provided', async () => {
        const customFacilitator = new MockFacilitatorServer({
          verificationValidator: () => ({
            verified: false,
            error: 'Custom verification failed',
            errorCode: 'TRANSACTION_PENDING',
          }),
        });

        const verification = await customFacilitator.verify({
          txHash: '0x' + 'a'.repeat(64),
        });

        expect(verification.verified).toBe(false);
        expect(verification.errorCode).toBe('TRANSACTION_PENDING');
      });
    });
  });

  // ==========================================================================
  // Refund Tests
  // ==========================================================================

  describe('refund', () => {
    describe('successful refund', () => {
      it('should process refund for settled transaction', async () => {
        // First settle a payment
        const settlement = await facilitator.settle({
          paymentHeader: createMockPaymentHeaderV2({
            from: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
            value: '10000',
          }),
        });

        // Then refund it
        const refund = await facilitator.refund({
          originalTxHash: settlement.txHash!,
          reason: 'Player requested refund',
        });

        expect(refund.success).toBe(true);
        expect(refund.refundTxHash).toMatch(/^0x[a-f0-9]{64}$/);
        expect(refund.amountRefunded).toBe('10000');
      });

      it('should allow partial refund', async () => {
        const settlement = await facilitator.settle({
          paymentHeader: createMockPaymentHeaderV2({
            from: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
            value: '10000',
          }),
        });

        const refund = await facilitator.refund({
          originalTxHash: settlement.txHash!,
          reason: 'Partial refund',
          amount: '5000',
        });

        expect(refund.success).toBe(true);
        expect(refund.amountRefunded).toBe('5000');
      });
    });

    describe('refund failures', () => {
      it('should fail for unknown transaction', async () => {
        const refund = await facilitator.refund({
          originalTxHash: '0x' + 'f'.repeat(64),
          reason: 'Test refund',
        });

        expect(refund.success).toBe(false);
        expect(refund.errorCode).toBe('TRANSACTION_NOT_FOUND');
      });

      it('should fail for already refunded transaction', async () => {
        const settlement = await facilitator.settle({
          paymentHeader: createMockPaymentHeaderV2({
            from: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
          }),
        });

        // First refund should succeed
        const refund1 = await facilitator.refund({
          originalTxHash: settlement.txHash!,
          reason: 'First refund',
        });
        expect(refund1.success).toBe(true);

        // Second refund should fail
        const refund2 = await facilitator.refund({
          originalTxHash: settlement.txHash!,
          reason: 'Second refund',
        });
        expect(refund2.success).toBe(false);
        expect(refund2.errorCode).toBe('REFUND_ALREADY_PROCESSED');
      });
    });
  });

  // ==========================================================================
  // getSupported Tests
  // ==========================================================================

  describe('getSupported', () => {
    it('should return supported networks and tokens', async () => {
      const supported = await facilitator.getSupported();

      expect(supported.networks).toContainEqual(CRONOS_TESTNET_NETWORK);
      expect(supported.networks).toContainEqual(CRONOS_MAINNET_NETWORK);
      expect(supported.tokens).toContainEqual(DEV_USDC_TOKEN);
    });
  });

  // ==========================================================================
  // Latency Simulation Tests
  // ==========================================================================

  describe('latency simulation', () => {
    it('should apply latency to settle requests', async () => {
      facilitator.setLatency(100);

      const start = Date.now();
      await facilitator.settle({
        paymentHeader: createMockPaymentHeaderV2({
          from: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
        }),
      });
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(100);
    });

    it('should apply latency to verify requests', async () => {
      const settlement = await facilitator.settle({
        paymentHeader: createMockPaymentHeaderV2({
          from: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
        }),
      });

      facilitator.setLatency(100);

      const start = Date.now();
      await facilitator.verify({ txHash: settlement.txHash! });
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(100);
    });

    it('should apply latency to refund requests', async () => {
      const settlement = await facilitator.settle({
        paymentHeader: createMockPaymentHeaderV2({
          from: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
        }),
      });

      facilitator.setLatency(100);

      const start = Date.now();
      await facilitator.refund({
        originalTxHash: settlement.txHash!,
        reason: 'Test',
      });
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(100);
    });
  });

  // ==========================================================================
  // Response Generator Tests
  // ==========================================================================

  describe('Response Generators', () => {
    describe('generateSuccessfulSettlement', () => {
      it('should generate a valid success response', () => {
        const response = generateSuccessfulSettlement();
        expect(response.success).toBe(true);
        expect(response.txHash).toMatch(/^0x[a-f0-9]{64}$/);
        expect(response.blockNumber).toBeGreaterThan(0);
      });

      it('should accept custom values', () => {
        const customTxHash = '0x' + 'a'.repeat(64);
        const response = generateSuccessfulSettlement({ txHash: customTxHash });
        expect(response.txHash).toBe(customTxHash);
      });
    });

    describe('generateFailedSettlement', () => {
      it('should generate a failure response with correct error code', () => {
        const response = generateFailedSettlement('INSUFFICIENT_BALANCE');
        expect(response.success).toBe(false);
        expect(response.errorCode).toBe('INSUFFICIENT_BALANCE');
        expect(response.error).toBe(ERROR_MESSAGES.INSUFFICIENT_BALANCE);
      });

      it('should accept custom error message', () => {
        const response = generateFailedSettlement('INTERNAL_ERROR', 'Custom message');
        expect(response.error).toBe('Custom message');
      });
    });

    describe('generateSuccessfulVerification', () => {
      it('should generate a valid verification response', () => {
        const txHash = '0x' + 'b'.repeat(64);
        const response = generateSuccessfulVerification(txHash);
        expect(response.verified).toBe(true);
        expect(response.transaction?.txHash).toBe(txHash);
      });
    });

    describe('generateFailedVerification', () => {
      it('should generate a failure response', () => {
        const response = generateFailedVerification('TRANSACTION_NOT_FOUND');
        expect(response.verified).toBe(false);
        expect(response.errorCode).toBe('TRANSACTION_NOT_FOUND');
      });
    });

    describe('generateSuccessfulRefund', () => {
      it('should generate a valid refund response', () => {
        const response = generateSuccessfulRefund('10000');
        expect(response.success).toBe(true);
        expect(response.refundTxHash).toMatch(/^0x[a-f0-9]{64}$/);
        expect(response.amountRefunded).toBe('10000');
      });
    });

    describe('generateFailedRefund', () => {
      it('should generate a failure response', () => {
        const response = generateFailedRefund('REFUND_WINDOW_EXPIRED');
        expect(response.success).toBe(false);
        expect(response.errorCode).toBe('REFUND_WINDOW_EXPIRED');
      });
    });
  });

  // ==========================================================================
  // Factory Function Tests
  // ==========================================================================

  describe('createTestFacilitatorServer', () => {
    it('should create a success scenario server', async () => {
      const server = createTestFacilitatorServer('success');
      const result = await server.settle({
        paymentHeader: createMockPaymentHeaderV2({
          from: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
        }),
      });
      expect(result.success).toBe(true);
    });

    it('should create a fail scenario server', async () => {
      const server = createTestFacilitatorServer('fail');
      const result = await server.settle({
        paymentHeader: createMockPaymentHeaderV2({
          from: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
        }),
      });
      expect(result.success).toBe(false);
    });

    it('should create a slow scenario server', async () => {
      const server = createTestFacilitatorServer('slow');
      const start = Date.now();
      await server.settle({
        paymentHeader: createMockPaymentHeaderV2({
          from: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
        }),
      });
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(500);
    });
  });

  // ==========================================================================
  // Assertion Helper Tests
  // ==========================================================================

  describe('Assertion Helpers', () => {
    describe('assertSettlementSuccess', () => {
      it('should pass for successful settlement', () => {
        const response = generateSuccessfulSettlement();
        expect(() => assertSettlementSuccess(response)).not.toThrow();
      });

      it('should throw for failed settlement', () => {
        const response = generateFailedSettlement('INTERNAL_ERROR');
        expect(() => assertSettlementSuccess(response)).toThrow();
      });

      it('should throw for missing txHash', () => {
        const response = { success: true };
        expect(() => assertSettlementSuccess(response)).toThrow('Expected txHash');
      });
    });

    describe('assertSettlementFailed', () => {
      it('should pass for failed settlement', () => {
        const response = generateFailedSettlement('INTERNAL_ERROR');
        expect(() => assertSettlementFailed(response)).not.toThrow();
      });

      it('should pass when expected error code matches', () => {
        const response = generateFailedSettlement('INSUFFICIENT_BALANCE');
        expect(() =>
          assertSettlementFailed(response, 'INSUFFICIENT_BALANCE')
        ).not.toThrow();
      });

      it('should throw for successful settlement', () => {
        const response = generateSuccessfulSettlement();
        expect(() => assertSettlementFailed(response)).toThrow();
      });

      it('should throw when error code does not match', () => {
        const response = generateFailedSettlement('INTERNAL_ERROR');
        expect(() =>
          assertSettlementFailed(response, 'INSUFFICIENT_BALANCE')
        ).toThrow();
      });
    });

    describe('assertVerificationSuccess', () => {
      it('should pass for successful verification', () => {
        const response = generateSuccessfulVerification('0x' + 'a'.repeat(64));
        expect(() => assertVerificationSuccess(response)).not.toThrow();
      });

      it('should throw for failed verification', () => {
        const response = generateFailedVerification('TRANSACTION_NOT_FOUND');
        expect(() => assertVerificationSuccess(response)).toThrow();
      });
    });

    describe('assertVerificationFailed', () => {
      it('should pass for failed verification', () => {
        const response = generateFailedVerification('TRANSACTION_NOT_FOUND');
        expect(() => assertVerificationFailed(response)).not.toThrow();
      });

      it('should throw for successful verification', () => {
        const response = generateSuccessfulVerification('0x' + 'a'.repeat(64));
        expect(() => assertVerificationFailed(response)).toThrow();
      });
    });

    describe('assertRefundSuccess', () => {
      it('should pass for successful refund', () => {
        const response = generateSuccessfulRefund('10000');
        expect(() => assertRefundSuccess(response)).not.toThrow();
      });

      it('should throw for failed refund', () => {
        const response = generateFailedRefund('REFUND_WINDOW_EXPIRED');
        expect(() => assertRefundSuccess(response)).toThrow();
      });
    });

    describe('assertRefundFailed', () => {
      it('should pass for failed refund', () => {
        const response = generateFailedRefund('REFUND_WINDOW_EXPIRED');
        expect(() => assertRefundFailed(response)).not.toThrow();
      });

      it('should throw for successful refund', () => {
        const response = generateSuccessfulRefund('10000');
        expect(() => assertRefundFailed(response)).toThrow();
      });
    });
  });

  // ==========================================================================
  // Test Helper Methods
  // ==========================================================================

  describe('Test Helper Methods', () => {
    describe('addSettlement', () => {
      it('should manually add a settlement for testing', async () => {
        const txHash = '0x' + 'c'.repeat(64);
        const paymentHeader = createMockPaymentHeaderV2({
          from: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
        });

        facilitator.addSettlement(txHash, { paymentHeader });

        // Should now be verifiable
        const verification = await facilitator.verify({ txHash });
        expect(verification.verified).toBe(true);
      });
    });

    describe('isNonceUsed', () => {
      it('should return false for unused nonce', () => {
        expect(
          facilitator.isNonceUsed(
            '0x1234567890abcdef1234567890abcdef12345678',
            '0xunusednonce'
          )
        ).toBe(false);
      });

      it('should return true for used nonce', async () => {
        const from = '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`;
        const nonce = '0x' + 'd'.repeat(32) as `0x${string}`;

        await facilitator.settle({
          paymentHeader: createMockPaymentHeaderV2({ from, nonce }),
        });

        expect(facilitator.isNonceUsed(from, nonce)).toBe(true);
      });
    });

    describe('getRequestLog', () => {
      it('should return all logged requests', async () => {
        await facilitator.settle({
          paymentHeader: createMockPaymentHeaderV2({
            from: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
          }),
        });

        await facilitator.getSupported();

        const log = facilitator.getRequestLog();
        expect(log.length).toBe(2);
        expect(log[0].endpoint).toBe('/v2/x402/settle');
        expect(log[1].endpoint).toBe('/v2/x402/supported');
      });
    });

    describe('clearRequestLog', () => {
      it('should clear the request log', async () => {
        await facilitator.settle({
          paymentHeader: createMockPaymentHeaderV2({
            from: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
          }),
        });

        expect(facilitator.getRequestLog().length).toBeGreaterThan(0);

        facilitator.clearRequestLog();
        expect(facilitator.getRequestLog().length).toBe(0);
      });
    });
  });
});
