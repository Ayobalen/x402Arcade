/**
 * Breakout Game Wrapper Component
 *
 * A comprehensive wrapper for the Breakout game that provides:
 * - Difficulty selection (Easy, Normal, Hard, Expert)
 * - Game state management with animations and transitions
 * - Session tracking integration with scoring API
 * - Arcade cabinet UI integration
 *
 * @module games/breakout/BreakoutGameWrapper
 */

import { useState, useCallback, useEffect } from 'react';
import { BreakoutGame } from './BreakoutGame';
import type { BreakoutDifficulty } from './types';
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
 * Props for the BreakoutGameWrapper component
 */
export interface BreakoutGameWrapperProps {
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
  initialDifficulty?: BreakoutDifficulty;
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
  BreakoutDifficulty,
  { name: string; description: string; color: string; icon: string }
> = {
  easy: {
    name: 'Easy',
    description: 'Slower ball, larger paddle, more lives',
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
    description: 'Faster ball, smaller paddle, tougher bricks',
    color: '#ff9900',
    icon: '🟠',
  },
  expert: {
    name: 'Expert',
    description: 'Maximum challenge - fast ball, tough bricks',
    color: '#ff4444',
    icon: '🔴',
  },
};

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Difficulty selection screen
 */
interface DifficultySelectProps {
  onSelect: (difficulty: BreakoutDifficulty) => void;
  onBack?: () => void;
}

const DifficultySelect: React.FC<DifficultySelectProps> = ({ onSelect, onBack }) => {
  const [hoveredDifficulty, setHoveredDifficulty] = useState<BreakoutDifficulty | null>(null);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-[#0F0F1A]">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-5xl font-bold text-[#F8FAFC] font-orbitron">
            SELECT DIFFICULTY
          </h1>
          <p className="text-lg text-[#94A3B8]">Choose your challenge level</p>
        </div>

        {/* Difficulty Cards */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2">
          {(Object.keys(DIFFICULTY_META) as BreakoutDifficulty[]).map((difficulty) => {
            const meta = DIFFICULTY_META[difficulty];
            const isHovered = hoveredDifficulty === difficulty;

            return (
              <button
                key={difficulty}
                onClick={() => onSelect(difficulty)}
                onMouseEnter={() => setHoveredDifficulty(difficulty)}
                onMouseLeave={() => setHoveredDifficulty(null)}
                className={cn(
                  'relative p-6 text-left transition-all duration-300 rounded-xl',
                  'bg-[#1A1A2E] border-2 hover:border-opacity-100',
                  'transform hover:scale-105 hover:shadow-2xl',
                  isHovered ? 'border-opacity-100' : 'border-opacity-30'
                )}
                style={{
                  borderColor: meta.color,
                  boxShadow: isHovered ? `0 0 20px ${meta.color}40` : 'none',
                }}
              >
                {/* Difficulty Icon & Name */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl">{meta.icon}</span>
                  <h2 className="text-3xl font-bold font-orbitron" style={{ color: meta.color }}>
                    {meta.name}
                  </h2>
                </div>

                {/* Description */}
                <p className="text-[#94A3B8] leading-relaxed">{meta.description}</p>

                {/* Hover indicator */}
                {isHovered && (
                  <div className="absolute top-4 right-4 animate-pulse">
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      style={{ color: meta.color }}
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Back Button */}
        {onBack && (
          <div className="text-center">
            <button
              onClick={onBack}
              className="px-8 py-3 text-[#94A3B8] hover:text-[#F8FAFC] transition-colors duration-200"
            >
              ← Back to Game Selection
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Countdown screen
 */
interface CountdownScreenProps {
  countdown: number;
}

const CountdownScreen: React.FC<CountdownScreenProps> = ({ countdown }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0F0F1A]">
      <div className="text-center">
        {countdown > 0 ? (
          <div className="animate-pulse">
            <div
              className="text-[160px] font-bold font-orbitron leading-none"
              style={{
                background: 'linear-gradient(135deg, #00ffff, #ff00ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {countdown}
            </div>
          </div>
        ) : (
          <div className="animate-pulse">
            <div
              className="text-[120px] font-bold font-orbitron"
              style={{
                background: 'linear-gradient(135deg, #00ff00, #ffff00)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              GO!
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Game over screen
 */
interface GameOverScreenProps {
  score: number;
  level: number;
  submissionStatus: ScoreSubmissionStatus;
  onPlayAgain: () => void;
  onExit: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({
  score,
  level,
  submissionStatus,
  onPlayAgain,
  onExit,
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-[#0F0F1A]">
      <div className="w-full max-w-2xl text-center">
        {/* Game Over Title */}
        <h1
          className="mb-8 text-6xl font-bold font-orbitron"
          style={{
            background: 'linear-gradient(135deg, #ff00ff, #00ffff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          GAME OVER
        </h1>

        {/* Score Card */}
        <div className="p-8 mb-8 bg-[#1A1A2E] border-2 border-[#2D2D4A] rounded-xl">
          <div className="mb-6">
            <div className="mb-2 text-[#94A3B8] text-sm uppercase tracking-wider">Final Score</div>
            <div className="text-6xl font-bold text-[#00ffff] font-jetbrains">
              {score.toLocaleString()}
            </div>
          </div>

          <div className="pt-6 border-t border-[#2D2D4A]">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <div className="text-[#94A3B8] text-sm mb-1">Level Reached</div>
                <div className="text-2xl font-bold text-[#F8FAFC] font-jetbrains">{level}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Score Submission Status */}
        {submissionStatus === 'submitting' && (
          <div className="mb-8 text-[#94A3B8] animate-pulse">Submitting score...</div>
        )}
        {submissionStatus === 'success' && (
          <div className="mb-8 text-[#00ff00]">✓ Score submitted to leaderboard!</div>
        )}
        {submissionStatus === 'error' && (
          <div className="mb-8 text-[#ff4444]">Failed to submit score</div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={onPlayAgain}
            className="px-8 py-4 bg-[#8B5CF6] hover:bg-[#A78BFA] text-[#F8FAFC] font-semibold rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            Play Again
          </button>
          <button
            onClick={onExit}
            className="px-8 py-4 bg-[#1A1A2E] hover:bg-[#2D2D4A] text-[#94A3B8] hover:text-[#F8FAFC] font-semibold rounded-lg border-2 border-[#2D2D4A] transition-all duration-200"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const BreakoutGameWrapper: React.FC<BreakoutGameWrapperProps> = ({
  sessionId: initialSessionId,
  transactionHash: _transactionHash,
  onGameOver: externalOnGameOver,
  onScoreSubmitted,
  onExit,
  enableScoreSubmission = true,
  skipDifficultySelect = false,
  initialDifficulty = 'normal',
  className,
}) => {
  // State
  const [phase, setPhase] = useState<GamePhase>(
    skipDifficultySelect ? 'countdown' : 'difficulty-select'
  );
  const [difficulty, setDifficulty] = useState<BreakoutDifficulty>(initialDifficulty);
  const [countdown, setCountdown] = useState<number>(COUNTDOWN_DURATION);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [finalLevel, setFinalLevel] = useState<number>(1);
  const [sessionId] = useState<string>(initialSessionId || `breakout-${Date.now()}`);
  const [scoreSubmissionStatus, setScoreSubmissionStatus] = useState<ScoreSubmissionStatus>('idle');
  const [remountKey, setRemountKey] = useState<number>(0);

  // ============================================================================
  // Handlers
  // ============================================================================

  /**
   * Handle difficulty selection
   */
  const handleDifficultySelect = useCallback((selectedDifficulty: BreakoutDifficulty) => {
    setDifficulty(selectedDifficulty);
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
    async (score: number, level: number, sid: string) => {
      setFinalScore(score);
      setFinalLevel(level);
      setPhase('transitioning');

      // Call external callback
      if (externalOnGameOver) {
        externalOnGameOver(score, sid);
      }

      // Submit score if enabled
      if (enableScoreSubmission) {
        setScoreSubmissionStatus('submitting');

        try {
          const response = await fetch('/api/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              game: 'breakout',
              score,
              level,
              sessionId: sid,
            }),
          });

          if (response.ok) {
            setScoreSubmissionStatus('success');
            if (onScoreSubmitted) {
              onScoreSubmitted(true);
            }
          } else {
            setScoreSubmissionStatus('error');
            if (onScoreSubmitted) {
              onScoreSubmitted(false, 'Server error');
            }
          }
        } catch (error) {
          // Error submitting score
          setScoreSubmissionStatus('error');
          if (onScoreSubmitted) {
            onScoreSubmitted(false, String(error));
          }
        }
      }

      setTimeout(() => {
        setPhase('game-over');
      }, PHASE_TRANSITION_DURATION);
    },
    [externalOnGameOver, enableScoreSubmission, onScoreSubmitted]
  );

  /**
   * Handle play again
   */
  const handlePlayAgain = useCallback(() => {
    setPhase('transitioning');
    setScoreSubmissionStatus('idle');
    setRemountKey((prev) => prev + 1);

    setTimeout(() => {
      setPhase(skipDifficultySelect ? 'countdown' : 'difficulty-select');
      setCountdown(COUNTDOWN_DURATION);
    }, PHASE_TRANSITION_DURATION);
  }, [skipDifficultySelect]);

  /**
   * Handle exit
   */
  const handleExit = useCallback(() => {
    if (onExit) {
      onExit();
    }
  }, [onExit]);

  // ============================================================================
  // Effects
  // ============================================================================

  /**
   * Countdown timer
   */
  useEffect(() => {
    if (phase !== 'countdown') return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Countdown finished, transition to playing
      const timer = setTimeout(() => {
        setPhase('playing');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [phase, countdown]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className={cn('w-full h-full', className)}>
      {phase === 'difficulty-select' && (
        <DifficultySelect onSelect={handleDifficultySelect} onBack={handleExit} />
      )}

      {phase === 'countdown' && <CountdownScreen countdown={countdown} />}

      {phase === 'playing' && (
        <BreakoutGame
          key={remountKey}
          difficulty={difficulty}
          sessionId={sessionId}
          onGameOver={handleGameOver}
          onExit={handleExit}
          enableScoreSubmission={enableScoreSubmission}
        />
      )}

      {phase === 'game-over' && (
        <GameOverScreen
          score={finalScore}
          level={finalLevel}
          submissionStatus={scoreSubmissionStatus}
          onPlayAgain={handlePlayAgain}
          onExit={handleExit}
        />
      )}

      {phase === 'transitioning' && (
        <div className="flex items-center justify-center min-h-screen bg-[#0F0F1A]">
          <div className="text-[#94A3B8] animate-pulse">Loading...</div>
        </div>
      )}
    </div>
  );
};

export default BreakoutGameWrapper;
