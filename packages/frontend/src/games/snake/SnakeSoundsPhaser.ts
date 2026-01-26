/**
 * SnakeSoundsPhaser - Procedural sound generation for Snake game using Web Audio API
 *
 * Creates retro arcade sounds procedurally without requiring audio files.
 * Similar to Pong's procedural sound system.
 *
 * @module games/snake/SnakeSoundsPhaser
 */

/**
 * Snake sound types
 */
export enum SnakeSoundType {
  EAT_FOOD = 'snake:eat',
  EAT_FOOD_COMBO = 'snake:eat:combo',
  DEATH = 'snake:death',
  LEVEL_UP = 'snake:levelup',
  TURN = 'snake:turn',
}

/**
 * Generate a simple tone using Web Audio API
 */
function generateTone(
  audioContext: AudioContext,
  frequency: number,
  duration: number,
  type: 'sine' | 'square' | 'triangle' = 'sine'
): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const numSamples = Math.floor(sampleRate * duration);
  const audioBuffer = audioContext.createBuffer(1, numSamples, sampleRate);
  const channelData = audioBuffer.getChannelData(0);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = 1 - i / numSamples; // Linear fade out
    let value = 0;

    if (type === 'sine') {
      value = Math.sin(2 * Math.PI * frequency * t);
    } else if (type === 'square') {
      value = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
    } else if (type === 'triangle') {
      const period = 1 / frequency;
      const phase = (t % period) / period;
      value = 2 * Math.abs(2 * phase - 1) - 1;
    }

    channelData[i] = value * envelope * 0.3;
  }

  return audioBuffer;
}

/**
 * Generate eat food sound - Short positive "nom" beep
 */
function generateEatSound(audioContext: AudioContext): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const duration = 0.1; // 100ms
  const numSamples = Math.floor(sampleRate * duration);
  const audioBuffer = audioContext.createBuffer(1, numSamples, sampleRate);
  const channelData = audioBuffer.getChannelData(0);

  // Two quick ascending notes: C6 (1046Hz) -> E6 (1318Hz)
  const freq1 = 1046;
  const freq2 = 1318;
  const splitPoint = numSamples / 2;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const freq = i < splitPoint ? freq1 : freq2;
    const envelope = 1 - i / numSamples;
    channelData[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.4;
  }

  return audioBuffer;
}

/**
 * Generate combo eat sound - Higher pitched with more energy
 */
function generateComboEatSound(audioContext: AudioContext): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const duration = 0.15; // 150ms
  const numSamples = Math.floor(sampleRate * duration);
  const audioBuffer = audioContext.createBuffer(1, numSamples, sampleRate);
  const channelData = audioBuffer.getChannelData(0);

  // Three ascending notes for combo: C6 -> E6 -> G6
  const frequencies = [1046, 1318, 1568];
  const noteLength = numSamples / 3;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const noteIndex = Math.floor(i / noteLength);
    const freq = frequencies[Math.min(noteIndex, 2)];
    const envelope = 1 - (i % noteLength) / noteLength;
    channelData[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.5;
  }

  return audioBuffer;
}

/**
 * Generate death sound - Descending chromatic scale (game over tone)
 */
function generateDeathSound(audioContext: AudioContext): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const duration = 0.4; // 400ms
  const numSamples = Math.floor(sampleRate * duration);
  const audioBuffer = audioContext.createBuffer(1, numSamples, sampleRate);
  const channelData = audioBuffer.getChannelData(0);

  // Descending notes: E5 -> D5 -> C5 -> A4
  const frequencies = [659, 587, 523, 440];
  const noteLength = numSamples / frequencies.length;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const noteIndex = Math.floor(i / noteLength);
    const freq = frequencies[Math.min(noteIndex, frequencies.length - 1)];
    const envelope = 1 - (i % noteLength) / noteLength;

    // Mix sine and square for richer death sound
    const sine = Math.sin(2 * Math.PI * freq * t);
    const square = Math.sin(2 * Math.PI * freq * t) > 0 ? 0.3 : -0.3;

    channelData[i] = (sine * 0.7 + square) * envelope * 0.4;
  }

  return audioBuffer;
}

/**
 * Generate level up sound - Ascending arpeggio fanfare
 */
function generateLevelUpSound(audioContext: AudioContext): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const duration = 0.5; // 500ms
  const numSamples = Math.floor(sampleRate * duration);
  const audioBuffer = audioContext.createBuffer(1, numSamples, sampleRate);
  const channelData = audioBuffer.getChannelData(0);

  // Ascending C major arpeggio: C5 -> E5 -> G5 -> C6
  const frequencies = [523, 659, 783, 1046];
  const noteLength = numSamples / frequencies.length;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const noteIndex = Math.floor(i / noteLength);
    const freq = frequencies[Math.min(noteIndex, frequencies.length - 1)];
    const localProgress = (i % noteLength) / noteLength;
    const envelope = Math.sin(localProgress * Math.PI); // Bell curve envelope

    channelData[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.5;
  }

  return audioBuffer;
}

/**
 * Generate turn sound - Subtle click
 */
function generateTurnSound(audioContext: AudioContext): AudioBuffer {
  return generateTone(audioContext, 880, 0.05, 'square'); // A5, 50ms
}

/**
 * Snake Sounds Manager
 *
 * Manages procedural sound generation and playback for the Snake game.
 */
export class SnakeSoundsManager {
  private audioContext: AudioContext | null = null;
  private buffers: Map<SnakeSoundType, AudioBuffer> = new Map();
  private gainNode: GainNode | null = null;
  private isMuted: boolean = false;

  /**
   * Initialize the sound manager
   */
  public async initialize(): Promise<void> {
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Create master gain node
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 0.5; // Master volume
      this.gainNode.connect(this.audioContext.destination);

      // Generate all sounds
      this.buffers.set(SnakeSoundType.EAT_FOOD, generateEatSound(this.audioContext));
      this.buffers.set(SnakeSoundType.EAT_FOOD_COMBO, generateComboEatSound(this.audioContext));
      this.buffers.set(SnakeSoundType.DEATH, generateDeathSound(this.audioContext));
      this.buffers.set(SnakeSoundType.LEVEL_UP, generateLevelUpSound(this.audioContext));
      this.buffers.set(SnakeSoundType.TURN, generateTurnSound(this.audioContext));

      console.log('[SnakeSounds] Initialized with procedural sounds');
    } catch (error) {
      console.error('[SnakeSounds] Failed to initialize:', error);
    }
  }

  /**
   * Play a sound
   */
  public play(soundType: SnakeSoundType): void {
    if (!this.audioContext || !this.gainNode || this.isMuted) {
      return;
    }

    const buffer = this.buffers.get(soundType);
    if (!buffer) {
      console.warn('[SnakeSounds] Sound not found:', soundType);
      return;
    }

    try {
      // Resume audio context if suspended (browser autoplay policy)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      // Create source node
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.gainNode);
      source.start(0);
    } catch (error) {
      console.error('[SnakeSounds] Failed to play sound:', error);
    }
  }

  /**
   * Play eat sound with combo variation
   */
  public playEatSound(comboCount: number = 0): void {
    const soundType = comboCount >= 3 ? SnakeSoundType.EAT_FOOD_COMBO : SnakeSoundType.EAT_FOOD;
    this.play(soundType);
  }

  /**
   * Set master volume
   */
  public setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Mute/unmute sounds
   */
  public setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.buffers.clear();
    this.gainNode = null;
  }
}

/**
 * Global snake sounds instance (singleton)
 */
let globalSnakeSounds: SnakeSoundsManager | null = null;

/**
 * Get or create the global snake sounds instance
 */
export function getSnakeSounds(): SnakeSoundsManager {
  if (!globalSnakeSounds) {
    globalSnakeSounds = new SnakeSoundsManager();
  }
  return globalSnakeSounds;
}

/**
 * Initialize snake sounds (call once on game mount)
 */
export async function initializeSnakeSounds(): Promise<SnakeSoundsManager> {
  const sounds = getSnakeSounds();
  await sounds.initialize();
  return sounds;
}
