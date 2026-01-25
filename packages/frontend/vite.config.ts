import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// Bundle analyzer - only import in analyze mode
const getAnalyzerPlugin = async (): Promise<PluginOption | null> => {
  if (process.env.ANALYZE === 'true') {
    const { visualizer } = await import('rollup-plugin-visualizer');
    return visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap', // 'sunburst' | 'treemap' | 'network'
    }) as PluginOption;
  }
  return null;
};

// PWA configuration with Workbox caching strategies
const pwaPlugin = VitePWA({
  // Service Worker strategy
  strategies: 'generateSW',
  registerType: 'prompt', // Prompt user to update

  // Workbox runtime caching configuration
  workbox: {
    // Files to precache (built assets)
    globPatterns: ['**/*.{js,css,html,ico,svg,png,jpg,jpeg,webp,woff,woff2}'],

    // Navigate fallback for offline - serves offline.html for navigation requests
    navigateFallback: '/offline.html',
    // Only fallback for same-origin navigation requests
    navigateFallbackDenylist: [
      // Don't fallback for API routes
      /^\/api\//,
      // Don't fallback for static assets
      /\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|css|js)$/i,
    ],

    // Runtime caching rules
    runtimeCaching: [
      // Cache-first for static assets (images, fonts, icons)
      {
        urlPattern: /\.(?:png|jpg|jpeg|gif|svg|webp|ico)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // Cache-first for fonts
      {
        urlPattern: /\.(?:woff|woff2|ttf|eot|otf)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'fonts-cache',
          expiration: {
            maxEntries: 30,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // Cache-first for Google Fonts stylesheets
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-stylesheets',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // Cache-first for Google Fonts webfonts
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-webfonts',
          expiration: {
            maxEntries: 30,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // Stale-while-revalidate for API calls
      {
        urlPattern: /\/api\/.*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'api-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 5, // 5 minutes
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // Network-first for dynamic game data
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
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // Cache-first for 3D assets (models, textures)
      {
        urlPattern: /\.(?:gltf|glb|bin|ktx2)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: '3d-assets-cache',
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
    ],

    // Skip waiting for updates
    skipWaiting: false, // Let user control when to update
    clientsClaim: true,

    // Clean up old caches
    cleanupOutdatedCaches: true,
  },

  // Include assets for precaching (offline.html is critical for offline fallback)
  includeAssets: ['favicon.ico', 'vite.svg', 'robots.txt', 'offline.html'],

  // PWA Manifest
  manifest: {
    name: 'x402 Arcade',
    short_name: 'x402Arcade',
    description: 'Gasless arcade gaming on Cronos blockchain using x402 protocol',
    theme_color: '#0a0a0f',
    background_color: '#0a0a0f',
    display: 'standalone',
    orientation: 'portrait',
    scope: '/',
    start_url: '/',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    categories: ['games', 'entertainment'],
    screenshots: [],
    related_applications: [],
  },

  // Dev options (disable in dev by default)
  devOptions: {
    enabled: false,
    type: 'module',
    navigateFallback: 'index.html',
  },
});

// https://vitejs.dev/config/
export default defineConfig(async () => {
  const analyzerPlugin = await getAnalyzerPlugin();
  const plugins: PluginOption[] = [react(), pwaPlugin];
  if (analyzerPlugin) plugins.push(analyzerPlugin);

  return {
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      host: true,
    },
    // Asset handling configuration
    build: {
      // Inline assets smaller than 4KB as base64
      assetsInlineLimit: 4096,
      // Output directory for assets
      assetsDir: 'assets',
      // Code splitting configuration
      rollupOptions: {
        output: {
          // Manual chunk splitting for better caching
          manualChunks: (id) => {
            // React core - rarely changes, good for long-term caching
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
              return 'react-vendor';
            }
            // React Router - separate from core React
            if (id.includes('node_modules/react-router')) {
              return 'router';
            }
            // Three.js - large library, load separately
            if (id.includes('node_modules/three') || id.includes('node_modules/@react-three')) {
              return 'three-vendor';
            }
            // Animation libraries
            if (id.includes('node_modules/framer-motion')) {
              return 'animation';
            }
            // Utility libraries
            if (
              id.includes('node_modules/zustand') ||
              id.includes('node_modules/viem') ||
              id.includes('node_modules/clsx') ||
              id.includes('node_modules/tailwind-merge')
            ) {
              return 'utils';
            }
            // Game engines - each game in its own chunk for lazy loading
            if (id.includes('/games/snake/')) {
              return 'games/snake';
            }
            if (id.includes('/games/tetris/')) {
              return 'games/tetris';
            }
            // Game engine core - shared between games
            if (id.includes('/games/engine/')) {
              return 'games/engine';
            }
            // Return undefined for default chunking
            return undefined;
          },
          // Chunk file naming pattern for better debugging
          chunkFileNames: (chunkInfo) => {
            // Pages get their own named chunks
            if (chunkInfo.facadeModuleId?.includes('/pages/')) {
              const pageName = chunkInfo.facadeModuleId
                .split('/pages/')[1]
                ?.split('/')[0]
                ?.toLowerCase();
              return `pages/${pageName || 'page'}-[hash].js`;
            }
            // 3D components get their own chunks
            if (
              chunkInfo.facadeModuleId?.includes('/3d/') ||
              chunkInfo.facadeModuleId?.includes('/components/3d/')
            ) {
              return '3d/[name]-[hash].js';
            }
            // Game engines get their own chunks
            if (chunkInfo.facadeModuleId?.includes('/games/')) {
              const gamePath = chunkInfo.facadeModuleId.split('/games/')[1];
              const gameName = gamePath?.split('/')[0]?.toLowerCase();
              if (gameName && gameName !== 'engine') {
                return `games/${gameName}-[hash].js`;
              }
              if (gameName === 'engine') {
                return 'games/engine-[hash].js';
              }
            }
            // Default chunk naming
            return 'chunks/[name]-[hash].js';
          },
          // Entry file naming
          entryFileNames: 'js/[name]-[hash].js',
          // Asset file naming
          assetFileNames: (assetInfo) => {
            // Keep fonts organized
            if (assetInfo.name?.match(/\.(woff2?|eot|ttf|otf)$/)) {
              return 'fonts/[name]-[hash][extname]';
            }
            // Keep images organized
            if (assetInfo.name?.match(/\.(png|jpe?g|gif|svg|webp|ico)$/)) {
              return 'images/[name]-[hash][extname]';
            }
            // Keep 3D assets organized
            if (assetInfo.name?.match(/\.(gltf|glb|fnt|atlas)$/)) {
              return '3d-assets/[name]-[hash][extname]';
            }
            // Default asset naming
            return 'assets/[name]-[hash][extname]';
          },
        },
      },
      // Target modern browsers for smaller bundles
      target: 'esnext',
      // Enable source maps for debugging
      sourcemap: true,
      // Chunk size warnings
      chunkSizeWarningLimit: 500, // 500KB warning threshold
    },
    // Include additional asset types for 3D models and sprite sheets
    assetsInclude: ['**/*.gltf', '**/*.glb', '**/*.fnt', '**/*.atlas'],
    // Optimize dependencies
    optimizeDeps: {
      // Include dependencies that need to be pre-bundled
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'framer-motion',
        'zustand',
        'viem',
        'clsx',
        'tailwind-merge',
      ],
      // Exclude heavy dependencies from pre-bundling (they'll be lazy loaded)
      exclude: ['three', '@react-three/fiber', '@react-three/drei'],
    },
  };
});
