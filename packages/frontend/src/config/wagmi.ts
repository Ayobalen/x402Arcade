/**
 * Wagmi Configuration
 *
 * Configures wagmi for wallet connection with Cronos Testnet support.
 * Provides MetaMask and WalletConnect as connection options.
 *
 * @module config/wagmi
 */

import { http, createConfig } from 'wagmi';
import { cronosTestnet } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

/**
 * WalletConnect Project ID
 *
 * Get your project ID from https://cloud.walletconnect.com
 * For development, using a demo project ID
 */
const WALLETCONNECT_PROJECT_ID =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id-x402arcade';

/**
 * Wagmi Configuration
 *
 * Configured for Cronos Testnet with MetaMask and WalletConnect support
 */
export const config = createConfig({
  chains: [cronosTestnet],
  connectors: [
    injected({
      target: 'metaMask',
    }),
    walletConnect({
      projectId: WALLETCONNECT_PROJECT_ID,
      showQrModal: true,
      metadata: {
        name: 'x402 Arcade',
        description: 'Play retro arcade games with USDC micropayments',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://x402arcade.com',
        icons: [typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : ''],
      },
    }),
  ],
  transports: {
    [cronosTestnet.id]: http(),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
