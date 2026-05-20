"use client";

import { motion } from "framer-motion";

interface PulseDotProps {
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

/**
 * A small animated dot for "live" indicators.
 * Gentle pulse animation for things like "online", "recording", "active now".
 * Subtle scale pulse, not jarring.
 */
export function PulseDot({
  color,
  size = "md",
  className = "",
  label,
}: PulseDotProps) {
  const sizeMap = {
    sm: 6,
    md: 8,
    lg: 12,
  };

  const dotSize = sizeMap[size];
  const rgb = color ? `0, 0, 0` : "var(--primary-rgb, 99, 102, 241)";
  const dotColor = color || "var(--primary)";

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Outer pulse ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: dotSize * 2,
          height: dotSize * 2,
          backgroundColor: `rgba(${rgb}, 0.3)`,
        }}
        animate={{
          scale: [1, 1.8, 1],
          opacity: [0.6, 0, 0.6],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeOut",
        }}
      />

      {/* Inner dot */}
      <motion.div
        className="relative rounded-full"
        style={{
          width: dotSize,
          height: dotSize,
          backgroundColor: dotColor,
          boxShadow: `0 0 ${dotSize}px rgba(${rgb}, 0.5)`,
        }}
        animate={{
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Accessible label */}
      {label && <span className="sr-only">{label}</span>}
    </div>
  );
}

/**
 * Status indicator with label
 */
export function StatusIndicator({
  status,
  label,
  className = "",
}: {
  status: "online" | "offline" | "busy" | "away";
  label: string;
  className?: string;
}) {
  const statusColors = {
    online: "bg-green-500",
    offline: "bg-gray-400",
    busy: "bg-red-500",
    away: "bg-yellow-500",
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <PulseDot color={status === "online" ? "#22c55e" : status === "busy" ? "#ef4444" : status === "away" ? "#f59e0b" : "#a3a3a3"} />
      <span className="text-sm text-gray-400">{label}</span>
    </div>
  );
}