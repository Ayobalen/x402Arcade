/**
 * BackgroundMusic Component
 *
 * Provides persistent background music for the arcade
 * with procedurally generated chiptune music and mute control
 *
 * @module BackgroundMusic
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createArcadeMusic, DEFAULT_ARCADE_MUSIC_CONFIG } from '@/utils/ProceduralMusic';
import { cn } from '@/lib/utils';

/**
 * BackgroundMusic props
 */
export interface BackgroundMusicProps {
  /**
   * Whether to autoplay on mount
   */
  autoPlay?: boolean;

  /**
   * Whether to show the mute button
   */
  showMuteButton?: boolean;

  /**
   * Initial volume (0-1)
   */
  initialVolume?: number;

  /**
   * Custom class name
   */
  className?: string;
}

/**
 * BackgroundMusic Component
 *
 * Plays looping procedural arcade music with mute control
 */
export function BackgroundMusic({
  autoPlay = true,
  showMuteButton = true,
  initialVolume = 0.3,
  className,
}: BackgroundMusicProps) {
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('x402arcade:bgMusicMuted');
    return saved ? JSON.parse(saved) : true; // Default to muted
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioBuffersRef = useRef<AudioBuffer[]>([]);
  const shuffleOrderRef = useRef<number[]>([]);
  const isMutedRef = useRef<boolean>(isMuted);

  // Keep isMutedRef in sync with isMuted state
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  /**
   * Stop playback
   */
  const stopPlayback = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch {
        // Ignore errors if already stopped
      }
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  /**
   * Start playback
   */
  const startPlayback = useCallback(() => {
    if (
      !audioContextRef.current ||
      audioBuffersRef.current.length === 0 ||
      !gainNodeRef.current ||
      isPlaying
    ) {
      return;
    }

    try {
      // Resume audio context if suspended (browser autoplay policy)
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      // Get current track from shuffle order
      const trackIndex = shuffleOrderRef.current[currentTrackIndex];
      const audioBuffer = audioBuffersRef.current[trackIndex];

      // Create source node
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = false; // Don't loop - we'll play next track when this ends
      source.connect(gainNodeRef.current);

      // When track ends, play next track
      source.onended = () => {
        setIsPlaying(false);

        // Move to next track in shuffle order
        const nextIndex = (currentTrackIndex + 1) % shuffleOrderRef.current.length;
        setCurrentTrackIndex(nextIndex);

        // If we've completed the shuffle, reshuffle
        if (nextIndex === 0) {
          shuffleOrderRef.current = Array.from(
            { length: audioBuffersRef.current.length },
            (_, i) => i
          ).sort(() => Math.random() - 0.5);
        }

        // Play next track if not muted (use ref to get current value)
        if (!isMutedRef.current) {
          setTimeout(() => startPlayback(), 100);
        }
      };

      source.start(0);

      sourceNodeRef.current = source;
      setIsPlaying(true);
    } catch (error) {
      // Silently handle playback errors
    }
  }, [isPlaying, currentTrackIndex]);

  /**
   * Initialize audio and generate music
   */
  useEffect(() => {
    const initAudio = async () => {
      try {
        setIsLoading(true);

        // Create audio context
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();

        // Create gain node for volume control
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.gain.value = isMuted ? 0 : initialVolume;
        gainNodeRef.current.connect(audioContextRef.current.destination);

        // Define multiple track configurations for variety
        const trackConfigs = [
          {
            name: 'Heroic Arcade',
            tempo: 130,
            key: 60, // C
            scale: 'majorPentatonic' as const,
            progression: 'heroic' as const,
            duration: 30,
            volume: 0.7,
          },
          {
            name: 'Classic Groove',
            tempo: 140,
            key: 67, // G
            scale: 'majorPentatonic' as const,
            progression: 'classic' as const,
            duration: 30,
            volume: 0.7,
          },
          {
            name: 'Mysterious Journey',
            tempo: 120,
            key: 57, // A
            scale: 'minorPentatonic' as const,
            progression: 'heroic' as const,
            duration: 30,
            volume: 0.7,
          },
          {
            name: 'Energetic Quest',
            tempo: 150,
            key: 65, // F
            scale: 'majorPentatonic' as const,
            progression: 'classic' as const,
            duration: 30,
            volume: 0.7,
          },
        ];

        // Generate all tracks
        console.log('[BackgroundMusic] Generating', trackConfigs.length, 'tracks...');
        const buffers = await Promise.all(
          trackConfigs.map((config, index) =>
            createArcadeMusic({
              ...DEFAULT_ARCADE_MUSIC_CONFIG,
              ...config,
            }).then((buffer) => {
              console.log(`[BackgroundMusic] Track ${index + 1}/${trackConfigs.length} generated: ${config.name}`);
              return buffer;
            })
          )
        );

        audioBuffersRef.current = buffers;

        // Create shuffle order
        shuffleOrderRef.current = Array.from({ length: buffers.length }, (_, i) => i)
          .sort(() => Math.random() - 0.5);

        setIsLoading(false);
        console.log('[BackgroundMusic] All tracks generated. Shuffle order:', shuffleOrderRef.current);

        // Start playing if autoPlay and not muted
        if (autoPlay && !isMuted) {
          startPlayback();
        }
      } catch (error) {
        console.error('[BackgroundMusic] Failed to initialize:', error);
        setIsLoading(false);
      }
    };

    initAudio();

    // Cleanup on unmount
    return () => {
      stopPlayback();
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  /**
   * Toggle mute
   */
  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    localStorage.setItem('x402arcade:bgMusicMuted', JSON.stringify(newMuted));

    if (newMuted) {
      // Muting - stop playback
      stopPlayback();
    } else {
      // Unmuting - start playback
      if (!isLoading && audioBuffersRef.current.length > 0) {
        startPlayback();
      }
    }
  }, [isMuted, isLoading, stopPlayback, startPlayback]);

  /**
   * Handle user interaction to unlock audio
   */
  const handleUserInteraction = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    if (!isPlaying && !isMuted && !isLoading) {
      startPlayback();
    }
  }, [isPlaying, isMuted, isLoading, startPlayback]);

  // Add event listener for user interaction (to unlock audio on mobile)
  useEffect(() => {
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [handleUserInteraction]);

  if (!showMuteButton) {
    return null;
  }

  return (
    <div className={cn('fixed bottom-6 right-6 z-50', className)}>
      <AnimatePresence>
        <motion.button
          onClick={toggleMute}
          className={cn(
            'flex items-center justify-center',
            'w-14 h-14 rounded-full',
            'bg-[var(--color-surface-primary)]',
            'border-2',
            isMuted
              ? 'border-[var(--color-border)] text-[var(--color-text-tertiary)]'
              : 'border-[var(--color-primary)] text-[var(--color-primary)]',
            'shadow-lg backdrop-blur-sm',
            'transition-all duration-200',
            'hover:scale-110 active:scale-95',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2'
          )}
          style={
            !isMuted
              ? {
                  boxShadow: '0 0 20px var(--color-primary-glow)',
                }
              : undefined
          }
          aria-label={isMuted ? 'Unmute background music' : 'Mute background music'}
          disabled={isLoading}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {isLoading ? (
            <motion.div
              className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          ) : isMuted ? (
            <VolumeX size={24} />
          ) : (
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Volume2 size={24} />
            </motion.div>
          )}
        </motion.button>
      </AnimatePresence>

      {/* Status indicator */}
      {isPlaying && !isMuted && (
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--color-success)] rounded-full"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [1, 0.7, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            boxShadow: '0 0 10px var(--color-success-glow)',
          }}
        />
      )}
    </div>
  );
}

export default BackgroundMusic;
