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
        expect(result.data.CORS_ORIGIN).toEqual([
          'http://localhost:5173',
          'http://localhost:3000',
        ]);
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
  });
});
