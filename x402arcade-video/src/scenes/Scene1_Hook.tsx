import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import { colors } from '../lib/designTokens';
import { NoiseOverlay } from '../components/NoiseOverlay';
import { GradientText } from '../components/GradientText';
import { GlowText } from '../components/GlowText';

/**
 * Scene 1: HOOK (2s = 60 frames @ 30fps)
 * "$0.01" punches onto screen - fast and impactful
 */
export const Scene1_Hook: React.FC = () => {
  const frame = useCurrentFrame();

  // Fast number reveal with punch
  const numberOpacity = interpolate(frame, [0, 8], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const numberScale = interpolate(frame, [0, 8, 15], [0.5, 1.05, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Quick glitch effect
  const glitchX = frame < 8 ? Math.sin(frame * 5) * 10 : 0;

  // Subtitle appears right after
  const subtitleOpacity = interpolate(frame, [12, 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const subtitleY = interpolate(frame, [12, 22], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at center, #1a1a2e 0%, ${colors.bgPrimary} 70%)`,
      }}
    >
      <NoiseOverlay opacity={0.03} />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Main number - BIG and punchy */}
        <div
          style={{
            opacity: numberOpacity,
            transform: `scale(${numberScale}) translateX(${glitchX}px)`,
          }}
        >
          <GradientText fontSize={220} fontWeight={900}>
            $0.01
          </GradientText>
        </div>

        {/* Subtitle - quick and clean */}
        <div
          style={{
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
            marginTop: 30,
          }}
        >
          <GlowText
            fontSize={48}
            fontFamily="body"
            glow="cyan"
            style={{
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            to play on blockchain
          </GlowText>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
