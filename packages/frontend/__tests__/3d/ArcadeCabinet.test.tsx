/**
 * ArcadeCabinet.test.tsx
 *
 * Unit tests for arcade cabinet 3D components covering rendering,
 * interactions, and prop variations.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import * as THREE from 'three'

// Mock R3F to avoid WebGL requirements in tests
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="r3f-canvas">{children}</div>
  ),
  useFrame: vi.fn((callback) => {
    // Store callback for manual invocation in tests
    ;(global as Record<string, unknown>).__useFrameCallback = callback
  }),
  useThree: vi.fn(() => ({
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(),
    gl: {},
    size: { width: 800, height: 600 },
    viewport: { width: 800, height: 600, factor: 1 },
  })),
  ThreeEvent: vi.fn(),
}))

// Mock drei components
vi.mock('@react-three/drei', () => ({
  RoundedBox: ({
    children,
    ...props
  }: {
    children?: React.ReactNode
    [key: string]: unknown
  }) => <mesh {...props}>{children}</mesh>,
  useTexture: vi.fn(() => new THREE.Texture()),
  useGLTF: vi.fn(() => ({
    nodes: {},
    materials: {},
  })),
  Html: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="drei-html">{children}</div>
  ),
}))

// Import components after mocks are set up
import {
  CABINET_BODY,
  CABINET_SCREEN,
  CABINET_COLORS,
  MESH_NAMES,
  getCabinetDimensions,
  getScreenOuterDimensions,
  getCabinetBoundingBox,
  getOptimalCameraPosition,
} from '../../src/components/3d/cabinet/ArcadeCabinetGeometry'

import {
  CabinetBodyProps,
  SimpleCabinetBodyProps,
  useCabinetBody,
} from '../../src/components/3d/cabinet/CabinetBody'

import {
  ScreenBezelProps,
  useScreenBezel,
} from '../../src/components/3d/cabinet/ScreenBezel'

import {
  useCabinetHover,
  HOVER_GLOW_PRESETS,
  type CabinetHoverGlowProps,
} from '../../src/components/3d/cabinet/CabinetHoverGlow'

import {
  CABINET_LIGHTING_PRESETS,
  getCabinetLightingPreset,
  getOptimalLightConfig,
  useCabinetLighting,
  type CabinetLightingProps,
  type CabinetLightingPreset,
} from '../../src/components/3d/cabinet/CabinetLighting'

// ============================================================================
// Geometry Tests
// ============================================================================

describe('ArcadeCabinetGeometry', () => {
  describe('Cabinet Body Dimensions', () => {
    it('should have valid width', () => {
      expect(CABINET_BODY.width).toBeGreaterThan(0)
      expect(CABINET_BODY.width).toBe(2.4)
    })

    it('should have valid total height', () => {
      expect(CABINET_BODY.totalHeight).toBeGreaterThan(0)
      expect(CABINET_BODY.totalHeight).toBe(5.6)
    })

    it('should have valid depth', () => {
      expect(CABINET_BODY.depth).toBeGreaterThan(0)
      expect(CABINET_BODY.depth).toBe(1.8)
    })

    it('should have valid wall thickness', () => {
      expect(CABINET_BODY.wallThickness).toBeGreaterThan(0)
      expect(CABINET_BODY.wallThickness).toBeLessThan(CABINET_BODY.width / 4)
    })

    it('should have valid corner radius', () => {
      expect(CABINET_BODY.cornerRadius).toBeGreaterThan(0)
      expect(CABINET_BODY.cornerRadius).toBeLessThan(CABINET_BODY.width / 2)
    })
  })

  describe('Screen Dimensions', () => {
    it('should have valid screen width', () => {
      expect(CABINET_SCREEN.screenWidth).toBeGreaterThan(0)
      expect(CABINET_SCREEN.screenWidth).toBeLessThan(CABINET_BODY.width)
    })

    it('should have valid screen height', () => {
      expect(CABINET_SCREEN.screenHeight).toBeGreaterThan(0)
    })

    it('should have valid bezel width', () => {
      expect(CABINET_SCREEN.bezelWidth).toBeGreaterThan(0)
    })

    it('should have valid screen recess', () => {
      expect(CABINET_SCREEN.screenRecess).toBeGreaterThan(0)
    })

    it('should have valid screen angle', () => {
      expect(CABINET_SCREEN.screenAngle).toBeGreaterThanOrEqual(0)
      expect(CABINET_SCREEN.screenAngle).toBeLessThanOrEqual(45)
    })
  })

  describe('Mesh Names', () => {
    it('should have body mesh names', () => {
      expect(MESH_NAMES.body).toBeDefined()
      expect(MESH_NAMES.body.group).toBeDefined()
      expect(MESH_NAMES.body.main).toBeDefined()
    })

    it('should have screen mesh names', () => {
      expect(MESH_NAMES.screen).toBeDefined()
      expect(MESH_NAMES.screen.group).toBeDefined()
      expect(MESH_NAMES.screen.bezel).toBeDefined()
    })
  })

  describe('Cabinet Colors', () => {
    it('should have valid body color', () => {
      expect(CABINET_COLORS.body).toBeDefined()
      expect(typeof CABINET_COLORS.body).toBe('string')
    })

    it('should have valid bezel color', () => {
      expect(CABINET_COLORS.bezel).toBeDefined()
      expect(typeof CABINET_COLORS.bezel).toBe('string')
    })
  })

  describe('Utility Functions', () => {
    it('should get cabinet dimensions', () => {
      const dims = getCabinetDimensions()
      expect(dims).toBeDefined()
      expect(dims.body).toBeDefined()
      expect(dims.body.width).toBe(CABINET_BODY.width)
      expect(dims.screen).toBeDefined()
    })

    it('should get screen outer dimensions', () => {
      const dims = getScreenOuterDimensions()
      expect(dims).toBeDefined()
      expect(dims.width).toBeGreaterThan(CABINET_SCREEN.screenWidth)
      expect(dims.height).toBeGreaterThan(CABINET_SCREEN.screenHeight)
    })

    it('should get cabinet bounding box', () => {
      const box = getCabinetBoundingBox()
      expect(box).toBeDefined()
      expect(box.minX).toBeDefined()
      expect(box.maxX).toBeDefined()
      expect(box.width).toBe(box.maxX - box.minX)
    })

    it('should get optimal camera position', () => {
      const pos = getOptimalCameraPosition()
      expect(pos).toBeDefined()
      expect(Array.isArray(pos)).toBe(true)
      expect(pos.length).toBe(3)
      expect(pos[2]).toBeGreaterThan(0) // Camera should be in front
    })
  })
})

// ============================================================================
// CabinetBody Tests
// ============================================================================

describe('CabinetBody Component', () => {
  describe('Props Configuration', () => {
    it('should accept position prop', () => {
      const props: CabinetBodyProps = {
        position: [1, 2, 3],
      }
      expect(props.position).toEqual([1, 2, 3])
    })

    it('should accept rotation prop', () => {
      const props: CabinetBodyProps = {
        rotation: [0, Math.PI / 4, 0],
      }
      expect(props.rotation).toEqual([0, Math.PI / 4, 0])
    })

    it('should accept scale prop', () => {
      const props: CabinetBodyProps = {
        scale: 1.5,
      }
      expect(props.scale).toBe(1.5)
    })

    it('should accept bodyColor prop', () => {
      const props: CabinetBodyProps = {
        bodyColor: '#1a1a2e',
      }
      expect(props.bodyColor).toBe('#1a1a2e')
    })

    it('should accept material props', () => {
      const props: CabinetBodyProps = {
        roughness: 0.5,
        metalness: 0.3,
      }
      expect(props.roughness).toBe(0.5)
      expect(props.metalness).toBe(0.3)
    })

    it('should accept shadow props', () => {
      const props: CabinetBodyProps = {
        castShadow: true,
        receiveShadow: true,
      }
      expect(props.castShadow).toBe(true)
      expect(props.receiveShadow).toBe(true)
    })

    it('should accept wireframe prop', () => {
      const props: CabinetBodyProps = {
        wireframe: true,
      }
      expect(props.wireframe).toBe(true)
    })

    it('should accept animated prop', () => {
      const props: CabinetBodyProps = {
        animated: true,
      }
      expect(props.animated).toBe(true)
    })
  })

  describe('SimpleCabinetBody Props', () => {
    it('should accept simplified props', () => {
      const props: SimpleCabinetBodyProps = {
        position: [0, 0, 0],
        color: '#0a0a0f',
        scale: 1,
      }
      expect(props.position).toEqual([0, 0, 0])
      expect(props.color).toBe('#0a0a0f')
      expect(props.scale).toBe(1)
    })
  })

  describe('useCabinetBody Hook', () => {
    it('should return ref and control methods', () => {
      const { result } = renderHook(() => useCabinetBody())

      expect(result.current.ref).toBeDefined()
      expect(result.current.setColor).toBeDefined()
      expect(result.current.getDimensions).toBeDefined()
      expect(result.current.getPosition).toBeDefined()
    })

    it('should get correct dimensions', () => {
      const { result } = renderHook(() => useCabinetBody())

      const dims = result.current.getDimensions()
      expect(dims.width).toBe(CABINET_BODY.width)
      expect(dims.depth).toBe(CABINET_BODY.depth)
    })
  })
})

// ============================================================================
// ScreenBezel Tests
// ============================================================================

describe('ScreenBezel Component', () => {
  describe('Props Configuration', () => {
    it('should accept position and rotation props', () => {
      const props: ScreenBezelProps = {
        position: [0, 3.6, 0.8],
        rotation: [-0.2, 0, 0],
      }
      expect(props.position).toEqual([0, 3.6, 0.8])
      expect(props.rotation).toEqual([-0.2, 0, 0])
    })

    it('should accept bezel color prop', () => {
      const props: ScreenBezelProps = {
        bezelColor: '#050508',
      }
      expect(props.bezelColor).toBe('#050508')
    })

    it('should accept glow props', () => {
      const props: ScreenBezelProps = {
        enableGlow: true,
        glowColor: '#00ffff',
        glowIntensity: 0.5,
      }
      expect(props.enableGlow).toBe(true)
      expect(props.glowColor).toBe('#00ffff')
      expect(props.glowIntensity).toBe(0.5)
    })

    it('should accept screen dimension props', () => {
      const props: ScreenBezelProps = {
        screenWidth: 1.6,
        screenHeight: 1.2,
        bezelWidth: 0.12,
        bezelDepth: 0.05,
      }
      expect(props.screenWidth).toBe(1.6)
      expect(props.screenHeight).toBe(1.2)
    })
  })

  describe('useScreenBezel Hook', () => {
    it('should return ref and control methods', () => {
      const { result } = renderHook(() => useScreenBezel())

      expect(result.current.ref).toBeDefined()
      expect(result.current.setGlowIntensity).toBeDefined()
      expect(result.current.pulse).toBeDefined()
      expect(result.current.getScreenDimensions).toBeDefined()
    })

    it('should set glow intensity', () => {
      const { result } = renderHook(() => useScreenBezel())

      act(() => {
        result.current.setGlowIntensity(0.8)
      })

      // Intensity is clamped to 0-1
      expect(result.current.glowIntensity).toBeLessThanOrEqual(1)
      expect(result.current.glowIntensity).toBeGreaterThanOrEqual(0)
    })

    it('should get screen dimensions', () => {
      const { result } = renderHook(() => useScreenBezel())

      const dims = result.current.getScreenDimensions()
      expect(dims.screenWidth).toBe(CABINET_SCREEN.screenWidth)
      expect(dims.screenHeight).toBe(CABINET_SCREEN.screenHeight)
    })
  })
})

// ============================================================================
// CabinetHoverGlow Tests
// ============================================================================

describe('CabinetHoverGlow Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Props Configuration', () => {
    it('should accept enabled prop', () => {
      const props: CabinetHoverGlowProps = {
        enabled: true,
      }
      expect(props.enabled).toBe(true)
    })

    it('should accept intensity props', () => {
      const props: CabinetHoverGlowProps = {
        baseIntensity: 0.1,
        hoverIntensity: 0.6,
      }
      expect(props.baseIntensity).toBe(0.1)
      expect(props.hoverIntensity).toBe(0.6)
    })

    it('should accept color props', () => {
      const props: CabinetHoverGlowProps = {
        glowColor: '#8B5CF6',
        edgeColor: '#00ffff',
      }
      expect(props.glowColor).toBe('#8B5CF6')
      expect(props.edgeColor).toBe('#00ffff')
    })

    it('should accept transition props', () => {
      const props: CabinetHoverGlowProps = {
        transitionDuration: 0.3,
      }
      expect(props.transitionDuration).toBe(0.3)
    })

    it('should accept cursor props', () => {
      const props: CabinetHoverGlowProps = {
        changeCursor: true,
        hoverCursor: 'pointer',
      }
      expect(props.changeCursor).toBe(true)
      expect(props.hoverCursor).toBe('pointer')
    })

    it('should accept event callbacks', () => {
      const onHoverStart = vi.fn()
      const onHoverEnd = vi.fn()
      const onClick = vi.fn()

      const props: CabinetHoverGlowProps = {
        onHoverStart,
        onHoverEnd,
        onClick,
      }

      expect(props.onHoverStart).toBe(onHoverStart)
      expect(props.onHoverEnd).toBe(onHoverEnd)
      expect(props.onClick).toBe(onClick)
    })
  })

  describe('Hover Glow Presets', () => {
    it('should have arcade preset', () => {
      expect(HOVER_GLOW_PRESETS.arcade).toBeDefined()
      expect(HOVER_GLOW_PRESETS.arcade.glowColor).toBe('#8B5CF6')
      expect(HOVER_GLOW_PRESETS.arcade.edgeColor).toBe('#00ffff')
    })

    it('should have cyberpunk preset', () => {
      expect(HOVER_GLOW_PRESETS.cyberpunk).toBeDefined()
      expect(HOVER_GLOW_PRESETS.cyberpunk.glowColor).toBe('#ff00ff')
    })

    it('should have subtle preset', () => {
      expect(HOVER_GLOW_PRESETS.subtle).toBeDefined()
      expect(HOVER_GLOW_PRESETS.subtle.hoverIntensity).toBeLessThan(
        HOVER_GLOW_PRESETS.arcade.hoverIntensity
      )
    })

    it('should have gaming preset', () => {
      expect(HOVER_GLOW_PRESETS.gaming).toBeDefined()
      expect(HOVER_GLOW_PRESETS.gaming.hoverIntensity).toBe(1.0)
    })

    it('should have retro preset', () => {
      expect(HOVER_GLOW_PRESETS.retro).toBeDefined()
      expect(HOVER_GLOW_PRESETS.retro.glowColor).toBe('#ff3333')
    })
  })

  describe('useCabinetHover Hook', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useCabinetHover())

      expect(result.current.isHovered).toBe(false)
      expect(result.current.intensity).toBeGreaterThan(0)
      expect(result.current.progress).toBe(0)
    })

    it('should toggle hover state on pointer over', () => {
      const { result } = renderHook(() => useCabinetHover())

      act(() => {
        result.current.onPointerOver()
      })

      expect(result.current.isHovered).toBe(true)
    })

    it('should toggle hover state off on pointer out', () => {
      const { result } = renderHook(() => useCabinetHover())

      act(() => {
        result.current.onPointerOver()
      })

      expect(result.current.isHovered).toBe(true)

      act(() => {
        result.current.onPointerOut()
      })

      expect(result.current.isHovered).toBe(false)
    })

    it('should call onHoverStart callback', () => {
      const onHoverStart = vi.fn()
      const { result } = renderHook(() =>
        useCabinetHover({ onHoverStart })
      )

      act(() => {
        result.current.onPointerOver()
      })

      expect(onHoverStart).toHaveBeenCalled()
    })

    it('should call onHoverEnd callback', () => {
      const onHoverEnd = vi.fn()
      const { result } = renderHook(() =>
        useCabinetHover({ onHoverEnd })
      )

      act(() => {
        result.current.onPointerOver()
        result.current.onPointerOut()
      })

      expect(onHoverEnd).toHaveBeenCalled()
    })

    it('should allow manual hover control', () => {
      const { result } = renderHook(() => useCabinetHover())

      act(() => {
        result.current.setHovered(true)
      })

      expect(result.current.isHovered).toBe(true)

      act(() => {
        result.current.setHovered(false)
      })

      expect(result.current.isHovered).toBe(false)
    })

    it('should not trigger hover when disabled', () => {
      const onHoverStart = vi.fn()
      const { result } = renderHook(() =>
        useCabinetHover({ enabled: false, onHoverStart })
      )

      act(() => {
        result.current.onPointerOver()
      })

      expect(result.current.isHovered).toBe(false)
      expect(onHoverStart).not.toHaveBeenCalled()
    })
  })
})

// ============================================================================
// CabinetLighting Tests
// ============================================================================

describe('CabinetLighting Component', () => {
  describe('Props Configuration', () => {
    it('should accept position prop', () => {
      const props: CabinetLightingProps = {
        position: [0, 0, 0],
      }
      expect(props.position).toEqual([0, 0, 0])
    })

    it('should accept spotlight props', () => {
      const props: CabinetLightingProps = {
        enableSpotlight: true,
        spotlightColor: '#ffffff',
        spotlightIntensity: 1.5,
      }
      expect(props.enableSpotlight).toBe(true)
      expect(props.spotlightColor).toBe('#ffffff')
      expect(props.spotlightIntensity).toBe(1.5)
    })

    it('should accept rim light props', () => {
      const props: CabinetLightingProps = {
        enableRimLights: true,
        rimLightLeftColor: '#8B5CF6',
        rimLightRightColor: '#00ffff',
        rimLightIntensity: 1.0,
      }
      expect(props.enableRimLights).toBe(true)
      expect(props.rimLightLeftColor).toBe('#8B5CF6')
      expect(props.rimLightRightColor).toBe('#00ffff')
    })

    it('should accept floor bounce props', () => {
      const props: CabinetLightingProps = {
        enableFloorBounce: true,
        floorBounceColor: '#1a1a2e',
        floorBounceIntensity: 0.3,
      }
      expect(props.enableFloorBounce).toBe(true)
      expect(props.floorBounceColor).toBe('#1a1a2e')
    })

    it('should accept shadow props', () => {
      const props: CabinetLightingProps = {
        castShadow: true,
        shadowQuality: 'high',
      }
      expect(props.castShadow).toBe(true)
      expect(props.shadowQuality).toBe('high')
    })

    it('should accept pulse props', () => {
      const props: CabinetLightingProps = {
        enablePulse: true,
        pulseSpeed: 0.5,
      }
      expect(props.enablePulse).toBe(true)
      expect(props.pulseSpeed).toBe(0.5)
    })

    it('should accept preset prop', () => {
      const props: CabinetLightingProps = {
        preset: 'neon',
      }
      expect(props.preset).toBe('neon')
    })
  })

  describe('Lighting Presets', () => {
    it('should have default preset', () => {
      expect(CABINET_LIGHTING_PRESETS.default).toBeDefined()
      expect(CABINET_LIGHTING_PRESETS.default.spotlightIntensity).toBe(1.5)
    })

    it('should have dramatic preset', () => {
      expect(CABINET_LIGHTING_PRESETS.dramatic).toBeDefined()
      expect(CABINET_LIGHTING_PRESETS.dramatic.spotlightIntensity).toBeGreaterThan(
        CABINET_LIGHTING_PRESETS.default.spotlightIntensity
      )
    })

    it('should have neon preset', () => {
      expect(CABINET_LIGHTING_PRESETS.neon).toBeDefined()
      expect(CABINET_LIGHTING_PRESETS.neon.rimLightIntensity).toBeGreaterThan(
        CABINET_LIGHTING_PRESETS.default.rimLightIntensity
      )
    })

    it('should have subtle preset', () => {
      expect(CABINET_LIGHTING_PRESETS.subtle).toBeDefined()
      expect(CABINET_LIGHTING_PRESETS.subtle.spotlightIntensity).toBeLessThan(
        CABINET_LIGHTING_PRESETS.default.spotlightIntensity
      )
    })

    it('should have game-over preset', () => {
      expect(CABINET_LIGHTING_PRESETS['game-over']).toBeDefined()
      expect(CABINET_LIGHTING_PRESETS['game-over'].spotlightColor).toBe('#ff4444')
    })

    it('should have victory preset', () => {
      expect(CABINET_LIGHTING_PRESETS.victory).toBeDefined()
      expect(CABINET_LIGHTING_PRESETS.victory.rimLightLeftColor).toBe('#00ff88')
    })
  })

  describe('getCabinetLightingPreset', () => {
    it('should return correct preset', () => {
      const preset = getCabinetLightingPreset('neon')
      expect(preset).toBe(CABINET_LIGHTING_PRESETS.neon)
    })

    it('should return all presets correctly', () => {
      const presets: CabinetLightingPreset[] = [
        'default',
        'dramatic',
        'neon',
        'subtle',
        'game-over',
        'victory',
      ]

      for (const presetName of presets) {
        const preset = getCabinetLightingPreset(presetName)
        expect(preset).toBe(CABINET_LIGHTING_PRESETS[presetName])
      }
    })
  })

  describe('getOptimalLightConfig', () => {
    it('should return low performance config', () => {
      const config = getOptimalLightConfig('low')
      expect(config.enableSpotlight).toBe(true)
      expect(config.enableRimLights).toBe(false)
      expect(config.enableFloorBounce).toBe(false)
      expect(config.shadowQuality).toBe('low')
      expect(config.enablePulse).toBe(false)
    })

    it('should return medium performance config', () => {
      const config = getOptimalLightConfig('medium')
      expect(config.enableSpotlight).toBe(true)
      expect(config.enableRimLights).toBe(true)
      expect(config.enableFloorBounce).toBe(false)
      expect(config.shadowQuality).toBe('medium')
      expect(config.enablePulse).toBe(true)
    })

    it('should return high performance config', () => {
      const config = getOptimalLightConfig('high')
      expect(config.enableSpotlight).toBe(true)
      expect(config.enableRimLights).toBe(true)
      expect(config.enableFloorBounce).toBe(true)
      expect(config.shadowQuality).toBe('high')
      expect(config.enablePulse).toBe(true)
    })
  })

  describe('useCabinetLighting Hook', () => {
    it('should return ref and control methods', () => {
      const { result } = renderHook(() => useCabinetLighting())

      expect(result.current.ref).toBeDefined()
      expect(result.current.preset).toBe('default')
      expect(result.current.setPreset).toBeDefined()
      expect(result.current.flash).toBeDefined()
      expect(result.current.lightingProps).toBeDefined()
    })

    it('should initialize with custom preset', () => {
      const { result } = renderHook(() =>
        useCabinetLighting({ preset: 'neon' })
      )

      expect(result.current.preset).toBe('neon')
    })

    it('should provide lighting props for spreading', () => {
      const { result } = renderHook(() =>
        useCabinetLighting({
          shadows: true,
          shadowQuality: 'high',
        })
      )

      expect(result.current.lightingProps.castShadow).toBe(true)
      expect(result.current.lightingProps.shadowQuality).toBe('high')
    })
  })
})

// ============================================================================
// Integration Tests
// ============================================================================

describe('Cabinet Component Integration', () => {
  describe('Component Compatibility', () => {
    it('should have consistent dimension constants', () => {
      // Screen should fit within body
      expect(CABINET_SCREEN.screenWidth).toBeLessThan(CABINET_BODY.width)

      // Total screen with bezel should fit
      const screenWithBezel =
        CABINET_SCREEN.screenWidth + CABINET_SCREEN.bezelWidth * 2
      expect(screenWithBezel).toBeLessThan(CABINET_BODY.width)
    })

    it('should have valid color values', () => {
      // All colors should be valid hex strings
      expect(CABINET_COLORS.body).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(CABINET_COLORS.bezel).toMatch(/^#[0-9a-fA-F]{6}$/)
    })
  })

  describe('Hook Interactions', () => {
    it('should allow combining hover and lighting hooks', () => {
      const { result: hoverResult } = renderHook(() => useCabinetHover())
      const { result: lightingResult } = renderHook(() => useCabinetLighting())

      // Both hooks should work independently
      expect(hoverResult.current.isHovered).toBe(false)
      expect(lightingResult.current.preset).toBe('default')

      // State changes in one shouldn't affect the other
      act(() => {
        hoverResult.current.onPointerOver()
      })

      expect(hoverResult.current.isHovered).toBe(true)
      expect(lightingResult.current.preset).toBe('default')
    })
  })

  describe('Performance', () => {
    it('should handle rapid hover state changes efficiently', () => {
      const { result } = renderHook(() => useCabinetHover())
      const startTime = performance.now()

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.onPointerOver()
          result.current.onPointerOut()
        }
      })

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(100)
    })

    it('should handle preset switching efficiently', () => {
      const { result } = renderHook(() => useCabinetLighting())
      const startTime = performance.now()
      const presets: CabinetLightingPreset[] = [
        'default',
        'dramatic',
        'neon',
        'subtle',
        'game-over',
        'victory',
      ]

      act(() => {
        for (let i = 0; i < 50; i++) {
          result.current.setPreset(presets[i % presets.length])
        }
      })

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(50)
    })
  })
})
