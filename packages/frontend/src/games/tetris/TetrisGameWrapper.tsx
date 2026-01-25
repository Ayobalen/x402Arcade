/**
 * Tetris Game Wrapper Component
 *
 * A comprehensive wrapper for the Tetris game that provides:
 * - Difficulty selection (Easy, Normal, Hard, Expert)
 * - Game state management with animations and transitions
 * - Session tracking integration with scoring API
 * - Arcade cabinet UI integration
 *
 * @module games/tetris/TetrisGameWrapper
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { TetrisGame } from './TetrisGame';
import type { TetrisDifficulty } from './constants';
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
 * Props for the TetrisGameWrapper component
 */
export interface TetrisGameWrapperProps {
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
  initialDifficulty?: TetrisDifficulty;
  /** Optional CSS class name */
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const COUNTDOWN_DURATION = 3; // seconds
const PHASE_TRANSITION_DURATION = 500; // ms

/**
 * Difficulty display metadata
 */
const DIFFICULTY_META: Record<
  TetrisDifficulty,
  { name: string; description: string; color: string; icon: string }
> = {
  easy: {
    name: 'Easy',
    description: 'Slower drop speed, more forgiving gameplay',
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
    description: 'Faster drops, higher starting level',
    color: '#ff9900',
    icon: '🟠',
  },
  expert: {
    name: 'Expert',
    description: 'Maximum speed challenge - for pros only',
    color: '#ff4444',
    icon: '🔴',
  },
};

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Difficulty Selection Screen
 */
function DifficultySelectScreen({
  onSelect,
  onBack,
}: {
  onSelect: (difficulty: TetrisDifficulty) => void;
  onBack?: () => void;
}) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<TetrisDifficulty>('normal');
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const handleSelect = useCallback(() => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      onSelect(selectedDifficulty);
    }, PHASE_TRANSITION_DURATION);
  }, [selectedDifficulty, onSelect]);

  const difficulties: TetrisDifficulty[] = ['easy', 'normal', 'hard', 'expert'];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center min-h-[600px] p-8',
        'transition-all duration-500',
        isAnimatingOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      )}
    >
      {/* Title */}
      <h2
        className={cn(
          'text-4xl md:text-5xl font-bold mb-2',
          'bg-gradient-to-r from-[#00ffff] via-[#ff00ff] to-[#00ffff]',
          'bg-clip-text text-transparent',
          'animate-pulse'
        )}
      >
        TETRIS
      </h2>
      <p className="text-lg text-white/70 mb-8">Select Your Difficulty</p>

      {/* Difficulty Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 max-w-2xl">
        {difficulties.map((difficulty) => {
          const meta = DIFFICULTY_META[difficulty];
          const isSelected = selectedDifficulty === difficulty;

          return (
            <button
              key={difficulty}
              onClick={() => setSelectedDifficulty(difficulty)}
              className={cn(
                'relative px-6 py-4 rounded-xl',
                'min-w-[200px]',
                'border-2 transition-all duration-200',
                'text-left',
                isSelected
                  ? 'border-[#00ffff] bg-[#1a1a2e]/80'
                  : 'border-[#2d2d4a] bg-[#1a1a2e]/40 hover:border-[#00ffff]/50'
              )}
            >
              {/* Icon */}
              <div className="text-3xl mb-2">{meta.icon}</div>

              {/* Title */}
              <h3
                className="text-xl font-bold mb-1"
                style={{ color: isSelected ? meta.color : '#ffffff' }}
              >
                {meta.name}
              </h3>

              {/* Description */}
              <p className="text-sm text-white/60">{meta.description}</p>

              {/* Selection Indicator */}
              {isSelected && (
                <div
                  className="absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center"
                  style={{ borderColor: meta.color }}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: meta.color }} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Start Button */}
      <button
        onClick={handleSelect}
        className={cn(
          'px-12 py-4 rounded-xl',
          'bg-gradient-to-r from-[#00ffff] to-[#ff00ff]',
          'text-black font-bold text-lg uppercase tracking-wider',
          'hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,255,0.6)]',
          'transition-all duration-200'
        )}
      >
        Start Game
      </button>

      {/* Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          className={cn(
            'mt-4 px-6 py-2 rounded-lg',
            'border border-[#2d2d4a]',
            'text-white/70 hover:text-white',
            'hover:border-[#00ffff]/50',
            'transition-all duration-200'
          )}
        >
          ← Back
        </button>
      )}
    </div>
  );
}

/**
 * Countdown Screen (3-2-1-GO!)
 */
function CountdownScreen({ count }: { count: number }) {
  return (
    <div className="flex items-center justify-center min-h-[600px]">
      <div
        className={cn(
          'text-8xl md:text-9xl font-bold',
          'bg-gradient-to-r from-[#00ffff] to-[#ff00ff]',
          'bg-clip-text text-transparent',
          'animate-pulse'
        )}
      >
        {count === 0 ? 'GO!' : count}
      </div>
    </div>
  );
}

/**
 * Game Over Screen
 */
function GameOverScreen({
  score,
  level,
  lines,
  onRestart,
  onExit,
  scoreSubmitStatus,
}: {
  score: number;
  level: number;
  lines: number;
  onRestart: () => void;
  onExit?: () => void;
  scoreSubmitStatus?: 'idle' | 'submitting' | 'success' | 'error';
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] p-8">
      {/* Game Over Title */}
      <h2
        className={cn(
          'text-5xl md:text-6xl font-bold mb-8',
          'bg-gradient-to-r from-[#ff00ff] via-[#00ffff] to-[#ff00ff]',
          'bg-clip-text text-transparent'
        )}
      >
        GAME OVER
      </h2>

      {/* Score Card */}
      <div
        className={cn(
          'p-8 rounded-2xl mb-8',
          'bg-[#1a1a2e]',
          'border-2 border-[#2d2d4a]',
          'min-w-[300px]'
        )}
      >
        {/* Final Score */}
        <div className="text-center mb-6">
          <div className="text-sm text-[#94A3B8] uppercase tracking-wide mb-2">Final Score</div>
          <div className="text-5xl font-mono font-bold text-[#00FFFF]">
            {score.toLocaleString()}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#2d2d4a]">
          <div className="text-center">
            <div className="text-xs text-[#94A3B8] uppercase tracking-wide mb-1">Level</div>
            <div className="text-2xl font-mono font-bold text-[#8B5CF6]">{level}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-[#94A3B8] uppercase tracking-wide mb-1">Lines</div>
            <div className="text-2xl font-mono font-bold text-[#00FF00]">{lines}</div>
          </div>
        </div>

        {/* Score Submission Status */}
        {scoreSubmitStatus && scoreSubmitStatus !== 'idle' && (
          <div className="mt-4 pt-4 border-t border-[#2d2d4a] text-center text-sm">
            {scoreSubmitStatus === 'submitting' && (
              <div className="text-[#94A3B8]">Submitting score...</div>
            )}
            {scoreSubmitStatus === 'success' && (
              <div className="text-[#00ff00]">✓ Score submitted to leaderboard!</div>
            )}
            {scoreSubmitStatus === 'error' && (
              <div className="text-[#ff4444]">✗ Failed to submit score</div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onRestart}
          className={cn(
            'px-8 py-4 rounded-xl',
            'bg-gradient-to-r from-[#00ffff] to-[#ff00ff]',
            'text-black font-bold text-lg uppercase tracking-wider',
            'hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,255,0.6)]',
            'transition-all duration-200'
          )}
        >
          Play Again
        </button>

        {onExit && (
          <button
            onClick={onExit}
            className={cn(
              'px-8 py-4 rounded-xl',
              'border border-[#2d2d4a]',
              'text-white font-semibold text-lg',
              'hover:border-[#00ffff]',
              'hover:text-[#00ffff]',
              'transition-all duration-200'
            )}
          >
            Exit
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Tetris Game Wrapper Component
 *
 * Manages the complete Tetris game flow including difficulty selection,
 * countdown, gameplay, and game over screens with smooth transitions.
 */
export function TetrisGameWrapper({
  sessionId: providedSessionId,
  transactionHash,
  onGameOver: externalOnGameOver,
  onScoreSubmitted,
  onExit,
  enableScoreSubmission = false,
  skipDifficultySelect = false,
  initialDifficulty = 'normal',
  className = '',
}: TetrisGameWrapperProps) {
  // ============================================================================
  // State Management
  // ============================================================================

  const [phase, setPhase] = useState<GamePhase>(
    skipDifficultySelect ? 'countdown' : 'difficulty-select'
  );
  const [difficulty, setDifficulty] = useState<TetrisDifficulty>(initialDifficulty);
  const [countdown, setCountdown] = useState(COUNTDOWN_DURATION);
  const [finalScore, setFinalScore] = useState(0);
  const [finalLevel, setFinalLevel] = useState(1);
  const [finalLines, setFinalLines] = useState(0);
  const [scoreSubmitStatus, setScoreSubmitStatus] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle');

  // Generate session ID if not provided
  const sessionIdRef = useRef(providedSessionId || `tetris-${Date.now()}`);
  const gameKeyRef = useRef(0); // Force remount on restart

  // ============================================================================
  // Phase Handlers
  // ============================================================================

  /**
   * Handle difficulty selection
   */
  const handleDifficultySelect = useCallback((selectedDifficulty: TetrisDifficulty) => {
    setDifficulty(selectedDifficulty);
    setPhase('transitioning');
    setTimeout(() => {
      setPhase('countdown');
      setCountdown(COUNTDOWN_DURATION);
    }, PHASE_TRANSITION_DURATION);
  }, []);

  /**
   * Handle countdown completion - start game
   */
  useEffect(() => {
    if (phase !== 'countdown') return;

    if (countdown === 0) {
      setPhase('playing');
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [phase, countdown]);

  /**
   * Handle game over
   */
  const handleGameOver = useCallback(
    (score: number, sessionId?: string) => {
      setFinalScore(score);
      // Store level and lines from game state if available
      // (These would be passed from TetrisGame component ideally)
      setFinalLevel(1); // Default - will be updated if TetrisGame provides it
      setFinalLines(0); // Default - will be updated if TetrisGame provides it

      setPhase('game-over');

      // Call external callback
      if (externalOnGameOver) {
        externalOnGameOver(score, sessionId || sessionIdRef.current);
      }

      // Submit score if enabled
      if (enableScoreSubmission && transactionHash) {
        handleScoreSubmit(score, sessionId || sessionIdRef.current);
      }
    },
    [externalOnGameOver, enableScoreSubmission, transactionHash]
  );

  /**
   * Submit score to backend
   */
  const handleScoreSubmit = useCallback(
    async (score: number, sessionId: string) => {
      setScoreSubmitStatus('submitting');

      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/api/score`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            score,
          }),
        });

        if (!response.ok) {
          throw new Error(`Score submission failed: ${response.statusText}`);
        }

        setScoreSubmitStatus('success');
        if (onScoreSubmitted) {
          onScoreSubmitted(true);
        }
      } catch (error) {
        // Silent error handling - error state shown in UI
        setScoreSubmitStatus('error');
        if (onScoreSubmitted) {
          onScoreSubmitted(false, error instanceof Error ? error.message : 'Unknown error');
        }
      }
    },
    [onScoreSubmitted]
  );

  /**
   * Handle restart (play again)
   */
  const handleRestart = useCallback(() => {
    setPhase('transitioning');
    setScoreSubmitStatus('idle');
    setFinalScore(0);
    setFinalLevel(1);
    setFinalLines(0);
    gameKeyRef.current += 1; // Force remount

    setTimeout(() => {
      setPhase(skipDifficultySelect ? 'countdown' : 'difficulty-select');
      if (skipDifficultySelect) {
        setCountdown(COUNTDOWN_DURATION);
      }
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
  // Enhanced Game Over Callback
  // ============================================================================

  /**
   * Enhanced callback to capture level and lines from TetrisGame
   */
  const enhancedGameOverCallback = useCallback(
    (score: number, sessionId?: string) => {
      // Try to extract level and lines from game (if TetrisGame provides them)
      // For now, we'll use defaults - can be enhanced later
      handleGameOver(score, sessionId);
    },
    [handleGameOver]
  );

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className={cn('tetris-game-wrapper w-full', className)}>
      {/* Difficulty Selection Phase */}
      {phase === 'difficulty-select' && (
        <DifficultySelectScreen onSelect={handleDifficultySelect} onBack={onExit} />
      )}

      {/* Countdown Phase */}
      {phase === 'countdown' && <CountdownScreen count={countdown} />}

      {/* Playing Phase */}
      {phase === 'playing' && (
        <div className="flex flex-col items-center justify-center min-h-[600px] p-8">
          {/* Header */}
          <div className="mb-6 text-center">
            <h2
              className={cn(
                'text-3xl md:text-4xl font-bold mb-2',
                'bg-gradient-to-r from-[#00ffff] via-[#ff00ff] to-[#00ffff]',
                'bg-clip-text text-transparent'
              )}
            >
              TETRIS
            </h2>
            <div className="flex items-center justify-center gap-2 text-sm text-white/60">
              <span className={DIFFICULTY_META[difficulty].icon}>
                {DIFFICULTY_META[difficulty].icon}
              </span>
              <span style={{ color: DIFFICULTY_META[difficulty].color }}>
                {DIFFICULTY_META[difficulty].name}
              </span>
            </div>
          </div>

          {/* Game */}
          <TetrisGame
            key={gameKeyRef.current}
            difficulty={difficulty}
            onGameOver={enhancedGameOverCallback}
            showGhostPiece={true}
            enableHold={true}
            previewCount={5}
          />

          {/* Exit Button */}
          {onExit && (
            <button
              onClick={handleExit}
              className={cn(
                'mt-6 px-6 py-2 rounded-lg',
                'border border-[#2d2d4a]',
                'text-white/70 hover:text-white',
                'hover:border-[#00ffff]/50',
                'transition-all duration-200'
              )}
            >
              Exit Game
            </button>
          )}
        </div>
      )}

      {/* Game Over Phase */}
      {phase === 'game-over' && (
        <GameOverScreen
          score={finalScore}
          level={finalLevel}
          lines={finalLines}
          onRestart={handleRestart}
          onExit={onExit}
          scoreSubmitStatus={scoreSubmitStatus}
        />
      )}

      {/* Transitioning Phase */}
      {phase === 'transitioning' && (
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="text-2xl text-white/50 animate-pulse">Loading...</div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export default TetrisGameWrapper;
