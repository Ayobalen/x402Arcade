/**
 * Services Module
 *
 * Centralized exports for all API service functions.
 *
 * @module services
 */

// Score submission
export {
  submitScore,
  submitScoreWithRetry,
  isValidSessionId,
  isValidScore,
  ScoreSubmissionError,
  type SubmitScoreRequest,
  type SubmitScoreResponse,
  type ScoreErrorCode,
} from './score';
