/**
 * Tests for chain constants module
 */

import {
  chainConstants,
  CRONOS_TESTNET_CHAIN_ID,
  DEFAULT_CRONOS_TESTNET_RPC_URL,
  CRONOS_TESTNET_RPC_URL,
  CRONOS_TESTNET_EXPLORER_URL,
  NATIVE_CURRENCY,
  DEFAULT_USDC_CONTRACT_ADDRESS,
  USDC_CONTRACT_ADDRESS,
  getCronosTestnetRpcUrl,
  getExplorerTxUrl,
  getExplorerAddressUrl,
  isValidAddress,
  getUsdcContractAddress,
  type NativeCurrencyConfig,
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
      expect(chainConstants.NATIVE_CURRENCY).toBe(NATIVE_CURRENCY);
      expect(chainConstants.DEFAULT_USDC_CONTRACT_ADDRESS).toBe(DEFAULT_USDC_CONTRACT_ADDRESS);
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

  describe('Explorer URL Constants', () => {
    describe('CRONOS_TESTNET_EXPLORER_URL', () => {
      it('should be exported directly', () => {
        expect(CRONOS_TESTNET_EXPLORER_URL).toBeDefined();
      });

      it('should equal the Cronos Testnet explorer URL', () => {
        expect(CRONOS_TESTNET_EXPLORER_URL).toBe('https://explorer.cronos.org/testnet');
      });

      it('should be a string type', () => {
        expect(typeof CRONOS_TESTNET_EXPLORER_URL).toBe('string');
      });

      it('should be a valid HTTPS URL', () => {
        expect(CRONOS_TESTNET_EXPLORER_URL).toMatch(/^https:\/\//);
      });

      it('should be included in chainConstants object', () => {
        expect(chainConstants.CRONOS_TESTNET_EXPLORER_URL).toBe(CRONOS_TESTNET_EXPLORER_URL);
      });
    });

    describe('getExplorerTxUrl()', () => {
      it('should be a function', () => {
        expect(typeof getExplorerTxUrl).toBe('function');
      });

      it('should generate correct transaction URL with 0x prefix', () => {
        const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
        const expectedUrl = `${CRONOS_TESTNET_EXPLORER_URL}/tx/${txHash}`;
        expect(getExplorerTxUrl(txHash)).toBe(expectedUrl);
      });

      it('should add 0x prefix if missing', () => {
        const txHash = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
        const expectedUrl = `${CRONOS_TESTNET_EXPLORER_URL}/tx/0x${txHash}`;
        expect(getExplorerTxUrl(txHash)).toBe(expectedUrl);
      });

      it('should be included in chainConstants object', () => {
        expect(chainConstants.getExplorerTxUrl).toBe(getExplorerTxUrl);
      });
    });

    describe('getExplorerAddressUrl()', () => {
      it('should be a function', () => {
        expect(typeof getExplorerAddressUrl).toBe('function');
      });

      it('should generate correct address URL with 0x prefix', () => {
        const address = '0x1234567890123456789012345678901234567890';
        const expectedUrl = `${CRONOS_TESTNET_EXPLORER_URL}/address/${address}`;
        expect(getExplorerAddressUrl(address)).toBe(expectedUrl);
      });

      it('should add 0x prefix if missing', () => {
        const address = '1234567890123456789012345678901234567890';
        const expectedUrl = `${CRONOS_TESTNET_EXPLORER_URL}/address/0x${address}`;
        expect(getExplorerAddressUrl(address)).toBe(expectedUrl);
      });

      it('should be included in chainConstants object', () => {
        expect(chainConstants.getExplorerAddressUrl).toBe(getExplorerAddressUrl);
      });
    });
  });

  describe('Native Currency Configuration', () => {
    describe('NATIVE_CURRENCY', () => {
      it('should be exported directly', () => {
        expect(NATIVE_CURRENCY).toBeDefined();
      });

      it('should be an object', () => {
        expect(typeof NATIVE_CURRENCY).toBe('object');
      });

      it('should have name property set to "Cronos Testnet"', () => {
        expect(NATIVE_CURRENCY.name).toBe('Cronos Testnet');
      });

      it('should have symbol property set to "TCRO"', () => {
        expect(NATIVE_CURRENCY.symbol).toBe('TCRO');
      });

      it('should have decimals property set to 18', () => {
        expect(NATIVE_CURRENCY.decimals).toBe(18);
      });

      it('should conform to NativeCurrencyConfig interface', () => {
        const config: NativeCurrencyConfig = NATIVE_CURRENCY;
        expect(config.name).toBeDefined();
        expect(config.symbol).toBeDefined();
        expect(config.decimals).toBeDefined();
      });

      it('should be included in chainConstants object', () => {
        expect(chainConstants.NATIVE_CURRENCY).toBe(NATIVE_CURRENCY);
      });
    });
  });

  describe('USDC Contract Address Constants', () => {
    const originalEnv = process.env.USDC_CONTRACT_ADDRESS;

    afterEach(() => {
      // Restore original environment
      if (originalEnv !== undefined) {
        process.env.USDC_CONTRACT_ADDRESS = originalEnv;
      } else {
        delete process.env.USDC_CONTRACT_ADDRESS;
      }
    });

    describe('DEFAULT_USDC_CONTRACT_ADDRESS', () => {
      it('should be exported directly', () => {
        expect(DEFAULT_USDC_CONTRACT_ADDRESS).toBeDefined();
      });

      it('should equal the devUSDC.e contract address', () => {
        expect(DEFAULT_USDC_CONTRACT_ADDRESS).toBe('0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0');
      });

      it('should be a string type', () => {
        expect(typeof DEFAULT_USDC_CONTRACT_ADDRESS).toBe('string');
      });

      it('should have valid address format (0x + 40 hex chars)', () => {
        expect(DEFAULT_USDC_CONTRACT_ADDRESS).toMatch(/^0x[a-fA-F0-9]{40}$/);
      });

      it('should be included in chainConstants object', () => {
        expect(chainConstants.DEFAULT_USDC_CONTRACT_ADDRESS).toBe(DEFAULT_USDC_CONTRACT_ADDRESS);
      });
    });

    describe('USDC_CONTRACT_ADDRESS', () => {
      it('should be exported directly', () => {
        expect(USDC_CONTRACT_ADDRESS).toBeDefined();
      });

      it('should be a string type', () => {
        expect(typeof USDC_CONTRACT_ADDRESS).toBe('string');
      });

      it('should be included in chainConstants object', () => {
        expect(chainConstants.USDC_CONTRACT_ADDRESS).toBe(USDC_CONTRACT_ADDRESS);
      });
    });

    describe('isValidAddress()', () => {
      it('should be a function', () => {
        expect(typeof isValidAddress).toBe('function');
      });

      it('should return true for valid address with 0x prefix', () => {
        expect(isValidAddress('0x1234567890123456789012345678901234567890')).toBe(true);
      });

      it('should return true for valid address with mixed case hex', () => {
        expect(isValidAddress('0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0')).toBe(true);
      });

      it('should return false for address without 0x prefix', () => {
        expect(isValidAddress('1234567890123456789012345678901234567890')).toBe(false);
      });

      it('should return false for address with wrong length', () => {
        expect(isValidAddress('0x12345678901234567890123456789012345678')).toBe(false);
        expect(isValidAddress('0x123456789012345678901234567890123456789012')).toBe(false);
      });

      it('should return false for address with non-hex characters', () => {
        expect(isValidAddress('0xGGGG567890123456789012345678901234567890')).toBe(false);
      });

      it('should be included in chainConstants object', () => {
        expect(chainConstants.isValidAddress).toBe(isValidAddress);
      });
    });

    describe('getUsdcContractAddress()', () => {
      it('should be a function', () => {
        expect(typeof getUsdcContractAddress).toBe('function');
      });

      it('should return default address when env is not set', () => {
        delete process.env.USDC_CONTRACT_ADDRESS;
        expect(getUsdcContractAddress()).toBe(DEFAULT_USDC_CONTRACT_ADDRESS);
      });

      it('should return environment variable when set with valid address', () => {
        const customAddress = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';
        process.env.USDC_CONTRACT_ADDRESS = customAddress;
        expect(getUsdcContractAddress()).toBe(customAddress);
      });

      it('should throw error when env is set with invalid address', () => {
        process.env.USDC_CONTRACT_ADDRESS = 'invalid-address';
        expect(() => getUsdcContractAddress()).toThrow('Invalid USDC_CONTRACT_ADDRESS format');
      });

      it('should throw error when env is set with wrong length', () => {
        process.env.USDC_CONTRACT_ADDRESS = '0x123';
        expect(() => getUsdcContractAddress()).toThrow('Invalid USDC_CONTRACT_ADDRESS format');
      });

      it('should be included in chainConstants object', () => {
        expect(chainConstants.getUsdcContractAddress).toBe(getUsdcContractAddress);
      });
    });
  });
});
