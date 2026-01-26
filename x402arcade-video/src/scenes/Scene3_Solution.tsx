import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, glows } from '../lib/designTokens';
import { fadeIn, scaleUp, slideUp, stagger } from '../lib/animations';
import { NoiseOverlay } from '../components/NoiseOverlay';
import { GlowText } from '../components/GlowText';

/**
 * Scene 3: THE SOLUTION (10-20s)
 * x402 Protocol benefits with animated cards
 */
export const Scene3_Solution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title
  const titleOpacity = fadeIn(frame, fps, 0.6, 0);

  // Benefits (staggered reveals)
  const benefits = [
    {
      title: 'Gasless Payments',
      desc: 'Zero gas fees for users',
      glow: 'cyan' as const,
      delay: 1,
    },
    {
      title: '200x Cost Reduction',
      desc: '$0.01 games now viable',
      glow: 'green' as const,
      delay: 1.5,
    },
    {
      title: 'Consumer-Ready UX',
      desc: 'No Web3 jargon',
      glow: 'magenta' as const,
      delay: 2,
    },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bgPrimary }}>
      <NoiseOverlay />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 80,
        }}
      >
        {/* Title */}
        <div style={{ opacity: titleOpacity, marginBottom: 80 }}>
          <GlowText fontSize={64} fontFamily="display" glow="cyan">
            x402 Protocol
          </GlowText>
        </div>

        {/* Benefit cards */}
        <div
          style={{
            display: 'flex',
            gap: 40,
            maxWidth: 1400,
          }}
        >
          {benefits.map((benefit, i) => {
            const cardOpacity = fadeIn(frame, fps, 0.5, stagger(i, 0.5) + benefit.delay);
            const cardScale = scaleUp(frame, fps, 0.6, stagger(i, 0.5) + benefit.delay);
            const cardY = slideUp(frame, fps, 0.6, stagger(i, 0.5) + benefit.delay, 30);

            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  opacity: cardOpacity,
                  transform: `scale(${cardScale}) translateY(${cardY}px)`,
                }}
              >
                <div
                  style={{
                    backgroundColor: colors.bgSecondary,
                    border: `2px solid ${benefit.glow === 'cyan' ? colors.primary : benefit.glow === 'green' ? colors.success : colors.secondary}`,
                    borderRadius: 16,
                    padding: 40,
                    boxShadow:
                      benefit.glow === 'cyan'
                        ? glows.cyanLg
                        : benefit.glow === 'green'
                          ? glows.greenLg
                          : glows.magentaLg,
                    height: 280,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                  }}
                >
                  <GlowText
                    fontSize={42}
                    fontFamily="display"
                    glow={benefit.glow}
                    style={{ fontWeight: 700, marginBottom: 20 }}
                  >
                    {benefit.title}
                  </GlowText>
                  <GlowText
                    fontSize={28}
                    fontFamily="body"
                    glow="none"
                    color={colors.textSecondary}
                  >
                    {benefit.desc}
                  </GlowText>
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
