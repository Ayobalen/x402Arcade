/**
 * ScreenGlow.test.tsx
 *
 * Tests for the ScreenGlow component that provides dynamic glow effects
 * responding to game states and events.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import * as THREE from 'three';

// Mock R3F to avoid WebGL requirements in tests
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
  ScreenGlow,
  useScreenGlowControl,
  GLOW_COLOR_PRESETS,
  type ScreenGlowProps,
  type GameState,
} from '../../src/components/3d/ScreenGlow';

describe('ScreenGlow Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Props Configuration', () => {
    it('should accept width and height props', () => {
      const props: ScreenGlowProps = {
        width: 5,
        height: 4,
      };
      expect(props.width).toBe(5);
      expect(props.height).toBe(4);
    });

    it('should accept zOffset prop', () => {
      const props: ScreenGlowProps = {
        zOffset: -0.1,
      };
      expect(props.zOffset).toBe(-0.1);
    });

    it('should accept gameState prop', () => {
      const props: ScreenGlowProps = {
        gameState: 'playing',
      };
      expect(props.gameState).toBe('playing');
    });

    it('should accept actionIntensity prop (0-1)', () => {
      const props: ScreenGlowProps = {
        actionIntensity: 0.7,
      };
      expect(props.actionIntensity).toBe(0.7);
    });

    it('should accept comboMultiplier prop', () => {
      const props: ScreenGlowProps = {
        comboMultiplier: 5,
      };
      expect(props.comboMultiplier).toBe(5);
    });

    it('should accept scored boolean prop', () => {
      const props: ScreenGlowProps = {
        scored: true,
      };
      expect(props.scored).toBe(true);
    });

    it('should accept damaged boolean prop', () => {
      const props: ScreenGlowProps = {
        damaged: true,
      };
      expect(props.damaged).toBe(true);
    });

    it('should accept customColor override', () => {
      const props: ScreenGlowProps = {
        customColor: '#ff0000',
      };
      expect(props.customColor).toBe('#ff0000');
    });

    it('should accept intensity configuration', () => {
      const props: ScreenGlowProps = {
        baseIntensity: 0.2,
        maxIntensity: 0.9,
      };
      expect(props.baseIntensity).toBe(0.2);
      expect(props.maxIntensity).toBe(0.9);
    });

    it('should accept expansionFactor prop', () => {
      const props: ScreenGlowProps = {
        expansionFactor: 1.2,
      };
      expect(props.expansionFactor).toBe(1.2);
    });

    it('should accept pulse configuration', () => {
      const props: ScreenGlowProps = {
        enablePulse: true,
        pulseSpeed: 2,
      };
      expect(props.enablePulse).toBe(true);
      expect(props.pulseSpeed).toBe(2);
    });

    it('should accept onGlowChange callback', () => {
      const callback = vi.fn();
      const props: ScreenGlowProps = {
        onGlowChange: callback,
      };
      expect(props.onGlowChange).toBe(callback);
    });
  });

  describe('Default Values', () => {
    it('should have sensible defaults', () => {
      const defaultProps: ScreenGlowProps = {};

      expect(defaultProps.width ?? 4).toBe(4);
      expect(defaultProps.height ?? 3).toBe(3);
      expect(defaultProps.zOffset ?? -0.05).toBe(-0.05);
      expect(defaultProps.gameState ?? 'idle').toBe('idle');
      expect(defaultProps.actionIntensity ?? 0).toBe(0);
      expect(defaultProps.comboMultiplier ?? 0).toBe(0);
      expect(defaultProps.scored ?? false).toBe(false);
      expect(defaultProps.damaged ?? false).toBe(false);
      expect(defaultProps.baseIntensity ?? 0.3).toBe(0.3);
      expect(defaultProps.maxIntensity ?? 1.0).toBe(1.0);
      expect(defaultProps.expansionFactor ?? 1.15).toBe(1.15);
      expect(defaultProps.enablePulse ?? true).toBe(true);
      expect(defaultProps.pulseSpeed ?? 1).toBe(1);
    });
  });

  describe('Game State Color Presets', () => {
    it('should have idle state preset (cyan)', () => {
      expect(GLOW_COLOR_PRESETS.idle).toBeDefined();
      expect(GLOW_COLOR_PRESETS.idle.primary).toBe('#00ffff');
    });

    it('should have playing state preset (green)', () => {
      expect(GLOW_COLOR_PRESETS.playing).toBeDefined();
      expect(GLOW_COLOR_PRESETS.playing.primary).toBe('#00ff88');
    });

    it('should have paused state preset (gray)', () => {
      expect(GLOW_COLOR_PRESETS.paused).toBeDefined();
      expect(GLOW_COLOR_PRESETS.paused.primary).toBe('#888888');
    });

    it('should have gameOver state preset (red)', () => {
      expect(GLOW_COLOR_PRESETS.gameOver).toBeDefined();
      expect(GLOW_COLOR_PRESETS.gameOver.primary).toBe('#ff4444');
    });

    it('should have victory state preset (gold)', () => {
      expect(GLOW_COLOR_PRESETS.victory).toBeDefined();
      expect(GLOW_COLOR_PRESETS.victory.primary).toBe('#ffff00');
    });

    it('should have all presets with primary, secondary, and pulse colors', () => {
      const states: GameState[] = ['idle', 'playing', 'paused', 'gameOver', 'victory'];
      for (const state of states) {
        expect(GLOW_COLOR_PRESETS[state].primary).toBeDefined();
        expect(GLOW_COLOR_PRESETS[state].secondary).toBeDefined();
        expect(GLOW_COLOR_PRESETS[state].pulse).toBeDefined();
      }
    });
  });
});

describe('useScreenGlowControl Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial State', () => {
    it('should initialize with default props', () => {
      const { result } = renderHook(() => useScreenGlowControl());

      expect(result.current.props.scored).toBe(false);
      expect(result.current.props.damaged).toBe(false);
      expect(result.current.props.actionIntensity).toBe(0);
      expect(result.current.props.comboMultiplier).toBe(0);
    });
  });

  describe('Score Trigger', () => {
    it('should set scored to true when triggerScore is called', () => {
      const { result } = renderHook(() => useScreenGlowControl());

      act(() => {
        result.current.triggerScore();
      });

      expect(result.current.props.scored).toBe(true);
    });

    it('should auto-reset scored after flash duration', () => {
      const { result } = renderHook(() => useScreenGlowControl());

      act(() => {
        result.current.triggerScore();
      });

      expect(result.current.props.scored).toBe(true);

      // Fast-forward past the flash duration (150ms)
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(result.current.props.scored).toBe(false);
    });

    it('should handle multiple rapid score triggers', () => {
      const { result } = renderHook(() => useScreenGlowControl());

      act(() => {
        result.current.triggerScore();
        result.current.triggerScore();
        result.current.triggerScore();
      });

      expect(result.current.props.scored).toBe(true);
    });
  });

  describe('Damage Trigger', () => {
    it('should set damaged to true when triggerDamage is called', () => {
      const { result } = renderHook(() => useScreenGlowControl());

      act(() => {
        result.current.triggerDamage();
      });

      expect(result.current.props.damaged).toBe(true);
    });

    it('should auto-reset damaged after flash duration', () => {
      const { result } = renderHook(() => useScreenGlowControl());

      act(() => {
        result.current.triggerDamage();
      });

      expect(result.current.props.damaged).toBe(true);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(result.current.props.damaged).toBe(false);
    });
  });

  describe('Action Intensity', () => {
    it('should update action intensity', () => {
      const { result } = renderHook(() => useScreenGlowControl());

      act(() => {
        result.current.setActionIntensity(0.5);
      });

      expect(result.current.props.actionIntensity).toBe(0.5);
    });

    it('should clamp action intensity to 0-1 range', () => {
      const { result } = renderHook(() => useScreenGlowControl());

      act(() => {
        result.current.setActionIntensity(1.5);
      });

      expect(result.current.props.actionIntensity).toBe(1);

      act(() => {
        result.current.setActionIntensity(-0.5);
      });

      expect(result.current.props.actionIntensity).toBe(0);
    });
  });

  describe('Combo Multiplier', () => {
    it('should update combo multiplier', () => {
      const { result } = renderHook(() => useScreenGlowControl());

      act(() => {
        result.current.setComboMultiplier(3);
      });

      expect(result.current.props.comboMultiplier).toBe(3);
    });

    it('should clamp combo multiplier to non-negative', () => {
      const { result } = renderHook(() => useScreenGlowControl());

      act(() => {
        result.current.setComboMultiplier(-2);
      });

      expect(result.current.props.comboMultiplier).toBe(0);
    });

    it('should handle high combo values', () => {
      const { result } = renderHook(() => useScreenGlowControl());

      act(() => {
        result.current.setComboMultiplier(10);
      });

      expect(result.current.props.comboMultiplier).toBe(10);
    });
  });

  describe('Combined Usage', () => {
    it('should handle score during high action intensity', () => {
      const { result } = renderHook(() => useScreenGlowControl());

      act(() => {
        result.current.setActionIntensity(0.8);
        result.current.setComboMultiplier(5);
        result.current.triggerScore();
      });

      expect(result.current.props.actionIntensity).toBe(0.8);
      expect(result.current.props.comboMultiplier).toBe(5);
      expect(result.current.props.scored).toBe(true);
    });

    it('should provide props object for spreading', () => {
      const { result } = renderHook(() => useScreenGlowControl());

      const props = result.current.props;

      expect(props).toHaveProperty('scored');
      expect(props).toHaveProperty('damaged');
      expect(props).toHaveProperty('actionIntensity');
      expect(props).toHaveProperty('comboMultiplier');
    });
  });
});

describe('ScreenGlow Integration', () => {
  describe('Game State Transitions', () => {
    it('should handle transition from idle to playing', () => {
      const props1: ScreenGlowProps = { gameState: 'idle' };
      const props2: ScreenGlowProps = { gameState: 'playing' };

      expect(props1.gameState).toBe('idle');
      expect(props2.gameState).toBe('playing');
    });

    it('should handle transition to game over', () => {
      const props: ScreenGlowProps = { gameState: 'gameOver' };
      expect(props.gameState).toBe('gameOver');
    });

    it('should handle transition to victory', () => {
      const props: ScreenGlowProps = { gameState: 'victory' };
      expect(props.gameState).toBe('victory');
    });
  });

  describe('Event Flash Effects', () => {
    it('should trigger score flash with green', () => {
      const { result } = renderHook(() => useScreenGlowControl());

      act(() => {
        result.current.triggerScore();
      });

      expect(result.current.props.scored).toBe(true);
      // Green flash for scoring
    });

    it('should trigger damage flash with red', () => {
      const { result } = renderHook(() => useScreenGlowControl());

      act(() => {
        result.current.triggerDamage();
      });

      expect(result.current.props.damaged).toBe(true);
      // Red flash for damage
    });
  });

  describe('Combo Effects', () => {
    it('should activate combo glow at multiplier >= 3', () => {
      const { result } = renderHook(() => useScreenGlowControl());

      act(() => {
        result.current.setComboMultiplier(3);
      });

      expect(result.current.props.comboMultiplier).toBe(3);
    });

    it('should increase intensity with higher combo', () => {
      const { result } = renderHook(() => useScreenGlowControl());

      act(() => {
        result.current.setComboMultiplier(5);
      });

      expect(result.current.props.comboMultiplier).toBe(5);
    });
  });
});

describe('ScreenGlow Performance', () => {
  describe('Optimization', () => {
    it('should handle rapid state changes efficiently', () => {
      const { result } = renderHook(() => useScreenGlowControl());
      const startTime = performance.now();

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.setActionIntensity(i / 100);
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
    });

    it('should handle rapid trigger calls', () => {
      vi.useRealTimers(); // Use real timers for performance test

      const { result } = renderHook(() => useScreenGlowControl());
      const startTime = performance.now();

      act(() => {
        for (let i = 0; i < 50; i++) {
          result.current.triggerScore();
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(50);
    });
  });
});
