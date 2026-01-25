import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ErrorFallback } from '../ErrorFallback';

// Mock useNavigate from react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Helper to create test error
const createTestError = (message = 'Test error') => {
  const error = new Error(message);
  error.stack = `Error: ${message}\n    at TestComponent (test.tsx:10:15)`;
  return error;
};

// Helper to create error info
const createErrorInfo = () => ({
  componentStack: '\n    at TestComponent (test.tsx:10:15)\n    at ErrorBoundary',
});

// Wrapper for components that need router
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('ErrorFallback', () => {
  const mockResetError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders error fallback UI', () => {
      const error = createTestError();
      const errorInfo = createErrorInfo();

      render(
        <RouterWrapper>
          <ErrorFallback error={error} errorInfo={errorInfo} resetError={mockResetError} />
        </RouterWrapper>
      );

      expect(screen.getByText('GAME OVER')).toBeInTheDocument();
      expect(screen.getByText(/Something went wrong in the arcade/i)).toBeInTheDocument();
    });

    it('displays error reference code', () => {
      const error = createTestError();

      render(
        <RouterWrapper>
          <ErrorFallback error={error} errorInfo={null} resetError={mockResetError} />
        </RouterWrapper>
      );

      // Should show ERR- prefix
      const errorRef = screen.getByText(/ERR-/);
      expect(errorRef).toBeInTheDocument();
      // Should be in uppercase
      expect(errorRef.textContent).toMatch(/^ERR-[A-Z0-9]+$/);
    });

    it('displays reassuring message', () => {
      const error = createTestError();

      render(
        <RouterWrapper>
          <ErrorFallback error={error} errorInfo={null} resetError={mockResetError} />
        </RouterWrapper>
      );

      expect(screen.getByText(/your progress is safe/i)).toBeInTheDocument();
    });

    it('displays x402Arcade branding', () => {
      const error = createTestError();

      render(
        <RouterWrapper>
          <ErrorFallback error={error} errorInfo={null} resetError={mockResetError} />
        </RouterWrapper>
      );

      expect(screen.getByText('x402 ARCADE')).toBeInTheDocument();
    });
  });

  describe('Error details (development mode)', () => {
    it('shows error message in development', () => {
      const originalDev = import.meta.env.DEV;
      import.meta.env.DEV = true;

      const error = createTestError('Custom error message');

      render(
        <RouterWrapper>
          <ErrorFallback error={error} errorInfo={null} resetError={mockResetError} />
        </RouterWrapper>
      );

      expect(screen.getByText(/Custom error message/)).toBeInTheDocument();

      import.meta.env.DEV = originalDev;
    });

    it('shows error stack in development', () => {
      const originalDev = import.meta.env.DEV;
      import.meta.env.DEV = true;

      const error = createTestError('Test error');
      error.stack = 'Error: Test error\n    at Component (file.tsx:10:15)';

      render(
        <RouterWrapper>
          <ErrorFallback error={error} errorInfo={null} resetError={mockResetError} />
        </RouterWrapper>
      );

      expect(screen.getByText(/at Component/)).toBeInTheDocument();

      import.meta.env.DEV = originalDev;
    });

    it('hides error details in production', () => {
      const originalDev = import.meta.env.DEV;
      import.meta.env.DEV = false;

      const error = createTestError('Secret error message');

      render(
        <RouterWrapper>
          <ErrorFallback error={error} errorInfo={null} resetError={mockResetError} />
        </RouterWrapper>
      );

      // Should NOT show error message
      expect(screen.queryByText(/Secret error message/)).not.toBeInTheDocument();
      // Should NOT show "Development Only" label
      expect(screen.queryByText(/Development Only/i)).not.toBeInTheDocument();

      import.meta.env.DEV = originalDev;
    });
  });

  describe('Recovery actions', () => {
    it('renders all recovery buttons', () => {
      const error = createTestError();

      render(
        <RouterWrapper>
          <ErrorFallback error={error} errorInfo={null} resetError={mockResetError} />
        </RouterWrapper>
      );

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go to home/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /contact support/i })).toBeInTheDocument();
    });

    it('calls resetError when Try Again is clicked', () => {
      const error = createTestError();

      render(
        <RouterWrapper>
          <ErrorFallback error={error} errorInfo={null} resetError={mockResetError} />
        </RouterWrapper>
      );

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(tryAgainButton);

      expect(mockResetError).toHaveBeenCalledTimes(1);
    });

    it('navigates to home and resets when Go Home is clicked', () => {
      const error = createTestError();

      render(
        <RouterWrapper>
          <ErrorFallback error={error} errorInfo={null} resetError={mockResetError} />
        </RouterWrapper>
      );

      const goHomeButton = screen.getByRole('button', { name: /go to home/i });
      fireEvent.click(goHomeButton);

      expect(mockResetError).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('reloads page when Reload Page is clicked', () => {
      const error = createTestError();
      const mockReload = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true,
      });

      render(
        <RouterWrapper>
          <ErrorFallback error={error} errorInfo={null} resetError={mockResetError} />
        </RouterWrapper>
      );

      const reloadButton = screen.getByRole('button', { name: /reload page/i });
      fireEvent.click(reloadButton);

      expect(mockReload).toHaveBeenCalledTimes(1);
    });

    it('opens email client when Contact Support is clicked', () => {
      const error = createTestError('Support needed');
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, href: '' } as any;

      render(
        <RouterWrapper>
          <ErrorFallback error={error} errorInfo={null} resetError={mockResetError} />
        </RouterWrapper>
      );

      const supportButton = screen.getByRole('button', { name: /contact support/i });
      fireEvent.click(supportButton);

      // Should set location.href to mailto link
      expect(window.location.href).toContain('mailto:support@x402arcade.com');
      expect(window.location.href).toContain('subject=');
      expect(window.location.href).toContain('body=');

      // Restore
      window.location = originalLocation as any;
    });

    it('includes error details in support email', () => {
      const error = createTestError('Email test error');
      const errorInfo = createErrorInfo();
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, href: '' } as any;

      render(
        <RouterWrapper>
          <ErrorFallback error={error} errorInfo={errorInfo} resetError={mockResetError} />
        </RouterWrapper>
      );

      const supportButton = screen.getByRole('button', { name: /contact support/i });
      fireEvent.click(supportButton);

      const href = window.location.href;
      // Check that body includes error message
      expect(href).toContain(encodeURIComponent('Email test error'));
      // Check that body includes component stack
      expect(href).toContain(encodeURIComponent('Component Stack'));

      window.location = originalLocation as any;
    });
  });

  describe('Accessibility', () => {
    it('has alert role with assertive aria-live', () => {
      const error = createTestError();

      render(
        <RouterWrapper>
          <ErrorFallback error={error} errorInfo={null} resetError={mockResetError} />
        </RouterWrapper>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });

    it('has descriptive aria-labels on buttons', () => {
      const error = createTestError();

      render(
        <RouterWrapper>
          <ErrorFallback error={error} errorInfo={null} resetError={mockResetError} />
        </RouterWrapper>
      );

      expect(screen.getByRole('button', { name: /try again.*recover/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go.*home/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reload.*hard reset/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /contact support/i })).toBeInTheDocument();
    });

    it('marks icons as aria-hidden', () => {
      const error = createTestError();

      render(
        <RouterWrapper>
          <ErrorFallback error={error} errorInfo={null} resetError={mockResetError} />
        </RouterWrapper>
      );

      // All icons should have aria-hidden="true"
      const container = screen.getByRole('alert');
      const icons = container.querySelectorAll('svg');

      icons.forEach((icon) => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('Visual design', () => {
    it('uses retro arcade aesthetic', () => {
      const error = createTestError();

      render(
        <RouterWrapper>
          <ErrorFallback error={error} errorInfo={null} resetError={mockResetError} />
        </RouterWrapper>
      );

      // Should use "GAME OVER" instead of generic "Error"
      expect(screen.getByText('GAME OVER')).toBeInTheDocument();
      // Should use arcade language
      expect(screen.getByText(/Something went wrong in the arcade/i)).toBeInTheDocument();
    });

    it('displays error icon with visual styling', () => {
      const error = createTestError();

      const { container } = render(
        <RouterWrapper>
          <ErrorFallback error={error} errorInfo={null} resetError={mockResetError} />
        </RouterWrapper>
      );

      // Icon container should exist
      const iconContainer = container.querySelector('svg');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Error info handling', () => {
    it('handles null errorInfo gracefully', () => {
      const error = createTestError();

      render(
        <RouterWrapper>
          <ErrorFallback error={error} errorInfo={null} resetError={mockResetError} />
        </RouterWrapper>
      );

      // Should still render without crashing
      expect(screen.getByText('GAME OVER')).toBeInTheDocument();
    });

    it('handles errors without stack trace', () => {
      const error = createTestError();
      delete error.stack;

      render(
        <RouterWrapper>
          <ErrorFallback error={error} errorInfo={null} resetError={mockResetError} />
        </RouterWrapper>
      );

      // Should still render
      expect(screen.getByText('GAME OVER')).toBeInTheDocument();
    });
  });
});
