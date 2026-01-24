/**
 * Backend ESLint Configuration
 *
 * Extends the shared root configuration with backend-specific rules.
 */

import { baseConfig, tseslint, globals } from '../../eslint.config.js';

export default tseslint.config(
  // Extend base configuration
  ...baseConfig,

  // Backend-specific configuration
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      // Allow console.log for server logging
      'no-console': 'off',

      // Stricter rules for backend code
      '@typescript-eslint/no-explicit-any': 'warn',

      // Allow process.env access
      'no-process-env': 'off',

      // Disable type-aware rules that require parserOptions.project
      // (these require full TypeScript program which slows down linting)
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
    },
  },

  // Test files
  {
    files: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  }
);
