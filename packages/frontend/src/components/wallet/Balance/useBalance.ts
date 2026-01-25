/**
 * useBalance Hook
 *
 * Hook for fetching and formatting token balances from the blockchain.
 * Supports any ERC-20 token with automatic refresh on block updates.
 */

import { useState, useEffect, useCallback } from 'react';
import { formatUnits } from 'viem';
import type { BalanceData } from './Balance.types';

/**
 * USDC contract address on Cronos Testnet
 */
const USDC_ADDRESS = '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0';

/**
 * USDC decimals (6 for USDC)
 */
const USDC_DECIMALS = 6;

/**
 * ERC-20 balanceOf function signature
 */
const BALANCE_OF_SIGNATURE = '0x70a08231'; // keccak256('balanceOf(address)')

/**
 * Hook to fetch token balance
 *
 * @param address - Wallet address to fetch balance for
 * @param tokenAddress - Token contract address (defaults to USDC)
 * @returns Balance data and refresh function
 */
export function useBalance(address?: string, tokenAddress: string = USDC_ADDRESS) {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch balance from blockchain
  const fetchBalance = useCallback(async () => {
    // Clear state if no address
    if (!address) {
      setBalance(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get window.ethereum provider
      if (!window.ethereum) {
        throw new Error('No Ethereum provider found');
      }

      // Encode balanceOf(address) call
      // balanceOf signature: 0x70a08231
      // Padded address parameter (32 bytes)
      const paddedAddress = address.slice(2).padStart(64, '0');
      const data = BALANCE_OF_SIGNATURE + paddedAddress;

      // Call balanceOf on token contract
      const result = await window.ethereum.request({
        method: 'eth_call',
        params: [
          {
            to: tokenAddress,
            data,
          },
          'latest',
        ],
      });

      // Parse result (hex string -> bigint)
      const rawBalance = BigInt(result as string);

      // Format balance with decimals
      const formatted = formatUnits(rawBalance, USDC_DECIMALS);

      // Create balance data
      const balanceData: BalanceData = {
        raw: rawBalance,
        formatted,
        symbol: 'USDC',
        decimals: USDC_DECIMALS,
      };

      setBalance(balanceData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch balance');
      setError(error);
       
      console.error('Error fetching balance:', error);
    } finally {
      setIsLoading(false);
    }
  }, [address, tokenAddress]);

  // Fetch on mount and when address/token changes
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Return balance data and manual refresh function
  return {
    balance,
    isLoading,
    error,
    refresh: fetchBalance,
  };
}
