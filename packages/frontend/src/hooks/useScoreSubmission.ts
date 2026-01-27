/**
 * Score Submission Hook
 *
 * React hook for managing game score submission to the backend.
 * Handles submission state, loading, errors, and retry logic.
 *
 * @module hooks/useScoreSubmission
 */

import { useState, useCallback } from 'react';
import {
  submitScoreWithRetry,
  ScoreSubmissionError,
  type SubmitScoreResponse,
} from '../services/score';

// ============================================================================
// Types
// ============================================================================

/**
 * Submission status states
 */
export type SubmissionStatus =
  | 'idle' // No submission in progress
  | 'submitting' // Submission in progress
  | 'success' // Submission successful
  | 'error'; // Submission failed

/**
 * Submission error information
 */
export interface SubmissionError {
  /** Error code for programmatic handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Whether the submission can be retried */
  retryable: boolean;
}

/**
 * Hook return type
 */
export interface UseScoreSubmissionReturn {
  /** Current submission status */
  status: SubmissionStatus;
  /** Whether a submission is in progress */
  isSubmitting: boolean;
  /** Whether submission was successful */
  isSuccess: boolean;
  /** Whether submission failed */
  isError: boolean;
  /** Error information if submission failed */
  error: SubmissionError | null;
  /** Last successful submission result */
  result: SubmitScoreResponse | null;
  /** Submit a score */
  submit: (sessionId: string, score: number, playerAddress: string) => Promise<SubmitScoreResponse | null>;
  /** Reset the submission state */
  reset: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Custom hook for score submission.
 *
 * Provides a simple interface for submitting game scores with automatic
 * error handling and retry logic.
 *
 * @returns Score submission state and methods
 *
 * @example
 * ```tsx
 * function GameOverScreen({ sessionId, score }: Props) {
 *   const { submit, isSubmitting, isSuccess, isError, error } = useScoreSubmission();
 *
 *   const handleSubmit = async () => {
 *     const result = await submit(sessionId, score);
 *     if (result) {
 *       console.log('Score submitted!', result.session?.score);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <h2>Game Over!</h2>
 *       <p>Your score: {score}</p>
 *       {isSubmitting && <p>Submitting score...</p>}
 *       {isSuccess && <p>Score submitted successfully!</p>}
 *       {isError && <p>Error: {error?.message}</p>}
 *       <button onClick={handleSubmit} disabled={isSubmitting || isSuccess}>
 *         Submit Score
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useScoreSubmission(): UseScoreSubmissionReturn {
  // State
  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [error, setError] = useState<SubmissionError | null>(null);
  const [result, setResult] = useState<SubmitScoreResponse | null>(null);

  // Derived state
  const isSubmitting = status === 'submitting';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  /**
   * Submit a score
   */
  const submit = useCallback(
    async (sessionId: string, score: number, playerAddress: string): Promise<SubmitScoreResponse | null> => {
      // Validate inputs
      if (!sessionId) {
        setStatus('error');
        setError({
          code: 'INVALID_SESSION_ID',
          message: 'Session ID is required',
          retryable: false,
        });
        return null;
      }

      if (score < 0) {
        setStatus('error');
        setError({
          code: 'INVALID_SCORE',
          message: 'Score must be non-negative',
          retryable: false,
        });
        return null;
      }

      if (!playerAddress) {
        setStatus('error');
        setError({
          code: 'INVALID_PLAYER_ADDRESS',
          message: 'Player address is required',
          retryable: false,
        });
        return null;
      }

      // Start submission
      setStatus('submitting');
      setError(null);

      try {
        // Submit with retry
        const response = await submitScoreWithRetry(sessionId, score, playerAddress);

        if (response.success) {
          setStatus('success');
          setResult(response);
          return response;
        } else {
          // API returned error
          setStatus('error');
          setError({
            code: response.errorCode || 'UNKNOWN_ERROR',
            message: response.error || 'Unknown error occurred',
            retryable: false,
          });
          return null;
        }
      } catch (err) {
        // Handle submission error
        setStatus('error');

        if (err instanceof ScoreSubmissionError) {
          setError({
            code: err.code,
            message: err.message,
            retryable: err.code === 'NETWORK_ERROR' || err.code === 'SERVER_ERROR',
          });
        } else {
          setError({
            code: 'UNKNOWN_ERROR',
            message: err instanceof Error ? err.message : 'Unknown error occurred',
            retryable: true,
          });
        }

        return null;
      }
    },
    []
  );

  /**
   * Reset submission state
   */
  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setResult(null);
  }, []);

  return {
    status,
    isSubmitting,
    isSuccess,
    isError,
    error,
    result,
    submit,
    reset,
  };
}

export default useScoreSubmission;
