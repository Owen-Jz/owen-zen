"use client";

import React, { ReactNode } from "react";
import { motion } from "framer-motion";
import { DURATIONS, EASINGS } from "./MotionConfig";

interface StaggeredListProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  variant?: "slideUp" | "fadeIn" | "scaleIn" | "slideLeft";
  as?: "div" | "ul" | "ol" | "section";
}

/**
 * Reusable component for staggered list animations.
 * Animates children with a staggered delay for orchestrated entrance effects.
 * Great for task lists, habit checkboxes, card grids.
 */
export function StaggeredList({
  children,
  className,
  staggerDelay = 0.05,
  variant = "slideUp",
  as = "div",
}: StaggeredListProps) {
  const Component = motion[as];

  const itemVariants = {
    hidden: getVariantHidden(variant),
    visible: getVariantVisible(variant),
  };

  return (
    <Component
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: 0.1,
          },
        },
      }}
    >
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        return (
          <motion.div key={typeof child.key !== "undefined" ? child.key : index} variants={itemVariants}>
            {child}
          </motion.div>
        );
      })}
    </Component>
  );
}

// Helper to get hidden state based on variant type
function getVariantHidden(variant: string) {
  switch (variant) {
    case "fadeIn":
      return { opacity: 0 };
    case "scaleIn":
      return { opacity: 0, scale: 0.9 };
    case "slideLeft":
      return { opacity: 0, x: -20 };
    case "slideUp":
    default:
      return { opacity: 0, y: 15 };
  }
}

// Helper to get visible state based on variant type
function getVariantVisible(variant: string) {
  const duration = DURATIONS.normal;
  const easing = EASINGS.easeOut;

  switch (variant) {
    case "fadeIn":
      return { opacity: 1, transition: { duration, easing } };
    case "scaleIn":
      return { opacity: 1, scale: 1, transition: { duration, easing } };
    case "slideLeft":
      return { opacity: 1, x: 0, transition: { duration, easing } };
    case "slideUp":
    default:
      return { opacity: 1, y: 0, transition: { duration, easing } };
  }
}

/**
 * Individual list item with its own animation variant support.
 * Use inside StaggeredList or standalone with parent coordination.
 */
export function StaggeredItem({
  children,
  className,
  variant = "slideUp",
}: {
  children: ReactNode;
  className?: string;
  variant?: "slideUp" | "fadeIn" | "scaleIn" | "slideLeft";
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: getVariantHidden(variant),
        visible: getVariantVisible(variant),
      }}
      transition={{ duration: DURATIONS.normal, ease: EASINGS.easeOut }}
    >
      {children}
    </motion.div>
  );
}