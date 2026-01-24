/**
 * Tests for environment variable validation schema
 *
 * Verifies Zod schema validation for all env vars,
 * with focus on CORS_ORIGIN transformation.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  envSchema,
  validateEnv,
  validateEnvOrThrow,
  validateEnvSafe,
} from '../../../src/config/env';

describe('Environment Validation Schema', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('CORS_ORIGIN Schema', () => {
    it('should parse single origin as string', () => {
      const testEnv = {
        ...process.env,
        CORS_ORIGIN: 'http://localhost:3000',
        JWT_SECRET: 'test_secret_key_at_least_32_characters_long',
      };

      const result = envSchema.safeParse(testEnv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.CORS_ORIGIN).toBe('http://localhost:3000');
        expect(typeof result.data.CORS_ORIGIN).toBe('string');
      }
    });

    it('should parse comma-separated origins as array', () => {
      const testEnv = {
        ...process.env,
        CORS_ORIGIN: 'http://localhost:3000,http://localhost:5173,https://app.example.com',
        JWT_SECRET: 'test_secret_key_at_least_32_characters_long',
      };

      const result = envSchema.safeParse(testEnv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data.CORS_ORIGIN)).toBe(true);
        expect(result.data.CORS_ORIGIN).toEqual([
          'http://localhost:3000',
          'http://localhost:5173',
          'https://app.example.com',
        ]);
      }
    });

    it('should trim whitespace from comma-separated origins', () => {
      const testEnv = {
        ...process.env,
        CORS_ORIGIN:
          '  http://localhost:3000  ,  http://localhost:5173  ,  https://app.example.com  ',
        JWT_SECRET: 'test_secret_key_at_least_32_characters_long',
      };

      const result = envSchema.safeParse(testEnv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.CORS_ORIGIN).toEqual([
          'http://localhost:3000',
          'http://localhost:5173',
          'https://app.example.com',
        ]);
      }
    });

    it('should default to http://localhost:5173 for development', () => {
      const testEnv = {
        ...process.env,
        JWT_SECRET: 'test_secret_key_at_least_32_characters_long',
      };
      // Don't set CORS_ORIGIN - should use default
      delete testEnv.CORS_ORIGIN;

      const result = envSchema.safeParse(testEnv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.CORS_ORIGIN).toBe('http://localhost:5173');
      }
    });

    it('should handle single origin with spaces', () => {
      const testEnv = {
        ...process.env,
        CORS_ORIGIN: '  http://localhost:3000  ',
        JWT_SECRET: 'test_secret_key_at_least_32_characters_long',
      };

      const result = envSchema.safeParse(testEnv);

      expect(result.success).toBe(true);
      if (result.success) {
        // Single origin with no comma should be returned as-is (trim happens in cors middleware)
        expect(result.data.CORS_ORIGIN).toBe('  http://localhost:3000  ');
      }
    });

    it('should handle two origins', () => {
      const testEnv = {
        ...process.env,
        CORS_ORIGIN: 'http://localhost:3000,https://production.com',
        JWT_SECRET: 'test_secret_key_at_least_32_characters_long',
      };

      const result = envSchema.safeParse(testEnv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.CORS_ORIGIN).toEqual([
          'http://localhost:3000',
          'https://production.com',
        ]);
      }
    });

    it('should handle wildcard origin', () => {
      const testEnv = {
        ...process.env,
        CORS_ORIGIN: '*',
        JWT_SECRET: 'test_secret_key_at_least_32_characters_long',
      };

      const result = envSchema.safeParse(testEnv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.CORS_ORIGIN).toBe('*');
      }
    });
  });

  describe('Required Fields', () => {
    it('should require JWT_SECRET with minimum 32 characters', () => {
      const testEnv = {
        ...process.env,
        JWT_SECRET: 'short',
      };

      const result = envSchema.safeParse(testEnv);

      expect(result.success).toBe(false);
      if (!result.success) {
        const jwtError = result.error.issues.find((issue) => issue.path.includes('JWT_SECRET'));
        expect(jwtError).toBeDefined();
        expect(jwtError?.message).toContain('at least 32 characters');
      }
    });

    it('should accept JWT_SECRET with exactly 32 characters', () => {
      const testEnv = {
        ...process.env,
        JWT_SECRET: '12345678901234567890123456789012', // exactly 32 chars
      };

      const result = envSchema.safeParse(testEnv);

      expect(result.success).toBe(true);
    });

    it('should fail when JWT_SECRET is missing', () => {
      const testEnv = { ...process.env };
      delete testEnv.JWT_SECRET;

      const result = envSchema.safeParse(testEnv);

      expect(result.success).toBe(false);
    });
  });

  describe('Default Values', () => {
    it('should apply default values for optional fields', () => {
      const testEnv = {
        JWT_SECRET: 'test_secret_key_at_least_32_characters_long',
      };

      const result = envSchema.safeParse(testEnv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.NODE_ENV).toBe('development');
        expect(result.data.PORT).toBe(3001);
        expect(result.data.HOST).toBe('localhost');
        expect(result.data.CORS_ORIGIN).toBe('http://localhost:5173');
        expect(result.data.DATABASE_PATH).toBe('./data/arcade.db');
        expect(result.data.CHAIN_ID).toBe(338);
        expect(result.data.USDC_DECIMALS).toBe(6);
        expect(result.data.PRIZE_POOL_PERCENTAGE).toBe(70);
      }
    });
  });

  describe('Number Coercion', () => {
    it('should coerce string numbers to numbers', () => {
      const testEnv = {
        ...process.env,
        PORT: '8080',
        CHAIN_ID: '338',
        USDC_DECIMALS: '6',
        JWT_SECRET: 'test_secret_key_at_least_32_characters_long',
      };

      const result = envSchema.safeParse(testEnv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.PORT).toBe(8080);
        expect(typeof result.data.PORT).toBe('number');
        expect(result.data.CHAIN_ID).toBe(338);
        expect(result.data.USDC_DECIMALS).toBe(6);
      }
    });
  });

  describe('Validation Functions', () => {
    it('validateEnv should return success with valid env', () => {
      process.env.JWT_SECRET = 'test_secret_key_at_least_32_characters_long';

      const result = validateEnv();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toBeUndefined();
    });

    it('validateEnv should return errors with invalid env', () => {
      delete process.env.JWT_SECRET;

      const result = validateEnv();

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toBeDefined();
    });

    it('validateEnvOrThrow should return data with valid env', () => {
      process.env.JWT_SECRET = 'test_secret_key_at_least_32_characters_long';

      const env = validateEnvOrThrow();

      expect(env).toBeDefined();
      expect(env.JWT_SECRET).toBe('test_secret_key_at_least_32_characters_long');
    });

    it('validateEnvOrThrow should throw with invalid env', () => {
      delete process.env.JWT_SECRET;

      expect(() => validateEnvOrThrow()).toThrow('Environment validation failed');
    });

    it('validateEnvSafe should return data with valid env', () => {
      process.env.JWT_SECRET = 'test_secret_key_at_least_32_characters_long';

      const env = validateEnvSafe();

      expect(env).toBeDefined();
      expect(env?.JWT_SECRET).toBe('test_secret_key_at_least_32_characters_long');
    });

    it('validateEnvSafe should return undefined with invalid env', () => {
      delete process.env.JWT_SECRET;

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const env = validateEnvSafe();

      expect(env).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith('Environment validation failed:');

      consoleSpy.mockRestore();
    });
  });

  describe('Ethereum Address Validation', () => {
    it('should accept valid Ethereum address', () => {
      const testEnv = {
        ...process.env,
        USDC_CONTRACT_ADDRESS: '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0',
        JWT_SECRET: 'test_secret_key_at_least_32_characters_long',
      };

      const result = envSchema.safeParse(testEnv);

      expect(result.success).toBe(true);
    });

    it('should reject invalid Ethereum address', () => {
      const testEnv = {
        ...process.env,
        USDC_CONTRACT_ADDRESS: 'not_an_address',
        JWT_SECRET: 'test_secret_key_at_least_32_characters_long',
      };

      const result = envSchema.safeParse(testEnv);

      expect(result.success).toBe(false);
    });

    it('should accept missing optional address', () => {
      const testEnv = {
        ...process.env,
        JWT_SECRET: 'test_secret_key_at_least_32_characters_long',
      };
      delete testEnv.USDC_CONTRACT_ADDRESS;

      const result = envSchema.safeParse(testEnv);

      expect(result.success).toBe(true);
    });
  });

  describe('URL Validation', () => {
    it('should accept valid URLs', () => {
      const testEnv = {
        ...process.env,
        RPC_URL: 'https://evm-t3.cronos.org/',
        EXPLORER_URL: 'https://explorer.cronos.org/testnet',
        FACILITATOR_URL: 'https://facilitator.cronoslabs.org',
        JWT_SECRET: 'test_secret_key_at_least_32_characters_long',
      };

      const result = envSchema.safeParse(testEnv);

      expect(result.success).toBe(true);
    });

    it('should reject invalid URLs', () => {
      const testEnv = {
        ...process.env,
        RPC_URL: 'not-a-valid-url',
        JWT_SECRET: 'test_secret_key_at_least_32_characters_long',
      };

      const result = envSchema.safeParse(testEnv);

      expect(result.success).toBe(false);
    });
  });

  describe('Enum Validation', () => {
    it('should accept valid NODE_ENV values', () => {
      const envs = ['development', 'production', 'test'];

      envs.forEach((env) => {
        const testEnv = {
          ...process.env,
          NODE_ENV: env,
          JWT_SECRET: 'test_secret_key_at_least_32_characters_long',
        };

        const result = envSchema.safeParse(testEnv);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid NODE_ENV values', () => {
      const testEnv = {
        ...process.env,
        NODE_ENV: 'staging',
        JWT_SECRET: 'test_secret_key_at_least_32_characters_long',
      };

      const result = envSchema.safeParse(testEnv);

      expect(result.success).toBe(false);
    });
  });

  describe('DATABASE_PATH Validation', () => {
    it('should accept valid database path with .db extension', () => {
      const testEnv = {
        ...process.env,
        DATABASE_PATH: './data/arcade.db',
        JWT_SECRET: 'test_secret_key_at_least_32_characters_long',
      };

      const result = envSchema.safeParse(testEnv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.DATABASE_PATH).toBe('./data/arcade.db');
      }
    });

    it('should accept absolute path with .db extension', () => {
      const testEnv = {
        ...process.env,
        DATABASE_PATH: '/var/lib/x402arcade/production.db',
        JWT_SECRET: 'test_secret_key_at_least_32_characters_long',
      };

      const result = envSchema.safeParse(testEnv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.DATABASE_PATH).toBe('/var/lib/x402arcade/production.db');
      }
    });

    it('should accept memory database path', () => {
      const testEnv = {
        ...process.env,
        DATABASE_PATH: ':memory:',
        JWT_SECRET: 'test_secret_key_at_least_32_characters_long',
      };

      const result = envSchema.safeParse(testEnv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.DATABASE_PATH).toBe(':memory:');
      }
    });

    it('should reject path without .db extension', () => {
      const testEnv = {
        ...process.env,
        DATABASE_PATH: './data/arcade',
        JWT_SECRET: 'test_secret_key_at_least_32_characters_long',
      };

      const result = envSchema.safeParse(testEnv);

      expect(result.success).toBe(false);
      if (!result.success) {
        const dbError = result.error.issues.find((issue) => issue.path.includes('DATABASE_PATH'));
        expect(dbError).toBeDefined();
        expect(dbError?.message).toContain('.db extension');
      }
    });

    it('should reject path with wrong extension', () => {
      const testEnv = {
        ...process.env,
        DATABASE_PATH: './data/arcade.sqlite',
        JWT_SECRET: 'test_secret_key_at_least_32_characters_long',
      };

      const result = envSchema.safeParse(testEnv);

      expect(result.success).toBe(false);
      if (!result.success) {
        const dbError = result.error.issues.find((issue) => issue.path.includes('DATABASE_PATH'));
        expect(dbError).toBeDefined();
        expect(dbError?.message).toContain('.db extension');
      }
    });

    it('should use default value ./data/arcade.db when not specified', () => {
      const testEnv = {
        ...process.env,
        JWT_SECRET: 'test_secret_key_at_least_32_characters_long',
      };
      delete testEnv.DATABASE_PATH;

      const result = envSchema.safeParse(testEnv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.DATABASE_PATH).toBe('./data/arcade.db');
      }
    });

    it('should accept nested directory paths with .db extension', () => {
      const testEnv = {
        ...process.env,
        DATABASE_PATH: './data/backups/2024/january/arcade.db',
        JWT_SECRET: 'test_secret_key_at_least_32_characters_long',
      };

      const result = envSchema.safeParse(testEnv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.DATABASE_PATH).toBe('./data/backups/2024/january/arcade.db');
      }
    });
  });
});
