/**
 * SessionTimer Component
 *
 * Displays a countdown timer showing time remaining in the current game session.
 * Sessions expire after 15 minutes, at which point score submission will fail.
 *
 * Features:
 * - Real-time countdown display (updates every second)
 * - Warning state when < 2 minutes remaining
 * - Expired state with clear messaging
 * - Callback when session expires
 */

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

/**
 * Session timeout in milliseconds (15 minutes)
 * Must match backend: packages/backend/src/services/game-redis.ts
 */
const SESSION_TIMEOUT_MS = 15 * 60 * 1000;

/**
 * Warning threshold in milliseconds (2 minutes)
 */
const WARNING_THRESHOLD_MS = 2 * 60 * 1000;

/**
 * Props for SessionTimer component
 */
export interface SessionTimerProps {
  /** ISO timestamp when session was created */
  sessionCreatedAt: string;
  /** Callback when session expires (time reaches 0) */
  onExpired?: () => void;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Timer state
 */
type TimerState = 'normal' | 'warning' | 'expired';

/**
 * Format milliseconds to MM:SS display
 */
function formatTime(ms: number): string {
  if (ms <= 0) return '0:00';

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * SessionTimer Component
 *
 * Displays a real-time countdown of session expiration.
 */
export function SessionTimer({ sessionCreatedAt, onExpired, className }: SessionTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(SESSION_TIMEOUT_MS);
  const [timerState, setTimerState] = useState<TimerState>('normal');
  const [hasExpired, setHasExpired] = useState(false);

  // Calculate time remaining
  const updateTimeRemaining = useCallback(() => {
    const createdAt = new Date(sessionCreatedAt).getTime();
    const now = Date.now();
    const elapsed = now - createdAt;
    const remaining = SESSION_TIMEOUT_MS - elapsed;

    setTimeRemaining(Math.max(0, remaining));

    // Update state based on remaining time
    if (remaining <= 0) {
      setTimerState('expired');
      if (!hasExpired) {
        setHasExpired(true);
        onExpired?.();
      }
    } else if (remaining <= WARNING_THRESHOLD_MS) {
      setTimerState('warning');
    } else {
      setTimerState('normal');
    }
  }, [sessionCreatedAt, hasExpired, onExpired]);

  // Update timer every second
  useEffect(() => {
    // Initial calculation
    updateTimeRemaining();

    // Set up interval
    const intervalId = setInterval(updateTimeRemaining, 1000);

    // Cleanup
    return () => clearInterval(intervalId);
  }, [updateTimeRemaining]);

  // Get state-specific styling and content
  const getStateConfig = () => {
    switch (timerState) {
      case 'expired':
        return {
          icon: '❌',
          text: 'Session expired',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/50',
          textColor: 'text-red-400',
          glowColor: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
        };
      case 'warning':
        return {
          icon: '⚠️',
          text: formatTime(timeRemaining) + ' remaining',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/50',
          textColor: 'text-yellow-400',
          glowColor: 'shadow-[0_0_20px_rgba(234,179,8,0.3)]',
        };
      case 'normal':
      default:
        return {
          icon: '⏱️',
          text: formatTime(timeRemaining) + ' remaining',
          bgColor: 'bg-[#1a1a2e]',
          borderColor: 'border-[#2d2d4a]',
          textColor: 'text-[#00ffff]',
          glowColor: 'shadow-[0_0_20px_rgba(0,255,255,0.2)]',
        };
    }
  };

  const config = getStateConfig();

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        'px-4 py-2',
        'rounded-lg',
        'border-2',
        'transition-all duration-300',
        config.bgColor,
        config.borderColor,
        config.glowColor,
        className
      )}
    >
      <span className="text-lg">{config.icon}</span>
      <span className={cn('text-sm font-semibold', config.textColor)}>{config.text}</span>
    </div>
  );
}

export default SessionTimer;
