/**
 * Pong Game Wrapper Component
 *
 * A comprehensive wrapper for the Pong game that provides:
 * - Difficulty selection (Easy, Medium, Hard)
 * - Game state management with animations and transitions
 * - Session tracking integration with scoring API
 * - Arcade cabinet UI integration
 *
 * @module games/pong/PongGameWrapper
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { PongGame } from './PongGame';
import type { PongDifficulty } from './constants';
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
 * Props for the PongGameWrapper component
 */
export interface PongGameWrapperProps {
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
  initialDifficulty?: PongDifficulty;
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
  PongDifficulty,
  { name: string; description: string; color: string; icon: string }
> = {
  easy: {
    name: 'Easy',
    description: 'Larger paddle, slower ball, AI makes mistakes',
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
    description: 'Smaller paddle, faster ball, aggressive AI',
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
  onSelect: (difficulty: PongDifficulty) => void;
  onBack?: () => void;
}) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<PongDifficulty>('normal');
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const handleSelect = useCallback(() => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      onSelect(selectedDifficulty);
    }, PHASE_TRANSITION_DURATION);
  }, [selectedDifficulty, onSelect]);

  const difficulties: PongDifficulty[] = ['easy', 'normal', 'hard'];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center min-h-[500px] p-8',
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
        PONG
      </h2>
      <p className="text-lg text-white/70 mb-8">Select Your Difficulty</p>

      {/* Difficulty Cards */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        {difficulties.map((difficulty) => {
          const meta = DIFFICULTY_META[difficulty];
          const isSelected = selectedDifficulty === difficulty;

          return (
            <button
              key={difficulty}
              onClick={() => setSelectedDifficulty(difficulty)}
              className={cn(
                'relative px-6 py-4 rounded-xl',
                'min-w-[180px]',
                'border-2 transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0F0F1A]',
                isSelected
                  ? 'border-[#00ffff] bg-[#1A1A2E] shadow-[0_0_20px_rgba(0,255,255,0.3)]'
                  : 'border-[#2D2D4A] bg-[#16162a] hover:border-[#3D3D5A]'
              )}
              style={{
                boxShadow: isSelected ? `0 0 20px ${meta.color}40` : undefined,
              }}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                  style={{ backgroundColor: meta.color }}
                >
                  ✓
                </div>
              )}

              {/* Icon */}
              <div className="text-3xl mb-2">{meta.icon}</div>

              {/* Name */}
              <h3
                className="text-xl font-bold mb-1"
                style={{ color: isSelected ? meta.color : '#F8FAFC' }}
              >
                {meta.name}
              </h3>

              {/* Description */}
              <p className="text-xs text-white/60 leading-relaxed">{meta.description}</p>
            </button>
          );
        })}
      </div>

      {/* Start Button */}
      <button
        onClick={handleSelect}
        className={cn(
          'px-8 py-4 rounded-lg',
          'bg-gradient-to-r from-[#00ffff] to-[#ff00ff]',
          'text-black font-bold text-lg',
          'hover:scale-105 transition-all duration-200',
          'hover:shadow-[0_0_30px_rgba(0,255,255,0.6)]',
          'focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:ring-offset-2 focus:ring-offset-[#0F0F1A]'
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
            'bg-transparent border border-[#2D2D4A]',
            'text-white/60 hover:text-white',
            'hover:border-[#3D3D5A]',
            'transition-all duration-200'
          )}
        >
          Back to Games
        </button>
      )}

      {/* Game Info */}
      <div className="mt-8 text-center text-sm text-white/40">
        <p>First to 11 points wins!</p>
        <p className="mt-1">Use Arrow Keys or W/S to move your paddle</p>
      </div>
    </div>
  );
}

/**
 * Countdown Overlay
 */
function CountdownOverlay({ count, difficulty }: { count: number; difficulty: PongDifficulty }) {
  const meta = DIFFICULTY_META[difficulty];

  return (
    <div
      className={cn(
        'absolute inset-0 z-20',
        'flex flex-col items-center justify-center',
        'bg-[#0F0F1A]/90 backdrop-blur-sm',
        'animate-fade-in'
      )}
    >
      {/* Difficulty indicator */}
      <div className="mb-4 px-4 py-1 rounded-full" style={{ backgroundColor: `${meta.color}20` }}>
        <span className="text-sm" style={{ color: meta.color }}>
          {meta.icon} {meta.name} Mode
        </span>
      </div>

      {/* Countdown number */}
      <div
        className={cn('text-8xl md:text-9xl font-bold', 'animate-bounce')}
        style={{
          color: count > 0 ? meta.color : '#00ffff',
          textShadow: `0 0 40px ${count > 0 ? meta.color : '#00ffff'}80`,
        }}
      >
        {count > 0 ? count : 'GO!'}
      </div>

      {/* Ready text */}
      <p className="mt-4 text-xl text-white/70 animate-pulse">Get Ready!</p>
    </div>
  );
}

/**
 * Game Over Overlay with enhanced animations
 */
function GameOverOverlay({
  score,
  isWinner,
  difficulty,
  onRestart,
  onChangeDifficulty,
  onExit,
  isSubmittingScore,
  scoreSubmitted,
  scoreError,
}: {
  score: number;
  isWinner: boolean;
  difficulty: PongDifficulty;
  onRestart: () => void;
  onChangeDifficulty: () => void;
  onExit?: () => void;
  isSubmittingScore?: boolean;
  scoreSubmitted?: boolean;
  scoreError?: string;
}) {
  const meta = DIFFICULTY_META[difficulty];

  return (
    <div
      className={cn(
        'absolute inset-0 z-20',
        'flex flex-col items-center justify-center',
        'bg-[#0F0F1A]/95 backdrop-blur-md',
        'animate-fade-in'
      )}
    >
      {/* Result */}
      <div
        className={cn(
          'text-5xl md:text-6xl font-bold mb-4',
          isWinner ? 'text-[#00ff00]' : 'text-[#ff4444]'
        )}
        style={{
          textShadow: `0 0 30px ${isWinner ? '#00ff00' : '#ff4444'}60`,
        }}
      >
        {isWinner ? 'YOU WIN!' : 'GAME OVER'}
      </div>

      {/* Score */}
      <div className="mb-2 text-lg text-white/70">Final Score</div>
      <div
        className="text-4xl font-mono font-bold mb-6"
        style={{ color: '#00ffff', textShadow: '0 0 20px #00ffff60' }}
      >
        {score}
      </div>

      {/* Difficulty played */}
      <div className="mb-6 px-4 py-1 rounded-full" style={{ backgroundColor: `${meta.color}20` }}>
        <span className="text-sm" style={{ color: meta.color }}>
          {meta.icon} {meta.name} Mode
        </span>
      </div>

      {/* Score submission status */}
      {isSubmittingScore && (
        <div className="mb-4 flex items-center gap-2 text-[#00ffff]">
          <div className="w-4 h-4 border-2 border-[#00ffff] border-t-transparent rounded-full animate-spin" />
          <span>Submitting score...</span>
        </div>
      )}
      {scoreSubmitted && (
        <div className="mb-4 flex items-center gap-2 text-[#00ff00]">
          <span>✓</span>
          <span>Score submitted!</span>
        </div>
      )}
      {scoreError && (
        <div className="mb-4 flex items-center gap-2 text-[#ff4444]">
          <span>✗</span>
          <span>{scoreError}</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onRestart}
          disabled={isSubmittingScore}
          className={cn(
            'px-6 py-3 rounded-lg',
            'bg-gradient-to-r from-[#00ffff] to-[#ff00ff]',
            'text-black font-bold',
            'hover:scale-105 transition-all duration-200',
            'hover:shadow-[0_0_20px_rgba(0,255,255,0.5)]',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
          )}
        >
          Play Again
        </button>

        <button
          onClick={onChangeDifficulty}
          disabled={isSubmittingScore}
          className={cn(
            'px-6 py-3 rounded-lg',
            'bg-[#1A1A2E] border border-[#2D2D4A]',
            'text-white font-semibold',
            'hover:border-[#00ffff] hover:text-[#00ffff]',
            'transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          Change Difficulty
        </button>
      </div>

      {/* Exit button */}
      {onExit && (
        <button
          onClick={onExit}
          className={cn(
            'mt-4 px-4 py-2 rounded-lg',
            'text-white/50 hover:text-white',
            'transition-colors duration-200'
          )}
        >
          Exit to Menu
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * PongGameWrapper Component
 *
 * Provides a complete Pong gaming experience with difficulty selection,
 * countdown animations, game state management, and score submission.
 */
export function PongGameWrapper({
  sessionId: _sessionId,
  transactionHash,
  onGameOver,
  onScoreSubmitted,
  onExit,
  enableScoreSubmission = false,
  skipDifficultySelect = false,
  initialDifficulty = 'normal',
  className = '',
}: PongGameWrapperProps) {
  // Game state
  const [phase, setPhase] = useState<GamePhase>(
    skipDifficultySelect ? 'countdown' : 'difficulty-select'
  );
  const [difficulty, setDifficulty] = useState<PongDifficulty>(initialDifficulty);
  const [countdown, setCountdown] = useState(COUNTDOWN_DURATION);
  const [gameKey, setGameKey] = useState(0); // Used to force remount PongGame
  const [finalScore, setFinalScore] = useState(0);
  const [isWinner, setIsWinner] = useState(false);

  // Score submission state (passed from PongGame)
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [scoreError, setScoreError] = useState<string | undefined>();

  // Refs
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle difficulty selection
  const handleDifficultySelect = useCallback((selected: PongDifficulty) => {
    setDifficulty(selected);
    setPhase('countdown');
    setCountdown(COUNTDOWN_DURATION);
  }, []);

  // Countdown effect
  useEffect(() => {
    if (phase !== 'countdown') return;

    if (countdown > 0) {
      countdownTimerRef.current = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      // Show "GO!" for a moment then start playing
      countdownTimerRef.current = setTimeout(() => {
        setPhase('playing');
      }, 500);
    }

    return () => {
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
      }
    };
  }, [phase, countdown]);

  // Handle game over from PongGame
  const handleGameOver = useCallback(
    (score: number, gameSessionId?: string) => {
      setFinalScore(score);
      // Determine if player won based on Pong win condition (first to 11)
      // Since PongGame uses leftScore for player, we check if score is the winning score
      setIsWinner(score >= 11);
      setPhase('game-over');

      // Call external handler
      if (onGameOver) {
        onGameOver(score, gameSessionId);
      }
    },
    [onGameOver]
  );

  // Handle score submission callback
  const handleScoreSubmitted = useCallback(
    (success: boolean, error?: string) => {
      setIsSubmittingScore(false);
      setScoreSubmitted(success);
      setScoreError(error);

      if (onScoreSubmitted) {
        onScoreSubmitted(success, error);
      }
    },
    [onScoreSubmitted]
  );

  // Handle restart (same difficulty)
  const handleRestart = useCallback(() => {
    setPhase('countdown');
    setCountdown(COUNTDOWN_DURATION);
    setGameKey((prev) => prev + 1); // Force remount
    setScoreSubmitted(false);
    setScoreError(undefined);
  }, []);

  // Handle change difficulty
  const handleChangeDifficulty = useCallback(() => {
    setPhase('difficulty-select');
    setScoreSubmitted(false);
    setScoreError(undefined);
  }, []);

  // Handle back/exit
  const handleBack = useCallback(() => {
    if (onExit) {
      onExit();
    }
  }, [onExit]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div
      className={cn(
        'relative w-full max-w-4xl mx-auto',
        'bg-[#0F0F1A] rounded-xl',
        'border border-[#2D2D4A]',
        'overflow-hidden',
        className
      )}
    >
      {/* Difficulty Selection Phase */}
      {phase === 'difficulty-select' && (
        <DifficultySelectScreen
          onSelect={handleDifficultySelect}
          onBack={onExit ? handleBack : undefined}
        />
      )}

      {/* Countdown and Playing Phases */}
      {(phase === 'countdown' || phase === 'playing' || phase === 'game-over') && (
        <div className="relative">
          {/* Game Container with fade-in animation */}
          <div
            className={cn(
              'transition-opacity duration-500',
              phase === 'countdown' ? 'opacity-50' : 'opacity-100'
            )}
          >
            <PongGame
              key={gameKey}
              difficulty={difficulty}
              mode="single-player"
              onGameOver={handleGameOver}
              transactionHash={transactionHash}
              enableScoreSubmission={enableScoreSubmission}
              onScoreSubmitted={handleScoreSubmitted}
              showBallTrail={true}
              showRallyCount={true}
            />
          </div>

          {/* Countdown Overlay */}
          {phase === 'countdown' && <CountdownOverlay count={countdown} difficulty={difficulty} />}

          {/* Game Over Overlay */}
          {phase === 'game-over' && (
            <GameOverOverlay
              score={finalScore}
              isWinner={isWinner}
              difficulty={difficulty}
              onRestart={handleRestart}
              onChangeDifficulty={handleChangeDifficulty}
              onExit={onExit ? handleBack : undefined}
              isSubmittingScore={isSubmittingScore}
              scoreSubmitted={scoreSubmitted}
              scoreError={scoreError}
            />
          )}
        </div>
      )}

      {/* Custom Animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export default PongGameWrapper;
