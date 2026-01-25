/**
 * Lazy Loading Module for Game Engines
 *
 * This module provides utilities for dynamically importing game engines
 * to reduce initial bundle size and improve load times.
 *
 * Each game engine is loaded on-demand only when the player selects that game.
 *
 * @module games/lazy
 */

import { lazy } from 'react';
import type { GameType } from './types';

// ============================================================================
// Types
// ============================================================================

/**
 * Result of a lazy game engine import
 */
export interface LazyGameResult<T> {
  /** The loaded module */
  module: T;
  /** Time taken to load in ms */
  loadTime: number;
}

/**
 * Status of a lazy-loaded game
 */
export type LazyLoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Cache entry for lazy-loaded games
 */
interface LazyGameCacheEntry {
  status: LazyLoadStatus;
  module: unknown | null;
  error: Error | null;
  loadTime: number | null;
}

// ============================================================================
// Cache
// ============================================================================

/**
 * Cache for loaded game modules to prevent re-fetching
 */
const gameModuleCache = new Map<GameType, LazyGameCacheEntry>();

/**
 * Pending promises to prevent duplicate fetches
 */
const pendingLoads = new Map<GameType, Promise<unknown>>();

// ============================================================================
// Snake Engine Lazy Loading
// ============================================================================

/**
 * Lazy load the Snake game engine and its dependencies
 * @returns Promise resolving to the Snake game module
 */
export async function loadSnakeEngine() {
  const startTime = performance.now();

  // Check cache first
  const cached = gameModuleCache.get('snake');
  if (cached?.status === 'loaded' && cached.module) {
    return {
      module: cached.module as typeof import('./snake/SnakeGame'),
      loadTime: 0,
    };
  }

  // Check if already loading
  const pending = pendingLoads.get('snake');
  if (pending) {
    const module = await pending;
    return {
      module: module as typeof import('./snake/SnakeGame'),
      loadTime: performance.now() - startTime,
    };
  }

  // Start loading
  gameModuleCache.set('snake', {
    status: 'loading',
    module: null,
    error: null,
    loadTime: null,
  });

  const loadPromise = import('./snake/SnakeGame');
  pendingLoads.set('snake', loadPromise);

  try {
    const module = await loadPromise;
    const loadTime = performance.now() - startTime;

    gameModuleCache.set('snake', {
      status: 'loaded',
      module,
      error: null,
      loadTime,
    });

    return { module, loadTime };
  } catch (error) {
    gameModuleCache.set('snake', {
      status: 'error',
      module: null,
      error: error instanceof Error ? error : new Error(String(error)),
      loadTime: null,
    });
    throw error;
  } finally {
    pendingLoads.delete('snake');
  }
}

/**
 * Lazy React component for Snake game
 * Uses React.lazy for Suspense integration
 */
export const LazySnakeGame = lazy(() =>
  import('./snake/SnakeGame').then((module) => ({
    default: module.SnakeGame,
  }))
);

// ============================================================================
// Tetris Engine Lazy Loading
// ============================================================================

/**
 * Lazy load the Tetris game engine and its dependencies
 * @returns Promise resolving to the Tetris game module
 */
export async function loadTetrisEngine() {
  const startTime = performance.now();

  // Check cache first
  const cached = gameModuleCache.get('tetris');
  if (cached?.status === 'loaded' && cached.module) {
    return {
      module: cached.module as typeof import('./tetris'),
      loadTime: 0,
    };
  }

  // Check if already loading
  const pending = pendingLoads.get('tetris');
  if (pending) {
    const module = await pending;
    return {
      module: module as typeof import('./tetris'),
      loadTime: performance.now() - startTime,
    };
  }

  // Start loading
  gameModuleCache.set('tetris', {
    status: 'loading',
    module: null,
    error: null,
    loadTime: null,
  });

  const loadPromise = import('./tetris');
  pendingLoads.set('tetris', loadPromise);

  try {
    const module = await loadPromise;
    const loadTime = performance.now() - startTime;

    gameModuleCache.set('tetris', {
      status: 'loaded',
      module,
      error: null,
      loadTime,
    });

    return { module, loadTime };
  } catch (error) {
    gameModuleCache.set('tetris', {
      status: 'error',
      module: null,
      error: error instanceof Error ? error : new Error(String(error)),
      loadTime: null,
    });
    throw error;
  } finally {
    pendingLoads.delete('tetris');
  }
}

/**
 * Lazy React component for Tetris game (placeholder until TetrisGame component exists)
 */
export const LazyTetrisGame = lazy(() =>
  import('./tetris').then((_module) => ({
    default: (() => {
      // Return a placeholder component until TetrisGame is implemented
      const TetrisPlaceholder: React.FC = () => null;
      TetrisPlaceholder.displayName = 'TetrisPlaceholder';
      return TetrisPlaceholder;
    })(),
  }))
);

// ============================================================================
// Generic Game Loader
// ============================================================================

/**
 * Map of game types to their loader functions
 */
const gameLoaders: Partial<Record<GameType, () => Promise<{ module: unknown; loadTime: number }>>> =
  {
    snake: loadSnakeEngine,
    tetris: loadTetrisEngine,
  };

/**
 * Load a game engine by type
 * @param gameType - The type of game to load
 * @returns Promise resolving to the game module
 */
export async function loadGameEngine(gameType: GameType): Promise<LazyGameResult<unknown>> {
  const loader = gameLoaders[gameType];

  if (!loader) {
    throw new Error(`No loader found for game type: ${gameType}`);
  }

  return loader();
}

/**
 * Preload a game engine in the background
 * Useful for preloading on hover or when user navigates to game selection
 *
 * @param gameType - The type of game to preload
 * @returns Promise that resolves when preloading is complete
 */
export async function preloadGameEngine(gameType: GameType): Promise<void> {
  try {
    await loadGameEngine(gameType);
  } catch {
    // Silently fail preloading - it's not critical
    // eslint-disable-next-line no-console
    console.warn(`Failed to preload game engine: ${gameType}`);
  }
}

/**
 * Preload multiple game engines
 *
 * @param gameTypes - Array of game types to preload
 * @returns Promise that resolves when all preloading is complete
 */
export async function preloadGameEngines(gameTypes: GameType[]): Promise<void> {
  await Promise.allSettled(gameTypes.map((type) => preloadGameEngine(type)));
}

// ============================================================================
// Cache Management
// ============================================================================

/**
 * Get the loading status of a game
 * @param gameType - The type of game to check
 * @returns The current loading status
 */
export function getGameLoadStatus(gameType: GameType): LazyLoadStatus {
  return gameModuleCache.get(gameType)?.status ?? 'idle';
}

/**
 * Get the load time for a loaded game
 * @param gameType - The type of game to check
 * @returns The load time in ms, or null if not loaded
 */
export function getGameLoadTime(gameType: GameType): number | null {
  return gameModuleCache.get(gameType)?.loadTime ?? null;
}

/**
 * Check if a game is currently being loaded
 * @param gameType - The type of game to check
 * @returns True if the game is currently loading
 */
export function isGameLoading(gameType: GameType): boolean {
  return getGameLoadStatus(gameType) === 'loading';
}

/**
 * Check if a game has been loaded
 * @param gameType - The type of game to check
 * @returns True if the game has been loaded
 */
export function isGameLoaded(gameType: GameType): boolean {
  return getGameLoadStatus(gameType) === 'loaded';
}

/**
 * Clear the game module cache (useful for testing or hot reloading)
 */
export function clearGameCache(): void {
  gameModuleCache.clear();
}

/**
 * Get cache statistics for monitoring
 */
export function getGameCacheStats(): {
  cached: GameType[];
  loading: GameType[];
  failed: GameType[];
  totalLoadTime: number;
} {
  const cached: GameType[] = [];
  const loading: GameType[] = [];
  const failed: GameType[] = [];
  let totalLoadTime = 0;

  for (const [type, entry] of gameModuleCache) {
    switch (entry.status) {
      case 'loaded':
        cached.push(type);
        totalLoadTime += entry.loadTime ?? 0;
        break;
      case 'loading':
        loading.push(type);
        break;
      case 'error':
        failed.push(type);
        break;
    }
  }

  return { cached, loading, failed, totalLoadTime };
}

// ============================================================================
// React Hook for Lazy Loading
// ============================================================================

/**
 * Hook state for lazy game loading
 */
export interface UseGameLoaderState {
  status: LazyLoadStatus;
  error: Error | null;
  loadTime: number | null;
  load: () => Promise<void>;
  retry: () => Promise<void>;
}

// ============================================================================
// Exports
// ============================================================================

export { type LazyGameCacheEntry };
