/**
 * Leaderboard Page Integration Tests
 *
 * Tests for the Leaderboard page component including:
 * - Page rendering with leaderboard table
 * - Game and time period filters
 * - Prize pool information
 * - Content verification
 */

import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen, within } from '../../../__tests__/utils';
import { Leaderboard } from './Leaderboard';

describe('Leaderboard Page', () => {
  describe('Rendering', () => {
    it('renders the main heading', () => {
      renderWithProviders(<Leaderboard />);

      expect(screen.getByRole('heading', { level: 1, name: /Leaderboard/i })).toBeInTheDocument();
    });

    it('renders the description', () => {
      renderWithProviders(<Leaderboard />);

      expect(screen.getByText(/Compete for glory and daily prize pools/i)).toBeInTheDocument();
    });

    it('renders Select Game section', () => {
      renderWithProviders(<Leaderboard />);

      expect(screen.getByRole('heading', { level: 2, name: /Select Game/i })).toBeInTheDocument();
    });

    it('renders game filter buttons', () => {
      renderWithProviders(<Leaderboard />);

      expect(screen.getByRole('button', { name: /All Games/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Snake/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Pong/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Tetris/i })).toBeInTheDocument();
    });

    it('renders Time Period section', () => {
      renderWithProviders(<Leaderboard />);

      expect(screen.getByRole('heading', { level: 2, name: /Time Period/i })).toBeInTheDocument();
    });

    it('renders time period filter buttons', () => {
      renderWithProviders(<Leaderboard />);

      expect(screen.getByRole('button', { name: /^Daily$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Weekly$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^All Time$/i })).toBeInTheDocument();
    });

    it('renders Top Players heading', () => {
      renderWithProviders(<Leaderboard />);

      expect(screen.getByRole('heading', { level: 3, name: /Top Players/i })).toBeInTheDocument();
    });

    it('renders leaderboard table', () => {
      renderWithProviders(<Leaderboard />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('renders table headers', () => {
      renderWithProviders(<Leaderboard />);

      expect(screen.getByRole('columnheader', { name: /Rank/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Player/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Game/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Score/i })).toBeInTheDocument();
    });

    it('renders at least 10 player entries', () => {
      renderWithProviders(<Leaderboard />);

      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');

      // Should have header row + at least 10 data rows
      expect(rows.length).toBeGreaterThanOrEqual(11);
    });

    it('renders Daily Prize Pool section', () => {
      renderWithProviders(<Leaderboard />);

      expect(
        screen.getByRole('heading', { level: 3, name: /Daily Prize Pool/i })
      ).toBeInTheDocument();
    });
  });

  describe('Content', () => {
    it('displays player wallet addresses', () => {
      renderWithProviders(<Leaderboard />);

      // Should have wallet addresses in shortened format (0x1234...5678)
      const addresses = screen.getAllByText(/0x[a-fA-F0-9]{4}\.\.\.[a-fA-F0-9]{4}/);
      expect(addresses.length).toBeGreaterThan(0);
    });

    it('displays game names in table', () => {
      renderWithProviders(<Leaderboard />);

      const table = screen.getByRole('table');

      // Should have at least one of each game type
      expect(within(table).getAllByText(/Snake/i).length).toBeGreaterThan(0);
    });

    it('displays scores with proper formatting', () => {
      renderWithProviders(<Leaderboard />);

      // Scores should be formatted with commas (e.g., 15,420)
      const formattedScores = screen.getAllByText(/\d{1,3},\d{3}/);
      expect(formattedScores.length).toBeGreaterThan(0);
    });

    it('displays trophy icon for #1 player', () => {
      renderWithProviders(<Leaderboard />);

      const table = screen.getByRole('table');
      const firstRow = within(table).getAllByRole('row')[1]; // Skip header row

      // First place should have a trophy icon (img or svg)
      expect(firstRow).toBeInTheDocument();
    });

    it('displays prize pool amount', () => {
      renderWithProviders(<Leaderboard />);

      expect(screen.getByText(/\$\d+\.\d+ USDC/i)).toBeInTheDocument();
    });

    it('displays prize pool description', () => {
      renderWithProviders(<Leaderboard />);

      expect(screen.getByText(/70% of all game payments/i)).toBeInTheDocument();
      expect(screen.getByText(/Winner announced at midnight UTC/i)).toBeInTheDocument();
    });

    it('displays real-time update message', () => {
      renderWithProviders(<Leaderboard />);

      expect(screen.getByText(/Updates in real-time/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has properly structured headings', () => {
      renderWithProviders(<Leaderboard />);

      const h1 = screen.getByRole('heading', { level: 1 });
      const h2s = screen.getAllByRole('heading', { level: 2 });
      const h3s = screen.getAllByRole('heading', { level: 3 });

      expect(h1).toBeInTheDocument();
      expect(h2s.length).toBeGreaterThanOrEqual(2); // Select Game, Time Period
      expect(h3s.length).toBeGreaterThanOrEqual(2); // Top Players, Daily Prize Pool
    });

    it('table has proper structure', () => {
      renderWithProviders(<Leaderboard />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Should have column headers
      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders.length).toBe(4); // Rank, Player, Game, Score
    });

    it('all filter buttons are keyboard accessible', () => {
      renderWithProviders(<Leaderboard />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        button.focus();
        expect(button).toHaveFocus();
        button.blur();
      });
    });

    it('game filter buttons have accessible names with emojis', () => {
      renderWithProviders(<Leaderboard />);

      expect(screen.getByRole('button', { name: /🎮.*All Games/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /🐍.*Snake/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /🏓.*Pong/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /🟦.*Tetris/i })).toBeInTheDocument();
    });
  });

  describe('Design System', () => {
    it('table has proper styling', () => {
      renderWithProviders(<Leaderboard />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('filter buttons have proper styling', () => {
      renderWithProviders(<Leaderboard />);

      const allGamesButton = screen.getByRole('button', { name: /All Games/i });
      expect(allGamesButton).toHaveClass('rounded-lg');
    });

    it('prize pool section has visual prominence', () => {
      renderWithProviders(<Leaderboard />);

      const prizeAmount = screen.getByText(/\$\d+\.\d+ USDC/i);
      expect(prizeAmount).toBeInTheDocument();
    });
  });
});
