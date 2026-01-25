/**
 * AudioSettingsPanel - Settings panel with audio controls
 *
 * Features:
 * - Modal/panel for audio settings
 * - Includes AudioControls component
 * - Preset volume configurations
 * - Reset to defaults
 *
 * @module AudioSettingsPanel
 */

import React from 'react';
import { X, RotateCcw, Volume2, VolumeX, Volume1 } from 'lucide-react';
import { AudioControls } from './AudioControls';
import type { AudioSettings } from './AudioControls';
import { useAudio } from '../../hooks/useAudio';
import { AudioCategory } from '../../utils/AudioManager';

/**
 * AudioSettingsPanel props
 */
export interface AudioSettingsPanelProps {
  /**
   * Whether the panel is open
   */
  isOpen: boolean;

  /**
   * Callback when panel should close
   */
  onClose: () => void;

  /**
   * Custom className for styling
   */
  className?: string;

  /**
   * Panel position
   */
  position?: 'center' | 'right' | 'left';
}

/**
 * Volume presets
 */
const VOLUME_PRESETS = [
  {
    id: 'full',
    name: 'Full Volume',
    icon: <Volume2 />,
    settings: {
      masterVolume: 1.0,
      sfxVolume: 1.0,
      musicVolume: 0.7,
      voiceVolume: 1.0,
      uiVolume: 0.8,
    },
  },
  {
    id: 'balanced',
    name: 'Balanced',
    icon: <Volume1 />,
    settings: {
      masterVolume: 0.7,
      sfxVolume: 0.8,
      musicVolume: 0.5,
      voiceVolume: 0.8,
      uiVolume: 0.6,
    },
  },
  {
    id: 'quiet',
    name: 'Quiet',
    icon: <Volume1 />,
    settings: {
      masterVolume: 0.4,
      sfxVolume: 0.5,
      musicVolume: 0.3,
      voiceVolume: 0.5,
      uiVolume: 0.4,
    },
  },
  {
    id: 'muted',
    name: 'Muted',
    icon: <VolumeX />,
    settings: {
      masterVolume: 0,
      sfxVolume: 0,
      musicVolume: 0,
      voiceVolume: 0,
      uiVolume: 0,
    },
  },
];

/**
 * AudioSettingsPanel Component
 *
 * Modal/panel for comprehensive audio settings
 */
export const AudioSettingsPanel: React.FC<AudioSettingsPanelProps> = ({
  isOpen,
  onClose,
  className = '',
  position = 'center',
}) => {
  const audio = useAudio(true, false);

  /**
   * Apply a volume preset
   */
  const applyPreset = (preset: (typeof VOLUME_PRESETS)[0]) => {
    audio.setMasterVolume(preset.settings.masterVolume);
    audio.setCategoryVolume(AudioCategory.SFX, preset.settings.sfxVolume);
    audio.setCategoryVolume(AudioCategory.MUSIC, preset.settings.musicVolume);
    audio.setCategoryVolume(AudioCategory.VOICE, preset.settings.voiceVolume);
    audio.setCategoryVolume(AudioCategory.UI, preset.settings.uiVolume);

    if (preset.id === 'muted') {
      audio.mute();
    } else if (audio.isMuted) {
      audio.unmute();
    }
  };

  /**
   * Reset to defaults
   */
  const handleReset = () => {
    audio.setMasterVolume(1.0);
    audio.setCategoryVolume(AudioCategory.SFX, 1.0);
    audio.setCategoryVolume(AudioCategory.MUSIC, 0.7);
    audio.setCategoryVolume(AudioCategory.VOICE, 1.0);
    audio.setCategoryVolume(AudioCategory.UI, 0.8);
    audio.unmute();
  };

  /**
   * Handle settings change (for future use)
   */
  const handleSettingsChange = (_settings: AudioSettings) => {
    // Settings are automatically persisted by AudioManager
    // This callback is available for future extensions
  };

  /**
   * Handle backdrop click
   */
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={`audio-settings-backdrop ${className}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="audio-settings-title"
    >
      <div className={`audio-settings-panel position-${position}`}>
        {/* Header */}
        <div className="audio-settings-header">
          <h2 id="audio-settings-title" className="audio-settings-title">
            Audio Settings
          </h2>
          <button
            onClick={onClose}
            className="audio-settings-close"
            aria-label="Close audio settings"
          >
            <X />
          </button>
        </div>

        {/* Volume Presets */}
        <div className="audio-presets">
          <h3 className="audio-presets-title">Quick Presets</h3>
          <div className="audio-presets-grid">
            {VOLUME_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className="audio-preset-button"
                aria-label={`Apply ${preset.name} preset`}
              >
                <div className="audio-preset-icon">{preset.icon}</div>
                <span className="audio-preset-name">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Audio Controls */}
        <div className="audio-settings-controls">
          <AudioControls showCategoryControls={true} onChange={handleSettingsChange} />
        </div>

        {/* Footer */}
        <div className="audio-settings-footer">
          <button onClick={handleReset} className="audio-reset-button">
            <RotateCcw />
            <span>Reset to Defaults</span>
          </button>
        </div>
      </div>

      <style>{styles}</style>
    </div>
  );
};

/**
 * Component styles
 */
const styles = `
  .audio-settings-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .audio-settings-panel {
    background: #0F0F1A;
    border: 1px solid #2D2D4A;
    border-radius: 16px;
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    animation: slideUp 0.3s ease;
  }

  @keyframes slideUp {
    from {
      transform: translateY(40px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .audio-settings-panel.position-right {
    position: fixed;
    right: 0;
    top: 0;
    bottom: 0;
    max-width: 400px;
    width: 100%;
    max-height: 100vh;
    border-radius: 0;
    border-right: none;
    animation: slideInRight 0.3s ease;
  }

  @keyframes slideInRight {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }

  .audio-settings-panel.position-left {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    max-width: 400px;
    width: 100%;
    max-height: 100vh;
    border-radius: 0;
    border-left: none;
    animation: slideInLeft 0.3s ease;
  }

  @keyframes slideInLeft {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(0);
    }
  }

  .audio-settings-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px;
    border-bottom: 1px solid #2D2D4A;
  }

  .audio-settings-title {
    font-size: 20px;
    font-weight: 600;
    color: #F8FAFC;
    margin: 0;
  }

  .audio-settings-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: rgba(139, 92, 246, 0.1);
    border: 1px solid rgba(139, 92, 246, 0.3);
    border-radius: 8px;
    color: #8B5CF6;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .audio-settings-close:hover {
    background: rgba(139, 92, 246, 0.2);
    border-color: rgba(139, 92, 246, 0.5);
    transform: rotate(90deg);
  }

  .audio-settings-close svg {
    width: 18px;
    height: 18px;
  }

  .audio-presets {
    padding: 24px;
    border-bottom: 1px solid #2D2D4A;
  }

  .audio-presets-title {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 16px 0;
    color: #94A3B8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .audio-presets-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 12px;
  }

  .audio-preset-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px 12px;
    background: #1A1A2E;
    border: 1px solid #2D2D4A;
    border-radius: 8px;
    color: #F8FAFC;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .audio-preset-button:hover {
    background: rgba(139, 92, 246, 0.1);
    border-color: rgba(139, 92, 246, 0.5);
    transform: translateY(-2px);
  }

  .audio-preset-button:active {
    transform: translateY(0);
  }

  .audio-preset-icon {
    width: 24px;
    height: 24px;
    color: #8B5CF6;
  }

  .audio-preset-icon svg {
    width: 100%;
    height: 100%;
  }

  .audio-preset-name {
    font-size: 12px;
    font-weight: 500;
    text-align: center;
  }

  .audio-settings-controls {
    padding: 24px;
  }

  .audio-settings-footer {
    padding: 24px;
    border-top: 1px solid #2D2D4A;
  }

  .audio-reset-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 12px 24px;
    background: rgba(139, 92, 246, 0.1);
    border: 1px solid rgba(139, 92, 246, 0.3);
    border-radius: 8px;
    color: #8B5CF6;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .audio-reset-button:hover {
    background: rgba(139, 92, 246, 0.2);
    border-color: rgba(139, 92, 246, 0.5);
    transform: translateY(-2px);
  }

  .audio-reset-button:active {
    transform: translateY(0);
  }

  .audio-reset-button svg {
    width: 16px;
    height: 16px;
  }

  /* Mobile responsiveness */
  @media (max-width: 640px) {
    .audio-settings-panel {
      width: 100%;
      max-width: 100%;
      border-radius: 16px 16px 0 0;
      position: fixed;
      bottom: 0;
      max-height: 85vh;
    }

    .audio-presets-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
`;

export default AudioSettingsPanel;
