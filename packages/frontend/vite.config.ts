import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
        manualChunks: {
          // React core - rarely changes, good for long-term caching
          'react-vendor': ['react', 'react-dom'],
          // React Router - separate from core React
          router: ['react-router-dom'],
          // Three.js - large library, load separately
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          // Animation libraries
          animation: ['framer-motion'],
          // Utility libraries
          utils: ['zustand', 'viem', 'clsx', 'tailwind-merge'],
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
});
