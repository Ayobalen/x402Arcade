/**
 * GameLoader Type Definitions
 *
 * @module components/game/GameLoader/types
 */

import type { ReactNode } from 'react';
import type { GameType } from '@/games/types';
import type { UseGameLoaderOptions } from '@/hooks/useGameLoader';

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

/**
 * Props for GameLoadingState component
 */
export interface GameLoadingStateProps {
  /** Optional class name for styling */
  className?: string;
}

/**
 * Props for GameErrorState component
 */
export interface GameErrorStateProps {
  /** The error that occurred */
  error: Error;
  /** Callback to retry loading */
  retry: () => void;
  /** Optional class name for styling */
  className?: string;
}
