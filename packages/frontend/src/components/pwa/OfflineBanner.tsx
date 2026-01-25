/**
 * OfflineBanner Component
 *
 * Displays a banner when the app is offline.
 * Informs users that they may have limited functionality.
 *
 * @module components/pwa/OfflineBanner
 */

import { clsx } from 'clsx';
import { WifiOff, X } from 'lucide-react';
import { useState, useCallback } from 'react';

export interface OfflineBannerProps {
  /** Whether the app is offline */
  isOffline: boolean;
  /** Custom className */
  className?: string;
  /** Whether the banner can be dismissed */
  dismissible?: boolean;
}

/**
 * Offline status banner component
 */
export function OfflineBanner({ isOffline, className, dismissible = true }: OfflineBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
  }, []);

  // Show again when coming back online and then going offline
  if (!isOffline && isDismissed) {
    setIsDismissed(false);
    return null;
  }

  if (!isOffline || isDismissed) return null;

  return (
    <div
      className={clsx(
        // Base styles
        'fixed top-0 left-0 right-0 z-50',
        // Appearance
        'bg-warning/10 border-b border-warning/30',
        // Animation
        'animate-slide-in-down',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-2 gap-4">
          {/* Icon and message */}
          <div className="flex items-center gap-3">
            <WifiOff className="w-4 h-4 text-warning flex-shrink-0" aria-hidden="true" />
            <p className="text-sm text-warning">
              <span className="font-medium">You&apos;re offline.</span>
              <span className="hidden sm:inline ml-1">
                Some features may be limited until you reconnect.
              </span>
            </p>
          </div>

          {/* Dismiss button */}
          {dismissible && (
            <button
              type="button"
              onClick={handleDismiss}
              className={clsx(
                'flex-shrink-0 p-1 rounded-md',
                'text-warning/70 hover:text-warning',
                'hover:bg-warning/10',
                'transition-colors duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-warning'
              )}
              aria-label="Dismiss offline notification"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default OfflineBanner;
