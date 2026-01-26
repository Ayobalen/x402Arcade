/**
 * Footer Component
 *
 * Main footer that appears at the bottom of every page.
 * Features:
 * - Navigation links (Play, Leaderboard, Prizes, About)
 * - Social media links (Twitter, Discord, GitHub)
 * - Copyright and legal text
 * - Retro arcade theme styling
 *
 * @example
 * <Footer />
 *
 * @example
 * <Footer showSocial={false} />
 */

import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { FooterProps } from './Footer.types';

/**
 * Twitter/X icon
 */
function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/**
 * Discord icon
 */
function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

/**
 * GitHub icon
 */
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

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
 * Footer Component
 */
export function Footer({
  className,
  showSocial = true,
  showNavigation = true,
  showCopyright = true,
}: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={cn(
        // Layout
        'w-full',
        'px-4 py-8 md:py-12',
        'mt-auto', // Push to bottom with flex layout
        // Styling - Theme-aware
        'bg-[var(--color-bg-main)]',
        'border-t border-[var(--color-border)]',
        // Neon glow effect
        'shadow-[0_-1px_0_0_var(--color-primary-glow)]',
        className
      )}
    >
      <div className="max-w-7xl mx-auto">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Left: Branding and tagline */}
          <div className="flex flex-col gap-4">
            <Link
              to="/"
              className={cn(
                'flex items-center gap-2',
                'text-[var(--color-primary)]',
                'hover:text-[var(--color-primary-hover)]',
                'transition-colors duration-150',
                'group',
                'w-fit'
              )}
            >
              <GamepadIcon
                className={cn(
                  'w-6 h-6',
                  'group-hover:scale-110',
                  'transition-transform duration-150'
                )}
              />
              <span className="font-bold text-lg">x402 Arcade</span>
            </Link>
            <p className="text-sm text-[var(--color-text-muted)] max-w-xs">
              Insert a Penny, Play for Glory. Gasless arcade gaming on Cronos blockchain with
              micropayments.
            </p>
          </div>

          {/* Center: Navigation links */}
          {showNavigation && (
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                Navigate
              </h3>
              <nav className="flex flex-col gap-2">
                <Link
                  to="/play"
                  className={cn(
                    'text-sm text-[var(--color-text-muted)]',
                    'hover:text-[var(--color-primary)]',
                    'transition-colors duration-150',
                    'w-fit'
                  )}
                >
                  Play Games
                </Link>
                <Link
                  to="/leaderboard"
                  className={cn(
                    'text-sm text-[var(--color-text-muted)]',
                    'hover:text-[var(--color-primary)]',
                    'transition-colors duration-150',
                    'w-fit'
                  )}
                >
                  Leaderboard
                </Link>
                <Link
                  to="/prizes"
                  className={cn(
                    'text-sm text-[var(--color-text-muted)]',
                    'hover:text-[var(--color-primary)]',
                    'transition-colors duration-150',
                    'w-fit'
                  )}
                >
                  Prize Pools
                </Link>
                <Link
                  to="/about"
                  className={cn(
                    'text-sm text-[var(--color-text-muted)]',
                    'hover:text-[var(--color-primary)]',
                    'transition-colors duration-150',
                    'w-fit'
                  )}
                >
                  About
                </Link>
              </nav>
            </div>
          )}

          {/* Right: Social links */}
          {showSocial && (
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                Connect
              </h3>
              <div className="flex items-center gap-4">
                <a
                  href="https://twitter.com/x402arcade"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'text-[var(--color-text-muted)]',
                    'hover:text-[var(--color-primary)]',
                    'transition-all duration-150',
                    'hover:scale-110',
                    // Neon glow on hover
                    'hover:drop-shadow-[0_0_8px_var(--color-primary-glow)]'
                  )}
                  aria-label="Follow us on Twitter"
                >
                  <TwitterIcon className="w-5 h-5" />
                </a>
                <a
                  href="https://discord.gg/x402arcade"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'text-[var(--color-text-muted)]',
                    'hover:text-[var(--color-primary)]',
                    'transition-all duration-150',
                    'hover:scale-110',
                    'hover:drop-shadow-[0_0_8px_var(--color-primary-glow)]'
                  )}
                  aria-label="Join our Discord"
                >
                  <DiscordIcon className="w-5 h-5" />
                </a>
                <a
                  href="https://github.com/x402arcade"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'text-[var(--color-text-muted)]',
                    'hover:text-[var(--color-primary)]',
                    'transition-all duration-150',
                    'hover:scale-110',
                    'hover:drop-shadow-[0_0_8px_var(--color-primary-glow)]'
                  )}
                  aria-label="View source on GitHub"
                >
                  <GitHubIcon className="w-5 h-5" />
                </a>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-2">
                Built with ❤️ for the Cronos x402 Hackathon
              </p>
            </div>
          )}
        </div>

        {/* Bottom: Copyright and legal */}
        {showCopyright && (
          <div
            className={cn(
              'pt-8',
              'border-t border-[var(--color-border)]/50',
              'flex flex-col md:flex-row items-center justify-between gap-4',
              'text-xs text-[var(--color-text-muted)]'
            )}
          >
            <p>© {currentYear} x402 Arcade. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link
                to="/terms"
                className="hover:text-[var(--color-primary)] transition-colors duration-150"
              >
                Terms of Service
              </Link>
              <Link
                to="/privacy"
                className="hover:text-[var(--color-primary)] transition-colors duration-150"
              >
                Privacy Policy
              </Link>
              <Link
                to="/docs"
                className="hover:text-[var(--color-primary)] transition-colors duration-150"
              >
                Documentation
              </Link>
              <Link
                to="/faq"
                className="hover:text-[var(--color-primary)] transition-colors duration-150"
              >
                FAQ
              </Link>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
}

Footer.displayName = 'Footer';

export default Footer;
