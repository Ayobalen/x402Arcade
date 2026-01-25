/**
 * useBreakoutGame Hook
 *
 * Custom React hook for managing Breakout game state and lifecycle.
 * Properly orchestrates all game logic functions.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import type { BreakoutState } from './types';
import type { BreakoutDifficulty } from './constants';
import {
  initializeBreakoutState,
  updatePaddle,
  updateBall,
  checkBallPaddleCollision,
  checkBallWallCollision,
  checkBallBrickCollision,
  checkLaserBrickCollision,
  isBallLost,
  damageBrick,
  isLevelComplete,
  advanceToNextLevel,
  resetAfterLifeLost,
  updatePowerUp,
  checkPowerUpCollection,
  applyPowerUpEffect,
  updateActivePowerUps,
  fireLaser,
  updateLaser,
  reflectBall,
  increaseBallSpeed,
  shouldDropPowerUp,
  createPowerUpDrop,
  resetCombo,
} from './logic';
import { GAME_HEIGHT, getLevelPowerUpChance, POWERUP_DROP_CHANCE } from './constants';
import { useSFX } from '../../hooks/useSFX';
import {
  initializeBreakoutSounds,
  playBrickBreakSound,
  playPaddleHitSound,
  playWallBounceSound,
  playPowerUpCollectSound,
  playLaserFireSound,
  playLevelCompleteSound,
  playBallLostSound,
  playGameOverSound,
} from './BreakoutSounds';

// ============================================================================
// Hook Interface
// ============================================================================

export interface UseBreakoutGameOptions {
  onGameOver?: (score: number, level: number, sessionId?: string) => void;
  difficulty?: BreakoutDifficulty;
}

export interface UseBreakoutGameReturn {
  state: BreakoutState;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  context: CanvasRenderingContext2D | null;
  start: () => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  sessionId: string | undefined;
  isActive: boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useBreakoutGame(options: UseBreakoutGameOptions = {}): UseBreakoutGameReturn {
  const { onGameOver, difficulty = 'normal' } = options;

  // State
  const [state, setState] = useState<BreakoutState>(() => {
    const initialState = initializeBreakoutState(difficulty);
    return {
      ...initialState,
      gameSpecific: {
        ...initialState.gameSpecific!,
        sessionId: crypto.randomUUID(),
      },
    };
  });

  const [countdown, setCountdown] = useState(3);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const lastTimeRef = useRef<number>(0);
  const gameOverCalledRef = useRef(false);

  // Audio
  const sfx = useSFX();

  useEffect(() => {
    initializeBreakoutSounds(sfx);
  }, [sfx]);

  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      setContext(ctx);
    }
  }, []);

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Prevent default for game keys
      if (
        key === ' ' ||
        key === 'arrowleft' ||
        key === 'arrowright' ||
        key === 'a' ||
        key === 'd' ||
        key === 'p'
      ) {
        e.preventDefault();
      }

      // Handle start with space
      if (key === ' ' && !state.isPlaying) {
        setState((prev) => ({
          ...prev,
          isPlaying: true,
          isPaused: false,
          isGameOver: false,
          startTime: Date.now(),
        }));
        setCountdown(3);
        lastTimeRef.current = 0;
        return;
      }

      // Handle pause with P
      if (key === 'p' && state.isPlaying && !state.isGameOver) {
        setState((prev) => ({
          ...prev,
          isPaused: !prev.isPaused,
        }));
        if (state.isPaused) {
          lastTimeRef.current = 0;
        }
        return;
      }

      if (!state.isPlaying || state.isPaused) return;

      if (key === 'arrowleft' || key === 'a') {
        setState((prev) => {
          if (!prev.gameSpecific) return prev;
          return {
            ...prev,
            gameSpecific: {
              ...prev.gameSpecific,
              paddle: updatePaddle(prev.gameSpecific.paddle, 'left', 0.016),
            },
          };
        });
      } else if (key === 'arrowright' || key === 'd') {
        setState((prev) => {
          if (!prev.gameSpecific) return prev;
          return {
            ...prev,
            gameSpecific: {
              ...prev.gameSpecific,
              paddle: updatePaddle(prev.gameSpecific.paddle, 'right', 0.016),
            },
          };
        });
      } else if (key === ' ') {
        // Launch ball or fire laser
        setState((prev) => {
          if (!prev.gameSpecific) return prev;
          const { balls, paddle } = prev.gameSpecific;

          // Check if any ball is stuck
          const stuckBall = balls.find((b) => b.isStuck);
          if (stuckBall) {
            // Launch stuck ball
            const newBalls = balls.map((b) =>
              b.isStuck ? { ...b, isStuck: false, velocity: { vx: 0, vy: -400 } } : b
            );
            return {
              ...prev,
              gameSpecific: {
                ...prev.gameSpecific,
                balls: newBalls,
              },
            };
          }

          // Try to fire laser
          if (paddle.hasLaser) {
            const laser = fireLaser(paddle, `laser-${Date.now()}`);
            if (laser) {
              playLaserFireSound(sfx);
              return {
                ...prev,
                gameSpecific: {
                  ...prev.gameSpecific,
                  lasers: [...prev.gameSpecific.lasers, laser],
                },
              };
            }
          }

          return prev;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isPlaying, state.isPaused, state.isGameOver, sfx]);

  // Game loop
  useEffect(() => {
    if (!state.isPlaying || state.isPaused || countdown > 0) {
      return;
    }

    let animationId: number;

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }

      const deltaTime = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      setState((prev) => {
        if (!prev.gameSpecific) return prev;

        let newState = { ...prev };
        const gameSpecific = { ...prev.gameSpecific };

        // Update balls
        const updatedBalls: BallState[] = [];
        for (const ball of gameSpecific.balls) {
          let updatedBall = updateBall(ball, gameSpecific.paddle, deltaTime);

          // Check paddle collision
          const paddleCollision = checkBallPaddleCollision(updatedBall, gameSpecific.paddle);
          if (paddleCollision) {
            updatedBall = reflectBall(updatedBall, paddleCollision.normal!);
            playPaddleHitSound(sfx, 1.0);
          }

          // Check wall collision
          const wallCollision = checkBallWallCollision(updatedBall);
          if (wallCollision) {
            updatedBall = reflectBall(updatedBall, wallCollision.normal!);
            playWallBounceSound(sfx);
          }

          // Check brick collisions
          for (let i = 0; i < gameSpecific.bricks.length; i++) {
            const brick = gameSpecific.bricks[i];
            if (brick.isDestroyed) continue;

            const brickCollision = checkBallBrickCollision(updatedBall, brick);
            if (brickCollision) {
              updatedBall = reflectBall(updatedBall, brickCollision.normal!);
              updatedBall = increaseBallSpeed(updatedBall);

              // Damage brick
              const damagedBrick = damageBrick(brick);
              gameSpecific.bricks[i] = damagedBrick;

              if (damagedBrick.isDestroyed) {
                playBrickBreakSound(sfx, brick.type);

                // Update score
                newState.score += brick.points;

                // Maybe drop power-up
                const powerUpChance = getLevelPowerUpChance(newState.level, POWERUP_DROP_CHANCE);
                if (shouldDropPowerUp(brick, powerUpChance)) {
                  const powerUp = createPowerUpDrop(brick, `powerup-${Date.now()}`);
                  gameSpecific.powerUps.push(powerUp);
                }
              }

              break; // Only one brick collision per frame
            }
          }

          // Check if ball is lost
          if (isBallLost(updatedBall)) {
            playBallLostSound(sfx);
            continue; // Don't add lost balls
          }

          updatedBalls.push(updatedBall);
        }

        gameSpecific.balls = updatedBalls.length > 0 ? updatedBalls : gameSpecific.balls;

        // Update power-ups
        const updatedPowerUps = [];
        for (const powerUp of gameSpecific.powerUps) {
          const updated = updatePowerUp(powerUp, deltaTime);

          if (checkPowerUpCollection(updated, gameSpecific.paddle)) {
            playPowerUpCollectSound(sfx);
            newState = applyPowerUpEffect(newState, updated.type);
          } else if (updated.position.y < GAME_HEIGHT + 50) {
            updatedPowerUps.push(updated);
          }
        }
        gameSpecific.powerUps = updatedPowerUps;

        // Update active power-ups (modifies gameSpecific in place)
        updateActivePowerUps(gameSpecific, deltaTime);

        // Update lasers
        const updatedLasers = [];
        for (const laser of gameSpecific.lasers) {
          const updated = updateLaser(laser, deltaTime);
          let hit = false;

          for (let i = 0; i < gameSpecific.bricks.length; i++) {
            const brick = gameSpecific.bricks[i];
            if (brick.isDestroyed) continue;

            if (checkLaserBrickCollision(updated, brick)) {
              const damagedBrick = damageBrick(brick);
              gameSpecific.bricks[i] = damagedBrick;

              if (damagedBrick.isDestroyed) {
                playBrickBreakSound(sfx, brick.type);
                newState.score += brick.points;
              }

              hit = true;
              break;
            }
          }

          if (!hit && updated.position.y > 0) {
            updatedLasers.push(updated);
          }
        }
        gameSpecific.lasers = updatedLasers;

        // Update combo timer
        gameSpecific.scoreState = resetCombo(gameSpecific.scoreState, deltaTime);

        // Check if all balls lost
        if (gameSpecific.balls.length === 0 || gameSpecific.balls.every((b) => isBallLost(b))) {
          newState.lives -= 1;
          if (newState.lives <= 0) {
            newState.isGameOver = true;
            newState.isPlaying = false;
            playGameOverSound(sfx);
          } else {
            newState = resetAfterLifeLost(newState);
          }
        }

        // Check level complete
        if (isLevelComplete(gameSpecific.bricks)) {
          playLevelCompleteSound(sfx);
          newState = advanceToNextLevel(newState);
          setCountdown(3);
        }

        newState.gameSpecific = gameSpecific;
        return newState;
      });

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [state.isPlaying, state.isPaused, countdown, sfx]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0 && state.isPlaying) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, state.isPlaying]);

  // Game over callback
  useEffect(() => {
    if (state.isGameOver && onGameOver && !gameOverCalledRef.current) {
      gameOverCalledRef.current = true;
      onGameOver(state.score, state.level, state.gameSpecific?.sessionId);
    }

    if (!state.isGameOver) {
      gameOverCalledRef.current = false;
    }
  }, [state.isGameOver, state.score, state.level, state.gameSpecific?.sessionId, onGameOver]);

  // Control methods
  const start = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isPlaying: true,
      isPaused: false,
      isGameOver: false,
      startTime: Date.now(),
    }));
    setCountdown(3);
    lastTimeRef.current = 0;
  }, []);

  const pause = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isPaused: true,
    }));
  }, []);

  const resume = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isPaused: false,
    }));
    lastTimeRef.current = 0;
  }, []);

  const restart = useCallback(() => {
    const initialState = initializeBreakoutState(difficulty);
    setState({
      ...initialState,
      gameSpecific: {
        ...initialState.gameSpecific!,
        sessionId: crypto.randomUUID(),
      },
      isPlaying: true,
    });
    setCountdown(3);
    gameOverCalledRef.current = false;
    lastTimeRef.current = 0;
  }, [difficulty]);

  return {
    state,
    canvasRef,
    context,
    start,
    pause,
    resume,
    restart,
    sessionId: state.gameSpecific?.sessionId,
    isActive: state.isPlaying && !state.isPaused && !state.isGameOver,
  };
}

export default useBreakoutGame;
