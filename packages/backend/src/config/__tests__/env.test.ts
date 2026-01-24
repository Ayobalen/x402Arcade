/**
 * Environment Configuration Tests
 *
 * Tests for Zod schema validation and transformation of environment variables.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { envSchema } from '../env.js';

describe('Environment Configuration', () => {
  describe('CORS_ORIGIN', () => {
    it('should handle single origin as string', () => {
      const result = envSchema.safeParse({
        CORS_ORIGIN: 'http://localhost:5173',
        JWT_SECRET: 'test-secret-key-32-characters-long',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.CORS_ORIGIN).toBe('http://localhost:5173');
        expect(typeof result.data.CORS_ORIGIN).toBe('string');
      }
    });

    it('should transform comma-separated origins into array', () => {
      const result = envSchema.safeParse({
        CORS_ORIGIN: 'http://localhost:5173,http://localhost:3000',
        JWT_SECRET: 'test-secret-key-32-characters-long',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.CORS_ORIGIN).toEqual(['http://localhost:5173', 'http://localhost:3000']);
        expect(Array.isArray(result.data.CORS_ORIGIN)).toBe(true);
      }
    });

    it('should trim whitespace from comma-separated origins', () => {
      const result = envSchema.safeParse({
        CORS_ORIGIN: 'http://localhost:5173,  http://localhost:3000  ,http://localhost:4000',
        JWT_SECRET: 'test-secret-key-32-characters-long',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.CORS_ORIGIN).toEqual([
          'http://localhost:5173',
          'http://localhost:3000',
          'http://localhost:4000',
        ]);
      }
    });

    it('should use default value when not provided', () => {
      const result = envSchema.safeParse({
        JWT_SECRET: 'test-secret-key-32-characters-long',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.CORS_ORIGIN).toBe('http://localhost:5173');
      }
    });
  });

  describe('PORT', () => {
    it('should coerce string to number', () => {
      const result = envSchema.safeParse({
        PORT: '8080',
        JWT_SECRET: 'test-secret-key-32-characters-long',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.PORT).toBe(8080);
        expect(typeof result.data.PORT).toBe('number');
      }
    });

    it('should use default when not provided', () => {
      const result = envSchema.safeParse({
        JWT_SECRET: 'test-secret-key-32-characters-long',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.PORT).toBe(3001);
      }
    });

    it('should reject invalid port numbers', () => {
      const result = envSchema.safeParse({
        PORT: '-1',
        JWT_SECRET: 'test-secret-key-32-characters-long',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('NODE_ENV', () => {
    it('should accept valid environments', () => {
      const envs = ['development', 'production', 'test'];

      envs.forEach((env) => {
        const result = envSchema.safeParse({
          NODE_ENV: env,
          JWT_SECRET: 'test-secret-key-32-characters-long',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.NODE_ENV).toBe(env);
        }
      });
    });

    it('should reject invalid environment', () => {
      const result = envSchema.safeParse({
        NODE_ENV: 'staging',
        JWT_SECRET: 'test-secret-key-32-characters-long',
      });

      expect(result.success).toBe(false);
    });

    it('should default to development', () => {
      const result = envSchema.safeParse({
        JWT_SECRET: 'test-secret-key-32-characters-long',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.NODE_ENV).toBe('development');
      }
    });
  });

  describe('JWT_SECRET', () => {
    it('should require minimum 32 characters', () => {
      const result = envSchema.safeParse({
        JWT_SECRET: 'short',
      });

      expect(result.success).toBe(false);
    });

    it('should accept 32+ character secret', () => {
      const result = envSchema.safeParse({
        JWT_SECRET: 'this-is-a-valid-secret-with-32-chars-or-more',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Blockchain Configuration', () => {
    it('should use Cronos testnet defaults', () => {
      const result = envSchema.safeParse({
        JWT_SECRET: 'test-secret-key-32-characters-long',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.CHAIN_ID).toBe(338);
        expect(result.data.RPC_URL).toBe('https://evm-t3.cronos.org/');
        expect(result.data.EXPLORER_URL).toBe('https://explorer.cronos.org/testnet');
      }
    });

    it('should validate USDC address format', () => {
      const validResult = envSchema.safeParse({
        USDC_CONTRACT_ADDRESS: '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0',
        JWT_SECRET: 'test-secret-key-32-characters-long',
      });

      expect(validResult.success).toBe(true);

      const invalidResult = envSchema.safeParse({
        USDC_CONTRACT_ADDRESS: 'invalid-address',
        JWT_SECRET: 'test-secret-key-32-characters-long',
      });

      expect(invalidResult.success).toBe(false);
    });

    it('should validate CHAIN_ID is 25 or 338', () => {
      // Valid: Cronos mainnet
      const mainnetResult = envSchema.safeParse({
        CHAIN_ID: '25',
        JWT_SECRET: 'test-secret-key-32-characters-long',
      });
      expect(mainnetResult.success).toBe(true);

      // Valid: Cronos testnet
      const testnetResult = envSchema.safeParse({
        CHAIN_ID: '338',
        JWT_SECRET: 'test-secret-key-32-characters-long',
      });
      expect(testnetResult.success).toBe(true);

      // Invalid: Other chain
      const invalidResult = envSchema.safeParse({
        CHAIN_ID: '1',
        JWT_SECRET: 'test-secret-key-32-characters-long',
      });
      expect(invalidResult.success).toBe(false);
    });

    it('should validate RPC_URL is a valid URL', () => {
      const validResult = envSchema.safeParse({
        RPC_URL: 'https://evm-t3.cronos.org/',
        JWT_SECRET: 'test-secret-key-32-characters-long',
      });
      expect(validResult.success).toBe(true);

      const invalidResult = envSchema.safeParse({
        RPC_URL: 'not-a-url',
        JWT_SECRET: 'test-secret-key-32-characters-long',
      });
      expect(invalidResult.success).toBe(false);
    });
  });

  describe('Arcade Wallet Configuration', () => {
    it('should validate ARCADE_WALLET_ADDRESS format', () => {
      // Valid Ethereum address
      const validResult = envSchema.safeParse({
        ARCADE_WALLET_ADDRESS: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
        JWT_SECRET: 'test-secret-key-32-characters-long',
      });
      expect(validResult.success).toBe(true);

      // Invalid address (too short)
      const invalidShort = envSchema.safeParse({
        ARCADE_WALLET_ADDRESS: '0x123',
        JWT_SECRET: 'test-secret-key-32-characters-long',
      });
      expect(invalidShort.success).toBe(false);

      // Invalid address (not hex)
      const invalidFormat = envSchema.safeParse({
        ARCADE_WALLET_ADDRESS: '0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ',
        JWT_SECRET: 'test-secret-key-32-characters-long',
      });
      expect(invalidFormat.success).toBe(false);
    });

    it('should validate ARCADE_PRIVATE_KEY format', () => {
      // Valid private key with 0x prefix
      const validWith0x = envSchema.safeParse({
        ARCADE_PRIVATE_KEY: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        JWT_SECRET: 'test-secret-key-32-characters-long',
      });
      expect(validWith0x.success).toBe(true);
      if (validWith0x.success) {
        // Should strip 0x prefix
        expect(validWith0x.data.ARCADE_PRIVATE_KEY).toBe(
          '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
        );
      }

      // Valid private key without 0x prefix
      const validWithout0x = envSchema.safeParse({
        ARCADE_PRIVATE_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        JWT_SECRET: 'test-secret-key-32-characters-long',
      });
      expect(validWithout0x.success).toBe(true);

      // Invalid: too short
      const invalidShort = envSchema.safeParse({
        ARCADE_PRIVATE_KEY: '0x123',
        JWT_SECRET: 'test-secret-key-32-characters-long',
      });
      expect(invalidShort.success).toBe(false);

      // Invalid: not hex
      const invalidFormat = envSchema.safeParse({
        ARCADE_PRIVATE_KEY: '0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ',
        JWT_SECRET: 'test-secret-key-32-characters-long',
      });
      expect(invalidFormat.success).toBe(false);
    });

    it('should allow optional arcade wallet fields', () => {
      const result = envSchema.safeParse({
        JWT_SECRET: 'test-secret-key-32-characters-long',
        // ARCADE_WALLET_ADDRESS and ARCADE_PRIVATE_KEY omitted
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Database Configuration', () => {
    it('should validate DATABASE_PATH ends with .db', () => {
      const validResult = envSchema.safeParse({
        DATABASE_PATH: './data/arcade.db',
        JWT_SECRET: 'test-secret-key-32-characters-long',
      });
      expect(validResult.success).toBe(true);

      const invalidResult = envSchema.safeParse({
        DATABASE_PATH: './data/arcade.sqlite',
        JWT_SECRET: 'test-secret-key-32-characters-long',
      });
      expect(invalidResult.success).toBe(false);
    });

    it('should allow :memory: for DATABASE_PATH', () => {
      const result = envSchema.safeParse({
        DATABASE_PATH: ':memory:',
        JWT_SECRET: 'test-secret-key-32-characters-long',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Game Pricing Configuration', () => {
    it('should validate SNAKE_PRICE_USDC is positive', () => {
      const validResult = envSchema.safeParse({
        SNAKE_PRICE_USDC: '0.01',
        JWT_SECRET: 'test-secret-key-32-characters-long',
      });
      expect(validResult.success).toBe(true);

      const zeroResult = envSchema.safeParse({
        SNAKE_PRICE_USDC: '0',
        JWT_SECRET: 'test-secret-key-32-characters-long',
      });
      expect(zeroResult.success).toBe(false);

      const negativeResult = envSchema.safeParse({
        SNAKE_PRICE_USDC: '-1',
        JWT_SECRET: 'test-secret-key-32-characters-long',
      });
      expect(negativeResult.success).toBe(false);
    });

    it('should validate TETRIS_PRICE_USDC is positive', () => {
      const validResult = envSchema.safeParse({
        TETRIS_PRICE_USDC: '0.02',
        JWT_SECRET: 'test-secret-key-32-characters-long',
      });
      expect(validResult.success).toBe(true);
    });

    it('should use default prices when not provided', () => {
      const result = envSchema.safeParse({
        JWT_SECRET: 'test-secret-key-32-characters-long',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.SNAKE_PRICE_USDC).toBe(0.01);
        expect(result.data.TETRIS_PRICE_USDC).toBe(0.02);
      }
    });
  });

  describe('Required Fields Validation', () => {
    it('should fail when JWT_SECRET is missing', () => {
      const result = envSchema.safeParse({
        // JWT_SECRET omitted
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const jwtError = result.error.issues.find((i) => i.path.includes('JWT_SECRET'));
        expect(jwtError).toBeDefined();
      }
    });

    it('should succeed with only JWT_SECRET (other fields have defaults)', () => {
      const result = envSchema.safeParse({
        JWT_SECRET: 'this-is-a-valid-32-character-secret-key',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Complete Valid Configuration', () => {
    it('should parse a complete valid configuration', () => {
      const result = envSchema.safeParse({
        NODE_ENV: 'production',
        PORT: '8080',
        HOST: '0.0.0.0',
        CORS_ORIGIN: 'https://example.com',
        DATABASE_PATH: './production.db',
        JWT_SECRET: 'super-secret-production-key-32-chars',
        JWT_EXPIRY_SECONDS: '7200',
        CHAIN_ID: '25',
        RPC_URL: 'https://evm.cronos.org/',
        EXPLORER_URL: 'https://explorer.cronos.org',
        USDC_CONTRACT_ADDRESS: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
        USDC_DECIMALS: '6',
        USDC_DOMAIN_VERSION: '2',
        ARCADE_WALLET_ADDRESS: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
        ARCADE_PRIVATE_KEY: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        FACILITATOR_URL: 'https://facilitator.cronoslabs.org',
        SNAKE_PRICE_USDC: '0.01',
        TETRIS_PRICE_USDC: '0.02',
        PRIZE_POOL_PERCENTAGE: '70',
        SESSION_EXPIRY_MINUTES: '30',
        LOG_LEVEL: 'info',
        LOG_SILENCE: 'false',
        RATE_LIMIT_ENABLED: 'true',
        RATE_LIMIT_MAX_REQUESTS: '100',
        RATE_LIMIT_WINDOW_MS: '60000',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.NODE_ENV).toBe('production');
        expect(result.data.PORT).toBe(8080);
        expect(result.data.CHAIN_ID).toBe(25);
        // Private key should have 0x prefix stripped
        expect(result.data.ARCADE_PRIVATE_KEY).toBe(
          '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
        );
      }
    });
  });
});
