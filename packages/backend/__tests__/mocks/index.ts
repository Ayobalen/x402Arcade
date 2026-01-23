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

// Blockchain Mocks (Cronos/viem compatible)
export {
  MockWeb3Provider,
  CRONOS_TESTNET,
  CRONOS_MAINNET,
  DEV_USDC_CONFIG,
  DEFAULT_GAS_VALUES,
  randomHex,
  generateTxHash,
  generateBlockHash,
  resetBlockchainCounters,
  toChecksumAddress,
  mockTransactionReceipt,
  mockBlock,
  mockTransactionLog,
  mockFailedTransactionReceipt,
  mockUSDCTransferLog,
  mockGasPrice,
  mockBlockNumber,
  createTestProvider,
  createMockPublicClient,
  createMockWalletClient,
  createMockUSDCContract,
  type ChainConfig,
  type TransactionReceipt,
  type TransactionLog,
  type Block,
  type MockProviderConfig,
} from './blockchain-mock';
