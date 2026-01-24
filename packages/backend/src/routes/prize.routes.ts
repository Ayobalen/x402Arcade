/**
 * Prize Pool Routes
 *
 * Handles prize pool queries and payout information.
 *
 * @module routes/prize
 */

import { Router, type Request, type Response } from 'express';
import type { Router as RouterType } from 'express';
import { PrizePoolService, type GameType, type PeriodType } from '../services/prizePool.js';
import { getDatabase } from '../db/index.js';

const router: RouterType = Router();

// Lazy initialization - get service only when routes are called
let prizePoolService: PrizePoolService | null = null;

function getPrizePoolService(): PrizePoolService {
  if (!prizePoolService) {
    const db = getDatabase();
    prizePoolService = new PrizePoolService(db);
  }
  return prizePoolService;
}

// Valid game types
const VALID_GAME_TYPES = new Set<string>(['snake', 'tetris', 'pong', 'breakout', 'space-invaders']);

// Valid period types for prize pools (only daily and weekly, no alltime)
const VALID_PERIOD_TYPES = new Set<string>(['daily', 'weekly']);

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
 * - 404: Prize pool not found
 * - 200: Prize pool information
 */
router.get('/:gameType/:periodType', (req: Request, res: Response) => {
  // Extract path parameters
  const { gameType, periodType } = req.params;

  // Validate gameType
  if (!gameType || !VALID_GAME_TYPES.has(gameType)) {
    res.status(400).json({
      error: 'Validation error',
      message: `Game type must be one of: ${Array.from(VALID_GAME_TYPES).join(', ')}`,
    });
    return;
  }

  // Validate periodType
  if (!periodType || !VALID_PERIOD_TYPES.has(periodType)) {
    res.status(400).json({
      error: 'Validation error',
      message: `Period type must be one of: ${Array.from(VALID_PERIOD_TYPES).join(', ')}`,
    });
    return;
  }

  try {
    // Get prize pool service
    const service = getPrizePoolService();

    // Query current prize pool
    const pool = service.getCurrentPool({
      gameType: gameType as GameType,
      periodType: periodType as PeriodType,
    });

    // Return 404 if no pool exists
    if (!pool) {
      res.status(404).json({
        error: 'Not found',
        message: `No active prize pool found for ${gameType} (${periodType})`,
      });
      return;
    }

    // Return prize pool information
    res.status(200).json({
      pool,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error retrieving prize pool:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve prize pool',
    });
  }
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
