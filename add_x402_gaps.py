#!/usr/bin/env python3
"""
Script to add missing Phase 2 x402 Payment features identified in the audit.
Run with: python add_x402_gaps.py
"""

import sys
sys.path.insert(0, '/Users/mujeeb/autocoder')

from pathlib import Path
from api.database import Feature, create_database
from sqlalchemy import func

PROJECT_DIR = Path('/Users/mujeeb/Projects/x402Arcade')

# Initialize database
engine, SessionLocal = create_database(PROJECT_DIR)
session = SessionLocal()

# Get current max priority
max_priority = session.query(func.max(Feature.priority)).scalar()
print(f"Current max priority: {max_priority}")

# Define new features to fill gaps identified in the audit
new_features = [
    # ============================================================================
    # EIP-712 Implementation Gaps
    # ============================================================================
    {
        "priority": max_priority + 1,
        "category": "Phase 2: x402 Payment",
        "name": "Implement EIP-712 struct hash calculation",
        "description": "Implement the EIP-712 struct hash calculation for TransferWithAuthorization messages. The struct hash is keccak256 of the encoded type hash and message fields, required for signature verification.",
        "steps": [
            "Create calculateStructHash function in src/lib/chain/eip712.ts",
            "Import keccak256 and encodePacked from viem",
            "Calculate type hash: keccak256('TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)')",
            "Encode message fields: from, to, value, validAfter, validBefore, nonce",
            "Return keccak256 of concatenated type hash and encoded fields",
            "Add TypeScript types for the hash result",
            "Write unit tests verifying hash calculation matches expected values"
        ]
    },
    {
        "priority": max_priority + 2,
        "category": "Phase 2: x402 Payment",
        "name": "Implement devUSDC.e specific domain configuration",
        "description": "Configure EIP-712 domain specifically for devUSDC.e (Cronos Testnet bridged USDC). The devUSDC.e contract may have specific domain parameters that differ from mainnet USDC.",
        "steps": [
            "Create src/config/devUsdcDomain.ts for devUSDC.e configuration",
            "Set name to 'Bridged USDC (Stargate)' matching contract",
            "Set version to '1' for testnet (per spec)",
            "Set chainId to 338 (Cronos Testnet)",
            "Set verifyingContract to 0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0",
            "Add environment variable support for mainnet override",
            "Document version differences: '1' for testnet, '2' for mainnet",
            "Write integration test to verify domain matches contract"
        ]
    },

    # ============================================================================
    # Frontend Hook Gaps
    # ============================================================================
    {
        "priority": max_priority + 3,
        "category": "Phase 2: x402 Payment",
        "name": "Implement chain switching handler",
        "description": "Handle chain switching when user is connected to wrong network. Prompt user to switch to Cronos Testnet before allowing payment.",
        "steps": [
            "Create useSwitchToCorrectChain hook in src/hooks/",
            "Import useChainId and useSwitchChain from wagmi",
            "Detect if current chain matches CRONOS_TESTNET_CHAIN_ID (338)",
            "Implement switchToChain function using wallet_switchEthereumChain",
            "Handle ERC-4902 error for adding new chain",
            "Show user-friendly message when on wrong chain",
            "Disable payment button until on correct chain",
            "Write unit tests for chain detection and switching"
        ]
    },
    {
        "priority": max_priority + 4,
        "category": "Phase 2: x402 Payment",
        "name": "Implement USDC balance check before payment",
        "description": "Check user's USDC balance before initiating payment to provide early error feedback and prevent failed transactions.",
        "steps": [
            "Create useUsdcBalance hook in src/hooks/",
            "Use viem's readContract to call balanceOf on USDC contract",
            "Parse balance using USDC_DECIMALS (6)",
            "Compare balance with required payment amount",
            "Return hasInsufficientBalance boolean",
            "Display balance in PayToPlay component",
            "Show warning if balance is insufficient",
            "Auto-refresh balance on account change"
        ]
    },
    {
        "priority": max_priority + 5,
        "category": "Phase 2: x402 Payment",
        "name": "Implement network mismatch error handling",
        "description": "Gracefully handle errors when user attempts payment on wrong network with clear guidance.",
        "steps": [
            "Create NetworkMismatchError class extending X402Error",
            "Include expected chain ID and actual chain ID in error",
            "Create friendly error message with chain names",
            "Show 'Switch Network' button in error UI",
            "Integrate with useSwitchToCorrectChain hook",
            "Log network mismatch events for debugging",
            "Write tests for error handling across different networks"
        ]
    },
    {
        "priority": max_priority + 6,
        "category": "Phase 2: x402 Payment",
        "name": "Implement formatUnits utility for USDC display",
        "description": "Create utility function to format USDC amounts from blockchain units to human-readable strings.",
        "steps": [
            "Create formatUsdcAmount function in src/lib/chain/usdc.ts",
            "Import formatUnits from viem",
            "Accept BigInt or string amount in raw units",
            "Convert to human-readable using 6 decimals",
            "Add currency symbol formatting option",
            "Handle edge cases: 0, very small amounts, very large amounts",
            "Add locale support for number formatting",
            "Write unit tests with various amounts"
        ]
    },

    # ============================================================================
    # Security Gaps
    # ============================================================================
    {
        "priority": max_priority + 7,
        "category": "Phase 2: x402 Payment",
        "name": "Implement front-running protection documentation",
        "description": "Document front-running risks with transferWithAuthorization and when to use receiveWithAuthorization. While the facilitator handles this, developers need awareness.",
        "steps": [
            "Create SECURITY.md in x402 documentation directory",
            "Document transferWithAuthorization front-running vulnerability",
            "Explain receiveWithAuthorization as alternative for smart contracts",
            "Document that facilitator provides protection through atomic settlement",
            "Add code comments in middleware explaining security model",
            "Document nonce uniqueness as front-running mitigation",
            "Add security checklist for payment implementation review"
        ]
    },
    {
        "priority": max_priority + 8,
        "category": "Phase 2: x402 Payment",
        "name": "Implement rate limiting for payment endpoints",
        "description": "Add rate limiting to prevent abuse of payment endpoints and protect against denial of service attacks.",
        "steps": [
            "Import express-rate-limit in backend middleware",
            "Create payment-specific rate limiter configuration",
            "Set window to 15 minutes",
            "Set max requests to 10 per window per wallet address",
            "Use wallet address from X-Payment header as key",
            "Return 429 Too Many Requests with Retry-After header",
            "Log rate limit violations",
            "Write tests verifying rate limiting behavior"
        ]
    },
    {
        "priority": max_priority + 9,
        "category": "Phase 2: x402 Payment",
        "name": "Implement nonce storage persistence",
        "description": "Persist used nonces to SQLite database to prevent replay attacks across server restarts.",
        "steps": [
            "Create used_nonces table in database schema",
            "Add columns: nonce (TEXT PRIMARY KEY), wallet_address, used_at, tx_hash",
            "Create NonceService class for nonce operations",
            "Implement isNonceUsed(nonce) method with DB query",
            "Implement markNonceUsed(nonce, wallet, txHash) method",
            "Add index on nonce column for fast lookups",
            "Implement cleanup job for old nonces (>30 days)",
            "Write integration tests for nonce persistence"
        ]
    },

    # ============================================================================
    # Middleware Edge Case Gaps
    # ============================================================================
    {
        "priority": max_priority + 10,
        "category": "Phase 2: x402 Payment",
        "name": "Handle concurrent payment requests",
        "description": "Handle race conditions when same wallet submits multiple payment requests simultaneously.",
        "steps": [
            "Implement request deduplication using payment signature hash",
            "Create in-memory cache of pending payments",
            "Return 409 Conflict if duplicate payment in progress",
            "Clear pending payment entry on completion or failure",
            "Set TTL on pending entries (60 seconds max)",
            "Log concurrent payment attempts",
            "Write tests simulating concurrent requests"
        ]
    },
    {
        "priority": max_priority + 11,
        "category": "Phase 2: x402 Payment",
        "name": "Handle partial facilitator responses",
        "description": "Handle edge cases where facilitator returns incomplete or malformed responses.",
        "steps": [
            "Validate facilitator response has all required fields",
            "Check for transactionHash presence on success",
            "Handle missing error message on failure",
            "Implement defensive parsing with try-catch",
            "Return 502 with detailed error for malformed responses",
            "Log raw response for debugging",
            "Write tests for various malformed response shapes"
        ]
    },
    {
        "priority": max_priority + 12,
        "category": "Phase 2: x402 Payment",
        "name": "Implement facilitator health check",
        "description": "Implement health check for facilitator service to provide early warning of outages.",
        "steps": [
            "Create GET /health endpoint on backend",
            "Include facilitator connectivity check",
            "Call facilitator /supported endpoint as health probe",
            "Cache health status for 60 seconds",
            "Return degraded status if facilitator unreachable",
            "Include response time in health check",
            "Expose health endpoint to monitoring systems"
        ]
    },
    {
        "priority": max_priority + 13,
        "category": "Phase 2: x402 Payment",
        "name": "Implement payment idempotency",
        "description": "Make payment settlement idempotent by tracking payment hashes and returning cached results.",
        "steps": [
            "Calculate payment hash from signature + timestamp",
            "Check database for existing payment with same hash",
            "Return cached result if payment already processed",
            "Store payment hash, result, and timestamp in payments table",
            "Set appropriate cache duration (24 hours)",
            "Handle edge case of failed payments being retried",
            "Write tests for idempotent payment scenarios"
        ]
    },

    # ============================================================================
    # Testing Gaps
    # ============================================================================
    {
        "priority": max_priority + 14,
        "category": "Phase 2: x402 Payment",
        "name": "Create mock USDC contract for testing",
        "description": "Create a mock USDC contract interface for testing without real blockchain calls.",
        "steps": [
            "Create packages/backend/__tests__/mocks/usdc-mock.ts",
            "Mock balanceOf to return configurable balance",
            "Mock transferWithAuthorization for signature testing",
            "Mock domain() to return test domain values",
            "Mock name(), version(), decimals() view functions",
            "Create factory function for test scenarios",
            "Write tests demonstrating mock usage"
        ]
    },
    {
        "priority": max_priority + 15,
        "category": "Phase 2: x402 Payment",
        "name": "Create EIP-712 signature test fixtures",
        "description": "Create pre-computed EIP-712 signature fixtures for deterministic testing.",
        "steps": [
            "Generate test wallet with known private key",
            "Create signed message fixtures for various scenarios",
            "Include valid signature fixture",
            "Include expired signature fixture",
            "Include wrong amount signature fixture",
            "Include wrong recipient signature fixture",
            "Document how fixtures were generated",
            "Add fixture verification test"
        ]
    },
    {
        "priority": max_priority + 16,
        "category": "Phase 2: x402 Payment",
        "name": "Write facilitator integration test suite",
        "description": "Create comprehensive integration tests for facilitator communication.",
        "steps": [
            "Create src/server/x402/__tests__/facilitator-integration.test.ts",
            "Use nock to mock facilitator HTTP responses",
            "Test successful settlement flow",
            "Test facilitator timeout handling",
            "Test facilitator 4xx error handling",
            "Test facilitator 5xx error handling",
            "Test retry logic with intermittent failures",
            "Test concurrent settlement requests"
        ]
    },

    # ============================================================================
    # Documentation Gaps
    # ============================================================================
    {
        "priority": max_priority + 17,
        "category": "Phase 2: x402 Payment",
        "name": "Document x402 payment flow sequence diagram",
        "description": "Create comprehensive documentation of the x402 payment flow with sequence diagrams.",
        "steps": [
            "Create docs/x402-payment-flow.md",
            "Add Mermaid sequence diagram for happy path",
            "Add sequence diagram for 402 response flow",
            "Add sequence diagram for error scenarios",
            "Document header formats (X-Payment, X-Payment-Required)",
            "Document base64 payload structure",
            "Add troubleshooting guide for common issues"
        ]
    },
]

# Insert all new features
created_count = 0
for feature_data in new_features:
    db_feature = Feature(
        priority=feature_data["priority"],
        category=feature_data["category"],
        name=feature_data["name"],
        description=feature_data["description"],
        steps=feature_data["steps"],
        passes=False,
        in_progress=False
    )
    session.add(db_feature)
    created_count += 1

session.commit()
print(f"Successfully created {created_count} new features to fill gaps.")

# Verify total
total = session.query(Feature).filter(Feature.category == "Phase 2: x402 Payment").count()
print(f"Total Phase 2: x402 Payment features now: {total}")

# List new features
print("\nNew features added:")
for f in new_features:
    print(f"  [+{f['priority'] - max_priority}] {f['name']}")

session.close()
