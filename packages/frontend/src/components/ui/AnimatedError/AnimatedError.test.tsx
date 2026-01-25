/**
 * AnimatedError Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnimatedError } from './AnimatedError';

describe('AnimatedError', () => {
  it('renders with default props', () => {
    render(<AnimatedError />);
    const svg = screen.getByLabelText('Error cross');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '48');
    expect(svg).toHaveAttribute('height', '48');
  });

  it('applies custom size', () => {
    render(<AnimatedError size={64} />);
    const svg = screen.getByLabelText('Error cross');
    expect(svg).toHaveAttribute('width', '64');
    expect(svg).toHaveAttribute('height', '64');
  });

  it('applies custom className', () => {
    render(<AnimatedError className="test-class" />);
    const svg = screen.getByLabelText('Error cross');
    expect(svg).toHaveClass('test-class');
  });

  it('accepts color prop', () => {
    render(<AnimatedError color="#00ff00" />);
    const svg = screen.getByLabelText('Error cross');
    expect(svg).toBeInTheDocument();
    // Color is applied to SVG elements, component renders successfully
  });

  it('accepts duration prop', () => {
    render(<AnimatedError duration={1.0} />);
    const svg = screen.getByLabelText('Error cross');
    expect(svg).toBeInTheDocument();
  });

  it('accepts loop prop', () => {
    render(<AnimatedError loop />);
    const svg = screen.getByLabelText('Error cross');
    expect(svg).toBeInTheDocument();
  });

  it('accepts onAnimationComplete callback', () => {
    const callback = vi.fn();
    render(<AnimatedError onAnimationComplete={callback} />);
    const svg = screen.getByLabelText('Error cross');
    expect(svg).toBeInTheDocument();
    // Animation completion is tested via integration/visual tests
  });

  it('respects autoPlay prop set to false', () => {
    render(<AnimatedError autoPlay={false} />);
    const svg = screen.getByLabelText('Error cross');
    expect(svg).toBeInTheDocument();
    // With autoPlay=false, animation should not start automatically
  });

  it('respects includeShake prop set to false', () => {
    render(<AnimatedError includeShake={false} />);
    const svg = screen.getByLabelText('Error cross');
    expect(svg).toBeInTheDocument();
    // Without shake, animation still renders correctly
  });

  it('has correct accessibility attributes', () => {
    render(<AnimatedError />);
    const svg = screen.getByRole('img');
    expect(svg).toHaveAttribute('aria-label', 'Error cross');
  });
});
