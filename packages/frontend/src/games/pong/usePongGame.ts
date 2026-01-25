/**
 * usePongGame Hook
 *
 * Custom React hook for managing Pong game state and lifecycle.
 *
 * This hook provides a complete interface for the Pong game including:
 * - Game state management with React state
 * - Canvas rendering context
 * - Game loop control
 * - Input handling (keyboard and touch)
 * - State updates and physics
 *
 * @module games/pong/usePongGame
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import type { PongState, PongGameSpecificState } from './types';
import type { PongDifficulty } from './constants';
import type { GameInput } from '../types';
import { createInitialGameState } from '../types';
import { createInitialPongState, updateGameState } from './logic';
import { renderGame } from './renderer';

// ============================================================================
// Hook Interface
// ============================================================================

/**
 * Hook options interface for usePongGame.
 */
export interface UsePongGameOptions {
  /** Callback when game ends (called with final score and session ID) */
  onGameOver?: (score: number, sessionId?: string) => void;
  /** Initial difficulty level */
  difficulty?: PongDifficulty;
  /** Game mode (single-player vs AI, or two-player) */
  mode?: 'single-player' | 'two-player';
  /** Enable ball trail effect */
  showBallTrail?: boolean;
  /** Show rally count display */
  showRallyCount?: boolean;
}

/**
 * Return value interface for usePongGame hook.
 */
export interface UsePongGameReturn {
  /** Current game state */
  state: PongState;
  /** Canvas element ref (attach to <canvas ref={canvasRef}>) */
  canvasRef: React.RefObject<HTMLCanvasElement>;
  /** Canvas 2D rendering context (null until mounted) */
  context: CanvasRenderingContext2D | null;
  /** Start the game */
  start: () => void;
  /** Pause the game */
  pause: () => void;
  /** Resume the game */
  resume: () => void;
  /** Restart the game */
  restart: () => void;
  /** Reset game to initial state */
  reset: () => void;
  /** Current session ID for this game */
  sessionId: string | undefined;
  /** Is game currently active (playing and not paused) */
  isActive: boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Custom hook for Pong game state and canvas management.
 *
 * @param options - Configuration options
 * @returns Game state, canvas ref, context, and control methods
 *
 * @example
 * ```tsx
 * function PongGame() {
 *   const { state, canvasRef, start, pause } = usePongGame({
 *     difficulty: 'normal',
 *     mode: 'single-player',
 *     onGameOver: (score) => console.log('Game over! Score:', score)
 *   })
 *
 *   return (
 *     <div>
 *       <canvas ref={canvasRef} width={800} height={600} />
 *       <button onClick={start}>Start</button>
 *       <button onClick={pause}>Pause</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function usePongGame(options: UsePongGameOptions = {}): UsePongGameReturn {
  const {
    onGameOver,
    difficulty = 'normal',
    mode = 'single-player',
    showBallTrail = true,
    showRallyCount = true,
  } = options;

  // ============================================================================
  // State Initialization
  // ============================================================================

  const [state, setState] = useState<PongState>(() => {
    const baseState = createInitialGameState<PongGameSpecificState>();
    const pongSpecific = createInitialPongState(mode);

    return {
      ...baseState,
      gameSpecific: {
        ...pongSpecific,
        difficulty,
        sessionId: crypto.randomUUID(),
      },
    };
  });

  // ============================================================================
  // Refs
  // ============================================================================

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const lastTimeRef = useRef<number>(0);
  const inputRef = useRef<GameInput>({
    directions: new Set(),
    action: false,
    secondaryAction: false,
    pause: false,
    pointer: null,
    pointerDown: false,
  });

  // Track if game over callback was called
  const gameOverCalledRef = useRef(false);

  // ============================================================================
  // Canvas Initialization
  // ============================================================================

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      setContext(ctx);
    }
  }, []);

  // ============================================================================
  // Input Handling
  // ============================================================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Paddle controls
      if (key === 'arrowup' || key === 'w') {
        e.preventDefault();
        inputRef.current.directions.add('up');
      } else if (key === 'arrowdown' || key === 's') {
        e.preventDefault();
        inputRef.current.directions.add('down');
      }

      // Pause
      if (key === 'escape' || key === 'p') {
        e.preventDefault();
        inputRef.current.pause = true;
      }

      // Start/Restart
      if (key === ' ' || key === 'enter') {
        e.preventDefault();
        inputRef.current.action = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (key === 'arrowup' || key === 'w') {
        inputRef.current.directions.delete('up');
      } else if (key === 'arrowdown' || key === 's') {
        inputRef.current.directions.delete('down');
      }

      if (key === 'escape' || key === 'p') {
        inputRef.current.pause = false;
      }

      if (key === ' ' || key === 'enter') {
        inputRef.current.action = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // ============================================================================
  // Game Loop
  // ============================================================================

  useEffect(() => {
    if (!context || !state.isPlaying || state.isPaused) {
      return;
    }

    let animationId: number;

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }

      const deltaTime = (timestamp - lastTimeRef.current) / 1000; // Convert to seconds
      lastTimeRef.current = timestamp;

      // Cap delta time to prevent huge jumps
      const cappedDeltaTime = Math.min(deltaTime, 0.1);

      // Update game state
      setState((prevState) => {
        if (!prevState.gameSpecific) return prevState;

        const newGameSpecific = updateGameState(
          prevState.gameSpecific,
          inputRef.current,
          cappedDeltaTime
        );

        return {
          ...prevState,
          gameSpecific: newGameSpecific,
          score: newGameSpecific.leftScore.score, // Player score
          isGameOver: newGameSpecific.winCondition.hasWinner,
        };
      });

      // Render
      renderGame(context, state, {
        showBallTrail,
        showRallyCount,
      });

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [context, state.isPlaying, state.isPaused, showBallTrail, showRallyCount]);

  // ============================================================================
  // Game Over Handling
  // ============================================================================

  useEffect(() => {
    if (state.isGameOver && onGameOver && !gameOverCalledRef.current) {
      gameOverCalledRef.current = true;
      const sessionId = state.gameSpecific?.sessionId;
      onGameOver(state.score, sessionId);
    }

    if (!state.isGameOver) {
      gameOverCalledRef.current = false;
    }
  }, [state.isGameOver, state.score, state.gameSpecific?.sessionId, onGameOver]);

  // ============================================================================
  // Control Methods
  // ============================================================================

  const start = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isPlaying: true,
      isPaused: false,
      isGameOver: false,
      startTime: Date.now(),
    }));
    lastTimeRef.current = 0;
  }, []);

  const pause = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isPaused: true,
    }));
  }, []);

  const resume = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isPaused: false,
    }));
    lastTimeRef.current = 0;
  }, []);

  const reset = useCallback(() => {
    const baseState = createInitialGameState<PongGameSpecificState>();
    const pongSpecific = createInitialPongState(mode);

    setState({
      ...baseState,
      gameSpecific: {
        ...pongSpecific,
        difficulty,
        sessionId: crypto.randomUUID(),
      },
    });

    gameOverCalledRef.current = false;
    lastTimeRef.current = 0;
    inputRef.current.directions.clear();
  }, [difficulty, mode]);

  const restart = useCallback(() => {
    reset();
    setTimeout(() => {
      start();
    }, 100);
  }, [reset, start]);

  // ============================================================================
  // Handle Pause Input
  // ============================================================================

  useEffect(() => {
    if (inputRef.current.pause && state.isPlaying && !state.isGameOver) {
      if (state.isPaused) {
        resume();
      } else {
        pause();
      }
      inputRef.current.pause = false;
    }
  }, [state.isPlaying, state.isPaused, state.isGameOver, pause, resume]);

  // ============================================================================
  // Handle Start/Restart Input
  // ============================================================================

  useEffect(() => {
    if (inputRef.current.action) {
      if (!state.isPlaying) {
        start();
      } else if (state.isGameOver) {
        restart();
      }
      inputRef.current.action = false;
    }
  }, [state.isPlaying, state.isGameOver, start, restart]);

  // ============================================================================
  // Render Initial Frame
  // ============================================================================

  useEffect(() => {
    if (context && !state.isPlaying) {
      renderGame(context, state, {
        showBallTrail,
        showRallyCount,
      });
    }
  }, [context, state, state.isPlaying, showBallTrail, showRallyCount]);

  // ============================================================================
  // Return Hook Interface
  // ============================================================================

  return {
    state,
    canvasRef,
    context,
    start,
    pause,
    resume,
    restart,
    reset,
    sessionId: state.gameSpecific?.sessionId,
    isActive: state.isPlaying && !state.isPaused && !state.isGameOver,
  };
}

// ============================================================================
// Exports
// ============================================================================

export default usePongGame;
