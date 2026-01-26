# Revised Game Template Approach

**Critical Insight:** Snake game already works perfectly with payment flow, session management, and score submission. We should **extract and generalize** these patterns, not rebuild them.

## Strategy: Wrap, Don't Replace

Instead of creating entirely new hooks/components, we'll:

1. **Extract** the working patterns from Snake
2. **Generalize** them to work with any game
3. **Wrap** games in a template that provides these patterns
4. **Keep Snake working** throughout the process

---

## What Snake Already Has (That Works)

### 1. Payment Flow (in Game.tsx page)

- Uses `useX402` hook
- Uses `useWallet` hook
- Creates payment sessions
- Handles x402 protocol correctly

### 2. Game Logic (in useSnakeGame hook)

- Game state management
- Canvas rendering
- Input handling
- Score tracking

### 3. Score Submission (in SnakeGame component)

- Uses `useScoreSubmission` hook
- Auto-submits on game over
- Handles session IDs

### 4. Leaderboard Integration

- Fetches rankings on game over
- Shows player rank

---

## New Approach: Extract & Reuse

### Phase 1: Create Type-Safe Wrappers (Don't Break Snake)

**Step 1.1:** Types are done ✅

- `IGame` interface
- `GameMetadata` type
- Common types

**Step 1.2:** Create generic hooks that **wrap** existing patterns

Instead of rewriting, create adapters:

```typescript
// useGameSession - wraps the Game.tsx payment pattern
export function useGameSession(metadata: GameMetadata) {
  const wallet = useWallet();
  const x402 = useX402();
  const scoreSubmission = useScoreSubmission();

  // Same pattern as Game.tsx but generic
  // Returns: paymentStatus, sessionId, handlePayment, submitScore
}
```

**Step 1.3:** Create a `GameWrapper` component

Instead of `GameTemplate`, create a wrapper that provides the same UI Snake uses:

```typescript
export function GameWrapper({
  metadata,
  gameComponent: GameComponent,
  ...props
}) {
  const session = useGameSession(metadata);

  // Same payment gate logic as Game.tsx
  if (!session.paid) {
    return <PaymentGate onPay={session.handlePayment} />;
  }

  // Render the game with session props
  return (
    <GameComponent
      sessionId={session.sessionId}
      onGameOver={(score) => session.submitScore(score)}
      {...props}
    />
  );
}
```

### Phase 2: Make Snake Use the Wrapper (Verify Pattern)

**Step 2.1:** Create `SnakeGame` metadata

```typescript
export const snakeMetadata: GameMetadata = {
  id: 'snake',
  name: 'Snake',
  displayName: 'Classic Snake',
  // ... existing config
};
```

**Step 2.2:** Wrap Snake (side-by-side with old version)

```typescript
// New way (doesn't replace old way yet)
export function SnakeGamePage() {
  return (
    <GameWrapper
      metadata={snakeMetadata}
      gameComponent={SnakeGame}  // Existing component!
    />
  );
}
```

**Step 2.3:** Test both versions work identically

- Old Game.tsx + SnakeGame still works
- New GameWrapper + SnakeGame also works
- If new way works, remove old way

### Phase 3: Add New Games Using Same Pattern

**Step 3.1:** Implement Pong game logic (just the game, like useSnakeGame)

```typescript
// Same structure as useSnakeGame
export function usePongGame(difficulty) {
  // Game logic only, no payment stuff
  return {
    state,
    canvasRef,
    restart,
    sessionId, // passed in from wrapper
  };
}
```

**Step 3.2:** Wrap Pong

```typescript
export function PongGamePage() {
  return (
    <GameWrapper
      metadata={pongMetadata}
      gameComponent={PongGame}  // New component using usePongGame
    />
  );
}
```

---

## Key Differences from Original Plan

### Original Plan (Risky)

- ❌ Create entirely new hooks from scratch
- ❌ Might break Snake's working payment flow
- ❌ Have to reimplement x402 integration
- ❌ Higher chance of bugs

### Revised Plan (Safe)

- ✅ Extract Snake's working patterns
- ✅ Keep Snake working while we build
- ✅ Reuse existing useX402, useWallet, useScoreSubmission
- ✅ Lower risk, faster implementation

---

## Implementation Order (Revised)

### Phase 1: Foundation ✅ COMPLETE

- [x] Task 1.1: Type definitions ✅
- [x] Task 1.2: Create `useGameSession` that wraps Game.tsx pattern ✅
- [x] Task 1.3: Create `GameWrapper` component ✅
- [x] Task 1.4: Create `PaymentGate` component (extracted from Game.tsx) ✅
- [x] Task 1.5: Create component index file ✅

**Note:** GameLayout component was merged into GameWrapper for simplicity

### Phase 2: Verify with Snake (Complete - Ready for Testing)

- [x] Task 2.1: Create snake metadata ✅
- [x] Task 2.2: Create SnakeGameAdapter and SnakeGamePage ✅
- [ ] Task 2.3: Test in browser (NEXT - needs route added)
- [ ] Task 2.4: Compare with original Snake implementation
- [ ] Task 2.5: Switch to new version when verified
- [ ] Task 2.6: Add LeaderboardWidget to GameWrapper (future enhancement)

### Phase 3: Add Pong (Next Week)

- [ ] Task 3.1: Implement usePongGame (game logic only)
- [ ] Task 3.2: Create PongGame component
- [ ] Task 3.3: Create pongMetadata
- [ ] Task 3.4: Create PongGamePage with GameWrapper
- [ ] Task 3.5: Test payment flow, scoring, leaderboard

### Phase 4: Add Tetris & Breakout (Next Week)

- Same pattern as Pong

---

## Files to Create (Revised)

### Keep These (Already Done)

- ✅ `/games/types/*` - All type definitions
- ✅ `/games/hooks/useGameSession.ts` - Wraps Game.tsx payment pattern

### Create These (Extract from Snake)

- `/games/components/GameWrapper.tsx` - Main wrapper component
- `/games/components/PaymentGate.tsx` - Payment UI (from Game.tsx)
- `/games/components/GameLayout.tsx` - Game page layout
- `/games/components/LeaderboardWidget.tsx` - Floating leaderboard

### Snake Refactor

- `/games/snake/metadata.ts` - Snake game metadata
- `/pages/Game/SnakeGamePage.tsx` - New Snake page using wrapper

### New Games

- `/games/pong/usePongGame.ts` - Pong game logic
- `/games/pong/PongGame.tsx` - Pong component
- `/games/pong/metadata.ts` - Pong metadata
- `/pages/Game/PongGamePage.tsx` - Pong page

---

## Benefits of This Approach

1. **Lower Risk** - We're not breaking what works
2. **Faster** - Reuse existing working code
3. **Validated** - Snake already proves the pattern works
4. **Incremental** - Can test each step
5. **Rollback** - Can always go back to old Snake if needed

---

## Next Immediate Steps

1. Update `IMPLEMENTATION_PROGRESS.md` with this revised approach
2. Create `useGameSession` hook that extracts Game.tsx patterns
3. Create `GameWrapper` component
4. Test with Snake

Ready to proceed with this safer approach? 🚀
