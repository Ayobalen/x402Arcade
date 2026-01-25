/**
 * CoinCollect Component Types
 *
 * Props for the coin collection animation that shows a coin traveling
 * from a start position to an end position along a bezier curve.
 */

/**
 * Position coordinates
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Props for the CoinCollect component
 */
export interface CoinCollectProps {
  /**
   * Starting position of the coin
   */
  start: Position;

  /**
   * Ending position of the coin
   */
  end: Position;

  /**
   * Duration of the flight animation in seconds
   * @default 0.8
   */
  duration?: number;

  /**
   * Size of the coin in pixels
   * @default 24
   */
  coinSize?: number;

  /**
   * Color of the coin
   * @default '#ffff00' (yellow/gold)
   */
  color?: string;

  /**
   * Callback when coin reaches destination
   */
  onArrive?: () => void;

  /**
   * Callback when animation fully completes
   */
  onComplete?: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;
}
