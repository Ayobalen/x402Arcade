/**
 * SoundIndicator - Visual indicators for sound events
 *
 * Displays visual feedback when sounds play, making the app accessible
 * to deaf and hard-of-hearing users.
 *
 * Features:
 * - Icon-based indicators for different sound types
 * - Animated appearance and fade-out
 * - Color-coded by sound category
 * - Positioning in corners to avoid blocking game view
 *
 * @module components/accessibility/SoundIndicator
 */

import React from 'react';
import { useAudioAccessibility, type SoundEvent } from '../../contexts/AudioAccessibilityContext';

/**
 * Get icon for sound type
 */
function getSoundIcon(type: string, category?: string): string {
  // Game-specific icons
  if (type.includes('shoot') || type.includes('fire')) return '🔫';
  if (type.includes('explosion') || type.includes('death')) return '💥';
  if (type.includes('powerup') || type.includes('bonus')) return '⭐';
  if (type.includes('hit') || type.includes('collision')) return '💢';
  if (type.includes('jump')) return '⬆️';
  if (type.includes('coin') || type.includes('score')) return '💰';

  // Category-based icons
  if (category === 'music') return '🎵';
  if (category === 'voice') return '💬';
  if (category === 'ui') return '🔔';

  // Default SFX icon
  return '🔊';
}

/**
 * Get color for sound category
 */
function getCategoryColor(category?: string): string {
  switch (category) {
    case 'sfx':
      return '#00ffff'; // Cyan
    case 'music':
      return '#ff00ff'; // Magenta
    case 'voice':
      return '#ffff00'; // Yellow
    case 'ui':
      return '#00ff00'; // Green
    default:
      return '#ffffff'; // White
  }
}

/**
 * Individual sound indicator component
 */
const SoundIndicatorItem: React.FC<{ event: SoundEvent; index: number }> = ({ event, index }) => {
  const icon = getSoundIcon(event.type, event.category);
  const color = getCategoryColor(event.category);

  return (
    <div
      className="sound-indicator-item"
      style={{
        position: 'fixed',
        top: `${80 + index * 60}px`,
        right: '20px',
        backgroundColor: 'rgba(10, 10, 15, 0.9)',
        border: `2px solid ${color}`,
        borderRadius: '12px',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 10000,
        boxShadow: `0 0 20px ${color}40, inset 0 0 10px ${color}20`,
        animation:
          'soundIndicatorSlideIn 0.3s ease-out, soundIndicatorFadeOut 0.3s ease-in 0.7s forwards',
      }}
      role="status"
      aria-live="polite"
      aria-label={`Sound: ${event.label}`}
    >
      {/* Icon */}
      <div
        style={{
          fontSize: '24px',
          lineHeight: 1,
          filter: 'drop-shadow(0 0 4px currentColor)',
        }}
        aria-hidden="true"
      >
        {icon}
      </div>

      {/* Label */}
      <div
        style={{
          color: color,
          fontSize: '14px',
          fontWeight: 600,
          fontFamily: 'Inter, sans-serif',
          letterSpacing: '0.5px',
          textShadow: `0 0 8px ${color}`,
        }}
      >
        {event.label}
      </div>
    </div>
  );
};

/**
 * Sound indicator container component
 *
 * Displays all active sound events as visual indicators
 */
export const SoundIndicator: React.FC = () => {
  const { settings, soundEvents } = useAudioAccessibility();

  if (!settings.visualSoundIndicators || soundEvents.length === 0) {
    return null;
  }

  return (
    <>
      {/* Add CSS animations */}
      <style>{`
        @keyframes soundIndicatorSlideIn {
          from {
            transform: translateX(100px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes soundIndicatorFadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
            transform: translateX(50px);
          }
        }

        .sound-indicator-item {
          pointer-events: none;
          user-select: none;
        }

        /* Reduce motion for users who prefer it */
        @media (prefers-reduced-motion: reduce) {
          .sound-indicator-item {
            animation: none !important;
          }
        }
      `}</style>

      {/* Render sound events */}
      {soundEvents.slice(-5).map((event, index) => (
        <SoundIndicatorItem key={event.id} event={event} index={index} />
      ))}
    </>
  );
};
