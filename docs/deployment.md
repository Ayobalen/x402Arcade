# Deployment Guide

This document describes the deployment process for x402Arcade, including production deployments and PR previews.

## Architecture

x402Arcade uses a modern JAMstack architecture:

- **Frontend:** Static React SPA deployed to Vercel
- **Backend:** Node.js API server deployed to Railway
- **Database:** SQLite (managed by Railway)
- **Blockchain:** Cronos Testnet (decentralized)

## Deployment Workflows

### 1. Production Deployment (`deploy.yml`)

Triggers automatically on push to `main` branch.

**Steps:**

1. **Check Prerequisites**
   - Verifies all CI checks passed
   - Prevents deployment if tests/lint fail

2. **Deploy Frontend (Vercel)**
   - Builds React app with production env vars
   - Deploys to Vercel with `--prod` flag
   - Comments deployment URL on commit

3. **Deploy Backend (Railway)**
   - Builds Express server
   - Deploys to Railway using CLI
   - Comments deployment status

4. **Health Check**
   - Waits 30s for propagation
   - Checks backend `/health` endpoint
   - Verifies frontend is accessible
   - Fails deployment if unhealthy

5. **Notify Complete**
   - Posts summary to GitHub
   - Notifies on failures

**Manual Trigger:**

```bash
# Via GitHub UI
Actions → Deploy → Run workflow → Run workflow

# Via GitHub CLI
gh workflow run deploy.yml
```

### 2. PR Preview Deployment (`preview.yml`)

Triggers automatically on pull requests to `main` or `develop`.

**Steps:**

1. **Deploy Preview**
   - Builds frontend with preview env vars
   - Deploys to Vercel preview environment
   - Unique URL per PR (e.g., `x402arcade-pr-123.vercel.app`)
   - Comments preview URL on PR
   - Adds testing checklist

2. **Update on New Commits**
   - Preview automatically updates on new commits
   - Existing PR comment is updated with new URL

3. **Cleanup on PR Close**
   - Preview deployment is removed
   - Comment posted confirming cleanup

## Service Configuration

### Vercel (Frontend)

#### 1. Create Project

1. Visit https://vercel.com/
2. Sign in with GitHub
3. Import repository: `x402Arcade`
4. Configure project:
   - Framework Preset: **Vite**
   - Root Directory: **packages/frontend**
   - Build Command: `pnpm build`
   - Output Directory: `dist`
   - Install Command: `pnpm install`

#### 2. Get Project IDs

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
cd packages/frontend
vercel link

# Get project details
vercel project ls
```

Copy:

- **Project ID** (e.g., `prj_abc123...`)
- **Org ID** (found in team settings)

#### 3. Generate Deploy Token

1. Go to https://vercel.com/account/tokens
2. Create new token: "GitHub Actions Deploy"
3. Copy token (starts with `ver_...`)

#### 4. Configure Environment Variables

In Vercel dashboard → Project → Settings → Environment Variables:

```
VITE_API_URL=https://your-backend.railway.app
VITE_CHAIN_ID=338
VITE_USDC_ADDRESS=0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0
VITE_EXPLORER_URL=https://explorer.cronos.org/testnet
```

**Environments:**

- Production: `main` branch
- Preview: All other branches

### Railway (Backend)

#### 1. Create Project

1. Visit https://railway.app/
2. Sign in with GitHub
3. New Project → Deploy from GitHub repo
4. Select `x402Arcade` repository
5. Configure service:
   - Root Directory: **packages/backend**
   - Build Command: `pnpm build`
   - Start Command: `pnpm start`

#### 2. Get Service Details

From Railway dashboard:

- **Project ID:** In project settings
- **Service Name:** Name of your service (e.g., `x402arcade-backend`)
- **App URL:** Public domain (e.g., `https://x402arcade-backend.up.railway.app`)

#### 3. Generate Deploy Token

1. Go to Account Settings → Tokens
2. Create new token: "GitHub Actions Deploy"
3. Copy token

#### 4. Configure Environment Variables

In Railway dashboard → Service → Variables:

```bash
# Server
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
CORS_ORIGIN=https://your-frontend.vercel.app

# Database
DATABASE_PATH=./data/arcade.db

# Blockchain
CHAIN_ID=338
RPC_URL=https://evm-t3.cronos.org/
EXPLORER_URL=https://explorer.cronos.org/testnet

# Contracts
USDC_CONTRACT_ADDRESS=0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0
USDC_DECIMALS=6
USDC_DOMAIN_VERSION=1

# Arcade Wallet
ARCADE_WALLET_ADDRESS=<your-wallet-address>
ARCADE_PRIVATE_KEY=<your-private-key>

# x402 Facilitator
FACILITATOR_URL=https://facilitator.cronoslabs.org

# Game Config
SNAKE_PRICE_USDC=0.01
TETRIS_PRICE_USDC=0.02
PRIZE_POOL_PERCENTAGE=70
SESSION_EXPIRY_MINUTES=30
```

#### 5. Add Health Check Endpoint

Create `/health` endpoint in backend:

```typescript
// packages/backend/src/routes/health.routes.ts
import { Router } from 'express';

const router = Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
```

## GitHub Secrets Configuration

Add these secrets to your GitHub repository:

**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### Vercel Secrets

| Secret Name         | Description            | Example          |
| ------------------- | ---------------------- | ---------------- |
| `VERCEL_TOKEN`      | Vercel deploy token    | `ver_abc123...`  |
| `VERCEL_ORG_ID`     | Vercel organization ID | `team_abc123...` |
| `VERCEL_PROJECT_ID` | Vercel project ID      | `prj_abc123...`  |

### Railway Secrets

| Secret Name            | Description          | Example                                     |
| ---------------------- | -------------------- | ------------------------------------------- |
| `RAILWAY_TOKEN`        | Railway deploy token | `abc123...`                                 |
| `RAILWAY_SERVICE_NAME` | Service name         | `x402arcade-backend`                        |
| `RAILWAY_APP_URL`      | Public URL           | `https://x402arcade-backend.up.railway.app` |

### Frontend Environment Variables

| Secret Name            | Description                  | Example                                      |
| ---------------------- | ---------------------------- | -------------------------------------------- |
| `VITE_API_URL`         | Backend API URL (production) | `https://x402arcade-backend.up.railway.app`  |
| `VITE_API_URL_PREVIEW` | Backend API URL (preview)    | Same or staging URL                          |
| `VITE_CHAIN_ID`        | Cronos chain ID              | `338`                                        |
| `VITE_USDC_ADDRESS`    | USDC contract address        | `0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0` |
| `VITE_EXPLORER_URL`    | Block explorer URL           | `https://explorer.cronos.org/testnet`        |

## Deployment Process

### Production Deployment

1. **Develop Feature:**

   ```bash
   git checkout -b feature/my-feature
   # Make changes
   git commit -m "feat: add new feature"
   git push origin feature/my-feature
   ```

2. **Create Pull Request:**
   - Open PR to `main` branch
   - CI runs automatically (lint, test, build)
   - Preview deployment created
   - Review changes in preview

3. **Review and Merge:**
   - Request reviews from team
   - Address feedback
   - Ensure all checks pass
   - Merge to `main`

4. **Automatic Deployment:**
   - Deploy workflow triggers on merge to `main`
   - Frontend deploys to Vercel
   - Backend deploys to Railway
   - Health checks run
   - Deployment status posted

5. **Verify Deployment:**
   - Check deployment URLs in GitHub comments
   - Visit production site
   - Test critical flows
   - Monitor logs for errors

### Rollback Procedure

#### Via Vercel

1. Go to Vercel dashboard → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

#### Via Railway

1. Go to Railway dashboard → Deployments
2. Find previous working deployment
3. Click "Redeploy"

#### Via Git

```bash
# Revert commit
git revert <commit-hash>
git push origin main

# Or reset to previous commit (caution!)
git reset --hard <commit-hash>
git push --force origin main
```

**Note:** Force push will trigger CI checks before deployment.

## Monitoring and Logs

### Vercel

**Access Logs:**

1. Vercel Dashboard → Project → Deployments
2. Click on deployment
3. View "Runtime Logs"

**Or via CLI:**

```bash
vercel logs <deployment-url>
```

### Railway

**Access Logs:**

1. Railway Dashboard → Service → Deployments
2. Click on active deployment
3. View logs in real-time

**Or via CLI:**

```bash
railway logs --service x402arcade-backend
```

## Environment Management

### Environment Strategy

| Environment | Branch      | Frontend URL                 | Backend URL                         |
| ----------- | ----------- | ---------------------------- | ----------------------------------- |
| Production  | `main`      | `x402arcade.vercel.app`      | `x402arcade-backend.up.railway.app` |
| Preview     | PR branches | `x402arcade-pr-X.vercel.app` | Same as production (or staging)     |
| Local       | Any         | `localhost:5173`             | `localhost:3001`                    |

### Creating Staging Environment

For a dedicated staging environment:

1. **Create `develop` branch**
2. **Add branch to deploy workflow:**

```yaml
on:
  push:
    branches: [main, develop]
```

3. **Create separate Railway service** for staging backend
4. **Update secrets** with staging URLs

## Custom Domains

### Frontend (Vercel)

1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add domain: `arcade.yourdomain.com`
3. Configure DNS:
   - CNAME: `cname.vercel-dns.com`
   - Or A record: Vercel IP
4. Wait for verification (< 24 hours)

### Backend (Railway)

1. Go to Railway Dashboard → Service → Settings
2. Add custom domain: `api.yourdomain.com`
3. Configure DNS:
   - CNAME: Railway provides target
4. Wait for SSL certificate (automatic)

## SSL/TLS Certificates

Both Vercel and Railway provide automatic SSL certificates via Let's Encrypt.

**Features:**

- ✅ Automatic renewal
- ✅ Wildcard certificates for preview deployments
- ✅ TLS 1.3 support
- ✅ HTTP/2 enabled

## Performance Optimization

### Frontend (Vercel)

- ✅ Global CDN (Edge Network)
- ✅ Brotli compression
- ✅ Image optimization (Vercel Image)
- ✅ Automatic static asset caching
- ✅ HTTP/3 support

**Additional:**

```typescript
// vite.config.ts
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          router: ['react-router-dom'],
          blockchain: ['viem'],
        },
      },
    },
  },
};
```

### Backend (Railway)

- ✅ Health checks
- ✅ Auto-scaling (paid plans)
- ✅ Zero-downtime deployments
- ✅ Connection pooling

**Recommendations:**

1. Enable Railway's Redis for caching
2. Use connection pooling for database
3. Implement rate limiting
4. Add response compression

## Cost Estimation

### Vercel

**Hobby (Free):**

- 100 GB bandwidth/month
- Unlimited deployments
- Limited serverless executions

**Pro ($20/month):**

- 1 TB bandwidth
- Advanced analytics
- Team collaboration

### Railway

**Developer ($5/month):**

- 5 USD in usage credits
- Unlimited projects
- Pay for what you use

**Usage:**

- ~$0.000463/GB-hour (memory)
- ~$0.000231/vCPU-hour

**Estimated monthly cost:** $5-15 depending on traffic

## Troubleshooting

### Deployment Fails: "CI checks not passed"

**Solution:**

- Ensure all CI checks pass before merging
- Check GitHub Actions logs for failures
- Fix issues and push again

### Preview Deployment Not Updating

**Solution:**

- Check if concurrency is cancelling deployments
- Verify Vercel token is valid
- Check GitHub Actions logs

### Backend Health Check Fails

**Solution:**

- Verify `/health` endpoint exists
- Check Railway logs for errors
- Ensure backend is actually running
- Verify CORS configuration

### Frontend Not Loading API Data

**Solution:**

- Check `VITE_API_URL` is correct
- Verify CORS allows frontend origin
- Check browser console for errors
- Test API endpoint directly

### Database Connection Errors

**Solution:**

- Verify `DATABASE_PATH` in Railway env vars
- Check if database volume is mounted
- Review Railway storage limits
- Check database file permissions

## Security Considerations

### Secrets Management

- ✅ Store secrets in GitHub Secrets, not code
- ✅ Rotate tokens regularly
- ✅ Use separate tokens for different services
- ✅ Limit token permissions to minimum required

### CORS Configuration

```typescript
// Backend CORS config
app.use(
  cors({
    origin: [
      'https://x402arcade.vercel.app',
      'https://x402arcade-*.vercel.app', // Previews
      process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : '',
    ].filter(Boolean),
    credentials: true,
  })
);
```

### Environment Variables

- ❌ Never commit `.env` files
- ✅ Use platform-specific env var management
- ✅ Validate env vars on startup
- ✅ Use different values for prod/preview/local

## Continuous Deployment Best Practices

1. **Always deploy from `main`**
   - Keep `main` stable
   - Deploy only after PR review

2. **Test in preview first**
   - Use PR previews for testing
   - Get stakeholder approval

3. **Monitor deployments**
   - Check logs after deployment
   - Set up error monitoring (Sentry)
   - Monitor performance (Vercel Analytics)

4. **Rollback quickly**
   - Keep previous deployments accessible
   - Have rollback plan ready
   - Test rollback procedure

5. **Document incidents**
   - Record deployment issues
   - Create postmortems
   - Update runbooks

## Resources

### Documentation

- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app/)
- [Vite Deployment](https://vitejs.dev/guide/static-deploy.html)
- [Express Production Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)

### CLI Tools

- [Vercel CLI](https://vercel.com/docs/cli)
- [Railway CLI](https://docs.railway.app/develop/cli)
- [GitHub CLI](https://cli.github.com/)

### Monitoring

- [Vercel Analytics](https://vercel.com/analytics)
- [Railway Observability](https://docs.railway.app/reference/observability)
- [Sentry](https://sentry.io/) (Error tracking)
- [Datadog](https://www.datadoghq.com/) (APM)

## Support

- **Vercel Support:** support@vercel.com
- **Railway Support:** https://railway.app/help
- **GitHub Actions:** https://github.com/actions
