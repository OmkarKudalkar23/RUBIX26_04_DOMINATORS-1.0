import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { createPortal } from "react-dom";

interface Option {
  value: string;
  label: string;
  subtitle?: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  isDarkMode?: boolean;
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  disabled = false,
  required = false,
  isDarkMode = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const selectedOption = options.find((opt) => opt.value === value);
  const selectedIndex = options.findIndex((opt) => opt.value === value);

  // Filter options based on search query
  const filteredOptions = searchQuery
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opt.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  // Update position whenever dropdown opens or viewport changes
  const updatePosition = () => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropdownHeight = Math.min(256, filteredOptions.length * 52 + 16); // Estimate dropdown height

    // Decide whether to show above or below
    const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

    setDropdownPosition({
      top: showAbove ? rect.top - dropdownHeight - 8 : rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    });
  };

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && optionRefs.current[highlightedIndex]) {
      optionRefs.current[highlightedIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [highlightedIndex]);

  // Auto-scroll to selected option when opening
  useEffect(() => {
    if (isOpen && selectedIndex >= 0) {
      setTimeout(() => {
        if (optionRefs.current[selectedIndex]) {
          optionRefs.current[selectedIndex]?.scrollIntoView({
            block: "center",
            behavior: "smooth",
          });
        }
      }, 100);
    }
  }, [isOpen, selectedIndex]);

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
        setSearchQuery("");
        setHighlightedIndex(-1);
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
  }, [isOpen, filteredOptions.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (highlightedIndex >= 0) {
            handleOptionClick(filteredOptions[highlightedIndex].value);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setSearchQuery("");
          setHighlightedIndex(-1);
          buttonRef.current?.focus();
          break;
        case "Home":
          e.preventDefault();
          setHighlightedIndex(0);
          break;
        case "End":
          e.preventDefault();
          setHighlightedIndex(filteredOptions.length - 1);
          break;
        default:
          // Type-to-search functionality
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            setSearchQuery((prev) => prev + e.key);
            
            // Clear search after 1 second of no typing
            if (searchTimeoutRef.current) {
              clearTimeout(searchTimeoutRef.current);
            }
            searchTimeoutRef.current = setTimeout(() => {
              setSearchQuery("");
            }, 1000);
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [isOpen, highlightedIndex, filteredOptions]);

  const toggleOpen = () => {
    if (disabled) return;
    
    if (!isOpen) {
      // Opening - update position immediately and set highlight to selected
      setTimeout(() => {
        updatePosition();
        if (selectedIndex >= 0) {
          setHighlightedIndex(selectedIndex);
        }
      }, 0);
    } else {
      // Closing - reset state
      setSearchQuery("");
      setHighlightedIndex(-1);
    }
    
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery("");
    setHighlightedIndex(-1);
    buttonRef.current?.focus();
  };

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
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby="select-label"
        className={`w-full px-4 py-3 rounded-xl transition-all outline-none text-left flex items-center justify-between ${
          isDarkMode 
            ? 'bg-gray-800'
            : 'bg-gray-50'
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-100"} ${
          isOpen ? "ring-2 ring-black" : ""
        }`}
        style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
      >
        <span className={selectedOption ? (isDarkMode ? "text-white" : "text-black") : (isDarkMode ? "text-gray-500" : "text-gray-400")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-5 h-5 transition-transform ${isDarkMode ? 'text-white' : 'text-black'} ${
            isOpen ? "rotate-180" : ""
          }`}
        />
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
              role="listbox"
              aria-label="Options"
              className={`fixed rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto ${
                isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              }`}
              style={{ 
                fontFamily: "'Doto', sans-serif", 
                fontWeight: "600",
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                width: `${dropdownPosition.width}px`,
                zIndex: 999999,
              }}
            >
              {filteredOptions.length === 0 ? (
                <div className={`px-4 py-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <p>No options found</p>
                  {searchQuery && (
                    <p className="text-sm mt-1">
                      for "{searchQuery}"
                    </p>
                  )}
                </div>
              ) : (
                filteredOptions.map((option, index) => (
                  <button
                    key={option.value}
                    ref={(el) => (optionRefs.current[index] = el)}
                    type="button"
                    role="option"
                    aria-selected={option.value === value}
                    onClick={() => handleOptionClick(option.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full px-4 py-3 text-left transition-all flex items-center justify-between ${
                      option.value === value
                        ? isDarkMode ? "bg-white text-black" : "bg-black text-white"
                        : highlightedIndex === index
                        ? isDarkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-black"
                        : isDarkMode ? "text-white hover:bg-gray-700" : "text-black hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{option.label}</div>
                      {option.subtitle && (
                        <div
                          className={`text-sm mt-0.5 truncate ${
                            option.value === value 
                              ? (isDarkMode ? "text-gray-700" : "text-gray-300") 
                              : (isDarkMode ? "text-gray-400" : "text-gray-500")
                          }`}
                          style={{ fontWeight: "400" }}
                        >
                          {option.subtitle}
                        </div>
                      )}
                    </div>
                    {option.value === value && <Check className="w-5 h-5 flex-shrink-0 ml-2" />}
                  </button>
                ))
              )}
              
              {searchQuery && (
                <div className={`px-4 py-2 text-xs border-t ${
                  isDarkMode ? 'bg-gray-900 text-gray-400 border-gray-700' : 'bg-gray-50 text-gray-500 border-gray-200'
                }`}>
                  Searching: "{searchQuery}"
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
