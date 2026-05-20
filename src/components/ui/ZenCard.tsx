"use client";

import { ReactNode } from "react";
import { motion, MotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface ZenCardProps extends MotionProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "glass" | "elevated";
  hoverable?: boolean;
  glowIntensity?: "none" | "subtle" | "medium" | "strong";
  accentColor?: string;
}

const glowStyles = {
  none: "",
  subtle: "hover:shadow-[0_0_15px_rgba(var(--primary-rgb,99,102,241),0.15)] hover:brightness-105",
  medium: "hover:shadow-[0_0_25px_rgba(var(--primary-rgb,99,102,241),0.25)] hover:brightness-110",
  strong: "hover:shadow-[0_0_35px_rgba(var(--primary-rgb,99,102,241),0.35)] hover:brightness-115",
};

const variantStyles = {
  default: "bg-surface/60 backdrop-blur-xl border border-white/5 rounded-2xl shadow-xl",
  glass: "bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl",
  elevated: "bg-surface/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl",
};

export function ZenCard({
  children,
  className = "",
  variant = "default",
  hoverable = true,
  glowIntensity = "subtle",
  animate,
  initial,
  transition,
  ...motionProps
}: ZenCardProps) {
  const isMotion = animate !== undefined || initial !== undefined;

  const baseClasses = cn(
    "relative overflow-hidden transition-all duration-300",
    variantStyles[variant],
    hoverable && glowStyles[glowIntensity],
    hoverable && "hover:-translate-y-0.5 hover:border-white/10",
    className
  );

  if (isMotion) {
    return (
      <motion.div
        className={baseClasses}
        animate={animate}
        initial={initial}
        transition={transition}
        {...motionProps}
      >
        <div className="relative z-10">{children}</div>
      </motion.div>
    );
  }

  return (
    <div className={baseClasses}>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

interface ZenCardContentProps {
  children: ReactNode;
  className?: string;
}

export function ZenCardContent({ children, className }: ZenCardContentProps) {
  return (
    <div className={cn("p-5", className)}>
      {children}
    </div>
  );
}

interface ZenCardHeaderProps {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  iconBg?: string;
}

export function ZenCardHeader({ children, className, icon, iconBg }: ZenCardHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      <div className="flex-1">{children}</div>
      {icon && (
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center ml-3",
            iconBg || "bg-primary/20"
          )}
        >
          {icon}
        </div>
      )}
    </div>
  );
}

interface ZenCardTitleProps {
  children: ReactNode;
  className?: string;
}

export function ZenCardTitle({ children, className }: ZenCardTitleProps) {
  return (
    <h3 className={cn("text-lg font-semibold text-foreground", className)}>
      {children}
    </h3>
  );
}

interface ZenCardSubtitleProps {
  children: ReactNode;
  className?: string;
}

export function ZenCardSubtitle({ children, className }: ZenCardSubtitleProps) {
  return (
    <p className={cn("text-sm text-muted-foreground mt-0.5", className)}>
      {children}
    </p>
  );
}

// Animation presets for ZenCard
export const zenCardAnimations = {
  fadeIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: [0.0, 0.0, 0.2, 1] as const }
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { type: "spring" as const, stiffness: 400, damping: 30 }
  },
  slideIn: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.3, ease: [0.0, 0.0, 0.2, 1] as const }
  },
};