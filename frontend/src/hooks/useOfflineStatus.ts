/**
 * React Hook for Offline-First Functionality
 * 
 * Provides:
 * - Real-time connectivity state
 * - Pending actions count
 * - Conflict notifications
 * - Sync status
 * 
 * Usage:
 * const { isOffline, isSyncing, pendingCount, conflicts, syncNow } = useOfflineStatus();
 */

import { useState, useEffect, useCallback } from 'react';
import {
    initializeSyncEngine,
    subscribeToConnectivity,
    getConnectivityState,
    triggerSync,
    initialCacheLoad,
    type ConnectivityState
} from '../services/syncEngine';
import {
    getPendingActionsCount,
    getConflictsCount,
    getConflicts,
    dismissConflict,
    type PendingAction
} from '../services/offlineDb';

export interface OfflineStatusHook {
    // Connectivity
    isOffline: boolean;
    isSyncing: boolean;
    connectivityState: ConnectivityState;

    // Pending actions
    pendingCount: number;
    conflictCount: number;
    conflicts: PendingAction[];

    // Actions
    syncNow: () => Promise<boolean>;
    dismissConflict: (actionId: string) => Promise<void>;
    refreshStatus: () => Promise<void>;

    // Initialization state
    initialized: boolean;
}

// Track if sync engine has been initialized
let syncEngineInitialized = false;

/**
 * Hook for tracking offline status and managing sync
 */
export function useOfflineStatus(): OfflineStatusHook {
    const [connectivityState, setConnectivityState] = useState<ConnectivityState>(
        typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline'
    );
    const [pendingCount, setPendingCount] = useState(0);
    const [conflictCount, setConflictCount] = useState(0);
    const [conflicts, setConflicts] = useState<PendingAction[]>([]);
    const [initialized, setInitialized] = useState(false);

    // Refresh status from database
    const refreshStatus = useCallback(async () => {
        try {
            const pending = await getPendingActionsCount();
            const conflictCnt = await getConflictsCount();
            const conflictList = await getConflicts();

            setPendingCount(pending);
            setConflictCount(conflictCnt);
            setConflicts(conflictList);
        } catch (error) {
            console.error('[useOfflineStatus] Error refreshing status:', error);
        }
    }, []);

    // Initialize sync engine
    useEffect(() => {
        const init = async () => {
            if (!syncEngineInitialized) {
                initializeSyncEngine();
                syncEngineInitialized = true;

                // Load initial cache if online
                try {
                    await initialCacheLoad();
                } catch (error) {
                    console.warn('[useOfflineStatus] Initial cache load failed:', error);
                }
            }

            // Subscribe to connectivity changes
            const unsubscribe = subscribeToConnectivity((state) => {
                setConnectivityState(state);
                // Refresh status whenever connectivity changes
                refreshStatus();
            });

            // Initial status refresh
            await refreshStatus();
            setInitialized(true);

            return () => {
                unsubscribe();
            };
        };

        init();
    }, [refreshStatus]);

    // Periodic status refresh (every 10 seconds)
    useEffect(() => {
        const interval = setInterval(() => {
            refreshStatus();
        }, 10000);

        return () => clearInterval(interval);
    }, [refreshStatus]);

    // Sync action
    const syncNow = useCallback(async (): Promise<boolean> => {
        const result = await triggerSync();
        await refreshStatus();
        return result;
    }, [refreshStatus]);

    // Dismiss conflict action
    const handleDismissConflict = useCallback(async (actionId: string): Promise<void> => {
        await dismissConflict(actionId);
        await refreshStatus();
    }, [refreshStatus]);

    return {
        isOffline: connectivityState === 'offline',
        isSyncing: connectivityState === 'syncing',
        connectivityState,
        pendingCount,
        conflictCount,
        conflicts,
        syncNow,
        dismissConflict: handleDismissConflict,
        refreshStatus,
        initialized
    };
}

export default useOfflineStatus;
