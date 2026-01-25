/**
 * Opacity Design Tokens
 *
 * Opacity values for transparency, overlays, and visual hierarchy.
 * Aligned with Tailwind's opacity scale for consistency.
 */

/**
 * Opacity Scale
 *
 * Standard opacity values from 0 (fully transparent) to 100 (fully opaque).
 * Use these for layering, disabled states, and visual emphasis.
 */
export const opacity = {
  /** 0% - Fully transparent (invisible) */
  0: '0',
  /** 5% - Nearly transparent */
  5: '0.05',
  /** 10% - Very subtle */
  10: '0.1',
  /** 15% - Subtle hint */
  15: '0.15',
  /** 20% - Light transparency */
  20: '0.2',
  /** 25% - Quarter transparent */
  25: '0.25',
  /** 30% - Mild transparency */
  30: '0.3',
  /** 35% - Noticeable transparency */
  35: '0.35',
  /** 40% - Medium transparency */
  40: '0.4',
  /** 45% - Approaching half */
  45: '0.45',
  /** 50% - Half transparent */
  50: '0.5',
  /** 55% - Slightly more opaque */
  55: '0.55',
  /** 60% - Medium-high opacity */
  60: '0.6',
  /** 65% - Mostly opaque */
  65: '0.65',
  /** 70% - Strong opacity */
  70: '0.7',
  /** 75% - Three-quarters opaque */
  75: '0.75',
  /** 80% - Very opaque */
  80: '0.8',
  /** 85% - Nearly opaque */
  85: '0.85',
  /** 90% - Minimal transparency */
  90: '0.9',
  /** 95% - Almost fully opaque */
  95: '0.95',
  /** 100% - Fully opaque (no transparency) */
  100: '1',
} as const;

/**
 * Semantic Opacity Tokens
 *
 * Named opacity values for common use cases.
 * Provides better semantic meaning than numeric values.
 */
export const semanticOpacity = {
  /** Invisible - completely hidden (0%) */
  invisible: opacity[0],
  /** Ghost - barely visible hint (5%) */
  ghost: opacity[5],
  /** Whisper - very subtle presence (10%) */
  whisper: opacity[10],
  /** Faint - subtle background (20%) */
  faint: opacity[20],
  /** Disabled - disabled UI elements (40%) */
  disabled: opacity[40],
  /** Muted - de-emphasized content (50%) */
  muted: opacity[50],
  /** Dimmed - secondary content (60%) */
  dimmed: opacity[60],
  /** Visible - standard visibility (80%) */
  visible: opacity[80],
  /** Active - fully interactive (90%) */
  active: opacity[90],
  /** Solid - fully opaque (100%) */
  solid: opacity[100],
} as const;

/**
 * Overlay Opacity Tokens
 *
 * Specific opacity values for overlay layers (modals, dropdowns, tooltips).
 */
export const overlayOpacity = {
  /** Subtle overlay - light dimming (30%) */
  subtle: opacity[30],
  /** Light overlay - noticeable dimming (50%) */
  light: opacity[50],
  /** Medium overlay - standard modal backdrop (60%) */
  medium: opacity[60],
  /** Dark overlay - strong dimming (75%) */
  dark: opacity[75],
  /** Heavy overlay - very dark backdrop (90%) */
  heavy: opacity[90],
  /** Solid overlay - completely opaque (100%) */
  solid: opacity[100],
} as const;

/**
 * Glow/Effect Opacity Tokens
 *
 * Opacity values for neon glow effects and visual enhancements.
 */
export const glowOpacity = {
  /** Subtle glow - barely visible (10%) */
  subtle: opacity[10],
  /** Soft glow - gentle highlight (20%) */
  soft: opacity[20],
  /** Medium glow - noticeable effect (30%) */
  medium: opacity[30],
  /** Bright glow - strong effect (50%) */
  bright: opacity[50],
  /** Intense glow - very bright (70%) */
  intense: opacity[70],
  /** Maximum glow - fully opaque (100%) */
  maximum: opacity[100],
} as const;

/**
 * Type exports for TypeScript
 */
export type Opacity = keyof typeof opacity;
export type SemanticOpacity = keyof typeof semanticOpacity;
export type OverlayOpacity = keyof typeof overlayOpacity;
export type GlowOpacity = keyof typeof glowOpacity;
