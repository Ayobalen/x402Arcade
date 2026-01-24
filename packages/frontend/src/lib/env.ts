/**
 * Frontend Environment Variable Validation
 *
 * Validates Vite environment variables at runtime and provides
 * type-safe access throughout the application.
 *
 * Vite exposes environment variables via import.meta.env.
 * Only variables prefixed with VITE_ are exposed to the client.
 */

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Environment variable schema definition
 */
export interface ClientEnv {
  /** Backend API server URL */
  VITE_API_URL: string;
  /** WebSocket URL for real-time features */
  VITE_WS_URL: string;
  /** Blockchain chain ID (338 = Cronos Testnet, 25 = Cronos Mainnet) */
  VITE_CHAIN_ID: number;
  /** RPC endpoint URL */
  VITE_RPC_URL: string;
  /** Block explorer URL */
  VITE_EXPLORER_URL: string;
  /** USDC contract address */
  VITE_USDC_ADDRESS: string;
  /** x402 Facilitator URL */
  VITE_FACILITATOR_URL: string;
  /** WalletConnect Project ID (optional) */
  VITE_WALLETCONNECT_PROJECT_ID?: string;
  /** Debug mode enabled */
  VITE_DEBUG: boolean;
  /** Mock payments mode (for testing) */
  VITE_MOCK_PAYMENTS: boolean;
}

/**
 * Validation error type
 */
export interface EnvValidationError {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Validation result type
 */
export interface ValidationResult {
  success: boolean;
  data?: ClientEnv;
  errors?: EnvValidationError[];
}

// =============================================================================
// Default Values
// =============================================================================

const DEFAULTS: Partial<ClientEnv> = {
  VITE_API_URL: 'http://localhost:3001',
  VITE_WS_URL: 'ws://localhost:3001',
  VITE_CHAIN_ID: 338, // Cronos Testnet
  VITE_RPC_URL: 'https://evm-t3.cronos.org/',
  VITE_EXPLORER_URL: 'https://explorer.cronos.org/testnet',
  VITE_USDC_ADDRESS: '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0',
  VITE_FACILITATOR_URL: 'https://facilitator.cronoslabs.org',
  VITE_DEBUG: false,
  VITE_MOCK_PAYMENTS: false,
};

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Validate URL format
 */
function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate Ethereum address format
 */
function isValidAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

/**
 * Parse boolean from env string
 */
function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === '') return defaultValue;
  return value === 'true' || value === '1';
}

/**
 * Parse integer from env string
 */
function parseInteger(
  value: string | undefined,
  defaultValue: number
): { value: number; error?: string } {
  if (value === undefined || value === '') return { value: defaultValue };
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    return { value: defaultValue, error: `Invalid integer value: "${value}"` };
  }
  return { value: parsed };
}

// =============================================================================
// Main Validation Function
// =============================================================================

/**
 * Validates all client environment variables
 *
 * @returns ValidationResult with success status and either data or errors
 */
export function validateEnv(): ValidationResult {
  const errors: EnvValidationError[] = [];
  const meta = import.meta.env;

  // VITE_API_URL (required)
  const apiUrl = meta.VITE_API_URL || DEFAULTS.VITE_API_URL!;
  if (!isValidUrl(apiUrl)) {
    errors.push({
      field: 'VITE_API_URL',
      message: 'Must be a valid URL',
      value: apiUrl,
    });
  }

  // VITE_WS_URL (optional)
  const wsUrl = meta.VITE_WS_URL || DEFAULTS.VITE_WS_URL!;
  if (!isValidUrl(wsUrl.replace('ws://', 'http://').replace('wss://', 'https://'))) {
    errors.push({
      field: 'VITE_WS_URL',
      message: 'Must be a valid WebSocket URL',
      value: wsUrl,
    });
  }

  // VITE_CHAIN_ID (required)
  const chainIdResult = parseInteger(meta.VITE_CHAIN_ID, DEFAULTS.VITE_CHAIN_ID!);
  if (chainIdResult.error) {
    errors.push({
      field: 'VITE_CHAIN_ID',
      message: chainIdResult.error,
      value: meta.VITE_CHAIN_ID,
    });
  }
  if (chainIdResult.value <= 0) {
    errors.push({
      field: 'VITE_CHAIN_ID',
      message: 'Must be a positive integer',
      value: chainIdResult.value,
    });
  }

  // VITE_RPC_URL (optional)
  const rpcUrl = meta.VITE_RPC_URL || DEFAULTS.VITE_RPC_URL!;
  if (!isValidUrl(rpcUrl)) {
    errors.push({
      field: 'VITE_RPC_URL',
      message: 'Must be a valid URL',
      value: rpcUrl,
    });
  }

  // VITE_EXPLORER_URL (optional)
  const explorerUrl = meta.VITE_EXPLORER_URL || DEFAULTS.VITE_EXPLORER_URL!;
  if (!isValidUrl(explorerUrl)) {
    errors.push({
      field: 'VITE_EXPLORER_URL',
      message: 'Must be a valid URL',
      value: explorerUrl,
    });
  }

  // VITE_USDC_ADDRESS (required)
  const usdcAddress = meta.VITE_USDC_ADDRESS || DEFAULTS.VITE_USDC_ADDRESS!;
  if (!isValidAddress(usdcAddress)) {
    errors.push({
      field: 'VITE_USDC_ADDRESS',
      message: 'Must be a valid Ethereum address',
      value: usdcAddress,
    });
  }

  // VITE_FACILITATOR_URL (optional)
  const facilitatorUrl = meta.VITE_FACILITATOR_URL || DEFAULTS.VITE_FACILITATOR_URL!;
  if (!isValidUrl(facilitatorUrl)) {
    errors.push({
      field: 'VITE_FACILITATOR_URL',
      message: 'Must be a valid URL',
      value: facilitatorUrl,
    });
  }

  // Return error result if validation failed
  if (errors.length > 0) {
    return { success: false, errors };
  }

  // Build validated environment object
  const data: ClientEnv = {
    VITE_API_URL: apiUrl,
    VITE_WS_URL: wsUrl,
    VITE_CHAIN_ID: chainIdResult.value,
    VITE_RPC_URL: rpcUrl,
    VITE_EXPLORER_URL: explorerUrl,
    VITE_USDC_ADDRESS: usdcAddress,
    VITE_FACILITATOR_URL: facilitatorUrl,
    VITE_WALLETCONNECT_PROJECT_ID: meta.VITE_WALLETCONNECT_PROJECT_ID || undefined,
    VITE_DEBUG: parseBoolean(meta.VITE_DEBUG, DEFAULTS.VITE_DEBUG!),
    VITE_MOCK_PAYMENTS: parseBoolean(meta.VITE_MOCK_PAYMENTS, DEFAULTS.VITE_MOCK_PAYMENTS!),
  };

  return { success: true, data };
}

// =============================================================================
// Cached Environment Object
// =============================================================================

let _env: ClientEnv | undefined;

/**
 * Get validated environment variables
 *
 * @throws Error if validation fails
 * @returns Validated ClientEnv object
 */
export function getEnv(): ClientEnv {
  if (!_env) {
    const result = validateEnv();
    if (!result.success) {
      const formatted = result
        .errors!.map(
          (e) => `  - ${e.field}: ${e.message}${e.value !== undefined ? ` (got: ${e.value})` : ''}`
        )
        .join('\n');
      throw new Error(`Environment validation failed:\n${formatted}`);
    }
    _env = result.data!;
  }
  return _env;
}

/**
 * Re-validate environment (useful for testing)
 */
export function revalidateEnv(): ClientEnv {
  _env = undefined;
  return getEnv();
}

// =============================================================================
// Exported Environment Object
// =============================================================================

/**
 * Validated environment variables
 *
 * Usage:
 * ```ts
 * import { env } from '@/lib/env';
 * console.log(env.VITE_API_URL); // Type-safe access
 * ```
 */
export const env = new Proxy({} as ClientEnv, {
  get(_, prop: string) {
    return getEnv()[prop as keyof ClientEnv];
  },
});

export default env;
