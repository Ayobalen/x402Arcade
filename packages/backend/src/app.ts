/**
 * Express Application Configuration
 *
 * This file configures the Express application with all necessary middleware,
 * routes, and error handlers. The configured app is exported for use by the
 * server (index.ts) or for testing purposes.
 *
 * Separation of concerns:
 * - app.ts: Application configuration (this file)
 * - index.ts: Server startup and lifecycle management
 *
 * This pattern allows for:
 * - Easy unit testing of the app without starting a server
 * - Clean separation between app logic and server infrastructure
 * - Better code organization and maintainability
 *
 * @module app
 */

import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import environment configuration
import { getEnv } from './config/env.js';

// Get package.json version for API info endpoint
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8')) as {
  version: string;
};
const APP_VERSION = packageJson.version;

// Import route modules
import playRoutes from './routes/play.routes.js';
import scoreRoutes from './routes/score.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import prizeRoutes from './routes/prize.routes.js';
import healthRoutes from './routes/health.routes.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { httpLogger } from './middleware/httpLogger.js';
// import { x402Middleware } from './middleware/x402.js'; // Will be added when implementing x402 routes

/**
 * Create and configure the Express application.
 *
 * Middleware stack (in order):
 * 1. Request ID - Generate unique ID for request tracing
 * 2. Helmet - Security headers
 * 3. CORS - Cross-origin resource sharing
 * 4. Morgan/HTTP Logger - HTTP request logging (morgan in dev, structured JSON in prod)
 * 5. express.json() - JSON body parsing
 *
 * @returns Configured Express application
 */
export function createApp(): Express {
  const app: Express = express();
  const env = getEnv();

  // ============================================================================
  // Middleware Configuration
  // ============================================================================

  // Request ID: Generate unique request IDs for tracing
  // Must be first to ensure all logs include request ID
  app.use(requestIdMiddleware);

  // Security: Set security-related HTTP headers
  // Configure CSP to allow WebGL and Canvas for arcade games
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            // Allow unsafe-inline for game scripts and inline event handlers
            // Note: This reduces security but is necessary for arcade game functionality
            "'unsafe-inline'",
            // Allow unsafe-eval for game engines that use dynamic code generation
            // Note: Required by some WebGL libraries and physics engines
            "'unsafe-eval'",
          ],
          styleSrc: [
            "'self'",
            // Allow unsafe-inline for game UI styling
            "'unsafe-inline'",
          ],
          imgSrc: [
            "'self'",
            // Allow data: URIs for inline images (sprites, textures)
            'data:',
            // Allow blob: URIs for dynamically generated images
            'blob:',
          ],
          connectSrc: [
            "'self'",
            // Allow connections to Cronos testnet RPC
            'https://evm-t3.cronos.org',
            // Allow connections to x402 facilitator
            'https://facilitator.cronoslabs.org',
          ],
          // WebGL and Canvas require worker-src and child-src
          workerSrc: ["'self'", 'blob:'],
          childSrc: ["'self'", 'blob:'],
          // Allow fonts from self and data URIs
          fontSrc: ["'self'", 'data:'],
          // Frame ancestors (prevent clickjacking)
          frameAncestors: ["'none'"],
        },
      },
      // Disable HSTS in development, enable in production
      hsts: env.NODE_ENV === 'production',
    })
  );

  // CORS: Enable cross-origin requests from frontend
  // Configure allowed headers for x402 payment protocol
  // eslint-disable-next-line no-console
  console.log('🔧 CORS configuration:', env.CORS_ORIGIN);
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Payment',
        'X-402-Payment',
        'X-402-Signature',
      ],
      exposedHeaders: [
        'X-Payment-Required',
        'X-Payment-Version',
        'X-402-Required',
        'X-402-Price',
        'X-402-Network',
        'X-402-Recipient',
      ],
    })
  );

  // Rate Limiting: Prevent abuse with configurable limits
  if (env.RATE_LIMIT_ENABLED) {
    const limiter = rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX_REQUESTS,
      standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
      legacyHeaders: false, // Disable `X-RateLimit-*` headers
      message: 'Too many requests from this IP, please try again later.',
    });
    app.use(limiter);
  }

  // Logging: HTTP request logging
  // In production: Use structured JSON logging with request ID tracing
  // In development: Use morgan for concise, colorized output
  if (env.NODE_ENV === 'production') {
    // Structured JSON logging for production (log aggregation)
    app.use(httpLogger);
  } else {
    // Morgan for development (human-readable)
    app.use(
      morgan('dev', {
        skip: (req: Request) => req.path.startsWith('/health'),
        stream: {
          write: (message: string) => {
            // eslint-disable-next-line no-console
            console.log(message.trim());
          },
        },
      })
    );
  }

  // Body parsing: Parse JSON request bodies
  // Set 10kb limit to prevent large payload attacks
  // Arcade API only needs small payloads (scores, wallet addresses, etc.)
  app.use(
    express.json({
      limit: '10kb',
    })
  );

  // ============================================================================
  // Routes
  // ============================================================================

  // Health check routes
  // Comprehensive health monitoring with /health, /health/detailed, /health/ready, /health/live
  app.use('/health', healthRoutes);

  // API info endpoint
  app.get('/api', (_req: Request, res: Response) => {
    res.json({
      name: 'x402Arcade API',
      version: APP_VERSION,
      message: 'Insert a Penny, Play for Glory',
      endpoints: {
        health: 'GET /health',
        play: 'POST /api/v1/play',
        score: 'POST /api/v1/score',
        leaderboard: 'GET /api/v1/leaderboard/:gameType/:periodType',
        prize: 'GET /api/v1/prize/:gameType/:periodType',
        prizeHistory: 'GET /api/v1/prize/history',
      },
    });
  });

  // Mount API routes under /api/v1 prefix
  // Organized by resource for clean API structure
  app.use('/api/v1/play', playRoutes);
  app.use('/api/v1/score', scoreRoutes);
  app.use('/api/v1/leaderboard', leaderboardRoutes);
  app.use('/api/v1/prize', prizeRoutes);

  // ============================================================================
  // Error Handlers
  // ============================================================================

  // 404 handler - must be after all other routes
  // Catches any requests that don't match defined routes
  app.use((req: Request, res: Response) => {
    // Log 404s for API monitoring
    // In production, integrate with monitoring service (e.g., Sentry, Datadog)
    // eslint-disable-next-line no-console
    console.warn('404 Not Found:', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString(),
    });

    res.status(404).json({
      error: {
        message: 'Not Found',
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
      },
    });
  });

  // Global error handler - must be last middleware
  // Catches all errors thrown in routes and middleware
  app.use(errorHandler);

  return app;
}

/**
 * NOTE: Do NOT create app instance at module load time!
 * The app must be created AFTER environment variables are loaded in index.ts.
 *
 * Module-level code runs during import, BEFORE index.ts can load .env,
 * which causes getEnv() to cache default values instead of actual env vars.
 *
 * Solution: Export the createApp function and let index.ts call it after
 * loading environment variables.
 */
