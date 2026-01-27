/**
 * Wagmi Configuration
 *
 * Configures Wagmi for wallet connection and blockchain interactions.
 * Uses WalletConnect v2 for multi-wallet support.
 *
 * @module config/wagmi
 */

import { http, createConfig, createStorage, cookieStorage } from 'wagmi';
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
 *
 * Features:
 * - Automatic reconnection on page load
 * - Persistent connection state in localStorage
 * - EIP-6963 multi-injected provider discovery
 */
export const config = createConfig({
  chains: [cronosTestnetCustom],
  connectors: [
    // Injected wallets with target specification for better detection
    injected({
      target() {
        return {
          id: 'injected',
          name: 'Browser Wallet',
          provider: typeof window !== 'undefined' ? window.ethereum : undefined,
        };
      },
    }),

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
  multiInjectedProviderDiscovery: true, // Enable EIP-6963 for wallet detection
  ssr: false, // Disable SSR for client-side only app
  storage: createStorage({
    storage: typeof window !== 'undefined' ? window.localStorage : cookieStorage,
  }),
});

/**
 * Export chain configuration for use in other modules
 */
export { cronosTestnetCustom as cronosTestnet };
