/**
 * Vercel Serverless Function Handler for x402Arcade Backend
 *
 * This exports the Express app as a Vercel serverless function.
 * Environment variables must be configured in Vercel dashboard.
 */

import { createApp } from '../src/app.js';
import { initDatabase } from '../src/db/index.js';

// Initialize database (SQLite or in-memory for serverless)
initDatabase();

// Create and export the Express app as a Vercel function
const app = createApp();

export default app;
