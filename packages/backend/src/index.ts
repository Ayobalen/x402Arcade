/**
 * x402Arcade Server Entry Point
 *
 * This file is responsible for:
 * 1. Loading environment variables
 * 2. Validating environment configuration
 * 3. Importing the configured Express app
 * 4. Starting the HTTP server
 *
 * The Express app configuration is in app.ts for better separation of concerns
 * and testability.
 *
 * @module index
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Validate environment variables at startup
import { getEnv, revalidateEnv, validateEnv, type ValidationResult } from './config/env.js';

// Load environment variables from packages/backend/.env
const envPath = join(__dirname, '../.env');
// eslint-disable-next-line no-console
console.log('📄 Loading .env from:', envPath);
dotenv.config({ path: envPath });
// eslint-disable-next-line no-console
console.log('🔧 CORS_ORIGIN from process.env:', process.env.CORS_ORIGIN);

// Re-validate environment after loading .env (clears cache and re-parses with actual values)
revalidateEnv();

/**
 * Format environment validation errors for display
 */
function formatEnvErrors(result: ValidationResult): void {
  // eslint-disable-next-line no-console
  console.error('❌ Environment validation failed:');
  result.errors?.issues.forEach((issue) => {
    // eslint-disable-next-line no-console
    console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
  });
}

// Perform validation and report errors early
const validationResult = validateEnv();
if (!validationResult.success) {
  formatEnvErrors(validationResult);
  // Fail fast - prevent server startup with invalid configuration
  process.exit(1);
}

// Get validated environment (will use defaults for optional fields)
const env = getEnv();

// Initialize database before importing app (routes depend on db)
import { initDatabase, getDatabase } from './db/index.js';
initDatabase();

// Import services for background jobs
import { PrizePoolService } from './services/prizePool.js';
import { LeaderboardService } from './services/leaderboard.js';

// Import and initialize job scheduler
import { JobScheduler } from './jobs/scheduler.js';

const db = getDatabase();
const prizePoolService = new PrizePoolService(db);
const leaderboardService = new LeaderboardService(db);

// Create scheduler instance
export const scheduler = new JobScheduler(db, prizePoolService, leaderboardService);

// Import the app factory function (NOT the app instance)
import { createApp } from './app.js';

// Create app AFTER environment is loaded and validated
// This ensures getEnv() in app.ts uses actual env vars, not defaults
const app = createApp();

// Import and mount jobs routes
import { createJobsRouter } from './routes/jobs.routes.js';
app.use('/api/v1/jobs', createJobsRouter(scheduler));

const PORT = env.PORT;

// Start server (skip in test environment)
if (env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    /* eslint-disable no-console */
    console.log(`🎮 x402Arcade server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`🌍 Environment: ${env.NODE_ENV}`);

    // Start background job scheduler
    console.log('\n');
    scheduler.start();
    /* eslint-enable no-console */
  });
}

// Re-export app for testing purposes
export { app };
