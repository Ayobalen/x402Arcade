/**
 * Test Environment Utilities - Tests
 *
 * Tests for env-helpers.ts ensuring proper test environment configuration.
 */

import { jest, describe, it, expect, beforeEach, afterEach, afterAll } from '@jest/globals';
import {
  TEST_ENV,
  parseEnvFile,
  loadTestEnv,
  resetTestEnv,
  isTestEnvironmentLoaded,
  withTestEnv,
  getRequiredEnv,
  getOptionalEnv,
  getEnvNumber,
  getEnvBoolean,
  REQUIRED_TEST_ENV_VARS,
  validateTestEnv,
  assertTestEnvConfigured,
  getMockFacilitatorUrl,
  getMockRpcUrl,
  createTestEnvSetup,
  createIsolatedTestEnvSetup,
  type TestEnvironment,
} from './env-helpers';

// ============================================================================
// Test Setup
// ============================================================================

// Save original environment for restoration
const originalProcessEnv = { ...process.env };

/**
 * Restore environment to original state.
 */
function restoreOriginalEnv(): void {
  // Remove all keys
  for (const key of Object.keys(process.env)) {
    delete process.env[key];
  }
  // Restore original
  Object.assign(process.env, originalProcessEnv);
}

// ============================================================================
// TEST_ENV Constants Tests
// ============================================================================

describe('TEST_ENV Constants', () => {
  afterEach(() => {
    restoreOriginalEnv();
    resetTestEnv();
  });

  it('should have NODE_ENV set to test', () => {
    expect(TEST_ENV.NODE_ENV).toBe('test');
  });

  it('should have in-memory database path', () => {
    expect(TEST_ENV.DATABASE_PATH).toBe(':memory:');
  });

  it('should have test JWT secret', () => {
    expect(TEST_ENV.JWT_SECRET).toBe('test_jwt_secret_DO_NOT_USE_IN_PRODUCTION');
  });

  it('should have mock facilitator URL', () => {
    expect(TEST_ENV.FACILITATOR_URL).toBe('http://localhost:9999');
  });

  it('should have rate limiting disabled', () => {
    expect(TEST_ENV.RATE_LIMIT_ENABLED).toBe('false');
  });

  it('should have correct Cronos testnet chain ID', () => {
    expect(TEST_ENV.CHAIN_ID).toBe('338');
  });

  it('should have correct USDC contract address', () => {
    expect(TEST_ENV.USDC_CONTRACT_ADDRESS).toBe('0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0');
  });

  it('should have correct game prices', () => {
    expect(TEST_ENV.SNAKE_PRICE_USDC).toBe('0.01');
    expect(TEST_ENV.TETRIS_PRICE_USDC).toBe('0.02');
  });

  it('should include all required fields', () => {
    const requiredKeys: (keyof TestEnvironment)[] = [
      'NODE_ENV',
      'PORT',
      'HOST',
      'DATABASE_PATH',
      'CHAIN_ID',
      'USDC_CONTRACT_ADDRESS',
      'FACILITATOR_URL',
      'JWT_SECRET',
    ];

    for (const key of requiredKeys) {
      expect(TEST_ENV[key]).toBeDefined();
    }
  });
});

// ============================================================================
// parseEnvFile Tests
// ============================================================================

describe('parseEnvFile', () => {
  it('should parse simple key=value pairs', () => {
    const content = 'KEY1=value1\nKEY2=value2';
    const result = parseEnvFile(content);

    expect(result).toEqual({
      KEY1: 'value1',
      KEY2: 'value2',
    });
  });

  it('should skip comments', () => {
    const content = '# This is a comment\nKEY=value\n# Another comment';
    const result = parseEnvFile(content);

    expect(result).toEqual({ KEY: 'value' });
  });

  it('should skip empty lines', () => {
    const content = 'KEY1=value1\n\n\nKEY2=value2';
    const result = parseEnvFile(content);

    expect(result).toEqual({
      KEY1: 'value1',
      KEY2: 'value2',
    });
  });

  it('should handle quoted values', () => {
    const content = 'KEY1="quoted value"\nKEY2=\'single quoted\'';
    const result = parseEnvFile(content);

    expect(result).toEqual({
      KEY1: 'quoted value',
      KEY2: 'single quoted',
    });
  });

  it('should handle values with equals signs', () => {
    const content = 'KEY=value=with=equals';
    const result = parseEnvFile(content);

    expect(result).toEqual({
      KEY: 'value=with=equals',
    });
  });

  it('should handle empty values', () => {
    const content = 'EMPTY_KEY=';
    const result = parseEnvFile(content);

    expect(result).toEqual({ EMPTY_KEY: '' });
  });

  it('should trim whitespace from values', () => {
    const content = 'KEY=  value with spaces  ';
    const result = parseEnvFile(content);

    expect(result).toEqual({ KEY: 'value with spaces' });
  });

  it('should ignore invalid lines', () => {
    const content = 'VALID=value\nthis is not valid\nANOTHER=good';
    const result = parseEnvFile(content);

    expect(result).toEqual({
      VALID: 'value',
      ANOTHER: 'good',
    });
  });

  it('should handle URLs with special characters', () => {
    const content = 'URL=https://example.com:8080/path?query=value&other=123';
    const result = parseEnvFile(content);

    expect(result).toEqual({
      URL: 'https://example.com:8080/path?query=value&other=123',
    });
  });

  it('should handle keys with underscores and numbers', () => {
    const content = 'MY_KEY_123=value\nANOTHER_2_KEY=value2';
    const result = parseEnvFile(content);

    expect(result).toEqual({
      MY_KEY_123: 'value',
      ANOTHER_2_KEY: 'value2',
    });
  });
});

// ============================================================================
// loadTestEnv / resetTestEnv Tests
// ============================================================================

describe('loadTestEnv', () => {
  afterEach(() => {
    restoreOriginalEnv();
    resetTestEnv();
  });

  it('should load test environment variables', () => {
    loadTestEnv();

    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.DATABASE_PATH).toBe(':memory:');
    expect(process.env.JWT_SECRET).toBe('test_jwt_secret_DO_NOT_USE_IN_PRODUCTION');
  });

  it('should apply overrides', () => {
    loadTestEnv({ SNAKE_PRICE_USDC: '0.05' });

    expect(process.env.SNAKE_PRICE_USDC).toBe('0.05');
  });

  it('should return the loaded environment', () => {
    const env = loadTestEnv();

    expect(env.NODE_ENV).toBe('test');
    expect(env.DATABASE_PATH).toBe(':memory:');
  });

  it('should mark environment as loaded', () => {
    expect(isTestEnvironmentLoaded()).toBe(false);

    loadTestEnv();

    expect(isTestEnvironmentLoaded()).toBe(true);
  });

  it('should overwrite existing env vars', () => {
    process.env.NODE_ENV = 'production';

    loadTestEnv();

    expect(process.env.NODE_ENV).toBe('test');
  });
});

describe('resetTestEnv', () => {
  afterEach(() => {
    restoreOriginalEnv();
  });

  it('should reset environment after loading', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    loadTestEnv();

    resetTestEnv();

    expect(process.env.NODE_ENV).toBe(originalNodeEnv);
    expect(isTestEnvironmentLoaded()).toBe(false);
  });

  it('should return 0 if env was never loaded', () => {
    const result = resetTestEnv();

    expect(result).toBe(0);
  });

  it('should return count of restored variables', () => {
    loadTestEnv();

    const result = resetTestEnv();

    expect(result).toBeGreaterThan(0);
  });
});

describe('isTestEnvironmentLoaded', () => {
  afterEach(() => {
    restoreOriginalEnv();
    resetTestEnv();
  });

  it('should return false before loading', () => {
    expect(isTestEnvironmentLoaded()).toBe(false);
  });

  it('should return true after loading', () => {
    loadTestEnv();

    expect(isTestEnvironmentLoaded()).toBe(true);
  });

  it('should return false after reset', () => {
    loadTestEnv();
    resetTestEnv();

    expect(isTestEnvironmentLoaded()).toBe(false);
  });
});

// ============================================================================
// withTestEnv Tests
// ============================================================================

describe('withTestEnv', () => {
  afterEach(() => {
    restoreOriginalEnv();
    resetTestEnv();
  });

  it('should apply temporary overrides', async () => {
    loadTestEnv();
    const originalPrice = process.env.SNAKE_PRICE_USDC;

    await withTestEnv({ SNAKE_PRICE_USDC: '0.99' }, async () => {
      expect(process.env.SNAKE_PRICE_USDC).toBe('0.99');
    });

    expect(process.env.SNAKE_PRICE_USDC).toBe(originalPrice);
  });

  it('should restore original values after completion', async () => {
    loadTestEnv();
    process.env.CUSTOM_VAR = 'original';

    await withTestEnv({ CUSTOM_VAR: 'temporary' }, async () => {
      expect(process.env.CUSTOM_VAR).toBe('temporary');
    });

    expect(process.env.CUSTOM_VAR).toBe('original');
  });

  it('should restore values even on error', async () => {
    loadTestEnv();
    process.env.CUSTOM_VAR = 'original';

    await expect(
      withTestEnv({ CUSTOM_VAR: 'temporary' }, async () => {
        throw new Error('Test error');
      })
    ).rejects.toThrow('Test error');

    expect(process.env.CUSTOM_VAR).toBe('original');
  });

  it('should return the function result', async () => {
    loadTestEnv();

    const result = await withTestEnv({}, async () => {
      return 'test result';
    });

    expect(result).toBe('test result');
  });

  it('should handle undefined original values', async () => {
    delete process.env.NEW_VAR;

    await withTestEnv({ NEW_VAR: 'temporary' } as any, async () => {
      expect(process.env.NEW_VAR).toBe('temporary');
    });

    expect(process.env.NEW_VAR).toBeUndefined();
  });
});

// ============================================================================
// getRequiredEnv / getOptionalEnv Tests
// ============================================================================

describe('getRequiredEnv', () => {
  afterEach(() => {
    restoreOriginalEnv();
    resetTestEnv();
  });

  it('should return value when set', () => {
    loadTestEnv();

    const value = getRequiredEnv('NODE_ENV');

    expect(value).toBe('test');
  });

  it('should throw when value is not set', () => {
    delete process.env.JWT_SECRET;

    expect(() => getRequiredEnv('JWT_SECRET')).toThrow(/Required environment variable/);
  });
});

describe('getOptionalEnv', () => {
  afterEach(() => {
    restoreOriginalEnv();
    resetTestEnv();
  });

  it('should return value when set', () => {
    loadTestEnv();

    const value = getOptionalEnv('NODE_ENV', 'default');

    expect(value).toBe('test');
  });

  it('should return default when not set', () => {
    delete process.env.CUSTOM_VAR;

    const value = getOptionalEnv('CUSTOM_VAR' as any, 'default');

    expect(value).toBe('default');
  });
});

describe('getEnvNumber', () => {
  afterEach(() => {
    restoreOriginalEnv();
    resetTestEnv();
  });

  it('should parse numeric values', () => {
    loadTestEnv();

    const value = getEnvNumber('CHAIN_ID', 0);

    expect(value).toBe(338);
  });

  it('should return default for invalid numbers', () => {
    process.env.INVALID_NUM = 'not a number';

    const value = getEnvNumber('INVALID_NUM' as any, 42);

    expect(value).toBe(42);
  });

  it('should return default when not set', () => {
    delete process.env.MISSING_VAR;

    const value = getEnvNumber('MISSING_VAR' as any, 100);

    expect(value).toBe(100);
  });

  it('should handle float values', () => {
    process.env.FLOAT_VAR = '3.14';

    const value = getEnvNumber('FLOAT_VAR' as any, 0);

    expect(value).toBeCloseTo(3.14);
  });
});

describe('getEnvBoolean', () => {
  afterEach(() => {
    restoreOriginalEnv();
    resetTestEnv();
  });

  it('should parse "true" as true', () => {
    process.env.BOOL_VAR = 'true';

    const value = getEnvBoolean('BOOL_VAR' as any, false);

    expect(value).toBe(true);
  });

  it('should parse "1" as true', () => {
    process.env.BOOL_VAR = '1';

    const value = getEnvBoolean('BOOL_VAR' as any, false);

    expect(value).toBe(true);
  });

  it('should parse "false" as false', () => {
    process.env.BOOL_VAR = 'false';

    const value = getEnvBoolean('BOOL_VAR' as any, true);

    expect(value).toBe(false);
  });

  it('should return default when not set', () => {
    delete process.env.MISSING_VAR;

    const value = getEnvBoolean('MISSING_VAR' as any, true);

    expect(value).toBe(true);
  });

  it('should be case insensitive', () => {
    process.env.BOOL_VAR = 'TRUE';

    const value = getEnvBoolean('BOOL_VAR' as any, false);

    expect(value).toBe(true);
  });
});

// ============================================================================
// Validation Tests
// ============================================================================

describe('REQUIRED_TEST_ENV_VARS', () => {
  it('should include critical variables', () => {
    expect(REQUIRED_TEST_ENV_VARS).toContain('NODE_ENV');
    expect(REQUIRED_TEST_ENV_VARS).toContain('DATABASE_PATH');
    expect(REQUIRED_TEST_ENV_VARS).toContain('JWT_SECRET');
    expect(REQUIRED_TEST_ENV_VARS).toContain('FACILITATOR_URL');
  });
});

describe('validateTestEnv', () => {
  afterEach(() => {
    restoreOriginalEnv();
    resetTestEnv();
  });

  it('should return valid when all required vars are set', () => {
    loadTestEnv();

    const result = validateTestEnv();

    expect(result.valid).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it('should return invalid when required vars are missing', () => {
    // Don't load test env, just check current state
    delete process.env.NODE_ENV;
    delete process.env.DATABASE_PATH;
    delete process.env.JWT_SECRET;
    delete process.env.FACILITATOR_URL;
    delete process.env.USDC_CONTRACT_ADDRESS;

    const result = validateTestEnv();

    expect(result.valid).toBe(false);
    expect(result.missing.length).toBeGreaterThan(0);
  });

  it('should list all missing variables', () => {
    // Clear all required vars
    for (const key of REQUIRED_TEST_ENV_VARS) {
      delete process.env[key];
    }

    const result = validateTestEnv();

    expect(result.missing).toEqual(expect.arrayContaining(REQUIRED_TEST_ENV_VARS));
  });
});

describe('assertTestEnvConfigured', () => {
  afterEach(() => {
    restoreOriginalEnv();
    resetTestEnv();
  });

  it('should not throw when env is configured', () => {
    loadTestEnv();

    expect(() => assertTestEnvConfigured()).not.toThrow();
  });

  it('should throw when env is not configured', () => {
    for (const key of REQUIRED_TEST_ENV_VARS) {
      delete process.env[key];
    }

    expect(() => assertTestEnvConfigured()).toThrow(/not properly configured/);
  });
});

// ============================================================================
// Mock Server URL Tests
// ============================================================================

describe('getMockFacilitatorUrl', () => {
  afterEach(() => {
    restoreOriginalEnv();
    resetTestEnv();
  });

  it('should return URL with configured port', () => {
    process.env.MOCK_FACILITATOR_PORT = '8888';

    const url = getMockFacilitatorUrl();

    expect(url).toBe('http://localhost:8888');
  });

  it('should use default port when not configured', () => {
    delete process.env.MOCK_FACILITATOR_PORT;

    const url = getMockFacilitatorUrl();

    expect(url).toBe('http://localhost:9999');
  });
});

describe('getMockRpcUrl', () => {
  afterEach(() => {
    restoreOriginalEnv();
    resetTestEnv();
  });

  it('should return URL with configured port', () => {
    process.env.MOCK_RPC_PORT = '7777';

    const url = getMockRpcUrl();

    expect(url).toBe('http://localhost:7777');
  });

  it('should use default port when not configured', () => {
    delete process.env.MOCK_RPC_PORT;

    const url = getMockRpcUrl();

    expect(url).toBe('http://localhost:9998');
  });
});

// ============================================================================
// Jest Integration Tests
// ============================================================================

describe('createTestEnvSetup', () => {
  afterEach(() => {
    restoreOriginalEnv();
    resetTestEnv();
  });

  it('should return setup and teardown functions', () => {
    const setup = createTestEnvSetup();

    expect(typeof setup.beforeAll).toBe('function');
    expect(typeof setup.afterAll).toBe('function');
  });

  it('should load env in beforeAll', () => {
    const setup = createTestEnvSetup();

    setup.beforeAll();

    expect(isTestEnvironmentLoaded()).toBe(true);
    expect(process.env.NODE_ENV).toBe('test');
  });

  it('should reset env in afterAll', () => {
    const setup = createTestEnvSetup();
    setup.beforeAll();

    setup.afterAll();

    expect(isTestEnvironmentLoaded()).toBe(false);
  });
});

describe('createIsolatedTestEnvSetup', () => {
  afterEach(() => {
    restoreOriginalEnv();
    resetTestEnv();
  });

  it('should return beforeEach and afterEach functions', () => {
    const setup = createIsolatedTestEnvSetup();

    expect(typeof setup.beforeEach).toBe('function');
    expect(typeof setup.afterEach).toBe('function');
  });

  it('should provide isolated environment per test', () => {
    const setup = createIsolatedTestEnvSetup();

    // First "test"
    setup.beforeEach();
    process.env.ISOLATED_VAR = 'first';
    setup.afterEach();

    // Second "test"
    setup.beforeEach();
    expect(process.env.ISOLATED_VAR).toBeUndefined();
    setup.afterEach();
  });

  it('should restore complete environment after each test', () => {
    process.env.ORIGINAL_VAR = 'original';
    const setup = createIsolatedTestEnvSetup();

    setup.beforeEach();
    process.env.ORIGINAL_VAR = 'modified';
    setup.afterEach();

    expect(process.env.ORIGINAL_VAR).toBe('original');
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Environment Integration', () => {
  afterEach(() => {
    restoreOriginalEnv();
    resetTestEnv();
  });

  it('should support full test lifecycle', async () => {
    // 1. Load test environment
    loadTestEnv();
    expect(process.env.NODE_ENV).toBe('test');

    // 2. Use environment in tests
    const dbPath = getRequiredEnv('DATABASE_PATH');
    expect(dbPath).toBe(':memory:');

    // 3. Override for specific test
    await withTestEnv({ DATABASE_PATH: './test.db' }, async () => {
      expect(process.env.DATABASE_PATH).toBe('./test.db');
    });

    // 4. Original restored
    expect(process.env.DATABASE_PATH).toBe(':memory:');

    // 5. Cleanup
    resetTestEnv();
    expect(isTestEnvironmentLoaded()).toBe(false);
  });

  it('should maintain isolation across multiple test scenarios', async () => {
    const setup = createIsolatedTestEnvSetup();

    // Simulate multiple tests
    for (let i = 0; i < 5; i++) {
      setup.beforeEach();

      // Each test modifies environment
      process.env[`TEST_VAR_${i}`] = `value_${i}`;
      expect(process.env.NODE_ENV).toBe('test');

      setup.afterEach();

      // Verify previous test's var is gone
      if (i > 0) {
        expect(process.env[`TEST_VAR_${i - 1}`]).toBeUndefined();
      }
    }
  });
});

// Global cleanup
afterAll(() => {
  restoreOriginalEnv();
});
