/**
 * Space Invaders Game Wrapper Component
 *
 * A comprehensive wrapper for the Space Invaders game that provides:
 * - Difficulty selection (Easy, Normal, Hard, Expert)
 * - Game state management with animations and transitions
 * - Session tracking integration with scoring API
 * - Arcade cabinet UI integration
 *
 * @module games/space-invaders/SpaceInvadersGameWrapper
 */

import { useState, useCallback, useEffect } from 'react';
import { SpaceInvadersGame } from './SpaceInvadersGame';
import type { SpaceInvadersDifficulty } from './constants';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

/**
 * Game phase for managing transitions and animations
 */
type GamePhase =
  | 'difficulty-select' // Choosing difficulty
  | 'countdown' // Pre-game countdown
  | 'playing' // Active gameplay
  | 'game-over' // Game ended, showing results
  | 'transitioning'; // Between phases

/**
 * Props for the SpaceInvadersGameWrapper component
 */
export interface SpaceInvadersGameWrapperProps {
  /** Session ID for game tracking */
  sessionId?: string;
  /** Transaction hash from payment */
  transactionHash?: string;
  /** Callback when game ends */
  onGameOver?: (score: number, sessionId?: string) => void;
  /** Callback when score is submitted */
  onScoreSubmitted?: (success: boolean, error?: string) => void;
  /** Callback when user exits/quits */
  onExit?: () => void;
  /** Enable automatic score submission */
  enableScoreSubmission?: boolean;
  /** Skip difficulty selection (use default) */
  skipDifficultySelect?: boolean;
  /** Initial difficulty if skipping selection */
  initialDifficulty?: SpaceInvadersDifficulty;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Score submission status
 */
type ScoreSubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';

// ============================================================================
// Constants
// ============================================================================

const COUNTDOWN_DURATION = 3; // seconds
const PHASE_TRANSITION_DURATION = 500; // ms

/**
 * Difficulty display metadata
 */
const DIFFICULTY_META: Record<
  SpaceInvadersDifficulty,
  { name: string; description: string; color: string; icon: string }
> = {
  easy: {
    name: 'Easy',
    description: 'More lives, slower aliens, less aggressive',
    color: '#00ff00',
    icon: '🟢',
  },
  normal: {
    name: 'Normal',
    description: 'Balanced gameplay for all skill levels',
    color: '#ffff00',
    icon: '🟡',
  },
  hard: {
    name: 'Hard',
    description: 'Faster aliens, more aggressive shooting',
    color: '#ff9900',
    icon: '🟠',
  },
  expert: {
    name: 'Expert',
    description: 'Maximum challenge - fast and deadly',
    color: '#ff4444',
    icon: '🔴',
  },
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * SpaceInvadersGameWrapper Component
 *
 * Wraps the core Space Invaders game with UI for difficulty selection,
 * countdown, game over screens, and score submission.
 */
export const SpaceInvadersGameWrapper: React.FC<SpaceInvadersGameWrapperProps> = ({
  sessionId = `space-invaders-${Date.now()}`,
  transactionHash,
  onGameOver,
  onScoreSubmitted,
  onExit,
  enableScoreSubmission = true,
  skipDifficultySelect = false,
  initialDifficulty = 'normal',
  className,
}) => {
  // ============================================================================
  // State
  // ============================================================================

  const [phase, setPhase] = useState<GamePhase>(
    skipDifficultySelect ? 'countdown' : 'difficulty-select'
  );
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<SpaceInvadersDifficulty>(initialDifficulty);
  const [countdown, setCountdown] = useState<number>(COUNTDOWN_DURATION);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [finalLevel, setFinalLevel] = useState<number>(1);
  const [finalWave, setFinalWave] = useState<number>(1);
  const [scoreSubmissionStatus, setScoreSubmissionStatus] = useState<ScoreSubmissionStatus>('idle');
  const [scoreSubmissionError, setScoreSubmissionError] = useState<string>('');
  const [gameKey, setGameKey] = useState<number>(0); // Force remount on restart

  // ============================================================================
  // Handlers
  // ============================================================================

  /**
   * Handle difficulty selection
   */
  const handleDifficultySelect = useCallback((difficulty: SpaceInvadersDifficulty) => {
    setSelectedDifficulty(difficulty);
    setPhase('transitioning');
    setTimeout(() => {
      setPhase('countdown');
      setCountdown(COUNTDOWN_DURATION);
    }, PHASE_TRANSITION_DURATION);
  }, []);

  /**
   * Handle game over
   */
  const handleGameOver = useCallback(
    (score: number, level: number, wave: number, session: string) => {
      setFinalScore(score);
      setFinalLevel(level);
      setFinalWave(wave);
      setPhase('game-over');

      // Call parent callback
      if (onGameOver) {
        onGameOver(score, session);
      }

      // Submit score to API if enabled
      if (enableScoreSubmission) {
        submitScore(score, level, wave, session);
      }
    },
    [onGameOver, enableScoreSubmission]
  );

  /**
   * Submit score to API
   */
  const submitScore = async (score: number, level: number, wave: number, session: string) => {
    setScoreSubmissionStatus('submitting');
    setScoreSubmissionError('');

    try {
      const response = await fetch('/api/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameType: 'space-invaders',
          score,
          level,
          wave,
          sessionId: session,
          transactionHash,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit score');
      }

      setScoreSubmissionStatus('success');
      if (onScoreSubmitted) {
        onScoreSubmitted(true);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setScoreSubmissionStatus('error');
      setScoreSubmissionError(errorMessage);
      // Log error silently (console.error removed for linting)
      if (onScoreSubmitted) {
        onScoreSubmitted(false, errorMessage);
      }
    }
  };

  /**
   * Handle play again
   */
  const handlePlayAgain = useCallback(() => {
    setPhase('difficulty-select');
    setFinalScore(0);
    setFinalLevel(1);
    setFinalWave(1);
    setScoreSubmissionStatus('idle');
    setScoreSubmissionError('');
    setGameKey((prev) => prev + 1); // Force component remount
  }, []);

  /**
   * Handle back to menu from difficulty select
   */
  const handleBackToMenu = useCallback(() => {
    if (onExit) {
      onExit();
    }
  }, [onExit]);

  /**
   * Handle exit from game over
   */
  const handleExitFromGameOver = useCallback(() => {
    if (onExit) {
      onExit();
    }
  }, [onExit]);

  // ============================================================================
  // Effects
  // ============================================================================

  /**
   * Countdown timer effect
   */
  useEffect(() => {
    if (phase === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'countdown' && countdown === 0) {
      setPhase('playing');
    }
  }, [phase, countdown]);

  // ============================================================================
  // Render Functions
  // ============================================================================

  /**
   * Render difficulty selection screen
   */
  const renderDifficultySelect = () => (
    <div className="flex flex-col items-center justify-center h-full bg-[#0F0F1A] p-8">
      <h1 className="text-5xl font-bold text-cyan-400 mb-4 animate-pulse">SPACE INVADERS</h1>
      <p className="text-xl text-slate-300 mb-12">SELECT DIFFICULTY</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
        {(Object.keys(DIFFICULTY_META) as SpaceInvadersDifficulty[]).map((difficulty) => {
          const meta = DIFFICULTY_META[difficulty];
          return (
            <button
              key={difficulty}
              onClick={() => handleDifficultySelect(difficulty)}
              className={cn(
                'group relative p-6 rounded-xl border-2 transition-all duration-300',
                'bg-[#1A1A2E] hover:bg-[#2D2D4A]',
                'hover:scale-105 hover:shadow-2xl',
                'flex flex-col items-start gap-3'
              )}
              style={{
                borderColor: meta.color,
                boxShadow: `0 0 20px ${meta.color}33`,
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-4xl">{meta.icon}</span>
                <h3 className="text-2xl font-bold text-white">{meta.name}</h3>
              </div>
              <p className="text-slate-400 text-left">{meta.description}</p>
              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                style={{ backgroundColor: meta.color }}
              />
            </button>
          );
        })}
      </div>

      {onExit && (
        <button
          onClick={handleBackToMenu}
          className="mt-8 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors duration-200"
        >
          ← Back to Menu
        </button>
      )}
    </div>
  );

  /**
   * Render countdown screen
   */
  const renderCountdown = () => (
    <div className="flex items-center justify-center h-full bg-[#0F0F1A]">
      <div className="text-center">
        {countdown > 0 ? (
          <div className="animate-pulse">
            <div
              className="text-9xl font-bold mb-4"
              style={{
                color: '#00ffff',
                textShadow: '0 0 30px #00ffff',
                animation: 'pulse 0.5s ease-in-out',
              }}
            >
              {countdown}
            </div>
            <p className="text-2xl text-slate-300">Get Ready!</p>
          </div>
        ) : (
          <div
            className="text-8xl font-bold animate-pulse"
            style={{
              color: '#00ff00',
              textShadow: '0 0 40px #00ff00',
            }}
          >
            GO!
          </div>
        )}
      </div>
    </div>
  );

  /**
   * Render game over screen
   */
  const renderGameOver = () => {
    const difficultyMeta = DIFFICULTY_META[selectedDifficulty];

    return (
      <div className="flex items-center justify-center h-full bg-[#0F0F1A] p-8">
        <div className="text-center space-y-6 max-w-2xl">
          <h2 className="text-6xl font-bold text-red-500 mb-8 animate-pulse">GAME OVER</h2>

          {/* Score Card */}
          <div className="bg-[#1A1A2E] border-2 border-cyan-500 rounded-xl p-8 space-y-4 shadow-2xl">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xl text-slate-400">Final Score:</span>
                <span className="text-4xl font-bold text-cyan-400">
                  {finalScore.toString().padStart(6, '0')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg text-slate-400">Level Reached:</span>
                <span className="text-2xl font-bold text-yellow-400">
                  {finalLevel}-{finalWave}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg text-slate-400">Difficulty:</span>
                <span
                  className="text-xl font-bold flex items-center gap-2"
                  style={{ color: difficultyMeta.color }}
                >
                  {difficultyMeta.icon} {difficultyMeta.name}
                </span>
              </div>
            </div>

            {/* Score submission status */}
            {enableScoreSubmission && (
              <div className="mt-6 pt-6 border-t border-slate-700">
                {scoreSubmissionStatus === 'submitting' && (
                  <p className="text-blue-400 animate-pulse">Submitting score...</p>
                )}
                {scoreSubmissionStatus === 'success' && (
                  <p className="text-green-400">✓ Score submitted to leaderboard!</p>
                )}
                {scoreSubmissionStatus === 'error' && (
                  <p className="text-red-400">✗ Failed to submit: {scoreSubmissionError}</p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center mt-8">
            <button
              onClick={handlePlayAgain}
              className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              Play Again
            </button>
            {onExit && (
              <button
                onClick={handleExitFromGameOver}
                className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors duration-200"
              >
                Exit to Menu
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render transitioning screen
   */
  const renderTransitioning = () => (
    <div className="flex items-center justify-center h-full bg-[#0F0F1A]">
      <div className="text-4xl text-cyan-400 animate-pulse">Loading...</div>
    </div>
  );

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className={cn('w-full h-full relative', className)}>
      {phase === 'difficulty-select' && renderDifficultySelect()}
      {phase === 'countdown' && renderCountdown()}
      {phase === 'playing' && (
        <SpaceInvadersGame
          key={gameKey}
          difficulty={selectedDifficulty}
          sessionId={sessionId}
          onGameOver={handleGameOver}
          onExit={onExit}
        />
      )}
      {phase === 'game-over' && renderGameOver()}
      {phase === 'transitioning' && renderTransitioning()}
    </div>
  );
};

export default SpaceInvadersGameWrapper;
