/**
 * Breakout Game Types
 *
 * This module defines TypeScript types and interfaces specific to the Breakout game.
 * It extends the core game engine types with breakout-specific state and configuration.
 *
 * @module games/breakout/types
 */

import type { GameState, GameConfig } from '../types';
import type { BreakoutDifficulty } from './constants';

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
// Paddle Types
// ============================================================================

/**
 * Paddle state.
 *
 * @description
 * Represents the state of the paddle including position, velocity, and dimensions.
 */
export interface PaddleState {
  /** Top-left corner position */
  position: Position;
  /** Current velocity (for smooth movement) */
  velocity: Velocity;
  /** Paddle width in pixels */
  width: number;
  /** Paddle height in pixels */
  height: number;
  /** Is paddle currently "sticky" (ball sticks on catch)? */
  isSticky: boolean;
  /** Paddle size modifier (1.0 = normal, >1.0 = larger, <1.0 = smaller) */
  sizeMultiplier: number;
  /** Is paddle armed with laser? */
  hasLaser: boolean;
  /** Laser cooldown timer in seconds */
  laserCooldown: number;
}

/**
 * Paddle input direction.
 */
export type PaddleDirection = 'left' | 'right' | 'none';

// ============================================================================
// Ball Types
// ============================================================================

/**
 * Ball state.
 *
 * @description
 * Represents the state of a ball including position, velocity, and status.
 */
export interface BallState {
  /** Ball ID (for multi-ball tracking) */
  id: string;
  /** Center position */
  position: Position;
  /** Current velocity */
  velocity: Velocity;
  /** Ball radius in pixels */
  radius: number;
  /** Current speed multiplier */
  speedMultiplier: number;
  /** Is ball stuck to paddle? */
  isStuck: boolean;
  /** Offset from paddle center when stuck */
  stuckOffset?: number;
  /** Is ball active (false means ball is out of play) */
  isActive: boolean;
  /** Ball trail positions for visual effects */
  trail: Position[];
}

// ============================================================================
// Brick Types
// ============================================================================

/**
 * Brick type.
 */
export type BrickType =
  | 'normal' // 1 hit to destroy
  | 'strong' // 2 hits to destroy
  | 'very-strong' // 3 hits to destroy
  | 'unbreakable' // Cannot be destroyed
  | 'explosive' // Explodes and damages nearby bricks
  | 'powerup'; // Drops a power-up when destroyed

/**
 * Brick state.
 */
export interface BrickState {
  /** Brick ID */
  id: string;
  /** Top-left corner position */
  position: Position;
  /** Brick width in pixels */
  width: number;
  /** Brick height in pixels */
  height: number;
  /** Brick type */
  type: BrickType;
  /** Current hit points */
  hp: number;
  /** Maximum hit points */
  maxHp: number;
  /** Is brick destroyed? */
  isDestroyed: boolean;
  /** Points awarded for destroying this brick */
  points: number;
  /** Color of the brick */
  color: string;
  /** Power-up type to drop (if type is 'powerup') */
  powerUpType?: PowerUpType;
}

// ============================================================================
// Power-Up Types
// ============================================================================

/**
 * Power-up type.
 */
export type PowerUpType =
  | 'expand' // Larger paddle
  | 'shrink' // Smaller paddle (negative power-up)
  | 'multi-ball' // Split ball into 3
  | 'sticky' // Ball sticks to paddle on catch
  | 'laser' // Paddle can shoot lasers
  | 'slow' // Slower ball speed
  | 'fast' // Faster ball speed (negative power-up)
  | 'extra-life' // Gain an extra life
  | 'points-2x' // Double points for 30 seconds
  | 'invincible'; // Ball passes through bricks for 10 seconds

/**
 * Power-up state.
 */
export interface PowerUpState {
  /** Power-up ID */
  id: string;
  /** Center position */
  position: Position;
  /** Falling velocity */
  velocity: Velocity;
  /** Power-up width in pixels */
  width: number;
  /** Power-up height in pixels */
  height: number;
  /** Power-up type */
  type: PowerUpType;
  /** Is power-up active (falling)? */
  isActive: boolean;
  /** Power-up color/icon */
  color: string;
  /** Icon character */
  icon: string;
}

/**
 * Active power-up effect.
 */
export interface ActivePowerUp {
  /** Power-up type */
  type: PowerUpType;
  /** Time remaining in seconds */
  timeRemaining: number;
  /** Original duration in seconds */
  duration: number;
}

// ============================================================================
// Laser Types
// ============================================================================

/**
 * Laser projectile state.
 */
export interface LaserState {
  /** Laser ID */
  id: string;
  /** Center position */
  position: Position;
  /** Velocity (always upward) */
  velocity: Velocity;
  /** Laser width in pixels */
  width: number;
  /** Laser height in pixels */
  height: number;
  /** Is laser active? */
  isActive: boolean;
}

// ============================================================================
// Collision Types
// ============================================================================

/**
 * Collision type.
 */
export type CollisionType =
  | 'paddle'
  | 'brick'
  | 'wall-left'
  | 'wall-right'
  | 'wall-top'
  | 'wall-bottom'
  | 'none';

/**
 * Collision detection result.
 */
export interface CollisionResult {
  /** Type of collision detected */
  type: CollisionType;
  /** Position of collision */
  position?: Position;
  /** Normal vector at collision point (for reflection) */
  normal?: { x: number; y: number };
  /** Brick that was hit (if type is 'brick') */
  brick?: BrickState;
  /** Penetration depth (for collision resolution) */
  penetration?: number;
}

// ============================================================================
// Scoring Types
// ============================================================================

/**
 * Score state.
 */
export interface ScoreState {
  /** Current score */
  score: number;
  /** Current level */
  level: number;
  /** Lives remaining */
  lives: number;
  /** Total bricks destroyed */
  bricksDestroyed: number;
  /** Total bricks in current level */
  totalBricks: number;
  /** Points multiplier */
  multiplier: number;
  /** Combo count (consecutive brick hits without missing) */
  combo: number;
  /** Highest combo achieved this game */
  bestCombo: number;
}

// ============================================================================
// Level Types
// ============================================================================

/**
 * Level layout pattern.
 */
export type LevelPattern =
  | 'standard' // Classic brick pattern
  | 'pyramid' // Pyramid shape
  | 'diamond' // Diamond shape
  | 'random' // Random placement
  | 'checkerboard' // Alternating pattern
  | 'custom'; // Custom pattern

/**
 * Level configuration.
 */
export interface LevelConfig {
  /** Level number */
  levelNumber: number;
  /** Level pattern */
  pattern: LevelPattern;
  /** Number of brick rows */
  rows: number;
  /** Number of brick columns */
  cols: number;
  /** Brick type distribution */
  brickTypes: {
    normal: number; // percentage
    strong: number;
    veryStrong: number;
    unbreakable: number;
    explosive: number;
    powerup: number;
  };
  /** Ball speed for this level */
  ballSpeed: number;
  /** Power-up drop chance (0-1) */
  powerUpChance: number;
}

// ============================================================================
// Breakout Game State
// ============================================================================

/**
 * Breakout-specific game state.
 * Extends the base GameState with breakout game properties.
 */
export interface BreakoutGameSpecificState {
  /** Paddle state */
  paddle: PaddleState;
  /** Ball states (array for multi-ball) */
  balls: BallState[];
  /** Brick states */
  bricks: BrickState[];
  /** Active power-ups (falling) */
  powerUps: PowerUpState[];
  /** Active power-up effects */
  activePowerUps: ActivePowerUp[];
  /** Laser projectiles */
  lasers: LaserState[];
  /** Score state */
  scoreState: ScoreState;
  /** Current level configuration */
  levelConfig: LevelConfig;
  /** Current difficulty level */
  difficulty: BreakoutDifficulty;
  /** Game area width in pixels */
  gameWidth: number;
  /** Game area height in pixels */
  gameHeight: number;
  /** Is ball launched (or waiting on paddle)? */
  ballLaunched: boolean;
  /** Is level complete? */
  levelComplete: boolean;
  /** Is game over? */
  gameOver: boolean;
  /** Countdown timer for level start */
  countdownTimer: number;
  /** Last collision detected */
  lastCollision?: CollisionResult;
  /** Unique session ID for this game session */
  sessionId?: string;
}

/**
 * Complete Breakout game state.
 */
export type BreakoutState = GameState<BreakoutGameSpecificState>;

// ============================================================================
// Breakout Game Configuration
// ============================================================================

/**
 * Breakout-specific configuration options.
 */
export interface BreakoutGameSpecificConfig {
  /** Game area width in pixels */
  gameWidth: number;
  /** Game area height in pixels */
  gameHeight: number;
  /** Paddle width in pixels */
  paddleWidth: number;
  /** Paddle height in pixels */
  paddleHeight: number;
  /** Ball radius in pixels */
  ballRadius: number;
  /** Initial ball speed in pixels per second */
  initialBallSpeed: number;
  /** Maximum ball speed in pixels per second */
  maxBallSpeed: number;
  /** Paddle speed in pixels per second */
  paddleSpeed: number;
  /** Brick width in pixels */
  brickWidth: number;
  /** Brick height in pixels */
  brickHeight: number;
  /** Number of brick rows */
  brickRows: number;
  /** Number of brick columns */
  brickCols: number;
  /** Starting number of lives */
  startingLives: number;
  /** Power-up falling speed in pixels per second */
  powerUpSpeed: number;
  /** Power-up effect duration in seconds */
  powerUpDuration: number;
  /** Laser projectile speed in pixels per second */
  laserSpeed: number;
  /** Laser cooldown in seconds */
  laserCooldown: number;
  /** Difficulty level */
  difficulty: BreakoutDifficulty;
  /** Enable ball trail effect */
  enableBallTrail: boolean;
  /** Enable particle effects */
  enableParticles: boolean;
  /** Starting level */
  startingLevel: number;
}

/**
 * Complete Breakout game configuration.
 */
export type BreakoutConfig = GameConfig<BreakoutGameSpecificConfig>;

// ============================================================================
// Breakout Game Actions
// ============================================================================

/**
 * Breakout-specific game actions.
 */
export type BreakoutAction =
  | { type: 'MOVE_PADDLE'; direction: PaddleDirection }
  | { type: 'MOVE_PADDLE_TO'; targetX: number }
  | { type: 'LAUNCH_BALL' }
  | { type: 'UPDATE_BALLS'; deltaTime: number }
  | { type: 'UPDATE_POWER_UPS'; deltaTime: number }
  | { type: 'UPDATE_LASERS'; deltaTime: number }
  | { type: 'FIRE_LASER' }
  | { type: 'BALL_PADDLE_COLLISION'; ballId: string; hitPosition: number }
  | { type: 'BALL_BRICK_COLLISION'; ballId: string; brickId: string }
  | { type: 'BALL_WALL_COLLISION'; ballId: string; wall: 'left' | 'right' | 'top' }
  | { type: 'BALL_LOST'; ballId: string }
  | { type: 'POWER_UP_COLLECTED'; powerUpId: string }
  | { type: 'BRICK_DESTROYED'; brickId: string }
  | { type: 'LEVEL_COMPLETE' }
  | { type: 'LIFE_LOST' }
  | { type: 'GAME_OVER' };

// ============================================================================
// Breakout Game Events
// ============================================================================

/**
 * Breakout-specific game events for UI and audio.
 */
export type BreakoutEvent =
  | { type: 'PADDLE_HIT'; position: Position; speed: number }
  | { type: 'BRICK_HIT'; brick: BrickState; position: Position }
  | { type: 'BRICK_DESTROYED'; brick: BrickState; score: number; combo: number }
  | { type: 'WALL_HIT'; position: Position }
  | { type: 'POWER_UP_DROP'; powerUp: PowerUpState }
  | { type: 'POWER_UP_COLLECTED'; powerUpType: PowerUpType }
  | { type: 'POWER_UP_ACTIVATED'; powerUpType: PowerUpType }
  | { type: 'POWER_UP_EXPIRED'; powerUpType: PowerUpType }
  | { type: 'LASER_FIRED'; position: Position }
  | { type: 'LASER_HIT'; brick: BrickState }
  | { type: 'MULTI_BALL_ACTIVATED'; count: number }
  | { type: 'BALL_LOST'; livesRemaining: number }
  | { type: 'LIFE_LOST'; livesRemaining: number }
  | { type: 'EXTRA_LIFE'; livesRemaining: number }
  | { type: 'LEVEL_COMPLETE'; level: number; score: number }
  | { type: 'GAME_OVER'; finalScore: number; level: number }
  | { type: 'COMBO_ACHIEVED'; combo: number }
  | { type: 'EXPLOSION'; position: Position; radius: number };

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Rectangle bounds for collision detection.
 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Circle bounds for collision detection.
 */
export interface Circle {
  x: number;
  y: number;
  radius: number;
}

/**
 * Particle for visual effects.
 */
export interface Particle {
  id: string;
  position: Position;
  velocity: Velocity;
  color: string;
  size: number;
  lifetime: number;
  maxLifetime: number;
  isActive: boolean;
}

/**
 * High score entry for leaderboard.
 */
export interface BreakoutHighScore {
  /** Player identifier */
  playerId: string;
  /** Player display name */
  playerName: string;
  /** Final score */
  score: number;
  /** Level reached */
  level: number;
  /** Total bricks destroyed */
  bricksDestroyed: number;
  /** Best combo achieved */
  bestCombo: number;
  /** Game duration in seconds */
  duration: number;
  /** Difficulty played */
  difficulty: BreakoutDifficulty;
  /** Timestamp */
  timestamp: number;
}

// ============================================================================
// Re-exports for convenience
// ============================================================================

export type { BreakoutDifficulty } from './constants';
export type { Direction } from '../types';
