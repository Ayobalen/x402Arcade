import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import { colors, glows } from '../lib/designTokens';
import { NoiseOverlay } from '../components/NoiseOverlay';
import { GlowText } from '../components/GlowText';
import { GradientText } from '../components/GradientText';
import { ArcadeLogo } from '../components/ArcadeLogo';

/**
 * Scene 3: Solution (5s = 150 frames @ 30fps)
 * Staggered reveal - each element gets its moment
 *
 * Timeline:
 * 0-45:   "Not anymore." (fade in, hold, fade out)
 * 40-75:  Logo + x402Arcade name (scale up with bounce)
 * 70-105: "powered by x402 + Cronos" (slide in from bottom)
 * 100-150: "$0.00 gas fees" badge (pop with glow pulse)
 */
export const Scene3_Solution: React.FC = () => {
  const frame = useCurrentFrame();

  // ========================================
  // 1. "Not anymore." - dramatic entrance
  // ========================================
  const notAnymoreOpacity = interpolate(frame, [0, 12, 35, 50], [0, 1, 1, 0], {
    extrapolateRight: 'clamp',
  });
  const notAnymoreScale = interpolate(frame, [0, 15], [0.7, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(2)),
  });
  const notAnymoreY = interpolate(frame, [0, 15], [30, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // ========================================
  // 2. Logo + Name - bounce in
  // ========================================
  const logoOpacity = interpolate(frame, [45, 55], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const logoScale = interpolate(frame, [45, 65], [0.3, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(2.5)),
  });
  const logoY = interpolate(frame, [45, 65], [-50, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // ========================================
  // 3. "powered by x402 + Cronos" - slide up
  // ========================================
  const poweredByOpacity = interpolate(frame, [75, 85], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const poweredByY = interpolate(frame, [75, 95], [40, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // ========================================
  // 4. "$0.00 gas fees" badge - pop with glow
  // ========================================
  const badgeOpacity = interpolate(frame, [105, 115], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const badgeScale = interpolate(frame, [105, 125], [0.5, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(3)),
  });
  // Glow intensifies after appearance
  const badgeGlow = interpolate(frame, [115, 130, 145], [0.5, 1.5, 1], {
    extrapolateRight: 'clamp',
  });

  // Overall glow pulse for logo
  const glowPulse = Math.sin(frame * 0.15) * 0.2 + 1;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at center, #1a1a2e 0%, ${colors.bgPrimary} 70%)`,
      }}
    >
      <NoiseOverlay opacity={0.03} />

      {/* 1. "Not anymore." - centered, dramatic */}
      <AbsoluteFill
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: notAnymoreOpacity,
          transform: `scale(${notAnymoreScale}) translateY(${notAnymoreY}px)`,
        }}
      >
        <GlowText
          fontSize={90}
          fontFamily="display"
          glow="cyan"
          style={{ fontWeight: 700, letterSpacing: '-0.02em' }}
        >
          Not anymore.
        </GlowText>
      </AbsoluteFill>

      {/* Container for solution elements (logo, powered by, badge) */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
        }}
      >
        {/* 2. Logo + Name */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            opacity: logoOpacity,
            transform: `scale(${logoScale}) translateY(${logoY}px)`,
          }}
        >
          <div
            style={{
              filter: `drop-shadow(0 0 ${25 * glowPulse}px ${colors.primary}80)`,
            }}
          >
            <ArcadeLogo
              size={90}
              color={colors.primary}
              animateCoin={true}
              startFrame={45}
              duration={20}
            />
          </div>
          <GradientText fontSize={80} fontWeight={800}>
            x402Arcade
          </GradientText>
        </div>

        {/* 3. "powered by x402 + Cronos" */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            opacity: poweredByOpacity,
            transform: `translateY(${poweredByY}px)`,
          }}
        >
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 30,
              color: colors.textSecondary,
            }}
          >
            powered by
          </span>
          <span
            style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: 34,
              fontWeight: 700,
              color: colors.secondary,
              textShadow: glows.magenta,
            }}
          >
            x402
          </span>
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 30,
              color: colors.textSecondary,
            }}
          >
            +
          </span>
          <span
            style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: 34,
              fontWeight: 700,
              color: '#00D4FF',
              textShadow: '0 0 12px rgba(0, 212, 255, 0.6)',
            }}
          >
            Cronos
          </span>
        </div>

        {/* 4. "$0.00 gas fees" badge */}
        <div
          style={{
            marginTop: 16,
            padding: '18px 45px',
            borderRadius: 14,
            border: `2px solid ${colors.success}`,
            boxShadow: `0 0 ${30 * badgeGlow}px rgba(0, 255, 136, 0.4), 0 0 ${60 * badgeGlow}px rgba(0, 255, 136, 0.2)`,
            opacity: badgeOpacity,
            transform: `scale(${badgeScale})`,
            backgroundColor: 'rgba(0, 255, 136, 0.05)',
          }}
        >
          <GlowText fontSize={52} fontFamily="mono" glow="green" style={{ fontWeight: 700 }}>
            $0.00 gas fees
          </GlowText>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
