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
  const { state, canvasRef, restart } = useSnakeGame(difficulty, { onGameOver });

  return (
    <div className={`snake-game ${className}`}>
      {/* Score Display */}
      <div className="score-display">
        <span className="score-label">Score:</span>
        <span className="score-value">{state.gameSpecific.score}</span>
      </div>

      {/* Game Canvas */}
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="game-canvas" />

      {/* Controls Hint - Hidden during game over */}
      {!state.isGameOver && (
        <div className="controls-hint">
          <div className="control-group">
            <span className="control-key">↑ ↓ ← →</span>
            <span className="control-or">or</span>
            <span className="control-key">WASD</span>
            <span className="control-desc">Move</span>
          </div>
          <div className="control-separator">•</div>
          <div className="control-group">
            <span className="control-key">Space</span>
            <span className="control-or">or</span>
            <span className="control-key">Esc</span>
            <span className="control-desc">Pause</span>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {state.isGameOver && (
        <div className="game-over-overlay">
          <div className="game-over-content">
            <h2 className="game-over-title">Game Over</h2>
            <div className="final-score">
              <span className="final-score-label">Final Score</span>
              <span className="final-score-value">{state.gameSpecific.score}</span>
            </div>
            <button className="restart-button" onClick={restart}>
              Play Again
            </button>
          </div>
        </div>
      )}

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
          position: relative;
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

        .controls-hint {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-family: 'Inter', sans-serif;
          font-size: 0.875rem;
          color: #94a3b8;
          padding: 0.75rem;
          background: rgba(26, 26, 46, 0.5);
          border-radius: 0.5rem;
          border: 1px solid #2d2d4a;
        }

        .control-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .control-key {
          color: #00ffff;
          font-weight: 600;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          background: rgba(0, 255, 255, 0.1);
          border-radius: 0.25rem;
          border: 1px solid rgba(0, 255, 255, 0.3);
        }

        .control-or {
          color: #64748b;
          font-size: 0.75rem;
        }

        .control-desc {
          color: #f8fafc;
          font-weight: 500;
        }

        .control-separator {
          color: #2d2d4a;
        }

        .game-over-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(10, 10, 10, 0.9);
          backdrop-filter: blur(4px);
          border-radius: 0.5rem;
          z-index: 10;
        }

        .game-over-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          padding: 2rem;
          background: #16162a;
          border-radius: 1rem;
          border: 2px solid #2d2d4a;
          box-shadow: 0 0 30px rgba(0, 255, 255, 0.2);
        }

        .game-over-title {
          font-family: 'Inter', sans-serif;
          font-size: 2.5rem;
          font-weight: 700;
          color: #ff00ff;
          text-shadow: 0 0 10px rgba(255, 0, 255, 0.5);
          margin: 0;
        }

        .final-score {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .final-score-label {
          font-family: 'Inter', sans-serif;
          font-size: 1rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .final-score-value {
          font-family: 'Inter', sans-serif;
          font-size: 3rem;
          font-weight: 700;
          color: #00ffff;
          text-shadow: 0 0 15px rgba(0, 255, 255, 0.6);
        }

        .restart-button {
          padding: 0.75rem 2rem;
          font-family: 'Inter', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          color: #ffffff;
          background: linear-gradient(135deg, #00ffff 0%, #ff00ff 100%);
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
        }

        .restart-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
        }

        .restart-button:active {
          transform: translateY(0);
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
