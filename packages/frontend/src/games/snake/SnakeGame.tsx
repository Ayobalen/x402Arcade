/**
 * Snake Game Component
 *
 * Main component for the Snake game. Renders the game canvas and UI elements.
 *
 * @module games/snake/SnakeGame
 */

import { useSnakeGame } from './useSnakeGame';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';
import type { SnakeDifficulty } from './constants';

// ============================================================================
// Component Props
// ============================================================================

/**
 * Props for the SnakeGame component.
 */
export interface SnakeGameProps {
  /** Game difficulty level */
  difficulty?: SnakeDifficulty;
  /** Callback when game ends (receives final score) */
  onGameOver?: (score: number) => void;
  /** Optional CSS class name */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Snake Game Component
 *
 * Renders a playable Snake game with canvas rendering and score display.
 *
 * @param props - Component props
 * @returns Snake game UI
 *
 * @example
 * ```tsx
 * <SnakeGame
 *   difficulty="normal"
 *   onGameOver={(score) => console.log('Final score:', score)}
 * />
 * ```
 */
export function SnakeGame({ difficulty = 'normal', onGameOver, className = '' }: SnakeGameProps) {
  // Use the Snake game hook
  const { state, canvasRef } = useSnakeGame(difficulty, { onGameOver });

  return (
    <div className={`snake-game ${className}`}>
      {/* Score Display */}
      <div className="score-display">
        <span className="score-label">Score:</span>
        <span className="score-value">{state.gameSpecific.score}</span>
      </div>

      {/* Game Canvas */}
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="game-canvas" />

      {/* Game Info */}
      <div className="game-info">
        <div className="info-item">
          <span className="info-label">Level:</span>
          <span className="info-value">{state.level}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Difficulty:</span>
          <span className="info-value">{state.gameSpecific.difficulty}</span>
        </div>
      </div>

      <style jsx>{`
        .snake-game {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
        }

        .score-display {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: 'Inter', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #f8fafc;
        }

        .score-label {
          color: #94a3b8;
        }

        .score-value {
          color: #00ffff;
          min-width: 4rem;
          text-align: right;
        }

        .game-canvas {
          border: 2px solid #2d2d4a;
          border-radius: 0.5rem;
          background: #0a0a0a;
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
        }

        .game-info {
          display: flex;
          gap: 2rem;
          font-family: 'Inter', sans-serif;
          font-size: 0.875rem;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .info-label {
          color: #94a3b8;
        }

        .info-value {
          color: #f8fafc;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}

export default SnakeGame;
