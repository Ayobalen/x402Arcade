/**
 * ParticleBurst Component Types
 *
 * Props for the particle burst effect component that creates
 * particles bursting outward from a point, typically on hover.
 */

/**
 * Individual particle data
 */
export interface Particle {
  id: string;
  angle: number;
  distance: number;
  size: number;
}

/**
 * Props for the ParticleBurst component
 */
export interface ParticleBurstProps {
  /**
   * Number of particles to burst
   * @default 12
   */
  particleCount?: number;

  /**
   * Color of the particles
   * @default '#00ffff' (cyan from design system)
   */
  color?: string;

  /**
   * Duration of the burst animation in seconds
   * @default 0.8
   */
  duration?: number;

  /**
   * Maximum distance particles travel in pixels
   * @default 50
   */
  distance?: number;

  /**
   * Size of each particle in pixels
   * @default 4
   */
  particleSize?: number;

  /**
   * X position of the burst origin
   */
  x: number;

  /**
   * Y position of the burst origin
   */
  y: number;

  /**
   * Callback when burst animation completes
   */
  onComplete?: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;
}
