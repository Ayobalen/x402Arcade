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
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().default('localhost'),
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
    }),

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
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRY_SECONDS: z.coerce.number().int().positive().default(3600),

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
  RPC_URL: z.string().url().default('https://evm-t3.cronos.org/'),
  EXPLORER_URL: z.string().url().default('https://explorer.cronos.org/testnet'),

  // USDC Contract Configuration
  USDC_CONTRACT_ADDRESS: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address')
    .optional(),
  USDC_DECIMALS: z.coerce.number().int().min(0).max(18).default(6),
  USDC_DOMAIN_VERSION: z.coerce.number().int().positive().default(1),

  // Arcade Wallet Configuration (optional for development)
  ARCADE_WALLET_ADDRESS: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address')
    .optional(),
  ARCADE_PRIVATE_KEY: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid private key format')
    .optional(),

  // x402 Facilitator Configuration
  FACILITATOR_URL: z.string().url().default('https://facilitator.cronoslabs.org'),

  // Game Configuration
  SNAKE_PRICE_USDC: z.coerce.number().positive().default(0.01),
  TETRIS_PRICE_USDC: z.coerce.number().positive().default(0.02),
  PRIZE_POOL_PERCENTAGE: z.coerce.number().int().min(0).max(100).default(70),
  SESSION_EXPIRY_MINUTES: z.coerce.number().int().positive().default(30),

  // Logging Configuration
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_SILENCE: z.coerce.boolean().default(false),

  // Rate Limiting Configuration
  RATE_LIMIT_ENABLED: z.coerce.boolean().default(true),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
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
