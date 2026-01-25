/**
 * LiveRegion Component
 *
 * ARIA live region for screen reader announcements.
 * Provides accessible feedback for dynamic content changes.
 *
 * @example
 * // Score updates during gameplay
 * <LiveRegion message={`Score: ${score}`} politeness="polite" />
 *
 * // Critical alerts
 * <LiveRegion message="Game Over!" politeness="assertive" role="alert" />
 *
 * // High score achievement
 * <LiveRegion message="New high score!" politeness="assertive" />
 */

import { forwardRef, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { LiveRegionProps } from './LiveRegion.types';

/**
 * LiveRegion Component
 *
 * Accessible component for announcing dynamic content changes to screen readers.
 * Uses ARIA live regions to provide real-time updates without disrupting user flow.
 *
 * Features:
 * - Configurable politeness levels (polite/assertive)
 * - Automatic role selection based on politeness
 * - Visually hidden but accessible to screen readers
 * - Atomic announcements for complete message delivery
 */
export const LiveRegion = forwardRef<HTMLDivElement, LiveRegionProps>(
  (
    {
      message,
      politeness = 'polite',
      relevant = 'additions text',
      atomic = false,
      isActive = true,
      className,
      role,
      ...props
    },
    ref
  ) => {
    // Store previous message to detect changes
    const previousMessage = useRef<typeof message>(message);

    // Automatically select role based on politeness if not specified
    const computedRole = role || (politeness === 'assertive' ? 'alert' : 'status');

    // Log announcements in development for debugging
    useEffect(() => {
      if (
        process.env.NODE_ENV === 'development' &&
        message &&
        message !== previousMessage.current
      ) {
        // eslint-disable-next-line no-console
        console.log(`[LiveRegion] ${politeness}:`, message);
      }
      previousMessage.current = message;
    }, [message, politeness]);

    // Don't render if inactive or no message
    if (!isActive) {
      return null;
    }

    return (
      <div
        ref={ref}
        role={computedRole}
        aria-live={politeness}
        aria-relevant={relevant}
        aria-atomic={atomic}
        className={cn(
          // Screen reader only - visually hidden but accessible
          'sr-only',
          className
        )}
        {...props}
      >
        {message}
      </div>
    );
  }
);

LiveRegion.displayName = 'LiveRegion';

export default LiveRegion;
