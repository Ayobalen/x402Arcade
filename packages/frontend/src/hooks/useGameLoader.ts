/**
 * useGameLoader Hook
 *
 * React hook for lazy loading game engines with loading states,
 * error handling, and automatic preloading on hover.
 *
 * @module hooks/useGameLoader
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { GameType } from '@/games/types';
import {
  loadGameEngine,
  preloadGameEngine,
  getGameLoadStatus,
  getGameLoadTime,
  type LazyLoadStatus,
} from '@/games/lazy';

// ============================================================================
// Types
// ============================================================================

/**
 * State returned by useGameLoader hook
 */
export interface UseGameLoaderState {
  /** Current loading status */
  status: LazyLoadStatus;
  /** Whether the game is currently loading */
  isLoading: boolean;
  /** Whether the game has been loaded successfully */
  isLoaded: boolean;
  /** Whether there was an error loading the game */
  isError: boolean;
  /** Error object if loading failed */
  error: Error | null;
  /** Time taken to load in milliseconds */
  loadTime: number | null;
  /** Function to trigger loading */
  load: () => Promise<boolean>;
  /** Function to retry loading after an error */
  retry: () => Promise<boolean>;
}

/**
 * Options for useGameLoader hook
 */
export interface UseGameLoaderOptions {
  /** Whether to automatically load the game on mount */
  autoLoad?: boolean;
  /** Callback when loading starts */
  onLoadStart?: () => void;
  /** Callback when loading completes successfully */
  onLoadComplete?: (loadTime: number) => void;
  /** Callback when loading fails */
  onLoadError?: (error: Error) => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for lazy loading game engines with full lifecycle management
 *
 * @param gameType - The type of game to load
 * @param options - Configuration options
 * @returns Loading state and control functions
 *
 * @example
 * ```tsx
 * function GamePage({ gameId }) {
 *   const { isLoading, isLoaded, isError, error, load, retry } = useGameLoader(gameId, {
 *     autoLoad: true,
 *     onLoadComplete: (time) => console.log(`Loaded in ${time}ms`),
 *   });
 *
 *   if (isLoading) return <GameLoadingState />;
 *   if (isError) return <GameErrorState error={error} onRetry={retry} />;
 *   if (isLoaded) return <GameComponent />;
 *   return null;
 * }
 * ```
 */
export function useGameLoader(
  gameType: GameType,
  options: UseGameLoaderOptions = {}
): UseGameLoaderState {
  const { autoLoad = false, onLoadStart, onLoadComplete, onLoadError } = options;

  // Track mounted state to prevent updates after unmount
  const isMountedRef = useRef(true);

  // Initialize state from cache
  const [status, setStatus] = useState<LazyLoadStatus>(() => getGameLoadStatus(gameType));
  const [error, setError] = useState<Error | null>(null);
  const [loadTime, setLoadTime] = useState<number | null>(() => getGameLoadTime(gameType));

  // Derived states
  const isLoading = status === 'loading';
  const isLoaded = status === 'loaded';
  const isError = status === 'error';

  /**
   * Load the game engine
   */
  const load = useCallback(async (): Promise<boolean> => {
    // Skip if already loaded or loading
    if (status === 'loaded') return true;
    if (status === 'loading') return false;

    try {
      if (isMountedRef.current) {
        setStatus('loading');
        setError(null);
      }
      onLoadStart?.();

      const result = await loadGameEngine(gameType);

      if (isMountedRef.current) {
        setStatus('loaded');
        setLoadTime(result.loadTime);
      }
      onLoadComplete?.(result.loadTime);

      return true;
    } catch (err) {
      const loadError = err instanceof Error ? err : new Error(String(err));

      if (isMountedRef.current) {
        setStatus('error');
        setError(loadError);
      }
      onLoadError?.(loadError);

      return false;
    }
  }, [gameType, status, onLoadStart, onLoadComplete, onLoadError]);

  /**
   * Retry loading after an error
   */
  const retry = useCallback(async (): Promise<boolean> => {
    if (isMountedRef.current) {
      setStatus('idle');
      setError(null);
    }
    return load();
  }, [load]);

  // Handle auto-loading
  useEffect(() => {
    if (autoLoad && status === 'idle') {
      load();
    }
  }, [autoLoad, status, load]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Sync with external cache changes
  useEffect(() => {
    const cachedStatus = getGameLoadStatus(gameType);
    const cachedLoadTime = getGameLoadTime(gameType);

    if (cachedStatus !== status) {
      setStatus(cachedStatus);
    }
    if (cachedLoadTime !== loadTime && cachedLoadTime !== null) {
      setLoadTime(cachedLoadTime);
    }
  }, [gameType, status, loadTime]);

  return {
    status,
    isLoading,
    isLoaded,
    isError,
    error,
    loadTime,
    load,
    retry,
  };
}

// ============================================================================
// Preload Hook
// ============================================================================

/**
 * Options for useGamePreload hook
 */
export interface UseGamePreloadOptions {
  /** Delay before starting preload (ms) */
  delay?: number;
  /** Whether preloading is enabled */
  enabled?: boolean;
}

/**
 * Hook for preloading game engines on hover
 *
 * @param gameType - The type of game to preload
 * @param options - Configuration options
 * @returns Event handlers for preloading
 *
 * @example
 * ```tsx
 * function GameCard({ gameId }) {
 *   const { onMouseEnter, onFocus } = useGamePreload(gameId);
 *
 *   return (
 *     <div onMouseEnter={onMouseEnter} onFocus={onFocus}>
 *       Game Card
 *     </div>
 *   );
 * }
 * ```
 */
export function useGamePreload(
  gameType: GameType,
  options: UseGamePreloadOptions = {}
): {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onFocus: () => void;
  isPreloading: boolean;
  isPreloaded: boolean;
} {
  const { delay = 150, enabled = true } = options;

  const [isPreloading, setIsPreloading] = useState(false);
  const [isPreloaded, setIsPreloaded] = useState(() => getGameLoadStatus(gameType) === 'loaded');
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const isMountedRef = useRef(true);

  const startPreload = useCallback(async () => {
    if (!enabled || isPreloaded || isPreloading) return;

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Start preloading after delay
    timeoutRef.current = setTimeout(async () => {
      if (!isMountedRef.current) return;

      setIsPreloading(true);

      await preloadGameEngine(gameType);

      if (isMountedRef.current) {
        setIsPreloading(false);
        setIsPreloaded(getGameLoadStatus(gameType) === 'loaded');
      }
    }, delay);
  }, [gameType, delay, enabled, isPreloaded, isPreloading]);

  const cancelPreload = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    onMouseEnter: startPreload,
    onMouseLeave: cancelPreload,
    onFocus: startPreload,
    isPreloading,
    isPreloaded,
  };
}

// ============================================================================
// Exports
// ============================================================================

export { useGameLoader as default };
