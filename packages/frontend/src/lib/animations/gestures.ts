/**
 * Gesture Animation Utilities
 *
 * Provides presets and utilities for gesture-based animations like hover, tap, focus, and drag.
 * These work with framer-motion's gesture props (whileHover, whileTap, etc.)
 *
 * @example
 * ```tsx
 * import { HOVER_PRESETS, TAP_PRESETS } from '@/lib/animations/gestures';
 *
 * // Button with lift effect on hover and scale on tap
 * <motion.button
 *   whileHover={HOVER_PRESETS.lift}
 *   whileTap={TAP_PRESETS.shrink}
 * >
 *   Click Me
 * </motion.button>
 *
 * // Draggable element with constraints
 * <motion.div
 *   drag
 *   dragConstraints={DRAG_CONSTRAINTS.tight}
 *   dragElastic={0.2}
 * >
 *   Drag me
 * </motion.div>
 * ```
 */

import type { TargetAndTransition } from 'framer-motion';

/**
 * Hover animation presets
 *
 * Use with `whileHover` prop on motion components.
 * Provides smooth feedback when user hovers over interactive elements.
 */
export const HOVER_PRESETS = {
  /**
   * Lift effect (scale up slightly + move up)
   * Best for: Buttons, cards, clickable items
   */
  lift: {
    scale: 1.05,
    y: -2,
    transition: { duration: 0.2, ease: 'easeOut' },
  } as TargetAndTransition,

  /**
   * Scale up only
   * Best for: Icons, images, thumbnails
   */
  scale: {
    scale: 1.1,
    transition: { duration: 0.2, ease: 'easeOut' },
  } as TargetAndTransition,

  /**
   * Subtle scale (minimal feedback)
   * Best for: Large cards, containers
   */
  scaleSubtle: {
    scale: 1.02,
    transition: { duration: 0.2, ease: 'easeOut' },
  } as TargetAndTransition,

  /**
   * Glow effect (increase brightness/opacity)
   * Best for: Neon elements, arcade UI, buttons with glow
   */
  glow: {
    filter: 'brightness(1.2)',
    transition: { duration: 0.2, ease: 'easeOut' },
  } as TargetAndTransition,

  /**
   * Brighten + scale
   * Best for: Premium buttons, call-to-action elements
   */
  glowScale: {
    scale: 1.05,
    filter: 'brightness(1.2)',
    transition: { duration: 0.2, ease: 'easeOut' },
  } as TargetAndTransition,

  /**
   * Float up effect
   * Best for: Cards, panels, elevated surfaces
   */
  float: {
    y: -4,
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
    transition: { duration: 0.2, ease: 'easeOut' },
  } as TargetAndTransition,

  /**
   * Rotate slightly
   * Best for: Playful elements, icons, badges
   */
  rotate: {
    rotate: 5,
    transition: { duration: 0.2, ease: 'easeOut' },
  } as TargetAndTransition,

  /**
   * Pulse (subtle scale animation)
   * Best for: Notification badges, status indicators
   */
  pulse: {
    scale: [1, 1.05, 1],
    transition: { duration: 0.6, ease: 'easeInOut' },
  } as TargetAndTransition,

  /**
   * Tilt effect (3D perspective rotate)
   * Best for: Cards, panels, modern UI elements
   */
  tilt: {
    rotateY: 5,
    rotateX: 2,
    transition: { duration: 0.2, ease: 'easeOut' },
  } as TargetAndTransition,
} as const;

/**
 * Tap/Press animation presets
 *
 * Use with `whileTap` prop on motion components.
 * Provides immediate tactile feedback when user clicks/taps.
 */
export const TAP_PRESETS = {
  /**
   * Shrink effect (scale down)
   * Best for: Buttons, interactive elements
   */
  shrink: {
    scale: 0.95,
    transition: { duration: 0.1, ease: 'easeOut' },
  } as TargetAndTransition,

  /**
   * Shrink + push down
   * Best for: 3D-style buttons, physical UI elements
   */
  press: {
    scale: 0.97,
    y: 1,
    transition: { duration: 0.1, ease: 'easeOut' },
  } as TargetAndTransition,

  /**
   * Grow effect (scale up on tap)
   * Best for: Toggle buttons, switches, playful elements
   */
  grow: {
    scale: 1.05,
    transition: { duration: 0.1, ease: 'easeOut' },
  } as TargetAndTransition,

  /**
   * Bounce effect
   * Best for: Playful interactions, game UI
   */
  bounce: {
    scale: [1, 0.9, 1.05, 1],
    transition: { duration: 0.4, ease: 'easeOut' },
  } as TargetAndTransition,

  /**
   * Flash effect (quick opacity change)
   * Best for: Feedback indicators, selection confirmation
   */
  flash: {
    opacity: 0.7,
    transition: { duration: 0.1 },
  } as TargetAndTransition,

  /**
   * No animation (disable tap feedback)
   * Best for: When you want hover but no tap animation
   */
  none: {} as TargetAndTransition,
} as const;

/**
 * Focus animation presets
 *
 * Use with `whileFocus` prop on motion components.
 * Provides visual feedback when element receives keyboard focus.
 */
export const FOCUS_PRESETS = {
  /**
   * Glow ring effect
   * Best for: Input fields, focusable buttons
   */
  glow: {
    boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.4)',
    transition: { duration: 0.15 },
  } as TargetAndTransition,

  /**
   * Scale + glow
   * Best for: Buttons, interactive cards
   */
  scaleGlow: {
    scale: 1.02,
    boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.4)',
    transition: { duration: 0.15 },
  } as TargetAndTransition,

  /**
   * Brighten only
   * Best for: Minimalist UI, subtle feedback
   */
  brighten: {
    filter: 'brightness(1.1)',
    transition: { duration: 0.15 },
  } as TargetAndTransition,

  /**
   * Outline effect (border highlight)
   * Best for: Cards, containers, panels
   */
  outline: {
    borderColor: 'rgba(139, 92, 246, 0.6)',
    borderWidth: '2px',
    transition: { duration: 0.15 },
  } as TargetAndTransition,
} as const;

/**
 * Drag constraint presets
 *
 * Use with `dragConstraints` prop on motion components with `drag` enabled.
 * Defines boundaries for draggable elements.
 */
export const DRAG_CONSTRAINTS = {
  /**
   * Tight constraints (10px in each direction)
   * Best for: Subtle drag interactions, sliders
   */
  tight: {
    top: -10,
    left: -10,
    right: 10,
    bottom: 10,
  },

  /**
   * Normal constraints (50px in each direction)
   * Best for: Draggable cards, moderate movement
   */
  normal: {
    top: -50,
    left: -50,
    right: 50,
    bottom: 50,
  },

  /**
   * Wide constraints (100px in each direction)
   * Best for: Free-form drag, large movement areas
   */
  wide: {
    top: -100,
    left: -100,
    right: 100,
    bottom: 100,
  },

  /**
   * Horizontal only
   * Best for: Sliders, horizontal scrollers
   */
  horizontal: {
    top: 0,
    bottom: 0,
    left: -100,
    right: 100,
  },

  /**
   * Vertical only
   * Best for: Vertical sliders, swipe cards
   */
  vertical: {
    left: 0,
    right: 0,
    top: -100,
    bottom: 100,
  },

  /**
   * No constraints (free drag)
   * Best for: Infinite drag areas, free positioning
   */
  none: undefined,
} as const;

/**
 * Drag elastic (bounce) presets
 *
 * Use with `dragElastic` prop. Controls how much the element can stretch
 * beyond its constraints before bouncing back.
 */
export const DRAG_ELASTIC = {
  /**
   * No elastic (hard stop at constraints)
   */
  none: 0,

  /**
   * Subtle elastic (10% stretch)
   * Best for: Firm boundaries, minimal bounce
   */
  subtle: 0.1,

  /**
   * Normal elastic (30% stretch)
   * Best for: Natural drag feel, moderate bounce
   */
  normal: 0.3,

  /**
   * Bouncy elastic (50% stretch)
   * Best for: Playful interactions, pronounced bounce
   */
  bouncy: 0.5,

  /**
   * Very bouncy (70% stretch)
   * Best for: Game UI, exaggerated physics
   */
  veryBouncy: 0.7,
} as const;

/**
 * Combined gesture preset for common button interactions
 */
export const BUTTON_GESTURES = {
  /**
   * Default button gestures (lift on hover, shrink on tap)
   */
  default: {
    whileHover: HOVER_PRESETS.lift,
    whileTap: TAP_PRESETS.shrink,
    whileFocus: FOCUS_PRESETS.glow,
  },

  /**
   * Subtle button gestures (minimal feedback)
   */
  subtle: {
    whileHover: HOVER_PRESETS.scaleSubtle,
    whileTap: TAP_PRESETS.press,
    whileFocus: FOCUS_PRESETS.brighten,
  },

  /**
   * Playful button gestures (bouncy, fun)
   */
  playful: {
    whileHover: HOVER_PRESETS.float,
    whileTap: TAP_PRESETS.bounce,
    whileFocus: FOCUS_PRESETS.scaleGlow,
  },

  /**
   * Neon/Arcade button gestures (glow effects)
   */
  neon: {
    whileHover: HOVER_PRESETS.glowScale,
    whileTap: TAP_PRESETS.shrink,
    whileFocus: FOCUS_PRESETS.glow,
  },

  /**
   * Scale only gestures (no movement)
   */
  scale: {
    whileHover: HOVER_PRESETS.scale,
    whileTap: TAP_PRESETS.shrink,
    whileFocus: FOCUS_PRESETS.scaleGlow,
  },
} as const;

/**
 * Type exports for preset keys
 */
export type HoverPreset = keyof typeof HOVER_PRESETS;
export type TapPreset = keyof typeof TAP_PRESETS;
export type FocusPreset = keyof typeof FOCUS_PRESETS;
export type DragConstraintPreset = keyof typeof DRAG_CONSTRAINTS;
export type DragElasticPreset = keyof typeof DRAG_ELASTIC;
export type ButtonGesturePreset = keyof typeof BUTTON_GESTURES;

/**
 * Helper function to get hover preset
 */
export function getHoverPreset(preset: HoverPreset): TargetAndTransition {
  return HOVER_PRESETS[preset];
}

/**
 * Helper function to get tap preset
 */
export function getTapPreset(preset: TapPreset): TargetAndTransition {
  return TAP_PRESETS[preset];
}

/**
 * Helper function to get focus preset
 */
export function getFocusPreset(preset: FocusPreset): TargetAndTransition {
  return FOCUS_PRESETS[preset];
}

/**
 * Helper function to get drag constraint preset
 */
export function getDragConstraintPreset(preset: DragConstraintPreset) {
  return DRAG_CONSTRAINTS[preset];
}

/**
 * Helper function to get drag elastic preset
 */
export function getDragElasticPreset(preset: DragElasticPreset): number | undefined {
  return DRAG_ELASTIC[preset];
}

/**
 * Helper function to get button gesture preset
 */
export function getButtonGesturePreset(preset: ButtonGesturePreset) {
  return BUTTON_GESTURES[preset];
}
