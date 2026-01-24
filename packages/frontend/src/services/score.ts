/**
 * Score Service
 *
 * Functions for submitting and managing game scores.
 * Uses session authentication to verify score ownership.
 *
 * @module services/score
 */

import { env } from '@/lib/env';

// ============================================================================
// Types
// ============================================================================

/**
 * Score submission request
 */
export interface SubmitScoreRequest {
  /** Game session ID from startGame */
  sessionId: string;
  /** Final game score */
  score: number;
}

/**
 * Score submission response
 */
export interface SubmitScoreResponse {
  /** Whether submission was successful */
  success: boolean;
  /** Updated session with score (if successful) */
  session?: {
    id: string;
    gameType: string;
    playerAddress: string;
    score: number;
    status: string;
    completedAt: string;
    durationMs: number;
  };
  /** Error message (if failed) */
  error?: string;
  /** Error code for programmatic handling */
  errorCode?: string;
}

/**
 * Score submission error codes
 */
export type ScoreErrorCode =
  | 'INVALID_SESSION_ID'
  | 'INVALID_SCORE'
  | 'SESSION_NOT_FOUND'
  | 'SESSION_NOT_ACTIVE'
  | 'ALREADY_COMPLETED'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR';

/**
 * Score submission error
 */
export class ScoreSubmissionError extends Error {
  readonly code: ScoreErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(code: ScoreErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ScoreSubmissionError';
    this.code = code;
    this.details = details;
  }
}

// ============================================================================
// Validation
// ============================================================================

/**
 * UUID v4 regex pattern for session ID validation
 */
const SESSION_ID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Maximum valid score (to prevent abuse)
 */
const MAX_SCORE = 999_999_999;

/**
 * Validate session ID format
 *
 * @param sessionId - The session ID to validate
 * @returns true if valid UUID v4 format
 */
export function isValidSessionId(sessionId: unknown): sessionId is string {
  return typeof sessionId === 'string' && SESSION_ID_REGEX.test(sessionId);
}

/**
 * Validate score value
 *
 * @param score - The score to validate
 * @returns true if score is valid (non-negative integer within limits)
 */
export function isValidScore(score: unknown): score is number {
  return (
    typeof score === 'number' &&
    Number.isFinite(score) &&
    Number.isInteger(score) &&
    score >= 0 &&
    score <= MAX_SCORE
  );
}

// ============================================================================
// Score Submission
// ============================================================================

/**
 * Submit a game score to the server
 *
 * Sends the final score for a game session to be recorded on the leaderboard.
 * The session must be active (not already completed or expired).
 *
 * @param sessionId - The game session ID returned from startGame
 * @param score - The final game score (non-negative integer)
 * @returns Promise resolving to submission result
 * @throws {ScoreSubmissionError} If validation fails or server returns error
 *
 * @example
 * ```typescript
 * try {
 *   const result = await submitScore(sessionId, 1500);
 *   if (result.success) {
 *     console.log('Score submitted:', result.session?.score);
 *     // Show "Game Over" screen with leaderboard position
 *   }
 * } catch (error) {
 *   if (error instanceof ScoreSubmissionError) {
 *     console.error('Failed to submit score:', error.code, error.message);
 *   }
 * }
 * ```
 */
export async function submitScore(sessionId: string, score: number): Promise<SubmitScoreResponse> {
  // Step 1: Validate sessionId
  if (!isValidSessionId(sessionId)) {
    throw new ScoreSubmissionError('INVALID_SESSION_ID', `Invalid session ID format: ${sessionId}`);
  }

  // Step 2: Validate score
  if (!isValidScore(score)) {
    throw new ScoreSubmissionError(
      'INVALID_SCORE',
      `Invalid score: ${score}. Must be a non-negative integer.`,
      { score }
    );
  }

  // Step 3: Build request URL
  const apiUrl = env.VITE_API_URL;
  const endpoint = `${apiUrl}/api/score/${sessionId}`;

  // Step 4: Make authenticated request
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ score }),
    });

    // Step 5: Handle response
    if (!response.ok) {
      // Parse error response
      let errorBody: { error?: string; errorCode?: string } = {};
      try {
        errorBody = await response.json();
      } catch {
        // Response body not JSON, use status text
      }

      // Map HTTP status to error code
      const errorCode = mapStatusToErrorCode(response.status, errorBody.errorCode);
      throw new ScoreSubmissionError(
        errorCode,
        errorBody.error || `Server returned ${response.status}`,
        { status: response.status }
      );
    }

    // Step 6: Parse successful response
    const result = (await response.json()) as SubmitScoreResponse;
    return result;
  } catch (error) {
    // Re-throw ScoreSubmissionError
    if (error instanceof ScoreSubmissionError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ScoreSubmissionError(
        'NETWORK_ERROR',
        'Failed to connect to server. Check your network connection.',
        { originalError: String(error) }
      );
    }

    // Handle other errors
    throw new ScoreSubmissionError(
      'SERVER_ERROR',
      error instanceof Error ? error.message : 'Unknown error occurred',
      { originalError: String(error) }
    );
  }
}

/**
 * Map HTTP status code to ScoreErrorCode
 */
function mapStatusToErrorCode(status: number, serverCode?: string): ScoreErrorCode {
  // Use server-provided code if available
  if (serverCode) {
    const knownCodes: ScoreErrorCode[] = [
      'INVALID_SESSION_ID',
      'INVALID_SCORE',
      'SESSION_NOT_FOUND',
      'SESSION_NOT_ACTIVE',
      'ALREADY_COMPLETED',
    ];
    if (knownCodes.includes(serverCode as ScoreErrorCode)) {
      return serverCode as ScoreErrorCode;
    }
  }

  // Map by HTTP status
  switch (status) {
    case 400:
      return 'INVALID_SCORE';
    case 404:
      return 'SESSION_NOT_FOUND';
    case 409:
      return 'ALREADY_COMPLETED';
    default:
      return 'SERVER_ERROR';
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Submit score with retry on transient failures
 *
 * Automatically retries the request on network errors or 5xx server errors.
 *
 * @param sessionId - The game session ID
 * @param score - The final game score
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param retryDelayMs - Delay between retries in milliseconds (default: 1000)
 * @returns Promise resolving to submission result
 */
export async function submitScoreWithRetry(
  sessionId: string,
  score: number,
  maxRetries = 3,
  retryDelayMs = 1000
): Promise<SubmitScoreResponse> {
  let lastError: ScoreSubmissionError | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await submitScore(sessionId, score);
    } catch (error) {
      if (!(error instanceof ScoreSubmissionError)) {
        throw error;
      }

      lastError = error;

      // Only retry on transient errors
      const isRetryable = error.code === 'NETWORK_ERROR' || error.code === 'SERVER_ERROR';
      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }

  throw lastError!;
}

// ============================================================================
// Exports
// ============================================================================

export default {
  submitScore,
  submitScoreWithRetry,
  isValidSessionId,
  isValidScore,
  ScoreSubmissionError,
};
