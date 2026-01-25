/**
 * CoinCollect Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { CoinCollect } from './CoinCollect';

describe('CoinCollect', () => {
  const defaultProps = {
    start: { x: 100, y: 100 },
    end: { x: 500, y: 50 },
  };

  it('renders with default props', () => {
    const { container } = render(<CoinCollect {...defaultProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies custom coinSize', () => {
    const { container } = render(
      <CoinCollect {...defaultProps} coinSize={32} />
    );
    const coin = container.querySelector('[style*="width"]');
    expect(coin).toHaveStyle({ width: '32px', height: '32px' });
  });

  it('applies custom color', () => {
    const { container } = render(
      <CoinCollect {...defaultProps} color="#ff00ff" />
    );
    const coin = container.querySelector('[style*="background"]');
    expect(coin).toHaveStyle({ backgroundColor: '#ff00ff' });
  });

  it('calls onArrive after duration', () => {
    vi.useFakeTimers();
    const onArrive = vi.fn();
    render(
      <CoinCollect {...defaultProps} duration={0.5} onArrive={onArrive} />
    );

    expect(onArrive).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    expect(onArrive).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('calls onComplete after duration + pulse delay', () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    render(
      <CoinCollect {...defaultProps} duration={0.5} onComplete={onComplete} />
    );

    expect(onComplete).not.toHaveBeenCalled();
    vi.advanceTimersByTime(800); // 0.5s + 0.3s delay
    expect(onComplete).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('applies custom className', () => {
    const { container } = render(
      <CoinCollect {...defaultProps} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has aria-hidden attribute for accessibility', () => {
    const { container } = render(<CoinCollect {...defaultProps} />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders target pulse effect', () => {
    const { container } = render(<CoinCollect {...defaultProps} />);
    // Should have 2 motion divs: coin and pulse
    const motionDivs = container.querySelectorAll('div[class*="absolute"]');
    expect(motionDivs.length).toBeGreaterThanOrEqual(2);
  });

  it('renders inner circle for 3D effect', () => {
    const { container } = render(<CoinCollect {...defaultProps} />);
    const innerCircle = container.querySelector('[class*="inset-1"]');
    expect(innerCircle).toBeInTheDocument();
  });

  it('calculates bezier curve control points correctly', () => {
    const { container } = render(<CoinCollect {...defaultProps} />);
    const coin = container.querySelector('[style*="offset-path"]') as HTMLElement;
    expect(coin?.style.offsetPath).toContain('path');
    expect(coin?.style.offsetPath).toContain('M 100 100');
    expect(coin?.style.offsetPath).toContain('500 50');
  });
});
