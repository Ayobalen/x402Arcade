/**
 * OfflinePage Component
 *
 * Displayed when the app is offline and the user tries to access
 * a page that requires network connectivity.
 *
 * Features:
 * - Arcade-themed offline message
 * - List of available cached content
 * - Retry button
 * - Auto-reload when connection is restored
 *
 * @module pages/Offline
 */

import { useEffect, useCallback } from 'react';
import { WifiOff, RefreshCw, Gamepad2, Trophy, Wallet } from 'lucide-react';
import { clsx } from 'clsx';

/**
 * Props for the OfflinePage component
 */
export interface OfflinePageProps {
  /** Optional callback when retry is clicked */
  onRetry?: () => void;
  /** Optional callback when connection is restored */
  onOnline?: () => void;
  /** Optional custom className */
  className?: string;
}

/**
 * Cached content item
 */
interface CachedItem {
  icon: typeof WifiOff;
  label: string;
}

const cachedItems: CachedItem[] = [
  { icon: Trophy, label: 'Previous leaderboard data' },
  { icon: Gamepad2, label: 'Game rules and instructions' },
  { icon: Wallet, label: 'Your wallet information' },
];

/**
 * Full-page offline state component
 */
export function OfflinePage({ onRetry, onOnline, className }: OfflinePageProps) {
  // Handle retry click
  const handleRetry = useCallback(() => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  }, [onRetry]);

  // Listen for online event
  useEffect(() => {
    const handleOnline = () => {
      onOnline?.();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [onOnline]);

  return (
    <div
      className={clsx(
        'min-h-screen flex flex-col items-center justify-center',
        'bg-gradient-to-b from-bg-primary to-bg-secondary',
        'px-6 py-12 text-center',
        'relative overflow-hidden',
        className
      )}
      role="main"
      aria-labelledby="offline-title"
    >
      {/* Background grid */}
      <div
        className={clsx(
          'absolute inset-0',
          'bg-[linear-gradient(rgba(45,45,74,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(45,45,74,0.3)_1px,transparent_1px)]',
          'bg-[size:40px_40px]',
          'opacity-30 pointer-events-none'
        )}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 max-w-md w-full">
        {/* Animated icon */}
        <div
          className={clsx('w-28 h-28 mx-auto mb-8', 'relative flex items-center justify-center')}
        >
          {/* Pulse effect */}
          <div
            className={clsx('absolute inset-0 rounded-full', 'bg-warning/20', 'animate-pulse')}
            aria-hidden="true"
          />
          {/* Icon */}
          <WifiOff className="w-14 h-14 text-warning relative z-10" aria-hidden="true" />
        </div>

        {/* Title */}
        <h1
          id="offline-title"
          className={clsx(
            'font-display text-3xl font-bold uppercase tracking-wider',
            'text-warning mb-4',
            'text-shadow-warning'
          )}
        >
          You're Offline
        </h1>

        {/* Description */}
        <p className="text-lg text-text-secondary mb-8 leading-relaxed">
          It looks like you've lost your connection. Don't worry — some features are still available
          offline.
        </p>

        {/* Cached content section */}
        <div
          className={clsx('bg-surface-primary border border-surface-border', 'rounded-xl p-6 mb-8')}
        >
          <h2
            className={clsx(
              'text-sm font-semibold uppercase tracking-wider',
              'text-text-muted mb-4'
            )}
          >
            Available Offline
          </h2>

          <ul className="space-y-3" role="list">
            {cachedItems.map((item, index) => (
              <li key={index} className="flex items-center gap-3 text-text-secondary">
                <span
                  className={clsx(
                    'w-8 h-8 rounded-full flex items-center justify-center',
                    'bg-success/20 flex-shrink-0'
                  )}
                >
                  <item.icon className="w-4 h-4 text-success" aria-hidden="true" />
                </span>
                <span className="text-sm">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Retry button */}
        <button
          type="button"
          onClick={handleRetry}
          className={clsx(
            'inline-flex items-center justify-center gap-2',
            'px-8 py-3 rounded-lg',
            'bg-gradient-to-r from-primary to-secondary',
            'text-bg-primary font-display font-semibold uppercase tracking-wider',
            'shadow-glow-cyan',
            'transition-all duration-200',
            'hover:shadow-glow-cyan-strong hover:-translate-y-0.5',
            'active:translate-y-0',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary'
          )}
        >
          <RefreshCw className="w-5 h-5" aria-hidden="true" />
          Try Again
        </button>

        {/* Footer note */}
        <p className="mt-8 text-sm text-text-muted">
          Playing games and submitting scores requires an internet connection.
        </p>
      </div>
    </div>
  );
}

export default OfflinePage;
