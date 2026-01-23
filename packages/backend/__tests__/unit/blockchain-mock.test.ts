/**
 * Tests for Blockchain Mock Utilities
 *
 * Verifies that the mock blockchain utilities correctly simulate
 * Cronos blockchain interactions for deterministic testing.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  MockWeb3Provider,
  CRONOS_TESTNET,
  CRONOS_MAINNET,
  DEV_USDC_CONFIG,
  DEFAULT_GAS_VALUES,
  randomHex,
  generateTxHash,
  generateBlockHash,
  resetBlockchainCounters,
  toChecksumAddress,
  mockTransactionReceipt,
  mockBlock,
  mockTransactionLog,
  mockFailedTransactionReceipt,
  mockUSDCTransferLog,
  mockGasPrice,
  mockBlockNumber,
  createTestProvider,
  createMockPublicClient,
  createMockWalletClient,
  createMockUSDCContract,
  type TransactionReceipt,
  type Block,
  type TransactionLog,
} from '../mocks/blockchain-mock';

describe('Blockchain Mock Utilities', () => {
  describe('Constants', () => {
    describe('CRONOS_TESTNET', () => {
      it('should have correct chain ID', () => {
        expect(CRONOS_TESTNET.id).toBe(338);
      });

      it('should have correct RPC URL', () => {
        expect(CRONOS_TESTNET.rpcUrl).toBe('https://evm-t3.cronos.org/');
      });

      it('should have correct native currency', () => {
        expect(CRONOS_TESTNET.nativeCurrency.symbol).toBe('TCRO');
        expect(CRONOS_TESTNET.nativeCurrency.decimals).toBe(18);
      });
    });

    describe('CRONOS_MAINNET', () => {
      it('should have correct chain ID', () => {
        expect(CRONOS_MAINNET.id).toBe(25);
      });

      it('should have correct native currency', () => {
        expect(CRONOS_MAINNET.nativeCurrency.symbol).toBe('CRO');
      });
    });

    describe('DEV_USDC_CONFIG', () => {
      it('should have correct contract address', () => {
        expect(DEV_USDC_CONFIG.address).toBe('0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0');
      });

      it('should have correct decimals', () => {
        expect(DEV_USDC_CONFIG.decimals).toBe(6);
      });

      it('should have correct domain version for testnet', () => {
        expect(DEV_USDC_CONFIG.domainVersion).toBe('1');
      });
    });

    describe('DEFAULT_GAS_VALUES', () => {
      it('should have reasonable gas price', () => {
        expect(DEFAULT_GAS_VALUES.gasPrice).toBe(BigInt('5000000000')); // 5 gwei
      });

      it('should have standard gas limit', () => {
        expect(DEFAULT_GAS_VALUES.gasLimit).toBe(BigInt('21000'));
      });
    });
  });

  describe('Utility Functions', () => {
    describe('randomHex', () => {
      it('should generate hex string of correct length', () => {
        const hex = randomHex(32);
        expect(hex).toMatch(/^0x[a-f0-9]{64}$/);
      });

      it('should generate different values each time', () => {
        const hex1 = randomHex(16);
        const hex2 = randomHex(16);
        expect(hex1).not.toBe(hex2);
      });
    });

    describe('generateTxHash', () => {
      beforeEach(() => {
        resetBlockchainCounters();
      });

      it('should generate valid transaction hash format', () => {
        const txHash = generateTxHash();
        expect(txHash).toMatch(/^0x[a-f0-9]{64}$/);
      });

      it('should generate sequential hashes with counter prefix', () => {
        const txHash1 = generateTxHash();
        const txHash2 = generateTxHash();

        // First 8 chars after 0x should be counter
        expect(txHash1.slice(2, 10)).toBe('00000001');
        expect(txHash2.slice(2, 10)).toBe('00000002');
      });
    });

    describe('generateBlockHash', () => {
      beforeEach(() => {
        resetBlockchainCounters();
      });

      it('should generate valid block hash format', () => {
        const blockHash = generateBlockHash();
        expect(blockHash).toMatch(/^0x[a-f0-9]{64}$/);
      });

      it('should include counter in hash', () => {
        const blockHash1 = generateBlockHash();
        const blockHash2 = generateBlockHash();

        // Block counter starts at 1000000, so first is 000f4241
        expect(blockHash1).not.toBe(blockHash2);
      });
    });

    describe('toChecksumAddress', () => {
      it('should convert address to lowercase', () => {
        const address = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';
        const checksum = toChecksumAddress(address);
        expect(checksum).toBe(address.toLowerCase());
      });
    });
  });

  describe('MockWeb3Provider', () => {
    let provider: MockWeb3Provider;

    beforeEach(() => {
      provider = new MockWeb3Provider();
      resetBlockchainCounters();
    });

    describe('constructor', () => {
      it('should use Cronos testnet chain ID by default', () => {
        expect(provider.getChainId()).toBe(338);
      });

      it('should accept custom chain ID', () => {
        const customProvider = new MockWeb3Provider({ chainId: 25 });
        expect(customProvider.getChainId()).toBe(25);
      });

      it('should start at default block number', async () => {
        const blockNumber = await provider.getBlockNumber();
        expect(blockNumber).toBe(BigInt(1000000));
      });
    });

    describe('getBalance', () => {
      it('should return 0 for unknown addresses', async () => {
        const balance = await provider.getBalance('0x0000000000000000000000000000000000000001');
        expect(balance).toBe(BigInt(0));
      });

      it('should return mocked balance', async () => {
        const address = '0x1234567890123456789012345678901234567890';
        provider.mockGetBalance(address, BigInt('1000000000000000000'));

        const balance = await provider.getBalance(address);
        expect(balance).toBe(BigInt('1000000000000000000'));
      });

      it('should be case-insensitive', async () => {
        const address = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';
        provider.mockGetBalance(address, BigInt(100));

        const balance = await provider.getBalance(address.toLowerCase());
        expect(balance).toBe(BigInt(100));
      });
    });

    describe('getBlockNumber', () => {
      it('should return current block number', async () => {
        const blockNumber = await provider.getBlockNumber();
        expect(blockNumber).toBe(BigInt(1000000));
      });

      it('should return custom response when set', async () => {
        provider.setCustomResponse('getBlockNumber', BigInt(999999));
        const blockNumber = await provider.getBlockNumber();
        expect(blockNumber).toBe(BigInt(999999));
      });
    });

    describe('getGasPrice', () => {
      it('should return default gas price', async () => {
        const gasPrice = await provider.getGasPrice();
        expect(gasPrice).toBe(DEFAULT_GAS_VALUES.gasPrice);
      });

      it('should return custom response when set', async () => {
        provider.setCustomResponse('getGasPrice', BigInt('10000000000'));
        const gasPrice = await provider.getGasPrice();
        expect(gasPrice).toBe(BigInt('10000000000'));
      });
    });

    describe('estimateGas', () => {
      it('should return default gas limit', async () => {
        const gas = await provider.estimateGas({});
        expect(gas).toBe(DEFAULT_GAS_VALUES.gasLimit);
      });
    });

    describe('mockTransactionReceipt', () => {
      it('should store and retrieve transaction receipt', async () => {
        const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
        provider.mockTransactionReceipt(txHash, { status: 'success' });

        const receipt = await provider.getTransactionReceipt(txHash);
        expect(receipt).not.toBeNull();
        expect(receipt!.status).toBe('success');
      });

      it('should return null for unknown transaction', async () => {
        const receipt = await provider.getTransactionReceipt('0xunknown');
        expect(receipt).toBeNull();
      });
    });

    describe('mockContractCall', () => {
      it('should return mocked contract response', async () => {
        const contractAddress = '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0';
        const functionSelector = '0x70a08231'; // balanceOf

        provider.mockContractCall(contractAddress, functionSelector, '0x0000000000000000000000000000000000000000000000000000000005f5e100');

        const result = await provider.call({
          to: contractAddress as `0x${string}`,
          data: `${functionSelector}0000000000000000000000001234567890123456789012345678901234567890` as `0x${string}`,
        });

        expect(result).toBe('0x0000000000000000000000000000000000000000000000000000000005f5e100');
      });
    });

    describe('sendTransaction', () => {
      it('should return transaction hash', async () => {
        const txHash = await provider.sendTransaction({
          from: '0x0000000000000000000000000000000000000001' as `0x${string}`,
          to: '0x0000000000000000000000000000000000000002' as `0x${string}`,
          value: BigInt(1000),
        });

        expect(txHash).toMatch(/^0x[a-f0-9]{64}$/);
      });

      it('should create receipt automatically', async () => {
        const txHash = await provider.sendTransaction({
          from: '0x0000000000000000000000000000000000000001' as `0x${string}`,
          to: '0x0000000000000000000000000000000000000002' as `0x${string}`,
        });

        const receipt = await provider.getTransactionReceipt(txHash);
        expect(receipt).not.toBeNull();
        expect(receipt!.status).toBe('success');
      });

      it('should increment nonce', async () => {
        const from = '0x0000000000000000000000000000000000000001' as `0x${string}`;

        const nonceBefore = await provider.getTransactionCount(from);
        await provider.sendTransaction({
          from,
          to: '0x0000000000000000000000000000000000000002' as `0x${string}`,
        });
        const nonceAfter = await provider.getTransactionCount(from);

        expect(nonceAfter).toBe(nonceBefore + 1);
      });

      it('should update balances for value transfers', async () => {
        const from = '0x0000000000000000000000000000000000000001' as `0x${string}`;
        const to = '0x0000000000000000000000000000000000000002' as `0x${string}`;

        provider.mockGetBalance(from, BigInt(1000));
        provider.mockGetBalance(to, BigInt(0));

        await provider.sendTransaction({
          from,
          to,
          value: BigInt(300),
        });

        const fromBalance = await provider.getBalance(from);
        const toBalance = await provider.getBalance(to);

        expect(fromBalance).toBe(BigInt(700));
        expect(toBalance).toBe(BigInt(300));
      });
    });

    describe('getBlock', () => {
      it('should return block with correct number', async () => {
        const block = await provider.getBlock();
        expect(block.number).toBe(BigInt(1000000));
      });

      it('should return block by number', async () => {
        const block = await provider.getBlock(BigInt(999));
        expect(block.number).toBe(BigInt(999));
      });

      it('should handle "latest" parameter', async () => {
        const block = await provider.getBlock('latest');
        expect(block.number).toBe(BigInt(1000000));
      });

      it('should handle "pending" parameter', async () => {
        const block = await provider.getBlock('pending');
        expect(block.number).toBe(BigInt(1000001));
      });
    });

    describe('waitForTransactionReceipt', () => {
      it('should return receipt for known transaction', async () => {
        const txHash = generateTxHash();
        provider.mockTransactionReceipt(txHash, { status: 'success' });

        const receipt = await provider.waitForTransactionReceipt(txHash);
        expect(receipt.status).toBe('success');
      });

      it('should create default receipt for unknown transaction', async () => {
        const txHash = generateTxHash();

        const receipt = await provider.waitForTransactionReceipt(txHash);
        expect(receipt.status).toBe('success');
      });
    });

    describe('Block Management', () => {
      it('should mine a new block', () => {
        const blockBefore = provider.getCurrentBlockNumber();
        const blockAfter = provider.mineBlock();

        expect(blockAfter).toBe(blockBefore + BigInt(1));
      });

      it('should mine multiple blocks', () => {
        const blockBefore = provider.getCurrentBlockNumber();
        const blockAfter = provider.mineBlocks(5);

        expect(blockAfter).toBe(blockBefore + BigInt(5));
      });

      it('should set specific block number', () => {
        provider.setBlockNumber(BigInt(2000000));
        expect(provider.getCurrentBlockNumber()).toBe(BigInt(2000000));
      });
    });

    describe('Failure Simulation', () => {
      it('should fail next call when set', async () => {
        provider.setNextCallFailure(new Error('Custom error'));

        await expect(provider.getBlockNumber()).rejects.toThrow('Custom error');
      });

      it('should recover after failure', async () => {
        provider.setNextCallFailure();

        await expect(provider.getBlockNumber()).rejects.toThrow();
        await expect(provider.getBlockNumber()).resolves.toBeDefined();
      });

      it('should support latency simulation', async () => {
        const slowProvider = new MockWeb3Provider({ latency: 50 });

        const start = Date.now();
        await slowProvider.getBlockNumber();
        const elapsed = Date.now() - start;

        expect(elapsed).toBeGreaterThanOrEqual(40);
      });
    });

    describe('reset', () => {
      it('should clear all mocked data', async () => {
        provider.mockGetBalance('0x1', BigInt(1000));
        provider.mockTransactionReceipt('0xtx', { status: 'success' });

        provider.reset();

        const balance = await provider.getBalance('0x1');
        const receipt = await provider.getTransactionReceipt('0xtx');

        expect(balance).toBe(BigInt(0));
        expect(receipt).toBeNull();
      });
    });
  });

  describe('Mock Factory Functions', () => {
    describe('mockTransactionReceipt', () => {
      it('should create valid receipt with defaults', () => {
        const receipt = mockTransactionReceipt();

        expect(receipt.transactionHash).toMatch(/^0x[a-f0-9]{64}$/);
        expect(receipt.status).toBe('success');
        expect(receipt.gasUsed).toBe(BigInt(21000));
      });

      it('should allow overrides', () => {
        const receipt = mockTransactionReceipt({ status: 'reverted' });
        expect(receipt.status).toBe('reverted');
      });
    });

    describe('mockBlock', () => {
      it('should create valid block with defaults', () => {
        const block = mockBlock();

        expect(block.hash).toMatch(/^0x[a-f0-9]{64}$/);
        expect(block.number).toBe(BigInt(1000000));
        expect(typeof block.timestamp).toBe('bigint');
      });
    });

    describe('mockTransactionLog', () => {
      it('should create valid log', () => {
        const log = mockTransactionLog();

        expect(log.address).toBe(DEV_USDC_CONFIG.address);
        expect(log.topics.length).toBeGreaterThan(0);
      });
    });

    describe('mockFailedTransactionReceipt', () => {
      it('should create reverted receipt', () => {
        const receipt = mockFailedTransactionReceipt();
        expect(receipt.status).toBe('reverted');
      });
    });

    describe('mockUSDCTransferLog', () => {
      it('should create Transfer event log', () => {
        const from = '0x1234567890123456789012345678901234567890' as `0x${string}`;
        const to = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as `0x${string}`;
        const amount = BigInt(1000000); // 1 USDC

        const log = mockUSDCTransferLog(from, to, amount);

        expect(log.address).toBe(DEV_USDC_CONFIG.address);
        expect(log.topics[0]).toBe('0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef');
        expect(log.topics.length).toBe(3);
      });
    });

    describe('mockGasPrice', () => {
      it('should convert gwei to wei', () => {
        expect(mockGasPrice(5)).toBe(BigInt('5000000000'));
        expect(mockGasPrice(100)).toBe(BigInt('100000000000'));
      });
    });

    describe('mockBlockNumber', () => {
      it('should convert number to bigint', () => {
        expect(mockBlockNumber(1000000)).toBe(BigInt(1000000));
      });
    });
  });

  describe('Test Provider Factory', () => {
    describe('createTestProvider', () => {
      it('should create success scenario provider', async () => {
        const provider = createTestProvider('success');
        await expect(provider.getBlockNumber()).resolves.toBeDefined();
      });

      it('should create slow scenario provider', async () => {
        const provider = createTestProvider('slow');
        const start = Date.now();
        await provider.getBlockNumber();
        expect(Date.now() - start).toBeGreaterThanOrEqual(150);
      });

      it('should create unreliable scenario provider', async () => {
        const provider = createTestProvider('unreliable');
        let failures = 0;

        for (let i = 0; i < 20; i++) {
          try {
            await provider.getBlockNumber();
          } catch {
            failures++;
          }
        }

        // With 30% fail rate, expect some failures
        expect(failures).toBeGreaterThan(0);
        expect(failures).toBeLessThan(20);
      });
    });
  });

  describe('Mock Viem Clients', () => {
    describe('createMockPublicClient', () => {
      it('should create client with jest mocks', () => {
        const client = createMockPublicClient();

        expect(client.getBalance).toBeDefined();
        expect(client.getBlockNumber).toBeDefined();
        expect(client.getGasPrice).toBeDefined();
      });

      it('should work with provider', async () => {
        const client = createMockPublicClient();
        client.provider.mockGetBalance('0x1', BigInt(1000));

        const balance = await client.getBalance({ address: '0x1' as `0x${string}` });
        expect(balance).toBe(BigInt(1000));
      });
    });

    describe('createMockWalletClient', () => {
      it('should create client with address', () => {
        const address = '0x1234567890123456789012345678901234567890' as `0x${string}`;
        const client = createMockWalletClient(address);

        expect(client.account.address).toBe(address);
      });

      it('should allow sending transactions', async () => {
        const client = createMockWalletClient();

        const txHash = await client.sendTransaction({
          to: '0x0000000000000000000000000000000000000002' as `0x${string}`,
        });

        expect(txHash).toMatch(/^0x[a-f0-9]{64}$/);
      });

      it('should sign messages', async () => {
        const client = createMockWalletClient();

        const signature = await client.signMessage({ message: 'Hello' });

        expect(signature).toMatch(/^0x[a-f0-9]+$/);
      });
    });

    describe('createMockUSDCContract', () => {
      it('should create contract with read and write functions', () => {
        const provider = new MockWeb3Provider();
        const contract = createMockUSDCContract(provider);

        expect(contract.read.balanceOf).toBeDefined();
        expect(contract.read.allowance).toBeDefined();
        expect(contract.write.transfer).toBeDefined();
        expect(contract.write.approve).toBeDefined();
      });

      it('should return mocked balance', async () => {
        const provider = new MockWeb3Provider();
        const contract = createMockUSDCContract(provider);

        const address = '0x1234567890123456789012345678901234567890' as `0x${string}`;
        contract._setBalance(address, BigInt(1000000));

        const balance = await contract.read.balanceOf([address]);
        expect(balance).toBe(BigInt(1000000));
      });

      it('should return mocked allowance', async () => {
        const provider = new MockWeb3Provider();
        const contract = createMockUSDCContract(provider);

        const owner = '0x1234567890123456789012345678901234567890' as `0x${string}`;
        const spender = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as `0x${string}`;
        contract._setAllowance(owner, spender, BigInt(500000));

        const allowance = await contract.read.allowance([owner, spender]);
        expect(allowance).toBe(BigInt(500000));
      });

      it('should return correct token info', async () => {
        const provider = new MockWeb3Provider();
        const contract = createMockUSDCContract(provider);

        expect(await contract.read.decimals()).toBe(6);
        expect(await contract.read.symbol()).toBe('devUSDC.e');
        expect(await contract.read.name()).toBe('Bridged USDC (Stargate)');
      });
    });
  });
});
