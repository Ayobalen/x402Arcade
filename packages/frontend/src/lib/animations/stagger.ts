/**
 * Stagger Animation Utilities
 *
 * Provides utilities for creating staggered animations on lists and groups of elements.
 * Commonly used for list items, grid items, and sequential reveals.
 *
 * @example
 * ```tsx
 * // Basic stagger animation
 * <motion.ul variants={staggerContainer()}>
 *   {items.map((item) => (
 *     <motion.li key={item.id} variants={staggerChild()}>
 *       {item.name}
 *     </motion.li>
 *   ))}
 * </motion.ul>
 *
 * // Custom delay and direction
 * <motion.div variants={staggerContainer({ delayChildren: 0.1, staggerChildren: 0.05 })}>
 *   <motion.div variants={staggerChild({ direction: 'reverse' })} />
 * </motion.div>
 * ```
 */

import type { Variant, Variants } from 'framer-motion';

/**
 * Configuration options for stagger container
 */
export interface StaggerContainerOptions {
  /**
   * Delay before first child animates (in seconds)
   * @default 0
   */
  delayChildren?: number;

  /**
   * Delay between each child animation (in seconds)
   * @default 0.05
   */
  staggerChildren?: number;

  /**
   * Animation direction
   * - 'forward': Animate children in order (0, 1, 2...)
   * - 'reverse': Animate children in reverse order (...2, 1, 0)
   * @default 'forward'
   */
  direction?: 'forward' | 'reverse';

  /**
   * Custom duration for container animation (in seconds)
   * @default 0
   */
  duration?: number;
}

/**
 * Configuration options for stagger children
 */
export interface StaggerChildOptions {
  /**
   * Animation direction for exit animations
   * @default 'forward'
   */
  direction?: 'forward' | 'reverse';

  /**
   * Custom duration for child animation (in seconds)
   * @default 0.3
   */
  duration?: number;

  /**
   * Initial opacity
   * @default 0
   */
  initialOpacity?: number;

  /**
   * Initial y position (in pixels)
   * @default 20
   */
  initialY?: number;

  /**
   * Initial scale
   * @default 1
   */
  initialScale?: number;
}

/**
 * Creates framer-motion variants for a stagger container
 *
 * The container manages the timing of when children animate.
 * Use with `motion.div` or other motion components as the parent.
 *
 * @param options - Configuration options
 * @returns Framer Motion variants for the container
 *
 * @example
 * ```tsx
 * <motion.ul
 *   variants={staggerContainer({ staggerChildren: 0.1 })}
 *   initial="hidden"
 *   animate="visible"
 * >
 *   {items.map((item) => (
 *     <motion.li key={item.id} variants={staggerChild()}>
 *       {item.name}
 *     </motion.li>
 *   ))}
 * </motion.ul>
 * ```
 */
export function staggerContainer(options: StaggerContainerOptions = {}): Variants {
  const {
    delayChildren = 0,
    staggerChildren = 0.05,
    direction = 'forward',
    duration = 0,
  } = options;

  return {
    hidden: {
      transition: {
        duration,
      },
    },
    visible: {
      transition: {
        delayChildren,
        staggerChildren,
        staggerDirection: direction === 'reverse' ? -1 : 1,
        duration,
      },
    },
    exit: {
      transition: {
        staggerChildren: staggerChildren / 2, // Exit faster
        staggerDirection: direction === 'reverse' ? 1 : -1, // Reverse exit direction
        duration,
      },
    },
  };
}

/**
 * Creates framer-motion variants for stagger children
 *
 * Children use these variants to animate in sequence controlled by the parent container.
 * Provides smooth fade-in with vertical slide animation.
 *
 * @param options - Configuration options
 * @returns Framer Motion variants for child elements
 *
 * @example
 * ```tsx
 * <motion.div variants={staggerChild()}>
 *   Content that fades in and slides up
 * </motion.div>
 *
 * // Custom animation
 * <motion.div variants={staggerChild({
 *   initialY: 50,
 *   initialOpacity: 0,
 *   duration: 0.5
 * })}>
 *   Content with custom animation
 * </motion.div>
 * ```
 */
export function staggerChild(options: StaggerChildOptions = {}): Variants {
  const {
    direction = 'forward',
    duration = 0.3,
    initialOpacity = 0,
    initialY = 20,
    initialScale = 1,
  } = options;

  const hiddenVariant: Variant = {
    opacity: initialOpacity,
    y: initialY,
    scale: initialScale,
  };

  const visibleVariant: Variant = {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration,
      ease: 'easeOut',
    },
  };

  const exitVariant: Variant = {
    opacity: initialOpacity,
    y: direction === 'reverse' ? -initialY : initialY,
    scale: initialScale * 0.95,
    transition: {
      duration: duration / 2,
      ease: 'easeIn',
    },
  };

  return {
    hidden: hiddenVariant,
    visible: visibleVariant,
    exit: exitVariant,
  };
}

/**
 * Preset: Quick stagger for lists
 *
 * Fast stagger animation with minimal delay between items.
 * Good for small lists and UI elements.
 */
export const STAGGER_PRESETS = {
  /**
   * Quick stagger (0.03s delay)
   * Best for: Small lists (5-10 items), UI elements
   */
  quick: {
    container: staggerContainer({ staggerChildren: 0.03, delayChildren: 0 }),
    child: staggerChild({ duration: 0.2, initialY: 10 }),
  },

  /**
   * Normal stagger (0.05s delay)
   * Best for: Medium lists (10-20 items), cards, grid items
   */
  normal: {
    container: staggerContainer({ staggerChildren: 0.05, delayChildren: 0.1 }),
    child: staggerChild({ duration: 0.3, initialY: 20 }),
  },

  /**
   * Slow stagger (0.1s delay)
   * Best for: Large hero sections, featured content
   */
  slow: {
    container: staggerContainer({ staggerChildren: 0.1, delayChildren: 0.2 }),
    child: staggerChild({ duration: 0.5, initialY: 30 }),
  },

  /**
   * Fade only (no movement)
   * Best for: Text content, subtle reveals
   */
  fade: {
    container: staggerContainer({ staggerChildren: 0.05, delayChildren: 0 }),
    child: staggerChild({ duration: 0.4, initialY: 0, initialOpacity: 0 }),
  },

  /**
   * Scale + fade
   * Best for: Grid items, cards, images
   */
  scale: {
    container: staggerContainer({ staggerChildren: 0.05, delayChildren: 0.1 }),
    child: staggerChild({ duration: 0.4, initialY: 0, initialScale: 0.9, initialOpacity: 0 }),
  },

  /**
   * Dramatic entrance (large movement)
   * Best for: Hero sections, feature showcases
   */
  dramatic: {
    container: staggerContainer({ staggerChildren: 0.1, delayChildren: 0.3 }),
    child: staggerChild({ duration: 0.6, initialY: 50, initialScale: 0.95 }),
  },
} as const;

/**
 * Type for stagger preset keys
 */
export type StaggerPreset = keyof typeof STAGGER_PRESETS;

/**
 * Get a stagger preset by name
 *
 * @param preset - Preset name
 * @returns Container and child variants
 */
export function getStaggerPreset(preset: StaggerPreset) {
  return STAGGER_PRESETS[preset];
}
