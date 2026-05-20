"use client";

import "./SkeletonLoader.css";
import { motion } from "framer-motion";

// View-specific skeleton presets
export const SKELETON_PRESETS = {
  statCard: { variant: "rectangle" as const, height: 80, width: "100%" },
  taskCard: { variant: "card" as const },
  chart: { variant: "rectangle" as const, height: 200, width: "100%" },
  tableRow: { variant: "rectangle" as const, height: 48, width: "100%" },
  transaction: { variant: "rectangle" as const, height: 64, width: "100%" },
  habitItem: { variant: "rectangle" as const, height: 56, width: "100%" },
  goalItem: { variant: "rectangle" as const, height: 72, width: "100%" },
  leadRow: { variant: "rectangle" as const, height: 72, width: "100%" },
  calendarCell: { variant: "rectangle" as const, height: 100, width: "100%" },
};

interface SkeletonLoaderProps {
  variant?: "text" | "circle" | "rectangle" | "card";
  width?: string | number;
  height?: string | number;
  className?: string;
  lines?: number;
  animation?: "shimmer" | "pulse" | "none";
}

/**
 * Shimmer skeleton component for loading states.
 * Can be shaped for text lines, circles, rectangles, or cards.
 */
export function SkeletonLoader({
  variant = "rectangle",
  width,
  height,
  className = "",
  lines = 1,
  animation = "shimmer",
}: SkeletonLoaderProps) {
  const style: React.CSSProperties = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
  };

  if (variant === "text" && lines > 1) {
    return (
      <div className={`skeleton-loader ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`skeleton-text skeleton-text--${animation}`}
            style={{
              ...style,
              width: i === lines - 1 ? "70%" : "100%",
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={`skeleton-card ${className}`}>
        <div className={`skeleton-text skeleton-text--${animation}`} style={{ width: "60%", height: 24 }} />
        <div className={`skeleton-text skeleton-text--${animation}`} style={{ width: "100%", height: 16, marginTop: 12 }} />
        <div className={`skeleton-text skeleton-text--${animation}`} style={{ width: "80%", height: 16, marginTop: 8 }} />
        <div className="skeleton-card-footer">
          <div className={`skeleton-circle skeleton-circle--${animation}`} style={{ width: 32, height: 32 }} />
          <div className={`skeleton-text skeleton-text--${animation}`} style={{ width: 100, height: 14 }} />
        </div>
      </div>
    );
  }

  if (variant === "circle") {
    return (
      <div
        className={`skeleton-circle skeleton-circle--${animation} ${className}`}
        style={style}
      />
    );
  }

  // Default: rectangle
  return (
    <div
      className={`skeleton-rect skeleton-rect--${animation} ${className}`}
      style={style}
    />
  );
}

/**
 * Skeleton group for loading multiple items
 */
export function SkeletonGroup({
  count = 3,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={`skeleton-group ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonLoader key={i} variant="card" />
      ))}
    </div>
  );
}

/**
 * Text line skeleton with shimmer
 */
export function SkeletonText({
  width = "100%",
  className = "",
}: {
  width?: string;
  className?: string;
}) {
  return (
    <div
      className={`skeleton-text skeleton-text--shimmer ${className}`}
      style={{ width }}
    />
  );
}

/**
 * Motion-wrapped skeleton for staggered loading animations
 */
export function SkeletonLoaderAnimated({
  variant = "rectangle",
  width,
  height,
  className = "",
  lines = 1,
  animation = "shimmer",
  delay = 0,
}: SkeletonLoaderProps & { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <SkeletonLoader
        variant={variant}
        width={width}
        height={height}
        className={className}
        lines={lines}
        animation={animation}
      />
    </motion.div>
  );
}

/**
 * Staggered skeleton group with motion animations
 */
export function SkeletonGroupAnimated({
  count = 3,
  className = "",
  staggerDelay = 0.1,
}: {
  count?: number;
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <div className={`skeleton-group ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * staggerDelay }}
        >
          <SkeletonLoader variant="card" />
        </motion.div>
      ))}
    </div>
  );
}