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

// Import environment configuration
import { getEnv } from './config/env.js';

// Import route modules (will be added as routes are implemented)
// import playRoutes from './routes/play.routes.js';
// import scoreRoutes from './routes/score.routes.js';
// import leaderboardRoutes from './routes/leaderboard.routes.js';
// import prizeRoutes from './routes/prize.routes.js';

// Import middleware (will be added as needed)
// import { errorHandler } from './middleware/errorHandler.js';
// import { x402Middleware } from './middleware/x402.js';

/**
 * Create and configure the Express application.
 *
 * Middleware stack (in order):
 * 1. Helmet - Security headers
 * 2. CORS - Cross-origin resource sharing
 * 3. Morgan - HTTP request logging
 * 4. express.json() - JSON body parsing
 *
 * @returns Configured Express application
 */
export function createApp(): Express {
  const app: Express = express();
  const env = getEnv();

  // ============================================================================
  // Middleware Configuration
  // ============================================================================

  // Security: Set security-related HTTP headers
  app.use(helmet());

  // CORS: Enable cross-origin requests from frontend
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );

  // Logging: HTTP request logging
  app.use(morgan('combined'));

  // Body parsing: Parse JSON request bodies
  app.use(express.json());

  // ============================================================================
  // Routes
  // ============================================================================

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API info endpoint
  app.get('/api', (_req: Request, res: Response) => {
    res.json({
      name: 'x402Arcade API',
      version: '0.1.0',
      message: 'Insert a Penny, Play for Glory',
    });
  });

  // API routes will be mounted here as they are implemented:
  // app.use('/api/play', playRoutes);
  // app.use('/api/score', scoreRoutes);
  // app.use('/api/leaderboard', leaderboardRoutes);
  // app.use('/api/prize', prizeRoutes);

  // ============================================================================
  // Error Handlers
  // ============================================================================

  // 404 handler - must be after all other routes
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' });
  });

  // Global error handler (will be added when errorHandler middleware is created)
  // app.use(errorHandler);

  return app;
}

/**
 * Configured Express application instance.
 * Ready to be imported by index.ts for server startup or by tests.
 */
export const app = createApp();

/**
 * Default export for convenience.
 * Allows: import app from './app.js'
 */
export default app;
