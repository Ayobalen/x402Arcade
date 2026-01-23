/**
 * x402Arcade Border Design Tokens
 *
 * This file defines all border-related values including radii, widths, and styles.
 * It serves as the single source of truth for border styling across the application.
 *
 * Design System: Retro Arcade / Neon theme
 * Border Philosophy:
 * - Consistent corner rounding for cohesive feel
 * - Sharp options for retro/pixel aesthetic
 * - Rounded options for modern elements
 */

/**
 * Border Radius Scale
 *
 * Defines corner rounding values from sharp to fully rounded.
 * Use these for consistent corner styling across components.
 */
export const borderRadius = {
  /** No rounding - sharp corners (0) */
  none: '0',
  /** Extra small rounding - 2px */
  xs: '0.125rem',
  /** Small rounding - 4px */
  sm: '0.25rem',
  /** Default/medium rounding - 6px */
  DEFAULT: '0.375rem',
  /** Medium rounding - 8px */
  md: '0.5rem',
  /** Large rounding - 12px */
  lg: '0.75rem',
  /** Extra large rounding - 16px */
  xl: '1rem',
  /** 2x extra large rounding - 24px */
  '2xl': '1.5rem',
  /** 3x extra large rounding - 32px */
  '3xl': '2rem',
  /** Full rounding - for circles and pills (9999px) */
  full: '9999px',
} as const;

/**
 * Border Width Scale
 *
 * Defines border thickness values for consistent stroke widths.
 */
export const borderWidth = {
  /** No border (0) */
  '0': '0',
  /** Hairline border - 1px */
  DEFAULT: '1px',
  /** Medium border - 2px */
  '2': '2px',
  /** Thick border - 4px */
  '4': '4px',
  /** Extra thick border - 8px */
  '8': '8px',
} as const;

/**
 * Border Styles
 *
 * Pre-composed border style objects for common patterns.
 */
export const borderStyles = {
  /** Default border style */
  default: {
    width: borderWidth.DEFAULT,
    style: 'solid',
  },
  /** Neon glow border with cyan accent */
  neonCyan: {
    width: borderWidth['2'],
    style: 'solid',
    color: '#00ffff',
    shadow: '0 0 10px rgba(0, 255, 255, 0.5), inset 0 0 10px rgba(0, 255, 255, 0.1)',
  },
  /** Neon glow border with magenta accent */
  neonMagenta: {
    width: borderWidth['2'],
    style: 'solid',
    color: '#ff00ff',
    shadow: '0 0 10px rgba(255, 0, 255, 0.5), inset 0 0 10px rgba(255, 0, 255, 0.1)',
  },
  /** Subtle border for cards */
  subtle: {
    width: borderWidth.DEFAULT,
    style: 'solid',
    color: 'rgba(255, 255, 255, 0.1)',
  },
  /** Accent border for focus states */
  accent: {
    width: borderWidth['2'],
    style: 'solid',
    color: '#00ffff',
  },
  /** Dashed border for dropzones */
  dashed: {
    width: borderWidth['2'],
    style: 'dashed',
  },
} as const;

/**
 * Outline Styles
 *
 * Pre-composed outline style objects for focus states.
 */
export const outlineStyles = {
  /** Default outline */
  default: {
    width: '2px',
    style: 'solid',
    offset: '2px',
  },
  /** Neon cyan focus outline */
  focus: {
    width: '2px',
    style: 'solid',
    color: '#00ffff',
    offset: '2px',
    shadow: '0 0 8px rgba(0, 255, 255, 0.5)',
  },
  /** Error outline */
  error: {
    width: '2px',
    style: 'solid',
    color: '#ff3366',
    offset: '2px',
  },
  /** None outline */
  none: {
    width: '0',
    style: 'none',
    offset: '0',
  },
} as const;

/**
 * Ring Styles
 *
 * CSS box-shadow based focus rings for accessibility.
 */
export const ringStyles = {
  /** Default ring - subtle */
  default: '0 0 0 2px rgba(0, 255, 255, 0.2)',
  /** Primary ring - cyan */
  primary: '0 0 0 2px rgba(0, 255, 255, 0.4)',
  /** Secondary ring - magenta */
  secondary: '0 0 0 2px rgba(255, 0, 255, 0.4)',
  /** Error ring - red */
  error: '0 0 0 2px rgba(255, 51, 102, 0.4)',
  /** Success ring - green */
  success: '0 0 0 2px rgba(0, 255, 136, 0.4)',
  /** Warning ring - orange */
  warning: '0 0 0 2px rgba(255, 170, 0, 0.4)',
  /** Offset ring - for layered effect */
  offset: '0 0 0 2px #0a0a0f, 0 0 0 4px rgba(0, 255, 255, 0.4)',
} as const;

/**
 * Complete Border Tokens Object
 *
 * All border tokens exported as a single typed constant.
 */
export const borders = {
  radius: borderRadius,
  width: borderWidth,
  styles: borderStyles,
  outline: outlineStyles,
  ring: ringStyles,
} as const;

/**
 * Type definitions for border tokens
 */
export type BorderRadius = typeof borderRadius;
export type BorderWidth = typeof borderWidth;
export type BorderStyles = typeof borderStyles;
export type OutlineStyles = typeof outlineStyles;
export type RingStyles = typeof ringStyles;
export type Borders = typeof borders;

export default borders;
