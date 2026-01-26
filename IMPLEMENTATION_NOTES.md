# x402 Payment Implementation Guide

## Two Valid Approaches for Cronos x402 Hackathon

---

## Approach 1: Custom Implementation (Current)

**Status:** ✅ Recommended - Shows technical depth
**Complexity:** Medium
**Control:** Full control over payment flow

### Architecture

```
Frontend -> Custom Middleware -> Cronos Facilitator API
```

### Key Files

1. **Frontend Payment Header Creation**
   - `/packages/frontend/src/config/x402Client.ts`
   - Creates EIP-3009 signatures
   - Encodes payment headers

2. **Backend Middleware**
   - `/packages/backend/src/server/middleware/x402.ts`
   - Returns 402 with payment requirements
   - Verifies and settles with facilitator

3. **Type Definitions**
   - `/packages/backend/src/server/x402/types.ts`
   - Settlement request/response types
   - Payment parsing utilities

### Critical Fixes Needed (4 bugs identified)

#### Bug #1: Payment Header Structure

**Location:** `/packages/frontend/src/config/x402Client.ts` lines 670-695

**Current (WRONG):**

```typescript
{
  x402Version: 1,
  scheme: "exact",
  network: "cronos-testnet",
  payload: {
    message: {              // ❌ Extra wrapper
      from: "0x...",
      to: "0x...",
      value: "10000",
      validAfter: 0,
      validBefore: 1234567890,
      nonce: "0x..."
    },
    v: 28,                  // ❌ Split signature
    r: "0x...",
    s: "0x..."
  }
}
```

**Should Be (CORRECT):**

```typescript
{
  x402Version: 1,
  scheme: "exact",
  network: "cronos-testnet",
  payload: {
    from: "0x...",         // ✅ Flat structure
    to: "0x...",
    value: "10000",
    validAfter: 0,
    validBefore: 1234567890,
    nonce: "0x...",
    signature: "0x...",    // ✅ Combined signature
    asset: "0x..."         // ✅ Token contract
  }
}
```

#### Bug #2: Chain ID Type

**Location:** Frontend EIP-3009 signing

**Current:** `chainId: 338` (number)
**Should Be:** `chainId: "338"` (string)

#### Bug #3: Missing Verify Step

**Location:** `/packages/backend/src/server/middleware/x402.ts`

Working implementation calls TWO endpoints:

1. `POST /v2/x402/verify` - Validates payment
2. `POST /v2/x402/settle` - Executes payment

**We're only calling settle!**

#### Bug #4: Wrong Success Event Check

**Location:** `/packages/backend/src/server/x402/types.ts` line 1717

**Current:** `event === 'payment.success'`
**Should Be:** `event === 'payment.settled'`

### Working Reference Implementation

**Source:** https://github.com/0731jiangyujilv/paycronos

- `/lib/settlement/cronos-x402.ts` - Settlement provider
- `/lib/x402/facilitator.ts` - Facilitator client
- `/cronos-x402/seller.js` - Express server example

---

## Approach 2: Using Crypto.com SDK (Fallback)

**Status:** ⚠️ Backup option if custom implementation fails
**Complexity:** Low
**Control:** Limited (black box)

### Installation

```bash
npm install @crypto.com/facilitator-client
```

### Basic Usage

```typescript
import { FacilitatorClient } from '@crypto.com/facilitator-client';

const client = new FacilitatorClient({
  facilitatorUrl: 'https://facilitator.cronoslabs.org',
  network: 'cronos-testnet', // or 'cronos-mainnet'
});

// In your Express middleware
app.get('/api/premium', async (req, res) => {
  const paymentHeader = req.headers['x-payment'];

  if (!paymentHeader) {
    // Return 402 with payment requirements
    return res.status(402).json({
      x402Version: 1,
      paymentRequirements: {
        scheme: 'exact',
        network: 'cronos-testnet',
        payTo: YOUR_WALLET_ADDRESS,
        asset: '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0', // devUSDC.e
        maxAmountRequired: '10000', // 0.01 USDC
        description: 'Premium API access',
        mimeType: 'application/json',
        maxTimeoutSeconds: 300,
      },
    });
  }

  try {
    // Verify and settle payment using SDK
    const result = await client.settlePayment({
      paymentHeader,
      paymentRequirements: {
        scheme: 'exact',
        network: 'cronos-testnet',
        payTo: YOUR_WALLET_ADDRESS,
        asset: '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0',
        maxAmountRequired: '10000',
        description: 'Premium API access',
        mimeType: 'application/json',
        maxTimeoutSeconds: 300,
      },
    });

    if (result.success) {
      res.json({
        data: 'Your premium content',
        payment: {
          txHash: result.transactionHash,
          blockNumber: result.blockNumber,
        },
      });
    } else {
      res.status(402).json({
        error: 'Payment failed',
        reason: result.error,
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Pros & Cons

**Pros:**

- ✅ Simpler to implement
- ✅ Maintained by Crypto.com
- ✅ Handles edge cases automatically

**Cons:**

- ❌ Less control over payment flow
- ❌ Less impressive to judges (black box)
- ❌ Harder to debug issues
- ❌ May not demonstrate deep technical understanding

### When to Use SDK

Use the SDK approach if:

1. Custom implementation continues to fail after fixes
2. Running out of time before deadline
3. Need quick proof-of-concept
4. Focus is on application logic, not payment infrastructure

---

## Cronos Facilitator API Reference

### Endpoints

```
Base URL: https://facilitator.cronoslabs.org
```

#### 1. Verify Payment

```http
POST /v2/x402/verify
Content-Type: application/json

{
  "x402Version": 1,
  "paymentHeader": "<base64-encoded-header>",
  "paymentRequirements": {
    "scheme": "exact",
    "network": "cronos-testnet",
    "payTo": "0x...",
    "asset": "0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0",
    "maxAmountRequired": "10000",
    "description": "...",
    "mimeType": "application/json",
    "maxTimeoutSeconds": 300
  }
}

Response:
{
  "isValid": true,
  "invalidReason": null
}
```

#### 2. Settle Payment

```http
POST /v2/x402/settle
Content-Type: application/json

{
  "x402Version": 1,
  "paymentHeader": "<base64-encoded-header>",
  "paymentRequirements": { ... }
}

Response (Success):
{
  "event": "payment.settled",
  "txHash": "0x...",
  "from": "0x...",
  "to": "0x...",
  "value": "10000",
  "blockNumber": 12345,
  "timestamp": 1234567890
}

Response (Failure):
{
  "event": "payment.failed",
  "error": "Error description"
}
```

#### 3. Check Supported Assets

```http
GET /v2/x402/supported

Response:
{
  "networks": ["cronos-testnet", "cronos-mainnet"],
  "assets": {
    "cronos-testnet": [
      "0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0" // devUSDC.e
    ]
  }
}
```

---

## Network Configuration

### Cronos Testnet (Chain ID 338)

```typescript
const CRONOS_TESTNET = {
  chainId: '338', // ⚠️ STRING not number!
  rpcUrl: 'https://evm-t3.cronos.org',
  explorerUrl: 'https://explorer.cronos.org/testnet',
  facilitatorUrl: 'https://facilitator.cronoslabs.org',

  usdc: {
    address: '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0',
    name: 'Bridged USDC (Stargate)',
    symbol: 'devUSDC.e',
    decimals: 6,
    domainVersion: '1', // ⚠️ Testnet uses "1"
  },
};
```

### Cronos Mainnet (Chain ID 25)

```typescript
const CRONOS_MAINNET = {
  chainId: '25',
  rpcUrl: 'https://evm.cronos.org',
  explorerUrl: 'https://explorer.cronos.org',
  facilitatorUrl: 'https://facilitator.cronoslabs.org',

  usdc: {
    address: '0xc21223249CA28397B4B6541dfFaEcC539BfF0c59', // Different!
    name: 'USD Coin',
    symbol: 'USDC.e',
    decimals: 6,
    domainVersion: '2', // ⚠️ Mainnet uses "2"
  },
};
```

---

## EIP-3009 Signature Format

### Domain

```typescript
const domain = {
  name: 'Bridged USDC (Stargate)', // Must match token name
  version: '1', // "1" for testnet, "2" for mainnet
  chainId: '338', // STRING not number!
  verifyingContract: '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0',
};
```

### Types

```typescript
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
```

### Message

```typescript
const message = {
  from: walletAddress,
  to: merchantAddress,
  value: '10000', // 0.01 USDC (6 decimals)
  validAfter: 0,
  validBefore: Math.floor(Date.now() / 1000) + 300, // 5 minutes
  nonce: ethers.hexlify(ethers.randomBytes(32)),
};
```

---

## Testing Checklist

### Before Testing

- [ ] Get TCRO from https://cronos.org/faucet
- [ ] Get devUSDC.e from https://faucet.cronos.org
- [ ] MetaMask connected to Cronos Testnet (Chain ID 338)
- [ ] Backend running with correct facilitator URL
- [ ] Frontend environment variables set

### Payment Flow Test

1. **Initial Request (No Payment)**
   - Should return HTTP 402
   - Check `paymentRequirements` in response
   - Verify all required fields present

2. **Sign EIP-3009 Authorization**
   - MetaMask should show "Sign Typed Data v4"
   - Check domain matches token contract
   - Verify amounts are correct

3. **Retry with Payment Header**
   - Should call `/verify` endpoint first
   - Then call `/settle` endpoint
   - Should return HTTP 200 on success

4. **Verify On-Chain**
   - Check transaction on explorer
   - Verify USDC transferred
   - Confirm amounts match

### Debug Logs to Check

```typescript
// Frontend
console.log('EIP-3009 signature:', { domain, types, message, signature });
console.log('Payment header:', paymentHeader);

// Backend
console.log('Received payment header:', paymentHeader);
console.log('Decoded payload:', decodedPayload);
console.log('Facilitator verify response:', verifyResponse);
console.log('Facilitator settle response:', settleResponse);
```

---

## Common Errors & Solutions

### Error: "invalid address (argument=\"address\", value=null)"

**Cause:** Missing or incorrectly formatted address field
**Solution:** Ensure all addresses in payload are present and properly formatted

### Error: "Payment verification failed"

**Cause:** Signature doesn't match or expired
**Solution:**

- Check domain matches token contract exactly
- Verify chainId is string "338" not number 338
- Ensure nonce is unique
- Check validBefore hasn't expired

### Error: "event: payment.failed"

**Cause:** Facilitator rejected settlement
**Solution:**

- Check `error` field in response for details
- Verify sufficient USDC balance
- Ensure token is supported on network

---

## Resources

### Official Links

- **Hackathon:** https://dorahacks.io/hackathon/cronos-x402/detail
- **Facilitator Docs:** https://docs.cronos.org/cronos-x402-facilitator
- **SDK NPM:** https://www.npmjs.com/package/@crypto.com/facilitator-client
- **Examples:** https://github.com/cronos-labs/x402-examples

### Working References

- **paycronos:** https://github.com/0731jiangyujilv/paycronos
- **cpay:** https://github.com/0xshikhar/cpay
- **x402-Gasless-Gaming:** https://github.com/tmanas06/x402-Gasless-Gaming-Paywall

### Support

- **Telegram:** https://t.me/+a4jj5hyJl0NmMDll
- **Office Hours:** https://calendar.app.google/4S33ktGEEMGQv2Xy6

---

## Next Steps

1. **Implement Bug Fixes** (Approach 1)
   - Fix payment header structure
   - Change chainId to string
   - Add verify step
   - Fix success event check

2. **Test End-to-End**
   - Verify 402 response
   - Sign payment
   - Confirm settlement
   - Check on-chain tx

3. **Fallback to SDK** (if needed)
   - Install `@crypto.com/facilitator-client`
   - Refactor middleware
   - Test with simplified flow

4. **Polish & Submit**
   - Record demo video
   - Update GitHub repo
   - Submit to DoraHacks
