"use client";

import type { Variants, Transition } from "framer-motion";

// Re-export the MotionConfig component (identity export for convenience)
export const MotionConfig = null;

// Standard animation durations (in seconds)
export const DURATIONS = {
  instant: 0.05,   // 50ms - for immediate feedback like button clicks
  fast: 0.15,      // 150ms - for quick state changes like hover
  normal: 0.3,     // 300ms - standard transitions
  slow: 0.5,       // 500ms - for emphasis, larger elements
  page: 0.2,       // 200ms - page transitions
} as const;

// Spring physics presets for consistent interactions
export const SPRING_PRESETS = {
  snappy: { type: "spring" as const, stiffness: 400, damping: 28 },
  gentle: { type: "spring" as const, stiffness: 120, damping: 14 },
  bouncy: { type: "spring" as const, stiffness: 300, damping: 18 },
  smooth: { type: "spring" as const, stiffness: 200, damping: 22 },
} as const;

// Easing curves as constants for Framer Motion
export const EASINGS = {
  easeOut: [0.0, 0.0, 0.2, 1] as const,
  easeIn: [0.4, 0.0, 1, 1] as const,
  easeInOut: [0.4, 0.0, 0.2, 1] as const,
  spring: { type: "spring", stiffness: 300, damping: 30 } as const,
  springBounce: { type: "spring", stiffness: 400, damping: 15 } as const,
  gentle: { type: "spring", stiffness: 120, damping: 14 } as const,
} as const;

// Hover micro-interaction presets for cards and buttons
export const HOVER_PRESETS = {
  subtle: { scale: 1.01, duration: 0.15 } as const,
  card: { scale: 1.02, y: -2, duration: 0.2 } as const,
  lift: { scale: 1.03, y: -4, duration: 0.25 } as const,
  button: { scale: 0.98, duration: 0.1 } as const,
} as const;

// Preset animation variants
export const PRESET_VARIANTS = {
  // Fade in from 0 to 1
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  } as Variants,

  // Fade in while sliding up
  slideUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  } as Variants,

  // Fade in while sliding down
  slideDown: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
  } as Variants,

  // Scale in from 0.95 to 1
  scaleIn: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  } as Variants,

  // Slide in from left
  slideLeft: {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0 },
  } as Variants,

  // Slide in from right
  slideRight: {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0 },
  } as Variants,

  // Page transition: scale and fade
  pageTransition: {
    hidden: { opacity: 0, scale: 0.98 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
  } as Variants,
} as const;

// Standard transition objects
export const TRANSITIONS = {
  fast: { duration: DURATIONS.fast, ease: EASINGS.easeOut } as Transition,
  normal: { duration: DURATIONS.normal, ease: EASINGS.easeOut } as Transition,
  smooth: { duration: DURATIONS.normal, ease: EASINGS.easeInOut } as Transition,
  page: { duration: DURATIONS.page, ease: EASINGS.easeOut } as Transition,
} as const;

// Stagger container variants for children animations
export const STAGGER_VARIANTS = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  } as Variants,

  item: PRESET_VARIANTS.slideUp,
} as const;

// Stagger orchestration presets for different list densities
export const STAGGER_PRESETS = {
  quick: { staggerChildren: 0.04, delayChildren: 0.05 } as const,
  normal: { staggerChildren: 0.06, delayChildren: 0.1 } as const,
  cards: { staggerChildren: 0.08, delayChildren: 0.12 } as const,
  list: { staggerChildren: 0.05, delayChildren: 0.08 } as const,
  slow: { staggerChildren: 0.1, delayChildren: 0.15 } as const,
} as const;

// View transition variants for AnimatePresence
export const VIEW_VARIANTS = {
  enter: {
    opacity: 0,
    scale: 0.98,
  },
  center: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: DURATIONS.page,
      ease: EASINGS.easeOut,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: DURATIONS.page,
      ease: EASINGS.easeOut,
    },
  },
} as const;