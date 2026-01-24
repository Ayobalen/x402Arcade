/**
 * Score Routes
 *
 * Handles score submission for completed game sessions.
 *
 * Note: GameService and LeaderboardService imports will be added
 * when route implementations are complete (upcoming features).
 *
 * @module routes/score
 */

import { Router, type Request, type Response } from 'express';
import type { Router as RouterType } from 'express';

const router: RouterType = Router();

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
