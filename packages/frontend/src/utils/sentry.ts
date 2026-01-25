/**
 * Sentry Error Tracking Integration
 *
 * Integrates Sentry for production error tracking with:
 * - Environment-based configuration
 * - Release tracking
 * - User context management
 * - Automatic breadcrumb capture
 * - Custom breadcrumb helpers
 *
 * @module utils/sentry
 */

import type { AppError, ErrorSeverity } from '../types/errors';

// ============================================================================
// Types
// ============================================================================

/**
 * Sentry initialization options
 */
export interface SentryConfig {
  /** Sentry DSN (required) */
  dsn: string;
  /** Environment name */
  environment: 'development' | 'staging' | 'production';
  /** Release version */
  release?: string;
  /** Sample rate for error events (0.0 to 1.0) */
  sampleRate: number;
  /** Sample rate for transactions/performance (0.0 to 1.0) */
  tracesSampleRate: number;
  /** Whether to enable in development */
  enableInDev: boolean;
  /** Whether to enable debug mode */
  debug: boolean;
  /** Maximum breadcrumbs to retain */
  maxBreadcrumbs: number;
}

/**
 * Sentry user context
 */
export interface SentryUser {
  /** Unique user identifier (wallet address) */
  id?: string;
  /** Username or display name */
  username?: string;
  /** User email (if available) */
  email?: string;
  /** Additional user data */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * Breadcrumb types for categorization
 */
export type BreadcrumbType =
  | 'navigation'
  | 'click'
  | 'api'
  | 'game'
  | 'wallet'
  | 'payment'
  | 'error'
  | 'info';

/**
 * Breadcrumb data structure
 */
export interface Breadcrumb {
  /** Breadcrumb type/category */
  type: BreadcrumbType;
  /** Short description of the action */
  message: string;
  /** Additional data */
  data?: Record<string, unknown>;
  /** Severity level */
  level: 'debug' | 'info' | 'warning' | 'error';
  /** Timestamp */
  timestamp: number;
}

/**
 * Sentry scope tags
 */
export interface SentryTags {
  /** Current game being played */
  game?: string;
  /** Game session ID */
  sessionId?: string;
  /** Wallet connection status */
  walletConnected?: string;
  /** Current route/page */
  route?: string;
  /** Quality preset */
  qualityPreset?: string;
  /** Network status */
  networkStatus?: string;
}

// ============================================================================
// Default Configuration
// ============================================================================

const defaultConfig: SentryConfig = {
  dsn: import.meta.env.VITE_SENTRY_DSN || '',
  environment: import.meta.env.PROD ? 'production' : 'development',
  release: import.meta.env.VITE_APP_VERSION || '0.1.0',
  sampleRate: 1.0, // Capture all errors
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in prod, 100% in dev
  enableInDev: false,
  debug: import.meta.env.DEV,
  maxBreadcrumbs: 100,
};

// ============================================================================
// Sentry Manager Class
// ============================================================================

/**
 * Sentry integration manager
 *
 * Provides a wrapper around Sentry SDK with game-specific helpers.
 * In development without Sentry DSN, logs to console instead.
 *
 * @example
 * ```typescript
 * const sentry = SentryManager.getInstance()
 * sentry.initialize({ dsn: 'https://...' })
 *
 * // Capture an error
 * sentry.captureError(error, { game: 'snake', sessionId: '123' })
 *
 * // Add a breadcrumb
 * sentry.addBreadcrumb('click', 'User clicked Play button')
 * ```
 */
export class SentryManager {
  private static instance: SentryManager;
  private config: SentryConfig;
  private isInitialized = false;
  private breadcrumbs: Breadcrumb[] = [];
  private _user: SentryUser | null = null;
  private tags: SentryTags = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private sentrySDK: any = null;

  /** Get current user context */
  get user(): SentryUser | null {
    return this._user;
  }

  private constructor() {
    this.config = { ...defaultConfig };
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): SentryManager {
    if (!SentryManager.instance) {
      SentryManager.instance = new SentryManager();
    }
    return SentryManager.instance;
  }

  /**
   * Initialize Sentry
   */
  async initialize(config: Partial<SentryConfig> = {}): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.config = { ...this.config, ...config };

    // Don't initialize in development unless explicitly enabled
    const shouldInit = this.config.dsn && (import.meta.env.PROD || this.config.enableInDev);

    if (shouldInit) {
      try {
        // Dynamically import Sentry to avoid bundle bloat when not used
        // @ts-expect-error - Sentry is optionally installed
        const Sentry = await import('@sentry/react');
        this.sentrySDK = Sentry;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const initConfig: any = {
          dsn: this.config.dsn,
          environment: this.config.environment,
          release: this.config.release,
          sampleRate: this.config.sampleRate,
          tracesSampleRate: this.config.tracesSampleRate,
          debug: this.config.debug,
          maxBreadcrumbs: this.config.maxBreadcrumbs,

          // Configure automatic breadcrumbs
          integrations: [
            Sentry.browserTracingIntegration?.() ?? null,
            Sentry.replayIntegration?.({
              maskAllText: false,
              blockAllMedia: false,
            }) ?? null,
          ].filter(Boolean),

          // Filter out known non-issues
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          beforeSend(event: any) {
            // Don't send cancelled fetch requests
            if (event.exception?.values?.[0]?.value?.includes('AbortError')) {
              return null;
            }
            return event;
          },

          // Add custom tags
          initialScope: {
            tags: {
              app: 'x402arcade',
            },
          },
        };

        Sentry.init(initConfig);

        this.isInitialized = true;

        if (this.config.debug) {
          // Intentional console for debugging
          globalThis.console.log('[Sentry] Initialized with config:', {
            environment: this.config.environment,
            release: this.config.release,
            sampleRate: this.config.sampleRate,
          });
        }
      } catch {
        // Sentry not installed, fall back to console logging
        // Intentional console warning for debugging
        globalThis.console.warn('[Sentry] SDK not installed, using console logging fallback');
        this.isInitialized = true; // Mark as initialized to prevent retry
      }
    } else {
      // In dev without DSN, just mark as initialized
      this.isInitialized = true;
      if (this.config.debug) {
        // Intentional console for debugging
        globalThis.console.log('[Sentry] Skipping initialization (development mode or no DSN)');
      }
    }
  }

  /**
   * Capture an error and send to Sentry
   */
  captureError(
    error: Error | AppError | unknown,
    context?: Record<string, unknown>
  ): string | null {
    const errorObj = error instanceof Error ? error : new Error(String(error));

    // Add context as extra data
    const extras = {
      ...context,
      breadcrumbs: this.getRecentBreadcrumbs(20),
    };

    if (this.sentrySDK) {
      return this.sentrySDK.captureException(errorObj, {
        extra: extras,
        tags: this.tags,
      });
    }

    // Fallback: log to console (intentional for debugging)
    globalThis.console.error('[Sentry Mock] captureError:', errorObj, extras);
    return `mock-${Date.now()}`;
  }

  /**
   * Capture a message (non-error)
   */
  captureMessage(
    message: string,
    level: ErrorSeverity = 'info',
    context?: Record<string, unknown>
  ): string | null {
    if (this.sentrySDK) {
      return this.sentrySDK.captureMessage(message, {
        level: this.mapSeverityToSentry(level),
        extra: context,
        tags: this.tags,
      });
    }

    // Fallback: log to console (intentional for debugging)
    globalThis.console.log(`[Sentry Mock] captureMessage (${level}):`, message, context);
    return `mock-${Date.now()}`;
  }

  /**
   * Set user context
   */
  setUser(user: SentryUser | null): void {
    this._user = user;

    if (this.sentrySDK) {
      this.sentrySDK.setUser(user);
    } else if (this.config.debug) {
      // Intentional console for debugging
      globalThis.console.log('[Sentry Mock] setUser:', user);
    }
  }

  /**
   * Set scope tags
   */
  setTags(tags: Partial<SentryTags>): void {
    this.tags = { ...this.tags, ...tags };

    if (this.sentrySDK) {
      Object.entries(tags).forEach(([key, value]) => {
        if (value !== undefined) {
          this.sentrySDK.setTag(key, value);
        }
      });
    }
  }

  /**
   * Add a breadcrumb
   */
  addBreadcrumb(
    type: BreadcrumbType,
    message: string,
    data?: Record<string, unknown>,
    level: Breadcrumb['level'] = 'info'
  ): void {
    const breadcrumb: Breadcrumb = {
      type,
      message,
      data,
      level,
      timestamp: Date.now(),
    };

    // Store locally
    this.breadcrumbs.push(breadcrumb);
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.config.maxBreadcrumbs);
    }

    // Send to Sentry
    if (this.sentrySDK) {
      this.sentrySDK.addBreadcrumb({
        category: type,
        message,
        data,
        level,
        timestamp: breadcrumb.timestamp / 1000, // Sentry uses seconds
      });
    } else if (this.config.debug) {
      // Intentional console for debugging
      globalThis.console.log(`[Sentry Mock] addBreadcrumb (${type}):`, message, data);
    }
  }

  /**
   * Get recent breadcrumbs
   */
  getRecentBreadcrumbs(count: number = 20): Breadcrumb[] {
    return this.breadcrumbs.slice(-count);
  }

  /**
   * Clear all breadcrumbs
   */
  clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }

  /**
   * Check if Sentry is initialized
   */
  isEnabled(): boolean {
    return this.isInitialized && !!this.sentrySDK;
  }

  // ============================================================================
  // Game-Specific Helpers
  // ============================================================================

  /**
   * Add navigation breadcrumb
   */
  addNavigationBreadcrumb(from: string, to: string): void {
    this.addBreadcrumb('navigation', `Navigated from ${from} to ${to}`, {
      from,
      to,
    });
  }

  /**
   * Add button click breadcrumb
   */
  addClickBreadcrumb(element: string, action?: string): void {
    this.addBreadcrumb('click', `Clicked: ${element}`, {
      element,
      action,
    });
  }

  /**
   * Add API call breadcrumb
   */
  addApiBreadcrumb(method: string, url: string, status?: number, duration?: number): void {
    this.addBreadcrumb(
      'api',
      `${method} ${url}${status ? ` -> ${status}` : ''}`,
      {
        method,
        url,
        status,
        duration,
      },
      status && status >= 400 ? 'warning' : 'info'
    );
  }

  /**
   * Add game event breadcrumb
   */
  addGameBreadcrumb(event: string, game: string, data?: Record<string, unknown>): void {
    this.addBreadcrumb('game', `[${game}] ${event}`, {
      game,
      ...data,
    });
  }

  /**
   * Add wallet action breadcrumb
   */
  addWalletBreadcrumb(action: string, address?: string, success: boolean = true): void {
    this.addBreadcrumb(
      'wallet',
      `Wallet: ${action}${success ? '' : ' (failed)'}`,
      {
        action,
        address: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : undefined,
        success,
      },
      success ? 'info' : 'warning'
    );
  }

  /**
   * Add payment breadcrumb
   */
  addPaymentBreadcrumb(
    action: string,
    amount?: string,
    success: boolean = true,
    txHash?: string
  ): void {
    this.addBreadcrumb(
      'payment',
      `Payment: ${action}${success ? '' : ' (failed)'}`,
      {
        action,
        amount,
        success,
        txHash: txHash ? `${txHash.slice(0, 10)}...` : undefined,
      },
      success ? 'info' : 'warning'
    );
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private mapSeverityToSentry(severity: ErrorSeverity): string {
    const map: Record<ErrorSeverity, string> = {
      info: 'info',
      warning: 'warning',
      error: 'error',
      critical: 'fatal',
    };
    return map[severity];
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Get the Sentry manager instance
 */
export function getSentry(): SentryManager {
  return SentryManager.getInstance();
}

/**
 * Initialize Sentry
 */
export async function initializeSentry(config?: Partial<SentryConfig>): Promise<void> {
  await getSentry().initialize(config);
}

/**
 * Capture an error
 */
export function captureError(
  error: Error | unknown,
  context?: Record<string, unknown>
): string | null {
  return getSentry().captureError(error, context);
}

/**
 * Capture a message
 */
export function captureMessage(
  message: string,
  level?: ErrorSeverity,
  context?: Record<string, unknown>
): string | null {
  return getSentry().captureMessage(message, level, context);
}

/**
 * Set Sentry user
 */
export function setSentryUser(user: SentryUser | null): void {
  getSentry().setUser(user);
}

/**
 * Set Sentry tags
 */
export function setSentryTags(tags: Partial<SentryTags>): void {
  getSentry().setTags(tags);
}

/**
 * Add a breadcrumb
 */
export function addBreadcrumb(
  type: BreadcrumbType,
  message: string,
  data?: Record<string, unknown>,
  level?: Breadcrumb['level']
): void {
  getSentry().addBreadcrumb(type, message, data, level);
}

// ============================================================================
// Specialized Breadcrumb Functions
// ============================================================================

/**
 * Add navigation breadcrumb
 */
export function trackNavigation(from: string, to: string): void {
  getSentry().addNavigationBreadcrumb(from, to);
}

/**
 * Add click breadcrumb
 */
export function trackClick(element: string, action?: string): void {
  getSentry().addClickBreadcrumb(element, action);
}

/**
 * Add API call breadcrumb
 */
export function trackApiCall(
  method: string,
  url: string,
  status?: number,
  duration?: number
): void {
  getSentry().addApiBreadcrumb(method, url, status, duration);
}

/**
 * Add game event breadcrumb
 */
export function trackGameEvent(event: string, game: string, data?: Record<string, unknown>): void {
  getSentry().addGameBreadcrumb(event, game, data);
}

/**
 * Add wallet action breadcrumb
 */
export function trackWalletAction(action: string, address?: string, success?: boolean): void {
  getSentry().addWalletBreadcrumb(action, address, success);
}

/**
 * Add payment breadcrumb
 */
export function trackPayment(
  action: string,
  amount?: string,
  success?: boolean,
  txHash?: string
): void {
  getSentry().addPaymentBreadcrumb(action, amount, success, txHash);
}
