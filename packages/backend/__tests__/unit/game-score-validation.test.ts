/**
 * Unit tests for score validation in game service
 *
 * @module __tests__/unit/game-score-validation.test
 */

import { completeGame, startGame, clearSessions, GAME_PRICES } from '../../src/services/game';
import { ScoreValidationError } from '../../src/lib/score-validation';
import type { PaymentPayload } from '../../src/server/x402/types';

// Counter for unique nonces
let nonceCounter = 0;

// Helper to create a valid payment payload
function createPaymentPayload(playerAddress: string, gameType: 'snake' | 'tetris' | 'pong' = 'snake'): PaymentPayload {
  // Generate unique nonce (32 bytes = 64 hex chars + '0x' prefix)
  const timestamp = Date.now().toString(16).padStart(48, '0');
  const counter = (nonceCounter++).toString(16).padStart(16, '0');
  const uniqueNonce = `0x${timestamp}${counter}`;

  return {
    version: '1',
    scheme: 'exact',
    network: 'cronos-testnet',
    from: playerAddress,
    to: '0x0000000000000000000000000000000000000000',
    value: GAME_PRICES[gameType],
    validAfter: '0',
    validBefore: String(Math.floor(Date.now() / 1000) + 3600),
    nonce: uniqueNonce,
    v: 27,
    r: '0x' + '1'.repeat(64),
    s: '0x' + '2'.repeat(64),
  };
}

// Helper to start a game session for testing
async function startTestSession(playerAddress: string, gameType: 'snake' | 'tetris' | 'pong' = 'snake'): Promise<string> {
  const paymentPayload = createPaymentPayload(playerAddress, gameType);

  const startResult = await startGame({
    gameType,
    playerAddress,
    paymentPayload,
    skipSettlement: true,
  });

  if (!startResult.success || !startResult.session) {
    throw new Error(`Failed to start game: ${startResult.error}`);
  }

  return startResult.session.id;
}

describe('Game Service - Score Validation', () => {
  beforeEach(() => {
    clearSessions();
  });

  describe('completeGame with score validation', () => {
    it('should accept valid score', async () => {
      const sessionId = await startTestSession('0x1234567890123456789012345678901234567890');

      // Complete with valid score
      const result = completeGame(sessionId, 1000);

      expect(result.success).toBe(true);
      expect(result.session?.score).toBe(1000);
    });

    it('should reject negative score', async () => {
      const sessionId = await startTestSession('0x2234567890123456789012345678901234567890');

      // Attempt to complete with negative score
      expect(() => {
        completeGame(sessionId, -5);
      }).toThrow(ScoreValidationError);
    });

    it('should reject decimal score', async () => {
      const sessionId = await startTestSession('0x3234567890123456789012345678901234567890');

      // Attempt to complete with decimal score
      expect(() => {
        completeGame(sessionId, 1.5);
      }).toThrow(ScoreValidationError);
    });

    it('should reject NaN score', async () => {
      const sessionId = await startTestSession('0x4234567890123456789012345678901234567890');

      // Attempt to complete with NaN score
      expect(() => {
        completeGame(sessionId, NaN);
      }).toThrow(ScoreValidationError);
    });

    it('should enforce game-specific limits (pong max 21)', async () => {
      const sessionId = await startTestSession('0x5234567890123456789012345678901234567890', 'pong');

      // Valid pong score (11)
      const result1 = completeGame(sessionId, 11);
      expect(result1.success).toBe(true);
      expect(result1.session?.score).toBe(11);
    });

    it('should reject score exceeding game-specific limit', async () => {
      const sessionId = await startTestSession('0x6234567890123456789012345678901234567890', 'pong');

      // Invalid pong score (25 > 21 max)
      expect(() => {
        completeGame(sessionId, 25);
      }).toThrow(ScoreValidationError);
    });

    it('should reject score exceeding snake limit (100,000)', async () => {
      const sessionId = await startTestSession('0x7234567890123456789012345678901234567890');

      // Invalid snake score (exceeds 100,000)
      expect(() => {
        completeGame(sessionId, 100_001);
      }).toThrow(ScoreValidationError);
    });

    it('should accept score at game limit boundary', async () => {
      const sessionId = await startTestSession('0x8234567890123456789012345678901234567890');

      // Valid snake score at maximum (100,000)
      const result = completeGame(sessionId, 100_000);
      expect(result.success).toBe(true);
      expect(result.session?.score).toBe(100_000);
    });

    it('should accept zero score', async () => {
      const sessionId = await startTestSession('0x9234567890123456789012345678901234567890');

      // Valid zero score
      const result = completeGame(sessionId, 0);
      expect(result.success).toBe(true);
      expect(result.session?.score).toBe(0);
    });
  });
});
