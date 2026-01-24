/**
 * Environment validation schema using Zod
 *
 * This module validates and exports typed environment variables.
 * Import `env` instead of using `process.env` directly for type safety.
 */
import { z } from 'zod';

/**
 * Environment variable schema definition
 */
export const envSchema = z.object({
  // Server Configuration (required)
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development')
    .describe('Node.js environment mode (development, production, or test)'),
  PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(3001)
    .describe('Port number for the Express server (default: 3001)'),
  HOST: z
    .string()
    .default('localhost')
    .describe('Host address for the server to bind to (default: localhost)'),
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:5173')
    .transform((val) => {
      // Handle comma-separated list of origins
      if (val.includes(',')) {
        return val.split(',').map((origin) => origin.trim());
      }
      // Single origin - return as string for cors middleware
      return val;
    })
    .describe(
      'Allowed CORS origins (comma-separated for multiple origins, e.g., http://localhost:5173)'
    ),

  // Database Configuration (required)
  DATABASE_PATH: z
    .string()
    .default('./data/arcade.db')
    .refine((path) => path === ':memory:' || path.endsWith('.db'), {
      message: 'DATABASE_PATH must end with .db extension or be :memory:',
    })
    .describe(
      'Path to the SQLite database file (e.g., ./data/arcade.db or :memory: for in-memory DB)'
    ),

  // JWT/Session Configuration (required)
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters')
    .describe('Secret key for JWT token signing (minimum 32 characters for security)'),
  JWT_EXPIRY_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(3600)
    .describe('JWT token expiration time in seconds (default: 3600 = 1 hour)'),

  // Blockchain Configuration
  CHAIN_ID: z.coerce
    .number()
    .int()
    .positive()
    .refine((id) => id === 25 || id === 338, {
      message: 'CHAIN_ID must be 25 (Cronos mainnet) or 338 (Cronos testnet)',
    })
    .default(338)
    .describe('Cronos blockchain chain ID: 25 for mainnet, 338 for testnet'),
  RPC_URL: z
    .string()
    .url('RPC_URL must be a valid HTTP or HTTPS URL')
    .refine((url) => url.startsWith('http://') || url.startsWith('https://'), {
      message: 'RPC_URL must start with http:// or https://',
    })
    .default('https://evm-t3.cronos.org/')
    .describe('JSON-RPC endpoint URL for Cronos blockchain (testnet: https://evm-t3.cronos.org/)'),
  EXPLORER_URL: z
    .string()
    .url()
    .default('https://explorer.cronos.org/testnet')
    .describe('Block explorer URL for transaction verification and lookup'),

  // USDC Contract Configuration
  USDC_CONTRACT_ADDRESS: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address')
    .optional()
    .describe(
      'ERC-20 USDC contract address on Cronos (testnet: 0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0)'
    ),
  USDC_DECIMALS: z.coerce
    .number()
    .int()
    .min(0)
    .max(18)
    .default(6)
    .describe('Number of decimal places for USDC token (standard is 6)'),
  USDC_DOMAIN_VERSION: z.coerce
    .number()
    .int()
    .positive()
    .default(1)
    .describe('EIP-3009 domain version for USDC contract (1 for testnet, 2 for mainnet)'),

  // Arcade Wallet Configuration (optional for development)
  ARCADE_WALLET_ADDRESS: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address')
    .optional()
    .describe('Arcade platform wallet address that receives game payments and sends prize payouts'),
  ARCADE_PRIVATE_KEY: z
    .string()
    .regex(
      /^(0x)?[a-fA-F0-9]{64}$/,
      'Private key must be a 64-character hex string (optionally prefixed with 0x)'
    )
    .transform((val) => {
      // Strip 0x prefix if present for consistency
      return val.startsWith('0x') ? val.slice(2) : val;
    })
    .optional()
    .describe(
      'Private key for arcade wallet (required for payment settlement and prize distribution)'
    ),

  // x402 Facilitator Configuration
  FACILITATOR_URL: z
    .string()
    .url()
    .default('https://facilitator.cronoslabs.org')
    .describe('x402 facilitator service URL for gasless payment processing'),

  // Game Configuration
  SNAKE_PRICE_USDC: z.coerce
    .number()
    .positive('Snake price must be a positive number')
    .default(0.01)
    .describe(
      'Price in USDC to play Snake game (default: 0.01 USDC = 1 cent, accepts string or number)'
    ),
  TETRIS_PRICE_USDC: z.coerce
    .number()
    .positive('Tetris price must be a positive number')
    .default(0.02)
    .describe(
      'Price in USDC to play Tetris game (default: 0.02 USDC = 2 cents, accepts string or number)'
    ),
  PRIZE_POOL_PERCENTAGE: z.coerce
    .number()
    .int()
    .min(0)
    .max(100)
    .default(70)
    .describe('Percentage of game payments that go to prize pool (default: 70%)'),
  SESSION_EXPIRY_MINUTES: z.coerce
    .number()
    .int()
    .positive()
    .default(30)
    .describe('Minutes until game session expires if not completed (default: 30)'),

  // Logging Configuration
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'debug'])
    .default('info')
    .describe('Logging verbosity level (error, warn, info, debug)'),
  LOG_SILENCE: z.coerce
    .boolean()
    .default(false)
    .describe('Silence all logging output (useful for testing)'),

  // Rate Limiting Configuration
  RATE_LIMIT_ENABLED: z.coerce
    .boolean()
    .default(true)
    .describe('Enable rate limiting middleware for API endpoints'),
  RATE_LIMIT_MAX_REQUESTS: z.coerce
    .number()
    .int()
    .positive()
    .default(100)
    .describe('Maximum requests per window (default: 100 requests)'),
  RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(60000)
    .describe('Rate limit time window in milliseconds (default: 60000 = 1 minute)'),
});

/**
 * Inferred TypeScript type from the schema
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Validation result type
 */
export interface ValidationResult {
  success: boolean;
  data?: Env;
  errors?: z.ZodError<Env>;
}

/**
 * Validates environment variables against the schema
 *
 * @returns ValidationResult with success status and either data or errors
 */
export function validateEnv(): ValidationResult {
  const result = envSchema.safeParse(process.env);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, errors: result.error };
}

/**
 * Validates environment and throws if invalid
 *
 * @throws Error if validation fails
 * @returns Validated environment object
 */
export function validateEnvOrThrow(): Env {
  const result = validateEnv();

  if (!result.success) {
    const formatted = result
      .errors!.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(`Environment validation failed:\n${formatted}`);
  }

  return result.data!;
}

/**
 * Validates environment and logs errors (for graceful degradation)
 *
 * @returns Validated environment or undefined if validation fails
 */
export function validateEnvSafe(): Env | undefined {
  const result = validateEnv();

  if (!result.success) {
    // eslint-disable-next-line no-console
    console.error('Environment validation failed:');
    result.errors!.issues.forEach((issue) => {
      // eslint-disable-next-line no-console
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    });
    return undefined;
  }

  return result.data;
}

/**
 * Validated environment variables
 *
 * In test environment, use defaults and don't throw on missing optional vars.
 * In production, strict validation is enforced.
 */
let _env: Env | undefined;

/**
 * Get the validated environment object
 *
 * @throws Error if environment validation fails
 * @returns Validated environment object
 */
export function getEnv(): Env {
  if (!_env) {
    _env = validateEnvOrThrow();
  }
  return _env;
}

/**
 * Re-validate environment (useful for testing)
 */
export function revalidateEnv(): Env {
  _env = undefined;
  return getEnv();
}

/**
 * Check if we're in a specific environment
 */
export const isDevelopment = () => getEnv().NODE_ENV === 'development';
export const isProduction = () => getEnv().NODE_ENV === 'production';
export const isTest = () => getEnv().NODE_ENV === 'test';

/**
 * Default export: validated environment object
 *
 * Usage:
 * ```ts
 * import { env } from './config/env';
 * console.log(env.PORT); // Type-safe access
 * ```
 */
export const env = new Proxy({} as Env, {
  get(_, prop: string) {
    return getEnv()[prop as keyof Env];
  },
});

export default env;
