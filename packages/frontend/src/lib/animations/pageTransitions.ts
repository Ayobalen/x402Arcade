/**
 * Page Transition Variants
 *
 * Provides animation variants for page/route transitions using framer-motion.
 * Use with AnimatePresence and motion components to create smooth page changes.
 *
 * @example
 * ```tsx
 * import { AnimatePresence } from 'framer-motion';
 * import { fadeTransition, slideTransition } from '@/lib/animations/pageTransitions';
 *
 * // Fade transition
 * <AnimatePresence mode="wait">
 *   <motion.div
 *     key={location.pathname}
 *     variants={fadeTransition}
 *     initial="initial"
 *     animate="animate"
 *     exit="exit"
 *   >
 *     {children}
 *   </motion.div>
 * </AnimatePresence>
 *
 * // Slide transition with direction
 * <AnimatePresence mode="wait">
 *   <motion.div
 *     key={location.pathname}
 *     variants={slideTransition('left')}
 *     initial="initial"
 *     animate="animate"
 *     exit="exit"
 *   >
 *     {children}
 *   </motion.div>
 * </AnimatePresence>
 * ```
 */

import type { Variants } from 'framer-motion';

/**
 * Direction for slide transitions
 */
export type SlideDirection = 'left' | 'right' | 'up' | 'down';

/**
 * Direction for scale transitions
 */
export type ScaleDirection = 'center' | 'top' | 'bottom' | 'left' | 'right';

/**
 * Page transition variant interface
 */
export interface PageTransitionVariants extends Variants {
  initial: Record<string, unknown>;
  animate: Record<string, unknown>;
  exit: Record<string, unknown>;
}

/**
 * Fade Transition
 *
 * Simple opacity fade in/out.
 * Best for: Simple page changes, modals, overlays
 *
 * Duration: 300ms (normal)
 * Easing: easeInOut
 */
export const fadeTransition: PageTransitionVariants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0.645, 0.045, 0.355, 1], // easeInOut
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: [0.645, 0.045, 0.355, 1], // easeInOut
    },
  },
};

/**
 * Fast Fade Transition
 *
 * Quick opacity fade (200ms).
 * Best for: Rapid page changes, loading states
 */
export const fadeFastTransition: PageTransitionVariants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: [0.215, 0.61, 0.355, 1], // easeOut
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: [0.55, 0.055, 0.675, 0.19], // easeIn
    },
  },
};

/**
 * Slide Transition
 *
 * Slide in from specified direction with fade.
 * Best for: Sequential pages, wizards, carousels
 *
 * @param direction - Direction to slide from ('left' | 'right' | 'up' | 'down')
 * @param distance - Distance to slide (default: 100px)
 * @returns Page transition variants
 *
 * @example
 * ```tsx
 * // Slide in from right (next page)
 * variants={slideTransition('right')}
 *
 * // Slide in from left (previous page)
 * variants={slideTransition('left')}
 *
 * // Slide in from bottom with custom distance
 * variants={slideTransition('down', 200)}
 * ```
 */
export function slideTransition(
  direction: SlideDirection = 'right',
  distance = 100
): PageTransitionVariants {
  // Calculate initial/exit positions based on direction
  const getOffset = (dir: SlideDirection, exitDirection = false) => {
    const multiplier = exitDirection ? -1 : 1;
    switch (dir) {
      case 'left':
        return { x: -distance * multiplier, y: 0 };
      case 'right':
        return { x: distance * multiplier, y: 0 };
      case 'up':
        return { x: 0, y: -distance * multiplier };
      case 'down':
        return { x: 0, y: distance * multiplier };
      default:
        return { x: distance * multiplier, y: 0 };
    }
  };

  const initialOffset = getOffset(direction);
  const exitOffset = getOffset(direction, true);

  return {
    initial: {
      ...initialOffset,
      opacity: 0,
    },
    animate: {
      x: 0,
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: [0.215, 0.61, 0.355, 1], // easeOut
      },
    },
    exit: {
      ...exitOffset,
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: [0.55, 0.055, 0.675, 0.19], // easeIn
      },
    },
  };
}

/**
 * Scale Transition
 *
 * Scale in/out with fade from specified origin.
 * Best for: Modal dialogs, popups, detail views
 *
 * @param origin - Scale origin point ('center' | 'top' | 'bottom' | 'left' | 'right')
 * @param scale - Initial/exit scale (default: 0.95)
 * @returns Page transition variants
 *
 * @example
 * ```tsx
 * // Scale from center
 * variants={scaleTransition('center')}
 *
 * // Scale from bottom (mobile sheet)
 * variants={scaleTransition('bottom', 0.9)}
 * ```
 */
export function scaleTransition(
  origin: ScaleDirection = 'center',
  scale = 0.95
): PageTransitionVariants {
  // Transform origin mapping
  const transformOrigin = {
    center: 'center center',
    top: 'center top',
    bottom: 'center bottom',
    left: 'left center',
    right: 'right center',
  }[origin];

  return {
    initial: {
      scale,
      opacity: 0,
      transformOrigin,
    },
    animate: {
      scale: 1,
      opacity: 1,
      transformOrigin,
      transition: {
        duration: 0.3,
        ease: [0.215, 0.61, 0.355, 1], // easeOut
      },
    },
    exit: {
      scale,
      opacity: 0,
      transformOrigin,
      transition: {
        duration: 0.2,
        ease: [0.55, 0.055, 0.675, 0.19], // easeIn
      },
    },
  };
}

/**
 * Slide and Scale Transition
 *
 * Combined slide and scale for dramatic effect.
 * Best for: Game screens, hero sections, featured content
 *
 * @param direction - Direction to slide from
 * @param distance - Distance to slide (default: 50px)
 * @param scale - Initial/exit scale (default: 0.9)
 * @returns Page transition variants
 */
export function slideScaleTransition(
  direction: SlideDirection = 'right',
  distance = 50,
  scale = 0.9
): PageTransitionVariants {
  const getOffset = (dir: SlideDirection, exitDirection = false) => {
    const multiplier = exitDirection ? -1 : 1;
    switch (dir) {
      case 'left':
        return { x: -distance * multiplier, y: 0 };
      case 'right':
        return { x: distance * multiplier, y: 0 };
      case 'up':
        return { x: 0, y: -distance * multiplier };
      case 'down':
        return { x: 0, y: distance * multiplier };
      default:
        return { x: distance * multiplier, y: 0 };
    }
  };

  const initialOffset = getOffset(direction);
  const exitOffset = getOffset(direction, true);

  return {
    initial: {
      ...initialOffset,
      scale,
      opacity: 0,
    },
    animate: {
      x: 0,
      y: 0,
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: [0.215, 0.61, 0.355, 1], // easeOut
      },
    },
    exit: {
      ...exitOffset,
      scale,
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: [0.55, 0.055, 0.675, 0.19], // easeIn
      },
    },
  };
}

/**
 * Blur Transition
 *
 * Fade with blur effect (Apple-style).
 * Best for: Premium feel, iOS-like transitions, backgrounds
 *
 * @param blurAmount - Blur amount in pixels (default: 10)
 * @returns Page transition variants
 */
export function blurTransition(blurAmount = 10): PageTransitionVariants {
  return {
    initial: {
      opacity: 0,
      filter: `blur(${blurAmount}px)`,
    },
    animate: {
      opacity: 1,
      filter: 'blur(0px)',
      transition: {
        duration: 0.4,
        ease: [0.215, 0.61, 0.355, 1], // easeOut
      },
    },
    exit: {
      opacity: 0,
      filter: `blur(${blurAmount}px)`,
      transition: {
        duration: 0.3,
        ease: [0.55, 0.055, 0.675, 0.19], // easeIn
      },
    },
  };
}

/**
 * Rotate Transition
 *
 * Rotate in/out with fade (3D effect).
 * Best for: Playful transitions, card flips, game screens
 *
 * @param axis - Rotation axis ('x' | 'y')
 * @param degrees - Rotation degrees (default: 90)
 * @returns Page transition variants
 */
export function rotateTransition(axis: 'x' | 'y' = 'y', degrees = 90): PageTransitionVariants {
  const rotateProperty = axis === 'x' ? 'rotateX' : 'rotateY';

  return {
    initial: {
      opacity: 0,
      [rotateProperty]: degrees,
    },
    animate: {
      opacity: 1,
      [rotateProperty]: 0,
      transition: {
        duration: 0.5,
        ease: [0.215, 0.61, 0.355, 1], // easeOut
      },
    },
    exit: {
      opacity: 0,
      [rotateProperty]: -degrees,
      transition: {
        duration: 0.4,
        ease: [0.55, 0.055, 0.675, 0.19], // easeIn
      },
    },
  };
}

/**
 * Zoom Transition
 *
 * Dramatic zoom in/out with fade.
 * Best for: Game start screens, level transitions, splash screens
 *
 * @param zoomScale - Initial/exit scale (default: 1.2)
 * @returns Page transition variants
 */
export function zoomTransition(zoomScale = 1.2): PageTransitionVariants {
  return {
    initial: {
      scale: zoomScale,
      opacity: 0,
    },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: [0.215, 0.61, 0.355, 1], // easeOut
      },
    },
    exit: {
      scale: zoomScale,
      opacity: 0,
      transition: {
        duration: 0.4,
        ease: [0.55, 0.055, 0.675, 0.19], // easeIn
      },
    },
  };
}

/**
 * Neon Glow Transition (Arcade Theme)
 *
 * Fade with glow effect for retro arcade aesthetic.
 * Best for: Game pages, arcade UI, neon-themed sections
 *
 * @returns Page transition variants
 */
export const neonGlowTransition: PageTransitionVariants = {
  initial: {
    opacity: 0,
    filter: 'brightness(0.5)',
  },
  animate: {
    opacity: 1,
    filter: 'brightness(1)',
    transition: {
      duration: 0.4,
      ease: [0.215, 0.61, 0.355, 1], // easeOut
    },
  },
  exit: {
    opacity: 0,
    filter: 'brightness(0.5)',
    transition: {
      duration: 0.3,
      ease: [0.55, 0.055, 0.675, 0.19], // easeIn
    },
  },
};

/**
 * Page Transition Presets
 *
 * Pre-configured page transitions for common use cases.
 */
export const PAGE_TRANSITION_PRESETS = {
  /** Fade - simple opacity transition */
  fade: fadeTransition,
  /** Fade Fast - quick opacity transition */
  fadeFast: fadeFastTransition,
  /** Slide Right - slide in from right, exit to left */
  slideRight: slideTransition('right'),
  /** Slide Left - slide in from left, exit to right */
  slideLeft: slideTransition('left'),
  /** Slide Up - slide in from top, exit to bottom */
  slideUp: slideTransition('up'),
  /** Slide Down - slide in from bottom, exit to top */
  slideDown: slideTransition('down'),
  /** Scale Center - scale from center */
  scaleCenter: scaleTransition('center'),
  /** Scale Bottom - scale from bottom (mobile sheet) */
  scaleBottom: scaleTransition('bottom', 0.9),
  /** Slide Scale - slide right with scale */
  slideScale: slideScaleTransition('right'),
  /** Blur - fade with blur effect */
  blur: blurTransition(),
  /** Rotate Y - 3D rotate on Y axis */
  rotateY: rotateTransition('y'),
  /** Zoom - dramatic zoom effect */
  zoom: zoomTransition(),
  /** Neon Glow - arcade-style glow effect */
  neonGlow: neonGlowTransition,
} as const;

/**
 * Get a page transition preset by name
 *
 * @param preset - Preset name
 * @returns Page transition variants
 */
export function getPageTransitionPreset(
  preset: keyof typeof PAGE_TRANSITION_PRESETS
): PageTransitionVariants {
  return PAGE_TRANSITION_PRESETS[preset];
}

/**
 * Type exports
 */
export type PageTransitionPreset = keyof typeof PAGE_TRANSITION_PRESETS;

/**
 * Page Transition Orchestration
 *
 * Utilities for coordinating parent-child animations during page transitions.
 * Allows page content to animate in sequence with stagger and delay effects.
 */

/**
 * Configuration options for page transition orchestration
 */
export interface PageOrchestrationOptions {
  /**
   * Delay before children start animating (in seconds)
   * @default 0
   */
  delayChildren?: number;

  /**
   * Delay between each child animation (in seconds)
   * @default 0.05
   */
  staggerChildren?: number;

  /**
   * When children should start animating relative to parent
   * - 'afterParent': Wait for parent animation to complete
   * - 'withParent': Animate alongside parent
   * - 'beforeParent': Start before parent (unusual, but possible)
   * @default 'afterParent'
   */
  when?: 'afterParent' | 'withParent' | 'beforeParent';
}

/**
 * Creates orchestrated page transition variants
 *
 * Wraps any page transition variant to add parent-child animation coordination.
 * Use this to create smooth, sequential animations for page content.
 *
 * @param baseTransition - Base page transition variants
 * @param options - Orchestration options
 * @returns Enhanced page transition variants with orchestration
 *
 * @example
 * ```tsx
 * // Orchestrate fade transition with staggered children
 * const orchestratedFade = createOrchestration(fadeTransition, {
 *   delayChildren: 0.2,
 *   staggerChildren: 0.1
 * });
 *
 * // Use in PageTransition component
 * <motion.div variants={orchestratedFade} initial="initial" animate="animate" exit="exit">
 *   <motion.h1 variants={childVariants}>Title</motion.h1>
 *   <motion.p variants={childVariants}>Content</motion.p>
 * </motion.div>
 * ```
 */
export function createOrchestration(
  baseTransition: PageTransitionVariants,
  options: PageOrchestrationOptions = {}
): PageTransitionVariants {
  const { delayChildren = 0, staggerChildren = 0.05, when = 'afterParent' } = options;

  // Calculate when to start children based on 'when' option
  const getChildDelay = () => {
    if (when === 'withParent') return delayChildren;
    if (when === 'beforeParent') return Math.max(0, delayChildren - 0.2);
    // 'afterParent' - add extra delay after parent animation
    return delayChildren;
  };

  // Build animate transition object conditionally
  const animateTransition: Record<string, unknown> = {
    ...(baseTransition.animate.transition as object),
    delayChildren: getChildDelay(),
    staggerChildren,
  };

  // Only add 'when' for afterParent
  if (when === 'afterParent') {
    animateTransition.when = 'beforeChildren';
  }

  return {
    initial: baseTransition.initial,
    animate: {
      ...baseTransition.animate,
      transition: animateTransition,
    },
    exit: {
      ...baseTransition.exit,
      transition: {
        ...(baseTransition.exit.transition as object),
        when: 'afterChildren', // Always wait for children to exit first
        staggerChildren: staggerChildren / 2, // Exit faster
      },
    },
  };
}

/**
 * Creates child variants for orchestrated page transitions
 *
 * Use these variants on child elements within an orchestrated page transition.
 * Children will automatically inherit timing from parent orchestration.
 *
 * @param type - Type of child animation
 * @returns Child animation variants
 *
 * @example
 * ```tsx
 * <motion.div variants={orchestratedPageTransition}>
 *   <motion.h1 variants={pageChildVariants('fade')}>Title</motion.h1>
 *   <motion.p variants={pageChildVariants('slideUp')}>Content</motion.p>
 * </motion.div>
 * ```
 */
export function pageChildVariants(
  type: 'fade' | 'slideUp' | 'slideDown' | 'scale' = 'fade'
): Variants {
  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: { duration: 0.4 } },
      exit: { opacity: 0, transition: { duration: 0.2 } },
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
      exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
    },
    slideDown: {
      initial: { opacity: 0, y: -20 },
      animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
      exit: { opacity: 0, y: 10, transition: { duration: 0.2 } },
    },
    scale: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
      exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
    },
  };

  return variants[type];
}

/**
 * Page Orchestration Presets
 *
 * Pre-configured orchestration settings for common page transition patterns.
 */
export const PAGE_ORCHESTRATION_PRESETS = {
  /**
   * Quick - Fast sequential reveal
   * Best for: Simple pages with few elements
   */
  quick: {
    delayChildren: 0.1,
    staggerChildren: 0.03,
    when: 'afterParent' as const,
  },

  /**
   * Normal - Balanced sequential reveal
   * Best for: Standard pages with moderate content
   */
  normal: {
    delayChildren: 0.2,
    staggerChildren: 0.05,
    when: 'afterParent' as const,
  },

  /**
   * Slow - Deliberate, cinematic reveal
   * Best for: Landing pages, hero sections
   */
  slow: {
    delayChildren: 0.3,
    staggerChildren: 0.1,
    when: 'afterParent' as const,
  },

  /**
   * Simultaneous - Children animate with parent
   * Best for: Simple transitions where everything moves together
   */
  simultaneous: {
    delayChildren: 0,
    staggerChildren: 0.02,
    when: 'withParent' as const,
  },

  /**
   * Dramatic - Long delays, noticeable stagger
   * Best for: Marketing pages, feature showcases
   */
  dramatic: {
    delayChildren: 0.5,
    staggerChildren: 0.15,
    when: 'afterParent' as const,
  },
} as const;

/**
 * Type for page orchestration preset keys
 */
export type PageOrchestrationPreset = keyof typeof PAGE_ORCHESTRATION_PRESETS;

/**
 * Get a page orchestration preset by name
 *
 * @param preset - Preset name
 * @returns Orchestration options
 */
export function getPageOrchestrationPreset(
  preset: PageOrchestrationPreset
): PageOrchestrationOptions {
  return PAGE_ORCHESTRATION_PRESETS[preset];
}

/**
 * Helper to create a fully orchestrated page transition from presets
 *
 * Combines a transition preset with an orchestration preset for quick setup.
 *
 * @param transitionPreset - Page transition preset
 * @param orchestrationPreset - Orchestration preset
 * @returns Orchestrated page transition variants
 *
 * @example
 * ```tsx
 * // Quick setup with presets
 * const transition = createOrchestrated('fade', 'normal');
 *
 * <motion.div variants={transition} initial="initial" animate="animate" exit="exit">
 *   <motion.h1 variants={pageChildVariants('fade')}>Title</motion.h1>
 * </motion.div>
 * ```
 */
export function createOrchestrated(
  transitionPreset: PageTransitionPreset,
  orchestrationPreset: PageOrchestrationPreset
): PageTransitionVariants {
  const baseTransition = PAGE_TRANSITION_PRESETS[transitionPreset];
  const orchestrationOptions = PAGE_ORCHESTRATION_PRESETS[orchestrationPreset];
  return createOrchestration(baseTransition, orchestrationOptions);
}

/**
 * LOADING AND ERROR TRANSITION STATES
 *
 * Special transition states for loading and error scenarios during page transitions.
 */

/**
 * Loading Transition State
 *
 * Creates a skeleton/loading animation variant for page content.
 * Use while content is being fetched or page is loading.
 *
 * Features:
 * - Skeleton shimmer effect
 * - Smooth transition from loading to loaded state
 * - No jarring jumps during load
 * - Optimized for perceived performance
 *
 * @example
 * ```tsx
 * <motion.div
 *   variants={loadingTransition}
 *   initial="loading"
 *   animate={isLoaded ? "loaded" : "loading"}
 * >
 *   {isLoaded ? <Content /> : <Skeleton />}
 * </motion.div>
 * ```
 */
export const loadingTransition: Variants = {
  /**
   * Loading state - subtle pulsing shimmer effect
   */
  loading: {
    opacity: 0.6,
    scale: 1,
    filter: 'brightness(0.9)',
    transition: {
      duration: 0.3,
      ease: [0.645, 0.045, 0.355, 1], // easeInOut
    },
  },

  /**
   * Loaded state - full visibility
   */
  loaded: {
    opacity: 1,
    scale: 1,
    filter: 'brightness(1)',
    transition: {
      duration: 0.4,
      ease: [0.215, 0.61, 0.355, 1], // easeOut
    },
  },
};

/**
 * Skeleton Animation Variant
 *
 * Pulsing shimmer effect for skeleton/placeholder content.
 * Use for loading states to indicate content is being fetched.
 *
 * @example
 * ```tsx
 * <motion.div
 *   variants={skeletonAnimation}
 *   animate="pulse"
 * >
 *   <div className="skeleton-content" />
 * </motion.div>
 * ```
 */
export const skeletonAnimation: Variants = {
  /**
   * Pulsing shimmer effect
   */
  pulse: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Error Transition State
 *
 * Attention-grabbing animation for error scenarios.
 * Includes shake effect to draw user attention to errors.
 *
 * Features:
 * - Shake animation for errors
 * - Smooth transition from loading to error
 * - Red glow effect (arcade theme)
 * - Icon entrance animation
 *
 * @example
 * ```tsx
 * <motion.div
 *   variants={errorTransition}
 *   initial="loading"
 *   animate={hasError ? "error" : "loaded"}
 * >
 *   {hasError ? <ErrorMessage /> : <Content />}
 * </motion.div>
 * ```
 */
export const errorTransition: Variants = {
  /**
   * Loading state (before error)
   */
  loading: {
    opacity: 0.6,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.3,
    },
  },

  /**
   * Error state - shake + red glow effect
   */
  error: {
    opacity: 1,
    x: [0, -10, 10, -10, 10, -5, 5, 0],
    scale: 1,
    filter: 'brightness(1.1)',
    transition: {
      duration: 0.5,
      ease: 'easeInOut',
      x: {
        type: 'spring',
        stiffness: 500,
        damping: 10,
      },
    },
  },

  /**
   * Loaded state (recovery from error)
   */
  loaded: {
    opacity: 1,
    x: 0,
    scale: 1,
    filter: 'brightness(1)',
    transition: {
      duration: 0.4,
      ease: [0.215, 0.61, 0.355, 1], // easeOut
    },
  },
};

/**
 * Error Icon Entrance Animation
 *
 * Dramatic entrance for error icons with scale and rotation.
 * Use for error indicators, warning symbols, etc.
 *
 * @example
 * ```tsx
 * <motion.div
 *   variants={errorIconEntrance}
 *   initial="hidden"
 *   animate="visible"
 * >
 *   <ErrorIcon />
 * </motion.div>
 * ```
 */
export const errorIconEntrance: Variants = {
  /**
   * Hidden state
   */
  hidden: {
    scale: 0,
    rotate: -180,
    opacity: 0,
  },

  /**
   * Visible state - pop in with rotation
   */
  visible: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20,
      duration: 0.5,
    },
  },
};

/**
 * Combined Loading-to-Error Transition
 *
 * Handles smooth transition from loading to error state.
 * Ensures no jarring jumps when an error occurs during loading.
 *
 * @example
 * ```tsx
 * <motion.div
 *   variants={loadingErrorTransition}
 *   initial="loading"
 *   animate={hasError ? "error" : (isLoaded ? "loaded" : "loading")}
 * >
 *   {hasError ? <Error /> : (isLoaded ? <Content /> : <Loading />)}
 * </motion.div>
 * ```
 */
export const loadingErrorTransition: Variants = {
  /**
   * Loading state
   */
  loading: {
    opacity: 0.6,
    scale: 1,
    x: 0,
    filter: 'brightness(0.9)',
    transition: {
      duration: 0.3,
    },
  },

  /**
   * Loaded state (successful)
   */
  loaded: {
    opacity: 1,
    scale: 1,
    x: 0,
    filter: 'brightness(1)',
    transition: {
      duration: 0.4,
      ease: [0.215, 0.61, 0.355, 1], // easeOut
    },
  },

  /**
   * Error state (failed during loading)
   */
  error: {
    opacity: 1,
    scale: 1,
    x: [0, -8, 8, -8, 8, -4, 4, 0],
    filter: 'brightness(1.1)',
    transition: {
      duration: 0.5,
      x: {
        type: 'spring',
        stiffness: 500,
        damping: 10,
      },
    },
  },
};

/**
 * Loading Indicator Animation
 *
 * Spinning/pulsing animation for loading indicators.
 * Use for spinners, progress indicators, etc.
 *
 * @example
 * ```tsx
 * <motion.div
 *   variants={loadingIndicator}
 *   animate="spinning"
 * >
 *   <Spinner />
 * </motion.div>
 * ```
 */
export const loadingIndicator: Variants = {
  /**
   * Spinning animation
   */
  spinning: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },

  /**
   * Pulsing animation (alternative to spinning)
   */
  pulsing: {
    scale: [1, 1.1, 1],
    opacity: [0.8, 1, 0.8],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};
