# Railway Deployment Guide

This guide provides step-by-step instructions for deploying the x402Arcade application to Railway.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Railway Project Setup](#railway-project-setup)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Custom Domains](#custom-domains)
- [Monitoring and Logs](#monitoring-and-logs)
- [Troubleshooting](#troubleshooting)

## Overview

Railway is a modern platform for deploying applications with:

- Automatic deployments from GitHub
- Built-in PostgreSQL, Redis, and other services
- Environment variable management
- Custom domains and SSL
- Reasonable free tier for testing

## Prerequisites

1. **Railway Account**
   - Sign up at [railway.app](https://railway.app)
   - Connect your GitHub account

2. **GitHub Repository**
   - Push your x402Arcade code to GitHub
   - Ensure all changes are committed

3. **Required Accounts**
   - Cronos RPC URL (from Cronos documentation)
   - x402 Facilitator access
   - USDC contract address for target chain

## Railway Project Setup

### 1. Create New Project

```bash
# Install Railway CLI (optional)
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project (or use web dashboard)
railway init
```

**Or via Web Dashboard:**

1. Go to [railway.app/new](https://railway.app/new)
2. Click "New Project"
3. Choose "Deploy from GitHub repo"
4. Select your x402Arcade repository

### 2. Project Structure

Railway will create a single project. You'll deploy:

- **Backend Service** - API server (Node.js + Express)
- **Frontend Service** - React SPA (nginx)

## Backend Deployment

### Step 1: Add Backend Service

1. In Railway project dashboard, click "New Service"
2. Choose "GitHub Repo"
3. Select your repository
4. Configure service:
   - **Name**: `x402arcade-backend`
   - **Root Directory**: `packages/backend`
   - **Builder**: Dockerfile
   - **Start Command**: `node dist/index.js`

### Step 2: Configure Build

Railway will detect the Dockerfile automatically. If needed, create `packages/backend/railway.json`:

```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "node dist/index.js",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 10
  }
}
```

### Step 3: Set Environment Variables

In the Railway dashboard, go to your backend service → Variables tab:

**Required Variables:**

```bash
# Server Configuration
NODE_ENV=production
PORT=8000
HOST=0.0.0.0

# Blockchain Configuration (Cronos Testnet)
CHAIN_ID=338
RPC_URL=https://evm-t3.cronos.org
FACILITATOR_URL=https://x402.cronos.org/v1
USDC_ADDRESS=0x0000000000000000000000000000000000000000

# Application Configuration
GAME_COST_USD=0.01
PRIZE_POOL_PERCENTAGE=70

# Security
CORS_ORIGIN=${{FRONTEND_URL}}  # Will be set after frontend deployment
```

**Note:** Use Railway's `${{SERVICE_NAME.URL}}` syntax for internal references.

### Step 4: Deploy

Railway will automatically deploy when you push to your connected branch (usually `main`).

Monitor deployment:

1. Go to "Deployments" tab
2. Watch build logs
3. Wait for "Success" status

### Step 5: Verify Deployment

```bash
# Get your backend URL from Railway dashboard
BACKEND_URL=https://your-backend.railway.app

# Test health endpoint
curl $BACKEND_URL/health

# Expected: {"status":"ok","timestamp":"..."}
```

## Frontend Deployment

### Step 1: Add Frontend Service

1. In Railway project, click "New Service"
2. Choose "GitHub Repo"
3. Select your repository (same repo, different service)
4. Configure service:
   - **Name**: `x402arcade-frontend`
   - **Root Directory**: `packages/frontend`
   - **Builder**: Dockerfile

### Step 2: Configure Build Arguments

The frontend Dockerfile accepts build-time environment variables. Set these in Railway:

**Build Arguments (in Variables tab):**

```bash
# Set these as build-time variables
VITE_API_URL=${{BACKEND.URL}}  # Reference to backend service
VITE_CHAIN_ID=338
VITE_RPC_URL=https://evm-t3.cronos.org
VITE_USDC_ADDRESS=0x0000000000000000000000000000000000000000
```

**Important:** Vite environment variables must be set at build time, not runtime!

### Step 3: Deploy

Frontend will auto-deploy after backend. Monitor in Deployments tab.

### Step 4: Update Backend CORS

After frontend deploys:

1. Go to backend service Variables
2. Update `CORS_ORIGIN` to your frontend URL:
   ```bash
   CORS_ORIGIN=https://your-frontend.railway.app
   ```
3. Redeploy backend (Railway auto-deploys on variable change)

### Step 5: Verify Deployment

1. Open frontend URL in browser
2. Check Network tab - API calls should succeed
3. Test wallet connection
4. Verify game functionality

## Environment Variables

### Backend Environment Variables

| Variable                | Required | Default    | Description         | Example                         |
| ----------------------- | -------- | ---------- | ------------------- | ------------------------------- |
| `NODE_ENV`              | No       | production | Node environment    | `production`                    |
| `PORT`                  | No       | 8000       | Server port         | `8000`                          |
| `HOST`                  | No       | 0.0.0.0    | Server host         | `0.0.0.0`                       |
| `CHAIN_ID`              | Yes      | -          | Blockchain chain ID | `338` (testnet), `25` (mainnet) |
| `RPC_URL`               | Yes      | -          | RPC endpoint        | `https://evm-t3.cronos.org`     |
| `FACILITATOR_URL`       | Yes      | -          | x402 facilitator    | `https://x402.cronos.org/v1`    |
| `USDC_ADDRESS`          | Yes      | -          | USDC contract       | `0x...`                         |
| `GAME_COST_USD`         | No       | 0.01       | Game cost           | `0.01`                          |
| `PRIZE_POOL_PERCENTAGE` | No       | 70         | Prize pool %        | `70`                            |
| `CORS_ORIGIN`           | No       | \*         | Allowed origins     | `https://app.example.com`       |
| `DATABASE_URL`          | No       | (SQLite)   | Database connection | For PostgreSQL                  |

### Frontend Environment Variables

| Variable            | Required | Default | Description         | Example                     |
| ------------------- | -------- | ------- | ------------------- | --------------------------- |
| `VITE_API_URL`      | Yes      | -       | Backend API URL     | `https://api.example.com`   |
| `VITE_CHAIN_ID`     | Yes      | -       | Blockchain chain ID | `338`                       |
| `VITE_RPC_URL`      | Yes      | -       | RPC endpoint        | `https://evm-t3.cronos.org` |
| `VITE_USDC_ADDRESS` | Yes      | -       | USDC contract       | `0x...`                     |

**Important Notes:**

- Frontend variables must start with `VITE_`
- Frontend variables are baked into the build (not runtime)
- Changing frontend variables requires rebuild

### Using Railway's Built-in Variables

Railway provides special variables for service references:

```bash
# Reference another service's URL
VITE_API_URL=${{BACKEND.URL}}

# Reference service's domain
CORS_ORIGIN=${{FRONTEND.URL}}

# Railway-provided variables
DATABASE_URL=${{DATABASE_URL}}  # If using Railway PostgreSQL
RAILWAY_ENVIRONMENT=${{RAILWAY_ENVIRONMENT}}
```

## Database Setup

### Option 1: SQLite (Default)

The backend uses SQLite by default. No additional setup needed.

**Pros:**

- Simple, no external service
- Included in Docker image
- Good for testing

**Cons:**

- Data lost on redeploy (use volumes)
- Not suitable for production scale

**To persist SQLite on Railway:**

1. Go to backend service → Volumes
2. Add volume: `/app/data`

### Option 2: Railway PostgreSQL

For production, use PostgreSQL:

1. **Add PostgreSQL Service**
   - In Railway project, click "New"
   - Choose "Database" → "PostgreSQL"
   - Railway creates database automatically

2. **Get Connection String**
   - Go to PostgreSQL service → Variables
   - Copy `DATABASE_URL`

3. **Update Backend**
   - Add to backend variables: `DATABASE_URL=${{DATABASE.URL}}`
   - Update backend code to use PostgreSQL (if needed)

4. **Migrate Database**
   ```bash
   # SSH into backend service (Railway CLI)
   railway run npm run db:migrate
   ```

## Custom Domains

### Add Custom Domain

1. Go to service → Settings → Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `app.example.com`)
4. Follow DNS setup instructions
5. Railway provides automatic SSL

### Example DNS Setup

```
Type: CNAME
Name: app (or @ for apex)
Value: your-service.railway.app
TTL: 3600
```

### Update Environment Variables

After adding domains, update:

```bash
# Backend
CORS_ORIGIN=https://app.example.com

# Frontend
VITE_API_URL=https://api.example.com
```

## Monitoring and Logs

### View Logs

**Via Dashboard:**

1. Go to service → Logs tab
2. Real-time logs appear here
3. Filter by level or search

**Via CLI:**

```bash
railway logs --service x402arcade-backend
railway logs --service x402arcade-frontend --follow
```

### Metrics

Railway provides:

- CPU usage
- Memory usage
- Network traffic
- Request count
- Error rate

Access in service → Metrics tab.

### Alerts

Set up alerts for:

- Deployment failures
- Health check failures
- High resource usage

## Troubleshooting

### Build Failures

**Problem:** Docker build fails

**Solutions:**

1. Check build logs for errors
2. Verify Dockerfile syntax
3. Test build locally:
   ```bash
   docker build -f packages/backend/Dockerfile packages/backend
   ```
4. Check disk space limits (Railway free tier: 1GB)

### Health Check Failing

**Problem:** Service shows as unhealthy

**Solutions:**

1. Verify `/health` endpoint works:
   ```bash
   curl https://your-service.railway.app/health
   ```
2. Check health check configuration
3. Increase `healthcheckTimeout` in `railway.json`

### CORS Errors

**Problem:** Frontend can't call backend

**Solutions:**

1. Check backend `CORS_ORIGIN` includes frontend URL
2. Verify frontend URL is correct (no trailing slash)
3. Test API directly:
   ```bash
   curl -H "Origin: https://your-frontend.railway.app" https://your-backend.railway.app/health
   ```

### Environment Variables Not Working

**Problem:** App behavior indicates wrong config

**Solutions:**

1. **Frontend:** Variables must be set during build
   - Trigger rebuild after changing variables
   - Use `railway up --detach` or redeploy in dashboard
2. **Backend:** Variables loaded at runtime
   - Just redeploy (automatic with variable change)
3. Check variable syntax (no quotes needed in Railway)

### Database Connection Issues

**Problem:** Can't connect to PostgreSQL

**Solutions:**

1. Verify `DATABASE_URL` is set
2. Check database service is running
3. Test connection:
   ```bash
   railway run npm run db:test
   ```

### Out of Memory

**Problem:** Service crashes with OOM

**Solutions:**

1. Check memory usage in Metrics
2. Upgrade Railway plan (free: 512MB, hobby: 8GB)
3. Optimize application:
   - Reduce concurrent requests
   - Add pagination
   - Cache responses

### Deployment Taking Too Long

**Problem:** Build exceeds time limit

**Solutions:**

1. Optimize Docker layers (use cache)
2. Reduce dependencies
3. Use Railway's build cache:
   ```json
   {
     "build": {
       "builder": "DOCKERFILE",
       "buildCommand": "pnpm install --frozen-lockfile"
     }
   }
   ```

## Best Practices

### 1. Use Railway Templates

Create templates for easy redeployment:

- Go to project → Settings → Deploy Template
- Configures variables and services

### 2. Staging Environment

Create separate Railway project for staging:

```bash
railway environment create staging
railway environment staging
```

### 3. Secrets Management

Use Railway's built-in secrets (not .env files):

- Secrets are encrypted
- Access via environment variables
- Scoped per environment

### 4. CI/CD Integration

Railway auto-deploys from GitHub:

- **Branch:** Deploy `main` to production
- **PR Previews:** Enable in Settings → Deploy
- **Rollback:** Use Deployments tab

### 5. Resource Monitoring

Set up alerts before hitting limits:

- Memory: Alert at 80%
- CPU: Alert at 90%
- Disk: Alert at 85%

## Cost Estimation

### Railway Pricing (as of 2026)

| Tier  | Price     | Resources                  | Use Case       |
| ----- | --------- | -------------------------- | -------------- |
| Free  | $0/month  | $5 credit/month, 512MB RAM | Development    |
| Hobby | $5/month  | $5 credit + pay as you go  | Small projects |
| Pro   | $20/month | $20 credit + pay as you go | Production     |

### Estimated Monthly Cost

**Development (Free Tier):**

- Backend + Frontend: $0 (within free credits)
- PostgreSQL: $0 (Railway provides free tier)

**Production (Hobby):**

- Backend: ~$5/month (constant running)
- Frontend: ~$3/month (static, less resources)
- PostgreSQL: Included
- **Total:** ~$8/month

## Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Cronos Documentation](https://docs.cronos.org)
- [x402 Protocol](https://x402.org)

---

**Last Updated:** January 25, 2026

For more deployment options, see:

- [Vercel Deployment](./VERCEL_DEPLOYMENT.md)
- [AWS Deployment](./AWS_DEPLOYMENT.md)
- [Docker Deployment](../packages/backend/DOCKER.md)
