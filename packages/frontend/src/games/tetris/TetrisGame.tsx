/**
 * Tetris Game Component
 *
 * Main component for the Tetris game. Renders the game board, preview,
 * hold piece, and effects using canvas rendering.
 *
 * Features:
 * - Grid renderer with block colors
 * - Next piece preview (up to 5 pieces)
 * - Hold piece feature
 * - Ghost piece (drop preview)
 * - Visual effects for line clears and Tetris
 *
 * @module games/tetris/TetrisGame
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  CELL_SIZE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TETROMINO_COLORS,
  TETROMINO_SHAPES,
  BOARD_COLORS,
  HIDDEN_ROWS,
  PREVIEW_CELL_SIZE,
  HOLD_CELL_SIZE,
  type TetrominoType,
  type TetrisDifficulty,
} from './constants';
import {
  createInitialState,
  spawnPiece,
  movePiece,
  rotatePiece,
  hardDrop,
  placePiece,
  startLineClear,
  completeLineClear,
  isClearing,
  getPieceShape,
  calculateDropPosition,
} from './logic';
import type { TetrisState, Piece, Board } from './types';
import { useSFX } from '../../hooks/useSFX';
import {
  initializeTetrisSounds,
  playRotateSound,
  playLockSound,
  playHardDropSound,
  playLineClearSound,
  playComboSound,
  playLevelUpSound,
  playGameStartSound,
  playGameOverSound,
  playHoldSound,
} from './TetrisSounds';

// ============================================================================
// Component Props
// ============================================================================

/**
 * Props for the TetrisGame component.
 */
export interface TetrisGameProps {
  /** Game difficulty level */
  difficulty?: TetrisDifficulty;
  /** Callback when game ends (score, level, lines, sessionId) */
  onGameOver?: (score: number, level: number, lines: number, sessionId?: string) => void;
  /** Optional CSS class name */
  className?: string;
  /** Show ghost piece */
  showGhostPiece?: boolean;
  /** Enable hold feature */
  enableHold?: boolean;
  /** Number of preview pieces to show */
  previewCount?: number;
}

// ============================================================================
// Constants
// ============================================================================

const LINE_CLEAR_ANIMATION_DURATION = 300; // ms
const GHOST_OPACITY = 0.3;

// ============================================================================
// Rendering Functions
// ============================================================================

/**
 * Draws a single cell/block on the canvas
 */
function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  isGhost = false
) {
  const padding = 1;
  const innerSize = size - padding * 2;

  // Skip if outside visible area
  if (y < 0) return;

  ctx.save();

  if (isGhost) {
    ctx.globalAlpha = GHOST_OPACITY;
  }

  // Main block color
  ctx.fillStyle = color;
  ctx.fillRect(x * size + padding, y * size + padding, innerSize, innerSize);

  // Highlight (top-left edges)
  const highlight = adjustBrightness(color, 40);
  ctx.fillStyle = highlight;
  ctx.fillRect(x * size + padding, y * size + padding, innerSize, 2);
  ctx.fillRect(x * size + padding, y * size + padding, 2, innerSize);

  // Shadow (bottom-right edges)
  const shadow = adjustBrightness(color, -40);
  ctx.fillStyle = shadow;
  ctx.fillRect(x * size + padding, y * size + innerSize, innerSize, 2);
  ctx.fillRect(x * size + innerSize, y * size + padding, 2, innerSize);

  ctx.restore();
}

/**
 * Adjusts color brightness
 */
function adjustBrightness(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 255) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 255) + amount));
  const b = Math.min(255, Math.max(0, (num & 255) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Draws the game board grid
 */
function drawBoard(ctx: CanvasRenderingContext2D, board: Board) {
  // Draw background
  ctx.fillStyle = BOARD_COLORS.background;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Draw grid lines
  ctx.strokeStyle = BOARD_COLORS.gridLine;
  ctx.lineWidth = 1;

  // Vertical lines
  for (let x = 0; x <= BOARD_WIDTH; x++) {
    ctx.beginPath();
    ctx.moveTo(x * CELL_SIZE, 0);
    ctx.lineTo(x * CELL_SIZE, CANVAS_HEIGHT);
    ctx.stroke();
  }

  // Horizontal lines
  for (let y = 0; y <= BOARD_HEIGHT; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL_SIZE);
    ctx.lineTo(CANVAS_WIDTH, y * CELL_SIZE);
    ctx.stroke();
  }

  // Draw placed blocks (skip hidden rows)
  for (let row = HIDDEN_ROWS; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      const cell = board[row][col];
      if (cell) {
        const displayRow = row - HIDDEN_ROWS;
        drawCell(ctx, col, displayRow, CELL_SIZE, TETROMINO_COLORS[cell]);
      }
    }
  }
}

/**
 * Draws the current active piece
 */
function drawPiece(ctx: CanvasRenderingContext2D, piece: Piece | null, isGhost = false) {
  if (!piece) return;

  const shape = getPieceShape(piece.type, piece.rotation);
  const color = TETROMINO_COLORS[piece.type];

  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const displayY = piece.position.y + row - HIDDEN_ROWS;
        drawCell(ctx, piece.position.x + col, displayY, CELL_SIZE, color, isGhost);
      }
    }
  }
}

/**
 * Draws line clear flash effect
 */
function drawLineClearEffect(
  ctx: CanvasRenderingContext2D,
  clearingLines: number[],
  progress: number
) {
  if (clearingLines.length === 0) return;

  ctx.save();

  // Flash effect with pulse
  const flashIntensity = Math.sin(progress * Math.PI * 4) * 0.5 + 0.5;
  ctx.fillStyle = `rgba(255, 255, 255, ${flashIntensity * 0.8})`;

  for (const row of clearingLines) {
    const displayRow = row - HIDDEN_ROWS;
    ctx.fillRect(0, displayRow * CELL_SIZE, CANVAS_WIDTH, CELL_SIZE);
  }

  ctx.restore();
}

/**
 * Draws a tetromino shape for preview/hold displays
 */
function drawTetrominoPreview(
  ctx: CanvasRenderingContext2D,
  type: TetrominoType,
  cellSize: number,
  offsetX: number,
  offsetY: number
) {
  const shape = TETROMINO_SHAPES[type];
  const color = TETROMINO_COLORS[type];

  // Center the piece in the preview area
  const pieceWidth = shape[0].length * cellSize;
  const pieceHeight = shape.length * cellSize;
  const centerOffsetX = (4 * cellSize - pieceWidth) / 2;
  const centerOffsetY = (2 * cellSize - pieceHeight) / 2;

  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const x = offsetX + centerOffsetX + col * cellSize;
        const y = offsetY + centerOffsetY + row * cellSize;

        ctx.fillStyle = color;
        ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);

        // Highlight
        ctx.fillStyle = adjustBrightness(color, 30);
        ctx.fillRect(x + 1, y + 1, cellSize - 2, 2);
        ctx.fillRect(x + 1, y + 1, 2, cellSize - 2);
      }
    }
  }
}

// ============================================================================
// Component
// ============================================================================

/**
 * Tetris Game Component
 */
export function TetrisGame({
  difficulty = 'normal',
  onGameOver,
  className = '',
  showGhostPiece = true,
  enableHold = true,
  previewCount = 5,
}: TetrisGameProps) {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const holdCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // State
  const [gameState, setGameState] = useState<TetrisState>(() =>
    createInitialState(difficulty === 'expert' ? 5 : 1)
  );
  const [clearAnimProgress, setClearAnimProgress] = useState(0);
  const [sessionId] = useState(() => `tetris-${Date.now()}`);

  // Audio System
  const sfx = useSFX();
  const prevStateRef = useRef<TetrisState | null>(null);

  // Initialize Tetris sounds
  useEffect(() => {
    initializeTetrisSounds(sfx);
  }, [sfx]);

  // Track state changes and play appropriate sounds
  useEffect(() => {
    const prevState = prevStateRef.current;
    prevStateRef.current = gameState;

    // Skip if no previous state (first render)
    if (!prevState || !prevState.gameSpecific || !gameState.gameSpecific) {
      return;
    }

    const prev = prevState.gameSpecific;
    const curr = gameState.gameSpecific;

    // Detect game start
    const justStarted = gameState.isPlaying && !prevState.isPlaying;
    if (justStarted && !prevState.isGameOver) {
      playGameStartSound(sfx);
    }

    // Detect piece rotation (rotation state changed)
    if (
      curr.currentPiece &&
      prev.currentPiece &&
      curr.currentPiece.rotation !== prev.currentPiece.rotation
    ) {
      playRotateSound(sfx);
    }

    // Detect piece lock (piece was placed, new piece spawned)
    const pieceLocked =
      prev.currentPiece !== null &&
      curr.currentPiece !== null &&
      prev.stats.piecesPlaced < curr.stats.piecesPlaced;

    if (pieceLocked) {
      playLockSound(sfx);
    }

    // Detect line clears
    if (curr.lastClear && curr.lastClear !== prev.lastClear) {
      const { linesCleared, isTSpin, isBackToBack, combo } = curr.lastClear;

      // Play line clear sound
      playLineClearSound(sfx, linesCleared, isTSpin, isBackToBack);

      // Play combo sound
      if (combo > 0) {
        playComboSound(sfx, combo, false);
      }
    }

    // Detect combo break (combo went from > 0 to 0)
    const comboJustBroke = prev.stats.currentCombo > 0 && curr.stats.currentCombo === 0;
    if (comboJustBroke && curr.lastClear) {
      playComboSound(sfx, 0, true);
    }

    // Detect level up
    const leveledUp = gameState.level > prevState.level;
    if (leveledUp) {
      playLevelUpSound(sfx);
    }

    // Detect game over
    const justGameOver = gameState.isGameOver && !prevState.isGameOver;
    if (justGameOver) {
      // Check if it was a top-out (currentPiece exists at top)
      const isTopOut = curr.currentPiece !== null && curr.currentPiece.position.y <= 2;
      playGameOverSound(sfx, isTopOut);
    }

    // Detect hold piece usage
    const heldPieceChanged = curr.heldPiece !== prev.heldPiece;
    if (heldPieceChanged && curr.heldPiece !== null) {
      playHoldSound(sfx);
    }
  }, [
    gameState.isPlaying,
    gameState.isGameOver,
    gameState.level,
    gameState.gameSpecific?.currentPiece?.rotation,
    gameState.gameSpecific?.stats.piecesPlaced,
    gameState.gameSpecific?.lastClear,
    gameState.gameSpecific?.stats.currentCombo,
    gameState.gameSpecific?.heldPiece,
    sfx,
  ]);

  // Input handling
  const keysPressed = useRef<Set<string>>(new Set());

  // ============================================================================
  // Game Loop
  // ============================================================================

  const gameLoop = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) {
      lastTimeRef.current = timestamp;
    }
    const deltaTime = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    setGameState((prevState) => {
      if (!prevState.isPlaying || prevState.isPaused || prevState.isGameOver) {
        return prevState;
      }

      let newState = { ...prevState };
      const gs = newState.gameSpecific;

      // Handle line clear animation
      if (isClearing(newState)) {
        const newTimer = gs.clearingTimer + deltaTime;
        if (newTimer >= LINE_CLEAR_ANIMATION_DURATION) {
          newState = completeLineClear(newState);
          setClearAnimProgress(0);
        } else {
          newState = {
            ...newState,
            gameSpecific: { ...gs, clearingTimer: newTimer },
          };
          setClearAnimProgress(newTimer / LINE_CLEAR_ANIMATION_DURATION);
        }
        return newState;
      }

      // If no current piece, spawn one
      if (!gs.currentPiece) {
        return spawnPiece(newState);
      }

      // Handle drop timer
      const newDropTimer = gs.dropTimer + deltaTime;
      if (newDropTimer >= gs.dropSpeed) {
        // Try to move piece down
        const movedState = movePiece(newState, 'down');

        if (movedState === newState) {
          // Piece couldn't move down - handle lock
          const newLockTimer = gs.lockTimer + deltaTime;

          if (newLockTimer >= 500) {
            // Lock delay exceeded - place piece
            const boardWithPiece = placePiece(gs.board, gs.currentPiece!);
            const stateWithPiece: TetrisState = {
              ...newState,
              gameSpecific: {
                ...gs,
                board: boardWithPiece,
                currentPiece: null,
                stats: {
                  ...gs.stats,
                  piecesPlaced: gs.stats.piecesPlaced + 1,
                },
              },
            };

            // Check for line clears
            return startLineClear(stateWithPiece);
          }

          return {
            ...newState,
            gameSpecific: {
              ...gs,
              lockTimer: newLockTimer,
            },
          };
        }

        return {
          ...movedState,
          gameSpecific: {
            ...movedState.gameSpecific,
            dropTimer: 0,
          },
        };
      }

      return {
        ...newState,
        gameSpecific: { ...gs, dropTimer: newDropTimer },
      };
    });

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, []);

  // ============================================================================
  // Input Handling
  // ============================================================================

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (keysPressed.current.has(e.code)) return;
      keysPressed.current.add(e.code);

      setGameState((prevState) => {
        if (!prevState.isPlaying || prevState.isPaused) {
          // Start game on any key if not playing
          if (!prevState.isPlaying && !prevState.isGameOver) {
            const newState = { ...prevState, isPlaying: true, startTime: Date.now() };
            return spawnPiece(newState);
          }
          return prevState;
        }

        if (isClearing(prevState)) return prevState;

        const gs = prevState.gameSpecific;
        if (!gs.currentPiece) return prevState;

        switch (e.code) {
          case 'ArrowLeft':
          case 'KeyA':
            return movePiece(prevState, 'left');

          case 'ArrowRight':
          case 'KeyD':
            return movePiece(prevState, 'right');

          case 'ArrowDown':
          case 'KeyS':
            return movePiece(prevState, 'down');

          case 'ArrowUp':
          case 'KeyX':
            return rotatePiece(prevState, 'cw');

          case 'KeyZ':
          case 'ControlLeft':
          case 'ControlRight':
            return rotatePiece(prevState, 'ccw');

          case 'Space': {
            // Hard drop
            const droppedState = hardDrop(prevState);
            playHardDropSound(sfx); // Play hard drop sound
            const droppedGs = droppedState.gameSpecific;
            if (droppedGs.currentPiece) {
              const boardWithPiece = placePiece(droppedGs.board, droppedGs.currentPiece);
              const stateWithPiece: TetrisState = {
                ...droppedState,
                gameSpecific: {
                  ...droppedGs,
                  board: boardWithPiece,
                  currentPiece: null,
                  stats: {
                    ...droppedGs.stats,
                    piecesPlaced: droppedGs.stats.piecesPlaced + 1,
                  },
                },
              };
              return startLineClear(stateWithPiece);
            }
            return droppedState;
          }

          case 'KeyC':
          case 'ShiftLeft':
          case 'ShiftRight': {
            // Hold piece (to be implemented fully)
            if (!enableHold || !gs.canHold) return prevState;
            // Basic hold implementation
            const heldType = gs.heldPiece;
            const currentType = gs.currentPiece.type;

            if (heldType) {
              // Swap with held piece
              const newPiece = {
                type: heldType,
                position: { x: 3, y: 0 },
                rotation: 0 as const,
              };
              return {
                ...prevState,
                gameSpecific: {
                  ...gs,
                  currentPiece: newPiece,
                  heldPiece: currentType,
                  canHold: false,
                },
              };
            } else {
              // Hold current piece, spawn new
              const holdState: TetrisState = {
                ...prevState,
                gameSpecific: {
                  ...gs,
                  currentPiece: null,
                  heldPiece: currentType,
                  canHold: false,
                },
              };
              return spawnPiece(holdState);
            }
          }

          case 'Escape':
          case 'KeyP':
            // Pause
            return { ...prevState, isPaused: !prevState.isPaused };

          default:
            return prevState;
        }
      });
    },
    [enableHold]
  );

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysPressed.current.delete(e.code);
  }, []);

  // ============================================================================
  // Effects
  // ============================================================================

  // Start game loop
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [gameLoop]);

  // Handle keyboard input
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Game over callback
  useEffect(() => {
    if (gameState.isGameOver && onGameOver) {
      const gs = gameState.gameSpecific;
      onGameOver(gameState.score, gameState.level, gs.totalLines, sessionId);
    }
  }, [
    gameState.isGameOver,
    gameState.score,
    gameState.level,
    gameState.gameSpecific,
    sessionId,
    onGameOver,
  ]);

  // ============================================================================
  // Rendering
  // ============================================================================

  // Main board rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const gs = gameState.gameSpecific;

    // Draw board
    drawBoard(ctx, gs.board);

    // Draw ghost piece
    if (showGhostPiece && gs.currentPiece) {
      const ghostY = calculateDropPosition(gs.board, gs.currentPiece);
      const ghostPiece: Piece = {
        ...gs.currentPiece,
        position: { x: gs.currentPiece.position.x, y: ghostY },
      };
      drawPiece(ctx, ghostPiece, true);
    }

    // Draw current piece
    drawPiece(ctx, gs.currentPiece);

    // Draw line clear effect
    if (gs.clearingLines.length > 0) {
      drawLineClearEffect(ctx, gs.clearingLines, clearAnimProgress);
    }

    // Draw pause overlay
    if (gameState.isPaused) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }

    // Draw game over overlay
    if (gameState.isGameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#FF4444';
      ctx.font = 'bold 28px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '18px Inter, sans-serif';
      ctx.fillText(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    }
  }, [gameState, showGhostPiece, clearAnimProgress]);

  // Preview rendering
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gs = gameState.gameSpecific;
    const displayCount = Math.min(previewCount, gs.nextPieces.length);

    // Clear
    ctx.fillStyle = BOARD_COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw border
    ctx.strokeStyle = BOARD_COLORS.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Draw title
    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NEXT', canvas.width / 2, 16);

    // Draw preview pieces
    for (let i = 0; i < displayCount; i++) {
      const piece = gs.nextPieces[i];
      drawTetrominoPreview(ctx, piece, PREVIEW_CELL_SIZE, 8, 26 + i * 50);
    }
  }, [gameState.gameSpecific.nextPieces, previewCount]);

  // Hold rendering
  useEffect(() => {
    const canvas = holdCanvasRef.current;
    if (!canvas || !enableHold) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gs = gameState.gameSpecific;

    // Clear
    ctx.fillStyle = BOARD_COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw border
    ctx.strokeStyle = gs.canHold ? BOARD_COLORS.border : '#4a4a4a';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Draw title
    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HOLD', canvas.width / 2, 16);

    // Draw held piece
    if (gs.heldPiece) {
      ctx.globalAlpha = gs.canHold ? 1 : 0.5;
      drawTetrominoPreview(ctx, gs.heldPiece, HOLD_CELL_SIZE, 5, 26);
      ctx.globalAlpha = 1;
    }
  }, [gameState.gameSpecific.heldPiece, gameState.gameSpecific.canHold, enableHold]);

  // ============================================================================
  // Render
  // ============================================================================

  const gs = gameState.gameSpecific;

  return (
    <div className={cn('tetris-game flex gap-4', className)}>
      {/* Hold Panel */}
      {enableHold && (
        <div className="flex flex-col gap-2">
          <canvas ref={holdCanvasRef} width={90} height={80} className="rounded-lg" />
        </div>
      )}

      {/* Main Game Board */}
      <div className="flex flex-col items-center">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="rounded-lg border-2 border-[#2D2D4A]"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Score Display */}
        <div className="mt-4 flex gap-6 text-center">
          <div>
            <div className="text-xs text-[#94A3B8] uppercase tracking-wide">Score</div>
            <div className="text-2xl font-mono font-bold text-[#00FFFF]">
              {gameState.score.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#94A3B8] uppercase tracking-wide">Level</div>
            <div className="text-2xl font-mono font-bold text-[#8B5CF6]">{gameState.level}</div>
          </div>
          <div>
            <div className="text-xs text-[#94A3B8] uppercase tracking-wide">Lines</div>
            <div className="text-2xl font-mono font-bold text-[#00FF00]">{gs.totalLines}</div>
          </div>
        </div>

        {/* Controls Help */}
        {!gameState.isPlaying && !gameState.isGameOver && (
          <div className="mt-4 text-center text-sm text-[#94A3B8]">
            <p>Press any key to start</p>
            <p className="mt-2 text-xs">
              ← → Move | ↑ Rotate | ↓ Soft Drop | Space Hard Drop | C Hold
            </p>
          </div>
        )}
      </div>

      {/* Preview Panel */}
      <div className="flex flex-col gap-2">
        <canvas
          ref={previewCanvasRef}
          width={90}
          height={26 + previewCount * 50}
          className="rounded-lg"
        />

        {/* Stats */}
        <div className="mt-4 p-3 bg-[#1A1A2E] rounded-lg border border-[#2D2D4A]">
          <div className="text-xs text-[#94A3B8] uppercase tracking-wide mb-2">Stats</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[#94A3B8]">Singles:</span>{' '}
              <span className="text-white font-mono">{gs.stats.singles}</span>
            </div>
            <div>
              <span className="text-[#94A3B8]">Doubles:</span>{' '}
              <span className="text-white font-mono">{gs.stats.doubles}</span>
            </div>
            <div>
              <span className="text-[#94A3B8]">Triples:</span>{' '}
              <span className="text-white font-mono">{gs.stats.triples}</span>
            </div>
            <div>
              <span className="text-[#00FFFF]">Tetrises:</span>{' '}
              <span className="text-[#00FFFF] font-mono font-bold">{gs.stats.tetrises}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export default TetrisGame;
