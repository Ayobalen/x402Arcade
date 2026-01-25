# Deployment Guide - x402Arcade

This guide covers deploying x402Arcade to production for the Cronos x402 Hackathon.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
- [Backend Deployment (Docker)](#backend-deployment-docker)
- [Environment Configuration](#environment-configuration)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Domain & DNS Setup](#domain--dns-setup)
- [Post-Deployment Verification](#post-deployment-verification)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                         Internet                             │
└────────────┬─────────────────────────────────┬───────────────┘
             │                                 │
             │                                 │
    ┌────────▼─────────┐              ┌───────▼────────┐
    │   Vercel CDN     │              │  Backend API   │
    │  (Frontend SPA)  │              │  (Docker)      │
    │                  │              │                │
    │ x402arcade.com   │─────────────▶│ api.x402...com │
    └──────────────────┘              └────────┬───────┘
             │                                 │
             │                                 │
             ▼                                 ▼
    ┌──────────────────┐              ┌────────────────┐
    │  User's Browser  │              │  Cronos Chain  │
    │  (Web3 Wallet)   │◀────────────▶│  (Testnet)     │
    └──────────────────┘              └────────────────┘
```

**Components:**

- **Frontend**: React SPA hosted on Vercel
- **Backend**: Express.js API in Docker container
- **Blockchain**: Cronos Testnet (Chain ID: 338)
- **Payment**: x402 protocol via Cronos Labs Facilitator

---

## Prerequisites

Before deploying, ensure you have:

1. **Vercel Account** - For frontend hosting (free tier works)
2. **Domain Name** (optional) - e.g., `x402arcade.com`
3. **Docker Registry Access** - Docker Hub, GitHub Container Registry, or cloud provider
4. **Cloud Server** - For backend (Railway, DigitalOcean, AWS, GCP, etc.)
5. **Cronos Wallet** - With TCRO and devUSDC.e for testing
6. **WalletConnect Project ID** - From https://cloud.walletconnect.com

### Get Test Tokens

```bash
# Get TCRO (gas for arcade wallet)
# Visit: https://cronos.org/faucet

# Get devUSDC.e (for players)
# Visit: https://faucet.cronos.org/

# Note: 24hr limit. If stuck, ask in Telegram: https://t.me/+a4jj5hyJl0NmMDll
```

---

## Frontend Deployment (Vercel)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Configure Environment Variables

Create environment variables in Vercel dashboard or via CLI:

```bash
# Production API URL (update after backend is deployed)
vercel env add VITE_API_URL production
# Enter: https://api.x402arcade.com

# Blockchain configuration
vercel env add VITE_CHAIN_ID production
# Enter: 338

vercel env add VITE_RPC_URL production
# Enter: https://evm-t3.cronos.org

vercel env add VITE_USDC_ADDRESS production
# Enter: 0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0

# WalletConnect Project ID
vercel env add VITE_WALLETCONNECT_PROJECT_ID production
# Enter: your_project_id_from_cloud_walletconnect_com
```

### Step 4: Deploy Frontend

```bash
# From project root
vercel --prod

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name? x402arcade
# - Directory? ./
# - Override settings? No
```

### Step 5: Custom Domain (Optional)

```bash
# Add custom domain
vercel domains add x402arcade.com

# Follow DNS configuration prompts
# Vercel will automatically provision SSL certificate
```

**Deployment URL**: `https://x402arcade.vercel.app` (or custom domain)

---

## Backend Deployment (Docker)

### Option A: Railway (Recommended for Hackathon)

Railway provides free tier with automatic SSL and easy database persistence.

#### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

#### Step 2: Login to Railway

```bash
railway login
```

#### Step 3: Create New Project

```bash
cd packages/backend
railway init
# Project name: x402arcade-backend
```

#### Step 4: Set Environment Variables

```bash
# Required variables
railway variables set NODE_ENV=production
railway variables set PORT=8000
railway variables set CORS_ORIGIN=https://x402arcade.com

# Database
railway variables set DATABASE_PATH=/app/data/arcade.db

# Blockchain
railway variables set CHAIN_ID=338
railway variables set RPC_URL=https://evm-t3.cronos.org
railway variables set USDC_CONTRACT_ADDRESS=0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0

# CRITICAL: Arcade wallet (use Railway secrets for private key!)
railway variables set ARCADE_WALLET_ADDRESS=0x...
railway variables set ARCADE_PRIVATE_KEY=0x...

# x402 Facilitator
railway variables set FACILITATOR_URL=https://facilitator.cronoslabs.org
```

#### Step 5: Deploy

```bash
railway up
```

#### Step 6: Add Custom Domain

```bash
# In Railway dashboard:
# Settings → Domains → Custom Domain → Add x402arcade.com
# Update DNS records as instructed
```

**Deployment URL**: `https://x402arcade-backend.up.railway.app` (or custom domain)

---

### Option B: Docker Compose (Self-Hosted)

For VPS deployment (DigitalOcean, AWS EC2, etc.)

#### Step 1: Build Images

```bash
# From project root
docker-compose build
```

#### Step 2: Configure docker-compose.yml

Update `docker-compose.yml` with production values:

```yaml
services:
  backend:
    image: x402arcade/backend:latest
    environment:
      - NODE_ENV=production
      - ARCADE_WALLET_ADDRESS=${ARCADE_WALLET_ADDRESS}
      - ARCADE_PRIVATE_KEY=${ARCADE_PRIVATE_KEY}
    volumes:
      - ./data:/app/data
    restart: unless-stopped

  frontend:
    image: x402arcade/frontend:latest
    build:
      args:
        - VITE_API_URL=https://api.x402arcade.com
    restart: unless-stopped
```

#### Step 3: Deploy

```bash
# Set secrets
export ARCADE_WALLET_ADDRESS=0x...
export ARCADE_PRIVATE_KEY=0x...

# Start services
docker-compose -f docker-compose.yml up -d

# Check logs
docker-compose logs -f
```

---

### Option C: Cloud Providers (AWS/GCP/Azure)

#### AWS ECS/Fargate

```bash
# Push images to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com

docker tag x402arcade/backend:latest <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/x402arcade-backend:latest
docker push <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/x402arcade-backend:latest

# Create ECS task definition and service (use AWS Console or Terraform)
```

#### Google Cloud Run

```bash
# Build and push
gcloud builds submit --tag gcr.io/[PROJECT-ID]/x402arcade-backend packages/backend

# Deploy
gcloud run deploy x402arcade-backend \
  --image gcr.io/[PROJECT-ID]/x402arcade-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,CHAIN_ID=338
```

---

## Environment Configuration

### Frontend (.env.production)

Located at `packages/frontend/.env.production`:

```bash
VITE_API_URL=https://api.x402arcade.com
VITE_CHAIN_ID=338
VITE_RPC_URL=https://evm-t3.cronos.org
VITE_USDC_ADDRESS=0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
VITE_ENABLE_PWA=true
VITE_VERSION=2.0.0
```

**Important**: Do NOT commit actual secrets. Use Vercel environment variables.

### Backend (.env.production)

Located at `packages/backend/.env.production`:

```bash
NODE_ENV=production
PORT=8000
CORS_ORIGIN=https://x402arcade.com
DATABASE_PATH=/app/data/arcade.db

# Blockchain
CHAIN_ID=338
RPC_URL=https://evm-t3.cronos.org
USDC_CONTRACT_ADDRESS=0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0

# Arcade Wallet (USE SECRETS MANAGER!)
ARCADE_WALLET_ADDRESS=
ARCADE_PRIVATE_KEY=

# x402 Facilitator
FACILITATOR_URL=https://facilitator.cronoslabs.org

# Game Pricing
SNAKE_PRICE_USDC=0.01
TETRIS_PRICE_USDC=0.02
PRIZE_POOL_PERCENTAGE=70
```

**Important**: NEVER commit `ARCADE_PRIVATE_KEY`. Use Railway secrets, AWS Secrets Manager, or similar.

---

## SSL/TLS Configuration

### Vercel (Automatic)

Vercel automatically provisions SSL certificates via Let's Encrypt:

- Automatic for `*.vercel.app` domains
- Automatic for custom domains (once DNS is configured)
- No manual configuration needed

### Backend (Railway - Automatic)

Railway automatically provisions SSL for custom domains.

### Backend (Self-Hosted - Manual)

If self-hosting, use Caddy or nginx with Let's Encrypt:

#### Using Caddy (Recommended)

Create `Caddyfile`:

```
api.x402arcade.com {
    reverse_proxy localhost:8000

    # Security headers
    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        X-XSS-Protection "1; mode=block"
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    }
}
```

Run Caddy:

```bash
caddy run --config Caddyfile
```

Caddy automatically obtains and renews SSL certificates.

---

## Domain & DNS Setup

### DNS Records

Configure the following DNS records:

#### Frontend (Vercel)

| Type  | Name | Value                | TTL  |
| ----- | ---- | -------------------- | ---- |
| A     | @    | 76.76.21.21          | 3600 |
| CNAME | www  | cname.vercel-dns.com | 3600 |

#### Backend (Railway or Custom)

| Type | Name | Value                          | TTL  |
| ---- | ---- | ------------------------------ | ---- |
| A    | api  | [Railway IP or your server IP] | 3600 |

**Wait 5-60 minutes for DNS propagation.**

### Verify DNS

```bash
# Check frontend
dig x402arcade.com +short

# Check backend
dig api.x402arcade.com +short
```

---

## Post-Deployment Verification

### 1. Frontend Health Check

```bash
curl https://x402arcade.com
# Should return HTML with React app
```

### 2. Backend Health Check

```bash
curl https://api.x402arcade.com/health
# Expected: {"status":"ok","timestamp":"..."}
```

### 3. CORS Check

```bash
curl -H "Origin: https://x402arcade.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://api.x402arcade.com/api/play/snake \
     -v
# Should include Access-Control-Allow-Origin header
```

### 4. x402 Payment Flow Test

1. Visit `https://x402arcade.com`
2. Connect wallet (MetaMask, Coinbase Wallet, etc.)
3. Select a game (e.g., Snake)
4. Approve USDC payment
5. Verify game starts
6. Check transaction on Cronos Explorer: `https://explorer.cronos.org/testnet`

### 5. SSL Certificate Check

```bash
# Frontend
curl -I https://x402arcade.com | grep -i strict-transport

# Backend
curl -I https://api.x402arcade.com | grep -i strict-transport
```

---

## Troubleshooting

### Frontend Issues

#### 1. "Failed to fetch" errors

**Cause**: CORS misconfiguration or backend not accessible

**Fix**:

```bash
# Verify backend CORS_ORIGIN includes frontend domain
railway variables set CORS_ORIGIN=https://x402arcade.com

# Restart backend
railway restart
```

#### 2. Wallet connection fails

**Cause**: Invalid WalletConnect Project ID

**Fix**:

```bash
# Get new project ID from https://cloud.walletconnect.com
vercel env add VITE_WALLETCONNECT_PROJECT_ID production
vercel --prod
```

### Backend Issues

#### 1. Database errors

**Cause**: Persistence volume not mounted

**Fix (Railway)**:

```bash
# Add volume in Railway dashboard:
# Settings → Volumes → New Volume → /app/data
```

**Fix (Docker)**:

```bash
# Ensure volume is mounted in docker-compose.yml
volumes:
  - ./data:/app/data
```

#### 2. Payment settlement fails

**Cause**: Arcade wallet has insufficient TCRO for gas

**Fix**:

```bash
# Fund arcade wallet with TCRO from faucet
# https://cronos.org/faucet
```

#### 3. Better-sqlite3 build errors

**Cause**: Native module compilation issue

**Fix**: Use multi-stage Docker build (already configured in Dockerfile)

### SSL Issues

#### 1. Certificate not provisioning

**Cause**: DNS not properly configured

**Fix**:

```bash
# Verify DNS
dig api.x402arcade.com +short

# Should point to correct IP
# Wait up to 1 hour for propagation
```

---

## Environment Variable Checklist

Before deploying, ensure these are set:

### Frontend (Vercel)

- [ ] `VITE_API_URL`
- [ ] `VITE_CHAIN_ID`
- [ ] `VITE_RPC_URL`
- [ ] `VITE_USDC_ADDRESS`
- [ ] `VITE_WALLETCONNECT_PROJECT_ID`

### Backend (Railway/Docker)

- [ ] `NODE_ENV=production`
- [ ] `PORT=8000`
- [ ] `CORS_ORIGIN`
- [ ] `DATABASE_PATH`
- [ ] `CHAIN_ID=338`
- [ ] `RPC_URL`
- [ ] `USDC_CONTRACT_ADDRESS`
- [ ] `ARCADE_WALLET_ADDRESS`
- [ ] `ARCADE_PRIVATE_KEY` (SECRET!)
- [ ] `FACILITATOR_URL`

---

## Security Best Practices

1. **Never commit private keys** - Use secrets management
2. **Enable HTTPS only** - Force SSL/TLS
3. **Set CORS properly** - Only allow your frontend domain
4. **Use environment variables** - Never hardcode secrets
5. **Enable rate limiting** - Prevent abuse
6. **Monitor logs** - Set up alerts for errors
7. **Backup database regularly** - SQLite backups to S3/GCS
8. **Use non-root user in Docker** - Already configured
9. **Keep dependencies updated** - Run `npm audit` regularly
10. **Test on testnet first** - Before mainnet deployment

---

## Useful Commands

```bash
# Vercel
vercel --prod                  # Deploy to production
vercel logs                    # View logs
vercel env ls                  # List environment variables
vercel domains ls              # List domains

# Railway
railway up                     # Deploy
railway logs                   # View logs
railway variables              # Manage environment variables
railway status                 # Check deployment status

# Docker
docker-compose up -d           # Start services
docker-compose logs -f         # Follow logs
docker-compose restart         # Restart services
docker-compose down            # Stop services
```

---

## Support

- **Cronos Telegram**: https://t.me/+a4jj5hyJl0NmMDll
- **x402 Documentation**: https://docs.cronoslabs.org/x402
- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs

---

## Hackathon Submission Checklist

Before submitting to DoraHacks:

- [ ] Frontend deployed and accessible
- [ ] Backend deployed and healthy
- [ ] x402 payment flow tested end-to-end
- [ ] Transaction visible on Cronos Explorer
- [ ] Custom domain configured (optional but recommended)
- [ ] Demo video recorded
- [ ] GitHub repository public
- [ ] README.md updated with deployment URL
- [ ] .env files NOT committed (use .env.example only)
- [ ] Project submitted to DoraHacks platform

---

**Good luck with the hackathon! 🚀**
