/**
 * GameLoader Component
 *
 * Wrapper component that handles lazy loading of game engines with
 * loading states, error handling, and retry functionality.
 *
 * @module components/game/GameLoader
 */

import { Suspense, lazy, type ComponentType, type ReactNode } from 'react';
import { useGameLoader, type UseGameLoaderOptions } from '@/hooks/useGameLoader';
import type { GameType } from '@/games/types';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

/**
 * Props for the GameLoader component
 */
export interface GameLoaderProps {
  /** The type of game to load */
  gameType: GameType;
  /** Component to render while loading */
  loadingComponent?: ReactNode;
  /** Component to render on error */
  errorComponent?: (props: { error: Error; retry: () => void }) => ReactNode;
  /** Whether to auto-load the game on mount */
  autoLoad?: boolean;
  /** Additional loader options */
  loaderOptions?: Omit<UseGameLoaderOptions, 'autoLoad'>;
  /** Optional class name for the container */
  className?: string;
  /** Children to render when game is loaded */
  children: ReactNode;
}

// ============================================================================
// Default Components
// ============================================================================

/**
 * Default loading state component
 */
export function GameLoadingState({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center min-h-[400px]',
        'bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border)]',
        'p-8',
        className
      )}
      role="progressbar"
      aria-label="Loading game"
      aria-busy="true"
    >
      {/* Animated arcade cabinet icon */}
      <div className="relative mb-6">
        <div
          className={cn(
            'w-16 h-20 rounded-lg',
            'bg-gradient-to-b from-[var(--color-border)] to-[var(--color-bg-elevated)]',
            'border-2 border-[var(--color-border)]',
            'flex flex-col items-center justify-center',
            'animate-pulse'
          )}
        >
          {/* Screen */}
          <div className="w-10 h-8 bg-[var(--color-bg-main)] rounded border border-[var(--color-primary)]/30 mb-1">
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-ping" />
            </div>
          </div>
          {/* Controls */}
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-[var(--color-secondary)]/50 rounded-full" />
            <div className="w-2 h-2 bg-[var(--color-primary)]/50 rounded-full" />
          </div>
        </div>

        {/* Glow effect */}
        <div className="absolute -inset-4 bg-[var(--color-primary)]/10 rounded-xl blur-xl animate-pulse" />
      </div>

      {/* Loading text */}
      <p className="text-lg font-semibold text-[var(--color-text-primary)]/80 mb-2">
        Loading Game Engine
      </p>
      <p className="text-sm text-[var(--color-text-muted)]">Please wait...</p>

      {/* Loading dots animation */}
      <div className="flex gap-2 mt-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn('w-2 h-2 rounded-full bg-[var(--color-primary)]', 'animate-bounce')}
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Default error state component
 */
export function GameErrorState({
  error,
  retry,
  className,
}: {
  error: Error;
  retry: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center min-h-[400px]',
        'bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-error)]/30',
        'p-8',
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      {/* Error icon */}
      <div className="relative mb-6">
        <div
          className={cn(
            'w-16 h-16 rounded-full',
            'bg-[var(--color-error)]/20',
            'flex items-center justify-center',
            'border-2 border-[var(--color-error)]/50'
          )}
        >
          <svg
            className="w-8 h-8 text-[var(--color-error)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
      </div>

      {/* Error message */}
      <h3 className="text-xl font-bold text-[var(--color-error)] mb-2">Failed to Load Game</h3>
      <p className="text-sm text-[var(--color-text-muted)] mb-4 text-center max-w-md">
        {error.message || 'An unexpected error occurred while loading the game.'}
      </p>

      {/* Retry button */}
      <button
        onClick={retry}
        className={cn(
          'px-6 py-3 rounded-lg',
          'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]',
          'text-[var(--color-text-inverse)] font-bold',
          'hover:scale-105 transition-transform duration-200',
          'hover:shadow-[0_0_20px_var(--color-primary-glow)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-surface)]'
        )}
      >
        Try Again
      </button>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * GameLoader Component
 *
 * Handles the complete lifecycle of loading a game engine:
 * - Shows loading state while fetching
 * - Shows error state with retry on failure
 * - Renders children when loaded
 *
 * @example
 * ```tsx
 * <GameLoader gameType="snake" autoLoad>
 *   <SnakeGame />
 * </GameLoader>
 * ```
 */
export function GameLoader({
  gameType,
  loadingComponent,
  errorComponent,
  autoLoad = true,
  loaderOptions = {},
  className,
  children,
}: GameLoaderProps) {
  const { isLoading, isLoaded, isError, error, retry } = useGameLoader(gameType, {
    autoLoad,
    ...loaderOptions,
  });

  // Show loading state
  if (isLoading) {
    return <div className={className}>{loadingComponent ?? <GameLoadingState />}</div>;
  }

  // Show error state
  if (isError && error) {
    return (
      <div className={className}>
        {errorComponent ? (
          errorComponent({ error, retry })
        ) : (
          <GameErrorState error={error} retry={retry} />
        )}
      </div>
    );
  }

  // Show loaded content
  if (isLoaded) {
    return <>{children}</>;
  }

  // Idle state - show nothing (waiting for load to be triggered)
  return null;
}

// ============================================================================
// Lazy Game Wrapper Factory
// ============================================================================

/**
 * Creates a lazy-loaded game component with built-in loading states
 *
 * @param gameType - The type of game
 * @param importFn - Dynamic import function for the game component
 * @returns A wrapped component with lazy loading support
 *
 * @example
 * ```tsx
 * const LazySnakeGame = createLazyGame('snake', () => import('@/games/snake/SnakeGame'));
 *
 * // Usage
 * <LazySnakeGame difficulty="normal" />
 * ```
 */
export function createLazyGame<P extends Record<string, unknown>>(
  gameType: GameType,
  importFn: () => Promise<{ default: ComponentType<P> }>
): React.FC<P> {
  const LazyComponent = lazy(importFn);

  const LazyGameWrapper: React.FC<P> = (props) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const componentProps = props as any;
    return (
      <GameLoader gameType={gameType}>
        <Suspense fallback={<GameLoadingState />}>
          <LazyComponent {...componentProps} />
        </Suspense>
      </GameLoader>
    );
  };

  LazyGameWrapper.displayName = `LazyGame(${gameType})`;

  return LazyGameWrapper;
}

// ============================================================================
// Exports
// ============================================================================

GameLoader.displayName = 'GameLoader';
GameLoadingState.displayName = 'GameLoadingState';
GameErrorState.displayName = 'GameErrorState';

export default GameLoader;
