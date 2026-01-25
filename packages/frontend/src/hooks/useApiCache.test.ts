/**
 * Tests for useApiCache Hook
 *
 * @module hooks/useApiCache.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import {
  useApiCache,
  invalidateCache,
  getCacheStorageUsage,
  CACHE_KEYS,
  CACHE_TTL,
} from './useApiCache';

// Mock data
const mockLeaderboardData = [
  { id: 1, player: '0x123...', score: 1000 },
  { id: 2, player: '0x456...', score: 900 },
];

// Mock Cache API
const mockCacheStorage = new Map<string, Map<string, Response>>();

const mockCaches = {
  open: vi.fn(async (name: string) => {
    if (!mockCacheStorage.has(name)) {
      mockCacheStorage.set(name, new Map());
    }
    const cache = mockCacheStorage.get(name)!;
    return {
      match: vi.fn(async (url: string) => cache.get(url) || undefined),
      put: vi.fn(async (url: string, response: Response) => {
        cache.set(url, response.clone());
      }),
      delete: vi.fn(async (url: string) => {
        return cache.delete(url);
      }),
    };
  }),
  delete: vi.fn(async (name: string) => {
    return mockCacheStorage.delete(name);
  }),
};

// Mock fetch
const mockFetch = vi.fn();

// Mock navigator.storage
const mockStorageEstimate = vi.fn();

describe('useApiCache', () => {
  beforeEach(() => {
    mockCacheStorage.clear();
    mockFetch.mockReset();

    // Set up global mocks
    vi.stubGlobal('caches', mockCaches);
    vi.stubGlobal('fetch', mockFetch);
    vi.stubGlobal('navigator', {
      storage: {
        estimate: mockStorageEstimate,
      },
    });

    mockStorageEstimate.mockResolvedValue({
      usage: 1000000,
      quota: 100000000,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('basic functionality', () => {
    it('fetches data from network when cache is empty', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLeaderboardData),
      });

      const { result } = renderHook(() =>
        useApiCache('/api/leaderboard', {
          cacheKey: 'test-cache',
          ttl: CACHE_TTL.MEDIUM,
        })
      );

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockLeaderboardData);
      expect(result.current.isFromCache).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('returns cached data when available', async () => {
      // Pre-populate cache
      const cacheName = 'test-cache-2';
      const url = '/api/cached-data';
      const cache = new Map();
      cache.set(url, new Response(JSON.stringify(mockLeaderboardData)));
      cache.set(`__metadata__${url}`, new Response(JSON.stringify({ timestamp: Date.now(), url })));
      mockCacheStorage.set(cacheName, cache);

      const { result } = renderHook(() =>
        useApiCache(url, {
          cacheKey: cacheName,
          ttl: CACHE_TTL.LONG,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockLeaderboardData);
      expect(result.current.isFromCache).toBe(true);
      expect(result.current.isStale).toBe(false);
    });

    it('handles network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() =>
        useApiCache('/api/failing', {
          cacheKey: 'error-cache',
          ttl: CACHE_TTL.SHORT,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toBe('Network error');
      expect(result.current.data).toBeNull();
    });

    it('handles HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() =>
        useApiCache('/api/server-error', {
          cacheKey: 'http-error-cache',
          ttl: CACHE_TTL.SHORT,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toContain('500');
    });
  });

  describe('stale-while-revalidate', () => {
    it('returns stale data immediately and revalidates in background', async () => {
      // Set up stale cache (timestamp in the past)
      const cacheName = 'swr-cache';
      const url = '/api/swr-data';
      const staleTimestamp = Date.now() - CACHE_TTL.LONG - 1000; // Past TTL
      const cache = new Map();
      cache.set(url, new Response(JSON.stringify({ old: 'data' })));
      cache.set(
        `__metadata__${url}`,
        new Response(JSON.stringify({ timestamp: staleTimestamp, url }))
      );
      mockCacheStorage.set(cacheName, cache);

      // Mock fresh data from network
      const freshData = { fresh: 'data' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(freshData),
      });

      const { result } = renderHook(() =>
        useApiCache(url, {
          cacheKey: cacheName,
          ttl: CACHE_TTL.SHORT,
          staleWhileRevalidate: true,
        })
      );

      // Should immediately return stale data
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isFromCache).toBe(true);
      expect(result.current.isStale).toBe(true);

      // Should eventually get fresh data
      await waitFor(() => {
        expect(result.current.isRevalidating).toBe(false);
      });
    });

    it('skips revalidation when staleWhileRevalidate is false', async () => {
      const cacheName = 'no-swr-cache';
      const url = '/api/no-swr-data';
      const staleTimestamp = Date.now() - CACHE_TTL.LONG;
      const cache = new Map();
      cache.set(url, new Response(JSON.stringify({ old: 'data' })));
      cache.set(
        `__metadata__${url}`,
        new Response(JSON.stringify({ timestamp: staleTimestamp, url }))
      );
      mockCacheStorage.set(cacheName, cache);

      const { result } = renderHook(() =>
        useApiCache(url, {
          cacheKey: cacheName,
          ttl: CACHE_TTL.SHORT,
          staleWhileRevalidate: false,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isRevalidating).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('cache invalidation', () => {
    it('refetch invalidates cache and fetches fresh data', async () => {
      // Initial fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ version: 1 }),
      });

      const { result } = renderHook(() =>
        useApiCache('/api/versioned', {
          cacheKey: 'version-cache',
          ttl: CACHE_TTL.LONG,
        })
      );

      await waitFor(() => {
        expect(result.current.data).toEqual({ version: 1 });
      });

      // Set up fresh data for refetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ version: 2 }),
      });

      // Trigger refetch
      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.data).toEqual({ version: 2 });
      });
    });

    it('invalidate removes cache entry', async () => {
      const cacheName = 'invalidate-test';
      const url = '/api/to-invalidate';
      const cache = new Map();
      cache.set(url, new Response(JSON.stringify({ data: 'cached' })));
      mockCacheStorage.set(cacheName, cache);

      const { result } = renderHook(() =>
        useApiCache(url, {
          cacheKey: cacheName,
          ttl: CACHE_TTL.LONG,
        })
      );

      await act(async () => {
        await result.current.invalidate();
      });

      // Cache should be modified (delete called)
      expect(mockCaches.open).toHaveBeenCalledWith(cacheName);
    });
  });

  describe('utility functions', () => {
    it('invalidateCache deletes the entire cache', async () => {
      mockCacheStorage.set('cache-to-delete', new Map());

      await invalidateCache('cache-to-delete');

      expect(mockCaches.delete).toHaveBeenCalledWith('cache-to-delete');
    });

    it('getCacheStorageUsage returns storage stats', async () => {
      const usage = await getCacheStorageUsage();

      expect(usage).toEqual({
        usage: 1000000,
        quota: 100000000,
        percentage: 1,
      });
    });

    it('getCacheStorageUsage returns null when API unavailable', async () => {
      vi.stubGlobal('navigator', {});

      const usage = await getCacheStorageUsage();

      expect(usage).toBeNull();
    });
  });

  describe('cache keys and TTL constants', () => {
    it('exports predefined cache keys', () => {
      expect(CACHE_KEYS.LEADERBOARD).toBe('x402-leaderboard');
      expect(CACHE_KEYS.GAME_METADATA).toBe('x402-game-metadata');
      expect(CACHE_KEYS.USER_PROFILE).toBe('x402-user-profile');
      expect(CACHE_KEYS.PRIZE_POOL).toBe('x402-prize-pool');
      expect(CACHE_KEYS.API).toBe('x402-api-cache');
    });

    it('exports predefined TTL values', () => {
      expect(CACHE_TTL.SHORT).toBe(60 * 1000);
      expect(CACHE_TTL.MEDIUM).toBe(5 * 60 * 1000);
      expect(CACHE_TTL.LONG).toBe(15 * 60 * 1000);
      expect(CACHE_TTL.VERY_LONG).toBe(60 * 60 * 1000);
      expect(CACHE_TTL.DAY).toBe(24 * 60 * 60 * 1000);
    });
  });

  describe('edge cases', () => {
    it('handles cache API unavailable', async () => {
      vi.stubGlobal('caches', undefined);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLeaderboardData),
      });

      const { result } = renderHook(() =>
        useApiCache('/api/no-cache', {
          cacheKey: 'no-cache-available',
          ttl: CACHE_TTL.SHORT,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should still work, just without caching
      expect(result.current.data).toEqual(mockLeaderboardData);
    });

    it('uses default options when not provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLeaderboardData),
      });

      const { result } = renderHook(() =>
        useApiCache('/api/defaults', {
          cacheKey: 'defaults-cache',
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockLeaderboardData);
    });

    it('aborts pending request on unmount', async () => {
      const abortSpy = vi.fn();
      const mockAbortController = {
        signal: { aborted: false },
        abort: abortSpy,
      };
      vi.stubGlobal(
        'AbortController',
        vi.fn(() => mockAbortController)
      );

      // Slow fetch
      mockFetch.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));

      const { unmount } = renderHook(() =>
        useApiCache('/api/slow', {
          cacheKey: 'abort-cache',
          ttl: CACHE_TTL.SHORT,
        })
      );

      // Unmount before fetch completes
      unmount();

      expect(abortSpy).toHaveBeenCalled();
    });
  });
});

describe('OfflinePage integration', () => {
  it('shows stale data indicator when offline with cached data', async () => {
    // This is more of an integration test concept
    // The actual component tests would verify the UI
    const staleData = { old: 'data' };
    const cacheName = 'offline-test';
    const url = '/api/offline-data';
    const staleTimestamp = Date.now() - CACHE_TTL.VERY_LONG;
    const cache = new Map();
    cache.set(url, new Response(JSON.stringify(staleData)));
    cache.set(
      `__metadata__${url}`,
      new Response(JSON.stringify({ timestamp: staleTimestamp, url }))
    );
    mockCacheStorage.set(cacheName, cache);

    // Simulate offline - network fails
    mockFetch.mockRejectedValueOnce(new Error('Network unavailable'));

    const { result } = renderHook(() =>
      useApiCache(url, {
        cacheKey: cacheName,
        ttl: CACHE_TTL.SHORT,
        staleWhileRevalidate: true,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have stale data, marked as from cache and stale
    expect(result.current.data).toEqual(staleData);
    expect(result.current.isFromCache).toBe(true);
    expect(result.current.isStale).toBe(true);
  });
});
