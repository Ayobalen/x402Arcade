/**
 * Hook Test Utilities
 *
 * Utilities for testing custom React hooks in isolation.
 * Uses the renderHook API from @testing-library/react (React 18+).
 *
 * Note: @testing-library/react-hooks is deprecated in React 18.
 * The renderHook function is now part of @testing-library/react.
 */

import { ReactNode } from 'react';
import { renderHook, act, waitFor, RenderHookOptions, RenderHookResult } from '@testing-library/react';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockWalletProvider, defaultWalletState, defaultWalletActions } from './component-utils';
import type { MockWalletState, MockWalletActions } from './component-utils';
import { vi } from 'vitest';

// ============================================================================
// Types
// ============================================================================

/**
 * Options for renderHookWithProviders
 */
export interface RenderHookWithProvidersOptions<TProps> extends Omit<RenderHookOptions<TProps>, 'wrapper'> {
  /**
   * Initial route for MemoryRouter
   */
  route?: string;
  /**
   * Initial entries for MemoryRouter history
   */
  initialEntries?: MemoryRouterProps['initialEntries'];
  /**
   * Custom QueryClient (a default test client is used if not provided)
   */
  queryClient?: QueryClient;
  /**
   * Mock wallet state
   */
  walletState?: Partial<MockWalletState>;
  /**
   * Mock wallet actions
   */
  walletActions?: Partial<MockWalletActions>;
  /**
   * Include router context
   */
  withRouter?: boolean;
  /**
   * Include query client context
   */
  withQueryClient?: boolean;
  /**
   * Include wallet context
   */
  withWallet?: boolean;
}

/**
 * Extended render hook result
 */
export interface ExtendedRenderHookResult<TResult, TProps> extends RenderHookResult<TResult, TProps> {
  /**
   * QueryClient instance if withQueryClient is true
   */
  queryClient?: QueryClient;
  /**
   * Wallet state if withWallet is true
   */
  walletState?: MockWalletState;
}

// ============================================================================
// Query Client Factory
// ============================================================================

/**
 * Create a fresh QueryClient for hook tests
 */
function createTestQueryClient(): QueryClient {
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
// Render Hook Utilities
// ============================================================================

/**
 * Render a hook with all necessary providers.
 *
 * @example
 * ```tsx
 * import { renderHookWithProviders, act } from '../utils/hook-utils';
 * import { useCounter } from '../../src/hooks/useCounter';
 *
 * test('useCounter increments', () => {
 *   const { result } = renderHookWithProviders(() => useCounter(0));
 *
 *   expect(result.current.count).toBe(0);
 *
 *   act(() => {
 *     result.current.increment();
 *   });
 *
 *   expect(result.current.count).toBe(1);
 * });
 * ```
 */
export function renderHookWithProviders<TResult, TProps>(
  hook: (props: TProps) => TResult,
  options: RenderHookWithProvidersOptions<TProps> = {}
): ExtendedRenderHookResult<TResult, TProps> {
  const {
    route = '/',
    initialEntries = [route],
    queryClient: providedQueryClient,
    walletState: walletStateOverrides = {},
    walletActions: walletActionsOverrides = {},
    withRouter = false,
    withQueryClient = false,
    withWallet = false,
    ...hookOptions
  } = options;

  const queryClient = providedQueryClient || createTestQueryClient();
  const walletState: MockWalletState = { ...defaultWalletState, ...walletStateOverrides };
  const walletActions: MockWalletActions = { ...defaultWalletActions, ...walletActionsOverrides };

  const wrapper = ({ children }: { children: ReactNode }) => {
    let wrapped = <>{children}</>;

    // Add wallet context if requested
    if (withWallet) {
      wrapped = (
        <MockWalletProvider state={walletState} actions={walletActions}>
          {wrapped}
        </MockWalletProvider>
      );
    }

    // Add router context if requested
    if (withRouter) {
      wrapped = (
        <MemoryRouter initialEntries={initialEntries}>
          {wrapped}
        </MemoryRouter>
      );
    }

    // Add query client context if requested
    if (withQueryClient) {
      wrapped = (
        <QueryClientProvider client={queryClient}>
          {wrapped}
        </QueryClientProvider>
      );
    }

    return wrapped;
  };

  const result = renderHook(hook, { wrapper, ...hookOptions });

  return {
    ...result,
    queryClient: withQueryClient ? queryClient : undefined,
    walletState: withWallet ? walletState : undefined,
  };
}

/**
 * Render a hook with all contexts (router, query client, wallet)
 */
export function renderHookWithAllProviders<TResult, TProps>(
  hook: (props: TProps) => TResult,
  options: Omit<RenderHookWithProvidersOptions<TProps>, 'withRouter' | 'withQueryClient' | 'withWallet'> = {}
): ExtendedRenderHookResult<TResult, TProps> {
  return renderHookWithProviders(hook, {
    ...options,
    withRouter: true,
    withQueryClient: true,
    withWallet: true,
  });
}

// ============================================================================
// Async Hook Utilities
// ============================================================================

/**
 * Wait for a hook's result to satisfy a predicate.
 * Useful for hooks that have async state updates.
 *
 * @example
 * ```tsx
 * const { result } = renderHookWithProviders(() => useFetchData());
 *
 * await waitForHook(() => result.current.data !== null);
 *
 * expect(result.current.data).toEqual({ id: 1 });
 * ```
 */
export async function waitForHook<T>(
  predicate: () => T | null | undefined | false,
  options: { timeout?: number; interval?: number } = {}
): Promise<T> {
  const { timeout = 3000, interval = 50 } = options;

  return waitFor(
    () => {
      const value = predicate();
      if (!value) {
        throw new Error('Predicate not satisfied');
      }
      return value;
    },
    { timeout, interval }
  );
}

/**
 * Wait for a hook result to reach a specific state
 *
 * @example
 * ```tsx
 * await waitForHookState(result, (state) => state.isLoading === false);
 * ```
 */
export async function waitForHookState<TResult>(
  result: { current: TResult },
  predicate: (state: TResult) => boolean,
  options: { timeout?: number } = {}
): Promise<void> {
  await waitFor(
    () => {
      if (!predicate(result.current)) {
        throw new Error('Hook state predicate not satisfied');
      }
    },
    { timeout: options.timeout ?? 3000 }
  );
}

// ============================================================================
// Timer Hook Utilities
// ============================================================================

/**
 * Perform an action and advance timers.
 * Useful for testing hooks that use setTimeout/setInterval.
 *
 * @example
 * ```tsx
 * vi.useFakeTimers();
 *
 * const { result } = renderHookWithProviders(() => useDebounce('value', 500));
 *
 * await actWithTimers(() => {
 *   // Update the value
 *   result.current.setValue('new value');
 * }, 500);
 *
 * expect(result.current.debouncedValue).toBe('new value');
 *
 * vi.useRealTimers();
 * ```
 */
export async function actWithTimers(
  callback: () => void | Promise<void>,
  advanceMs: number
): Promise<void> {
  await act(async () => {
    await callback();
    vi.advanceTimersByTime(advanceMs);
  });
}

/**
 * Run all pending timers within an act block
 */
export async function actAndRunAllTimers(
  callback: () => void | Promise<void>
): Promise<void> {
  await act(async () => {
    await callback();
    vi.runAllTimers();
  });
}

/**
 * Run only pending timers within an act block
 */
export async function actAndRunOnlyPendingTimers(
  callback: () => void | Promise<void>
): Promise<void> {
  await act(async () => {
    await callback();
    vi.runOnlyPendingTimers();
  });
}

// ============================================================================
// Mock Dependency Utilities
// ============================================================================

/**
 * Interface for mock dependency configuration
 */
export interface MockDependencies {
  [key: string]: unknown;
}

/**
 * Create mock dependencies for hook injection testing.
 *
 * @example
 * ```tsx
 * const mockFetch = vi.fn().mockResolvedValue({ data: [] });
 *
 * const { mocks, resetMocks, setMock } = createMockDependencies({
 *   fetchData: mockFetch,
 *   logger: vi.fn(),
 * });
 *
 * // In your hook
 * const { result } = renderHookWithProviders(() => useData(mocks));
 *
 * // Reset all mocks between tests
 * resetMocks();
 *
 * // Change a mock
 * setMock('fetchData', vi.fn().mockRejectedValue(new Error('Failed')));
 * ```
 */
export function createMockDependencies<T extends MockDependencies>(
  initialMocks: T
): {
  mocks: T;
  resetMocks: () => void;
  setMock: <K extends keyof T>(key: K, value: T[K]) => void;
  getMock: <K extends keyof T>(key: K) => T[K];
} {
  const mocks = { ...initialMocks };

  return {
    mocks,
    resetMocks: () => {
      Object.keys(mocks).forEach((key) => {
        const mock = mocks[key as keyof T];
        if (mock && typeof mock === 'function' && 'mockReset' in mock) {
          (mock as { mockReset: () => void }).mockReset();
        }
      });
    },
    setMock: <K extends keyof T>(key: K, value: T[K]) => {
      mocks[key] = value;
    },
    getMock: <K extends keyof T>(key: K) => mocks[key],
  };
}

/**
 * Create a mock API hook for testing components that depend on data fetching hooks.
 *
 * @example
 * ```tsx
 * const { useApi, setData, setError, setLoading } = createMockApiHook<User[]>();
 *
 * // Hook returns loading initially
 * expect(useApi().isLoading).toBe(true);
 *
 * // Set data
 * setData([{ id: 1, name: 'Test' }]);
 * expect(useApi().data).toEqual([{ id: 1, name: 'Test' }]);
 * ```
 */
export function createMockApiHook<TData = unknown, TError = Error>(): {
  useApi: () => {
    data: TData | null;
    error: TError | null;
    isLoading: boolean;
    isError: boolean;
    isSuccess: boolean;
  };
  setData: (data: TData) => void;
  setError: (error: TError) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
} {
  let state = {
    data: null as TData | null,
    error: null as TError | null,
    isLoading: true,
  };

  return {
    useApi: () => ({
      ...state,
      isError: state.error !== null,
      isSuccess: state.data !== null && state.error === null,
    }),
    setData: (data: TData) => {
      state = { data, error: null, isLoading: false };
    },
    setError: (error: TError) => {
      state = { data: null, error, isLoading: false };
    },
    setLoading: (loading: boolean) => {
      state = { ...state, isLoading: loading };
    },
    reset: () => {
      state = { data: null, error: null, isLoading: true };
    },
  };
}

// ============================================================================
// Re-exports
// ============================================================================

// Re-export commonly used testing utilities
export { act, waitFor, renderHook } from '@testing-library/react';
export { vi } from 'vitest';
