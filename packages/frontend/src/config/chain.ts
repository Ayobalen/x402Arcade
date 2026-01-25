/**
 * Chain Configuration
 *
 * Centralized chain configuration for the x402Arcade frontend.
 * Provides chain definitions with environment variable support
 * for flexible deployment across different networks.
 *
 * @module config/chain
 */

/**
 * Chain configuration interface
 */
export interface Chain {
  id: number;
  name: string;
  network: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: {
    default: { http: string[] };
  };
  blockExplorers: {
    default: {
      name: string;
      url: string;
    };
  };
}

// ============================================================================
// Environment Variables
// ============================================================================

/**
 * Get chain ID from environment or use default
 *
 * Environment variable: VITE_CHAIN_ID
 * Default: 338 (Cronos Testnet)
 */
export function getChainId(): number {
  const envChainId = import.meta.env.VITE_CHAIN_ID;
  if (envChainId) {
    const parsed = parseInt(envChainId, 10);
    if (!isNaN(parsed)) return parsed;
  }
  return 338; // Cronos Testnet
}

/**
 * Get RPC URL from environment or use default
 *
 * Environment variable: VITE_RPC_URL
 * Default: https://evm-t3.cronos.org/
 */
export function getRpcUrl(): string {
  return import.meta.env.VITE_RPC_URL || 'https://evm-t3.cronos.org/';
}

/**
 * Get block explorer URL from environment or use default
 *
 * Environment variable: VITE_EXPLORER_URL
 * Default: https://explorer.cronos.org/testnet
 */
export function getExplorerUrl(): string {
  return import.meta.env.VITE_EXPLORER_URL || 'https://explorer.cronos.org/testnet';
}

/**
 * Default USDC Contract Address for Cronos Testnet
 *
 * devUSDC.e token with EIP-3009 support for gasless payments.
 * @see https://explorer.cronos.org/testnet/token/0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0
 */
export const DEFAULT_USDC_ADDRESS = '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0' as `0x${string}`;

/**
 * Validate Ethereum address format
 *
 * @param address - Address string to validate
 * @returns true if address matches 0x + 40 hex chars format
 */
function isValidAddress(address: string): address is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Get USDC contract address from environment or use default
 *
 * Environment variable: VITE_USDC_ADDRESS
 * Default: 0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0 (devUSDC.e on Cronos Testnet)
 *
 * @returns Typed USDC contract address
 * @throws Error if VITE_USDC_ADDRESS is set but invalid
 */
export function getUsdcContractAddress(): `0x${string}` {
  const envAddress = import.meta.env.VITE_USDC_ADDRESS;
  if (envAddress) {
    if (!isValidAddress(envAddress)) {
      throw new Error(
        `Invalid VITE_USDC_ADDRESS format: ${envAddress}. ` +
          'Expected format: 0x + 40 hex characters (e.g., 0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0)'
      );
    }
    return envAddress;
  }
  return DEFAULT_USDC_ADDRESS;
}

// ============================================================================
// Chain Constants
// ============================================================================

/**
 * Cronos Testnet Chain ID
 */
export const CRONOS_TESTNET_CHAIN_ID = 338 as const;

/**
 * Default RPC URL for Cronos Testnet
 */
export const DEFAULT_RPC_URL = 'https://evm-t3.cronos.org/';

/**
 * Default Block Explorer URL for Cronos Testnet
 */
export const DEFAULT_EXPLORER_URL = 'https://explorer.cronos.org/testnet';

// ============================================================================
// Chain Configuration
// ============================================================================

/**
 * Supported chain configurations
 */
export type SupportedChainId = typeof CRONOS_TESTNET_CHAIN_ID;

/**
 * Check if a chain ID is supported
 */
export function isSupportedChain(chainId: number): chainId is SupportedChainId {
  return chainId === CRONOS_TESTNET_CHAIN_ID;
}

/**
 * Create a custom chain configuration with environment overrides
 *
 * Creates Cronos Testnet chain config with custom RPC and explorer URLs
 * from environment variables, allowing flexible deployment configuration.
 *
 * @returns Chain configuration with environment variable support
 */
export function createChainConfig(): Chain {
  const rpcUrl = getRpcUrl();
  const explorerUrl = getExplorerUrl();

  return {
    id: CRONOS_TESTNET_CHAIN_ID,
    name: 'Cronos Testnet',
    network: 'cronos-testnet',
    nativeCurrency: {
      name: 'Cronos',
      symbol: 'CRO',
      decimals: 18,
    },
    rpcUrls: {
      default: { http: [rpcUrl] },
    },
    blockExplorers: {
      default: {
        name: 'Cronos Explorer',
        url: explorerUrl,
      },
    },
  };
}

/**
 * Default chain configuration for the application
 *
 * Uses Cronos Testnet with optional environment variable overrides
 * for RPC URL and block explorer URL.
 */
export const defaultChain: Chain = createChainConfig();

/**
 * Supported chains array for wagmi/viem configuration
 */
export const supportedChains: readonly [Chain, ...Chain[]] = [defaultChain];

// ============================================================================
// Contract Addresses
// ============================================================================

/**
 * USDC Contract Address
 *
 * ERC-20 USDC token with EIP-3009 (transferWithAuthorization) support
 * for gasless payments via the x402 protocol.
 *
 * Supports environment variable override via VITE_USDC_ADDRESS.
 * Default: devUSDC.e on Cronos Testnet
 *
 * @see https://explorer.cronos.org/testnet/token/0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0
 */
export const USDC_CONTRACT_ADDRESS: `0x${string}` = getUsdcContractAddress();

/**
 * USDC Token Configuration
 */
export const USDC_CONFIG = {
  address: USDC_CONTRACT_ADDRESS,
  decimals: 6,
  symbol: 'USDC',
  name: 'USD Coin (testnet)',
} as const;

/**
 * Get USDC contract address for a chain
 *
 * @param chainId - Chain ID to get address for
 * @returns USDC contract address or undefined if not supported
 */
export function getUsdcAddress(chainId: number): `0x${string}` | undefined {
  if (chainId === CRONOS_TESTNET_CHAIN_ID) {
    return USDC_CONTRACT_ADDRESS;
  }
  return undefined;
}

// ============================================================================
// Facilitator Configuration
// ============================================================================

/**
 * Default x402 Facilitator Base URL
 *
 * The facilitator service that processes x402 payment settlements.
 * This service handles the on-chain execution of EIP-3009 authorizations.
 */
export const DEFAULT_FACILITATOR_URL = 'https://facilitator.cronoslabs.org';

/**
 * Get facilitator URL from environment or use default
 *
 * Environment variable: VITE_FACILITATOR_URL
 * Default: https://facilitator.cronoslabs.org
 */
export function getFacilitatorUrl(): string {
  return import.meta.env.VITE_FACILITATOR_URL || DEFAULT_FACILITATOR_URL;
}

// ============================================================================
// URL Builders
// ============================================================================

/**
 * Build a transaction URL for the block explorer
 *
 * @param txHash - Transaction hash
 * @returns Full URL to the transaction on the block explorer
 */
export function getTxUrl(txHash: string): string {
  const baseUrl = getExplorerUrl();
  return `${baseUrl}/tx/${txHash}`;
}

/**
 * Build an address URL for the block explorer
 *
 * @param address - Wallet or contract address
 * @returns Full URL to the address on the block explorer
 */
export function getAddressUrl(address: string): string {
  const baseUrl = getExplorerUrl();
  return `${baseUrl}/address/${address}`;
}

/**
 * Build a token URL for the block explorer
 *
 * @param tokenAddress - Token contract address
 * @returns Full URL to the token on the block explorer
 */
export function getTokenUrl(tokenAddress: string): string {
  const baseUrl = getExplorerUrl();
  return `${baseUrl}/token/${tokenAddress}`;
}

// ============================================================================
// Type Exports
// ============================================================================

// Chain type is already exported at the top of the file
