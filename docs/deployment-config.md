# Deployment Configuration Guide

This guide covers configuring Railway auto-deploy, health check monitoring, and logging aggregation for the x402Arcade backend.

## Table of Contents

1. [Railway Auto-Deploy](#railway-auto-deploy)
2. [Health Check Monitoring](#health-check-monitoring)
3. [Logging Aggregation](#logging-aggregation)
4. [Environment Variables](#environment-variables)
5. [Troubleshooting](#troubleshooting)

---

## Railway Auto-Deploy

### Overview

Railway automatically deploys your application when changes are pushed to the configured branch. The deployment process includes:

1. **Build**: Docker image built using multi-stage Dockerfile
2. **Health Check**: `/health` endpoint verified before routing traffic
3. **Zero-Downtime**: New version deployed while old version still serves traffic
4. **Rollback**: Automatic rollback on health check failure

### Configuration

Railway deployment is configured in `packages/backend/railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile",
    "watchPatterns": [
      "src/**",
      "package.json",
      "tsconfig.json"
    ]
  },
  "deploy": {
    "startCommand": "node dist/index.js",
    "numReplicas": 1,
    "sleepApplication": false,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "healthcheckPath": "/health",
    "healthcheckTimeout": 10,
    "healthcheckInterval": 30
  },
  "observability": {
    "logRetention": "7d"
  }
}
```

### Setup Railway Auto-Deploy

#### 1. Connect GitHub Repository

```bash
# In Railway dashboard:
1. Create new project
2. Select "Deploy from GitHub repo"
3. Choose x402Arcade repository
4. Select packages/backend as root directory
```

#### 2. Configure Deploy Branch

```bash
# In Railway project settings:
1. Go to "Settings" → "Source"
2. Set "Deploy Branch" to "main" (or your production branch)
3. Enable "Auto Deploy" toggle
```

#### 3. Set Environment Variables

```bash
# In Railway project settings:
1. Go to "Variables" tab
2. Add all required environment variables (see .env.example)
3. Variables to set:
   - NODE_ENV=production
   - DATABASE_PATH=/data/arcade.db
   - ARCADE_WALLET_ADDRESS=<your-wallet>
   - ARCADE_PRIVATE_KEY=<your-key>
   - LOG_LEVEL=info
   - BUILD_TIME=$RAILWAY_DEPLOYMENT_TIMESTAMP
   - GIT_COMMIT=$RAILWAY_GIT_COMMIT_SHA
   - GIT_BRANCH=$RAILWAY_GIT_BRANCH
```

#### 4. Configure Build Settings

```bash
# Railway automatically detects Dockerfile
# Watch patterns trigger rebuilds on file changes:
- src/** (any source file change)
- package.json (dependency changes)
- tsconfig.json (TypeScript config changes)
```

#### 5. Test Auto-Deploy Flow

```bash
# Make a change and push to deploy branch
git add .
git commit -m "test: trigger Railway auto-deploy"
git push origin main

# Monitor deployment in Railway dashboard:
1. Build logs → Docker image building
2. Deploy logs → Container starting
3. Health check → /health endpoint verified
4. Traffic → New version receives traffic
```

### Rollback Capability

Railway provides automatic rollback if deployment fails:

```bash
# Automatic rollback triggers:
- Health check failure (returns non-200 status)
- Container crash (exits with error code)
- Timeout (container doesn't respond within healthcheckTimeout)

# Manual rollback:
1. Go to Railway deployments tab
2. Select previous successful deployment
3. Click "Redeploy"
```

### Deploy Hooks

You can configure webhooks for deployment events:

```bash
# In Railway project settings → Webhooks:
1. Add webhook URL
2. Select events:
   - Deployment Started
   - Deployment Succeeded
   - Deployment Failed
3. Use for Slack/Discord notifications
```

---

## Health Check Monitoring

### Overview

The backend provides 4 health check endpoints for different monitoring purposes:

| Endpoint | Purpose | Response Time | Checks |
|----------|---------|---------------|--------|
| `/health` | Load balancer | Fast (~5ms) | Database connectivity |
| `/health/detailed` | Monitoring dashboard | Slow (~2-5s) | Database, RPC, Facilitator |
| `/health/ready` | Readiness probe | Fast (~5ms) | Database + tables exist |
| `/health/live` | Liveness probe | Instant (~1ms) | Process alive |

### Health Check Endpoints

#### `/health` - Basic Health Check

Used by Railway load balancers and uptime monitoring.

**Request:**
```bash
GET /health
```

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-25T17:30:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "environment": "production",
  "checks": {
    "database": {
      "status": "ok",
      "responseTime": 5,
      "details": {
        "sessions": 42,
        "leaderboard": 128
      }
    }
  },
  "build": {
    "time": "2026-01-25T12:00:00.000Z",
    "commit": "abc123def",
    "branch": "main"
  }
}
```

#### `/health/detailed` - Comprehensive Health Check

Used by monitoring dashboards (Datadog, New Relic, etc.).

**Request:**
```bash
GET /health/detailed
```

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-25T17:30:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "environment": "production",
  "checks": {
    "database": {
      "status": "ok",
      "responseTime": 5,
      "details": {
        "sessions": 42,
        "leaderboard": 128
      }
    },
    "rpc": {
      "status": "ok",
      "responseTime": 120,
      "details": {
        "blockNumber": "0x1a2b3c"
      }
    },
    "facilitator": {
      "status": "ok",
      "responseTime": 85
    }
  },
  "build": {
    "time": "2026-01-25T12:00:00.000Z",
    "commit": "abc123def",
    "branch": "main"
  }
}
```

**Degraded Response (200 OK):**
```json
{
  "status": "degraded",
  "checks": {
    "database": { "status": "ok" },
    "rpc": {
      "status": "degraded",
      "message": "RPC connection timeout",
      "responseTime": 5000
    }
  }
}
```

**Unhealthy Response (503 Service Unavailable):**
```json
{
  "status": "unhealthy",
  "checks": {
    "database": {
      "status": "error",
      "message": "unable to open database file",
      "responseTime": 10
    }
  }
}
```

#### `/health/ready` - Readiness Probe

Returns 200 only when service is ready to accept traffic.

**Response (200 OK):**
```json
{
  "status": "ready",
  "timestamp": "2026-01-25T17:30:00.000Z",
  "version": "1.0.0"
}
```

**Response (503 Service Unavailable):**
```json
{
  "status": "not ready",
  "timestamp": "2026-01-25T17:30:00.000Z",
  "message": "Database not accessible"
}
```

#### `/health/live` - Liveness Probe

Always returns 200 if process is alive.

**Response (200 OK):**
```json
{
  "status": "alive",
  "timestamp": "2026-01-25T17:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "pid": 42,
  "memory": {
    "rss": 52428800,
    "heapTotal": 20971520,
    "heapUsed": 15728640,
    "external": 1048576
  }
}
```

### Configure Railway Health Checks

Railway uses `/health` endpoint by default (configured in `railway.json`):

```json
{
  "deploy": {
    "healthcheckPath": "/health",
    "healthcheckTimeout": 10,
    "healthcheckInterval": 30
  }
}
```

**Parameters:**
- `healthcheckPath`: Endpoint to check (must return 200)
- `healthcheckTimeout`: Max response time in seconds
- `healthcheckInterval`: Seconds between checks

### Set Up Uptime Monitoring

#### Option 1: UptimeRobot (Free)

```bash
1. Sign up at https://uptimerobot.com
2. Create new monitor:
   - Type: HTTP(s)
   - URL: https://your-backend.railway.app/health
   - Interval: 5 minutes (free tier)
   - Alert contacts: email, Slack, Discord
3. Configure alerts:
   - Down for 2 consecutive checks
   - Back up notification
```

#### Option 2: Pingdom

```bash
1. Sign up at https://www.pingdom.com
2. Create uptime check:
   - URL: https://your-backend.railway.app/health
   - Check interval: 1 minute
   - Expected response: 200 OK
   - Alert after: 1 minute downtime
```

#### Option 3: BetterUptime

```bash
1. Sign up at https://betteruptime.com
2. Create monitor:
   - URL: https://your-backend.railway.app/health
   - Frequency: 30 seconds
   - Regions: Multiple locations
   - Status page: Public status page
```

### Configure Alerting for Downtime

#### Slack Notifications

```bash
# Use Railway webhooks + Slack incoming webhook
1. Create Slack incoming webhook
2. Add to Railway project webhooks
3. Configure for "Deployment Failed" events
```

#### Discord Notifications

```bash
# Use Railway webhooks + Discord webhook
1. Create Discord webhook in server settings
2. Add to Railway project webhooks
3. Get notified in Discord channel
```

#### Email Alerts

```bash
# Most uptime monitoring services support email
1. Configure in UptimeRobot/Pingdom settings
2. Add multiple email recipients
3. Set alert frequency (immediate, daily digest, etc.)
```

---

## Logging Aggregation

### Overview

The backend uses structured JSON logging in production for easy aggregation and analysis:

- **Development**: Pretty-printed colored logs (human-readable)
- **Production**: JSON logs (machine-readable, log aggregation)
- **Request ID Tracing**: Every request has unique ID for correlation
- **Log Levels**: DEBUG, INFO, WARN, ERROR
- **Contextual Metadata**: Request path, method, status, duration, user ID

### Structured JSON Logging

#### Log Format

Every log entry is a single-line JSON object:

```json
{
  "timestamp": "2026-01-25T17:30:15.234Z",
  "level": "info",
  "message": "POST /api/v1/play 200",
  "requestId": "123e4567-e89b-12d3-a456-426614174000",
  "method": "POST",
  "path": "/api/v1/play",
  "statusCode": 200,
  "duration": 45,
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0 ..."
}
```

#### Log Levels

```bash
# Set via LOG_LEVEL environment variable
DEBUG=0  # All logs (verbose)
INFO=1   # General information (default)
WARN=2   # Warnings and errors
ERROR=3  # Errors only

# Example:
LOG_LEVEL=info  # Logs INFO, WARN, ERROR (not DEBUG)
```

### Railway Log Streaming

Railway automatically streams logs from stdout/stderr:

```bash
# View logs in Railway dashboard:
1. Go to project → Deployments
2. Click on active deployment
3. View "Logs" tab
4. Real-time streaming
5. Search and filter by text

# Download logs:
1. Railway CLI: railway logs --tail 1000 > logs.txt
2. Dashboard: "Download Logs" button
```

### Log Retention Policy

Configured in `railway.json`:

```json
{
  "observability": {
    "logRetention": "7d"
  }
}
```

**Railway Log Retention:**
- **Hobby Plan**: 3 days
- **Pro Plan**: 7 days (as configured)
- **Enterprise**: Custom retention

**For long-term storage**, integrate with external log aggregation service.

### Request ID Tracing

Every request gets a unique ID for tracing through the system:

```bash
# Request ID generation:
1. Client sends request (no X-Request-ID header)
2. Backend generates UUID: "123e4567-e89b-12d3-a456-426614174000"
3. Backend attaches to request object
4. Backend includes in all logs for that request
5. Backend returns in response header: X-Request-ID

# Client can send existing request ID:
1. Client sends X-Request-ID header
2. Backend uses existing ID (distributed tracing)
3. Useful for tracking requests across microservices
```

**Example log correlation:**

```json
// All logs for the same request share requestId
{"timestamp":"2026-01-25T17:30:15.100Z","level":"info","message":"POST /api/v1/play","requestId":"123e4567"}
{"timestamp":"2026-01-25T17:30:15.120Z","level":"debug","message":"Validating payment","requestId":"123e4567"}
{"timestamp":"2026-01-25T17:30:15.145Z","level":"info","message":"Payment settled","requestId":"123e4567"}
{"timestamp":"2026-01-25T17:30:15.234Z","level":"info","message":"POST /api/v1/play 200","requestId":"123e4567"}
```

### Test Log Aggregation

#### 1. Check Local Logs (Development)

```bash
cd packages/backend
npm run dev

# You should see pretty-printed logs:
17:30:15 INFO  [123e4567] POST /api/v1/play 200 (45ms)
```

#### 2. Check Production Logs (Railway)

```bash
# Set NODE_ENV=production locally to test JSON logs
NODE_ENV=production npm start

# You should see JSON logs:
{"timestamp":"2026-01-25T17:30:15.234Z","level":"info","message":"POST /api/v1/play 200",...}
```

#### 3. Test Request ID Tracing

```bash
# Send request without X-Request-ID
curl https://your-backend.railway.app/api

# Response includes X-Request-ID header
X-Request-ID: 123e4567-e89b-12d3-a456-426614174000

# Send request with existing X-Request-ID
curl -H "X-Request-ID: my-custom-id" https://your-backend.railway.app/api

# Backend uses your ID in logs
{"timestamp":"...","requestId":"my-custom-id",...}
```

### Create Log Search Queries

#### Railway Log Search

```bash
# In Railway dashboard logs tab:

# Search by request ID:
123e4567

# Search by level:
level:error

# Search by path:
/api/v1/play

# Search by status code:
statusCode:500

# Combine filters:
level:error AND statusCode:500
```

#### External Log Aggregation (Optional)

For production apps, consider integrating with:

**Datadog:**
```bash
# Forward Railway logs to Datadog
1. Get Datadog API key
2. Configure Railway log drain
3. Search, filter, alert in Datadog dashboard
```

**Logtail (BetterStack):**
```bash
# Specialized for Railway logs
1. Sign up at https://logs.betterstack.com
2. Connect Railway project
3. Advanced search, live tail, alerts
```

**Papertrail:**
```bash
# Simple log aggregation
1. Sign up at https://papertrailapp.com
2. Configure Railway syslog drain
3. Search and archive logs
```

---

## Environment Variables

### Required Variables

```bash
# Production deployment requires these variables:

# Server
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-frontend.vercel.app

# Database
DATABASE_PATH=/data/arcade.db

# Blockchain
CHAIN_ID=338
RPC_URL=https://evm-t3.cronos.org/
USDC_CONTRACT_ADDRESS=0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0
USDC_DECIMALS=6
USDC_DOMAIN_VERSION=1

# Arcade Wallet (CRITICAL - Keep secure!)
ARCADE_WALLET_ADDRESS=0xYOUR_WALLET_ADDRESS
ARCADE_PRIVATE_KEY=0xYOUR_PRIVATE_KEY

# x402 Facilitator
FACILITATOR_URL=https://facilitator.cronoslabs.org

# Logging
LOG_LEVEL=info

# Build Info (set by Railway automatically)
BUILD_TIME=$RAILWAY_DEPLOYMENT_TIMESTAMP
GIT_COMMIT=$RAILWAY_GIT_COMMIT_SHA
GIT_BRANCH=$RAILWAY_GIT_BRANCH
```

### Optional Variables

```bash
# Rate limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Game pricing
SNAKE_PRICE_USDC=0.01
TETRIS_PRICE_USDC=0.02
PRIZE_POOL_PERCENTAGE=70

# Session management
SESSION_EXPIRY_MINUTES=30
```

---

## Troubleshooting

### Health Check Failing

**Symptom:** Railway deployment fails with "Health check timeout"

**Solutions:**

```bash
# 1. Check logs for errors
railway logs --tail 100

# 2. Verify database is accessible
# Check DATABASE_PATH is writable
# Ensure /data directory exists in container

# 3. Test health endpoint locally
docker-compose up
curl http://localhost:3001/health

# 4. Increase healthcheckTimeout
# In railway.json:
"healthcheckTimeout": 20  # Increase from 10 to 20
```

### Logs Not Appearing

**Symptom:** No logs in Railway dashboard

**Solutions:**

```bash
# 1. Verify NODE_ENV=production
# Check environment variables in Railway

# 2. Check console output is not redirected
# Logger writes to stdout/stderr (Railway captures this)

# 3. Ensure no buffering issues
# Add to index.ts:
process.stdout.setMaxListeners(0);

# 4. Test locally with production config
NODE_ENV=production npm start
# You should see JSON logs
```

### Request ID Missing

**Symptom:** Logs don't include requestId field

**Solutions:**

```bash
# 1. Verify middleware order in app.ts
# requestIdMiddleware must be FIRST
app.use(requestIdMiddleware);
app.use(httpLogger);

# 2. Check TypeScript types
# Ensure Express.Request interface is extended

# 3. Test with curl
curl -v https://your-backend.railway.app/api
# Look for X-Request-ID header in response
```

### Database Health Check Error

**Symptom:** `/health` returns database: "error"

**Solutions:**

```bash
# 1. Check database file exists
# In Railway environment:
ls -la /data/arcade.db

# 2. Verify DATABASE_PATH env var
echo $DATABASE_PATH

# 3. Check file permissions
# Database must be writable by app user

# 4. Initialize database
# May need to run migrations on first deploy
```

### Auto-Deploy Not Triggering

**Symptom:** Push to branch doesn't trigger deployment

**Solutions:**

```bash
# 1. Check deploy branch matches
# Railway settings → Source → Deploy Branch

# 2. Verify auto-deploy is enabled
# Railway settings → toggle "Auto Deploy"

# 3. Check watch patterns
# Changes must match patterns in railway.json

# 4. Manual trigger
# Railway dashboard → "Deploy Latest"
```

---

## Next Steps

1. ✅ Configure Railway auto-deploy
2. ✅ Set up health check monitoring
3. ✅ Configure logging aggregation
4. ⏭️ Test deployment end-to-end
5. ⏭️ Set up uptime monitoring (UptimeRobot)
6. ⏭️ Configure alerting (Slack/Discord)
7. ⏭️ Optional: Integrate external log aggregation (Datadog/Logtail)

For production deployment, see: [docs/deployment.md](./deployment.md)
