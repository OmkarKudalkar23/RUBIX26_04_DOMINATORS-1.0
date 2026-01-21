/**
 * Offline Status Indicator Components
 * 
 * UI elements to show:
 * - Offline badge in header
 * - "Syncing…" status
 * - Conflict alert modal
 * - Tooltip: "Offline actions are provisional"
 * 
 * DESIGN PHILOSOPHY:
 * "Offline mode ensures continuity of care during network outages
 *  while preserving backend authority."
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    WifiOff,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    CloudOff,
    Cloud,
    X,
    Info
} from 'lucide-react';
import { useOfflineStatus } from '../hooks/useOfflineStatus';

// ============================================================
// OFFLINE BADGE
// ============================================================

interface OfflineBadgeProps {
    className?: string;
    showPendingCount?: boolean;
}

/**
 * Badge that appears when the app is offline
 * Shows sync status and pending action count
 */
export const OfflineBadge: React.FC<OfflineBadgeProps> = ({
    className = '',
    showPendingCount = true
}) => {
    const { isOffline, isSyncing, pendingCount, conflictCount, syncNow } = useOfflineStatus();

    // Don't show anything if online with no pending actions
    if (!isOffline && !isSyncing && pendingCount === 0 && conflictCount === 0) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex items-center gap-2 ${className}`}
            >
                {/* Offline Indicator */}
                {isOffline && (
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                       bg-gradient-to-r from-amber-500/20 to-orange-500/20 
                       text-amber-300 border border-amber-500/30
                       shadow-lg shadow-amber-500/10"
                        title="You are offline. Changes will sync when connection is restored."
                    >
                        <WifiOff className="w-3.5 h-3.5" />
                        <span>Offline Mode</span>
                    </motion.div>
                )}

                {/* Syncing Indicator */}
                {isSyncing && (
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                       bg-gradient-to-r from-blue-500/20 to-cyan-500/20 
                       text-blue-300 border border-blue-500/30
                       shadow-lg shadow-blue-500/10"
                    >
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Syncing...</span>
                    </motion.div>
                )}

                {/* Pending Actions Badge */}
                {showPendingCount && pendingCount > 0 && !isSyncing && (
                    <motion.button
                        onClick={syncNow}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                       bg-gradient-to-r from-purple-500/20 to-pink-500/20 
                       text-purple-300 border border-purple-500/30
                       hover:from-purple-500/30 hover:to-pink-500/30
                       shadow-lg shadow-purple-500/10 cursor-pointer
                       transition-all duration-200"
                        title={`${pendingCount} pending action(s). Click to sync.`}
                    >
                        <CloudOff className="w-3.5 h-3.5" />
                        <span>{pendingCount} Pending</span>
                    </motion.button>
                )}

                {/* Conflict Alert Badge */}
                {conflictCount > 0 && (
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                       bg-gradient-to-r from-red-500/20 to-rose-500/20 
                       text-red-300 border border-red-500/30
                       shadow-lg shadow-red-500/10"
                        title="There are sync conflicts that require your attention!"
                    >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{conflictCount} Conflict{conflictCount > 1 ? 's' : ''}</span>
                    </motion.div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

// ============================================================
// PROVISIONAL TOOLTIP
// ============================================================

interface ProvisionalBadgeProps {
    message?: string;
    className?: string;
}

/**
 * Badge to show that an action/data is provisional (created offline)
 */
export const ProvisionalBadge: React.FC<ProvisionalBadgeProps> = ({
    message = "Offline - Pending Sync",
    className = ''
}) => {
    return (
        <div
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs
                  bg-amber-500/10 text-amber-400 border border-amber-500/20 ${className}`}
            title="This action was taken offline and is provisional. It will be verified when connection is restored."
        >
            <CloudOff className="w-3 h-3" />
            <span>{message}</span>
        </div>
    );
};

// ============================================================
// CONFLICT MODAL
// ============================================================

interface ConflictModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Modal to display and manage sync conflicts
 * Conflicts require HUMAN review - never silently override
 */
export const ConflictModal: React.FC<ConflictModalProps> = ({ isOpen, onClose }) => {
    const { conflicts, dismissConflict, syncNow } = useOfflineStatus();

    if (!isOpen) return null;

    const getConflictIcon = (type: string) => {
        switch (type) {
            case 'BED_OCCUPY':
            case 'BED_RELEASE':
                return '🛏️';
            case 'ADMISSION_CREATE':
            case 'ADMISSION_ADMIT':
            case 'ADMISSION_DISCHARGE':
                return '🏥';
            case 'OPD_CHECKIN':
            case 'OPD_UPDATE_STATUS':
                return '📋';
            case 'INVENTORY_CONSUME':
                return '📦';
            default:
                return '⚠️';
        }
    };

    const formatActionType = (type: string) => {
        return type.split('_').map(word =>
            word.charAt(0) + word.slice(1).toLowerCase()
        ).join(' ');
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl 
                     border border-gray-700 shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-500/20">
                                <AlertTriangle className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">Sync Conflicts</h2>
                                <p className="text-sm text-gray-400">
                                    These actions require your review
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 overflow-y-auto max-h-[60vh]">
                        {conflicts.length === 0 ? (
                            <div className="text-center py-8">
                                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                                <p className="text-gray-300">No conflicts to resolve</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {/* Warning Banner */}
                                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4">
                                    <div className="flex gap-2">
                                        <Info className="w-5 h-5 text-amber-400 flex-shrink-0" />
                                        <div className="text-sm text-amber-200">
                                            <strong>Important:</strong> These conflicts occurred because data changed while you were offline.
                                            Please review each conflict carefully. Dismissing a conflict means accepting the backend's decision.
                                        </div>
                                    </div>
                                </div>

                                {conflicts.map((conflict) => (
                                    <motion.div
                                        key={conflict.actionId}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="p-4 rounded-lg bg-gray-800/50 border border-gray-700"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xl">{getConflictIcon(conflict.type)}</span>
                                                    <span className="font-medium text-white">
                                                        {formatActionType(conflict.type)}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(conflict.createdAt).toLocaleString()}
                                                    </span>
                                                </div>

                                                <p className="text-sm text-gray-300 mb-2">
                                                    {conflict.conflictDetails || 'Conflict detected during sync'}
                                                </p>

                                                <div className="text-xs text-gray-500 font-mono bg-gray-900/50 p-2 rounded">
                                                    {JSON.stringify(conflict.payload, null, 2).substring(0, 200)}
                                                    {JSON.stringify(conflict.payload).length > 200 && '...'}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => dismissConflict(conflict.actionId)}
                                                className="px-3 py-1.5 rounded text-xs font-medium
                                   bg-gray-700 text-gray-300 hover:bg-gray-600
                                   transition-colors flex-shrink-0"
                                            >
                                                Dismiss
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between p-4 border-t border-gray-700 bg-gray-900/50">
                        <p className="text-xs text-gray-500">
                            Dismissing a conflict accepts the backend's decision
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={syncNow}
                                className="px-4 py-2 rounded-lg text-sm font-medium
                           bg-blue-600 text-white hover:bg-blue-500
                           transition-colors flex items-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Retry Sync
                            </button>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg text-sm font-medium
                           bg-gray-700 text-gray-300 hover:bg-gray-600
                           transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ============================================================
// SYNC STATUS BANNER
// ============================================================

interface SyncStatusBannerProps {
    className?: string;
}

/**
 * Full-width banner showing sync status
 * Displays prominently when offline or syncing
 */
export const SyncStatusBanner: React.FC<SyncStatusBannerProps> = ({ className = '' }) => {
    const { isOffline, isSyncing, pendingCount, conflictCount, syncNow } = useOfflineStatus();
    const [showConflicts, setShowConflicts] = React.useState(false);

    // Don't show if everything is normal
    if (!isOffline && !isSyncing && pendingCount === 0 && conflictCount === 0) {
        return null;
    }

    return (
        <>
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={`overflow-hidden ${className}`}
            >
                <div className={`px-4 py-2 flex items-center justify-between text-sm
          ${isOffline
                        ? 'bg-gradient-to-r from-amber-900/50 to-orange-900/50 border-b border-amber-700/50'
                        : isSyncing
                            ? 'bg-gradient-to-r from-blue-900/50 to-cyan-900/50 border-b border-blue-700/50'
                            : conflictCount > 0
                                ? 'bg-gradient-to-r from-red-900/50 to-rose-900/50 border-b border-red-700/50'
                                : 'bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-b border-purple-700/50'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        {isOffline ? (
                            <>
                                <WifiOff className="w-4 h-4 text-amber-400" />
                                <span className="text-amber-200">
                                    <strong>Offline Mode:</strong> Changes are saved locally and will sync when connection is restored.
                                </span>
                            </>
                        ) : isSyncing ? (
                            <>
                                <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                                <span className="text-blue-200">
                                    <strong>Syncing:</strong> Uploading {pendingCount} pending action(s) to server...
                                </span>
                            </>
                        ) : conflictCount > 0 ? (
                            <>
                                <AlertTriangle className="w-4 h-4 text-red-400" />
                                <span className="text-red-200">
                                    <strong>Attention Required:</strong> {conflictCount} conflict(s) need your review.
                                </span>
                            </>
                        ) : (
                            <>
                                <Cloud className="w-4 h-4 text-purple-400" />
                                <span className="text-purple-200">
                                    <strong>{pendingCount} Pending:</strong> Actions waiting to sync.
                                </span>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {conflictCount > 0 && (
                            <button
                                onClick={() => setShowConflicts(true)}
                                className="px-3 py-1 rounded text-xs font-medium
                           bg-red-600/30 text-red-200 hover:bg-red-600/50
                           border border-red-500/30 transition-colors"
                            >
                                Review Conflicts
                            </button>
                        )}
                        {!isSyncing && !isOffline && pendingCount > 0 && (
                            <button
                                onClick={syncNow}
                                className="px-3 py-1 rounded text-xs font-medium
                           bg-blue-600/30 text-blue-200 hover:bg-blue-600/50
                           border border-blue-500/30 transition-colors
                           flex items-center gap-1"
                            >
                                <RefreshCw className="w-3 h-3" />
                                Sync Now
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>

            <ConflictModal isOpen={showConflicts} onClose={() => setShowConflicts(false)} />
        </>
    );
};

// ============================================================
// OFFLINE INDICATOR DOT
// ============================================================

/**
 * Small dot indicator for space-constrained areas
 */
export const OfflineIndicatorDot: React.FC<{ className?: string }> = ({ className = '' }) => {
    const { isOffline, isSyncing, conflictCount } = useOfflineStatus();

    if (!isOffline && !isSyncing && conflictCount === 0) return null;

    return (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`relative ${className}`}
        >
            <div className={`w-2.5 h-2.5 rounded-full 
        ${isOffline
                    ? 'bg-amber-500'
                    : isSyncing
                        ? 'bg-blue-500 animate-pulse'
                        : 'bg-red-500 animate-pulse'
                }`}
            />
            {(isSyncing || conflictCount > 0) && (
                <div className={`absolute inset-0 w-2.5 h-2.5 rounded-full animate-ping
          ${isSyncing ? 'bg-blue-500' : 'bg-red-500'}`}
                />
            )}
        </motion.div>
    );
};

export default {
    OfflineBadge,
    ProvisionalBadge,
    ConflictModal,
    SyncStatusBanner,
    OfflineIndicatorDot
};
