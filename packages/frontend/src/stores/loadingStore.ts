/**
 * Loading Store
 *
 * Global loading state management using Zustand.
 * Manages granular loading states for async operations across the application.
 * Tracks loading state per operation with optional metadata.
 *
 * @example
 * ```typescript
 * // Start loading for an operation
 * const { startLoading, stopLoading } = useLoadingStore()
 * startLoading('wallet-connect')
 *
 * // Check if any operation is loading
 * const { isAnyLoading } = useLoadingStore()
 * if (isAnyLoading()) { ... }
 *
 * // Check specific operation
 * const { isLoading } = useLoadingStore()
 * if (isLoading('wallet-connect')) { ... }
 *
 * // Stop loading on completion or error
 * stopLoading('wallet-connect')
 * ```
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

/**
 * Categories of loading operations
 */
export type LoadingCategory =
  | 'wallet' // Wallet connection, signing, switching networks
  | 'payment' // x402 payment processing
  | 'game' // Game session operations
  | 'data' // Data fetching (leaderboards, etc.)
  | 'system'; // System operations

/**
 * Standard operation keys for common async operations
 */
export type StandardOperationKey =
  // Wallet operations
  | 'wallet-connect'
  | 'wallet-disconnect'
  | 'wallet-switch-chain'
  | 'wallet-sign'
  // Payment operations
  | 'payment-authorize'
  | 'payment-settle'
  | 'payment-verify'
  // Game operations
  | 'game-start'
  | 'game-submit-score'
  | 'game-load'
  // Data operations
  | 'data-leaderboard'
  | 'data-prizes'
  | 'data-history';

/**
 * Operation key can be a standard key or a custom string
 */
export type OperationKey = StandardOperationKey | string;

/**
 * Loading entry with metadata
 */
export interface LoadingEntry {
  /** When the loading started */
  startedAt: Date;
  /** Optional message to display */
  message?: string;
  /** Optional category for grouping */
  category?: LoadingCategory;
  /** Optional progress (0-100) for operations with progress tracking */
  progress?: number;
  /** Whether to show a cancellation option */
  cancellable?: boolean;
}

/**
 * Options for starting a loading operation
 */
export interface StartLoadingOptions {
  /** Display message for the loading state */
  message?: string;
  /** Category for grouping related operations */
  category?: LoadingCategory;
  /** Initial progress value (0-100) */
  progress?: number;
  /** Whether the operation can be cancelled */
  cancellable?: boolean;
}

/**
 * Loading store state interface
 */
export interface LoadingState {
  // ---- State ----
  /** Map of operation keys to their loading entries */
  operations: Map<OperationKey, LoadingEntry>;

  /** History of recent completed operations (for debugging) */
  history: Array<{
    key: OperationKey;
    startedAt: Date;
    completedAt: Date;
    durationMs: number;
    success: boolean;
  }>;

  // ---- Actions ----
  /**
   * Start loading for an operation
   * @param key - Unique identifier for the operation
   * @param options - Optional loading options
   */
  startLoading: (key: OperationKey, options?: StartLoadingOptions) => void;

  /**
   * Stop loading for an operation
   * @param key - The operation key to stop
   * @param success - Whether the operation succeeded (for history tracking)
   */
  stopLoading: (key: OperationKey, success?: boolean) => void;

  /**
   * Update progress for a loading operation
   * @param key - The operation key
   * @param progress - Progress value (0-100)
   */
  updateProgress: (key: OperationKey, progress: number) => void;

  /**
   * Update message for a loading operation
   * @param key - The operation key
   * @param message - New message to display
   */
  updateMessage: (key: OperationKey, message: string) => void;

  /**
   * Check if a specific operation is loading
   * @param key - The operation key to check
   * @returns True if the operation is loading
   */
  isLoading: (key: OperationKey) => boolean;

  /**
   * Check if any operation is loading
   * @returns True if any operation is in progress
   */
  isAnyLoading: () => boolean;

  /**
   * Check if any operation in a category is loading
   * @param category - The category to check
   * @returns True if any operation in the category is loading
   */
  isCategoryLoading: (category: LoadingCategory) => boolean;

  /**
   * Get all currently loading operations
   * @returns Array of [key, entry] pairs
   */
  getLoadingOperations: () => Array<[OperationKey, LoadingEntry]>;

  /**
   * Get loading operations by category
   * @param category - The category to filter by
   * @returns Array of [key, entry] pairs for the category
   */
  getLoadingByCategory: (category: LoadingCategory) => Array<[OperationKey, LoadingEntry]>;

  /**
   * Get the loading entry for a specific operation
   * @param key - The operation key
   * @returns The loading entry or undefined
   */
  getLoadingEntry: (key: OperationKey) => LoadingEntry | undefined;

  /**
   * Clear all loading states (use with caution)
   */
  clearAll: () => void;

  /**
   * Clear loading history
   */
  clearHistory: () => void;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Maximum number of entries to keep in history
 */
const MAX_HISTORY_SIZE = 50;

// ============================================================================
// Store Implementation
// ============================================================================

/**
 * Loading store
 *
 * Manages granular loading states for async operations.
 */
export const useLoadingStore = create<LoadingState>()(
  devtools(
    (set, get) => ({
      // ---- Initial State ----
      operations: new Map<OperationKey, LoadingEntry>(),
      history: [],

      // ---- Actions ----
      startLoading: (key, options = {}) => {
        const entry: LoadingEntry = {
          startedAt: new Date(),
          message: options.message,
          category: options.category,
          progress: options.progress,
          cancellable: options.cancellable,
        };

        set(
          (state) => {
            const operations = new Map(state.operations);
            operations.set(key, entry);
            return { operations };
          },
          false,
          `loading/start/${key}`
        );
      },

      stopLoading: (key, success = true) => {
        const entry = get().operations.get(key);

        set(
          (state) => {
            const operations = new Map(state.operations);
            operations.delete(key);

            // Add to history if we had an entry
            let history = state.history;
            if (entry) {
              const completedAt = new Date();
              const historyEntry = {
                key,
                startedAt: entry.startedAt,
                completedAt,
                durationMs: completedAt.getTime() - entry.startedAt.getTime(),
                success,
              };
              history = [historyEntry, ...state.history].slice(0, MAX_HISTORY_SIZE);
            }

            return { operations, history };
          },
          false,
          `loading/stop/${key}`
        );
      },

      updateProgress: (key, progress) => {
        const entry = get().operations.get(key);
        if (!entry) return;

        set(
          (state) => {
            const operations = new Map(state.operations);
            operations.set(key, { ...entry, progress });
            return { operations };
          },
          false,
          `loading/progress/${key}`
        );
      },

      updateMessage: (key, message) => {
        const entry = get().operations.get(key);
        if (!entry) return;

        set(
          (state) => {
            const operations = new Map(state.operations);
            operations.set(key, { ...entry, message });
            return { operations };
          },
          false,
          `loading/message/${key}`
        );
      },

      isLoading: (key) => {
        return get().operations.has(key);
      },

      isAnyLoading: () => {
        return get().operations.size > 0;
      },

      isCategoryLoading: (category) => {
        const operations = get().operations;
        for (const [, entry] of operations) {
          if (entry.category === category) {
            return true;
          }
        }
        return false;
      },

      getLoadingOperations: () => {
        return Array.from(get().operations.entries());
      },

      getLoadingByCategory: (category) => {
        return Array.from(get().operations.entries()).filter(
          ([, entry]) => entry.category === category
        );
      },

      getLoadingEntry: (key) => {
        return get().operations.get(key);
      },

      clearAll: () => {
        set({ operations: new Map() }, false, 'loading/clearAll');
      },

      clearHistory: () => {
        set({ history: [] }, false, 'loading/clearHistory');
      },
    }),
    {
      name: 'loading-store',
    }
  )
);

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Hook to check if a specific operation is loading
 *
 * @param key - The operation key to check
 * @returns True if the operation is loading
 */
export function useIsLoading(key: OperationKey): boolean {
  return useLoadingStore((state) => state.isLoading(key));
}

/**
 * Hook to check if any operation is loading
 *
 * @returns True if any operation is in progress
 */
export function useIsAnyLoading(): boolean {
  return useLoadingStore((state) => state.isAnyLoading());
}

/**
 * Hook to check if any operation in a category is loading
 *
 * @param category - The category to check
 * @returns True if any operation in the category is loading
 */
export function useIsCategoryLoading(category: LoadingCategory): boolean {
  return useLoadingStore((state) => state.isCategoryLoading(category));
}

/**
 * Hook to get the loading entry for a specific operation
 *
 * @param key - The operation key
 * @returns The loading entry or undefined
 */
export function useLoadingEntry(key: OperationKey): LoadingEntry | undefined {
  return useLoadingStore((state) => state.getLoadingEntry(key));
}

/**
 * Hook to get all currently loading operations
 *
 * @returns Array of [key, entry] pairs
 */
export function useLoadingOperations(): Array<[OperationKey, LoadingEntry]> {
  return useLoadingStore((state) => state.getLoadingOperations());
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a loading wrapper for async functions
 *
 * Automatically tracks loading state for an async operation.
 *
 * @param key - The operation key
 * @param fn - The async function to wrap
 * @param options - Optional loading options
 * @returns The wrapped function
 *
 * @example
 * ```typescript
 * const fetchLeaderboard = withLoading(
 *   'data-leaderboard',
 *   async () => {
 *     const response = await fetch('/api/leaderboard')
 *     return response.json()
 *   },
 *   { category: 'data', message: 'Loading leaderboard...' }
 * )
 *
 * // Usage
 * const data = await fetchLeaderboard()
 * ```
 */
export function withLoading<T, Args extends unknown[]>(
  key: OperationKey,
  fn: (...args: Args) => Promise<T>,
  options?: StartLoadingOptions
): (...args: Args) => Promise<T> {
  return async (...args: Args): Promise<T> => {
    const { startLoading, stopLoading } = useLoadingStore.getState();

    startLoading(key, options);

    try {
      const result = await fn(...args);
      stopLoading(key, true);
      return result;
    } catch (error) {
      stopLoading(key, false);
      throw error;
    }
  };
}

/**
 * Get store state outside of React components
 */
export const getLoadingState = () => useLoadingStore.getState();
