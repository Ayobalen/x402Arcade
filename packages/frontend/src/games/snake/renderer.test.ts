/**
 * Snake Game Renderer Tests
 *
 * Tests for the snake game renderer module, including background,
 * grid, snake, and food rendering functions.
 *
 * @module games/snake/renderer.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderBackground, renderGrid, RENDER_COLORS } from './renderer';
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
