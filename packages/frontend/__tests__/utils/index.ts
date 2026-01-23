/**
 * Frontend Test Utilities - Central Export
 *
 * Import all test helpers from this file:
 * import { waitForElement, mockFetch, createTestStore } from '../utils';
 * import { renderWithProviders, screen, userEvent } from '../utils';
 * import { renderWithWallet, renderWithAll, customRender } from '../utils';
 */

// Original test helpers
export {
  waitForElement,
  waitForElementToBeRemoved,
  mockFetch,
  createTestStore,
  waitForStateUpdate,
  createDeferred,
  userEvents,
} from './test-helpers';

// React Testing Library helpers
export {
  renderWithProviders,
  renderSimple,
  renderWithRouter,
  renderWithQueryClient,
  screen,
  within,
  waitFor,
  userEvent,
  render,
  createTestQueryClient,
  waitForLoadingToComplete,
  getByTestIdWithFallback,
  createMockWalletContext,
  defaultMockWalletState,
  type MockWalletState,
} from './rtl-helpers';

// Component test utilities (with wallet/store/router context)
export {
  // Render functions
  renderWithWallet,
  renderWithStore,
  renderWithAll,
  customRender,
  // Wallet context
  MockWalletProvider,
  useMockWallet,
  defaultWalletState,
  disconnectedWalletState,
  connectingWalletState,
  defaultWalletActions,
  failingWalletActions,
  // Wallet factories
  createConnectedWallet,
  createDisconnectedWallet,
  createInsufficientBalanceWallet,
  createWrongNetworkWallet,
  generateTestAddress,
  // Assertions
  expectLoadingState,
  expectErrorState,
  expectWalletConnected,
  // Types
  type MockWalletContextValue,
  type MockWalletActions,
  type RenderWithWalletOptions,
  type RenderWithStoreOptions,
  type RenderWithAllOptions,
  type ExtendedRenderResult,
} from './component-utils';

// Hook test utilities
export {
  // Render hook functions
  renderHookWithProviders,
  renderHookWithAllProviders,
  // Async utilities
  waitForHook,
  waitForHookState,
  // Timer utilities
  actWithTimers,
  actAndRunAllTimers,
  actAndRunOnlyPendingTimers,
  // Mock dependency utilities
  createMockDependencies,
  createMockApiHook,
  // Re-exports
  act,
  renderHook,
  vi,
  // Types
  type RenderHookWithProvidersOptions,
  type ExtendedRenderHookResult,
  type MockDependencies,
} from './hook-utils';

// Zustand store test utilities
export {
  // Core store creation
  createTestStore as createZustandTestStore,
  withInitialState,
  // Selector testing
  mockSelector,
  createTrackedSelector,
  // Snapshots
  storeSnapshot,
  compareSnapshots,
  // History tracking
  createHistoryTrackedStore,
  // Cleanup
  resetAllStores,
  clearStoreRegistry,
  getRegisteredStoreCount,
  getRegisteredStoreNames,
  // Action utilities
  createActionSpy,
  waitForStoreState,
  // Example stores (for testing documentation)
  createExampleWalletStore,
  createExampleGameStore,
  // Types
  type CreateTestStoreOptions,
  type SnapshotOptions,
  type TestStore,
  type MockedSelector,
  type ExampleWalletState,
  type ExampleGameState,
} from './store-utils';

// Animation test utilities
export {
  // Types
  type AnimationState,
  type AnimationMockConfig,
  type TransitionEventData,
  type AnimationEventData,
  type AnimationRecord,
  type MockedFramerMotion,
  type RAFController,
  // Framer Motion mocking
  mockFramerMotion,
  createFramerMotionMock,
  // CSS animation event firing
  fireTransitionEnd,
  fireTransitionStart,
  fireTransitionCancel,
  fireAnimationEnd,
  fireAnimationStart,
  fireAnimationIteration,
  fireAnimationCancel,
  // Animation waiting
  waitForAnimation,
  waitForTransition,
  waitForAllAnimations,
  // Animation assertions
  assertAnimationState,
  assertHasTransition,
  assertFramerProps,
  // Animation control
  disableAnimations,
  enableAnimations,
  setTransitionMultiplier,
  getTransitionMultiplier,
  areAnimationsEnabled,
  // Animation tracking
  clearAnimationRecords,
  getAnimationRecords,
  getAnimationRecordsByType,
  trackAnimation,
  // RAF controller
  createRAFController,
  // Computed style mocking
  mockComputedStyleAnimations,
  // Setup helpers
  setupAnimationTesting,
} from './animation-utils';
