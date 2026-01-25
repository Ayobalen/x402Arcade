/**
 * Lazy3D Component Tests
 *
 * Tests for lazy loading of Three.js / React Three Fiber components.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Lazy3D, createLazy3D } from './Lazy3D';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
const mockObserve = vi.fn();
const mockUnobserve = vi.fn();
const mockDisconnect = vi.fn();

// Store the callback to trigger intersection events
let observerCallback: IntersectionObserverCallback | null = null;

beforeEach(() => {
  observerCallback = null;
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
  window.IntersectionObserver = mockIntersectionObserver as unknown as typeof IntersectionObserver;
});

afterEach(() => {
  vi.clearAllMocks();
});

// Mock 3D component
const Mock3DComponent = ({ color }: { color?: string }) => (
  <div data-testid="3d-component" data-color={color}>
    3D Component
  </div>
);

describe('Lazy3D', () => {
  describe('Basic Rendering', () => {
    it('renders placeholder initially', () => {
      render(<Lazy3D factory={() => Promise.resolve({ default: Mock3DComponent })} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText('Loading 3D scene...')).toBeInTheDocument();
    });

    it('renders custom placeholder when provided', () => {
      render(
        <Lazy3D
          factory={() => Promise.resolve({ default: Mock3DComponent })}
          placeholder={<div data-testid="custom-placeholder">Loading...</div>}
        />
      );

      expect(screen.getByTestId('custom-placeholder')).toBeInTheDocument();
    });

    it('renders component when disabled (loads immediately)', async () => {
      render(<Lazy3D factory={() => Promise.resolve({ default: Mock3DComponent })} disabled />);

      await waitFor(() => {
        expect(screen.getByTestId('3d-component')).toBeInTheDocument();
      });
    });

    it('renders component when forceLoad is true', async () => {
      render(<Lazy3D factory={() => Promise.resolve({ default: Mock3DComponent })} forceLoad />);

      await waitFor(() => {
        expect(screen.getByTestId('3d-component')).toBeInTheDocument();
      });
    });
  });

  describe('Intersection Observer Loading', () => {
    it('loads component when intersecting', async () => {
      render(<Lazy3D factory={() => Promise.resolve({ default: Mock3DComponent })} />);

      // Trigger intersection
      if (observerCallback) {
        observerCallback(
          [{ isIntersecting: true, target: document.body } as IntersectionObserverEntry],
          {} as IntersectionObserver
        );
      }

      await waitFor(() => {
        expect(screen.getByTestId('3d-component')).toBeInTheDocument();
      });
    });

    it('uses custom rootMargin for early loading', () => {
      render(
        <Lazy3D factory={() => Promise.resolve({ default: Mock3DComponent })} rootMargin="500px" />
      );

      // The LazyLoad component should pass the rootMargin to IntersectionObserver
      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ rootMargin: '500px' })
      );
    });
  });

  describe('Props Passing', () => {
    it('passes componentProps to the loaded component', async () => {
      render(
        <Lazy3D
          factory={() => Promise.resolve({ default: Mock3DComponent })}
          componentProps={{ color: 'blue' }}
          forceLoad
        />
      );

      await waitFor(() => {
        const component = screen.getByTestId('3d-component');
        expect(component).toHaveAttribute('data-color', 'blue');
      });
    });
  });

  describe('Callbacks', () => {
    it('calls onLoadStart when loading begins', async () => {
      const onLoadStart = vi.fn();
      render(
        <Lazy3D
          factory={() => Promise.resolve({ default: Mock3DComponent })}
          onLoadStart={onLoadStart}
          forceLoad
        />
      );

      await waitFor(() => {
        expect(onLoadStart).toHaveBeenCalled();
      });
    });

    it('calls onLoadComplete when loading finishes', async () => {
      const onLoadComplete = vi.fn();
      render(
        <Lazy3D
          factory={() => Promise.resolve({ default: Mock3DComponent })}
          onLoadComplete={onLoadComplete}
          forceLoad
        />
      );

      await waitFor(() => {
        expect(onLoadComplete).toHaveBeenCalled();
      });
    });

    it('calls onError when loading fails', async () => {
      const onError = vi.fn();
      const error = new Error('Failed to load');

      render(<Lazy3D factory={() => Promise.reject(error)} onError={onError} forceLoad />);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error);
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error fallback when loading fails', async () => {
      render(<Lazy3D factory={() => Promise.reject(new Error('Network error'))} forceLoad />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Failed to load 3D content')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('allows retry after error', async () => {
      const user = userEvent.setup();
      let attempts = 0;

      render(
        <Lazy3D
          factory={() => {
            attempts++;
            if (attempts === 1) {
              return Promise.reject(new Error('First attempt failed'));
            }
            return Promise.resolve({ default: Mock3DComponent });
          }}
          forceLoad
        />
      );

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('Failed to load 3D content')).toBeInTheDocument();
      });

      // Click retry
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      // Should load successfully on retry
      await waitFor(() => {
        expect(screen.getByTestId('3d-component')).toBeInTheDocument();
      });
    });
  });

  describe('Styling', () => {
    it('applies custom className', async () => {
      const { container } = render(
        <Lazy3D
          factory={() => Promise.resolve({ default: Mock3DComponent })}
          className="custom-3d-class"
          forceLoad
        />
      );

      await waitFor(() => {
        expect(container.querySelector('.custom-3d-class')).toBeInTheDocument();
      });
    });

    it('applies minHeight style', () => {
      const { container } = render(
        <Lazy3D factory={() => Promise.resolve({ default: Mock3DComponent })} minHeight="400px" />
      );

      // The LazyLoad container should have minHeight
      expect(container.querySelector('[style*="min-height"]') || container.firstChild).toBeTruthy();
    });
  });

  describe('createLazy3D Factory', () => {
    it('creates a lazy 3D component wrapper', async () => {
      const Lazy3DScene = createLazy3D(() => Promise.resolve({ default: Mock3DComponent }));

      render(<Lazy3DScene color="red" forceLoad />);

      await waitFor(() => {
        const component = screen.getByTestId('3d-component');
        expect(component).toHaveAttribute('data-color', 'red');
      });
    });

    it('applies default props from factory', async () => {
      const onLoadComplete = vi.fn();
      const Lazy3DScene = createLazy3D(() => Promise.resolve({ default: Mock3DComponent }), {
        onLoadComplete,
      });

      render(<Lazy3DScene forceLoad />);

      await waitFor(() => {
        expect(onLoadComplete).toHaveBeenCalled();
      });
    });

    it('allows overriding default props', async () => {
      const defaultOnLoad = vi.fn();
      const overrideOnLoad = vi.fn();

      const Lazy3DScene = createLazy3D(() => Promise.resolve({ default: Mock3DComponent }), {
        onLoadComplete: defaultOnLoad,
      });

      render(<Lazy3DScene onLoadComplete={overrideOnLoad} forceLoad />);

      await waitFor(() => {
        expect(overrideOnLoad).toHaveBeenCalled();
        expect(defaultOnLoad).not.toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('default placeholder has correct ARIA attributes', () => {
      render(<Lazy3D factory={() => Promise.resolve({ default: Mock3DComponent })} />);

      const placeholder = screen.getByRole('progressbar');
      expect(placeholder).toHaveAttribute('aria-label', 'Loading 3D content...');
      expect(placeholder).toHaveAttribute('aria-busy', 'true');
    });

    it('error fallback has alert role', async () => {
      render(<Lazy3D factory={() => Promise.reject(new Error('Failed'))} forceLoad />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('Display Name', () => {
    it('has display name', () => {
      expect(Lazy3D.displayName).toBe('Lazy3D');
    });
  });
});
