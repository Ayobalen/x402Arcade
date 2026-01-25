/**
 * AudioSubtitles - Subtitle system for game audio events
 *
 * Displays real-time subtitles for game sounds and events, making games
 * accessible to deaf and hard-of-hearing users.
 *
 * Features:
 * - Real-time subtitle display
 * - Configurable text size
 * - High contrast background
 * - Multiple subtitle tracks (stacked)
 * - Auto-dismissal after duration
 *
 * @module components/accessibility/AudioSubtitles
 */

import React from 'react';
import { useAudioAccessibility, type SoundEvent } from '../../contexts/AudioAccessibilityContext';

/**
 * Individual subtitle component
 */
const SubtitleItem: React.FC<{ event: SoundEvent; index: number; totalCount: number }> = ({
  event,
  index,
  totalCount,
}) => {
  const { settings } = useAudioAccessibility();

  // Calculate opacity based on recency (most recent = most opaque)
  const opacity = 1 - (totalCount - index - 1) * 0.2;

  // Format subtitle text
  const subtitleText = event.description || event.label;

  return (
    <div
      className="audio-subtitle-item"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        color: '#ffffff',
        padding: '12px 24px',
        borderRadius: '8px',
        marginBottom: index < totalCount - 1 ? '8px' : '0',
        fontSize: `${14 * settings.subtitleSize}px`,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 600,
        lineHeight: 1.4,
        textAlign: 'center',
        opacity: opacity,
        border: '2px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
        animation: index === totalCount - 1 ? 'subtitleFadeIn 0.2s ease-out' : 'none',
        transition: 'all 0.3s ease',
      }}
      role="region"
      aria-live="polite"
      aria-label={`Subtitle: ${subtitleText}`}
    >
      {/* Bracket decoration */}
      <span style={{ opacity: 0.6, marginRight: '8px' }}>[</span>

      {/* Main subtitle text */}
      <span>{subtitleText}</span>

      {/* Bracket decoration */}
      <span style={{ opacity: 0.6, marginLeft: '8px' }}>]</span>
    </div>
  );
};

/**
 * Audio subtitles container component
 *
 * Displays subtitles for audio events at the bottom center of the screen
 */
export const AudioSubtitles: React.FC = () => {
  const { settings, soundEvents } = useAudioAccessibility();

  if (!settings.subtitles || soundEvents.length === 0) {
    return null;
  }

  // Show only the most recent 3 subtitles
  const recentEvents = soundEvents.slice(-3);

  return (
    <>
      {/* Add CSS animations */}
      <style>{`
        @keyframes subtitleFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .audio-subtitle-item {
          max-width: 80vw;
          word-wrap: break-word;
        }

        /* Reduce motion for users who prefer it */
        @media (prefers-reduced-motion: reduce) {
          .audio-subtitle-item {
            animation: none !important;
            transition: none !important;
          }
        }

        /* Responsive font sizing */
        @media (max-width: 640px) {
          .audio-subtitle-item {
            font-size: ${12 * settings.subtitleSize}px !important;
            padding: 10px 20px !important;
          }
        }
      `}</style>

      {/* Subtitle container */}
      <div
        style={{
          position: 'fixed',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'none',
          userSelect: 'none',
          maxWidth: '90vw',
        }}
        aria-label="Audio subtitles"
      >
        {recentEvents.map((event, index) => (
          <SubtitleItem
            key={event.id}
            event={event}
            index={index}
            totalCount={recentEvents.length}
          />
        ))}
      </div>
    </>
  );
};
