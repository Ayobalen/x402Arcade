/**
 * Lazy Loading Module Tests
 *
 * Tests for the game engine lazy loading system.
 *
 * @module games/__tests__/lazy.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadSnakeEngine,
  loadTetrisEngine,
  loadGameEngine,
  preloadGameEngine,
  preloadGameEngines,
  getGameLoadStatus,
  getGameLoadTime,
  isGameLoading,
  isGameLoaded,
  clearGameCache,
  getGameCacheStats,
} from '../lazy';

// Mock dynamic imports
vi.mock('../snake/SnakeGame', () => ({
  SnakeGame: vi.fn(() => null),
  default: vi.fn(() => null),
}));

vi.mock('../tetris', () => ({
  TETRIS_GAME_ID: 'tetris',
}));

describe('Game Lazy Loading', () => {
  beforeEach(() => {
    clearGameCache();
    vi.clearAllMocks();
  });

  describe('Cache Management', () => {
    it('should start with empty cache', () => {
      const stats = getGameCacheStats();
      expect(stats.cached).toHaveLength(0);
      expect(stats.loading).toHaveLength(0);
      expect(stats.failed).toHaveLength(0);
      expect(stats.totalLoadTime).toBe(0);
    });

    it('should return idle status for uncached games', () => {
      expect(getGameLoadStatus('snake')).toBe('idle');
      expect(getGameLoadStatus('tetris')).toBe('idle');
    });

    it('should return null load time for uncached games', () => {
      expect(getGameLoadTime('snake')).toBeNull();
      expect(getGameLoadTime('tetris')).toBeNull();
    });

    it('should report not loading for uncached games', () => {
      expect(isGameLoading('snake')).toBe(false);
      expect(isGameLoading('tetris')).toBe(false);
    });

    it('should report not loaded for uncached games', () => {
      expect(isGameLoaded('snake')).toBe(false);
      expect(isGameLoaded('tetris')).toBe(false);
    });

    it('should clear all cache entries', async () => {
      await loadSnakeEngine();
      expect(isGameLoaded('snake')).toBe(true);

      clearGameCache();

      expect(isGameLoaded('snake')).toBe(false);
      expect(getGameLoadStatus('snake')).toBe('idle');
    });
  });

  describe('loadSnakeEngine', () => {
    it('should load snake engine module', async () => {
      const result = await loadSnakeEngine();

      expect(result).toHaveProperty('module');
      expect(result).toHaveProperty('loadTime');
      expect(result.loadTime).toBeGreaterThanOrEqual(0);
    });

    it('should cache loaded module', async () => {
      await loadSnakeEngine();

      expect(isGameLoaded('snake')).toBe(true);
      expect(getGameLoadStatus('snake')).toBe('loaded');
    });

    it('should return cached result on second call', async () => {
      const result1 = await loadSnakeEngine();
      const result2 = await loadSnakeEngine();

      expect(result2.module).toBe(result1.module);
      expect(result2.loadTime).toBe(0); // Cached load time is 0
    });

    it('should record load time', async () => {
      await loadSnakeEngine();

      const loadTime = getGameLoadTime('snake');
      expect(loadTime).not.toBeNull();
      expect(loadTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('loadTetrisEngine', () => {
    it('should load tetris engine module', async () => {
      const result = await loadTetrisEngine();

      expect(result).toHaveProperty('module');
      expect(result).toHaveProperty('loadTime');
    });

    it('should cache loaded module', async () => {
      await loadTetrisEngine();

      expect(isGameLoaded('tetris')).toBe(true);
      expect(getGameLoadStatus('tetris')).toBe('loaded');
    });
  });

  describe('loadGameEngine', () => {
    it('should load snake engine by type', async () => {
      const result = await loadGameEngine('snake');

      expect(result).toHaveProperty('module');
      expect(isGameLoaded('snake')).toBe(true);
    });

    it('should load tetris engine by type', async () => {
      const result = await loadGameEngine('tetris');

      expect(result).toHaveProperty('module');
      expect(isGameLoaded('tetris')).toBe(true);
    });

    it('should throw for unknown game type', async () => {
      await expect(loadGameEngine('unknown' as never)).rejects.toThrow(
        'No loader found for game type: unknown'
      );
    });
  });

  describe('preloadGameEngine', () => {
    it('should preload game engine silently', async () => {
      await preloadGameEngine('snake');

      expect(isGameLoaded('snake')).toBe(true);
    });

    it('should not throw on failure', async () => {
      // Trying to load an unsupported game type should not throw
      await expect(preloadGameEngine('invalid' as never)).resolves.not.toThrow();
    });
  });

  describe('preloadGameEngines', () => {
    it('should preload multiple engines', async () => {
      await preloadGameEngines(['snake', 'tetris']);

      expect(isGameLoaded('snake')).toBe(true);
      expect(isGameLoaded('tetris')).toBe(true);
    });

    it('should handle mixed success/failure', async () => {
      await preloadGameEngines(['snake', 'invalid' as never]);

      expect(isGameLoaded('snake')).toBe(true);
    });
  });

  describe('getGameCacheStats', () => {
    it('should track cached games', async () => {
      await loadSnakeEngine();
      await loadTetrisEngine();

      const stats = getGameCacheStats();

      expect(stats.cached).toContain('snake');
      expect(stats.cached).toContain('tetris');
      expect(stats.cached).toHaveLength(2);
    });

    it('should calculate total load time', async () => {
      await loadSnakeEngine();
      await loadTetrisEngine();

      const stats = getGameCacheStats();

      expect(stats.totalLoadTime).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('LazyLoadStatus type', () => {
  it('should have correct status values', () => {
    expect(getGameLoadStatus('snake')).toBe('idle');

    // After loading starts
    const loadPromise = loadSnakeEngine();
    // Note: Due to async nature, we might catch 'loading' or 'loaded'
    expect(['idle', 'loading', 'loaded']).toContain(getGameLoadStatus('snake'));

    // After loading completes
    return loadPromise.then(() => {
      expect(getGameLoadStatus('snake')).toBe('loaded');
    });
  });
});
