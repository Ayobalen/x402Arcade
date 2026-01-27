/**
 * Vercel Serverless Function Entry Point
 *
 * This file wraps the Express app as a Vercel serverless function.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Dynamic import to load the Express app
let appInstance: any = null;

async function getApp() {
  if (!appInstance) {
    const { app } = await import('../packages/backend/dist/index.js');
    appInstance = app;
  }
  return appInstance;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await getApp();

    // Pass the request to the Express app
    return app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
