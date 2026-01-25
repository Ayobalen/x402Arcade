/**
 * ComboFlash Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComboFlash } from './ComboFlash';

describe('ComboFlash', () => {
  it('renders with default props', () => {
    render(<ComboFlash multiplier={2} />);
    expect(screen.getByText('2x')).toBeInTheDocument();
  });

  it('displays the multiplier value', () => {
    render(<ComboFlash multiplier={5} />);
    expect(screen.getByText('5x')).toBeInTheDocument();
  });

  it('shows COMBO label for multipliers >= 3', () => {
    render(<ComboFlash multiplier={3} />);
    expect(screen.getByText('COMBO!')).toBeInTheDocument();
  });

  it('does not show COMBO label for multipliers < 3', () => {
    render(<ComboFlash multiplier={2} />);
    expect(screen.queryByText('COMBO!')).not.toBeInTheDocument();
  });

  it('does not render when show is false', () => {
    render(<ComboFlash multiplier={5} show={false} />);
    expect(screen.queryByText('5x')).not.toBeInTheDocument();
  });

  it('renders when show is true', () => {
    render(<ComboFlash multiplier={5} show={true} />);
    expect(screen.getByText('5x')).toBeInTheDocument();
  });

  it('calls onComplete after duration', () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    render(<ComboFlash multiplier={2} duration={0.5} onComplete={onComplete} />);

    expect(onComplete).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    expect(onComplete).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('does not call onComplete when show is false', () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    render(<ComboFlash multiplier={2} show={false} onComplete={onComplete} />);

    vi.advanceTimersByTime(1000);
    expect(onComplete).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('applies custom className', () => {
    const { container } = render(<ComboFlash multiplier={2} className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('uses custom position when provided', () => {
    const { container } = render(
      <ComboFlash multiplier={2} position={{ x: 100, y: 200 }} />
    );
    const element = container.querySelector('[style*="left"]') as HTMLElement;
    expect(element).toHaveStyle({ left: '100px', top: '200px' });
  });

  it('centers by default when position is not provided', () => {
    const { container } = render(<ComboFlash multiplier={2} />);
    const element = container.querySelector('[style*="left"]') as HTMLElement;
    expect(element).toHaveStyle({ left: '50%', top: '50%' });
  });

  it('has accessibility attributes', () => {
    const { container } = render(<ComboFlash multiplier={2} />);
    const element = container.querySelector('[aria-live]');
    expect(element).toHaveAttribute('aria-live', 'polite');
    expect(element).toHaveAttribute('aria-atomic', 'true');
  });

  it('uses Orbitron font for multiplier text', () => {
    render(<ComboFlash multiplier={5} />);
    const element = screen.getByText('5x');
    expect(element).toHaveStyle({ fontFamily: 'Orbitron, sans-serif' });
  });

  it('shows different colors for different multiplier levels', () => {
    const { rerender } = render(<ComboFlash multiplier={2} />);
    let element = screen.getByText('2x');
    let style = window.getComputedStyle(element);
    expect(style.color).toBeTruthy();

    rerender(<ComboFlash multiplier={10} />);
    element = screen.getByText('10x');
    style = window.getComputedStyle(element);
    expect(style.color).toBeTruthy();
  });
});
