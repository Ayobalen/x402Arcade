/**
 * Pong Game Renderer
 *
 * This module provides canvas rendering functions for the Pong game,
 * including court, paddles, ball, center line, and score display.
 *
 * All rendering functions operate on a 2D canvas context and use pixel
 * coordinates as defined in constants.ts.
 *
 * @module games/pong/renderer
 */

import type { PongState, PaddleState, BallState } from './types';
import { COURT_WIDTH, COURT_HEIGHT, CENTER_LINE_WIDTH, PONG_COLORS, FONTS } from './constants';

// ============================================================================
// Color Constants
// ============================================================================

/**
 * Rendering color palette matching the arcade design system.
 */
export const RENDER_COLORS = {
  background: PONG_COLORS.background,
  border: PONG_COLORS.border,
  centerLine: PONG_COLORS.centerLine,
  paddleLeft: PONG_COLORS.paddleLeft,
  paddleRight: PONG_COLORS.paddleRight,
  ball: PONG_COLORS.ball,
  ballTrail: PONG_COLORS.ballTrail,
  score: PONG_COLORS.score,
  scoreMuted: PONG_COLORS.scoreMuted,
} as const;

// ============================================================================
// Background Rendering
// ============================================================================

/**
 * Renders the game background (court).
 *
 * @param ctx - Canvas 2D rendering context
 */
export function renderBackground(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = RENDER_COLORS.background;
  ctx.fillRect(0, 0, COURT_WIDTH, COURT_HEIGHT);
}

/**
 * Renders the court border.
 *
 * @param ctx - Canvas 2D rendering context
 */
export function renderBorder(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = RENDER_COLORS.border;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, COURT_WIDTH - 2, COURT_HEIGHT - 2);
}

/**
 * Renders the center line (dashed).
 *
 * @param ctx - Canvas 2D rendering context
 */
export function renderCenterLine(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = RENDER_COLORS.centerLine;
  ctx.lineWidth = CENTER_LINE_WIDTH;
  ctx.setLineDash([10, 10]); // Dashed line

  ctx.beginPath();
  ctx.moveTo(COURT_WIDTH / 2, 0);
  ctx.lineTo(COURT_WIDTH / 2, COURT_HEIGHT);
  ctx.stroke();

  ctx.setLineDash([]); // Reset to solid line
}

// ============================================================================
// Paddle Rendering
// ============================================================================

/**
 * Renders a paddle with neon glow effect.
 *
 * @param ctx - Canvas 2D rendering context
 * @param paddle - Paddle state object
 */
export function renderPaddle(ctx: CanvasRenderingContext2D, paddle: PaddleState): void {
  const color = paddle.side === 'left' ? RENDER_COLORS.paddleLeft : RENDER_COLORS.paddleRight;

  // Apply neon glow effect
  applyNeonGlow(ctx, color, 10);

  // Draw paddle rectangle
  ctx.fillStyle = color;
  ctx.fillRect(paddle.position.x, paddle.position.y, paddle.width, paddle.height);

  // Reset glow effect
  resetGlow(ctx);
}

/**
 * Renders both paddles.
 *
 * @param ctx - Canvas 2D rendering context
 * @param leftPaddle - Left paddle state
 * @param rightPaddle - Right paddle state
 */
export function renderPaddles(
  ctx: CanvasRenderingContext2D,
  leftPaddle: PaddleState,
  rightPaddle: PaddleState
): void {
  renderPaddle(ctx, leftPaddle);
  renderPaddle(ctx, rightPaddle);
}

// ============================================================================
// Ball Rendering
// ============================================================================

/**
 * Renders the ball with glow effect.
 *
 * @param ctx - Canvas 2D rendering context
 * @param ball - Ball state object
 */
export function renderBall(ctx: CanvasRenderingContext2D, ball: BallState): void {
  // Apply neon glow effect
  applyNeonGlow(ctx, RENDER_COLORS.ball, 15);

  // Draw ball circle
  ctx.fillStyle = RENDER_COLORS.ball;
  ctx.beginPath();
  ctx.arc(ball.position.x, ball.position.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();

  // Reset glow effect
  resetGlow(ctx);
}

/**
 * Renders a ball trail effect for motion blur.
 *
 * @param ctx - Canvas 2D rendering context
 * @param ball - Ball state object
 * @param trailLength - Number of trail segments (default: 3)
 */
export function renderBallTrail(
  ctx: CanvasRenderingContext2D,
  ball: BallState,
  trailLength: number = 3
): void {
  const speed = Math.sqrt(ball.velocity.vx ** 2 + ball.velocity.vy ** 2);

  if (speed < 50) return; // Don't render trail for slow balls

  const angle = Math.atan2(ball.velocity.vy, ball.velocity.vx);
  const spacing = 8; // Distance between trail segments

  for (let i = 1; i <= trailLength; i++) {
    const trailX = ball.position.x - Math.cos(angle) * spacing * i;
    const trailY = ball.position.y - Math.sin(angle) * spacing * i;
    const opacity = 0.3 - (i / trailLength) * 0.3; // Fade out
    const radius = ball.radius * (1 - i / (trailLength + 2)); // Shrink

    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.beginPath();
    ctx.arc(trailX, trailY, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ============================================================================
// Score Rendering
// ============================================================================

/**
 * Renders the score display.
 *
 * @param ctx - Canvas 2D rendering context
 * @param leftScore - Left player score
 * @param rightScore - Right player score
 */
export function renderScore(
  ctx: CanvasRenderingContext2D,
  leftScore: number,
  rightScore: number
): void {
  ctx.font = FONTS.score;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  // Left score
  ctx.fillStyle = RENDER_COLORS.score;
  ctx.fillText(leftScore.toString(), COURT_WIDTH / 4, 20);

  // Right score
  ctx.fillStyle = RENDER_COLORS.score;
  ctx.fillText(rightScore.toString(), (COURT_WIDTH * 3) / 4, 20);
}

/**
 * Renders rally count (optional).
 *
 * @param ctx - Canvas 2D rendering context
 * @param rallyCount - Current rally count
 */
export function renderRallyCount(ctx: CanvasRenderingContext2D, rallyCount: number): void {
  if (rallyCount < 5) return; // Only show for rallies of 5 or more

  ctx.font = '20px JetBrains Mono, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = RENDER_COLORS.scoreMuted;
  ctx.fillText(`Rally: ${rallyCount}`, COURT_WIDTH / 2, 60);
}

// ============================================================================
// Serve Countdown Rendering
// ============================================================================

/**
 * Renders serve countdown timer.
 *
 * @param ctx - Canvas 2D rendering context
 * @param timeRemaining - Time until serve (seconds)
 */
export function renderServeCountdown(ctx: CanvasRenderingContext2D, timeRemaining: number): void {
  if (timeRemaining <= 0) return;

  const countdown = Math.ceil(timeRemaining);

  ctx.font = '72px JetBrains Mono, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Apply glow effect
  applyNeonGlow(ctx, PONG_COLORS.centerLine, 20);

  ctx.fillStyle = PONG_COLORS.centerLine;
  ctx.fillText(countdown.toString(), COURT_WIDTH / 2, COURT_HEIGHT / 2);

  resetGlow(ctx);
}

// ============================================================================
// Game Over Rendering
// ============================================================================

/**
 * Renders game over overlay.
 *
 * @param ctx - Canvas 2D rendering context
 * @param winner - Winner side ('left' or 'right')
 * @param leftScore - Final left score
 * @param rightScore - Final right score
 */
export function renderGameOver(
  ctx: CanvasRenderingContext2D,
  winner: 'left' | 'right',
  leftScore: number,
  rightScore: number
): void {
  // Semi-transparent overlay
  ctx.fillStyle = 'rgba(15, 15, 26, 0.8)';
  ctx.fillRect(0, 0, COURT_WIDTH, COURT_HEIGHT);

  // Winner text
  const winnerColor = winner === 'left' ? RENDER_COLORS.paddleLeft : RENDER_COLORS.paddleRight;
  const winnerText = winner === 'left' ? 'Player 1 Wins!' : 'Player 2 Wins!';

  ctx.font = '48px JetBrains Mono, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  applyNeonGlow(ctx, winnerColor, 25);
  ctx.fillStyle = winnerColor;
  ctx.fillText(winnerText, COURT_WIDTH / 2, COURT_HEIGHT / 2 - 40);
  resetGlow(ctx);

  // Final score
  ctx.font = '32px JetBrains Mono, monospace';
  ctx.fillStyle = RENDER_COLORS.score;
  ctx.fillText(`${leftScore} - ${rightScore}`, COURT_WIDTH / 2, COURT_HEIGHT / 2 + 20);

  // Play again prompt
  ctx.font = '20px JetBrains Mono, monospace';
  ctx.fillStyle = RENDER_COLORS.scoreMuted;
  ctx.fillText('Press SPACE to play again', COURT_WIDTH / 2, COURT_HEIGHT / 2 + 80);
}

// ============================================================================
// Pause Rendering
// ============================================================================

/**
 * Renders pause overlay.
 *
 * @param ctx - Canvas 2D rendering context
 */
export function renderPauseOverlay(ctx: CanvasRenderingContext2D): void {
  // Semi-transparent overlay
  ctx.fillStyle = 'rgba(15, 15, 26, 0.7)';
  ctx.fillRect(0, 0, COURT_WIDTH, COURT_HEIGHT);

  // Pause text
  ctx.font = '48px JetBrains Mono, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  applyNeonGlow(ctx, PONG_COLORS.centerLine, 20);
  ctx.fillStyle = PONG_COLORS.centerLine;
  ctx.fillText('PAUSED', COURT_WIDTH / 2, COURT_HEIGHT / 2);
  resetGlow(ctx);

  // Resume prompt
  ctx.font = '20px JetBrains Mono, monospace';
  ctx.fillStyle = RENDER_COLORS.scoreMuted;
  ctx.fillText('Press ESC or P to resume', COURT_WIDTH / 2, COURT_HEIGHT / 2 + 60);
}

// ============================================================================
// Glow Effects
// ============================================================================

/**
 * Applies neon glow effect to canvas context.
 *
 * @param ctx - Canvas 2D rendering context
 * @param color - Color for the glow
 * @param intensity - Glow intensity (blur radius)
 */
export function applyNeonGlow(
  ctx: CanvasRenderingContext2D,
  color: string,
  intensity: number = 10
): void {
  ctx.shadowBlur = intensity;
  ctx.shadowColor = color;
}

/**
 * Resets glow effect on canvas context.
 *
 * @param ctx - Canvas 2D rendering context
 */
export function resetGlow(ctx: CanvasRenderingContext2D): void {
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
}

// ============================================================================
// Complete Frame Rendering
// ============================================================================

/**
 * Renders the complete Pong game frame.
 *
 * @param ctx - Canvas 2D rendering context
 * @param state - Complete game state
 * @param options - Rendering options
 */
export function renderGame(
  ctx: CanvasRenderingContext2D,
  state: PongState,
  options: {
    showRallyCount?: boolean;
    showBallTrail?: boolean;
  } = {}
): void {
  const gameState = state.gameSpecific;

  if (!gameState) return;

  // Clear and render background
  renderBackground(ctx);
  renderBorder(ctx);
  renderCenterLine(ctx);

  // Render scores
  renderScore(ctx, gameState.leftScore.score, gameState.rightScore.score);

  // Render rally count if enabled and rally > 5
  if (options.showRallyCount && gameState.currentRally >= 5) {
    renderRallyCount(ctx, gameState.currentRally);
  }

  // Render paddles
  renderPaddles(ctx, gameState.leftPaddle, gameState.rightPaddle);

  // Render ball trail if enabled
  if (options.showBallTrail && gameState.ballInPlay) {
    renderBallTrail(ctx, gameState.ball);
  }

  // Render ball
  renderBall(ctx, gameState.ball);

  // Render serve countdown if ball not in play
  if (!gameState.ballInPlay) {
    renderServeCountdown(ctx, gameState.serveDelayRemaining);
  }

  // Render pause overlay if paused
  if (state.isPaused && state.isPlaying) {
    renderPauseOverlay(ctx);
  }

  // Render game over if game ended
  if (state.isGameOver && gameState.winCondition.hasWinner && gameState.winCondition.winner) {
    renderGameOver(
      ctx,
      gameState.winCondition.winner,
      gameState.leftScore.score,
      gameState.rightScore.score
    );
  }
}

// ============================================================================
// Exports
// ============================================================================

export default {
  renderGame,
  renderBackground,
  renderBorder,
  renderCenterLine,
  renderPaddle,
  renderPaddles,
  renderBall,
  renderBallTrail,
  renderScore,
  renderRallyCount,
  renderServeCountdown,
  renderGameOver,
  renderPauseOverlay,
  applyNeonGlow,
  resetGlow,
};
