# x402 Payment Flow Documentation

## Overview

x402Arcade uses the x402 HTTP payment protocol with EIP-3009 (transferWithAuthorization) for gasless USDC payments on Cronos Testnet.

## Architecture

```
┌──────────┐         ┌──────────┐         ┌─────────────┐         ┌────────────┐
│ Frontend │         │ Backend  │         │ Facilitator │         │ Blockchain │
└────┬─────┘         └────┬─────┘         └──────┬──────┘         └─────┬──────┘
     │                    │                       │                      │
     │ 1. POST /play      │                       │                      │
     ├───────────────────>│                       │                      │
     │                    │                       │                      │
     │ 2. 402 Payment     │                       │                      │
     │    Required        │                       │                      │
     │<───────────────────┤                       │                      │
     │                    │                       │                      │
     │ 3. Sign EIP-3009   │                       │                      │
     │    Authorization   │                       │                      │
     │    (Wallet)        │                       │                      │
     │                    │                       │                      │
     │ 4. POST /play      │                       │                      │
     │    + X-Payment     │                       │                      │
     ├───────────────────>│                       │                      │
     │                    │ 5. Verify Signature   │                      │
     │                    ├──────────────────────>│                      │
     │                    │                       │                      │
     │                    │ 6. Signature Valid    │                      │
     │                    │<──────────────────────┤                      │
     │                    │                       │                      │
     │                    │ 7. Settle Payment     │                      │
     │                    ├──────────────────────>│                      │
     │                    │                       │                      │
     │                    │                       │ 8. transferWithAuth  │
     │                    │                       ├─────────────────────>│
     │                    │                       │                      │
     │                    │                       │ 9. Transaction Hash  │
     │                    │                       │<─────────────────────┤
     │                    │ 10. Settlement Success│                      │
     │                    │<──────────────────────┤                      │
     │                    │                       │                      │
     │                    │ 11. Store session     │                      │
     │                    │     & mark nonce used │                      │
     │                    │                       │                      │
     │ 12. 201 Created    │                       │                      │
     │     + sessionId    │                       │                      │
     │<───────────────────┤                       │                      │
     │                    │                       │                      │
```

## Detailed Flow

### Step 1: Initial Request (Frontend → Backend)

**Request:**
```http
POST /api/v1/play/snake
Content-Type: application/json
```

**Response (402 Payment Required):**
```json
{
  "error": {
    "code": "PAYMENT_REQUIRED",
    "message": "Payment required to access this resource"
  },
  "paymentRequirements": {
    "scheme": "exact",
    "network": "cronos-testnet",
    "maxAmountRequired": "10000",
    "payTo": "0xadc87b0a9d300ef1bad6e46f276c552c15aa5386",
    "asset": "0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0",
    "resource": "/snake",
    "description": "Payment for /snake",
    "mimeType": "application/json",
    "maxTimeoutSeconds": 300
  }
}
```

### Step 2: Create Authorization (Frontend)

The frontend creates an EIP-3009 authorization message and prompts the user to sign it with their wallet.

**EIP-712 Typed Data:**
```typescript
{
  domain: {
    name: 'Bridged USDC (Stargate)',
    version: '1',
    chainId: 338,
    verifyingContract: '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0'
  },
  types: {
    TransferWithAuthorization: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' }
    ]
  },
  primaryType: 'TransferWithAuthorization',
  message: {
    from: '0xF10c1758196668cEe0e1c6c3CD85b1CBeD21C15b',
    to: '0xadc87b0a9d300ef1bad6e46f276c552c15aa5386',
    value: '10000',
    validAfter: '0',
    validBefore: '1769522208',
    nonce: '0x1604b2dbe5023a8223dfc5258309f0e326ddd2fecf4a4da73a2ef30323dec3db'
  }
}
```

**X-Payment Header Format:**
```json
{
  "x402Version": "1",
  "scheme": "exact",
  "network": "cronos-testnet",
  "payload": {
    "from": "0xF10c1758196668cEe0e1c6c3CD85b1CBeD21C15b",
    "to": "0xadc87b0a9d300ef1bad6e46f276c552c15aa5386",
    "value": "10000",
    "validAfter": "0",
    "validBefore": "1769522208",
    "nonce": "0x1604b2dbe5023a8223dfc5258309f0e326ddd2fecf4a4da73a2ef30323dec3db",
    "signature": "0xa3936d4d4834ecc83ba2337a691b5a48933dc8793724ae2102417c17e33258f1265bc2e59259bfb471328e3b4bf2d679add9a9bc3fb2cc93b62abe9aaaaccdae1b",
    "asset": "0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0"
  }
}
```

The header is then Base64-encoded and sent in the `X-Payment` HTTP header.

### Step 3: Payment Request (Frontend → Backend)

**Request:**
```http
POST /api/v1/play/snake
Content-Type: application/json
X-Payment: eyJ4NDAyVmVyc2lvbiI6IjEiLCJzY2hlbWUiOiJleGFjdC...
```

### Step 4: Verify Signature (Backend → Facilitator)

**Request to Facilitator:**
```http
POST https://facilitator.cronoslabs.org/v2/x402/verify
Content-Type: application/json
X402-Version: 1

{
  "x402Version": 1,
  "paymentHeader": "eyJ4NDAyVmVyc2lvbiI6IjEi...",
  "paymentRequirements": {
    "scheme": "exact",
    "network": "cronos-testnet",
    "maxAmountRequired": "10000",
    "payTo": "0xadc87b0a9d300ef1bad6e46f276c552c15aa5386",
    "asset": "0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0",
    "resource": "/snake",
    "description": "Payment for /snake",
    "mimeType": "application/json",
    "maxTimeoutSeconds": 300
  }
}
```

**Response:**
```json
{
  "isValid": true,
  "invalidReason": null
}
```

### Step 5: Settle Payment (Backend → Facilitator)

**Request to Facilitator:**
```http
POST https://facilitator.cronoslabs.org/v2/x402/settle
Content-Type: application/json
X402-Version: 1

{
  "x402Version": 1,
  "paymentHeader": "eyJ4NDAyVmVyc2lvbiI6IjEi...",
  "paymentRequirements": { ... }
}
```

**Success Response:**
```json
{
  "x402Version": 1,
  "event": "payment.settled",
  "network": "cronos-testnet",
  "timestamp": "2026-01-27T12:56:57.580Z",
  "txHash": "0x1234567890abcdef...",
  "blockNumber": 12345678
}
```

**Failure Response:**
```json
{
  "x402Version": 1,
  "event": "payment.failed",
  "network": "cronos-testnet",
  "timestamp": "2026-01-27T12:56:57.580Z",
  "error": "execution reverted: \"ERC20: transfer amount exceeds balance\""
}
```

### Step 6: Success Response (Backend → Frontend)

```json
{
  "success": true,
  "sessionId": "94e0b0ee-8897-4532-9743-47885c66e9cc"
}
```

## Error Handling

### Common Error Codes

| Error Code | HTTP Status | Meaning | User Message |
|------------|-------------|---------|--------------|
| `INSUFFICIENT_BALANCE` | 502 | Wallet doesn't have enough USDC | 💰 Insufficient USDC balance. Please add testnet USDC to your wallet to play. |
| `INVALID_SIGNATURE` | 502 | Signature verification failed | 🔐 Payment signature verification failed. Please try again. |
| `NONCE_ALREADY_USED` | 400 | Authorization already used (replay attack prevention) | ⚠️ This payment authorization has already been used. Please refresh and try again. |
| `PAYMENT_REQUIRED` | 402 | Initial request without payment | Payment required to access this resource |
| `FACILITATOR_ERROR` | 502 | Generic facilitator error | Payment failed. Please try again. |

### Error Detection Logic (Backend)

```typescript
// packages/backend/src/server/x402/types.ts:1721-1750

// Parse facilitator response
const errorMsg = typeof response.error === 'string' ? response.error : 'Payment failed';

// Detect insufficient balance
if (errorMsg.toLowerCase().includes('exceeds balance') ||
    errorMsg.toLowerCase().includes('insufficient balance')) {
  return {
    success: false,
    errorCode: 'INSUFFICIENT_BALANCE',
    errorMessage: 'Insufficient USDC balance. Please add testnet USDC to your wallet.',
  };
}

// Detect invalid signature
if (errorMsg.toLowerCase().includes('invalid signature') ||
    errorMsg.toLowerCase().includes('signature verification failed')) {
  return {
    success: false,
    errorCode: 'INVALID_SIGNATURE',
    errorMessage: 'Payment signature verification failed. Please try again.',
  };
}
```

### Error Handling (Frontend)

```typescript
// packages/frontend/src/pages/Game/Game.tsx:264-285

if (!paymentResponse.ok) {
  const errorData = await paymentResponse.json();

  // Handle specific error codes with user-friendly messages
  if (errorData.error?.code === 'INSUFFICIENT_BALANCE') {
    throw new Error(
      '💰 Insufficient USDC balance. Please add testnet USDC to your wallet to play.'
    );
  }

  if (errorData.error?.code === 'INVALID_SIGNATURE') {
    throw new Error(
      '🔐 Payment signature verification failed. Please try again.'
    );
  }

  if (errorData.error?.code === 'NONCE_ALREADY_USED') {
    throw new Error(
      '⚠️ This payment authorization has already been used. Please refresh and try again.'
    );
  }

  // Default error message
  throw new Error(errorData.error?.message || errorData.message || 'Payment failed');
}
```

## Prerequisites

### For Users

1. **Wallet Connection**
   - MetaMask or compatible Web3 wallet
   - Connected to Cronos Testnet (Chain ID: 338)

2. **Testnet Tokens**
   - **TCRO**: For gas fees ([Get from faucet](https://cronos.org/faucet))
   - **devUSDC.e**: For game payments (0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0)

3. **Sufficient Balance**
   - Minimum 0.01 USDC (10,000 in smallest units) per game

### For Developers

1. **Backend Environment Variables**
```env
# Facilitator URL (optional, defaults to Cronos Testnet)
FACILITATOR_URL=https://facilitator.cronoslabs.org

# Redis for nonce tracking
REDIS_URL=redis://localhost:6379

# CORS origins
CORS_ORIGIN=http://localhost:3000,http://localhost:3002
```

2. **Frontend Configuration**
```typescript
// src/config/chain.ts
export const CRONOS_TESTNET_CHAIN_ID = 338;
export const USDC_CONTRACT_ADDRESS = '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0';

// src/config/eip3009.ts
export const USDC_NAME = 'Bridged USDC (Stargate)';
export const USDC_VERSION = '1';
```

## Testing

### Manual Testing Steps

1. **Start Local Development**
```bash
# Terminal 1: Backend
cd packages/backend
pnpm run dev

# Terminal 2: Frontend
cd packages/frontend
pnpm run dev
```

2. **Connect Wallet**
   - Open http://localhost:3002
   - Connect MetaMask to Cronos Testnet
   - Ensure wallet has TCRO and USDC

3. **Attempt Payment**
   - Click "Pay & Play" button
   - Sign the EIP-712 message in MetaMask
   - Wait for payment processing (~2-3 seconds)
   - Game should start on success

### Automated Testing

```bash
# Test payment with pre-signed authorization
cd /Users/mujeeb/projects/x402Arcade
node test_payment.mjs
```

## Debugging

### Enable Debug Logging

Backend logs show detailed payment flow:

```
[x402] Verify request to facilitator: { url, request }
[x402] Facilitator response: { status, ok, body }
[x402] Settle request to facilitator: { url, request }
[x402] Settlement response: { status, ok, body }
```

### Check Backend Logs

```bash
tail -f /tmp/backend_final.log
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| 502 Insufficient Balance | Wallet lacks USDC | Get testnet USDC |
| 502 Facilitator Error | Network/API issue | Check facilitator status |
| 400 Nonce Used | Authorization reused | Generate new authorization |
| 400 Invalid Signature | Wrong domain/network | Verify EIP-712 domain |
| CORS Error | Origin not whitelisted | Add origin to CORS_ORIGIN |

## Security Considerations

1. **Nonce Replay Protection**
   - Each nonce can only be used once
   - Nonces are stored in Redis with expiry
   - Checked before settlement

2. **Signature Verification**
   - Facilitator verifies EIP-712 signature
   - Ensures authorization is from token holder
   - Validates signature components (v, r, s)

3. **Amount Validation**
   - Backend enforces exact payment amounts
   - No overpayment or underpayment allowed
   - Validated against game pricing

4. **Time Windows**
   - Authorizations have validAfter/validBefore timestamps
   - Default: valid for 5 minutes
   - Prevents old authorizations from being used

## Key Files

### Backend
- `packages/backend/src/server/middleware/x402.ts` - Payment middleware
- `packages/backend/src/server/x402/types.ts` - Type definitions and parsing
- `packages/backend/src/routes/game/play.ts` - Game session creation

### Frontend
- `packages/frontend/src/config/x402Client.ts` - Payment header creation
- `packages/frontend/src/config/eip3009.ts` - EIP-3009 types and utilities
- `packages/frontend/src/hooks/useX402.ts` - Payment authorization hook
- `packages/frontend/src/pages/Game/Game.tsx` - Payment UI and flow

## References

- [x402 Protocol Documentation](https://docs.cronos.org/x402)
- [EIP-3009: Transfer With Authorization](https://eips.ethereum.org/EIPS/eip-3009)
- [EIP-712: Typed structured data hashing and signing](https://eips.ethereum.org/EIPS/eip-712)
- [Cronos Testnet Documentation](https://docs.cronos.org/for-users/testnet-faucet)
