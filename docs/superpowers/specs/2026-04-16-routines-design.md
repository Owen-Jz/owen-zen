# Routines Section — Design Specification

**Date:** 2026-04-16
**Status:** Approved

---

## Overview

The Routines section is a new top-level sidebar section in the ONZ dashboard. It allows grouping individual habit-like items into daily routines (Morning Routine, Work Sprint, Social Sprint, Evening Sprint), marking each item complete independently, and viewing a consistency graph per routine. Routines are entirely self-contained — no connection to the Habits section yet.

---

## Data Model

**`Routine` model** (`src/models/Routine.ts`):

```typescript
{
  _id: ObjectId,
  title: String,           // "Morning Routine", "Work Sprint", etc.
  icon: String,            // emoji string, e.g. "☀️"
  color: String,           // accent hex color for the routine card
  items: [{
    _id: ObjectId,
    title: String,         // "Brush", "Pray / Devotion / Bible Reading"
    completedDates: [Date], // normalized to midnight, tracks completion history per item
  }],
  order: Number,           // display order in sidebar
  createdAt: Date,
}
```

- Items are subdocuments. Each item tracks its own `completedDates` array.
- The Routine model is **entirely separate** from `Habit`. No foreign keys, no links.
- When habit linking is added later, a `habitId: ObjectId` field is added to the items schema.
- Dates are normalized to midnight in `Africa/Lagos` timezone, matching the HabitView pattern.

---

## API Routes

All routes call `dbConnect()` before any database operation. Responses follow `{ success: boolean, data?, error? }`.

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/routines` | List all routines with their items |
| POST | `/api/routines` | Create a new routine |
| PUT | `/api/routines/[id]` | Update routine (title, icon, color, order) |
| DELETE | `/api/routines/[id]` | Delete a routine |
| POST | `/api/routines/[id]/items` | Add item to a routine |
| PUT | `/api/routines/[id]/items/[itemId]` | Update item title |
| DELETE | `/api/routines/[id]/items/[itemId]` | Remove item from routine |
| PUT | `/api/routines/[id]/items/[itemId]/toggle` | Toggle item completion for today |

**GET `/api/routines`** response shape:
```json
{
  "success": true,
  "data": [
    {
      "_id": "...,
      "title": "Morning Routine",
      "icon": "☀️",
      "color": "#f59e0b",
      "items": [
        { "_id": "...", "title": "Brush", "completedDates": ["2026-04-15", "2026-04-14"] },
        ...
      ],
      "order": 0
    },
    ...
  ]
}
```

**PUT `/api/routines/[id]/items/[itemId]/toggle`** — toggles today in `completedDates`:
- If today is already in the array → remove it (mark incomplete)
- If today is not in the array → add it (mark complete)
- Returns `{ success: true, data: updatedItem }`

---

## Sidebar Structure

The Routines section appears as its own top-level expandable group in the sidebar, positioned between "Core" and "Health":

```
Routines
├── ☀️ Morning Routine
├── 💼 Work Sprint
├── 🌱 Social Sprint
└── 🌙 Evening Routine
```

Each routine name is a nav item with an active-pill animation (same `layoutId` pattern used throughout the sidebar). Clicking opens the Routine Detail View in the main content area.

---

## Routine Detail View (Main Content Area)

**Header:**
- Routine title + icon (large, left-aligned)
- "X/Y items completed today" progress line with a thin animated fill bar
- Today's date (e.g., "Thursday, April 16, 2026")

**Item List:**
- Each item is a toggle row with a checkbox and label
- Tapping the row toggles completion (optimistic update → API)
- Completed items show a filled checkbox + subtle strikethrough on the label
- Items are not reorderable via drag-drop in v1
- Double-clicking an item label allows inline editing

**Consistency Graph:**
- **Weekly strip**: Mon–Sun cells (7 columns), color intensity based on how many items were completed that day. Intensity levels 0–4 match the HabitView heatmap scale.
- **Monthly grid**: full month calendar view, same GitHub-style heatmap as `HabitAnalyticsView`
- Navigation arrows to browse to past weeks/months
- Styled to match the existing heatmap in `HabitView` — same `bg-white/5` to `bg-primary` gradient

**Celebration Animation:**
- When all items in a routine are marked complete for today:
  - The item list container does a **quick scale bounce: 1 → 1.05 → 1** (200ms total)
  - A checkmark icon briefly overlays the routine header and fades out (400ms)
  - Animation uses Framer Motion (already in use in the project)
  - Tracked automatically — the consistency graph updates immediately

---

## Component Inventory

### `RoutinesView.tsx`
Main view rendered in the canvas area when a routine is selected. Fetches routine data via React Query, renders header, item list, and heatmap.

States: loading skeleton, populated, empty (no items yet — shows "Add your first item" prompt).

### `RoutineItem.tsx`
Single toggle row.

Props: `item`, `onToggle`, `onEditTitle`
States: unchecked, checked (completed today), editing (inline text input)

### `RoutineHeatmap.tsx`
Consistency graph component.

Props: `completedDatesByItem`, `view` (`"week"` | `"month"`), `weekOffset`, `onWeekChange`, `onMonthChange`

- Week view: Mon–Sun strip with 7 cells
- Month view: full month grid with day cells
- Color intensity: 0 items = `bg-white/5`, 1 = `bg-primary/25`, 2 = `bg-primary/50`, 3 = `bg-primary/75`, 4 = `bg-primary`
- Uses same `Intl.DateTimeFormat` / timezone logic as `HabitView`

### `canvas/RoutinesCenter.tsx`
A fixed-position widget for the sidebar nav preview (optional). Shows routine icons in a compact row for quick access from the canvas area.

---

## UX Decisions

1. **Partial completion allowed** — items can be completed independently. The routine does not enforce "all-or-nothing" completion. This lets you track progress without committing to doing the full routine.
2. **No habit linking yet** — items store only title strings. No `habitId` field. Linking is deferred until after v1.
3. **Optimistic UI** — toggling updates local state immediately, then syncs to API. On failure, UI reverts to previous state.
4. **Date normalization** — all date comparisons use `Africa/Lagos` timezone via `Intl.DateTimeFormat`, matching the existing codebase pattern.
5. **Celebration is automatic** — the animation fires whenever all items are complete for today. No manual trigger needed.

---

## Default Routine Data (Seeded on First Load)

| Routine | Icon | Color | Items |
|---------|------|-------|-------|
| Morning Routine | ☀️ | `#f59e0b` (amber) | Brush, Pray/Devotion/Bible Reading, Clean Room/Make Bed/Pushups, Morning Jog Exercise, Food Prep, Journal, Reply Messages |
| Work Sprint | 💼 | `#3b82f6` (blue) | Find something inspiring / Study business/technology, Build a product feature, Deep Work, Ship Code |
| Social Sprint | 🌱 | `#22c55e` (green) | Improve a skill/Get inspired, Create Content, Publish something online, Reach out to someone |
| Evening Routine | 🌙 | `#8b5cf6` (violet) | Shower, Plan the next day, Track expenses, Dance |

---

## File Map

```
src/
├── models/Routine.ts                    # new
├── app/api/routines/
│   ├── route.ts                         # GET, POST
│   └── [id]/
│       ├── route.ts                     # PUT, DELETE
│       └── items/
│           ├── route.ts                 # POST
│           └── [itemId]/
│               ├── route.ts             # PUT, DELETE
│               └── toggle/route.ts      # PUT
└── components/
    ├── RoutinesView.tsx                 # main view
    ├── RoutineItem.tsx                  # toggle row
    ├── RoutineHeatmap.tsx               # consistency graph
    └── canvas/
        └── RoutinesCenter.tsx           # optional sidebar widget
```

---

## Out of Scope (v1)

- Habit linking (`habitId` field, bidirectional sync)
- Drag-to-reorder items within a routine
- Routine completion streak tracking (per-routine "streak" shown in header)
- Sharing/exporting routine data
- Editable routine icon/color from the UI (edit via API for now)
