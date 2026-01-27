/**
 * Leaderboard Widget Component
 *
 * Displays real-time leaderboard and prize pool information alongside the game.
 * Auto-refreshes periodically to show latest rankings.
 */

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

/**
 * Leaderboard entry interface
 */
export interface LeaderboardEntry {
  rank: number;
  playerAddress: string;
  score: number;
  timestamp?: string;
  isCurrentPlayer?: boolean;
}

/**
 * Props for the LeaderboardWidget component
 */
export interface LeaderboardWidgetProps {
  /** Game type (e.g., 'snake') */
  gameType: string;
  /** Period type (daily, weekly, alltime) */
  periodType?: 'daily' | 'weekly' | 'alltime';
  /** Current player's wallet address */
  playerAddress?: string;
  /** API base URL */
  apiUrl?: string;
  /** Refresh interval in milliseconds (default: 30000 = 30s) */
  refreshInterval?: number;
  /** Maximum number of entries to display (default: 10) */
  maxEntries?: number;
  /** Optional CSS class name */
  className?: string;
}

/**
 * LeaderboardWidget Component
 *
 * Displays a real-time leaderboard with prize pool information.
 * Auto-refreshes to show latest rankings during gameplay.
 */
export function LeaderboardWidget({
  gameType,
  periodType = 'daily',
  playerAddress,
  apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001',
  refreshInterval = 30000,
  maxEntries = 10,
  className = '',
}: LeaderboardWidgetProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [prizePool, setPrizePool] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch leaderboard data
  const fetchLeaderboard = async () => {
    try {
      // Fetch leaderboard entries
      const leaderboardRes = await fetch(
        `${apiUrl}/api/v1/leaderboard/${gameType}/${periodType}?limit=${maxEntries}`
      );

      if (leaderboardRes.ok) {
        const leaderboardData = await leaderboardRes.json();
        const transformedEntries = leaderboardData.entries.map((entry: any) => ({
          rank: entry.rank,
          playerAddress: entry.playerAddress,
          score: entry.score,
          timestamp: entry.timestamp,
          isCurrentPlayer:
            playerAddress && entry.playerAddress.toLowerCase() === playerAddress.toLowerCase(),
        }));
        setEntries(transformedEntries);
      }

      // Fetch prize pool (only for daily)
      if (periodType === 'daily') {
        const prizeRes = await fetch(`${apiUrl}/api/v1/prize/${gameType}/daily`);
        if (prizeRes.ok) {
          const prizeData = await prizeRes.json();
          setPrizePool(prizeData.pool.totalAmountUsdc || 0);
        }
      }

      setError(null);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchLeaderboard();

    const interval = setInterval(fetchLeaderboard, refreshInterval);

    return () => clearInterval(interval);
  }, [gameType, periodType, playerAddress, apiUrl, refreshInterval, maxEntries]);

  if (isLoading) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center',
          'p-6',
          'bg-[#1a1a2e]',
          'border-2 border-[#2d2d4a]',
          'rounded-xl',
          'shadow-[0_0_20px_rgba(139,92,246,0.2)]',
          className
        )}
      >
        <div className="animate-pulse text-white/70 text-sm">Loading leaderboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center',
          'p-6',
          'bg-[#1a1a2e]',
          'border-2 border-[#2d2d4a]',
          'rounded-xl',
          className
        )}
      >
        <div className="text-red-400 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Prize Pool (Daily only) */}
      {periodType === 'daily' && prizePool > 0 && (
        <div
          className={cn(
            'p-4',
            'bg-[#1a1a2e]',
            'border-2 border-[#00ffff]/50',
            'rounded-xl',
            'shadow-[0_0_20px_rgba(0,255,255,0.3)]'
          )}
        >
          <div className="text-xs text-white/60 uppercase tracking-wider mb-2 text-center">
            Today's Prize Pool
          </div>
          <div className="text-2xl font-bold text-[#00ffff] text-center">
            ${prizePool.toFixed(2)} USDC
          </div>
          <div className="text-xs text-white/50 mt-2 text-center">Winner takes all at midnight</div>
        </div>
      )}

      {/* Leaderboard */}
      <div
        className={cn(
          'p-4',
          'bg-[#1a1a2e]',
          'border-2 border-[#2d2d4a]',
          'rounded-xl',
          'shadow-[0_0_20px_rgba(139,92,246,0.2)]'
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
            {periodType === 'daily' && '🏆 Today'}
            {periodType === 'weekly' && '📅 This Week'}
            {periodType === 'alltime' && '👑 All Time'}
          </h3>
          <div className="text-xs text-white/50">Top {entries.length}</div>
        </div>

        {entries.length === 0 ? (
          <div className="text-center text-white/60 text-sm py-4">No entries yet</div>
        ) : (
          <div className="flex flex-col gap-2">
            {entries.map((entry) => (
              <div
                key={`${entry.rank}-${entry.playerAddress}`}
                className={cn(
                  'flex items-center justify-between',
                  'p-2 rounded-lg',
                  'transition-colors duration-200',
                  entry.isCurrentPlayer
                    ? 'bg-[#00ffff]/10 border border-[#00ffff]/30'
                    : 'bg-[#0f0f1a] border border-transparent hover:border-[#2d2d4a]'
                )}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Rank */}
                  <div
                    className={cn(
                      'flex items-center justify-center',
                      'w-6 h-6',
                      'rounded',
                      'text-xs font-bold',
                      entry.rank === 1
                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black'
                        : entry.rank === 2
                          ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black'
                          : entry.rank === 3
                            ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-black'
                            : 'bg-[#2d2d4a] text-white/70'
                    )}
                  >
                    {entry.rank}
                  </div>

                  {/* Address */}
                  <div
                    className={cn(
                      'font-mono text-xs truncate',
                      entry.isCurrentPlayer ? 'text-[#00ffff] font-semibold' : 'text-white/70'
                    )}
                    title={entry.playerAddress}
                  >
                    {entry.playerAddress.slice(0, 6)}...{entry.playerAddress.slice(-4)}
                  </div>

                  {/* Current Player Badge */}
                  {entry.isCurrentPlayer && (
                    <div className="text-[10px] px-1.5 py-0.5 rounded bg-[#00ffff]/20 text-[#00ffff] font-semibold">
                      YOU
                    </div>
                  )}
                </div>

                {/* Score */}
                <div className="text-sm font-bold text-[#00ffff] tabular-nums">{entry.score}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default LeaderboardWidget;
