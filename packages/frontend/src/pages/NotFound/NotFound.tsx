/**
 * NotFound (404) Page Component
 *
 * Displays when user navigates to an invalid route with:
 * - 404 error message with arcade theme
 * - Retro game over styled illustration
 * - Helpful navigation options back to valid pages
 * - Neon glowing effects matching the arcade aesthetic
 */

import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * Gamepad icon for navigation buttons
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
 * Home icon for home button
 */
function HomeIcon({ className }: { className?: string }) {
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
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
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
 * NotFound Page Component
 */
export function NotFound() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl mx-auto text-center">
        {/* Arcade-themed 404 Illustration */}
        <div className="mb-8">
          {/* Game Over Text - Retro Pixel Style */}
          <div className="inline-block">
            <div
              className={cn(
                'text-8xl md:text-9xl font-bold mb-4',
                'bg-gradient-to-r from-[#ff00ff] via-[#00ffff] to-[#ff00ff]',
                'bg-clip-text text-transparent',
                'animate-pulse'
              )}
              style={{
                fontFamily: "'Press Start 2P', 'Courier New', monospace",
              }}
            >
              404
            </div>
          </div>

          {/* Game Over Subtitle */}
          <div className="mb-6">
            <p
              className="text-2xl md:text-3xl font-bold text-[#ff00ff] mb-2"
              style={{
                fontFamily: "'Press Start 2P', 'Courier New', monospace",
                textShadow: '0 0 20px rgba(255, 0, 255, 0.5)',
              }}
            >
              GAME OVER
            </p>
            <p className="text-lg text-white/80">Page Not Found</p>
          </div>

          {/* Arcade Token Illustration */}
          <div className="flex justify-center items-center gap-2 mb-8">
            <span className="text-6xl">🕹️</span>
            <span className="text-4xl text-white/40">×</span>
            <span className="text-6xl">0</span>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-12">
          <p className="text-xl text-white/70 mb-4 leading-relaxed">
            Looks like this page wandered into the void.
          </p>
          <p className="text-lg text-white/60 leading-relaxed">
            The arcade machine you're looking for doesn't exist, or it's been unplugged.
          </p>
        </div>

        {/* Navigation Options */}
        <div className="space-y-4">
          <p className="text-sm text-white/50 uppercase tracking-wider mb-6">Continue Playing?</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Home Button */}
            <Link
              to="/"
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
              <HomeIcon className="w-5 h-5" />
              Return Home
            </Link>

            {/* Play Games Button */}
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
                'transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]'
              )}
            >
              <GamepadIcon className="w-5 h-5" />
              Play Games
            </Link>
          </div>

          {/* Additional Links */}
          <div className="mt-8 pt-8 border-t border-[#2d2d4a]">
            <p className="text-sm text-white/50 mb-4">Or check out:</p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <Link
                to="/leaderboard"
                className="inline-flex items-center gap-1.5 text-white/60 hover:text-[#00ffff] transition-colors"
              >
                <TrophyIcon className="w-4 h-4" />
                Leaderboard
              </Link>
              <Link to="/prizes" className="text-white/60 hover:text-[#00ffff] transition-colors">
                Prize Pools
              </Link>
              <Link to="/about" className="text-white/60 hover:text-[#00ffff] transition-colors">
                About
              </Link>
            </div>
          </div>
        </div>

        {/* Insert Coin Message */}
        <div className="mt-12 pt-8 border-t border-[#2d2d4a]">
          <p
            className="text-sm text-white/40 animate-pulse"
            style={{
              fontFamily: "'Press Start 2P', 'Courier New', monospace",
            }}
          >
            INSERT COIN TO CONTINUE
          </p>
        </div>
      </div>
    </div>
  );
}

NotFound.displayName = 'NotFound';

export default NotFound;
