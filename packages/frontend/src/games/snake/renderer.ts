/**
 * Snake Game Renderer
 *
 * This module provides canvas rendering functions for the Snake game,
 * including background, grid, snake segments, and food items.
 *
 * All rendering functions operate on a 2D canvas context and use the
 * grid-based coordinate system defined in constants.ts.
 *
 * @module games/snake/renderer
 */

import {
  GRID_SIZE,
  CELL_SIZE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  SNAKE_COLORS,
  FOOD_COLORS,
  GRID_COLORS,
} from './constants';

// ============================================================================
// Color Constants
// ============================================================================

/**
 * Rendering color palette matching the arcade design system.
 *
 * @description Colors follow the retro arcade/neon aesthetic:
 * - Background: Deep dark purple (#0F0F1A)
 * - Grid: Subtle purple (#1A1A2E)
 * - Snake: Neon green (#00ff00)
 * - Food: Neon red (#ff0000)
 * - Accents: Cyan (#00ffff), Magenta (#ff00ff)
 */
export const RENDER_COLORS = {
  /** Main background color */
  background: GRID_COLORS.background,
  /** Grid line color (subtle) */
  gridLine: GRID_COLORS.gridLine,
  /** Border color */
  border: GRID_COLORS.border,
  /** Snake head color */
  snakeHead: SNAKE_COLORS.head,
  /** Snake body color */
  snakeBody: SNAKE_COLORS.body,
  /** Snake body gradient end */
  snakeBodyEnd: SNAKE_COLORS.bodyEnd,
  /** Snake outline */
  snakeOutline: SNAKE_COLORS.outline,
  /** Standard food color */
  food: FOOD_COLORS.standard,
  /** Bonus food color */
  bonusFood: FOOD_COLORS.bonus,
  /** Food glow effect */
  foodGlow: FOOD_COLORS.glow,
} as const;

// ============================================================================
// Background Rendering
// ============================================================================

/**
 * Renders the game background with solid dark color.
 *
 * This function fills the entire canvas with the background color (#0F0F1A),
 * creating the dark arcade-style base for the game.
 *
 * @param ctx - Canvas 2D rendering context
 *
 * @description
 * - Sets fillStyle to RENDER_COLORS.background (#0F0F1A)
 * - Fills entire canvas area with fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
 * - Should be called first in the render pipeline (before grid, snake, food)
 *
 * @example
 * ```ts
 * const canvas = document.querySelector('canvas')
 * const ctx = canvas.getContext('2d')
 * renderBackground(ctx) // Fills canvas with dark background
 * ```
 */
export function renderBackground(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = RENDER_COLORS.background;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

// ============================================================================
// Grid Rendering
// ============================================================================

/**
 * Renders grid lines for visual cell boundaries.
 *
 * Draws vertical and horizontal grid lines to create a visible grid overlay.
 * Lines are subtle (using RENDER_COLORS.gridLine) and thin (0.5px) to avoid
 * visual clutter while providing spatial reference.
 *
 * @param ctx - Canvas 2D rendering context
 *
 * @description
 * - Sets strokeStyle to RENDER_COLORS.gridLine (#1A1A2E)
 * - Sets lineWidth to 0.5 for subtle appearance
 * - Draws vertical lines at x = i * CELL_SIZE for each column
 * - Draws horizontal lines at y = i * CELL_SIZE for each row
 * - Total lines drawn: GRID_SIZE vertical + GRID_SIZE horizontal
 *
 * @example
 * ```ts
 * const canvas = document.querySelector('canvas')
 * const ctx = canvas.getContext('2d')
 * renderBackground(ctx) // Fill background first
 * renderGrid(ctx)       // Then draw grid lines
 * ```
 */
export function renderGrid(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = RENDER_COLORS.gridLine;
  ctx.lineWidth = 0.5;

  // Draw vertical lines (columns)
  for (let x = 0; x <= GRID_SIZE; x++) {
    const pixelX = x * CELL_SIZE;
    ctx.beginPath();
    ctx.moveTo(pixelX, 0);
    ctx.lineTo(pixelX, CANVAS_HEIGHT);
    ctx.stroke();
  }

  // Draw horizontal lines (rows)
  for (let y = 0; y <= GRID_SIZE; y++) {
    const pixelY = y * CELL_SIZE;
    ctx.beginPath();
    ctx.moveTo(0, pixelY);
    ctx.lineTo(CANVAS_WIDTH, pixelY);
    ctx.stroke();
  }
}
