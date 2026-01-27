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

      {/* Game Over Overlay */}
      {state.isGameOver && (
        <div className="game-over-overlay">
          <div className="game-over-content">
            <h2 className="game-over-title">Game Over</h2>
            <div className="final-score">
              <span className="final-score-label">Final Score</span>
              <span className="final-score-value">{state.score}</span>
            </div>

            {/* Ranking Display */}
            {isLoadingRankings && (
              <div className="ranking-loading">
                <span className="loading-text">Loading rankings...</span>
              </div>
            )}

            {!isLoadingRankings && playerRank !== null && (
              <div className="player-rank">
                <span className="rank-label">Your Rank</span>
                <span className="rank-value">#{playerRank}</span>
              </div>
            )}

            <div className="nearby-rankings">
              <span className="rankings-title">Leaderboard</span>
              {isLoadingRankings && (
                <div className="ranking-loading">
                  <span className="loading-text">Loading...</span>
                </div>
              )}
              {!isLoadingRankings && rankings.length === 0 && (
                <div className="ranking-empty">
                  <span className="empty-text">No rankings yet</span>
                </div>
              )}
              {!isLoadingRankings && rankings.length > 0 && (
                <div className="rankings-list">
                  {rankings.slice(0, 5).map((entry) => (
                    <div
                      key={`rank-${entry.rank}`}
                      className={`ranking-entry ${entry.isCurrentPlayer ? 'current-player' : ''}`}
                    >
                      <span className="ranking-position">#{entry.rank}</span>
                      <span className="ranking-address">
                        {entry.playerAddress.slice(0, 6)}...{entry.playerAddress.slice(-4)}
                      </span>
                      <span className="ranking-score">{entry.score}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Transaction Verification Link */}
            {transactionHash && (
              <a
                href={getTxUrl(transactionHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="transaction-link"
              >
                <span className="tx-icon">&#x2713;</span>
                <span className="tx-text">Verify on Explorer</span>
              </a>
            )}

            <button className="restart-button" onClick={handleRestart}>
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
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          padding: 1rem 2rem;
          background: rgba(0, 255, 0, 0.1);
          border: 1px solid rgba(0, 255, 0, 0.3);
          border-radius: 0.5rem;
        }

        .rank-label {
          font-family: 'Inter', sans-serif;
          font-size: 0.75rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .rank-value {
          font-family: 'Inter', sans-serif;
          font-size: 2rem;
          font-weight: 700;
          color: #00ff00;
          text-shadow: 0 0 10px rgba(0, 255, 0, 0.6);
        }

        .nearby-rankings {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          max-width: 300px;
        }

        .rankings-title {
          font-family: 'Inter', sans-serif;
          font-size: 0.875rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .rankings-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: 100%;
        }

        .ranking-entry {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 0.75rem;
          background: rgba(26, 26, 46, 0.8);
          border: 1px solid #2d2d4a;
          border-radius: 0.375rem;
          font-family: 'Inter', sans-serif;
          font-size: 0.875rem;
        }

        .ranking-entry.current-player {
          background: rgba(0, 255, 255, 0.1);
          border-color: rgba(0, 255, 255, 0.4);
        }

        .ranking-position {
          font-weight: 600;
          color: #f8fafc;
          min-width: 2.5rem;
        }

        .ranking-address {
          color: #94a3b8;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
        }

        .ranking-entry.current-player .ranking-address {
          color: #00ffff;
        }

        .ranking-score {
          font-weight: 600;
          color: #00ffff;
          min-width: 3rem;
          text-align: right;
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
          color: #00ffff;
          background: rgba(0, 255, 255, 0.1);
          border: 1px solid rgba(0, 255, 255, 0.2);
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
          border: 2px solid rgba(0, 255, 255, 0.3);
          border-top-color: #00ffff;
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

        .transaction-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          color: #94a3b8;
          text-decoration: none;
          background: rgba(0, 255, 0, 0.05);
          border: 1px solid rgba(0, 255, 0, 0.2);
          border-radius: 0.375rem;
          transition: all 0.2s ease;
        }

        .transaction-link:hover {
          color: #00ff00;
          background: rgba(0, 255, 0, 0.1);
          border-color: rgba(0, 255, 0, 0.4);
        }

        .tx-icon {
          color: #00ff00;
          font-size: 0.875rem;
        }

        .tx-text {
          letter-spacing: 0.025em;
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
