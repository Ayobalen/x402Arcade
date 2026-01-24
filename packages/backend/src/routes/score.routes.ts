/**
 * Score Routes
 *
 * Handles score submission for completed game sessions.
 *
 * @module routes/score
 */

import { Router, type Request, type Response } from 'express';
import type { Router as RouterType } from 'express';
import { GameService } from '../services/game.js';
import { LeaderboardService } from '../services/leaderboard.js';
import { getDatabase } from '../db/index.js';

const router: RouterType = Router();

// Initialize services with database
const db = getDatabase();
const gameService = new GameService(db);
const leaderboardService = new LeaderboardService(db);

/**
 * POST /api/v1/score/submit
 *
 * Submit a score for a completed game session.
 *
 * Request Body:
 * - sessionId: string (UUID)
 * - score: number (>= 0)
 * - playerAddress: string (Ethereum address)
 *
 * Response:
 * - 400: Invalid request (missing fields or invalid values)
 * - 404: Session not found
 * - 409: Session already completed or not active
 * - 200: Score submitted successfully
 */
router.post('/submit', (req: Request, res: Response) => {
  const { sessionId, score, playerAddress } = req.body;

  // Validate required fields
  if (!sessionId || typeof sessionId !== 'string') {
    res.status(400).json({
      error: 'Validation error',
      message: 'sessionId is required and must be a string (UUID)',
    });
    return;
  }

  if (score === undefined || score === null || typeof score !== 'number') {
    res.status(400).json({
      error: 'Validation error',
      message: 'score is required and must be a number',
    });
    return;
  }

  if (score < 0) {
    res.status(400).json({
      error: 'Validation error',
      message: 'score must be >= 0',
    });
    return;
  }

  if (!playerAddress || typeof playerAddress !== 'string') {
    res.status(400).json({
      error: 'Validation error',
      message: 'playerAddress is required and must be a string (Ethereum address)',
    });
    return;
  }

  // Validate Ethereum address format (basic check: 0x + 40 hex chars)
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  if (!ethAddressRegex.test(playerAddress)) {
    res.status(400).json({
      error: 'Validation error',
      message: 'playerAddress must be a valid Ethereum address (0x + 40 hex characters)',
    });
    return;
  }

  // Call GameService.completeSession() - throws on error
  let session;
  try {
    session = gameService.completeSession(sessionId, score);
  } catch (error) {
    if (error instanceof Error) {
      // Determine appropriate status code based on error message
      if (error.message.includes('Session not found')) {
        res.status(404).json({
          error: 'Not found',
          message: error.message,
        });
        return;
      } else if (error.message.includes('Cannot complete session')) {
        // Session exists but is not active (completed, expired, failed)
        res.status(409).json({
          error: 'Conflict',
          message: error.message,
        });
        return;
      } else {
        // Other unexpected errors
        res.status(500).json({
          error: 'Internal server error',
          message: 'Failed to complete game session',
        });
        return;
      }
    }
    // Non-Error exception
    res.status(500).json({
      error: 'Internal server error',
      message: 'Unexpected error completing game session',
    });
    return;
  }

  // Add entry to leaderboard
  try {
    leaderboardService.addEntry({
      sessionId: session.id,
      gameType: session.gameType,
      playerAddress,
      score: session.score!,
    });
  } catch (error) {
    // Log error but don't fail the request
    // Score was already recorded in GameService
    // eslint-disable-next-line no-console
    console.error('Failed to add leaderboard entry:', error);
  }

  // Return 200 with updated session
  res.status(200).json({
    message: 'Score submitted successfully',
    session: {
      sessionId: session.id,
      gameType: session.gameType,
      status: session.status,
      score: session.score,
      completedAt: session.completedAt,
      gameDurationMs: session.gameDurationMs,
    },
  });
});

export default router;
