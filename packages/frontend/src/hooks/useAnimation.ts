/**
 * useAnimation Hook
 *
 * Provides animation controls and helper functions for common animation patterns.
 * Built on framer-motion's animation system.
 *
 * @example
 * ```tsx
 * const controls = useAnimation();
 *
 * // Start an animation
 * await controls.start({ opacity: 1, scale: 1 });
 *
 * // Use helper for pulse animation
 * controls.pulse();
 * ```
 */

import { useAnimationControls, type AnimationControls } from 'framer-motion';
import { useCallback } from 'react';
import { easings } from '@/styles/tokens/animations';
import { useReducedMotion } from './useReducedMotion';

/**
 * Extended animation controls with helper methods
 */
export interface ExtendedAnimationControls extends AnimationControls {
  /**
   * Pulse animation - subtle scale up and down
   */
  pulse: () => Promise<void>;

  /**
   * Shake animation - horizontal shake for errors
   */
  shake: () => Promise<void>;

  /**
   * Bounce animation - playful bounce effect
   */
  bounce: () => Promise<void>;

  /**
   * Fade in animation
   */
  fadeIn: (duration?: number) => Promise<void>;

  /**
   * Fade out animation
   */
  fadeOut: (duration?: number) => Promise<void>;

  /**
   * Scale in animation
   */
  scaleIn: (duration?: number) => Promise<void>;

  /**
   * Scale out animation
   */
  scaleOut: (duration?: number) => Promise<void>;

  /**
   * Glow effect - for neon/arcade aesthetic
   */
  glow: () => Promise<void>;
}

/**
 * Hook for animation controls with helper functions
 *
 * Provides framer-motion animation controls plus common animation helpers.
 * Automatically respects user's reduced motion preferences.
 *
 * @returns {ExtendedAnimationControls} Animation controls with helpers
 */
export function useAnimation(): ExtendedAnimationControls {
  const controls = useAnimationControls();
  const shouldReduceMotion = useReducedMotion();

  // Helper: Pulse animation
  const pulse = useCallback(async () => {
    if (shouldReduceMotion) return;

    await controls.start({
      scale: [1, 1.05, 1],
      transition: {
        duration: 0.6,
        ease: easings.easeInOut,
        times: [0, 0.5, 1],
      },
    });
  }, [controls, shouldReduceMotion]);

  // Helper: Shake animation
  const shake = useCallback(async () => {
    if (shouldReduceMotion) return;

    await controls.start({
      x: [0, -10, 10, -10, 10, 0],
      transition: {
        duration: 0.4,
        ease: easings.easeInOut,
      },
    });
  }, [controls, shouldReduceMotion]);

  // Helper: Bounce animation
  const bounce = useCallback(async () => {
    if (shouldReduceMotion) return;

    await controls.start({
      y: [0, -20, 0],
      transition: {
        duration: 0.5,
        ease: easings.bounceOut,
        times: [0, 0.4, 1],
      },
    });
  }, [controls, shouldReduceMotion]);

  // Helper: Fade in
  const fadeIn = useCallback(
    async (duration = 0.3) => {
      if (shouldReduceMotion) {
        await controls.start({ opacity: 1 });
        return;
      }

      await controls.start({
        opacity: 1,
        transition: {
          duration,
          ease: easings.easeOut,
        },
      });
    },
    [controls, shouldReduceMotion]
  );

  // Helper: Fade out
  const fadeOut = useCallback(
    async (duration = 0.3) => {
      if (shouldReduceMotion) {
        await controls.start({ opacity: 0 });
        return;
      }

      await controls.start({
        opacity: 0,
        transition: {
          duration,
          ease: easings.easeIn,
        },
      });
    },
    [controls, shouldReduceMotion]
  );

  // Helper: Scale in
  const scaleIn = useCallback(
    async (duration = 0.3) => {
      if (shouldReduceMotion) {
        await controls.start({ scale: 1, opacity: 1 });
        return;
      }

      await controls.start({
        scale: 1,
        opacity: 1,
        transition: {
          duration,
          ease: easings.backOut,
        },
      });
    },
    [controls, shouldReduceMotion]
  );

  // Helper: Scale out
  const scaleOut = useCallback(
    async (duration = 0.3) => {
      if (shouldReduceMotion) {
        await controls.start({ scale: 0.8, opacity: 0 });
        return;
      }

      await controls.start({
        scale: 0.8,
        opacity: 0,
        transition: {
          duration,
          ease: easings.easeIn,
        },
      });
    },
    [controls, shouldReduceMotion]
  );

  // Helper: Glow effect (for retro arcade aesthetic)
  const glow = useCallback(async () => {
    if (shouldReduceMotion) return;

    await controls.start({
      filter: [
        'drop-shadow(0 0 2px rgba(0, 255, 255, 0.5))',
        'drop-shadow(0 0 8px rgba(0, 255, 255, 0.8))',
        'drop-shadow(0 0 2px rgba(0, 255, 255, 0.5))',
      ],
      transition: {
        duration: 1.5,
        ease: easings.easeInOut,
        times: [0, 0.5, 1],
        repeat: Infinity,
      },
    });
  }, [controls, shouldReduceMotion]);

  // Extend the controls object with helper methods
  return Object.assign(controls, {
    pulse,
    shake,
    bounce,
    fadeIn,
    fadeOut,
    scaleIn,
    scaleOut,
    glow,
  });
}

export default useAnimation;
