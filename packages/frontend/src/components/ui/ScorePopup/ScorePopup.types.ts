/**
 * ScorePopup Component Types
 *
 * Props for the floating score animation that appears when points are earned.
 * Animates upward with a bounce and fades out.
 */

/**
 * Props for the ScorePopup component
 */
export interface ScorePopupProps {
  /**
   * Score value to display
   */
  score: number;

  /**
   * X position where the popup should appear
   */
  x: number;

  /**
   * Y position where the popup should appear
   */
  y: number;

  /**
   * Color of the popup text
   * @default '#00ff00' (neon green for normal scores)
   */
  color?: string;

  /**
   * Duration of the animation in seconds
   * @default 1.5
   */
  duration?: number;

  /**
   * Distance to travel upward in pixels
   * @default 80
   */
  distance?: number;

  /**
   * Whether this is a combo score (adds extra animation)
   * @default false
   */
  isCombo?: boolean;

  /**
   * Callback when animation completes
   */
  onComplete?: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;
}
