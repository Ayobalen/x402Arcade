/** @type {import('jest').Config} */
export default {
  // Use ts-jest with ESM support
  preset: 'ts-jest/presets/default-esm',

  // Node.js test environment
  testEnvironment: 'node',

  // ESM support
  extensionsToTreatAsEsm: ['.ts'],

  // Transform settings for TypeScript
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: './tsconfig.json',
      },
    ],
  },

  // Module name mapping for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // Test file patterns
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],

  // Files to ignore
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],

  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/types/**',
    '!src/index.ts',
  ],

  // Coverage thresholds (80% minimum as per feature requirement)
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Coverage reporters
  coverageReporters: ['text', 'json', 'html'],

  // Coverage directory
  coverageDirectory: 'coverage',

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,
};
