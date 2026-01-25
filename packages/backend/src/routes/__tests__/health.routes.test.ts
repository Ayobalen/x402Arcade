/**
 * Integration Tests for Health Routes
 *
 * Tests the health check endpoints for monitoring and deployment verification.
 *
 * @module routes/__tests__/health.routes.test
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import express, { type Express } from 'express';
import Database from 'better-sqlite3';
import { createTables } from '../../db/schema.js';
import healthRoutes from '../health.routes.js';

// ============================================================================
// Test Setup
// ============================================================================

let app: Express;
let db: Database.Database;

beforeAll(() => {
  // Set required environment variables
  process.env.NODE_ENV = 'test';
  process.env.RPC_URL = 'https://evm-t3.cronos.org/';
  process.env.FACILITATOR_URL = 'https://facilitator.cronoslabs.org';
  process.env.CORS_ORIGIN = 'http://localhost:5173';
  process.env.RATE_LIMIT_ENABLED = 'false';

  // Create in-memory database
  db = new Database(':memory:');
  createTables(db);

  // Mock getDatabase
  vi.mock('../../db/index.js', () => ({
    getDatabase: () => db,
  }));

  // Create Express app
  app = express();
  app.use(express.json());
  app.use('/health', healthRoutes);
});

afterAll(() => {
  db.close();
  vi.clearAllMocks();
});

// ============================================================================
// Basic Health Check Tests
// ============================================================================

describe('GET /health', () => {
  it('should return 200 with healthy status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
    expect(response.body.timestamp).toBeDefined();
    expect(response.body.version).toBeDefined();
    expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    expect(response.body.environment).toBeDefined();
  });

  it('should include database check result', async () => {
    const response = await request(app).get('/health');

    expect(response.body.checks).toBeDefined();
    expect(response.body.checks.database).toBeDefined();
    expect(response.body.checks.database.status).toBe('ok');
    expect(response.body.checks.database.responseTime).toBeGreaterThanOrEqual(0);
  });

  it('should include database details with session/leaderboard counts', async () => {
    const response = await request(app).get('/health');

    expect(response.body.checks.database.details).toBeDefined();
    expect(typeof response.body.checks.database.details.sessions).toBe('number');
    expect(typeof response.body.checks.database.details.leaderboard).toBe('number');
  });
});

// ============================================================================
// Detailed Health Check Tests
// ============================================================================

describe('GET /health/detailed', () => {
  it('should return 200 with detailed health information', async () => {
    const response = await request(app).get('/health/detailed');

    expect(response.status).toBe(200);
    expect(response.body.status).toBeDefined();
    expect(response.body.checks).toBeDefined();
  });

  it('should include database, RPC, and facilitator checks', async () => {
    const response = await request(app).get('/health/detailed');

    expect(response.body.checks.database).toBeDefined();
    expect(response.body.checks.rpc).toBeDefined();
    expect(response.body.checks.facilitator).toBeDefined();
  });

  it('should return response times for all checks', async () => {
    const response = await request(app).get('/health/detailed');

    expect(response.body.checks.database.responseTime).toBeGreaterThanOrEqual(0);
    // RPC and Facilitator may timeout or fail in test environment, but should have response time
    if (response.body.checks.rpc.responseTime !== undefined) {
      expect(response.body.checks.rpc.responseTime).toBeGreaterThanOrEqual(0);
    }
    if (response.body.checks.facilitator.responseTime !== undefined) {
      expect(response.body.checks.facilitator.responseTime).toBeGreaterThanOrEqual(0);
    }
  });

  it('should handle external service degradation gracefully', async () => {
    const response = await request(app).get('/health/detailed');

    // Even if external services are degraded, should still return valid response
    expect(response.status).toBeLessThanOrEqual(503);
    expect(['healthy', 'degraded', 'unhealthy']).toContain(response.body.status);
  });
});

// ============================================================================
// Readiness Probe Tests
// ============================================================================

describe('GET /health/ready', () => {
  it('should return 200 when service is ready', async () => {
    const response = await request(app).get('/health/ready');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ready');
    expect(response.body.timestamp).toBeDefined();
    expect(response.body.version).toBeDefined();
  });

  it('should include version information', async () => {
    const response = await request(app).get('/health/ready');

    expect(response.body.version).toBeDefined();
    expect(typeof response.body.version).toBe('string');
  });
});

// ============================================================================
// Liveness Probe Tests
// ============================================================================

describe('GET /health/live', () => {
  it('should return 200 when process is alive', async () => {
    const response = await request(app).get('/health/live');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('alive');
  });

  it('should include process information', async () => {
    const response = await request(app).get('/health/live');

    expect(response.body.timestamp).toBeDefined();
    expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    expect(response.body.version).toBeDefined();
    expect(response.body.pid).toBeDefined();
    expect(response.body.pid).toBe(process.pid);
  });

  it('should include memory usage information', async () => {
    const response = await request(app).get('/health/live');

    expect(response.body.memory).toBeDefined();
    expect(response.body.memory.heapUsed).toBeGreaterThan(0);
    expect(response.body.memory.heapTotal).toBeGreaterThan(0);
    expect(response.body.memory.rss).toBeGreaterThan(0);
  });
});

// ============================================================================
// Response Format Tests
// ============================================================================

describe('Health Check Response Format', () => {
  it('should return JSON content type for all endpoints', async () => {
    const endpoints = ['/health', '/health/detailed', '/health/ready', '/health/live'];

    for (const endpoint of endpoints) {
      const response = await request(app).get(endpoint);
      expect(response.headers['content-type']).toContain('application/json');
    }
  });

  it('should return ISO 8601 timestamp format', async () => {
    const response = await request(app).get('/health');

    const timestamp = response.body.timestamp;
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    expect(new Date(timestamp).toISOString()).toBe(timestamp);
  });

  it('should return valid semantic version', async () => {
    const response = await request(app).get('/health');

    const version = response.body.version;
    expect(version).toMatch(/^\d+\.\d+\.\d+/);
  });
});

// ============================================================================
// Performance Tests
// ============================================================================

describe('Health Check Performance', () => {
  it('should respond to basic health check within 100ms', async () => {
    const start = Date.now();
    await request(app).get('/health');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100);
  });

  it('should respond to liveness probe within 50ms', async () => {
    const start = Date.now();
    await request(app).get('/health/live');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(50);
  });

  it('should respond to readiness probe within 100ms', async () => {
    const start = Date.now();
    await request(app).get('/health/ready');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100);
  });
});
