import { motion } from "motion/react";

export function HeartbeatLoader() {
  // ECG heartbeat pattern coordinates (representing an ECG waveform)
  const heartbeatDots = [
    { x: 0, y: 50 },
    { x: 10, y: 50 },
    { x: 20, y: 50 },
    { x: 30, y: 50 },
    { x: 40, y: 50 },
    // P wave (small bump)
    { x: 50, y: 45 },
    { x: 60, y: 40 },
    { x: 70, y: 45 },
    { x: 80, y: 50 },
    // PR segment
    { x: 90, y: 50 },
    { x: 100, y: 50 },
    // QRS complex (sharp spike)
    { x: 110, y: 55 },
    { x: 120, y: 70 },
    { x: 130, y: 20 },
    { x: 140, y: 75 },
    { x: 150, y: 50 },
    // ST segment
    { x: 160, y: 50 },
    { x: 170, y: 50 },
    // T wave (medium bump)
    { x: 180, y: 45 },
    { x: 190, y: 35 },
    { x: 200, y: 40 },
    { x: 210, y: 45 },
    { x: 220, y: 50 },
    // Flat line
    { x: 230, y: 50 },
    { x: 240, y: 50 },
    { x: 250, y: 50 },
    { x: 260, y: 50 },
    { x: 270, y: 50 },
  ];

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center">
        {/* ECG Pattern */}
        <div className="relative w-[280px] h-[100px] mx-auto mb-8">
          {/* Baseline reference line */}
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gray-200" />
          
          {/* Animated heartbeat dots */}
          <svg width="280" height="100" className="relative">
            {heartbeatDots.map((dot, index) => (
              <motion.circle
                key={index}
                cx={dot.x}
                cy={dot.y}
                r="2.5"
                fill="black"
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1, 1, 0],
                }}
                transition={{
                  duration: 2,
                  delay: index * 0.05,
                  repeat: Infinity,
                  repeatDelay: 0.5,
                  ease: "easeInOut",
                }}
              />
            ))}
          </svg>

          {/* Scanning line effect */}
          <motion.div
            className="absolute top-0 bottom-0 w-[2px] bg-black/20"
            initial={{ left: 0 }}
            animate={{
              left: ["0%", "100%"],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              repeatDelay: 0.5,
              ease: "linear",
            }}
          />
        </div>

        {/* Loading text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2
            className="text-2xl mb-2"
            style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}
          >
            HEALTH SYNC
          </h2>
          <div className="flex items-center justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-black"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [1, 0.5, 1],
                }}
                transition={{
                  duration: 1,
                  delay: i * 0.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
