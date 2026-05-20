"use client";

import { ReactNode, ElementType, ComponentPropsWithRef } from "react";
import { motion, MotionProps } from "framer-motion";
import "./HoverGlow.css";

interface HoverGlowProps extends MotionProps {
  children: ReactNode;
  className?: string;
  scale?: number;
  glowIntensity?: "none" | "subtle" | "medium" | "strong";
  enableHover?: boolean;
  as?: ElementType;
}

/**
 * Adds subtle scale and brightness increase on hover.
 * Works on cards, buttons, and interactive elements.
 * Uses CSS transitions for performance, not JS animation.
 */
export function HoverGlow({
  children,
  className = "",
  scale = 1.02,
  glowIntensity = "subtle",
  enableHover = true,
  as,
  ...motionProps
}: HoverGlowProps) {
  if (!enableHover) {
    return <>{children}</>;
  }

  const MotionComponent = as ? motion.create(as) : motion.div;

  return (
    <MotionComponent
      className={`hover-glow hover-glow--${glowIntensity} ${className}`}
      whileHover={{ scale }}
      transition={{ duration: 0.15, ease: [0.0, 0.0, 0.2, 1] }}
      {...motionProps}
    >
      {children}
    </MotionComponent>
  );
}

/**
 * Hoverable card with glow effect - a simpler version using only CSS
 */
export function GlowCard({
  children,
  className = "",
  glowIntensity = "subtle",
}: {
  children: ReactNode;
  className?: string;
  glowIntensity?: "none" | "subtle" | "medium" | "strong";
}) {
  return (
    <div className={`hover-glow hover-glow--${glowIntensity} ${className}`}>
      {children}
    </div>
  );
}