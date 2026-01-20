import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import { Heart, Shield, Activity, Star, Pill, Stethoscope, Syringe, Cross } from "lucide-react";
import { ScratchCard } from "./ScratchCard";
import { FeaturesSection } from "./FeaturesSection";
import { Footer } from "./Footer";
import { LoginSignup } from "./LoginSignup";
import bgPattern from "figma:asset/b720884e725767e7e3ca1ac93cbbbf14a912150b.png";

interface LandingPageProps {
  onLogin: (userType: "patient" | "doctor" | "hospital") => void;
}

// Bubble configuration type
interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  depth: number;
  icon?: string; // Changed to string for emojis
  color: string;
  rotationSpeed: number;
  floatSpeed: number;
}

export function LandingPage({ onLogin }: LandingPageProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 1920, height: 1080 });
  const [footerScrollStart, setFooterScrollStart] = useState(5000);
  const [showLoginSignup, setShowLoginSignup] = useState(false);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const { scrollY } = useScroll();
  const footerRef = useRef<HTMLDivElement>(null);

  // Generate bubbles on mount - ULTRA OPTIMIZED: Responsive grid
  useEffect(() => {
    const generateBubbles = () => {
      const medicalEmojis = ['💊', '💉', '🩺', '⚕️', '❤️', '🏥', '🧬', '🩹'];

      const newBubbles: Bubble[] = [];

      // Responsive grid based on screen width
      const screenWidth = window.innerWidth;
      let cols, rows;

      if (screenWidth < 640) {
        // Mobile: 5x6 = 30 bubbles
        cols = 5;
        rows = 6;
      } else if (screenWidth < 1024) {
        // Tablet: 7x7 = 49 bubbles
        cols = 7;
        rows = 7;
      } else {
        // Desktop: 10x9 = 90 bubbles
        cols = 10;
        rows = 9;
      }

      const spacingX = 100 / cols;
      const spacingY = 100 / rows;

      let id = 0;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const hasEmoji = Math.random() > 0.7; // 30% chance
          const depth = 0.3 + Math.random() * 0.7;

          // Responsive bubble size
          let baseSize, sizeVariation;
          if (screenWidth < 640) {
            baseSize = 35;
            sizeVariation = 25;
          } else if (screenWidth < 1024) {
            baseSize = 40;
            sizeVariation = 30;
          } else {
            baseSize = 45;
            sizeVariation = 35;
          }

          newBubbles.push({
            id: id++,
            x: (col * spacingX) + (spacingX / 2) + (Math.random() - 0.5) * 2,
            y: (row * spacingY) + (spacingY / 2) + (Math.random() - 0.5) * 2,
            size: baseSize + Math.random() * sizeVariation,
            depth: depth,
            icon: hasEmoji ? medicalEmojis[Math.floor(Math.random() * medicalEmojis.length)] : undefined,
            color: 'from-pink-50/50 to-rose-50/50',
            rotationSpeed: 5 + Math.random() * 10,
            floatSpeed: 4 + Math.random() * 3,
          });
        }
      }

      setBubbles(newBubbles);
    };

    generateBubbles();

    // Regenerate bubbles on resize for responsive grid
    const handleResize = () => {
      generateBubbles();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const updateCanvasSize = () => {
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // More aggressive mouse tracking throttle
  useEffect(() => {
    let lastUpdate = 0;
    const throttleDelay = 100; // Increased to 100ms for better performance

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();

      if (now - lastUpdate < throttleDelay) {
        return;
      }

      lastUpdate = now;

      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const updateFooterPosition = () => {
      if (footerRef.current) {
        const footerTop = footerRef.current.offsetTop;
        setFooterScrollStart(footerTop - 300);
      }
    };

    updateFooterPosition();
    window.addEventListener('resize', updateFooterPosition);

    return () => window.removeEventListener('resize', updateFooterPosition);
  }, []);

  const bgOpacity = useTransform(scrollY, [300, 500, 1000, 1200], [0, 0.3, 0.3, 0]);

  const textScale = useTransform(
    scrollY,
    [0, 400, footerScrollStart, footerScrollStart + 300],
    [1, 0.18, 0.18, 0.8]
  );

  const textX = useTransform(
    scrollY,
    [0, 400, footerScrollStart, footerScrollStart + 300],
    [0, typeof window !== 'undefined' ? -window.innerWidth * 0.35 : -600, typeof window !== 'undefined' ? -window.innerWidth * 0.35 : -600, 0]
  );

  const textY = useTransform(
    scrollY,
    [0, 400, footerScrollStart, footerScrollStart + 300],
    [0, typeof window !== 'undefined' ? -window.innerHeight * 0.42 : -280, typeof window !== 'undefined' ? -window.innerHeight * 0.42 : -280, typeof window !== 'undefined' ? -window.innerHeight * 0.15 : -100]
  );

  const textColorProgress = useTransform(
    scrollY,
    [footerScrollStart, footerScrollStart + 150],
    [0, 1]
  );

  const subtitleOpacity = useTransform(scrollY, [0, 200], [1, 0]);
  const imagesOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const statsOpacity = useTransform(scrollY, [300, 500, 800, 1000], [0, 1, 1, 0]);

  const footerSubtitleOpacity = useTransform(
    scrollY,
    [footerScrollStart + 150, footerScrollStart + 300],
    [0, 1]
  );

  const features = [
    {
      id: 1,
      title: "Virtual Consultations",
      description: "Connect with top medical professionals from the comfort of your home. Our telemedicine platform provides secure, high-quality video consultations with specialists across all medical fields.",
      image: "https://images.unsplash.com/photo-1758691463606-1493d79cc577?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWxlbWVkaWNpbmUlMjB2aWRlbyUyMGNhbGwlMjBkb2N0b3J8ZW58MXx8fHwxNzYzOTY5OTUwfDA&ixlib=rb-4.1.0&q=80&w=1080"
    },
    {
      id: 2,
      title: "AI-Powered Diagnosis",
      description: "Leverage cutting-edge artificial intelligence to assist in accurate diagnosis. Our AI systems analyze medical data to provide insights and recommendations, supporting doctors in delivering the best care.",
      image: "https://images.unsplash.com/photo-1758202292826-c40e172eed1c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwQUklMjB0ZWNobm9sb2d5JTIwaGVhbHRoY2FyZXxlbnwxfHx8fDE3NjM5Njk5NTJ8MA&ixlib=rb-4.1.0&q=80&w=1080"
    },
    {
      id: 3,
      title: "Digital Health Records",
      description: "Access your complete medical history anytime, anywhere. Our secure cloud-based system keeps all your health records organized and accessible to authorized healthcare providers instantly.",
      image: "https://images.unsplash.com/photo-1758691462620-9018c602ed3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXRpZW50JTIwcmVjb3JkcyUyMGRpZ2l0YWwlMjBoZWFsdGh8ZW58MXx8fHwxNzYzOTY5OTUyfDA&ixlib=rb-4.1.0&q=80&w=1080"
    },
    {
      id: 4,
      title: "Smart Scheduling",
      description: "Book appointments effortlessly with our intelligent scheduling system. Get matched with the right specialist, find available time slots, and receive automated reminders for your appointments.",
      image: "https://images.unsplash.com/photo-1643264560215-9c2f72485ca1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGhjYXJlJTIwYXBwb2ludG1lbnQlMjBzY2hlZHVsaW5nfGVufDF8fHx8MTc2Mzk2OTk1Mnww&ixlib=rb-4.1.0&q=80&w=1080"
    }
  ];

  return (
    <div className="relative min-h-[300vh] bg-white overflow-hidden">
      {/* Background Pattern - Appears on Scroll */}
      <motion.div
        className="fixed inset-0 z-0"
        style={{ opacity: bgOpacity }}
      >
        <div
          className="w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: `url(${bgPattern})`,
          }}
        />
      </motion.div>

      {/* Text that moves to top left on scroll and stays fixed */}
      <motion.div
        className="fixed inset-0 flex items-center justify-center z-20 pointer-events-none"
      >
        <motion.div
          style={{
            x: textX,
            y: textY,
            scale: textScale,
          }}
        >
          <div className="text-center relative">
            <motion.h1
              className="relative whitespace-nowrap"
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{ duration: 0.5 }}
              style={{
                fontSize: "clamp(5rem, 15vw, 13rem)",
                fontFamily: "'Doto', sans-serif",
                fontWeight: "785",
                letterSpacing: "0.05em",
                lineHeight: "0.9",
                textTransform: "uppercase",
                color: useTransform(textColorProgress, [0, 1], ['#000000', '#ffffff']),
              }}
            >
              HEALTH
            </motion.h1>

            <motion.h1
              className="relative whitespace-nowrap"
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{ duration: 0.5 }}
              style={{
                fontSize: "clamp(5rem, 15vw, 13rem)",
                fontFamily: "'Doto', sans-serif",
                fontWeight: "785",
                letterSpacing: "0.05em",
                lineHeight: "0.9",
                textTransform: "uppercase",
                marginTop: "0.5rem",
                color: useTransform(textColorProgress, [0, 1], ['#000000', '#ffffff']),
              }}
            >
              SYNC
            </motion.h1>

            <motion.p
              className="tracking-widest uppercase"
              style={{
                fontSize: "1rem",
                letterSpacing: "0.3em",
                marginTop: "2rem",
                textTransform: "uppercase",
                opacity: footerSubtitleOpacity,
                color: useTransform(textColorProgress, [0, 1], ['#6b7280', '#ffffff']),
              }}
            >
              Healthcare Reimagined
            </motion.p>
          </div>
        </motion.div>
      </motion.div>

      {/* 3D Animated Medical Spheres Field - OPTIMIZED with Hardware Acceleration */}
      <motion.div
        className="fixed inset-0 z-10 pointer-events-none overflow-hidden"
        style={{
          opacity: imagesOpacity,
          transform: 'translateZ(0)', // Hardware acceleration
          willChange: 'opacity',
        }}
      >
        {bubbles.map((bubble) => {
          const Icon = bubble.icon;
          const parallaxMultiplier = 20 + (bubble.depth * 80);
          const scaleMultiplier = 0.6 + (bubble.depth * 0.7);

          return (
            <motion.div
              key={bubble.id}
              initial={{ opacity: 0.8, scale: 1 }}
              animate={{ opacity: 0.8, scale: 1 }}
              transition={{ delay: bubble.id * 0.003, duration: 0.6, ease: "easeOut" }}
              className="absolute"
              style={{
                left: `${bubble.x}%`,
                top: `${bubble.y}%`,
                width: `${bubble.size * scaleMultiplier}px`,
                height: `${bubble.size * scaleMultiplier}px`,
                transform: 'translate3d(0, 0, 0)',
                willChange: 'transform',
              }}
            >
              <motion.div
                animate={{
                  x: mousePosition.x * parallaxMultiplier,
                  y: mousePosition.y * parallaxMultiplier,
                }}
                transition={{
                  type: "tween",
                  duration: 0.4,
                  ease: "linear",
                }}
                className="relative w-full h-full"
                style={{
                  transform: 'translate3d(0, 0, 0)',
                  willChange: 'transform',
                }}
              >
                {/* Floating animation wrapper - NOW USING CSS */}
                <div
                  className={`relative w-full h-full bubble-float-${Math.floor(bubble.depth * 8) + 1}`}
                  style={{
                    transform: 'translate3d(0, 0, 0)',
                  }}
                >
                  {/* 3D Sphere with gradient and shadow - RESTORED */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${bubble.color} rounded-full`}
                    style={{
                      boxShadow: `
                        0 ${10 + bubble.depth * 20}px ${30 + bubble.depth * 40}px rgba(0,0,0,${0.08 + bubble.depth * 0.1}),
                        inset 0 -${5 + bubble.depth * 10}px ${15 + bubble.depth * 20}px rgba(255,255,255,${0.3 + bubble.depth * 0.2}),
                        inset 0 ${5 + bubble.depth * 10}px ${15 + bubble.depth * 20}px rgba(0,0,0,${0.05 + bubble.depth * 0.1})
                      `,
                      transform: 'translateZ(0)',
                    }}
                  />

                  {/* Inner glow for 3D effect - RESTORED */}
                  <div
                    className="absolute inset-[15%] rounded-full opacity-40"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,${0.6 + bubble.depth * 0.4}), transparent 70%)`,
                    }}
                  />

                  {/* Emoji if present */}
                  {Icon && (
                    <div
                      className="absolute inset-0 flex items-center justify-center text-center"
                      style={{
                        fontSize: `${(bubble.size * scaleMultiplier) * 0.45}px`,
                        opacity: 0.8,
                        filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.1))`,
                        transform: 'translateZ(0)',
                      }}
                    >
                      {Icon}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        style={{ opacity: imagesOpacity }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 pointer-events-none"
      >
        <span className="text-gray-500 text-xs tracking-widest uppercase">Scroll to explore</span>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-6 h-10 border-2 border-gray-400 rounded-full flex items-start justify-center p-2"
        >
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
        </motion.div>
      </motion.div>

      {/* Left Side Content - Appears on Scroll */}
      <motion.div
        className="fixed left-4 sm:left-8 md:left-12 top-1/2 -translate-y-1/2 z-30 max-w-xs sm:max-w-md hidden lg:block"
        style={{ opacity: statsOpacity }}
      >
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-4">
            {/* HEALTHCARE with typing animation */}
            <motion.span
              className="block uppercase tracking-tight overflow-hidden"
              style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {"HEALTHCARE".split("").map((char, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.08 }}
                >
                  {char}
                </motion.span>
              ))}
            </motion.span>

            {/* MADE with typing animation */}
            <motion.span
              className="block uppercase tracking-tight overflow-hidden"
              style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
            >
              {"MADE".split("").map((char, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 1.1 + index * 0.08 }}
                >
                  {char}
                </motion.span>
              ))}
            </motion.span>

            {/* simple with typing animation and metal shining effect */}
            <motion.span
              className="block tracking-tight relative"
              style={{
                fontFamily: "'Dancing Script', cursive",
                fontWeight: "700",
              }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              {"simple".split("").map((char, index) => (
                <motion.span
                  key={index}
                  className="inline-block relative overflow-hidden"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 1.5 + index * 0.08 }}
                >
                  <motion.span
                    className="relative inline-block"
                    animate={{
                      backgroundPosition: ["0% center", "200% center"],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    style={{
                      background: "linear-gradient(90deg, #000000 0%, #000000 40%, #ffffff 50%, #000000 60%, #000000 100%)",
                      backgroundSize: "200% 100%",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      color: "transparent",
                    }}
                  >
                    {char}
                  </motion.span>
                </motion.span>
              ))}
            </motion.span>
          </div>

          {/* Button appears after typing animation completes */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowLoginSignup(true)}
            className="mt-6 md:mt-8 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 md:px-8 md:py-4 rounded-xl shadow-lg transition-all uppercase tracking-wide text-sm md:text-base pointer-events-auto"
            style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
          >
            Get Started
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Mobile Version - Second Section Content */}
      <motion.div
        className="lg:hidden fixed inset-0 z-30 flex items-center justify-center px-6"
        style={{ opacity: statsOpacity }}
      >
        <div className="text-center">
          {/* Title */}
          <motion.div
            className="text-4xl sm:text-5xl mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span
              className="block uppercase tracking-tight"
              style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
            >
              HEALTHCARE
            </span>
            <span
              className="block uppercase tracking-tight"
              style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
            >
              MADE
            </span>
            <span
              className="block tracking-tight"
              style={{
                fontFamily: "'Dancing Script', cursive",
                fontWeight: "700",
              }}
            >
              simple
            </span>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            className="grid grid-cols-2 gap-4 mb-8 max-w-sm mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="bg-white rounded-2xl shadow-xl p-4 border border-slate-100">
              <div className="text-3xl mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>50K+</div>
              <div className="text-xs text-slate-600">Patients</div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-4 border border-slate-100">
              <div className="text-3xl mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>1000+</div>
              <div className="text-xs text-slate-600">Doctors</div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-4 border border-slate-100 col-span-2">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Star className="w-6 h-6 text-amber-500 fill-amber-500" strokeWidth={1.5} />
                <span className="text-3xl" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>4.9</span>
              </div>
              <div className="text-xs text-slate-600">Rating</div>
            </div>
          </motion.div>

          {/* Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowLoginSignup(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl shadow-lg transition-all uppercase tracking-wide text-sm pointer-events-auto"
            style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
          >
            Get Started
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Bento Grid - Desktop - Removed for brevity but would be here */}
      <motion.div
        className="fixed right-4 sm:right-8 md:right-12 top-1/2 -translate-y-1/2 z-30 w-[85%] sm:w-[60%] md:w-[50%] max-w-2xl hidden lg:block"
        style={{ opacity: statsOpacity }}
      >
        <div className="relative h-[400px] sm:h-[450px] md:h-[500px]">
          {/* Floating Background Blobs */}
          <motion.div
            className="absolute -top-10 -left-10 w-32 h-32 bg-gradient-to-br from-slate-200 to-slate-300 rounded-3xl opacity-20 blur-3xl"
            animate={{
              y: [0, -20, 0],
              rotate: [0, 10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-br from-slate-200 to-slate-300 rounded-3xl opacity-20 blur-3xl"
            animate={{
              y: [0, 20, 0],
              rotate: [0, -10, 0],
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: 9,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* 50K+ Patients Card - Top Left */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            className="absolute -top-4 sm:-top-6 -left-4 sm:-left-6 z-20"
          >
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-5 w-28 sm:w-32 md:w-36 border border-slate-100">
              <div className="text-2xl sm:text-3xl md:text-4xl mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>50K+</div>
              <div className="text-xs sm:text-sm text-slate-600">Patients</div>
            </div>
          </motion.div>

          {/* 1000+ Doctors Card - Top Right */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            className="absolute -top-3 sm:-top-4 -right-4 sm:-right-6 z-20"
          >
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-5 w-32 sm:w-36 md:w-40 border border-slate-100">
              <div className="text-2xl sm:text-3xl md:text-4xl mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>1000+</div>
              <div className="text-xs sm:text-sm text-slate-600">Doctors</div>
            </div>
          </motion.div>

          {/* 4.9 Rating Card - Bottom Left */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            className="absolute -bottom-4 sm:-bottom-6 left-4 sm:left-8 z-20"
          >
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-5 w-28 sm:w-32 md:w-36 border border-slate-100">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-amber-500 fill-amber-500" strokeWidth={1.5} />
                <span className="text-2xl sm:text-2xl md:text-3xl" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>4.9</span>
              </div>
              <div className="text-xs sm:text-sm text-slate-600">Rating</div>
            </div>
          </motion.div>

          {/* Main Doctor Image - Top Left Overlapping */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: -20 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="absolute top-0 left-0 w-[60%] h-[55%] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-2 sm:border-4 border-white z-10"
          >
            <img
              src="https://images.unsplash.com/photo-1758691461990-03b49d969495?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2N0b3IlMjB3cml0aW5nJTIwbWVkaWNhbCUyMGNoYXJ0fGVufDF8fHx8MTc2Mzk2NDg0OXww&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Medical Professional"
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Medical Scan Image - Bottom Right Overlapping */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="absolute bottom-0 right-0 w-[60%] h-[60%] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-2 sm:border-4 border-white"
          >
            <img
              src="https://images.unsplash.com/photo-1723460040851-8b3501811d29?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwTVJJJTIwc2NhbiUyMG1hY2hpbmV8ZW58MXx8fHwxNzYzOTY0ODQ5fDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Medical Equipment"
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Heart Icon - Floating Small Square */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="absolute top-16 sm:top-20 right-6 sm:right-8 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl z-20"
            animate={{
              y: [-10, 10, -10],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Heart className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-red-500 fill-red-500" strokeWidth={1.5} />
          </motion.div>

          {/* Shield Icon - Floating Small Square */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="absolute top-1/2 left-4 sm:left-6 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl z-20"
            animate={{
              y: [-8, 8, -8],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          >
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-blue-500" strokeWidth={1.5} />
          </motion.div>

          {/* Activity Icon - Floating Small Square */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="absolute bottom-24 sm:bottom-28 right-8 sm:right-12 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl z-20"
            animate={{
              y: [-6, 6, -6],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
          >
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-green-500" strokeWidth={1.5} />
          </motion.div>
        </div>
      </motion.div>

      {/* About Us Section - Scratch Card Reveal */}
      <div className="relative bg-white" style={{ marginTop: "200vh" }}>
        <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 md:px-12 relative">
          {/* About Us Content */}
          <div className="max-w-5xl mx-auto py-12 sm:py-16 md:py-20 relative z-0">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-8 sm:mb-10 md:mb-12 text-center text-black"
              style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}
            >
              ABOUT US
            </motion.h2>

            <div className="space-y-6 sm:space-y-8 text-black text-base sm:text-lg leading-relaxed px-4 sm:px-0">
              <p>
                Health Sync is revolutionizing the healthcare industry with cutting-edge technology
                and compassionate care. Our platform connects patients with top medical professionals,
                making healthcare accessible, efficient, and personalized for everyone.
              </p>

              <p>
                With over 50,000 satisfied patients and a network of 1,000+ qualified doctors, we've
                built a trusted ecosystem that prioritizes your health and well-being. Our 4.9-star
                rating reflects our commitment to excellence in every interaction.
              </p>

              <p>
                Founded on the principle that healthcare should be simple, transparent, and available
                to all, Health Sync leverages advanced AI and telemedicine to bridge the gap between
                patients and providers. Experience the future of healthcare today.
              </p>
            </div>
          </div>

          {/* Instruction Text */}
          <div className="absolute top-12 sm:top-16 md:top-20 left-1/2 -translate-x-1/2 text-center z-[100] pointer-events-none px-4">
            <p className="text-white text-xs sm:text-sm md:text-base tracking-wider uppercase">
              Click and drag to reveal our story
            </p>
          </div>

          {/* Scratch Card Overlay */}
          <ScratchCard
            width={canvasSize.width}
            height={canvasSize.height}
          />
        </div>
      </div>

      {/* Features Section */}
      <FeaturesSection features={features} />

      {/* Footer */}
      <Footer ref={footerRef} onGetStarted={() => setShowLoginSignup(true)} />

      {/* Login/Signup Modal */}
      <AnimatePresence>
        {showLoginSignup && (
          <LoginSignup
            onClose={() => setShowLoginSignup(false)}
            onLogin={(type) => {
              setShowLoginSignup(false);
              onLogin(type);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}