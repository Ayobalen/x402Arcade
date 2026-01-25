/**
 * Breakout Game Component
 *
 * Main React component for the Breakout game.
 * Handles rendering, game loop, keyboard input, and UI overlays.
 *
 * @module games/breakout/BreakoutGame
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type {
  BreakoutState,
  BrickState,
  BallState,
  PaddleState,
  PowerUpState,
  LaserState,
  Particle,
} from './types';
import {
  initializeBreakoutState,
  updatePaddle,
  launchBall,
  updateBall,
  updatePowerUp,
  updateLaser,
  checkBallPaddleCollision,
  checkBallBrickCollision,
  checkBallWallCollision,
  checkPowerUpCollection,
  checkLaserBrickCollision,
  isBallLost,
  isLevelComplete,
  isGameOver,
  resetAfterLifeLost,
  advanceToNextLevel,
  fireLaser,
  applyPowerUpEffect,
  damageBrick,
  addScore,
  shouldDropPowerUp,
  createPowerUpDrop,
} from './logic';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  BREAKOUT_COLORS,
  FONTS,
  BRICK_COLORS,
  POWERUP_COLORS,
  POWERUP_ICONS,
  LASER_COLOR,
  getLevelPowerUpChance,
} from './constants';
import { useSFX } from '../../hooks/useSFX';
import {
  initializeBreakoutSounds,
  playBrickBreakSound,
  playBrickDamageSound,
  playPaddleHitSound,
  playWallBounceSound,
  playPowerUpDropSound,
  playPowerUpCollectSound,
  playLaserFireSound,
  playLaserHitSound,
  playBallLaunchSound,
  playBallLostSound,
  playLifeLostSound,
  playLevelCompleteSound,
  playGameOverSound,
  playComboSound,
} from './BreakoutSounds';

// ============================================================================
// Component Props
// ============================================================================

export interface BreakoutGameProps {
  /** Difficulty level */
  difficulty?: 'easy' | 'normal' | 'hard' | 'expert';
  /** Enable debug mode */
  debugMode?: boolean;
  /** Callback when game ends */
  onGameOver?: (score: number, level: number, sessionId: string) => void;
  /** Callback when user exits */
  onExit?: () => void;
  /** Session identifier */
  sessionId?: string;
  /** Enable score submission */
  enableScoreSubmission?: boolean;
}

// ============================================================================
// Particle System
// ============================================================================

/**
 * Creates particles for brick destruction effects.
 */
function createBrickParticles(brick: BrickState, count: number = 8): Particle[] {
  const particles: Particle[] = [];
  const color = BRICK_COLORS[brick.type];

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = 100 + Math.random() * 200;

    particles.push({
      id: `particle-${brick.id}-${i}`,
      position: {
        x: brick.position.x + brick.width / 2,
        y: brick.position.y + brick.height / 2,
      },
      velocity: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      },
      color,
      size: 3 + Math.random() * 3,
      lifetime: 0,
      maxLifetime: 0.5 + Math.random() * 0.5,
      isActive: true,
    });
  }

  return particles;
}

/**
 * Updates particle physics.
 */
function updateParticles(particles: Particle[], deltaTime: number): Particle[] {
  return particles
    .map((p) => ({
      ...p,
      position: {
        x: p.position.x + p.velocity.x * deltaTime,
        y: p.position.y + p.velocity.y * deltaTime,
      },
      velocity: {
        x: p.velocity.x * 0.95, // Damping
        y: p.velocity.y + 300 * deltaTime, // Gravity
      },
      lifetime: p.lifetime + deltaTime,
      isActive: p.lifetime + deltaTime < p.maxLifetime,
    }))
    .filter((p) => p.isActive);
}

// ============================================================================
// Canvas Rendering Functions
// ============================================================================

/**
 * Renders the game background.
 */
function renderBackground(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = BREAKOUT_COLORS.background;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
}

/**
 * Renders the game border.
 */
function renderBorder(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = BREAKOUT_COLORS.border;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, GAME_WIDTH - 2, GAME_HEIGHT - 2);
}

/**
 * Renders a brick with 3D effect.
 */
function renderBrick(ctx: CanvasRenderingContext2D, brick: BrickState): void {
  if (!brick.isActive) return;

  const color = BRICK_COLORS[brick.type];
  const { x, y } = brick.position;
  const { width, height } = brick;

  // Main brick body
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);

  // 3D highlight (top-left)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillRect(x, y, width, 2);
  ctx.fillRect(x, y, 2, height);

  // 3D shadow (bottom-right)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(x, y + height - 2, width, 2);
  ctx.fillRect(x + width - 2, y, 2, height);

  // HP indicator for multi-hit bricks
  if (brick.maxHp > 1) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '12px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(brick.hp.toString(), x + width / 2, y + height / 2);
  }
}

/**
 * Renders the paddle.
 */
function renderPaddle(ctx: CanvasRenderingContext2D, paddle: PaddleState, hasLaser: boolean): void {
  const color = hasLaser ? BREAKOUT_COLORS.paddleLaser : BREAKOUT_COLORS.paddle;
  const { x, y } = paddle.position;
  const { width, height } = paddle;

  // Glow effect
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;

  // Paddle body
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);

  // Reset glow
  ctx.shadowBlur = 0;

  // 3D highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillRect(x, y, width, 2);
}

/**
 * Renders a ball with trail effect.
 */
function renderBall(ctx: CanvasRenderingContext2D, ball: BallState, isInvincible: boolean): void {
  const color = isInvincible ? BREAKOUT_COLORS.ballInvincible : BREAKOUT_COLORS.ball;

  // Trail effect
  if (ball.trail && ball.trail.length > 0) {
    for (let i = 0; i < ball.trail.length; i++) {
      const trailPos = ball.trail[i];
      const alpha = ((i + 1) / ball.trail.length) * 0.3;
      ctx.fillStyle = BREAKOUT_COLORS.ballTrail.replace('0.3', alpha.toString());
      ctx.beginPath();
      ctx.arc(trailPos.x, trailPos.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Ball glow
  ctx.shadowColor = color;
  ctx.shadowBlur = 15;

  // Ball body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(ball.position.x, ball.position.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();

  // Reset glow
  ctx.shadowBlur = 0;
}

/**
 * Renders a power-up.
 */
function renderPowerUp(ctx: CanvasRenderingContext2D, powerUp: PowerUpState): void {
  const color = POWERUP_COLORS[powerUp.type];
  const icon = POWERUP_ICONS[powerUp.type];
  const { x, y } = powerUp.position;
  const { width, height } = powerUp;

  // Power-up box with glow
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
  ctx.shadowBlur = 0;

  // Icon
  ctx.fillStyle = '#000000';
  ctx.font = FONTS.powerup;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(icon, x + width / 2, y + height / 2);
}

/**
 * Renders a laser projectile.
 */
function renderLaser(ctx: CanvasRenderingContext2D, laser: LaserState): void {
  ctx.shadowColor = LASER_COLOR;
  ctx.shadowBlur = 8;
  ctx.fillStyle = LASER_COLOR;
  ctx.fillRect(laser.position.x, laser.position.y, laser.width, laser.height);
  ctx.shadowBlur = 0;
}

/**
 * Renders particles.
 */
function renderParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  particles.forEach((p) => {
    const alpha = 1 - p.lifetime / p.maxLifetime;
    ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
    ctx.beginPath();
    ctx.arc(p.position.x, p.position.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

/**
 * Renders the score and lives UI.
 */
function renderUI(ctx: CanvasRenderingContext2D, state: BreakoutState): void {
  const { score, lives, level, currentCombo, currentMultiplier } = state.gameSpecific;

  // Score (top-left)
  ctx.fillStyle = BREAKOUT_COLORS.text;
  ctx.font = FONTS.score;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`Score: ${score.points}`, 20, 20);

  // Level (top-center)
  ctx.textAlign = 'center';
  ctx.fillText(`Level ${level}`, GAME_WIDTH / 2, 20);

  // Lives (top-right)
  ctx.textAlign = 'right';
  ctx.fillText(`Lives: ${lives}`, GAME_WIDTH - 20, 20);

  // Combo indicator (if active)
  if (currentCombo > 1) {
    ctx.fillStyle = '#ffff00';
    ctx.font = FONTS.combo;
    ctx.textAlign = 'center';
    ctx.fillText(`Combo x${currentCombo} (${currentMultiplier}x points)`, GAME_WIDTH / 2, 60);
  }
}

/**
 * Renders an overlay (pause, game over, countdown).
 */
function renderOverlay(ctx: CanvasRenderingContext2D, message: string, submessage?: string): void {
  // Semi-transparent background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Main message
  ctx.fillStyle = BREAKOUT_COLORS.text;
  ctx.font = '48px JetBrains Mono, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(message, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30);

  // Submessage
  if (submessage) {
    ctx.font = '24px JetBrains Mono, monospace';
    ctx.fillStyle = BREAKOUT_COLORS.textMuted;
    ctx.fillText(submessage, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30);
  }
}

// ============================================================================
// Main Component
// ============================================================================

export const BreakoutGame: React.FC<BreakoutGameProps> = ({
  difficulty = 'normal',
  debugMode: _debugMode = false,
  onGameOver,
  onExit,
  sessionId = `breakout-${Date.now()}`,
  enableScoreSubmission: _enableScoreSubmission = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<BreakoutState>(() =>
    initializeBreakoutState({ difficulty })
  );
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(3);
  const [isGameOverState, setIsGameOverState] = useState(false);

  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // ============================================================================
  // Audio System
  // ============================================================================

  const sfx = useSFX();

  // Initialize Breakout sounds on mount
  useEffect(() => {
    initializeBreakoutSounds(sfx);
  }, [sfx]);

  // ============================================================================
  // Game Loop
  // ============================================================================

  const gameLoop = useCallback(() => {
    const now = performance.now();
    const deltaTime = Math.min((now - lastTimeRef.current) / 1000, 0.1); // Cap at 100ms
    lastTimeRef.current = now;

    if (isPaused || countdown !== null || isGameOverState) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    setGameState((prevState) => {
      let newState = { ...prevState };

      // Update paddle
      if (newState.gameSpecific.paddle.direction !== 'none') {
        newState.gameSpecific.paddle = updatePaddle(newState.gameSpecific.paddle, deltaTime);
      }

      // Update balls
      const updatedBalls: BallState[] = [];
      newState.gameSpecific.balls.forEach((ball) => {
        if (!ball.isActive) return;

        let updatedBall = updateBall(ball, deltaTime);

        // Check paddle collision
        const paddleCollision = checkBallPaddleCollision(updatedBall, newState.gameSpecific.paddle);
        if (paddleCollision.hasCollision) {
          updatedBall = paddleCollision.ball!;
          // Play paddle hit sound with velocity-based variation
          const ballSpeed = Math.sqrt(updatedBall.velocity.vx ** 2 + updatedBall.velocity.vy ** 2);
          playPaddleHitSound(sfx, ballSpeed);
        }

        // Check wall collisions
        const wallCollision = checkBallWallCollision(updatedBall);
        if (wallCollision.hasCollision) {
          updatedBall = wallCollision.ball!;
          // Play wall bounce sound
          playWallBounceSound(sfx);
        }

        // Check brick collisions
        newState.gameSpecific.bricks.forEach((brick) => {
          if (!brick.isActive) return;

          const brickCollision = checkBallBrickCollision(updatedBall, brick);
          if (brickCollision.hasCollision) {
            updatedBall = brickCollision.ball!;

            // Damage brick
            const damagedBrick = damageBrick(brick);
            const brickIndex = newState.gameSpecific.bricks.indexOf(brick);
            newState.gameSpecific.bricks[brickIndex] = damagedBrick;

            // Create particles and play sound if brick destroyed
            if (!damagedBrick.isActive) {
              setParticles((prev) => [...prev, ...createBrickParticles(brick)]);

              // Play brick break sound with type-specific variation
              playBrickBreakSound(sfx, brick.type);

              // Add score
              newState.gameSpecific.score = addScore(
                newState.gameSpecific.score,
                brick.points,
                newState.gameSpecific.currentMultiplier
              );

              // Play combo sound if applicable
              playComboSound(sfx, newState.gameSpecific.currentCombo);

              // Check if power-up should drop
              const powerUpChance = getLevelPowerUpChance(newState.gameSpecific.level);
              if (shouldDropPowerUp(brick, powerUpChance)) {
                const powerUpId = `powerup-${Date.now()}-${Math.random()}`;
                const powerUp = createPowerUpDrop(brick, powerUpId);
                newState.gameSpecific.powerUps.push(powerUp);

                // Play power-up drop sound
                playPowerUpDropSound(sfx);
              }
            } else {
              // Play brick damage sound (multi-hit brick damaged but not destroyed)
              playBrickDamageSound(sfx);
            }
          }
        });

        // Check if ball is lost
        if (isBallLost(updatedBall)) {
          updatedBall.isActive = false;
        } else {
          updatedBalls.push(updatedBall);
        }
      });

      newState.gameSpecific.balls = updatedBalls;

      // Check if all balls are lost
      if (newState.gameSpecific.balls.length === 0) {
        // Play ball lost sound
        playBallLostSound(sfx);

        const oldLives = newState.lives;
        newState = resetAfterLifeLost(newState);

        // Play life lost sound if a life was actually lost
        if (newState.lives < oldLives) {
          playLifeLostSound(sfx);
        }

        setCountdown(3);
      }

      // Update power-ups
      const updatedPowerUps: PowerUpState[] = [];
      newState.gameSpecific.powerUps.forEach((powerUp) => {
        if (!powerUp.isActive) return;

        const updated = updatePowerUp(powerUp, deltaTime);
        const collection = checkPowerUpCollection(updated, newState.gameSpecific.paddle);

        if (collection.hasCollision) {
          // Play power-up collection sound
          playPowerUpCollectSound(sfx, powerUp.type);
          // Apply power-up effect
          newState = applyPowerUpEffect(newState, powerUp.type);
        } else if (updated.position.y < GAME_HEIGHT + 50) {
          updatedPowerUps.push(updated);
        }
      });
      newState.gameSpecific.powerUps = updatedPowerUps;

      // Update lasers
      const updatedLasers: LaserState[] = [];
      newState.gameSpecific.lasers.forEach((laser) => {
        if (!laser.isActive) return;

        const updated = updateLaser(laser, deltaTime);

        // Check laser-brick collision
        let laserHit = false;
        newState.gameSpecific.bricks.forEach((brick) => {
          if (!brick.isActive || laserHit) return;

          const collision = checkLaserBrickCollision(updated, brick);
          if (collision.hasCollision) {
            laserHit = true;

            // Damage brick
            const damagedBrick = damageBrick(brick);
            const brickIndex = newState.gameSpecific.bricks.indexOf(brick);
            newState.gameSpecific.bricks[brickIndex] = damagedBrick;

            // Create particles if destroyed
            if (!damagedBrick.isActive) {
              setParticles((prev) => [...prev, ...createBrickParticles(brick)]);

              // Play laser hit and brick break sounds
              playLaserHitSound(sfx);
              playBrickBreakSound(sfx, brick.type);

              // Add score
              newState.gameSpecific.score = addScore(
                newState.gameSpecific.score,
                brick.points,
                newState.gameSpecific.currentMultiplier
              );

              // Play combo sound if applicable
              playComboSound(sfx, newState.gameSpecific.currentCombo);

              // Check if power-up should drop
              const powerUpChance = getLevelPowerUpChance(newState.gameSpecific.level);
              if (shouldDropPowerUp(brick, powerUpChance)) {
                const powerUpId = `powerup-laser-${Date.now()}-${Math.random()}`;
                const powerUp = createPowerUpDrop(brick, powerUpId);
                newState.gameSpecific.powerUps.push(powerUp);

                // Play power-up drop sound
                playPowerUpDropSound(sfx);
              }
            } else {
              // Play laser hit and brick damage sounds
              playLaserHitSound(sfx);
              playBrickDamageSound(sfx);
            }
          }
        });

        if (!laserHit && updated.position.y > 0) {
          updatedLasers.push(updated);
        }
      });
      newState.gameSpecific.lasers = updatedLasers;

      // Update laser cooldown
      if (newState.gameSpecific.laserCooldown > 0) {
        newState.gameSpecific.laserCooldown -= deltaTime;
      }

      // Check level complete
      if (isLevelComplete(newState)) {
        playLevelCompleteSound(sfx);
        newState = advanceToNextLevel(newState);
        setCountdown(3);
      }

      // Check game over
      if (isGameOver(newState)) {
        playGameOverSound(sfx);
        setIsGameOverState(true);
        if (onGameOver) {
          onGameOver(newState.gameSpecific.score.points, newState.gameSpecific.level, sessionId);
        }
      }

      return newState;
    });

    // Update particles
    setParticles((prev) => updateParticles(prev, deltaTime));

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [isPaused, countdown, isGameOverState, onGameOver, sessionId]);

  // ============================================================================
  // Effects
  // ============================================================================

  // Start game loop
  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameLoop]);

  // Countdown timer
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    const timer = setTimeout(() => {
      if (countdown === 1) {
        setCountdown(null);
      } else {
        setCountdown(countdown - 1);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          setGameState((prev) => ({
            ...prev,
            gameSpecific: {
              ...prev.gameSpecific,
              paddle: { ...prev.gameSpecific.paddle, direction: 'left' },
            },
          }));
          break;

        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          setGameState((prev) => ({
            ...prev,
            gameSpecific: {
              ...prev.gameSpecific,
              paddle: { ...prev.gameSpecific.paddle, direction: 'right' },
            },
          }));
          break;

        case ' ':
          e.preventDefault();
          if (countdown === null && !isPaused && !isGameOverState) {
            setGameState((prev) => {
              const ball = prev.gameSpecific.balls[0];
              if (ball && !ball.isLaunched) {
                // Play ball launch sound
                playBallLaunchSound(sfx);
                return {
                  ...prev,
                  gameSpecific: {
                    ...prev.gameSpecific,
                    balls: [launchBall(ball), ...prev.gameSpecific.balls.slice(1)],
                  },
                };
              }
              return prev;
            });
          }
          break;

        case 'f':
        case 'F':
          e.preventDefault();
          if (countdown === null && !isPaused && !isGameOverState) {
            setGameState((prev) => {
              if (prev.gameSpecific.hasLaser && prev.gameSpecific.laserCooldown <= 0) {
                // Play laser fire sound
                playLaserFireSound(sfx);
                const newLasers = fireLaser(prev.gameSpecific.paddle, prev.gameSpecific.lasers);
                return {
                  ...prev,
                  gameSpecific: {
                    ...prev.gameSpecific,
                    lasers: newLasers,
                    laserCooldown: 0.5,
                  },
                };
              }
              return prev;
            });
          }
          break;

        case 'p':
        case 'P':
          e.preventDefault();
          if (!isGameOverState && countdown === null) {
            setIsPaused((prev) => !prev);
          }
          break;

        case 'Escape':
          e.preventDefault();
          if (onExit) {
            onExit();
          }
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(e.key)) {
        e.preventDefault();
        setGameState((prev) => ({
          ...prev,
          gameSpecific: {
            ...prev.gameSpecific,
            paddle: { ...prev.gameSpecific.paddle, direction: 'none' },
          },
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [countdown, isPaused, isGameOverState, onExit]);

  // Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    renderBackground(ctx);
    renderBorder(ctx);

    // Render game objects
    gameState.gameSpecific.bricks.forEach((brick) => renderBrick(ctx, brick));
    renderPaddle(ctx, gameState.gameSpecific.paddle, gameState.gameSpecific.hasLaser);
    gameState.gameSpecific.balls.forEach((ball) =>
      renderBall(ctx, ball, gameState.gameSpecific.isInvincible)
    );
    gameState.gameSpecific.powerUps.forEach((powerUp) => renderPowerUp(ctx, powerUp));
    gameState.gameSpecific.lasers.forEach((laser) => renderLaser(ctx, laser));
    renderParticles(ctx, particles);

    // Render UI
    renderUI(ctx, gameState);

    // Render overlays
    if (countdown !== null && countdown > 0) {
      renderOverlay(ctx, countdown.toString());
    } else if (countdown === 0) {
      renderOverlay(ctx, 'GO!');
    } else if (isPaused) {
      renderOverlay(ctx, 'PAUSED', 'Press P to resume');
    } else if (isGameOverState) {
      renderOverlay(ctx, 'GAME OVER', `Final Score: ${gameState.gameSpecific.score.points}`);
    }
  }, [gameState, particles, countdown, isPaused, isGameOverState]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8">
      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        className="border-2 border-[#2D2D4A] rounded-lg shadow-2xl"
      />
      <div className="flex gap-4 text-sm text-[#94A3B8]">
        <span>← → or A/D: Move Paddle</span>
        <span>SPACE: Launch Ball</span>
        <span>F: Fire Laser</span>
        <span>P: Pause</span>
        <span>ESC: Exit</span>
      </div>
    </div>
  );
};

export default BreakoutGame;
