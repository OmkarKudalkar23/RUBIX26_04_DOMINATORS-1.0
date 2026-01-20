import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "motion/react";

interface Feature {
  id: number;
  title: string;
  description: string;
  image: string;
}

interface FeaturesSectionProps {
  features: Feature[];
}

export function FeaturesSection({ features }: FeaturesSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeFeature, setActiveFeature] = useState(0);
  const [shouldStick, setShouldStick] = useState(true);
  const [hasScrolled, setHasScrolled] = useState(false);

  // Prevent flash on initial load
  useEffect(() => {
    const handleInitialScroll = () => {
      setHasScrolled(true);
    };

    // Only show features after user has scrolled past 150vh
    const checkScroll = () => {
      if (window.scrollY > window.innerHeight * 1.5) {
        setHasScrolled(true);
      }
    };

    checkScroll();
    window.addEventListener('scroll', checkScroll);

    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  // Track which feature is in view based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      // Check if we're in the features section
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerTop = containerRect.top;
      const containerBottom = containerRect.bottom;
      const viewportHeight = window.innerHeight;
      
      // Should stick only when we're actually IN the features section
      const shouldBeSticky = containerTop < viewportHeight * 0.2 && containerBottom > viewportHeight;
      setShouldStick(shouldBeSticky);
      
      const sections = containerRef.current.querySelectorAll('.feature-item');
      const containerTopOffset = containerRef.current.getBoundingClientRect().top + window.scrollY;
      const viewportCenter = window.scrollY + window.innerHeight / 2;
      
      sections.forEach((section, index) => {
        const element = section as HTMLElement;
        const top = containerTopOffset + element.offsetTop;
        const bottom = top + element.offsetHeight;
        
        if (viewportCenter >= top && viewportCenter <= bottom) {
          setActiveFeature(index);
        }
      });
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="relative bg-white"
      style={{
        opacity: hasScrolled ? 1 : 0,
        transition: 'opacity 0.5s ease-in-out'
      }}
    >
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-20">
          {/* Left Side - Scrolling Text */}
          <div className="w-full lg:w-1/2 space-y-0">
            {features.map((feature, index) => (
              <div
                key={feature.id}
                className="feature-item min-h-[60vh] lg:min-h-screen flex items-center py-6 sm:py-8 md:py-20"
              >
                <div className="max-w-full lg:max-w-lg">
                  <motion.div
                    className="inline-block mb-3 sm:mb-4 px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-100 rounded-full"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <span 
                      className="text-xs sm:text-sm tracking-wider uppercase"
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "600" }}
                    >
                      Feature {String(index + 1).padStart(2, '0')}
                    </span>
                  </motion.div>
                  
                  <motion.h3 
                    className="text-3xl sm:text-4xl md:text-5xl mb-4 sm:mb-6 text-black"
                    style={{ fontFamily: "'Doto', sans-serif", fontWeight: "785" }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    {feature.title}
                  </motion.h3>
                  
                  <motion.p 
                    className="text-base sm:text-lg text-gray-600 leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    {feature.description}
                  </motion.p>

                  {/* Mobile Image - Show on small screens */}
                  <motion.div 
                    className="block lg:hidden mt-8 rounded-2xl overflow-hidden shadow-xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-64 sm:h-80 object-cover"
                    />
                  </motion.div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Side - ONE STICKY IMAGE that stays throughout ALL features (Desktop Only) */}
          <div className="hidden lg:block lg:w-1/2 relative min-h-screen">
            <div 
              className={shouldStick ? "fixed top-[15vh] right-[10%] w-[40%] h-[70vh] flex items-center z-10" : "absolute bottom-[15vh] right-[10%] w-[90%] h-[70vh] flex items-center z-10"}
            >
              <div className="relative w-full h-[600px] rounded-3xl overflow-hidden shadow-2xl">
                {/* All images stacked, only active one shows */}
                {features.map((feat, idx) => (
                  <motion.div
                    key={feat.id}
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: activeFeature === idx ? 1 : 0,
                      scale: activeFeature === idx ? 1 : 1.05
                    }}
                    transition={{ 
                      duration: 0.7,
                      ease: [0.43, 0.13, 0.23, 0.96]
                    }}
                  >
                    <img
                      src={feat.image}
                      alt={feat.title}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                ))}

                {/* Decorative gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

                {/* Feature counter */}
                <motion.div 
                  className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl px-6 py-4 border border-slate-100"
                  animate={{
                    scale: [1, 1.05, 1]
                  }}
                  transition={{
                    duration: 0.3,
                    ease: "easeInOut"
                  }}
                  key={activeFeature}
                >
                  <div className="flex items-center gap-3">
                    <span 
                      className="text-4xl text-black"
                      style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
                    >
                      {String(activeFeature + 1).padStart(2, '0')}
                    </span>
                    <div className="h-8 w-px bg-slate-300" />
                    <span className="text-sm text-slate-600">
                      of {String(features.length).padStart(2, '0')}
                    </span>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}