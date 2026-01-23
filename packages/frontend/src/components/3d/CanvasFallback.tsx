/**
 * CanvasFallback - Fallback component for when WebGL is not available
 *
 * Displays a friendly error message with a static alternative image
 * and browser upgrade suggestions. Styled consistently with the dark
 * arcade theme.
 *
 * @module 3d/CanvasFallback
 */

import { backgrounds, text, borders, surfaces, primary, semantic } from '../../styles/tokens/colors'

// ============================================================================
// Types
// ============================================================================

export interface CanvasFallbackProps {
  /** Title text to display (default: "3D Not Available") */
  title?: string
  /** Description message explaining the issue */
  message?: string
  /** URL of a static fallback image to display */
  fallbackImage?: string
  /** Alt text for the fallback image */
  fallbackImageAlt?: string
  /** Show browser upgrade suggestions */
  showBrowserSuggestion?: boolean
  /** Custom CSS class for the container */
  className?: string
  /** Width of the fallback container (default: "100%") */
  width?: string | number
  /** Height of the fallback container (default: "400px") */
  height?: string | number
  /** Callback when user clicks "Try Again" button */
  onRetry?: () => void
  /** Show the retry button (default: true) */
  showRetryButton?: boolean
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_TITLE = '3D Not Available'
const DEFAULT_MESSAGE =
  'WebGL could not be initialized. This may be due to browser settings, hardware limitations, or an outdated browser.'

const SUPPORTED_BROWSERS = [
  { name: 'Chrome', version: '56+', url: 'https://www.google.com/chrome/' },
  { name: 'Firefox', version: '51+', url: 'https://www.mozilla.org/firefox/' },
  { name: 'Edge', version: '79+', url: 'https://www.microsoft.com/edge' },
  { name: 'Safari', version: '15+', url: 'https://www.apple.com/safari/' },
]

// ============================================================================
// Inline Styles (using design tokens)
// ============================================================================

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    background: backgrounds.tertiary,
    border: `1px solid ${borders.default}`,
    borderRadius: '16px',
    padding: '32px',
    textAlign: 'center' as const,
    fontFamily: 'Inter, system-ui, sans-serif',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  backgroundGlow: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '200%',
    height: '200%',
    background: `radial-gradient(ellipse at center, ${primary.glow} 0%, transparent 50%)`,
    opacity: 0.15,
    pointerEvents: 'none' as const,
  },
  iconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: surfaces.primary,
    border: `1px solid ${borders.default}`,
    marginBottom: '24px',
    position: 'relative' as const,
  },
  icon: {
    fontSize: '36px',
    color: semantic.warning,
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    color: text.primary,
    margin: '0 0 12px 0',
    lineHeight: 1.3,
  },
  message: {
    fontSize: '14px',
    color: text.secondary,
    margin: '0 0 24px 0',
    lineHeight: 1.6,
    maxWidth: '400px',
  },
  fallbackImageContainer: {
    width: '100%',
    maxWidth: '320px',
    marginBottom: '24px',
    borderRadius: '12px',
    overflow: 'hidden',
    border: `1px solid ${borders.subtle}`,
  },
  fallbackImage: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  browserSection: {
    width: '100%',
    maxWidth: '400px',
    padding: '16px',
    background: backgrounds.secondary,
    borderRadius: '12px',
    border: `1px solid ${borders.subtle}`,
    marginBottom: '24px',
  },
  browserSectionTitle: {
    fontSize: '12px',
    fontWeight: 500,
    color: text.muted,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    margin: '0 0 12px 0',
  },
  browserList: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
    gap: '12px',
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  browserItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
  },
  browserLink: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '12px 16px',
    background: surfaces.secondary,
    borderRadius: '8px',
    border: `1px solid ${borders.default}`,
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  },
  browserLinkHover: {
    background: surfaces.secondaryHover,
    borderColor: primary[600],
  },
  browserName: {
    fontSize: '13px',
    fontWeight: 500,
    color: text.primary,
  },
  browserVersion: {
    fontSize: '11px',
    color: text.muted,
  },
  retryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 500,
    color: backgrounds.primary,
    background: primary.DEFAULT,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: `0 0 20px ${primary.glow}`,
  },
  retryButtonHover: {
    background: primary.hover,
    boxShadow: `0 0 30px ${primary.glowStrong}`,
  },
  helpText: {
    fontSize: '12px',
    color: text.muted,
    marginTop: '16px',
  },
  helpLink: {
    color: primary.DEFAULT,
    textDecoration: 'none',
    transition: 'color 0.2s ease',
  },
}

// ============================================================================
// WebGL Detection Utility
// ============================================================================

/**
 * Checks if WebGL is supported and working in the current browser
 * @returns Object with support status and error details
 */
export function detectWebGLSupport(): {
  supported: boolean
  version: 1 | 2 | null
  error: string | null
} {
  try {
    const canvas = document.createElement('canvas')

    // Try WebGL 2 first
    const gl2 = canvas.getContext('webgl2')
    if (gl2) {
      return { supported: true, version: 2, error: null }
    }

    // Fall back to WebGL 1
    const gl1 = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (gl1) {
      return { supported: true, version: 1, error: null }
    }

    return {
      supported: false,
      version: null,
      error: 'WebGL is not supported by this browser',
    }
  } catch (e) {
    return {
      supported: false,
      version: null,
      error: e instanceof Error ? e.message : 'Unknown error detecting WebGL support',
    }
  }
}

// ============================================================================
// Icon Component (inline SVG to avoid dependencies)
// ============================================================================

function WarningIcon({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={semantic.warning}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function RefreshIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
    </svg>
  )
}

// ============================================================================
// Browser Link Component
// ============================================================================

interface BrowserLinkProps {
  name: string
  version: string
  url: string
}

function BrowserLink({ name, version, url }: BrowserLinkProps) {
  return (
    <li style={styles.browserItem}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={styles.browserLink}
        onMouseEnter={(e) => {
          Object.assign(e.currentTarget.style, styles.browserLinkHover)
        }}
        onMouseLeave={(e) => {
          Object.assign(e.currentTarget.style, styles.browserLink)
        }}
        data-testid={`browser-link-${name.toLowerCase()}`}
      >
        <span style={styles.browserName}>{name}</span>
        <span style={styles.browserVersion}>{version}</span>
      </a>
    </li>
  )
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * CanvasFallback - Displays when WebGL/Three.js cannot be initialized
 *
 * Shows a user-friendly error message with options to:
 * - View a static fallback image
 * - See browser upgrade suggestions
 * - Retry initialization
 *
 * @example
 * ```tsx
 * <CanvasFallback
 *   title="3D View Unavailable"
 *   message="Your browser doesn't support WebGL"
 *   fallbackImage="/static/arcade-cabinet.png"
 *   onRetry={() => window.location.reload()}
 * />
 * ```
 */
export function CanvasFallback({
  title = DEFAULT_TITLE,
  message = DEFAULT_MESSAGE,
  fallbackImage,
  fallbackImageAlt = 'Arcade cabinet static image',
  showBrowserSuggestion = true,
  className = '',
  width = '100%',
  height = '400px',
  onRetry,
  showRetryButton = true,
}: CanvasFallbackProps) {
  const containerStyle = {
    ...styles.container,
    width: typeof width === 'number' ? `${width}px` : width,
    minHeight: typeof height === 'number' ? `${height}px` : height,
  }

  return (
    <div
      className={className}
      style={containerStyle}
      role="alert"
      aria-live="polite"
      data-testid="canvas-fallback"
    >
      {/* Background glow effect */}
      <div style={styles.backgroundGlow} aria-hidden="true" />

      {/* Warning icon */}
      <div style={styles.iconContainer} data-testid="canvas-fallback-icon">
        <WarningIcon />
      </div>

      {/* Title */}
      <h2 style={styles.title} data-testid="canvas-fallback-title">
        {title}
      </h2>

      {/* Message */}
      <p style={styles.message} data-testid="canvas-fallback-message">
        {message}
      </p>

      {/* Fallback image */}
      {fallbackImage && (
        <div style={styles.fallbackImageContainer}>
          <img
            src={fallbackImage}
            alt={fallbackImageAlt}
            style={styles.fallbackImage}
            data-testid="canvas-fallback-image"
          />
        </div>
      )}

      {/* Browser suggestions */}
      {showBrowserSuggestion && (
        <div style={styles.browserSection} data-testid="canvas-fallback-browsers">
          <h3 style={styles.browserSectionTitle}>Recommended Browsers</h3>
          <ul style={styles.browserList}>
            {SUPPORTED_BROWSERS.map((browser) => (
              <BrowserLink
                key={browser.name}
                name={browser.name}
                version={browser.version}
                url={browser.url}
              />
            ))}
          </ul>
        </div>
      )}

      {/* Retry button */}
      {showRetryButton && onRetry && (
        <button
          onClick={onRetry}
          style={styles.retryButton}
          onMouseEnter={(e) => {
            Object.assign(e.currentTarget.style, styles.retryButtonHover)
          }}
          onMouseLeave={(e) => {
            Object.assign(e.currentTarget.style, styles.retryButton)
          }}
          data-testid="canvas-fallback-retry"
          type="button"
        >
          <RefreshIcon />
          Try Again
        </button>
      )}

      {/* Help text */}
      <p style={styles.helpText}>
        Need help?{' '}
        <a
          href="https://get.webgl.org/"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.helpLink}
          data-testid="canvas-fallback-help-link"
        >
          Check WebGL support
        </a>
      </p>
    </div>
  )
}

// ============================================================================
// Exports
// ============================================================================

export default CanvasFallback
