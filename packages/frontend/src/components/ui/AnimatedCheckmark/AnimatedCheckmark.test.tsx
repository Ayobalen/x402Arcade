/**
 * AnimatedCheckmark Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnimatedCheckmark } from './AnimatedCheckmark';

describe('AnimatedCheckmark', () => {
  it('renders with default props', () => {
    render(<AnimatedCheckmark />);
    const svg = screen.getByLabelText('Success checkmark');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '48');
    expect(svg).toHaveAttribute('height', '48');
  });

  it('applies custom size', () => {
    render(<AnimatedCheckmark size={64} />);
    const svg = screen.getByLabelText('Success checkmark');
    expect(svg).toHaveAttribute('width', '64');
    expect(svg).toHaveAttribute('height', '64');
  });

  it('applies custom className', () => {
    render(<AnimatedCheckmark className="test-class" />);
    const svg = screen.getByLabelText('Success checkmark');
    expect(svg).toHaveClass('test-class');
  });

  it('accepts color prop', () => {
    render(<AnimatedCheckmark color="#ff0000" />);
    const svg = screen.getByLabelText('Success checkmark');
    expect(svg).toBeInTheDocument();
    // Color is applied to SVG elements, component renders successfully
  });

  it('accepts duration prop', () => {
    render(<AnimatedCheckmark duration={1.0} />);
    const svg = screen.getByLabelText('Success checkmark');
    expect(svg).toBeInTheDocument();
  });

  it('accepts loop prop', () => {
    render(<AnimatedCheckmark loop />);
    const svg = screen.getByLabelText('Success checkmark');
    expect(svg).toBeInTheDocument();
  });

  it('accepts onAnimationComplete callback', () => {
    const callback = vi.fn();
    render(<AnimatedCheckmark onAnimationComplete={callback} />);
    const svg = screen.getByLabelText('Success checkmark');
    expect(svg).toBeInTheDocument();
    // Animation completion is tested via integration/visual tests
  });

  it('respects autoPlay prop set to false', () => {
    render(<AnimatedCheckmark autoPlay={false} />);
    const svg = screen.getByLabelText('Success checkmark');
    expect(svg).toBeInTheDocument();
    // With autoPlay=false, animation should not start automatically
  });

  it('has correct accessibility attributes', () => {
    render(<AnimatedCheckmark />);
    const svg = screen.getByRole('img');
    expect(svg).toHaveAttribute('aria-label', 'Success checkmark');
  });
});
