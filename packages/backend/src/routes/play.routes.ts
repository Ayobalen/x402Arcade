/**
 * Play Routes
 *
 * Handles game session creation and x402 payment processing.
 * Routes in this module require payment via the x402 protocol.
 *
 * @module routes/play
 */

import { Router, type Request, type Response } from 'express';
import type { Router as RouterType } from 'express';

const router: RouterType = Router();

/**
 * POST /api/v1/play
 *
 * Create a new game session with x402 payment.
 * Returns 402 Payment Required if no payment header is present.
 *
 * Request Headers:
 * - X-Payment: base64-encoded x402 payment authorization
 *
 * Request Body:
 * - gameType: 'snake' | 'tetris' | 'pong' | 'breakout' | 'space-invaders'
 *
 * Response:
 * - 402: Payment required (with X-402-* headers)
 * - 400: Invalid request
 * - 200: Session created successfully
 */
router.post('/', (_req: Request, res: Response) => {
  // TODO: Implement x402 payment middleware
  // TODO: Validate game type
  // TODO: Create game session
  // TODO: Return session ID
  res.status(501).json({
    error: 'Not implemented',
    message: 'Play endpoint will be implemented in later features',
  });
});

export default router;
