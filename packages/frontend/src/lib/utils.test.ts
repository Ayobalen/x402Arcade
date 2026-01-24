/**
 * Tests for utility functions
 */

import { describe, it, expect } from 'vitest';
import { formatBalance } from './utils';

describe('formatBalance', () => {
  describe('basic formatting', () => {
    it('formats zero correctly', () => {
      expect(formatBalance('0')).toBe('0.00 USDC');
    });

    it('formats regular balances with 2 decimals by default', () => {
      expect(formatBalance('42.5678')).toBe('42.57 USDC');
    });

    it('rounds to 2 decimal places', () => {
      expect(formatBalance('123.456789')).toBe('123.46 USDC');
    });
  });

  describe('thousand separators', () => {
    it('adds thousand separators to large numbers', () => {
      expect(formatBalance('1234.56')).toBe('1,234.56 USDC');
    });

    it('handles millions correctly', () => {
      expect(formatBalance('1000000.99')).toBe('1,000,000.99 USDC');
    });

    it('handles multiple thousand groups', () => {
      expect(formatBalance('12345678.12')).toBe('12,345,678.12 USDC');
    });

    it('can disable thousand separators', () => {
      expect(formatBalance('1234.56', { useThousandSeparator: false })).toBe('1234.56 USDC');
    });
  });

  describe('currency symbols', () => {
    it('shows USDC symbol by default', () => {
      expect(formatBalance('100')).toBe('100.00 USDC');
    });

    it('can use dollar sign prefix', () => {
      expect(formatBalance('100', { useDollarSign: true })).toBe('$100.00');
    });

    it('can hide symbol completely', () => {
      expect(formatBalance('100', { showSymbol: false })).toBe('100.00');
    });

    it('can use custom symbol', () => {
      expect(formatBalance('100', { symbol: 'ETH' })).toBe('100.00 ETH');
    });
  });

  describe('decimal places', () => {
    it('can use custom decimal places', () => {
      expect(formatBalance('42.123456', { decimals: 4 })).toBe('42.1235 USDC');
    });

    it('pads with zeros if needed', () => {
      expect(formatBalance('42', { decimals: 4 })).toBe('42.0000 USDC');
    });

    it('works with 0 decimals', () => {
      expect(formatBalance('42.99', { decimals: 0 })).toBe('43 USDC');
    });
  });

  describe('very small balances', () => {
    it('shows "< 0.01" for very small balances by default', () => {
      expect(formatBalance('0.001')).toBe('< 0.01 USDC');
    });

    it('shows "< 0.01" for tiny balances', () => {
      expect(formatBalance('0.000001')).toBe('< 0.01 USDC');
    });

    it('shows normal formatting for balances >= minimum', () => {
      expect(formatBalance('0.01')).toBe('0.01 USDC');
      expect(formatBalance('0.02')).toBe('0.02 USDC');
    });

    it('can customize minimum display value', () => {
      expect(formatBalance('0.0001', { minimumDisplayValue: 0.001 })).toBe('< 0.00 USDC');
    });

    it('shows "< $0.01" with dollar sign for small balances', () => {
      expect(formatBalance('0.001', { useDollarSign: true })).toBe('< $0.01');
    });

    it('does not show minimum for zero', () => {
      expect(formatBalance('0')).toBe('0.00 USDC');
    });
  });

  describe('input types', () => {
    it('handles string input', () => {
      expect(formatBalance('123.45')).toBe('123.45 USDC');
    });

    it('handles number input', () => {
      expect(formatBalance(123.45)).toBe('123.45 USDC');
    });

    it('handles bigint input', () => {
      expect(formatBalance(BigInt(123))).toBe('123.00 USDC');
    });

    it('handles invalid numbers gracefully', () => {
      expect(formatBalance('invalid')).toBe('0.00 USDC');
      expect(formatBalance('NaN')).toBe('0.00 USDC');
    });
  });

  describe('complex scenarios', () => {
    it('formats large balance with dollar sign and 4 decimals', () => {
      expect(
        formatBalance('1234567.89', {
          decimals: 4,
          useDollarSign: true,
        })
      ).toBe('$1,234,567.8900');
    });

    it('formats without symbol or separators', () => {
      expect(
        formatBalance('1234.56', {
          showSymbol: false,
          useThousandSeparator: false,
        })
      ).toBe('1234.56');
    });

    it('handles negative numbers', () => {
      expect(formatBalance('-123.45')).toBe('-123.45 USDC');
    });
  });

  describe('USDC token decimals conversion', () => {
    it('note: actual conversion from raw token value (6 decimals) happens in useBalance hook', () => {
      // The formatBalance function expects already-converted decimal strings
      // The useBalance hook converts from raw BigInt using formatUnits(rawBalance, 6)
      // This test just documents the expected workflow

      // Example: USDC raw value of 1000000 (6 decimals) = 1.0 USDC
      // useBalance converts: formatUnits(1000000n, 6) = "1.0"
      // formatBalance displays: "1.00 USDC"

      expect(formatBalance('1.0')).toBe('1.00 USDC');
      expect(formatBalance('0.01')).toBe('0.01 USDC'); // Minimum game cost
      expect(formatBalance('0.02')).toBe('0.02 USDC'); // Alternative game cost
    });
  });
});
