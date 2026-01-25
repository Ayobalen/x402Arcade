/**
 * Pong Game Logic
 *
 * This module implements the core game logic for Pong including:
 * - Physics engine (ball movement, collision detection)
 * - AI opponent logic
 * - Scoring system
 * - Win conditions
 *
 * @module games/pong/logic
 */

import type {
  Velocity,
  PaddleState,
  BallState,
  PongGameSpecificState,
  CollisionResult,
  PaddleSide,
  PaddleDirection,
  AIConfig,
  Rect,
  PlayerScore,
} from './types';
import type { GameInput } from '../types';
import {
  COURT_WIDTH,
  COURT_HEIGHT,
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  PADDLE_OFFSET,
  BALL_RADIUS,
  INITIAL_BALL_SPEED,
  MAX_BALL_SPEED,
  MIN_BALL_SPEED,
  SPEED_INCREASE_PER_HIT,
  MAX_SPEED_MULTIPLIER,
  BALL_SPIN_FACTOR,
  MAX_BOUNCE_ANGLE,
  WALL_BOUNCE_DAMPING,
  SERVE_DELAY,
  TARGET_SCORE,
  AI_CONFIGS,
  PADDLE_ACCELERATION,
  PADDLE_DECELERATION,
  MAX_PADDLE_VELOCITY,
} from './constants';

// ============================================================================
// State Initialization
// ============================================================================

/**
 * Create initial paddle state.
 */
export function createInitialPaddle(side: PaddleSide, isAI: boolean = false): PaddleState {
  const x = side === 'left' ? PADDLE_OFFSET : COURT_WIDTH - PADDLE_OFFSET - PADDLE_WIDTH;
  const y = (COURT_HEIGHT - PADDLE_HEIGHT) / 2;

  return {
    side,
    position: { x, y },
    velocity: { vx: 0, vy: 0 },
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    isAI,
    targetY: y + PADDLE_HEIGHT / 2,
  };
}

/**
 * Create initial ball state.
 */
export function createInitialBall(): BallState {
  return {
    position: {
      x: COURT_WIDTH / 2,
      y: COURT_HEIGHT / 2,
    },
    velocity: { vx: 0, vy: 0 },
    radius: BALL_RADIUS,
    speedMultiplier: 1.0,
    rallyCount: 0,
  };
}

/**
 * Create initial player score.
 */
export function createInitialScore(side: PaddleSide): PlayerScore {
  return {
    side,
    score: 0,
    ralliesWon: 0,
    totalHits: 0,
    longestRally: 0,
  };
}

/**
 * Create initial pong-specific game state.
 */
export function createInitialPongState(
  mode: 'single-player' | 'two-player' = 'single-player'
): PongGameSpecificState {
  return {
    leftPaddle: createInitialPaddle('left', false),
    rightPaddle: createInitialPaddle('right', mode === 'single-player'),
    ball: createInitialBall(),
    leftScore: createInitialScore('left'),
    rightScore: createInitialScore('right'),
    winCondition: {
      targetScore: TARGET_SCORE,
      hasWinner: false,
    },
    aiConfig: mode === 'single-player' ? AI_CONFIGS.normal : undefined,
    difficulty: 'normal',
    courtWidth: COURT_WIDTH,
    courtHeight: COURT_HEIGHT,
    serveDirection: Math.random() < 0.5 ? 'left' : 'right',
    ballInPlay: false,
    serveDelayRemaining: SERVE_DELAY,
    currentRally: 0,
    mode,
  };
}

// ============================================================================
// Physics - Ball Movement
// ============================================================================

/**
 * Update ball position based on velocity.
 */
export function updateBallPosition(ball: BallState, deltaTime: number): BallState {
  return {
    ...ball,
    position: {
      x: ball.position.x + ball.velocity.vx * deltaTime,
      y: ball.position.y + ball.velocity.vy * deltaTime,
    },
  };
}

/**
 * Serve the ball in a random direction.
 */
export function serveBall(ball: BallState, direction: PaddleSide): BallState {
  // Random angle between -30 and 30 degrees
  const angle = ((Math.random() - 0.5) * Math.PI) / 3;
  const speed = INITIAL_BALL_SPEED;

  // Serve towards the specified side
  const directionMultiplier = direction === 'right' ? 1 : -1;

  return {
    ...ball,
    velocity: {
      vx: Math.cos(angle) * speed * directionMultiplier,
      vy: Math.sin(angle) * speed,
    },
    speedMultiplier: 1.0,
    rallyCount: 0,
    lastHitBy: undefined,
  };
}

/**
 * Reset ball to center without velocity.
 */
export function resetBall(ball: BallState): BallState {
  return {
    ...ball,
    position: {
      x: COURT_WIDTH / 2,
      y: COURT_HEIGHT / 2,
    },
    velocity: { vx: 0, vy: 0 },
    speedMultiplier: 1.0,
    rallyCount: 0,
    lastHitBy: undefined,
  };
}

/**
 * Increase ball speed after paddle hit.
 */
export function increaseBallSpeed(ball: BallState): BallState {
  const newMultiplier = Math.min(
    ball.speedMultiplier + SPEED_INCREASE_PER_HIT,
    MAX_SPEED_MULTIPLIER
  );

  const currentSpeed = Math.sqrt(ball.velocity.vx ** 2 + ball.velocity.vy ** 2);
  const newSpeed = Math.min(currentSpeed * (newMultiplier / ball.speedMultiplier), MAX_BALL_SPEED);

  // Preserve direction, update speed
  const angle = Math.atan2(ball.velocity.vy, ball.velocity.vx);

  return {
    ...ball,
    velocity: {
      vx: Math.cos(angle) * newSpeed,
      vy: Math.sin(angle) * newSpeed,
    },
    speedMultiplier: newMultiplier,
  };
}

// ============================================================================
// Physics - Paddle Movement
// ============================================================================

/**
 * Update paddle position based on input direction.
 */
export function updatePaddlePosition(
  paddle: PaddleState,
  direction: PaddleDirection,
  deltaTime: number
): PaddleState {
  let newVelocity = paddle.velocity.vy;

  // Apply acceleration based on direction
  if (direction === 'up') {
    newVelocity -= PADDLE_ACCELERATION * deltaTime;
  } else if (direction === 'down') {
    newVelocity += PADDLE_ACCELERATION * deltaTime;
  } else {
    // Apply deceleration (friction) when no input
    if (Math.abs(newVelocity) > 0) {
      const deceleration = PADDLE_DECELERATION * deltaTime;
      if (Math.abs(newVelocity) <= deceleration) {
        newVelocity = 0;
      } else {
        newVelocity -= Math.sign(newVelocity) * deceleration;
      }
    }
  }

  // Clamp velocity to max
  newVelocity = Math.max(-MAX_PADDLE_VELOCITY, Math.min(MAX_PADDLE_VELOCITY, newVelocity));

  // Update position
  let newY = paddle.position.y + newVelocity * deltaTime;

  // Clamp position to court bounds
  newY = Math.max(0, Math.min(COURT_HEIGHT - paddle.height, newY));

  return {
    ...paddle,
    position: {
      ...paddle.position,
      y: newY,
    },
    velocity: {
      ...paddle.velocity,
      vy: newVelocity,
    },
  };
}

/**
 * Move paddle towards target Y position (for AI).
 */
export function movePaddleToTarget(
  paddle: PaddleState,
  targetY: number,
  speedMultiplier: number,
  deltaTime: number
): PaddleState {
  const paddleCenter = paddle.position.y + paddle.height / 2;
  const diff = targetY - paddleCenter;

  // Determine direction
  let direction: PaddleDirection = 'none';
  const threshold = 5; // Dead zone to prevent jittering

  if (Math.abs(diff) > threshold) {
    direction = diff > 0 ? 'down' : 'up';
  }

  // Update paddle position
  let newPaddle = updatePaddlePosition(paddle, direction, deltaTime);

  // Scale velocity by speed multiplier
  newPaddle = {
    ...newPaddle,
    velocity: {
      ...newPaddle.velocity,
      vy: newPaddle.velocity.vy * speedMultiplier,
    },
  };

  return {
    ...newPaddle,
    targetY,
  };
}

// ============================================================================
// Collision Detection
// ============================================================================

/**
 * Check if ball collides with rectangle (paddle).
 */
export function checkBallPaddleCollision(ball: BallState, paddle: PaddleState): boolean {
  const rect: Rect = {
    x: paddle.position.x,
    y: paddle.position.y,
    width: paddle.width,
    height: paddle.height,
  };

  // Find closest point on rectangle to ball center
  const closestX = Math.max(rect.x, Math.min(ball.position.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(ball.position.y, rect.y + rect.height));

  // Calculate distance
  const distanceX = ball.position.x - closestX;
  const distanceY = ball.position.y - closestY;
  const distanceSquared = distanceX ** 2 + distanceY ** 2;

  return distanceSquared < ball.radius ** 2;
}

/**
 * Check if ball collides with top or bottom wall.
 */
export function checkBallWallCollision(ball: BallState): 'top' | 'bottom' | null {
  if (ball.position.y - ball.radius <= 0) {
    return 'top';
  }
  if (ball.position.y + ball.radius >= COURT_HEIGHT) {
    return 'bottom';
  }
  return null;
}

/**
 * Check if ball went past paddle (goal scored).
 */
export function checkGoal(ball: BallState): PaddleSide | null {
  if (ball.position.x - ball.radius <= 0) {
    return 'left'; // Right player scored
  }
  if (ball.position.x + ball.radius >= COURT_WIDTH) {
    return 'right'; // Left player scored
  }
  return null;
}

/**
 * Detect all collisions for current ball state.
 */
export function detectCollisions(
  ball: BallState,
  leftPaddle: PaddleState,
  rightPaddle: PaddleState
): CollisionResult {
  // Check paddle collisions
  if (checkBallPaddleCollision(ball, leftPaddle) && ball.velocity.vx < 0) {
    return {
      type: 'paddle-left',
      position: { x: leftPaddle.position.x + leftPaddle.width, y: ball.position.y },
    };
  }

  if (checkBallPaddleCollision(ball, rightPaddle) && ball.velocity.vx > 0) {
    return {
      type: 'paddle-right',
      position: { x: rightPaddle.position.x, y: ball.position.y },
    };
  }

  // Check wall collisions
  const wallHit = checkBallWallCollision(ball);
  if (wallHit === 'top') {
    return {
      type: 'wall-top',
      position: { x: ball.position.x, y: 0 },
    };
  }
  if (wallHit === 'bottom') {
    return {
      type: 'wall-bottom',
      position: { x: ball.position.x, y: COURT_HEIGHT },
    };
  }

  // Check goals
  const goal = checkGoal(ball);
  if (goal === 'left') {
    return { type: 'goal-left', position: { x: 0, y: ball.position.y } };
  }
  if (goal === 'right') {
    return { type: 'goal-right', position: { x: COURT_WIDTH, y: ball.position.y } };
  }

  return { type: 'none' };
}

// ============================================================================
// Collision Response
// ============================================================================

/**
 * Handle paddle collision (bounce ball and add spin).
 */
export function handlePaddleCollision(ball: BallState, paddle: PaddleState): BallState {
  // Calculate hit position on paddle (0 = top, 1 = bottom)
  const hitY = ball.position.y - paddle.position.y;
  const relativeHitY = hitY / paddle.height; // 0 to 1
  const normalizedHitY = (relativeHitY - 0.5) * 2; // -1 to 1

  // Calculate bounce angle based on hit position
  const bounceAngle = normalizedHitY * ((MAX_BOUNCE_ANGLE * Math.PI) / 180);

  // Get current speed
  const currentSpeed = Math.sqrt(ball.velocity.vx ** 2 + ball.velocity.vy ** 2);

  // Determine horizontal direction (flip)
  const directionX = paddle.side === 'left' ? 1 : -1;

  // Apply spin based on paddle velocity
  const spinEffect = paddle.velocity.vy * BALL_SPIN_FACTOR;

  // Calculate new velocity
  const newVelocity: Velocity = {
    vx: Math.cos(bounceAngle) * currentSpeed * directionX,
    vy: Math.sin(bounceAngle) * currentSpeed + spinEffect,
  };

  // Ensure minimum speed
  const newSpeed = Math.sqrt(newVelocity.vx ** 2 + newVelocity.vy ** 2);
  if (newSpeed < MIN_BALL_SPEED) {
    const scale = MIN_BALL_SPEED / newSpeed;
    newVelocity.vx *= scale;
    newVelocity.vy *= scale;
  }

  return {
    ...ball,
    velocity: newVelocity,
    rallyCount: ball.rallyCount + 1,
    lastHitBy: paddle.side,
  };
}

/**
 * Handle wall collision (bounce ball vertically).
 */
export function handleWallCollision(ball: BallState, wall: 'top' | 'bottom'): BallState {
  return {
    ...ball,
    velocity: {
      vx: ball.velocity.vx,
      vy: -ball.velocity.vy * WALL_BOUNCE_DAMPING,
    },
    position: {
      x: ball.position.x,
      y: wall === 'top' ? ball.radius : COURT_HEIGHT - ball.radius,
    },
  };
}

// ============================================================================
// AI Logic
// ============================================================================

/**
 * Predict where ball will intersect with AI paddle's x-position.
 */
export function predictBallY(ball: BallState, paddleX: number, aiConfig: AIConfig): number {
  // Simple linear prediction
  if (ball.velocity.vx === 0) {
    return ball.position.y;
  }

  // Calculate time to reach paddle
  const timeToReach = Math.abs((paddleX - ball.position.x) / ball.velocity.vx);

  // Predict Y position (accounting for wall bounces is complex, simplified here)
  let predictedY = ball.position.y + ball.velocity.vy * timeToReach;

  // Apply prediction accuracy (add random error)
  const error = (Math.random() - 0.5) * aiConfig.errorMargin * 2;
  predictedY += error * (1 - aiConfig.predictionAccuracy);

  // Handle wall bounces (simplified - single bounce)
  if (predictedY < 0) {
    predictedY = -predictedY;
  } else if (predictedY > COURT_HEIGHT) {
    predictedY = COURT_HEIGHT - (predictedY - COURT_HEIGHT);
  }

  // Clamp to court bounds
  predictedY = Math.max(ball.radius, Math.min(COURT_HEIGHT - ball.radius, predictedY));

  // Apply intentional mistake
  if (aiConfig.makeMistakes && Math.random() < aiConfig.mistakeChance) {
    // Make AI aim poorly
    predictedY += (Math.random() - 0.5) * PADDLE_HEIGHT;
  }

  return predictedY;
}

/**
 * Update AI paddle to track the ball.
 */
export function updateAI(
  paddle: PaddleState,
  ball: BallState,
  ballInPlay: boolean,
  aiConfig: AIConfig,
  deltaTime: number
): PaddleState {
  if (!ballInPlay) {
    // Return to center when ball not in play
    const targetY = COURT_HEIGHT / 2;
    return movePaddleToTarget(paddle, targetY, aiConfig.speedMultiplier * 0.5, deltaTime);
  }

  // Only track ball if it's moving towards AI
  const ballMovingTowardsAI =
    (paddle.side === 'left' && ball.velocity.vx < 0) ||
    (paddle.side === 'right' && ball.velocity.vx > 0);

  if (!ballMovingTowardsAI) {
    // Return to center
    const targetY = COURT_HEIGHT / 2;
    return movePaddleToTarget(paddle, targetY, aiConfig.speedMultiplier * 0.5, deltaTime);
  }

  // Predict ball position
  const paddleX = paddle.side === 'left' ? paddle.position.x + paddle.width : paddle.position.x;

  const predictedY = predictBallY(ball, paddleX, aiConfig);

  // Move paddle towards predicted position
  return movePaddleToTarget(paddle, predictedY, aiConfig.speedMultiplier, deltaTime);
}

// ============================================================================
// Scoring
// ============================================================================

/**
 * Update score after goal.
 */
export function updateScore(score: PlayerScore, currentRally: number): PlayerScore {
  return {
    ...score,
    score: score.score + 1,
    ralliesWon: score.ralliesWon + 1,
    longestRally: Math.max(score.longestRally, currentRally),
  };
}

/**
 * Update paddle hit count.
 */
export function updateHitCount(score: PlayerScore): PlayerScore {
  return {
    ...score,
    totalHits: score.totalHits + 1,
  };
}

/**
 * Check if a player has won.
 */
export function checkWinCondition(
  leftScore: PlayerScore,
  rightScore: PlayerScore,
  targetScore: number
): { hasWinner: boolean; winner?: PaddleSide; targetScore: number } {
  if (leftScore.score >= targetScore) {
    return { hasWinner: true, winner: 'left', targetScore };
  }
  if (rightScore.score >= targetScore) {
    return { hasWinner: true, winner: 'right', targetScore };
  }
  return { hasWinner: false, targetScore };
}

// ============================================================================
// Game State Updates
// ============================================================================

/**
 * Update game state for one frame.
 */
export function updateGameState(
  state: PongGameSpecificState,
  input: GameInput,
  deltaTime: number
): PongGameSpecificState {
  const newState = { ...state };

  // Handle serve delay
  if (!newState.ballInPlay) {
    newState.serveDelayRemaining -= deltaTime;
    if (newState.serveDelayRemaining <= 0) {
      // Serve ball
      newState.ball = serveBall(newState.ball, newState.serveDirection);
      newState.ballInPlay = true;
      newState.currentRally = 0;
    }
    return newState;
  }

  // Update paddles
  const leftDirection: PaddleDirection = input.directions.has('up')
    ? 'up'
    : input.directions.has('down')
      ? 'down'
      : 'none';

  newState.leftPaddle = updatePaddlePosition(newState.leftPaddle, leftDirection, deltaTime);

  // Update right paddle (AI or player 2)
  if (newState.rightPaddle.isAI && newState.aiConfig) {
    newState.rightPaddle = updateAI(
      newState.rightPaddle,
      newState.ball,
      newState.ballInPlay,
      newState.aiConfig,
      deltaTime
    );
  } else {
    // Player 2 controls (W/S keys mapped to same input for now)
    const rightDirection: PaddleDirection = input.secondaryAction
      ? 'up'
      : input.action
        ? 'down'
        : 'none';
    newState.rightPaddle = updatePaddlePosition(newState.rightPaddle, rightDirection, deltaTime);
  }

  // Update ball
  newState.ball = updateBallPosition(newState.ball, deltaTime);

  // Detect collisions
  const collision = detectCollisions(newState.ball, newState.leftPaddle, newState.rightPaddle);
  newState.lastCollision = collision;

  // Handle collisions
  if (collision.type === 'paddle-left') {
    newState.ball = handlePaddleCollision(newState.ball, newState.leftPaddle);
    newState.ball = increaseBallSpeed(newState.ball);
    newState.leftScore = updateHitCount(newState.leftScore);
    newState.currentRally = newState.ball.rallyCount;
  } else if (collision.type === 'paddle-right') {
    newState.ball = handlePaddleCollision(newState.ball, newState.rightPaddle);
    newState.ball = increaseBallSpeed(newState.ball);
    newState.rightScore = updateHitCount(newState.rightScore);
    newState.currentRally = newState.ball.rallyCount;
  } else if (collision.type === 'wall-top') {
    newState.ball = handleWallCollision(newState.ball, 'top');
  } else if (collision.type === 'wall-bottom') {
    newState.ball = handleWallCollision(newState.ball, 'bottom');
  } else if (collision.type === 'goal-left') {
    // Right player scored
    newState.rightScore = updateScore(newState.rightScore, newState.currentRally);
    newState.ball = resetBall(newState.ball);
    newState.ballInPlay = false;
    newState.serveDelayRemaining = SERVE_DELAY;
    newState.serveDirection = 'left'; // Loser serves
  } else if (collision.type === 'goal-right') {
    // Left player scored
    newState.leftScore = updateScore(newState.leftScore, newState.currentRally);
    newState.ball = resetBall(newState.ball);
    newState.ballInPlay = false;
    newState.serveDelayRemaining = SERVE_DELAY;
    newState.serveDirection = 'right'; // Loser serves
  }

  // Check win condition
  newState.winCondition = checkWinCondition(
    newState.leftScore,
    newState.rightScore,
    newState.winCondition.targetScore
  );

  return newState;
}

// ============================================================================
// Exports
// ============================================================================

export default {
  createInitialPongState,
  updateGameState,
  serveBall,
  resetBall,
  updateAI,
  detectCollisions,
  checkWinCondition,
};
