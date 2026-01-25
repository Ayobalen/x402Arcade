# x402Arcade Developer Guide

Complete guide for developers integrating with or contributing to x402Arcade.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [Backend Development](#backend-development)
- [Frontend Integration](#frontend-integration)
- [x402 Payment Integration](#x402-payment-integration)
- [Database Schema](#database-schema)
- [Testing Guide](#testing-guide)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │   Wallet    │ │   Game      │ │ Leaderboard │ │   Prize   │ │
│  │  Connect    │ │   Lobby     │ │    View     │ │   Pool    │ │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └─────┬─────┘ │
│         │               │               │               │       │
│  ┌──────┴───────────────┴───────────────┴───────────────┴─────┐ │
│  │                      Zustand Store                          │ │
│  └─────────────────────────────┬───────────────────────────────┘ │
└────────────────────────────────┼─────────────────────────────────┘
                                 │ REST API + x402
┌────────────────────────────────┼─────────────────────────────────┐
│                        Backend (Express)                         │
│  ┌─────────────────────────────┼───────────────────────────────┐ │
│  │              Middleware Stack                                │ │
│  │  ┌────────┐ ┌──────┐ ┌─────┴────┐ ┌────────────┐ ┌────────┐ │ │
│  │  │Request │→│Helmet│→│ x402     │→│Rate Limit  │→│ Routes │ │ │
│  │  │  ID    │ │      │ │Middleware│ │            │ │        │ │ │
│  │  └────────┘ └──────┘ └──────────┘ └────────────┘ └────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                       Services                               │ │
│  │  ┌───────────┐ ┌─────────────┐ ┌────────────┐               │ │
│  │  │   Game    │ │ Leaderboard │ │ Prize Pool │               │ │
│  │  │  Service  │ │   Service   │ │  Service   │               │ │
│  │  └─────┬─────┘ └──────┬──────┘ └─────┬──────┘               │ │
│  └────────┼──────────────┼──────────────┼──────────────────────┘ │
│           │              │              │                        │
│  ┌────────┴──────────────┴──────────────┴──────────────────────┐ │
│  │                   SQLite Database                            │ │
│  │   game_sessions  leaderboard_entries  prize_pools  payments │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                                 │
                                 ↓
┌──────────────────────────────────────────────────────────────────┐
│                     Cronos Blockchain                            │
│  ┌─────────────────┐  ┌────────────────────────────────────────┐ │
│  │  x402 Facilitator│  │              devUSDC.e                  │ │
│  │  (Cronos Labs)   │  │  0xc01efAaF7C5C61bEbFAeb358E1161b537  │ │
│  └─────────────────┘  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
x402Arcade/
├── packages/
│   ├── backend/                   # Express.js API server
│   │   ├── src/
│   │   │   ├── config/            # Environment configuration
│   │   │   ├── db/                # Database schema and connection
│   │   │   ├── middleware/        # Express middleware
│   │   │   ├── routes/            # API route handlers
│   │   │   ├── server/            # x402 middleware
│   │   │   ├── services/          # Business logic
│   │   │   ├── jobs/              # Background jobs
│   │   │   ├── lib/               # Shared utilities
│   │   │   ├── app.ts             # Express app setup
│   │   │   ├── index.ts           # Server entry point
│   │   │   ├── openapi.yaml       # API specification
│   │   │   └── x402arcade.postman_collection.json
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── frontend/                  # React application
│       ├── src/
│       │   ├── components/        # UI components
│       │   ├── games/             # Game implementations
│       │   ├── hooks/             # React hooks
│       │   ├── pages/             # Page components
│       │   ├── services/          # API clients
│       │   ├── store/             # Zustand state
│       │   └── styles/            # Global styles
│       ├── package.json
│       └── vite.config.ts
│
├── docs/                          # Documentation
│   ├── API_DOCUMENTATION.md
│   └── DEVELOPER_GUIDE.md
│
├── prompts/                       # Project specs
│   └── app_spec.txt
│
└── package.json                   # Root package.json
```

---

## Development Setup

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+ or pnpm 8+
- Git
- A code editor (VS Code recommended)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/x402arcade/x402arcade.git
cd x402arcade

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development servers
npm run dev
```

This starts:
- Backend API: http://localhost:3001
- Frontend: http://localhost:5173

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Server
NODE_ENV=development
PORT=3001
HOST=localhost
CORS_ORIGIN=http://localhost:5173

# Database
DATABASE_PATH=./data/arcade.db

# Blockchain (Cronos Testnet)
CHAIN_ID=338
RPC_URL=https://evm-t3.cronos.org/
EXPLORER_URL=https://explorer.cronos.org/testnet

# USDC Contract (devUSDC.e)
USDC_CONTRACT_ADDRESS=0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0
USDC_DECIMALS=6
USDC_DOMAIN_VERSION=1

# Arcade Wallet (receives payments)
ARCADE_WALLET_ADDRESS=0xYOUR_WALLET_ADDRESS
ARCADE_PRIVATE_KEY=0xYOUR_PRIVATE_KEY

# x402 Facilitator
FACILITATOR_URL=https://facilitator.cronoslabs.org

# Game Prices (in USDC)
SNAKE_PRICE_USDC=0.01
TETRIS_PRICE_USDC=0.02
PRIZE_POOL_PERCENTAGE=70

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Backend Development

### Adding a New API Route

1. **Create route file** in `packages/backend/src/routes/`:

```typescript
// packages/backend/src/routes/example.routes.ts
import { Router, type Request, type Response } from 'express';

const router = Router();

/**
 * GET /api/v1/example
 */
router.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Example endpoint' });
});

export default router;
```

2. **Register in app.ts**:

```typescript
import exampleRoutes from './routes/example.routes.js';

// In createApp():
app.use('/api/v1/example', exampleRoutes);
```

3. **Add to OpenAPI spec** (`openapi.yaml`)

4. **Write integration tests**

### Service Layer Pattern

Services encapsulate business logic:

```typescript
// packages/backend/src/services/example.ts
import type Database from 'better-sqlite3';

export class ExampleService {
  constructor(private db: Database.Database) {}

  getData(id: string) {
    return this.db.prepare('SELECT * FROM examples WHERE id = ?').get(id);
  }

  createData(data: ExampleInput) {
    const result = this.db.prepare(
      'INSERT INTO examples (id, name) VALUES (?, ?)'
    ).run(data.id, data.name);
    return { id: data.id, ...data };
  }
}
```

### Error Handling

Use the error handler middleware:

```typescript
// Throw errors in routes
if (!data) {
  res.status(404).json({
    error: 'Not found',
    message: `Example not found: ${id}`,
  });
  return;
}

// For unexpected errors, let the error handler catch them
throw new Error('Unexpected error');
```

---

## Frontend Integration

### API Client

Use the API client for backend communication:

```typescript
// packages/frontend/src/services/api.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function fetchLeaderboard(gameType: string, period: string) {
  const response = await fetch(
    `${API_URL}/api/v1/leaderboard/${gameType}/${period}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch leaderboard');
  }
  return response.json();
}
```

### Zustand Store

State management with Zustand:

```typescript
// packages/frontend/src/store/gameStore.ts
import { create } from 'zustand';

interface GameState {
  sessionId: string | null;
  score: number;
  setSessionId: (id: string) => void;
  setScore: (score: number) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  sessionId: null,
  score: 0,
  setSessionId: (id) => set({ sessionId: id }),
  setScore: (score) => set({ score }),
  reset: () => set({ sessionId: null, score: 0 }),
}));
```

### React Query

Use React Query for data fetching:

```typescript
import { useQuery } from '@tanstack/react-query';
import { fetchLeaderboard } from '../services/api';

function LeaderboardView({ gameType }: { gameType: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['leaderboard', gameType, 'daily'],
    queryFn: () => fetchLeaderboard(gameType, 'daily'),
    staleTime: 30000, // 30 seconds
  });

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return <LeaderboardList entries={data.entries} />;
}
```

---

## x402 Payment Integration

### Backend: x402 Middleware

The x402 middleware handles payment verification:

```typescript
// packages/backend/src/server/middleware/x402.ts
import { createX402Middleware } from '../server/middleware/x402.js';

// In route handler:
const x402Middleware = createX402Middleware({
  payTo: process.env.ARCADE_WALLET_ADDRESS,
  paymentAmount: parseUSDC(0.01), // 10000 (6 decimals)
  tokenAddress: process.env.USDC_CONTRACT_ADDRESS,
  tokenName: 'Bridged USDC (Stargate)',
  tokenDecimals: 6,
  facilitatorUrl: process.env.FACILITATOR_URL,
  chainId: 338,
});

// Apply middleware
await new Promise<void>((resolve, reject) => {
  x402Middleware(req, res, (error) => {
    if (error) reject(error);
    else resolve();
  });
});

// Payment successful - access payment info
const { payer, amountUsdc } = req.x402.paymentInfo;
```

### Frontend: useX402 Hook

```typescript
// packages/frontend/src/hooks/useX402.ts
import { useAccount, useSignTypedData } from 'wagmi';

export function useX402() {
  const { address } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();

  async function initiatePayment(gameType: string) {
    // Step 1: Get payment requirements
    const res = await fetch(`${API_URL}/api/v1/play/${gameType}`, {
      method: 'POST',
    });

    if (res.status !== 402) {
      throw new Error('Expected 402 response');
    }

    const paymentInfo = await res.json();

    // Step 2: Sign EIP-3009 authorization
    const signature = await signTypedDataAsync({
      domain: {
        name: 'Bridged USDC (Stargate)',
        version: '1',
        chainId: 338,
        verifyingContract: USDC_ADDRESS,
      },
      types: {
        TransferWithAuthorization: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'validAfter', type: 'uint256' },
          { name: 'validBefore', type: 'uint256' },
          { name: 'nonce', type: 'bytes32' },
        ],
      },
      primaryType: 'TransferWithAuthorization',
      message: {
        from: address,
        to: paymentInfo.paymentInfo.recipient,
        value: BigInt(paymentInfo.paymentInfo.amount),
        validAfter: 0n,
        validBefore: BigInt(Math.floor(Date.now() / 1000) + 3600),
        nonce: generateNonce(),
      },
    });

    // Step 3: Submit payment
    const res2 = await fetch(`${API_URL}/api/v1/play/${gameType}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Payment': btoa(JSON.stringify({ signature, ...message })),
      },
    });

    return await res2.json();
  }

  return { initiatePayment };
}
```

---

## Database Schema

### Tables

```sql
-- Game sessions
CREATE TABLE game_sessions (
    id TEXT PRIMARY KEY,
    game_type TEXT NOT NULL CHECK (game_type IN ('snake', 'tetris', 'pong', 'breakout', 'space-invaders')),
    player_address TEXT NOT NULL,
    payment_tx_hash TEXT NOT NULL UNIQUE,
    amount_paid_usdc REAL NOT NULL,
    score INTEGER,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT,
    game_duration_ms INTEGER
);

-- Leaderboard entries
CREATE TABLE leaderboard_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL REFERENCES game_sessions(id),
    game_type TEXT NOT NULL,
    player_address TEXT NOT NULL,
    score INTEGER NOT NULL,
    period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'alltime')),
    period_date TEXT NOT NULL,
    rank INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(session_id, period_type)
);

-- Prize pools
CREATE TABLE prize_pools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_type TEXT NOT NULL,
    period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly')),
    period_date TEXT NOT NULL,
    total_amount_usdc REAL NOT NULL DEFAULT 0,
    total_games INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'finalized', 'paid')),
    winner_address TEXT,
    payout_tx_hash TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    finalized_at TEXT,
    UNIQUE(game_type, period_type, period_date)
);

-- Payment audit log
CREATE TABLE payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tx_hash TEXT NOT NULL UNIQUE,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    amount_usdc REAL NOT NULL,
    purpose TEXT NOT NULL CHECK (purpose IN ('game_payment', 'prize_payout')),
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    confirmed_at TEXT
);
```

### Indexes

```sql
CREATE INDEX idx_sessions_player ON game_sessions(player_address);
CREATE INDEX idx_sessions_status ON game_sessions(status);
CREATE INDEX idx_leaderboard_game_period ON leaderboard_entries(game_type, period_type, period_date);
CREATE INDEX idx_leaderboard_score ON leaderboard_entries(score DESC);
```

---

## Testing Guide

### Running Tests

```bash
# All tests
npm test

# Backend tests only
cd packages/backend
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage
```

### Test Structure

```
packages/backend/src/
├── routes/__tests__/
│   ├── integration.test.ts      # Full API tests
│   ├── health.routes.test.ts    # Health endpoint tests
│   └── ratelimit.test.ts        # Rate limiting tests
├── services/__tests__/
│   ├── game.service.test.ts     # Game service unit tests
│   ├── leaderboard.service.test.ts
│   └── prizePool.service.test.ts
├── server/middleware/__tests__/
│   ├── x402.test.ts             # x402 middleware tests
│   └── x402-edge-cases.test.ts
└── __tests__/
    └── e2e.test.ts              # End-to-end tests
```

### Writing Tests

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import Database from 'better-sqlite3';
import { createTables } from '../../db/schema.js';

describe('Example Route', () => {
  let app: express.Express;
  let db: Database.Database;

  beforeEach(() => {
    // Setup
    db = new Database(':memory:');
    createTables(db);
    app = express();
    app.use(express.json());
    // Mount routes...
  });

  afterEach(() => {
    db.close();
  });

  it('should return 200 for valid request', async () => {
    const response = await request(app).get('/api/v1/example');
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Expected message');
  });

  it('should return 400 for invalid input', async () => {
    const response = await request(app)
      .post('/api/v1/example')
      .send({ invalid: 'data' });
    expect(response.status).toBe(400);
  });
});
```

---

## Deployment

### Railway Deployment

1. **Create Railway project**
2. **Add environment variables** in Railway dashboard
3. **Connect GitHub repository**
4. **Deploy!**

### Vercel Deployment (Frontend)

1. **Import project** in Vercel
2. **Set environment variables:**
   ```
   VITE_API_URL=https://api.x402arcade.com
   VITE_CHAIN_ID=338
   ```
3. **Deploy!**

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3001
CMD ["npm", "start"]
```

```bash
docker build -t x402arcade .
docker run -p 3001:3001 --env-file .env x402arcade
```

---

## Contributing

### Code Style

- Use TypeScript with strict mode
- Follow existing patterns and conventions
- Add JSDoc comments for public APIs
- Write tests for new features

### Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Write/update tests
5. Update documentation
6. Submit PR with clear description

### Commit Messages

Follow conventional commits:

```
feat: add new leaderboard filter
fix: resolve score submission race condition
docs: update API documentation
test: add prize pool edge cases
refactor: simplify game service logic
```

---

## Resources

- [x402 Protocol Documentation](https://x402.org)
- [Cronos Documentation](https://docs.cronos.org)
- [EIP-3009 Specification](https://eips.ethereum.org/EIPS/eip-3009)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Vite Documentation](https://vitejs.dev)
- [React Query](https://tanstack.com/query)
