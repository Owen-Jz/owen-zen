# Weekly Non-Negotiables Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Weekly Non-Negotiables" section below Daily Non-Negotiables in HabitView, with separate data model, API routes, and weekly consistency bar chart.

**Architecture:** Separate `WeeklyHabit` mongoose model and API routes. Weekly completion is tracked per ISO week (Mon–Sun). Streak = consecutive calendar weeks completed. Consistency graph = weekly bar chart showing last 16 weeks.

**Tech Stack:** Next.js App Router, Mongoose, Framer Motion, existing Tailwind/shadcn patterns from HabitView.

---

## File Map

| Action | File |
|--------|------|
| Create | `src/models/WeeklyHabit.ts` |
| Create | `src/app/api/weekly-habits/route.ts` |
| Create | `src/app/api/weekly-habits/[id]/route.ts` |
| Modify | `src/components/HabitView.tsx` |

---

## Tasks

### Task 1: Create WeeklyHabit Model

**Files:**
- Create: `src/models/WeeklyHabit.ts`

- [ ] **Step 1: Write the model**

```typescript
import mongoose from 'mongoose';

const WeeklyHabitSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title for this weekly habit.'],
    maxlength: [100, 'Title cannot be more than 100 characters'],
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters'],
  },
  category: {
    type: String,
    enum: ['health', 'work', 'learning', 'mindset'],
    default: 'work',
  },
  streak: {
    type: Number,
    default: 0,
  },
  completedWeeks: {
    type: [String], // ISO week strings: "YYYY-Www" e.g. "2026-W12"
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.WeeklyHabit || mongoose.model('WeeklyHabit', WeeklyHabitSchema);
```

- [ ] **Step 2: Commit**

```bash
git add src/models/WeeklyHabit.ts
git commit -m "feat(weekly-habits): add WeeklyHabit mongoose model"
```

---

### Task 2: Create API Routes

**Files:**
- Create: `src/app/api/weekly-habits/route.ts`
- Create: `src/app/api/weekly-habits/[id]/route.ts`

**Route.ts (GET + POST):**

```typescript
import dbConnect from "@/lib/db";
import WeeklyHabit from "@/models/WeeklyHabit";
import { NextResponse } from "next/server";

export async function GET() {
  await dbConnect();
  const habits = await WeeklyHabit.find({}).sort({ createdAt: -1 });
  return NextResponse.json({ success: true, data: habits });
}

export async function POST(req: Request) {
  await dbConnect();
  const body = await req.json();
  const habit = await WeeklyHabit.create(body);
  return NextResponse.json({ success: true, data: habit }, { status: 201 });
}
```

**[id]/route.ts (PUT + DELETE):**

```typescript
import dbConnect from "@/lib/db";
import WeeklyHabit from "@/models/WeeklyHabit";
import { NextResponse } from "next/server";

// Helper: get ISO week string "YYYY-Www" from a date
const toISOWeek = (d: Date) => {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((t.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
};

// Parse "2026-W12" -> { year: 2026, week: 12 }
const parseWeek = (w: string) => {
  const [year, week] = w.split('-W').map(Number);
  return { year, week };
};

// Add weeks to a week string
const addWeeks = (w: string, n: number): string => {
  const { year, week } = parseWeek(w);
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const week1Monday = new Date(jan1);
  week1Monday.setDate(jan1.getDate() + (jan1.getDay() <= 4 ? 1 - jan1.getDay() : 8 - jan1.getDay()));
  const target = new Date(week1Monday);
  target.setDate(week1Monday.getDate() + (week - 1) * 7 + n * 7);
  return toISOWeek(target);
};

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;
  const { action, date } = await req.json();

  const habit = await WeeklyHabit.findById(id);
  if (!habit) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  const targetDate = date ? new Date(date) : new Date();
  const currentWeek = toISOWeek(targetDate);

  if (action === "toggle") {
    const weekIdx = habit.completedWeeks.indexOf(currentWeek);
    if (weekIdx >= 0) {
      // Uncomplete: remove this week
      habit.completedWeeks.splice(weekIdx, 1);
    } else {
      // Complete: add week
      habit.completedWeeks.push(currentWeek);
    }
    habit.completedWeeks.sort();

    // Recalculate streak: walk backwards from current week
    let streak = 0;
    const sorted = [...habit.completedWeeks].sort();
    // Start from most recent week and count backwards
    for (let i = sorted.length - 1; i >= 0; i--) {
      const expected = addWeeks(sorted[sorted.length - 1], -(sorted.length - 1 - i));
      if (i === sorted.length - 1) {
        // Most recent week — check if it's current or last week
        const recent = parseWeek(sorted[i]);
        const today = parseWeek(toISOWeek(new Date()));
        const diff = (today.year - recent.year) * 52 + (today.week - recent.week);
        if (diff <= 1) {
          streak = 1;
        } else {
          break;
        }
      } else {
        // Check if consecutive
        const prev = parseWeek(sorted[i]);
        const curr = parseWeek(sorted[i + 1]);
        const expectedWeek = (prev.week + 1) > 52 ? 1 : prev.week + 1;
        const expectedYear = prev.week + 1 > 52 ? prev.year + 1 : prev.year;
        if (curr.week === expectedWeek && curr.year === expectedYear) {
          streak++;
        } else {
          break;
        }
      }
    }

    habit.streak = streak;
    await habit.save();
  }

  return NextResponse.json({ success: true, data: habit });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;
  await WeeklyHabit.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/weekly-habits/route.ts src/app/api/weekly-habits/[id]/route.ts
git commit -m "feat(weekly-habits): add API routes for weekly habits CRUD"
```

---

### Task 3: Add Weekly Section to HabitView

**Files:**
- Modify: `src/components/HabitView.tsx`

This is the largest change — add the weekly section UI below the existing heatmap footer. Key additions:

1. State: `const [weeklyHabits, setWeeklyHabits] = useState<WeeklyHabit[]>([])`
2. Fetch on mount: `fetch("/api/weekly-habits")` similar to daily habits
3. Seed defaults: 3 weekly habits on first load
4. Toggle: `PUT /api/weekly-habits/[id]` with `action: "toggle"`
5. Delete: `DELETE /api/weekly-habits/[id]`
6. Stats cards: This Week, Weekly Consistency, Current Streak, Total Weeks
7. List: Same card layout as daily but week-level checkoff
8. Weekly bar chart: Last 16 weeks, bars filled if week is complete

**Weekly section should be inserted after the heatmap footer div (before closing `</div>` of the main container).**

Key implementation details:
- `toISOWeek(date)` helper — returns `"YYYY-Www"` string
- `getWeekNumber(date)` — for bar chart X-axis labels
- Week comparison for bar chart: fill bar if `completedWeeks.includes(weekStr)`
- `isCompletedThisWeek(habit)` — check if current ISO week is in `habit.completedWeeks`
- Use `motion` from framer-motion for animations on weekly list items

- [ ] **Step 1: Add state, fetch, and seed for weekly habits** (add to HabitView.tsx)

- [ ] **Step 2: Add weekly section with stats cards, list, and bar chart**

- [ ] **Step 3: Commit**

```bash
git add src/components/HabitView.tsx
git commit -m "feat(weekly-habits): add weekly non-negotiables section to HabitView"
```

---

### Task 4: Verify in Browser

- [ ] **Step 1:** Run `npm run dev` and navigate to the habits page
- [ ] **Step 2:** Confirm daily section still works (check/uncheck habits)
- [ ] **Step 3:** Confirm weekly section appears below heatmap
- [ ] **Step 4:** Create a weekly habit and mark it complete — verify streak increments
- [ ] **Step 5:** Verify bar chart renders with last 16 weeks

---

## Testing Checklist

- [ ] Weekly habit can be created
- [ ] Weekly habit can be toggled complete/incomplete for current week
- [ ] Streak increments when completing consecutive weeks
- [ ] Streak resets when a week is missed
- [ ] Bar chart shows correct filled/empty bars for past weeks
- [ ] Delete removes the weekly habit
- [ ] Daily habits section is unaffected
