/**
 * useUISoundEffects Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useUISoundEffects,
  useButtonSound,
  useMenuSound,
  useNotificationSound,
  useModalSound,
  useToggleSound,
} from '../useUISoundEffects';
import UISounds, { UISoundType } from '../../utils/UISounds';

// Mock UISounds
vi.mock('../../utils/UISounds', () => {
  const mockUISounds = {
    initialize: vi.fn().mockResolvedValue(undefined),
    play: vi.fn().mockReturnValue(1),
    stop: vi.fn(),
    stopAll: vi.fn(),
    clickButton: vi.fn(),
    hoverMenu: vi.fn(),
    selectMenu: vi.fn(),
    openMenu: vi.fn(),
    closeMenu: vi.fn(),
    notify: vi.fn(),
    openModal: vi.fn(),
    closeModal: vi.fn(),
    toggle: vi.fn(),
    switchTab: vi.fn(),
    changePage: vi.fn(),
    checkCheckbox: vi.fn(),
    openDropdown: vi.fn(),
    closeDropdown: vi.fn(),
    initialized: false,
  };

  return {
    default: {
      getInstance: vi.fn(() => mockUISounds),
    },
    UISoundType: {
      BUTTON_CLICK: 'ui:button:click',
      BUTTON_CLICK_PRIMARY: 'ui:button:click:primary',
      MENU_HOVER: 'ui:menu:hover',
    },
  };
});

describe('useUISoundEffects', () => {
  let mockUISounds: ReturnType<typeof UISounds.getInstance>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUISounds = UISounds.getInstance();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('useUISoundEffects hook', () => {
    it('should return initialized state', async () => {
      const { result } = renderHook(() => useUISoundEffects());

      // Initially not initialized
      expect(result.current.initialized).toBe(false);
      expect(result.current.initializing).toBe(true);

      // Wait for initialization
      await waitFor(() => {
        expect(mockUISounds.initialize).toHaveBeenCalled();
      });
    });

    it('should auto-initialize by default', async () => {
      renderHook(() => useUISoundEffects());

      await waitFor(() => {
        expect(mockUISounds.initialize).toHaveBeenCalled();
      });
    });

    it('should not auto-initialize when autoInit is false', async () => {
      renderHook(() => useUISounds({ autoInit: false }));

      // Wait a bit to ensure initialize is not called
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockUISounds.initialize).not.toHaveBeenCalled();
    });

    it('should provide play function', async () => {
      const { result } = renderHook(() => useUISoundEffects());

      await waitFor(() => {
        expect(mockUISounds.initialize).toHaveBeenCalled();
      });

      result.current.play(UISoundType.BUTTON_CLICK);
      expect(mockUISounds.play).toHaveBeenCalledWith(UISoundType.BUTTON_CLICK, undefined);
    });

    it('should provide play function with volume', async () => {
      const { result } = renderHook(() => useUISoundEffects());

      await waitFor(() => {
        expect(mockUISounds.initialize).toHaveBeenCalled();
      });

      result.current.play(UISoundType.BUTTON_CLICK, 0.5);
      expect(mockUISounds.play).toHaveBeenCalledWith(UISoundType.BUTTON_CLICK, 0.5);
    });

    it('should provide stop function', async () => {
      const { result } = renderHook(() => useUISoundEffects());

      await waitFor(() => {
        expect(mockUISounds.initialize).toHaveBeenCalled();
      });

      result.current.stop(1);
      expect(mockUISounds.stop).toHaveBeenCalledWith(1);
    });

    it('should provide stopAll function', async () => {
      const { result } = renderHook(() => useUISoundEffects());

      await waitFor(() => {
        expect(mockUISounds.initialize).toHaveBeenCalled();
      });

      result.current.stopAll();
      expect(mockUISounds.stopAll).toHaveBeenCalled();
    });

    describe('Convenience methods', () => {
      it('should provide clickButton method', async () => {
        const { result } = renderHook(() => useUISoundEffects());

        await waitFor(() => {
          expect(mockUISounds.initialize).toHaveBeenCalled();
        });

        result.current.sounds.clickButton('primary');
        expect(mockUISounds.clickButton).toHaveBeenCalledWith('primary');
      });

      it('should provide hoverMenu method', async () => {
        const { result } = renderHook(() => useUISoundEffects());

        await waitFor(() => {
          expect(mockUISounds.initialize).toHaveBeenCalled();
        });

        result.current.sounds.hoverMenu();
        expect(mockUISounds.hoverMenu).toHaveBeenCalled();
      });

      it('should provide selectMenu method', async () => {
        const { result } = renderHook(() => useUISoundEffects());

        await waitFor(() => {
          expect(mockUISounds.initialize).toHaveBeenCalled();
        });

        result.current.sounds.selectMenu();
        expect(mockUISounds.selectMenu).toHaveBeenCalled();
      });

      it('should provide notify method', async () => {
        const { result } = renderHook(() => useUISoundEffects());

        await waitFor(() => {
          expect(mockUISounds.initialize).toHaveBeenCalled();
        });

        result.current.sounds.notify('success');
        expect(mockUISounds.notify).toHaveBeenCalledWith('success');
      });

      it('should provide openModal method', async () => {
        const { result } = renderHook(() => useUISoundEffects());

        await waitFor(() => {
          expect(mockUISounds.initialize).toHaveBeenCalled();
        });

        result.current.sounds.openModal();
        expect(mockUISounds.openModal).toHaveBeenCalled();
      });

      it('should provide toggle method', async () => {
        const { result } = renderHook(() => useUISoundEffects());

        await waitFor(() => {
          expect(mockUISounds.initialize).toHaveBeenCalled();
        });

        result.current.sounds.toggle(true);
        expect(mockUISounds.toggle).toHaveBeenCalledWith(true);
      });
    });

    it('should handle initialization error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockUISounds.initialize = vi.fn().mockRejectedValue(new Error('Init failed'));

      const { result } = renderHook(() => useUISoundEffects());

      await waitFor(() => {
        expect(result.current.initializing).toBe(false);
        expect(result.current.initialized).toBe(false);
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to initialize UI sounds:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('useButtonSound hook', () => {
    it('should return callback that plays button click', async () => {
      const { result } = renderHook(() => useButtonSound('primary'));

      await waitFor(() => {
        expect(mockUISounds.initialize).toHaveBeenCalled();
      });

      result.current();
      expect(mockUISounds.clickButton).toHaveBeenCalledWith('primary');
    });

    it('should use primary variant by default', async () => {
      const { result } = renderHook(() => useButtonSound());

      await waitFor(() => {
        expect(mockUISounds.initialize).toHaveBeenCalled();
      });

      result.current();
      expect(mockUISounds.clickButton).toHaveBeenCalledWith('primary');
    });

    it('should support secondary variant', async () => {
      const { result } = renderHook(() => useButtonSound('secondary'));

      await waitFor(() => {
        expect(mockUISounds.initialize).toHaveBeenCalled();
      });

      result.current();
      expect(mockUISounds.clickButton).toHaveBeenCalledWith('secondary');
    });

    it('should support danger variant', async () => {
      const { result } = renderHook(() => useButtonSound('danger'));

      await waitFor(() => {
        expect(mockUISounds.initialize).toHaveBeenCalled();
      });

      result.current();
      expect(mockUISounds.clickButton).toHaveBeenCalledWith('danger');
    });
  });

  describe('useMenuSound hook', () => {
    it('should return menu sound callbacks', async () => {
      const { result } = renderHook(() => useMenuSound());

      await waitFor(() => {
        expect(mockUISounds.initialize).toHaveBeenCalled();
      });

      expect(result.current).toHaveProperty('onHover');
      expect(result.current).toHaveProperty('onSelect');
      expect(result.current).toHaveProperty('onOpen');
      expect(result.current).toHaveProperty('onClose');
    });

    it('should call hoverMenu on onHover', async () => {
      const { result } = renderHook(() => useMenuSound());

      await waitFor(() => {
        expect(mockUISounds.initialize).toHaveBeenCalled();
      });

      result.current.onHover();
      expect(mockUISounds.hoverMenu).toHaveBeenCalled();
    });

    it('should call selectMenu on onSelect', async () => {
      const { result } = renderHook(() => useMenuSound());

      await waitFor(() => {
        expect(mockUISounds.initialize).toHaveBeenCalled();
      });

      result.current.onSelect();
      expect(mockUISounds.selectMenu).toHaveBeenCalled();
    });

    it('should call openMenu on onOpen', async () => {
      const { result } = renderHook(() => useMenuSound());

      await waitFor(() => {
        expect(mockUISounds.initialize).toHaveBeenCalled();
      });

      result.current.onOpen();
      expect(mockUISounds.openMenu).toHaveBeenCalled();
    });

    it('should call closeMenu on onClose', async () => {
      const { result } = renderHook(() => useMenuSound());

      await waitFor(() => {
        expect(mockUISounds.initialize).toHaveBeenCalled();
      });

      result.current.onClose();
      expect(mockUISounds.closeMenu).toHaveBeenCalled();
    });
  });

  describe('useNotificationSound hook', () => {
    it('should return callback to play notification sounds', async () => {
      const { result } = renderHook(() => useNotificationSound());

      await waitFor(() => {
        expect(mockUISounds.initialize).toHaveBeenCalled();
      });

      result.current('success');
      expect(mockUISounds.notify).toHaveBeenCalledWith('success');
    });

    it('should support all notification types', async () => {
      const { result } = renderHook(() => useNotificationSound());

      await waitFor(() => {
        expect(mockUISounds.initialize).toHaveBeenCalled();
      });

      result.current('success');
      result.current('error');
      result.current('warning');
      result.current('info');

      expect(mockUISounds.notify).toHaveBeenCalledWith('success');
      expect(mockUISounds.notify).toHaveBeenCalledWith('error');
      expect(mockUISounds.notify).toHaveBeenCalledWith('warning');
      expect(mockUISounds.notify).toHaveBeenCalledWith('info');
    });
  });

  describe('useModalSound hook', () => {
    it('should return modal sound callbacks', async () => {
      const { result } = renderHook(() => useModalSound());

      await waitFor(() => {
        expect(mockUISounds.initialize).toHaveBeenCalled();
      });

      expect(result.current).toHaveProperty('onOpen');
      expect(result.current).toHaveProperty('onClose');
    });

    it('should call openModal on onOpen', async () => {
      const { result } = renderHook(() => useModalSound());

      await waitFor(() => {
        expect(mockUISounds.initialize).toHaveBeenCalled();
      });

      result.current.onOpen();
      expect(mockUISounds.openModal).toHaveBeenCalled();
    });

    it('should call closeModal on onClose', async () => {
      const { result } = renderHook(() => useModalSound());

      await waitFor(() => {
        expect(mockUISounds.initialize).toHaveBeenCalled();
      });

      result.current.onClose();
      expect(mockUISounds.closeModal).toHaveBeenCalled();
    });
  });

  describe('useToggleSound hook', () => {
    it('should return callback to play toggle sounds', async () => {
      const { result } = renderHook(() => useToggleSound());

      await waitFor(() => {
        expect(mockUISounds.initialize).toHaveBeenCalled();
      });

      result.current(true);
      expect(mockUISounds.toggle).toHaveBeenCalledWith(true);
    });

    it('should support toggle on', async () => {
      const { result } = renderHook(() => useToggleSound());

      await waitFor(() => {
        expect(mockUISounds.initialize).toHaveBeenCalled();
      });

      result.current(true);
      expect(mockUISounds.toggle).toHaveBeenCalledWith(true);
    });

    it('should support toggle off', async () => {
      const { result } = renderHook(() => useToggleSound());

      await waitFor(() => {
        expect(mockUISounds.initialize).toHaveBeenCalled();
      });

      result.current(false);
      expect(mockUISounds.toggle).toHaveBeenCalledWith(false);
    });
  });
});
