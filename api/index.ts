/**
 * Vercel Serverless Function Entry Point
 *
 * This file wraps the Express app as a Vercel serverless function.
 */

// Dynamic import to load the Express app
let appInstance: any = null;

async function getApp() {
  if (!appInstance) {
    const { app } = await import('../packages/backend/dist/index.js');
    appInstance = app;
  }
  return appInstance;
}

export default async function handler(req: any, res: any) {
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
