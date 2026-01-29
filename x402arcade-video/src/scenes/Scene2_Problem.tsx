import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import { colors } from '../lib/designTokens';
import { NoiseOverlay } from '../components/NoiseOverlay';
import { GlowText } from '../components/GlowText';

/**
 * Scene 2: THE PROBLEM (3s = 90 frames @ 30fps)
 * Fast gas fee comparison - punchy and clear
 */
export const Scene2_Problem: React.FC = () => {
  const frame = useCurrentFrame();

  // Fast staggered reveals
  const gameOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const plusOpacity = interpolate(frame, [8, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const gasOpacity = interpolate(frame, [15, 25], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const totalOpacity = interpolate(frame, [30, 40], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const totalScale = interpolate(frame, [30, 45], [0.8, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(2)),
  });

  // Shake the total for emphasis
  const shakeX = frame > 40 && frame < 60 ? Math.sin(frame * 3) * 4 : 0;

  // "200x" message
  const messageOpacity = interpolate(frame, [55, 65], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bgPrimary }}>
      <NoiseOverlay opacity={0.03} />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        }}
      >
        {/* Row 1: Game cost + Gas fee */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 30,
          }}
        >
          <div style={{ opacity: gameOpacity }}>
            <GlowText fontSize={52} fontFamily="mono" glow="green">
              $0.01
            </GlowText>
          </div>

          <div style={{ opacity: plusOpacity }}>
            <GlowText fontSize={48} glow="none" color={colors.textSecondary}>
              +
            </GlowText>
          </div>

          <div style={{ opacity: gasOpacity }}>
            <GlowText fontSize={52} fontFamily="mono" glow="red">
              $2.00 gas
            </GlowText>
          </div>
        </div>

        {/* Row 2: Total */}
        <div
          style={{
            opacity: totalOpacity,
            transform: `scale(${totalScale}) translateX(${shakeX}px)`,
            marginTop: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <GlowText fontSize={48} glow="none" color={colors.textSecondary}>
            =
          </GlowText>
          <GlowText fontSize={72} fontFamily="mono" glow="red" style={{ fontWeight: 900 }}>
            $2.01
          </GlowText>
        </div>

        {/* Message */}
        <div style={{ opacity: messageOpacity, marginTop: 40 }}>
          <GlowText fontSize={48} fontFamily="display" glow="red" style={{ fontWeight: 700 }}>
            200x THE COST
          </GlowText>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
