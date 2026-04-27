# Animation System Overhaul — Design Spec

## Context

Owen Zen is a personal productivity dashboard with a solid Framer Motion foundation but no unified animation personality. The goal is a comprehensive sweep that makes every interaction feel alive — energetic and playful in spirit, but minimalist and zen in restraint. The personality should be woven throughout the entire experience, not confined to special moments.

## Design Philosophy

**Hybrid Personality: Energetic + Zen**
- Playful springs and micro-interactions reward every action
- But they stay subtle — the motion delights without demanding attention
- Animations communicate state and provide feedback, not decoration
- Respect `prefers-reduced-motion` throughout

## Architecture

### 1. Motion Tokens (`src/lib/motion-tokens.ts`)

Centralized configuration for all animation parameters. Typed and documented.

```typescript
// Spring presets — the "personality" of motion
export const springs = {
  snappy: { type: "spring" as const, stiffness: 400, damping: 28 },
  gentle: { type: "spring" as const, stiffness: 200, damping: 25 },
  bouncy: { type: "spring" as const, stiffness: 350, damping: 12 },
  zen: { type: "spring" as const, stiffness: 150, damping: 20 },
}

// Duration shortcuts
export const durations = {
  micro: 0.1,    // 100ms — hover feedback
  fast: 0.15,     // 150ms — button press
  normal: 0.25,   // 250ms — standard transitions
  slow: 0.4,      // 400ms — emphasis animations
  dramatic: 0.6,   // 600ms — page transitions
}

// Stagger presets for list animations
export const staggerDelays = {
  tiny: 0.03,
  small: 0.05,
  medium: 0.08,
  large: 0.12,
}

// Easing curves
export const easings = {
  smooth: [0.4, 0, 0.2, 1] as const,
  out: [0, 0, 0.2, 1] as const,
  in: [0.4, 0, 1, 1] as const,
  bounce: [0.34, 1.56, 0.64, 1] as const,
}
```

### 2. Animation Variants Library (`src/lib/variants.ts`)

Reusable variant factories for common patterns. Each variant set uses personality tokens.

```typescript
// Entrance variants
export const fadeInUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { ...springs.gentle, delay },
})

export const scaleIn = (delay = 0) => ({
  initial: { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1 },
  transition: { ...springs.snappy, delay },
})

export const slideInFromLeft = (delay = 0) => ({
  initial: { opacity: 0, x: -24 },
  animate: { opacity: 1, x: 0 },
  transition: { ...springs.bouncy, delay },
})

// Interactive variants
export const pressable = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.97 },
  transition: springs.snappy,
}

export const liftable = {
  whileHover: { y: -2, boxShadow: "0 8px 30px -8px rgba(0,0,0,0.5)" },
  whileTap: { y: 0, boxShadow: "0 2px 10px -2px rgba(0,0,0,0.3)" },
  transition: springs.gentle,
}

export const tilty = {
  whileHover: { rotateX: -2, rotateY: 2 },
  whileTap: { rotateX: 0, rotateY: 0 },
  transition: springs.zen,
}
```

### 3. Scroll Reveal Hook (`src/hooks/use-scroll-reveal.ts`)

```typescript
// Uses Intersection Observer to trigger animations on scroll-into-view
// Respects prefers-reduced-motion
// Returns motion props to spread onto any motion component
```

### 4. Component Enhancements (Retroactive)

All existing components receive micro-interaction upgrades:

**Buttons** — `pressable` variant on every interactive button
- Hover: subtle scale + shadow lift (150ms spring)
- Press: scale down to 0.97 (100ms)
- Release: spring back with slight overshoot

**Cards** — `liftable` variant on task cards, habit cards, etc.
- Hover: lift 2px + enhanced shadow
- Creates depth hierarchy without explicit hover states

**List Items** — Staggered entrance on mount
- Each item delays by `i * staggerDelays.medium`
- Smooth layout animations when reordering (drag-and-drop)

**Inputs** — Focus ring animation
- On focus: ring scales from 0.8 to 1, opacity 0 to 1
- Border color transition synced with ring

**Modals/Dialogs** — Cinematic open/close
- Backdrop fades in with blur
- Content scales from 0.95 with spring overshoot
- Exit reverses with faster timing

**Task Checkbox** — Satisfying check animation
- Scale bounce on check (spring)
- Optional: subtle confetti burst on task completion

**Progress Indicators** — Smooth value transitions
- Animated number counting
- Progress bars spring to new values

### 5. Page Transition Layer

In `app/template.tsx` (or layout-based), a page transition overlay:
- View enters: fade + subtle slide up
- View exits: fade out faster
- Shared element transitions where possible (task title on open → detail view)

### 6. Ambient Effects (Minimal)

Expand the existing `SpotlightEffect`:
- Mouse-following gradient glow on the dashboard
- Subtle parallax on background elements
- All controlled via a single `useAmbientMotion` hook with toggle

### 7. Celebration System

Enhance existing `Confetti` component:
- Configurable intensity (micro / normal / explosion)
- Triggered programmatically via context or direct call
- Particle colors pulled from current theme
- Sound integration (already exists in `soundService.ts`)

## Implementation Order

1. **Foundation** — `motion-tokens.ts`, `variants.ts` — no visual change, just architecture
2. **Retrofit buttons** — Every `<button>` and interactive element gets `pressable`
3. **Retrofit cards** — TaskCard, HabitCard, FinanceCard, etc. get `liftable`
4. **Scroll reveals** — Dashboard sections stagger in on mount
5. **List enhancements** — AnimatePresence + layout for task lists, kanban columns
6. **Input polish** — Focus ring animations on all form fields
7. **Modal/dialog transitions** — Enhanced open/close across all overlays
8. **Page transitions** — View-level transitions in template/layout
9. **Ambient effects** — `useAmbientMotion` with toggle, spotlight enhancement
10. **Celebration system** — Confetti + sound on task/habit completions

## Testing Checklist

- [ ] `prefers-reduced-motion: reduce` — All animations reduce to instant/fade-only
- [ ] No animation jank on lists of 50+ items
- [ ] Stagger delays don't stack overflow
- [ ] Spring overshoot never clips outside component bounds
- [ ] Theme switcher doesn't break animation continuity
- [ ] Mobile touch interactions feel native (no hover ghosts)

## File Changes Summary

| File | Change |
|------|--------|
| `src/lib/motion-tokens.ts` | New — spring/duration/stagger/easing constants |
| `src/lib/variants.ts` | New — reusable variant factories |
| `src/hooks/use-scroll-reveal.ts` | New — scroll-triggered animation hook |
| `src/hooks/use-ambient-motion.ts` | New — ambient effect controller |
| `src/components/ui/button/button.tsx` | Retrofit pressable |
| `src/components/TaskCard.tsx` | Retrofit liftable + completion celebration |
| `src/components/HabitCard.tsx` | Retrofit liftable + streak animation |
| `src/components/FinanceCard.tsx` | Retrofit liftable |
| `src/components/kanban/*.tsx` | Layout animations + drag physics |
| `src/components/ui/dialog/dialog.tsx` | Cinematic open/close |
| `src/components/ui/input/input.tsx` | Focus ring animation |
| `src/components/CommandPalette.tsx` | Enhanced transitions |
| `src/app/template.tsx` | Page transition layer |
| `src/app/page.tsx` | Scroll reveal stagger on sections |
| `src/components/Confetti.tsx` | Celebration system enhancement |

## Success Criteria

- Every interactive element responds to hover/press with spring physics
- Lists animate smoothly on reorder without manual intervention
- Page/view transitions feel cinematic but fast (<400ms)
- The platform feels "alive" without being distracting
- Adding a new component requires zero animation code to get the personality
