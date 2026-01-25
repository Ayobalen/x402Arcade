# Audio System Documentation

Complete guide to the x402Arcade Audio System built on Howler.js.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [AudioManager](#audiomanager)
- [React Hooks](#react-hooks)
- [React Context](#react-context)
- [Components](#components)
- [Browser Compatibility](#browser-compatibility)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## Overview

The Audio System provides a robust, cross-browser audio solution with:

- ✅ **Howler.js Integration** - Reliable audio playback across all browsers
- ✅ **Singleton AudioManager** - Centralized audio state management
- ✅ **React Hooks** - Easy integration with React components
- ✅ **Context Provider** - Global audio state access
- ✅ **Browser Compatibility** - Safari, Firefox, Chrome support
- ✅ **Auto-Unlock** - Handles browser audio restrictions
- ✅ **Category Volumes** - Separate controls for SFX, Music, Voice, UI
- ✅ **State Persistence** - Settings saved to localStorage
- ✅ **TypeScript** - Full type safety

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐    │
│  │ Components │  │   Hooks    │  │  Context Provider  │    │
│  └────────────┘  └────────────┘  └────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     AudioManager (Singleton)                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ State: volume, mute, enabled, initialized, unlocked  │   │
│  │ Controls: play, stop, pause, loadSound, etc.        │   │
│  │ Persistence: localStorage integration               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       Howler.js Library                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Web Audio API / HTML5 Audio fallback                │   │
│  │ Cross-browser compatibility layer                   │   │
│  │ Sound sprite support, auto-unlock, pooling          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### 1. Wrap your app with AudioProvider

```tsx
// main.tsx
import { AudioProvider } from '@/contexts/AudioContext';

function App() {
  return (
    <AudioProvider>
      <YourApp />
    </AudioProvider>
  );
}
```

### 2. Use audio in components

```tsx
import { useAudioContext } from '@/contexts/AudioContext';
import { AudioCategory } from '@/utils/AudioManager';
import { useEffect } from 'react';

function GameComponent() {
  const audio = useAudioContext();

  useEffect(() => {
    // Load sound
    audio.loadSound('jump', '/sounds/jump.mp3', {
      category: AudioCategory.SFX,
    });

    return () => {
      audio.unloadSound('jump');
    };
  }, []);

  const handleJump = () => {
    audio.play('jump');
  };

  return <button onClick={handleJump}>Jump</button>;
}
```

### 3. Add AudioUnlockPrompt

```tsx
import { AudioUnlockPrompt } from '@/components/audio';

function Layout() {
  return (
    <>
      <YourContent />
      <AudioUnlockPrompt message="Click to enable sound" />
    </>
  );
}
```

---

## AudioManager

The singleton class managing all audio operations.

### Initialization

```typescript
import { audioManager } from '@/utils/AudioManager';

// Initialize audio context (required on some browsers)
await audioManager.initialize();

// Unlock audio (required after user interaction)
await audioManager.unlock();
```

### Loading Sounds

```typescript
import { AudioCategory } from '@/utils/AudioManager';

// Load a sound
await audioManager.loadSound('coin', '/sounds/coin.mp3', {
  volume: 0.8,
  category: AudioCategory.SFX,
});

// Load with multiple formats (fallback)
await audioManager.loadSound('music', ['/music/theme.mp3', '/music/theme.ogg'], {
  loop: true,
  category: AudioCategory.MUSIC,
});
```

### Playing Sounds

```typescript
// Play a sound
const soundId = audioManager.play('coin');

// Play with options
audioManager.play('coin', {
  volume: 0.5,
  rate: 1.2, // Playback speed
});

// Stop a specific sound instance
audioManager.stop('coin', soundId);

// Stop all instances of a sound
audioManager.stop('coin');
```

### Volume Control

```typescript
// Master volume (0.0 - 1.0)
audioManager.setMasterVolume(0.7);

// Category volumes
audioManager.setCategoryVolume(AudioCategory.MUSIC, 0.5);
audioManager.setCategoryVolume(AudioCategory.SFX, 0.8);
```

### Mute Control

```typescript
// Mute all audio
audioManager.mute();

// Unmute
audioManager.unmute();

// Toggle
const isMuted = audioManager.toggleMute();
```

### State Management

```typescript
// Check state
const isInitialized = audioManager.getIsInitialized();
const isUnlocked = audioManager.getIsUnlocked();
const isMuted = audioManager.getIsMuted();
const isEnabled = audioManager.getIsEnabled();

// Enable/disable audio
audioManager.enable();
audioManager.disable(); // Stops all sounds
```

### Cleanup

```typescript
// Unload a single sound
audioManager.unloadSound('coin');

// Unload all sounds
audioManager.unloadAll();

// Stop all playing sounds
audioManager.stopAll();

// Reset to defaults
audioManager.reset();
```

---

## React Hooks

### useAudio

Main hook providing audio controls.

```tsx
import { useAudio } from '@/hooks/useAudio';

function MyComponent() {
  const audio = useAudio();

  return (
    <div>
      <button onClick={() => audio.play('click')}>Play</button>
      <button onClick={() => audio.toggleMute()}>
        {audio.isMuted ? 'Unmute' : 'Mute'}
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={audio.masterVolume}
        onChange={(e) => audio.setMasterVolume(parseFloat(e.target.value))}
      />
    </div>
  );
}
```

### useSound

Hook for managing a single sound.

```tsx
import { useSound } from '@/hooks/useAudio';
import { AudioCategory } from '@/utils/AudioManager';

function Button() {
  const { play, isLoaded, error } = useSound('button-click', '/sounds/click.mp3', {
    category: AudioCategory.UI,
  });

  return (
    <button onClick={() => play()} disabled={!isLoaded}>
      {error ? 'Failed to load sound' : 'Click me'}
    </button>
  );
}
```

### useBackgroundMusic

Hook for looping background music.

```tsx
import { useBackgroundMusic } from '@/hooks/useAudio';
import { useEffect } from 'react';

function Game() {
  const music = useBackgroundMusic('game-theme', '/music/game.mp3');

  useEffect(() => {
    const soundId = music.play();
    return () => music.stop(soundId);
  }, []);

  return <div>Game content...</div>;
}
```

### useUISounds

Hook for managing multiple UI sounds.

```tsx
import { useUISounds } from '@/hooks/useAudio';

function Menu() {
  const sfx = useUISounds({
    click: '/sounds/click.mp3',
    hover: '/sounds/hover.mp3',
    back: '/sounds/back.mp3',
  });

  return (
    <nav>
      <button
        onClick={() => sfx.play('click')}
        onMouseEnter={() => sfx.play('hover')}
      >
        Start Game
      </button>
      <button
        onClick={() => sfx.play('back')}
        onMouseEnter={() => sfx.play('hover')}
      >
        Back
      </button>
    </nav>
  );
}
```

---

## React Context

### AudioProvider

Provides audio state to the entire app.

```tsx
import { AudioProvider } from '@/contexts/AudioContext';

function App() {
  return (
    <AudioProvider autoInitialize={true} autoUnlock={true}>
      <YourApp />
    </AudioProvider>
  );
}
```

**Props:**

- `autoInitialize` (default: `true`) - Auto-initialize on mount
- `autoUnlock` (default: `true`) - Auto-unlock on first user interaction

### useAudioContext

Access audio controls from any component.

```tsx
import { useAudioContext } from '@/contexts/AudioContext';

function VolumeControl() {
  const audio = useAudioContext();

  return (
    <div>
      <label>
        Master Volume:
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={audio.masterVolume}
          onChange={(e) => audio.setMasterVolume(parseFloat(e.target.value))}
        />
      </label>
    </div>
  );
}
```

---

## Components

### AudioUnlockPrompt

Displays a button to unlock audio when required by the browser.

```tsx
import { AudioUnlockPrompt } from '@/components/audio';

function Layout() {
  return (
    <>
      <YourContent />
      <AudioUnlockPrompt
        message="Click to enable sound"
        autoHide={true}
        onUnlock={() => console.log('Audio unlocked!')}
      />
    </>
  );
}
```

**Props:**

- `message` (default: `"Click to enable sound"`) - Message to display
- `autoHide` (default: `true`) - Hide after unlock
- `className` (optional) - Custom CSS class
- `onUnlock` (optional) - Callback when unlocked

---

## Browser Compatibility

### Supported Browsers

- ✅ Chrome 50+
- ✅ Firefox 52+
- ✅ Safari 11+
- ✅ Edge 79+
- ✅ iOS Safari 11+
- ✅ Chrome Android 90+

### Browser-Specific Behavior

#### Safari / iOS

- **Requires user interaction** before playing audio
- Use `AudioUnlockPrompt` component
- Auto-unlock on first click/touch
- Silent sound trick for initial unlock

#### Chrome

- **Autoplay policy** prevents audio without interaction
- Auto-unlock works on first user gesture
- Web Audio API preferred over HTML5 Audio

#### Firefox

- Generally permissive audio policy
- Web Audio API fully supported
- No special handling required

### Compatibility Checks

```typescript
import { audioManager } from '@/utils/AudioManager';

const compat = audioManager.getCompatibility();

console.log(compat.supportsWebAudio); // true/false
console.log(compat.supportsHTML5Audio); // true/false
console.log(compat.requiresUserInteraction); // true/false
console.log(compat.browser); // "Chrome", "Safari", etc.
console.log(compat.version); // "120", "17", etc.
```

---

## Best Practices

### 1. Always Load Sounds Before Playing

```typescript
// ❌ Bad - might fail
audio.play('coin');

// ✅ Good
await audio.loadSound('coin', '/sounds/coin.mp3');
audio.play('coin');
```

### 2. Use Audio Categories

```typescript
// ✅ Good - separate control for music vs SFX
audio.loadSound('theme', '/music/theme.mp3', {
  category: AudioCategory.MUSIC,
});

audio.loadSound('jump', '/sounds/jump.mp3', {
  category: AudioCategory.SFX,
});

// User can control music separately from SFX
audio.setCategoryVolume(AudioCategory.MUSIC, 0.3);
audio.setCategoryVolume(AudioCategory.SFX, 0.8);
```

### 3. Unload Sounds When Done

```typescript
// ✅ Good - free memory
useEffect(() => {
  audio.loadSound('level1-music', '/music/level1.mp3');

  return () => {
    audio.unloadSound('level1-music'); // Cleanup
  };
}, []);
```

### 4. Handle Auto-Unlock Properly

```tsx
// ✅ Good - add AudioUnlockPrompt to your layout
function App() {
  return (
    <AudioProvider>
      <YourApp />
      <AudioUnlockPrompt />
    </AudioProvider>
  );
}
```

### 5. Check isLoaded Before Playing

```tsx
const { play, isLoaded } = useSound('click', '/sounds/click.mp3');

// ✅ Good - wait for load
<button onClick={() => play()} disabled={!isLoaded}>
  Click me
</button>
```

---

## Examples

### Basic Game Audio

```tsx
import { useEffect } from 'react';
import { useAudioContext } from '@/contexts/AudioContext';
import { AudioCategory } from '@/utils/AudioManager';

function SnakeGame() {
  const audio = useAudioContext();

  useEffect(() => {
    // Load game sounds
    const loadSounds = async () => {
      await Promise.all([
        audio.loadSound('eat', '/sounds/eat.mp3', { category: AudioCategory.SFX }),
        audio.loadSound('crash', '/sounds/crash.mp3', { category: AudioCategory.SFX }),
        audio.loadSound('game-music', '/music/snake.mp3', {
          category: AudioCategory.MUSIC,
          loop: true,
        }),
      ]);
    };

    loadSounds();

    // Start background music
    const musicId = audio.play('game-music');

    return () => {
      audio.stop('game-music', musicId);
      audio.unloadSound('eat');
      audio.unloadSound('crash');
      audio.unloadSound('game-music');
    };
  }, []);

  const handleEatFood = () => {
    audio.play('eat');
  };

  const handleGameOver = () => {
    audio.play('crash');
    audio.stop('game-music');
  };

  return <div>Game content...</div>;
}
```

### Settings Panel

```tsx
import { useAudioContext } from '@/contexts/AudioContext';
import { AudioCategory } from '@/utils/AudioManager';

function SettingsPanel() {
  const audio = useAudioContext();

  return (
    <div>
      <h2>Audio Settings</h2>

      <label>
        Master Volume
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={audio.masterVolume}
          onChange={(e) => audio.setMasterVolume(parseFloat(e.target.value))}
        />
      </label>

      <label>
        Music Volume
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={audio.getCategoryVolume(AudioCategory.MUSIC)}
          onChange={(e) =>
            audio.setCategoryVolume(AudioCategory.MUSIC, parseFloat(e.target.value))
          }
        />
      </label>

      <label>
        SFX Volume
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={audio.getCategoryVolume(AudioCategory.SFX)}
          onChange={(e) =>
            audio.setCategoryVolume(AudioCategory.SFX, parseFloat(e.target.value))
          }
        />
      </label>

      <button onClick={() => audio.toggleMute()}>
        {audio.isMuted ? 'Unmute' : 'Mute'}
      </button>

      <button onClick={() => (audio.isEnabled ? audio.disable() : audio.enable())}>
        {audio.isEnabled ? 'Disable Audio' : 'Enable Audio'}
      </button>
    </div>
  );
}
```

### Button with Click Sound

```tsx
import { useSound } from '@/hooks/useAudio';
import { AudioCategory } from '@/utils/AudioManager';

function PlayButton() {
  const { play, isLoaded } = useSound('button-click', '/sounds/click.mp3', {
    category: AudioCategory.UI,
    volume: 0.5,
  });

  const handleClick = () => {
    play();
    // ... other button logic
  };

  return (
    <button onClick={handleClick} disabled={!isLoaded}>
      Play Game
    </button>
  );
}
```

---

## Troubleshooting

### Audio not playing on Safari/iOS

**Solution:** Ensure `AudioUnlockPrompt` is displayed and user clicks it.

```tsx
<AudioUnlockPrompt message="Tap to enable sound" />
```

### Sounds playing at wrong volume

**Solution:** Check both master volume and category volume.

```typescript
console.log('Master:', audio.getMasterVolume());
console.log('SFX:', audio.getCategoryVolume(AudioCategory.SFX));
```

### Memory leaks with sounds

**Solution:** Always unload sounds in cleanup.

```tsx
useEffect(() => {
  audio.loadSound('temp', '/sounds/temp.mp3');
  return () => audio.unloadSound('temp'); // Important!
}, []);
```

### Audio state not persisting

**Solution:** Check localStorage is available.

```typescript
// State auto-saves to localStorage
// Check: localStorage.getItem('x402arcade_audio_state')
```

---

## API Reference

See inline TypeScript types for complete API documentation.

- `AudioManager` class in `utils/AudioManager.ts`
- `useAudio` hook in `hooks/useAudio.ts`
- `AudioContext` in `contexts/AudioContext.tsx`
- `AudioUnlockPrompt` component in `components/audio/AudioUnlockPrompt.tsx`

---

**Built with ❤️ for x402Arcade**
