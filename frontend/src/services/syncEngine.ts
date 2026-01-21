/**
 * Sync Engine for Offline-First Architecture
 * 
 * CRITICAL DESIGN PRINCIPLES:
 * ===========================
 * 1. Backend is ALWAYS the single source of truth
 * 2. All offline actions are PROVISIONAL until backend confirms
 * 3. Conflicts require HUMAN review - never silently override
 * 4. Patient safety > automation
 * 
 * SYNC FLOW:
 * 1. Detect online state (navigator.onLine)
 * 2. Process pending actions in FIFO order
 * 3. Send to backend APIs
 * 4. Backend revalidates (bed availability, conflicts)
 * 5. Handle outcomes:
 *    ✅ Accepted → mark synced, update local cache
 *    ⚠ Conflict → notify staff for manual resolution
 *    ❌ Failed → retry or escalate
 */

import {
    offlineDb,
    PendingAction,
    OfflineBed,
    OfflineOpdEntry,
    OfflineAdmission,
    OfflineInventoryItem,
    getPendingActions,
    markActionSynced,
    markActionConflict,
    markActionFailed,
    getTimestamp,
    initializeAdmissionRules,
} from './offlineDb';

// ============================================================
// CONNECTIVITY STATE
// ============================================================

export type ConnectivityState = 'online' | 'offline' | 'syncing';

interface ConnectivityListener {
    (state: ConnectivityState): void;
}

let currentState: ConnectivityState = navigator.onLine ? 'online' : 'offline';
const listeners: Set<ConnectivityListener> = new Set();
let syncInProgress = false;

/**
 * Get current connectivity state
 */
export function getConnectivityState(): ConnectivityState {
    return currentState;
}

/**
 * Subscribe to connectivity changes
 */
export function subscribeToConnectivity(listener: ConnectivityListener): () => void {
    listeners.add(listener);
    // Immediately notify with current state
    listener(currentState);

    return () => {
        listeners.delete(listener);
    };
}

/**
 * Notify all listeners of state change
 */
function notifyListeners(state: ConnectivityState): void {
    currentState = state;
    listeners.forEach(listener => {
        try {
            listener(state);
        } catch (e) {
            console.error('[SyncEngine] Listener error:', e);
        }
    });
}

// ============================================================
// ONLINE/OFFLINE EVENT LISTENERS
// ============================================================

/**
 * Initialize event listeners for online/offline detection
 */
export function initializeSyncEngine(): void {
    // Listen for online event
    window.addEventListener('online', async () => {
        console.log('[SyncEngine] Network: Online detected');
        notifyListeners('online');

        // Auto-trigger sync when coming online
        await triggerSync();
    });

    // Listen for offline event
    window.addEventListener('offline', () => {
        console.log('[SyncEngine] Network: Offline detected');
        notifyListeners('offline');
    });

    // Initialize admission rules in background
    initializeAdmissionRules().catch(e => {
        console.warn('[SyncEngine] Failed to initialize admission rules:', e);
    });

    console.log('[SyncEngine] Initialized. Current state:', currentState);
}

// ============================================================
// SYNC LOGIC
// ============================================================

/**
 * Trigger a sync of pending actions
 * Returns true if sync was successful (or nothing to sync)
 */
export async function triggerSync(): Promise<boolean> {
    // Don't sync if offline
    if (!navigator.onLine) {
        console.log('[SyncEngine] Cannot sync: offline');
        return false;
    }

    // Prevent concurrent syncs
    if (syncInProgress) {
        console.log('[SyncEngine] Sync already in progress');
        return false;
    }

    try {
        syncInProgress = true;
        notifyListeners('syncing');

        const pendingActions = await getPendingActions();

        if (pendingActions.length === 0) {
            console.log('[SyncEngine] No pending actions to sync');
            notifyListeners('online');
            return true;
        }

        console.log(`[SyncEngine] Syncing ${pendingActions.length} pending actions...`);

        // Process actions in order (FIFO)
        for (const action of pendingActions) {
            // Check if we're still online
            if (!navigator.onLine) {
                console.log('[SyncEngine] Lost connection during sync');
                notifyListeners('offline');
                return false;
            }

            await syncAction(action);
        }

        // Refresh cache after successful sync
        await refreshCacheFromBackend();

        notifyListeners('online');
        return true;

    } catch (error) {
        console.error('[SyncEngine] Sync error:', error);
        notifyListeners(navigator.onLine ? 'online' : 'offline');
        return false;
    } finally {
        syncInProgress = false;
    }
}

/**
 * Sync a single action to the backend
 */
async function syncAction(action: PendingAction): Promise<void> {
    console.log(`[SyncEngine] Syncing action: ${action.type} (${action.actionId})`);

    try {
        // Mark as syncing in DB
        await offlineDb.pendingActions
            .where('actionId')
            .equals(action.actionId)
            .modify({ syncStatus: 'syncing' });

        const result = await executeAction(action);

        if (result.success) {
            await markActionSynced(action.actionId, result.data);
            console.log(`[SyncEngine] Action synced: ${action.actionId}`);
        } else if (result.conflict) {
            await markActionConflict(action.actionId, result.message, result.data);
            console.warn(`[SyncEngine] Conflict: ${action.actionId} - ${result.message}`);
        } else {
            await markActionFailed(action.actionId, result.message);
            console.error(`[SyncEngine] Failed: ${action.actionId} - ${result.message}`);
        }

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        await markActionFailed(action.actionId, message);
        console.error(`[SyncEngine] Error syncing ${action.actionId}:`, error);
    }
}

interface ActionResult {
    success: boolean;
    conflict?: boolean;
    message: string;
    data?: any;
}

/**
 * Execute an action against the backend API
 */
async function executeAction(action: PendingAction): Promise<ActionResult> {
    const baseUrl = 'http://localhost:5000/api/hospital';
    const token = localStorage.getItem('token');

    if (!token) {
        return { success: false, message: 'No authentication token' };
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    try {
        switch (action.type) {
            // ==================== ADMISSION ACTIONS ====================

            case 'ADMISSION_CREATE': {
                const response = await fetch(`${baseUrl}/admissions`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(action.payload)
                });

                if (response.ok) {
                    const data = await response.json();
                    // Update local admission with backend ID
                    if (action.payload.offlineId) {
                        await offlineDb.admissions.delete(action.payload.offlineId);
                        // Backend returns only ID and allocation info, full data is in payload
                        await offlineDb.admissions.put({
                            patientName: action.payload.patientName || '',
                            age: action.payload.age,
                            department: action.payload.department || '',
                            bedType: action.payload.bedType || 'General',
                            severity: action.payload.severity || 'medium',
                            oxygenRequired: action.payload.oxygenRequired || false,
                            isolationRequired: action.payload.isolationRequired || false,
                            id: data.id,
                            status: data.status,
                            allocatedBedTypeId: data.allocatedBedTypeId,
                            allocationNote: data.allocationNote,
                            createdAt: action.payload.createdAt || getTimestamp(),
                            lastSyncedAt: getTimestamp(),
                            isOfflineCreated: false
                        });
                    }
                    return { success: true, message: 'Admission created successfully', data };
                }

                const error = await response.json().catch(() => ({ message: 'Unknown error' }));

                // Check for conflict scenarios
                if (response.status === 409 || error.message?.includes('conflict')) {
                    return { success: false, conflict: true, message: error.message || 'Admission conflict' };
                }

                return { success: false, message: error.message || `HTTP ${response.status}` };
            }

            case 'ADMISSION_ADMIT': {
                const { admissionId } = action.payload;
                const response = await fetch(`${baseUrl}/admissions/${admissionId}/admit`, {
                    method: 'POST',
                    headers
                });

                if (response.ok) {
                    const data = await response.json();
                    return { success: true, message: 'Patient admitted successfully', data };
                }

                const error = await response.json().catch(() => ({ message: 'Unknown error' }));

                // Bed already occupied is a CONFLICT requiring human review
                if (error.message?.includes('No available beds') ||
                    error.message?.includes('already occupied')) {
                    return {
                        success: false,
                        conflict: true,
                        message: `Bed conflict: ${error.message}. This bed may have been assigned offline by another user.`
                    };
                }

                return { success: false, message: error.message };
            }

            case 'ADMISSION_DISCHARGE': {
                const { admissionId } = action.payload;
                const response = await fetch(`${baseUrl}/admissions/${admissionId}/discharge`, {
                    method: 'POST',
                    headers
                });

                if (response.ok) {
                    const data = await response.json();
                    return { success: true, message: 'Patient discharged successfully', data };
                }

                const error = await response.json().catch(() => ({ message: 'Unknown error' }));
                return { success: false, message: error.message };
            }

            // ==================== OPD QUEUE ACTIONS ====================

            case 'OPD_CHECKIN': {
                const response = await fetch(`${baseUrl}/opd/check-in`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(action.payload)
                });

                if (response.ok) {
                    const data = await response.json();
                    // Update local OPD entry with backend ID
                    if (action.payload.offlineId) {
                        await offlineDb.opdQueue.delete(action.payload.offlineId);
                        // Backend returns queue info, full data is in payload
                        await offlineDb.opdQueue.put({
                            patientName: action.payload.patientName || '',
                            department: action.payload.department || '',
                            doctorName: action.payload.doctorName || '',
                            visitType: action.payload.visitType || 'OPD',
                            status: data.status || action.payload.status || 'checked-in',
                            priority: action.payload.priority || 'normal',
                            checkInTime: action.payload.checkInTime || getTimestamp(),
                            id: data.id,
                            queueNumber: data.queueNumber, // Backend assigns the real queue number
                            lastSyncedAt: getTimestamp(),
                            isOfflineCreated: false
                        });
                    }
                    return { success: true, message: 'OPD check-in successful', data };
                }

                const error = await response.json().catch(() => ({ message: 'Unknown error' }));
                return { success: false, message: error.message };
            }

            case 'OPD_UPDATE_STATUS': {
                const { checkInId, status } = action.payload;
                const response = await fetch(`${baseUrl}/opd/queue/${checkInId}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({ status })
                });

                if (response.ok) {
                    const data = await response.json();
                    return { success: true, message: 'OPD status updated', data };
                }

                const error = await response.json().catch(() => ({ message: 'Unknown error' }));

                // Check for queue position conflicts
                if (error.message?.includes('mismatch') || error.message?.includes('conflict')) {
                    return {
                        success: false,
                        conflict: true,
                        message: `Queue conflict: ${error.message}`
                    };
                }

                return { success: false, message: error.message };
            }

            case 'OPD_UPDATE_PRIORITY': {
                const { checkInId, priority } = action.payload;
                const response = await fetch(`${baseUrl}/opd/queue/${checkInId}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({ priority })
                });

                if (response.ok) {
                    const data = await response.json();
                    return { success: true, message: 'OPD priority updated', data };
                }

                const error = await response.json().catch(() => ({ message: 'Unknown error' }));
                return { success: false, message: error.message };
            }

            // ==================== BED ACTIONS ====================

            case 'BED_OCCUPY': {
                const { bedTypeId, bedNumber } = action.payload;
                const response = await fetch(`${baseUrl}/beds/${bedTypeId}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({
                        action: 'occupy',
                        bedNumber
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    return { success: true, message: 'Bed occupied successfully', data };
                }

                const error = await response.json().catch(() => ({ message: 'Unknown error' }));

                // Bed conflicts are CRITICAL in healthcare
                if (error.message?.includes('No available beds') ||
                    error.message?.includes('already occupied') ||
                    response.status === 409) {
                    return {
                        success: false,
                        conflict: true,
                        message: `⚠️ CRITICAL: ${error.message}. This bed assignment conflicts with another assignment. Please review manually.`
                    };
                }

                return { success: false, message: error.message };
            }

            case 'BED_RELEASE': {
                const { bedTypeId, bedNumber } = action.payload;
                const response = await fetch(`${baseUrl}/beds/${bedTypeId}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({
                        action: 'release',
                        bedNumber
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    return { success: true, message: 'Bed released successfully', data };
                }

                const error = await response.json().catch(() => ({ message: 'Unknown error' }));
                return { success: false, message: error.message };
            }

            // ==================== INVENTORY ACTIONS ====================

            case 'INVENTORY_CONSUME': {
                const { itemId, qty, reason, linkedAdmissionId } = action.payload;
                const response = await fetch(`${baseUrl}/inventory/${itemId}/consume`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ qty, reason, linkedAdmissionId })
                });

                if (response.ok) {
                    const data = await response.json();
                    return { success: true, message: 'Inventory consumed', data };
                }

                const error = await response.json().catch(() => ({ message: 'Unknown error' }));

                // Stock conflicts (already consumed more than available)
                if (error.message?.includes('insufficient') ||
                    error.message?.includes('stock')) {
                    return {
                        success: false,
                        conflict: true,
                        message: `Inventory conflict: ${error.message}. Stock levels may have changed.`
                    };
                }

                return { success: false, message: error.message };
            }

            default:
                return { success: false, message: `Unknown action type: ${action.type}` };
        }

    } catch (error) {
        // Network errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
            return { success: false, message: 'Network error - will retry' };
        }
        throw error;
    }
}

// ============================================================
// CACHE REFRESH
// ============================================================

/**
 * Refresh local cache from backend after coming online
 * This ensures we have the latest data
 */
export async function refreshCacheFromBackend(): Promise<void> {
    if (!navigator.onLine) {
        console.log('[SyncEngine] Cannot refresh cache: offline');
        return;
    }

    console.log('[SyncEngine] Refreshing cache from backend...');

    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('[SyncEngine] No token, skipping cache refresh');
        return;
    }

    const baseUrl = 'http://localhost:5000/api/hospital';
    const headers = {
        'Authorization': `Bearer ${token}`
    };

    try {
        // Refresh beds
        const bedsResponse = await fetch(`${baseUrl}/beds`, { headers });
        if (bedsResponse.ok) {
            const beds = await bedsResponse.json();
            const timestamp = getTimestamp();
            await offlineDb.beds.clear();
            await offlineDb.beds.bulkPut(
                beds.map((bed: any) => ({
                    ...bed,
                    lastSyncedAt: timestamp
                }))
            );
            console.log(`[SyncEngine] Cached ${beds.length} beds`);
        }

        // Refresh OPD queue
        const opdResponse = await fetch(`${baseUrl}/opd/queue`, { headers });
        if (opdResponse.ok) {
            const opdQueue = await opdResponse.json();
            const timestamp = getTimestamp();
            // Only replace non-offline-created entries
            const existingOffline = await offlineDb.opdQueue
                .filter(e => e.isOfflineCreated === true)
                .toArray();
            await offlineDb.opdQueue.clear();
            await offlineDb.opdQueue.bulkPut([
                ...opdQueue.map((entry: any) => ({
                    ...entry,
                    lastSyncedAt: timestamp,
                    isOfflineCreated: false
                })),
                ...existingOffline // Keep offline entries until synced
            ]);
            console.log(`[SyncEngine] Cached ${opdQueue.length} OPD entries`);
        }

        // Refresh admissions
        const admissionsResponse = await fetch(`${baseUrl}/admissions`, { headers });
        if (admissionsResponse.ok) {
            const admissions = await admissionsResponse.json();
            const timestamp = getTimestamp();
            const existingOffline = await offlineDb.admissions
                .filter(a => a.isOfflineCreated === true)
                .toArray();
            await offlineDb.admissions.clear();
            await offlineDb.admissions.bulkPut([
                ...admissions.map((admission: any) => ({
                    ...admission,
                    lastSyncedAt: timestamp,
                    isOfflineCreated: false
                })),
                ...existingOffline
            ]);
            console.log(`[SyncEngine] Cached ${admissions.length} admissions`);
        }

        // Refresh inventory
        const inventoryResponse = await fetch(`${baseUrl}/inventory`, { headers });
        if (inventoryResponse.ok) {
            const items = await inventoryResponse.json();
            const timestamp = getTimestamp();
            await offlineDb.inventoryItems.clear();
            await offlineDb.inventoryItems.bulkPut(
                items.map((item: any) => ({
                    ...item,
                    lastSyncedAt: timestamp
                }))
            );
            console.log(`[SyncEngine] Cached ${items.length} inventory items`);
        }

        // Update sync metadata
        await offlineDb.syncMetadata.put({
            id: 'main',
            lastFullSync: getTimestamp(),
            lastPartialSync: getTimestamp(),
            pendingCount: await offlineDb.pendingActions.where('syncStatus').anyOf(['pending', 'failed']).count(),
            conflictCount: await offlineDb.pendingActions.where('syncStatus').equals('conflict').count()
        });

        console.log('[SyncEngine] Cache refresh complete');

    } catch (error) {
        console.error('[SyncEngine] Cache refresh error:', error);
    }
}

/**
 * Initial cache load when app starts (if online)
 */
export async function initialCacheLoad(): Promise<void> {
    if (navigator.onLine) {
        await refreshCacheFromBackend();
    } else {
        console.log('[SyncEngine] Offline - using existing cache');
    }
}

// ============================================================
// OFFLINE DATA ACCESS
// ============================================================

/**
 * Get beds from cache
 */
export async function getCachedBeds(): Promise<OfflineBed[]> {
    return offlineDb.beds.toArray();
}

/**
 * Get OPD queue from cache
 */
export async function getCachedOpdQueue(): Promise<OfflineOpdEntry[]> {
    return offlineDb.opdQueue.orderBy('queueNumber').toArray();
}

/**
 * Get admissions from cache
 */
export async function getCachedAdmissions(): Promise<OfflineAdmission[]> {
    return offlineDb.admissions.orderBy('createdAt').reverse().toArray();
}

/**
 * Get inventory items from cache
 */
export async function getCachedInventory(): Promise<OfflineInventoryItem[]> {
    return offlineDb.inventoryItems.orderBy('name').toArray();
}

// ============================================================
// OFFLINE ACTIONS (Create provisional data)
// ============================================================

/**
 * Create an admission offline
 * Returns a provisional admission with offline ID
 */
export async function createOfflineAdmission(
    admissionData: Omit<OfflineAdmission, 'id' | 'lastSyncedAt' | 'isOfflineCreated' | 'createdAt'>
): Promise<OfflineAdmission> {
    const { generateOfflineId, getTimestamp } = await import('./offlineDb');

    const offlineId = generateOfflineId();
    const timestamp = getTimestamp();

    const admission: OfflineAdmission = {
        ...admissionData,
        id: offlineId,
        createdAt: timestamp,
        lastSyncedAt: timestamp,
        isOfflineCreated: true,
        status: 'pending',
        allocationNote: '⚠️ PROVISIONAL: Created offline, pending backend confirmation'
    };

    await offlineDb.admissions.put(admission);

    // Add to pending actions queue
    const { addPendingAction } = await import('./offlineDb');
    await addPendingAction('ADMISSION_CREATE', {
        ...admissionData,
        offlineId
    });

    return admission;
}

/**
 * Create an OPD check-in offline
 */
export async function createOfflineOpdCheckIn(
    checkInData: Omit<OfflineOpdEntry, 'id' | 'lastSyncedAt' | 'isOfflineCreated'>
): Promise<OfflineOpdEntry> {
    const { generateOfflineId, getTimestamp } = await import('./offlineDb');

    console.log('[createOfflineOpdCheckIn] Received checkInData:', checkInData);
    console.log('[createOfflineOpdCheckIn] estimatedArrivalTime:', checkInData.estimatedArrivalTime);

    const offlineId = generateOfflineId();
    const timestamp = getTimestamp();

    // Get next queue number from cache
    const maxQueue = await offlineDb.opdQueue.orderBy('queueNumber').last();
    const nextQueueNumber = (maxQueue?.queueNumber || 0) + 1;

    const entry: OfflineOpdEntry = {
        ...checkInData,
        id: offlineId,
        queueNumber: nextQueueNumber,
        lastSyncedAt: timestamp,
        isOfflineCreated: true
    };

    console.log('[createOfflineOpdCheckIn] Created entry:', entry);
    console.log('[createOfflineOpdCheckIn] Entry ETA:', entry.estimatedArrivalTime);

    await offlineDb.opdQueue.put(entry);

    // Add to pending actions queue
    const { addPendingAction } = await import('./offlineDb');
    await addPendingAction('OPD_CHECKIN', {
        ...checkInData,
        offlineId,
        queueNumber: nextQueueNumber
    });

    return entry;
}

/**
 * Update OPD status offline
 */
export async function updateOfflineOpdStatus(
    checkInId: string,
    status: OfflineOpdEntry['status']
): Promise<void> {
    await offlineDb.opdQueue
        .where('id')
        .equals(checkInId)
        .modify({
            status,
            lastSyncedAt: getTimestamp()
        });

    // Only queue action if it's a backend ID (not offline-created)
    const entry = await offlineDb.opdQueue.get(checkInId);
    if (entry && !entry.isOfflineCreated) {
        const { addPendingAction } = await import('./offlineDb');
        await addPendingAction('OPD_UPDATE_STATUS', { checkInId, status });
    }
}

/**
 * Occupy a bed offline (PROVISIONAL)
 */
export async function occupyBedOffline(
    bedTypeId: string,
    bedNumber?: number
): Promise<void> {
    const bed = await offlineDb.beds.get(bedTypeId);
    if (!bed) throw new Error('Bed type not found in cache');

    if (bed.available <= 0) {
        throw new Error('No available beds in cache');
    }

    // Update local cache (provisional)
    if (bed.beds && bedNumber) {
        const targetBed = bed.beds.find(b => b.number === bedNumber);
        if (targetBed) {
            targetBed.status = 'occupied';
        }
    }
    bed.occupied += 1;
    bed.available -= 1;
    bed.lastSyncedAt = getTimestamp();

    await offlineDb.beds.put(bed);

    // Queue for sync
    const { addPendingAction } = await import('./offlineDb');
    await addPendingAction('BED_OCCUPY', { bedTypeId, bedNumber });
}

/**
 * Log inventory consumption offline
 */
export async function logInventoryConsumptionOffline(
    itemId: string,
    qty: number,
    reason: string,
    linkedAdmissionId?: string
): Promise<void> {
    const { generateOfflineId, getTimestamp } = await import('./offlineDb');

    // Update local inventory cache
    const item = await offlineDb.inventoryItems.get(itemId);
    if (item) {
        item.currentStock = Math.max(0, item.currentStock - qty);
        item.lastSyncedAt = getTimestamp();
        await offlineDb.inventoryItems.put(item);

        // Log the consumption
        const log: import('./offlineDb').OfflineInventoryLog = {
            id: generateOfflineId(),
            itemId,
            itemName: item.name,
            type: 'consume',
            qty,
            reason,
            linkedAdmissionId,
            occurredAt: getTimestamp(),
            lastSyncedAt: getTimestamp(),
            isOfflineCreated: true
        };

        await offlineDb.inventoryLogs.put(log);

        // Queue for sync
        const { addPendingAction } = await import('./offlineDb');
        await addPendingAction('INVENTORY_CONSUME', {
            itemId,
            qty,
            reason,
            linkedAdmissionId
        });
    }
}

export default {
    initializeSyncEngine,
    triggerSync,
    refreshCacheFromBackend,
    initialCacheLoad,
    getConnectivityState,
    subscribeToConnectivity,
    getCachedBeds,
    getCachedOpdQueue,
    getCachedAdmissions,
    getCachedInventory,
    createOfflineAdmission,
    createOfflineOpdCheckIn,
    updateOfflineOpdStatus,
    occupyBedOffline,
    logInventoryConsumptionOffline
};
