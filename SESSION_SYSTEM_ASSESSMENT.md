# x402Arcade Game Session System Assessment

**Date**: 2026-01-27
**Status**: Critical gaps identified - User experience impact HIGH

---

## Executive Summary

The x402Arcade game session system has a **15-minute session timeout** that is **not visible to users**. This creates a poor user experience where players don't know when their paid session will expire.

### Critical Issues
1. ❌ No session timer displayed to users
2. ❌ No warning before session expires
3. ❌ Users don't know when they need to pay again
4. ❌ After 15 minutes, score submission fails silently

---

## System Architecture

### Payment → Session → Gameplay Flow

```
1. User pays $0.01 USDC
   ↓
2. Backend creates session (status: 'active')
   - sessionId: UUID
   - createdAt: timestamp
   - status: 'active'
   ↓
3. Frontend receives sessionId
   ↓
4. User plays game (up to 15 minutes)
   ↓
5. Game ends → Frontend submits score with sessionId
   ↓
6. Backend validates session:
   - ✅ If < 15 min: Accept score, mark session 'completed'
   - ❌ If > 15 min: Reject score, mark session 'expired'
```

### Session Lifecycle States

| State | Description | Can Submit Score? | Needs Payment? |
|-------|-------------|-------------------|----------------|
| `active` | Session created, game in progress | ✅ Yes (if < 15 min) | ❌ No |
| `completed` | Score submitted successfully | ❌ No | ✅ Yes (for new game) |
| `expired` | 15 minutes elapsed without completion | ❌ No | ✅ Yes (for new game) |

---

## Technical Implementation Details

### Session Timeout Configuration

**File**: `/Users/mujeeb/projects/x402Arcade/packages/backend/src/services/game-redis.ts:15`

```typescript
export const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
```

### Expiration Check Logic

**File**: `/Users/mujeeb/projects/x402Arcade/packages/backend/src/services/game-redis.ts:115-132`

```typescript
async getActiveSession(playerAddress: string, gameType: GameType): Promise<GameSession | null> {
  // ... fetch session ...

  // Check if stale
  const age = Date.now() - new Date(session.createdAt).getTime();
  if (age > SESSION_TIMEOUT_MS) {
    await this.expireSession(sessionId);
    return null; // ← Session expired, user must pay again
  }
  return session;
}
```

**Key Point**: Session expiration is checked when:
- User tries to start a new game (checks for active session)
- Backend processes score submission (validates session is still active)

### Payment Requirements

**File**: `/Users/mujeeb/projects/x402Arcade/packages/backend/src/routes/play.routes.ts:45-52`

```typescript
const GAME_PRICES: Record<string, bigint> = {
  snake: parseUSDC(0.01), // $0.01 USDC
  tetris: parseUSDC(0.02), // $0.02 USDC
  // ...
};
```

**Payment Model**: **One payment per game session**
- Each payment creates ONE session
- Session lasts 15 minutes OR until score submitted
- To play again: User must pay again (no unlimited plays)

### Score Submission Validation

**File**: `/Users/mujeeb/projects/x402Arcade/packages/backend/src/routes/score.routes.ts:79-88`

```typescript
// Fetch session to validate it exists and is active
const existingSession = await gameService.getSession(sessionId);
if (!existingSession) {
  res.status(404).json({
    error: 'Not found',
    message: `Session not found: ${sessionId}`,
  });
  return;
}
```

**File**: `/Users/mujeeb/projects/x402Arcade/packages/backend/src/services/game-redis.ts:79-87`

```typescript
async completeSession(id: string, score: number): Promise<GameSession> {
  const session = await this.getSession(id);
  if (!session) {
    throw new Error(`Session not found: ${id}`);
  }
  if (session.status !== 'active') {
    throw new Error(`Cannot complete session with status: ${session.status}`);
  }
  // ... complete session ...
}
```

---

## User Experience Gaps

### Current Frontend State

**Files Checked**:
- `/Users/mujeeb/projects/x402Arcade/packages/frontend/src/pages/Game/Game.tsx`
- `/Users/mujeeb/projects/x402Arcade/packages/frontend/src/games/snake/SnakeGame.tsx`
- `/Users/mujeeb/projects/x402Arcade/packages/frontend/src/games/snake/useSnakeGame.ts`

**What's Missing**:
1. ❌ No countdown timer showing time remaining
2. ❌ No session expiration display (e.g., "Expires in 12:34")
3. ❌ No warning when time is running low (< 2 minutes)
4. ❌ No messaging about what happens when session expires
5. ❌ No clear indication that user needs to pay again

### Current Score Submission Behavior

**File**: `/Users/mujeeb/projects/x402Arcade/packages/frontend/src/games/snake/SnakeGame.tsx:86-110`

```typescript
// When game ends, submit score
submitScore(sessionId, state.score)
  .then((result) => {
    if (onScoreSubmitted) {
      onScoreSubmitted(!!result, result ? undefined : scoreError?.message);
    }
  })
  .catch((error) => {
    console.error('Score submission failed:', error);
    if (onScoreSubmitted) {
      onScoreSubmitted(false, error?.message || 'Failed to submit score');
    }
  });
```

**Issue**: If session expired, error is caught but user doesn't understand WHY it failed.

---

## Recommendations

### 1. Session Timer UI Component

Create a visible countdown timer that shows:
- Time remaining until session expires
- Warning state when < 2 minutes remain
- Expired state with "Pay to play again" message

**Suggested Location**: Top-right corner of game canvas

**Design**:
```
┌─────────────────────────┐
│ ⏱️  12:34 remaining     │  ← Normal state (green)
│ ⚠️  1:23 remaining      │  ← Warning state (yellow)
│ ❌  Session expired     │  ← Expired state (red)
└─────────────────────────┘
```

### 2. Session Expiration Handling

When session expires during gameplay:
- Pause the game automatically
- Show modal: "Your session has expired. Pay $0.01 to save your score and continue playing."
- Options:
  - "Pay & Continue" → Create new payment, resume game
  - "End Game" → Don't save score, return to menu

### 3. Score Submission Error Messages

Improve error handling to distinguish:
- Session expired → "Your 15-minute session expired. Pay $0.01 to play again."
- Session already completed → "This session was already completed."
- Network error → "Failed to connect to server. Try again."

### 4. Pre-Game Information

On payment screen, clearly communicate:
- "Pay $0.01 for 15 minutes of gameplay"
- "Complete your game within 15 minutes to save your score"

---

## Implementation Plan

### Phase 1: Backend (Already Complete ✅)
- ✅ Session timeout configured (15 minutes)
- ✅ Expiration checks in place
- ✅ Score submission validates session status
- ✅ API returns proper error codes

### Phase 2: Frontend Timer Display (PRIORITY)
1. Create `SessionTimer` component
   - Accept `sessionId` and `createdAt` props
   - Calculate time remaining from `createdAt + 15 minutes`
   - Update every second
   - Show warning when < 2 minutes
   - Emit event when expired

2. Integrate into Game page
   - Display timer prominently
   - Handle expiration event (pause game, show modal)

3. Add session info to payment confirmation
   - Show "15 minutes" duration clearly
   - Set user expectations upfront

### Phase 3: Error Messaging Improvements
1. Update score submission error handling
   - Parse specific error codes from backend
   - Show user-friendly messages
   - Provide clear "Pay Again" CTA

2. Add session validation before game over
   - Check if session will be valid when submitting score
   - Warn user if close to expiration

### Phase 4: Grace Period (Optional Enhancement)
Consider adding a 30-second grace period:
- If session expired < 30 seconds ago, still accept score
- Prevents frustration from "just missed it" scenarios

---

## Key Files to Modify

### Frontend Changes Needed

1. **New Component**: `packages/frontend/src/components/SessionTimer.tsx`
   - Display countdown timer
   - Warning states
   - Expiration handling

2. **Update**: `packages/frontend/src/pages/Game/Game.tsx`
   - Pass session createdAt timestamp
   - Integrate SessionTimer component
   - Handle expiration events

3. **Update**: `packages/frontend/src/games/snake/SnakeGame.tsx`
   - Accept session expiration callback
   - Pause game when session expires
   - Better error messaging

4. **Update**: `packages/frontend/src/components/PaymentModal.tsx` (if exists)
   - Show session duration clearly
   - Set expectations: "15 minutes of gameplay"

### Backend Changes (None Required)
- Current implementation is solid
- Session timeout is working correctly
- Error handling is appropriate

---

## Testing Checklist

### Manual Testing
- [ ] Timer displays correctly when game starts
- [ ] Countdown updates every second
- [ ] Warning appears at 2 minutes remaining
- [ ] Game pauses when session expires
- [ ] Score submission fails gracefully after expiration
- [ ] Error message is clear and actionable
- [ ] Payment flow shows session duration

### Edge Cases
- [ ] Browser tab backgrounded (timer still counts)
- [ ] Page refresh during game (recover session state)
- [ ] Network interruption (graceful degradation)
- [ ] Multiple tabs with same session (prevent conflicts)

---

## Metrics to Track

After implementation, monitor:
1. **Session completion rate**: % of paid sessions that submit scores
2. **Average session duration**: How long users play before completing
3. **Expiration rate**: % of sessions that expire without completion
4. **Re-purchase rate**: % of users who pay again after session expires

**Goal**: < 5% session expiration rate (most users complete within 15 minutes)

---

## Conclusion

The session system backend is **working correctly**, but the **frontend lacks critical user-facing elements** to communicate session lifecycle. Implementing a visible countdown timer and clear expiration messaging will dramatically improve UX and reduce user frustration.

**Estimated Implementation Time**: 2-3 hours
**User Impact**: HIGH - Prevents confusion and failed score submissions
**Priority**: CRITICAL
