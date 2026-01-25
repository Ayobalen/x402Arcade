/**
 * Loop Animation Utilities
 *
 * Provides utilities for creating looping animations with various repeat modes.
 * Supports infinite loops, counted repeats, and different loop directions.
 *
 * @example
 * ```tsx
 * // Infinite pulse animation
 * <motion.div
 *   animate={createLoop({
 *     keyframes: { scale: [1, 1.1, 1] },
 *     duration: 2,
 *     repeat: Infinity,
 *   })}
 * />
 *
 * // Bounce back and forth
 * <motion.div
 *   animate={createLoop({
 *     keyframes: { x: [0, 100] },
 *     duration: 1,
 *     repeat: 5,
 *     repeatType: 'reverse',
 *   })}
 * />
 * ```
 */

import type { TargetAndTransition, Transition } from 'framer-motion';

/**
 * Loop repeat type
 * - 'loop': Restart from beginning each time
 * - 'reverse': Alternate between forward and reverse
 * - 'mirror': Reflect the animation (play backwards)
 */
export type LoopRepeatType = 'loop' | 'reverse' | 'mirror';

/**
 * Configuration options for loop animation
 */
export interface LoopOptions {
  /**
   * Animation keyframes or target values
   */
  keyframes: TargetAndTransition;

  /**
   * Animation duration in seconds
   * @default 1
   */
  duration?: number;

  /**
   * Number of times to repeat
   * - Use `Infinity` for infinite loop
   * - Use positive number for counted repeats
   * @default Infinity
   */
  repeat?: number;

  /**
   * Repeat behavior
   * - 'loop': Restart from beginning
   * - 'reverse': Alternate direction each repeat
   * - 'mirror': Play animation backwards on repeat
   * @default 'loop'
   */
  repeatType?: LoopRepeatType;

  /**
   * Delay between repeats (in seconds)
   * @default 0
   */
  repeatDelay?: number;

  /**
   * Easing function
   * @default 'easeInOut'
   */
  ease?: Transition['ease'];

  /**
   * Delay before loop starts (in seconds)
   * @default 0
   */
  delay?: number;
}

/**
 * Create a looping animation
 *
 * Generates animation properties for framer-motion that loop continuously or
 * for a specified number of repeats.
 *
 * @param options - Loop configuration options
 * @returns Animation properties for motion component
 *
 * @example
 * ```tsx
 * // Infinite pulse
 * <motion.div
 *   animate={createLoop({
 *     keyframes: { scale: [1, 1.1, 1] },
 *     duration: 2,
 *   })}
 * />
 *
 * // Bounce 3 times
 * <motion.div
 *   animate={createLoop({
 *     keyframes: { y: [0, -20, 0] },
 *     duration: 0.5,
 *     repeat: 3,
 *   })}
 * />
 * ```
 */
export function createLoop(options: LoopOptions): TargetAndTransition {
  const {
    keyframes,
    duration = 1,
    repeat = Infinity,
    repeatType = 'loop',
    repeatDelay = 0,
    ease = 'easeInOut',
    delay = 0,
  } = options;

  return {
    ...keyframes,
    transition: {
      duration,
      repeat,
      repeatType,
      repeatDelay,
      ease,
      delay,
    },
  };
}

/**
 * Preset: Subtle pulse animation
 *
 * Gentle scale pulse, good for "breathing" effects or drawing attention.
 */
export const LOOP_PRESETS = {
  /**
   * Subtle pulse (scale 1 → 1.05 → 1)
   * Best for: Buttons, notifications, "breathing" UI elements
   */
  pulse: createLoop({
    keyframes: { scale: [1, 1.05, 1] },
    duration: 2,
    ease: 'easeInOut',
  }),

  /**
   * Fast pulse (scale 1 → 1.1 → 1, 1s duration)
   * Best for: Active state indicators, loading spinners
   */
  pulseFast: createLoop({
    keyframes: { scale: [1, 1.1, 1] },
    duration: 1,
    ease: 'easeInOut',
  }),

  /**
   * Slow pulse (scale 1 → 1.03 → 1, 3s duration)
   * Best for: Background elements, ambient UI
   */
  pulseSlow: createLoop({
    keyframes: { scale: [1, 1.03, 1] },
    duration: 3,
    ease: 'easeInOut',
  }),

  /**
   * Bounce animation (y: 0 → -10 → 0)
   * Best for: Call-to-action arrows, scroll indicators
   */
  bounce: createLoop({
    keyframes: { y: [0, -10, 0] },
    duration: 1,
    ease: 'easeOut',
  }),

  /**
   * Float animation (y oscillation)
   * Best for: Floating elements, ghost-like movement
   */
  float: createLoop({
    keyframes: { y: [0, -15, 0] },
    duration: 3,
    ease: 'easeInOut',
  }),

  /**
   * Spin animation (360° rotation)
   * Best for: Loading indicators, decorative elements
   */
  spin: createLoop({
    keyframes: { rotate: 360 },
    duration: 2,
    ease: 'linear',
  }),

  /**
   * Slow spin (360° over 4s)
   * Best for: Background decorations, ambient elements
   */
  spinSlow: createLoop({
    keyframes: { rotate: 360 },
    duration: 4,
    ease: 'linear',
  }),

  /**
   * Wiggle animation (rotation oscillation)
   * Best for: Error indicators, "hey look at me" effects
   */
  wiggle: createLoop({
    keyframes: { rotate: [0, -5, 5, -5, 5, 0] },
    duration: 0.5,
    ease: 'easeInOut',
    repeat: 2,
  }),

  /**
   * Glow animation (opacity pulse for neon effects)
   * Best for: Neon borders, retro arcade glow effects
   */
  glow: createLoop({
    keyframes: { opacity: [0.7, 1, 0.7] },
    duration: 2,
    ease: 'easeInOut',
  }),

  /**
   * Blink animation (opacity on/off)
   * Best for: Cursor blink, notification dots
   */
  blink: createLoop({
    keyframes: { opacity: [1, 0, 1] },
    duration: 1.2,
    ease: 'steps(1)',
  }),

  /**
   * Shimmer animation (gradient shift effect)
   * Best for: Loading skeletons, premium badges
   */
  shimmer: createLoop({
    keyframes: { x: ['-100%', '100%'] },
    duration: 1.5,
    ease: 'linear',
  }),

  /**
   * Shake animation (horizontal oscillation for errors)
   * Best for: Form validation errors, alerts
   */
  shake: createLoop({
    keyframes: { x: [0, -10, 10, -10, 10, 0] },
    duration: 0.4,
    ease: 'easeInOut',
    repeat: 1,
  }),

  /**
   * Loading pulse (scale + opacity combined)
   * Best for: Loading states, processing indicators, data fetching
   */
  loadingPulse: createLoop({
    keyframes: { scale: [1, 1.05, 1], opacity: [1, 0.8, 1] },
    duration: 1.5,
    ease: 'easeInOut',
  }),
} as const;

/**
 * Type for loop preset keys
 */
export type LoopPreset = keyof typeof LOOP_PRESETS;

/**
 * Get a loop preset by name
 *
 * @param preset - Preset name
 * @returns Animation properties
 *
 * @example
 * ```tsx
 * <motion.div animate={getLoopPreset('pulse')} />
 * ```
 */
export function getLoopPreset(preset: LoopPreset): TargetAndTransition {
  return LOOP_PRESETS[preset];
}

/**
 * Create a custom loop from a preset with overrides
 *
 * @param preset - Base preset to use
 * @param overrides - Options to override from preset
 * @returns Animation properties
 *
 * @example
 * ```tsx
 * // Use pulse preset but slower
 * <motion.div
 *   animate={customLoop('pulse', { duration: 4 })}
 * />
 * ```
 */
export function customLoop(
  preset: LoopPreset,
  overrides: Partial<LoopOptions>
): TargetAndTransition {
  const basePreset = LOOP_PRESETS[preset];

  // Extract base options from preset transition
  const baseTransition = 'transition' in basePreset ? basePreset.transition : {};

  // Merge base keyframes with overrides
  const { keyframes: overrideKeyframes, ...transitionOverrides } = overrides;

  return createLoop({
    keyframes: overrideKeyframes || basePreset,
    duration: transitionOverrides.duration ?? baseTransition.duration,
    repeat: transitionOverrides.repeat ?? baseTransition.repeat,
    repeatType: transitionOverrides.repeatType ?? baseTransition.repeatType,
    repeatDelay: transitionOverrides.repeatDelay ?? baseTransition.repeatDelay,
    ease: transitionOverrides.ease ?? baseTransition.ease,
    delay: transitionOverrides.delay ?? baseTransition.delay,
  });
}
