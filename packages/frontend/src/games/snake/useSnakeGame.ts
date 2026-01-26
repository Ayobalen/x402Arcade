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
import {
  renderBackground,
  renderGrid,
  renderFoodPulsing,
  renderSnakeHead,
  renderSnakeBody,
  renderPauseOverlay,
  renderGameOverOverlay,
  renderScore,
} from './renderer';
import {
  initializeSnakeSounds,
  SnakeSoundType,
  type SnakeSoundsManager,
} from './SnakeSoundsPhaser';

// ============================================================================
// Hook Interface
// ============================================================================

/**
 * Ranking entry interface for leaderboard display.
 */
export interface RankingEntry {
  /** Player's rank position */
  rank: number;
  /** Player's wallet address or identifier */
  playerAddress: string;
  /** Player's score */
  score: number;
  /** Whether this is the current player */
  isCurrentPlayer?: boolean;
}

/**
 * Hook options interface for useSnakeGame.
 */
export interface UseSnakeGameOptions {
  /** Callback when game ends (called with final score and session ID) */
  onGameOver?: (score: number, sessionId?: string) => void;
  /** Callback to fetch rankings after game over */
  onFetchRankings?: (score: number) => Promise<RankingEntry[]>;
}

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
  /** Start the game from menu state */
  start: () => void;
  /** Toggle pause state during gameplay */
  pause: () => void;
  /** Restart the game (alias for reset) */
  restart: () => void;
  /** Current session ID for this game */
  sessionId: string | undefined;
  /** Player's ranking after game over */
  playerRank: number | null;
  /** Nearby rankings for context */
  rankings: RankingEntry[];
  /** Whether rankings are being loaded */
  isLoadingRankings: boolean;
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
 * @param options - Optional configuration (onGameOver callback, etc.)
 * @returns Game state, canvas ref, context, and control methods
 *
 * @description
 * - Initializes game state with createMenuState()
 * - Creates canvas ref for React element binding
 * - Obtains 2D rendering context after mount
 * - Provides reset function to restart game
 * - State updates trigger re-renders automatically
 * - Calls onGameOver callback when game ends
 *
 * @example
 * ```tsx
 * function SnakeGame() {
 *   const { state, canvasRef, context, reset } = useSnakeGame('normal', {
 *     onGameOver: (score) => console.log('Game over! Score:', score)
 *   })
 *
 *   return (
 *     <div>
 *       <canvas ref={canvasRef} width={400} height={400} />
 *       <button onClick={reset}>Reset</button>
 *       <div>Score: {state.score}</div>
 *     </div>
 *   )
 * }
 * ```
 */
export function useSnakeGame(
  difficulty: SnakeDifficulty = 'normal',
  options: UseSnakeGameOptions = {}
): UseSnakeGameReturn {
  const { onGameOver, onFetchRankings } = options;
  // ============================================================================
  // State Initialization
  // ============================================================================

  /**
   * Initialize game state using createMenuState.
   * This creates the initial menu state with the specified difficulty.
   */
  const [state, setState] = useState<SnakeState>(() => createMenuState(difficulty));

  /**
   * Ranking state for display after game over.
   */
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [playerRank, setPlayerRank] = useState<number | null>(null);
  const [isLoadingRankings, setIsLoadingRankings] = useState(false);

  // ============================================================================
  // Audio System
  // ============================================================================

  /**
   * Snake sounds manager ref.
   */
  const soundsManagerRef = useRef<SnakeSoundsManager | null>(null);

  /**
   * Previous state ref for detecting changes (for audio triggers).
   */
  const prevStateRef = useRef<SnakeState | null>(null);

  /**
   * Initialize Snake sounds on mount.
   */
  useEffect(() => {
    initializeSnakeSounds().then((manager) => {
      soundsManagerRef.current = manager;
    });

    // Cleanup on unmount
    return () => {
      if (soundsManagerRef.current) {
        soundsManagerRef.current.dispose();
        soundsManagerRef.current = null;
      }
    };
  }, []);

  /**
   * Track state changes and play appropriate sounds.
   */
  useEffect(() => {
    const prevState = prevStateRef.current;
    prevStateRef.current = state;
    const sounds = soundsManagerRef.current;

    // Skip if no previous state (first render) or sounds not initialized
    if (!prevState || !prevState.gameSpecific || !state.gameSpecific || !sounds) {
      return;
    }

    // Detect food eaten (score increased but not level up)
    const scoreIncreased = state.score > prevState.score;
    const comboCount = state.gameSpecific.currentCombo || 0;

    if (scoreIncreased) {
      sounds.playEatSound(comboCount);
    }

    // Detect level up
    const leveledUp = state.level > prevState.level;
    if (leveledUp) {
      sounds.play(SnakeSoundType.LEVEL_UP);
    }

    // Detect death (game over triggered)
    const justDied = state.isGameOver && !prevState.isGameOver;
    if (justDied) {
      sounds.play(SnakeSoundType.DEATH);
    }
  }, [state.score, state.level, state.isGameOver, state.gameSpecific?.currentCombo]);

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
   * Ref for game loop RAF ID.
   * Used to store and cancel the game loop animation frame.
   */
  const gameLoopRef = useRef<number | null>(null);

  /**
   * Ref for render loop RAF ID.
   * Used to store and cancel the render loop animation frame.
   */
  const renderLoopRef = useRef<number | null>(null);

  /**
   * Ref for tracking last update timestamp.
   * Used for time-based game updates.
   */
  const lastUpdateTimeRef = useRef<number>(0);

  /**
   * Ref for accumulated time since last move.
   * Used to determine when to process next game tick.
   */
  const accumulatedTimeRef = useRef<number>(0);

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
  // Game Loop (Time-Based with RAF)
  // ============================================================================

  /**
   * Time-based game loop using requestAnimationFrame.
   * Updates game state only when enough time has elapsed based on current speed.
   */
  useEffect(() => {
    // Cancel any existing RAF
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }

    // Only start loop if game is playing and not paused
    if (state.isPlaying && !state.isPaused && !state.isGameOver) {
      const currentSpeed = state.gameSpecific?.currentSpeed || 150;

      // Initialize timestamp on first frame
      lastUpdateTimeRef.current = performance.now();
      accumulatedTimeRef.current = 0;

      // Game update loop
      const gameLoop = (currentTime: number) => {
        // Calculate time since last frame
        const deltaTime = currentTime - lastUpdateTimeRef.current;
        lastUpdateTimeRef.current = currentTime;

        // Accumulate time
        accumulatedTimeRef.current += deltaTime;

        // Update game if enough time has elapsed
        if (accumulatedTimeRef.current >= currentSpeed) {
          setState((prevState) => processSnakeMove(prevState));
          accumulatedTimeRef.current -= currentSpeed;
        }

        // Continue loop if still playing
        if (state.isPlaying && !state.isPaused && !state.isGameOver) {
          gameLoopRef.current = requestAnimationFrame(gameLoop);
        }
      };

      // Start the loop
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
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
  // Render Loop
  // ============================================================================

  /**
   * Render loop using requestAnimationFrame.
   * Continuously renders the game state to the canvas.
   */
  useEffect(() => {
    const ctx = contextRef.current;

    // Only render if we have a context
    if (!ctx) return;

    // Cancel any existing render loop
    if (renderLoopRef.current) {
      cancelAnimationFrame(renderLoopRef.current);
      renderLoopRef.current = null;
    }

    // Render function with timestamp for animations
    const render = (timestamp: number) => {
      // Clear canvas and render background
      renderBackground(ctx);
      renderGrid(ctx);

      // Render game elements if playing
      if ((state.isPlaying || state.isGameOver) && state.gameSpecific) {
        // Render food with pulsing animation
        renderFoodPulsing(ctx, state.gameSpecific.food, timestamp);

        // Render snake (head and body)
        const segments = state.gameSpecific.segments;
        if (segments.length > 0) {
          // Render body segments (all except head)
          renderSnakeBody(ctx, segments);

          // Render head last (on top)
          renderSnakeHead(ctx, segments[0], state.gameSpecific.direction);
        }

        // Render score
        renderScore(ctx, state.score);
      }

      // Render overlays
      if (state.isPaused) {
        renderPauseOverlay(ctx);
      } else if (state.isGameOver) {
        renderGameOverOverlay(ctx, state.score);
      }

      // Continue render loop
      renderLoopRef.current = requestAnimationFrame(render);
    };

    // Start render loop
    renderLoopRef.current = requestAnimationFrame(render);

    // Cleanup on unmount
    return () => {
      if (renderLoopRef.current) {
        cancelAnimationFrame(renderLoopRef.current);
        renderLoopRef.current = null;
      }
    };
  }, [state]); // Re-render when state changes

  // ============================================================================
  // Game Over Callback and Rankings
  // ============================================================================

  /**
   * Call onGameOver callback when game ends and fetch rankings.
   */
  useEffect(() => {
    if (state.isGameOver) {
      const score = state.score;
      const sessionId = state.gameSpecific?.sessionId;

      // Call the game over callback with score and session ID
      if (onGameOver) {
        onGameOver(score, sessionId);
      }

      // Fetch rankings if callback provided
      if (onFetchRankings) {
        setIsLoadingRankings(true);
        onFetchRankings(score)
          .then((fetchedRankings) => {
            setRankings(fetchedRankings);
            // Find player's rank from the rankings
            const playerEntry = fetchedRankings.find((r) => r.isCurrentPlayer);
            if (playerEntry) {
              setPlayerRank(playerEntry.rank);
            }
          })
          .catch(() => {
            // Rankings fetch failed - silently handle as this is non-critical
            // Rankings will simply not be displayed
          })
          .finally(() => {
            setIsLoadingRankings(false);
          });
      }
    }
  }, [state.isGameOver, state.score, state.gameSpecific?.sessionId, onGameOver, onFetchRankings]);

  // ============================================================================
  // Control Methods
  // ============================================================================

  /**
   * Reset game to initial menu state.
   * Creates a new menu state with the same difficulty.
   * Clears rankings from previous game.
   */
  const reset = useCallback(() => {
    const currentDifficulty = state.gameSpecific?.difficulty || difficulty;
    setState(createMenuState(currentDifficulty));
    // Clear previous game's rankings
    setRankings([]);
    setPlayerRank(null);
    setIsLoadingRankings(false);
  }, [state.gameSpecific?.difficulty, difficulty]);

  /**
   * Start the game from menu state.
   * Transitions from menu to playing state.
   */
  const start = useCallback(() => {
    setState((prevState) => startGame(prevState));
  }, []);

  /**
   * Toggle pause state during gameplay.
   * Only works when game is playing and not game over.
   */
  const pause = useCallback(() => {
    setState((prevState) => togglePause(prevState));
  }, []);

  /**
   * Restart the game.
   * Alias for reset() - resets to menu state.
   */
  const restart = reset;

  // ============================================================================
  // Return Hook Interface
  // ============================================================================

  return {
    state,
    canvasRef,
    context: contextRef.current,
    reset,
    start,
    pause,
    restart,
    sessionId: state.gameSpecific?.sessionId,
    playerRank,
    rankings,
    isLoadingRankings,
  };
}
