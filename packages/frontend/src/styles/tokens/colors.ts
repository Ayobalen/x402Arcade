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
 * Dark purple backgrounds that create the deep space/arcade atmosphere.
 * These provide the canvas for neon elements to pop against.
 * Progresses from darkest (primary) to lighter (tertiary) for layering.
 */
export const backgrounds = {
  /** Darkest background - deepest layer (#0a0a0f) */
  primary: '#0a0a0f',
  /** Secondary background - page sections (#12121a) */
  secondary: '#12121a',
  /** Tertiary background - cards, elevated areas (#1a1a2e) */
  tertiary: '#1a1a2e',
  /** Surface background - modals, dropdowns (#16162a) */
  surface: '#16162a',
  /** Near black - legacy compatibility (#0a0a0a) */
  main: '#0a0a0a',
  /** Overlay with transparency - for modals, dialogs */
  overlay: 'rgba(10, 10, 15, 0.85)',
  /** Lighter overlay - for subtle backdrops */
  overlayLight: 'rgba(10, 10, 15, 0.6)',
} as const;

/**
 * Background Gradients
 *
 * Pre-defined gradients for depth effects and visual interest.
 */
export const backgroundGradients = {
  /** Page background gradient - darkest to slightly lighter */
  page: 'linear-gradient(180deg, #0a0a0f 0%, #12121a 100%)',
  /** Card surface gradient - adds depth */
  card: 'linear-gradient(180deg, #1a1a2e 0%, #16162a 100%)',
  /** Radial glow for hero sections */
  radialGlow: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0f 70%)',
  /** Subtle purple tint gradient */
  purpleTint: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(10, 10, 15, 0) 50%)',
  /** Mesh gradient for decorative backgrounds */
  mesh: 'radial-gradient(at 40% 20%, rgba(0, 255, 255, 0.08) 0, transparent 50%), radial-gradient(at 80% 0%, rgba(255, 0, 255, 0.08) 0, transparent 50%), radial-gradient(at 0% 50%, rgba(0, 255, 255, 0.05) 0, transparent 50%)',
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
 * Secondary Color Palette (Neon Magenta)
 *
 * Complementary magenta color with full shade scale.
 * Creates the classic arcade neon contrast with cyan primary.
 */
export const secondary = {
  /** Base secondary color - neon magenta (#ff00ff) */
  DEFAULT: '#ff00ff',
  /** Lightest shade - almost white with magenta tint */
  50: '#ffe6ff',
  /** Very light magenta */
  100: '#ffccff',
  /** Light magenta */
  200: '#ff99ff',
  /** Medium-light magenta */
  300: '#ff66ff',
  /** Lighter magenta */
  400: '#ff33ff',
  /** Base secondary - neon magenta */
  500: '#ff00ff',
  /** Slightly darker magenta */
  600: '#cc00cc',
  /** Medium magenta */
  700: '#990099',
  /** Dark magenta */
  800: '#660066',
  /** Darkest magenta */
  900: '#330033',
  /** Hover state - brighter magenta with white tint */
  hover: '#ff33ff',
  /** Active/pressed state - slightly darker */
  active: '#cc00cc',
  /** Disabled state - desaturated */
  disabled: '#994d99',
  /** Glow effect - semi-transparent for shadows */
  glow: 'rgba(255, 0, 255, 0.4)',
  /** Strong glow - for hover/focus states */
  glowStrong: 'rgba(255, 0, 255, 0.6)',
} as const;

/**
 * Surface Colors
 *
 * Colors for elevated UI elements like cards, modals, and dropdowns.
 * Creates visual hierarchy through subtle lightening of backgrounds.
 */
export const surfaces = {
  /** Primary surface - elevated cards, main content areas (#1e1e2e) */
  primary: '#1e1e2e',
  /** Secondary surface - nested cards, secondary panels (#252535) */
  secondary: '#252535',
  /** Tertiary surface - highest elevation, tooltips (#2d2d45) */
  tertiary: '#2d2d45',
  /** Primary surface hover state - slightly lighter */
  primaryHover: '#252538',
  /** Secondary surface hover state */
  secondaryHover: '#2d2d40',
  /** Tertiary surface hover state */
  tertiaryHover: '#353550',
  /** Surface border with subtle neon tint (#3d3d5c) */
  border: '#3d3d5c',
  /** Surface border with cyan accent for focus/active states */
  borderAccent: 'rgba(0, 255, 255, 0.3)',
  /** Surface border with magenta accent for special states */
  borderSecondary: 'rgba(255, 0, 255, 0.3)',
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
 * Each semantic color includes light and dark variants for flexibility.
 */
export const semantic = {
  /** Success Colors - Neon Green (#00ff88) */
  /** Base success color - vibrant neon green for positive feedback */
  success: '#00ff88',
  /** Light success - brighter variant for backgrounds and highlights */
  successLight: '#66ffbb',
  /** Dark success - deeper variant for text on light success backgrounds */
  successDark: '#00cc6a',
  /** Success glow - semi-transparent for shadow effects */
  successGlow: 'rgba(0, 255, 136, 0.4)',

  /** Warning Colors - Neon Orange (#ffaa00) */
  /** Base warning color - vibrant neon orange for cautions and pending states */
  warning: '#ffaa00',
  /** Light warning - brighter variant for backgrounds and highlights */
  warningLight: '#ffcc66',
  /** Dark warning - deeper variant for text on light warning backgrounds */
  warningDark: '#cc8800',
  /** Warning glow - semi-transparent for shadow effects */
  warningGlow: 'rgba(255, 170, 0, 0.4)',

  /** Error Colors - Neon Red (#ff3366) */
  /** Base error color - vibrant neon red for errors and destructive actions */
  error: '#ff3366',
  /** Light error - brighter variant for backgrounds and highlights */
  errorLight: '#ff7799',
  /** Dark error - deeper variant for text on light error backgrounds */
  errorDark: '#cc2952',
  /** Error glow - semi-transparent for shadow effects */
  errorGlow: 'rgba(255, 51, 102, 0.4)',

  /** Info Colors - Neon Blue (#3388ff) */
  /** Base info color - for informational states and neutral feedback */
  info: '#3388ff',
  /** Light info - brighter variant for backgrounds */
  infoLight: '#77aaff',
  /** Dark info - deeper variant for text */
  infoDark: '#2266cc',
  /** Info glow - semi-transparent for shadow effects */
  infoGlow: 'rgba(51, 136, 255, 0.4)',
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
  /** Success glow - neon green for success states */
  success: 'rgba(0, 255, 136, 0.3)',
  /** Success glow - stronger for hover states */
  successStrong: 'rgba(0, 255, 136, 0.5)',
  /** Warning glow - neon orange for warning states */
  warning: 'rgba(255, 170, 0, 0.3)',
  /** Warning glow - stronger for hover states */
  warningStrong: 'rgba(255, 170, 0, 0.5)',
  /** Error glow - neon red for error states */
  error: 'rgba(255, 51, 102, 0.3)',
  /** Error glow - stronger for hover states */
  errorStrong: 'rgba(255, 51, 102, 0.5)',
  /** Info glow - neon blue for info states */
  info: 'rgba(51, 136, 255, 0.3)',
  /** Info glow - stronger for hover states */
  infoStrong: 'rgba(51, 136, 255, 0.5)',
  /** Green glow for legacy compatibility */
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
  backgroundGradients,
  surfaces,
  primary,
  secondary,
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
export type BackgroundGradients = typeof backgroundGradients;
export type SurfaceColors = typeof surfaces;
export type PrimaryColors = typeof primary;
export type SecondaryColors = typeof secondary;
export type AccentColors = typeof accents;
export type SemanticColors = typeof semantic;
export type TextColors = typeof text;
export type BorderColors = typeof borders;
export type GlowColors = typeof glows;
export type GradientColors = typeof gradients;
export type Colors = typeof colors;

export default colors;
