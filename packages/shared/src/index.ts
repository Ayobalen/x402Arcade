/**
 * Shared Package - Central Export
 *
 * This package contains shared types, utilities, and constants
 * used by both frontend and backend.
 */

// Re-export test utilities for convenience
// Note: For production builds, tree-shaking will remove unused exports
export * from '../test-utils';

// Shared constants (chain config, USDC, EIP-712 types)
export * from './constants';
