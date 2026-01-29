/**
 * Audio Configuration for x402Arcade Video
 *
 * Total Duration: 60 seconds (1800 frames @ 30fps)
 *
 * Timeline:
 * - Scene 1 (Hook):     frames 0-59      (0:00 - 0:02)
 * - Scene 2 (Problem):  frames 60-149    (0:02 - 0:05)
 * - Scene 3 (Solution): frames 150-299   (0:05 - 0:10) - staggered animations
 * - Scene 4 (Demo):     frames 300-1709  (0:10 - 0:57)
 * - Scene 6 (CTA):      frames 1710-1799 (0:57 - 1:00)
 */

export const AUDIO_CONFIG = {
  fps: 30,
  totalFrames: 1800,
  totalDuration: 60, // seconds

  // Scene boundaries (in frames)
  scenes: {
    hook: { start: 0, end: 59, duration: 60 },
    problem: { start: 60, end: 149, duration: 90 },
    solution: { start: 150, end: 299, duration: 150 },
    demo: { start: 300, end: 1709, duration: 1410 },
    cta: { start: 1710, end: 1799, duration: 90 },
  },
} as const;

/**
 * Sound Effects Cue Sheet
 * Each cue specifies exactly when a sound should play
 */
export interface SoundCue {
  id: string;
  file: string;
  frame: number; // When to start playing
  volume: number; // 0-1
  duration?: number; // Optional: trim length in frames
  fadeIn?: number; // Fade in duration in frames
  fadeOut?: number; // Fade out duration in frames
  description: string; // For documentation
}

export const SOUND_CUES: SoundCue[] = [
  // ============================================
  // SCENE 1: HOOK (frames 0-59)
  // ============================================
  {
    id: 'hook-impact',
    file: 'sfx/impact-deep.mp3',
    frame: 0,
    volume: 0.8,
    description: 'Deep bass hit as $0.01 appears',
  },
  {
    id: 'hook-glitch',
    file: 'sfx/glitch-digital.mp3',
    frame: 3,
    volume: 0.4,
    duration: 15,
    description: 'Digital glitch during text animation',
  },
  {
    id: 'hook-whoosh',
    file: 'sfx/whoosh-cyber.mp3',
    frame: 12,
    volume: 0.5,
    description: 'Whoosh as subtitle appears',
  },

  // ============================================
  // SCENE 2: PROBLEM (frames 60-149)
  // ============================================
  {
    id: 'transition-1',
    file: 'sfx/transition-swoosh.mp3',
    frame: 58,
    volume: 0.6,
    description: 'Scene transition whoosh',
  },
  {
    id: 'problem-coin',
    file: 'sfx/coin-insert.mp3',
    frame: 68,
    volume: 0.6,
    description: 'Coin sound for $0.01 game cost',
  },
  {
    id: 'problem-plus',
    file: 'sfx/ui-blip.mp3',
    frame: 75,
    volume: 0.3,
    description: 'Subtle blip for plus sign',
  },
  {
    id: 'problem-gas',
    file: 'sfx/warning-alarm.mp3',
    frame: 83,
    volume: 0.5,
    description: 'Warning sound for gas fee reveal',
  },
  {
    id: 'problem-total',
    file: 'sfx/impact-heavy.mp3',
    frame: 98,
    volume: 0.7,
    description: 'Heavy impact for $2.01 total',
  },
  {
    id: 'problem-shake',
    file: 'sfx/rumble-bass.mp3',
    frame: 100,
    volume: 0.4,
    duration: 45,
    description: 'Bass rumble during shake animation',
  },
  {
    id: 'problem-200x',
    file: 'sfx/impact-punch.mp3',
    frame: 120,
    volume: 0.6,
    description: 'Punch sound for 200x reveal',
  },

  // ============================================
  // SCENE 3: SOLUTION (frames 150-299)
  // Staggered animations - each element gets its own sound
  // ============================================
  {
    id: 'transition-2',
    file: 'sfx/transition-swoosh.mp3',
    frame: 148,
    volume: 0.6,
    description: 'Scene transition to solution',
  },
  // 1. "Not anymore." appears (frame 0-50 local = 150-200 global)
  {
    id: 'solution-not-anymore',
    file: 'sfx/impact-deep.mp3',
    frame: 150,
    volume: 0.7,
    description: '"Not anymore" dramatic impact',
  },
  // 2. Logo + Name bounces in (frame 45-65 local = 195-215 global)
  {
    id: 'solution-logo',
    file: 'sfx/logo-reveal.mp3',
    frame: 195,
    volume: 0.6,
    description: 'x402Arcade logo reveal',
  },
  // 3. "powered by x402 + Cronos" slides up (frame 75-95 local = 225-245 global)
  {
    id: 'solution-powered-by',
    file: 'sfx/whoosh-cyber.mp3',
    frame: 225,
    volume: 0.4,
    description: 'Powered by line slides in',
  },
  // 4. "$0.00 gas fees" badge pops (frame 105-125 local = 255-275 global)
  {
    id: 'solution-zero-gas',
    file: 'sfx/ui-success.mp3',
    frame: 255,
    volume: 0.6,
    description: '$0.00 gas badge pops with glow',
  },

  // ============================================
  // SCENE 4: DEMO (frames 300-1709)
  // ============================================
  {
    id: 'transition-3',
    file: 'sfx/transition-swoosh.mp3',
    frame: 298,
    volume: 0.6,
    description: 'Scene transition to demo',
  },
  {
    id: 'demo-start',
    file: 'sfx/ui-confirm.mp3',
    frame: 310,
    volume: 0.4,
    description: 'Demo video begins',
  },
  // Step indicator sounds
  {
    id: 'step-1',
    file: 'sfx/step-ping.mp3',
    frame: 305,
    volume: 0.35,
    description: 'Step 1: Landing Page indicator',
  },
  {
    id: 'step-2',
    file: 'sfx/step-ping.mp3',
    frame: 455,
    volume: 0.35,
    description: 'Step 2: Select Game indicator',
  },
  {
    id: 'step-3',
    file: 'sfx/step-ping.mp3',
    frame: 665,
    volume: 0.35,
    description: 'Step 3: Pay $0.01 indicator',
  },
  {
    id: 'step-4',
    file: 'sfx/step-ping.mp3',
    frame: 965,
    volume: 0.35,
    description: 'Step 4: Play! indicator',
  },
  {
    id: 'step-5',
    file: 'sfx/step-ping.mp3',
    frame: 1655,
    volume: 0.35,
    description: 'Step 5: Score Posted indicator',
  },

  // ============================================
  // SCENE 6: CTA (frames 1710-1799)
  // ============================================
  {
    id: 'transition-4',
    file: 'sfx/transition-swoosh.mp3',
    frame: 1705,
    volume: 0.6,
    description: 'Scene transition to CTA',
  },
  {
    id: 'cta-logo',
    file: 'sfx/logo-reveal.mp3',
    frame: 1710,
    volume: 0.8,
    description: 'Logo reveal - big moment',
  },
  {
    id: 'cta-tagline',
    file: 'sfx/ui-success.mp3',
    frame: 1725,
    volume: 0.4,
    description: 'Tagline appears',
  },
  {
    id: 'cta-links',
    file: 'sfx/ui-blip.mp3',
    frame: 1740,
    volume: 0.3,
    description: 'Links appear',
  },
  {
    id: 'cta-badge',
    file: 'sfx/badge-chime.mp3',
    frame: 1755,
    volume: 0.5,
    description: 'Hackathon badge reveal',
  },
];

/**
 * Background Music Configuration
 */
export interface MusicTrack {
  id: string;
  file: string;
  startFrame: number;
  endFrame: number;
  volume: number;
  fadeIn: number; // frames
  fadeOut: number; // frames
  description: string;
}

export const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'main-track',
    file: 'music/synthwave-energy.mp3',
    startFrame: 0,
    endFrame: 1800,
    volume: 0.2, // Subtle background, ducked during key moments
    fadeIn: 30, // 1 second fade in
    fadeOut: 45, // 1.5 second fade out
    description: 'Main background track - electronic/synthwave',
  },
];

/**
 * Audio Ducking Configuration
 * Lower music volume during specific moments
 */
export interface DuckingZone {
  startFrame: number;
  endFrame: number;
  targetVolume: number; // Multiply music volume by this
  description: string;
}

export const DUCKING_ZONES: DuckingZone[] = [
  {
    startFrame: 0,
    endFrame: 20,
    targetVolume: 0.5,
    description: 'Duck during hook impact',
  },
  {
    startFrame: 95,
    endFrame: 145,
    targetVolume: 0.6,
    description: 'Duck during problem climax',
  },
  {
    startFrame: 150,
    endFrame: 299,
    targetVolume: 0.5,
    description: 'Duck during solution reveals',
  },
  {
    startFrame: 300,
    endFrame: 1705,
    targetVolume: 0.7,
    description: 'Lower during demo for clarity',
  },
  {
    startFrame: 1710,
    endFrame: 1770,
    targetVolume: 0.5,
    description: 'Duck for logo reveal impact',
  },
];

/**
 * Required Audio Assets Checklist
 */
export const REQUIRED_ASSETS = {
  sfx: [
    'impact-deep.mp3',
    'impact-heavy.mp3',
    'impact-punch.mp3',
    'glitch-digital.mp3',
    'whoosh-cyber.mp3',
    'transition-swoosh.mp3',
    'coin-insert.mp3',
    'ui-blip.mp3',
    'ui-confirm.mp3',
    'ui-success.mp3',
    'warning-alarm.mp3',
    'rumble-bass.mp3',
    'step-ping.mp3',
    'logo-reveal.mp3',
    'badge-chime.mp3',
  ],
  music: ['synthwave-energy.mp3'],
};
