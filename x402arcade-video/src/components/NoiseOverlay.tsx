import React from 'react';
import { useCurrentFrame } from 'remotion';

/**
 * Noise texture overlay - signature x402Arcade element
 * Using CSS filter for maximum compatibility with Remotion rendering
 */
export const NoiseOverlay: React.FC = () => {
  const frame = useCurrentFrame();

  // Animate noise slightly per frame for more organic feel
  const noiseOffset = (frame * 0.5) % 100;

  return (
    <>
      {/* Grain texture using repeating gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 100,
          opacity: 0.15,
          background: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(255, 255, 255, 0.05) 2px,
              rgba(255, 255, 255, 0.05) 4px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 2px,
              rgba(255, 255, 255, 0.05) 2px,
              rgba(255, 255, 255, 0.05) 4px
            )
          `,
          backgroundPosition: `${noiseOffset}px ${noiseOffset}px`,
        }}
      />

      {/* Additional grain using CSS filter */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 101,
          opacity: 0.25,
          mixBlendMode: 'overlay',
          filter: 'contrast(200%) brightness(150%)',
          background: `
            radial-gradient(circle at 20% 50%, rgba(255,255,255,0.02) 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, rgba(255,255,255,0.02) 0%, transparent 50%),
            radial-gradient(circle at 50% 20%, rgba(255,255,255,0.02) 0%, transparent 50%),
            radial-gradient(circle at 50% 80%, rgba(255,255,255,0.02) 0%, transparent 50%)
          `,
        }}
      />
    </>
  );
};
