/**
 * AnimatedError Component Types
 *
 * Props for the animated error cross component.
 * Uses pathLength animation for both lines with shake effect.
 */

/**
 * Props for the AnimatedError component
 */
export interface AnimatedErrorProps {
  /**
   * Size of the icon in pixels
   * @default 48
   */
  size?: number;

  /**
   * Color of the error cross
   * @default '#ff3366' (neon red from design system)
   */
  color?: string;

  /**
   * Duration of the animation in seconds
   * @default 0.7
   */
  duration?: number;

  /**
   * Whether to loop the animation
   * @default false
   */
  loop?: boolean;

  /**
   * Callback when animation completes
   */
  onAnimationComplete?: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Whether to auto-play the animation on mount
   * @default true
   */
  autoPlay?: boolean;

  /**
   * Whether to include shake effect after drawing
   * @default true
   */
  includeShake?: boolean;
}
