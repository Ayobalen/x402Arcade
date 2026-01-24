/**
 * Balance Component Types
 *
 * Type definitions for the Balance component.
 */

/**
 * Balance component props
 */
export interface BalanceProps {
  /** Wallet address to fetch balance for (if not provided, uses connected wallet) */
  address?: string;
  /** Token contract address (defaults to USDC) */
  tokenAddress?: string;
  /** Whether to show the currency symbol (default: true) */
  showSymbol?: boolean;
  /** Whether to show a refresh button (default: false) */
  showRefresh?: boolean;
  /** Number of decimal places to display (default: 2) */
  decimals?: number;
  /** Custom className */
  className?: string;
  /** Callback when balance loads */
  onBalanceLoad?: (balance: string) => void;
  /** Callback when balance refresh is triggered */
  onRefresh?: () => void;
}

/**
 * Balance data from blockchain
 */
export interface BalanceData {
  /** Raw balance value (wei/smallest unit) */
  raw: bigint;
  /** Formatted balance string (e.g., "10.50") */
  formatted: string;
  /** Token symbol (e.g., "USDC") */
  symbol: string;
  /** Token decimals */
  decimals: number;
}
