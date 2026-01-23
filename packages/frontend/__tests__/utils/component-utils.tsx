/**
 * Component Test Utilities
 *
 * Reusable utilities for testing React components with common patterns.
 * These utilities provide properly configured render functions with various
 * provider combinations for different testing scenarios.
 */

import { ReactElement, ReactNode, createContext, useContext } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ============================================================================
// Types
// ============================================================================

/**
 * Mock wallet state for testing wallet-connected components
 */
export interface MockWalletState {
  address: `0x${string}`;
  chainId: number;
  isConnected: boolean;
  balance: string;
  usdcBalance: string;
  isConnecting: boolean;
  error: string | null;
}

/**
 * Wallet context actions for testing
 */
export interface MockWalletActions {
  connect: () => Promise<void>;
  disconnect: () => void;
  signMessage: (message: string) => Promise<string>;
  signTypedData: (data: unknown) => Promise<string>;
  sendTransaction: (tx: unknown) => Promise<string>;
}

/**
 * Complete wallet context value
 */
export interface MockWalletContextValue extends MockWalletState, MockWalletActions {}

/**
 * Options for renderWithWallet
 */
export interface RenderWithWalletOptions extends Omit<RenderOptions, 'wrapper'> {
  walletState?: Partial<MockWalletState>;
  walletActions?: Partial<MockWalletActions>;
}

/**
 * Options for renderWithStore (React Query context)
 */
export interface RenderWithStoreOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  initialData?: Record<string, unknown>;
}

/**
 * Options for renderWithAll (all contexts combined)
 */
export interface RenderWithAllOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  initialEntries?: MemoryRouterProps['initialEntries'];
  queryClient?: QueryClient;
  walletState?: Partial<MockWalletState>;
  walletActions?: Partial<MockWalletActions>;
}

/**
 * Extended render result with user event and context accessors
 */
export interface ExtendedRenderResult extends RenderResult {
  user: ReturnType<typeof userEvent.setup>;
}

// ============================================================================
// Default Values
// ============================================================================

/**
 * Default mock wallet state (connected wallet on Cronos Testnet)
 */
export const defaultWalletState: MockWalletState = {
  address: '0x1234567890abcdef1234567890abcdef12345678',
  chainId: 338, // Cronos Testnet
  isConnected: true,
  balance: '10.0', // TCRO
  usdcBalance: '100.00', // devUSDC.e
  isConnecting: false,
  error: null,
};

/**
 * Disconnected wallet state
 */
export const disconnectedWalletState: MockWalletState = {
  address: '0x0000000000000000000000000000000000000000',
  chainId: 338,
  isConnected: false,
  balance: '0',
  usdcBalance: '0',
  isConnecting: false,
  error: null,
};

/**
 * Connecting wallet state
 */
export const connectingWalletState: MockWalletState = {
  ...disconnectedWalletState,
  isConnecting: true,
};

/**
 * Default mock wallet actions (all successful)
 */
export const defaultWalletActions: MockWalletActions = {
  connect: async () => {},
  disconnect: () => {},
  signMessage: async () => '0xmocksignature123',
  signTypedData: async () => '0xmocktypedsignature456',
  sendTransaction: async () => '0xmocktxhash789',
};

/**
 * Mock wallet actions that fail
 */
export const failingWalletActions: MockWalletActions = {
  connect: async () => {
    throw new Error('Connection rejected by user');
  },
  disconnect: () => {},
  signMessage: async () => {
    throw new Error('Signature rejected by user');
  },
  signTypedData: async () => {
    throw new Error('Signature rejected by user');
  },
  sendTransaction: async () => {
    throw new Error('Transaction rejected by user');
  },
};

// ============================================================================
// Wallet Context (Mock)
// ============================================================================

const MockWalletContext = createContext<MockWalletContextValue | null>(null);

/**
 * Hook to access mock wallet context in tests
 */
export function useMockWallet(): MockWalletContextValue {
  const context = useContext(MockWalletContext);
  if (!context) {
    throw new Error('useMockWallet must be used within MockWalletProvider');
  }
  return context;
}

/**
 * Mock Wallet Provider for testing
 */
export function MockWalletProvider({
  children,
  state = defaultWalletState,
  actions = defaultWalletActions,
}: {
  children: ReactNode;
  state?: MockWalletState;
  actions?: MockWalletActions;
}) {
  const value: MockWalletContextValue = {
    ...state,
    ...actions,
  };

  return (
    <MockWalletContext.Provider value={value}>
      {children}
    </MockWalletContext.Provider>
  );
}

// ============================================================================
// Query Client Factory
// ============================================================================

/**
 * Create a fresh QueryClient for each test to avoid state pollution
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// ============================================================================
// Render Utilities
// ============================================================================

/**
 * Render with wallet context only.
 * Use this for testing components that depend on wallet connection state.
 *
 * @example
 * ```tsx
 * test('shows connect button when disconnected', () => {
 *   renderWithWallet(<WalletButton />, {
 *     walletState: { isConnected: false }
 *   });
 *   expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument();
 * });
 * ```
 */
export function renderWithWallet(
  ui: ReactElement,
  options: RenderWithWalletOptions = {}
): ExtendedRenderResult & { walletState: MockWalletState } {
  const { walletState = {}, walletActions = {}, ...renderOptions } = options;

  const state: MockWalletState = { ...defaultWalletState, ...walletState };
  const actions: MockWalletActions = { ...defaultWalletActions, ...walletActions };

  const user = userEvent.setup({ delay: null });

  const result = render(ui, {
    wrapper: ({ children }) => (
      <MockWalletProvider state={state} actions={actions}>
        {children}
      </MockWalletProvider>
    ),
    ...renderOptions,
  });

  return { ...result, user, walletState: state };
}

/**
 * Render with React Query store context only.
 * Use this for testing components that make API queries.
 *
 * @example
 * ```tsx
 * test('fetches leaderboard data', async () => {
 *   const { queryClient } = renderWithStore(<Leaderboard />);
 *   await waitFor(() => {
 *     expect(screen.getByRole('list')).toBeInTheDocument();
 *   });
 * });
 * ```
 */
export function renderWithStore(
  ui: ReactElement,
  options: RenderWithStoreOptions = {}
): ExtendedRenderResult & { queryClient: QueryClient } {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options;

  const user = userEvent.setup({ delay: null });

  const result = render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
    ...renderOptions,
  });

  return { ...result, user, queryClient };
}

/**
 * Render with router context only.
 * Use this for testing components that use routing (useNavigate, useParams, etc).
 *
 * @example
 * ```tsx
 * test('navigates to game page', async () => {
 *   const { user } = renderWithRouter(<GameList />, { route: '/games' });
 *   await user.click(screen.getByRole('link', { name: /snake/i }));
 *   // Verify navigation occurred
 * });
 * ```
 */
export function renderWithRouter(
  ui: ReactElement,
  options: {
    route?: string;
    initialEntries?: MemoryRouterProps['initialEntries'];
  } = {}
): ExtendedRenderResult {
  const { route = '/', initialEntries = [route] } = options;
  const user = userEvent.setup({ delay: null });

  const result = render(ui, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    ),
  });

  return { ...result, user };
}

/**
 * Render with all contexts combined.
 * Use this for integration-level component tests.
 *
 * @example
 * ```tsx
 * test('complete payment flow', async () => {
 *   const { user, queryClient, walletState } = renderWithAll(<PayToPlay />, {
 *     route: '/play/snake',
 *     walletState: { usdcBalance: '50.00' }
 *   });
 *
 *   await user.click(screen.getByRole('button', { name: /pay/i }));
 *   // Test payment flow
 * });
 * ```
 */
export function renderWithAll(
  ui: ReactElement,
  options: RenderWithAllOptions = {}
): ExtendedRenderResult & { queryClient: QueryClient; walletState: MockWalletState } {
  const {
    route = '/',
    initialEntries = [route],
    queryClient = createTestQueryClient(),
    walletState = {},
    walletActions = {},
    ...renderOptions
  } = options;

  const state: MockWalletState = { ...defaultWalletState, ...walletState };
  const actions: MockWalletActions = { ...defaultWalletActions, ...walletActions };

  const user = userEvent.setup({ delay: null });

  const result = render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <MockWalletProvider state={state} actions={actions}>
          <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
        </MockWalletProvider>
      </QueryClientProvider>
    ),
    ...renderOptions,
  });

  return { ...result, user, queryClient, walletState: state };
}

/**
 * Alias for renderWithAll - the main custom render function
 */
export const customRender = renderWithAll;

// ============================================================================
// Test Wallet Factories
// ============================================================================

/**
 * Create a connected wallet state with custom values
 */
export function createConnectedWallet(
  overrides: Partial<MockWalletState> = {}
): MockWalletState {
  return {
    ...defaultWalletState,
    isConnected: true,
    ...overrides,
  };
}

/**
 * Create a disconnected wallet state
 */
export function createDisconnectedWallet(): MockWalletState {
  return { ...disconnectedWalletState };
}

/**
 * Create a wallet with insufficient balance
 */
export function createInsufficientBalanceWallet(
  usdcRequired: number
): MockWalletState {
  const insufficientBalance = Math.max(0, usdcRequired - 0.01).toFixed(2);
  return {
    ...defaultWalletState,
    usdcBalance: insufficientBalance,
  };
}

/**
 * Create a wallet on wrong network
 */
export function createWrongNetworkWallet(chainId: number = 1): MockWalletState {
  return {
    ...defaultWalletState,
    chainId,
  };
}

/**
 * Generate unique test wallet addresses
 */
export function generateTestAddress(suffix: string = '1'): `0x${string}` {
  const paddedSuffix = suffix.padStart(40, '0').slice(0, 40);
  return `0x${paddedSuffix}` as `0x${string}`;
}

// ============================================================================
// Common Test Assertions
// ============================================================================

/**
 * Assert that a loading state is shown
 */
export function expectLoadingState(): void {
  const loading = document.querySelector('[data-testid="loading"]') ||
    document.querySelector('.animate-spin') ||
    document.body.textContent?.includes('Loading');
  expect(loading).toBeTruthy();
}

/**
 * Assert that an error state is shown
 */
export function expectErrorState(errorText?: string): void {
  if (errorText) {
    expect(document.body.textContent).toContain(errorText);
  } else {
    const errorElement = document.querySelector('[data-testid="error"]') ||
      document.querySelector('[role="alert"]');
    expect(errorElement).toBeTruthy();
  }
}

/**
 * Assert wallet is connected
 */
export function expectWalletConnected(): void {
  // Look for wallet address display or connected indicator
  const connected = document.querySelector('[data-testid="wallet-connected"]') ||
    document.querySelector('[data-testid="wallet-address"]');
  expect(connected).toBeTruthy();
}
