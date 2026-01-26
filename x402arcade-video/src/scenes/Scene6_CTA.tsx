import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors } from '../lib/designTokens';
import { fadeIn, scaleUp } from '../lib/animations';
import { NoiseOverlay } from '../components/NoiseOverlay';
import { GlowText } from '../components/GlowText';
import { GradientText } from '../components/GradientText';

/**
 * Scene 6: CTA (55-60s)
 * Logo reveal + call to action
 */
export const Scene6_CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo reveal
  const logoOpacity = fadeIn(frame, fps, 0.8, 0);
  const logoScale = scaleUp(frame, fps, 1, 0);

  // Tagline
  const taglineOpacity = fadeIn(frame, fps, 0.6, 1);

  // Links
  const linksOpacity = fadeIn(frame, fps, 0.6, 2);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${colors.bgPrimary} 0%, #1a0f1f 100%)`,
      }}
    >
      <NoiseOverlay />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 50,
        }}
      >
        {/* Logo */}
        <div
          style={{
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
          }}
        >
          <GradientText fontSize={120} fontWeight={900}>
            x402Arcade
          </GradientText>
        </div>

        {/* Tagline */}
        <div style={{ opacity: taglineOpacity }}>
          <GlowText
            fontSize={42}
            fontFamily="body"
            glow="cyan"
            style={{
              fontWeight: 600,
              textAlign: 'center',
              maxWidth: 1000,
            }}
          >
            The killer app for x402 Protocol
          </GlowText>
        </div>

        {/* Links */}
        <div
          style={{
            opacity: linksOpacity,
            display: 'flex',
            flexDirection: 'column',
            gap: 25,
            marginTop: 30,
          }}
        >
          <GlowText fontSize={32} fontFamily="mono" glow="green" style={{ textAlign: 'center' }}>
            x402arcade.vercel.app
          </GlowText>

          <GlowText
            fontSize={28}
            fontFamily="mono"
            glow="none"
            color={colors.textSecondary}
            style={{ textAlign: 'center' }}
          >
            github.com/Ayobalen/x402Arcade
          </GlowText>
        </div>

        {/* Final message */}
        <div style={{ opacity: linksOpacity, marginTop: 40 }}>
          <GlowText
            fontSize={36}
            fontFamily="body"
            glow="magenta"
            style={{ fontWeight: 700, textAlign: 'center' }}
          >
            Built for DoraHacks x Cronos
          </GlowText>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
