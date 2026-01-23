/**
 * Unit Tests for x402 Payment Types and Error Classes
 *
 * Tests verify:
 * - Interface shape compliance
 * - Error class instantiation
 * - Error serialization
 * - Static factory methods
 * - Helper function correctness
 *
 * @module server/x402/__tests__/types.test
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  X402Error,
  X402ValidationError,
  type X402ErrorCode,
  type ValidationErrorDetails,
} from '../errors.js';
import {
  type X402Config,
  type X402PaymentRequirement,
  type PaymentRequiredResponse,
  type X402PaymentHeader,
  type PaymentPayload,
  type X402SettlementRequest,
  type SettlementRequest,
  type X402SettlementResponse,
  type SettlementResponse,
  type X402VerificationResult,
  type PaymentInfo,
  type X402Request,
  type X402HandlerOptions,
  createPaymentRequiredResponse,
  headerToPayload,
  payloadToHeader,
  validatePaymentPayload,
  createSettlementRequest,
  createSettlementRequestFromPayload,
  validateSettlementRequest,
  parseSettlementResponse,
  createSuccessSettlementResponse,
  createFailedSettlementResponse,
  isSuccessfulSettlement,
  createPaymentInfo,
  createPendingPaymentInfo,
  createDefaultX402Config,
  validateX402Config,
} from '../types.js';

// Test constants
const TEST_PLAYER_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';
const TEST_ARCADE_ADDRESS = '0xabcdef1234567890abcdef1234567890abcdef12';
const TEST_TOKEN_ADDRESS = '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0';
const TEST_TX_HASH = '0x' + 'a'.repeat(64);
const TEST_NONCE = '0x' + 'b'.repeat(64);
const TEST_R = '0x' + 'c'.repeat(64);
const TEST_S = '0x' + 'd'.repeat(64);

// ============================================================
// X402Error Tests
// ============================================================

describe('X402Error', () => {
  describe('constructor', () => {
    it('should create an error with all properties', () => {
      const error = new X402Error('Test message', 'INVALID_PAYLOAD', 400, {
        field: 'test',
      });

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(X402Error);
      expect(error.name).toBe('X402Error');
      expect(error.message).toBe('Test message');
      expect(error.errorCode).toBe('INVALID_PAYLOAD');
      expect(error.httpStatus).toBe(400);
      expect(error.details).toEqual({ field: 'test' });
      expect(error.timestamp).toBeDefined();
    });

    it('should use default httpStatus of 400', () => {
      const error = new X402Error('Test', 'MISSING_HEADER');
      expect(error.httpStatus).toBe(400);
    });

    it('should have proper stack trace', () => {
      const error = new X402Error('Test', 'MISSING_HEADER');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('X402Error');
    });

    it('should set timestamp to ISO format', () => {
      const before = new Date().toISOString();
      const error = new X402Error('Test', 'MISSING_HEADER');
      const after = new Date().toISOString();

      expect(error.timestamp >= before).toBe(true);
      expect(error.timestamp <= after).toBe(true);
    });
  });

  describe('toJSON', () => {
    it('should serialize error to JSON structure', () => {
      const error = new X402Error('Test message', 'INVALID_PAYLOAD', 400, {
        field: 'test',
      });
      const json = error.toJSON();

      expect(json).toEqual({
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'Test message',
          details: { field: 'test' },
          timestamp: error.timestamp,
        },
      });
    });

    it('should omit details when not provided', () => {
      const error = new X402Error('Test', 'MISSING_HEADER');
      const json = error.toJSON();

      expect(json.error.details).toBeUndefined();
    });
  });

  describe('toString', () => {
    it('should format error as string', () => {
      const error = new X402Error('Test message', 'INVALID_PAYLOAD');
      expect(error.toString()).toBe('X402Error [INVALID_PAYLOAD]: Test message');
    });
  });

  // Static Factory Methods - Payment Required (402)
  describe('static paymentRequired', () => {
    it('should create payment required error with default message', () => {
      const error = X402Error.paymentRequired();
      expect(error.message).toBe('Payment required');
      expect(error.errorCode).toBe('MISSING_HEADER');
      expect(error.httpStatus).toBe(402);
    });

    it('should create payment required error with custom message', () => {
      const error = X402Error.paymentRequired('Pay to play Snake');
      expect(error.message).toBe('Pay to play Snake');
    });
  });

  describe('static missingHeader', () => {
    it('should create missing header error', () => {
      const error = X402Error.missingHeader();
      expect(error.message).toBe('X-Payment header is required');
      expect(error.errorCode).toBe('MISSING_HEADER');
      expect(error.httpStatus).toBe(402);
    });
  });

  describe('static invalidJson', () => {
    it('should create invalid JSON error without details', () => {
      const error = X402Error.invalidJson();
      expect(error.message).toBe('Invalid payment header format');
      expect(error.errorCode).toBe('INVALID_JSON');
      expect(error.httpStatus).toBe(400);
      expect(error.details).toBeUndefined();
    });

    it('should create invalid JSON error with parse error', () => {
      const error = X402Error.invalidJson('Unexpected token');
      expect(error.details).toEqual({ parseError: 'Unexpected token' });
    });
  });

  describe('static invalidVersion', () => {
    it('should create invalid version error', () => {
      const error = X402Error.invalidVersion('2');
      expect(error.message).toBe('Unsupported x402 version: 2');
      expect(error.errorCode).toBe('INVALID_VERSION');
      expect(error.details).toEqual({
        receivedVersion: '2',
        supportedVersion: '1',
      });
    });
  });

  describe('static invalidScheme', () => {
    it('should create invalid scheme error', () => {
      const error = X402Error.invalidScheme('partial');
      expect(error.message).toBe('Unsupported payment scheme: partial');
      expect(error.errorCode).toBe('INVALID_SCHEME');
      expect(error.details).toEqual({
        receivedScheme: 'partial',
        supportedSchemes: ['exact'],
      });
    });
  });

  describe('static invalidNetwork', () => {
    it('should create invalid network error', () => {
      const error = X402Error.invalidNetwork('ethereum-mainnet', 'cronos-testnet');
      expect(error.message).toBe('Invalid network: ethereum-mainnet');
      expect(error.errorCode).toBe('INVALID_NETWORK');
      expect(error.details).toEqual({
        receivedNetwork: 'ethereum-mainnet',
        expectedNetwork: 'cronos-testnet',
      });
    });

    it('should omit expected network when not provided', () => {
      const error = X402Error.invalidNetwork('unknown');
      expect(error.details).toEqual({ receivedNetwork: 'unknown' });
    });
  });

  describe('static invalidPayload', () => {
    it('should create invalid payload error with validation errors', () => {
      const errors = ['Invalid from address', 'Invalid value'];
      const error = X402Error.invalidPayload(errors);
      expect(error.message).toBe('Invalid payment payload');
      expect(error.errorCode).toBe('INVALID_PAYLOAD');
      expect(error.details).toEqual({ validationErrors: errors });
    });
  });

  describe('static amountMismatch', () => {
    it('should create amount mismatch error', () => {
      const error = X402Error.amountMismatch('10000', '5000');
      expect(error.message).toBe(
        'Payment amount mismatch: expected 10000, received 5000',
      );
      expect(error.errorCode).toBe('AMOUNT_MISMATCH');
      expect(error.details).toEqual({
        expectedAmount: '10000',
        receivedAmount: '5000',
      });
    });
  });

  describe('static recipientMismatch', () => {
    it('should create recipient mismatch error', () => {
      const error = X402Error.recipientMismatch(
        TEST_ARCADE_ADDRESS,
        TEST_PLAYER_ADDRESS,
      );
      expect(error.message).toBe('Payment recipient mismatch');
      expect(error.errorCode).toBe('RECIPIENT_MISMATCH');
      expect(error.details).toEqual({
        expectedRecipient: TEST_ARCADE_ADDRESS,
        receivedRecipient: TEST_PLAYER_ADDRESS,
      });
    });
  });

  describe('static authorizationExpired', () => {
    it('should create authorization expired error', () => {
      const error = X402Error.authorizationExpired('1735689600');
      expect(error.message).toBe('Payment authorization has expired');
      expect(error.errorCode).toBe('AUTHORIZATION_EXPIRED');
      expect(error.details?.validBefore).toBe('1735689600');
      expect(error.details?.currentTime).toBeDefined();
    });
  });

  describe('static authorizationNotYetValid', () => {
    it('should create authorization not yet valid error', () => {
      const error = X402Error.authorizationNotYetValid('1999999999');
      expect(error.message).toBe('Payment authorization is not yet valid');
      expect(error.errorCode).toBe('AUTHORIZATION_NOT_YET_VALID');
      expect(error.details?.validAfter).toBe('1999999999');
    });
  });

  // Settlement errors
  describe('static invalidSignature', () => {
    it('should create invalid signature error', () => {
      const error = X402Error.invalidSignature();
      expect(error.message).toBe('Invalid payment signature');
      expect(error.errorCode).toBe('INVALID_SIGNATURE');
      expect(error.httpStatus).toBe(400);
    });
  });

  describe('static insufficientBalance', () => {
    it('should create insufficient balance error without payer', () => {
      const error = X402Error.insufficientBalance();
      expect(error.message).toBe('Insufficient token balance');
      expect(error.errorCode).toBe('INSUFFICIENT_BALANCE');
      expect(error.details).toBeUndefined();
    });

    it('should create insufficient balance error with payer', () => {
      const error = X402Error.insufficientBalance(TEST_PLAYER_ADDRESS);
      expect(error.details).toEqual({ payerAddress: TEST_PLAYER_ADDRESS });
    });
  });

  describe('static nonceAlreadyUsed', () => {
    it('should create nonce already used error', () => {
      const error = X402Error.nonceAlreadyUsed(TEST_NONCE);
      expect(error.message).toBe('Authorization nonce has already been used');
      expect(error.errorCode).toBe('NONCE_ALREADY_USED');
      expect(error.details).toEqual({ nonce: TEST_NONCE });
    });
  });

  describe('static invalidToken', () => {
    it('should create invalid token error', () => {
      const error = X402Error.invalidToken(TEST_TOKEN_ADDRESS);
      expect(error.message).toBe('Token not supported for x402 payments');
      expect(error.errorCode).toBe('INVALID_TOKEN');
      expect(error.details).toEqual({ tokenAddress: TEST_TOKEN_ADDRESS });
    });
  });

  describe('static unsupportedChain', () => {
    it('should create unsupported chain error', () => {
      const error = X402Error.unsupportedChain(1);
      expect(error.message).toBe('Chain not supported for x402 payments');
      expect(error.errorCode).toBe('UNSUPPORTED_CHAIN');
      expect(error.details).toEqual({ chainId: 1 });
    });
  });

  describe('static facilitatorError', () => {
    it('should create facilitator error with default message', () => {
      const error = X402Error.facilitatorError();
      expect(error.message).toBe('Facilitator service error');
      expect(error.errorCode).toBe('FACILITATOR_ERROR');
      expect(error.httpStatus).toBe(502);
    });

    it('should create facilitator error with custom message', () => {
      const error = X402Error.facilitatorError('Rate limit exceeded', {
        retryAfter: 60,
      });
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.details).toEqual({ retryAfter: 60 });
    });
  });

  describe('static networkError', () => {
    it('should create network error', () => {
      const error = X402Error.networkError('Connection refused');
      expect(error.message).toBe('Connection refused');
      expect(error.errorCode).toBe('NETWORK_ERROR');
      expect(error.httpStatus).toBe(502);
    });
  });

  describe('static timeout', () => {
    it('should create timeout error', () => {
      const error = X402Error.timeout(30000);
      expect(error.message).toBe('Settlement request timed out');
      expect(error.errorCode).toBe('TIMEOUT');
      expect(error.httpStatus).toBe(504);
      expect(error.details).toEqual({ timeoutMs: 30000 });
    });
  });

  describe('static internalError', () => {
    it('should create internal error', () => {
      const error = X402Error.internalError('Database error', { query: 'SELECT' });
      expect(error.message).toBe('Database error');
      expect(error.errorCode).toBe('INTERNAL_ERROR');
      expect(error.httpStatus).toBe(500);
      expect(error.details).toEqual({ query: 'SELECT' });
    });
  });

  describe('static fromSettlementErrorCode', () => {
    it('should map INVALID_SIGNATURE', () => {
      const error = X402Error.fromSettlementErrorCode('INVALID_SIGNATURE');
      expect(error.errorCode).toBe('INVALID_SIGNATURE');
    });

    it('should map EXPIRED_AUTHORIZATION', () => {
      const error = X402Error.fromSettlementErrorCode('EXPIRED_AUTHORIZATION');
      expect(error.errorCode).toBe('AUTHORIZATION_EXPIRED');
    });

    it('should map INSUFFICIENT_BALANCE', () => {
      const error = X402Error.fromSettlementErrorCode('INSUFFICIENT_BALANCE');
      expect(error.errorCode).toBe('INSUFFICIENT_BALANCE');
    });

    it('should map NONCE_ALREADY_USED', () => {
      const error = X402Error.fromSettlementErrorCode('NONCE_ALREADY_USED');
      expect(error.errorCode).toBe('NONCE_ALREADY_USED');
    });

    it('should map INVALID_TOKEN', () => {
      const error = X402Error.fromSettlementErrorCode('INVALID_TOKEN');
      expect(error.errorCode).toBe('INVALID_TOKEN');
    });

    it('should map UNSUPPORTED_CHAIN', () => {
      const error = X402Error.fromSettlementErrorCode('UNSUPPORTED_CHAIN');
      expect(error.errorCode).toBe('UNSUPPORTED_CHAIN');
    });

    it('should map FACILITATOR_ERROR', () => {
      const error = X402Error.fromSettlementErrorCode('FACILITATOR_ERROR', 'Service down');
      expect(error.errorCode).toBe('FACILITATOR_ERROR');
    });

    it('should map NETWORK_ERROR', () => {
      const error = X402Error.fromSettlementErrorCode('NETWORK_ERROR');
      expect(error.errorCode).toBe('NETWORK_ERROR');
    });

    it('should map TIMEOUT', () => {
      const error = X402Error.fromSettlementErrorCode('TIMEOUT');
      expect(error.errorCode).toBe('TIMEOUT');
    });
  });

  describe('static isX402Error', () => {
    it('should return true for X402Error instances', () => {
      const error = new X402Error('Test', 'MISSING_HEADER');
      expect(X402Error.isX402Error(error)).toBe(true);
    });

    it('should return false for regular Error instances', () => {
      const error = new Error('Test');
      expect(X402Error.isX402Error(error)).toBe(false);
    });

    it('should return false for non-error values', () => {
      expect(X402Error.isX402Error(null)).toBe(false);
      expect(X402Error.isX402Error(undefined)).toBe(false);
      expect(X402Error.isX402Error('error')).toBe(false);
    });
  });

  describe('static wrap', () => {
    it('should return X402Error unchanged', () => {
      const original = new X402Error('Test', 'MISSING_HEADER');
      const wrapped = X402Error.wrap(original);
      expect(wrapped).toBe(original);
    });

    it('should wrap regular Error', () => {
      const original = new Error('Something went wrong');
      const wrapped = X402Error.wrap(original);
      expect(wrapped).toBeInstanceOf(X402Error);
      expect(wrapped.message).toBe('Something went wrong');
      expect(wrapped.errorCode).toBe('INTERNAL_ERROR');
      expect(wrapped.details?.originalError).toBe('Error');
    });

    it('should wrap string error', () => {
      const wrapped = X402Error.wrap('String error');
      expect(wrapped.message).toBe('String error');
      expect(wrapped.errorCode).toBe('INTERNAL_ERROR');
    });
  });
});

// ============================================================
// X402ValidationError Tests
// ============================================================

describe('X402ValidationError', () => {
  describe('constructor', () => {
    it('should create a validation error with all properties', () => {
      const details: ValidationErrorDetails = {
        field: 'value',
        expected: '10000',
        actual: '5000',
        context: { currency: 'USDC' },
      };
      const error = new X402ValidationError(
        'Amount mismatch',
        'AMOUNT_MISMATCH',
        details,
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(X402Error);
      expect(error).toBeInstanceOf(X402ValidationError);
      expect(error.name).toBe('X402ValidationError');
      expect(error.message).toBe('Amount mismatch');
      expect(error.errorCode).toBe('AMOUNT_MISMATCH');
      expect(error.httpStatus).toBe(400);
      expect(error.field).toBe('value');
      expect(error.expected).toBe('10000');
      expect(error.actual).toBe('5000');
      expect(error.context).toEqual({ currency: 'USDC' });
    });

    it('should handle missing optional fields', () => {
      const error = new X402ValidationError('Missing field', 'INVALID_PAYLOAD', {
        field: 'from',
      });
      expect(error.expected).toBeUndefined();
      expect(error.actual).toBeUndefined();
      expect(error.context).toBeUndefined();
    });
  });

  describe('toJSON', () => {
    it('should serialize with validation-specific fields', () => {
      const error = new X402ValidationError('Test', 'INVALID_PAYLOAD', {
        field: 'from',
        expected: 'valid address',
        actual: 'invalid',
      });
      const json = error.toJSON();

      expect(json.error.field).toBe('from');
      expect(json.error.expected).toBe('valid address');
      expect(json.error.actual).toBe('invalid');
    });

    it('should omit undefined fields', () => {
      const error = new X402ValidationError('Test', 'INVALID_PAYLOAD', {
        field: 'from',
      });
      const json = error.toJSON();

      expect(json.error.expected).toBeUndefined();
      expect(json.error.actual).toBeUndefined();
      expect(json.error.context).toBeUndefined();
    });
  });

  describe('toString', () => {
    it('should include field information', () => {
      const error = new X402ValidationError('Test', 'INVALID_PAYLOAD', {
        field: 'from',
        expected: 'address',
        actual: 'invalid',
      });
      const str = error.toString();

      expect(str).toContain('X402ValidationError [INVALID_PAYLOAD]: Test');
      expect(str).toContain('Field: from');
      expect(str).toContain('Expected: "address"');
      expect(str).toContain('Actual: "invalid"');
    });
  });

  // Static factory methods
  describe('static invalidField', () => {
    it('should create invalid field error', () => {
      const error = X402ValidationError.invalidField('from', 'valid address', 'xyz');
      expect(error.message).toContain("Invalid value for field 'from'");
      expect(error.field).toBe('from');
      expect(error.expected).toBe('valid address');
      expect(error.actual).toBe('xyz');
    });
  });

  describe('static missingField', () => {
    it('should create missing field error', () => {
      const error = X402ValidationError.missingField('signature');
      expect(error.message).toContain("Missing required field: 'signature'");
      expect(error.field).toBe('signature');
      expect(error.expected).toBe('present');
      expect(error.actual).toBe('missing');
    });
  });

  describe('static typeMismatch', () => {
    it('should create type mismatch error', () => {
      const error = X402ValidationError.typeMismatch('value', 'string', 'number');
      expect(error.message).toContain("Type mismatch for field 'value'");
      expect(error.field).toBe('value');
      expect(error.expected).toBe('string');
      expect(error.actual).toBe('number');
    });
  });

  describe('static versionMismatch', () => {
    it('should create version mismatch error', () => {
      const error = X402ValidationError.versionMismatch('2', '1');
      expect(error.message).toContain('Unsupported x402 version: 2');
      expect(error.errorCode).toBe('INVALID_VERSION');
      expect(error.field).toBe('x402Version');
    });
  });

  describe('static schemeMismatch', () => {
    it('should create scheme mismatch error', () => {
      const error = X402ValidationError.schemeMismatch('partial');
      expect(error.message).toContain('Unsupported payment scheme: partial');
      expect(error.errorCode).toBe('INVALID_SCHEME');
    });
  });

  describe('static networkMismatch', () => {
    it('should create network mismatch error', () => {
      const error = X402ValidationError.networkMismatch(
        'ethereum',
        'cronos-testnet',
      );
      expect(error.errorCode).toBe('INVALID_NETWORK');
      expect(error.expected).toBe('cronos-testnet');
      expect(error.actual).toBe('ethereum');
    });
  });

  describe('static invalidAddress', () => {
    it('should create invalid address error', () => {
      const error = X402ValidationError.invalidAddress('from', 'invalid-addr');
      expect(error.message).toContain("Invalid Ethereum address for 'from'");
      expect(error.field).toBe('from');
    });
  });

  describe('static recipientMismatch', () => {
    it('should create recipient mismatch error', () => {
      const error = X402ValidationError.recipientMismatch(
        TEST_ARCADE_ADDRESS,
        TEST_PLAYER_ADDRESS,
      );
      expect(error.errorCode).toBe('RECIPIENT_MISMATCH');
      expect(error.field).toBe('to');
    });
  });

  describe('static amountMismatch', () => {
    it('should create amount mismatch error', () => {
      const error = X402ValidationError.amountMismatch('10000', '5000', {
        currency: 'USDC',
      });
      expect(error.errorCode).toBe('AMOUNT_MISMATCH');
      expect(error.field).toBe('value');
      expect(error.context).toEqual({ currency: 'USDC' });
    });
  });

  describe('static invalidAmount', () => {
    it('should create invalid amount error', () => {
      const error = X402ValidationError.invalidAmount('abc', 'not a number');
      expect(error.field).toBe('value');
      expect(error.context?.reason).toBe('not a number');
    });
  });

  describe('static invalidSignatureComponent', () => {
    it('should create invalid v component error', () => {
      const error = X402ValidationError.invalidSignatureComponent('v', 30);
      expect(error.field).toBe('v');
      expect(error.expected).toBe('27 or 28');
    });

    it('should create invalid r component error', () => {
      const error = X402ValidationError.invalidSignatureComponent('r', 'invalid');
      expect(error.field).toBe('r');
      expect(error.expected).toContain('0x-prefixed hex string');
    });
  });

  describe('static invalidNonce', () => {
    it('should create invalid nonce error', () => {
      const error = X402ValidationError.invalidNonce('0x123');
      expect(error.field).toBe('nonce');
      expect(error.expected).toContain('32 bytes');
    });
  });

  describe('static authorizationExpired', () => {
    it('should create authorization expired error', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600;
      const error = X402ValidationError.authorizationExpired(
        pastTime.toString(),
        Math.floor(Date.now() / 1000),
      );
      expect(error.errorCode).toBe('AUTHORIZATION_EXPIRED');
      expect(error.context?.expiredAgo).toBeDefined();
    });
  });

  describe('static authorizationNotYetValid', () => {
    it('should create authorization not yet valid error', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const error = X402ValidationError.authorizationNotYetValid(
        futureTime.toString(),
      );
      expect(error.errorCode).toBe('AUTHORIZATION_NOT_YET_VALID');
      expect(error.context?.validIn).toBeDefined();
    });
  });

  describe('static invalidTimestamp', () => {
    it('should create invalid timestamp error', () => {
      const error = X402ValidationError.invalidTimestamp('validBefore', 'abc');
      expect(error.field).toBe('validBefore');
      expect(error.expected).toContain('numeric string');
    });
  });

  describe('static missingHeader', () => {
    it('should create missing header error', () => {
      const error = X402ValidationError.missingHeader();
      expect(error.field).toBe('X-Payment');
      expect(error.errorCode).toBe('MISSING_HEADER');
    });
  });

  describe('static invalidJson', () => {
    it('should create invalid JSON error', () => {
      const error = X402ValidationError.invalidJson('Unexpected token');
      expect(error.field).toBe('X-Payment');
      expect(error.errorCode).toBe('INVALID_JSON');
      expect(error.context?.parseError).toBe('Unexpected token');
    });
  });

  describe('static fromMultipleErrors', () => {
    it('should create error from multiple validation errors', () => {
      const errors = ['Invalid from', 'Invalid to', 'Invalid value'];
      const details = [{ field: 'from' }, { field: 'to' }, { field: 'value' }];
      const error = X402ValidationError.fromMultipleErrors(errors, details);

      expect(error.message).toContain('Multiple validation errors');
      expect(error.context?.errorCount).toBe(3);
      expect(error.context?.errors).toEqual(errors);
    });
  });

  describe('static isValidationError', () => {
    it('should return true for X402ValidationError', () => {
      const error = X402ValidationError.missingField('test');
      expect(X402ValidationError.isValidationError(error)).toBe(true);
    });

    it('should return false for X402Error', () => {
      const error = X402Error.missingHeader();
      expect(X402ValidationError.isValidationError(error)).toBe(false);
    });
  });

  describe('static getValidationErrorCodes', () => {
    it('should return all validation error codes', () => {
      const codes = X402ValidationError.getValidationErrorCodes();
      expect(codes).toContain('MISSING_HEADER');
      expect(codes).toContain('INVALID_JSON');
      expect(codes).toContain('INVALID_VERSION');
      expect(codes).toContain('INVALID_SCHEME');
      expect(codes).toContain('INVALID_NETWORK');
      expect(codes).toContain('INVALID_PAYLOAD');
      expect(codes).toContain('AMOUNT_MISMATCH');
      expect(codes).toContain('RECIPIENT_MISMATCH');
      expect(codes).toContain('AUTHORIZATION_EXPIRED');
      expect(codes).toContain('AUTHORIZATION_NOT_YET_VALID');
      expect(codes.length).toBe(10);
    });
  });
});

// ============================================================
// Type Helper Function Tests
// ============================================================

describe('Types Helper Functions', () => {
  describe('headerToPayload', () => {
    it('should convert X402PaymentHeader to PaymentPayload', () => {
      const header: X402PaymentHeader = {
        x402Version: '1',
        scheme: 'exact',
        network: 'cronos-testnet',
        payload: {
          message: {
            from: TEST_PLAYER_ADDRESS,
            to: TEST_ARCADE_ADDRESS,
            value: '10000',
            validAfter: '0',
            validBefore: '1735689600',
            nonce: TEST_NONCE,
          },
          v: 27,
          r: TEST_R,
          s: TEST_S,
        },
      };

      const payload = headerToPayload(header);

      expect(payload.version).toBe('1');
      expect(payload.scheme).toBe('exact');
      expect(payload.network).toBe('cronos-testnet');
      expect(payload.from).toBe(TEST_PLAYER_ADDRESS);
      expect(payload.to).toBe(TEST_ARCADE_ADDRESS);
      expect(payload.value).toBe('10000');
      expect(payload.validAfter).toBe('0');
      expect(payload.validBefore).toBe('1735689600');
      expect(payload.nonce).toBe(TEST_NONCE);
      expect(payload.v).toBe(27);
      expect(payload.r).toBe(TEST_R);
      expect(payload.s).toBe(TEST_S);
    });

    it('should convert bigint values to strings', () => {
      const header: X402PaymentHeader = {
        x402Version: '1',
        scheme: 'exact',
        network: 'cronos-testnet',
        payload: {
          message: {
            from: TEST_PLAYER_ADDRESS,
            to: TEST_ARCADE_ADDRESS,
            value: 10000n as unknown as string,
            validAfter: 0n as unknown as string,
            validBefore: 1735689600n as unknown as string,
            nonce: TEST_NONCE,
          },
          v: 28,
          r: TEST_R,
          s: TEST_S,
        },
      };

      const payload = headerToPayload(header);
      expect(payload.value).toBe('10000');
      expect(payload.validAfter).toBe('0');
      expect(payload.validBefore).toBe('1735689600');
    });
  });

  describe('payloadToHeader', () => {
    it('should convert PaymentPayload to X402PaymentHeader', () => {
      const payload: PaymentPayload = {
        version: '1',
        scheme: 'exact',
        network: 'cronos-testnet',
        from: TEST_PLAYER_ADDRESS,
        to: TEST_ARCADE_ADDRESS,
        value: '10000',
        validAfter: '0',
        validBefore: '1735689600',
        nonce: TEST_NONCE,
        v: 27,
        r: TEST_R,
        s: TEST_S,
      };

      const header = payloadToHeader(payload);

      expect(header.x402Version).toBe('1');
      expect(header.scheme).toBe('exact');
      expect(header.network).toBe('cronos-testnet');
      expect(header.payload.message.from).toBe(TEST_PLAYER_ADDRESS);
      expect(header.payload.message.to).toBe(TEST_ARCADE_ADDRESS);
      expect(header.payload.v).toBe(27);
      expect(header.payload.r).toBe(TEST_R);
      expect(header.payload.s).toBe(TEST_S);
    });

    it('should round-trip correctly with headerToPayload', () => {
      const original: PaymentPayload = {
        version: '1',
        scheme: 'exact',
        network: 'cronos-testnet',
        from: TEST_PLAYER_ADDRESS,
        to: TEST_ARCADE_ADDRESS,
        value: '10000',
        validAfter: '0',
        validBefore: '1735689600',
        nonce: TEST_NONCE,
        v: 28,
        r: TEST_R,
        s: TEST_S,
      };

      const header = payloadToHeader(original);
      const roundTripped = headerToPayload(header);

      expect(roundTripped).toEqual(original);
    });
  });

  describe('validatePaymentPayload', () => {
    const validPayload: PaymentPayload = {
      version: '1',
      scheme: 'exact',
      network: 'cronos-testnet',
      from: TEST_PLAYER_ADDRESS,
      to: TEST_ARCADE_ADDRESS,
      value: '10000',
      validAfter: '0',
      validBefore: '1735689600',
      nonce: TEST_NONCE,
      v: 27,
      r: TEST_R,
      s: TEST_S,
    };

    it('should validate a correct payload', () => {
      const result = validatePaymentPayload(validPayload);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid version', () => {
      const result = validatePaymentPayload({
        ...validPayload,
        version: '2' as '1',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Invalid version: 2, expected '1'");
    });

    it('should reject invalid scheme', () => {
      const result = validatePaymentPayload({
        ...validPayload,
        scheme: 'partial' as 'exact',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Invalid scheme: partial, expected 'exact'");
    });

    it('should reject missing network', () => {
      const result = validatePaymentPayload({
        ...validPayload,
        network: '',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid network');
    });

    it('should reject invalid from address', () => {
      const result = validatePaymentPayload({
        ...validPayload,
        from: 'invalid',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Invalid 'from' address"))).toBe(
        true,
      );
    });

    it('should reject invalid to address', () => {
      const result = validatePaymentPayload({
        ...validPayload,
        to: 'invalid',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Invalid 'to' address"))).toBe(
        true,
      );
    });

    it('should reject non-numeric value', () => {
      const result = validatePaymentPayload({
        ...validPayload,
        value: 'abc',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid value'))).toBe(true);
    });

    it('should reject zero value', () => {
      const result = validatePaymentPayload({
        ...validPayload,
        value: '0',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Value must be positive');
    });

    it('should reject invalid nonce format', () => {
      const result = validatePaymentPayload({
        ...validPayload,
        nonce: '0x123',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid nonce format'))).toBe(
        true,
      );
    });

    it('should reject invalid v value', () => {
      const result = validatePaymentPayload({
        ...validPayload,
        v: 30,
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid v value'))).toBe(true);
    });

    it('should reject invalid r format', () => {
      const result = validatePaymentPayload({
        ...validPayload,
        r: '0x123',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid r value format'))).toBe(
        true,
      );
    });

    it('should reject invalid s format', () => {
      const result = validatePaymentPayload({
        ...validPayload,
        s: 'invalid',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid s value format'))).toBe(
        true,
      );
    });

    it('should collect multiple errors', () => {
      const result = validatePaymentPayload({
        ...validPayload,
        version: '2' as '1',
        from: 'invalid',
        v: 30,
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('createSettlementRequest', () => {
    it('should convert X402SettlementRequest to SettlementRequest', () => {
      const request: X402SettlementRequest = {
        authorization: {
          from: TEST_PLAYER_ADDRESS,
          to: TEST_ARCADE_ADDRESS,
          value: '10000',
          validAfter: '0',
          validBefore: '1735689600',
          nonce: TEST_NONCE,
        },
        signature: {
          v: 27,
          r: TEST_R,
          s: TEST_S,
        },
        chainId: 338,
        tokenAddress: TEST_TOKEN_ADDRESS,
      };

      const result = createSettlementRequest(request);

      expect(result.authorization.from).toBe(TEST_PLAYER_ADDRESS);
      expect(result.authorization.to).toBe(TEST_ARCADE_ADDRESS);
      expect(result.authorization.value).toBe('10000');
      expect(result.authorization.v).toBe(27);
      expect(result.authorization.r).toBe(TEST_R);
      expect(result.authorization.s).toBe(TEST_S);
      expect(result.chainId).toBe(338);
      expect(result.tokenAddress).toBe(TEST_TOKEN_ADDRESS);
    });

    it('should handle bigint values', () => {
      const request: X402SettlementRequest = {
        authorization: {
          from: TEST_PLAYER_ADDRESS,
          to: TEST_ARCADE_ADDRESS,
          value: 10000n as unknown as string,
          validAfter: 0n as unknown as string,
          validBefore: 1735689600n as unknown as string,
          nonce: TEST_NONCE,
        },
        signature: { v: 27, r: TEST_R, s: TEST_S },
        chainId: 338,
        tokenAddress: TEST_TOKEN_ADDRESS,
      };

      const result = createSettlementRequest(request);
      expect(result.authorization.value).toBe('10000');
      expect(result.authorization.validAfter).toBe('0');
      expect(result.authorization.validBefore).toBe('1735689600');
    });
  });

  describe('createSettlementRequestFromPayload', () => {
    it('should create SettlementRequest from PaymentPayload', () => {
      const payload: PaymentPayload = {
        version: '1',
        scheme: 'exact',
        network: 'cronos-testnet',
        from: TEST_PLAYER_ADDRESS,
        to: TEST_ARCADE_ADDRESS,
        value: '10000',
        validAfter: '0',
        validBefore: '1735689600',
        nonce: TEST_NONCE,
        v: 27,
        r: TEST_R,
        s: TEST_S,
      };

      const config: X402Config = {
        payTo: TEST_ARCADE_ADDRESS,
        paymentAmount: '10000',
        tokenAddress: TEST_TOKEN_ADDRESS,
        tokenName: 'Bridged USDC',
        tokenDecimals: 6,
        facilitatorUrl: 'https://facilitator.test',
        chainId: 338,
      };

      const result = createSettlementRequestFromPayload(payload, config);

      expect(result.authorization.from).toBe(TEST_PLAYER_ADDRESS);
      expect(result.authorization.value).toBe('10000');
      expect(result.chainId).toBe(338);
      expect(result.tokenAddress).toBe(TEST_TOKEN_ADDRESS);
    });
  });

  describe('validateSettlementRequest', () => {
    const validRequest: SettlementRequest = {
      authorization: {
        from: TEST_PLAYER_ADDRESS,
        to: TEST_ARCADE_ADDRESS,
        value: '10000',
        validAfter: '0',
        validBefore: '1735689600',
        nonce: TEST_NONCE,
        v: 27,
        r: TEST_R,
        s: TEST_S,
      },
      chainId: 338,
      tokenAddress: TEST_TOKEN_ADDRESS,
    };

    it('should validate a correct request', () => {
      const result = validateSettlementRequest(validRequest);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid from address', () => {
      const result = validateSettlementRequest({
        ...validRequest,
        authorization: { ...validRequest.authorization, from: 'invalid' },
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Invalid 'from' address"))).toBe(
        true,
      );
    });

    it('should reject invalid token address', () => {
      const result = validateSettlementRequest({
        ...validRequest,
        tokenAddress: 'invalid',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid token address'))).toBe(
        true,
      );
    });

    it('should reject invalid chainId', () => {
      const result = validateSettlementRequest({
        ...validRequest,
        chainId: 0,
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid chainId'))).toBe(true);
    });
  });

  describe('parseSettlementResponse', () => {
    it('should parse successful settlement response', () => {
      const response: SettlementResponse = {
        success: true,
        transaction: {
          hash: TEST_TX_HASH,
          blockNumber: 12345678,
        },
      };

      const result = parseSettlementResponse(response);

      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe(TEST_TX_HASH);
      expect(result.blockNumber).toBe(12345678);
      expect(result.settledAt).toBeDefined();
    });

    it('should parse failed settlement response', () => {
      const response: SettlementResponse = {
        success: false,
        error: {
          code: 'INSUFFICIENT_BALANCE',
          message: 'Not enough USDC',
        },
      };

      const result = parseSettlementResponse(response);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INSUFFICIENT_BALANCE');
      expect(result.errorMessage).toBe('Not enough USDC');
    });

    it('should handle missing error details', () => {
      const response: SettlementResponse = {
        success: false,
      };

      const result = parseSettlementResponse(response);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('UNKNOWN_ERROR');
      expect(result.errorMessage).toContain('unknown error');
    });

    it('should use provided timestamp', () => {
      const timestamp = new Date('2026-01-15T12:00:00Z');
      const response: SettlementResponse = {
        success: true,
        transaction: { hash: TEST_TX_HASH, blockNumber: 123 },
      };

      const result = parseSettlementResponse(response, timestamp);
      expect(result.settledAt).toBe('2026-01-15T12:00:00.000Z');
    });
  });

  describe('createSuccessSettlementResponse', () => {
    it('should create success response', () => {
      const result = createSuccessSettlementResponse(TEST_TX_HASH, 12345678);

      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe(TEST_TX_HASH);
      expect(result.blockNumber).toBe(12345678);
      expect(result.settledAt).toBeDefined();
    });
  });

  describe('createFailedSettlementResponse', () => {
    it('should create failed response', () => {
      const result = createFailedSettlementResponse(
        'INSUFFICIENT_BALANCE',
        'Not enough tokens',
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INSUFFICIENT_BALANCE');
      expect(result.errorMessage).toBe('Not enough tokens');
      expect(result.settledAt).toBeDefined();
    });
  });

  describe('isSuccessfulSettlement', () => {
    it('should return true for successful settlement', () => {
      const response: X402SettlementResponse = {
        success: true,
        transactionHash: TEST_TX_HASH,
        blockNumber: 12345678,
        settledAt: new Date().toISOString(),
      };

      expect(isSuccessfulSettlement(response)).toBe(true);
    });

    it('should return false for failed settlement', () => {
      const response: X402SettlementResponse = {
        success: false,
        errorCode: 'INSUFFICIENT_BALANCE',
        errorMessage: 'Not enough',
        settledAt: new Date().toISOString(),
      };

      expect(isSuccessfulSettlement(response)).toBe(false);
    });

    it('should return false when missing transaction hash', () => {
      const response: X402SettlementResponse = {
        success: true,
        settledAt: new Date().toISOString(),
      };

      expect(isSuccessfulSettlement(response)).toBe(false);
    });
  });

  describe('createPaymentInfo', () => {
    it('should create PaymentInfo from settlement result', () => {
      const payload: PaymentPayload = {
        version: '1',
        scheme: 'exact',
        network: 'cronos-testnet',
        from: TEST_PLAYER_ADDRESS,
        to: TEST_ARCADE_ADDRESS,
        value: '10000',
        validAfter: '0',
        validBefore: '1735689600',
        nonce: TEST_NONCE,
        v: 27,
        r: TEST_R,
        s: TEST_S,
      };

      const settlement: X402SettlementResponse = {
        success: true,
        transactionHash: TEST_TX_HASH,
        blockNumber: 12345678,
        settledAt: new Date().toISOString(),
      };

      const config: X402Config = {
        payTo: TEST_ARCADE_ADDRESS,
        paymentAmount: '10000',
        tokenAddress: TEST_TOKEN_ADDRESS,
        tokenName: 'Bridged USDC',
        tokenDecimals: 6,
        facilitatorUrl: 'https://facilitator.test',
        chainId: 338,
      };

      const result = createPaymentInfo({ payload, settlement, config });

      expect(result.payer).toBe(TEST_PLAYER_ADDRESS);
      expect(result.recipient).toBe(TEST_ARCADE_ADDRESS);
      expect(result.amount).toBe(10000n);
      expect(result.amountUsdc).toBe('0.01');
      expect(result.tokenAddress).toBe(TEST_TOKEN_ADDRESS);
      expect(result.chainId).toBe(338);
      expect(result.transactionHash).toBe(TEST_TX_HASH);
      expect(result.blockNumber).toBe(12345678);
      expect(result.nonce).toBe(TEST_NONCE);
    });
  });

  describe('createPendingPaymentInfo', () => {
    it('should create pending PaymentInfo without settlement data', () => {
      const payload: PaymentPayload = {
        version: '1',
        scheme: 'exact',
        network: 'cronos-testnet',
        from: TEST_PLAYER_ADDRESS,
        to: TEST_ARCADE_ADDRESS,
        value: '10000',
        validAfter: '0',
        validBefore: '1735689600',
        nonce: TEST_NONCE,
        v: 27,
        r: TEST_R,
        s: TEST_S,
      };

      const config: X402Config = {
        payTo: TEST_ARCADE_ADDRESS,
        paymentAmount: '10000',
        tokenAddress: TEST_TOKEN_ADDRESS,
        tokenName: 'Bridged USDC',
        tokenDecimals: 6,
        facilitatorUrl: 'https://facilitator.test',
        chainId: 338,
      };

      const result = createPendingPaymentInfo(payload, config);

      expect(result.payer).toBe(TEST_PLAYER_ADDRESS);
      expect(result.recipient).toBe(TEST_ARCADE_ADDRESS);
      expect(result.amount).toBe(10000n);
      expect(result.amountUsdc).toBe('0.01');
      expect(result.receivedAt).toBeDefined();
      // Should NOT have settlement-specific fields
      expect('transactionHash' in result).toBe(false);
      expect('blockNumber' in result).toBe(false);
      expect('settledAt' in result).toBe(false);
    });
  });

  describe('createDefaultX402Config', () => {
    it('should create config with defaults', () => {
      const config = createDefaultX402Config(TEST_ARCADE_ADDRESS, '10000');

      expect(config.payTo).toBe(TEST_ARCADE_ADDRESS);
      expect(config.paymentAmount).toBe('10000');
      expect(config.tokenAddress).toBeDefined();
      expect(config.tokenName).toBe('Bridged USDC (Stargate)');
      expect(config.tokenDecimals).toBe(6);
      expect(config.tokenVersion).toBe('1');
      expect(config.chainId).toBe(338);
      expect(config.maxAuthorizationAge).toBe(3600);
      expect(config.minValidityWindow).toBe(60);
    });

    it('should accept bigint payment amount', () => {
      const config = createDefaultX402Config(TEST_ARCADE_ADDRESS, 10000n);
      expect(config.paymentAmount).toBe(10000n);
    });
  });

  describe('validateX402Config', () => {
    const validConfig: X402Config = {
      payTo: TEST_ARCADE_ADDRESS,
      paymentAmount: '10000',
      tokenAddress: TEST_TOKEN_ADDRESS,
      tokenName: 'Bridged USDC',
      tokenDecimals: 6,
      facilitatorUrl: 'https://facilitator.cronoslabs.org',
      chainId: 338,
    };

    it('should validate correct config', () => {
      expect(validateX402Config(validConfig)).toBe(true);
    });

    it('should throw for invalid payTo', () => {
      expect(() =>
        validateX402Config({ ...validConfig, payTo: 'invalid' }),
      ).toThrow('Invalid payTo address');
    });

    it('should throw for invalid tokenAddress', () => {
      expect(() =>
        validateX402Config({ ...validConfig, tokenAddress: 'invalid' }),
      ).toThrow('Invalid tokenAddress');
    });

    it('should throw for missing paymentAmount', () => {
      expect(() =>
        validateX402Config({ ...validConfig, paymentAmount: '' }),
      ).toThrow('paymentAmount is required');
    });

    it('should throw for non-positive paymentAmount', () => {
      expect(() =>
        validateX402Config({ ...validConfig, paymentAmount: '0' }),
      ).toThrow('paymentAmount must be positive');
    });

    it('should throw for missing tokenName', () => {
      expect(() => validateX402Config({ ...validConfig, tokenName: '' })).toThrow(
        'tokenName is required',
      );
    });

    it('should throw for negative tokenDecimals', () => {
      expect(() =>
        validateX402Config({ ...validConfig, tokenDecimals: -1 }),
      ).toThrow('tokenDecimals must be a non-negative number');
    });

    it('should throw for missing facilitatorUrl', () => {
      expect(() =>
        validateX402Config({ ...validConfig, facilitatorUrl: '' }),
      ).toThrow('facilitatorUrl is required');
    });

    it('should throw for invalid facilitatorUrl', () => {
      expect(() =>
        validateX402Config({ ...validConfig, facilitatorUrl: 'not-a-url' }),
      ).toThrow('Invalid facilitatorUrl');
    });

    it('should throw for invalid chainId', () => {
      expect(() => validateX402Config({ ...validConfig, chainId: 0 })).toThrow(
        'chainId must be a positive number',
      );
    });
  });

  describe('createPaymentRequiredResponse', () => {
    it('should create 402 response from config', () => {
      const config: X402Config = {
        payTo: TEST_ARCADE_ADDRESS,
        paymentAmount: 10000n,
        tokenAddress: TEST_TOKEN_ADDRESS,
        tokenName: 'Bridged USDC (Stargate)',
        tokenDecimals: 6,
        facilitatorUrl: 'https://facilitator.cronoslabs.org',
        chainId: 338,
      };

      const response = createPaymentRequiredResponse(
        config,
        '/api/play/snake',
        'Pay $0.01 to play Snake',
      );

      expect(response.x402Version).toBe('1');
      expect(response.amount).toBe('10000');
      expect(response.currency).toBe('USDC');
      expect(response.payTo).toBe(TEST_ARCADE_ADDRESS);
      expect(response.chainId).toBe(338);
      expect(response.tokenAddress).toBe(TEST_TOKEN_ADDRESS);
      expect(response.description).toBe('Pay $0.01 to play Snake');
      expect(response.resource).toBe('/api/play/snake');
      expect(response.maxTimeoutSeconds).toBe(3600);
      expect(response.accepts).toHaveLength(1);
      expect(response.accepts[0].scheme).toBe('exact');
      expect(response.accepts[0].network).toBe('cronos-testnet');
      expect(response.accepts[0].asset.address).toBe(TEST_TOKEN_ADDRESS);
    });

    it('should handle string paymentAmount', () => {
      const config: X402Config = {
        payTo: TEST_ARCADE_ADDRESS,
        paymentAmount: '20000',
        tokenAddress: TEST_TOKEN_ADDRESS,
        tokenName: 'Bridged USDC',
        tokenDecimals: 6,
        facilitatorUrl: 'https://facilitator.test',
        chainId: 338,
      };

      const response = createPaymentRequiredResponse(config, '/api/play/tetris');
      expect(response.amount).toBe('20000');
    });
  });
});

// ============================================================
// Interface Shape Compliance Tests
// ============================================================

describe('Interface Shape Compliance', () => {
  describe('X402Config interface', () => {
    it('should enforce required properties', () => {
      const config: X402Config = {
        payTo: TEST_ARCADE_ADDRESS,
        paymentAmount: 10000n,
        tokenAddress: TEST_TOKEN_ADDRESS,
        tokenName: 'USDC',
        tokenDecimals: 6,
        facilitatorUrl: 'https://facilitator.test',
        chainId: 338,
      };

      expect(config.payTo).toBeDefined();
      expect(config.paymentAmount).toBeDefined();
      expect(config.tokenAddress).toBeDefined();
      expect(config.tokenName).toBeDefined();
      expect(config.tokenDecimals).toBeDefined();
      expect(config.facilitatorUrl).toBeDefined();
      expect(config.chainId).toBeDefined();
    });

    it('should allow optional properties', () => {
      const config: X402Config = {
        payTo: TEST_ARCADE_ADDRESS,
        paymentAmount: 10000n,
        tokenAddress: TEST_TOKEN_ADDRESS,
        tokenName: 'USDC',
        tokenDecimals: 6,
        facilitatorUrl: 'https://facilitator.test',
        chainId: 338,
        tokenVersion: '2',
        maxAuthorizationAge: 7200,
        minValidityWindow: 120,
        debug: true,
      };

      expect(config.tokenVersion).toBe('2');
      expect(config.maxAuthorizationAge).toBe(7200);
      expect(config.minValidityWindow).toBe(120);
      expect(config.debug).toBe(true);
    });
  });

  describe('PaymentPayload interface', () => {
    it('should have correct structure', () => {
      const payload: PaymentPayload = {
        version: '1',
        scheme: 'exact',
        network: 'cronos-testnet',
        from: TEST_PLAYER_ADDRESS,
        to: TEST_ARCADE_ADDRESS,
        value: '10000',
        validAfter: '0',
        validBefore: '1735689600',
        nonce: TEST_NONCE,
        v: 27,
        r: TEST_R,
        s: TEST_S,
      };

      expect(payload.version).toBe('1');
      expect(payload.scheme).toBe('exact');
      expect(typeof payload.v).toBe('number');
      expect(typeof payload.r).toBe('string');
      expect(typeof payload.s).toBe('string');
    });
  });

  describe('X402HandlerOptions interface', () => {
    it('should allow all optional properties', () => {
      const options: X402HandlerOptions = {
        paymentAmount: 20000n,
        description: 'Premium game',
        resource: '/api/premium',
        validatePayment: (_payment) => true,
        onSettlement: (_settlement, _req) => {},
        skipSettlement: true,
      };

      expect(options.paymentAmount).toBe(20000n);
      expect(options.description).toBe('Premium game');
      expect(options.skipSettlement).toBe(true);
    });
  });
});
