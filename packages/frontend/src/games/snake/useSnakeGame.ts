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
import {
  createMenuState,
  changeDirection,
  processSnakeMove,
  togglePause,
  startGame,
} from './logic';

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
   * Ref for game loop interval ID.
   * Used to store and clear the game loop interval.
   */
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

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
  // Game Loop
  // ============================================================================

  /**
   * Game loop effect.
   * Runs the game tick at the current speed interval.
   * Updates when playing state or speed changes.
   */
  useEffect(() => {
    // Clear any existing interval
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }

    // Only start loop if game is playing and not paused
    if (state.isPlaying && !state.isPaused && !state.isGameOver) {
      const currentSpeed = state.gameSpecific?.currentSpeed || 150;

      gameLoopRef.current = setInterval(() => {
        setState((prevState) => processSnakeMove(prevState));
      }, currentSpeed);
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, [state.isPlaying, state.isPaused, state.isGameOver, state.gameSpecific?.currentSpeed]);

  // ============================================================================
  // Keyboard Input
  // ============================================================================

  /**
   * Keyboard event handler.
   * Handles arrow keys, WASD keys for direction changes, and space/escape for pause/start.
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Arrow keys and WASD - change direction
      if (event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W') {
        event.preventDefault();
        setState((prevState) => changeDirection(prevState, 'up'));
      } else if (event.key === 'ArrowDown' || event.key === 's' || event.key === 'S') {
        event.preventDefault();
        setState((prevState) => changeDirection(prevState, 'down'));
      } else if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
        event.preventDefault();
        setState((prevState) => changeDirection(prevState, 'left'));
      } else if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
        event.preventDefault();
        setState((prevState) => changeDirection(prevState, 'right'));
      }
      // Space - pause/unpause or start from menu
      else if (event.key === ' ' || event.key === 'Space') {
        event.preventDefault();
        setState((prevState) => {
          // If in menu, start the game
          if (!prevState.isPlaying && !prevState.isGameOver) {
            return startGame(prevState);
          }
          // If playing, toggle pause
          else if (prevState.isPlaying && !prevState.isGameOver) {
            return togglePause(prevState);
          }
          return prevState;
        });
      }
      // Escape - toggle pause (only during gameplay)
      else if (event.key === 'Escape') {
        event.preventDefault();
        setState((prevState) => {
          // Only toggle pause if playing and not game over
          if (prevState.isPlaying && !prevState.isGameOver) {
            return togglePause(prevState);
          }
          return prevState;
        });
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
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
