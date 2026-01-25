# x402 Arcade Game Engine

A lightweight, modular game engine designed for the x402 Arcade platform. Built with TypeScript for type safety and optimized for 2D browser games.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Core Modules](#core-modules)
  - [GameLoop](#gameloop)
  - [StateMachine](#statemachine)
  - [InputManager](#inputmanager)
  - [InputBuffer](#inputbuffer)
  - [Collision Detection](#collision-detection)
  - [AudioManager](#audiomanager)
  - [MusicManager](#musicmanager)
  - [TouchInput](#touchinput)
- [Types Reference](#types-reference)
- [Best Practices](#best-practices)

## Overview

The game engine provides:

- **Frame-rate independent game loop** with fixed timestep physics
- **State machine** for managing game states (menu, playing, paused, game over)
- **Unified input handling** for keyboard, touch, and mouse
- **Collision detection** for AABB, circles, and lines
- **Audio management** with Web Audio API support
- **Music playback** with crossfade support

## Quick Start

```typescript
import {
  createGameLoop,
  createStateMachine,
  createInputManager,
  createAudioManager,
  GAME_STATES,
} from '@/games/engine';

// 1. Create the game loop
const gameLoop = createGameLoop({ targetFps: 60 });

// 2. Create input manager
const inputManager = createInputManager();

// 3. Create state machine
const stateMachine = createStateMachine({
  initialState: GAME_STATES.IDLE,
  states: [
    { name: GAME_STATES.IDLE },
    { name: GAME_STATES.PLAYING },
    { name: GAME_STATES.PAUSED },
    { name: GAME_STATES.GAME_OVER },
  ],
});

// 4. Set up game loop callbacks
gameLoop.setUpdateCallback((frameInfo) => {
  const input = inputManager.getInput();

  // Handle input
  if (input.pause && stateMachine.isInState(GAME_STATES.PLAYING)) {
    stateMachine.transitionTo(GAME_STATES.PAUSED);
    gameLoop.pause();
  }

  // Update game logic
  updateGame(frameInfo.deltaTime, input);
});

gameLoop.setRenderCallback((frameInfo) => {
  renderGame();
});

// 5. Start the game
stateMachine.transitionTo(GAME_STATES.PLAYING);
gameLoop.start();

// 6. Cleanup when done
gameLoop.destroy();
inputManager.dispose();
```

## Core Modules

### GameLoop

The game loop provides frame-rate independent timing with support for fixed timestep physics.

```typescript
import { createGameLoop, deltaToSeconds } from '@/games/engine';

const loop = createGameLoop({
  targetFps: 60, // Target frame rate
  fixedTimestep: 1000 / 60, // Physics timestep (16.67ms)
  maxDeltaTime: 100, // Cap delta to prevent spiral of death
  useFixedTimestep: true, // Enable fixed timestep for physics
  autoPauseOnHidden: true, // Pause when tab is hidden
});

// Variable timestep update (for animations, input)
loop.setUpdateCallback((frameInfo) => {
  // frameInfo.deltaTime - milliseconds since last frame
  // frameInfo.totalTime - milliseconds since game started
  // frameInfo.frameNumber - current frame count
  // frameInfo.fps - current frames per second

  player.update(frameInfo.deltaTime);
});

// Fixed timestep update (for physics)
loop.setFixedUpdateCallback((deltaTime) => {
  // deltaTime is always fixedTimestep (16.67ms at 60fps)
  physicsWorld.step(deltaToSeconds(deltaTime));
});

// Render callback
loop.setRenderCallback((frameInfo) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  renderGame();
});

// Control the loop
loop.start();
loop.pause();
loop.resume();
loop.stop();
loop.destroy(); // Clean up listeners

// Query state
loop.isRunning();
loop.isPaused();
loop.getFps();
```

#### Utility Functions

```typescript
import { deltaToSeconds, deltaToMs, calculateInterpolationAlpha } from '@/games/engine';

// Convert between milliseconds and seconds
const seconds = deltaToSeconds(16.67); // 0.01667
const ms = deltaToMs(0.01667); // 16.67

// For smooth rendering between physics steps
const alpha = calculateInterpolationAlpha(accumulatedTime, fixedTimestep);
const renderX = prevX + (currX - prevX) * alpha;
```

### StateMachine

Manage game states with validated transitions and lifecycle hooks.

```typescript
import { createStateMachine, createGameStateMachine, GAME_STATES } from '@/games/engine';

// Option 1: Use the pre-configured game state machine
const stateMachine = createGameStateMachine(gameContext, {
  playing: {
    onEnter: (ctx) => {
      ctx.startTime = Date.now();
      console.log('Game started!');
    },
    onUpdate: (ctx, deltaTime) => {
      ctx.elapsed += deltaTime;
    },
    onExit: (ctx) => {
      console.log('Game ended');
    },
  },
  gameOver: {
    onEnter: (ctx) => {
      saveHighScore(ctx.score);
    },
  },
});

// Option 2: Create a custom state machine
const customMachine = createStateMachine({
  initialState: 'menu',
  states: [
    {
      name: 'menu',
      onEnter: () => showMenu(),
      onExit: () => hideMenu(),
    },
    {
      name: 'playing',
      onUpdate: (ctx, dt) => updateGame(dt),
    },
    {
      name: 'paused',
      onEnter: () => showPauseOverlay(),
    },
  ],
  transitions: [
    { from: 'menu', to: 'playing' },
    { from: 'playing', to: 'paused' },
    { from: 'paused', to: 'playing' },
    { from: 'playing', to: 'menu' },
  ],
  context: gameContext,
});

// Use the state machine
stateMachine.transitionTo(GAME_STATES.PLAYING);
stateMachine.update(deltaTime);

// Query state
stateMachine.getCurrentState(); // 'playing'
stateMachine.getPreviousState(); // 'idle'
stateMachine.isInState('playing'); // true
stateMachine.canTransitionTo('paused'); // true
stateMachine.getValidTransitions(); // ['paused', 'game_over']

// Subscribe to state changes
const unsubscribe = stateMachine.subscribe((event) => {
  console.log(`State changed: ${event.previousState} -> ${event.currentState}`);
});

// Reset to initial state
stateMachine.reset();
```

### InputManager

Unified input handling for keyboard, touch, and mouse.

```typescript
import {
  createInputManager,
  getPrimaryDirection,
  hasAnyInput,
  DEFAULT_KEY_MAPPING,
} from '@/games/engine';

const input = createInputManager({
  keyMapping: {
    ...DEFAULT_KEY_MAPPING,
    action: ['Space', 'Enter', 'KeyZ', 'KeyJ'], // Custom action keys
  },
  enableKeyboard: true,
  enableTouch: true,
  enableMouse: true,
  preventDefault: true,
});

// Attach to canvas for touch/mouse support
input.attach(canvasElement);

// Register handlers for immediate input events
input.registerHandler(
  'movement',
  (action, pressed) => {
    if (action === 'up' && pressed) {
      player.jump();
    }
  },
  10
); // Priority 10 (higher = called first)

// Poll input state in game loop
const state = input.getInput();
// state.directions - Set<Direction> ('up', 'down', 'left', 'right')
// state.action - boolean (primary action)
// state.secondaryAction - boolean
// state.pause - boolean
// state.pointer - Vector2D | null (mouse/touch position)
// state.pointerDown - boolean

// Utility functions
const direction = getPrimaryDirection(state); // 'up' | 'down' | 'left' | 'right' | null
if (hasAnyInput(state)) {
  // Some input is active
}

// Check specific inputs
input.isActionPressed('action');
input.isDirectionPressed('up');

// Customize key mappings at runtime
input.setKeyMapping({
  up: ['ArrowUp', 'KeyW', 'KeyK'],
});

// Cleanup
input.dispose();
```

### InputBuffer

Advanced input buffering system for frame-perfect actions and deterministic replay.

```typescript
import {
  createInputManager,
  createInputBuffer,
  createGameStateRecorder,
  downloadRecording,
} from '@/games/engine';

// 1. Create input manager with buffering enabled
const inputManager = createInputManager({
  enableBuffering: true,
  bufferConfig: {
    maxBufferFrames: 10, // Keep last 10 frames
    frameWindow: 3, // 3-frame window for frame-perfect inputs
    enableRecording: true, // Enable input recording
    maxRecordFrames: 36000, // Record up to 10 minutes at 60fps
  },
});

const inputBuffer = inputManager.getBuffer()!;

// 2. Start recording (optional - for replay)
inputBuffer.startRecording('snake', 60); // gameType, targetFps

// 3. In your game loop
let frame = 0;

function gameLoop() {
  // Get input for this frame
  const input = inputManager.getInput();

  // Capture frame for buffering
  inputManager.captureFrame(frame);

  // Frame-perfect input detection
  // Allows 3-frame window for player inputs (more forgiving)
  if (inputBuffer.wasActionPressedInWindow('action', frame)) {
    player.jump(); // Will trigger even if press was 1-3 frames ago
  }

  // Regular input check (exact frame only)
  if (input.directions.has('left')) {
    player.moveLeft();
  }

  // Check for release events
  if (inputBuffer.wasActionReleasedInWindow('action', frame)) {
    player.stopCharging();
  }

  frame++;
  requestAnimationFrame(gameLoop);
}

// 4. Stop recording and save
const recording = inputBuffer.stopRecording();
if (recording) {
  downloadRecording(recording, inputBuffer, 'my-replay.json');
  console.log(`Recorded ${recording.totalFrames} frames`);
}

// 5. Serialize/deserialize recordings
const json = inputBuffer.serializeRecording(recording);
localStorage.setItem('replay', json);

// Later, load the recording
const savedJson = localStorage.getItem('replay')!;
const loadedRecording = inputBuffer.deserializeRecording(savedJson);
```

#### Game State Recording

Record game state for time-travel debugging and replay verification:

```typescript
import { createGameStateRecorder } from '@/games/engine';

// Create recorder
const stateRecorder = createGameStateRecorder(inputBuffer, 3600); // Keep 3600 frames (1 min at 60fps)

// Capture state each frame
function gameLoop() {
  // ... game logic ...

  // Capture serializable game state
  stateRecorder.captureState(frame, {
    player: {
      x: player.x,
      y: player.y,
      velocity: { x: player.vx, y: player.vy },
      hp: player.hp,
    },
    enemies: enemies.map((e) => ({ x: e.x, y: e.y, hp: e.hp })),
    score: gameScore,
    level: currentLevel,
  });

  frame++;
}

// Time-travel debugging: Go back to a specific frame
const pastState = stateRecorder.getState(frame - 60); // 1 second ago
if (pastState) {
  console.log('Player was at:', pastState.state.player);
  console.log('Input was:', pastState.input?.input.directions);
}

// Get all snapshots for analysis
const allSnapshots = stateRecorder.getAllSnapshots();
console.log(`Captured ${allSnapshots.length} state snapshots`);

// Save state history
const stateJson = stateRecorder.serialize();
localStorage.setItem('state-history', stateJson);
```

#### Use Cases

**Frame-Perfect Inputs:**

```typescript
// Fighting game: Allow 3-frame buffer for special moves
if (inputBuffer.wasActionPressedInWindow('action', frame) && player.isOnGround()) {
  player.performSpecialMove();
}
```

**Input Replay for Testing:**

```typescript
// Record a test session
inputBuffer.startRecording('test-level-1', 60);
playLevel1();
const testRecording = inputBuffer.stopRecording();

// Replay inputs for deterministic testing
function replayTest(recording) {
  for (const [frameNum, frameData] of recording.frames) {
    // Apply recorded inputs
    applyInputs(frameData.input);
    updateGame();
  }
}
```

**Debugging:**

```typescript
// When a bug occurs, dump the last 10 seconds
const recording = inputBuffer.getRecording();
if (recording) {
  downloadRecording(recording, inputBuffer, 'bug-report.json');
  downloadStateRecording(stateRecorder, 'bug-state.json');
}
```

### Collision Detection

Comprehensive 2D collision detection utilities.

#### AABB Collision

```typescript
import {
  aabbIntersects,
  aabbMTV,
  aabbCollisionNormal,
  pointInAABB,
  expandAABB,
} from '@/games/engine';

const player = { x: 100, y: 100, width: 32, height: 32 };
const wall = { x: 120, y: 90, width: 50, height: 100 };

// Check for collision
if (aabbIntersects(player, wall)) {
  // Get minimum translation vector to separate
  const mtv = aabbMTV(player, wall);
  if (mtv) {
    player.x += mtv.x;
    player.y += mtv.y;
  }

  // Get collision normal for physics response
  const normal = aabbCollisionNormal(player, wall);
}

// Point collision
if (pointInAABB({ x: 110, y: 110 }, player)) {
  // Point is inside player bounds
}

// Create buffer zone around an entity
const bufferZone = expandAABB(player, 10); // 10px larger on each side
```

#### Circle Collision

```typescript
import { circleIntersects, circleMTV, circleAABBIntersects, pointInCircle } from '@/games/engine';

const ball = { x: 100, y: 100, radius: 20 };
const obstacle = { x: 150, y: 100, radius: 30 };

if (circleIntersects(ball, obstacle)) {
  const mtv = circleMTV(ball, obstacle);
  if (mtv) {
    ball.x += mtv.x;
    ball.y += mtv.y;
  }
}

// Circle vs rectangle
const wall = { x: 180, y: 80, width: 50, height: 100 };
if (circleAABBIntersects(ball, wall)) {
  // Ball hit the wall
}
```

#### Line Collision

```typescript
import { lineIntersects, lineIntersectionPoint, lineAABBIntersects } from '@/games/engine';

const laser = {
  start: { x: 0, y: 100 },
  end: { x: 500, y: 100 },
};

const obstacle = {
  start: { x: 250, y: 0 },
  end: { x: 250, y: 200 },
};

if (lineIntersects(laser, obstacle)) {
  const hitPoint = lineIntersectionPoint(laser, obstacle);
  // hitPoint = { x: 250, y: 100 }
}

// Line vs rectangle
const wall = { x: 300, y: 50, width: 50, height: 100 };
if (lineAABBIntersects(laser, wall)) {
  // Laser hits the wall
}
```

#### Physics Response

```typescript
import { calculateCollisionResponse, reflectVelocity } from '@/games/engine';

// Elastic collision between two objects
const { velocityA, velocityB } = calculateCollisionResponse(
  ball1.velocity, // { x: 5, y: 0 }
  ball2.velocity, // { x: -3, y: 0 }
  ball1.mass, // 1
  ball2.mass, // 2
  collisionNormal, // { x: 1, y: 0 }
  0.8 // restitution (bounciness)
);

// Reflect off a surface (walls, paddles)
const newVelocity = reflectVelocity(
  ball.velocity, // { x: 5, y: 5 }
  wallNormal, // { x: -1, y: 0 }
  0.9 // restitution
);
```

### AudioManager

Sound effects management with Web Audio API.

```typescript
import { createAudioManager, getGlobalAudioManager } from '@/games/engine';

// Create a dedicated audio manager
const audio = createAudioManager({
  masterVolume: 0.8,
  categoryVolumes: {
    sfx: 1.0,
    music: 0.7,
    ui: 0.8,
    voice: 1.0,
  },
  maxConcurrentSounds: 32,
  autoSuspendOnHidden: true,
});

// Initialize (must be called after user interaction)
document.addEventListener('click', () => audio.init(), { once: true });

// Load sounds
await audio.loadSound('jump', '/sounds/jump.mp3', {
  category: 'sfx',
  volume: 0.8,
});

await audio.loadSound('coin', '/sounds/coin.mp3', {
  category: 'sfx',
});

await audio.loadSounds([
  { key: 'explosion', url: '/sounds/explosion.mp3' },
  { key: 'powerup', url: '/sounds/powerup.mp3' },
]);

// Play sounds
const jumpId = audio.play('jump');
audio.play('coin', { volume: 0.5, playbackRate: 1.2 });

// Control playback
audio.stop(jumpId);
audio.stopAll('explosion'); // Stop all explosions
audio.stopAll(); // Stop everything

// Volume control
audio.setMasterVolume(0.5);
audio.setCategoryVolume('sfx', 0.8);
audio.mute();
audio.unmute();

// Cleanup
audio.dispose();

// Or use the global singleton
const globalAudio = getGlobalAudioManager();
```

### MusicManager

Background music playback with crossfade support.

```typescript
import { createMusicManager, getGlobalMusicManager } from '@/games/engine';

const music = createMusicManager({
  defaultCrossfadeDuration: 2000,
  defaultVolume: 0.7,
  autoResumeOnVisible: true,
  fadeOutDuration: 1000,
});

// Initialize on user interaction
document.addEventListener('click', () => music.init(), { once: true });

// Load tracks
await music.loadTrack({
  key: 'menu',
  url: '/music/menu-theme.mp3',
  volume: 0.8,
});

await music.loadTrack({
  key: 'gameplay',
  url: '/music/gameplay.mp3',
  volume: 1.0,
  loopStart: 0.5, // Optional loop points
  loopEnd: 120.0,
});

await music.loadTrack({
  key: 'boss',
  url: '/music/boss-battle.mp3',
  volume: 0.9,
});

// Play music
music.play('menu');

// Crossfade to new track
music.crossfadeTo('gameplay', {
  duration: 3000,
  easing: 'ease-in-out',
});

// Control playback
music.pause();
music.resume();
music.setVolume(0.5);
music.stop(true); // Fade out

// Get state
const state = music.getState();
// state.currentTrack - 'gameplay'
// state.playing - true
// state.paused - false
// state.position - current position in seconds
// state.duration - track duration
// state.volume - current volume

// Cleanup
music.dispose();
```

### TouchInput

Mobile touch input with swipe gesture detection.

```typescript
import {
  createTouchInputHandler,
  touchPositionToDirection,
  isTouchSupported,
} from '@/games/engine';

// Check for touch support
if (!isTouchSupported()) {
  console.log('Touch not supported');
}

const touch = createTouchInputHandler({
  swipeThreshold: 30, // Minimum swipe distance in pixels
  swipeMaxDuration: 300, // Max swipe duration in ms
  swipeMinVelocity: 100, // Min velocity in pixels/second
  preventDefault: true,
  stopPropagation: true,
});

// Set up callbacks
touch.setCallbacks({
  onSwipe: (swipe) => {
    // swipe.direction - 'up' | 'down' | 'left' | 'right'
    // swipe.distance - pixels traveled
    // swipe.velocity - pixels/second
    // swipe.duration - milliseconds
    player.move(swipe.direction);
  },
  onTap: (position) => {
    player.shoot(position);
  },
  onTouchStart: (touchPoint) => {
    showTouchFeedback(touchPoint.position);
  },
});

// Attach to canvas
touch.attach(canvasElement);

// Poll state in game loop
if (touch.isTouching()) {
  const pos = touch.getPosition();
  // Handle continuous touch
}

// Check for swipe (alternative to callback)
const swipeDir = touch.getSwipeDirection();
if (swipeDir) {
  handleSwipe(swipeDir);
  touch.clearSwipe(); // Clear after processing
}

// Cleanup
touch.dispose();
```

## Types Reference

### Core Types

```typescript
// 2D vector for positions, velocities
interface Vector2D {
  x: number;
  y: number;
}

// Rectangle bounds
interface Bounds {
  x: number; // Left edge
  y: number; // Top edge
  width: number;
  height: number;
}

// Circle bounds
interface CircleBounds {
  x: number; // Center X
  y: number; // Center Y
  radius: number;
}

// Frame timing information
interface FrameInfo {
  deltaTime: number; // Time since last frame (ms)
  totalTime: number; // Time since game started (ms)
  frameNumber: number; // Current frame count
  fps: number; // Current FPS
  targetFps: number; // Target FPS from config
}
```

### Game State Types

```typescript
// Standard game states
const GAME_STATES = {
  IDLE: 'idle',
  READY: 'ready',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game_over',
  VICTORY: 'victory',
  LOADING: 'loading',
};

// Direction type
type Direction = 'up' | 'down' | 'left' | 'right';

// Game input state
interface GameInput {
  directions: Set<Direction>;
  action: boolean;
  secondaryAction: boolean;
  pause: boolean;
  pointer: Vector2D | null;
  pointerDown: boolean;
}
```

## Best Practices

### 1. Always Initialize Audio on User Interaction

Browsers require user interaction before playing audio:

```typescript
const startButton = document.getElementById('start');
startButton.addEventListener(
  'click',
  async () => {
    await audio.init();
    await music.init();
    startGame();
  },
  { once: true }
);
```

### 2. Use Fixed Timestep for Physics

Variable frame rates can cause inconsistent physics:

```typescript
// Good: Fixed timestep for deterministic physics
loop.setFixedUpdateCallback((dt) => {
  world.step(deltaToSeconds(dt));
});

// Variable timestep for visual updates
loop.setUpdateCallback((frameInfo) => {
  animation.update(frameInfo.deltaTime);
});
```

### 3. Clean Up Resources

Always dispose of managers when the game ends:

```typescript
function cleanup() {
  gameLoop.destroy();
  inputManager.dispose();
  audio.dispose();
  music.dispose();
  touchInput.dispose();
}
```

### 4. Use State Machine for Game Flow

Keep game logic organized:

```typescript
// Instead of boolean flags
let isPlaying = false;
let isPaused = false;
let isGameOver = false;

// Use state machine
stateMachine.isInState(GAME_STATES.PLAYING);
stateMachine.transitionTo(GAME_STATES.PAUSED);
```

### 5. Pool Frequently Created Objects

Avoid garbage collection spikes:

```typescript
// Pre-allocate collision results
const collisionResult: CollisionResult = {
  collided: false,
  entityA: null,
  entityB: null,
  normal: { x: 0, y: 0 },
  depth: 0,
  contactPoint: { x: 0, y: 0 },
};

// Reuse instead of creating new objects
function checkCollision(a: Entity, b: Entity): CollisionResult {
  // Update existing object instead of creating new
  collisionResult.collided = aabbIntersects(a.bounds, b.bounds);
  // ...
  return collisionResult;
}
```

### 6. Handle Visibility Changes

Pause game when tab is hidden:

```typescript
const loop = createGameLoop({ autoPauseOnHidden: true });

loop.setVisibilityCallback((visible) => {
  if (!visible) {
    stateMachine.transitionTo(GAME_STATES.PAUSED);
  }
});
```

## License

Part of the x402 Arcade project.
