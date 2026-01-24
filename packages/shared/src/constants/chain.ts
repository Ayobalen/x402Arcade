/**
 * Shared Chain Constants
 *
 * Single source of truth for all Cronos blockchain constants used across
 * frontend and backend packages. This ensures consistency in:
 * - Chain IDs and network settings
 * - Contract addresses (USDC, x402 facilitator)
 * - EIP-3009/EIP-712 type definitions
 *
 * @module @x402arcade/shared/constants/chain
 */

// ============================================================================
// Chain Configuration
// ============================================================================

/**
 * Cronos Testnet Chain ID
 *
 * The unique identifier for the Cronos Testnet blockchain network.
 * Used for wallet connections, transaction validation, and network switching.
 */
export const CRONOS_TESTNET_CHAIN_ID = 338 as const;

/**
 * Type for supported chain IDs
 */
export type SupportedChainId = typeof CRONOS_TESTNET_CHAIN_ID;

/**
 * Check if a chain ID is supported
 */
export function isSupportedChain(chainId: number): chainId is SupportedChainId {
  return chainId === CRONOS_TESTNET_CHAIN_ID;
}

// ============================================================================
// RPC and Explorer URLs
// ============================================================================

/**
 * Default Cronos Testnet RPC URL
 */
export const DEFAULT_RPC_URL = 'https://evm-t3.cronos.org/';

/**
 * Default Cronos Testnet Block Explorer URL
 */
export const DEFAULT_EXPLORER_URL = 'https://explorer.cronos.org/testnet';

// ============================================================================
// USDC Token Configuration
// ============================================================================

/**
 * Default USDC Contract Address (devUSDC.e) on Cronos Testnet
 *
 * The bridged USDC (Stargate) contract address for payment processing.
 * This is the token used for x402 micropayments in the arcade.
 *
 * @see https://explorer.cronos.org/testnet/address/0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0
 */
export const DEFAULT_USDC_ADDRESS = '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0' as const;

/**
 * USDC Token Name for EIP-712 Domain
 *
 * This MUST match the deployed contract's name() function return value.
 * Used in the EIP-712 domain separator for signature verification.
 */
export const USDC_NAME = 'Bridged USDC (Stargate)';

/**
 * USDC EIP-712 Domain Version
 *
 * **CRITICAL**: The version differs between networks:
 * - Testnet (devUSDC.e): "1"
 * - Mainnet (USDC): "2"
 */
export const USDC_VERSION = '1';

/**
 * USDC Token Decimals
 *
 * USDC uses 6 decimals unlike most ERC-20 tokens that use 18.
 * - 1 USDC = 1,000,000 (10^6) smallest units
 * - $0.01 = 10,000 smallest units
 */
export const USDC_DECIMALS = 6 as const;

/**
 * USDC Token Configuration Object
 */
export const USDC_CONFIG = {
  address: DEFAULT_USDC_ADDRESS,
  decimals: USDC_DECIMALS,
  symbol: 'USDC',
  name: 'USD Coin (testnet)',
} as const;

// ============================================================================
// Facilitator Configuration
// ============================================================================

/**
 * Default x402 Facilitator Base URL
 *
 * The Cronos Labs x402 facilitator service that processes gasless payments.
 */
export const DEFAULT_FACILITATOR_URL = 'https://facilitator.cronoslabs.org';

/**
 * Facilitator API Endpoints
 */
export const FACILITATOR_SETTLE_ENDPOINT = '/v2/x402/settle';
export const FACILITATOR_SUPPORTED_ENDPOINT = '/v2/x402/supported';

// ============================================================================
// Native Currency Configuration
// ============================================================================

/**
 * Native Currency Configuration Interface
 */
export interface NativeCurrencyConfig {
  name: string;
  symbol: string;
  decimals: number;
}

/**
 * Cronos Testnet Native Currency (TCRO)
 */
export const NATIVE_CURRENCY: NativeCurrencyConfig = {
  name: 'Cronos Testnet',
  symbol: 'TCRO',
  decimals: 18,
} as const;

// ============================================================================
// EIP-712 Types
// ============================================================================

/**
 * EIP-712 TypedDataField Interface
 */
export interface TypedDataField {
  name: string;
  type: string;
}

/**
 * EIP-712 Domain Type Definition
 */
export const EIP712_DOMAIN_TYPE: readonly TypedDataField[] = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
] as const;

/**
 * EIP-712 Domain Configuration Interface
 */
export interface EIP712Domain {
  name: string;
  version: string;
  chainId: number | bigint;
  verifyingContract: string;
}

/**
 * EIP-3009 TransferWithAuthorization Type Definition
 */
export const TRANSFER_WITH_AUTHORIZATION_TYPE: readonly TypedDataField[] = [
  { name: 'from', type: 'address' },
  { name: 'to', type: 'address' },
  { name: 'value', type: 'uint256' },
  { name: 'validAfter', type: 'uint256' },
  { name: 'validBefore', type: 'uint256' },
  { name: 'nonce', type: 'bytes32' },
] as const;

/**
 * Types object for viem/wagmi signTypedData
 */
export const TRANSFER_WITH_AUTHORIZATION_TYPES = {
  TransferWithAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' },
  ],
} as const;

/**
 * Primary type constant for TransferWithAuthorization
 */
export const TRANSFER_WITH_AUTHORIZATION_PRIMARY_TYPE = 'TransferWithAuthorization' as const;

/**
 * TransferWithAuthorization Message Interface
 */
export interface TransferWithAuthorizationMessage {
  from: string;
  to: string;
  value: string | bigint;
  validAfter: string | bigint;
  validBefore: string | bigint;
  nonce: string;
}

/**
 * Signature Components Interface
 */
export interface SignatureComponents {
  v: number;
  r: string;
  s: string;
}

/**
 * Signed TransferWithAuthorization Interface
 */
export interface SignedTransferWithAuthorization extends SignatureComponents {
  message: TransferWithAuthorizationMessage;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validate an Ethereum address format
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Normalize an Ethereum address to lowercase for comparison
 */
export function normalizeAddress(address: string): string {
  if (!isValidAddress(address)) {
    throw new Error(`Invalid address format: ${address}`);
  }
  return address.toLowerCase();
}

/**
 * Compare two Ethereum addresses for equality (case-insensitive)
 */
export function addressesEqual(address1: string, address2: string): boolean {
  try {
    return normalizeAddress(address1) === normalizeAddress(address2);
  } catch {
    return false;
  }
}

/**
 * Parse a human-readable USDC amount into smallest units
 */
export function parseUSDC(amount: string | number): bigint {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    throw new Error(`Invalid USDC amount: ${amount}`);
  }

  if (numAmount < 0) {
    throw new Error(`USDC amount cannot be negative: ${amount}`);
  }

  const multiplier = 10 ** USDC_DECIMALS;
  const smallestUnits = Math.round(numAmount * multiplier);

  return BigInt(smallestUnits);
}

/**
 * Format a smallest unit USDC amount into a human-readable string
 */
export function formatUSDC(
  amount: bigint | number | string,
  decimalPlaces: number = 2
): string {
  const bigAmount =
    typeof amount === 'bigint'
      ? amount
      : BigInt(typeof amount === 'string' ? amount : Math.floor(amount));

  const divisor = BigInt(10 ** USDC_DECIMALS);
  const wholePart = bigAmount / divisor;
  const fractionalPart = bigAmount % divisor;

  const fractionalStr = fractionalPart.toString().padStart(USDC_DECIMALS, '0');
  const truncatedFractional = fractionalStr.slice(0, decimalPlaces).padEnd(decimalPlaces, '0');

  return `${wholePart}.${truncatedFractional}`;
}

/**
 * Format a USDC amount with currency symbol
 */
export function formatUSDCWithSymbol(
  amount: bigint | number | string,
  decimalPlaces: number = 2
): string {
  return `$${formatUSDC(amount, decimalPlaces)}`;
}

/**
 * Generate a random 32-byte nonce for TransferWithAuthorization
 */
export function generateNonce(): string {
  const bytes = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    // Fallback for Node.js environment
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require('crypto');
    const randomBytes = nodeCrypto.randomBytes(32);
    bytes.set(randomBytes);
  }

  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `0x${hex}`;
}

/**
 * Get the USDC EIP-712 Domain for Cronos Testnet
 */
export function getUsdcEip712Domain(usdcAddress: string = DEFAULT_USDC_ADDRESS): EIP712Domain {
  return {
    name: USDC_NAME,
    version: USDC_VERSION,
    chainId: CRONOS_TESTNET_CHAIN_ID,
    verifyingContract: usdcAddress,
  };
}

/**
 * Create a custom EIP-712 Domain
 */
export function createEip712Domain(options: {
  name: string;
  version: string;
  chainId: number | bigint;
  verifyingContract: string;
}): EIP712Domain {
  if (!isValidAddress(options.verifyingContract)) {
    throw new Error(`Invalid verifyingContract address: ${options.verifyingContract}`);
  }

  return {
    name: options.name,
    version: options.version,
    chainId: options.chainId,
    verifyingContract: options.verifyingContract,
  };
}

/**
 * Create a TransferWithAuthorization message
 */
export function createTransferWithAuthorizationMessage(options: {
  from: string;
  to: string;
  value: bigint | string | number;
  validAfter?: bigint | string | number;
  validBefore?: bigint | string | number;
  validitySeconds?: number;
  nonce: string;
}): TransferWithAuthorizationMessage {
  if (!isValidAddress(options.from)) {
    throw new Error(`Invalid 'from' address: ${options.from}`);
  }
  if (!isValidAddress(options.to)) {
    throw new Error(`Invalid 'to' address: ${options.to}`);
  }

  if (!/^0x[a-fA-F0-9]{64}$/.test(options.nonce)) {
    throw new Error(
      `Invalid nonce format: ${options.nonce}. Expected 0x prefix + 64 hex characters.`
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const validAfter =
    options.validAfter !== undefined ? BigInt(options.validAfter) : BigInt(0);
  const validBefore =
    options.validBefore !== undefined
      ? BigInt(options.validBefore)
      : BigInt(now + (options.validitySeconds || 3600));

  const value =
    typeof options.value === 'bigint'
      ? options.value.toString()
      : typeof options.value === 'number'
        ? BigInt(Math.floor(options.value)).toString()
        : options.value;

  return {
    from: options.from,
    to: options.to,
    value,
    validAfter: validAfter.toString(),
    validBefore: validBefore.toString(),
    nonce: options.nonce,
  };
}

/**
 * Check if a TransferWithAuthorization is currently valid
 */
export function isAuthorizationValid(
  message: TransferWithAuthorizationMessage
): boolean {
  const now = BigInt(Math.floor(Date.now() / 1000));
  const validAfter = BigInt(message.validAfter);
  const validBefore = BigInt(message.validBefore);

  return now > validAfter && now < validBefore;
}

/**
 * Build a transaction URL for the block explorer
 */
export function getTxUrl(txHash: string, explorerUrl: string = DEFAULT_EXPLORER_URL): string {
  const hash = txHash.startsWith('0x') ? txHash : `0x${txHash}`;
  return `${explorerUrl}/tx/${hash}`;
}

/**
 * Build an address URL for the block explorer
 */
export function getAddressUrl(address: string, explorerUrl: string = DEFAULT_EXPLORER_URL): string {
  const addr = address.startsWith('0x') ? address : `0x${address}`;
  return `${explorerUrl}/address/${addr}`;
}

/**
 * Build a token URL for the block explorer
 */
export function getTokenUrl(tokenAddress: string, explorerUrl: string = DEFAULT_EXPLORER_URL): string {
  const addr = tokenAddress.startsWith('0x') ? tokenAddress : `0x${tokenAddress}`;
  return `${explorerUrl}/token/${addr}`;
}

/**
 * Parse signature from compact hex format into r, s, v components
 */
export function parseSignature(signature: string): SignatureComponents {
  if (!/^0x[a-fA-F0-9]{130}$/.test(signature)) {
    throw new Error(
      `Invalid signature format: expected 0x + 130 hex characters (65 bytes), got ${signature.length - 2} hex characters`
    );
  }

  const r = `0x${signature.slice(2, 66)}`;
  const s = `0x${signature.slice(66, 130)}`;
  const v = parseInt(signature.slice(130, 132), 16);
  const normalizedV = v < 27 ? v + 27 : v;

  return { r, s, v: normalizedV };
}

/**
 * Combine signature components into compact hex format
 */
export function combineSignature(r: string, s: string, v: number): string {
  const normalizedR = r.startsWith('0x') ? r.slice(2) : r;
  const normalizedS = s.startsWith('0x') ? s.slice(2) : s;
  const vByte = v >= 27 ? v - 27 : v;
  const vHex = vByte.toString(16).padStart(2, '0');

  return `0x${normalizedR}${normalizedS}${vHex}`;
}

/**
 * Validate signature components format
 */
export function validateSignatureComponents(signature: SignatureComponents): void {
  if (!/^0x[a-fA-F0-9]{64}$/.test(signature.r)) {
    throw new Error(
      `Invalid signature component 'r': expected 0x-prefixed hex string with 64 characters`
    );
  }

  if (!/^0x[a-fA-F0-9]{64}$/.test(signature.s)) {
    throw new Error(
      `Invalid signature component 's': expected 0x-prefixed hex string with 64 characters`
    );
  }

  if (signature.v !== 27 && signature.v !== 28 && signature.v !== 0 && signature.v !== 1) {
    throw new Error(`Invalid signature component 'v': expected 27, 28, 0, or 1, got ${signature.v}`);
  }
}
