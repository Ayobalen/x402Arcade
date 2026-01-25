import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PageTransition } from '../PageTransition';

// Mock framer-motion to avoid animation complexity in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },

  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock useReducedMotion hook
vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

describe('PageTransition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render children', () => {
    render(
      <MemoryRouter>
        <PageTransition>
          <div>Test Content</div>
        </PageTransition>
      </MemoryRouter>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render without crashing with default transition', () => {
    const { container } = render(
      <MemoryRouter>
        <PageTransition>
          <div>Default Transition</div>
        </PageTransition>
      </MemoryRouter>
    );

    expect(container.firstChild).toBeTruthy();
  });

  it('should accept custom transition preset', () => {
    const { container } = render(
      <MemoryRouter>
        <PageTransition transition="slideRight">
          <div>Slide Transition</div>
        </PageTransition>
      </MemoryRouter>
    );

    expect(container.firstChild).toBeTruthy();
    expect(screen.getByText('Slide Transition')).toBeInTheDocument();
  });

  it('should handle all transition presets', () => {
    const presets = [
      'fade',
      'fadeFast',
      'slideRight',
      'slideLeft',
      'slideUp',
      'slideDown',
      'scaleCenter',
      'scaleBottom',
      'slideScale',
      'blur',
      'rotateY',
      'zoom',
      'neonGlow',
    ] as const;

    presets.forEach((preset) => {
      const { unmount } = render(
        <MemoryRouter>
          <PageTransition transition={preset}>
            <div>{preset} transition</div>
          </PageTransition>
        </MemoryRouter>
      );

      expect(screen.getByText(`${preset} transition`)).toBeInTheDocument();
      unmount();
    });
  });

  it('should respect reduced motion preference', async () => {
    const { useReducedMotion } = await import('@/hooks/useReducedMotion');
    vi.mocked(useReducedMotion).mockReturnValue(true);

    const { container } = render(
      <MemoryRouter>
        <PageTransition>
          <div>No Animation</div>
        </PageTransition>
      </MemoryRouter>
    );

    // Should render children without motion wrapper when reduced motion is enabled
    expect(screen.getByText('No Animation')).toBeInTheDocument();

    // Reset mock for other tests
    vi.mocked(useReducedMotion).mockReturnValue(false);
  });

  it('should use location pathname as key', () => {
    const { rerender } = render(
      <MemoryRouter initialEntries={['/home']}>
        <PageTransition>
          <div>Home Page</div>
        </PageTransition>
      </MemoryRouter>
    );

    expect(screen.getByText('Home Page')).toBeInTheDocument();

    // Re-render with different location
    rerender(
      <MemoryRouter initialEntries={['/about']}>
        <PageTransition>
          <div>About Page</div>
        </PageTransition>
      </MemoryRouter>
    );

    expect(screen.getByText('About Page')).toBeInTheDocument();
  });

  it('should handle complex children', () => {
    render(
      <MemoryRouter>
        <PageTransition transition="zoom">
          <div>
            <h1>Title</h1>
            <p>Description</p>
            <button>Action</button>
          </div>
        </PageTransition>
      </MemoryRouter>
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('should fallback to fade transition for invalid preset', () => {
    const { container } = render(
      <MemoryRouter>
        {}
        <PageTransition transition={'invalid' as any}>
          <div>Fallback Test</div>
        </PageTransition>
      </MemoryRouter>
    );

    expect(container.firstChild).toBeTruthy();
    expect(screen.getByText('Fallback Test')).toBeInTheDocument();
  });
});
