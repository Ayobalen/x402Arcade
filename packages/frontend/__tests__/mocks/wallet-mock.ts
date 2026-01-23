/**
 * Wallet Mock Utilities
 *
 * Comprehensive mocks for wallet connection and transaction testing.
 * Simulates real wallet behavior including connection, signing, and transactions.
 */

import { vi, type Mock } from 'vitest';

// ============================================================================
// Types
// ============================================================================

/**
 * Supported network chain IDs
 */
export const CHAIN_IDS = {
  CRONOS_MAINNET: 25,
  CRONOS_TESTNET: 338,
  ETHEREUM_MAINNET: 1,
  ETHEREUM_GOERLI: 5,
  SEPOLIA: 11155111,
} as const;

export type ChainId = (typeof CHAIN_IDS)[keyof typeof CHAIN_IDS];

/**
 * Wallet connection state
 */
export type WalletConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

/**
 * Wallet account information
 */
export interface WalletAccount {
  address: `0x${string}`;
  chainId: ChainId;
  isConnected: boolean;
}

/**
 * Transaction request structure
 */
export interface TransactionRequest {
  to?: `0x${string}`;
  from?: `0x${string}`;
  value?: bigint | string;
  data?: `0x${string}`;
  gasLimit?: bigint;
  gasPrice?: bigint;
  nonce?: number;
}

/**
 * Transaction receipt structure
 */
export interface TransactionReceipt {
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  blockHash: `0x${string}`;
  status: 'success' | 'reverted';
  gasUsed: bigint;
  effectiveGasPrice: bigint;
}

/**
 * EIP-712 typed data structure
 */
export interface TypedData {
  domain: {
    name?: string;
    version?: string;
    chainId?: number;
    verifyingContract?: `0x${string}`;
  };
  types: Record<string, Array<{ name: string; type: string }>>;
  primaryType: string;
  message: Record<string, unknown>;
}

/**
 * EIP-3009 transfer authorization (used by x402)
 */
export interface TransferAuthorization {
  from: `0x${string}`;
  to: `0x${string}`;
  value: bigint;
  validAfter: bigint;
  validBefore: bigint;
  nonce: `0x${string}`;
}

/**
 * Wallet error types
 */
export type WalletErrorCode =
  | 'USER_REJECTED'
  | 'CHAIN_NOT_SUPPORTED'
  | 'ALREADY_PROCESSING'
  | 'INSUFFICIENT_FUNDS'
  | 'NONCE_TOO_LOW'
  | 'GAS_LIMIT_EXCEEDED'
  | 'EXECUTION_REVERTED'
  | 'UNKNOWN';

/**
 * Wallet error with code and message
 */
export interface WalletError extends Error {
  code: WalletErrorCode;
  data?: unknown;
}

/**
 * Mock wallet configuration
 */
export interface MockWalletConfig {
  /** Initial chain ID */
  chainId?: ChainId;
  /** Initial account address */
  address?: `0x${string}`;
  /** Native token balance (in wei as string) */
  balance?: string;
  /** USDC balance (in smallest unit) */
  usdcBalance?: string;
  /** Simulate connection delay (ms) */
  connectionDelay?: number;
  /** Simulate signing delay (ms) */
  signingDelay?: number;
  /** Simulate transaction delay (ms) */
  transactionDelay?: number;
  /** Auto-approve all requests */
  autoApprove?: boolean;
}

/**
 * Mock wallet state
 */
export interface MockWalletState {
  status: WalletConnectionStatus;
  account: WalletAccount | null;
  balance: bigint;
  usdcBalance: bigint;
  error: WalletError | null;
  pendingRequests: number;
}

/**
 * Call tracking for assertions
 */
export interface WalletCallRecord {
  method: string;
  params: unknown[];
  timestamp: number;
  result?: unknown;
  error?: WalletError;
}

// ============================================================================
// Constants
// ============================================================================

/** Default test wallet address */
export const DEFAULT_TEST_ADDRESS: `0x${string}` =
  '0x1234567890abcdef1234567890abcdef12345678';

/** Arcade wallet address (payment recipient) */
export const ARCADE_WALLET_ADDRESS: `0x${string}` =
  '0xA0CADE0000000000000000000000000000000000';

/** devUSDC.e contract address on Cronos Testnet */
export const USDC_CONTRACT_ADDRESS: `0x${string}` =
  '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0';

/** Default test balance: 10 TCRO */
export const DEFAULT_BALANCE = BigInt('10000000000000000000');

/** Default USDC balance: 100 USDC (6 decimals) */
export const DEFAULT_USDC_BALANCE = BigInt('100000000');

// ============================================================================
// Error Factories
// ============================================================================

/**
 * Create a wallet error with proper structure
 */
export function createWalletError(
  code: WalletErrorCode,
  message: string,
  data?: unknown
): WalletError {
  const error = new Error(message) as WalletError;
  error.code = code;
  error.name = 'WalletError';
  if (data) error.data = data;
  return error;
}

/**
 * Common error: User rejected the request
 */
export function userRejectedError(): WalletError {
  return createWalletError('USER_REJECTED', 'User rejected the request');
}

/**
 * Common error: Chain not supported
 */
export function chainNotSupportedError(chainId: number): WalletError {
  return createWalletError(
    'CHAIN_NOT_SUPPORTED',
    `Chain ${chainId} is not supported`,
    { chainId }
  );
}

/**
 * Common error: Insufficient funds
 */
export function insufficientFundsError(): WalletError {
  return createWalletError('INSUFFICIENT_FUNDS', 'Insufficient funds for gas');
}

// ============================================================================
// Mock Wallet Class
// ============================================================================

/**
 * Comprehensive mock wallet for testing.
 * Simulates wallet connection, signing, and transaction behavior.
 *
 * @example
 * ```typescript
 * const wallet = new MockWallet({ chainId: CHAIN_IDS.CRONOS_TESTNET });
 *
 * // Connect
 * await wallet.connect();
 * expect(wallet.getState().status).toBe('connected');
 *
 * // Sign message
 * const signature = await wallet.signMessage('Hello');
 * expect(signature).toMatch(/^0x/);
 *
 * // Configure to reject next request
 * wallet.setNextRequestToReject();
 * await expect(wallet.signMessage('test')).rejects.toThrow('User rejected');
 *
 * // Check call history
 * expect(wallet.getCalls()).toHaveLength(2);
 * ```
 */
export class MockWallet {
  private state: MockWalletState;
  private config: Required<MockWalletConfig>;
  private calls: WalletCallRecord[] = [];
  private nextShouldReject = false;
  private nextRejectError: WalletError | null = null;
  private customSignatureValue: string | null = null;
  private nonceCounter = 0;

  constructor(config: MockWalletConfig = {}) {
    this.config = {
      chainId: config.chainId ?? CHAIN_IDS.CRONOS_TESTNET,
      address: config.address ?? DEFAULT_TEST_ADDRESS,
      balance: config.balance ?? DEFAULT_BALANCE.toString(),
      usdcBalance: config.usdcBalance ?? DEFAULT_USDC_BALANCE.toString(),
      connectionDelay: config.connectionDelay ?? 0,
      signingDelay: config.signingDelay ?? 0,
      transactionDelay: config.transactionDelay ?? 0,
      autoApprove: config.autoApprove ?? true,
    };

    this.state = {
      status: 'disconnected',
      account: null,
      balance: BigInt(this.config.balance),
      usdcBalance: BigInt(this.config.usdcBalance),
      error: null,
      pendingRequests: 0,
    };
  }

  // --------------------------------------------------------------------------
  // State Management
  // --------------------------------------------------------------------------

  /**
   * Get current wallet state
   */
  getState(): Readonly<MockWalletState> {
    return { ...this.state };
  }

  /**
   * Get all recorded calls
   */
  getCalls(): Readonly<WalletCallRecord[]> {
    return [...this.calls];
  }

  /**
   * Get calls by method name
   */
  getCallsByMethod(method: string): WalletCallRecord[] {
    return this.calls.filter((call) => call.method === method);
  }

  /**
   * Clear call history
   */
  clearCalls(): void {
    this.calls = [];
  }

  /**
   * Reset wallet to initial state
   */
  reset(): void {
    this.state = {
      status: 'disconnected',
      account: null,
      balance: BigInt(this.config.balance),
      usdcBalance: BigInt(this.config.usdcBalance),
      error: null,
      pendingRequests: 0,
    };
    this.calls = [];
    this.nextShouldReject = false;
    this.nextRejectError = null;
    this.customSignatureValue = null;
    this.nonceCounter = 0;
  }

  // --------------------------------------------------------------------------
  // Configuration for Test Scenarios
  // --------------------------------------------------------------------------

  /**
   * Set next request to be rejected
   */
  setNextRequestToReject(error?: WalletError): void {
    this.nextShouldReject = true;
    this.nextRejectError = error ?? userRejectedError();
  }

  /**
   * Set custom signature value for next sign request
   */
  setCustomSignature(signature: string): void {
    this.customSignatureValue = signature;
  }

  /**
   * Update balance
   */
  setBalance(balance: bigint): void {
    this.state.balance = balance;
  }

  /**
   * Update USDC balance
   */
  setUsdcBalance(balance: bigint): void {
    this.state.usdcBalance = balance;
  }

  /**
   * Set error state
   */
  setError(error: WalletError | null): void {
    this.state.error = error;
    if (error) {
      this.state.status = 'error';
    }
  }

  // --------------------------------------------------------------------------
  // Connection Methods
  // --------------------------------------------------------------------------

  /**
   * Connect wallet
   */
  async connect(): Promise<WalletAccount> {
    this.recordCall('connect', []);

    if (this.shouldReject()) {
      throw this.getRejectError();
    }

    if (this.config.connectionDelay > 0) {
      this.state.status = 'connecting';
      await this.delay(this.config.connectionDelay);
    }

    const account: WalletAccount = {
      address: this.config.address,
      chainId: this.config.chainId,
      isConnected: true,
    };

    this.state.status = 'connected';
    this.state.account = account;
    this.state.error = null;

    this.updateCallResult('connect', account);
    return account;
  }

  /**
   * Disconnect wallet
   */
  disconnect(): void {
    this.recordCall('disconnect', []);

    this.state.status = 'disconnected';
    this.state.account = null;
    this.state.error = null;
  }

  /**
   * Switch to a different chain
   */
  async switchChain(chainId: ChainId): Promise<void> {
    this.recordCall('switchChain', [chainId]);

    if (this.shouldReject()) {
      throw this.getRejectError();
    }

    if (this.config.connectionDelay > 0) {
      await this.delay(this.config.connectionDelay);
    }

    if (this.state.account) {
      this.state.account = {
        ...this.state.account,
        chainId,
      };
    }
    this.config.chainId = chainId;
  }

  /**
   * Get current accounts
   */
  async getAccounts(): Promise<`0x${string}`[]> {
    this.recordCall('getAccounts', []);

    if (this.state.account) {
      return [this.state.account.address];
    }
    return [];
  }

  // --------------------------------------------------------------------------
  // Signing Methods
  // --------------------------------------------------------------------------

  /**
   * Sign a plain text message
   */
  async signMessage(message: string): Promise<`0x${string}`> {
    this.recordCall('signMessage', [message]);

    this.assertConnected();

    if (this.shouldReject()) {
      throw this.getRejectError();
    }

    if (this.config.signingDelay > 0) {
      await this.delay(this.config.signingDelay);
    }

    // Use custom signature if set, otherwise generate deterministic one
    const signature = this.customSignatureValue
      ? (this.customSignatureValue as `0x${string}`)
      : this.generateSignature(message);

    this.customSignatureValue = null;
    this.updateCallResult('signMessage', signature);
    return signature;
  }

  /**
   * Sign EIP-712 typed data
   */
  async signTypedData(typedData: TypedData): Promise<`0x${string}`> {
    this.recordCall('signTypedData', [typedData]);

    this.assertConnected();

    if (this.shouldReject()) {
      throw this.getRejectError();
    }

    if (this.config.signingDelay > 0) {
      await this.delay(this.config.signingDelay);
    }

    // Use custom signature if set, otherwise generate deterministic one
    const signature = this.customSignatureValue
      ? (this.customSignatureValue as `0x${string}`)
      : this.generateTypedDataSignature(typedData);

    this.customSignatureValue = null;
    this.updateCallResult('signTypedData', signature);
    return signature;
  }

  /**
   * Sign EIP-3009 transfer authorization (used for x402 payments)
   */
  async signTransferAuthorization(
    auth: TransferAuthorization
  ): Promise<`0x${string}`> {
    const typedData: TypedData = {
      domain: {
        name: 'Bridged USDC (Stargate)',
        version: '1',
        chainId: this.config.chainId,
        verifyingContract: USDC_CONTRACT_ADDRESS,
      },
      types: {
        TransferWithAuthorization: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'validAfter', type: 'uint256' },
          { name: 'validBefore', type: 'uint256' },
          { name: 'nonce', type: 'bytes32' },
        ],
      },
      primaryType: 'TransferWithAuthorization',
      message: {
        from: auth.from,
        to: auth.to,
        value: auth.value.toString(),
        validAfter: auth.validAfter.toString(),
        validBefore: auth.validBefore.toString(),
        nonce: auth.nonce,
      },
    };

    this.recordCall('signTransferAuthorization', [auth]);
    return this.signTypedData(typedData);
  }

  // --------------------------------------------------------------------------
  // Transaction Methods
  // --------------------------------------------------------------------------

  /**
   * Send a transaction
   */
  async sendTransaction(
    tx: TransactionRequest
  ): Promise<`0x${string}`> {
    this.recordCall('sendTransaction', [tx]);

    this.assertConnected();

    if (this.shouldReject()) {
      throw this.getRejectError();
    }

    // Check balance
    const value = typeof tx.value === 'string' ? BigInt(tx.value) : tx.value ?? BigInt(0);
    if (value > this.state.balance) {
      const error = insufficientFundsError();
      this.updateCallError('sendTransaction', error);
      throw error;
    }

    if (this.config.transactionDelay > 0) {
      this.state.pendingRequests++;
      await this.delay(this.config.transactionDelay);
      this.state.pendingRequests--;
    }

    // Deduct balance
    this.state.balance -= value;

    const txHash = this.generateTxHash();
    this.updateCallResult('sendTransaction', txHash);
    return txHash;
  }

  /**
   * Wait for transaction to be mined
   */
  async waitForTransaction(
    txHash: `0x${string}`
  ): Promise<TransactionReceipt> {
    this.recordCall('waitForTransaction', [txHash]);

    if (this.shouldReject()) {
      throw this.getRejectError();
    }

    if (this.config.transactionDelay > 0) {
      await this.delay(this.config.transactionDelay);
    }

    const receipt: TransactionReceipt = {
      transactionHash: txHash,
      blockNumber: BigInt(12345678),
      blockHash: this.generateBlockHash(),
      status: 'success',
      gasUsed: BigInt(21000),
      effectiveGasPrice: BigInt(1000000000),
    };

    this.updateCallResult('waitForTransaction', receipt);
    return receipt;
  }

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  /**
   * Generate a nonce for EIP-3009
   */
  generateNonce(): `0x${string}` {
    this.nonceCounter++;
    return `0x${this.nonceCounter.toString(16).padStart(64, '0')}` as `0x${string}`;
  }

  /**
   * Create a transfer authorization for testing
   */
  createTransferAuth(
    to: `0x${string}`,
    amount: bigint,
    validForSeconds: number = 3600
  ): TransferAuthorization {
    const now = BigInt(Math.floor(Date.now() / 1000));
    return {
      from: this.config.address,
      to,
      value: amount,
      validAfter: now - BigInt(60),
      validBefore: now + BigInt(validForSeconds),
      nonce: this.generateNonce(),
    };
  }

  // --------------------------------------------------------------------------
  // Private Methods
  // --------------------------------------------------------------------------

  private assertConnected(): void {
    if (this.state.status !== 'connected' || !this.state.account) {
      throw createWalletError('USER_REJECTED', 'Wallet not connected');
    }
  }

  private shouldReject(): boolean {
    if (this.nextShouldReject) {
      this.nextShouldReject = false;
      return true;
    }
    return false;
  }

  private getRejectError(): WalletError {
    const error = this.nextRejectError ?? userRejectedError();
    this.nextRejectError = null;
    this.updateCallError(this.calls[this.calls.length - 1]?.method ?? 'unknown', error);
    return error;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private recordCall(method: string, params: unknown[]): void {
    this.calls.push({
      method,
      params,
      timestamp: Date.now(),
    });
  }

  private updateCallResult(method: string, result: unknown): void {
    const lastCall = [...this.calls].reverse().find((c) => c.method === method);
    if (lastCall) {
      lastCall.result = result;
    }
  }

  private updateCallError(method: string, error: WalletError): void {
    const lastCall = [...this.calls].reverse().find((c) => c.method === method);
    if (lastCall) {
      lastCall.error = error;
    }
  }

  private generateSignature(message: string): `0x${string}` {
    // Generate a deterministic mock signature based on message
    const hash = this.simpleHash(message);
    return `0x${hash.padEnd(130, '0')}` as `0x${string}`;
  }

  private generateTypedDataSignature(data: TypedData): `0x${string}` {
    // Generate a deterministic mock signature based on typed data
    const hash = this.simpleHash(JSON.stringify(data));
    return `0x${hash.padEnd(130, '0')}` as `0x${string}`;
  }

  private generateTxHash(): `0x${string}` {
    const random = Math.random().toString(16).substring(2);
    const timestamp = Date.now().toString(16);
    return `0x${(timestamp + random).padEnd(64, '0')}` as `0x${string}`;
  }

  private generateBlockHash(): `0x${string}` {
    const random = Math.random().toString(16).substring(2);
    return `0x${random.padEnd(64, '0')}` as `0x${string}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a mock connected wallet for testing
 *
 * @example
 * ```typescript
 * const { wallet, account } = await mockConnectedWallet();
 * expect(wallet.getState().status).toBe('connected');
 * ```
 */
export async function mockConnectedWallet(
  config: MockWalletConfig = {}
): Promise<{
  wallet: MockWallet;
  account: WalletAccount;
}> {
  const wallet = new MockWallet(config);
  const account = await wallet.connect();
  return { wallet, account };
}

/**
 * Create a mock disconnected wallet for testing
 *
 * @example
 * ```typescript
 * const wallet = mockDisconnectedWallet();
 * expect(wallet.getState().status).toBe('disconnected');
 * ```
 */
export function mockDisconnectedWallet(
  config: MockWalletConfig = {}
): MockWallet {
  return new MockWallet(config);
}

/**
 * Create a mock wallet that will error on connection
 *
 * @example
 * ```typescript
 * const wallet = mockWalletError('USER_REJECTED');
 * await expect(wallet.connect()).rejects.toThrow('User rejected');
 * ```
 */
export function mockWalletError(
  errorCode: WalletErrorCode = 'USER_REJECTED',
  config: MockWalletConfig = {}
): MockWallet {
  const wallet = new MockWallet(config);
  const errorMessages: Record<WalletErrorCode, string> = {
    USER_REJECTED: 'User rejected the request',
    CHAIN_NOT_SUPPORTED: 'Chain not supported',
    ALREADY_PROCESSING: 'Already processing a request',
    INSUFFICIENT_FUNDS: 'Insufficient funds',
    NONCE_TOO_LOW: 'Nonce too low',
    GAS_LIMIT_EXCEEDED: 'Gas limit exceeded',
    EXECUTION_REVERTED: 'Transaction execution reverted',
    UNKNOWN: 'Unknown error occurred',
  };
  wallet.setNextRequestToReject(
    createWalletError(errorCode, errorMessages[errorCode])
  );
  return wallet;
}

/**
 * Create a mock sign message function for use with vi.fn()
 *
 * @example
 * ```typescript
 * const signMessage = mockSignMessage();
 * const signature = await signMessage('Hello');
 * expect(signature).toMatch(/^0x/);
 * ```
 */
export function mockSignMessage(
  options: {
    shouldReject?: boolean;
    rejectError?: WalletError;
    customSignature?: string;
    delay?: number;
  } = {}
): Mock<[string], Promise<`0x${string}`>> {
  const {
    shouldReject = false,
    rejectError = userRejectedError(),
    customSignature,
    delay = 0,
  } = options;

  return vi.fn(async (message: string): Promise<`0x${string}`> => {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    if (shouldReject) {
      throw rejectError;
    }

    if (customSignature) {
      return customSignature as `0x${string}`;
    }

    // Generate deterministic signature from message
    const hash = Array.from(message)
      .reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) & 0xffffffff, 0)
      .toString(16);
    return `0x${Math.abs(parseInt(hash, 16) || 0).toString(16).padEnd(130, '0')}` as `0x${string}`;
  });
}

/**
 * Create a mock sign typed data function
 */
export function mockSignTypedData(
  options: {
    shouldReject?: boolean;
    rejectError?: WalletError;
    customSignature?: string;
    delay?: number;
  } = {}
): Mock<[TypedData], Promise<`0x${string}`>> {
  const {
    shouldReject = false,
    rejectError = userRejectedError(),
    customSignature,
    delay = 0,
  } = options;

  return vi.fn(async (data: TypedData): Promise<`0x${string}`> => {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    if (shouldReject) {
      throw rejectError;
    }

    if (customSignature) {
      return customSignature as `0x${string}`;
    }

    // Generate deterministic signature from typed data
    const hash = JSON.stringify(data).length.toString(16);
    return `0x${hash.padEnd(130, '0')}` as `0x${string}`;
  });
}

// ============================================================================
// Test Assertion Helpers
// ============================================================================

/**
 * Assert that a wallet connection was attempted
 */
export function assertConnectionAttempted(wallet: MockWallet): void {
  const connectCalls = wallet.getCallsByMethod('connect');
  if (connectCalls.length === 0) {
    throw new Error('Expected wallet connection to be attempted');
  }
}

/**
 * Assert that a message was signed
 */
export function assertMessageSigned(
  wallet: MockWallet,
  expectedMessage?: string
): void {
  const signCalls = wallet.getCallsByMethod('signMessage');
  if (signCalls.length === 0) {
    throw new Error('Expected message signing to be attempted');
  }
  if (expectedMessage !== undefined) {
    const lastCall = signCalls[signCalls.length - 1];
    if (lastCall.params[0] !== expectedMessage) {
      throw new Error(
        `Expected message "${expectedMessage}" but got "${lastCall.params[0]}"`
      );
    }
  }
}

/**
 * Assert that typed data was signed
 */
export function assertTypedDataSigned(wallet: MockWallet): void {
  const signCalls = wallet.getCallsByMethod('signTypedData');
  if (signCalls.length === 0) {
    throw new Error('Expected typed data signing to be attempted');
  }
}

/**
 * Assert that a transaction was sent
 */
export function assertTransactionSent(
  wallet: MockWallet,
  expectedTo?: `0x${string}`
): void {
  const txCalls = wallet.getCallsByMethod('sendTransaction');
  if (txCalls.length === 0) {
    throw new Error('Expected transaction to be sent');
  }
  if (expectedTo !== undefined) {
    const lastCall = txCalls[txCalls.length - 1];
    const tx = lastCall.params[0] as TransactionRequest;
    if (tx.to !== expectedTo) {
      throw new Error(`Expected transaction to "${expectedTo}" but got "${tx.to}"`);
    }
  }
}

// ============================================================================
// React Integration - MockWalletProvider
// ============================================================================

// Note: The React provider (MockWalletProvider) is defined in component-utils.tsx
// This file provides the underlying wallet simulation logic that can be used
// independently or integrated with the React provider.
