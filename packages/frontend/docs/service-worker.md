# Service Worker & PWA Guide

This document covers the Progressive Web App (PWA) implementation for x402Arcade, including service worker registration, caching strategies, and font optimization.

## Overview

x402Arcade uses Workbox (via vite-plugin-pwa) to implement a service worker that:

1. **Precaches static assets** - Built JS, CSS, HTML files
2. **Runtime caches resources** - Fonts, images, API responses
3. **Enables offline mode** - Basic functionality when disconnected
4. **Provides update prompts** - Notify users of new versions

## Caching Strategies

### 1. Cache-First (Static Assets)

Resources that rarely change are cached first, falling back to network.

| Resource Type | Cache Name        | Max Age | Max Entries |
| ------------- | ----------------- | ------- | ----------- |
| Images        | `images-cache`    | 30 days | 100         |
| Fonts         | `fonts-cache`     | 1 year  | 30          |
| Google Fonts  | `google-fonts-*`  | 1 year  | 40          |
| 3D Assets     | `3d-assets-cache` | 30 days | 20          |

**Configuration:**

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

### 2. Stale-While-Revalidate (API Calls)

Returns cached response immediately while fetching fresh data in background.

| Resource Type | Cache Name  | Max Age   | Max Entries |
| ------------- | ----------- | --------- | ----------- |
| API responses | `api-cache` | 5 minutes | 50          |

**Use case:** General API endpoints where slightly stale data is acceptable.

### 3. Network-First (Dynamic Data)

Tries network first, falls back to cache on failure.

| Resource Type | Cache Name           | Timeout | Max Age  |
| ------------- | -------------------- | ------- | -------- |
| Leaderboards  | `dynamic-data-cache` | 10s     | 1 minute |
| Prize Pool    | `dynamic-data-cache` | 10s     | 1 minute |
| Game Sessions | `dynamic-data-cache` | 10s     | 1 minute |

**Use case:** Data that should be as fresh as possible but can fall back to cached version.

## Font Optimization

### Subset Fonts

Google Fonts are served as subsets by default. For custom subsetting:

1. **Identify used characters:**

   ```bash
   # Common characters in x402Arcade
   # Alphanumerics: A-Z, a-z, 0-9
   # Symbols: ., -, $, #, %, @, 0x
   # Special: →, ✓, ✕, ⚡
   ```

2. **Request subset from Google Fonts:**

   ```
   https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap&text=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$%@#.-
   ```

3. **For self-hosted fonts, use pyftsubset:**
   ```bash
   pip install fonttools
   pyftsubset Inter-Regular.woff2 \
     --text="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789" \
     --flavor=woff2 \
     --output-file=Inter-Regular-subset.woff2
   ```

### Font Loading Strategy

1. **Preconnect:** Connect to font servers early
2. **Preload:** Load critical fonts immediately
3. **font-display: swap:** Show fallback text immediately
4. **Cache-first:** Fonts cached for 1 year

## Service Worker Registration

### Using the Hook

```tsx
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { UpdatePrompt, OfflineBanner } from '@/components/pwa';

function App() {
  const { isOffline, needsUpdate, updateServiceWorker, dismissUpdate } = useServiceWorker({
    onNeedRefresh: () => console.log('New version available'),
    onOfflineChange: (offline) => console.log('Offline:', offline),
  });

  return (
    <>
      <OfflineBanner isOffline={isOffline} />
      <UpdatePrompt show={needsUpdate} onUpdate={updateServiceWorker} onDismiss={dismissUpdate} />
      {/* Rest of app */}
    </>
  );
}
```

### Hook Options

| Option            | Type                                       | Description                            |
| ----------------- | ------------------------------------------ | -------------------------------------- |
| `onNeedRefresh`   | `() => void`                               | Called when update available           |
| `onOfflineChange` | `(isOffline: boolean) => void`             | Called on online/offline change        |
| `onError`         | `(error: Error) => void`                   | Called on registration error           |
| `onRegistered`    | `(reg: ServiceWorkerRegistration) => void` | Called on success                      |
| `autoReload`      | `boolean`                                  | Auto-reload on update (default: false) |

### Hook Return Values

| Value                 | Type                       | Description                      |
| --------------------- | -------------------------- | -------------------------------- | ------------------- |
| `isSupported`         | `boolean`                  | Browser supports service workers |
| `isRegistered`        | `boolean`                  | SW is registered                 |
| `isOffline`           | `boolean`                  | App is offline                   |
| `needsUpdate`         | `boolean`                  | Update is available              |
| `needsRefresh`        | `boolean`                  | App needs refresh after update   |
| `registration`        | `ServiceWorkerRegistration | null`                            | Registration object |
| `error`               | `Error                     | null`                            | Registration error  |
| `updateServiceWorker` | `() => Promise<void>`      | Apply update and reload          |
| `checkForUpdates`     | `() => Promise<void>`      | Check for updates manually       |
| `dismissUpdate`       | `() => void`               | Dismiss update notification      |

## PWA Manifest

The app manifest is configured in `vite.config.ts`:

```typescript
manifest: {
  name: 'x402 Arcade',
  short_name: 'x402Arcade',
  description: 'Gasless arcade gaming on Cronos blockchain',
  theme_color: '#0a0a0f',
  background_color: '#0a0a0f',
  display: 'standalone',
  orientation: 'portrait',
  start_url: '/',
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
}
```

### Required Icons

Create these icons in `/public/icons/`:

- `icon-192.png` - 192x192 PNG
- `icon-512.png` - 512x512 PNG (also used as maskable)

## Development

### Testing Service Worker

1. **Enable in dev mode:**

   ```typescript
   // vite.config.ts
   devOptions: {
     enabled: true, // Enable for development
     type: 'module',
   }
   ```

2. **Build and preview:**

   ```bash
   npm run build
   npm run preview
   ```

3. **Check DevTools:**
   - Open Chrome DevTools
   - Go to Application → Service Workers
   - Verify registration and cache

### Debugging Caches

1. **Application → Cache Storage** - View cached resources
2. **Network tab** - Filter by "ServiceWorker" to see cached responses
3. **Console** - Service worker logs appear here

### Force Update

1. **DevTools:** Click "Update" in Service Workers panel
2. **Skip waiting:** Enable "Update on reload"
3. **Clear cache:** Application → Clear storage

## Offline Support

### What Works Offline

- Previously visited pages
- Cached game assets
- Recent leaderboard data (1 minute)
- Images and fonts

### What Requires Network

- Wallet connection
- x402 payments
- Real-time game sessions
- Fresh leaderboard data

### Graceful Degradation

The app detects offline status and:

1. Shows offline banner
2. Disables payment buttons
3. Uses cached data where available
4. Prevents game start (payments require network)

## Performance Metrics

### Goals

| Metric                 | Target         |
| ---------------------- | -------------- |
| First Contentful Paint | < 1.5s         |
| Time to Interactive    | < 3.5s         |
| Cache Hit Rate         | > 80%          |
| Offline Usable         | Basic browsing |

### Measuring

```bash
# Lighthouse audit
npx lighthouse http://localhost:4173 --only-categories=performance,pwa

# Bundle analyzer
npm run build:analyze
```

## Troubleshooting

### Service Worker Not Registering

1. Check HTTPS (required for SW, except localhost)
2. Verify SW file exists at `/sw.js`
3. Check browser console for errors

### Stale Cache Issues

1. Clear site data in DevTools
2. Hard refresh (Ctrl+Shift+R)
3. Unregister SW manually

### Update Not Applying

1. Close all tabs with the app
2. Reopen the app
3. Check for `needsRefresh` state

## Migration Guide

### Adding New Cached Routes

```typescript
// vite.config.ts
runtimeCaching: [
  // Add new route
  {
    urlPattern: /\/api\/new-endpoint/i,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'new-cache',
      networkTimeoutSeconds: 10,
      expiration: {
        maxEntries: 30,
        maxAgeSeconds: 60,
      },
    },
  },
];
```

### Changing Cache Strategy

1. Update `handler` in config
2. Bump cache version (optional)
3. Rebuild and deploy
