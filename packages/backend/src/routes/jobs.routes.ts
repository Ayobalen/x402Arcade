/**
 * Jobs Routes
 *
 * API endpoints for manually triggering background jobs and viewing job status.
 * Useful for testing and administrative tasks.
 *
 * @module routes/jobs
 */

import { Router, type Request, type Response } from 'express';

interface StubScheduler {
  start: () => void;
  stop: () => void;
}

/**
 * Create jobs router with job scheduler instance
 *
 * @param _scheduler - Job scheduler instance (stubbed for Vercel)
 * @returns Express router
 */
export function createJobsRouter(_scheduler: StubScheduler): Router {
  const router = Router();

  /**
   * GET /api/jobs/status
   *
   * Get job scheduler status (stubbed for Vercel - use Vercel Cron instead)
   */
  router.get('/status', (_req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Job scheduler stubbed for Vercel - use Vercel Cron for scheduled jobs',
      data: {
        stats: {
          prizepool: { total: 0, successful: 0, failed: 0 },
          leaderboard: { total: 0, successful: 0, failed: 0 },
          cleanup: { total: 0, successful: 0, failed: 0 },
        },
        recentExecutions: [],
      },
    });
  });

  /**
   * POST /api/jobs/trigger/:jobName
   *
   * Manually trigger a background job (stubbed for Vercel)
   *
   * @param jobName - Name of job to trigger ('prizepool', 'leaderboard', or 'cleanup')
   */
  router.post('/trigger/:jobName', async (req: Request, res: Response) => {
    const { jobName } = req.params;

    if (!['prizepool', 'leaderboard', 'cleanup'].includes(jobName)) {
      res.status(400).json({
        success: false,
        error: `Invalid job name: ${jobName}. Must be one of: prizepool, leaderboard, cleanup`,
      });
      return;
    }

    res.json({
      success: true,
      message: `Job '${jobName}' trigger stubbed - implement with Vercel Cron`,
    });
  });

  /**
   * GET /api/jobs/history
   *
   * Get job execution history (stubbed for Vercel)
   *
   * @query limit - Number of executions to return (default: 20, max: 100)
   */
  router.get('/history', (_req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Job history stubbed - implement with Vercel Cron logs',
      data: {
        executions: [],
        count: 0,
      },
    });
  });

  return router;
}
