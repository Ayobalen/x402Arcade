import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { colors, glows } from '../lib/designTokens';
import { fadeIn, scaleUp } from '../lib/animations';
import { NoiseOverlay } from '../components/NoiseOverlay';
import { GlowText } from '../components/GlowText';

/**
 * Scene 5: IMPACT (45-55s)
 * Key metrics showing the breakthrough
 */
export const Scene5_Impact: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title
  const titleOpacity = fadeIn(frame, fps, 0.6, 0);

  // Metrics (grid layout with stagger)
  const metrics = [
    {
      value: '200x',
      label: 'Cost Reduction',
      glow: 'green' as const,
      delay: 1,
    },
    {
      value: '$0.01',
      label: 'Per Game',
      glow: 'cyan' as const,
      delay: 1.3,
    },
    {
      value: '0%',
      label: 'Gas Fees',
      glow: 'magenta' as const,
      delay: 1.6,
    },
    {
      value: '100%',
      label: 'On-Chain',
      glow: 'cyan' as const,
      delay: 1.9,
    },
  ];

  // Counter animation for numbers
  const getCounterValue = (targetValue: string, delay: number) => {
    const startFrame = delay * fps;
    const duration = 1; // 1 second count-up
    const progress = interpolate(frame, [startFrame, startFrame + duration * fps], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

    if (targetValue === '200x') {
      return Math.floor(progress * 200) + 'x';
    } else if (targetValue === '$0.01') {
      return '$' + (progress * 0.01).toFixed(2);
    } else if (targetValue === '0%') {
      return Math.floor(progress * 0) + '%';
    } else if (targetValue === '100%') {
      return Math.floor(progress * 100) + '%';
    }
    return targetValue;
  };

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
            The Impact
          </GlowText>
        </div>

        {/* Metrics grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 40,
            maxWidth: 1200,
          }}
        >
          {metrics.map((metric, i) => {
            const cardOpacity = fadeIn(frame, fps, 0.5, metric.delay);
            const cardScale = scaleUp(frame, fps, 0.6, metric.delay);
            const counterValue = getCounterValue(metric.value, metric.delay);

            return (
              <div
                key={i}
                style={{
                  opacity: cardOpacity,
                  transform: `scale(${cardScale})`,
                }}
              >
                <div
                  style={{
                    backgroundColor: colors.bgSecondary,
                    border: `2px solid ${
                      metric.glow === 'cyan'
                        ? colors.primary
                        : metric.glow === 'green'
                          ? colors.success
                          : colors.secondary
                    }`,
                    borderRadius: 16,
                    padding: 50,
                    boxShadow:
                      metric.glow === 'cyan'
                        ? glows.cyanLg
                        : metric.glow === 'green'
                          ? glows.greenLg
                          : glows.magentaLg,
                    minHeight: 220,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                  }}
                >
                  <GlowText
                    fontSize={80}
                    fontFamily="display"
                    glow={metric.glow}
                    style={{ fontWeight: 900, marginBottom: 20 }}
                  >
                    {counterValue}
                  </GlowText>
                  <GlowText
                    fontSize={32}
                    fontFamily="body"
                    glow="none"
                    color={colors.textSecondary}
                  >
                    {metric.label}
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
