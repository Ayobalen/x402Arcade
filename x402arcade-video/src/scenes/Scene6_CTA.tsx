import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import { colors } from '../lib/designTokens';
import { NoiseOverlay } from '../components/NoiseOverlay';
import { GlowText } from '../components/GlowText';
import { GradientText } from '../components/GradientText';
import { ArcadeLogo } from '../components/ArcadeLogo';

/**
 * Scene 6: CTA (3s = 90 frames @ 30fps)
 * Logo reveal + call to action - punchy ending
 */
export const Scene6_CTA: React.FC = () => {
  const frame = useCurrentFrame();

  // Logo reveal - fast and punchy
  const logoOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const logoScale = interpolate(frame, [0, 15], [0.8, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(1.5)),
  });

  // Text reveal
  const textOpacity = interpolate(frame, [10, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Links
  const linksOpacity = interpolate(frame, [20, 30], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Hackathon badge
  const badgeOpacity = interpolate(frame, [30, 40], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Glow pulse for logo
  const glowPulse = Math.sin(frame * 0.15) * 0.3 + 1;

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
          gap: 30,
        }}
      >
        {/* Logo + Name Row */}
        <div
          style={{
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
            display: 'flex',
            alignItems: 'center',
            gap: 30,
          }}
        >
          {/* Arcade Logo */}
          <div
            style={{
              filter: `drop-shadow(0 0 ${25 * glowPulse}px ${colors.primary}80)`,
            }}
          >
            <ArcadeLogo
              size={120}
              color={colors.primary}
              animateCoin={true}
              startFrame={0}
              duration={20}
            />
          </div>

          {/* Name */}
          <GradientText fontSize={100} fontWeight={900}>
            x402Arcade
          </GradientText>
        </div>

        {/* Tagline */}
        <div style={{ opacity: textOpacity }}>
          <GlowText fontSize={36} fontFamily="body" glow="cyan" style={{ fontWeight: 500 }}>
            $0.01 games • $0.00 gas fees
          </GlowText>
        </div>

        {/* Links */}
        <div
          style={{
            opacity: linksOpacity,
            display: 'flex',
            gap: 40,
            marginTop: 10,
          }}
        >
          <GlowText fontSize={26} fontFamily="mono" glow="green">
            x402arcade.vercel.app
          </GlowText>
          <GlowText fontSize={26} fontFamily="mono" glow="none" color={colors.textSecondary}>
            github.com/Ayobalen/x402Arcade
          </GlowText>
        </div>

        {/* Hackathon badge */}
        <div
          style={{
            opacity: badgeOpacity,
            marginTop: 20,
            padding: '12px 30px',
            borderRadius: 8,
            border: `2px solid ${colors.secondary}`,
            boxShadow: glows.magentaMd,
          }}
        >
          <GlowText fontSize={24} fontFamily="display" glow="magenta" style={{ fontWeight: 600 }}>
            DoraHacks x Cronos Hackathon
          </GlowText>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
