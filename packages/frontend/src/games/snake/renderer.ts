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

// ============================================================================
// Food Rendering
// ============================================================================

/**
 * Renders a food item as a circle with glow effect.
 *
 * This function draws food items on the game grid using the arc() method
 * to create circular shapes. Standard food is neon red, bonus food is gold.
 * Food is drawn with a subtle glow effect for visual appeal.
 *
 * @param ctx - Canvas 2D rendering context
 * @param food - Food object with position and type
 *
 * @description
 * - Calculates pixel position from grid coordinates (x * CELL_SIZE)
 * - Centers food within cell (adds CELL_SIZE / 2 offset)
 * - Draws circle using arc() with radius = CELL_SIZE / 3
 * - Sets fillStyle based on food type (standard vs bonus)
 * - Applies glow effect with shadowBlur and shadowColor
 * - Resets shadow properties after rendering
 *
 * @example
 * ```ts
 * const food: Food = { x: 10, y: 15, type: 'standard', points: 10, hasEffect: false }
 * renderFood(ctx, food) // Draws red circle at grid position (10, 15)
 * ```
 */
export function renderFood(
  ctx: CanvasRenderingContext2D,
  food: { x: number; y: number; type?: string }
): void {
  // Calculate pixel position (center of cell)
  const pixelX = food.x * CELL_SIZE + CELL_SIZE / 2;
  const pixelY = food.y * CELL_SIZE + CELL_SIZE / 2;
  const radius = CELL_SIZE / 3;

  // Determine color based on food type
  const foodColor = food.type === 'bonus' ? RENDER_COLORS.bonusFood : RENDER_COLORS.food;

  // Apply glow effect
  ctx.shadowBlur = 10;
  ctx.shadowColor = foodColor;

  // Draw food circle
  ctx.fillStyle = foodColor;
  ctx.beginPath();
  ctx.arc(pixelX, pixelY, radius, 0, Math.PI * 2);
  ctx.fill();

  // Reset shadow properties
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
}

// ============================================================================
// Snake Rendering
// ============================================================================

/**
 * Renders the snake body segments.
 *
 * This function draws all snake segments (excluding the head) as rounded
 * rectangles. Segments use a gradient from bright green to darker green
 * as they approach the tail, creating a visual depth effect.
 *
 * @param ctx - Canvas 2D rendering context
 * @param snake - Array of snake segments, first element is head
 *
 * @description
 * - Iterates through segments starting from index 1 (skips head)
 * - Calculates pixel position for each segment
 * - Draws rounded rectangle (using fillRect for simplicity)
 * - Uses RENDER_COLORS.snakeBody for body segments
 * - Head rendering is handled separately (renderSnakeHead)
 * - Tail can use darker color (RENDER_COLORS.snakeBodyEnd)
 *
 * @example
 * ```ts
 * const snake = [
 *   { x: 10, y: 10 }, // head
 *   { x: 9, y: 10 },  // body
 *   { x: 8, y: 10 }   // tail
 * ]
 * renderSnakeBody(ctx, snake) // Draws 2 body segments
 * ```
 */
export function renderSnakeBody(
  ctx: CanvasRenderingContext2D,
  snake: Array<{ x: number; y: number }>
): void {
  // Skip head (index 0), render only body segments
  for (let i = 1; i < snake.length; i++) {
    const segment = snake[i];
    const pixelX = segment.x * CELL_SIZE;
    const pixelY = segment.y * CELL_SIZE;

    // Use darker color for tail segment
    const isTail = i === snake.length - 1;
    const segmentColor = isTail ? RENDER_COLORS.snakeBodyEnd : RENDER_COLORS.snakeBody;

    // Draw segment as rounded rectangle
    ctx.fillStyle = segmentColor;
    ctx.fillRect(pixelX + 1, pixelY + 1, CELL_SIZE - 2, CELL_SIZE - 2);
  }
}
