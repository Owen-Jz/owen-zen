import { Variants } from "framer-motion";

// Animation duration constants (in seconds)
export const ANIM_DURATION = {
  micro: 0.1,      // 100ms - micro interactions (checkbox toggle)
  fast: 0.15,      // 150ms - hover states
  normal: 0.3,     // 300ms - standard transitions
  page: 0.2,       // 200ms - page transitions
  slow: 0.5,       // 500ms - emphasis
  dramatic: 0.8,   // 800ms - celebration
} as const;

// Spring physics presets
export const SPRING_PRESETS = {
  snappy: { type: "spring" as const, stiffness: 400, damping: 28 },
  gentle: { type: "spring" as const, stiffness: 120, damping: 14 },
  bouncy: { type: "spring" as const, stiffness: 300, damping: 18 },
  smooth: { type: "spring" as const, stiffness: 200, damping: 22 },
} as const;

// Hover micro-interaction presets
export const HOVER_PRESETS = {
  subtle: { scale: 1.01, duration: 0.15 },
  card: { scale: 1.02, y: -2, duration: 0.2 },
  lift: { scale: 1.03, y: -4, duration: 0.25 },
  button: { scale: 0.98, duration: 0.1 },
} as const;

// Stagger orchestration presets
export const STAGGER_PRESETS = {
  quick: { staggerChildren: 0.04, delayChildren: 0.05 },
  normal: { staggerChildren: 0.06, delayChildren: 0.1 },
  cards: { staggerChildren: 0.08, delayChildren: 0.12 },
  list: { staggerChildren: 0.05, delayChildren: 0.08 },
  slow: { staggerChildren: 0.1, delayChildren: 0.15 },
} as const;

// Centralized animation registry for common component states
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MotionRegistry: Record<string, any> = {
  // Card entrance/exit
  card: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.3, ease: [0.0, 0.0, 0.2, 1] }
  },

  // Modal dialog
  modal: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { type: "spring", stiffness: 400, damping: 30 }
  },

  // List items
  listItem: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, height: 0 },
  },

  // Page/view transitions
  page: {
    hidden: { opacity: 0, y: 10, scale: 0.99 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.99 },
  },

  // Overlay/backdrop
  overlay: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },

  // Slide from left
  slideFromLeft: {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  },

  // Slide from right
  slideFromRight: {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 30 },
  },
};

// Preset animation variants for reuse
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const PRESETS: Record<string, any> = {
  // Page/View transitions
  pageEnter: { opacity: 0, y: 10, scale: 0.99 },
  pageExit: { opacity: 0, y: -10, scale: 0.99 },

  // Card animations
  cardEnter: { opacity: 0, y: 20 },
  cardExit: { opacity: 0, scale: 0.95 },

  // List items
  listItemEnter: { opacity: 0, x: -15 },
  listItemExit: { opacity: 0, height: 0 },

  // Modal/Dialog
  dialogEnter: { opacity: 0, scale: 0.95, y: 10 },
  dialogExit: { opacity: 0, scale: 0.95, y: 10 },

  // Overlay
  overlayEnter: { opacity: 0 },
  overlayExit: { opacity: 0 },
};

// Hover animation variants for different element types
export const createHoverVariants = (type: keyof typeof HOVER_PRESETS) => {
  const preset = HOVER_PRESETS[type];
  return {
    rest: { scale: 1, y: 0 },
    hover: {
      scale: preset.scale,
      y: 'y' in preset ? preset.y : 0,
      transition: { duration: preset.duration, ease: [0.0, 0.0, 0.2, 1] }
    },
    tap: { scale: 0.98, transition: { duration: 0.1 } }
  };
};

// Create staggered children variants
export const createStaggerVariants = (preset: keyof typeof STAGGER_PRESETS) => {
  const config = STAGGER_PRESETS[preset];
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: config.staggerChildren,
        delayChildren: config.delayChildren,
      },
    },
  };
};

// Completion celebration animations
export const CELEBRATION_PRESETS = {
  taskComplete: {
    initial: { scale: 1 },
    animate: { scale: [1, 1.15, 1] },
    transition: { duration: 0.4, times: [0, 0.5, 1] }
  },
  checkIn: {
    initial: { scale: 0, rotate: -10 },
    animate: { scale: 1, rotate: 0 },
    transition: { type: "spring" as const, stiffness: 400, damping: 20 }
  },
  confetti: {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.5, opacity: 0 },
  }
} as const;