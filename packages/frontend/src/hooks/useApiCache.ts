/**
 * useApiCache Hook
 *
 * Provides API response caching with stale-while-revalidate pattern.
 * Uses the Cache API for browser-native caching with expiration support.
 *
 * Features:
 * - Automatic cache expiration
 * - Stale-while-revalidate strategy
 * - Offline fallback to cached data
 * - Cache invalidation utilities
 *
 * @module hooks/useApiCache
 */

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Cache configuration options
 */
export interface CacheOptions {
  /** Cache key (used as cache name) */
  cacheKey: string;
  /** Time-to-live in milliseconds (default: 5 minutes) */
  ttl?: number;
  /** Whether to serve stale data while revalidating (default: true) */
  staleWhileRevalidate?: boolean;
  /** Maximum age for stale data in milliseconds (default: 1 hour) */
  maxStaleAge?: number;
}

/**
 * Cache entry metadata stored alongside cached responses
 */
interface CacheMetadata {
  /** Timestamp when the cache entry was created */
  timestamp: number;
  /** Original URL of the cached request */
  url: string;
}

/**
 * Return type for the useApiCache hook
 */
export interface UseApiCacheReturn<T> {
  /** Cached or fetched data */
  data: T | null;
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Whether data is being revalidated in background */
  isRevalidating: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Whether data came from cache */
  isFromCache: boolean;
  /** Whether data is stale (past TTL) */
  isStale: boolean;
  /** Manually refetch data */
  refetch: () => Promise<void>;
  /** Invalidate the cache for this key */
  invalidate: () => Promise<void>;
}

/**
 * Default cache options
 */
const DEFAULT_OPTIONS: Required<Omit<CacheOptions, 'cacheKey'>> = {
  ttl: 5 * 60 * 1000, // 5 minutes
  staleWhileRevalidate: true,
  maxStaleAge: 60 * 60 * 1000, // 1 hour
};

/**
 * Check if the Cache API is available
 */
const isCacheAvailable = (): boolean => {
  return typeof caches !== 'undefined';
};

/**
 * Get metadata key for a cached URL
 */
const getMetadataKey = (url: string): string => {
  return `__metadata__${url}`;
};

/**
 * Hook for caching API responses with stale-while-revalidate pattern
 *
 * @param url - The API URL to fetch
 * @param options - Cache configuration options
 * @param fetchOptions - Optional fetch configuration
 * @returns Cache state and control functions
 *
 * @example
 * ```tsx
 * const { data, isLoading, isFromCache, refetch } = useApiCache<Leaderboard[]>(
 *   '/api/leaderboard',
 *   { cacheKey: 'leaderboard', ttl: 60000 }
 * );
 * ```
 */
export function useApiCache<T>(
  url: string,
  options: CacheOptions,
  fetchOptions?: RequestInit
): UseApiCacheReturn<T> {
  const { cacheKey, ttl, staleWhileRevalidate, maxStaleAge } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [isStale, setIsStale] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Get cached response with metadata
   */
  const getCachedData = useCallback(async (): Promise<{
    data: T | null;
    isStale: boolean;
    timestamp: number | null;
  }> => {
    if (!isCacheAvailable()) {
      return { data: null, isStale: false, timestamp: null };
    }

    try {
      const cache = await caches.open(cacheKey);
      const cachedResponse = await cache.match(url);

      if (!cachedResponse) {
        return { data: null, isStale: false, timestamp: null };
      }

      // Get metadata
      const metadataResponse = await cache.match(getMetadataKey(url));
      let metadata: CacheMetadata | null = null;

      if (metadataResponse) {
        metadata = await metadataResponse.json();
      }

      const now = Date.now();
      const timestamp = metadata?.timestamp ?? 0;
      const age = now - timestamp;
      const entryIsStale = age > ttl;

      // Check if data is too old (beyond max stale age)
      if (age > maxStaleAge) {
        return { data: null, isStale: true, timestamp };
      }

      const cachedData = await cachedResponse.json();
      return { data: cachedData, isStale: entryIsStale, timestamp };
    } catch {
      return { data: null, isStale: false, timestamp: null };
    }
  }, [cacheKey, url, ttl, maxStaleAge]);

  /**
   * Store response in cache with metadata
   */
  const setCachedData = useCallback(
    async (responseData: T): Promise<void> => {
      if (!isCacheAvailable()) return;

      try {
        const cache = await caches.open(cacheKey);

        // Store the data
        const dataResponse = new Response(JSON.stringify(responseData), {
          headers: {
            'Content-Type': 'application/json',
            'X-Cache-Timestamp': String(Date.now()),
          },
        });
        await cache.put(url, dataResponse);

        // Store metadata
        const metadata: CacheMetadata = {
          timestamp: Date.now(),
          url,
        };
        const metadataResponse = new Response(JSON.stringify(metadata), {
          headers: { 'Content-Type': 'application/json' },
        });
        await cache.put(getMetadataKey(url), metadataResponse);
      } catch {
        // Silently fail - caching is not critical
      }
    },
    [cacheKey, url]
  );

  /**
   * Fetch data from the network
   */
  const fetchFromNetwork = useCallback(async (): Promise<T> => {
    // Cancel any pending request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    const response = await fetch(url, {
      ...fetchOptions,
      signal: abortControllerRef.current.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }, [url, fetchOptions]);

  /**
   * Main fetch function with cache strategy
   */
  const fetchData = useCallback(async (): Promise<void> => {
    setError(null);

    try {
      // First, try to get cached data
      const { data: cachedData, isStale: cacheIsStale } = await getCachedData();

      if (cachedData !== null) {
        setData(cachedData);
        setIsFromCache(true);
        setIsStale(cacheIsStale);
        setIsLoading(false);

        // If stale and staleWhileRevalidate is enabled, fetch in background
        if (cacheIsStale && staleWhileRevalidate) {
          setIsRevalidating(true);
          try {
            const freshData = await fetchFromNetwork();
            setData(freshData);
            setIsFromCache(false);
            setIsStale(false);
            await setCachedData(freshData);
          } catch {
            // Keep stale data if network fails - silent fail is intentional
            // as the user already has cached data to work with
          } finally {
            setIsRevalidating(false);
          }
        }
        return;
      }

      // No cache, fetch from network
      setIsLoading(true);
      const freshData = await fetchFromNetwork();
      setData(freshData);
      setIsFromCache(false);
      setIsStale(false);
      await setCachedData(freshData);
    } catch (fetchError) {
      // If network fails, try to use stale cache as fallback
      const { data: staleData } = await getCachedData();
      if (staleData !== null) {
        setData(staleData);
        setIsFromCache(true);
        setIsStale(true);
      } else {
        setError(fetchError instanceof Error ? fetchError : new Error(String(fetchError)));
      }
    } finally {
      setIsLoading(false);
    }
  }, [getCachedData, fetchFromNetwork, setCachedData, staleWhileRevalidate]);

  /**
   * Invalidate the cache for this key
   */
  const invalidate = useCallback(async (): Promise<void> => {
    if (!isCacheAvailable()) return;

    try {
      const cache = await caches.open(cacheKey);
      await cache.delete(url);
      await cache.delete(getMetadataKey(url));
    } catch {
      // Silently fail
    }
  }, [cacheKey, url]);

  /**
   * Manual refetch
   */
  const refetch = useCallback(async (): Promise<void> => {
    await invalidate();
    await fetchData();
  }, [invalidate, fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchData]);

  return {
    data,
    isLoading,
    isRevalidating,
    error,
    isFromCache,
    isStale,
    refetch,
    invalidate,
  };
}

/**
 * Utility to invalidate all entries in a cache
 */
export async function invalidateCache(cacheKey: string): Promise<void> {
  if (!isCacheAvailable()) return;

  try {
    await caches.delete(cacheKey);
  } catch {
    // Silently fail
  }
}

/**
 * Utility to get cache storage usage
 */
export async function getCacheStorageUsage(): Promise<{
  usage: number;
  quota: number;
  percentage: number;
} | null> {
  if (!navigator.storage?.estimate) return null;

  try {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage ?? 0;
    const quota = estimate.quota ?? 0;
    const percentage = quota > 0 ? (usage / quota) * 100 : 0;

    return { usage, quota, percentage };
  } catch {
    return null;
  }
}

/**
 * Predefined cache keys for the application
 */
export const CACHE_KEYS = {
  /** Leaderboard data - 5 minute TTL */
  LEADERBOARD: 'x402-leaderboard',
  /** Game metadata - 1 hour TTL */
  GAME_METADATA: 'x402-game-metadata',
  /** User profile - 5 minute TTL */
  USER_PROFILE: 'x402-user-profile',
  /** Prize pool data - 1 minute TTL */
  PRIZE_POOL: 'x402-prize-pool',
  /** API responses - general cache */
  API: 'x402-api-cache',
} as const;

/**
 * Predefined TTL values in milliseconds
 */
export const CACHE_TTL = {
  /** 1 minute */
  SHORT: 60 * 1000,
  /** 5 minutes */
  MEDIUM: 5 * 60 * 1000,
  /** 15 minutes */
  LONG: 15 * 60 * 1000,
  /** 1 hour */
  VERY_LONG: 60 * 60 * 1000,
  /** 24 hours */
  DAY: 24 * 60 * 60 * 1000,
} as const;

export default useApiCache;
