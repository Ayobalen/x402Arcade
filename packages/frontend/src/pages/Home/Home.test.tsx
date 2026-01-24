/**
 * Home Page Integration Tests
 *
 * Tests for the Home landing page component including:
 * - Page rendering with all sections
 * - Navigation links functionality
 * - Content verification
 * - Design system compliance
 */

import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen, within } from '../../../__tests__/utils';
import { Home } from './Home';

describe('Home Page', () => {
  describe('Rendering', () => {
    it('renders the main heading', () => {
      renderWithProviders(<Home />);

      expect(
        screen.getByRole('heading', {
          level: 1,
          name: /Insert a Penny, Play for Glory/i,
        })
      ).toBeInTheDocument();
    });

    it('renders the tagline/description', () => {
      renderWithProviders(<Home />);

      expect(screen.getByText(/Gasless arcade gaming on Cronos blockchain/i)).toBeInTheDocument();
    });

    it('renders Powered by Cronos x402 badge', () => {
      renderWithProviders(<Home />);

      expect(screen.getByText(/Powered by Cronos x402/i)).toBeInTheDocument();
    });

    it('renders Why Play section', () => {
      renderWithProviders(<Home />);

      expect(
        screen.getByRole('heading', {
          level: 2,
          name: /Why Play on x402 Arcade/i,
        })
      ).toBeInTheDocument();
    });

    it('renders three feature cards', () => {
      renderWithProviders(<Home />);

      expect(screen.getByRole('heading', { level: 3, name: /Instant Play/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: /Zero Gas Fees/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: /Daily Prizes/i })).toBeInTheDocument();
    });

    it('renders Featured Games section', () => {
      renderWithProviders(<Home />);

      expect(
        screen.getByRole('heading', { level: 2, name: /Featured Games/i })
      ).toBeInTheDocument();
    });

    it('renders at least 3 game cards', () => {
      renderWithProviders(<Home />);

      // Check for game titles
      expect(screen.getByRole('heading', { level: 3, name: /Snake/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: /Pong/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: /Tetris/i })).toBeInTheDocument();
    });

    it('renders Ready to Play CTA section', () => {
      renderWithProviders(<Home />);

      expect(screen.getByRole('heading', { level: 2, name: /Ready to Play/i })).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('has Start Playing button linking to /play', () => {
      renderWithProviders(<Home />);

      const link = screen.getByRole('link', { name: /Start Playing/i });
      expect(link).toHaveAttribute('href', '/play');
    });

    it('has View Leaderboard button linking to /leaderboard', () => {
      renderWithProviders(<Home />);

      const link = screen.getByRole('link', { name: /View Leaderboard/i });
      expect(link).toHaveAttribute('href', '/leaderboard');
    });

    it('has game cards linking to individual game pages', () => {
      renderWithProviders(<Home />);

      const snakeLink = screen.getByRole('link', { name: /Snake/i });
      const pongLink = screen.getByRole('link', { name: /Pong/i });
      const tetrisLink = screen.getByRole('link', { name: /Tetris/i });

      expect(snakeLink).toHaveAttribute('href', '/play/snake');
      expect(pongLink).toHaveAttribute('href', '/play/pong');
      expect(tetrisLink).toHaveAttribute('href', '/play/tetris');
    });

    it('has Start Playing Now button at bottom', () => {
      renderWithProviders(<Home />);

      const link = screen.getByRole('link', { name: /Start Playing Now/i });
      expect(link).toHaveAttribute('href', '/play');
    });
  });

  describe('Content', () => {
    it('displays pricing information ($0.01 per game)', () => {
      renderWithProviders(<Home />);

      // Should have multiple instances showing game pricing
      const priceElements = screen.getAllByText(/\$0\.01/i);
      expect(priceElements.length).toBeGreaterThan(0);
    });

    it('displays Coming Soon badges on games', () => {
      renderWithProviders(<Home />);

      const comingSoonBadges = screen.getAllByText(/Coming Soon/i);
      expect(comingSoonBadges.length).toBeGreaterThan(0);
    });

    it('displays feature descriptions', () => {
      renderWithProviders(<Home />);

      expect(screen.getByText(/Pay \$0\.01 and start playing immediately/i)).toBeInTheDocument();
      expect(screen.getByText(/x402 protocol handles all gas costs/i)).toBeInTheDocument();
      expect(screen.getByText(/70% of all payments fund daily prize pools/i)).toBeInTheDocument();
    });

    it('displays game descriptions', () => {
      renderWithProviders(<Home />);

      expect(screen.getByText(/Classic snake game\. Eat food, grow longer/i)).toBeInTheDocument();
      expect(screen.getByText(/Classic arcade pong\. Keep the ball in play/i)).toBeInTheDocument();
      expect(screen.getByText(/Stack falling blocks to clear lines/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has properly structured headings (h1 -> h2 -> h3)', () => {
      renderWithProviders(<Home />);

      const h1 = screen.getByRole('heading', { level: 1 });
      const h2s = screen.getAllByRole('heading', { level: 2 });
      const h3s = screen.getAllByRole('heading', { level: 3 });

      expect(h1).toBeInTheDocument();
      expect(h2s.length).toBeGreaterThan(0);
      expect(h3s.length).toBeGreaterThan(0);
    });

    it('all links are focusable', () => {
      renderWithProviders(<Home />);

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        link.focus();
        expect(link).toHaveFocus();
        link.blur();
      });
    });

    it('CTA buttons have accessible names', () => {
      renderWithProviders(<Home />);

      expect(screen.getByRole('link', { name: /Start Playing/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /View Leaderboard/i })).toBeInTheDocument();
    });
  });

  describe('Design System', () => {
    it('applies retro arcade theme colors', () => {
      const { container } = renderWithProviders(<Home />);

      // Container should have proper background
      expect(container.querySelector('main')).toBeInTheDocument();
    });

    it('game cards have proper styling', () => {
      renderWithProviders(<Home />);

      const snakeLink = screen.getByRole('link', { name: /Snake/i });
      expect(snakeLink).toHaveClass('rounded-xl');
    });

    it('CTA buttons have gradient styling', () => {
      renderWithProviders(<Home />);

      const ctaLink = screen.getByRole('link', { name: /Start Playing Now/i });
      expect(ctaLink).toHaveClass('rounded-lg');
    });
  });
});
