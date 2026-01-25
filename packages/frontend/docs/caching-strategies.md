# Caching Strategies for x402 Arcade

This document describes the caching strategies implemented in x402 Arcade for optimal performance and offline support.

## Overview

The application uses a multi-layer caching strategy:

1. **Service Worker Precaching** - Built assets cached at install time
2. **Runtime Caching** - Dynamic content cached with appropriate strategies
3. **API Response Caching** - React hook for application-level caching
4. **Offline Fallback** - Graceful degradation when network is unavailable

## 1. Static Asset Caching

### Build-Time Asset Hashing

Vite automatically adds content hashes to built assets:

```
dist/
├── js/main-[hash].js
├── chunks/vendor-[hash].js
├── images/logo-[hash].png
└── fonts/inter-[hash].woff2
```

**Cache-Control Headers (Recommended)**

Configure your CDN/server with these headers:

```nginx
# Immutable hashed assets (1 year cache)
location ~* \.(js|css|woff2?)$ {
    add_header Cache-Control "public, max-age=31536000, immutable";
}

# Images with content hash (30 days)
location ~* \.(png|jpg|jpeg|gif|svg|webp|ico)$ {
    add_header Cache-Control "public, max-age=2592000";
}

# HTML files (no cache, or short cache with revalidation)
location ~* \.html$ {
    add_header Cache-Control "no-cache, must-revalidate";
}
```

### Service Worker Precaching

The service worker precaches all built assets during installation:

```typescript
// From vite.config.ts
globPatterns: ['**/*.{js,css,html,ico,svg,png,jpg,jpeg,webp,woff,woff2}'];
```

**Precached Assets:**

- JavaScript bundles
- CSS stylesheets
- Fonts (WOFF2)
- Images
- HTML shell
- Offline fallback page

## 2. Runtime Caching Strategies

### Strategy Overview

| Content Type      | Strategy             | TTL       | Max Entries |
| ----------------- | -------------------- | --------- | ----------- |
| Images            | CacheFirst           | 30 days   | 100         |
| Fonts             | CacheFirst           | 1 year    | 30          |
| Google Fonts CSS  | CacheFirst           | 1 year    | 10          |
| Google Fonts WOFF | CacheFirst           | 1 year    | 30          |
| 3D Assets         | CacheFirst           | 30 days   | 20          |
| API (general)     | StaleWhileRevalidate | 5 minutes | 50          |
| Dynamic data      | NetworkFirst         | 1 minute  | 30          |

### Strategy Explanations

#### CacheFirst

Best for: Static assets that rarely change

1. Check cache first
2. Return cached response if found
3. Fetch from network only if not in cache
4. Update cache with network response

```typescript
{
  urlPattern: /\.(?:png|jpg|jpeg|gif|svg|webp|ico)$/i,
  handler: 'CacheFirst',
  options: {
    cacheName: 'images-cache',
    expiration: {
      maxEntries: 100,
      maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
    },
  },
}
```

#### StaleWhileRevalidate

Best for: Content that can be slightly stale

1. Return cached response immediately (if available)
2. Fetch from network in background
3. Update cache with fresh response
4. Next request gets fresh data

```typescript
{
  urlPattern: /\/api\/.*/i,
  handler: 'StaleWhileRevalidate',
  options: {
    cacheName: 'api-cache',
    expiration: {
      maxEntries: 50,
      maxAgeSeconds: 60 * 5, // 5 minutes
    },
  },
}
```

#### NetworkFirst

Best for: Real-time data that must be fresh

1. Try network first
2. Fall back to cache if network fails
3. Update cache with successful response

```typescript
{
  urlPattern: /\/api\/(leaderboard|prize-pool|game-sessions).*/i,
  handler: 'NetworkFirst',
  options: {
    cacheName: 'dynamic-data-cache',
    networkTimeoutSeconds: 10,
    expiration: {
      maxEntries: 30,
      maxAgeSeconds: 60, // 1 minute
    },
  },
}
```

## 3. API Response Caching Hook

The `useApiCache` hook provides React-level caching with stale-while-revalidate:

### Basic Usage

```tsx
import { useApiCache, CACHE_KEYS, CACHE_TTL } from '@/hooks';

function Leaderboard() {
  const { data, isLoading, isFromCache, isStale, refetch } = useApiCache<LeaderboardEntry[]>(
    '/api/leaderboard',
    {
      cacheKey: CACHE_KEYS.LEADERBOARD,
      ttl: CACHE_TTL.MEDIUM, // 5 minutes
    }
  );

  if (isLoading && !data) {
    return <Loading />;
  }

  return (
    <div>
      {isFromCache && isStale && (
        <Banner>
          Showing cached data. <button onClick={refetch}>Refresh</button>
        </Banner>
      )}
      {data?.map((entry) => (
        <LeaderboardRow key={entry.id} {...entry} />
      ))}
    </div>
  );
}
```

### Cache Configuration

```typescript
// Predefined cache keys
const CACHE_KEYS = {
  LEADERBOARD: 'x402-leaderboard',
  GAME_METADATA: 'x402-game-metadata',
  USER_PROFILE: 'x402-user-profile',
  PRIZE_POOL: 'x402-prize-pool',
  API: 'x402-api-cache',
};

// Predefined TTL values
const CACHE_TTL = {
  SHORT: 60 * 1000, // 1 minute
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 15 * 60 * 1000, // 15 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
  DAY: 24 * 60 * 60 * 1000, // 24 hours
};
```

### Cache Utilities

```typescript
import { invalidateCache, getCacheStorageUsage } from '@/hooks';

// Invalidate entire cache
await invalidateCache(CACHE_KEYS.LEADERBOARD);

// Check storage usage
const usage = await getCacheStorageUsage();
console.log(`Using ${usage.percentage.toFixed(2)}% of quota`);
```

## 4. Offline Fallback Page

When the user is offline and navigates to an uncached route, the service worker serves `/offline.html`.

### Configuration

```typescript
// From vite.config.ts
workbox: {
  navigateFallback: '/offline.html',
  navigateFallbackDenylist: [
    /^\/api\//,  // Don't fallback for API routes
    /\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|css|js)$/i,
  ],
}
```

### Features

The offline page includes:

- Arcade-themed UI matching the app design
- Information about cached content still available
- Retry button to refresh when online
- Auto-reload when connection is restored

### React Offline Page

For in-app offline states, use the `OfflinePage` component:

```tsx
import { OfflinePage } from '@/pages/Offline';

function MyComponent() {
  const { isOffline } = useServiceWorker();

  if (isOffline) {
    return <OfflinePage onRetry={() => window.location.reload()} />;
  }

  return <NormalContent />;
}
```

## 5. Cache Invalidation

### Automatic Invalidation

- **Service Worker Update**: Cleans outdated caches on update
- **TTL Expiration**: Entries removed after max age

### Manual Invalidation

```typescript
// Invalidate specific cache
await invalidateCache(CACHE_KEYS.LEADERBOARD);

// Force refresh in useApiCache
const { refetch } = useApiCache(url, options);
await refetch(); // Invalidates and refetches
```

### On User Action

```typescript
// After score submission
async function submitScore(score: number) {
  await api.submitScore(score);

  // Invalidate leaderboard cache since it's now stale
  await invalidateCache(CACHE_KEYS.LEADERBOARD);
}
```

## 6. Cache Size Management

### Workbox Automatic Cleanup

Each cache has a `maxEntries` limit and `maxAgeSeconds` TTL. Workbox automatically removes:

- Oldest entries when over the limit
- Entries past their TTL

### Storage Quota

Browsers limit storage per origin. Monitor usage:

```typescript
const usage = await getCacheStorageUsage();

if (usage.percentage > 80) {
  // Consider clearing less important caches
  await invalidateCache(CACHE_KEYS.GAME_METADATA);
}
```

## 7. Best Practices

### DO ✅

- Use `CacheFirst` for immutable assets with content hashes
- Use `NetworkFirst` for real-time data like leaderboards
- Set reasonable TTLs based on data freshness requirements
- Show indicators when serving cached/stale data
- Provide manual refresh options for stale data
- Handle offline state gracefully

### DON'T ❌

- Don't cache authentication tokens in service worker
- Don't use `CacheFirst` for frequently changing data
- Don't ignore cache invalidation after mutations
- Don't cache large files without limits
- Don't assume cache is always available

## 8. Debugging

### Chrome DevTools

1. Open DevTools → Application → Cache Storage
2. View cached entries by cache name
3. Delete individual entries or entire caches

### Service Worker

1. Open DevTools → Application → Service Workers
2. View active service worker
3. Force update or unregister

### Logging

Enable Workbox debug logging:

```typescript
// In development only
if (process.env.NODE_ENV === 'development') {
  workbox: {
    mode: 'debug';
  }
}
```

## 9. Testing Offline

### Manual Testing

1. Open DevTools → Network → Offline checkbox
2. Navigate the app
3. Verify offline page appears for uncached routes
4. Verify cached routes still work

### Automated Testing

```typescript
// In Playwright
test('shows offline page when offline', async ({ page, context }) => {
  // Go offline
  await context.setOffline(true);

  // Navigate to uncached route
  await page.goto('/some-new-route');

  // Verify offline page
  await expect(page.getByText("You're Offline")).toBeVisible();
});
```

---

## Summary

The x402 Arcade caching strategy provides:

- **Fast loading**: Precached assets load instantly
- **Fresh data**: NetworkFirst for real-time content
- **Offline support**: Fallback page and cached content
- **React integration**: useApiCache hook for components
- **Automatic cleanup**: TTL and entry limits

For questions or issues, check the service worker logs in DevTools.
