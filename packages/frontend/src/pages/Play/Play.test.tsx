/**
 * Play Page Integration Tests
 *
 * Tests for the Play (game selection) page component including:
 * - Page rendering with game grid
 * - Filter and sort functionality
 * - Game card links
 * - Content verification
 */

import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '../../../__tests__/utils';
import { Play } from './Play';

describe('Play Page', () => {
  describe('Rendering', () => {
    it('renders the main heading', () => {
      renderWithProviders(<Play />);

      expect(
        screen.getByRole('heading', { level: 1, name: /Choose Your Game/i })
      ).toBeInTheDocument();
    });

    it('renders the description', () => {
      renderWithProviders(<Play />);

      expect(screen.getByText(/Select a game to play\. Pay with USDC/i)).toBeInTheDocument();
    });

    it('renders filter buttons', () => {
      renderWithProviders(<Play />);

      expect(screen.getByRole('button', { name: /All Games/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Available/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Coming Soon/i })).toBeInTheDocument();
    });

    it('renders sort dropdown', () => {
      renderWithProviders(<Play />);

      const sortDropdown = screen.getByRole('combobox');
      expect(sortDropdown).toBeInTheDocument();
      expect(sortDropdown).toHaveAccessibleName(/Sort by/i);
    });

    it('renders all 5 game cards', () => {
      renderWithProviders(<Play />);

      expect(screen.getByRole('heading', { level: 3, name: /^Snake$/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: /^Pong$/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: /^Tetris$/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: /^Breakout$/i })).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 3, name: /Space Invaders/i })
      ).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('game cards link to individual game pages', () => {
      renderWithProviders(<Play />);

      const snakeLink = screen.getByRole('link', { name: /Snake/i });
      const pongLink = screen.getByRole('link', { name: /Pong/i });
      const tetrisLink = screen.getByRole('link', { name: /Tetris/i });
      const breakoutLink = screen.getByRole('link', { name: /Breakout/i });
      const spaceInvadersLink = screen.getByRole('link', {
        name: /Space Invaders/i,
      });

      expect(snakeLink).toHaveAttribute('href', '/play/snake');
      expect(pongLink).toHaveAttribute('href', '/play/pong');
      expect(tetrisLink).toHaveAttribute('href', '/play/tetris');
      expect(breakoutLink).toHaveAttribute('href', '/play/breakout');
      expect(spaceInvadersLink).toHaveAttribute('href', '/play/space-invaders');
    });
  });

  describe('Content', () => {
    it('displays game pricing', () => {
      renderWithProviders(<Play />);

      const priceElements = screen.getAllByText(/\$0\.01 to play/i);
      expect(priceElements.length).toBeGreaterThan(0);
    });

    it('displays Coming Soon badges', () => {
      renderWithProviders(<Play />);

      const comingSoonBadges = screen.getAllByText(/Coming Soon/i);
      expect(comingSoonBadges.length).toBeGreaterThanOrEqual(5);
    });

    it('displays game descriptions', () => {
      renderWithProviders(<Play />);

      expect(screen.getByText(/Classic snake game\. Eat food, grow longer/i)).toBeInTheDocument();
      expect(screen.getByText(/Classic arcade pong\. Keep the ball in play/i)).toBeInTheDocument();
      expect(screen.getByText(/Stack falling blocks to clear lines/i)).toBeInTheDocument();
      expect(screen.getByText(/Break all the bricks with your paddle/i)).toBeInTheDocument();
      expect(screen.getByText(/Defend Earth from alien invaders/i)).toBeInTheDocument();
    });

    it('displays game count in filter buttons', () => {
      renderWithProviders(<Play />);

      expect(screen.getByText(/All Games \(5\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Available \(0\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Coming Soon \(5\)/i)).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('sort dropdown has Name (A-Z) option', () => {
      renderWithProviders(<Play />);

      const sortDropdown = screen.getByRole('combobox');
      expect(sortDropdown).toContainHTML('Name (A-Z)');
    });

    it('sort dropdown has Price (Low to High) option', () => {
      renderWithProviders(<Play />);

      const sortDropdown = screen.getByRole('combobox');
      expect(sortDropdown).toContainHTML('Price (Low to High)');
    });
  });

  describe('Accessibility', () => {
    it('has properly structured headings', () => {
      renderWithProviders(<Play />);

      const h1 = screen.getByRole('heading', { level: 1 });
      const h3s = screen.getAllByRole('heading', { level: 3 });

      expect(h1).toBeInTheDocument();
      expect(h3s.length).toBeGreaterThanOrEqual(5);
    });

    it('all game cards are keyboard accessible', () => {
      renderWithProviders(<Play />);

      const gameLinks = screen.getAllByRole('link');
      gameLinks.forEach((link) => {
        link.focus();
        expect(link).toHaveFocus();
        link.blur();
      });
    });

    it('filter buttons are keyboard accessible', () => {
      renderWithProviders(<Play />);

      const filterButtons = screen.getAllByRole('button');
      filterButtons.forEach((button) => {
        button.focus();
        expect(button).toHaveFocus();
        button.blur();
      });
    });

    it('sort dropdown is keyboard accessible', () => {
      renderWithProviders(<Play />);

      const sortDropdown = screen.getByRole('combobox');
      sortDropdown.focus();
      expect(sortDropdown).toHaveFocus();
    });
  });

  describe('Design System', () => {
    it('game cards have rounded corners', () => {
      renderWithProviders(<Play />);

      const snakeLink = screen.getByRole('link', { name: /Snake/i });
      expect(snakeLink).toHaveClass('rounded-xl');
    });

    it('filter section has proper layout', () => {
      renderWithProviders(<Play />);

      expect(screen.getByText(/Filter:/i)).toBeInTheDocument();
      expect(screen.getByText(/Sort by:/i)).toBeInTheDocument();
    });
  });
});
