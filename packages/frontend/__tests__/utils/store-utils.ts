/**
 * Zustand Store Test Utilities
 *
 * Comprehensive utilities for testing Zustand stores with controlled initial state,
 * isolated selector testing, state snapshots, and cleanup.
 */

import { create, type StateCreator, type StoreApi, type UseBoundStore } from 'zustand';
import { vi, type Mock } from 'vitest';

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration options for creating a test store
 */
export interface CreateTestStoreOptions<T> {
  /** Initial state to use instead of defaults */
  initialState?: Partial<T>;
  /** Whether to enable middleware (default: false for testing) */
  enableMiddleware?: boolean;
  /** Custom name for store debugging */
  name?: string;
}

/**
 * Options for state snapshot comparison
 */
export interface SnapshotOptions {
  /** Properties to exclude from snapshot comparison */
  exclude?: string[];
  /** Properties to include in snapshot (all others excluded) */
  include?: string[];
  /** Whether to deeply clone the state */
  deep?: boolean;
}

/**
 * Extended store type with testing utilities
 */
export interface TestStore<T> extends UseBoundStore<StoreApi<T>> {
  /** Reset store to initial state */
  reset: () => void;
  /** Get store name for debugging */
  getName: () => string;
  /** Get original initial state */
  getInitialState: () => T;
  /** Internal reference to underlying store */
  _store: StoreApi<T>;
}

/**
 * Selector mock with call tracking
 */
export interface MockedSelector<T, R> {
  /** The mocked selector function */
  selector: Mock<[T], R>;
  /** Get call count */
  getCallCount: () => number;
  /** Get all call arguments */
  getCalls: () => T[];
  /** Get most recent call argument */
  getLastCall: () => T | undefined;
  /** Reset mock state */
  reset: () => void;
  /** Set return value */
  setReturnValue: (value: R) => void;
}

/**
 * Store registry entry for tracking stores
 */
interface StoreRegistryEntry<T = unknown> {
  store: TestStore<T>;
  initialState: T;
  name: string;
}

// ============================================================================
// Store Registry (for cleanup)
// ============================================================================

/** Global registry of test stores for cleanup */
const storeRegistry = new Map<string, StoreRegistryEntry>();

/** Counter for generating unique store IDs */
let storeIdCounter = 0;

/**
 * Generate a unique store ID
 */
function generateStoreId(name?: string): string {
  storeIdCounter++;
  return name || `test-store-${storeIdCounter}`;
}

// ============================================================================
// Core Store Creation
// ============================================================================

/**
 * Create a fresh Zustand store instance for testing.
 * Each call returns a new isolated store that can be reset.
 *
 * @example
 * ```typescript
 * // Simple store
 * const useStore = createTestStore<WalletState>(
 *   (set) => ({
 *     address: null,
 *     isConnected: false,
 *     connect: (address) => set({ address, isConnected: true }),
 *     disconnect: () => set({ address: null, isConnected: false }),
 *   })
 * );
 *
 * // Use in tests
 * const { address } = useStore.getState();
 * useStore.getState().connect('0x123');
 * useStore.reset(); // Back to initial state
 * ```
 *
 * @param initializer - Zustand store initializer function
 * @param options - Configuration options
 * @returns Test store with additional utilities
 */
export function createTestStore<T>(
  initializer: StateCreator<T, [], []>,
  options: CreateTestStoreOptions<T> = {}
): TestStore<T> {
  const { initialState: overrides, name } = options;
  const storeId = generateStoreId(name);

  // Create the base store
  const store = create<T>(initializer);

  // Capture initial state (with any overrides applied)
  let capturedInitialState: T;

  if (overrides) {
    // Apply overrides to initial state
    store.setState(overrides as Partial<T>);
    capturedInitialState = { ...store.getState() };
  } else {
    capturedInitialState = { ...store.getState() };
  }

  // Create the test store wrapper
  const testStore = store as TestStore<T>;

  // Add reset method
  testStore.reset = () => {
    store.setState(capturedInitialState, true);
  };

  // Add getName method
  testStore.getName = () => storeId;

  // Add getInitialState method
  testStore.getInitialState = () => ({ ...capturedInitialState });

  // Add internal reference
  testStore._store = store;

  // Register for cleanup
  storeRegistry.set(storeId, {
    store: testStore as TestStore<unknown>,
    initialState: capturedInitialState as unknown,
    name: storeId,
  });

  return testStore;
}

/**
 * Create a test store with pre-defined initial state.
 * Useful when you want to control state without modifying store logic.
 *
 * @example
 * ```typescript
 * const useStore = withInitialState(createWalletStore, {
 *   address: '0xTestAddress',
 *   isConnected: true,
 *   balance: '100',
 * });
 * ```
 *
 * @param storeCreator - Function that creates the store
 * @param initialState - State to apply after creation
 * @returns Store with initial state applied
 */
export function withInitialState<T>(
  storeCreator: () => UseBoundStore<StoreApi<T>>,
  initialState: Partial<T>
): TestStore<T> {
  const store = storeCreator();

  // Apply initial state
  store.setState(initialState);

  // Capture the combined initial state
  const capturedInitialState = { ...store.getState() };

  // Convert to TestStore
  const testStore = store as TestStore<T>;

  testStore.reset = () => {
    store.setState(capturedInitialState, true);
  };

  testStore.getName = () => 'wrapped-store';
  testStore.getInitialState = () => ({ ...capturedInitialState });
  testStore._store = store as unknown as StoreApi<T>;

  return testStore;
}

// ============================================================================
// Selector Testing
// ============================================================================

/**
 * Create a mock selector for isolated testing.
 * Tracks calls and allows controlled return values.
 *
 * @example
 * ```typescript
 * const mockSelector = mockSelector<WalletState, string | null>(
 *   (state) => state.address
 * );
 *
 * // Use in tests
 * mockSelector.setReturnValue('0xMockAddress');
 * const result = mockSelector.selector(walletState);
 *
 * // Assert on calls
 * expect(mockSelector.getCallCount()).toBe(1);
 * expect(mockSelector.getLastCall()).toEqual(walletState);
 * ```
 *
 * @param selector - Original selector to mock
 * @returns Mocked selector with tracking utilities
 */
export function mockSelector<T, R>(
  selector: (state: T) => R
): MockedSelector<T, R> {
  let customReturnValue: R | undefined;
  let useCustomReturn = false;

  const mock = vi.fn((state: T): R => {
    if (useCustomReturn && customReturnValue !== undefined) {
      return customReturnValue;
    }
    return selector(state);
  });

  return {
    selector: mock,

    getCallCount: () => mock.mock.calls.length,

    getCalls: () => mock.mock.calls.map((call) => call[0]),

    getLastCall: () => {
      const calls = mock.mock.calls;
      return calls.length > 0 ? calls[calls.length - 1][0] : undefined;
    },

    reset: () => {
      mock.mockClear();
      useCustomReturn = false;
      customReturnValue = undefined;
    },

    setReturnValue: (value: R) => {
      customReturnValue = value;
      useCustomReturn = true;
    },
  };
}

/**
 * Create a selector that tracks re-render counts.
 * Useful for testing selector memoization and optimization.
 *
 * @example
 * ```typescript
 * const { selector, getRenderCount, reset } = createTrackedSelector(
 *   (state: WalletState) => state.balance
 * );
 *
 * // Use selector in component
 * const balance = useWalletStore(selector);
 *
 * // Assert on render counts
 * expect(getRenderCount()).toBeLessThan(5);
 * ```
 *
 * @param originalSelector - Selector function to track
 * @returns Tracked selector with render count utilities
 */
export function createTrackedSelector<T, R>(
  originalSelector: (state: T) => R
): {
  selector: (state: T) => R;
  getRenderCount: () => number;
  reset: () => void;
} {
  let renderCount = 0;

  const selector = (state: T): R => {
    renderCount++;
    return originalSelector(state);
  };

  return {
    selector,
    getRenderCount: () => renderCount,
    reset: () => {
      renderCount = 0;
    },
  };
}

// ============================================================================
// State Snapshots
// ============================================================================

/**
 * Take a snapshot of store state for assertions.
 * Supports filtering to include/exclude specific properties.
 *
 * @example
 * ```typescript
 * // Full snapshot
 * const snapshot = storeSnapshot(useWalletStore);
 * expect(snapshot).toMatchObject({ isConnected: true });
 *
 * // Partial snapshot (exclude functions)
 * const dataOnly = storeSnapshot(useWalletStore, {
 *   exclude: ['connect', 'disconnect']
 * });
 *
 * // Include only specific fields
 * const balanceOnly = storeSnapshot(useWalletStore, {
 *   include: ['balance', 'address']
 * });
 * ```
 *
 * @param store - Zustand store to snapshot
 * @param options - Snapshot configuration
 * @returns Snapshot of store state
 */
export function storeSnapshot<T extends object>(
  store: UseBoundStore<StoreApi<T>> | StoreApi<T>,
  options: SnapshotOptions = {}
): Partial<T> {
  const { exclude = [], include, deep = true } = options;

  // Get current state
  const state = 'getState' in store && typeof store.getState === 'function'
    ? store.getState()
    : (store as StoreApi<T>).getState();

  // Deep clone if requested
  const clonedState = deep ? deepClone(state) : { ...state };

  // Filter based on options
  const result: Partial<T> = {};

  for (const key of Object.keys(clonedState) as Array<keyof T>) {
    const keyStr = String(key);

    // Skip if in exclude list
    if (exclude.includes(keyStr)) {
      continue;
    }

    // Skip if include list exists and key not in it
    if (include && !include.includes(keyStr)) {
      continue;
    }

    // Skip functions by default (common pattern for Zustand actions)
    if (typeof clonedState[key] === 'function') {
      continue;
    }

    result[key] = clonedState[key];
  }

  return result;
}

/**
 * Compare two store snapshots for equality.
 *
 * @example
 * ```typescript
 * const before = storeSnapshot(useStore);
 * performAction();
 * const after = storeSnapshot(useStore);
 *
 * if (!compareSnapshots(before, after)) {
 *   console.log('State changed!');
 * }
 * ```
 *
 * @param snapshot1 - First snapshot
 * @param snapshot2 - Second snapshot
 * @returns True if snapshots are deeply equal
 */
export function compareSnapshots<T extends object>(
  snapshot1: Partial<T>,
  snapshot2: Partial<T>
): boolean {
  return JSON.stringify(snapshot1) === JSON.stringify(snapshot2);
}

/**
 * Deep clone utility for state snapshots.
 */
function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(deepClone) as unknown as T;
  }

  const cloned = {} as T;
  for (const key of Object.keys(obj) as Array<keyof T>) {
    const value = obj[key];
    // Skip functions
    if (typeof value === 'function') {
      cloned[key] = value;
    } else {
      cloned[key] = deepClone(value);
    }
  }

  return cloned;
}

// ============================================================================
// State History Tracking
// ============================================================================

/**
 * Create a store wrapper that tracks state history for testing.
 * Uses Zustand's subscribe to reliably capture all state changes.
 *
 * @example
 * ```typescript
 * const { store, getHistory, clearHistory } = createHistoryTrackedStore(
 *   createWalletStore
 * );
 *
 * // Perform actions
 * store.getState().connect('0x123');
 * store.getState().disconnect();
 *
 * // Assert on history
 * const history = getHistory();
 * expect(history).toHaveLength(3); // initial + 2 changes
 * expect(history[1].address).toBe('0x123');
 * ```
 *
 * @param storeCreator - Function that creates the store
 * @returns Store with history tracking
 */
export function createHistoryTrackedStore<T>(
  storeCreator: StateCreator<T, [], []>
): {
  store: TestStore<T>;
  getHistory: () => T[];
  clearHistory: () => void;
  getHistoryLength: () => number;
  unsubscribe: () => void;
} {
  const history: T[] = [];

  // Create the store
  const store = createTestStore<T>(storeCreator);

  // Record initial state
  history.push({ ...store.getState() });

  // Subscribe to state changes to track history
  const unsubscribe = store.subscribe((state) => {
    history.push({ ...state });
  });

  return {
    store,
    getHistory: () => [...history],
    clearHistory: () => {
      history.length = 0;
      history.push({ ...store.getState() });
    },
    getHistoryLength: () => history.length,
    unsubscribe,
  };
}

// ============================================================================
// Cleanup Utilities
// ============================================================================

/**
 * Reset all registered test stores to their initial state.
 * Call this in afterEach to ensure clean test isolation.
 *
 * @example
 * ```typescript
 * afterEach(() => {
 *   resetAllStores();
 * });
 * ```
 */
export function resetAllStores(): void {
  for (const [, entry] of storeRegistry) {
    entry.store.reset();
  }
}

/**
 * Clear all registered stores from the registry.
 * Call this in afterAll if needed.
 */
export function clearStoreRegistry(): void {
  storeRegistry.clear();
  storeIdCounter = 0;
}

/**
 * Get count of registered stores (for debugging).
 */
export function getRegisteredStoreCount(): number {
  return storeRegistry.size;
}

/**
 * Get names of all registered stores (for debugging).
 */
export function getRegisteredStoreNames(): string[] {
  return Array.from(storeRegistry.keys());
}

// ============================================================================
// Testing Pattern Utilities
// ============================================================================

/**
 * Create a store action spy that tracks when actions are called.
 *
 * @example
 * ```typescript
 * const spy = createActionSpy(useWalletStore, 'connect');
 *
 * // Trigger action
 * useWalletStore.getState().connect('0x123');
 *
 * // Assert
 * expect(spy.wasCalled()).toBe(true);
 * expect(spy.getCallArgs()).toEqual([['0x123']]);
 * ```
 *
 * @param store - Store containing the action
 * @param actionName - Name of action to spy on
 * @returns Spy utilities
 */
export function createActionSpy<T extends object, K extends keyof T>(
  store: UseBoundStore<StoreApi<T>> | TestStore<T>,
  actionName: K
): {
  wasCalled: () => boolean;
  getCallCount: () => number;
  getCallArgs: () => unknown[][];
  restore: () => void;
} {
  const state = store.getState();
  const originalAction = state[actionName];

  if (typeof originalAction !== 'function') {
    throw new Error(`${String(actionName)} is not a function`);
  }

  const calls: unknown[][] = [];

  // Create spied action
  const spiedAction = ((...args: unknown[]) => {
    calls.push(args);
    return (originalAction as (...args: unknown[]) => unknown)(...args);
  }) as T[K];

  // Replace action in store
  store.setState({ [actionName]: spiedAction } as Partial<T>);

  return {
    wasCalled: () => calls.length > 0,
    getCallCount: () => calls.length,
    getCallArgs: () => [...calls],
    restore: () => {
      store.setState({ [actionName]: originalAction } as Partial<T>);
    },
  };
}

/**
 * Wait for store state to match a condition.
 *
 * @example
 * ```typescript
 * // Trigger async action
 * useWalletStore.getState().connectAsync();
 *
 * // Wait for connection
 * await waitForStoreState(
 *   useWalletStore,
 *   (state) => state.isConnected === true
 * );
 *
 * expect(useWalletStore.getState().address).toBeDefined();
 * ```
 *
 * @param store - Store to watch
 * @param predicate - Condition to wait for
 * @param options - Timeout configuration
 * @returns Promise that resolves when condition is met
 */
export async function waitForStoreState<T>(
  store: UseBoundStore<StoreApi<T>> | StoreApi<T>,
  predicate: (state: T) => boolean,
  options: { timeout?: number; interval?: number } = {}
): Promise<T> {
  const { timeout = 5000, interval = 50 } = options;
  const startTime = Date.now();

  const getState = () => {
    if ('getState' in store && typeof store.getState === 'function') {
      return store.getState();
    }
    return (store as StoreApi<T>).getState();
  };

  return new Promise((resolve, reject) => {
    const check = () => {
      const state = getState();

      if (predicate(state)) {
        resolve(state);
        return;
      }

      if (Date.now() - startTime >= timeout) {
        reject(new Error(`Timed out waiting for store state condition after ${timeout}ms`));
        return;
      }

      setTimeout(check, interval);
    };

    check();
  });
}

// ============================================================================
// Example Store Types for Testing Documentation
// ============================================================================

/**
 * Example wallet store state type.
 * Used for documentation and testing examples.
 */
export interface ExampleWalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  balance: string;
  error: string | null;
  connect: (address: string) => void;
  disconnect: () => void;
  setBalance: (balance: string) => void;
  setError: (error: string | null) => void;
}

/**
 * Create an example wallet store for testing.
 * Demonstrates the store test utilities.
 */
export function createExampleWalletStore(): TestStore<ExampleWalletState> {
  return createTestStore<ExampleWalletState>((set) => ({
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
  }));
}

/**
 * Example game store state type.
 */
export interface ExampleGameState {
  score: number;
  level: number;
  isPlaying: boolean;
  isPaused: boolean;
  incrementScore: (points: number) => void;
  nextLevel: () => void;
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => void;
  reset: () => void;
}

/**
 * Create an example game store for testing.
 */
export function createExampleGameStore(): TestStore<ExampleGameState> {
  return createTestStore<ExampleGameState>((set) => ({
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
  }));
}
