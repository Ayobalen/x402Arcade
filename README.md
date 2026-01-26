# x402Arcade

> "Insert a Penny, Play for Glory"

A gasless arcade gaming platform on Cronos blockchain using x402 protocol for micropayments. Players pay $0.01-$0.02 USDC per game with zero gas fees, competing for daily prize pools on leaderboards.

Built for the **Cronos x402 Hackathon** – Main Track + Ecosystem Integration.

## Why x402 Changes Everything

Traditional blockchain makes $0.01 games **economically impossible**. Gas fees cost 50-200x more than the game itself:

| Payment Method             | Cost Per $0.01 Game                            | Settlement Time | Player Experience             |
| -------------------------- | ---------------------------------------------- | --------------- | ----------------------------- |
| **Traditional Blockchain** | $0.01 game + $0.50-$2.00 gas = **$0.51-$2.01** | 5-30 seconds    | "Waiting for confirmation..." |
| **x402 Protocol**          | $0.01 game + $0.00 gas = **$0.01**             | <1 second       | Instant gameplay              |

**The Result:** x402 enables **50x-200x cost reduction**, making micropayment gaming viable for the first time on blockchain.

### Perfect Product-Market Fit

Arcade gaming requires:

- ✅ **Micropayments at scale** - Players make 10-100 payments per session
- ✅ **Instant gratification** - No "waiting for block confirmation" screens
- ✅ **True pay-per-play** - No deposits, no bulk purchases, just pennies
- ✅ **Repeatable transactions** - EIP-3009 signatures enable seamless replays

x402 is the **only technology** that makes this economically viable.

## Features

- **Pay a penny** ($0.01-$0.02 USDC per game)
- **Play instantly** (game starts in <1 second after payment)
- **Compete for glory** (daily prize pools, leaderboards)
- **Zero gas** (x402 facilitator covers all gas costs)

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Zustand
- **Backend**: Express.js, TypeScript, SQLite, Zod
- **Blockchain**: Cronos (EVM), x402 Protocol, EIP-3009

## Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0 (recommended) or npm
- **Git**

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/x402arcade.git
   cd x402arcade
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables** (see [Environment Setup](#environment-setup))

4. **Start development servers**

   ```bash
   # Start backend server (port 3001)
   pnpm dev:backend

   # In another terminal, start frontend (port 5173)
   pnpm dev:frontend
   ```

5. **Open the app**
   Navigate to [http://localhost:5173](http://localhost:5173)

## Environment Setup

### Backend Environment

1. Copy the example environment file:

   ```bash
   cp packages/backend/.env.example packages/backend/.env
   ```

2. Update the values in `packages/backend/.env`:

   | Variable                | Description                          | Default                              |
   | ----------------------- | ------------------------------------ | ------------------------------------ |
   | `NODE_ENV`              | Environment mode                     | `development`                        |
   | `PORT`                  | Server port                          | `3001`                               |
   | `DATABASE_PATH`         | SQLite database path                 | `./data/arcade.db`                   |
   | `JWT_SECRET`            | Secret for JWT tokens (min 32 chars) | **Required**                         |
   | `CORS_ORIGIN`           | Allowed CORS origin                  | `http://localhost:5173`              |
   | `CHAIN_ID`              | Blockchain network ID                | `338` (Cronos Testnet)               |
   | `RPC_URL`               | Blockchain RPC endpoint              | `https://evm-t3.cronos.org/`         |
   | `FACILITATOR_URL`       | x402 Facilitator URL                 | `https://facilitator.cronoslabs.org` |
   | `ARCADE_WALLET_ADDRESS` | Wallet receiving payments            | Optional                             |
   | `ARCADE_PRIVATE_KEY`    | Wallet private key (for prizes)      | Optional                             |

### Frontend Environment

1. Copy the example environment file:

   ```bash
   cp packages/frontend/.env.example packages/frontend/.env
   ```

2. Update the values in `packages/frontend/.env`:

   | Variable                        | Description              | Default                              |
   | ------------------------------- | ------------------------ | ------------------------------------ |
   | `VITE_API_URL`                  | Backend API URL          | `http://localhost:3001`              |
   | `VITE_CHAIN_ID`                 | Blockchain network ID    | `338` (Cronos Testnet)               |
   | `VITE_RPC_URL`                  | Blockchain RPC endpoint  | `https://evm-t3.cronos.org/`         |
   | `VITE_USDC_ADDRESS`             | USDC contract address    | Cronos Testnet devUSDC.e             |
   | `VITE_FACILITATOR_URL`          | x402 Facilitator URL     | `https://facilitator.cronoslabs.org` |
   | `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID | Optional                             |

### Getting Test Tokens

For development on Cronos Testnet (Chain ID: 338):

1. **TCRO (gas tokens)**: https://cronos.org/faucet
2. **devUSDC.e (test USDC)**: https://faucet.cronos.org/

> **Note**: Faucets have 24hr limits. If stuck, ask in Telegram: https://t.me/+a4jj5hyJl0NmMDll

## Project Structure

```
x402arcade/
├── packages/
│   ├── backend/           # Express.js API server
│   │   ├── src/
│   │   │   ├── config/    # Environment & chain config
│   │   │   ├── db/        # Database setup
│   │   │   ├── lib/       # Shared utilities
│   │   │   ├── server/    # Express middleware & routes
│   │   │   └── services/  # Business logic
│   │   └── package.json
│   ├── frontend/          # React SPA
│   │   ├── src/
│   │   │   ├── assets/    # Static files
│   │   │   ├── components/# UI components
│   │   │   ├── config/    # App configuration
│   │   │   ├── games/     # Game implementations
│   │   │   ├── hooks/     # React hooks
│   │   │   ├── lib/       # Utilities
│   │   │   └── stores/    # Zustand stores
│   │   └── package.json
│   └── shared/            # Shared types & constants
├── package.json           # Root monorepo config
└── README.md              # This file
```

## Available Scripts

### Root (Monorepo)

| Script                | Description                    |
| --------------------- | ------------------------------ |
| `pnpm dev:frontend`   | Start frontend dev server      |
| `pnpm dev:backend`    | Start backend dev server       |
| `pnpm build:frontend` | Build frontend for production  |
| `pnpm build:backend`  | Build backend for production   |
| `pnpm test:frontend`  | Run frontend tests             |
| `pnpm test:backend`   | Run backend tests              |
| `pnpm lint`           | Lint all packages              |
| `pnpm format`         | Format code with Prettier      |
| `pnpm storybook`      | Start Storybook component docs |

## x402 Payment Flow

1. Player clicks "Play" button
2. Frontend sends `POST /api/play`
3. Backend returns `402 Payment Required` + payment requirements
4. Player signs EIP-3009 authorization (gasless)
5. Frontend sends `POST /api/play` + `X-Payment` header
6. Backend settles payment via x402 Facilitator
7. Facilitator transfers USDC on-chain
8. Backend returns `200 OK` with game session
9. Game starts!

## Troubleshooting

### Common Issues

**❌ "Environment validation failed: JWT_SECRET must be at least 32 characters"**

- Generate a secure JWT secret: `openssl rand -base64 32`
- Add it to `packages/backend/.env`

**❌ "CORS error: origin not allowed"**

- Ensure `CORS_ORIGIN` in backend `.env` matches your frontend URL
- Default is `http://localhost:5173`

**❌ "Cannot connect to wallet"**

- Make sure MetaMask or compatible wallet is installed
- Switch to Cronos Testnet (Chain ID: 338)
- Get test TCRO from the faucet

**❌ "Payment failed: insufficient balance"**

- Get test devUSDC.e from https://faucet.cronos.org/
- Approve USDC spending for x402 protocol

**❌ "Database error: no such table"**

- The database initializes automatically on first run
- If issues persist, delete `packages/backend/data/arcade.db` and restart

### Debug Mode

Enable debug logging:

**Frontend**: Add `VITE_DEBUG=true` to `.env`

**Backend**: Set `LOG_LEVEL=debug` in `.env`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Cronos Labs for the x402 Protocol
- The Cronos Hackathon community
