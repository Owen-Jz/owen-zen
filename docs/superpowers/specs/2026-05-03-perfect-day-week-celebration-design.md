# Perfect Day / Perfect Week Celebration — Design Spec

**Date:** 2026-05-03
**Status:** Approved

---

## Context

When a user completes every single daily habit for a full day or full week, the app should celebrate that achievement visually on the consistency graph and with a full-screen animation. Currently the graph only has a yellow glow for "perfect days" and no special treatment for perfect weeks. The user wants:

- Perfect days and perfect weeks to be visually distinct on the consistency graph, using theme-aware colors
- A full-screen confetti/trophy celebration animation when a perfect day or perfect week is achieved
- The celebration to trigger on both daily and weekly habit completion

---

## Design Decisions

### Visual Distinction: Perfect Day vs Perfect Week

| State | Color | Effect |
|---|---|---|
| Normal cell | `--primary` at opacity 5/30/50/80/100% | None |
| Perfect day (all habits that day) | `--primary` at full opacity | Theme-colored glow + subtle pulse |
| Perfect week (all 7 days complete) | `--primary` at full opacity + purple tint overlay | Distinct ring/border so it reads as "different from perfect day" |

**Implementation:** Add theme-aware CSS variables and apply a purple-tinted border/ring to week-perfect Saturday cells.

### Perfect Week Definition

A week is "perfect" when **all 7 days (Sunday–Saturday)** have every daily habit completed. Weekly habits are tracked separately and don't factor into the graph's perfect week detection — only the daily habits.

### Celebration Animation

Full-screen centered confetti explosion + achievement badge reveal:

1. **Screen flash** — brief white/color overlay that fades out (200ms)
2. **Confetti burst** — particles shoot from center outward in all directions, in theme colors + gold
3. **Achievement badge** — "Perfect Day!" or "Perfect Week!" text scales up from center with spring animation
4. **Glow ring** — expanding ring that fades out behind the badge

Animation runs for ~3 seconds.

**Badge text variants:**
- Perfect Day: "Perfect Day!" with star icon
- Perfect Week: "Perfect Week!" with trophy icon

### Graph Cell Colors

Extend the existing `intensityColors` array in HabitView.tsx. Saturday cells that are part of a perfect week get the purple ring treatment — the ring is the distinguishing factor from perfect days.

---

## Architecture

### New Files

| File | Purpose |
|---|---|
| `src/components/consistency-graph/CelebrationOverlay.tsx` | Full-screen celebration animation (confetti + badge) |
| `src/hooks/useCelebration.ts` | Hook to manage celebration trigger state |
| `src/lib/perfectDetection.ts` | Utility functions for perfect day/week detection |

### Modified Files

| File | Change |
|---|---|
| `src/components/HabitView.tsx` | Add perfect week detection, new cell colors, integrate CelebrationOverlay |
| `src/app/globals.css` | Add celebration CSS variables if needed |

### Data Flow

```
User completes habit → API toggle → HabitView re-fetches habits
→ perfectDay/week detection runs in useMemo
→ if newly perfect: trigger celebration state
→ CelebrationOverlay animates → auto-dismisses after 3s
```

---

## Celebration Animation Detail

**Tech:** Framer Motion + CSS particles (no extra library)

**Sequence:**
1. `t=0ms` — Screen flash overlay fades in/out (200ms total)
2. `t=0ms` — Confetti particles spawn at center, each flies to a random angle/distance (duration 2000ms)
3. `t=200ms` — Badge scales in with spring (scale 0→1.1→1.0, ~600ms)
4. `t=0ms` — Expanding ring fades out behind badge

**Confetti particles:** ~40 particles in theme colors + gold/white, random rotation, fly outward in a circle.

---

## Graph Cell Rendering

**In HabitView.tsx heatmap cell rendering:**

- Perfect week Saturday cell: `bg-primary ring-2 ring-purple-400/60` (purple ring distinguishes from perfect day)
- Perfect day cell: `bg-primary shadow-[0_0_12px_var(--primary)]` (theme-colored glow)
- Normal intensity cells: existing `intensityColors` array

---

## Verification

1. Toggle all habits for a single day → theme glow on cell, celebration animation fires
2. Complete all habits for 7 consecutive days → Saturday cell gets purple ring + theme glow, celebration animation fires
3. Switch themes → colors update to new theme's primary + purple ring stays visible
4. Reload page → celebration does NOT re-fire (state resets cleanly)
