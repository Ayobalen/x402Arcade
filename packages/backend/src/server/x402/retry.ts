/**
 * x402 Payment Retry Utilities
 *
 * Implements exponential backoff retry logic for transient facilitator failures.
 * Only retries on 5xx errors and network errors, respecting a total timeout budget.
 *
 * @module server/x402/retry
 */

/**
 * Retry configuration options
 */
export interface RetryConfig {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries: number;

  /**
   * Initial delay in milliseconds before the first retry
   * @default 500
   */
  initialDelayMs: number;

  /**
   * Maximum delay between retries in milliseconds
   * @default 10000
   */
  maxDelayMs: number;

  /**
   * Exponential backoff multiplier
   * @default 2
   */
  backoffMultiplier: number;

  /**
   * Total timeout budget in milliseconds
   * @default 60000 (60 seconds)
   */
  totalTimeoutMs: number;

  /**
   * Whether to log retry attempts
   * @default false
   */
  debug?: boolean;
}

/**
 * Default retry configuration for facilitator calls
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 500,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  totalTimeoutMs: 60000,
  debug: false,
};

/**
 * Result of a retry operation
 */
export interface RetryResult<T> {
  /**
   * Whether the operation succeeded
   */
  success: boolean;

  /**
   * The result if successful
   */
  result?: T;

  /**
   * The last error if failed
   */
  error?: Error;

  /**
   * Number of attempts made
   */
  attempts: number;

  /**
   * Total time spent in milliseconds
   */
  totalTimeMs: number;

  /**
   * Whether the operation timed out
   */
  timedOut: boolean;
}

/**
 * Retry context passed to the operation and isRetryable callback
 */
export interface RetryContext {
  /**
   * Current attempt number (1-indexed)
   */
  attempt: number;

  /**
   * Time elapsed since the first attempt in milliseconds
   */
  elapsedMs: number;

  /**
   * Remaining timeout budget in milliseconds
   */
  remainingTimeoutMs: number;

  /**
   * Previous error if this is a retry
   */
  previousError?: Error;
}

/**
 * Options for a single retry operation
 */
export interface RetryOptions extends Partial<RetryConfig> {
  /**
   * Function to determine if an error is retryable
   * @param error The error that occurred
   * @param context Current retry context
   * @returns true if the operation should be retried
   */
  isRetryable?: (error: Error, context: RetryContext) => boolean;

  /**
   * Callback called before each retry attempt
   * @param attempt Attempt number (1-indexed)
   * @param delayMs Delay before this attempt
   * @param error Previous error
   */
  onRetry?: (attempt: number, delayMs: number, error: Error) => void;
}

/**
 * Default function to determine if an error is retryable
 *
 * Retries on:
 * - HTTP 5xx errors (server errors)
 * - Network errors (ECONNREFUSED, ECONNRESET, ETIMEDOUT, etc.)
 * - Timeout errors
 *
 * Does NOT retry on:
 * - HTTP 4xx errors (client errors)
 * - Validation errors
 * - Business logic errors
 *
 * @param error The error to check
 * @returns true if the error is retryable
 */
export function isTransientError(error: Error): boolean {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  // Check for network errors
  if (
    message.includes('econnrefused') ||
    message.includes('econnreset') ||
    message.includes('etimedout') ||
    message.includes('enotfound') ||
    message.includes('socket hang up') ||
    message.includes('network error') ||
    message.includes('fetch failed') ||
    name.includes('typeerror') && message.includes('fetch')
  ) {
    return true;
  }

  // Check for timeout errors
  if (
    message.includes('timeout') ||
    message.includes('timed out') ||
    name.includes('timeout')
  ) {
    return true;
  }

  // Check for 5xx HTTP status codes in error message
  const statusMatch = message.match(/\b5\d{2}\b/);
  if (statusMatch) {
    return true;
  }

  // Check for specific HTTP error patterns
  if (
    message.includes('internal server error') ||
    message.includes('bad gateway') ||
    message.includes('service unavailable') ||
    message.includes('gateway timeout')
  ) {
    return true;
  }

  // Check for facilitator-specific transient errors
  if (
    message.includes('facilitator service') ||
    message.includes('service temporarily')
  ) {
    return true;
  }

  return false;
}

/**
 * Check if an HTTP response indicates a retryable error
 *
 * @param response The fetch Response object
 * @returns true if the response status is retryable (5xx)
 */
export function isRetryableHttpStatus(response: Response): boolean {
  // 5xx errors are retryable
  return response.status >= 500 && response.status < 600;
}

/**
 * Calculate exponential backoff delay
 *
 * @param attempt Current attempt number (1-indexed)
 * @param config Retry configuration
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig,
): number {
  // Formula: initialDelay * (backoffMultiplier ^ (attempt - 1))
  // Add jitter (+-10%) to prevent thundering herd
  const baseDelay =
    config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
  const jitter = baseDelay * (0.1 * (Math.random() * 2 - 1)); // +-10%
  const delay = Math.round(baseDelay + jitter);

  return Math.min(delay, config.maxDelayMs);
}

/**
 * Sleep for the specified duration
 *
 * @param ms Duration in milliseconds
 * @returns Promise that resolves after the delay
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute an async operation with exponential backoff retry
 *
 * This function will retry the operation on transient failures (5xx and network errors)
 * using exponential backoff. It respects a total timeout budget and maximum retry count.
 *
 * @param operation The async operation to execute
 * @param options Retry options
 * @returns RetryResult with the operation result or error details
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   async (context) => {
 *     const response = await fetch(facilitatorUrl, { ... });
 *     if (!response.ok && response.status >= 500) {
 *       throw new Error(`HTTP ${response.status}`);
 *     }
 *     return response.json();
 *   },
 *   {
 *     maxRetries: 3,
 *     totalTimeoutMs: 60000,
 *     debug: true,
 *   }
 * );
 *
 * if (result.success) {
 *   console.log('Settlement succeeded:', result.result);
 * } else {
 *   console.error('Settlement failed after', result.attempts, 'attempts');
 * }
 * ```
 */
export async function withRetry<T>(
  operation: (context: RetryContext) => Promise<T>,
  options: RetryOptions = {},
): Promise<RetryResult<T>> {
  // Merge options with defaults
  const config: RetryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    ...options,
  };

  const isRetryable = options.isRetryable ?? isTransientError;
  const onRetry = options.onRetry;

  const startTime = Date.now();
  let lastError: Error | undefined;
  let attempt = 0;

  while (attempt <= config.maxRetries) {
    attempt++;
    const elapsedMs = Date.now() - startTime;
    const remainingTimeoutMs = config.totalTimeoutMs - elapsedMs;

    // Check if we've exceeded the total timeout budget
    if (remainingTimeoutMs <= 0) {
      if (config.debug) {
        console.log(
          `[x402-retry] Timeout budget exhausted after ${elapsedMs}ms (${attempt - 1} attempts)`,
        );
      }
      return {
        success: false,
        error: lastError ?? new Error('Operation timed out'),
        attempts: attempt - 1,
        totalTimeMs: elapsedMs,
        timedOut: true,
      };
    }

    const context: RetryContext = {
      attempt,
      elapsedMs,
      remainingTimeoutMs,
      previousError: lastError,
    };

    try {
      if (config.debug && attempt > 1) {
        console.log(
          `[x402-retry] Attempt ${attempt}/${config.maxRetries + 1}, elapsed: ${elapsedMs}ms, remaining: ${remainingTimeoutMs}ms`,
        );
      }

      const result = await operation(context);

      if (config.debug) {
        console.log(
          `[x402-retry] Success on attempt ${attempt}, total time: ${Date.now() - startTime}ms`,
        );
      }

      return {
        success: true,
        result,
        attempts: attempt,
        totalTimeMs: Date.now() - startTime,
        timedOut: false,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (config.debug) {
        console.log(
          `[x402-retry] Attempt ${attempt} failed: ${lastError.message}`,
        );
      }

      // Check if we should retry
      const shouldRetry =
        attempt <= config.maxRetries && isRetryable(lastError, context);

      if (!shouldRetry) {
        if (config.debug) {
          console.log(
            `[x402-retry] Not retrying: ${attempt > config.maxRetries ? 'max retries exceeded' : 'error not retryable'}`,
          );
        }
        return {
          success: false,
          error: lastError,
          attempts: attempt,
          totalTimeMs: Date.now() - startTime,
          timedOut: false,
        };
      }

      // Calculate delay for next attempt
      const delay = calculateBackoffDelay(attempt, config);

      // Ensure we don't exceed the timeout budget
      const effectiveDelay = Math.min(delay, remainingTimeoutMs - 100); // Leave 100ms buffer

      if (effectiveDelay <= 0) {
        if (config.debug) {
          console.log(
            `[x402-retry] No time remaining for retry, elapsed: ${Date.now() - startTime}ms`,
          );
        }
        return {
          success: false,
          error: lastError,
          attempts: attempt,
          totalTimeMs: Date.now() - startTime,
          timedOut: true,
        };
      }

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, effectiveDelay, lastError);
      }

      if (config.debug) {
        console.log(
          `[x402-retry] Waiting ${effectiveDelay}ms before retry ${attempt + 1}`,
        );
      }

      await sleep(effectiveDelay);
    }
  }

  // Should not reach here, but handle it gracefully
  return {
    success: false,
    error: lastError ?? new Error('Max retries exceeded'),
    attempts: attempt,
    totalTimeMs: Date.now() - startTime,
    timedOut: false,
  };
}

/**
 * Create a retryable version of a fetch function
 *
 * This is a convenience wrapper around `withRetry` specifically for fetch operations.
 * It handles HTTP status codes and response parsing.
 *
 * @param url The URL to fetch
 * @param init Fetch init options
 * @param retryOptions Retry configuration
 * @returns Promise with the response JSON
 *
 * @example
 * ```typescript
 * const data = await retryableFetch(
 *   'https://facilitator.example.com/v2/x402/settle',
 *   {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify(settlementRequest),
 *   },
 *   { debug: true }
 * );
 * ```
 */
export async function retryableFetch<T = unknown>(
  url: string,
  init?: RequestInit,
  retryOptions: RetryOptions = {},
): Promise<RetryResult<{ response: globalThis.Response; data: T }>> {
  return withRetry(
    async () => {
      const response = await fetch(url, init);

      // If it's a 5xx error, throw to trigger retry
      if (isRetryableHttpStatus(response)) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // For other errors (4xx), don't retry but let the caller handle
      const data = (await response.json()) as T;
      return { response, data };
    },
    {
      ...retryOptions,
      isRetryable: (error, context) => {
        // Use custom isRetryable if provided
        if (retryOptions.isRetryable) {
          return retryOptions.isRetryable(error, context);
        }
        // Default to transient error check
        return isTransientError(error);
      },
    },
  );
}

/**
 * Log a retry attempt (for use with onRetry callback)
 *
 * @param attempt Next attempt number
 * @param delayMs Delay before the attempt
 * @param error Previous error
 */
export function logRetryAttempt(
  attempt: number,
  delayMs: number,
  error: Error,
): void {
  console.log(
    `[x402-retry] Retry ${attempt} after ${delayMs}ms (previous error: ${error.message})`,
  );
}
