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
