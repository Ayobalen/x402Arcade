/**
 * Prize Pool Routes
 *
 * Handles prize pool queries and payout information.
 *
 * @module routes/prize
 */

import { Router, type Request, type Response } from 'express';
import type { Router as RouterType } from 'express';
import { PrizePoolService } from '../services/prizePool.js';
import { getDatabase } from '../db/index.js';

const router: RouterType = Router();

// Lazy initialization - get service only when routes are called
let prizePoolService: PrizePoolService | null = null;

function _getPrizePoolService(): PrizePoolService {
  if (!prizePoolService) {
    const db = getDatabase();
    prizePoolService = new PrizePoolService(db);
  }
  return prizePoolService;
}

/**
 * GET /api/v1/prize/:gameType/:periodType
 *
 * Get current prize pool for a game and period.
 *
 * URL Parameters:
 * - gameType: 'snake' | 'tetris' | 'pong' | 'breakout' | 'space-invaders'
 * - periodType: 'daily' | 'weekly'
 *
 * Query Parameters:
 * - date: string (ISO date, optional, defaults to today)
 *
 * Response:
 * - 400: Invalid parameters
 * - 200: Prize pool information
 */
router.get('/:gameType/:periodType', (_req: Request, res: Response) => {
  // Initialize service for future use
  _getPrizePoolService();

  // TODO: Validate path parameters
  // TODO: Query prize pool via PrizePoolService
  // TODO: Return pool information
  res.status(501).json({
    error: 'Not implemented',
    message: 'Prize pool endpoint will be implemented in later features',
  });
});

/**
 * GET /api/v1/prize/history
 *
 * Get prize pool history across all games.
 *
 * Query Parameters:
 * - limit: number (default: 10)
 * - offset: number (default: 0)
 *
 * Response:
 * - 200: List of finalized/paid prize pools
 */
router.get('/history', (_req: Request, res: Response) => {
  // TODO: Query prize pool history
  // TODO: Return paginated results
  res.status(501).json({
    error: 'Not implemented',
    message: 'Prize history endpoint will be implemented in later features',
  });
});

export default router;
