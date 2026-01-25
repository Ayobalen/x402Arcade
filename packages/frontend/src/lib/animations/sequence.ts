/**
 * Sequence Animation Utilities
 *
 * Provides utilities for creating sequential animations with multiple steps.
 * Allows chaining animations with callbacks between steps.
 *
 * @example
 * ```tsx
 * // Create a multi-step animation sequence
 * const controls = useAnimation();
 *
 * const playSequence = async () => {
 *   await sequence(controls, [
 *     { to: { opacity: 1 }, duration: 0.3 },
 *     { to: { scale: 1.2 }, duration: 0.2, onComplete: () => console.log('Scaled up!') },
 *     { to: { scale: 1 }, duration: 0.2 },
 *     { to: { rotate: 360 }, duration: 0.5 },
 *   ]);
 * };
 * ```
 */

import type { AnimationControls, TargetAndTransition, Transition } from 'framer-motion';

/**
 * Animation step definition
 */
export interface AnimationStep {
  /**
   * Target animation properties
   */
  to: TargetAndTransition;

  /**
   * Animation duration in seconds
   * @default 0.3
   */
  duration?: number;

  /**
   * Delay before this step starts (in seconds)
   * @default 0
   */
  delay?: number;

  /**
   * Easing function
   * @default 'easeOut'
   */
  ease?: Transition['ease'];

  /**
   * Callback to execute when this step completes
   */
  onComplete?: () => void | Promise<void>;

  /**
   * Callback to execute before this step starts
   */
  onStart?: () => void | Promise<void>;
}

/**
 * Options for sequence animation
 */
export interface SequenceOptions {
  /**
   * Whether to wait for each step to complete before starting next
   * @default true
   */
  waitForCompletion?: boolean;

  /**
   * Global delay before sequence starts (in seconds)
   * @default 0
   */
  initialDelay?: number;

  /**
   * Callback when entire sequence completes
   */
  onComplete?: () => void | Promise<void>;

  /**
   * Callback when sequence starts
   */
  onStart?: () => void | Promise<void>;

  /**
   * Whether to catch and log errors instead of throwing
   * @default false
   */
  suppressErrors?: boolean;
}

/**
 * Execute a sequence of animations on AnimationControls
 *
 * Runs multiple animation steps in order, with optional callbacks between steps.
 * Each step waits for the previous to complete before starting.
 *
 * @param controls - Framer Motion animation controls
 * @param steps - Array of animation steps to execute
 * @param options - Sequence options
 * @returns Promise that resolves when sequence completes
 *
 * @example
 * ```tsx
 * const controls = useAnimation();
 *
 * // Simple 3-step sequence
 * await sequence(controls, [
 *   { to: { opacity: 1 }, duration: 0.3 },
 *   { to: { scale: 1.1 }, duration: 0.2 },
 *   { to: { scale: 1 }, duration: 0.2 },
 * ]);
 *
 * // With callbacks
 * await sequence(controls, [
 *   {
 *     to: { x: 100 },
 *     duration: 0.5,
 *     onComplete: () => console.log('Moved right!'),
 *   },
 *   {
 *     to: { x: 0 },
 *     duration: 0.5,
 *     onComplete: () => console.log('Moved back!'),
 *   },
 * ]);
 * ```
 */
export async function sequence(
  controls: AnimationControls,
  steps: AnimationStep[],
  options: SequenceOptions = {}
): Promise<void> {
  const {
    waitForCompletion = true,
    initialDelay = 0,
    onComplete,
    onStart,
    suppressErrors = false,
  } = options;

  try {
    // Execute onStart callback
    if (onStart) {
      await onStart();
    }

    // Initial delay
    if (initialDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, initialDelay * 1000));
    }

    // Execute each step in sequence
    for (const step of steps) {
      const {
        to,
        duration = 0.3,
        delay = 0,
        ease = 'easeOut',
        onComplete: stepComplete,
        onStart: stepStart,
      } = step;

      // Execute step onStart callback
      if (stepStart) {
        await stepStart();
      }

      // Step delay
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay * 1000));
      }

      // Execute animation
      const animationPromise = controls.start({
        ...to,
        transition: {
          duration,
          ease,
        },
      });

      // Wait for completion if configured
      if (waitForCompletion) {
        await animationPromise;
      }

      // Execute step onComplete callback
      if (stepComplete) {
        await stepComplete();
      }
    }

    // Execute final onComplete callback
    if (onComplete) {
      await onComplete();
    }
  } catch (error) {
    if (suppressErrors) {
      // Suppress error logging in production - error is caught and sequence continues
      // eslint-disable-next-line no-console
      console.error('Error in animation sequence:', error);
    } else {
      throw error;
    }
  }
}

/**
 * Create a reusable sequence function for specific controls
 *
 * Useful when you want to define sequences that can be called multiple times.
 *
 * @param controls - Animation controls
 * @returns Function that executes a sequence on those controls
 *
 * @example
 * ```tsx
 * const controls = useAnimation();
 * const runSequence = createSequence(controls);
 *
 * // Use the sequence multiple times
 * await runSequence([
 *   { to: { opacity: 1 }, duration: 0.3 },
 *   { to: { scale: 1.1 }, duration: 0.2 },
 * ]);
 * ```
 */
export function createSequence(controls: AnimationControls) {
  return (steps: AnimationStep[], options?: SequenceOptions) => {
    return sequence(controls, steps, options);
  };
}

/**
 * Common animation sequences
 */
export const SEQUENCE_PRESETS = {
  /**
   * Pulse animation (scale up and down)
   */
  pulse: [
    { to: { scale: 1.05 }, duration: 0.15 },
    { to: { scale: 1 }, duration: 0.15 },
  ] as AnimationStep[],

  /**
   * Bounce animation (scale with overshoot)
   */
  bounce: [
    { to: { scale: 1.2 }, duration: 0.2, ease: 'easeOut' },
    { to: { scale: 0.9 }, duration: 0.15, ease: 'easeIn' },
    { to: { scale: 1 }, duration: 0.15, ease: 'easeOut' },
  ] as AnimationStep[],

  /**
   * Shake animation (horizontal movement)
   */
  shake: [
    { to: { x: -10 }, duration: 0.1 },
    { to: { x: 10 }, duration: 0.1 },
    { to: { x: -10 }, duration: 0.1 },
    { to: { x: 10 }, duration: 0.1 },
    { to: { x: 0 }, duration: 0.1 },
  ] as AnimationStep[],

  /**
   * Fade in with scale
   */
  fadeInScale: [
    { to: { opacity: 0, scale: 0.9 }, duration: 0 },
    { to: { opacity: 1, scale: 1 }, duration: 0.3, ease: 'easeOut' },
  ] as AnimationStep[],

  /**
   * Fade out with scale
   */
  fadeOutScale: [
    { to: { opacity: 0, scale: 0.9 }, duration: 0.2, ease: 'easeIn' },
  ] as AnimationStep[],

  /**
   * Glow effect (neon arcade style)
   */
  glow: [
    { to: { filter: 'brightness(1.2) drop-shadow(0 0 8px currentColor)' }, duration: 0.2 },
    { to: { filter: 'brightness(1) drop-shadow(0 0 4px currentColor)' }, duration: 0.2 },
  ] as AnimationStep[],

  /**
   * Slide in from left
   */
  slideInLeft: [
    { to: { x: -50, opacity: 0 }, duration: 0 },
    { to: { x: 0, opacity: 1 }, duration: 0.3, ease: 'easeOut' },
  ] as AnimationStep[],

  /**
   * Slide in from right
   */
  slideInRight: [
    { to: { x: 50, opacity: 0 }, duration: 0 },
    { to: { x: 0, opacity: 1 }, duration: 0.3, ease: 'easeOut' },
  ] as AnimationStep[],

  /**
   * Slide in from top
   */
  slideInTop: [
    { to: { y: -50, opacity: 0 }, duration: 0 },
    { to: { y: 0, opacity: 1 }, duration: 0.3, ease: 'easeOut' },
  ] as AnimationStep[],

  /**
   * Slide in from bottom
   */
  slideInBottom: [
    { to: { y: 50, opacity: 0 }, duration: 0 },
    { to: { y: 0, opacity: 1 }, duration: 0.3, ease: 'easeOut' },
  ] as AnimationStep[],

  /**
   * Rotate in
   */
  rotateIn: [
    { to: { rotate: -180, opacity: 0, scale: 0.8 }, duration: 0 },
    { to: { rotate: 0, opacity: 1, scale: 1 }, duration: 0.5, ease: 'easeOut' },
  ] as AnimationStep[],

  /**
   * Success celebration (scale + glow)
   */
  success: [
    { to: { scale: 1.2 }, duration: 0.2, ease: 'easeOut' },
    { to: { scale: 1, filter: 'brightness(1.3) drop-shadow(0 0 12px #00ff00)' }, duration: 0.2 },
    { to: { filter: 'brightness(1) drop-shadow(0 0 4px #00ff00)' }, duration: 0.3 },
  ] as AnimationStep[],

  /**
   * Error shake (red glow + shake)
   */
  error: [
    { to: { x: -10, filter: 'brightness(1.2) drop-shadow(0 0 8px #ff0000)' }, duration: 0.1 },
    { to: { x: 10 }, duration: 0.1 },
    { to: { x: -10 }, duration: 0.1 },
    { to: { x: 0, filter: 'brightness(1) drop-shadow(0 0 0px transparent)' }, duration: 0.1 },
  ] as AnimationStep[],

  /**
   * Loading pulse (continuous scale)
   */
  loading: [
    { to: { scale: 1.1, opacity: 0.7 }, duration: 0.5, ease: 'easeInOut' },
    { to: { scale: 1, opacity: 1 }, duration: 0.5, ease: 'easeInOut' },
  ] as AnimationStep[],
} as const;

/**
 * Type for sequence preset keys
 */
export type SequencePreset = keyof typeof SEQUENCE_PRESETS;

/**
 * Get a sequence preset by name
 *
 * @param preset - Preset name
 * @returns Array of animation steps
 */
export function getSequencePreset(preset: SequencePreset): AnimationStep[] {
  return SEQUENCE_PRESETS[preset];
}

/**
 * Execute a preset sequence
 *
 * @param controls - Animation controls
 * @param preset - Preset name
 * @param options - Sequence options
 * @returns Promise that resolves when sequence completes
 *
 * @example
 * ```tsx
 * const controls = useAnimation();
 * await sequencePreset(controls, 'pulse');
 * ```
 */
export function sequencePreset(
  controls: AnimationControls,
  preset: SequencePreset,
  options?: SequenceOptions
): Promise<void> {
  return sequence(controls, getSequencePreset(preset), options);
}
