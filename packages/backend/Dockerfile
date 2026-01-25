# =============================================================================
# STAGE 1: Dependencies
# =============================================================================
# Use Node.js LTS Alpine for minimal base image
FROM node:20-alpine AS dependencies

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml ./

# Install pnpm globally (version compatible with lockfile v9.0)
RUN npm install -g pnpm@10.8.0

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# =============================================================================
# STAGE 2: Builder
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code and configuration
COPY package.json tsconfig.docker.json ./
COPY src ./src

# Build TypeScript to JavaScript using Docker-specific config
RUN npx tsc --project tsconfig.docker.json

# =============================================================================
# STAGE 3: Production Dependencies
# =============================================================================
FROM node:20-alpine AS production-dependencies

# Install build dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm (version compatible with lockfile v9.0)
RUN npm install -g pnpm@10.8.0

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# =============================================================================
# STAGE 4: Production
# =============================================================================
FROM node:20-alpine AS production

# Add labels for image metadata
LABEL maintainer="x402Arcade Team"
LABEL description="x402Arcade Backend API Server"
LABEL version="1.0.0"

# Install runtime dependencies only (sqlite for better-sqlite3)
RUN apk add --no-cache \
    sqlite \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy production dependencies
COPY --from=production-dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Copy package.json for metadata
COPY --chown=nodejs:nodejs package.json ./

# Create data directory for SQLite database
RUN mkdir -p /app/data && chown nodejs:nodejs /app/data

# Switch to non-root user
USER nodejs

# Expose port (default 8000)
EXPOSE 8000

# Environment variables (can be overridden at runtime)
ENV NODE_ENV=production \
    PORT=8000 \
    HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]
