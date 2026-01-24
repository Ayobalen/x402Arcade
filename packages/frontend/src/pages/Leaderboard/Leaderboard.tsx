/**
 * Leaderboard Page Component
 *
 * Displays high scores and rankings across all games with:
 * - Game filter tabs (All Games, Snake, Pong, Tetris)
 * - Time period filter tabs (Daily, Weekly, All Time)
 * - Leaderboard table with rankings
 * - Player addresses and scores
 * - Retro arcade theme with neon accents
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';

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
type GameType = 'all' | 'snake' | 'pong' | 'tetris';

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
}

/**
 * Mock leaderboard data (will be replaced with API calls)
 */
const mockLeaderboardData: LeaderboardEntry[] = [
  {
    rank: 1,
    playerAddress: '0x1234...5678',
    score: 15420,
    gameType: 'Snake',
    timestamp: '2024-01-24T10:30:00Z',
  },
  {
    rank: 2,
    playerAddress: '0xabcd...ef12',
    score: 14200,
    gameType: 'Snake',
    timestamp: '2024-01-24T09:15:00Z',
  },
  {
    rank: 3,
    playerAddress: '0x9876...4321',
    score: 13800,
    gameType: 'Tetris',
    timestamp: '2024-01-24T08:45:00Z',
  },
  {
    rank: 4,
    playerAddress: '0xdef0...9abc',
    score: 12500,
    gameType: 'Pong',
    timestamp: '2024-01-23T22:10:00Z',
  },
  {
    rank: 5,
    playerAddress: '0x5555...6666',
    score: 11900,
    gameType: 'Snake',
    timestamp: '2024-01-23T20:30:00Z',
  },
  {
    rank: 6,
    playerAddress: '0x7777...8888',
    score: 10800,
    gameType: 'Tetris',
    timestamp: '2024-01-23T18:20:00Z',
  },
  {
    rank: 7,
    playerAddress: '0x9999...0000',
    score: 9500,
    gameType: 'Pong',
    timestamp: '2024-01-23T16:45:00Z',
  },
  {
    rank: 8,
    playerAddress: '0xaaaa...bbbb',
    score: 8700,
    gameType: 'Snake',
    timestamp: '2024-01-23T14:30:00Z',
  },
  {
    rank: 9,
    playerAddress: '0xcccc...dddd',
    score: 7900,
    gameType: 'Tetris',
    timestamp: '2024-01-23T12:15:00Z',
  },
  {
    rank: 10,
    playerAddress: '0xeeee...ffff',
    score: 7200,
    gameType: 'Pong',
    timestamp: '2024-01-23T10:00:00Z',
  },
];

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
function getRankBgClass(rank: number) {
  if (rank === 1) return 'bg-gradient-to-r from-[#FFD700]/20 to-transparent';
  if (rank === 2) return 'bg-gradient-to-r from-[#C0C0C0]/20 to-transparent';
  if (rank === 3) return 'bg-gradient-to-r from-[#CD7F32]/20 to-transparent';
  return 'hover:bg-[#1a1a2e]';
}

/**
 * Leaderboard Page Component
 */
export function Leaderboard() {
  const [selectedGame, setSelectedGame] = useState<GameType>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('daily');

  // Filter data based on selections (mock implementation)
  const filteredData = mockLeaderboardData.filter((entry) => {
    if (selectedGame === 'all') return true;
    return entry.gameType.toLowerCase() === selectedGame;
  });

  return (
    <div className="w-full min-h-screen py-12 px-4">
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
                {filteredData.map((entry) => (
                  <tr
                    key={`${entry.rank}-${entry.playerAddress}`}
                    className={cn(
                      'border-b border-[#2d2d4a]/50 transition-colors duration-200',
                      getRankBgClass(entry.rank)
                    )}
                  >
                    {/* Rank */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">{getRankIcon(entry.rank)}</div>
                    </td>

                    {/* Player Address */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-sm text-white bg-[#0a0a0a] px-3 py-1 rounded border border-[#2d2d4a]">
                          {entry.playerAddress}
                        </code>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredData.length === 0 && (
            <div className="px-6 py-12 text-center">
              <TrophyIcon className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60 text-lg">No scores yet for this game.</p>
              <p className="text-white/40 text-sm mt-2">
                Be the first to play and claim the top spot!
              </p>
            </div>
          )}
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
