/**
 * Breakout Game Constants
 *
 * This module defines all constants for the Breakout game including game area dimensions,
 * paddle and ball properties, brick properties, power-up settings, and difficulty configurations.
 *
 * @module games/breakout/constants
 */

// ============================================================================
// Game Area Constants
// ============================================================================

/**
 * Game area width in pixels.
 */
export const GAME_WIDTH = 800;

/**
 * Game area height in pixels.
 */
export const GAME_HEIGHT = 600;

/**
 * Top padding for UI elements (score, lives, etc.).
 */
export const TOP_PADDING = 60;

/**
 * Side padding.
 */
export const SIDE_PADDING = 20;

/**
 * Bottom padding.
 */
export const BOTTOM_PADDING = 100;

// ============================================================================
// Paddle Constants
// ============================================================================

/**
 * Paddle width in pixels (normal size).
 */
export const PADDLE_WIDTH = 100;

/**
 * Paddle height in pixels.
 */
export const PADDLE_HEIGHT = 15;

/**
 * Paddle movement speed in pixels per second.
 */
export const PADDLE_SPEED = 500;

/**
 * Paddle acceleration (for smooth movement).
 */
export const PADDLE_ACCELERATION = 1500;

/**
 * Paddle deceleration (friction).
 */
export const PADDLE_DECELERATION = 1000;

/**
 * Maximum paddle velocity in pixels per second.
 */
export const MAX_PADDLE_VELOCITY = 600;

/**
 * Paddle vertical position (distance from bottom).
 */
export const PADDLE_Y_OFFSET = 50;

/**
 * Paddle size multipliers for power-ups.
 */
export const PADDLE_SIZE_MULTIPLIERS = {
  normal: 1.0,
  expanded: 1.5, // 150% wider
  shrunk: 0.7, // 70% width
} as const;

// ============================================================================
// Ball Constants
// ============================================================================

/**
 * Ball radius in pixels.
 */
export const BALL_RADIUS = 8;

/**
 * Initial ball speed in pixels per second.
 */
export const INITIAL_BALL_SPEED = 350;

/**
 * Maximum ball speed in pixels per second.
 */
export const MAX_BALL_SPEED = 800;

/**
 * Minimum ball speed in pixels per second.
 */
export const MIN_BALL_SPEED = 200;

/**
 * Ball speed increase per brick hit (percentage).
 */
export const SPEED_INCREASE_PER_BRICK = 0.02; // 2% increase

/**
 * Maximum speed multiplier.
 */
export const MAX_SPEED_MULTIPLIER = 2.0;

/**
 * Ball spin factor (affects bounce angle from paddle).
 */
export const BALL_SPIN_FACTOR = 0.5;

/**
 * Maximum bounce angle in degrees.
 */
export const MAX_BOUNCE_ANGLE = 70;

/**
 * Minimum vertical velocity (prevents horizontal-only bounces).
 */
export const MIN_VERTICAL_VELOCITY = 100;

/**
 * Ball trail length (number of trail positions to keep).
 */
export const BALL_TRAIL_LENGTH = 8;

// ============================================================================
// Brick Constants
// ============================================================================

/**
 * Brick width in pixels.
 */
export const BRICK_WIDTH = 75;

/**
 * Brick height in pixels.
 */
export const BRICK_HEIGHT = 25;

/**
 * Number of brick rows in standard layout.
 */
export const BRICK_ROWS = 8;

/**
 * Number of brick columns in standard layout.
 */
export const BRICK_COLS = 10;

/**
 * Brick grid top offset.
 */
export const BRICK_GRID_TOP = TOP_PADDING + 20;

/**
 * Gap between bricks.
 */
export const BRICK_GAP = 2;

/**
 * Brick hit points by type.
 */
export const BRICK_HP = {
  normal: 1,
  strong: 2,
  veryStrong: 3,
  unbreakable: Infinity,
  explosive: 1,
  powerup: 1,
} as const;

/**
 * Points awarded per brick type.
 */
export const BRICK_POINTS = {
  normal: 10,
  strong: 20,
  veryStrong: 30,
  unbreakable: 0,
  explosive: 25,
  powerup: 15,
} as const;

/**
 * Brick colors by type.
 */
export const BRICK_COLORS = {
  normal: '#00ffff', // Cyan
  strong: '#ff00ff', // Magenta
  veryStrong: '#ffff00', // Yellow
  unbreakable: '#94A3B8', // Gray
  explosive: '#ff4444', // Red
  powerup: '#00ff00', // Green
} as const;

/**
 * Explosion radius for explosive bricks.
 */
export const EXPLOSION_RADIUS = 100;

// ============================================================================
// Power-Up Constants
// ============================================================================

/**
 * Power-up width in pixels.
 */
export const POWERUP_WIDTH = 40;

/**
 * Power-up height in pixels.
 */
export const POWERUP_HEIGHT = 20;

/**
 * Power-up falling speed in pixels per second.
 */
export const POWERUP_SPEED = 150;

/**
 * Power-up duration in seconds (for timed effects).
 */
export const POWERUP_DURATION = 20;

/**
 * Power-up drop chance (0-1).
 */
export const POWERUP_DROP_CHANCE = 0.15; // 15%

/**
 * Power-up type weights (relative probability).
 */
export const POWERUP_WEIGHTS = {
  expand: 20,
  shrink: 10,
  'multi-ball': 15,
  sticky: 15,
  laser: 15,
  slow: 15,
  fast: 5,
  'extra-life': 5,
  'points-2x': 10,
  invincible: 5,
} as const;

/**
 * Power-up colors.
 */
export const POWERUP_COLORS = {
  expand: '#00ff00', // Green
  shrink: '#ff4444', // Red
  'multi-ball': '#00ffff', // Cyan
  sticky: '#ffff00', // Yellow
  laser: '#ff00ff', // Magenta
  slow: '#0088ff', // Blue
  fast: '#ff8800', // Orange
  'extra-life': '#ff66ff', // Pink
  'points-2x': '#ffff00', // Yellow
  invincible: '#ffffff', // White
} as const;

/**
 * Power-up icons (single character).
 */
export const POWERUP_ICONS = {
  expand: 'E',
  shrink: 'S',
  'multi-ball': 'M',
  sticky: 'C',
  laser: 'L',
  slow: '↓',
  fast: '↑',
  'extra-life': '♥',
  'points-2x': '×2',
  invincible: '★',
} as const;

// ============================================================================
// Laser Constants
// ============================================================================

/**
 * Laser width in pixels.
 */
export const LASER_WIDTH = 4;

/**
 * Laser height in pixels.
 */
export const LASER_HEIGHT = 15;

/**
 * Laser projectile speed in pixels per second.
 */
export const LASER_SPEED = 600;

/**
 * Laser cooldown in seconds.
 */
export const LASER_COOLDOWN = 0.5;

/**
 * Laser color.
 */
export const LASER_COLOR = '#ff00ff'; // Magenta

// ============================================================================
// Gameplay Constants
// ============================================================================

/**
 * Starting number of lives.
 */
export const STARTING_LIVES = 3;

/**
 * Countdown duration before ball launch (seconds).
 */
export const COUNTDOWN_DURATION = 3;

/**
 * Level complete delay (seconds).
 */
export const LEVEL_COMPLETE_DELAY = 2;

/**
 * Combo timeout in seconds (time window to maintain combo).
 */
export const COMBO_TIMEOUT = 3.0;

/**
 * Points multiplier thresholds.
 */
export const MULTIPLIER_THRESHOLDS = [5, 10, 20, 30, 50];

// ============================================================================
// Visual Constants
// ============================================================================

/**
 * Breakout color palette (matches design system).
 */
export const BREAKOUT_COLORS = {
  /** Background */
  background: '#0F0F1A',
  /** Game area border */
  border: '#2D2D4A',
  /** Paddle (cyan) */
  paddle: '#00ffff',
  /** Paddle with laser (magenta) */
  paddleLaser: '#ff00ff',
  /** Ball */
  ball: '#ffffff',
  /** Ball trail */
  ballTrail: 'rgba(255, 255, 255, 0.3)',
  /** Invincible ball */
  ballInvincible: '#ffff00',
  /** Score text */
  text: '#F8FAFC',
  /** Muted text */
  textMuted: '#94A3B8',
  /** Life indicator (active) */
  lifeActive: '#00ff00',
  /** Life indicator (lost) */
  lifeLost: '#333333',
} as const;

/**
 * Font settings.
 */
export const FONTS = {
  score: '32px JetBrains Mono, monospace',
  lives: '24px JetBrains Mono, monospace',
  combo: '20px JetBrains Mono, monospace',
  powerup: '16px JetBrains Mono, monospace',
  debug: '14px JetBrains Mono, monospace',
} as const;

// ============================================================================
// Difficulty Presets
// ============================================================================

/**
 * Difficulty-specific game settings.
 */
export const DIFFICULTY_SETTINGS = {
  easy: {
    paddleWidth: 120, // Wider paddle
    ballSpeed: 300, // Slower ball
    startingLives: 5, // More lives
    powerUpDropChance: 0.25, // More power-ups (25%)
    brickRows: 6, // Fewer rows
    speedIncreasePerBrick: 0.01, // Slower speed increase (1%)
    description: 'Larger paddle, slower ball, more lives and power-ups',
  },
  normal: {
    paddleWidth: 100, // Standard paddle
    ballSpeed: 350, // Standard ball
    startingLives: 3, // Standard lives
    powerUpDropChance: 0.15, // Standard power-ups (15%)
    brickRows: 8, // Standard rows
    speedIncreasePerBrick: 0.02, // Standard speed increase (2%)
    description: 'Balanced gameplay for classic Breakout experience',
  },
  hard: {
    paddleWidth: 80, // Narrower paddle
    ballSpeed: 400, // Faster ball
    startingLives: 2, // Fewer lives
    powerUpDropChance: 0.1, // Fewer power-ups (10%)
    brickRows: 10, // More rows
    speedIncreasePerBrick: 0.03, // Faster speed increase (3%)
    description: 'Smaller paddle, faster ball, fewer lives and power-ups',
  },
  expert: {
    paddleWidth: 70, // Very narrow paddle
    ballSpeed: 450, // Very fast ball
    startingLives: 1, // Only one life
    powerUpDropChance: 0.05, // Rare power-ups (5%)
    brickRows: 12, // Many rows
    speedIncreasePerBrick: 0.04, // Rapid speed increase (4%)
    description: 'Extreme challenge - one life, minimal power-ups',
  },
} as const;

// ============================================================================
// Type Exports
// ============================================================================

export type BreakoutDifficulty = keyof typeof DIFFICULTY_SETTINGS;

// ============================================================================
// Level Patterns
// ============================================================================

/**
 * Brick type distribution by level.
 */
export const LEVEL_BRICK_DISTRIBUTION = [
  // Level 1-2: Mostly normal bricks
  {
    normal: 70,
    strong: 20,
    veryStrong: 0,
    unbreakable: 0,
    explosive: 5,
    powerup: 5,
  },
  // Level 3-4: Introduce strong bricks
  {
    normal: 50,
    strong: 30,
    veryStrong: 10,
    unbreakable: 0,
    explosive: 5,
    powerup: 5,
  },
  // Level 5-6: More variety
  {
    normal: 40,
    strong: 30,
    veryStrong: 15,
    unbreakable: 5,
    explosive: 5,
    powerup: 5,
  },
  // Level 7+: Maximum challenge
  {
    normal: 30,
    strong: 30,
    veryStrong: 20,
    unbreakable: 10,
    explosive: 5,
    powerup: 5,
  },
] as const;

/**
 * Get brick distribution for a given level.
 */
export function getLevelBrickDistribution(level: number) {
  const index = Math.min(Math.floor((level - 1) / 2), LEVEL_BRICK_DISTRIBUTION.length - 1);
  return LEVEL_BRICK_DISTRIBUTION[index];
}

/**
 * Get ball speed for a given level.
 */
export function getLevelBallSpeed(level: number, baseBallSpeed: number): number {
  // Increase ball speed by 5% per level, capped at 1.5x base speed
  const speedMultiplier = Math.min(1 + (level - 1) * 0.05, 1.5);
  return baseBallSpeed * speedMultiplier;
}

/**
 * Get power-up drop chance for a given level.
 */
export function getLevelPowerUpChance(level: number, basePowerUpChance: number): number {
  // Decrease power-up chance slightly in higher levels
  const multiplier = Math.max(0.5, 1 - (level - 1) * 0.02);
  return basePowerUpChance * multiplier;
}

// ============================================================================
// Physics Constants
// ============================================================================

/**
 * Gravity constant (not used in standard breakout, but available for mods).
 */
export const GRAVITY = 0;

/**
 * Ball elasticity (bounce coefficient).
 */
export const BALL_ELASTICITY = 1.0;

/**
 * Collision detection tolerance in pixels.
 */
export const COLLISION_TOLERANCE = 1;

/**
 * Maximum collision iterations per frame (prevents infinite loops).
 */
export const MAX_COLLISION_ITERATIONS = 10;

// ============================================================================
// Debug Constants
// ============================================================================

/**
 * Debug visualization settings.
 */
export const DEBUG_SETTINGS = {
  showCollisionBoxes: false,
  showVelocityVectors: false,
  showGrid: false,
  showFPS: false,
  showPhysicsInfo: false,
} as const;
