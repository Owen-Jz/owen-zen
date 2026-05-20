"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSound } from "@/components/SoundEffects";
import { cn } from "@/lib/utils";

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  delay: number;
  duration: number;
  size: number;
  shape: "square" | "circle" | "star";
}

const COLORS = [
  "var(--confetti-red, #ef4444)",
  "var(--confetti-orange, #f97316)",
  "var(--confetti-yellow, #eab308)",
  "var(--confetti-green, #22c55e)",
  "var(--confetti-blue, #3b82f6)",
  "var(--confetti-purple, #8b5cf6)",
  "var(--confetti-pink, #ec4899)"
];

// Confetti intensity levels
export type ConfettiIntensity = "small" | "medium" | "large";

const INTENSITY_CONFIG = {
  small: { count: 30, duration: 2, spread: 60 },
  medium: { count: 50, duration: 3, spread: 80 },
  large: { count: 80, duration: 4, spread: 100 },
} as const;

let confettiId = 0;

// Enhanced Confetti component with intensity levels
export const Confetti = ({
  trigger,
  intensity = "medium",
  className = "",
}: {
  trigger: number;
  intensity?: ConfettiIntensity;
  className?: string;
}) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const { playSuccess } = useSound();
  const config = INTENSITY_CONFIG[intensity];

  useEffect(() => {
    if (trigger > 0) {
      playSuccess();
      const newPieces: ConfettiPiece[] = [];
      const shapes: ConfettiPiece["shape"][] = ["square", "circle", "star"];

      for (let i = 0; i < config.count; i++) {
        newPieces.push({
          id: confettiId++,
          x: Math.random() * config.spread + (100 - config.spread) / 2,
          y: 0,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          rotation: Math.random() * 360,
          delay: Math.random() * 0.5,
          duration: config.duration + Math.random() * 2,
          size: 4 + Math.random() * 4,
          shape: shapes[Math.floor(Math.random() * shapes.length)],
        });
      }
      setPieces(newPieces);

      setTimeout(() => setPieces([]), (config.duration + 2) * 1000);
    }
  }, [trigger, config.count, config.duration, config.spread]);

  if (pieces.length === 0) return null;

  return createPortal(
    <div className={`fixed inset-0 pointer-events-none z-[100] overflow-hidden ${className}`}>
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          className="absolute"
          initial={{ y: -20, opacity: 1 }}
          animate={{
            y: "100vh",
            opacity: 0,
            rotate: piece.rotation + 720,
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: "easeOut",
          }}
          style={{
            left: `${piece.x}%`,
            top: "-20px",
            width: piece.size,
            height: piece.size,
          }}
        >
          <div
            className={cn(
              "w-full h-full",
              piece.shape === "circle" && "rounded-full",
              piece.shape === "star" && "clip-path-[polygon(50%_0%,61%_35%,98%_35%,68%_57%,79%_91%,50%_70%,21%_91%,32%_57%,2%_35%,39%_35%)]"
            )}
            style={{ backgroundColor: piece.color }}
          />
        </motion.div>
      ))}
    </div>,
    document.body
  );
};

// Animated confetti burst at a specific position
export const ConfettiBurst = ({
  trigger,
  x,
  y,
  intensity = "small",
}: {
  trigger: number;
  x: number;
  y: number;
  intensity?: ConfettiIntensity;
}) => {
  const config = INTENSITY_CONFIG[intensity];
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (trigger > 0) {
      const newPieces: ConfettiPiece[] = [];
      for (let i = 0; i < config.count; i++) {
        const angle = (Math.random() * 360) * (Math.PI / 180);
        const velocity = 100 + Math.random() * 200;
        newPieces.push({
          id: confettiId++,
          x: Math.cos(angle) * velocity,
          y: Math.sin(angle) * velocity,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          rotation: Math.random() * 360,
          delay: 0,
          duration: config.duration,
          size: 4 + Math.random() * 4,
          shape: "square",
        });
      }
      setPieces(newPieces);
      setTimeout(() => setPieces([]), config.duration * 1000);
    }
  }, [trigger, config.count, config.duration]);

  return createPortal(
    <div
      className="fixed pointer-events-none z-[100]"
      style={{ left: x, top: y }}
    >
      <AnimatePresence>
        {pieces.map((piece) => (
          <motion.div
            key={piece.id}
            className="absolute"
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: piece.x,
              y: piece.y + 200,
              opacity: 0,
              scale: 0.5,
            }}
            transition={{ duration: piece.duration, ease: "easeOut" }}
          >
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: piece.color }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
};

// Hook for managing confetti triggers with intensity levels
export const useConfetti = (defaultIntensity: ConfettiIntensity = "medium") => {
  const [trigger, setTrigger] = useState(0);
  const [intensity, setIntensity] = useState<ConfettiIntensity>(defaultIntensity);

  const fire = useCallback((customIntensity?: ConfettiIntensity) => {
    setIntensity(customIntensity || defaultIntensity);
    setTrigger((prev) => prev + 1);
  }, [defaultIntensity]);

  const fireSmall = useCallback(() => fire("small"), [fire]);
  const fireMedium = useCallback(() => fire("medium"), [fire]);
  const fireLarge = useCallback(() => fire("large"), [fire]);

  return {
    trigger,
    intensity,
    fire,
    fireSmall,
    fireMedium,
    fireLarge,
    ConfettiComponent: useMemo(
      () => () => <Confetti trigger={trigger} intensity={intensity} />,
      [trigger, intensity]
    ),
  };
};
