/**
 * ScorePopup Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScorePopup } from './ScorePopup';

describe('ScorePopup', () => {
  it('renders with default props', () => {
    render(<ScorePopup score={100} x={50} y={100} />);
    expect(screen.getByText('+100')).toBeInTheDocument();
  });

  it('formats score with + prefix for positive values', () => {
    render(<ScorePopup score={250} x={50} y={100} />);
    expect(screen.getByText('+250')).toBeInTheDocument();
  });

  it('formats negative scores correctly', () => {
    render(<ScorePopup score={-50} x={50} y={100} />);
    expect(screen.getByText('-50')).toBeInTheDocument();
  });

  it('applies custom color', () => {
    const { container } = render(
      <ScorePopup score={100} x={50} y={100} color="#ff00ff" />
    );
    const scoreElement = container.querySelector('div[style*="color"]');
    expect(scoreElement).toHaveStyle({ color: '#ff00ff' });
  });

  it('shows COMBO text when isCombo is true', () => {
    render(<ScorePopup score={500} x={50} y={100} isCombo={true} />);
    expect(screen.getByText(/COMBO!/)).toBeInTheDocument();
  });

  it('does not show COMBO text when isCombo is false', () => {
    render(<ScorePopup score={500} x={50} y={100} isCombo={false} />);
    expect(screen.queryByText(/COMBO!/)).not.toBeInTheDocument();
  });

  it('calls onComplete after duration', () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    render(
      <ScorePopup score={100} x={50} y={100} duration={1} onComplete={onComplete} />
    );

    expect(onComplete).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(onComplete).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ScorePopup score={100} x={50} y={100} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('positions at specified x and y coordinates', () => {
    const { container } = render(<ScorePopup score={100} x={200} y={300} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ left: '200px', top: '300px' });
  });

  it('has accessibility attributes', () => {
    const { container } = render(<ScorePopup score={100} x={50} y={100} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveAttribute('aria-live', 'polite');
    expect(wrapper).toHaveAttribute('aria-atomic', 'true');
  });
});
