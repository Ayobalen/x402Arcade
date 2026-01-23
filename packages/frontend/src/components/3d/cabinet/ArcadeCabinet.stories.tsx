/**
 * Arcade Cabinet 3D Component Stories
 *
 * Comprehensive Storybook stories for the arcade cabinet components
 * with interactive controls for all customization options.
 *
 * @module 3d/cabinet/ArcadeCabinet.stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei'
import React, { Suspense, useState, useRef } from 'react'

// Cabinet components
import { CabinetBody, SimpleCabinetBody } from './CabinetBody'
import { ScreenBezel } from './ScreenBezel'
import { ControlPanel } from './ControlPanel'
import { Marquee, MARQUEE_PRESETS, type MarqueeHandle } from './Marquee'
import { Joystick } from './Joystick'
import { ButtonGrid } from './ArcadeButton'
import { CabinetSelection, useSelection, SELECTION_PRESETS } from './CabinetSelection'
import { CabinetIdleSway, SWAY_PRESETS } from './CabinetIdleSway'
import { CabinetHoverGlow } from './CabinetHoverGlow'
import {
  CABINET_COLORS,
  CABINET_EMISSIVE,
  CABINET_BODY,
  getOptimalCameraPosition,
} from './ArcadeCabinetGeometry'

// ============================================================================
// Canvas Decorator
// ============================================================================

/**
 * R3F Canvas decorator for 3D stories
 * Sets up proper lighting, camera, and controls for viewing cabinet
 */
const withR3FCanvas = (Story: React.ComponentType) => {
  const cameraPosition = getOptimalCameraPosition()

  return (
    <div style={{ width: '100%', height: '600px', background: '#0a0a0f' }}>
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={cameraPosition} fov={50} />
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          maxPolarAngle={Math.PI / 1.5}
          minDistance={3}
          maxDistance={20}
          target={[0, CABINET_BODY.totalHeight / 2, 0]}
        />

        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[0, CABINET_BODY.totalHeight + 1, 2]} intensity={0.5} color="#8B5CF6" />

        {/* Environment for reflections */}
        <Suspense fallback={null}>
          <Environment preset="night" />
        </Suspense>

        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#0f0f1a" roughness={0.8} />
        </mesh>

        {/* Story content */}
        <Suspense fallback={null}>
          <Story />
        </Suspense>
      </Canvas>
    </div>
  )
}

// ============================================================================
// Full Cabinet Composition
// ============================================================================

interface FullCabinetProps {
  bodyColor: string
  panelColor: string
  bezelColor: string
  glowColor: string
  glowIntensity: number
  marqueeTitle: string
  marqueeGlow: boolean
  enableSelection: boolean
  enableIdleSway: boolean
  enableHoverGlow: boolean
  showControls: boolean
}

/**
 * Full assembled arcade cabinet with all components
 */
function FullCabinet({
  bodyColor,
  panelColor,
  bezelColor,
  glowColor,
  glowIntensity,
  marqueeTitle,
  marqueeGlow,
  enableSelection,
  enableIdleSway,
  enableHoverGlow,
  showControls,
}: FullCabinetProps) {
  const selection = useSelection()

  const content = (
    <group>
      {/* Cabinet Body */}
      <CabinetBody
        bodyColor={bodyColor}
        panelColor={panelColor}
        castShadow
        receiveShadow
      >
        {/* Screen Bezel */}
        <ScreenBezel
          bezelColor={bezelColor}
          enableGlow
          glowColor={glowColor}
          glowIntensity={glowIntensity}
        />

        {/* Control Panel */}
        {showControls && (
          <ControlPanel>
            <Joystick />
            <ButtonGrid />
          </ControlPanel>
        )}
      </CabinetBody>

      {/* Marquee */}
      <Marquee
        title={marqueeTitle}
        emissiveColor={glowColor}
        emissiveIntensity={glowIntensity}
        enableGlow={marqueeGlow}
      />
    </group>
  )

  // Apply optional wrappers based on props
  let wrappedContent = content

  if (enableIdleSway) {
    wrappedContent = (
      <CabinetIdleSway config={SWAY_PRESETS.subtle}>
        {wrappedContent}
      </CabinetIdleSway>
    )
  }

  if (enableHoverGlow) {
    wrappedContent = (
      <CabinetHoverGlow>
        {wrappedContent}
      </CabinetHoverGlow>
    )
  }

  if (enableSelection) {
    wrappedContent = (
      <CabinetSelection
        ref={selection.ref}
        {...selection.selectionProps}
        config={SELECTION_PRESETS.default}
      >
        {wrappedContent}
      </CabinetSelection>
    )
  }

  return wrappedContent
}

// ============================================================================
// Meta Configuration
// ============================================================================

/**
 * The Arcade Cabinet is the central 3D element in x402Arcade.
 * It displays games with authentic retro styling, complete with
 * glowing marquee, screen bezel, and interactive controls.
 */
const meta: Meta<typeof FullCabinet> = {
  title: '3D/ArcadeCabinet',
  component: FullCabinet,
  tags: ['autodocs'],
  decorators: [withR3FCanvas],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
A fully-featured 3D arcade cabinet component built with React Three Fiber.

## Features
- Realistic cabinet body with beveled edges
- Illuminated marquee sign with customizable title
- Screen bezel with glow effects
- Interactive control panel with joystick and buttons
- Selection animation (click to select)
- Idle sway animation
- Hover glow effects
- Optimized for performance with LOD support

## Usage
\`\`\`tsx
import { CabinetBody, ScreenBezel, Marquee, ControlPanel } from '@/components/3d/cabinet'

<Canvas>
  <CabinetBody>
    <ScreenBezel />
    <ControlPanel />
  </CabinetBody>
  <Marquee title="PAC-MAN" />
</Canvas>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    bodyColor: {
      control: 'color',
      description: 'Main cabinet body color',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: CABINET_COLORS.body },
        category: 'Colors',
      },
    },
    panelColor: {
      control: 'color',
      description: 'Side panel color',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: CABINET_COLORS.body },
        category: 'Colors',
      },
    },
    bezelColor: {
      control: 'color',
      description: 'Screen bezel color',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: CABINET_COLORS.bezel },
        category: 'Colors',
      },
    },
    glowColor: {
      control: 'color',
      description: 'Glow/emissive color for screen and marquee',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: CABINET_EMISSIVE.screen },
        category: 'Lighting',
      },
    },
    glowIntensity: {
      control: { type: 'range', min: 0, max: 1, step: 0.1 },
      description: 'Intensity of glow effects',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '0.5' },
        category: 'Lighting',
      },
    },
    marqueeTitle: {
      control: 'text',
      description: 'Title displayed on the marquee',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'ARCADE' },
        category: 'Content',
      },
    },
    marqueeGlow: {
      control: 'boolean',
      description: 'Enable marquee backlight glow',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
        category: 'Lighting',
      },
    },
    enableSelection: {
      control: 'boolean',
      description: 'Enable click-to-select interaction',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
        category: 'Interactions',
      },
    },
    enableIdleSway: {
      control: 'boolean',
      description: 'Enable subtle idle animation',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Animations',
      },
    },
    enableHoverGlow: {
      control: 'boolean',
      description: 'Enable glow effect on hover',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
        category: 'Interactions',
      },
    },
    showControls: {
      control: 'boolean',
      description: 'Show joystick and buttons on control panel',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
        category: 'Content',
      },
    },
  },
  args: {
    bodyColor: CABINET_COLORS.body,
    panelColor: CABINET_COLORS.body,
    bezelColor: CABINET_COLORS.bezel,
    glowColor: CABINET_EMISSIVE.screen,
    glowIntensity: 0.5,
    marqueeTitle: 'ARCADE',
    marqueeGlow: true,
    enableSelection: true,
    enableIdleSway: false,
    enableHoverGlow: true,
    showControls: true,
  },
}

export default meta
type Story = StoryObj<typeof FullCabinet>

// ============================================================================
// Stories
// ============================================================================

/**
 * The default arcade cabinet with all features enabled.
 * Click to select, hover for glow effects.
 */
export const Default: Story = {}

/**
 * Classic purple neon themed cabinet.
 */
export const PurpleNeon: Story = {
  args: {
    glowColor: '#8B5CF6',
    glowIntensity: 0.7,
    marqueeTitle: 'NEON',
  },
}

/**
 * Retro green CRT styled cabinet.
 */
export const RetroCRT: Story = {
  args: {
    glowColor: '#00ff00',
    glowIntensity: 0.4,
    marqueeTitle: 'RETRO',
    bodyColor: '#0a0a0a',
  },
}

/**
 * Cyan arcade theme with high glow.
 */
export const CyanArcade: Story = {
  args: {
    glowColor: '#00ffff',
    glowIntensity: 0.8,
    marqueeTitle: 'CYBER',
  },
}

/**
 * Warm amber vintage style.
 */
export const VintageAmber: Story = {
  args: {
    glowColor: '#ffaa00',
    glowIntensity: 0.5,
    marqueeTitle: 'CLASSIC',
    bodyColor: '#1a1510',
  },
}

/**
 * Pink/magenta neon theme.
 */
export const PinkNeon: Story = {
  args: {
    glowColor: '#ff00ff',
    glowIntensity: 0.6,
    marqueeTitle: 'SYNTHWAVE',
  },
}

/**
 * Idle animation showcase.
 * Cabinet gently sways while idle.
 */
export const WithIdleSway: Story = {
  args: {
    enableIdleSway: true,
    marqueeTitle: 'IDLE SWAY',
  },
}

/**
 * Minimal cabinet without control panel.
 */
export const MinimalCabinet: Story = {
  args: {
    showControls: false,
    marqueeTitle: 'DISPLAY',
    enableSelection: false,
    enableHoverGlow: false,
  },
}

// ============================================================================
// Component-Specific Stories
// ============================================================================

/**
 * Cabinet body component showcase
 */
export const BodyOnly: Story = {
  render: () => (
    <CabinetBody
      bodyColor={CABINET_COLORS.body}
      castShadow
      receiveShadow
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'The cabinet body without any additional components.',
      },
    },
  },
}

/**
 * Simple cabinet body for performance comparison
 */
export const SimplifiedBody: Story = {
  render: () => (
    <SimpleCabinetBody
      color={CABINET_COLORS.body}
      castShadow
      receiveShadow
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'A simplified single-mesh cabinet body for better performance when rendering many cabinets.',
      },
    },
  },
}

/**
 * Screen bezel with glow effects
 */
export const ScreenBezelShowcase: Story = {
  render: () => (
    <group position={[0, 0, 0]}>
      <ScreenBezel
        bezelColor={CABINET_COLORS.bezel}
        enableGlow
        glowColor="#00ffff"
        glowIntensity={0.6}
      />
    </group>
  ),
  parameters: {
    docs: {
      description: {
        story: 'The screen bezel component with glowing edge highlights.',
      },
    },
  },
}

/**
 * Marquee component variants
 */
export const MarqueeShowcase: Story = {
  render: function MarqueeDemo() {
    const [preset, _setPreset] = useState<keyof typeof MARQUEE_PRESETS>('classic')
    const marqueeRef = useRef<MarqueeHandle>(null)

    const config = MARQUEE_PRESETS[preset]

    return (
      <group>
        <Marquee
          ref={marqueeRef}
          title="ARCADE"
          position={[0, 2, 0]}
          emissiveColor={config.emissiveColor}
          emissiveIntensity={config.emissiveIntensity}
          enableGlow={config.enableGlow}
          enableFlicker={config.enableFlicker}
        />

        {/* UI for preset selection would go in the Storybook controls */}
      </group>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'The illuminated marquee sign with various preset styles.',
      },
    },
  },
}

/**
 * Selection animation demonstration
 */
export const SelectionDemo: Story = {
  render: function SelectionDemo() {
    const [selected, setSelected] = useState(false)

    return (
      <CabinetSelection
        selected={selected}
        onSelect={() => setSelected(true)}
        onDeselect={() => setSelected(false)}
        config={SELECTION_PRESETS.dramatic}
      >
        <CabinetBody>
          <ScreenBezel enableGlow glowColor="#00ffff" glowIntensity={selected ? 0.8 : 0.4} />
        </CabinetBody>
        <Marquee title={selected ? 'SELECTED!' : 'CLICK ME'} />
      </CabinetSelection>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Click the cabinet to see the selection animation with forward movement and scale increase.',
      },
    },
  },
}

/**
 * Multiple cabinets in a row
 */
export const ArcadeRow: Story = {
  render: () => (
    <group>
      {[-4, 0, 4].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <CabinetSelection>
            <CabinetIdleSway config={SWAY_PRESETS.subtle}>
              <CabinetBody>
                <ScreenBezel enableGlow glowColor={['#ff0000', '#00ff00', '#0000ff'][i]} glowIntensity={0.5} />
              </CabinetBody>
              <Marquee title={['SNAKE', 'TETRIS', 'PONG'][i]} />
            </CabinetIdleSway>
          </CabinetSelection>
        </group>
      ))}
    </group>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple arcade cabinets arranged in a row, each with unique colors and titles.',
      },
    },
  },
}

/**
 * Control panel with interactive joystick and buttons
 */
export const ControlPanelShowcase: Story = {
  render: () => (
    <group position={[0, 0, 2]}>
      <ControlPanel>
        <Joystick />
        <ButtonGrid />
      </ControlPanel>
    </group>
  ),
  parameters: {
    docs: {
      description: {
        story: 'The control panel with joystick and arcade buttons.',
      },
    },
  },
}
