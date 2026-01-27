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
import { PongGamePage } from './PongGamePage';
import { TetrisGameWrapper } from '@/games/tetris/TetrisGameWrapper';
import { BreakoutGameWrapper } from '@/games/breakout/BreakoutGameWrapper';
import { SpaceInvadersGameWrapper } from '@/games/space-invaders/SpaceInvadersGameWrapper';
import { useX402 } from '@/hooks/useX402';
import { useWallet } from '@/hooks/useWallet';
import { createPaymentHeader } from '@/config/x402Client';
import { LeaderboardWidget } from '@/components/LeaderboardWidget';
import { SessionTimer } from '@/components/SessionTimer';
import { LiveLeaderboardWidget } from '@/components/game/LiveLeaderboardWidget';

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
    status: 'coming-soon',
  },
  tetris: {
    id: 'tetris',
    name: 'Tetris',
    emoji: '🟦',
    description: 'Stack falling blocks to clear lines. Speed increases as you progress.',
    status: 'coming-soon',
  },
  breakout: {
    id: 'breakout',
    name: 'Breakout',
    emoji: '🧱',
    description: 'Break all the bricks with your paddle and ball. Classic arcade action.',
    status: 'coming-soon',
  },
  'space-invaders': {
    id: 'space-invaders',
    name: 'Space Invaders',
    emoji: '👾',
    description: 'Defend Earth from alien invaders. Shoot them down before they reach you.',
    status: 'coming-soon',
  },
  'pong-phaser': {
    id: 'pong-phaser',
    name: 'Pong (Phaser)',
    emoji: '🎮',
    description: 'Phaser 3 version of classic Pong. Demonstrates library-based implementation.',
    status: 'coming-soon',
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
  const [sessionCreatedAt, setSessionCreatedAt] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showExpirationModal, setShowExpirationModal] = useState(false);

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

  // Restore session from localStorage on mount (Issue #2: Session Restoration)
  useEffect(() => {
    if (!gameId || sessionId) return;

    const storedSessionId = localStorage.getItem(`game_session_${gameId}`);
    const storedTimestamp = localStorage.getItem(`game_session_${gameId}_timestamp`);

    if (storedSessionId && storedTimestamp) {
      const sessionAge = Date.now() - parseInt(storedTimestamp);
      const FIFTEEN_MINUTES = 15 * 60 * 1000;

      // If session is less than 15 minutes old, restore it
      if (sessionAge < FIFTEEN_MINUTES) {
        setSessionId(storedSessionId);
        // Restore session creation time as ISO string
        setSessionCreatedAt(new Date(parseInt(storedTimestamp)).toISOString());
      } else {
        // Session expired, clean up
        localStorage.removeItem(`game_session_${gameId}`);
        localStorage.removeItem(`game_session_${gameId}_timestamp`);
      }
    }
  }, [gameId, sessionId]);

  // Handle exit from game wrapper
  const handleExit = () => {
    navigate('/play');
  };

  // Handle session expiration
  const handleSessionExpired = () => {
    setShowExpirationModal(true);
  };

  // Handle pay again after expiration
  const handlePayAgain = () => {
    // Clear expired session
    if (gameId) {
      localStorage.removeItem(`game_session_${gameId}`);
      localStorage.removeItem(`game_session_${gameId}_timestamp`);
    }
    setSessionId(null);
    setSessionCreatedAt(null);
    setShowExpirationModal(false);
    // This will show the payment gate again
  };

  // Handle retry to fetch existing session
  const handleRetrySession = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Simply retry the payment flow - it will detect the existing session
      // and automatically load it via the 409 handling we added
      await handlePayment();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load session');
    } finally {
      setIsProcessing(false);
    }
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

      // Handle 409: Active session exists before payment
      if (initialResponse.status === 409) {
        const errorData = await initialResponse.json();
        console.log('[Game.tsx] 409 on initial request:', errorData);

        if (errorData.session?.id) {
          console.log('[Game.tsx] Resuming session from initial request:', errorData.session.id);

          // Store the existing session
          if (gameId) {
            localStorage.setItem(`game_session_${gameId}`, errorData.session.id);
            localStorage.setItem(`game_session_${gameId}_timestamp`, new Date(errorData.session.createdAt).getTime().toString());
          }

          // Set session state to load the game
          setSessionId(errorData.session.id);
          setSessionCreatedAt(errorData.session.createdAt);
          setIsProcessing(false);
          return; // Exit early - don't attempt payment
        } else {
          console.warn('[Game.tsx] 409 on initial request missing session data');
          // Fall through to normal 402 handling - unlikely case
        }
      }

      if (initialResponse.status !== 402) {
        throw new Error(
          `Expected 402 Payment Required response, got ${initialResponse.status} ${initialResponse.statusText}`
        );
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

        // Handle 409: Active session exists - automatically resume it
        if (paymentResponse.status === 409) {
          console.log('[Game.tsx] Active session detected (409):', errorData);

          if (errorData.session?.id) {
            console.log('[Game.tsx] Resuming session:', errorData.session.id);

            // Store the existing session
            if (gameId) {
              localStorage.setItem(`game_session_${gameId}`, errorData.session.id);
              localStorage.setItem(`game_session_${gameId}_timestamp`, new Date(errorData.session.createdAt).getTime().toString());
            }

            // Set session state to load the game
            setSessionId(errorData.session.id);
            setSessionCreatedAt(errorData.session.createdAt);
            setIsProcessing(false);
            return; // Exit early - don't throw error
          } else {
            console.warn('[Game.tsx] 409 response missing session data:', errorData);
            // Fall through to show error message with "Continue" button
          }
        }

        // Handle specific error codes with user-friendly messages
        if (errorData.error?.code === 'INSUFFICIENT_BALANCE') {
          throw new Error(
            '💰 Insufficient USDC balance. Please add testnet USDC to your wallet to play.'
          );
        }

        if (errorData.error?.code === 'INVALID_SIGNATURE') {
          throw new Error(
            '🔐 Payment signature verification failed. Please try again.'
          );
        }

        if (errorData.error?.code === 'NONCE_ALREADY_USED') {
          throw new Error(
            '⚠️ This payment authorization has already been used. Please refresh and try again.'
          );
        }

        // Default error message
        throw new Error(errorData.error?.message || errorData.message || 'Payment failed');
      }

      const result = await paymentResponse.json();

      // Store session ID in localStorage for restoration on page reload
      const now = Date.now();
      if (result.sessionId && gameId) {
        localStorage.setItem(`game_session_${gameId}`, result.sessionId);
        localStorage.setItem(`game_session_${gameId}_timestamp`, now.toString());
      }

      setSessionId(result.sessionId);
      setSessionCreatedAt(new Date(now).toISOString());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // If game not found, show error message
  if (!gameInfo || !gameId) {
    return (
      <div className="w-full min-h-full flex items-center justify-center py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <h1
              className={cn(
                'text-6xl md:text-7xl font-bold mb-4',
                'bg-gradient-to-r from-theme-secondary via-theme-primary to-theme-secondary',
                'bg-clip-text text-transparent'
              )}
            >
              Game Not Found
            </h1>
            <p className="text-xl text-theme-text-secondary mb-6">
              The game "{gameId}" doesn't exist in our arcade.
            </p>
          </div>

          <Link
            to="/play"
            className={cn(
              'inline-flex items-center gap-2',
              'px-8 py-4',
              'rounded-lg',
              'bg-gradient-to-r from-theme-primary to-theme-secondary',
              'text-theme-text-inverse font-bold text-lg',
              'hover:scale-105',
              'shadow-theme-glow',
              'hover:shadow-theme-glow-lg',
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

  // If game is coming soon, show coming soon page
  if (gameInfo.status === 'coming-soon') {
    return (
      <div className="w-full min-h-full flex items-center justify-center py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            {/* Game emoji */}
            <div className="text-9xl mb-6">{gameInfo.emoji}</div>

            <h1
              className={cn(
                'text-6xl md:text-7xl font-bold mb-4',
                'bg-gradient-to-r from-theme-primary via-theme-secondary to-theme-primary',
                'bg-clip-text text-transparent'
              )}
            >
              {gameInfo.name}
            </h1>

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-theme-primary/10 border border-theme-primary/30 rounded-full mb-6">
              <span className="text-theme-primary font-bold">Coming Soon</span>
            </div>

            <p className="text-xl text-theme-text-secondary mb-6">
              {gameInfo.description}
            </p>

            <p className="text-lg text-theme-text-muted">
              This game is currently under development. Check back soon!
            </p>
          </div>

          <Link
            to="/play"
            className={cn(
              'inline-flex items-center gap-2',
              'px-8 py-4',
              'rounded-lg',
              'bg-gradient-to-r from-theme-primary to-theme-secondary',
              'text-theme-text-inverse font-bold text-lg',
              'hover:scale-105',
              'shadow-theme-glow',
              'hover:shadow-theme-glow-lg',
              'transition-all duration-200'
            )}
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Browse Other Games
          </Link>
        </div>
      </div>
    );
  }

  // Render available game - Snake
  if (gameInfo.status === 'available' && gameId === 'snake') {
    // Callback to fetch rankings after game over
    const handleFetchRankings = async (score: number) => {
      console.log('[Game.tsx] handleFetchRankings called with score:', score);
      console.log('[Game.tsx] API_URL:', API_URL);
      try {
        // Add timestamp to bust cache and ensure fresh data
        const url = `${API_URL}/api/v1/leaderboard/snake/daily?limit=10&t=${Date.now()}`;
        console.log('[Game.tsx] Fetching from:', url);
        const response = await fetch(url, {
          cache: 'no-store', // Disable browser caching
        });
        console.log('[Game.tsx] Response status:', response.status, response.statusText);
        if (response.ok) {
          const data = await response.json();
          console.log('[Game.tsx] Leaderboard data:', data);
          // Transform leaderboard entries to RankingEntry format
          const transformed = data.entries.map((entry: any) => ({
            rank: entry.rank,
            playerAddress: entry.playerAddress,
            score: entry.score,
            isCurrentPlayer: address && entry.playerAddress.toLowerCase() === address.toLowerCase(),
          }));
          console.log('[Game.tsx] Transformed rankings:', transformed);
          return transformed;
        } else {
          console.error('[Game.tsx] Response not OK:', response.status, await response.text());
        }
      } catch (error) {
        console.error('[Game.tsx] Failed to fetch rankings:', error);
      }
      return [];
    };

    // If payment successful and session created, render the game
    if (sessionId && sessionCreatedAt) {
      return (
        <>
          {/* Session Timer - Fixed in top-right corner, high z-index (above header z-50) */}
          <div className="fixed top-20 right-4 z-[100]">
            <SessionTimer sessionCreatedAt={sessionCreatedAt} onExpired={handleSessionExpired} />
          </div>

          <div className="relative w-full min-h-full flex items-center justify-center py-8">
            {/* Main Game Area - Centered with proper hierarchy */}
            <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 w-full max-w-[1400px]">
            {/* Game Canvas - PRIMARY FOCUS (Dominant) */}
            <div className="relative flex-shrink-0">
              {/* Enhanced container with arcade glow/elevation */}
              <div
                className={cn(
                  'relative',
                  'p-3',
                  'bg-theme-bg-elevated',
                  'rounded-2xl',
                  'border-4 border-theme-primary/30',
                  'shadow-theme-glow-lg',
                  'transition-all duration-300',
                  'hover:border-theme-primary/50',
                  'hover:shadow-theme-glow-intense'
                )}
              >
                <SnakeGame
                  sessionId={sessionId}
                  playerAddress={address}
                  enableScoreSubmission={true}
                  onFetchRankings={handleFetchRankings}
                />
              </div>
            </div>

            {/* Live Leaderboard - SECONDARY (Subordinate) */}
            <div className="w-full lg:w-auto lg:max-w-[340px] flex-shrink-0">
              <div className="opacity-95">
                <LiveLeaderboardWidget
                  gameType="snake"
                  periodType="daily"
                  playerAddress={address}
                  pollInterval={15000}
                  limit={10}
                />
              </div>
            </div>
          </div>

          {/* Session Expiration Modal */}
          {showExpirationModal && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
              onClick={() => setShowExpirationModal(false)}
            >
              <div
                className={cn(
                  'bg-theme-bg-elevated',
                  'border-2 border-red-500/50',
                  'rounded-xl',
                  'p-8',
                  'max-w-md',
                  'shadow-[0_0_30px_rgba(239,68,68,0.4)]'
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <div className="text-6xl mb-4">⏱️</div>
                  <h2 className="text-2xl font-bold text-theme-text-primary mb-4">Session Expired</h2>
                  <p className="text-theme-text-secondary mb-6">
                    Your 15-minute game session has expired. Pay ${GAME_PRICES[gameId]} USDC to play
                    again and submit your score.
                  </p>

                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={handlePayAgain}
                      className={cn(
                        'px-6 py-3',
                        'rounded-lg',
                        'bg-gradient-to-r from-theme-primary to-theme-secondary',
                        'text-black font-bold',
                        'hover:scale-105',
                        'transition-all duration-200',
                        'shadow-theme-glow'
                      )}
                    >
                      Pay & Play Again
                    </button>

                    <button
                      onClick={() => navigate('/play')}
                      className={cn(
                        'px-6 py-3',
                        'rounded-lg',
                        'bg-theme-bg-main',
                        'border border-theme-border',
                        'text-theme-text-primary font-semibold',
                        'hover:border-theme-primary',
                        'hover:text-theme-primary',
                        'transition-all duration-200'
                      )}
                    >
                      Exit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        </>
      );
    }

    // Show payment gate
    return (
      <div className="w-full min-h-full flex items-center justify-center py-12">
        <div className="max-w-lg mx-auto">
          {/* Game Header - Centered and prominent */}
          <div className="text-center mb-12">
            <div className="text-9xl mb-6">{gameInfo.emoji}</div>
            <h1
              className={cn(
                'text-6xl md:text-7xl font-bold mb-6',
                'bg-gradient-to-r from-theme-primary via-theme-secondary to-theme-primary',
                'bg-clip-text text-transparent',
                'leading-tight'
              )}
            >
              {gameInfo.name}
            </h1>
            <p className="text-lg text-theme-text-secondary max-w-md mx-auto leading-relaxed">
              {gameInfo.description}
            </p>
          </div>

          {/* Prize Pool - Subtle motivational element */}
          {dailyPool !== null && dailyPool > 0 && (
            <div className="mb-8 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-theme-primary/10 border border-theme-primary/30">
                <span className="text-sm text-theme-text-muted">Prize Pool:</span>
                <span className="text-lg font-bold text-theme-primary">
                  ${dailyPool.toFixed(2)} USDC
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-red-400 mb-3">{errorMessage}</p>
              {errorMessage.includes('already have an active') && (
                <div className="mt-4">
                  <p className="text-sm text-white/60 mb-2">
                    Click below to resume your active session:
                  </p>
                  <button
                    onClick={handleRetrySession}
                    disabled={isProcessing || !walletReady}
                    className={cn(
                      'px-6 py-3',
                      'rounded-lg',
                      'bg-gradient-to-r from-theme-primary to-theme-secondary',
                      'text-black font-bold text-base',
                      'hover:scale-105',
                      'transition-all duration-200',
                      'shadow-theme-glow',
                      'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
                    )}
                  >
                    {isProcessing ? '⏳ Loading...' : '🎮 Continue to Game'}
                  </button>
                </div>
              )}
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

          {/* Primary CTA - Large and prominent */}
          <div className="space-y-4">
            <button
              onClick={handlePayment}
              disabled={!walletReady || isProcessing}
              className={cn(
                'w-full',
                'px-8 py-6',
                'rounded-xl',
                'bg-gradient-to-r from-theme-primary to-theme-secondary',
                'text-theme-text-inverse font-bold text-xl',
                'hover:scale-[1.02]',
                'shadow-theme-glow-lg',
                'hover:shadow-theme-glow-intense',
                'transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
              )}
            >
              {isProcessing ? (
                'Processing...'
              ) : paymentStatus === 'signing' ? (
                'Sign in wallet...'
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl">Pay & Play</span>
                  <span className="text-base font-normal opacity-90">${GAME_PRICES[gameId]} USDC · 15 min session</span>
                </div>
              )}
            </button>

            {/* Back button - subtle */}
            <Link
              to="/play"
              className={cn(
                'w-full inline-flex items-center justify-center gap-2',
                'px-6 py-3',
                'rounded-lg',
                'text-theme-text-muted font-medium',
                'hover:text-theme-primary',
                'transition-colors duration-200'
              )}
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Back to games</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render available game - Pong (now using Phaser version)
  if (gameInfo.status === 'available' && (gameId === 'pong' || gameId === 'pong-phaser')) {
    return <PongGamePage />;
  }

  // Render available game - Tetris
  if (gameInfo.status === 'available' && gameId === 'tetris') {
    return (
      <div className="w-full min-h-full flex items-center justify-center py-12">
        <div className="max-w-4xl mx-auto w-full">
          <TetrisGameWrapper onExit={handleExit} />
        </div>
      </div>
    );
  }

  // Render available game - Breakout
  if (gameInfo.status === 'available' && gameId === 'breakout') {
    return (
      <div className="w-full min-h-full flex items-center justify-center py-12">
        <div className="max-w-4xl mx-auto w-full">
          <BreakoutGameWrapper onExit={handleExit} />
        </div>
      </div>
    );
  }

  // Render available game - Space Invaders
  if (gameInfo.status === 'available' && gameId === 'space-invaders') {
    return (
      <div className="w-full min-h-full flex items-center justify-center py-12">
        <div className="max-w-4xl mx-auto w-full">
          <SpaceInvadersGameWrapper onExit={handleExit} />
        </div>
      </div>
    );
  }

  // Game exists but is coming soon
  return (
    <div className="w-full min-h-full flex items-center justify-center py-12">
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
