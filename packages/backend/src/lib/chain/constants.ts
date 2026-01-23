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

// Chain constants object containing all defined constants
export const chainConstants = {
  CRONOS_TESTNET_CHAIN_ID,
  DEFAULT_CRONOS_TESTNET_RPC_URL,
  CRONOS_TESTNET_RPC_URL,
  CRONOS_TESTNET_EXPLORER_URL,
  getCronosTestnetRpcUrl,
  getExplorerTxUrl,
  getExplorerAddressUrl,
} as const;

export default chainConstants;
