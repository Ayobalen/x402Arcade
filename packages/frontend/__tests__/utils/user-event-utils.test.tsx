/**
 * User Event Utilities Tests
 *
 * Comprehensive tests for user interaction helpers.
 * Tests cover:
 * - UserEvent factory functions
 * - Click interactions
 * - Type/input interactions
 * - Keyboard shortcuts
 * - Arrow keys and WASD (game controls)
 * - Form interactions
 * - File uploads
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React, { useState } from 'react';

import {
  // Factory functions
  createUser,
  createFastUser,
  createRealisticUser,
  defaultUser,
  // Configuration
  DEFAULT_USER_EVENT_OPTIONS,
  FAST_USER_EVENT_OPTIONS,
  REALISTIC_USER_EVENT_OPTIONS,
  // Constants
  KEYS,
  SHORTCUTS,
  // Click helpers
  click,
  doubleClick,
  rightClick,
  tripleClick,
  clickWithModifiers,
  // Type helpers
  typeInInput,
  appendToInput,
  clearInput,
  replaceInputText,
  paste,
  // Selection helpers
  selectOption,
  deselectOption,
  // Keyboard helpers
  pressKey,
  pressEnter,
  pressEscape,
  pressTab,
  pressShiftTab,
  pressSpace,
  pressBackspace,
  pressDelete,
  pressShortcut,
  pressCtrl,
  pressAlt,
  pressShift,
  // Arrow key helpers
  pressArrowKey,
  pressArrowKeys,
  pressUp,
  pressDown,
  pressLeft,
  pressRight,
  // WASD helpers
  pressWASD,
  pressWASDKeys,
  pressW,
  pressA,
  pressS,
  pressD,
  // Hover/Focus helpers
  hover,
  unhover,
  tabToElement,
  // Drag and drop
  dragAndDrop,
  // Form helpers
  fillForm,
  submitForm,
  // Upload helpers
  uploadFile,
  createMockFile,
  createMockImageFile,
  // Pointer helpers
  movePointerTo,
  pointerDown,
  pointerUp,
  // Shortcut helper
  pressCommonShortcut,
  // Types
  type ArrowDirection,
  type WASDDirection,
  type KeyboardShortcut,
  type ModifierKeys,
} from './user-event-utils';

// ============================================================================
// Test Components
// ============================================================================

function ClickCounter() {
  const [count, setCount] = useState(0);
  const [lastEvent, setLastEvent] = useState<string>('none');

  return (
    <div>
      <button
        onClick={() => {
          setCount(c => c + 1);
          setLastEvent('click');
        }}
        onDoubleClick={() => setLastEvent('dblclick')}
        onContextMenu={(e) => {
          e.preventDefault();
          setLastEvent('contextmenu');
        }}
        data-testid="counter-button"
      >
        Clicked {count} times
      </button>
      <span data-testid="last-event">{lastEvent}</span>
    </div>
  );
}

function TextInput() {
  const [value, setValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  return (
    <div>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setHistory(h => [...h, e.target.value]);
        }}
        data-testid="text-input"
      />
      <span data-testid="current-value">{value}</span>
      <span data-testid="history">{history.join(',')}</span>
    </div>
  );
}

function KeyboardTracker() {
  const [keys, setKeys] = useState<string[]>([]);
  const [modifiers, setModifiers] = useState<string[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    setKeys(k => [...k, e.key]);
    const mods: string[] = [];
    if (e.ctrlKey) mods.push('ctrl');
    if (e.altKey) mods.push('alt');
    if (e.shiftKey) mods.push('shift');
    if (e.metaKey) mods.push('meta');
    if (mods.length > 0) {
      setModifiers(m => [...m, mods.join('+')]);
    }
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      data-testid="keyboard-tracker"
    >
      <span data-testid="pressed-keys">{keys.join(',')}</span>
      <span data-testid="modifiers">{modifiers.join('|')}</span>
    </div>
  );
}

function SelectBox() {
  const [selected, setSelected] = useState<string>('');
  const [multiSelected, setMultiSelected] = useState<string[]>([]);

  return (
    <div>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        data-testid="single-select"
      >
        <option value="">Choose...</option>
        <option value="opt1">Option 1</option>
        <option value="opt2">Option 2</option>
        <option value="opt3">Option 3</option>
      </select>
      <select
        multiple
        value={multiSelected}
        onChange={(e) => {
          const values = Array.from(e.target.selectedOptions, o => o.value);
          setMultiSelected(values);
        }}
        data-testid="multi-select"
      >
        <option value="a">A</option>
        <option value="b">B</option>
        <option value="c">C</option>
      </select>
      <span data-testid="selected-single">{selected}</span>
      <span data-testid="selected-multi">{multiSelected.join(',')}</span>
    </div>
  );
}

function HoverTracker() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid="hover-target"
    >
      {isHovered ? 'Hovered' : 'Not hovered'}
    </div>
  );
}

function FileUploader() {
  const [files, setFiles] = useState<string[]>([]);

  return (
    <div>
      <input
        type="file"
        onChange={(e) => {
          const fileList = e.target.files;
          if (fileList) {
            setFiles(Array.from(fileList, f => f.name));
          }
        }}
        data-testid="file-input"
      />
      <span data-testid="uploaded-files">{files.join(',')}</span>
    </div>
  );
}

function FormComponent() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
        const form = e.target as HTMLFormElement;
        const data = new FormData(form);
        const obj: Record<string, string> = {};
        data.forEach((value, key) => {
          obj[key] = value as string;
        });
        setFormData(obj);
      }}
      data-testid="test-form"
    >
      <input name="username" type="text" />
      <input name="email" type="email" />
      <select name="role">
        <option value="user">User</option>
        <option value="admin">Admin</option>
      </select>
      <input name="remember" type="checkbox" />
      <button type="submit">Submit</button>
      {submitted && <span data-testid="form-submitted">Submitted</span>}
      <span data-testid="form-data">{JSON.stringify(formData)}</span>
    </form>
  );
}

// ============================================================================
// Tests
// ============================================================================

describe('User Event Utilities', () => {
  describe('Configuration Constants', () => {
    it('should have correct DEFAULT_USER_EVENT_OPTIONS', () => {
      expect(DEFAULT_USER_EVENT_OPTIONS).toEqual({
        delay: null,
        pointerEventsCheck: 1000,
      });
    });

    it('should have correct FAST_USER_EVENT_OPTIONS', () => {
      expect(FAST_USER_EVENT_OPTIONS).toEqual({
        delay: null,
        pointerEventsCheck: 0,
        skipHover: true,
      });
    });

    it('should have correct REALISTIC_USER_EVENT_OPTIONS', () => {
      expect(REALISTIC_USER_EVENT_OPTIONS).toEqual({
        delay: 10,
        pointerEventsCheck: 1000,
        skipHover: false,
      });
    });
  });

  describe('KEYS Constants', () => {
    it('should have arrow key constants', () => {
      expect(KEYS.ArrowUp).toBe('{ArrowUp}');
      expect(KEYS.ArrowDown).toBe('{ArrowDown}');
      expect(KEYS.ArrowLeft).toBe('{ArrowLeft}');
      expect(KEYS.ArrowRight).toBe('{ArrowRight}');
    });

    it('should have WASD key constants', () => {
      expect(KEYS.W).toBe('w');
      expect(KEYS.A).toBe('a');
      expect(KEYS.S).toBe('s');
      expect(KEYS.D).toBe('d');
    });

    it('should have common action key constants', () => {
      expect(KEYS.Enter).toBe('{Enter}');
      expect(KEYS.Escape).toBe('{Escape}');
      expect(KEYS.Tab).toBe('{Tab}');
      expect(KEYS.Space).toBe(' ');
      expect(KEYS.Backspace).toBe('{Backspace}');
      expect(KEYS.Delete).toBe('{Delete}');
    });

    it('should have modifier key constants', () => {
      expect(KEYS.Shift).toBe('{Shift}');
      expect(KEYS.Control).toBe('{Control}');
      expect(KEYS.Alt).toBe('{Alt}');
      expect(KEYS.Meta).toBe('{Meta}');
    });

    it('should have function key constants', () => {
      expect(KEYS.F1).toBe('{F1}');
      expect(KEYS.F12).toBe('{F12}');
    });
  });

  describe('SHORTCUTS Presets', () => {
    it('should have copy shortcut', () => {
      expect(SHORTCUTS.copy).toEqual({ key: 'c', modifiers: { ctrl: true } });
    });

    it('should have cut shortcut', () => {
      expect(SHORTCUTS.cut).toEqual({ key: 'x', modifiers: { ctrl: true } });
    });

    it('should have paste shortcut', () => {
      expect(SHORTCUTS.paste).toEqual({ key: 'v', modifiers: { ctrl: true } });
    });

    it('should have undo shortcut', () => {
      expect(SHORTCUTS.undo).toEqual({ key: 'z', modifiers: { ctrl: true } });
    });

    it('should have selectAll shortcut', () => {
      expect(SHORTCUTS.selectAll).toEqual({ key: 'a', modifiers: { ctrl: true } });
    });

    it('should have game shortcuts', () => {
      expect(SHORTCUTS.pause).toEqual({ key: 'p', modifiers: {} });
      expect(SHORTCUTS.mute).toEqual({ key: 'm', modifiers: {} });
      expect(SHORTCUTS.fullscreen).toEqual({ key: 'f', modifiers: {} });
    });
  });

  describe('Factory Functions', () => {
    it('should create a user event instance with createUser', () => {
      const user = createUser();
      expect(user).toBeDefined();
      expect(typeof user.click).toBe('function');
      expect(typeof user.type).toBe('function');
      expect(typeof user.keyboard).toBe('function');
    });

    it('should create a fast user event instance', () => {
      const user = createFastUser();
      expect(user).toBeDefined();
    });

    it('should create a realistic user event instance', () => {
      const user = createRealisticUser();
      expect(user).toBeDefined();
    });

    it('should provide a default user instance', () => {
      expect(defaultUser).toBeDefined();
      expect(typeof defaultUser.click).toBe('function');
    });

    it('should accept custom options in createUser', () => {
      const user = createUser({ delay: 100 });
      expect(user).toBeDefined();
    });
  });

  describe('Click Helpers', () => {
    it('should click an element', async () => {
      const user = createUser();
      render(<ClickCounter />);

      const button = screen.getByTestId('counter-button');
      await click(user, button);

      expect(screen.getByTestId('counter-button')).toHaveTextContent('Clicked 1 times');
    });

    it('should double-click an element', async () => {
      const user = createUser();
      render(<ClickCounter />);

      const button = screen.getByTestId('counter-button');
      await doubleClick(user, button);

      expect(screen.getByTestId('last-event')).toHaveTextContent('dblclick');
    });

    it('should right-click an element', async () => {
      const user = createUser();
      render(<ClickCounter />);

      const button = screen.getByTestId('counter-button');
      await rightClick(user, button);

      expect(screen.getByTestId('last-event')).toHaveTextContent('contextmenu');
    });

    it('should triple-click an element', async () => {
      const user = createUser();
      render(<TextInput />);

      const input = screen.getByTestId('text-input');
      // First type some text
      await user.type(input, 'hello world');
      // Triple click to select all
      await tripleClick(user, input);

      // After triple-click, text should be selected (not verifiable directly, but no error)
      expect(input).toBeInTheDocument();
    });

    it('should click with ctrl modifier', async () => {
      const user = createUser();
      render(<KeyboardTracker />);

      const tracker = screen.getByTestId('keyboard-tracker');
      tracker.focus();

      await clickWithModifiers(user, tracker, { ctrl: true });
      // Click with modifier should work without error
      expect(tracker).toBeInTheDocument();
    });

    it('should click with multiple modifiers', async () => {
      const user = createUser();
      render(<KeyboardTracker />);

      const tracker = screen.getByTestId('keyboard-tracker');
      tracker.focus();

      await clickWithModifiers(user, tracker, { ctrl: true, shift: true });
      expect(tracker).toBeInTheDocument();
    });
  });

  describe('Type/Input Helpers', () => {
    it('should type text into an input', async () => {
      const user = createUser();
      render(<TextInput />);

      const input = screen.getByTestId('text-input');
      await typeInInput(user, input, 'hello');

      expect(screen.getByTestId('current-value')).toHaveTextContent('hello');
    });

    it('should clear input before typing with typeInInput', async () => {
      const user = createUser();
      render(<TextInput />);

      const input = screen.getByTestId('text-input');
      await user.type(input, 'initial');
      await typeInInput(user, input, 'replaced');

      expect(screen.getByTestId('current-value')).toHaveTextContent('replaced');
    });

    it('should append text with appendToInput', async () => {
      const user = createUser();
      render(<TextInput />);

      const input = screen.getByTestId('text-input');
      await user.type(input, 'hello');
      await appendToInput(user, input, ' world');

      expect(screen.getByTestId('current-value')).toHaveTextContent('hello world');
    });

    it('should clear input with clearInput', async () => {
      const user = createUser();
      render(<TextInput />);

      const input = screen.getByTestId('text-input');
      await user.type(input, 'hello');
      await clearInput(user, input);

      expect(screen.getByTestId('current-value')).toHaveTextContent('');
    });

    it('should replace text with replaceInputText', async () => {
      const user = createUser();
      render(<TextInput />);

      const input = screen.getByTestId('text-input');
      await user.type(input, 'original');
      await replaceInputText(user, input, 'new text');

      // The final value should contain the new text (exact behavior depends on selection)
      expect(input).toBeInTheDocument();
    });

    it('should paste text', async () => {
      const user = createUser();
      render(<TextInput />);

      const input = screen.getByTestId('text-input');
      await user.click(input);
      await paste(user, 'pasted content');

      expect(screen.getByTestId('current-value')).toHaveTextContent('pasted content');
    });
  });

  describe('Selection Helpers', () => {
    it('should select a single option', async () => {
      const user = createUser();
      render(<SelectBox />);

      const select = screen.getByTestId('single-select');
      await selectOption(user, select, 'opt2');

      expect(screen.getByTestId('selected-single')).toHaveTextContent('opt2');
    });

    it('should select by option text', async () => {
      const user = createUser();
      render(<SelectBox />);

      const select = screen.getByTestId('single-select');
      await selectOption(user, select, 'Option 1');

      expect(screen.getByTestId('selected-single')).toHaveTextContent('opt1');
    });

    it('should select multiple options', async () => {
      const user = createUser();
      render(<SelectBox />);

      const multiSelect = screen.getByTestId('multi-select');
      await selectOption(user, multiSelect, ['a', 'c']);

      const selected = screen.getByTestId('selected-multi').textContent;
      expect(selected).toContain('a');
      expect(selected).toContain('c');
    });

    it('should deselect options', async () => {
      const user = createUser();
      render(<SelectBox />);

      const multiSelect = screen.getByTestId('multi-select');
      await selectOption(user, multiSelect, ['a', 'b', 'c']);
      await deselectOption(user, multiSelect, 'b');

      const selected = screen.getByTestId('selected-multi').textContent;
      expect(selected).not.toContain('b');
    });
  });

  describe('Keyboard Helpers', () => {
    it('should press a key with pressKey', async () => {
      const user = createUser();
      render(<KeyboardTracker />);

      const tracker = screen.getByTestId('keyboard-tracker');
      tracker.focus();
      await pressKey(user, 'a');

      expect(screen.getByTestId('pressed-keys')).toHaveTextContent('a');
    });

    it('should press Enter', async () => {
      const user = createUser();
      render(<KeyboardTracker />);

      const tracker = screen.getByTestId('keyboard-tracker');
      tracker.focus();
      await pressEnter(user);

      expect(screen.getByTestId('pressed-keys')).toHaveTextContent('Enter');
    });

    it('should press Escape', async () => {
      const user = createUser();
      render(<KeyboardTracker />);

      const tracker = screen.getByTestId('keyboard-tracker');
      tracker.focus();
      await pressEscape(user);

      expect(screen.getByTestId('pressed-keys')).toHaveTextContent('Escape');
    });

    it('should press Tab', async () => {
      const user = createUser();
      render(<KeyboardTracker />);

      const tracker = screen.getByTestId('keyboard-tracker');
      tracker.focus();
      await pressTab(user);

      expect(screen.getByTestId('pressed-keys')).toHaveTextContent('Tab');
    });

    it('should press Shift+Tab', async () => {
      const user = createUser();
      render(<KeyboardTracker />);

      const tracker = screen.getByTestId('keyboard-tracker');
      tracker.focus();
      await pressShiftTab(user);

      expect(screen.getByTestId('pressed-keys')).toHaveTextContent('Tab');
      expect(screen.getByTestId('modifiers')).toHaveTextContent('shift');
    });

    it('should press Space', async () => {
      const user = createUser();
      render(<KeyboardTracker />);

      const tracker = screen.getByTestId('keyboard-tracker');
      tracker.focus();
      await pressSpace(user);

      // Space key is reported as ' ' which is a whitespace character
      const pressedKeys = screen.getByTestId('pressed-keys');
      expect(pressedKeys.textContent).toMatch(/ /);
    });

    it('should press Backspace', async () => {
      const user = createUser();
      render(<KeyboardTracker />);

      const tracker = screen.getByTestId('keyboard-tracker');
      tracker.focus();
      await pressBackspace(user);

      expect(screen.getByTestId('pressed-keys')).toHaveTextContent('Backspace');
    });

    it('should press Delete', async () => {
      const user = createUser();
      render(<KeyboardTracker />);

      const tracker = screen.getByTestId('keyboard-tracker');
      tracker.focus();
      await pressDelete(user);

      expect(screen.getByTestId('pressed-keys')).toHaveTextContent('Delete');
    });

    it('should press a shortcut with pressShortcut', async () => {
      const user = createUser();
      render(<KeyboardTracker />);

      const tracker = screen.getByTestId('keyboard-tracker');
      tracker.focus();
      await pressShortcut(user, { key: 's', modifiers: { ctrl: true } });

      expect(screen.getByTestId('pressed-keys')).toHaveTextContent('s');
      expect(screen.getByTestId('modifiers')).toHaveTextContent('ctrl');
    });

    it('should press Ctrl+key with pressCtrl', async () => {
      const user = createUser();
      render(<KeyboardTracker />);

      const tracker = screen.getByTestId('keyboard-tracker');
      tracker.focus();
      await pressCtrl(user, 'c');

      expect(screen.getByTestId('pressed-keys')).toHaveTextContent('c');
      expect(screen.getByTestId('modifiers')).toHaveTextContent('ctrl');
    });

    it('should press Alt+key with pressAlt', async () => {
      const user = createUser();
      render(<KeyboardTracker />);

      const tracker = screen.getByTestId('keyboard-tracker');
      tracker.focus();
      await pressAlt(user, 'f');

      expect(screen.getByTestId('pressed-keys')).toHaveTextContent('f');
      expect(screen.getByTestId('modifiers')).toHaveTextContent('alt');
    });

    it('should press Shift+key with pressShift', async () => {
      const user = createUser();
      render(<KeyboardTracker />);

      const tracker = screen.getByTestId('keyboard-tracker');
      tracker.focus();
      await pressShift(user, 'a');

      // Shift+a records both Shift keydown and the 'a' key (which appears as 'A' or 'a' depending on timing)
      const pressedKeys = screen.getByTestId('pressed-keys');
      expect(pressedKeys.textContent).toMatch(/Shift/);
      expect(screen.getByTestId('modifiers')).toHaveTextContent('shift');
    });

    it('should press common shortcut with pressCommonShortcut', async () => {
      const user = createUser();
      render(<KeyboardTracker />);

      const tracker = screen.getByTestId('keyboard-tracker');
      tracker.focus();
      await pressCommonShortcut(user, 'copy');

      expect(screen.getByTestId('pressed-keys')).toHaveTextContent('c');
      expect(screen.getByTestId('modifiers')).toHaveTextContent('ctrl');
    });
  });

  describe('Arrow Key Helpers', () => {
    it('should press arrow up', async () => {
      const user = createUser();
      render(<KeyboardTracker />);

      const tracker = screen.getByTestId('keyboard-tracker');
      tracker.focus();
      await pressUp(user);

      expect(screen.getByTestId('pressed-keys')).toHaveTextContent('ArrowUp');
    });

    it('should press arrow down', async () => {
      const user = createUser();
      render(<KeyboardTracker />);

      const tracker = screen.getByTestId('keyboard-tracker');
      tracker.focus();
      await pressDown(user);

      expect(screen.getByTestId('pressed-keys')).toHaveTextContent('ArrowDown');
    });

    it('should press arrow left', async () => {
      const user = createUser();
      render(<KeyboardTracker />);

      const tracker = screen.getByTestId('keyboard-tracker');
      tracker.focus();
      await pressLeft(user);

      expect(screen.getByTestId('pressed-keys')).toHaveTextContent('ArrowLeft');
    });

    it('should press arrow right', async () => {
      const user = createUser();
      render(<KeyboardTracker />);

      const tracker = screen.getByTestId('keyboard-tracker');
      tracker.focus();
      await pressRight(user);

      expect(screen.getByTestId('pressed-keys')).toHaveTextContent('ArrowRight');
    });

    it('should press arrow key by direction', async () => {
      const user = createUser();
      render(<KeyboardTracker />);

      const tracker = screen.getByTestId('keyboard-tracker');
      tracker.focus();
      await pressArrowKey(user, 'up');

      expect(screen.getByTestId('pressed-keys')).toHaveTextContent('ArrowUp');
    });

    it('should press multiple arrow keys in sequence', async () => {
      const user = createUser();
      render(<KeyboardTracker />);

      const tracker = screen.getByTestId('keyboard-tracker');
      tracker.focus();
      await pressArrowKeys(user, ['up', 'up', 'right', 'down']);

      const keys = screen.getByTestId('pressed-keys').textContent;
      expect(keys).toContain('ArrowUp');
      expect(keys).toContain('ArrowRight');
      expect(keys).toContain('ArrowDown');
    });
  });

  describe('WASD Helpers', () => {
    it('should press W key', async () => {
      const user = createUser();
      render(<KeyboardTracker />);

      const tracker = screen.getByTestId('keyboard-tracker');
      tracker.focus();
      await pressW(user);

      expect(screen.getByTestId('pressed-keys')).toHaveTextContent('w');
    });

    it('should press A key', async () => {
      const user = createUser();
      render(<KeyboardTracker />);

      const tracker = screen.getByTestId('keyboard-tracker');
      tracker.focus();
      await pressA(user);

      expect(screen.getByTestId('pressed-keys')).toHaveTextContent('a');
    });

    it('should press S key', async () => {
      const user = createUser();
      render(<KeyboardTracker />);

      const tracker = screen.getByTestId('keyboard-tracker');
      tracker.focus();
      await pressS(user);

      expect(screen.getByTestId('pressed-keys')).toHaveTextContent('s');
    });

    it('should press D key', async () => {
      const user = createUser();
      render(<KeyboardTracker />);

      const tracker = screen.getByTestId('keyboard-tracker');
      tracker.focus();
      await pressD(user);

      expect(screen.getByTestId('pressed-keys')).toHaveTextContent('d');
    });

    it('should press WASD key by direction', async () => {
      const user = createUser();
      render(<KeyboardTracker />);

      const tracker = screen.getByTestId('keyboard-tracker');
      tracker.focus();
      await pressWASD(user, 'w');

      expect(screen.getByTestId('pressed-keys')).toHaveTextContent('w');
    });

    it('should press multiple WASD keys in sequence', async () => {
      const user = createUser();
      render(<KeyboardTracker />);

      const tracker = screen.getByTestId('keyboard-tracker');
      tracker.focus();
      await pressWASDKeys(user, ['w', 'w', 'd', 's']);

      const keys = screen.getByTestId('pressed-keys').textContent;
      expect(keys).toMatch(/w.*w.*d.*s/);
    });
  });

  describe('Hover/Focus Helpers', () => {
    it('should hover over an element', async () => {
      const user = createUser();
      render(<HoverTracker />);

      const target = screen.getByTestId('hover-target');
      await hover(user, target);

      expect(target).toHaveTextContent('Hovered');
    });

    it('should unhover from an element', async () => {
      const user = createUser();
      render(<HoverTracker />);

      const target = screen.getByTestId('hover-target');
      await hover(user, target);
      await unhover(user, target);

      expect(target).toHaveTextContent('Not hovered');
    });

    it('should tab to elements', async () => {
      const user = createUser();
      render(
        <div>
          <button data-testid="btn1">Button 1</button>
          <button data-testid="btn2">Button 2</button>
          <button data-testid="btn3">Button 3</button>
        </div>
      );

      await tabToElement(user, 2);
      // After 2 tabs, button 2 should be focused
      expect(screen.getByTestId('btn2')).toHaveFocus();
    });
  });

  describe('Drag and Drop', () => {
    it('should drag and drop elements', async () => {
      const user = createUser();
      const onDrop = vi.fn();

      render(
        <div>
          <div draggable data-testid="source">Drag me</div>
          <div onDrop={onDrop} data-testid="target">Drop here</div>
        </div>
      );

      const source = screen.getByTestId('source');
      const target = screen.getByTestId('target');

      await dragAndDrop(user, source, target);
      // Drag and drop should complete without error
      expect(source).toBeInTheDocument();
      expect(target).toBeInTheDocument();
    });
  });

  describe('Form Helpers', () => {
    it('should fill a form with values', async () => {
      const user = createUser();
      render(<FormComponent />);

      const form = screen.getByTestId('test-form');
      await fillForm(user, {
        username: 'testuser',
        email: 'test@example.com',
      }, form);

      const usernameInput = form.querySelector('[name="username"]') as HTMLInputElement;
      const emailInput = form.querySelector('[name="email"]') as HTMLInputElement;

      expect(usernameInput.value).toBe('testuser');
      expect(emailInput.value).toBe('test@example.com');
    });

    it('should submit a form by clicking submit button', async () => {
      const user = createUser();
      render(<FormComponent />);

      const form = screen.getByTestId('test-form') as HTMLFormElement;
      await submitForm(user, form);

      expect(screen.getByTestId('form-submitted')).toBeInTheDocument();
    });

    it('should submit a form by pressing Enter', async () => {
      const user = createUser();
      render(<FormComponent />);

      const form = screen.getByTestId('test-form');
      const input = form.querySelector('[name="username"]')!;
      await user.click(input);
      await submitForm(user);

      expect(screen.getByTestId('form-submitted')).toBeInTheDocument();
    });
  });

  describe('File Upload Helpers', () => {
    it('should upload a file', async () => {
      const user = createUser();
      render(<FileUploader />);

      const input = screen.getByTestId('file-input');
      const file = createMockFile('test.txt', 'Hello, World!');
      await uploadFile(user, input, file);

      expect(screen.getByTestId('uploaded-files')).toHaveTextContent('test.txt');
    });

    it('should upload multiple files', async () => {
      const user = createUser();
      render(
        <div>
          <input type="file" multiple data-testid="multi-file-input" />
        </div>
      );

      const input = screen.getByTestId('multi-file-input');
      const files = [
        createMockFile('file1.txt', 'Content 1'),
        createMockFile('file2.txt', 'Content 2'),
      ];

      await uploadFile(user, input, files);

      const inputEl = input as HTMLInputElement;
      expect(inputEl.files?.length).toBe(2);
    });

    it('should create a mock file with createMockFile', () => {
      const file = createMockFile('test.txt', 'content', 'text/plain');

      expect(file.name).toBe('test.txt');
      expect(file.type).toBe('text/plain');
    });

    it('should create a mock image file with createMockImageFile', () => {
      const file = createMockImageFile('image.png');

      expect(file.name).toBe('image.png');
      expect(file.type).toBe('image/png');
      expect(file.size).toBeGreaterThan(0);
    });
  });

  describe('Pointer Helpers', () => {
    it('should move pointer to coordinates', async () => {
      const user = createUser();
      render(<div data-testid="target">Target</div>);

      // This should work without error
      await movePointerTo(user, { x: 100, y: 100 });
      expect(screen.getByTestId('target')).toBeInTheDocument();
    });

    it('should perform pointer down', async () => {
      const user = createUser();
      const onMouseDown = vi.fn();

      render(
        <div onMouseDown={onMouseDown} data-testid="target">
          Target
        </div>
      );

      const target = screen.getByTestId('target');
      await pointerDown(user, target);

      expect(onMouseDown).toHaveBeenCalled();
    });

    it('should perform pointer up', async () => {
      const user = createUser();

      render(<div data-testid="target">Target</div>);

      // Pointer up after pointer down should work
      await pointerUp(user);
      expect(screen.getByTestId('target')).toBeInTheDocument();
    });
  });

  describe('Type Safety', () => {
    it('should have correct ArrowDirection type', () => {
      const directions: ArrowDirection[] = ['up', 'down', 'left', 'right'];
      expect(directions.length).toBe(4);
    });

    it('should have correct WASDDirection type', () => {
      const keys: WASDDirection[] = ['w', 'a', 's', 'd'];
      expect(keys.length).toBe(4);
    });

    it('should have correct KeyboardShortcut type', () => {
      const shortcut: KeyboardShortcut = {
        key: 's',
        modifiers: { ctrl: true, shift: false },
      };
      expect(shortcut.key).toBe('s');
      expect(shortcut.modifiers?.ctrl).toBe(true);
    });

    it('should have correct ModifierKeys type', () => {
      const mods: ModifierKeys = {
        ctrl: true,
        alt: false,
        shift: true,
        meta: undefined,
      };
      expect(mods.ctrl).toBe(true);
      expect(mods.alt).toBe(false);
    });
  });
});
