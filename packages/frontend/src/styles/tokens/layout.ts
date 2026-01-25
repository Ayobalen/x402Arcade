/**
 * Layout Design Tokens
 *
 * Container widths, max-widths, and aspect ratio utilities for
 * consistent layout constraints across the application.
 */

/**
 * Container Width Tokens
 *
 * Defines maximum width constraints for containers.
 * Based on common breakpoints and content-optimal reading widths.
 */
export const containerWidths = {
  /** Extra small container - 20rem (320px) - Mobile cards */
  xs: '20rem',
  /** Small container - 24rem (384px) - Narrow content */
  sm: '24rem',
  /** Medium container - 28rem (448px) - Forms, dialogs */
  md: '28rem',
  /** Large container - 32rem (512px) - Game cards */
  lg: '32rem',
  /** Extra large container - 36rem (576px) - Modal content */
  xl: '36rem',
  /** 2XL container - 42rem (672px) - Wide modals */
  '2xl': '42rem',
  /** 3XL container - 48rem (768px) - Tablet layouts */
  '3xl': '48rem',
  /** 4XL container - 56rem (896px) - Narrow desktop */
  '4xl': '56rem',
  /** 5XL container - 64rem (1024px) - Standard desktop */
  '5xl': '64rem',
  /** 6XL container - 72rem (1152px) - Wide desktop */
  '6xl': '72rem',
  /** 7XL container - 80rem (1280px) - Max content width */
  '7xl': '80rem',
  /** Full container - 100% - Full width */
  full: '100%',
  /** Screen container - 100vw - Full viewport */
  screen: '100vw',
} as const;

/**
 * Aspect Ratio Tokens
 *
 * Common aspect ratios for media, games, and layout components.
 * Follows the modern CSS aspect-ratio property syntax.
 */
export const aspectRatios = {
  /** Square - 1:1 - Profile images, game thumbnails */
  square: '1 / 1',
  /** Portrait - 3:4 - Mobile screenshots */
  portrait: '3 / 4',
  /** Landscape - 4:3 - Classic arcade screens */
  landscape: '4 / 3',
  /** Video - 16:9 - Modern widescreen */
  video: '16 / 9',
  /** Ultrawide - 21:9 - Cinematic */
  ultrawide: '21 / 9',
  /** Golden ratio - 1.618:1 - Aesthetic proportion */
  golden: '1.618 / 1',
  /** Wide - 2:1 - Banner images */
  wide: '2 / 1',
  /** Super wide - 3:1 - Hero banners */
  superwide: '3 / 1',
  /** Tall - 9:16 - Mobile vertical video */
  tall: '9 / 16',
  /** Auto - auto - Intrinsic aspect ratio */
  auto: 'auto',
} as const;

/**
 * Max Width Tokens (Prose/Content)
 *
 * Optimal line lengths for readable text content.
 * Based on typography best practices (45-75 characters per line).
 */
export const maxWidths = {
  /** None - no constraint */
  none: 'none',
  /** Prose narrow - 45ch - Very narrow columns */
  'prose-narrow': '45ch',
  /** Prose - 65ch - Optimal reading width */
  prose: '65ch',
  /** Prose wide - 75ch - Wide reading columns */
  'prose-wide': '75ch',
  /** Screen small - 640px - Mobile */
  'screen-sm': '640px',
  /** Screen medium - 768px - Tablet */
  'screen-md': '768px',
  /** Screen large - 1024px - Desktop */
  'screen-lg': '1024px',
  /** Screen extra large - 1280px - Wide desktop */
  'screen-xl': '1280px',
  /** Screen 2XL - 1536px - Ultra wide */
  'screen-2xl': '1536px',
} as const;

/**
 * Min Height Tokens
 *
 * Minimum height constraints for components.
 */
export const minHeights = {
  /** Screen - 100vh - Full viewport height */
  screen: '100vh',
  /** Half screen - 50vh */
  'screen-half': '50vh',
  /** Third screen - 33.333vh */
  'screen-third': '33.333vh',
  /** Quarter screen - 25vh */
  'screen-quarter': '25vh',
  /** Dynamic viewport (mobile-safe) - 100dvh */
  'screen-dynamic': '100dvh',
} as const;

/**
 * Type exports for TypeScript
 */
export type ContainerWidth = keyof typeof containerWidths;
export type AspectRatio = keyof typeof aspectRatios;
export type MaxWidth = keyof typeof maxWidths;
export type MinHeight = keyof typeof minHeights;
