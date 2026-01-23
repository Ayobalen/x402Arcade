/**
 * Chain Constants Configuration
 *
 * This file serves as the single source of truth for all Cronos blockchain constants
 * used throughout the x402Arcade backend. All chain-related configuration including:
 * - Chain IDs and network settings
 * - Contract addresses (USDC, x402 facilitator)
 * - RPC endpoints and explorer URLs
 * - EIP-3009 domain configuration
 *
 * References:
 * - Cronos Testnet: Chain ID 338
 * - devUSDC.e: 0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0
 * - x402 Facilitator: https://facilitator.cronoslabs.org
 *
 * @module lib/chain/constants
 */

/**
 * Cronos Testnet Chain ID
 *
 * The unique identifier for the Cronos Testnet blockchain network.
 * Used for wallet connections, transaction validation, and network switching.
 *
 * @see https://docs.cronos.org/cronos-zkevm/for-developers/dev-tools-and-integrations/chain-integration
 */
export const CRONOS_TESTNET_CHAIN_ID: 338 = 338;

/**
 * Default Cronos Testnet RPC URL
 *
 * The public RPC endpoint for the Cronos Testnet blockchain.
 * Used for reading blockchain state and submitting transactions.
 *
 * Can be overridden via the RPC_URL environment variable for custom
 * RPC endpoints (e.g., private nodes, different providers).
 *
 * @see https://docs.cronos.org/cronos-zkevm/for-developers/dev-tools-and-integrations/chain-integration
 */
export const DEFAULT_CRONOS_TESTNET_RPC_URL = 'https://evm-t3.cronos.org/';

/**
 * Get the Cronos Testnet RPC URL
 *
 * Returns the RPC_URL environment variable if set, otherwise falls back
 * to the default Cronos Testnet RPC URL.
 *
 * @returns The RPC URL to use for blockchain communication
 */
export function getCronosTestnetRpcUrl(): string {
  return process.env.RPC_URL || DEFAULT_CRONOS_TESTNET_RPC_URL;
}

/**
 * Cronos Testnet RPC URL
 *
 * The RPC endpoint URL for the Cronos Testnet blockchain.
 * Supports environment variable override via RPC_URL.
 *
 * @deprecated Use getCronosTestnetRpcUrl() for runtime configuration support
 */
export const CRONOS_TESTNET_RPC_URL: string = getCronosTestnetRpcUrl();

/**
 * Cronos Testnet Block Explorer URL
 *
 * The base URL for the Cronos Testnet block explorer.
 * Used for generating links to transactions and addresses in the UI.
 *
 * @see https://explorer.cronos.org/testnet
 */
export const CRONOS_TESTNET_EXPLORER_URL = 'https://explorer.cronos.org/testnet';

/**
 * Generate a transaction URL for the Cronos Testnet block explorer
 *
 * @param txHash - The transaction hash (with or without 0x prefix)
 * @returns Full URL to view the transaction on the explorer
 * @example
 * getExplorerTxUrl('0x123...abc') // => 'https://explorer.cronos.org/testnet/tx/0x123...abc'
 */
export function getExplorerTxUrl(txHash: string): string {
  const hash = txHash.startsWith('0x') ? txHash : `0x${txHash}`;
  return `${CRONOS_TESTNET_EXPLORER_URL}/tx/${hash}`;
}

/**
 * Generate an address URL for the Cronos Testnet block explorer
 *
 * @param address - The wallet or contract address (with or without 0x prefix)
 * @returns Full URL to view the address on the explorer
 * @example
 * getExplorerAddressUrl('0xabc...123') // => 'https://explorer.cronos.org/testnet/address/0xabc...123'
 */
export function getExplorerAddressUrl(address: string): string {
  const addr = address.startsWith('0x') ? address : `0x${address}`;
  return `${CRONOS_TESTNET_EXPLORER_URL}/address/${addr}`;
}

/**
 * Native Currency Configuration
 *
 * Configuration for the native currency on Cronos Testnet.
 * Used for wallet display and transaction fee calculations.
 */
export interface NativeCurrencyConfig {
  /** Full name of the native currency */
  name: string;
  /** Token symbol (e.g., 'TCRO') */
  symbol: string;
  /** Number of decimal places (18 for most EVM chains) */
  decimals: number;
}

/**
 * Cronos Testnet Native Currency (TCRO)
 *
 * Configuration for the native currency on Cronos Testnet.
 * TCRO is used for gas fees and native token transfers.
 *
 * @see https://docs.cronos.org/cronos-zkevm/for-developers/dev-tools-and-integrations/chain-integration
 */
export const NATIVE_CURRENCY: NativeCurrencyConfig = {
  name: 'Cronos Testnet',
  symbol: 'TCRO',
  decimals: 18,
} as const;

/**
 * USDC Token Name for EIP-712 Domain Construction
 *
 * The name of the USDC token as registered in the smart contract.
 * This value MUST match the actual deployed contract's name() function return value
 * for EIP-712 typed data signatures to be valid.
 *
 * Used in EIP-3009 transferWithAuthorization and receiveWithAuthorization
 * calls, which are the foundation of the x402 payment protocol.
 *
 * The domain separator for EIP-712 is constructed as:
 * ```
 * keccak256(
 *   abi.encode(
 *     keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
 *     keccak256(bytes(name)),    // <-- This constant
 *     keccak256(bytes(version)), // Domain version
 *     chainId,
 *     verifyingContract
 *   )
 * )
 * ```
 *
 * @see https://eips.ethereum.org/EIPS/eip-712 - EIP-712 Typed Data
 * @see https://eips.ethereum.org/EIPS/eip-3009 - Transfer With Authorization
 */
export const USDC_NAME = 'Bridged USDC (Stargate)';

/**
 * USDC Token Decimals
 *
 * The number of decimal places for the USDC token.
 * Unlike most ERC-20 tokens that use 18 decimals, USDC uses 6 decimals.
 *
 * This means:
 * - 1 USDC = 1,000,000 (10^6) smallest units
 * - $0.01 = 10,000 smallest units
 * - $0.000001 = 1 smallest unit (minimum precision)
 *
 * @example
 * // Convert 1.5 USDC to smallest units
 * const amount = 1.5 * (10 ** USDC_DECIMALS); // 1,500,000
 *
 * // Convert smallest units back to USDC
 * const usdc = 1500000 / (10 ** USDC_DECIMALS); // 1.5
 */
export const USDC_DECIMALS: 6 = 6;

/**
 * Parse a human-readable USDC amount into the smallest unit representation
 *
 * Converts a decimal USDC value (e.g., "1.50" or 1.5) into the integer
 * representation used on-chain (e.g., 1500000).
 *
 * @param amount - The USDC amount as a string or number (e.g., "1.50", 1.5, "0.01")
 * @returns The amount in smallest units as a bigint
 * @throws Error if amount is negative or invalid
 *
 * @example
 * parseUSDC("1.50")    // => 1500000n
 * parseUSDC(0.01)      // => 10000n
 * parseUSDC("100")     // => 100000000n
 */
export function parseUSDC(amount: string | number): bigint {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    throw new Error(`Invalid USDC amount: ${amount}`);
  }

  if (numAmount < 0) {
    throw new Error(`USDC amount cannot be negative: ${amount}`);
  }

  // Multiply by 10^6 and round to avoid floating point issues
  const multiplier = 10 ** USDC_DECIMALS;
  const smallestUnits = Math.round(numAmount * multiplier);

  return BigInt(smallestUnits);
}

/**
 * Format a smallest unit USDC amount into a human-readable string
 *
 * Converts the on-chain integer representation (e.g., 1500000) into
 * a human-readable decimal string (e.g., "1.50").
 *
 * @param amount - The amount in smallest units as a bigint, number, or string
 * @param decimalPlaces - Number of decimal places to show (default: 2)
 * @returns Formatted string with the specified decimal places
 *
 * @example
 * formatUSDC(1500000n)       // => "1.50"
 * formatUSDC(10000n)         // => "0.01"
 * formatUSDC(100000000n)     // => "100.00"
 * formatUSDC(1500000n, 6)    // => "1.500000"
 * formatUSDC(1n, 6)          // => "0.000001"
 */
export function formatUSDC(
  amount: bigint | number | string,
  decimalPlaces: number = 2,
): string {
  const bigAmount =
    typeof amount === 'bigint'
      ? amount
      : BigInt(typeof amount === 'string' ? amount : Math.floor(amount));

  const divisor = BigInt(10 ** USDC_DECIMALS);
  const wholePart = bigAmount / divisor;
  const fractionalPart = bigAmount % divisor;

  // Pad fractional part with leading zeros
  const fractionalStr = fractionalPart.toString().padStart(USDC_DECIMALS, '0');

  // Truncate or pad to desired decimal places
  const truncatedFractional = fractionalStr.slice(0, decimalPlaces).padEnd(decimalPlaces, '0');

  return `${wholePart}.${truncatedFractional}`;
}

/**
 * Format a USDC amount with currency symbol
 *
 * @param amount - The amount in smallest units as a bigint, number, or string
 * @param decimalPlaces - Number of decimal places to show (default: 2)
 * @returns Formatted string with $ prefix (e.g., "$1.50")
 *
 * @example
 * formatUSDCWithSymbol(1500000n)  // => "$1.50"
 * formatUSDCWithSymbol(10000n)    // => "$0.01"
 */
export function formatUSDCWithSymbol(
  amount: bigint | number | string,
  decimalPlaces: number = 2,
): string {
  return `$${formatUSDC(amount, decimalPlaces)}`;
}

/**
 * Default USDC Contract Address (devUSDC.e) on Cronos Testnet
 *
 * The bridged USDC (Stargate) contract address for payment processing.
 * This is the token used for x402 micropayments in the arcade.
 *
 * @see https://explorer.cronos.org/testnet/address/0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0
 */
export const DEFAULT_USDC_CONTRACT_ADDRESS =
  '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0';

/**
 * Validate an Ethereum address format
 *
 * Checks that the address is a valid format:
 * - 42 characters total (0x prefix + 40 hex characters)
 * - Starts with 0x prefix
 * - Contains only valid hexadecimal characters
 *
 * @param address - The address to validate
 * @returns true if valid format, false otherwise
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Get the USDC contract address
 *
 * Returns the USDC_CONTRACT_ADDRESS environment variable if set and valid,
 * otherwise falls back to the default devUSDC.e contract address.
 *
 * @returns The USDC contract address to use for payments
 * @throws Error if environment variable is set but has invalid format
 */
export function getUsdcContractAddress(): string {
  const envAddress = process.env.USDC_CONTRACT_ADDRESS;

  if (envAddress) {
    if (!isValidAddress(envAddress)) {
      throw new Error(
        `Invalid USDC_CONTRACT_ADDRESS format: ${envAddress}. ` +
          'Expected 0x prefix followed by 40 hex characters.',
      );
    }
    return envAddress;
  }

  return DEFAULT_USDC_CONTRACT_ADDRESS;
}

/**
 * USDC Contract Address
 *
 * The devUSDC.e contract address on Cronos Testnet.
 * Supports environment variable override via USDC_CONTRACT_ADDRESS.
 *
 * @deprecated Use getUsdcContractAddress() for runtime configuration with validation
 */
export const USDC_CONTRACT_ADDRESS: string = getUsdcContractAddress();

// Chain constants object containing all defined constants
export const chainConstants = {
  CRONOS_TESTNET_CHAIN_ID,
  DEFAULT_CRONOS_TESTNET_RPC_URL,
  CRONOS_TESTNET_RPC_URL,
  CRONOS_TESTNET_EXPLORER_URL,
  NATIVE_CURRENCY,
  USDC_NAME,
  USDC_DECIMALS,
  DEFAULT_USDC_CONTRACT_ADDRESS,
  USDC_CONTRACT_ADDRESS,
  getCronosTestnetRpcUrl,
  getExplorerTxUrl,
  getExplorerAddressUrl,
  isValidAddress,
  getUsdcContractAddress,
  parseUSDC,
  formatUSDC,
  formatUSDCWithSymbol,
} as const;

export default chainConstants;
