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
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[LiveLeaderboardWidget] Received data:', data);

      if (data.entries && Array.isArray(data.entries)) {
        setEntries(data.entries);
        setError(null);
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
  }, [API_URL, gameType, periodType, limit]);

  /**
   * Initial fetch on mount
   */
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  /**
   * Set up polling interval
   */
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchLeaderboard();
    }, pollInterval);

    return () => clearInterval(intervalId);
  }, [fetchLeaderboard, pollInterval]);

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
        'bg-[#1a1a2e]',
        'border-2 border-[#00ff9f]/30',
        'rounded-xl',
        'p-4',
        'shadow-[0_0_20px_rgba(0,255,159,0.2)]',
        'min-w-[280px]',
        'max-w-[320px]',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#00ff9f] font-bold text-lg uppercase tracking-wide">Live Rankings</h3>
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
            'bg-[#00ff9f]/10',
            'border border-[#00ff9f]/30',
            'rounded-lg'
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400 mb-1">Your High Score</div>
              <div className="text-3xl font-bold text-[#00ff9f]">{playerHighScore.toLocaleString()}</div>
            </div>
            {playerRank !== null && (
              <div className="text-right">
                <div className="text-xs text-gray-400 mb-1">Rank</div>
                <div className="text-2xl font-bold text-[#00ff9f]">#{playerRank}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && entries.length === 0 && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ff9f]"></div>
          <p className="text-gray-400 mt-2 text-sm">Loading rankings...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && entries.length === 0 && (
        <div className="text-center py-8">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={fetchLeaderboard}
            className="mt-3 px-4 py-2 bg-[#00ff9f]/20 text-[#00ff9f] rounded-lg text-sm hover:bg-[#00ff9f]/30 transition-colors"
          >
            Retry
          </button>
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
                    ? 'bg-[#00ff9f]/20 border border-[#00ff9f]/50 shadow-[0_0_10px_rgba(0,255,159,0.3)]'
                    : 'bg-[#0f0f1a]/50 border border-gray-700/30 hover:bg-[#0f0f1a]/80'
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
                      isCurrentPlayer ? 'text-[#00ff9f] font-bold' : 'text-gray-300'
                    )}
                  >
                    {formatAddress(entry.playerAddress)}
                  </div>
                  {isCurrentPlayer && <div className="text-xs text-[#00ff9f]/70">You</div>}
                </div>

                {/* Score */}
                <div
                  className={cn(
                    'flex-shrink-0',
                    'font-bold',
                    isCurrentPlayer ? 'text-[#00ff9f]' : 'text-gray-300'
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
              <div className="w-2 h-2 bg-[#00ff9f] rounded-full animate-pulse"></div>
              Updating...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default LiveLeaderboardWidget;
