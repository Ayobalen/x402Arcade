/**
 * PowerUpGlow Component Types
 *
 * Props for the power-up activation glow effect that pulses
 * while a power-up is active and fades out when it ends.
 */

/**
 * Props for the PowerUpGlow component
 */
export interface PowerUpGlowProps {
  /**
   * Whether the power-up is currently active
   */
  isActive: boolean;

  /**
   * Color of the glow effect
   * @default '#00ffff' (cyan)
   */
  color?: string;

  /**
   * Duration of the power-up in seconds (for fade-out timing)
   * @default 10
   */
  duration?: number;

  /**
   * Pulse rhythm speed in seconds
   * @default 1.0
   */
  pulseSpeed?: number;

  /**
   * Intensity of the glow (0-1)
   * @default 0.8
   */
  intensity?: number;

  /**
   * Callback when power-up expires
   */
  onExpire?: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Child elements to wrap with glow
   */
  children?: React.ReactNode;
}
