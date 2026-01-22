import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    CheckCircle,
    Eye,
    BedDouble,
    AlertTriangle,
    Clock,
    Loader2,
    Stethoscope,
    FileText,
    ArrowLeft
} from 'lucide-react';
import { submitConsultationOutcome, type OpdCheckIn, type ConsultationOutcomeData } from '../services/api';
import { toast } from 'sonner';

interface ConsultationOutcomeModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientData: OpdCheckIn;
    onOutcomeSubmit: (data: ConsultationOutcomeData) => Promise<void>;
}

const ConsultationOutcomeModal: React.FC<ConsultationOutcomeModalProps> = ({
    isOpen,
    onClose,
    patientData,
    onOutcomeSubmit
}) => {
    const [selectedOutcome, setSelectedOutcome] = useState<'completed' | 'observation' | 'admit' | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Admit form state
    const [bedType, setBedType] = useState<'ICU' | 'General' | 'Private' | 'Emergency'>('General');
    const [department, setDepartment] = useState(patientData?.department || '');
    const [urgencyLevel, setUrgencyLevel] = useState<'routine' | 'urgent' | 'emergency'>('routine');
    const [reason, setReason] = useState('');

    const handleSubmit = async () => {
        if (!selectedOutcome) return;

        setIsSubmitting(true);
        try {
            const data: ConsultationOutcomeData = {
                outcome: selectedOutcome
            };

            if (selectedOutcome === 'admit') {
                data.admitData = {
                    bedType,
                    department,
                    urgencyLevel,
                    reason
                };
            }

            // Use the proper API that creates internal bed requests
            const result = await submitConsultationOutcome(patientData.id, data);

            if (selectedOutcome === 'completed') {
                toast.success('Consultation completed successfully');
            } else if (selectedOutcome === 'observation') {
                toast.success('Patient moved to observation');
            } else if (selectedOutcome === 'admit') {
                toast.success('Admission request created! Check Bed Management for the internal request.');
                if (result.internalBedRequest) {
                    console.log('Internal bed request created:', result.internalBedRequest);
                }
            }

            await onOutcomeSubmit(data);
            onClose();
        } catch (error) {
            console.error('Failed to submit consultation outcome:', error);
            toast.error('Failed to update patient status');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setSelectedOutcome(null);
        setBedType('General');
        setDepartment(patientData?.department || '');
        setUrgencyLevel('routine');
        setReason('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header - Matching website's dark theme */}
                        <div className="bg-black px-6 py-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                        <Stethoscope className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2
                                            className="text-lg uppercase tracking-wide text-white"
                                            style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                                        >
                                            End Consultation
                                        </h2>
                                        <p className="text-gray-400 text-sm">{patientData?.patientName}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {/* Outcome Selection */}
                            {!selectedOutcome && (
                                <div className="space-y-3">
                                    <p className="text-gray-500 text-sm mb-5">
                                        Select the consultation outcome for this patient:
                                    </p>

                                    {/* Consultation Complete */}
                                    <button
                                        onClick={() => setSelectedOutcome('completed')}
                                        className="w-full p-4 rounded-2xl border-2 border-gray-100 hover:border-green-400 hover:bg-green-50 transition-all group text-left"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                                <CheckCircle className="w-6 h-6 text-green-600" />
                                            </div>
                                            <div>
                                                <h3
                                                    className="text-gray-900 uppercase tracking-wide"
                                                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                                                >
                                                    Consultation Complete
                                                </h3>
                                                <p className="text-sm text-gray-500">Patient exits OPD with prescription/advice</p>
                                            </div>
                                        </div>
                                    </button>

                                    {/* Observation / Day-Care */}
                                    <button
                                        onClick={() => setSelectedOutcome('observation')}
                                        className="w-full p-4 rounded-2xl border-2 border-gray-100 hover:border-blue-400 hover:bg-blue-50 transition-all group text-left"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                                <Eye className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3
                                                    className="text-gray-900 uppercase tracking-wide"
                                                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                                                >
                                                    Observation / Day-Care
                                                </h3>
                                                <p className="text-sm text-gray-500">Patient requires short-term monitoring</p>
                                            </div>
                                        </div>
                                    </button>

                                    {/* Admit Patient */}
                                    <button
                                        onClick={() => setSelectedOutcome('admit')}
                                        className="w-full p-4 rounded-2xl border-2 border-gray-100 hover:border-amber-400 hover:bg-amber-50 transition-all group text-left"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                                                <BedDouble className="w-6 h-6 text-amber-600" />
                                            </div>
                                            <div>
                                                <h3
                                                    className="text-gray-900 uppercase tracking-wide"
                                                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                                                >
                                                    Admit Patient
                                                </h3>
                                                <p className="text-sm text-gray-500">Request bed allocation for admission</p>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            )}

                            {/* Admit Form */}
                            {selectedOutcome === 'admit' && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-4"
                                >
                                    <button
                                        onClick={() => setSelectedOutcome(null)}
                                        className="flex items-center gap-2 text-gray-600 hover:text-black text-sm font-medium transition-colors mb-4"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        <span>Back to options</span>
                                    </button>

                                    <h3
                                        className="text-lg uppercase tracking-wide text-gray-800 mb-4"
                                        style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                                    >
                                        Admission Details
                                    </h3>

                                    {/* Urgency Level */}
                                    <div>
                                        <label
                                            className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"
                                        >
                                            Urgency Level
                                        </label>
                                        <div className="flex gap-2">
                                            {(['routine', 'urgent', 'emergency'] as const).map((level) => (
                                                <button
                                                    key={level}
                                                    onClick={() => setUrgencyLevel(level)}
                                                    className={`flex-1 py-3 px-3 rounded-xl border-2 text-sm font-semibold transition-all ${urgencyLevel === level
                                                        ? level === 'routine'
                                                            ? 'border-green-500 bg-green-50 text-green-700'
                                                            : level === 'urgent'
                                                                ? 'border-amber-500 bg-amber-50 text-amber-700'
                                                                : 'border-red-500 bg-red-50 text-red-700'
                                                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        {level === 'routine' && <Clock className="w-4 h-4" />}
                                                        {level === 'urgent' && <AlertTriangle className="w-4 h-4" />}
                                                        {level === 'emergency' && <AlertTriangle className="w-4 h-4" />}
                                                        {level.charAt(0).toUpperCase() + level.slice(1)}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Bed Type */}
                                    <div>
                                        <label
                                            className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"
                                        >
                                            Required Bed Type
                                        </label>
                                        <select
                                            value={bedType}
                                            onChange={(e) => setBedType(e.target.value as any)}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent text-sm bg-gray-50"
                                        >
                                            <option value="General">General Ward</option>
                                            <option value="Private">Private Room</option>
                                            <option value="ICU">ICU</option>
                                            <option value="Emergency">Emergency</option>
                                        </select>
                                    </div>

                                    {/* Department */}
                                    <div>
                                        <label
                                            className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"
                                        >
                                            Admission Department
                                        </label>
                                        <input
                                            type="text"
                                            value={department}
                                            onChange={(e) => setDepartment(e.target.value)}
                                            placeholder="e.g., Cardiology, General Medicine"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent text-sm bg-gray-50"
                                        />
                                    </div>

                                    {/* Clinical Notes */}
                                    <div>
                                        <label
                                            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"
                                        >
                                            <FileText className="w-3.5 h-3.5" />
                                            Clinical Notes (Optional)
                                        </label>
                                        <textarea
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            placeholder="Brief reason for admission, relevant history, special requirements..."
                                            rows={3}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent text-sm resize-none bg-gray-50"
                                        />
                                    </div>

                                    {/* Info Note */}
                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                        <p className="text-xs text-blue-700">
                                            <strong>Note:</strong> This request will be forwarded to Admission Staff for bed allocation.
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* Confirmation for Complete/Observation */}
                            {(selectedOutcome === 'completed' || selectedOutcome === 'observation') && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-4"
                                >
                                    <button
                                        onClick={() => setSelectedOutcome(null)}
                                        className="flex items-center gap-2 text-gray-600 hover:text-black text-sm font-medium transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        <span>Back to options</span>
                                    </button>

                                    <div className={`p-6 rounded-2xl text-center ${selectedOutcome === 'completed' ? 'bg-green-50' : 'bg-blue-50'
                                        }`}>
                                        <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${selectedOutcome === 'completed' ? 'bg-green-100' : 'bg-blue-100'
                                            }`}>
                                            {selectedOutcome === 'completed' ? (
                                                <CheckCircle className="w-8 h-8 text-green-600" />
                                            ) : (
                                                <Eye className="w-8 h-8 text-blue-600" />
                                            )}
                                        </div>
                                        <h3
                                            className="text-gray-900 mb-2 uppercase tracking-wide"
                                            style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                                        >
                                            {selectedOutcome === 'completed' ? 'Mark Consultation Complete' : 'Move to Observation'}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {selectedOutcome === 'completed'
                                                ? `${patientData?.patientName} will be removed from the active OPD queue.`
                                                : `${patientData?.patientName} will be marked for observation/day-care monitoring.`
                                            }
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Footer */}
                        {selectedOutcome && (
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                                <button
                                    onClick={handleClose}
                                    disabled={isSubmitting}
                                    className="px-5 py-2.5 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors text-sm uppercase tracking-wide"
                                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || (selectedOutcome === 'admit' && !department)}
                                    className={`px-6 py-2.5 rounded-xl text-sm uppercase tracking-wide transition-all flex items-center gap-2 ${isSubmitting
                                        ? 'bg-gray-400 cursor-not-allowed text-white'
                                        : selectedOutcome === 'admit'
                                            ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-200'
                                            : selectedOutcome === 'completed'
                                                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200'
                                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200'
                                        }`}
                                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : selectedOutcome === 'admit' ? (
                                        'Submit Request'
                                    ) : selectedOutcome === 'completed' ? (
                                        'Complete'
                                    ) : (
                                        'Confirm'
                                    )}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ConsultationOutcomeModal;
