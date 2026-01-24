/**
 * Performance Scaling Stories
 *
 * Demonstrates the automatic performance scaling system that adjusts
 * visual effect quality based on frame rate.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { usePerformanceScaling } from '../packages/frontend/src/hooks/usePerformanceScaling';
import type { QualityLevel } from '../packages/frontend/src/hooks/usePerformanceScaling';

// ============================================================================
// Demo Component
// ============================================================================

interface PerformanceScalingDemoProps {
  enabled?: boolean;
  highQualityFps?: number;
  mediumQualityFps?: number;
  lowQualityFps?: number;
  hysteresis?: number;
  showStats?: boolean;
  manualQuality?: QualityLevel | null;
}

function PerformanceScalingDemo({
  enabled = true,
  highQualityFps = 50,
  mediumQualityFps = 35,
  lowQualityFps = 20,
  hysteresis = 3,
  showStats = true,
  manualQuality = null,
}: PerformanceScalingDemoProps) {
  const { quality, settings, stats, setManualQuality, enableAutoScaling } =
    usePerformanceScaling({
      enabled,
      highQualityFps,
      mediumQualityFps,
      lowQualityFps,
      hysteresis,
      checkInterval: 1000, // Check more frequently for demo
    });

  // Apply manual override if provided
  React.useEffect(() => {
    if (manualQuality !== null) {
      setManualQuality(manualQuality);
    } else {
      enableAutoScaling();
    }
  }, [manualQuality, setManualQuality, enableAutoScaling]);

  const qualityColors: Record<QualityLevel, string> = {
    high: '#00ff00',
    medium: '#ffff00',
    low: '#ff8800',
    minimal: '#ff0000',
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', color: '#fff' }}>
      <h1 style={{ marginBottom: '2rem' }}>Performance Scaling System</h1>

      {/* Quality Indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: qualityColors[quality],
            boxShadow: `0 0 20px ${qualityColors[quality]}`,
          }}
        />
        <div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
            {quality} Quality
          </div>
          <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>
            {manualQuality ? 'Manual Override' : 'Auto-Scaled'}
          </div>
        </div>
      </div>

      {/* Performance Stats */}
      {showStats && (
        <div
          style={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            padding: '1.5rem',
            borderRadius: '8px',
            marginBottom: '2rem',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Performance Stats</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <div style={{ opacity: 0.7, fontSize: '0.875rem' }}>Current FPS</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.currentFps}</div>
            </div>
            <div>
              <div style={{ opacity: 0.7, fontSize: '0.875rem' }}>Average FPS</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.averageFps}</div>
            </div>
            <div>
              <div style={{ opacity: 0.7, fontSize: '0.875rem' }}>Min FPS</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.minFps}</div>
            </div>
            <div>
              <div style={{ opacity: 0.7, fontSize: '0.875rem' }}>Max FPS</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.maxFps}</div>
            </div>
            <div>
              <div style={{ opacity: 0.7, fontSize: '0.875rem' }}>Adjustments</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {stats.adjustmentCount}
              </div>
            </div>
            <div>
              <div style={{ opacity: 0.7, fontSize: '0.875rem' }}>Auto-Adjusted</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {stats.autoAdjusted ? 'Yes' : 'No'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quality Settings */}
      <div
        style={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Current Quality Settings</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: '0.5rem 1rem',
            fontSize: '0.875rem',
          }}
        >
          <div style={{ opacity: 0.7 }}>Background Glows:</div>
          <div>{settings.backgroundGlows ? '✓ Enabled' : '✗ Disabled'}</div>

          <div style={{ opacity: 0.7 }}>Glow Intensity:</div>
          <div>{settings.glowIntensity}</div>

          <div style={{ opacity: 0.7 }}>Animate Glows:</div>
          <div>{settings.animateGlows ? '✓ Yes' : '✗ No'}</div>

          <div style={{ opacity: 0.7 }}>Noise Overlay:</div>
          <div>{settings.noiseOverlay ? '✓ Enabled' : '✗ Disabled'}</div>

          <div style={{ opacity: 0.7 }}>Noise FPS:</div>
          <div>{settings.noiseFps} fps</div>

          <div style={{ opacity: 0.7 }}>Bloom Effect:</div>
          <div>{settings.bloom ? '✓ Enabled' : '✗ Disabled'}</div>

          <div style={{ opacity: 0.7 }}>Bloom Preset:</div>
          <div>{settings.bloomPreset}</div>

          <div style={{ opacity: 0.7 }}>Chromatic Aberration:</div>
          <div>{settings.chromaticAberration ? '✓ Enabled' : '✗ Disabled'}</div>

          <div style={{ opacity: 0.7 }}>Vignette:</div>
          <div>{settings.vignette ? '✓ Enabled' : '✗ Disabled'}</div>

          <div style={{ opacity: 0.7 }}>Scanlines:</div>
          <div>{settings.scanlines ? '✓ Enabled' : '✗ Disabled'}</div>

          <div style={{ opacity: 0.7 }}>Particle Multiplier:</div>
          <div>{(settings.particleMultiplier * 100).toFixed(0)}%</div>

          <div style={{ opacity: 0.7 }}>Particle Animations:</div>
          <div>{settings.particleAnimations ? '✓ Yes' : '✗ No'}</div>

          <div style={{ opacity: 0.7 }}>3D Effect Quality:</div>
          <div>{settings.effect3dQuality}</div>
        </div>
      </div>

      {/* Thresholds */}
      <div
        style={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          padding: '1.5rem',
          borderRadius: '8px',
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>FPS Thresholds</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div>
            <span style={{ color: '#00ff00' }}>●</span> High Quality: ≥{highQualityFps} FPS
          </div>
          <div>
            <span style={{ color: '#ffff00' }}>●</span> Medium Quality: ≥{mediumQualityFps} FPS
          </div>
          <div>
            <span style={{ color: '#ff8800' }}>●</span> Low Quality: ≥{lowQualityFps} FPS
          </div>
          <div>
            <span style={{ color: '#ff0000' }}>●</span> Minimal Quality: &lt;{lowQualityFps} FPS
          </div>
        </div>
        <div style={{ marginTop: '1rem', fontSize: '0.875rem', opacity: 0.7 }}>
          Hysteresis: ±{hysteresis} FPS (prevents rapid switching)
        </div>
      </div>
    </div>
  );
}

// Add React import for useEffect
import React from 'react';

// ============================================================================
// Stories
// ============================================================================

const meta: Meta<typeof PerformanceScalingDemo> = {
  title: 'System/Performance Scaling',
  component: PerformanceScalingDemo,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#0a0a0a' }],
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PerformanceScalingDemo>;

/**
 * Default automatic performance scaling.
 * Monitor your FPS in the stats panel and watch quality adjust automatically.
 */
export const AutomaticScaling: Story = {
  args: {
    enabled: true,
    showStats: true,
  },
};

/**
 * High quality - all effects enabled at maximum settings.
 * Uses full particle counts, animations, and post-processing effects.
 */
export const HighQuality: Story = {
  args: {
    enabled: false,
    showStats: true,
    manualQuality: 'high',
  },
};

/**
 * Medium quality - balanced performance and visuals.
 * Disables animations, reduces particle counts and effect FPS.
 */
export const MediumQuality: Story = {
  args: {
    enabled: false,
    showStats: true,
    manualQuality: 'medium',
  },
};

/**
 * Low quality - performance-focused with minimal effects.
 * Disables expensive effects like chromatic aberration and scanlines.
 */
export const LowQuality: Story = {
  args: {
    enabled: false,
    showStats: true,
    manualQuality: 'low',
  },
};

/**
 * Minimal quality - absolute minimum for very low-end devices.
 * Disables all post-processing effects and particles.
 */
export const MinimalQuality: Story = {
  args: {
    enabled: false,
    showStats: true,
    manualQuality: 'minimal',
  },
};

/**
 * Custom FPS thresholds for stricter quality requirements.
 * Requires higher FPS to maintain each quality level.
 */
export const StrictThresholds: Story = {
  args: {
    enabled: true,
    showStats: true,
    highQualityFps: 55,
    mediumQualityFps: 40,
    lowQualityFps: 25,
  },
};

/**
 * Custom FPS thresholds for lenient quality requirements.
 * Allows lower FPS before downgrading quality.
 */
export const LenientThresholds: Story = {
  args: {
    enabled: true,
    showStats: true,
    highQualityFps: 45,
    mediumQualityFps: 30,
    lowQualityFps: 15,
  },
};

/**
 * High hysteresis to prevent frequent quality changes.
 * Quality levels are more stable with larger FPS margin.
 */
export const HighHysteresis: Story = {
  args: {
    enabled: true,
    showStats: true,
    hysteresis: 8,
  },
};

/**
 * Low hysteresis for more responsive quality adjustment.
 * Quality changes more quickly with smaller FPS margin.
 */
export const LowHysteresis: Story = {
  args: {
    enabled: true,
    showStats: true,
    hysteresis: 1,
  },
};

/**
 * Disabled performance scaling - always stays at high quality.
 * Useful when you want maximum quality regardless of performance.
 */
export const Disabled: Story = {
  args: {
    enabled: false,
    showStats: true,
  },
};

/**
 * Stats hidden - minimal UI for production use.
 * Performance scaling works in background without displaying metrics.
 */
export const StatsHidden: Story = {
  args: {
    enabled: true,
    showStats: false,
  },
};
