import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'test-reports', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended, eslintConfigPrettier],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  // Relaxed rules for test files
  {
    files: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'react-refresh/only-export-components': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  // Relaxed rules for 3D components (Three.js has different patterns)
  {
    files: ['**/components/3d/**/*.{ts,tsx}', '**/games/**/*.{ts,tsx}'],
    rules: {
      'react-hooks/refs': 'off',
      'react-hooks/immutability': 'off', // Allow mutable refs for frame-by-frame animation
      'react-hooks/set-state-in-effect': 'off', // Animation effects often need this pattern
      'react-refresh/only-export-components': 'off',
    },
  },
  // Relaxed rules for hooks (performance monitoring, timers, capability detection, etc.)
  {
    files: ['**/hooks/**/*.{ts,tsx}'],
    rules: {
      'react-hooks/purity': 'off', // Performance monitoring hooks need impure functions
      'react-hooks/set-state-in-effect': 'off', // Capability detection hooks initialize state in effects
    },
  },
  // Relaxed rules for context providers (they often export hooks alongside providers)
  {
    files: ['**/contexts/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  }
);
