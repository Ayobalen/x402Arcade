/**
 * Snake Game Adapter
 *
 * Adapter component that makes the existing SnakeGame work with GameWrapper.
 * This bridges the gap between SnakeGame's current props and the
 * InjectedGameProps from GameWrapper.
 *
 * @module games/snake/SnakeGameAdapter
 */

import { useCallback } from 'react';
import { SnakeGame } from './SnakeGame';
import type { InjectedGameProps } from '../components/GameWrapper';
import type { SnakeDifficulty } from './constants';

// ============================================================================
// Component Props
// ============================================================================

/**
 * Custom props for SnakeGameAdapter (beyond injected props)
 */
export interface SnakeGameAdapterProps {
  /** Difficulty level (defaults to 'normal') */
  difficulty?: SnakeDifficulty;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Adapter component that connects SnakeGame with GameWrapper.
 *
 * Responsibilities:
 * - Receives sessionId and onGameOver from GameWrapper
 * - Passes them to SnakeGame in the format it expects
 * - Enables automatic score submission
 * - Bridges the two component APIs seamlessly
 *
 * @param props - Adapter props including injected GameWrapper props
 *
 * @example
 * ```tsx
 * // Used internally by GameWrapper
 * <GameWrapper
 *   metadata={snakeMetadata}
 *   gameComponent={SnakeGameAdapter}
 *   gameProps={{ difficulty: 'normal' }}
 * />
 * ```
 */
export function SnakeGameAdapter({
  onGameOver,
  difficulty = 'normal',
}: SnakeGameAdapterProps & InjectedGameProps) {
  // ========================================
  // Callback Adapters
  // ========================================

  /**
   * Adapt GameWrapper's onGameOver (score) => Promise<void>
   * to SnakeGame's onGameOver (score, sessionId?) => void
   */
  const handleGameOver = useCallback(
    (score: number, _sessionId?: string) => {
      // Call GameWrapper's onGameOver with just the score
      // GameWrapper will handle the score submission
      onGameOver(score);
    },
    [onGameOver]
  );

  /**
   * Score submission callback - GameWrapper handles this automatically
   * so we just log the result for debugging
   */

  const handleScoreSubmitted = useCallback((_success: boolean, _error?: string) => {
    // GameWrapper handles score submission automatically
    // This callback is kept for future debugging needs
  }, []);

  // ========================================
  // Render
  // ========================================

  // Pass through to SnakeGame with adapted props
  return (
    <SnakeGame
      difficulty={difficulty}
      onGameOver={handleGameOver}
      enableScoreSubmission={true}
      onScoreSubmitted={handleScoreSubmitted}
    />
  );
}

SnakeGameAdapter.displayName = 'SnakeGameAdapter';

export default SnakeGameAdapter;
