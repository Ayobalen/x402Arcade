/**
 * Utility functions for the x402Arcade frontend
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names with Tailwind CSS merge support.
 * Uses clsx for conditional classes and twMerge to properly handle Tailwind conflicts.
 *
 * @example
 * cn('px-4 py-2', condition && 'bg-blue-500', 'text-white')
 * // Returns merged class string with Tailwind conflicts resolved
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format options for balance display
 */
export interface FormatBalanceOptions {
  /**
   * Number of decimal places to display (default: 2)
   */
  decimals?: number;
  /**
   * Whether to show the currency symbol (default: true)
   */
  showSymbol?: boolean;
  /**
   * Currency symbol to use (default: 'USDC')
   */
  symbol?: string;
  /**
   * Whether to use $ prefix instead of symbol suffix (default: false)
   */
  useDollarSign?: boolean;
  /**
   * Whether to add thousand separators (default: true)
   */
  useThousandSeparator?: boolean;
  /**
   * Minimum value to display before showing "< 0.01" (default: 0.01)
   */
  minimumDisplayValue?: number;
}

/**
 * Formats a balance value for display with proper decimal places,
 * thousand separators, and currency symbols.
 *
 * @param value - The balance value as a string or number
 * @param options - Formatting options
 * @returns Formatted balance string
 *
 * @example
 * formatBalance('1234.5678')
 * // Returns '1,234.57 USDC'
 *
 * @example
 * formatBalance('0.001', { minimumDisplayValue: 0.01 })
 * // Returns '< 0.01 USDC'
 *
 * @example
 * formatBalance('1000000.00', { useDollarSign: true })
 * // Returns '$1,000,000.00'
 *
 * @example
 * formatBalance('42.123456', { decimals: 4 })
 * // Returns '42.1235 USDC'
 */
export function formatBalance(
  value: string | number | bigint,
  options: FormatBalanceOptions = {}
): string {
  const {
    decimals = 2,
    showSymbol = true,
    symbol = 'USDC',
    useDollarSign = false,
    useThousandSeparator = true,
    minimumDisplayValue = 0.01,
  } = options;

  // Convert to number
  const numValue = typeof value === 'bigint' ? Number(value) : parseFloat(value.toString());

  // Handle invalid numbers
  if (isNaN(numValue)) {
    return showSymbol ? `0.00 ${symbol}` : '0.00';
  }

  // Handle very small balances
  if (numValue > 0 && numValue < minimumDisplayValue && minimumDisplayValue > 0) {
    const minDisplay = minimumDisplayValue.toFixed(decimals);
    if (useDollarSign) {
      return `< $${minDisplay}`;
    }
    return showSymbol ? `< ${minDisplay} ${symbol}` : `< ${minDisplay}`;
  }

  // Round to specified decimals
  const rounded = numValue.toFixed(decimals);

  // Split into integer and decimal parts
  const [integerPart, decimalPart] = rounded.split('.');

  // Add thousand separators to integer part if enabled
  let formattedInteger = integerPart;
  if (useThousandSeparator) {
    formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // Combine integer and decimal parts
  const formattedValue =
    decimalPart !== undefined ? `${formattedInteger}.${decimalPart}` : formattedInteger;

  // Add currency symbol or dollar sign
  if (!showSymbol) {
    return formattedValue;
  }

  if (useDollarSign) {
    return `$${formattedValue}`;
  }

  return `${formattedValue} ${symbol}`;
}
