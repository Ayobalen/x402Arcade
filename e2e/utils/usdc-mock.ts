/**
 * USDC Contract Mock Utilities
 *
 * Provides utilities for mocking the USDC contract in E2E tests.
 * Supports EIP-3009 transferWithAuthorization with signature validation
 * and replay protection.
 *
 * @module e2e/utils/usdc-mock
 */

import { parseUSDC } from '../../packages/backend/src/lib/chain/constants';

/**
 * Mock USDC balance state
 * Maps addresses to their balance in smallest units (10^6)
 */
type BalanceMap = Map<string, bigint>;

/**
 * Mock nonce state for replay protection
 * Maps addresses to a set of used nonces
 */
type NonceMap = Map<string, Set<string>>;

/**
 * TransferWithAuthorization parameters
 * Based on EIP-3009 standard
 */
export interface TransferWithAuthorizationParams {
  from: string;
  to: string;
  value: bigint | string;
  validAfter: bigint | string;
  validBefore: bigint | string;
  nonce: string;
  v: number;
  r: string;
  s: string;
}

/**
 * Transfer event emitted by the mock contract
 */
export interface TransferEvent {
  from: string;
  to: string;
  value: bigint;
  timestamp: number;
}

/**
 * Authorization used event for replay protection
 */
export interface AuthorizationUsedEvent {
  authorizer: string;
  nonce: string;
  timestamp: number;
}

/**
 * Mock USDC Contract
 *
 * A lightweight mock implementation of the USDC contract for E2E testing.
 * Supports the key methods needed for x402 payment testing:
 * - balanceOf: Query token balances
 * - transferWithAuthorization: Execute gasless transfers with EIP-3009
 * - Replay protection via nonce tracking
 * - Event emission for verification
 *
 * @example
 * ```typescript
 * const usdc = new MockUSDCContract();
 * usdc.setBalance('0x1234...', parseUSDC(100)); // Give 100 USDC
 * const balance = usdc.balanceOf('0x1234...'); // Returns 100000000n
 * ```
 */
export class MockUSDCContract {
  private balances: BalanceMap;
  private usedNonces: NonceMap;
  private transferEvents: TransferEvent[];
  private authorizationUsedEvents: AuthorizationUsedEvent[];
  private readonly contractAddress: string;
  private readonly name: string;
  private readonly symbol: string;
  private readonly decimals: number;

  /**
   * Create a new mock USDC contract
   *
   * @param contractAddress - The contract address (default: testnet devUSDC.e)
   */
  constructor(contractAddress = '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0') {
    this.contractAddress = contractAddress.toLowerCase();
    this.name = 'Bridged USDC (Stargate)';
    this.symbol = 'devUSDC.e';
    this.decimals = 6;
    this.balances = new Map();
    this.usedNonces = new Map();
    this.transferEvents = [];
    this.authorizationUsedEvents = [];
  }

  /**
   * Get the contract address
   */
  public address(): string {
    return this.contractAddress;
  }

  /**
   * Get the token name
   */
  public tokenName(): string {
    return this.name;
  }

  /**
   * Get the token symbol
   */
  public tokenSymbol(): string {
    return this.symbol;
  }

  /**
   * Get the number of decimals
   */
  public tokenDecimals(): number {
    return this.decimals;
  }

  /**
   * Get the balance of an address
   *
   * @param address - The address to query
   * @returns Balance in smallest units (10^6)
   *
   * @example
   * ```typescript
   * const balance = usdc.balanceOf('0x1234...');
   * console.log(balance); // 100000000n (100 USDC)
   * ```
   */
  public balanceOf(address: string): bigint {
    const normalized = this.normalizeAddress(address);
    return this.balances.get(normalized) || 0n;
  }

  /**
   * Set the balance of an address (for test setup)
   *
   * @param address - The address to set balance for
   * @param amount - The balance in smallest units
   *
   * @example
   * ```typescript
   * // Give 100 USDC to test address
   * usdc.setBalance('0x1234...', parseUSDC(100));
   * ```
   */
  public setBalance(address: string, amount: bigint | string | number): void {
    const normalized = this.normalizeAddress(address);
    const bigAmount = typeof amount === 'bigint' ? amount : BigInt(amount);

    if (bigAmount < 0n) {
      throw new Error(`Balance cannot be negative: ${bigAmount}`);
    }

    this.balances.set(normalized, bigAmount);
  }

  /**
   * Execute a transferWithAuthorization
   *
   * Validates the authorization and executes the transfer if valid.
   * Implements EIP-3009 validation rules:
   * - Checks signature validity (simplified for testing)
   * - Verifies validity window (validAfter, validBefore)
   * - Enforces replay protection (nonce must not be used)
   * - Verifies sufficient balance
   *
   * @param params - The transfer authorization parameters
   * @returns Transaction hash (mock)
   * @throws Error if authorization is invalid
   *
   * @example
   * ```typescript
   * const txHash = await usdc.transferWithAuthorization({
   *   from: '0x1234...',
   *   to: '0x5678...',
   *   value: parseUSDC(0.01),
   *   validAfter: 0,
   *   validBefore: Math.floor(Date.now() / 1000) + 3600,
   *   nonce: '0x' + '1'.repeat(64),
   *   v: 27,
   *   r: '0x' + '2'.repeat(64),
   *   s: '0x' + '3'.repeat(64),
   * });
   * ```
   */
  public async transferWithAuthorization(params: TransferWithAuthorizationParams): Promise<string> {
    const { from, to, value, validAfter, validBefore, nonce, v, r, s } = params;

    // Normalize addresses
    const normalizedFrom = this.normalizeAddress(from);
    const normalizedTo = this.normalizeAddress(to);

    // Convert value to bigint
    const bigValue = typeof value === 'bigint' ? value : BigInt(value);

    // Validate addresses
    this.validateAddress(from, 'from');
    this.validateAddress(to, 'to');

    // Validate nonce format (32 bytes = 64 hex chars)
    if (!/^0x[a-fA-F0-9]{64}$/.test(nonce)) {
      throw new Error(`Invalid nonce format: ${nonce}. Expected 0x + 64 hex characters.`);
    }

    // Validate signature components
    this.validateSignature(v, r, s);

    // Check validity window
    const now = BigInt(Math.floor(Date.now() / 1000));
    const after = typeof validAfter === 'bigint' ? validAfter : BigInt(validAfter);
    const before = typeof validBefore === 'bigint' ? validBefore : BigInt(validBefore);

    if (now <= after) {
      throw new Error(`Authorization not yet valid. Current time: ${now}, valid after: ${after}`);
    }

    if (now >= before) {
      throw new Error(`Authorization expired. Current time: ${now}, valid before: ${before}`);
    }

    // Check replay protection (nonce must not be used)
    if (this.isNonceUsed(normalizedFrom, nonce)) {
      throw new Error(`Nonce already used: ${nonce} for address ${normalizedFrom}`);
    }

    // Check sufficient balance
    const currentBalance = this.balanceOf(normalizedFrom);
    if (currentBalance < bigValue) {
      throw new Error(`Insufficient balance. Required: ${bigValue}, available: ${currentBalance}`);
    }

    // Execute transfer
    this.balances.set(normalizedFrom, currentBalance - bigValue);
    const recipientBalance = this.balanceOf(normalizedTo);
    this.balances.set(normalizedTo, recipientBalance + bigValue);

    // Mark nonce as used
    this.markNonceUsed(normalizedFrom, nonce);

    // Emit events
    const timestamp = Date.now();
    this.transferEvents.push({
      from: normalizedFrom,
      to: normalizedTo,
      value: bigValue,
      timestamp,
    });

    this.authorizationUsedEvents.push({
      authorizer: normalizedFrom,
      nonce,
      timestamp,
    });

    // Return mock transaction hash
    const txHash = this.generateMockTxHash(normalizedFrom, normalizedTo, bigValue, nonce);
    return txHash;
  }

  /**
   * Check if a nonce has been used (replay protection)
   *
   * @param address - The authorizer address
   * @param nonce - The nonce to check
   * @returns true if nonce has been used
   */
  public isNonceUsed(address: string, nonce: string): boolean {
    const normalized = this.normalizeAddress(address);
    const nonces = this.usedNonces.get(normalized);
    return nonces ? nonces.has(nonce) : false;
  }

  /**
   * Mark a nonce as used (for replay protection)
   *
   * @param address - The authorizer address
   * @param nonce - The nonce to mark as used
   */
  private markNonceUsed(address: string, nonce: string): void {
    const normalized = this.normalizeAddress(address);
    let nonces = this.usedNonces.get(normalized);

    if (!nonces) {
      nonces = new Set();
      this.usedNonces.set(normalized, nonces);
    }

    nonces.add(nonce);
  }

  /**
   * Get all transfer events
   */
  public getTransferEvents(): TransferEvent[] {
    return [...this.transferEvents];
  }

  /**
   * Get all authorization used events
   */
  public getAuthorizationUsedEvents(): AuthorizationUsedEvent[] {
    return [...this.authorizationUsedEvents];
  }

  /**
   * Clear all events (for test isolation)
   */
  public clearEvents(): void {
    this.transferEvents = [];
    this.authorizationUsedEvents = [];
  }

  /**
   * Reset the contract state (for test isolation)
   * Clears all balances, nonces, and events
   */
  public reset(): void {
    this.balances.clear();
    this.usedNonces.clear();
    this.clearEvents();
  }

  /**
   * Normalize an Ethereum address to lowercase
   */
  private normalizeAddress(address: string): string {
    return address.toLowerCase();
  }

  /**
   * Validate an Ethereum address format
   */
  private validateAddress(address: string, fieldName: string): void {
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new Error(`Invalid ${fieldName} address: ${address}. Expected 0x + 40 hex characters.`);
    }
  }

  /**
   * Validate signature components
   */
  private validateSignature(v: number, r: string, s: string): void {
    // Validate v (recovery identifier: 27 or 28)
    if (v !== 27 && v !== 28) {
      throw new Error(`Invalid v value: ${v}. Expected 27 or 28.`);
    }

    // Validate r (32 bytes = 64 hex chars)
    if (!/^0x[a-fA-F0-9]{64}$/.test(r)) {
      throw new Error(`Invalid r value: ${r}. Expected 0x + 64 hex characters.`);
    }

    // Validate s (32 bytes = 64 hex chars)
    if (!/^0x[a-fA-F0-9]{64}$/.test(s)) {
      throw new Error(`Invalid s value: ${s}. Expected 0x + 64 hex characters.`);
    }
  }

  /**
   * Generate a mock transaction hash
   */
  private generateMockTxHash(from: string, to: string, value: bigint, nonce: string): string {
    // Create a deterministic but unique hash based on transfer params
    const data = `${from}${to}${value.toString()}${nonce}${Date.now()}`;

    // Simple hash simulation (not cryptographically secure, just for testing)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = (hash << 5) - hash + data.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Convert to hex and pad to 32 bytes (64 hex chars)
    const hashStr = Math.abs(hash).toString(16).padStart(64, '0');
    return `0x${hashStr}`;
  }
}

/**
 * USDC Mock Manager
 *
 * Helper class to manage multiple mock USDC contracts across tests.
 * Provides utilities for:
 * - Creating and configuring mock contracts
 * - Setting up test scenarios with pre-funded addresses
 * - Resetting state between tests
 *
 * @example
 * ```typescript
 * const manager = new USDCMockManager();
 * const usdc = manager.createContract();
 *
 * // Setup test scenario
 * manager.fundAddress(usdc, '0x1234...', 100); // 100 USDC
 * manager.fundAddress(usdc, '0x5678...', 50);  // 50 USDC
 *
 * // Use in test
 * const balance = usdc.balanceOf('0x1234...');
 * ```
 */
export class USDCMockManager {
  private contracts: Map<string, MockUSDCContract>;

  constructor() {
    this.contracts = new Map();
  }

  /**
   * Create a new mock USDC contract
   *
   * @param contractAddress - Optional custom contract address
   * @returns The mock contract instance
   */
  public createContract(contractAddress?: string): MockUSDCContract {
    const contract = new MockUSDCContract(contractAddress);
    const address = contract.address();
    this.contracts.set(address, contract);
    return contract;
  }

  /**
   * Get an existing mock contract by address
   *
   * @param contractAddress - The contract address
   * @returns The mock contract instance or undefined
   */
  public getContract(contractAddress: string): MockUSDCContract | undefined {
    const normalized = contractAddress.toLowerCase();
    return this.contracts.get(normalized);
  }

  /**
   * Fund an address with USDC (convenience method)
   *
   * @param contract - The mock contract
   * @param address - The address to fund
   * @param amountUSDC - The amount in USDC (human-readable, e.g., 100 for 100 USDC)
   */
  public fundAddress(contract: MockUSDCContract, address: string, amountUSDC: number): void {
    const amount = parseUSDC(amountUSDC);
    contract.setBalance(address, amount);
  }

  /**
   * Setup a common test scenario with multiple funded addresses
   *
   * @param contract - The mock contract
   * @param scenario - Map of addresses to USDC amounts
   *
   * @example
   * ```typescript
   * manager.setupScenario(usdc, {
   *   '0x1234...': 100,  // Player with 100 USDC
   *   '0x5678...': 1000, // Arcade wallet with 1000 USDC
   * });
   * ```
   */
  public setupScenario(contract: MockUSDCContract, scenario: Record<string, number>): void {
    for (const [address, amountUSDC] of Object.entries(scenario)) {
      this.fundAddress(contract, address, amountUSDC);
    }
  }

  /**
   * Reset all contracts (for test isolation)
   */
  public resetAll(): void {
    for (const contract of this.contracts.values()) {
      contract.reset();
    }
  }

  /**
   * Clear all contracts
   */
  public clearAll(): void {
    this.contracts.clear();
  }
}

/**
 * Create a configured mock balances for testing
 *
 * @param addresses - Array of addresses to fund
 * @param defaultBalance - Default balance in USDC (default: 100)
 * @returns Map of addresses to balances
 *
 * @example
 * ```typescript
 * const balances = createMockBalances([
 *   '0x1234...',
 *   '0x5678...',
 * ], 50); // Each address gets 50 USDC
 * ```
 */
export function createMockBalances(
  addresses: string[],
  defaultBalance: number = 100
): Map<string, bigint> {
  const balances = new Map<string, bigint>();
  const amount = parseUSDC(defaultBalance);

  for (const address of addresses) {
    const normalized = address.toLowerCase();
    balances.set(normalized, amount);
  }

  return balances;
}

/**
 * Generate a test nonce
 *
 * Creates a valid nonce for testing (not cryptographically secure).
 * For production, use crypto.getRandomValues or crypto.randomBytes.
 *
 * @param seed - Optional seed for deterministic nonces (for testing)
 * @returns A valid 32-byte hex string
 *
 * @example
 * ```typescript
 * const nonce1 = generateTestNonce(); // Random
 * const nonce2 = generateTestNonce('test-1'); // Deterministic
 * ```
 */
export function generateTestNonce(seed?: string): string {
  if (seed) {
    // Deterministic nonce for testing
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash = hash & hash;
    }
    const hashStr = Math.abs(hash).toString(16).padStart(64, '0');
    return `0x${hashStr}`;
  }

  // Random nonce
  const bytes = new Array(32).fill(0).map(() => Math.floor(Math.random() * 256));
  const hex = bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
  return `0x${hex}`;
}

/**
 * Create a test TransferWithAuthorization params object
 *
 * @param options - Transfer parameters
 * @returns Complete params object ready for transferWithAuthorization
 *
 * @example
 * ```typescript
 * const params = createTestTransferParams({
 *   from: '0x1234...',
 *   to: '0x5678...',
 *   amountUSDC: 0.01,
 * });
 *
 * const txHash = await usdc.transferWithAuthorization(params);
 * ```
 */
export function createTestTransferParams(options: {
  from: string;
  to: string;
  amountUSDC: number;
  validitySeconds?: number;
  nonce?: string;
}): TransferWithAuthorizationParams {
  const now = Math.floor(Date.now() / 1000);
  const validitySeconds = options.validitySeconds || 3600; // 1 hour default

  return {
    from: options.from,
    to: options.to,
    value: parseUSDC(options.amountUSDC),
    validAfter: 0n,
    validBefore: BigInt(now + validitySeconds),
    nonce: options.nonce || generateTestNonce(),
    v: 27,
    r: '0x' + '1'.repeat(64),
    s: '0x' + '2'.repeat(64),
  };
}
