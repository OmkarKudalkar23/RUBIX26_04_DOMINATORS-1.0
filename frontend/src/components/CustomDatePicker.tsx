import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { createPortal } from "react-dom";

interface CustomDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  isDarkMode?: boolean;
}

export function CustomDatePicker({
  value,
  onChange,
  minDate,
  placeholder = "Select date...",
  disabled = false,
  required = false,
  isDarkMode = false,
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [currentMonth, setCurrentMonth] = useState(
    value ? new Date(value) : new Date()
  );
  const [focusedDay, setFocusedDay] = useState<number | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dayRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Update position whenever dropdown opens or viewport changes
  const updatePosition = () => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropdownHeight = 420; // approximate calendar height with padding

    // Decide whether to show above or below
    const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

    setDropdownPosition({
      top: showAbove ? rect.top - dropdownHeight - 8 : rect.bottom + 8,
      left: rect.left,
    });
  };

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
        setFocusedDay(null);
      }
    };

    // Small delay to prevent immediate closure
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Update position when opening or on scroll/resize
  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleScroll = () => updatePosition();
    const handleResize = () => updatePosition();

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  // Keyboard navigation for calendar
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const { daysInMonth } = getDaysInMonth(currentMonth);
      const currentFocusedDay = focusedDay || (value ? new Date(value).getDate() : 1);

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          setFocusedDay((prev) => {
            const newDay = (prev || currentFocusedDay) - 1;
            return newDay >= 1 ? newDay : daysInMonth;
          });
          break;
        case "ArrowRight":
          e.preventDefault();
          setFocusedDay((prev) => {
            const newDay = (prev || currentFocusedDay) + 1;
            return newDay <= daysInMonth ? newDay : 1;
          });
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedDay((prev) => {
            const newDay = (prev || currentFocusedDay) - 7;
            return newDay >= 1 ? newDay : Math.max(1, daysInMonth + newDay);
          });
          break;
        case "ArrowDown":
          e.preventDefault();
          setFocusedDay((prev) => {
            const newDay = (prev || currentFocusedDay) + 7;
            return newDay <= daysInMonth ? newDay : Math.min(daysInMonth, newDay - daysInMonth);
          });
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (focusedDay) {
            handleDateSelect(focusedDay);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setFocusedDay(null);
          buttonRef.current?.focus();
          break;
        case "Home":
          e.preventDefault();
          setFocusedDay(1);
          break;
        case "End":
          e.preventDefault();
          setFocusedDay(daysInMonth);
          break;
        case "PageUp":
          e.preventDefault();
          handlePrevMonth();
          break;
        case "PageDown":
          e.preventDefault();
          handleNextMonth();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, focusedDay, currentMonth, value]);

  // Auto-focus the selected day when opening
  useEffect(() => {
    if (isOpen && value) {
      const selectedDate = new Date(value);
      if (
        selectedDate.getMonth() === currentMonth.getMonth() &&
        selectedDate.getFullYear() === currentMonth.getFullYear()
      ) {
        setFocusedDay(selectedDate.getDate());
      }
    }
  }, [isOpen]);

  // Scroll focused day into view
  useEffect(() => {
    if (focusedDay !== null && dayRefs.current[focusedDay - 1]) {
      dayRefs.current[focusedDay - 1]?.focus();
    }
  }, [focusedDay]);

  const toggleOpen = () => {
    if (disabled) return;
    
    if (!isOpen) {
      // Opening - update position immediately
      setTimeout(() => {
        updatePosition();
      }, 0);
    } else {
      // Closing
      setFocusedDay(null);
    }
    
    setIsOpen(!isOpen);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
    setFocusedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
    setFocusedDay(null);
  };

  const handleDateSelect = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Construct date string manually to avoid timezone issues
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Check if date is before minDate
    if (minDate && dateString < minDate) {
      return;
    }
    
    onChange(dateString);
    setIsOpen(false);
    setFocusedDay(null);
    buttonRef.current?.focus();
  };

  const handleTodayClick = () => {
    const today = new Date();
    const todayString = today.toISOString().split("T")[0];
    if (!minDate || todayString >= minDate) {
      onChange(todayString);
      setIsOpen(false);
      setFocusedDay(null);
      buttonRef.current?.focus();
    }
  };

  const isDateDisabled = (day: number) => {
    if (!minDate) return false;
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Construct date string manually to avoid timezone issues
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dateString < minDate;
  };

  const isDateSelected = (day: number) => {
    if (!value) return false;
    const selectedDate = new Date(value);
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth.getMonth() &&
      selectedDate.getFullYear() === currentMonth.getFullYear()
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth.getMonth() &&
      today.getFullYear() === currentMonth.getFullYear()
    );
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleOpen();
          }
        }}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Choose date"
        className={`w-full px-4 py-3 rounded-xl transition-all outline-none text-left flex items-center justify-between ${
          isDarkMode
            ? 'bg-gray-800'
            : 'bg-gray-50'
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-100"} ${
          isOpen ? "ring-2 ring-black" : ""
        }`}
        style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
      >
        <span className={value ? (isDarkMode ? "text-white" : "text-black") : (isDarkMode ? "text-gray-500" : "text-gray-400")}>
          {value ? formatDate(value) : placeholder}
        </span>
        <Calendar className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
      </button>

      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              role="dialog"
              aria-label="Calendar"
              aria-modal="true"
              className={`fixed rounded-xl shadow-2xl p-4 ${
                isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              }`}
              style={{ 
                fontFamily: "'Doto', sans-serif",
                width: "320px",
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                zIndex: 999999,
              }}
            >
              {/* Month/Year Header */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  aria-label="Previous month"
                  className={`w-8 h-8 rounded-lg transition-all flex items-center justify-center ${
                    isDarkMode ? 'bg-gray-700 hover:bg-white hover:text-black' : 'bg-gray-100 hover:bg-black hover:text-white'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`} style={{ fontWeight: "700" }}>
                  {monthNames[currentMonth.getMonth()]}{" "}
                  {currentMonth.getFullYear()}
                </div>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  aria-label="Next month"
                  className={`w-8 h-8 rounded-lg transition-all flex items-center justify-center ${
                    isDarkMode ? 'bg-gray-700 hover:bg-white hover:text-black' : 'bg-gray-100 hover:bg-black hover:text-white'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Day Labels */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                  <div
                    key={day}
                    className={`text-center text-xs py-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                    style={{ fontWeight: "600" }}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before month starts */}
                {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                  <div key={`empty-${index}`} className="aspect-square" />
                ))}

                {/* Days of the month */}
                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = index + 1;
                  const disabled = isDateDisabled(day);
                  const selected = isDateSelected(day);
                  const today = isToday(day);
                  const focused = focusedDay === day;

                  return (
                    <button
                      key={day}
                      ref={(el) => (dayRefs.current[index] = el)}
                      type="button"
                      onClick={() => !disabled && handleDateSelect(day)}
                      onMouseEnter={() => setFocusedDay(day)}
                      disabled={disabled}
                      aria-label={`${day} ${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`}
                      aria-selected={selected}
                      className={`aspect-square rounded-lg transition-all relative ${
                        selected
                          ? isDarkMode ? "bg-white text-black ring-2 ring-white" : "bg-black text-white ring-2 ring-black"
                          : focused && !disabled
                          ? isDarkMode ? "bg-gray-700 text-white ring-2 ring-gray-500" : "bg-gray-100 text-black ring-2 ring-gray-300"
                          : disabled
                          ? isDarkMode ? "text-gray-600 cursor-not-allowed" : "text-gray-300 cursor-not-allowed"
                          : today
                          ? isDarkMode ? "bg-gray-700 text-white" : "bg-gray-50 text-black"
                          : isDarkMode ? "hover:bg-gray-700 text-white" : "hover:bg-gray-100 text-black"
                      }`}
                      style={{ fontWeight: selected ? "700" : "600" }}
                    >
                      {day}
                      {today && !selected && (
                        <div className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full ${
                          isDarkMode ? 'bg-white' : 'bg-black'
                        }`} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={handleTodayClick}
                  className={`flex-1 py-2 rounded-lg transition-all text-sm ${
                    isDarkMode ? 'bg-gray-700 text-white hover:bg-white hover:text-black' : 'bg-gray-100 hover:bg-black hover:text-white'
                  }`}
                  style={{ fontWeight: "600" }}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setFocusedDay(null);
                    buttonRef.current?.focus();
                  }}
                  className={`flex-1 py-2 rounded-lg transition-all text-sm ${
                    isDarkMode ? 'bg-gray-700 text-white hover:bg-white hover:text-black' : 'bg-gray-100 hover:bg-black hover:text-white'
                  }`}
                  style={{ fontWeight: "600" }}
                >
                  Close
                </button>
              </div>

              {/* Keyboard Hints */}
              <div className={`mt-3 pt-3 border-t text-xs text-center ${
                isDarkMode ? 'text-gray-500 border-gray-700' : 'text-gray-400 border-gray-200'
              }`}>
                Use arrow keys to navigate • Enter to select • Esc to close
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}