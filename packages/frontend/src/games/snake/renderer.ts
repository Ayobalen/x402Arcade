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
  getThemeColors,
} from './constants';

// ============================================================================
// Color Constants
// ============================================================================

/**
 * Gets rendering colors dynamically from current theme.
 * This function reads CSS custom properties to support theme switching.
 *
 * @description Colors now sync with theme system:
 * - Background: From design system
 * - Grid: From design system
 * - Snake: Theme primary color
 * - Food: Theme primary color
 * - Bonus Food: Theme secondary color
 * - Accents: Theme colors
 */
export function getRenderColors() {
  const theme = getThemeColors();

  return {
    /** Main background color */
    background: GRID_COLORS.background,
    /** Grid line color (subtle) */
    gridLine: GRID_COLORS.gridLine,
    /** Border color */
    border: GRID_COLORS.border,
    /** Snake head color - uses theme primary */
    snakeHead: theme.primary,
    /** Snake body color - slightly darker theme primary */
    snakeBody: theme.primary,
    /** Snake body gradient end - darker theme primary */
    snakeBodyEnd: adjustBrightness(theme.primary, -30),
    /** Snake outline */
    snakeOutline: adjustBrightness(theme.primary, -50),
    /** Standard food color - theme primary */
    food: theme.primary,
    /** Bonus food color - theme secondary */
    bonusFood: theme.secondary,
    /** Food glow effect */
    foodGlow: theme.primaryGlow,
  };
}

/**
 * Helper to adjust hex color brightness.
 * @param hex - Hex color string (e.g., '#00ffff')
 * @param amount - Brightness adjustment (-100 to 100)
 * @returns Adjusted hex color
 */
function adjustBrightness(hex: string, amount: number): string {
  // Remove # if present
  const color = hex.replace('#', '');

  // Parse RGB components
  const r = Math.max(0, Math.min(255, parseInt(color.substring(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(color.substring(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(color.substring(4, 6), 16) + amount));

  // Convert back to hex
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Legacy RENDER_COLORS for backward compatibility.
 * @deprecated Use getRenderColors() for theme support
 */
export const RENDER_COLORS = {
  background: GRID_COLORS.background,
  gridLine: GRID_COLORS.gridLine,
  border: GRID_COLORS.border,
  snakeHead: SNAKE_COLORS.head,
  snakeBody: SNAKE_COLORS.body,
  snakeBodyEnd: SNAKE_COLORS.bodyEnd,
  snakeOutline: SNAKE_COLORS.outline,
  food: FOOD_COLORS.standard,
  bonusFood: FOOD_COLORS.bonus,
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
  const colors = getRenderColors();
  ctx.fillStyle = colors.background;
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
  const colors = getRenderColors();
  ctx.strokeStyle = colors.gridLine;
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
 * to create circular shapes. Standard food is cyan, bonus food is magenta.
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
 * renderFood(ctx, food) // Draws cyan circle at grid position (10, 15)
 * ```
 */
export function renderFood(
  ctx: CanvasRenderingContext2D,
  food: { x: number; y: number; type?: string }
): void {
  const colors = getRenderColors();

  // Calculate pixel position (center of cell)
  const pixelX = food.x * CELL_SIZE + CELL_SIZE / 2;
  const pixelY = food.y * CELL_SIZE + CELL_SIZE / 2;
  const radius = CELL_SIZE / 3;

  // Determine color based on food type (now theme-aware)
  const foodColor = food.type === 'bonus' ? colors.bonusFood : colors.food;

  // Apply neon glow effect (stronger for bonus food)
  const glowIntensity = food.type === 'bonus' ? 15 : 10;
  applyNeonGlow(ctx, foodColor, glowIntensity);

  // Draw food circle
  ctx.fillStyle = foodColor;
  ctx.beginPath();
  ctx.arc(pixelX, pixelY, radius, 0, Math.PI * 2);
  ctx.fill();

  // Reset glow effect
  resetGlow(ctx);
}

/**
 * Renders a food item with pulsing animation effect.
 *
 * This function draws food items with a pulsing scale animation that makes
 * them appear to "breathe". The animation creates an appealing visual effect
 * that draws player attention to the food.
 *
 * @param ctx - Canvas 2D rendering context
 * @param food - Food object with position and type
 * @param time - Current time in milliseconds (for animation)
 *
 * @description
 * - Uses sine wave for smooth pulsing effect
 * - Pulse frequency: 2 cycles per second
 * - Scale variation: 0.85 to 1.15 (15% variation)
 * - Glow intensity also pulses with the size
 * - Creates an "inviting" visual effect for the food
 *
 * @example
 * ```ts
 * const food: Food = { x: 10, y: 15, type: 'standard', points: 10, hasEffect: false }
 * const time = performance.now()
 * renderFoodPulsing(ctx, food, time) // Draws pulsing cyan circle
 * ```
 */
export function renderFoodPulsing(
  ctx: CanvasRenderingContext2D,
  food: { x: number; y: number; type?: string },
  time: number
): void {
  const colors = getRenderColors();

  // Calculate pixel position (center of cell)
  const pixelX = food.x * CELL_SIZE + CELL_SIZE / 2;
  const pixelY = food.y * CELL_SIZE + CELL_SIZE / 2;

  // Calculate pulsing animation
  // frequency: 0.004 = ~2 cycles per second (1000ms / 0.004 / 2π ≈ 400ms per cycle)
  const frequency = 0.004;
  const amplitude = 0.15; // 15% size variation
  const pulsePhase = Math.sin(time * frequency);
  const scale = 1 + pulsePhase * amplitude;

  // Base radius with pulse scaling
  const baseRadius = CELL_SIZE / 3;
  const radius = baseRadius * scale;

  // Determine color based on food type (now theme-aware)
  const foodColor = food.type === 'bonus' ? colors.bonusFood : colors.food;

  // Glow intensity also pulses (stronger when larger)
  const baseGlow = food.type === 'bonus' ? 15 : 10;
  const glowIntensity = baseGlow + (pulsePhase + 1) * 3; // Range: baseGlow to baseGlow+6
  applyNeonGlow(ctx, foodColor, glowIntensity);

  // Draw food circle with pulsing radius
  ctx.fillStyle = foodColor;
  ctx.beginPath();
  ctx.arc(pixelX, pixelY, radius, 0, Math.PI * 2);
  ctx.fill();

  // Reset glow effect
  resetGlow(ctx);
}

// ============================================================================
// Glow Effects
// ============================================================================

/**
 * Applies neon glow effect to canvas context.
 *
 * This helper function sets shadow properties to create a neon glow effect
 * matching the retro arcade aesthetic. The glow color should match the
 * element being drawn.
 *
 * @param ctx - Canvas 2D rendering context
 * @param color - Hex color for the glow (e.g., '#00ff00' for green)
 * @param intensity - Glow intensity (0-20, default: 10)
 *
 * @description
 * - Sets shadowBlur to intensity value
 * - Sets shadowColor to match element color
 * - Creates soft neon glow around rendered shapes
 * - Should be reset after rendering with resetGlow()
 *
 * @example
 * ```ts
 * applyNeonGlow(ctx, '#00ff00', 15) // Bright green glow
 * ctx.fillRect(x, y, w, h) // Element will have glow
 * resetGlow(ctx) // Clean up for next element
 * ```
 */
export function applyNeonGlow(ctx: CanvasRenderingContext2D, color: string, intensity = 10): void {
  ctx.shadowBlur = intensity;
  ctx.shadowColor = color;
}

/**
 * Resets glow effects on canvas context.
 *
 * This helper function clears shadow properties after rendering
 * glowing elements to prevent glow from affecting other elements.
 *
 * @param ctx - Canvas 2D rendering context
 *
 * @example
 * ```ts
 * applyNeonGlow(ctx, '#00ff00', 15)
 * ctx.fillRect(x, y, w, h)
 * resetGlow(ctx) // Clear shadow properties
 * ```
 */
export function resetGlow(ctx: CanvasRenderingContext2D): void {
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
 * Now theme-aware using getRenderColors().
 *
 * @param index - Segment index in snake array
 * @param totalSegments - Total number of segments
 * @returns Hex color string for this segment
 */
function getSegmentColor(index: number, totalSegments: number): string {
  const colors = getRenderColors();

  // Head (index 0) uses brightest color
  if (index === 0) {
    return colors.snakeHead;
  }

  // Calculate interpolation factor (0 at head, 1 at tail)
  const t = (index - 1) / Math.max(totalSegments - 2, 1);

  // Parse hex colors to RGB
  const bodyRgb = parseInt(colors.snakeBody.slice(1), 16);
  const endRgb = parseInt(colors.snakeBodyEnd.slice(1), 16);

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
  const colors = getRenderColors();
  const pixelX = head.x * CELL_SIZE;
  const pixelY = head.y * CELL_SIZE;

  // Apply neon glow effect to head (theme-aware)
  applyNeonGlow(ctx, colors.snakeHead, 12);

  // Draw head with theme color
  ctx.fillStyle = colors.snakeHead;
  ctx.fillRect(pixelX + 1, pixelY + 1, CELL_SIZE - 2, CELL_SIZE - 2);

  // Reset glow before drawing eyes
  resetGlow(ctx);

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

// ============================================================================
// Overlay Rendering
// ============================================================================

/**
 * Renders the pause overlay with semi-transparent background and text.
 *
 * This function displays a pause screen over the game with a dark overlay
 * and centered text prompting the player to resume.
 *
 * @param ctx - Canvas 2D rendering context
 *
 * @description
 * - Fills canvas with semi-transparent black (#000000 at 70% opacity)
 * - Displays "PAUSED" text in center of canvas
 * - Shows "Press SPACE to continue" instruction below
 * - Uses white text for visibility against dark overlay
 * - Uses large font for "PAUSED" (48px) and smaller for instruction (20px)
 *
 * @example
 * ```ts
 * if (isPaused) {
 *   renderPauseOverlay(ctx)
 * }
 * ```
 */
export function renderPauseOverlay(ctx: CanvasRenderingContext2D): void {
  // Draw semi-transparent overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Draw "PAUSED" text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);

  // Draw instruction text
  ctx.font = '20px Inter, sans-serif';
  ctx.fillText('Press SPACE to continue', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

/**
 * Renders the game over overlay with final score.
 *
 * This function displays a game over screen with the player's final score
 * and prompts them to restart.
 *
 * @param ctx - Canvas 2D rendering context
 * @param score - Final score to display
 *
 * @description
 * - Fills canvas with semi-transparent black (#000000 at 70% opacity)
 * - Displays "GAME OVER" text in center
 * - Shows final score below game over text
 * - Shows "Press SPACE to restart" instruction at bottom
 * - Uses neon red accent for game over text (#ff0000)
 * - Uses white for score and instruction text
 *
 * @example
 * ```ts
 * if (isGameOver) {
 *   renderGameOverOverlay(ctx, 1250)
 * }
 * ```
 */
export function renderGameOverOverlay(ctx: CanvasRenderingContext2D, score: number): void {
  // Draw semi-transparent overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Draw "GAME OVER" text
  ctx.fillStyle = '#ff0000'; // Neon red for game over
  ctx.font = 'bold 48px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);

  // Draw score
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px Inter, sans-serif';
  ctx.fillText(`Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);

  // Draw instruction text
  ctx.font = '20px Inter, sans-serif';
  ctx.fillText('Press SPACE to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}

/**
 * Renders the current score display in the top-left corner.
 *
 * This function displays the player's current score during gameplay
 * with a semi-transparent background for readability.
 *
 * @param ctx - Canvas 2D rendering context
 * @param score - Current score to display
 *
 * @description
 * - Positions in top-left corner with padding (10px from edges)
 * - Draws semi-transparent background rectangle for readability
 * - Displays score with "Score: " prefix
 * - Uses white text on dark background
 * - Updates every frame during gameplay
 * - Font size: 20px for easy reading
 *
 * @example
 * ```ts
 * // In game loop
 * renderBackground(ctx)
 * renderGrid(ctx)
 * renderSnake(ctx, snake)
 * renderFood(ctx, food)
 * renderScore(ctx, currentScore) // Always render score on top
 * ```
 */
export function renderScore(ctx: CanvasRenderingContext2D, score: number): void {
  // Measure text to calculate background size
  ctx.font = '20px Inter, sans-serif';
  const text = `Score: ${score}`;
  const textMetrics = ctx.measureText(text);
  const textWidth = textMetrics.width;

  // Draw background rectangle
  const padding = 8;
  const bgX = 10;
  const bgY = 10;
  const bgWidth = textWidth + padding * 2;
  const bgHeight = 30;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(bgX, bgY, bgWidth, bgHeight);

  // Draw score text
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(text, bgX + padding, bgY + 5);
}
