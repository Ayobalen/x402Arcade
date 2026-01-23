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

// Chain constants object containing all defined constants
export const chainConstants = {
  CRONOS_TESTNET_CHAIN_ID,
  DEFAULT_CRONOS_TESTNET_RPC_URL,
  CRONOS_TESTNET_RPC_URL,
  getCronosTestnetRpcUrl,
} as const;

export default chainConstants;
