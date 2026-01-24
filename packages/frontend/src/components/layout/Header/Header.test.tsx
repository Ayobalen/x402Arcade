/**
 * Header Component Unit Tests
 *
 * Comprehensive test suite covering rendering, navigation, responsive behavior,
 * and mobile menu interactions for the Header component.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Header } from './Header';

// Mock the wallet store to avoid actual wallet connections in tests
vi.mock('@/stores/walletStore', () => ({
  useWalletStore: vi.fn(() => ({
    address: null,
    chainId: null,
    isConnected: false,
    isConnecting: false,
    error: null,
    connectWallet: vi.fn(),
    disconnect: vi.fn(),
    switchChain: vi.fn(),
  })),
  selectFormattedAddress: vi.fn(() => null),
  REQUIRED_CHAIN_ID: 338,
}));

/**
 * Wrapper component to provide router context for Link components
 */
function HeaderWithRouter(props: React.ComponentProps<typeof Header>) {
  return (
    <MemoryRouter>
      <Header {...props} />
    </MemoryRouter>
  );
}

describe('Header', () => {
  // ============================================================
  // Default Render Tests
  // ============================================================
  describe('default render', () => {
    it('renders header element', () => {
      render(<HeaderWithRouter />);
      const header = screen.getByRole('banner');

      expect(header).toBeInTheDocument();
    });

    it('renders with sticky positioning', () => {
      render(<HeaderWithRouter />);
      const header = screen.getByRole('banner');

      expect(header.className).toContain('sticky');
      expect(header.className).toContain('top-0');
    });

    it('has appropriate z-index for stacking', () => {
      render(<HeaderWithRouter />);
      const header = screen.getByRole('banner');

      expect(header.className).toContain('z-50');
    });

    it('has backdrop blur effect', () => {
      render(<HeaderWithRouter />);
      const header = screen.getByRole('banner');

      expect(header.className).toContain('backdrop-blur-sm');
    });

    it('has correct display name', () => {
      expect(Header.displayName).toBe('Header');
    });
  });

  // ============================================================
  // Logo and Brand Tests
  // ============================================================
  describe('logo and branding', () => {
    it('renders brand logo link', () => {
      render(<HeaderWithRouter />);
      const logoLink = screen.getByRole('link', { name: /x402/i });

      expect(logoLink).toBeInTheDocument();
    });

    it('logo link points to home page', () => {
      render(<HeaderWithRouter />);
      const logoLink = screen.getByRole('link', { name: /x402/i });

      expect(logoLink).toHaveAttribute('href', '/');
    });

    it('renders gamepad icon', () => {
      render(<HeaderWithRouter />);
      const logoLink = screen.getByRole('link', { name: /x402/i });
      const icon = logoLink.querySelector('svg');

      expect(icon).toBeInTheDocument();
    });

    it('shows full brand name on desktop', () => {
      render(<HeaderWithRouter />);

      // The full "x402 Arcade" text should be present (even if hidden on mobile)
      expect(screen.getByText('x402 Arcade')).toBeInTheDocument();
    });
  });

  // ============================================================
  // Navigation Links Tests
  // ============================================================
  describe('navigation links', () => {
    it('renders Play navigation link', () => {
      render(<HeaderWithRouter />);
      const playLink = screen.getByRole('link', { name: /^Play$/i });

      expect(playLink).toBeInTheDocument();
      expect(playLink).toHaveAttribute('href', '/play');
    });

    it('renders Leaderboard navigation link', () => {
      render(<HeaderWithRouter />);
      const leaderboardLink = screen.getByRole('link', { name: /^Leaderboard$/i });

      expect(leaderboardLink).toBeInTheDocument();
      expect(leaderboardLink).toHaveAttribute('href', '/leaderboard');
    });

    it('renders Prizes navigation link', () => {
      render(<HeaderWithRouter />);
      const prizesLink = screen.getByRole('link', { name: /^Prizes$/i });

      expect(prizesLink).toBeInTheDocument();
      expect(prizesLink).toHaveAttribute('href', '/prizes');
    });

    it('renders all three navigation links', () => {
      render(<HeaderWithRouter />);

      expect(screen.getByRole('link', { name: /^Play$/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /^Leaderboard$/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /^Prizes$/i })).toBeInTheDocument();
    });

    it('hides navigation when showNavigation is false', () => {
      render(<HeaderWithRouter showNavigation={false} />);

      expect(screen.queryByRole('link', { name: /^Play$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /^Leaderboard$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /^Prizes$/i })).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // Wallet Section Tests
  // ============================================================
  describe('wallet section', () => {
    it('renders wallet connect button by default', () => {
      render(<HeaderWithRouter />);

      // ConnectButton should render "Connect Wallet" or similar
      const walletButton = screen.getByRole('button', { name: /wallet|install/i });
      expect(walletButton).toBeInTheDocument();
    });

    it('hides wallet section when showWallet is false', () => {
      render(<HeaderWithRouter showWallet={false} />);

      const walletButton = screen.queryByRole('button', { name: /wallet|install/i });
      expect(walletButton).not.toBeInTheDocument();
    });

    it('does not show balance by default', () => {
      render(<HeaderWithRouter />);

      // Balance component typically shows "0.00" or similar
      // Since it's not shown by default, we shouldn't see multiple instances
      const elements = screen.queryAllByText(/0\.00/);
      // Should only be the one in the wallet button (if any), not a separate Balance component
      expect(elements.length).toBeLessThanOrEqual(1);
    });

    it('shows balance when showBalance is true', () => {
      render(<HeaderWithRouter showBalance />);

      // With showBalance=true, there should be a Balance component visible
      // Look for the balance display (formatted as "0.00")
      const balanceElements = screen.getAllByText(/0\.00/);
      // Should have at least one balance display
      expect(balanceElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ============================================================
  // Mobile Menu Button Tests
  // ============================================================
  describe('mobile menu button', () => {
    it('renders mobile menu button', () => {
      render(<HeaderWithRouter />);
      const menuButton = screen.getByRole('button', { name: /menu/i });

      expect(menuButton).toBeInTheDocument();
    });

    it('mobile menu button has correct initial aria-label', () => {
      render(<HeaderWithRouter />);
      const menuButton = screen.getByRole('button', { name: /open menu/i });

      expect(menuButton).toBeInTheDocument();
    });

    it('mobile menu button has aria-expanded attribute', () => {
      render(<HeaderWithRouter />);
      const menuButton = screen.getByRole('button', { name: /menu/i });

      expect(menuButton).toHaveAttribute('aria-expanded');
    });

    it('mobile menu button has aria-controls attribute', () => {
      render(<HeaderWithRouter />);
      const menuButton = screen.getByRole('button', { name: /menu/i });

      expect(menuButton).toHaveAttribute('aria-controls', 'mobile-navigation');
    });

    it('hides mobile menu button when showNavigation is false', () => {
      render(<HeaderWithRouter showNavigation={false} />);

      expect(screen.queryByRole('button', { name: /menu/i })).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // Mobile Menu Interaction Tests
  // ============================================================
  describe('mobile menu interactions', () => {
    beforeEach(() => {
      // Reset any state between tests
      vi.clearAllMocks();
    });

    it('opens mobile menu when hamburger button is clicked', async () => {
      const user = userEvent.setup();
      render(<HeaderWithRouter />);

      const menuButton = screen.getByRole('button', { name: /open menu/i });
      await user.click(menuButton);

      // After clicking, button should say "Close menu"
      expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument();
    });

    it('shows mobile navigation when menu is opened', async () => {
      const user = userEvent.setup();
      render(<HeaderWithRouter />);

      const menuButton = screen.getByRole('button', { name: /open menu/i });
      await user.click(menuButton);

      // Mobile navigation should now be visible (aria-hidden=false)
      const mobileNav = screen.getByRole('navigation', { name: /mobile/i, hidden: true });
      expect(mobileNav).toBeInTheDocument();
    });

    it('updates aria-expanded when menu is toggled', async () => {
      const user = userEvent.setup();
      render(<HeaderWithRouter />);

      const menuButton = screen.getByRole('button', { name: /open menu/i });

      // Initially should be collapsed
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');

      // Click to open
      await user.click(menuButton);
      expect(screen.getByRole('button', { name: /close menu/i })).toHaveAttribute(
        'aria-expanded',
        'true'
      );
    });

    it('closes mobile menu when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<HeaderWithRouter />);

      // Open the menu
      const menuButton = screen.getByRole('button', { name: /open menu/i });
      await user.click(menuButton);

      // Close it
      const closeButton = screen.getByRole('button', { name: /close menu/i });
      await user.click(closeButton);

      // Should be back to "Open menu"
      expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();
    });

    it('closes mobile menu when a navigation link is clicked', async () => {
      const user = userEvent.setup();
      render(<HeaderWithRouter />);

      // Open menu
      const menuButton = screen.getByRole('button', { name: /open menu/i });
      await user.click(menuButton);

      // Click a nav link in mobile menu
      const mobileNav = screen.getByRole('navigation', { name: /mobile/i, hidden: true });
      const playLink = mobileNav.querySelector('a[href="/play"]');
      expect(playLink).toBeInTheDocument();

      if (playLink) {
        await user.click(playLink);
      }

      // Menu should close (aria-expanded back to false)
      const updatedMenuButton = screen.getByRole('button', { name: /open menu/i });
      expect(updatedMenuButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('toggles menu multiple times correctly', async () => {
      const user = userEvent.setup();
      render(<HeaderWithRouter />);

      const menuButton = screen.getByRole('button', { name: /open menu/i });

      // Open
      await user.click(menuButton);
      expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument();

      // Close
      await user.click(screen.getByRole('button', { name: /close menu/i }));
      expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();

      // Open again
      await user.click(screen.getByRole('button', { name: /open menu/i }));
      expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument();
    });
  });

  // ============================================================
  // Custom ClassName Tests
  // ============================================================
  describe('className prop', () => {
    it('applies custom className', () => {
      render(<HeaderWithRouter className="custom-header-class" />);
      const header = screen.getByRole('banner');

      expect(header.className).toContain('custom-header-class');
    });

    it('merges custom className with default styles', () => {
      render(<HeaderWithRouter className="my-custom-class" />);
      const header = screen.getByRole('banner');

      // Should have both custom and default classes
      expect(header.className).toContain('my-custom-class');
      expect(header.className).toContain('sticky');
    });
  });

  // ============================================================
  // Accessibility Tests
  // ============================================================
  describe('accessibility', () => {
    it('uses semantic header element', () => {
      render(<HeaderWithRouter />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('navigation links are keyboard accessible', () => {
      render(<HeaderWithRouter />);
      const playLink = screen.getByRole('link', { name: /^Play$/i });

      playLink.focus();
      expect(playLink).toHaveFocus();
    });

    it('mobile menu button is keyboard accessible', () => {
      render(<HeaderWithRouter />);
      const menuButton = screen.getByRole('button', { name: /menu/i });

      menuButton.focus();
      expect(menuButton).toHaveFocus();
    });

    it('mobile menu has proper aria-hidden state', async () => {
      const user = userEvent.setup();
      render(<HeaderWithRouter />);

      // Initially hidden
      const mobileNav = screen.getByRole('navigation', { name: /mobile/i, hidden: true });
      expect(mobileNav).toHaveAttribute('aria-hidden', 'true');

      // Open menu
      await user.click(screen.getByRole('button', { name: /open menu/i }));

      // Should no longer be hidden
      expect(mobileNav).toHaveAttribute('aria-hidden', 'false');
    });
  });

  // ============================================================
  // Responsive Behavior Tests
  // ============================================================
  describe('responsive behavior', () => {
    it('applies mobile-specific classes for hamburger menu', () => {
      render(<HeaderWithRouter />);
      const menuButton = screen.getByRole('button', { name: /menu/i });

      // Should have md:hidden class (visible on mobile, hidden on desktop)
      expect(menuButton.className).toContain('md:hidden');
    });

    it('mobile navigation exists in DOM even when closed', () => {
      render(<HeaderWithRouter />);

      // Mobile nav should exist but be aria-hidden
      const mobileNav = screen.getByRole('navigation', { name: /mobile/i, hidden: true });
      expect(mobileNav).toBeInTheDocument();
      expect(mobileNav).toHaveAttribute('aria-hidden', 'true');
    });
  });

  // ============================================================
  // Combined Props Tests
  // ============================================================
  describe('combined props', () => {
    it('handles all props together', () => {
      render(
        <HeaderWithRouter
          showNavigation={true}
          showWallet={true}
          showBalance={true}
          className="test-class"
        />
      );

      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
      expect(header.className).toContain('test-class');
      expect(screen.getByRole('link', { name: /^Play$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /wallet|install/i })).toBeInTheDocument();
    });

    it('respects all show/hide flags', () => {
      render(<HeaderWithRouter showNavigation={false} showWallet={false} showBalance={false} />);

      // No navigation links
      expect(screen.queryByRole('link', { name: /^Play$/i })).not.toBeInTheDocument();

      // No wallet button
      expect(screen.queryByRole('button', { name: /wallet|install/i })).not.toBeInTheDocument();

      // Only logo should be present
      expect(screen.getByRole('link', { name: /x402/i })).toBeInTheDocument();
    });
  });
});
