/**
 * x402Arcade Animation Design Tokens
 *
 * This file defines all animation-related values including durations,
 * easing functions, and keyframe animation references.
 *
 * Design System: Retro Arcade / Neon theme
 * Animation Philosophy:
 * - Snappy, responsive interactions (150-300ms)
 * - Smooth transitions that feel natural
 * - Pulsing/glowing effects for the neon aesthetic
 * - Game-like animations for engagement
 */

/**
 * Animation Durations
 *
 * Consistent timing values for animations and transitions.
 * Values in milliseconds.
 */
export const durations = {
  /** Instant - no perceptible delay (0ms) */
  instant: '0ms',
  /** Ultra fast - for micro-interactions (50ms) */
  ultraFast: '50ms',
  /** Fastest - for immediate feedback (75ms) */
  fastest: '75ms',
  /** Fast - for snappy interactions (100ms) */
  fast: '100ms',
  /** Quick - for responsive UI (150ms) */
  quick: '150ms',
  /** Default - standard transition time (200ms) */
  DEFAULT: '200ms',
  /** Normal - comfortable transition (250ms) */
  normal: '250ms',
  /** Moderate - for complex animations (300ms) */
  moderate: '300ms',
  /** Slow - for larger transitions (400ms) */
  slow: '400ms',
  /** Slower - for dramatic effects (500ms) */
  slower: '500ms',
  /** Slowest - for subtle ambient animations (700ms) */
  slowest: '700ms',
  /** Languid - for very slow animations (1000ms) */
  languid: '1000ms',
  /** Glacial - for extremely slow effects (1500ms) */
  glacial: '1500ms',
  /** Eternal - for continuous ambient loops (2000ms) */
  eternal: '2000ms',
} as const;

/**
 * Duration Scale (numeric)
 *
 * Numeric duration values for programmatic use.
 */
export const durationMs = {
  instant: 0,
  ultraFast: 50,
  fastest: 75,
  fast: 100,
  quick: 150,
  DEFAULT: 200,
  normal: 250,
  moderate: 300,
  slow: 400,
  slower: 500,
  slowest: 700,
  languid: 1000,
  glacial: 1500,
  eternal: 2000,
} as const;

/**
 * Duration Presets
 *
 * Named duration presets for common animation scenarios.
 * Designed for the retro arcade aesthetic.
 */
export const DURATION_PRESETS = {
  /** Instant - immediate feedback (100ms) */
  instant: durations.fast,
  /** Fast - micro-interactions (200ms) */
  fast: durations.DEFAULT,
  /** Normal - standard transitions (300ms) */
  normal: durations.moderate,
  /** Slow - emphasis animations (500ms) */
  slow: durations.slower,
  /** Very Slow - dramatic effects (800ms) */
  verySlow: '800ms',
} as const;

/**
 * Spring Physics Configuration
 *
 * Configuration for spring-based animations.
 * Based on physics simulation parameters.
 */
export interface SpringConfig {
  /** Stiffness - how quickly the spring moves (higher = faster) */
  stiffness: number;
  /** Damping - how quickly the spring settles (higher = less bouncy) */
  damping: number;
  /** Mass - weight of the animated object (higher = slower) */
  mass?: number;
}

/**
 * Spring Physics Presets
 *
 * Pre-configured spring physics for various animation feels.
 * Tuned for the retro arcade aesthetic.
 */
export const SPRING_PRESETS = {
  /** Bouncy - high stiffness, low damping (playful, energetic) */
  bouncy: {
    stiffness: 300,
    damping: 10,
    mass: 1,
  } as SpringConfig,
  /** Gentle - low stiffness, high damping (soft, smooth) */
  gentle: {
    stiffness: 100,
    damping: 20,
    mass: 1,
  } as SpringConfig,
  /** Stiff - very high stiffness (snappy, responsive) */
  stiff: {
    stiffness: 400,
    damping: 30,
    mass: 1,
  } as SpringConfig,
  /** Wobbly - moderate stiffness, low damping (playful interactions) */
  wobbly: {
    stiffness: 180,
    damping: 12,
    mass: 1,
  } as SpringConfig,
} as const;

/**
 * Easing Functions
 *
 * CSS timing functions for natural-feeling animations.
 */
export const easings = {
  /** Linear - constant speed */
  linear: 'linear',
  /** Ease - default browser easing */
  ease: 'ease',
  /** Ease in - slow start, fast end */
  easeIn: 'ease-in',
  /** Ease out - fast start, slow end (most common) */
  easeOut: 'ease-out',
  /** Ease in-out - slow start and end */
  easeInOut: 'ease-in-out',
  /** Cubic ease in - more pronounced slow start */
  cubicIn: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
  /** Cubic ease out - more pronounced slow end */
  cubicOut: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
  /** Cubic ease in-out - smooth S-curve */
  cubicInOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
  /** Quart ease out - strong deceleration */
  quartOut: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
  /** Expo ease out - dramatic deceleration */
  expoOut: 'cubic-bezier(0.19, 1, 0.22, 1)',
  /** Back ease out - slight overshoot */
  backOut: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  /** Back ease in-out - overshoot at both ends */
  backInOut: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  /** Bounce ease out - bouncy landing */
  bounceOut: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  /** Spring - natural spring physics */
  spring: 'cubic-bezier(0.5, 1.5, 0.5, 1)',
  /** Elastic - pronounced spring effect */
  elastic: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
  /** Sharp - snappy UI feedback */
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  /** Crypto - custom easing for brand feel (neon pulse) */
  crypto: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

/**
 * Easing Function Presets
 *
 * Curated easing functions for common animation scenarios.
 */
export const EASING_PRESETS = {
  /** Ease Out - natural deceleration (cubic-bezier) */
  easeOut: easings.cubicOut,
  /** Ease In - acceleration (cubic-bezier) */
  easeIn: easings.cubicIn,
  /** Ease In-Out - smooth transitions (cubic-bezier) */
  easeInOut: easings.cubicInOut,
  /** Sharp - snappy UI feedback */
  sharp: easings.sharp,
  /** Crypto - custom easing for brand feel */
  crypto: easings.crypto,
} as const;

/**
 * Keyframe Animation Names
 *
 * Reference names for keyframe animations defined in CSS.
 * These must be defined in your CSS/Tailwind config.
 */
export const keyframes = {
  /** Fade in from transparent */
  fadeIn: 'fadeIn',
  /** Fade out to transparent */
  fadeOut: 'fadeOut',
  /** Slide in from bottom */
  slideInUp: 'slideInUp',
  /** Slide in from top */
  slideInDown: 'slideInDown',
  /** Slide in from left */
  slideInLeft: 'slideInLeft',
  /** Slide in from right */
  slideInRight: 'slideInRight',
  /** Slide out to bottom */
  slideOutDown: 'slideOutDown',
  /** Slide out to top */
  slideOutUp: 'slideOutUp',
  /** Scale in from smaller */
  scaleIn: 'scaleIn',
  /** Scale out to smaller */
  scaleOut: 'scaleOut',
  /** Zoom in dramatically */
  zoomIn: 'zoomIn',
  /** Zoom out dramatically */
  zoomOut: 'zoomOut',
  /** Pulse - rhythmic scaling */
  pulse: 'pulse',
  /** Ping - radar-like pulse */
  ping: 'ping',
  /** Bounce - up and down */
  bounce: 'bounce',
  /** Shake - horizontal vibration */
  shake: 'shake',
  /** Spin - 360° rotation */
  spin: 'spin',
  /** Glow pulse - neon glow intensity variation */
  glowPulse: 'glowPulse',
  /** Neon flicker - retro sign flicker effect */
  neonFlicker: 'neonFlicker',
  /** Scanline - CRT scanline effect */
  scanline: 'scanline',
  /** Score pop - score increment animation */
  scorePop: 'scorePop',
  /** Combo flash - combo multiplier flash */
  comboFlash: 'comboFlash',
} as const;

/**
 * Pre-composed Animation Styles
 *
 * Ready-to-use animation property values.
 */
export const animations = {
  /** No animation */
  none: 'none',
  /** Subtle pulse for attention */
  pulse: `${keyframes.pulse} ${durations.languid} ${easings.easeInOut} infinite`,
  /** Spin loading indicator */
  spin: `${keyframes.spin} ${durations.languid} ${easings.linear} infinite`,
  /** Bounce for notifications */
  bounce: `${keyframes.bounce} ${durations.languid} ${easings.easeInOut} infinite`,
  /** Ping for alerts */
  ping: `${keyframes.ping} ${durations.languid} ${easings.cubicOut} infinite`,
  /** Neon glow pulse */
  glowPulse: `${keyframes.glowPulse} ${durations.eternal} ${easings.easeInOut} infinite`,
  /** CRT flicker effect */
  neonFlicker: `${keyframes.neonFlicker} ${durations.eternal} ${easings.linear} infinite`,
} as const;

/**
 * Transition Presets
 *
 * Common transition property combinations.
 */
export const transitions = {
  /** No transition */
  none: 'none',
  /** All properties - default */
  all: `all ${durations.DEFAULT} ${easings.easeOut}`,
  /** All properties - fast */
  allFast: `all ${durations.fast} ${easings.easeOut}`,
  /** All properties - slow */
  allSlow: `all ${durations.slow} ${easings.easeOut}`,
  /** Colors only */
  colors: `color ${durations.DEFAULT} ${easings.easeOut}, background-color ${durations.DEFAULT} ${easings.easeOut}, border-color ${durations.DEFAULT} ${easings.easeOut}`,
  /** Opacity only */
  opacity: `opacity ${durations.DEFAULT} ${easings.easeOut}`,
  /** Transform only */
  transform: `transform ${durations.DEFAULT} ${easings.easeOut}`,
  /** Shadow only */
  shadow: `box-shadow ${durations.DEFAULT} ${easings.easeOut}`,
  /** Background only */
  background: `background ${durations.DEFAULT} ${easings.easeOut}`,
  /** Border only */
  border: `border ${durations.DEFAULT} ${easings.easeOut}`,
  /** Width/height sizing */
  size: `width ${durations.moderate} ${easings.easeOut}, height ${durations.moderate} ${easings.easeOut}`,
} as const;

/**
 * Complete Animation Tokens Object
 *
 * All animation tokens exported as a single typed constant.
 */
export const animationTokens = {
  durations,
  durationMs,
  DURATION_PRESETS,
  SPRING_PRESETS,
  easings,
  EASING_PRESETS,
  keyframes,
  animations,
  transitions,
} as const;

/**
 * Type definitions for animation tokens
 */
export type Durations = typeof durations;
export type DurationMs = typeof durationMs;
export type DurationPresets = typeof DURATION_PRESETS;
export type SpringPresets = typeof SPRING_PRESETS;
export type Easings = typeof easings;
export type EasingPresets = typeof EASING_PRESETS;
export type Keyframes = typeof keyframes;
export type Animations = typeof animations;
export type Transitions = typeof transitions;
export type AnimationTokens = typeof animationTokens;

export default animationTokens;
