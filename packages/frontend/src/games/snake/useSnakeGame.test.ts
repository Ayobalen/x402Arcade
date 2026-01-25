/**
 * useSnakeGame Hook Tests
 *
 * Tests for the Snake game custom React hook, including state initialization,
 * canvas context management, and control methods.
 *
 * @module games/snake/useSnakeGame.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSnakeGame } from './useSnakeGame';
import type { SnakeDifficulty } from './constants';

// ============================================================================
// Mock Canvas Context
// ============================================================================

/**
 * Create a mock canvas element with getContext method.
 */
function createMockCanvas() {
  const mockContext = {
    fillStyle: '',
    strokeStyle: '',
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 100 })),
    shadowBlur: 0,
    shadowColor: '',
    font: '',
    textAlign: 'left' as CanvasTextAlign,
    textBaseline: 'alphabetic' as CanvasTextBaseline,
  } as unknown as CanvasRenderingContext2D;

  const mockCanvas = {
    getContext: vi.fn(() => mockContext),
    width: 400,
    height: 400,
  } as unknown as HTMLCanvasElement;

  return { mockCanvas, mockContext };
}

// ============================================================================
// Hook State Initialization Tests
// ============================================================================

describe('useSnakeGame - State Initialization', () => {
  it('should initialize with menu state', () => {
    const { result } = renderHook(() => useSnakeGame());

    expect(result.current.state).toBeDefined();
    expect(result.current.state.isPlaying).toBe(false);
    expect(result.current.state.isGameOver).toBe(false);
  });

  it('should initialize with normal difficulty by default', () => {
    const { result } = renderHook(() => useSnakeGame());

    expect(result.current.state.gameSpecific.difficulty).toBe('normal');
  });

  it('should initialize with specified difficulty', () => {
    const { result } = renderHook(() => useSnakeGame('hard'));

    expect(result.current.state.gameSpecific.difficulty).toBe('hard');
  });

  it('should initialize with easy difficulty', () => {
    const { result } = renderHook(() => useSnakeGame('easy'));

    expect(result.current.state.gameSpecific.difficulty).toBe('easy');
  });

  it('should have initial score of 0', () => {
    const { result } = renderHook(() => useSnakeGame());

    expect(result.current.state.score).toBe(0);
  });

  it('should have initial level of 1', () => {
    const { result } = renderHook(() => useSnakeGame());

    expect(result.current.state.level).toBe(1);
  });

  it('should initialize state only once', () => {
    const { result, rerender } = renderHook(() => useSnakeGame());

    const firstState = result.current.state;

    // Rerender should not create new state
    rerender();

    const secondState = result.current.state;

    expect(firstState).toBe(secondState);
  });
});

// ============================================================================
// Canvas Context Tests
// ============================================================================

describe('useSnakeGame - Canvas Context', () => {
  it('should provide canvasRef', () => {
    const { result } = renderHook(() => useSnakeGame());

    expect(result.current.canvasRef).toBeDefined();
    expect(result.current.canvasRef.current).toBeNull(); // Not mounted yet
  });

  it('should initialize context as null', () => {
    const { result } = renderHook(() => useSnakeGame());

    expect(result.current.context).toBeNull();
  });

  it('should handle canvas context initialization', () => {
    const { result } = renderHook(() => useSnakeGame());

    // Initially context should be null (no canvas mounted)
    expect(result.current.context).toBeNull();

    // canvasRef should be ready to accept a canvas element
    expect(result.current.canvasRef).toBeDefined();
    expect(result.current.canvasRef.current).toBeNull();

    // Note: Full canvas mounting and context retrieval would require
    // a DOM environment with actual canvas element, which is tested
    // in integration tests. This unit test verifies the interface.
  });

  it('should return same canvasRef on rerender', () => {
    const { result, rerender } = renderHook(() => useSnakeGame());

    const firstRef = result.current.canvasRef;
    rerender();
    const secondRef = result.current.canvasRef;

    expect(firstRef).toBe(secondRef);
  });
});

// ============================================================================
// Reset Function Tests
// ============================================================================

describe('useSnakeGame - Reset Function', () => {
  it('should provide reset function', () => {
    const { result } = renderHook(() => useSnakeGame());

    expect(result.current.reset).toBeDefined();
    expect(typeof result.current.reset).toBe('function');
  });

  it('should reset state to menu state', () => {
    const { result } = renderHook(() => useSnakeGame());

    // Call reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.state.isPlaying).toBe(false);
    expect(result.current.state.isGameOver).toBe(false);
  });

  it('should preserve difficulty on reset', () => {
    const { result } = renderHook(() => useSnakeGame('hard'));

    // Call reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.state.gameSpecific.difficulty).toBe('hard');
  });

  it('should reset score to 0', () => {
    const { result } = renderHook(() => useSnakeGame());

    // Manually modify state score
    act(() => {
      result.current.state.score = 1000;
    });

    // Call reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.state.score).toBe(0);
  });

  it('should reset level to 1', () => {
    const { result } = renderHook(() => useSnakeGame());

    // Manually modify state level
    act(() => {
      result.current.state.level = 5;
    });

    // Call reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.state.level).toBe(1);
  });

  it('should be stable across rerenders', () => {
    const { result, rerender } = renderHook(() => useSnakeGame());

    const firstReset = result.current.reset;
    rerender();
    const secondReset = result.current.reset;

    expect(firstReset).toBe(secondReset);
  });
});

// ============================================================================
// Hook Return Interface Tests
// ============================================================================

describe('useSnakeGame - Return Interface', () => {
  it('should return state property', () => {
    const { result } = renderHook(() => useSnakeGame());

    expect(result.current).toHaveProperty('state');
  });

  it('should return canvasRef property', () => {
    const { result } = renderHook(() => useSnakeGame());

    expect(result.current).toHaveProperty('canvasRef');
  });

  it('should return context property', () => {
    const { result } = renderHook(() => useSnakeGame());

    expect(result.current).toHaveProperty('context');
  });

  it('should return reset property', () => {
    const { result } = renderHook(() => useSnakeGame());

    expect(result.current).toHaveProperty('reset');
  });

  it('should return all required properties', () => {
    const { result } = renderHook(() => useSnakeGame());

    const keys = Object.keys(result.current);
    expect(keys).toContain('state');
    expect(keys).toContain('canvasRef');
    expect(keys).toContain('context');
    expect(keys).toContain('reset');
  });
});

// ============================================================================
// Difficulty Parameter Tests
// ============================================================================

describe('useSnakeGame - Difficulty Parameter', () => {
  const difficulties: SnakeDifficulty[] = ['easy', 'normal', 'hard'];

  difficulties.forEach((difficulty) => {
    it(`should accept ${difficulty} difficulty`, () => {
      const { result } = renderHook(() => useSnakeGame(difficulty));

      expect(result.current.state.gameSpecific.difficulty).toBe(difficulty);
    });
  });

  it('should use normal difficulty when no parameter provided', () => {
    const { result } = renderHook(() => useSnakeGame());

    expect(result.current.state.gameSpecific.difficulty).toBe('normal');
  });
});
