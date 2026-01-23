/**
 * x402Arcade Shadow Design Tokens
 *
 * This file defines all shadow values used throughout the application.
 * Includes both standard elevation shadows and signature neon glow effects.
 *
 * Design System: Retro Arcade / Neon theme
 * Shadow Philosophy:
 * - Dark shadows for elevation and depth
 * - Neon glows for the signature arcade aesthetic
 * - Combine shadows for rich layered effects
 */

/**
 * Elevation Shadows
 *
 * Standard box-shadows for creating depth and elevation.
 * Values progress from subtle to dramatic.
 */
export const elevationShadows = {
  /** No shadow */
  none: 'none',
  /** Extra small - subtle depth (cards at rest) */
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
  /** Small - light elevation */
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4)',
  /** Default - standard elevation */
  DEFAULT: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4)',
  /** Medium - moderate elevation (modals, dropdowns) */
  md: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.4)',
  /** Large - high elevation */
  lg: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
  /** Extra large - maximum elevation */
  xl: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  /** 2x extra large - dramatic elevation */
  '2xl': '0 35px 60px -15px rgba(0, 0, 0, 0.6)',
  /** Inner shadow - inset effect */
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.4)',
} as const;

/**
 * Neon Glow Shadows
 *
 * Signature neon glow effects for the arcade aesthetic.
 * Uses semi-transparent accent colors for the glow effect.
 */
export const glowShadows = {
  /** Cyan glow - subtle */
  cyan: '0 0 10px rgba(0, 255, 255, 0.3)',
  /** Cyan glow - medium */
  cyanMd: '0 0 20px rgba(0, 255, 255, 0.4)',
  /** Cyan glow - strong */
  cyanLg: '0 0 30px rgba(0, 255, 255, 0.5), 0 0 60px rgba(0, 255, 255, 0.3)',
  /** Cyan glow - intense (for hover/focus) */
  cyanIntense: '0 0 20px rgba(0, 255, 255, 0.6), 0 0 40px rgba(0, 255, 255, 0.4), 0 0 60px rgba(0, 255, 255, 0.2)',
  /** Magenta glow - subtle */
  magenta: '0 0 10px rgba(255, 0, 255, 0.3)',
  /** Magenta glow - medium */
  magentaMd: '0 0 20px rgba(255, 0, 255, 0.4)',
  /** Magenta glow - strong */
  magentaLg: '0 0 30px rgba(255, 0, 255, 0.5), 0 0 60px rgba(255, 0, 255, 0.3)',
  /** Magenta glow - intense (for hover/focus) */
  magentaIntense: '0 0 20px rgba(255, 0, 255, 0.6), 0 0 40px rgba(255, 0, 255, 0.4), 0 0 60px rgba(255, 0, 255, 0.2)',
  /** Green glow - success states */
  green: '0 0 10px rgba(0, 255, 136, 0.3)',
  /** Green glow - strong */
  greenLg: '0 0 20px rgba(0, 255, 136, 0.5), 0 0 40px rgba(0, 255, 136, 0.3)',
  /** Orange glow - warning states */
  orange: '0 0 10px rgba(255, 170, 0, 0.3)',
  /** Orange glow - strong */
  orangeLg: '0 0 20px rgba(255, 170, 0, 0.5), 0 0 40px rgba(255, 170, 0, 0.3)',
  /** Red glow - error states */
  red: '0 0 10px rgba(255, 51, 102, 0.3)',
  /** Red glow - strong */
  redLg: '0 0 20px rgba(255, 51, 102, 0.5), 0 0 40px rgba(255, 51, 102, 0.3)',
  /** White glow - neutral emphasis */
  white: '0 0 10px rgba(255, 255, 255, 0.3)',
  /** White glow - medium */
  whiteMd: '0 0 20px rgba(255, 255, 255, 0.4)',
  /** White glow - strong */
  whiteLg: '0 0 30px rgba(255, 255, 255, 0.5), 0 0 60px rgba(255, 255, 255, 0.3)',
  /** Multi-color rainbow glow */
  rainbow: '0 0 20px rgba(0, 255, 255, 0.3), 0 0 40px rgba(255, 0, 255, 0.3)',
} as const;

/**
 * Text Shadows
 *
 * Text glow effects for headings and neon text.
 */
export const textShadows = {
  /** No text shadow */
  none: 'none',
  /** Subtle text shadow */
  sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
  /** Default text shadow */
  DEFAULT: '0 2px 4px rgba(0, 0, 0, 0.5)',
  /** Large text shadow */
  lg: '0 4px 8px rgba(0, 0, 0, 0.5)',
  /** Cyan text glow */
  glowCyan: '0 0 10px rgba(0, 255, 255, 0.5), 0 0 20px rgba(0, 255, 255, 0.3)',
  /** Cyan text glow - strong */
  glowCyanStrong: '0 0 10px rgba(0, 255, 255, 0.8), 0 0 20px rgba(0, 255, 255, 0.5), 0 0 40px rgba(0, 255, 255, 0.3)',
  /** Magenta text glow */
  glowMagenta: '0 0 10px rgba(255, 0, 255, 0.5), 0 0 20px rgba(255, 0, 255, 0.3)',
  /** Magenta text glow - strong */
  glowMagentaStrong: '0 0 10px rgba(255, 0, 255, 0.8), 0 0 20px rgba(255, 0, 255, 0.5), 0 0 40px rgba(255, 0, 255, 0.3)',
  /** Green text glow - success */
  glowGreen: '0 0 10px rgba(0, 255, 136, 0.5), 0 0 20px rgba(0, 255, 136, 0.3)',
  /** White text glow */
  glowWhite: '0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.3)',
} as const;

/**
 * Combined Shadows
 *
 * Pre-composed shadow combinations for common UI patterns.
 */
export const combinedShadows = {
  /** Card hover effect - elevation + subtle glow */
  cardHover: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 0 10px rgba(0, 255, 255, 0.2)',
  /** Button hover - glow effect */
  buttonHover: '0 0 20px rgba(0, 255, 255, 0.4)',
  /** Button active - pressed effect */
  buttonActive: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)',
  /** Modal overlay - dramatic elevation */
  modal: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 40px rgba(0, 255, 255, 0.1)',
  /** Dropdown shadow */
  dropdown: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.5)',
  /** Focus ring with glow */
  focusRing: '0 0 0 2px rgba(0, 255, 255, 0.4), 0 0 10px rgba(0, 255, 255, 0.3)',
  /** Game screen CRT glow effect */
  crtGlow: 'inset 0 0 100px rgba(0, 255, 255, 0.05), 0 0 50px rgba(0, 255, 255, 0.1)',
  /** Neon border glow */
  neonBorder: '0 0 5px rgba(0, 255, 255, 0.5), inset 0 0 5px rgba(0, 255, 255, 0.1)',
} as const;

/**
 * Inset Shadows
 *
 * Inner shadows for pressed states and depth effects.
 */
export const insetShadows = {
  /** No inset shadow */
  none: 'none',
  /** Small inset */
  sm: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)',
  /** Default inset */
  DEFAULT: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)',
  /** Large inset - deep press effect */
  lg: 'inset 0 4px 8px rgba(0, 0, 0, 0.5)',
  /** Inset with inner glow */
  glow: 'inset 0 0 10px rgba(0, 255, 255, 0.1)',
  /** CRT screen inner shadow */
  screen: 'inset 0 0 50px rgba(0, 0, 0, 0.5), inset 0 0 100px rgba(0, 255, 255, 0.02)',
} as const;

/**
 * Complete Shadow Tokens Object
 *
 * All shadow tokens exported as a single typed constant.
 */
export const shadows = {
  elevation: elevationShadows,
  glow: glowShadows,
  text: textShadows,
  combined: combinedShadows,
  inset: insetShadows,
} as const;

/**
 * Type definitions for shadow tokens
 */
export type ElevationShadows = typeof elevationShadows;
export type GlowShadows = typeof glowShadows;
export type TextShadows = typeof textShadows;
export type CombinedShadows = typeof combinedShadows;
export type InsetShadows = typeof insetShadows;
export type Shadows = typeof shadows;

export default shadows;
