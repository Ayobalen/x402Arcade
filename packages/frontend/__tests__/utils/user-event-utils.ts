/**
 * User Event Test Utilities
 *
 * This module provides a comprehensive set of helpers for simulating
 * realistic user interactions in tests using @testing-library/user-event.
 *
 * Features:
 * - Pre-configured userEvent instances with sensible defaults
 * - Type-safe keyboard shortcut helpers
 * - Common interaction patterns (click, type, select, hover)
 * - Game-specific input helpers (arrow keys, WASD)
 * - Form interaction utilities
 *
 * @example
 * ```typescript
 * import { createUser, typeInInput, pressEnter, pressArrowKeys } from './user-event-utils';
 *
 * test('form submission', async () => {
 *   const user = createUser();
 *   await typeInInput(user, screen.getByRole('textbox'), 'hello');
 *   await pressEnter(user);
 * });
 * ```
 */

import userEvent, { UserEvent, Options as UserEventOptions } from '@testing-library/user-event';

// ============================================================================
// Types
// ============================================================================

/**
 * Default configuration options for userEvent.setup()
 */
export interface UserEventSetupOptions extends Partial<UserEventOptions> {
  /**
   * Delay between keystrokes (null = no delay, recommended for tests)
   * @default null
   */
  delay?: number | null;
  /**
   * Whether to track pointer events
   * @default true
   */
  pointerEventsCheck?: number;
  /**
   * Skip hover events (can speed up tests)
   * @default false
   */
  skipHover?: boolean;
}

/**
 * Keyboard modifier keys
 */
export interface ModifierKeys {
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
}

/**
 * Keyboard shortcut definition
 */
export interface KeyboardShortcut {
  key: string;
  modifiers?: ModifierKeys;
}

/**
 * Arrow key directions
 */
export type ArrowDirection = 'up' | 'down' | 'left' | 'right';

/**
 * WASD key directions
 */
export type WASDDirection = 'w' | 'a' | 's' | 'd';

/**
 * Common keyboard keys
 */
export const KEYS = {
  // Navigation
  ArrowUp: '{ArrowUp}',
  ArrowDown: '{ArrowDown}',
  ArrowLeft: '{ArrowLeft}',
  ArrowRight: '{ArrowRight}',

  // WASD (for games)
  W: 'w',
  A: 'a',
  S: 's',
  D: 'd',

  // Common actions
  Enter: '{Enter}',
  Escape: '{Escape}',
  Tab: '{Tab}',
  Space: ' ',
  Backspace: '{Backspace}',
  Delete: '{Delete}',

  // Modifiers (for combinations)
  Shift: '{Shift}',
  Control: '{Control}',
  Alt: '{Alt}',
  Meta: '{Meta}',

  // Function keys
  F1: '{F1}',
  F2: '{F2}',
  F3: '{F3}',
  F4: '{F4}',
  F5: '{F5}',
  F6: '{F6}',
  F7: '{F7}',
  F8: '{F8}',
  F9: '{F9}',
  F10: '{F10}',
  F11: '{F11}',
  F12: '{F12}',

  // Home/End
  Home: '{Home}',
  End: '{End}',
  PageUp: '{PageUp}',
  PageDown: '{PageDown}',
} as const;

// ============================================================================
// Configuration
// ============================================================================

/**
 * Default options for userEvent.setup()
 *
 * - delay: null - No artificial delay between actions (faster tests)
 * - pointerEventsCheck: 1000 - Check pointer-events CSS property
 */
export const DEFAULT_USER_EVENT_OPTIONS: UserEventSetupOptions = {
  delay: null,
  pointerEventsCheck: 1000,
};

/**
 * Fast options for userEvent - minimal delays and checks
 */
export const FAST_USER_EVENT_OPTIONS: UserEventSetupOptions = {
  delay: null,
  pointerEventsCheck: 0,
  skipHover: true,
};

/**
 * Realistic options for userEvent - includes delays for more realistic testing
 */
export const REALISTIC_USER_EVENT_OPTIONS: UserEventSetupOptions = {
  delay: 10, // 10ms between keystrokes
  pointerEventsCheck: 1000,
  skipHover: false,
};

// ============================================================================
// UserEvent Factory Functions
// ============================================================================

/**
 * Create a configured userEvent instance with default options.
 *
 * @param options - Optional configuration overrides
 * @returns Configured UserEvent instance
 *
 * @example
 * ```typescript
 * const user = createUser();
 * await user.click(button);
 * ```
 */
export function createUser(options: UserEventSetupOptions = {}): UserEvent {
  return userEvent.setup({
    ...DEFAULT_USER_EVENT_OPTIONS,
    ...options,
  });
}

/**
 * Create a fast userEvent instance for performance-critical tests.
 *
 * Skips pointer-events checks and hover events.
 *
 * @returns Fast UserEvent instance
 */
export function createFastUser(): UserEvent {
  return userEvent.setup(FAST_USER_EVENT_OPTIONS);
}

/**
 * Create a realistic userEvent instance with delays.
 *
 * Good for testing animations or time-sensitive interactions.
 *
 * @returns Realistic UserEvent instance
 */
export function createRealisticUser(): UserEvent {
  return userEvent.setup(REALISTIC_USER_EVENT_OPTIONS);
}

/**
 * Global user event instance for simple tests.
 *
 * Note: For most tests, prefer creating a new instance with createUser()
 * to avoid state leakage between tests.
 */
export const defaultUser = createUser();

// ============================================================================
// Click Helpers
// ============================================================================

/**
 * Perform a single click on an element.
 *
 * @param user - UserEvent instance
 * @param element - Element to click
 */
export async function click(user: UserEvent, element: Element): Promise<void> {
  await user.click(element);
}

/**
 * Perform a double click on an element.
 *
 * @param user - UserEvent instance
 * @param element - Element to double-click
 */
export async function doubleClick(user: UserEvent, element: Element): Promise<void> {
  await user.dblClick(element);
}

/**
 * Perform a right-click (context menu) on an element.
 *
 * @param user - UserEvent instance
 * @param element - Element to right-click
 */
export async function rightClick(user: UserEvent, element: Element): Promise<void> {
  await user.pointer({ keys: '[MouseRight]', target: element });
}

/**
 * Triple-click to select all text in an element.
 *
 * @param user - UserEvent instance
 * @param element - Element to triple-click
 */
export async function tripleClick(user: UserEvent, element: Element): Promise<void> {
  await user.tripleClick(element);
}

/**
 * Click with modifier keys held.
 *
 * @param user - UserEvent instance
 * @param element - Element to click
 * @param modifiers - Modifier keys to hold
 */
export async function clickWithModifiers(
  user: UserEvent,
  element: Element,
  modifiers: ModifierKeys
): Promise<void> {
  const keys: string[] = [];

  if (modifiers.ctrl) keys.push('{Control>}');
  if (modifiers.alt) keys.push('{Alt>}');
  if (modifiers.shift) keys.push('{Shift>}');
  if (modifiers.meta) keys.push('{Meta>}');

  if (keys.length > 0) {
    await user.keyboard(keys.join(''));
  }

  await user.click(element);

  // Release modifiers in reverse order
  const releaseKeys: string[] = [];
  if (modifiers.meta) releaseKeys.push('{/Meta}');
  if (modifiers.shift) releaseKeys.push('{/Shift}');
  if (modifiers.alt) releaseKeys.push('{/Alt}');
  if (modifiers.ctrl) releaseKeys.push('{/Control}');

  if (releaseKeys.length > 0) {
    await user.keyboard(releaseKeys.join(''));
  }
}

// ============================================================================
// Type/Input Helpers
// ============================================================================

/**
 * Type text into an element (clears existing content first).
 *
 * @param user - UserEvent instance
 * @param element - Input element to type into
 * @param text - Text to type
 *
 * @example
 * ```typescript
 * await typeInInput(user, screen.getByRole('textbox'), 'hello world');
 * ```
 */
export async function typeInInput(
  user: UserEvent,
  element: Element,
  text: string
): Promise<void> {
  await user.clear(element);
  await user.type(element, text);
}

/**
 * Type text into an element without clearing first (appends).
 *
 * @param user - UserEvent instance
 * @param element - Input element to type into
 * @param text - Text to append
 */
export async function appendToInput(
  user: UserEvent,
  element: Element,
  text: string
): Promise<void> {
  await user.type(element, text);
}

/**
 * Clear an input element.
 *
 * @param user - UserEvent instance
 * @param element - Input element to clear
 */
export async function clearInput(user: UserEvent, element: Element): Promise<void> {
  await user.clear(element);
}

/**
 * Select all text in an input and replace it.
 *
 * @param user - UserEvent instance
 * @param element - Input element
 * @param newText - Text to replace with
 */
export async function replaceInputText(
  user: UserEvent,
  element: Element,
  newText: string
): Promise<void> {
  // Select all with Ctrl+A (or Cmd+A on Mac)
  await user.click(element);
  await user.keyboard('{Control>}a{/Control}');
  await user.type(element, newText);
}

/**
 * Paste text into an element.
 *
 * @param user - UserEvent instance
 * @param text - Text to paste
 */
export async function paste(user: UserEvent, text: string): Promise<void> {
  await user.paste(text);
}

/**
 * Copy selected text from an element.
 *
 * @param user - UserEvent instance
 */
export async function copy(user: UserEvent): Promise<DataTransfer | undefined> {
  return user.copy();
}

/**
 * Cut selected text from an element.
 *
 * @param user - UserEvent instance
 */
export async function cut(user: UserEvent): Promise<DataTransfer | undefined> {
  return user.cut();
}

// ============================================================================
// Selection Helpers
// ============================================================================

/**
 * Select an option from a dropdown/select element.
 *
 * @param user - UserEvent instance
 * @param element - Select element
 * @param value - Value or label to select (string or array for multiple)
 *
 * @example
 * ```typescript
 * await selectOption(user, screen.getByRole('combobox'), 'option1');
 * await selectOption(user, screen.getByRole('listbox'), ['opt1', 'opt2']);
 * ```
 */
export async function selectOption(
  user: UserEvent,
  element: Element,
  value: string | string[]
): Promise<void> {
  await user.selectOptions(element, value);
}

/**
 * Deselect options from a multi-select element.
 *
 * @param user - UserEvent instance
 * @param element - Select element
 * @param value - Value or label to deselect
 */
export async function deselectOption(
  user: UserEvent,
  element: Element,
  value: string | string[]
): Promise<void> {
  await user.deselectOptions(element, value);
}

// ============================================================================
// Keyboard Helpers
// ============================================================================

/**
 * Press a single key.
 *
 * @param user - UserEvent instance
 * @param key - Key to press (use KEYS constants)
 *
 * @example
 * ```typescript
 * await pressKey(user, KEYS.Enter);
 * await pressKey(user, KEYS.ArrowUp);
 * ```
 */
export async function pressKey(user: UserEvent, key: string): Promise<void> {
  await user.keyboard(key);
}

/**
 * Press Enter key.
 *
 * @param user - UserEvent instance
 */
export async function pressEnter(user: UserEvent): Promise<void> {
  await user.keyboard(KEYS.Enter);
}

/**
 * Press Escape key.
 *
 * @param user - UserEvent instance
 */
export async function pressEscape(user: UserEvent): Promise<void> {
  await user.keyboard(KEYS.Escape);
}

/**
 * Press Tab key.
 *
 * @param user - UserEvent instance
 */
export async function pressTab(user: UserEvent): Promise<void> {
  await user.keyboard(KEYS.Tab);
}

/**
 * Press Shift+Tab (reverse tab).
 *
 * @param user - UserEvent instance
 */
export async function pressShiftTab(user: UserEvent): Promise<void> {
  await user.keyboard('{Shift>}{Tab}{/Shift}');
}

/**
 * Press Space key.
 *
 * @param user - UserEvent instance
 */
export async function pressSpace(user: UserEvent): Promise<void> {
  await user.keyboard(KEYS.Space);
}

/**
 * Press Backspace key.
 *
 * @param user - UserEvent instance
 */
export async function pressBackspace(user: UserEvent): Promise<void> {
  await user.keyboard(KEYS.Backspace);
}

/**
 * Press Delete key.
 *
 * @param user - UserEvent instance
 */
export async function pressDelete(user: UserEvent): Promise<void> {
  await user.keyboard(KEYS.Delete);
}

/**
 * Press a keyboard shortcut with modifiers.
 *
 * @param user - UserEvent instance
 * @param shortcut - Shortcut definition
 *
 * @example
 * ```typescript
 * await pressShortcut(user, { key: 's', modifiers: { ctrl: true } }); // Ctrl+S
 * await pressShortcut(user, { key: 'c', modifiers: { ctrl: true, shift: true } }); // Ctrl+Shift+C
 * ```
 */
export async function pressShortcut(
  user: UserEvent,
  shortcut: KeyboardShortcut
): Promise<void> {
  const { key, modifiers = {} } = shortcut;
  const sequence: string[] = [];

  // Press modifiers
  if (modifiers.ctrl) sequence.push('{Control>}');
  if (modifiers.alt) sequence.push('{Alt>}');
  if (modifiers.shift) sequence.push('{Shift>}');
  if (modifiers.meta) sequence.push('{Meta>}');

  // Press key
  sequence.push(key);

  // Release modifiers in reverse order
  if (modifiers.meta) sequence.push('{/Meta}');
  if (modifiers.shift) sequence.push('{/Shift}');
  if (modifiers.alt) sequence.push('{/Alt}');
  if (modifiers.ctrl) sequence.push('{/Control}');

  await user.keyboard(sequence.join(''));
}

/**
 * Press Ctrl+key shortcut (Cmd+key on Mac in real browsers).
 *
 * @param user - UserEvent instance
 * @param key - Key to press with Ctrl
 */
export async function pressCtrl(user: UserEvent, key: string): Promise<void> {
  await pressShortcut(user, { key, modifiers: { ctrl: true } });
}

/**
 * Press Alt+key shortcut.
 *
 * @param user - UserEvent instance
 * @param key - Key to press with Alt
 */
export async function pressAlt(user: UserEvent, key: string): Promise<void> {
  await pressShortcut(user, { key, modifiers: { alt: true } });
}

/**
 * Press Shift+key shortcut.
 *
 * @param user - UserEvent instance
 * @param key - Key to press with Shift
 */
export async function pressShift(user: UserEvent, key: string): Promise<void> {
  await pressShortcut(user, { key, modifiers: { shift: true } });
}

// ============================================================================
// Arrow Key Helpers (Game Navigation)
// ============================================================================

/**
 * Press an arrow key.
 *
 * @param user - UserEvent instance
 * @param direction - Arrow direction
 */
export async function pressArrowKey(
  user: UserEvent,
  direction: ArrowDirection
): Promise<void> {
  const keyMap: Record<ArrowDirection, string> = {
    up: KEYS.ArrowUp,
    down: KEYS.ArrowDown,
    left: KEYS.ArrowLeft,
    right: KEYS.ArrowRight,
  };
  await user.keyboard(keyMap[direction]);
}

/**
 * Press arrow keys in sequence.
 *
 * @param user - UserEvent instance
 * @param directions - Array of arrow directions
 *
 * @example
 * ```typescript
 * await pressArrowKeys(user, ['up', 'up', 'right', 'down']);
 * ```
 */
export async function pressArrowKeys(
  user: UserEvent,
  directions: ArrowDirection[]
): Promise<void> {
  for (const direction of directions) {
    await pressArrowKey(user, direction);
  }
}

/**
 * Press Up arrow key.
 *
 * @param user - UserEvent instance
 */
export async function pressUp(user: UserEvent): Promise<void> {
  await user.keyboard(KEYS.ArrowUp);
}

/**
 * Press Down arrow key.
 *
 * @param user - UserEvent instance
 */
export async function pressDown(user: UserEvent): Promise<void> {
  await user.keyboard(KEYS.ArrowDown);
}

/**
 * Press Left arrow key.
 *
 * @param user - UserEvent instance
 */
export async function pressLeft(user: UserEvent): Promise<void> {
  await user.keyboard(KEYS.ArrowLeft);
}

/**
 * Press Right arrow key.
 *
 * @param user - UserEvent instance
 */
export async function pressRight(user: UserEvent): Promise<void> {
  await user.keyboard(KEYS.ArrowRight);
}

// ============================================================================
// WASD Key Helpers (Game Controls)
// ============================================================================

/**
 * Press a WASD key.
 *
 * @param user - UserEvent instance
 * @param key - WASD key
 */
export async function pressWASD(user: UserEvent, key: WASDDirection): Promise<void> {
  await user.keyboard(key);
}

/**
 * Press WASD keys in sequence.
 *
 * @param user - UserEvent instance
 * @param keys - Array of WASD keys
 *
 * @example
 * ```typescript
 * await pressWASDKeys(user, ['w', 'w', 'd', 's']);
 * ```
 */
export async function pressWASDKeys(
  user: UserEvent,
  keys: WASDDirection[]
): Promise<void> {
  for (const key of keys) {
    await user.keyboard(key);
  }
}

/**
 * Press W key (up in WASD).
 *
 * @param user - UserEvent instance
 */
export async function pressW(user: UserEvent): Promise<void> {
  await user.keyboard(KEYS.W);
}

/**
 * Press A key (left in WASD).
 *
 * @param user - UserEvent instance
 */
export async function pressA(user: UserEvent): Promise<void> {
  await user.keyboard(KEYS.A);
}

/**
 * Press S key (down in WASD).
 *
 * @param user - UserEvent instance
 */
export async function pressS(user: UserEvent): Promise<void> {
  await user.keyboard(KEYS.S);
}

/**
 * Press D key (right in WASD).
 *
 * @param user - UserEvent instance
 */
export async function pressD(user: UserEvent): Promise<void> {
  await user.keyboard(KEYS.D);
}

// ============================================================================
// Hover/Focus Helpers
// ============================================================================

/**
 * Hover over an element.
 *
 * @param user - UserEvent instance
 * @param element - Element to hover over
 */
export async function hover(user: UserEvent, element: Element): Promise<void> {
  await user.hover(element);
}

/**
 * Move mouse away from an element (unhover).
 *
 * @param user - UserEvent instance
 * @param element - Element to unhover from
 */
export async function unhover(user: UserEvent, element: Element): Promise<void> {
  await user.unhover(element);
}

/**
 * Tab to focus on an element (simulates keyboard navigation).
 *
 * @param user - UserEvent instance
 * @param times - Number of tabs (default 1)
 */
export async function tabToElement(user: UserEvent, times = 1): Promise<void> {
  for (let i = 0; i < times; i++) {
    await user.keyboard(KEYS.Tab);
  }
}

// ============================================================================
// Drag and Drop Helpers
// ============================================================================

/**
 * Drag an element and drop it onto another.
 *
 * @param user - UserEvent instance
 * @param source - Element to drag
 * @param target - Element to drop onto
 */
export async function dragAndDrop(
  user: UserEvent,
  source: Element,
  target: Element
): Promise<void> {
  await user.pointer([
    { keys: '[MouseLeft>]', target: source },
    { target },
    { keys: '[/MouseLeft]' },
  ]);
}

// ============================================================================
// Form Helpers
// ============================================================================

/**
 * Fill out a form with provided values.
 *
 * @param user - UserEvent instance
 * @param formData - Object mapping input names/labels to values
 * @param container - Container element to search within (default: document.body)
 *
 * @example
 * ```typescript
 * await fillForm(user, {
 *   'Username': 'testuser',
 *   'Password': 'secret123',
 *   'Remember me': true, // checkbox
 * });
 * ```
 */
export async function fillForm(
  user: UserEvent,
  formData: Record<string, string | boolean | string[]>,
  container: Element = document.body
): Promise<void> {
  for (const [label, value] of Object.entries(formData)) {
    const input = container.querySelector(
      `[name="${label}"], [aria-label="${label}"], #${label}`
    );

    if (!input) {
      throw new Error(`Could not find input for label: ${label}`);
    }

    if (typeof value === 'boolean') {
      // Checkbox
      const checkbox = input as HTMLInputElement;
      if (checkbox.checked !== value) {
        await user.click(checkbox);
      }
    } else if (Array.isArray(value)) {
      // Multi-select
      await user.selectOptions(input, value);
    } else if (input.tagName === 'SELECT') {
      // Single select
      await user.selectOptions(input, value);
    } else {
      // Text input
      await user.clear(input);
      await user.type(input, value);
    }
  }
}

/**
 * Submit a form by pressing Enter or clicking submit button.
 *
 * @param user - UserEvent instance
 * @param form - Form element (optional, uses Enter if not provided)
 */
export async function submitForm(
  user: UserEvent,
  form?: HTMLFormElement
): Promise<void> {
  if (form) {
    const submitButton = form.querySelector('[type="submit"]');
    if (submitButton) {
      await user.click(submitButton);
      return;
    }
  }
  await user.keyboard(KEYS.Enter);
}

// ============================================================================
// Upload Helpers
// ============================================================================

/**
 * Upload a file to a file input.
 *
 * @param user - UserEvent instance
 * @param input - File input element
 * @param file - File to upload (or array of files)
 *
 * @example
 * ```typescript
 * const file = new File(['content'], 'test.txt', { type: 'text/plain' });
 * await uploadFile(user, fileInput, file);
 * ```
 */
export async function uploadFile(
  user: UserEvent,
  input: Element,
  file: File | File[]
): Promise<void> {
  await user.upload(input as HTMLInputElement, file);
}

/**
 * Create a mock file for testing uploads.
 *
 * @param name - File name
 * @param content - File content
 * @param type - MIME type (default: 'text/plain')
 * @returns File object
 */
export function createMockFile(
  name: string,
  content: string | BufferSource,
  type = 'text/plain'
): File {
  return new File([content], name, { type });
}

/**
 * Create a mock image file for testing.
 *
 * @param name - File name (default: 'test.png')
 * @returns File object representing an image
 */
export function createMockImageFile(name = 'test.png'): File {
  // Create a minimal valid PNG (1x1 transparent pixel)
  const pngData = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
    0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, // IDAT chunk
    0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, // IEND chunk
    0x42, 0x60, 0x82,
  ]);
  return new File([pngData], name, { type: 'image/png' });
}

// ============================================================================
// Pointer Helpers
// ============================================================================

/**
 * Pointer state for advanced pointer interactions
 */
export interface PointerState {
  position: { x: number; y: number };
  buttons: number;
}

/**
 * Move the pointer to specific coordinates.
 *
 * @param user - UserEvent instance
 * @param coords - Target coordinates
 */
export async function movePointerTo(
  user: UserEvent,
  coords: { x: number; y: number }
): Promise<void> {
  await user.pointer({ coords });
}

/**
 * Perform a pointer down event.
 *
 * @param user - UserEvent instance
 * @param element - Target element
 */
export async function pointerDown(user: UserEvent, element: Element): Promise<void> {
  await user.pointer({ keys: '[MouseLeft>]', target: element });
}

/**
 * Perform a pointer up event.
 *
 * @param user - UserEvent instance
 */
export async function pointerUp(user: UserEvent): Promise<void> {
  await user.pointer({ keys: '[/MouseLeft]' });
}

// ============================================================================
// Common Shortcut Presets
// ============================================================================

/**
 * Common keyboard shortcuts
 */
export const SHORTCUTS = {
  // Edit operations
  copy: { key: 'c', modifiers: { ctrl: true } },
  cut: { key: 'x', modifiers: { ctrl: true } },
  paste: { key: 'v', modifiers: { ctrl: true } },
  undo: { key: 'z', modifiers: { ctrl: true } },
  redo: { key: 'y', modifiers: { ctrl: true } },
  redoAlt: { key: 'z', modifiers: { ctrl: true, shift: true } },
  selectAll: { key: 'a', modifiers: { ctrl: true } },

  // Navigation
  goToStart: { key: 'Home', modifiers: {} },
  goToEnd: { key: 'End', modifiers: {} },

  // Save
  save: { key: 's', modifiers: { ctrl: true } },

  // Find
  find: { key: 'f', modifiers: { ctrl: true } },
  findAndReplace: { key: 'h', modifiers: { ctrl: true } },

  // Window/Tab
  closeTab: { key: 'w', modifiers: { ctrl: true } },
  newTab: { key: 't', modifiers: { ctrl: true } },

  // Game specific
  pause: { key: 'p', modifiers: {} },
  mute: { key: 'm', modifiers: {} },
  fullscreen: { key: 'f', modifiers: {} },
} as const;

/**
 * Press a common keyboard shortcut by name.
 *
 * @param user - UserEvent instance
 * @param shortcutName - Name of the shortcut (from SHORTCUTS)
 *
 * @example
 * ```typescript
 * await pressCommonShortcut(user, 'copy');
 * await pressCommonShortcut(user, 'undo');
 * ```
 */
export async function pressCommonShortcut(
  user: UserEvent,
  shortcutName: keyof typeof SHORTCUTS
): Promise<void> {
  const shortcut = SHORTCUTS[shortcutName];
  await pressShortcut(user, shortcut);
}
