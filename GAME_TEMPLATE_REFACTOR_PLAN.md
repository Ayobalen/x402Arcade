# Game Template Architecture Refactor Plan

## Executive Summary

Currently, only Snake game has full implementation (payment flow, game logic, UI). To avoid code duplication across games (Pong, Tetris, Breakout, Space Invaders), we need to extract common functionality into a reusable game template system.

## Problem Statement

**Current Issues:**

- Payment flow must be reimplemented for each game
- Game entry/initialization duplicated
- UI components (score, controls, game over) duplicated
- Session management repeated
- Leaderboard integration duplicated
- No in-game leaderboard visibility

**Goal:**
Create a game template architecture where:

- Common functionality is implemented once
- Each game only implements game-specific logic
- 80% code reuse across games
- In-game leaderboard widget available to all games

---

## Architecture Design

### 1. Core Abstractions

#### 1.1 Game Contract (Interface)

Every game must implement this interface:

```typescript
interface IGame {
  // Initialization
  initialize(canvas: HTMLCanvasElement, difficulty: GameDifficulty): void;

  // Game loop
  start(): void;
  pause(): void;
  resume(): void;
  reset(): void;

  // Input handling
  handleInput(key: string, action: 'down' | 'up'): void;

  // State
  getCurrentScore(): number;
  getGameState(): 'idle' | 'playing' | 'paused' | 'over';
  getLevel(): number;

  // Lifecycle hooks
  onScoreChange?: (score: number) => void;
  onGameOver?: (finalScore: number) => void;
  onLevelUp?: (level: number) => void;

  // Cleanup
  destroy(): void;
}
```

#### 1.2 Game Metadata

```typescript
interface GameMetadata {
  id: GameId;
  name: string;
  description: string;
  icon: string;
  controls: {
    primary: string[];
    secondary?: string[];
    pause: string;
  };
  difficulty: {
    default: GameDifficulty;
    available: GameDifficulty[];
  };
  pricing: {
    baseCost: number; // in USDC (e.g., 0.01)
  };
}
```

---

### 2. Shared Components

#### 2.1 GameTemplate Component (HOC)

**Purpose:** Wraps any game and provides all common functionality

**Responsibilities:**

- Payment flow integration
- Session management
- Score tracking
- Leaderboard updates
- Common UI (HUD, controls help, game over screen)
- In-game leaderboard widget
- Audio management

**Structure:**

```typescript
interface GameTemplateProps {
  game: GameMetadata;
  gameFactory: (canvas: HTMLCanvasElement) => IGame;
  children?: React.ReactNode;
}

export function GameTemplate({ game, gameFactory }: GameTemplateProps) {
  // Uses all shared hooks and components
  return (
    <GameSessionProvider>
      <GamePaymentGate>
        <GameLayout>
          <GameHUD />
          <GameCanvas gameFactory={gameFactory} />
          <GameControls />
          <LeaderboardWidget />
          <GameOverModal />
        </GameLayout>
      </GamePaymentGate>
    </GameSessionProvider>
  );
}
```

#### 2.2 Component Breakdown

**GameSessionProvider** (Context)

- Manages game session state
- Handles payment flow
- Tracks score, level, difficulty
- Submits high scores

**GamePaymentGate** (Component)

- Checks wallet connection
- Shows balance
- Handles payment UI
- Manages x402 flow
- Only renders children after successful payment

**GameLayout** (Component)

- Common game page layout
- Responsive container
- Background effects
- Navigation

**GameHUD** (Component)

- Score display
- Level indicator
- Lives/health (if applicable)
- Pause button
- Difficulty badge

**GameCanvas** (Component)

- Canvas element wrapper
- Handles resize
- Manages game instance lifecycle
- Connects game callbacks to session

**GameControls** (Component)

- Keyboard controls help
- Visual keyboard indicators
- Touch controls (mobile)

**LeaderboardWidget** (Component) ⭐ NEW

- Floating/draggable overlay
- Shows top 10 scores in real-time
- Minimize/maximize
- Highlights user's position
- Auto-updates every 10 seconds

**GameOverModal** (Component)

- Shows final score
- High score celebration
- Play again button
- Share score
- View full leaderboard link

---

### 3. Shared Hooks

#### 3.1 useGameSession

```typescript
interface GameSessionHook {
  // State
  gameState: 'idle' | 'playing' | 'paused' | 'over';
  score: number;
  level: number;
  difficulty: GameDifficulty;

  // Payment
  paymentStatus: 'pending' | 'processing' | 'paid' | 'failed';
  handlePayment: () => Promise<void>;

  // Game control
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: (finalScore: number) => void;

  // Score management
  updateScore: (score: number) => void;
  submitHighScore: (score: number) => Promise<void>;
}

function useGameSession(gameId: GameId): GameSessionHook;
```

#### 3.2 useGamePayment

```typescript
interface GamePaymentHook {
  status: PaymentStatus;
  error: Error | null;
  initiatePayment: (amount: number) => Promise<void>;
  checkPaymentStatus: () => Promise<PaymentStatus>;
}

function useGamePayment(gameId: GameId): GamePaymentHook;
```

#### 3.3 useGameLeaderboard

```typescript
interface GameLeaderboardHook {
  topScores: LeaderboardEntry[];
  userRank: number | null;
  userHighScore: number | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

function useGameLeaderboard(gameId: GameId): GameLeaderboardHook;
```

#### 3.4 useGameAudio

```typescript
interface GameAudioHook {
  playSound: (sound: GameSound) => void;
  playMusic: (track: string) => void;
  stopMusic: () => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unmute: () => void;
}

function useGameAudio(): GameAudioHook;
```

---

### 4. Game-Specific Implementation

Each game only needs to implement:

**Example: Pong**

```typescript
// 1. Game class implementing IGame
class PongGame implements IGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private ball: Ball;
  private paddle: Paddle;
  private ai: AIPaddle;
  // ... game-specific state

  initialize(canvas, difficulty) { /* ... */ }
  start() { /* ... */ }
  handleInput(key, action) { /* ... */ }
  // ... implement all IGame methods
}

// 2. Game metadata
export const pongMetadata: GameMetadata = {
  id: 'pong',
  name: 'Pong',
  description: 'Classic arcade pong',
  icon: '🏓',
  controls: {
    primary: ['ArrowUp', 'ArrowDown'],
    pause: 'Space'
  },
  difficulty: {
    default: 'normal',
    available: ['easy', 'normal', 'hard']
  },
  pricing: {
    baseCost: 0.01
  }
};

// 3. Game page component
export function PongGamePage() {
  return (
    <GameTemplate
      game={pongMetadata}
      gameFactory={(canvas) => new PongGame(canvas)}
    />
  );
}
```

**That's it!** No payment flow, no session management, no UI duplication.

---

### 5. In-Game Leaderboard Widget

#### 5.1 Features

- Floating overlay (draggable)
- Shows top 10 scores
- Highlights current user
- Real-time updates (10s interval)
- Minimize/maximize toggle
- Glassmorphism design
- Non-intrusive positioning

#### 5.2 Component Structure

```typescript
interface LeaderboardWidgetProps {
  gameId: GameId;
  currentScore: number;
  isMinimized?: boolean;
}

export function LeaderboardWidget({
  gameId,
  currentScore,
  isMinimized = false
}: LeaderboardWidgetProps) {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [minimized, setMinimized] = useState(isMinimized);
  const { topScores, userRank, refresh } = useGameLeaderboard(gameId);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <DraggableWidget position={position} onMove={setPosition}>
      {minimized ? (
        <MinimizedView onClick={() => setMinimized(false)} />
      ) : (
        <ExpandedView
          scores={topScores}
          currentScore={currentScore}
          userRank={userRank}
          onMinimize={() => setMinimized(true)}
        />
      )}
    </DraggableWidget>
  );
}
```

#### 5.3 UI Design

```
┌─────────────────────────────┐
│ 🏆 Live Leaderboard      [─]│
├─────────────────────────────┤
│ #1  0xabc...def    1,234    │
│ #2  0x123...456      987    │
│ #3  0xfed...cba      876 ⭐ │ ← You
│ #4  0x789...012      765    │
│ #5  0xghi...jkl      654    │
│                             │
│ Your Score: 876  Rank: #3   │
└─────────────────────────────┘
```

When minimized:

```
┌──────────┐
│ 🏆  #3   │
└──────────┘
```

---

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1)

**Tasks:**

1. Create `IGame` interface and type definitions
2. Create `GameMetadata` type
3. Build `useGameSession` hook
4. Build `useGamePayment` hook
5. Build `useGameLeaderboard` hook
6. Create `GameSessionProvider` context

**Files to create:**

- `packages/frontend/src/games/types/IGame.ts`
- `packages/frontend/src/games/types/GameMetadata.ts`
- `packages/frontend/src/games/hooks/useGameSession.ts`
- `packages/frontend/src/games/hooks/useGamePayment.ts`
- `packages/frontend/src/games/hooks/useGameLeaderboard.ts`
- `packages/frontend/src/games/contexts/GameSessionContext.tsx`

### Phase 2: Shared Components (Week 1-2)

**Tasks:**

1. Create `GameTemplate` HOC
2. Build `GamePaymentGate` component
3. Build `GameLayout` component
4. Build `GameHUD` component
5. Build `GameCanvas` component
6. Build `GameControls` component
7. Build `GameOverModal` component

**Files to create:**

- `packages/frontend/src/games/components/GameTemplate/`
- `packages/frontend/src/games/components/GamePaymentGate/`
- `packages/frontend/src/games/components/GameLayout/`
- `packages/frontend/src/games/components/GameHUD/`
- `packages/frontend/src/games/components/GameCanvas/`
- `packages/frontend/src/games/components/GameControls/`
- `packages/frontend/src/games/components/GameOverModal/`

### Phase 3: Leaderboard Widget (Week 2)

**Tasks:**

1. Create `LeaderboardWidget` component
2. Build `DraggableWidget` wrapper
3. Add minimize/maximize functionality
4. Implement real-time updates
5. Add user highlighting
6. Style with glassmorphism

**Files to create:**

- `packages/frontend/src/games/components/LeaderboardWidget/`
- `packages/frontend/src/games/components/DraggableWidget/`

### Phase 4: Refactor Snake (Week 2)

**Tasks:**

1. Extract Snake game logic into `SnakeGame` class implementing `IGame`
2. Create `snakeMetadata`
3. Update Snake page to use `GameTemplate`
4. Test payment flow
5. Test session management
6. Test leaderboard integration

**Files to modify:**

- `packages/frontend/src/games/snake/`

### Phase 5: Implement Other Games (Week 3-4)

**For each game (Pong, Tetris, Breakout):**

1. Create game class implementing `IGame`
2. Create game metadata
3. Create game page using `GameTemplate`
4. Test with payment flow

**Files to create:**

- `packages/frontend/src/games/pong/PongGame.ts`
- `packages/frontend/src/games/pong/metadata.ts`
- `packages/frontend/src/games/pong/PongGamePage.tsx`
- (Same structure for Tetris, Breakout)

---

## Directory Structure

```
packages/frontend/src/games/
├── types/
│   ├── IGame.ts                    # Game interface contract
│   ├── GameMetadata.ts             # Game metadata type
│   └── GameTypes.ts                # Common types (GameDifficulty, GameState, etc.)
│
├── hooks/
│   ├── useGameSession.ts           # Session management hook
│   ├── useGamePayment.ts           # Payment flow hook
│   ├── useGameLeaderboard.ts       # Leaderboard hook
│   └── useGameAudio.ts             # Audio hook
│
├── contexts/
│   └── GameSessionContext.tsx      # Game session context provider
│
├── components/
│   ├── GameTemplate/               # Main template HOC
│   │   ├── GameTemplate.tsx
│   │   └── GameTemplate.types.ts
│   ├── GamePaymentGate/            # Payment gate component
│   ├── GameLayout/                 # Common layout
│   ├── GameHUD/                    # Heads-up display
│   ├── GameCanvas/                 # Canvas wrapper
│   ├── GameControls/               # Controls help
│   ├── GameOverModal/              # Game over screen
│   ├── LeaderboardWidget/          # In-game leaderboard
│   └── DraggableWidget/            # Draggable wrapper
│
├── snake/                          # Snake game (refactored)
│   ├── SnakeGame.ts                # Game class implementing IGame
│   ├── metadata.ts                 # Snake metadata
│   └── SnakeGamePage.tsx           # Page using GameTemplate
│
├── pong/                           # Pong game
│   ├── PongGame.ts
│   ├── metadata.ts
│   └── PongGamePage.tsx
│
├── tetris/                         # Tetris game
│   ├── TetrisGame.ts
│   ├── metadata.ts
│   └── TetrisGamePage.tsx
│
└── utils/
    ├── gameFactory.ts              # Game instance factory
    └── constants.ts                # Shared constants
```

---

## Benefits

### 1. Code Reuse

- **80% reduction** in duplicate code
- Payment flow: 1 implementation → 5 games
- Session management: 1 implementation → 5 games
- UI components: 1 implementation → 5 games

### 2. Consistency

- All games have identical UX
- Same payment flow
- Same leaderboard integration
- Same controls system

### 3. Maintainability

- Fix a bug once, fixed for all games
- Update payment flow once
- Improve UI once

### 4. Velocity

- New games in **1-2 days** instead of 1-2 weeks
- Focus only on game logic
- No boilerplate

### 5. Testing

- Test common components once
- Comprehensive test coverage
- Easier to mock

---

## Success Metrics

1. **Snake refactor complete** - Verify no functionality lost
2. **Pong implementation** - Complete game in <2 days using template
3. **Code duplication** - <20% duplicate code across games
4. **Payment flow** - 100% success rate across all games
5. **Leaderboard widget** - Live updates working in all games

---

## Risk Mitigation

### Risk 1: Snake refactor breaks existing functionality

**Mitigation:**

- Comprehensive testing before refactor
- Feature flag for old vs new implementation
- Gradual rollout

### Risk 2: Game interface too rigid

**Mitigation:**

- Allow escape hatches for game-specific needs
- Extension points in template
- Optional features in IGame

### Risk 3: Performance overhead from abstractions

**Mitigation:**

- Benchmark before/after
- Optimize hot paths
- Use React.memo where needed

---

## Next Steps

1. **Review this plan** - Get stakeholder approval
2. **Create tickets** - Break down into implementation tasks
3. **Start Phase 1** - Build core infrastructure
4. **Iterative implementation** - Build, test, refine
5. **Documentation** - Document game template usage

---

## Questions to Answer

1. Should we support multiplayer games in this template?
2. Do we need game-specific achievements system?
3. Should leaderboard widget be game-specific or global?
4. Do we need replay/spectator functionality?
5. Should we support mobile touch controls?

---

## Timeline Summary

- **Week 1:** Core infrastructure + Shared components
- **Week 2:** Leaderboard widget + Snake refactor
- **Week 3-4:** Pong, Tetris, Breakout implementation
- **Total:** 4 weeks to complete all games

---

## Conclusion

This architecture transforms game development from **"build everything for each game"** to **"implement only game logic."** It's scalable, maintainable, and drastically reduces time-to-market for new games.

The in-game leaderboard widget adds competitive urgency and keeps players engaged without forcing them to leave the game view.

This is production-ready, enterprise-grade architecture that would be used at top gaming companies.
