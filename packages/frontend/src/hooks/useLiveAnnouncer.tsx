/**
 * useLiveAnnouncer Hook
 *
 * Custom hook for managing ARIA live region announcements.
 * Provides a simple API for announcing messages to screen readers.
 *
 * @example
 * ```tsx
 * function GameScore() {
 *   const { announce, LiveRegionComponent } = useLiveAnnouncer();
 *
 *   const handleScoreChange = (newScore: number) => {
 *     announce(`Score: ${newScore}`, 'polite');
 *   };
 *
 *   return (
 *     <div>
 *       <div>Score: {score}</div>
 *       <LiveRegionComponent />
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { LiveRegion } from '@/components/ui/LiveRegion';
import type { AriaPoliteness } from '@/components/ui/LiveRegion';

/**
 * Options for announcements
 */
export interface AnnouncementOptions {
  /**
   * Politeness level for the announcement
   * @default 'polite'
   */
  politeness?: AriaPoliteness;

  /**
   * Automatically clear announcement after delay (ms)
   * If not specified, announcement persists until next announcement
   */
  clearAfter?: number;

  /**
   * Whether to announce if the message is the same as the last
   * @default false
   */
  allowDuplicate?: boolean;
}

/**
 * Return value from useLiveAnnouncer hook
 */
export interface UseLiveAnnouncerReturn {
  /**
   * Announce a message to screen readers
   * @param message - The message to announce
   * @param options - Announcement options
   */
  announce: (message: string, options?: AnnouncementOptions | AriaPoliteness) => void;

  /**
   * Clear the current announcement
   */
  clear: () => void;

  /**
   * The current announcement message
   */
  message: string;

  /**
   * The current politeness level
   */
  politeness: AriaPoliteness;

  /**
   * LiveRegion component to render in your UI
   * This must be included somewhere in your component tree
   */
  LiveRegionComponent: React.ComponentType;
}

/**
 * Custom hook for managing live region announcements
 *
 * @returns Announcement API and LiveRegion component
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { announce, LiveRegionComponent } = useLiveAnnouncer();
 *
 * // Announce score changes
 * announce(`Score: ${score}`);
 *
 * // Announce urgent alerts
 * announce('Game Over!', 'assertive');
 *
 * // Auto-clear after delay
 * announce('High score!', { politeness: 'assertive', clearAfter: 3000 });
 * ```
 */
export function useLiveAnnouncer(): UseLiveAnnouncerReturn {
  const [message, setMessage] = useState<string>('');
  const [politeness, setPoliteness] = useState<AriaPoliteness>('polite');
  const lastMessage = useRef<string>('');
  const clearTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Clear any pending auto-clear timeout
   */
  const clearPendingTimeout = useCallback(() => {
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
      clearTimeoutRef.current = null;
    }
  }, []);

  /**
   * Clear the current announcement
   */
  const clear = useCallback(() => {
    clearPendingTimeout();
    setMessage('');
    lastMessage.current = '';
  }, [clearPendingTimeout]);

  /**
   * Announce a message to screen readers
   */
  const announce = useCallback(
    (msg: string, options?: AnnouncementOptions | AriaPoliteness) => {
      // Clear any pending auto-clear
      clearPendingTimeout();

      // Parse options
      let opts: AnnouncementOptions = {};
      if (typeof options === 'string') {
        opts = { politeness: options };
      } else if (options) {
        opts = options;
      }

      const { politeness: newPoliteness = 'polite', clearAfter, allowDuplicate = false } = opts;

      // Check for duplicate message
      if (!allowDuplicate && msg === lastMessage.current) {
        return;
      }

      // Update state
      setMessage(msg);
      setPoliteness(newPoliteness);
      lastMessage.current = msg;

      // Set up auto-clear if specified
      if (clearAfter && clearAfter > 0) {
        clearTimeoutRef.current = setTimeout(() => {
          setMessage('');
          lastMessage.current = '';
        }, clearAfter);
      }
    },
    [clearPendingTimeout]
  );

  /**
   * Cleanup timeout on unmount
   */
  useEffect(() => {
    return () => {
      clearPendingTimeout();
    };
  }, [clearPendingTimeout]);

  /**
   * LiveRegion component to render
   */
  const LiveRegionComponent = useCallback(() => {
    return <LiveRegion message={message} politeness={politeness} />;
  }, [message, politeness]);

  return {
    announce,
    clear,
    message,
    politeness,
    LiveRegionComponent,
  };
}
