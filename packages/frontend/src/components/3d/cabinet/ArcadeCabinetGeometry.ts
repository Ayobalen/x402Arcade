/**
 * Arcade Cabinet Geometry Design Document
 *
 * This file defines the 3D geometry specifications for the arcade cabinet model.
 * All measurements are in Three.js units (approximately 1 unit = 0.3 meters for realistic scale).
 *
 * @module 3d/cabinet/ArcadeCabinetGeometry
 *
 * ============================================================================
 * ARCADE CABINET SKETCH (Front View)
 * ============================================================================
 *
 *                    +-------------------+
 *                   /                     \
 *                  /       MARQUEE         \
 *                 /    (title/branding)     \
 *                +---------------------------+
 *                |                           |
 *                |      SCREEN BEZEL         |
 *                |    +-----------------+    |
 *                |    |                 |    |
 *                |    |                 |    |
 *                |    |     SCREEN      |    |
 *                |    |                 |    |
 *                |    |                 |    |
 *                |    +-----------------+    |
 *                |                           |
 *                +---------------------------+
 *               /                             \
 *              /      CONTROL PANEL            \
 *             /  (joystick & buttons area)      \
 *            +-----------------------------------+
 *            |                                   |
 *            |            BODY/BASE              |
 *            |                                   |
 *            +-----------------------------------+
 *            |  |                             |  |
 *            |  |     SPEAKER GRILLE          |  |
 *            +--+-----------------------------+--+
 *
 * ============================================================================
 * ARCADE CABINET SKETCH (Side View)
 * ============================================================================
 *
 *                  +----+
 *                 /     |  <- Marquee (angled)
 *                /      |
 *               +-------+
 *              /         |   <- Screen bezel (angled ~15°)
 *             /          |
 *            /           |
 *           +------------+
 *           |            |   <- Control panel (angled ~20°)
 *           |            |
 *           |            |
 *           |   BODY     |   <- Main body (vertical)
 *           |            |
 *           |            |
 *           +------------+
 *           |  SPEAKER   |   <- Speaker section (recessed)
 *           +------------+
 */

// ============================================================================
// DIMENSION CONSTANTS
// ============================================================================

/**
 * Main Body Dimensions
 *
 * The body is the vertical rectangular section that houses all components.
 * Scale is designed for a realistic arcade cabinet appearance in 3D space.
 */
export const CABINET_BODY = {
  /** Total width of the cabinet (2.4 units ≈ 72cm) */
  width: 2.4,
  /** Total height of the cabinet from floor to top of marquee (5.6 units ≈ 168cm) */
  totalHeight: 5.6,
  /** Depth of the cabinet body (1.8 units ≈ 54cm) */
  depth: 1.8,
  /** Height of the main body section below control panel (2.4 units) */
  bodyHeight: 2.4,
  /** Thickness of cabinet walls (0.08 units ≈ 2.4cm) */
  wallThickness: 0.08,
  /** Corner radius for rounded edges (0.04 units) */
  cornerRadius: 0.04,
} as const;

/**
 * Screen and Bezel Dimensions
 *
 * The screen sits at an angle (reclined back) for comfortable viewing.
 * Classic arcade cabinets typically use a 4:3 or 3:4 aspect ratio.
 */
export const CABINET_SCREEN = {
  /** Width of the screen display area (1.6 units) */
  screenWidth: 1.6,
  /** Height of the screen display area (1.2 units, 4:3 landscape) */
  screenHeight: 1.2,
  /** Bezel frame width around screen (0.12 units) */
  bezelWidth: 0.12,
  /** Depth of the screen recess (0.1 units) */
  screenRecess: 0.1,
  /** Angle of screen recline from vertical (15 degrees) */
  screenAngle: 15,
  /** Height of screen center from floor (3.6 units ≈ 108cm - eye level when standing) */
  screenCenterHeight: 3.6,
  /** Glass thickness for CRT effect (0.05 units) */
  glassThickness: 0.05,
} as const;

/**
 * Control Panel Dimensions
 *
 * The control panel sits at an ergonomic angle for comfortable gameplay.
 * Houses joystick, buttons, and coin slot.
 */
export const CABINET_CONTROLS = {
  /** Width of control panel (2.2 units - slightly less than body) */
  width: 2.2,
  /** Depth of control panel from front edge to screen (0.6 units) */
  depth: 0.6,
  /** Angle of control panel from horizontal (20 degrees) */
  angle: 20,
  /** Height of control panel front edge from floor (2.0 units ≈ 60cm - waist height) */
  height: 2.0,
  /** Thickness of control panel surface (0.06 units) */
  thickness: 0.06,
  /** Joystick hole radius (0.04 units) */
  joystickRadius: 0.04,
  /** Button hole radius (0.03 units) */
  buttonRadius: 0.03,
  /** Number of action buttons per player */
  buttonCount: 6,
} as const;

/**
 * Marquee Dimensions
 *
 * The marquee is the illuminated sign at the top showing the game title.
 * Slightly wider than the body with an angled top for visibility.
 */
export const CABINET_MARQUEE = {
  /** Width of marquee panel (2.6 units - extends past body) */
  width: 2.6,
  /** Height of marquee display area (0.6 units) */
  height: 0.6,
  /** Depth of marquee housing (0.3 units) */
  depth: 0.3,
  /** Angle of marquee from vertical (30 degrees - tilted forward) */
  angle: 30,
  /** Height of marquee bottom from floor (5.0 units) */
  bottomHeight: 5.0,
  /** Frame thickness around marquee panel (0.04 units) */
  frameThickness: 0.04,
} as const;

/**
 * Speaker Section Dimensions
 *
 * The speaker grille sits at the bottom of the cabinet body.
 */
export const CABINET_SPEAKER = {
  /** Width of speaker grille area (1.4 units) */
  width: 1.4,
  /** Height of speaker section (0.4 units) */
  height: 0.4,
  /** Recess depth of speaker grille (0.03 units) */
  recessDepth: 0.03,
  /** Height of speaker section bottom from floor (0.15 units) */
  bottomHeight: 0.15,
  /** Number of horizontal slats in grille */
  slats: 8,
} as const;

/**
 * Side Art Panel Dimensions
 *
 * Side panels for artwork/decals on the cabinet sides.
 */
export const CABINET_SIDE_ART = {
  /** Width of side art panel (height on the side, 3.2 units) */
  height: 3.2,
  /** Start position from bottom (1.8 units) */
  bottomOffset: 1.8,
  /** Depth of side art (same as body depth minus some margin) */
  depth: 1.6,
  /** Inset from cabinet edge (0.02 units) */
  inset: 0.02,
} as const;

/**
 * T-Molding/Edge Trim Dimensions
 *
 * The decorative trim along cabinet edges (classic arcade detail).
 */
export const CABINET_TRIM = {
  /** Width of T-molding strip (0.02 units) */
  width: 0.02,
  /** Height of T-molding profile (0.015 units) */
  height: 0.015,
} as const;

/**
 * Coin Door Dimensions
 *
 * The coin mechanism door on the front lower section.
 */
export const CABINET_COIN_DOOR = {
  /** Width of coin door panel (0.5 units) */
  width: 0.5,
  /** Height of coin door panel (0.35 units) */
  height: 0.35,
  /** Depth of coin door recess (0.02 units) */
  recessDepth: 0.02,
  /** Height of coin door center from floor (1.2 units) */
  centerHeight: 1.2,
  /** Coin slot width (0.08 units) */
  coinSlotWidth: 0.08,
  /** Coin slot height (0.02 units) */
  coinSlotHeight: 0.02,
} as const;

// ============================================================================
// MESH HIERARCHY
// ============================================================================

/**
 * Mesh Hierarchy for Arcade Cabinet
 *
 * The cabinet is organized into logical groups for easy manipulation:
 *
 * ArcadeCabinet (root group)
 * ├── Body (main cabinet body)
 * │   ├── MainBody (vertical box)
 * │   ├── BackPanel
 * │   ├── LeftSide
 * │   ├── RightSide
 * │   └── BottomPanel
 * │
 * ├── ScreenSection (screen and bezel)
 * │   ├── ScreenBezel (frame around screen)
 * │   ├── ScreenGlass (curved CRT glass)
 * │   ├── ScreenDisplay (actual game texture target)
 * │   └── ScreenReflection (reflection plane)
 * │
 * ├── ControlPanel (player controls)
 * │   ├── PanelSurface (angled surface)
 * │   ├── JoystickBase (joystick mount)
 * │   ├── JoystickStick (movable stick)
 * │   ├── Buttons[] (6 action buttons)
 * │   ├── StartButton
 * │   └── CoinButton
 * │
 * ├── Marquee (title sign)
 * │   ├── MarqueeFrame (outer housing)
 * │   ├── MarqueePanel (illuminated sign)
 * │   └── MarqueeLight (internal light source)
 * │
 * ├── Speaker (audio grille)
 * │   ├── GrilleFrame
 * │   └── GrilleSlats[]
 * │
 * ├── CoinDoor (payment area)
 * │   ├── DoorPanel
 * │   ├── CoinSlot
 * │   └── CoinReturn
 * │
 * ├── Decorations (visual flair)
 * │   ├── SideArtLeft
 * │   ├── SideArtRight
 * │   ├── TMolding[]
 * │   └── CornerCaps[]
 * │
 * └── Lighting (scene lighting attached to cabinet)
 *     ├── MarqueeGlow
 *     ├── ScreenGlow
 *     └── UnderGlow
 */

export const MESH_NAMES = {
  root: 'ArcadeCabinet',

  // Body section
  body: {
    group: 'Body',
    main: 'MainBody',
    back: 'BackPanel',
    left: 'LeftSide',
    right: 'RightSide',
    bottom: 'BottomPanel',
  },

  // Screen section
  screen: {
    group: 'ScreenSection',
    bezel: 'ScreenBezel',
    glass: 'ScreenGlass',
    display: 'ScreenDisplay',
    reflection: 'ScreenReflection',
  },

  // Control panel section
  controls: {
    group: 'ControlPanel',
    surface: 'PanelSurface',
    joystickBase: 'JoystickBase',
    joystickStick: 'JoystickStick',
    buttons: 'Buttons',
    startButton: 'StartButton',
    coinButton: 'CoinButton',
  },

  // Marquee section
  marquee: {
    group: 'Marquee',
    frame: 'MarqueeFrame',
    panel: 'MarqueePanel',
    light: 'MarqueeLight',
  },

  // Speaker section
  speaker: {
    group: 'Speaker',
    frame: 'GrilleFrame',
    slats: 'GrilleSlats',
  },

  // Coin door section
  coinDoor: {
    group: 'CoinDoor',
    panel: 'DoorPanel',
    slot: 'CoinSlot',
    coinReturn: 'CoinReturn',
  },

  // Decorative elements
  decorations: {
    group: 'Decorations',
    sideArtLeft: 'SideArtLeft',
    sideArtRight: 'SideArtRight',
    tMolding: 'TMolding',
    cornerCaps: 'CornerCaps',
  },

  // Lighting elements
  lighting: {
    group: 'Lighting',
    marqueeGlow: 'MarqueeGlow',
    screenGlow: 'ScreenGlow',
    underGlow: 'UnderGlow',
  },
} as const;

// ============================================================================
// CALCULATED POSITIONS
// ============================================================================

/**
 * Pre-calculated positions for mesh placement
 * All Y values are from floor (0) upward
 */
export const MESH_POSITIONS = {
  /** Body center position */
  body: {
    x: 0,
    y: CABINET_BODY.bodyHeight / 2,
    z: 0,
  },

  /** Screen bezel center position */
  screenBezel: {
    x: 0,
    y: CABINET_SCREEN.screenCenterHeight,
    z: CABINET_BODY.depth / 2 - CABINET_SCREEN.screenRecess,
  },

  /** Control panel front center position */
  controlPanel: {
    x: 0,
    y: CABINET_CONTROLS.height,
    z: CABINET_BODY.depth / 2 + CABINET_CONTROLS.depth / 2,
  },

  /** Marquee center position */
  marquee: {
    x: 0,
    y: CABINET_MARQUEE.bottomHeight + CABINET_MARQUEE.height / 2,
    z: CABINET_BODY.depth / 2 - CABINET_MARQUEE.depth / 2,
  },

  /** Speaker grille center position */
  speaker: {
    x: 0,
    y: CABINET_SPEAKER.bottomHeight + CABINET_SPEAKER.height / 2,
    z: CABINET_BODY.depth / 2,
  },

  /** Coin door center position */
  coinDoor: {
    x: 0,
    y: CABINET_COIN_DOOR.centerHeight,
    z: CABINET_BODY.depth / 2,
  },
} as const;

// ============================================================================
// COLOR/MATERIAL CONFIGURATION
// ============================================================================

/**
 * Material colors for different cabinet parts
 * Uses the design system color palette
 */
export const CABINET_COLORS = {
  /** Main body color - dark arcade surface */
  body: '#0a0a0f',
  /** Screen bezel - darker than body */
  bezel: '#050508',
  /** Control panel surface - slightly lighter for visibility */
  controlPanel: '#12121a',
  /** Trim/T-molding - neon cyan accent */
  trim: '#00ffff',
  /** Marquee frame - dark with slight purple */
  marqueeFrame: '#1a1a2e',
  /** Speaker grille - dark metal look */
  speakerGrille: '#0f0f14',
  /** Coin door - metallic dark */
  coinDoor: '#16161e',
  /** Button colors (array for 6 buttons) */
  buttons: ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0088ff', '#ff00ff'],
  /** Joystick ball top color */
  joystick: '#ff0000',
  /** Side art panel base color */
  sideArt: '#1a1a2e',
} as const;

/**
 * Emissive/glow colors for lit elements
 */
export const CABINET_EMISSIVE = {
  /** Screen glow */
  screen: '#00ffff',
  /** Marquee backlight */
  marquee: '#ffffff',
  /** Under cabinet glow */
  underGlow: '#ff00ff',
  /** Button highlight when pressed */
  buttonActive: '#ffffff',
  /** Coin slot indicator */
  coinSlot: '#00ff00',
} as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CabinetDimensions {
  body: typeof CABINET_BODY;
  screen: typeof CABINET_SCREEN;
  controls: typeof CABINET_CONTROLS;
  marquee: typeof CABINET_MARQUEE;
  speaker: typeof CABINET_SPEAKER;
  sideArt: typeof CABINET_SIDE_ART;
  trim: typeof CABINET_TRIM;
  coinDoor: typeof CABINET_COIN_DOOR;
}

export interface CabinetPosition {
  x: number;
  y: number;
  z: number;
}

export interface CabinetMeshNames {
  root: string;
  body: typeof MESH_NAMES.body;
  screen: typeof MESH_NAMES.screen;
  controls: typeof MESH_NAMES.controls;
  marquee: typeof MESH_NAMES.marquee;
  speaker: typeof MESH_NAMES.speaker;
  coinDoor: typeof MESH_NAMES.coinDoor;
  decorations: typeof MESH_NAMES.decorations;
  lighting: typeof MESH_NAMES.lighting;
}

export interface CabinetColors {
  body: string;
  bezel: string;
  controlPanel: string;
  trim: string;
  marqueeFrame: string;
  speakerGrille: string;
  coinDoor: string;
  buttons: string[];
  joystick: string;
  sideArt: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all cabinet dimensions as a single object
 */
export function getCabinetDimensions(): CabinetDimensions {
  return {
    body: CABINET_BODY,
    screen: CABINET_SCREEN,
    controls: CABINET_CONTROLS,
    marquee: CABINET_MARQUEE,
    speaker: CABINET_SPEAKER,
    sideArt: CABINET_SIDE_ART,
    trim: CABINET_TRIM,
    coinDoor: CABINET_COIN_DOOR,
  };
}

/**
 * Calculate screen dimensions including bezel
 */
export function getScreenOuterDimensions() {
  return {
    width: CABINET_SCREEN.screenWidth + CABINET_SCREEN.bezelWidth * 2,
    height: CABINET_SCREEN.screenHeight + CABINET_SCREEN.bezelWidth * 2,
  };
}

/**
 * Get total cabinet bounding box for scene setup
 */
export function getCabinetBoundingBox() {
  return {
    minX: -CABINET_MARQUEE.width / 2,
    maxX: CABINET_MARQUEE.width / 2,
    minY: 0,
    maxY: CABINET_BODY.totalHeight,
    minZ: -CABINET_BODY.depth / 2,
    maxZ: CABINET_BODY.depth / 2 + CABINET_CONTROLS.depth,
    width: CABINET_MARQUEE.width,
    height: CABINET_BODY.totalHeight,
    depth: CABINET_BODY.depth + CABINET_CONTROLS.depth,
  };
}

/**
 * Get optimal camera position for viewing the cabinet
 */
export function getOptimalCameraPosition(): [number, number, number] {
  const bbox = getCabinetBoundingBox();
  // Position camera at eye level, looking at screen center
  return [
    0,
    CABINET_SCREEN.screenCenterHeight,
    bbox.depth * 2 + 2, // Distance to see full cabinet
  ];
}

/**
 * Get button positions on control panel (6-button layout)
 * Returns positions relative to control panel center
 */
export function getButtonPositions(): Array<{ x: number; y: number }> {
  const spacing = 0.1; // Space between buttons
  const rowOffset = 0.05; // Offset between rows
  return [
    // Top row (3 buttons)
    { x: -spacing, y: rowOffset },
    { x: 0, y: rowOffset },
    { x: spacing, y: rowOffset },
    // Bottom row (3 buttons)
    { x: -spacing, y: -rowOffset },
    { x: 0, y: -rowOffset },
    { x: spacing, y: -rowOffset },
  ];
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  body: CABINET_BODY,
  screen: CABINET_SCREEN,
  controls: CABINET_CONTROLS,
  marquee: CABINET_MARQUEE,
  speaker: CABINET_SPEAKER,
  sideArt: CABINET_SIDE_ART,
  trim: CABINET_TRIM,
  coinDoor: CABINET_COIN_DOOR,
  meshNames: MESH_NAMES,
  positions: MESH_POSITIONS,
  colors: CABINET_COLORS,
  emissive: CABINET_EMISSIVE,
};
