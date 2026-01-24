/**
 * Home Page Component
 *
 * Landing page for x402 Arcade featuring:
 * - Hero section with tagline
 * - Featured games showcase
 * - Call-to-action to start playing
 * - Retro arcade theme with neon accents
 */

import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * Gamepad icon for CTA button
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
 * Trophy icon for leaderboard
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
 * Coins icon for prize pool
 */
function CoinsIcon({ className }: { className?: string }) {
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
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="m16.71 13.88.7.71-2.82 2.82" />
    </svg>
  );
}

/**
 * Home Page Component
 */
export function Home() {
  return (
    <div className="w-full min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Hero Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a1a2e] border border-[#2d2d4a] mb-8">
            <span className="text-xs font-semibold text-[#00ffff] uppercase tracking-wider">
              Powered by Cronos x402
            </span>
          </div>

          {/* Hero Headline */}
          <h1
            className={cn(
              'text-5xl md:text-6xl lg:text-7xl font-bold',
              'bg-gradient-to-r from-[#00ffff] via-[#ff00ff] to-[#00ffff]',
              'bg-clip-text text-transparent',
              'mb-6',
              'leading-tight'
            )}
          >
            Insert a Penny,
            <br />
            Play for Glory
          </h1>

          {/* Hero Tagline */}
          <p className="text-xl md:text-2xl text-white/80 mb-4 leading-relaxed">
            Gasless arcade gaming on Cronos blockchain
          </p>
          <p className="text-lg text-white/60 mb-12 leading-relaxed">
            Pay just $0.01 per game. Zero gas fees. Compete for daily prize pools.
          </p>

          {/* Hero CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Primary CTA - Play Now */}
            <Link
              to="/play"
              className={cn(
                'group',
                'inline-flex items-center gap-2',
                'px-8 py-4',
                'rounded-lg',
                'bg-gradient-to-r from-[#00ffff] to-[#ff00ff]',
                'text-black font-bold text-lg',
                'hover:scale-105',
                'hover:shadow-[0_0_30px_rgba(0,255,255,0.6)]',
                'transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]'
              )}
            >
              <GamepadIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Start Playing
            </Link>

            {/* Secondary CTA - View Leaderboard */}
            <Link
              to="/leaderboard"
              className={cn(
                'inline-flex items-center gap-2',
                'px-8 py-4',
                'rounded-lg',
                'bg-[#1a1a2e]',
                'border border-[#2d2d4a]',
                'text-white font-semibold text-lg',
                'hover:border-[#00ffff]',
                'hover:text-[#00ffff]',
                'transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]'
              )}
            >
              <TrophyIcon className="w-5 h-5" />
              View Leaderboard
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">
            Why Play on{' '}
            <span className="bg-gradient-to-r from-[#00ffff] to-[#ff00ff] bg-clip-text text-transparent">
              x402 Arcade
            </span>
            ?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1: Instant Play */}
            <div
              className={cn(
                'p-6 rounded-xl',
                'bg-[#16162a]',
                'border border-[#2d2d4a]',
                'hover:border-[#00ffff]',
                'transition-all duration-200',
                'group'
              )}
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-[#00ffff] to-[#ff00ff] mb-4">
                <GamepadIcon className="w-6 h-6 text-black" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white group-hover:text-[#00ffff] transition-colors">
                Instant Play
              </h3>
              <p className="text-white/60 leading-relaxed">
                Pay $0.01 and start playing immediately. No complex wallet approvals or transaction
                delays.
              </p>
            </div>

            {/* Feature 2: Zero Gas Fees */}
            <div
              className={cn(
                'p-6 rounded-xl',
                'bg-[#16162a]',
                'border border-[#2d2d4a]',
                'hover:border-[#00ffff]',
                'transition-all duration-200',
                'group'
              )}
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-[#00ffff] to-[#ff00ff] mb-4">
                <CoinsIcon className="w-6 h-6 text-black" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white group-hover:text-[#00ffff] transition-colors">
                Zero Gas Fees
              </h3>
              <p className="text-white/60 leading-relaxed">
                x402 protocol handles all gas costs. You only pay for the game, nothing more.
              </p>
            </div>

            {/* Feature 3: Daily Prizes */}
            <div
              className={cn(
                'p-6 rounded-xl',
                'bg-[#16162a]',
                'border border-[#2d2d4a]',
                'hover:border-[#00ffff]',
                'transition-all duration-200',
                'group'
              )}
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-[#00ffff] to-[#ff00ff] mb-4">
                <TrophyIcon className="w-6 h-6 text-black" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white group-hover:text-[#00ffff] transition-colors">
                Daily Prizes
              </h3>
              <p className="text-white/60 leading-relaxed">
                70% of all payments fund daily prize pools. Compete for real rewards on the
                leaderboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Games Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">
            Featured Games
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Game 1: Snake */}
            <Link
              to="/play/snake"
              className={cn(
                'group',
                'p-6 rounded-xl',
                'bg-[#16162a]',
                'border border-[#2d2d4a]',
                'hover:border-[#00ffff]',
                'hover:shadow-[0_0_20px_rgba(0,255,255,0.3)]',
                'transition-all duration-200',
                'cursor-pointer'
              )}
            >
              <div className="aspect-video bg-[#0a0a0a] rounded-lg mb-4 flex items-center justify-center">
                <span className="text-6xl">🐍</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-white group-hover:text-[#00ffff] transition-colors">
                Snake
              </h3>
              <p className="text-white/60 mb-4 text-sm">
                Classic snake game. Eat food, grow longer, avoid walls and yourself.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#00ffff] font-semibold">$0.01 to play</span>
                <span className="text-xs text-white/40">Coming Soon</span>
              </div>
            </Link>

            {/* Game 2: Pong */}
            <Link
              to="/play/pong"
              className={cn(
                'group',
                'p-6 rounded-xl',
                'bg-[#16162a]',
                'border border-[#2d2d4a]',
                'hover:border-[#00ffff]',
                'hover:shadow-[0_0_20px_rgba(0,255,255,0.3)]',
                'transition-all duration-200',
                'cursor-pointer'
              )}
            >
              <div className="aspect-video bg-[#0a0a0a] rounded-lg mb-4 flex items-center justify-center">
                <span className="text-6xl">🏓</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-white group-hover:text-[#00ffff] transition-colors">
                Pong
              </h3>
              <p className="text-white/60 mb-4 text-sm">
                Classic arcade pong. Keep the ball in play and beat the AI.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#00ffff] font-semibold">$0.01 to play</span>
                <span className="text-xs text-white/40">Coming Soon</span>
              </div>
            </Link>

            {/* Game 3: Tetris */}
            <Link
              to="/play/tetris"
              className={cn(
                'group',
                'p-6 rounded-xl',
                'bg-[#16162a]',
                'border border-[#2d2d4a]',
                'hover:border-[#00ffff]',
                'hover:shadow-[0_0_20px_rgba(0,255,255,0.3)]',
                'transition-all duration-200',
                'cursor-pointer'
              )}
            >
              <div className="aspect-video bg-[#0a0a0a] rounded-lg mb-4 flex items-center justify-center">
                <span className="text-6xl">🟦</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-white group-hover:text-[#00ffff] transition-colors">
                Tetris
              </h3>
              <p className="text-white/60 mb-4 text-sm">
                Stack falling blocks to clear lines. Speed increases as you progress.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#00ffff] font-semibold">$0.01 to play</span>
                <span className="text-xs text-white/40">Coming Soon</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Ready to Play?</h2>
          <p className="text-xl text-white/70 mb-8">
            Connect your wallet and start competing for daily prizes
          </p>
          <Link
            to="/play"
            className={cn(
              'group',
              'inline-flex items-center gap-2',
              'px-10 py-5',
              'rounded-lg',
              'bg-gradient-to-r from-[#00ffff] to-[#ff00ff]',
              'text-black font-bold text-xl',
              'hover:scale-105',
              'hover:shadow-[0_0_40px_rgba(0,255,255,0.7)]',
              'transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]'
            )}
          >
            <GamepadIcon className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            Start Playing Now
          </Link>
        </div>
      </section>
    </div>
  );
}

Home.displayName = 'Home';

export default Home;
