/**
 * Leaderboard Widget Component
 *
 * Compact leaderboard display for game pages showing top scores.
 * Features:
 * - Top 5 scores
 * - Real-time updates
 * - Compact design
 * - Game-specific filtering
 *
 * @module components/leaderboard/LeaderboardWidget
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useWalletStore } from '@/stores/walletStore';

/**
 * Leaderboard entry interface
 */
interface LeaderboardEntry {
  rank: number;
  playerAddress: string;
  score: number;
  gameType: string;
  timestamp: string;
}

/**
 * API response interface
 */
interface LeaderboardResponse {
  gameType: string;
  periodType: string;
  limit: number;
  offset: number;
  count: number;
  entries: Array<{
    rank: number;
    player_address: string;
    score: number;
    game_type: string;
    created_at: string;
  }>;
}

/**
 * Widget props
 */
interface LeaderboardWidgetProps {
  gameType: string;
  periodType?: 'daily' | 'weekly' | 'alltime';
  limit?: number;
  className?: string;
}

/**
 * API base URL from environment
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Polling interval for updates (30 seconds)
 */
const POLL_INTERVAL_MS = 30000;

/**
 * Trophy icon for top rank
 */
function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

/**
 * Fetch leaderboard data from API
 */
async function fetchLeaderboard(
  gameType: string,
  periodType: string,
  limit: number
): Promise<LeaderboardEntry[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/leaderboard/${gameType}/${periodType}?limit=${limit}`
    );

    if (!response.ok) {
      return [];
    }

    const data: LeaderboardResponse = await response.json();
    return data.entries.map((entry) => ({
      rank: entry.rank,
      playerAddress: entry.player_address,
      score: entry.score,
      gameType: entry.game_type,
      timestamp: entry.created_at,
    }));
  } catch {
    // Silently fail - leaderboard is non-critical
    return [];
  }
}

/**
 * Format wallet address (0x1234...5678)
 */
function formatAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Leaderboard Widget Component
 */
export function LeaderboardWidget({
  gameType,
  periodType = 'daily',
  limit = 5,
  className,
}: LeaderboardWidgetProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { address: userAddress } = useWalletStore();

  // Fetch leaderboard data
  useEffect(() => {
    const loadLeaderboard = async () => {
      setIsLoading(true);
      const data = await fetchLeaderboard(gameType, periodType, limit);
      setEntries(data);
      setIsLoading(false);
    };

    loadLeaderboard();

    // Poll for updates
    const interval = setInterval(loadLeaderboard, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [gameType, periodType, limit]);

  return (
    <div
      className={cn(
        'rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-bg-surface)]/90 backdrop-blur-sm p-4 shadow-xl',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <TrophyIcon className="w-5 h-5 text-[var(--color-primary)]" />
        <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Top Scores</h3>
        <span className="ml-auto text-xs text-[var(--color-text-muted)] capitalize">
          {periodType}
        </span>
      </div>

      {/* Leaderboard Entries */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            // Loading skeleton
            <div className="space-y-2">
              {[...Array(limit)].map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="h-10 bg-[var(--color-bg-elevated)]/50 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : entries.length === 0 ? (
            // Empty state
            <div className="text-center py-6 text-[var(--color-text-muted)] text-sm">
              <p>No scores yet</p>
              <p className="text-xs mt-1">Be the first to play!</p>
            </div>
          ) : (
            // Entries
            entries.map((entry, index) => {
              const isUser = userAddress?.toLowerCase() === entry.playerAddress.toLowerCase();
              const isTopThree = entry.rank <= 3;

              return (
                <motion.div
                  key={entry.playerAddress + entry.rank}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded-lg transition-colors',
                    isUser &&
                      'bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/50',
                    !isUser &&
                      'bg-[var(--color-bg-elevated)]/30 hover:bg-[var(--color-bg-elevated)]/50'
                  )}
                >
                  {/* Rank */}
                  <div
                    className={cn(
                      'flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold',
                      isTopThree && 'bg-gradient-to-br',
                      entry.rank === 1 && 'from-yellow-400 to-yellow-600 text-yellow-950',
                      entry.rank === 2 && 'from-gray-300 to-gray-500 text-gray-900',
                      entry.rank === 3 && 'from-orange-400 to-orange-600 text-orange-950',
                      !isTopThree && 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]'
                    )}
                  >
                    {entry.rank}
                  </div>

                  {/* Player Address */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        'text-sm font-mono truncate',
                        isUser
                          ? 'text-[var(--color-primary)] font-bold'
                          : 'text-[var(--color-text-primary)]'
                      )}
                    >
                      {formatAddress(entry.playerAddress)}
                      {isUser && <span className="ml-1 text-xs">(You)</span>}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-sm font-bold text-[var(--color-text-primary)] tabular-nums">
                    {entry.score.toLocaleString()}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default LeaderboardWidget;
