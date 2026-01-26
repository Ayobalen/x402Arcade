/**
 * Transaction History Routes
 *
 * Provides endpoints for querying payment transaction history.
 * Combines data from game_sessions and payments tables to show
 * complete transaction history for a player.
 *
 * @module routes/transaction
 */

import { Router, type Request, type Response } from 'express';
import type { Database as DatabaseType } from 'better-sqlite3';
import { getDatabase } from '../db/index.js';

const router: Router = Router();

/**
 * Transaction History Entry Interface
 *
 * Represents a single transaction in the user's history.
 * Combines data from game_sessions and payments tables.
 */
interface TransactionHistoryEntry {
  id: string; // session_id or payment id
  type: 'game_payment' | 'prize_payout';
  gameType: string | null; // null for non-game payments
  gameName: string | null; // human-readable game name
  amount: number; // USDC amount
  timestamp: string; // ISO 8601 timestamp
  txHash: string; // blockchain transaction hash
  status: 'active' | 'completed' | 'expired' | 'pending' | 'confirmed' | 'failed';
  score: number | null; // final score (null if game not completed)
  explorerUrl: string; // link to block explorer
}

/**
 * Format game type to human-readable name
 */
function formatGameName(gameType: string): string {
  const gameNames: Record<string, string> = {
    snake: 'Snake',
    tetris: 'Tetris',
    pong: 'Pong',
    breakout: 'Breakout',
    'space-invaders': 'Space Invaders',
  };
  return gameNames[gameType] || gameType;
}

/**
 * Generate block explorer URL for transaction
 */
function getExplorerUrl(txHash: string): string {
  const CRONOS_TESTNET_EXPLORER = 'https://explorer.cronos.org/testnet';
  return `${CRONOS_TESTNET_EXPLORER}/tx/${txHash}`;
}

/**
 * GET /api/v1/transactions/:playerAddress
 *
 * Retrieves transaction history for a specific player address.
 * Returns both game payments and prize payouts in chronological order.
 *
 * Query Parameters:
 * - limit: Max number of transactions to return (default: 50, max: 100)
 * - offset: Number of transactions to skip (default: 0)
 * - gameType: Filter by specific game type (optional)
 *
 * Response:
 * {
 *   playerAddress: string,
 *   transactions: TransactionHistoryEntry[],
 *   count: number,
 *   limit: number,
 *   offset: number
 * }
 */
router.get('/:playerAddress', (req: Request, res: Response) => {
  try {
    const { playerAddress } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const gameType = req.query.gameType as string | undefined;

    // Validate player address format
    if (!playerAddress || !/^0x[a-fA-F0-9]{40}$/.test(playerAddress)) {
      res.status(400).json({
        error: 'Invalid player address format',
        message: 'Player address must be a valid Ethereum address (0x + 40 hex characters)',
      });
      return;
    }

    const db: DatabaseType = getDatabase();
    const normalizedAddress = playerAddress.toLowerCase();

    // Query 1: Get game payment sessions
    // These are payments FROM the player TO the arcade to play games
    const gameSessionsQuery = `
      SELECT
        gs.id,
        'game_payment' as type,
        gs.game_type as gameType,
        gs.amount_paid_usdc as amount,
        gs.created_at as timestamp,
        gs.payment_tx_hash as txHash,
        gs.status,
        gs.score
      FROM game_sessions gs
      WHERE gs.player_address = ?
      ${gameType ? 'AND gs.game_type = ?' : ''}
      ORDER BY gs.created_at DESC
    `;

    const gameSessionsParams = gameType ? [normalizedAddress, gameType] : [normalizedAddress];

    const gameSessions = db.prepare(gameSessionsQuery).all(...gameSessionsParams) as Array<{
      id: string;
      type: 'game_payment';
      gameType: string;
      amount: number;
      timestamp: string;
      txHash: string;
      status: 'active' | 'completed' | 'expired';
      score: number | null;
    }>;

    // Query 2: Get prize payouts
    // These are payments FROM the arcade TO the player (prize winnings)
    const prizePayoutsQuery = `
      SELECT
        p.id,
        'prize_payout' as type,
        NULL as gameType,
        p.amount_usdc as amount,
        p.created_at as timestamp,
        p.tx_hash as txHash,
        p.status,
        NULL as score
      FROM payments p
      WHERE p.to_address = ?
        AND p.purpose = 'prize_payout'
      ORDER BY p.created_at DESC
    `;

    const prizePayouts = db.prepare(prizePayoutsQuery).all(normalizedAddress) as Array<{
      id: number;
      type: 'prize_payout';
      gameType: null;
      amount: number;
      timestamp: string;
      txHash: string;
      status: 'pending' | 'confirmed' | 'failed';
      score: null;
    }>;

    // Combine and format results
    const allTransactions: TransactionHistoryEntry[] = [
      ...gameSessions.map((session) => ({
        id: session.id,
        type: session.type,
        gameType: session.gameType,
        gameName: formatGameName(session.gameType),
        amount: session.amount,
        timestamp: session.timestamp,
        txHash: session.txHash,
        status: session.status,
        score: session.score,
        explorerUrl: getExplorerUrl(session.txHash),
      })),
      ...prizePayouts.map((payout) => ({
        id: String(payout.id),
        type: payout.type,
        gameType: null,
        gameName: null,
        amount: payout.amount,
        timestamp: payout.timestamp,
        txHash: payout.txHash,
        status: payout.status,
        score: null,
        explorerUrl: getExplorerUrl(payout.txHash),
      })),
    ];

    // Sort by timestamp descending (most recent first)
    allTransactions.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Apply pagination
    const paginatedTransactions = allTransactions.slice(offset, offset + limit);

    res.json({
      playerAddress: normalizedAddress,
      transactions: paginatedTransactions,
      count: paginatedTransactions.length,
      total: allTransactions.length,
      limit,
      offset,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error retrieving transaction history:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve transaction history',
    });
  }
});

/**
 * GET /api/v1/transactions/:playerAddress/summary
 *
 * Get summary statistics for a player's transactions.
 *
 * Response:
 * {
 *   playerAddress: string,
 *   totalSpent: number,
 *   totalEarned: number,
 *   netBalance: number,
 *   gamesPlayed: number,
 *   prizesWon: number
 * }
 */
router.get('/:playerAddress/summary', (req: Request, res: Response) => {
  try {
    const { playerAddress } = req.params;

    // Validate player address format
    if (!playerAddress || !/^0x[a-fA-F0-9]{40}$/.test(playerAddress)) {
      res.status(400).json({
        error: 'Invalid player address format',
        message: 'Player address must be a valid Ethereum address (0x + 40 hex characters)',
      });
      return;
    }

    const db: DatabaseType = getDatabase();
    const normalizedAddress = playerAddress.toLowerCase();

    // Calculate total spent (game payments)
    const spentQuery = `
      SELECT
        COALESCE(SUM(amount_paid_usdc), 0) as totalSpent,
        COUNT(*) as gamesPlayed
      FROM game_sessions
      WHERE player_address = ?
    `;

    const spentResult = db.prepare(spentQuery).get(normalizedAddress) as {
      totalSpent: number;
      gamesPlayed: number;
    };

    // Calculate total earned (prize payouts)
    const earnedQuery = `
      SELECT
        COALESCE(SUM(amount_usdc), 0) as totalEarned,
        COUNT(*) as prizesWon
      FROM payments
      WHERE to_address = ?
        AND purpose = 'prize_payout'
        AND status = 'confirmed'
    `;

    const earnedResult = db.prepare(earnedQuery).get(normalizedAddress) as {
      totalEarned: number;
      prizesWon: number;
    };

    const summary = {
      playerAddress: normalizedAddress,
      totalSpent: spentResult.totalSpent,
      totalEarned: earnedResult.totalEarned,
      netBalance: earnedResult.totalEarned - spentResult.totalSpent,
      gamesPlayed: spentResult.gamesPlayed,
      prizesWon: earnedResult.prizesWon,
    };

    res.json(summary);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error retrieving transaction summary:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve transaction summary',
    });
  }
});

export default router;
