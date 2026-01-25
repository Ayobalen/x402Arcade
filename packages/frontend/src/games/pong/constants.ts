/**
 * Pong Game Constants
 *
 * This module defines all constants for the Pong game including court dimensions,
 * paddle and ball properties, physics parameters, and difficulty settings.
 *
 * @module games/pong/constants
 */

// ============================================================================
// Court Constants
// ============================================================================

/**
 * Court width in pixels.
 * Standard pong court is wider than it is tall (16:10 aspect ratio).
 */
export const COURT_WIDTH = 800;

/**
 * Court height in pixels.
 */
export const COURT_HEIGHT = 600;

/**
 * Center line width in pixels.
 */
export const CENTER_LINE_WIDTH = 2;

/**
 * Padding from edge of court to paddles.
 */
export const PADDLE_OFFSET = 50;

// ============================================================================
// Paddle Constants
// ============================================================================

/**
 * Paddle width in pixels.
 */
export const PADDLE_WIDTH = 15;

/**
 * Paddle height in pixels.
 */
export const PADDLE_HEIGHT = 100;

/**
 * Paddle movement speed in pixels per second.
 */
export const PADDLE_SPEED = 400;

/**
 * Paddle acceleration (for smooth movement).
 */
export const PADDLE_ACCELERATION = 1200;

/**
 * Paddle deceleration (friction).
 */
export const PADDLE_DECELERATION = 800;

/**
 * Maximum paddle velocity in pixels per second.
 */
export const MAX_PADDLE_VELOCITY = 500;

// ============================================================================
// Ball Constants
// ============================================================================

/**
 * Ball radius in pixels.
 */
export const BALL_RADIUS = 8;

/**
 * Initial ball speed in pixels per second.
 * Ball starts at this speed after each serve.
 */
export const INITIAL_BALL_SPEED = 300;

/**
 * Maximum ball speed in pixels per second.
 * Ball speed is capped at this value to prevent it from becoming too fast.
 */
export const MAX_BALL_SPEED = 800;

/**
 * Minimum ball speed in pixels per second.
 * Ball speed never goes below this value.
 */
export const MIN_BALL_SPEED = 200;

/**
 * Speed increase per paddle hit (percentage).
 * Ball speed increases by this amount after each paddle hit.
 *
 * @example
 * // After paddle hit, speed = speed * (1 + SPEED_INCREASE_PER_HIT)
 * // 300 * 1.05 = 315
 */
export const SPEED_INCREASE_PER_HIT = 0.05; // 5% increase

/**
 * Maximum speed multiplier (caps speed increase).
 */
export const MAX_SPEED_MULTIPLIER = 2.5;

/**
 * Ball spin factor (affects bounce angle).
 * Higher values increase the effect of paddle movement on ball direction.
 */
export const BALL_SPIN_FACTOR = 0.3;

// ============================================================================
// Physics Constants
// ============================================================================

/**
 * Ball elasticity (bounce coefficient).
 * 1.0 = perfectly elastic, <1.0 = loses energy.
 */
export const BALL_ELASTICITY = 1.0;

/**
 * Maximum bounce angle in degrees.
 * Ball bounces at most this angle from horizontal when hitting paddle edges.
 */
export const MAX_BOUNCE_ANGLE = 60;

/**
 * Wall bounce damping factor.
 * Multiplies vertical velocity after wall bounce (1.0 = no damping).
 */
export const WALL_BOUNCE_DAMPING = 0.98;

// ============================================================================
// Gameplay Constants
// ============================================================================

/**
 * Serve delay in seconds.
 * Time to wait before serving ball after a point is scored.
 */
export const SERVE_DELAY = 2.0;

/**
 * Points needed to win the game.
 */
export const TARGET_SCORE = 11;

/**
 * Rally milestone thresholds (for audio/visual feedback).
 */
export const RALLY_MILESTONES = [5, 10, 15, 20, 30, 50];

// ============================================================================
// AI Constants
// ============================================================================

/**
 * AI difficulty configurations.
 */
export const AI_CONFIGS = {
  easy: {
    reactionTime: 0.3, // 300ms delay
    predictionAccuracy: 0.6, // 60% accurate prediction
    speedMultiplier: 0.7, // Moves at 70% speed
    errorMargin: 40, // Aims within ±40px of center
    makeMistakes: true,
    mistakeChance: 0.2, // 20% chance to miss
  },
  normal: {
    reactionTime: 0.2, // 200ms delay
    predictionAccuracy: 0.8, // 80% accurate prediction
    speedMultiplier: 0.85, // Moves at 85% speed
    errorMargin: 20, // Aims within ±20px of center
    makeMistakes: true,
    mistakeChance: 0.1, // 10% chance to miss
  },
  hard: {
    reactionTime: 0.1, // 100ms delay
    predictionAccuracy: 0.95, // 95% accurate prediction
    speedMultiplier: 1.0, // Moves at full speed
    errorMargin: 5, // Aims within ±5px of center
    makeMistakes: false,
    mistakeChance: 0.02, // 2% chance to miss (near perfect)
  },
} as const;

// ============================================================================
// Visual Constants
// ============================================================================

/**
 * Pong color palette (matches design system).
 */
export const PONG_COLORS = {
  /** Court background */
  background: '#0F0F1A',
  /** Court border */
  border: '#2D2D4A',
  /** Center line */
  centerLine: '#8B5CF6',
  /** Left paddle (player) */
  paddleLeft: '#00ffff', // Cyan
  /** Right paddle (AI/opponent) */
  paddleRight: '#ff00ff', // Magenta
  /** Ball */
  ball: '#ffffff',
  /** Ball trail */
  ballTrail: 'rgba(255, 255, 255, 0.3)',
  /** Score text */
  score: '#F8FAFC',
  /** Score muted */
  scoreMuted: '#94A3B8',
} as const;

/**
 * Font settings.
 */
export const FONTS = {
  score: '48px JetBrains Mono, monospace',
  debug: '16px JetBrains Mono, monospace',
} as const;

// ============================================================================
// Difficulty Presets
// ============================================================================

/**
 * Difficulty-specific game settings.
 */
export const DIFFICULTY_SETTINGS = {
  easy: {
    paddleHeight: 120, // Taller paddles
    paddleSpeed: 350, // Slower paddles
    ballSpeed: 250, // Slower ball
    targetScore: 7, // Shorter games
    aiDifficulty: 'easy' as const,
  },
  normal: {
    paddleHeight: 100, // Standard paddles
    paddleSpeed: 400, // Standard speed
    ballSpeed: 300, // Standard ball
    targetScore: 11, // Standard game length
    aiDifficulty: 'normal' as const,
  },
  hard: {
    paddleHeight: 80, // Shorter paddles
    paddleSpeed: 450, // Faster paddles
    ballSpeed: 350, // Faster ball
    targetScore: 11, // Standard game length
    aiDifficulty: 'hard' as const,
  },
} as const;

// ============================================================================
// Type Exports
// ============================================================================

export type PongDifficulty = keyof typeof DIFFICULTY_SETTINGS;

// ============================================================================
// Game Mode Constants
// ============================================================================

/**
 * Available game modes.
 */
export const GAME_MODES = {
  'single-player': {
    id: 'single-player',
    name: 'Single Player',
    description: 'Play against AI opponent',
  },
  'two-player': {
    id: 'two-player',
    name: 'Two Player',
    description: 'Play against a friend',
  },
} as const;

export type GameMode = keyof typeof GAME_MODES;

// ============================================================================
// Debug Constants
// ============================================================================

/**
 * Debug visualization settings.
 */
export const DEBUG_SETTINGS = {
  showCollisionBoxes: false,
  showVelocityVectors: false,
  showAIPrediction: false,
  showFPS: false,
} as const;
