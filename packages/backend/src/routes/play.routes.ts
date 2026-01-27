/**
 * Play Routes
 *
 * Handles game session creation and x402 payment processing.
 * Routes in this module require payment via the x402 protocol.
 *
 * @module routes/play
 */

import { Router, type Response } from 'express';
import type { Router as RouterType } from 'express';
import type { X402Request } from '../server/middleware/x402.js';
import { createX402Middleware } from '../server/middleware/x402.js';
import { GameService } from '../services/game.js';
import { PrizePoolService } from '../services/prizePool.js';
import { getDatabase } from '../db/index.js';
import { parseUSDC } from '../lib/chain/constants.js';

const router: RouterType = Router();

// Lazy initialization - get services only when routes are called
let gameService: GameService | null = null;
let prizePoolService: PrizePoolService | null = null;

function getServices() {
  if (!gameService || !prizePoolService) {
    const db = getDatabase();
    gameService = new GameService(db);
    prizePoolService = new PrizePoolService(db);
  }
  return { gameService, prizePoolService };
}

// Arcade wallet address from environment
// Note: Validation happens at route execution time, not module load time
function getArcadeWallet(): string {
  const wallet = process.env.ARCADE_WALLET_ADDRESS;
  if (!wallet || wallet === '0x0000000000000000000000000000000000000000') {
    throw new Error('ARCADE_WALLET_ADDRESS must be configured with a valid wallet address');
  }
  return wallet;
}

// Game prices in USDC
const GAME_PRICES: Record<string, bigint> = {
  snake: parseUSDC(0.01), // $0.01 USDC
  tetris: parseUSDC(0.02), // $0.02 USDC
  pong: parseUSDC(0.01), // $0.01 USDC
  'pong-phaser': parseUSDC(0.01), // $0.01 USDC
  breakout: parseUSDC(0.015), // $0.015 USDC
  'space-invaders': parseUSDC(0.025), // $0.025 USDC
};

// Valid game types
const VALID_GAME_TYPES = new Set<string>([
  'snake',
  'tetris',
  'pong',
  'pong-phaser',
  'breakout',
  'space-invaders',
]);

/**
 * POST /api/v1/play/:gameType
 *
 * Create a new game session with x402 payment.
 * Returns 402 Payment Required if no payment header is present.
 *
 * Path Parameters:
 * - gameType: 'snake' | 'tetris' | 'pong' | 'breakout' | 'space-invaders'
 *
 * Request Headers:
 * - X-Payment: base64-encoded x402 payment authorization
 *
 * Response:
 * - 402: Payment required (with X-Payment-Required header)
 * - 400: Invalid game type or request
 * - 200: Session created successfully with sessionId
 */
router.post('/:gameType', async (req: X402Request, res: Response) => {
  try {
    // Step 1: Extract and validate gameType from params
    const { gameType } = req.params;

    if (!gameType || !VALID_GAME_TYPES.has(gameType)) {
      res.status(400).json({
        error: 'Invalid game type',
        message: `Game type must be one of: ${Array.from(VALID_GAME_TYPES).join(', ')}`,
      });
      return;
    }

    // Get game price
    const gamePrice = GAME_PRICES[gameType];
    if (!gamePrice) {
      res.status(500).json({
        error: 'Configuration error',
        message: 'Game price not configured',
      });
      return;
    }

    // Step 2: Apply x402 payment middleware dynamically
    const x402Middleware = createX402Middleware({
      payTo: getArcadeWallet(),
      paymentAmount: gamePrice,
      tokenAddress:
        process.env.USDC_CONTRACT_ADDRESS || '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0',
      tokenName: 'Bridged USDC (Stargate)',
      tokenDecimals: 6,
      facilitatorUrl: process.env.FACILITATOR_URL || 'https://facilitator.cronoslabs.org',
      chainId: parseInt(process.env.CHAIN_ID || '338', 10),
    });

    // Execute middleware
    await new Promise<void>((resolve, reject) => {
      x402Middleware(req, res, (error?: unknown) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    // If we reach here, payment was successful
    // Step 3: Extract playerAddress from x402 context
    if (!req.x402 || !req.x402.paymentInfo || !req.x402.settlement) {
      res.status(500).json({
        error: 'Payment processing error',
        message: 'Payment verified but context missing',
      });
      return;
    }

    const playerAddress = req.x402.paymentInfo.payer;
    const paymentTxHash = req.x402.settlement.transactionHash || '';
    const amountPaidUsdc = parseFloat(req.x402.paymentInfo.amountUsdc);

    // Step 4: Validate game type support
    // Note: GameService only supports 'snake', 'tetris', and 'pong-phaser' currently
    // Other games will be added in future features
    if (gameType !== 'snake' && gameType !== 'tetris' && gameType !== 'pong-phaser') {
      res.status(501).json({
        error: 'Not implemented',
        message: `Game type '${gameType}' is not yet supported`,
      });
      return;
    }

    // Get services (lazy initialization)
    const { gameService, prizePoolService } = getServices();

    // Step 5: Check for existing active session
    // Prevent double-payment: player can only have one active session per game at a time
    const activeSession = await gameService.getActiveSession(playerAddress, gameType);
    if (activeSession) {
      res.status(409).json({
        error: 'Active session exists',
        message: `You already have an active ${gameType} game session. Please complete or wait for it to expire before starting a new game.`,
        session: {
          id: activeSession.id,
          gameType: activeSession.gameType,
          status: activeSession.status,
          createdAt: activeSession.createdAt,
        },
      });
      return;
    }

    // Step 6: Create game session
    const session = await gameService.createSession({
      gameType,
      playerAddress,
      paymentTxHash,
      amountPaidUsdc,
    });

    // Step 7: Update prize pool with payment contribution
    // This is done outside the session transaction to avoid blocking session creation
    // if prize pool update fails. The payment has already been verified at this point.
    try {
      // Prize pool takes 75% of payment by default
      await prizePoolService.addToPrizePool(
        gameType as 'snake' | 'tetris' | 'pong-phaser',
        amountPaidUsdc,
        75
      );

       
      console.log('[Prize Pool] Updated successfully', {
        sessionId: session.id,
        gameType,
        paymentAmount: amountPaidUsdc,
      });
    } catch (poolError) {
      // Log error but don't fail the session creation
      // The session is already created and player has paid
       
      console.error('[Prize Pool] Update failed', {
        sessionId: session.id,
        error: poolError instanceof Error ? poolError.message : 'Unknown error',
      });
    }

    // Step 8: Return session ID to client (201 Created)
    res.status(201).json({
      success: true,
      sessionId: session.id,
      session: {
        id: session.id,
        gameType: session.gameType,
        playerAddress: session.playerAddress,
        status: session.status,
        createdAt: session.createdAt,
      },
    });
  } catch (error) {
    // Handle errors that weren't caught by x402 middleware
    if (error instanceof Error) {
      // Check for duplicate payment (unique constraint violation)
      if (
        error.message.includes('UNIQUE constraint failed') ||
        error.message.includes('payment_tx_hash')
      ) {
        res.status(409).json({
          error: 'Payment already processed',
          message: 'This payment transaction has already been used to create a game session',
        });
        return;
      }

      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: 'Unknown error occurred',
      });
    }
  }
});

export default router;
