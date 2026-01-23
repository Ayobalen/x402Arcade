/**
 * Wallet Mock Utilities - Comprehensive Tests
 *
 * Tests for wallet connection and transaction testing utilities.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  // Main class
  MockWallet,
  // Constants
  CHAIN_IDS,
  DEFAULT_TEST_ADDRESS,
  ARCADE_WALLET_ADDRESS,
  USDC_CONTRACT_ADDRESS,
  DEFAULT_BALANCE,
  DEFAULT_USDC_BALANCE,
  // Error factories
  createWalletError,
  userRejectedError,
  chainNotSupportedError,
  insufficientFundsError,
  // Factory functions
  mockConnectedWallet,
  mockDisconnectedWallet,
  mockWalletError,
  mockSignMessage,
  mockSignTypedData,
  // Assertions
  assertConnectionAttempted,
  assertMessageSigned,
  assertTypedDataSigned,
  assertTransactionSent,
  // Types
  type WalletErrorCode,
  type WalletAccount,
  type TransactionRequest,
  type TypedData,
  type TransferAuthorization,
} from './wallet-mock';

describe('Wallet Mock Utilities', () => {
  // ============================================================================
  // Constants Tests
  // ============================================================================

  describe('Constants', () => {
    it('exports correct chain IDs', () => {
      expect(CHAIN_IDS.CRONOS_MAINNET).toBe(25);
      expect(CHAIN_IDS.CRONOS_TESTNET).toBe(338);
      expect(CHAIN_IDS.ETHEREUM_MAINNET).toBe(1);
      expect(CHAIN_IDS.ETHEREUM_GOERLI).toBe(5);
      expect(CHAIN_IDS.SEPOLIA).toBe(11155111);
    });

    it('exports default addresses', () => {
      expect(DEFAULT_TEST_ADDRESS).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(ARCADE_WALLET_ADDRESS).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(USDC_CONTRACT_ADDRESS).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('exports default balances', () => {
      expect(DEFAULT_BALANCE).toBe(BigInt('10000000000000000000')); // 10 TCRO
      expect(DEFAULT_USDC_BALANCE).toBe(BigInt('100000000')); // 100 USDC
    });
  });

  // ============================================================================
  // Error Factories Tests
  // ============================================================================

  describe('Error Factories', () => {
    describe('createWalletError', () => {
      it('creates error with code and message', () => {
        const error = createWalletError('USER_REJECTED', 'Test message');
        expect(error.code).toBe('USER_REJECTED');
        expect(error.message).toBe('Test message');
        expect(error.name).toBe('WalletError');
      });

      it('includes optional data', () => {
        const error = createWalletError('UNKNOWN', 'Test', { extra: 'data' });
        expect(error.data).toEqual({ extra: 'data' });
      });
    });

    describe('userRejectedError', () => {
      it('creates USER_REJECTED error', () => {
        const error = userRejectedError();
        expect(error.code).toBe('USER_REJECTED');
        expect(error.message).toBe('User rejected the request');
      });
    });

    describe('chainNotSupportedError', () => {
      it('creates CHAIN_NOT_SUPPORTED error with chain ID', () => {
        const error = chainNotSupportedError(999);
        expect(error.code).toBe('CHAIN_NOT_SUPPORTED');
        expect(error.message).toContain('999');
        expect(error.data).toEqual({ chainId: 999 });
      });
    });

    describe('insufficientFundsError', () => {
      it('creates INSUFFICIENT_FUNDS error', () => {
        const error = insufficientFundsError();
        expect(error.code).toBe('INSUFFICIENT_FUNDS');
      });
    });
  });

  // ============================================================================
  // MockWallet Class Tests
  // ============================================================================

  describe('MockWallet', () => {
    let wallet: MockWallet;

    beforeEach(() => {
      wallet = new MockWallet();
    });

    describe('initialization', () => {
      it('creates wallet with default config', () => {
        const state = wallet.getState();
        expect(state.status).toBe('disconnected');
        expect(state.account).toBeNull();
        expect(state.balance).toBe(DEFAULT_BALANCE);
        expect(state.usdcBalance).toBe(DEFAULT_USDC_BALANCE);
        expect(state.error).toBeNull();
      });

      it('accepts custom config', () => {
        const customWallet = new MockWallet({
          chainId: CHAIN_IDS.CRONOS_MAINNET,
          address: '0xCustomAddress1234567890abcdef12345678',
          balance: '5000000000000000000',
          usdcBalance: '50000000',
        });

        const state = customWallet.getState();
        expect(state.balance).toBe(BigInt('5000000000000000000'));
        expect(state.usdcBalance).toBe(BigInt('50000000'));
      });
    });

    describe('connect', () => {
      it('connects successfully', async () => {
        const account = await wallet.connect();

        expect(account.isConnected).toBe(true);
        expect(account.address).toBe(DEFAULT_TEST_ADDRESS);
        expect(account.chainId).toBe(CHAIN_IDS.CRONOS_TESTNET);

        const state = wallet.getState();
        expect(state.status).toBe('connected');
        expect(state.account).toEqual(account);
      });

      it('records connect call', async () => {
        await wallet.connect();

        const calls = wallet.getCalls();
        expect(calls).toHaveLength(1);
        expect(calls[0].method).toBe('connect');
      });

      it('simulates connection delay', async () => {
        const delayWallet = new MockWallet({ connectionDelay: 50 });

        const startTime = Date.now();
        await delayWallet.connect();
        const elapsed = Date.now() - startTime;

        expect(elapsed).toBeGreaterThanOrEqual(50);
      });

      it('rejects when configured', async () => {
        wallet.setNextRequestToReject();

        await expect(wallet.connect()).rejects.toThrow('User rejected');
      });

      it('rejects with custom error', async () => {
        wallet.setNextRequestToReject(chainNotSupportedError(999));

        await expect(wallet.connect()).rejects.toThrow('Chain 999 is not supported');
      });
    });

    describe('disconnect', () => {
      it('disconnects wallet', async () => {
        await wallet.connect();
        wallet.disconnect();

        const state = wallet.getState();
        expect(state.status).toBe('disconnected');
        expect(state.account).toBeNull();
      });

      it('records disconnect call', async () => {
        await wallet.connect();
        wallet.disconnect();

        const calls = wallet.getCallsByMethod('disconnect');
        expect(calls).toHaveLength(1);
      });
    });

    describe('switchChain', () => {
      it('switches to new chain', async () => {
        await wallet.connect();
        await wallet.switchChain(CHAIN_IDS.CRONOS_MAINNET);

        const state = wallet.getState();
        expect(state.account?.chainId).toBe(CHAIN_IDS.CRONOS_MAINNET);
      });

      it('records switchChain call', async () => {
        await wallet.connect();
        await wallet.switchChain(CHAIN_IDS.CRONOS_MAINNET);

        const calls = wallet.getCallsByMethod('switchChain');
        expect(calls).toHaveLength(1);
        expect(calls[0].params[0]).toBe(CHAIN_IDS.CRONOS_MAINNET);
      });
    });

    describe('getAccounts', () => {
      it('returns empty array when disconnected', async () => {
        const accounts = await wallet.getAccounts();
        expect(accounts).toEqual([]);
      });

      it('returns account address when connected', async () => {
        await wallet.connect();
        const accounts = await wallet.getAccounts();
        expect(accounts).toEqual([DEFAULT_TEST_ADDRESS]);
      });
    });

    describe('signMessage', () => {
      beforeEach(async () => {
        await wallet.connect();
      });

      it('signs message successfully', async () => {
        const signature = await wallet.signMessage('Hello, World!');

        expect(signature).toMatch(/^0x/);
        expect(signature.length).toBeGreaterThan(2);
      });

      it('generates deterministic signatures', async () => {
        const sig1 = await wallet.signMessage('test');
        const sig2 = await wallet.signMessage('test');

        expect(sig1).toBe(sig2);
      });

      it('generates different signatures for different messages', async () => {
        const sig1 = await wallet.signMessage('message1');
        const sig2 = await wallet.signMessage('message2');

        expect(sig1).not.toBe(sig2);
      });

      it('uses custom signature when set', async () => {
        wallet.setCustomSignature('0xCustomSignature123');
        const signature = await wallet.signMessage('test');

        expect(signature).toBe('0xCustomSignature123');
      });

      it('throws when not connected', async () => {
        wallet.disconnect();

        await expect(wallet.signMessage('test')).rejects.toThrow('not connected');
      });

      it('rejects when configured', async () => {
        wallet.setNextRequestToReject();

        await expect(wallet.signMessage('test')).rejects.toThrow('User rejected');
      });

      it('records signMessage call', async () => {
        await wallet.signMessage('Hello');

        const calls = wallet.getCallsByMethod('signMessage');
        expect(calls).toHaveLength(1);
        expect(calls[0].params[0]).toBe('Hello');
      });
    });

    describe('signTypedData', () => {
      const typedData: TypedData = {
        domain: {
          name: 'Test',
          version: '1',
          chainId: CHAIN_IDS.CRONOS_TESTNET,
        },
        types: {
          Message: [{ name: 'content', type: 'string' }],
        },
        primaryType: 'Message',
        message: { content: 'Hello' },
      };

      beforeEach(async () => {
        await wallet.connect();
      });

      it('signs typed data successfully', async () => {
        const signature = await wallet.signTypedData(typedData);

        expect(signature).toMatch(/^0x/);
      });

      it('throws when not connected', async () => {
        wallet.disconnect();

        await expect(wallet.signTypedData(typedData)).rejects.toThrow('not connected');
      });

      it('records signTypedData call', async () => {
        await wallet.signTypedData(typedData);

        const calls = wallet.getCallsByMethod('signTypedData');
        expect(calls).toHaveLength(1);
        expect(calls[0].params[0]).toEqual(typedData);
      });
    });

    describe('signTransferAuthorization', () => {
      beforeEach(async () => {
        await wallet.connect();
      });

      it('signs transfer authorization (EIP-3009)', async () => {
        const auth: TransferAuthorization = {
          from: DEFAULT_TEST_ADDRESS,
          to: ARCADE_WALLET_ADDRESS,
          value: BigInt(1000000),
          validAfter: BigInt(0),
          validBefore: BigInt(9999999999),
          nonce: '0x' + '0'.repeat(64) as `0x${string}`,
        };

        const signature = await wallet.signTransferAuthorization(auth);

        expect(signature).toMatch(/^0x/);

        // Should record both signTransferAuthorization and signTypedData
        const authCalls = wallet.getCallsByMethod('signTransferAuthorization');
        expect(authCalls).toHaveLength(1);
      });
    });

    describe('sendTransaction', () => {
      beforeEach(async () => {
        await wallet.connect();
      });

      it('sends transaction successfully', async () => {
        const txHash = await wallet.sendTransaction({
          to: ARCADE_WALLET_ADDRESS,
          value: BigInt(1000),
        });

        expect(txHash).toMatch(/^0x/);
      });

      it('deducts balance', async () => {
        const initialBalance = wallet.getState().balance;
        const sendAmount = BigInt(1000);

        await wallet.sendTransaction({
          to: ARCADE_WALLET_ADDRESS,
          value: sendAmount,
        });

        expect(wallet.getState().balance).toBe(initialBalance - sendAmount);
      });

      it('throws on insufficient funds', async () => {
        const tooMuch = wallet.getState().balance + BigInt(1);

        await expect(
          wallet.sendTransaction({
            to: ARCADE_WALLET_ADDRESS,
            value: tooMuch,
          })
        ).rejects.toThrow('Insufficient funds');
      });

      it('throws when not connected', async () => {
        wallet.disconnect();

        await expect(
          wallet.sendTransaction({
            to: ARCADE_WALLET_ADDRESS,
            value: BigInt(1000),
          })
        ).rejects.toThrow('not connected');
      });

      it('records sendTransaction call', async () => {
        await wallet.sendTransaction({
          to: ARCADE_WALLET_ADDRESS,
          value: BigInt(1000),
        });

        const calls = wallet.getCallsByMethod('sendTransaction');
        expect(calls).toHaveLength(1);
      });
    });

    describe('waitForTransaction', () => {
      beforeEach(async () => {
        await wallet.connect();
      });

      it('returns transaction receipt', async () => {
        const txHash = await wallet.sendTransaction({
          to: ARCADE_WALLET_ADDRESS,
          value: BigInt(1000),
        });

        const receipt = await wallet.waitForTransaction(txHash);

        expect(receipt.transactionHash).toBe(txHash);
        expect(receipt.status).toBe('success');
        expect(receipt.blockNumber).toBeGreaterThan(0);
      });
    });

    describe('generateNonce', () => {
      it('generates unique nonces', () => {
        const nonce1 = wallet.generateNonce();
        const nonce2 = wallet.generateNonce();

        expect(nonce1).toMatch(/^0x[a-fA-F0-9]{64}$/);
        expect(nonce1).not.toBe(nonce2);
      });
    });

    describe('createTransferAuth', () => {
      it('creates valid transfer authorization', () => {
        const auth = wallet.createTransferAuth(
          ARCADE_WALLET_ADDRESS,
          BigInt(1000000)
        );

        expect(auth.from).toBe(DEFAULT_TEST_ADDRESS);
        expect(auth.to).toBe(ARCADE_WALLET_ADDRESS);
        expect(auth.value).toBe(BigInt(1000000));
        expect(auth.nonce).toMatch(/^0x/);
        expect(auth.validBefore).toBeGreaterThan(auth.validAfter);
      });
    });

    describe('state management', () => {
      it('setBalance updates balance', () => {
        wallet.setBalance(BigInt(5000));
        expect(wallet.getState().balance).toBe(BigInt(5000));
      });

      it('setUsdcBalance updates USDC balance', () => {
        wallet.setUsdcBalance(BigInt(5000));
        expect(wallet.getState().usdcBalance).toBe(BigInt(5000));
      });

      it('setError sets error state', () => {
        const error = userRejectedError();
        wallet.setError(error);

        const state = wallet.getState();
        expect(state.error).toBe(error);
        expect(state.status).toBe('error');
      });

      it('reset returns to initial state', async () => {
        await wallet.connect();
        wallet.setBalance(BigInt(0));
        wallet.reset();

        const state = wallet.getState();
        expect(state.status).toBe('disconnected');
        expect(state.balance).toBe(DEFAULT_BALANCE);
        expect(wallet.getCalls()).toHaveLength(0);
      });
    });

    describe('call tracking', () => {
      it('getCalls returns all calls', async () => {
        await wallet.connect();
        await wallet.signMessage('test');
        wallet.disconnect();

        expect(wallet.getCalls()).toHaveLength(3);
      });

      it('getCallsByMethod filters by method', async () => {
        await wallet.connect();
        await wallet.signMessage('test1');
        await wallet.signMessage('test2');

        const signCalls = wallet.getCallsByMethod('signMessage');
        expect(signCalls).toHaveLength(2);
      });

      it('clearCalls clears history', async () => {
        await wallet.connect();
        wallet.clearCalls();

        expect(wallet.getCalls()).toHaveLength(0);
      });
    });
  });

  // ============================================================================
  // Factory Functions Tests
  // ============================================================================

  describe('Factory Functions', () => {
    describe('mockConnectedWallet', () => {
      it('creates connected wallet', async () => {
        const { wallet, account } = await mockConnectedWallet();

        expect(wallet.getState().status).toBe('connected');
        expect(account.isConnected).toBe(true);
      });

      it('accepts custom config', async () => {
        const { wallet } = await mockConnectedWallet({
          chainId: CHAIN_IDS.CRONOS_MAINNET,
        });

        expect(wallet.getState().account?.chainId).toBe(CHAIN_IDS.CRONOS_MAINNET);
      });
    });

    describe('mockDisconnectedWallet', () => {
      it('creates disconnected wallet', () => {
        const wallet = mockDisconnectedWallet();

        expect(wallet.getState().status).toBe('disconnected');
        expect(wallet.getState().account).toBeNull();
      });
    });

    describe('mockWalletError', () => {
      it('creates wallet that rejects connection', async () => {
        const wallet = mockWalletError('USER_REJECTED');

        await expect(wallet.connect()).rejects.toThrow('User rejected');
      });

      it('supports different error codes', async () => {
        const wallet = mockWalletError('CHAIN_NOT_SUPPORTED');

        await expect(wallet.connect()).rejects.toThrow('Chain not supported');
      });
    });

    describe('mockSignMessage', () => {
      it('creates sign message mock', async () => {
        const signMessage = mockSignMessage();
        const signature = await signMessage('test');

        expect(signature).toMatch(/^0x/);
        expect(signMessage).toHaveBeenCalledWith('test');
      });

      it('can reject', async () => {
        const signMessage = mockSignMessage({ shouldReject: true });

        await expect(signMessage('test')).rejects.toThrow('User rejected');
      });

      it('can use custom signature', async () => {
        const signMessage = mockSignMessage({
          customSignature: '0xCustomSig',
        });

        const signature = await signMessage('test');
        expect(signature).toBe('0xCustomSig');
      });

      it('can simulate delay', async () => {
        const signMessage = mockSignMessage({ delay: 50 });

        const startTime = Date.now();
        await signMessage('test');
        const elapsed = Date.now() - startTime;

        expect(elapsed).toBeGreaterThanOrEqual(50);
      });
    });

    describe('mockSignTypedData', () => {
      const typedData: TypedData = {
        domain: { name: 'Test' },
        types: { Message: [{ name: 'content', type: 'string' }] },
        primaryType: 'Message',
        message: { content: 'Hello' },
      };

      it('creates sign typed data mock', async () => {
        const signTypedData = mockSignTypedData();
        const signature = await signTypedData(typedData);

        expect(signature).toMatch(/^0x/);
        expect(signTypedData).toHaveBeenCalledWith(typedData);
      });

      it('can reject', async () => {
        const signTypedData = mockSignTypedData({ shouldReject: true });

        await expect(signTypedData(typedData)).rejects.toThrow('User rejected');
      });
    });
  });

  // ============================================================================
  // Assertion Helpers Tests
  // ============================================================================

  describe('Assertion Helpers', () => {
    let wallet: MockWallet;

    beforeEach(async () => {
      wallet = new MockWallet();
    });

    describe('assertConnectionAttempted', () => {
      it('passes when connect was called', async () => {
        await wallet.connect();
        expect(() => assertConnectionAttempted(wallet)).not.toThrow();
      });

      it('throws when connect was not called', () => {
        expect(() => assertConnectionAttempted(wallet)).toThrow(
          'Expected wallet connection to be attempted'
        );
      });
    });

    describe('assertMessageSigned', () => {
      beforeEach(async () => {
        await wallet.connect();
      });

      it('passes when message was signed', async () => {
        await wallet.signMessage('test');
        expect(() => assertMessageSigned(wallet)).not.toThrow();
      });

      it('passes when expected message matches', async () => {
        await wallet.signMessage('Hello');
        expect(() => assertMessageSigned(wallet, 'Hello')).not.toThrow();
      });

      it('throws when expected message does not match', async () => {
        await wallet.signMessage('Hello');
        expect(() => assertMessageSigned(wallet, 'Goodbye')).toThrow(
          'Expected message "Goodbye" but got "Hello"'
        );
      });

      it('throws when no message was signed', () => {
        expect(() => assertMessageSigned(wallet)).toThrow(
          'Expected message signing to be attempted'
        );
      });
    });

    describe('assertTypedDataSigned', () => {
      const typedData: TypedData = {
        domain: { name: 'Test' },
        types: { Message: [{ name: 'content', type: 'string' }] },
        primaryType: 'Message',
        message: { content: 'Hello' },
      };

      beforeEach(async () => {
        await wallet.connect();
      });

      it('passes when typed data was signed', async () => {
        await wallet.signTypedData(typedData);
        expect(() => assertTypedDataSigned(wallet)).not.toThrow();
      });

      it('throws when no typed data was signed', () => {
        expect(() => assertTypedDataSigned(wallet)).toThrow(
          'Expected typed data signing to be attempted'
        );
      });
    });

    describe('assertTransactionSent', () => {
      beforeEach(async () => {
        await wallet.connect();
      });

      it('passes when transaction was sent', async () => {
        await wallet.sendTransaction({
          to: ARCADE_WALLET_ADDRESS,
          value: BigInt(1000),
        });
        expect(() => assertTransactionSent(wallet)).not.toThrow();
      });

      it('passes when expected recipient matches', async () => {
        await wallet.sendTransaction({
          to: ARCADE_WALLET_ADDRESS,
          value: BigInt(1000),
        });
        expect(() => assertTransactionSent(wallet, ARCADE_WALLET_ADDRESS)).not.toThrow();
      });

      it('throws when expected recipient does not match', async () => {
        await wallet.sendTransaction({
          to: ARCADE_WALLET_ADDRESS,
          value: BigInt(1000),
        });
        expect(() => assertTransactionSent(wallet, DEFAULT_TEST_ADDRESS)).toThrow(
          'Expected transaction to'
        );
      });

      it('throws when no transaction was sent', () => {
        expect(() => assertTransactionSent(wallet)).toThrow(
          'Expected transaction to be sent'
        );
      });
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('Integration Examples', () => {
    it('simulates full x402 payment flow', async () => {
      // Setup: Connected wallet with sufficient balance
      const { wallet } = await mockConnectedWallet({
        usdcBalance: '100000000', // 100 USDC
      });

      // Step 1: Create transfer authorization for 1 USDC
      const auth = wallet.createTransferAuth(
        ARCADE_WALLET_ADDRESS,
        BigInt(1000000) // 1 USDC (6 decimals)
      );

      expect(auth.from).toBe(DEFAULT_TEST_ADDRESS);
      expect(auth.to).toBe(ARCADE_WALLET_ADDRESS);
      expect(auth.value).toBe(BigInt(1000000));

      // Step 2: Sign the authorization (EIP-3009)
      const signature = await wallet.signTransferAuthorization(auth);

      expect(signature).toMatch(/^0x/);
      assertTypedDataSigned(wallet);

      // Step 3: Verify wallet recorded all calls
      const calls = wallet.getCalls();
      expect(calls.length).toBeGreaterThan(0);
    });

    it('handles user rejection gracefully', async () => {
      const wallet = mockWalletError('USER_REJECTED');

      try {
        await wallet.connect();
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toContain('rejected');
      }

      // Wallet should remain disconnected
      expect(wallet.getState().status).toBe('disconnected');
    });

    it('tracks multiple signing operations', async () => {
      const { wallet } = await mockConnectedWallet();

      // Sign multiple messages
      await wallet.signMessage('Message 1');
      await wallet.signMessage('Message 2');
      await wallet.signMessage('Message 3');

      const signCalls = wallet.getCallsByMethod('signMessage');
      expect(signCalls).toHaveLength(3);
      expect(signCalls[0].params[0]).toBe('Message 1');
      expect(signCalls[1].params[0]).toBe('Message 2');
      expect(signCalls[2].params[0]).toBe('Message 3');
    });

    it('simulates intermittent failures', async () => {
      const { wallet } = await mockConnectedWallet();

      // First sign succeeds
      const sig1 = await wallet.signMessage('test1');
      expect(sig1).toBeDefined();

      // Configure next to fail
      wallet.setNextRequestToReject();

      // Second sign fails
      await expect(wallet.signMessage('test2')).rejects.toThrow();

      // Third sign succeeds (rejection was consumed)
      const sig3 = await wallet.signMessage('test3');
      expect(sig3).toBeDefined();
    });

    it('simulates balance changes', async () => {
      const { wallet } = await mockConnectedWallet();
      const initialBalance = wallet.getState().balance;

      // Send transaction
      await wallet.sendTransaction({
        to: ARCADE_WALLET_ADDRESS,
        value: BigInt(1000),
      });

      expect(wallet.getState().balance).toBe(initialBalance - BigInt(1000));

      // Reset should restore balance
      wallet.reset();
      expect(wallet.getState().balance).toBe(initialBalance);
    });
  });
});
