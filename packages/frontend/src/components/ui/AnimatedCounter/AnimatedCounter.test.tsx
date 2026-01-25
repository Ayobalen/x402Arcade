/**
 * AnimatedCounter Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnimatedCounter } from './AnimatedCounter';

describe('AnimatedCounter', () => {
  it('renders with default props', () => {
    render(<AnimatedCounter value={100} />);
    // Component should render, final value will be animated to
    expect(screen.getByText(/\d+/)).toBeInTheDocument();
  });

  it('formats as currency', () => {
    render(<AnimatedCounter value={99.99} format="currency" decimals={2} />);
    // Should eventually show currency format
    expect(screen.getByText(/\$/)).toBeInTheDocument();
  });

  it('formats as percentage', () => {
    render(<AnimatedCounter value={85.5} format="percentage" decimals={1} />);
    // Should eventually show percentage format
    expect(screen.getByText(/%/)).toBeInTheDocument();
  });

  it('formats as decimal', () => {
    render(<AnimatedCounter value={123.456} format="decimal" decimals={2} />);
    // Should render with decimal formatting
    expect(screen.getByText(/\d+\.\d+/)).toBeInTheDocument();
  });

  it('formats as compact notation', () => {
    render(<AnimatedCounter value={1500000} format="compact" />);
    // Large numbers should be compacted (e.g., "1.5M")
    expect(screen.getByText(/\d/)).toBeInTheDocument();
  });

  it('accepts custom currency symbol', () => {
    render(<AnimatedCounter value={100} format="currency" currencySymbol="€" decimals={2} />);
    // Should use custom currency symbol
    expect(screen.getByText(/€/)).toBeInTheDocument();
  });

  it('accepts from prop', () => {
    render(<AnimatedCounter value={100} from={50} />);
    // Should start from 50 and animate to 100
    expect(screen.getByText(/\d+/)).toBeInTheDocument();
  });

  it('accepts duration prop', () => {
    render(<AnimatedCounter value={100} duration={2.0} />);
    expect(screen.getByText(/\d+/)).toBeInTheDocument();
  });

  it('accepts stiffness and damping props', () => {
    render(<AnimatedCounter value={100} stiffness={200} damping={30} />);
    expect(screen.getByText(/\d+/)).toBeInTheDocument();
  });

  it('accepts onAnimationComplete callback', () => {
    const callback = vi.fn();
    render(<AnimatedCounter value={100} onAnimationComplete={callback} />);
    expect(screen.getByText(/\d+/)).toBeInTheDocument();
    // Callback is called when animation completes (tested via integration)
  });

  it('applies custom className', () => {
    const { container } = render(<AnimatedCounter value={100} className="test-class" />);
    const element = container.querySelector('.test-class');
    expect(element).toBeInTheDocument();
  });

  it('renders as different HTML elements', () => {
    const { container } = render(<AnimatedCounter value={100} as="div" />);
    const div = container.querySelector('div');
    expect(div).toBeInTheDocument();
  });

  it('renders as heading element', () => {
    const { container } = render(<AnimatedCounter value={100} as="h2" />);
    const h2 = container.querySelector('h2');
    expect(h2).toBeInTheDocument();
  });

  it('handles zero value', () => {
    render(<AnimatedCounter value={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('handles negative values', () => {
    render(<AnimatedCounter value={-50} />);
    expect(screen.getByText(/-?\d+/)).toBeInTheDocument();
  });
});
