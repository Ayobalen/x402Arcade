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

import { type ReactElement, useEffect, useCallback, useRef } from 'react';
import { useGameSession } from '../hooks/useGameSession';
import { PaymentGate } from './PaymentGate';
import { useMusic } from '@/hooks/useMusic';
import { AudioControls } from '@/components/audio/AudioControls';
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
// Music track paths - these are loaded from public/sounds/music/
const MUSIC_TRACKS: Record<string, string> = {
  menu: '/sounds/music/arcade-theme.mp3',
  snake: '/sounds/music/snake-gameplay.mp3',
  tetris: '/sounds/music/tetris-gameplay.mp3',
  pong: '/sounds/music/arcade-theme.mp3', // Use arcade theme for now
  breakout: '/sounds/music/arcade-theme.mp3', // Use arcade theme for now
  'space-invaders': '/sounds/music/arcade-theme.mp3', // Use arcade theme for now
  gameOver: '/sounds/music/game-over.mp3',
};

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

  const music = useMusic();
  const musicInitializedRef = useRef(false);
  const isPlayingRef = useRef(false);

  // Initialize music tracks on mount
  useEffect(() => {
    if (musicInitializedRef.current) return;
    musicInitializedRef.current = true;

    // Add menu/lobby track
    music.addTrack({
      id: 'menu',
      src: MUSIC_TRACKS.menu,
      name: 'Arcade Theme',
      loop: true,
      volume: 0.5,
    });

    // Add game-specific track
    const gameTrackId = metadata.id;
    const gameTrackPath = MUSIC_TRACKS[gameTrackId] || MUSIC_TRACKS.menu;
    music.addTrack({
      id: gameTrackId,
      src: gameTrackPath,
      name: `${metadata.displayName} Theme`,
      loop: true,
      volume: 0.4,
    });

    // Add game over track
    music.addTrack({
      id: 'gameOver',
      src: MUSIC_TRACKS.gameOver,
      name: 'Game Over',
      loop: false,
      volume: 0.5,
    });
  }, [metadata.id, metadata.displayName, music]);

  // Start game music when session is active
  useEffect(() => {
    if (session.sessionId && !isPlayingRef.current) {
      // Start playing game music
      const gameTrackId = metadata.id;
      music.play(gameTrackId, { fadeIn: { duration: 1000 } });
      isPlayingRef.current = true;
    }
  }, [session.sessionId, metadata.id, music]);

  // Cleanup music on unmount
  useEffect(() => {
    return () => {
      if (isPlayingRef.current) {
        const gameTrackId = metadata.id;
        music.stop(gameTrackId, { fadeOut: { duration: 500 } });
        isPlayingRef.current = false;
      }
    };
  }, [metadata.id, music]);

  // Enhanced game over handler with music
  const handleGameOverWithMusic = useCallback(
    async (score: number) => {
      // Stop game music
      const gameTrackId = metadata.id;
      music.stop(gameTrackId, { fadeOut: { duration: 500 } });
      isPlayingRef.current = false;

      // Play game over jingle (if track exists)
      try {
        music.play('gameOver');
      } catch {
        // Game over track might not be loaded - graceful fallback
      }

      // Submit score
      await session.submitScore(score);
    },
    [metadata.id, music, session]
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

      <div className="max-w-4xl mx-auto">
        <GameComponent
          {...(gameProps as T)}
          sessionId={session.sessionId}
          onGameOver={handleGameOverWithMusic}
        />
      </div>
    </div>
  );
}

GameWrapper.displayName = 'GameWrapper';

export default GameWrapper;
