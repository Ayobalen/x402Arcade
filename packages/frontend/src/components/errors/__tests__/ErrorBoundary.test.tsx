import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from '../ErrorBoundary';

// Mock child component that throws an error
const ThrowError = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

// Wrapper component for tests that need router
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('ErrorBoundary', () => {
  // Suppress console errors during tests to keep output clean
  const originalConsoleError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe('Normal rendering', () => {
    it('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child">Child content</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('renders multiple children without error', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child1">First child</div>
          <div data-testid="child2">Second child</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('child1')).toBeInTheDocument();
      expect(screen.getByTestId('child2')).toBeInTheDocument();
    });
  });

  describe('Error catching', () => {
    it('catches errors and displays default fallback UI', () => {
      render(
        <RouterWrapper>
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        </RouterWrapper>
      );

      // Should show error fallback with "GAME OVER" title
      expect(screen.getByText('GAME OVER')).toBeInTheDocument();
      expect(screen.getByText(/Something went wrong in the arcade/i)).toBeInTheDocument();
    });

    it('displays error message in development mode', () => {
      // Set DEV mode
      const originalDev = import.meta.env.DEV;
      import.meta.env.DEV = true;

      render(
        <RouterWrapper>
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        </RouterWrapper>
      );

      // Should show the error message (may be within a code block with other text)
      expect(screen.getByText(/Test error message/)).toBeInTheDocument();

      // Restore
      import.meta.env.DEV = originalDev;
    });

    it('generates error reference code', () => {
      render(
        <RouterWrapper>
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        </RouterWrapper>
      );

      // Should show error reference code starting with ERR-
      const errorRefElement = screen.getByText(/ERR-/);
      expect(errorRefElement).toBeInTheDocument();
    });

    it('shows recovery action buttons', () => {
      render(
        <RouterWrapper>
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        </RouterWrapper>
      );

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go to home/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
    });

    it('shows contact support link', () => {
      render(
        <RouterWrapper>
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        </RouterWrapper>
      );

      expect(screen.getByRole('button', { name: /contact support/i })).toBeInTheDocument();
    });
  });

  describe('Custom fallback', () => {
    it('renders custom fallback as ReactNode', () => {
      const customFallback = <div data-testid="custom-fallback">Custom error UI</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('Custom error UI')).toBeInTheDocument();
      // Should NOT show default fallback
      expect(screen.queryByText('GAME OVER')).not.toBeInTheDocument();
    });

    it('renders custom fallback as function', () => {
      const customFallback = ({ error, resetError }: any) => (
        <div>
          <p data-testid="error-msg">{error.message}</p>
          <button onClick={resetError}>Custom Reset</button>
        </div>
      );

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-msg')).toHaveTextContent('Test error message');
      expect(screen.getByRole('button', { name: /custom reset/i })).toBeInTheDocument();
    });

    it('passes error and resetError to custom fallback function', () => {
      const mockFallback = vi.fn(({ error, resetError }) => (
        <div>
          <span>{error.message}</span>
          <button onClick={resetError}>Reset</button>
        </div>
      ));

      render(
        <ErrorBoundary fallback={mockFallback}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(mockFallback).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Error),
          resetError: expect.any(Function),
        })
      );
    });
  });

  describe('Error handlers', () => {
    it('calls onError handler when error is caught', () => {
      const onError = vi.fn();

      render(
        <RouterWrapper>
          <ErrorBoundary onError={onError}>
            <ThrowError />
          </ErrorBoundary>
        </RouterWrapper>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Test error message' }),
        expect.any(Object)
      );
    });

    it('logs error to console in development', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      const originalDev = import.meta.env.DEV;
      import.meta.env.DEV = true;

      render(
        <RouterWrapper>
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        </RouterWrapper>
      );

      expect(consoleErrorSpy).toHaveBeenCalled();

      import.meta.env.DEV = originalDev;
    });

    it('logs error in production mode', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      const originalDev = import.meta.env.DEV;
      const originalProd = import.meta.env.PROD;
      import.meta.env.DEV = false;
      import.meta.env.PROD = true;

      render(
        <RouterWrapper>
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        </RouterWrapper>
      );

      expect(consoleErrorSpy).toHaveBeenCalled();

      import.meta.env.DEV = originalDev;
      import.meta.env.PROD = originalProd;
    });
  });

  describe('Error recovery', () => {
    it('resets error state when resetError is called', () => {
      const { rerender } = render(
        <RouterWrapper>
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>
        </RouterWrapper>
      );

      // Error fallback should be shown
      expect(screen.getByText('GAME OVER')).toBeInTheDocument();

      // Click Try Again button
      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      tryAgainButton.click();

      // Rerender with non-throwing child
      rerender(
        <RouterWrapper>
          <ErrorBoundary>
            <ThrowError shouldThrow={false} />
          </ErrorBoundary>
        </RouterWrapper>
      );

      // Error should be cleared
      expect(screen.queryByText('GAME OVER')).not.toBeInTheDocument();
      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('calls onReset handler when resetError is called', () => {
      const onReset = vi.fn();

      render(
        <RouterWrapper>
          <ErrorBoundary onReset={onReset}>
            <ThrowError />
          </ErrorBoundary>
        </RouterWrapper>
      );

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      tryAgainButton.click();

      expect(onReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes on error fallback', () => {
      render(
        <RouterWrapper>
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        </RouterWrapper>
      );

      const errorContainer = screen.getByRole('alert');
      expect(errorContainer).toHaveAttribute('aria-live', 'assertive');
    });

    it('has accessible button labels', () => {
      render(
        <RouterWrapper>
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        </RouterWrapper>
      );

      expect(screen.getByRole('button', { name: /try again.*recover/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go to home/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reload.*hard reset/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /contact support/i })).toBeInTheDocument();
    });
  });

  describe('Design system compliance', () => {
    it('displays x402Arcade branding', () => {
      render(
        <RouterWrapper>
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        </RouterWrapper>
      );

      expect(screen.getByText('x402 ARCADE')).toBeInTheDocument();
    });

    it('uses arcade-themed language', () => {
      render(
        <RouterWrapper>
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        </RouterWrapper>
      );

      // Should use gaming terminology
      expect(screen.getByText('GAME OVER')).toBeInTheDocument();
      expect(screen.getByText(/Something went wrong in the arcade/i)).toBeInTheDocument();
    });
  });
});
