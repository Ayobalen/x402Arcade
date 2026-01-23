/**
 * Test Environment Utilities
 *
 * Provides functions for loading and managing test environment variables.
 * Ensures consistent, deterministic test configuration across all tests.
 *
 * @example
 * ```typescript
 * import { loadTestEnv, TEST_ENV, withTestEnv } from '../utils/env-helpers';
 *
 * // At the start of your test file
 * loadTestEnv();
 *
 * // Or wrap a test with temporary env changes
 * await withTestEnv({ SNAKE_PRICE_USDC: '0.05' }, async () => {
 *   // Test with custom price
 * });
 * ```
 */

import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ============================================================================
// Types
// ============================================================================

/**
 * Test environment configuration.
 */
export interface TestEnvironment {
  // Server
  NODE_ENV: string;
  PORT: string;
  HOST: string;
  CORS_ORIGIN: string;

  // Database
  DATABASE_PATH: string;

  // Blockchain
  CHAIN_ID: string;
  RPC_URL: string;
  EXPLORER_URL: string;

  // Contracts
  USDC_CONTRACT_ADDRESS: string;
  USDC_DECIMALS: string;
  USDC_DOMAIN_VERSION: string;

  // Arcade Wallet
  ARCADE_WALLET_ADDRESS: string;
  ARCADE_PRIVATE_KEY: string;

  // x402 Facilitator
  FACILITATOR_URL: string;

  // Game Config
  SNAKE_PRICE_USDC: string;
  TETRIS_PRICE_USDC: string;
  PRIZE_POOL_PERCENTAGE: string;
  SESSION_EXPIRY_MINUTES: string;

  // Test-specific
  JWT_SECRET: string;
  JWT_EXPIRY_SECONDS: string;
  LOG_LEVEL: string;
  LOG_SILENCE: string;
  RATE_LIMIT_ENABLED: string;
  RATE_LIMIT_MAX_REQUESTS: string;
  RATE_LIMIT_WINDOW_MS: string;
  TEST_TIMEOUT_MS: string;
  TEST_RETRY_COUNT: string;
  MOCK_FACILITATOR_PORT: string;
  MOCK_RPC_PORT: string;
}

/**
 * Partial test environment for overrides.
 */
export type PartialTestEnvironment = Partial<TestEnvironment>;

// ============================================================================
// Constants
// ============================================================================

/**
 * Default test environment values.
 * Used when .env.test is not available or as fallbacks.
 */
export const TEST_ENV: TestEnvironment = {
  // Server
  NODE_ENV: 'test',
  PORT: '3002',
  HOST: 'localhost',
  CORS_ORIGIN: 'http://localhost:5173',

  // Database - In-memory for fast tests
  DATABASE_PATH: ':memory:',

  // Blockchain (Cronos Testnet)
  CHAIN_ID: '338',
  RPC_URL: 'https://evm-t3.cronos.org/',
  EXPLORER_URL: 'https://explorer.cronos.org/testnet',

  // Contracts
  USDC_CONTRACT_ADDRESS: '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0',
  USDC_DECIMALS: '6',
  USDC_DOMAIN_VERSION: '1',

  // Test Arcade Wallet
  ARCADE_WALLET_ADDRESS: '0xTEST_ARCADE_WALLET_ADDRESS_0001',
  ARCADE_PRIVATE_KEY: '0xTEST_PRIVATE_KEY_DO_NOT_USE_IN_PRODUCTION_0001',

  // x402 Facilitator (Mock)
  FACILITATOR_URL: 'http://localhost:9999',

  // Game Config
  SNAKE_PRICE_USDC: '0.01',
  TETRIS_PRICE_USDC: '0.02',
  PRIZE_POOL_PERCENTAGE: '70',
  SESSION_EXPIRY_MINUTES: '30',

  // Test-specific
  JWT_SECRET: 'test_jwt_secret_DO_NOT_USE_IN_PRODUCTION',
  JWT_EXPIRY_SECONDS: '3600',
  LOG_LEVEL: 'error',
  LOG_SILENCE: 'true',
  RATE_LIMIT_ENABLED: 'false',
  RATE_LIMIT_MAX_REQUESTS: '9999',
  RATE_LIMIT_WINDOW_MS: '1000',
  TEST_TIMEOUT_MS: '5000',
  TEST_RETRY_COUNT: '3',
  MOCK_FACILITATOR_PORT: '9999',
  MOCK_RPC_PORT: '9998',
};

/**
 * Track if test env has been loaded.
 */
let isTestEnvLoaded = false;

/**
 * Original environment backup for restoration.
 */
let originalEnv: Record<string, string | undefined> = {};

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Parse a .env file content into key-value pairs.
 *
 * @param content - Raw .env file content
 * @returns Parsed environment variables
 */
export function parseEnvFile(content: string): Record<string, string> {
  const env: Record<string, string> = {};

  for (const line of content.split('\n')) {
    // Skip comments and empty lines
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    // Parse KEY=VALUE
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match) {
      const [, key, rawValue] = match;
      // Remove surrounding quotes if present
      let value = rawValue.trim();
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
  }

  return env;
}

/**
 * Find the .env.test file path.
 * Searches up from the current file location.
 *
 * @returns Path to .env.test or null if not found
 */
export function findEnvTestPath(): string | null {
  // Try relative to this file first
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const backendDir = join(__dirname, '..', '..');
    const envPath = join(backendDir, '.env.test');

    if (existsSync(envPath)) {
      return envPath;
    }
  } catch {
    // ESM not available, try alternatives
  }

  // Try from process.cwd()
  const cwdPath = join(process.cwd(), '.env.test');
  if (existsSync(cwdPath)) {
    return cwdPath;
  }

  // Try parent directories
  const parentPath = join(process.cwd(), '..', '.env.test');
  if (existsSync(parentPath)) {
    return parentPath;
  }

  return null;
}

/**
 * Load test environment variables.
 *
 * Loads environment variables from .env.test file and applies defaults
 * from TEST_ENV for any missing values.
 *
 * @param overrides - Optional overrides to apply after loading
 * @returns The loaded environment
 *
 * @example
 * ```typescript
 * // In your test setup file
 * loadTestEnv();
 *
 * // With custom overrides
 * loadTestEnv({ SNAKE_PRICE_USDC: '0.05' });
 * ```
 */
export function loadTestEnv(overrides: PartialTestEnvironment = {}): TestEnvironment {
  // Backup original env on first load
  if (!isTestEnvLoaded) {
    originalEnv = { ...process.env };
  }

  // Try to load .env.test file
  const envPath = findEnvTestPath();
  let fileEnv: Record<string, string> = {};

  if (envPath) {
    try {
      const content = readFileSync(envPath, 'utf-8');
      fileEnv = parseEnvFile(content);
    } catch (error) {
      console.warn(`Warning: Could not read .env.test: ${error}`);
    }
  }

  // Merge: defaults <- file values <- overrides
  const finalEnv: TestEnvironment = {
    ...TEST_ENV,
    ...fileEnv as Partial<TestEnvironment>,
    ...overrides,
  };

  // Apply to process.env
  for (const [key, value] of Object.entries(finalEnv)) {
    process.env[key] = value;
  }

  isTestEnvLoaded = true;
  return finalEnv;
}

/**
 * Reset environment to original state before tests.
 * Call this in afterAll or afterEach to restore the environment.
 *
 * @returns Number of variables restored
 */
export function resetTestEnv(): number {
  if (!isTestEnvLoaded) {
    return 0;
  }

  let restored = 0;

  // Remove all test-specific env vars
  for (const key of Object.keys(TEST_ENV)) {
    if (key in originalEnv) {
      if (originalEnv[key] !== undefined) {
        process.env[key] = originalEnv[key];
      } else {
        delete process.env[key];
      }
    } else {
      delete process.env[key];
    }
    restored++;
  }

  isTestEnvLoaded = false;
  return restored;
}

/**
 * Check if test environment is currently loaded.
 *
 * @returns True if test env is loaded
 */
export function isTestEnvironmentLoaded(): boolean {
  return isTestEnvLoaded;
}

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Run a function with temporary environment overrides.
 *
 * @param overrides - Environment overrides to apply
 * @param fn - Function to run
 * @returns Result of the function
 *
 * @example
 * ```typescript
 * await withTestEnv({ SNAKE_PRICE_USDC: '0.05' }, async () => {
 *   expect(process.env.SNAKE_PRICE_USDC).toBe('0.05');
 * });
 * ```
 */
export async function withTestEnv<T>(
  overrides: PartialTestEnvironment,
  fn: () => T | Promise<T>
): Promise<T> {
  // Capture current values
  const original: Record<string, string | undefined> = {};
  for (const key of Object.keys(overrides)) {
    original[key] = process.env[key];
  }

  try {
    // Apply overrides
    for (const [key, value] of Object.entries(overrides)) {
      process.env[key] = value;
    }

    return await fn();
  } finally {
    // Restore original values
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

/**
 * Get a required environment variable or throw.
 *
 * @param key - Environment variable key
 * @returns The value
 * @throws Error if the variable is not set
 *
 * @example
 * ```typescript
 * const dbPath = getRequiredEnv('DATABASE_PATH');
 * ```
 */
export function getRequiredEnv(key: keyof TestEnvironment): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set. Did you call loadTestEnv()?`);
  }
  return value;
}

/**
 * Get an optional environment variable with a default.
 *
 * @param key - Environment variable key
 * @param defaultValue - Default value if not set
 * @returns The value or default
 */
export function getOptionalEnv(key: keyof TestEnvironment, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

/**
 * Get environment variable as a number.
 *
 * @param key - Environment variable key
 * @param defaultValue - Default value if not set or invalid
 * @returns The numeric value
 */
export function getEnvNumber(key: keyof TestEnvironment, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Get environment variable as a boolean.
 *
 * @param key - Environment variable key
 * @param defaultValue - Default value if not set
 * @returns The boolean value
 */
export function getEnvBoolean(key: keyof TestEnvironment, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

// ============================================================================
// Validation
// ============================================================================

/**
 * List of required environment variables for tests to run.
 */
export const REQUIRED_TEST_ENV_VARS: (keyof TestEnvironment)[] = [
  'NODE_ENV',
  'DATABASE_PATH',
  'USDC_CONTRACT_ADDRESS',
  'FACILITATOR_URL',
  'JWT_SECRET',
];

/**
 * Validate that all required test environment variables are set.
 *
 * @returns Validation result with any missing variables
 */
export function validateTestEnv(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const key of REQUIRED_TEST_ENV_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Assert that the test environment is properly configured.
 *
 * @throws Error if required variables are missing
 */
export function assertTestEnvConfigured(): void {
  const { valid, missing } = validateTestEnv();
  if (!valid) {
    throw new Error(
      `Test environment is not properly configured. Missing: ${missing.join(', ')}. ` +
      `Call loadTestEnv() before running tests.`
    );
  }
}

// ============================================================================
// Mock Server URLs
// ============================================================================

/**
 * Get the URL for the mock facilitator server.
 *
 * @returns Mock facilitator URL
 */
export function getMockFacilitatorUrl(): string {
  const port = process.env.MOCK_FACILITATOR_PORT ?? '9999';
  return `http://localhost:${port}`;
}

/**
 * Get the URL for the mock RPC server.
 *
 * @returns Mock RPC URL
 */
export function getMockRpcUrl(): string {
  const port = process.env.MOCK_RPC_PORT ?? '9998';
  return `http://localhost:${port}`;
}

// ============================================================================
// Jest Integration
// ============================================================================

/**
 * Create a Jest setup function that loads test environment.
 * Use this in your jest.setup.ts file.
 *
 * @returns Setup function
 *
 * @example
 * ```typescript
 * // jest.setup.ts
 * import { createTestEnvSetup } from './utils/env-helpers';
 *
 * const setup = createTestEnvSetup();
 * beforeAll(setup.beforeAll);
 * afterAll(setup.afterAll);
 * ```
 */
export function createTestEnvSetup() {
  return {
    beforeAll: () => {
      loadTestEnv();
      assertTestEnvConfigured();
    },
    afterAll: () => {
      resetTestEnv();
    },
  };
}

/**
 * Create a per-test env setup for complete isolation.
 *
 * @returns Setup/teardown functions
 */
export function createIsolatedTestEnvSetup() {
  let snapshot: Record<string, string | undefined> = {};

  return {
    beforeEach: () => {
      snapshot = { ...process.env };
      loadTestEnv();
    },
    afterEach: () => {
      // Restore complete snapshot
      for (const key of Object.keys(process.env)) {
        if (!(key in snapshot)) {
          delete process.env[key];
        }
      }
      for (const [key, value] of Object.entries(snapshot)) {
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      }
    },
  };
}
