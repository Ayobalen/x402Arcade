/**
 * Blockchain Mock Utilities
 *
 * Mock implementations for Cronos blockchain interactions
 * for deterministic testing without real network calls.
 *
 * Compatible with viem's API for seamless integration.
 */

import { jest } from '@jest/globals';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Cronos chain configuration.
 */
export interface ChainConfig {
  id: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

/**
 * Transaction receipt structure.
 */
export interface TransactionReceipt {
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  blockHash: `0x${string}`;
  transactionIndex: number;
  from: `0x${string}`;
  to: `0x${string}` | null;
  gasUsed: bigint;
  effectiveGasPrice: bigint;
  status: 'success' | 'reverted';
  logs: TransactionLog[];
  contractAddress?: `0x${string}`;
}

/**
 * Transaction log structure.
 */
export interface TransactionLog {
  address: `0x${string}`;
  topics: `0x${string}`[];
  data: `0x${string}`;
  blockNumber: bigint;
  transactionHash: `0x${string}`;
  logIndex: number;
}

/**
 * Block structure.
 */
export interface Block {
  number: bigint;
  hash: `0x${string}`;
  timestamp: bigint;
  gasLimit: bigint;
  gasUsed: bigint;
  baseFeePerGas?: bigint;
  transactions: `0x${string}`[];
}

/**
 * Mock provider configuration.
 */
export interface MockProviderConfig {
  chainId?: number;
  blockNumber?: bigint;
  gasPrice?: bigint;
  baseFeePerGas?: bigint;
  latency?: number;
  failRate?: number; // Probability of random failures (0-1)
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Cronos Testnet configuration.
 */
export const CRONOS_TESTNET: ChainConfig = {
  id: 338,
  name: 'Cronos Testnet',
  rpcUrl: 'https://evm-t3.cronos.org/',
  explorerUrl: 'https://explorer.cronos.org/testnet',
  nativeCurrency: {
    name: 'Test CRO',
    symbol: 'TCRO',
    decimals: 18,
  },
};

/**
 * Cronos Mainnet configuration.
 */
export const CRONOS_MAINNET: ChainConfig = {
  id: 25,
  name: 'Cronos Mainnet',
  rpcUrl: 'https://evm.cronos.org/',
  explorerUrl: 'https://explorer.cronos.org',
  nativeCurrency: {
    name: 'CRO',
    symbol: 'CRO',
    decimals: 18,
  },
};

/**
 * devUSDC.e contract configuration for Cronos Testnet.
 */
export const DEV_USDC_CONFIG = {
  address: '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0' as `0x${string}`,
  name: 'Bridged USDC (Stargate)',
  symbol: 'devUSDC.e',
  decimals: 6,
  domainVersion: '1',
};

/**
 * Default gas values for mocking.
 */
export const DEFAULT_GAS_VALUES = {
  gasPrice: BigInt('5000000000'), // 5 gwei
  baseFeePerGas: BigInt('1000000000'), // 1 gwei
  gasLimit: BigInt('21000'),
  maxFeePerGas: BigInt('10000000000'), // 10 gwei
  maxPriorityFeePerGas: BigInt('2000000000'), // 2 gwei
};

// ============================================================================
// Utility Functions
// ============================================================================

let txCounter = 0;
let blockCounter = 1000000;

/**
 * Generate a random hex string of specified length.
 */
export function randomHex(bytes: number): `0x${string}` {
  const hex = Array.from({ length: bytes * 2 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  return `0x${hex}` as `0x${string}`;
}

/**
 * Generate a mock transaction hash.
 */
export function generateTxHash(): `0x${string}` {
  txCounter++;
  const counterHex = txCounter.toString(16).padStart(8, '0');
  const randomPart = randomHex(28).slice(2);
  return `0x${counterHex}${randomPart}` as `0x${string}`;
}

/**
 * Generate a mock block hash.
 */
export function generateBlockHash(): `0x${string}` {
  blockCounter++;
  const counterHex = blockCounter.toString(16).padStart(8, '0');
  const randomPart = randomHex(28).slice(2);
  return `0x${counterHex}${randomPart}` as `0x${string}`;
}

/**
 * Reset counters (for test isolation).
 */
export function resetBlockchainCounters(): void {
  txCounter = 0;
  blockCounter = 1000000;
}

/**
 * Convert address to checksum format.
 */
export function toChecksumAddress(address: string): `0x${string}` {
  // Simple lowercase normalization for mock purposes
  return address.toLowerCase() as `0x${string}`;
}

// ============================================================================
// MockWeb3Provider Class
// ============================================================================

/**
 * Mock Web3 Provider for testing blockchain interactions.
 *
 * @example
 * ```typescript
 * const provider = new MockWeb3Provider({
 *   chainId: 338,
 *   blockNumber: BigInt(1000000),
 * });
 *
 * // Mock specific responses
 * provider.mockGetBalance('0x...', BigInt('1000000000000000000'));
 *
 * // Use in tests
 * const balance = await provider.getBalance('0x...');
 * ```
 */
export class MockWeb3Provider {
  private config: MockProviderConfig;
  private currentBlockNumber: bigint;
  private balances: Map<string, bigint> = new Map();
  private transactions: Map<string, TransactionReceipt> = new Map();
  private pendingTransactions: Map<string, any> = new Map();
  private contractResponses: Map<string, any> = new Map();
  private nonces: Map<string, number> = new Map();
  private customResponses: Map<string, any> = new Map();
  private failNextCall: boolean = false;
  private failNextCallError: Error | null = null;

  constructor(config: MockProviderConfig = {}) {
    this.config = {
      chainId: CRONOS_TESTNET.id,
      blockNumber: BigInt(1000000),
      gasPrice: DEFAULT_GAS_VALUES.gasPrice,
      baseFeePerGas: DEFAULT_GAS_VALUES.baseFeePerGas,
      latency: 0,
      failRate: 0,
      ...config,
    };
    this.currentBlockNumber = this.config.blockNumber!;
  }

  // --------------------------------------------------------------------------
  // Configuration Methods
  // --------------------------------------------------------------------------

  /**
   * Get current chain ID.
   */
  getChainId(): number {
    return this.config.chainId!;
  }

  /**
   * Set the chain ID.
   */
  setChainId(chainId: number): void {
    this.config.chainId = chainId;
  }

  /**
   * Make the next call fail with an error.
   */
  setNextCallFailure(error?: Error): void {
    this.failNextCall = true;
    this.failNextCallError = error || new Error('Mock blockchain error');
  }

  /**
   * Reset provider state.
   */
  reset(): void {
    this.balances.clear();
    this.transactions.clear();
    this.pendingTransactions.clear();
    this.contractResponses.clear();
    this.nonces.clear();
    this.customResponses.clear();
    this.failNextCall = false;
    this.failNextCallError = null;
    this.currentBlockNumber = this.config.blockNumber!;
    resetBlockchainCounters();
  }

  // --------------------------------------------------------------------------
  // Mock Configuration Methods
  // --------------------------------------------------------------------------

  /**
   * Mock a balance for an address.
   */
  mockGetBalance(address: string, balance: bigint): void {
    this.balances.set(address.toLowerCase(), balance);
  }

  /**
   * Mock a transaction receipt.
   */
  mockTransactionReceipt(txHash: string, receipt: Partial<TransactionReceipt>): void {
    const fullReceipt: TransactionReceipt = {
      transactionHash: txHash as `0x${string}`,
      blockNumber: this.currentBlockNumber,
      blockHash: generateBlockHash(),
      transactionIndex: 0,
      from: receipt.from || ('0x0000000000000000000000000000000000000001' as `0x${string}`),
      to: receipt.to || ('0x0000000000000000000000000000000000000002' as `0x${string}`),
      gasUsed: BigInt(21000),
      effectiveGasPrice: this.config.gasPrice!,
      status: 'success',
      logs: [],
      ...receipt,
    };
    this.transactions.set(txHash.toLowerCase(), fullReceipt);
  }

  /**
   * Mock a contract call response.
   */
  mockContractCall(
    contractAddress: string,
    functionSelector: string,
    response: any
  ): void {
    const key = `${contractAddress.toLowerCase()}-${functionSelector}`;
    this.contractResponses.set(key, response);
  }

  /**
   * Set a custom response for a specific method.
   */
  setCustomResponse(method: string, response: any): void {
    this.customResponses.set(method, response);
  }

  // --------------------------------------------------------------------------
  // Provider Methods (viem-compatible)
  // --------------------------------------------------------------------------

  /**
   * Simulate network latency and potential failures.
   */
  private async simulateNetwork(): Promise<void> {
    // Check for forced failure
    if (this.failNextCall) {
      this.failNextCall = false;
      const error = this.failNextCallError || new Error('Mock blockchain error');
      this.failNextCallError = null;
      throw error;
    }

    // Random failure based on failRate
    if (this.config.failRate && Math.random() < this.config.failRate) {
      throw new Error('Random mock blockchain failure');
    }

    // Simulate latency
    if (this.config.latency) {
      await new Promise((resolve) => setTimeout(resolve, this.config.latency));
    }
  }

  /**
   * Get the balance of an address.
   */
  async getBalance(address: string): Promise<bigint> {
    await this.simulateNetwork();

    const balance = this.balances.get(address.toLowerCase());
    return balance !== undefined ? balance : BigInt(0);
  }

  /**
   * Get the current block number.
   */
  async getBlockNumber(): Promise<bigint> {
    await this.simulateNetwork();

    if (this.customResponses.has('getBlockNumber')) {
      return this.customResponses.get('getBlockNumber');
    }

    return this.currentBlockNumber;
  }

  /**
   * Get the current gas price.
   */
  async getGasPrice(): Promise<bigint> {
    await this.simulateNetwork();

    if (this.customResponses.has('getGasPrice')) {
      return this.customResponses.get('getGasPrice');
    }

    return this.config.gasPrice!;
  }

  /**
   * Estimate gas for a transaction.
   */
  async estimateGas(_transaction: any): Promise<bigint> {
    await this.simulateNetwork();

    if (this.customResponses.has('estimateGas')) {
      return this.customResponses.get('estimateGas');
    }

    return DEFAULT_GAS_VALUES.gasLimit;
  }

  /**
   * Get transaction receipt.
   */
  async getTransactionReceipt(txHash: string): Promise<TransactionReceipt | null> {
    await this.simulateNetwork();

    return this.transactions.get(txHash.toLowerCase()) || null;
  }

  /**
   * Get transaction nonce for an address.
   */
  async getTransactionCount(address: string): Promise<number> {
    await this.simulateNetwork();

    return this.nonces.get(address.toLowerCase()) || 0;
  }

  /**
   * Get a block by number or hash.
   */
  async getBlock(blockId?: bigint | 'latest' | 'pending'): Promise<Block> {
    await this.simulateNetwork();

    const blockNumber =
      blockId === 'latest' || blockId === undefined
        ? this.currentBlockNumber
        : blockId === 'pending'
        ? this.currentBlockNumber + BigInt(1)
        : blockId;

    return {
      number: blockNumber,
      hash: generateBlockHash(),
      timestamp: BigInt(Math.floor(Date.now() / 1000)),
      gasLimit: BigInt(30000000),
      gasUsed: BigInt(15000000),
      baseFeePerGas: this.config.baseFeePerGas,
      transactions: [],
    };
  }

  /**
   * Send a transaction (mock).
   */
  async sendTransaction(transaction: {
    to: `0x${string}`;
    from: `0x${string}`;
    value?: bigint;
    data?: `0x${string}`;
    gas?: bigint;
    gasPrice?: bigint;
  }): Promise<`0x${string}`> {
    await this.simulateNetwork();

    const txHash = generateTxHash();

    // Create receipt
    this.mockTransactionReceipt(txHash, {
      from: transaction.from,
      to: transaction.to,
      status: 'success',
    });

    // Increment nonce
    const fromAddress = transaction.from.toLowerCase();
    const currentNonce = this.nonces.get(fromAddress) || 0;
    this.nonces.set(fromAddress, currentNonce + 1);

    // Update balances if value transfer
    if (transaction.value) {
      const fromBalance = this.balances.get(fromAddress) || BigInt(0);
      const toBalance = this.balances.get(transaction.to.toLowerCase()) || BigInt(0);

      if (fromBalance >= transaction.value) {
        this.balances.set(fromAddress, fromBalance - transaction.value);
        this.balances.set(transaction.to.toLowerCase(), toBalance + transaction.value);
      }
    }

    return txHash;
  }

  /**
   * Call a contract (read-only).
   */
  async call(params: {
    to: `0x${string}`;
    data?: `0x${string}`;
  }): Promise<`0x${string}`> {
    await this.simulateNetwork();

    const functionSelector = params.data?.slice(0, 10) || '0x';
    const key = `${params.to.toLowerCase()}-${functionSelector}`;

    if (this.contractResponses.has(key)) {
      return this.contractResponses.get(key);
    }

    // Return empty data by default
    return '0x' as `0x${string}`;
  }

  /**
   * Wait for transaction confirmation.
   */
  async waitForTransactionReceipt(
    txHash: string,
    options?: { confirmations?: number; timeout?: number }
  ): Promise<TransactionReceipt> {
    await this.simulateNetwork();

    const receipt = this.transactions.get(txHash.toLowerCase());

    if (!receipt) {
      // Create a default success receipt
      this.mockTransactionReceipt(txHash, { status: 'success' });
      return this.transactions.get(txHash.toLowerCase())!;
    }

    return receipt;
  }

  // --------------------------------------------------------------------------
  // Block Management
  // --------------------------------------------------------------------------

  /**
   * Mine a new block (increment block number).
   */
  mineBlock(): bigint {
    this.currentBlockNumber += BigInt(1);
    return this.currentBlockNumber;
  }

  /**
   * Mine multiple blocks.
   */
  mineBlocks(count: number): bigint {
    for (let i = 0; i < count; i++) {
      this.mineBlock();
    }
    return this.currentBlockNumber;
  }

  /**
   * Set the current block number.
   */
  setBlockNumber(blockNumber: bigint): void {
    this.currentBlockNumber = blockNumber;
  }

  /**
   * Get current block number (sync).
   */
  getCurrentBlockNumber(): bigint {
    return this.currentBlockNumber;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a mock transaction receipt.
 */
export function mockTransactionReceipt(
  overrides: Partial<TransactionReceipt> = {}
): TransactionReceipt {
  return {
    transactionHash: generateTxHash(),
    blockNumber: BigInt(1000000),
    blockHash: generateBlockHash(),
    transactionIndex: 0,
    from: '0x0000000000000000000000000000000000000001' as `0x${string}`,
    to: '0x0000000000000000000000000000000000000002' as `0x${string}`,
    gasUsed: BigInt(21000),
    effectiveGasPrice: DEFAULT_GAS_VALUES.gasPrice,
    status: 'success',
    logs: [],
    ...overrides,
  };
}

/**
 * Create a mock block.
 */
export function mockBlock(overrides: Partial<Block> = {}): Block {
  return {
    number: BigInt(1000000),
    hash: generateBlockHash(),
    timestamp: BigInt(Math.floor(Date.now() / 1000)),
    gasLimit: BigInt(30000000),
    gasUsed: BigInt(15000000),
    baseFeePerGas: DEFAULT_GAS_VALUES.baseFeePerGas,
    transactions: [],
    ...overrides,
  };
}

/**
 * Create a mock transaction log.
 */
export function mockTransactionLog(overrides: Partial<TransactionLog> = {}): TransactionLog {
  return {
    address: DEV_USDC_CONFIG.address,
    topics: [randomHex(32)],
    data: '0x' as `0x${string}`,
    blockNumber: BigInt(1000000),
    transactionHash: generateTxHash(),
    logIndex: 0,
    ...overrides,
  };
}

/**
 * Create a failed transaction receipt.
 */
export function mockFailedTransactionReceipt(
  overrides: Partial<TransactionReceipt> = {}
): TransactionReceipt {
  return mockTransactionReceipt({
    status: 'reverted',
    ...overrides,
  });
}

/**
 * Create a mock USDC Transfer event log.
 */
export function mockUSDCTransferLog(
  from: `0x${string}`,
  to: `0x${string}`,
  amount: bigint
): TransactionLog {
  // Transfer event topic: keccak256("Transfer(address,address,uint256)")
  const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' as `0x${string}`;

  // Pad addresses to 32 bytes
  const fromTopic = `0x000000000000000000000000${from.slice(2)}` as `0x${string}`;
  const toTopic = `0x000000000000000000000000${to.slice(2)}` as `0x${string}`;

  // Amount as 32-byte hex
  const amountHex = amount.toString(16).padStart(64, '0');

  return mockTransactionLog({
    address: DEV_USDC_CONFIG.address,
    topics: [transferTopic, fromTopic, toTopic],
    data: `0x${amountHex}` as `0x${string}`,
  });
}

/**
 * Mock gas price estimation.
 */
export function mockGasPrice(gwei: number): bigint {
  return BigInt(gwei) * BigInt(1000000000);
}

/**
 * Mock block number.
 */
export function mockBlockNumber(blockNumber: number): bigint {
  return BigInt(blockNumber);
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a pre-configured mock provider for common scenarios.
 */
export function createTestProvider(
  scenario: 'success' | 'slow' | 'unreliable' = 'success'
): MockWeb3Provider {
  switch (scenario) {
    case 'success':
      return new MockWeb3Provider();
    case 'slow':
      return new MockWeb3Provider({ latency: 200 });
    case 'unreliable':
      return new MockWeb3Provider({ failRate: 0.3 });
    default:
      return new MockWeb3Provider();
  }
}

/**
 * Create a mock viem public client.
 */
export function createMockPublicClient() {
  const provider = new MockWeb3Provider();

  return {
    provider,
    getBalance: jest.fn((params: { address: `0x${string}` }) =>
      provider.getBalance(params.address)
    ),
    getBlockNumber: jest.fn(() => provider.getBlockNumber()),
    getGasPrice: jest.fn(() => provider.getGasPrice()),
    estimateGas: jest.fn((params: any) => provider.estimateGas(params)),
    getTransactionReceipt: jest.fn((params: { hash: `0x${string}` }) =>
      provider.getTransactionReceipt(params.hash)
    ),
    getTransactionCount: jest.fn((params: { address: `0x${string}` }) =>
      provider.getTransactionCount(params.address)
    ),
    getBlock: jest.fn((params?: { blockNumber?: bigint }) =>
      provider.getBlock(params?.blockNumber)
    ),
    call: jest.fn((params: { to: `0x${string}`; data?: `0x${string}` }) =>
      provider.call(params)
    ),
    waitForTransactionReceipt: jest.fn((params: { hash: `0x${string}` }) =>
      provider.waitForTransactionReceipt(params.hash)
    ),
  };
}

/**
 * Create a mock viem wallet client.
 */
export function createMockWalletClient(address: `0x${string}` = '0x0000000000000000000000000000000000000001') {
  const provider = new MockWeb3Provider();

  return {
    provider,
    account: { address },
    sendTransaction: jest.fn((params: any) =>
      provider.sendTransaction({ ...params, from: address })
    ),
    signMessage: jest.fn(async (params: { message: string }) =>
      randomHex(65) as `0x${string}`
    ),
    signTypedData: jest.fn(async () => randomHex(65) as `0x${string}`),
  };
}

/**
 * Create mock USDC contract read/write functions.
 */
export function createMockUSDCContract(provider: MockWeb3Provider) {
  const balances: Map<string, bigint> = new Map();
  const allowances: Map<string, Map<string, bigint>> = new Map();

  return {
    read: {
      balanceOf: jest.fn(async (args: [`0x${string}`]) => {
        const [address] = args;
        return balances.get(address.toLowerCase()) || BigInt(0);
      }),
      allowance: jest.fn(async (args: [`0x${string}`, `0x${string}`]) => {
        const [owner, spender] = args;
        const ownerAllowances = allowances.get(owner.toLowerCase());
        return ownerAllowances?.get(spender.toLowerCase()) || BigInt(0);
      }),
      decimals: jest.fn(async () => DEV_USDC_CONFIG.decimals),
      symbol: jest.fn(async () => DEV_USDC_CONFIG.symbol),
      name: jest.fn(async () => DEV_USDC_CONFIG.name),
    },
    write: {
      transfer: jest.fn(async (args: [`0x${string}`, bigint]) => {
        return provider.sendTransaction({
          from: '0x0000000000000000000000000000000000000001' as `0x${string}`,
          to: DEV_USDC_CONFIG.address,
          data: '0xa9059cbb' as `0x${string}`,
        });
      }),
      approve: jest.fn(async (args: [`0x${string}`, bigint]) => {
        return provider.sendTransaction({
          from: '0x0000000000000000000000000000000000000001' as `0x${string}`,
          to: DEV_USDC_CONFIG.address,
          data: '0x095ea7b3' as `0x${string}`,
        });
      }),
    },
    // Test helpers
    _setBalance: (address: `0x${string}`, amount: bigint) => {
      balances.set(address.toLowerCase(), amount);
    },
    _setAllowance: (owner: `0x${string}`, spender: `0x${string}`, amount: bigint) => {
      if (!allowances.has(owner.toLowerCase())) {
        allowances.set(owner.toLowerCase(), new Map());
      }
      allowances.get(owner.toLowerCase())!.set(spender.toLowerCase(), amount);
    },
  };
}
