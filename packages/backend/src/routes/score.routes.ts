/**
 * Score Routes
 *
 * Handles score submission for completed game sessions.
 *
 * @module routes/score
 */

import { Router, type Request, type Response } from 'express';
import type { Router as RouterType } from 'express';
import * as GameService from '../services/game.js';
import { LeaderboardService } from '../services/leaderboard.js';

const router: RouterType = Router();

// Services imported for upcoming score submission implementation
// Temporary reference to satisfy linting rules until actual implementation
void GameService;
void LeaderboardService;

/**
 * POST /api/v1/score
 *
 * Submit a score for a game session.
 *
 * Request Body:
 * - sessionId: string (UUID)
 * - score: number (>= 0)
 * - playerAddress: string (Ethereum address)
 *
 * Response:
 * - 400: Invalid request
 * - 404: Session not found
 * - 200: Score submitted successfully
 */
router.post('/', (_req: Request, res: Response) => {
  // TODO: Validate request body
  // TODO: Verify session exists and is active
  // TODO: Submit score via GameService
  // TODO: Add entry to leaderboard
  res.status(501).json({
    error: 'Not implemented',
    message: 'Score endpoint will be implemented in later features',
  });
});

export default router;
