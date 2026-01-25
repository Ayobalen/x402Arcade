/**
 * Health Check Routes
 *
 * Comprehensive health check endpoints for monitoring service health,
 * database connectivity, and external service dependencies.
 *
 * Used by:
 * - Railway health checks
 * - Uptime monitoring services (UptimeRobot, Pingdom, etc.)
 * - Load balancers
 * - Deployment verification
 *
 * @module routes/health
 */

import { Router, type Request, type Response } from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getDatabase } from '../db/index.js';
import { getEnv } from '../config/env.js';

const router = Router();

// Get package.json version
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8')) as {
  version: string;
  name: string;
};

const APP_NAME = packageJson.name;
const APP_VERSION = packageJson.version;

// Build info (set by CI/CD)
const BUILD_TIME = process.env.BUILD_TIME || 'unknown';
const GIT_COMMIT = process.env.GIT_COMMIT || 'unknown';
const GIT_BRANCH = process.env.GIT_BRANCH || 'unknown';

/**
 * Health check response interface
 */
interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  environment: string;
  checks: {
    database: HealthCheckResult;
    rpc?: HealthCheckResult;
    facilitator?: HealthCheckResult;
  };
  build?: {
    time: string;
    commit: string;
    branch: string;
  };
}

interface HealthCheckResult {
  status: 'ok' | 'error' | 'degraded';
  message?: string;
  responseTime?: number;
  details?: Record<string, unknown>;
}

/**
 * Check database connectivity
 */
function checkDatabase(): HealthCheckResult {
  const startTime = Date.now();
  try {
    const db = getDatabase();

    // Test basic query
    const result = db.prepare('SELECT 1 as test').get() as { test: number } | undefined;

    if (!result || result.test !== 1) {
      return {
        status: 'error',
        message: 'Database query returned unexpected result',
        responseTime: Date.now() - startTime,
      };
    }

    // Test database integrity
    const integrityCheck = db.pragma('integrity_check') as Array<{ integrity_check: string }>;
    const isIntact = integrityCheck[0]?.integrity_check === 'ok';

    if (!isIntact) {
      return {
        status: 'degraded',
        message: 'Database integrity check failed',
        responseTime: Date.now() - startTime,
        details: { integrity: integrityCheck },
      };
    }

    // Get table counts for monitoring
    const sessionCount = (
      db.prepare('SELECT COUNT(*) as count FROM game_sessions').get() as { count: number }
    ).count;
    const leaderboardCount = (
      db.prepare('SELECT COUNT(*) as count FROM leaderboard_entries').get() as { count: number }
    ).count;

    return {
      status: 'ok',
      responseTime: Date.now() - startTime,
      details: {
        sessions: sessionCount,
        leaderboard: leaderboardCount,
      },
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown database error',
      responseTime: Date.now() - startTime,
    };
  }
}

/**
 * Check RPC connectivity (optional check for detailed health)
 */
async function checkRpcConnectivity(): Promise<HealthCheckResult> {
  const env = getEnv();
  const startTime = Date.now();

  try {
    // Simple HTTP check to RPC endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(env.RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        status: 'degraded',
        message: `RPC returned ${response.status}`,
        responseTime: Date.now() - startTime,
      };
    }

    const data = (await response.json()) as { result?: string; error?: { message: string } };

    if (data.error) {
      return {
        status: 'degraded',
        message: data.error.message,
        responseTime: Date.now() - startTime,
      };
    }

    return {
      status: 'ok',
      responseTime: Date.now() - startTime,
      details: {
        blockNumber: data.result,
      },
    };
  } catch (error) {
    // RPC errors are degraded, not critical
    return {
      status: 'degraded',
      message: error instanceof Error ? error.message : 'RPC connection failed',
      responseTime: Date.now() - startTime,
    };
  }
}

/**
 * Check x402 Facilitator connectivity (optional check for detailed health)
 */
async function checkFacilitatorConnectivity(): Promise<HealthCheckResult> {
  const env = getEnv();
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(`${env.FACILITATOR_URL}/v2/x402/supported`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        status: 'degraded',
        message: `Facilitator returned ${response.status}`,
        responseTime: Date.now() - startTime,
      };
    }

    return {
      status: 'ok',
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    // Facilitator errors are degraded, not critical
    return {
      status: 'degraded',
      message: error instanceof Error ? error.message : 'Facilitator connection failed',
      responseTime: Date.now() - startTime,
    };
  }
}

/**
 * GET /health
 *
 * Basic health check endpoint for load balancers.
 * Fast response, only checks database connectivity.
 * Always returns 200 OK unless service is completely down.
 */
router.get('/', (_req: Request, res: Response) => {
  const env = getEnv();
  const dbCheck = checkDatabase();

  const response: HealthCheckResponse = {
    status: dbCheck.status === 'ok' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: APP_VERSION,
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    checks: {
      database: dbCheck,
    },
  };

  // Include build info in production
  if (env.NODE_ENV === 'production' && BUILD_TIME !== 'unknown') {
    response.build = {
      time: BUILD_TIME,
      commit: GIT_COMMIT,
      branch: GIT_BRANCH,
    };
  }

  // Return 200 even if degraded (load balancers should only fail on 5xx)
  res.status(200).json(response);
});

/**
 * GET /health/detailed
 *
 * Detailed health check with external service checks.
 * Slower response (may take several seconds).
 * Used by monitoring dashboards and manual debugging.
 */
router.get('/detailed', async (_req: Request, res: Response) => {
  const env = getEnv();
  const dbCheck = checkDatabase();

  // Run external checks in parallel
  const [rpcCheck, facilitatorCheck] = await Promise.all([
    checkRpcConnectivity(),
    checkFacilitatorConnectivity(),
  ]);

  // Determine overall status
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  if (dbCheck.status === 'error') {
    overallStatus = 'unhealthy';
  } else if (
    dbCheck.status === 'degraded' ||
    rpcCheck.status === 'degraded' ||
    facilitatorCheck.status === 'degraded'
  ) {
    overallStatus = 'degraded';
  }

  const response: HealthCheckResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: APP_VERSION,
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    checks: {
      database: dbCheck,
      rpc: rpcCheck,
      facilitator: facilitatorCheck,
    },
  };

  // Include build info
  if (BUILD_TIME !== 'unknown') {
    response.build = {
      time: BUILD_TIME,
      commit: GIT_COMMIT,
      branch: GIT_BRANCH,
    };
  }

  // Return appropriate status code
  const statusCode = overallStatus === 'unhealthy' ? 503 : 200;
  res.status(statusCode).json(response);
});

/**
 * GET /health/ready
 *
 * Readiness probe for Kubernetes/Railway.
 * Returns 200 only if service is ready to accept traffic.
 * Checks database is accessible and tables exist.
 */
router.get('/ready', (_req: Request, res: Response) => {
  const dbCheck = checkDatabase();

  if (dbCheck.status === 'error') {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      message: 'Database not accessible',
      details: dbCheck,
    });
    return;
  }

  res.status(200).json({
    status: 'ready',
    timestamp: new Date().toISOString(),
    version: APP_VERSION,
  });
});

/**
 * GET /health/live
 *
 * Liveness probe for Kubernetes/Railway.
 * Returns 200 if the process is alive and responding.
 * Does NOT check external dependencies.
 */
router.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: APP_VERSION,
    pid: process.pid,
    memory: process.memoryUsage(),
  });
});

export default router;
