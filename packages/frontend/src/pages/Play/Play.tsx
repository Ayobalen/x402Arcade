/**
 * Play Page Component
 *
 * Browse and select games to play.
 * Features:
 * - Grid layout of game cards
 * - Game filtering (all games, coming soon, etc.)
 * - Game sorting options
 * - Retro arcade theme with neon accents
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * Game data type
 */
interface Game {
  id: string;
  name: string;
  emoji: string;
  description: string;
  price: string;
  status: 'available' | 'coming-soon';
  route: string;
}

/**
 * Available games
 */
const GAMES: Game[] = [
  {
    id: 'snake',
    name: 'Snake',
    emoji: '🐍',
    description: 'Classic snake game. Eat food, grow longer, avoid walls and yourself.',
    price: '$0.01',
    status: 'available',
    route: '/play/snake',
  },
  {
    id: 'pong',
    name: 'Pong',
    emoji: '🏓',
    description: 'Classic arcade pong. Keep the ball in play and beat the AI.',
    price: '$0.01',
    status: 'available',
    route: '/play/pong',
  },
  {
    id: 'tetris',
    name: 'Tetris',
    emoji: '🟦',
    description: 'Stack falling blocks to clear lines. Speed increases as you progress.',
    price: '$0.01',
    status: 'available',
    route: '/play/tetris',
  },
  {
    id: 'breakout',
    name: 'Breakout',
    emoji: '🧱',
    description: 'Break all the bricks with your paddle and ball. Classic arcade action.',
    price: '$0.01',
    status: 'available',
    route: '/play/breakout',
  },
  {
    id: 'space-invaders',
    name: 'Space Invaders',
    emoji: '👾',
    description: 'Defend Earth from alien invaders. Shoot them down before they reach you.',
    price: '$0.02',
    status: 'available',
    route: '/play/space-invaders',
  },
];

/**
 * Filter options
 */
type FilterOption = 'all' | 'available' | 'coming-soon';

/**
 * Sort options
 */
type SortOption = 'name' | 'price';

/**
 * Gamepad icon
 */
function GamepadIcon({ className }: { className?: string }) {
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
      <path d="M6 12h4" />
      <path d="M14 12h.01" />
      <path d="M17 12h.01" />
      <rect x="2" y="6" width="20" height="12" rx="2" />
    </svg>
  );
}

/**
 * Play Page Component
 */
export function Play() {
  const [filter, setFilter] = useState<FilterOption>('all');
  const [sort, setSort] = useState<SortOption>('name');

  // Filter games based on selected filter
  const filteredGames = GAMES.filter((game) => {
    if (filter === 'all') return true;
    if (filter === 'available') return game.status === 'available';
    if (filter === 'coming-soon') return game.status === 'coming-soon';
    return true;
  });

  // Sort games based on selected sort option
  const sortedGames = [...filteredGames].sort((a, b) => {
    if (sort === 'name') {
      return a.name.localeCompare(b.name);
    }
    if (sort === 'price') {
      const priceA = parseFloat(a.price.replace('$', ''));
      const priceB = parseFloat(b.price.replace('$', ''));
      return priceA - priceB;
    }
    return 0;
  });

  return (
    <div className="w-full min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1
            className={cn(
              'text-4xl md:text-5xl lg:text-6xl font-bold',
              'bg-gradient-to-r from-[#00ffff] via-[#ff00ff] to-[#00ffff]',
              'bg-clip-text text-transparent',
              'mb-4',
              'leading-tight'
            )}
          >
            Choose Your Game
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
            Select a game to play. Pay with USDC, compete for daily prizes.
          </p>
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          {/* Filter Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/60 mr-2">Filter:</span>
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium',
                'transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]',
                filter === 'all'
                  ? 'bg-gradient-to-r from-[#00ffff] to-[#ff00ff] text-black'
                  : 'bg-[#1a1a2e] border border-[#2d2d4a] text-white hover:border-[#00ffff] hover:text-[#00ffff]'
              )}
            >
              All Games ({GAMES.length})
            </button>
            <button
              onClick={() => setFilter('available')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium',
                'transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]',
                filter === 'available'
                  ? 'bg-gradient-to-r from-[#00ffff] to-[#ff00ff] text-black'
                  : 'bg-[#1a1a2e] border border-[#2d2d4a] text-white hover:border-[#00ffff] hover:text-[#00ffff]'
              )}
            >
              Available ({GAMES.filter((g) => g.status === 'available').length})
            </button>
            <button
              onClick={() => setFilter('coming-soon')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium',
                'transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]',
                filter === 'coming-soon'
                  ? 'bg-gradient-to-r from-[#00ffff] to-[#ff00ff] text-black'
                  : 'bg-[#1a1a2e] border border-[#2d2d4a] text-white hover:border-[#00ffff] hover:text-[#00ffff]'
              )}
            >
              Coming Soon ({GAMES.filter((g) => g.status === 'coming-soon').length})
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/60">Sort by:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium',
                'bg-[#1a1a2e] border border-[#2d2d4a] text-white',
                'hover:border-[#00ffff]',
                'focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:ring-offset-2 focus:ring-offset-[#0a0a0a]',
                'transition-all duration-200',
                'cursor-pointer'
              )}
            >
              <option value="name">Name (A-Z)</option>
              <option value="price">Price (Low to High)</option>
            </select>
          </div>
        </div>

        {/* Game Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedGames.map((game) => (
            <Link
              key={game.id}
              to={game.route}
              className={cn(
                'group',
                'p-6 rounded-xl',
                'bg-[#16162a]',
                'border border-[#2d2d4a]',
                'hover:border-[#00ffff]',
                'hover:shadow-[0_0_20px_rgba(0,255,255,0.3)]',
                'transition-all duration-200',
                game.status === 'coming-soon' && 'opacity-75'
              )}
            >
              {/* Game Icon */}
              <div className="aspect-square bg-[#0a0a0a] rounded-lg mb-4 flex items-center justify-center">
                <span className="text-6xl md:text-7xl lg:text-8xl">{game.emoji}</span>
              </div>

              {/* Game Name */}
              <h3 className="text-xl font-bold mb-2 text-white group-hover:text-[#00ffff] transition-colors">
                {game.name}
              </h3>

              {/* Game Description */}
              <p className="text-white/60 mb-4 text-sm leading-relaxed">{game.description}</p>

              {/* Game Price and Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#00ffff] font-semibold">{game.price} to play</span>
                </div>
                {game.status === 'coming-soon' && (
                  <span className="text-xs text-white/40 bg-[#1a1a2e] px-2 py-1 rounded">
                    Coming Soon
                  </span>
                )}
                {game.status === 'available' && (
                  <div className="flex items-center gap-1">
                    <GamepadIcon className="w-4 h-4 text-[#00ff00]" />
                    <span className="text-xs text-[#00ff00] font-semibold">Play Now</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {sortedGames.length === 0 && (
          <div className="text-center py-16">
            <p className="text-xl text-white/60">No games found matching your filters.</p>
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'mt-6',
                'px-6 py-3',
                'rounded-lg',
                'bg-gradient-to-r from-[#00ffff] to-[#ff00ff]',
                'text-black font-semibold',
                'hover:scale-105',
                'transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]'
              )}
            >
              Show All Games
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

Play.displayName = 'Play';

export default Play;
