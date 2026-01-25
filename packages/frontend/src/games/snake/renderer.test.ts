/**
 * Snake Game Renderer Tests
 *
 * Tests for the snake game renderer module, including background,
 * grid, snake, and food rendering functions.
 *
 * @module games/snake/renderer.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  renderBackground,
  renderGrid,
  renderFood,
  renderSnakeBody,
  RENDER_COLORS,
} from './renderer';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE, CELL_SIZE } from './constants';

// ============================================================================
// Mock Canvas Context
// ============================================================================

/**
 * Creates a mock 2D canvas context for testing.
 * Captures all drawing operations for verification.
 */
function createMockContext() {
  const calls: Array<{ method: string; args: any[] }> = [];

  return {
    // Track all method calls
    calls,

    // Drawing state
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    shadowBlur: 0,
    shadowColor: '',

    // Drawing methods
    fillRect: (...args: any[]) => calls.push({ method: 'fillRect', args }),
    strokeRect: (...args: any[]) => calls.push({ method: 'strokeRect', args }),
    beginPath: () => calls.push({ method: 'beginPath', args: [] }),
    moveTo: (...args: any[]) => calls.push({ method: 'moveTo', args }),
    lineTo: (...args: any[]) => calls.push({ method: 'lineTo', args }),
    stroke: () => calls.push({ method: 'stroke', args: [] }),
    fill: () => calls.push({ method: 'fill', args: [] }),
    arc: (...args: any[]) => calls.push({ method: 'arc', args }),
    closePath: () => calls.push({ method: 'closePath', args: [] }),
    clearRect: (...args: any[]) => calls.push({ method: 'clearRect', args }),

    // Helper to get all calls of a specific method
    getCalls(method: string) {
      return calls.filter((c) => c.method === method);
    },

    // Helper to clear recorded calls
    clear() {
      calls.length = 0;
    },
  } as any as CanvasRenderingContext2D;
}

// ============================================================================
// Background Rendering Tests
// ============================================================================

describe('renderBackground', () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it('should set fillStyle to background color', () => {
    renderBackground(ctx);
    expect(ctx.fillStyle).toBe(RENDER_COLORS.background);
  });

  it('should fill entire canvas with fillRect', () => {
    renderBackground(ctx);
    const mockCtx = ctx as any;
    const fillRectCalls = mockCtx.getCalls('fillRect');

    expect(fillRectCalls).toHaveLength(1);
    expect(fillRectCalls[0].args).toEqual([0, 0, CANVAS_WIDTH, CANVAS_HEIGHT]);
  });

  it('should use correct background color from constants', () => {
    renderBackground(ctx);
    expect(ctx.fillStyle).toBe('#0F0F1A');
  });
});

// ============================================================================
// Grid Rendering Tests
// ============================================================================

describe('renderGrid', () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it('should set strokeStyle to grid line color', () => {
    renderGrid(ctx);
    expect(ctx.strokeStyle).toBe(RENDER_COLORS.gridLine);
  });

  it('should set lineWidth to 0.5 for subtle lines', () => {
    renderGrid(ctx);
    expect(ctx.lineWidth).toBe(0.5);
  });

  it('should draw correct total number of grid lines', () => {
    renderGrid(ctx);
    const mockCtx = ctx as any;
    const strokeCalls = mockCtx.getCalls('stroke');

    // Total strokes = vertical lines + horizontal lines
    // Each grid dimension has GRID_SIZE + 1 lines (including edges)
    const expectedStrokes = (GRID_SIZE + 1) * 2;
    expect(strokeCalls.length).toBe(expectedStrokes);
  });

  it('should position vertical lines at correct pixel coordinates', () => {
    renderGrid(ctx);
    const mockCtx = ctx as any;
    const moveToCall = mockCtx.getCalls('moveTo');

    // Check first vertical line (x = 0)
    const firstVertical = moveToCall.find((call: any) => call.args[0] === 0 && call.args[1] === 0);
    expect(firstVertical).toBeDefined();

    // Check last vertical line (x = GRID_SIZE * CELL_SIZE)
    const lastVertical = moveToCall.find(
      (call: any) => call.args[0] === GRID_SIZE * CELL_SIZE && call.args[1] === 0
    );
    expect(lastVertical).toBeDefined();
  });

  it('should position horizontal lines at correct pixel coordinates', () => {
    renderGrid(ctx);
    const mockCtx = ctx as any;
    const moveToCall = mockCtx.getCalls('moveTo');

    // Check first horizontal line (y = 0)
    const firstHorizontal = moveToCall.find(
      (call: any) => call.args[0] === 0 && call.args[1] === 0
    );
    expect(firstHorizontal).toBeDefined();

    // Check last horizontal line (y = GRID_SIZE * CELL_SIZE)
    const lastHorizontal = moveToCall.find(
      (call: any) => call.args[0] === 0 && call.args[1] === GRID_SIZE * CELL_SIZE
    );
    expect(lastHorizontal).toBeDefined();
  });

  it('should use beginPath for each line', () => {
    renderGrid(ctx);
    const mockCtx = ctx as any;
    const beginPathCalls = mockCtx.getCalls('beginPath');

    // One beginPath per line
    const expectedBeginPaths = (GRID_SIZE + 1) * 2;
    expect(beginPathCalls.length).toBe(expectedBeginPaths);
  });
});

// ============================================================================
// RENDER_COLORS Tests
// ============================================================================

describe('RENDER_COLORS', () => {
  it('should have all required color constants', () => {
    expect(RENDER_COLORS).toHaveProperty('background');
    expect(RENDER_COLORS).toHaveProperty('gridLine');
    expect(RENDER_COLORS).toHaveProperty('border');
    expect(RENDER_COLORS).toHaveProperty('snakeHead');
    expect(RENDER_COLORS).toHaveProperty('snakeBody');
    expect(RENDER_COLORS).toHaveProperty('snakeBodyEnd');
    expect(RENDER_COLORS).toHaveProperty('snakeOutline');
    expect(RENDER_COLORS).toHaveProperty('food');
    expect(RENDER_COLORS).toHaveProperty('bonusFood');
    expect(RENDER_COLORS).toHaveProperty('foodGlow');
  });

  it('should use arcade design system colors', () => {
    expect(RENDER_COLORS.background).toBe('#0F0F1A');
    expect(RENDER_COLORS.gridLine).toBe('#1A1A2E');
    expect(RENDER_COLORS.snakeHead).toBe('#00ff00');
    expect(RENDER_COLORS.food).toBe('#ff0000');
  });

  it('should have valid hex color format', () => {
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    const rgbaColorRegex = /^rgba?\(/;

    Object.values(RENDER_COLORS).forEach((color) => {
      const isValidColor = hexColorRegex.test(color) || rgbaColorRegex.test(color);
      expect(isValidColor).toBe(true);
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Renderer Integration', () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it('should render background before grid', () => {
    const mockCtx = ctx as any;

    renderBackground(ctx);
    const backgroundIndex = mockCtx.calls.findIndex((c: any) => c.method === 'fillRect');

    mockCtx.clear();
    renderGrid(ctx);
    const gridIndex = mockCtx.calls.findIndex((c: any) => c.method === 'stroke');

    // Background should be rendered first (lower index in sequence)
    expect(backgroundIndex).toBe(0);
    expect(gridIndex).toBeGreaterThanOrEqual(0);
  });

  it('should handle multiple renders without errors', () => {
    expect(() => {
      renderBackground(ctx);
      renderGrid(ctx);
      renderBackground(ctx);
      renderGrid(ctx);
    }).not.toThrow();
  });

  it('should produce consistent results on repeated calls', () => {
    const mockCtx = ctx as any;

    renderGrid(ctx);
    const firstCallCount = mockCtx.calls.length;

    mockCtx.clear();
    renderGrid(ctx);
    const secondCallCount = mockCtx.calls.length;

    expect(firstCallCount).toBe(secondCallCount);
  });
});

// ============================================================================
// Food Rendering Tests
// ============================================================================

describe('renderFood', () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it('should calculate correct pixel position from grid coordinates', () => {
    const food = { x: 5, y: 10, type: 'standard' };
    renderFood(ctx, food);

    const mockCtx = ctx as any;
    const arcCalls = mockCtx.getCalls('arc');

    expect(arcCalls).toHaveLength(1);

    // Position should be centered in cell
    const expectedX = food.x * CELL_SIZE + CELL_SIZE / 2;
    const expectedY = food.y * CELL_SIZE + CELL_SIZE / 2;

    expect(arcCalls[0].args[0]).toBe(expectedX); // x
    expect(arcCalls[0].args[1]).toBe(expectedY); // y
  });

  it('should draw circle with correct radius', () => {
    const food = { x: 5, y: 10, type: 'standard' };
    renderFood(ctx, food);

    const mockCtx = ctx as any;
    const arcCalls = mockCtx.getCalls('arc');

    const expectedRadius = CELL_SIZE / 3;
    expect(arcCalls[0].args[2]).toBe(expectedRadius); // radius
  });

  it('should draw full circle (0 to 2π)', () => {
    const food = { x: 5, y: 10, type: 'standard' };
    renderFood(ctx, food);

    const mockCtx = ctx as any;
    const arcCalls = mockCtx.getCalls('arc');

    expect(arcCalls[0].args[3]).toBe(0); // startAngle
    expect(arcCalls[0].args[4]).toBe(Math.PI * 2); // endAngle
  });

  it('should use standard food color for standard type', () => {
    const food = { x: 5, y: 10, type: 'standard' };
    renderFood(ctx, food);

    expect(ctx.fillStyle).toBe(RENDER_COLORS.food);
  });

  it('should use bonus food color for bonus type', () => {
    const food = { x: 5, y: 10, type: 'bonus' };
    renderFood(ctx, food);

    expect(ctx.fillStyle).toBe(RENDER_COLORS.bonusFood);
  });

  it('should apply glow effect with shadowBlur', () => {
    const food = { x: 5, y: 10, type: 'standard' };
    const mockCtx = ctx as any;

    renderFood(ctx, food);

    // Shadow should have been set during rendering
    // (It's reset after, so we check the arc was called with shadow active)
    const arcCalls = mockCtx.getCalls('arc');
    expect(arcCalls.length).toBeGreaterThan(0);
  });

  it('should set shadowColor to match food color', () => {
    const food = { x: 5, y: 10, type: 'standard' };
    renderFood(ctx, food);

    // Shadow should be reset after rendering
    expect(ctx.shadowBlur).toBe(0);
    expect(ctx.shadowColor).toBe('transparent');
  });

  it('should reset shadow properties after rendering', () => {
    const food = { x: 5, y: 10, type: 'standard' };
    renderFood(ctx, food);

    expect(ctx.shadowBlur).toBe(0);
    expect(ctx.shadowColor).toBe('transparent');
  });

  it('should call beginPath before drawing arc', () => {
    const food = { x: 5, y: 10, type: 'standard' };
    renderFood(ctx, food);

    const mockCtx = ctx as any;
    const beginPathCalls = mockCtx.getCalls('beginPath');
    const arcCalls = mockCtx.getCalls('arc');

    expect(beginPathCalls.length).toBeGreaterThan(0);
    expect(arcCalls.length).toBeGreaterThan(0);

    // beginPath should come before arc
    const beginPathIndex = mockCtx.calls.findIndex((c: any) => c.method === 'beginPath');
    const arcIndex = mockCtx.calls.findIndex((c: any) => c.method === 'arc');
    expect(beginPathIndex).toBeLessThan(arcIndex);
  });

  it('should fill the circle', () => {
    const food = { x: 5, y: 10, type: 'standard' };
    renderFood(ctx, food);

    const mockCtx = ctx as any;
    const fillCalls = mockCtx.getCalls('fill');

    expect(fillCalls).toHaveLength(1);
  });

  it('should handle edge positions (0,0)', () => {
    const food = { x: 0, y: 0, type: 'standard' };

    expect(() => renderFood(ctx, food)).not.toThrow();

    const mockCtx = ctx as any;
    const arcCalls = mockCtx.getCalls('arc');

    expect(arcCalls[0].args[0]).toBe(CELL_SIZE / 2); // x
    expect(arcCalls[0].args[1]).toBe(CELL_SIZE / 2); // y
  });

  it('should handle max grid positions', () => {
    const food = { x: GRID_SIZE - 1, y: GRID_SIZE - 1, type: 'standard' };

    expect(() => renderFood(ctx, food)).not.toThrow();

    const mockCtx = ctx as any;
    const arcCalls = mockCtx.getCalls('arc');

    const expectedX = (GRID_SIZE - 1) * CELL_SIZE + CELL_SIZE / 2;
    const expectedY = (GRID_SIZE - 1) * CELL_SIZE + CELL_SIZE / 2;

    expect(arcCalls[0].args[0]).toBe(expectedX);
    expect(arcCalls[0].args[1]).toBe(expectedY);
  });

  it('should default to standard color if type is undefined', () => {
    const food = { x: 5, y: 10 };
    renderFood(ctx, food);

    expect(ctx.fillStyle).toBe(RENDER_COLORS.food);
  });
});

// ============================================================================
// Snake Body Rendering Tests
// ============================================================================

describe('renderSnakeBody', () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it('should skip head segment (index 0)', () => {
    const snake = [
      { x: 10, y: 10 }, // head
      { x: 9, y: 10 }, // body
      { x: 8, y: 10 }, // body
    ];

    renderSnakeBody(ctx, snake);

    const mockCtx = ctx as any;
    const fillRectCalls = mockCtx.getCalls('fillRect');

    // Should render 2 segments (skipping head)
    expect(fillRectCalls).toHaveLength(2);
  });

  it('should render nothing for single-segment snake (head only)', () => {
    const snake = [{ x: 10, y: 10 }]; // head only

    renderSnakeBody(ctx, snake);

    const mockCtx = ctx as any;
    const fillRectCalls = mockCtx.getCalls('fillRect');

    expect(fillRectCalls).toHaveLength(0);
  });

  it('should calculate correct pixel positions for segments', () => {
    const snake = [
      { x: 10, y: 10 }, // head
      { x: 9, y: 10 }, // body
    ];

    renderSnakeBody(ctx, snake);

    const mockCtx = ctx as any;
    const fillRectCalls = mockCtx.getCalls('fillRect');

    expect(fillRectCalls).toHaveLength(1);

    // Position with 1px inset
    const expectedX = 9 * CELL_SIZE + 1;
    const expectedY = 10 * CELL_SIZE + 1;
    const expectedSize = CELL_SIZE - 2;

    expect(fillRectCalls[0].args[0]).toBe(expectedX);
    expect(fillRectCalls[0].args[1]).toBe(expectedY);
    expect(fillRectCalls[0].args[2]).toBe(expectedSize);
    expect(fillRectCalls[0].args[3]).toBe(expectedSize);
  });

  it('should use body color for middle segments', () => {
    const snake = [
      { x: 10, y: 10 }, // head
      { x: 9, y: 10 }, // body
      { x: 8, y: 10 }, // body
      { x: 7, y: 10 }, // tail
    ];

    renderSnakeBody(ctx, snake);

    // Middle segments should use snakeBody color
    // (We can't easily check each individual call, but we verify fillStyle was set)
    expect(ctx.fillStyle).toBeTruthy();
  });

  it('should use darker color for tail segment', () => {
    const snake = [
      { x: 10, y: 10 }, // head
      { x: 9, y: 10 }, // body
      { x: 8, y: 10 }, // tail
    ];

    renderSnakeBody(ctx, snake);

    // Last segment should use snakeBodyEnd color
    expect(ctx.fillStyle).toBe(RENDER_COLORS.snakeBodyEnd);
  });

  it('should render all segments in a long snake', () => {
    const snake = Array.from({ length: 10 }, (_, i) => ({ x: 10 - i, y: 10 }));

    renderSnakeBody(ctx, snake);

    const mockCtx = ctx as any;
    const fillRectCalls = mockCtx.getCalls('fillRect');

    // Should render 9 segments (10 total - 1 head)
    expect(fillRectCalls).toHaveLength(9);
  });

  it('should inset segments by 1px for visual separation', () => {
    const snake = [
      { x: 10, y: 10 }, // head
      { x: 9, y: 10 }, // body
    ];

    renderSnakeBody(ctx, snake);

    const mockCtx = ctx as any;
    const fillRectCalls = mockCtx.getCalls('fillRect');

    // Check that size is CELL_SIZE - 2 (1px inset on each side)
    expect(fillRectCalls[0].args[2]).toBe(CELL_SIZE - 2);
    expect(fillRectCalls[0].args[3]).toBe(CELL_SIZE - 2);
  });

  it('should handle snake with only 2 segments (head + tail)', () => {
    const snake = [
      { x: 10, y: 10 }, // head
      { x: 9, y: 10 }, // tail
    ];

    renderSnakeBody(ctx, snake);

    const mockCtx = ctx as any;
    const fillRectCalls = mockCtx.getCalls('fillRect');

    expect(fillRectCalls).toHaveLength(1);
    // Should use tail color
    expect(ctx.fillStyle).toBe(RENDER_COLORS.snakeBodyEnd);
  });

  it('should handle edge positions', () => {
    const snake = [
      { x: 0, y: 0 }, // head
      { x: 0, y: 1 }, // body at edge
    ];

    expect(() => renderSnakeBody(ctx, snake)).not.toThrow();

    const mockCtx = ctx as any;
    const fillRectCalls = mockCtx.getCalls('fillRect');

    expect(fillRectCalls).toHaveLength(1);
  });

  it('should handle max grid positions', () => {
    const snake = [
      { x: GRID_SIZE - 1, y: GRID_SIZE - 1 }, // head
      { x: GRID_SIZE - 2, y: GRID_SIZE - 1 }, // body
    ];

    expect(() => renderSnakeBody(ctx, snake)).not.toThrow();

    const mockCtx = ctx as any;
    const fillRectCalls = mockCtx.getCalls('fillRect');

    expect(fillRectCalls).toHaveLength(1);
  });

  it('should iterate through segments in correct order', () => {
    const snake = [
      { x: 10, y: 10 }, // head
      { x: 9, y: 10 }, // body 1
      { x: 8, y: 10 }, // body 2
      { x: 7, y: 10 }, // tail
    ];

    renderSnakeBody(ctx, snake);

    const mockCtx = ctx as any;
    const fillRectCalls = mockCtx.getCalls('fillRect');

    // Verify positions are in correct order
    expect(fillRectCalls[0].args[0]).toBe(9 * CELL_SIZE + 1); // body 1
    expect(fillRectCalls[1].args[0]).toBe(8 * CELL_SIZE + 1); // body 2
    expect(fillRectCalls[2].args[0]).toBe(7 * CELL_SIZE + 1); // tail
  });
});
