/**
 * CabinetSelection - Selection/focus animation for arcade cabinet
 *
 * Adds click interaction and focus animation to the cabinet, moving it
 * forward and scaling up when selected. Uses spring physics for natural
 * feeling animations.
 *
 * @module 3d/cabinet/CabinetSelection
 */

import { useRef, forwardRef, useImperativeHandle, useCallback, useState } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'

// ============================================================================
// Types
// ============================================================================

export interface SelectionAnimationConfig {
  /** Forward movement distance on Z-axis when selected (default: 0.3) */
  forwardDistance?: number
  /** Scale multiplier when selected (default: 1.05) */
  selectedScale?: number
  /** Spring stiffness for animation (default: 180) */
  springStiffness?: number
  /** Spring damping for animation (default: 20) */
  springDamping?: number
  /** Screen brightness multiplier when selected (default: 1.3) */
  brightnessMultiplier?: number
  /** Enable click to select (default: true) */
  clickToSelect?: boolean
  /** Enable click outside to deselect (default: true) */
  clickOutsideToDeselect?: boolean
}

export interface CabinetSelectionProps {
  /** Position of the cabinet [x, y, z] */
  position?: [number, number, number]
  /** Base rotation in radians [x, y, z] */
  rotation?: [number, number, number]
  /** Base scale multiplier */
  scale?: number
  /** Whether the cabinet is currently selected */
  selected?: boolean
  /** Animation configuration */
  config?: SelectionAnimationConfig
  /** Enable/disable selection interaction */
  enabled?: boolean
  /** Called when cabinet is clicked/selected */
  onSelect?: () => void
  /** Called when cabinet is deselected */
  onDeselect?: () => void
  /** Called when selection state changes */
  onSelectionChange?: (selected: boolean) => void
  /** Called when selection animation completes */
  onAnimationComplete?: (selected: boolean) => void
  /** Called when sound effect should play */
  onSoundTrigger?: (soundType: 'select' | 'deselect' | 'hover') => void
  /** Children to render (the cabinet components) */
  children?: React.ReactNode
}

export interface SelectionState {
  /** Whether cabinet is currently selected */
  selected: boolean
  /** Current Z position offset */
  zOffset: number
  /** Current scale factor */
  scale: number
  /** Current brightness multiplier */
  brightness: number
  /** Whether animation is in progress */
  animating: boolean
}

export interface CabinetSelectionHandle {
  /** Reference to the root group */
  group: THREE.Group | null
  /** Select the cabinet */
  select: () => void
  /** Deselect the cabinet */
  deselect: () => void
  /** Toggle selection state */
  toggle: () => void
  /** Check if selected */
  isSelected: () => boolean
  /** Get current selection state */
  getState: () => SelectionState
  /** Set brightness multiplier directly */
  setBrightness: (brightness: number) => void
  /** Force animation to complete instantly */
  snapToTarget: () => void
}

// ============================================================================
// Constants
// ============================================================================

/** Default animation configuration */
const DEFAULT_CONFIG: Required<SelectionAnimationConfig> = {
  forwardDistance: 0.3, // Move forward 0.3 units when selected
  selectedScale: 1.05, // 5% scale increase
  springStiffness: 180, // Snappy spring
  springDamping: 20, // Moderate damping
  brightnessMultiplier: 1.3, // 30% brighter
  clickToSelect: true,
  clickOutsideToDeselect: true,
}

// Animation threshold for considering animation "complete"
const ANIMATION_THRESHOLD = 0.001

// ============================================================================
// Spring Physics Helper
// ============================================================================

interface SpringState {
  position: number
  velocity: number
}

/**
 * Simple spring physics simulation
 * Returns new position and velocity
 */
function springStep(
  current: SpringState,
  target: number,
  stiffness: number,
  damping: number,
  deltaTime: number
): SpringState {
  // Spring force: F = -k * x (Hooke's law)
  const displacement = current.position - target
  const springForce = -stiffness * displacement

  // Damping force: F = -c * v
  const dampingForce = -damping * current.velocity

  // Total acceleration (assuming mass = 1)
  const acceleration = springForce + dampingForce

  // Integrate velocity and position
  const newVelocity = current.velocity + acceleration * deltaTime
  const newPosition = current.position + newVelocity * deltaTime

  return {
    position: newPosition,
    velocity: newVelocity,
  }
}

/**
 * Check if spring animation is effectively complete
 */
function isSpringAtRest(
  current: SpringState,
  target: number,
  threshold: number = ANIMATION_THRESHOLD
): boolean {
  return (
    Math.abs(current.position - target) < threshold &&
    Math.abs(current.velocity) < threshold
  )
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * CabinetSelection - Wrapper component that adds selection/focus animation
 *
 * Wrap your cabinet components with this to add click-to-select behavior
 * with smooth spring-based animations.
 *
 * @example
 * ```tsx
 * // Basic usage with controlled selection
 * <CabinetSelection
 *   selected={isSelected}
 *   onSelect={() => setSelected(true)}
 *   onDeselect={() => setSelected(false)}
 * >
 *   <CabinetBody>
 *     <ScreenBezel />
 *     <ControlPanel />
 *   </CabinetBody>
 * </CabinetSelection>
 *
 * // With sound effects
 * <CabinetSelection
 *   onSoundTrigger={(type) => audioSystem.play(type)}
 *   onAnimationComplete={(selected) => {
 *     if (selected) loadGame()
 *   }}
 * >
 *   <CabinetBody />
 * </CabinetSelection>
 *
 * // Via ref for programmatic control
 * const selectionRef = useRef<CabinetSelectionHandle>(null)
 * selectionRef.current?.select() // Programmatically select
 * ```
 */
export const CabinetSelection = forwardRef<CabinetSelectionHandle, CabinetSelectionProps>(
  function CabinetSelection(
    {
      position = [0, 0, 0],
      rotation = [0, 0, 0],
      scale = 1,
      selected: controlledSelected,
      config = DEFAULT_CONFIG,
      enabled = true,
      onSelect,
      onDeselect,
      onSelectionChange,
      onAnimationComplete,
      onSoundTrigger,
      children,
    },
    ref
  ) {
    const groupRef = useRef<THREE.Group>(null)

    // Internal selection state (uncontrolled mode)
    const [internalSelected, setInternalSelected] = useState(false)

    // Use controlled or uncontrolled selection state
    const isControlled = controlledSelected !== undefined
    const isSelected = isControlled ? controlledSelected : internalSelected

    // Spring animation state
    const zSpring = useRef<SpringState>({ position: 0, velocity: 0 })
    const scaleSpring = useRef<SpringState>({ position: 1, velocity: 0 })
    const brightnessSpring = useRef<SpringState>({ position: 1, velocity: 0 })

    // Animation state tracking
    const wasAnimating = useRef(false)
    const currentBrightness = useRef(1)

    // Merge config with defaults
    const resolvedConfig: Required<SelectionAnimationConfig> = {
      ...DEFAULT_CONFIG,
      ...config,
    }

    // Calculate target values based on selection state
    const targetZ = isSelected ? resolvedConfig.forwardDistance : 0
    const targetScale = isSelected ? resolvedConfig.selectedScale : 1
    const targetBrightness = isSelected ? resolvedConfig.brightnessMultiplier : 1

    // Selection handlers
    const handleSelect = useCallback(() => {
      if (!isControlled) {
        setInternalSelected(true)
      }
      onSelect?.()
      onSelectionChange?.(true)
      onSoundTrigger?.('select')
    }, [isControlled, onSelect, onSelectionChange, onSoundTrigger])

    const handleDeselect = useCallback(() => {
      if (!isControlled) {
        setInternalSelected(false)
      }
      onDeselect?.()
      onSelectionChange?.(false)
      onSoundTrigger?.('deselect')
    }, [isControlled, onDeselect, onSelectionChange, onSoundTrigger])

    // Click handler
    const handleClick = useCallback(
      (event: ThreeEvent<MouseEvent>) => {
        if (!enabled) return

        // Stop propagation to prevent parent click handlers
        event.stopPropagation()

        if (resolvedConfig.clickToSelect) {
          if (isSelected) {
            // Clicking selected cabinet deselects if enabled
            if (resolvedConfig.clickOutsideToDeselect) {
              handleDeselect()
            }
          } else {
            handleSelect()
          }
        }
      },
      [enabled, resolvedConfig.clickToSelect, resolvedConfig.clickOutsideToDeselect, isSelected, handleSelect, handleDeselect]
    )

    // Hover handler for sound effect
    const handlePointerEnter = useCallback(() => {
      if (enabled && !isSelected) {
        onSoundTrigger?.('hover')
      }
    }, [enabled, isSelected, onSoundTrigger])

    // Expose imperative handle
    useImperativeHandle(
      ref,
      () => ({
        group: groupRef.current,
        select: handleSelect,
        deselect: handleDeselect,
        toggle: () => {
          if (isSelected) {
            handleDeselect()
          } else {
            handleSelect()
          }
        },
        isSelected: () => isSelected,
        getState: () => ({
          selected: isSelected,
          zOffset: zSpring.current.position,
          scale: scaleSpring.current.position,
          brightness: brightnessSpring.current.position,
          animating: wasAnimating.current,
        }),
        setBrightness: (brightness: number) => {
          currentBrightness.current = brightness
          brightnessSpring.current = {
            position: brightness,
            velocity: 0,
          }
        },
        snapToTarget: () => {
          zSpring.current = { position: targetZ, velocity: 0 }
          scaleSpring.current = { position: targetScale, velocity: 0 }
          brightnessSpring.current = { position: targetBrightness, velocity: 0 }
        },
      }),
      [isSelected, handleSelect, handleDeselect, targetZ, targetScale, targetBrightness]
    )

    // Main animation frame
    useFrame((_state, delta) => {
      if (!groupRef.current) return

      const { springStiffness, springDamping } = resolvedConfig

      // Clamp delta to prevent huge jumps on tab switch
      const clampedDelta = Math.min(delta, 0.1)

      // Update Z position spring
      zSpring.current = springStep(
        zSpring.current,
        targetZ,
        springStiffness,
        springDamping,
        clampedDelta
      )

      // Update scale spring
      scaleSpring.current = springStep(
        scaleSpring.current,
        targetScale,
        springStiffness,
        springDamping,
        clampedDelta
      )

      // Update brightness spring
      brightnessSpring.current = springStep(
        brightnessSpring.current,
        targetBrightness,
        springStiffness * 0.8, // Slightly softer for brightness
        springDamping * 0.8,
        clampedDelta
      )

      // Apply transformations
      groupRef.current.position.set(
        position[0],
        position[1],
        position[2] + zSpring.current.position
      )

      groupRef.current.scale.setScalar(scale * scaleSpring.current.position)

      // Store current brightness for external access
      currentBrightness.current = brightnessSpring.current.position

      // Check if animation is complete
      const isAnimationComplete =
        isSpringAtRest(zSpring.current, targetZ) &&
        isSpringAtRest(scaleSpring.current, targetScale) &&
        isSpringAtRest(brightnessSpring.current, targetBrightness)

      // Fire animation complete callback once
      if (wasAnimating.current && isAnimationComplete) {
        wasAnimating.current = false
        onAnimationComplete?.(isSelected)
      } else if (!isAnimationComplete) {
        wasAnimating.current = true
      }
    })

    return (
      <group
        ref={groupRef}
        name="CabinetSelection"
        position={position}
        rotation={rotation}
        scale={scale}
        onClick={handleClick}
        onPointerEnter={handlePointerEnter}
      >
        {children}
      </group>
    )
  }
)

// ============================================================================
// Hook for Selection Control
// ============================================================================

export interface UseSelectionOptions {
  /** Initial selection state */
  initialSelected?: boolean
  /** Animation configuration */
  config?: SelectionAnimationConfig
  /** Callback when selected */
  onSelect?: () => void
  /** Callback when deselected */
  onDeselect?: () => void
}

export interface UseSelectionResult {
  /** Ref to attach to CabinetSelection */
  ref: React.RefObject<CabinetSelectionHandle>
  /** Current selection state */
  selected: boolean
  /** Select the cabinet */
  select: () => void
  /** Deselect the cabinet */
  deselect: () => void
  /** Toggle selection */
  toggle: () => void
  /** Selection props to spread onto CabinetSelection */
  selectionProps: {
    selected: boolean
    onSelect: () => void
    onDeselect: () => void
  }
}

/**
 * useSelection - Hook for controlling cabinet selection state
 *
 * @example
 * ```tsx
 * function ArcadeCabinet() {
 *   const selection = useSelection({
 *     onSelect: () => console.log('Cabinet selected!'),
 *   })
 *
 *   return (
 *     <CabinetSelection ref={selection.ref} {...selection.selectionProps}>
 *       <CabinetBody />
 *     </CabinetSelection>
 *   )
 * }
 * ```
 */
export function useSelection(options: UseSelectionOptions = {}): UseSelectionResult {
  const {
    initialSelected = false,
    onSelect,
    onDeselect,
  } = options

  const ref = useRef<CabinetSelectionHandle>(null)
  const [selected, setSelected] = useState(initialSelected)

  const select = useCallback(() => {
    setSelected(true)
    onSelect?.()
  }, [onSelect])

  const deselect = useCallback(() => {
    setSelected(false)
    onDeselect?.()
  }, [onDeselect])

  const toggle = useCallback(() => {
    setSelected((prev) => {
      const newValue = !prev
      if (newValue) {
        onSelect?.()
      } else {
        onDeselect?.()
      }
      return newValue
    })
  }, [onSelect, onDeselect])

  return {
    ref,
    selected,
    select,
    deselect,
    toggle,
    selectionProps: {
      selected,
      onSelect: select,
      onDeselect: deselect,
    },
  }
}

// ============================================================================
// Multi-Cabinet Selection Manager Hook
// ============================================================================

export interface UseMultiSelectionOptions {
  /** Maximum number of simultaneously selected cabinets (default: 1) */
  maxSelected?: number
  /** Callback when selection changes */
  onSelectionChange?: (selectedIds: string[]) => void
}

export interface UseMultiSelectionResult {
  /** Currently selected cabinet IDs */
  selectedIds: string[]
  /** Check if a cabinet is selected */
  isSelected: (id: string) => boolean
  /** Select a cabinet by ID */
  select: (id: string) => void
  /** Deselect a cabinet by ID */
  deselect: (id: string) => void
  /** Toggle a cabinet's selection */
  toggle: (id: string) => void
  /** Clear all selections */
  clearAll: () => void
  /** Get props for a specific cabinet */
  getCabinetProps: (id: string) => {
    selected: boolean
    onSelect: () => void
    onDeselect: () => void
  }
}

/**
 * useMultiSelection - Hook for managing selection across multiple cabinets
 *
 * @example
 * ```tsx
 * function ArcadeRoom() {
 *   const selection = useMultiSelection({ maxSelected: 1 })
 *
 *   return (
 *     <>
 *       <CabinetSelection {...selection.getCabinetProps('pacman')}>
 *         <PacmanCabinet />
 *       </CabinetSelection>
 *       <CabinetSelection {...selection.getCabinetProps('tetris')}>
 *         <TetrisCabinet />
 *       </CabinetSelection>
 *     </>
 *   )
 * }
 * ```
 */
export function useMultiSelection(
  options: UseMultiSelectionOptions = {}
): UseMultiSelectionResult {
  const { maxSelected = 1, onSelectionChange } = options
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const isSelected = useCallback(
    (id: string) => selectedIds.includes(id),
    [selectedIds]
  )

  const select = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        if (prev.includes(id)) return prev

        let newSelection: string[]
        if (maxSelected === 1) {
          // Single selection mode - replace
          newSelection = [id]
        } else if (prev.length >= maxSelected) {
          // Multi-selection at limit - remove oldest
          newSelection = [...prev.slice(1), id]
        } else {
          // Add to selection
          newSelection = [...prev, id]
        }

        onSelectionChange?.(newSelection)
        return newSelection
      })
    },
    [maxSelected, onSelectionChange]
  )

  const deselect = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        if (!prev.includes(id)) return prev
        const newSelection = prev.filter((x) => x !== id)
        onSelectionChange?.(newSelection)
        return newSelection
      })
    },
    [onSelectionChange]
  )

  const toggle = useCallback(
    (id: string) => {
      if (selectedIds.includes(id)) {
        deselect(id)
      } else {
        select(id)
      }
    },
    [selectedIds, select, deselect]
  )

  const clearAll = useCallback(() => {
    setSelectedIds([])
    onSelectionChange?.([])
  }, [onSelectionChange])

  const getCabinetProps = useCallback(
    (id: string) => ({
      selected: selectedIds.includes(id),
      onSelect: () => select(id),
      onDeselect: () => deselect(id),
    }),
    [selectedIds, select, deselect]
  )

  return {
    selectedIds,
    isSelected,
    select,
    deselect,
    toggle,
    clearAll,
    getCabinetProps,
  }
}

// ============================================================================
// Preset Configurations
// ============================================================================

export const SELECTION_PRESETS = {
  /** Default smooth selection */
  default: DEFAULT_CONFIG,

  /** Quick, snappy selection */
  snappy: {
    forwardDistance: 0.25,
    selectedScale: 1.03,
    springStiffness: 300,
    springDamping: 25,
    brightnessMultiplier: 1.2,
    clickToSelect: true,
    clickOutsideToDeselect: true,
  } as Required<SelectionAnimationConfig>,

  /** Slow, dramatic selection */
  dramatic: {
    forwardDistance: 0.5,
    selectedScale: 1.1,
    springStiffness: 100,
    springDamping: 15,
    brightnessMultiplier: 1.5,
    clickToSelect: true,
    clickOutsideToDeselect: true,
  } as Required<SelectionAnimationConfig>,

  /** Subtle, understated selection */
  subtle: {
    forwardDistance: 0.15,
    selectedScale: 1.02,
    springStiffness: 200,
    springDamping: 25,
    brightnessMultiplier: 1.15,
    clickToSelect: true,
    clickOutsideToDeselect: true,
  } as Required<SelectionAnimationConfig>,

  /** No animation (instant) */
  instant: {
    forwardDistance: 0.3,
    selectedScale: 1.05,
    springStiffness: 1000,
    springDamping: 100,
    brightnessMultiplier: 1.3,
    clickToSelect: true,
    clickOutsideToDeselect: true,
  } as Required<SelectionAnimationConfig>,
} as const

export type SelectionPreset = keyof typeof SELECTION_PRESETS

// ============================================================================
// Exports
// ============================================================================

export default CabinetSelection
