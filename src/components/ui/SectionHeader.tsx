"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  subtitle?: string;
  accentColor?: string;
  className?: string;
  animationDelay?: number;
}

export function SectionHeader({
  title,
  icon: Icon,
  action,
  subtitle,
  accentColor,
  className,
  animationDelay = 0,
}: SectionHeaderProps) {
  return (
    <motion.div
      className={cn("flex items-center justify-between mb-4", className)}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: animationDelay }}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              accentColor ? `${accentColor}/20` : "bg-primary/20"
            )}
            style={accentColor ? { color: accentColor } : undefined}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {action && (
        <motion.button
          onClick={action.onClick}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {action.icon && <action.icon className="w-4 h-4" />}
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}

interface SectionProps {
  children: ReactNode;
  className?: string;
  animationDelay?: number;
}

export function Section({ children, className, animationDelay = 0 }: SectionProps) {
  return (
    <motion.div
      className={cn("", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: animationDelay }}
    >
      {children}
    </motion.div>
  );
}