/**
 * x402Arcade Spacing Design Tokens
 *
 * This file defines all spacing values used throughout the application.
 * It serves as the single source of truth for margins, padding, and gaps.
 *
 * Design System: Retro Arcade / Neon theme
 * Spacing Philosophy:
 * - Based on a 4px base unit for consistent visual rhythm
 * - Scale follows a logical progression: 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96
 * - Values use rem for accessibility (scales with user font preferences)
 */

/**
 * Spacing Scale
 *
 * The core spacing values based on a 4px (0.25rem) base unit.
 * Use these for margins, padding, and gaps.
 *
 * Formula: value * 0.25rem = pixels (at default 16px root)
 * Example: spacing[4] = 1rem = 16px
 */
export const spacing = {
  /** 0px - No spacing */
  '0': '0',
  /** 1px - Hairline spacing */
  px: '1px',
  /** 0.125rem (2px) - Minimal spacing */
  '0.5': '0.125rem',
  /** 0.25rem (4px) - Base unit */
  '1': '0.25rem',
  /** 0.375rem (6px) - Extra small */
  '1.5': '0.375rem',
  /** 0.5rem (8px) - Small */
  '2': '0.5rem',
  /** 0.625rem (10px) - Small-medium */
  '2.5': '0.625rem',
  /** 0.75rem (12px) - Medium-small */
  '3': '0.75rem',
  /** 0.875rem (14px) - Near medium */
  '3.5': '0.875rem',
  /** 1rem (16px) - Base medium */
  '4': '1rem',
  /** 1.25rem (20px) - Medium */
  '5': '1.25rem',
  /** 1.5rem (24px) - Medium-large */
  '6': '1.5rem',
  /** 1.75rem (28px) - Near large */
  '7': '1.75rem',
  /** 2rem (32px) - Large */
  '8': '2rem',
  /** 2.25rem (36px) - Large-plus */
  '9': '2.25rem',
  /** 2.5rem (40px) - Extra large */
  '10': '2.5rem',
  /** 2.75rem (44px) - Extra large plus */
  '11': '2.75rem',
  /** 3rem (48px) - 2x large */
  '12': '3rem',
  /** 3.5rem (56px) - 2x large plus */
  '14': '3.5rem',
  /** 4rem (64px) - 3x large */
  '16': '4rem',
  /** 5rem (80px) - 4x large */
  '20': '5rem',
  /** 6rem (96px) - 5x large */
  '24': '6rem',
  /** 7rem (112px) - 6x large */
  '28': '7rem',
  /** 8rem (128px) - 7x large */
  '32': '8rem',
  /** 9rem (144px) - 8x large */
  '36': '9rem',
  /** 10rem (160px) - 9x large */
  '40': '10rem',
  /** 11rem (176px) - 10x large */
  '44': '11rem',
  /** 12rem (192px) - 11x large */
  '48': '12rem',
  /** 13rem (208px) - 12x large */
  '52': '13rem',
  /** 14rem (224px) - 13x large */
  '56': '14rem',
  /** 15rem (240px) - 14x large */
  '60': '15rem',
  /** 16rem (256px) - 15x large */
  '64': '16rem',
  /** 18rem (288px) - 17x large */
  '72': '18rem',
  /** 20rem (320px) - 19x large */
  '80': '20rem',
  /** 24rem (384px) - 23x large */
  '96': '24rem',
} as const;

/**
 * Negative Spacing
 *
 * Negative spacing values for margin adjustments.
 * Useful for overlapping elements or pulling elements closer.
 */
export const negativeSpacing = {
  /** -1px */
  '-px': '-1px',
  /** -0.125rem (-2px) */
  '-0.5': '-0.125rem',
  /** -0.25rem (-4px) */
  '-1': '-0.25rem',
  /** -0.375rem (-6px) */
  '-1.5': '-0.375rem',
  /** -0.5rem (-8px) */
  '-2': '-0.5rem',
  /** -0.625rem (-10px) */
  '-2.5': '-0.625rem',
  /** -0.75rem (-12px) */
  '-3': '-0.75rem',
  /** -0.875rem (-14px) */
  '-3.5': '-0.875rem',
  /** -1rem (-16px) */
  '-4': '-1rem',
  /** -1.25rem (-20px) */
  '-5': '-1.25rem',
  /** -1.5rem (-24px) */
  '-6': '-1.5rem',
  /** -1.75rem (-28px) */
  '-7': '-1.75rem',
  /** -2rem (-32px) */
  '-8': '-2rem',
  /** -2.5rem (-40px) */
  '-10': '-2.5rem',
  /** -3rem (-48px) */
  '-12': '-3rem',
  /** -4rem (-64px) */
  '-16': '-4rem',
  /** -5rem (-80px) */
  '-20': '-5rem',
  /** -6rem (-96px) */
  '-24': '-6rem',
  /** -8rem (-128px) */
  '-32': '-8rem',
} as const;

/**
 * Semantic Spacing
 *
 * Named spacing values for common use cases.
 * Provides meaningful context for spacing decisions.
 */
export const semanticSpacing = {
  /** No spacing - 0 */
  none: spacing['0'],
  /** Extra small spacing - 4px */
  xs: spacing['1'],
  /** Small spacing - 8px */
  sm: spacing['2'],
  /** Medium spacing - 16px */
  md: spacing['4'],
  /** Large spacing - 24px */
  lg: spacing['6'],
  /** Extra large spacing - 32px */
  xl: spacing['8'],
  /** 2x extra large spacing - 48px */
  '2xl': spacing['12'],
  /** 3x extra large spacing - 64px */
  '3xl': spacing['16'],
  /** 4x extra large spacing - 96px */
  '4xl': spacing['24'],
} as const;

/**
 * Component Spacing
 *
 * Pre-defined spacing values for common component patterns.
 */
export const componentSpacing = {
  /** Button padding - horizontal */
  buttonPaddingX: spacing['4'],
  /** Button padding - vertical */
  buttonPaddingY: spacing['2'],
  /** Button padding - small horizontal */
  buttonSmPaddingX: spacing['3'],
  /** Button padding - small vertical */
  buttonSmPaddingY: spacing['1.5'],
  /** Button padding - large horizontal */
  buttonLgPaddingX: spacing['6'],
  /** Button padding - large vertical */
  buttonLgPaddingY: spacing['3'],
  /** Card padding */
  cardPadding: spacing['6'],
  /** Card padding - compact */
  cardPaddingCompact: spacing['4'],
  /** Card gap between items */
  cardGap: spacing['4'],
  /** Modal padding */
  modalPadding: spacing['6'],
  /** Modal gap between sections */
  modalGap: spacing['4'],
  /** Input padding - horizontal */
  inputPaddingX: spacing['3'],
  /** Input padding - vertical */
  inputPaddingY: spacing['2'],
  /** Form field gap */
  formGap: spacing['4'],
  /** Form section gap */
  formSectionGap: spacing['6'],
  /** Header height */
  headerHeight: spacing['16'],
  /** Footer height */
  footerHeight: spacing['12'],
  /** Page padding - horizontal */
  pagePaddingX: spacing['4'],
  /** Page padding - vertical */
  pagePaddingY: spacing['6'],
  /** Section gap */
  sectionGap: spacing['12'],
  /** Stack gap - small */
  stackGapSm: spacing['2'],
  /** Stack gap - medium */
  stackGapMd: spacing['4'],
  /** Stack gap - large */
  stackGapLg: spacing['6'],
  /** Inline gap - small */
  inlineGapSm: spacing['1'],
  /** Inline gap - medium */
  inlineGapMd: spacing['2'],
  /** Inline gap - large */
  inlineGapLg: spacing['3'],
} as const;

/**
 * Layout Spacing
 *
 * Spacing values specific to layout concerns.
 */
export const layoutSpacing = {
  /** Container max width - small (640px) */
  containerSm: '40rem',
  /** Container max width - medium (768px) */
  containerMd: '48rem',
  /** Container max width - large (1024px) */
  containerLg: '64rem',
  /** Container max width - extra large (1280px) */
  containerXl: '80rem',
  /** Container max width - 2x large (1536px) */
  container2xl: '96rem',
  /** Sidebar width */
  sidebarWidth: spacing['64'],
  /** Sidebar width - collapsed */
  sidebarWidthCollapsed: spacing['16'],
  /** Gutter - mobile */
  gutterMobile: spacing['4'],
  /** Gutter - tablet */
  gutterTablet: spacing['6'],
  /** Gutter - desktop */
  gutterDesktop: spacing['8'],
} as const;

/**
 * Complete Spacing Tokens Object
 *
 * All spacing tokens exported as a single typed constant.
 * Use this for accessing any spacing value in the design system.
 */
export const spacingTokens = {
  spacing,
  negative: negativeSpacing,
  semantic: semanticSpacing,
  component: componentSpacing,
  layout: layoutSpacing,
} as const;

/**
 * Type definitions for spacing tokens
 */
export type Spacing = typeof spacing;
export type NegativeSpacing = typeof negativeSpacing;
export type SemanticSpacing = typeof semanticSpacing;
export type ComponentSpacing = typeof componentSpacing;
export type LayoutSpacing = typeof layoutSpacing;
export type SpacingTokens = typeof spacingTokens;

export default spacingTokens;
