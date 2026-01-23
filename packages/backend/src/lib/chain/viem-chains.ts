/**
 * Viem Chain Definitions
 *
 * This file contains custom chain definitions for use with viem.
 * These definitions are used for wallet connections, transaction signing,
 * and interacting with the Cronos blockchain.
 *
 * @module lib/chain/viem-chains
 */

import { defineChain } from 'viem';
import {
  CRONOS_TESTNET_CHAIN_ID,
  DEFAULT_CRONOS_TESTNET_RPC_URL,
  CRONOS_TESTNET_EXPLORER_URL,
  NATIVE_CURRENCY,
} from './constants.js';

/**
 * Cronos Testnet Chain Definition
 *
 * A complete viem-compatible chain definition for Cronos Testnet (Chain ID: 338).
 * This chain definition includes all required fields for wallet integration
 * and transaction submission.
 *
 * **Network Details:**
 * - Chain ID: 338
 * - Network Name: Cronos Testnet
 * - Native Currency: TCRO (Test CRO)
 * - Block Explorer: https://explorer.cronos.org/testnet
 *
 * **RPC Endpoints:**
 * - Primary: https://evm-t3.cronos.org/
 * - WebSocket: wss://evm-t3.cronos.org/ws
 *
 * **Usage:**
 * ```typescript
 * import { createPublicClient, http } from 'viem';
 * import { cronosTestnet } from './lib/chain/viem-chains';
 *
 * const client = createPublicClient({
 *   chain: cronosTestnet,
 *   transport: http(),
 * });
 * ```
 *
 * @see https://docs.cronos.org/cronos-zkevm/for-developers/dev-tools-and-integrations/chain-integration
 */
export const cronosTestnet = /*#__PURE__*/ defineChain({
  /**
   * Chain ID for Cronos Testnet
   * Used for network identification and EIP-155 transaction signing
   */
  id: CRONOS_TESTNET_CHAIN_ID,

  /**
   * Human-readable network name
   * Displayed in wallet interfaces and network selectors
   */
  name: 'Cronos Testnet',

  /**
   * Network type indicator
   * Set to 'testnet' to indicate this is a test network
   */
  network: 'cronos-testnet',

  /**
   * Native currency configuration
   * TCRO (Test CRO) is used for gas fees on testnet
   */
  nativeCurrency: {
    decimals: NATIVE_CURRENCY.decimals,
    name: NATIVE_CURRENCY.name,
    symbol: NATIVE_CURRENCY.symbol,
  },

  /**
   * RPC endpoint configuration
   * Includes both HTTP and WebSocket endpoints
   */
  rpcUrls: {
    /**
     * Default public RPC endpoints
     * Used when no custom RPC is specified
     */
    default: {
      http: [DEFAULT_CRONOS_TESTNET_RPC_URL],
      webSocket: ['wss://evm-t3.cronos.org/ws'],
    },
    /**
     * Public RPC endpoints (same as default for testnet)
     * Some viem utilities require this to be defined
     */
    public: {
      http: [DEFAULT_CRONOS_TESTNET_RPC_URL],
      webSocket: ['wss://evm-t3.cronos.org/ws'],
    },
  },

  /**
   * Block explorer configuration
   * Used for generating transaction and address links
   */
  blockExplorers: {
    default: {
      name: 'Cronos Explorer',
      url: CRONOS_TESTNET_EXPLORER_URL,
      apiUrl: 'https://explorer-api.cronos.org/testnet/api',
    },
    cronosScan: {
      name: 'CronosScan',
      url: 'https://testnet.cronoscan.com',
      apiUrl: 'https://api-testnet.cronoscan.com/api',
    },
  },

  /**
   * Common contract addresses deployed on Cronos Testnet
   * Multicall3 enables batching multiple contract calls
   */
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 0,
    },
  },

  /**
   * Testnet indicator
   * When true, wallets may display warnings about test network
   */
  testnet: true,
});

/**
 * Type export for Cronos Testnet chain
 * Useful for type-safe chain references in viem utilities
 */
export type CronosTestnetChain = typeof cronosTestnet;

/**
 * Export chain ID constant for convenience
 * Can be used for chain ID checks without importing the full chain
 */
export const CRONOS_TESTNET_VIEM_ID = cronosTestnet.id;

/**
 * Get RPC URL from the chain definition
 * Useful when you need just the URL without the full chain object
 *
 * @returns Primary HTTP RPC URL for Cronos Testnet
 */
export function getCronosTestnetRpcUrlFromChain(): string {
  return cronosTestnet.rpcUrls.default.http[0];
}

/**
 * Get WebSocket RPC URL from the chain definition
 * Useful for setting up subscription-based connections
 *
 * @returns WebSocket RPC URL for Cronos Testnet, or undefined if not available
 */
export function getCronosTestnetWsUrlFromChain(): string | undefined {
  return cronosTestnet.rpcUrls.default.webSocket?.[0];
}

/**
 * Get block explorer URL from the chain definition
 *
 * @returns Block explorer base URL for Cronos Testnet
 */
export function getCronosTestnetExplorerFromChain(): string {
  return cronosTestnet.blockExplorers.default.url;
}

export default cronosTestnet;
