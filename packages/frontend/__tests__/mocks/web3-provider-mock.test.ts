/**
 * Web3 Provider Mock - Comprehensive Tests
 *
 * Tests for Web3 provider mock utilities.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  // Main class
  MockEthereumProvider,
  // Error utilities
  RPC_ERROR_CODES,
  createRpcError,
  userRejectedRpcError,
  chainNotAddedError,
  unsupportedMethodError,
  // Chain utilities
  CHAIN_CONFIGS,
  chainIdToHex,
  hexToChainId,
  // Factory functions
  createConnectedProvider,
  createDisconnectedProvider,
  createRejectingProvider,
  // Window utilities
  installMockProvider,
  mockWindowEthereum,
  // Assertions
  assertMethodCalled,
  assertAccountsRequested,
  assertChainSwitched,
  assertSignatureRequested,
  // Types
  type RequestArguments,
  type ChainConfig,
  type RpcError,
  type MockProviderConfig,
} from './web3-provider-mock';
import { CHAIN_IDS } from './wallet-mock';

describe('Web3 Provider Mock', () => {
  // ============================================================================
  // Error Utilities Tests
  // ============================================================================

  describe('Error Utilities', () => {
    describe('RPC_ERROR_CODES', () => {
      it('exports standard error codes', () => {
        expect(RPC_ERROR_CODES.USER_REJECTED).toBe(4001);
        expect(RPC_ERROR_CODES.UNAUTHORIZED).toBe(4100);
        expect(RPC_ERROR_CODES.UNSUPPORTED_METHOD).toBe(4200);
        expect(RPC_ERROR_CODES.DISCONNECTED).toBe(4900);
        expect(RPC_ERROR_CODES.CHAIN_NOT_ADDED).toBe(4902);
      });
    });

    describe('createRpcError', () => {
      it('creates error with code and message', () => {
        const error = createRpcError(4001, 'Test error');
        expect(error.code).toBe(4001);
        expect(error.message).toBe('Test error');
        expect(error.name).toBe('RpcError');
      });

      it('includes optional data', () => {
        const error = createRpcError(4001, 'Test', { extra: 'data' });
        expect(error.data).toEqual({ extra: 'data' });
      });
    });

    describe('userRejectedRpcError', () => {
      it('creates 4001 error', () => {
        const error = userRejectedRpcError();
        expect(error.code).toBe(4001);
        expect(error.message).toBe('User rejected the request');
      });
    });

    describe('chainNotAddedError', () => {
      it('creates 4902 error with chain ID', () => {
        const error = chainNotAddedError('0x123');
        expect(error.code).toBe(4902);
        expect(error.data).toEqual({ chainId: '0x123' });
      });
    });

    describe('unsupportedMethodError', () => {
      it('creates 4200 error with method', () => {
        const error = unsupportedMethodError('eth_unknown');
        expect(error.code).toBe(4200);
        expect(error.data).toEqual({ method: 'eth_unknown' });
      });
    });
  });

  // ============================================================================
  // Chain Utilities Tests
  // ============================================================================

  describe('Chain Utilities', () => {
    describe('CHAIN_CONFIGS', () => {
      it('has Cronos Testnet config', () => {
        const config = CHAIN_CONFIGS[CHAIN_IDS.CRONOS_TESTNET];
        expect(config.chainId).toBe('0x152');
        expect(config.chainName).toBe('Cronos Testnet');
        expect(config.nativeCurrency.symbol).toBe('TCRO');
      });

      it('has Cronos Mainnet config', () => {
        const config = CHAIN_CONFIGS[CHAIN_IDS.CRONOS_MAINNET];
        expect(config.chainId).toBe('0x19');
        expect(config.chainName).toBe('Cronos Mainnet');
        expect(config.nativeCurrency.symbol).toBe('CRO');
      });

      it('has Ethereum configs', () => {
        expect(CHAIN_CONFIGS[CHAIN_IDS.ETHEREUM_MAINNET]).toBeDefined();
        expect(CHAIN_CONFIGS[CHAIN_IDS.ETHEREUM_GOERLI]).toBeDefined();
        expect(CHAIN_CONFIGS[CHAIN_IDS.SEPOLIA]).toBeDefined();
      });
    });

    describe('chainIdToHex', () => {
      it('converts decimal to hex', () => {
        expect(chainIdToHex(338)).toBe('0x152');
        expect(chainIdToHex(25)).toBe('0x19');
        expect(chainIdToHex(1)).toBe('0x1');
      });
    });

    describe('hexToChainId', () => {
      it('converts hex to decimal', () => {
        expect(hexToChainId('0x152')).toBe(338);
        expect(hexToChainId('0x19')).toBe(25);
        expect(hexToChainId('0x1')).toBe(1);
      });
    });
  });

  // ============================================================================
  // MockEthereumProvider Tests
  // ============================================================================

  describe('MockEthereumProvider', () => {
    let provider: MockEthereumProvider;

    beforeEach(() => {
      provider = new MockEthereumProvider();
    });

    describe('initialization', () => {
      it('creates provider with defaults', () => {
        const state = provider.getState();
        expect(state.chainId).toBe('0x152'); // Cronos Testnet
        expect(state.accounts).toEqual([]);
        expect(state.isConnected).toBe(false);
      });

      it('accepts custom config', () => {
        const customProvider = new MockEthereumProvider({
          chainId: CHAIN_IDS.CRONOS_MAINNET,
          accounts: ['0xabc123'],
        });

        const state = customProvider.getState();
        expect(state.chainId).toBe('0x19');
        expect(state.accounts).toContain('0xabc123');
      });

      it('sets isMetaMask flag', () => {
        expect(provider.isMetaMask).toBe(true);

        const nonMetaMask = new MockEthereumProvider({ isMetaMask: false });
        expect(nonMetaMask.isMetaMask).toBe(false);
      });
    });

    describe('request method', () => {
      describe('eth_requestAccounts', () => {
        it('returns accounts', async () => {
          const accounts = await provider.request({ method: 'eth_requestAccounts' });
          expect(Array.isArray(accounts)).toBe(true);
          expect((accounts as string[]).length).toBeGreaterThan(0);
        });

        it('emits accountsChanged event', async () => {
          const listener = vi.fn();
          provider.on('accountsChanged', listener);

          await provider.request({ method: 'eth_requestAccounts' });

          expect(listener).toHaveBeenCalled();
        });
      });

      describe('eth_accounts', () => {
        it('returns empty array when disconnected', async () => {
          const accounts = await provider.request({ method: 'eth_accounts' });
          expect(accounts).toEqual([]);
        });

        it('returns accounts when connected', async () => {
          await provider.request({ method: 'eth_requestAccounts' });
          const accounts = await provider.request({ method: 'eth_accounts' });
          expect((accounts as string[]).length).toBeGreaterThan(0);
        });
      });

      describe('eth_chainId', () => {
        it('returns current chain ID as hex', async () => {
          const chainId = await provider.request({ method: 'eth_chainId' });
          expect(chainId).toBe('0x152');
        });
      });

      describe('net_version', () => {
        it('returns chain ID as decimal string', async () => {
          const netVersion = await provider.request({ method: 'net_version' });
          expect(netVersion).toBe('338');
        });
      });

      describe('eth_blockNumber', () => {
        it('returns block number as hex', async () => {
          const blockNumber = await provider.request({ method: 'eth_blockNumber' });
          expect(blockNumber).toMatch(/^0x[a-fA-F0-9]+$/);
        });
      });

      describe('eth_gasPrice', () => {
        it('returns gas price as hex', async () => {
          const gasPrice = await provider.request({ method: 'eth_gasPrice' });
          expect(gasPrice).toMatch(/^0x[a-fA-F0-9]+$/);
        });
      });

      describe('eth_getBalance', () => {
        it('returns 0 by default', async () => {
          const balance = await provider.request({
            method: 'eth_getBalance',
            params: ['0x1234567890abcdef1234567890abcdef12345678'],
          });
          expect(balance).toBe('0x0');
        });

        it('returns configured balance', async () => {
          provider.setBalance('0x1234567890abcdef1234567890abcdef12345678', '1000000000000000000');
          const balance = await provider.request({
            method: 'eth_getBalance',
            params: ['0x1234567890abcdef1234567890abcdef12345678'],
          });
          expect(balance).toBe('0xde0b6b3a7640000');
        });
      });

      describe('eth_sendTransaction', () => {
        it('returns transaction hash', async () => {
          const txHash = await provider.request({
            method: 'eth_sendTransaction',
            params: [{ to: '0x1234', value: '0x0' }],
          });
          expect(txHash).toMatch(/^0x[a-fA-F0-9]+$/);
        });
      });

      describe('eth_getTransactionReceipt', () => {
        it('returns receipt with success status', async () => {
          const receipt = await provider.request({
            method: 'eth_getTransactionReceipt',
            params: ['0x' + '0'.repeat(64)],
          });
          expect((receipt as Record<string, unknown>).status).toBe('0x1');
        });
      });

      describe('personal_sign', () => {
        it('returns signature', async () => {
          const signature = await provider.request({
            method: 'personal_sign',
            params: ['Hello World', '0x1234'],
          });
          expect(signature).toMatch(/^0x[a-fA-F0-9]+$/);
        });
      });

      describe('eth_signTypedData_v4', () => {
        it('returns signature for typed data', async () => {
          const typedData = JSON.stringify({
            domain: { name: 'Test' },
            types: { Message: [] },
            primaryType: 'Message',
            message: {},
          });

          const signature = await provider.request({
            method: 'eth_signTypedData_v4',
            params: ['0x1234', typedData],
          });
          expect(signature).toMatch(/^0x[a-fA-F0-9]+$/);
        });
      });

      describe('wallet_switchEthereumChain', () => {
        it('switches to supported chain', async () => {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x19' }],
          });

          const state = provider.getState();
          expect(state.chainId).toBe('0x19');
        });

        it('throws for unsupported chain', async () => {
          await expect(
            provider.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0xFFFFF' }],
            })
          ).rejects.toThrow();
        });

        it('emits chainChanged event', async () => {
          const listener = vi.fn();
          provider.on('chainChanged', listener);

          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x19' }],
          });

          expect(listener).toHaveBeenCalledWith('0x19');
        });
      });

      describe('wallet_addEthereumChain', () => {
        it('adds new chain', async () => {
          const chainConfig: ChainConfig = {
            chainId: '0x999',
            chainName: 'Test Chain',
            nativeCurrency: { name: 'Test', symbol: 'TST', decimals: 18 },
            rpcUrls: ['https://test.rpc'],
          };

          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [chainConfig],
          });

          // Now should be able to switch to it
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x999' }],
          });

          expect(provider.getState().chainId).toBe('0x999');
        });
      });

      describe('unsupported methods', () => {
        it('throws for unknown methods', async () => {
          await expect(
            provider.request({ method: 'unknown_method' })
          ).rejects.toThrow('not supported');
        });
      });
    });

    describe('event handling', () => {
      it('registers and calls listeners', () => {
        const listener = vi.fn();
        provider.on('accountsChanged', listener);

        provider.emit('accountsChanged', ['0x1234']);

        expect(listener).toHaveBeenCalledWith(['0x1234']);
      });

      it('removes listeners', () => {
        const listener = vi.fn();
        provider.on('accountsChanged', listener);
        provider.removeListener('accountsChanged', listener);

        provider.emit('accountsChanged', ['0x1234']);

        expect(listener).not.toHaveBeenCalled();
      });

      it('emits connect event', () => {
        const listener = vi.fn();
        provider.on('connect', listener);

        provider.emitConnect();

        expect(listener).toHaveBeenCalled();
        expect(provider.isConnected()).toBe(true);
      });

      it('emits disconnect event', () => {
        const listener = vi.fn();
        provider.on('disconnect', listener);

        provider.emitDisconnect();

        expect(listener).toHaveBeenCalled();
        expect(provider.isConnected()).toBe(false);
      });
    });

    describe('state management', () => {
      it('setAccounts updates accounts and emits event', () => {
        const listener = vi.fn();
        provider.on('accountsChanged', listener);

        provider.setAccounts(['0xabc', '0xdef']);

        expect(provider.getState().accounts).toEqual(['0xabc', '0xdef']);
        expect(listener).toHaveBeenCalled();
      });

      it('setChainId updates chain and emits event', () => {
        const listener = vi.fn();
        provider.on('chainChanged', listener);

        provider.setChainId(CHAIN_IDS.CRONOS_MAINNET);

        expect(provider.getState().chainId).toBe('0x19');
        expect(listener).toHaveBeenCalledWith('0x19');
      });

      it('setBlockNumber updates block number', () => {
        provider.setBlockNumber(99999);
        expect(provider.getState().blockNumber).toBe(99999);
      });

      it('setGasPrice updates gas price', () => {
        provider.setGasPrice('50000000000');
        expect(provider.getState().gasPrice).toBe('50000000000');
      });

      it('reset restores initial state', async () => {
        await provider.request({ method: 'eth_requestAccounts' });
        provider.setChainId(CHAIN_IDS.CRONOS_MAINNET);

        provider.reset();

        const state = provider.getState();
        expect(state.chainId).toBe('0x152');
        expect(state.accounts).toEqual([]);
        expect(provider.getCalls()).toHaveLength(0);
      });
    });

    describe('rejection handling', () => {
      it('rejects next request', async () => {
        provider.setNextRequestToReject();

        await expect(
          provider.request({ method: 'eth_requestAccounts' })
        ).rejects.toThrow('User rejected');
      });

      it('uses custom error', async () => {
        provider.setNextRequestToReject(chainNotAddedError('0x999'));

        await expect(
          provider.request({ method: 'eth_requestAccounts' })
        ).rejects.toThrow('Chain 0x999');
      });

      it('only rejects one request', async () => {
        provider.setNextRequestToReject();

        await expect(
          provider.request({ method: 'eth_requestAccounts' })
        ).rejects.toThrow();

        // Next request should succeed
        const accounts = await provider.request({ method: 'eth_accounts' });
        expect(accounts).toBeDefined();
      });
    });

    describe('custom handlers', () => {
      it('uses custom handler when set', async () => {
        provider.setCustomHandler('eth_blockNumber', async () => '0x999');

        const result = await provider.request({ method: 'eth_blockNumber' });
        expect(result).toBe('0x999');
      });

      it('removes custom handler', async () => {
        provider.setCustomHandler('eth_blockNumber', async () => '0x999');
        provider.removeCustomHandler('eth_blockNumber');

        const result = await provider.request({ method: 'eth_blockNumber' });
        expect(result).not.toBe('0x999');
      });
    });

    describe('call tracking', () => {
      it('records all calls', async () => {
        await provider.request({ method: 'eth_chainId' });
        await provider.request({ method: 'eth_blockNumber' });

        const calls = provider.getCalls();
        expect(calls).toHaveLength(2);
        expect(calls[0].method).toBe('eth_chainId');
        expect(calls[1].method).toBe('eth_blockNumber');
      });

      it('filters calls by method', async () => {
        await provider.request({ method: 'eth_chainId' });
        await provider.request({ method: 'eth_blockNumber' });
        await provider.request({ method: 'eth_chainId' });

        const chainIdCalls = provider.getCallsByMethod('eth_chainId');
        expect(chainIdCalls).toHaveLength(2);
      });

      it('clears calls', async () => {
        await provider.request({ method: 'eth_chainId' });
        provider.clearCalls();
        expect(provider.getCalls()).toHaveLength(0);
      });
    });
  });

  // ============================================================================
  // Factory Functions Tests
  // ============================================================================

  describe('Factory Functions', () => {
    describe('createConnectedProvider', () => {
      it('creates provider with default account', () => {
        const provider = createConnectedProvider();
        const state = provider.getState();
        expect(state.accounts.length).toBeGreaterThan(0);
        expect(state.isConnected).toBe(true);
      });

      it('accepts custom accounts', () => {
        const provider = createConnectedProvider({
          accounts: ['0xCustomAccount123456789012345678901234567890'],
        });
        expect(provider.getState().accounts).toContain('0xCustomAccount123456789012345678901234567890');
      });
    });

    describe('createDisconnectedProvider', () => {
      it('creates provider with no accounts', () => {
        const provider = createDisconnectedProvider();
        const state = provider.getState();
        expect(state.accounts).toEqual([]);
        expect(state.isConnected).toBe(false);
      });
    });

    describe('createRejectingProvider', () => {
      it('creates provider that rejects first request', async () => {
        const provider = createRejectingProvider('USER_REJECTED');

        await expect(
          provider.request({ method: 'eth_requestAccounts' })
        ).rejects.toThrow();
      });

      it('accepts different error codes', async () => {
        const provider = createRejectingProvider('CHAIN_DISCONNECTED');

        await expect(
          provider.request({ method: 'eth_chainId' })
        ).rejects.toThrow('CHAIN_DISCONNECTED');
      });
    });
  });

  // ============================================================================
  // Window Utilities Tests
  // ============================================================================

  describe('Window Utilities', () => {
    describe('installMockProvider', () => {
      it('sets window.ethereum', () => {
        const provider = new MockEthereumProvider();
        const cleanup = installMockProvider(provider);

        expect((globalThis as unknown as { ethereum: MockEthereumProvider }).ethereum).toBe(provider);

        cleanup();
      });

      it('restores original on cleanup', () => {
        const original = { original: true };
        (globalThis as unknown as { ethereum: unknown }).ethereum = original;

        const provider = new MockEthereumProvider();
        const cleanup = installMockProvider(provider);

        expect((globalThis as unknown as { ethereum: MockEthereumProvider }).ethereum).toBe(provider);

        cleanup();

        expect((globalThis as unknown as { ethereum: unknown }).ethereum).toBe(original);

        // Clean up for other tests
        delete (globalThis as unknown as { ethereum?: unknown }).ethereum;
      });
    });

    describe('mockWindowEthereum', () => {
      afterEach(() => {
        // Clean up window.ethereum
        delete (globalThis as unknown as { ethereum?: unknown }).ethereum;
      });

      it('creates and installs provider', () => {
        const { provider, cleanup } = mockWindowEthereum();

        expect((globalThis as unknown as { ethereum: MockEthereumProvider }).ethereum).toBe(provider);
        expect(provider).toBeInstanceOf(MockEthereumProvider);

        cleanup();
      });

      it('accepts configuration', () => {
        const { provider, cleanup } = mockWindowEthereum({
          chainId: CHAIN_IDS.CRONOS_MAINNET,
        });

        expect(provider.getState().chainId).toBe('0x19');

        cleanup();
      });
    });
  });

  // ============================================================================
  // Assertion Helpers Tests
  // ============================================================================

  describe('Assertion Helpers', () => {
    let provider: MockEthereumProvider;

    beforeEach(() => {
      provider = new MockEthereumProvider();
    });

    describe('assertMethodCalled', () => {
      it('passes when method was called', async () => {
        await provider.request({ method: 'eth_chainId' });
        expect(() => assertMethodCalled(provider, 'eth_chainId')).not.toThrow();
      });

      it('throws when method was not called', () => {
        expect(() => assertMethodCalled(provider, 'eth_chainId')).toThrow(
          'Expected method "eth_chainId" to be called'
        );
      });

      it('validates params when provided', async () => {
        await provider.request({
          method: 'eth_getBalance',
          params: ['0x1234'],
        });

        expect(() =>
          assertMethodCalled(provider, 'eth_getBalance', ['0x1234'])
        ).not.toThrow();

        expect(() =>
          assertMethodCalled(provider, 'eth_getBalance', ['0x5678'])
        ).toThrow('Expected params');
      });
    });

    describe('assertAccountsRequested', () => {
      it('passes when accounts were requested', async () => {
        await provider.request({ method: 'eth_requestAccounts' });
        expect(() => assertAccountsRequested(provider)).not.toThrow();
      });

      it('throws when accounts were not requested', () => {
        expect(() => assertAccountsRequested(provider)).toThrow();
      });
    });

    describe('assertChainSwitched', () => {
      it('passes when chain was switched', async () => {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x19' }],
        });
        expect(() => assertChainSwitched(provider)).not.toThrow();
      });

      it('validates chain ID when provided', async () => {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x19' }],
        });

        expect(() => assertChainSwitched(provider, CHAIN_IDS.CRONOS_MAINNET)).not.toThrow();
        expect(() => assertChainSwitched(provider, CHAIN_IDS.CRONOS_TESTNET)).toThrow();
      });
    });

    describe('assertSignatureRequested', () => {
      it('passes for personal_sign', async () => {
        await provider.request({
          method: 'personal_sign',
          params: ['message', '0x1234'],
        });
        expect(() => assertSignatureRequested(provider)).not.toThrow();
      });

      it('passes for eth_signTypedData_v4', async () => {
        await provider.request({
          method: 'eth_signTypedData_v4',
          params: ['0x1234', '{}'],
        });
        expect(() => assertSignatureRequested(provider)).not.toThrow();
      });

      it('throws when no signature was requested', () => {
        expect(() => assertSignatureRequested(provider)).toThrow(
          'Expected a signature request'
        );
      });
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('Integration Examples', () => {
    it('simulates full connection flow', async () => {
      const { provider, cleanup } = mockWindowEthereum({
        chainId: CHAIN_IDS.CRONOS_TESTNET,
      });

      try {
        // Check chain
        const chainId = await provider.request({ method: 'eth_chainId' });
        expect(chainId).toBe('0x152');

        // Request accounts
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        expect((accounts as string[]).length).toBeGreaterThan(0);

        // Get balance
        const balance = await provider.request({
          method: 'eth_getBalance',
          params: [(accounts as string[])[0]],
        });
        expect(balance).toBeDefined();

        // Assertions
        assertAccountsRequested(provider);
        assertMethodCalled(provider, 'eth_getBalance');
      } finally {
        cleanup();
      }
    });

    it('simulates chain switching', async () => {
      const provider = new MockEthereumProvider({
        chainId: CHAIN_IDS.CRONOS_TESTNET,
      });

      const chainListener = vi.fn();
      provider.on('chainChanged', chainListener);

      // Switch to mainnet
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdToHex(CHAIN_IDS.CRONOS_MAINNET) }],
      });

      expect(chainListener).toHaveBeenCalledWith('0x19');
      expect(provider.getState().chainId).toBe('0x19');
      assertChainSwitched(provider, CHAIN_IDS.CRONOS_MAINNET);
    });

    it('simulates transaction flow', async () => {
      const provider = createConnectedProvider();

      // Send transaction
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: provider.getState().accounts[0],
          to: '0x1234567890abcdef1234567890abcdef12345678',
          value: '0x1000',
        }],
      });

      expect(txHash).toMatch(/^0x/);

      // Get receipt
      const receipt = await provider.request({
        method: 'eth_getTransactionReceipt',
        params: [txHash],
      });

      expect((receipt as Record<string, unknown>).transactionHash).toBe(txHash);
      expect((receipt as Record<string, unknown>).status).toBe('0x1');
    });

    it('simulates wallet rejection', async () => {
      const provider = new MockEthereumProvider();

      // User rejects connection
      provider.setNextRequestToReject();

      await expect(
        provider.request({ method: 'eth_requestAccounts' })
      ).rejects.toThrow('User rejected');

      // Provider remains disconnected
      expect(provider.getState().isConnected).toBe(false);
    });
  });
});
