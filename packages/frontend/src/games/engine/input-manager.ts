/**
 * Input Manager
 *
 * Centralized input handling for all games in the x402 Arcade.
 * Abstracts input handling from game logic for cleaner code and
 * supports multiple input sources (keyboard, touch, gamepad).
 *
 * @module games/engine/input-manager
 */

import type { Vector2D } from './types';
import type { Direction, GameInput } from '../types';
import { createEmptyInput } from '../types';
import {
  createTouchInputHandler,
  type TouchInputHandler,
  type TouchInputConfig,
} from './touch-input';
import { createInputBuffer, type InputBuffer, type InputBufferConfig } from './input-buffer';

// ============================================================================
// Input Manager Types
// ============================================================================

/**
 * Input source identifier
 */
export type InputSource = 'keyboard' | 'touch' | 'gamepad' | 'mouse';

/**
 * Input action that can be mapped to keys
 */
export type InputAction = 'up' | 'down' | 'left' | 'right' | 'action' | 'secondaryAction' | 'pause';

/**
 * Keyboard key mapping configuration
 */
export interface KeyMapping {
  /** Keys for up direction */
  up: string[];
  /** Keys for down direction */
  down: string[];
  /** Keys for left direction */
  left: string[];
  /** Keys for right direction */
  right: string[];
  /** Keys for primary action */
  action: string[];
  /** Keys for secondary action */
  secondaryAction: string[];
  /** Keys for pause */
  pause: string[];
}

/**
 * Input handler callback function
 */
export type InputHandler = (action: InputAction, pressed: boolean) => void;

/**
 * Registered input handler with metadata
 */
export interface RegisteredHandler {
  /** Unique handler ID */
  id: string;
  /** Handler function */
  handler: InputHandler;
  /** Whether handler is enabled */
  enabled: boolean;
  /** Priority (higher = called first) */
  priority: number;
}

/**
 * Input manager configuration
 */
export interface InputManagerConfig {
  /** Key mapping configuration */
  keyMapping: KeyMapping;
  /** Touch input configuration */
  touchConfig?: Partial<TouchInputConfig>;
  /** Input buffer configuration */
  bufferConfig?: Partial<InputBufferConfig>;
  /** Whether to prevent default browser behavior */
  preventDefault: boolean;
  /** Whether to enable keyboard input */
  enableKeyboard: boolean;
  /** Whether to enable touch input */
  enableTouch: boolean;
  /** Whether to enable mouse input */
  enableMouse: boolean;
  /** Whether to enable input buffering */
  enableBuffering: boolean;
}

/**
 * Input state snapshot
 */
export interface InputState {
  /** Currently pressed directions */
  directions: Set<Direction>;
  /** Primary action pressed */
  action: boolean;
  /** Secondary action pressed */
  secondaryAction: boolean;
  /** Pause pressed */
  pause: boolean;
  /** Pointer/touch position */
  pointer: Vector2D | null;
  /** Whether pointer is down */
  pointerDown: boolean;
  /** Active input sources */
  activeSources: Set<InputSource>;
  /** Raw key states */
  keys: Map<string, boolean>;
}

/**
 * Input manager interface
 */
export interface InputManager {
  /** Get current input state as GameInput */
  getInput: () => GameInput;
  /** Get raw input state */
  getState: () => InputState;
  /** Check if specific action is pressed */
  isActionPressed: (action: InputAction) => boolean;
  /** Check if specific direction is pressed */
  isDirectionPressed: (direction: Direction) => boolean;
  /** Register an input handler */
  registerHandler: (id: string, handler: InputHandler, priority?: number) => void;
  /** Unregister an input handler */
  unregisterHandler: (id: string) => void;
  /** Enable/disable a handler */
  setHandlerEnabled: (id: string, enabled: boolean) => void;
  /** Get all registered handlers */
  getHandlers: () => RegisteredHandler[];
  /** Update key mapping */
  setKeyMapping: (mapping: Partial<KeyMapping>) => void;
  /** Get current key mapping */
  getKeyMapping: () => KeyMapping;
  /** Enable/disable an input source */
  setSourceEnabled: (source: InputSource, enabled: boolean) => void;
  /** Check if an input source is enabled */
  isSourceEnabled: (source: InputSource) => boolean;
  /** Attach to a canvas element (for touch/mouse) */
  attach: (canvas: HTMLCanvasElement) => void;
  /** Detach from canvas */
  detach: () => void;
  /** Reset all input state */
  reset: () => void;
  /** Clear all handlers */
  clearHandlers: () => void;
  /** Clean up and remove all listeners */
  dispose: () => void;
  /** Get the input buffer (if buffering is enabled) */
  getBuffer: () => InputBuffer | null;
  /** Capture the current frame input (call once per frame) */
  captureFrame: (frame: number) => void;
  /** Check if action was pressed in frame window (for frame-perfect inputs) */
  wasActionPressedInWindow: (action: InputAction, currentFrame: number) => boolean;
  /** Check if action was released in frame window */
  wasActionReleasedInWindow: (action: InputAction, currentFrame: number) => boolean;
}

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Default key mapping for games
 */
export const DEFAULT_KEY_MAPPING: KeyMapping = {
  up: ['ArrowUp', 'KeyW', 'Numpad8'],
  down: ['ArrowDown', 'KeyS', 'Numpad2'],
  left: ['ArrowLeft', 'KeyA', 'Numpad4'],
  right: ['ArrowRight', 'KeyD', 'Numpad6'],
  action: ['Space', 'Enter', 'KeyZ'],
  secondaryAction: ['ShiftLeft', 'ShiftRight', 'KeyX'],
  pause: ['Escape', 'KeyP'],
};

/**
 * Default input manager configuration
 */
export const DEFAULT_INPUT_CONFIG: InputManagerConfig = {
  keyMapping: DEFAULT_KEY_MAPPING,
  preventDefault: true,
  enableKeyboard: true,
  enableTouch: true,
  enableMouse: true,
  enableBuffering: false,
};

// ============================================================================
// Input Manager Implementation
// ============================================================================

/**
 * Creates an input manager instance
 *
 * @param config - Optional configuration overrides
 * @returns InputManager instance
 *
 * @example
 * ```ts
 * const inputManager = createInputManager();
 *
 * // Register a handler for input events
 * inputManager.registerHandler('game', (action, pressed) => {
 *   console.log(`${action} ${pressed ? 'pressed' : 'released'}`);
 * });
 *
 * // Attach to canvas for touch/mouse support
 * inputManager.attach(canvasElement);
 *
 * // In game loop, poll input state
 * const input = inputManager.getInput();
 * if (input.directions.has('up')) {
 *   player.moveUp();
 * }
 *
 * // Cleanup when done
 * inputManager.dispose();
 * ```
 */
export function createInputManager(config: Partial<InputManagerConfig> = {}): InputManager {
  const fullConfig: InputManagerConfig = {
    ...DEFAULT_INPUT_CONFIG,
    ...config,
    keyMapping: {
      ...DEFAULT_KEY_MAPPING,
      ...config.keyMapping,
    },
  };

  // State
  const state: InputState = {
    directions: new Set<Direction>(),
    action: false,
    secondaryAction: false,
    pause: false,
    pointer: null,
    pointerDown: false,
    activeSources: new Set<InputSource>(),
    keys: new Map<string, boolean>(),
  };

  // Handlers registry
  const handlers: Map<string, RegisteredHandler> = new Map();

  // Touch input handler
  let touchHandler: TouchInputHandler | null = null;

  // Input buffer (if enabled)
  let inputBuffer: InputBuffer | null = null;
  if (fullConfig.enableBuffering) {
    inputBuffer = createInputBuffer(fullConfig.bufferConfig);
  }

  // Canvas reference
  let canvas: HTMLCanvasElement | null = null;

  // Source enabled state
  const sourcesEnabled: Map<InputSource, boolean> = new Map([
    ['keyboard', fullConfig.enableKeyboard],
    ['touch', fullConfig.enableTouch],
    ['mouse', fullConfig.enableMouse],
    ['gamepad', false], // Future support
  ]);

  // Current key mapping
  let keyMapping: KeyMapping = { ...fullConfig.keyMapping };

  // Bound event handlers
  let boundKeyDown: ((e: KeyboardEvent) => void) | null = null;
  let boundKeyUp: ((e: KeyboardEvent) => void) | null = null;
  let boundMouseDown: ((e: MouseEvent) => void) | null = null;
  let boundMouseUp: ((e: MouseEvent) => void) | null = null;
  let boundMouseMove: ((e: MouseEvent) => void) | null = null;
  let boundBlur: (() => void) | null = null;

  /**
   * Get action for a key code
   */
  function getActionForKey(code: string): InputAction | null {
    for (const [action, keys] of Object.entries(keyMapping)) {
      if (keys.includes(code)) {
        return action as InputAction;
      }
    }
    return null;
  }

  /**
   * Notify all handlers of an input event
   */
  function notifyHandlers(action: InputAction, pressed: boolean): void {
    // Sort handlers by priority (descending)
    const sortedHandlers = Array.from(handlers.values())
      .filter((h) => h.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const handler of sortedHandlers) {
      handler.handler(action, pressed);
    }
  }

  /**
   * Update state for an action
   */
  function updateActionState(action: InputAction, pressed: boolean): void {
    const directions: Direction[] = ['up', 'down', 'left', 'right'];

    if (directions.includes(action as Direction)) {
      if (pressed) {
        state.directions.add(action as Direction);
      } else {
        state.directions.delete(action as Direction);
      }
    } else if (action === 'action') {
      state.action = pressed;
    } else if (action === 'secondaryAction') {
      state.secondaryAction = pressed;
    } else if (action === 'pause') {
      state.pause = pressed;
    }
  }

  /**
   * Handle keyboard down event
   */
  function handleKeyDown(event: KeyboardEvent): void {
    if (!sourcesEnabled.get('keyboard')) return;

    const action = getActionForKey(event.code);
    if (action) {
      if (fullConfig.preventDefault) {
        event.preventDefault();
      }

      // Only trigger if not already pressed (prevent repeat events)
      if (!state.keys.get(event.code)) {
        state.keys.set(event.code, true);
        state.activeSources.add('keyboard');
        updateActionState(action, true);
        notifyHandlers(action, true);

        // Add to buffer if enabled (frame will be set when captureFrame is called)
        if (inputBuffer) {
          inputBuffer.addEvent(action, true, -1);
        }
      }
    }
  }

  /**
   * Handle keyboard up event
   */
  function handleKeyUp(event: KeyboardEvent): void {
    if (!sourcesEnabled.get('keyboard')) return;

    const action = getActionForKey(event.code);
    if (action) {
      if (fullConfig.preventDefault) {
        event.preventDefault();
      }

      state.keys.set(event.code, false);
      updateActionState(action, false);
      notifyHandlers(action, false);

      // Add to buffer if enabled
      if (inputBuffer) {
        inputBuffer.addEvent(action, false, -1);
      }

      // Check if any keyboard keys are still pressed
      const anyKeyPressed = Array.from(state.keys.values()).some((v) => v);
      if (!anyKeyPressed) {
        state.activeSources.delete('keyboard');
      }
    }
  }

  /**
   * Handle mouse down event
   */
  function handleMouseDown(event: MouseEvent): void {
    if (!sourcesEnabled.get('mouse') || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    state.pointer = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
    state.pointerDown = true;
    state.activeSources.add('mouse');
  }

  /**
   * Handle mouse up event
   */
  function handleMouseUp(_event: MouseEvent): void {
    if (!sourcesEnabled.get('mouse')) return;

    state.pointerDown = false;
    state.activeSources.delete('mouse');
  }

  /**
   * Handle mouse move event
   */
  function handleMouseMove(event: MouseEvent): void {
    if (!sourcesEnabled.get('mouse') || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    state.pointer = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  /**
   * Handle window blur (release all keys)
   */
  function handleBlur(): void {
    // Release all keys
    state.keys.clear();
    state.directions.clear();
    state.action = false;
    state.secondaryAction = false;
    state.pause = false;
    state.activeSources.clear();
  }

  /**
   * Setup keyboard listeners
   */
  function setupKeyboardListeners(): void {
    boundKeyDown = handleKeyDown;
    boundKeyUp = handleKeyUp;
    boundBlur = handleBlur;

    window.addEventListener('keydown', boundKeyDown);
    window.addEventListener('keyup', boundKeyUp);
    window.addEventListener('blur', boundBlur);
  }

  /**
   * Remove keyboard listeners
   */
  function removeKeyboardListeners(): void {
    if (boundKeyDown) {
      window.removeEventListener('keydown', boundKeyDown);
      boundKeyDown = null;
    }
    if (boundKeyUp) {
      window.removeEventListener('keyup', boundKeyUp);
      boundKeyUp = null;
    }
    if (boundBlur) {
      window.removeEventListener('blur', boundBlur);
      boundBlur = null;
    }
  }

  /**
   * Setup mouse listeners
   */
  function setupMouseListeners(targetCanvas: HTMLCanvasElement): void {
    boundMouseDown = handleMouseDown;
    boundMouseUp = handleMouseUp;
    boundMouseMove = handleMouseMove;

    targetCanvas.addEventListener('mousedown', boundMouseDown);
    targetCanvas.addEventListener('mouseup', boundMouseUp);
    targetCanvas.addEventListener('mousemove', boundMouseMove);
    // Also listen on window for mouseup to handle dragging outside canvas
    window.addEventListener('mouseup', boundMouseUp);
  }

  /**
   * Remove mouse listeners
   */
  function removeMouseListeners(): void {
    if (canvas && boundMouseDown) {
      canvas.removeEventListener('mousedown', boundMouseDown);
    }
    if (canvas && boundMouseMove) {
      canvas.removeEventListener('mousemove', boundMouseMove);
    }
    if (boundMouseUp) {
      window.removeEventListener('mouseup', boundMouseUp);
    }
    boundMouseDown = null;
    boundMouseUp = null;
    boundMouseMove = null;
  }

  // Initialize keyboard listeners immediately
  if (fullConfig.enableKeyboard) {
    setupKeyboardListeners();
  }

  return {
    getInput(): GameInput {
      // Merge touch swipe direction if available
      if (touchHandler) {
        const swipeDir = touchHandler.getSwipeDirection();
        if (swipeDir) {
          state.directions.add(swipeDir);
          touchHandler.clearSwipe();
        }

        // Update touch state
        if (touchHandler.isTouching()) {
          state.activeSources.add('touch');
          const pos = touchHandler.getPosition();
          if (pos) {
            state.pointer = pos;
            state.pointerDown = true;
          }
        }
      }

      return {
        directions: new Set(state.directions),
        action: state.action,
        secondaryAction: state.secondaryAction,
        pause: state.pause,
        pointer: state.pointer ? { ...state.pointer } : null,
        pointerDown: state.pointerDown,
      };
    },

    getState(): InputState {
      return {
        ...state,
        directions: new Set(state.directions),
        activeSources: new Set(state.activeSources),
        keys: new Map(state.keys),
      };
    },

    isActionPressed(action: InputAction): boolean {
      if (action === 'action') return state.action;
      if (action === 'secondaryAction') return state.secondaryAction;
      if (action === 'pause') return state.pause;
      return state.directions.has(action as Direction);
    },

    isDirectionPressed(direction: Direction): boolean {
      return state.directions.has(direction);
    },

    registerHandler(id: string, handler: InputHandler, priority: number = 0): void {
      handlers.set(id, {
        id,
        handler,
        enabled: true,
        priority,
      });
    },

    unregisterHandler(id: string): void {
      handlers.delete(id);
    },

    setHandlerEnabled(id: string, enabled: boolean): void {
      const handler = handlers.get(id);
      if (handler) {
        handler.enabled = enabled;
      }
    },

    getHandlers(): RegisteredHandler[] {
      return Array.from(handlers.values());
    },

    setKeyMapping(mapping: Partial<KeyMapping>): void {
      keyMapping = { ...keyMapping, ...mapping };
    },

    getKeyMapping(): KeyMapping {
      return { ...keyMapping };
    },

    setSourceEnabled(source: InputSource, enabled: boolean): void {
      sourcesEnabled.set(source, enabled);

      // Handle keyboard listeners
      if (source === 'keyboard') {
        if (enabled && !boundKeyDown) {
          setupKeyboardListeners();
        } else if (!enabled && boundKeyDown) {
          removeKeyboardListeners();
        }
      }

      // Handle touch handler
      if (source === 'touch' && touchHandler) {
        if (enabled && canvas) {
          touchHandler.attach(canvas);
        } else {
          touchHandler.detach();
        }
      }

      // Handle mouse listeners
      if (source === 'mouse') {
        if (enabled && canvas && !boundMouseDown) {
          setupMouseListeners(canvas);
        } else if (!enabled && boundMouseDown) {
          removeMouseListeners();
        }
      }
    },

    isSourceEnabled(source: InputSource): boolean {
      return sourcesEnabled.get(source) ?? false;
    },

    attach(targetCanvas: HTMLCanvasElement): void {
      // Detach from previous canvas
      this.detach();

      canvas = targetCanvas;

      // Setup touch handler
      if (sourcesEnabled.get('touch')) {
        touchHandler = createTouchInputHandler(fullConfig.touchConfig, {
          onSwipe: (swipe) => {
            // Convert swipe to direction press
            state.directions.add(swipe.direction);
            state.activeSources.add('touch');
            notifyHandlers(swipe.direction, true);

            // Clear after a frame (will be processed in getInput)
            setTimeout(() => {
              state.directions.delete(swipe.direction);
              notifyHandlers(swipe.direction, false);
            }, 0);
          },
        });
        touchHandler.attach(targetCanvas);
      }

      // Setup mouse listeners
      if (sourcesEnabled.get('mouse')) {
        setupMouseListeners(targetCanvas);
      }
    },

    detach(): void {
      if (touchHandler) {
        touchHandler.dispose();
        touchHandler = null;
      }

      removeMouseListeners();
      canvas = null;
    },

    reset(): void {
      state.directions.clear();
      state.action = false;
      state.secondaryAction = false;
      state.pause = false;
      state.pointer = null;
      state.pointerDown = false;
      state.activeSources.clear();
      state.keys.clear();

      if (touchHandler) {
        touchHandler.reset();
      }
    },

    clearHandlers(): void {
      handlers.clear();
    },

    dispose(): void {
      this.detach();
      removeKeyboardListeners();
      this.reset();
      this.clearHandlers();

      // Dispose buffer if it exists
      if (inputBuffer) {
        inputBuffer.reset();
      }
    },

    getBuffer(): InputBuffer | null {
      return inputBuffer;
    },

    captureFrame(frame: number): void {
      if (inputBuffer) {
        const input = this.getInput();
        inputBuffer.captureFrame(frame, input);
        inputBuffer.cleanup(frame);
      }
    },

    wasActionPressedInWindow(action: InputAction, currentFrame: number): boolean {
      if (!inputBuffer) {
        return this.isActionPressed(action);
      }
      return inputBuffer.wasActionPressedInWindow(action, currentFrame);
    },

    wasActionReleasedInWindow(action: InputAction, currentFrame: number): boolean {
      if (!inputBuffer) {
        return false;
      }
      return inputBuffer.wasActionReleasedInWindow(action, currentFrame);
    },
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a direction key is pressed in the input state
 */
export function isDirectionPressed(input: GameInput, direction: Direction): boolean {
  return input.directions.has(direction);
}

/**
 * Get the primary direction from input (first pressed)
 */
export function getPrimaryDirection(input: GameInput): Direction | null {
  // Priority: up, down, left, right
  const priority: Direction[] = ['up', 'down', 'left', 'right'];
  for (const dir of priority) {
    if (input.directions.has(dir)) {
      return dir;
    }
  }
  return null;
}

/**
 * Get all pressed directions as an array
 */
export function getDirectionsArray(input: GameInput): Direction[] {
  return Array.from(input.directions);
}

/**
 * Check if any input is active
 */
export function hasAnyInput(input: GameInput): boolean {
  return (
    input.directions.size > 0 ||
    input.action ||
    input.secondaryAction ||
    input.pause ||
    input.pointerDown
  );
}

/**
 * Create a merged input from multiple sources
 */
export function mergeInputs(...inputs: GameInput[]): GameInput {
  const merged = createEmptyInput();

  for (const input of inputs) {
    for (const dir of input.directions) {
      merged.directions.add(dir);
    }
    merged.action = merged.action || input.action;
    merged.secondaryAction = merged.secondaryAction || input.secondaryAction;
    merged.pause = merged.pause || input.pause;

    // Use first non-null pointer
    if (!merged.pointer && input.pointer) {
      merged.pointer = { ...input.pointer };
    }
    merged.pointerDown = merged.pointerDown || input.pointerDown;
  }

  return merged;
}

// Note: All types are exported at their definitions via `export interface`
// No need for redundant re-exports here
