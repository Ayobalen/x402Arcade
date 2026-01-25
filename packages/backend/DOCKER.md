# Docker Deployment Guide

This guide explains how to build, run, and deploy the x402Arcade backend using Docker.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Building the Image](#building-the-image)
- [Running the Container](#running-the-container)
- [Using Docker Compose](#using-docker-compose)
- [Multi-Stage Build Architecture](#multi-stage-build-architecture)
- [Image Size Optimization](#image-size-optimization)
- [Configuration](#configuration)
- [Health Checks](#health-checks)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Docker 20.10 or higher
- Docker Compose 2.0 or higher (optional)
- At least 1GB of free disk space

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Build and start the backend
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop the backend
docker-compose down
```

### Option 2: Docker CLI

```bash
# Build the image
docker build -t x402arcade-backend .

# Run the container
docker run -d \
  --name x402arcade-backend \
  -p 8000:8000 \
  -v $(pwd)/data:/app/data \
  --env-file .env \
  x402arcade-backend

# View logs
docker logs -f x402arcade-backend
```

## Building the Image

### Production Build

```bash
docker build -t x402arcade-backend:latest .
```

### Development Build

Build only the dependencies stage for development:

```bash
docker build --target dependencies -t x402arcade-backend:dev .
```

### Build with Custom Tag

```bash
docker build -t x402arcade-backend:v1.0.0 .
```

### Build Arguments

Pass build-time variables:

```bash
docker build \
  --build-arg NODE_VERSION=20 \
  -t x402arcade-backend .
```

## Running the Container

### Basic Run

```bash
docker run -d \
  --name x402arcade-backend \
  -p 8000:8000 \
  x402arcade-backend
```

### Run with Environment Variables

```bash
docker run -d \
  --name x402arcade-backend \
  -p 8000:8000 \
  -e NODE_ENV=production \
  -e PORT=8000 \
  -e CHAIN_ID=338 \
  -e RPC_URL=https://evm-t3.cronos.org \
  x402arcade-backend
```

### Run with .env File

```bash
docker run -d \
  --name x402arcade-backend \
  -p 8000:8000 \
  --env-file .env \
  x402arcade-backend
```

### Run with Volume for Database

```bash
docker run -d \
  --name x402arcade-backend \
  -p 8000:8000 \
  -v $(pwd)/data:/app/data \
  x402arcade-backend
```

## Using Docker Compose

### Start All Services

```bash
docker-compose up -d
```

### Start with Development Profile

```bash
docker-compose --profile dev up -d backend-dev
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

### Stop Services

```bash
# Stop and remove containers
docker-compose down

# Stop, remove containers, and remove volumes
docker-compose down -v
```

### Rebuild Services

```bash
docker-compose up -d --build
```

## Multi-Stage Build Architecture

The Dockerfile uses a 4-stage build process for optimization:

### Stage 1: Dependencies

```dockerfile
FROM node:20-alpine AS dependencies
```

- Installs all dependencies (including devDependencies)
- Includes build tools for native modules (better-sqlite3)
- Uses pnpm for faster, more efficient installs

### Stage 2: Builder

```dockerfile
FROM node:20-alpine AS builder
```

- Compiles TypeScript to JavaScript
- Uses dependencies from Stage 1
- Produces the `dist/` directory

### Stage 3: Production Dependencies

```dockerfile
FROM node:20-alpine AS production-dependencies
```

- Installs only production dependencies
- Excludes devDependencies (testing, linting tools)
- Significantly reduces final image size

### Stage 4: Production

```dockerfile
FROM node:20-alpine AS production
```

- Final lightweight image
- Copies only production dependencies
- Copies only built JavaScript (no TypeScript source)
- Runs as non-root user for security
- Includes health check and proper signal handling

## Image Size Optimization

The multi-stage build achieves significant size reduction:

| Stage                  | Approximate Size | Contents               |
| ---------------------- | ---------------- | ---------------------- |
| Dependencies           | ~500MB           | All deps + build tools |
| Builder                | ~600MB           | Source + compiled code |
| Production Deps        | ~150MB           | Prod deps only         |
| **Production (Final)** | **~200MB**       | Runtime only           |

### Optimization Techniques Applied

1. **Alpine Linux Base**: Uses `node:20-alpine` instead of full `node:20` (~900MB)
2. **Multi-Stage Build**: Discards build artifacts and dev dependencies
3. **Layer Caching**: Copies package files before source for better cache hits
4. **Production Dependencies Only**: Uses `pnpm install --prod`
5. **Minimal Runtime Dependencies**: Only sqlite for better-sqlite3
6. **Package Manager Cleanup**: Removes package manager cache
7. **.dockerignore**: Excludes unnecessary files from build context

### Analyzing Image Size

Use the `dive` tool to analyze the image:

```bash
# Install dive
brew install dive  # macOS
# or download from https://github.com/wagoodman/dive

# Analyze the image
dive x402arcade-backend:latest
```

Expected results:

- **Total Image Size**: ~200MB
- **Wasted Space**: <5%
- **Image Efficiency Score**: 95%+

### Measuring Build Context Size

```bash
# Check .dockerignore effectiveness
docker build --no-cache -t x402arcade-backend:test . 2>&1 | grep "Sending build context"

# Expected: Sending build context to Docker daemon  ~50-100KB
# Without .dockerignore: Would be 200MB+ (includes node_modules)
```

## Configuration

### Environment Variables

| Variable                | Required | Default    | Description                               |
| ----------------------- | -------- | ---------- | ----------------------------------------- |
| `NODE_ENV`              | No       | production | Node environment                          |
| `PORT`                  | No       | 8000       | Server port                               |
| `HOST`                  | No       | 0.0.0.0    | Server host                               |
| `CHAIN_ID`              | Yes      | -          | Cronos chain ID (338 testnet, 25 mainnet) |
| `RPC_URL`               | Yes      | -          | Cronos RPC endpoint                       |
| `FACILITATOR_URL`       | Yes      | -          | x402 facilitator URL                      |
| `USDC_ADDRESS`          | Yes      | -          | USDC contract address                     |
| `GAME_COST_USD`         | No       | 0.01       | Cost per game in USD                      |
| `PRIZE_POOL_PERCENTAGE` | No       | 70         | Percentage to prize pool                  |
| `CORS_ORIGIN`           | No       | \*         | Allowed CORS origins                      |

### Using .env File

Create a `.env` file:

```bash
# Server
NODE_ENV=production
PORT=8000

# Blockchain
CHAIN_ID=338
RPC_URL=https://evm-t3.cronos.org
FACILITATOR_URL=https://x402.cronos.org/v1
USDC_ADDRESS=0x0000000000000000000000000000000000000000

# Application
GAME_COST_USD=0.01
PRIZE_POOL_PERCENTAGE=70
CORS_ORIGIN=https://your-frontend.com
```

Mount it in the container:

```bash
docker run -d \
  --name x402arcade-backend \
  -p 8000:8000 \
  --env-file .env \
  x402arcade-backend
```

## Health Checks

The container includes a built-in health check:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8000/health', ...)"
```

### Check Container Health

```bash
# View health status
docker ps

# View health check logs
docker inspect --format='{{json .State.Health}}' x402arcade-backend | jq
```

### Manual Health Check

```bash
# From host
curl http://localhost:8000/health

# From inside container
docker exec x402arcade-backend curl http://localhost:8000/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2026-01-25T12:00:00.000Z"
}
```

## Production Deployment

### Best Practices

1. **Use Specific Tags**: Don't use `latest` in production

   ```bash
   docker build -t x402arcade-backend:v1.0.0 .
   ```

2. **Set Resource Limits**:

   ```bash
   docker run -d \
     --name x402arcade-backend \
     --memory="512m" \
     --cpus="1.0" \
     -p 8000:8000 \
     x402arcade-backend:v1.0.0
   ```

3. **Use Secrets for Sensitive Data**:

   ```bash
   # Store secrets securely
   echo "my-secret-key" | docker secret create api_key -

   # Use in docker-compose.yml
   secrets:
     - api_key
   ```

4. **Enable Logging**:

   ```bash
   docker run -d \
     --name x402arcade-backend \
     --log-driver json-file \
     --log-opt max-size=10m \
     --log-opt max-file=3 \
     x402arcade-backend:v1.0.0
   ```

5. **Use Restart Policies**:

   ```bash
   docker run -d \
     --name x402arcade-backend \
     --restart unless-stopped \
     x402arcade-backend:v1.0.0
   ```

### Container Orchestration

#### Docker Swarm

```bash
# Deploy as a service
docker service create \
  --name x402arcade-backend \
  --replicas 3 \
  --publish 8000:8000 \
  x402arcade-backend:v1.0.0
```

#### Kubernetes

See `k8s/` directory for Kubernetes manifests (if available).

### Registry Push

Push to Docker Hub:

```bash
# Tag for registry
docker tag x402arcade-backend:v1.0.0 yourusername/x402arcade-backend:v1.0.0

# Login
docker login

# Push
docker push yourusername/x402arcade-backend:v1.0.0
```

Push to private registry:

```bash
docker tag x402arcade-backend:v1.0.0 registry.example.com/x402arcade-backend:v1.0.0
docker push registry.example.com/x402arcade-backend:v1.0.0
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs x402arcade-backend

# Check if port is already in use
lsof -i :8000

# Run in foreground to see errors
docker run --rm -it -p 8000:8000 x402arcade-backend
```

### Database Issues

```bash
# Check if data directory exists and has correct permissions
ls -la data/

# Verify volume mount
docker inspect x402arcade-backend | grep -A 10 Mounts

# Access container shell to debug
docker exec -it x402arcade-backend sh
```

### Network Issues

```bash
# Test health endpoint
docker exec x402arcade-backend wget -qO- http://localhost:8000/health

# Check network connectivity
docker exec x402arcade-backend ping -c 3 google.com

# Inspect network
docker network inspect x402arcade-network
```

### Build Failures

```bash
# Clear build cache
docker builder prune -af

# Build without cache
docker build --no-cache -t x402arcade-backend .

# Check for build errors
docker build -t x402arcade-backend . 2>&1 | tee build.log
```

### Performance Issues

```bash
# Check container resource usage
docker stats x402arcade-backend

# Check container processes
docker top x402arcade-backend

# View detailed metrics
docker inspect x402arcade-backend
```

### Image Size Too Large

```bash
# Analyze with dive
dive x402arcade-backend

# Check .dockerignore is working
docker build --progress=plain -t x402arcade-backend . 2>&1 | grep "Sending build context"

# Verify multi-stage build
docker history x402arcade-backend
```

## Additional Commands

### Cleanup

```bash
# Stop and remove container
docker stop x402arcade-backend && docker rm x402arcade-backend

# Remove image
docker rmi x402arcade-backend

# Clean up unused images
docker image prune -a

# Clean up everything (DANGEROUS)
docker system prune -a --volumes
```

### Shell Access

```bash
# Access running container
docker exec -it x402arcade-backend sh

# Run a new container with shell
docker run --rm -it x402arcade-backend sh
```

### Copy Files

```bash
# Copy from container
docker cp x402arcade-backend:/app/data/database.db ./backup.db

# Copy to container
docker cp ./config.json x402arcade-backend:/app/config.json
```

---

## Documentation Updates

Last updated: January 25, 2026

For more information, see:

- [Main README](../../README.md)
- [Backend README](./README.md)
- [Deployment Guide](../../docs/deployment.md)
