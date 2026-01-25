/**
 * Space Invaders Game Constants
 *
 * This module defines all constant values and configurations for the Space Invaders game.
 *
 * @module games/space-invaders/constants
 */

import type { SpaceInvadersDifficultyConfig } from './types';

// ============================================================================
// Game Dimensions
// ============================================================================

/** Canvas width in pixels */
export const CANVAS_WIDTH = 800;

/** Canvas height in pixels */
export const CANVAS_HEIGHT = 600;

/** Game bounds margin (padding from edges) */
export const GAME_BOUNDS_MARGIN = 20;

// ============================================================================
// Player Ship Constants
// ============================================================================

/** Player ship width in pixels */
export const PLAYER_WIDTH = 40;

/** Player ship height in pixels */
export const PLAYER_HEIGHT = 30;

/** Player starting position Y coordinate */
export const PLAYER_START_Y = CANVAS_HEIGHT - 60;

/** Player bullet width in pixels */
export const PLAYER_BULLET_WIDTH = 4;

/** Player bullet height in pixels */
export const PLAYER_BULLET_HEIGHT = 16;

// ============================================================================
// Alien Constants
// ============================================================================

/** Alien width in pixels */
export const ALIEN_WIDTH = 32;

/** Alien height in pixels */
export const ALIEN_HEIGHT = 24;

/** Horizontal spacing between aliens */
export const ALIEN_SPACING_X = 48;

/** Vertical spacing between alien rows */
export const ALIEN_SPACING_Y = 40;

/** Number of alien columns */
export const ALIEN_COLS = 11;

/** Number of alien rows */
export const ALIEN_ROWS = 5;

/** Starting Y position for top row of aliens */
export const ALIEN_START_Y = 80;

/** Alien bullet width in pixels */
export const ALIEN_BULLET_WIDTH = 4;

/** Alien bullet height in pixels */
export const ALIEN_BULLET_HEIGHT = 12;

/** Drop distance when aliens reach edge */
export const ALIEN_DROP_DISTANCE = 20;

/** Speed multiplier when aliens are reduced */
export const ALIEN_SPEED_INCREASE_FACTOR = 1.1;

// ============================================================================
// UFO (Mystery Ship) Constants
// ============================================================================

/** UFO width in pixels */
export const UFO_WIDTH = 48;

/** UFO height in pixels */
export const UFO_HEIGHT = 24;

/** UFO spawn Y position */
export const UFO_Y_POSITION = 40;

// ============================================================================
// Shield Constants
// ============================================================================

/** Shield width in pixels */
export const SHIELD_WIDTH = 80;

/** Shield height in pixels */
export const SHIELD_HEIGHT = 60;

/** Number of shields */
export const SHIELD_COUNT = 4;

/** Shield Y position */
export const SHIELD_Y_POSITION = CANVAS_HEIGHT - 150;

/** Number of segments per shield (width) */
export const SHIELD_SEGMENTS_X = 8;

/** Number of segments per shield (height) */
export const SHIELD_SEGMENTS_Y = 6;

/** Damage to shield segment from bullet hit */
export const SHIELD_DAMAGE_PER_HIT = 25;

// ============================================================================
// Scoring Constants
// ============================================================================

/** Points for destroying squid alien (top row) */
export const POINTS_SQUID = 30;

/** Points for destroying crab alien (middle rows) */
export const POINTS_CRAB = 20;

/** Points for destroying octopus alien (bottom rows) */
export const POINTS_OCTOPUS = 10;

/** Minimum UFO bonus points */
export const UFO_POINTS_MIN = 50;

/** Maximum UFO bonus points */
export const UFO_POINTS_MAX = 300;

/** Wave completion bonus base points */
export const WAVE_BONUS_BASE = 500;

/** Level completion bonus base points */
export const LEVEL_BONUS_BASE = 1000;

/** Combo timeout in seconds */
export const COMBO_TIMEOUT = 2.0;

/** Maximum combo multiplier */
export const MAX_COMBO_MULTIPLIER = 5;

// ============================================================================
// Physics & Timing Constants
// ============================================================================

/** Invulnerability flash interval in seconds */
export const INVULNERABILITY_FLASH_INTERVAL = 0.1;

/** Explosion animation duration in seconds */
export const EXPLOSION_DURATION = 0.5;

/** Particle effect lifetime in seconds */
export const PARTICLE_LIFETIME = 0.6;

/** Animation frame interval for aliens (in seconds) */
export const ALIEN_ANIMATION_INTERVAL = 0.5;

/** Maximum number of player bullets on screen */
export const MAX_PLAYER_BULLETS = 3;

/** Maximum number of alien bullets on screen */
export const MAX_ALIEN_BULLETS = 8;

// ============================================================================
// Difficulty Levels
// ============================================================================

/** Available difficulty levels */
export type SpaceInvadersDifficulty = 'easy' | 'normal' | 'hard' | 'expert';

/**
 * Easy difficulty configuration.
 */
export const DIFFICULTY_EASY: SpaceInvadersDifficultyConfig = {
  difficulty: 'easy',
  playerSpeed: 350,
  playerBulletSpeed: 600,
  playerShootCooldown: 0.3,
  initialAlienSpeed: 20,
  alienSpeedIncrease: 5,
  alienBulletSpeed: 200,
  alienShootInterval: 2.5,
  startingLives: 5,
  invulnerabilityDuration: 3.0,
  ufoSpawnInterval: { min: 20, max: 35 },
  ufoSpeed: 100,
  ufoPointsRange: { min: 50, max: 150 },
  shieldHealthMultiplier: 1.5,
};

/**
 * Normal difficulty configuration.
 */
export const DIFFICULTY_NORMAL: SpaceInvadersDifficultyConfig = {
  difficulty: 'normal',
  playerSpeed: 300,
  playerBulletSpeed: 500,
  playerShootCooldown: 0.4,
  initialAlienSpeed: 30,
  alienSpeedIncrease: 8,
  alienBulletSpeed: 250,
  alienShootInterval: 2.0,
  startingLives: 3,
  invulnerabilityDuration: 2.0,
  ufoSpawnInterval: { min: 15, max: 30 },
  ufoSpeed: 120,
  ufoPointsRange: { min: 50, max: 300 },
  shieldHealthMultiplier: 1.0,
};

/**
 * Hard difficulty configuration.
 */
export const DIFFICULTY_HARD: SpaceInvadersDifficultyConfig = {
  difficulty: 'hard',
  playerSpeed: 280,
  playerBulletSpeed: 450,
  playerShootCooldown: 0.5,
  initialAlienSpeed: 40,
  alienSpeedIncrease: 12,
  alienBulletSpeed: 300,
  alienShootInterval: 1.5,
  startingLives: 3,
  invulnerabilityDuration: 1.5,
  ufoSpawnInterval: { min: 12, max: 25 },
  ufoSpeed: 150,
  ufoPointsRange: { min: 100, max: 300 },
  shieldHealthMultiplier: 0.8,
};

/**
 * Expert difficulty configuration.
 */
export const DIFFICULTY_EXPERT: SpaceInvadersDifficultyConfig = {
  difficulty: 'expert',
  playerSpeed: 250,
  playerBulletSpeed: 400,
  playerShootCooldown: 0.6,
  initialAlienSpeed: 50,
  alienSpeedIncrease: 15,
  alienBulletSpeed: 350,
  alienShootInterval: 1.0,
  startingLives: 3,
  invulnerabilityDuration: 1.0,
  ufoSpawnInterval: { min: 10, max: 20 },
  ufoSpeed: 180,
  ufoPointsRange: { min: 150, max: 300 },
  shieldHealthMultiplier: 0.6,
};

/**
 * Get difficulty configuration by name.
 */
export function getDifficultyConfig(
  difficulty: SpaceInvadersDifficulty
): SpaceInvadersDifficultyConfig {
  switch (difficulty) {
    case 'easy':
      return DIFFICULTY_EASY;
    case 'normal':
      return DIFFICULTY_NORMAL;
    case 'hard':
      return DIFFICULTY_HARD;
    case 'expert':
      return DIFFICULTY_EXPERT;
    default:
      return DIFFICULTY_NORMAL;
  }
}

// ============================================================================
// Color Palette (Arcade Neon Theme)
// ============================================================================

/** Player ship color (cyan) */
export const COLOR_PLAYER = '#00ffff';

/** Alien squid color (magenta) */
export const COLOR_ALIEN_SQUID = '#ff00ff';

/** Alien crab color (yellow) */
export const COLOR_ALIEN_CRAB = '#ffff00';

/** Alien octopus color (green) */
export const COLOR_ALIEN_OCTOPUS = '#00ff00';

/** UFO color (red) */
export const COLOR_UFO = '#ff0000';

/** Player bullet color (cyan) */
export const COLOR_PLAYER_BULLET = '#00ffff';

/** Alien bullet color (red) */
export const COLOR_ALIEN_BULLET = '#ff0000';

/** Shield color (green) */
export const COLOR_SHIELD = '#00ff00';

/** Explosion particle colors */
export const COLOR_EXPLOSION_PARTICLES = ['#ff4444', '#ff8844', '#ffff44', '#ffffff', '#ff00ff'];

/** Background color */
export const COLOR_BACKGROUND = '#0F0F1A';

/** UI text color */
export const COLOR_TEXT = '#F8FAFC';

/** UI text muted color */
export const COLOR_TEXT_MUTED = '#94A3B8';

// ============================================================================
// Audio Constants (for future integration)
// ============================================================================

/** Sound effect IDs */
export const SOUNDS = {
  PLAYER_SHOOT: 'space_invaders_shoot',
  ALIEN_KILL: 'space_invaders_alien_kill',
  UFO_SPAWN: 'space_invaders_ufo',
  UFO_KILL: 'space_invaders_ufo_kill',
  PLAYER_DEATH: 'space_invaders_player_death',
  SHIELD_HIT: 'space_invaders_shield_hit',
  ALIEN_MARCH_1: 'space_invaders_march_1',
  ALIEN_MARCH_2: 'space_invaders_march_2',
  ALIEN_MARCH_3: 'space_invaders_march_3',
  ALIEN_MARCH_4: 'space_invaders_march_4',
} as const;
