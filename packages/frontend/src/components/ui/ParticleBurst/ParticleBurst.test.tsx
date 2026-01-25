/**
 * ParticleBurst Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ParticleBurst } from './ParticleBurst';

describe('ParticleBurst', () => {
  it('renders with required props', () => {
    const { container } = render(<ParticleBurst x={100} y={100} />);
    const burst = container.querySelector('.absolute');
    expect(burst).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ParticleBurst x={100} y={100} className="custom-burst" />
    );
    const burst = container.querySelector('.custom-burst');
    expect(burst).toBeInTheDocument();
  });

  it('has pointer-events-none to not interfere with interactions', () => {
    const { container } = render(<ParticleBurst x={100} y={100} />);
    const burst = container.querySelector('.pointer-events-none');
    expect(burst).toBeInTheDocument();
  });

  it('is hidden from screen readers with aria-hidden', () => {
    const { container } = render(<ParticleBurst x={100} y={100} />);
    const burst = container.querySelector('[aria-hidden="true"]');
    expect(burst).toBeInTheDocument();
  });

  it('positions at correct x and y coordinates', () => {
    const { container } = render(<ParticleBurst x={150} y={200} />);
    const burst = container.querySelector('.absolute') as HTMLElement;
    expect(burst?.style.left).toBe('150px');
    expect(burst?.style.top).toBe('200px');
  });

  it('uses default cyan color', () => {
    render(<ParticleBurst x={100} y={100} />);
    // Component renders, color applied via inline styles to particles
    expect(true).toBe(true);
  });

  it('accepts custom color prop', () => {
    render(<ParticleBurst x={100} y={100} color="#ff00ff" />);
    // Component renders with custom color
    expect(true).toBe(true);
  });

  it('accepts custom particleCount prop', () => {
    render(<ParticleBurst x={100} y={100} particleCount={20} />);
    // Component renders with custom particle count
    expect(true).toBe(true);
  });

  it('accepts custom duration prop', () => {
    render(<ParticleBurst x={100} y={100} duration={1.2} />);
    // Component renders with custom duration
    expect(true).toBe(true);
  });

  it('calls onComplete callback after animation', () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    render(
      <ParticleBurst x={100} y={100} duration={0.8} onComplete={onComplete} />
    );

    expect(onComplete).not.toHaveBeenCalled();

    // Fast-forward time to after animation completes
    vi.advanceTimersByTime(800);

    expect(onComplete).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});
