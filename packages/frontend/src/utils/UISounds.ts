/**
 * UISounds - Pre-configured UI sound effects for the application
 *
 * Features:
 * - Button click sounds (primary, secondary, danger)
 * - Menu navigation sounds (hover, select)
 * - Notification/alert sounds (success, error, warning, info)
 * - Modal sounds (open, close)
 * - Toggle sounds (on, off)
 * - Tab/navigation sounds
 *
 * All sounds are managed through SFXEngine with UI category and low priority.
 *
 * @module UISounds
 */

import SFXEngine, { type SoundAsset, SoundPriority } from './SFXEngine';
import { AudioCategory } from './AudioManager';

/**
 * UI sound types
 */
export enum UISoundType {
  // Button clicks
  BUTTON_CLICK = 'ui:button:click',
  BUTTON_CLICK_PRIMARY = 'ui:button:click:primary',
  BUTTON_CLICK_SECONDARY = 'ui:button:click:secondary',
  BUTTON_CLICK_DANGER = 'ui:button:click:danger',

  // Menu navigation
  MENU_HOVER = 'ui:menu:hover',
  MENU_SELECT = 'ui:menu:select',
  MENU_OPEN = 'ui:menu:open',
  MENU_CLOSE = 'ui:menu:close',

  // Notifications
  NOTIFICATION_SUCCESS = 'ui:notification:success',
  NOTIFICATION_ERROR = 'ui:notification:error',
  NOTIFICATION_WARNING = 'ui:notification:warning',
  NOTIFICATION_INFO = 'ui:notification:info',

  // Modals
  MODAL_OPEN = 'ui:modal:open',
  MODAL_CLOSE = 'ui:modal:close',

  // Toggles
  TOGGLE_ON = 'ui:toggle:on',
  TOGGLE_OFF = 'ui:toggle:off',

  // Tabs/Navigation
  TAB_SWITCH = 'ui:tab:switch',
  PAGE_CHANGE = 'ui:page:change',

  // Misc
  CHECKBOX_CHECK = 'ui:checkbox:check',
  CHECKBOX_UNCHECK = 'ui:checkbox:uncheck',
  DROPDOWN_OPEN = 'ui:dropdown:open',
  DROPDOWN_CLOSE = 'ui:dropdown:close',
}

/**
 * UI sound asset definitions
 *
 * Note: These paths should point to actual audio files in the public directory.
 * For development, you can:
 * 1. Use placeholder sounds from a free sound library (e.g., freesound.org)
 * 2. Generate sounds using a sound generator (e.g., jsfxr.frozenfractal.com)
 * 3. Use royalty-free sound packs
 *
 * Recommended format: .mp3 or .ogg for cross-browser compatibility
 * Recommended size: < 50KB per sound
 */
const UI_SOUND_ASSETS: SoundAsset[] = [
  // Button clicks
  {
    id: UISoundType.BUTTON_CLICK,
    category: AudioCategory.UI,
    src: '/sounds/ui/button-click.mp3',
    volume: 0.5,
    priority: SoundPriority.LOW,
    maxInstances: 3,
    preload: true,
  },
  {
    id: UISoundType.BUTTON_CLICK_PRIMARY,
    category: AudioCategory.UI,
    src: '/sounds/ui/button-click-primary.mp3',
    volume: 0.6,
    priority: SoundPriority.LOW,
    maxInstances: 3,
    preload: true,
  },
  {
    id: UISoundType.BUTTON_CLICK_SECONDARY,
    category: AudioCategory.UI,
    src: '/sounds/ui/button-click-secondary.mp3',
    volume: 0.4,
    priority: SoundPriority.LOW,
    maxInstances: 3,
    preload: true,
  },
  {
    id: UISoundType.BUTTON_CLICK_DANGER,
    category: AudioCategory.UI,
    src: '/sounds/ui/button-click-danger.mp3',
    volume: 0.6,
    priority: SoundPriority.LOW,
    maxInstances: 2,
    preload: true,
  },

  // Menu navigation
  {
    id: UISoundType.MENU_HOVER,
    category: AudioCategory.UI,
    src: '/sounds/ui/menu-hover.mp3',
    volume: 0.3,
    priority: SoundPriority.LOW,
    maxInstances: 5,
    preload: true,
  },
  {
    id: UISoundType.MENU_SELECT,
    category: AudioCategory.UI,
    src: '/sounds/ui/menu-select.mp3',
    volume: 0.5,
    priority: SoundPriority.LOW,
    maxInstances: 3,
    preload: true,
  },
  {
    id: UISoundType.MENU_OPEN,
    category: AudioCategory.UI,
    src: '/sounds/ui/menu-open.mp3',
    volume: 0.5,
    priority: SoundPriority.LOW,
    maxInstances: 2,
    preload: true,
  },
  {
    id: UISoundType.MENU_CLOSE,
    category: AudioCategory.UI,
    src: '/sounds/ui/menu-close.mp3',
    volume: 0.5,
    priority: SoundPriority.LOW,
    maxInstances: 2,
    preload: true,
  },

  // Notifications
  {
    id: UISoundType.NOTIFICATION_SUCCESS,
    category: AudioCategory.UI,
    src: '/sounds/ui/notification-success.mp3',
    volume: 0.6,
    priority: SoundPriority.NORMAL,
    maxInstances: 2,
    preload: true,
  },
  {
    id: UISoundType.NOTIFICATION_ERROR,
    category: AudioCategory.UI,
    src: '/sounds/ui/notification-error.mp3',
    volume: 0.7,
    priority: SoundPriority.NORMAL,
    maxInstances: 2,
    preload: true,
  },
  {
    id: UISoundType.NOTIFICATION_WARNING,
    category: AudioCategory.UI,
    src: '/sounds/ui/notification-warning.mp3',
    volume: 0.6,
    priority: SoundPriority.NORMAL,
    maxInstances: 2,
    preload: true,
  },
  {
    id: UISoundType.NOTIFICATION_INFO,
    category: AudioCategory.UI,
    src: '/sounds/ui/notification-info.mp3',
    volume: 0.5,
    priority: SoundPriority.NORMAL,
    maxInstances: 2,
    preload: true,
  },

  // Modals
  {
    id: UISoundType.MODAL_OPEN,
    category: AudioCategory.UI,
    src: '/sounds/ui/modal-open.mp3',
    volume: 0.5,
    priority: SoundPriority.LOW,
    maxInstances: 2,
    preload: true,
  },
  {
    id: UISoundType.MODAL_CLOSE,
    category: AudioCategory.UI,
    src: '/sounds/ui/modal-close.mp3',
    volume: 0.5,
    priority: SoundPriority.LOW,
    maxInstances: 2,
    preload: true,
  },

  // Toggles
  {
    id: UISoundType.TOGGLE_ON,
    category: AudioCategory.UI,
    src: '/sounds/ui/toggle-on.mp3',
    volume: 0.4,
    priority: SoundPriority.LOW,
    maxInstances: 3,
    preload: true,
  },
  {
    id: UISoundType.TOGGLE_OFF,
    category: AudioCategory.UI,
    src: '/sounds/ui/toggle-off.mp3',
    volume: 0.4,
    priority: SoundPriority.LOW,
    maxInstances: 3,
    preload: true,
  },

  // Tabs/Navigation
  {
    id: UISoundType.TAB_SWITCH,
    category: AudioCategory.UI,
    src: '/sounds/ui/tab-switch.mp3',
    volume: 0.4,
    priority: SoundPriority.LOW,
    maxInstances: 2,
    preload: true,
  },
  {
    id: UISoundType.PAGE_CHANGE,
    category: AudioCategory.UI,
    src: '/sounds/ui/page-change.mp3',
    volume: 0.5,
    priority: SoundPriority.LOW,
    maxInstances: 2,
    preload: true,
  },

  // Misc
  {
    id: UISoundType.CHECKBOX_CHECK,
    category: AudioCategory.UI,
    src: '/sounds/ui/checkbox-check.mp3',
    volume: 0.4,
    priority: SoundPriority.LOW,
    maxInstances: 3,
    preload: true,
  },
  {
    id: UISoundType.CHECKBOX_UNCHECK,
    category: AudioCategory.UI,
    src: '/sounds/ui/checkbox-uncheck.mp3',
    volume: 0.4,
    priority: SoundPriority.LOW,
    maxInstances: 3,
    preload: true,
  },
  {
    id: UISoundType.DROPDOWN_OPEN,
    category: AudioCategory.UI,
    src: '/sounds/ui/dropdown-open.mp3',
    volume: 0.4,
    priority: SoundPriority.LOW,
    maxInstances: 2,
    preload: true,
  },
  {
    id: UISoundType.DROPDOWN_CLOSE,
    category: AudioCategory.UI,
    src: '/sounds/ui/dropdown-close.mp3',
    volume: 0.4,
    priority: SoundPriority.LOW,
    maxInstances: 2,
    preload: true,
  },
];

/**
 * UISounds Manager
 *
 * Singleton wrapper around SFXEngine specifically for UI sounds.
 * Provides easy access to common UI sound effects.
 */
class UISounds {
  private static instance: UISounds | null = null;
  private sfxEngine: SFXEngine;
  private isInitialized = false;

  private constructor() {
    this.sfxEngine = SFXEngine.getInstance();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): UISounds {
    if (!UISounds.instance) {
      UISounds.instance = new UISounds();
    }
    return UISounds.instance;
  }

  /**
   * Initialize UI sounds
   *
   * Loads all UI sound assets into SFXEngine.
   * This should be called once during app initialization.
   *
   * @returns Promise that resolves when all sounds are loaded
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Add all UI sound assets to SFXEngine
    UI_SOUND_ASSETS.forEach((asset) => {
      this.sfxEngine.addSound(asset);
    });

    // Preload all UI sounds (they're small and frequently used)
    await this.preloadAll();

    this.isInitialized = true;
  }

  /**
   * Preload all UI sounds
   */
  private async preloadAll(): Promise<void> {
    const soundIds = UI_SOUND_ASSETS.map((asset) => asset.id);
    await this.sfxEngine.preload(soundIds);
  }

  /**
   * Play a UI sound
   *
   * @param type - UI sound type to play
   * @param volume - Volume override (0.0 - 1.0)
   * @returns Sound ID that's playing, or null if not played
   */
  public play(type: UISoundType, volume?: number): number | null {
    if (!this.isInitialized) {
      // eslint-disable-next-line no-console
      console.warn('UISounds not initialized. Call initialize() first.');
      return null;
    }

    return this.sfxEngine.play({
      id: type,
      volume,
      priority: SoundPriority.LOW,
    });
  }

  /**
   * Stop a specific UI sound
   */
  public stop(soundId: number): void {
    this.sfxEngine.stop(soundId);
  }

  /**
   * Stop all UI sounds
   */
  public stopAll(): void {
    this.sfxEngine.stopAll();
  }

  /**
   * Check if initialized
   */
  public get initialized(): boolean {
    return this.isInitialized;
  }

  // Convenience methods for common sounds

  public clickButton(variant: 'primary' | 'secondary' | 'danger' = 'primary'): void {
    const soundMap = {
      primary: UISoundType.BUTTON_CLICK_PRIMARY,
      secondary: UISoundType.BUTTON_CLICK_SECONDARY,
      danger: UISoundType.BUTTON_CLICK_DANGER,
    };
    this.play(soundMap[variant]);
  }

  public hoverMenu(): void {
    this.play(UISoundType.MENU_HOVER);
  }

  public selectMenu(): void {
    this.play(UISoundType.MENU_SELECT);
  }

  public openMenu(): void {
    this.play(UISoundType.MENU_OPEN);
  }

  public closeMenu(): void {
    this.play(UISoundType.MENU_CLOSE);
  }

  public notify(type: 'success' | 'error' | 'warning' | 'info'): void {
    const soundMap = {
      success: UISoundType.NOTIFICATION_SUCCESS,
      error: UISoundType.NOTIFICATION_ERROR,
      warning: UISoundType.NOTIFICATION_WARNING,
      info: UISoundType.NOTIFICATION_INFO,
    };
    this.play(soundMap[type]);
  }

  public openModal(): void {
    this.play(UISoundType.MODAL_OPEN);
  }

  public closeModal(): void {
    this.play(UISoundType.MODAL_CLOSE);
  }

  public toggle(on: boolean): void {
    this.play(on ? UISoundType.TOGGLE_ON : UISoundType.TOGGLE_OFF);
  }

  public switchTab(): void {
    this.play(UISoundType.TAB_SWITCH);
  }

  public changePage(): void {
    this.play(UISoundType.PAGE_CHANGE);
  }

  public checkCheckbox(checked: boolean): void {
    this.play(checked ? UISoundType.CHECKBOX_CHECK : UISoundType.CHECKBOX_UNCHECK);
  }

  public openDropdown(): void {
    this.play(UISoundType.DROPDOWN_OPEN);
  }

  public closeDropdown(): void {
    this.play(UISoundType.DROPDOWN_CLOSE);
  }
}

export default UISounds;
