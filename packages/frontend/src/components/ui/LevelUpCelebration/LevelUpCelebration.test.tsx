/**
 * LevelUpCelebration Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LevelUpCelebration } from './LevelUpCelebration';

describe('LevelUpCelebration', () => {
  it('renders with default props', () => {
    render(<LevelUpCelebration level={2} />);
    expect(screen.getByText('LEVEL UP!')).toBeInTheDocument();
    expect(screen.getByText('Level 2')).toBeInTheDocument();
  });

  it('displays the correct level number', () => {
    render(<LevelUpCelebration level={5} />);
    expect(screen.getByText('Level 5')).toBeInTheDocument();
  });

  it('shows screen flash by default', () => {
    const { container } = render(<LevelUpCelebration level={2} />);
    const flash = container.querySelector('.bg-white');
    expect(flash).toBeInTheDocument();
  });

  it('hides screen flash when showFlash is false', () => {
    const { container } = render(
      <LevelUpCelebration level={2} showFlash={false} />
    );
    const flash = container.querySelector('.bg-white');
    expect(flash).not.toBeInTheDocument();
  });

  it('renders confetti particles', () => {
    const { container } = render(
      <LevelUpCelebration level={2} particleCount={10} />
    );
    const particles = container.querySelectorAll('[class*="rounded-sm"]');
    expect(particles.length).toBe(10);
  });

  it('calls onSoundTrigger on mount', () => {
    const onSoundTrigger = vi.fn();
    render(<LevelUpCelebration level={2} onSoundTrigger={onSoundTrigger} />);
    expect(onSoundTrigger).toHaveBeenCalledTimes(1);
  });

  it('calls onComplete after duration', () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    render(
      <LevelUpCelebration level={2} duration={1} onComplete={onComplete} />
    );

    expect(onComplete).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(onComplete).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('applies custom className', () => {
    const { container } = render(
      <LevelUpCelebration level={2} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has accessibility attributes', () => {
    const { container } = render(<LevelUpCelebration level={2} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveAttribute('aria-live', 'assertive');
    expect(wrapper).toHaveAttribute('aria-atomic', 'true');
  });

  it('uses Orbitron font for text', () => {
    render(<LevelUpCelebration level={2} />);
    const title = screen.getByText('LEVEL UP!');
    expect(title).toHaveStyle({
      fontFamily: 'Orbitron, sans-serif',
    });
  });

  it('applies neon glow effects to text', () => {
    render(<LevelUpCelebration level={2} />);
    const title = screen.getByText('LEVEL UP!');
    const style = window.getComputedStyle(title);
    expect(style.textShadow).toBeTruthy();
  });

  it('renders in a fixed, full-screen container', () => {
    const { container } = render(<LevelUpCelebration level={2} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('fixed');
    expect(wrapper).toHaveClass('inset-0');
  });
});
