import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  Video,
  staticFile,
  interpolate,
  Sequence,
  Easing,
} from 'remotion';
import { colors } from '../lib/designTokens';
import { GlowText } from '../components/GlowText';

/**
 * Scene 4: LIVE DEMO (47s = 1410 frames @ 30fps)
 * Shows the full user journey - FULL SCREEN, no border
 *
 * Timeline (in video):
 * 0-5s: Landing page
 * 5-12s: Game selection
 * 12-22s: Wallet connection/payment
 * 22-42s: Gameplay (Tetris)
 * 42-47s: Game Over
 */

// Persistent overlay component - shows gas fee and speed
const MetricOverlay: React.FC<{
  frame: number;
  startFrame: number;
}> = ({ frame, startFrame }) => {
  const localFrame = frame - startFrame;

  // Fade in
  const opacity = interpolate(localFrame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Pulse animation for the checkmarks
  const pulse = Math.sin(localFrame * 0.1) * 0.1 + 1;

  return (
    <div
      style={{
        position: 'absolute',
        top: 30,
        right: 30,
        backgroundColor: 'rgba(10, 10, 15, 0.85)',
        border: `1px solid ${colors.primary}40`,
        borderRadius: 12,
        padding: '14px 20px',
        opacity,
        boxShadow: `0 0 20px rgba(0, 255, 255, 0.15)`,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              color: colors.success,
              fontSize: 18,
              transform: `scale(${pulse})`,
            }}
          >
            ✓
          </span>
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 16,
              color: colors.textPrimary,
            }}
          >
            Gas Fee: <span style={{ color: colors.success, fontWeight: 700 }}>$0.00</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              color: colors.success,
              fontSize: 18,
              transform: `scale(${pulse})`,
            }}
          >
            ✓
          </span>
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 16,
              color: colors.textPrimary,
            }}
          >
            Settlement: <span style={{ color: colors.success, fontWeight: 700 }}>&lt;1 sec</span>
          </span>
        </div>
      </div>
    </div>
  );
};

// Step indicator component - more subtle
const StepIndicator: React.FC<{
  frame: number;
  startFrame: number;
  step: number;
  label: string;
}> = ({ frame, startFrame, step, label }) => {
  const localFrame = frame - startFrame;

  // Slide in from left
  const translateX = interpolate(localFrame, [0, 20], [-150, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const opacity = interpolate(localFrame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Fade out
  const fadeOut = interpolate(localFrame, [90, 120], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 40,
        left: 30,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        opacity: opacity * fadeOut,
        transform: `translateX(${translateX}px)`,
        backgroundColor: 'rgba(10, 10, 15, 0.85)',
        padding: '10px 20px 10px 14px',
        borderRadius: 30,
        border: `1px solid ${colors.primary}40`,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          backgroundColor: colors.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: 18,
            fontWeight: 700,
            color: colors.bgPrimary,
          }}
        >
          {step}
        </span>
      </div>
      <span
        style={{
          fontFamily: 'Orbitron, sans-serif',
          fontSize: 20,
          fontWeight: 600,
          color: colors.textPrimary,
        }}
      >
        {label}
      </span>
    </div>
  );
};

export const Scene4_Demo: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bgPrimary }}>
      {/* Full screen video - NO BORDER, NO CROP */}
      <AbsoluteFill
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.bgPrimary,
        }}
      >
        <Video
          src={staticFile('screen-demo-fixed.mp4')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain', // Show full video without cropping
          }}
        />
      </AbsoluteFill>

      {/* Metric overlay - appears after 60 frames (2s) */}
      {frame > 60 && <MetricOverlay frame={frame} startFrame={60} />}

      {/* Step indicators at key moments */}

      {/* Step 1: Landing (0-5s = frames 0-150) */}
      <Sequence from={0} durationInFrames={150}>
        <StepIndicator frame={frame} startFrame={0} step={1} label="Landing Page" />
      </Sequence>

      {/* Step 2: Select Game (5-12s = frames 150-360) */}
      <Sequence from={150} durationInFrames={210}>
        <StepIndicator frame={frame} startFrame={150} step={2} label="Select Game" />
      </Sequence>

      {/* Step 3: Pay $0.01 (12-22s = frames 360-660) */}
      <Sequence from={360} durationInFrames={300}>
        <StepIndicator frame={frame} startFrame={360} step={3} label="Pay $0.01 USDC" />
      </Sequence>

      {/* Step 4: Play! (22-45s = frames 660-1350) */}
      <Sequence from={660} durationInFrames={690}>
        <StepIndicator frame={frame} startFrame={660} step={4} label="Play!" />
      </Sequence>

      {/* Step 5: Score & Rank (45-47s = frames 1350-1410) */}
      <Sequence from={1350} durationInFrames={60}>
        <StepIndicator frame={frame} startFrame={1350} step={5} label="Score Posted!" />
      </Sequence>

      {/* x402Arcade branding - bottom right, subtle */}
      <div
        style={{
          position: 'absolute',
          bottom: 45,
          right: 30,
          opacity: 0.7,
          backgroundColor: 'rgba(10, 10, 15, 0.6)',
          padding: '6px 14px',
          borderRadius: 6,
        }}
      >
        <GlowText fontSize={18} fontFamily="display" glow="cyan">
          x402Arcade
        </GlowText>
      </div>
    </AbsoluteFill>
  );
};
