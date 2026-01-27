/**
 * Live Leaderboard Widget Component
 *
 * Displays real-time leaderboard rankings during gameplay with automatic polling.
 * Creates competitive psychology by showing live ranking changes.
 *
 * @module components/game/LiveLeaderboardWidget
 */

import { useState, useEffect, useCallback } from 'react';
import { cn } from '../../utils/cn';

// ============================================================================
// Types
// ============================================================================

export interface LeaderboardEntry {
  rank: number;
  playerAddress: string;
  score: number;
  gameType: string;
  periodType: string;
  periodDate: string;
}

export interface LiveLeaderboardWidgetProps {
  /** Game type to fetch rankings for */
  gameType: 'snake' | 'tetris';
  /** Period type (daily, weekly, all-time) */
  periodType?: 'daily' | 'weekly' | 'all-time';
  /** Current player's wallet address */
  playerAddress?: string;
  /** Polling interval in milliseconds (default: 15000 = 15 seconds) */
  pollInterval?: number;
  /** Number of entries to display (default: 10) */
  limit?: number;
  /** Optional CSS class name */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Live Leaderboard Widget
 *
 * Shows real-time leaderboard rankings with automatic polling.
 * Highlights current player and shows their rank position.
 *
 * @example
 * ```tsx
 * <LiveLeaderboardWidget
 *   gameType="snake"
 *   periodType="daily"
 *   playerAddress="0x1234..."
 *   pollInterval={15000}
 *   limit={10}
 * />
 * ```
 */
export function LiveLeaderboardWidget({
  gameType,
  periodType = 'daily',
  playerAddress,
  pollInterval = 15000,
  limit = 10,
  className = '',
}: LiveLeaderboardWidgetProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [playerHighScore, setPlayerHighScore] = useState<number | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRateLimited, setIsRateLimited] = useState(false);

  // API URL from environment
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  /**
   * Fetch leaderboard data from API
   */
  const fetchLeaderboard = useCallback(async () => {
    try {
      console.log('[LiveLeaderboardWidget] Fetching leaderboard...');
      // Add timestamp to bust cache and ensure fresh data
      const url = `${API_URL}/api/v1/leaderboard/${gameType}/${periodType}?limit=${limit}&t=${Date.now()}`;
      const response = await fetch(url, {
        cache: 'no-store', // Disable browser caching for live updates
      });

      if (!response.ok) {
        // Check for rate limiting
        if (response.status === 429) {
          setIsRateLimited(true);
          setRetryCount((prev) => prev + 1);
          throw new Error('Too Many Requests');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[LiveLeaderboardWidget] Received data:', data);

      if (data.entries && Array.isArray(data.entries)) {
        setEntries(data.entries);
        setError(null);
        setIsRateLimited(false);
        setRetryCount(0); // Reset retry count on success
        setLastUpdate(new Date());

        // Extract player's high score if they're in the leaderboard
        if (playerAddress) {
          const playerEntry = data.entries.find(
            (entry: LeaderboardEntry) =>
              entry.playerAddress.toLowerCase() === playerAddress.toLowerCase()
          );
          if (playerEntry) {
            setPlayerHighScore(playerEntry.score);
          }
        }
      } else {
        console.warn('[LiveLeaderboardWidget] No entries in response');
        setEntries([]);
      }
    } catch (err) {
      console.error('[LiveLeaderboardWidget] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  }, [API_URL, gameType, periodType, limit, playerAddress]);

  /**
   * Initial fetch on mount
   */
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  /**
   * Set up polling interval with exponential backoff for rate limiting
   */
  useEffect(() => {
    // Calculate backoff delay: 15s, 30s, 60s, 120s, max 2 minutes
    const backoffMultiplier = Math.min(Math.pow(2, retryCount), 8);
    const currentPollInterval = isRateLimited ? pollInterval * backoffMultiplier : pollInterval;

    console.log(
      `[LiveLeaderboardWidget] Setting poll interval: ${currentPollInterval}ms (${isRateLimited ? 'rate limited' : 'normal'})`
    );

    const intervalId = setInterval(() => {
      fetchLeaderboard();
    }, currentPollInterval);

    return () => clearInterval(intervalId);
  }, [fetchLeaderboard, pollInterval, isRateLimited, retryCount]);

  /**
   * Find current player's rank
   */
  const playerRank = playerAddress
    ? entries.find((entry) => entry.playerAddress.toLowerCase() === playerAddress.toLowerCase())?.rank
    : null;

  /**
   * Format address for display
   */
  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  /**
   * Format timestamp for last update
   */
  const formatLastUpdate = (): string => {
    if (!lastUpdate) return '';
    const seconds = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  return (
    <div
      className={cn(
        'bg-theme-bg-surface',
        'border-2 border-theme-primary/30',
        'rounded-xl',
        'p-4',
        'shadow-theme-glow-md',
        'min-w-[280px]',
        'max-w-[320px]',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-theme-primary font-bold text-lg uppercase tracking-wide">Live Rankings</h3>
        {lastUpdate && !isLoading && (
          <span className="text-xs text-gray-400">{formatLastUpdate()}</span>
        )}
      </div>

      {/* Player High Score Display */}
      {playerHighScore !== null && (
        <div
          className={cn(
            'mb-4',
            'px-4 py-3',
            'bg-theme-primary/10',
            'border border-theme-primary/30',
            'rounded-lg'
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400 mb-1">Your High Score</div>
              <div className="text-3xl font-bold text-theme-primary">{playerHighScore.toLocaleString()}</div>
            </div>
            {playerRank !== null && (
              <div className="text-right">
                <div className="text-xs text-gray-400 mb-1">Rank</div>
                <div className="text-2xl font-bold text-theme-primary">#{playerRank}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && entries.length === 0 && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary"></div>
          <p className="text-gray-400 mt-2 text-sm">Loading rankings...</p>
        </div>
      )}

      {/* Error State - Full (no entries) */}
      {error && !isLoading && entries.length === 0 && (
        <div className="text-center py-8">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={fetchLeaderboard}
            className="mt-3 px-4 py-2 bg-theme-primary/20 text-theme-primary rounded-lg text-sm hover:bg-theme-primary/30 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Error Banner - Small (with cached entries) */}
      {error && entries.length > 0 && (
        <div className="mb-3 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center justify-between gap-2">
            <p className="text-red-400 text-xs flex-1">{error}</p>
            <button
              onClick={fetchLeaderboard}
              className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors flex-shrink-0"
            >
              Retry
            </button>
          </div>
          {isRateLimited && (
            <p className="text-red-400/70 text-[10px] mt-1">
              Retrying automatically in {Math.floor((pollInterval * Math.min(Math.pow(2, retryCount), 8)) / 1000)}s...
            </p>
          )}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && entries.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">No rankings yet</p>
          <p className="text-gray-500 text-xs mt-2">Be the first to play!</p>
        </div>
      )}

      {/* Leaderboard Entries */}
      {entries.length > 0 && (
        <div className="space-y-2">
          {entries.map((entry, index) => {
            const isCurrentPlayer =
              playerAddress && entry.playerAddress.toLowerCase() === playerAddress.toLowerCase();

            return (
              <div
                key={`${entry.rank}-${entry.playerAddress}`}
                className={cn(
                  'flex items-center gap-3',
                  'px-3 py-2',
                  'rounded-lg',
                  'transition-all duration-200',
                  isCurrentPlayer
                    ? 'bg-theme-primary/20 border border-theme-primary/50 shadow-theme-glow'
                    : 'bg-theme-bg-main/50 border border-gray-700/30 hover:bg-theme-bg-main/80'
                )}
              >
                {/* Rank Badge */}
                <div
                  className={cn(
                    'flex-shrink-0',
                    'w-8 h-8',
                    'flex items-center justify-center',
                    'rounded-full',
                    'font-bold text-sm',
                    index === 0 && 'bg-yellow-500/20 text-yellow-400',
                    index === 1 && 'bg-gray-400/20 text-gray-300',
                    index === 2 && 'bg-orange-500/20 text-orange-400',
                    index > 2 && 'bg-gray-700/30 text-gray-400'
                  )}
                >
                  {entry.rank}
                </div>

                {/* Player Address */}
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      'font-mono text-sm truncate',
                      isCurrentPlayer ? 'text-theme-primary font-bold' : 'text-gray-300'
                    )}
                  >
                    {formatAddress(entry.playerAddress)}
                  </div>
                  {isCurrentPlayer && <div className="text-xs text-theme-primary/70">You</div>}
                </div>

                {/* Score */}
                <div
                  className={cn(
                    'flex-shrink-0',
                    'font-bold',
                    isCurrentPlayer ? 'text-theme-primary' : 'text-gray-300'
                  )}
                >
                  {entry.score.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-700/30">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="capitalize">{periodType} Rankings</span>
          {isLoading && entries.length > 0 && (
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-theme-primary rounded-full animate-pulse"></div>
              Updating...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default LiveLeaderboardWidget;
