# Habit Detail Modal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-habit detail modal that opens on row click, showing heatmap, charts, and streak analytics in three tabs.

**Architecture:** A new `HabitDetailModal` component receives a `Habit` object and renders a tabbed modal. Per-habit analytics functions are added to `habitAnalytics.ts`. The modal is triggered by clicking a habit row in `HabitView.tsx`.

**Tech Stack:** React, TypeScript, Recharts, Framer Motion, existing `@/lib/chartConfigs` and `@/lib/habitAnalytics`

---

## File Map

| File | Action |
|------|--------|
| `src/lib/habitAnalytics.ts` | Modify — add 5 new exported functions |
| `src/components/HabitView.tsx` | Modify — add `selectedHabit` state + modal markup |
| `src/components/habit/HabitDetailModal.tsx` | Create — the new modal component |

---

## Task 1: Add per-habit analytics functions to `habitAnalytics.ts`

**Files:**
- Modify: `src/lib/habitAnalytics.ts`

- [ ] **Step 1: Add `getHabitCompletionRate` function**

Add this after the existing `calculateStreaks` function (around line 158):

```typescript
// Get completion rate for a single habit over a period
export const getHabitCompletionRate = (
  habit: Habit,
  daysBack: number
): number => {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - daysBack);

  const completionsInPeriod = habit.completedDates.filter(d => {
    const date = new Date(d);
    return date >= cutoff && date <= now;
  }).length;

  const rate = Math.round((completionsInPeriod / daysBack) * 100);
  return Math.min(100, rate);
};
```

- [ ] **Step 2: Add `getHabitTrendData` function**

Add after `getHabitCompletionRate`:

```typescript
// Get per-habit trend data for line chart
export const getHabitTrendData = (
  habit: Habit,
  period: '7d' | '30d' | '90d' | '1y'
): { date: string; rate: number }[] => {
  const daysMap: Record<typeof period, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365
  };
  const daysBack = daysMap[period];
  const data: { date: string; rate: number }[] = [];
  const now = new Date();

  for (let i = daysBack - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const dateStr = toLocalString(date);

    const completed = habit.completedDates.some(d => toLocalString(new Date(d)) === dateStr);
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      rate: completed ? 100 : 0
    });
  }

  return data;
};
```

- [ ] **Step 3: Add `getHabitDayOfWeekData` function**

Add after `getHabitTrendData`:

```typescript
// Get day-of-week breakdown for a single habit
export const getHabitDayOfWeekData = (
  habit: Habit,
  daysBack: number
): { dayName: string; count: number }[] => {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const counts = new Array(7).fill(0);
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - daysBack);

  habit.completedDates.forEach(dateStr => {
    const date = new Date(dateStr);
    if (date >= cutoff && date <= now) {
      counts[date.getDay()]++;
    }
  });

  return dayNames.map((name, i) => ({ dayName: name, count: counts[i] }));
};
```

- [ ] **Step 4: Add `getHabitStreakTimeline` function**

Add after `getHabitDayOfWeekData`:

```typescript
// Get streak timeline for a single habit
export const getHabitStreakTimeline = (
  habit: Habit
): { start: string; end: string; length: number }[] => {
  if (habit.completedDates.length === 0) return [];

  const sorted = [...habit.completedDates]
    .map(d => new Date(d))
    .sort((a, b) => a.getTime() - b.getTime());

  const streaks: { start: string; end: string; length: number }[] = [];
  let streakStart = sorted[0];
  let streakEnd = sorted[0];
  let streakLength = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const diffDays = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streakEnd = curr;
      streakLength++;
    } else {
      streaks.push({
        start: toLocalString(streakStart),
        end: toLocalString(streakEnd),
        length: streakLength
      });
      streakStart = curr;
      streakEnd = curr;
      streakLength = 1;
    }
  }

  // Push final streak
  streaks.push({
    start: toLocalString(streakStart),
    end: toLocalString(streakEnd),
    length: streakLength
  });

  return streaks;
};
```

- [ ] **Step 5: Add `getHabitBestWorstPeriods` function**

Add after `getHabitStreakTimeline`:

```typescript
// Get best and worst periods for a single habit
export const getHabitBestWorstPeriods = (
  habit: Habit,
  daysBack: number
): {
  best: { start: string; end: string; rate: number };
  worst: { start: string; end: string; rate: number };
} => {
  const now = new Date();
  const data: { date: string; completed: boolean }[] = [];

  for (let i = daysBack - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const dateStr = toLocalString(date);
    const completed = habit.completedDates.some(d => toLocalString(new Date(d)) === dateStr);
    data.push({ date: dateStr, completed });
  }

  // Sliding window of 7 days for period analysis
  let best = { start: data[0].date, end: data[6].date, rate: 0 };
  let worst = { start: data[0].date, end: data[6].date, rate: 100 };

  for (let i = 0; i <= data.length - 7; i++) {
    const window = data.slice(i, i + 7);
    const completed = window.filter(d => d.completed).length;
    const rate = Math.round((completed / 7) * 100);
    const start = window[0].date;
    const end = window[window.length - 1].date;

    if (rate > best.rate) best = { start, end, rate };
    if (rate < worst.rate) worst = { start, end, rate };
  }

  return { best, worst };
};
```

- [ ] **Step 6: Add `getHabitLongestStreak` function**

Add after `getHabitBestWorstPeriods`:

```typescript
// Get the longest streak for a single habit
export const getHabitLongestStreak = (habit: Habit): number => {
  const timeline = getHabitStreakTimeline(habit);
  if (timeline.length === 0) return 0;
  return Math.max(...timeline.map(s => s.length));
};
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/habitAnalytics.ts
git commit -m "feat(habits): add per-habit analytics helper functions

Adds getHabitCompletionRate, getHabitTrendData, getHabitDayOfWeekData,
getHabitStreakTimeline, getHabitBestWorstPeriods, getHabitLongestStreak

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Create `HabitDetailModal` component

**Files:**
- Create: `src/components/habit/HabitDetailModal.tsx`

- [ ] **Step 1: Write the component skeleton with imports and types**

```tsx
"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  X, Flame, Award, Zap, Calendar, TrendingUp, BarChart2,
  Activity, Target, Clock
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  Habit,
  getHabitCompletionRate,
  getHabitTrendData,
  getHabitDayOfWeekData,
  getHabitStreakTimeline,
  getHabitBestWorstPeriods,
  getHabitLongestStreak,
  toLocalString
} from "@/lib/habitAnalytics";
import {
  chartColors, CustomTooltip, cardGlassClass, sectionTitleClass,
  heatmapColors, getHeatmapColor
} from "@/lib/chartConfigs";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface HabitDetailModalProps {
  habit: Habit;
  open: boolean;
  onClose: () => void;
}
```

- [ ] **Step 2: Write the PeriodSelector component (local to file)**

```tsx
const PeriodSelector = ({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  const periods = [
    { value: '7d', label: '7D' },
    { value: '30d', label: '30D' },
    { value: '90d', label: '90D' },
    { value: '1y', label: '1Y' }
  ];

  return (
    <div className="flex gap-1 bg-black/20 rounded-lg p-1">
      {periods.map(p => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={cn(
            "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
            value === p.value
              ? "bg-primary text-white"
              : "text-gray-400 hover:text-white"
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
};
```

- [ ] **Step 3: Write the Overview tab content**

```tsx
const OverviewTab = ({ habit, period }: { habit: Habit; period: string }) => {
  const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
  const daysBack = daysMap[period] || 30;

  const rate = getHabitCompletionRate(habit, daysBack);
  const longestStreak = getHabitLongestStreak(habit);

  // Build heatmap data
  const heatmapData = useMemo(() => {
    const now = new Date();
    const weeks: { date: string; week: number; dayOfWeek: number; completed: boolean }[][] = [];
    const start = new Date(now);
    start.setDate(now.getDate() - daysBack + 1);

    // Align to Sunday
    const startDay = start.getDay();
    start.setDate(start.getDate() - startDay);

    let currentWeek: typeof weeks[0] = [];
    let weekIndex = 0;
    let current = new Date(start);

    while (current <= now) {
      const dateStr = toLocalString(current);
      const completed = habit.completedDates.some(d => toLocalString(new Date(d)) === dateStr);
      currentWeek.push({
        date: dateStr,
        week: weekIndex,
        dayOfWeek: current.getDay(),
        completed
      });

      if (current.getDay() === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
        weekIndex++;
      }
      current.setDate(current.getDate() + 1);
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    return weeks;
  }, [habit.completedDates, daysBack]);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={16} className="text-orange-400" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Current</span>
          </div>
          <div className="text-2xl font-black text-white">{habit.streak}</div>
          <div className="text-xs text-gray-500">days</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award size={16} className="text-yellow-400" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Longest</span>
          </div>
          <div className="text-2xl font-black text-white">{longestStreak}</div>
          <div className="text-xs text-gray-500">days</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-purple-400" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total</span>
          </div>
          <div className="text-2xl font-black text-white">{habit.completedDates.length}</div>
          <div className="text-xs text-gray-500">all time</div>
        </div>

        <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-primary" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Rate</span>
          </div>
          <div className="text-2xl font-black text-white">{rate}%</div>
          <div className="text-xs text-gray-500">last {daysBack}d</div>
        </div>
      </div>

      {/* Heatmap */}
      <div className={cardGlassClass}>
        <h3 className={sectionTitleClass}>
          <Calendar size={18} className="text-blue-400" />
          Consistency Heatmap
        </h3>
        <div className="overflow-x-auto">
          <div className="min-w-[400px]">
            <div className="flex gap-1 mb-1">
              <div className="w-8" />
              {Array.from({ length: Math.ceil(daysBack / 7) }, (_, i) => (
                <div key={i} className="flex-1 text-center text-xs text-gray-500">
                  W{i + 1}
                </div>
              ))}
            </div>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dayIdx) => (
              <div key={day} className="flex gap-1 mb-1">
                <div className="w-8 text-xs text-gray-500 flex items-center">{day}</div>
                {heatmapData.map((week, weekIdx) => {
                  const cell = week.find(d => d.dayOfWeek === dayIdx);
                  return (
                    <div
                      key={`${weekIdx}-${dayIdx}`}
                      className="flex-1 h-6 rounded-sm transition-all hover:scale-110 cursor-pointer"
                      style={{
                        backgroundColor: cell?.completed
                          ? getHeatmapColor(1, 1)
                          : 'rgba(255,255,255,0.05)'
                      }}
                      title={cell?.date ? `${cell.date} — ${cell.completed ? 'Completed' : 'Missed'}` : ''}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Write the Charts tab content**

```tsx
const ChartsTab = ({ habit, period }: { habit: Habit; period: string }) => {
  const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
  const daysBack = daysMap[period] || 30;

  const trendData = useMemo(() => getHabitTrendData(habit, period as '7d' | '30d' | '90d' | '1y'), [habit, period]);
  const dayOfWeekData = useMemo(() => getHabitDayOfWeekData(habit, daysBack), [habit, daysBack]);

  return (
    <div className="space-y-6">
      {/* Line chart */}
      <div className={cardGlassClass}>
        <h3 className={sectionTitleClass}>
          <TrendingUp size={18} className="text-primary" />
          Completion Rate Over Time
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="habitRateGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gray[700]} />
              <XAxis
                dataKey="date"
                stroke={chartColors.gray[500]}
                fontSize={10}
                tickLine={false}
              />
              <YAxis
                stroke={chartColors.gray[500]}
                fontSize={10}
                tickLine={false}
                unit="%"
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="rate"
                stroke={chartColors.primary}
                strokeWidth={2}
                fill="url(#habitRateGradient)"
                name="Completion Rate"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Day of week bar chart */}
      <div className={cardGlassClass}>
        <h3 className={sectionTitleClass}>
          <BarChart2 size={18} className="text-purple-400" />
          Completions by Day of Week
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dayOfWeekData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gray[700]} />
              <XAxis dataKey="dayName" stroke={chartColors.gray[500]} fontSize={10} />
              <YAxis stroke={chartColors.gray[500]} fontSize={10} />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="count"
                fill={chartColors.primary}
                radius={[4, 4, 0, 0]}
                name="Completions"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 5: Write the Streaks tab content**

```tsx
const StreaksTab = ({ habit, period }: { habit: Habit; period: string }) => {
  const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
  const daysBack = daysMap[period] || 30;

  const timeline = useMemo(() => getHabitStreakTimeline(habit), [habit]);
  const bestWorst = useMemo(() => getHabitBestWorstPeriods(habit, daysBack), [habit, daysBack]);
  const longestStreak = useMemo(() => getHabitLongestStreak(habit), [habit]);

  // Average streak length
  const avgStreak = useMemo(() => {
    if (timeline.length === 0) return 0;
    const total = timeline.reduce((sum, s) => sum + s.length, 0);
    return Math.round(total / timeline.length);
  }, [timeline]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={cardGlassClass}>
          <div className="flex items-center gap-2 mb-2">
            <Flame size={16} className="text-orange-400" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Current</span>
          </div>
          <div className="text-2xl font-black text-white">{habit.streak}</div>
          <div className="text-xs text-gray-500">days</div>
        </div>

        <div className={cardGlassClass}>
          <div className="flex items-center gap-2 mb-2">
            <Award size={16} className="text-yellow-400" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Longest</span>
          </div>
          <div className="text-2xl font-black text-white">{longestStreak}</div>
          <div className="text-xs text-gray-500">days</div>
        </div>

        <div className={cardGlassClass}>
          <div className="flex items-center gap-2 mb-2">
            <Activity size={16} className="text-blue-400" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Average</span>
          </div>
          <div className="text-2xl font-black text-white">{avgStreak}</div>
          <div className="text-xs text-gray-500">days</div>
        </div>

        <div className={cardGlassClass}>
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-purple-400" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total</span>
          </div>
          <div className="text-2xl font-black text-white">{habit.completedDates.length}</div>
          <div className="text-xs text-gray-500">all time</div>
        </div>
      </div>

      {/* Streak timeline */}
      <div className={cardGlassClass}>
        <h3 className={sectionTitleClass}>
          <Clock size={18} className="text-primary" />
          Streak Timeline
        </h3>
        {timeline.length === 0 ? (
          <p className="text-gray-400 text-sm">No streaks yet</p>
        ) : (
          <div className="space-y-2">
            {timeline.map((streak, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-2 w-32">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${Math.min(100, (streak.length / longestStreak) * 100)}%` }}
                  />
                  <span className="text-sm font-bold text-primary">{streak.length}d</span>
                </div>
                <div className="text-xs text-gray-400">
                  {streak.start} → {streak.end}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Best/Worst periods */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className={cardGlassClass}>
          <h3 className={sectionTitleClass}>
            <TrendingUp size={18} className="text-green-400" />
            Best 7-Day Period
          </h3>
          <div className="text-3xl font-black text-green-400">{bestWorst.best.rate}%</div>
          <div className="text-xs text-gray-500 mt-1">{bestWorst.best.start} → {bestWorst.best.end}</div>
          <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${bestWorst.best.rate}%` }}
            />
          </div>
        </div>

        <div className={cardGlassClass}>
          <h3 className={sectionTitleClass}>
            <Activity size={18} className="text-red-400" />
            Lowest 7-Day Period
          </h3>
          <div className="text-3xl font-black text-red-400">{bestWorst.worst.rate}%</div>
          <div className="text-xs text-gray-500 mt-1">{bestWorst.worst.start} → {bestWorst.worst.end}</div>
          <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full"
              style={{ width: `${bestWorst.worst.rate}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 6: Write the main `HabitDetailModal` component with tab shell and close logic**

```tsx
export const HabitDetailModal = ({ habit, open, onClose }: HabitDetailModalProps) => {
  const [period, setPeriod] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Target },
    { id: 'charts', label: 'Charts', icon: BarChart2 },
    { id: 'streaks', label: 'Streaks', icon: Flame }
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-gray-900 border border-white/10 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <h2 className="text-lg font-black text-white">{habit.title}</h2>
                <p className="text-xs text-gray-400 capitalize">{habit.category}</p>
              </div>
              <div className="flex items-center gap-4">
                <PeriodSelector value={period} onChange={setPeriod} />
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
            </div>

            {/* Tab bar */}
            <div className="flex gap-2 px-6 py-3 border-b border-white/5">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    activeTab === tab.id
                      ? "bg-primary text-white"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'overview' && <OverviewTab habit={habit} period={period} />}
              {activeTab === 'charts' && <ChartsTab habit={habit} period={period} />}
              {activeTab === 'streaks' && <StreaksTab habit={habit} period={period} />}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
```

- [ ] **Step 7: Commit**

```bash
git add src/components/habit/HabitDetailModal.tsx
git commit -m "feat(habits): add HabitDetailModal component with 3 tabs

Overview tab: heatmap calendar + stat cards (streak, rate, total)
Charts tab: completion rate line chart + day-of-week bar chart
Streaks tab: streak stats + timeline + best/worst period analysis

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Integrate modal into `HabitView.tsx`

**Files:**
- Modify: `src/components/HabitView.tsx`

- [ ] **Step 1: Add state and import**

Find the existing `HabitView.tsx` — the component starts around line 40. Add these imports after the existing lucide imports:

```tsx
import { HabitDetailModal } from "./habit/HabitDetailModal";
```

Add `selectedHabit` state after `openDropdownId` state (around line 44):

```tsx
const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
```

- [ ] **Step 2: Add modal markup**

Find the closing of the component's return — add the modal markup just before the final `</div>`:

```tsx
{/* Habit Detail Modal */}
{selectedHabit && (
  <HabitDetailModal
    habit={selectedHabit}
    open={!!selectedHabit}
    onClose={() => setSelectedHabit(null)}
  />
)}
```

- [ ] **Step 3: Add row click handler**

Find the `.group` div that wraps each habit row in the list. Look for the outer `div` that contains the habit row — around line 700-750 in the original file. The row starts with the checkbox button. Add `onClick` to the row's outer `div` that handles opening the modal.

The habit row structure looks like this:
```tsx
<div className="group relative flex items-center gap-4 p-4 ...">
  {/* Checkbox button */}
  <button onClick={() => toggleHabit(...)} ...>
  {/* Title section */}
  <div className="flex-1 min-w-0 ...">
    <div ...>{habit.title}</div>
  </div>
  {/* Dropdown + actions */}
  <button onClick={(e) => { e.stopPropagation(); setOpenDropdownId(...) }}>...
```

Add `onClick` to the outer `div` like this:

```tsx
<div
  className="group relative flex items-center gap-4 p-4 ..."
  onClick={(e) => {
    // Don't open modal when clicking checkbox, dropdown button, or delete
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('[data-no-modal]')
    ) return;
    setSelectedHabit(habit);
  }}
>
```

Add `data-no-modal` attribute to the checkbox button and dropdown button:
- On checkbox button: `data-no-modal="true"` in the `<button>` tag
- On dropdown button: `data-no-modal="true"` in the `<button>` tag
- On delete button: `data-no-modal="true"` in the `<button>` tag

- [ ] **Step 4: Run tests**

```bash
npm run test -- --run 2>&1 | head -50
```

- [ ] **Step 5: Commit**

```bash
git add src/components/HabitView.tsx
git commit -m "feat(habits): open detail modal on habit row click

Adds HabitDetailModal to HabitView, triggered by clicking a habit row
(excluding checkbox, dropdown, and delete buttons). Shows heatmap,
charts, and streak analytics in a tabbed modal.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Spec Coverage Check

| Spec Section | Tasks |
|---|---|
| Overview tab (heatmap + stats) | Task 2, Step 3 |
| Charts tab (line + day-of-week) | Task 2, Step 4 |
| Streaks tab (stats + timeline + best/worst) | Task 2, Step 5 |
| Analytics functions | Task 1, Steps 1–6 |
| Modal trigger integration | Task 3, Steps 1–3 |
| Period selector (7D/30D/90D/1Y) | Task 2, Steps 2, 3, 4, 5 |
| Close on backdrop click | Task 2, Step 6 |
| Tab navigation | Task 2, Step 6 |
