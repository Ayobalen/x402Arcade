/**
 * App Component Tests
 *
 * Example tests demonstrating React Testing Library usage
 * with custom render functions and user interactions.
 */

import { describe, it, expect, vi } from 'vitest';
import App from '../../src/App';
import { renderWithProviders, screen, waitFor } from '../utils';

describe('App Component', () => {
  describe('Rendering', () => {
    it('renders the app title', () => {
      renderWithProviders(<App />);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'x402 Arcade'
      );
    });

    it('renders the tagline', () => {
      renderWithProviders(<App />);

      expect(
        screen.getByText('Insert a Penny, Play for Glory')
      ).toBeInTheDocument();
    });

    it('renders the counter button with initial count of 0', () => {
      renderWithProviders(<App />);

      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Count is 0');
    });

    it('applies retro arcade styling', () => {
      const { container } = renderWithProviders(<App />);

      // Check background color is applied
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('bg-[#0a0a0a]');
      expect(mainDiv).toHaveClass('text-white');
    });
  });

  describe('User Interactions', () => {
    it('increments counter when button is clicked', async () => {
      const { user } = renderWithProviders(<App />);

      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Count is 0');

      await user.click(button);

      expect(button).toHaveTextContent('Count is 1');
    });

    it('increments counter multiple times', async () => {
      const { user } = renderWithProviders(<App />);

      const button = screen.getByRole('button');

      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(button).toHaveTextContent('Count is 3');
    });

    it('button has gradient styling for neon effect', () => {
      renderWithProviders(<App />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gradient-to-r');
      expect(button).toHaveClass('from-[#00ffff]');
      expect(button).toHaveClass('to-[#ff00ff]');
    });

    it('button has hover transition', () => {
      renderWithProviders(<App />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition-opacity');
      expect(button).toHaveClass('hover:opacity-90');
    });
  });

  describe('Accessibility', () => {
    it('heading is properly structured', () => {
      renderWithProviders(<App />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('button is focusable', () => {
      renderWithProviders(<App />);

      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('button is keyboard accessible', async () => {
      const { user } = renderWithProviders(<App />);

      const button = screen.getByRole('button');
      button.focus();

      // Simulate Enter key press
      await user.keyboard('{Enter}');

      expect(button).toHaveTextContent('Count is 1');
    });

    it('button is also accessible via Space key', async () => {
      const { user } = renderWithProviders(<App />);

      const button = screen.getByRole('button');
      button.focus();

      // Simulate Space key press
      await user.keyboard(' ');

      expect(button).toHaveTextContent('Count is 1');
    });
  });

  describe('Design System Compliance', () => {
    it('uses correct cyan accent color for title', () => {
      renderWithProviders(<App />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('text-[#00ffff]');
    });

    it('uses muted gray for secondary text', () => {
      renderWithProviders(<App />);

      const tagline = screen.getByText('Insert a Penny, Play for Glory');
      expect(tagline).toHaveClass('text-[#94a3b8]');
    });

    it('button text is black for contrast on gradient', () => {
      renderWithProviders(<App />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-black');
    });

    it('uses proper rounded corners', () => {
      renderWithProviders(<App />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('rounded-lg');
    });
  });
});

describe('App Component - Query Integration', () => {
  it('provides access to queryClient for testing', () => {
    const { queryClient } = renderWithProviders(<App />);

    // Verify queryClient is available
    expect(queryClient).toBeDefined();
    expect(queryClient.getQueryCache()).toBeDefined();
  });
});

describe('RTL Utilities', () => {
  it('screen queries are available', () => {
    renderWithProviders(<App />);

    // Different query methods
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText(/Insert a Penny/i)).toBeInTheDocument();
    expect(screen.queryByTestId('nonexistent')).toBeNull();
  });

  it('waitFor works for async assertions', async () => {
    const { user } = renderWithProviders(<App />);

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(button).toHaveTextContent('Count is 1');
    });
  });
});
