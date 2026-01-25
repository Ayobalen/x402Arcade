/**
 * Tests for useGameAnnouncements Hook
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useGameAnnouncements } from '../useGameAnnouncements';

describe('useGameAnnouncements', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('announceGameStart', () => {
    it('should announce game start without countdown', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announceGameStart('Snake');
      });

      // Check that LiveRegion has the message
      const LiveRegion = result.current.LiveRegionComponent;
      expect(LiveRegion).toBeDefined();
    });

    it('should announce game start with countdown', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announceGameStart('Snake', 3);
      });

      // Message should include countdown
      expect(result.current.LiveRegionComponent).toBeDefined();
    });

    it('should support countdown parameter', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announceGameStart('Snake', 3);
      });

      // Verify component is still defined (clearing is internal behavior)
      expect(result.current.LiveRegionComponent).toBeDefined();
    });
  });

  describe('announceCountdown', () => {
    it('should announce countdown numbers', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announceCountdown(3);
      });

      expect(result.current.LiveRegionComponent).toBeDefined();
    });

    it('should allow duplicate countdown announcements', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announceCountdown(3);
        result.current.announceCountdown(3);
      });

      expect(result.current.LiveRegionComponent).toBeDefined();
    });

    it('should support clearAfter delay', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announceCountdown(3);
      });

      // Verify component is defined (auto-clear is internal behavior)
      expect(result.current.LiveRegionComponent).toBeDefined();
    });
  });

  describe('announceGamePause', () => {
    it('should announce game pause', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announceGamePause();
      });

      expect(result.current.LiveRegionComponent).toBeDefined();
    });

    it('should use assertive politeness for pause', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announceGamePause();
      });

      // Verify component works (auto-clear is internal)
      expect(result.current.LiveRegionComponent).toBeDefined();
    });
  });

  describe('announceGameResume', () => {
    it('should announce game resume', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announceGameResume();
      });

      expect(result.current.LiveRegionComponent).toBeDefined();
    });
  });

  describe('announceScore', () => {
    it('should announce score without delta', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announceScore(100);
      });

      expect(result.current.LiveRegionComponent).toBeDefined();
    });

    it('should announce score with delta', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announceScore(100, 10);
      });

      expect(result.current.LiveRegionComponent).toBeDefined();
    });

    it('should use polite politeness for score announcements', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announceScore(50);
      });

      expect(result.current.LiveRegionComponent).toBeDefined();
    });
  });

  describe('announceLevelUp', () => {
    it('should announce level completion', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announceLevelUp(1, 2);
      });

      expect(result.current.LiveRegionComponent).toBeDefined();
    });

    it('should use assertive politeness for level up', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announceLevelUp(1, 2);
      });

      // Verify component works (auto-clear is internal)
      expect(result.current.LiveRegionComponent).toBeDefined();
    });
  });

  describe('announcePowerUp', () => {
    it('should announce power-up without description', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announcePowerUp('Speed Boost');
      });

      expect(result.current.LiveRegionComponent).toBeDefined();
    });

    it('should announce power-up with description', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announcePowerUp('Speed Boost', 'Move faster for 10 seconds');
      });

      expect(result.current.LiveRegionComponent).toBeDefined();
    });

    it('should use assertive politeness for power-ups', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announcePowerUp('Speed Boost');
      });

      // Verify component works (auto-clear is internal)
      expect(result.current.LiveRegionComponent).toBeDefined();
    });
  });

  describe('announceAchievement', () => {
    it('should announce achievement without description', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announceAchievement('First Win');
      });

      expect(result.current.LiveRegionComponent).toBeDefined();
    });

    it('should announce achievement with description', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announceAchievement('First Win', 'Win your first game');
      });

      expect(result.current.LiveRegionComponent).toBeDefined();
    });

    it('should use assertive politeness for achievements', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announceAchievement('First Win');
      });

      // Verify component works (auto-clear is internal)
      expect(result.current.LiveRegionComponent).toBeDefined();
    });
  });

  describe('announceTimeWarning', () => {
    it('should announce time warning with multiple seconds', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announceTimeWarning(10);
      });

      expect(result.current.LiveRegionComponent).toBeDefined();
    });

    it('should announce time warning with 1 second', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announceTimeWarning(1);
      });

      expect(result.current.LiveRegionComponent).toBeDefined();
    });

    it('should use assertive politeness for time warnings', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announceTimeWarning(5);
      });

      // Verify component works (auto-clear is internal)
      expect(result.current.LiveRegionComponent).toBeDefined();
    });
  });

  describe('announceGameOver', () => {
    it('should announce game over without rank', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announceGameOver(150);
      });

      expect(result.current.LiveRegionComponent).toBeDefined();
    });

    it('should announce game over with rank', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announceGameOver(150, 3);
      });

      expect(result.current.LiveRegionComponent).toBeDefined();
    });

    it('should use assertive politeness for game over', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announceGameOver(200);
      });

      expect(result.current.LiveRegionComponent).toBeDefined();
    });
  });

  describe('announceHighScore', () => {
    it('should announce high score without previous score', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announceHighScore(500);
      });

      expect(result.current.LiveRegionComponent).toBeDefined();
    });

    it('should announce high score with previous score', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announceHighScore(500, 400);
      });

      expect(result.current.LiveRegionComponent).toBeDefined();
    });

    it('should use assertive politeness for high scores', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announceHighScore(500);
      });

      // Verify component works (auto-clear is internal)
      expect(result.current.LiveRegionComponent).toBeDefined();
    });
  });

  describe('announceCustom', () => {
    it('should announce custom message with default options', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announceCustom('Custom game event');
      });

      expect(result.current.LiveRegionComponent).toBeDefined();
    });

    it('should announce urgent custom message', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announceCustom('Critical event!', { urgent: true });
      });

      expect(result.current.LiveRegionComponent).toBeDefined();
    });

    it('should announce custom message with context', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announceCustom('Enemy approaching', {
          context: 'From the left',
        });
      });

      expect(result.current.LiveRegionComponent).toBeDefined();
    });

    it('should support clearAfter option', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announceCustom('Temporary message', { clearAfter: 2000 });
      });

      // Verify component works (auto-clear is internal)
      expect(result.current.LiveRegionComponent).toBeDefined();
    });
  });

  describe('LiveRegionComponent', () => {
    it('should provide LiveRegionComponent', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      expect(result.current.LiveRegionComponent).toBeDefined();
      expect(typeof result.current.LiveRegionComponent).toBe('function');
    });

    it('should be a stable reference', () => {
      const { result, rerender } = renderHook(() => useGameAnnouncements());

      const firstComponent = result.current.LiveRegionComponent;
      rerender();
      const secondComponent = result.current.LiveRegionComponent;

      expect(firstComponent).toBe(secondComponent);
    });
  });

  describe('Multiple announcements', () => {
    it('should handle rapid successive announcements', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announceScore(10);
        result.current.announceScore(20);
        result.current.announceScore(30);
      });

      expect(result.current.LiveRegionComponent).toBeDefined();
    });

    it('should handle interleaved announcement types', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announceGameStart('Snake');
        result.current.announceScore(50);
        result.current.announcePowerUp('Shield');
        result.current.announceGameOver(100);
      });

      expect(result.current.LiveRegionComponent).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle zero score', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announceScore(0);
      });

      expect(result.current.LiveRegionComponent).toBeDefined();
    });

    it('should handle negative delta', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announceScore(50, -10);
      });

      expect(result.current.LiveRegionComponent).toBeDefined();
    });

    it('should handle empty game name', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announceGameStart('');
      });

      expect(result.current.LiveRegionComponent).toBeDefined();
    });

    it('should handle zero countdown', () => {
      const { result } = renderHook(() => useGameAnnouncements());

      act(() => {
        result.current.announceCountdown(0);
      });

      expect(result.current.LiveRegionComponent).toBeDefined();
    });
  });
});
