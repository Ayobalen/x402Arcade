import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors } from '../lib/designTokens';
import { fadeIn } from '../lib/animations';
import { NoiseOverlay } from '../components/NoiseOverlay';
import { GlowText } from '../components/GlowText';

/**
 * Scene 4: LIVE DEMO (20-45s)
 * Screen recording placeholder with instructional overlay
 */
export const Scene4_Demo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Fade in title
  const titleOpacity = fadeIn(frame, fps, 0.5, 0);

  // Fade out title after 2 seconds
  const titleFadeOut = frame > 60 ? Math.max(0, 1 - (frame - 60) / 30) : 1;

  // Instructions fade in after title fades
  const instructionsOpacity = fadeIn(frame, fps, 0.5, 2);

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bgPrimary }}>
      <NoiseOverlay />

      {/* Title overlay (first 2-3 seconds) */}
      <AbsoluteFill
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: titleOpacity * titleFadeOut,
          pointerEvents: 'none',
        }}
      >
        <GlowText fontSize={72} fontFamily="display" glow="cyan">
          Live Demo
        </GlowText>
      </AbsoluteFill>

      {/* Placeholder for screen recording */}
      <AbsoluteFill
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: instructionsOpacity,
        }}
      >
        <div
          style={{
            backgroundColor: colors.bgSecondary,
            border: `2px dashed ${colors.primary}`,
            borderRadius: 16,
            padding: 60,
            maxWidth: 1200,
            textAlign: 'center',
          }}
        >
          <GlowText fontSize={48} fontFamily="display" glow="cyan" style={{ marginBottom: 30 }}>
            Screen Recording Goes Here
          </GlowText>

          <GlowText
            fontSize={32}
            fontFamily="body"
            glow="none"
            color={colors.textSecondary}
            style={{ lineHeight: 1.6 }}
          >
            Record the following:
            <br />
            1. Connect wallet
            <br />
            2. Pay $0.01 USDC
            <br />
            3. Play Snake game
            <br />
            4. Show leaderboard
          </GlowText>

          <div style={{ marginTop: 40 }}>
            <GlowText fontSize={24} fontFamily="mono" glow="green" style={{ fontStyle: 'italic' }}>
              Duration: ~20-25 seconds
            </GlowText>
          </div>
        </div>
      </AbsoluteFill>

      {/* Optional: Subtle corner branding */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          right: 40,
          opacity: instructionsOpacity * 0.6,
        }}
      >
        <GlowText fontSize={28} fontFamily="display" glow="cyan">
          x402Arcade
        </GlowText>
      </div>
    </AbsoluteFill>
  );
};
