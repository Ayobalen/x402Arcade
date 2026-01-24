/**
 * Header Component
 *
 * Main navigation header that appears at the top of every page.
 * Features:
 * - x402 Arcade branding
 * - Navigation links (Play, Leaderboard, Prizes)
 * - Wallet connection button
 * - Optional balance display
 * - Retro arcade theme styling
 *
 * @example
 * <Header />
 *
 * @example
 * <Header showBalance />
 */

import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import { Balance } from '@/components/wallet/Balance';
import type { HeaderProps } from './Header.types';

/**
 * Gamepad icon for branding
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
    >
      <path d="M6 12h4" />
      <path d="M14 12h.01" />
      <path d="M17 12h.01" />
      <rect x="2" y="6" width="20" height="12" rx="2" />
    </svg>
  );
}

/**
 * Header Component
 */
export function Header({
  className,
  showNavigation = true,
  showWallet = true,
  showBalance = false,
}: HeaderProps) {
  return (
    <header
      className={cn(
        // Layout
        'sticky top-0 z-50',
        'w-full',
        'px-4 py-3',
        'flex items-center justify-between gap-4',
        // Styling - Retro arcade theme
        'bg-[#0a0a0a]/95',
        'border-b border-[#2d2d4a]',
        // Backdrop blur for modern feel
        'backdrop-blur-sm',
        // Neon glow effect
        'shadow-[0_1px_0_0_rgba(0,255,255,0.1)]',
        className
      )}
    >
      {/* Left: Branding */}
      <Link
        to="/"
        className={cn(
          'flex items-center gap-2',
          'text-[#00ffff] hover:text-[#00ffff]/80',
          'transition-colors duration-150',
          'group'
        )}
      >
        <GamepadIcon
          className={cn('w-6 h-6', 'group-hover:scale-110', 'transition-transform duration-150')}
        />
        <span className="font-bold text-lg hidden sm:inline">x402 Arcade</span>
        <span className="font-bold text-lg sm:hidden">x402</span>
      </Link>

      {/* Center: Navigation */}
      {showNavigation && (
        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/play"
            className={cn(
              'text-sm font-medium',
              'text-white/80 hover:text-[#00ffff]',
              'transition-colors duration-150',
              'relative',
              // Hover underline effect
              'after:absolute after:bottom-[-4px] after:left-0 after:right-0',
              'after:h-[2px] after:bg-[#00ffff]',
              'after:scale-x-0 hover:after:scale-x-100',
              'after:transition-transform after:duration-150'
            )}
          >
            Play
          </Link>
          <Link
            to="/leaderboard"
            className={cn(
              'text-sm font-medium',
              'text-white/80 hover:text-[#00ffff]',
              'transition-colors duration-150',
              'relative',
              'after:absolute after:bottom-[-4px] after:left-0 after:right-0',
              'after:h-[2px] after:bg-[#00ffff]',
              'after:scale-x-0 hover:after:scale-x-100',
              'after:transition-transform after:duration-150'
            )}
          >
            Leaderboard
          </Link>
          <Link
            to="/prizes"
            className={cn(
              'text-sm font-medium',
              'text-white/80 hover:text-[#00ffff]',
              'transition-colors duration-150',
              'relative',
              'after:absolute after:bottom-[-4px] after:left-0 after:right-0',
              'after:h-[2px] after:bg-[#00ffff]',
              'after:scale-x-0 hover:after:scale-x-100',
              'after:transition-transform after:duration-150'
            )}
          >
            Prizes
          </Link>
        </nav>
      )}

      {/* Right: Wallet & Balance */}
      {showWallet && (
        <div className="flex items-center gap-3">
          {showBalance && <Balance />}
          <ConnectButton />
        </div>
      )}
    </header>
  );
}

Header.displayName = 'Header';

export default Header;
