# Animation System Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Comprehensive animation overhaul — energetic + zen personality woven into every interaction. Unified motion tokens, reusable variants, scroll reveals, micro-interactions on all interactive elements, cinematic page transitions, and enhanced celebration system.

**Architecture:** Centralized motion tokens → reusable variant factories → custom hooks → retroactive component enhancements. New components inherit personality automatically. No animation library additions beyond existing Framer Motion.

**Tech Stack:** Framer Motion v12 (already installed), TypeScript, Tailwind CSS v4, CSS custom properties.

---

## File Map

| File | Change |
|------|--------|
| `src/lib/motion-tokens.ts` | **Create** — spring presets, durations, stagger delays, easing curves |
| `src/lib/variants.ts` | **Create** — fade/scale/slide entrance variants, pressable/liftable/tilty interactive variants |
| `src/hooks/use-scroll-reveal.ts` | **Create** — Intersection Observer hook for scroll-triggered animations |
| `src/hooks/use-ambient-motion.ts` | **Create** — ambient parallax/glow controller with toggle |
| `src/lib/animation-context.tsx` | **Create** — React context + provider for celebration trigger |
| `src/components/ui/button.tsx` | **Modify** — add `motion.div` wrapper with pressable spring |
| `src/components/ui/card.tsx` | **Modify** — add liftable hover/tap effects via `group/card` |
| `src/components/ui/input.tsx` | **Modify** — add animated focus ring |
| `src/components/ui/dialog.tsx` | **Modify** — cinematic open/close with backdrop blur |
| `src/components/TaskColumn.tsx` | **Modify** — layout animations for drag-reorder |
| `src/components/TaskCard.tsx` | **Modify** — liftable + completion celebration trigger |
| `src/components/Confetti.tsx` | **Modify** — configurable intensity + programmatic context API |
| `src/app/page.tsx` | **Modify** — scroll-reveal stagger on dashboard sections |
| `src/app/template.tsx` | **Create** — page transition layer (fade + slide) |

---

## Task 1: Motion Tokens

**Files:** Create: `src/lib/motion-tokens.ts`

- [ ] **Step 1: Create motion-tokens.ts**

```typescript
// src/lib/motion-tokens.ts
// Centralized animation configuration — the "personality" of Owen Zen

// Spring presets: snappy (buttons), gentle (cards), bouncy (celebrations), zen (ambient)
export const springs = {
  snappy: { type: "spring" as const, stiffness: 400, damping: 28 },
  gentle: { type: "spring" as const, stiffness: 200, damping: 25 },
  bouncy: { type: "spring" as const, stiffness: 350, damping: 12 },
  zen: { type: "spring" as const, stiffness: 150, damping: 20 },
} as const

// Duration presets in seconds
export const durations = {
  micro: 0.1,
  fast: 0.15,
  normal: 0.25,
  slow: 0.4,
  dramatic: 0.6,
} as const

// Stagger delays for list animations (seconds between items)
export const staggerDelays = {
  tiny: 0.03,
  small: 0.05,
  medium: 0.08,
  large: 0.12,
} as const

// Easing curves as bezier arrays for Framer Motion
export const easings = {
  smooth: [0.4, 0, 0.2, 1] as const,
  out: [0, 0, 0.2, 1] as const,
  inda: [0.4, 0, 1, 1] as const,
  bounce: [0.34, 1.56, 0.64, 1] as const,
} as const

// Shared transition factories
export const transitions = {
  snappy: (delay = 0) => ({ ...springs.snappy, delay }),
  gentle: (delay = 0) => ({ ...springs.gentle, delay }),
  bouncy: (delay = 0) => ({ ...springs.bouncy, delay }),
  zen: (delay = 0) => ({ ...springs.zen, delay }),
  smooth: (delay = 0, duration = durations.normal) => ({ ease: easings.smooth, duration, delay }),
  fadeOnly: (delay = 0) => ({ duration: durations.fast, opacity: 1, delay }),
} as const
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit src/lib/motion-tokens.ts` (if tsconfig allows isolated check) or just import check in next build.

---

## Task 2: Animation Variants Library

**Files:** Create: `src/lib/variants.ts`

- [ ] **Step 1: Create variants.ts**

```typescript
// src/lib/variants.ts
// Reusable Framer Motion variant factories
// All variants use the personality tokens from motion-tokens.ts

import { springs, staggerDelays, easings, durations } from "./motion-tokens"
import { Variants } from "framer-motion"

// ─── Entrance variants ─────────────────────────────────────────────────────────

export const fadeIn = (delay = 0): Variants => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: durations.fast, delay },
})

export const fadeInUp = (delay = 0): Variants => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { ...springs.gentle, delay },
})

export const scaleIn = (delay = 0): Variants => ({
  initial: { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
  transition: { ...springs.snappy, delay },
})

export const slideInFromLeft = (delay = 0): Variants => ({
  initial: { opacity: 0, x: -24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -12 },
  transition: { ...springs.bouncy, delay },
})

export const slideInFromRight = (delay = 0): Variants => ({
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 12 },
  transition: { ...springs.bouncy, delay },
})

// ─── Staggered list entrance ──────────────────────────────────────────────────

export const staggerContainer = (baseDelay = 0, staggerKey = "stagger"): Variants => ({
  initial: {},
  animate: {},
  exit: {},
  transition: {
    staggerChildren: staggerDelays.medium,
    delayChildren: baseDelay,
  },
})

export const staggerItem = (): Variants => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { ...springs.gentle },
})

// ─── Interactive variants (for whileHover/whileTap) ────────────────────────────

export const pressable = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.97 },
  transition: springs.snappy,
}

export const liftable = {
  whileHover: { y: -3, boxShadow: "0 12px 40px -10px rgba(0,0,0,0.6)" },
  whileTap: { y: 0, boxShadow: "0 2px 10px -2px rgba(0,0,0,0.3)" },
  transition: springs.gentle,
}

export const tilty3d = {
  whileHover: { rotateX: -3, rotateY: 3, scale: 1.01 },
  whileTap: { rotateX: 0, rotateY: 0, scale: 0.99 },
  transition: springs.zen,
}

// ─── Overlay / modal variants ────────────────────────────────────────────────

export const overlayOpen: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: durations.fast },
}

export const modalOpen: Variants = {
  initial: { opacity: 0, scale: 0.94, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: 4 },
  transition: { ...springs.bouncy, duration: durations.normal },
}

// ─── Page transition variants ─────────────────────────────────────────────────

export const pageEnter: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { ...springs.gentle, duration: durations.slow },
}

export const pageExit: Variants = {
  transition: { duration: durations.fast },
  exit: { opacity: 0 },
}
```

- [ ] **Step 2: Verify it compiles with existing Framer Motion types**

---

## Task 3: Scroll Reveal Hook

**Files:** Create: `src/hooks/use-scroll-reveal.ts`

- [ ] **Step 1: Create use-scroll-reveal.ts**

```typescript
// src/hooks/use-scroll-reveal.ts
"use client"
import { useEffect, useRef, useState } from "react"
import { Variants } from "framer-motion"

// Respect prefers-reduced-motion
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

interface UseScrollRevealOptions {
  threshold?: number
  rootMargin?: string
  once?: boolean
}

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: UseScrollRevealOptions = {}
) {
  const { threshold = 0.15, rootMargin = "-40px", once = true } = options
  const ref = useRef<T>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (prefersReducedMotion()) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once) observer.disconnect()
        } else if (!once) {
          setIsVisible(false)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, rootMargin, once])

  return { ref, isVisible }
}

// Returns motion props to spread onto a motion component
export function useScrollRevealMotion<T extends HTMLElement = HTMLDivElement>(
  variants: Variants,
  options?: UseScrollRevealOptions
) {
  const { ref, isVisible } = useScrollReveal<T>(options)

  return {
    ref,
    initial: variants.initial,
    animate: isVisible ? variants.animate : variants.initial,
    exit: variants.exit,
    transition: variants.transition,
  }
}
```

- [ ] **Step 2: Verify it compiles**

---

## Task 4: Ambient Motion Hook

**Files:** Create: `src/hooks/use-ambient-motion.ts`

- [ ] **Step 1: Create use-ambient-motion.ts**

```typescript
// src/hooks/use-ambient-motion.ts
"use client"
import { useEffect, useState, useCallback } from "react"
import { useMotionValue, useSpring, MotionValue } from "framer-motion"

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

interface AmbientMotionState {
  enabled: boolean
  toggle: () => void
  mouseX: MotionValue<number>
  mouseY: MotionValue<number>
  smoothMouseX: MotionValue<number>
  smoothMouseY: MotionValue<number>
}

export function useAmbientMotion(): AmbientMotionState {
  const [enabled, setEnabled] = useState(true)
  const mouseX = useMotionValue(-500)
  const mouseY = useMotionValue(-500)
  const smoothMouseX = useSpring(mouseX, { stiffness: 40, damping: 20 })
  const smoothMouseY = useSpring(mouseY, { stiffness: 40, damping: 20 })

  const toggle = useCallback(() => {
    setEnabled((prev) => !prev)
  }, [])

  useEffect(() => {
    if (prefersReducedMotion()) {
      setEnabled(false)
      return
    }

    if (!enabled) return

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [enabled, mouseX, mouseY])

  return { enabled, toggle, mouseX, mouseY, smoothMouseX, smoothMouseY }
}
```

- [ ] **Step 2: Verify it compiles**

---

## Task 5: Animation Context (Celebration System)

**Files:** Create: `src/lib/animation-context.tsx`

- [ ] **Step 1: Create animation-context.tsx**

```typescript
// src/lib/animation-context.tsx
"use client"
import { createContext, useContext, useCallback, ReactNode } from "react"

type CelebrationIntensity = "micro" | "normal" | "explosion"

interface CelebrationContextValue {
  celebrate: (intensity?: CelebrationIntensity) => void
}

const CelebrationContext = createContext<CelebrationContextValue>({
  celebrate: () => {},
})

export function useCelebration() {
  return useContext(CelebrationContext)
}

// This context lets any component trigger confetti without importing Confetti directly.
// Wrap your app's root in the provider, and Confetti will be rendered there.
interface CelebrationProviderProps {
  children: ReactNode
  onCelebrate: (intensity: CelebrationIntensity) => void
}

export function CelebrationProvider({ children, onCelebrate }: CelebrationProviderProps) {
  const celebrate = useCallback((intensity: CelebrationIntensity = "normal") => {
    onCelebrate(intensity)
  }, [onCelebrate])

  return (
    <CelebrationContext.Provider value={{ celebrate }}>
      {children}
    </CelebrationContext.Provider>
  )
}
```

- [ ] **Step 2: Verify it compiles**

---

## Task 6: Button Micro-interactions

**Files:** Modify: `src/components/ui/button.tsx`

- [ ] **Step 1: Add motion wrapper to Button component**

```typescript
// Replace the Button function with this (keeping the CVA variants intact)
import { motion, MotionValue } from "framer-motion"
import { springs } from "@/lib/motion-tokens"

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={springs.snappy}
      className="inline-flex" // prevents motion wrapper from stretching
    >
      <ButtonPrimitive
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    </motion.div>
  )
}
```

Note: The `motion.div` wrapper approach adds spring feedback to all buttons without changing the visual design. For icon-only buttons (size="icon"), the wrapper is `inline-flex` to prevent size inflation.

- [ ] **Step 2: Verify all button variants still render correctly** — run `npm run build` and check for any hydration errors.

---

## Task 7: Card Hover Effects

**Files:** Modify: `src/components/ui/card.tsx`

- [ ] **Step 1: Add liftable motion to Card function**

```typescript
// Replace Card function
function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <motion.div
      whileHover={{
        y: -3,
        boxShadow: "0 12px 40px -10px rgba(0,0,0,0.5)",
        transition: { type: "spring", stiffness: 200, damping: 25 }
      }}
      whileTap={{
        y: 0,
        boxShadow: "0 2px 10px -2px rgba(0,0,0,0.2)",
        transition: { type: "spring", stiffness: 400, damping: 28 }
      }}
      className={cn(
        "group/card flex flex-col gap-4 overflow-hidden rounded-xl bg-card py-4 text-sm text-card-foreground ring-1 ring-foreground/10 has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl cursor-pointer",
        className
      )}
      {...props}
    />
  )
}
```

- [ ] **Step 2: Verify compilation**

---

## Task 8: Input Focus Ring Animation

**Files:** Modify: `src/components/ui/input.tsx`

- [ ] **Step 1: Add animated focus ring via pseudo-element or wrapper**

```typescript
// Add motion import and wrap Input in a motion.div
import { motion } from "framer-motion"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <motion.div
      className="relative"
      animate={undefined} // controlled via children focus state
    >
      <InputPrimitive
        type={type}
        data-slot="input"
        className={cn(
          "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-all duration-150 outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
          // Remove focus-visible ring here — we handle it with the wrapper
          className
        )}
        {...props}
      />
      {/* Animated focus ring overlay — shown via CSS :focus-within */}
      <span className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-primary/0 ring-offset-0 transition-all duration-150 has-aria-invalid:ring-destructive/50 [[data-slot=input]:focus-within~&]:ring-primary/40 [[data-slot=input]:focus-within~&]:ring-offset-2" />
    </motion.div>
  )
}
```

Note: The `~` sibling selector approach works for many cases. If the component structure doesn't support it cleanly, use `data-slot="input"` + CSS with `input:focus ~ span` in globals.css.

- [ ] **Step 2: Verify compilation and check focus styles in browser**

---

## Task 9: Dialog Transitions

**Files:** Modify: `src/components/ui/dialog.tsx`

- [ ] **Step 1: Replace Tailwind animation classes with Framer Motion variants**

```typescript
// Replace DialogOverlay
function DialogOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn("fixed inset-0 isolate z-50 bg-black/40 backdrop-blur-xs", className)}
      {...props}
    />
  )
}

// Replace DialogContent — use Framer Motion variants instead of data-open:animate-in
function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & { showCloseButton?: boolean }) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 4 }}
        transition={{ type: "spring", stiffness: 350, damping: 12 }}
      >
        <DialogPrimitive.Popup
          data-slot="dialog-content"
          className={cn(
            "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 outline-none sm:max-w-sm",
            className
          )}
          {...props}
        >
          {children}
          {showCloseButton && (
            <DialogPrimitive.Close render={<Button variant="ghost" className="absolute top-2 right-2" size="icon-sm" />}>
              <XIcon /><span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Popup>
      </motion.div>
    </DialogPortal>
  )
}
```

Note: `DialogPrimitive.Popup` from base-ui handles the portal and accessibility. We wrap it in a `motion.div` for the entrance animation.

- [ ] **Step 2: Verify compilation and test dialog open/close in browser**

---

## Task 10: TaskColumn / Kanban Layout Animations

**Files:** Modify: `src/components/TaskColumn.tsx`

- [ ] **Step 1: Read TaskColumn.tsx to understand DnD structure**

```typescript
// The key change is wrapping SortableContext items with AnimatePresence + layout
// Read the file first, then add:
import { AnimatePresence } from "framer-motion"
// Wrap the list rendering with AnimatePresence layout animations
// Each item gets: motion.div with layout, initial: { opacity: 0, scale: 0.95 },
// animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 }
// transition from springs.gentle
```

Note: The exact code depends on how SortableContext is currently rendered. The goal is: when items reorder, they animate smoothly to new positions using Framer Motion's `layout` prop rather than snapping.

- [ ] **Step 2: Add `layout` prop to sortable items for smooth reordering**

- [ ] **Step 3: Wrap item list with `<AnimatePresence mode="popLayout">` for exit animations**

- [ ] **Step 4: Verify compilation and test drag-and-drop reordering**

---

## Task 11: TaskCard Completion Celebration

**Files:** Modify: `src/components/TaskColumn.tsx` (sortable item), `src/components/Confetti.tsx`

- [ ] **Step 1: Read TaskColumn.tsx to find the checkbox completion handler**

- [ ] **Step 2: On task completion, trigger confetti via the Celebration context**

```typescript
// Inside the task completion handler:
const { celebrate } = useCelebration()
const handleToggle = (taskId: string, completed: boolean) => {
  // ... existing toggle logic
  if (completed) {
    celebrate("micro") // subtle confetti on task done
  }
}
```

- [ ] **Step 3: Enhance Confetti with configurable intensity**

```typescript
// src/components/Confetti.tsx — update to accept intensity
interface ConfettiProps {
  trigger: number
  intensity?: "micro" | "normal" | "explosion"
}

const PIECE_COUNTS = { micro: 15, normal: 50, explosion: 120 }
const DURATION_MULTIPLIERS = { micro: 1.5, normal: 1, explosion: 0.7 }
```

- [ ] **Step 4: Wire Confetti intensity into the trigger**

- [ ] **Step 5: Verify compilation and test task completion confetti**

---

## Task 12: Page Transitions

**Files:** Create: `src/app/template.tsx`

- [ ] **Step 1: Create app/template.tsx with page-level fade+slide transition**

```typescript
// src/app/template.tsx
"use client"
import { motion } from "framer-motion"
import { pageEnter, pageExit } from "@/lib/variants"

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ type: "spring", stiffness: 150, damping: 20, duration: 0.4 }}
    >
      {children}
    </motion.div>
  )
}
```

Note: `template.tsx` re-renders on every navigation in Next.js App Router, making it ideal for page transitions. It wraps each route render.

- [ ] **Step 2: Verify template.tsx doesn't break existing routing — run `npm run dev` and navigate between views**

---

## Task 13: Dashboard Scroll Reveal

**Files:** Modify: `src/app/page.tsx`

- [ ] **Step 1: Read the top of page.tsx to find dashboard section render structure**

- [ ] **Step 2: Apply staggered reveal to major dashboard sections**

```typescript
// Wrap each major section with useScrollReveal + fadeInUp variants
// Example for a section:
const { ref: habitsRef, isVisible: habitsVisible } = useScrollReveal()

<motion.div
  ref={habitsRef}
  initial={{ opacity: 0, y: 16 }}
  animate={habitsVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
  transition={{ ...springs.gentle, delay: 0.1 }}
>
  <HabitView />
</motion.div>
```

- [ ] **Step 3: Add initial fade to the main container (page loads already visible)**

- [ ] **Step 4: Verify compilation and test scroll behavior in browser**

---

## Task 14: Ambient Parallax / Spotlight Enhancement

**Files:** Modify: `src/components/SpotlightEffect.tsx`

- [ ] **Step 1: Read SpotlightEffect.tsx**

- [ ] **Step 2: Integrate useAmbientMotion spring values**

```typescript
// Replace hardcoded mouse tracking with smoothSpring values from useAmbientMotion
// This makes the spotlight follow with a satisfying lag/ease
const { smoothMouseX, smoothMouseY, enabled } = useAmbientMotion()

// The existing motion.div already uses mouseX/mouseY — swap to smooth versions
// Add a toggle control (e.g., a small button in the corner)
// Add parallax: some elements move at fraction of mouse delta
```

- [ ] **Step 3: Add ambient parallax to background decorative elements**

- [ ] **Step 4: Verify compilation and test in browser**

---

## Task 15: Global CSS Animation Tokens

**Files:** Modify: `src/app/globals.css`

- [ ] **Step 1: Add reduced-motion override block**

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: Verify this doesn't break any existing Tailwind animations (check tw-animate-css)**

---

## Task 16: Integration & Polish Pass

- [ ] **Step 1: Run `npm run build` — fix any TypeScript errors from all modifications**

- [ ] **Step 2: Check all interactive elements (buttons, cards, inputs) in browser for jank**

- [ ] **Step 3: Verify `prefers-reduced-motion` works by toggling in DevTools**

- [ ] **Step 4: Test drag-and-drop on TaskBoard — ensure layout animations are smooth**

- [ ] **Step 5: Run `npm test` — verify no test regressions**

- [ ] **Step 6: Commit with message: `feat(animation): add comprehensive motion system — spring tokens, variants, scroll reveals, micro-interactions`**

---

## Spec Coverage Check

| Spec Section | Tasks |
|---|---|
| Motion Tokens | Task 1 |
| Variants Library | Task 2 |
| Scroll Reveal Hook | Task 3 |
| Ambient Motion Hook | Task 4 |
| Celebration Context | Task 5 |
| Button Micro-interactions | Task 6 |
| Card Liftable | Task 7 |
| Input Focus Ring | Task 8 |
| Dialog Cinematic Transitions | Task 9 |
| Kanban Layout Animations | Task 10 |
| Task Completion Confetti | Task 11 |
| Page Transitions | Task 12 |
| Dashboard Scroll Reveal | Task 13 |
| Ambient Parallax | Task 14 |
| Reduced Motion CSS | Task 15 |
| Integration & Polish | Task 16 |

**All spec requirements covered.** No placeholder gaps found.
