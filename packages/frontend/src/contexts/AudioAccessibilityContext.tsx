/**
 * AudioAccessibilityContext - Manages audio accessibility settings
 *
 * Features:
 * - Visual sound indicators for deaf/HoH users
 * - Audio descriptions for screen readers
 * - Subtitle system for game events
 * - Audio reduction mode (minimize sensory overload)
 * - Settings persistence via localStorage
 *
 * @module contexts/AudioAccessibilityContext
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

/**
 * Audio accessibility settings
 */
export interface AudioAccessibilitySettings {
  /** Show visual indicators when sounds play */
  visualSoundIndicators: boolean;
  /** Enable audio descriptions for screen readers */
  audioDescriptions: boolean;
  /** Show subtitles for game events */
  subtitles: boolean;
  /** Reduce audio volume globally (sensory overload prevention) */
  audioReductionMode: boolean;
  /** Subtitle text size multiplier (1.0 = default) */
  subtitleSize: number;
  /** Sound indicator duration in milliseconds */
  indicatorDuration: number;
}

/**
 * Default accessibility settings
 */
const DEFAULT_SETTINGS: AudioAccessibilitySettings = {
  visualSoundIndicators: false,
  audioDescriptions: false,
  subtitles: false,
  audioReductionMode: false,
  subtitleSize: 1.0,
  indicatorDuration: 1000,
};

/**
 * Sound event for visual indicators and subtitles
 */
export interface SoundEvent {
  id: string;
  type: string;
  label: string;
  description?: string;
  timestamp: number;
  duration?: number;
  category?: 'sfx' | 'music' | 'voice' | 'ui';
  game?: string;
}

/**
 * Context value interface
 */
interface AudioAccessibilityContextValue {
  settings: AudioAccessibilitySettings;
  updateSettings: (settings: Partial<AudioAccessibilitySettings>) => void;
  resetSettings: () => void;
  soundEvents: SoundEvent[];
  addSoundEvent: (event: Omit<SoundEvent, 'id' | 'timestamp'>) => void;
  clearSoundEvents: () => void;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
}

/**
 * Audio accessibility context
 */
const AudioAccessibilityContext = createContext<AudioAccessibilityContextValue | undefined>(
  undefined
);

/**
 * Storage key for persisting settings
 */
const STORAGE_KEY = 'x402arcade_audio_accessibility_settings';

/**
 * AudioAccessibilityProvider component
 *
 * Provides audio accessibility settings and utilities to child components.
 */
export const AudioAccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AudioAccessibilitySettings>(() => {
    // Load settings from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      // Silent fail - return defaults if localStorage is unavailable
      // eslint-disable-next-line no-console
      console.error('Failed to load audio accessibility settings:', error);
    }
    return DEFAULT_SETTINGS;
  });

  const [soundEvents, setSoundEvents] = useState<SoundEvent[]>([]);

  // Persist settings to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      // Silent fail - settings won't persist if localStorage is unavailable
      // eslint-disable-next-line no-console
      console.error('Failed to save audio accessibility settings:', error);
    }
  }, [settings]);

  /**
   * Update accessibility settings
   */
  const updateSettings = useCallback((updates: Partial<AudioAccessibilitySettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  /**
   * Reset settings to defaults
   */
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  /**
   * Add a sound event for visual indicators and subtitles
   */
  const addSoundEvent = useCallback(
    (event: Omit<SoundEvent, 'id' | 'timestamp'>) => {
      const fullEvent: SoundEvent = {
        ...event,
        id: `sound-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };

      setSoundEvents((prev) => [...prev, fullEvent]);

      // Auto-remove after duration + indicator duration
      const removeAfter = (event.duration || 0) + settings.indicatorDuration + 1000;
      setTimeout(() => {
        setSoundEvents((prev) => prev.filter((e) => e.id !== fullEvent.id));
      }, removeAfter);
    },
    [settings.indicatorDuration]
  );

  /**
   * Clear all sound events
   */
  const clearSoundEvents = useCallback(() => {
    setSoundEvents([]);
  }, []);

  /**
   * Announce message to screen reader
   */
  const announceToScreenReader = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      if (!settings.audioDescriptions) return;

      // Create a live region element
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only'; // Screen reader only
      liveRegion.textContent = message;

      document.body.appendChild(liveRegion);

      // Remove after announcement
      setTimeout(() => {
        document.body.removeChild(liveRegion);
      }, 1000);
    },
    [settings.audioDescriptions]
  );

  const value: AudioAccessibilityContextValue = {
    settings,
    updateSettings,
    resetSettings,
    soundEvents,
    addSoundEvent,
    clearSoundEvents,
    announceToScreenReader,
  };

  return (
    <AudioAccessibilityContext.Provider value={value}>
      {children}
    </AudioAccessibilityContext.Provider>
  );
};

/**
 * Hook to use audio accessibility context
 */
export const useAudioAccessibility = (): AudioAccessibilityContextValue => {
  const context = useContext(AudioAccessibilityContext);
  if (!context) {
    throw new Error('useAudioAccessibility must be used within AudioAccessibilityProvider');
  }
  return context;
};
