/**
 * Payment Factory Tests
 *
 * Tests for the payment fixture factories.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  createPayment,
  createPendingPayment,
  createVerifiedPayment,
  createFailedPayment,
  createRefundedPayment,
  createPaymentHeader,
  encodePaymentHeader,
  decodePaymentHeader,
  createExpiredPaymentHeader,
  createWrongAmountPaymentHeader,
  createReusedNoncePaymentHeader,
  createPayments,
  createPlayerPaymentHistory,
  createPaymentForSession,
  createPrizePayment,
  createMixedStatePayments,
  isValidPayment,
  isValidPaymentHeader,
  isPaymentHeaderValid,
  calculatePlayerTotal,
  calculateGameTotal,
  resetPaymentCounters,
  generateBlockNumber,
  generateNonce,
  generateSignature,
  toUsdcAtomic,
  fromUsdcAtomic,
  GAME_PRICES,
  DEVUSDC_ADDRESS,
  CRONOS_TESTNET_CHAIN_ID,
  DEFAULT_GAS,
  type Payment,
  type X402PaymentHeader,
  type FailureReason,
} from '../fixtures/payment.factory';
import { TEST_ADDRESSES, generateWalletAddress } from '../fixtures/game-session.factory';

describe('Payment Factory', () => {
  beforeEach(() => {
    resetPaymentCounters();
  });

  // ==========================================================================
  // Constants
  // ==========================================================================

  describe('Constants', () => {
    it('should have correct game prices', () => {
      expect(GAME_PRICES.snake).toBe(0.01);
      expect(GAME_PRICES.tetris).toBe(0.02);
    });

    it('should have devUSDC.e address', () => {
      expect(DEVUSDC_ADDRESS).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should have Cronos testnet chain ID', () => {
      expect(CRONOS_TESTNET_CHAIN_ID).toBe(338);
    });

    it('should have default gas values', () => {
      expect(DEFAULT_GAS.gasLimit).toBeDefined();
      expect(DEFAULT_GAS.gasPrice).toBeDefined();
      expect(DEFAULT_GAS.maxFeePerGas).toBeDefined();
      expect(DEFAULT_GAS.maxPriorityFeePerGas).toBeDefined();
    });
  });

  // ==========================================================================
  // Utility Functions
  // ==========================================================================

  describe('Utility Functions', () => {
    describe('generateBlockNumber', () => {
      it('should generate increasing block numbers', () => {
        const block1 = generateBlockNumber();
        const block2 = generateBlockNumber();
        expect(block2).toBeGreaterThan(block1);
      });
    });

    describe('generateNonce', () => {
      it('should generate valid nonce format', () => {
        const nonce = generateNonce();
        expect(nonce).toMatch(/^0x[a-f0-9]{64}$/);
      });

      it('should generate unique nonces', () => {
        const nonces = new Set<string>();
        for (let i = 0; i < 100; i++) {
          nonces.add(generateNonce());
        }
        expect(nonces.size).toBe(100);
      });
    });

    describe('generateSignature', () => {
      it('should generate valid signature format', () => {
        const sig = generateSignature();
        expect(sig).toMatch(/^0x[a-f0-9]{130}$/);
      });
    });

    describe('toUsdcAtomic / fromUsdcAtomic', () => {
      it('should convert to atomic units', () => {
        expect(toUsdcAtomic(1.0)).toBe('1000000');
        expect(toUsdcAtomic(0.01)).toBe('10000');
        expect(toUsdcAtomic(0.000001)).toBe('1');
      });

      it('should convert from atomic units', () => {
        expect(fromUsdcAtomic('1000000')).toBe(1.0);
        expect(fromUsdcAtomic('10000')).toBe(0.01);
        expect(fromUsdcAtomic(1n)).toBe(0.000001);
      });

      it('should round trip correctly', () => {
        const original = 0.02;
        const atomic = toUsdcAtomic(original);
        const result = fromUsdcAtomic(atomic);
        expect(result).toBe(original);
      });
    });

    describe('resetPaymentCounters', () => {
      it('should reset payment counter', () => {
        createPayment();
        createPayment();

        resetPaymentCounters();

        const payment = createPayment();
        expect(payment.id).toBe(1);
      });
    });
  });

  // ==========================================================================
  // createPayment
  // ==========================================================================

  describe('createPayment', () => {
    it('should create payment with default values', () => {
      const payment = createPayment();

      expect(payment.id).toBeDefined();
      expect(payment.tx_hash).toBeDefined();
      expect(payment.from_address).toBe(TEST_ADDRESSES.player1);
      expect(payment.to_address).toBe(TEST_ADDRESSES.arcade);
      expect(payment.amount_usdc).toBe(GAME_PRICES.snake);
      expect(payment.purpose).toBe('game_payment');
      expect(payment.game_type).toBe('snake');
      expect(payment.status).toBe('verified');
      expect(payment.verified_at).toBeDefined();
      expect(payment.block_number).toBeDefined();
      expect(payment.created_at).toBeDefined();
      expect(payment.updated_at).toBeDefined();
    });

    it('should accept custom values', () => {
      const customAddress = generateWalletAddress();
      const payment = createPayment({
        from_address: customAddress,
        amount_usdc: 0.05,
        game_type: 'tetris',
      });

      expect(payment.from_address).toBe(customAddress);
      expect(payment.amount_usdc).toBe(0.05);
      expect(payment.game_type).toBe('tetris');
    });

    it('should create valid payment objects', () => {
      const payment = createPayment();
      expect(isValidPayment(payment)).toBe(true);
    });

    it('should generate unique IDs', () => {
      const payment1 = createPayment();
      const payment2 = createPayment();
      expect(payment1.id).not.toBe(payment2.id);
    });
  });

  // ==========================================================================
  // createPendingPayment
  // ==========================================================================

  describe('createPendingPayment', () => {
    it('should create payment with pending status', () => {
      const payment = createPendingPayment();

      expect(payment.status).toBe('pending');
      expect(payment.tx_hash).toBeNull();
      expect(payment.verified_at).toBeNull();
      expect(payment.block_number).toBeNull();
    });

    it('should use game-specific price', () => {
      const snakePayment = createPendingPayment('snake');
      const tetrisPayment = createPendingPayment('tetris');

      expect(snakePayment.amount_usdc).toBe(GAME_PRICES.snake);
      expect(tetrisPayment.amount_usdc).toBe(GAME_PRICES.tetris);
    });

    it('should accept additional options', () => {
      const customAddress = generateWalletAddress();
      const payment = createPendingPayment('tetris', {
        from_address: customAddress,
      });

      expect(payment.from_address).toBe(customAddress);
      expect(payment.game_type).toBe('tetris');
    });
  });

  // ==========================================================================
  // createVerifiedPayment
  // ==========================================================================

  describe('createVerifiedPayment', () => {
    it('should create payment with verified status', () => {
      const payment = createVerifiedPayment();

      expect(payment.status).toBe('verified');
      expect(payment.tx_hash).toBeDefined();
      expect(payment.verified_at).toBeDefined();
      expect(payment.block_number).toBeDefined();
    });

    it('should accept custom amount', () => {
      const payment = createVerifiedPayment(0.05);
      expect(payment.amount_usdc).toBe(0.05);
    });

    it('should use game-specific price by default', () => {
      const tetrisPayment = createVerifiedPayment(undefined, 'tetris');
      expect(tetrisPayment.amount_usdc).toBe(GAME_PRICES.tetris);
    });

    it('should have valid transaction hash', () => {
      const payment = createVerifiedPayment();
      expect(payment.tx_hash).toMatch(/^0x[a-f0-9]{64}$/);
    });
  });

  // ==========================================================================
  // createFailedPayment
  // ==========================================================================

  describe('createFailedPayment', () => {
    it('should create payment with failed status', () => {
      const payment = createFailedPayment();

      expect(payment.status).toBe('failed');
      expect(payment.failure_reason).toBeDefined();
      expect(payment.tx_hash).toBeNull();
      expect(payment.verified_at).toBeNull();
    });

    it('should use specified failure reason', () => {
      const reasons: FailureReason[] = [
        'INSUFFICIENT_FUNDS',
        'INVALID_SIGNATURE',
        'EXPIRED_AUTHORIZATION',
        'NONCE_ALREADY_USED',
        'WRONG_RECIPIENT',
        'WRONG_AMOUNT',
      ];

      reasons.forEach(reason => {
        const payment = createFailedPayment(reason);
        expect(payment.failure_reason).toBe(reason);
      });
    });

    it('should default to INSUFFICIENT_FUNDS', () => {
      const payment = createFailedPayment();
      expect(payment.failure_reason).toBe('INSUFFICIENT_FUNDS');
    });
  });

  // ==========================================================================
  // createRefundedPayment
  // ==========================================================================

  describe('createRefundedPayment', () => {
    it('should create payment with refunded status', () => {
      const payment = createRefundedPayment();

      expect(payment.status).toBe('refunded');
      expect(payment.refund_tx_hash).toBeDefined();
      expect(payment.refunded_at).toBeDefined();
    });

    it('should copy details from original payment', () => {
      const original = createVerifiedPayment(0.02, 'tetris');
      const refunded = createRefundedPayment(original);

      expect(refunded.from_address).toBe(original.from_address);
      expect(refunded.amount_usdc).toBe(original.amount_usdc);
      expect(refunded.game_type).toBe(original.game_type);
    });

    it('should have valid refund transaction hash', () => {
      const payment = createRefundedPayment();
      expect(payment.refund_tx_hash).toMatch(/^0x[a-f0-9]{64}$/);
    });
  });

  // ==========================================================================
  // Payment Header Factories
  // ==========================================================================

  describe('createPaymentHeader', () => {
    it('should create valid payment header', () => {
      const header = createPaymentHeader();

      expect(header.version).toBe('2');
      expect(header.authorization.from).toBeDefined();
      expect(header.authorization.to).toBeDefined();
      expect(header.authorization.value).toBeDefined();
      expect(header.authorization.nonce).toBeDefined();
      expect(header.authorization.signature).toBeDefined();
    });

    it('should convert amount to atomic units', () => {
      const header = createPaymentHeader(0.01);
      expect(header.authorization.value).toBe('10000');
    });

    it('should accept custom options', () => {
      const customFrom = generateWalletAddress();
      const header = createPaymentHeader(0.02, { from: customFrom });

      expect(header.authorization.from).toBe(customFrom);
    });

    it('should set valid time window', () => {
      const header = createPaymentHeader();
      const now = Math.floor(Date.now() / 1000);
      const validBefore = parseInt(header.authorization.validBefore, 10);

      expect(validBefore).toBeGreaterThan(now);
    });

    it('should be valid according to isPaymentHeaderValid', () => {
      const header = createPaymentHeader();
      expect(isPaymentHeaderValid(header)).toBe(true);
    });
  });

  describe('encodePaymentHeader / decodePaymentHeader', () => {
    it('should encode to base64', () => {
      const header = createPaymentHeader();
      const encoded = encodePaymentHeader(header);

      expect(encoded).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });

    it('should round-trip correctly', () => {
      const header = createPaymentHeader();
      const encoded = encodePaymentHeader(header);
      const decoded = decodePaymentHeader(encoded);

      expect(decoded).toEqual(header);
    });

    it('should return null for invalid encoding', () => {
      expect(decodePaymentHeader('not-base64!@#')).toBeNull();
      expect(decodePaymentHeader('aW52YWxpZCBqc29u')).toBeNull(); // "invalid json"
    });
  });

  describe('createExpiredPaymentHeader', () => {
    it('should create header with past expiration', () => {
      const header = createExpiredPaymentHeader();
      expect(isPaymentHeaderValid(header)).toBe(false);
    });

    it('should have validBefore in the past', () => {
      const header = createExpiredPaymentHeader();
      const now = Math.floor(Date.now() / 1000);
      const validBefore = parseInt(header.authorization.validBefore, 10);

      expect(validBefore).toBeLessThan(now);
    });
  });

  describe('createWrongAmountPaymentHeader', () => {
    it('should create header with wrong amount', () => {
      const header = createWrongAmountPaymentHeader(0.01, 0.005);

      expect(header.authorization.value).toBe('5000'); // 0.005 * 1000000
    });
  });

  describe('createReusedNoncePaymentHeader', () => {
    it('should use specified nonce', () => {
      const nonce = '0x' + '1'.repeat(64) as `0x${string}`;
      const header = createReusedNoncePaymentHeader(nonce);

      expect(header.authorization.nonce).toBe(nonce);
    });
  });

  // ==========================================================================
  // Batch Factory Functions
  // ==========================================================================

  describe('createPayments', () => {
    it('should create specified number of payments', () => {
      const payments = createPayments(5);
      expect(payments.length).toBe(5);
    });

    it('should apply options to all payments', () => {
      const payments = createPayments(3, { game_type: 'tetris' });

      payments.forEach(p => {
        expect(p.game_type).toBe('tetris');
      });
    });
  });

  describe('createPlayerPaymentHistory', () => {
    it('should create payments for specific player', () => {
      const playerAddress = generateWalletAddress();
      const history = createPlayerPaymentHistory(playerAddress, 5);

      expect(history.length).toBe(5);
      history.forEach(p => {
        expect(p.from_address).toBe(playerAddress);
        expect(p.status).toBe('verified');
      });
    });

    it('should have different dates for each payment', () => {
      const history = createPlayerPaymentHistory(TEST_ADDRESSES.player1, 5);
      const dates = history.map(p => p.created_at);
      const uniqueDates = new Set(dates);

      expect(uniqueDates.size).toBe(5);
    });

    it('should use specified game type', () => {
      const history = createPlayerPaymentHistory(TEST_ADDRESSES.player1, 3, 'tetris');

      history.forEach(p => {
        expect(p.game_type).toBe('tetris');
        expect(p.amount_usdc).toBe(GAME_PRICES.tetris);
      });
    });
  });

  describe('createPaymentForSession', () => {
    it('should link payment to session', () => {
      const sessionId = 'session_123';
      const payment = createPaymentForSession(sessionId);

      expect(payment.session_id).toBe(sessionId);
      expect(payment.purpose).toBe('game_payment');
    });
  });

  describe('createPrizePayment', () => {
    it('should create prize payout payment', () => {
      const winnerAddress = generateWalletAddress();
      const payment = createPrizePayment(winnerAddress, 5.00);

      expect(payment.to_address).toBe(winnerAddress);
      expect(payment.from_address).toBe(TEST_ADDRESSES.arcade);
      expect(payment.amount_usdc).toBe(5.00);
      expect(payment.purpose).toBe('prize_payout');
      expect(payment.game_type).toBeNull();
    });
  });

  describe('createMixedStatePayments', () => {
    it('should create payments in all states', () => {
      const { pending, verified, failed, refunded, all } = createMixedStatePayments();

      expect(pending.length).toBeGreaterThan(0);
      expect(verified.length).toBeGreaterThan(0);
      expect(failed.length).toBeGreaterThan(0);
      expect(refunded.length).toBeGreaterThan(0);
      expect(all.length).toBe(pending.length + verified.length + failed.length + refunded.length);
    });

    it('should have correct status for each category', () => {
      const { pending, verified, failed, refunded } = createMixedStatePayments();

      pending.forEach(p => expect(p.status).toBe('pending'));
      verified.forEach(p => expect(p.status).toBe('verified'));
      failed.forEach(p => expect(p.status).toBe('failed'));
      refunded.forEach(p => expect(p.status).toBe('refunded'));
    });
  });

  // ==========================================================================
  // Validation Utilities
  // ==========================================================================

  describe('isValidPayment', () => {
    it('should return true for valid payments', () => {
      expect(isValidPayment(createPayment())).toBe(true);
      expect(isValidPayment(createPendingPayment())).toBe(true);
      expect(isValidPayment(createVerifiedPayment())).toBe(true);
      expect(isValidPayment(createFailedPayment())).toBe(true);
      expect(isValidPayment(createRefundedPayment())).toBe(true);
    });

    it('should return false for null/undefined', () => {
      expect(isValidPayment(null)).toBe(false);
      expect(isValidPayment(undefined)).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(isValidPayment('string')).toBe(false);
      expect(isValidPayment(123)).toBe(false);
      expect(isValidPayment([])).toBe(false);
    });

    it('should return false for invalid status', () => {
      const payment = createPayment();
      expect(isValidPayment({ ...payment, status: 'invalid' })).toBe(false);
    });
  });

  describe('isValidPaymentHeader', () => {
    it('should return true for valid headers', () => {
      const header = createPaymentHeader();
      expect(isValidPaymentHeader(header)).toBe(true);
    });

    it('should return false for null/undefined', () => {
      expect(isValidPaymentHeader(null)).toBe(false);
      expect(isValidPaymentHeader(undefined)).toBe(false);
    });

    it('should return false for missing authorization', () => {
      expect(isValidPaymentHeader({ version: '2' })).toBe(false);
    });

    it('should return false for invalid from address', () => {
      const header = createPaymentHeader();
      const invalid = {
        ...header,
        authorization: { ...header.authorization, from: 'not-an-address' },
      };
      expect(isValidPaymentHeader(invalid)).toBe(false);
    });
  });

  describe('isPaymentHeaderValid', () => {
    it('should return true for non-expired header', () => {
      const header = createPaymentHeader();
      expect(isPaymentHeaderValid(header)).toBe(true);
    });

    it('should return false for expired header', () => {
      const header = createExpiredPaymentHeader();
      expect(isPaymentHeaderValid(header)).toBe(false);
    });
  });

  describe('calculatePlayerTotal', () => {
    it('should sum verified payments for player', () => {
      const playerAddress = generateWalletAddress();
      const payments = [
        createVerifiedPayment(0.01, 'snake', { from_address: playerAddress }),
        createVerifiedPayment(0.02, 'tetris', { from_address: playerAddress }),
        createPendingPayment('snake', { from_address: playerAddress }), // Should not count
        createVerifiedPayment(0.01, 'snake', { from_address: generateWalletAddress() }), // Different player
      ];

      const total = calculatePlayerTotal(payments, playerAddress);
      expect(total).toBe(0.03); // 0.01 + 0.02
    });

    it('should return 0 for player with no payments', () => {
      const payments = createPayments(3);
      const total = calculatePlayerTotal(payments, generateWalletAddress());
      expect(total).toBe(0);
    });
  });

  describe('calculateGameTotal', () => {
    it('should sum verified payments for game type', () => {
      const payments = [
        createVerifiedPayment(0.01, 'snake'),
        createVerifiedPayment(0.01, 'snake'),
        createVerifiedPayment(0.02, 'tetris'),
        createPendingPayment('snake'), // Should not count
      ];

      expect(calculateGameTotal(payments, 'snake')).toBe(0.02);
      expect(calculateGameTotal(payments, 'tetris')).toBe(0.02);
    });
  });
});
