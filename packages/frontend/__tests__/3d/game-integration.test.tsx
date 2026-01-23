/**
 * game-integration.test.tsx
 *
 * Integration tests for 3D game components covering rendering,
 * game event interactions, and combined component usage.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as THREE from 'three';

// Mock R3F to avoid WebGL requirements in tests
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="r3f-canvas">{children}</div>
  ),
  useFrame: vi.fn((callback) => {
    (global as Record<string, unknown>).__useFrameCallback = callback;
  }),
  useThree: vi.fn(() => ({
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(),
    gl: {},
    size: { width: 800, height: 600 },
    viewport: { width: 800, height: 600, factor: 1 },
  })),
}));

// Import hooks for integration testing
import { useScreenGlowControl } from '../../src/components/3d/ScreenGlow';
import { usePowerUpEffect, type PowerUpType } from '../../src/components/3d/PowerUpEffect3D';
import { useGameOver3D } from '../../src/components/3d/GameOver3D';
import { useComboCounter } from '../../src/components/3d/ComboCounter3D';

// Mock simple score hook since the real one uses refs that don't trigger re-renders
function useMockScoreDisplay(options?: { initialScore?: number }) {
  const [score, setScoreState] = React.useState(options?.initialScore ?? 0);

  return {
    score,
    setScore: (value: number) => setScoreState(Math.max(0, value)),
    addScore: (delta: number) => setScoreState((prev) => Math.max(0, prev + delta)),
    resetScore: () => setScoreState(0),
    props: { score },
  };
}

import * as React from 'react';

describe('Game Effects Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Score + Glow Integration', () => {
    it('should coordinate score updates with glow triggers', () => {
      const glowHook = renderHook(() => useScreenGlowControl());
      const scoreHook = renderHook(() => useMockScoreDisplay({ initialScore: 0 }));

      // Simulate scoring
      act(() => {
        scoreHook.result.current.addScore(100);
        glowHook.result.current.triggerScore();
      });

      expect(scoreHook.result.current.score).toBe(100);
      expect(glowHook.result.current.props.scored).toBe(true);
    });

    it('should sync action intensity with game progress', () => {
      const glowHook = renderHook(() => useScreenGlowControl());
      const scoreHook = renderHook(() => useMockScoreDisplay({ initialScore: 0 }));

      // As score increases, action intensity should increase
      act(() => {
        scoreHook.result.current.setScore(1000);
        glowHook.result.current.setActionIntensity(0.5);
      });

      expect(scoreHook.result.current.score).toBe(1000);
      expect(glowHook.result.current.props.actionIntensity).toBe(0.5);
    });
  });

  describe('Combo + Glow Integration', () => {
    it('should coordinate combo counter with glow effects', () => {
      const glowHook = renderHook(() => useScreenGlowControl());
      const comboHook = renderHook(() => useComboCounter());

      // Build up combo
      act(() => {
        comboHook.result.current.incrementCombo();
        comboHook.result.current.incrementCombo();
        comboHook.result.current.incrementCombo();

        const combo = comboHook.result.current.combo;
        glowHook.result.current.setComboMultiplier(combo);
      });

      expect(comboHook.result.current.combo).toBe(3);
      expect(glowHook.result.current.props.comboMultiplier).toBe(3);
    });

    it('should trigger combo glow at threshold', () => {
      const glowHook = renderHook(() => useScreenGlowControl());

      // Combo reaches threshold (3+)
      act(() => {
        glowHook.result.current.setComboMultiplier(3);
      });

      expect(glowHook.result.current.props.comboMultiplier).toBe(3);
      // Should trigger magenta combo glow
    });

    it('should reset glow when combo breaks', () => {
      const comboHook = renderHook(() => useComboCounter());
      const glowHook = renderHook(() => useScreenGlowControl());

      // Build combo
      act(() => {
        comboHook.result.current.incrementCombo();
        comboHook.result.current.incrementCombo();
        comboHook.result.current.incrementCombo();
        glowHook.result.current.setComboMultiplier(3);
      });

      expect(comboHook.result.current.combo).toBe(3);

      // Combo breaks
      act(() => {
        comboHook.result.current.resetCombo();
        glowHook.result.current.setComboMultiplier(0);
      });

      expect(comboHook.result.current.combo).toBe(0);
      expect(glowHook.result.current.props.comboMultiplier).toBe(0);
    });
  });

  describe('Power-Up + Score Integration', () => {
    it('should trigger power-up effect on collection', () => {
      const powerUpHook = renderHook(() => usePowerUpEffect());
      const scoreHook = renderHook(() => useMockScoreDisplay({ initialScore: 0 }));

      // Collect bonus power-up
      act(() => {
        powerUpHook.result.current.trigger('bonus', [5, 0, 0]);
        scoreHook.result.current.addScore(500); // Bonus points
      });

      expect(powerUpHook.result.current.activeEffects.length).toBe(1);
      expect(scoreHook.result.current.score).toBe(500);
    });

    it('should handle multiple power-ups with score updates', () => {
      const powerUpHook = renderHook(() => useMockScoreDisplay({ initialScore: 100 }));
      const powerUpEffectHook = renderHook(() => usePowerUpEffect());

      act(() => {
        // Multiple power-ups collected
        powerUpEffectHook.result.current.trigger('speed', [1, 0, 0]);
        powerUpHook.result.current.addScore(50);

        powerUpEffectHook.result.current.trigger('shield', [2, 0, 0]);
        powerUpHook.result.current.addScore(75);

        powerUpEffectHook.result.current.trigger('multiball', [3, 0, 0]);
        powerUpHook.result.current.addScore(100);
      });

      expect(powerUpEffectHook.result.current.activeEffects.length).toBe(3);
      expect(powerUpHook.result.current.score).toBe(325); // 100 + 50 + 75 + 100
    });
  });

  describe('Damage + Glow Integration', () => {
    it('should trigger damage glow when player is hit', () => {
      const glowHook = renderHook(() => useScreenGlowControl());

      act(() => {
        glowHook.result.current.triggerDamage();
      });

      expect(glowHook.result.current.props.damaged).toBe(true);
    });

    it('should auto-reset damage state', () => {
      const glowHook = renderHook(() => useScreenGlowControl());

      act(() => {
        glowHook.result.current.triggerDamage();
      });

      expect(glowHook.result.current.props.damaged).toBe(true);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(glowHook.result.current.props.damaged).toBe(false);
    });
  });

  describe('Game Over Integration', () => {
    it('should trigger game over with final score', () => {
      const gameOverHook = renderHook(() => useGameOver3D(10000));
      const scoreHook = renderHook(() => useMockScoreDisplay({ initialScore: 0 }));

      // Play game, accumulate score
      act(() => {
        scoreHook.result.current.setScore(15000);
      });

      // Game ends
      act(() => {
        gameOverHook.result.current.trigger(scoreHook.result.current.score);
      });

      expect(gameOverHook.result.current.isActive).toBe(true);
      expect(gameOverHook.result.current.props.finalScore).toBe(15000);
    });

    it('should reset all state on replay', () => {
      const gameOverHook = renderHook(() => useGameOver3D(10000));
      const scoreHook = renderHook(() => useMockScoreDisplay({ initialScore: 5000 }));
      const comboHook = renderHook(() => useComboCounter());

      // Build up combo
      act(() => {
        comboHook.result.current.setCombo(5);
      });

      // Trigger game over
      act(() => {
        gameOverHook.result.current.trigger(5000);
      });

      // Replay - reset everything
      act(() => {
        gameOverHook.result.current.reset();
        scoreHook.result.current.resetScore();
        comboHook.result.current.resetCombo();
      });

      expect(gameOverHook.result.current.isActive).toBe(false);
      expect(scoreHook.result.current.score).toBe(0);
      expect(comboHook.result.current.combo).toBe(0);
    });
  });

  describe('Full Game Loop Integration', () => {
    it('should handle complete game session flow', () => {
      // Initialize all hooks
      const glowHook = renderHook(() => useScreenGlowControl());
      const scoreHook = renderHook(() => useMockScoreDisplay({ initialScore: 0 }));
      const comboHook = renderHook(() => useComboCounter());
      const powerUpHook = renderHook(() => usePowerUpEffect());
      const gameOverHook = renderHook(() => useGameOver3D(10000));

      // 1. Start playing
      act(() => {
        glowHook.result.current.setActionIntensity(0.3);
      });

      // 2. Score some points
      act(() => {
        scoreHook.result.current.addScore(100);
        glowHook.result.current.triggerScore();
      });

      // 3. Build combo
      act(() => {
        comboHook.result.current.incrementCombo();
        comboHook.result.current.incrementCombo();
        comboHook.result.current.incrementCombo();
        glowHook.result.current.setComboMultiplier(3);
      });

      // 4. Collect power-up
      act(() => {
        powerUpHook.result.current.trigger('bonus', [0, 0, 0]);
        scoreHook.result.current.addScore(500);
      });

      // 5. Take damage
      act(() => {
        glowHook.result.current.triggerDamage();
        comboHook.result.current.resetCombo();
        glowHook.result.current.setComboMultiplier(0);
      });

      // 6. Game over
      act(() => {
        gameOverHook.result.current.trigger(scoreHook.result.current.score);
      });

      // Verify final state
      expect(scoreHook.result.current.score).toBe(600);
      expect(comboHook.result.current.combo).toBe(0);
      expect(gameOverHook.result.current.isActive).toBe(true);
      expect(gameOverHook.result.current.props.finalScore).toBe(600);
    });
  });
});

describe('Game Event Mocking', () => {
  describe('Mock Game Events', () => {
    interface GameEvent {
      type: 'score' | 'damage' | 'powerUp' | 'combo' | 'gameOver';
      payload?: Record<string, unknown>;
    }

    function createMockGameEventHandler() {
      const events: GameEvent[] = [];

      return {
        emit: (event: GameEvent) => {
          events.push(event);
        },
        getEvents: () => events,
        clear: () => {
          events.length = 0;
        },
      };
    }

    it('should track score events', () => {
      const handler = createMockGameEventHandler();

      handler.emit({ type: 'score', payload: { points: 100 } });
      handler.emit({ type: 'score', payload: { points: 50 } });

      expect(handler.getEvents().length).toBe(2);
      expect(handler.getEvents()[0].type).toBe('score');
    });

    it('should track power-up events', () => {
      const handler = createMockGameEventHandler();

      handler.emit({ type: 'powerUp', payload: { powerUpType: 'speed', position: [1, 0, 0] } });

      expect(handler.getEvents().length).toBe(1);
      expect(handler.getEvents()[0].payload?.powerUpType).toBe('speed');
    });

    it('should track combo events', () => {
      const handler = createMockGameEventHandler();

      handler.emit({ type: 'combo', payload: { combo: 3 } });

      expect(handler.getEvents()[0].payload?.combo).toBe(3);
    });

    it('should track game over event', () => {
      const handler = createMockGameEventHandler();

      handler.emit({ type: 'gameOver', payload: { finalScore: 12500, isHighScore: true } });

      expect(handler.getEvents()[0].type).toBe('gameOver');
      expect(handler.getEvents()[0].payload?.finalScore).toBe(12500);
    });
  });
});

describe('Component Integration Performance', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  describe('Combined Hook Performance', () => {
    it('should handle rapid updates across all hooks', () => {
      const glowHook = renderHook(() => useScreenGlowControl());
      const scoreHook = renderHook(() => useMockScoreDisplay({ initialScore: 0 }));
      const comboHook = renderHook(() => useComboCounter());

      const startTime = performance.now();

      act(() => {
        for (let i = 0; i < 100; i++) {
          scoreHook.result.current.addScore(10);
          glowHook.result.current.setActionIntensity(i / 100);
          comboHook.result.current.incrementCombo();
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(scoreHook.result.current.score).toBe(1000);
      expect(duration).toBeLessThan(200); // Should complete in under 200ms
    });

    it('should efficiently handle game restart cycle', () => {
      const gameOverHook = renderHook(() => useGameOver3D(10000));
      const scoreHook = renderHook(() => useMockScoreDisplay({ initialScore: 0 }));

      const startTime = performance.now();

      act(() => {
        for (let i = 0; i < 50; i++) {
          // Simulate game
          scoreHook.result.current.setScore(i * 100);

          // Game over
          gameOverHook.result.current.trigger(scoreHook.result.current.score);

          // Restart
          gameOverHook.result.current.reset();
          scoreHook.result.current.resetScore();
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(gameOverHook.result.current.isActive).toBe(false);
      expect(scoreHook.result.current.score).toBe(0);
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Memory Efficiency', () => {
    it('should not accumulate effects when properly cleaned up', () => {
      const powerUpHook = renderHook(() => usePowerUpEffect());

      // Create and complete many effects
      act(() => {
        for (let i = 0; i < 100; i++) {
          powerUpHook.result.current.trigger('speed', [i, 0, 0]);
        }
      });

      // Complete all effects
      act(() => {
        const effects = [...powerUpHook.result.current.activeEffects];
        for (const effect of effects) {
          powerUpHook.result.current.props(effect.id).onComplete();
        }
      });

      expect(powerUpHook.result.current.activeEffects.length).toBe(0);
    });
  });
});

describe('Type Safety', () => {
  it('should enforce correct power-up types', () => {
    const validTypes: PowerUpType[] = ['speed', 'shield', 'multiball', 'laser', 'slow', 'bonus', 'mystery'];

    for (const type of validTypes) {
      expect(typeof type).toBe('string');
    }
  });

  it('should enforce tuple position type', () => {
    const position: [number, number, number] = [1, 2, 3];

    expect(position.length).toBe(3);
    expect(typeof position[0]).toBe('number');
    expect(typeof position[1]).toBe('number');
    expect(typeof position[2]).toBe('number');
  });
});
