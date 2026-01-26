import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors } from '../lib/designTokens';
import { fadeIn, glitch, scaleUp } from '../lib/animations';
import { NoiseOverlay } from '../components/NoiseOverlay';
import { GradientText } from '../components/GradientText';
import { GlowText } from '../components/GlowText';

/**
 * Scene 1: HOOK (0-3s)
 * "$0.01" glitches onto screen with dramatic reveal
 * Message: "What if you could play a blockchain game for a penny?"
 */
export const Scene1_Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Main number reveal
  const numberOpacity = fadeIn(frame, fps, 0.6, 0.2);
  const numberScale = scaleUp(frame, fps, 0.8, 0.2, 0.5, 1);

  // Glitch effect in first few frames
  const glitchX = frame < 15 ? glitch(frame, fps, 8) : 0;

  // Subtitle fade in
  const subtitleY = fadeIn(frame, fps, 0.4, 1) * 40; // Slide up from 40px

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${colors.bgPrimary} 0%, #1a0f1f 100%)`,
      }}
    >
      <NoiseOverlay />

      {/* Content */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Main number */}
        <div
          style={{
            opacity: numberOpacity,
            transform: `scale(${numberScale}) translateX(${glitchX}px)`,
          }}
        >
          <GradientText fontSize={180} fontWeight={900}>
            $0.01
          </GradientText>
        </div>

        {/* Subtitle */}
        <div
          style={{
            opacity: 1 - subtitleY / 40, // Fade as it slides
            transform: `translateY(${subtitleY}px)`,
            marginTop: 40,
          }}
        >
          <GlowText
            fontSize={42}
            fontFamily="body"
            glow="cyan"
            style={{
              fontWeight: 600,
              textAlign: 'center',
              maxWidth: 900,
            }}
          >
            to play a blockchain game
          </GlowText>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
