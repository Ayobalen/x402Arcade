# x402Arcade UX Improvements & Project Moat

**Created:** 2026-01-26
**Status:** Action Items Identified

---

## 🎯 PROJECT MOAT (Question #3)

### What Makes x402 Essential for This Arcade?

**NOT:** "Only x402 can do micropayments" (that's false - traditional blockchain can)

**YES:** "Only x402 makes $0.01 games economically viable and instant"

### The Math

| Payment Method             | Cost Per Game                                  | Settlement Time | User Experience               |
| -------------------------- | ---------------------------------------------- | --------------- | ----------------------------- |
| **Traditional Blockchain** | $0.01 game + $0.50-$2.00 gas = **$0.51-$2.01** | 5-30 seconds    | "Waiting for confirmation..." |
| **x402 Protocol**          | $0.01 game + $0.00 gas = **$0.01**             | <1 second       | Instant gameplay              |

### Why Arcade is the Perfect Use Case

1. **Micropayments at Scale**
   - $0.01-$0.02 per game is the sweet spot
   - Traditional gas fees make this impossible
   - 50x-200x cost reduction with x402

2. **Instant Gratification**
   - Players expect instant gameplay after payment
   - No "waiting for block confirmation" screens
   - HTTP 402 flow feels like native payment UX

3. **No Pre-funding Friction**
   - Don't need to deposit/stake USDC first
   - Pay exactly what you play
   - Lower commitment barrier for new users

4. **Repeatable Transactions**
   - Players make 10-100 payments per session
   - Wallet approval once (EIP-3009 signature)
   - Subsequent plays are seamless

### Our Differentiation for Hackathon Judges

**Technical Depth:**

- Custom implementation (not using Coinbase SDK)
- Direct Cronos Facilitator integration
- Full EIP-3009 signature flow
- Shows deep understanding of HTTP 402 protocol

**Perfect Product-Market Fit:**

- Arcade gaming is impossible without x402 at these price points
- Demonstrates clear before/after value prop
- Solves real UX problem (instant payment = instant play)

---

## 🐛 ISSUE #1: Balance Not Refreshing After Payment

### Current Behavior

- Player pays $0.01 USDC
- Payment settles on-chain successfully
- Navbar still shows old balance (not updated)

### Root Cause

The `useBalance` hook in the navbar doesn't know when a payment completes. It only fetches on mount/address change.

### Solution: Event-Driven Balance Refresh

**Step 1:** Create payment success event emitter

**File:** `/packages/frontend/src/lib/events.ts` (NEW)

```typescript
// Simple event emitter for app-wide events
type EventCallback = (data?: any) => void;

class EventBus {
  private events: Map<string, Set<EventCallback>> = new Map();

  on(event: string, callback: EventCallback) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);
  }

  off(event: string, callback: EventCallback) {
    this.events.get(event)?.delete(callback);
  }

  emit(event: string, data?: any) {
    this.events.get(event)?.forEach((callback) => callback(data));
  }
}

export const eventBus = new EventBus();

// Event names
export const EVENTS = {
  PAYMENT_SUCCESS: 'payment:success',
  PAYMENT_FAILED: 'payment:failed',
  SESSION_CREATED: 'session:created',
  GAME_COMPLETED: 'game:completed',
};
```

**Step 2:** Emit event after successful payment

**File:** `/packages/frontend/src/pages/Game/Game.tsx`

```typescript
import { eventBus, EVENTS } from '@/lib/events';

// After successful payment settlement (around line 180-200)
const response = await fetch(`${API_URL}/api/v1/play/${gameId}`, {
  method: 'POST',
  headers: {
    'X-Payment': paymentHeader,
    'Content-Type': 'application/json',
  },
});

if (response.ok) {
  // Emit event so other components can react
  eventBus.emit(EVENTS.PAYMENT_SUCCESS, {
    gameId,
    amount: requirements.amount,
  });

  // Continue with existing logic...
}
```

**Step 3:** Listen for events in balance hook

**File:** `/packages/frontend/src/components/wallet/Balance/useBalance.ts`

```typescript
import { eventBus, EVENTS } from '@/lib/events';

export function useBalance(address?: string, tokenAddress: string = USDC_ADDRESS) {
  // ... existing state ...

  // Listen for payment events and auto-refresh
  useEffect(() => {
    const handlePaymentSuccess = () => {
      console.log('Payment detected, refreshing balance...');
      fetchBalance();
    };

    eventBus.on(EVENTS.PAYMENT_SUCCESS, handlePaymentSuccess);

    return () => {
      eventBus.off(EVENTS.PAYMENT_SUCCESS, handlePaymentSuccess);
    };
  }, [fetchBalance]);

  // ... rest of hook ...
}
```

**Alternative (Simpler):** Poll-based refresh

```typescript
// In useBalance hook - add polling after address is set
useEffect(() => {
  if (!address) return;

  // Refresh every 10 seconds
  const interval = setInterval(() => {
    fetchBalance();
  }, 10000);

  return () => clearInterval(interval);
}, [address, fetchBalance]);
```

---

## 🔄 ISSUE #2: Session Restoration on Page Reload

### Current Behavior

- Player pays $0.01
- Game starts
- Player refreshes page
- Session lost - forced to pay again!

### Root Cause

Session ID is stored in memory only (React state), not persisted.

### Solution: Session Persistence

**Step 1:** Store session ID in localStorage after payment

**File:** `/packages/frontend/src/pages/Game/Game.tsx`

```typescript
// After successful payment response
const data = await response.json();
const sessionId = data.sessionId;

if (sessionId) {
  // Persist session to localStorage
  localStorage.setItem(`game_session_${gameId}`, sessionId);
  localStorage.setItem(`game_session_${gameId}_timestamp`, Date.now().toString());

  setGameState('playing');
  setSessionId(sessionId);
}
```

**Step 2:** Check for existing session on mount

```typescript
// In Game.tsx useEffect on mount
useEffect(() => {
  if (!gameId || gameState !== 'waiting') return;

  // Check for existing session
  const storedSessionId = localStorage.getItem(`game_session_${gameId}`);
  const storedTimestamp = localStorage.getItem(`game_session_${gameId}_timestamp`);

  if (storedSessionId && storedTimestamp) {
    const sessionAge = Date.now() - parseInt(storedTimestamp);
    const THIRTY_MINUTES = 30 * 60 * 1000;

    // If session is less than 30 minutes old, restore it
    if (sessionAge < THIRTY_MINUTES) {
      console.log('Restoring existing session:', storedSessionId);
      setSessionId(storedSessionId);
      setGameState('playing');
      return;
    } else {
      // Session expired, clean up
      localStorage.removeItem(`game_session_${gameId}`);
      localStorage.removeItem(`game_session_${gameId}_timestamp`);
    }
  }
}, [gameId, gameState]);
```

**Step 3:** Clear session after game completion

```typescript
// When game ends (score submitted)
const handleGameComplete = async (score: number) => {
  // ... submit score logic ...

  // Clear stored session
  localStorage.removeItem(`game_session_${gameId}`);
  localStorage.removeItem(`game_session_${gameId}_timestamp`);

  setGameState('completed');
};
```

**Alternative: Backend Session Validation**

Add endpoint to check if player has active session:

```typescript
// GET /api/v1/play/:gameId/active-session
// Returns: { sessionId, createdAt } or null

// Frontend checks on mount before showing "Pay & Play"
```

---

## 🔁 ISSUE #3: Replay Without Repayment

### Current Behavior

- Player completes game
- Wants to play again
- Must pay $0.01 again for each replay

### Question: Intended UX?

**Option A: Free Replays (Time-Based)**

- One payment = 30 minutes of unlimited plays
- Session expires after 30min of inactivity
- Better UX, encourages engagement

**Option B: Pay Per Play (Current)**

- Each game costs $0.01
- More revenue, simpler logic
- Matches "insert coin" arcade vibe

### Recommendation: Option A (Free Replays)

**Why:**

- Better player retention
- Encourages high score chasing
- Still micropayments ($0.01 per session)
- Aligns with arcade session model

**Implementation for Free Replays:**

**Step 1:** Backend already supports 30min sessions (see `/packages/backend/src/services/game.ts`)

**Step 2:** Frontend checks for active session before payment

**File:** `/packages/frontend/src/pages/Game/Game.tsx`

```typescript
// Check for active session on mount
useEffect(() => {
  const checkActiveSession = async () => {
    if (!wallet.address || !gameId) return;

    try {
      const response = await fetch(
        `${API_URL}/api/v1/sessions/active/${gameId}?playerAddress=${wallet.address}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.sessionId) {
          // Player has active session - skip payment
          console.log('Active session found, skipping payment');
          setSessionId(data.sessionId);
          setGameState('playing');
          return;
        }
      }
    } catch (error) {
      console.error('Failed to check active session:', error);
    }

    // No active session - show payment button
    setGameState('waiting');
  };

  checkActiveSession();
}, [wallet.address, gameId]);
```

**Step 3:** Add "Play Again" button that reuses session

```typescript
// After game completion
const renderGameComplete = () => (
  <div>
    <h2>Game Over!</h2>
    <p>Final Score: {finalScore}</p>

    <button onClick={handlePlayAgain}>
      🔄 Play Again (Free)
    </button>

    <p className="text-xs text-gray-500">
      Session expires in {timeRemaining} minutes
    </p>
  </div>
);

const handlePlayAgain = () => {
  // Reset game without new payment
  setGameState('playing');
  // Game component will use existing sessionId
};
```

**Step 4:** Backend endpoint for active session check

**File:** `/packages/backend/src/routes/play.routes.ts` (NEW)

```typescript
router.get('/sessions/active/:gameType', (req, res) => {
  const { gameType } = req.params;
  const { playerAddress } = req.query;

  if (!playerAddress) {
    return res.status(400).json({ error: 'playerAddress required' });
  }

  const gameService = new GameService(getDatabase());
  const activeSession = gameService.getActiveSession(playerAddress as string, gameType as GameType);

  if (activeSession) {
    return res.json({
      sessionId: activeSession.id,
      expiresAt: new Date(
        new Date(activeSession.createdAt).getTime() + 30 * 60 * 1000
      ).toISOString(),
    });
  }

  return res.status(404).json({ error: 'No active session' });
});
```

---

## ✅ Implementation Priority

1. **ISSUE #2 (Session Restoration)** - CRITICAL
   - Players losing paid sessions is a blocker
   - Simple fix with localStorage
   - **DO THIS FIRST**

2. **ISSUE #3 (Replay Logic)** - HIGH
   - Decide on UX model (free replays vs pay-per-play)
   - Implement active session check
   - **DO THIS SECOND**

3. **ISSUE #1 (Balance Refresh)** - MEDIUM
   - Not blocking gameplay
   - Event emitter or polling both work
   - **DO THIS THIRD** (polish)

---

## 📊 Project Moat Summary (For Pitch)

### Elevator Pitch

> "Traditional blockchain makes $0.01 games impossible - gas fees cost 50-200x more than the game itself. x402 eliminates gas fees entirely, enabling instant micropayments that feel like native payment UX. This is the first economically viable Web3 arcade."

### Key Metrics to Highlight

- ✅ **$0.01 games** (impossible with traditional gas)
- ✅ **<1 second** payment settlement (vs 5-30s blockchain confirmation)
- ✅ **Zero gas fees** for players (facilitator covers)
- ✅ **Custom implementation** (not using Coinbase SDK - shows technical depth)
- ✅ **EIP-3009 signatures** (gasless token approvals)
- ✅ **HTTP 402 protocol** (cleaner UX than wallet popups)

### What Judges Should See in Demo

1. Show MetaMask wallet with ~$1.00 USDC
2. Play 10 games in 60 seconds ($0.10 total)
3. Highlight instant payment (no "waiting" screens)
4. Check transaction on block explorer (all settled)
5. Compare: "On Ethereum, this would cost $5-$20 in gas"

---

**Next Steps:** Implement fixes in priority order above.
