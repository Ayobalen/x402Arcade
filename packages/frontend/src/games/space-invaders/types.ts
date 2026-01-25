/**
 * Space Invaders Game Types
 *
 * This module defines TypeScript types and interfaces specific to the Space Invaders game.
 * It extends the core game engine types with space invaders-specific state and configuration.
 *
 * @module games/space-invaders/types
 */

import type { GameState } from '../types';
import type { SpaceInvadersDifficulty } from './constants';

// ============================================================================
// Position and Velocity Types
// ============================================================================

/**
 * 2D Position in pixel coordinates.
 */
export interface Position {
  /** X coordinate in pixels (left to right) */
  x: number;
  /** Y coordinate in pixels (top to bottom) */
  y: number;
}

/**
 * 2D Velocity vector.
 */
export interface Velocity {
  /** Horizontal velocity in pixels per second */
  vx: number;
  /** Vertical velocity in pixels per second */
  vy: number;
}

// ============================================================================
// Player Types
// ============================================================================

/**
 * Player ship state.
 *
 * @description
 * Represents the state of the player's ship including position, lives, and abilities.
 */
export interface PlayerState {
  /** Ship center position */
  position: Position;
  /** Ship velocity (for smooth movement) */
  velocity: Velocity;
  /** Ship width in pixels */
  width: number;
  /** Ship height in pixels */
  height: number;
  /** Remaining lives */
  lives: number;
  /** Is player invulnerable (post-death grace period)? */
  isInvulnerable: boolean;
  /** Invulnerability timer in seconds */
  invulnerabilityTimer: number;
  /** Bullet cooldown timer in seconds */
  shootCooldown: number;
  /** Is player currently exploding? */
  isExploding: boolean;
  /** Explosion animation progress (0-1) */
  explosionProgress: number;
}

/**
 * Player input direction.
 */
export type PlayerDirection = 'left' | 'right' | 'none';

// ============================================================================
// Alien Types
// ============================================================================

/**
 * Alien type classification.
 */
export type AlienType = 'squid' | 'crab' | 'octopus';

/**
 * Alien state.
 *
 * @description
 * Represents an individual alien in the formation.
 */
export interface AlienState {
  /** Unique alien ID */
  id: string;
  /** Alien type (determines appearance and points) */
  type: AlienType;
  /** Current position */
  position: Position;
  /** Is alien alive? */
  isAlive: boolean;
  /** Animation frame (0 or 1 for alternating sprites) */
  animationFrame: number;
  /** Is alien currently exploding? */
  isExploding: boolean;
  /** Explosion animation progress (0-1) */
  explosionProgress: number;
  /** Row index in formation */
  row: number;
  /** Column index in formation */
  col: number;
}

/**
 * Alien formation state.
 *
 * @description
 * Manages the collective behavior of all aliens.
 */
export interface FormationState {
  /** Array of all aliens */
  aliens: AlienState[];
  /** Current formation offset from origin */
  offset: Position;
  /** Current horizontal movement direction */
  direction: 1 | -1; // 1 = right, -1 = left
  /** Current horizontal speed in pixels per second */
  speed: number;
  /** Time since last step in seconds */
  stepTimer: number;
  /** Time between steps in seconds */
  stepInterval: number;
  /** Should formation drop down? */
  shouldDrop: boolean;
  /** Vertical drop distance per edge collision */
  dropDistance: number;
  /** Animation timer for alien sprites */
  animationTimer: number;
  /** Animation interval in seconds */
  animationInterval: number;
  /** Number of alive aliens */
  aliveCount: number;
}

// ============================================================================
// Bullet Types
// ============================================================================

/**
 * Bullet owner type.
 */
export type BulletOwner = 'player' | 'alien';

/**
 * Bullet state.
 *
 * @description
 * Represents a projectile fired by player or aliens.
 */
export interface BulletState {
  /** Unique bullet ID */
  id: string;
  /** Current position (top-left corner) */
  position: Position;
  /** Current velocity */
  velocity: Velocity;
  /** Bullet width in pixels */
  width: number;
  /** Bullet height in pixels */
  height: number;
  /** Who fired this bullet? */
  owner: BulletOwner;
  /** Is bullet active (false means removed from play) */
  isActive: boolean;
}

// ============================================================================
// UFO (Mystery Ship) Types
// ============================================================================

/**
 * UFO state.
 *
 * @description
 * Represents the mystery bonus ship that occasionally flies across the top.
 */
export interface UFOState {
  /** Current position */
  position: Position;
  /** Current velocity */
  velocity: Velocity;
  /** UFO width in pixels */
  width: number;
  /** UFO height in pixels */
  height: number;
  /** Is UFO currently active? */
  isActive: boolean;
  /** Bonus points for destroying this UFO */
  bonusPoints: number;
  /** Is UFO currently exploding? */
  isExploding: boolean;
  /** Explosion animation progress (0-1) */
  explosionProgress: number;
}

// ============================================================================
// Shield Types
// ============================================================================

/**
 * Shield segment state.
 *
 * @description
 * Shields are made up of multiple destructible segments.
 */
export interface ShieldSegment {
  /** Segment position (top-left corner) */
  position: Position;
  /** Segment width in pixels */
  width: number;
  /** Segment height in pixels */
  height: number;
  /** Health (0-100, 0 = destroyed) */
  health: number;
  /** Is segment destroyed? */
  isDestroyed: boolean;
}

/**
 * Shield state.
 *
 * @description
 * Represents a single shield structure made of multiple segments.
 */
export interface ShieldState {
  /** Shield ID */
  id: string;
  /** Shield center position */
  position: Position;
  /** Array of shield segments */
  segments: ShieldSegment[];
  /** Overall shield health percentage (0-100) */
  healthPercentage: number;
}

// ============================================================================
// Particle Effects Types
// ============================================================================

/**
 * Particle for explosion effects.
 */
export interface Particle {
  /** Particle position */
  position: Position;
  /** Particle velocity */
  velocity: Velocity;
  /** Particle color */
  color: string;
  /** Particle size in pixels */
  size: number;
  /** Particle lifetime in seconds */
  lifetime: number;
  /** Maximum lifetime in seconds */
  maxLifetime: number;
  /** Particle opacity (0-1) */
  opacity: number;
}

// ============================================================================
// Game-Specific State
// ============================================================================

/**
 * Space Invaders-specific game state.
 *
 * @description
 * Extends the base GameState with space invaders-specific data.
 */
export interface SpaceInvadersGameSpecific {
  /** Player ship state */
  player: PlayerState;
  /** Alien formation state */
  formation: FormationState;
  /** Active bullets (player and alien) */
  bullets: BulletState[];
  /** Shield structures */
  shields: ShieldState[];
  /** UFO (mystery ship) state */
  ufo: UFOState;
  /** Active particle effects */
  particles: Particle[];
  /** Current level number */
  level: number;
  /** Current wave number within level */
  wave: number;
  /** High score for session */
  highScore: number;
  /** Time until next UFO spawn in seconds */
  ufoSpawnTimer: number;
  /** Time until aliens can shoot again in seconds */
  alienShootTimer: number;
  /** Combo multiplier for consecutive kills */
  comboMultiplier: number;
  /** Time since last kill for combo tracking */
  comboTimer: number;
  /** Animation frame toggle (for 2-frame animations) */
  globalAnimationFrame: number;
}

/**
 * Complete Space Invaders game state.
 */
export interface SpaceInvadersState extends GameState<SpaceInvadersGameSpecific> {
  /** Game-specific state */
  gameSpecific: SpaceInvadersGameSpecific;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Space Invaders difficulty configuration.
 */
export interface SpaceInvadersDifficultyConfig {
  /** Difficulty level */
  difficulty: SpaceInvadersDifficulty;
  /** Player ship movement speed in pixels per second */
  playerSpeed: number;
  /** Player bullet speed in pixels per second */
  playerBulletSpeed: number;
  /** Player shoot cooldown in seconds */
  playerShootCooldown: number;
  /** Initial alien formation speed in pixels per second */
  initialAlienSpeed: number;
  /** Speed increase per level */
  alienSpeedIncrease: number;
  /** Alien bullet speed in pixels per second */
  alienBulletSpeed: number;
  /** Alien shoot interval in seconds (time between alien shots) */
  alienShootInterval: number;
  /** Number of starting lives */
  startingLives: number;
  /** Invulnerability duration in seconds after death */
  invulnerabilityDuration: number;
  /** UFO spawn interval range in seconds */
  ufoSpawnInterval: { min: number; max: number };
  /** UFO speed in pixels per second */
  ufoSpeed: number;
  /** UFO bonus points range */
  ufoPointsRange: { min: number; max: number };
  /** Shield health multiplier */
  shieldHealthMultiplier: number;
}

/**
 * Space Invaders game configuration.
 */
export interface SpaceInvadersConfig {
  /** Difficulty configuration */
  difficulty: SpaceInvadersDifficultyConfig;
  /** Canvas width */
  width: number;
  /** Canvas height */
  height: number;
  /** Points awarded per alien type */
  points: {
    squid: number; // Top row (30 points)
    crab: number; // Middle rows (20 points)
    octopus: number; // Bottom rows (10 points)
  };
}

// ============================================================================
// Scoring Events
// ============================================================================

/**
 * Scoring event types for Space Invaders.
 */
export type SpaceInvadersScoringEvent =
  | { type: 'alien_kill'; alienType: AlienType; comboMultiplier: number }
  | { type: 'ufo_kill'; bonusPoints: number }
  | { type: 'wave_complete'; waveNumber: number }
  | { type: 'level_complete'; levelNumber: number };
