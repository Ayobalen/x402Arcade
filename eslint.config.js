/**
 * Shared ESLint Configuration
 *
 * Root ESLint configuration for consistent code style across all packages.
 * This configuration is extended by individual package configs.
 *
 * @see https://eslint.org/docs/latest/use/configure/configuration-files-new
 */

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier';

/**
 * Shared base configuration for all TypeScript files
 */
export const baseConfig = tseslint.config(
  // Ignore common directories
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/test-reports/**',
      '**/node_modules/**',
      '**/.git/**',
      '**/playwright-report/**',
      '**/test-results/**',
    ],
  },

  // Base JavaScript recommended rules
  js.configs.recommended,

  // TypeScript recommended rules
  ...tseslint.configs.recommended,

  // Prettier compatibility (disables conflicting rules)
  eslintConfigPrettier,

  // TypeScript files configuration
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      // Code quality rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Allow console in development, warn in production
      'no-console': 'warn',

      // Enforce consistent type imports
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
          disallowTypeAnnotations: false,
        },
      ],

      // Allow empty object types (useful for props extending)
      '@typescript-eslint/no-empty-object-type': 'off',

      // Allow explicit any in edge cases (prefer unknown)
      '@typescript-eslint/no-explicit-any': 'warn',

      // Require explicit return types on exported functions
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // Prefer nullish coalescing
      '@typescript-eslint/prefer-nullish-coalescing': 'off',

      // Prefer optional chaining
      '@typescript-eslint/prefer-optional-chain': 'warn',

      // No floating promises
      '@typescript-eslint/no-floating-promises': 'off',

      // Require await in async functions
      'require-await': 'off',
      '@typescript-eslint/require-await': 'off',

      // No unsafe assignments
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },

  // Test files - relaxed rules
  {
    files: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },

  // E2E test files
  {
    files: ['e2e/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'no-console': 'off',
    },
  },

  // Configuration files
  {
    files: ['*.config.{js,ts}', '**/*.config.{js,ts}'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-console': 'off',
    },
  }
);

/**
 * Export shared configuration for package-level configs to extend
 */
export { tseslint, globals, eslintConfigPrettier };

/**
 * Default export is the full configuration for the root
 */
export default baseConfig;
