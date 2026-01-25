/**
 * AnimatedCounter Component Types
 *
 * Props for the animated counter component.
 * Uses spring physics to smoothly animate between number values.
 */

/**
 * Number formatting options
 */
export type NumberFormat = 'none' | 'currency' | 'percentage' | 'compact' | 'decimal';

/**
 * Props for the AnimatedCounter component
 */
export interface AnimatedCounterProps {
  /**
   * The target value to animate to
   */
  value: number;

  /**
   * The starting value (if different from 0)
   * @default 0
   */
  from?: number;

  /**
   * Number formatting type
   * @default 'none'
   */
  format?: NumberFormat;

  /**
   * Number of decimal places (for 'decimal' format)
   * @default 0
   */
  decimals?: number;

  /**
   * Currency symbol (for 'currency' format)
   * @default '$'
   */
  currencySymbol?: string;

  /**
   * Duration of the animation in seconds
   * @default 1.0
   */
  duration?: number;

  /**
   * Spring stiffness (higher = faster/snappier)
   * @default 100
   */
  stiffness?: number;

  /**
   * Spring damping (higher = less bouncy)
   * @default 20
   */
  damping?: number;

  /**
   * Callback when animation completes
   */
  onAnimationComplete?: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * HTML tag to render as
   * @default 'span'
   */
  as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}
