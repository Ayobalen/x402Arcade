/**
 * Vercel Serverless Function Entry Point
 *
 * This file exports the Express app as a serverless function for Vercel.
 */

import { app } from '../packages/backend/src/index.js';

// Export the Express app as a Vercel serverless function
export default app;
