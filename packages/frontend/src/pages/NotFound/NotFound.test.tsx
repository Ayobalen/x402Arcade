/**
 * NotFound (404) Page Integration Tests
 *
 * Tests for the 404 error page component including:
 * - Page rendering with error message
 * - Navigation links back to app
 * - Arcade-themed messaging
 * - Design system compliance
 */

import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '../../../__tests__/utils';
import { NotFound } from './NotFound';

describe('NotFound Page', () => {
  describe('Rendering', () => {
    it('renders the 404 error code', () => {
      renderWithProviders(<NotFound />);

      expect(screen.getByText(/404/i)).toBeInTheDocument();
    });

    it('renders GAME OVER message', () => {
      renderWithProviders(<NotFound />);

      expect(screen.getByText(/GAME OVER/i)).toBeInTheDocument();
    });

    it('renders Page Not Found heading', () => {
      renderWithProviders(<NotFound />);

      expect(screen.getByText(/Page Not Found/i)).toBeInTheDocument();
    });

    it('renders joystick icon with × 0', () => {
      renderWithProviders(<NotFound />);

      expect(screen.getByText(/🕹️/)).toBeInTheDocument();
      expect(screen.getByText(/×/)).toBeInTheDocument();
      expect(screen.getByText(/0/)).toBeInTheDocument();
    });

    it('renders helpful error message', () => {
      renderWithProviders(<NotFound />);

      expect(screen.getByText(/Looks like this page wandered into the void/i)).toBeInTheDocument();
      expect(
        screen.getByText(
          /The arcade machine you're looking for doesn't exist, or it's been unplugged/i
        )
      ).toBeInTheDocument();
    });

    it('renders Continue Playing prompt', () => {
      renderWithProviders(<NotFound />);

      expect(screen.getByText(/Continue Playing\?/i)).toBeInTheDocument();
    });

    it('renders INSERT COIN TO CONTINUE message', () => {
      renderWithProviders(<NotFound />);

      expect(screen.getByText(/INSERT COIN TO CONTINUE/i)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('has Return Home button linking to /', () => {
      renderWithProviders(<NotFound />);

      const link = screen.getByRole('link', { name: /Return Home/i });
      expect(link).toHaveAttribute('href', '/');
    });

    it('has Play Games button linking to /play', () => {
      renderWithProviders(<NotFound />);

      const link = screen.getByRole('link', { name: /Play Games/i });
      expect(link).toHaveAttribute('href', '/play');
    });

    it('has Leaderboard link', () => {
      renderWithProviders(<NotFound />);

      const link = screen.getByRole('link', { name: /^Leaderboard$/i });
      expect(link).toHaveAttribute('href', '/leaderboard');
    });

    it('has Prize Pools link', () => {
      renderWithProviders(<NotFound />);

      const link = screen.getByRole('link', { name: /Prize Pools/i });
      expect(link).toHaveAttribute('href', '/prizes');
    });

    it('has About link', () => {
      renderWithProviders(<NotFound />);

      const link = screen.getByRole('link', { name: /About/i });
      expect(link).toHaveAttribute('href', '/about');
    });

    it('has at least 5 navigation links total', () => {
      renderWithProviders(<NotFound />);

      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Content', () => {
    it('displays arcade-themed error messages', () => {
      renderWithProviders(<NotFound />);

      // Should use arcade/gaming terminology
      expect(screen.getByText(/arcade machine/i)).toBeInTheDocument();
      expect(screen.getByText(/unplugged/i)).toBeInTheDocument();
    });

    it('provides clear call-to-action', () => {
      renderWithProviders(<NotFound />);

      expect(screen.getByText(/Or check out:/i)).toBeInTheDocument();
    });

    it('uses retro arcade styling cues', () => {
      renderWithProviders(<NotFound />);

      // Should have GAME OVER in all caps
      const gameOver = screen.getByText(/GAME OVER/i);
      expect(gameOver.textContent).toMatch(/GAME OVER/);
    });
  });

  describe('Accessibility', () => {
    it('all navigation links are keyboard accessible', () => {
      renderWithProviders(<NotFound />);

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        link.focus();
        expect(link).toHaveFocus();
        link.blur();
      });
    });

    it('primary CTA buttons are prominent', () => {
      renderWithProviders(<NotFound />);

      const returnHome = screen.getByRole('link', { name: /Return Home/i });
      const playGames = screen.getByRole('link', { name: /Play Games/i });

      expect(returnHome).toBeInTheDocument();
      expect(playGames).toBeInTheDocument();
    });

    it('error message is clear and informative', () => {
      renderWithProviders(<NotFound />);

      // Should explain what happened
      expect(screen.getByText(/page wandered into the void/i)).toBeInTheDocument();
      // Should explain why
      expect(screen.getByText(/doesn't exist, or it's been unplugged/i)).toBeInTheDocument();
      // Should provide next steps
      expect(screen.getByText(/Continue Playing/i)).toBeInTheDocument();
    });
  });

  describe('Design System', () => {
    it('uses gradient for 404 text', () => {
      const { container } = renderWithProviders(<NotFound />);

      const errorCode = screen.getByText(/404/i);
      expect(errorCode).toBeInTheDocument();
    });

    it('CTA buttons have proper styling', () => {
      renderWithProviders(<NotFound />);

      const returnHome = screen.getByRole('link', { name: /Return Home/i });
      expect(returnHome).toHaveClass('rounded-lg');
    });

    it('maintains arcade theme throughout', () => {
      renderWithProviders(<NotFound />);

      // Should use arcade terminology and styling
      expect(screen.getByText(/🕹️/)).toBeInTheDocument();
      expect(screen.getByText(/INSERT COIN/i)).toBeInTheDocument();
      expect(screen.getByText(/GAME OVER/i)).toBeInTheDocument();
    });
  });

  describe('User Experience', () => {
    it('provides multiple ways to recover', () => {
      renderWithProviders(<NotFound />);

      // Should have primary CTAs
      expect(screen.getByRole('link', { name: /Return Home/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Play Games/i })).toBeInTheDocument();

      // Should have secondary navigation
      expect(screen.getByRole('link', { name: /Leaderboard/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Prize Pools/i })).toBeInTheDocument();
    });

    it('error message is friendly and on-brand', () => {
      renderWithProviders(<NotFound />);

      // Should use playful, arcade-themed language
      expect(screen.getByText(/wandered into the void/i)).toBeInTheDocument();
      expect(screen.getByText(/unplugged/i)).toBeInTheDocument();
      expect(screen.getByText(/INSERT COIN/i)).toBeInTheDocument();
    });
  });
});
