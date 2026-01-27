/**
 * Snake Game Component
 *
 * Main component for the Snake game. Renders the game canvas and UI elements.
 *
 * @module games/snake/SnakeGame
 */

import { useEffect, useCallback } from 'react';
import { useSnakeGame } from './useSnakeGame';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';
import type { SnakeDifficulty } from './constants';
import { getTxUrl } from '../../config/chain';
import { useScoreSubmission } from '../../hooks/useScoreSubmission';

// ============================================================================
// Component Props
// ============================================================================

import type { RankingEntry } from './useSnakeGame';

/**
 * Props for the SnakeGame component.
 */
export interface SnakeGameProps {
  /** Game difficulty level */
  difficulty?: SnakeDifficulty;
  /** Callback when game ends (receives final score and session ID) */
  onGameOver?: (score: number, sessionId?: string) => void;
  /** Callback to fetch rankings after game over */
  onFetchRankings?: (score: number) => Promise<RankingEntry[]>;
  /** Transaction hash from the game payment */
  transactionHash?: string;
  /** Whether to enable automatic score submission */
  enableScoreSubmission?: boolean;
  /** Callback when score submission completes */
  onScoreSubmitted?: (success: boolean, error?: string) => void;
  /** External session ID from payment/backend */
  sessionId?: string;
  /** Player's wallet address for score submission */
  playerAddress?: string;
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
export function SnakeGame({
  difficulty = 'normal',
  onGameOver,
  onFetchRankings,
  transactionHash,
  enableScoreSubmission = false,
  onScoreSubmitted,
  sessionId: externalSessionId,
  playerAddress,
  className = '',
}: SnakeGameProps) {
  // Use the Snake game hook
  const { state, canvasRef, restart, playerRank, rankings, isLoadingRankings, sessionId } =
    useSnakeGame(difficulty, { onGameOver, onFetchRankings, sessionId: externalSessionId });

  // Score submission hook
  const {
    submit: submitScore,
    isSubmitting: isSubmittingScore,
    isSuccess: scoreSubmitted,
    isError: scoreSubmissionFailed,
    error: scoreError,
    reset: resetScoreSubmission,
  } = useScoreSubmission();

  // Auto-submit score on game over
  useEffect(() => {
    if (
      state.isGameOver &&
      enableScoreSubmission &&
      sessionId &&
      playerAddress &&
      !scoreSubmitted &&
      !isSubmittingScore
    ) {
      submitScore(sessionId, state.score, playerAddress || '')
        .then((result) => {
          if (onScoreSubmitted) {
            onScoreSubmitted(!!result, result ? undefined : scoreError?.message);
          }
        })
        .catch((error) => {
          // Silently log score submission errors - don't block the UI
          console.error('Score submission failed:', error);
          if (onScoreSubmitted) {
            onScoreSubmitted(false, error?.message || 'Failed to submit score');
          }
        });
    }
  }, [
    state.isGameOver,
    enableScoreSubmission,
    sessionId,
    playerAddress,
    state.score,
    scoreSubmitted,
    isSubmittingScore,
    submitScore,
    onScoreSubmitted,
    scoreError?.message,
  ]);

  // Reset score submission state when game restarts
  const handleRestart = useCallback(() => {
    resetScoreSubmission();
    restart();
  }, [resetScoreSubmission, restart]);

  return (
    <div className={`snake-game ${className}`}>
      {/* Score Display */}
      <div className="score-display">
        <span className="score-label">Score:</span>
        <span className="score-value">{state.score}</span>
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

      {/* Game Over Overlay - Simplified */}
      {state.isGameOver && (
        <div className="game-over-overlay">
          <div className="game-over-content">
            <h2 className="game-over-title">Game Over</h2>

            {/* Final Score - Prominent Display */}
            <div className="final-score">
              <span className="final-score-label">Final Score</span>
              <span className="final-score-value">{state.score}</span>
            </div>

            {/* Your Rank - Compact Display */}
            {!isLoadingRankings && playerRank !== null && (
              <div className="player-rank">
                <span className="rank-label">Your Rank</span>
                <span className="rank-value">#{playerRank}</span>
              </div>
            )}

            {isLoadingRankings && (
              <div className="ranking-loading">
                <span className="loading-text">Loading rank...</span>
              </div>
            )}

            {/* Play Again Button */}
            <button className="restart-button" onClick={handleRestart}>
              Play Again
            </button>

            {/* Helpful Hint */}
            <div className="leaderboard-hint">
              <span className="hint-text">Check the leaderboard for full rankings →</span>
            </div>
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
          <span className="info-value">{state.gameSpecific?.difficulty ?? 'normal'}</span>
        </div>
      </div>

      <style>{`
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
          color: var(--color-primary);
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
          color: var(--color-primary);
          font-weight: 600;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          background: var(--color-primary-glow);
          border-radius: 0.25rem;
          border: 1px solid var(--color-primary);
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
          background: rgba(10, 10, 10, 0.85);
          backdrop-filter: blur(8px);
          border-radius: 0.5rem;
          z-index: 10;
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .game-over-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          padding: 2.5rem 3rem;
          background: rgba(22, 22, 42, 0.95);
          border-radius: 1.5rem;
          border: 3px solid var(--color-primary);
          box-shadow: var(--glow-cyan-lg);
          max-width: 400px;
        }

        .game-over-title {
          font-family: 'Inter', sans-serif;
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--color-secondary);
          text-shadow: var(--glow-magenta);
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
          color: var(--color-primary);
          text-shadow: var(--glow-cyan-md);
        }

        .ranking-loading {
          padding: 1rem;
          text-align: center;
        }

        .loading-text {
          font-family: 'Inter', sans-serif;
          font-size: 0.875rem;
          color: #94a3b8;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .player-rank {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 1.5rem;
          background: var(--color-primary-glow);
          border: 2px solid var(--color-primary);
          border-radius: 0.75rem;
          box-shadow: var(--glow-cyan);
        }

        .rank-label {
          font-family: 'Inter', sans-serif;
          font-size: 0.875rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .rank-value {
          font-family: 'Inter', sans-serif;
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--color-primary);
          text-shadow: var(--glow-cyan-md);
        }

        .leaderboard-hint {
          margin-top: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(148, 163, 184, 0.1);
          border-radius: 0.5rem;
          text-align: center;
        }

        .hint-text {
          font-family: 'Inter', sans-serif;
          font-size: 0.75rem;
          color: #94a3b8;
          font-style: italic;
        }

        .submission-status {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 2rem;
          margin: 0.5rem 0;
        }

        .submission-loading,
        .submission-success,
        .submission-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-family: 'Inter', sans-serif;
          font-size: 0.875rem;
        }

        .submission-loading {
          color: var(--color-primary);
          background: var(--color-primary-glow);
          border: 1px solid var(--color-primary);
        }

        .submission-success {
          color: #00ff00;
          background: rgba(0, 255, 0, 0.1);
          border: 1px solid rgba(0, 255, 0, 0.2);
        }

        .submission-error {
          color: #ff4444;
          background: rgba(255, 68, 68, 0.1);
          border: 1px solid rgba(255, 68, 68, 0.2);
        }

        .submission-spinner {
          width: 1rem;
          height: 1rem;
          border: 2px solid var(--color-primary-glow);
          border-top-color: var(--color-primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .submission-icon {
          font-size: 1rem;
          font-weight: bold;
        }

        .submission-text {
          font-weight: 500;
        }

        .restart-button {
          padding: 1rem 3rem;
          font-family: 'Inter', sans-serif;
          font-size: 1.125rem;
          font-weight: 700;
          color: #ffffff;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
          border: 2px solid var(--color-primary);
          border-radius: 0.75rem;
          cursor: pointer;
          transition: all 0.15s ease-out;
          box-shadow: var(--glow-cyan-md);
        }

        .restart-button:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: var(--glow-cyan-intense);
          border-color: var(--color-secondary);
        }

        .restart-button:active {
          transform: translateY(-1px) scale(0.98);
        }

        .restart-button:active {
          transform: translateY(0);
        }

        .restart-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .restart-button:disabled:hover {
          transform: none;
          box-shadow: none;
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
