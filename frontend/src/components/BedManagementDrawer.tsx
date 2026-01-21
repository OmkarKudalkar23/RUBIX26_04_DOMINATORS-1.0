import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    BedDouble,
    Clock,
    AlertTriangle,
    CheckCircle,
    Loader2,
    Ban,
    Sparkles,
    UserPlus,
    ArrowRight,
    Shield,
    Wind,
    Droplet
} from 'lucide-react';

// Define the bed slot type matching api.ts
interface BedSlot {
    number: number;
    status: 'available' | 'occupied' | 'reserved' | 'cleaning' | 'discharge_pending' | 'blocked' | 'maintenance';
    patientId?: string;
    admissionId?: string;
    occupiedSince?: string;
    expectedDischargeTime?: string;
    cleaningEta?: string;
    blockedReason?: string;
    notes?: string;
    admissionType?: 'Emergency' | 'OPD' | 'Surgery' | 'Transfer' | '';
    priority?: 'Normal' | 'High' | 'Critical' | '';
    hasVentilator?: boolean;
    hasOxygen?: boolean;
    department?: string;
    isIsolation?: boolean;
}

interface BedManagementDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    bed: BedSlot | null;
    wardType: string;
    wardId: string;
    onAction: (action: string, payload?: Record<string, unknown>) => Promise<void>;
}

const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
    available: { color: 'text-emerald-600', bg: 'bg-emerald-100', icon: <CheckCircle className="w-5 h-5" />, label: 'Available' },
    occupied: { color: 'text-red-600', bg: 'bg-red-100', icon: <BedDouble className="w-5 h-5 fill-current" />, label: 'Occupied' },
    reserved: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: <Clock className="w-5 h-5" />, label: 'Reserved' },
    cleaning: { color: 'text-blue-600', bg: 'bg-blue-100', icon: <Sparkles className="w-5 h-5" />, label: 'Cleaning' },
    discharge_pending: { color: 'text-orange-600', bg: 'bg-orange-100', icon: <ArrowRight className="w-5 h-5" />, label: 'Discharge Pending' },
    blocked: { color: 'text-gray-600', bg: 'bg-gray-200', icon: <Ban className="w-5 h-5" />, label: 'Blocked' },
    maintenance: { color: 'text-gray-600', bg: 'bg-gray-200', icon: <AlertTriangle className="w-5 h-5" />, label: 'Maintenance' },
};

const BedManagementDrawer: React.FC<BedManagementDrawerProps> = ({
    isOpen,
    onClose,
    bed,
    wardType,
    onAction,
}) => {
    const [loading, setLoading] = React.useState(false);

    if (!bed) return null;

    const config = statusConfig[bed.status] || statusConfig.available;

    const handleAction = async (action: string, payload?: Record<string, unknown>) => {
        setLoading(true);
        try {
            await onAction(action, payload);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDuration = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        const start = new Date(dateStr).getTime();
        const now = Date.now();
        const diff = now - start;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return hours > 0 ? `${hours}h ${mins}m` : `${mins} mins`;
    };

    // Determine available actions based on current status
    const getActions = () => {
        const actions: { label: string; action: string; color: string; payload?: Record<string, unknown> }[] = [];

        switch (bed.status) {
            case 'available':
                actions.push({ label: 'Admit Patient', action: 'admit', color: 'bg-red-500 hover:bg-red-600' });
                actions.push({ label: 'Reserve', action: 'reserve', color: 'bg-yellow-500 hover:bg-yellow-600' });
                actions.push({ label: 'Block', action: 'block', color: 'bg-gray-500 hover:bg-gray-600' });
                break;
            case 'reserved':
                actions.push({ label: 'Admit Patient', action: 'admit', color: 'bg-red-500 hover:bg-red-600' });
                actions.push({ label: 'Cancel Reservation', action: 'finish_cleaning', color: 'bg-gray-500 hover:bg-gray-600' }); // Hack: makes available
                break;
            case 'occupied':
                actions.push({ label: 'Request Discharge', action: 'discharge_request', color: 'bg-orange-500 hover:bg-orange-600' });
                break;
            case 'discharge_pending':
                actions.push({ label: 'Mark Cleaning', action: 'mark_cleaning', color: 'bg-blue-500 hover:bg-blue-600' });
                break;
            case 'cleaning':
                actions.push({ label: 'Finish Cleaning', action: 'finish_cleaning', color: 'bg-emerald-500 hover:bg-emerald-600' });
                break;
            case 'blocked':
            case 'maintenance':
                actions.push({ label: 'Unblock', action: 'unblock', color: 'bg-blue-500 hover:bg-blue-600' });
                break;
        }

        // Admin override: Force release (always available)
        if (bed.status !== 'available') {
            actions.push({ label: 'Force Release (Admin)', action: 'release', color: 'bg-purple-600 hover:bg-purple-700', payload: { force: true } });
        }

        return actions;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black z-40"
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className={`p-4 ${config.bg} flex items-center justify-between`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg bg-white/80 ${config.color}`}>
                                    {config.icon}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800">Bed #{bed.number}</h2>
                                    <p className="text-sm text-gray-600">{wardType} Ward</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition">
                                <X className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>

                        {/* Status Badge */}
                        <div className="p-4 border-b">
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg} ${config.color} text-sm font-semibold`}>
                                {config.icon}
                                {config.label}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {/* Time Context */}
                            {(bed.occupiedSince || bed.expectedDischargeTime || bed.cleaningEta) && (
                                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Time Context</h3>
                                    {bed.occupiedSince && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Occupied Since</span>
                                            <span className="font-medium text-gray-800">{formatDuration(bed.occupiedSince)}</span>
                                        </div>
                                    )}
                                    {bed.expectedDischargeTime && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Expected Discharge</span>
                                            <span className="font-medium text-orange-600">{formatTime(bed.expectedDischargeTime)}</span>
                                        </div>
                                    )}
                                    {bed.cleaningEta && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Cleaning ETA</span>
                                            <span className="font-medium text-blue-600">{formatTime(bed.cleaningEta)}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Patient/Admission Info (Anonymized) */}
                            {bed.status === 'occupied' && (
                                <div className="bg-red-50 rounded-lg p-4 space-y-2">
                                    <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider">Patient Info (Anonymized)</h3>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Admission Type</span>
                                        <span className="font-medium text-gray-800">{bed.admissionType || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Priority</span>
                                        <span className={`font-medium ${bed.priority === 'Critical' ? 'text-red-600' : bed.priority === 'High' ? 'text-orange-600' : 'text-gray-800'}`}>
                                            {bed.priority || 'Normal'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Department</span>
                                        <span className="font-medium text-gray-800">{bed.department || wardType}</span>
                                    </div>
                                </div>
                            )}

                            {/* Equipment & Special Markers */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Equipment & Flags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {bed.hasVentilator && (
                                        <span className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                            <Wind className="w-3 h-3" /> Ventilator
                                        </span>
                                    )}
                                    {bed.hasOxygen && (
                                        <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                            <Droplet className="w-3 h-3" /> Oxygen
                                        </span>
                                    )}
                                    {bed.isIsolation && (
                                        <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                                            <Shield className="w-3 h-3" /> Isolation
                                        </span>
                                    )}
                                    {!bed.hasVentilator && !bed.hasOxygen && !bed.isIsolation && (
                                        <span className="text-gray-400 text-xs">No special equipment</span>
                                    )}
                                </div>
                            </div>

                            {/* Notes / Blocked Reason */}
                            {(bed.notes || bed.blockedReason) && (
                                <div className="bg-yellow-50 rounded-lg p-4">
                                    <h3 className="text-xs font-bold text-yellow-600 uppercase tracking-wider mb-2">Notes</h3>
                                    <p className="text-sm text-gray-700">{bed.blockedReason || bed.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Actions Footer */}
                        <div className="p-4 border-t bg-gray-50 space-y-2">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Actions</h3>
                            {loading ? (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    {getActions().map((act) => (
                                        <button
                                            key={act.action}
                                            onClick={() => handleAction(act.action, act.payload)}
                                            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-white text-sm font-medium transition ${act.color}`}
                                        >
                                            {act.action === 'admit' && <UserPlus className="w-4 h-4" />}
                                            {act.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default BedManagementDrawer;
