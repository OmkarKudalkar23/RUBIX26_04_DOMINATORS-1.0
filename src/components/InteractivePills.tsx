import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState } from "react";

interface Pill {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
}

export function InteractivePills() {
  const [pills, setPills] = useState<Pill[]>([]);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 35, stiffness: 80 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  // Generate random pills on mount
  useEffect(() => {
    const colors = [
      "#ffffff",
      "#e5e5e5",
      "#d4d4d4",
      "#a3a3a3",
      "#737373",
    ];

    const generatedPills: Pill[] = [];
    const pillCount = 200;

    for (let i = 0; i < pillCount; i++) {
      generatedPills.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        rotation: Math.random() * 360,
        scale: 0.3 + Math.random() * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    setPills(generatedPills);
  }, []);

  // Track mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Spotlight Effect */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          left: smoothMouseX,
          top: smoothMouseY,
          x: "-50%",
          y: "-50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 40%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />
      
      {pills.map((pill) => (
        <PillElement
          key={pill.id}
          pill={pill}
          mouseX={smoothMouseX}
          mouseY={smoothMouseY}
        />
      ))}
    </div>
  );
}

interface PillElementProps {
  pill: Pill;
  mouseX: any;
  mouseY: any;
}

function PillElement({ pill, mouseX, mouseY }: PillElementProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [distanceFromMouse, setDistanceFromMouse] = useState(1000);

  useEffect(() => {
    const unsubscribeX = mouseX.on("change", (latest: number) => {
      updateOffset(latest, mouseY.get());
    });

    const unsubscribeY = mouseY.on("change", (latest: number) => {
      updateOffset(mouseX.get(), latest);
    });

    return () => {
      unsubscribeX();
      unsubscribeY();
    };
  }, [mouseX, mouseY]);

  const updateOffset = (mx: number, my: number) => {
    if (typeof window === "undefined") return;

    // Calculate pill position in pixels
    const pillX = (pill.x / 100) * window.innerWidth;
    const pillY = (pill.y / 100) * window.innerHeight;

    // Calculate distance from mouse
    const dx = pillX - mx;
    const dy = pillY - my;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    setDistanceFromMouse(distance);

    // Apply repulsion effect (pills move away from cursor)
    const maxDistance = 250;
    if (distance < maxDistance) {
      const force = (1 - distance / maxDistance) * 50;
      const angle = Math.atan2(dy, dx);
      
      setOffset({
        x: Math.cos(angle) * force,
        y: Math.sin(angle) * force,
      });
    } else {
      setOffset({ x: 0, y: 0 });
    }
  };

  // Calculate opacity based on distance from cursor (spotlight effect)
  const spotlightRadius = 300;
  const opacity = distanceFromMouse < spotlightRadius 
    ? (1 - distanceFromMouse / spotlightRadius) * 0.6
    : 0.05;

  return (
    <motion.div
      className="absolute"
      style={{
        left: `${pill.x}%`,
        top: `${pill.y}%`,
        x: offset.x,
        y: offset.y,
        rotate: pill.rotation,
        scale: pill.scale,
      }}
      animate={{
        x: offset.x,
        y: offset.y,
      }}
      transition={{
        type: "spring",
        damping: 30,
        stiffness: 150,
      }}
    >
      <div
        className="w-4 h-1.5 rounded-full transition-opacity duration-200"
        style={{
          backgroundColor: pill.color,
          opacity: opacity,
          boxShadow: distanceFromMouse < spotlightRadius 
            ? `0 0 ${(1 - distanceFromMouse / spotlightRadius) * 10}px rgba(255,255,255,0.3)`
            : "none",
        }}
      />
    </motion.div>
  );
}