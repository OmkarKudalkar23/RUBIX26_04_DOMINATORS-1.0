import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle2, AlertCircle, Pill } from "lucide-react";

interface ExtractedMedicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  times: string[];
}

interface PrescriptionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  extractedMedicines: ExtractedMedicine[];
  onConfirm: (medicines: ExtractedMedicine[]) => void;
  isDarkMode: boolean;
}

export function PrescriptionConfirmModal({
  isOpen,
  onClose,
  extractedMedicines,
  onConfirm,
  isDarkMode
}: PrescriptionConfirmModalProps) {
  const bgColor = isDarkMode ? 'bg-gray-900' : 'bg-white';
  const textPrimary = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const cardBg = isDarkMode ? 'bg-gray-800' : 'bg-gray-50';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`relative ${bgColor} rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden`}
          >
            {/* Header */}
            <div className={`p-6 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-blue-600' : 'bg-blue-500'}`}>
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className={`text-2xl ${textPrimary}`} style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                      Confirm Extracted Medicines
                    </h2>
                    <p className={`text-sm ${textSecondary}`}>
                      Review the medicines extracted from your prescription
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                  }`}
                >
                  <X className={`w-5 h-5 ${textSecondary}`} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {extractedMedicines.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className={`w-16 h-16 mx-auto mb-4 ${textSecondary}`} />
                  <p className={`${textPrimary} mb-2`} style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                    No medicines detected
                  </p>
                  <p className={`text-sm ${textSecondary}`}>
                    Please try uploading a clearer prescription image
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`${cardBg} rounded-xl p-4 mb-4`}>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      <p className={`text-sm ${textPrimary}`} style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                        {extractedMedicines.length} medicine{extractedMedicines.length > 1 ? 's' : ''} detected
                      </p>
                    </div>
                    <p className={`text-xs ${textSecondary}`}>
                      These medicines will be added to your Prescriptions & Medications. Existing medicines will have their duration updated.
                    </p>
                  </div>

                  {extractedMedicines.map((medicine, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`${cardBg} rounded-2xl p-5`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isDarkMode ? 'bg-gray-700' : 'bg-white'
                        }`}>
                          <Pill className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                        </div>
                        <div className="flex-1 space-y-2">
                          <h3 className={`${textPrimary}`} style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                            {medicine.name}
                          </h3>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className={`text-xs ${textSecondary} mb-1`}>Dosage</p>
                              <p className={`text-sm ${textPrimary}`} style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                                {medicine.dosage}
                              </p>
                            </div>
                            <div>
                              <p className={`text-xs ${textSecondary} mb-1`}>Duration</p>
                              <p className={`text-sm ${textPrimary}`} style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                                {medicine.duration}
                              </p>
                            </div>
                            <div>
                              <p className={`text-xs ${textSecondary} mb-1`}>Frequency</p>
                              <p className={`text-sm ${textPrimary}`} style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                                {medicine.frequency}
                              </p>
                            </div>
                            <div>
                              <p className={`text-xs ${textSecondary} mb-1`}>Times</p>
                              <div className="flex flex-wrap gap-1">
                                {medicine.times.map((time, timeIdx) => (
                                  <span
                                    key={timeIdx}
                                    className={`text-xs px-2 py-1 rounded-md ${
                                      isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700'
                                    }`}
                                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                                  >
                                    {time}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {extractedMedicines.length > 0 && (
              <div className={`p-6 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className={`flex-1 px-6 py-3 rounded-xl transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-800 hover:bg-gray-700 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                    }`}
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => onConfirm(extractedMedicines)}
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                  >
                    Confirm & Add Medicines
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
