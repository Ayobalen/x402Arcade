# x402Arcade

> **"Insert a Penny, Play for Glory"**

A gasless arcade gaming platform on Cronos blockchain that makes micropayment gaming economically viable for the first time. Built for the **Cronos x402 Hackathon**

🎮 **[Live Demo](https://x402arcade.vercel.app)** | 📹 **[Video Demo](#)** | 🏆 **Hackathon Submission**

---

## The Problem: Why Micropayments Fail on Traditional Blockchain

Web3 gaming suffers from a fundamental economic problem: **gas fees destroy micropayments**.

| Payment Method             | Cost Per $0.01 Game                       | Settlement Time | Player Experience             |
| -------------------------- | ----------------------------------------- | --------------- | ----------------------------- |
| **Traditional Blockchain** | $0.01 + **$0.50-$2.00 gas** = $0.51-$2.01 | 5-30 seconds    | "Waiting for confirmation..." |
| **x402 Protocol**          | $0.01 + **$0.00 gas** = $0.01             | <1 second       | Instant gameplay              |

**Result:** On traditional blockchain, gas costs **50-200x more than the game itself**. Players would pay $2 in gas to play a $0.01 game. This is economically absurd.

## The Solution: x402 Protocol Changes Everything

x402Arcade demonstrates the **killer use case** for x402 Protocol: enabling **true pay-per-play** arcade gaming at penny scale.

### Why x402 + Arcade Gaming = Perfect Product-Market Fit

Arcade gaming uniquely requires:

- ✅ **Micropayments at scale** - Players make 10-100 payments per session ($0.10-$2.00 total)
- ✅ **Instant gratification** - No "waiting for block confirmation" loading screens
- ✅ **True pay-per-play** - No deposits, no bulk purchases, just pennies per game
- ✅ **Seamless replays** - EIP-3009 signatures enable one-click replay payments

**x402 is the only technology that makes this economically viable.**

### Key Innovation: HTTP-Native Blockchain Payments

- **EIP-3009**: Gasless transfer authorizations signed by players
- **x402 Facilitator**: HTTP middleware that settles authorizations on-chain
- **Zero Gas for Players**: Facilitator covers all transaction costs
- **Sub-second Settlement**: Games start in <1 second after payment signature

---

## Features

### For Players

- 🎮 **Retro Arcade Games** - Snake, Tetris, Pong, Space Invaders (with procedural audio)
- 💰 **Penny Pricing** - Pay $0.01-$0.02 USDC per game
- ⚡ **Instant Play** - Game starts in <1 second after payment
- 🏆 **Prize Pools** - 70% of all payments fund daily jackpots
- 📊 **Leaderboards** - Compete for glory on daily/weekly/all-time rankings
- 🎨 **Crypto-Native UX** - Dark theme with purple accents, inspired by Phantom + Linear

### For Developers

- 🛠️ **Production-Ready x402** - Reference implementation with custom middleware
- 🔐 **Security First** - Defense-in-depth with sandboxing & command allowlisting
- 📱 **Responsive Design** - Mobile-first with 100% Lighthouse accessibility
- 🎵 **Procedural Audio** - Web Audio API for retro chiptune sound effects
- 🧪 **Full Test Coverage** - Vitest + Playwright E2E tests
- 📦 **Monorepo Architecture** - pnpm workspaces with TypeScript

---

## Tech Stack

### Frontend

- **React 18** with TypeScript
- **Vite** for blazing-fast dev server
- **Tailwind CSS** + custom design system
- **Zustand** for state management
- **Framer Motion** for animations
- **wagmi v3** + **viem v2** for blockchain interactions
- **Phaser 3** for game rendering
- **Web Audio API** for procedural sound generation

### Backend

- **Express.js** with TypeScript
- **SQLite** (better-sqlite3) for data persistence
- **Zod** for runtime validation
- **Custom x402 middleware** for payment handling
- **JWT** for session management
- **Helmet** + CORS for security

### Blockchain

- **Cronos Testnet** (Chain ID: 338)
- **x402 Protocol** for gasless micropayments
- **EIP-3009** for transfer authorizations
- **devUSDC.e** (Stargate bridged USDC)

---

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0 (recommended)
- MetaMask or compatible Web3 wallet

### Installation

```bash
# Clone the repository
git clone https://github.com/Ayobalen/x402Arcade.git
cd x402Arcade

# Install dependencies
pnpm install

# Set up environment variables (see .env.example files)
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env

# Start development servers
pnpm dev:backend   # Port 3001
pnpm dev:frontend  # Port 3000

# Open http://localhost:3000
```

### Getting Test Tokens

1. **TCRO (gas)**: https://cronos.org/faucet
2. **devUSDC.e (payments)**: https://faucet.cronos.org/

> **Note**: Faucets have 24hr limits. Need help? Join: https://t.me/+a4jj5hyJl0NmMDll

---

## How x402 Payment Flow Works

```
┌─────────┐                 ┌─────────┐                 ┌────────────┐
│ Player  │                 │ Backend │                 │ Facilitator│
└────┬────┘                 └────┬────┘                 └──────┬─────┘
     │                           │                             │
     │  1. POST /api/play        │                             │
     ├──────────────────────────>│                             │
     │                           │                             │
     │  2. 402 Payment Required  │                             │
     │<──────────────────────────┤                             │
     │  + Authorization params   │                             │
     │                           │                             │
     │  3. Sign EIP-3009        │                             │
     │     authorization         │                             │
     │     (gasless)             │                             │
     │                           │                             │
     │  4. POST /api/play        │                             │
     │     + X-Payment header    │                             │
     ├──────────────────────────>│                             │
     │                           │  5. POST /v2/x402/settle    │
     │                           │     + authorization         │
     │                           ├────────────────────────────>│
     │                           │                             │
     │                           │  6. USDC transferred        │
     │                           │     on-chain                │
     │                           │<────────────────────────────┤
     │                           │                             │
     │  7. 200 OK + sessionId    │                             │
     │<──────────────────────────┤                             │
     │                           │                             │
     │  8. Game starts! (<1s)    │                             │
     └───────────────────────────┴─────────────────────────────┘
```

**Key Benefits:**

- ✅ Player signs once, no wallet popups during gameplay
- ✅ Zero gas fees for players (facilitator pays)
- ✅ Sub-second settlement vs 5-30 seconds on traditional blockchain
- ✅ HTTP-native: works with any backend framework

---

## Project Structure

```
x402Arcade/
├── packages/
│   ├── backend/              # Express.js API server
│   │   ├── src/
│   │   │   ├── config/       # Environment & chain config
│   │   │   ├── db/           # SQLite database
│   │   │   ├── middleware/   # x402 payment middleware ⚡
│   │   │   ├── routes/       # REST API endpoints
│   │   │   ├── services/     # Business logic
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── frontend/             # React SPA
│   │   ├── src/
│   │   │   ├── components/   # UI components
│   │   │   ├── config/       # wagmi + chain config
│   │   │   ├── games/        # Game implementations
│   │   │   │   ├── snake/    # Snake game
│   │   │   │   ├── tetris/   # Tetris game
│   │   │   │   ├── pong/     # Pong game
│   │   │   │   └── space-invaders/
│   │   │   ├── hooks/        # React hooks (useX402 ⚡)
│   │   │   ├── stores/       # Zustand stores
│   │   │   └── utils/        # Procedural audio, helpers
│   │   └── package.json
│   │
│   └── shared/               # Shared TypeScript types
│
├── docs/                     # Technical documentation
├── .github/                  # CI/CD workflows
├── package.json              # Root monorepo config
└── README.md                 # This file
```

---

## Key Technical Achievements

### 1. Production-Ready x402 Implementation

- Custom Express middleware for 402 flow
- EIP-3009 signature validation
- Facilitator integration with error handling
- Transaction verification on-chain

### 2. Game Architecture

- Modular game engine with shared patterns
- Canvas-based rendering with 60 FPS
- Collision detection and physics
- Score tracking and leaderboard integration

### 3. Audio System

- Procedural sound generation (no audio files)
- Web Audio API for retro chiptune effects
- Eat, combo, death, and level-up sounds
- Background music with shuffle/loop

### 4. Security & Best Practices

- Environment variable validation with Zod
- JWT-based session management
- SQL injection prevention (parameterized queries)
- CORS and Helmet middleware
- Rate limiting on payment endpoints

### 5. UX Polish

- Mute controls with localStorage persistence
- Responsive design (mobile-first)
- Loading states and error boundaries
- Keyboard navigation support
- Dark theme with purple accents

---

## Available Scripts

### Development

```bash
pnpm dev:frontend      # Start frontend (http://localhost:3000)
pnpm dev:backend       # Start backend (http://localhost:3001)
```

### Production Build

```bash
pnpm build:frontend    # Build frontend to packages/frontend/dist/
pnpm build:backend     # Build backend to packages/backend/dist/
```

### Testing

```bash
pnpm test:frontend     # Run Vitest unit tests
pnpm test:backend      # Run backend tests
pnpm test:e2e          # Run Playwright E2E tests
pnpm test:coverage     # Generate coverage reports
```

### Code Quality

```bash
pnpm lint              # ESLint on all packages
pnpm lint:fix          # Auto-fix linting issues
pnpm format            # Prettier formatting
pnpm format:check      # Check formatting
```

---

## Environment Configuration

### Backend (.env)

```bash
# Server
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:3000

# Database
DATABASE_PATH=./data/arcade.db

# Blockchain
CHAIN_ID=338
RPC_URL=https://evm-t3.cronos.org
USDC_CONTRACT_ADDRESS=0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0
FACILITATOR_URL=https://facilitator.cronoslabs.org

# Wallet (receives payments, sends prizes)
ARCADE_WALLET_ADDRESS=0xYOUR_ADDRESS
ARCADE_PRIVATE_KEY=0xYOUR_KEY

# Security
JWT_SECRET=your-32-character-secret
```

### Frontend (.env)

```bash
VITE_API_URL=http://localhost:3001
VITE_CHAIN_ID=338
VITE_RPC_URL=https://evm-t3.cronos.org
VITE_USDC_ADDRESS=0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0
```

---

## Deployment

### Frontend (Vercel)

```bash
vercel --prod
```

Deployment URL: https://x402arcade.vercel.app

### Backend (Railway)

```bash
railway up
```

Backend API: https://api.x402arcade.com

---

## Troubleshooting

### ❌ "Payment failed: insufficient balance"

- Get test devUSDC.e from https://faucet.cronos.org/
- Ensure you have TCRO for gas (backend wallet only)

### ❌ "Cannot connect to wallet"

- Install MetaMask or compatible wallet
- Switch to Cronos Testnet (Chain ID: 338)
- Add network manually if needed

### ❌ "Mute button not working"

- Clear browser localStorage
- Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

### ❌ "Database error"

- Delete `packages/backend/data/arcade.db`
- Restart backend server (auto-initializes)

---

## Hackathon Categories

### Primary: Main Track

**Best Overall Application Using x402 Protocol**

This project demonstrates the **killer use case** for x402: enabling economically viable micropayment gaming. Traditional blockchain makes $0.01 games impossible due to gas fees. x402 solves this with gasless, sub-second settlements.

### Secondary: Ecosystem Integration

**Best Integration with Cronos Ecosystem**

- ✅ Uses Cronos Testnet (Chain ID 338)
- ✅ Integrates devUSDC.e (Stargate bridged USDC)
- ✅ Leverages x402 Facilitator by Cronos Labs
- ✅ Prize pool mechanics drive USDC circulation
- ✅ Demonstrates real-world consumer application

---

## Why This Project Matters

### For the Cronos Ecosystem

- **Proves x402 viability** with production-ready reference implementation
- **Drives USDC adoption** through micropayment use case
- **Onboards casual gamers** to Cronos blockchain
- **Demonstrates consumer-ready UX** (no Web3 jargon)

### For Developers

- **Complete x402 example** with custom middleware and facilitator integration
- **Reusable patterns** for micropayment applications
- **Security best practices** for production deployment
- **Comprehensive documentation** and code comments

### For Players

- **Zero barrier to entry** - just connect wallet and play
- **Fair competition** - penny pricing means anyone can compete
- **Real prizes** - 70% of all payments fund daily jackpots
- **Instant gratification** - no waiting for block confirmations

---

## Future Roadmap

- [ ] Mainnet deployment with production USDC
- [ ] Additional games (Breakout, Flappy Bird, etc.)
- [ ] Tournaments with larger prize pools
- [ ] NFT achievements for high scores
- [ ] Social features (challenges, replays)
- [ ] Mobile app (React Native)

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with tests
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- **Cronos Labs** for the x402 Protocol and facilitator infrastructure
- **Cronos Hackathon** organizers and community
- **Phantom Wallet** and **Linear App** for design inspiration
- All open-source contributors and testers

---

## Links

- 🌐 **Live Demo**: https://x402arcade.vercel.app
- 📹 **Video Demo**: [Coming Soon]
- 📚 **Documentation**: [docs/](docs/)
- 🐛 **Issues**: https://github.com/Ayobalen/x402Arcade/issues
- 💬 **Telegram**: https://t.me/+a4jj5hyJl0NmMDll

---

**Built with ❤️ for the Cronos x402 Hackathon**
