/**
 * useReducedMotion Hook
 *
 * Detects user's motion preferences for accessibility.
 * Wraps framer-motion's useReducedMotion with additional logic.
 *
 * @example
 * ```tsx
 * const shouldReduceMotion = useReducedMotion();
 * const variants = shouldReduceMotion ? staticVariants : animatedVariants;
 * ```
 */

import { useReducedMotion as useFramerReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

/**
 * Hook to detect if user prefers reduced motion
 *
 * Returns true if:
 * - User has prefers-reduced-motion enabled in system settings
 * - During SSR (to prevent hydration mismatches)
 *
 * @returns {boolean} True if motion should be reduced
 */
export function useReducedMotion(): boolean {
  // Use framer-motion's built-in hook as the foundation
  const prefersReducedMotion = useFramerReducedMotion();

  // SSR-safe state to prevent hydration mismatches
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // During SSR, assume reduced motion to prevent flash of animated content
  if (!isClient) {
    return true;
  }

  // On client, return user's actual preference
  return prefersReducedMotion ?? false;
}

/**
 * Hook to get animation configuration based on motion preference
 *
 * Returns an object with common animation settings that respect
 * the user's motion preferences.
 *
 * @returns {object} Animation configuration
 */
export function useMotionConfig() {
  const shouldReduceMotion = useReducedMotion();

  return {
    /**
     * Whether motion should be reduced
     */
    shouldReduceMotion,

    /**
     * Duration multiplier (0 if reduced, 1 if normal)
     */
    durationMultiplier: shouldReduceMotion ? 0 : 1,

    /**
     * Whether animations should be enabled
     */
    animationsEnabled: !shouldReduceMotion,

    /**
     * Initial animation state (for entry animations)
     */
    initial: shouldReduceMotion ? false : undefined,
  };
}

export default useReducedMotion;
