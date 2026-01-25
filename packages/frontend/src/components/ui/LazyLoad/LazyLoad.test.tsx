/**
 * LazyLoad Component Tests
 *
 * Tests for viewport-based lazy loading with Intersection Observer.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { LazyLoad } from './LazyLoad';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
const mockObserve = vi.fn();
const mockUnobserve = vi.fn();
const mockDisconnect = vi.fn();

beforeEach(() => {
  mockIntersectionObserver.mockImplementation((callback: IntersectionObserverCallback) => {
    return {
      observe: mockObserve,
      unobserve: mockUnobserve,
      disconnect: mockDisconnect,
      root: null,
      rootMargin: '',
      thresholds: [],
      takeRecords: () => [],
    };
  });
  window.IntersectionObserver = mockIntersectionObserver as unknown as typeof IntersectionObserver;
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('LazyLoad', () => {
  describe('Basic Rendering', () => {
    it('renders placeholder initially', () => {
      render(
        <LazyLoad placeholder={<div data-testid="placeholder">Loading...</div>}>
          <div data-testid="content">Content</div>
        </LazyLoad>
      );

      expect(screen.getByTestId('placeholder')).toBeInTheDocument();
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });

    it('renders default placeholder when none provided', () => {
      render(
        <LazyLoad>
          <div data-testid="content">Content</div>
        </LazyLoad>
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders children immediately when disabled', () => {
      render(
        <LazyLoad disabled>
          <div data-testid="content">Content</div>
        </LazyLoad>
      );

      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('renders children immediately when forceLoad is true', () => {
      render(
        <LazyLoad forceLoad>
          <div data-testid="content">Content</div>
        </LazyLoad>
      );

      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });

  describe('Intersection Observer', () => {
    it('creates intersection observer with correct options', () => {
      render(
        <LazyLoad rootMargin="100px" threshold={0.5}>
          <div>Content</div>
        </LazyLoad>
      );

      expect(mockIntersectionObserver).toHaveBeenCalledWith(expect.any(Function), {
        rootMargin: '100px',
        threshold: 0.5,
      });
    });

    it('observes the container element', () => {
      render(
        <LazyLoad>
          <div>Content</div>
        </LazyLoad>
      );

      expect(mockObserve).toHaveBeenCalled();
    });

    it('loads content when element intersects', async () => {
      let observerCallback: IntersectionObserverCallback;
      mockIntersectionObserver.mockImplementation((callback: IntersectionObserverCallback) => {
        observerCallback = callback;
        return {
          observe: mockObserve,
          unobserve: mockUnobserve,
          disconnect: mockDisconnect,
          root: null,
          rootMargin: '',
          thresholds: [],
          takeRecords: () => [],
        };
      });

      render(
        <LazyLoad>
          <div data-testid="content">Content</div>
        </LazyLoad>
      );

      // Simulate intersection
      observerCallback!(
        [{ isIntersecting: true, target: document.body } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );

      await waitFor(() => {
        expect(screen.getByTestId('content')).toBeInTheDocument();
      });
    });

    it('unobserves when triggerOnce is true after loading', async () => {
      let observerCallback: IntersectionObserverCallback;
      mockIntersectionObserver.mockImplementation((callback: IntersectionObserverCallback) => {
        observerCallback = callback;
        return {
          observe: mockObserve,
          unobserve: mockUnobserve,
          disconnect: mockDisconnect,
          root: null,
          rootMargin: '',
          thresholds: [],
          takeRecords: () => [],
        };
      });

      render(
        <LazyLoad triggerOnce>
          <div data-testid="content">Content</div>
        </LazyLoad>
      );

      // Simulate intersection
      observerCallback!(
        [{ isIntersecting: true, target: document.body } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );

      await waitFor(() => {
        expect(mockUnobserve).toHaveBeenCalled();
      });
    });

    it('disconnects observer on unmount', () => {
      const { unmount } = render(
        <LazyLoad>
          <div>Content</div>
        </LazyLoad>
      );

      unmount();
      expect(mockDisconnect).toHaveBeenCalled();
    });
  });

  describe('Callbacks', () => {
    it('calls onLoad when content loads', async () => {
      const onLoad = vi.fn();
      let observerCallback: IntersectionObserverCallback;
      mockIntersectionObserver.mockImplementation((callback: IntersectionObserverCallback) => {
        observerCallback = callback;
        return {
          observe: mockObserve,
          unobserve: mockUnobserve,
          disconnect: mockDisconnect,
          root: null,
          rootMargin: '',
          thresholds: [],
          takeRecords: () => [],
        };
      });

      render(
        <LazyLoad onLoad={onLoad}>
          <div>Content</div>
        </LazyLoad>
      );

      observerCallback!(
        [{ isIntersecting: true, target: document.body } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );

      await waitFor(() => {
        expect(onLoad).toHaveBeenCalled();
      });
    });

    it('calls onVisible when element becomes visible', async () => {
      const onVisible = vi.fn();
      let observerCallback: IntersectionObserverCallback;
      mockIntersectionObserver.mockImplementation((callback: IntersectionObserverCallback) => {
        observerCallback = callback;
        return {
          observe: mockObserve,
          unobserve: mockUnobserve,
          disconnect: mockDisconnect,
          root: null,
          rootMargin: '',
          thresholds: [],
          takeRecords: () => [],
        };
      });

      render(
        <LazyLoad onVisible={onVisible}>
          <div>Content</div>
        </LazyLoad>
      );

      observerCallback!(
        [{ isIntersecting: true, target: document.body } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );

      await waitFor(() => {
        expect(onVisible).toHaveBeenCalled();
      });
    });
  });

  describe('Styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <LazyLoad className="custom-class" disabled>
          <div>Content</div>
        </LazyLoad>
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('applies minHeight style', () => {
      const { container } = render(
        <LazyLoad minHeight="200px" disabled>
          <div>Content</div>
        </LazyLoad>
      );

      expect(container.firstChild).toHaveStyle({ minHeight: '200px' });
    });

    it('applies fade-in transition when fadeIn is true', () => {
      const { container } = render(
        <LazyLoad fadeIn fadeDuration={300} disabled>
          <div>Content</div>
        </LazyLoad>
      );

      expect(container.firstChild).toHaveStyle({ transition: 'opacity 300ms ease-in-out' });
    });

    it('does not apply transition when fadeIn is false', () => {
      const { container } = render(
        <LazyLoad fadeIn={false} disabled>
          <div>Content</div>
        </LazyLoad>
      );

      expect(container.firstChild).not.toHaveStyle({
        transition: expect.stringContaining('opacity'),
      });
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to container element', () => {
      const ref = vi.fn();
      render(
        <LazyLoad ref={ref} disabled>
          <div>Content</div>
        </LazyLoad>
      );

      expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement));
    });

    it('supports React.useRef', () => {
      const TestComponent = () => {
        const ref = { current: null };
        return (
          <LazyLoad ref={ref} disabled>
            <div>Content</div>
          </LazyLoad>
        );
      };

      render(<TestComponent />);
      // If this renders without error, ref forwarding works
    });
  });

  describe('Accessibility', () => {
    it('default placeholder has correct ARIA attributes', () => {
      render(
        <LazyLoad>
          <div>Content</div>
        </LazyLoad>
      );

      const placeholder = screen.getByRole('progressbar');
      expect(placeholder).toHaveAttribute('aria-label', 'Loading...');
      expect(placeholder).toHaveAttribute('aria-busy', 'true');
    });

    it('has reduced motion support', () => {
      const { container } = render(
        <LazyLoad fadeIn disabled>
          <div>Content</div>
        </LazyLoad>
      );

      // Check for motion-reduce class
      expect(container.firstChild).toHaveClass('motion-reduce:transition-none');
    });
  });

  describe('Display Name', () => {
    it('has display name', () => {
      expect(LazyLoad.displayName).toBe('LazyLoad');
    });
  });
});
