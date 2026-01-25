/**
 * useGameAnnouncements Hook
 *
 * Custom hook for game event announcements to screen readers.
 * Provides a comprehensive API for announcing various game events
 * in an accessible manner.
 *
 * @example
 * ```tsx
 * function GameComponent() {
 *   const { announceGameStart, announceScore, announceGameOver } = useGameAnnouncements();
 *
 *   useEffect(() => {
 *     announceGameStart('Snake', 3);
 *   }, []);
 *
 *   useEffect(() => {
 *     announceScore(score);
 *   }, [score]);
 * }
 * ```
 */

import { useCallback } from 'react';
import { useLiveAnnouncer } from './useLiveAnnouncer';

/**
 * Game event types for announcements
 */
export type GameEvent =
  | 'start'
  | 'countdown'
  | 'pause'
  | 'resume'
  | 'score'
  | 'level'
  | 'powerup'
  | 'achievement'
  | 'warning'
  | 'gameover'
  | 'highscore';

/**
 * Options for game announcements
 */
export interface GameAnnouncementOptions {
  /**
   * Whether this is an urgent announcement (uses assertive politeness)
   * @default false
   */
  urgent?: boolean;

  /**
   * Additional context for the announcement
   */
  context?: string;

  /**
   * Auto-clear the announcement after delay (ms)
   */
  clearAfter?: number;
}

/**
 * Return value from useGameAnnouncements hook
 */
export interface UseGameAnnouncementsReturn {
  /**
   * Announce game start with countdown
   * @param gameName - Name of the game
   * @param countdown - Countdown duration in seconds (optional)
   */
  announceGameStart: (gameName: string, countdown?: number) => void;

  /**
   * Announce countdown tick
   * @param count - Current countdown number
   */
  announceCountdown: (count: number) => void;

  /**
   * Announce game pause
   */
  announceGamePause: () => void;

  /**
   * Announce game resume
   */
  announceGameResume: () => void;

  /**
   * Announce score change
   * @param score - Current score
   * @param delta - Score change (optional)
   */
  announceScore: (score: number, delta?: number) => void;

  /**
   * Announce level completion
   * @param level - Completed level number
   * @param newLevel - New level number
   */
  announceLevelUp: (level: number, newLevel: number) => void;

  /**
   * Announce power-up collection
   * @param powerUpName - Name of the power-up
   * @param description - Optional description
   */
  announcePowerUp: (powerUpName: string, description?: string) => void;

  /**
   * Announce achievement unlock
   * @param achievementName - Name of the achievement
   * @param description - Optional description
   */
  announceAchievement: (achievementName: string, description?: string) => void;

  /**
   * Announce time warning
   * @param secondsRemaining - Seconds remaining
   */
  announceTimeWarning: (secondsRemaining: number) => void;

  /**
   * Announce game over with final score
   * @param score - Final score
   * @param rank - Player rank (optional)
   */
  announceGameOver: (score: number, rank?: number) => void;

  /**
   * Announce high score achievement
   * @param score - New high score
   * @param previousHighScore - Previous high score (optional)
   */
  announceHighScore: (score: number, previousHighScore?: number) => void;

  /**
   * Announce custom game event
   * @param message - Custom message
   * @param options - Announcement options
   */
  announceCustom: (message: string, options?: GameAnnouncementOptions) => void;

  /**
   * Get the LiveRegion component to render
   */
  LiveRegionComponent: React.ComponentType;
}

/**
 * Custom hook for game event announcements
 *
 * @returns Game announcement API and LiveRegion component
 *
 * @example
 * ```tsx
 * function SnakeGame() {
 *   const {
 *     announceGameStart,
 *     announceScore,
 *     announceGameOver,
 *     LiveRegionComponent
 *   } = useGameAnnouncements();
 *
 *   // Render the LiveRegion component in your UI
 *   return (
 *     <div>
 *       <LiveRegionComponent />
 *       {/* Game content *\/}
 *     </div>
 *   );
 * }
 * ```
 */
export function useGameAnnouncements(): UseGameAnnouncementsReturn {
  const { announce, LiveRegionComponent } = useLiveAnnouncer();

  /**
   * Announce game start with countdown
   */
  const announceGameStart = useCallback(
    (gameName: string, countdown?: number) => {
      const countdownText = countdown ? ` Starting in ${countdown} seconds` : '';
      announce(`${gameName} game starting${countdownText}`, {
        politeness: 'assertive',
        clearAfter: countdown ? countdown * 1000 : 3000,
      });
    },
    [announce]
  );

  /**
   * Announce countdown tick
   */
  const announceCountdown = useCallback(
    (count: number) => {
      announce(count.toString(), {
        politeness: 'assertive',
        clearAfter: 1000,
        allowDuplicate: true,
      });
    },
    [announce]
  );

  /**
   * Announce game pause
   */
  const announceGamePause = useCallback(() => {
    announce('Game paused', {
      politeness: 'assertive',
      clearAfter: 3000,
    });
  }, [announce]);

  /**
   * Announce game resume
   */
  const announceGameResume = useCallback(() => {
    announce('Game resumed', {
      politeness: 'assertive',
      clearAfter: 3000,
    });
  }, [announce]);

  /**
   * Announce score change
   */
  const announceScore = useCallback(
    (score: number, delta?: number) => {
      const deltaText = delta ? ` Plus ${delta} points` : '';
      announce(`Score: ${score}${deltaText}`, {
        politeness: 'polite',
      });
    },
    [announce]
  );

  /**
   * Announce level completion
   */
  const announceLevelUp = useCallback(
    (level: number, newLevel: number) => {
      announce(`Level ${level} complete! Now entering level ${newLevel}`, {
        politeness: 'assertive',
        clearAfter: 4000,
      });
    },
    [announce]
  );

  /**
   * Announce power-up collection
   */
  const announcePowerUp = useCallback(
    (powerUpName: string, description?: string) => {
      const descText = description ? `. ${description}` : '';
      announce(`Power-up collected: ${powerUpName}${descText}`, {
        politeness: 'assertive',
        clearAfter: 3000,
      });
    },
    [announce]
  );

  /**
   * Announce achievement unlock
   */
  const announceAchievement = useCallback(
    (achievementName: string, description?: string) => {
      const descText = description ? `. ${description}` : '';
      announce(`Achievement unlocked: ${achievementName}${descText}`, {
        politeness: 'assertive',
        clearAfter: 5000,
      });
    },
    [announce]
  );

  /**
   * Announce time warning
   */
  const announceTimeWarning = useCallback(
    (secondsRemaining: number) => {
      const timeText =
        secondsRemaining === 1 ? '1 second remaining' : `${secondsRemaining} seconds remaining`;
      announce(`Warning! ${timeText}`, {
        politeness: 'assertive',
        clearAfter: 2000,
      });
    },
    [announce]
  );

  /**
   * Announce game over with final score
   */
  const announceGameOver = useCallback(
    (score: number, rank?: number) => {
      const rankText = rank ? ` You ranked number ${rank}` : '';
      announce(`Game Over! Final score: ${score}${rankText}`, {
        politeness: 'assertive',
      });
    },
    [announce]
  );

  /**
   * Announce high score achievement
   */
  const announceHighScore = useCallback(
    (score: number, previousHighScore?: number) => {
      const prevText = previousHighScore ? ` Previous high score was ${previousHighScore}` : '';
      announce(`New high score: ${score}!${prevText}`, {
        politeness: 'assertive',
        clearAfter: 5000,
      });
    },
    [announce]
  );

  /**
   * Announce custom game event
   */
  const announceCustom = useCallback(
    (message: string, options: GameAnnouncementOptions = {}) => {
      const { urgent = false, clearAfter, context } = options;
      const contextText = context ? ` ${context}` : '';
      announce(`${message}${contextText}`, {
        politeness: urgent ? 'assertive' : 'polite',
        clearAfter,
      });
    },
    [announce]
  );

  return {
    announceGameStart,
    announceCountdown,
    announceGamePause,
    announceGameResume,
    announceScore,
    announceLevelUp,
    announcePowerUp,
    announceAchievement,
    announceTimeWarning,
    announceGameOver,
    announceHighScore,
    announceCustom,
    LiveRegionComponent,
  };
}
