# Background Jobs System

This document describes the background job system implemented for x402Arcade, which handles automated tasks like prize pool calculations, leaderboard updates, and database cleanup.

## Overview

The background job system uses **node-cron** to schedule and run periodic tasks. It includes:

1. **Prize Pool Calculation Job** - Finalizes daily/weekly prize pools and determines winners
2. **Leaderboard Update Job** - Validates leaderboard accessibility
3. **Cleanup Job** - Removes expired sessions and orphaned data
4. **Job Scheduler** - Centralized scheduling with monitoring and error handling
5. **Jobs API Routes** - HTTP endpoints for manual job triggering and monitoring

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       index.ts                              │
│  - Initialize database                                      │
│  - Create service instances (PrizePool, Leaderboard)       │
│  - Create JobScheduler instance                            │
│  - Start scheduler when server starts                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    JobScheduler                             │
│  - Manages cron schedules                                  │
│  - Executes jobs with error handling                       │
│  - Tracks execution history                                │
│  - Provides manual trigger API                             │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         ▼           ▼           ▼
    ┌────────┐  ┌────────┐  ┌────────┐
    │ Prize  │  │Leaderbd│  │Cleanup │
    │  Pool  │  │ Update │  │  Job   │
    └────────┘  └────────┘  └────────┘
```

## Job Details

### 1. Prize Pool Calculation Job

**Schedule:** Daily at 00:00 UTC (midnight)

**Purpose:** Finalize yesterday's daily prize pools and last week's weekly pools (on Mondays only)

**Tasks:**

- For each game type (snake, tetris, pong, breakout, space_invaders):
  - Get the pool for yesterday's date
  - Get the top scorer from the leaderboard
  - Finalize the pool with the winner's address
  - Log results

**File:** `packages/backend/src/jobs/prizepoolCalculation.ts`

**Key Features:**

- Handles missing pools gracefully (no games played)
- Weekly pools only processed on Mondays
- Error handling per game type (continues if one fails)
- Comprehensive logging

**Example Output:**

```
============================================================
🏃 Running job: Prize Pool Calculation
   Started at: 2026-01-26T00:00:00.123Z
============================================================

✅ Finalized daily pool #42 (snake, 2026-01-25)
   Winner: 0x1234...5678 - Prize: 0.14 USDC
✅ Finalized daily pool #43 (tetris, 2026-01-25)
   Winner: 0xabcd...ef01 - Prize: 0.28 USDC

📊 Prize Pool Calculation Summary:
   Pools processed: 5
   Pools finalized: 2
   Errors: 0

============================================================
✅ Job completed: Prize Pool Calculation
   Duration: 245ms
   Completed at: 2026-01-26T00:00:00.368Z
============================================================
```

### 2. Leaderboard Update Job

**Schedule:** Hourly (every hour at :00)

**Purpose:** Validate leaderboard accessibility

**Note:** Rankings are calculated dynamically using SQL `ROW_NUMBER()` in queries, so no manual rank updates are needed. This job primarily serves as a health check.

**Tasks:**

- For each game type and period type combination:
  - Fetch top 1 entry to validate query works
  - Count validated entries
  - Log any errors

**File:** `packages/backend/src/jobs/leaderboardUpdate.ts`

**Example Output:**

```
============================================================
🏃 Running job: Leaderboard Update
   Started at: 2026-01-26T01:00:00.123Z
============================================================

🔄 Starting leaderboard validation...
✅ Validated snake daily: 1 entries
✅ Validated snake weekly: 1 entries
✅ Validated snake alltime: 1 entries
✅ Validated tetris daily: 1 entries
...

📊 Leaderboard Validation Summary:
   Leaderboards processed: 15
   Entries validated: 12
   Duration: 156ms
   Errors: 0

============================================================
✅ Job completed: Leaderboard Update
   Duration: 156ms
   Completed at: 2026-01-26T01:00:00.279Z
============================================================
```

### 3. Cleanup Job

**Schedule:** Daily at 03:00 UTC

**Purpose:** Remove expired and orphaned data to prevent database bloat

**Tasks:**

1. Delete expired game sessions (active but older than SESSION_EXPIRY_MINUTES)
2. Delete orphaned leaderboard entries (session_id no longer exists)
3. (Future) Archive old leaderboard entries

**File:** `packages/backend/src/jobs/cleanup.ts`

**Configuration:**

```typescript
interface CleanupConfig {
  sessionExpiryMinutes: number; // Default: 30
  archiveLeaderboards: boolean; // Default: true
  leaderboardArchiveAgeDays: number; // Default: 90
}
```

**Example Output:**

```
============================================================
🏃 Running job: Cleanup
   Started at: 2026-01-26T03:00:00.123Z
============================================================

🧹 Starting cleanup job...
✅ Deleted 12 expired sessions
✅ Cleaned 3 orphaned leaderboard entries
ℹ️  Leaderboard archiving enabled (no entries to archive)

📊 Cleanup Summary:
   Expired sessions deleted: 12
   Orphaned entries cleaned: 3
   Duration: 89ms
   Errors: 0

============================================================
✅ Job completed: Cleanup
   Duration: 89ms
   Completed at: 2026-01-26T03:00:00.212Z
============================================================
```

## Job Scheduler

The `JobScheduler` class provides centralized job management.

**File:** `packages/backend/src/jobs/scheduler.ts`

**Features:**

- Cron-based scheduling with timezone support
- Execution monitoring and history tracking
- Error handling (jobs don't crash the scheduler)
- Manual job triggering
- Statistics (success rate, execution count)

**Configuration:**

```typescript
interface SchedulerConfig {
  enablePrizePoolJob: boolean; // Default: true
  enableLeaderboardJob: boolean; // Default: true
  enableCleanupJob: boolean; // Default: true
  timezone: string; // Default: 'UTC'
}
```

**Usage:**

```typescript
import { getDatabase } from './db';
import { PrizePoolService } from './services/prizePool';
import { LeaderboardService } from './services/leaderboard';
import { JobScheduler } from './jobs/scheduler';

const db = getDatabase();
const prizePoolService = new PrizePoolService(db);
const leaderboardService = new LeaderboardService(db);

const scheduler = new JobScheduler(db, prizePoolService, leaderboardService);
scheduler.start();

// Later, to stop:
scheduler.stop();
```

**Methods:**

- `start()` - Start all configured jobs
- `stop()` - Stop all running jobs
- `triggerJob(jobName)` - Manually trigger a specific job
- `getExecutionHistory(limit)` - Get recent execution history
- `getStats()` - Get execution statistics

## Jobs API Routes

HTTP endpoints for job management and monitoring.

**Base URL:** `/api/v1/jobs`

### GET /api/v1/jobs/status

Get scheduler status and statistics.

**Response:**

```json
{
  "success": true,
  "data": {
    "stats": {
      "totalExecutions": 42,
      "successfulExecutions": 40,
      "failedExecutions": 2,
      "successRate": 95.24
    },
    "recentExecutions": [
      {
        "name": "Prize Pool Calculation",
        "startedAt": "2026-01-26T00:00:00.123Z",
        "completedAt": "2026-01-26T00:00:00.368Z",
        "success": true,
        "durationMs": 245
      }
    ]
  }
}
```

### POST /api/v1/jobs/trigger/:jobName

Manually trigger a background job.

**Parameters:**

- `jobName` - One of: `prizepool`, `leaderboard`, `cleanup`

**Example:**

```bash
curl -X POST http://localhost:3001/api/v1/jobs/trigger/cleanup
```

**Response:**

```json
{
  "success": true,
  "message": "Job 'cleanup' triggered successfully"
}
```

### GET /api/v1/jobs/history

Get job execution history.

**Query Parameters:**

- `limit` - Number of executions to return (default: 20, max: 100)

**Example:**

```bash
curl http://localhost:3001/api/v1/jobs/history?limit=50
```

**Response:**

```json
{
  "success": true,
  "data": {
    "executions": [...],
    "count": 50
  }
}
```

## Monitoring

### Logs

All jobs output structured logs to the console:

- Job start/completion timestamps
- Execution duration
- Success/failure status
- Detailed error messages
- Summary statistics

### Execution History

The scheduler maintains an in-memory history of the last 100 job executions, accessible via:

- `scheduler.getExecutionHistory(limit)`
- `GET /api/v1/jobs/history`

Each execution record includes:

- Job name
- Start/completion timestamps
- Success status
- Error message (if failed)
- Duration in milliseconds

### Statistics

Track scheduler health via:

- `scheduler.getStats()`
- `GET /api/v1/jobs/status`

Metrics include:

- Total executions
- Successful executions
- Failed executions
- Success rate percentage

## Error Handling

Jobs are designed to be resilient:

1. **Per-game error handling** - Prize pool job continues if one game type fails
2. **Non-crashing errors** - Failed jobs don't crash the scheduler
3. **Graceful degradation** - Missing pools are handled as "no games played"
4. **Error logging** - All errors logged with context
5. **Error tracking** - Failed executions tracked in history

## Testing

### Manual Testing

Trigger jobs manually for testing:

```bash
# Trigger prize pool calculation
curl -X POST http://localhost:3001/api/v1/jobs/trigger/prizepool

# Trigger leaderboard update
curl -X POST http://localhost:3001/api/v1/jobs/trigger/leaderboard

# Trigger cleanup
curl -X POST http://localhost:3001/api/v1/jobs/trigger/cleanup
```

### Integration Testing

The scheduler can be instantiated in tests:

```typescript
import { JobScheduler } from './jobs/scheduler';

const scheduler = new JobScheduler(db, prizePoolService, leaderboardService, {
  enablePrizePoolJob: false,
  enableLeaderboardJob: false,
  enableCleanupJob: false,
});

// Manually trigger specific jobs
await scheduler.triggerJob('cleanup');

// Check execution history
const history = scheduler.getExecutionHistory();
expect(history[0].success).toBe(true);
```

## Production Considerations

### Timezone Configuration

Set the `timezone` option to match your deployment region:

```typescript
const scheduler = new JobScheduler(db, prizePoolService, leaderboardService, {
  timezone: 'America/New_York', // Or 'UTC', 'Asia/Tokyo', etc.
});
```

### Monitoring Alerts

In production, integrate with monitoring services:

```typescript
// Example: Send alerts on job failures
private async executeJob(name: string, jobFn: () => Promise<unknown>): Promise<void> {
  try {
    await jobFn();
  } catch (error) {
    // Send to Sentry, DataDog, etc.
    if (process.env.NODE_ENV === 'production') {
      await sendAlert({
        type: 'job_failure',
        job: name,
        error: error.message,
      });
    }
  }
}
```

### Database Load

Jobs run synchronously and use prepared statements for efficiency. Monitor database performance during peak hours.

### Graceful Shutdown

Stop the scheduler before server shutdown:

```typescript
process.on('SIGTERM', () => {
  scheduler.stop();
  // ... other cleanup
  process.exit(0);
});
```

## Files

- `packages/backend/src/jobs/scheduler.ts` - Job scheduler class
- `packages/backend/src/jobs/prizepoolCalculation.ts` - Prize pool calculation job
- `packages/backend/src/jobs/leaderboardUpdate.ts` - Leaderboard update job
- `packages/backend/src/jobs/cleanup.ts` - Cleanup job
- `packages/backend/src/jobs/index.ts` - Barrel exports
- `packages/backend/src/routes/jobs.routes.ts` - Jobs API routes
- `packages/backend/src/index.ts` - Scheduler initialization

## Summary

The background job system provides automated, reliable execution of critical maintenance tasks:

✅ **Prize Pool Calculation** - Daily at midnight, finalizes pools and determines winners
✅ **Leaderboard Update** - Hourly validation of leaderboard accessibility
✅ **Cleanup** - Daily at 3 AM, removes expired sessions and orphaned data
✅ **Job Monitoring** - Track execution history and statistics
✅ **Manual Triggers** - HTTP API for testing and manual execution
✅ **Error Resilience** - Jobs don't crash the scheduler

All jobs include comprehensive logging, error handling, and monitoring capabilities.
