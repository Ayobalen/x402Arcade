/**
 * React Testing Library Helper Utilities
 *
 * Custom render function with providers and common RTL exports.
 * This file provides a properly configured testing environment
 * for all React components in the x402Arcade frontend.
 */

import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter, MemoryRouterProps } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Create a fresh QueryClient for each test to avoid state pollution
 */
function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Turn off retries for tests
        retry: false,
        // Don't refetch on window focus in tests
        refetchOnWindowFocus: false,
        // Disable cache time for cleaner tests
        gcTime: 0,
        // Disable stale time
        staleTime: 0,
      },
      mutations: {
        // Turn off retries for mutations too
        retry: false,
      },
    },
  });
}

/**
 * Options for custom render function
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /**
   * Initial route for MemoryRouter (default: '/')
   */
  route?: string;
  /**
   * Initial entries for MemoryRouter history
   */
  initialEntries?: MemoryRouterProps['initialEntries'];
  /**
   * Use BrowserRouter instead of MemoryRouter
   */
  useBrowserRouter?: boolean;
  /**
   * Custom QueryClient (a default test client is used if not provided)
   */
  queryClient?: QueryClient;
  /**
   * Additional wrapper component
   */
  wrapper?: React.ComponentType<{ children: ReactNode }>;
}

/**
 * Result of custom render function
 */
interface CustomRenderResult extends RenderResult {
  /**
   * User event instance for simulating user interactions
   */
  user: ReturnType<typeof userEvent.setup>;
  /**
   * QueryClient instance used for the render
   */
  queryClient: QueryClient;
}

/**
 * All Providers wrapper component
 */
function AllProviders({
  children,
  queryClient,
  routerProps,
  useBrowserRouter,
}: {
  children: ReactNode;
  queryClient: QueryClient;
  routerProps?: MemoryRouterProps;
  useBrowserRouter?: boolean;
}) {
  const Router = useBrowserRouter ? BrowserRouter : MemoryRouter;
  const routerElement = useBrowserRouter ? (
    <BrowserRouter>{children}</BrowserRouter>
  ) : (
    <MemoryRouter {...routerProps}>{children}</MemoryRouter>
  );

  return <QueryClientProvider client={queryClient}>{routerElement}</QueryClientProvider>;
}

/**
 * Custom render function that wraps components with necessary providers.
 *
 * Includes:
 * - React Router (MemoryRouter by default, BrowserRouter optional)
 * - React Query provider with test-friendly defaults
 * - User event setup for realistic user interaction simulation
 *
 * @example
 * ```tsx
 * import { renderWithProviders, screen, userEvent } from '../utils/rtl-helpers';
 *
 * test('button click increments counter', async () => {
 *   const { user } = renderWithProviders(<Counter />);
 *   const button = screen.getByRole('button', { name: /increment/i });
 *
 *   await user.click(button);
 *
 *   expect(screen.getByText('Count: 1')).toBeInTheDocument();
 * });
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): CustomRenderResult {
  const {
    route = '/',
    initialEntries = [route],
    useBrowserRouter = false,
    queryClient = createTestQueryClient(),
    wrapper: AdditionalWrapper,
    ...renderOptions
  } = options;

  // Set up user event with delay: null for faster tests
  const user = userEvent.setup({ delay: null });

  const routerProps: MemoryRouterProps = { initialEntries };

  const Wrapper = ({ children }: { children: ReactNode }) => {
    const wrappedChildren = (
      <AllProviders
        queryClient={queryClient}
        routerProps={routerProps}
        useBrowserRouter={useBrowserRouter}
      >
        {children}
      </AllProviders>
    );

    if (AdditionalWrapper) {
      return <AdditionalWrapper>{wrappedChildren}</AdditionalWrapper>;
    }

    return wrappedChildren;
  };

  const result = render(ui, { wrapper: Wrapper, ...renderOptions });

  return {
    ...result,
    user,
    queryClient,
  };
}

/**
 * Simple render without providers - for testing isolated components
 * that don't need routing or query client
 */
export function renderSimple(ui: ReactElement, options?: RenderOptions): RenderResult {
  return render(ui, options);
}

/**
 * Render with router only (no React Query)
 */
export function renderWithRouter(
  ui: ReactElement,
  options: {
    route?: string;
    initialEntries?: MemoryRouterProps['initialEntries'];
  } = {}
): RenderResult & { user: ReturnType<typeof userEvent.setup> } {
  const { route = '/', initialEntries = [route] } = options;
  const user = userEvent.setup({ delay: null });

  const result = render(ui, {
    wrapper: ({ children }) => <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>,
  });

  return { ...result, user };
}

/**
 * Render with React Query only (no router)
 */
export function renderWithQueryClient(
  ui: ReactElement,
  queryClient = createTestQueryClient()
): RenderResult & { queryClient: QueryClient; user: ReturnType<typeof userEvent.setup> } {
  const user = userEvent.setup({ delay: null });

  const result = render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });

  return { ...result, queryClient, user };
}

// Re-export common RTL utilities for convenience
export {
  screen,
  within,
  waitFor,
  userEvent,
  render,
  createTestQueryClient,
};

// Re-export all from @testing-library/react for complete access
export * from '@testing-library/react';

/**
 * Helper to wait for loading states to complete
 */
export async function waitForLoadingToComplete(): Promise<void> {
  await waitFor(() => {
    const loadingElements = screen.queryAllByText(/loading/i);
    expect(loadingElements).toHaveLength(0);
  });
}

/**
 * Helper to find element by test ID with better error messages
 */
export function getByTestIdWithFallback(testId: string, fallbackText?: string): HTMLElement {
  const element = screen.queryByTestId(testId);
  if (element) return element;

  if (fallbackText) {
    const fallback = screen.queryByText(fallbackText);
    if (fallback) return fallback;
  }

  throw new Error(`Unable to find element with test ID "${testId}"${fallbackText ? ` or text "${fallbackText}"` : ''}`);
}

/**
 * Mock wallet state for testing wallet-connected components
 */
export interface MockWalletState {
  address: string;
  chainId: number;
  isConnected: boolean;
  balance?: string;
}

export const defaultMockWalletState: MockWalletState = {
  address: '0x1234567890abcdef1234567890abcdef12345678',
  chainId: 338, // Cronos Testnet
  isConnected: true,
  balance: '100.00',
};

/**
 * Create a mock wallet context value
 */
export function createMockWalletContext(overrides: Partial<MockWalletState> = {}): MockWalletState {
  return {
    ...defaultMockWalletState,
    ...overrides,
  };
}
