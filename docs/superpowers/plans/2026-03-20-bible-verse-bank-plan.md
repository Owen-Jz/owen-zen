# Bible Verse Bank Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A compact Bible verse widget card on the Focus Dashboard showing one scripture per day, cycling deterministically through ~200 verses. Visible every morning without interaction.

**Architecture:** Two-part implementation:
1. `DailyWordWidget` — standalone card component, self-contained with its own verse selection logic
2. RightSidebar integration — widget placed above PomodoroWidget so it's always visible on the dashboard
3. SectionsGrid integration — "Daily Word" added as a section so it's discoverable via `Alt+S`

**Tech Stack:** Next.js, TypeScript, Tailwind CSS, Framer Motion, lucide-react

---

## File Map

| Action | File |
|--------|------|
| Create | `src/data/verses.ts` — ~200-verse flat array |
| Create | `src/components/DailyWordWidget.tsx` — the widget component |
| Modify | `src/app/page.tsx` — import and render widget in RightSidebar |
| Modify | `src/app/page.tsx` — add "Daily Word" to SectionsGrid section list |

---

## Task 1: Create verse data file

**Files:**
- Create: `src/data/verses.ts`

- [ ] **Step 1: Write the verses data file**

```typescript
export interface Verse {
  text: string;
  ref: string;
}

export const VERSES: Verse[] = [
  // ~200 well-known motivational scriptures
  // Topics: faith, discipline, perseverance, purpose, courage, hope, trust, diligence, wisdom, strength
  { text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.", ref: "Jeremiah 29:11" },
  { text: "Commit your work to the Lord, and your plans will be established.", ref: "Proverbs 16:3" },
  { text: "I can do all things through him who strengthens me.", ref: "Philippians 4:13" },
  // ... (total ~200 verses)
];
```

- [ ] **Step 2: Verify file exports correctly**

Run: `npx tsc --noEmit src/data/verses.ts` (or check with ESLint)
Expected: No errors

---

## Task 2: Create DailyWordWidget component

**Files:**
- Create: `src/components/DailyWordWidget.tsx`
- Reference: `src/components/VisionBoardView.tsx` (existing verse styling to mirror)

- [ ] **Step 1: Write DailyWordWidget component**

```tsx
"use client";

import { useState, useEffect } from "react";
import { BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { VERSES } from "@/data/verses";

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export const DailyWordWidget = () => {
  const [verse, setVerse] = useState(VERSES[0]);

  useEffect(() => {
    const dayOfYear = getDayOfYear();
    setVerse(VERSES[dayOfYear % VERSES.length]);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border border-border rounded-2xl p-6 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="flex items-center gap-3 mb-4 text-primary">
        <BookOpen size={18} />
        <span className="text-xs font-bold uppercase tracking-[0.2em]">Daily Word</span>
      </div>

      <blockquote className="text-lg font-serif leading-tight mb-4 italic text-gray-200">
        "{verse.text}"
      </blockquote>

      <div className="flex items-center gap-2 text-gray-500 font-medium text-sm">
        <div className="w-6 h-[1px] bg-primary" />
        {verse.ref}
      </div>
    </motion.div>
  );
};
```

- [ ] **Step 2: Verify component compiles**

Run: `npx tsc --noEmit src/components/DailyWordWidget.tsx`
Expected: No errors

---

## Task 3: Add DailyWordWidget to RightSidebar

**Files:**
- Modify: `src/app/page.tsx:38` — add import for DailyWordWidget
- Modify: `src/app/page.tsx:1079` — render DailyWordWidget above PomodoroWidget

- [ ] **Step 1: Add import**

In the import section (around line 38), add:
```tsx
import { DailyWordWidget } from "@/components/DailyWordWidget";
```

- [ ] **Step 2: Add widget to RightSidebar above PomodoroWidget**

In `RightSidebar`, above the `PomodoroWidget` div (around line 1078-1079), add:
```tsx
{/* Daily Word */}
<DailyWordWidget />

{/* Pomodoro Timer */}
<div className="mt-auto pt-6 border-t border-white/5">
  <PomodoroWidget />
</div>
```

Note: The `mt-auto` on PomodoroWidget's container ensures it stays pinned to the bottom. Moving it requires wrapping both widgets in a flex column with `mt-auto` on the container instead:

```tsx
<div className="mt-auto flex flex-col gap-4">
  {/* Daily Word - no mt-auto, natural spacing */}
  <DailyWordWidget />

  {/* Pomodoro Timer */}
  <div className="pt-6 border-t border-white/5">
    <PomodoroWidget />
  </div>
</div>
```

- [ ] **Step 3: Verify it renders without errors**

Run: `npm run dev` and check browser console for errors when viewing the dashboard.
Expected: Daily Word card visible in right sidebar above Pomodoro

---

## Task 4: Add "Daily Word" to SectionsGrid

**Files:**
- Modify: `src/app/page.tsx:5` — add BookOpen to lucide-react imports
- Modify: `src/app/page.tsx:33-84` — add "Daily Word" entry to Core section

- [ ] **Step 1: Add BookOpen to imports**

In the lucide-react import (around line 5-11), add `BookOpen`:
```tsx
import {
  LayoutDashboard, LayoutTemplate, TrendingUp, Trophy, BarChart2, Shield,
  Dumbbell, UtensilsCrossed, Utensils,
  Target, Palette, Eye, Star, Calendar, Inbox,
  Crosshair, Wallet, Users, MessageSquare,
  Circle, FileText, Archive, Settings,
  BookOpen,   // <-- ADD THIS
} from "lucide-react";
```

- [ ] **Step 2: Add Daily Word to Core section in sections array**

In the `sections` array (around line 33-43), add to the Core section:
```tsx
{
  title: "Core",
  links: [
    { id: "tasks", label: "Focus Board", icon: LayoutDashboard },
    { id: "projects", label: "Project HQ", icon: LayoutTemplate },
    { id: "stats", label: "Stats", icon: TrendingUp },
    { id: "habits", label: "Habits", icon: Trophy },
    { id: "habit-analytics", label: "Habit Analytics", icon: BarChart2 },
    { id: "discipline", label: "Discipline Challenge", icon: Shield },
    { id: "daily-word", label: "Daily Word", icon: BookOpen },  // <-- ADD THIS
  ]
},
```

- [ ] **Step 3: Add rendering for daily-word tab (standalone view)**

In the tab rendering area (around line 2457-2659), add after discipline:
```tsx
{activeTab === "discipline" && <DisciplineChallenge />}
{activeTab === "daily-word" && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    className="max-w-2xl mx-auto"
  >
    <DailyWordWidget />
  </motion.div>
)}
```

- [ ] **Step 4: Verify SectionsGrid shows Daily Word**

Run: `npm run dev`, press `Alt+S`, navigate to Core section, confirm "Daily Word" appears with BookOpen icon.

---

## Verification Checklist

- [ ] Verse text displays in serif italic font
- [ ] Reference shows below verse with accent line
- [ ] Card has proper surface/border styling matching dashboard theme
- [ ] Motion animation plays on mount
- [ ] `Alt+S` opens SectionsGrid with "Daily Word" in Core section
- [ ] Daily Word card appears in RightSidebar above PomodoroWidget
- [ ] Verse changes to a new one each calendar day (deterministic — same verse all day)
- [ ] No console errors
- [ ] Builds successfully: `npm run build`
