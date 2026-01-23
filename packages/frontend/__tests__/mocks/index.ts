/**
 * Frontend Test Mocks - Central Export
 *
 * Import all mock utilities from this file:
 * import { MockWallet, mockConnectedWallet, CHAIN_IDS } from '../mocks';
 */

// Wallet mocks
export {
  // Main class
  MockWallet,
  // Constants
  CHAIN_IDS,
  DEFAULT_TEST_ADDRESS,
  ARCADE_WALLET_ADDRESS,
  USDC_CONTRACT_ADDRESS,
  DEFAULT_BALANCE,
  DEFAULT_USDC_BALANCE,
  // Error factories
  createWalletError,
  userRejectedError,
  chainNotSupportedError,
  insufficientFundsError,
  // Factory functions
  mockConnectedWallet,
  mockDisconnectedWallet,
  mockWalletError,
  mockSignMessage,
  mockSignTypedData,
  // Assertions
  assertConnectionAttempted,
  assertMessageSigned,
  assertTypedDataSigned,
  assertTransactionSent,
  // Types
  type ChainId,
  type WalletConnectionStatus,
  type WalletAccount,
  type TransactionRequest,
  type TransactionReceipt,
  type TypedData,
  type TransferAuthorization,
  type WalletErrorCode,
  type WalletError,
  type MockWalletConfig,
  type MockWalletState,
  type WalletCallRecord,
} from './wallet-mock';

// Canvas and WebGL mocks
export {
  // Canvas creation
  createMockCanvas,
  createMock2DContext,
  createMockWebGLContext,
  createMockWebGL2Context,
  // Animation frame controller
  AnimationFrameController,
  // Performance mock
  PerformanceMock,
  // Factory functions
  createTestCanvas2D,
  createTestCanvasWebGL,
  createTestCanvasWebGL2,
  createAnimationFrameSetup,
  createPerformanceSetup,
  // Assertion helpers
  assertCanvasCallsInclude,
  assertWebGLCallsInclude,
  assertDrawCallCount,
  getCanvasCallCount,
  // Types
  type MockCanvasConfig,
  type CanvasCallRecord,
  type Mock2DContextConfig,
  type MockWebGLConfig,
  type WebGLExtensionName,
  type MockPerformanceConfig,
  type MockAnimationFrameConfig,
} from './canvas-mock';
