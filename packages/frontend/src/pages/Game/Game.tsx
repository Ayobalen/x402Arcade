/**
 * Game Page Component
 *
 * Individual game page for playing arcade games.
 * Uses URL parameter :gameId to determine which game to render.
 *
 * Games: snake, pong, tetris, breakout, space-invaders
 */

import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { SnakeGame } from '@/games/snake/SnakeGame';
import { PongGameWrapper } from '@/games/pong/PongGameWrapper';
import { TetrisGameWrapper } from '@/games/tetris/TetrisGameWrapper';
import { BreakoutGameWrapper } from '@/games/breakout/BreakoutGameWrapper';
import { SpaceInvadersGameWrapper } from '@/games/space-invaders/SpaceInvadersGameWrapper';
import { useX402 } from '@/hooks/useX402';
import { useWallet } from '@/hooks/useWallet';
import { createPaymentHeader } from '@/config/x402Client';

/**
 * Game metadata
 */
interface GameInfo {
  id: string;
  name: string;
  emoji: string;
  description: string;
  status: 'available' | 'coming-soon';
}

/**
 * Available games configuration
 */
const GAMES: Record<string, GameInfo> = {
  snake: {
    id: 'snake',
    name: 'Snake',
    emoji: '🐍',
    description: 'Classic snake game. Eat food, grow longer, avoid walls and yourself.',
    status: 'available',
  },
  pong: {
    id: 'pong',
    name: 'Pong',
    emoji: '🏓',
    description: 'Classic arcade pong. Keep the ball in play and beat the AI.',
    status: 'available',
  },
  tetris: {
    id: 'tetris',
    name: 'Tetris',
    emoji: '🟦',
    description: 'Stack falling blocks to clear lines. Speed increases as you progress.',
    status: 'available',
  },
  breakout: {
    id: 'breakout',
    name: 'Breakout',
    emoji: '🧱',
    description: 'Break all the bricks with your paddle and ball. Classic arcade action.',
    status: 'available',
  },
  'space-invaders': {
    id: 'space-invaders',
    name: 'Space Invaders',
    emoji: '👾',
    description: 'Defend Earth from alien invaders. Shoot them down before they reach you.',
    status: 'available',
  },
};

/**
 * Home icon for back button
 */
function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

/**
 * Game prices for x402 payment
 */
const GAME_PRICES: Record<string, string> = {
  snake: '0.01',
  tetris: '0.02',
  pong: '0.01',
  breakout: '0.015',
  'space-invaders': '0.025',
};

/**
 * Backend API URL
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Game Page Component
 */
export function Game() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { isReady: walletReady, address } = useWallet();
  const { createAuthorization, status: paymentStatus, error: paymentError } = useX402();

  // Payment state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Prize pool state (only daily pools receive prize money)
  const [dailyPool, setDailyPool] = useState<number | null>(null);

  // Get game info, or undefined if not found
  const gameInfo = gameId ? GAMES[gameId] : undefined;

  // Fetch current daily prize pool on mount
  useEffect(() => {
    if (!gameId) return;

    const fetchDailyPool = async () => {
      try {
        const dailyRes = await fetch(`${API_URL}/api/v1/prize/${gameId}/daily`);

        if (dailyRes.ok) {
          const dailyData = await dailyRes.json();
          setDailyPool(dailyData.pool.totalAmountUsdc);
        }
      } catch {
        // Silently fail - prize pool is not critical for page load
      }
    };

    fetchDailyPool();
  }, [gameId]);

  // Handle exit from game wrapper
  const handleExit = () => {
    navigate('/play');
  };

  /**
   * Handle x402 payment flow
   * 1. Call backend endpoint (returns 402)
   * 2. Get EIP-3009 signature from wallet
   * 3. Retry with signed payment
   * 4. Store session ID on success
   */
  const handlePayment = async () => {
    if (!walletReady || !address || !gameId) {
      setErrorMessage('Please connect your wallet to play');
      return;
    }

    const gamePrice = GAME_PRICES[gameId];
    if (!gamePrice) {
      setErrorMessage('Game price not configured');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);

      // Step 1: Get arcade wallet address from initial request
      const initialResponse = await fetch(`${API_URL}/api/v1/play/${gameId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (initialResponse.status !== 402) {
        throw new Error('Expected 402 Payment Required response');
      }

      // Parse x402 payment requirements
      const paymentRequired = initialResponse.headers.get('X-Payment-Required');
      if (!paymentRequired) {
        throw new Error('Missing X-Payment-Required header');
      }

      const paymentInfo = JSON.parse(atob(paymentRequired));
      const arcadeWallet = paymentInfo.payTo as `0x${string}`;

      // Step 2: Create EIP-3009 authorization
      const authorization = await createAuthorization({
        to: arcadeWallet,
        amount: gamePrice,
        validitySeconds: 3600,
      });

      // Step 3: Encode authorization for X-Payment header
      const paymentHeader = createPaymentHeader({
        network: 'cronos-testnet',
        message: {
          from: authorization.message.from,
          to: authorization.message.to,
          value: authorization.message.value.toString(),
          validAfter: authorization.message.validAfter.toString(),
          validBefore: authorization.message.validBefore.toString(),
          nonce: authorization.message.nonce,
        },
        v: authorization.v,
        r: authorization.r,
        s: authorization.s,
        asset: paymentInfo.tokenAddress,
      });

      // Step 4: Retry request with signed payment
      const paymentResponse = await fetch(`${API_URL}/api/v1/play/${gameId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Payment': paymentHeader,
        },
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.message || 'Payment failed');
      }

      const result = await paymentResponse.json();

      // Store session ID in localStorage for restoration on page reload
      if (result.sessionId && gameId) {
        localStorage.setItem(`game_session_${gameId}`, result.sessionId);
        localStorage.setItem(`game_session_${gameId}_timestamp`, Date.now().toString());
      }

      setSessionId(result.sessionId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // If game not found, show error message
  if (!gameInfo || !gameId) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <h1
              className={cn(
                'text-6xl md:text-7xl font-bold mb-4',
                'bg-gradient-to-r from-[#ff00ff] via-[#00ffff] to-[#ff00ff]',
                'bg-clip-text text-transparent'
              )}
            >
              Game Not Found
            </h1>
            <p className="text-xl text-white/70 mb-6">
              The game "{gameId}" doesn't exist in our arcade.
            </p>
          </div>

          <Link
            to="/play"
            className={cn(
              'inline-flex items-center gap-2',
              'px-8 py-4',
              'rounded-lg',
              'bg-gradient-to-r from-[#00ffff] to-[#ff00ff]',
              'text-black font-bold text-lg',
              'hover:scale-105',
              'hover:shadow-[0_0_30px_rgba(0,255,255,0.6)]',
              'transition-all duration-200'
            )}
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Games
          </Link>
        </div>
      </div>
    );
  }

  // Render available game - Snake
  if (gameInfo.status === 'available' && gameId === 'snake') {
    // If payment successful and session created, render the game
    if (sessionId) {
      return (
        <div className="w-full min-h-screen flex items-center justify-center px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <SnakeGame />
          </div>
        </div>
      );
    }

    // Show payment gate
    return (
      <div className="w-full min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          {/* Game Header */}
          <div className="mb-8">
            <div className="text-8xl mb-6">{gameInfo.emoji}</div>
            <h1
              className={cn(
                'text-5xl md:text-6xl font-bold mb-4',
                'bg-gradient-to-r from-[#00ffff] via-[#ff00ff] to-[#00ffff]',
                'bg-clip-text text-transparent'
              )}
            >
              {gameInfo.name}
            </h1>
            <p className="text-xl text-white/70 mb-6">{gameInfo.description}</p>
          </div>

          {/* Payment Info */}
          <div className="mb-8">
            <div
              className={cn(
                'inline-block',
                'px-6 py-3',
                'rounded-lg',
                'bg-[#1a1a2e]',
                'border border-[#2d2d4a]',
                'mb-6'
              )}
            >
              <p className="text-2xl font-bold text-white">${GAME_PRICES[gameId]} USDC</p>
              <p className="text-sm text-white/60 mt-1">Gasless payment via x402</p>
            </div>

            {/* Prize Pool Display - Daily Only */}
            <div className="max-w-sm mx-auto">
              <div
                className={cn(
                  'px-6 py-4',
                  'rounded-lg',
                  'bg-[#1a1a2e]',
                  'border-2 border-[#00ffff]/50',
                  'shadow-[0_0_20px_rgba(0,255,255,0.3)]'
                )}
              >
                <p className="text-sm text-white/70 mb-2 text-center">Today's Prize Pool</p>
                <p className="text-3xl font-bold text-[#00ffff] text-center">
                  {dailyPool !== null ? `$${dailyPool.toFixed(2)} USDC` : '$0.00 USDC'}
                </p>
                <p className="text-xs text-white/50 mt-2 text-center">
                  Winner takes all at midnight
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-red-400">{errorMessage}</p>
            </div>
          )}

          {/* Payment Error */}
          {paymentError && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-red-400">{paymentError.message}</p>
            </div>
          )}

          {/* Wallet Connection Check */}
          {!walletReady && (
            <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <p className="text-yellow-400">Please connect your wallet to play</p>
            </div>
          )}

          {/* Pay & Play Button */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={handlePayment}
              disabled={!walletReady || isProcessing}
              className={cn(
                'px-8 py-4',
                'rounded-lg',
                'bg-gradient-to-r from-[#00ffff] to-[#ff00ff]',
                'text-black font-bold text-lg',
                'hover:scale-105',
                'hover:shadow-[0_0_30px_rgba(0,255,255,0.6)]',
                'transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
              )}
            >
              {isProcessing
                ? 'Processing...'
                : paymentStatus === 'signing'
                  ? 'Sign in wallet...'
                  : `Pay & Play - $${GAME_PRICES[gameId]}`}
            </button>

            <Link
              to="/play"
              className={cn(
                'inline-flex items-center gap-2',
                'px-8 py-4',
                'rounded-lg',
                'bg-[#1a1a2e]',
                'border border-[#2d2d4a]',
                'text-white font-semibold text-lg',
                'hover:border-[#00ffff]',
                'hover:text-[#00ffff]',
                'transition-all duration-200'
              )}
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render available game - Pong
  if (gameInfo.status === 'available' && gameId === 'pong') {
    return (
      <div className="w-full min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-4xl mx-auto w-full">
          <PongGameWrapper onExit={handleExit} />
        </div>
      </div>
    );
  }

  // Render available game - Tetris
  if (gameInfo.status === 'available' && gameId === 'tetris') {
    return (
      <div className="w-full min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-4xl mx-auto w-full">
          <TetrisGameWrapper onExit={handleExit} />
        </div>
      </div>
    );
  }

  // Render available game - Breakout
  if (gameInfo.status === 'available' && gameId === 'breakout') {
    return (
      <div className="w-full min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-4xl mx-auto w-full">
          <BreakoutGameWrapper onExit={handleExit} />
        </div>
      </div>
    );
  }

  // Render available game - Space Invaders
  if (gameInfo.status === 'available' && gameId === 'space-invaders') {
    return (
      <div className="w-full min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-4xl mx-auto w-full">
          <SpaceInvadersGameWrapper onExit={handleExit} />
        </div>
      </div>
    );
  }

  // Game exists but is coming soon
  return (
    <div className="w-full min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-4xl mx-auto text-center">
        {/* Game Header */}
        <div className="mb-8">
          <div className="text-8xl mb-6">{gameInfo.emoji}</div>
          <h1
            className={cn(
              'text-5xl md:text-6xl font-bold mb-4',
              'bg-gradient-to-r from-[#00ffff] via-[#ff00ff] to-[#00ffff]',
              'bg-clip-text text-transparent'
            )}
          >
            {gameInfo.name}
          </h1>
          <p className="text-xl text-white/70 mb-6">{gameInfo.description}</p>
        </div>

        {/* Coming Soon Message */}
        <div className="mb-12">
          <div
            className={cn(
              'inline-block',
              'px-6 py-3',
              'rounded-lg',
              'bg-[#1a1a2e]',
              'border border-[#2d2d4a]',
              'mb-6'
            )}
          >
            <p className="text-lg text-white/80 font-semibold uppercase tracking-wider">
              Coming Soon
            </p>
          </div>
          <p className="text-lg text-white/60">This game is under development. Check back soon!</p>
        </div>

        {/* Back Button */}
        <Link
          to="/play"
          className={cn(
            'inline-flex items-center gap-2',
            'px-8 py-4',
            'rounded-lg',
            'bg-[#1a1a2e]',
            'border border-[#2d2d4a]',
            'text-white font-semibold text-lg',
            'hover:border-[#00ffff]',
            'hover:text-[#00ffff]',
            'transition-all duration-200'
          )}
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Games
        </Link>
      </div>
    </div>
  );
}

Game.displayName = 'Game';

export default Game;
