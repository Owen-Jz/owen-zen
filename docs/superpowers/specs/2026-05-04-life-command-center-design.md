# Life Command Center — Design Spec
**Date:** 2026-05-04
**Status:** Approved

---

## Overview

A unified "Life Command Center" dashboard that aggregates every dimension of Owen Zen into a single high-density bento-grid view. Accessible via a sidebar link as a dedicated `/command-center` route. Designed for the user to know exactly where they stand across all life domains by glancing at one screen.

---

## Design Direction

| Attribute | Choice |
|-----------|--------|
| **Layout** | Bento Grid — asymmetric 12-column grid, cards span different widths based on importance |
| **Density** | Balanced — each card shows key stats + a visual element; some scroll internally |
| **Aesthetic** | Zen Minimal — warm off-white paper-like background, muted earthy palette, generous whitespace, soft shadows, elegant serif + sans typography |
| **Navigation** | Drill-down — clicking any card navigates to that section's full page view |

---

## Sections Included

### Productivity
- **Tasks** — MIT count, overdue badge, kanban column preview
- **Weekly Goals** — progress bar, completion percentage

### Habits
- **Daily Habits** — today's completion ring, streak count
- **Weekly Habits** — weekly progress ring

### Physical
- **Gym** — sessions this week, streak, next planned workout type
- **Nutrition** — macros summary ring, meal compliance

### Finance
- **Balance** — current balance (or net position)
- **Monthly Budget** — spend vs budget progress bar
- **Top Category** — highest spending category with mini bar

### Growth
- **Courses** — active courses with mini progress bars
- **Achievements** — latest earned badge, XP progress toward next

### Content & Pipeline
- **Content Calendar** — posts scheduled this week, content calendar mini grid
- **Leads Pipeline** — open leads by stage (prospecting/qualified/closed)

### Life Admin
- **Inbox** — unprocessed count
- **Bucket List** — top 2 items
- **Journal** — streak count

---

## Grid Layout

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: "Life Command Center" + live clock + date          │
├─────────┬─────────────┬───────────────┬───────────────────┤
│ TODAY   │ HABITS      │ TASKS          │ FINANCE           │
│ (2 col) │ (3 col)     │ (4 col)        │ (3 col)           │
│ Streak  │ Today ring  │ MITs + count   │ Balance           │
│ + date  │ + weekly    │ Board preview  │ Budget bar        │
├─────────┴─────────────┼───────────────┼───────────────────┤
│ GYM (4 col)           │ NUTRITION     │ GROWTH            │
│ Sessions + streak     │ (4 col)        │ (4 col)           │
│ + next workout        │ Macros ring    │ Courses progress  │
├───────────────────────┴───────────────┴───────────────────┤
│ CONTENT (6 col)              │ LIFE (6 col)                │
│ Calendar + Leads pipeline     │ Inbox + Bucket + Journal   │
└──────────────────────────────┴─────────────────────────────┘
```

**Responsive:**
- **≥1280px**: Full 12-column grid as above
- **768–1279px**: 6-column grid, cards stack to fill rows
- **<768px**: Single column, full-width cards, vertical scroll

---

## Visual Design

### Color Palette
| Role | Hex |
|------|-----|
| Background | `#F8F6F3` |
| Card background | `#FFFFFF` |
| Card border | `#E8E4DE` |
| Primary text | `#1A1A1A` |
| Secondary text | `#6B6560` |
| Accent (streaks/highlights) | `#C4A882` |
| Success | `#7A9E7E` |
| Warning | `#D4915A` |
| Error | `#C46B6B` |

### Typography
- **Display (headers):** `Cormorant Garamond` — elegant serif
- **Body:** `DM Sans` — clean modern sans-serif
- **Numbers/monospace:** `DM Mono` — for stats and data

### Card Styling
- Border-radius: `12px`
- Shadow: `0 1px 3px rgba(0,0,0,0.04)` (default), `0 4px 12px rgba(0,0,0,0.08)` (hover)
- Hover: `translateY(-1px)` with shadow deepen, `200ms ease` transition
- Section headers: small caps, letter-spacing `0.08em`

### Animations
- **Page load:** Cards fade in with staggered delay — `opacity 0→1`, `300ms ease-out`, `40ms` delay per card, left-to-right, top-to-bottom
- **Hover:** `200ms ease` transition on all card properties
- **Number updates:** Brief scale pulse (`1.0 → 1.05 → 1.0`, `150ms`)

---

## Interactions

- **Drill-down navigation:** Clicking any card navigates to that section's full page
  - Tasks → `/page` (task board view)
  - Habits → `/` (habit section)
  - Finance → FinanceView
  - Gym → GymView
  - etc.
- **No expand-in-place or popover actions** — simplicity over feature richness
- **Hover state:** Cards lift with shadow deepening to indicate interactivity

---

## Component Inventory

### `<CommandCenterPage>` (page component)
- Fetches all data in parallel on mount (tasks, habits, gym, finance, courses, leads, inbox, etc.)
- Renders a responsive bento grid container with header
- Loading state: skeleton cards matching the grid layout

### `<BentoGrid>` (layout container)
- CSS Grid with `grid-template-columns: repeat(12, 1fr)`
- Handles responsive breakpoints via media queries
- Gap: `16px`

### `<TodayCard>` (2 col)
- Shows current day name (large), date, streak flame with count
- Accent border-left on streak ≥ 7

### `<HabitCard>` (3 col)
- Circular progress ring for today's completion %
- Weekly habit sparkline (7-day trend)
- Streak counter with bronze accent

### `<TaskCard>` (4 col)
- MIT count with priority indicator
- Overdue task badge (warning color if overdue > 0)
- Mini kanban preview (3 column stubs: To Do / In Progress / Done)

### `<FinanceCard>` (3 col)
- Balance figure (large, DM Mono)
- Monthly budget progress bar
- Top spending category with mini horizontal bar

### `<GymCard>` (4 col)
- Sessions this week (e.g., "3/4 sessions")
- Current streak flame
- Next planned workout type text

### `<NutritionCard>` (4 col)
- Macros ring (protein / carbs / fat mini donut chart)
- Meal compliance indicator (e.g., "2/3 meals logged")

### `<GrowthCard>` (4 col)
- Active courses list with progress bars (up to 3)
- Latest achievement badge with icon

### `<ContentCard>` (6 col)
- Posts scheduled this week count
- 7-day mini calendar grid (dots on days with scheduled content)

### `<LeadsCard>` (6 col)
- Pipeline columns: Open / Qualified / Closed (3 mini columns)
- Count and total value per stage

### `<LifeCard>` (6 col)
- Inbox count with badge
- Top 2 bucket list items
- Journal streak with flame

### Header
- Title "Life Command Center" in Cormorant Garamond
- Live clock (updates every second)
- Current date

---

## Data Fetching

All data fetched client-side via React Query (following existing project patterns):

```
GET /api/tasks         → task counts, MIT list, overdue
GET /api/habits        → daily habits, completion dates, streaks
GET /api/weekly-habits → weekly habit progress
GET /api/gym-sessions  → recent sessions, streak
GET /api/finance/stats → balance, monthly spend, budget
GET /api/courses       → active courses, progress
GET /api/leads         → pipeline stages and counts
GET /api/inbox         → unprocessed count
GET /api/bucket-list   → top items
GET /api/achievements  → latest achievement, XP progress
GET /api/weekly-goals  → goal progress %
GET /api/food          → today's macros
GET /api/content-calendar → scheduled posts this week
```

Each card independently handles its own loading/error states.

---

## Technical Approach

- **Route:** `src/app/command-center/page.tsx` (new file)
- **Component:** `src/components/CommandCenter.tsx` (main component)
- **Card components:** `src/components/command-center/*.tsx` (one file per card)
- **Styling:** Tailwind CSS v4 with CSS variables matching the color palette
- **State:** React Query for server state (existing pattern in project)
- **Animation:** Framer Motion for entrance animations (existing dependency)
- **No new dependencies** — reuses existing project infrastructure

---

## Scope Boundaries

**In scope:**
- Bento grid layout with all specified cards
- Drill-down navigation to existing section pages
- Zen Minimal styling (warm palette, serif + sans typography)
- Staggered entrance animations
- Responsive behavior (1280px / 768px / mobile)
- Loading skeleton states per card
- Real data from existing APIs

**Out of scope (not in this spec):**
- Editing or action capabilities from the command center (drill-down only)
- Customizable card layout / drag-to-reorder
- Notification panel integration
- Dark mode toggle
- Data export

---

## Implementation Order

1. Create `src/app/command-center/page.tsx` route
2. Build `BentoGrid` layout component
3. Create each card component (`TodayCard`, `HabitCard`, `TaskCard`, etc.)
4. Wire up data fetching with React Query
5. Add loading skeletons
6. Add Framer Motion entrance animations
7. Style with Zen Minimal palette + typography
8. Test responsive breakpoints
9. Add sidebar navigation link