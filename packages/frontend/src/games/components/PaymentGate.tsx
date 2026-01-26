/**
 * Payment Gate Component
 *
 * Extracted from Game.tsx - shows payment interface before game starts.
 * Displays game info, pricing, prize pool, and payment button.
 * Uses theme-aware CSS variables for consistent theming.
 *
 * @module games/components/PaymentGate
 */

import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { GameMetadata } from '../types/GameMetadata';
import type { PaymentStatus } from '../types/GameTypes';

// ============================================================================
// Icons
// ============================================================================

/**
 * Back arrow icon for navigation
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

// ============================================================================
// Component Props
// ============================================================================

export interface PaymentGateProps {
  /** Game metadata */
  metadata: GameMetadata;
  /** Daily prize pool amount (null if not loaded) */
  dailyPrizePool: number | null;
  /** Payment button handler */
  onPayment: () => void;
  /** Whether payment is being processed */
  isProcessing: boolean;
  /** Payment status from x402 */
  paymentStatus: PaymentStatus;
  /** Whether wallet is connected and ready */
  walletReady: boolean;
  /** Error message to display */
  errorMessage: string | null;
  /** Optional back link URL (defaults to /play) */
  backLink?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Payment gate UI extracted from Game.tsx.
 * Shows before user has paid to play the game.
 *
 * @param props - Component props
 *
 * @example
 * ```tsx
 * <PaymentGate
 *   metadata={snakeMetadata}
 *   dailyPrizePool={session.prizePool.daily}
 *   onPayment={session.handlePayment}
 *   isProcessing={session.isProcessing}
 *   paymentStatus={session.paymentStatus}
 *   walletReady={session.walletReady}
 *   errorMessage={session.errorMessage}
 * />
 * ```
 */
export function PaymentGate({
  metadata,
  dailyPrizePool,
  onPayment,
  isProcessing,
  paymentStatus,
  walletReady,
  errorMessage,
  backLink = '/play',
}: PaymentGateProps) {
  const gamePrice = metadata.pricing.baseCost.toFixed(2);

  return (
    <div className="w-full min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl mx-auto text-center">
        {/* Game Header */}
        <div className="mb-8">
          <div className="text-8xl mb-6">{metadata.icon}</div>
          <h1
            className={cn(
              'text-5xl md:text-6xl font-bold mb-4',
              'bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-primary)]',
              'bg-clip-text text-transparent'
            )}
          >
            {metadata.displayName}
          </h1>
          <p className="text-xl text-white/70 mb-6">{metadata.description}</p>
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
            <p className="text-2xl font-bold text-white">${gamePrice} USDC</p>
            <p className="text-sm text-white/60 mt-1">Gasless payment via x402</p>
          </div>

          {/* Prize Pool Display - Daily Only */}
          <div className="max-w-sm mx-auto">
            <div
              className={cn(
                'px-6 py-4',
                'rounded-lg',
                'bg-[#1a1a2e]',
                'border-2 border-[var(--color-primary)]/50',
                'shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.3)]'
              )}
              style={{
                boxShadow: `0 0 20px rgba(${getComputedStyle(document.documentElement)
                  .getPropertyValue('--color-primary-rgb')
                  .trim()}, 0.3)`,
              }}
            >
              <p className="text-sm text-white/70 mb-2 text-center">Today's Prize Pool</p>
              <p
                className="text-3xl font-bold text-center"
                style={{ color: 'var(--color-primary)' }}
              >
                {dailyPrizePool !== null ? `$${dailyPrizePool.toFixed(2)} USDC` : '$0.00 USDC'}
              </p>
              <p className="text-xs text-white/50 mt-2 text-center">Winner takes all at midnight</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-red-400">{errorMessage}</p>
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
            onClick={onPayment}
            disabled={!walletReady || isProcessing}
            className={cn(
              'px-8 py-4',
              'rounded-lg',
              'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]',
              'text-black font-bold text-lg',
              'hover:scale-105',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
            )}
            style={{
              boxShadow: '0 0 30px rgba(var(--color-primary-rgb), 0.6)',
            }}
          >
            {isProcessing
              ? 'Processing...'
              : paymentStatus === 'signing'
                ? 'Sign in wallet...'
                : `Pay & Play - $${gamePrice}`}
          </button>

          <Link
            to={backLink}
            className={cn(
              'inline-flex items-center gap-2',
              'px-8 py-4',
              'rounded-lg',
              'bg-[#1a1a2e]',
              'border border-[#2d2d4a]',
              'text-white font-semibold text-lg',
              'hover:border-[var(--color-primary)]',
              'hover:text-[var(--color-primary)]',
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

PaymentGate.displayName = 'PaymentGate';

export default PaymentGate;
