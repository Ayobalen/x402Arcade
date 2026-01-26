/**
 * Game Wrapper Component
 *
 * Main wrapper component that provides:
 * - Payment flow via useGameSession hook
 * - PaymentGate UI when not paid
 * - GameLayout wrapper when paid
 * - Automatic score submission on game over
 * - Background music management
 *
 * This component wraps game-specific components and provides all
 * the common functionality (payment, session, scoring) automatically.
 *
 * @module games/components/GameWrapper
 */

import { type ReactElement, useCallback } from 'react';
import { useGameSession } from '../hooks/useGameSession';
import { PaymentGate } from './PaymentGate';
import { AudioControls } from '@/components/audio/AudioControls';
import { LeaderboardWidget } from '@/components/leaderboard/LeaderboardWidget';
import type { GameMetadata } from '../types/GameMetadata';

// ============================================================================
// Component Props
// ============================================================================

/**
 * Props that will be injected into the wrapped game component
 */
export interface InjectedGameProps {
  /** Session ID for the current game */
  sessionId: string;
  /** Callback to submit final score */
  onGameOver: (score: number) => Promise<void>;
}

/**
 * Game component that receives injected props
 */
export type GameComponent<T = object> = (props: T & InjectedGameProps) => ReactElement | null;

/**
 * GameWrapper props
 */
export interface GameWrapperProps<T = object> {
  /** Game metadata */
  metadata: GameMetadata;
  /** Game component to render (will receive sessionId and onGameOver props) */
  gameComponent: GameComponent<T>;
  /** Additional props to pass to the game component */
  gameProps?: T;
  /** Optional back link URL for payment gate (defaults to /play) */
  backLink?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * GameWrapper - wraps any game with payment flow and session management.
 *
 * Usage:
 * 1. Define your game component that accepts InjectedGameProps
 * 2. Create game metadata
 * 3. Wrap with GameWrapper
 *
 * The wrapper handles:
 * - Payment flow via x402
 * - Session creation and restoration
 * - Prize pool fetching
 * - Score submission
 * - Payment gate UI
 * - Game layout
 *
 * @param props - Component props
 *
 * @example
 * ```tsx
 * // 1. Define game component
 * interface MyGameProps {
 *   difficulty: GameDifficulty;
 * }
 *
 * function MyGame({ sessionId, onGameOver, difficulty }: MyGameProps & InjectedGameProps) {
 *   // Game implementation
 *   return <div>My Game</div>;
 * }
 *
 * // 2. Create metadata
 * const myGameMetadata: GameMetadata = {
 *   id: 'my-game',
 *   name: 'My Game',
 *   displayName: 'My Awesome Game',
 *   // ... other metadata
 * };
 *
 * // 3. Use GameWrapper
 * export function MyGamePage() {
 *   return (
 *     <GameWrapper
 *       metadata={myGameMetadata}
 *       gameComponent={MyGame}
 *       gameProps={{ difficulty: 'normal' }}
 *     />
 *   );
 * }
 * ```
 */
export function GameWrapper<T = object>({
  metadata,
  gameComponent: GameComponent,
  gameProps,
  backLink,
}: GameWrapperProps<T>) {
  // ========================================
  // Session Management
  // ========================================

  const session = useGameSession(metadata);

  // ========================================
  // Music Management
  // ========================================

  // DISABLED: Music system disabled - games can use Phaser audio instead
  // const music = useMusic();
  // const musicInitializedRef = useRef(false);
  // const isPlayingRef = useRef(false);

  // Game over handler
  const handleGameOver = useCallback(
    async (score: number) => {
      // Submit score
      await session.submitScore(score);
    },
    [session]
  );

  // ========================================
  // Payment Gate
  // ========================================

  // If no session yet, show payment gate
  if (!session.sessionId) {
    return (
      <PaymentGate
        metadata={metadata}
        dailyPrizePool={session.prizePool.daily}
        onPayment={session.handlePayment}
        isProcessing={session.isProcessing}
        paymentStatus={session.paymentStatus}
        walletReady={session.walletReady}
        errorMessage={session.errorMessage}
        backLink={backLink}
      />
    );
  }

  // ========================================
  // Game Rendering
  // ========================================

  // Payment successful - render the game with injected props
  // Game receives sessionId and onGameOver callback automatically
  return (
    <div className="w-full min-h-screen flex items-center justify-center px-4 py-12">
      {/* Audio Controls - Fixed position top-right */}
      <div className="fixed top-4 right-4 z-50">
        <AudioControls compact />
      </div>

      <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 items-start justify-center">
        {/* Game Component */}
        <div className="flex-1 max-w-4xl w-full">
          <GameComponent
            {...(gameProps as T)}
            sessionId={session.sessionId}
            onGameOver={handleGameOver}
          />
        </div>

        {/* Leaderboard Widget - Desktop only */}
        <div className="hidden lg:block w-80 shrink-0 sticky top-6">
          <LeaderboardWidget gameType={metadata.id} periodType="daily" />
        </div>
      </div>
    </div>
  );
}

GameWrapper.displayName = 'GameWrapper';

export default GameWrapper;
