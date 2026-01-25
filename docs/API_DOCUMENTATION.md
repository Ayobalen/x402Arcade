# x402Arcade API Documentation

Complete API reference and integration guide for the x402Arcade platform.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [x402 Payment Flow](#x402-payment-flow)
- [API Reference](#api-reference)
  - [Health Endpoints](#health-endpoints)
  - [Play Endpoints](#play-endpoints)
  - [Score Endpoints](#score-endpoints)
  - [Leaderboard Endpoints](#leaderboard-endpoints)
  - [Prize Pool Endpoints](#prize-pool-endpoints)
  - [Jobs Endpoints](#jobs-endpoints-admin)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Code Examples](#code-examples)
- [Testing](#testing)

---

## Overview

x402Arcade is a gasless arcade gaming platform on Cronos blockchain using the x402 protocol for micropayments.

### Base URLs

| Environment | URL |
|-------------|-----|
| Local Development | `http://localhost:3001` |
| Production | `https://api.x402arcade.com` |

### Content Type

All API endpoints accept and return JSON:

```
Content-Type: application/json
```

### API Versioning

The API uses URL path versioning. Current version: `v1`

```
/api/v1/play
/api/v1/score
/api/v1/leaderboard
/api/v1/prize
```

---

## Getting Started

### Quick Start

1. **Check API health:**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Get API info:**
   ```bash
   curl http://localhost:3001/api
   ```

3. **Play a game (get payment requirements):**
   ```bash
   curl -X POST http://localhost:3001/api/v1/play/snake
   ```

4. **Get leaderboard:**
   ```bash
   curl http://localhost:3001/api/v1/leaderboard/snake/daily
   ```

---

## Authentication

x402Arcade uses the **x402 payment protocol** for game session creation. No traditional authentication (API keys, OAuth) is required for public endpoints.

### Public Endpoints (No Auth)
- `/health/*` - Health checks
- `/api` - API info
- `/api/v1/leaderboard/*` - Leaderboards
- `/api/v1/prize/*` - Prize pools

### Payment-Protected Endpoints
- `/api/v1/play/*` - Requires x402 payment

---

## x402 Payment Flow

The x402 protocol enables gasless micropayments for playing games.

### Flow Diagram

```
┌─────────┐       ┌─────────┐       ┌──────────────┐       ┌────────────┐
│ Player  │       │ Frontend│       │   Backend    │       │ Facilitator│
└────┬────┘       └────┬────┘       └──────┬───────┘       └─────┬──────┘
     │   Click Play    │                   │                     │
     ├────────────────>│                   │                     │
     │                 │  POST /play/snake │                     │
     │                 ├──────────────────>│                     │
     │                 │                   │                     │
     │                 │  402 + Payment    │                     │
     │                 │  Requirements     │                     │
     │                 │<──────────────────┤                     │
     │                 │                   │                     │
     │  Sign EIP-3009  │                   │                     │
     │<────────────────┤                   │                     │
     │  Authorization  │                   │                     │
     ├────────────────>│                   │                     │
     │                 │                   │                     │
     │                 │  POST /play/snake │                     │
     │                 │  + X-Payment hdr  │                     │
     │                 ├──────────────────>│                     │
     │                 │                   │                     │
     │                 │                   │  Settle Payment     │
     │                 │                   ├────────────────────>│
     │                 │                   │                     │
     │                 │                   │  Transaction Hash   │
     │                 │                   │<────────────────────┤
     │                 │                   │                     │
     │                 │  201 + sessionId  │                     │
     │                 │<──────────────────┤                     │
     │                 │                   │                     │
     │  Start Game!    │                   │                     │
     │<────────────────┤                   │                     │
```

### Step-by-Step

#### 1. Request Payment Requirements

```bash
curl -X POST http://localhost:3001/api/v1/play/snake
```

Response (402 Payment Required):
```json
{
  "error": "Payment required",
  "message": "Payment is required to play this game",
  "paymentInfo": {
    "amount": "10000",
    "amountUsdc": "0.01",
    "currency": "USDC",
    "recipient": "0x...",
    "network": "Cronos Testnet",
    "chainId": 338
  }
}
```

The `X-Payment-Required` header contains base64-encoded payment details.

#### 2. Sign EIP-3009 Authorization

Using your wallet, sign an EIP-3009 `transferWithAuthorization` message:

```typescript
import { signTypedData } from 'viem/accounts';

const domain = {
  name: 'Bridged USDC (Stargate)',
  version: '1',
  chainId: 338,
  verifyingContract: '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0',
};

const types = {
  TransferWithAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' },
  ],
};

const message = {
  from: playerAddress,
  to: arcadeWallet,
  value: 10000n, // 0.01 USDC (6 decimals)
  validAfter: 0n,
  validBefore: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour
  nonce: crypto.randomBytes(32),
};

const signature = await signTypedData({ domain, types, primaryType: 'TransferWithAuthorization', message });
```

#### 3. Submit Payment and Create Session

```bash
curl -X POST http://localhost:3001/api/v1/play/snake \
  -H "Content-Type: application/json" \
  -H "X-Payment: eyJzaWduYXR1cmUiOiIweC4uLiIsLi4ufQ=="
```

Response (201 Created):
```json
{
  "success": true,
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "session": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "gameType": "snake",
    "playerAddress": "0x1234...",
    "status": "active",
    "createdAt": "2026-01-25T12:00:00.000Z"
  }
}
```

---

## API Reference

### Health Endpoints

#### GET /health
Basic health check for load balancers.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-25T12:00:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "environment": "production",
  "checks": {
    "database": {
      "status": "ok",
      "responseTime": 5,
      "details": {
        "sessions": 1523,
        "leaderboard": 8934
      }
    }
  }
}
```

#### GET /health/detailed
Comprehensive health check with external service checks.

#### GET /health/ready
Kubernetes/Railway readiness probe. Returns 200 if ready, 503 if not.

#### GET /health/live
Kubernetes/Railway liveness probe. Returns 200 if alive.

---

### Play Endpoints

#### POST /api/v1/play/:gameType
Create a new game session with x402 payment.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| gameType | string | `snake`, `tetris`, `pong`, `breakout`, `space-invaders` |

**Game Prices:**
| Game | Price (USDC) |
|------|--------------|
| Snake | $0.01 |
| Tetris | $0.02 |
| Pong | $0.01 |
| Breakout | $0.015 |
| Space Invaders | $0.025 |

**Response Codes:**
| Code | Description |
|------|-------------|
| 201 | Session created successfully |
| 400 | Invalid game type |
| 402 | Payment required |
| 409 | Payment already used |
| 501 | Game not yet implemented |

---

### Score Endpoints

#### POST /api/v1/score/submit
Submit a score for a completed game session.

**Request Body:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "score": 1500,
  "playerAddress": "0x1234567890123456789012345678901234567890"
}
```

**Response:**
```json
{
  "message": "Score submitted successfully",
  "session": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "gameType": "snake",
    "status": "completed",
    "score": 1500,
    "completedAt": "2026-01-25T12:15:00.000Z",
    "gameDurationMs": 300000
  },
  "rankings": {
    "daily": { "rank": 5, "score": 1500, "totalPlayers": 120 },
    "weekly": { "rank": 23, "score": 1500, "totalPlayers": 450 },
    "alltime": { "rank": 156, "score": 1500, "totalPlayers": 2300 }
  }
}
```

**Validation Rules:**
- `sessionId`: Required, valid UUID
- `score`: Required, non-negative integer
- `playerAddress`: Required, valid Ethereum address (0x + 40 hex chars)
- Session must be in `active` status
- Player must own the session

**Response Codes:**
| Code | Description |
|------|-------------|
| 200 | Score submitted successfully |
| 400 | Validation error |
| 404 | Session not found |
| 409 | Session already completed |

---

### Leaderboard Endpoints

#### GET /api/v1/leaderboard/:gameType/:periodType
Get leaderboard rankings.

**Path Parameters:**
| Parameter | Type | Values |
|-----------|------|--------|
| gameType | string | `snake`, `tetris`, `pong`, `breakout`, `space-invaders` |
| periodType | string | `daily`, `weekly`, `alltime` |

**Query Parameters:**
| Parameter | Type | Default | Max |
|-----------|------|---------|-----|
| limit | integer | 10 | 100 |
| offset | integer | 0 | - |

**Example:**
```bash
curl "http://localhost:3001/api/v1/leaderboard/snake/daily?limit=5&offset=0"
```

**Response:**
```json
{
  "gameType": "snake",
  "periodType": "daily",
  "limit": 5,
  "offset": 0,
  "count": 5,
  "entries": [
    {
      "sessionId": "550e8400-e29b-41d4-a716-446655440000",
      "playerAddress": "0x1234...",
      "score": 2500,
      "rank": 1,
      "createdAt": "2026-01-25T10:30:00.000Z"
    }
  ]
}
```

**Caching:**
Responses are cached for 30 seconds:
```
Cache-Control: public, max-age=30, s-maxage=30
```

---

### Prize Pool Endpoints

#### GET /api/v1/prize/:gameType/:periodType
Get current prize pool.

**Path Parameters:**
| Parameter | Type | Values |
|-----------|------|--------|
| gameType | string | `snake`, `tetris`, `pong`, `breakout`, `space-invaders` |
| periodType | string | `daily`, `weekly` (no alltime) |

**Response:**
```json
{
  "pool": {
    "id": 1,
    "gameType": "snake",
    "periodType": "daily",
    "periodDate": "2026-01-25",
    "totalAmountUsdc": 2.45,
    "totalGames": 350,
    "status": "active",
    "winnerAddress": null,
    "payoutTxHash": null,
    "createdAt": "2026-01-25T00:00:00.000Z",
    "finalizedAt": null
  }
}
```

#### GET /api/v1/prize/:gameType/history
Get prize pool history.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| periodType | string | - | Filter by `daily` or `weekly` |
| limit | integer | 10 | Max 100 |
| offset | integer | 0 | Pagination offset |

---

### Jobs Endpoints (Admin)

#### GET /api/jobs/status
Get job scheduler status.

#### GET /api/jobs/history
Get job execution history.

**Query Parameters:**
| Parameter | Type | Default | Max |
|-----------|------|---------|-----|
| limit | integer | 20 | 100 |

#### POST /api/jobs/trigger/:jobName
Manually trigger a background job.

**Path Parameters:**
| Parameter | Values |
|-----------|--------|
| jobName | `prizepool`, `leaderboard`, `cleanup` |

---

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Error type",
  "message": "Human-readable description",
  "code": "OPTIONAL_ERROR_CODE"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 402 | Payment Required |
| 404 | Not Found |
| 409 | Conflict (duplicate payment, completed session) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |
| 501 | Not Implemented |
| 503 | Service Unavailable |

### Common Error Codes

| Code | Description |
|------|-------------|
| INVALID_SCORE | Score validation failed |
| INVALID_ADDRESS | Ethereum address format invalid |
| SESSION_NOT_FOUND | Game session does not exist |
| SESSION_COMPLETED | Session already has a score |

---

## Rate Limiting

API requests are rate-limited per IP address.

**Default Limits:**
- 100 requests per 15 minutes

**Rate Limit Headers:**
```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1706184000
```

**When Rate Limited:**
```json
{
  "error": "Too Many Requests",
  "message": "Too many requests from this IP, please try again later."
}
```

---

## Code Examples

### JavaScript/TypeScript (Frontend)

```typescript
// Play a game
async function playGame(gameType: string) {
  // Step 1: Get payment requirements
  const res1 = await fetch(`${API_URL}/api/v1/play/${gameType}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (res1.status === 402) {
    const paymentInfo = await res1.json();

    // Step 2: Sign payment authorization
    const signature = await signPayment(paymentInfo);

    // Step 3: Submit payment
    const res2 = await fetch(`${API_URL}/api/v1/play/${gameType}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Payment': btoa(JSON.stringify(signature)),
      },
    });

    return await res2.json();
  }
}

// Submit score
async function submitScore(sessionId: string, score: number, playerAddress: string) {
  const response = await fetch(`${API_URL}/api/v1/score/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, score, playerAddress }),
  });

  return await response.json();
}

// Get leaderboard
async function getLeaderboard(gameType: string, period: string = 'daily') {
  const response = await fetch(
    `${API_URL}/api/v1/leaderboard/${gameType}/${period}?limit=10`
  );
  return await response.json();
}
```

### Python

```python
import requests
import base64
import json

API_URL = "http://localhost:3001"

# Get leaderboard
def get_leaderboard(game_type: str, period: str = "daily", limit: int = 10):
    response = requests.get(
        f"{API_URL}/api/v1/leaderboard/{game_type}/{period}",
        params={"limit": limit}
    )
    return response.json()

# Submit score
def submit_score(session_id: str, score: int, player_address: str):
    response = requests.post(
        f"{API_URL}/api/v1/score/submit",
        json={
            "sessionId": session_id,
            "score": score,
            "playerAddress": player_address
        }
    )
    return response.json()

# Get prize pool
def get_prize_pool(game_type: str, period: str = "daily"):
    response = requests.get(f"{API_URL}/api/v1/prize/{game_type}/{period}")
    return response.json()

# Example usage
if __name__ == "__main__":
    leaderboard = get_leaderboard("snake", "daily", 5)
    print(f"Top 5 Snake players today: {leaderboard}")
```

### cURL

```bash
# Health check
curl http://localhost:3001/health

# Get leaderboard
curl "http://localhost:3001/api/v1/leaderboard/snake/daily?limit=10"

# Get prize pool
curl http://localhost:3001/api/v1/prize/snake/daily

# Submit score
curl -X POST http://localhost:3001/api/v1/score/submit \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"550e8400-e29b-41d4-a716-446655440000","score":1500,"playerAddress":"0x1234567890123456789012345678901234567890"}'
```

---

## Testing

### Using Postman

1. Import the Postman collection: `packages/backend/src/x402arcade.postman_collection.json`
2. Set environment variables:
   - `baseUrl`: `http://localhost:3001`
   - `playerAddress`: Your test wallet address
3. Run the collection

### Using OpenAPI/Swagger

The OpenAPI specification is available at:
- File: `packages/backend/src/openapi.yaml`
- Can be viewed in Swagger UI or imported into API tools

### Running Integration Tests

```bash
cd packages/backend
npm test
```

---

## Support

- **GitHub Issues**: [x402arcade/issues](https://github.com/x402arcade/x402arcade/issues)
- **Telegram**: [https://t.me/x402arcade](https://t.me/x402arcade)
- **Documentation**: [docs.x402arcade.com](https://docs.x402arcade.com)
