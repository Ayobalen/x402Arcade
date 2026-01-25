/**
 * SyncStatusIndicator Component
 *
 * Displays the sync status for queued offline actions.
 * Shows pending count, syncing animation, and error states.
 *
 * @module components/network/SyncStatusIndicator
 */

import { clsx } from 'clsx';
import { CloudOff, Cloud, UploadCloud, AlertCircle, CheckCircle } from 'lucide-react';
import type { SyncStatus } from '@/hooks/useOnlineStatus';

export interface SyncStatusIndicatorProps {
  /** Current sync status */
  status: SyncStatus;
  /** Number of pending actions */
  pendingCount: number;
  /** Whether the device is online */
  isOnline: boolean;
  /** Optional className */
  className?: string;
  /** Whether to show text label */
  showLabel?: boolean;
  /** Callback when clicked */
  onClick?: () => void;
}

/**
 * Sync status indicator component
 */
export function SyncStatusIndicator({
  status,
  pendingCount,
  isOnline,
  className,
  showLabel = true,
  onClick,
}: SyncStatusIndicatorProps) {
  const getIcon = () => {
    if (!isOnline) {
      return <CloudOff className="w-4 h-4" />;
    }

    switch (status) {
      case 'syncing':
        return <UploadCloud className="w-4 h-4 animate-pulse" />;
      case 'pending':
        return <Cloud className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      case 'synced':
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getLabel = (): string => {
    if (!isOnline) {
      return 'Offline';
    }

    switch (status) {
      case 'syncing':
        return 'Syncing...';
      case 'pending':
        return pendingCount === 1 ? '1 pending' : `${pendingCount} pending`;
      case 'error':
        return 'Sync failed';
      case 'synced':
      default:
        return 'Synced';
    }
  };

  const getStatusColor = (): string => {
    if (!isOnline) {
      return 'text-warning';
    }

    switch (status) {
      case 'syncing':
        return 'text-primary';
      case 'pending':
        return 'text-primary/70';
      case 'error':
        return 'text-error';
      case 'synced':
      default:
        return 'text-success';
    }
  };

  // Don't show if synced and online with nothing pending
  if (isOnline && status === 'synced' && pendingCount === 0) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={clsx(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg',
        'text-sm font-medium',
        'bg-surface-primary/50 backdrop-blur-sm',
        'border border-border/50',
        'transition-all duration-200',
        onClick && 'cursor-pointer hover:bg-surface-primary hover:border-border',
        !onClick && 'cursor-default',
        getStatusColor(),
        className
      )}
      aria-label={`Sync status: ${getLabel()}`}
    >
      {getIcon()}
      {showLabel && <span>{getLabel()}</span>}
      {pendingCount > 0 && status !== 'synced' && (
        <span
          className={clsx(
            'flex items-center justify-center',
            'w-5 h-5 rounded-full text-xs font-bold',
            'bg-current/20'
          )}
        >
          {pendingCount > 99 ? '99+' : pendingCount}
        </span>
      )}
    </button>
  );
}

export default SyncStatusIndicator;
