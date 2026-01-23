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

// Placeholder export - will be populated with additional chain configuration
// in subsequent features (contract addresses, RPC URLs, etc.)
export const chainConstants = {
  CRONOS_TESTNET_CHAIN_ID,
} as const;

export default chainConstants;
