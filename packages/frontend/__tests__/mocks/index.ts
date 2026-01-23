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

// Web3 Provider mocks
export {
  // Main class
  MockEthereumProvider,
  // Error utilities
  RPC_ERROR_CODES,
  createRpcError,
  userRejectedRpcError,
  chainNotAddedError,
  unsupportedMethodError,
  // Chain utilities
  CHAIN_CONFIGS,
  chainIdToHex,
  hexToChainId,
  // Factory functions
  createConnectedProvider,
  createDisconnectedProvider,
  createRejectingProvider,
  // Window utilities
  installMockProvider,
  mockWindowEthereum,
  // Assertions
  assertMethodCalled,
  assertAccountsRequested,
  assertChainSwitched,
  assertSignatureRequested,
  // Types
  type RequestArguments,
  type EIP1193Provider,
  type ChainConfig,
  type RpcError,
  type ProviderEventType,
  type EventListener,
  type MockProviderConfig,
  type MockProviderState,
  type RequestHandler,
  type ProviderCallRecord,
} from './web3-provider-mock';

// Three.js and React Three Fiber mocks
export {
  // Types
  type MockWebGLRendererConfig,
  type RenderCallRecord,
  type MockVector3,
  type MockEuler,
  type MockColor,
  // Math classes
  MockVector3Impl,
  MockEulerImpl,
  MockColorImpl,
  MockMatrix4,
  // Scene graph
  MockObject3D,
  MockScene,
  MockGroup,
  MockMesh,
  // Cameras
  MockCamera,
  MockPerspectiveCamera,
  MockOrthographicCamera,
  // Lights
  MockLight,
  MockAmbientLight,
  MockDirectionalLight,
  MockPointLight,
  MockSpotLight,
  // Geometries
  MockBufferGeometry,
  MockBoxGeometry,
  MockSphereGeometry,
  MockPlaneGeometry,
  MockCylinderGeometry,
  // Materials
  MockMaterial,
  MockMeshBasicMaterial,
  MockMeshStandardMaterial,
  MockMeshPhongMaterial,
  MockShaderMaterial,
  // Renderer
  MockWebGLRenderer,
  // Loaders
  MockTextureLoader,
  MockTexture,
  // Mock namespace
  mockTHREE,
  // React Three Fiber mocks
  MockCanvas,
  mockUseThree,
  mockUseFrame,
  mockUseLoader,
  // Factory functions
  createThreeMock,
  createReactThreeFiberMock,
  // Test utilities
  createTestScene,
  createTestMesh,
  assertSceneObjectCount,
  assertMeshGeometry,
  assertRenderCallCount,
} from './three-mock';

// MSW-like API mocking server
export {
  // Core
  MockServer,
  setupServer,
  rest,
  // Types
  type HttpMethod,
  type MockRequestInfo,
  type MockResponseContext,
  type MockResponse,
  type RequestHandlerFn,
  type RequestHandler as ApiRequestHandler,
  type ServerOptions,
  type FetchCallRecord,
  // URL helpers
  apiUrl,
  API_BASE_URL,
  // Response factories
  jsonSuccess,
  jsonError,
  delayedResponse,
  networkError,
  // Arcade API
  createArcadeApiHandlers,
  createArcadeApiServer,
  defaultGameSession,
  defaultLeaderboard,
  defaultPrizePool,
  // Test setup helpers
  setupTestServer,
} from './msw-server';
