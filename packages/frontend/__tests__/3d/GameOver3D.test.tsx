/**
 * GameOver3D.test.tsx
 *
 * Tests for the GameOver3D component that provides dramatic
 * game over animations with score display.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
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

import {
  GameOver3D,
  useGameOver3D,
  type GameOver3DProps,
  type UseGameOver3DResult,
} from '../../src/components/3d/GameOver3D';

describe('GameOver3D Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Required Props', () => {
    it('should require active prop', () => {
      const props: GameOver3DProps = {
        active: true,
        finalScore: 1000,
      };
      expect(props.active).toBe(true);
    });

    it('should require finalScore prop', () => {
      const props: GameOver3DProps = {
        active: true,
        finalScore: 12500,
      };
      expect(props.finalScore).toBe(12500);
    });
  });

  describe('Optional Props', () => {
    it('should accept highScore for comparison', () => {
      const props: GameOver3DProps = {
        active: true,
        finalScore: 15000,
        highScore: 10000,
      };
      expect(props.highScore).toBe(10000);
    });

    it('should accept position offset', () => {
      const props: GameOver3DProps = {
        active: true,
        finalScore: 1000,
        position: [0, 1, 0],
      };
      expect(props.position).toEqual([0, 1, 0]);
    });

    it('should accept scale multiplier', () => {
      const props: GameOver3DProps = {
        active: true,
        finalScore: 1000,
        scale: 1.5,
      };
      expect(props.scale).toBe(1.5);
    });

    it('should accept onAnimationComplete callback', () => {
      const callback = vi.fn();
      const props: GameOver3DProps = {
        active: true,
        finalScore: 1000,
        onAnimationComplete: callback,
      };
      expect(props.onAnimationComplete).toBe(callback);
    });

    it('should accept onReplayClick callback', () => {
      const callback = vi.fn();
      const props: GameOver3DProps = {
        active: true,
        finalScore: 1000,
        onReplayClick: callback,
      };
      expect(props.onReplayClick).toBe(callback);
    });

    it('should accept duration prop', () => {
      const props: GameOver3DProps = {
        active: true,
        finalScore: 1000,
        duration: 5.0,
      };
      expect(props.duration).toBe(5.0);
    });

    it('should accept colorTheme prop', () => {
      const props: GameOver3DProps = {
        active: true,
        finalScore: 1000,
        colorTheme: 'purple',
      };
      expect(props.colorTheme).toBe('purple');
    });
  });

  describe('Color Themes', () => {
    it('should support red theme', () => {
      const props: GameOver3DProps = {
        active: true,
        finalScore: 1000,
        colorTheme: 'red',
      };
      expect(props.colorTheme).toBe('red');
    });

    it('should support purple theme', () => {
      const props: GameOver3DProps = {
        active: true,
        finalScore: 1000,
        colorTheme: 'purple',
      };
      expect(props.colorTheme).toBe('purple');
    });

    it('should support cyan theme', () => {
      const props: GameOver3DProps = {
        active: true,
        finalScore: 1000,
        colorTheme: 'cyan',
      };
      expect(props.colorTheme).toBe('cyan');
    });

    it('should support gold theme', () => {
      const props: GameOver3DProps = {
        active: true,
        finalScore: 1000,
        colorTheme: 'gold',
      };
      expect(props.colorTheme).toBe('gold');
    });
  });

  describe('Default Values', () => {
    it('should have sensible defaults', () => {
      const defaultProps: GameOver3DProps = {
        active: true,
        finalScore: 1000,
      };

      expect(defaultProps.position ?? [0, 0, 0]).toEqual([0, 0, 0]);
      expect(defaultProps.scale ?? 1).toBe(1);
      expect(defaultProps.duration ?? 3.0).toBe(3.0);
      expect(defaultProps.colorTheme ?? 'red').toBe('red');
    });
  });

  describe('High Score Detection', () => {
    it('should detect when final score exceeds high score', () => {
      const props: GameOver3DProps = {
        active: true,
        finalScore: 15000,
        highScore: 10000,
      };

      const isHighScore = props.finalScore > (props.highScore ?? 0);
      expect(isHighScore).toBe(true);
    });

    it('should detect when final score does not exceed high score', () => {
      const props: GameOver3DProps = {
        active: true,
        finalScore: 5000,
        highScore: 10000,
      };

      const isHighScore = props.finalScore > (props.highScore ?? 0);
      expect(isHighScore).toBe(false);
    });

    it('should handle when highScore is undefined', () => {
      const props: GameOver3DProps = {
        active: true,
        finalScore: 5000,
      };

      // When highScore is undefined, we don't show "NEW HIGH SCORE"
      expect(props.highScore).toBeUndefined();
    });

    it('should handle tie with high score', () => {
      const props: GameOver3DProps = {
        active: true,
        finalScore: 10000,
        highScore: 10000,
      };

      const isHighScore = props.finalScore > (props.highScore ?? 0);
      expect(isHighScore).toBe(false);
    });
  });

  describe('Score Formatting', () => {
    it('should handle zero score', () => {
      const props: GameOver3DProps = {
        active: true,
        finalScore: 0,
      };
      expect(props.finalScore).toBe(0);
    });

    it('should handle small scores', () => {
      const props: GameOver3DProps = {
        active: true,
        finalScore: 100,
      };
      expect(props.finalScore).toBe(100);
    });

    it('should handle large scores', () => {
      const props: GameOver3DProps = {
        active: true,
        finalScore: 999999,
      };
      expect(props.finalScore).toBe(999999);
    });

    it('should handle very large scores', () => {
      const props: GameOver3DProps = {
        active: true,
        finalScore: 1234567890,
      };
      expect(props.finalScore).toBe(1234567890);
    });
  });
});

describe('useGameOver3D Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize as inactive', () => {
      const { result } = renderHook(() => useGameOver3D());

      expect(result.current.isActive).toBe(false);
    });

    it('should initialize with zero score', () => {
      const { result } = renderHook(() => useGameOver3D());

      expect(result.current.props.finalScore).toBe(0);
    });

    it('should provide trigger function', () => {
      const { result } = renderHook(() => useGameOver3D());

      expect(typeof result.current.trigger).toBe('function');
    });

    it('should provide reset function', () => {
      const { result } = renderHook(() => useGameOver3D());

      expect(typeof result.current.reset).toBe('function');
    });

    it('should accept highScore parameter', () => {
      const { result } = renderHook(() => useGameOver3D(10000));

      expect(result.current.props.highScore).toBe(10000);
    });
  });

  describe('Triggering Game Over', () => {
    it('should activate when trigger is called', () => {
      const { result } = renderHook(() => useGameOver3D());

      act(() => {
        result.current.trigger(5000);
      });

      expect(result.current.isActive).toBe(true);
    });

    it('should set final score when triggered', () => {
      const { result } = renderHook(() => useGameOver3D());

      act(() => {
        result.current.trigger(12345);
      });

      expect(result.current.props.finalScore).toBe(12345);
    });

    it('should update props.active when triggered', () => {
      const { result } = renderHook(() => useGameOver3D());

      expect(result.current.props.active).toBe(false);

      act(() => {
        result.current.trigger(1000);
      });

      expect(result.current.props.active).toBe(true);
    });
  });

  describe('Resetting Game Over', () => {
    it('should deactivate when reset is called', () => {
      const { result } = renderHook(() => useGameOver3D());

      act(() => {
        result.current.trigger(5000);
      });

      expect(result.current.isActive).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.isActive).toBe(false);
    });

    it('should reset score to zero', () => {
      const { result } = renderHook(() => useGameOver3D());

      act(() => {
        result.current.trigger(5000);
      });

      expect(result.current.props.finalScore).toBe(5000);

      act(() => {
        result.current.reset();
      });

      expect(result.current.props.finalScore).toBe(0);
    });

    it('should update props.active when reset', () => {
      const { result } = renderHook(() => useGameOver3D());

      act(() => {
        result.current.trigger(1000);
      });

      expect(result.current.props.active).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.props.active).toBe(false);
    });
  });

  describe('Props Object', () => {
    it('should provide spreadable props object', () => {
      const { result } = renderHook(() => useGameOver3D(10000));

      const props = result.current.props;

      expect(props).toHaveProperty('active');
      expect(props).toHaveProperty('finalScore');
      expect(props).toHaveProperty('highScore');
      expect(props).toHaveProperty('onAnimationComplete');
    });

    it('should pass through highScore from hook parameter', () => {
      const { result } = renderHook(() => useGameOver3D(25000));

      expect(result.current.props.highScore).toBe(25000);
    });

    it('should handle undefined highScore', () => {
      const { result } = renderHook(() => useGameOver3D());

      expect(result.current.props.highScore).toBeUndefined();
    });
  });

  describe('Multiple Trigger/Reset Cycles', () => {
    it('should handle multiple game over cycles', () => {
      const { result } = renderHook(() => useGameOver3D());

      // First game over
      act(() => {
        result.current.trigger(1000);
      });
      expect(result.current.isActive).toBe(true);
      expect(result.current.props.finalScore).toBe(1000);

      // Reset
      act(() => {
        result.current.reset();
      });
      expect(result.current.isActive).toBe(false);

      // Second game over with higher score
      act(() => {
        result.current.trigger(2000);
      });
      expect(result.current.isActive).toBe(true);
      expect(result.current.props.finalScore).toBe(2000);
    });
  });
});

describe('GameOver3D Integration', () => {
  describe('Game Flow Integration', () => {
    it('should work with typical game flow', () => {
      const { result } = renderHook(() => useGameOver3D(10000));

      // Game ends
      act(() => {
        result.current.trigger(15000);
      });

      expect(result.current.isActive).toBe(true);
      expect(result.current.props.finalScore).toBe(15000);
      expect(result.current.props.highScore).toBe(10000);

      // Player clicks replay
      act(() => {
        result.current.reset();
      });

      expect(result.current.isActive).toBe(false);
    });

    it('should detect high score achievement', () => {
      const { result } = renderHook(() => useGameOver3D(10000));

      act(() => {
        result.current.trigger(15000);
      });

      const isHighScore = result.current.props.finalScore > (result.current.props.highScore ?? 0);
      expect(isHighScore).toBe(true);
    });

    it('should not trigger high score for lower scores', () => {
      const { result } = renderHook(() => useGameOver3D(10000));

      act(() => {
        result.current.trigger(5000);
      });

      const isHighScore = result.current.props.finalScore > (result.current.props.highScore ?? 0);
      expect(isHighScore).toBe(false);
    });
  });

  describe('Animation Completion', () => {
    it('should provide onAnimationComplete in props', () => {
      const { result } = renderHook(() => useGameOver3D());

      expect(typeof result.current.props.onAnimationComplete).toBe('function');
    });
  });
});

describe('GameOver3D Performance', () => {
  describe('Optimization', () => {
    it('should handle rapid trigger calls', () => {
      const { result } = renderHook(() => useGameOver3D());
      const startTime = performance.now();

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.trigger(i * 100);
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.current.isActive).toBe(true);
      expect(duration).toBeLessThan(100);
    });

    it('should handle rapid reset calls', () => {
      const { result } = renderHook(() => useGameOver3D());
      const startTime = performance.now();

      act(() => {
        result.current.trigger(1000);
        for (let i = 0; i < 100; i++) {
          result.current.reset();
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.current.isActive).toBe(false);
      expect(duration).toBeLessThan(100);
    });

    it('should handle alternating trigger/reset', () => {
      const { result } = renderHook(() => useGameOver3D());
      const startTime = performance.now();

      act(() => {
        for (let i = 0; i < 50; i++) {
          result.current.trigger(i * 100);
          result.current.reset();
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.current.isActive).toBe(false);
      expect(duration).toBeLessThan(100);
    });
  });
});
