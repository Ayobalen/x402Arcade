/**
 * AudioControls - Comprehensive audio control UI
 *
 * Features:
 * - Master volume control with slider
 * - Separate music and SFX volume controls
 * - Mute/unmute functionality
 * - Visual feedback for audio state
 * - Accessible controls with ARIA attributes
 *
 * @module AudioControls
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAudio } from '../../hooks/useAudio';
import { AudioCategory } from '../../utils/AudioManager';
import { Volume2, VolumeX, Volume1, Music, Zap, MessageSquare, MousePointer } from 'lucide-react';

/**
 * AudioControls props
 */
export interface AudioControlsProps {
  /**
   * Whether to show individual category controls
   */
  showCategoryControls?: boolean;

  /**
   * Custom className for styling
   */
  className?: string;

  /**
   * Whether to show in compact mode (icon only)
   */
  compact?: boolean;

  /**
   * Callback when audio settings change
   */
  onChange?: (settings: AudioSettings) => void;
}

/**
 * Audio settings interface
 */
export interface AudioSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  voiceVolume: number;
  uiVolume: number;
  isMuted: boolean;
}

/**
 * Volume slider component
 */
interface VolumeSliderProps {
  label: string;
  icon: React.ReactNode;
  volume: number;
  onChange: (volume: number) => void;
  disabled?: boolean;
  color?: string;
}

const VolumeSlider: React.FC<VolumeSliderProps> = ({
  label,
  icon,
  volume,
  onChange,
  disabled = false,
  color = '#8B5CF6',
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  };

  return (
    <div className="audio-slider-group">
      <div className="audio-slider-header">
        <div className="audio-slider-icon" style={{ color }}>
          {icon}
        </div>
        <label className="audio-slider-label">{label}</label>
        <span className="audio-slider-value">{Math.round(volume * 100)}%</span>
      </div>

      <div className="audio-slider-container">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          disabled={disabled}
          className={`audio-slider ${isDragging ? 'dragging' : ''}`}
          aria-label={`${label} volume`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(volume * 100)}
          style={{
            // @ts-expect-error - CSS custom properties
            '--slider-color': color,
            '--slider-progress': `${volume * 100}%`,
          }}
        />
      </div>
    </div>
  );
};

/**
 * AudioControls Component
 *
 * Provides comprehensive audio controls with master volume,
 * category volumes, and mute functionality
 */
export const AudioControls: React.FC<AudioControlsProps> = ({
  showCategoryControls = true,
  className = '',
  compact = false,
  onChange,
}) => {
  const audio = useAudio(true, false);

  // Category volumes state
  const [sfxVolume, setSfxVolume] = useState(audio.getCategoryVolume(AudioCategory.SFX));
  const [musicVolume, setMusicVolume] = useState(audio.getCategoryVolume(AudioCategory.MUSIC));
  const [voiceVolume, setVoiceVolume] = useState(audio.getCategoryVolume(AudioCategory.VOICE));
  const [uiVolume, setUiVolume] = useState(audio.getCategoryVolume(AudioCategory.UI));

  /**
   * Get appropriate volume icon
   */
  const getVolumeIcon = () => {
    if (audio.isMuted) {
      return <VolumeX />;
    } else if (audio.masterVolume === 0) {
      return <VolumeX />;
    } else if (audio.masterVolume < 0.5) {
      return <Volume1 />;
    } else {
      return <Volume2 />;
    }
  };

  /**
   * Handle master volume change
   */
  const handleMasterVolumeChange = useCallback(
    (volume: number) => {
      audio.setMasterVolume(volume);
      notifyChange();
    },
    [audio]
  );

  /**
   * Handle category volume change
   */
  const handleCategoryVolumeChange = useCallback(
    (category: AudioCategory, volume: number) => {
      audio.setCategoryVolume(category, volume);

      switch (category) {
        case AudioCategory.SFX:
          setSfxVolume(volume);
          break;
        case AudioCategory.MUSIC:
          setMusicVolume(volume);
          break;
        case AudioCategory.VOICE:
          setVoiceVolume(volume);
          break;
        case AudioCategory.UI:
          setUiVolume(volume);
          break;
      }

      notifyChange();
    },
    [audio]
  );

  /**
   * Handle mute toggle
   */
  const handleMuteToggle = useCallback(() => {
    audio.toggleMute();
    notifyChange();
  }, [audio]);

  /**
   * Notify parent of settings change
   */
  const notifyChange = useCallback(() => {
    if (onChange) {
      onChange({
        masterVolume: audio.masterVolume,
        sfxVolume,
        musicVolume,
        voiceVolume,
        uiVolume,
        isMuted: audio.isMuted,
      });
    }
  }, [onChange, audio, sfxVolume, musicVolume, voiceVolume, uiVolume]);

  /**
   * Sync category volumes on mount
   */
  useEffect(() => {
    setSfxVolume(audio.getCategoryVolume(AudioCategory.SFX));
    setMusicVolume(audio.getCategoryVolume(AudioCategory.MUSIC));
    setVoiceVolume(audio.getCategoryVolume(AudioCategory.VOICE));
    setUiVolume(audio.getCategoryVolume(AudioCategory.UI));
  }, [audio]);

  /**
   * Compact mode - icon only
   */
  if (compact) {
    return (
      <button
        onClick={handleMuteToggle}
        className={`audio-controls-compact ${className}`}
        aria-label={audio.isMuted ? 'Unmute audio' : 'Mute audio'}
        title={audio.isMuted ? 'Unmute' : 'Mute'}
      >
        {getVolumeIcon()}
        <style>{compactStyles}</style>
      </button>
    );
  }

  /**
   * Full controls
   */
  return (
    <div className={`audio-controls ${className}`} role="group" aria-label="Audio controls">
      {/* Master Volume */}
      <div className="audio-controls-section">
        <div className="audio-controls-header">
          <h3 className="audio-controls-title">Audio Controls</h3>
          <button
            onClick={handleMuteToggle}
            className="audio-mute-button"
            aria-label={audio.isMuted ? 'Unmute audio' : 'Mute audio'}
            title={audio.isMuted ? 'Unmute' : 'Mute'}
          >
            {getVolumeIcon()}
          </button>
        </div>

        <VolumeSlider
          label="Master Volume"
          icon={<Volume2 />}
          volume={audio.masterVolume}
          onChange={handleMasterVolumeChange}
          disabled={audio.isMuted}
          color="#8B5CF6"
        />
      </div>

      {/* Category Controls */}
      {showCategoryControls && (
        <div className="audio-controls-section">
          <h4 className="audio-controls-subtitle">Category Volumes</h4>

          <VolumeSlider
            label="Sound Effects"
            icon={<Zap />}
            volume={sfxVolume}
            onChange={(v) => handleCategoryVolumeChange(AudioCategory.SFX, v)}
            disabled={audio.isMuted}
            color="#00ffff"
          />

          <VolumeSlider
            label="Music"
            icon={<Music />}
            volume={musicVolume}
            onChange={(v) => handleCategoryVolumeChange(AudioCategory.MUSIC, v)}
            disabled={audio.isMuted}
            color="#ff00ff"
          />

          <VolumeSlider
            label="Voice"
            icon={<MessageSquare />}
            volume={voiceVolume}
            onChange={(v) => handleCategoryVolumeChange(AudioCategory.VOICE, v)}
            disabled={audio.isMuted}
            color="#00ff00"
          />

          <VolumeSlider
            label="UI Sounds"
            icon={<MousePointer />}
            volume={uiVolume}
            onChange={(v) => handleCategoryVolumeChange(AudioCategory.UI, v)}
            disabled={audio.isMuted}
            color="#ffff00"
          />
        </div>
      )}

      {/* Audio Status */}
      <div className="audio-status">
        <div className="audio-status-item">
          <span className={`audio-status-indicator ${audio.isInitialized ? 'active' : ''}`} />
          <span className="audio-status-label">
            {audio.isInitialized ? 'Audio Initialized' : 'Audio Not Initialized'}
          </span>
        </div>
        <div className="audio-status-item">
          <span className={`audio-status-indicator ${audio.isUnlocked ? 'active' : ''}`} />
          <span className="audio-status-label">
            {audio.isUnlocked ? 'Audio Unlocked' : 'Audio Locked'}
          </span>
        </div>
      </div>

      <style>{fullStyles}</style>
    </div>
  );
};

/**
 * Compact mode styles
 */
const compactStyles = `
  .audio-controls-compact {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: rgba(139, 92, 246, 0.1);
    border: 1px solid rgba(139, 92, 246, 0.3);
    border-radius: 8px;
    color: #8B5CF6;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .audio-controls-compact:hover {
    background: rgba(139, 92, 246, 0.2);
    border-color: rgba(139, 92, 246, 0.5);
    transform: translateY(-2px);
  }

  .audio-controls-compact:active {
    transform: translateY(0);
  }

  .audio-controls-compact svg {
    width: 20px;
    height: 20px;
  }
`;

/**
 * Full controls styles
 */
const fullStyles = `
  .audio-controls {
    background: #1A1A2E;
    border: 1px solid #2D2D4A;
    border-radius: 12px;
    padding: 24px;
    color: #F8FAFC;
  }

  .audio-controls-section {
    margin-bottom: 24px;
  }

  .audio-controls-section:last-child {
    margin-bottom: 0;
  }

  .audio-controls-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .audio-controls-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    color: #F8FAFC;
  }

  .audio-controls-subtitle {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 16px 0;
    color: #94A3B8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .audio-mute-button {
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

  .audio-mute-button:hover {
    background: rgba(139, 92, 246, 0.2);
    border-color: rgba(139, 92, 246, 0.5);
    transform: translateY(-1px);
  }

  .audio-mute-button:active {
    transform: translateY(0);
  }

  .audio-mute-button svg {
    width: 18px;
    height: 18px;
  }

  .audio-slider-group {
    margin-bottom: 16px;
  }

  .audio-slider-group:last-child {
    margin-bottom: 0;
  }

  .audio-slider-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .audio-slider-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .audio-slider-icon svg {
    width: 100%;
    height: 100%;
  }

  .audio-slider-label {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
    color: #F8FAFC;
  }

  .audio-slider-value {
    font-size: 12px;
    font-weight: 600;
    font-family: 'JetBrains Mono', monospace;
    color: #94A3B8;
    min-width: 40px;
    text-align: right;
  }

  .audio-slider-container {
    position: relative;
  }

  .audio-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 6px;
    background: #2D2D4A;
    border-radius: 3px;
    outline: none;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .audio-slider:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .audio-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    background: var(--slider-color, #8B5CF6);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    transition: all 0.2s ease;
  }

  .audio-slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: var(--slider-color, #8B5CF6);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    transition: all 0.2s ease;
  }

  .audio-slider:not(:disabled):hover::-webkit-slider-thumb {
    transform: scale(1.2);
    box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.2);
  }

  .audio-slider:not(:disabled):hover::-moz-range-thumb {
    transform: scale(1.2);
    box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.2);
  }

  .audio-slider.dragging::-webkit-slider-thumb {
    transform: scale(1.3);
    box-shadow: 0 0 0 6px rgba(139, 92, 246, 0.3);
  }

  .audio-slider.dragging::-moz-range-thumb {
    transform: scale(1.3);
    box-shadow: 0 0 0 6px rgba(139, 92, 246, 0.3);
  }

  /* Progress track for WebKit */
  .audio-slider::-webkit-slider-runnable-track {
    background: linear-gradient(
      to right,
      var(--slider-color, #8B5CF6) 0%,
      var(--slider-color, #8B5CF6) var(--slider-progress, 50%),
      #2D2D4A var(--slider-progress, 50%),
      #2D2D4A 100%
    );
    border-radius: 3px;
  }

  .audio-status {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid #2D2D4A;
  }

  .audio-status-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .audio-status-item:last-child {
    margin-bottom: 0;
  }

  .audio-status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #2D2D4A;
    transition: background 0.2s ease;
  }

  .audio-status-indicator.active {
    background: #00ff00;
    box-shadow: 0 0 8px rgba(0, 255, 0, 0.5);
  }

  .audio-status-label {
    font-size: 12px;
    color: #94A3B8;
  }

  /* Mobile responsiveness */
  @media (max-width: 640px) {
    .audio-controls {
      padding: 16px;
    }

    .audio-controls-title {
      font-size: 16px;
    }

    .audio-controls-subtitle {
      font-size: 12px;
    }

    .audio-slider-label {
      font-size: 13px;
    }

    .audio-slider-value {
      font-size: 11px;
    }
  }
`;

export default AudioControls;
