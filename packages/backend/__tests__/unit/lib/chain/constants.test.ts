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
  USDC_NAME,
  USDC_DECIMALS,
  USDC_VERSION,
  parseUSDC,
  formatUSDC,
  formatUSDCWithSymbol,
  EIP712_DOMAIN_TYPE,
  getUsdcEip712Domain,
  createEip712Domain,
  TRANSFER_WITH_AUTHORIZATION_TYPE,
  createTransferWithAuthorizationMessage,
  isAuthorizationValid,
  generateAuthorizationNonce,
  type NativeCurrencyConfig,
  type TypedDataField,
  type EIP712Domain,
  type TransferWithAuthorizationMessage,
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

  describe('USDC Token Constants', () => {
    describe('USDC_NAME', () => {
      it('should be exported directly', () => {
        expect(USDC_NAME).toBeDefined();
      });

      it('should equal "Bridged USDC (Stargate)"', () => {
        expect(USDC_NAME).toBe('Bridged USDC (Stargate)');
      });

      it('should be a string type', () => {
        expect(typeof USDC_NAME).toBe('string');
      });

      it('should be included in chainConstants object', () => {
        expect(chainConstants.USDC_NAME).toBe(USDC_NAME);
      });
    });

    describe('USDC_DECIMALS', () => {
      it('should be exported directly', () => {
        expect(USDC_DECIMALS).toBeDefined();
      });

      it('should equal 6', () => {
        expect(USDC_DECIMALS).toBe(6);
      });

      it('should be a number type', () => {
        expect(typeof USDC_DECIMALS).toBe('number');
      });

      it('should be included in chainConstants object', () => {
        expect(chainConstants.USDC_DECIMALS).toBe(USDC_DECIMALS);
      });
    });

    describe('USDC_VERSION', () => {
      it('should be exported directly', () => {
        expect(USDC_VERSION).toBeDefined();
      });

      it('should equal "1" for testnet', () => {
        expect(USDC_VERSION).toBe('1');
      });

      it('should be a string type', () => {
        expect(typeof USDC_VERSION).toBe('string');
      });

      it('should be included in chainConstants object', () => {
        expect(chainConstants.USDC_VERSION).toBe(USDC_VERSION);
      });
    });
  });

  describe('USDC Parse/Format Functions', () => {
    describe('parseUSDC()', () => {
      it('should be a function', () => {
        expect(typeof parseUSDC).toBe('function');
      });

      it('should parse "1.50" to 1500000n', () => {
        expect(parseUSDC('1.50')).toBe(1500000n);
      });

      it('should parse 0.01 to 10000n', () => {
        expect(parseUSDC(0.01)).toBe(10000n);
      });

      it('should parse "100" to 100000000n', () => {
        expect(parseUSDC('100')).toBe(100000000n);
      });

      it('should parse 0 to 0n', () => {
        expect(parseUSDC(0)).toBe(0n);
      });

      it('should throw for negative values', () => {
        expect(() => parseUSDC(-1)).toThrow('cannot be negative');
      });

      it('should throw for invalid strings', () => {
        expect(() => parseUSDC('invalid')).toThrow('Invalid USDC amount');
      });

      it('should be included in chainConstants object', () => {
        expect(chainConstants.parseUSDC).toBe(parseUSDC);
      });
    });

    describe('formatUSDC()', () => {
      it('should be a function', () => {
        expect(typeof formatUSDC).toBe('function');
      });

      it('should format 1500000n to "1.50"', () => {
        expect(formatUSDC(1500000n)).toBe('1.50');
      });

      it('should format 10000n to "0.01"', () => {
        expect(formatUSDC(10000n)).toBe('0.01');
      });

      it('should format 100000000n to "100.00"', () => {
        expect(formatUSDC(100000000n)).toBe('100.00');
      });

      it('should format with custom decimal places', () => {
        expect(formatUSDC(1500000n, 6)).toBe('1.500000');
      });

      it('should format minimum unit correctly', () => {
        expect(formatUSDC(1n, 6)).toBe('0.000001');
      });

      it('should be included in chainConstants object', () => {
        expect(chainConstants.formatUSDC).toBe(formatUSDC);
      });
    });

    describe('formatUSDCWithSymbol()', () => {
      it('should be a function', () => {
        expect(typeof formatUSDCWithSymbol).toBe('function');
      });

      it('should format with $ prefix', () => {
        expect(formatUSDCWithSymbol(1500000n)).toBe('$1.50');
      });

      it('should format small amounts with $ prefix', () => {
        expect(formatUSDCWithSymbol(10000n)).toBe('$0.01');
      });

      it('should be included in chainConstants object', () => {
        expect(chainConstants.formatUSDCWithSymbol).toBe(formatUSDCWithSymbol);
      });
    });

    describe('parseUSDC/formatUSDC round-trip', () => {
      it('should round-trip "1.50" correctly', () => {
        const parsed = parseUSDC('1.50');
        const formatted = formatUSDC(parsed);
        expect(formatted).toBe('1.50');
      });

      it('should round-trip "0.01" correctly', () => {
        const parsed = parseUSDC('0.01');
        const formatted = formatUSDC(parsed);
        expect(formatted).toBe('0.01');
      });

      it('should round-trip "100.00" correctly', () => {
        const parsed = parseUSDC('100.00');
        const formatted = formatUSDC(parsed);
        expect(formatted).toBe('100.00');
      });

      it('should round-trip whole numbers', () => {
        const parsed = parseUSDC(5);
        const formatted = formatUSDC(parsed);
        expect(formatted).toBe('5.00');
      });
    });
  });

  describe('EIP-712 Domain Type', () => {
    describe('EIP712_DOMAIN_TYPE', () => {
      it('should be exported directly', () => {
        expect(EIP712_DOMAIN_TYPE).toBeDefined();
      });

      it('should be an array', () => {
        expect(Array.isArray(EIP712_DOMAIN_TYPE)).toBe(true);
      });

      it('should have 4 fields', () => {
        expect(EIP712_DOMAIN_TYPE).toHaveLength(4);
      });

      it('should have name field with type string', () => {
        const nameField = EIP712_DOMAIN_TYPE.find(f => f.name === 'name');
        expect(nameField).toBeDefined();
        expect(nameField?.type).toBe('string');
      });

      it('should have version field with type string', () => {
        const versionField = EIP712_DOMAIN_TYPE.find(f => f.name === 'version');
        expect(versionField).toBeDefined();
        expect(versionField?.type).toBe('string');
      });

      it('should have chainId field with type uint256', () => {
        const chainIdField = EIP712_DOMAIN_TYPE.find(f => f.name === 'chainId');
        expect(chainIdField).toBeDefined();
        expect(chainIdField?.type).toBe('uint256');
      });

      it('should have verifyingContract field with type address', () => {
        const contractField = EIP712_DOMAIN_TYPE.find(f => f.name === 'verifyingContract');
        expect(contractField).toBeDefined();
        expect(contractField?.type).toBe('address');
      });

      it('should conform to TypedDataField array type', () => {
        const fields: readonly TypedDataField[] = EIP712_DOMAIN_TYPE;
        expect(fields.every(f => typeof f.name === 'string' && typeof f.type === 'string')).toBe(true);
      });

      it('should be included in chainConstants object', () => {
        expect(chainConstants.EIP712_DOMAIN_TYPE).toBe(EIP712_DOMAIN_TYPE);
      });
    });

    describe('getUsdcEip712Domain()', () => {
      it('should be a function', () => {
        expect(typeof getUsdcEip712Domain).toBe('function');
      });

      it('should return domain with correct name', () => {
        const domain = getUsdcEip712Domain();
        expect(domain.name).toBe(USDC_NAME);
      });

      it('should return domain with correct version', () => {
        const domain = getUsdcEip712Domain();
        expect(domain.version).toBe(USDC_VERSION);
      });

      it('should return domain with correct chainId', () => {
        const domain = getUsdcEip712Domain();
        expect(domain.chainId).toBe(CRONOS_TESTNET_CHAIN_ID);
      });

      it('should return domain with correct verifyingContract', () => {
        const domain = getUsdcEip712Domain();
        expect(domain.verifyingContract).toBe(DEFAULT_USDC_CONTRACT_ADDRESS);
      });

      it('should conform to EIP712Domain interface', () => {
        const domain: EIP712Domain = getUsdcEip712Domain();
        expect(domain.name).toBeDefined();
        expect(domain.version).toBeDefined();
        expect(domain.chainId).toBeDefined();
        expect(domain.verifyingContract).toBeDefined();
      });

      it('should be included in chainConstants object', () => {
        expect(chainConstants.getUsdcEip712Domain).toBe(getUsdcEip712Domain);
      });
    });

    describe('createEip712Domain()', () => {
      it('should be a function', () => {
        expect(typeof createEip712Domain).toBe('function');
      });

      it('should create domain with provided values', () => {
        const domain = createEip712Domain({
          name: 'TestToken',
          version: '2',
          chainId: 25,
          verifyingContract: '0x1234567890123456789012345678901234567890',
        });
        expect(domain.name).toBe('TestToken');
        expect(domain.version).toBe('2');
        expect(domain.chainId).toBe(25);
        expect(domain.verifyingContract).toBe('0x1234567890123456789012345678901234567890');
      });

      it('should accept bigint chainId', () => {
        const domain = createEip712Domain({
          name: 'Test',
          version: '1',
          chainId: 338n,
          verifyingContract: '0x1234567890123456789012345678901234567890',
        });
        expect(domain.chainId).toBe(338n);
      });

      it('should throw for invalid verifyingContract address', () => {
        expect(() =>
          createEip712Domain({
            name: 'Test',
            version: '1',
            chainId: 338,
            verifyingContract: 'invalid-address',
          }),
        ).toThrow('Invalid verifyingContract address');
      });

      it('should be included in chainConstants object', () => {
        expect(chainConstants.createEip712Domain).toBe(createEip712Domain);
      });
    });
  });

  describe('EIP-3009 TransferWithAuthorization Type', () => {
    describe('TRANSFER_WITH_AUTHORIZATION_TYPE', () => {
      it('should be exported directly', () => {
        expect(TRANSFER_WITH_AUTHORIZATION_TYPE).toBeDefined();
      });

      it('should be an array', () => {
        expect(Array.isArray(TRANSFER_WITH_AUTHORIZATION_TYPE)).toBe(true);
      });

      it('should have 6 fields', () => {
        expect(TRANSFER_WITH_AUTHORIZATION_TYPE).toHaveLength(6);
      });

      it('should have from field with type address', () => {
        const field = TRANSFER_WITH_AUTHORIZATION_TYPE.find(f => f.name === 'from');
        expect(field).toBeDefined();
        expect(field?.type).toBe('address');
      });

      it('should have to field with type address', () => {
        const field = TRANSFER_WITH_AUTHORIZATION_TYPE.find(f => f.name === 'to');
        expect(field).toBeDefined();
        expect(field?.type).toBe('address');
      });

      it('should have value field with type uint256', () => {
        const field = TRANSFER_WITH_AUTHORIZATION_TYPE.find(f => f.name === 'value');
        expect(field).toBeDefined();
        expect(field?.type).toBe('uint256');
      });

      it('should have validAfter field with type uint256', () => {
        const field = TRANSFER_WITH_AUTHORIZATION_TYPE.find(f => f.name === 'validAfter');
        expect(field).toBeDefined();
        expect(field?.type).toBe('uint256');
      });

      it('should have validBefore field with type uint256', () => {
        const field = TRANSFER_WITH_AUTHORIZATION_TYPE.find(f => f.name === 'validBefore');
        expect(field).toBeDefined();
        expect(field?.type).toBe('uint256');
      });

      it('should have nonce field with type bytes32', () => {
        const field = TRANSFER_WITH_AUTHORIZATION_TYPE.find(f => f.name === 'nonce');
        expect(field).toBeDefined();
        expect(field?.type).toBe('bytes32');
      });

      it('should be included in chainConstants object', () => {
        expect(chainConstants.TRANSFER_WITH_AUTHORIZATION_TYPE).toBe(TRANSFER_WITH_AUTHORIZATION_TYPE);
      });
    });

    describe('createTransferWithAuthorizationMessage()', () => {
      const validFrom = '0x1234567890123456789012345678901234567890';
      const validTo = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';
      const validNonce = '0x' + '1234567890abcdef'.repeat(4);

      it('should be a function', () => {
        expect(typeof createTransferWithAuthorizationMessage).toBe('function');
      });

      it('should create message with required fields', () => {
        const message = createTransferWithAuthorizationMessage({
          from: validFrom,
          to: validTo,
          value: 10000n,
          nonce: validNonce,
        });
        expect(message.from).toBe(validFrom);
        expect(message.to).toBe(validTo);
        expect(message.value).toBe('10000');
        expect(message.nonce).toBe(validNonce);
      });

      it('should set validAfter to 0 by default', () => {
        const message = createTransferWithAuthorizationMessage({
          from: validFrom,
          to: validTo,
          value: 10000n,
          nonce: validNonce,
        });
        expect(message.validAfter).toBe('0');
      });

      it('should use validitySeconds to calculate validBefore', () => {
        const before = Math.floor(Date.now() / 1000);
        const message = createTransferWithAuthorizationMessage({
          from: validFrom,
          to: validTo,
          value: 10000n,
          nonce: validNonce,
          validitySeconds: 3600,
        });
        const after = Math.floor(Date.now() / 1000);
        const validBefore = Number(message.validBefore);
        expect(validBefore).toBeGreaterThanOrEqual(before + 3600);
        expect(validBefore).toBeLessThanOrEqual(after + 3600);
      });

      it('should accept explicit validBefore', () => {
        const message = createTransferWithAuthorizationMessage({
          from: validFrom,
          to: validTo,
          value: 10000n,
          nonce: validNonce,
          validBefore: 1735689600,
        });
        expect(message.validBefore).toBe('1735689600');
      });

      it('should throw for invalid from address', () => {
        expect(() =>
          createTransferWithAuthorizationMessage({
            from: 'invalid',
            to: validTo,
            value: 10000n,
            nonce: validNonce,
          }),
        ).toThrow("Invalid 'from' address");
      });

      it('should throw for invalid to address', () => {
        expect(() =>
          createTransferWithAuthorizationMessage({
            from: validFrom,
            to: 'invalid',
            value: 10000n,
            nonce: validNonce,
          }),
        ).toThrow("Invalid 'to' address");
      });

      it('should throw for invalid nonce format', () => {
        expect(() =>
          createTransferWithAuthorizationMessage({
            from: validFrom,
            to: validTo,
            value: 10000n,
            nonce: '0x123', // Too short
          }),
        ).toThrow('Invalid nonce format');
      });

      it('should conform to TransferWithAuthorizationMessage interface', () => {
        const message: TransferWithAuthorizationMessage = createTransferWithAuthorizationMessage({
          from: validFrom,
          to: validTo,
          value: 10000n,
          nonce: validNonce,
        });
        expect(message.from).toBeDefined();
        expect(message.to).toBeDefined();
        expect(message.value).toBeDefined();
        expect(message.validAfter).toBeDefined();
        expect(message.validBefore).toBeDefined();
        expect(message.nonce).toBeDefined();
      });

      it('should be included in chainConstants object', () => {
        expect(chainConstants.createTransferWithAuthorizationMessage).toBe(createTransferWithAuthorizationMessage);
      });
    });

    describe('isAuthorizationValid()', () => {
      const validFrom = '0x1234567890123456789012345678901234567890';
      const validTo = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';
      const validNonce = '0x' + '1234567890abcdef'.repeat(4);

      it('should be a function', () => {
        expect(typeof isAuthorizationValid).toBe('function');
      });

      it('should return true for valid authorization', () => {
        const now = Math.floor(Date.now() / 1000);
        const message: TransferWithAuthorizationMessage = {
          from: validFrom,
          to: validTo,
          value: '10000',
          validAfter: (now - 100).toString(),
          validBefore: (now + 3600).toString(),
          nonce: validNonce,
        };
        expect(isAuthorizationValid(message)).toBe(true);
      });

      it('should return false for expired authorization', () => {
        const now = Math.floor(Date.now() / 1000);
        const message: TransferWithAuthorizationMessage = {
          from: validFrom,
          to: validTo,
          value: '10000',
          validAfter: (now - 7200).toString(),
          validBefore: (now - 3600).toString(), // Expired 1 hour ago
          nonce: validNonce,
        };
        expect(isAuthorizationValid(message)).toBe(false);
      });

      it('should return false for not yet valid authorization', () => {
        const now = Math.floor(Date.now() / 1000);
        const message: TransferWithAuthorizationMessage = {
          from: validFrom,
          to: validTo,
          value: '10000',
          validAfter: (now + 3600).toString(), // Valid in 1 hour
          validBefore: (now + 7200).toString(),
          nonce: validNonce,
        };
        expect(isAuthorizationValid(message)).toBe(false);
      });

      it('should be included in chainConstants object', () => {
        expect(chainConstants.isAuthorizationValid).toBe(isAuthorizationValid);
      });
    });

    describe('generateAuthorizationNonce()', () => {
      it('should be a function', () => {
        expect(typeof generateAuthorizationNonce).toBe('function');
      });

      it('should return a string', () => {
        const nonce = generateAuthorizationNonce();
        expect(typeof nonce).toBe('string');
      });

      it('should start with 0x prefix', () => {
        const nonce = generateAuthorizationNonce();
        expect(nonce.startsWith('0x')).toBe(true);
      });

      it('should be 66 characters long (0x + 64 hex chars)', () => {
        const nonce = generateAuthorizationNonce();
        expect(nonce).toHaveLength(66);
      });

      it('should contain only valid hex characters after prefix', () => {
        const nonce = generateAuthorizationNonce();
        expect(nonce).toMatch(/^0x[a-f0-9]{64}$/);
      });

      it('should generate unique nonces', () => {
        const nonces = new Set<string>();
        for (let i = 0; i < 100; i++) {
          nonces.add(generateAuthorizationNonce());
        }
        expect(nonces.size).toBe(100);
      });

      it('should be included in chainConstants object', () => {
        expect(chainConstants.generateAuthorizationNonce).toBe(generateAuthorizationNonce);
      });
    });
  });
});
