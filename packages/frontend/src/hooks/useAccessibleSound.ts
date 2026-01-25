/**
 * useAccessibleSound - Hook for playing sounds with accessibility features
 *
 * Wraps the standard sound playback to automatically:
 * - Show visual indicators
 * - Display subtitles
 * - Announce to screen readers
 * - Apply audio reduction if enabled
 *
 * @module hooks/useAccessibleSound
 */

import { useCallback } from 'react';
import { useSFX } from './useSFX';
import { useAudioAccessibility } from '../contexts/AudioAccessibilityContext';

export interface AccessibleSoundOptions {
  /** Sound ID to play */
  soundId: string;
  /** Human-readable label for the sound */
  label: string;
  /** Detailed description for subtitles (optional, defaults to label) */
  description?: string;
  /** Sound category */
  category?: 'sfx' | 'music' | 'voice' | 'ui';
  /** Game identifier (for game-specific sounds) */
  game?: string;
  /** Sound duration in milliseconds (for auto-dismissal) */
  duration?: number;
  /** Volume (0.0 to 1.0) */
  volume?: number;
  /** Whether to loop the sound */
  loop?: boolean;
}

/**
 * Hook for accessible sound playback
 *
 * Returns a function that plays sounds with full accessibility support.
 */
export const useAccessibleSound = () => {
  const sfx = useSFX();
  const { settings, addSoundEvent, announceToScreenReader } = useAudioAccessibility();

  const playAccessibleSound = useCallback(
    (options: AccessibleSoundOptions) => {
      const { soundId, label, description, category, game, duration, volume, loop } = options;

      // Apply audio reduction if enabled
      let adjustedVolume = volume ?? 1.0;
      if (settings.audioReductionMode) {
        adjustedVolume *= 0.3; // Reduce to 30% of original volume
      }

      // Play the sound via SFX engine
      sfx.play(soundId, { volume: adjustedVolume, loop });

      // Add sound event for visual indicators and subtitles
      addSoundEvent({
        type: soundId,
        label,
        description,
        category,
        game,
        duration,
      });

      // Announce to screen reader if enabled
      if (settings.audioDescriptions) {
        announceToScreenReader(description || label, 'polite');
      }
    },
    [sfx, settings, addSoundEvent, announceToScreenReader]
  );

  return { playAccessibleSound, sfx };
};
