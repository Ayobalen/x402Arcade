/**
 * ClickRipple Component Types
 *
 * Props for the click ripple effect component that creates
 * an expanding circle animation from the click point.
 */

/**
 * Individual ripple data
 */
export interface Ripple {
  id: string;
  x: number;
  y: number;
}

/**
 * Props for the ClickRipple component
 */
export interface ClickRippleProps {
  /**
   * Color of the ripple effect
   * @default '#8B5CF6' (purple from design system)
   */
  color?: string;

  /**
   * Duration of the ripple animation in seconds
   * @default 0.6
   */
  duration?: number;

  /**
   * Maximum size of the ripple in pixels
   * @default 100
   */
  size?: number;

  /**
   * Whether to enable the ripple effect
   * @default true
   */
  enabled?: boolean;

  /**
   * CSS selector for the container to limit ripples to
   * If provided, ripples only appear within this element
   */
  containerSelector?: string;

  /**
   * Additional CSS classes
   */
  className?: string;
}
