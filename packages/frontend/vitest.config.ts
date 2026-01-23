import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Enable globals (describe, it, expect) without imports
    globals: true,

    // Use jsdom for browser API mocking
    environment: 'jsdom',

    // Setup files for test utilities
    setupFiles: ['./src/test/setup.ts', './__tests__/setup.ts'],

    // Include test files patterns
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],

    // Exclude patterns
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/types/',
        'src/main.tsx',
        '*.config.{js,ts}',
        'postcss.config.js',
        'tailwind.config.js',
      ],
      // Coverage thresholds (80% minimum as per feature requirement)
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },

    // Watch mode configuration
    // Note: watch is disabled for 'vitest run', enabled by default for 'vitest'
    watchExclude: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'test-reports/**',
      '**/*.d.ts',
    ],

    // File watching settings
    forceRerunTriggers: [
      '**/vitest.config.ts',
      '**/vite.config.ts',
      '**/package.json',
    ],

    // Pass through watch mode (controlled by CLI)
    passWithNoTests: true,

    // Reporter configuration
    reporters: ['default', 'html', 'json'],

    // HTML reporter output directory
    outputFile: {
      html: './test-reports/html/index.html',
      json: './test-reports/json/results.json',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
