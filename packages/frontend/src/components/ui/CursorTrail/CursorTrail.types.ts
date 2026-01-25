/**
 * CursorTrail Component Types
 *
 * Props for the cursor trail effect component that creates
 * a trailing effect following the mouse cursor.
 */

/**
 * Props for the CursorTrail component
 */
export interface CursorTrailProps {
  /**
   * Number of trail elements to display
   * @default 8
   */
  trailLength?: number;

  /**
   * Size of each trail element in pixels
   * @default 8
   */
  trailSize?: number;

  /**
   * Color of the trail elements
   * @default '#00ffff' (cyan from design system)
   */
  color?: string;

  /**
   * Whether to enable the trail effect
   * @default true
   */
  enabled?: boolean;

  /**
   * CSS selector for the container to limit trail to
   * If provided, trail only appears within this element
   */
  containerSelector?: string;

  /**
   * Delay between trail elements in ms
   * Lower = tighter trail, higher = more spread out
   * @default 50
   */
  delay?: number;

  /**
   * Additional CSS classes
   */
  className?: string;
}
