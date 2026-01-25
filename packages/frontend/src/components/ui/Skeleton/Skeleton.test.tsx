/**
 * Skeleton Component Tests
 */

import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('renders with default props', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('rounded-lg'); // rectangular variant default
  });

  it('applies rectangular variant', () => {
    const { container } = render(<Skeleton variant="rectangular" />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton).toHaveClass('rounded-lg');
  });

  it('applies circular variant', () => {
    const { container } = render(<Skeleton variant="circular" />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton).toHaveClass('rounded-full');
  });

  it('applies text variant', () => {
    const { container } = render(<Skeleton variant="text" />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton).toHaveClass('rounded');
    expect(skeleton).toHaveClass('h-4');
  });

  it('applies custom width and height', () => {
    const { container } = render(<Skeleton width="200px" height="100px" />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton.style.width).toBe('200px');
    expect(skeleton.style.height).toBe('100px');
  });

  it('shows shimmer animation by default', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton).toHaveClass('skeleton-shimmer');
    expect(skeleton.querySelector('.skeleton-shimmer-overlay')).toBeInTheDocument();
  });

  it('hides shimmer animation when animate is false', () => {
    const { container } = render(<Skeleton animate={false} />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton).not.toHaveClass('skeleton-shimmer');
    expect(skeleton.querySelector('.skeleton-shimmer-overlay')).not.toBeInTheDocument();
  });

  it('applies speed variants', () => {
    const { container: slowContainer } = render(<Skeleton speed="slow" />);
    const { container: normalContainer } = render(<Skeleton speed="normal" />);
    const { container: fastContainer } = render(<Skeleton speed="fast" />);

    expect(slowContainer.firstChild).toHaveClass('skeleton-slow');
    expect(normalContainer.firstChild).toHaveClass('skeleton-normal');
    expect(fastContainer.firstChild).toHaveClass('skeleton-fast');
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="custom-skeleton" />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton).toHaveClass('custom-skeleton');
  });
});
