/**
 * AudioAccessibilitySettings - Settings panel for audio accessibility features
 *
 * Allows users to configure:
 * - Visual sound indicators
 * - Audio descriptions
 * - Subtitles
 * - Audio reduction mode
 * - Subtitle size
 *
 * @module components/accessibility/AudioAccessibilitySettings
 */

import React from 'react';
import { useAudioAccessibility } from '../../contexts/AudioAccessibilityContext';

/**
 * Audio accessibility settings panel component
 */
export const AudioAccessibilitySettings: React.FC = () => {
  const { settings, updateSettings, resetSettings, announceToScreenReader } =
    useAudioAccessibility();

  const handleToggle = (key: keyof typeof settings, value: boolean) => {
    updateSettings({ [key]: value });

    // Announce change to screen reader
    const featureName = key.replace(/([A-Z])/g, ' $1').toLowerCase();
    announceToScreenReader(`${featureName} ${value ? 'enabled' : 'disabled'}`);
  };

  const handleSliderChange = (key: keyof typeof settings, value: number) => {
    updateSettings({ [key]: value });
  };

  return (
    <div
      style={{
        backgroundColor: '#1a1a2e',
        border: '2px solid #2d2d4a',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '600px',
      }}
      role="region"
      aria-label="Audio Accessibility Settings"
    >
      {/* Header */}
      <h2
        style={{
          color: '#ffffff',
          fontSize: '24px',
          fontWeight: 700,
          marginBottom: '8px',
          fontFamily: 'Orbitron, sans-serif',
        }}
      >
        Audio Accessibility
      </h2>
      <p
        style={{
          color: '#94a3b8',
          fontSize: '14px',
          marginBottom: '24px',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        Configure audio accessibility features for deaf/HoH users and sensory-sensitive players
      </p>

      {/* Settings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Visual Sound Indicators */}
        <div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              color: '#ffffff',
              fontSize: '16px',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <input
              type="checkbox"
              checked={settings.visualSoundIndicators}
              onChange={(e) => handleToggle('visualSoundIndicators', e.target.checked)}
              style={{
                width: '20px',
                height: '20px',
                cursor: 'pointer',
              }}
              aria-label="Enable visual sound indicators"
            />
            <span>Visual Sound Indicators</span>
          </label>
          <p
            style={{
              color: '#94a3b8',
              fontSize: '13px',
              marginTop: '4px',
              marginLeft: '32px',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Show on-screen indicators when sounds play
          </p>
        </div>

        {/* Audio Descriptions */}
        <div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              color: '#ffffff',
              fontSize: '16px',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <input
              type="checkbox"
              checked={settings.audioDescriptions}
              onChange={(e) => handleToggle('audioDescriptions', e.target.checked)}
              style={{
                width: '20px',
                height: '20px',
                cursor: 'pointer',
              }}
              aria-label="Enable audio descriptions for screen readers"
            />
            <span>Audio Descriptions</span>
          </label>
          <p
            style={{
              color: '#94a3b8',
              fontSize: '13px',
              marginTop: '4px',
              marginLeft: '32px',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Enable screen reader announcements for audio events
          </p>
        </div>

        {/* Subtitles */}
        <div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              color: '#ffffff',
              fontSize: '16px',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <input
              type="checkbox"
              checked={settings.subtitles}
              onChange={(e) => handleToggle('subtitles', e.target.checked)}
              style={{
                width: '20px',
                height: '20px',
                cursor: 'pointer',
              }}
              aria-label="Enable subtitles for game events"
            />
            <span>Subtitles</span>
          </label>
          <p
            style={{
              color: '#94a3b8',
              fontSize: '13px',
              marginTop: '4px',
              marginLeft: '32px',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Show text descriptions of game sounds and events
          </p>

          {/* Subtitle Size Slider */}
          {settings.subtitles && (
            <div style={{ marginTop: '12px', marginLeft: '32px' }}>
              <label
                htmlFor="subtitle-size"
                style={{
                  color: '#ffffff',
                  fontSize: '14px',
                  display: 'block',
                  marginBottom: '8px',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Subtitle Size: {(settings.subtitleSize * 100).toFixed(0)}%
              </label>
              <input
                id="subtitle-size"
                type="range"
                min="0.8"
                max="2.0"
                step="0.1"
                value={settings.subtitleSize}
                onChange={(e) => handleSliderChange('subtitleSize', parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  cursor: 'pointer',
                }}
                aria-label="Subtitle text size"
              />
            </div>
          )}
        </div>

        {/* Audio Reduction Mode */}
        <div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              color: '#ffffff',
              fontSize: '16px',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <input
              type="checkbox"
              checked={settings.audioReductionMode}
              onChange={(e) => handleToggle('audioReductionMode', e.target.checked)}
              style={{
                width: '20px',
                height: '20px',
                cursor: 'pointer',
              }}
              aria-label="Enable audio reduction mode"
            />
            <span>Audio Reduction Mode</span>
          </label>
          <p
            style={{
              color: '#94a3b8',
              fontSize: '13px',
              marginTop: '4px',
              marginLeft: '32px',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Reduce audio volume globally (sensory overload prevention)
          </p>
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={() => {
          resetSettings();
          announceToScreenReader('Audio accessibility settings reset to defaults');
        }}
        style={{
          marginTop: '24px',
          padding: '12px 24px',
          backgroundColor: '#2d2d4a',
          color: '#ffffff',
          border: '2px solid #00ffff',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#3d3d5a';
          e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 255, 255, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#2d2d4a';
          e.currentTarget.style.boxShadow = 'none';
        }}
        aria-label="Reset audio accessibility settings to defaults"
      >
        Reset to Defaults
      </button>
    </div>
  );
};
