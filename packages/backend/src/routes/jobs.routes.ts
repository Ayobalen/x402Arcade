/**
 * Jobs Routes
 *
 * API endpoints for manually triggering background jobs and viewing job status.
 * Useful for testing and administrative tasks.
 *
 * @module routes/jobs
 */

import { Router, type Request, type Response } from 'express';
import type { JobScheduler } from '../jobs/scheduler.js';

/**
 * Create jobs router with job scheduler instance
 *
 * @param scheduler - Job scheduler instance
 * @returns Express router
 */
export function createJobsRouter(scheduler: JobScheduler): Router {
  const router = Router();

  /**
   * GET /api/jobs/status
   *
   * Get job scheduler status and statistics
   */
  router.get('/status', (_req: Request, res: Response) => {
    try {
      const stats = scheduler.getStats();
      const history = scheduler.getExecutionHistory(10);

      res.json({
        success: true,
        data: {
          stats,
          recentExecutions: history,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get job status',
      });
    }
  });

  /**
   * POST /api/jobs/trigger/:jobName
   *
   * Manually trigger a background job
   *
   * @param jobName - Name of job to trigger ('prizepool', 'leaderboard', or 'cleanup')
   */
  router.post('/trigger/:jobName', async (req: Request, res: Response) => {
    try {
      const { jobName } = req.params;

      if (!['prizepool', 'leaderboard', 'cleanup'].includes(jobName)) {
        res.status(400).json({
          success: false,
          error: `Invalid job name: ${jobName}. Must be one of: prizepool, leaderboard, cleanup`,
        });
        return;
      }

      // Trigger job asynchronously (don't wait for completion)
      scheduler
        .triggerJob(jobName as 'prizepool' | 'leaderboard' | 'cleanup')
        .catch((error: Error) => {
          // eslint-disable-next-line no-console
          console.error(`Error triggering job ${jobName}:`, error);
        });

      res.json({
        success: true,
        message: `Job '${jobName}' triggered successfully`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to trigger job',
      });
    }
  });

  /**
   * GET /api/jobs/history
   *
   * Get job execution history
   *
   * @query limit - Number of executions to return (default: 20, max: 100)
   */
  router.get('/history', (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const history = scheduler.getExecutionHistory(limit);

      res.json({
        success: true,
        data: {
          executions: history,
          count: history.length,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get job history',
      });
    }
  });

  return router;
}
