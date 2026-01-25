/**
 * Breakout Game Component
 *
 * Simplified component using useBreakoutGame hook for game logic.
 */

import React, { useEffect, useRef } from 'react';
import { useBreakoutGame } from './useBreakoutGame';
import type { BreakoutDifficulty } from './constants';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  BREAKOUT_COLORS,
  BRICK_COLORS,
  POWERUP_COLORS,
  POWERUP_ICONS,
  LASER_COLOR,
  FONTS,
} from './constants';
import type { BrickState, BallState, PaddleState, PowerUpState, LaserState } from './types';

// ============================================================================
// Props
// ============================================================================

export interface BreakoutGameProps {
  difficulty?: BreakoutDifficulty;
  onGameOver?: (score: number, level: number, sessionId?: string) => void;
}

// ============================================================================
// Rendering Functions
// ============================================================================

function renderBackground(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = BREAKOUT_COLORS.background;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
}

function renderBorder(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = BREAKOUT_COLORS.border;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, GAME_WIDTH - 2, GAME_HEIGHT - 2);
}

function renderBrick(ctx: CanvasRenderingContext2D, brick: BrickState): void {
  if (brick.isDestroyed) return;

  const color = BRICK_COLORS[brick.type] || BRICK_COLORS.normal;
  const { x, y } = brick.position;
  const { width, height } = brick;

  // Main brick body
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);

  // 3D highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillRect(x, y, width, 2);
  ctx.fillRect(x, y, 2, height);

  // 3D shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(x, y + height - 2, width, 2);
  ctx.fillRect(x + width - 2, y, 2, height);

  // HP indicator
  if (brick.maxHp > 1) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(brick.hp.toString(), x + width / 2, y + height / 2);
  }
}

function renderPaddle(ctx: CanvasRenderingContext2D, paddle: PaddleState, hasLaser: boolean): void {
  const color = hasLaser ? BREAKOUT_COLORS.paddleLaser : BREAKOUT_COLORS.paddle;
  const { x, y } = paddle.position;
  const { width, height } = paddle;

  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
  ctx.shadowBlur = 0;

  // 3D highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillRect(x, y, width, 2);
}

function renderBall(ctx: CanvasRenderingContext2D, ball: BallState): void {
  const color = BREAKOUT_COLORS.ball;

  ctx.shadowColor = color;
  ctx.shadowBlur = 15;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(ball.position.x, ball.position.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function renderPowerUp(ctx: CanvasRenderingContext2D, powerUp: PowerUpState): void {
  const color = POWERUP_COLORS[powerUp.type] || '#00ff00';
  const icon = POWERUP_ICONS[powerUp.type] || '?';
  const { x, y } = powerUp.position;
  const { width, height } = powerUp;

  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#000000';
  ctx.font = FONTS.powerup;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(icon, x + width / 2, y + height / 2);
}

function renderLaser(ctx: CanvasRenderingContext2D, laser: LaserState): void {
  ctx.shadowColor = LASER_COLOR;
  ctx.shadowBlur = 8;
  ctx.fillStyle = LASER_COLOR;
  ctx.fillRect(laser.position.x, laser.position.y, laser.width, laser.height);
  ctx.shadowBlur = 0;
}

function renderUI(
  ctx: CanvasRenderingContext2D,
  score: number,
  level: number,
  lives: number
): void {
  ctx.fillStyle = BREAKOUT_COLORS.text;
  ctx.font = FONTS.ui;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  ctx.fillText(`Score: ${score}`, 20, 20);
  ctx.textAlign = 'center';
  ctx.fillText(`Level ${level}`, GAME_WIDTH / 2, 20);
  ctx.textAlign = 'right';
  ctx.fillText(`Lives: ${lives}`, GAME_WIDTH - 20, 20);
}

function renderOverlay(ctx: CanvasRenderingContext2D, message: string, subtitle?: string): void {
  // Semi-transparent overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Main message
  ctx.fillStyle = BREAKOUT_COLORS.text;
  ctx.font = FONTS.title;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(message, GAME_WIDTH / 2, GAME_HEIGHT / 2);

  // Subtitle
  if (subtitle) {
    ctx.font = FONTS.subtitle;
    ctx.fillText(subtitle, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60);
  }
}

// ============================================================================
// Component
// ============================================================================

export function BreakoutGame({ difficulty = 'normal', onGameOver }: BreakoutGameProps) {
  const { state, canvasRef, context } = useBreakoutGame({
    difficulty,
    onGameOver,
  });

  const frameRef = useRef<number>();

  // Render loop
  useEffect(() => {
    if (!context) return;

    const render = () => {
      if (!state.gameSpecific) return;

      const { paddle, balls, bricks, powerUps, lasers } = state.gameSpecific;

      // Clear and render background
      renderBackground(context);
      renderBorder(context);

      // Render game objects
      bricks.forEach((brick) => renderBrick(context, brick));
      powerUps.forEach((powerUp) => renderPowerUp(context, powerUp));
      lasers.forEach((laser) => renderLaser(context, laser));
      renderPaddle(context, paddle, paddle.hasLaser);
      balls.forEach((ball) => renderBall(context, ball));

      // Render UI
      renderUI(context, state.score, state.level, state.lives);

      // Render overlays
      if (state.isGameOver) {
        renderOverlay(context, 'GAME OVER', `Final Score: ${state.score}`);
      } else if (state.isPaused) {
        renderOverlay(context, 'PAUSED', 'Press P to resume');
      } else if (!state.isPlaying) {
        renderOverlay(context, 'BREAKOUT', 'Press SPACE to start');
      }

      frameRef.current = requestAnimationFrame(render);
    };

    frameRef.current = requestAnimationFrame(render);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [context, state]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8">
      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        className="rounded-lg border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20"
      />
      <div className="text-center space-y-2">
        <p className="text-sm text-slate-400">
          Controls: Arrow Keys or A/D to move • SPACE to launch ball/fire laser • P to pause
        </p>
      </div>
    </div>
  );
}

export default BreakoutGame;
