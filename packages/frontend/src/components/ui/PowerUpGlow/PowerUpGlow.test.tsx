/**
 * PowerUpGlow Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PowerUpGlow } from './PowerUpGlow';

describe('PowerUpGlow', () => {
  it('renders children when active', () => {
    render(
      <PowerUpGlow isActive={true}>
        <div>Power Up Content</div>
      </PowerUpGlow>
    );
    expect(screen.getByText('Power Up Content')).toBeInTheDocument();
  });

  it('renders children when not active', () => {
    render(
      <PowerUpGlow isActive={false}>
        <div>Normal Content</div>
      </PowerUpGlow>
    );
    expect(screen.getByText('Normal Content')).toBeInTheDocument();
  });

  it('applies glow effects when active', () => {
    const { container } = render(
      <PowerUpGlow isActive={true}>
        <div>Content</div>
      </PowerUpGlow>
    );
    const glowElements = container.querySelectorAll('[aria-hidden="true"]');
    expect(glowElements.length).toBeGreaterThan(0);
  });

  it('does not apply glow effects when inactive', () => {
    const { container } = render(
      <PowerUpGlow isActive={false}>
        <div>Content</div>
      </PowerUpGlow>
    );
    const glowElements = container.querySelectorAll('[aria-hidden="true"]');
    expect(glowElements.length).toBe(0);
  });

  it('calls onExpire after duration when active', () => {
    vi.useFakeTimers();
    const onExpire = vi.fn();
    render(
      <PowerUpGlow isActive={true} duration={5} onExpire={onExpire}>
        <div>Content</div>
      </PowerUpGlow>
    );

    expect(onExpire).not.toHaveBeenCalled();
    vi.advanceTimersByTime(5000);
    expect(onExpire).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('does not call onExpire when inactive', () => {
    vi.useFakeTimers();
    const onExpire = vi.fn();
    render(
      <PowerUpGlow isActive={false} duration={5} onExpire={onExpire}>
        <div>Content</div>
      </PowerUpGlow>
    );

    vi.advanceTimersByTime(10000);
    expect(onExpire).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('applies custom className', () => {
    const { container } = render(
      <PowerUpGlow isActive={true} className="custom-class">
        <div>Content</div>
      </PowerUpGlow>
    );
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('uses custom color for glow', () => {
    const { container } = render(
      <PowerUpGlow isActive={true} color="#ff00ff">
        <div>Content</div>
      </PowerUpGlow>
    );
    const glowElement = container.querySelector('[class*="inset-0"]');
    expect(glowElement).toBeInTheDocument();
  });

  it('applies custom intensity', () => {
    const { container } = render(
      <PowerUpGlow isActive={true} intensity={0.5}>
        <div>Content</div>
      </PowerUpGlow>
    );
    const glowElement = container.querySelector('[class*="inset-0"]');
    expect(glowElement).toBeInTheDocument();
  });

  it('renders with custom pulseSpeed', () => {
    const { container } = render(
      <PowerUpGlow isActive={true} pulseSpeed={2.0}>
        <div>Content</div>
      </PowerUpGlow>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('maintains content z-index when active', () => {
    const { container } = render(
      <PowerUpGlow isActive={true}>
        <div>Content</div>
      </PowerUpGlow>
    );
    const contentWrapper = container.querySelector('.z-10');
    expect(contentWrapper).toBeInTheDocument();
  });

  it('handles children properly in both states', () => {
    const { rerender } = render(
      <PowerUpGlow isActive={false}>
        <button>Click Me</button>
      </PowerUpGlow>
    );
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(
      <PowerUpGlow isActive={true}>
        <button>Click Me</button>
      </PowerUpGlow>
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
