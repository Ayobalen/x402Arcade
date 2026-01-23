#!/usr/bin/env python3
"""
Script to add missing Backend API features for x402Arcade.
This addresses gaps identified in the Backend API completeness audit.

Run with: python add_backend_api_features.py
"""

import sys
sys.path.insert(0, '/Users/mujeeb/autocoder')

from pathlib import Path
from api.database import Feature, create_database

PROJECT_DIR = Path('/Users/mujeeb/Projects/x402Arcade')

# Initialize database
engine, SessionLocal = create_database(PROJECT_DIR)
session = SessionLocal()

# Get current max priority
from sqlalchemy import func
max_priority = session.query(func.max(Feature.priority)).scalar() or 790

# Starting priority for new features
next_priority = max_priority + 1

# Define all missing Backend API features
features_data = [
    # ============================================================================
    # 1. DATABASE SCHEMA COMPLETENESS
    # ============================================================================
    {
        "priority": next_priority,
        "category": "Backend API: Database Schema",
        "name": "Create database migration system",
        "description": "Implement a version-controlled migration system for database schema changes using better-sqlite3-migrations or custom solution.",
        "steps": [
            "Create packages/backend/src/db/migrations/ directory structure",
            "Create migration runner utility with version tracking",
            "Create migrations table to track applied migrations",
            "Implement up() and down() migration functions",
            "Add migration CLI commands (migrate, rollback, status)",
            "Write initial migration (001_initial_schema.ts)",
            "Add migration npm scripts to package.json",
            "Document migration workflow in README"
        ]
    },
    {
        "priority": next_priority + 1,
        "category": "Backend API: Database Schema",
        "name": "Add foreign key constraints to database schema",
        "description": "Ensure all tables have proper foreign key relationships with ON DELETE/UPDATE actions for referential integrity.",
        "steps": [
            "Enable foreign keys in SQLite (PRAGMA foreign_keys = ON)",
            "Add FK from leaderboard_entries.session_id to game_sessions.id",
            "Add FK from payments.session_id to game_sessions.id (if applicable)",
            "Define ON DELETE CASCADE/SET NULL behaviors",
            "Add foreign key validation in database init",
            "Write tests verifying foreign key constraints work",
            "Document FK relationships in schema docs"
        ]
    },
    {
        "priority": next_priority + 2,
        "category": "Backend API: Database Schema",
        "name": "Add comprehensive default values to schema",
        "description": "Ensure all columns that should have default values are properly configured with sensible defaults.",
        "steps": [
            "Add DEFAULT 0 to score columns where applicable",
            "Add DEFAULT 'active' to status columns",
            "Add DEFAULT (datetime('now')) to all created_at columns",
            "Add DEFAULT 0 to amount columns",
            "Add DEFAULT FALSE to boolean flag columns",
            "Verify defaults work in INSERT statements",
            "Write tests for default value behavior"
        ]
    },
    {
        "priority": next_priority + 3,
        "category": "Backend API: Database Schema",
        "name": "Add additional CHECK constraints for data integrity",
        "description": "Add CHECK constraints to validate data integrity at the database level beyond existing ones.",
        "steps": [
            "Add CHECK (score >= 0) to game_sessions",
            "Add CHECK (amount_paid_usdc >= 0) to game_sessions",
            "Add CHECK (game_duration_ms >= 0) to game_sessions",
            "Add CHECK (total_amount_usdc >= 0) to prize_pools",
            "Add CHECK (total_games >= 0) to prize_pools",
            "Add CHECK constraint for valid wallet addresses (length)",
            "Write tests verifying CHECK constraints reject invalid data"
        ]
    },
    {
        "priority": next_priority + 4,
        "category": "Backend API: Database Schema",
        "name": "Add composite indexes for query optimization",
        "description": "Add composite indexes for common multi-column queries to improve performance.",
        "steps": [
            "Analyze common query patterns in services",
            "Add index on (game_type, created_at) for recent games",
            "Add index on (player_address, game_type) for player stats",
            "Add index on (period_type, period_date, score DESC) for leaderboards",
            "Add index on (status, created_at) for session cleanup",
            "Run EXPLAIN QUERY PLAN to verify index usage",
            "Document indexes and their purpose"
        ]
    },

    # ============================================================================
    # 2. API ENDPOINT GAPS
    # ============================================================================
    {
        "priority": next_priority + 5,
        "category": "Backend API: Endpoints",
        "name": "Create GET /api/games endpoint",
        "description": "Implement endpoint to list all available games with their metadata, pricing, and status.",
        "steps": [
            "Create games.routes.ts file",
            "Define GameInfo interface with id, name, description, price, thumbnail",
            "Implement GET /api/games handler",
            "Return array of available games with pricing",
            "Include game status (enabled/disabled/maintenance)",
            "Add response caching headers (ETag, Cache-Control)",
            "Write integration tests for endpoint",
            "Document endpoint in OpenAPI spec"
        ]
    },
    {
        "priority": next_priority + 6,
        "category": "Backend API: Endpoints",
        "name": "Create GET /api/session/:id endpoint",
        "description": "Implement endpoint to get detailed session status including game state, score, and payment info.",
        "steps": [
            "Add GET /api/session/:id route to session routes",
            "Define SessionDetailResponse interface",
            "Include session status, score, duration, payment info",
            "Include player address and game type",
            "Return 404 for non-existent sessions",
            "Add authorization check (only owner or admin)",
            "Write integration tests for endpoint",
            "Document endpoint in OpenAPI spec"
        ]
    },
    {
        "priority": next_priority + 7,
        "category": "Backend API: Endpoints",
        "name": "Create GET /api/player/:address/stats endpoint",
        "description": "Implement endpoint to get player statistics including total games, high scores, and spending.",
        "steps": [
            "Create player.routes.ts file",
            "Define PlayerStats interface",
            "Implement stats calculation queries",
            "Include total_games, total_spent, highest_score by game",
            "Include average_score, win_rate, favorite_game",
            "Include first_played and last_played timestamps",
            "Add response caching with short TTL",
            "Write integration tests for endpoint"
        ]
    },
    {
        "priority": next_priority + 8,
        "category": "Backend API: Endpoints",
        "name": "Create GET /api/player/:address/history endpoint",
        "description": "Implement endpoint to get paginated game history for a player with filtering options.",
        "steps": [
            "Add GET /api/player/:address/history route",
            "Define PlayerHistoryResponse with pagination",
            "Implement pagination (limit, offset, cursor-based)",
            "Add game_type filter parameter",
            "Add date range filter parameters",
            "Add sort parameter (date, score)",
            "Include session details with payment tx hash",
            "Write integration tests with various filters"
        ]
    },
    {
        "priority": next_priority + 9,
        "category": "Backend API: Endpoints",
        "name": "Create GET /api/prize/history endpoint",
        "description": "Implement endpoint to get historical prize pool data with winners and payouts.",
        "steps": [
            "Add GET /api/prize/history route",
            "Define PrizeHistoryResponse interface",
            "Include past prize pools with winners",
            "Include payout amounts and transaction hashes",
            "Add pagination support",
            "Add game_type filter parameter",
            "Add period_type filter parameter",
            "Write integration tests for endpoint"
        ]
    },
    {
        "priority": next_priority + 10,
        "category": "Backend API: Endpoints",
        "name": "Create comprehensive GET /api/health endpoint",
        "description": "Implement detailed health check endpoint with database, facilitator, and blockchain status.",
        "steps": [
            "Enhance existing health check endpoint",
            "Check database connection with simple query",
            "Check facilitator connectivity (ping endpoint)",
            "Check RPC node connectivity (eth_blockNumber)",
            "Return component-level health status",
            "Include response time for each check",
            "Return degraded status vs complete failure",
            "Add /api/health/live for k8s liveness",
            "Add /api/health/ready for k8s readiness"
        ]
    },
    {
        "priority": next_priority + 11,
        "category": "Backend API: Endpoints",
        "name": "Implement WebSocket server for real-time updates",
        "description": "Add WebSocket support for real-time leaderboard updates and game events.",
        "steps": [
            "Install ws or socket.io package",
            "Create WebSocket server alongside HTTP server",
            "Implement connection handling and authentication",
            "Create 'leaderboard:update' event channel",
            "Create 'prizepool:update' event channel",
            "Implement heartbeat/ping-pong for connection health",
            "Add connection rate limiting",
            "Write WebSocket integration tests"
        ]
    },
    {
        "priority": next_priority + 12,
        "category": "Backend API: Endpoints",
        "name": "Implement real-time leaderboard broadcasting",
        "description": "Broadcast leaderboard updates to connected clients when scores change.",
        "steps": [
            "Create LeaderboardBroadcaster service",
            "Hook into score submission flow",
            "Calculate rank changes on new score",
            "Broadcast only changed entries (delta updates)",
            "Include game type and period in broadcasts",
            "Implement room-based subscriptions per game",
            "Add debouncing for rapid updates",
            "Write tests for broadcast logic"
        ]
    },

    # ============================================================================
    # 3. VALIDATION FEATURES
    # ============================================================================
    {
        "priority": next_priority + 13,
        "category": "Backend API: Validation",
        "name": "Create Zod schemas for all request bodies",
        "description": "Define comprehensive Zod schemas for validating all API request bodies.",
        "steps": [
            "Create validators/play.validator.ts with PlayRequestSchema",
            "Create validators/score.validator.ts with ScoreSubmitSchema",
            "Create validators/leaderboard.validator.ts with query schemas",
            "Define wallet address validation regex pattern",
            "Define game type enum validation",
            "Define score range validation (0 to MAX_SAFE_INTEGER)",
            "Export all schemas from validators/index.ts",
            "Write unit tests for each schema"
        ]
    },
    {
        "priority": next_priority + 14,
        "category": "Backend API: Validation",
        "name": "Create path parameter validation middleware",
        "description": "Implement middleware to validate URL path parameters like :id, :address, :gameType.",
        "steps": [
            "Create middleware/validate-params.ts",
            "Define validateSessionId middleware (UUID format)",
            "Define validateWalletAddress middleware (0x + 40 hex)",
            "Define validateGameType middleware (enum check)",
            "Return 400 with descriptive error on invalid params",
            "Apply middleware to appropriate routes",
            "Write tests for param validation"
        ]
    },
    {
        "priority": next_priority + 15,
        "category": "Backend API: Validation",
        "name": "Create query parameter validation middleware",
        "description": "Implement middleware to validate and transform query parameters with defaults.",
        "steps": [
            "Create middleware/validate-query.ts",
            "Define pagination schema (limit: 1-100, offset: >= 0)",
            "Define date range schema with ISO8601 validation",
            "Define sort parameter schema with allowed values",
            "Define filter parameter schemas",
            "Transform string numbers to integers",
            "Apply defaults for optional parameters",
            "Write tests for query validation"
        ]
    },
    {
        "priority": next_priority + 16,
        "category": "Backend API: Validation",
        "name": "Implement custom validation error messages",
        "description": "Create user-friendly, localization-ready error messages for all validation failures.",
        "steps": [
            "Create validation error message templates",
            "Define messages for required fields",
            "Define messages for format errors (email, address)",
            "Define messages for range errors (min, max)",
            "Define messages for enum errors (allowed values)",
            "Include field path in error messages",
            "Support message interpolation ({field}, {min}, {max})",
            "Write tests for error message generation"
        ]
    },
    {
        "priority": next_priority + 17,
        "category": "Backend API: Validation",
        "name": "Implement validation error response formatting",
        "description": "Create consistent error response format for validation failures across all endpoints.",
        "steps": [
            "Define ValidationErrorResponse interface",
            "Include error code (VALIDATION_ERROR)",
            "Include array of field errors with path and message",
            "Include request ID for debugging",
            "Create formatValidationError utility function",
            "Apply consistent format in all validators",
            "Document error format in API documentation",
            "Write tests for error formatting"
        ]
    },

    # ============================================================================
    # 4. SECURITY FEATURES
    # ============================================================================
    {
        "priority": next_priority + 18,
        "category": "Backend API: Security",
        "name": "Implement per-endpoint rate limiting",
        "description": "Configure different rate limits for different endpoint types based on sensitivity and cost.",
        "steps": [
            "Create rate limit configuration object per endpoint",
            "Set strict limits for payment endpoints (10/min)",
            "Set moderate limits for write endpoints (30/min)",
            "Set relaxed limits for read endpoints (100/min)",
            "Configure burst allowance for each tier",
            "Add rate limit headers to responses",
            "Implement sliding window algorithm",
            "Write tests for rate limit tiers"
        ]
    },
    {
        "priority": next_priority + 19,
        "category": "Backend API: Security",
        "name": "Implement per-wallet-address rate limiting",
        "description": "Add wallet-address-specific rate limiting to prevent abuse from single wallets.",
        "steps": [
            "Create wallet-based rate limiter middleware",
            "Extract wallet address from auth/payment headers",
            "Configure limits per wallet per endpoint",
            "Store rate limit data in memory or Redis",
            "Return 429 with retry-after header",
            "Add wallet to abuse watchlist on repeated violations",
            "Implement graduated penalties for repeat offenders",
            "Write tests for wallet rate limiting"
        ]
    },
    {
        "priority": next_priority + 20,
        "category": "Backend API: Security",
        "name": "Implement request signature verification",
        "description": "Add optional request signing for sensitive endpoints using wallet signatures.",
        "steps": [
            "Create signature verification middleware",
            "Define signature scheme (EIP-191 personal sign)",
            "Include timestamp in signed message for replay prevention",
            "Include request body hash in signed message",
            "Verify signature matches wallet address",
            "Reject signatures older than 5 minutes",
            "Apply to score submission endpoint",
            "Write tests for signature verification"
        ]
    },
    {
        "priority": next_priority + 21,
        "category": "Backend API: Security",
        "name": "Enhance CORS configuration for production",
        "description": "Implement comprehensive CORS configuration with proper origin validation and credentials handling.",
        "steps": [
            "Create CORS configuration module",
            "Define allowed origins from environment",
            "Implement origin validation function",
            "Configure allowed methods per endpoint",
            "Configure allowed headers (X-Payment, etc.)",
            "Configure exposed headers for responses",
            "Handle credentials for authenticated requests",
            "Add preflight caching (Access-Control-Max-Age)",
            "Write tests for CORS behavior"
        ]
    },
    {
        "priority": next_priority + 22,
        "category": "Backend API: Security",
        "name": "Enhance Helmet security headers",
        "description": "Configure comprehensive security headers beyond defaults for production hardening.",
        "steps": [
            "Configure Content-Security-Policy for API responses",
            "Enable Strict-Transport-Security (HSTS)",
            "Configure X-Content-Type-Options: nosniff",
            "Configure X-Frame-Options: DENY",
            "Configure X-XSS-Protection header",
            "Configure Referrer-Policy header",
            "Configure Permissions-Policy header",
            "Document security headers in deployment guide"
        ]
    },
    {
        "priority": next_priority + 23,
        "category": "Backend API: Security",
        "name": "Implement input sanitization middleware",
        "description": "Add input sanitization to prevent XSS and injection attacks in user-provided data.",
        "steps": [
            "Install sanitize-html or similar package",
            "Create input sanitization middleware",
            "Strip HTML tags from string inputs",
            "Escape special characters in strings",
            "Validate and sanitize wallet addresses",
            "Sanitize error messages before returning",
            "Apply to all user-provided text fields",
            "Write tests for sanitization edge cases"
        ]
    },
    {
        "priority": next_priority + 24,
        "category": "Backend API: Security",
        "name": "Implement SQL injection prevention audit",
        "description": "Audit and enforce parameterized queries throughout the codebase to prevent SQL injection.",
        "steps": [
            "Audit all database queries in services",
            "Ensure all queries use parameterized statements",
            "Create linting rule for raw SQL detection",
            "Replace any string concatenation in queries",
            "Add query builder or ORM wrapper for complex queries",
            "Create SQL injection test suite",
            "Document secure query patterns",
            "Add security review checklist"
        ]
    },

    # ============================================================================
    # 5. LOGGING & MONITORING
    # ============================================================================
    {
        "priority": next_priority + 25,
        "category": "Backend API: Logging",
        "name": "Implement structured JSON logging",
        "description": "Replace console.log with structured JSON logging for better log aggregation and analysis.",
        "steps": [
            "Install pino or winston logging library",
            "Create logger configuration module",
            "Configure JSON output format for production",
            "Configure pretty print for development",
            "Define log levels (debug, info, warn, error)",
            "Add log level configuration from environment",
            "Create logger instance per module pattern",
            "Migrate all console.log to structured logger"
        ]
    },
    {
        "priority": next_priority + 26,
        "category": "Backend API: Logging",
        "name": "Implement request ID tracking",
        "description": "Add unique request IDs to all requests for distributed tracing and debugging.",
        "steps": [
            "Create request-id middleware",
            "Generate UUID for each request",
            "Accept X-Request-ID header if provided",
            "Attach request ID to request object",
            "Add request ID to all log entries",
            "Return X-Request-ID in response headers",
            "Include request ID in error responses",
            "Write tests for request ID propagation"
        ]
    },
    {
        "priority": next_priority + 27,
        "category": "Backend API: Logging",
        "name": "Implement request/response timing logging",
        "description": "Log request processing time for performance monitoring and SLA tracking.",
        "steps": [
            "Create timing middleware (early in chain)",
            "Record request start time with hrtime",
            "Calculate duration on response finish",
            "Log timing with request details",
            "Add X-Response-Time header",
            "Log slow requests with warning level (>1s)",
            "Create histogram buckets for metrics",
            "Write tests for timing accuracy"
        ]
    },
    {
        "priority": next_priority + 28,
        "category": "Backend API: Logging",
        "name": "Implement error logging with stack traces",
        "description": "Configure comprehensive error logging with full stack traces and context.",
        "steps": [
            "Create error logging utility",
            "Capture full stack traces for errors",
            "Include request context (URL, method, params)",
            "Include user context (wallet address)",
            "Sanitize sensitive data from logs",
            "Log error correlation with request ID",
            "Configure error alerting thresholds",
            "Write tests for error log format"
        ]
    },
    {
        "priority": next_priority + 29,
        "category": "Backend API: Logging",
        "name": "Implement payment audit logging",
        "description": "Create detailed audit logs for all payment-related operations for compliance and debugging.",
        "steps": [
            "Create payment audit logger",
            "Log payment initiation with details",
            "Log facilitator requests and responses",
            "Log settlement success/failure",
            "Log prize pool contributions",
            "Log prize payouts with tx hashes",
            "Include timestamps and wallet addresses",
            "Ensure audit logs are tamper-evident",
            "Write audit log retention policy"
        ]
    },
    {
        "priority": next_priority + 30,
        "category": "Backend API: Logging",
        "name": "Implement metrics collection",
        "description": "Add application metrics collection for monitoring dashboards and alerting.",
        "steps": [
            "Install prom-client for Prometheus metrics",
            "Create metrics registry module",
            "Add request counter by endpoint and status",
            "Add request duration histogram",
            "Add active connections gauge",
            "Add payment success/failure counters",
            "Add game sessions counter by type",
            "Create /metrics endpoint for scraping",
            "Write tests for metrics accuracy"
        ]
    },

    # ============================================================================
    # 6. ERROR HANDLING
    # ============================================================================
    {
        "priority": next_priority + 31,
        "category": "Backend API: Error Handling",
        "name": "Create comprehensive custom error class hierarchy",
        "description": "Build a hierarchy of custom error classes for different error types with proper codes.",
        "steps": [
            "Create errors/base.error.ts with AppError base class",
            "Create errors/validation.error.ts for validation errors",
            "Create errors/authentication.error.ts for auth errors",
            "Create errors/authorization.error.ts for permission errors",
            "Create errors/not-found.error.ts for 404 errors",
            "Create errors/conflict.error.ts for 409 errors",
            "Create errors/external-service.error.ts for 3rd party",
            "Export all errors from errors/index.ts"
        ]
    },
    {
        "priority": next_priority + 32,
        "category": "Backend API: Error Handling",
        "name": "Define comprehensive error codes system",
        "description": "Create a structured error code system for programmatic error handling by clients.",
        "steps": [
            "Create errors/codes.ts with error code constants",
            "Define validation codes (INVALID_INPUT, MISSING_FIELD)",
            "Define auth codes (WALLET_NOT_CONNECTED, INVALID_SIGNATURE)",
            "Define payment codes (INSUFFICIENT_FUNDS, PAYMENT_FAILED)",
            "Define game codes (SESSION_EXPIRED, GAME_NOT_FOUND)",
            "Define system codes (DATABASE_ERROR, SERVICE_UNAVAILABLE)",
            "Document all error codes in API docs",
            "Write tests for error code usage"
        ]
    },
    {
        "priority": next_priority + 33,
        "category": "Backend API: Error Handling",
        "name": "Implement client-friendly error messages",
        "description": "Create user-facing error messages separate from technical details for better UX.",
        "steps": [
            "Create error message templates",
            "Define user-friendly message for each error code",
            "Support message interpolation with context",
            "Hide technical details in production",
            "Include suggestion for resolution when possible",
            "Ensure messages are localization-ready",
            "Test messages with non-technical users",
            "Document message customization"
        ]
    },
    {
        "priority": next_priority + 34,
        "category": "Backend API: Error Handling",
        "name": "Implement error recovery suggestions",
        "description": "Add helpful suggestions to error responses to guide users toward resolution.",
        "steps": [
            "Define suggestions for common errors",
            "Add 'try switching network' for wrong chain",
            "Add 'check your USDC balance' for payment failures",
            "Add 'refresh and try again' for stale sessions",
            "Add 'contact support' link for unknown errors",
            "Include suggestion field in error response",
            "A/B test suggestion effectiveness",
            "Document suggestion system"
        ]
    },
    {
        "priority": next_priority + 35,
        "category": "Backend API: Error Handling",
        "name": "Implement circuit breaker for external services",
        "description": "Add circuit breaker pattern for facilitator and RPC calls to handle failures gracefully.",
        "steps": [
            "Install opossum or implement custom circuit breaker",
            "Create circuit breaker for facilitator API",
            "Create circuit breaker for RPC provider",
            "Configure failure threshold (5 failures)",
            "Configure reset timeout (30 seconds)",
            "Configure half-open test interval",
            "Return graceful fallback when open",
            "Log circuit state changes",
            "Write tests for circuit breaker behavior"
        ]
    },

    # ============================================================================
    # 7. BACKGROUND JOBS
    # ============================================================================
    {
        "priority": next_priority + 36,
        "category": "Backend API: Background Jobs",
        "name": "Create background job scheduler infrastructure",
        "description": "Set up node-cron or similar for scheduling background jobs with proper lifecycle management.",
        "steps": [
            "Create jobs/ directory structure",
            "Create job scheduler module using node-cron",
            "Implement job registration system",
            "Add job execution logging",
            "Implement graceful shutdown (finish running jobs)",
            "Add job execution history tracking",
            "Create job status endpoint for monitoring",
            "Write tests for job scheduler"
        ]
    },
    {
        "priority": next_priority + 37,
        "category": "Backend API: Background Jobs",
        "name": "Implement session expiration cleanup job",
        "description": "Create job to expire old game sessions that were never completed.",
        "steps": [
            "Create jobs/session-cleanup.job.ts",
            "Define expiration threshold from config (30 min)",
            "Query for active sessions past threshold",
            "Update status to 'expired' for old sessions",
            "Log number of sessions expired",
            "Schedule to run every 5 minutes",
            "Add metrics for expired sessions",
            "Write tests for cleanup logic"
        ]
    },
    {
        "priority": next_priority + 38,
        "category": "Backend API: Background Jobs",
        "name": "Implement daily prize pool finalization job",
        "description": "Create job to finalize daily prize pools and determine winners.",
        "steps": [
            "Create jobs/prize-finalization.job.ts",
            "Query for active daily pools from yesterday",
            "Calculate top scorer for each game type",
            "Update pool status to 'finalized'",
            "Record winner address in pool",
            "Trigger payout process (or queue it)",
            "Send notification to winner (if implemented)",
            "Schedule to run at 00:05 UTC daily",
            "Write tests for finalization logic"
        ]
    },
    {
        "priority": next_priority + 39,
        "category": "Backend API: Background Jobs",
        "name": "Implement leaderboard rank recalculation job",
        "description": "Create job to recalculate and cache leaderboard ranks periodically.",
        "steps": [
            "Create jobs/leaderboard-recalc.job.ts",
            "Query all entries for each period type",
            "Calculate dense ranks for scores",
            "Update rank column in leaderboard_entries",
            "Cache top 100 for each game/period combo",
            "Schedule to run every 15 minutes",
            "Add metrics for recalculation time",
            "Write tests for rank calculation"
        ]
    },
    {
        "priority": next_priority + 40,
        "category": "Backend API: Background Jobs",
        "name": "Implement stale data cleanup job",
        "description": "Create job to clean up old data beyond retention period to manage database size.",
        "steps": [
            "Create jobs/data-cleanup.job.ts",
            "Define retention period from config (90 days)",
            "Delete old completed sessions beyond retention",
            "Archive or delete old leaderboard entries",
            "Clean up old payment audit records",
            "Vacuum database after cleanup",
            "Schedule to run weekly",
            "Log cleanup statistics",
            "Write tests for cleanup logic"
        ]
    },
    {
        "priority": next_priority + 41,
        "category": "Backend API: Background Jobs",
        "name": "Implement database maintenance job",
        "description": "Create job for periodic database maintenance including optimization and integrity checks.",
        "steps": [
            "Create jobs/db-maintenance.job.ts",
            "Run PRAGMA integrity_check periodically",
            "Run ANALYZE for query optimizer",
            "Run VACUUM to reclaim space (when needed)",
            "Check and rebuild corrupted indexes",
            "Log maintenance results",
            "Schedule to run during low-traffic hours",
            "Alert on integrity failures",
            "Write tests for maintenance operations"
        ]
    },

    # ============================================================================
    # 8. ADDITIONAL MISSING FEATURES
    # ============================================================================
    {
        "priority": next_priority + 42,
        "category": "Backend API: Testing",
        "name": "Create API integration test suite for new endpoints",
        "description": "Write comprehensive integration tests for all newly added API endpoints.",
        "steps": [
            "Create tests for GET /api/games endpoint",
            "Create tests for GET /api/session/:id endpoint",
            "Create tests for GET /api/player/:address/stats",
            "Create tests for GET /api/player/:address/history",
            "Create tests for GET /api/prize/history",
            "Create tests for enhanced /api/health endpoint",
            "Test error responses and edge cases",
            "Test pagination and filtering"
        ]
    },
    {
        "priority": next_priority + 43,
        "category": "Backend API: Testing",
        "name": "Create WebSocket integration tests",
        "description": "Write tests for WebSocket functionality and real-time features.",
        "steps": [
            "Set up WebSocket test client",
            "Test connection establishment",
            "Test authentication/authorization",
            "Test leaderboard subscription",
            "Test real-time update broadcasting",
            "Test connection error handling",
            "Test reconnection behavior",
            "Test rate limiting on connections"
        ]
    },
    {
        "priority": next_priority + 44,
        "category": "Backend API: Documentation",
        "name": "Create comprehensive OpenAPI specification",
        "description": "Document all API endpoints in OpenAPI 3.0 format for client generation and documentation.",
        "steps": [
            "Create openapi.yaml in backend root",
            "Document all endpoints with paths",
            "Define request/response schemas",
            "Document error responses",
            "Add authentication requirements",
            "Add rate limiting documentation",
            "Generate API docs website",
            "Add OpenAPI validation to CI"
        ]
    },
    {
        "priority": next_priority + 45,
        "category": "Backend API: Documentation",
        "name": "Create Postman/Insomnia collection",
        "description": "Create API testing collection with examples for all endpoints.",
        "steps": [
            "Create Postman collection file",
            "Add all endpoints with examples",
            "Configure environment variables",
            "Add pre-request scripts for auth",
            "Add test scripts for responses",
            "Document usage in README",
            "Export and commit to repository"
        ]
    }
]

# Insert all features
created_count = 0
for i, feature_data in enumerate(features_data):
    feature_data["priority"] = next_priority + i
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
print(f"Successfully created {created_count} new features in the database.")

# Verify and show new features
print("\n=== NEW FEATURES ADDED ===")
new_features = session.query(Feature).filter(Feature.priority >= next_priority).order_by(Feature.priority).all()
for f in new_features:
    print(f"#{f.id:3} [P{f.priority}] {f.category}: {f.name}")

# Show breakdown by category
print("\n=== NEW FEATURES BY CATEGORY ===")
from sqlalchemy import func
categories = session.query(Feature.category, func.count(Feature.id)).filter(
    Feature.priority >= next_priority
).group_by(Feature.category).all()
for cat, count in categories:
    print(f"  {cat}: {count}")

session.close()
