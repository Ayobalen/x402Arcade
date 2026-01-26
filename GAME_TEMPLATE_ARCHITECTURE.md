# Game Template Architecture - Visual Guide

## Current Architecture (Problem)

```
┌─────────────────────────────────────────────────────────────┐
│                        Snake Game                            │
├─────────────────────────────────────────────────────────────┤
│ ✅ Payment Flow (x402)                                       │
│ ✅ Session Management                                        │
│ ✅ Game Logic                                                │
│ ✅ UI Components (HUD, Game Over, etc.)                      │
│ ✅ Leaderboard Integration                                   │
│ ✅ Controls System                                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        Pong Game                             │
├─────────────────────────────────────────────────────────────┤
│ ❌ Payment Flow (needs implementation)                       │
│ ❌ Session Management (needs implementation)                 │
│ ⚠️  Game Logic (partially done)                              │
│ ❌ UI Components (needs implementation)                      │
│ ❌ Leaderboard Integration (needs implementation)            │
│ ❌ Controls System (needs implementation)                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                       Tetris Game                            │
├─────────────────────────────────────────────────────────────┤
│ ❌ Payment Flow (needs implementation)                       │
│ ❌ Session Management (needs implementation)                 │
│ ❌ Game Logic (needs implementation)                         │
│ ❌ UI Components (needs implementation)                      │
│ ❌ Leaderboard Integration (needs implementation)            │
│ ❌ Controls System (needs implementation)                    │
└─────────────────────────────────────────────────────────────┘

Problem: 80% code duplication across games!
```

---

## New Architecture (Solution)

```
                    ┌──────────────────────────────────────┐
                    │       GameTemplate (HOC)             │
                    │  ┌────────────────────────────────┐  │
                    │  │   GameSessionProvider          │  │
                    │  │  - Payment flow                │  │
                    │  │  - Session management          │  │
                    │  │  - Score tracking              │  │
                    │  └────────────────────────────────┘  │
                    │                                      │
                    │  ┌────────────────────────────────┐  │
                    │  │   GamePaymentGate              │  │
                    │  │  - Wallet check                │  │
                    │  │  - Balance check               │  │
                    │  │  - x402 payment UI             │  │
                    │  └────────────────────────────────┘  │
                    │                                      │
                    │  ┌────────────────────────────────┐  │
                    │  │   GameLayout                   │  │
                    │  ├────────────────────────────────┤  │
                    │  │  GameHUD (score, level, etc)   │  │
                    │  │  ┌──────────────────────────┐  │  │
                    │  │  │  GameCanvas              │  │  │
                    │  │  │  (Game logic here)       │  │  │
                    │  │  └──────────────────────────┘  │  │
                    │  │  GameControls (help overlay)   │  │
                    │  │  LeaderboardWidget ⭐          │  │
                    │  │  GameOverModal                 │  │
                    │  └────────────────────────────────┘  │
                    └──────────────────────────────────────┘
                                    ↑
                                    │ Wraps
                    ┌───────────────┴────────────────┐
                    │                                │
        ┌───────────▼──────────┐      ┌─────────────▼─────────┐
        │   Snake Game         │      │   Pong Game           │
        ├──────────────────────┤      ├───────────────────────┤
        │ ✅ Game Logic Only   │      │ ✅ Game Logic Only    │
        │ - Snake movement     │      │ - Ball physics        │
        │ - Collision          │      │ - Paddle movement     │
        │ - Food spawning      │      │ - AI opponent         │
        └──────────────────────┘      └───────────────────────┘

        ┌──────────────────────┐      ┌───────────────────────┐
        │   Tetris Game        │      │   Breakout Game       │
        ├──────────────────────┤      ├───────────────────────┤
        │ ✅ Game Logic Only   │      │ ✅ Game Logic Only    │
        │ - Block rotation     │      │ - Ball physics        │
        │ - Line clearing      │      │ - Brick destruction   │
        │ - Piece dropping     │      │ - Power-ups           │
        └──────────────────────┘      └───────────────────────┘

All common functionality implemented once, reused by all games!
```

---

## Component Hierarchy

```
App
└── GameTemplate
    ├── GameSessionProvider (Context)
    │   ├── Payment state
    │   ├── Session state
    │   ├── Score state
    │   └── Leaderboard state
    │
    └── GamePaymentGate
        └── (Only renders children after payment)
            │
            └── GameLayout
                ├── GameHUD
                │   ├── Score display
                │   ├── Level indicator
                │   ├── Lives/health
                │   └── Pause button
                │
                ├── GameCanvas
                │   └── [Game Instance]
                │       └── Your game logic here
                │
                ├── GameControls
                │   └── Keyboard help overlay
                │
                ├── LeaderboardWidget ⭐
                │   ├── Draggable container
                │   ├── Top 10 scores
                │   ├── User highlight
                │   ├── Real-time updates
                │   └── Minimize/maximize
                │
                └── GameOverModal
                    ├── Final score
                    ├── High score celebration
                    └── Play again button
```

---

## Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│                   User visits /play/snake                     │
└───────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────┐
│  GameTemplate renders with Snake game instance               │
└───────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────┐
│  GameSessionProvider initializes                             │
│  - Creates session state                                     │
│  - Loads user's wallet                                       │
│  - Fetches game metadata                                     │
└───────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────┐
│  GamePaymentGate checks payment status                       │
│  - Not paid? Show payment UI                                 │
│  - Paid? Render game                                         │
└───────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────┐
│  User clicks "Pay $0.01 to Play"                             │
└───────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────┐
│  useGamePayment hook handles x402 flow                       │
│  1. Sign EIP-3009 authorization                              │
│  2. Submit to facilitator                                    │
│  3. Facilitator settles on-chain                             │
│  4. Backend receives payment webhook                         │
│  5. Session marked as paid                                   │
└───────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────┐
│  GameCanvas renders                                          │
│  - Calls gameFactory(canvas)                                 │
│  - Creates Snake instance                                    │
│  - Calls snake.initialize()                                  │
└───────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────┐
│  User clicks "Start Game"                                    │
└───────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────┐
│  useGameSession.startGame()                                  │
│  - Calls snake.start()                                       │
│  - Starts game loop                                          │
│  - Enables input handling                                    │
└───────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────┐
│  Game Loop Running                                           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Snake.update()                                        │  │
│  │    → Score changes                                     │  │
│  │    → snake.onScoreChange(newScore)                     │  │
│  │    → useGameSession.updateScore(newScore)              │  │
│  │    → GameHUD re-renders with new score                 │  │
│  │    → LeaderboardWidget checks if beat top score        │  │
│  └────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────┐
│  Game Over                                                   │
│  - snake.onGameOver(finalScore)                              │
│  - useGameSession.endGame(finalScore)                        │
│  - submitHighScore(finalScore) to backend                    │
│  - Show GameOverModal                                        │
│  - Update leaderboard                                        │
└──────────────────────────────────────────────────────────────┘
```

---

## LeaderboardWidget Design

### Expanded View

```
┌─────────────────────────────────────────┐
│ 🏆 Live Leaderboard            [─] [×] │
├─────────────────────────────────────────┤
│                                         │
│  #1  Snake Master    0xabc...def  2,450│
│      ████████████████████████ 100%     │
│                                         │
│  #2  Pro Gamer       0x123...456  1,987│
│      ████████████████████ 81%          │
│                                         │
│  #3  You            0xfed...cba  1,543 │ ⭐
│      ██████████████████ 63%            │
│                                         │
│  #4  Player One      0x789...012  1,234│
│      ██████████████ 50%                │
│                                         │
│  #5  Arcade Pro      0xghi...jkl    987│
│      ██████████ 40%                    │
│                                         │
│  #6  Speed Runner    0xmno...pqr    876│
│  #7  High Scorer     0xstu...vwx    765│
│  #8  Retro Fan       0xyz...123     654│
│  #9  Game King       0x456...789    543│
│  #10 Classic Player  0xabc...xyz    432│
│                                         │
├─────────────────────────────────────────┤
│ Your Score: 1,543  •  Rank: #3 of 247  │
│ 🎯 Beat #2 to climb! (+444 points)     │
└─────────────────────────────────────────┘
```

### Minimized View

```
┌──────────────┐
│ 🏆  #3  1.5k │
└──────────────┘
```

### Features

- **Draggable** - Click and drag anywhere
- **Auto-refresh** - Updates every 10 seconds
- **User highlight** - Your position always visible
- **Progress bars** - Visual comparison
- **Beat next** - Shows points needed to climb
- **Responsive** - Adapts to screen size
- **Theme-aware** - Uses theme colors
- **Glassmorphism** - Semi-transparent with blur

---

## Code Examples

### Before (Current Snake - 500+ lines)

```typescript
// Snake game has everything mixed together
export function SnakeGame() {
  // Payment logic
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const handlePayment = async () => {
    /* 50 lines */
  };

  // Session logic
  const [gameSession, setGameSession] = useState(null);
  const startSession = async () => {
    /* 30 lines */
  };

  // Game logic
  const [snake, setSnake] = useState([]);
  const [food, setFood] = useState({});
  const moveSnake = () => {
    /* 40 lines */
  };

  // UI state
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Leaderboard
  const submitScore = async () => {
    /* 20 lines */
  };

  // 400+ more lines of mixed concerns...
}
```

### After (New Snake - 100 lines)

```typescript
// Snake game focuses ONLY on game logic
class SnakeGame implements IGame {
  private snake: Position[] = [];
  private food: Position = { x: 0, y: 0 };
  private direction: Direction = 'right';
  private score = 0;

  initialize(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resetGame();
  }

  start() {
    this.gameLoop();
  }

  handleInput(key: string) {
    if (key === 'ArrowUp' && this.direction !== 'down') {
      this.direction = 'up';
    }
    // ... other directions
  }

  private gameLoop() {
    this.moveSnake();
    this.checkCollision();
    this.checkFood();
    this.render();

    if (this.gameState === 'playing') {
      requestAnimationFrame(() => this.gameLoop());
    }
  }

  getCurrentScore() {
    return this.score;
  }

  // ... 60 more lines of JUST game logic
}

// Game page is 3 lines
export function SnakeGamePage() {
  return (
    <GameTemplate
      game={snakeMetadata}
      gameFactory={(canvas) => new SnakeGame(canvas)}
    />
  );
}
```

### Adding a New Game (Pong - 15 minutes)

**Step 1:** Create game class (10 mins)

```typescript
// packages/frontend/src/games/pong/PongGame.ts
class PongGame implements IGame {
  private ball: { x: number; y: number; dx: number; dy: number };
  private paddle: { y: number };
  private ai: { y: number };
  private score = 0;

  initialize(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.resetGame();
  }

  start() {
    this.gameLoop();
  }

  handleInput(key: string) {
    if (key === 'ArrowUp') this.paddle.y -= 10;
    if (key === 'ArrowDown') this.paddle.y += 10;
  }

  private gameLoop() {
    this.moveBall();
    this.moveAI();
    this.checkCollisions();
    this.render();
    requestAnimationFrame(() => this.gameLoop());
  }

  getCurrentScore() {
    return this.score;
  }
  getGameState() {
    return this.gameState;
  }
}
```

**Step 2:** Create metadata (2 mins)

```typescript
// packages/frontend/src/games/pong/metadata.ts
export const pongMetadata: GameMetadata = {
  id: 'pong',
  name: 'Pong',
  description: 'Classic arcade pong',
  icon: '🏓',
  controls: {
    primary: ['ArrowUp', 'ArrowDown'],
    pause: 'Space',
  },
  difficulty: {
    default: 'normal',
    available: ['easy', 'normal', 'hard'],
  },
  pricing: {
    baseCost: 0.01,
  },
};
```

**Step 3:** Create page (3 mins)

```typescript
// packages/frontend/src/games/pong/PongGamePage.tsx
import { GameTemplate } from '@/games/components/GameTemplate';
import { PongGame } from './PongGame';
import { pongMetadata } from './metadata';

export function PongGamePage() {
  return (
    <GameTemplate
      game={pongMetadata}
      gameFactory={(canvas) => new PongGame(canvas)}
    />
  );
}
```

**Done!** Full working game with:

- ✅ Payment flow
- ✅ Session management
- ✅ Score tracking
- ✅ Leaderboard
- ✅ Game over screen
- ✅ Controls help
- ✅ In-game leaderboard widget

---

## Performance Optimization

### React.memo for Static Components

```typescript
export const GameHUD = React.memo(({ score, level, lives }) => {
  return (
    <div className="game-hud">
      <div>Score: {score}</div>
      <div>Level: {level}</div>
      <div>Lives: {lives}</div>
    </div>
  );
});
```

### Callback Optimization

```typescript
const handleScoreChange = useCallback(
  (newScore: number) => {
    setScore(newScore);
    if (newScore > highScore) {
      setHighScore(newScore);
    }
  },
  [highScore]
);
```

### Canvas Optimization

```typescript
// Use offscreen canvas for double buffering
class OptimizedGame implements IGame {
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;

  initialize(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Create offscreen canvas
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = canvas.width;
    this.offscreenCanvas.height = canvas.height;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d');
  }

  private render() {
    // Render to offscreen canvas
    this.offscreenCtx.clearRect(0, 0, this.width, this.height);
    this.drawGame(this.offscreenCtx);

    // Copy to main canvas (single draw call)
    this.ctx.drawImage(this.offscreenCanvas, 0, 0);
  }
}
```

---

## Testing Strategy

### Unit Tests for Game Logic

```typescript
describe('SnakeGame', () => {
  let game: SnakeGame;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    game = new SnakeGame(canvas);
    game.initialize(canvas, 'normal');
  });

  it('should initialize with score 0', () => {
    expect(game.getCurrentScore()).toBe(0);
  });

  it('should increase score when eating food', () => {
    game.start();
    // Simulate snake eating food
    game['checkFood']();
    expect(game.getCurrentScore()).toBeGreaterThan(0);
  });

  it('should end game on collision', () => {
    game.start();
    // Simulate collision
    game['checkCollision']();
    expect(game.getGameState()).toBe('over');
  });
});
```

### Integration Tests for Template

```typescript
describe('GameTemplate', () => {
  it('should handle payment flow', async () => {
    const { getByText, findByText } = render(
      <GameTemplate
        game={snakeMetadata}
        gameFactory={(canvas) => new SnakeGame(canvas)}
      />
    );

    expect(getByText('Pay $0.01 to Play')).toBeInTheDocument();

    fireEvent.click(getByText('Pay $0.01 to Play'));

    await findByText('Processing payment...');
    await findByText('Start Game');
  });

  it('should show leaderboard widget', () => {
    const { getByText } = render(
      <GameTemplate
        game={snakeMetadata}
        gameFactory={(canvas) => new SnakeGame(canvas)}
      />
    );

    expect(getByText('🏆 Live Leaderboard')).toBeInTheDocument();
  });
});
```

---

## Migration Path

### Phase 1: Build Template (No Breaking Changes)

- Build all shared components
- Create hooks
- Test in isolation
- No changes to existing Snake

### Phase 2: Migrate Snake (Feature Flag)

- Create new SnakeGame class
- Keep old implementation
- Feature flag: `ENABLE_GAME_TEMPLATE=true`
- A/B test both versions
- Monitor metrics

### Phase 3: Roll Out New Games

- Implement Pong with template
- Implement Tetris with template
- Validate pattern works

### Phase 4: Deprecate Old Code

- Remove old Snake implementation
- Clean up duplicate code
- Archive legacy components

---

## Monitoring & Analytics

### Track These Metrics

1. **Payment Success Rate** - Should be >95% across all games
2. **Session Start Rate** - Users who pay → users who start game
3. **Average Score** - Track per game and difficulty
4. **Session Duration** - Time spent playing
5. **Retry Rate** - Users who play again
6. **Leaderboard Engagement** - Widget interactions

### Implementation

```typescript
// In GameSessionProvider
useEffect(() => {
  if (paymentStatus === 'paid') {
    analytics.track('game_payment_success', {
      gameId: game.id,
      amount: game.pricing.baseCost,
      timestamp: Date.now(),
    });
  }
}, [paymentStatus]);

useEffect(() => {
  if (gameState === 'over') {
    analytics.track('game_completed', {
      gameId: game.id,
      finalScore: score,
      difficulty,
      duration: Date.now() - sessionStartTime,
    });
  }
}, [gameState]);
```

---

## Future Enhancements

### 1. Multiplayer Support

Add multiplayer capability to template:

```typescript
interface IMultiplayerGame extends IGame {
  connectToMatch(matchId: string): Promise<void>;
  handleOpponentMove(move: Move): void;
  sendMove(move: Move): void;
}
```

### 2. Tournament Mode

```typescript
interface TournamentConfig {
  duration: number;
  maxPlayers: number;
  prizePool: number;
}
```

### 3. Achievements System

```typescript
interface Achievement {
  id: string;
  name: string;
  description: string;
  condition: (game: IGame) => boolean;
  reward: number;
}
```

### 4. Replay System

```typescript
interface IReplayableGame extends IGame {
  recordFrame(): GameFrame;
  replayFrames(frames: GameFrame[]): void;
}
```

---

## Conclusion

This architecture transforms game development from weeks to days by:

- **80% code reduction** through shared components
- **Consistent UX** across all games
- **Rapid iteration** - new games in hours, not weeks
- **Better UX** with in-game leaderboard
- **Production-ready** enterprise patterns

The template system is inspired by Unity's GameObject system, React's component model, and proven game engine architectures used by AAA studios.
