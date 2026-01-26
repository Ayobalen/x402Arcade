/**
 * Wagmi Configuration
 *
 * Configures Wagmi for wallet connection and blockchain interactions.
 * Uses WalletConnect v2 for multi-wallet support.
 *
 * @module config/wagmi
 */

import { http, createConfig } from 'wagmi';
import { cronosTestnet } from 'wagmi/chains';
import { walletConnect, injected } from 'wagmi/connectors';
import { getChainId, getRpcUrl } from './chain';

/**
 * WalletConnect Project ID
 *
 * Get from https://cloud.walletconnect.com/
 * Environment variable: VITE_WALLETCONNECT_PROJECT_ID
 */
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

/**
 * Custom Cronos Testnet chain configuration
 * Uses environment variables for flexibility
 */
const cronosTestnetCustom = {
  ...cronosTestnet,
  id: getChainId(),
  rpcUrls: {
    default: { http: [getRpcUrl()] },
    public: { http: [getRpcUrl()] },
  },
};

/**
 * Wagmi configuration
 *
 * Supports:
 * - MetaMask (injected)
 * - WalletConnect (mobile wallets)
 * - Coinbase Wallet
 * - Any injected wallet
 */
export const config = createConfig({
  chains: [cronosTestnetCustom],
  connectors: [
    // Injected wallets (MetaMask, etc.)
    injected(),

    // WalletConnect for mobile wallets
    walletConnect({
      projectId,
      metadata: {
        name: 'x402 Arcade',
        description: 'Gasless arcade gaming on Cronos blockchain',
        url: 'https://x402arcade.com',
        icons: ['https://x402arcade.com/icon.png'],
      },
      showQrModal: true,
    }),
  ],
  transports: {
    [cronosTestnetCustom.id]: http(getRpcUrl()),
  },
});

/**
 * Export chain configuration for use in other modules
 */
export { cronosTestnetCustom as cronosTestnet };
