/**
 * Offline-Aware Hospital API
 * 
 * This module wraps the hospital API calls to support offline-first behavior:
 * 
 * 🟢 WHEN ONLINE:
 *   - Fetch data from backend APIs
 *   - Store a cached copy in Dexie
 *   - Normal operation
 * 
 * 🔴 WHEN OFFLINE:
 *   - Use Dexie data instead of APIs
 *   - Allow admission workflow, OPD queue updates, bed assignment
 *   - Mark all offline actions as status = provisional
 * 
 * "Offline mode ensures continuity of care during network outages
 *  while preserving backend authority."
 */

import {
    offlineDb,
    OfflineBed,
    OfflineOpdEntry,
    OfflineAdmission,
    OfflineInventoryItem,
    getTimestamp,
    generateOfflineId,
    addPendingAction,
    getPendingActionsCount,
    getConflictsCount,
    getConflicts,
    dismissConflict,
    PendingAction,
} from './offlineDb';

import {
    getConnectivityState,
    getCachedBeds,
    getCachedOpdQueue,
    getCachedAdmissions,
    getCachedInventory,
    createOfflineAdmission,
    createOfflineOpdCheckIn,
    updateOfflineOpdStatus,
    occupyBedOffline,
    logInventoryConsumptionOffline,
    triggerSync,
} from './syncEngine';

// ============================================================
// TYPES
// ============================================================

export interface OfflineStatus {
    isOffline: boolean;
    isSyncing: boolean;
    pendingActions: number;
    conflicts: number;
    lastSyncedAt: string | null;
}

export interface ApiResponse<T> {
    data: T;
    fromCache: boolean;
    provisional: boolean;
    error?: string;
}

// ============================================================
// STATUS HELPERS
// ============================================================

/**
 * Get current offline status
 */
export async function getOfflineStatus(): Promise<OfflineStatus> {
    const state = getConnectivityState();
    const syncMeta = await offlineDb.syncMetadata.get('main');

    return {
        isOffline: state === 'offline',
        isSyncing: state === 'syncing',
        pendingActions: await getPendingActionsCount(),
        conflicts: await getConflictsCount(),
        lastSyncedAt: syncMeta?.lastFullSync || null
    };
}

/**
 * Get all pending conflicts for UI display
 */
export async function getOfflineConflicts(): Promise<PendingAction[]> {
    return getConflicts();
}

/**
 * Dismiss a conflict after user review
 */
export async function dismissOfflineConflict(actionId: string): Promise<void> {
    return dismissConflict(actionId);
}

/**
 * Manually trigger a sync
 */
export async function syncNow(): Promise<boolean> {
    return triggerSync();
}

// ============================================================
// BED API (READ-ONLY CACHE + OFFLINE UPDATES)
// ============================================================

const HOSPITAL_API_BASE = 'http://localhost:5000/api/hospital';

function getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

/**
 * Fetch beds - uses cache when offline
 */
export async function fetchBeds(): Promise<ApiResponse<OfflineBed[]>> {
    const isOnline = navigator.onLine;

    if (isOnline) {
        try {
            const response = await fetch(`${HOSPITAL_API_BASE}/beds`, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const beds = await response.json();
                const timestamp = getTimestamp();

                // Cache the data
                await offlineDb.beds.clear();
                await offlineDb.beds.bulkPut(
                    beds.map((bed: any) => ({
                        ...bed,
                        lastSyncedAt: timestamp
                    }))
                );

                return { data: beds, fromCache: false, provisional: false };
            }

            // API failed, try cache
            const cachedBeds = await getCachedBeds();
            return {
                data: cachedBeds,
                fromCache: true,
                provisional: false,
                error: 'API request failed, using cached data'
            };

        } catch (error) {
            // Network error, use cache
            const cachedBeds = await getCachedBeds();
            return {
                data: cachedBeds,
                fromCache: true,
                provisional: false,
                error: 'Network error, using cached data'
            };
        }
    }

    // Offline: use cache
    const cachedBeds = await getCachedBeds();
    return { data: cachedBeds, fromCache: true, provisional: false };
}

/**
 * Occupy a bed - queues action when offline
 */
export async function occupyBed(
    bedTypeId: string,
    bedNumber?: number
): Promise<ApiResponse<any>> {
    const isOnline = navigator.onLine;

    if (isOnline) {
        try {
            const response = await fetch(`${HOSPITAL_API_BASE}/beds/${bedTypeId}`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({ action: 'occupy', bedNumber })
            });

            if (response.ok) {
                const data = await response.json();

                // Update cache
                await offlineDb.beds.put({
                    ...data,
                    lastSyncedAt: getTimestamp()
                });

                return { data, fromCache: false, provisional: false };
            }

            const error = await response.json().catch(() => ({ message: 'Unknown error' }));
            return {
                data: null,
                fromCache: false,
                provisional: false,
                error: error.message
            };

        } catch (error) {
            // Fallback to offline mode
            await occupyBedOffline(bedTypeId, bedNumber);
            const beds = await getCachedBeds();
            return {
                data: beds.find(b => b.id === bedTypeId),
                fromCache: true,
                provisional: true,
                error: '⚠️ PROVISIONAL: Bed occupied offline, pending sync'
            };
        }
    }

    // Offline: create provisional action
    await occupyBedOffline(bedTypeId, bedNumber);
    const beds = await getCachedBeds();
    return {
        data: beds.find(b => b.id === bedTypeId),
        fromCache: true,
        provisional: true
    };
}

/**
 * Release a bed - queues action when offline
 */
export async function releaseBed(
    bedTypeId: string,
    bedNumber?: number
): Promise<ApiResponse<any>> {
    const isOnline = navigator.onLine;

    if (isOnline) {
        try {
            const response = await fetch(`${HOSPITAL_API_BASE}/beds/${bedTypeId}`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({ action: 'release', bedNumber })
            });

            if (response.ok) {
                const data = await response.json();
                await offlineDb.beds.put({
                    ...data,
                    lastSyncedAt: getTimestamp()
                });
                return { data, fromCache: false, provisional: false };
            }

            const error = await response.json().catch(() => ({ message: 'Unknown error' }));
            return { data: null, fromCache: false, provisional: false, error: error.message };

        } catch {
            // Queue offline action
            const bed = await offlineDb.beds.get(bedTypeId);
            if (bed) {
                bed.occupied = Math.max(0, bed.occupied - 1);
                bed.available += 1;
                bed.lastSyncedAt = getTimestamp();
                await offlineDb.beds.put(bed);
                await addPendingAction('BED_RELEASE', { bedTypeId, bedNumber });
            }
            return {
                data: bed,
                fromCache: true,
                provisional: true,
                error: '⚠️ PROVISIONAL: Bed released offline, pending sync'
            };
        }
    }

    // Offline mode
    const bed = await offlineDb.beds.get(bedTypeId);
    if (bed) {
        bed.occupied = Math.max(0, bed.occupied - 1);
        bed.available += 1;
        bed.lastSyncedAt = getTimestamp();
        await offlineDb.beds.put(bed);
        await addPendingAction('BED_RELEASE', { bedTypeId, bedNumber });
    }
    return { data: bed, fromCache: true, provisional: true };
}

// ============================================================
// OPD QUEUE API
// ============================================================

/**
 * Fetch OPD queue - uses cache when offline
 */
export async function fetchOpdQueue(date?: string): Promise<ApiResponse<OfflineOpdEntry[]>> {
    const isOnline = navigator.onLine;
    const queryDate = date || new Date().toISOString().split('T')[0];

    if (isOnline) {
        try {
            const response = await fetch(`${HOSPITAL_API_BASE}/opd/queue?date=${queryDate}`, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const queue = await response.json();
                const timestamp = getTimestamp();

                // Cache the data (preserve offline-created entries)
                const offlineEntries = await offlineDb.opdQueue
                    .filter(e => e.isOfflineCreated === true)
                    .toArray();

                await offlineDb.opdQueue.clear();
                await offlineDb.opdQueue.bulkPut([
                    ...queue.map((entry: any) => ({
                        ...entry,
                        lastSyncedAt: timestamp,
                        isOfflineCreated: false
                    })),
                    ...offlineEntries
                ]);

                return { data: queue, fromCache: false, provisional: false };
            }

            const cachedQueue = await getCachedOpdQueue();
            return {
                data: cachedQueue,
                fromCache: true,
                provisional: false,
                error: 'API failed, using cache'
            };

        } catch {
            const cachedQueue = await getCachedOpdQueue();
            return { data: cachedQueue, fromCache: true, provisional: false };
        }
    }

    const cachedQueue = await getCachedOpdQueue();
    return { data: cachedQueue, fromCache: true, provisional: false };
}

/**
 * Check in a patient to OPD - creates provisional entry when offline
 */
export async function opdCheckIn(
    data: {
        patientName: string;
        department: string;
        doctorName?: string;
        priority?: 'low' | 'normal' | 'high' | 'critical';
        visitType?: 'OPD' | 'Follow-up';
        estimatedArrivalTime?: string;
        consultationComplexity?: 'low' | 'medium' | 'high';
        isEmergency?: boolean;
        arrivalStatus?: 'arrived' | 'delayed' | 'no-show' | 'on-time' | 'waiting';
    }
): Promise<ApiResponse<OfflineOpdEntry>> {
    const isOnline = navigator.onLine;

    if (isOnline) {
        try {
            const response = await fetch(`${HOSPITAL_API_BASE}/opd/check-in`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const entry = await response.json();

                await offlineDb.opdQueue.put({
                    ...entry,
                    lastSyncedAt: getTimestamp(),
                    isOfflineCreated: false
                });

                return { data: entry, fromCache: false, provisional: false };
            }

            const error = await response.json().catch(() => ({ message: 'Unknown error' }));
            return { data: null as any, fromCache: false, provisional: false, error: error.message };

        } catch {
            // Create offline entry
            const entry = await createOfflineOpdCheckIn({
                ...data,
                patientName: data.patientName,
                department: data.department,
                doctorName: data.doctorName || '',
                visitType: data.visitType || 'OPD',
                priority: data.priority || 'normal',
                status: 'checked-in',
                queueNumber: 0, // Will be set by createOfflineOpdCheckIn
                checkInTime: getTimestamp(),
                estimatedArrivalTime: data.estimatedArrivalTime,
                consultationComplexity: data.consultationComplexity || 'medium',
                isEmergency: data.isEmergency || false,
                arrivalStatus: data.arrivalStatus || 'waiting'
            });

            return {
                data: entry,
                fromCache: true,
                provisional: true,
                error: '⚠️ PROVISIONAL: Check-in created offline, pending sync'
            };
        }
    }

    // Offline mode
    const entry = await createOfflineOpdCheckIn({
        patientName: data.patientName,
        department: data.department,
        doctorName: data.doctorName || '',
        visitType: data.visitType || 'OPD',
        priority: data.priority || 'normal',
        status: 'checked-in',
        queueNumber: 0,
        checkInTime: getTimestamp(),
        estimatedArrivalTime: data.estimatedArrivalTime,
        consultationComplexity: data.consultationComplexity || 'medium',
        isEmergency: data.isEmergency || false,
        arrivalStatus: data.arrivalStatus || 'waiting'
    });

    return { data: entry, fromCache: true, provisional: true };
}

/**
 * Update OPD status - queues action when offline
 */
export async function updateOpdStatus(
    checkInId: string,
    status: OfflineOpdEntry['status']
): Promise<ApiResponse<any>> {
    const isOnline = navigator.onLine;

    if (isOnline) {
        try {
            const response = await fetch(`${HOSPITAL_API_BASE}/opd/queue/${checkInId}`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                const data = await response.json();
                await offlineDb.opdQueue.put({
                    ...data,
                    lastSyncedAt: getTimestamp(),
                    isOfflineCreated: false
                });
                return { data, fromCache: false, provisional: false };
            }

            const error = await response.json().catch(() => ({ message: 'Unknown error' }));
            return { data: null, fromCache: false, provisional: false, error: error.message };

        } catch {
            await updateOfflineOpdStatus(checkInId, status);
            const entry = await offlineDb.opdQueue.get(checkInId);
            return {
                data: entry,
                fromCache: true,
                provisional: true,
                error: '⚠️ PROVISIONAL: Status updated offline'
            };
        }
    }

    await updateOfflineOpdStatus(checkInId, status);
    const entry = await offlineDb.opdQueue.get(checkInId);
    return { data: entry, fromCache: true, provisional: true };
}

// ============================================================
// ADMISSIONS API
// ============================================================

/**
 * Fetch admissions - uses cache when offline
 */
export async function fetchAdmissions(): Promise<ApiResponse<OfflineAdmission[]>> {
    const isOnline = navigator.onLine;

    if (isOnline) {
        try {
            const response = await fetch(`${HOSPITAL_API_BASE}/admissions`, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const admissions = await response.json();
                const timestamp = getTimestamp();

                const offlineAdmissions = await offlineDb.admissions
                    .filter(a => a.isOfflineCreated === true)
                    .toArray();

                await offlineDb.admissions.clear();
                await offlineDb.admissions.bulkPut([
                    ...admissions.map((a: any) => ({
                        ...a,
                        lastSyncedAt: timestamp,
                        isOfflineCreated: false
                    })),
                    ...offlineAdmissions
                ]);

                return { data: admissions, fromCache: false, provisional: false };
            }

            const cached = await getCachedAdmissions();
            return { data: cached, fromCache: true, provisional: false };

        } catch {
            const cached = await getCachedAdmissions();
            return { data: cached, fromCache: true, provisional: false };
        }
    }

    const cached = await getCachedAdmissions();
    return { data: cached, fromCache: true, provisional: false };
}

/**
 * Create an admission - creates provisional entry when offline
 */
export async function createAdmission(
    data: {
        patientName: string;
        age?: number;
        department: string;
        bedType: string;
        severity?: 'low' | 'medium' | 'high' | 'critical';
        oxygenRequired?: boolean;
        isolationRequired?: boolean;
    }
): Promise<ApiResponse<OfflineAdmission>> {
    const isOnline = navigator.onLine;

    if (isOnline) {
        try {
            const response = await fetch(`${HOSPITAL_API_BASE}/admissions`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const admission = await response.json();

                // Fetch full admission data
                const fullResponse = await fetch(`${HOSPITAL_API_BASE}/admissions`, {
                    headers: getAuthHeaders()
                });
                if (fullResponse.ok) {
                    const admissions = await fullResponse.json();
                    const fullAdmission = admissions.find((a: any) => a.id === admission.id);
                    if (fullAdmission) {
                        await offlineDb.admissions.put({
                            ...fullAdmission,
                            lastSyncedAt: getTimestamp(),
                            isOfflineCreated: false
                        });
                        return { data: fullAdmission, fromCache: false, provisional: false };
                    }
                }

                return { data: admission, fromCache: false, provisional: false };
            }

            const error = await response.json().catch(() => ({ message: 'Unknown error' }));
            return { data: null as any, fromCache: false, provisional: false, error: error.message };

        } catch {
            const admission = await createOfflineAdmission({
                patientName: data.patientName,
                age: data.age,
                department: data.department,
                bedType: data.bedType,
                severity: data.severity || 'medium',
                oxygenRequired: data.oxygenRequired || false,
                isolationRequired: data.isolationRequired || false,
                status: 'pending'
            });

            return {
                data: admission,
                fromCache: true,
                provisional: true,
                error: '⚠️ PROVISIONAL: Admission created offline, pending backend confirmation'
            };
        }
    }

    // Offline mode
    const admission = await createOfflineAdmission({
        patientName: data.patientName,
        age: data.age,
        department: data.department,
        bedType: data.bedType,
        severity: data.severity || 'medium',
        oxygenRequired: data.oxygenRequired || false,
        isolationRequired: data.isolationRequired || false,
        status: 'pending'
    });

    return { data: admission, fromCache: true, provisional: true };
}

/**
 * Admit a patient (confirm allocation) - queues action when offline
 */
export async function admitPatient(admissionId: string): Promise<ApiResponse<any>> {
    const isOnline = navigator.onLine;

    if (isOnline) {
        try {
            const response = await fetch(`${HOSPITAL_API_BASE}/admissions/${admissionId}/admit`, {
                method: 'POST',
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();

                // Update cache
                const admission = await offlineDb.admissions.get(admissionId);
                if (admission) {
                    admission.status = 'admitted';
                    admission.admittedAt = getTimestamp();
                    admission.lastSyncedAt = getTimestamp();
                    await offlineDb.admissions.put(admission);
                }

                return { data, fromCache: false, provisional: false };
            }

            const error = await response.json().catch(() => ({ message: 'Unknown error' }));
            return { data: null, fromCache: false, provisional: false, error: error.message };

        } catch {
            // Queue offline action
            const admission = await offlineDb.admissions.get(admissionId);
            if (admission) {
                admission.status = 'admitted';
                admission.admittedAt = getTimestamp();
                admission.allocationNote = '⚠️ PROVISIONAL: Admitted offline, pending backend confirmation';
                admission.lastSyncedAt = getTimestamp();
                await offlineDb.admissions.put(admission);
                await addPendingAction('ADMISSION_ADMIT', { admissionId });
            }

            return {
                data: admission,
                fromCache: true,
                provisional: true,
                error: '⚠️ PROVISIONAL: Admission confirmed offline'
            };
        }
    }

    // Offline mode
    const admission = await offlineDb.admissions.get(admissionId);
    if (admission) {
        admission.status = 'admitted';
        admission.admittedAt = getTimestamp();
        admission.allocationNote = '⚠️ PROVISIONAL: Admitted offline, pending backend confirmation';
        admission.lastSyncedAt = getTimestamp();
        await offlineDb.admissions.put(admission);
        await addPendingAction('ADMISSION_ADMIT', { admissionId });
    }

    return { data: admission, fromCache: true, provisional: true };
}

/**
 * Discharge a patient - queues action when offline
 */
export async function dischargePatient(admissionId: string): Promise<ApiResponse<any>> {
    const isOnline = navigator.onLine;

    if (isOnline) {
        try {
            const response = await fetch(`${HOSPITAL_API_BASE}/admissions/${admissionId}/discharge`, {
                method: 'POST',
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();

                const admission = await offlineDb.admissions.get(admissionId);
                if (admission) {
                    admission.status = 'discharged';
                    admission.dischargedAt = getTimestamp();
                    admission.lastSyncedAt = getTimestamp();
                    await offlineDb.admissions.put(admission);
                }

                return { data, fromCache: false, provisional: false };
            }

            const error = await response.json().catch(() => ({ message: 'Unknown error' }));
            return { data: null, fromCache: false, provisional: false, error: error.message };

        } catch {
            const admission = await offlineDb.admissions.get(admissionId);
            if (admission) {
                admission.status = 'discharged';
                admission.dischargedAt = getTimestamp();
                admission.allocationNote = '⚠️ PROVISIONAL: Discharged offline';
                admission.lastSyncedAt = getTimestamp();
                await offlineDb.admissions.put(admission);
                await addPendingAction('ADMISSION_DISCHARGE', { admissionId });
            }

            return { data: admission, fromCache: true, provisional: true };
        }
    }

    const admission = await offlineDb.admissions.get(admissionId);
    if (admission) {
        admission.status = 'discharged';
        admission.dischargedAt = getTimestamp();
        admission.lastSyncedAt = getTimestamp();
        await offlineDb.admissions.put(admission);
        await addPendingAction('ADMISSION_DISCHARGE', { admissionId });
    }

    return { data: admission, fromCache: true, provisional: true };
}

// ============================================================
// INVENTORY API
// ============================================================

/**
 * Fetch inventory - uses cache when offline
 */
export async function fetchInventory(): Promise<ApiResponse<OfflineInventoryItem[]>> {
    const isOnline = navigator.onLine;

    if (isOnline) {
        try {
            const response = await fetch(`${HOSPITAL_API_BASE}/inventory`, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const items = await response.json();
                const timestamp = getTimestamp();

                await offlineDb.inventoryItems.clear();
                await offlineDb.inventoryItems.bulkPut(
                    items.map((item: any) => ({
                        ...item,
                        lastSyncedAt: timestamp
                    }))
                );

                return { data: items, fromCache: false, provisional: false };
            }

            const cached = await getCachedInventory();
            return { data: cached, fromCache: true, provisional: false };

        } catch {
            const cached = await getCachedInventory();
            return { data: cached, fromCache: true, provisional: false };
        }
    }

    const cached = await getCachedInventory();
    return { data: cached, fromCache: true, provisional: false };
}

/**
 * Consume inventory - logs action when offline
 */
export async function consumeInventory(
    itemId: string,
    qty: number,
    reason: string,
    linkedAdmissionId?: string
): Promise<ApiResponse<any>> {
    const isOnline = navigator.onLine;

    if (isOnline) {
        try {
            const response = await fetch(`${HOSPITAL_API_BASE}/inventory/${itemId}/consume`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ qty, reason, linkedAdmissionId })
            });

            if (response.ok) {
                const data = await response.json();

                // Update cache
                const item = await offlineDb.inventoryItems.get(itemId);
                if (item) {
                    item.currentStock = data.item.currentStock;
                    item.lastSyncedAt = getTimestamp();
                    await offlineDb.inventoryItems.put(item);
                }

                return { data, fromCache: false, provisional: false };
            }

            const error = await response.json().catch(() => ({ message: 'Unknown error' }));
            return { data: null, fromCache: false, provisional: false, error: error.message };

        } catch {
            await logInventoryConsumptionOffline(itemId, qty, reason, linkedAdmissionId);
            const item = await offlineDb.inventoryItems.get(itemId);

            return {
                data: { item },
                fromCache: true,
                provisional: true,
                error: '⚠️ PROVISIONAL: Consumption logged offline'
            };
        }
    }

    await logInventoryConsumptionOffline(itemId, qty, reason, linkedAdmissionId);
    const item = await offlineDb.inventoryItems.get(itemId);

    return { data: { item }, fromCache: true, provisional: true };
}

// ============================================================
// UTILITY EXPORTS
// ============================================================

export {
    getConnectivityState,
    triggerSync,
    getCachedBeds,
    getCachedOpdQueue,
    getCachedAdmissions,
    getCachedInventory,
};

export default {
    // Status
    getOfflineStatus,
    getOfflineConflicts,
    dismissOfflineConflict,
    syncNow,

    // Beds
    fetchBeds,
    occupyBed,
    releaseBed,

    // OPD Queue
    fetchOpdQueue,
    opdCheckIn,
    updateOpdStatus,

    // Admissions
    fetchAdmissions,
    createAdmission,
    admitPatient,
    dischargePatient,

    // Inventory
    fetchInventory,
    consumeInventory,
};
