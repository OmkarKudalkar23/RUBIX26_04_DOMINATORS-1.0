import { motion } from "motion/react";
import { Heart } from "lucide-react";
import { forwardRef } from "react";
import { InteractivePills } from "./InteractivePills";

interface FooterProps {
  onGetStarted?: () => void;
}

export const Footer = forwardRef<HTMLDivElement, FooterProps>(({ onGetStarted }, ref) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer ref={ref} className="relative bg-black text-white">
      {/* Interactive Pills Background */}
      <InteractivePills />
      
      {/* Main Footer Content */}
      <div className="relative z-50 min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 py-20 pointer-events-none">
        {/* Empty space for the animated text to come here - Text animates from top-left to center */}
        <div className="mb-32 h-56"></div>

        {/* Get Started Button */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            console.log("Footer button clicked!");
            onGetStarted?.();
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative z-50 bg-white text-black rounded-full px-8 py-4 transition-all duration-300 hover:scale-105 cursor-pointer pointer-events-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          style={{
            fontFamily: "'Doto', sans-serif",
            fontWeight: "600",
            fontSize: "1rem",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          Get Started
        </motion.button>
      </div>

      {/* Bottom Bar - Copyright and Made with Love */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">
              © {currentYear} Health Sync. All rights reserved.
            </p>
            
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
              <span>for better healthcare</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";