import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageCircle, X, Send, Mic, Bot, User, Loader2 } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface ChatbotProps {
  userType: "patient" | "doctor" | "hospital";
}

export function Chatbot({ userType }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: getWelcomeMessage(userType),
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function getWelcomeMessage(type: "patient" | "doctor" | "hospital") {
    switch (type) {
      case "patient":
        return "Hello! I'm your Health Sync AI assistant. I can help you book appointments, track medications, view health records, and answer health-related questions. How can I assist you today?";
      case "doctor":
        return "Welcome, Doctor! I can help you manage patient records, view appointments, access medical histories, and provide clinical insights. What would you like to do?";
      case "hospital":
        return "Hello! I'm your Hospital Management AI. I can help with bed allocation, staff scheduling, surge predictions, and operational insights. How may I assist you?";
    }
  }

  function generateBotResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();

    // Common responses
    if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
      return "Hello! How can I help you today?";
    }

    // Patient-specific responses
    if (userType === "patient") {
      if (lowerMessage.includes("book") || lowerMessage.includes("appointment")) {
        return "I can help you book an appointment! Please go to the 'Book Appointment' section in your dashboard. You can search for doctors by specialization, check available slots, and book instantly. Would you like me to guide you through the process?";
      }
      if (lowerMessage.includes("medicine") || lowerMessage.includes("medication") || lowerMessage.includes("prescription")) {
        return "For medication management, you can:\n\n1. Upload prescriptions in the 'Prescriptions' tab\n2. Set automatic reminders\n3. Track your medicine adherence\n4. Purchase medicines from our pharmacy section\n\nWould you like help with any of these?";
      }
      if (lowerMessage.includes("doctor") && lowerMessage.includes("find")) {
        return "To find a doctor:\n\n1. Go to 'Book Appointment'\n2. Search by specialization (e.g., Cardiology, Dermatology)\n3. View doctor profiles, ratings, and experience\n4. Check available time slots\n5. Book your appointment\n\nWhat specialization are you looking for?";
      }
      if (lowerMessage.includes("health") && (lowerMessage.includes("record") || lowerMessage.includes("data"))) {
        return "Your health records include:\n\n• Medical history\n• Prescriptions and medications\n• Lab reports and vitals\n• Appointment history\n• Family health information\n\nAll data is securely stored and only accessible by you and your authorized healthcare providers.";
      }
      if (lowerMessage.includes("emergency") || lowerMessage.includes("urgent")) {
        return "⚠️ For medical emergencies:\n\n1. Call emergency services immediately (911)\n2. Use the 'Emergency Contacts' section in your dashboard\n3. Find nearest hospitals with directions\n\nFor urgent but non-emergency care, you can book a priority appointment with available doctors.";
      }
      if (lowerMessage.includes("family") || lowerMessage.includes("member")) {
        return "You can manage family members in the 'Family' tab:\n\n• Add family members\n• Track their health records\n• Book appointments for them\n• Set medication reminders\n• View their medical history\n\nWould you like to add a family member?";
      }
      if (lowerMessage.includes("reminder") || lowerMessage.includes("notification")) {
        return "Medicine reminders help you stay on track! When you upload a prescription, we automatically:\n\n1. Extract medicine details\n2. Set up reminder schedules\n3. Send notifications at the right time\n4. Track your adherence\n\nYou can manage reminders in the 'Reminders' tab.";
      }
    }

    // Doctor-specific responses
    if (userType === "doctor") {
      if (lowerMessage.includes("patient") && lowerMessage.includes("history")) {
        return "To view patient history:\n\n1. Go to the 'Patients' tab\n2. Search for the patient\n3. View their complete medical record:\n   • Past prescriptions\n   • Medication adherence\n   • Previous appointments\n   • Lab reports\n   • Chronic conditions\n\nAll information is updated in real-time.";
      }
      if (lowerMessage.includes("appointment")) {
        return "Your appointments are displayed in the dashboard. You can:\n\n• View today's schedule\n• Accept/reject appointment requests\n• Reschedule appointments\n• Mark appointments as completed\n• Add clinical notes\n\nPriority is automatically given to emergency cases.";
      }
      if (lowerMessage.includes("prescription") || lowerMessage.includes("prescribe")) {
        return "To create a prescription:\n\n1. Select the patient\n2. Add medications with dosage and frequency\n3. Specify duration\n4. Add special instructions\n5. Upload directly to patient's record\n\nThe system will automatically set up medicine reminders for the patient.";
      }
      if (lowerMessage.includes("alert") || lowerMessage.includes("risk")) {
        return "I provide risk alerts based on:\n\n• Environmental factors (AQI, pollution)\n• Seasonal trends (flu, dengue)\n• Patient conditions (COPD, asthma)\n• Local health data\n\nYou'll receive proactive notifications about at-risk patients.";
      }
      if (lowerMessage.includes("schedule") || lowerMessage.includes("slot")) {
        return "Manage your schedule in the 'Schedule' section:\n\n• Set available time slots\n• Block specific times\n• View booking status\n• Configure working hours\n• Manage multiple locations\n\nYour schedule syncs across all platforms.";
      }
    }

    // Hospital-specific responses
    if (userType === "hospital") {
      if (lowerMessage.includes("bed") || lowerMessage.includes("capacity")) {
        return "Bed Management features:\n\n• Real-time bed availability\n• Occupancy rates by ward\n• Quick admit/discharge\n• Bed allocation optimization\n• Capacity planning\n\nGo to 'Bed Management' to manage all bed types: ICU, General, Private, and Emergency.";
      }
      if (lowerMessage.includes("doctor") && lowerMessage.includes("slot")) {
        return "Doctor Slot Management:\n\n• Configure OPD schedules\n• Manage multiple doctors\n• Block/unblock time slots\n• View booking status\n• Handle appointment requests\n\nAll changes update in real-time for patients.";
      }
      if (lowerMessage.includes("staff") || lowerMessage.includes("employee")) {
        return "Staff Allocation features:\n\n• View all staff members\n• Track active/on-leave status\n• Manage shift schedules\n• Department-wise allocation\n• Role-based assignments\n\nEfficient staff management ensures optimal patient care.";
      }
      if (lowerMessage.includes("surge") || lowerMessage.includes("prediction")) {
        return "AI-Powered Surge Predictions:\n\n• Environmental data analysis (AQI, weather)\n• Seasonal disease patterns\n• Festival/event impacts\n• Expected patient load\n• Resource recommendations\n\nPrepare for surges before they happen with actionable insights.";
      }
      if (lowerMessage.includes("alert") || lowerMessage.includes("notification")) {
        return "Configure alerts in Settings:\n\n• Set AQI thresholds\n• Temperature warnings\n• Surge percentage triggers\n• Enable/disable alert types\n• Customize notification preferences\n\nStay informed about critical situations.";
      }
      if (lowerMessage.includes("report") || lowerMessage.includes("analytics")) {
        return "Access comprehensive reports:\n\n• Bed occupancy trends\n• Appointment statistics\n• Department-wise patient flow\n• Staff utilization\n• Revenue analytics\n\nData-driven insights for better hospital management.";
      }
    }

    // General health queries
    if (lowerMessage.includes("symptom") || lowerMessage.includes("sick") || lowerMessage.includes("pain")) {
      return "I'm not a replacement for professional medical advice. For any health concerns:\n\n1. Book an appointment with a doctor\n2. For emergencies, call 911 immediately\n3. Use the symptom checker (coming soon) for guidance\n\nWould you like me to help you book an appointment?";
    }

    // Help/Support
    if (lowerMessage.includes("help") || lowerMessage.includes("support")) {
      return getWelcomeMessage(userType) + "\n\nYou can also:\n• Contact support: support@healthsync.com\n• Call: 1-800-HEALTH-1\n• Visit our Help Center";
    }

    // Default response
    return "I understand you're asking about that. Could you please provide more details or try asking in a different way? I'm here to help with:\n\n" + getDefaultSuggestions(userType);
  }

  function getDefaultSuggestions(type: "patient" | "doctor" | "hospital"): string {
    switch (type) {
      case "patient":
        return "• Booking appointments\n• Managing medications\n• Viewing health records\n• Finding doctors\n• Emergency assistance";
      case "doctor":
        return "• Patient records\n• Appointment management\n• Prescriptions\n• Risk alerts\n• Schedule management";
      case "hospital":
        return "• Bed management\n• Doctor slots\n• Staff allocation\n• Surge predictions\n• Reports & analytics";
    }
  }

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateBotResponse(inputValue),
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-[100] w-14 h-14 bg-black text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-gray-800 transition-colors"
          >
            <MessageCircle className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-6 right-6 z-[100] w-96 max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-2rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
          >
            {/* Header */}
            <div className="bg-black text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3
                    className="uppercase tracking-wide"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                  >
                    Health Sync AI
                  </h3>
                  <p className="text-xs text-white/80">Always here to help</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${
                    message.sender === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.sender === "user"
                        ? "bg-black text-white"
                        : "bg-white text-black border border-gray-200"
                    }`}
                  >
                    {message.sender === "user" ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      message.sender === "user"
                        ? "bg-black text-white"
                        : "bg-white text-gray-900 border border-gray-200"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.sender === "user" ? "text-white/60" : "text-gray-400"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2"
                >
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-gray-200">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white rounded-2xl px-4 py-3 border border-gray-200">
                    <div className="flex gap-1">
                      <motion.div
                        className="w-2 h-2 bg-gray-400 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-gray-400 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-gray-400 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 bg-gray-50 rounded-xl outline-none text-sm"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                AI-powered assistant • Not a replacement for medical advice
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}