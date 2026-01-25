/**
 * USDC Mock Utilities Tests
 *
 * Tests for the mock USDC contract implementation used in E2E tests.
 * Validates EIP-3009 transferWithAuthorization behavior and replay protection.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  MockUSDCContract,
  USDCMockManager,
  createMockBalances,
  generateTestNonce,
  createTestTransferParams,
  type TransferWithAuthorizationParams,
} from '../usdc-mock';
import { parseUSDC } from '../../../packages/backend/src/lib/chain/constants';

describe('MockUSDCContract', () => {
  let usdc: MockUSDCContract;

  beforeEach(() => {
    usdc = new MockUSDCContract();
  });

  describe('Contract Metadata', () => {
    it('should have correct contract address', () => {
      expect(usdc.address()).toBe('0xc01efaaf7c5c61bebfaeb358e1161b537b8bc0e0');
    });

    it('should have correct token name', () => {
      expect(usdc.tokenName()).toBe('Bridged USDC (Stargate)');
    });

    it('should have correct token symbol', () => {
      expect(usdc.tokenSymbol()).toBe('devUSDC.e');
    });

    it('should have 6 decimals', () => {
      expect(usdc.tokenDecimals()).toBe(6);
    });

    it('should allow custom contract address', () => {
      const customUsdc = new MockUSDCContract('0x1234567890123456789012345678901234567890');
      expect(customUsdc.address()).toBe('0x1234567890123456789012345678901234567890');
    });
  });

  describe('balanceOf', () => {
    const testAddress = '0x1234567890123456789012345678901234567890';

    it('should return 0 for addresses with no balance', () => {
      const balance = usdc.balanceOf(testAddress);
      expect(balance).toBe(0n);
    });

    it('should return correct balance after setting', () => {
      usdc.setBalance(testAddress, parseUSDC(100));
      const balance = usdc.balanceOf(testAddress);
      expect(balance).toBe(100000000n); // 100 USDC in smallest units
    });

    it('should handle addresses case-insensitively', () => {
      usdc.setBalance(testAddress.toUpperCase(), parseUSDC(50));
      const balance = usdc.balanceOf(testAddress.toLowerCase());
      expect(balance).toBe(50000000n);
    });

    it('should handle bigint amounts', () => {
      usdc.setBalance(testAddress, 1500000n);
      const balance = usdc.balanceOf(testAddress);
      expect(balance).toBe(1500000n);
    });

    it('should handle string amounts', () => {
      usdc.setBalance(testAddress, '2500000');
      const balance = usdc.balanceOf(testAddress);
      expect(balance).toBe(2500000n);
    });

    it('should handle number amounts', () => {
      usdc.setBalance(testAddress, 3500000);
      const balance = usdc.balanceOf(testAddress);
      expect(balance).toBe(3500000n);
    });
  });

  describe('setBalance', () => {
    const testAddress = '0x1234567890123456789012345678901234567890';

    it('should reject negative balances', () => {
      expect(() => {
        usdc.setBalance(testAddress, -100n);
      }).toThrow('Balance cannot be negative');
    });

    it('should allow zero balance', () => {
      usdc.setBalance(testAddress, parseUSDC(100));
      usdc.setBalance(testAddress, 0n);
      expect(usdc.balanceOf(testAddress)).toBe(0n);
    });

    it('should update existing balances', () => {
      usdc.setBalance(testAddress, parseUSDC(100));
      expect(usdc.balanceOf(testAddress)).toBe(100000000n);

      usdc.setBalance(testAddress, parseUSDC(200));
      expect(usdc.balanceOf(testAddress)).toBe(200000000n);
    });
  });

  describe('transferWithAuthorization', () => {
    const fromAddress = '0x1111111111111111111111111111111111111111';
    const toAddress = '0x2222222222222222222222222222222222222222';

    beforeEach(() => {
      // Fund the sender with 100 USDC
      usdc.setBalance(fromAddress, parseUSDC(100));
    });

    it('should execute valid transfer successfully', async () => {
      const params = createTestTransferParams({
        from: fromAddress,
        to: toAddress,
        amountUSDC: 10,
      });

      const txHash = await usdc.transferWithAuthorization(params);

      // Check transaction hash format
      expect(txHash).toMatch(/^0x[a-f0-9]{64}$/);

      // Check balances updated
      expect(usdc.balanceOf(fromAddress)).toBe(parseUSDC(90));
      expect(usdc.balanceOf(toAddress)).toBe(parseUSDC(10));
    });

    it('should emit transfer event', async () => {
      const params = createTestTransferParams({
        from: fromAddress,
        to: toAddress,
        amountUSDC: 5,
      });

      await usdc.transferWithAuthorization(params);

      const events = usdc.getTransferEvents();
      expect(events).toHaveLength(1);
      expect(events[0].from).toBe(fromAddress.toLowerCase());
      expect(events[0].to).toBe(toAddress.toLowerCase());
      expect(events[0].value).toBe(parseUSDC(5));
      expect(events[0].timestamp).toBeGreaterThan(0);
    });

    it('should emit authorization used event', async () => {
      const params = createTestTransferParams({
        from: fromAddress,
        to: toAddress,
        amountUSDC: 5,
      });

      await usdc.transferWithAuthorization(params);

      const events = usdc.getAuthorizationUsedEvents();
      expect(events).toHaveLength(1);
      expect(events[0].authorizer).toBe(fromAddress.toLowerCase());
      expect(events[0].nonce).toBe(params.nonce);
      expect(events[0].timestamp).toBeGreaterThan(0);
    });

    it('should reject transfer with invalid from address', async () => {
      const params = createTestTransferParams({
        from: 'invalid-address',
        to: toAddress,
        amountUSDC: 10,
      });

      await expect(usdc.transferWithAuthorization(params)).rejects.toThrow('Invalid from address');
    });

    it('should reject transfer with invalid to address', async () => {
      const params = createTestTransferParams({
        from: fromAddress,
        to: 'invalid-address',
        amountUSDC: 10,
      });

      await expect(usdc.transferWithAuthorization(params)).rejects.toThrow('Invalid to address');
    });

    it('should reject transfer with invalid nonce format', async () => {
      const params: TransferWithAuthorizationParams = {
        from: fromAddress,
        to: toAddress,
        value: parseUSDC(10),
        validAfter: 0n,
        validBefore: BigInt(Math.floor(Date.now() / 1000) + 3600),
        nonce: '0x123', // Too short
        v: 27,
        r: '0x' + '1'.repeat(64),
        s: '0x' + '2'.repeat(64),
      };

      await expect(usdc.transferWithAuthorization(params)).rejects.toThrow('Invalid nonce format');
    });

    it('should reject transfer with invalid v value', async () => {
      const params = createTestTransferParams({
        from: fromAddress,
        to: toAddress,
        amountUSDC: 10,
      });
      params.v = 26; // Invalid (must be 27 or 28)

      await expect(usdc.transferWithAuthorization(params)).rejects.toThrow('Invalid v value');
    });

    it('should reject transfer with invalid r value', async () => {
      const params = createTestTransferParams({
        from: fromAddress,
        to: toAddress,
        amountUSDC: 10,
      });
      params.r = '0x123'; // Too short

      await expect(usdc.transferWithAuthorization(params)).rejects.toThrow('Invalid r value');
    });

    it('should reject transfer with invalid s value', async () => {
      const params = createTestTransferParams({
        from: fromAddress,
        to: toAddress,
        amountUSDC: 10,
      });
      params.s = '0x123'; // Too short

      await expect(usdc.transferWithAuthorization(params)).rejects.toThrow('Invalid s value');
    });

    it('should reject transfer not yet valid', async () => {
      const now = Math.floor(Date.now() / 1000);
      const params: TransferWithAuthorizationParams = {
        from: fromAddress,
        to: toAddress,
        value: parseUSDC(10),
        validAfter: BigInt(now + 3600), // Valid in 1 hour
        validBefore: BigInt(now + 7200),
        nonce: generateTestNonce(),
        v: 27,
        r: '0x' + '1'.repeat(64),
        s: '0x' + '2'.repeat(64),
      };

      await expect(usdc.transferWithAuthorization(params)).rejects.toThrow(
        'Authorization not yet valid'
      );
    });

    it('should reject expired transfer', async () => {
      const now = Math.floor(Date.now() / 1000);
      const params: TransferWithAuthorizationParams = {
        from: fromAddress,
        to: toAddress,
        value: parseUSDC(10),
        validAfter: BigInt(now - 7200),
        validBefore: BigInt(now - 3600), // Expired 1 hour ago
        nonce: generateTestNonce(),
        v: 27,
        r: '0x' + '1'.repeat(64),
        s: '0x' + '2'.repeat(64),
      };

      await expect(usdc.transferWithAuthorization(params)).rejects.toThrow('Authorization expired');
    });

    it('should reject transfer with insufficient balance', async () => {
      const params = createTestTransferParams({
        from: fromAddress,
        to: toAddress,
        amountUSDC: 150, // More than the 100 USDC balance
      });

      await expect(usdc.transferWithAuthorization(params)).rejects.toThrow('Insufficient balance');
    });

    it('should enforce replay protection (nonce reuse)', async () => {
      const params = createTestTransferParams({
        from: fromAddress,
        to: toAddress,
        amountUSDC: 10,
        nonce: generateTestNonce('test-nonce-1'),
      });

      // First transfer should succeed
      await usdc.transferWithAuthorization(params);

      // Fund sender again for second attempt
      usdc.setBalance(fromAddress, parseUSDC(100));

      // Second transfer with same nonce should fail
      await expect(usdc.transferWithAuthorization(params)).rejects.toThrow('Nonce already used');
    });

    it('should allow different nonces from same address', async () => {
      const params1 = createTestTransferParams({
        from: fromAddress,
        to: toAddress,
        amountUSDC: 10,
        nonce: generateTestNonce('nonce-1'),
      });

      const params2 = createTestTransferParams({
        from: fromAddress,
        to: toAddress,
        amountUSDC: 10,
        nonce: generateTestNonce('nonce-2'),
      });

      await usdc.transferWithAuthorization(params1);
      await usdc.transferWithAuthorization(params2);

      // Both should succeed
      expect(usdc.balanceOf(fromAddress)).toBe(parseUSDC(80));
      expect(usdc.balanceOf(toAddress)).toBe(parseUSDC(20));
    });
  });

  describe('isNonceUsed', () => {
    const testAddress = '0x1111111111111111111111111111111111111111';

    it('should return false for unused nonce', () => {
      const nonce = generateTestNonce('test-1');
      expect(usdc.isNonceUsed(testAddress, nonce)).toBe(false);
    });

    it('should return true after nonce is used', async () => {
      usdc.setBalance(testAddress, parseUSDC(100));

      const params = createTestTransferParams({
        from: testAddress,
        to: '0x2222222222222222222222222222222222222222',
        amountUSDC: 10,
        nonce: generateTestNonce('test-2'),
      });

      await usdc.transferWithAuthorization(params);

      expect(usdc.isNonceUsed(testAddress, params.nonce)).toBe(true);
    });

    it('should handle case-insensitive addresses', async () => {
      usdc.setBalance(testAddress, parseUSDC(100));

      const params = createTestTransferParams({
        from: testAddress,
        to: '0x2222222222222222222222222222222222222222',
        amountUSDC: 10,
        nonce: generateTestNonce('test-3'),
      });

      await usdc.transferWithAuthorization(params);

      expect(usdc.isNonceUsed(testAddress.toUpperCase(), params.nonce)).toBe(true);
    });
  });

  describe('Event Management', () => {
    it('should track multiple transfer events', async () => {
      const fromAddress = '0x1111111111111111111111111111111111111111';
      const toAddress = '0x2222222222222222222222222222222222222222';
      usdc.setBalance(fromAddress, parseUSDC(100));

      await usdc.transferWithAuthorization(
        createTestTransferParams({
          from: fromAddress,
          to: toAddress,
          amountUSDC: 10,
        })
      );

      await usdc.transferWithAuthorization(
        createTestTransferParams({
          from: fromAddress,
          to: toAddress,
          amountUSDC: 20,
        })
      );

      const events = usdc.getTransferEvents();
      expect(events).toHaveLength(2);
      expect(events[0].value).toBe(parseUSDC(10));
      expect(events[1].value).toBe(parseUSDC(20));
    });

    it('should clear events', async () => {
      const fromAddress = '0x1111111111111111111111111111111111111111';
      const toAddress = '0x2222222222222222222222222222222222222222';
      usdc.setBalance(fromAddress, parseUSDC(100));

      await usdc.transferWithAuthorization(
        createTestTransferParams({
          from: fromAddress,
          to: toAddress,
          amountUSDC: 10,
        })
      );

      usdc.clearEvents();

      expect(usdc.getTransferEvents()).toHaveLength(0);
      expect(usdc.getAuthorizationUsedEvents()).toHaveLength(0);
    });
  });

  describe('reset', () => {
    it('should clear all state', async () => {
      const fromAddress = '0x1111111111111111111111111111111111111111';
      const toAddress = '0x2222222222222222222222222222222222222222';

      // Setup state
      usdc.setBalance(fromAddress, parseUSDC(100));
      usdc.setBalance(toAddress, parseUSDC(50));

      await usdc.transferWithAuthorization(
        createTestTransferParams({
          from: fromAddress,
          to: toAddress,
          amountUSDC: 10,
        })
      );

      // Reset
      usdc.reset();

      // Verify everything is cleared
      expect(usdc.balanceOf(fromAddress)).toBe(0n);
      expect(usdc.balanceOf(toAddress)).toBe(0n);
      expect(usdc.getTransferEvents()).toHaveLength(0);
      expect(usdc.getAuthorizationUsedEvents()).toHaveLength(0);
    });

    it('should allow reuse of nonces after reset', async () => {
      const fromAddress = '0x1111111111111111111111111111111111111111';
      const toAddress = '0x2222222222222222222222222222222222222222';
      const nonce = generateTestNonce('reusable');

      // First use
      usdc.setBalance(fromAddress, parseUSDC(100));
      await usdc.transferWithAuthorization(
        createTestTransferParams({
          from: fromAddress,
          to: toAddress,
          amountUSDC: 10,
          nonce,
        })
      );

      // Reset
      usdc.reset();

      // Second use with same nonce (should succeed after reset)
      usdc.setBalance(fromAddress, parseUSDC(100));
      await expect(
        usdc.transferWithAuthorization(
          createTestTransferParams({
            from: fromAddress,
            to: toAddress,
            amountUSDC: 10,
            nonce,
          })
        )
      ).resolves.toBeDefined();
    });
  });
});

describe('USDCMockManager', () => {
  let manager: USDCMockManager;

  beforeEach(() => {
    manager = new USDCMockManager();
  });

  describe('Contract Management', () => {
    it('should create a new contract', () => {
      const usdc = manager.createContract();
      expect(usdc).toBeInstanceOf(MockUSDCContract);
      expect(usdc.address()).toBe('0xc01efaaf7c5c61bebfaeb358e1161b537b8bc0e0');
    });

    it('should create contract with custom address', () => {
      const customAddress = '0x1234567890123456789012345678901234567890';
      const usdc = manager.createContract(customAddress);
      expect(usdc.address()).toBe(customAddress.toLowerCase());
    });

    it('should retrieve created contract by address', () => {
      const usdc = manager.createContract();
      const retrieved = manager.getContract(usdc.address());
      expect(retrieved).toBe(usdc);
    });

    it('should return undefined for non-existent contract', () => {
      const retrieved = manager.getContract('0x1111111111111111111111111111111111111111');
      expect(retrieved).toBeUndefined();
    });

    it('should handle case-insensitive contract lookup', () => {
      const usdc = manager.createContract();
      const retrieved = manager.getContract(usdc.address().toUpperCase());
      expect(retrieved).toBe(usdc);
    });
  });

  describe('fundAddress', () => {
    it('should fund address with USDC', () => {
      const usdc = manager.createContract();
      const address = '0x1234567890123456789012345678901234567890';

      manager.fundAddress(usdc, address, 100);

      expect(usdc.balanceOf(address)).toBe(parseUSDC(100));
    });

    it('should fund multiple addresses', () => {
      const usdc = manager.createContract();
      const address1 = '0x1111111111111111111111111111111111111111';
      const address2 = '0x2222222222222222222222222222222222222222';

      manager.fundAddress(usdc, address1, 50);
      manager.fundAddress(usdc, address2, 75);

      expect(usdc.balanceOf(address1)).toBe(parseUSDC(50));
      expect(usdc.balanceOf(address2)).toBe(parseUSDC(75));
    });
  });

  describe('setupScenario', () => {
    it('should setup multiple funded addresses from object', () => {
      const usdc = manager.createContract();

      manager.setupScenario(usdc, {
        '0x1111111111111111111111111111111111111111': 100,
        '0x2222222222222222222222222222222222222222': 200,
        '0x3333333333333333333333333333333333333333': 50,
      });

      expect(usdc.balanceOf('0x1111111111111111111111111111111111111111')).toBe(parseUSDC(100));
      expect(usdc.balanceOf('0x2222222222222222222222222222222222222222')).toBe(parseUSDC(200));
      expect(usdc.balanceOf('0x3333333333333333333333333333333333333333')).toBe(parseUSDC(50));
    });
  });

  describe('resetAll', () => {
    it('should reset all contracts', () => {
      const usdc1 = manager.createContract('0x1111111111111111111111111111111111111111');
      const usdc2 = manager.createContract('0x2222222222222222222222222222222222222222');

      manager.fundAddress(usdc1, '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 100);
      manager.fundAddress(usdc2, '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 200);

      manager.resetAll();

      expect(usdc1.balanceOf('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')).toBe(0n);
      expect(usdc2.balanceOf('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb')).toBe(0n);
    });
  });

  describe('clearAll', () => {
    it('should clear all contracts', () => {
      manager.createContract('0x1111111111111111111111111111111111111111');
      manager.createContract('0x2222222222222222222222222222222222222222');

      manager.clearAll();

      expect(manager.getContract('0x1111111111111111111111111111111111111111')).toBeUndefined();
      expect(manager.getContract('0x2222222222222222222222222222222222222222')).toBeUndefined();
    });
  });
});

describe('Helper Functions', () => {
  describe('createMockBalances', () => {
    it('should create balances for multiple addresses', () => {
      const addresses = [
        '0x1111111111111111111111111111111111111111',
        '0x2222222222222222222222222222222222222222',
        '0x3333333333333333333333333333333333333333',
      ];

      const balances = createMockBalances(addresses, 50);

      expect(balances.size).toBe(3);
      expect(balances.get(addresses[0].toLowerCase())).toBe(parseUSDC(50));
      expect(balances.get(addresses[1].toLowerCase())).toBe(parseUSDC(50));
      expect(balances.get(addresses[2].toLowerCase())).toBe(parseUSDC(50));
    });

    it('should use default balance of 100 USDC', () => {
      const addresses = ['0x1111111111111111111111111111111111111111'];
      const balances = createMockBalances(addresses);

      expect(balances.get(addresses[0].toLowerCase())).toBe(parseUSDC(100));
    });

    it('should normalize addresses to lowercase', () => {
      const addresses = ['0xABCDEF1234567890ABCDEF1234567890ABCDEF12'];
      const balances = createMockBalances(addresses, 25);

      expect(balances.get('0xabcdef1234567890abcdef1234567890abcdef12')).toBe(parseUSDC(25));
    });
  });

  describe('generateTestNonce', () => {
    it('should generate valid nonce format', () => {
      const nonce = generateTestNonce();
      expect(nonce).toMatch(/^0x[a-f0-9]{64}$/);
    });

    it('should generate deterministic nonce with seed', () => {
      const nonce1 = generateTestNonce('seed-1');
      const nonce2 = generateTestNonce('seed-1');
      expect(nonce1).toBe(nonce2);
    });

    it('should generate different nonces for different seeds', () => {
      const nonce1 = generateTestNonce('seed-1');
      const nonce2 = generateTestNonce('seed-2');
      expect(nonce1).not.toBe(nonce2);
    });

    it('should generate random nonces without seed', () => {
      const nonce1 = generateTestNonce();
      const nonce2 = generateTestNonce();
      // Very unlikely to be equal (1 in 2^256 chance)
      expect(nonce1).not.toBe(nonce2);
    });
  });

  describe('createTestTransferParams', () => {
    it('should create valid transfer params', () => {
      const params = createTestTransferParams({
        from: '0x1111111111111111111111111111111111111111',
        to: '0x2222222222222222222222222222222222222222',
        amountUSDC: 10,
      });

      expect(params.from).toBe('0x1111111111111111111111111111111111111111');
      expect(params.to).toBe('0x2222222222222222222222222222222222222222');
      expect(params.value).toBe(parseUSDC(10));
      expect(params.validAfter).toBe(0n);
      expect(params.validBefore).toBeGreaterThan(BigInt(Math.floor(Date.now() / 1000)));
      expect(params.nonce).toMatch(/^0x[a-f0-9]{64}$/);
      expect(params.v).toBe(27);
      expect(params.r).toMatch(/^0x[1]{64}$/);
      expect(params.s).toMatch(/^0x[2]{64}$/);
    });

    it('should use custom validity seconds', () => {
      const now = Math.floor(Date.now() / 1000);
      const params = createTestTransferParams({
        from: '0x1111111111111111111111111111111111111111',
        to: '0x2222222222222222222222222222222222222222',
        amountUSDC: 10,
        validitySeconds: 7200, // 2 hours
      });

      const expectedBefore = BigInt(now + 7200);
      const actualBefore = BigInt(params.validBefore);

      // Allow 2 second tolerance for test execution time
      expect(actualBefore).toBeGreaterThanOrEqual(expectedBefore - 2n);
      expect(actualBefore).toBeLessThanOrEqual(expectedBefore + 2n);
    });

    it('should use custom nonce if provided', () => {
      const customNonce = '0x' + '9'.repeat(64);
      const params = createTestTransferParams({
        from: '0x1111111111111111111111111111111111111111',
        to: '0x2222222222222222222222222222222222222222',
        amountUSDC: 10,
        nonce: customNonce,
      });

      expect(params.nonce).toBe(customNonce);
    });

    it('should handle decimal USDC amounts', () => {
      const params = createTestTransferParams({
        from: '0x1111111111111111111111111111111111111111',
        to: '0x2222222222222222222222222222222222222222',
        amountUSDC: 0.01,
      });

      expect(params.value).toBe(parseUSDC(0.01));
    });
  });
});
