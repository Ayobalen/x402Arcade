/**
 * Breakout Game Logic
 *
 * This module implements the core game logic for Breakout including:
 * - Paddle physics and movement
 * - Ball physics and collision detection
 * - Brick collision and destruction
 * - Power-up system
 * - Laser system
 * - Scoring and combo system
 * - Level progression
 *
 * @module games/breakout/logic
 */

import type {
  BreakoutState,
  PaddleState,
  BallState,
  BrickState,
  PowerUpState,
  LaserState,
  Position,
  CollisionResult,
  PaddleDirection,
  BrickType,
  PowerUpType,
  LevelConfig,
  Rect,
  Circle,
} from './types';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  TOP_PADDING,
  SIDE_PADDING,
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  PADDLE_ACCELERATION,
  PADDLE_DECELERATION,
  MAX_PADDLE_VELOCITY,
  PADDLE_Y_OFFSET,
  PADDLE_SIZE_MULTIPLIERS,
  BALL_RADIUS,
  MAX_BALL_SPEED,
  SPEED_INCREASE_PER_BRICK,
  MAX_SPEED_MULTIPLIER,
  MAX_BOUNCE_ANGLE,
  MIN_VERTICAL_VELOCITY,
  BALL_TRAIL_LENGTH,
  BRICK_WIDTH,
  BRICK_HEIGHT,
  BRICK_COLS,
  BRICK_GRID_TOP,
  BRICK_GAP,
  BRICK_HP,
  BRICK_POINTS,
  BRICK_COLORS,
  EXPLOSION_RADIUS,
  POWERUP_WIDTH,
  POWERUP_HEIGHT,
  POWERUP_SPEED,
  POWERUP_DURATION,
  POWERUP_WEIGHTS,
  POWERUP_COLORS,
  POWERUP_ICONS,
  LASER_WIDTH,
  LASER_HEIGHT,
  LASER_SPEED,
  DIFFICULTY_SETTINGS,
  getLevelBrickDistribution,
  getLevelBallSpeed,
  getLevelPowerUpChance,
  type BreakoutDifficulty,
} from './constants';

// ============================================================================
// Initialization Functions
// ============================================================================

/**
 * Create initial paddle state.
 */
export function createInitialPaddle(difficulty: BreakoutDifficulty): PaddleState {
  const settings = DIFFICULTY_SETTINGS[difficulty];
  const width = settings.paddleWidth;

  return {
    position: {
      x: GAME_WIDTH / 2 - width / 2,
      y: GAME_HEIGHT - PADDLE_Y_OFFSET,
    },
    velocity: { vx: 0, vy: 0 },
    width,
    height: PADDLE_HEIGHT,
    isSticky: false,
    sizeMultiplier: 1.0,
    hasLaser: false,
    laserCooldown: 0,
  };
}

/**
 * Create initial ball state.
 */
export function createInitialBall(
  paddle: PaddleState,
  _ballSpeed: number,
  id = 'ball-0'
): BallState {
  return {
    id,
    position: {
      x: paddle.position.x + paddle.width / 2,
      y: paddle.position.y - BALL_RADIUS - 2,
    },
    velocity: { vx: 0, vy: 0 },
    radius: BALL_RADIUS,
    speedMultiplier: 1.0,
    isStuck: true,
    stuckOffset: 0,
    isActive: true,
    trail: [],
  };
}

/**
 * Create brick grid for a level.
 */
export function createBrickGrid(levelConfig: LevelConfig): BrickState[] {
  const bricks: BrickState[] = [];
  const { rows, cols, brickTypes } = levelConfig;

  // Calculate starting position to center the grid
  const gridWidth = cols * (BRICK_WIDTH + BRICK_GAP) - BRICK_GAP;
  const startX = (GAME_WIDTH - gridWidth) / 2;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const brickType = selectBrickType(brickTypes);
      const brick = createBrick(
        `brick-${row}-${col}`,
        startX + col * (BRICK_WIDTH + BRICK_GAP),
        BRICK_GRID_TOP + row * (BRICK_HEIGHT + BRICK_GAP),
        brickType
      );
      bricks.push(brick);
    }
  }

  return bricks;
}

/**
 * Select brick type based on distribution.
 */
function selectBrickType(distribution: LevelConfig['brickTypes']): BrickType {
  const rand = Math.random() * 100;
  let cumulative = 0;

  const types: BrickType[] = [
    'normal',
    'strong',
    'very-strong',
    'unbreakable',
    'explosive',
    'powerup',
  ];

  for (const type of types) {
    cumulative += distribution[type as keyof typeof distribution];
    if (rand <= cumulative) {
      return type;
    }
  }

  return 'normal';
}

/**
 * Create a single brick.
 */
export function createBrick(
  id: string,
  x: number,
  y: number,
  type: BrickType = 'normal'
): BrickState {
  const brickType = type === 'very-strong' ? 'veryStrong' : type;
  const hp = BRICK_HP[brickType as keyof typeof BRICK_HP];
  const points = BRICK_POINTS[brickType as keyof typeof BRICK_POINTS];
  const color = BRICK_COLORS[brickType as keyof typeof BRICK_COLORS];

  return {
    id,
    position: { x, y },
    width: BRICK_WIDTH,
    height: BRICK_HEIGHT,
    type,
    hp,
    maxHp: hp,
    isDestroyed: false,
    points,
    color,
    powerUpType: type === 'powerup' ? selectRandomPowerUpType() : undefined,
  };
}

/**
 * Create level configuration.
 */
export function createLevelConfig(
  levelNumber: number,
  difficulty: BreakoutDifficulty
): LevelConfig {
  const settings = DIFFICULTY_SETTINGS[difficulty];
  const brickTypes = getLevelBrickDistribution(levelNumber);
  const ballSpeed = getLevelBallSpeed(levelNumber, settings.ballSpeed);
  const powerUpChance = getLevelPowerUpChance(levelNumber, settings.powerUpDropChance);

  return {
    levelNumber,
    pattern: 'standard',
    rows: settings.brickRows,
    cols: BRICK_COLS,
    brickTypes,
    ballSpeed,
    powerUpChance,
  };
}

/**
 * Initialize Breakout game state.
 */
export function initializeBreakoutState(
  difficulty: BreakoutDifficulty,
  startingLevel = 1,
  sessionId?: string
): BreakoutState {
  const levelConfig = createLevelConfig(startingLevel, difficulty);

  const paddle = createInitialPaddle(difficulty);
  const ball = createInitialBall(paddle, levelConfig.ballSpeed);
  const bricks = createBrickGrid(levelConfig);

  return {
    score: 0,
    isPlaying: false,
    isPaused: false,
    isGameOver: false,
    level: startingLevel,
    lives: DIFFICULTY_SETTINGS[difficulty].startingLives,
    highScore: 0,
    startTime: null,
    elapsedTime: 0,
    gameSpecific: {
      paddle,
      balls: [ball],
      bricks,
      powerUps: [],
      activePowerUps: [],
      lasers: [],
      scoreState: {
        score: 0,
        level: startingLevel,
        lives: DIFFICULTY_SETTINGS[difficulty].startingLives,
        bricksDestroyed: 0,
        totalBricks: bricks.filter((b) => b.type !== 'unbreakable').length,
        multiplier: 1.0,
        combo: 0,
        bestCombo: 0,
      },
      levelConfig,
      difficulty,
      gameWidth: GAME_WIDTH,
      gameHeight: GAME_HEIGHT,
      ballLaunched: false,
      levelComplete: false,
      gameOver: false,
      countdownTimer: 0,
      sessionId,
    },
  };
}

// ============================================================================
// Paddle Logic
// ============================================================================

/**
 * Update paddle position based on direction input.
 */
export function updatePaddle(paddle: PaddleState, direction: PaddleDirection, deltaTime: number) {
  const newPaddle = { ...paddle };

  // Update velocity based on direction
  if (direction === 'left') {
    newPaddle.velocity.vx -= PADDLE_ACCELERATION * deltaTime;
  } else if (direction === 'right') {
    newPaddle.velocity.vx += PADDLE_ACCELERATION * deltaTime;
  } else {
    // Apply deceleration (friction)
    const decel = PADDLE_DECELERATION * deltaTime;
    if (Math.abs(newPaddle.velocity.vx) < decel) {
      newPaddle.velocity.vx = 0;
    } else {
      newPaddle.velocity.vx -= Math.sign(newPaddle.velocity.vx) * decel;
    }
  }

  // Clamp velocity
  newPaddle.velocity.vx = Math.max(
    -MAX_PADDLE_VELOCITY,
    Math.min(MAX_PADDLE_VELOCITY, newPaddle.velocity.vx)
  );

  // Update position
  newPaddle.position.x += newPaddle.velocity.vx * deltaTime;

  // Keep paddle within bounds
  newPaddle.position.x = Math.max(
    SIDE_PADDING,
    Math.min(GAME_WIDTH - SIDE_PADDING - newPaddle.width, newPaddle.position.x)
  );

  // Update laser cooldown
  if (newPaddle.laserCooldown > 0) {
    newPaddle.laserCooldown = Math.max(0, newPaddle.laserCooldown - deltaTime);
  }

  return newPaddle;
}

/**
 * Move paddle to target X position (for mouse/touch control).
 */
export function movePaddleToX(paddle: PaddleState, targetX: number): PaddleState {
  const newPaddle = { ...paddle };

  // Center paddle on target X
  newPaddle.position.x = targetX - newPaddle.width / 2;

  // Keep paddle within bounds
  newPaddle.position.x = Math.max(
    SIDE_PADDING,
    Math.min(GAME_WIDTH - SIDE_PADDING - newPaddle.width, newPaddle.position.x)
  );

  return newPaddle;
}

// ============================================================================
// Ball Logic
// ============================================================================

/**
 * Launch ball from paddle.
 */
export function launchBall(ball: BallState, _paddle: PaddleState, ballSpeed: number): BallState {
  if (!ball.isStuck) return ball;

  const newBall = { ...ball };
  newBall.isStuck = false;

  // Launch at 45-degree angle upward
  const angle = -Math.PI / 4 + (Math.random() * Math.PI) / 4; // -45° to -22.5°
  const speed = ballSpeed * ball.speedMultiplier;

  newBall.velocity = {
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
  };

  return newBall;
}

/**
 * Update ball position and handle stuck balls.
 */
export function updateBall(ball: BallState, paddle: PaddleState, deltaTime: number): BallState {
  const newBall = { ...ball };

  if (newBall.isStuck) {
    // Ball is stuck to paddle, follow paddle position
    newBall.position.x = paddle.position.x + paddle.width / 2 + (newBall.stuckOffset || 0);
    newBall.position.y = paddle.position.y - newBall.radius - 2;
  } else {
    // Update position
    newBall.position.x += newBall.velocity.vx * deltaTime;
    newBall.position.y += newBall.velocity.vy * deltaTime;

    // Update trail
    newBall.trail = [
      { x: newBall.position.x, y: newBall.position.y },
      ...newBall.trail.slice(0, BALL_TRAIL_LENGTH - 1),
    ];
  }

  return newBall;
}

/**
 * Reflect ball velocity based on collision normal.
 */
export function reflectBall(ball: BallState, normal: { x: number; y: number }): BallState {
  const newBall = { ...ball };

  // Reflect velocity
  const dot = newBall.velocity.vx * normal.x + newBall.velocity.vy * normal.y;
  newBall.velocity.vx -= 2 * dot * normal.x;
  newBall.velocity.vy -= 2 * dot * normal.y;

  // Ensure minimum vertical velocity
  if (Math.abs(newBall.velocity.vy) < MIN_VERTICAL_VELOCITY) {
    newBall.velocity.vy = Math.sign(newBall.velocity.vy) * MIN_VERTICAL_VELOCITY;
  }

  return newBall;
}

/**
 * Increase ball speed after brick hit.
 */
export function increaseBallSpeed(ball: BallState): BallState {
  const newBall = { ...ball };

  newBall.speedMultiplier = Math.min(
    MAX_SPEED_MULTIPLIER,
    newBall.speedMultiplier * (1 + SPEED_INCREASE_PER_BRICK)
  );

  // Apply speed multiplier to current velocity
  const currentSpeed = Math.sqrt(newBall.velocity.vx ** 2 + newBall.velocity.vy ** 2);
  const newSpeed = Math.min(MAX_BALL_SPEED, currentSpeed * (1 + SPEED_INCREASE_PER_BRICK));
  const ratio = newSpeed / currentSpeed;

  newBall.velocity.vx *= ratio;
  newBall.velocity.vy *= ratio;

  return newBall;
}

// ============================================================================
// Collision Detection
// ============================================================================

/**
 * Check collision between ball and paddle.
 */
export function checkBallPaddleCollision(
  ball: BallState,
  paddle: PaddleState
): CollisionResult | null {
  if (ball.isStuck) return null;

  const ballRect: Circle = {
    x: ball.position.x,
    y: ball.position.y,
    radius: ball.radius,
  };

  const paddleRect: Rect = {
    x: paddle.position.x,
    y: paddle.position.y,
    width: paddle.width,
    height: paddle.height,
  };

  // Check if ball is moving downward and intersects paddle
  if (ball.velocity.vy > 0 && circleRectIntersect(ballRect, paddleRect)) {
    // Calculate hit position (-1 = left edge, 0 = center, 1 = right edge)
    const hitPosition =
      (ball.position.x - (paddle.position.x + paddle.width / 2)) / (paddle.width / 2);

    // Calculate bounce angle based on hit position
    const bounceAngle = hitPosition * (MAX_BOUNCE_ANGLE * (Math.PI / 180));

    return {
      type: 'paddle',
      position: { x: ball.position.x, y: paddle.position.y },
      normal: { x: Math.sin(bounceAngle), y: -Math.cos(bounceAngle) },
    };
  }

  return null;
}

/**
 * Check collision between ball and brick.
 */
export function checkBallBrickCollision(
  ball: BallState,
  brick: BrickState
): CollisionResult | null {
  if (ball.isStuck || brick.isDestroyed) return null;

  const ballCircle: Circle = {
    x: ball.position.x,
    y: ball.position.y,
    radius: ball.radius,
  };

  const brickRect: Rect = {
    x: brick.position.x,
    y: brick.position.y,
    width: brick.width,
    height: brick.height,
  };

  if (circleRectIntersect(ballCircle, brickRect)) {
    // Determine collision normal
    const normal = calculateCollisionNormal(ball.position, brickRect);

    return {
      type: 'brick',
      position: { x: ball.position.x, y: ball.position.y },
      normal,
      brick,
    };
  }

  return null;
}

/**
 * Check collision between ball and walls.
 */
export function checkBallWallCollision(ball: BallState): CollisionResult | null {
  if (ball.isStuck) return null;

  // Left wall
  if (ball.position.x - ball.radius <= SIDE_PADDING) {
    return {
      type: 'wall-left',
      position: { x: SIDE_PADDING, y: ball.position.y },
      normal: { x: 1, y: 0 },
    };
  }

  // Right wall
  if (ball.position.x + ball.radius >= GAME_WIDTH - SIDE_PADDING) {
    return {
      type: 'wall-right',
      position: { x: GAME_WIDTH - SIDE_PADDING, y: ball.position.y },
      normal: { x: -1, y: 0 },
    };
  }

  // Top wall
  if (ball.position.y - ball.radius <= TOP_PADDING) {
    return {
      type: 'wall-top',
      position: { x: ball.position.x, y: TOP_PADDING },
      normal: { x: 0, y: 1 },
    };
  }

  return null;
}

/**
 * Check if ball is lost (below paddle).
 */
export function isBallLost(ball: BallState): boolean {
  return !ball.isStuck && ball.position.y - ball.radius > GAME_HEIGHT;
}

/**
 * Circle-rectangle intersection test.
 */
function circleRectIntersect(circle: Circle, rect: Rect): boolean {
  // Find closest point on rectangle to circle center
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

  // Calculate distance from circle center to closest point
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;

  return dx * dx + dy * dy <= circle.radius * circle.radius;
}

/**
 * Calculate collision normal for circle-rectangle collision.
 */
function calculateCollisionNormal(ballPos: Position, rect: Rect): { x: number; y: number } {
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;

  const dx = ballPos.x - centerX;
  const dy = ballPos.y - centerY;

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  const thresholdX = rect.width / 2;
  const thresholdY = rect.height / 2;

  // Determine collision side
  if (absDx / thresholdX > absDy / thresholdY) {
    // Horizontal collision (left or right)
    return { x: Math.sign(dx), y: 0 };
  } else {
    // Vertical collision (top or bottom)
    return { x: 0, y: Math.sign(dy) };
  }
}

// ============================================================================
// Brick Logic
// ============================================================================

/**
 * Damage brick and check if destroyed.
 */
export function damageBrick(brick: BrickState, damage = 1): BrickState {
  if (brick.type === 'unbreakable' || brick.isDestroyed) return brick;

  const newBrick = { ...brick };
  newBrick.hp = Math.max(0, newBrick.hp - damage);

  if (newBrick.hp === 0) {
    newBrick.isDestroyed = true;
  }

  return newBrick;
}

/**
 * Check if brick should drop power-up.
 */
export function shouldDropPowerUp(brick: BrickState, powerUpChance: number): boolean {
  if (brick.type === 'powerup') return true;
  return Math.random() < powerUpChance;
}

/**
 * Create power-up drop.
 */
export function createPowerUpDrop(brick: BrickState, id: string): PowerUpState {
  const type = brick.powerUpType || selectRandomPowerUpType();

  return {
    id,
    position: {
      x: brick.position.x + brick.width / 2,
      y: brick.position.y + brick.height / 2,
    },
    velocity: { vx: 0, vy: POWERUP_SPEED },
    width: POWERUP_WIDTH,
    height: POWERUP_HEIGHT,
    type,
    isActive: true,
    color: POWERUP_COLORS[type],
    icon: POWERUP_ICONS[type],
  };
}

/**
 * Select random power-up type based on weights.
 */
function selectRandomPowerUpType(): PowerUpType {
  const totalWeight = Object.values(POWERUP_WEIGHTS).reduce((sum, w) => sum + w, 0);
  let rand = Math.random() * totalWeight;

  for (const [type, weight] of Object.entries(POWERUP_WEIGHTS)) {
    rand -= weight;
    if (rand <= 0) {
      return type as PowerUpType;
    }
  }

  return 'expand';
}

/**
 * Handle explosive brick destruction.
 */
export function getExplosionDamagedBricks(
  explodedBrick: BrickState,
  allBricks: BrickState[]
): BrickState[] {
  const damagedBricks: BrickState[] = [];

  for (const brick of allBricks) {
    if (brick.id === explodedBrick.id || brick.isDestroyed) continue;

    const dx =
      brick.position.x + brick.width / 2 - (explodedBrick.position.x + explodedBrick.width / 2);
    const dy =
      brick.position.y + brick.height / 2 - (explodedBrick.position.y + explodedBrick.height / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= EXPLOSION_RADIUS) {
      damagedBricks.push(brick);
    }
  }

  return damagedBricks;
}

// ============================================================================
// Power-Up Logic
// ============================================================================

/**
 * Update power-up position.
 */
export function updatePowerUp(powerUp: PowerUpState, deltaTime: number): PowerUpState {
  if (!powerUp.isActive) return powerUp;

  const newPowerUp = { ...powerUp };
  newPowerUp.position.y += newPowerUp.velocity.vy * deltaTime;

  // Deactivate if off screen
  if (newPowerUp.position.y > GAME_HEIGHT) {
    newPowerUp.isActive = false;
  }

  return newPowerUp;
}

/**
 * Check if power-up is collected by paddle.
 */
export function checkPowerUpCollection(powerUp: PowerUpState, paddle: PaddleState): boolean {
  if (!powerUp.isActive) return false;

  const powerUpRect: Rect = {
    x: powerUp.position.x - powerUp.width / 2,
    y: powerUp.position.y - powerUp.height / 2,
    width: powerUp.width,
    height: powerUp.height,
  };

  const paddleRect: Rect = {
    x: paddle.position.x,
    y: paddle.position.y,
    width: paddle.width,
    height: paddle.height,
  };

  return rectIntersect(powerUpRect, paddleRect);
}

/**
 * Rectangle-rectangle intersection test.
 */
function rectIntersect(rect1: Rect, rect2: Rect): boolean {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

/**
 * Apply power-up effect.
 */
export function applyPowerUpEffect(state: BreakoutState, powerUpType: PowerUpType): BreakoutState {
  const newState = { ...state };
  const gameSpecific = newState.gameSpecific;
  if (!gameSpecific) return newState;

  switch (powerUpType) {
    case 'expand':
      gameSpecific.paddle = {
        ...gameSpecific.paddle,
        sizeMultiplier: PADDLE_SIZE_MULTIPLIERS.expanded,
        width: PADDLE_WIDTH * PADDLE_SIZE_MULTIPLIERS.expanded,
      };
      addActivePowerUp(gameSpecific, powerUpType, POWERUP_DURATION);
      break;

    case 'shrink':
      gameSpecific.paddle = {
        ...gameSpecific.paddle,
        sizeMultiplier: PADDLE_SIZE_MULTIPLIERS.shrunk,
        width: PADDLE_WIDTH * PADDLE_SIZE_MULTIPLIERS.shrunk,
      };
      addActivePowerUp(gameSpecific, powerUpType, POWERUP_DURATION);
      break;

    case 'multi-ball': {
      // Create 2 additional balls
      const mainBall = gameSpecific.balls[0];
      if (mainBall && !mainBall.isStuck) {
        const ball1 = createMultiBall(mainBall, 'ball-multi-1', -30);
        const ball2 = createMultiBall(mainBall, 'ball-multi-2', 30);
        gameSpecific.balls = [...gameSpecific.balls, ball1, ball2];
      }
      break;
    }

    case 'sticky':
      gameSpecific.paddle = {
        ...gameSpecific.paddle,
        isSticky: true,
      };
      addActivePowerUp(gameSpecific, powerUpType, POWERUP_DURATION);
      break;

    case 'laser':
      gameSpecific.paddle = {
        ...gameSpecific.paddle,
        hasLaser: true,
      };
      addActivePowerUp(gameSpecific, powerUpType, POWERUP_DURATION);
      break;

    case 'slow':
      gameSpecific.balls = gameSpecific.balls.map((ball) => ({
        ...ball,
        speedMultiplier: ball.speedMultiplier * 0.7,
        velocity: {
          vx: ball.velocity.vx * 0.7,
          vy: ball.velocity.vy * 0.7,
        },
      }));
      addActivePowerUp(gameSpecific, powerUpType, POWERUP_DURATION);
      break;

    case 'fast':
      gameSpecific.balls = gameSpecific.balls.map((ball) => ({
        ...ball,
        speedMultiplier: ball.speedMultiplier * 1.3,
        velocity: {
          vx: ball.velocity.vx * 1.3,
          vy: ball.velocity.vy * 1.3,
        },
      }));
      addActivePowerUp(gameSpecific, powerUpType, POWERUP_DURATION);
      break;

    case 'extra-life':
      gameSpecific.scoreState = {
        ...gameSpecific.scoreState,
        lives: gameSpecific.scoreState.lives + 1,
      };
      break;

    case 'points-2x':
      gameSpecific.scoreState = {
        ...gameSpecific.scoreState,
        multiplier: 2.0,
      };
      addActivePowerUp(gameSpecific, powerUpType, POWERUP_DURATION);
      break;

    case 'invincible':
      addActivePowerUp(gameSpecific, powerUpType, 10); // 10 second duration
      break;
  }

  return newState;
}

/**
 * Add active power-up effect.
 */
function addActivePowerUp(
  gameSpecific: NonNullable<BreakoutState['gameSpecific']>,
  type: PowerUpType,
  duration: number
) {
  // Remove existing effect of same type
  gameSpecific.activePowerUps = gameSpecific.activePowerUps.filter((p) => p.type !== type);

  // Add new effect
  gameSpecific.activePowerUps.push({
    type,
    timeRemaining: duration,
    duration,
  });
}

/**
 * Create multi-ball from existing ball.
 */
function createMultiBall(sourceBall: BallState, id: string, angleOffset: number): BallState {
  const angleOffsetRad = (angleOffset * Math.PI) / 180;
  const speed = Math.sqrt(sourceBall.velocity.vx ** 2 + sourceBall.velocity.vy ** 2);
  const currentAngle = Math.atan2(sourceBall.velocity.vy, sourceBall.velocity.vx);
  const newAngle = currentAngle + angleOffsetRad;

  return {
    ...sourceBall,
    id,
    velocity: {
      vx: Math.cos(newAngle) * speed,
      vy: Math.sin(newAngle) * speed,
    },
    trail: [],
  };
}

/**
 * Update active power-up timers.
 */
export function updateActivePowerUps(
  gameSpecific: NonNullable<BreakoutState['gameSpecific']>,
  deltaTime: number
): void {
  gameSpecific.activePowerUps = gameSpecific.activePowerUps
    .map((powerUp) => ({
      ...powerUp,
      timeRemaining: powerUp.timeRemaining - deltaTime,
    }))
    .filter((powerUp) => {
      if (powerUp.timeRemaining <= 0) {
        // Remove expired power-up effect
        removeExpiredPowerUp(gameSpecific, powerUp.type);
        return false;
      }
      return true;
    });
}

/**
 * Remove expired power-up effect.
 */
function removeExpiredPowerUp(
  gameSpecific: NonNullable<BreakoutState['gameSpecific']>,
  type: PowerUpType
): void {
  switch (type) {
    case 'expand':
    case 'shrink':
      gameSpecific.paddle = {
        ...gameSpecific.paddle,
        sizeMultiplier: 1.0,
        width: PADDLE_WIDTH,
      };
      break;

    case 'sticky':
      gameSpecific.paddle = {
        ...gameSpecific.paddle,
        isSticky: false,
      };
      break;

    case 'laser':
      gameSpecific.paddle = {
        ...gameSpecific.paddle,
        hasLaser: false,
      };
      break;

    case 'points-2x':
      gameSpecific.scoreState = {
        ...gameSpecific.scoreState,
        multiplier: 1.0,
      };
      break;
  }
}

// ============================================================================
// Laser Logic
// ============================================================================

/**
 * Fire laser from paddle.
 */
export function fireLaser(paddle: PaddleState, id: string): LaserState | null {
  if (!paddle.hasLaser || paddle.laserCooldown > 0) return null;

  return {
    id,
    position: {
      x: paddle.position.x + paddle.width / 2,
      y: paddle.position.y,
    },
    velocity: { vx: 0, vy: -LASER_SPEED },
    width: LASER_WIDTH,
    height: LASER_HEIGHT,
    isActive: true,
  };
}

/**
 * Update laser position.
 */
export function updateLaser(laser: LaserState, deltaTime: number): LaserState {
  if (!laser.isActive) return laser;

  const newLaser = { ...laser };
  newLaser.position.y += newLaser.velocity.vy * deltaTime;

  // Deactivate if off screen
  if (newLaser.position.y + newLaser.height < TOP_PADDING) {
    newLaser.isActive = false;
  }

  return newLaser;
}

/**
 * Check laser-brick collision.
 */
export function checkLaserBrickCollision(laser: LaserState, brick: BrickState): boolean {
  if (!laser.isActive || brick.isDestroyed) return false;

  const laserRect: Rect = {
    x: laser.position.x - laser.width / 2,
    y: laser.position.y - laser.height / 2,
    width: laser.width,
    height: laser.height,
  };

  const brickRect: Rect = {
    x: brick.position.x,
    y: brick.position.y,
    width: brick.width,
    height: brick.height,
  };

  return rectIntersect(laserRect, brickRect);
}

// ============================================================================
// Scoring Logic
// ============================================================================

/**
 * Add score for brick destruction.
 */
export function addScore(
  scoreState: NonNullable<BreakoutState['gameSpecific']>['scoreState'],
  brick: BrickState,
  combo: number
): NonNullable<BreakoutState['gameSpecific']>['scoreState'] {
  const basePoints = brick.points;
  const comboMultiplier = 1 + combo * 0.1; // 10% bonus per combo
  const totalPoints = Math.floor(basePoints * comboMultiplier * scoreState.multiplier);

  return {
    ...scoreState,
    score: scoreState.score + totalPoints,
    bricksDestroyed: scoreState.bricksDestroyed + 1,
    combo: combo + 1,
    bestCombo: Math.max(scoreState.bestCombo, combo + 1),
  };
}

/**
 * Reset combo.
 */
export function resetCombo(
  scoreState: NonNullable<BreakoutState['gameSpecific']>['scoreState']
): NonNullable<BreakoutState['gameSpecific']>['scoreState'] {
  return {
    ...scoreState,
    combo: 0,
  };
}

// ============================================================================
// Level Logic
// ============================================================================

/**
 * Check if level is complete.
 */
export function isLevelComplete(bricks: BrickState[]): boolean {
  return bricks.every((brick) => brick.isDestroyed || brick.type === 'unbreakable');
}

/**
 * Advance to next level.
 */
export function advanceToNextLevel(state: BreakoutState): BreakoutState {
  const newState = { ...state };
  if (!newState.gameSpecific) return newState;

  const nextLevel = newState.gameSpecific.scoreState.level + 1;
  const difficulty = newState.gameSpecific.difficulty;

  const levelConfig = createLevelConfig(nextLevel, difficulty);
  const bricks = createBrickGrid(levelConfig);

  newState.level = nextLevel;
  newState.gameSpecific = {
    ...newState.gameSpecific,
    levelConfig,
    bricks,
    balls: [createInitialBall(newState.gameSpecific.paddle, levelConfig.ballSpeed)],
    powerUps: [],
    activePowerUps: [],
    lasers: [],
    ballLaunched: false,
    levelComplete: false,
    scoreState: {
      ...newState.gameSpecific.scoreState,
      level: nextLevel,
      totalBricks: bricks.filter((b) => b.type !== 'unbreakable').length,
    },
  };

  return newState;
}

// ============================================================================
// Game State Logic
// ============================================================================

/**
 * Check if game is over.
 */
export function isGameOver(
  scoreState: NonNullable<BreakoutState['gameSpecific']>['scoreState']
): boolean {
  return scoreState.lives <= 0;
}

/**
 * Reset ball after life lost.
 */
export function resetAfterLifeLost(state: BreakoutState): BreakoutState {
  const newState = { ...state };
  if (!newState.gameSpecific) return newState;

  const paddle = newState.gameSpecific.paddle;
  const ballSpeed = newState.gameSpecific.levelConfig.ballSpeed;

  newState.gameSpecific = {
    ...newState.gameSpecific,
    balls: [createInitialBall(paddle, ballSpeed)],
    powerUps: [],
    activePowerUps: [],
    lasers: [],
    ballLaunched: false,
    paddle: {
      ...paddle,
      isSticky: false,
      hasLaser: false,
      sizeMultiplier: 1.0,
      width: PADDLE_WIDTH,
    },
    scoreState: {
      ...newState.gameSpecific.scoreState,
      lives: newState.gameSpecific.scoreState.lives - 1,
      combo: 0,
      multiplier: 1.0,
    },
  };

  return newState;
}
