# Build stage
FROM node:22-alpine AS builder

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++ sqlite-dev

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/backend/package.json ./packages/backend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy tsconfig and source code
COPY packages/backend/tsconfig.json ./packages/backend/
COPY packages/backend/src ./packages/backend/src

# Build backend
RUN pnpm --filter @x402arcade/backend build

# Production stage
FROM node:22-alpine

# Install runtime dependencies
RUN apk add --no-cache sqlite-libs

WORKDIR /app

# Copy everything from builder (dependencies already installed)
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages/backend/package.json ./packages/backend/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist

# Create data directory
RUN mkdir -p /app/data

WORKDIR /app/packages/backend

EXPOSE 8000

CMD ["node", "dist/index.js"]
