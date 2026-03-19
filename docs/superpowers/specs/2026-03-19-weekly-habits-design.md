# Weekly Non-Negotiables — Design Spec

## Overview

Add a "Weekly Non-Negotiables" section below the existing "Daily Non-Negotiables" in `HabitView.tsx`. Weekly habits are tracked independently with their own data model, API routes, and consistency visualization.

---

## Data Model

**Collection:** `weeklyhabits`

```typescript
interface WeeklyHabit {
  _id: string;
  title: string;
  description?: string;
  category: string;
  streak: number;           // consecutive calendar weeks completed
  completedWeeks: string[]; // ISO week strings, e.g. "2026-W12"
  createdAt: Date;
}
```

**ISO Week Format:** `"YYYY-Www"` (e.g., `"2026-W12"`) — derived from `toISOString()` which uses Monday as first day of week.

---

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/weekly-habits` | List all weekly habits |
| POST | `/api/weekly-habits` | Create a weekly habit |
| PUT | `/api/weekly-habits/[id]` | Toggle week completion, update streak |
| DELETE | `/api/weekly-habits/[id]` | Delete a weekly habit |

### PUT /api/weekly-habits/[id] — Streak Calculation

1. Determine current ISO week: `date.toISOString().slice(0, 7)` → `"2026-W12"`
2. If current week already in `completedWeeks`, toggle off (uncomplete)
3. If not, add current week to `completedWeeks`, sort ascending
4. Recalculate streak: walk backwards through weeks, count consecutive ones
   - Week A is consecutive to Week B if `weekA + 1 === weekB` (numerically)
5. Save updated `completedWeeks` array and `streak` count

---

## UI Components

### Section Structure

```
[Advanced Stats — 4 grid cards]          ← already exists

[Daily Non-Negotiables — habit list]      ← already exists

[Heatmap footer — daily consistency]       ← already exists

[NEW: Weekly Non-Negotiables — list]       ← new section below
[NEW: Weekly consistency bar chart]        ← new section below
```

### Weekly Stats Cards

Four small stat cards at the top of the weekly section:
- **This Week** — completed / total weekly habits (with progress bar)
- **Weekly Consistency** — % of weeks with all habits done (last 8 weeks)
- **Current Streak** — longest active weekly streak across all habits
- **Total Weeks Completed** — sum of all completed weeks across all weekly habits

### Weekly Habits List

- Mirrors the daily habits list layout (checkbox, title, description, streak badge, delete)
- **Checkbox** — marks the current week as complete/incomplete
- **Streak badge** — shows consecutive weeks count (e.g., 🔥 4)
- **Week indicator** — shows whether this habit was completed "this week" with a checkmark
- No weekly mini-dots (unlike daily which shows Mon–Sun dots)

### Weekly Consistency Bar Chart

- Horizontal bar chart showing last **16 weeks**
- Each bar = one calendar week (Mon–Sun)
- Filled bar (primary color) = all weekly habits completed that week
- Empty bar = at least one habit missed
- Partial fill = some habits completed (tooltip shows exact count)
- Below the chart: thin progress bar showing overall weekly completion rate

---

## Key Differences from Daily Habits

| Aspect | Daily | Weekly |
|--------|-------|--------|
| Frequency | Every day | Once per calendar week |
| Completion | Toggle per day | Toggle per ISO week |
| Streak reset | Gap of 2+ days | Gap of 2+ weeks |
| Consistency view | GitHub-style heatmap (daily dots) | Bar chart (weekly bars) |
| Data field | `completedDates: Date[]` | `completedWeeks: string[]` |

---

## File Changes

1. `src/models/WeeklyHabit.ts` — new mongoose schema
2. `src/app/api/weekly-habits/route.ts` — GET, POST
3. `src/app/api/weekly-habits/[id]/route.ts` — PUT, DELETE
4. `src/components/HabitView.tsx` — add weekly section UI
5. `src/lib/habitAnalytics.ts` — add weekly analytics helpers (optional, can be inline)

---

## Default Weekly Habits (seeded on first load)

1. **Full Body Gym Session** — "Train hard, track reps and sets"
2. **Weekly Review** — "Review the week's wins, losses, and next actions"
3. **Clear Inbox to Zero** — "Process all outstanding emails and messages"
