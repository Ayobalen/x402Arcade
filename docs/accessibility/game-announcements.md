# Game Announcements for Screen Readers

## Overview

The x402 Arcade implements a comprehensive game announcement system to provide real-time feedback to screen reader users during gameplay. This system uses ARIA live regions to announce game events without disrupting the user's flow.

## Architecture

### Components

1. **LiveRegion Component** (`src/components/ui/LiveRegion/`)
   - Low-level ARIA live region component
   - Configurable politeness levels (`polite` | `assertive`)
   - Automatic role selection (`status` | `alert`)

2. **useLiveAnnouncer Hook** (`src/hooks/useLiveAnnouncer.tsx`)
   - Mid-level API for managing announcements
   - Handles message queueing and clearing
   - Prevents duplicate announcements
   - Auto-clear support

3. **useGameAnnouncements Hook** (`src/hooks/useGameAnnouncements.ts`)
   - High-level game-specific announcement API
   - Pre-configured announcement functions for common game events
   - Consistent announcement formatting

4. **Game Descriptions Utility** (`src/utils/accessibility/gameDescriptions.ts`)
   - Generates descriptive text for game states
   - Formats scores, ranks, and positions
   - Describes game board states

## Implementation Guide

### Basic Setup

```tsx
import { useGameAnnouncements } from '@/hooks';

function SnakeGame() {
  const { announceGameStart, announceScore, announceGameOver, LiveRegionComponent } =
    useGameAnnouncements();

  // Render the LiveRegion component in your UI
  return (
    <div>
      <LiveRegionComponent />
      {/* Game content */}
    </div>
  );
}
```

### Game Event Announcements

#### 1. Game Start

```tsx
// Announce game start without countdown
announceGameStart('Snake');
// Screen reader: "Snake game starting"

// Announce game start with countdown
announceGameStart('Snake', 3);
// Screen reader: "Snake game starting. Starting in 3 seconds"
```

#### 2. Countdown

```tsx
// Announce countdown numbers
announceCountdown(3); // "3"
announceCountdown(2); // "2"
announceCountdown(1); // "1"
```

#### 3. Game Pause/Resume

```tsx
// Pause
announceGamePause();
// Screen reader: "Game paused"

// Resume
announceGameResume();
// Screen reader: "Game resumed"
```

#### 4. Score Updates

```tsx
// Basic score announcement
announceScore(100);
// Screen reader: "Score: 100"

// Score with delta
announceScore(110, 10);
// Screen reader: "Score: 110. Plus 10 points"
```

**Note:** Score announcements use `polite` politeness to avoid interrupting gameplay.

#### 5. Level Completion

```tsx
// Announce level up
announceLevelUp(1, 2);
// Screen reader: "Level 1 complete! Now entering level 2"
```

#### 6. Power-Ups

```tsx
// Basic power-up announcement
announcePowerUp('Speed Boost');
// Screen reader: "Power-up collected: Speed Boost"

// With description
announcePowerUp('Speed Boost', 'Move faster for 10 seconds');
// Screen reader: "Power-up collected: Speed Boost. Move faster for 10 seconds"
```

#### 7. Achievements

```tsx
// Basic achievement announcement
announceAchievement('First Win');
// Screen reader: "Achievement unlocked: First Win"

// With description
announceAchievement('High Scorer', 'Reach 1000 points');
// Screen reader: "Achievement unlocked: High Scorer. Reach 1000 points"
```

#### 8. Time Warnings

```tsx
// Multiple seconds remaining
announceTimeWarning(10);
// Screen reader: "Warning! 10 seconds remaining"

// One second remaining
announceTimeWarning(1);
// Screen reader: "Warning! 1 second remaining"
```

#### 9. Game Over

```tsx
// Basic game over
announceGameOver(250);
// Screen reader: "Game Over! Final score: 250"

// With rank
announceGameOver(250, 3);
// Screen reader: "Game Over! Final score: 250. You ranked number 3"
```

#### 10. High Score

```tsx
// Basic high score
announceHighScore(500);
// Screen reader: "New high score: 500!"

// With previous high score
announceHighScore(500, 400);
// Screen reader: "New high score: 500! Previous high score was 400"
```

#### 11. Custom Announcements

```tsx
// Basic custom announcement (polite)
announceCustom('Bonus round starting');

// Urgent custom announcement (assertive)
announceCustom('Critical event!', { urgent: true });

// With context
announceCustom('Enemy approaching', { context: 'From the left' });

// With auto-clear
announceCustom('Temporary message', { clearAfter: 2000 });
```

## Game State Descriptions

### Snake Game

```tsx
import { describeSnakeGame } from '@/utils/accessibility';

const description = describeSnakeGame({
  score: 150,
  level: 3,
  snakeLength: 12,
  direction: 'right',
  snakePosition: { x: 5, y: 5 },
  foodPosition: { x: 8, y: 3 },
});

// Result: "Snake game. Score: 150. Level: 3. Snake length: 12.
//          Moving right. Food is to the right and above."
```

### Tetris Game

```tsx
import { describeTetrisGame } from '@/utils/accessibility';

const description = describeTetrisGame({
  score: 2400,
  level: 5,
  linesCleared: 24,
  currentPiece: 'I',
  nextPiece: 'L',
});

// Result: "Tetris game. Score: 2400. Level: 5. Lines cleared: 24.
//          Current piece: I-shaped (straight line). Next piece: L-shaped."
```

### Canvas Labeling

```tsx
import { describeGameCanvas, describeGameControls } from '@/utils/accessibility';

// Add aria-label to game canvas
<canvas
  ref={canvasRef}
  role="img"
  aria-label={describeGameCanvas('Snake', 'Score: 100, Level: 2')}
  aria-describedby="snake-controls"
/>

<div id="snake-controls" className="sr-only">
  {describeGameControls('Snake')}
</div>
```

## Complete Integration Example

### Snake Game with Full Accessibility

```tsx
import { useEffect } from 'react';
import { useSnakeGame } from './useSnakeGame';
import { useGameAnnouncements } from '@/hooks';
import { describeGameCanvas, describeGameControls } from '@/utils/accessibility';

export function SnakeGame() {
  const { state, canvasRef, restart } = useSnakeGame();

  const {
    announceGameStart,
    announceScore,
    announceLevelUp,
    announceGameOver,
    announceGamePause,
    announceGameResume,
    LiveRegionComponent,
  } = useGameAnnouncements();

  // Announce game start
  useEffect(() => {
    announceGameStart('Snake', 3);
  }, []);

  // Announce score changes (throttled)
  useEffect(() => {
    if (state.score > 0) {
      announceScore(state.score);
    }
  }, [state.score]);

  // Announce level up
  useEffect(() => {
    if (state.level > 1) {
      announceLevelUp(state.level - 1, state.level);
    }
  }, [state.level]);

  // Announce game over
  useEffect(() => {
    if (state.isGameOver) {
      announceGameOver(state.score, state.rank);
    }
  }, [state.isGameOver]);

  // Announce pause/resume
  useEffect(() => {
    if (state.isPaused) {
      announceGamePause();
    } else if (!state.isGameOver) {
      announceGameResume();
    }
  }, [state.isPaused]);

  return (
    <div className="snake-game">
      {/* Live region for announcements */}
      <LiveRegionComponent />

      {/* Game canvas with accessibility attributes */}
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={describeGameCanvas('Snake', `Score: ${state.score}, Level: ${state.level}`)}
        aria-describedby="snake-controls"
        width={400}
        height={400}
      />

      {/* Screen reader controls description */}
      <div id="snake-controls" className="sr-only">
        {describeGameControls('Snake')}
      </div>

      {/* Visible UI */}
      <div className="game-info" aria-live="off">
        <div>Score: {state.score}</div>
        <div>Level: {state.level}</div>
      </div>
    </div>
  );
}
```

## Politeness Levels

### Polite (`aria-live="polite"`)

**Use for:** Non-critical updates that shouldn't interrupt the user

**Examples:**

- Score updates
- Progress indicators
- Minor status changes

**Behavior:** Announced during natural pauses in screen reader speech

### Assertive (`aria-live="assertive"`)

**Use for:** Important updates that should be announced immediately

**Examples:**

- Game start/end
- Level completion
- Power-ups and achievements
- Time warnings
- Errors and critical events

**Behavior:** Interrupts current screen reader speech

## Best Practices

### ✅ DO:

- **Announce state changes:** Game start, pause, resume, game over
- **Be concise:** Keep announcements short and clear
- **Use appropriate politeness:** `polite` for updates, `assertive` for critical events
- **Provide context:** Include relevant information (score, level, etc.)
- **Test with screen readers:** Verify announcements make sense
- **Throttle frequent updates:** Don't announce every frame (e.g., score updates)

### ❌ DON'T:

- **Don't spam announcements:** Avoid announcing too frequently
- **Don't interrupt gameplay unnecessarily:** Use `polite` for non-critical updates
- **Don't duplicate information:** If visible text is announced, don't repeat it
- **Don't be overly verbose:** Keep messages focused and relevant
- **Don't announce decorative changes:** Only announce meaningful state changes

## Throttling Strategy

For frequently changing values (like scores), implement throttling:

```tsx
import { useEffect, useRef } from 'react';

function useThrottledAnnouncement(value: number, delay: number = 1000) {
  const lastAnnounced = useRef<number>(0);
  const { announceScore } = useGameAnnouncements();

  useEffect(() => {
    const now = Date.now();
    if (now - lastAnnounced.current >= delay) {
      announceScore(value);
      lastAnnounced.current = now;
    }
  }, [value]);
}
```

## Testing

### Manual Testing with Screen Readers

**macOS - VoiceOver:**

```bash
# Enable VoiceOver
Cmd + F5

# Navigate
Ctrl + Option + Arrow Keys

# Listen for announcements
(Announcements are automatic)
```

**Windows - NVDA:**

```bash
# Start NVDA
Ctrl + Alt + N

# Navigate
Arrow Keys / Tab

# Listen for announcements
(Announcements are automatic)
```

### Automated Testing

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';

it('should announce game start', async () => {
  const { result } = renderHook(() => useGameAnnouncements());

  act(() => {
    result.current.announceGameStart('Snake', 3);
  });

  // Verify LiveRegion contains the announcement
  const liveRegion = screen.getByRole('status');
  await waitFor(() => {
    expect(liveRegion).toHaveTextContent('Snake game starting');
  });
});
```

## WCAG Compliance

### ✅ Success Criteria Met

**4.1.3 Status Messages (Level AA):**

- Status messages are programmatically determined through ARIA live regions
- Users can perceive messages without receiving focus

**1.3.1 Info and Relationships (Level A):**

- Game state information is conveyed through proper semantic markup
- Relationships between game elements are programmatically determined

**2.4.3 Focus Order (Level A):**

- Live region announcements don't disrupt focus order
- Keyboard focus remains on game controls

## Performance Considerations

- **Debounce rapid announcements:** Prevent announcement spam
- **Clear old announcements:** Automatically clear after appropriate delays
- **Avoid memory leaks:** Clean up timeouts on unmount
- **Optimize re-renders:** Use `useCallback` for announcement functions

## Troubleshooting

### Announcements Not Being Read

1. **Check screen reader is running:** VoiceOver (macOS) or NVDA (Windows)
2. **Verify live region is rendered:** Inspect DOM for `aria-live` attribute
3. **Check politeness level:** Try changing from `polite` to `assertive`
4. **Ensure message changes:** Screen readers only announce on content change
5. **Test in production mode:** Some behaviors differ in development

### Duplicate Announcements

1. **Enable duplicate prevention:** `allowDuplicate: false` (default)
2. **Check multiple LiveRegion components:** Only render one per game
3. **Verify effect dependencies:** Ensure effects don't fire unnecessarily

### Announcements Too Frequent

1. **Implement throttling:** Delay between announcements
2. **Batch related updates:** Combine multiple changes into one announcement
3. **Use politeness appropriately:** `polite` for frequent updates

---

**Last Updated:** January 25, 2026
**Status:** ✅ Fully implemented and tested
**WCAG Level:** AA compliant
