/**
 * ARIA Descriptions Utility Tests
 *
 * Tests for aria-describedby content generation utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  getWalletConnectionDescription,
  getGameSessionDescription,
  getPaymentFlowDescription,
  getLeaderboardDescription,
  getPrizePoolDescription,
  getEffectsSettingDescription,
  getInputDescription,
  generateDescriptionId,
  createDescriptionProps,
  type WalletConnectionState,
  type GameSessionState,
  type PaymentFlowState,
  type LeaderboardView,
} from '../ariaDescriptions';

describe('ariaDescriptions', () => {
  // ============================================================
  // WALLET CONNECTION DESCRIPTIONS
  // ============================================================

  describe('getWalletConnectionDescription', () => {
    const walletStates: WalletConnectionState[] = [
      'disconnected',
      'connecting',
      'connected',
      'wrong_network',
      'switching',
      'error',
      'no_wallet',
    ];

    walletStates.forEach((state) => {
      it(`should return description for "${state}" state`, () => {
        const result = getWalletConnectionDescription(state);

        expect(result.descriptionId).toBe(`wallet-description-${state}`);
        expect(result.description).toBeTruthy();
        expect(typeof result.description).toBe('string');
        expect(result.description.length).toBeGreaterThan(20);
      });
    });

    it('should include network name in wrong_network description when provided', () => {
      const result = getWalletConnectionDescription('wrong_network', 'Ethereum Mainnet');

      expect(result.description).toContain('Ethereum Mainnet');
    });

    it('should provide generic wrong_network description without network name', () => {
      const result = getWalletConnectionDescription('wrong_network');

      expect(result.description).toContain('unsupported network');
    });

    it('should mention MetaMask in no_wallet description', () => {
      const result = getWalletConnectionDescription('no_wallet');

      expect(result.description).toContain('MetaMask');
    });

    it('should mention approval in connecting description', () => {
      const result = getWalletConnectionDescription('connecting');

      expect(result.description.toLowerCase()).toContain('approve');
    });

    it('should mention no funds transferred in disconnected description', () => {
      const result = getWalletConnectionDescription('disconnected');

      expect(result.description).toContain('No funds will be transferred');
    });
  });

  // ============================================================
  // GAME SESSION DESCRIPTIONS
  // ============================================================

  describe('getGameSessionDescription', () => {
    const gameStates: GameSessionState[] = [
      'ready',
      'paying',
      'payment_pending',
      'playing',
      'paused',
      'game_over',
      'submitting_score',
    ];

    gameStates.forEach((state) => {
      it(`should return description for "${state}" state`, () => {
        const result = getGameSessionDescription(state, 'Snake', 0.01);

        expect(result.descriptionId).toContain('game-description-snake');
        expect(result.descriptionId).toContain(state);
        // Some states like payment_pending and submitting_score are generic
        // and don't include the game name in the description
        expect(result.description).toBeTruthy();
      });
    });

    it('should include cost in ready state description', () => {
      const result = getGameSessionDescription('ready', 'Tetris', 0.02);

      expect(result.description).toContain('$0.02 USDC');
    });

    it('should use generic cost text when cost not provided', () => {
      const result = getGameSessionDescription('ready', 'Pong');

      expect(result.description).toContain('a small USDC fee');
    });

    it('should sanitize game name in description ID', () => {
      const result = getGameSessionDescription('ready', 'Space Invaders');

      expect(result.descriptionId).toBe('game-description-space-invaders-ready');
    });

    it('should mention keyboard controls in playing state', () => {
      const result = getGameSessionDescription('playing', 'Snake');

      expect(result.description.toLowerCase()).toContain('keyboard');
    });

    it('should mention pause option in playing state', () => {
      const result = getGameSessionDescription('playing', 'Snake');

      expect(result.description).toContain('Escape');
    });

    it('should mention play again in game_over state', () => {
      const result = getGameSessionDescription('game_over', 'Snake');

      expect(result.description).toContain('Play Again');
    });
  });

  // ============================================================
  // PAYMENT FLOW DESCRIPTIONS
  // ============================================================

  describe('getPaymentFlowDescription', () => {
    const paymentStates: PaymentFlowState[] = [
      'idle',
      'initiating',
      'signing',
      'processing',
      'success',
      'failed',
    ];

    paymentStates.forEach((state) => {
      it(`should return description for "${state}" state`, () => {
        const result = getPaymentFlowDescription(state, 0.01);

        expect(result.descriptionId).toBe(`payment-description-${state}`);
        expect(result.description).toBeTruthy();
      });
    });

    it('should include amount in idle description', () => {
      const result = getPaymentFlowDescription('idle', 0.05);

      expect(result.description).toContain('$0.05 USDC');
    });

    it('should mention x402 protocol in idle description', () => {
      const result = getPaymentFlowDescription('idle');

      expect(result.description).toContain('x402');
    });

    it('should mention no gas fees in signing description', () => {
      const result = getPaymentFlowDescription('signing');

      expect(result.description.toLowerCase()).toContain('no gas');
    });

    it('should mention facilitator in processing description', () => {
      const result = getPaymentFlowDescription('processing');

      expect(result.description).toContain('facilitator');
    });

    it('should mention block explorer in success description', () => {
      const result = getPaymentFlowDescription('success');

      expect(result.description).toContain('block explorer');
    });

    it('should mention insufficient balance in failed description', () => {
      const result = getPaymentFlowDescription('failed');

      expect(result.description).toContain('insufficient balance');
    });
  });

  // ============================================================
  // LEADERBOARD DESCRIPTIONS
  // ============================================================

  describe('getLeaderboardDescription', () => {
    const views: LeaderboardView[] = ['daily', 'weekly', 'alltime'];

    views.forEach((view) => {
      it(`should return description for "${view}" view`, () => {
        const result = getLeaderboardDescription(view, 'Snake');

        expect(result.descriptionId).toContain('leaderboard-description-snake');
        expect(result.descriptionId).toContain(view);
        expect(result.description).toContain('Snake');
      });
    });

    it('should mention prize pool in daily view', () => {
      const result = getLeaderboardDescription('daily', 'Snake');

      expect(result.description).toContain('70%');
      expect(result.description).toContain('prize pool');
    });

    it('should mention UTC reset in daily view', () => {
      const result = getLeaderboardDescription('daily', 'Snake');

      expect(result.description).toContain('UTC');
    });

    it('should mention Monday reset in weekly view', () => {
      const result = getLeaderboardDescription('weekly', 'Snake');

      expect(result.description).toContain('Monday');
    });

    it('should mention eternal glory in alltime view', () => {
      const result = getLeaderboardDescription('alltime', 'Snake');

      expect(result.description).toContain('eternal glory');
    });

    it('should include player rank when provided', () => {
      const result = getLeaderboardDescription('daily', 'Snake', 5);

      expect(result.description).toContain('5th');
    });

    it('should congratulate player in top 10', () => {
      const result = getLeaderboardDescription('daily', 'Snake', 3);

      expect(result.description).toContain('Congratulations');
    });

    it('should not congratulate player outside top 10', () => {
      const result = getLeaderboardDescription('daily', 'Snake', 15);

      expect(result.description).not.toContain('Congratulations');
    });

    it('should mention tab navigation', () => {
      const result = getLeaderboardDescription('daily', 'Snake');

      expect(result.description).toContain('tabs');
    });
  });

  // ============================================================
  // PRIZE POOL DESCRIPTIONS
  // ============================================================

  describe('getPrizePoolDescription', () => {
    it('should include prize pool amount', () => {
      const result = getPrizePoolDescription(125.5);

      expect(result.description).toContain('$125.50 USDC');
    });

    it('should mention 70% contribution', () => {
      const result = getPrizePoolDescription(100);

      expect(result.description).toContain('70%');
    });

    it('should include time remaining when provided', () => {
      const result = getPrizePoolDescription(100, '4 hours');

      expect(result.description).toContain('4 hours');
    });

    it('should not include time text when not provided', () => {
      const result = getPrizePoolDescription(100);

      expect(result.description).not.toContain('will be distributed');
    });

    it('should have consistent description ID', () => {
      const result = getPrizePoolDescription(100);

      expect(result.descriptionId).toBe('prize-pool-description');
    });
  });

  // ============================================================
  // EFFECTS SETTING DESCRIPTIONS
  // ============================================================

  describe('getEffectsSettingDescription', () => {
    const knownEffects = ['particles', 'scanlines', 'glow', 'animations', 'sound', 'music'];

    knownEffects.forEach((effect) => {
      it(`should return description for "${effect}" when enabled`, () => {
        const result = getEffectsSettingDescription(effect, true);

        expect(result.descriptionId).toBe(`effect-description-${effect}`);
        expect(result.description).toBeTruthy();
        expect(result.description.toLowerCase()).toContain('on');
      });

      it(`should return description for "${effect}" when disabled`, () => {
        const result = getEffectsSettingDescription(effect, false);

        expect(result.descriptionId).toBe(`effect-description-${effect}`);
        expect(result.description).toBeTruthy();
        expect(result.description.toLowerCase()).toContain('off');
      });
    });

    it('should mention performance for particles', () => {
      const result = getEffectsSettingDescription('particles', true);

      expect(result.description.toLowerCase()).toContain('performance');
    });

    it('should mention retro for scanlines', () => {
      const result = getEffectsSettingDescription('scanlines', true);

      expect(result.description.toLowerCase()).toContain('retro');
    });

    it('should mention motion sensitivity for animations disabled', () => {
      const result = getEffectsSettingDescription('animations', false);

      expect(result.description).toContain('motion sensitivity');
    });

    it('should provide generic description for unknown effect', () => {
      const result = getEffectsSettingDescription('unknown_effect', true);

      expect(result.descriptionId).toBe('effect-description-unknown_effect');
      expect(result.description).toContain('enabled');
    });
  });

  // ============================================================
  // INPUT DESCRIPTIONS
  // ============================================================

  describe('getInputDescription', () => {
    it('should generate description ID from field name', () => {
      const result = getInputDescription('Email Address');

      expect(result.descriptionId).toBe('input-description-email-address');
    });

    it('should mention required when constraint set', () => {
      const result = getInputDescription('Username', { required: true });

      expect(result.description).toContain('required');
    });

    it('should mention min length constraint', () => {
      const result = getInputDescription('Password', { minLength: 8 });

      expect(result.description).toContain('at least 8 characters');
    });

    it('should mention max length constraint', () => {
      const result = getInputDescription('Bio', { maxLength: 200 });

      expect(result.description).toContain('Maximum 200 characters');
    });

    it('should mention both min and max length constraints', () => {
      const result = getInputDescription('Username', { minLength: 3, maxLength: 20 });

      expect(result.description).toContain('between 3 and 20 characters');
    });

    it('should recognize email pattern', () => {
      const result = getInputDescription('Email', { pattern: '@' });

      expect(result.description.toLowerCase()).toContain('email');
    });

    it('should recognize Ethereum address pattern', () => {
      const result = getInputDescription('Wallet', { pattern: '0x' });

      expect(result.description).toContain('0x');
    });

    it('should provide default description without constraints', () => {
      const result = getInputDescription('Name');

      expect(result.description).toBe('Enter your Name.');
    });
  });

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================

  describe('generateDescriptionId', () => {
    it('should generate ID from prefix', () => {
      const result = generateDescriptionId('wallet');

      expect(result).toBe('wallet-description');
    });

    it('should include suffix when provided', () => {
      const result = generateDescriptionId('game', 'snake');

      expect(result).toBe('game-description-snake');
    });

    it('should sanitize prefix with spaces', () => {
      const result = generateDescriptionId('Game Session');

      expect(result).toBe('game-session-description');
    });

    it('should sanitize suffix with spaces', () => {
      const result = generateDescriptionId('leaderboard', 'All Time');

      expect(result).toBe('leaderboard-description-all-time');
    });

    it('should convert to lowercase', () => {
      const result = generateDescriptionId('WALLET', 'CONNECTED');

      expect(result).toBe('wallet-description-connected');
    });
  });

  describe('createDescriptionProps', () => {
    it('should return object with id prop', () => {
      const result = createDescriptionProps('test-id', 'Test description');

      expect(result.id).toBe('test-id');
    });

    it('should return object with children prop', () => {
      const result = createDescriptionProps('test-id', 'Test description');

      expect(result.children).toBe('Test description');
    });

    it('should work with spread syntax', () => {
      const props = createDescriptionProps('my-id', 'My description');

      // Simulate spreading onto an element
      const element = { ...props };

      expect(element.id).toBe('my-id');
      expect(element.children).toBe('My description');
    });
  });

  // ============================================================
  // INTEGRATION TESTS
  // ============================================================

  describe('Integration', () => {
    it('should provide unique description IDs across all functions', () => {
      const ids = new Set<string>();

      // Collect IDs from various functions
      ids.add(getWalletConnectionDescription('connected').descriptionId);
      ids.add(getGameSessionDescription('playing', 'Snake').descriptionId);
      ids.add(getPaymentFlowDescription('processing').descriptionId);
      ids.add(getLeaderboardDescription('daily', 'Snake').descriptionId);
      ids.add(getPrizePoolDescription(100).descriptionId);
      ids.add(getEffectsSettingDescription('particles', true).descriptionId);
      ids.add(getInputDescription('Email').descriptionId);

      // All IDs should be unique
      expect(ids.size).toBe(7);
    });

    it('should provide descriptions suitable for screen readers', () => {
      // All descriptions should be complete sentences
      const descriptions = [
        getWalletConnectionDescription('disconnected').description,
        getGameSessionDescription('ready', 'Snake').description,
        getPaymentFlowDescription('idle').description,
        getLeaderboardDescription('daily', 'Snake').description,
        getPrizePoolDescription(100).description,
      ];

      descriptions.forEach((desc) => {
        // Should be proper sentence length
        expect(desc.length).toBeGreaterThan(50);
        // Should end with period
        expect(desc).toMatch(/\.$/);
      });
    });
  });
});
