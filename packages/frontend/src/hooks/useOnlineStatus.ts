/**
 * useOnlineStatus Hook
 *
 * Comprehensive online/offline status management:
 * - Real-time network status detection
 * - Action queuing for offline scenarios
 * - Sync status tracking
 * - Network quality assessment
 *
 * @module hooks/useOnlineStatus
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

/**
 * Network quality levels
 */
export type NetworkQuality = 'offline' | 'slow' | 'moderate' | 'fast' | 'unknown';

/**
 * Queued action for offline execution
 */
export interface QueuedAction {
  /** Unique action ID */
  id: string;
  /** Action type for identification */
  type: string;
  /** Action payload */
  payload: unknown;
  /** Timestamp when action was queued */
  queuedAt: number;
  /** Number of retry attempts */
  retryCount: number;
  /** Priority (higher = execute first) */
  priority: number;
}

/**
 * Sync status for tracking pending actions
 */
export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'error';

/**
 * Online status state
 */
export interface OnlineStatusState {
  /** Whether the device is online */
  isOnline: boolean;
  /** Estimated network quality */
  networkQuality: NetworkQuality;
  /** Whether sync is in progress */
  isSyncing: boolean;
  /** Current sync status */
  syncStatus: SyncStatus;
  /** Number of pending actions */
  pendingCount: number;
  /** Time since last online in ms */
  offlineDuration: number | null;
  /** Effective connection type (from Network Information API) */
  effectiveType: string | null;
  /** Downlink speed in Mbps (estimated) */
  downlink: number | null;
  /** Round-trip time in ms (estimated) */
  rtt: number | null;
}

/**
 * Hook options
 */
export interface UseOnlineStatusOptions {
  /** Callback when going online */
  onOnline?: () => void;
  /** Callback when going offline */
  onOffline?: () => void;
  /** Callback when sync status changes */
  onSyncStatusChange?: (status: SyncStatus) => void;
  /** Custom handler for syncing queued actions */
  onSync?: (actions: QueuedAction[]) => Promise<void>;
  /** Whether to auto-sync when coming online (default: true) */
  autoSync?: boolean;
  /** Whether to persist queue to localStorage (default: true) */
  persistQueue?: boolean;
  /** localStorage key for queue (default: 'x402arcade_action_queue') */
  storageKey?: string;
}

/**
 * Hook return type
 */
export interface UseOnlineStatusReturn extends OnlineStatusState {
  /** Queue an action for offline execution */
  queueAction: (type: string, payload: unknown, priority?: number) => string;
  /** Remove a queued action */
  removeAction: (id: string) => void;
  /** Clear all queued actions */
  clearQueue: () => void;
  /** Get all queued actions */
  getQueuedActions: () => QueuedAction[];
  /** Manually trigger sync */
  syncNow: () => Promise<void>;
  /** Check if a specific action type is queued */
  hasQueuedAction: (type: string) => boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_STORAGE_KEY = 'x402arcade_action_queue';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a unique action ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Estimate network quality from Network Information API
 */
function estimateNetworkQuality(
  isOnline: boolean,
  effectiveType: string | null,
  downlink: number | null
): NetworkQuality {
  if (!isOnline) return 'offline';
  if (!effectiveType && !downlink) return 'unknown';

  // Use effective type if available
  if (effectiveType) {
    switch (effectiveType) {
      case 'slow-2g':
      case '2g':
        return 'slow';
      case '3g':
        return 'moderate';
      case '4g':
        return 'fast';
      default:
        break;
    }
  }

  // Use downlink speed
  if (downlink !== null) {
    if (downlink < 0.5) return 'slow';
    if (downlink < 5) return 'moderate';
    return 'fast';
  }

  return 'unknown';
}

/**
 * Load queue from localStorage
 */
function loadQueue(key: string): QueuedAction[] {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

/**
 * Save queue to localStorage
 */
function saveQueue(key: string, queue: QueuedAction[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(queue));
  } catch {
    // Ignore storage errors (quota exceeded, etc.)
  }
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for comprehensive online/offline status management
 *
 * @param options - Hook configuration options
 * @returns Online status state and action queue management functions
 *
 * @example
 * ```tsx
 * function App() {
 *   const {
 *     isOnline,
 *     networkQuality,
 *     pendingCount,
 *     syncStatus,
 *     queueAction,
 *     syncNow,
 *   } = useOnlineStatus({
 *     onOnline: () => console.log('Back online!'),
 *     onOffline: () => console.log('Gone offline'),
 *     onSync: async (actions) => {
 *       for (const action of actions) {
 *         await processAction(action);
 *       }
 *     },
 *   });
 *
 *   const handleSubmit = async (data) => {
 *     if (!isOnline) {
 *       queueAction('SUBMIT_SCORE', data);
 *       return;
 *     }
 *     await submitScore(data);
 *   };
 *
 *   return (
 *     <div>
 *       {!isOnline && <OfflineBanner />}
 *       {pendingCount > 0 && <SyncIndicator count={pendingCount} />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useOnlineStatus(options: UseOnlineStatusOptions = {}): UseOnlineStatusReturn {
  const {
    onOnline,
    onOffline,
    onSyncStatusChange,
    onSync,
    autoSync = true,
    persistQueue = true,
    storageKey = DEFAULT_STORAGE_KEY,
  } = options;

  // Network status state
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Network quality state
  const [networkInfo, setNetworkInfo] = useState<{
    effectiveType: string | null;
    downlink: number | null;
    rtt: number | null;
  }>({
    effectiveType: null,
    downlink: null,
    rtt: null,
  });

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');

  // Action queue
  const [queue, setQueue] = useState<QueuedAction[]>(() =>
    persistQueue ? loadQueue(storageKey) : []
  );

  // Track offline duration
  const offlineStartRef = useRef<number | null>(null);
  const [offlineDuration, setOfflineDuration] = useState<number | null>(null);

  // Calculate network quality
  const networkQuality = estimateNetworkQuality(
    isOnline,
    networkInfo.effectiveType,
    networkInfo.downlink
  );

  // Persist queue changes
  useEffect(() => {
    if (persistQueue) {
      saveQueue(storageKey, queue);
    }
  }, [queue, persistQueue, storageKey]);

  // Update sync status based on queue
  useEffect(() => {
    if (isSyncing) {
      setSyncStatus('syncing');
    } else if (queue.length > 0) {
      setSyncStatus('pending');
    } else {
      setSyncStatus('synced');
    }
  }, [queue.length, isSyncing]);

  // Notify on sync status change
  useEffect(() => {
    onSyncStatusChange?.(syncStatus);
  }, [syncStatus, onSyncStatusChange]);

  // Handle network events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      // Calculate offline duration
      if (offlineStartRef.current !== null) {
        setOfflineDuration(Date.now() - offlineStartRef.current);
        offlineStartRef.current = null;
      }
      onOnline?.();
    };

    const handleOffline = () => {
      setIsOnline(false);
      offlineStartRef.current = Date.now();
      onOffline?.();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onOnline, onOffline]);

  // Listen to Network Information API changes
  useEffect(() => {
    if (typeof navigator === 'undefined') return;

    const connection = (
      navigator as Navigator & {
        connection?: {
          effectiveType?: string;
          downlink?: number;
          rtt?: number;
          addEventListener?: (type: string, handler: () => void) => void;
          removeEventListener?: (type: string, handler: () => void) => void;
        };
      }
    ).connection;

    if (!connection) return;

    const updateNetworkInfo = () => {
      setNetworkInfo({
        effectiveType: connection.effectiveType || null,
        downlink: connection.downlink || null,
        rtt: connection.rtt || null,
      });
    };

    // Initial update
    updateNetworkInfo();

    // Listen for changes
    connection.addEventListener?.('change', updateNetworkInfo);

    return () => {
      connection.removeEventListener?.('change', updateNetworkInfo);
    };
  }, []);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && autoSync && queue.length > 0 && onSync && !isSyncing) {
      syncNow();
    }
    // Only trigger on isOnline and autoSync changes - syncNow is stable, queue/isSyncing checked inside
  }, [isOnline, autoSync, syncNow, queue.length, onSync, isSyncing]);

  // Queue an action
  const queueAction = useCallback(
    (type: string, payload: unknown, priority: number = 0): string => {
      const id = generateId();
      const action: QueuedAction = {
        id,
        type,
        payload,
        queuedAt: Date.now(),
        retryCount: 0,
        priority,
      };

      setQueue((prev) => {
        // Insert in priority order (higher priority first)
        const newQueue = [...prev, action].sort((a, b) => b.priority - a.priority);
        return newQueue;
      });

      return id;
    },
    []
  );

  // Remove an action
  const removeAction = useCallback((id: string): void => {
    setQueue((prev) => prev.filter((action) => action.id !== id));
  }, []);

  // Clear the queue
  const clearQueue = useCallback((): void => {
    setQueue([]);
  }, []);

  // Get queued actions
  const getQueuedActions = useCallback((): QueuedAction[] => {
    return [...queue];
  }, [queue]);

  // Check if action type is queued
  const hasQueuedAction = useCallback(
    (type: string): boolean => {
      return queue.some((action) => action.type === type);
    },
    [queue]
  );

  // Sync queued actions
  const syncNow = useCallback(async (): Promise<void> => {
    if (!onSync || queue.length === 0 || isSyncing) return;

    setIsSyncing(true);

    try {
      await onSync([...queue]);
      // Clear queue on success
      setQueue([]);
      setSyncStatus('synced');
    } catch {
      // Keep queue on failure
      setSyncStatus('error');
      // Increment retry count for all actions
      setQueue((prev) =>
        prev.map((action) => ({
          ...action,
          retryCount: action.retryCount + 1,
        }))
      );
    } finally {
      setIsSyncing(false);
    }
  }, [onSync, queue, isSyncing]);

  return {
    isOnline,
    networkQuality,
    isSyncing,
    syncStatus,
    pendingCount: queue.length,
    offlineDuration,
    effectiveType: networkInfo.effectiveType,
    downlink: networkInfo.downlink,
    rtt: networkInfo.rtt,
    queueAction,
    removeAction,
    clearQueue,
    getQueuedActions,
    syncNow,
    hasQueuedAction,
  };
}

export default useOnlineStatus;
