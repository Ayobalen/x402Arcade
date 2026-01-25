/**
 * Breakout Game Module
 *
 * Main entry point for the Breakout game.
 * Exports all types, constants, and logic functions.
 *
 * @module games/breakout
 */

// ============================================================================
// Type Exports
// ============================================================================

export type {
  Position,
  Velocity,
  PaddleState,
  PaddleDirection,
  BallState,
  BrickState,
  BrickType,
  PowerUpState,
  PowerUpType,
  ActivePowerUp,
  LaserState,
  CollisionType,
  CollisionResult,
  ScoreState,
  LevelPattern,
  LevelConfig,
  BreakoutGameSpecificState,
  BreakoutState,
  BreakoutGameSpecificConfig,
  BreakoutConfig,
  BreakoutAction,
  BreakoutEvent,
  Rect,
  Circle,
  Particle,
  BreakoutHighScore,
  BreakoutDifficulty,
} from './types';

// ============================================================================
// Constant Exports
// ============================================================================

export {
  // Game Area
  GAME_WIDTH,
  GAME_HEIGHT,
  TOP_PADDING,
  SIDE_PADDING,
  BOTTOM_PADDING,
  // Paddle
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  PADDLE_SPEED,
  PADDLE_ACCELERATION,
  PADDLE_DECELERATION,
  MAX_PADDLE_VELOCITY,
  PADDLE_Y_OFFSET,
  PADDLE_SIZE_MULTIPLIERS,
  // Ball
  BALL_RADIUS,
  INITIAL_BALL_SPEED,
  MAX_BALL_SPEED,
  MIN_BALL_SPEED,
  SPEED_INCREASE_PER_BRICK,
  MAX_SPEED_MULTIPLIER,
  BALL_SPIN_FACTOR,
  MAX_BOUNCE_ANGLE,
  MIN_VERTICAL_VELOCITY,
  BALL_TRAIL_LENGTH,
  // Bricks
  BRICK_WIDTH,
  BRICK_HEIGHT,
  BRICK_ROWS,
  BRICK_COLS,
  BRICK_GRID_TOP,
  BRICK_GAP,
  BRICK_HP,
  BRICK_POINTS,
  BRICK_COLORS,
  EXPLOSION_RADIUS,
  // Power-ups
  POWERUP_WIDTH,
  POWERUP_HEIGHT,
  POWERUP_SPEED,
  POWERUP_DURATION,
  POWERUP_DROP_CHANCE,
  POWERUP_WEIGHTS,
  POWERUP_COLORS,
  POWERUP_ICONS,
  // Lasers
  LASER_WIDTH,
  LASER_HEIGHT,
  LASER_SPEED,
  LASER_COOLDOWN,
  LASER_COLOR,
  // Gameplay
  STARTING_LIVES,
  COUNTDOWN_DURATION,
  LEVEL_COMPLETE_DELAY,
  COMBO_TIMEOUT,
  MULTIPLIER_THRESHOLDS,
  // Visual
  BREAKOUT_COLORS,
  FONTS,
  // Difficulty
  DIFFICULTY_SETTINGS,
  // Level
  LEVEL_BRICK_DISTRIBUTION,
  getLevelBrickDistribution,
  getLevelBallSpeed,
  getLevelPowerUpChance,
  // Debug
  DEBUG_SETTINGS,
} from './constants';

// ============================================================================
// Logic Function Exports
// ============================================================================

export {
  // Initialization
  createInitialPaddle,
  createInitialBall,
  createBrickGrid,
  createBrick,
  createLevelConfig,
  initializeBreakoutState,
  // Paddle
  updatePaddle,
  movePaddleToX,
  // Ball
  launchBall,
  updateBall,
  reflectBall,
  increaseBallSpeed,
  // Collision Detection
  checkBallPaddleCollision,
  checkBallBrickCollision,
  checkBallWallCollision,
  isBallLost,
  // Brick Logic
  damageBrick,
  shouldDropPowerUp,
  createPowerUpDrop,
  getExplosionDamagedBricks,
  // Power-up Logic
  updatePowerUp,
  checkPowerUpCollection,
  applyPowerUpEffect,
  updateActivePowerUps,
  // Laser Logic
  fireLaser,
  updateLaser,
  checkLaserBrickCollision,
  // Scoring
  addScore,
  resetCombo,
  // Level Logic
  isLevelComplete,
  advanceToNextLevel,
  // Game State
  isGameOver,
  resetAfterLifeLost,
} from './logic';

// ============================================================================
// Component Exports
// ============================================================================

export { BreakoutGame } from './BreakoutGame';
export type { BreakoutGameProps } from './BreakoutGame';
