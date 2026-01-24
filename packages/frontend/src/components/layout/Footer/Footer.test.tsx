/**
 * Footer Component Unit Tests
 *
 * Tests cover:
 * - Default rendering and styling
 * - Navigation links
 * - Social media links
 * - Legal/footer links
 * - Conditional rendering (props)
 * - Link attributes (href, target, rel)
 * - Accessibility (aria-labels, semantic HTML)
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Footer } from './Footer';

/**
 * Helper to render Footer with Router context
 */
const renderFooter = (props = {}) => {
  return render(
    <MemoryRouter>
      <Footer {...props} />
    </MemoryRouter>
  );
};

describe('Footer Component', () => {
  describe('Default Rendering', () => {
    it('should render without crashing', () => {
      renderFooter();
      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();
    });

    it('should use semantic footer element', () => {
      renderFooter();
      const footer = screen.getByRole('contentinfo');
      expect(footer.tagName).toBe('FOOTER');
    });

    it('should have correct base styling classes', () => {
      renderFooter();
      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveClass('w-full');
      expect(footer).toHaveClass('bg-[#0a0a0a]');
      expect(footer).toHaveClass('border-t');
    });

    it('should display copyright text with current year', () => {
      renderFooter();
      const currentYear = new Date().getFullYear();
      expect(
        screen.getByText(`© ${currentYear} x402 Arcade. All rights reserved.`)
      ).toBeInTheDocument();
    });

    it('should display branding tagline', () => {
      renderFooter();
      expect(
        screen.getByText(/Insert a Penny, Play for Glory. Gasless arcade gaming/)
      ).toBeInTheDocument();
    });

    it('should display hackathon attribution', () => {
      renderFooter();
      expect(screen.getByText(/Built with ❤️ for the Cronos x402 Hackathon/)).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('should render all navigation links by default', () => {
      renderFooter();
      expect(screen.getByRole('link', { name: /Play Games/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Leaderboard/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Prize Pools/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /About/i })).toBeInTheDocument();
    });

    it('should have correct navigation link paths', () => {
      renderFooter();
      expect(screen.getByRole('link', { name: /Play Games/i })).toHaveAttribute('href', '/play');
      expect(screen.getByRole('link', { name: /Leaderboard/i })).toHaveAttribute(
        'href',
        '/leaderboard'
      );
      expect(screen.getByRole('link', { name: /Prize Pools/i })).toHaveAttribute('href', '/prizes');
      expect(screen.getByRole('link', { name: /About/i })).toHaveAttribute('href', '/about');
    });

    it('should hide navigation links when showNavigation is false', () => {
      renderFooter({ showNavigation: false });
      expect(screen.queryByRole('link', { name: /Play Games/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /Leaderboard/i })).not.toBeInTheDocument();
    });

    it('should display "Navigate" section heading', () => {
      renderFooter();
      expect(screen.getByRole('heading', { name: /Navigate/i, level: 3 })).toBeInTheDocument();
    });
  });

  describe('Social Media Links', () => {
    it('should render all social links by default', () => {
      renderFooter();
      expect(screen.getByRole('link', { name: /Follow us on Twitter/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Join our Discord/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /View source on GitHub/i })).toBeInTheDocument();
    });

    it('should have correct social link URLs', () => {
      renderFooter();
      expect(screen.getByRole('link', { name: /Follow us on Twitter/i })).toHaveAttribute(
        'href',
        'https://twitter.com/x402arcade'
      );
      expect(screen.getByRole('link', { name: /Join our Discord/i })).toHaveAttribute(
        'href',
        'https://discord.gg/x402arcade'
      );
      expect(screen.getByRole('link', { name: /View source on GitHub/i })).toHaveAttribute(
        'href',
        'https://github.com/x402arcade'
      );
    });

    it('should open social links in new tab', () => {
      renderFooter();
      const twitterLink = screen.getByRole('link', { name: /Follow us on Twitter/i });
      const discordLink = screen.getByRole('link', { name: /Join our Discord/i });
      const githubLink = screen.getByRole('link', { name: /View source on GitHub/i });

      expect(twitterLink).toHaveAttribute('target', '_blank');
      expect(discordLink).toHaveAttribute('target', '_blank');
      expect(githubLink).toHaveAttribute('target', '_blank');
    });

    it('should have security attributes on external links', () => {
      renderFooter();
      const twitterLink = screen.getByRole('link', { name: /Follow us on Twitter/i });
      const discordLink = screen.getByRole('link', { name: /Join our Discord/i });
      const githubLink = screen.getByRole('link', { name: /View source on GitHub/i });

      expect(twitterLink).toHaveAttribute('rel', 'noopener noreferrer');
      expect(discordLink).toHaveAttribute('rel', 'noopener noreferrer');
      expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should hide social links when showSocial is false', () => {
      renderFooter({ showSocial: false });
      expect(screen.queryByRole('link', { name: /Follow us on Twitter/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /Join our Discord/i })).not.toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: /View source on GitHub/i })
      ).not.toBeInTheDocument();
    });

    it('should display "Connect" section heading', () => {
      renderFooter();
      expect(screen.getByRole('heading', { name: /Connect/i, level: 3 })).toBeInTheDocument();
    });

    it('should have aria-labels for accessibility', () => {
      renderFooter();
      expect(screen.getByLabelText(/Follow us on Twitter/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Join our Discord/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/View source on GitHub/i)).toBeInTheDocument();
    });
  });

  describe('Legal/Footer Links', () => {
    it('should render all legal links by default', () => {
      renderFooter();
      expect(screen.getByRole('link', { name: /Terms of Service/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Privacy Policy/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Documentation/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /FAQ/i })).toBeInTheDocument();
    });

    it('should have correct legal link paths', () => {
      renderFooter();
      expect(screen.getByRole('link', { name: /Terms of Service/i })).toHaveAttribute(
        'href',
        '/terms'
      );
      expect(screen.getByRole('link', { name: /Privacy Policy/i })).toHaveAttribute(
        'href',
        '/privacy'
      );
      expect(screen.getByRole('link', { name: /Documentation/i })).toHaveAttribute('href', '/docs');
      expect(screen.getByRole('link', { name: /FAQ/i })).toHaveAttribute('href', '/faq');
    });

    it('should hide copyright section when showCopyright is false', () => {
      renderFooter({ showCopyright: false });
      const currentYear = new Date().getFullYear();
      expect(
        screen.queryByText(`© ${currentYear} x402 Arcade. All rights reserved.`)
      ).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /Terms of Service/i })).not.toBeInTheDocument();
    });
  });

  describe('Branding Section', () => {
    it('should render x402 Arcade logo link', () => {
      renderFooter();
      const logoLinks = screen.getAllByRole('link', { name: /x402 Arcade/i });
      // Find the one in the footer (not header)
      const footerLogo = logoLinks.find((link) => link.closest('footer'));
      expect(footerLogo).toBeInTheDocument();
      expect(footerLogo).toHaveAttribute('href', '/');
    });

    it('should render gamepad icon in branding', () => {
      renderFooter();
      const footer = screen.getByRole('contentinfo');
      const svgs = footer.querySelectorAll('svg');
      // Should have SVG icons (gamepad + 3 social icons)
      expect(svgs.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Conditional Rendering', () => {
    it('should show all sections by default', () => {
      renderFooter();
      expect(screen.getByRole('heading', { name: /Navigate/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Connect/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Terms of Service/i })).toBeInTheDocument();
    });

    it('should hide navigation when showNavigation is false', () => {
      renderFooter({ showNavigation: false });
      expect(screen.queryByRole('heading', { name: /Navigate/i })).not.toBeInTheDocument();
    });

    it('should hide social links when showSocial is false', () => {
      renderFooter({ showSocial: false });
      expect(screen.queryByRole('heading', { name: /Connect/i })).not.toBeInTheDocument();
    });

    it('should hide copyright when showCopyright is false', () => {
      renderFooter({ showCopyright: false });
      expect(screen.queryByRole('link', { name: /Terms of Service/i })).not.toBeInTheDocument();
    });

    it('should support all sections disabled', () => {
      renderFooter({
        showNavigation: false,
        showSocial: false,
        showCopyright: false,
      });
      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();
      // Still shows branding
      expect(screen.getByText(/Insert a Penny, Play for Glory/)).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should accept and merge custom className', () => {
      renderFooter({ className: 'custom-footer-class' });
      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveClass('custom-footer-class');
      // Should still have base classes
      expect(footer).toHaveClass('w-full');
    });
  });

  describe('Accessibility', () => {
    it('should use semantic footer element', () => {
      renderFooter();
      const footer = document.querySelector('footer');
      expect(footer).toBeInTheDocument();
    });

    it('should have navigation landmark for nav links', () => {
      renderFooter();
      const navs = screen.getAllByRole('navigation');
      // Should have navigation in footer (and possibly in header if Layout is involved)
      expect(navs.length).toBeGreaterThanOrEqual(1);
    });

    it('should have proper heading hierarchy', () => {
      renderFooter();
      const h3Headings = screen.getAllByRole('heading', { level: 3 });
      expect(h3Headings.length).toBeGreaterThanOrEqual(2); // Navigate + Connect
    });

    it('should have descriptive aria-labels on social links', () => {
      renderFooter();
      expect(screen.getByLabelText(/Follow us on Twitter/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Join our Discord/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/View source on GitHub/i)).toBeInTheDocument();
    });
  });

  describe('Link Behavior', () => {
    it('should have internal navigation links as React Router Links', () => {
      renderFooter();
      const playLink = screen.getByRole('link', { name: /Play Games/i });
      // React Router Links don't have target="_blank"
      expect(playLink).not.toHaveAttribute('target', '_blank');
    });

    it('should have external social links with target="_blank"', () => {
      renderFooter();
      const twitterLink = screen.getByRole('link', { name: /Follow us on Twitter/i });
      expect(twitterLink).toHaveAttribute('target', '_blank');
      expect(twitterLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should render all required navigation links', () => {
      renderFooter();
      const navigationLinks = ['Play Games', 'Leaderboard', 'Prize Pools', 'About'];

      navigationLinks.forEach((linkText) => {
        expect(screen.getByRole('link', { name: new RegExp(linkText, 'i') })).toBeInTheDocument();
      });
    });

    it('should render all required legal links', () => {
      renderFooter();
      const legalLinks = ['Terms of Service', 'Privacy Policy', 'Documentation', 'FAQ'];

      legalLinks.forEach((linkText) => {
        expect(screen.getByRole('link', { name: new RegExp(linkText, 'i') })).toBeInTheDocument();
      });
    });
  });

  describe('Content Verification', () => {
    it('should display correct tagline text', () => {
      renderFooter();
      expect(
        screen.getByText(
          /Insert a Penny, Play for Glory. Gasless arcade gaming on Cronos blockchain with micropayments./
        )
      ).toBeInTheDocument();
    });

    it('should display hackathon credit', () => {
      renderFooter();
      expect(screen.getByText(/Built with ❤️ for the Cronos x402 Hackathon/)).toBeInTheDocument();
    });

    it('should display current year in copyright', () => {
      renderFooter();
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`© ${currentYear}`, 'i'))).toBeInTheDocument();
    });
  });
});
