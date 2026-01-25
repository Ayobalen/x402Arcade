/**
 * Design Tokens Index
 *
 * Central export point for all design tokens.
 * Import specific tokens from here throughout the application.
 *
 * @example
 * ```tsx
 * import { colors, spacing, accessibility } from '@/styles/tokens';
 *
 * const MyComponent = () => (
 *   <div style={{ color: colors.primary.DEFAULT, padding: spacing.md }}>
 *     Content
 *   </div>
 * );
 * ```
 */

// Color tokens
export * from './colors';
export {
  colors,
  backgrounds,
  surfaces,
  primary,
  secondary,
  text,
  borders,
  glows,
  gradients,
  semantic,
  accents,
} from './colors';

// Typography tokens
export * from './typography';
export { fontFamilies, fontSizes, fontWeights, lineHeights, letterSpacing } from './typography';

// Spacing tokens
export * from './spacing';
export { spacing, negativeSpacing } from './spacing';

// Border tokens
export * from './borders';
export { borderRadius, borderWidth } from './borders';

// Shadow tokens
export * from './shadows';
export { elevationShadows, glowShadows, combinedShadows } from './shadows';

// Animation tokens
export * from './animations';
export { durations, easings, keyframes } from './animations';

// Z-index tokens
export * from './zIndex';
export { zIndex } from './zIndex';

// Layout tokens
export * from './layout';
export { containerWidths, aspectRatios, maxWidths, minHeights } from './layout';

// Opacity tokens
export * from './opacity';
export { opacity } from './opacity';

// Accessibility tokens
export * from './accessibility';
export {
  accessibility,
  focusRings,
  contrastRatios,
  accessibleTextColors,
  highContrastColors,
  touchTargets,
  srOnly,
  focusVisibleClasses,
  ariaLabels,
  reducedMotion,
} from './accessibility';
