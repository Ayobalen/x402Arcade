/**
 * PerformanceScaledLayout Component
 *
 * Enhanced Layout component with automatic performance scaling.
 * Adjusts visual effect quality based on frame rate to maintain smooth performance.
 *
 * Features:
 * - Automatic FPS monitoring and quality adjustment
 * - Progressive degradation of effects when FPS drops
 * - Smooth transitions between quality levels
 * - Manual quality override option
 * - All standard Layout features with performance optimization
 *
 * @example
 * // Basic usage - auto-scales quality based on FPS
 * <PerformanceScaledLayout>
 *   <YourContent />
 * </PerformanceScaledLayout>
 *
 * @example
 * // Manual quality override
 * <PerformanceScaledLayout manualQuality="medium">
 *   <YourContent />
 * </PerformanceScaledLayout>
 *
 * @example
 * // Custom FPS thresholds
 * <PerformanceScaledLayout
 *   performanceConfig={{
 *     highQualityFps: 55,
 *     mediumQualityFps: 40,
 *     lowQualityFps: 25,
 *   }}
 * >
 *   <YourContent />
 * </PerformanceScaledLayout>
 */

import { usePerformanceScaling } from '@/hooks/usePerformanceScaling';
import type {
  QualityLevel,
  PerformanceScalingConfig,
} from '@/hooks/usePerformanceScaling';
import { Layout } from './Layout';
import type { LayoutProps } from './Layout.types';

export interface PerformanceScaledLayoutProps extends Omit<LayoutProps, 'glowIntensity'> {
  /**
   * Manual quality override (disables auto-scaling)
   * Set to null to re-enable auto-scaling
   */
  manualQuality?: QualityLevel | null;

  /**
   * Performance scaling configuration
   */
  performanceConfig?: PerformanceScalingConfig;

  /**
   * Whether to enable performance scaling (default: true)
   */
  enableScaling?: boolean;

  /**
   * Show performance stats overlay (debug mode, default: false)
   */
  showStats?: boolean;

  /**
   * Callback when quality level changes
   */
  onQualityChange?: (quality: QualityLevel) => void;
}

export function PerformanceScaledLayout({
  children,
  manualQuality = null,
  performanceConfig,
  enableScaling = true,
  showStats = false,
  onQualityChange,
  showBackgroundEffects = true,
  showNoiseOverlay = true,
  ...layoutProps
}: PerformanceScaledLayoutProps) {
  const { quality, settings, stats, setManualQuality } = usePerformanceScaling({
    enabled: enableScaling,
    ...performanceConfig,
  });

  // Apply manual override if provided
  React.useEffect(() => {
    if (manualQuality !== null) {
      setManualQuality(manualQuality);
    } else if (manualQuality === null && enableScaling) {
      setManualQuality(null); // Re-enable auto-scaling
    }
  }, [manualQuality, enableScaling, setManualQuality]);

  // Call onQualityChange callback when quality changes
  React.useEffect(() => {
    if (onQualityChange) {
      onQualityChange(quality);
    }
  }, [quality, onQualityChange]);

  return (
    <>
      <Layout
        {...layoutProps}
        // Apply performance-scaled settings to background effects
        showBackgroundEffects={showBackgroundEffects && settings.backgroundGlows}
        glowIntensity={settings.glowIntensity}
        // Apply performance-scaled settings to noise overlay
        showNoiseOverlay={showNoiseOverlay && settings.noiseOverlay}
        noiseIntensity={settings.noiseOverlay ? 0.08 : 0}
      >
        {children}
      </Layout>

      {/* Performance Stats Overlay (Debug Mode) */}
      {showStats && (
        <div
          style={{
            position: 'fixed',
            top: '1rem',
            right: '1rem',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: '#fff',
            padding: '1rem',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            zIndex: 9999,
            minWidth: '200px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Performance Stats</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.25rem' }}>
            <div style={{ opacity: 0.7 }}>Quality:</div>
            <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{quality}</div>

            <div style={{ opacity: 0.7 }}>FPS:</div>
            <div>{stats.currentFps}</div>

            <div style={{ opacity: 0.7 }}>Avg:</div>
            <div>{stats.averageFps}</div>

            <div style={{ opacity: 0.7 }}>Min:</div>
            <div>{stats.minFps}</div>

            <div style={{ opacity: 0.7 }}>Max:</div>
            <div>{stats.maxFps}</div>

            <div style={{ opacity: 0.7 }}>Adjustments:</div>
            <div>{stats.adjustmentCount}</div>
          </div>

          {manualQuality !== null && (
            <div
              style={{
                marginTop: '0.5rem',
                padding: '0.25rem',
                backgroundColor: 'rgba(255, 165, 0, 0.2)',
                borderRadius: '4px',
                textAlign: 'center',
                fontSize: '0.7rem',
              }}
            >
              MANUAL OVERRIDE
            </div>
          )}
        </div>
      )}
    </>
  );
}

// Add React import
import React from 'react';

PerformanceScaledLayout.displayName = 'PerformanceScaledLayout';

export default PerformanceScaledLayout;
