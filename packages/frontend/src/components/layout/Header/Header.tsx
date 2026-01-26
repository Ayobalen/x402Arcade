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

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ConnectButton } from '@/components/wallet';
import { Balance } from '@/components/wallet/Balance';
import { useOnboardingStore } from '@/stores';
import { HelpCircle, Keyboard, Settings } from 'lucide-react';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';
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
 * Hamburger menu icon that animates to X when open
 */
function MenuIcon({ isOpen, className }: { isOpen: boolean; className?: string }) {
  return (
    <svg
      className={cn('w-6 h-6', className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Top line - rotates to form top of X */}
      <line
        x1="3"
        y1="6"
        x2="21"
        y2="6"
        className={cn(
          'origin-center transition-all duration-300',
          isOpen && 'rotate-45 translate-y-[6px]'
        )}
        style={{
          transformOrigin: '12px 6px',
        }}
      />
      {/* Middle line - fades out when open */}
      <line
        x1="3"
        y1="12"
        x2="21"
        y2="12"
        className={cn('transition-opacity duration-300', isOpen && 'opacity-0')}
      />
      {/* Bottom line - rotates to form bottom of X */}
      <line
        x1="3"
        y1="18"
        x2="21"
        y2="18"
        className={cn(
          'origin-center transition-all duration-300',
          isOpen && '-rotate-45 -translate-y-[6px]'
        )}
        style={{
          transformOrigin: '12px 18px',
        }}
      />
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
  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Onboarding store for help modals
  const { openHelp, openKeyboardShortcuts } = useOnboardingStore();

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  // Close mobile menu (e.g., when a link is clicked)
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

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

      {/* Center: Desktop Navigation */}
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
          <Link
            to="/settings"
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
            Settings
          </Link>
        </nav>
      )}

      {/* Mobile Menu Button - Shows on small screens */}
      {showNavigation && (
        <button
          onClick={toggleMobileMenu}
          className={cn(
            // Layout
            'md:hidden',
            'flex items-center justify-center',
            'w-10 h-10',
            'ml-auto mr-2',
            // Styling
            'text-[#00ffff]',
            'hover:text-[#00ffff]/80',
            'transition-colors duration-150',
            // Focus styles
            'focus:outline-none',
            'focus-visible:ring-2',
            'focus-visible:ring-[#00ffff]/50',
            'rounded-md'
          )}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
        >
          <MenuIcon isOpen={isMobileMenuOpen} />
        </button>
      )}

      {/* Right: Theme, Help, Wallet & Balance */}
      <div className="flex items-center gap-2">
        {/* Theme Switcher - Compact Mode */}
        <ThemeSwitcher mode="compact" />

        {/* Help Button */}
        <button
          onClick={openHelp}
          className={cn(
            'p-2',
            'text-white/60 hover:text-cyan-400',
            'transition-colors duration-150',
            'rounded-lg',
            'hover:bg-cyan-500/10'
          )}
          aria-label="Open help"
          title="Help & FAQ (H)"
        >
          <HelpCircle size={20} />
        </button>

        {/* Keyboard Shortcuts Button */}
        <button
          onClick={openKeyboardShortcuts}
          className={cn(
            'p-2',
            'text-white/60 hover:text-cyan-400',
            'transition-colors duration-150',
            'rounded-lg',
            'hover:bg-cyan-500/10'
          )}
          aria-label="Keyboard shortcuts"
          title="Keyboard Shortcuts (?)"
        >
          <Keyboard size={20} />
        </button>

        {showWallet && (
          <div className="flex items-center gap-3 ml-2">
            {showBalance && <Balance />}
            <ConnectButton />
          </div>
        )}
      </div>

      {/* Mobile Navigation Menu */}
      {showNavigation && (
        <nav
          id="mobile-navigation"
          className={cn(
            // Layout
            'md:hidden',
            'absolute top-full left-0 right-0',
            'w-full',
            // Styling
            'bg-[#0a0a0a]/98',
            'border-b border-[#2d2d4a]',
            'backdrop-blur-sm',
            'shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)]',
            // Animation
            'transition-all duration-300 ease-in-out',
            'origin-top',
            // Show/hide based on state
            isMobileMenuOpen
              ? 'opacity-100 scale-y-100 visible'
              : 'opacity-0 scale-y-95 invisible pointer-events-none'
          )}
          aria-hidden={!isMobileMenuOpen}
        >
          <div className="flex flex-col py-4 px-4 gap-1">
            <Link
              to="/play"
              onClick={closeMobileMenu}
              className={cn(
                'px-4 py-3',
                'text-base font-medium',
                'text-white/80 hover:text-[#00ffff]',
                'hover:bg-[#00ffff]/5',
                'rounded-lg',
                'transition-all duration-150',
                // Neon glow on hover
                'hover:shadow-[0_0_8px_rgba(0,255,255,0.2)]'
              )}
            >
              Play
            </Link>
            <Link
              to="/leaderboard"
              onClick={closeMobileMenu}
              className={cn(
                'px-4 py-3',
                'text-base font-medium',
                'text-white/80 hover:text-[#00ffff]',
                'hover:bg-[#00ffff]/5',
                'rounded-lg',
                'transition-all duration-150',
                'hover:shadow-[0_0_8px_rgba(0,255,255,0.2)]'
              )}
            >
              Leaderboard
            </Link>
            <Link
              to="/prizes"
              onClick={closeMobileMenu}
              className={cn(
                'px-4 py-3',
                'text-base font-medium',
                'text-white/80 hover:text-[#00ffff]',
                'hover:bg-[#00ffff]/5',
                'rounded-lg',
                'transition-all duration-150',
                'hover:shadow-[0_0_8px_rgba(0,255,255,0.2)]'
              )}
            >
              Prizes
            </Link>
            <Link
              to="/settings"
              onClick={closeMobileMenu}
              className={cn(
                'px-4 py-3',
                'text-base font-medium',
                'text-white/80 hover:text-[#00ffff]',
                'hover:bg-[#00ffff]/5',
                'rounded-lg',
                'transition-all duration-150',
                'hover:shadow-[0_0_8px_rgba(0,255,255,0.2)]',
                'flex items-center gap-2'
              )}
            >
              <Settings size={18} />
              Settings
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

Header.displayName = 'Header';

export default Header;
