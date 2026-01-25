/**
 * UISounds Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import UISounds, { UISoundType } from '../UISounds';
import SFXEngine from '../SFXEngine';

// Mock SFXEngine
vi.mock('../SFXEngine', () => {
  const mockEngine = {
    addSound: vi.fn(),
    preload: vi.fn().mockResolvedValue(undefined),
    play: vi.fn().mockReturnValue(1),
    stop: vi.fn(),
    stopAll: vi.fn(),
  };

  return {
    default: {
      getInstance: vi.fn(() => mockEngine),
    },
  };
});

describe('UISounds', () => {
  let uiSounds: UISounds;
  let mockSFXEngine: ReturnType<typeof SFXEngine.getInstance>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset singleton
    // @ts-expect-error - accessing private static property for testing
    UISounds.instance = null;
    uiSounds = UISounds.getInstance();
    mockSFXEngine = SFXEngine.getInstance();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = UISounds.getInstance();
      const instance2 = UISounds.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize()', () => {
    it('should add all UI sound assets to SFXEngine', async () => {
      await uiSounds.initialize();
      expect(mockSFXEngine.addSound).toHaveBeenCalled();
      // Should add multiple sounds
      expect(mockSFXEngine.addSound).toHaveBeenCalledTimes(24); // 24 UI sounds defined
    });

    it('should preload all UI sounds', async () => {
      await uiSounds.initialize();
      expect(mockSFXEngine.preload).toHaveBeenCalledWith(
        expect.arrayContaining([
          UISoundType.BUTTON_CLICK,
          UISoundType.MENU_HOVER,
          UISoundType.NOTIFICATION_SUCCESS,
        ])
      );
    });

    it('should set initialized flag', async () => {
      expect(uiSounds.initialized).toBe(false);
      await uiSounds.initialize();
      expect(uiSounds.initialized).toBe(true);
    });

    it('should not initialize twice', async () => {
      await uiSounds.initialize();
      await uiSounds.initialize();
      // Should only call addSound once per sound (24 sounds total)
      expect(mockSFXEngine.addSound).toHaveBeenCalledTimes(24);
    });
  });

  describe('play()', () => {
    beforeEach(async () => {
      await uiSounds.initialize();
      vi.clearAllMocks();
    });

    it('should play a UI sound', () => {
      const soundId = uiSounds.play(UISoundType.BUTTON_CLICK);
      expect(mockSFXEngine.play).toHaveBeenCalledWith({
        id: UISoundType.BUTTON_CLICK,
        volume: undefined,
        priority: 0, // LOW priority
      });
      expect(soundId).toBe(1);
    });

    it('should play with custom volume', () => {
      uiSounds.play(UISoundType.MENU_HOVER, 0.5);
      expect(mockSFXEngine.play).toHaveBeenCalledWith({
        id: UISoundType.MENU_HOVER,
        volume: 0.5,
        priority: 0,
      });
    });

    it('should warn if not initialized', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      // Reset singleton
      // @ts-expect-error - accessing private static property for testing
      UISounds.instance = null;
      const newInstance = UISounds.getInstance();
      newInstance.play(UISoundType.BUTTON_CLICK);
      expect(consoleSpy).toHaveBeenCalledWith('UISounds not initialized. Call initialize() first.');
      consoleSpy.mockRestore();
    });
  });

  describe('stop()', () => {
    beforeEach(async () => {
      await uiSounds.initialize();
      vi.clearAllMocks();
    });

    it('should stop a specific sound', () => {
      uiSounds.stop(1);
      expect(mockSFXEngine.stop).toHaveBeenCalledWith(1);
    });
  });

  describe('stopAll()', () => {
    beforeEach(async () => {
      await uiSounds.initialize();
      vi.clearAllMocks();
    });

    it('should stop all sounds', () => {
      uiSounds.stopAll();
      expect(mockSFXEngine.stopAll).toHaveBeenCalled();
    });
  });

  describe('Convenience Methods', () => {
    beforeEach(async () => {
      await uiSounds.initialize();
      vi.clearAllMocks();
    });

    describe('clickButton()', () => {
      it('should play primary button click by default', () => {
        uiSounds.clickButton();
        expect(mockSFXEngine.play).toHaveBeenCalledWith(
          expect.objectContaining({
            id: UISoundType.BUTTON_CLICK_PRIMARY,
          })
        );
      });

      it('should play secondary button click', () => {
        uiSounds.clickButton('secondary');
        expect(mockSFXEngine.play).toHaveBeenCalledWith(
          expect.objectContaining({
            id: UISoundType.BUTTON_CLICK_SECONDARY,
          })
        );
      });

      it('should play danger button click', () => {
        uiSounds.clickButton('danger');
        expect(mockSFXEngine.play).toHaveBeenCalledWith(
          expect.objectContaining({
            id: UISoundType.BUTTON_CLICK_DANGER,
          })
        );
      });
    });

    describe('Menu sounds', () => {
      it('should play hover sound', () => {
        uiSounds.hoverMenu();
        expect(mockSFXEngine.play).toHaveBeenCalledWith(
          expect.objectContaining({
            id: UISoundType.MENU_HOVER,
          })
        );
      });

      it('should play select sound', () => {
        uiSounds.selectMenu();
        expect(mockSFXEngine.play).toHaveBeenCalledWith(
          expect.objectContaining({
            id: UISoundType.MENU_SELECT,
          })
        );
      });

      it('should play open sound', () => {
        uiSounds.openMenu();
        expect(mockSFXEngine.play).toHaveBeenCalledWith(
          expect.objectContaining({
            id: UISoundType.MENU_OPEN,
          })
        );
      });

      it('should play close sound', () => {
        uiSounds.closeMenu();
        expect(mockSFXEngine.play).toHaveBeenCalledWith(
          expect.objectContaining({
            id: UISoundType.MENU_CLOSE,
          })
        );
      });
    });

    describe('notify()', () => {
      it('should play success notification', () => {
        uiSounds.notify('success');
        expect(mockSFXEngine.play).toHaveBeenCalledWith(
          expect.objectContaining({
            id: UISoundType.NOTIFICATION_SUCCESS,
          })
        );
      });

      it('should play error notification', () => {
        uiSounds.notify('error');
        expect(mockSFXEngine.play).toHaveBeenCalledWith(
          expect.objectContaining({
            id: UISoundType.NOTIFICATION_ERROR,
          })
        );
      });

      it('should play warning notification', () => {
        uiSounds.notify('warning');
        expect(mockSFXEngine.play).toHaveBeenCalledWith(
          expect.objectContaining({
            id: UISoundType.NOTIFICATION_WARNING,
          })
        );
      });

      it('should play info notification', () => {
        uiSounds.notify('info');
        expect(mockSFXEngine.play).toHaveBeenCalledWith(
          expect.objectContaining({
            id: UISoundType.NOTIFICATION_INFO,
          })
        );
      });
    });

    describe('Modal sounds', () => {
      it('should play open modal sound', () => {
        uiSounds.openModal();
        expect(mockSFXEngine.play).toHaveBeenCalledWith(
          expect.objectContaining({
            id: UISoundType.MODAL_OPEN,
          })
        );
      });

      it('should play close modal sound', () => {
        uiSounds.closeModal();
        expect(mockSFXEngine.play).toHaveBeenCalledWith(
          expect.objectContaining({
            id: UISoundType.MODAL_CLOSE,
          })
        );
      });
    });

    describe('toggle()', () => {
      it('should play toggle on sound', () => {
        uiSounds.toggle(true);
        expect(mockSFXEngine.play).toHaveBeenCalledWith(
          expect.objectContaining({
            id: UISoundType.TOGGLE_ON,
          })
        );
      });

      it('should play toggle off sound', () => {
        uiSounds.toggle(false);
        expect(mockSFXEngine.play).toHaveBeenCalledWith(
          expect.objectContaining({
            id: UISoundType.TOGGLE_OFF,
          })
        );
      });
    });

    describe('Navigation sounds', () => {
      it('should play tab switch sound', () => {
        uiSounds.switchTab();
        expect(mockSFXEngine.play).toHaveBeenCalledWith(
          expect.objectContaining({
            id: UISoundType.TAB_SWITCH,
          })
        );
      });

      it('should play page change sound', () => {
        uiSounds.changePage();
        expect(mockSFXEngine.play).toHaveBeenCalledWith(
          expect.objectContaining({
            id: UISoundType.PAGE_CHANGE,
          })
        );
      });
    });

    describe('Checkbox sounds', () => {
      it('should play check sound', () => {
        uiSounds.checkCheckbox(true);
        expect(mockSFXEngine.play).toHaveBeenCalledWith(
          expect.objectContaining({
            id: UISoundType.CHECKBOX_CHECK,
          })
        );
      });

      it('should play uncheck sound', () => {
        uiSounds.checkCheckbox(false);
        expect(mockSFXEngine.play).toHaveBeenCalledWith(
          expect.objectContaining({
            id: UISoundType.CHECKBOX_UNCHECK,
          })
        );
      });
    });

    describe('Dropdown sounds', () => {
      it('should play open dropdown sound', () => {
        uiSounds.openDropdown();
        expect(mockSFXEngine.play).toHaveBeenCalledWith(
          expect.objectContaining({
            id: UISoundType.DROPDOWN_OPEN,
          })
        );
      });

      it('should play close dropdown sound', () => {
        uiSounds.closeDropdown();
        expect(mockSFXEngine.play).toHaveBeenCalledWith(
          expect.objectContaining({
            id: UISoundType.DROPDOWN_CLOSE,
          })
        );
      });
    });
  });
});
