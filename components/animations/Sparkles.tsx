"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Star {
  id: number;
  top: string;
  left: string;
  size: number;
  delay: number;
  duration: number;
}

export function Sparkles() {
  const [stars, setStars] = useState<Star[]>([]);

  // Generate after mount so SSR and first client render match (empty),
  // then animate stars in on the client.
  useEffect(() => {
    setStars(
      Array.from({ length: 18 }).map((_, i) => ({
        id: i,
        top: `${Math.random() * 90}%`,
        left: `${Math.random() * 95}%`,
        size: 6 + Math.random() * 14,
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 3,
      })),
    );
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((s) => (
        <motion.div
          key={s.id}
          className="absolute"
          style={{ top: s.top, left: s.left, width: s.size, height: s.size }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.7, 1.2, 0.7] }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="text-moon">
            <path d="M12 2l1.8 6.4L20 10l-6.2 1.6L12 18l-1.8-6.4L4 10l6.2-1.6L12 2z" />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

export function FloatingClouds() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute h-16 w-32 rounded-full bg-white/60 blur-xl"
          style={{ top: `${20 + i * 25}%`, left: `${-20 + i * 30}%` }}
          animate={{ x: ["0vw", "120vw"] }}
          transition={{
            duration: 40 + i * 10,
            repeat: Infinity,
            ease: "linear",
            delay: i * -10,
          }}
        />
      ))}
    </div>
  );
}
