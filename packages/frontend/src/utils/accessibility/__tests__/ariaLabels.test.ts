/**
 * ARIA Labels Utilities Tests
 *
 * Tests for ARIA label generation functions.
 */

import { describe, it, expect } from 'vitest';
import {
  getCloseButtonLabel,
  getNavigationLabel,
  getActionButtonLabel,
  getToggleButtonLabel,
  getIconButtonLabel,
  getShareButtonLabel,
  getGameControlLabel,
  getInputLabel,
  getWalletLabel,
  getScoreLabel,
  getLoadingLabel,
  getErrorLabel,
  getRankLabel,
  getNetworkLabel,
  getTransactionLabel,
} from '../ariaLabels';

describe('ariaLabels', () => {
  describe('getCloseButtonLabel()', () => {
    it('should return default label', () => {
      expect(getCloseButtonLabel()).toBe('Close dialog');
    });

    it('should return label with context', () => {
      expect(getCloseButtonLabel('modal')).toBe('Close modal');
      expect(getCloseButtonLabel('menu')).toBe('Close menu');
      expect(getCloseButtonLabel('Settings dialog')).toBe('Close Settings dialog');
    });
  });

  describe('getNavigationLabel()', () => {
    it('should return navigation label', () => {
      expect(getNavigationLabel('Home')).toBe('Navigate to Home');
      expect(getNavigationLabel('Leaderboard')).toBe('Navigate to Leaderboard');
      expect(getNavigationLabel('Game page')).toBe('Navigate to Game page');
    });
  });

  describe('getActionButtonLabel()', () => {
    it('should return action label without target', () => {
      expect(getActionButtonLabel('Submit')).toBe('Submit');
      expect(getActionButtonLabel('Cancel')).toBe('Cancel');
    });

    it('should return action label with target', () => {
      expect(getActionButtonLabel('Delete', 'account')).toBe('Delete account');
      expect(getActionButtonLabel('Play', 'Snake game')).toBe('Play Snake game');
      expect(getActionButtonLabel('Submit', 'score')).toBe('Submit score');
    });
  });

  describe('getToggleButtonLabel()', () => {
    it('should return enable label when state is false', () => {
      expect(getToggleButtonLabel('sound effects', false)).toBe('Enable sound effects');
      expect(getToggleButtonLabel('dark mode', false)).toBe('Enable dark mode');
    });

    it('should return disable label when state is true', () => {
      expect(getToggleButtonLabel('sound effects', true)).toBe('Disable sound effects');
      expect(getToggleButtonLabel('dark mode', true)).toBe('Disable dark mode');
    });
  });

  describe('getIconButtonLabel()', () => {
    it('should return icon name without action', () => {
      expect(getIconButtonLabel('Menu')).toBe('Menu');
      expect(getIconButtonLabel('Settings')).toBe('Settings');
    });

    it('should return action when provided', () => {
      expect(getIconButtonLabel('Settings', 'Open settings')).toBe('Open settings');
      expect(getIconButtonLabel('Menu', 'Open navigation menu')).toBe('Open navigation menu');
    });
  });

  describe('getShareButtonLabel()', () => {
    it('should return share label without content', () => {
      expect(getShareButtonLabel('Twitter')).toBe('Share on Twitter');
      expect(getShareButtonLabel('Facebook')).toBe('Share on Facebook');
    });

    it('should return share label with content', () => {
      expect(getShareButtonLabel('Twitter', 'high score')).toBe('Share high score on Twitter');
      expect(getShareButtonLabel('Facebook', 'achievement')).toBe('Share achievement on Facebook');
    });
  });

  describe('getGameControlLabel()', () => {
    it('should append "game" for simple controls', () => {
      expect(getGameControlLabel('pause')).toBe('pause game');
      expect(getGameControlLabel('restart')).toBe('restart game');
      expect(getGameControlLabel('start')).toBe('start game');
    });

    it('should not double-append "game"', () => {
      expect(getGameControlLabel('pause game')).toBe('pause game');
      expect(getGameControlLabel('Restart Game')).toBe('Restart Game');
    });

    it('should handle "play again" specially', () => {
      expect(getGameControlLabel('play again')).toBe('Play again');
      expect(getGameControlLabel('Play Again')).toBe('Play again');
    });
  });

  describe('getInputLabel()', () => {
    it('should return simple field name', () => {
      expect(getInputLabel('Email')).toBe('Email');
      expect(getInputLabel('Username')).toBe('Username');
    });

    it('should add required indicator', () => {
      expect(getInputLabel('Email', true)).toBe('Email (required)');
      expect(getInputLabel('Password', true)).toBe('Password (required)');
    });

    it('should add helper text', () => {
      expect(getInputLabel('Email', false, 'Enter your email address')).toBe(
        'Email. Enter your email address'
      );
    });

    it('should combine required and helper text', () => {
      expect(getInputLabel('Email', true, 'Must be a valid email')).toBe(
        'Email (required). Must be a valid email'
      );
    });
  });

  describe('getWalletLabel()', () => {
    it('should return not connected label', () => {
      expect(getWalletLabel()).toBe('Wallet not connected');
      expect(getWalletLabel(undefined, false)).toBe('Wallet not connected');
    });

    it('should return connected label with address', () => {
      expect(getWalletLabel('0x1234...5678', true)).toBe('Connected wallet: 0x1234...5678');
      expect(getWalletLabel('0xabcd...ef01', true)).toBe('Connected wallet: 0xabcd...ef01');
    });

    it('should handle connected state without address', () => {
      expect(getWalletLabel(undefined, true)).toBe('Wallet not connected');
    });
  });

  describe('getScoreLabel()', () => {
    it('should format score without prefix', () => {
      expect(getScoreLabel(1250)).toBe('Score: 1,250');
      expect(getScoreLabel(1000000)).toBe('Score: 1,000,000');
      expect(getScoreLabel(0)).toBe('Score: 0');
    });

    it('should format score with prefix', () => {
      expect(getScoreLabel(1250, 'Current')).toBe('Current Score: 1,250');
      expect(getScoreLabel(5000, 'High')).toBe('High Score: 5,000');
      expect(getScoreLabel(100, 'Final')).toBe('Final Score: 100');
    });
  });

  describe('getLoadingLabel()', () => {
    it('should return loading label', () => {
      expect(getLoadingLabel('Connecting')).toBe('Connecting, please wait');
      expect(getLoadingLabel('Submitting score')).toBe('Submitting score, please wait');
      expect(getLoadingLabel('Loading game')).toBe('Loading game, please wait');
    });
  });

  describe('getErrorLabel()', () => {
    it('should return error label without message', () => {
      expect(getErrorLabel('Connection failed')).toBe('Error: Connection failed');
      expect(getErrorLabel('Invalid input')).toBe('Error: Invalid input');
    });

    it('should return error label with message', () => {
      expect(getErrorLabel('Network', 'Unable to connect')).toBe(
        'Network Error: Unable to connect'
      );
      expect(getErrorLabel('Validation', 'Email is required')).toBe(
        'Validation Error: Email is required'
      );
    });
  });

  describe('getRankLabel()', () => {
    it('should return rank with ordinal suffix', () => {
      expect(getRankLabel(1)).toBe('Rank 1st');
      expect(getRankLabel(2)).toBe('Rank 2nd');
      expect(getRankLabel(3)).toBe('Rank 3rd');
      expect(getRankLabel(4)).toBe('Rank 4th');
      expect(getRankLabel(11)).toBe('Rank 11th');
      expect(getRankLabel(21)).toBe('Rank 21st');
      expect(getRankLabel(42)).toBe('Rank 42nd');
      expect(getRankLabel(103)).toBe('Rank 103rd');
    });

    it('should return rank with total', () => {
      expect(getRankLabel(1, 100)).toBe('Rank 1st out of 100');
      expect(getRankLabel(42, 1000)).toBe('Rank 42nd out of 1,000');
      expect(getRankLabel(5, 10000)).toBe('Rank 5th out of 10,000');
    });

    it('should handle edge cases for ordinal suffixes', () => {
      expect(getRankLabel(111)).toBe('Rank 111th');
      expect(getRankLabel(112)).toBe('Rank 112th');
      expect(getRankLabel(113)).toBe('Rank 113th');
      expect(getRankLabel(121)).toBe('Rank 121st');
      expect(getRankLabel(122)).toBe('Rank 122nd');
      expect(getRankLabel(123)).toBe('Rank 123rd');
    });
  });

  describe('getNetworkLabel()', () => {
    it('should return correct network label', () => {
      expect(getNetworkLabel('Cronos Testnet', true)).toBe('Connected to Cronos Testnet');
      expect(getNetworkLabel('Ethereum', true)).toBe('Connected to Ethereum');
    });

    it('should return wrong network label', () => {
      expect(getNetworkLabel('Ethereum', false)).toBe(
        'Wrong network: Ethereum. Please switch networks.'
      );
      expect(getNetworkLabel('Polygon', false)).toBe(
        'Wrong network: Polygon. Please switch networks.'
      );
    });

    it('should use correct network by default', () => {
      expect(getNetworkLabel('Cronos Testnet')).toBe('Connected to Cronos Testnet');
    });
  });

  describe('getTransactionLabel()', () => {
    it('should return label without hash', () => {
      expect(getTransactionLabel()).toBe('View transaction on block explorer');
    });

    it('should return label with hash', () => {
      expect(getTransactionLabel('0xabc...123')).toBe(
        'View transaction 0xabc...123 on block explorer'
      );
      expect(getTransactionLabel('0x1234567890abcdef')).toBe(
        'View transaction 0x1234567890abcdef on block explorer'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings gracefully', () => {
      expect(getCloseButtonLabel('')).toBe('Close ');
      expect(getNavigationLabel('')).toBe('Navigate to ');
      expect(getActionButtonLabel('')).toBe('');
    });

    it('should handle special characters', () => {
      expect(getNavigationLabel('Game / Leaderboard')).toBe('Navigate to Game / Leaderboard');
      expect(getInputLabel("User's Email")).toBe("User's Email");
    });

    it('should handle very large numbers in score', () => {
      expect(getScoreLabel(999999999)).toBe('Score: 999,999,999');
    });

    it('should handle negative rank (edge case)', () => {
      expect(getRankLabel(-1)).toBe('Rank -1th');
    });

    it('should handle zero rank', () => {
      expect(getRankLabel(0)).toBe('Rank 0th');
    });
  });
});
