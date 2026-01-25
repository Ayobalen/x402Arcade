/**
 * Game Page Component
 *
 * Individual game page for playing arcade games.
 * Uses URL parameter :gameId to determine which game to render.
 *
 * Games: snake, pong, tetris, breakout, space-invaders
 */

import { useParams, Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { SnakeGame } from '@/games/snake/SnakeGame';
import { PongGameWrapper } from '@/games/pong/PongGameWrapper';

/**
 * Game metadata
 */
interface GameInfo {
  id: string;
  name: string;
  emoji: string;
  description: string;
  status: 'available' | 'coming-soon';
}

/**
 * Available games configuration
 */
const GAMES: Record<string, GameInfo> = {
  snake: {
    id: 'snake',
    name: 'Snake',
    emoji: '🐍',
    description: 'Classic snake game. Eat food, grow longer, avoid walls and yourself.',
    status: 'available',
  },
  pong: {
    id: 'pong',
    name: 'Pong',
    emoji: '🏓',
    description: 'Classic arcade pong. Keep the ball in play and beat the AI.',
    status: 'available',
  },
  tetris: {
    id: 'tetris',
    name: 'Tetris',
    emoji: '🟦',
    description: 'Stack falling blocks to clear lines. Speed increases as you progress.',
    status: 'coming-soon',
  },
  breakout: {
    id: 'breakout',
    name: 'Breakout',
    emoji: '🧱',
    description: 'Break all the bricks with your paddle and ball. Classic arcade action.',
    status: 'coming-soon',
  },
  'space-invaders': {
    id: 'space-invaders',
    name: 'Space Invaders',
    emoji: '👾',
    description: 'Defend Earth from alien invaders. Shoot them down before they reach you.',
    status: 'coming-soon',
  },
};

/**
 * Home icon for back button
 */
function ArrowLeftIcon({ className }: { className?: string }) {
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
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

/**
 * Game Page Component
 */
export function Game() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();

  // Get game info, or undefined if not found
  const gameInfo = gameId ? GAMES[gameId] : undefined;

  // Handle exit from game wrapper
  const handleExit = () => {
    navigate('/play');
  };

  // If game not found, show error message
  if (!gameInfo || !gameId) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <h1
              className={cn(
                'text-6xl md:text-7xl font-bold mb-4',
                'bg-gradient-to-r from-[#ff00ff] via-[#00ffff] to-[#ff00ff]',
                'bg-clip-text text-transparent'
              )}
            >
              Game Not Found
            </h1>
            <p className="text-xl text-white/70 mb-6">
              The game "{gameId}" doesn't exist in our arcade.
            </p>
          </div>

          <Link
            to="/play"
            className={cn(
              'inline-flex items-center gap-2',
              'px-8 py-4',
              'rounded-lg',
              'bg-gradient-to-r from-[#00ffff] to-[#ff00ff]',
              'text-black font-bold text-lg',
              'hover:scale-105',
              'hover:shadow-[0_0_30px_rgba(0,255,255,0.6)]',
              'transition-all duration-200'
            )}
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Games
          </Link>
        </div>
      </div>
    );
  }

  // Render available game - Snake
  if (gameInfo.status === 'available' && gameId === 'snake') {
    return (
      <div className="w-full min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <SnakeGame />
        </div>
      </div>
    );
  }

  // Render available game - Pong
  if (gameInfo.status === 'available' && gameId === 'pong') {
    return (
      <div className="w-full min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-4xl mx-auto w-full">
          <PongGameWrapper onExit={handleExit} />
        </div>
      </div>
    );
  }

  // Game exists but is coming soon
  return (
    <div className="w-full min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-4xl mx-auto text-center">
        {/* Game Header */}
        <div className="mb-8">
          <div className="text-8xl mb-6">{gameInfo.emoji}</div>
          <h1
            className={cn(
              'text-5xl md:text-6xl font-bold mb-4',
              'bg-gradient-to-r from-[#00ffff] via-[#ff00ff] to-[#00ffff]',
              'bg-clip-text text-transparent'
            )}
          >
            {gameInfo.name}
          </h1>
          <p className="text-xl text-white/70 mb-6">{gameInfo.description}</p>
        </div>

        {/* Coming Soon Message */}
        <div className="mb-12">
          <div
            className={cn(
              'inline-block',
              'px-6 py-3',
              'rounded-lg',
              'bg-[#1a1a2e]',
              'border border-[#2d2d4a]',
              'mb-6'
            )}
          >
            <p className="text-lg text-white/80 font-semibold uppercase tracking-wider">
              Coming Soon
            </p>
          </div>
          <p className="text-lg text-white/60">This game is under development. Check back soon!</p>
        </div>

        {/* Back Button */}
        <Link
          to="/play"
          className={cn(
            'inline-flex items-center gap-2',
            'px-8 py-4',
            'rounded-lg',
            'bg-[#1a1a2e]',
            'border border-[#2d2d4a]',
            'text-white font-semibold text-lg',
            'hover:border-[#00ffff]',
            'hover:text-[#00ffff]',
            'transition-all duration-200'
          )}
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Games
        </Link>
      </div>
    </div>
  );
}

Game.displayName = 'Game';

export default Game;
