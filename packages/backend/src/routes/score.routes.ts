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
import { validateScore } from '../lib/score-validation.js';

const router: RouterType = Router();

// Lazy initialization - get services only when routes are called
let gameService: GameService | null = null;
let leaderboardService: LeaderboardService | null = null;

function getServices() {
  if (!gameService || !leaderboardService) {
    const db = getDatabase();
    gameService = new GameService(db);
    leaderboardService = new LeaderboardService(db);
  }
  return { gameService, leaderboardService };
}

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
router.post('/submit', async (req: Request, res: Response) => {
  const { sessionId, score, playerAddress } = req.body;

  // Validate required fields
  if (!sessionId || typeof sessionId !== 'string') {
    res.status(400).json({
      error: 'Validation error',
      message: 'sessionId is required and must be a string (UUID)',
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

  // Get services (lazy initialization)
  const { gameService, leaderboardService } = getServices();

  // Fetch session to get gameType for game-specific score validation
  const existingSession = await gameService.getSession(sessionId);
  if (!existingSession) {
    res.status(404).json({
      error: 'Not found',
      message: `Session not found: ${sessionId}`,
    });
    return;
  }

  // Validate score with game-specific limits
  const scoreValidation = validateScore(score, existingSession.gameType);
  if (!scoreValidation.valid) {
    res.status(400).json({
      error: 'Validation error',
      message: scoreValidation.error,
      code: scoreValidation.code,
    });
    return;
  }

  // Call GameService.completeSession() - throws on error
  let session;
  try {
    session = await gameService.completeSession(sessionId, score);
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

  // Add entry to leaderboard and get ranking
  let dailyRanking = null;
  let weeklyRanking = null;
  let alltimeRanking = null;

  try {
    await leaderboardService.addEntry(session.id, session.gameType, playerAddress, session.score!);

    // Get current period dates
    const periods = LeaderboardService.getCurrentPeriods();

    // Get player rankings for all periods
    try {
      dailyRanking = await leaderboardService.getPlayerRank(
        session.gameType,
        playerAddress,
        'daily',
        periods.daily
      );
    } catch (rankError) {
       
      console.error('Failed to get daily ranking:', rankError);
    }

    try {
      weeklyRanking = await leaderboardService.getPlayerRank(
        session.gameType,
        playerAddress,
        'weekly',
        periods.weekly
      );
    } catch (rankError) {
       
      console.error('Failed to get weekly ranking:', rankError);
    }

    try {
      alltimeRanking = await leaderboardService.getPlayerRank(
        session.gameType,
        playerAddress,
        'alltime',
        'alltime'
      );
    } catch (rankError) {
       
      console.error('Failed to get alltime ranking:', rankError);
    }
  } catch (error) {
    // Log error but don't fail the request
    // Score was already recorded in GameService
     
    console.error('Failed to add leaderboard entry:', error);
  }

  // Return 200 with updated session and rankings
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
    rankings: {
      daily: dailyRanking,
      weekly: weeklyRanking,
      alltime: alltimeRanking,
    },
  });
});

export default router;
