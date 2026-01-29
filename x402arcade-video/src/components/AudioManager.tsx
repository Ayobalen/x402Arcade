import React from 'react';
import { Audio, Sequence, useCurrentFrame, interpolate, staticFile } from 'remotion';
import {
  SOUND_CUES,
  MUSIC_TRACKS,
  DUCKING_ZONES,
  type SoundCue,
  type MusicTrack,
} from '../lib/audioConfig';

/**
 * Sound Effect Component
 * Plays a single sound effect at a specific frame
 */
const SoundEffect: React.FC<{ cue: SoundCue }> = ({ cue }) => {
  return (
    <Sequence from={cue.frame} durationInFrames={cue.duration || 90} name={cue.id}>
      <Audio src={staticFile(`audio/${cue.file}`)} volume={cue.volume} startFrom={0} />
    </Sequence>
  );
};

/**
 * Background Music Component
 * Plays music with ducking (volume automation)
 */
const BackgroundMusic: React.FC<{ track: MusicTrack }> = ({ track }) => {
  const frame = useCurrentFrame();

  // Calculate base volume with fade in/out
  let volume = track.volume;

  // Fade in
  if (frame < track.startFrame + track.fadeIn) {
    volume = interpolate(
      frame,
      [track.startFrame, track.startFrame + track.fadeIn],
      [0, track.volume],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
  }

  // Fade out
  if (frame > track.endFrame - track.fadeOut) {
    volume = interpolate(
      frame,
      [track.endFrame - track.fadeOut, track.endFrame],
      [track.volume, 0],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
  }

  // Apply ducking
  for (const zone of DUCKING_ZONES) {
    if (frame >= zone.startFrame && frame <= zone.endFrame) {
      volume *= zone.targetVolume;
      break; // Only apply one ducking zone at a time
    }
  }

  return (
    <Sequence
      from={track.startFrame}
      durationInFrames={track.endFrame - track.startFrame}
      name={track.id}
    >
      <Audio src={staticFile(`audio/${track.file}`)} volume={volume} startFrom={0} />
    </Sequence>
  );
};

/**
 * AudioManager Component
 * Orchestrates all audio for the video
 *
 * Usage in MainVideo:
 * <AudioManager />
 */
export const AudioManager: React.FC = () => {
  return (
    <>
      {/* Background Music */}
      {MUSIC_TRACKS.map((track) => (
        <BackgroundMusic key={track.id} track={track} />
      ))}

      {/* Sound Effects */}
      {SOUND_CUES.map((cue) => (
        <SoundEffect key={cue.id} cue={cue} />
      ))}
    </>
  );
};

/**
 * AudioManagerMinimal Component
 * For testing - plays only essential sounds
 */
export const AudioManagerMinimal: React.FC = () => {
  const essentialCues = SOUND_CUES.filter((cue) =>
    ['hook-impact', 'problem-total', 'cta-logo'].includes(cue.id)
  );

  return (
    <>
      {essentialCues.map((cue) => (
        <SoundEffect key={cue.id} cue={cue} />
      ))}
    </>
  );
};

export default AudioManager;
