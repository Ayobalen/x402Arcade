/**
 * State Machine Tests
 *
 * Tests for finite state machine implementation including
 * state transitions, guards, and lifecycle hooks.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStateMachine, createGameStateMachine } from '../state-machine';
import type { StateDefinition, TransitionDefinition } from '../state-machine';

describe('State Machine', () => {
  describe('createStateMachine', () => {
    it('should create state machine with initial state', () => {
      const config = {
        initialState: 'idle',
        states: {
          idle: {},
          active: {},
        },
      };

      const machine = createStateMachine(config);

      expect(machine.getCurrentState()).toBe('idle');
    });

    it('should transition between states', () => {
      const config = {
        initialState: 'idle',
        states: {
          idle: {
            transitions: {
              START: 'active',
            },
          },
          active: {},
        },
      };

      const machine = createStateMachine(config);

      machine.transition('START');

      expect(machine.getCurrentState()).toBe('active');
    });

    it('should call onEnter hook when entering state', () => {
      const onEnter = vi.fn();

      const config = {
        initialState: 'idle',
        states: {
          idle: {
            transitions: {
              START: 'active',
            },
          },
          active: {
            onEnter,
          },
        },
      };

      const machine = createStateMachine(config);

      machine.transition('START');

      expect(onEnter).toHaveBeenCalled();
    });

    it('should call onExit hook when leaving state', () => {
      const onExit = vi.fn();

      const config = {
        initialState: 'idle',
        states: {
          idle: {
            onExit,
            transitions: {
              START: 'active',
            },
          },
          active: {},
        },
      };

      const machine = createStateMachine(config);

      machine.transition('START');

      expect(onExit).toHaveBeenCalled();
    });

    it('should provide event data to hooks', () => {
      let receivedEvent: any = null;

      const config = {
        initialState: 'idle',
        states: {
          idle: {
            transitions: {
              START: 'active',
            },
          },
          active: {
            onEnter: (event: any) => {
              receivedEvent = event;
            },
          },
        },
      };

      const machine = createStateMachine(config);

      machine.transition('START', { score: 100 });

      expect(receivedEvent).toBeDefined();
      expect(receivedEvent.data).toEqual({ score: 100 });
    });

    it('should block transition if guard returns false', () => {
      const guard = vi.fn(() => false);

      const config = {
        initialState: 'idle',
        states: {
          idle: {
            transitions: {
              START: {
                target: 'active',
                guard,
              },
            },
          },
          active: {},
        },
      };

      const machine = createStateMachine(config);

      machine.transition('START');

      expect(guard).toHaveBeenCalled();
      expect(machine.getCurrentState()).toBe('idle');
    });

    it('should allow transition if guard returns true', () => {
      const guard = vi.fn(() => true);

      const config = {
        initialState: 'idle',
        states: {
          idle: {
            transitions: {
              START: {
                target: 'active',
                guard,
              },
            },
          },
          active: {},
        },
      };

      const machine = createStateMachine(config);

      machine.transition('START');

      expect(guard).toHaveBeenCalled();
      expect(machine.getCurrentState()).toBe('active');
    });

    it('should check if transition is available', () => {
      const config = {
        initialState: 'idle',
        states: {
          idle: {
            transitions: {
              START: 'active',
            },
          },
          active: {},
        },
      };

      const machine = createStateMachine(config);

      expect(machine.can('START')).toBe(true);
      expect(machine.can('STOP')).toBe(false);
    });

    it('should reset to initial state', () => {
      const config = {
        initialState: 'idle',
        states: {
          idle: {
            transitions: {
              START: 'active',
            },
          },
          active: {},
        },
      };

      const machine = createStateMachine(config);

      machine.transition('START');
      machine.reset();

      expect(machine.getCurrentState()).toBe('idle');
    });

    it('should subscribe to state changes', () => {
      const listener = vi.fn();

      const config = {
        initialState: 'idle',
        states: {
          idle: {
            transitions: {
              START: 'active',
            },
          },
          active: {},
        },
      };

      const machine = createStateMachine(config);

      machine.subscribe(listener);
      machine.transition('START');

      expect(listener).toHaveBeenCalled();
      const event = listener.mock.calls[0][0];
      expect(event.from).toBe('idle');
      expect(event.to).toBe('active');
      expect(event.event).toBe('START');
    });

    it('should unsubscribe from state changes', () => {
      const listener = vi.fn();

      const config = {
        initialState: 'idle',
        states: {
          idle: {
            transitions: {
              START: 'active',
            },
          },
          active: {},
        },
      };

      const machine = createStateMachine(config);

      const unsubscribe = machine.subscribe(listener);
      unsubscribe();

      machine.transition('START');

      expect(listener).not.toHaveBeenCalled();
    });

    it('should maintain context across states', () => {
      interface GameContext {
        score: number;
        lives: number;
      }

      const config = {
        initialState: 'playing',
        context: {
          score: 0,
          lives: 3,
        } as GameContext,
        states: {
          playing: {
            transitions: {
              LOSE_LIFE: 'playing',
            },
          },
        },
      };

      const machine = createStateMachine<GameContext>(config);

      const context = machine.getContext();
      context.score = 100;

      expect(machine.getContext().score).toBe(100);
    });
  });

  describe('createGameStateMachine', () => {
    it('should create game state machine with standard states', () => {
      const machine = createGameStateMachine({});

      expect(machine.getCurrentState()).toBe('menu');
    });

    it('should transition from menu to playing', () => {
      const machine = createGameStateMachine({});

      machine.transition('START');

      expect(machine.getCurrentState()).toBe('playing');
    });

    it('should transition from playing to paused', () => {
      const machine = createGameStateMachine({});

      machine.transition('START');
      machine.transition('PAUSE');

      expect(machine.getCurrentState()).toBe('paused');
    });

    it('should transition from paused back to playing', () => {
      const machine = createGameStateMachine({});

      machine.transition('START');
      machine.transition('PAUSE');
      machine.transition('RESUME');

      expect(machine.getCurrentState()).toBe('playing');
    });

    it('should transition from playing to game over', () => {
      const machine = createGameStateMachine({});

      machine.transition('START');
      machine.transition('GAME_OVER');

      expect(machine.getCurrentState()).toBe('gameOver');
    });

    it('should call onStart callback when starting game', () => {
      const onStart = vi.fn();

      const machine = createGameStateMachine({
        onStart,
      });

      machine.transition('START');

      expect(onStart).toHaveBeenCalled();
    });

    it('should call onPause callback when pausing game', () => {
      const onPause = vi.fn();

      const machine = createGameStateMachine({
        onPause,
      });

      machine.transition('START');
      machine.transition('PAUSE');

      expect(onPause).toHaveBeenCalled();
    });

    it('should call onGameOver callback when game ends', () => {
      const onGameOver = vi.fn();

      const machine = createGameStateMachine({
        onGameOver,
      });

      machine.transition('START');
      machine.transition('GAME_OVER');

      expect(onGameOver).toHaveBeenCalled();
    });
  });
});
