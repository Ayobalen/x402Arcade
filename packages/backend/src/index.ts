import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

// Validate environment variables at startup
import { getEnv, validateEnv } from './config/env.js';

// Perform validation and report errors early
const validationResult = validateEnv();
if (!validationResult.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Environment validation failed:');
  validationResult.errors?.issues.forEach((issue) => {
    // eslint-disable-next-line no-console
    console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
  });
  // In production, fail fast. In development, continue with defaults where possible.
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

// Get validated environment (will use defaults for optional fields)
const env = getEnv();

const app: Express = express();
const PORT = env.PORT;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(morgan('combined'));
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes will be added here
app.get('/api', (_req, res) => {
  res.json({
    name: 'x402Arcade API',
    version: '0.1.0',
    message: 'Insert a Penny, Play for Glory',
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Start server
if (env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    /* eslint-disable no-console */
    console.log(`🎮 x402Arcade server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`🌍 Environment: ${env.NODE_ENV}`);
    /* eslint-enable no-console */
  });
}

export { app };
