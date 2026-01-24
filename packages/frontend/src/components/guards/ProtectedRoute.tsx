import { type ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useWalletStore } from '@/stores/walletStore';

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
  redirectTo = '/',
  showLoading = true,
}: ProtectedRouteProps) {
  const location = useLocation();
  const { isConnected, isConnecting } = useWalletStore();
  const [hasChecked, setHasChecked] = useState(false);

  // Wait a brief moment to check connection status
  // This prevents flash of redirect on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasChecked(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

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

  // If not connected after check, redirect to specified page
  // Preserve the current location so we can redirect back after connection
  if (!isConnected && hasChecked) {
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{
          from: location.pathname,
          message: 'Please connect your wallet to access this page',
        }}
      />
    );
  }

  // Wallet is connected, render protected content
  return <>{children}</>;
}
