/**
 * ComboFlash Component Types
 *
 * Props for the combo multiplier flash effect that animates
 * when combo level increases. Higher combos get more intense effects.
 */

/**
 * Props for the ComboFlash component
 */
export interface ComboFlashProps {
  /**
   * Current combo multiplier (e.g., 2x, 5x, 10x)
   */
  multiplier: number;

  /**
   * Whether to show the flash animation
   * @default true
   */
  show?: boolean;

  /**
   * Duration of the flash animation in seconds
   * @default 0.6
   */
  duration?: number;

  /**
   * Position where the flash appears
   */
  position?: { x: number; y: number };

  /**
   * Callback when animation completes
   */
  onComplete?: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;
}
