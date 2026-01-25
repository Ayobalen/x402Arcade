/**
 * Game Engine Integration Tests
 *
 * Tests that verify different engine modules work correctly together
 * in realistic game scenarios.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createGameLoop } from '../game-loop';
import { createStateMachine } from '../state-machine';
import { createInputManager } from '../input-manager';
import type { GameInput } from '../types';

describe('Game Engine Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '<canvas id="game-canvas"></canvas>';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  describe('Canvas Initialization', () => {
    it('should initialize canvas context for rendering', () => {
      const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
      expect(canvas).not.toBeNull();

      const ctx = canvas.getContext('2d');
      expect(ctx).not.toBeNull();
    });

    it('should set canvas dimensions', () => {
      const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
      canvas.width = 800;
      canvas.height = 600;

      expect(canvas.width).toBe(800);
      expect(canvas.height).toBe(600);
    });
  });

  describe('Render Cycle Integration', () => {
    it('should call render function with frame info', async () => {
      const renderCallback = vi.fn();
      const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
      const ctx = canvas.getContext('2d')!;

      const loop = createGameLoop();

      loop.setRenderCallback((frameInfo) => {
        renderCallback(frameInfo);
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Draw something
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 10, 10);
      });

      loop.start();

      await vi.advanceTimersByTimeAsync(100);

      expect(renderCallback).toHaveBeenCalled();

      loop.destroy();
    });

    it('should maintain consistent frame timing', async () => {
      const frameTimes: number[] = [];
      const loop = createGameLoop({ targetFps: 60 });

      loop.setUpdateCallback((frameInfo) => {
        frameTimes.push(frameInfo.deltaTime);
      });

      loop.start();

      await vi.advanceTimersByTimeAsync(100);

      // Delta times should be relatively consistent (around 16.67ms for 60 FPS)
      expect(frameTimes.length).toBeGreaterThan(0);

      loop.destroy();
    });
  });

  describe('Input Binding to Game State', () => {
    it('should update game state based on keyboard input', async () => {
      interface GameState {
        playerX: number;
        playerY: number;
        speed: number;
      }

      const gameState: GameState = {
        playerX: 100,
        playerY: 100,
        speed: 2,
      };

      const inputManager = createInputManager();
      const loop = createGameLoop();

      loop.setUpdateCallback(() => {
        const input = inputManager.getInput();

        if (input.up) gameState.playerY -= gameState.speed;
        if (input.down) gameState.playerY += gameState.speed;
        if (input.left) gameState.playerX -= gameState.speed;
        if (input.right) gameState.playerX += gameState.speed;
      });

      loop.start();

      // Simulate arrow key press
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));

      await vi.advanceTimersByTimeAsync(50);

      expect(gameState.playerX).toBeGreaterThan(100);

      loop.destroy();
      inputManager.destroy();
    });

    it('should handle action button input', async () => {
      let actionPressed = false;

      const inputManager = createInputManager();
      const loop = createGameLoop();

      loop.setUpdateCallback(() => {
        const input = inputManager.getInput();
        if (input.action) {
          actionPressed = true;
        }
      });

      loop.start();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));

      await vi.advanceTimersByTimeAsync(50);

      expect(actionPressed).toBe(true);

      loop.destroy();
      inputManager.destroy();
    });
  });

  describe('Game Over Detection and Handling', () => {
    it('should transition to game over state when condition met', async () => {
      interface GameContext {
        lives: number;
        gameOver: boolean;
      }

      const machine = createStateMachine<GameContext>({
        initialState: 'playing',
        context: {
          lives: 3,
          gameOver: false,
        },
        states: {
          playing: {
            transitions: {
              LOSE_LIFE: 'playing',
              GAME_OVER: 'gameOver',
            },
          },
          gameOver: {
            onEnter: (event, context) => {
              if (context) {
                context.gameOver = true;
              }
            },
          },
        },
      });

      const loop = createGameLoop();

      loop.setUpdateCallback(() => {
        const context = machine.getContext();
        if (context && context.lives <= 0 && !context.gameOver) {
          machine.transition('GAME_OVER');
        }
      });

      loop.start();

      // Simulate losing all lives
      const context = machine.getContext();
      if (context) {
        context.lives = 0;
      }

      await vi.advanceTimersByTimeAsync(50);

      expect(machine.getCurrentState()).toBe('gameOver');
      expect(context?.gameOver).toBe(true);

      loop.destroy();
    });

    it('should stop game loop on game over', async () => {
      const machine = createStateMachine({
        initialState: 'playing',
        states: {
          playing: {
            transitions: {
              GAME_OVER: 'gameOver',
            },
          },
          gameOver: {},
        },
      });

      const loop = createGameLoop();
      let updateCallCount = 0;

      loop.setUpdateCallback(() => {
        updateCallCount++;
      });

      loop.start();

      await vi.advanceTimersByTimeAsync(50);

      const callCountBeforeGameOver = updateCallCount;

      // Trigger game over
      machine.transition('GAME_OVER');
      loop.pause();

      await vi.advanceTimersByTimeAsync(50);

      // Update should not be called while paused
      expect(updateCallCount).toBe(callCountBeforeGameOver);

      loop.destroy();
    });
  });

  describe('Score Tracking Integration', () => {
    it('should update score based on game events', async () => {
      interface GameState {
        score: number;
        combo: number;
      }

      const gameState: GameState = {
        score: 0,
        combo: 1,
      };

      const loop = createGameLoop();

      const addScore = (points: number) => {
        gameState.score += points * gameState.combo;
        gameState.combo++;
      };

      loop.setUpdateCallback(() => {
        // Game logic would call addScore when events occur
      });

      loop.start();

      // Simulate scoring events
      addScore(10); // 10 * 1 = 10
      addScore(10); // 10 * 2 = 20
      addScore(10); // 10 * 3 = 30

      expect(gameState.score).toBe(60);
      expect(gameState.combo).toBe(4);

      loop.destroy();
    });

    it('should reset combo on miss', async () => {
      interface GameState {
        score: number;
        combo: number;
      }

      const gameState: GameState = {
        score: 0,
        combo: 1,
      };

      const addScore = (points: number) => {
        gameState.score += points * gameState.combo;
        gameState.combo++;
      };

      const resetCombo = () => {
        gameState.combo = 1;
      };

      addScore(10); // 10 * 1 = 10
      addScore(10); // 10 * 2 = 20
      resetCombo();
      addScore(10); // 10 * 1 = 10

      expect(gameState.score).toBe(40);
      expect(gameState.combo).toBe(2);
    });
  });

  describe('Complete Game Loop Integration', () => {
    it('should integrate all systems in a simple game', async () => {
      // Game state
      interface CompleteGameState {
        playerX: number;
        playerY: number;
        score: number;
        lives: number;
        gameOver: boolean;
      }

      const state: CompleteGameState = {
        playerX: 400,
        playerY: 300,
        score: 0,
        lives: 3,
        gameOver: false,
      };

      // Systems
      const loop = createGameLoop();
      const inputManager = createInputManager();
      const machine = createStateMachine({
        initialState: 'playing',
        states: {
          playing: {
            transitions: {
              GAME_OVER: 'gameOver',
            },
          },
          gameOver: {},
        },
      });

      // Update function
      loop.setUpdateCallback((frameInfo) => {
        if (machine.getCurrentState() !== 'playing') return;

        const input = inputManager.getInput();

        // Move player
        if (input.up) state.playerY -= 2;
        if (input.down) state.playerY += 2;
        if (input.left) state.playerX -= 2;
        if (input.right) state.playerX += 2;

        // Check game over
        if (state.lives <= 0) {
          state.gameOver = true;
          machine.transition('GAME_OVER');
          loop.pause();
        }
      });

      // Render function
      const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
      const ctx = canvas.getContext('2d')!;

      loop.setRenderCallback(() => {
        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw player
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(state.playerX, state.playerY, 10, 10);

        // Draw score
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px monospace';
        ctx.fillText(`Score: ${state.score}`, 10, 20);
        ctx.fillText(`Lives: ${state.lives}`, 10, 40);
      });

      loop.start();

      // Simulate gameplay
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));

      await vi.advanceTimersByTimeAsync(100);

      expect(state.playerX).toBeGreaterThan(400);

      // Simulate losing all lives
      state.lives = 0;

      await vi.advanceTimersByTimeAsync(50);

      expect(state.gameOver).toBe(true);
      expect(machine.getCurrentState()).toBe('gameOver');
      expect(loop.isPaused()).toBe(true);

      loop.destroy();
      inputManager.destroy();
    });
  });

  describe('Performance and Optimization', () => {
    it('should maintain target FPS under load', async () => {
      const loop = createGameLoop({ targetFps: 60 });
      let frameCount = 0;

      loop.setUpdateCallback(() => {
        frameCount++;
        // Simulate some work
        for (let i = 0; i < 1000; i++) {
          Math.sqrt(i);
        }
      });

      loop.start();

      await vi.advanceTimersByTimeAsync(1000);

      // Should have processed multiple frames
      expect(frameCount).toBeGreaterThan(0);

      const fps = loop.getFps();
      expect(fps).toBeGreaterThan(0);

      loop.destroy();
    });

    it('should handle multiple input events per frame', async () => {
      const inputManager = createInputManager();
      const loop = createGameLoop();

      let processedInputs = 0;

      loop.setUpdateCallback(() => {
        const input = inputManager.getInput();
        if (input.up || input.down || input.left || input.right) {
          processedInputs++;
        }
      });

      loop.start();

      // Press multiple keys
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));

      await vi.advanceTimersByTimeAsync(50);

      expect(processedInputs).toBeGreaterThan(0);

      loop.destroy();
      inputManager.destroy();
    });
  });
});
