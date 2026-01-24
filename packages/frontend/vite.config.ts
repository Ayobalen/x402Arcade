import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

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
  },
  // Include additional asset types for 3D models and sprite sheets
  assetsInclude: ['**/*.gltf', '**/*.glb', '**/*.fnt', '**/*.atlas'],
})
