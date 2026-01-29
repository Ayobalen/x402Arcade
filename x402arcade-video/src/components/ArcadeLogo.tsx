import React from 'react';
import { interpolate, useCurrentFrame, Easing } from 'remotion';
import { colors } from '../lib/designTokens';

/**
 * ArcadeLogo Component for Remotion
 *
 * The x402 Arcade logo - a minimalist arcade cabinet with a coin being inserted.
 * Adapted from frontend component with animation support.
 */

interface ArcadeLogoProps {
  /** Size in pixels (width = height) */
  size?: number;
  /** Fill color */
  color?: string;
  /** Whether to animate the coin */
  animateCoin?: boolean;
  /** Start frame for animation */
  startFrame?: number;
  /** Animation duration in frames */
  duration?: number;
}

export const ArcadeLogo: React.FC<ArcadeLogoProps> = ({
  size = 200,
  color = colors.primary,
  animateCoin = true,
  startFrame = 0,
  duration = 30,
}) => {
  const frame = useCurrentFrame();

  // Coin drop animation
  const coinProgress = animateCoin
    ? interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.cubic),
      })
    : 1;

  // Coin starts above and drops down
  const coinY = interpolate(coinProgress, [0, 1], [-15, 2]);
  const coinOpacity = interpolate(coinProgress, [0, 0.3, 1], [0, 1, 1]);
  const coinRotation = 15 + interpolate(coinProgress, [0, 1], [30, 0]);

  // Cabinet fade in
  const cabinetOpacity = animateCoin
    ? interpolate(frame, [startFrame, startFrame + 15], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 1;

  // Glow pulse
  const glowPulse = Math.sin(frame * 0.1) * 0.2 + 0.8;

  return (
    <div
      style={{
        filter: `drop-shadow(0 0 ${20 * glowPulse}px ${color}50)`,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill={color}
        aria-label="x402 Arcade"
        role="img"
      >
        {/* Arcade Cabinet Body */}
        <path
          d="M6 4h12l6 8v16H6V4z"
          fillRule="evenodd"
          clipRule="evenodd"
          style={{ opacity: cabinetOpacity }}
        />
        {/* Screen cutout (negative space) */}
        <path d="M8 6h8l4 5v7H8V6z" fill={colors.bgPrimary} style={{ opacity: cabinetOpacity }} />
        {/* Coin - animated drop */}
        <rect
          x="20"
          y={coinY}
          width="8"
          height="8"
          rx="1"
          transform={`rotate(${coinRotation} 24 ${coinY + 4})`}
          style={{ opacity: coinOpacity }}
        />
      </svg>
    </div>
  );
};

export default ArcadeLogo;
