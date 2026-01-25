/**
 * Input Manager Tests
 *
 * Tests for keyboard/gamepad input handling, input state management,
 * and direction utilities.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createInputManager,
  isDirectionPressed,
  getPrimaryDirection,
  getDirectionsArray,
  hasAnyInput,
  mergeInputs,
} from '../input-manager';
import type { GameInput, Direction } from '../types';

describe('Input Manager', () => {
  beforeEach(() => {
    // Clear any existing event listeners
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createInputManager', () => {
    it('should create input manager with default config', () => {
      const manager = createInputManager();

      expect(manager).toBeDefined();
      expect(manager.getInput).toBeDefined();
      expect(manager.isKeyPressed).toBeDefined();
      expect(manager.destroy).toBeDefined();
    });

    it('should track key press', () => {
      const manager = createInputManager();

      // Simulate key press
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      document.dispatchEvent(event);

      expect(manager.isKeyPressed('ArrowUp')).toBe(true);

      manager.destroy();
    });

    it('should track key release', () => {
      const manager = createInputManager();

      // Simulate key press and release
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      document.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' }));

      expect(manager.isKeyPressed('ArrowUp')).toBe(false);

      manager.destroy();
    });

    it('should return game input state', () => {
      const manager = createInputManager();

      // Press arrow keys
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Space' }));

      const input = manager.getInput();

      expect(input.up).toBe(true);
      expect(input.action).toBe(true);

      manager.destroy();
    });

    it('should call key down handler', () => {
      const handler = vi.fn();
      const manager = createInputManager();

      manager.onKeyDown('ArrowUp', handler);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));

      expect(handler).toHaveBeenCalled();

      manager.destroy();
    });

    it('should call key up handler', () => {
      const handler = vi.fn();
      const manager = createInputManager();

      manager.onKeyUp('Space', handler);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Space' }));
      document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Space' }));

      expect(handler).toHaveBeenCalled();

      manager.destroy();
    });

    it('should remove handler when unregister is called', () => {
      const handler = vi.fn();
      const manager = createInputManager();

      const unregister = manager.onKeyDown('ArrowUp', handler);
      unregister();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));

      expect(handler).not.toHaveBeenCalled();

      manager.destroy();
    });

    it('should clear all input on reset', () => {
      const manager = createInputManager();

      // Press keys
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Space' }));

      manager.reset();

      const input = manager.getInput();

      expect(input.up).toBe(false);
      expect(input.action).toBe(false);

      manager.destroy();
    });

    it('should destroy cleanly', () => {
      const manager = createInputManager();

      manager.destroy();

      // Key presses after destroy should not be tracked
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));

      const input = manager.getInput();
      expect(input.up).toBe(false);
    });
  });

  describe('isDirectionPressed', () => {
    it('should detect up direction', () => {
      const input: GameInput = {
        up: true,
        down: false,
        left: false,
        right: false,
        action: false,
        pause: false,
      };

      expect(isDirectionPressed(input, 'up')).toBe(true);
    });

    it('should detect down direction', () => {
      const input: GameInput = {
        up: false,
        down: true,
        left: false,
        right: false,
        action: false,
        pause: false,
      };

      expect(isDirectionPressed(input, 'down')).toBe(true);
    });

    it('should return false for non-pressed direction', () => {
      const input: GameInput = {
        up: true,
        down: false,
        left: false,
        right: false,
        action: false,
        pause: false,
      };

      expect(isDirectionPressed(input, 'down')).toBe(false);
    });
  });

  describe('getPrimaryDirection', () => {
    it('should return up as primary direction', () => {
      const input: GameInput = {
        up: true,
        down: false,
        left: false,
        right: false,
        action: false,
        pause: false,
      };

      expect(getPrimaryDirection(input)).toBe('up');
    });

    it('should prioritize vertical over horizontal', () => {
      const input: GameInput = {
        up: true,
        down: false,
        left: true,
        right: false,
        action: false,
        pause: false,
      };

      const direction = getPrimaryDirection(input);
      expect(['up', 'down'].includes(direction as string)).toBe(true);
    });

    it('should return null when no direction pressed', () => {
      const input: GameInput = {
        up: false,
        down: false,
        left: false,
        right: false,
        action: false,
        pause: false,
      };

      expect(getPrimaryDirection(input)).toBeNull();
    });
  });

  describe('getDirectionsArray', () => {
    it('should return all pressed directions', () => {
      const input: GameInput = {
        up: true,
        down: false,
        left: true,
        right: false,
        action: false,
        pause: false,
      };

      const directions = getDirectionsArray(input);

      expect(directions).toContain('up');
      expect(directions).toContain('left');
      expect(directions).toHaveLength(2);
    });

    it('should return empty array when no directions pressed', () => {
      const input: GameInput = {
        up: false,
        down: false,
        left: false,
        right: false,
        action: false,
        pause: false,
      };

      const directions = getDirectionsArray(input);

      expect(directions).toHaveLength(0);
    });

    it('should handle all four directions', () => {
      const input: GameInput = {
        up: true,
        down: true,
        left: true,
        right: true,
        action: false,
        pause: false,
      };

      const directions = getDirectionsArray(input);

      expect(directions).toHaveLength(4);
    });
  });

  describe('hasAnyInput', () => {
    it('should return true when any direction is pressed', () => {
      const input: GameInput = {
        up: true,
        down: false,
        left: false,
        right: false,
        action: false,
        pause: false,
      };

      expect(hasAnyInput(input)).toBe(true);
    });

    it('should return true when action is pressed', () => {
      const input: GameInput = {
        up: false,
        down: false,
        left: false,
        right: false,
        action: true,
        pause: false,
      };

      expect(hasAnyInput(input)).toBe(true);
    });

    it('should return false when no input is pressed', () => {
      const input: GameInput = {
        up: false,
        down: false,
        left: false,
        right: false,
        action: false,
        pause: false,
      };

      expect(hasAnyInput(input)).toBe(false);
    });
  });

  describe('mergeInputs', () => {
    it('should merge two inputs', () => {
      const input1: GameInput = {
        up: true,
        down: false,
        left: false,
        right: false,
        action: false,
        pause: false,
      };

      const input2: GameInput = {
        up: false,
        down: false,
        left: true,
        right: false,
        action: true,
        pause: false,
      };

      const merged = mergeInputs(input1, input2);

      expect(merged.up).toBe(true);
      expect(merged.left).toBe(true);
      expect(merged.action).toBe(true);
    });

    it('should merge multiple inputs', () => {
      const input1: GameInput = {
        up: true,
        down: false,
        left: false,
        right: false,
        action: false,
        pause: false,
      };

      const input2: GameInput = {
        up: false,
        down: true,
        left: false,
        right: false,
        action: false,
        pause: false,
      };

      const input3: GameInput = {
        up: false,
        down: false,
        left: true,
        right: false,
        action: true,
        pause: false,
      };

      const merged = mergeInputs(input1, input2, input3);

      expect(merged.up).toBe(true);
      expect(merged.down).toBe(true);
      expect(merged.left).toBe(true);
      expect(merged.action).toBe(true);
    });
  });
});
