/**
 * Pong Game Module
 *
 * Entry point for the Pong game implementation.
 * Re-exports all types, constants, and logic functions.
 *
 * @module games/pong
 */

// Types
export type {
  Position,
  Velocity,
  PaddleState,
  BallState,
  PongState,
  PongGameSpecificState,
  PongConfig,
  PongGameSpecificConfig,
  CollisionResult,
  CollisionType,
  PaddleSide,
  PaddleDirection,
  AIDifficulty,
  AIConfig,
  PlayerScore,
  WinCondition,
  PongAction,
  PongEvent,
  PongHighScore,
  Rect,
  Circle,
} from './types';

// Constants
export {
  COURT_WIDTH,
  COURT_HEIGHT,
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  PADDLE_SPEED,
  PADDLE_OFFSET,
  BALL_RADIUS,
  INITIAL_BALL_SPEED,
  MAX_BALL_SPEED,
  MIN_BALL_SPEED,
  SPEED_INCREASE_PER_HIT,
  MAX_SPEED_MULTIPLIER,
  BALL_SPIN_FACTOR,
  MAX_BOUNCE_ANGLE,
  SERVE_DELAY,
  TARGET_SCORE,
  AI_CONFIGS,
  PONG_COLORS,
  FONTS,
  DIFFICULTY_SETTINGS,
  GAME_MODES,
} from './constants';

export type { PongDifficulty, GameMode } from './constants';

// Logic
export {
  createInitialPongState,
  createInitialPaddle,
  createInitialBall,
  createInitialScore,
  updateGameState,
  updateBallPosition,
  updatePaddlePosition,
  serveBall,
  resetBall,
  increaseBallSpeed,
  detectCollisions,
  handlePaddleCollision,
  handleWallCollision,
  updateAI,
  predictBallY,
  movePaddleToTarget,
  updateScore,
  updateHitCount,
  checkWinCondition,
  checkBallPaddleCollision,
  checkBallWallCollision,
  checkGoal,
} from './logic';

// Renderer
export { renderGame, renderBackground, renderPaddle, renderBall } from './renderer';

// Hook
export { usePongGame } from './usePongGame';
export type { UsePongGameOptions, UsePongGameReturn } from './usePongGame';

// Component
export { PongGame } from './PongGame';
export type { PongGameProps } from './PongGame';

// Wrapper Component with difficulty selection and arcade integration
export { PongGameWrapper } from './PongGameWrapper';
export type { PongGameWrapperProps } from './PongGameWrapper';

// Sound System
export {
  PongSoundType,
  PONG_SOUND_ASSETS,
  initializePongSounds,
  playPaddleHitSound,
  playWallBounceSound,
  playScoreSound,
  playOpponentScoreSound,
  playServeSound,
  playGameStartSound,
  playGameEndSound,
  playRallySound,
  playSpeedUpSound,
} from './PongSounds';

// Default export
export { default } from './logic';
