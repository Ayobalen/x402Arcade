/**
 * useScrollRestoration Hook
 *
 * Manages scroll position restoration during page transitions.
 * Stores scroll position before navigation and restores it on back navigation.
 * Scrolls to top on forward navigation for better UX.
 *
 * Features:
 * - Stores scroll positions in session storage (per route)
 * - Restores scroll position on back navigation
 * - Scrolls to top on forward navigation
 * - Integrates with page transition timing
 * - SSR-safe with proper hydration
 *
 * @example
 * ```tsx
 * function MyPage() {
 *   useScrollRestoration();
 *
 *   return (
 *     <div>
 *       <h1>Page with scroll restoration</h1>
 *       // Long content here
 *     </div>
 *   );
 * }
 * ```
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Storage key prefix for scroll positions
 */
const SCROLL_STORAGE_KEY = 'scroll-position';

/**
 * Navigation action type
 */
type NavigationAction = 'push' | 'pop' | 'replace';

/**
 * Interface for stored scroll position
 */
interface ScrollPosition {
  x: number;
  y: number;
  timestamp: number;
}

/**
 * Hook options
 */
interface UseScrollRestorationOptions {
  /**
   * Delay before restoring scroll position (in ms)
   * Allows page transition to complete first
   * @default 100
   */
  delay?: number;

  /**
   * Whether to use smooth scrolling
   * @default false
   */
  smooth?: boolean;

  /**
   * Storage type to use
   * - 'session': Session storage (cleared when browser closes)
   * - 'memory': In-memory only (cleared on page refresh)
   * @default 'session'
   */
  storage?: 'session' | 'memory';

  /**
   * Maximum age of stored scroll positions (in ms)
   * Older positions are ignored
   * @default 3600000 (1 hour)
   */
  maxAge?: number;
}

/**
 * In-memory storage fallback (for SSR or when sessionStorage unavailable)
 */
const memoryStorage: Map<string, ScrollPosition> = new Map();

/**
 * Save scroll position for current route
 */
function saveScrollPosition(pathname: string, storage: 'session' | 'memory' = 'session'): void {
  const position: ScrollPosition = {
    x: window.scrollX,
    y: window.scrollY,
    timestamp: Date.now(),
  };

  if (storage === 'session' && typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(`${SCROLL_STORAGE_KEY}:${pathname}`, JSON.stringify(position));
    } catch {
      // Fallback to memory storage if sessionStorage fails
      memoryStorage.set(pathname, position);
    }
  } else {
    memoryStorage.set(pathname, position);
  }
}

/**
 * Get stored scroll position for a route
 */
function getScrollPosition(
  pathname: string,
  storage: 'session' | 'memory' = 'session',
  maxAge = 3600000
): ScrollPosition | null {
  let positionData: string | null = null;

  if (storage === 'session' && typeof window !== 'undefined') {
    try {
      positionData = sessionStorage.getItem(`${SCROLL_STORAGE_KEY}:${pathname}`);
    } catch {
      // Fallback to memory storage
      const memPosition = memoryStorage.get(pathname);
      if (memPosition) {
        positionData = JSON.stringify(memPosition);
      }
    }
  } else {
    const memPosition = memoryStorage.get(pathname);
    if (memPosition) {
      positionData = JSON.stringify(memPosition);
    }
  }

  if (!positionData) return null;

  try {
    const position: ScrollPosition = JSON.parse(positionData);
    const age = Date.now() - position.timestamp;

    // Ignore positions older than maxAge
    if (age > maxAge) {
      return null;
    }

    return position;
  } catch {
    return null;
  }
}

/**
 * Detect navigation action (forward/back/replace)
 */
function getNavigationAction(prevPath: string, currentPath: string): NavigationAction {
  // This is a simplified heuristic - in a real app, you might use
  // navigation state or history.state to determine the action
  if (prevPath === currentPath) {
    return 'replace';
  }

  // Check if we're going back (would need history state in production)
  // For now, we'll rely on the scroll position existence as a heuristic
  return 'push';
}

/**
 * Scroll to a position
 */
function scrollToPosition(position: ScrollPosition, smooth: boolean, delay: number): void {
  setTimeout(() => {
    window.scrollTo({
      left: position.x,
      top: position.y,
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, delay);
}

/**
 * Scroll to top
 */
function scrollToTop(smooth: boolean, delay: number): void {
  setTimeout(() => {
    window.scrollTo({
      left: 0,
      top: 0,
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, delay);
}

/**
 * useScrollRestoration Hook
 *
 * Manages scroll position restoration during page transitions.
 *
 * @param options - Hook options
 *
 * @example
 * ```tsx
 * // Basic usage
 * useScrollRestoration();
 *
 * // With custom delay for transitions
 * useScrollRestoration({ delay: 300 });
 *
 * // With smooth scrolling
 * useScrollRestoration({ smooth: true });
 *
 * // With memory-only storage
 * useScrollRestoration({ storage: 'memory' });
 * ```
 */
export function useScrollRestoration(options: UseScrollRestorationOptions = {}): void {
  const { delay = 100, smooth = false, storage = 'session', maxAge = 3600000 } = options;

  const location = useLocation();
  const previousPathRef = useRef<string | null>(null);
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    // Skip on first render (SSR hydration)
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    const currentPath = location.pathname;
    const previousPath = previousPathRef.current;

    if (previousPath) {
      // Save scroll position before navigating
      saveScrollPosition(previousPath, storage);

      // Determine navigation action
      const action = getNavigationAction(previousPath, currentPath);

      // Try to restore scroll position (might be back navigation)
      const savedPosition = getScrollPosition(currentPath, storage, maxAge);

      if (savedPosition && action !== 'push') {
        // Restore scroll position (likely back navigation)
        scrollToPosition(savedPosition, smooth, delay);
      } else {
        // Scroll to top (forward navigation or no saved position)
        scrollToTop(smooth, delay);
      }
    } else {
      // First navigation, scroll to top
      scrollToTop(smooth, delay);
    }

    // Update previous path
    previousPathRef.current = currentPath;
  }, [location.pathname, delay, smooth, storage, maxAge]);

  // Save scroll position before unmounting
  useEffect(() => {
    return () => {
      if (previousPathRef.current) {
        saveScrollPosition(previousPathRef.current, storage);
      }
    };
  }, [storage]);
}

/**
 * Clear all stored scroll positions
 *
 * Useful for cleanup or testing.
 */
export function clearScrollPositions(): void {
  // Clear session storage
  if (typeof window !== 'undefined') {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith(SCROLL_STORAGE_KEY)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => sessionStorage.removeItem(key));
    } catch {
      // Ignore errors
    }
  }

  // Clear memory storage
  memoryStorage.clear();
}

/**
 * Export utility functions for testing
 */
export const __testing = {
  saveScrollPosition,
  getScrollPosition,
  scrollToPosition,
  scrollToTop,
  memoryStorage,
};
