/**
 * useNetworkRequest Hook
 *
 * React hook for making network requests with:
 * - Automatic retry with exponential backoff
 * - Offline detection and queuing
 * - Loading and error state management
 * - Request cancellation
 *
 * @module hooks/useNetworkRequest
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  NetworkError,
  createNetworkErrorFromFetch,
  createNetworkErrorFromResponse,
  isOffline,
  getNetworkErrorMessage,
} from '@/utils/networkErrors';
import { type RetryOptions, type RetryState, RetryController } from '@/utils/retry';

// ============================================================================
// Types
// ============================================================================

/**
 * Request state
 */
export type RequestStatus = 'idle' | 'loading' | 'success' | 'error' | 'retrying';

/**
 * Network request state
 */
export interface NetworkRequestState<T> {
  /** Request status */
  status: RequestStatus;
  /** Response data if successful */
  data: T | null;
  /** Error if failed */
  error: NetworkError | null;
  /** Whether request is loading */
  isLoading: boolean;
  /** Whether request is retrying */
  isRetrying: boolean;
  /** Whether request succeeded */
  isSuccess: boolean;
  /** Whether request failed */
  isError: boolean;
  /** Retry state information */
  retryState: RetryState | null;
  /** User-friendly error message */
  errorMessage: string | null;
}

/**
 * Network request options
 */
export interface UseNetworkRequestOptions extends RetryOptions {
  /** Whether to retry on mount (default: false) */
  retryOnMount?: boolean;
  /** Whether to retry when coming online (default: true) */
  retryOnReconnect?: boolean;
  /** Transform response data */
  transformResponse?: <T>(data: T) => T;
}

/**
 * Network request result
 */
export interface UseNetworkRequestResult<T> extends NetworkRequestState<T> {
  /** Execute the request */
  execute: () => Promise<T | null>;
  /** Retry the last failed request */
  retry: () => Promise<T | null>;
  /** Cancel the current request */
  cancel: () => void;
  /** Reset state to idle */
  reset: () => void;
  /** Set data manually */
  setData: (data: T | null) => void;
  /** Set error manually */
  setError: (error: NetworkError | null) => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for making network requests with retry logic
 *
 * @param requestFn - The async function that makes the request
 * @param options - Request and retry options
 * @returns Request state and control functions
 *
 * @example
 * ```tsx
 * function GameList() {
 *   const {
 *     data,
 *     isLoading,
 *     isError,
 *     errorMessage,
 *     isRetrying,
 *     retryState,
 *     execute,
 *     retry,
 *     cancel,
 *   } = useNetworkRequest(
 *     async () => {
 *       const response = await fetch('/api/games');
 *       if (!response.ok) throw await createNetworkErrorFromResponse(response);
 *       return response.json();
 *     },
 *     {
 *       maxAttempts: 3,
 *       retryOnReconnect: true,
 *       onRetry: (attempt, delay) => {
 *         toast(`Retrying in ${delay}ms...`);
 *       },
 *     }
 *   );
 *
 *   useEffect(() => {
 *     execute();
 *   }, [execute]);
 *
 *   if (isLoading) return <Loading />;
 *   if (isRetrying) return <Retrying state={retryState} onCancel={cancel} />;
 *   if (isError) return <Error message={errorMessage} onRetry={retry} />;
 *   return <GameGrid games={data} />;
 * }
 * ```
 */
export function useNetworkRequest<T>(
  requestFn: () => Promise<T>,
  options: UseNetworkRequestOptions = {}
): UseNetworkRequestResult<T> {
  const {
    retryOnMount = false,
    retryOnReconnect = true,
    transformResponse,
    ...retryOptions
  } = options;

  // State
  const [status, setStatus] = useState<RequestStatus>('idle');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<NetworkError | null>(null);
  const [retryState, setRetryState] = useState<RetryState | null>(null);

  // Refs
  const controllerRef = useRef<RetryController | null>(null);
  const requestFnRef = useRef(requestFn);
  const lastRequestRef = useRef<(() => Promise<T>) | null>(null);

  // Keep request function ref updated
  useEffect(() => {
    requestFnRef.current = requestFn;
  }, [requestFn]);

  // Execute request with retry
  const execute = useCallback(async (): Promise<T | null> => {
    // Cancel any existing request
    controllerRef.current?.cancel();

    // Create new controller
    controllerRef.current = new RetryController({
      ...retryOptions,
      onRetry: (attempt, delay, err) => {
        setStatus('retrying');
        retryOptions.onRetry?.(attempt, delay, err);
      },
    });

    // Store request function for retry
    lastRequestRef.current = requestFnRef.current;

    // Subscribe to state changes
    const unsubscribe = controllerRef.current.subscribe((state) => {
      setRetryState(state);
    });

    setStatus('loading');
    setError(null);

    try {
      let result = await controllerRef.current.execute(async () => {
        // Check if offline before request
        if (isOffline()) {
          throw new NetworkError('OFFLINE', 'No network connection');
        }
        return requestFnRef.current();
      });

      // Transform response if needed
      if (transformResponse) {
        result = transformResponse(result);
      }

      setData(result);
      setStatus('success');
      return result;
    } catch (err) {
      // Convert to NetworkError if needed
      const networkError = err instanceof NetworkError ? err : createNetworkErrorFromFetch(err);

      setError(networkError);
      setStatus('error');
      return null;
    } finally {
      unsubscribe();
    }
  }, [retryOptions, transformResponse]);

  // Retry last failed request
  const retry = useCallback(async (): Promise<T | null> => {
    if (lastRequestRef.current) {
      return execute();
    }
    return null;
  }, [execute]);

  // Cancel current request
  const cancel = useCallback(() => {
    controllerRef.current?.cancel();
    setStatus('idle');
    setRetryState(null);
  }, []);

  // Reset state
  const reset = useCallback(() => {
    controllerRef.current?.cancel();
    setStatus('idle');
    setData(null);
    setError(null);
    setRetryState(null);
    lastRequestRef.current = null;
  }, []);

  // Set data manually
  const setDataManually = useCallback((newData: T | null) => {
    setData(newData);
    if (newData !== null) {
      setStatus('success');
      setError(null);
    }
  }, []);

  // Set error manually
  const setErrorManually = useCallback((newError: NetworkError | null) => {
    setError(newError);
    if (newError !== null) {
      setStatus('error');
    }
  }, []);

  // Retry on mount if configured - intentionally only run once on mount
  useEffect(() => {
    if (retryOnMount) {
      execute();
    }
  }, [retryOnMount, execute]);

  // Retry when coming back online
  useEffect(() => {
    if (!retryOnReconnect) return;

    const handleOnline = () => {
      // Only retry if we have a failed request
      if (status === 'error' && lastRequestRef.current) {
        retry();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [status, retry, retryOnReconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      controllerRef.current?.cancel();
    };
  }, []);

  return {
    status,
    data,
    error,
    isLoading: status === 'loading',
    isRetrying: status === 'retrying',
    isSuccess: status === 'success',
    isError: status === 'error',
    retryState,
    errorMessage: error ? getNetworkErrorMessage(error) : null,
    execute,
    retry,
    cancel,
    reset,
    setData: setDataManually,
    setError: setErrorManually,
  };
}

// ============================================================================
// Simplified Fetch Hook
// ============================================================================

/**
 * Options for useFetch hook
 */
export interface UseFetchOptions<T> extends UseNetworkRequestOptions {
  /** Fetch options */
  fetchOptions?: RequestInit;
  /** Request timeout in ms */
  timeout?: number;
  /** Whether to execute on mount (default: true) */
  immediate?: boolean;
  /** Dependencies that trigger re-fetch */
  deps?: unknown[];
  /** Parse response as JSON (default: true) */
  parseJson?: boolean;
  /** Validate/transform response */
  validate?: (data: unknown) => T;
}

/**
 * Simplified hook for fetch requests
 *
 * @param url - URL to fetch
 * @param options - Fetch and hook options
 * @returns Request state and control functions
 *
 * @example
 * ```tsx
 * function UserProfile({ userId }: { userId: string }) {
 *   const { data, isLoading, isError, retry } = useFetch<User>(
 *     `/api/users/${userId}`,
 *     { deps: [userId] }
 *   );
 *
 *   if (isLoading) return <Loading />;
 *   if (isError) return <Error onRetry={retry} />;
 *   return <Profile user={data} />;
 * }
 * ```
 */
export function useFetch<T>(
  url: string,
  options: UseFetchOptions<T> = {}
): UseNetworkRequestResult<T> {
  const {
    fetchOptions,
    timeout = 30000,
    immediate = true,
    deps = [],
    parseJson = true,
    validate,
    ...networkOptions
  } = options;

  const requestFn = useCallback(async (): Promise<T> => {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw await createNetworkErrorFromResponse(response, {
          url,
          method: fetchOptions?.method || 'GET',
        });
      }

      let data: unknown;
      if (parseJson) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Validate/transform if provided
      if (validate) {
        return validate(data);
      }

      return data as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }, [url, timeout, parseJson, fetchOptions, validate]);

  const result = useNetworkRequest(requestFn, {
    ...networkOptions,
    retryOnMount: immediate,
  });

  // Re-fetch when deps change - deps is intentionally spread as the dependency array
  useEffect(() => {
    if (immediate && deps.length > 0) {
      result.execute();
    }
    // deps is a user-provided array that controls when to re-fetch
  }, [immediate, result, ...deps]);

  return result;
}

export default useNetworkRequest;
