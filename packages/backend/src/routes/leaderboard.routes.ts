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
import { LeaderboardService, type GameType, type PeriodType } from '../services/leaderboard.js';
import { getDatabase } from '../db/index.js';

const router: RouterType = Router();

// Lazy initialization - get service only when routes are called
let leaderboardService: LeaderboardService | null = null;

function getLeaderboardService(): LeaderboardService {
  if (!leaderboardService) {
    const db = getDatabase();
    leaderboardService = new LeaderboardService(db);
  }
  return leaderboardService;
}

// Valid game types
const VALID_GAME_TYPES = new Set<string>(['snake', 'tetris', 'pong', 'breakout', 'space-invaders']);

// Valid period types
const VALID_PERIOD_TYPES = new Set<string>(['daily', 'weekly', 'alltime']);

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
router.get('/:gameType/:periodType', async (req: Request, res: Response) => {
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

  // Extract and validate query parameters
  const limitParam = req.query.limit;
  const offsetParam = req.query.offset;
  let limit = 10; // default
  let offset = 0; // default

  if (limitParam !== undefined) {
    const parsedLimit = parseInt(limitParam as string, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1) {
      res.status(400).json({
        error: 'Validation error',
        message: 'limit must be a positive number',
      });
      return;
    }
    if (parsedLimit > 100) {
      res.status(400).json({
        error: 'Validation error',
        message: 'limit cannot exceed 100',
      });
      return;
    }
    limit = parsedLimit;
  }

  if (offsetParam !== undefined) {
    const parsedOffset = parseInt(offsetParam as string, 10);
    if (isNaN(parsedOffset) || parsedOffset < 0) {
      res.status(400).json({
        error: 'Validation error',
        message: 'offset must be a non-negative number',
      });
      return;
    }
    offset = parsedOffset;
  }

  try {
    // Get leaderboard service
    const service = getLeaderboardService();

    // Get current period dates
    const periods = LeaderboardService.getCurrentPeriods();
    const periodDate =
      periodType === 'alltime'
        ? 'alltime'
        : periodType === 'daily'
          ? periods.daily
          : periods.weekly;

    // Query leaderboard
    const entries = await service.getTopScores(
      gameType as GameType,
      periodType as PeriodType,
      periodDate,
      limit
    );

    // Set caching headers for leaderboard response
    // Cache for 30 seconds to balance freshness with performance
    res.set('Cache-Control', 'public, max-age=30, s-maxage=30');
    res.set('Vary', 'Accept-Encoding');

    // Return leaderboard entries
    res.status(200).json({
      gameType,
      periodType,
      limit,
      offset,
      count: entries.length,
      entries,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error retrieving leaderboard:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve leaderboard',
    });
  }
});

export default router;
