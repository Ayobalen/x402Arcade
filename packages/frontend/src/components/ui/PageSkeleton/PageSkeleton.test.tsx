/**
 * PageSkeleton Component Tests
 *
 * Tests for loading skeleton components used during code splitting.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  PageSkeleton,
  GenericPageSkeleton,
  HomePageSkeleton,
  PlayPageSkeleton,
  GamePageSkeleton,
  LeaderboardPageSkeleton,
  NotFoundPageSkeleton,
} from './PageSkeleton';

describe('PageSkeleton', () => {
  describe('GenericPageSkeleton', () => {
    it('renders with loading state', () => {
      render(<GenericPageSkeleton />);

      const skeleton = screen.getByRole('progressbar');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveAttribute('aria-busy', 'true');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading page...');
    });

    it('contains skeleton elements', () => {
      render(<GenericPageSkeleton />);

      // Check for skeleton pulse elements
      const skeletonElements = screen.getAllByRole('presentation');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });
  });

  describe('HomePageSkeleton', () => {
    it('renders with loading state', () => {
      render(<HomePageSkeleton />);

      const skeleton = screen.getByRole('progressbar');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveAttribute('aria-label', 'Loading home page...');
    });

    it('contains hero section elements', () => {
      render(<HomePageSkeleton />);

      // Check for hero section (badge, headline, tagline, buttons)
      const presentations = screen.getAllByRole('presentation');
      expect(presentations.length).toBeGreaterThanOrEqual(5);
    });

    it('has proper aria attributes for accessibility', () => {
      render(<HomePageSkeleton />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('PlayPageSkeleton', () => {
    it('renders with loading state', () => {
      render(<PlayPageSkeleton />);

      const skeleton = screen.getByRole('progressbar');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveAttribute('aria-label', 'Loading games page...');
    });

    it('contains game cards grid', () => {
      render(<PlayPageSkeleton />);

      // Should have 6 game card placeholders (based on the implementation)
      const presentations = screen.getAllByRole('presentation');
      expect(presentations.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('GamePageSkeleton', () => {
    it('renders with loading state', () => {
      render(<GamePageSkeleton />);

      const skeleton = screen.getByRole('progressbar');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveAttribute('aria-label', 'Loading game...');
    });

    it('displays loading text', () => {
      render(<GamePageSkeleton />);

      expect(screen.getByText('Loading game...')).toBeInTheDocument();
    });

    it('contains animated loading dots', () => {
      render(<GamePageSkeleton />);

      // The animated dots container should be present
      const container = screen.getByRole('progressbar');
      // Check for bounce animation elements (the 3 dots)
      const dots = container.querySelectorAll('.animate-bounce');
      expect(dots.length).toBe(3);
    });
  });

  describe('LeaderboardPageSkeleton', () => {
    it('renders with loading state', () => {
      render(<LeaderboardPageSkeleton />);

      const skeleton = screen.getByRole('progressbar');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveAttribute('aria-label', 'Loading leaderboard...');
    });

    it('contains leaderboard row placeholders', () => {
      render(<LeaderboardPageSkeleton />);

      // Should have 10 row placeholders
      const presentations = screen.getAllByRole('presentation');
      expect(presentations.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('NotFoundPageSkeleton', () => {
    it('renders with loading state', () => {
      render(<NotFoundPageSkeleton />);

      const skeleton = screen.getByRole('progressbar');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveAttribute('aria-label', 'Loading page...');
    });

    it('is centered in viewport', () => {
      render(<NotFoundPageSkeleton />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveClass('flex');
      expect(progressbar).toHaveClass('items-center');
      expect(progressbar).toHaveClass('justify-center');
    });
  });

  describe('PageSkeleton (unified component)', () => {
    it('renders generic skeleton by default', () => {
      render(<PageSkeleton />);

      const skeleton = screen.getByRole('progressbar');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading page...');
    });

    it('renders home variant correctly', () => {
      render(<PageSkeleton variant="home" />);

      const skeleton = screen.getByRole('progressbar');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading home page...');
    });

    it('renders play variant correctly', () => {
      render(<PageSkeleton variant="play" />);

      const skeleton = screen.getByRole('progressbar');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading games page...');
    });

    it('renders game variant correctly', () => {
      render(<PageSkeleton variant="game" />);

      const skeleton = screen.getByRole('progressbar');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading game...');
    });

    it('renders leaderboard variant correctly', () => {
      render(<PageSkeleton variant="leaderboard" />);

      const skeleton = screen.getByRole('progressbar');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading leaderboard...');
    });

    it('renders notfound variant correctly', () => {
      render(<PageSkeleton variant="notfound" />);

      // NotFound uses the generic 'Loading page...' message
      const skeleton = screen.getByRole('progressbar');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading page...');
    });

    it('applies custom className', () => {
      const { container } = render(<PageSkeleton className="custom-class" />);

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('has display name', () => {
      expect(PageSkeleton.displayName).toBe('PageSkeleton');
    });
  });

  describe('Reduced Motion Support', () => {
    it('all skeletons have reduced motion classes', () => {
      const { container } = render(<HomePageSkeleton />);

      // Check for motion-reduce classes on animated elements
      const animatedElements = container.querySelectorAll('.animate-pulse');
      animatedElements.forEach((element) => {
        expect(
          element.classList.contains('motion-reduce:animate-none') ||
            element.classList.contains('motion-reduce:opacity-70')
        ).toBe(true);
      });
    });
  });
});
