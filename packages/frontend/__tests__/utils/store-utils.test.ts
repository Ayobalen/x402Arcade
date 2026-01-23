/**
 * Store Test Utilities - Comprehensive Tests
 *
 * Tests for Zustand store testing utilities.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { create } from 'zustand';
import {
  // Core store creation
  createTestStore,
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
  // Example stores
  createExampleWalletStore,
  createExampleGameStore,
  type ExampleWalletState,
  type ExampleGameState,
  type TestStore,
} from './store-utils';

// ============================================================================
// Test Store Definitions
// ============================================================================

interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  setCount: (n: number) => void;
}

interface AsyncState {
  data: string | null;
  isLoading: boolean;
  error: string | null;
  fetchData: () => Promise<void>;
  clearData: () => void;
}

// ============================================================================
// createTestStore Tests
// ============================================================================

describe('Store Test Utilities', () => {
  beforeEach(() => {
    clearStoreRegistry();
  });

  afterEach(() => {
    resetAllStores();
  });

  describe('createTestStore', () => {
    it('creates a functional Zustand store', () => {
      const useStore = createTestStore<CounterState>((set) => ({
        count: 0,
        increment: () => set((s) => ({ count: s.count + 1 })),
        decrement: () => set((s) => ({ count: s.count - 1 })),
        reset: () => set({ count: 0 }),
        setCount: (n) => set({ count: n }),
      }));

      expect(useStore.getState().count).toBe(0);

      useStore.getState().increment();
      expect(useStore.getState().count).toBe(1);

      useStore.getState().increment();
      expect(useStore.getState().count).toBe(2);

      useStore.getState().decrement();
      expect(useStore.getState().count).toBe(1);
    });

    it('supports reset to initial state', () => {
      const useStore = createTestStore<CounterState>((set) => ({
        count: 0,
        increment: () => set((s) => ({ count: s.count + 1 })),
        decrement: () => set((s) => ({ count: s.count - 1 })),
        reset: () => set({ count: 0 }),
        setCount: (n) => set({ count: n }),
      }));

      useStore.getState().setCount(100);
      expect(useStore.getState().count).toBe(100);

      useStore.reset();
      expect(useStore.getState().count).toBe(0);
    });

    it('supports initial state overrides', () => {
      const useStore = createTestStore<CounterState>(
        (set) => ({
          count: 0,
          increment: () => set((s) => ({ count: s.count + 1 })),
          decrement: () => set((s) => ({ count: s.count - 1 })),
          reset: () => set({ count: 0 }),
          setCount: (n) => set({ count: n }),
        }),
        { initialState: { count: 50 } }
      );

      expect(useStore.getState().count).toBe(50);

      // Reset goes back to overridden initial state
      useStore.getState().increment();
      expect(useStore.getState().count).toBe(51);

      useStore.reset();
      expect(useStore.getState().count).toBe(50);
    });

    it('provides getName method', () => {
      const useStore = createTestStore<CounterState>(
        (set) => ({
          count: 0,
          increment: () => set((s) => ({ count: s.count + 1 })),
          decrement: () => set((s) => ({ count: s.count - 1 })),
          reset: () => set({ count: 0 }),
          setCount: (n) => set({ count: n }),
        }),
        { name: 'counter-store' }
      );

      expect(useStore.getName()).toBe('counter-store');
    });

    it('provides getInitialState method', () => {
      const useStore = createTestStore<CounterState>(
        (set) => ({
          count: 10,
          increment: () => set((s) => ({ count: s.count + 1 })),
          decrement: () => set((s) => ({ count: s.count - 1 })),
          reset: () => set({ count: 0 }),
          setCount: (n) => set({ count: n }),
        })
      );

      useStore.getState().setCount(999);

      // getInitialState should return original, not current
      const initial = useStore.getInitialState();
      expect(initial.count).toBe(10);
    });

    it('registers store for cleanup', () => {
      clearStoreRegistry();

      createTestStore<CounterState>((set) => ({
        count: 0,
        increment: () => set((s) => ({ count: s.count + 1 })),
        decrement: () => set((s) => ({ count: s.count - 1 })),
        reset: () => set({ count: 0 }),
        setCount: (n) => set({ count: n }),
      }));

      expect(getRegisteredStoreCount()).toBe(1);
    });

    it('creates isolated store instances', () => {
      const useStore1 = createTestStore<CounterState>((set) => ({
        count: 0,
        increment: () => set((s) => ({ count: s.count + 1 })),
        decrement: () => set((s) => ({ count: s.count - 1 })),
        reset: () => set({ count: 0 }),
        setCount: (n) => set({ count: n }),
      }));

      const useStore2 = createTestStore<CounterState>((set) => ({
        count: 0,
        increment: () => set((s) => ({ count: s.count + 1 })),
        decrement: () => set((s) => ({ count: s.count - 1 })),
        reset: () => set({ count: 0 }),
        setCount: (n) => set({ count: n }),
      }));

      useStore1.getState().setCount(100);
      expect(useStore1.getState().count).toBe(100);
      expect(useStore2.getState().count).toBe(0);
    });
  });

  // ============================================================================
  // withInitialState Tests
  // ============================================================================

  describe('withInitialState', () => {
    it('wraps existing store creator with initial state', () => {
      const createCounterStore = () =>
        create<CounterState>((set) => ({
          count: 0,
          increment: () => set((s) => ({ count: s.count + 1 })),
          decrement: () => set((s) => ({ count: s.count - 1 })),
          reset: () => set({ count: 0 }),
          setCount: (n) => set({ count: n }),
        }));

      const useStore = withInitialState(createCounterStore, { count: 42 });

      expect(useStore.getState().count).toBe(42);
    });

    it('supports reset to initial state', () => {
      const createCounterStore = () =>
        create<CounterState>((set) => ({
          count: 0,
          increment: () => set((s) => ({ count: s.count + 1 })),
          decrement: () => set((s) => ({ count: s.count - 1 })),
          reset: () => set({ count: 0 }),
          setCount: (n) => set({ count: n }),
        }));

      const useStore = withInitialState(createCounterStore, { count: 42 });

      useStore.getState().setCount(999);
      expect(useStore.getState().count).toBe(999);

      useStore.reset();
      expect(useStore.getState().count).toBe(42);
    });

    it('preserves store actions', () => {
      const createCounterStore = () =>
        create<CounterState>((set) => ({
          count: 0,
          increment: () => set((s) => ({ count: s.count + 1 })),
          decrement: () => set((s) => ({ count: s.count - 1 })),
          reset: () => set({ count: 0 }),
          setCount: (n) => set({ count: n }),
        }));

      const useStore = withInitialState(createCounterStore, { count: 10 });

      useStore.getState().increment();
      expect(useStore.getState().count).toBe(11);

      useStore.getState().decrement();
      expect(useStore.getState().count).toBe(10);
    });
  });

  // ============================================================================
  // mockSelector Tests
  // ============================================================================

  describe('mockSelector', () => {
    it('creates a mock that calls original selector', () => {
      const originalSelector = (state: CounterState) => state.count;
      const mocked = mockSelector(originalSelector);

      const state: CounterState = {
        count: 42,
        increment: () => {},
        decrement: () => {},
        reset: () => {},
        setCount: () => {},
      };

      const result = mocked.selector(state);
      expect(result).toBe(42);
    });

    it('tracks call count', () => {
      const originalSelector = (state: CounterState) => state.count;
      const mocked = mockSelector(originalSelector);

      const state: CounterState = {
        count: 42,
        increment: () => {},
        decrement: () => {},
        reset: () => {},
        setCount: () => {},
      };

      expect(mocked.getCallCount()).toBe(0);

      mocked.selector(state);
      expect(mocked.getCallCount()).toBe(1);

      mocked.selector(state);
      mocked.selector(state);
      expect(mocked.getCallCount()).toBe(3);
    });

    it('records call arguments', () => {
      const originalSelector = (state: CounterState) => state.count;
      const mocked = mockSelector(originalSelector);

      const state1: CounterState = {
        count: 10,
        increment: () => {},
        decrement: () => {},
        reset: () => {},
        setCount: () => {},
      };

      const state2: CounterState = {
        count: 20,
        increment: () => {},
        decrement: () => {},
        reset: () => {},
        setCount: () => {},
      };

      mocked.selector(state1);
      mocked.selector(state2);

      const calls = mocked.getCalls();
      expect(calls).toHaveLength(2);
      expect(calls[0].count).toBe(10);
      expect(calls[1].count).toBe(20);
    });

    it('provides last call argument', () => {
      const originalSelector = (state: CounterState) => state.count;
      const mocked = mockSelector(originalSelector);

      expect(mocked.getLastCall()).toBeUndefined();

      const state: CounterState = {
        count: 99,
        increment: () => {},
        decrement: () => {},
        reset: () => {},
        setCount: () => {},
      };

      mocked.selector(state);
      expect(mocked.getLastCall()?.count).toBe(99);
    });

    it('supports custom return value', () => {
      const originalSelector = (state: CounterState) => state.count;
      const mocked = mockSelector(originalSelector);

      mocked.setReturnValue(999);

      const state: CounterState = {
        count: 42,
        increment: () => {},
        decrement: () => {},
        reset: () => {},
        setCount: () => {},
      };

      const result = mocked.selector(state);
      expect(result).toBe(999);
    });

    it('supports reset', () => {
      const originalSelector = (state: CounterState) => state.count;
      const mocked = mockSelector(originalSelector);

      const state: CounterState = {
        count: 42,
        increment: () => {},
        decrement: () => {},
        reset: () => {},
        setCount: () => {},
      };

      mocked.selector(state);
      mocked.selector(state);
      mocked.setReturnValue(999);

      expect(mocked.getCallCount()).toBe(2);

      mocked.reset();

      expect(mocked.getCallCount()).toBe(0);
      expect(mocked.selector(state)).toBe(42); // Original behavior restored
    });
  });

  // ============================================================================
  // createTrackedSelector Tests
  // ============================================================================

  describe('createTrackedSelector', () => {
    it('returns original selector result', () => {
      const original = (state: CounterState) => state.count * 2;
      const { selector } = createTrackedSelector(original);

      const state: CounterState = {
        count: 10,
        increment: () => {},
        decrement: () => {},
        reset: () => {},
        setCount: () => {},
      };

      expect(selector(state)).toBe(20);
    });

    it('tracks render count', () => {
      const original = (state: CounterState) => state.count;
      const { selector, getRenderCount } = createTrackedSelector(original);

      const state: CounterState = {
        count: 5,
        increment: () => {},
        decrement: () => {},
        reset: () => {},
        setCount: () => {},
      };

      expect(getRenderCount()).toBe(0);

      selector(state);
      expect(getRenderCount()).toBe(1);

      selector(state);
      selector(state);
      expect(getRenderCount()).toBe(3);
    });

    it('supports reset', () => {
      const original = (state: CounterState) => state.count;
      const { selector, getRenderCount, reset } = createTrackedSelector(original);

      const state: CounterState = {
        count: 5,
        increment: () => {},
        decrement: () => {},
        reset: () => {},
        setCount: () => {},
      };

      selector(state);
      selector(state);
      expect(getRenderCount()).toBe(2);

      reset();
      expect(getRenderCount()).toBe(0);
    });
  });

  // ============================================================================
  // storeSnapshot Tests
  // ============================================================================

  describe('storeSnapshot', () => {
    it('returns current state without functions', () => {
      const useStore = createTestStore<CounterState>((set) => ({
        count: 42,
        increment: () => set((s) => ({ count: s.count + 1 })),
        decrement: () => set((s) => ({ count: s.count - 1 })),
        reset: () => set({ count: 0 }),
        setCount: (n) => set({ count: n }),
      }));

      const snapshot = storeSnapshot(useStore);

      expect(snapshot).toEqual({ count: 42 });
      expect(snapshot).not.toHaveProperty('increment');
      expect(snapshot).not.toHaveProperty('decrement');
    });

    it('supports exclude option', () => {
      interface StateWithMultiple {
        a: number;
        b: number;
        c: number;
        setA: (n: number) => void;
      }

      const useStore = createTestStore<StateWithMultiple>((set) => ({
        a: 1,
        b: 2,
        c: 3,
        setA: (n) => set({ a: n }),
      }));

      const snapshot = storeSnapshot(useStore, { exclude: ['b'] });

      expect(snapshot).toEqual({ a: 1, c: 3 });
    });

    it('supports include option', () => {
      interface StateWithMultiple {
        a: number;
        b: number;
        c: number;
        setA: (n: number) => void;
      }

      const useStore = createTestStore<StateWithMultiple>((set) => ({
        a: 1,
        b: 2,
        c: 3,
        setA: (n) => set({ a: n }),
      }));

      const snapshot = storeSnapshot(useStore, { include: ['a', 'b'] });

      expect(snapshot).toEqual({ a: 1, b: 2 });
    });

    it('deep clones nested objects', () => {
      interface NestedState {
        nested: { value: number };
        setNested: (v: number) => void;
      }

      const useStore = createTestStore<NestedState>((set) => ({
        nested: { value: 42 },
        setNested: (v) => set({ nested: { value: v } }),
      }));

      const snapshot = storeSnapshot(useStore);

      // Modify store
      useStore.getState().setNested(999);

      // Snapshot should be unaffected (deep clone)
      expect(snapshot.nested?.value).toBe(42);
    });

    it('works with raw StoreApi', () => {
      const store = create<CounterState>((set) => ({
        count: 77,
        increment: () => set((s) => ({ count: s.count + 1 })),
        decrement: () => set((s) => ({ count: s.count - 1 })),
        reset: () => set({ count: 0 }),
        setCount: (n) => set({ count: n }),
      }));

      const snapshot = storeSnapshot(store);

      expect(snapshot).toEqual({ count: 77 });
    });
  });

  // ============================================================================
  // compareSnapshots Tests
  // ============================================================================

  describe('compareSnapshots', () => {
    it('returns true for identical snapshots', () => {
      const snapshot1 = { count: 42 };
      const snapshot2 = { count: 42 };

      expect(compareSnapshots(snapshot1, snapshot2)).toBe(true);
    });

    it('returns false for different snapshots', () => {
      const snapshot1 = { count: 42 };
      const snapshot2 = { count: 43 };

      expect(compareSnapshots(snapshot1, snapshot2)).toBe(false);
    });

    it('handles nested objects', () => {
      const snapshot1 = { nested: { a: 1, b: 2 } };
      const snapshot2 = { nested: { a: 1, b: 2 } };
      const snapshot3 = { nested: { a: 1, b: 3 } };

      expect(compareSnapshots(snapshot1, snapshot2)).toBe(true);
      expect(compareSnapshots(snapshot1, snapshot3)).toBe(false);
    });

    it('handles arrays', () => {
      const snapshot1 = { items: [1, 2, 3] };
      const snapshot2 = { items: [1, 2, 3] };
      const snapshot3 = { items: [1, 2, 4] };

      expect(compareSnapshots(snapshot1, snapshot2)).toBe(true);
      expect(compareSnapshots(snapshot1, snapshot3)).toBe(false);
    });
  });

  // ============================================================================
  // createHistoryTrackedStore Tests
  // ============================================================================

  describe('createHistoryTrackedStore', () => {
    it('records initial state', () => {
      const { getHistory } = createHistoryTrackedStore<CounterState>((set) => ({
        count: 0,
        increment: () => set((s) => ({ count: s.count + 1 })),
        decrement: () => set((s) => ({ count: s.count - 1 })),
        reset: () => set({ count: 0 }),
        setCount: (n) => set({ count: n }),
      }));

      const history = getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].count).toBe(0);
    });

    it('records state changes', () => {
      const { store, getHistory } = createHistoryTrackedStore<CounterState>((set) => ({
        count: 0,
        increment: () => set((s) => ({ count: s.count + 1 })),
        decrement: () => set((s) => ({ count: s.count - 1 })),
        reset: () => set({ count: 0 }),
        setCount: (n) => set({ count: n }),
      }));

      store.getState().increment();
      store.getState().increment();
      store.getState().decrement();

      const history = getHistory();
      expect(history).toHaveLength(4); // initial + 3 changes
      expect(history[0].count).toBe(0);
      expect(history[1].count).toBe(1);
      expect(history[2].count).toBe(2);
      expect(history[3].count).toBe(1);
    });

    it('supports clearHistory', () => {
      const { store, getHistory, clearHistory } = createHistoryTrackedStore<CounterState>((set) => ({
        count: 0,
        increment: () => set((s) => ({ count: s.count + 1 })),
        decrement: () => set((s) => ({ count: s.count - 1 })),
        reset: () => set({ count: 0 }),
        setCount: (n) => set({ count: n }),
      }));

      store.getState().increment();
      store.getState().increment();
      expect(getHistory()).toHaveLength(3);

      clearHistory();

      const history = getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].count).toBe(2); // Current state
    });

    it('provides getHistoryLength', () => {
      const { store, getHistoryLength } = createHistoryTrackedStore<CounterState>((set) => ({
        count: 0,
        increment: () => set((s) => ({ count: s.count + 1 })),
        decrement: () => set((s) => ({ count: s.count - 1 })),
        reset: () => set({ count: 0 }),
        setCount: (n) => set({ count: n }),
      }));

      expect(getHistoryLength()).toBe(1);

      store.getState().increment();
      expect(getHistoryLength()).toBe(2);

      store.getState().increment();
      store.getState().increment();
      expect(getHistoryLength()).toBe(4);
    });
  });

  // ============================================================================
  // Cleanup Utilities Tests
  // ============================================================================

  describe('Cleanup Utilities', () => {
    describe('resetAllStores', () => {
      it('resets all registered stores', () => {
        clearStoreRegistry();

        const useStore1 = createTestStore<CounterState>((set) => ({
          count: 0,
          increment: () => set((s) => ({ count: s.count + 1 })),
          decrement: () => set((s) => ({ count: s.count - 1 })),
          reset: () => set({ count: 0 }),
          setCount: (n) => set({ count: n }),
        }));

        const useStore2 = createTestStore<CounterState>((set) => ({
          count: 100,
          increment: () => set((s) => ({ count: s.count + 1 })),
          decrement: () => set((s) => ({ count: s.count - 1 })),
          reset: () => set({ count: 0 }),
          setCount: (n) => set({ count: n }),
        }));

        useStore1.getState().setCount(999);
        useStore2.getState().setCount(888);

        expect(useStore1.getState().count).toBe(999);
        expect(useStore2.getState().count).toBe(888);

        resetAllStores();

        expect(useStore1.getState().count).toBe(0);
        expect(useStore2.getState().count).toBe(100);
      });
    });

    describe('clearStoreRegistry', () => {
      it('clears all registered stores', () => {
        createTestStore<CounterState>((set) => ({
          count: 0,
          increment: () => set((s) => ({ count: s.count + 1 })),
          decrement: () => set((s) => ({ count: s.count - 1 })),
          reset: () => set({ count: 0 }),
          setCount: (n) => set({ count: n }),
        }));

        expect(getRegisteredStoreCount()).toBeGreaterThan(0);

        clearStoreRegistry();

        expect(getRegisteredStoreCount()).toBe(0);
      });
    });

    describe('getRegisteredStoreNames', () => {
      it('returns names of registered stores', () => {
        clearStoreRegistry();

        createTestStore<CounterState>(
          (set) => ({
            count: 0,
            increment: () => set((s) => ({ count: s.count + 1 })),
            decrement: () => set((s) => ({ count: s.count - 1 })),
            reset: () => set({ count: 0 }),
            setCount: (n) => set({ count: n }),
          }),
          { name: 'counter' }
        );

        createTestStore<CounterState>(
          (set) => ({
            count: 0,
            increment: () => set((s) => ({ count: s.count + 1 })),
            decrement: () => set((s) => ({ count: s.count - 1 })),
            reset: () => set({ count: 0 }),
            setCount: (n) => set({ count: n }),
          }),
          { name: 'other-counter' }
        );

        const names = getRegisteredStoreNames();
        expect(names).toContain('counter');
        expect(names).toContain('other-counter');
      });
    });
  });

  // ============================================================================
  // createActionSpy Tests
  // ============================================================================

  describe('createActionSpy', () => {
    it('tracks when action is called', () => {
      const useStore = createTestStore<CounterState>((set) => ({
        count: 0,
        increment: () => set((s) => ({ count: s.count + 1 })),
        decrement: () => set((s) => ({ count: s.count - 1 })),
        reset: () => set({ count: 0 }),
        setCount: (n) => set({ count: n }),
      }));

      const spy = createActionSpy(useStore, 'increment');

      expect(spy.wasCalled()).toBe(false);

      useStore.getState().increment();

      expect(spy.wasCalled()).toBe(true);
      expect(spy.getCallCount()).toBe(1);

      spy.restore();
    });

    it('records call arguments', () => {
      const useStore = createTestStore<CounterState>((set) => ({
        count: 0,
        increment: () => set((s) => ({ count: s.count + 1 })),
        decrement: () => set((s) => ({ count: s.count - 1 })),
        reset: () => set({ count: 0 }),
        setCount: (n) => set({ count: n }),
      }));

      const spy = createActionSpy(useStore, 'setCount');

      useStore.getState().setCount(10);
      useStore.getState().setCount(20);

      const args = spy.getCallArgs();
      expect(args).toEqual([[10], [20]]);

      spy.restore();
    });

    it('still executes original action', () => {
      const useStore = createTestStore<CounterState>((set) => ({
        count: 0,
        increment: () => set((s) => ({ count: s.count + 1 })),
        decrement: () => set((s) => ({ count: s.count - 1 })),
        reset: () => set({ count: 0 }),
        setCount: (n) => set({ count: n }),
      }));

      const spy = createActionSpy(useStore, 'increment');

      useStore.getState().increment();
      expect(useStore.getState().count).toBe(1);

      useStore.getState().increment();
      expect(useStore.getState().count).toBe(2);

      spy.restore();
    });

    it('restores original action', () => {
      const useStore = createTestStore<CounterState>((set) => ({
        count: 0,
        increment: () => set((s) => ({ count: s.count + 1 })),
        decrement: () => set((s) => ({ count: s.count - 1 })),
        reset: () => set({ count: 0 }),
        setCount: (n) => set({ count: n }),
      }));

      const originalIncrement = useStore.getState().increment;
      const spy = createActionSpy(useStore, 'increment');

      expect(useStore.getState().increment).not.toBe(originalIncrement);

      spy.restore();

      // Original action should work the same way
      useStore.getState().increment();
      expect(useStore.getState().count).toBe(1);
    });

    it('throws for non-function properties', () => {
      const useStore = createTestStore<CounterState>((set) => ({
        count: 0,
        increment: () => set((s) => ({ count: s.count + 1 })),
        decrement: () => set((s) => ({ count: s.count - 1 })),
        reset: () => set({ count: 0 }),
        setCount: (n) => set({ count: n }),
      }));

      expect(() => createActionSpy(useStore, 'count')).toThrow('count is not a function');
    });
  });

  // ============================================================================
  // waitForStoreState Tests
  // ============================================================================

  describe('waitForStoreState', () => {
    it('resolves immediately if condition is met', async () => {
      const useStore = createTestStore<CounterState>((set) => ({
        count: 42,
        increment: () => set((s) => ({ count: s.count + 1 })),
        decrement: () => set((s) => ({ count: s.count - 1 })),
        reset: () => set({ count: 0 }),
        setCount: (n) => set({ count: n }),
      }));

      const state = await waitForStoreState(useStore, (s) => s.count === 42);

      expect(state.count).toBe(42);
    });

    it('waits for condition to be met', async () => {
      const useStore = createTestStore<CounterState>((set) => ({
        count: 0,
        increment: () => set((s) => ({ count: s.count + 1 })),
        decrement: () => set((s) => ({ count: s.count - 1 })),
        reset: () => set({ count: 0 }),
        setCount: (n) => set({ count: n }),
      }));

      // Update state after a delay
      setTimeout(() => {
        useStore.getState().setCount(100);
      }, 50);

      const state = await waitForStoreState(useStore, (s) => s.count === 100);

      expect(state.count).toBe(100);
    });

    it('rejects on timeout', async () => {
      const useStore = createTestStore<CounterState>((set) => ({
        count: 0,
        increment: () => set((s) => ({ count: s.count + 1 })),
        decrement: () => set((s) => ({ count: s.count - 1 })),
        reset: () => set({ count: 0 }),
        setCount: (n) => set({ count: n }),
      }));

      await expect(
        waitForStoreState(useStore, (s) => s.count === 999, { timeout: 100 })
      ).rejects.toThrow('Timed out waiting for store state condition after 100ms');
    });
  });

  // ============================================================================
  // Example Store Tests
  // ============================================================================

  describe('Example Stores', () => {
    describe('createExampleWalletStore', () => {
      it('creates a functional wallet store', () => {
        const useStore = createExampleWalletStore();

        expect(useStore.getState().address).toBeNull();
        expect(useStore.getState().isConnected).toBe(false);

        useStore.getState().connect('0x123');

        expect(useStore.getState().address).toBe('0x123');
        expect(useStore.getState().isConnected).toBe(true);

        useStore.getState().disconnect();

        expect(useStore.getState().address).toBeNull();
        expect(useStore.getState().isConnected).toBe(false);
      });

      it('supports reset', () => {
        const useStore = createExampleWalletStore();

        useStore.getState().connect('0x456');
        useStore.getState().setBalance('1000');

        useStore.reset();

        expect(useStore.getState().address).toBeNull();
        expect(useStore.getState().balance).toBe('0');
      });
    });

    describe('createExampleGameStore', () => {
      it('creates a functional game store', () => {
        const useStore = createExampleGameStore();

        expect(useStore.getState().score).toBe(0);
        expect(useStore.getState().isPlaying).toBe(false);

        useStore.getState().startGame();
        expect(useStore.getState().isPlaying).toBe(true);

        useStore.getState().incrementScore(100);
        expect(useStore.getState().score).toBe(100);

        useStore.getState().nextLevel();
        expect(useStore.getState().level).toBe(2);

        useStore.getState().endGame();
        expect(useStore.getState().isPlaying).toBe(false);
      });

      it('supports pause and resume', () => {
        const useStore = createExampleGameStore();

        useStore.getState().startGame();
        expect(useStore.getState().isPaused).toBe(false);

        useStore.getState().pauseGame();
        expect(useStore.getState().isPaused).toBe(true);

        useStore.getState().resumeGame();
        expect(useStore.getState().isPaused).toBe(false);
      });

      it('supports reset', () => {
        const useStore = createExampleGameStore();

        useStore.getState().startGame();
        useStore.getState().incrementScore(500);
        useStore.getState().nextLevel();
        useStore.getState().nextLevel();

        useStore.reset();

        expect(useStore.getState().score).toBe(0);
        expect(useStore.getState().level).toBe(1);
        expect(useStore.getState().isPlaying).toBe(false);
      });
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('Integration Examples', () => {
    it('demonstrates full testing workflow', () => {
      // 1. Create store with custom initial state
      const useWallet = createTestStore<ExampleWalletState>(
        (set) => ({
          address: null,
          isConnected: false,
          isConnecting: false,
          balance: '0',
          error: null,
          connect: (address: string) =>
            set({ address, isConnected: true, isConnecting: false, error: null }),
          disconnect: () =>
            set({ address: null, isConnected: false, isConnecting: false, balance: '0' }),
          setBalance: (balance: string) => set({ balance }),
          setError: (error: string | null) => set({ error }),
        }),
        { initialState: { balance: '100' } }
      );

      // 2. Take initial snapshot
      const beforeSnapshot = storeSnapshot(useWallet);
      expect(beforeSnapshot).toEqual({
        address: null,
        isConnected: false,
        isConnecting: false,
        balance: '100',
        error: null,
      });

      // 3. Spy on action
      const connectSpy = createActionSpy(useWallet, 'connect');

      // 4. Perform action
      useWallet.getState().connect('0xABC123');

      // 5. Assert action was called
      expect(connectSpy.wasCalled()).toBe(true);
      expect(connectSpy.getCallArgs()).toEqual([['0xABC123']]);

      // 6. Take after snapshot
      const afterSnapshot = storeSnapshot(useWallet);
      expect(afterSnapshot).toEqual({
        address: '0xABC123',
        isConnected: true,
        isConnecting: false,
        balance: '100',
        error: null,
      });

      // 7. Verify snapshots are different
      expect(compareSnapshots(beforeSnapshot, afterSnapshot)).toBe(false);

      // 8. Cleanup
      connectSpy.restore();
      useWallet.reset();

      // 9. Verify reset worked
      expect(storeSnapshot(useWallet)).toEqual(beforeSnapshot);
    });

    it('demonstrates history tracking workflow', () => {
      // Create history-tracked store
      const { store, getHistory, clearHistory } = createHistoryTrackedStore<ExampleGameState>(
        (set) => ({
          score: 0,
          level: 1,
          isPlaying: false,
          isPaused: false,
          incrementScore: (points: number) =>
            set((state) => ({ score: state.score + points })),
          nextLevel: () =>
            set((state) => ({ level: state.level + 1 })),
          startGame: () =>
            set({ isPlaying: true, isPaused: false, score: 0, level: 1 }),
          pauseGame: () =>
            set({ isPaused: true }),
          resumeGame: () =>
            set({ isPaused: false }),
          endGame: () =>
            set({ isPlaying: false, isPaused: false }),
          reset: () =>
            set({ score: 0, level: 1, isPlaying: false, isPaused: false }),
        })
      );

      // Play game
      store.getState().startGame();
      store.getState().incrementScore(100);
      store.getState().incrementScore(50);
      store.getState().nextLevel();
      store.getState().incrementScore(200);
      store.getState().endGame();

      // Analyze history
      const history = getHistory();
      expect(history.length).toBeGreaterThan(1);

      // Find score changes
      const scoreChanges = history
        .map((state, i) => ({
          index: i,
          score: state.score,
          delta: i > 0 ? state.score - history[i - 1].score : 0,
        }))
        .filter((change) => change.delta !== 0);

      expect(scoreChanges).toHaveLength(3);
      expect(scoreChanges[0].delta).toBe(100);
      expect(scoreChanges[1].delta).toBe(50);
      expect(scoreChanges[2].delta).toBe(200);

      // Clear and verify
      clearHistory();
      expect(getHistory()).toHaveLength(1);
    });

    it('demonstrates selector mocking for derived state', () => {
      // Original selector
      const selectFormattedBalance = (state: ExampleWalletState) =>
        `$${parseFloat(state.balance).toFixed(2)} USDC`;

      // Create mock
      const mockedSelector = mockSelector(selectFormattedBalance);

      // Test with real state
      const realState: ExampleWalletState = {
        address: '0x123',
        isConnected: true,
        isConnecting: false,
        balance: '123.456',
        error: null,
        connect: () => {},
        disconnect: () => {},
        setBalance: () => {},
        setError: () => {},
      };

      const result = mockedSelector.selector(realState);
      expect(result).toBe('$123.46 USDC');

      // Override return value for specific test scenario
      mockedSelector.setReturnValue('$0.00 USDC (loading...)');
      expect(mockedSelector.selector(realState)).toBe('$0.00 USDC (loading...)');

      // Reset mock
      mockedSelector.reset();
      expect(mockedSelector.selector(realState)).toBe('$123.46 USDC');
    });
  });
});
