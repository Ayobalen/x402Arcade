/**
 * AudioContext - Global audio state management
 *
 * Provides audio state and controls to the entire app via React Context
 *
 * @module AudioContext
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useAudio } from '../hooks/useAudio';
import { AudioCategory, AudioOptions } from '../utils/AudioManager';

/**
 * Audio context value type
 */
interface AudioContextValue {
  // State
  isInitialized: boolean;
  isUnlocked: boolean;
  isMuted: boolean;
  isEnabled: boolean;
  masterVolume: number;

  // Controls
  initialize: () => Promise<boolean>;
  unlock: () => Promise<boolean>;
  play: (id: string, options?: AudioOptions) => number | null;
  stop: (id: string, soundId?: number) => void;
  pause: (id: string, soundId?: number) => void;
  resume: (id: string, soundId?: number) => void;
  loadSound: (id: string, src: string | string[], options?: AudioOptions) => Promise<void>;
  unloadSound: (id: string) => void;
  setMasterVolume: (volume: number) => void;
  setCategoryVolume: (category: AudioCategory, volume: number) => void;
  getCategoryVolume: (category: AudioCategory) => number;
  mute: () => void;
  unmute: () => void;
  toggleMute: () => boolean;
  enable: () => void;
  disable: () => void;
  stopAll: () => void;
  unloadAll: () => void;
}

/**
 * Create context
 */
const AudioContext = createContext<AudioContextValue | null>(null);

/**
 * AudioProvider props
 */
interface AudioProviderProps {
  children: ReactNode;
  autoInitialize?: boolean;
  autoUnlock?: boolean;
}

/**
 * AudioProvider Component
 *
 * Wrap your app with this to provide audio controls everywhere
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <AudioProvider>
 *       <YourApp />
 *     </AudioProvider>
 *   );
 * }
 * ```
 */
export const AudioProvider: React.FC<AudioProviderProps> = ({
  children,
  autoInitialize = true,
  autoUnlock = true,
}) => {
  const audio = useAudio(autoInitialize, autoUnlock);

  return <AudioContext.Provider value={audio}>{children}</AudioContext.Provider>;
};

/**
 * useAudioContext Hook
 *
 * Access audio controls from any component
 *
 * @throws Error if used outside AudioProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const audio = useAudioContext();
 *
 *   return (
 *     <button onClick={() => audio.toggleMute()}>
 *       {audio.isMuted ? 'Unmute' : 'Mute'}
 *     </button>
 *   );
 * }
 * ```
 */
export const useAudioContext = (): AudioContextValue => {
  const context = useContext(AudioContext);

  if (!context) {
    throw new Error('useAudioContext must be used within an AudioProvider');
  }

  return context;
};

export default AudioContext;
