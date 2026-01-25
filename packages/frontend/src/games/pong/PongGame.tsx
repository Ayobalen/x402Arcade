/**
 * Pong Game Component
 *
 * Main component for the Pong game. Renders the game canvas and UI elements.
 *
 * @module games/pong/PongGame
 */

import { useEffect } from 'react';
import { usePongGame } from './usePongGame';
import { COURT_WIDTH, COURT_HEIGHT } from './constants';
import type { PongDifficulty } from './constants';
import { useScoreSubmission } from '../../hooks/useScoreSubmission';

// ============================================================================
// Component Props
// ============================================================================

/**
 * Props for the PongGame component.
 */
export interface PongGameProps {
  /** Game difficulty level */
  difficulty?: PongDifficulty;
  /** Game mode (single-player vs AI, or two-player) */
  mode?: 'single-player' | 'two-player';
  /** Callback when game ends (receives final score and session ID) */
  onGameOver?: (score: number, sessionId?: string) => void;
  /** Transaction hash from the game payment */
  transactionHash?: string;
  /** Whether to enable automatic score submission */
  enableScoreSubmission?: boolean;
  /** Callback when score submission completes */
  onScoreSubmitted?: (success: boolean, error?: string) => void;
  /** Enable ball trail effect */
  showBallTrail?: boolean;
  /** Show rally count display */
  showRallyCount?: boolean;
  /** Optional CSS class name */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Pong Game Component
 *
 * Renders a playable Pong game with canvas rendering and score display.
 *
 * @param props - Component props
 * @returns Pong game UI
 *
 * @example
 * ```tsx
 * <PongGame
 *   difficulty="normal"
 *   mode="single-player"
 *   onGameOver={(score) => console.log('Final score:', score)}
 * />
 * ```
 */
export function PongGame({
  difficulty = 'normal',
  mode = 'single-player',
  onGameOver,
  transactionHash,
  enableScoreSubmission = false,
  onScoreSubmitted,
  showBallTrail = true,
  showRallyCount = true,
  className = '',
}: PongGameProps) {
  // Use the Pong game hook
  const { state, canvasRef, start, restart, sessionId } = usePongGame({
    difficulty,
    mode,
    onGameOver,
    showBallTrail,
    showRallyCount,
  });

  // Score submission hook
  const {
    submit: submitScore,
    isSubmitting: isSubmittingScore,
    isSuccess: scoreSubmitted,
    isError: scoreSubmissionFailed,
    error: scoreError,
  } = useScoreSubmission();

  // Auto-submit score on game over
  useEffect(() => {
    if (
      state.isGameOver &&
      enableScoreSubmission &&
      sessionId &&
      !scoreSubmitted &&
      !isSubmittingScore
    ) {
      submitScore(sessionId, state.score).then((result) => {
        if (onScoreSubmitted) {
          onScoreSubmitted(!!result, result ? undefined : scoreError?.message);
        }
      });
    }
  }, [
    state.isGameOver,
    enableScoreSubmission,
    sessionId,
    state.score,
    scoreSubmitted,
    isSubmittingScore,
    submitScore,
    onScoreSubmitted,
    scoreError,
  ]);

  // Auto-start game on mount
  useEffect(() => {
    if (!state.isPlaying && !state.isGameOver) {
      start();
    }
  }, [state.isPlaying, state.isGameOver, start]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className={`pong-game ${className}`}>
      {/* Game Canvas */}
      <div className="game-container">
        <canvas
          ref={canvasRef}
          width={COURT_WIDTH}
          height={COURT_HEIGHT}
          className="game-canvas"
          style={{
            border: '2px solid #2D2D4A',
            borderRadius: '8px',
            display: 'block',
            imageRendering: 'pixelated',
          }}
        />
      </div>

      {/* Game Info */}
      <div className="game-info" style={{ marginTop: '1rem' }}>
        {/* Score Display */}
        <div className="score-display" style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <div
            style={{ fontSize: '2rem', fontFamily: 'JetBrains Mono, monospace', color: '#F8FAFC' }}
          >
            {state.gameSpecific?.leftScore.score ?? 0} - {state.gameSpecific?.rightScore.score ?? 0}
          </div>
          {state.gameSpecific && state.gameSpecific.currentRally >= 5 && (
            <div style={{ fontSize: '1rem', color: '#94A3B8', marginTop: '0.5rem' }}>
              Rally: {state.gameSpecific.currentRally}
            </div>
          )}
        </div>

        {/* Status Messages */}
        <div className="status-messages" style={{ textAlign: 'center', minHeight: '2rem' }}>
          {!state.isPlaying && !state.isGameOver && (
            <p style={{ color: '#8B5CF6' }}>Press SPACE or ENTER to start</p>
          )}
          {state.isPaused && <p style={{ color: '#8B5CF6' }}>Press ESC or P to resume</p>}
          {state.isGameOver && state.gameSpecific?.winCondition.winner && (
            <div>
              <p style={{ color: '#00ffff', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                {state.gameSpecific.winCondition.winner === 'left'
                  ? 'Player 1 Wins!'
                  : mode === 'single-player'
                    ? 'AI Wins!'
                    : 'Player 2 Wins!'}
              </p>
              {scoreSubmitted && (
                <p style={{ color: '#00ff00', fontSize: '0.9rem' }}>
                  ✓ Score submitted successfully!
                </p>
              )}
              {scoreSubmissionFailed && (
                <p style={{ color: '#ff0000', fontSize: '0.9rem' }}>
                  ✗ Score submission failed: {scoreError?.message}
                </p>
              )}
              {isSubmittingScore && (
                <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>Submitting score...</p>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="controls" style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button
            onClick={restart}
            style={{
              padding: '0.5rem 1.5rem',
              fontSize: '1rem',
              fontFamily: 'JetBrains Mono, monospace',
              backgroundColor: '#8B5CF6',
              color: '#F8FAFC',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#A78BFA';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#8B5CF6';
            }}
          >
            {state.isGameOver ? 'Play Again' : 'Restart'}
          </button>
        </div>

        {/* Controls Help */}
        <div
          className="controls-help"
          style={{
            marginTop: '1.5rem',
            padding: '1rem',
            backgroundColor: '#1A1A2E',
            borderRadius: '8px',
            fontSize: '0.9rem',
            color: '#94A3B8',
          }}
        >
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#F8FAFC' }}>Controls:</h4>
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            <li>Arrow Up / W - Move paddle up</li>
            <li>Arrow Down / S - Move paddle down</li>
            <li>ESC / P - Pause/Resume</li>
            <li>SPACE / ENTER - Start/Restart</li>
          </ul>
        </div>

        {/* Game Stats */}
        {state.gameSpecific && (
          <div
            className="game-stats"
            style={{
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: '#1A1A2E',
              borderRadius: '8px',
              fontSize: '0.9rem',
            }}
          >
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#F8FAFC' }}>Stats:</h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem',
                color: '#94A3B8',
              }}
            >
              <div>Player Hits: {state.gameSpecific.leftScore.totalHits}</div>
              <div>
                {mode === 'single-player' ? 'AI' : 'Player 2'} Hits:{' '}
                {state.gameSpecific.rightScore.totalHits}
              </div>
              <div>Player Rallies: {state.gameSpecific.leftScore.ralliesWon}</div>
              <div>
                {mode === 'single-player' ? 'AI' : 'Player 2'} Rallies:{' '}
                {state.gameSpecific.rightScore.ralliesWon}
              </div>
              <div>
                Longest Rally:{' '}
                {Math.max(
                  state.gameSpecific.leftScore.longestRally,
                  state.gameSpecific.rightScore.longestRally
                )}
              </div>
              <div>Current Rally: {state.gameSpecific.currentRally}</div>
            </div>
          </div>
        )}

        {/* Transaction Info */}
        {transactionHash && (
          <div
            className="transaction-info"
            style={{
              marginTop: '1rem',
              padding: '0.5rem',
              backgroundColor: '#1A1A2E',
              borderRadius: '4px',
              fontSize: '0.8rem',
              color: '#94A3B8',
              textAlign: 'center',
            }}
          >
            Transaction: {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export default PongGame;
