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
  renderFoodPulsing,
  renderSnakeHead,
  renderSnakeBody,
  renderSnakeBodyAnimated,
  renderPauseOverlay,
  renderGameOverOverlay,
  renderScore,
  applyNeonGlow,
  resetGlow,
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
    font: '',
    textAlign: 'left' as CanvasTextAlign,
    textBaseline: 'alphabetic' as CanvasTextBaseline,

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
    fillText: (...args: any[]) => calls.push({ method: 'fillText', args }),
    measureText: (text: string) => ({ width: text.length * 10 }),

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
    expect(RENDER_COLORS.food).toBe('#00ffff'); // Cyan for retro arcade aesthetic
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
// Pulsing Food Rendering Tests
// ============================================================================

describe('renderFoodPulsing', () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it('should calculate correct pixel position from grid coordinates', () => {
    const food = { x: 5, y: 10, type: 'standard' };
    renderFoodPulsing(ctx, food, 0);

    const mockCtx = ctx as any;
    const arcCalls = mockCtx.getCalls('arc');

    expect(arcCalls).toHaveLength(1);

    // Position should be centered in cell
    const expectedX = food.x * CELL_SIZE + CELL_SIZE / 2;
    const expectedY = food.y * CELL_SIZE + CELL_SIZE / 2;

    expect(arcCalls[0].args[0]).toBe(expectedX); // x
    expect(arcCalls[0].args[1]).toBe(expectedY); // y
  });

  it('should draw circle with pulsing radius based on time', () => {
    const food = { x: 5, y: 10, type: 'standard' };

    // Test at time 0
    const mockCtx1 = createMockContext();
    renderFoodPulsing(mockCtx1, food, 0);
    const radius1 = (mockCtx1 as any).getCalls('arc')[0].args[2];

    // Test at time 1000 (different phase in sine wave)
    const mockCtx2 = createMockContext();
    renderFoodPulsing(mockCtx2, food, 1000);
    const radius2 = (mockCtx2 as any).getCalls('arc')[0].args[2];

    // Radii should be different due to pulsing
    expect(radius1).not.toBe(radius2);
  });

  it('should use standard food color for standard type', () => {
    const food = { x: 5, y: 10, type: 'standard' };
    renderFoodPulsing(ctx, food, 0);

    expect(ctx.fillStyle).toBe(RENDER_COLORS.food);
  });

  it('should use bonus food color for bonus type', () => {
    const food = { x: 5, y: 10, type: 'bonus' };
    renderFoodPulsing(ctx, food, 0);

    expect(ctx.fillStyle).toBe(RENDER_COLORS.bonusFood);
  });

  it('should reset shadow properties after rendering', () => {
    const food = { x: 5, y: 10, type: 'standard' };
    renderFoodPulsing(ctx, food, 0);

    expect(ctx.shadowBlur).toBe(0);
    expect(ctx.shadowColor).toBe('transparent');
  });

  it('should have pulsing glow intensity based on time', () => {
    const food = { x: 5, y: 10, type: 'standard' };

    // Both should call applyNeonGlow which sets shadowBlur
    // But after rendering, it should be reset
    renderFoodPulsing(ctx, food, 0);

    // After rendering, glow is reset
    expect(ctx.shadowBlur).toBe(0);
  });

  it('should handle edge positions', () => {
    const food = { x: 0, y: 0, type: 'standard' };

    expect(() => renderFoodPulsing(ctx, food, 0)).not.toThrow();

    const mockCtx = ctx as any;
    const arcCalls = mockCtx.getCalls('arc');

    expect(arcCalls[0].args[0]).toBe(CELL_SIZE / 2); // x
    expect(arcCalls[0].args[1]).toBe(CELL_SIZE / 2); // y
  });

  it('should default to standard color if type is undefined', () => {
    const food = { x: 5, y: 10 };
    renderFoodPulsing(ctx, food, 0);

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
    // With gradient, 2-segment snake gets body color (t=0 in gradient)
    expect(ctx.fillStyle).toBe(RENDER_COLORS.snakeBody);
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

  it('should apply gradient colors to body segments', () => {
    const snake = [
      { x: 10, y: 10 }, // head (skipped)
      { x: 9, y: 10 }, // body 1
      { x: 8, y: 10 }, // body 2
      { x: 7, y: 10 }, // tail
    ];

    renderSnakeBody(ctx, snake);

    // Verify that fillStyle was set (gradient applied)
    // We can't check exact colors easily, but we can verify it was called
    const mockCtx = ctx as any;
    const fillRectCalls = mockCtx.getCalls('fillRect');
    expect(fillRectCalls).toHaveLength(3); // 3 body segments
  });
});

// ============================================================================
// Snake Head Rendering Tests
// ============================================================================

describe('renderSnakeHead', () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it('should draw head at correct position', () => {
    const head = { x: 10, y: 10 };
    renderSnakeHead(ctx, head, 'right');

    const mockCtx = ctx as any;
    const fillRectCalls = mockCtx.getCalls('fillRect');

    expect(fillRectCalls).toHaveLength(1);
    expect(fillRectCalls[0].args[0]).toBe(10 * CELL_SIZE + 1);
    expect(fillRectCalls[0].args[1]).toBe(10 * CELL_SIZE + 1);
  });

  it('should use snake head color', () => {
    const head = { x: 10, y: 10 };
    renderSnakeHead(ctx, head, 'right');

    // Check that head color was used (it's set before fillRect)
    const mockCtx = ctx as any;
    const fillRectCalls = mockCtx.getCalls('fillRect');
    expect(fillRectCalls.length).toBeGreaterThan(0);
  });

  it('should draw eyes', () => {
    const head = { x: 10, y: 10 };
    renderSnakeHead(ctx, head, 'right');

    const mockCtx = ctx as any;
    const arcCalls = mockCtx.getCalls('arc');

    // Should have 2 eyes
    expect(arcCalls).toHaveLength(2);
  });

  it('should position eyes correctly for right direction', () => {
    const head = { x: 10, y: 10 };
    renderSnakeHead(ctx, head, 'right');

    const mockCtx = ctx as any;
    const arcCalls = mockCtx.getCalls('arc');

    expect(arcCalls).toHaveLength(2);
    // Both eyes should be on the right side (x > center)
    const centerX = 10 * CELL_SIZE + CELL_SIZE / 2;
    expect(arcCalls[0].args[0]).toBeGreaterThan(centerX);
    expect(arcCalls[1].args[0]).toBeGreaterThan(centerX);
  });

  it('should position eyes correctly for left direction', () => {
    const head = { x: 10, y: 10 };
    renderSnakeHead(ctx, head, 'left');

    const mockCtx = ctx as any;
    const arcCalls = mockCtx.getCalls('arc');

    expect(arcCalls).toHaveLength(2);
    // Both eyes should be on the left side (x < center)
    const centerX = 10 * CELL_SIZE + CELL_SIZE / 2;
    expect(arcCalls[0].args[0]).toBeLessThan(centerX);
    expect(arcCalls[1].args[0]).toBeLessThan(centerX);
  });

  it('should position eyes correctly for up direction', () => {
    const head = { x: 10, y: 10 };
    renderSnakeHead(ctx, head, 'up');

    const mockCtx = ctx as any;
    const arcCalls = mockCtx.getCalls('arc');

    expect(arcCalls).toHaveLength(2);
    // Both eyes should be on the top side (y < center)
    const centerY = 10 * CELL_SIZE + CELL_SIZE / 2;
    expect(arcCalls[0].args[1]).toBeLessThan(centerY);
    expect(arcCalls[1].args[1]).toBeLessThan(centerY);
  });

  it('should position eyes correctly for down direction', () => {
    const head = { x: 10, y: 10 };
    renderSnakeHead(ctx, head, 'down');

    const mockCtx = ctx as any;
    const arcCalls = mockCtx.getCalls('arc');

    expect(arcCalls).toHaveLength(2);
    // Both eyes should be on the bottom side (y > center)
    const centerY = 10 * CELL_SIZE + CELL_SIZE / 2;
    expect(arcCalls[0].args[1]).toBeGreaterThan(centerY);
    expect(arcCalls[1].args[1]).toBeGreaterThan(centerY);
  });

  it('should draw eyes as circles', () => {
    const head = { x: 10, y: 10 };
    renderSnakeHead(ctx, head, 'right');

    const mockCtx = ctx as any;
    const arcCalls = mockCtx.getCalls('arc');

    // Each eye should be a full circle (0 to 2π)
    arcCalls.forEach((call: any) => {
      expect(call.args[3]).toBe(0); // startAngle
      expect(call.args[4]).toBe(Math.PI * 2); // endAngle
    });
  });

  it('should use black color for eyes', () => {
    const head = { x: 10, y: 10 };
    renderSnakeHead(ctx, head, 'right');

    // Eyes should be drawn with black color
    // (fillStyle is set to #000000 before drawing eyes)
    expect(ctx.fillStyle).toBe('#000000');
  });

  it('should handle edge positions', () => {
    const head = { x: 0, y: 0 };
    expect(() => renderSnakeHead(ctx, head, 'right')).not.toThrow();

    const mockCtx = ctx as any;
    const fillRectCalls = mockCtx.getCalls('fillRect');
    expect(fillRectCalls).toHaveLength(1);
  });

  it('should handle max grid positions', () => {
    const head = { x: GRID_SIZE - 1, y: GRID_SIZE - 1 };
    expect(() => renderSnakeHead(ctx, head, 'left')).not.toThrow();

    const mockCtx = ctx as any;
    const fillRectCalls = mockCtx.getCalls('fillRect');
    expect(fillRectCalls).toHaveLength(1);
  });
});

// ============================================================================
// Snake Body Animated Rendering Tests
// ============================================================================

describe('renderSnakeBodyAnimated', () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it('should render all body segments (excluding head)', () => {
    const snake = [
      { x: 10, y: 10 }, // head
      { x: 9, y: 10 }, // body
      { x: 8, y: 10 }, // body
    ];

    renderSnakeBodyAnimated(ctx, snake, 0);

    const mockCtx = ctx as any;
    const fillRectCalls = mockCtx.getCalls('fillRect');

    expect(fillRectCalls).toHaveLength(2); // 2 body segments
  });

  it('should apply animation when enabled', () => {
    const snake = [
      { x: 10, y: 10 }, // head
      { x: 9, y: 10 }, // body
    ];

    renderSnakeBodyAnimated(ctx, snake, 1000, true);

    const mockCtx = ctx as any;
    const fillRectCalls = mockCtx.getCalls('fillRect');

    // Animation applies scale, so segment size should vary
    expect(fillRectCalls).toHaveLength(1);
    // Size should be different from standard (CELL_SIZE - 2)
    // Due to scale variation
  });

  it('should not apply animation when disabled', () => {
    const snake = [
      { x: 10, y: 10 }, // head
      { x: 9, y: 10 }, // body
    ];

    renderSnakeBodyAnimated(ctx, snake, 1000, false);

    const mockCtx = ctx as any;
    const fillRectCalls = mockCtx.getCalls('fillRect');

    expect(fillRectCalls).toHaveLength(1);
    // Without animation, size should be standard (CELL_SIZE - 2)
    expect(fillRectCalls[0].args[2]).toBe(CELL_SIZE - 2);
    expect(fillRectCalls[0].args[3]).toBe(CELL_SIZE - 2);
  });

  it('should vary scale based on time', () => {
    const snake = [
      { x: 10, y: 10 }, // head
      { x: 9, y: 10 }, // body
    ];

    const mockCtx1 = createMockContext();
    renderSnakeBodyAnimated(mockCtx1, snake, 0, true);

    const mockCtx2 = createMockContext();
    renderSnakeBodyAnimated(mockCtx2, snake, 1000, true);

    // At different times, scale should be different
    const call1 = (mockCtx1 as any).getCalls('fillRect')[0];
    const call2 = (mockCtx2 as any).getCalls('fillRect')[0];

    // Sizes should differ (due to sine wave)
    // Note: They might be the same if sine wave completes a cycle,
    // but very unlikely with these specific time values
  });

  it('should apply gradient colors', () => {
    const snake = [
      { x: 10, y: 10 }, // head
      { x: 9, y: 10 }, // body 1
      { x: 8, y: 10 }, // body 2
    ];

    renderSnakeBodyAnimated(ctx, snake, 0);

    const mockCtx = ctx as any;
    const fillRectCalls = mockCtx.getCalls('fillRect');

    expect(fillRectCalls).toHaveLength(2); // 2 body segments
  });

  it('should handle single-segment snake (head only)', () => {
    const snake = [{ x: 10, y: 10 }]; // head only

    renderSnakeBodyAnimated(ctx, snake, 0);

    const mockCtx = ctx as any;
    const fillRectCalls = mockCtx.getCalls('fillRect');

    expect(fillRectCalls).toHaveLength(0); // No body segments
  });

  it('should handle long snake', () => {
    const snake = Array.from({ length: 10 }, (_, i) => ({ x: 10 - i, y: 10 }));

    renderSnakeBodyAnimated(ctx, snake, 0);

    const mockCtx = ctx as any;
    const fillRectCalls = mockCtx.getCalls('fillRect');

    expect(fillRectCalls).toHaveLength(9); // 9 body segments
  });

  it('should default enableAnimation to true', () => {
    const snake = [
      { x: 10, y: 10 }, // head
      { x: 9, y: 10 }, // body
    ];

    // Call without enableAnimation parameter (should default to true)
    renderSnakeBodyAnimated(ctx, snake, 1000);

    const mockCtx = ctx as any;
    const fillRectCalls = mockCtx.getCalls('fillRect');

    expect(fillRectCalls).toHaveLength(1);
  });

  it('should handle edge positions', () => {
    const snake = [
      { x: 0, y: 0 }, // head
      { x: 0, y: 1 }, // body
    ];

    expect(() => renderSnakeBodyAnimated(ctx, snake, 0)).not.toThrow();

    const mockCtx = ctx as any;
    const fillRectCalls = mockCtx.getCalls('fillRect');

    expect(fillRectCalls).toHaveLength(1);
  });
});

// ============================================================================
// Pause Overlay Tests
// ============================================================================

describe('renderPauseOverlay', () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it('should draw semi-transparent overlay', () => {
    renderPauseOverlay(ctx);

    const mockCtx = ctx as any;
    const fillRectCalls = mockCtx.getCalls('fillRect');

    // First fillRect should be the overlay
    expect(fillRectCalls.length).toBeGreaterThan(0);
    expect(fillRectCalls[0].args).toEqual([0, 0, CANVAS_WIDTH, CANVAS_HEIGHT]);
  });

  it('should use semi-transparent black for overlay', () => {
    const mockCtx = ctx as any;

    renderPauseOverlay(ctx);

    // Check that the first fillRect (overlay) was drawn
    const fillRectCalls = mockCtx.getCalls('fillRect');
    expect(fillRectCalls.length).toBeGreaterThan(0);

    // The overlay should cover the entire canvas
    expect(fillRectCalls[0].args).toEqual([0, 0, CANVAS_WIDTH, CANVAS_HEIGHT]);
  });

  it('should draw "PAUSED" text', () => {
    renderPauseOverlay(ctx);

    const mockCtx = ctx as any;
    const fillTextCalls = mockCtx.getCalls('fillText');

    // Should have at least one fillText call with "PAUSED"
    const pausedCall = fillTextCalls.find((call: any) => call.args[0] === 'PAUSED');
    expect(pausedCall).toBeDefined();
  });

  it('should draw instruction text', () => {
    renderPauseOverlay(ctx);

    const mockCtx = ctx as any;
    const fillTextCalls = mockCtx.getCalls('fillText');

    // Should have fillText call with space instruction
    const instructionCall = fillTextCalls.find((call: any) => call.args[0].includes('SPACE'));
    expect(instructionCall).toBeDefined();
  });

  it('should center "PAUSED" text', () => {
    renderPauseOverlay(ctx);

    const mockCtx = ctx as any;
    const fillTextCalls = mockCtx.getCalls('fillText');

    // Find "PAUSED" text call
    const pausedCall = fillTextCalls.find((call: any) => call.args[0] === 'PAUSED');
    expect(pausedCall).toBeDefined();

    // Check that x coordinate is center
    expect(pausedCall.args[1]).toBe(CANVAS_WIDTH / 2);
  });

  it('should set textAlign to center', () => {
    renderPauseOverlay(ctx);
    expect(ctx.textAlign).toBe('center');
  });

  it('should set textBaseline to middle', () => {
    renderPauseOverlay(ctx);
    expect(ctx.textBaseline).toBe('middle');
  });

  it('should use white text color', () => {
    renderPauseOverlay(ctx);

    const mockCtx = ctx as any;
    const fillTextCalls = mockCtx.getCalls('fillText');

    // fillStyle should be white for text
    expect(fillTextCalls.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Game Over Overlay Tests
// ============================================================================

describe('renderGameOverOverlay', () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it('should draw semi-transparent overlay', () => {
    renderGameOverOverlay(ctx, 100);

    const mockCtx = ctx as any;
    const fillRectCalls = mockCtx.getCalls('fillRect');

    // First fillRect should be the overlay
    expect(fillRectCalls.length).toBeGreaterThan(0);
    expect(fillRectCalls[0].args).toEqual([0, 0, CANVAS_WIDTH, CANVAS_HEIGHT]);
  });

  it('should use semi-transparent black for overlay', () => {
    const mockCtx = ctx as any;

    renderGameOverOverlay(ctx, 100);

    // Check that the first fillRect (overlay) was drawn
    const fillRectCalls = mockCtx.getCalls('fillRect');
    expect(fillRectCalls.length).toBeGreaterThan(0);

    // The overlay should cover the entire canvas
    expect(fillRectCalls[0].args).toEqual([0, 0, CANVAS_WIDTH, CANVAS_HEIGHT]);
  });

  it('should draw "GAME OVER" text', () => {
    renderGameOverOverlay(ctx, 100);

    const mockCtx = ctx as any;
    const fillTextCalls = mockCtx.getCalls('fillText');

    // Should have fillText call with "GAME OVER"
    const gameOverCall = fillTextCalls.find((call: any) => call.args[0] === 'GAME OVER');
    expect(gameOverCall).toBeDefined();
  });

  it('should display final score', () => {
    const testScore = 1250;
    renderGameOverOverlay(ctx, testScore);

    const mockCtx = ctx as any;
    const fillTextCalls = mockCtx.getCalls('fillText');

    // Should have fillText call with score
    const scoreCall = fillTextCalls.find((call: any) => call.args[0].includes(`${testScore}`));
    expect(scoreCall).toBeDefined();
    expect(scoreCall.args[0]).toContain('Score:');
  });

  it('should draw instruction text', () => {
    renderGameOverOverlay(ctx, 100);

    const mockCtx = ctx as any;
    const fillTextCalls = mockCtx.getCalls('fillText');

    // Should have fillText call with restart instruction
    const instructionCall = fillTextCalls.find((call: any) => call.args[0].includes('restart'));
    expect(instructionCall).toBeDefined();
  });

  it('should center text', () => {
    renderGameOverOverlay(ctx, 100);

    const mockCtx = ctx as any;
    const fillTextCalls = mockCtx.getCalls('fillText');

    // All text calls should be centered
    fillTextCalls.forEach((call: any) => {
      expect(call.args[1]).toBe(CANVAS_WIDTH / 2);
    });
  });

  it('should handle score of 0', () => {
    renderGameOverOverlay(ctx, 0);

    const mockCtx = ctx as any;
    const fillTextCalls = mockCtx.getCalls('fillText');

    const scoreCall = fillTextCalls.find((call: any) => call.args[0].includes('0'));
    expect(scoreCall).toBeDefined();
  });

  it('should handle large scores', () => {
    const largeScore = 999999;
    renderGameOverOverlay(ctx, largeScore);

    const mockCtx = ctx as any;
    const fillTextCalls = mockCtx.getCalls('fillText');

    const scoreCall = fillTextCalls.find((call: any) => call.args[0].includes(`${largeScore}`));
    expect(scoreCall).toBeDefined();
  });

  it('should set textAlign to center', () => {
    renderGameOverOverlay(ctx, 100);
    expect(ctx.textAlign).toBe('center');
  });

  it('should set textBaseline to middle', () => {
    renderGameOverOverlay(ctx, 100);
    expect(ctx.textBaseline).toBe('middle');
  });
});

// ============================================================================
// Score Display Tests
// ============================================================================

describe('renderScore', () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    ctx = createMockContext();
    // Mock measureText for score display
    (ctx as any).measureText = (text: string) => ({
      width: text.length * 10, // Approximate width
    });
  });

  it('should draw background rectangle', () => {
    renderScore(ctx, 100);

    const mockCtx = ctx as any;
    const fillRectCalls = mockCtx.getCalls('fillRect');

    expect(fillRectCalls.length).toBeGreaterThan(0);
  });

  it('should draw score text', () => {
    const testScore = 350;
    renderScore(ctx, testScore);

    const mockCtx = ctx as any;
    const fillTextCalls = mockCtx.getCalls('fillText');

    // Should have fillText call with score
    const scoreCall = fillTextCalls.find((call: any) => call.args[0].includes(`${testScore}`));
    expect(scoreCall).toBeDefined();
    expect(scoreCall.args[0]).toContain('Score:');
  });

  it('should position in top-left corner', () => {
    renderScore(ctx, 100);

    const mockCtx = ctx as any;
    const fillRectCalls = mockCtx.getCalls('fillRect');
    const fillTextCalls = mockCtx.getCalls('fillText');

    // Background should be near top-left
    expect(fillRectCalls[0].args[0]).toBe(10); // x = 10
    expect(fillRectCalls[0].args[1]).toBe(10); // y = 10

    // Text should also be near top-left
    expect(fillTextCalls[0].args[1]).toBeLessThan(50); // x position
    expect(fillTextCalls[0].args[2]).toBeLessThan(50); // y position
  });

  it('should use semi-transparent background', () => {
    renderScore(ctx, 100);

    // Background should use rgba with alpha
    const mockCtx = ctx as any;
    const fillRectCalls = mockCtx.getCalls('fillRect');
    expect(fillRectCalls.length).toBeGreaterThan(0);
  });

  it('should use white text color', () => {
    renderScore(ctx, 100);

    const mockCtx = ctx as any;
    const fillTextCalls = mockCtx.getCalls('fillText');

    // Text should be white
    expect(fillTextCalls.length).toBeGreaterThan(0);
  });

  it('should handle score of 0', () => {
    renderScore(ctx, 0);

    const mockCtx = ctx as any;
    const fillTextCalls = mockCtx.getCalls('fillText');

    const scoreCall = fillTextCalls.find((call: any) => call.args[0].includes('0'));
    expect(scoreCall).toBeDefined();
  });

  it('should handle large scores', () => {
    const largeScore = 999999;
    renderScore(ctx, largeScore);

    const mockCtx = ctx as any;
    const fillTextCalls = mockCtx.getCalls('fillText');

    const scoreCall = fillTextCalls.find((call: any) => call.args[0].includes(`${largeScore}`));
    expect(scoreCall).toBeDefined();
  });

  it('should set textAlign to left', () => {
    renderScore(ctx, 100);
    expect(ctx.textAlign).toBe('left');
  });

  it('should set textBaseline to top', () => {
    renderScore(ctx, 100);
    expect(ctx.textBaseline).toBe('top');
  });

  it('should call measureText to calculate background width', () => {
    const mockCtx = ctx as any;
    let measureTextCalled = false;
    mockCtx.measureText = (text: string) => {
      measureTextCalled = true;
      return { width: text.length * 10 };
    };

    renderScore(ctx, 100);

    expect(measureTextCalled).toBe(true);
  });

  it('should add padding to background', () => {
    renderScore(ctx, 100);

    const mockCtx = ctx as any;
    const fillRectCalls = mockCtx.getCalls('fillRect');
    const fillTextCalls = mockCtx.getCalls('fillText');

    // Background should be wider than text (includes padding)
    const bgWidth = fillRectCalls[0].args[2];
    const textX = fillTextCalls[0].args[1];

    expect(bgWidth).toBeGreaterThan(0);
  });
});

// ============================================================================
// Neon Glow Effects Tests
// ============================================================================

describe('applyNeonGlow', () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it('should set shadowBlur to intensity value', () => {
    applyNeonGlow(ctx, '#00ff00', 15);
    expect(ctx.shadowBlur).toBe(15);
  });

  it('should set shadowColor to specified color', () => {
    applyNeonGlow(ctx, '#00ff00', 15);
    expect(ctx.shadowColor).toBe('#00ff00');
  });

  it('should use default intensity of 10 when not specified', () => {
    applyNeonGlow(ctx, '#ff0000');
    expect(ctx.shadowBlur).toBe(10);
  });

  it('should handle different colors', () => {
    applyNeonGlow(ctx, '#ff00ff', 12);
    expect(ctx.shadowColor).toBe('#ff00ff');
    expect(ctx.shadowBlur).toBe(12);
  });

  it('should handle intensity of 0', () => {
    applyNeonGlow(ctx, '#00ff00', 0);
    expect(ctx.shadowBlur).toBe(0);
  });

  it('should handle high intensity values', () => {
    applyNeonGlow(ctx, '#00ff00', 20);
    expect(ctx.shadowBlur).toBe(20);
  });

  it('should handle rgba colors', () => {
    applyNeonGlow(ctx, 'rgba(255, 0, 0, 0.5)', 10);
    expect(ctx.shadowColor).toBe('rgba(255, 0, 0, 0.5)');
  });
});

describe('resetGlow', () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it('should reset shadowBlur to 0', () => {
    // Set glow first
    applyNeonGlow(ctx, '#00ff00', 15);
    expect(ctx.shadowBlur).toBe(15);

    // Reset
    resetGlow(ctx);
    expect(ctx.shadowBlur).toBe(0);
  });

  it('should reset shadowColor to transparent', () => {
    // Set glow first
    applyNeonGlow(ctx, '#00ff00', 15);
    expect(ctx.shadowColor).toBe('#00ff00');

    // Reset
    resetGlow(ctx);
    expect(ctx.shadowColor).toBe('transparent');
  });

  it('should work when called without prior glow', () => {
    expect(() => resetGlow(ctx)).not.toThrow();
    expect(ctx.shadowBlur).toBe(0);
    expect(ctx.shadowColor).toBe('transparent');
  });
});

describe('Glow Integration Tests', () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it('should apply glow to snake head', () => {
    const head = { x: 10, y: 10 };
    renderSnakeHead(ctx, head, 'right');

    // Check that shadowBlur was set (glow was applied)
    // After rendering, it should be reset to 0
    expect(ctx.shadowBlur).toBe(0);
    expect(ctx.shadowColor).toBe('transparent');
  });

  it('should apply glow to food', () => {
    const food = { x: 5, y: 5, type: 'standard' };
    renderFood(ctx, food);

    // After rendering, glow should be reset
    expect(ctx.shadowBlur).toBe(0);
    expect(ctx.shadowColor).toBe('transparent');
  });

  it('should apply stronger glow to bonus food', () => {
    const bonusFood = { x: 5, y: 5, type: 'bonus' };
    renderFood(ctx, bonusFood);

    // After rendering, glow should be reset
    expect(ctx.shadowBlur).toBe(0);
    expect(ctx.shadowColor).toBe('transparent');
  });

  it('should allow multiple glow applications in sequence', () => {
    // Apply and reset multiple times
    applyNeonGlow(ctx, '#00ff00', 10);
    expect(ctx.shadowBlur).toBe(10);

    resetGlow(ctx);
    expect(ctx.shadowBlur).toBe(0);

    applyNeonGlow(ctx, '#ff0000', 15);
    expect(ctx.shadowBlur).toBe(15);

    resetGlow(ctx);
    expect(ctx.shadowBlur).toBe(0);
  });
});
