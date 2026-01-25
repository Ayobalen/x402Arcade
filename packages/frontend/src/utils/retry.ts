/**
 * Retry Utility with Exponential Backoff
 *
 * Provides robust retry logic for network requests and async operations:
 * - Exponential backoff with configurable multiplier
 * - Jitter to prevent thundering herd
 * - Max attempts limit
 * - Cancellable retries
 * - Custom retry conditions
 * - Progress callbacks
 *
 * @module utils/retry
 */

import { NetworkError, isRetryableError, isOffline, waitForOnline } from './networkErrors';

// ============================================================================
// Types
// ============================================================================

/**
 * Retry configuration options
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  /** Initial delay in ms before first retry (default: 1000) */
  initialDelay?: number;
  /** Maximum delay between retries in ms (default: 30000) */
  maxDelay?: number;
  /** Backoff multiplier (default: 2) */
  backoffMultiplier?: number;
  /** Whether to add jitter to prevent thundering herd (default: true) */
  useJitter?: boolean;
  /** Custom function to determine if error is retryable */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Callback for each retry attempt */
  onRetry?: (attempt: number, delay: number, error: unknown) => void;
  /** Callback when all retries are exhausted */
  onExhausted?: (error: unknown, totalAttempts: number) => void;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
  /** Whether to wait for network if offline (default: true) */
  waitForNetwork?: boolean;
  /** Timeout for waiting for network in ms (default: 30000) */
  networkTimeout?: number;
}

/**
 * Retry state for tracking progress
 */
export interface RetryState {
  /** Current attempt number (1-indexed) */
  attempt: number;
  /** Total attempts made */
  totalAttempts: number;
  /** Time until next retry in ms */
  nextRetryIn: number | null;
  /** Whether currently retrying */
  isRetrying: boolean;
  /** Whether retries are exhausted */
  isExhausted: boolean;
  /** Last error encountered */
  lastError: unknown | null;
}

/**
 * Result of a retry operation
 */
export interface RetryResult<T> {
  /** Whether the operation succeeded */
  success: boolean;
  /** The result data if successful */
  data?: T;
  /** The error if failed */
  error?: unknown;
  /** Number of attempts made */
  attempts: number;
  /** Total time spent retrying in ms */
  totalTime: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_OPTIONS: Required<
  Omit<RetryOptions, 'shouldRetry' | 'onRetry' | 'onExhausted' | 'signal'>
> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  useJitter: true,
  waitForNetwork: true,
  networkTimeout: 30000,
};

// ============================================================================
// Retry Functions
// ============================================================================

/**
 * Calculate delay for a given attempt with exponential backoff
 */
export function calculateBackoff(
  attempt: number,
  options: Pick<RetryOptions, 'initialDelay' | 'maxDelay' | 'backoffMultiplier' | 'useJitter'> = {}
): number {
  const {
    initialDelay = DEFAULT_OPTIONS.initialDelay,
    maxDelay = DEFAULT_OPTIONS.maxDelay,
    backoffMultiplier = DEFAULT_OPTIONS.backoffMultiplier,
    useJitter = DEFAULT_OPTIONS.useJitter,
  } = options;

  // Exponential backoff: initialDelay * (multiplier ^ attempt)
  let delay = initialDelay * Math.pow(backoffMultiplier, attempt - 1);

  // Cap at max delay
  delay = Math.min(delay, maxDelay);

  // Add jitter (±25%) to prevent thundering herd
  if (useJitter) {
    const jitterRange = delay * 0.25;
    const jitter = Math.random() * jitterRange * 2 - jitterRange;
    delay = Math.max(0, delay + jitter);
  }

  return Math.round(delay);
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Aborted'));
      return;
    }

    const timer = setTimeout(resolve, ms);

    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new Error('Aborted'));
    });
  });
}

/**
 * Retry an async operation with exponential backoff
 *
 * @param operation - The async operation to retry
 * @param options - Retry configuration options
 * @returns Promise resolving to RetryResult with success status and data/error
 *
 * @example
 * ```typescript
 * const result = await retryAsync(
 *   () => fetch('/api/games'),
 *   {
 *     maxAttempts: 5,
 *     initialDelay: 1000,
 *     onRetry: (attempt, delay) => {
 *       console.log(`Retry ${attempt} in ${delay}ms`);
 *     },
 *   }
 * );
 *
 * if (result.success) {
 *   console.log('Data:', result.data);
 * } else {
 *   console.error('Failed after', result.attempts, 'attempts');
 * }
 * ```
 */
export async function retryAsync<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const startTime = Date.now();
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      // Check if aborted
      if (options.signal?.aborted) {
        throw new Error('Aborted');
      }

      // Wait for network if offline and configured to do so
      if (config.waitForNetwork && isOffline()) {
        try {
          await waitForOnline(config.networkTimeout);
        } catch (error) {
          lastError = error;
          // Continue with the attempt anyway
        }
      }

      // Execute the operation
      const data = await operation(attempt);

      return {
        success: true,
        data,
        attempts: attempt,
        totalTime: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error;

      // Check if we should retry
      const shouldRetry =
        options.shouldRetry?.(error, attempt) ??
        (isRetryableError(error) && attempt < config.maxAttempts);

      if (!shouldRetry) {
        break;
      }

      // Calculate delay for next attempt
      const delay = calculateBackoff(attempt, config);

      // Notify callback
      options.onRetry?.(attempt, delay, error);

      // Wait before next attempt
      try {
        await sleep(delay, options.signal);
      } catch {
        // Aborted during sleep
        break;
      }
    }
  }

  // All retries exhausted
  options.onExhausted?.(lastError, config.maxAttempts);

  return {
    success: false,
    error: lastError,
    attempts: config.maxAttempts,
    totalTime: Date.now() - startTime,
  };
}

/**
 * Create a retry wrapper for a function
 *
 * @param fn - The function to wrap with retry logic
 * @param options - Retry configuration options
 * @returns A wrapped function with retry behavior
 *
 * @example
 * ```typescript
 * const fetchWithRetry = withRetry(
 *   async (url: string) => {
 *     const response = await fetch(url);
 *     if (!response.ok) throw new Error(`HTTP ${response.status}`);
 *     return response.json();
 *   },
 *   { maxAttempts: 3 }
 * );
 *
 * const data = await fetchWithRetry('/api/games');
 * ```
 */
export function withRetry<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: RetryOptions = {}
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    const result = await retryAsync(() => fn(...args), options);

    if (result.success) {
      return result.data as TResult;
    }

    throw result.error;
  };
}

// ============================================================================
// Retry Controller Class
// ============================================================================

/**
 * Controller for managing retries with state tracking
 *
 * Provides a class-based interface for retry operations with:
 * - State tracking
 * - Cancellation
 * - Event callbacks
 * - Progress information
 *
 * @example
 * ```typescript
 * const controller = new RetryController({
 *   maxAttempts: 5,
 *   onRetry: (attempt, delay) => {
 *     updateUI(`Retrying in ${delay}ms...`);
 *   },
 * });
 *
 * try {
 *   const result = await controller.execute(() => fetch('/api/data'));
 *   console.log('Success:', result);
 * } catch (error) {
 *   console.log('Failed after', controller.state.totalAttempts, 'attempts');
 * }
 *
 * // Cancel if needed
 * controller.cancel();
 * ```
 */
export class RetryController {
  private abortController: AbortController;
  private _state: RetryState;
  private options: RetryOptions;
  private stateListeners: Set<(state: RetryState) => void> = new Set();

  constructor(options: RetryOptions = {}) {
    this.options = options;
    this.abortController = new AbortController();
    this._state = {
      attempt: 0,
      totalAttempts: 0,
      nextRetryIn: null,
      isRetrying: false,
      isExhausted: false,
      lastError: null,
    };
  }

  /**
   * Get current retry state
   */
  get state(): Readonly<RetryState> {
    return { ...this._state };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: RetryState) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  /**
   * Execute an operation with retry logic
   */
  async execute<T>(operation: (attempt: number) => Promise<T>): Promise<T> {
    // Reset state
    this.abortController = new AbortController();
    this.updateState({
      attempt: 0,
      totalAttempts: 0,
      nextRetryIn: null,
      isRetrying: true,
      isExhausted: false,
      lastError: null,
    });

    const result = await retryAsync(
      async (attempt) => {
        this.updateState({ attempt, totalAttempts: attempt });
        return operation(attempt);
      },
      {
        ...this.options,
        signal: this.abortController.signal,
        onRetry: (attempt, delay, error) => {
          this.updateState({
            attempt,
            nextRetryIn: delay,
            lastError: error,
          });
          this.options.onRetry?.(attempt, delay, error);
        },
        onExhausted: (error, totalAttempts) => {
          this.updateState({
            isExhausted: true,
            isRetrying: false,
            lastError: error,
            totalAttempts,
          });
          this.options.onExhausted?.(error, totalAttempts);
        },
      }
    );

    if (result.success) {
      this.updateState({
        isRetrying: false,
        nextRetryIn: null,
        totalAttempts: result.attempts,
      });
      return result.data as T;
    }

    throw result.error;
  }

  /**
   * Cancel the current retry operation
   */
  cancel(): void {
    this.abortController.abort();
    this.updateState({
      isRetrying: false,
      nextRetryIn: null,
    });
  }

  /**
   * Reset the controller for a new operation
   */
  reset(): void {
    this.cancel();
    this.updateState({
      attempt: 0,
      totalAttempts: 0,
      nextRetryIn: null,
      isRetrying: false,
      isExhausted: false,
      lastError: null,
    });
  }

  private updateState(partial: Partial<RetryState>): void {
    this._state = { ...this._state, ...partial };
    this.stateListeners.forEach((listener) => listener(this._state));
  }
}

// ============================================================================
// Fetch with Retry
// ============================================================================

/**
 * Options for fetchWithRetry
 */
export interface FetchWithRetryOptions extends RetryOptions {
  /** Fetch request options */
  fetchOptions?: RequestInit;
  /** Timeout for each request in ms */
  timeout?: number;
}

/**
 * Fetch with automatic retry on failure
 *
 * @param url - URL to fetch
 * @param options - Fetch and retry options
 * @returns Promise resolving to Response
 *
 * @example
 * ```typescript
 * const response = await fetchWithRetry('/api/games', {
 *   maxAttempts: 3,
 *   timeout: 10000,
 *   fetchOptions: {
 *     method: 'POST',
 *     body: JSON.stringify({ data: 'test' }),
 *   },
 * });
 *
 * const data = await response.json();
 * ```
 */
export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const { fetchOptions, timeout = 30000, ...retryOptions } = options;

  const result = await retryAsync(
    async () => {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        });

        // Throw on non-OK responses so they can be retried
        if (!response.ok) {
          throw new NetworkError(
            response.status >= 500 ? 'SERVER_ERROR' : 'BAD_REQUEST',
            `HTTP ${response.status}: ${response.statusText}`,
            {
              statusCode: response.status,
              statusText: response.statusText,
              url,
              method: fetchOptions?.method || 'GET',
            }
          );
        }

        return response;
      } finally {
        clearTimeout(timeoutId);
      }
    },
    {
      ...retryOptions,
      shouldRetry: (error, attempt) => {
        // Use custom shouldRetry if provided
        if (retryOptions.shouldRetry) {
          return retryOptions.shouldRetry(error, attempt);
        }

        // Don't retry client errors (4xx except rate limiting)
        if (error instanceof NetworkError) {
          if (
            error.metadata.statusCode &&
            error.metadata.statusCode >= 400 &&
            error.metadata.statusCode < 500
          ) {
            return error.type === 'RATE_LIMITED';
          }
        }

        return isRetryableError(error);
      },
    }
  );

  if (result.success && result.data) {
    return result.data;
  }

  throw result.error;
}
