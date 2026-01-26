/**
 * Balance Component
 *
 * Displays user's token balance with formatting and optional refresh.
 * Uses retro arcade/neon theme styling.
 *
 * @example
 * // Basic usage (uses connected wallet)
 * <Balance />
 *
 * // With specific address
 * <Balance address="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0" />
 *
 * // With refresh button
 * <Balance showRefresh onRefresh={() => console.log('Refreshing...')} />
 *
 * // Custom decimals
 * <Balance decimals={4} />
 */

import { useEffect } from 'react';
import { cn, formatBalance } from '@/lib/utils';
import { useWalletStore } from '@/stores/walletStore';
import { useBalance } from './useBalance';
import type { BalanceProps } from './Balance.types';

/**
 * Refresh icon component
 */
function RefreshIcon({ className, spinning }: { className?: string; spinning?: boolean }) {
  return (
    <svg
      className={cn(className, spinning && 'animate-spin')}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

/**
 * Balance Component
 */
export function Balance({
  address: providedAddress,
  tokenAddress,
  showSymbol = true,
  showRefresh = false,
  decimals = 2,
  className,
  onBalanceLoad,
  onRefresh,
}: BalanceProps) {
  // Get connected wallet address if none provided
  const connectedAddress = useWalletStore((state) => state.address);
  const address = providedAddress || connectedAddress || undefined;

  // Fetch balance
  const { balance, isLoading, error, refresh } = useBalance(address, tokenAddress);

  // Call onBalanceLoad when balance loads
  useEffect(() => {
    if (balance) {
      onBalanceLoad?.(balance.formatted);
    }
  }, [balance, onBalanceLoad]);

  // Handle refresh click
  const handleRefresh = () => {
    onRefresh?.();
    refresh();
  };

  // Format balance with proper thousand separators and decimal places
  const formattedBalance = balance
    ? formatBalance(balance.formatted, {
        decimals,
        showSymbol: false, // We show symbol separately in the component
        useThousandSeparator: true,
        minimumDisplayValue: 0.01,
      })
    : '0.00';

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      {/* Balance display */}
      <div
        className={cn(
          // Layout
          'px-3 py-1.5 rounded-lg',
          // Styling - Theme-aware
          'bg-[var(--color-bg-elevated)]',
          'border border-[var(--color-border)]',
          // Neon glow (theme primary)
          'shadow-[0_0_8px_var(--color-primary-glow)]',
          // Loading state
          isLoading && 'animate-pulse'
        )}
      >
        {error ? (
          <span className="text-[var(--color-error)] text-sm font-mono">Error</span>
        ) : (
          <span className="text-[var(--color-primary)] text-sm font-mono font-semibold">
            {formattedBalance}
            {showSymbol && balance && (
              <span className="text-[var(--color-text-muted)] ml-1">{balance.symbol}</span>
            )}
          </span>
        )}
      </div>

      {/* Refresh button */}
      {showRefresh && (
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isLoading}
          className={cn(
            // Layout
            'p-1.5 rounded-lg',
            // Styling
            'bg-transparent',
            'border border-[#2d2d4a]',
            'text-[#00ffff]',
            // Hover
            'hover:bg-[#00ffff]/10',
            'hover:border-[#00ffff]/50',
            // Disabled
            'disabled:opacity-50 disabled:cursor-not-allowed',
            // Transition
            'transition-all duration-150'
          )}
          aria-label="Refresh balance"
        >
          <RefreshIcon className="w-4 h-4" spinning={isLoading} />
        </button>
      )}
    </div>
  );
}

Balance.displayName = 'Balance';

export default Balance;
