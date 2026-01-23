/**
 * Tests for chain constants module
 */

import {
  chainConstants,
  CRONOS_TESTNET_CHAIN_ID,
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
});
