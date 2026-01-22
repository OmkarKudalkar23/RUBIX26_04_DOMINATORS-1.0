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
    UserPlus,
    ArrowRight,
    Shield,
    Wind,
    Droplet,
    Lock,
    Stethoscope
} from 'lucide-react';
import { StaffRole } from '../services/api';

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
    patientName?: string; // Internal patient name
    admissionType?: 'Emergency' | 'OPD' | 'Surgery' | 'Transfer' | '';
    priority?: 'Normal' | 'High' | 'Critical' | '';
    hasVentilator?: boolean;
    hasOxygen?: boolean;
    department?: string;
    isIsolation?: boolean;
    // External reservation fields
    isExternalReservation?: boolean;
    fromHospitalId?: string;
    fromHospitalName?: string;
    externalPatientName?: string;
    externalPatientAge?: number;
    externalPatientGender?: string;
    externalPatientContact?: string;
    externalPatientBloodGroup?: string;
    externalPatientCondition?: string;
    reservedAt?: string;
}

interface BedManagementDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    bed: BedSlot | null;
    wardType: string;
    wardId: string;
    onAction: (action: string, payload?: Record<string, unknown>) => Promise<void>;
    role: StaffRole;
}

// Admission form data interface
interface AdmissionFormData {
    patientName: string;
    admissionType: 'Emergency' | 'OPD' | 'Surgery' | 'Transfer';
    priority: 'Normal' | 'High' | 'Critical';
    department: string;
    notes: string;
    hasVentilator: boolean;
    hasOxygen: boolean;
    isIsolation: boolean;
}

const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
    available: { color: 'text-emerald-600', bg: 'bg-emerald-100', icon: <CheckCircle className="w-5 h-5" />, label: 'Available' },
    occupied: { color: 'text-red-600', bg: 'bg-red-100', icon: <BedDouble className="w-5 h-5 fill-current" />, label: 'Occupied' },
    reserved: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: <Clock className="w-5 h-5" />, label: 'Reserved' },
    cleaning: { color: 'text-blue-600', bg: 'bg-blue-100', icon: null, label: 'Cleaning' },
    discharge_pending: { color: 'text-orange-600', bg: 'bg-orange-100', icon: <ArrowRight className="w-5 h-5" />, label: 'Discharge Pending' },
    blocked: { color: 'text-gray-600', bg: 'bg-gray-200', icon: <Ban className="w-5 h-5" />, label: 'Blocked' },
    maintenance: { color: 'text-gray-600', bg: 'bg-gray-200', icon: <AlertTriangle className="w-5 h-5" />, label: 'Maintenance' },
};

// Role display names
const roleLabels: Record<StaffRole, string> = {
    admin: 'Administrator',
    admission_staff: 'Admission Staff',
    ward_nurse: 'Ward Nurse',
    housekeeping: 'Housekeeping',
    doctor: 'Doctor',
    reception: 'Receptionist'
};

// Role-based permissions
const rolePermissions: Record<StaffRole, {
    canViewPatientDetails: boolean;
    allowedActions: string[];
}> = {
    admin: {
        canViewPatientDetails: true,
        allowedActions: ['admit', 'reserve', 'discharge_request', 'mark_cleaning', 'finish_cleaning', 'block', 'unblock', 'release']
    },
    admission_staff: {
        canViewPatientDetails: true,
        allowedActions: ['admit', 'reserve'] // Can assign available beds
    },
    ward_nurse: {
        canViewPatientDetails: true,
        allowedActions: ['discharge_request', 'mark_cleaning'] // Can mark patient vacated
    },
    housekeeping: {
        canViewPatientDetails: false, // Cannot view patient details
        allowedActions: ['mark_cleaning', 'finish_cleaning'] // Can start/complete cleaning
    },
    doctor: {
        canViewPatientDetails: true,
        allowedActions: ['discharge_request', 'admit', 'mark_cleaning'] // Can request discharge, admit, and mark patient vacated
    },
    reception: {
        canViewPatientDetails: false,
        allowedActions: [] // Receptionists don't manage beds
    }
};

const BedManagementDrawer: React.FC<BedManagementDrawerProps> = ({
    isOpen,
    onClose,
    bed,
    wardType,
    onAction,
    role
}) => {
    const [loading, setLoading] = React.useState(false);
    const [showAdmissionForm, setShowAdmissionForm] = React.useState(false);
    const [admissionData, setAdmissionData] = React.useState<AdmissionFormData>({
        patientName: '',
        admissionType: 'OPD',
        priority: 'Normal',
        department: '',
        notes: '',
        hasVentilator: false,
        hasOxygen: false,
        isIsolation: false
    });

    if (!bed) return null;

    const config = statusConfig[bed.status] || statusConfig.available;
    const permissions = rolePermissions[role];

    const handleAction = async (action: string, payload?: Record<string, unknown>) => {
        setLoading(true);
        try {
            await onAction(action, payload);
            setShowAdmissionForm(false);
            // Reset form
            setAdmissionData({
                patientName: '',
                admissionType: 'OPD',
                priority: 'Normal',
                department: '',
                notes: '',
                hasVentilator: false,
                hasOxygen: false,
                isIsolation: false
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAdmitClick = () => {
        setShowAdmissionForm(true);
    };

    const handleSubmitAdmission = async () => {
        await handleAction('admit', {
            ...admissionData,
            department: admissionData.department || wardType
        });
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

    // Get all possible actions based on bed status
    const getAllActions = () => {
        const actions: { label: string; action: string; color: string; payload?: Record<string, unknown>; adminOnly?: boolean; showForm?: boolean }[] = [];

        switch (bed.status) {
            case 'available':
                actions.push({ label: 'Admit Patient', action: 'admit', color: 'bg-red-500 hover:bg-red-600', showForm: true });
                actions.push({ label: 'Reserve', action: 'reserve', color: 'bg-yellow-500 hover:bg-yellow-600' });
                actions.push({ label: 'Block', action: 'block', color: 'bg-gray-500 hover:bg-gray-600', adminOnly: true });
                break;
            case 'reserved':
                actions.push({ label: 'Admit Patient', action: 'admit', color: 'bg-red-500 hover:bg-red-600', showForm: true });
                actions.push({ label: 'Cancel Reservation', action: 'finish_cleaning', color: 'bg-gray-500 hover:bg-gray-600' });
                break;
            case 'occupied':
                actions.push({ label: 'Request Discharge', action: 'discharge_request', color: 'bg-orange-500 hover:bg-orange-600' });
                break;
            case 'discharge_pending':
                actions.push({ label: 'Patient Vacated / Start Cleaning', action: 'mark_cleaning', color: 'bg-blue-500 hover:bg-blue-600' });
                break;
            case 'cleaning':
                actions.push({ label: 'Mark as Available', action: 'finish_cleaning', color: 'bg-green-600 hover:bg-green-700' });
                break;
            case 'blocked':
            case 'maintenance':
                actions.push({ label: 'Unblock', action: 'unblock', color: 'bg-blue-500 hover:bg-blue-600', adminOnly: true });
                break;
        }

        // Admin-only: Force release
        if (bed.status !== 'available') {
            actions.push({ label: 'Force Release', action: 'release', color: 'bg-purple-600 hover:bg-purple-700', payload: { force: true }, adminOnly: true });
        }

        return actions;
    };

    // Filter actions based on role permissions
    const getFilteredActions = () => {
        const allActions = getAllActions();

        if (role === 'admin') {
            return allActions; // Admin sees all
        }

        return allActions.filter(action => {
            // Remove admin-only actions for non-admins
            if (action.adminOnly) return false;
            // Check if action is in allowed list
            return permissions.allowedActions.includes(action.action);
        });
    };

    const filteredActions = getFilteredActions();
    const hasNoActions = filteredActions.length === 0;

    // Admission Form - INLINED to prevent focus loss on re-render
    const renderAdmissionForm = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 border border-red-200 space-y-4"
        >
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-red-700 flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    New Admission
                </h3>
                <button
                    onClick={() => setShowAdmissionForm(false)}
                    className="p-1 hover:bg-red-100 rounded-full transition"
                >
                    <X className="w-4 h-4 text-red-500" />
                </button>
            </div>

            <div className="space-y-3">
                {/* Patient Name */}
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Patient Name *</label>
                    <input
                        type="text"
                        value={admissionData.patientName}
                        onChange={(e) => setAdmissionData(prev => ({ ...prev, patientName: e.target.value }))}
                        placeholder="Enter patient name"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                    />
                </div>

                {/* Admission Type & Priority */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Admission Type</label>
                        <select
                            value={admissionData.admissionType}
                            onChange={(e) => setAdmissionData(prev => ({ ...prev, admissionType: e.target.value as AdmissionFormData['admissionType'] }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
                        >
                            <option value="OPD">OPD</option>
                            <option value="Emergency">Emergency</option>
                            <option value="Surgery">Surgery</option>
                            <option value="Transfer">Transfer</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
                        <select
                            value={admissionData.priority}
                            onChange={(e) => setAdmissionData(prev => ({ ...prev, priority: e.target.value as AdmissionFormData['priority'] }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
                        >
                            <option value="Normal">Normal</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                        </select>
                    </div>
                </div>

                {/* Department */}
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
                    <input
                        type="text"
                        value={admissionData.department}
                        onChange={(e) => setAdmissionData(prev => ({ ...prev, department: e.target.value }))}
                        placeholder={wardType || "e.g., General, ICU"}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                    />
                </div>

                {/* Equipment Checkboxes */}
                <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                            type="checkbox"
                            checked={admissionData.hasVentilator}
                            onChange={(e) => setAdmissionData(prev => ({ ...prev, hasVentilator: e.target.checked }))}
                            className="rounded text-purple-600"
                        />
                        <Wind className="w-3 h-3 text-purple-600" />
                        Ventilator
                    </label>
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                            type="checkbox"
                            checked={admissionData.hasOxygen}
                            onChange={(e) => setAdmissionData(prev => ({ ...prev, hasOxygen: e.target.checked }))}
                            className="rounded text-blue-600"
                        />
                        <Droplet className="w-3 h-3 text-blue-600" />
                        Oxygen
                    </label>
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                            type="checkbox"
                            checked={admissionData.isIsolation}
                            onChange={(e) => setAdmissionData(prev => ({ ...prev, isIsolation: e.target.checked }))}
                            className="rounded text-yellow-600"
                        />
                        <Shield className="w-3 h-3 text-yellow-600" />
                        Isolation
                    </label>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                    <textarea
                        value={admissionData.notes}
                        onChange={(e) => setAdmissionData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Additional notes..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                    />
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSubmitAdmission}
                    disabled={!admissionData.patientName || loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition"
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            <UserPlus className="w-4 h-4" />
                            Confirm Admission
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );

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

                        {/* Role Badge */}
                        <div className="px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 border-b flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500">Viewing as:</span>
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full flex items-center gap-1">
                                {role === 'doctor' && <Stethoscope className="w-3 h-3" />}
                                {roleLabels[role]}
                            </span>
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
                            {/* Admission Form (when active) */}
                            <AnimatePresence>
                                {showAdmissionForm && renderAdmissionForm()}
                            </AnimatePresence>

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

                            {/* External Reservation Info */}
                            {bed.status === 'reserved' && (bed.isExternalReservation || bed.fromHospitalName || bed.externalPatientName) && (
                                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200 space-y-2">
                                    <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider flex items-center gap-2">
                                        🏥 External Reservation
                                    </h3>
                                    <div className="text-sm text-purple-800 font-semibold">
                                        Patient from {bed.fromHospitalName}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="text-gray-500">Name:</span>
                                            <span className="ml-2 font-medium text-gray-800">{bed.externalPatientName}</span>
                                        </div>
                                        {bed.externalPatientAge && (
                                            <div>
                                                <span className="text-gray-500">Age:</span>
                                                <span className="ml-2 font-medium text-gray-800">{bed.externalPatientAge}</span>
                                            </div>
                                        )}
                                        {bed.externalPatientGender && (
                                            <div>
                                                <span className="text-gray-500">Gender:</span>
                                                <span className="ml-2 font-medium text-gray-800">{bed.externalPatientGender}</span>
                                            </div>
                                        )}
                                        {bed.externalPatientBloodGroup && (
                                            <div>
                                                <span className="text-gray-500">Blood:</span>
                                                <span className="ml-2 font-medium text-red-600">{bed.externalPatientBloodGroup}</span>
                                            </div>
                                        )}
                                    </div>
                                    {bed.externalPatientCondition && (
                                        <div className="text-sm">
                                            <span className="text-gray-500">Condition:</span>
                                            <span className="ml-2 font-medium text-gray-800">{bed.externalPatientCondition}</span>
                                        </div>
                                    )}
                                    {bed.externalPatientContact && (
                                        <div className="text-sm">
                                            <span className="text-gray-500">Contact:</span>
                                            <span className="ml-2 font-medium text-gray-800">{bed.externalPatientContact}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Internal Reservation Info - NEW BLOCK */}
                            {bed.status === 'reserved' && !bed.isExternalReservation && bed.patientName && (
                                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200 space-y-2">
                                    <h3 className="text-xs font-bold text-yellow-700 uppercase tracking-wider flex items-center gap-2">
                                        🏠 Internal Reservation
                                    </h3>
                                    <div className="text-sm">
                                        <span className="text-gray-500">Patient:</span>
                                        <span className="ml-2 font-lg font-bold text-gray-900">{bed.patientName}</span>
                                    </div>
                                    {bed.department && (
                                        <div className="text-sm">
                                            <span className="text-gray-500">Department:</span>
                                            <span className="ml-2 font-medium text-gray-800">{bed.department}</span>
                                        </div>
                                    )}
                                    {bed.reservedAt && (
                                        <div className="text-sm">
                                            <span className="text-gray-500">Reserved At:</span>
                                            <span className="ml-2 font-medium text-gray-800">{formatTime(bed.reservedAt)}</span>
                                        </div>
                                    )}
                                    {bed.notes && (
                                        <div className="mt-2 text-sm text-gray-600 italic border-l-2 border-yellow-300 pl-2">
                                            "{bed.notes}"
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Patient/Admission Info (Anonymized) - Role Restricted */}
                            {bed.status === 'occupied' && (
                                permissions.canViewPatientDetails ? (
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
                                ) : (
                                    <div className="bg-gray-100 rounded-lg p-4 flex items-center gap-3 text-gray-500">
                                        <Lock className="w-5 h-5" />
                                        <span className="text-sm">Patient details not available for this role</span>
                                    </div>
                                )
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
                            ) : hasNoActions ? (
                                <div className="flex items-center justify-center gap-2 py-4 text-gray-400 text-sm">
                                    <Lock className="w-4 h-4" />
                                    <span>No actions available for {roleLabels[role]}</span>
                                </div>
                            ) : showAdmissionForm ? (
                                <div className="text-center text-sm text-gray-500 py-2">
                                    Complete the admission form above
                                </div>
                            ) : (
                                <div className={`grid gap-2 ${filteredActions.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                    {filteredActions.map((act) => (
                                        <button
                                            key={act.action}
                                            onClick={() => act.showForm ? handleAdmitClick() : handleAction(act.action, act.payload)}
                                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white text-sm font-semibold transition shadow-md hover:shadow-lg ${act.color}`}
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
