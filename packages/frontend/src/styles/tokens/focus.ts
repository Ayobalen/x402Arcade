/**
 * Focus Styles Design Tokens
 *
 * Defines accessible focus-visible styles for keyboard navigation.
 * Ensures all interactive elements have clear, visible focus indicators.
 *
 * WCAG 2.1 SC 2.4.7 - Focus Visible (Level AA)
 * https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html
 */

import { primary, secondary, semantic, borders } from './colors';

/**
 * Focus Ring Configuration
 *
 * Defines the appearance of focus indicators across the application.
 */
export const focusRing = {
  /** Default focus ring width (2px) */
  width: '2px',
  /** Offset from the element edge (2px) */
  offset: '2px',
  /** Border radius for focus ring (matches element) */
  radius: 'inherit',
  /** Primary focus color - cyan for most interactive elements */
  colorPrimary: primary.DEFAULT,
  /** Secondary focus color - magenta for special cases */
  colorSecondary: secondary.DEFAULT,
  /** Success focus color - green for success actions */
  colorSuccess: semantic.success,
  /** Error focus color - red for error/destructive actions */
  colorError: semantic.error,
  /** Border focus color - subtle for low-contrast elements */
  colorBorder: borders.focus,
} as const;

/**
 * Focus Shadow Definitions
 *
 * Box-shadow values for creating visible focus indicators.
 * Uses multiple shadows for glow effect and offset ring.
 */
export const focusShadows = {
  /** Primary focus shadow - cyan glow with offset ring */
  primary: `0 0 0 ${focusRing.offset} rgba(10, 10, 15, 1), 0 0 0 calc(${focusRing.offset} + ${focusRing.width}) ${focusRing.colorPrimary}, 0 0 12px 4px rgba(0, 255, 255, 0.3)`,

  /** Secondary focus shadow - magenta glow with offset ring */
  secondary: `0 0 0 ${focusRing.offset} rgba(10, 10, 15, 1), 0 0 0 calc(${focusRing.offset} + ${focusRing.width}) ${focusRing.colorSecondary}, 0 0 12px 4px rgba(255, 0, 255, 0.3)`,

  /** Success focus shadow - green glow with offset ring */
  success: `0 0 0 ${focusRing.offset} rgba(10, 10, 15, 1), 0 0 0 calc(${focusRing.offset} + ${focusRing.width}) ${focusRing.colorSuccess}, 0 0 12px 4px rgba(0, 255, 136, 0.3)`,

  /** Error focus shadow - red glow with offset ring */
  error: `0 0 0 ${focusRing.offset} rgba(10, 10, 15, 1), 0 0 0 calc(${focusRing.offset} + ${focusRing.width}) ${focusRing.colorError}, 0 0 12px 4px rgba(255, 51, 102, 0.3)`,

  /** Subtle focus shadow - for low-contrast elements */
  subtle: `0 0 0 ${focusRing.offset} rgba(10, 10, 15, 1), 0 0 0 calc(${focusRing.offset} + ${focusRing.width}) ${focusRing.colorBorder}, 0 0 8px 2px rgba(0, 255, 255, 0.2)`,

  /** Inset focus shadow - for inputs and text areas */
  inset: `inset 0 0 0 ${focusRing.width} ${focusRing.colorPrimary}, 0 0 12px 2px rgba(0, 255, 255, 0.3)`,
} as const;

/**
 * Focus Outline Styles
 *
 * Alternative to box-shadow for focus indicators.
 * Useful when box-shadow is already in use for other effects.
 */
export const focusOutlines = {
  /** Primary focus outline - cyan */
  primary: `${focusRing.width} solid ${focusRing.colorPrimary}`,

  /** Secondary focus outline - magenta */
  secondary: `${focusRing.width} solid ${focusRing.colorSecondary}`,

  /** Success focus outline - green */
  success: `${focusRing.width} solid ${focusRing.colorSuccess}`,

  /** Error focus outline - red */
  error: `${focusRing.width} solid ${focusRing.colorError}`,

  /** Subtle focus outline */
  subtle: `${focusRing.width} solid ${focusRing.colorBorder}`,
} as const;

/**
 * Focus Transition
 *
 * Smooth transition for focus states.
 */
export const focusTransition = {
  /** Duration for focus transitions */
  duration: '150ms',
  /** Timing function for focus transitions */
  timing: 'ease-out',
  /** Complete transition property */
  property: 'box-shadow, outline, border-color',
} as const;

/**
 * Complete Focus Tokens
 */
export const focus = {
  ring: focusRing,
  shadows: focusShadows,
  outlines: focusOutlines,
  transition: focusTransition,
} as const;

export default focus;
