# Habit Detail Modal — Design Spec

## Context

Users want to see per-habit performance breakdowns without leaving the habit list. Currently `HabitView.tsx` shows all habits in a list, and `HabitAnalyticsView.tsx` shows aggregate analytics across all habits. There's no way to inspect an individual habit's history and stats.

## What We're Building

A modal that opens when clicking anywhere on a habit row (excluding the checkbox toggle and the dropdown menu button). The modal shows three tabs of detailed analytics for that single habit.

## Component Structure

### New file: `src/components/habit/HabitDetailModal.tsx`

Reusable modal component. Props:
```typescript
interface HabitDetailModalProps {
  habit: Habit;
  open: boolean;
  onClose: () => void;
}
```

### Tab structure

| Tab | Content |
|-----|---------|
| **Overview** | Heatmap calendar + stat cards (current streak, longest streak, total completions, completion rate %) |
| **Charts** | Line chart: completion rate over selected period; Bar chart: day-of-week breakdown |
| **Streaks** | Streak stats (current, longest, total); Streak timeline; Best/worst period analysis |

### Period Filter

Available in all tabs. Options: `7D` / `30D` / `90D` / `1Y`. Default: `30D`.

## Overview Tab Details

### Heatmap Calendar
- GitHub-style contribution grid for the selected period
- X-axis: weeks (Mon–Sun columns), Y-axis: days (Sun–Sat rows)
- Color intensity: number of completions that day (0 = empty, 1+ = filled)
- Show `YYYY-MM-DD` tooltip on hover
- Uses existing `heatmapColors` / `getHeatmapColor` from `@/lib/chartConfigs`

### Stat Cards (4 across)
1. **Current Streak** — habit.streak value + "days" label
2. **Longest Streak** — longest ever streak for this habit + "days" label
3. **Total Completions** — habit.completedDates.length + "all time" label
4. **Completion Rate** — completions / possible days in period + "%" label

## Charts Tab Details

### Line Chart (completion rate over time)
- X-axis: dates within selected period
- Y-axis: 0–100%
- Single line for this habit's completion rate
- Tooltip on hover showing date + rate %
- Uses `recharts` `<LineChart>` with `<Area>` fill below line

### Bar Chart (day-of-week)
- X-axis: Sun / Mon / Tue / Wed / Thu / Fri / Sat
- Y-axis: completion count
- Single bar per day showing how many times this habit was completed on that weekday across the period
- Uses `recharts` `<BarChart>`

## Streaks Tab Details

### Stats (same 3 as Overview but with more context)
- **Current Streak**: days in current unbroken chain
- **Longest Streak**: best streak ever achieved
- **Total Completions**: all-time count
- **Average Streak Length**: mean of all streak lengths

### Streak Timeline
- Visual timeline showing each streak as a colored segment
- X-axis: calendar timeline
- Each streak is a bar/segment colored by length (longer = more saturated)
- Hover shows: "Streak: X days | Started: YYYY-MM-DD"

### Best / Worst Period Analysis
- **Best period**: consecutive days of highest completion density
- **Worst period**: longest gap or lowest density period
- Text + simple bar visualization

## Analytics Functions to Add (in `src/lib/habitAnalytics.ts`)

```typescript
// Get per-habit trend data for line chart
export const getHabitTrendData = (
  habit: Habit,
  period: '7d' | '30d' | '90d' | '1y'
): { date: string; rate: number }[]

// Get day-of-week breakdown for a single habit
export const getHabitDayOfWeekData = (
  habit: Habit,
  daysBack: number
): { dayName: string; count: number }[]

// Get streak timeline for a single habit
export const getHabitStreakTimeline = (
  habit: Habit
): { start: string; end: string; length: number }[]

// Get completion rate for a single habit over a period
export const getHabitCompletionRate = (
  habit: Habit,
  daysBack: number
): number

// Get best and worst periods
export const getHabitBestWorstPeriods = (
  habit: Habit,
  daysBack: number
): { best: { start: string; end: string; rate: number }; worst: { start: string; end: string; rate: number } }
```

## Integration

### Triggering the modal in `HabitView.tsx`

Add state:
```typescript
const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
```

On the habit row (inside the `.group` div), add `onClick`:
```typescript
onClick={(e) => {
  // Don't open if clicking checkbox, dropdown, or delete button
  if (e.target === checkboxRef.current || dropdownButtonRef.current) return;
  setSelectedHabit(habit);
}}
```

The checkbox button and dropdown button already have their own `onClick` handlers with `e.stopPropagation()` — those will naturally take precedence.

### Modal markup in `HabitView.tsx`
```tsx
{selectedHabit && (
  <HabitDetailModal
    habit={selectedHabit}
    open={!!selectedHabit}
    onClose={() => setSelectedHabit(null)}
  />
)}
```

## UI / Design

- Use existing glass-card styling via `cardGlassClass` from `@/lib/chartConfigs`
- Use existing `chartColors`, `categoryColors`, `CustomTooltip` from `@/lib/chartConfigs`
- Modal: centered overlay with `bg-black/60 backdrop-blur-sm`, inner content `bg-gray-900 rounded-2xl`
- Close button: top-right X icon
- Tab bar: same style as `HabitAnalyticsView` section nav
- Period selector: same `PeriodSelector` component used in `HabitAnalyticsView`
- Animations: `framer-motion` for modal entrance (scale + fade)

## Scope

**In scope:**
- New `HabitDetailModal` component
- New analytics helper functions in `habitAnalytics.ts`
- Integration into `HabitView.tsx`

**Out of scope:**
- Changes to `HabitAnalyticsView`
- Backend/API changes
- Data persistence changes
