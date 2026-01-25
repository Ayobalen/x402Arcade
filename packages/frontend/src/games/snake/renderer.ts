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
 * Linear interpolation helper for color gradient calculation.
 *
 * @param start - Start value
 * @param end - End value
 * @param t - Interpolation factor (0 to 1)
 * @returns Interpolated value
 */
function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Calculates gradient color for a snake segment based on its position.
 *
 * @param index - Segment index in snake array
 * @param totalSegments - Total number of segments
 * @returns Hex color string for this segment
 */
function getSegmentColor(index: number, totalSegments: number): string {
  // Head (index 0) uses brightest color
  if (index === 0) {
    return RENDER_COLORS.snakeHead;
  }

  // Calculate interpolation factor (0 at head, 1 at tail)
  const t = (index - 1) / Math.max(totalSegments - 2, 1);

  // Parse hex colors to RGB
  const bodyRgb = parseInt(RENDER_COLORS.snakeBody.slice(1), 16);
  const endRgb = parseInt(RENDER_COLORS.snakeBodyEnd.slice(1), 16);

  const bodyR = (bodyRgb >> 16) & 0xff;
  const bodyG = (bodyRgb >> 8) & 0xff;
  const bodyB = bodyRgb & 0xff;

  const endR = (endRgb >> 16) & 0xff;
  const endG = (endRgb >> 8) & 0xff;
  const endB = endRgb & 0xff;

  // Interpolate RGB components
  const r = Math.round(lerp(bodyR, endR, t));
  const g = Math.round(lerp(bodyG, endG, t));
  const b = Math.round(lerp(bodyB, endB, t));

  // Convert back to hex
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Renders the snake head with eyes based on direction.
 *
 * This function draws the snake head segment with directional eyes
 * to indicate movement direction. The head uses the brightest green color.
 *
 * @param ctx - Canvas 2D rendering context
 * @param head - Head segment position
 * @param direction - Current movement direction
 *
 * @description
 * - Draws head with RENDER_COLORS.snakeHead color
 * - Adds eyes based on direction (up, down, left, right)
 * - Eyes are small circles positioned according to direction
 * - Head is same size as body segments (for consistent grid alignment)
 *
 * @example
 * ```ts
 * const head = { x: 10, y: 10 }
 * renderSnakeHead(ctx, head, 'right') // Draws head with eyes facing right
 * ```
 */
export function renderSnakeHead(
  ctx: CanvasRenderingContext2D,
  head: { x: number; y: number },
  direction: 'up' | 'down' | 'left' | 'right'
): void {
  const pixelX = head.x * CELL_SIZE;
  const pixelY = head.y * CELL_SIZE;

  // Draw head
  ctx.fillStyle = RENDER_COLORS.snakeHead;
  ctx.fillRect(pixelX + 1, pixelY + 1, CELL_SIZE - 2, CELL_SIZE - 2);

  // Draw eyes
  ctx.fillStyle = '#000000'; // Black eyes
  const eyeRadius = 2;
  const eyeOffset = CELL_SIZE / 3;

  let eye1X = pixelX + CELL_SIZE / 2;
  let eye1Y = pixelY + CELL_SIZE / 2;
  let eye2X = pixelX + CELL_SIZE / 2;
  let eye2Y = pixelY + CELL_SIZE / 2;

  // Position eyes based on direction
  if (direction === 'right') {
    eye1X += eyeOffset;
    eye1Y -= eyeOffset / 2;
    eye2X += eyeOffset;
    eye2Y += eyeOffset / 2;
  } else if (direction === 'left') {
    eye1X -= eyeOffset;
    eye1Y -= eyeOffset / 2;
    eye2X -= eyeOffset;
    eye2Y += eyeOffset / 2;
  } else if (direction === 'up') {
    eye1X -= eyeOffset / 2;
    eye1Y -= eyeOffset;
    eye2X += eyeOffset / 2;
    eye2Y -= eyeOffset;
  } else if (direction === 'down') {
    eye1X -= eyeOffset / 2;
    eye1Y += eyeOffset;
    eye2X += eyeOffset / 2;
    eye2Y += eyeOffset;
  }

  // Draw eyes
  ctx.beginPath();
  ctx.arc(eye1X, eye1Y, eyeRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(eye2X, eye2Y, eyeRadius, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Renders the snake body segments with gradient coloring.
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
 * - Applies gradient color using getSegmentColor()
 * - Draws rounded rectangle (using fillRect for simplicity)
 * - Head rendering is handled separately (renderSnakeHead)
 *
 * @example
 * ```ts
 * const snake = [
 *   { x: 10, y: 10 }, // head
 *   { x: 9, y: 10 },  // body
 *   { x: 8, y: 10 }   // tail
 * ]
 * renderSnakeBody(ctx, snake) // Draws 2 body segments with gradient
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

    // Apply gradient color
    const segmentColor = getSegmentColor(i, snake.length);

    // Draw segment as rounded rectangle
    ctx.fillStyle = segmentColor;
    ctx.fillRect(pixelX + 1, pixelY + 1, CELL_SIZE - 2, CELL_SIZE - 2);
  }
}

/**
 * Renders snake body with animated segment scaling.
 *
 * This function adds subtle scale variation to snake segments using a sine wave
 * to create an organic movement effect. The animation is optional and can be
 * disabled for performance.
 *
 * @param ctx - Canvas 2D rendering context
 * @param snake - Array of snake segments
 * @param time - Current time in milliseconds (for animation)
 * @param enableAnimation - Whether to apply animation (default: true)
 *
 * @description
 * - Uses sine wave for smooth scale variation
 * - Animation phase is based on segment index and time
 * - Scale varies subtly (0.95 to 1.05)
 * - Falls back to static rendering if animation disabled
 *
 * @example
 * ```ts
 * const snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }]
 * const time = performance.now()
 * renderSnakeBodyAnimated(ctx, snake, time) // Animated segments
 * renderSnakeBodyAnimated(ctx, snake, time, false) // Static segments
 * ```
 */
export function renderSnakeBodyAnimated(
  ctx: CanvasRenderingContext2D,
  snake: Array<{ x: number; y: number }>,
  time: number,
  enableAnimation = true
): void {
  // Skip head (index 0), render only body segments
  for (let i = 1; i < snake.length; i++) {
    const segment = snake[i];
    const pixelX = segment.x * CELL_SIZE;
    const pixelY = segment.y * CELL_SIZE;

    // Apply gradient color
    const segmentColor = getSegmentColor(i, snake.length);

    // Calculate scale variation if animation enabled
    let scale = 1.0;
    if (enableAnimation) {
      const frequency = 0.002; // Animation speed
      const amplitude = 0.05; // Scale variation (5%)
      const phase = i * 0.5; // Offset per segment
      scale = 1.0 + Math.sin(time * frequency + phase) * amplitude;
    }

    // Draw segment with scale
    const scaledSize = (CELL_SIZE - 2) * scale;
    const offset = (CELL_SIZE - 2 - scaledSize) / 2;

    ctx.fillStyle = segmentColor;
    ctx.fillRect(pixelX + 1 + offset, pixelY + 1 + offset, scaledSize, scaledSize);
  }
}
