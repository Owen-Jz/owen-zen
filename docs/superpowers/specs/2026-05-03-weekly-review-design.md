# Weekly Review — Design Spec

## Overview

Add a new top-level page `/weekly-review` where you do a structured weekly review each week. The page auto-populates with data from your tracked domains (tasks, habits, gym, finance) and lets you fill in freeform reflections. Past reviews are saved and browsable by week.

---

## Data Model

**Collection:** `weeklyreviews`

```typescript
interface WeeklyReview {
  _id: string;
  weekKey: string;         // ISO week string: "2026-W18"
  createdAt: Date;
  updatedAt: Date;

  // Auto-populated on open (derived from other collections)
  autoStats: {
    tasksCompleted: number;
    tasksTotal: number;
    dailyHabitCompliance: number;    // % of daily habits done this week
    weeklyHabitCompliance: number;   // % of weekly habits done this week
    gymSessions: number;
    totalWorkoutMinutes: number;
    expensesTotal: number;
    incomeTotal: number;
    netCashflow: number;
  };

  // Manual entries
  wins: string;            // freeform text
  challenges: string;      // freeform text
  lessonsLearned: string;   // freeform text
  nextWeekActions: string;  // freeform text
  mood: 'great' | 'good' | 'okay' | 'rough' | 'terrible';
  energy: 'high' | 'medium' | 'low';
  focus: 'sharp' | 'moderate' | 'scattered';
  notableDays: NotableDay[];  // per-day notes
}

interface NotableDay {
  date: string;            // "2026-05-03"
  label: string;           // e.g., "Monday"
  notes: string;           // freeform
  highlights: string;      // freeform
}
```

---

## Page Layout

```
┌─────────────────────────────────────────────────────┐
│  [← Prev]   May 2026 — Week 18   [Next →]  [History ▼] │
│                                                     │
│  ┌─────────────────────┐  ┌──────────────────────┐ │
│  │ Tasks         14/20 │  │ Wins                 │ │
│  │ ████████████░░░ 70% │  │ [textarea]           │ │
│  │                     │  │                       │ │
│  │ Daily Habits   85%  │  ├──────────────────────┤ │
│  │ Weekly Habits  60%  │  │ Challenges           │ │
│  │                     │  │ [textarea]           │ │
│  │ Gym Sessions   3    │  │                       │ │
│  │ 180 min total       │  ├──────────────────────┤ │
│  │                     │  │ Lessons Learned      │ │
│  │ Finance             │  │ [textarea]           │ │
│  │ Expenses: $340      │  │                       │ │
│  │ Income: $2,100      │  ├──────────────────────┤ │
│  │ Net: +$1,760        │  │ Next Week Actions    │ │
│  └─────────────────────┘  │ [textarea]           │ │
│                           ├──────────────────────┤ │
│  Quick Status              │ Notable Days         │ │
│  Mood: 😊 Great            │ [Day] [notes field]  │ │
│  Energy: ⚡ High           │ [Day] [notes field]  │ │
│  Focus: 🎯 Sharp           │ ...                   │ │
│                           └──────────────────────┘ │
│                              [ Save Review ]         │
└─────────────────────────────────────────────────────┘
```

- **Left column (40%)** — stats cards, auto-populated, read-only
- **Right column (60%)** — manual entry sections, editable
- **Header** — week navigation (← Week →) + history dropdown
- **Save Review** — saves to DB, shows confirmation toast

---

## Stats Calculation Logic

**Week range:** Monday to Sunday of the selected ISO week.

| Stat | Source | Calculation |
|------|--------|-------------|
| Tasks completed | `tasks` | Completed between week Mon–Sun |
| Tasks total | `tasks` | All tasks with dueDate in that week |
| Daily habit compliance | `habits` | % of (habit check-ins / possible check-ins) Mon–Sun |
| Weekly habit compliance | `weeklyhabits` | % of weekly habits with that week in completedWeeks |
| Gym sessions | `gymSessions` | Count of sessions Mon–Sun |
| Workout minutes | `gymSessions` | Sum of duration from gymSessions Mon–Sun |
| Expenses total | `expenses` | Sum of amount Mon–Sun |
| Income total | `income` | Sum of amount Mon–Sun |
| Net cashflow | `expenses`/`income` | Income - Expenses |

---

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/weekly-reviews/[weekKey]` | Get review for a specific week |
| GET | `/api/weekly-reviews` | List all reviews (for history dropdown) |
| POST | `/api/weekly-reviews` | Create or update review for a week |
| DELETE | `/api/weekly-reviews/[weekKey]` | Delete a review |

### POST /api/weekly-reviews — Body

```json
{
  "weekKey": "2026-W18",
  "wins": "...",
  "challenges": "...",
  "lessonsLearned": "...",
  "nextWeekActions": "...",
  "mood": "good",
  "energy": "high",
  "focus": "sharp",
  "notableDays": [
    { "date": "2026-05-03", "label": "Monday", "notes": "...", "highlights": "..." }
  ]
}
```

Auto-stats are computed server-side on write, not sent by client.

---

## UI Components

### Stats Card
- Icon + label at top
- Large number/metric in center
- Progress bar or secondary stat at bottom
- Color-coded by category (green=habits, blue=tasks, orange=gym, yellow=finance)

### Manual Entry Section
- Label on top (Wins, Challenges, etc.)
- Textarea below, auto-expanding
- Subtle border, transparent background, visible on focus
- Character count not needed (shallow scope)

### Notable Days Section
- Compact day picker: Mon–Sun chips, click to expand
- Each day has two fields: "What happened?" and "Highlights"
- Collapsed by default, one day visible at a time

### Week Navigation
- Left/right arrows to move week-by-week
- "Today" button when viewing a past week
- History dropdown shows weeks that have saved reviews (distinct from all weeks)

### Save Button
- Fixed at bottom of right column
- Primary button style
- Shows "Saved ✓" briefly after save, then returns to "Save Review"

---

## Key Behaviors

1. **Open page** → fetch review for current ISO week → if none exists, show blank template with auto-stats populated
2. **Navigate weeks** → fetch that week's review (or blank with stats if none exists)
3. **Save** → POST to API → update local state with "Saved ✓" feedback for 2s
4. **History dropdown** → shows all weeks that have saved reviews, click to jump to that week
5. **New week auto-creates** → when navigating to a week with no review, show blank template (no auto-save until user saves manually)

---

## File Changes

1. `src/models/WeeklyReview.ts` — new mongoose schema
2. `src/app/api/weekly-reviews/route.ts` — GET list, POST create/update
3. `src/app/api/weekly-reviews/[weekKey]/route.ts` — GET one, DELETE
4. `src/app/weekly-review/page.tsx` — new page component
5. `src/components/weekly-review/` — shared sub-components:
   - `WeeklyReviewStats.tsx`
   - `WeeklyReviewForm.tsx`
   - `NotableDayEditor.tsx`

---

## Dependencies

- Week key helper `getCurrentWeekKey()` already exists in `HabitView.tsx` — extract to `src/lib/dateUtils.ts` for reuse
- Auto-stats aggregation uses existing models: `Task`, `Habit`, `WeeklyHabit`, `GymSession`, `Expense`, `Income`
- No new external dependencies needed

---

## Default State (blank review)

When opening a week with no saved review:
- Auto-stats are computed and shown (read-only)
- All text fields are empty
- Mood/Energy/Focus default to `null` (not shown until set)
- Notable days shows Mon–Sun chips, all collapsed