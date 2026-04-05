# Daily Journal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Daily journal with mood tracking, consistency heatmap, search, and tag filtering — accessible as a new tab in the dashboard.

**Architecture:** Single Mongoose model (`Journal`) with date-keyed entries. Two API routes (one for GET/POST, one for DELETE by id). Three React components: `JournalView` (main container), `JournalHeatmap` (GitHub-style grid), `JournalEntryModal` (view/edit modal).

**Tech Stack:** Next.js 16 App Router, Mongoose, React Query, Recharts (for heatmap), Framer Motion, Lucide icons.

---

## File Map

| File | Responsibility |
|------|----------------|
| `src/models/Journal.ts` | Mongoose schema for journal entries |
| `src/app/api/journal/route.ts` | GET (all + filtered) + POST (upsert) |
| `src/app/api/journal/[id]/route.ts` | DELETE by `_id` |
| `src/components/journal/JournalHeatmap.tsx` | 52×7 heatmap grid, clickable cells |
| `src/components/journal/JournalEntryModal.tsx` | View/edit modal with mood dots + tags |
| `src/components/JournalView.tsx` | Main view: state, layout, React Query fetching |
| `src/app/page.tsx` | Add JournalView lazy import + navigation tab |

---

## Task 1: Mongoose Model

**Files:**
- Create: `src/models/Journal.ts`

- [ ] **Step 1: Create the Journal model**

```ts
// src/models/Journal.ts
import mongoose from 'mongoose';

const JournalSchema = new mongoose.Schema({
  date: {
    type: String,
    required: [true, 'Date is required'],
    unique: true, // one entry per day
  },
  text: {
    type: String,
    default: '',
  },
  mood: {
    type: Number,
    default: 3,
    min: 1,
    max: 5,
  },
  tags: {
    type: [String],
    default: [],
  },
}, {
  timestamps: true, // adds createdAt and updatedAt
});

export default mongoose.models.Journal || mongoose.model('Journal', JournalSchema);
```

- [ ] **Step 2: Commit**

```bash
git add src/models/Journal.ts
git commit -m "feat(journal): add Journal mongoose model"
```

---

## Task 2: API Routes

**Files:**
- Create: `src/app/api/journal/route.ts`
- Create: `src/app/api/journal/[id]/route.ts`

- [ ] **Step 1: Create GET and POST route**

```ts
// src/app/api/journal/route.ts
import dbConnect from "@/lib/db";
import Journal from "@/models/Journal";
import { NextResponse } from "next/server";

function calculateStreaks(entries: { date: string }[]): { current: number; longest: number } {
  if (!entries || entries.length === 0) return { current: 0, longest: 0 };

  const dates = entries.map(e => e.date).sort(); // ascending
  let longest = 1;
  let current = 0;

  // Build set for O(1) lookup
  const dateSet = new Set(dates);

  // Check if streak is alive (ends at today or yesterday)
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Count current streak backwards from today
  if (dateSet.has(today) || dateSet.has(yesterday)) {
    let checkDate = dateSet.has(today) ? today : yesterday;
    current = 1;
    let prev = new Date(checkDate);
    while (true) {
      prev = new Date(prev.getTime() - 86400000);
      const prevStr = prev.toISOString().split('T')[0];
      if (dateSet.has(prevStr)) {
        current++;
        checkDate = prevStr;
      } else {
        break;
      }
    }
  }

  // Find longest streak
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diff === 1) {
      let streak = 2;
      for (let j = i - 1; j > 0; j--) {
        const d1 = new Date(dates[j]);
        const d2 = new Date(dates[j - 1]);
        if (Math.round((d1.getTime() - d2.getTime()) / 86400000) === 1) {
          streak++;
        } else {
          break;
        }
      }
      longest = Math.max(longest, streak);
    }
  }

  return { current, longest };
}

export async function GET(req: Request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    const search = searchParams.get('search')?.toLowerCase();
    const tag = searchParams.get('tag');

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const query: any = { date: { $gte: startDate, $lte: endDate } };

    if (tag) {
      query.tags = tag;
    }

    const entries = await Journal.find(query).sort({ date: 1 }).lean();

    let filtered = entries;
    if (search) {
      filtered = entries.filter(e =>
        e.text.toLowerCase().includes(search) ||
        e.tags.some((t: string) => t.toLowerCase().includes(search))
      );
    }

    const allEntriesForYear = await Journal.find({ date: { $gte: startDate, $lte: endDate } }).lean();
    const streaks = calculateStreaks(allEntriesForYear.map(e => ({ date: e.date })));

    return NextResponse.json({
      success: true,
      data: filtered,
      stats: {
        currentStreak: streaks.current,
        longestStreak: streaks.longest,
        totalEntries: allEntriesForYear.length,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 400 });
  }
}

export async function POST(req: Request) {
  await dbConnect();
  try {
    const body = await req.json();
    const { date, text, mood, tags } = body;

    if (!date) {
      return NextResponse.json({ success: false, error: 'date is required' }, { status: 400 });
    }

    const entry = await Journal.findOneAndUpdate(
      { date },
      { $set: { text, mood, tags, updatedAt: new Date() } },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json({ success: true, data: entry });
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 400 });
  }
}
```

- [ ] **Step 2: Create DELETE route**

```ts
// src/app/api/journal/[id]/route.ts
import dbConnect from "@/lib/db";
import Journal from "@/models/Journal";
import { NextResponse } from "next/server";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;
  try {
    const deleted = await Journal.deleteOne({ _id: id });
    if (!deleted.deletedCount) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 400 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/journal/route.ts src/app/api/journal/[id]/route.ts
git commit -m "feat(journal): add API routes for journal entries"
```

---

## Task 3: JournalHeatmap Component

**Files:**
- Create: `src/components/journal/JournalHeatmap.tsx`

- [ ] **Step 1: Create the heatmap component**

```tsx
// src/components/journal/JournalHeatmap.tsx
"use client";

import { useMemo } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface Entry {
  date: string;
  mood: number;
  text: string;
  tags: string[];
}

interface JournalHeatmapProps {
  year: number;
  entries: Record<string, Entry>;
  onDateClick: (date: string) => void;
}

const MOOD_COLORS: Record<number, string> = {
  1: '#c0392b',
  2: '#e74c3c',
  3: '#f39c12',
  4: '#2ecc71',
  5: '#27ae60',
};

const NO_ENTRY_COLOR = '#161b22';

function getCellColor(mood: number | undefined): string {
  if (!mood) return NO_ENTRY_COLOR;
  return MOOD_COLORS[mood] || NO_ENTRY_COLOR;
}

export function JournalHeatmap({ year, entries, onDateClick }: JournalHeatmapProps) {
  const weeks = useMemo(() => {
    const result: { date: string; dayOfWeek: number }[][] = [];
    const startDate = new Date(year, 0, 1);
    // Adjust to Sunday of that week
    const startSunday = new Date(startDate);
    startSunday.setDate(startSunday.getDate() - startDate.getDay());

    let current = new Date(startSunday);
    let week: { date: string; dayOfWeek: number }[] = [];

    while (current.getFullYear() <= year || current.getMonth() === 0) {
      const dateStr = current.toISOString().split('T')[0];
      const currentYear = current.getFullYear();

      if (currentYear > year) break;

      if (currentYear === year) {
        week.push({ date: dateStr, dayOfWeek: current.getDay() });
      } else {
        // Pad with empty cells for days before Jan 1
        week.push({ date: dateStr, dayOfWeek: current.getDay() });
      }

      if (week.length === 7) {
        result.push(week);
        week = [];
      }

      current = new Date(current.getTime() + 86400000);
    }

    if (week.length > 0) result.push(week);
    return result;
  }, [year]);

  const months = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const result: { name: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    weeks.forEach((week, wi) => {
      const firstDay = week.find(d => d.date.startsWith(year.toString()));
      if (firstDay) {
        const month = new Date(firstDay.date + 'T12:00:00').getMonth();
        if (month !== lastMonth) {
          result.push({ name: monthNames[month], weekIndex: wi });
          lastMonth = month;
        }
      }
    });

    return result;
  }, [weeks, year]);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Month labels */}
        <div className="flex mb-1 ml-8">
          {months.map((m, i) => (
            <div
              key={i}
              className="text-xs text-gray-500"
              style={{ marginLeft: i === 0 ? 0 : `${(m.weekIndex - (months[i - 1]?.weekIndex ?? 0) - 1) * 14}px` }}
            >
              {m.name}
            </div>
          ))}
        </div>

        <div className="flex">
          {/* Day labels */}
          <div className="flex flex-col mr-1">
            {days.map((d, i) => (
              <div
                key={d}
                className={cn(
                  "text-xs text-gray-500 h-[14px] flex items-center",
                  i % 2 === 1 && "invisible"
                )}
                style={{ fontSize: '10px', height: '14px' }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-[2px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[2px]">
                {week.map((day) => {
                  const entry = entries[day.date];
                  const isCurrentYear = day.date.startsWith(year.toString());
                  return (
                    <div
                      key={day.date}
                      onClick={() => isCurrentYear && onDateClick(day.date)}
                      className={cn(
                        "w-[13px] h-[13px] rounded-sm cursor-pointer transition-all hover:scale-110",
                        !isCurrentYear && "opacity-0 cursor-default"
                      )}
                      style={{ backgroundColor: isCurrentYear ? getCellColor(entry?.mood) : 'transparent' }}
                      title={isCurrentYear && entry ? `${day.date} — Mood ${entry.mood}` : isCurrentYear ? `${day.date} — No entry` : ''}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
          <span>Less</span>
          <div className="w-[13px] h-[13px] rounded-sm" style={{ backgroundColor: NO_ENTRY_COLOR }} />
          <div className="w-[13px] h-[13px] rounded-sm" style={{ backgroundColor: MOOD_COLORS[1] }} />
          <div className="w-[13px] h-[13px] rounded-sm" style={{ backgroundColor: MOOD_COLORS[2] }} />
          <div className="w-[13px] h-[13px] rounded-sm" style={{ backgroundColor: MOOD_COLORS[3] }} />
          <div className="w-[13px] h-[13px] rounded-sm" style={{ backgroundColor: MOOD_COLORS[4] }} />
          <div className="w-[13px] h-[13px] rounded-sm" style={{ backgroundColor: MOOD_COLORS[5] }} />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/journal/JournalHeatmap.tsx
git commit -m "feat(journal): add JournalHeatmap component"
```

---

## Task 4: JournalEntryModal Component

**Files:**
- Create: `src/components/journal/JournalEntryModal.tsx`

- [ ] **Step 1: Create the modal component**

```tsx
// src/components/journal/JournalEntryModal.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface Entry {
  _id?: string;
  date: string;
  text: string;
  mood: number;
  tags: string[];
  updatedAt?: string;
}

interface JournalEntryModalProps {
  date: string; // "2026-04-05"
  entry: Entry | null;
  onClose: () => void;
  onSave: (data: { text: string; mood: number; tags: string[] }) => void;
}

const MOOD_COLORS = ['#c0392b', '#e74c3c', '#f39c12', '#2ecc71', '#27ae60'];
const MOOD_LABELS = ['Terrible', 'Bad', 'Okay', 'Good', 'Great'];

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export function JournalEntryModal({ date, entry, onClose, onSave }: JournalEntryModalProps) {
  const [text, setText] = useState(entry?.text ?? '');
  const [mood, setMood] = useState(entry?.mood ?? 3);
  const [tags, setTags] = useState<string[]>(entry?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync when entry changes
  useEffect(() => {
    setText(entry?.text ?? '');
    setMood(entry?.mood ?? 3);
    setTags(entry?.tags ?? []);
    setLastSaved(entry?.updatedAt ? new Date(entry.updatedAt).toLocaleTimeString() : null);
  }, [entry]);

  const save = useCallback((data: { text: string; mood: number; tags: string[] }) => {
    setIsSaving(true);
    onSave(data);
    setLastSaved(new Date().toLocaleTimeString());
    setIsSaving(false);
  }, [onSave]);

  // Debounced auto-save on text change
  useEffect(() => {
    if (!entry && text === '' && mood === 3 && tags.length === 0) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      save({ text, mood, tags });
    }, 1000);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [text, mood, tags, save]);

  // Immediate save on mood change
  const handleMoodClick = (m: number) => {
    setMood(m);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    save({ text, mood: m, tags });
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      const newTags = [...tags, trimmed];
      setTags(newTags);
      setTagInput('');
      save({ text, mood, tags: newTags });
    }
  };

  const handleRemoveTag = (tag: string) => {
    const newTags = tags.filter(t => t !== tag);
    setTags(newTags);
    save({ text, mood, tags: newTags });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-white">{formatDisplayDate(date)}</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Mood selector */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm text-gray-400">Mood:</span>
              <div className="flex gap-2">
                {MOOD_COLORS.map((color, i) => (
                  <button
                    key={i}
                    onClick={() => handleMoodClick(i + 1)}
                    className={cn(
                      "w-7 h-7 rounded-full transition-all hover:scale-110",
                      mood === i + 1 && "ring-2 ring-white ring-offset-2 ring-offset-gray-900"
                    )}
                    style={{ backgroundColor: color }}
                    title={MOOD_LABELS[i]}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-300 ml-1">{MOOD_LABELS[mood - 1]}</span>
            </div>
          </div>

          {/* Tags */}
          <div className="mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full flex items-center gap-1"
                >
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="hover:text-white">
                    <X size={12} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleAddTag}
                placeholder="+ Add tag"
                className="bg-transparent text-xs text-gray-400 placeholder:text-gray-600 outline-none w-20"
              />
            </div>
          </div>

          {/* Text area */}
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Write your thoughts for today..."
            className="w-full h-48 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-gray-600 resize-none outline-none focus:border-primary/50 transition-colors"
          />

          {/* Footer */}
          <div className="flex justify-end items-center mt-3">
            {isSaving ? (
              <span className="text-xs text-gray-500">Saving...</span>
            ) : lastSaved ? (
              <span className="text-xs text-gray-500">Last saved: {lastSaved}</span>
            ) : (
              <span className="text-xs text-gray-500">Auto-saves as you type</span>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/journal/JournalEntryModal.tsx
git commit -m "feat(journal): add JournalEntryModal component"
```

---

## Task 5: JournalView Component

**Files:**
- Create: `src/components/JournalView.tsx`

- [ ] **Step 1: Create the main view component**

```tsx
// src/components/JournalView.tsx
"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Flame } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { JournalHeatmap } from "./journal/JournalHeatmap";
import { JournalEntryModal } from "./journal/JournalEntryModal";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface Entry {
  _id: string;
  date: string;
  text: string;
  mood: number;
  tags: string[];
  updatedAt: string;
}

interface JournalData {
  success: boolean;
  data: Entry[];
  stats: { currentStreak: number; longestStreak: number; totalEntries: number };
}

async function fetchJournal(year: number, search: string, tag: string): Promise<JournalData> {
  const params = new URLSearchParams({ year: year.toString() });
  if (search) params.set('search', search);
  if (tag) params.set('tag', tag);
  const res = await fetch(`/api/journal?${params}`);
  return res.json();
}

export default function JournalView() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['journal', year, searchQuery, activeTag],
    queryFn: () => fetchJournal(year, searchQuery, activeTag ?? ''),
  });

  const saveMutation = useMutation({
    mutationFn: async (body: { date: string; text: string; mood: number; tags: string[] }) => {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
    },
  });

  const entriesMap = useMemo(() => {
    const map: Record<string, Entry> = {};
    data?.data?.forEach((e: Entry) => { map[e.date] = e; });
    return map;
  }, [data?.data]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    data?.data?.forEach((e: Entry) => e.tags.forEach((t: string) => tags.add(t)));
    return Array.from(tags).sort();
  }, [data?.data]);

  const selectedEntry = selectedDate ? (entriesMap[selectedDate] ?? null) : null;

  const handleSave = (formData: { text: string; mood: number; tags: string[] }) => {
    if (!selectedDate) return;
    saveMutation.mutate({ date: selectedDate, ...formData });
  };

  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            📓 Journal
          </h1>
          {data?.stats && (
            <p className="text-sm text-gray-400 mt-1">
              {data.stats.totalEntries} entries · 🔥 {data.stats.currentStreak} day streak · Best: {data.stats.longestStreak} days
            </p>
          )}
        </div>
        <select
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          className="bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
        >
          {years.map(y => (
            <option key={y} value={y} className="bg-gray-900">{y}</option>
          ))}
        </select>
      </div>

      {/* Search and tags */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search entries..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        {allTags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveTag(null)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all",
                !activeTag ? "bg-primary text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
              )}
            >
              All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all",
                  activeTag === tag ? "bg-primary text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Heatmap */}
      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="text-gray-500 text-sm">Loading...</div>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <JournalHeatmap
            year={year}
            entries={entriesMap}
            onDateClick={setSelectedDate}
          />
        </div>
      )}

      {/* Modal */}
      {selectedDate && (
        <JournalEntryModal
          date={selectedDate}
          entry={selectedEntry}
          onClose={() => setSelectedDate(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/JournalView.tsx
git commit -m "feat(journal): add JournalView main component"
```

---

## Task 6: Integrate into page.tsx

**Files:**
- Modify: `src/app/page.tsx` — add lazy import and navigation tab

- [ ] **Step 1: Add lazy import**

Find where other lazy imports are defined (around line 48 in page.tsx) and add:

```ts
const JournalView = dynamic(() => import("@/components/JournalView").then(mod => ({ default: mod.default })), {
  loading: () => <Loading />
});
```

- [ ] **Step 2: Add tab to sidebar navigation**

Find the Core section of sidebar links (around line 214, after habit-analytics) and add:

```ts
{ id: "journal", label: "Journal", icon: BookOpen },
```

- [ ] **Step 3: Add view rendering**

Find where other views are rendered (around line 2682, after habit-analytics) and add:

```tsx
{activeTab === "journal" && <JournalView />}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(journal): integrate JournalView into dashboard navigation"
```

---

## Spec Coverage Checklist

- [x] Data model with date, text, mood, tags — Task 1
- [x] GET /api/journal with year filter + search + tag — Task 2
- [x] GET /api/journal?date= — via full list filter in Task 2
- [x] POST /api/journal upsert — Task 2
- [x] DELETE /api/journal/[id] — Task 2
- [x] Streak calculation — Task 2
- [x] JournalHeatmap (52×7, mood colors, click) — Task 3
- [x] JournalEntryModal (mood dots, tags, textarea, auto-save) — Task 4
- [x] JournalView (layout, search, tag filter, React Query) — Task 5
- [x] Integration in dashboard — Task 6
