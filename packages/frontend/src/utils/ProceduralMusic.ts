/**
 * ProceduralMusic - Generate retro arcade background music
 *
 * Creates chiptune-style music procedurally using Web Audio API
 * with arcade-appropriate melodies and harmonies
 *
 * @module ProceduralMusic
 */

/**
 * Musical scales for procedural generation
 */
const SCALES = {
  // Major pentatonic (happy, upbeat arcade feel)
  majorPentatonic: [0, 2, 4, 7, 9],
  // Minor pentatonic (darker, more mysterious)
  minorPentatonic: [0, 3, 5, 7, 10],
  // Chromatic (for glitchy effects)
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

/**
 * Chord progressions (common in retro game music)
 */
const CHORD_PROGRESSIONS = {
  classic: [
    [0, 4, 7], // I (tonic)
    [5, 9, 12], // IV (subdominant)
    [7, 11, 14], // V (dominant)
    [0, 4, 7], // I (tonic)
  ],
  heroic: [
    [0, 4, 7], // I
    [7, 11, 14], // V
    [5, 9, 12], // IV
    [0, 4, 7], // I
  ],
};

/**
 * Arcade music configuration
 */
export interface ArcadeMusicConfig {
  tempo: number; // BPM
  key: number; // Root note (MIDI number)
  scale: keyof typeof SCALES;
  progression: keyof typeof CHORD_PROGRESSIONS;
  duration: number; // Duration in seconds
  volume: number; // 0-1
}

/**
 * Generate procedural arcade music
 */
export class ProceduralMusicGenerator {
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;

  /**
   * Initialize audio context
   */
  private initAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Convert MIDI note to frequency
   */
  private midiToFreq(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  /**
   * Generate a square wave (classic chiptune sound)
   */
  private generateSquareWave(
    frequency: number,
    duration: number,
    sampleRate: number,
    volume: number
  ): Float32Array {
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const value = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
      buffer[i] = value * volume;
    }

    return buffer;
  }

  /**
   * Generate a triangle wave (softer chiptune sound)
   */
  private generateTriangleWave(
    frequency: number,
    duration: number,
    sampleRate: number,
    volume: number
  ): Float32Array {
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const period = 1 / frequency;
      const phase = (t % period) / period;
      const value = 2 * Math.abs(2 * phase - 1) - 1;
      buffer[i] = value * volume;
    }

    return buffer;
  }

  /**
   * Apply ADSR envelope
   */
  private applyEnvelope(
    buffer: Float32Array,
    attack: number,
    decay: number,
    sustain: number,
    release: number,
    sampleRate: number
  ): void {
    const attackSamples = Math.floor(attack * sampleRate);
    const decaySamples = Math.floor(decay * sampleRate);
    const releaseSamples = Math.floor(release * sampleRate);
    const totalSamples = buffer.length;

    for (let i = 0; i < totalSamples; i++) {
      let envelope = 1;

      if (i < attackSamples) {
        // Attack phase
        envelope = i / attackSamples;
      } else if (i < attackSamples + decaySamples) {
        // Decay phase
        const decayProgress = (i - attackSamples) / decaySamples;
        envelope = 1 - decayProgress * (1 - sustain);
      } else if (i < totalSamples - releaseSamples) {
        // Sustain phase
        envelope = sustain;
      } else {
        // Release phase
        const releaseProgress = (i - (totalSamples - releaseSamples)) / releaseSamples;
        envelope = sustain * (1 - releaseProgress);
      }

      buffer[i] *= envelope;
    }
  }

  /**
   * Generate a melody line
   */
  private generateMelody(
    config: ArcadeMusicConfig,
    sampleRate: number,
    totalSamples: number
  ): Float32Array {
    const buffer = new Float32Array(totalSamples);
    const scale = SCALES[config.scale];
    const beatDuration = 60 / config.tempo; // Duration of one beat in seconds
    const noteDuration = beatDuration / 2; // 8th notes

    let currentSample = 0;
    let currentNote = 0;

    while (currentSample < totalSamples) {
      // Pick a note from the scale (with some melodic movement)
      const scaleNote = scale[currentNote % scale.length];
      const octaveShift = Math.floor(currentNote / scale.length) % 2; // Vary octave
      const midi = config.key + 12 + scaleNote + octaveShift * 12; // Start one octave up
      const frequency = this.midiToFreq(midi);

      // Generate square wave for lead melody
      const noteBuffer = this.generateSquareWave(
        frequency,
        noteDuration,
        sampleRate,
        config.volume * 0.4
      );

      // Apply envelope
      this.applyEnvelope(noteBuffer, 0.01, 0.05, 0.7, 0.1, sampleRate);

      // Mix into main buffer
      for (let i = 0; i < noteBuffer.length && currentSample + i < totalSamples; i++) {
        buffer[currentSample + i] += noteBuffer[i];
      }

      currentSample += noteBuffer.length;
      currentNote = (currentNote + Math.floor(Math.random() * 3)) % (scale.length * 2); // Semi-random melody
    }

    return buffer;
  }

  /**
   * Generate bass line
   */
  private generateBass(
    config: ArcadeMusicConfig,
    sampleRate: number,
    totalSamples: number
  ): Float32Array {
    const buffer = new Float32Array(totalSamples);
    const progression = CHORD_PROGRESSIONS[config.progression];
    const measureDuration = (60 / config.tempo) * 4; // 4 beats per measure
    const measureSamples = Math.floor(measureDuration * sampleRate);

    let currentSample = 0;
    let currentChord = 0;

    while (currentSample < totalSamples) {
      const chord = progression[currentChord % progression.length];
      const bassNote = chord[0]; // Root note of chord
      const midi = config.key - 12 + bassNote; // One octave below root
      const frequency = this.midiToFreq(midi);

      // Generate triangle wave for bass
      const noteDuration = Math.min(measureDuration, (totalSamples - currentSample) / sampleRate);
      const noteBuffer = this.generateTriangleWave(
        frequency,
        noteDuration,
        sampleRate,
        config.volume * 0.3
      );

      // Apply envelope
      this.applyEnvelope(noteBuffer, 0.02, 0.1, 0.8, 0.2, sampleRate);

      // Mix into main buffer
      for (let i = 0; i < noteBuffer.length && currentSample + i < totalSamples; i++) {
        buffer[currentSample + i] += noteBuffer[i];
      }

      currentSample += measureSamples;
      currentChord++;
    }

    return buffer;
  }

  /**
   * Generate arpeggio pattern
   */
  private generateArpeggio(
    config: ArcadeMusicConfig,
    sampleRate: number,
    totalSamples: number
  ): Float32Array {
    const buffer = new Float32Array(totalSamples);
    const progression = CHORD_PROGRESSIONS[config.progression];
    const noteDuration = (60 / config.tempo) / 4; // 16th notes
    const noteSamples = Math.floor(noteDuration * sampleRate);
    const measureDuration = (60 / config.tempo) * 4;
    const measureSamples = Math.floor(measureDuration * sampleRate);

    let currentSample = 0;
    let currentChord = 0;

    while (currentSample < totalSamples) {
      const chord = progression[currentChord % progression.length];

      // Arpeggiate through the chord
      for (let i = 0; i < chord.length && currentSample < totalSamples; i++) {
        const midi = config.key + chord[i];
        const frequency = this.midiToFreq(midi);

        const noteBuffer = this.generateSquareWave(
          frequency,
          noteDuration,
          sampleRate,
          config.volume * 0.2
        );

        // Apply envelope
        this.applyEnvelope(noteBuffer, 0.005, 0.02, 0.5, 0.05, sampleRate);

        // Mix into main buffer
        for (let j = 0; j < noteBuffer.length && currentSample + j < totalSamples; j++) {
          buffer[currentSample + j] += noteBuffer[j];
        }

        currentSample += noteSamples;
      }

      // Move to next chord at measure boundaries
      if (currentSample % measureSamples < noteSamples) {
        currentChord++;
      }
    }

    return buffer;
  }

  /**
   * Mix multiple audio buffers
   */
  private mixBuffers(...buffers: Float32Array[]): Float32Array {
    if (buffers.length === 0) {
      return new Float32Array(0);
    }

    const length = buffers[0].length;
    const mixed = new Float32Array(length);

    for (let i = 0; i < length; i++) {
      let sum = 0;
      for (const buffer of buffers) {
        sum += buffer[i];
      }
      // Soft clipping to prevent distortion
      mixed[i] = Math.tanh(sum * 0.8);
    }

    return mixed;
  }

  /**
   * Generate complete arcade music track
   */
  public async generateMusic(config: ArcadeMusicConfig): Promise<AudioBuffer> {
    const audioContext = this.initAudioContext();
    const sampleRate = audioContext.sampleRate;
    const totalSamples = Math.floor(config.duration * sampleRate);

    // Generate individual layers
    const melody = this.generateMelody(config, sampleRate, totalSamples);
    const bass = this.generateBass(config, sampleRate, totalSamples);
    const arpeggio = this.generateArpeggio(config, sampleRate, totalSamples);

    // Mix all layers
    const mixed = this.mixBuffers(melody, bass, arpeggio);

    // Create AudioBuffer
    const audioBuffer = audioContext.createBuffer(1, totalSamples, sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    channelData.set(mixed);

    this.audioBuffer = audioBuffer;
    return audioBuffer;
  }

  /**
   * Get the generated audio buffer
   */
  public getAudioBuffer(): AudioBuffer | null {
    return this.audioBuffer;
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.audioBuffer = null;
  }
}

/**
 * Default arcade music configuration
 */
export const DEFAULT_ARCADE_MUSIC_CONFIG: ArcadeMusicConfig = {
  tempo: 140,
  key: 60, // Middle C
  scale: 'majorPentatonic',
  progression: 'classic',
  duration: 30, // 30 seconds loop
  volume: 0.6,
};

/**
 * Create a procedural arcade music track
 */
export async function createArcadeMusic(
  config: Partial<ArcadeMusicConfig> = {}
): Promise<AudioBuffer> {
  const fullConfig = { ...DEFAULT_ARCADE_MUSIC_CONFIG, ...config };
  const generator = new ProceduralMusicGenerator();
  return generator.generateMusic(fullConfig);
}
