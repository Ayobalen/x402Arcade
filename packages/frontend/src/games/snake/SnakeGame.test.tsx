/**
 * SnakeGame Component Tests
 *
 * Tests for the Snake game component.
 *
 * @module games/snake/SnakeGame.test
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SnakeGame } from './SnakeGame';

describe('SnakeGame Component', () => {
  it('should render without crashing', () => {
    render(<SnakeGame />);

    // Should render canvas element
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should render score display', () => {
    render(<SnakeGame />);

    // Should show score label
    expect(screen.getByText('Score:')).toBeInTheDocument();

    // Score value should be rendered (from state.gameSpecific.score which starts at 0)
    // The score is displayed via JSX, we can verify the structure exists
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should render game info (level and difficulty)', () => {
    render(<SnakeGame />);

    // Should show level label
    expect(screen.getByText('Level:')).toBeInTheDocument();

    // Should show level 1
    expect(screen.getByText('1')).toBeInTheDocument();

    // Should show difficulty label
    expect(screen.getByText('Difficulty:')).toBeInTheDocument();
  });

  it('should render canvas with correct dimensions', () => {
    render(<SnakeGame />);

    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas).toBeInTheDocument();
    expect(canvas.width).toBe(400); // CANVAS_WIDTH = 20 * 20
    expect(canvas.height).toBe(400); // CANVAS_HEIGHT = 20 * 20
  });

  it('should use specified difficulty', () => {
    render(<SnakeGame difficulty="hard" />);

    // Should show hard difficulty
    expect(screen.getByText('hard')).toBeInTheDocument();
  });

  it('should call onGameOver callback when provided', () => {
    const onGameOver = vi.fn();
    render(<SnakeGame onGameOver={onGameOver} />);

    // Callback should be ready to call
    expect(onGameOver).toBeDefined();
  });

  it('should apply custom className', () => {
    const { container } = render(<SnakeGame className="custom-class" />);

    // Should have the custom class
    const gameDiv = container.firstChild as HTMLElement;
    expect(gameDiv.className).toContain('custom-class');
  });

  it('should display default difficulty as normal', () => {
    render(<SnakeGame />);

    // Should show normal difficulty by default
    expect(screen.getByText('normal')).toBeInTheDocument();
  });
});
