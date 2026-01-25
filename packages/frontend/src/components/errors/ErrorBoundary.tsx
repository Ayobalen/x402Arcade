import { Component, type ReactNode, type ErrorInfo } from 'react';
import { ErrorFallback } from './ErrorFallback';
import { getErrorLogger } from '@/utils/errorLogger';
import { getSentry } from '@/utils/sentry';

/**
 * Props for ErrorBoundary component
 */
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((props: ErrorFallbackProps) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

/**
 * Props passed to error fallback components
 */
export interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  resetError: () => void;
}

/**
 * State for ErrorBoundary component
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Global Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing
 * the entire application.
 *
 * Features:
 * - Catches errors during rendering, in lifecycle methods, and in constructors
 * - Logs errors to console in development
 * - Sends errors to Sentry in production
 * - Logs errors to local error logger
 * - Provides error recovery actions (retry, go home, reload)
 * - Styled with x402Arcade design system
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 *
 * @example With custom fallback
 * ```tsx
 * <ErrorBoundary
 *   fallback={({ error, resetError }) => (
 *     <CustomErrorPage error={error} onReset={resetError} />
 *   )}
 * >
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Update state so the next render will show the fallback UI
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Log error details when an error is caught
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Log to console in development
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('❌ ErrorBoundary caught an error:');
      // eslint-disable-next-line no-console
      console.error('Error:', error);
      // eslint-disable-next-line no-console
      console.error('Error Info:', errorInfo);
      // eslint-disable-next-line no-console
      console.error('Component Stack:', errorInfo.componentStack);
    }

    // Log to local error logger
    const errorLogger = getErrorLogger();
    errorLogger.logReactError(error, errorInfo.componentStack || undefined);

    // Send to Sentry
    const sentry = getSentry();
    sentry.captureError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Reset error state and retry rendering
   */
  resetError = (): void => {
    // Call custom reset handler if provided
    if (this.props.onReset) {
      this.props.onReset();
    }

    // Clear error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    // If there's an error, render fallback UI
    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        if (typeof fallback === 'function') {
          return fallback({
            error,
            errorInfo,
            resetError: this.resetError,
          });
        }
        return fallback;
      }

      // Use default ErrorFallback component
      return <ErrorFallback error={error} errorInfo={errorInfo} resetError={this.resetError} />;
    }

    // No error, render children normally
    return children;
  }
}
