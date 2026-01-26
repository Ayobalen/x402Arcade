/**
 * Routes Index
 *
 * Aggregates and exports all route modules.
 * Provides a single import point for app.ts.
 *
 * @module routes
 */

export { default as playRoutes } from './play.routes.js';
export { default as scoreRoutes } from './score.routes.js';
export { default as leaderboardRoutes } from './leaderboard.routes.js';
export { default as prizeRoutes } from './prize.routes.js';
export { default as healthRoutes } from './health.routes.js';
export { default as transactionRoutes } from './transaction.routes.js';
