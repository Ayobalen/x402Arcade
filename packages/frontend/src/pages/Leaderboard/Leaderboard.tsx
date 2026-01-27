/**
 * Leaderboard Page Component
 *
 * Displays high scores and rankings across all games with:
 * - Game filter tabs (All Games, Snake, Pong, Tetris, Breakout, Space Invaders)
 * - Time period filter tabs (Daily, Weekly, All Time)
 * - Real-time updates via polling
 * - Rank change animations
 * - User highlight in leaderboard
 * - Retro arcade theme with neon accents
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useWalletStore } from '@/stores/walletStore';

/**
 * Trophy icon for top rankings
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
 * Medal icon for rankings 2-3
 */
function MedalIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}

/**
 * Game type for filtering
 */
type GameType = 'all' | 'snake' | 'pong' | 'tetris' | 'breakout' | 'space-invaders';

/**
 * Time period for filtering
 */
type TimePeriod = 'daily' | 'weekly' | 'alltime';

/**
 * Leaderboard entry interface
 */
interface LeaderboardEntry {
  rank: number;
  playerAddress: string;
  score: number;
  gameType: string;
  timestamp: string;
  previousRank?: number; // For rank change animations
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
    playerAddress: string; // Backend returns camelCase, not snake_case
    score: number;
    gameType: string;
    periodType: string;
    periodDate: string;
  }>;
}

/**
 * Polling interval for real-time updates (30 seconds)
 */
const POLL_INTERVAL_MS = 30000;

/**
 * API base URL from environment
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Fetch leaderboard data from API
 */
async function fetchLeaderboard(
  gameType: GameType,
  periodType: TimePeriod
): Promise<LeaderboardEntry[]> {
  // Handle "all" game type - fetch all games and merge
  if (gameType === 'all') {
    const gameTypes: Array<Exclude<GameType, 'all'>> = [
      'snake',
      'pong',
      'tetris',
      'breakout',
      'space-invaders',
    ];
    const allEntries: LeaderboardEntry[] = [];

    // Fetch each game type in parallel
    const promises = gameTypes.map(async (gt) => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/v1/leaderboard/${gt}/${periodType}?limit=100`
        );
        if (!response.ok) return [];

        const data: LeaderboardResponse = await response.json();
        return data.entries
          .filter((entry) => entry.playerAddress) // Filter out entries without playerAddress
          .map((entry) => ({
            rank: entry.rank,
            playerAddress: entry.playerAddress,
            score: entry.score,
            gameType: entry.gameType,
            timestamp: entry.periodDate, // Use periodDate as timestamp
          }));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Error fetching ${gt} leaderboard:`, error);
        return [];
      }
    });

    const results = await Promise.all(promises);
    results.forEach((entries) => allEntries.push(...entries));

    // Sort by score descending and reassign ranks
    allEntries.sort((a, b) => b.score - a.score);
    allEntries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // Return top 100
    return allEntries.slice(0, 100);
  }

  // Fetch specific game type
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/leaderboard/${gameType}/${periodType}?limit=100`
    );

    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.error(`Leaderboard API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data: LeaderboardResponse = await response.json();

    return data.entries
      .filter((entry) => entry.playerAddress) // Filter out entries without playerAddress
      .map((entry) => ({
        rank: entry.rank,
        playerAddress: entry.playerAddress,
        score: entry.score,
        gameType: entry.gameType,
        timestamp: entry.periodDate, // Use periodDate as timestamp
      }));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

/**
 * Get rank icon based on position
 */
function getRankIcon(rank: number) {
  if (rank === 1) {
    return <TrophyIcon className="w-6 h-6 text-[#FFD700]" />; // Gold
  }
  if (rank === 2) {
    return <MedalIcon className="w-6 h-6 text-[#C0C0C0]" />; // Silver
  }
  if (rank === 3) {
    return <MedalIcon className="w-6 h-6 text-[#CD7F32]" />; // Bronze
  }
  return <span className="text-white/40 font-mono text-sm">#{rank}</span>;
}

/**
 * Get rank background color
 */
function getRankBgClass(rank: number, isCurrentUser: boolean) {
  if (isCurrentUser) {
    return 'bg-gradient-to-r from-[#00ffff]/20 to-[#ff00ff]/10 border-l-2 border-[#00ffff]';
  }
  if (rank === 1) return 'bg-gradient-to-r from-[#FFD700]/20 to-transparent';
  if (rank === 2) return 'bg-gradient-to-r from-[#C0C0C0]/20 to-transparent';
  if (rank === 3) return 'bg-gradient-to-r from-[#CD7F32]/20 to-transparent';
  return 'hover:bg-[#1a1a2e]';
}

/**
 * Rank Change Indicator Component
 */
function RankChangeIndicator({ previous, current }: { previous?: number; current: number }) {
  if (!previous || previous === current) return null;

  const isUp = previous > current; // Lower rank number = higher position
  const change = Math.abs(previous - current);

  return (
    <motion.div
      initial={{ opacity: 0, y: isUp ? 10 : -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex items-center gap-1 text-xs font-bold',
        isUp ? 'text-[#00ff00]' : 'text-[#ff4444]'
      )}
    >
      <span>{isUp ? '↑' : '↓'}</span>
      <span>{change}</span>
    </motion.div>
  );
}

/**
 * Leaderboard Page Component
 */
export function Leaderboard() {
  // Wallet state
  const address = useWalletStore((state) => state.address);

  // Filter state
  const [selectedGame, setSelectedGame] = useState<GameType>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('daily');

  // Data state
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Previous data ref for rank change detection
  const previousDataRef = useRef<Map<string, number>>(new Map());

  // Fetch leaderboard data
  const loadLeaderboard = async () => {
    try {
      setError(null);
      const data = await fetchLeaderboard(selectedGame, selectedPeriod);

      // Store previous ranks for animation
      const previousRanks = previousDataRef.current;

      // Add previousRank to entries for animation
      const dataWithPreviousRanks = data.map((entry) => {
        const key = `${entry.playerAddress}-${entry.gameType}`;
        const previousRank = previousRanks.get(key);
        return {
          ...entry,
          previousRank,
        };
      });

      // Update previous ranks map
      const newRanks = new Map<string, number>();
      data.forEach((entry) => {
        const key = `${entry.playerAddress}-${entry.gameType}`;
        newRanks.set(key, entry.rank);
      });
      previousDataRef.current = newRanks;

      setLeaderboardData(dataWithPreviousRanks);
      setIsLoading(false);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to load leaderboard:', err);
      setError('Failed to load leaderboard. Please try again.');
      setIsLoading(false);
    }
  };

  // Initial load and polling
  useEffect(() => {
    // Load immediately
    void loadLeaderboard();

    // Set up polling interval
    const intervalId = setInterval(() => {
      void loadLeaderboard();
    }, POLL_INTERVAL_MS);

    // Clean up on unmount or filter change
    return () => clearInterval(intervalId);
  }, [selectedGame, selectedPeriod]);

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1
            className={cn(
              'text-4xl md:text-5xl lg:text-6xl font-bold mb-4',
              'bg-gradient-to-r from-[#00ffff] via-[#ff00ff] to-[#00ffff]',
              'bg-clip-text text-transparent'
            )}
          >
            Leaderboard
          </h1>
          <p className="text-lg text-white/70">
            Compete for glory and daily prize pools. Top players win 70% of all game payments.
          </p>
        </div>

        {/* Game Filter Tabs */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
            Select Game
          </h2>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all' as const, label: 'All Games', emoji: '🎮' },
              { value: 'snake' as const, label: 'Snake', emoji: '🐍' },
              { value: 'pong' as const, label: 'Pong', emoji: '🏓' },
              { value: 'tetris' as const, label: 'Tetris', emoji: '🟦' },
              { value: 'breakout' as const, label: 'Breakout', emoji: '🧱' },
              { value: 'space-invaders' as const, label: 'Space Invaders', emoji: '👾' },
            ].map((game) => (
              <button
                key={game.value}
                onClick={() => setSelectedGame(game.value)}
                className={cn(
                  'px-6 py-3 rounded-lg font-semibold transition-all duration-200',
                  'border-2',
                  'flex items-center gap-2',
                  selectedGame === game.value
                    ? 'bg-gradient-to-r from-[#00ffff] to-[#ff00ff] text-black border-transparent shadow-[0_0_20px_rgba(0,255,255,0.4)]'
                    : 'bg-[#16162a] text-white border-[#2d2d4a] hover:border-[#00ffff]'
                )}
              >
                <span>{game.emoji}</span>
                <span>{game.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Time Period Filter Tabs */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
            Time Period
          </h2>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'daily' as const, label: 'Daily' },
              { value: 'weekly' as const, label: 'Weekly' },
              { value: 'alltime' as const, label: 'All Time' },
            ].map((period) => (
              <button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value)}
                className={cn(
                  'px-6 py-3 rounded-lg font-semibold transition-all duration-200',
                  'border-2',
                  selectedPeriod === period.value
                    ? 'bg-[#00ffff]/10 text-[#00ffff] border-[#00ffff] shadow-[0_0_15px_rgba(0,255,255,0.3)]'
                    : 'bg-[#16162a] text-white border-[#2d2d4a] hover:border-[#00ffff]'
                )}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-[#16162a] border border-[#2d2d4a] rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="bg-[#0a0a0a] border-b border-[#2d2d4a] px-6 py-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <TrophyIcon className="w-5 h-5 text-[#00ffff]" />
              Top Players
            </h3>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2d2d4a] bg-[#0a0a0a]/50">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-white/60 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-white/60 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-white/60 uppercase tracking-wider">
                    Game
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-white/60 uppercase tracking-wider">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className="border-b border-[#2d2d4a]/50">
                      <td className="px-6 py-4">
                        <div className="w-8 h-8 bg-[#2d2d4a]/50 rounded animate-pulse" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-32 h-6 bg-[#2d2d4a]/50 rounded animate-pulse" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-20 h-6 bg-[#2d2d4a]/50 rounded animate-pulse" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="w-24 h-6 bg-[#2d2d4a]/50 rounded animate-pulse ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : (
                  <AnimatePresence mode="popLayout">
                    {leaderboardData.map((entry) => {
                      const isCurrentUser =
                        address && entry.playerAddress && entry.playerAddress.toLowerCase() === address.toLowerCase();

                      return (
                        <motion.tr
                          key={`${entry.rank}-${entry.playerAddress}`}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                          className={cn(
                            'border-b border-[#2d2d4a]/50 transition-colors duration-200',
                            getRankBgClass(entry.rank, !!isCurrentUser)
                          )}
                        >
                          {/* Rank */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {getRankIcon(entry.rank)}
                              <RankChangeIndicator
                                previous={entry.previousRank}
                                current={entry.rank}
                              />
                            </div>
                          </td>

                          {/* Player Address */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <code
                                className={cn(
                                  'font-mono text-sm px-3 py-1 rounded border',
                                  isCurrentUser
                                    ? 'text-[#00ffff] bg-[#00ffff]/10 border-[#00ffff] font-bold'
                                    : 'text-white bg-[#0a0a0a] border-[#2d2d4a]'
                                )}
                              >
                                {entry.playerAddress}
                              </code>
                              {isCurrentUser && (
                                <span className="text-xs text-[#00ffff] font-bold">(You)</span>
                              )}
                            </div>
                          </td>

                          {/* Game Type */}
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0a0a0a] border border-[#2d2d4a] text-sm text-white/80">
                              {entry.gameType}
                            </span>
                          </td>

                          {/* Score */}
                          <td className="px-6 py-4 text-right">
                            <span className="text-lg font-bold text-[#00ffff] font-mono">
                              {entry.score.toLocaleString()}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>

          {/* Error State */}
          {error && !isLoading && (
            <div className="px-6 py-12 text-center">
              <div className="w-12 h-12 mx-auto mb-4 text-[#ff4444]">⚠️</div>
              <p className="text-[#ff4444] text-lg">{error}</p>
              <button
                onClick={() => loadLeaderboard()}
                className="mt-4 px-6 py-2 bg-[#00ffff] text-black rounded-lg font-semibold hover:bg-[#00ffff]/80 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && leaderboardData.length === 0 && (
            <div className="px-6 py-12 text-center">
              <TrophyIcon className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60 text-lg">No scores yet for this game.</p>
              <p className="text-white/40 text-sm mt-2">
                Be the first to play and claim the top spot!
              </p>
            </div>
          )}
        </div>

        {/* Real-time Update Indicator */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#16162a] border border-[#2d2d4a] rounded-lg">
            <div className="relative">
              <div className="w-2 h-2 bg-[#00ff00] rounded-full animate-pulse" />
              <div className="absolute inset-0 w-2 h-2 bg-[#00ff00] rounded-full animate-ping" />
            </div>
            <span className="text-sm text-white/70">
              Auto-updating every {POLL_INTERVAL_MS / 1000} seconds
            </span>
          </div>
        </div>

        {/* Prize Pool Info */}
        <div className="mt-8 p-6 bg-gradient-to-r from-[#00ffff]/10 to-[#ff00ff]/10 border border-[#00ffff]/30 rounded-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Daily Prize Pool</h3>
              <p className="text-white/70 text-sm">
                70% of all game payments. Winner announced at midnight UTC.
              </p>
            </div>
            <div className="text-center md:text-right">
              <div className="text-3xl font-bold bg-gradient-to-r from-[#00ffff] to-[#ff00ff] bg-clip-text text-transparent font-mono">
                $42.50 USDC
              </div>
              <p className="text-xs text-white/60 mt-1">Updates in real-time</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Leaderboard.displayName = 'Leaderboard';

export default Leaderboard;
