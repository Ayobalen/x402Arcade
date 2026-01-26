/**
 * Game Components Index
 *
 * Central export point for all game-related components.
 * Import from here instead of individual files.
 *
 * @example
 * ```typescript
 * import { GameWrapper, PaymentGate } from '@/games/components';
 * ```
 */

// Core components
export { GameWrapper } from './GameWrapper';
export type { GameWrapperProps, InjectedGameProps, GameComponent } from './GameWrapper';

export { PaymentGate } from './PaymentGate';
export type { PaymentGateProps } from './PaymentGate';
