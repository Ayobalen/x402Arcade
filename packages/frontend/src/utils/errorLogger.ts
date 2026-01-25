/**
 * Client-Side Error Logging Utility
 *
 * Comprehensive error logging system that captures errors from multiple sources:
 * - Unhandled promise rejections
 * - window.onerror events
 * - React error boundaries
 * - Manual error reports
 *
 * Provides formatted logs with user context, page context, and debugging information.
 *
 * @module utils/errorLogger
 */

import type { AppError, AppErrorCode, ErrorSeverity } from '../types/errors';
import { fromUnknownError } from './errors';

// ============================================================================
// Types
// ============================================================================

/**
 * User context for error logging
 */
export interface UserContext {
  /** Wallet address if connected */
  walletAddress?: string;
  /** Whether wallet is connected */
  isConnected: boolean;
  /** Current game session ID if active */
  gameSessionId?: string;
  /** User's quality settings */
  qualityPreset?: string;
}

/**
 * Page context for error logging
 */
export interface PageContext {
  /** Current route path */
  path: string;
  /** Page title */
  title: string;
  /** Query parameters */
  queryParams?: Record<string, string>;
  /** Component stack (for React errors) */
  componentStack?: string;
}

/**
 * Environment context
 */
export interface EnvContext {
  /** Node environment */
  env: 'development' | 'production' | 'test';
  /** App version */
  version: string;
  /** Build timestamp */
  buildTime?: string;
  /** Git commit hash */
  commitHash?: string;
}

/**
 * Browser context
 */
export interface BrowserContext {
  /** User agent string */
  userAgent: string;
  /** Browser language */
  language: string;
  /** Screen dimensions */
  screen: {
    width: number;
    height: number;
  };
  /** Viewport dimensions */
  viewport: {
    width: number;
    height: number;
  };
  /** Is online */
  online: boolean;
  /** Device memory (GB) */
  deviceMemory?: number;
  /** Hardware concurrency */
  hardwareConcurrency?: number;
}

/**
 * Complete error log entry
 */
export interface ErrorLogEntry {
  /** Unique log ID */
  id: string;
  /** Timestamp */
  timestamp: string;
  /** Error severity */
  severity: ErrorSeverity;
  /** Error code */
  code: AppErrorCode;
  /** Error message */
  message: string;
  /** Technical details */
  technicalMessage?: string;
  /** Error stack trace */
  stack?: string;
  /** User context */
  user?: UserContext;
  /** Page context */
  page: PageContext;
  /** Environment context */
  env: EnvContext;
  /** Browser context */
  browser: BrowserContext;
  /** Additional context */
  context?: Record<string, unknown>;
  /** Source of the error */
  source: 'window.onerror' | 'unhandledrejection' | 'react-boundary' | 'manual';
}

/**
 * Error logger configuration
 */
export interface ErrorLoggerConfig {
  /** Whether logging is enabled */
  enabled: boolean;
  /** Minimum severity to log */
  minSeverity: ErrorSeverity;
  /** Maximum log entries to keep in memory */
  maxLogEntries: number;
  /** Whether to log to console */
  logToConsole: boolean;
  /** Whether to send to remote server */
  sendToRemote: boolean;
  /** Remote endpoint URL */
  remoteEndpoint?: string;
  /** Batch size for remote sends */
  batchSize: number;
  /** Flush interval in ms */
  flushInterval: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const defaultConfig: ErrorLoggerConfig = {
  enabled: true,
  minSeverity: 'info',
  maxLogEntries: 100,
  logToConsole: import.meta.env.DEV,
  sendToRemote: import.meta.env.PROD,
  batchSize: 10,
  flushInterval: 30000, // 30 seconds
};

// Severity order for comparison
const severityOrder: Record<ErrorSeverity, number> = {
  info: 0,
  warning: 1,
  error: 2,
  critical: 3,
};

// ============================================================================
// Error Logger Class
// ============================================================================

/**
 * Client-side error logger
 *
 * Singleton class that manages error logging throughout the application.
 *
 * @example
 * ```typescript
 * const logger = ErrorLogger.getInstance()
 * logger.initialize({ logToConsole: true })
 *
 * // Log an error
 * logger.logError(error, 'manual', { source: 'PayToPlay' })
 *
 * // Set user context
 * logger.setUserContext({ walletAddress: '0x...', isConnected: true })
 * ```
 */
export class ErrorLogger {
  private static instance: ErrorLogger;
  private config: ErrorLoggerConfig;
  private logEntries: ErrorLogEntry[] = [];
  private userContext: UserContext = { isConnected: false };
  private pendingBatch: ErrorLogEntry[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private isInitialized = false;

  private constructor() {
    this.config = { ...defaultConfig };
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  /**
   * Initialize the error logger
   */
  initialize(config: Partial<ErrorLoggerConfig> = {}): void {
    if (this.isInitialized) {
      return;
    }

    this.config = { ...this.config, ...config };

    if (this.config.enabled) {
      this.setupGlobalHandlers();
      this.startFlushTimer();
    }

    this.isInitialized = true;
  }

  /**
   * Shutdown the error logger
   */
  shutdown(): void {
    this.removeGlobalHandlers();
    this.stopFlushTimer();
    this.flush(); // Send any remaining logs
    this.isInitialized = false;
  }

  /**
   * Set user context for error logging
   */
  setUserContext(context: Partial<UserContext>): void {
    this.userContext = { ...this.userContext, ...context };
  }

  /**
   * Clear user context (e.g., on disconnect)
   */
  clearUserContext(): void {
    this.userContext = { isConnected: false };
  }

  /**
   * Log an error
   */
  logError(
    error: unknown,
    source: ErrorLogEntry['source'],
    additionalContext?: Record<string, unknown>
  ): ErrorLogEntry | null {
    if (!this.config.enabled) {
      return null;
    }

    // Convert to AppError
    const appError = error instanceof Error ? fromUnknownError(error) : fromUnknownError(error);

    // Check severity threshold
    if (severityOrder[appError.severity] < severityOrder[this.config.minSeverity]) {
      return null;
    }

    // Create log entry
    const entry = this.createLogEntry(appError, source, additionalContext);

    // Store in memory
    this.addLogEntry(entry);

    // Log to console if enabled
    if (this.config.logToConsole) {
      this.logToConsole(entry);
    }

    // Add to pending batch for remote send
    if (this.config.sendToRemote) {
      this.pendingBatch.push(entry);
      if (this.pendingBatch.length >= this.config.batchSize) {
        this.flush();
      }
    }

    return entry;
  }

  /**
   * Log an error from React error boundary
   */
  logReactError(error: Error, componentStack?: string): ErrorLogEntry | null {
    return this.logError(error, 'react-boundary', {
      componentStack,
    });
  }

  /**
   * Get all log entries
   */
  getLogEntries(): ErrorLogEntry[] {
    return [...this.logEntries];
  }

  /**
   * Get recent log entries
   */
  getRecentEntries(count: number = 10): ErrorLogEntry[] {
    return this.logEntries.slice(-count);
  }

  /**
   * Clear all log entries
   */
  clearLogEntries(): void {
    this.logEntries = [];
  }

  /**
   * Flush pending logs to remote server
   */
  async flush(): Promise<void> {
    if (this.pendingBatch.length === 0) {
      return;
    }

    if (!this.config.remoteEndpoint) {
      this.pendingBatch = [];
      return;
    }

    const batch = [...this.pendingBatch];
    this.pendingBatch = [];

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: batch }),
      });
    } catch {
      // Re-add failed logs to pending batch (with limit)
      if (this.pendingBatch.length < this.config.maxLogEntries) {
        this.pendingBatch = [...batch, ...this.pendingBatch].slice(0, this.config.maxLogEntries);
      }
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private setupGlobalHandlers(): void {
    // Handle window.onerror
    window.onerror = (message, source, lineno, colno, error) => {
      this.logError(error || new Error(String(message)), 'window.onerror', {
        source,
        lineno,
        colno,
      });
      return false; // Don't prevent default handling
    };

    // Handle unhandled promise rejections
    window.onunhandledrejection = (event) => {
      this.logError(event.reason, 'unhandledrejection', {
        promise: 'unhandled',
      });
    };
  }

  private removeGlobalHandlers(): void {
    window.onerror = null;
    window.onunhandledrejection = null;
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      return;
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  private createLogEntry(
    appError: AppError,
    source: ErrorLogEntry['source'],
    additionalContext?: Record<string, unknown>
  ): ErrorLogEntry {
    return {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      severity: appError.severity,
      code: appError.code,
      message: appError.message,
      technicalMessage: appError.technicalMessage,
      stack: appError.originalError instanceof Error ? appError.originalError.stack : undefined,
      user: { ...this.userContext },
      page: this.getPageContext(additionalContext?.componentStack as string | undefined),
      env: this.getEnvContext(),
      browser: this.getBrowserContext(),
      context: {
        ...appError.context,
        ...additionalContext,
      },
      source,
    };
  }

  private getPageContext(componentStack?: string): PageContext {
    return {
      path: window.location.pathname,
      title: document.title,
      queryParams: Object.fromEntries(new URLSearchParams(window.location.search)),
      componentStack,
    };
  }

  private getEnvContext(): EnvContext {
    return {
      env: import.meta.env.PROD ? 'production' : import.meta.env.DEV ? 'development' : 'test',
      version: import.meta.env.VITE_APP_VERSION || '0.1.0',
      buildTime: import.meta.env.VITE_BUILD_TIME,
      commitHash: import.meta.env.VITE_COMMIT_HASH,
    };
  }

  private getBrowserContext(): BrowserContext {
    const nav = navigator as Navigator & {
      deviceMemory?: number;
    };

    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      screen: {
        width: window.screen.width,
        height: window.screen.height,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      online: navigator.onLine,
      deviceMemory: nav.deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency,
    };
  }

  private addLogEntry(entry: ErrorLogEntry): void {
    this.logEntries.push(entry);

    // Trim if exceeding max
    if (this.logEntries.length > this.config.maxLogEntries) {
      this.logEntries = this.logEntries.slice(-this.config.maxLogEntries);
    }
  }

  private logToConsole(entry: ErrorLogEntry): void {
    const prefix = this.getSeverityPrefix(entry.severity);
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();

    /* eslint-disable no-console */
    console.group(`${prefix} [${timestamp}] ${entry.code}`);
    console.log('Message:', entry.message);
    if (entry.technicalMessage) {
      console.log('Technical:', entry.technicalMessage);
    }
    console.log('Page:', entry.page.path);
    if (entry.user?.walletAddress) {
      console.log('Wallet:', entry.user.walletAddress);
    }
    if (entry.context && Object.keys(entry.context).length > 0) {
      console.log('Context:', entry.context);
    }
    if (entry.stack) {
      console.log('Stack:', entry.stack);
    }
    console.groupEnd();
    /* eslint-enable no-console */
  }

  private getSeverityPrefix(severity: ErrorSeverity): string {
    const prefixes: Record<ErrorSeverity, string> = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      critical: '🔴',
    };
    return prefixes[severity];
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Get the error logger instance
 */
export function getErrorLogger(): ErrorLogger {
  return ErrorLogger.getInstance();
}

/**
 * Initialize error logging
 */
export function initializeErrorLogging(config?: Partial<ErrorLoggerConfig>): void {
  getErrorLogger().initialize(config);
}

/**
 * Log an error
 */
export function logError(
  error: unknown,
  source: ErrorLogEntry['source'] = 'manual',
  context?: Record<string, unknown>
): ErrorLogEntry | null {
  return getErrorLogger().logError(error, source, context);
}

/**
 * Set user context for error logging
 */
export function setErrorUserContext(context: Partial<UserContext>): void {
  getErrorLogger().setUserContext(context);
}

/**
 * Clear user context
 */
export function clearErrorUserContext(): void {
  getErrorLogger().clearUserContext();
}
