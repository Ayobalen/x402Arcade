/**
 * useSnakeGame Hook
 *
 * Custom React hook for managing Snake game state and lifecycle.
 *
 * This hook provides a complete interface for the Snake game including:
 * - Game state management with React state
 * - Canvas rendering context
 * - Game loop control
 * - Input handling
 * - State updates and actions
 *
 * @module games/snake/useSnakeGame
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import type { SnakeState } from './types';
import type { SnakeDifficulty } from './constants';
import { createMenuState } from './logic';

// ============================================================================
// Hook Interface
// ============================================================================

/**
 * Return value interface for useSnakeGame hook.
 */
export interface UseSnakeGameReturn {
  /** Current game state */
  state: SnakeState;
  /** Canvas element ref (attach to <canvas ref={canvasRef}>) */
  canvasRef: React.RefObject<HTMLCanvasElement>;
  /** Canvas 2D rendering context (null until mounted) */
  context: CanvasRenderingContext2D | null;
  /** Reset game to initial state */
  reset: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Custom hook for Snake game state and canvas management.
 *
 * This hook initializes the Snake game state, manages the canvas rendering
 * context, and provides methods for controlling the game.
 *
 * @param difficulty - Initial difficulty level (default: 'normal')
 * @returns Game state, canvas ref, context, and control methods
 *
 * @description
 * - Initializes game state with createMenuState()
 * - Creates canvas ref for React element binding
 * - Obtains 2D rendering context after mount
 * - Provides reset function to restart game
 * - State updates trigger re-renders automatically
 *
 * @example
 * ```tsx
 * function SnakeGame() {
 *   const { state, canvasRef, context, reset } = useSnakeGame()
 *
 *   return (
 *     <div>
 *       <canvas ref={canvasRef} width={400} height={400} />
 *       <button onClick={reset}>Reset</button>
 *       <div>Score: {state.gameSpecific.score}</div>
 *     </div>
 *   )
 * }
 * ```
 */
export function useSnakeGame(difficulty: SnakeDifficulty = 'normal'): UseSnakeGameReturn {
  // ============================================================================
  // State Initialization
  // ============================================================================

  /**
   * Initialize game state using createMenuState.
   * This creates the initial menu state with the specified difficulty.
   */
  const [state, setState] = useState<SnakeState>(() => createMenuState(difficulty));

  // ============================================================================
  // Canvas Context Management
  // ============================================================================

  /**
   * Ref for canvas element.
   * Attach this to the canvas element: <canvas ref={canvasRef} />
   */
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * Ref for 2D rendering context.
   * Initialized after component mounts when canvas is available.
   */
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  /**
   * Initialize canvas context after mount.
   * Gets the 2D rendering context from the canvas element.
   */
  useEffect(() => {
    if (canvasRef.current && !contextRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        contextRef.current = ctx;
      }
    }
  }, []);

  // ============================================================================
  // Control Methods
  // ============================================================================

  /**
   * Reset game to initial menu state.
   * Creates a new menu state with the same difficulty.
   */
  const reset = useCallback(() => {
    const currentDifficulty = state.gameSpecific.difficulty || difficulty;
    setState(createMenuState(currentDifficulty));
  }, [state.gameSpecific.difficulty, difficulty]);

  // ============================================================================
  // Return Hook Interface
  // ============================================================================

  return {
    state,
    canvasRef,
    context: contextRef.current,
    reset,
  };
}
