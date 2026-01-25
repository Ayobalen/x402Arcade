/**
 * Input Buffer System
 *
 * Advanced input handling for frame-perfect actions and input replay.
 * Provides input buffering to prevent dropped inputs and supports
 * deterministic replay for debugging and testing.
 *
 * @module games/engine/input-buffer
 */

import type { GameInput } from '../types';
import type { InputAction } from './input-manager';

// ============================================================================
// Input Buffer Types
// ============================================================================

/**
 * Timestamped input event for buffering
 */
export interface InputEvent {
  /** Frame number when input occurred */
  frame: number;
  /** Timestamp in milliseconds */
  timestamp: number;
  /** Input action that was triggered */
  action: InputAction;
  /** Whether the action was pressed or released */
  pressed: boolean;
}

/**
 * Buffered input state for a single frame
 */
export interface BufferedInput {
  /** Frame number */
  frame: number;
  /** Timestamp in milliseconds */
  timestamp: number;
  /** Complete input state */
  input: GameInput;
  /** Raw events that occurred this frame */
  events: InputEvent[];
}

/**
 * Input buffer configuration
 */
export interface InputBufferConfig {
  /** Maximum number of frames to buffer (default: 10) */
  maxBufferFrames: number;
  /** Input window size in frames for frame-perfect actions (default: 3) */
  frameWindow: number;
  /** Whether to enable input recording for replay (default: false) */
  enableRecording: boolean;
  /** Maximum number of frames to record (default: 36000 = 10 min at 60fps) */
  maxRecordFrames: number;
}

/**
 * Input recording for replay
 */
export interface InputRecording {
  /** Recording start timestamp */
  startTimestamp: number;
  /** Total number of frames recorded */
  totalFrames: number;
  /** Buffered inputs by frame number */
  frames: Map<number, BufferedInput>;
  /** Metadata about the recording */
  metadata: {
    /** Game type */
    gameType: string;
    /** Recording duration in milliseconds */
    duration: number;
    /** Target FPS */
    targetFps: number;
  };
}

/**
 * Serializable input recording format
 */
export interface SerializedRecording {
  /** Recording start timestamp */
  startTimestamp: number;
  /** Total number of frames recorded */
  totalFrames: number;
  /** Buffered inputs as array */
  frames: BufferedInput[];
  /** Metadata */
  metadata: {
    gameType: string;
    duration: number;
    targetFps: number;
  };
}

/**
 * Input buffer interface
 */
export interface InputBuffer {
  /** Add an input event to the buffer */
  addEvent: (action: InputAction, pressed: boolean, frame: number) => void;
  /** Capture the current input state for this frame */
  captureFrame: (frame: number, input: GameInput) => void;
  /** Get buffered input for a specific frame */
  getFrameInput: (frame: number) => BufferedInput | null;
  /** Check if an action was pressed within the frame window */
  wasActionPressedInWindow: (action: InputAction, currentFrame: number) => boolean;
  /** Check if an action was released within the frame window */
  wasActionReleasedInWindow: (action: InputAction, currentFrame: number) => boolean;
  /** Get all events in the frame window */
  getEventsInWindow: (currentFrame: number) => InputEvent[];
  /** Clear old frames outside the buffer window */
  cleanup: (currentFrame: number) => void;
  /** Reset the buffer */
  reset: () => void;
  /** Start recording inputs */
  startRecording: (gameType: string, targetFps: number) => void;
  /** Stop recording and return the recording */
  stopRecording: () => InputRecording | null;
  /** Check if currently recording */
  isRecording: () => boolean;
  /** Get current recording (if active) */
  getRecording: () => InputRecording | null;
  /** Serialize a recording to JSON */
  serializeRecording: (recording: InputRecording) => string;
  /** Deserialize a recording from JSON */
  deserializeRecording: (json: string) => InputRecording;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_INPUT_BUFFER_CONFIG: InputBufferConfig = {
  maxBufferFrames: 10,
  frameWindow: 3,
  enableRecording: false,
  maxRecordFrames: 36000, // 10 minutes at 60fps
};

// ============================================================================
// Input Buffer Implementation
// ============================================================================

/**
 * Creates an input buffer instance
 *
 * @param config - Optional configuration overrides
 * @returns InputBuffer instance
 *
 * @example
 * ```ts
 * const inputBuffer = createInputBuffer({
 *   frameWindow: 5, // Allow 5-frame window for frame-perfect inputs
 *   enableRecording: true,
 * });
 *
 * // In game loop
 * function update(frame: number, input: GameInput) {
 *   inputBuffer.captureFrame(frame, input);
 *
 *   // Check for frame-perfect jump input
 *   if (inputBuffer.wasActionPressedInWindow('action', frame)) {
 *     player.jump();
 *   }
 *
 *   inputBuffer.cleanup(frame);
 * }
 *
 * // Save replay
 * const recording = inputBuffer.stopRecording();
 * const json = inputBuffer.serializeRecording(recording);
 * localStorage.setItem('replay', json);
 * ```
 */
export function createInputBuffer(config: Partial<InputBufferConfig> = {}): InputBuffer {
  const fullConfig: InputBufferConfig = {
    ...DEFAULT_INPUT_BUFFER_CONFIG,
    ...config,
  };

  // Buffer state
  const buffer = new Map<number, BufferedInput>();
  const events: InputEvent[] = [];

  // Recording state
  let recording: InputRecording | null = null;
  let isRecordingActive = false;

  return {
    addEvent(action: InputAction, pressed: boolean, frame: number): void {
      const event: InputEvent = {
        frame,
        timestamp: performance.now(),
        action,
        pressed,
      };

      events.push(event);

      // Add to recording if active
      if (isRecordingActive && recording) {
        const frameData = recording.frames.get(frame);
        if (frameData) {
          frameData.events.push(event);
        }
      }
    },

    captureFrame(frame: number, input: GameInput): void {
      // Get events for this frame
      const frameEvents = events.filter((e) => e.frame === frame);

      // Create buffered input
      const bufferedInput: BufferedInput = {
        frame,
        timestamp: performance.now(),
        input: {
          directions: new Set(input.directions),
          action: input.action,
          secondaryAction: input.secondaryAction,
          pause: input.pause,
          pointer: input.pointer ? { ...input.pointer } : null,
          pointerDown: input.pointerDown,
        },
        events: [...frameEvents],
      };

      // Add to buffer
      buffer.set(frame, bufferedInput);

      // Add to recording if active
      if (isRecordingActive && recording) {
        if (recording.frames.size < fullConfig.maxRecordFrames) {
          recording.frames.set(frame, bufferedInput);
          recording.totalFrames = frame + 1;
        } else {
          // Stop recording if we hit the max
          isRecordingActive = false;
        }
      }

      // Clear processed events
      const remainingEvents = events.filter((e) => e.frame !== frame);
      events.length = 0;
      events.push(...remainingEvents);
    },

    getFrameInput(frame: number): BufferedInput | null {
      return buffer.get(frame) || null;
    },

    wasActionPressedInWindow(action: InputAction, currentFrame: number): boolean {
      const startFrame = Math.max(0, currentFrame - fullConfig.frameWindow);

      for (let f = startFrame; f <= currentFrame; f++) {
        const frameData = buffer.get(f);
        if (frameData) {
          const hasPress = frameData.events.some((e) => e.action === action && e.pressed);
          if (hasPress) {
            return true;
          }
        }
      }

      return false;
    },

    wasActionReleasedInWindow(action: InputAction, currentFrame: number): boolean {
      const startFrame = Math.max(0, currentFrame - fullConfig.frameWindow);

      for (let f = startFrame; f <= currentFrame; f++) {
        const frameData = buffer.get(f);
        if (frameData) {
          const hasRelease = frameData.events.some((e) => e.action === action && !e.pressed);
          if (hasRelease) {
            return true;
          }
        }
      }

      return false;
    },

    getEventsInWindow(currentFrame: number): InputEvent[] {
      const startFrame = Math.max(0, currentFrame - fullConfig.frameWindow);
      const windowEvents: InputEvent[] = [];

      for (let f = startFrame; f <= currentFrame; f++) {
        const frameData = buffer.get(f);
        if (frameData) {
          windowEvents.push(...frameData.events);
        }
      }

      return windowEvents;
    },

    cleanup(currentFrame: number): void {
      const oldestFrame = currentFrame - fullConfig.maxBufferFrames;

      for (const [frame] of buffer) {
        if (frame < oldestFrame) {
          buffer.delete(frame);
        }
      }
    },

    reset(): void {
      buffer.clear();
      events.length = 0;
      if (!isRecordingActive) {
        recording = null;
      }
    },

    startRecording(gameType: string, targetFps: number): void {
      recording = {
        startTimestamp: performance.now(),
        totalFrames: 0,
        frames: new Map(),
        metadata: {
          gameType,
          duration: 0,
          targetFps,
        },
      };
      isRecordingActive = true;
    },

    stopRecording(): InputRecording | null {
      if (!recording) {
        return null;
      }

      isRecordingActive = false;

      // Update duration
      recording.metadata.duration = performance.now() - recording.startTimestamp;

      return recording;
    },

    isRecording(): boolean {
      return isRecordingActive;
    },

    getRecording(): InputRecording | null {
      return recording;
    },

    serializeRecording(rec: InputRecording): string {
      // Convert frames to serializable format
      const frames = Array.from(rec.frames.values()).map((frame) => ({
        ...frame,
        input: {
          ...frame.input,
          directions: Array.from(frame.input.directions),
        },
      }));

      const serialized: SerializedRecording = {
        startTimestamp: rec.startTimestamp,
        totalFrames: rec.totalFrames,
        frames,
        metadata: rec.metadata,
      };

      return JSON.stringify(serialized, null, 2);
    },

    deserializeRecording(json: string): InputRecording {
      const serialized: SerializedRecording = JSON.parse(json);

      // Reconstruct the frames Map from array
      const framesMap = new Map<number, BufferedInput>();
      for (const frame of serialized.frames) {
        // Reconstruct the Set for directions
        const directions = new Set(frame.input.directions);
        framesMap.set(frame.frame, {
          ...frame,
          input: {
            ...frame.input,
            directions,
          },
        });
      }

      return {
        startTimestamp: serialized.startTimestamp,
        totalFrames: serialized.totalFrames,
        frames: framesMap,
        metadata: serialized.metadata,
      };
    },
  };
}

// ============================================================================
// Game State Serialization
// ============================================================================

/**
 * Serializable game state snapshot
 */
export interface GameStateSnapshot {
  /** Frame number */
  frame: number;
  /** Timestamp */
  timestamp: number;
  /** Game state as JSON-serializable object */
  state: Record<string, unknown>;
  /** Input state at this frame */
  input: BufferedInput | null;
}

/**
 * Game state recorder for deterministic replay
 */
export interface GameStateRecorder {
  /** Capture a state snapshot */
  captureState: (frame: number, state: Record<string, unknown>) => void;
  /** Get state for a specific frame */
  getState: (frame: number) => GameStateSnapshot | null;
  /** Get all snapshots */
  getAllSnapshots: () => GameStateSnapshot[];
  /** Clear all snapshots */
  clear: () => void;
  /** Serialize to JSON */
  serialize: () => string;
  /** Deserialize from JSON */
  deserialize: (json: string) => void;
}

/**
 * Creates a game state recorder
 *
 * @param inputBuffer - Input buffer to link with state snapshots
 * @param maxSnapshots - Maximum number of snapshots to keep (default: 3600)
 * @returns GameStateRecorder instance
 *
 * @example
 * ```ts
 * const recorder = createGameStateRecorder(inputBuffer);
 *
 * // Capture state each frame
 * function update(frame: number) {
 *   recorder.captureState(frame, {
 *     player: { x: player.x, y: player.y, hp: player.hp },
 *     enemies: enemies.map(e => ({ x: e.x, y: e.y })),
 *     score: gameScore,
 *   });
 * }
 *
 * // Save full replay (inputs + state)
 * const stateJson = recorder.serialize();
 * const inputJson = inputBuffer.serializeRecording(inputBuffer.getRecording()!);
 * saveReplay({ state: stateJson, inputs: inputJson });
 * ```
 */
export function createGameStateRecorder(
  inputBuffer: InputBuffer,
  maxSnapshots: number = 3600
): GameStateRecorder {
  const snapshots = new Map<number, GameStateSnapshot>();

  return {
    captureState(frame: number, state: Record<string, unknown>): void {
      const snapshot: GameStateSnapshot = {
        frame,
        timestamp: performance.now(),
        state: JSON.parse(JSON.stringify(state)), // Deep clone
        input: inputBuffer.getFrameInput(frame),
      };

      snapshots.set(frame, snapshot);

      // Cleanup old snapshots if we exceed max
      if (snapshots.size > maxSnapshots) {
        const oldestFrame = frame - maxSnapshots;
        for (const [f] of snapshots) {
          if (f < oldestFrame) {
            snapshots.delete(f);
          }
        }
      }
    },

    getState(frame: number): GameStateSnapshot | null {
      return snapshots.get(frame) || null;
    },

    getAllSnapshots(): GameStateSnapshot[] {
      return Array.from(snapshots.values());
    },

    clear(): void {
      snapshots.clear();
    },

    serialize(): string {
      return JSON.stringify(Array.from(snapshots.values()), null, 2);
    },

    deserialize(json: string): void {
      snapshots.clear();
      const data: GameStateSnapshot[] = JSON.parse(json);

      for (const snapshot of data) {
        snapshots.set(snapshot.frame, snapshot);
      }
    },
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Download a recording as a JSON file
 */
export function downloadRecording(
  recording: InputRecording,
  inputBuffer: InputBuffer,
  filename: string = 'replay.json'
): void {
  const json = inputBuffer.serializeRecording(recording);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

/**
 * Download a game state recording as a JSON file
 */
export function downloadStateRecording(
  recorder: GameStateRecorder,
  filename: string = 'state-replay.json'
): void {
  const json = recorder.serialize();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

/**
 * Load a recording from a JSON file
 */
export function loadRecording(file: File, inputBuffer: InputBuffer): Promise<InputRecording> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const recording = inputBuffer.deserializeRecording(json);
        resolve(recording);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Load a state recording from a JSON file
 */
export function loadStateRecording(file: File, recorder: GameStateRecorder): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        recorder.deserialize(json);
        resolve();
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
