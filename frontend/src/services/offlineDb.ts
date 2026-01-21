/**
 * Offline-First Database Layer using Dexie.js (IndexedDB wrapper)
 * 
 * ARCHITECTURE PHILOSOPHY:
 * ========================
 * "Offline mode ensures continuity of care during network outages 
 *  while preserving backend authority."
 * 
 * This is a HEALTHCARE system - we prioritize:
 * - Patient safety over automation
 * - Human review over silent fixes
 * - Backend revalidation for all offline actions
 * 
 * WHAT WORKS OFFLINE (hospital-local only):
 * ✅ Rule-Based Admission Workflow
 * ✅ OPD Queue (local hospital queue only)
 * ✅ Live Bed Availability (last known + local updates)
 * ✅ Inventory usage logging (temporary)
 * 
 * WHAT STAYS ONLINE-ONLY:
 * ❌ Inter-Hospital Capacity Sharing
 * ❌ City Dashboard
 * ❌ Cross-hospital analytics
 * 
 * SECURITY CONSTRAINTS:
 * - No sensitive medical records stored offline
 * - No cross-hospital data offline
 * - Offline data is hospital-specific
 * - Clear audit trail on sync
 */

import Dexie, { Table } from 'dexie';

// ============================================================
// OFFLINE DATA TYPES
// ============================================================

/**
 * Cached bed data (read-only cache from backend)
 * Used to show last-known bed availability during offline mode
 */
export interface OfflineBed {
    id: string;                    // Backend bed ID
    bedId?: string;                // Alternative ID format (e.g., "ICU-12")
    type: string;                  // Ward type: ICU, General, Private, Emergency
    total: number;
    occupied: number;
    available: number;
    hasVentilator?: boolean;
    hasOxygen?: boolean;
    isIsolation?: boolean;
    beds?: Array<{
        number: number;
        status: 'available' | 'occupied' | 'maintenance';
        hasVentilator?: boolean;
        hasOxygen?: boolean;
        isIsolation?: boolean;
    }>;
    lastSyncedAt: string;          // ISO timestamp of last sync
}

/**
 * Admission rules (static configuration)
 * These rarely change and can be safely cached
 */
export interface OfflineAdmissionRule {
    id: string;
    severity: string;
    preferredBedTypes: string[];
    ventilatorRequired?: boolean;
    isolationRequired?: boolean;
    oxygenRequired?: boolean;
    description: string;
    lastSyncedAt: string;
}

/**
 * OPD Queue entries (local state)
 * Tracks patients waiting in queue at this hospital
 */
export interface OfflineOpdEntry {
    id: string;                    // Backend ID or temporary offline ID
    patientName: string;
    department: string;
    doctorName?: string;
    visitType: 'OPD' | 'Follow-up';
    status: 'checked-in' | 'in-triage' | 'in-consult' | 'completed' | 'no-show';
    priority: 'low' | 'normal' | 'high' | 'critical';
    priorityScore?: number;
    queueNumber: number;
    checkInTime: string;
    estimatedArrivalTime?: string; // When patient is expected to arrive
    consultationComplexity?: 'low' | 'medium' | 'high'; // Complexity of consultation
    isEmergency?: boolean;          // Emergency flag
    arrivalStatus?: 'arrived' | 'delayed' | 'no-show' | 'on-time' | 'waiting'; // Arrival status
    lastSyncedAt: string;
    isOfflineCreated?: boolean;    // Flag for entries created while offline
}

/**
 * Admission records for the admission workflow
 */
export interface OfflineAdmission {
    id: string;
    patientName: string;
    age?: number;
    department: string;
    bedType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    oxygenRequired: boolean;
    isolationRequired: boolean;
    status: 'pending' | 'allocated' | 'admitted' | 'discharged' | 'cancelled';
    allocatedBedTypeId?: string;
    allocationNote?: string;
    admittedAt?: string;
    dischargedAt?: string;
    createdAt: string;
    lastSyncedAt: string;
    isOfflineCreated?: boolean;
}

/**
 * Inventory items for tracking stock
 */
export interface OfflineInventoryItem {
    id: string;
    name: string;
    category: string;
    unit: string;
    currentStock: number;
    minStock: number;
    reorderQty: number;
    lastSyncedAt: string;
}

/**
 * Inventory usage logs (temporary offline logs)
 */
export interface OfflineInventoryLog {
    id: string;                    // Temporary offline ID
    itemId: string;
    itemName: string;
    type: 'consume' | 'restock' | 'adjust';
    qty: number;
    reason: string;
    linkedAdmissionId?: string;
    occurredAt: string;
    lastSyncedAt: string;
    isOfflineCreated: boolean;
}

/**
 * Pending actions queue (SYNC QUEUE)
 * All offline actions are stored here for later sync
 * 
 * CRITICAL: These are PROVISIONAL until backend confirms
 */
export interface PendingAction {
    id?: number;                   // Auto-increment ID for ordering
    actionId: string;              // UUID for tracking
    type:
    | 'ADMISSION_CREATE'
    | 'ADMISSION_ALLOCATE'
    | 'ADMISSION_ADMIT'
    | 'ADMISSION_DISCHARGE'
    | 'OPD_CHECKIN'
    | 'OPD_UPDATE_STATUS'
    | 'OPD_UPDATE_PRIORITY'
    | 'BED_OCCUPY'
    | 'BED_RELEASE'
    | 'INVENTORY_CONSUME';
    payload: Record<string, any>;
    createdAt: string;             // ISO timestamp
    syncStatus: 'pending' | 'syncing' | 'synced' | 'conflict' | 'failed';
    syncAttempts: number;
    lastSyncAttempt?: string;
    conflictDetails?: string;      // Human-readable conflict description
    backendResponse?: any;         // Backend's response after sync attempt
}

/**
 * Sync metadata for tracking overall sync state
 */
export interface SyncMetadata {
    id: string;                    // Always 'main'
    lastFullSync: string;
    lastPartialSync: string;
    pendingCount: number;
    conflictCount: number;
    hospitalId?: string;
}

// ============================================================
// DEXIE DATABASE DEFINITION
// ============================================================

/**
 * HospitalOfflineDB - The main IndexedDB database
 * 
 * Schema versioning is included for future migrations.
 * Each table has appropriate indexes for efficient querying.
 */
export class HospitalOfflineDB extends Dexie {
    // Table declarations for TypeScript
    beds!: Table<OfflineBed, string>;
    admissionRules!: Table<OfflineAdmissionRule, string>;
    opdQueue!: Table<OfflineOpdEntry, string>;
    admissions!: Table<OfflineAdmission, string>;
    inventoryItems!: Table<OfflineInventoryItem, string>;
    inventoryLogs!: Table<OfflineInventoryLog, string>;
    pendingActions!: Table<PendingAction, number>;
    syncMetadata!: Table<SyncMetadata, string>;

    constructor() {
        super('HospitalOfflineDB');

        // Schema version 1 - Initial schema
        this.version(1).stores({
            // Beds: indexed by id, searchable by type
            beds: 'id, type, lastSyncedAt',

            // Admission rules: indexed by id and severity
            admissionRules: 'id, severity, lastSyncedAt',

            // OPD Queue: indexed by id, searchable by status, priority, queueNumber
            opdQueue: 'id, status, priority, queueNumber, checkInTime, lastSyncedAt',

            // Admissions: indexed by id, searchable by status
            admissions: 'id, status, createdAt, lastSyncedAt',

            // Inventory items: indexed by id, searchable by category
            inventoryItems: 'id, category, name, lastSyncedAt',

            // Inventory logs: indexed by id, searchable by itemId and type
            inventoryLogs: 'id, itemId, type, occurredAt, lastSyncedAt',

            // Pending actions: auto-increment id for FIFO ordering
            // Indexed by syncStatus for efficient querying
            pendingActions: '++id, actionId, type, syncStatus, createdAt',

            // Sync metadata: single record with id='main'
            syncMetadata: 'id'
        });
    }
}

// Singleton instance
export const offlineDb = new HospitalOfflineDB();

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Generate a unique ID for offline-created records
 * Prefixed with 'offline_' for easy identification
 */
export function generateOfflineId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get current timestamp in ISO format
 */
export function getTimestamp(): string {
    return new Date().toISOString();
}

/**
 * Check if an ID was created offline
 */
export function isOfflineId(id: string): boolean {
    return id.startsWith('offline_');
}

// ============================================================
// DATABASE OPERATIONS
// ============================================================

/**
 * Clear all cached data (useful for logout or hospital switch)
 */
export async function clearOfflineData(): Promise<void> {
    await Promise.all([
        offlineDb.beds.clear(),
        offlineDb.admissionRules.clear(),
        offlineDb.opdQueue.clear(),
        offlineDb.admissions.clear(),
        offlineDb.inventoryItems.clear(),
        offlineDb.inventoryLogs.clear(),
        // Note: We keep pendingActions to allow sync after re-login
    ]);

    // Update sync metadata
    await offlineDb.syncMetadata.put({
        id: 'main',
        lastFullSync: '',
        lastPartialSync: '',
        pendingCount: await offlineDb.pendingActions.count(),
        conflictCount: await offlineDb.pendingActions.where('syncStatus').equals('conflict').count()
    });
}

/**
 * Get count of pending actions
 */
export async function getPendingActionsCount(): Promise<number> {
    return offlineDb.pendingActions
        .where('syncStatus')
        .anyOf(['pending', 'failed'])
        .count();
}

/**
 * Get count of conflicts requiring resolution
 */
export async function getConflictsCount(): Promise<number> {
    return offlineDb.pendingActions
        .where('syncStatus')
        .equals('conflict')
        .count();
}

/**
 * Add a pending action to the sync queue
 */
export async function addPendingAction(
    type: PendingAction['type'],
    payload: Record<string, any>
): Promise<string> {
    const actionId = generateOfflineId();

    await offlineDb.pendingActions.add({
        actionId,
        type,
        payload,
        createdAt: getTimestamp(),
        syncStatus: 'pending',
        syncAttempts: 0
    });

    return actionId;
}

/**
 * Get all pending actions in FIFO order
 */
export async function getPendingActions(): Promise<PendingAction[]> {
    return offlineDb.pendingActions
        .where('syncStatus')
        .anyOf(['pending', 'failed'])
        .sortBy('id');
}

/**
 * Mark an action as synced
 */
export async function markActionSynced(
    actionId: string,
    backendResponse?: any
): Promise<void> {
    await offlineDb.pendingActions
        .where('actionId')
        .equals(actionId)
        .modify({
            syncStatus: 'synced',
            lastSyncAttempt: getTimestamp(),
            backendResponse
        });
}

/**
 * Mark an action as having a conflict
 * IMPORTANT: Conflicts require human review!
 */
export async function markActionConflict(
    actionId: string,
    conflictDetails: string,
    backendResponse?: any
): Promise<void> {
    await offlineDb.pendingActions
        .where('actionId')
        .equals(actionId)
        .modify({
            syncStatus: 'conflict',
            lastSyncAttempt: getTimestamp(),
            conflictDetails,
            backendResponse
        });
}

/**
 * Mark an action as failed (retriable)
 */
export async function markActionFailed(
    actionId: string,
    error: string
): Promise<void> {
    const action = await offlineDb.pendingActions
        .where('actionId')
        .equals(actionId)
        .first();

    if (action) {
        await offlineDb.pendingActions
            .where('actionId')
            .equals(actionId)
            .modify({
                syncStatus: 'failed',
                lastSyncAttempt: getTimestamp(),
                syncAttempts: (action.syncAttempts || 0) + 1,
                conflictDetails: error
            });
    }
}

/**
 * Get all conflicts for UI display
 */
export async function getConflicts(): Promise<PendingAction[]> {
    return offlineDb.pendingActions
        .where('syncStatus')
        .equals('conflict')
        .toArray();
}

/**
 * Dismiss/acknowledge a conflict (user reviewed it)
 */
export async function dismissConflict(actionId: string): Promise<void> {
    await offlineDb.pendingActions
        .where('actionId')
        .equals(actionId)
        .delete();
}

// ============================================================
// STATIC ADMISSION RULES
// ============================================================

/**
 * Default admission rules based on the backend's admissionRules.js
 * These are cached locally for offline use
 */
export const DEFAULT_ADMISSION_RULES: Omit<OfflineAdmissionRule, 'lastSyncedAt'>[] = [
    {
        id: 'rule_critical',
        severity: 'critical',
        preferredBedTypes: ['ICU', 'Emergency', 'General', 'Private'],
        ventilatorRequired: true,
        description: 'Critical patients: prefer ICU, then Emergency, then General'
    },
    {
        id: 'rule_high_oxygen',
        severity: 'high',
        preferredBedTypes: ['ICU', 'Emergency', 'General', 'Private'],
        oxygenRequired: true,
        description: 'High severity with oxygen: prefer ICU first'
    },
    {
        id: 'rule_high',
        severity: 'high',
        preferredBedTypes: ['Emergency', 'General', 'ICU', 'Private'],
        description: 'High severity without oxygen: prefer Emergency'
    },
    {
        id: 'rule_medium_isolation',
        severity: 'medium',
        preferredBedTypes: ['Private', 'General', 'Emergency', 'ICU'],
        isolationRequired: true,
        description: 'Medium severity with isolation: prefer Private'
    },
    {
        id: 'rule_medium',
        severity: 'medium',
        preferredBedTypes: ['General', 'Private', 'Emergency', 'ICU'],
        description: 'Medium severity: prefer General ward'
    },
    {
        id: 'rule_low_isolation',
        severity: 'low',
        preferredBedTypes: ['Private', 'General', 'Emergency', 'ICU'],
        isolationRequired: true,
        description: 'Low severity with isolation: prefer Private'
    },
    {
        id: 'rule_low',
        severity: 'low',
        preferredBedTypes: ['General', 'Private', 'Emergency', 'ICU'],
        description: 'Low severity: prefer General ward'
    }
];

/**
 * Initialize default admission rules if not present
 */
export async function initializeAdmissionRules(): Promise<void> {
    const count = await offlineDb.admissionRules.count();
    if (count === 0) {
        const timestamp = getTimestamp();
        await offlineDb.admissionRules.bulkAdd(
            DEFAULT_ADMISSION_RULES.map(rule => ({
                ...rule,
                lastSyncedAt: timestamp
            }))
        );
    }
}

/**
 * Get preferred bed types for an admission based on rules
 * This mirrors the backend's allocation logic
 */
export async function getPreferredBedTypes(
    severity: string,
    oxygenRequired: boolean = false,
    isolationRequired: boolean = false
): Promise<string[]> {
    // Find matching rule
    let matchingRule: OfflineAdmissionRule | undefined;

    if (isolationRequired) {
        matchingRule = await offlineDb.admissionRules
            .where('severity')
            .equals(severity)
            .filter(rule => rule.isolationRequired === true)
            .first();
    } else if (oxygenRequired && severity === 'high') {
        matchingRule = await offlineDb.admissionRules
            .where('id')
            .equals('rule_high_oxygen')
            .first();
    }

    if (!matchingRule) {
        matchingRule = await offlineDb.admissionRules
            .where('severity')
            .equals(severity)
            .filter(rule => !rule.isolationRequired && !rule.oxygenRequired)
            .first();
    }

    return matchingRule?.preferredBedTypes || ['General', 'Private', 'Emergency', 'ICU'];
}

export default offlineDb;
