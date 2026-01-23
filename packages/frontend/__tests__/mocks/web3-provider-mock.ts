/**
 * Web3 Provider Mock Utilities
 *
 * Mock implementations for Web3 provider interactions (window.ethereum).
 * Simulates MetaMask-like provider behavior for testing.
 */

import { vi, type Mock } from 'vitest';
import { CHAIN_IDS, type ChainId } from './wallet-mock';

// ============================================================================
// Types
// ============================================================================

/**
 * EIP-1193 Provider request arguments
 */
export interface RequestArguments {
  method: string;
  params?: unknown[] | Record<string, unknown>;
}

/**
 * EIP-1193 Provider interface
 */
export interface EIP1193Provider {
  request: (args: RequestArguments) => Promise<unknown>;
  on: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener: (event: string, listener: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
  isConnected?: () => boolean;
}

/**
 * Chain configuration for switching
 */
export interface ChainConfig {
  chainId: string; // Hex string like '0x152' for 338
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
}

/**
 * RPC Error codes (EIP-1193 and EIP-1474)
 */
export const RPC_ERROR_CODES = {
  USER_REJECTED: 4001,
  UNAUTHORIZED: 4100,
  UNSUPPORTED_METHOD: 4200,
  DISCONNECTED: 4900,
  CHAIN_DISCONNECTED: 4901,
  CHAIN_NOT_ADDED: 4902,
  // Standard JSON-RPC errors
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  RESOURCE_NOT_FOUND: -32001,
  RESOURCE_UNAVAILABLE: -32002,
  TRANSACTION_REJECTED: -32003,
  METHOD_NOT_SUPPORTED: -32004,
} as const;

/**
 * RPC Error structure
 */
export interface RpcError extends Error {
  code: number;
  data?: unknown;
}

/**
 * Provider event types
 */
export type ProviderEventType =
  | 'connect'
  | 'disconnect'
  | 'chainChanged'
  | 'accountsChanged'
  | 'message';

/**
 * Event listener function
 */
export type EventListener = (...args: unknown[]) => void;

/**
 * Provider configuration
 */
export interface MockProviderConfig {
  /** Initial chain ID */
  chainId?: ChainId;
  /** Initial connected accounts */
  accounts?: `0x${string}`[];
  /** Whether to auto-approve requests */
  autoApprove?: boolean;
  /** Simulate as MetaMask */
  isMetaMask?: boolean;
  /** Default block number */
  blockNumber?: number;
  /** Default gas price (in wei) */
  gasPrice?: string;
}

/**
 * Provider state
 */
export interface MockProviderState {
  chainId: string;
  accounts: `0x${string}`[];
  isConnected: boolean;
  blockNumber: number;
  gasPrice: string;
}

/**
 * Request handler function
 */
export type RequestHandler = (
  method: string,
  params: unknown[] | Record<string, unknown> | undefined
) => Promise<unknown>;

/**
 * Call record for tracking
 */
export interface ProviderCallRecord {
  method: string;
  params: unknown[] | Record<string, unknown> | undefined;
  timestamp: number;
  result?: unknown;
  error?: RpcError;
}

// ============================================================================
// Error Factories
// ============================================================================

/**
 * Create an RPC error
 */
export function createRpcError(code: number, message: string, data?: unknown): RpcError {
  const error = new Error(message) as RpcError;
  error.code = code;
  error.name = 'RpcError';
  if (data !== undefined) error.data = data;
  return error;
}

/**
 * User rejected error (code 4001)
 */
export function userRejectedRpcError(message = 'User rejected the request'): RpcError {
  return createRpcError(RPC_ERROR_CODES.USER_REJECTED, message);
}

/**
 * Chain not added error (code 4902)
 */
export function chainNotAddedError(chainId: string): RpcError {
  return createRpcError(
    RPC_ERROR_CODES.CHAIN_NOT_ADDED,
    `Chain ${chainId} has not been added to the wallet`,
    { chainId }
  );
}

/**
 * Unsupported method error (code 4200)
 */
export function unsupportedMethodError(method: string): RpcError {
  return createRpcError(
    RPC_ERROR_CODES.UNSUPPORTED_METHOD,
    `Method ${method} is not supported`,
    { method }
  );
}

// ============================================================================
// Chain Configurations
// ============================================================================

/**
 * Pre-defined chain configurations
 */
export const CHAIN_CONFIGS: Record<ChainId, ChainConfig> = {
  [CHAIN_IDS.CRONOS_TESTNET]: {
    chainId: '0x152', // 338
    chainName: 'Cronos Testnet',
    nativeCurrency: {
      name: 'Test CRO',
      symbol: 'TCRO',
      decimals: 18,
    },
    rpcUrls: ['https://evm-t3.cronos.org/'],
    blockExplorerUrls: ['https://explorer.cronos.org/testnet'],
  },
  [CHAIN_IDS.CRONOS_MAINNET]: {
    chainId: '0x19', // 25
    chainName: 'Cronos Mainnet',
    nativeCurrency: {
      name: 'Cronos',
      symbol: 'CRO',
      decimals: 18,
    },
    rpcUrls: ['https://evm.cronos.org'],
    blockExplorerUrls: ['https://cronoscan.com'],
  },
  [CHAIN_IDS.ETHEREUM_MAINNET]: {
    chainId: '0x1', // 1
    chainName: 'Ethereum Mainnet',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://eth.llamarpc.com'],
    blockExplorerUrls: ['https://etherscan.io'],
  },
  [CHAIN_IDS.ETHEREUM_GOERLI]: {
    chainId: '0x5', // 5
    chainName: 'Goerli',
    nativeCurrency: {
      name: 'Goerli Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://rpc.ankr.com/eth_goerli'],
    blockExplorerUrls: ['https://goerli.etherscan.io'],
  },
  [CHAIN_IDS.SEPOLIA]: {
    chainId: '0xaa36a7', // 11155111
    chainName: 'Sepolia',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://rpc.sepolia.org'],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
  },
};

/**
 * Convert decimal chain ID to hex string
 */
export function chainIdToHex(chainId: number): string {
  return `0x${chainId.toString(16)}`;
}

/**
 * Convert hex chain ID to decimal
 */
export function hexToChainId(hex: string): number {
  return parseInt(hex, 16);
}

// ============================================================================
// Mock Ethereum Provider
// ============================================================================

/**
 * Mock Ethereum provider simulating MetaMask-like behavior.
 * Implements EIP-1193 provider interface.
 *
 * @example
 * ```typescript
 * const provider = new MockEthereumProvider({
 *   chainId: CHAIN_IDS.CRONOS_TESTNET,
 *   accounts: ['0x1234...'],
 * });
 *
 * // Use in tests
 * window.ethereum = provider;
 *
 * // Make requests
 * const accounts = await provider.request({ method: 'eth_requestAccounts' });
 * expect(accounts).toEqual(['0x1234...']);
 *
 * // Configure to reject
 * provider.setNextRequestToReject();
 * await expect(provider.request({ method: 'eth_requestAccounts' }))
 *   .rejects.toThrow('User rejected');
 * ```
 */
export class MockEthereumProvider implements EIP1193Provider {
  private state: MockProviderState;
  private config: Required<MockProviderConfig>;
  private listeners: Map<ProviderEventType, Set<EventListener>> = new Map();
  private calls: ProviderCallRecord[] = [];
  private customHandlers: Map<string, RequestHandler> = new Map();
  private nextShouldReject = false;
  private nextRejectError: RpcError | null = null;
  private balances: Map<string, string> = new Map();
  private supportedChains: Set<number> = new Set();

  isMetaMask: boolean;

  constructor(config: MockProviderConfig = {}) {
    this.config = {
      chainId: config.chainId ?? CHAIN_IDS.CRONOS_TESTNET,
      accounts: config.accounts ?? [],
      autoApprove: config.autoApprove ?? true,
      isMetaMask: config.isMetaMask ?? true,
      blockNumber: config.blockNumber ?? 12345678,
      gasPrice: config.gasPrice ?? '20000000000', // 20 gwei
    };

    this.isMetaMask = this.config.isMetaMask;

    this.state = {
      chainId: chainIdToHex(this.config.chainId),
      accounts: [...this.config.accounts],
      isConnected: this.config.accounts.length > 0,
      blockNumber: this.config.blockNumber,
      gasPrice: this.config.gasPrice,
    };

    // Initialize supported chains
    Object.keys(CHAIN_CONFIGS).forEach((chainId) => {
      this.supportedChains.add(parseInt(chainId));
    });

    // Initialize event listener maps
    const eventTypes: ProviderEventType[] = [
      'connect',
      'disconnect',
      'chainChanged',
      'accountsChanged',
      'message',
    ];
    eventTypes.forEach((event) => {
      this.listeners.set(event, new Set());
    });
  }

  // --------------------------------------------------------------------------
  // EIP-1193 Methods
  // --------------------------------------------------------------------------

  /**
   * Make an RPC request
   */
  async request(args: RequestArguments): Promise<unknown> {
    const { method, params } = args;

    this.recordCall(method, params);

    // Check for rejection
    if (this.shouldReject()) {
      const error = this.getRejectError();
      this.updateCallError(method, error);
      throw error;
    }

    // Check for custom handler
    const customHandler = this.customHandlers.get(method);
    if (customHandler) {
      try {
        const result = await customHandler(method, params);
        this.updateCallResult(method, result);
        return result;
      } catch (error) {
        if ((error as RpcError).code !== undefined) {
          this.updateCallError(method, error as RpcError);
        }
        throw error;
      }
    }

    // Handle standard methods
    const result = await this.handleStandardMethod(method, params);
    this.updateCallResult(method, result);
    return result;
  }

  /**
   * Register an event listener
   */
  on(event: string, listener: EventListener): void {
    const eventListeners = this.listeners.get(event as ProviderEventType);
    if (eventListeners) {
      eventListeners.add(listener);
    }
  }

  /**
   * Remove an event listener
   */
  removeListener(event: string, listener: EventListener): void {
    const eventListeners = this.listeners.get(event as ProviderEventType);
    if (eventListeners) {
      eventListeners.delete(listener);
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state.isConnected;
  }

  // --------------------------------------------------------------------------
  // State Management
  // --------------------------------------------------------------------------

  /**
   * Get current state
   */
  getState(): Readonly<MockProviderState> {
    return { ...this.state };
  }

  /**
   * Get call history
   */
  getCalls(): Readonly<ProviderCallRecord[]> {
    return [...this.calls];
  }

  /**
   * Get calls by method
   */
  getCallsByMethod(method: string): ProviderCallRecord[] {
    return this.calls.filter((call) => call.method === method);
  }

  /**
   * Clear call history
   */
  clearCalls(): void {
    this.calls = [];
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.state = {
      chainId: chainIdToHex(this.config.chainId),
      accounts: [...this.config.accounts],
      isConnected: this.config.accounts.length > 0,
      blockNumber: this.config.blockNumber,
      gasPrice: this.config.gasPrice,
    };
    this.calls = [];
    this.nextShouldReject = false;
    this.nextRejectError = null;
    this.balances.clear();
    this.customHandlers.clear();
  }

  // --------------------------------------------------------------------------
  // Test Configuration
  // --------------------------------------------------------------------------

  /**
   * Configure next request to reject
   */
  setNextRequestToReject(error?: RpcError): void {
    this.nextShouldReject = true;
    this.nextRejectError = error ?? userRejectedRpcError();
  }

  /**
   * Set account balance
   */
  setBalance(address: `0x${string}`, balance: string): void {
    this.balances.set(address.toLowerCase(), balance);
  }

  /**
   * Add accounts
   */
  setAccounts(accounts: `0x${string}`[]): void {
    this.state.accounts = [...accounts];
    this.state.isConnected = accounts.length > 0;
    this.emit('accountsChanged', accounts);
  }

  /**
   * Set chain ID
   */
  setChainId(chainId: ChainId): void {
    this.state.chainId = chainIdToHex(chainId);
    this.emit('chainChanged', this.state.chainId);
  }

  /**
   * Set block number
   */
  setBlockNumber(blockNumber: number): void {
    this.state.blockNumber = blockNumber;
  }

  /**
   * Set gas price
   */
  setGasPrice(gasPrice: string): void {
    this.state.gasPrice = gasPrice;
  }

  /**
   * Add a supported chain
   */
  addSupportedChain(chainId: number): void {
    this.supportedChains.add(chainId);
  }

  /**
   * Remove a supported chain
   */
  removeSupportedChain(chainId: number): void {
    this.supportedChains.delete(chainId);
  }

  /**
   * Register a custom request handler
   */
  setCustomHandler(method: string, handler: RequestHandler): void {
    this.customHandlers.set(method, handler);
  }

  /**
   * Remove a custom request handler
   */
  removeCustomHandler(method: string): void {
    this.customHandlers.delete(method);
  }

  // --------------------------------------------------------------------------
  // Event Emission
  // --------------------------------------------------------------------------

  /**
   * Emit an event to all listeners
   */
  emit(event: ProviderEventType, ...args: unknown[]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((listener) => {
        try {
          listener(...args);
        } catch (e) {
          console.error(`Error in ${event} listener:`, e);
        }
      });
    }
  }

  /**
   * Simulate connect event
   */
  emitConnect(): void {
    this.state.isConnected = true;
    this.emit('connect', { chainId: this.state.chainId });
  }

  /**
   * Simulate disconnect event
   */
  emitDisconnect(error?: RpcError): void {
    this.state.isConnected = false;
    this.emit('disconnect', error ?? createRpcError(RPC_ERROR_CODES.DISCONNECTED, 'Disconnected'));
  }

  /**
   * Simulate chain change
   */
  emitChainChanged(chainId: ChainId): void {
    this.setChainId(chainId);
  }

  /**
   * Simulate accounts change
   */
  emitAccountsChanged(accounts: `0x${string}`[]): void {
    this.setAccounts(accounts);
  }

  // --------------------------------------------------------------------------
  // Private Methods
  // --------------------------------------------------------------------------

  private async handleStandardMethod(
    method: string,
    params: unknown[] | Record<string, unknown> | undefined
  ): Promise<unknown> {
    switch (method) {
      // Connection methods
      case 'eth_requestAccounts':
        return this.handleRequestAccounts();

      case 'eth_accounts':
        return this.state.accounts;

      case 'eth_chainId':
        return this.state.chainId;

      // Network methods
      case 'net_version':
        return hexToChainId(this.state.chainId).toString();

      case 'eth_blockNumber':
        return `0x${this.state.blockNumber.toString(16)}`;

      case 'eth_gasPrice':
        return `0x${BigInt(this.state.gasPrice).toString(16)}`;

      // Balance methods
      case 'eth_getBalance':
        return this.handleGetBalance(params as unknown[]);

      // Transaction methods
      case 'eth_sendTransaction':
        return this.handleSendTransaction(params as unknown[]);

      case 'eth_getTransactionReceipt':
        return this.handleGetTransactionReceipt(params as unknown[]);

      case 'eth_getTransactionCount':
        return '0x0';

      case 'eth_estimateGas':
        return '0x5208'; // 21000 gas

      // Signing methods
      case 'personal_sign':
        return this.handlePersonalSign(params as unknown[]);

      case 'eth_sign':
        return this.handleEthSign(params as unknown[]);

      case 'eth_signTypedData_v4':
        return this.handleSignTypedDataV4(params as unknown[]);

      // Chain switching
      case 'wallet_switchEthereumChain':
        return this.handleSwitchChain(params as unknown[]);

      case 'wallet_addEthereumChain':
        return this.handleAddChain(params as unknown[]);

      // Other methods
      case 'eth_call':
        return '0x';

      case 'eth_getCode':
        return '0x';

      default:
        throw unsupportedMethodError(method);
    }
  }

  private handleRequestAccounts(): `0x${string}`[] {
    if (this.state.accounts.length === 0) {
      // Simulate account connection
      this.state.accounts = [this.config.accounts[0] ?? '0x1234567890abcdef1234567890abcdef12345678'];
      this.state.isConnected = true;
      this.emit('accountsChanged', this.state.accounts);
    }
    return this.state.accounts;
  }

  private handleGetBalance(params: unknown[]): string {
    const address = (params[0] as string).toLowerCase();
    const balance = this.balances.get(address) ?? '0x0';
    return `0x${BigInt(balance).toString(16)}`;
  }

  private handleSendTransaction(params: unknown[]): string {
    // Return a mock transaction hash
    const txHash = `0x${Date.now().toString(16).padStart(64, '0')}`;
    return txHash;
  }

  private handleGetTransactionReceipt(params: unknown[]): Record<string, unknown> | null {
    const txHash = params[0] as string;
    return {
      transactionHash: txHash,
      blockNumber: `0x${this.state.blockNumber.toString(16)}`,
      blockHash: `0x${'a'.repeat(64)}`,
      status: '0x1', // Success
      gasUsed: '0x5208',
      cumulativeGasUsed: '0x5208',
      logs: [],
    };
  }

  private handlePersonalSign(params: unknown[]): string {
    // personal_sign params: [message, address]
    const message = params[0] as string;
    const hash = this.simpleHash(message);
    return `0x${hash.padEnd(130, '0')}`;
  }

  private handleEthSign(params: unknown[]): string {
    // eth_sign params: [address, message]
    const message = params[1] as string;
    const hash = this.simpleHash(message);
    return `0x${hash.padEnd(130, '0')}`;
  }

  private handleSignTypedDataV4(params: unknown[]): string {
    // eth_signTypedData_v4 params: [address, typedData]
    const typedData = params[1] as string;
    const hash = this.simpleHash(typedData);
    return `0x${hash.padEnd(130, '0')}`;
  }

  private async handleSwitchChain(params: unknown[]): Promise<null> {
    const chainIdHex = (params[0] as { chainId: string }).chainId;
    const chainId = hexToChainId(chainIdHex);

    if (!this.supportedChains.has(chainId)) {
      throw chainNotAddedError(chainIdHex);
    }

    this.state.chainId = chainIdHex;
    this.emit('chainChanged', chainIdHex);
    return null;
  }

  private async handleAddChain(params: unknown[]): Promise<null> {
    const chainConfig = params[0] as ChainConfig;
    const chainId = hexToChainId(chainConfig.chainId);
    this.supportedChains.add(chainId);
    return null;
  }

  private shouldReject(): boolean {
    if (this.nextShouldReject) {
      this.nextShouldReject = false;
      return true;
    }
    return false;
  }

  private getRejectError(): RpcError {
    const error = this.nextRejectError ?? userRejectedRpcError();
    this.nextRejectError = null;
    return error;
  }

  private recordCall(method: string, params: unknown[] | Record<string, unknown> | undefined): void {
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

  private updateCallError(method: string, error: RpcError): void {
    const lastCall = [...this.calls].reverse().find((c) => c.method === method);
    if (lastCall) {
      lastCall.error = error;
    }
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
 * Create a connected mock provider
 */
export function createConnectedProvider(
  config: MockProviderConfig = {}
): MockEthereumProvider {
  const defaultAccount: `0x${string}` = '0x1234567890abcdef1234567890abcdef12345678';
  return new MockEthereumProvider({
    ...config,
    accounts: config.accounts ?? [defaultAccount],
  });
}

/**
 * Create a disconnected mock provider
 */
export function createDisconnectedProvider(
  config: MockProviderConfig = {}
): MockEthereumProvider {
  return new MockEthereumProvider({
    ...config,
    accounts: [],
  });
}

/**
 * Create a provider that rejects requests
 */
export function createRejectingProvider(
  errorCode: keyof typeof RPC_ERROR_CODES = 'USER_REJECTED',
  config: MockProviderConfig = {}
): MockEthereumProvider {
  const provider = new MockEthereumProvider(config);
  provider.setNextRequestToReject(
    createRpcError(RPC_ERROR_CODES[errorCode], `Error: ${errorCode}`)
  );
  return provider;
}

// ============================================================================
// Window Ethereum Utilities
// ============================================================================

/**
 * Install mock provider on window.ethereum
 */
export function installMockProvider(
  provider: MockEthereumProvider
): () => void {
  const originalEthereum = (globalThis as unknown as { ethereum?: unknown }).ethereum;
  (globalThis as unknown as { ethereum: MockEthereumProvider }).ethereum = provider;

  // Return cleanup function
  return () => {
    if (originalEthereum !== undefined) {
      (globalThis as unknown as { ethereum: unknown }).ethereum = originalEthereum;
    } else {
      delete (globalThis as unknown as { ethereum?: unknown }).ethereum;
    }
  };
}

/**
 * Create and install mock provider, returning cleanup function
 */
export function mockWindowEthereum(
  config: MockProviderConfig = {}
): {
  provider: MockEthereumProvider;
  cleanup: () => void;
} {
  const provider = new MockEthereumProvider(config);
  const cleanup = installMockProvider(provider);
  return { provider, cleanup };
}

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Assert that a specific RPC method was called
 */
export function assertMethodCalled(
  provider: MockEthereumProvider,
  method: string,
  expectedParams?: unknown[]
): void {
  const calls = provider.getCallsByMethod(method);
  if (calls.length === 0) {
    throw new Error(`Expected method "${method}" to be called`);
  }
  if (expectedParams !== undefined) {
    const lastCall = calls[calls.length - 1];
    if (JSON.stringify(lastCall.params) !== JSON.stringify(expectedParams)) {
      throw new Error(
        `Expected params ${JSON.stringify(expectedParams)} but got ${JSON.stringify(lastCall.params)}`
      );
    }
  }
}

/**
 * Assert that account request was made
 */
export function assertAccountsRequested(provider: MockEthereumProvider): void {
  assertMethodCalled(provider, 'eth_requestAccounts');
}

/**
 * Assert that chain was switched
 */
export function assertChainSwitched(
  provider: MockEthereumProvider,
  expectedChainId?: ChainId
): void {
  const calls = provider.getCallsByMethod('wallet_switchEthereumChain');
  if (calls.length === 0) {
    throw new Error('Expected chain switch to be requested');
  }
  if (expectedChainId !== undefined) {
    const lastCall = calls[calls.length - 1];
    const requestedChainId = (lastCall.params as unknown[])?.[0] as { chainId: string };
    if (requestedChainId.chainId !== chainIdToHex(expectedChainId)) {
      throw new Error(
        `Expected chain ${expectedChainId} but got ${requestedChainId.chainId}`
      );
    }
  }
}

/**
 * Assert that a message was signed
 */
export function assertSignatureRequested(provider: MockEthereumProvider): void {
  const personalSign = provider.getCallsByMethod('personal_sign');
  const ethSign = provider.getCallsByMethod('eth_sign');
  const typedData = provider.getCallsByMethod('eth_signTypedData_v4');

  if (personalSign.length === 0 && ethSign.length === 0 && typedData.length === 0) {
    throw new Error('Expected a signature request');
  }
}
