/**
 * Wallet Provider
 *
 * Wraps the application with wagmi's WagmiProvider and QueryClientProvider
 * to enable wallet connection functionality throughout the app.
 *
 * @module providers/WalletProvider
 */

import { type ReactNode } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '../config/wagmi';

/**
 * Query client for React Query
 * Used by wagmi for caching and state management
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export interface WalletProviderProps {
  children: ReactNode;
}

/**
 * WalletProvider Component
 *
 * Provides wallet connection context to the entire application.
 * Must wrap your app at the root level.
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <WalletProvider>
 *       <YourApp />
 *     </WalletProvider>
 *   )
 * }
 * ```
 */
export function WalletProvider({ children }: WalletProviderProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
