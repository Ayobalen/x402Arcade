import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors } from '../lib/designTokens';
import { fadeIn, scaleUp, shake, stagger } from '../lib/animations';
import { NoiseOverlay } from '../components/NoiseOverlay';
import { GlowText } from '../components/GlowText';

/**
 * Scene 2: THE PROBLEM (3-10s)
 * Math equation showing gas fee absurdity
 */
export const Scene2_Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Staggered reveals
  const line1Opacity = fadeIn(frame, fps, 0.5, stagger(0, 0.2));
  const line2Opacity = fadeIn(frame, fps, 0.5, stagger(1, 0.2));
  const line3Opacity = fadeIn(frame, fps, 0.5, stagger(2, 0.2));
  const line4Opacity = fadeIn(frame, fps, 0.5, stagger(3, 0.2));
  const explosionScale = scaleUp(frame, fps, 0.8, stagger(3, 0.2), 0.3, 1.2);

  // Shake effect on total
  const shakeX = frame > 120 ? shake(frame, fps, 120, 0.4) : 0;

  // Final message
  const finalOpacity = fadeIn(frame, fps, 0.6, 4);

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bgPrimary }}>
      <NoiseOverlay />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
        }}
      >
        {/* Game cost */}
        <div style={{ opacity: line1Opacity }}>
          <GlowText fontSize={48} fontFamily="mono" glow="green">
            $0.01 game
          </GlowText>
        </div>

        {/* Plus */}
        <div style={{ opacity: line2Opacity }}>
          <GlowText fontSize={56} glow="none" color={colors.textSecondary}>
            +
          </GlowText>
        </div>

        {/* Gas fee */}
        <div style={{ opacity: line3Opacity }}>
          <GlowText fontSize={48} fontFamily="mono" glow="red">
            $2.00 gas fee
          </GlowText>
        </div>

        {/* Equals */}
        <div style={{ opacity: line4Opacity, marginTop: 20 }}>
          <GlowText fontSize={56} glow="none" color={colors.textSecondary}>
            =
          </GlowText>
        </div>

        {/* Total (absurd) */}
        <div
          style={{
            opacity: line4Opacity,
            transform: `scale(${explosionScale}) translateX(${shakeX}px)`,
          }}
        >
          <GlowText fontSize={72} fontFamily="mono" glow="red" style={{ fontWeight: 900 }}>
            $2.01 💥
          </GlowText>
        </div>

        {/* Final message */}
        <div style={{ opacity: finalOpacity, marginTop: 60 }}>
          <GlowText fontSize={42} fontFamily="body" glow="red" style={{ fontWeight: 700 }}>
            200x MORE EXPENSIVE
          </GlowText>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
