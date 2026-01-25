/**
 * useLiveAnnouncer Hook Tests
 *
 * Tests for live region announcement hook functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLiveAnnouncer } from '../useLiveAnnouncer';

describe('useLiveAnnouncer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize with empty message', () => {
      const { result } = renderHook(() => useLiveAnnouncer());

      expect(result.current.message).toBe('');
    });

    it('should initialize with polite politeness', () => {
      const { result } = renderHook(() => useLiveAnnouncer());

      expect(result.current.politeness).toBe('polite');
    });

    it('should provide announce function', () => {
      const { result } = renderHook(() => useLiveAnnouncer());

      expect(typeof result.current.announce).toBe('function');
    });

    it('should provide clear function', () => {
      const { result } = renderHook(() => useLiveAnnouncer());

      expect(typeof result.current.clear).toBe('function');
    });

    it('should provide LiveRegionComponent', () => {
      const { result } = renderHook(() => useLiveAnnouncer());

      expect(typeof result.current.LiveRegionComponent).toBe('function');
    });
  });

  describe('announce()', () => {
    it('should announce a message', () => {
      const { result } = renderHook(() => useLiveAnnouncer());

      act(() => {
        result.current.announce('Test announcement');
      });

      expect(result.current.message).toBe('Test announcement');
    });

    it('should use polite politeness by default', () => {
      const { result } = renderHook(() => useLiveAnnouncer());

      act(() => {
        result.current.announce('Test');
      });

      expect(result.current.politeness).toBe('polite');
    });

    it('should support assertive politeness as string', () => {
      const { result } = renderHook(() => useLiveAnnouncer());

      act(() => {
        result.current.announce('Urgent!', 'assertive');
      });

      expect(result.current.politeness).toBe('assertive');
      expect(result.current.message).toBe('Urgent!');
    });

    it('should support off politeness as string', () => {
      const { result } = renderHook(() => useLiveAnnouncer());

      act(() => {
        result.current.announce('Silent', 'off');
      });

      expect(result.current.politeness).toBe('off');
      expect(result.current.message).toBe('Silent');
    });

    it('should support politeness in options object', () => {
      const { result } = renderHook(() => useLiveAnnouncer());

      act(() => {
        result.current.announce('Test', { politeness: 'assertive' });
      });

      expect(result.current.politeness).toBe('assertive');
    });

    it('should replace previous announcement', () => {
      const { result } = renderHook(() => useLiveAnnouncer());

      act(() => {
        result.current.announce('First message');
      });

      expect(result.current.message).toBe('First message');

      act(() => {
        result.current.announce('Second message');
      });

      expect(result.current.message).toBe('Second message');
    });
  });

  describe('clear()', () => {
    it('should clear the current announcement', () => {
      const { result } = renderHook(() => useLiveAnnouncer());

      act(() => {
        result.current.announce('Test message');
      });

      expect(result.current.message).toBe('Test message');

      act(() => {
        result.current.clear();
      });

      expect(result.current.message).toBe('');
    });

    it('should allow announcing again after clear', () => {
      const { result } = renderHook(() => useLiveAnnouncer());

      act(() => {
        result.current.announce('First');
        result.current.clear();
        result.current.announce('Second');
      });

      expect(result.current.message).toBe('Second');
    });
  });

  describe('Auto-clear', () => {
    it('should auto-clear after specified delay', () => {
      const { result } = renderHook(() => useLiveAnnouncer());

      act(() => {
        result.current.announce('Temporary message', { clearAfter: 1000 });
      });

      expect(result.current.message).toBe('Temporary message');

      // Fast-forward 500ms - message should still be there
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.message).toBe('Temporary message');

      // Fast-forward another 500ms - message should be cleared
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.message).toBe('');
    });

    it('should cancel previous auto-clear when new announcement is made', () => {
      const { result } = renderHook(() => useLiveAnnouncer());

      act(() => {
        result.current.announce('First', { clearAfter: 1000 });
      });

      // Before timeout, announce again
      act(() => {
        vi.advanceTimersByTime(500);
        result.current.announce('Second', { clearAfter: 2000 });
      });

      // First timeout should have been canceled
      act(() => {
        vi.advanceTimersByTime(600);
      });

      expect(result.current.message).toBe('Second');

      // Second timeout should clear
      act(() => {
        vi.advanceTimersByTime(1400);
      });

      expect(result.current.message).toBe('');
    });

    it('should not auto-clear if clearAfter is not specified', () => {
      const { result } = renderHook(() => useLiveAnnouncer());

      act(() => {
        result.current.announce('Persistent message');
      });

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(result.current.message).toBe('Persistent message');
    });

    it('should cancel auto-clear when manually cleared', () => {
      const { result } = renderHook(() => useLiveAnnouncer());

      act(() => {
        result.current.announce('Message', { clearAfter: 1000 });
      });

      act(() => {
        vi.advanceTimersByTime(500);
        result.current.clear();
      });

      expect(result.current.message).toBe('');

      // Timeout should have been canceled
      act(() => {
        vi.advanceTimersByTime(600);
      });

      // Should still be empty
      expect(result.current.message).toBe('');
    });
  });

  describe('Duplicate Messages', () => {
    it('should not announce duplicate messages by default', () => {
      const { result } = renderHook(() => useLiveAnnouncer());

      act(() => {
        result.current.announce('Same message');
      });

      const firstMessage = result.current.message;

      act(() => {
        result.current.announce('Same message');
      });

      // Message should remain the same (not re-announced)
      expect(result.current.message).toBe(firstMessage);
    });

    it('should announce duplicate messages when allowDuplicate is true', () => {
      const { result } = renderHook(() => useLiveAnnouncer());

      act(() => {
        result.current.announce('Same message');
        result.current.announce('Same message', { allowDuplicate: true });
      });

      expect(result.current.message).toBe('Same message');
    });

    it('should allow duplicate after clear', () => {
      const { result } = renderHook(() => useLiveAnnouncer());

      act(() => {
        result.current.announce('Message');
        result.current.clear();
        result.current.announce('Message');
      });

      expect(result.current.message).toBe('Message');
    });
  });

  describe('LiveRegionComponent', () => {
    it('should be a function component', () => {
      const { result } = renderHook(() => useLiveAnnouncer());

      expect(typeof result.current.LiveRegionComponent).toBe('function');
    });

    it('should be memoized and stable across renders', () => {
      const { result, rerender } = renderHook(() => useLiveAnnouncer());

      const firstComponent = result.current.LiveRegionComponent;

      // Message change should update component
      act(() => {
        result.current.announce('Test');
      });

      rerender();

      // Component reference should change when message changes
      expect(result.current.LiveRegionComponent).not.toBe(firstComponent);
    });
  });

  describe('Cleanup', () => {
    it('should clear timeout on unmount', () => {
      const { result, unmount } = renderHook(() => useLiveAnnouncer());

      act(() => {
        result.current.announce('Message', { clearAfter: 1000 });
      });

      unmount();

      // Advance timers after unmount
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // No errors should occur
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string announcement', () => {
      const { result } = renderHook(() => useLiveAnnouncer());

      act(() => {
        result.current.announce('');
      });

      expect(result.current.message).toBe('');
    });

    it('should handle rapid successive announcements', () => {
      const { result } = renderHook(() => useLiveAnnouncer());

      act(() => {
        result.current.announce('Message 1');
        result.current.announce('Message 2');
        result.current.announce('Message 3');
      });

      expect(result.current.message).toBe('Message 3');
    });

    it('should handle announcement with all options', () => {
      const { result } = renderHook(() => useLiveAnnouncer());

      act(() => {
        result.current.announce('Full options', {
          politeness: 'assertive',
          clearAfter: 2000,
          allowDuplicate: true,
        });
      });

      expect(result.current.message).toBe('Full options');
      expect(result.current.politeness).toBe('assertive');

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.message).toBe('');
    });

    it('should handle clearAfter of 0 (no auto-clear)', () => {
      const { result } = renderHook(() => useLiveAnnouncer());

      act(() => {
        result.current.announce('Message', { clearAfter: 0 });
      });

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(result.current.message).toBe('Message');
    });

    it('should handle negative clearAfter (no auto-clear)', () => {
      const { result } = renderHook(() => useLiveAnnouncer());

      act(() => {
        result.current.announce('Message', { clearAfter: -100 });
      });

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(result.current.message).toBe('Message');
    });
  });
});
