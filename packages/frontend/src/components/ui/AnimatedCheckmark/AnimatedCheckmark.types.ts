/**
 * AnimatedCheckmark Component Types
 *
 * Props for the animated success checkmark component.
 * Uses pathLength animation with sequenced circle background.
 */

/**
 * Props for the AnimatedCheckmark component
 */
export interface AnimatedCheckmarkProps {
  /**
   * Size of the icon in pixels
   * @default 48
   */
  size?: number;

  /**
   * Color of the checkmark
   * @default '#00ff88' (neon green from design system)
   */
  color?: string;

  /**
   * Duration of the animation in seconds
   * @default 0.6
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
}
