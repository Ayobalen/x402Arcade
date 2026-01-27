/**
 * Simple Health Check Routes for Vercel deployment
 */

import { Router, type Request, type Response } from 'express';
import type { Router as RouterType } from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { db } from '../db/index.js';

const router: RouterType = Router();

// Get package.json version
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8')) as {
  version: string;
  name: string;
};

/**
 * Simple health check endpoint
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    // Test Redis connection
    await db.client.ping();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: packageJson.version,
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Liveness probe
 */
router.get('/health/live', (_req: Request, res: Response) => {
  res.json({ status: 'alive' });
});

/**
 * Readiness probe
 */
router.get('/health/ready', async (_req: Request, res: Response) => {
  try {
    await db.client.ping();
    res.json({ status: 'ready' });
  } catch (_error) {
    res.status(503).json({ status: 'not ready' });
  }
});

export default router;
