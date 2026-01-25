/**
 * Network Error Handling Utilities
 *
 * Provides comprehensive network error detection, classification, and handling:
 * - NetworkError class for typed network errors
 * - Error detection from fetch responses
 * - Retry-able error detection
 * - User-friendly error messages
 *
 * @module utils/networkErrors
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Network error types for classification
 */
export type NetworkErrorType =
  | 'OFFLINE' // No network connection
  | 'TIMEOUT' // Request timed out
  | 'DNS_ERROR' // DNS resolution failed
  | 'CONNECTION_REFUSED' // Server refused connection
  | 'CONNECTION_RESET' // Connection was reset
  | 'ABORTED' // Request was aborted
  | 'CORS_ERROR' // CORS policy violation
  | 'SSL_ERROR' // SSL/TLS error
  | 'BAD_REQUEST' // 400 Bad Request
  | 'UNAUTHORIZED' // 401 Unauthorized
  | 'FORBIDDEN' // 403 Forbidden
  | 'NOT_FOUND' // 404 Not Found
  | 'RATE_LIMITED' // 429 Too Many Requests
  | 'SERVER_ERROR' // 5xx Server Error
  | 'SERVICE_UNAVAILABLE' // 503 Service Unavailable
  | 'GATEWAY_TIMEOUT' // 504 Gateway Timeout
  | 'UNKNOWN'; // Unknown error

/**
 * Network error severity
 */
export type NetworkErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Network error metadata
 */
export interface NetworkErrorMetadata {
  /** HTTP status code if available */
  statusCode?: number;
  /** HTTP status text if available */
  statusText?: string;
  /** Request URL */
  url?: string;
  /** Request method */
  method?: string;
  /** Response body if available */
  responseBody?: unknown;
  /** Response headers */
  responseHeaders?: Record<string, string>;
  /** Time taken before error */
  duration?: number;
  /** Retry attempt number */
  retryAttempt?: number;
}

// ============================================================================
// NetworkError Class
// ============================================================================

/**
 * Custom error class for network errors
 *
 * Provides typed error information, retry-ability detection, and user-friendly messages.
 *
 * @example
 * ```typescript
 * const error = new NetworkError('TIMEOUT', 'Request timed out', {
 *   url: '/api/games',
 *   method: 'GET',
 *   duration: 30000,
 * });
 *
 * if (error.isRetryable) {
 *   // Retry the request
 * }
 *
 * console.log(error.userMessage); // "Request timed out. Please try again."
 * ```
 */
export class NetworkError extends Error {
  /** Error type classification */
  readonly type: NetworkErrorType;

  /** Error severity */
  readonly severity: NetworkErrorSeverity;

  /** Whether the error is retryable */
  readonly isRetryable: boolean;

  /** Additional metadata about the error */
  readonly metadata: NetworkErrorMetadata;

  /** User-friendly error message */
  readonly userMessage: string;

  /** Suggested retry delay in ms (for retryable errors) */
  readonly suggestedRetryDelay: number;

  constructor(type: NetworkErrorType, message: string, metadata: NetworkErrorMetadata = {}) {
    super(message);
    this.name = 'NetworkError';
    this.type = type;
    this.metadata = metadata;
    this.severity = this.getSeverity(type);
    this.isRetryable = this.checkRetryable(type);
    this.userMessage = this.getUserMessage(type, metadata);
    this.suggestedRetryDelay = this.getSuggestedRetryDelay(type);

    // Maintain proper stack trace for where the error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NetworkError);
    }
  }

  private getSeverity(type: NetworkErrorType): NetworkErrorSeverity {
    switch (type) {
      case 'OFFLINE':
        return 'warning';
      case 'RATE_LIMITED':
      case 'TIMEOUT':
        return 'warning';
      case 'UNAUTHORIZED':
      case 'FORBIDDEN':
      case 'BAD_REQUEST':
        return 'error';
      case 'SERVER_ERROR':
      case 'SERVICE_UNAVAILABLE':
      case 'GATEWAY_TIMEOUT':
        return 'critical';
      default:
        return 'error';
    }
  }

  private checkRetryable(type: NetworkErrorType): boolean {
    // These errors might succeed on retry
    const retryableTypes: NetworkErrorType[] = [
      'OFFLINE',
      'TIMEOUT',
      'CONNECTION_RESET',
      'RATE_LIMITED',
      'SERVER_ERROR',
      'SERVICE_UNAVAILABLE',
      'GATEWAY_TIMEOUT',
    ];
    return retryableTypes.includes(type);
  }

  private getUserMessage(type: NetworkErrorType, metadata: NetworkErrorMetadata): string {
    switch (type) {
      case 'OFFLINE':
        return "You're offline. Please check your internet connection.";
      case 'TIMEOUT':
        return 'Request timed out. Please try again.';
      case 'DNS_ERROR':
        return 'Unable to reach the server. Please check your connection.';
      case 'CONNECTION_REFUSED':
        return 'Unable to connect to the server. Please try again later.';
      case 'CONNECTION_RESET':
        return 'Connection was interrupted. Please try again.';
      case 'ABORTED':
        return 'Request was cancelled.';
      case 'CORS_ERROR':
        return 'Unable to access this resource.';
      case 'SSL_ERROR':
        return 'Secure connection failed. Please try again.';
      case 'BAD_REQUEST':
        return 'Invalid request. Please check your input.';
      case 'UNAUTHORIZED':
        return 'Please connect your wallet to continue.';
      case 'FORBIDDEN':
        return "You don't have permission to access this.";
      case 'NOT_FOUND':
        return 'The requested resource was not found.';
      case 'RATE_LIMITED':
        return 'Too many requests. Please wait a moment and try again.';
      case 'SERVER_ERROR':
        return `Server error (${metadata.statusCode}). Please try again later.`;
      case 'SERVICE_UNAVAILABLE':
        return 'Service is temporarily unavailable. Please try again later.';
      case 'GATEWAY_TIMEOUT':
        return 'Server is taking too long to respond. Please try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  private getSuggestedRetryDelay(type: NetworkErrorType): number {
    switch (type) {
      case 'RATE_LIMITED':
        return 60000; // 1 minute for rate limiting
      case 'SERVICE_UNAVAILABLE':
      case 'GATEWAY_TIMEOUT':
        return 30000; // 30 seconds for server issues
      case 'TIMEOUT':
        return 5000; // 5 seconds for timeouts
      case 'OFFLINE':
        return 3000; // 3 seconds for offline (check frequently)
      default:
        return 1000; // 1 second default
    }
  }

  /**
   * Create a JSON representation of the error
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      type: this.type,
      message: this.message,
      userMessage: this.userMessage,
      severity: this.severity,
      isRetryable: this.isRetryable,
      suggestedRetryDelay: this.suggestedRetryDelay,
      metadata: this.metadata,
      stack: this.stack,
    };
  }
}

// ============================================================================
// Error Detection
// ============================================================================

/**
 * Detect network error type from a fetch error
 */
export function detectNetworkErrorType(error: unknown): NetworkErrorType {
  // Check if offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'OFFLINE';
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    // AbortError for cancelled requests
    if (name === 'aborterror' || message.includes('abort')) {
      return 'ABORTED';
    }

    // Timeout errors
    if (message.includes('timeout') || name === 'timeouterror') {
      return 'TIMEOUT';
    }

    // Network failures
    if (message.includes('network') || message.includes('failed to fetch')) {
      // Check for specific network issues
      if (message.includes('dns') || message.includes('resolve')) {
        return 'DNS_ERROR';
      }
      if (message.includes('refused')) {
        return 'CONNECTION_REFUSED';
      }
      if (message.includes('reset')) {
        return 'CONNECTION_RESET';
      }
      if (message.includes('cors')) {
        return 'CORS_ERROR';
      }
      if (message.includes('ssl') || message.includes('certificate')) {
        return 'SSL_ERROR';
      }
      return 'OFFLINE';
    }

    // Type errors often indicate network issues
    if (name === 'typeerror' && message.includes('fetch')) {
      return 'OFFLINE';
    }
  }

  return 'UNKNOWN';
}

/**
 * Detect network error type from an HTTP response
 */
export function detectHttpErrorType(status: number): NetworkErrorType {
  if (status === 400) return 'BAD_REQUEST';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 429) return 'RATE_LIMITED';
  if (status >= 500 && status < 600) {
    if (status === 503) return 'SERVICE_UNAVAILABLE';
    if (status === 504) return 'GATEWAY_TIMEOUT';
    return 'SERVER_ERROR';
  }
  return 'UNKNOWN';
}

/**
 * Create a NetworkError from a fetch error
 */
export function createNetworkErrorFromFetch(
  error: unknown,
  metadata: Omit<NetworkErrorMetadata, 'statusCode' | 'statusText'> = {}
): NetworkError {
  const type = detectNetworkErrorType(error);
  const message = error instanceof Error ? error.message : String(error);

  return new NetworkError(type, message, metadata);
}

/**
 * Create a NetworkError from an HTTP response
 */
export async function createNetworkErrorFromResponse(
  response: Response,
  metadata: Omit<
    NetworkErrorMetadata,
    'statusCode' | 'statusText' | 'responseBody' | 'responseHeaders'
  > = {}
): Promise<NetworkError> {
  const type = detectHttpErrorType(response.status);

  // Try to read response body
  let responseBody: unknown;
  try {
    responseBody = await response.clone().json();
  } catch {
    try {
      responseBody = await response.clone().text();
    } catch {
      responseBody = undefined;
    }
  }

  // Extract response headers
  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  const message =
    (responseBody as { message?: string })?.message ||
    (responseBody as { error?: string })?.error ||
    response.statusText ||
    `HTTP ${response.status}`;

  return new NetworkError(type, message, {
    ...metadata,
    statusCode: response.status,
    statusText: response.statusText,
    responseBody,
    responseHeaders,
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if an error is a NetworkError
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (isNetworkError(error)) {
    return error.isRetryable;
  }

  // Check for common retryable patterns
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('failed to fetch') ||
      message.includes('connection')
    );
  }

  return false;
}

/**
 * Get a user-friendly message for any error
 */
export function getNetworkErrorMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return error.userMessage;
  }

  if (error instanceof Error) {
    // Map common errors to user-friendly messages
    const type = detectNetworkErrorType(error);
    if (type !== 'UNKNOWN') {
      return new NetworkError(type, error.message).userMessage;
    }
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Check if currently offline
 */
export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}

/**
 * Wait for network to come back online
 */
export function waitForOnline(timeout: number = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (navigator.onLine) {
      resolve();
      return;
    }

    const timer = setTimeout(() => {
      window.removeEventListener('online', onOnline);
      reject(new NetworkError('OFFLINE', 'Timed out waiting for network'));
    }, timeout);

    const onOnline = () => {
      clearTimeout(timer);
      window.removeEventListener('online', onOnline);
      resolve();
    };

    window.addEventListener('online', onOnline);
  });
}
