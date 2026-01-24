/**
 * Effects Settings Component
 *
 * A UI panel for controlling visual effects quality and individual effect toggles.
 * Integrates with useGracefulDegradation hook for quality management and
 * usePerformanceMonitor for FPS tracking.
 *
 * Features:
 * - Master quality dropdown (low, medium, high, ultra)
 * - Individual effect toggles
 * - Auto-degradation toggle
 * - FPS counter display
 * - Retro arcade/neon styling
 *
 * @example
 * <EffectsSettings showFpsCounter />
 */

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useGracefulDegradation, type QualityTier } from '@/hooks/useGracefulDegradation';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { Switch } from '@/components/ui/Switch';
import { Dropdown } from '@/components/ui/Dropdown';
import { Button } from '@/components/ui/Button';
import type { EffectsSettingsProps } from './EffectsSettings.types';

/**
 * Effects Settings Component
 */
export function EffectsSettings({
  showFpsCounter = false,
  className,
  onSettingsChange,
  showAdvanced = true,
}: EffectsSettingsProps) {
  const {
    state: qualityState,
    setQualityTier,
    setAutoDegrade,
    resetToAuto,
  } = useGracefulDegradation();

  const { metrics } = usePerformanceMonitor({ enabled: showFpsCounter });

  const [showFps, setShowFps] = useState(showFpsCounter);

  // Notify parent of settings changes
  useEffect(() => {
    onSettingsChange?.({
      quality: qualityState.currentTier,
      autoDegrade: qualityState.autoDegrade,
      showFps,
    });
  }, [qualityState.currentTier, qualityState.autoDegrade, showFps, onSettingsChange]);

  // Quality preset options for dropdown
  const qualityOptions: Array<{ value: QualityTier; label: string; description: string }> = [
    { value: 'low', label: 'Low', description: 'Best performance' },
    { value: 'medium', label: 'Medium', description: 'Balanced' },
    { value: 'high', label: 'High', description: 'Best quality' },
    { value: 'ultra', label: 'Ultra', description: 'Maximum quality' },
  ];

  const currentQualityLabel =
    qualityOptions.find((opt) => opt.value === qualityState.currentTier)?.label || 'Medium';

  return (
    <div
      className={cn(
        'bg-[#16162a] border border-[#2d2d4a] rounded-lg p-6',
        'shadow-lg shadow-[0_0_20px_rgba(0,255,255,0.1)]',
        className
      )}
    >
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white/90 mb-1">Visual Effects</h3>
        <p className="text-sm text-white/60">Adjust quality and performance settings</p>
      </div>

      {/* FPS Counter */}
      {showFps && (
        <div
          className={cn(
            'mb-6 p-4 rounded-lg',
            'bg-[#0a0a0a] border border-[#2d2d4a]',
            'flex items-center justify-between'
          )}
        >
          <div>
            <div className="text-xs font-medium text-white/60 uppercase tracking-wider">
              Frame Rate
            </div>
            <div className="text-2xl font-bold text-[#00ffff] mt-1">
              {metrics.fps.toFixed(0)} FPS
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/60">Quality:</div>
            <div className="text-sm font-medium text-white/90 capitalize">
              {qualityState.currentTier}
            </div>
          </div>
        </div>
      )}

      {/* Quality Preset Dropdown */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-white/90 mb-2">Quality Preset</label>
        <Dropdown
          trigger={
            <Button
              variant="secondary"
              className="w-full justify-between"
              aria-label="Select quality preset"
            >
              <span className="capitalize">{currentQualityLabel}</span>
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
          }
          items={qualityOptions.map((option) => ({
            label: option.label,
            onClick: () => setQualityTier(option.value),
            className: cn(
              qualityState.currentTier === option.value && 'bg-[#00ffff]/10 text-[#00ffff]'
            ),
          }))}
          menuClassName="w-full"
        />
        <p className="text-xs text-white/60 mt-1.5">
          {qualityOptions.find((opt) => opt.value === qualityState.currentTier)?.description}
        </p>
      </div>

      {/* Auto-Degradation Toggle */}
      <div className="mb-6">
        <Switch
          checked={qualityState.autoDegrade}
          onCheckedChange={setAutoDegrade}
          label="Auto Quality"
          description="Automatically adjust quality based on performance"
          variant="cyan"
        />
      </div>

      {/* FPS Counter Toggle */}
      <div className="mb-6">
        <Switch
          checked={showFps}
          onCheckedChange={setShowFps}
          label="Show FPS Counter"
          description="Display real-time frame rate"
          variant="green"
        />
      </div>

      {/* Advanced Settings */}
      {showAdvanced && (
        <div className="pt-6 border-t border-[#2d2d4a]">
          <h4 className="text-sm font-semibold text-white/90 mb-4">Individual Effects</h4>

          <div className="space-y-4">
            {/* Bloom Effect */}
            <Switch
              checked={qualityState.settings.bloom}
              onCheckedChange={() => {
                // Individual toggles would require custom quality settings
                // For now, this is display-only showing current preset values
              }}
              label="Bloom"
              description="Glow effect around bright objects"
              variant="cyan"
              disabled={!qualityState.hasManualOverride}
            />

            {/* Particles */}
            <Switch
              checked={qualityState.settings.particles}
              onCheckedChange={() => {}}
              label="Particles"
              description={`${qualityState.settings.maxParticles} particles`}
              variant="magenta"
              disabled={!qualityState.hasManualOverride}
            />

            {/* Shadows */}
            <Switch
              checked={qualityState.settings.shadows}
              onCheckedChange={() => {}}
              label="Shadows"
              description="Dynamic shadow rendering"
              variant="cyan"
              disabled={!qualityState.hasManualOverride}
            />

            {/* CRT Effect */}
            <Switch
              checked={qualityState.settings.crtEffect}
              onCheckedChange={() => {}}
              label="CRT Effect"
              description="Retro scanline overlay"
              variant="green"
              disabled={!qualityState.hasManualOverride}
            />

            {/* Reflections */}
            <Switch
              checked={qualityState.settings.reflections}
              onCheckedChange={() => {}}
              label="Reflections"
              description="Surface reflections"
              variant="cyan"
              disabled={!qualityState.hasManualOverride}
            />

            {/* Ambient Occlusion */}
            <Switch
              checked={qualityState.settings.ambientOcclusion}
              onCheckedChange={() => {}}
              label="Ambient Occlusion"
              description="Subtle contact shadows"
              variant="magenta"
              disabled={!qualityState.hasManualOverride}
            />

            {/* Post Processing */}
            <Switch
              checked={qualityState.settings.postProcessing}
              onCheckedChange={() => {}}
              label="Post Processing"
              description="Color grading and effects"
              variant="yellow"
              disabled={!qualityState.hasManualOverride}
            />
          </div>

          <p className="text-xs text-white/50 mt-4">
            Individual effect toggles are disabled when using quality presets. These show the
            current preset's enabled effects.
          </p>
        </div>
      )}

      {/* Reset Button */}
      {qualityState.hasManualOverride && (
        <div className="mt-6 pt-6 border-t border-[#2d2d4a]">
          <Button variant="outline" onClick={resetToAuto} className="w-full">
            Reset to Auto-Detected Settings
          </Button>
          <p className="text-xs text-white/50 mt-2">
            Detected: {qualityState.capabilities?.recommendedQuality || 'medium'}
          </p>
        </div>
      )}

      {/* Stats Footer */}
      {qualityState.isAutoDetected && (
        <div className="mt-4 text-xs text-white/50 text-center">
          Auto-detected quality based on your device capabilities
        </div>
      )}
    </div>
  );
}

EffectsSettings.displayName = 'EffectsSettings';

export default EffectsSettings;
