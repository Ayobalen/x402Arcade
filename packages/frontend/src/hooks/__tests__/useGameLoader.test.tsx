/**
 * useGameLoader Hook Tests
 *
 * Tests for the game loader hook with loading states and preloading.
 *
 * @module hooks/__tests__/useGameLoader.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGameLoader, useGamePreload } from '../useGameLoader';
import { clearGameCache } from '@/games/lazy';

// Mock the lazy loading module
vi.mock('@/games/lazy', () => ({
  loadGameEngine: vi.fn().mockResolvedValue({ module: {}, loadTime: 100 }),
  preloadGameEngine: vi.fn().mockResolvedValue(undefined),
  getGameLoadStatus: vi.fn().mockReturnValue('idle'),
  getGameLoadTime: vi.fn().mockReturnValue(null),
  clearGameCache: vi.fn(),
}));

describe('useGameLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock return values
    const { getGameLoadStatus, getGameLoadTime } = vi.mocked(await import('@/games/lazy'));
    getGameLoadStatus.mockReturnValue('idle');
    getGameLoadTime.mockReturnValue(null);
  });

  describe('Initial State', () => {
    it('should start with idle status', () => {
      const { result } = renderHook(() => useGameLoader('snake'));

      expect(result.current.status).toBe('idle');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isLoaded).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should not auto-load by default', () => {
      const { loadGameEngine } = vi.mocked(await import('@/games/lazy'));
      renderHook(() => useGameLoader('snake'));

      expect(loadGameEngine).not.toHaveBeenCalled();
    });

    it('should auto-load when option is set', async () => {
      const { loadGameEngine } = vi.mocked(await import('@/games/lazy'));
      renderHook(() => useGameLoader('snake', { autoLoad: true }));

      await waitFor(() => {
        expect(loadGameEngine).toHaveBeenCalledWith('snake');
      });
    });
  });

  describe('Loading', () => {
    it('should load game on manual trigger', async () => {
      const { loadGameEngine } = vi.mocked(await import('@/games/lazy'));
      const { result } = renderHook(() => useGameLoader('snake'));

      await act(async () => {
        await result.current.load();
      });

      expect(loadGameEngine).toHaveBeenCalledWith('snake');
    });

    it('should update status to loaded on success', async () => {
      const { result } = renderHook(() => useGameLoader('snake'));

      await act(async () => {
        await result.current.load();
      });

      expect(result.current.status).toBe('loaded');
      expect(result.current.isLoaded).toBe(true);
      expect(result.current.loadTime).toBe(100);
    });

    it('should return true on successful load', async () => {
      const { result } = renderHook(() => useGameLoader('snake'));

      let loadResult: boolean | undefined;
      await act(async () => {
        loadResult = await result.current.load();
      });

      expect(loadResult).toBe(true);
    });

    it('should skip loading if already loaded', async () => {
      const { loadGameEngine, getGameLoadStatus } = vi.mocked(await import('@/games/lazy'));
      const { result } = renderHook(() => useGameLoader('snake'));

      await act(async () => {
        await result.current.load();
      });

      getGameLoadStatus.mockReturnValue('loaded');
      loadGameEngine.mockClear();

      await act(async () => {
        await result.current.load();
      });

      // Should only be called once
      expect(loadGameEngine).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle load failure', async () => {
      const { loadGameEngine } = vi.mocked(await import('@/games/lazy'));
      loadGameEngine.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useGameLoader('snake'));

      await act(async () => {
        await result.current.load();
      });

      expect(result.current.status).toBe('error');
      expect(result.current.isError).toBe(true);
      expect(result.current.error?.message).toBe('Network error');
    });

    it('should return false on load failure', async () => {
      const { loadGameEngine } = vi.mocked(await import('@/games/lazy'));
      loadGameEngine.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useGameLoader('snake'));

      let loadResult: boolean | undefined;
      await act(async () => {
        loadResult = await result.current.load();
      });

      expect(loadResult).toBe(false);
    });

    it('should allow retry after error', async () => {
      const { loadGameEngine } = vi.mocked(await import('@/games/lazy'));
      loadGameEngine.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useGameLoader('snake'));

      await act(async () => {
        await result.current.load();
      });

      expect(result.current.isError).toBe(true);

      loadGameEngine.mockResolvedValueOnce({ module: {}, loadTime: 50 });

      await act(async () => {
        await result.current.retry();
      });

      expect(result.current.status).toBe('loaded');
      expect(result.current.isLoaded).toBe(true);
    });
  });

  describe('Callbacks', () => {
    it('should call onLoadStart callback', async () => {
      const onLoadStart = vi.fn();
      const { result } = renderHook(() => useGameLoader('snake', { onLoadStart }));

      await act(async () => {
        await result.current.load();
      });

      expect(onLoadStart).toHaveBeenCalled();
    });

    it('should call onLoadComplete callback with load time', async () => {
      const onLoadComplete = vi.fn();
      const { result } = renderHook(() => useGameLoader('snake', { onLoadComplete }));

      await act(async () => {
        await result.current.load();
      });

      expect(onLoadComplete).toHaveBeenCalledWith(100);
    });

    it('should call onLoadError callback on failure', async () => {
      const { loadGameEngine } = vi.mocked(await import('@/games/lazy'));
      loadGameEngine.mockRejectedValueOnce(new Error('Network error'));

      const onLoadError = vi.fn();
      const { result } = renderHook(() => useGameLoader('snake', { onLoadError }));

      await act(async () => {
        await result.current.load();
      });

      expect(onLoadError).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

describe('useGamePreload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return preload handlers', () => {
    const { result } = renderHook(() => useGamePreload('snake'));

    expect(result.current).toHaveProperty('onMouseEnter');
    expect(result.current).toHaveProperty('onMouseLeave');
    expect(result.current).toHaveProperty('onFocus');
    expect(result.current).toHaveProperty('isPreloading');
    expect(result.current).toHaveProperty('isPreloaded');
  });

  it('should start preloading on mouse enter after delay', async () => {
    const { preloadGameEngine } = vi.mocked(await import('@/games/lazy'));
    const { result } = renderHook(() => useGamePreload('snake', { delay: 150 }));

    act(() => {
      result.current.onMouseEnter();
    });

    // Should not have started yet
    expect(preloadGameEngine).not.toHaveBeenCalled();

    // Advance past delay
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(preloadGameEngine).toHaveBeenCalledWith('snake');
  });

  it('should cancel preload on mouse leave', async () => {
    const { preloadGameEngine } = vi.mocked(await import('@/games/lazy'));
    const { result } = renderHook(() => useGamePreload('snake', { delay: 150 }));

    act(() => {
      result.current.onMouseEnter();
    });

    // Leave before delay completes
    act(() => {
      vi.advanceTimersByTime(100);
      result.current.onMouseLeave();
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(preloadGameEngine).not.toHaveBeenCalled();
  });

  it('should preload on focus', async () => {
    const { preloadGameEngine } = vi.mocked(await import('@/games/lazy'));
    const { result } = renderHook(() => useGamePreload('snake', { delay: 150 }));

    act(() => {
      result.current.onFocus();
    });

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(preloadGameEngine).toHaveBeenCalledWith('snake');
  });

  it('should not preload when disabled', async () => {
    const { preloadGameEngine } = vi.mocked(await import('@/games/lazy'));
    const { result } = renderHook(() => useGamePreload('snake', { enabled: false }));

    act(() => {
      result.current.onMouseEnter();
    });

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(preloadGameEngine).not.toHaveBeenCalled();
  });
});
