/**
 * Hook Test Utilities - Test Suite
 *
 * Tests demonstrating usage of the hook test utilities
 * for various hook testing scenarios.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  renderHookWithProviders,
  renderHookWithAllProviders,
  waitForHook,
  waitForHookState,
  actWithTimers,
  actAndRunAllTimers,
  actAndRunOnlyPendingTimers,
  createMockDependencies,
  createMockApiHook,
  act,
  renderHook,
} from './hook-utils';
import { useMockWallet } from './component-utils';

// ============================================================================
// Test Hooks
// ============================================================================

/**
 * Simple counter hook for basic testing
 */
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => setCount((c) => c + 1), []);
  const decrement = useCallback(() => setCount((c) => c - 1), []);
  const reset = useCallback(() => setCount(initialValue), [initialValue]);

  return { count, increment, decrement, reset };
}

/**
 * Async hook for testing async state updates
 */
function useAsyncValue(fetchFn: () => Promise<string>) {
  const [value, setValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetchFn()
      .then((data) => {
        if (!cancelled) {
          setValue(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fetchFn]);

  return { value, loading, error };
}

/**
 * Timer-based hook for testing timer utilities
 */
function useDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook that uses router context
 */
function useCurrentRoute() {
  const location = useLocation();
  return {
    path: location.pathname,
    search: location.search,
  };
}

/**
 * Hook that uses query context
 */
function useData() {
  return useQuery({
    queryKey: ['test-data'],
    queryFn: async () => {
      return { id: 1, name: 'Test Data' };
    },
  });
}

/**
 * Hook that uses wallet context
 */
function useWalletInfo() {
  const wallet = useMockWallet();
  return {
    address: wallet.address,
    balance: wallet.usdcBalance,
    isConnected: wallet.isConnected,
    connect: wallet.connect,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('Hook Test Utilities', () => {
  describe('renderHookWithProviders', () => {
    it('renders a basic hook without providers', () => {
      const { result } = renderHookWithProviders(() => useCounter(0));

      expect(result.current.count).toBe(0);
    });

    it('allows interaction with hook via act', () => {
      const { result } = renderHookWithProviders(() => useCounter(0));

      act(() => {
        result.current.increment();
      });

      expect(result.current.count).toBe(1);

      act(() => {
        result.current.increment();
        result.current.increment();
      });

      expect(result.current.count).toBe(3);

      act(() => {
        result.current.decrement();
      });

      expect(result.current.count).toBe(2);
    });

    it('supports initial props', () => {
      const { result } = renderHookWithProviders(() => useCounter(10));

      expect(result.current.count).toBe(10);
    });

    it('renders with router context', () => {
      const { result } = renderHookWithProviders(() => useCurrentRoute(), {
        withRouter: true,
        route: '/games/snake',
      });

      expect(result.current.path).toBe('/games/snake');
    });

    it('renders with query client context', async () => {
      const { result, queryClient } = renderHookWithProviders(() => useData(), {
        withQueryClient: true,
      });

      expect(queryClient).toBeDefined();

      await waitForHookState(result, (state) => !state.isLoading);

      expect(result.current.data).toEqual({ id: 1, name: 'Test Data' });
    });

    it('renders with wallet context', () => {
      const { result, walletState } = renderHookWithProviders(() => useWalletInfo(), {
        withWallet: true,
        walletState: { usdcBalance: '250.00' },
      });

      expect(walletState).toBeDefined();
      expect(result.current.isConnected).toBe(true);
      expect(result.current.balance).toBe('250.00');
    });

    it('allows custom wallet actions', async () => {
      const mockConnect = vi.fn();

      const { result } = renderHookWithProviders(() => useWalletInfo(), {
        withWallet: true,
        walletState: { isConnected: false },
        walletActions: { connect: mockConnect },
      });

      expect(result.current.isConnected).toBe(false);

      await act(async () => {
        await result.current.connect();
      });

      expect(mockConnect).toHaveBeenCalled();
    });
  });

  describe('renderHookWithAllProviders', () => {
    it('includes all contexts by default', async () => {
      const { result, queryClient, walletState } = renderHookWithAllProviders(() => {
        const wallet = useMockWallet();
        const route = useCurrentRoute();
        const query = useData();
        return { wallet, route, query };
      });

      expect(queryClient).toBeDefined();
      expect(walletState).toBeDefined();
      expect(result.current.wallet.isConnected).toBe(true);
      expect(result.current.route.path).toBe('/');

      await waitForHookState(result, (state) => !state.query.isLoading);

      expect(result.current.query.data).toBeDefined();
    });
  });

  describe('waitForHook', () => {
    it('waits for async hook state', async () => {
      const mockFetch = vi.fn().mockResolvedValue('loaded data');

      const { result } = renderHook(() => useAsyncValue(mockFetch));

      expect(result.current.loading).toBe(true);

      const value = await waitForHook(() => result.current.value);

      expect(value).toBe('loaded data');
      expect(result.current.loading).toBe(false);
    });

    it('times out if predicate never satisfied', async () => {
      const mockFetch = vi.fn().mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useAsyncValue(mockFetch));

      await expect(
        waitForHook(() => result.current.value, { timeout: 100 })
      ).rejects.toThrow();
    });
  });

  describe('waitForHookState', () => {
    it('waits for specific state condition', async () => {
      const mockFetch = vi.fn().mockResolvedValue('data');

      const { result } = renderHook(() => useAsyncValue(mockFetch));

      await waitForHookState(result, (state) => state.loading === false);

      expect(result.current.value).toBe('data');
    });

    it('handles error states', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Failed'));

      const { result } = renderHook(() => useAsyncValue(mockFetch));

      await waitForHookState(result, (state) => state.error !== null);

      expect(result.current.error?.message).toBe('Failed');
    });
  });

  describe('Timer Utilities', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    describe('actWithTimers', () => {
      it('advances timers by specified amount', async () => {
        const { result, rerender } = renderHook(
          ({ value }) => useDebounce(value, 500),
          { initialProps: { value: 'initial' } }
        );

        expect(result.current).toBe('initial');

        rerender({ value: 'updated' });

        // Value shouldn't change immediately
        expect(result.current).toBe('initial');

        // Advance timers
        await actWithTimers(() => {}, 500);

        expect(result.current).toBe('updated');
      });

      it('handles callback with state updates', async () => {
        const { result } = renderHook(() => useCounter(0));

        await actWithTimers(() => {
          result.current.increment();
        }, 100);

        expect(result.current.count).toBe(1);
      });
    });

    describe('actAndRunAllTimers', () => {
      it('runs all pending timers', async () => {
        const { result, rerender } = renderHook(
          ({ value }) => useDebounce(value, 1000),
          { initialProps: { value: 'initial' } }
        );

        rerender({ value: 'final' });

        await actAndRunAllTimers(() => {});

        expect(result.current).toBe('final');
      });
    });

    describe('actAndRunOnlyPendingTimers', () => {
      it('runs only pending timers without recursion', async () => {
        let timerCount = 0;
        const intervalCallback = vi.fn(() => {
          timerCount++;
        });

        renderHook(() => {
          useEffect(() => {
            const id = setInterval(intervalCallback, 100);
            return () => clearInterval(id);
          }, []);
        });

        await actAndRunOnlyPendingTimers(() => {});

        // Should only run once (not infinitely)
        expect(intervalCallback).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('createMockDependencies', () => {
    it('creates mock dependency object', () => {
      const mockFetch = vi.fn().mockResolvedValue({ data: [] });
      const mockLogger = vi.fn();

      const { mocks } = createMockDependencies({
        fetchData: mockFetch,
        logger: mockLogger,
      });

      expect(mocks.fetchData).toBe(mockFetch);
      expect(mocks.logger).toBe(mockLogger);
    });

    it('resetMocks clears all mock state', () => {
      const mockFetch = vi.fn().mockResolvedValue({ data: [] });
      mockFetch('test call');

      const { mocks, resetMocks } = createMockDependencies({
        fetchData: mockFetch,
      });

      expect(mocks.fetchData).toHaveBeenCalled();

      resetMocks();

      expect(mocks.fetchData).not.toHaveBeenCalled();
    });

    it('setMock updates specific mock', () => {
      const initialMock = vi.fn();
      const newMock = vi.fn();

      const { mocks, setMock } = createMockDependencies({
        fetchData: initialMock,
      });

      expect(mocks.fetchData).toBe(initialMock);

      setMock('fetchData', newMock);

      expect(mocks.fetchData).toBe(newMock);
    });

    it('getMock retrieves specific mock', () => {
      const mockFetch = vi.fn();

      const { getMock } = createMockDependencies({
        fetchData: mockFetch,
      });

      expect(getMock('fetchData')).toBe(mockFetch);
    });
  });

  describe('createMockApiHook', () => {
    it('creates mock API hook with loading state', () => {
      const { useApi } = createMockApiHook<string[]>();

      const result = useApi();

      expect(result.isLoading).toBe(true);
      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
      expect(result.isError).toBe(false);
      expect(result.isSuccess).toBe(false);
    });

    it('setData updates data and clears loading', () => {
      const { useApi, setData } = createMockApiHook<string[]>();

      setData(['item1', 'item2']);

      const result = useApi();

      expect(result.isLoading).toBe(false);
      expect(result.data).toEqual(['item1', 'item2']);
      expect(result.isSuccess).toBe(true);
      expect(result.isError).toBe(false);
    });

    it('setError updates error state', () => {
      const { useApi, setError } = createMockApiHook<string[], Error>();

      setError(new Error('API Error'));

      const result = useApi();

      expect(result.isLoading).toBe(false);
      expect(result.error?.message).toBe('API Error');
      expect(result.isError).toBe(true);
      expect(result.isSuccess).toBe(false);
    });

    it('setLoading updates loading state', () => {
      const { useApi, setData, setLoading } = createMockApiHook<string[]>();

      setData(['data']);
      expect(useApi().isLoading).toBe(false);

      setLoading(true);
      expect(useApi().isLoading).toBe(true);
    });

    it('reset returns to initial loading state', () => {
      const { useApi, setData, reset } = createMockApiHook<string[]>();

      setData(['data']);
      expect(useApi().isSuccess).toBe(true);

      reset();
      expect(useApi().isLoading).toBe(true);
      expect(useApi().data).toBeNull();
    });
  });
});

describe('Integration Examples', () => {
  it('testing a hook with dependency injection', () => {
    // Hook that accepts dependencies
    function useDataFetcher(deps: { fetch: () => Promise<string> }) {
      const [data, setData] = useState<string | null>(null);

      const fetchData = useCallback(async () => {
        const result = await deps.fetch();
        setData(result);
      }, [deps]);

      return { data, fetchData };
    }

    // Create mock dependencies
    const mockFetch = vi.fn().mockResolvedValue('fetched data');
    const { mocks } = createMockDependencies({ fetch: mockFetch });

    // Render hook with mocks
    const { result } = renderHook(() => useDataFetcher(mocks));

    expect(result.current.data).toBeNull();

    // Trigger fetch
    act(() => {
      result.current.fetchData();
    });

    // Verify mock was called
    expect(mockFetch).toHaveBeenCalled();
  });

  it('testing a hook with context dependencies', async () => {
    // Hook that combines multiple contexts
    function useCombinedState() {
      const wallet = useMockWallet();
      const route = useCurrentRoute();

      return {
        canPlay: wallet.isConnected && parseFloat(wallet.usdcBalance) >= 0.01,
        currentGame: route.path.includes('/play/')
          ? route.path.split('/play/')[1]
          : null,
      };
    }

    const { result } = renderHookWithAllProviders(() => useCombinedState(), {
      route: '/play/snake',
      walletState: { usdcBalance: '10.00' },
    });

    expect(result.current.canPlay).toBe(true);
    expect(result.current.currentGame).toBe('snake');
  });

  it('testing timer-based hooks with fake timers', async () => {
    vi.useFakeTimers();

    // Hook that polls for updates
    function usePolling(intervalMs: number) {
      const [pollCount, setPollCount] = useState(0);

      useEffect(() => {
        const id = setInterval(() => {
          setPollCount((c) => c + 1);
        }, intervalMs);

        return () => clearInterval(id);
      }, [intervalMs]);

      return pollCount;
    }

    const { result } = renderHook(() => usePolling(1000));

    expect(result.current).toBe(0);

    await actWithTimers(() => {}, 1000);
    expect(result.current).toBe(1);

    await actWithTimers(() => {}, 2000);
    expect(result.current).toBe(3);

    vi.useRealTimers();
  });
});
