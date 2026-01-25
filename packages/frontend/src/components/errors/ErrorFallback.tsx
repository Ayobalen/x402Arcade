import { type ErrorInfo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCw, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * Props for ErrorFallback component
 */
export interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  resetError: () => void;
}

/**
 * Error Fallback UI Component
 *
 * A friendly, arcade-themed error page that displays when the app crashes.
 * Provides multiple recovery options and maintains x402Arcade branding.
 *
 * Design Features:
 * - Retro arcade aesthetic with neon colors
 * - Clear error messaging without technical jargon
 * - Multiple recovery actions (Try Again, Go Home, Reload Page)
 * - Contact support link
 * - Error reference code for debugging
 * - Accessible with proper ARIA labels
 *
 * @example
 * ```tsx
 * <ErrorFallback
 *   error={new Error('Something went wrong')}
 *   errorInfo={errorInfo}
 *   resetError={() => window.location.reload()}
 * />
 * ```
 */
export function ErrorFallback({ error, errorInfo, resetError }: ErrorFallbackProps) {
  const navigate = useNavigate();

  // Generate error reference code (timestamp + hash)
  const errorRef = `ERR-${Date.now().toString(36).toUpperCase()}`;

  /**
   * Navigate to home page and reset error
   */
  const handleGoHome = () => {
    resetError();
    navigate('/');
  };

  /**
   * Reload the entire page (hard reset)
   */
  const handleReload = () => {
    window.location.reload();
  };

  /**
   * Open email client with pre-filled error report
   */
  const handleContactSupport = () => {
    const subject = encodeURIComponent(`x402Arcade Error Report - ${errorRef}`);
    const body = encodeURIComponent(
      `Error Reference: ${errorRef}\n\n` +
        `Error Message: ${error.message}\n\n` +
        `Error Stack: ${error.stack}\n\n` +
        `Component Stack: ${errorInfo?.componentStack || 'N/A'}\n\n` +
        `Please describe what you were doing when this error occurred:\n\n`
    );
    window.location.href = `mailto:support@x402arcade.com?subject=${subject}&body=${body}`;
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          'linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%)',
      }}
      role="alert"
      aria-live="assertive"
    >
      <div className="max-w-2xl w-full">
        {/* Error Icon and Title */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6"
            style={{
              background: 'var(--color-surface-primary)',
              border: '2px solid var(--color-error)',
              boxShadow: 'var(--glow-red)',
            }}
          >
            <AlertTriangle
              className="w-12 h-12"
              style={{ color: 'var(--color-error)' }}
              aria-hidden="true"
            />
          </div>

          <h1
            className="font-display text-4xl md:text-5xl font-bold mb-4"
            style={{
              color: 'var(--color-text-primary)',
              textShadow: 'var(--glow-cyan)',
              letterSpacing: 'var(--tracking-wide)',
            }}
          >
            GAME OVER
          </h1>

          <p className="text-lg md:text-xl mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Oops! Something went wrong in the arcade.
          </p>

          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            Don't worry, your progress is safe. Try one of the options below to continue playing.
          </p>
        </div>

        {/* Error Details Card */}
        <div
          className="rounded-xl p-6 mb-8"
          style={{
            background: 'var(--color-surface-primary)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div className="mb-4">
            <h2
              className="text-sm font-semibold mb-2"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Error Reference:
            </h2>
            <code
              className="font-code text-sm px-3 py-2 rounded block"
              style={{
                background: 'var(--color-bg-secondary)',
                color: 'var(--color-primary)',
                fontFamily: 'var(--font-code)',
              }}
            >
              {errorRef}
            </code>
          </div>

          {import.meta.env.DEV && (
            <div>
              <h2
                className="text-sm font-semibold mb-2"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Error Details (Development Only):
              </h2>
              <code
                className="font-code text-xs px-3 py-2 rounded block overflow-x-auto"
                style={{
                  background: 'var(--color-bg-secondary)',
                  color: 'var(--color-error-light)',
                  fontFamily: 'var(--font-code)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {error.message}
                {error.stack && (
                  <>
                    {'\n\n'}
                    {error.stack}
                  </>
                )}
              </code>
            </div>
          )}
        </div>

        {/* Recovery Actions */}
        <div className="grid gap-4 mb-6">
          {/* Try Again Button */}
          <Button
            onClick={resetError}
            variant="primary"
            size="lg"
            className="w-full group"
            aria-label="Try again - attempt to recover from error"
          >
            <RefreshCw className="w-5 h-5 mr-2 group-hover:animate-spin" aria-hidden="true" />
            Try Again
          </Button>

          {/* Go Home Button */}
          <Button
            onClick={handleGoHome}
            variant="secondary"
            size="lg"
            className="w-full"
            aria-label="Go to home page"
          >
            <Home className="w-5 h-5 mr-2" aria-hidden="true" />
            Go Home
          </Button>

          {/* Reload Page Button */}
          <Button
            onClick={handleReload}
            variant="outline"
            size="lg"
            className="w-full"
            aria-label="Reload page - performs a hard reset"
          >
            <RefreshCw className="w-5 h-5 mr-2" aria-hidden="true" />
            Reload Page
          </Button>
        </div>

        {/* Contact Support Link */}
        <div className="text-center">
          <button
            onClick={handleContactSupport}
            className="inline-flex items-center gap-2 text-sm transition-colors duration-200"
            style={{
              color: 'var(--color-text-tertiary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-text-tertiary)';
            }}
            aria-label="Contact support team"
          >
            <Mail className="w-4 h-4" aria-hidden="true" />
            Contact Support
          </button>
        </div>

        {/* x402Arcade Branding */}
        <div className="text-center mt-8">
          <p
            className="font-display text-sm"
            style={{
              color: 'var(--color-text-muted)',
              letterSpacing: 'var(--tracking-wider)',
            }}
          >
            x402 ARCADE
          </p>
        </div>
      </div>
    </div>
  );
}
