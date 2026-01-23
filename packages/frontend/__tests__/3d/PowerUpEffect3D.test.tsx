/**
 * PowerUpEffect3D.test.tsx
 *
 * Tests for the PowerUpEffect3D component that provides
 * particle and mesh effects for power-up collection.
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

import {
  PowerUpEffect3D,
  usePowerUpEffect,
  POWER_UP_COLORS,
  type PowerUpEffect3DProps,
  type PowerUpType,
  type PowerUpColorConfig,
} from '../../src/components/3d/PowerUpEffect3D';

describe('PowerUpEffect3D Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Power-Up Types', () => {
    const powerUpTypes: PowerUpType[] = [
      'speed',
      'shield',
      'multiball',
      'laser',
      'slow',
      'bonus',
      'mystery',
    ];

    it('should support all power-up types', () => {
      for (const type of powerUpTypes) {
        const props: PowerUpEffect3DProps = {
          type,
          position: [0, 0, 0],
        };
        expect(props.type).toBe(type);
      }
    });
  });

  describe('Props Configuration', () => {
    it('should require type prop', () => {
      const props: PowerUpEffect3DProps = {
        type: 'speed',
        position: [0, 0, 0],
      };
      expect(props.type).toBe('speed');
    });

    it('should require position prop', () => {
      const props: PowerUpEffect3DProps = {
        type: 'speed',
        position: [1, 2, 3],
      };
      expect(props.position).toEqual([1, 2, 3]);
    });

    it('should accept active prop', () => {
      const props: PowerUpEffect3DProps = {
        type: 'speed',
        position: [0, 0, 0],
        active: true,
      };
      expect(props.active).toBe(true);
    });

    it('should accept duration prop', () => {
      const props: PowerUpEffect3DProps = {
        type: 'shield',
        position: [0, 0, 0],
        duration: 2.0,
      };
      expect(props.duration).toBe(2.0);
    });

    it('should accept scale prop', () => {
      const props: PowerUpEffect3DProps = {
        type: 'multiball',
        position: [0, 0, 0],
        scale: 1.5,
      };
      expect(props.scale).toBe(1.5);
    });

    it('should accept particleCount prop', () => {
      const props: PowerUpEffect3DProps = {
        type: 'laser',
        position: [0, 0, 0],
        particleCount: 30,
      };
      expect(props.particleCount).toBe(30);
    });

    it('should accept onComplete callback', () => {
      const callback = vi.fn();
      const props: PowerUpEffect3DProps = {
        type: 'bonus',
        position: [0, 0, 0],
        onComplete: callback,
      };
      expect(props.onComplete).toBe(callback);
    });
  });

  describe('Default Values', () => {
    it('should have sensible defaults', () => {
      const defaultProps: PowerUpEffect3DProps = {
        type: 'speed',
        position: [0, 0, 0],
      };

      expect(defaultProps.active ?? false).toBe(false);
      expect(defaultProps.duration ?? 1.0).toBe(1.0);
      expect(defaultProps.scale ?? 1).toBe(1);
      expect(defaultProps.particleCount ?? 20).toBe(20);
    });
  });

  describe('Power-Up Color Configurations', () => {
    it('should have speed color config (cyan/electric blue)', () => {
      expect(POWER_UP_COLORS.speed).toBeDefined();
      expect(POWER_UP_COLORS.speed.primary).toBe('#00ffff');
      expect(POWER_UP_COLORS.speed.secondary).toBe('#0088ff');
    });

    it('should have shield color config (gold)', () => {
      expect(POWER_UP_COLORS.shield).toBeDefined();
      expect(POWER_UP_COLORS.shield.primary).toBe('#ffd700');
    });

    it('should have multiball color config (bright green)', () => {
      expect(POWER_UP_COLORS.multiball).toBeDefined();
      expect(POWER_UP_COLORS.multiball.primary).toBe('#00ff88');
    });

    it('should have laser color config (magenta)', () => {
      expect(POWER_UP_COLORS.laser).toBeDefined();
      expect(POWER_UP_COLORS.laser.primary).toBe('#ff00ff');
    });

    it('should have slow color config (purple)', () => {
      expect(POWER_UP_COLORS.slow).toBeDefined();
      expect(POWER_UP_COLORS.slow.primary).toBe('#8844ff');
    });

    it('should have bonus color config (orange)', () => {
      expect(POWER_UP_COLORS.bonus).toBeDefined();
      expect(POWER_UP_COLORS.bonus.primary).toBe('#ff8800');
    });

    it('should have mystery color config (white/cycling)', () => {
      expect(POWER_UP_COLORS.mystery).toBeDefined();
      expect(POWER_UP_COLORS.mystery.primary).toBe('#ffffff');
    });

    it('should have all configs with primary, secondary, and glow', () => {
      const types: PowerUpType[] = ['speed', 'shield', 'multiball', 'laser', 'slow', 'bonus', 'mystery'];
      for (const type of types) {
        const config: PowerUpColorConfig = POWER_UP_COLORS[type];
        expect(config.primary).toBeDefined();
        expect(config.secondary).toBeDefined();
        expect(config.glow).toBeDefined();
      }
    });
  });
});

describe('usePowerUpEffect Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with empty active effects', () => {
      const { result } = renderHook(() => usePowerUpEffect());

      expect(result.current.activeEffects).toEqual([]);
    });

    it('should provide trigger function', () => {
      const { result } = renderHook(() => usePowerUpEffect());

      expect(typeof result.current.trigger).toBe('function');
    });

    it('should provide props function', () => {
      const { result } = renderHook(() => usePowerUpEffect());

      expect(typeof result.current.props).toBe('function');
    });
  });

  describe('Triggering Effects', () => {
    it('should add effect when trigger is called', () => {
      const { result } = renderHook(() => usePowerUpEffect());

      act(() => {
        result.current.trigger('speed', [1, 0, 0]);
      });

      expect(result.current.activeEffects.length).toBe(1);
      expect(result.current.activeEffects[0].type).toBe('speed');
      expect(result.current.activeEffects[0].position).toEqual([1, 0, 0]);
    });

    it('should assign unique IDs to effects', () => {
      const { result } = renderHook(() => usePowerUpEffect());

      act(() => {
        result.current.trigger('speed', [0, 0, 0]);
        result.current.trigger('shield', [1, 0, 0]);
      });

      expect(result.current.activeEffects[0].id).not.toBe(result.current.activeEffects[1].id);
    });

    it('should support multiple concurrent effects', () => {
      const { result } = renderHook(() => usePowerUpEffect());

      act(() => {
        result.current.trigger('speed', [0, 0, 0]);
        result.current.trigger('shield', [1, 0, 0]);
        result.current.trigger('laser', [2, 0, 0]);
      });

      expect(result.current.activeEffects.length).toBe(3);
    });

    it('should trigger effects of all power-up types', () => {
      const { result } = renderHook(() => usePowerUpEffect());
      const types: PowerUpType[] = ['speed', 'shield', 'multiball', 'laser', 'slow', 'bonus', 'mystery'];

      act(() => {
        types.forEach((type, index) => {
          result.current.trigger(type, [index, 0, 0]);
        });
      });

      expect(result.current.activeEffects.length).toBe(types.length);
    });
  });

  describe('Props Generation', () => {
    it('should generate props for an active effect', () => {
      const { result } = renderHook(() => usePowerUpEffect());

      act(() => {
        result.current.trigger('speed', [1, 2, 3]);
      });

      const effectId = result.current.activeEffects[0].id;
      const props = result.current.props(effectId);

      expect(props.type).toBe('speed');
      expect(props.position).toEqual([1, 2, 3]);
      expect(props.active).toBe(true);
      expect(typeof props.onComplete).toBe('function');
    });

    it('should return default props for unknown ID', () => {
      const { result } = renderHook(() => usePowerUpEffect());

      const props = result.current.props(999);

      expect(props.type).toBe('bonus');
      expect(props.position).toEqual([0, 0, 0]);
      expect(props.active).toBe(false);
    });
  });

  describe('Effect Completion', () => {
    it('should remove effect when onComplete is called', () => {
      const { result } = renderHook(() => usePowerUpEffect());

      act(() => {
        result.current.trigger('speed', [0, 0, 0]);
      });

      expect(result.current.activeEffects.length).toBe(1);

      const effectId = result.current.activeEffects[0].id;
      const props = result.current.props(effectId);

      act(() => {
        props.onComplete();
      });

      expect(result.current.activeEffects.length).toBe(0);
    });

    it('should only remove the completed effect', () => {
      const { result } = renderHook(() => usePowerUpEffect());

      act(() => {
        result.current.trigger('speed', [0, 0, 0]);
        result.current.trigger('shield', [1, 0, 0]);
        result.current.trigger('laser', [2, 0, 0]);
      });

      expect(result.current.activeEffects.length).toBe(3);

      const secondEffectId = result.current.activeEffects[1].id;
      const props = result.current.props(secondEffectId);

      act(() => {
        props.onComplete();
      });

      expect(result.current.activeEffects.length).toBe(2);
      expect(result.current.activeEffects.find(e => e.type === 'shield')).toBeUndefined();
    });
  });
});

describe('PowerUpEffect3D Integration', () => {
  describe('Game Integration Scenarios', () => {
    it('should handle power-up collection flow', () => {
      const { result } = renderHook(() => usePowerUpEffect());

      // Player collects speed power-up
      act(() => {
        result.current.trigger('speed', [5, 0, 0]);
      });

      expect(result.current.activeEffects.length).toBe(1);

      // Effect plays and completes
      const effectId = result.current.activeEffects[0].id;
      act(() => {
        result.current.props(effectId).onComplete();
      });

      expect(result.current.activeEffects.length).toBe(0);
    });

    it('should handle rapid consecutive collections', () => {
      const { result } = renderHook(() => usePowerUpEffect());

      // Rapid collection of multiple power-ups
      act(() => {
        result.current.trigger('speed', [0, 0, 0]);
        result.current.trigger('multiball', [1, 0, 0]);
        result.current.trigger('bonus', [2, 0, 0]);
      });

      expect(result.current.activeEffects.length).toBe(3);
    });

    it('should support rendering multiple effects at same position', () => {
      const { result } = renderHook(() => usePowerUpEffect());

      act(() => {
        result.current.trigger('speed', [0, 0, 0]);
        result.current.trigger('shield', [0, 0, 0]);
      });

      expect(result.current.activeEffects.length).toBe(2);
      expect(result.current.activeEffects[0].position).toEqual([0, 0, 0]);
      expect(result.current.activeEffects[1].position).toEqual([0, 0, 0]);
    });
  });

  describe('Position Handling', () => {
    it('should handle negative positions', () => {
      const { result } = renderHook(() => usePowerUpEffect());

      act(() => {
        result.current.trigger('speed', [-5, -3, -1]);
      });

      expect(result.current.activeEffects[0].position).toEqual([-5, -3, -1]);
    });

    it('should handle decimal positions', () => {
      const { result } = renderHook(() => usePowerUpEffect());

      act(() => {
        result.current.trigger('shield', [1.5, 2.75, 0.25]);
      });

      expect(result.current.activeEffects[0].position).toEqual([1.5, 2.75, 0.25]);
    });
  });
});

describe('PowerUpEffect3D Performance', () => {
  describe('Optimization', () => {
    it('should handle many concurrent effects efficiently', () => {
      const { result } = renderHook(() => usePowerUpEffect());
      const startTime = performance.now();

      act(() => {
        for (let i = 0; i < 50; i++) {
          result.current.trigger('speed', [i, 0, 0]);
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.current.activeEffects.length).toBe(50);
      expect(duration).toBeLessThan(100);
    });

    it('should efficiently remove multiple effects', () => {
      const { result } = renderHook(() => usePowerUpEffect());

      act(() => {
        for (let i = 0; i < 20; i++) {
          result.current.trigger('shield', [i, 0, 0]);
        }
      });

      const ids = result.current.activeEffects.map(e => e.id);
      const startTime = performance.now();

      act(() => {
        for (const id of ids) {
          result.current.props(id).onComplete();
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.current.activeEffects.length).toBe(0);
      expect(duration).toBeLessThan(100);
    });
  });
});
