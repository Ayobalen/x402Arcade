/**
 * Loading Store Tests
 *
 * Tests for global loading state management.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useLoadingStore, withLoading } from '../loadingStore';

describe('Loading Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useLoadingStore.getState().clearAll();
    useLoadingStore.getState().clearHistory();
  });

  describe('Initial State', () => {
    it('should start with no loading operations', () => {
      const state = useLoadingStore.getState();

      expect(state.operations.size).toBe(0);
      expect(state.history).toEqual([]);
    });

    it('should report isAnyLoading as false initially', () => {
      const { isAnyLoading } = useLoadingStore.getState();

      expect(isAnyLoading()).toBe(false);
    });
  });

  describe('startLoading', () => {
    it('should add operation to loading map', () => {
      const { startLoading, isLoading } = useLoadingStore.getState();

      startLoading('wallet-connect');

      expect(isLoading('wallet-connect')).toBe(true);
    });

    it('should track startedAt timestamp', () => {
      const { startLoading, getLoadingEntry } = useLoadingStore.getState();

      const before = new Date();
      startLoading('wallet-connect');
      const after = new Date();

      const entry = getLoadingEntry('wallet-connect');
      expect(entry).toBeDefined();
      expect(entry!.startedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(entry!.startedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should store optional message', () => {
      const { startLoading, getLoadingEntry } = useLoadingStore.getState();

      startLoading('wallet-connect', { message: 'Connecting wallet...' });

      const entry = getLoadingEntry('wallet-connect');
      expect(entry?.message).toBe('Connecting wallet...');
    });

    it('should store optional category', () => {
      const { startLoading, getLoadingEntry } = useLoadingStore.getState();

      startLoading('wallet-connect', { category: 'wallet' });

      const entry = getLoadingEntry('wallet-connect');
      expect(entry?.category).toBe('wallet');
    });

    it('should store optional progress', () => {
      const { startLoading, getLoadingEntry } = useLoadingStore.getState();

      startLoading('game-load', { progress: 25 });

      const entry = getLoadingEntry('game-load');
      expect(entry?.progress).toBe(25);
    });

    it('should store optional cancellable flag', () => {
      const { startLoading, getLoadingEntry } = useLoadingStore.getState();

      startLoading('data-leaderboard', { cancellable: true });

      const entry = getLoadingEntry('data-leaderboard');
      expect(entry?.cancellable).toBe(true);
    });

    it('should update isAnyLoading', () => {
      const { startLoading, isAnyLoading } = useLoadingStore.getState();

      startLoading('wallet-connect');

      expect(isAnyLoading()).toBe(true);
    });
  });

  describe('stopLoading', () => {
    it('should remove operation from loading map', () => {
      const { startLoading, stopLoading, isLoading } = useLoadingStore.getState();

      startLoading('wallet-connect');
      stopLoading('wallet-connect');

      expect(isLoading('wallet-connect')).toBe(false);
    });

    it('should add entry to history', () => {
      const { startLoading, stopLoading } = useLoadingStore.getState();

      startLoading('wallet-connect');
      stopLoading('wallet-connect');

      const state = useLoadingStore.getState();
      expect(state.history).toHaveLength(1);
      expect(state.history[0].key).toBe('wallet-connect');
    });

    it('should record success status in history', () => {
      const { startLoading, stopLoading } = useLoadingStore.getState();

      startLoading('wallet-connect');
      stopLoading('wallet-connect', true);

      const state = useLoadingStore.getState();
      expect(state.history[0].success).toBe(true);
    });

    it('should record failure status in history', () => {
      const { startLoading, stopLoading } = useLoadingStore.getState();

      startLoading('wallet-connect');
      stopLoading('wallet-connect', false);

      const state = useLoadingStore.getState();
      expect(state.history[0].success).toBe(false);
    });

    it('should calculate duration in history', () => {
      const { startLoading, stopLoading } = useLoadingStore.getState();

      startLoading('wallet-connect');
      stopLoading('wallet-connect');

      const state = useLoadingStore.getState();
      expect(state.history[0].durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should update isAnyLoading when last operation stops', () => {
      const { startLoading, stopLoading, isAnyLoading } = useLoadingStore.getState();

      startLoading('wallet-connect');
      stopLoading('wallet-connect');

      expect(isAnyLoading()).toBe(false);
    });

    it('should not add to history if operation was not started', () => {
      const { stopLoading } = useLoadingStore.getState();

      stopLoading('never-started');

      const state = useLoadingStore.getState();
      expect(state.history).toHaveLength(0);
    });
  });

  describe('updateProgress', () => {
    it('should update progress for loading operation', () => {
      const { startLoading, updateProgress, getLoadingEntry } = useLoadingStore.getState();

      startLoading('game-load', { progress: 0 });
      updateProgress('game-load', 50);

      const entry = getLoadingEntry('game-load');
      expect(entry?.progress).toBe(50);
    });

    it('should not update progress for non-existent operation', () => {
      const { updateProgress, getLoadingEntry } = useLoadingStore.getState();

      updateProgress('non-existent', 50);

      expect(getLoadingEntry('non-existent')).toBeUndefined();
    });
  });

  describe('updateMessage', () => {
    it('should update message for loading operation', () => {
      const { startLoading, updateMessage, getLoadingEntry } = useLoadingStore.getState();

      startLoading('game-load', { message: 'Loading...' });
      updateMessage('game-load', 'Almost done...');

      const entry = getLoadingEntry('game-load');
      expect(entry?.message).toBe('Almost done...');
    });

    it('should not update message for non-existent operation', () => {
      const { updateMessage, getLoadingEntry } = useLoadingStore.getState();

      updateMessage('non-existent', 'Test message');

      expect(getLoadingEntry('non-existent')).toBeUndefined();
    });
  });

  describe('isLoading', () => {
    it('should return true for loading operation', () => {
      const { startLoading, isLoading } = useLoadingStore.getState();

      startLoading('wallet-connect');

      expect(isLoading('wallet-connect')).toBe(true);
    });

    it('should return false for non-loading operation', () => {
      const { isLoading } = useLoadingStore.getState();

      expect(isLoading('wallet-connect')).toBe(false);
    });
  });

  describe('isCategoryLoading', () => {
    it('should return true when category has loading operation', () => {
      const { startLoading, isCategoryLoading } = useLoadingStore.getState();

      startLoading('wallet-connect', { category: 'wallet' });

      expect(isCategoryLoading('wallet')).toBe(true);
    });

    it('should return false when category has no loading operations', () => {
      const { startLoading, isCategoryLoading } = useLoadingStore.getState();

      startLoading('wallet-connect', { category: 'wallet' });

      expect(isCategoryLoading('payment')).toBe(false);
    });

    it('should return false when all category operations are stopped', () => {
      const { startLoading, stopLoading, isCategoryLoading } = useLoadingStore.getState();

      startLoading('wallet-connect', { category: 'wallet' });
      stopLoading('wallet-connect');

      expect(isCategoryLoading('wallet')).toBe(false);
    });
  });

  describe('getLoadingOperations', () => {
    it('should return all loading operations', () => {
      const { startLoading, getLoadingOperations } = useLoadingStore.getState();

      startLoading('wallet-connect');
      startLoading('payment-authorize');
      startLoading('game-start');

      const operations = getLoadingOperations();
      expect(operations).toHaveLength(3);
    });

    it('should return empty array when no operations loading', () => {
      const { getLoadingOperations } = useLoadingStore.getState();

      expect(getLoadingOperations()).toHaveLength(0);
    });
  });

  describe('getLoadingByCategory', () => {
    it('should return operations in specified category', () => {
      const { startLoading, getLoadingByCategory } = useLoadingStore.getState();

      startLoading('wallet-connect', { category: 'wallet' });
      startLoading('wallet-sign', { category: 'wallet' });
      startLoading('payment-authorize', { category: 'payment' });

      const walletOps = getLoadingByCategory('wallet');
      expect(walletOps).toHaveLength(2);
    });

    it('should return empty array for category with no operations', () => {
      const { getLoadingByCategory } = useLoadingStore.getState();

      expect(getLoadingByCategory('game')).toHaveLength(0);
    });
  });

  describe('clearAll', () => {
    it('should clear all loading operations', () => {
      const { startLoading, clearAll, isAnyLoading } = useLoadingStore.getState();

      startLoading('wallet-connect');
      startLoading('payment-authorize');
      clearAll();

      expect(isAnyLoading()).toBe(false);
    });
  });

  describe('clearHistory', () => {
    it('should clear operation history', () => {
      const { startLoading, stopLoading, clearHistory } = useLoadingStore.getState();

      startLoading('wallet-connect');
      stopLoading('wallet-connect');
      clearHistory();

      const state = useLoadingStore.getState();
      expect(state.history).toHaveLength(0);
    });
  });

  describe('Multiple Operations', () => {
    it('should handle multiple concurrent operations', () => {
      const { startLoading, stopLoading, isLoading, isAnyLoading } = useLoadingStore.getState();

      startLoading('wallet-connect');
      startLoading('payment-authorize');
      startLoading('game-start');

      expect(isLoading('wallet-connect')).toBe(true);
      expect(isLoading('payment-authorize')).toBe(true);
      expect(isLoading('game-start')).toBe(true);

      stopLoading('wallet-connect');
      expect(isAnyLoading()).toBe(true);
      expect(isLoading('wallet-connect')).toBe(false);

      stopLoading('payment-authorize');
      stopLoading('game-start');
      expect(isAnyLoading()).toBe(false);
    });

    it('should maintain separate entries for each operation', () => {
      const { startLoading, getLoadingEntry } = useLoadingStore.getState();

      startLoading('wallet-connect', { message: 'Connecting...' });
      startLoading('payment-authorize', { message: 'Processing payment...' });

      expect(getLoadingEntry('wallet-connect')?.message).toBe('Connecting...');
      expect(getLoadingEntry('payment-authorize')?.message).toBe('Processing payment...');
    });
  });

  describe('withLoading helper', () => {
    it('should track loading state for async function', async () => {
      const { isLoading } = useLoadingStore.getState();

      let resolvePromise: () => void;
      const asyncFn = withLoading(
        'test-operation',
        () =>
          new Promise<string>((resolve) => {
            resolvePromise = () => resolve('done');
          })
      );

      const promise = asyncFn();
      expect(isLoading('test-operation')).toBe(true);

      resolvePromise!();
      await promise;
      expect(isLoading('test-operation')).toBe(false);
    });

    it('should stop loading on success', async () => {
      const { isLoading } = useLoadingStore.getState();

      const asyncFn = withLoading('test-operation', async () => 'success');

      await asyncFn();
      expect(isLoading('test-operation')).toBe(false);

      const state = useLoadingStore.getState();
      expect(state.history[0].success).toBe(true);
    });

    it('should stop loading on error', async () => {
      const { isLoading } = useLoadingStore.getState();

      const asyncFn = withLoading('test-operation', async () => {
        throw new Error('Test error');
      });

      await expect(asyncFn()).rejects.toThrow('Test error');
      expect(isLoading('test-operation')).toBe(false);

      const state = useLoadingStore.getState();
      expect(state.history[0].success).toBe(false);
    });

    it('should pass through function arguments', async () => {
      const asyncFn = withLoading('test-operation', async (a: number, b: number) => a + b);

      const result = await asyncFn(2, 3);
      expect(result).toBe(5);
    });

    it('should apply loading options', async () => {
      const { getLoadingEntry } = useLoadingStore.getState();

      let resolvePromise: () => void;
      const asyncFn = withLoading(
        'test-operation',
        () =>
          new Promise<void>((resolve) => {
            resolvePromise = resolve;
          }),
        { message: 'Test message', category: 'data' }
      );

      const promise = asyncFn();

      const entry = getLoadingEntry('test-operation');
      expect(entry?.message).toBe('Test message');
      expect(entry?.category).toBe('data');

      resolvePromise!();
      await promise;
    });
  });
});
