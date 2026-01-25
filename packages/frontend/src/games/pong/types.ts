/**
 * Pong Game Types
 *
 * This module defines TypeScript types and interfaces specific to the Pong game.
 * It extends the core game engine types with pong-specific state and configuration.
 *
 * @module games/pong/types
 */

import type { GameState, GameConfig } from '../types';
import type { PongDifficulty } from './constants';

// ============================================================================
// Position and Velocity Types
// ============================================================================

/**
 * 2D Position in pixel coordinates.
 *
 * @description
 * Represents a position on the canvas in pixel coordinates.
 * Origin (0, 0) is at the top-left corner of the canvas.
 *
 * @example
 * ```ts
 * const ballPos: Position = { x: 400, y: 300 };
 * const paddlePos: Position = { x: 50, y: 200 };
 * ```
 */
export interface Position {
  /** X coordinate in pixels (left to right) */
  x: number;
  /** Y coordinate in pixels (top to bottom) */
  y: number;
}

/**
 * 2D Velocity vector.
 *
 * @description
 * Represents velocity in pixels per second.
 * Positive vx moves right, negative vx moves left.
 * Positive vy moves down, negative vy moves up.
 *
 * @example
 * ```ts
 * // Ball moving right and up
 * const velocity: Velocity = { vx: 300, vy: -200 };
 *
 * // Update position
 * position.x += velocity.vx * deltaTime;
 * position.y += velocity.vy * deltaTime;
 * ```
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
 * Paddle side (left or right).
 */
export type PaddleSide = 'left' | 'right';

/**
 * Paddle state.
 *
 * @description
 * Represents the state of a paddle including position, velocity, and dimensions.
 */
export interface PaddleState {
  /** Paddle side identifier */
  side: PaddleSide;
  /** Top-left corner position */
  position: Position;
  /** Current velocity (for smooth movement) */
  velocity: Velocity;
  /** Paddle width in pixels */
  width: number;
  /** Paddle height in pixels */
  height: number;
  /** Is this paddle controlled by AI? */
  isAI: boolean;
  /** Target Y position (for AI movement) */
  targetY?: number;
}

/**
 * Paddle input direction.
 */
export type PaddleDirection = 'up' | 'down' | 'none';

// ============================================================================
// Ball Types
// ============================================================================

/**
 * Ball state.
 *
 * @description
 * Represents the state of the ball including position, velocity, and dimensions.
 */
export interface BallState {
  /** Center position */
  position: Position;
  /** Current velocity */
  velocity: Velocity;
  /** Ball radius in pixels */
  radius: number;
  /** Current speed multiplier (increases after paddle hits) */
  speedMultiplier: number;
  /** Number of paddle hits in current rally */
  rallyCount: number;
  /** Last paddle that hit the ball */
  lastHitBy?: PaddleSide;
}

// ============================================================================
// Collision Types
// ============================================================================

/**
 * Collision type.
 */
export type CollisionType =
  | 'paddle-left'
  | 'paddle-right'
  | 'wall-top'
  | 'wall-bottom'
  | 'goal-left'
  | 'goal-right'
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
}

// ============================================================================
// AI Types
// ============================================================================

/**
 * AI difficulty level.
 */
export type AIDifficulty = 'easy' | 'normal' | 'hard';

/**
 * AI configuration.
 */
export interface AIConfig {
  /** Reaction time in seconds (delay before AI responds) */
  reactionTime: number;
  /** Prediction accuracy (0-1, 1 = perfect prediction) */
  predictionAccuracy: number;
  /** Maximum speed multiplier (0-1, 1 = full speed) */
  speedMultiplier: number;
  /** Error margin in pixels (AI aims for center ± this value) */
  errorMargin: number;
  /** Whether AI makes intentional mistakes */
  makeMistakes: boolean;
  /** Mistake chance (0-1, probability of making a mistake) */
  mistakeChance: number;
}

// ============================================================================
// Scoring Types
// ============================================================================

/**
 * Player score state.
 */
export interface PlayerScore {
  /** Player side */
  side: PaddleSide;
  /** Current score */
  score: number;
  /** Number of rallies won */
  ralliesWon: number;
  /** Total paddle hits */
  totalHits: number;
  /** Longest rally */
  longestRally: number;
}

/**
 * Win condition.
 */
export interface WinCondition {
  /** Target score to win */
  targetScore: number;
  /** Has a player won? */
  hasWinner: boolean;
  /** Winning side */
  winner?: PaddleSide;
}

// ============================================================================
// Pong Game State
// ============================================================================

/**
 * Pong-specific game state.
 * Extends the base GameState with pong game properties.
 */
export interface PongGameSpecificState {
  /** Left paddle state */
  leftPaddle: PaddleState;
  /** Right paddle state */
  rightPaddle: PaddleState;
  /** Ball state */
  ball: BallState;
  /** Left player score */
  leftScore: PlayerScore;
  /** Right player score */
  rightScore: PlayerScore;
  /** Win condition state */
  winCondition: WinCondition;
  /** AI configuration (if playing against AI) */
  aiConfig?: AIConfig;
  /** Current difficulty level */
  difficulty: PongDifficulty;
  /** Court width in pixels */
  courtWidth: number;
  /** Court height in pixels */
  courtHeight: number;
  /** Serve direction (who gets next serve) */
  serveDirection: PaddleSide;
  /** Is ball currently in play? */
  ballInPlay: boolean;
  /** Time until next serve */
  serveDelayRemaining: number;
  /** Current rally count */
  currentRally: number;
  /** Last collision detected */
  lastCollision?: CollisionResult;
  /** Game mode */
  mode: 'single-player' | 'two-player';
  /** Unique session ID for this game session */
  sessionId?: string;
}

/**
 * Complete Pong game state.
 */
export type PongState = GameState<PongGameSpecificState>;

// ============================================================================
// Pong Game Configuration
// ============================================================================

/**
 * Pong-specific configuration options.
 */
export interface PongGameSpecificConfig {
  /** Court width in pixels */
  courtWidth: number;
  /** Court height in pixels */
  courtHeight: number;
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
  /** Ball speed increase per paddle hit (%) */
  speedIncreasePerHit: number;
  /** Paddle speed in pixels per second */
  paddleSpeed: number;
  /** AI difficulty level */
  aiDifficulty: AIDifficulty;
  /** Points needed to win */
  targetScore: number;
  /** Delay before serving (seconds) */
  serveDelay: number;
  /** Enable ball trail effect */
  enableBallTrail: boolean;
  /** Enable screen shake on collision */
  enableScreenShake: boolean;
  /** Game mode */
  mode: 'single-player' | 'two-player';
}

/**
 * Complete Pong game configuration.
 */
export type PongConfig = GameConfig<PongGameSpecificConfig>;

// ============================================================================
// Pong Game Actions
// ============================================================================

/**
 * Pong-specific game actions.
 */
export type PongAction =
  | { type: 'MOVE_PADDLE'; side: PaddleSide; direction: PaddleDirection }
  | { type: 'MOVE_PADDLE_TO'; side: PaddleSide; targetY: number }
  | { type: 'UPDATE_BALL'; deltaTime: number }
  | { type: 'SERVE_BALL'; direction: PaddleSide }
  | { type: 'RESET_BALL' }
  | { type: 'PADDLE_HIT'; side: PaddleSide; hitPosition: number }
  | { type: 'WALL_HIT'; wall: 'top' | 'bottom' }
  | { type: 'GOAL_SCORED'; side: PaddleSide }
  | { type: 'RALLY_CONTINUE'; count: number }
  | { type: 'UPDATE_AI'; deltaTime: number };

// ============================================================================
// Pong Game Events
// ============================================================================

/**
 * Pong-specific game events for UI and audio.
 */
export type PongEvent =
  | { type: 'PADDLE_HIT'; side: PaddleSide; speed: number; rally: number }
  | { type: 'WALL_HIT'; position: Position }
  | { type: 'GOAL_SCORED'; scorer: PaddleSide; score: PlayerScore }
  | { type: 'SERVE_START'; server: PaddleSide }
  | { type: 'RALLY_MILESTONE'; count: number }
  | { type: 'GAME_WON'; winner: PaddleSide; finalScore: { left: number; right: number } }
  | { type: 'SPEED_INCREASED'; newSpeed: number; multiplier: number };

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
 * High score entry for leaderboard.
 */
export interface PongHighScore {
  /** Player identifier */
  playerId: string;
  /** Player display name */
  playerName: string;
  /** Final score */
  score: number;
  /** Opponent score */
  opponentScore: number;
  /** Longest rally achieved */
  longestRally: number;
  /** Total paddle hits */
  totalHits: number;
  /** Game duration in seconds */
  duration: number;
  /** Difficulty played */
  difficulty: PongDifficulty;
  /** Game mode */
  mode: 'single-player' | 'two-player';
  /** Timestamp */
  timestamp: number;
}

// ============================================================================
// Re-exports for convenience
// ============================================================================

export type { PongDifficulty } from './constants';
export type { Direction } from '../types';
