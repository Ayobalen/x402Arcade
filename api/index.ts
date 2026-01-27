/**
 * Vercel Serverless Function Entry Point
 *
 * This file exports the Express app as a serverless function for Vercel.
 */

// Import the built app from dist
import('../packages/backend/dist/index.js').then((module) => {
  // Module loaded successfully
  console.log('Backend module loaded');
}).catch((err) => {
  console.error('Failed to load backend:', err);
});

// For now, export a simple handler while we fix the routing
export default async function handler(req: any, res: any) {
  // Import the app dynamically
  const { app } = await import('../packages/backend/dist/index.js');

  // Pass the request to Express
  return app(req, res);
}
