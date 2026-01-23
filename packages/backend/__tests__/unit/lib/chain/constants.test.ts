/**
 * Tests for chain constants module
 */

import {
  chainConstants,
  CRONOS_TESTNET_CHAIN_ID,
  DEFAULT_CRONOS_TESTNET_RPC_URL,
  CRONOS_TESTNET_RPC_URL,
  CRONOS_TESTNET_EXPLORER_URL,
  getCronosTestnetRpcUrl,
  getExplorerTxUrl,
  getExplorerAddressUrl,
} from '../../../../src/lib/chain/constants.js';

describe('Chain Constants', () => {
  describe('chainConstants object', () => {
    it('should export chainConstants object', () => {
      expect(chainConstants).toBeDefined();
      expect(typeof chainConstants).toBe('object');
    });

    it('should be importable as default export', async () => {
      const module = await import('../../../../src/lib/chain/constants.js');
      expect(module.default).toBeDefined();
      expect(module.default).toBe(chainConstants);
    });

    it('should be importable from index', async () => {
      const module = await import('../../../../src/lib/chain/index.js');
      expect(module.chainConstants).toBeDefined();
      expect(module.chainConstants).toBe(chainConstants);
    });

    it('should contain all defined constants', () => {
      expect(chainConstants.CRONOS_TESTNET_CHAIN_ID).toBe(338);
      expect(chainConstants.DEFAULT_CRONOS_TESTNET_RPC_URL).toBe('https://evm-t3.cronos.org/');
      expect(chainConstants.CRONOS_TESTNET_EXPLORER_URL).toBe('https://explorer.cronos.org/testnet');
    });
  });

  describe('CRONOS_TESTNET_CHAIN_ID', () => {
    it('should be exported directly', () => {
      expect(CRONOS_TESTNET_CHAIN_ID).toBeDefined();
    });

    it('should equal 338', () => {
      expect(CRONOS_TESTNET_CHAIN_ID).toBe(338);
    });

    it('should be a number type', () => {
      expect(typeof CRONOS_TESTNET_CHAIN_ID).toBe('number');
    });

    it('should be included in chainConstants object', () => {
      expect(chainConstants.CRONOS_TESTNET_CHAIN_ID).toBe(CRONOS_TESTNET_CHAIN_ID);
    });
  });

  describe('RPC URL Constants', () => {
    const originalEnv = process.env.RPC_URL;

    afterEach(() => {
      // Restore original environment
      if (originalEnv !== undefined) {
        process.env.RPC_URL = originalEnv;
      } else {
        delete process.env.RPC_URL;
      }
    });

    describe('DEFAULT_CRONOS_TESTNET_RPC_URL', () => {
      it('should be exported directly', () => {
        expect(DEFAULT_CRONOS_TESTNET_RPC_URL).toBeDefined();
      });

      it('should equal the Cronos Testnet RPC endpoint', () => {
        expect(DEFAULT_CRONOS_TESTNET_RPC_URL).toBe('https://evm-t3.cronos.org/');
      });

      it('should be a string type', () => {
        expect(typeof DEFAULT_CRONOS_TESTNET_RPC_URL).toBe('string');
      });

      it('should be a valid HTTPS URL', () => {
        expect(DEFAULT_CRONOS_TESTNET_RPC_URL).toMatch(/^https:\/\//);
      });
    });

    describe('CRONOS_TESTNET_RPC_URL', () => {
      it('should be exported directly', () => {
        expect(CRONOS_TESTNET_RPC_URL).toBeDefined();
      });

      it('should be a string type', () => {
        expect(typeof CRONOS_TESTNET_RPC_URL).toBe('string');
      });

      it('should be included in chainConstants object', () => {
        expect(chainConstants.CRONOS_TESTNET_RPC_URL).toBe(CRONOS_TESTNET_RPC_URL);
      });
    });

    describe('getCronosTestnetRpcUrl()', () => {
      it('should be a function', () => {
        expect(typeof getCronosTestnetRpcUrl).toBe('function');
      });

      it('should return default URL when RPC_URL env is not set', () => {
        delete process.env.RPC_URL;
        expect(getCronosTestnetRpcUrl()).toBe(DEFAULT_CRONOS_TESTNET_RPC_URL);
      });

      it('should return environment variable when RPC_URL is set', () => {
        const customUrl = 'https://custom-rpc.example.com/';
        process.env.RPC_URL = customUrl;
        expect(getCronosTestnetRpcUrl()).toBe(customUrl);
      });

      it('should be included in chainConstants object', () => {
        expect(chainConstants.getCronosTestnetRpcUrl).toBe(getCronosTestnetRpcUrl);
      });
    });
  });
});
