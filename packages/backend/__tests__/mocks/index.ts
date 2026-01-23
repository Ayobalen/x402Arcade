/**
 * Backend Test Mocks - Central Export
 *
 * Import all mock implementations from this file:
 * import { MockX402Server, createMockPaymentHeader } from '../mocks';
 */

// x402 Payment Protocol Mocks
export {
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
  type MockX402ServerConfig,
} from './x402-mock';
