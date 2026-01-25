/**
 * Input Buffer Tests
 *
 * Test suite for the input buffering system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createInputBuffer,
  createGameStateRecorder,
  type InputBuffer,
  type GameStateRecorder,
} from '../input-buffer';
import { createEmptyInput } from '../../types';

describe('Input Buffer System', () => {
  let inputBuffer: InputBuffer;

  beforeEach(() => {
    inputBuffer = createInputBuffer({
      maxBufferFrames: 10,
      frameWindow: 3,
      enableRecording: false,
    });
  });

  describe('Basic Event Buffering', () => {
    it('should add input events', () => {
      inputBuffer.addEvent('action', true, 0);
      inputBuffer.addEvent('up', true, 0);

      const input = createEmptyInput();
      input.action = true;
      input.directions.add('up');

      inputBuffer.captureFrame(0, input);

      const frameData = inputBuffer.getFrameInput(0);
      expect(frameData).toBeTruthy();
      expect(frameData?.events).toHaveLength(2);
      expect(frameData?.events[0].action).toBe('action');
      expect(frameData?.events[1].action).toBe('up');
    });

    it('should capture frame state correctly', () => {
      const input = createEmptyInput();
      input.action = true;
      input.directions.add('left');
      input.pointer = { x: 100, y: 200 };

      inputBuffer.captureFrame(5, input);

      const frameData = inputBuffer.getFrameInput(5);
      expect(frameData?.frame).toBe(5);
      expect(frameData?.input.action).toBe(true);
      expect(frameData?.input.directions.has('left')).toBe(true);
      expect(frameData?.input.pointer).toEqual({ x: 100, y: 200 });
    });

    it('should return null for frames not in buffer', () => {
      const frameData = inputBuffer.getFrameInput(999);
      expect(frameData).toBeNull();
    });
  });

  describe('Frame-Perfect Input Detection', () => {
    it('should detect action press in window', () => {
      inputBuffer.addEvent('action', true, 10);
      const input = createEmptyInput();
      input.action = true;
      inputBuffer.captureFrame(10, input);

      // Check within window
      expect(inputBuffer.wasActionPressedInWindow('action', 10)).toBe(true);
      expect(inputBuffer.wasActionPressedInWindow('action', 11)).toBe(true);
      expect(inputBuffer.wasActionPressedInWindow('action', 12)).toBe(true);
      expect(inputBuffer.wasActionPressedInWindow('action', 13)).toBe(true);

      // Check outside window (frameWindow = 3)
      expect(inputBuffer.wasActionPressedInWindow('action', 14)).toBe(false);
    });

    it('should detect action release in window', () => {
      inputBuffer.addEvent('action', false, 10);
      const input = createEmptyInput();
      input.action = false;
      inputBuffer.captureFrame(10, input);

      expect(inputBuffer.wasActionReleasedInWindow('action', 10)).toBe(true);
      expect(inputBuffer.wasActionReleasedInWindow('action', 11)).toBe(true);
      expect(inputBuffer.wasActionReleasedInWindow('action', 13)).toBe(true);
      expect(inputBuffer.wasActionReleasedInWindow('action', 14)).toBe(false);
    });

    it('should get events in window', () => {
      inputBuffer.addEvent('action', true, 10);
      inputBuffer.addEvent('up', true, 11);
      inputBuffer.addEvent('left', true, 12);

      const input1 = createEmptyInput();
      input1.action = true;
      inputBuffer.captureFrame(10, input1);

      const input2 = createEmptyInput();
      input2.directions.add('up');
      inputBuffer.captureFrame(11, input2);

      const input3 = createEmptyInput();
      input3.directions.add('left');
      inputBuffer.captureFrame(12, input3);

      const events = inputBuffer.getEventsInWindow(12);
      expect(events).toHaveLength(3);
      expect(events[0].action).toBe('action');
      expect(events[1].action).toBe('up');
      expect(events[2].action).toBe('left');
    });
  });

  describe('Buffer Cleanup', () => {
    it('should remove old frames', () => {
      // Add frames 0-15
      for (let i = 0; i <= 15; i++) {
        const input = createEmptyInput();
        inputBuffer.captureFrame(i, input);
      }

      // Cleanup at frame 15 (maxBufferFrames = 10)
      inputBuffer.cleanup(15);

      // Frames 0-4 should be removed (15 - 10 = 5, so frames < 5)
      expect(inputBuffer.getFrameInput(0)).toBeNull();
      expect(inputBuffer.getFrameInput(4)).toBeNull();

      // Frames 5-15 should remain
      expect(inputBuffer.getFrameInput(5)).toBeTruthy();
      expect(inputBuffer.getFrameInput(15)).toBeTruthy();
    });
  });

  describe('Buffer Reset', () => {
    it('should clear all buffered data', () => {
      const input = createEmptyInput();
      inputBuffer.captureFrame(0, input);
      inputBuffer.captureFrame(1, input);

      inputBuffer.reset();

      expect(inputBuffer.getFrameInput(0)).toBeNull();
      expect(inputBuffer.getFrameInput(1)).toBeNull();
    });
  });

  describe('Input Recording', () => {
    beforeEach(() => {
      inputBuffer = createInputBuffer({
        enableRecording: true,
        maxRecordFrames: 100,
      });
    });

    it('should start and stop recording', () => {
      expect(inputBuffer.isRecording()).toBe(false);

      inputBuffer.startRecording('snake', 60);
      expect(inputBuffer.isRecording()).toBe(true);

      const recording = inputBuffer.stopRecording();
      expect(inputBuffer.isRecording()).toBe(false);
      expect(recording).toBeTruthy();
      expect(recording?.metadata.gameType).toBe('snake');
      expect(recording?.metadata.targetFps).toBe(60);
    });

    it('should record frames during recording', () => {
      inputBuffer.startRecording('tetris', 60);

      const input1 = createEmptyInput();
      input1.action = true;
      inputBuffer.captureFrame(0, input1);

      const input2 = createEmptyInput();
      input2.directions.add('left');
      inputBuffer.captureFrame(1, input2);

      const recording = inputBuffer.stopRecording();
      expect(recording?.totalFrames).toBe(2);
      expect(recording?.frames.size).toBe(2);
    });

    it('should serialize and deserialize recordings', () => {
      inputBuffer.startRecording('pong', 60);

      const input = createEmptyInput();
      input.action = true;
      input.directions.add('up');
      inputBuffer.captureFrame(0, input);

      const recording = inputBuffer.stopRecording()!;
      const json = inputBuffer.serializeRecording(recording);

      expect(json).toContain('pong');
      expect(json).toContain('60');

      const deserialized = inputBuffer.deserializeRecording(json);
      expect(deserialized.metadata.gameType).toBe('pong');
      expect(deserialized.totalFrames).toBe(1);
      expect(deserialized.frames.size).toBe(1);

      const frame = deserialized.frames.get(0);
      expect(frame?.input.action).toBe(true);
      expect(frame?.input.directions.has('up')).toBe(true);
    });

    it('should stop recording at max frames', () => {
      const smallBuffer = createInputBuffer({
        enableRecording: true,
        maxRecordFrames: 5,
      });

      smallBuffer.startRecording('test', 60);

      // Record 10 frames
      for (let i = 0; i < 10; i++) {
        const input = createEmptyInput();
        smallBuffer.captureFrame(i, input);
      }

      // Should have stopped at 5 frames
      expect(smallBuffer.isRecording()).toBe(false);

      const recording = smallBuffer.stopRecording();
      expect(recording?.frames.size).toBe(5);
    });
  });
});

describe('Game State Recorder', () => {
  let inputBuffer: InputBuffer;
  let recorder: GameStateRecorder;

  beforeEach(() => {
    inputBuffer = createInputBuffer();
    recorder = createGameStateRecorder(inputBuffer, 100);
  });

  describe('State Capture', () => {
    it('should capture game state snapshots', () => {
      const state1 = {
        player: { x: 100, y: 200, hp: 5 },
        score: 1000,
      };

      recorder.captureState(0, state1);

      const snapshot = recorder.getState(0);
      expect(snapshot).toBeTruthy();
      expect(snapshot?.frame).toBe(0);
      expect(snapshot?.state).toEqual(state1);
    });

    it('should deep clone state to prevent mutation', () => {
      const state = {
        player: { x: 100, y: 200 },
      };

      recorder.captureState(0, state);

      // Mutate original
      state.player.x = 999;

      const snapshot = recorder.getState(0);
      expect(snapshot?.state).toEqual({ player: { x: 100, y: 200 } });
    });

    it('should link input state with game state', () => {
      const input = createEmptyInput();
      input.action = true;
      inputBuffer.captureFrame(5, input);

      const gameState = { score: 500 };
      recorder.captureState(5, gameState);

      const snapshot = recorder.getState(5);
      expect(snapshot?.input?.input.action).toBe(true);
    });
  });

  describe('State History', () => {
    it('should get all snapshots', () => {
      recorder.captureState(0, { score: 0 });
      recorder.captureState(1, { score: 100 });
      recorder.captureState(2, { score: 200 });

      const snapshots = recorder.getAllSnapshots();
      expect(snapshots).toHaveLength(3);
      expect(snapshots[0].state).toEqual({ score: 0 });
      expect(snapshots[1].state).toEqual({ score: 100 });
      expect(snapshots[2].state).toEqual({ score: 200 });
    });

    it('should clear all snapshots', () => {
      recorder.captureState(0, { score: 0 });
      recorder.captureState(1, { score: 100 });

      recorder.clear();

      expect(recorder.getAllSnapshots()).toHaveLength(0);
      expect(recorder.getState(0)).toBeNull();
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize state history', () => {
      recorder.captureState(0, { player: { x: 10, y: 20 } });
      recorder.captureState(1, { player: { x: 15, y: 25 } });

      const json = recorder.serialize();
      expect(json).toContain('"frame": 0');
      expect(json).toContain('"frame": 1');

      recorder.clear();
      expect(recorder.getAllSnapshots()).toHaveLength(0);

      recorder.deserialize(json);
      expect(recorder.getAllSnapshots()).toHaveLength(2);

      const state0 = recorder.getState(0);
      expect(state0?.state).toEqual({ player: { x: 10, y: 20 } });

      const state1 = recorder.getState(1);
      expect(state1?.state).toEqual({ player: { x: 15, y: 25 } });
    });
  });

  describe('Snapshot Limit', () => {
    it('should respect max snapshots limit', () => {
      const limitedRecorder = createGameStateRecorder(inputBuffer, 5);

      // Capture 10 snapshots
      for (let i = 0; i < 10; i++) {
        limitedRecorder.captureState(i, { frame: i });
      }

      // Should only keep recent snapshots (cleanup happens after exceeding max)
      const snapshots = limitedRecorder.getAllSnapshots();
      // After capturing 10 frames with max 5, we should have around 5-6 frames
      // (cleanup happens after we exceed, so briefly we can have max+1)
      expect(snapshots.length).toBeLessThanOrEqual(6);

      // Should have the most recent frame
      expect(limitedRecorder.getState(9)).toBeTruthy();

      // Should not have very old frames
      expect(limitedRecorder.getState(0)).toBeNull();
      expect(limitedRecorder.getState(1)).toBeNull();
    });
  });
});
