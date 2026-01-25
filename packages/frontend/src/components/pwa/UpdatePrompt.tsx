/**
 * UpdatePrompt Component
 *
 * Displays a notification when a new version of the app is available.
 * Provides options to update now or dismiss the notification.
 *
 * @module components/pwa/UpdatePrompt
 */

import { useCallback } from 'react';
import { clsx } from 'clsx';
import { RefreshCw, X } from 'lucide-react';

export interface UpdatePromptProps {
  /** Whether an update is available */
  show: boolean;
  /** Callback to update the app */
  onUpdate: () => void;
  /** Callback to dismiss the prompt */
  onDismiss: () => void;
  /** Custom className */
  className?: string;
}

/**
 * Update prompt notification component
 */
export function UpdatePrompt({ show, onUpdate, onDismiss, className }: UpdatePromptProps) {
  const handleUpdate = useCallback(() => {
    onUpdate();
  }, [onUpdate]);

  const handleDismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  if (!show) return null;

  return (
    <div
      className={clsx(
        // Base styles
        'fixed bottom-4 left-4 right-4 z-50',
        'md:left-auto md:right-4 md:max-w-sm',
        // Appearance
        'bg-bg-surface border border-border rounded-xl',
        'shadow-lg shadow-black/50',
        // Animation
        'animate-slide-in-up',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
              <RefreshCw className="w-5 h-5 text-primary" aria-hidden="true" />
            </div>

            {/* Content */}
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Update Available</h3>
              <p className="text-xs text-text-secondary mt-0.5">
                A new version of x402 Arcade is ready.
              </p>
            </div>
          </div>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={handleDismiss}
            className={clsx(
              'flex-shrink-0 p-1 rounded-md',
              'text-text-tertiary hover:text-text-primary',
              'hover:bg-surface-secondary',
              'transition-colors duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
            )}
            aria-label="Dismiss update notification"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={handleDismiss}
            className={clsx(
              'flex-1 px-3 py-2 text-sm font-medium rounded-lg',
              'text-text-secondary bg-surface-secondary',
              'hover:bg-surface-tertiary',
              'transition-colors duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
            )}
          >
            Later
          </button>
          <button
            type="button"
            onClick={handleUpdate}
            className={clsx(
              'flex-1 px-3 py-2 text-sm font-semibold rounded-lg',
              'text-bg-primary bg-primary',
              'hover:bg-primary-400',
              'transition-colors duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface',
              'flex items-center justify-center gap-2'
            )}
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Update Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default UpdatePrompt;
