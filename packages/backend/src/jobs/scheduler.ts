/**
 * Job Scheduler
 *
 * Schedules and manages background jobs using node-cron.
 * Provides centralized job management with monitoring and error handling.
 *
 * Jobs:
 * - Prize Pool Calculation: Runs daily at midnight (00:00)
 * - Leaderboard Update: Runs hourly (every hour at :00)
 * - Cleanup: Runs daily at 3:00 AM
 *
 * @module jobs/scheduler
 */

/* eslint-disable no-console */
// Console logging is essential for background job monitoring

import cron from 'node-cron';
import type { Database as DatabaseType } from 'better-sqlite3';
import type { PrizePoolService } from '../services/prizePool.js';
import type { LeaderboardService } from '../services/leaderboard.js';
import { runPrizePoolCalculation } from './prizepoolCalculation.js';
import { runLeaderboardUpdate } from './leaderboardUpdate.js';
import { runCleanup } from './cleanup.js';

/**
 * Job execution record for monitoring
 */
interface JobExecution {
  /** Job name */
  name: string;
  /** Start timestamp */
  startedAt: Date;
  /** End timestamp (null if still running) */
  completedAt: Date | null;
  /** Success status */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Execution duration in milliseconds */
  durationMs?: number;
}

/**
 * Job scheduler configuration
 */
export interface SchedulerConfig {
  /** Enable prize pool calculation job */
  enablePrizePoolJob: boolean;
  /** Enable leaderboard update job */
  enableLeaderboardJob: boolean;
  /** Enable cleanup job */
  enableCleanupJob: boolean;
  /** Timezone for cron jobs (default: 'UTC') */
  timezone: string;
}

/**
 * Default scheduler configuration
 */
const DEFAULT_CONFIG: SchedulerConfig = {
  enablePrizePoolJob: true,
  enableLeaderboardJob: true,
  enableCleanupJob: true,
  timezone: 'UTC',
};

/**
 * Job Scheduler class
 *
 * Manages background jobs with cron scheduling, monitoring, and error handling.
 */
export class JobScheduler {
  private db: DatabaseType;
  private prizePoolService: PrizePoolService;
  private leaderboardService: LeaderboardService;
  private config: SchedulerConfig;
  private tasks: Map<string, cron.ScheduledTask> = new Map();
  private executions: JobExecution[] = [];
  private maxExecutionHistory = 100; // Keep last 100 job executions

  constructor(
    db: DatabaseType,
    prizePoolService: PrizePoolService,
    leaderboardService: LeaderboardService,
    config: Partial<SchedulerConfig> = {}
  ) {
    this.db = db;
    this.prizePoolService = prizePoolService;
    this.leaderboardService = leaderboardService;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start all configured jobs
   */
  start(): void {
    console.log('🚀 Starting job scheduler...\n');

    if (this.config.enablePrizePoolJob) {
      this.schedulePrizePoolJob();
    }

    if (this.config.enableLeaderboardJob) {
      this.scheduleLeaderboardJob();
    }

    if (this.config.enableCleanupJob) {
      this.scheduleCleanupJob();
    }

    console.log(`\n✅ Job scheduler started (${this.tasks.size} jobs scheduled)\n`);
  }

  /**
   * Stop all running jobs
   */
  stop(): void {
    console.log('🛑 Stopping job scheduler...');

    for (const [name, task] of this.tasks) {
      task.stop();
      console.log(`   Stopped: ${name}`);
    }

    this.tasks.clear();
    console.log('✅ Job scheduler stopped');
  }

  /**
   * Schedule the prize pool calculation job
   *
   * Runs daily at midnight (00:00) to finalize previous day's pools
   */
  private schedulePrizePoolJob(): void {
    const cronExpression = '0 0 * * *'; // Every day at 00:00

    const task = cron.schedule(
      cronExpression,
      async () => {
        await this.executeJob('Prize Pool Calculation', () => {
          const result = runPrizePoolCalculation(this.prizePoolService, this.leaderboardService);
          return Promise.resolve(result);
        });
      },
      {
        timezone: this.config.timezone,
        scheduled: true,
      }
    );

    this.tasks.set('prizepool', task);
    console.log(
      `📅 Scheduled: Prize Pool Calculation (${cronExpression}, ${this.config.timezone})`
    );
  }

  /**
   * Schedule the leaderboard update job
   *
   * Runs hourly to recalculate rankings
   */
  private scheduleLeaderboardJob(): void {
    const cronExpression = '0 * * * *'; // Every hour at :00

    const task = cron.schedule(
      cronExpression,
      async () => {
        await this.executeJob('Leaderboard Update', () => {
          const result = runLeaderboardUpdate(this.leaderboardService);
          return Promise.resolve(result);
        });
      },
      {
        timezone: this.config.timezone,
        scheduled: true,
      }
    );

    this.tasks.set('leaderboard', task);
    console.log(`📅 Scheduled: Leaderboard Update (${cronExpression}, ${this.config.timezone})`);
  }

  /**
   * Schedule the cleanup job
   *
   * Runs daily at 3:00 AM to clean up expired data
   */
  private scheduleCleanupJob(): void {
    const cronExpression = '0 3 * * *'; // Every day at 03:00

    const task = cron.schedule(
      cronExpression,
      async () => {
        await this.executeJob('Cleanup', () => {
          const result = runCleanup(this.db);
          return Promise.resolve(result);
        });
      },
      {
        timezone: this.config.timezone,
        scheduled: true,
      }
    );

    this.tasks.set('cleanup', task);
    console.log(`📅 Scheduled: Cleanup (${cronExpression}, ${this.config.timezone})`);
  }

  /**
   * Execute a job with monitoring and error handling
   *
   * @param name - Job name for logging
   * @param jobFn - Async function that performs the job
   */
  private async executeJob(name: string, jobFn: () => Promise<unknown>): Promise<void> {
    const execution: JobExecution = {
      name,
      startedAt: new Date(),
      completedAt: null,
      success: false,
    };

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🏃 Running job: ${name}`);
    console.log(`   Started at: ${execution.startedAt.toISOString()}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      await jobFn();

      execution.success = true;
      execution.completedAt = new Date();
      execution.durationMs = execution.completedAt.getTime() - execution.startedAt.getTime();

      console.log(`\n${'='.repeat(60)}`);
      console.log(`✅ Job completed: ${name}`);
      console.log(`   Duration: ${execution.durationMs}ms`);
      console.log(`   Completed at: ${execution.completedAt.toISOString()}`);
      console.log(`${'='.repeat(60)}\n`);
    } catch (error) {
      execution.success = false;
      execution.completedAt = new Date();
      execution.durationMs = execution.completedAt.getTime() - execution.startedAt.getTime();
      execution.error = error instanceof Error ? error.message : String(error);

      console.error(`\n${'='.repeat(60)}`);
      console.error(`❌ Job failed: ${name}`);
      console.error(`   Error: ${execution.error}`);
      console.error(`   Duration: ${execution.durationMs}ms`);
      console.error(`   Failed at: ${execution.completedAt.toISOString()}`);
      console.error(`${'='.repeat(60)}\n`);

      // Log error but don't crash the scheduler
      // In production, you might want to send alerts here
    }

    // Store execution history
    this.executions.push(execution);

    // Limit history size
    if (this.executions.length > this.maxExecutionHistory) {
      this.executions.shift();
    }
  }

  /**
   * Get recent job execution history
   *
   * @param limit - Maximum number of executions to return (default: 10)
   * @returns Array of recent job executions
   */
  getExecutionHistory(limit = 10): JobExecution[] {
    return this.executions.slice(-limit).reverse(); // Most recent first
  }

  /**
   * Get statistics about job executions
   */
  getStats(): {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    successRate: number;
  } {
    const totalExecutions = this.executions.length;
    const successfulExecutions = this.executions.filter((e) => e.success).length;
    const failedExecutions = totalExecutions - successfulExecutions;
    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

    return {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      successRate,
    };
  }

  /**
   * Manually trigger a job (useful for testing)
   *
   * @param jobName - Name of the job to trigger ('prizepool', 'leaderboard', or 'cleanup')
   */
  async triggerJob(jobName: 'prizepool' | 'leaderboard' | 'cleanup'): Promise<void> {
    console.log(`🔧 Manually triggering job: ${jobName}`);

    switch (jobName) {
      case 'prizepool':
        await this.executeJob('Prize Pool Calculation (Manual)', () => {
          return Promise.resolve(
            runPrizePoolCalculation(this.prizePoolService, this.leaderboardService)
          );
        });
        break;

      case 'leaderboard':
        await this.executeJob('Leaderboard Update (Manual)', () => {
          return Promise.resolve(runLeaderboardUpdate(this.leaderboardService));
        });
        break;

      case 'cleanup':
        await this.executeJob('Cleanup (Manual)', () => {
          return Promise.resolve(runCleanup(this.db));
        });
        break;

      default:
        throw new Error(`Unknown job: ${jobName}`);
    }
  }
}
