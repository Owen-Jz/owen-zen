"use client";

import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VIEW_VARIANTS, DURATIONS } from "./MotionConfig";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  viewKey?: string;
}

/**
 * Wraps routes/views with smooth page transitions.
 * Uses AnimatePresence with mode="wait" for crossfade between views.
 */
export function PageTransition({ children, className, viewKey }: PageTransitionProps) {
  return (
    <motion.div
      className={className}
      initial="enter"
      animate="center"
      exit="exit"
      variants={VIEW_VARIANTS}
    >
      {children}
    </motion.div>
  );
}

/**
 * View wrapper that handles its own enter/exit animations.
 * Use this for view-level components that need their own transition state.
 */
export function AnimatedView({
  children,
  className,
  isActive = true,
}: {
  children: ReactNode;
  className?: string;
  isActive?: boolean;
}) {
  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          className={className}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: DURATIONS.page, ease: [0.0, 0.0, 0.2, 1] }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Wrapper component for page content with enter animation
 */
export function PageEnter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATIONS.normal, ease: [0.0, 0.0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}