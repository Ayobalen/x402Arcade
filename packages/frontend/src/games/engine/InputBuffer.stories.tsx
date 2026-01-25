/**
 * Input Buffer System Stories
 *
 * Interactive demonstrations of the input buffering and replay system
 */

import React, { useState, useEffect, useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  createInputBuffer,
  createGameStateRecorder,
  type InputBuffer,
  type GameStateRecorder,
  downloadRecording,
  downloadStateRecording,
} from './input-buffer';
import { createInputManager, type InputManager } from './input-manager';

// ============================================================================
// Demo Components
// ============================================================================

const InputBufferDemo: React.FC = () => {
  const [inputManager] = useState<InputManager>(() =>
    createInputManager({ enableBuffering: true })
  );
  const [inputBuffer] = useState<InputBuffer>(() => inputManager.getBuffer()!);
  const [frame, setFrame] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [events, setEvents] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      inputManager.attach(canvasRef.current);
    }

    return () => {
      inputManager.dispose();
    };
  }, [inputManager]);

  // Game loop simulation
  useEffect(() => {
    let animationFrame: number;
    let lastTime = performance.now();
    const targetFps = 60;
    const frameTime = 1000 / targetFps;

    const loop = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;

      if (deltaTime >= frameTime) {
        // Capture input for this frame
        inputManager.captureFrame(frame);

        // Update events display
        const frameData = inputBuffer.getFrameInput(frame);
        if (frameData && frameData.events.length > 0) {
          const newEvents = frameData.events.map(
            (e) => `Frame ${e.frame}: ${e.action} ${e.pressed ? 'PRESSED' : 'RELEASED'}`
          );
          setEvents((prev) => [...newEvents, ...prev].slice(0, 10));
        }

        setFrame((f) => f + 1);
        lastTime = currentTime;
      }

      animationFrame = requestAnimationFrame(loop);
    };

    animationFrame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [inputManager, inputBuffer, frame]);

  const handleStartRecording = () => {
    inputBuffer.startRecording('demo', 60);
    setIsRecording(true);
    setEvents(['🔴 Recording started...']);
  };

  const handleStopRecording = () => {
    const recording = inputBuffer.stopRecording();
    setIsRecording(false);

    if (recording) {
      setEvents((prev) => [
        `✅ Recording stopped. ${recording.totalFrames} frames captured.`,
        ...prev,
      ]);
    }
  };

  const handleDownload = () => {
    const recording = inputBuffer.getRecording();
    if (recording) {
      downloadRecording(recording, inputBuffer, 'input-demo.json');
      setEvents((prev) => ['📥 Recording downloaded!', ...prev]);
    }
  };

  const checkFramePerfect = () => {
    const wasPressed = inputBuffer.wasActionPressedInWindow('action', frame);
    setEvents((prev) => [
      wasPressed
        ? `✅ Frame-perfect input detected at frame ${frame}!`
        : `❌ No frame-perfect input in window`,
      ...prev,
    ]);
  };

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Input Buffer Demo</h1>
          <p className="text-gray-400">Press keys to see input buffering in action</p>
        </div>

        {/* Interactive Canvas */}
        <div className="bg-gray-800 rounded-lg p-4">
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            className="w-full bg-black rounded border-2 border-cyan-500"
          />
          <p className="text-sm text-gray-400 mt-2 text-center">
            Click canvas and use Arrow keys, WASD, or Space to test input
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400">Current Frame</div>
            <div className="text-2xl font-mono font-bold text-cyan-400">{frame}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400">Recording Status</div>
            <div className="text-2xl font-bold">
              {isRecording ? (
                <span className="text-red-500">🔴 REC</span>
              ) : (
                <span className="text-gray-500">⚪ STOPPED</span>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-3">Controls</h2>
          <div className="flex flex-wrap gap-2">
            {!isRecording ? (
              <button
                onClick={handleStartRecording}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-medium"
              >
                🔴 Start Recording
              </button>
            ) : (
              <button
                onClick={handleStopRecording}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded font-medium"
              >
                ⏹️ Stop Recording
              </button>
            )}

            <button
              onClick={handleDownload}
              disabled={!inputBuffer.getRecording()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:opacity-50 rounded font-medium"
            >
              📥 Download Recording
            </button>

            <button
              onClick={checkFramePerfect}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded font-medium"
            >
              🎯 Check Frame-Perfect
            </button>
          </div>
        </div>

        {/* Events Log */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-3">Event Log</h2>
          <div className="space-y-1 font-mono text-sm">
            {events.length === 0 ? (
              <div className="text-gray-500">No events yet...</div>
            ) : (
              events.map((event, i) => (
                <div
                  key={i}
                  className={`p-2 rounded ${
                    event.includes('PRESSED')
                      ? 'bg-green-900/30 text-green-400'
                      : event.includes('RELEASED')
                        ? 'bg-red-900/30 text-red-400'
                        : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {event}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Key Mappings */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-3">Key Mappings</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-cyan-400">Up:</span> ↑ / W
            </div>
            <div>
              <span className="text-cyan-400">Down:</span> ↓ / S
            </div>
            <div>
              <span className="text-cyan-400">Left:</span> ← / A
            </div>
            <div>
              <span className="text-cyan-400">Right:</span> → / D
            </div>
            <div>
              <span className="text-cyan-400">Action:</span> Space / Enter
            </div>
            <div>
              <span className="text-cyan-400">Pause:</span> Esc / P
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const GameStateRecorderDemo: React.FC = () => {
  const [inputBuffer] = useState<InputBuffer>(() => createInputBuffer());
  const [recorder] = useState<GameStateRecorder>(() => createGameStateRecorder(inputBuffer, 100));
  const [frame, setFrame] = useState(0);
  const [playerPos, setPlayerPos] = useState({ x: 300, y: 200 });
  const [score, setScore] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simple game state update
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((f) => {
        const newFrame = f + 1;

        // Simulate game state
        setPlayerPos((pos) => ({
          x: pos.x + Math.sin(newFrame / 10) * 2,
          y: pos.y + Math.cos(newFrame / 15) * 2,
        }));

        setScore((s) => s + 1);

        // Capture state
        recorder.captureState(newFrame, {
          player: playerPos,
          score: score + 1,
          frame: newFrame,
        });

        return newFrame;
      });
    }, 1000 / 60);

    return () => clearInterval(interval);
  }, [recorder, playerPos, score]);

  // Render player on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw player
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.arc(playerPos.x, playerPos.y, 20, 0, Math.PI * 2);
    ctx.fill();

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '24px monospace';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`Frame: ${frame}`, 10, 60);
  }, [playerPos, score, frame]);

  const handleDownload = () => {
    downloadStateRecording(recorder, 'game-state.json');
  };

  const handleRewind = () => {
    const rewindFrame = Math.max(0, frame - 60);
    const snapshot = recorder.getState(rewindFrame);

    if (snapshot && snapshot.state) {
      const state = snapshot.state as {
        player: { x: number; y: number };
        score: number;
      };
      setPlayerPos(state.player);
      setScore(state.score);
      setFrame(rewindFrame);
    }
  };

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Game State Recorder Demo</h1>
          <p className="text-gray-400">Watch the game state being recorded and replayed</p>
        </div>

        {/* Game Canvas */}
        <div className="bg-gray-800 rounded-lg p-4">
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            className="w-full bg-black rounded border-2 border-cyan-500"
          />
        </div>

        {/* Controls */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-3">Time Travel</h2>
          <div className="flex gap-2">
            <button
              onClick={handleRewind}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded font-medium"
            >
              ⏪ Rewind 1 Second
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium"
            >
              📥 Download State History
            </button>
          </div>
        </div>

        {/* State Info */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-3">Current State</h2>
          <div className="font-mono text-sm space-y-1">
            <div>
              Frame: <span className="text-cyan-400">{frame}</span>
            </div>
            <div>
              Player X: <span className="text-cyan-400">{playerPos.x.toFixed(2)}</span>
            </div>
            <div>
              Player Y: <span className="text-cyan-400">{playerPos.y.toFixed(2)}</span>
            </div>
            <div>
              Score: <span className="text-cyan-400">{score}</span>
            </div>
            <div>
              Snapshots Recorded:{' '}
              <span className="text-cyan-400">{recorder.getAllSnapshots().length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Storybook Configuration
// ============================================================================

const meta: Meta = {
  title: 'Engine/Input Buffer',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj;

export const InteractiveDemo: Story = {
  render: () => <InputBufferDemo />,
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demonstration of input buffering with frame-perfect detection and recording capabilities.',
      },
    },
  },
};

export const StateRecorderDemo: Story = {
  render: () => <GameStateRecorderDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Demonstration of game state recording with time-travel capabilities.',
      },
    },
  },
};
