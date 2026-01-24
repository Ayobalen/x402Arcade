/**
 * Effects Settings Component Types
 *
 * Types for the effects quality and toggle settings panel.
 */

import type { QualityTier } from '@/hooks/useGracefulDegradation';

export interface EffectsSettingsProps {
  /** Whether to show FPS counter */
  showFpsCounter?: boolean;
  /** Additional class name */
  className?: string;
  /** Callback when settings change */
  onSettingsChange?: (settings: EffectsSettings) => void;
  /** Whether to show advanced settings */
  showAdvanced?: boolean;
}

export interface EffectsSettings {
  /** Quality tier */
  quality: QualityTier;
  /** Auto-degradation enabled */
  autoDegrade: boolean;
  /** Individual effect overrides (when not using presets) */
  overrides?: {
    bloom?: boolean;
    particles?: boolean;
    shadows?: boolean;
    crtEffect?: boolean;
    reflections?: boolean;
    ambientOcclusion?: boolean;
    postProcessing?: boolean;
  };
  /** Show FPS counter */
  showFps?: boolean;
}
