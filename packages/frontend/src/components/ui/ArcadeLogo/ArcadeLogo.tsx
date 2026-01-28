/**
 * ArcadeLogo Component
 *
 * The x402 Arcade logo - a minimalist arcade cabinet with a coin being inserted.
 * Uses currentColor to automatically adapt to any theme's primary color.
 *
 * Design concept:
 * - Geometric arcade cabinet silhouette
 * - Floating diamond coin mid-insertion
 * - Represents "Insert a Penny, Play for Glory"
 */

import { cn } from '@/lib/utils';

interface ArcadeLogoProps {
  /** Additional CSS classes */
  className?: string;
  /** Size in pixels (width = height) */
  size?: number;
  /** Accessible label */
  'aria-label'?: string;
}

/**
 * x402 Arcade Logo
 *
 * A minimalist arcade cabinet with coin insertion animation support.
 * Automatically inherits theme colors via currentColor.
 *
 * @example
 * // Basic usage - inherits color from parent
 * <ArcadeLogo size={32} />
 *
 * @example
 * // With explicit color
 * <ArcadeLogo size={48} className="text-cyan-400" />
 */
export function ArcadeLogo({
  className,
  size = 24,
  'aria-label': ariaLabel = 'x402 Arcade',
}: ArcadeLogoProps) {
  return (
    <svg
      className={cn('flex-shrink-0', className)}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="currentColor"
      aria-label={ariaLabel}
      role="img"
    >
      {/* Arcade Cabinet Body */}
      <path
        d="M6 4h12l6 8v16H6V4z"
        fillRule="evenodd"
        clipRule="evenodd"
      />
      {/* Screen cutout (negative space) */}
      <path
        d="M8 6h8l4 5v7H8V6z"
        fill="var(--color-bg-main, #0a0a0f)"
      />
      {/* Coin - rotated square */}
      <rect
        x="20"
        y="2"
        width="8"
        height="8"
        rx="1"
        transform="rotate(15 24 6)"
      />
    </svg>
  );
}

/**
 * Simplified logo for very small sizes (favicon, etc.)
 * Removes fine details that don't scale well
 */
export function ArcadeLogoSimple({
  className,
  size = 24,
  'aria-label': ariaLabel = 'x402 Arcade',
}: ArcadeLogoProps) {
  return (
    <svg
      className={cn('flex-shrink-0', className)}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="currentColor"
      aria-label={ariaLabel}
      role="img"
    >
      {/* Simplified cabinet shape */}
      <path
        d="M4 2h14l8 10v18H4V2z"
        fillRule="evenodd"
      />
      {/* Coin */}
      <rect
        x="19"
        y="0"
        width="10"
        height="10"
        rx="1.5"
        transform="rotate(20 24 5)"
      />
    </svg>
  );
}

ArcadeLogo.displayName = 'ArcadeLogo';
ArcadeLogoSimple.displayName = 'ArcadeLogoSimple';

export default ArcadeLogo;
