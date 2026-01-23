/**
 * x402Arcade Typography Design Tokens
 *
 * This file defines all typography-related values used throughout the application.
 * It serves as the single source of truth for font families, sizes, weights, and line heights.
 *
 * Design System: Retro Arcade / Neon theme
 * Typography Philosophy:
 * - Display: Orbitron for retro gaming feel (headings, titles)
 * - Body: Inter for clean readability (paragraphs, UI text)
 * - Code: JetBrains Mono for wallet addresses and transaction IDs
 */

/**
 * Font Families
 *
 * Primary font stacks for different use cases.
 * Each includes appropriate fallback fonts.
 */
export const fontFamilies = {
  /** Display font - retro gaming aesthetic for headings and titles */
  display: '"Orbitron", "Press Start 2P", system-ui, sans-serif',
  /** Body font - clean and readable for paragraphs and UI text */
  body: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  /** Code font - monospace for wallet addresses, transaction IDs, and code */
  code: '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace',
  /** Sans-serif fallback - system default sans-serif */
  sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  /** Monospace fallback - system default monospace */
  mono: '"SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
} as const;

/**
 * Font Sizes
 *
 * A consistent scale for text sizing.
 * Based on a modular scale with 1rem = 16px base.
 * Values in rem for accessibility and responsiveness.
 */
export const fontSizes = {
  /** Extra small text - 0.75rem (12px) - fine print, badges, captions */
  xs: '0.75rem',
  /** Small text - 0.875rem (14px) - labels, secondary text */
  sm: '0.875rem',
  /** Base text - 1rem (16px) - default body text */
  base: '1rem',
  /** Medium text - 1.0625rem (17px) - emphasized body */
  md: '1.0625rem',
  /** Large text - 1.125rem (18px) - small headings */
  lg: '1.125rem',
  /** Extra large text - 1.25rem (20px) - section headings */
  xl: '1.25rem',
  /** 2XL text - 1.5rem (24px) - page headings */
  '2xl': '1.5rem',
  /** 3XL text - 1.875rem (30px) - major headings */
  '3xl': '1.875rem',
  /** 4XL text - 2.25rem (36px) - display headings */
  '4xl': '2.25rem',
  /** 5XL text - 3rem (48px) - hero headings */
  '5xl': '3rem',
  /** 6XL text - 3.75rem (60px) - large display */
  '6xl': '3.75rem',
  /** 7XL text - 4.5rem (72px) - huge display */
  '7xl': '4.5rem',
  /** 8XL text - 6rem (96px) - massive display */
  '8xl': '6rem',
  /** 9XL text - 8rem (128px) - extreme display */
  '9xl': '8rem',
} as const;

/**
 * Font Weights
 *
 * Standard font weight values for typography hierarchy.
 */
export const fontWeights = {
  /** Thin weight - 100 */
  thin: '100',
  /** Extra light weight - 200 */
  extralight: '200',
  /** Light weight - 300 */
  light: '300',
  /** Normal/regular weight - 400 */
  normal: '400',
  /** Medium weight - 500 */
  medium: '500',
  /** Semi-bold weight - 600 */
  semibold: '600',
  /** Bold weight - 700 */
  bold: '700',
  /** Extra bold weight - 800 */
  extrabold: '800',
  /** Black/heavy weight - 900 */
  black: '900',
} as const;

/**
 * Line Heights
 *
 * Line height values for optimal readability.
 * Named for their use case and feel.
 */
export const lineHeights = {
  /** None - 1 - for single-line display text */
  none: '1',
  /** Tight - 1.25 - for headings and compact text */
  tight: '1.25',
  /** Snug - 1.375 - slightly more breathing room */
  snug: '1.375',
  /** Normal - 1.5 - standard body text */
  normal: '1.5',
  /** Relaxed - 1.625 - comfortable reading */
  relaxed: '1.625',
  /** Loose - 2 - very spacious text */
  loose: '2',
} as const;

/**
 * Letter Spacing
 *
 * Character spacing values for fine-tuning typography.
 */
export const letterSpacing = {
  /** Tighter - -0.05em - for large display text */
  tighter: '-0.05em',
  /** Tight - -0.025em - for headings */
  tight: '-0.025em',
  /** Normal - 0 - default spacing */
  normal: '0',
  /** Wide - 0.025em - for small caps and labels */
  wide: '0.025em',
  /** Wider - 0.05em - for buttons and CTAs */
  wider: '0.05em',
  /** Widest - 0.1em - for all-caps display text */
  widest: '0.1em',
} as const;

/**
 * Text Styles
 *
 * Pre-composed text style objects for common use cases.
 * Combine family, size, weight, and line height.
 */
export const textStyles = {
  /** Hero display - largest display text for landing pages */
  heroDisplay: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes['6xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.none,
    letterSpacing: letterSpacing.tight,
  },
  /** Page title - main page headings */
  pageTitle: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes['4xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacing.tight,
  },
  /** Section heading - section headings within pages */
  sectionHeading: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacing.normal,
  },
  /** Card title - card and component headings */
  cardTitle: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacing.normal,
  },
  /** Body large - emphasized body text */
  bodyLarge: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.relaxed,
    letterSpacing: letterSpacing.normal,
  },
  /** Body default - standard body text */
  body: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  },
  /** Body small - smaller body text */
  bodySmall: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  },
  /** Caption - captions and labels */
  caption: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.wide,
  },
  /** Button text - button labels */
  button: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.none,
    letterSpacing: letterSpacing.wider,
  },
  /** Code inline - inline code snippets */
  codeInline: {
    fontFamily: fontFamilies.code,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  },
  /** Code block - code blocks and wallet addresses */
  codeBlock: {
    fontFamily: fontFamilies.code,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.relaxed,
    letterSpacing: letterSpacing.normal,
  },
  /** Wallet address - styled for wallet addresses and tx hashes */
  walletAddress: {
    fontFamily: fontFamilies.code,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.none,
    letterSpacing: letterSpacing.wide,
  },
  /** Game score - large display numbers for scores */
  gameScore: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes['5xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.none,
    letterSpacing: letterSpacing.normal,
  },
} as const;

/**
 * Complete Typography Tokens Object
 *
 * All typography tokens exported as a single typed constant.
 * Use this for accessing any typography value in the design system.
 */
export const typography = {
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacing,
  textStyles,
} as const;

/**
 * Type definitions for typography tokens
 */
export type FontFamilies = typeof fontFamilies;
export type FontSizes = typeof fontSizes;
export type FontWeights = typeof fontWeights;
export type LineHeights = typeof lineHeights;
export type LetterSpacing = typeof letterSpacing;
export type TextStyles = typeof textStyles;
export type Typography = typeof typography;

export default typography;
