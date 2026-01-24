/**
 * Leaderboard Routes
 *
 * Handles leaderboard queries for different game types and time periods.
 * Provides endpoints for retrieving top scores and player rankings.
 *
 * @module routes/leaderboard
 */

import { Router, type Request, type Response } from 'express';
import type { Router as RouterType } from 'express';

const router: RouterType = Router();

/**
 * GET /api/v1/leaderboard/:gameType/:periodType
 *
 * Get leaderboard rankings for a game and period.
 *
 * URL Parameters:
 * - gameType: 'snake' | 'tetris' | 'pong' | 'breakout' | 'space-invaders'
 * - periodType: 'daily' | 'weekly' | 'alltime'
 *
 * Query Parameters:
 * - limit: number (default: 10, max: 100)
 * - date: string (ISO date, optional, defaults to today for daily/weekly)
 *
 * Response:
 * - 400: Invalid parameters
 * - 200: Leaderboard entries
 */
router.get('/:gameType/:periodType', (_req: Request, res: Response) => {
  // TODO: Initialize LeaderboardService with getDatabase()
  // TODO: Validate path parameters
  // TODO: Validate query parameters
  // TODO: Query leaderboard via LeaderboardService
  // TODO: Return ranked entries
  res.status(501).json({
    error: 'Not implemented',
    message: 'Leaderboard endpoint will be implemented in later features',
  });
});

export default router;
