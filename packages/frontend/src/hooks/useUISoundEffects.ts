/**
 * useUISoundEffects - React hook for pre-configured UI sound effects
 *
 * Provides easy access to pre-configured UI sounds (button clicks, menus, notifications, etc.)
 * with automatic initialization. This is different from the generic useUISounds hook
 * which allows custom sound loading.
 *
 * @module useUISoundEffects
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import UISounds, { type UISoundType } from '../utils/UISounds';

/**
 * UI sound effects hook result
 */
export interface UseUISoundEffectsResult {
  /** Whether UI sounds are initialized */
  initialized: boolean;
  /** Whether UI sounds are initializing */
  initializing: boolean;
  /** Play a specific UI sound */
  play: (type: UISoundType, volume?: number) => void;
  /** Stop a specific sound */
  stop: (soundId: number) => void;
  /** Stop all UI sounds */
  stopAll: () => void;
  /** Convenience methods */
  sounds: {
    clickButton: (variant?: 'primary' | 'secondary' | 'danger') => void;
    hoverMenu: () => void;
    selectMenu: () => void;
    openMenu: () => void;
    closeMenu: () => void;
    notify: (type: 'success' | 'error' | 'warning' | 'info') => void;
    openModal: () => void;
    closeModal: () => void;
    toggle: (on: boolean) => void;
    switchTab: () => void;
    changePage: () => void;
    checkCheckbox: (checked: boolean) => void;
    openDropdown: () => void;
    closeDropdown: () => void;
  };
}

/**
 * Hook options
 */
export interface UseUISoundEffectsOptions {
  /** Auto-initialize on mount (default: true) */
  autoInit?: boolean;
}

/**
 * useUISoundEffects hook
 *
 * Provides access to pre-configured UI sound effects with automatic initialization.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { sounds, initialized } = useUISoundEffects();
 *
 *   const handleClick = () => {
 *     sounds.clickButton('primary');
 *     // ... rest of click logic
 *   };
 *
 *   return (
 *     <button onClick={handleClick}>
 *       Click me
 *     </button>
 *   );
 * }
 * ```
 *
 * @param options - Hook options
 * @returns UI sound effects interface
 */
export function useUISoundEffects(options: UseUISoundEffectsOptions = {}): UseUISoundEffectsResult {
  const { autoInit = true } = options;

  const [initialized, setInitialized] = useState(false);
  const [initializing, setInitializing] = useState(false);

  const uiSounds = useMemo(() => UISounds.getInstance(), []);

  // Initialize on mount if autoInit is true
  useEffect(() => {
    if (autoInit && !initialized && !initializing) {
      setInitializing(true);
      uiSounds
        .initialize()
        .then(() => {
          setInitialized(true);
          setInitializing(false);
        })
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.error('Failed to initialize UI sounds:', error);
          setInitializing(false);
        });
    }
  }, [autoInit, initialized, initializing, uiSounds]);

  // Play sound
  const play = useCallback(
    (type: UISoundType, volume?: number) => {
      uiSounds.play(type, volume);
    },
    [uiSounds]
  );

  // Stop sound
  const stop = useCallback(
    (soundId: number) => {
      uiSounds.stop(soundId);
    },
    [uiSounds]
  );

  // Stop all sounds
  const stopAll = useCallback(() => {
    uiSounds.stopAll();
  }, [uiSounds]);

  // Convenience methods
  const sounds = useMemo(
    () => ({
      clickButton: (variant: 'primary' | 'secondary' | 'danger' = 'primary') => {
        uiSounds.clickButton(variant);
      },
      hoverMenu: () => {
        uiSounds.hoverMenu();
      },
      selectMenu: () => {
        uiSounds.selectMenu();
      },
      openMenu: () => {
        uiSounds.openMenu();
      },
      closeMenu: () => {
        uiSounds.closeMenu();
      },
      notify: (type: 'success' | 'error' | 'warning' | 'info') => {
        uiSounds.notify(type);
      },
      openModal: () => {
        uiSounds.openModal();
      },
      closeModal: () => {
        uiSounds.closeModal();
      },
      toggle: (on: boolean) => {
        uiSounds.toggle(on);
      },
      switchTab: () => {
        uiSounds.switchTab();
      },
      changePage: () => {
        uiSounds.changePage();
      },
      checkCheckbox: (checked: boolean) => {
        uiSounds.checkCheckbox(checked);
      },
      openDropdown: () => {
        uiSounds.openDropdown();
      },
      closeDropdown: () => {
        uiSounds.closeDropdown();
      },
    }),
    [uiSounds]
  );

  return {
    initialized,
    initializing,
    play,
    stop,
    stopAll,
    sounds,
  };
}

/**
 * useButtonSound hook
 *
 * Simplified hook for button click sounds.
 * Returns a callback that plays the button click sound.
 *
 * @example
 * ```tsx
 * function MyButton() {
 *   const playClick = useButtonSound('primary');
 *
 *   return (
 *     <button onClick={playClick}>
 *       Click me
 *     </button>
 *   );
 * }
 * ```
 *
 * @param variant - Button variant (primary, secondary, danger)
 * @returns Callback to play button click sound
 */
export function useButtonSound(
  variant: 'primary' | 'secondary' | 'danger' = 'primary'
): () => void {
  const { sounds } = useUISoundEffects();

  return useCallback(() => {
    sounds.clickButton(variant);
  }, [sounds, variant]);
}

/**
 * useMenuSound hook
 *
 * Simplified hook for menu sounds.
 * Returns callbacks for menu hover and select sounds.
 *
 * @example
 * ```tsx
 * function MenuItem() {
 *   const { onHover, onSelect } = useMenuSound();
 *
 *   return (
 *     <div onMouseEnter={onHover} onClick={onSelect}>
 *       Menu Item
 *     </div>
 *   );
 * }
 * ```
 *
 * @returns Menu sound callbacks
 */
export function useMenuSound() {
  const { sounds } = useUISoundEffects();

  return useMemo(
    () => ({
      onHover: () => sounds.hoverMenu(),
      onSelect: () => sounds.selectMenu(),
      onOpen: () => sounds.openMenu(),
      onClose: () => sounds.closeMenu(),
    }),
    [sounds]
  );
}

/**
 * useNotificationSound hook
 *
 * Simplified hook for notification sounds.
 * Returns a callback to play notification sounds.
 *
 * @example
 * ```tsx
 * function Notification() {
 *   const playNotification = useNotificationSound();
 *
 *   useEffect(() => {
 *     playNotification('success');
 *   }, []);
 *
 *   return <div>Success!</div>;
 * }
 * ```
 *
 * @returns Callback to play notification sound
 */
export function useNotificationSound() {
  const { sounds } = useUISoundEffects();

  return useCallback(
    (type: 'success' | 'error' | 'warning' | 'info') => {
      sounds.notify(type);
    },
    [sounds]
  );
}

/**
 * useModalSound hook
 *
 * Simplified hook for modal sounds.
 * Returns callbacks for modal open and close sounds.
 *
 * @example
 * ```tsx
 * function Modal({ isOpen }) {
 *   const { onOpen, onClose } = useModalSound();
 *
 *   useEffect(() => {
 *     if (isOpen) {
 *       onOpen();
 *     }
 *   }, [isOpen, onOpen]);
 *
 *   const handleClose = () => {
 *     onClose();
 *     // ... close logic
 *   };
 *
 *   return <div>...</div>;
 * }
 * ```
 *
 * @returns Modal sound callbacks
 */
export function useModalSound() {
  const { sounds } = useUISoundEffects();

  return useMemo(
    () => ({
      onOpen: () => sounds.openModal(),
      onClose: () => sounds.closeModal(),
    }),
    [sounds]
  );
}

/**
 * useToggleSound hook
 *
 * Simplified hook for toggle sounds.
 * Returns a callback that plays toggle sound based on state.
 *
 * @example
 * ```tsx
 * function Toggle({ checked, onChange }) {
 *   const playToggle = useToggleSound();
 *
 *   const handleToggle = () => {
 *     const newChecked = !checked;
 *     playToggle(newChecked);
 *     onChange(newChecked);
 *   };
 *
 *   return <input type="checkbox" checked={checked} onChange={handleToggle} />;
 * }
 * ```
 *
 * @returns Callback to play toggle sound
 */
export function useToggleSound() {
  const { sounds } = useUISoundEffects();

  return useCallback(
    (on: boolean) => {
      sounds.toggle(on);
    },
    [sounds]
  );
}

export default useUISoundEffects;
