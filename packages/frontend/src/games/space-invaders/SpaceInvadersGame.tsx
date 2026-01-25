/**
 * Space Invaders Game Component
 *
 * Main React component for the Space Invaders game.
 * Handles rendering, game loop, keyboard input, and UI overlays.
 *
 * @module games/space-invaders/SpaceInvadersGame
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { GameState } from '../types';
import type {
  SpaceInvadersGameSpecific,
  PlayerState,
  AlienState,
  BulletState,
  UFOState,
  ShieldState,
  Particle,
  PlayerDirection,
} from './types';
import {
  initSpaceInvadersState,
  updatePlayerMovement,
  playerShoot,
  updatePlayerTimers,
  updateFormationMovement,
  alienShoot,
  updateAlienExplosions,
  updateBullets,
  updateUFOSpawning,
  updateUFOMovement,
  updateUFOExplosion,
  updateShieldHealth,
  checkBulletAlienCollisions,
  checkBulletUFOCollisions,
  checkBulletShieldCollisions,
  checkBulletPlayerCollisions,
  updateCombo,
  handlePlayerDeath,
  isWaveComplete,
  isGameOver as checkGameOver,
  advanceWave,
  updateParticles,
  getDifficultyConfig,
} from './logic';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  COLOR_PLAYER,
  COLOR_ALIEN_SQUID,
  COLOR_ALIEN_CRAB,
  COLOR_ALIEN_OCTOPUS,
  COLOR_UFO,
  COLOR_PLAYER_BULLET,
  COLOR_ALIEN_BULLET,
  COLOR_BACKGROUND,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  PLAYER_WIDTH,
  ALIEN_WIDTH,
  UFO_WIDTH,
} from './constants';
import type { SpaceInvadersDifficulty } from './constants';

// ============================================================================
// Component Props
// ============================================================================

export interface SpaceInvadersGameProps {
  /** Difficulty level */
  difficulty?: SpaceInvadersDifficulty;
  /** Enable debug mode */
  debugMode?: boolean;
  /** Callback when game ends */
  onGameOver?: (score: number, level: number, wave: number, sessionId: string) => void;
  /** Callback when user exits */
  onExit?: () => void;
  /** Session identifier */
  sessionId?: string;
  /** Enable score submission */
  enableScoreSubmission?: boolean;
}

// ============================================================================
// Game State Type
// ============================================================================

interface SpaceInvadersFullState extends GameState<SpaceInvadersGameSpecific> {
  gameSpecific: SpaceInvadersGameSpecific;
}

// ============================================================================
// Sprite Rendering Functions
// ============================================================================

/**
 * Draws the player ship as a classic triangle spaceship.
 */
function drawPlayer(ctx: CanvasRenderingContext2D, player: PlayerState): void {
  const { position, width, height, isInvulnerable, invulnerabilityTimer } = player;

  // Flash effect during invulnerability
  if (isInvulnerable && Math.floor(invulnerabilityTimer * 10) % 2 === 0) {
    return; // Skip drawing to create flash effect
  }

  ctx.save();
  ctx.fillStyle = COLOR_PLAYER;
  ctx.strokeStyle = COLOR_PLAYER;
  ctx.lineWidth = 2;

  const centerX = position.x;
  const centerY = position.y;

  // Draw classic ship shape (triangle with base)
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - height / 2); // Top point
  ctx.lineTo(centerX - width / 2, centerY + height / 2); // Bottom left
  ctx.lineTo(centerX + width / 2, centerY + height / 2); // Bottom right
  ctx.closePath();
  ctx.fill();

  // Add glow effect
  ctx.shadowBlur = 10;
  ctx.shadowColor = COLOR_PLAYER;
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws an alien with 2-frame animation.
 */
function drawAlien(ctx: CanvasRenderingContext2D, alien: AlienState): void {
  if (!alien.isAlive || alien.isExploding) return;

  const { position, type, width, height, animationFrame } = alien;

  let color: string;
  switch (type) {
    case 'squid':
      color = COLOR_ALIEN_SQUID;
      break;
    case 'crab':
      color = COLOR_ALIEN_CRAB;
      break;
    case 'octopus':
      color = COLOR_ALIEN_OCTOPUS;
      break;
  }

  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;

  const centerX = position.x;
  const centerY = position.y;

  // Draw alien body (simplified sprite representation)
  if (type === 'squid') {
    // Squid: Top row alien (most complex)
    drawSquidAlien(ctx, centerX, centerY, width, height, animationFrame);
  } else if (type === 'crab') {
    // Crab: Middle row alien
    drawCrabAlien(ctx, centerX, centerY, width, height, animationFrame);
  } else {
    // Octopus: Bottom row alien (simplest)
    drawOctopusAlien(ctx, centerX, centerY, width, height, animationFrame);
  }

  // Add glow effect
  ctx.shadowBlur = 8;
  ctx.shadowColor = color;

  ctx.restore();
}

/**
 * Draws a squid-type alien (top row).
 */
function drawSquidAlien(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  frame: number
): void {
  const legOffset = frame === 0 ? 0 : 4;

  // Body
  ctx.fillRect(x - width / 4, y - height / 4, width / 2, height / 2);

  // Tentacles
  ctx.fillRect(x - width / 2 + legOffset, y + height / 4, 4, height / 4);
  ctx.fillRect(x - width / 4 + legOffset, y + height / 4, 4, height / 4);
  ctx.fillRect(x + legOffset, y + height / 4, 4, height / 4);
  ctx.fillRect(x + width / 4 + legOffset, y + height / 4, 4, height / 4);

  // Eyes
  ctx.fillStyle = COLOR_BACKGROUND;
  ctx.fillRect(x - width / 6, y - height / 8, 3, 3);
  ctx.fillRect(x + width / 6, y - height / 8, 3, 3);
}

/**
 * Draws a crab-type alien (middle rows).
 */
function drawCrabAlien(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  frame: number
): void {
  const armOffset = frame === 0 ? -2 : 2;

  // Body
  ctx.fillRect(x - width / 3, y - height / 4, (width * 2) / 3, height / 2);

  // Arms
  ctx.fillRect(x - width / 2 + armOffset, y, width / 6, height / 3);
  ctx.fillRect(x + width / 3 + armOffset, y, width / 6, height / 3);

  // Eyes
  ctx.fillStyle = COLOR_BACKGROUND;
  ctx.fillRect(x - width / 5, y - height / 8, 3, 3);
  ctx.fillRect(x + width / 5, y - height / 8, 3, 3);
}

/**
 * Draws an octopus-type alien (bottom rows).
 */
function drawOctopusAlien(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  frame: number
): void {
  const legSpread = frame === 0 ? 0 : 3;

  // Body (rounded rectangle)
  ctx.fillRect(x - width / 3, y - height / 4, (width * 2) / 3, height / 2);

  // Legs
  ctx.fillRect(x - width / 4 - legSpread, y + height / 4, 3, height / 4);
  ctx.fillRect(x + width / 4 + legSpread, y + height / 4, 3, height / 4);

  // Eyes
  ctx.fillStyle = COLOR_BACKGROUND;
  ctx.fillRect(x - width / 6, y - height / 8, 3, 3);
  ctx.fillRect(x + width / 6, y - height / 8, 3, 3);
}

/**
 * Draws the UFO (mystery ship).
 */
function drawUFO(ctx: CanvasRenderingContext2D, ufo: UFOState): void {
  if (!ufo.isActive || ufo.isExploding) return;

  const { position, width, height } = ufo;

  ctx.save();
  ctx.fillStyle = COLOR_UFO;
  ctx.strokeStyle = COLOR_UFO;

  const centerX = position.x;
  const centerY = position.y;

  // Draw UFO body (classic flying saucer shape)
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, width / 2, height / 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Draw dome
  ctx.beginPath();
  ctx.ellipse(centerX, centerY - height / 6, width / 4, height / 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Add glow effect
  ctx.shadowBlur = 12;
  ctx.shadowColor = COLOR_UFO;
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws a bullet.
 */
function drawBullet(ctx: CanvasRenderingContext2D, bullet: BulletState): void {
  if (!bullet.isActive) return;

  const { position, width, height, owner } = bullet;
  const color = owner === 'player' ? COLOR_PLAYER_BULLET : COLOR_ALIEN_BULLET;

  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowBlur = 8;
  ctx.shadowColor = color;

  ctx.fillRect(position.x - width / 2, position.y - height / 2, width, height);

  ctx.restore();
}

/**
 * Draws a shield with segmented damage visualization.
 */
function drawShield(ctx: CanvasRenderingContext2D, shield: ShieldState): void {
  ctx.save();

  for (const segment of shield.segments) {
    if (segment.isDestroyed) continue;

    const alpha = segment.health / 100;
    ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
    ctx.fillRect(segment.position.x, segment.position.y, segment.width, segment.height);
  }

  ctx.restore();
}

/**
 * Draws an explosion animation.
 */
function drawExplosion(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number,
  size: number = 40
): void {
  const radius = size * progress;
  const alpha = 1 - progress;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Outer ring
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = '#ff4444';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Inner ring
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
  ctx.strokeStyle = '#ffff44';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws a particle.
 */
function drawParticle(ctx: CanvasRenderingContext2D, particle: Particle): void {
  const alpha = 1 - particle.lifetime / particle.maxLifetime;

  ctx.save();
  ctx.globalAlpha = alpha * particle.opacity;
  ctx.fillStyle = particle.color;
  ctx.shadowBlur = 5;
  ctx.shadowColor = particle.color;

  ctx.beginPath();
  ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ============================================================================
// Main Component
// ============================================================================

export const SpaceInvadersGame: React.FC<SpaceInvadersGameProps> = ({
  difficulty = 'normal',
  debugMode = false,
  onGameOver,
  onExit,
  sessionId = `space-invaders-${Date.now()}`,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const difficultyConfig = getDifficultyConfig(difficulty);

  const [gameState, setGameState] = useState<SpaceInvadersFullState>(() => {
    const gameSpecific = initSpaceInvadersState(difficultyConfig);
    return {
      status: 'playing',
      score: 0,
      gameSpecific,
    };
  });

  const [isPaused, setIsPaused] = useState(false);
  const [isGameOverState, setIsGameOverState] = useState(false);
  const [playerDirection, setPlayerDirection] = useState<PlayerDirection>('none');
  const [isShooting, setIsShooting] = useState(false);

  const animationFrameRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);

  // ============================================================================
  // Game Loop
  // ============================================================================

  const gameLoop = useCallback(
    (timestamp: number) => {
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = timestamp;
      }

      const deltaTime = (timestamp - lastFrameTimeRef.current) / 1000; // Convert to seconds
      lastFrameTimeRef.current = timestamp;

      if (isPaused || isGameOverState) {
        animationFrameRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      setGameState((prevState) => {
        let gs = { ...prevState.gameSpecific };
        let score = prevState.score;

        // Update player movement
        gs.player = updatePlayerMovement(gs.player, playerDirection, deltaTime, difficultyConfig);

        // Update player timers
        gs.player = updatePlayerTimers(gs.player, deltaTime);

        // Handle player shooting
        if (isShooting && gs.player.shootCooldown <= 0) {
          const shootResult = playerShoot(gs.player, gs.bullets, difficultyConfig);
          gs.player = shootResult.player;
          gs.bullets = shootResult.bullets;
        }

        // Update formation (aliens)
        gs.formation = updateFormationMovement(gs.formation, deltaTime);

        // Update alien explosions
        gs.formation = updateAlienExplosions(gs.formation, deltaTime);

        // Update bullets
        gs.bullets = updateBullets(gs.bullets, deltaTime);

        // Update UFO spawning and movement
        gs = updateUFOSpawning(gs, deltaTime, difficultyConfig);
        gs.ufo = updateUFOMovement(gs.ufo, deltaTime);
        gs.ufo = updateUFOExplosion(gs.ufo, deltaTime);

        // Handle alien shooting
        gs.alienShootTimer -= deltaTime;
        if (gs.alienShootTimer <= 0) {
          const shootResult = alienShoot(gs.formation, gs.bullets, difficultyConfig);
          gs.formation = shootResult.formation;
          gs.bullets = shootResult.bullets;
          gs.alienShootTimer = difficultyConfig.alienShootInterval;
        }

        // Update shields
        gs.shields = updateShieldHealth(gs.shields);

        // Update particles
        gs.particles = updateParticles(gs.particles, deltaTime);

        // Update combo timer
        gs.comboTimer -= deltaTime;
        if (gs.comboTimer <= 0) {
          gs.comboMultiplier = 1;
        }

        // Check collisions
        const alienCollisions = checkBulletAlienCollisions(
          gs.bullets,
          gs.formation,
          gs.comboMultiplier
        );
        gs.bullets = alienCollisions.bullets;
        gs.formation = alienCollisions.formation;
        score += alienCollisions.scoreGained;
        if (alienCollisions.scoreGained > 0) {
          gs = updateCombo(gs);
        }

        const ufoCollisions = checkBulletUFOCollisions(gs.bullets, gs.ufo);
        gs.bullets = ufoCollisions.bullets;
        gs.ufo = ufoCollisions.ufo;
        score += ufoCollisions.scoreGained;

        const shieldCollisions = checkBulletShieldCollisions(gs.bullets, gs.shields);
        gs.bullets = shieldCollisions.bullets;
        gs.shields = shieldCollisions.shields;

        const playerCollisions = checkBulletPlayerCollisions(gs.bullets, gs.player);
        gs.bullets = playerCollisions.bullets;
        if (playerCollisions.wasHit) {
          gs = handlePlayerDeath(gs, difficultyConfig);
        }

        // Check if wave is complete
        if (isWaveComplete(gs.formation) && prevState.status === 'playing') {
          gs = advanceWave(gs, difficultyConfig);
          score += 500; // Wave completion bonus
        }

        // Check game over
        if (checkGameOver(gs.player, gs.formation)) {
          setIsGameOverState(true);
          if (onGameOver) {
            onGameOver(score, gs.level, gs.wave, sessionId);
          }
          return {
            status: 'game-over' as const,
            score,
            gameSpecific: gs,
          };
        }

        return {
          status: 'playing' as const,
          score,
          gameSpecific: gs,
        };
      });

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    },
    [
      isPaused,
      isGameOverState,
      playerDirection,
      isShooting,
      onGameOver,
      sessionId,
      difficultyConfig,
    ]
  );

  // ============================================================================
  // Rendering
  // ============================================================================

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = COLOR_BACKGROUND;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw shields
    gameState.gameSpecific.shields.forEach((shield) => drawShield(ctx, shield));

    // Draw player
    if (!gameState.gameSpecific.player.isExploding) {
      drawPlayer(ctx, gameState.gameSpecific.player);
    } else {
      drawExplosion(
        ctx,
        gameState.gameSpecific.player.position.x,
        gameState.gameSpecific.player.position.y,
        gameState.gameSpecific.player.explosionProgress,
        PLAYER_WIDTH
      );
    }

    // Draw aliens
    gameState.gameSpecific.formation.aliens.forEach((alien) => {
      if (alien.isExploding) {
        drawExplosion(
          ctx,
          alien.position.x,
          alien.position.y,
          alien.explosionProgress,
          ALIEN_WIDTH
        );
      } else {
        drawAlien(ctx, alien);
      }
    });

    // Draw UFO
    if (gameState.gameSpecific.ufo.isExploding) {
      drawExplosion(
        ctx,
        gameState.gameSpecific.ufo.position.x,
        gameState.gameSpecific.ufo.position.y,
        gameState.gameSpecific.ufo.explosionProgress,
        UFO_WIDTH
      );
    } else {
      drawUFO(ctx, gameState.gameSpecific.ufo);
    }

    // Draw bullets
    gameState.gameSpecific.bullets.forEach((bullet) => drawBullet(ctx, bullet));

    // Draw particles
    gameState.gameSpecific.particles.forEach((particle) => drawParticle(ctx, particle));

    // Draw HUD
    drawHUD(ctx, gameState);

    // Draw debug info
    if (debugMode) {
      drawDebugInfo(ctx, gameState);
    }
  }, [gameState, debugMode]);

  // ============================================================================
  // HUD Rendering
  // ============================================================================

  function drawHUD(ctx: CanvasRenderingContext2D, state: SpaceInvadersFullState): void {
    ctx.save();
    ctx.fillStyle = COLOR_TEXT;
    ctx.font = '16px "JetBrains Mono", monospace';

    // Score
    ctx.fillText(`SCORE: ${state.score.toString().padStart(6, '0')}`, 20, 30);

    // High Score
    ctx.fillText(`HIGH: ${state.gameSpecific.highScore.toString().padStart(6, '0')}`, 200, 30);

    // Lives
    ctx.fillText(`LIVES: ${state.gameSpecific.player.lives}`, 380, 30);

    // Level and Wave
    ctx.fillText(`LEVEL ${state.gameSpecific.level}-${state.gameSpecific.wave}`, 520, 30);

    // Combo multiplier (if active)
    if (state.gameSpecific.comboMultiplier > 1) {
      ctx.save();
      ctx.fillStyle = '#ffff00';
      ctx.font = 'bold 20px "JetBrains Mono", monospace';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ffff00';
      ctx.fillText(`COMBO x${state.gameSpecific.comboMultiplier}`, CANVAS_WIDTH / 2 - 60, 60);
      ctx.restore();
    }

    // Aliens remaining
    ctx.fillStyle = COLOR_TEXT_MUTED;
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText(
      `ALIENS: ${state.gameSpecific.formation.aliveCount}`,
      CANVAS_WIDTH - 120,
      CANVAS_HEIGHT - 20
    );

    ctx.restore();
  }

  // ============================================================================
  // Debug Info Rendering
  // ============================================================================

  function drawDebugInfo(ctx: CanvasRenderingContext2D, state: SpaceInvadersFullState): void {
    ctx.save();
    ctx.fillStyle = '#00ff00';
    ctx.font = '10px "JetBrains Mono", monospace';

    const debugLines = [
      `FPS: ${Math.round(1 / ((performance.now() - lastFrameTimeRef.current) / 1000))}`,
      `Bullets: ${state.gameSpecific.bullets.filter((b) => b.isActive).length}`,
      `Particles: ${state.gameSpecific.particles.length}`,
      `Player: ${Math.round(state.gameSpecific.player.position.x)}, ${Math.round(state.gameSpecific.player.position.y)}`,
      `Formation Speed: ${state.gameSpecific.formation.speed.toFixed(1)}`,
    ];

    debugLines.forEach((line, index) => {
      ctx.fillText(line, 10, CANVAS_HEIGHT - 60 + index * 12);
    });

    ctx.restore();
  }

  // ============================================================================
  // Keyboard Controls
  // ============================================================================

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (isGameOverState) return;

      switch (e.key.toLowerCase()) {
        case 'arrowleft':
        case 'a':
          e.preventDefault();
          setPlayerDirection('left');
          break;
        case 'arrowright':
        case 'd':
          e.preventDefault();
          setPlayerDirection('right');
          break;
        case ' ':
        case 'arrowup':
        case 'w':
          e.preventDefault();
          setIsShooting(true);
          break;
        case 'p':
        case 'escape':
          e.preventDefault();
          setIsPaused((prev) => !prev);
          break;
      }
    }

    function handleKeyUp(e: KeyboardEvent): void {
      if (isGameOverState) return;

      switch (e.key.toLowerCase()) {
        case 'arrowleft':
        case 'a':
          e.preventDefault();
          if (playerDirection === 'left') {
            setPlayerDirection('none');
          }
          break;
        case 'arrowright':
        case 'd':
          e.preventDefault();
          if (playerDirection === 'right') {
            setPlayerDirection('none');
          }
          break;
        case ' ':
        case 'arrowup':
        case 'w':
          e.preventDefault();
          setIsShooting(false);
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isGameOverState, playerDirection]);

  // ============================================================================
  // Game Loop Start/Stop
  // ============================================================================

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameLoop]);

  // ============================================================================
  // Render UI
  // ============================================================================

  return (
    <div className="relative flex items-center justify-center w-full h-full bg-[#0F0F1A]">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-2 border-[#2D2D4A] rounded-lg shadow-2xl"
        style={{
          imageRendering: 'pixelated',
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      />

      {/* Pause Overlay */}
      {isPaused && !isGameOverState && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="text-center">
            <h2 className="text-6xl font-bold text-cyan-400 mb-4 animate-pulse">PAUSED</h2>
            <p className="text-xl text-slate-300">Press P or ESC to continue</p>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {isGameOverState && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center space-y-4">
            <h2 className="text-6xl font-bold text-red-500 mb-6">GAME OVER</h2>
            <div className="space-y-2 text-2xl">
              <p className="text-cyan-400">
                Final Score:{' '}
                <span className="text-white font-bold">
                  {gameState.score.toString().padStart(6, '0')}
                </span>
              </p>
              <p className="text-yellow-400">
                Level:{' '}
                <span className="text-white font-bold">
                  {gameState.gameSpecific.level}-{gameState.gameSpecific.wave}
                </span>
              </p>
              {gameState.score > gameState.gameSpecific.highScore && (
                <p className="text-green-400 font-bold animate-pulse">NEW HIGH SCORE!</p>
              )}
            </div>
            {onExit && (
              <button
                onClick={onExit}
                className="mt-6 px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition-colors duration-200"
              >
                Exit Game
              </button>
            )}
          </div>
        </div>
      )}

      {/* Controls Hint */}
      {!isPaused && !isGameOverState && (
        <div className="absolute bottom-4 left-4 text-slate-400 text-sm">
          <p>← → or A/D: Move | SPACE or ↑ or W: Shoot | P/ESC: Pause</p>
        </div>
      )}
    </div>
  );
};

export default SpaceInvadersGame;
