import { X, Pill, Calendar as CalendarIcon, Bell, BellOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MedicineTaking {
  date: string;
  time: string;
  taken: boolean;
}

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  remainingDays: number;
  reminderEnabled: boolean;
  completed: boolean;
  totalStrips: number;
  purchasedStrips: number;
  times: string[];
  takings: MedicineTaking[];
}

interface MedicineDetailModalProps {
  medicine: Medicine;
  onClose: () => void;
  onToggleTaking: (date: string, time: string) => void;
  onToggleReminder: () => void;
  isDarkMode?: boolean;
}

export function MedicineDetailModal({
  medicine,
  onClose,
  onToggleTaking,
  onToggleReminder,
  isDarkMode = false,
}: MedicineDetailModalProps) {
  // Get last 30 days for calendar view
  const getLast30Days = () => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split("T")[0]);
    }
    return days;
  };

  const last30Days = getLast30Days();

  const getTakingStatus = (date: string, time: string) => {
    return medicine.takings.find((t) => t.date === date && t.time === time)?.taken || false;
  };

  const bgPrimary = isDarkMode ? "bg-gray-900" : "bg-white";
  const bgSecondary = isDarkMode ? "bg-gray-800" : "bg-gray-50";
  const textPrimary = isDarkMode ? "text-white" : "text-black";
  const textSecondary = isDarkMode ? "text-gray-400" : "text-gray-600";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className={`${bgPrimary} rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto`}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-white' : 'bg-black'}`}>
                  <Pill className={`w-6 h-6 ${isDarkMode ? 'text-black' : 'text-white'}`} />
                </div>
                <div>
                  <h3
                    className={`text-2xl ${textPrimary}`}
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                  >
                    {medicine.name}
                  </h3>
                  <p className={`text-sm ${textSecondary}`}>{medicine.dosage}</p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
            >
              <X className={`w-5 h-5 ${textPrimary}`} />
            </button>
          </div>

          {/* Medicine Info */}
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 ${bgSecondary} rounded-2xl`}>
            <div>
              <p className={`text-xs ${textSecondary} mb-1`}>Frequency</p>
              <p className={`text-sm font-semibold ${textPrimary}`}>{medicine.frequency}</p>
            </div>
            <div>
              <p className={`text-xs ${textSecondary} mb-1`}>Duration</p>
              <p className={`text-sm font-semibold ${textPrimary}`}>{medicine.duration}</p>
            </div>
            <div>
              <p className={`text-xs ${textSecondary} mb-1`}>Remaining</p>
              <p className={`text-sm font-semibold ${textPrimary}`}>{medicine.remainingDays} days</p>
            </div>
            <div>
              <p className={`text-xs ${textSecondary} mb-1`}>Strips</p>
              <p className={`text-sm font-semibold ${textPrimary}`}>
                {medicine.purchasedStrips}/{medicine.totalStrips}
              </p>
            </div>
          </div>

          {/* Reminder Toggle */}
          <button
            onClick={onToggleReminder}
            className={`w-full p-4 rounded-2xl flex items-center justify-between mb-6 transition-all ${
              isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              {medicine.reminderEnabled ? (
                <Bell className={`w-5 h-5 ${textPrimary}`} />
              ) : (
                <BellOff className={`w-5 h-5 ${textSecondary}`} />
              )}
              <span className={textPrimary} style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                Reminders {medicine.reminderEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div
              className={`w-12 h-6 rounded-full transition-all ${
                medicine.reminderEnabled ? (isDarkMode ? 'bg-white' : 'bg-black') : isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
              } relative`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                  medicine.reminderEnabled ? "left-6.5" : "left-0.5"
                }`}
              />
            </div>
          </button>

          {/* Calendar View */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CalendarIcon className={`w-5 h-5 ${textPrimary}`} />
              <h4
                className={textPrimary}
                style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
              >
                Taking History (Last 30 Days)
              </h4>
            </div>

            {/* Times Legend */}
            <div className="flex flex-wrap gap-2 mb-4">
              {medicine.times.map((time) => (
                <span
                  key={time}
                  className={`px-3 py-1 rounded-lg text-xs ${bgSecondary} ${textPrimary}`}
                  style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                >
                  {time}
                </span>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="space-y-2">
              {medicine.times.map((time) => (
                <div key={time}>
                  <p className={`text-sm ${textSecondary} mb-2`} style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}>
                    {time}
                  </p>
                  <div className="grid grid-cols-15 gap-1">
                    {last30Days.map((date) => {
                      const taken = getTakingStatus(date, time);
                      const isToday = date === new Date().toISOString().split("T")[0];
                      const isPast = new Date(date) < new Date(new Date().setHours(0, 0, 0, 0));

                      return (
                        <button
                          key={`${date}-${time}`}
                          onClick={() => onToggleTaking(date, time)}
                          disabled={!isPast && !isToday}
                          className={`aspect-square rounded-lg transition-all ${
                            taken
                              ? isDarkMode ? 'bg-white' : 'bg-black'
                              : isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
                          } ${
                            isToday ? `ring-2 ${isDarkMode ? 'ring-white' : 'ring-black'}` : ''
                          } ${
                            !isPast && !isToday ? 'opacity-30 cursor-not-allowed' : ''
                          }`}
                          title={`${date} - ${time}`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${isDarkMode ? 'bg-white' : 'bg-black'}`} />
                <span className={textSecondary}>Taken</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`} />
                <span className={textSecondary}>Not Taken</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ring-2 ${isDarkMode ? 'bg-gray-800 ring-white' : 'bg-gray-100 ring-black'}`} />
                <span className={textSecondary}>Today</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}