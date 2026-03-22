# Bible Verse Bank — Design Spec

## Context

The Focus Dashboard is the first thing Owen sees each morning. It currently shows task-focused widgets but lacks a daily spiritual anchor. A Bible verse widget would provide a rotating daily scripture — short, impactful, and motivating — without requiring any interaction.

The codebase already has a Bible verse pattern in `VisionBoardView.tsx` (12 verses, day-of-year cycling, serif quote styling). This spec extends that pattern.

## What We're Building

A compact Bible verse **widget card** on the Focus Dashboard that shows one scripture per day, cycling deterministically through a curated list of ~200 verses. No user interaction required — it simply displays the verse for the day.

## Design

### Visual Style
- **Card**: `bg-surface` background, `border-border` border, `rounded-2xl` corners, `p-6` padding — matches existing card styling on the dashboard
- **Verse text**: Large serif font (`font-serif`), `text-xl` size, italic, white/off-white — mirrors the existing VisionBoardView verse style
- **Reference**: Small, muted text below verse with a short horizontal accent line (`w-8 h-[1px] bg-primary`)
- **Icon**: `BookOpen` from lucide-react, primary color, shown above the verse label
- **Label**: `"Daily Word"` in small caps above the icon (`text-xs font-bold uppercase tracking-[0.2em]`)
- **Animation**: `motion.div` with `opacity: 0 → 1, y: 20 → 0` on mount — same pattern as VisionBoardView

### Layout
- The widget is a single card occupying roughly half the width of a standard dashboard column (or full width on mobile)
- Card height is content-driven (not fixed)
- No expandable/collapsed state — always shows the full verse

### Color & Theme
- Uses the existing `primary` color for accents — adapts automatically to light/dark theme
- Background uses `bg-surface` (theme-aware)

## Data

### Verse Collection
- **~200 well-known, motivational scriptures** covering topics: faith, discipline, perseverance, purpose, courage, hope, trust, diligence, wisdom, strength
- **Flat array** — no categories (simplicity, per user request)
- **Format**: `{ text: string, ref: string }` — same as existing `VERSES` array in VisionBoardView
- **Source**: Manually curated from popular/canonical Christian scriptures — no API, no external dependency

### Selection Logic
- Deterministic day-of-year algorithm (already in codebase):
  ```typescript
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const verse = VERSES[dayOfYear % VERSES.length];
  ```
- Same verse shows all day; changes at midnight local time
- Cycle period: ~200 days before repeating

### File Location
- `VERSES` array stored in `src/data/verses.ts` (new file)
- Component stored in `src/components/DailyWordWidget.tsx` (new file)

## Component: DailyWordWidget

### Props
None — self-contained, reads date internally.

### Behavior
- Selects verse on mount using day-of-year logic
- No refresh button needed (verves auto-change at midnight)
- No "mark as read" tracking

### Export
```typescript
export const DailyWordWidget = () => JSX.Element
```

## Placement on Dashboard

The widget should appear as a **section** in the existing `SectionsGrid` modal so it can be added to the Focus Board like any other widget.

**SectionsGrid integration:**
- Add `Daily Word` to the sections list with `BookOpen` icon
- When selected, renders `<DailyWordWidget />` in the active sections grid

This keeps it consistent with all other dashboard sections (Habits, Stats, Gym Tracker, etc.).

## Implementation Steps

1. Create `src/data/verses.ts` with the ~200-verse array
2. Create `src/components/DailyWordWidget.tsx` mirroring VisionBoardView verse styling
3. Add `Daily Word` entry to `SectionsGrid.tsx` section list
4. Render `<DailyWordWidget />` when the section is active

## Out of Scope
- Verse categories or filtering
- "Mark as read" or read history tracking
- Bible API integration
- Notification or reminder features
- Standalone full-page view (VisionBoardView already handles this)
