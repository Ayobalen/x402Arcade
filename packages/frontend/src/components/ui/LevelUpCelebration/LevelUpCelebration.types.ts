/**
 * LevelUpCelebration Component Types
 *
 * Props for the level up celebration effect that shows confetti,
 * screen flash, and celebratory text when player levels up.
 */

/**
 * Props for the LevelUpCelebration component
 */
export interface LevelUpCelebrationProps {
  /**
   * The new level number
   */
  level: number;

  /**
   * Duration of the celebration in seconds
   * @default 2.5
   */
  duration?: number;

  /**
   * Whether to show the screen flash effect
   * @default true
   */
  showFlash?: boolean;

  /**
   * Number of confetti particles
   * @default 50
   */
  particleCount?: number;

  /**
   * Callback to trigger sound effect
   * Pass your sound effect player here
   */
  onSoundTrigger?: () => void;

  /**
   * Callback when celebration completes
   */
  onComplete?: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Individual confetti particle data
 */
export interface ConfettiParticle {
  id: string;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  velocity: {
    x: number;
    y: number;
  };
}
