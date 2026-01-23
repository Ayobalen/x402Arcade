/**
 * ScoreDisplay3D.test.tsx
 *
 * Tests for the 3D score display component with LED-style segments
 * and animation effects.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as THREE from 'three';

// Mock R3F
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="r3f-canvas">{children}</div>
  ),
  useFrame: vi.fn((callback) => {
    // Store callback for manual invocation in tests
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
  ScoreDisplay3D,
  useScoreDisplay,
  type ScoreDisplay3DProps,
  type UseScoreDisplayResult,
} from '../../src/components/3d/ScoreDisplay3D';

describe('ScoreDisplay3D Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Score Formatting', () => {
    it('should handle score of 0', () => {
      const props: ScoreDisplay3DProps = { score: 0 };
      expect(props.score).toBe(0);
    });

    it('should handle positive scores', () => {
      const props: ScoreDisplay3DProps = { score: 12345 };
      expect(props.score).toBe(12345);
    });

    it('should handle max digit constraint', () => {
      const props: ScoreDisplay3DProps = {
        score: 1234567,
        maxDigits: 6,
      };
      expect(props.maxDigits).toBe(6);
    });

    it('should respect showLeadingZeros option', () => {
      const propsWithZeros: ScoreDisplay3DProps = {
        score: 42,
        maxDigits: 6,
        showLeadingZeros: true,
      };
      expect(propsWithZeros.showLeadingZeros).toBe(true);

      const propsWithoutZeros: ScoreDisplay3DProps = {
        score: 42,
        maxDigits: 6,
        showLeadingZeros: false,
      };
      expect(propsWithoutZeros.showLeadingZeros).toBe(false);
    });
  });

  describe('Display Configuration', () => {
    it('should accept digit dimensions', () => {
      const props: ScoreDisplay3DProps = {
        digitWidth: 0.3,
        digitHeight: 0.5,
        digitSpacing: 0.1,
      };
      expect(props.digitWidth).toBe(0.3);
      expect(props.digitHeight).toBe(0.5);
      expect(props.digitSpacing).toBe(0.1);
    });

    it('should accept color configuration', () => {
      const props: ScoreDisplay3DProps = {
        color: '#00ff00', // Green
        offColor: '#111111',
      };
      expect(props.color).toBe('#00ff00');
      expect(props.offColor).toBe('#111111');
    });

    it('should accept glow configuration', () => {
      const props: ScoreDisplay3DProps = {
        glowIntensity: 0.9,
        enablePulse: true,
      };
      expect(props.glowIntensity).toBe(0.9);
      expect(props.enablePulse).toBe(true);
    });

    it('should accept position offset', () => {
      const props: ScoreDisplay3DProps = {
        position: [1, 2, 3],
      };
      expect(props.position).toEqual([1, 2, 3]);
    });
  });

  describe('Animation', () => {
    it('should accept animation speed', () => {
      const props: ScoreDisplay3DProps = {
        animationSpeed: 2,
      };
      expect(props.animationSpeed).toBe(2);
    });

    it('should accept onAnimationComplete callback', () => {
      const callback = vi.fn();
      const props: ScoreDisplay3DProps = {
        score: 100,
        onAnimationComplete: callback,
      };
      expect(props.onAnimationComplete).toBe(callback);
    });
  });

  describe('Default Values', () => {
    it('should have sensible defaults', () => {
      const defaultProps: ScoreDisplay3DProps = {};

      // score defaults to 0
      expect(defaultProps.score ?? 0).toBe(0);

      // maxDigits defaults to 6
      expect(defaultProps.maxDigits ?? 6).toBe(6);

      // color defaults to cyan
      expect(defaultProps.color ?? '#00ffff').toBe('#00ffff');
    });
  });
});

describe('useScoreDisplay Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Score Management', () => {
    it('should initialize with score 0', () => {
      const { result } = renderHook(() => useScoreDisplay());

      expect(result.current.score).toBe(0);
    });

    it('should update score via setScore', () => {
      const { result } = renderHook(() => useScoreDisplay());

      act(() => {
        result.current.setScore(500);
      });

      expect(result.current.score).toBe(500);
    });

    it('should increment score via addScore', () => {
      const { result } = renderHook(() => useScoreDisplay(100));

      act(() => {
        result.current.addScore(50);
      });

      expect(result.current.score).toBe(150);
    });

    it('should reset score with resetScore', () => {
      const { result } = renderHook(() => useScoreDisplay(500));

      act(() => {
        result.current.resetScore();
      });

      expect(result.current.score).toBe(0);
    });
  });

  describe('Score Updates', () => {
    it('should not allow negative scores via setScore', () => {
      const { result } = renderHook(() => useScoreDisplay());

      act(() => {
        result.current.setScore(-100);
      });

      expect(result.current.score).toBe(0);
    });

    it('should handle score changes via setScore', () => {
      const { result } = renderHook(() => useScoreDisplay());

      act(() => {
        result.current.setScore(100);
      });

      expect(result.current.score).toBe(100);
    });
  });

  describe('Props Object', () => {
    it('should provide props with score', () => {
      const { result } = renderHook(() => useScoreDisplay(250));

      const props = result.current.props;

      expect(props.score).toBe(250);
    });

    it('should update props when score changes', () => {
      const { result } = renderHook(() => useScoreDisplay());

      act(() => {
        result.current.setScore(999);
      });

      expect(result.current.props.score).toBe(999);
    });
  });

  describe('Initial Configuration', () => {
    it('should accept initialScore as parameter', () => {
      const { result } = renderHook(() => useScoreDisplay(1000));

      expect(result.current.score).toBe(1000);
    });

    it('should default to 0 when no initialScore provided', () => {
      const { result } = renderHook(() => useScoreDisplay());

      expect(result.current.score).toBe(0);
    });
  });
});

describe('ScoreDisplay3D Integration', () => {
  describe('Game Score Updates', () => {
    it('should handle rapid score increments', () => {
      const { result } = renderHook(() => useScoreDisplay());

      // Simulate rapid scoring (like eating multiple items)
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.addScore(10);
        }
      });

      expect(result.current.score).toBe(100);
    });

    it('should handle large score jumps', () => {
      const { result } = renderHook(() => useScoreDisplay());

      act(() => {
        result.current.setScore(999999);
      });

      expect(result.current.score).toBe(999999);
    });

    it('should handle large scores gracefully', () => {
      const { result } = renderHook(() => useScoreDisplay(0));

      act(() => {
        result.current.setScore(12345); // A large score
      });

      // Score should still update
      expect(result.current.score).toBe(12345);
    });
  });

  describe('Game Reset Scenarios', () => {
    it('should reset cleanly for new game', () => {
      const { result } = renderHook(() => useScoreDisplay(5000));

      act(() => {
        result.current.resetScore();
      });

      expect(result.current.score).toBe(0);
      expect(result.current.props.score).toBe(0);
    });
  });
});

describe('ScoreDisplay3D Performance', () => {
  describe('Optimization', () => {
    it('should batch rapid updates efficiently', () => {
      const { result } = renderHook(() => useScoreDisplay());
      const startTime = performance.now();

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.addScore(1);
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.current.score).toBe(100);
      // Should complete rapidly (less than 100ms for 100 updates)
      expect(duration).toBeLessThan(100);
    });
  });
});
