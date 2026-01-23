/**
 * x402Arcade Color Design Tokens
 *
 * This file defines all color variables used throughout the application.
 * It serves as the single source of truth for the color palette.
 *
 * Design System: Retro Arcade / Neon theme
 * Inspired by: 1980s arcade cabinets with modern Web3 aesthetics
 */

/**
 * Background Colors
 *
 * Used for page backgrounds, cards, and surface elements.
 * Progresses from darkest (main) to lighter (surface) for layering.
 */
export const backgrounds = {
  /** Near black - main page background (#0a0a0a) */
  main: '#0a0a0a',
  /** Dark purple - secondary areas, sidebars (#1a1a2e) */
  secondary: '#1a1a2e',
  /** Slightly lighter - cards, modals, elevated surfaces (#16162a) */
  surface: '#16162a',
} as const;

/**
 * Primary Color Palette (Neon Cyan)
 *
 * The signature arcade cyan color with full shade scale.
 * Creates the distinctive neon aesthetic of the x402Arcade brand.
 */
export const primary = {
  /** Base primary color - neon cyan (#00ffff) */
  DEFAULT: '#00ffff',
  /** Lightest shade - almost white with cyan tint */
  50: '#e6ffff',
  /** Very light cyan */
  100: '#ccffff',
  /** Light cyan */
  200: '#99ffff',
  /** Medium-light cyan */
  300: '#66ffff',
  /** Lighter cyan */
  400: '#33ffff',
  /** Base primary - neon cyan */
  500: '#00ffff',
  /** Slightly darker cyan */
  600: '#00cccc',
  /** Medium cyan */
  700: '#009999',
  /** Dark cyan */
  800: '#006666',
  /** Darkest cyan */
  900: '#003333',
  /** Hover state - brighter cyan with white tint */
  hover: '#33ffff',
  /** Active/pressed state - slightly darker */
  active: '#00cccc',
  /** Disabled state - desaturated */
  disabled: '#4d9999',
  /** Glow effect - semi-transparent for shadows */
  glow: 'rgba(0, 255, 255, 0.4)',
  /** Strong glow - for hover/focus states */
  glowStrong: 'rgba(0, 255, 255, 0.6)',
} as const;

/**
 * Accent Colors
 *
 * Primary and secondary accent colors for interactive elements,
 * highlights, and visual emphasis. Classic arcade neon palette.
 */
export const accents = {
  /** Cyan - primary accent, buttons, links, active states (#00ffff) */
  primary: '#00ffff',
  /** Magenta/Pink - secondary accent, highlights, special elements (#ff00ff) */
  secondary: '#ff00ff',
} as const;

/**
 * Semantic Colors
 *
 * Colors that convey meaning: success, warning, error states.
 * Used for feedback, alerts, and status indicators.
 */
export const semantic = {
  /** Neon green - success states, confirmations, positive feedback (#00ff00) */
  success: '#00ff00',
  /** Yellow - warnings, cautions, pending states (#ffff00) */
  warning: '#ffff00',
  /** Red - errors, destructive actions, alerts (#ff4444) */
  error: '#ff4444',
} as const;

/**
 * Text Colors
 *
 * Typography colors for headings, body text, and muted elements.
 */
export const text = {
  /** White - primary text, headings, important content (#ffffff) */
  primary: '#ffffff',
  /** Muted gray - secondary text, descriptions, labels (#94a3b8) */
  secondary: '#94a3b8',
  /** Dimmed - placeholder text, disabled states (#64748b) */
  muted: '#64748b',
} as const;

/**
 * Border Colors
 *
 * Used for card borders, dividers, and separators.
 */
export const borders = {
  /** Default border color (#2d2d4a) */
  default: '#2d2d4a',
  /** Subtle border for less prominent separations (#1e1e38) */
  subtle: '#1e1e38',
  /** Focused/active border using primary accent (#00ffff) */
  focus: '#00ffff',
} as const;

/**
 * Glow Colors
 *
 * Semi-transparent versions of accent colors for glow effects.
 * Used in box-shadows and text-shadows for neon aesthetic.
 */
export const glows = {
  /** Cyan glow - rgba version for shadows */
  cyan: 'rgba(0, 255, 255, 0.3)',
  /** Cyan glow - stronger for hover states */
  cyanStrong: 'rgba(0, 255, 255, 0.5)',
  /** Magenta glow - rgba version for shadows */
  magenta: 'rgba(255, 0, 255, 0.3)',
  /** Magenta glow - stronger for hover states */
  magentaStrong: 'rgba(255, 0, 255, 0.5)',
  /** Green glow for success states */
  green: 'rgba(0, 255, 0, 0.3)',
} as const;

/**
 * Gradient Definitions
 *
 * Pre-defined gradients for buttons, backgrounds, and decorative elements.
 */
export const gradients = {
  /** Cyan to magenta - primary button gradient */
  primary: 'linear-gradient(135deg, #00ffff 0%, #ff00ff 100%)',
  /** Subtle surface gradient for cards */
  surface: 'linear-gradient(180deg, #1a1a2e 0%, #16162a 100%)',
  /** Dark gradient for overlays */
  overlay: 'linear-gradient(180deg, rgba(10, 10, 10, 0.8) 0%, rgba(10, 10, 10, 0.95) 100%)',
} as const;

/**
 * Complete Color Tokens Object
 *
 * All color tokens exported as a single typed constant.
 * Use this for accessing any color in the design system.
 */
export const colors = {
  backgrounds,
  primary,
  accents,
  semantic,
  text,
  borders,
  glows,
  gradients,
} as const;

/**
 * Type definitions for color tokens
 */
export type BackgroundColors = typeof backgrounds;
export type PrimaryColors = typeof primary;
export type AccentColors = typeof accents;
export type SemanticColors = typeof semantic;
export type TextColors = typeof text;
export type BorderColors = typeof borders;
export type GlowColors = typeof glows;
export type GradientColors = typeof gradients;
export type Colors = typeof colors;

export default colors;
