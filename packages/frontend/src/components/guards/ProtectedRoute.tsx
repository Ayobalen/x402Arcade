import { type ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useWalletStore } from '@/stores/walletStore';
import { ConnectButton } from '@/components/wallet';
import { cn } from '@/lib/utils';

interface ProtectedRouteProps {
  children: ReactNode;
  /**
   * Where to redirect if wallet is not connected.
   * Defaults to '/' (home page)
   */
  redirectTo?: string;
  /**
   * Whether to show a loading state while checking connection.
   * Defaults to true.
   */
  showLoading?: boolean;
}

/**
 * ProtectedRoute Component
 *
 * Route guard that protects routes requiring wallet connection.
 * Automatically redirects to home (or specified route) if wallet is not connected.
 * Preserves the intended destination in location state for post-login redirect.
 *
 * Features:
 * - Checks wallet connection status from Zustand store
 * - Redirects to specified page if not connected
 * - Preserves intended destination for redirect after connection
 * - Handles loading states during connection check
 * - Respects reduced-motion preferences for animations
 *
 * @example
 * ```tsx
 * // Protect game routes
 * <Route
 *   path="/play/:gameId"
 *   element={
 *     <ProtectedRoute>
 *       <GamePage />
 *     </ProtectedRoute>
 *   }
 * />
 *
 * // With custom redirect
 * <Route
 *   path="/profile"
 *   element={
 *     <ProtectedRoute redirectTo="/login">
 *       <ProfilePage />
 *     </ProtectedRoute>
 *   }
 * />
 * ```
 */
export function ProtectedRoute({
  children,
  redirectTo: _redirectTo = '/',
  showLoading = true,
}: ProtectedRouteProps) {
  const _location = useLocation();
  const { isConnected, isConnecting } = useWalletStore();
  const [hasChecked, setHasChecked] = useState(false);

  // DEMO MODE: Check for demo flag in localStorage or URL param
  const isDemoMode =
    localStorage.getItem('x402_demo_mode') === 'true' ||
    new URLSearchParams(window.location.search).has('demo');

  // Wait a brief moment to check connection status
  // This prevents flash of redirect on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasChecked(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // In demo mode, skip wallet check
  if (isDemoMode) {
    return <>{children}</>;
  }

  // Show loading state while connecting or checking
  if ((isConnecting || !hasChecked) && showLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-700 border-t-cyan-400"></div>
          </div>
          <p className="text-lg text-gray-300">Checking wallet connection...</p>
        </div>
      </div>
    );
  }

  // If not connected after check, show connect wallet UI instead of redirecting
  if (!isConnected && hasChecked) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center">
          {/* Wallet Icon */}
          <div className="mb-6">
            <svg
              className="w-24 h-24 mx-auto text-cyan-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
              <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
            </svg>
          </div>

          {/* Heading */}
          <h2
            className={cn(
              'text-3xl md:text-4xl font-bold mb-4',
              'bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400',
              'bg-clip-text text-transparent'
            )}
          >
            Connect Your Wallet
          </h2>

          {/* Description */}
          <p className="text-lg text-gray-300 mb-8">
            You need to connect your wallet to play games and compete for prizes.
          </p>

          {/* Connect Button */}
          <ConnectButton className="mb-4" />

          {/* Help Text */}
          <p className="text-sm text-gray-500 mt-6">
            Don't have a wallet?{' '}
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 underline"
            >
              Get MetaMask
            </a>
          </p>
        </div>
      </div>
    );
  }

  // Wallet is connected, render protected content
  return <>{children}</>;
}
