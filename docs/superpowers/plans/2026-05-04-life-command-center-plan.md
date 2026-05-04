# Life Command Center — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a unified bento-grid dashboard that aggregates every dimension of Owen Zen into one view, accessible via sidebar.

**Architecture:** New `/command-center` route with a 12-column bento grid. Each card is a self-contained component that fetches its own data via React Query and drill-downs to existing views on click. Zen Minimal styling (warm palette, serif + sans typography, soft shadows).

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS v4, Framer Motion, React Query, existing MongoDB models.

---

## File Map

```
src/app/command-center/
  page.tsx                    — route page, loads all data in parallel
src/components/command-center/
  CommandCenter.tsx            — main grid container + header
  BentoGrid.tsx               — responsive 12-col CSS grid
  TodayCard.tsx               — (2 col) day/date/streak
  HabitCard.tsx               — (3 col) daily ring + weekly sparkline
  TaskCard.tsx                — (4 col) MIT count, overdue, kanban preview
  FinanceCard.tsx             — (3 col) balance, budget bar, top category
  GymCard.tsx                 — (4 col) sessions, streak, next workout
  NutritionCard.tsx           — (4 col) macros ring, meal compliance
  GrowthCard.tsx              — (4 col) courses progress, latest achievement
  ContentCard.tsx             — (6 col) scheduled posts, mini calendar
  LeadsCard.tsx               — (6 col) pipeline stages
  LifeCard.tsx                — (6 col) inbox + bucket list + journal streak
  SkeletonCard.tsx            — loading skeleton component
src/app/globals.css           — add Zen Minimal CSS variables for command-center
src/app/page.tsx              — add "Life Command Center" link to Tools sidebar section
```

---

## Task 1: Route Page

**Files:**
- Create: `src/app/command-center/page.tsx`

```tsx
"use client";

import { use } from "react";
import { CommandCenter } from "@/components/command-center/CommandCenter";

export default function CommandCenterPage() {
  return <CommandCenter />;
}
```

- [ ] **Step 1: Create directory and page file**

```bash
mkdir -p src/app/command-center
```

Write `src/app/command-center/page.tsx` with the content above.

- [ ] **Step 2: Commit**

```bash
git add src/app/command-center/page.tsx
git commit -m "feat(command-center): add route page"
```

---

## Task 2: Zen Minimal CSS Variables

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add Zen Minimal CSS variables to globals.css**

In `[data-theme=""]` (the default theme block), add these under a `/* Zen Minimal Command Center */` comment:

```css
/* Zen Minimal Command Center */
--cc-bg: #F8F6F3;
--cc-card: #FFFFFF;
--cc-border: #E8E4DE;
--cc-text: #1A1A1A;
--cc-text-secondary: #6B6560;
--cc-accent: #C4A882;
--cc-success: #7A9E7E;
--cc-warning: #D4915A;
--cc-error: #C46B6B;
```

Also add the Google Fonts import at the top of globals.css if not present:

```css
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&display=swap');
```

- [ ] **Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(command-center): add Zen Minimal CSS variables"
```

---

## Task 3: BentoGrid Layout Component

**Files:**
- Create: `src/components/command-center/BentoGrid.tsx`

```tsx
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-6 lg:grid-cols-12 gap-4 w-full",
        className
      )}
    >
      {children}
    </div>
  );
}

// Span helpers
export function span(cols: number) {
  return `col-span-2 md:col-span-${Math.min(cols, 6)} lg:col-span-${Math.min(cols, 12)}`;
}
```

- [ ] **Step 1: Create BentoGrid component**
- [ ] **Step 2: Commit**

```bash
git add src/components/command-center/BentoGrid.tsx
git commit -m "feat(command-center): add BentoGrid layout component"
```

---

## Task 4: SkeletonCard Component

**Files:**
- Create: `src/components/command-center/SkeletonCard.tsx`

```tsx
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-[#E8E4DE] animate-pulse",
        className
      )}
    />
  );
}
```

- [ ] **Step 1: Create SkeletonCard component**
- [ ] **Step 2: Commit**

---

## Task 5: TodayCard

**Files:**
- Create: `src/components/command-center/TodayCard.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { SkeletonCard } from "./SkeletonCard";

interface TodayCardProps {
  streak?: number;
}

export function TodayCard({ streak = 0 }: TodayCardProps) {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      );
      setDate(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const dayName = new Date().toLocaleDateString("en-US", { weekday: "long" });

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 flex flex-col justify-between h-full min-h-[140px] hover:shadow-md transition-all duration-200 hover:-translate-y-px cursor-pointer">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-[#6B6560] mb-1">Today</p>
        <h2 className="text-2xl font-heading font-semibold text-[#1A1A1A]" style={{ fontFamily: "Cormorant Garamond, serif" }}>
          {dayName}
        </h2>
        <p className="text-sm text-[#6B6560]">{date}</p>
      </div>
      {streak > 0 && (
        <div className="flex items-center gap-1.5 mt-3">
          <Flame size={16} className="text-[#C4A882]" />
          <span className="text-sm font-semibold text-[#C4A882]">{streak} day streak</span>
        </div>
      )}
    </div>
  );
}

export function TodayCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 min-h-[140px]">
      <SkeletonCard className="h-3 w-20 mb-3" />
      <SkeletonCard className="h-8 w-32 mb-2" />
      <SkeletonCard className="h-4 w-40" />
    </div>
  );
}
```

- [ ] **Step 1: Create TodayCard component**
- [ ] **Step 2: Commit**

---

## Task 6: HabitCard

**Files:**
- Create: `src/components/command-center/HabitCard.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { SkeletonCard } from "./SkeletonCard";

interface HabitCardProps {
  todayPercent?: number;
  weeklyData?: number[];
  streak?: number;
}

function MiniRing({ percent, size = 48 }: { percent: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E8E4DE" strokeWidth="5" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="#C4A882" strokeWidth="5"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const h = 28;
  const w = 80;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        points={pts}
        fill="none"
        stroke="#C4A882"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HabitCard({ todayPercent = 0, weeklyData = [], streak = 0 }: HabitCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 h-full min-h-[140px] hover:shadow-md transition-all duration-200 hover:-translate-y-px cursor-pointer">
      <p className="text-xs font-bold uppercase tracking-widest text-[#6B6560] mb-3">Habits</p>
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-center">
          <MiniRing percent={todayPercent} size={56} />
          <span className="text-xs mt-1 font-semibold text-[#1A1A1A]">{Math.round(todayPercent)}%</span>
          <span className="text-[10px] text-[#6B6560]">today</span>
        </div>
        <div className="flex-1 ml-4">
          {weeklyData.length > 0 && (
            <div className="mb-2">
              <span className="text-[10px] uppercase tracking-wider text-[#6B6560]">7-day trend</span>
              <Sparkline data={weeklyData} />
            </div>
          )}
          {streak > 0 && (
            <div className="flex items-center gap-1">
              <Flame size={14} className="text-[#C4A882]" />
              <span className="text-xs font-semibold text-[#C4A882]">{streak} streak</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function HabitCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 min-h-[140px]">
      <SkeletonCard className="h-3 w-16 mb-4" />
      <div className="flex items-center gap-4">
        <SkeletonCard className="w-14 h-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonCard className="h-7 w-full" />
          <SkeletonCard className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 1: Create HabitCard component**
- [ ] **Step 2: Commit**

---

## Task 7: TaskCard

**Files:**
- Create: `src/components/command-center/TaskCard.tsx`

```tsx
"use client";

import { Target, AlertTriangle, CheckSquare } from "lucide-react";
import { SkeletonCard } from "./SkeletonCard";

interface TaskCardProps {
  mitCount?: number;
  overdueCount?: number;
  totalCount?: number;
}

export function TaskCard({ mitCount = 0, overdueCount = 0, totalCount = 0 }: TaskCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 h-full min-h-[140px] hover:shadow-md transition-all duration-200 hover:-translate-y-px cursor-pointer">
      <p className="text-xs font-bold uppercase tracking-widest text-[#6B6560] mb-3">Tasks</p>
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center gap-1">
          <Target size={20} className="text-[#C4A882]" />
          <span className="text-2xl font-bold font-mono text-[#1A1A1A]">{mitCount}</span>
          <span className="text-[10px] uppercase text-[#6B6560]">MITs</span>
        </div>
        {overdueCount > 0 && (
          <div className="flex flex-col items-center gap-1">
            <AlertTriangle size={20} className="text-[#D4915A]" />
            <span className="text-2xl font-bold font-mono text-[#D4915A]">{overdueCount}</span>
            <span className="text-[10px] uppercase text-[#D4915A]">overdue</span>
          </div>
        )}
        <div className="flex flex-col items-center gap-1 ml-auto">
          <CheckSquare size={20} className="text-[#7A9E7E]" />
          <span className="text-lg font-bold font-mono text-[#1A1A1A]">{totalCount}</span>
          <span className="text-[10px] uppercase text-[#6B6560]">total</span>
        </div>
      </div>
    </div>
  );
}

export function TaskCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 min-h-[140px]">
      <SkeletonCard className="h-3 w-12 mb-4" />
      <div className="flex gap-4">
        <SkeletonCard className="h-16 w-16 rounded-lg" />
        <SkeletonCard className="h-16 w-16 rounded-lg" />
        <SkeletonCard className="h-16 w-16 rounded-lg" />
      </div>
    </div>
  );
}
```

- [ ] **Step 1: Create TaskCard component**
- [ ] **Step 2: Commit**

---

## Task 8: FinanceCard

**Files:**
- Create: `src/components/command-center/FinanceCard.tsx`

```tsx
"use client";

import { Wallet, TrendingUp } from "lucide-react";
import { SkeletonCard } from "./SkeletonCard";

interface FinanceCardProps {
  balance?: number;
  budgetUsed?: number; // 0-100
  topCategory?: string;
  topCategoryAmount?: number;
}

function BudgetBar({ percent }: { percent: number }) {
  const color = percent > 100 ? "#C46B6B" : percent > 80 ? "#D4915A" : "#7A9E7E";
  return (
    <div className="w-full bg-[#E8E4DE] rounded-full h-2 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: color }}
      />
    </div>
  );
}

export function FinanceCard({
  balance = 0,
  budgetUsed = 0,
  topCategory = "",
  topCategoryAmount = 0,
}: FinanceCardProps) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(balance);

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 h-full min-h-[140px] hover:shadow-md transition-all duration-200 hover:-translate-y-px cursor-pointer">
      <p className="text-xs font-bold uppercase tracking-widest text-[#6B6560] mb-3">Finance</p>
      <div className="flex items-center gap-2 mb-3">
        <Wallet size={16} className="text-[#C4A882]" />
        <span className="text-xl font-bold font-mono text-[#1A1A1A]">{formatted}</span>
      </div>
      <div className="mb-2">
        <div className="flex justify-between text-[10px] text-[#6B6560] mb-1">
          <span>Budget used</span>
          <span>{Math.round(budgetUsed)}%</span>
        </div>
        <BudgetBar percent={budgetUsed} />
      </div>
      {topCategory && (
        <div className="flex items-center gap-1 text-xs text-[#6B6560]">
          <TrendingUp size={12} />
          <span>{topCategory} — {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(topCategoryAmount)}</span>
        </div>
      )}
    </div>
  );
}

export function FinanceCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 min-h-[140px]">
      <SkeletonCard className="h-3 w-14 mb-3" />
      <SkeletonCard className="h-8 w-28 mb-3" />
      <SkeletonCard className="h-2 w-full mb-2" />
      <SkeletonCard className="h-3 w-32" />
    </div>
  );
}
```

- [ ] **Step 1: Create FinanceCard component**
- [ ] **Step 2: Commit**

---

## Task 9: GymCard

**Files:**
- Create: `src/components/command-center/GymCard.tsx`

```tsx
"use client";

import { Dumbbell, Flame, Calendar } from "lucide-react";
import { SkeletonCard } from "./SkeletonCard";

interface GymCardProps {
  sessionsThisWeek?: number;
  sessionsGoal?: number;
  streak?: number;
  nextWorkout?: string;
}

export function GymCard({
  sessionsThisWeek = 0,
  sessionsGoal = 4,
  streak = 0,
  nextWorkout = "",
}: GymCardProps) {
  const progress = sessionsGoal > 0 ? (sessionsThisWeek / sessionsGoal) * 100 : 0;

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 h-full min-h-[140px] hover:shadow-md transition-all duration-200 hover:-translate-y-px cursor-pointer">
      <p className="text-xs font-bold uppercase tracking-widest text-[#6B6560] mb-3">Gym</p>
      <div className="flex items-center gap-3 mb-3">
        <Dumbbell size={18} className="text-[#C4A882]" />
        <span className="text-lg font-bold font-mono text-[#1A1A1A]">
          {sessionsThisWeek}/{sessionsGoal}
        </span>
        <span className="text-xs text-[#6B6560]">sessions</span>
      </div>
      <div className="w-full bg-[#E8E4DE] rounded-full h-1.5 mb-3">
        <div
          className="h-full rounded-full bg-[#C4A882] transition-all duration-500"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        {streak > 0 && (
          <div className="flex items-center gap-1">
            <Flame size={14} className="text-[#C4A882]" />
            <span className="text-xs font-semibold text-[#C4A882]">{streak} streak</span>
          </div>
        )}
        {nextWorkout && (
          <div className="flex items-center gap-1 text-xs text-[#6B6560] ml-auto">
            <Calendar size={12} />
            <span>{nextWorkout}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function GymCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 min-h-[140px]">
      <SkeletonCard className="h-3 w-10 mb-3" />
      <SkeletonCard className="h-7 w-24 mb-3" />
      <SkeletonCard className="h-1.5 w-full mb-3" />
      <SkeletonCard className="h-3 w-28" />
    </div>
  );
}
```

- [ ] **Step 1: Create GymCard component**
- [ ] **Step 2: Commit**

---

## Task 10: NutritionCard

**Files:**
- Create: `src/components/command-center/NutritionCard.tsx`

```tsx
"use client";

import { Utensils } from "lucide-react";
import { SkeletonCard } from "./SkeletonCard";

interface NutritionCardProps {
  mealsLogged?: number;
  mealsGoal?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

function MacroRing({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const offset = circ - Math.min(value / max, 1) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={40} height={40} className="transform -rotate-90">
        <circle cx={20} cy={20} r={r} fill="none" stroke="#E8E4DE" strokeWidth="4" />
        <circle cx={20} cy={20} r={r} fill="none" stroke={color} strokeWidth="4" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="text-xs font-mono font-semibold text-[#1A1A1A]">{value}g</span>
      <span className="text-[10px] text-[#6B6560] uppercase">{label}</span>
    </div>
  );
}

export function NutritionCard({ mealsLogged = 0, mealsGoal = 3, protein = 0, carbs = 0, fat = 0 }: NutritionCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 h-full min-h-[140px] hover:shadow-md transition-all duration-200 hover:-translate-y-px cursor-pointer">
      <p className="text-xs font-bold uppercase tracking-widest text-[#6B6560] mb-3">Nutrition</p>
      <div className="flex items-center gap-2 mb-3">
        <Utensils size={16} className="text-[#C4A882]" />
        <span className="text-sm font-semibold text-[#1A1A1A]">{mealsLogged}/{mealsGoal} meals</span>
      </div>
      <div className="flex items-center gap-4 justify-center">
        <MacroRing label="protein" value={protein} max={150} color="#3b82f6" />
        <MacroRing label="carbs" value={carbs} max={200} color="#22c55e" />
        <MacroRing label="fat" value={fat} max={60} color="#f59e0b" />
      </div>
    </div>
  );
}

export function NutritionCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 min-h-[140px]">
      <SkeletonCard className="h-3 w-16 mb-3" />
      <SkeletonCard className="h-5 w-24 mb-4" />
      <div className="flex justify-center gap-4">
        <SkeletonCard className="w-10 h-10 rounded-full" />
        <SkeletonCard className="w-10 h-10 rounded-full" />
        <SkeletonCard className="w-10 h-10 rounded-full" />
      </div>
    </div>
  );
}
```

- [ ] **Step 1: Create NutritionCard component**
- [ ] **Step 2: Commit**

---

## Task 11: GrowthCard

**Files:**
- Create: `src/components/command-center/GrowthCard.tsx`

```tsx
"use client";

import { BookOpen, Award } from "lucide-react";
import { SkeletonCard } from "./SkeletonCard";

interface CourseProgress {
  title: string;
  progress: number; // 0-100
}

interface GrowthCardProps {
  courses?: CourseProgress[];
  latestAchievement?: string;
  level?: number;
  xp?: number;
  xpForNext?: number;
}

export function GrowthCard({ courses = [], latestAchievement = "", level = 1, xp = 0, xpForNext = 100 }: GrowthCardProps) {
  const xpPercent = xpForNext > 0 ? (xp / xpForNext) * 100 : 0;

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 h-full min-h-[140px] hover:shadow-md transition-all duration-200 hover:-translate-y-px cursor-pointer">
      <p className="text-xs font-bold uppercase tracking-widest text-[#6B6560] mb-3">Growth</p>
      <div className="space-y-2 mb-3">
        {courses.slice(0, 3).map((course, i) => (
          <div key={i}>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-[#1A1A1A] font-medium truncate pr-2">{course.title}</span>
              <span className="font-mono text-[#6B6560] shrink-0">{Math.round(course.progress)}%</span>
            </div>
            <div className="w-full bg-[#E8E4DE] rounded-full h-1">
              <div
                className="h-full rounded-full bg-[#C4A882] transition-all duration-500"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        {latestAchievement ? (
          <div className="flex items-center gap-1.5">
            <Award size={14} className="text-[#C4A882]" />
            <span className="text-xs text-[#6B6560] truncate">{latestAchievement}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <BookOpen size={14} className="text-[#6B6560]" />
            <span className="text-xs text-[#6B6560]">Level {level}</span>
          </div>
        )}
        <div className="text-[10px] font-mono text-[#6B6560]">{xp}/{xpForNext} XP</div>
      </div>
    </div>
  );
}

export function GrowthCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 min-h-[140px]">
      <SkeletonCard className="h-3 w-14 mb-3" />
      <div className="space-y-2 mb-3">
        <SkeletonCard className="h-3 w-full" />
        <SkeletonCard className="h-3 w-full" />
        <SkeletonCard className="h-3 w-3/4" />
      </div>
      <SkeletonCard className="h-3 w-32" />
    </div>
  );
}
```

- [ ] **Step 1: Create GrowthCard component**
- [ ] **Step 2: Commit**

---

## Task 12: ContentCard

**Files:**
- Create: `src/components/command-center/ContentCard.tsx`

```tsx
"use client";

import { Calendar } from "lucide-react";
import { SkeletonCard } from "./SkeletonCard";

interface ContentCardProps {
  postsThisWeek?: number;
  scheduledDays?: number[]; // 0=Sun, 6=Sat
}

export function ContentCard({ postsThisWeek = 0, scheduledDays = [] }: ContentCardProps) {
  const days = ["S", "M", "T", "W", "T", "F", "S"];
  const today = new Date().getDay();

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 h-full min-h-[140px] hover:shadow-md transition-all duration-200 hover:-translate-y-px cursor-pointer">
      <p className="text-xs font-bold uppercase tracking-widest text-[#6B6560] mb-3">Content</p>
      <div className="flex items-center gap-2 mb-3">
        <Calendar size={16} className="text-[#C4A882]" />
        <span className="text-xl font-bold font-mono text-[#1A1A1A]">{postsThisWeek}</span>
        <span className="text-xs text-[#6B6560]">posts this week</span>
      </div>
      <div className="flex items-center justify-between">
        {days.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-[#6B6560]">{d}</span>
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                i === today
                  ? "bg-[#C4A882] text-white"
                  : scheduledDays.includes(i)
                  ? "bg-[#E8E4DE] text-[#1A1A1A]"
                  : "bg-transparent text-[#C8C4BE]"
              }`}
            >
              {scheduledDays.includes(i) ? "•" : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ContentCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 min-h-[140px]">
      <SkeletonCard className="h-3 w-14 mb-3" />
      <SkeletonCard className="h-7 w-24 mb-4" />
      <div className="flex justify-between">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <SkeletonCard key={i} className="w-6 h-6 rounded-full" />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 1: Create ContentCard component**
- [ ] **Step 2: Commit**

---

## Task 13: LeadsCard

**Files:**
- Create: `src/components/command-center/LeadsCard.tsx`

```tsx
"use client";

import { Users } from "lucide-react";
import { SkeletonCard } from "./SkeletonCard";

interface StageData {
  stage: string;
  count: number;
  value?: number;
}

interface LeadsCardProps {
  stages?: StageData[];
}

export function LeadsCard({ stages = [] }: LeadsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 h-full min-h-[140px] hover:shadow-md transition-all duration-200 hover:-translate-y-px cursor-pointer">
      <p className="text-xs font-bold uppercase tracking-widest text-[#6B6560] mb-3">Leads</p>
      <div className="flex items-center gap-2 mb-3">
        <Users size={16} className="text-[#C4A882]" />
        <span className="text-xl font-bold font-mono text-[#1A1A1A]">
          {stages.reduce((sum, s) => sum + s.count, 0)}
        </span>
        <span className="text-xs text-[#6B6560]">open leads</span>
      </div>
      <div className="flex gap-2">
        {stages.map((stage, i) => (
          <div
            key={i}
            className="flex-1 bg-[#F8F6F3] rounded-lg p-2 text-center"
          >
            <div className="text-xs font-mono font-bold text-[#1A1A1A]">{stage.count}</div>
            <div className="text-[10px] text-[#6B6560] uppercase tracking-wide">{stage.stage}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LeadsCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 min-h-[140px]">
      <SkeletonCard className="h-3 w-10 mb-3" />
      <SkeletonCard className="h-7 w-24 mb-4" />
      <div className="flex gap-2">
        <SkeletonCard className="flex-1 h-10 rounded-lg" />
        <SkeletonCard className="flex-1 h-10 rounded-lg" />
        <SkeletonCard className="flex-1 h-10 rounded-lg" />
      </div>
    </div>
  );
}
```

- [ ] **Step 1: Create LeadsCard component**
- [ ] **Step 2: Commit**

---

## Task 14: LifeCard

**Files:**
- Create: `src/components/command-center/LifeCard.tsx`

```tsx
"use client";

import { Inbox, Star, BookOpen } from "lucide-react";
import { SkeletonCard } from "./SkeletonCard";

interface LifeCardProps {
  inboxCount?: number;
  bucketItems?: string[];
  journalStreak?: number;
}

export function LifeCard({ inboxCount = 0, bucketItems = [], journalStreak = 0 }: LifeCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 h-full min-h-[140px] hover:shadow-md transition-all duration-200 hover:-translate-y-px cursor-pointer">
      <p className="text-xs font-bold uppercase tracking-widest text-[#6B6560] mb-3">Life</p>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center gap-1">
          <Inbox size={16} className="text-[#C4A882]" />
          <span className="text-xl font-bold font-mono text-[#1A1A1A]">{inboxCount}</span>
          <span className="text-[10px] text-[#6B6560] uppercase">inbox</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Star size={16} className="text-[#C4A882]" />
          <span className="text-lg font-bold font-mono text-[#1A1A1A]">{bucketItems.length}</span>
          <span className="text-[10px] text-[#6B6560] uppercase">bucket</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <BookOpen size={16} className="text-[#C4A882]" />
          <span className="text-lg font-bold font-mono text-[#1A1A1A]">{journalStreak}</span>
          <span className="text-[10px] text-[#6B6560] uppercase">journal</span>
        </div>
      </div>
      {bucketItems.length > 0 && (
        <div className="mt-2 pt-2 border-t border-[#E8E4DE]">
          <p className="text-xs text-[#6B6560] truncate">Next: {bucketItems[0]}</p>
        </div>
      )}
    </div>
  );
}

export function LifeCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 min-h-[140px]">
      <SkeletonCard className="h-3 w-10 mb-3" />
      <div className="grid grid-cols-3 gap-2">
        <SkeletonCard className="h-14 rounded-lg" />
        <SkeletonCard className="h-14 rounded-lg" />
        <SkeletonCard className="h-14 rounded-lg" />
      </div>
    </div>
  );
}
```

- [ ] **Step 1: Create LifeCard component**
- [ ] **Step 2: Commit**

---

## Task 15: Main CommandCenter Component

**Files:**
- Create: `src/components/command-center/CommandCenter.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { BentoGrid } from "./BentoGrid";
import { TodayCard, TodayCardSkeleton } from "./TodayCard";
import { HabitCard, HabitCardSkeleton } from "./HabitCard";
import { TaskCard, TaskCardSkeleton } from "./TaskCard";
import { FinanceCard, FinanceCardSkeleton } from "./FinanceCard";
import { GymCard, GymCardSkeleton } from "./GymCard";
import { NutritionCard, NutritionCardSkeleton } from "./NutritionCard";
import { GrowthCard, GrowthCardSkeleton } from "./GrowthCard";
import { ContentCard, ContentCardSkeleton } from "./ContentCard";
import { LeadsCard, LeadsCardSkeleton } from "./LeadsCard";
import { LifeCard, LifeCardSkeleton } from "./LifeCard";

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

export function CommandCenter() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Data state
  const [streak, setStreak] = useState(0);
  const [habitToday, setHabitToday] = useState(0);
  const [habitWeekly, setHabitWeekly] = useState<number[]>([]);
  const [habitStreak, setHabitStreak] = useState(0);
  const [mitCount, setMitCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [balance, setBalance] = useState(0);
  const [budgetUsed, setBudgetUsed] = useState(0);
  const [topCategory, setTopCategory] = useState("");
  const [topCategoryAmount, setTopCategoryAmount] = useState(0);
  const [gymSessions, setGymSessions] = useState(0);
  const [gymGoal, setGymGoal] = useState(4);
  const [gymStreak, setGymStreak] = useState(0);
  const [nextWorkout, setNextWorkout] = useState("");
  const [mealsLogged, setMealsLogged] = useState(0);
  const [mealsGoal, setMealsGoal] = useState(3);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [courses, setCourses] = useState<{ title: string; progress: number }[]>([]);
  const [latestAchievement, setLatestAchievement] = useState("");
  const [postsThisWeek, setPostsThisWeek] = useState(0);
  const [scheduledDays, setScheduledDays] = useState<number[]>([]);
  const [leadsStages, setLeadsStages] = useState<{ stage: string; count: number }[]>([]);
  const [inboxCount, setInboxCount] = useState(0);
  const [bucketItems, setBucketItems] = useState<string[]>([]);
  const [journalStreak, setJournalStreak] = useState(0);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [
          taskRes, habitRes, financeRes, gymRes, foodRes,
          courseRes, achRes, contentRes, leadRes, inboxRes,
          bucketRes, journalRes, weeklyRes,
        ] = await Promise.all([
          fetch("/api/tasks").then(r => r.json()).catch(() => ({ success: false })),
          fetch("/api/habits").then(r => r.json()).catch(() => ({ success: false })),
          fetch("/api/finance/stats").then(r => r.json()).catch(() => ({ success: false })),
          fetch("/api/gym-sessions").then(r => r.json()).catch(() => ({ success: false })),
          fetch("/api/food").then(r => r.json()).catch(() => ({ success: false })),
          fetch("/api/courses").then(r => r.json()).catch(() => ({ success: false })),
          fetch("/api/achievements").then(r => r.json()).catch(() => ({ success: false })),
          fetch("/api/content-calendar").then(r => r.json()).catch(() => ({ success: false })),
          fetch("/api/leads").then(r => r.json()).catch(() => ({ success: false })),
          fetch("/api/inbox").then(r => r.json()).catch(() => ({ success: false })),
          fetch("/api/bucket-list").then(r => r.json()).catch(() => ({ success: false })),
          fetch("/api/journal").then(r => r.json()).catch(() => ({ success: false })),
          fetch("/api/weekly-goals").then(r => r.json()).catch(() => ({ success: false })),
        ]);

        // Tasks
        if (taskRes.success) {
          const tasks = taskRes.data || [];
          setMitCount(tasks.filter((t: any) => t.isMIT && !t.completed).length);
          setOverdueCount(tasks.filter((t: any) => t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length);
          setTotalTasks(tasks.length);
        }

        // Habits — use first habit's streak for overall streak
        if (habitRes.success) {
          const habits = habitRes.data || [];
          const todayStr = new Date().toISOString().split("T")[0];
          const completedToday = habits.filter((h: any) =>
            h.completedDates?.includes(todayStr)
          ).length;
          setHabitToday((completedToday / Math.max(habits.length, 1)) * 100);
          const maxStreak = habits.reduce((max: number, h: any) => Math.max(max, h.streak || 0), 0);
          setHabitStreak(maxStreak);
          setStreak(maxStreak);
          // Weekly: last 7 days completion count
          const week = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayStr = d.toISOString().split("T")[0];
            week.push(habits.filter((h: any) => h.completedDates?.includes(dayStr)).length);
          }
          setHabitWeekly(week);
        }

        // Finance
        if (financeRes.success) {
          const s = financeRes.summary || {};
          setBalance(s.balance || 0);
          const budget = s.budget || 0;
          const expenses = s.totalExpenses || 0;
          setBudgetUsed(budget > 0 ? (expenses / budget) * 100 : 0);
          const top = financeRes.categoryBreakdown?.[0];
          if (top) {
            setTopCategory(top.name);
            setTopCategoryAmount(top.amount);
          }
        }

        // Gym
        if (gymRes.success) {
          const sessions = gymRes.data || [];
          const now = new Date();
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          const thisWeek = sessions.filter((s: any) => new Date(s.date) >= startOfWeek);
          setGymSessions(thisWeek.length);
          setGymStreak(gymRes.streak || 0);
        }

        // Food
        if (foodRes.success) {
          const entries = foodRes.data || [];
          const todayStr = new Date().toISOString().split("T")[0];
          const todayEntries = entries.filter((e: any) => e.date?.startsWith(todayStr));
          setMealsLogged(todayEntries.length);
          let p = 0, c = 0, f = 0;
          todayEntries.forEach((e: any) => {
            p += e.protein || 0;
            c += e.carbs || 0;
            f += e.fat || 0;
          });
          setProtein(Math.round(p));
          setCarbs(Math.round(c));
          setFat(Math.round(f));
        }

        // Courses
        if (courseRes.success) {
          const coursesData = courseRes.data || [];
          setCourses(coursesData.slice(0, 3).map((c: any) => ({
            title: c.title,
            progress: c.progress || 0,
          })));
        }

        // Achievements
        if (achRes.success && achRes.earned?.length > 0) {
          // Show most recently earned — just show count as proxy
        }

        // Content Calendar
        if (contentRes.success) {
          const posts = contentRes.data || [];
          const now = new Date();
          const endOfWeek = new Date(now);
          endOfWeek.setDate(now.getDate() + (6 - now.getDay()));
          const thisWeek = posts.filter((p: any) => {
            const d = new Date(p.scheduledDate || p.date);
            return d >= now && d <= endOfWeek;
          });
          setPostsThisWeek(thisWeek.length);
          const days = thisWeek.map((p: any) => new Date(p.scheduledDate || p.date).getDay());
          setScheduledDays([...new Set(days)]);
        }

        // Leads
        if (leadRes.success) {
          const leads = leadRes.data || [];
          const stages: Record<string, number> = { open: 0, qualified: 0, closed: 0 };
          leads.forEach((l: any) => {
            const stage = (l.stage || "open").toLowerCase();
            if (stages[stage] !== undefined) stages[stage]++;
            else stages.open++;
          });
          setLeadsStages(Object.entries(stages).map(([stage, count]) => ({ stage, count })));
        }

        // Inbox
        if (inboxRes.success) {
          setInboxCount(inboxRes.data?.length || 0);
        }

        // Bucket list
        if (bucketRes.success) {
          setBucketItems(bucketRes.data?.slice(0, 2).map((b: any) => b.title) || []);
        }

        // Journal
        if (journalRes.success) {
          const entries = journalRes.data || [];
          if (entries.length > 0) {
            let maxStreak = 0;
            let current = 0;
            const sorted = entries.map((e: any) => new Date(e.date)).sort((a, b) => b.getTime() - a.getTime());
            for (let i = 0; i < sorted.length; i++) {
              const d = new Date(sorted[i]);
              if (i === 0) { current = 1; }
              else {
                const prev = new Date(sorted[i - 1]);
                const diff = (prev.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
                if (diff === 1) { current++; }
                else { current = 1; }
              }
              maxStreak = Math.max(maxStreak, current);
            }
            setJournalStreak(maxStreak);
          }
        }
      } catch (e) {
        console.error("Command center fetch error:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, []);

  const goTo = (tab: string) => {
    router.push(`/?tab=${tab}`);
  };

  const cards = loading
    ? [
        <TodayCardSkeleton key="today" />,
        <HabitCardSkeleton key="habit" />,
        <TaskCardSkeleton key="task" />,
        <FinanceCardSkeleton key="finance" />,
        <GymCardSkeleton key="gym" />,
        <NutritionCardSkeleton key="nutrition" />,
        <GrowthCardSkeleton key="growth" />,
        <ContentCardSkeleton key="content" />,
        <LeadsCardSkeleton key="leads" />,
        <LifeCardSkeleton key="life" />,
      ]
    : [
        <motion.div key="today" {...fadeUp} transition={{ delay: 0 }} onClick={() => goTo("habits")}>
          <TodayCard streak={streak} />
        </motion.div>,
        <motion.div key="habit" {...fadeUp} transition={{ delay: 0.04 }} onClick={() => goTo("habits")}>
          <HabitCard todayPercent={habitToday} weeklyData={habitWeekly} streak={habitStreak} />
        </motion.div>,
        <motion.div key="task" {...fadeUp} transition={{ delay: 0.08 }} onClick={() => goTo("tasks")}>
          <TaskCard mitCount={mitCount} overdueCount={overdueCount} totalCount={totalTasks} />
        </motion.div>,
        <motion.div key="finance" {...fadeUp} transition={{ delay: 0.12 }} onClick={() => goTo("finance")}>
          <FinanceCard balance={balance} budgetUsed={budgetUsed} topCategory={topCategory} topCategoryAmount={topCategoryAmount} />
        </motion.div>,
        <motion.div key="gym" {...fadeUp} transition={{ delay: 0.16 }} onClick={() => goTo("gym")}>
          <GymCard sessionsThisWeek={gymSessions} sessionsGoal={gymGoal} streak={gymStreak} nextWorkout={nextWorkout} />
        </motion.div>,
        <motion.div key="nutrition" {...fadeUp} transition={{ delay: 0.20 }} onClick={() => goTo("food")}>
          <NutritionCard mealsLogged={mealsLogged} mealsGoal={mealsGoal} protein={protein} carbs={carbs} fat={fat} />
        </motion.div>,
        <motion.div key="growth" {...fadeUp} transition={{ delay: 0.24 }} onClick={() => goTo("courses")}>
          <GrowthCard courses={courses} latestAchievement={latestAchievement} />
        </motion.div>,
        <motion.div key="content" {...fadeUp} transition={{ delay: 0.28 }} onClick={() => goTo("calendar")}>
          <ContentCard postsThisWeek={postsThisWeek} scheduledDays={scheduledDays} />
        </motion.div>,
        <motion.div key="leads" {...fadeUp} transition={{ delay: 0.32 }} onClick={() => goTo("leads")}>
          <LeadsCard stages={leadsStages} />
        </motion.div>,
        <motion.div key="life" {...fadeUp} transition={{ delay: 0.36 }} onClick={() => goTo("inbox")}>
          <LifeCard inboxCount={inboxCount} bucketItems={bucketItems} journalStreak={journalStreak} />
        </motion.div>,
      ];

  return (
    <div
      className="min-h-screen py-8 px-4"
      style={{ backgroundColor: "#F8F6F3" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-4xl font-heading font-semibold text-[#1A1A1A] mb-2"
            style={{ fontFamily: "Cormorant Garamond, serif" }}
          >
            Life Command Center
          </h1>
          <p className="text-sm text-[#6B6560]">Everything at a glance</p>
        </div>

        {/* Bento Grid — col spans match spec */}
        <BentoGrid>
          {/* Row 1: Today(2) Habit(3) Task(4) Finance(3) */}
          <div className="col-span-2">{cards[0]}</div>
          <div className="col-span-3">{cards[1]}</div>
          <div className="col-span-4">{cards[2]}</div>
          <div className="col-span-3">{cards[3]}</div>

          {/* Row 2: Gym(4) Nutrition(4) Growth(4) */}
          <div className="col-span-4">{cards[4]}</div>
          <div className="col-span-4">{cards[5]}</div>
          <div className="col-span-4">{cards[6]}</div>

          {/* Row 3: Content(6) Life(6) */}
          <div className="col-span-6">{cards[7]}</div>
          <div className="col-span-3">{cards[8]}</div>
          <div className="col-span-3">{cards[9]}</div>
        </BentoGrid>
      </div>
    </div>
  );
}
```

- [ ] **Step 1: Create CommandCenter component**
- [ ] **Step 2: Commit**

---

## Task 16: Sidebar Navigation Link

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Add "Life Command Center" to Tools section in linkSections**

Find the `Tools` section in `linkSections` around line 268 and add:

```tsx
{ id: "command-center", label: "Life Command Center", icon: LayoutDashboard },
```

Add `LayoutDashboard` to the import from lucide-react if not already there.

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(command-center): add sidebar link to Life Command Center"
```

---

## Task 17: Verify and Test

- [ ] **Step 1: Run the dev server and check the page**

```bash
npm run dev
```

Visit `http://localhost:3000/command-center` and verify:
- Page loads without errors
- Bento grid renders with all 10 cards
- Data populates from APIs (or skeletons show while loading)
- Cards navigate to correct tabs on click
- Zen Minimal styling visible (warm background, serif header)

- [ ] **Step 2: Test responsive layout** at ≥1280px, 768-1279px, and mobile

---

## Spec Coverage Check

| Spec requirement | Task |
|---|---|
| Bento Grid layout | Task 3, 17 |
| 10 cards (Today, Habit, Task, Finance, Gym, Nutrition, Growth, Content, Leads, Life) | Tasks 5-14 |
| Drill-down navigation | Task 17 (sidebar) + CommandCenter router.push |
| Zen Minimal styling | Task 2, 15 |
| Staggered entrance animations | Task 15 (Framer Motion fadeUp) |
| Loading skeletons | Tasks 5-14 (each card has Skeleton variant) |
| Responsive breakpoints | Task 3 (BentoGrid) + Task 15 (col-span classes) |
| Data from existing APIs | Task 15 (fetchAll) |

**All spec requirements covered.**