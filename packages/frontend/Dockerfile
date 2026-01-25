# =============================================================================
# STAGE 1: Dependencies
# =============================================================================
FROM node:20-alpine AS dependencies

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm@10.8.0

# Install all dependencies
RUN pnpm install --frozen-lockfile

# =============================================================================
# STAGE 2: Development
# =============================================================================
FROM node:20-alpine AS development

WORKDIR /app

# Copy dependencies
COPY --from=dependencies /app/node_modules ./node_modules

# Copy package files
COPY package.json ./

# Expose Vite dev server port
EXPOSE 3000

# Development command (override with docker-compose)
CMD ["npm", "run", "dev"]

# =============================================================================
# STAGE 3: Builder
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code and configuration
COPY package.json vite.config.ts tsconfig.json tsconfig.node.json ./
COPY index.html ./
COPY public ./public
COPY src ./src

# Build arguments for environment variables
ARG VITE_API_URL=http://localhost:8000
ARG VITE_CHAIN_ID=338
ARG VITE_RPC_URL=https://evm-t3.cronos.org
ARG VITE_USDC_ADDRESS=0x0000000000000000000000000000000000000000

# Set environment variables for build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_CHAIN_ID=$VITE_CHAIN_ID
ENV VITE_RPC_URL=$VITE_RPC_URL
ENV VITE_USDC_ADDRESS=$VITE_USDC_ADDRESS

# Build the application
RUN npm run build

# =============================================================================
# STAGE 4: Production (nginx)
# =============================================================================
FROM nginx:alpine AS production

# Add labels
LABEL maintainer="x402Arcade Team"
LABEL description="x402Arcade Frontend Application"
LABEL version="1.0.0"

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built static files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
