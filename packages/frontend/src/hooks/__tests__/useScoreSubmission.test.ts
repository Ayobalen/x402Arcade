/**
 * useScoreSubmission Hook Tests
 *
 * Tests for the score submission hook functionality.
 *
 * @module hooks/__tests__/useScoreSubmission.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useScoreSubmission } from '../useScoreSubmission';
import * as scoreService from '../../services/score';

// Mock the score service
vi.mock('../../services/score', () => ({
  submitScoreWithRetry: vi.fn(),
  ScoreSubmissionError: class ScoreSubmissionError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
}));

describe('useScoreSubmission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initial State', () => {
    it('should have idle status initially', () => {
      const { result } = renderHook(() => useScoreSubmission());

      expect(result.current.status).toBe('idle');
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.result).toBeNull();
    });

    it('should provide submit and reset functions', () => {
      const { result } = renderHook(() => useScoreSubmission());

      expect(typeof result.current.submit).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('Validation', () => {
    it('should reject empty session ID', async () => {
      const { result } = renderHook(() => useScoreSubmission());

      await act(async () => {
        await result.current.submit('', 100);
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error?.code).toBe('INVALID_SESSION_ID');
      expect(result.current.error?.retryable).toBe(false);
    });

    it('should reject negative score', async () => {
      const { result } = renderHook(() => useScoreSubmission());

      await act(async () => {
        await result.current.submit('valid-session-id', -1);
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error?.code).toBe('INVALID_SCORE');
      expect(result.current.error?.retryable).toBe(false);
    });
  });

  describe('Successful Submission', () => {
    it('should submit score successfully', async () => {
      const mockResponse = {
        success: true,
        session: {
          id: 'session-123',
          gameType: 'snake',
          playerAddress: '0x123',
          score: 100,
          status: 'completed',
          completedAt: new Date().toISOString(),
          durationMs: 60000,
        },
      };

      vi.mocked(scoreService.submitScoreWithRetry).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useScoreSubmission());

      await act(async () => {
        const response = await result.current.submit('12345678-1234-4123-9123-123456789012', 100);
        expect(response).toEqual(mockResponse);
      });

      expect(result.current.status).toBe('success');
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.result).toEqual(mockResponse);
    });

    it('should set submitting state during submission', async () => {
      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      vi.mocked(scoreService.submitScoreWithRetry).mockReturnValue(pendingPromise as any);

      const { result } = renderHook(() => useScoreSubmission());

      // Start submission
      act(() => {
        result.current.submit('12345678-1234-4123-9123-123456789012', 100);
      });

      // Should be submitting
      expect(result.current.status).toBe('submitting');
      expect(result.current.isSubmitting).toBe(true);

      // Resolve
      await act(async () => {
        resolvePromise!({ success: true });
      });
    });
  });

  describe('Failed Submission', () => {
    it('should handle API error response', async () => {
      const mockResponse = {
        success: false,
        error: 'Session not found',
        errorCode: 'SESSION_NOT_FOUND',
      };

      vi.mocked(scoreService.submitScoreWithRetry).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useScoreSubmission());

      await act(async () => {
        const response = await result.current.submit('12345678-1234-4123-9123-123456789012', 100);
        expect(response).toBeNull();
      });

      expect(result.current.status).toBe('error');
      expect(result.current.isError).toBe(true);
      expect(result.current.error?.code).toBe('SESSION_NOT_FOUND');
    });

    it('should handle ScoreSubmissionError', async () => {
      const error = new scoreService.ScoreSubmissionError('NETWORK_ERROR', 'Connection failed');

      vi.mocked(scoreService.submitScoreWithRetry).mockRejectedValue(error);

      const { result } = renderHook(() => useScoreSubmission());

      await act(async () => {
        await result.current.submit('12345678-1234-4123-9123-123456789012', 100);
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error?.code).toBe('NETWORK_ERROR');
      expect(result.current.error?.retryable).toBe(true);
    });

    it('should handle unknown errors', async () => {
      vi.mocked(scoreService.submitScoreWithRetry).mockRejectedValue(
        new Error('Something went wrong')
      );

      const { result } = renderHook(() => useScoreSubmission());

      await act(async () => {
        await result.current.submit('12345678-1234-4123-9123-123456789012', 100);
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error?.code).toBe('UNKNOWN_ERROR');
      expect(result.current.error?.retryable).toBe(true);
    });
  });

  describe('Reset', () => {
    it('should reset state to initial values', async () => {
      const mockResponse = { success: true };
      vi.mocked(scoreService.submitScoreWithRetry).mockResolvedValue(mockResponse as any);

      const { result } = renderHook(() => useScoreSubmission());

      // Submit first
      await act(async () => {
        await result.current.submit('12345678-1234-4123-9123-123456789012', 100);
      });

      expect(result.current.status).toBe('success');

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.status).toBe('idle');
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.result).toBeNull();
    });
  });
});
