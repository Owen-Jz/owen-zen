# Journal Morning & Evening Slots — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the journal to support two writing slots per day — morning (intentions/plans) and evening (reflection/wins) — with distinct prompts, moods, and tags per slot.

**Architecture:** Add a `slot: "morning" | "evening"` field to the Journal model with a compound unique index on `{ date, slot }`. Backward-compatible: existing entries treated as evening. Heatmap shows evening mood or morning mood if no evening entry. API routes updated to handle slot filtering.

**Tech Stack:** Next.js App Router, MongoDB/Mongoose, React Query, Framer Motion

---

## File Map

| File | Responsibility |
|------|----------------|
| `src/models/Journal.ts` | Schema — add `slot` field + compound unique index |
| `src/app/api/journal/route.ts` | GET/POST — filter by slot, fix streak counting |
| `src/app/api/journal/[id]/route.ts` | DELETE — no changes needed |
| `src/components/journal/JournalEntryModal.tsx` | Two-section modal (morning + evening) |
| `src/components/journal/JournalHeatmap.tsx` | Evening-mood-first coloring logic |
| `src/components/JournalView.tsx` | Entries map with slot, slot badges on cards |
| `src/__tests__/api/journal.test.ts` | New test file for journal API |

---

## Task 1: Update Journal Model

**Files:**
- Modify: `src/models/Journal.ts:1-28`

- [ ] **Step 1: Update the Journal schema**

Replace the entire `Journal.ts` content:

```typescript
// src/models/Journal.ts
import mongoose from 'mongoose';

const JournalSchema = new mongoose.Schema({
  date: {
    type: String,
    required: [true, 'Date is required'],
  },
  slot: {
    type: String,
    enum: ['morning', 'evening'],
    default: 'evening',
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
  timestamps: true,
});

// Compound unique index: one entry per date+slot combination
JournalSchema.index({ date: 1, slot: 1 }, { unique: true });

export default mongoose.models.Journal || mongoose.model('Journal', JournalSchema);
```

- [ ] **Step 2: Commit**

```bash
git add src/models/Journal.ts && git commit -m "feat(journal): add slot field with compound unique index"
```

---

## Task 2: Update Journal API — GET

**Files:**
- Modify: `src/app/api/journal/route.ts`

- [ ] **Step 1: Update GET handler to support `slot` param and fix streak counting**

Replace the GET function in `route.ts` (lines 54–96) with this:

```typescript
export async function GET(req: Request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    const search = searchParams.get('search')?.toLowerCase();
    const tag = searchParams.get('tag');
    const slot = searchParams.get('slot'); // "morning" | "evening" | null

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const query: Record<string, any> = { date: { $gte: startDate, $lte: endDate } };
    if (slot === 'morning' || slot === 'evening') {
      query.slot = slot;
    }

    const entries = await Journal.find(query).sort({ date: 1 }).lean();

    let filtered = entries;
    if (search) {
      filtered = entries.filter(e =>
        (e.text ?? '').toLowerCase().includes(search) ||
        (e.tags ?? []).some((t: string) => t.toLowerCase().includes(search))
      );
    }

    // Get all entries for the year (all slots) to compute streak
    const allEntriesForYear = await Journal.find({ date: { $gte: startDate, $lte: endDate } }).lean();

    // Streak counts days that have at least one entry in any slot
    const uniqueDates = [...new Set(allEntriesForYear.map(e => e.date))];
    const streaks = calculateStreaks(uniqueDates.map(d => ({ date: d })));

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
```

Note: The `calculateStreaks` function receives `uniqueDates` (already deduplicated), so it works correctly when multiple slots exist per day.

- [ ] **Step 2: Commit**

```bash
git add src/app/api/journal/route.ts && git commit -m "feat(journal): support slot param in GET, fix streak to count days not entries"
```

---

## Task 3: Update Journal API — POST

**Files:**
- Modify: `src/app/api/journal/route.ts`

- [ ] **Step 1: Update POST handler to require and validate `slot`**

Replace the POST function in `route.ts` (lines 98–118) with this:

```typescript
export async function POST(req: Request) {
  await dbConnect();
  try {
    const body = await req.json();
    const { date, slot, text, mood, tags } = body;

    if (!date) {
      return NextResponse.json({ success: false, error: 'date is required' }, { status: 400 });
    }

    const resolvedSlot = slot === 'morning' || slot === 'evening' ? slot : 'evening';

    const entry = await Journal.findOneAndUpdate(
      { date, slot: resolvedSlot },
      { $set: { text, mood, tags, slot: resolvedSlot } },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json({ success: true, data: entry });
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 400 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/journal/route.ts && git commit -m "feat(journal): require and validate slot in POST"
```

---

## Task 4: Update JournalEntryModal — Two-Section Layout

**Files:**
- Modify: `src/components/journal/JournalEntryModal.tsx`

- [ ] **Step 1: Update JournalEntryModal with two sections**

Replace the entire file content:

```typescript
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

interface SlotEntry {
  _id?: string;
  date: string;
  slot: string;
  text: string;
  mood: number;
  tags: string[];
  updatedAt?: string;
}

interface JournalEntryModalProps {
  date: string;
  entries: { morning: SlotEntry | null; evening: SlotEntry | null };
  onClose: () => void;
  onSave: (slot: 'morning' | 'evening', data: { text: string; mood: number; tags: string[] }) => void;
}

const MOOD_COLORS = ['#c0392b', '#e74c3c', '#f39c12', '#2ecc71', '#27ae60'];
const MOOD_LABELS = ['Terrible', 'Bad', 'Okay', 'Good', 'Great'];

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

interface SlotSectionProps {
  slot: 'morning' | 'evening';
  entry: SlotEntry | null;
  onSave: (data: { text: string; mood: number; tags: string[] }) => void;
}

function SlotSection({ slot, entry, onSave }: SlotSectionProps) {
  const [text, setText] = useState(entry?.text ?? '');
  const [mood, setMood] = useState(entry?.mood ?? 3);
  const [tags, setTags] = useState<string[]>(entry?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const prompt = slot === 'morning'
    ? 'What will you do today? What are you grateful for?'
    : 'What went well? What did you learn?';

  const label = slot === 'morning' ? '🌅 Morning' : '🌙 Evening';
  const sublabel = slot === 'morning' ? "What's on your plate today?" : 'Reflect on your day';

  // Sync when entry changes
  useEffect(() => {
    setText(entry?.text ?? '');
    setMood(entry?.mood ?? 3);
    setTags(entry?.tags ?? []);
    setLastSaved(entry?.updatedAt ? new Date(entry.updatedAt).toLocaleTimeString() : null);
  }, [entry]);

  const save = useCallback((data: { text: string; mood: number; tags: string[] }) => {
    setIsSaving(true);
    Promise.resolve(onSave(data)).finally(() => {
      setIsSaving(false);
      setLastSaved(new Date().toLocaleTimeString());
    });
  }, [onSave]);

  // Debounced auto-save
  useEffect(() => {
    if (text === '' && mood === 3 && tags.length === 0) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save({ text, mood, tags }), 1000);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [text, mood, tags, save]);

  const handleMoodClick = (m: number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setMood(m);
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
    if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); }
  };

  return (
    <div className="mb-6 last:mb-0">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base font-bold text-white">{label}</span>
        <span className="text-xs text-gray-500 italic">{sublabel}</span>
      </div>

      {/* Mood selector */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs text-gray-400">Mood:</span>
        <div className="flex gap-2">
          {MOOD_COLORS.map((color, i) => (
            <button
              key={i}
              onClick={() => handleMoodClick(i + 1)}
              className={cn(
                "w-6 h-6 rounded-full transition-all hover:scale-110",
                mood === i + 1 && "ring-2 ring-white ring-offset-2 ring-offset-gray-900"
              )}
              style={{ backgroundColor: color }}
              title={MOOD_LABELS[i]}
            />
          ))}
        </div>
        <span className="text-xs text-gray-300 ml-1">{MOOD_LABELS[mood - 1] ?? 'Unknown'}</span>
      </div>

      {/* Tags */}
      <div className="flex items-center gap-2 flex-wrap mb-2">
        {tags.map(tag => (
          <span key={tag} className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full flex items-center gap-1">
            {tag}
            <button onClick={() => handleRemoveTag(tag)} className="hover:text-white">
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleAddTag}
          placeholder="+ tag"
          className="bg-transparent text-xs text-gray-400 placeholder:text-gray-600 outline-none w-16"
        />
      </div>

      {/* Text area */}
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={prompt}
        className="w-full h-28 bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-gray-600 resize-none outline-none focus:border-primary/50 transition-colors"
      />

      {/* Last saved */}
      <div className="flex justify-end mt-1">
        {isSaving ? (
          <span className="text-xs text-gray-500">Saving...</span>
        ) : lastSaved ? (
          <span className="text-xs text-gray-500">Saved {lastSaved}</span>
        ) : (
          <span className="text-xs text-gray-600">Auto-saves</span>
        )}
      </div>
    </div>
  );
}

export function JournalEntryModal({ date, entries, onClose, onSave }: JournalEntryModalProps) {
  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

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
          className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl"
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

          {/* Morning section */}
          <SlotSection
            slot="morning"
            entry={entries.morning}
            onSave={(data) => onSave('morning', data)}
          />

          {/* Divider */}
          <div className="border-t border-white/10 mb-4" />

          {/* Evening section */}
          <SlotSection
            slot="evening"
            entry={entries.evening}
            onSave={(data) => onSave('evening', data)}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/journal/JournalEntryModal.tsx && git commit -m "feat(journal): split modal into morning and evening sections"
```

---

## Task 5: Update JournalView — Entries Map with Slot, Modal Prop Changes

**Files:**
- Modify: `src/components/JournalView.tsx`

- [ ] **Step 1: Update JournalView to handle entries by slot**

Replace the entire `JournalView.tsx` content:

```typescript
// src/components/JournalView.tsx
"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, BookOpen, Plus, Calendar } from "lucide-react";
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
  slot: string;
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
    queryKey: ['journal', year, searchQuery, activeTag ?? ''],
    queryFn: () => fetchJournal(year, searchQuery, activeTag ?? ''),
  });

  const saveMutation = useMutation({
    mutationFn: async (body: { date: string; slot: 'morning' | 'evening'; text: string; mood: number; tags: string[] }) => {
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

  // Build a map: date -> { morning: Entry, evening: Entry }
  const entriesByDate = useMemo(() => {
    const map: Record<string, { morning: Entry | null; evening: Entry | null }> = {};
    data?.data?.forEach((e: Entry) => {
      if (!map[e.date]) {
        map[e.date] = { morning: null, evening: null };
      }
      if (e.slot === 'morning') map[e.date].morning = e;
      else map[e.date].evening = e;
    });
    return map;
  }, [data?.data]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    data?.data?.forEach((e: Entry) => e.tags.forEach((t: string) => tags.add(t)));
    return Array.from(tags).sort();
  }, [data?.data]);

  const selectedEntries = selectedDate ? (entriesByDate[selectedDate] ?? { morning: null, evening: null }) : { morning: null, evening: null };

  const handleSave = (slot: 'morning' | 'evening', formData: { text: string; mood: number; tags: string[] }) => {
    if (!selectedDate) return;
    saveMutation.mutate({ date: selectedDate, slot, ...formData });
  };

  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  const sortedDates = useMemo(() => {
    return [...new Set(data?.data?.map((e: Entry) => e.date) ?? [])].sort((a, b) => b.localeCompare(a));
  }, [data?.data]);

  const MOOD_COLORS: Record<number, string> = {
    1: '#c0392b', 2: '#e74c3c', 3: '#f39c12', 4: '#2ecc71', 5: '#27ae60',
  };
  const MOOD_LABELS = ['', 'Terrible', 'Bad', 'Okay', 'Good', 'Great'];

  function formatCardDate(dateStr: string) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

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
              {data.stats.totalEntries} entries · {data.stats.currentStreak} day streak · Best: {data.stats.longestStreak} days
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setYear(new Date().getFullYear());
              setSelectedDate(new Date().toISOString().split('T')[0]);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 rounded-lg text-sm font-bold text-white transition-colors"
          >
            <Plus size={16} />
            Today's Entry
          </button>
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
            entries={entriesByDate}
            onDateClick={setSelectedDate}
          />
        </div>
      )}

      {/* Entry List — grouped by date */}
      {sortedDates.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-gray-500" />
            <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Entries</h2>
            <span className="text-xs text-gray-600">({sortedDates.length} days)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sortedDates.map(date => {
              const entry = entriesByDate[date];
              const morning = entry?.morning;
              const evening = entry?.evening;
              const hasMorning = !!morning;
              const hasEvening = !!evening;

              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className="text-left bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:border-white/20 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-sm font-bold text-white">{formatCardDate(date)}</span>
                    <div className="flex items-center gap-1.5">
                      {hasMorning && (
                        <span className="text-xs bg-primary/15 text-primary px-1.5 py-0.5 rounded">🌅</span>
                      )}
                      {hasEvening && (
                        <span className="text-xs bg-primary/15 text-primary px-1.5 py-0.5 rounded">🌙</span>
                      )}
                    </div>
                  </div>

                  {/* Mood dots */}
                  <div className="flex items-center gap-1.5 mb-2">
                    {morning && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: MOOD_COLORS[morning.mood] }}
                        title={`Morning: ${MOOD_LABELS[morning.mood]}`}
                      />
                    )}
                    {evening && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: MOOD_COLORS[evening.mood] }}
                        title={`Evening: ${MOOD_LABELS[evening.mood]}`}
                      />
                    )}
                  </div>

                  {/* Tags */}
                  {((morning?.tags?.length ?? 0) + (evening?.tags?.length ?? 0)) > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {[...(morning?.tags ?? []), ...(evening?.tags ?? [])].slice(0, 4).map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 bg-primary/15 text-primary text-xs rounded">
                          {tag}
                        </span>
                      ))}
                      {((morning?.tags?.length ?? 0) + (evening?.tags?.length ?? 0)) > 4 && (
                        <span className="text-xs text-gray-500">
                          +{[...(morning?.tags ?? []), ...(evening?.tags ?? [])].length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Text preview */}
                  {evening?.text ? (
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{evening.text}</p>
                  ) : morning?.text ? (
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{morning.text}</p>
                  ) : (
                    <p className="text-xs text-gray-600 italic">No entry text</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {data?.data && data.data.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">No entries yet. Click "Today's Entry" to start journaling!</p>
        </div>
      )}

      {/* Modal */}
      {selectedDate && (
        <JournalEntryModal
          date={selectedDate}
          entries={selectedEntries}
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
git add src/components/JournalView.tsx && git commit -m "feat(journal): update JournalView for morning/evening slot handling"
```

---

## Task 6: Update JournalHeatmap — Evening-Mood-First Coloring

**Files:**
- Modify: `src/components/journal/JournalHeatmap.tsx`

- [ ] **Step 1: Update JournalHeatmap Entry interface and color logic**

The heatmap receives `entries` as `Record<string, { morning: Entry | null; evening: Entry | null }>`.

Replace the `Entry` interface and `getCellColor` function in `JournalHeatmap.tsx`:

```typescript
// In JournalHeatmap.tsx, replace the Entry interface:
interface Entry {
  date: string;
  slot: string;
  mood: number;
  text: string;
  tags: string[];
}

interface JournalHeatmapProps {
  year: number;
  entries: Record<string, { morning: Entry | null; evening: Entry | null }>;
  onDateClick: (date: string) => void;
}

// Also update getCellColor function:
function getCellColor(mood: number | undefined): string {
  if (!mood) return NO_ENTRY_COLOR;
  return MOOD_COLORS[mood] || NO_ENTRY_COLOR;
}
```

Then update the cell rendering inside the grid map:

```typescript
// In the grid cell, replace the entry lookup:
// OLD:
const entry = entries[day.date];
const isCurrentYear = day.date.startsWith(year.toString());
// ... backgroundColor: isCurrentYear ? getCellColor(entry?.mood) ...

// NEW:
const dayEntries = entries[day.date];
const isCurrentYear = day.date.startsWith(year.toString());
// Evening mood takes priority; fall back to morning
const mood = dayEntries?.evening?.mood ?? dayEntries?.morning?.mood;
// ... backgroundColor: isCurrentYear ? getCellColor(mood) ...
```

Also update the title tooltip:

```typescript
// Replace the title prop on the cell div:
// OLD:
title={isCurrentYear && entry ? `${day.date} — Mood ${entry.mood}` : isCurrentYear ? `${day.date} — No entry` : ''}

// NEW:
const hasEntry = dayEntries?.evening ?? dayEntries?.morning;
title={isCurrentYear && hasEntry ? `${day.date} — ${dayEntries.evening ? 'Evening' : 'Morning'} Mood ${hasEntry.mood}` : isCurrentYear ? `${day.date} — No entry` : ''}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/journal/JournalHeatmap.tsx && git commit -m "feat(journal): use evening-mood-first coloring in heatmap"
```

---

## Task 7: Write Journal API Tests

**Files:**
- Create: `src/__tests__/api/journal.test.ts`

- [ ] **Step 1: Write tests for journal API slot behavior**

```typescript
// src/__tests__/api/journal.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/journal/route';
import { DELETE } from '@/app/api/journal/[id]/route';

vi.mock('@/lib/db', () => ({
  __esModule: true,
  default: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/models/Journal', () => ({
  __esModule: true,
  default: {
    find: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    findOneAndUpdate: vi.fn(),
    deleteOne: vi.fn(),
  },
}));

describe('Journal API', () => {
  describe('GET /api/journal', () => {
    it('should return entries for the given year', async () => {
      const mockEntries = [
        { _id: '1', date: '2026-04-01', slot: 'morning', text: 'Morning entry', mood: 4, tags: [], updatedAt: '2026-04-01T12:00:00Z' },
        { _id: '2', date: '2026-04-01', slot: 'evening', text: 'Evening entry', mood: 3, tags: ['work'], updatedAt: '2026-04-01T12:00:00Z' },
      ];
      const Journal = (await import('@/models/Journal')).default;
      vi.mocked(Journal.find).mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockEntries),
      } as any);
      vi.mocked(Journal.find).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(mockEntries),
        }),
      } as any);

      const request = new Request('http://localhost/api/journal?year=2026');
      const response = await GET(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
    });

    it('should filter by slot=morning', async () => {
      const Journal = (await import('@/models/Journal')).default;
      vi.mocked(Journal.find).mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([
          { _id: '1', date: '2026-04-01', slot: 'morning', text: 'Morning', mood: 4, tags: [], updatedAt: '2026-04-01T12:00:00Z' },
        ]),
      } as any);

      const request = new Request('http://localhost/api/journal?year=2026&slot=morning');
      const response = await GET(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data[0].slot).toBe('morning');
    });

    it('should filter by slot=evening', async () => {
      const Journal = (await import('@/models/Journal')).default;
      vi.mocked(Journal.find).mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([
          { _id: '2', date: '2026-04-01', slot: 'evening', text: 'Evening', mood: 3, tags: [], updatedAt: '2026-04-01T12:00:00Z' },
        ]),
      } as any);

      const request = new Request('http://localhost/api/journal?year=2026&slot=evening');
      const response = await GET(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data[0].slot).toBe('evening');
    });
  });

  describe('POST /api/journal', () => {
    it('should create a morning entry', async () => {
      const mockEntry = { _id: '1', date: '2026-04-01', slot: 'morning', text: 'Test', mood: 4, tags: [] };
      const Journal = (await import('@/models/Journal')).default;
      vi.mocked(Journal.findOneAndUpdate).mockResolvedValue(mockEntry);

      const request = new Request('http://localhost/api/journal', {
        method: 'POST',
        body: JSON.stringify({ date: '2026-04-01', slot: 'morning', text: 'Test', mood: 4, tags: [] }),
      });
      const response = await POST(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.slot).toBe('morning');
    });

    it('should create an evening entry', async () => {
      const mockEntry = { _id: '2', date: '2026-04-01', slot: 'evening', text: 'Evening', mood: 3, tags: [] };
      const Journal = (await import('@/models/Journal')).default;
      vi.mocked(Journal.findOneAndUpdate).mockResolvedValue(mockEntry);

      const request = new Request('http://localhost/api/journal', {
        method: 'POST',
        body: JSON.stringify({ date: '2026-04-01', slot: 'evening', text: 'Evening', mood: 3, tags: [] }),
      });
      const response = await POST(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.slot).toBe('evening');
    });

    it('should default missing slot to evening', async () => {
      const mockEntry = { _id: '3', date: '2026-04-01', slot: 'evening', text: 'Test', mood: 3, tags: [] };
      const Journal = (await import('@/models/Journal')).default;
      vi.mocked(Journal.findOneAndUpdate).mockResolvedValue(mockEntry);

      const request = new Request('http://localhost/api/journal', {
        method: 'POST',
        body: JSON.stringify({ date: '2026-04-01', text: 'Test', mood: 3, tags: [] }),
      });
      const response = await POST(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data.slot).toBe('evening');
    });

    it('should return 400 if date is missing', async () => {
      const request = new Request('http://localhost/api/journal', {
        method: 'POST',
        body: JSON.stringify({ text: 'Test' }),
      });
      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/journal/[id]', () => {
    it('should delete an entry', async () => {
      const Journal = (await import('@/models/Journal')).default;
      vi.mocked(Journal.deleteOne).mockResolvedValue({ deletedCount: 1 });

      const request = new Request('http://localhost/api/journal/abc123', { method: 'DELETE' });
      const response = await DELETE(request, { params: Promise.resolve({ id: 'abc123' }) });
      expect(response.status).toBe(200);
    });

    it('should return 404 if entry not found', async () => {
      const Journal = (await import('@/models/Journal')).default;
      vi.mocked(Journal.deleteOne).mockResolvedValue({ deletedCount: 0 });

      const request = new Request('http://localhost/api/journal/notfound', { method: 'DELETE' });
      const response = await DELETE(request, { params: Promise.resolve({ id: 'notfound' }) });
      expect(response.status).toBe(404);
    });
  });
});
```

- [ ] **Step 2: Run tests**

```bash
npm test -- src/__tests__/api/journal.test.ts
```

Expected: all tests pass

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/api/journal.test.ts && git commit -m "test(journal): add API tests for slot support"
```

---

## Task 8: Run Full Test Suite and Lint

- [ ] **Step 1: Run all tests**

```bash
npm test
```

Expected: all tests pass including new journal tests.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: no errors.

---

## Self-Review Checklist

- [ ] Spec coverage: Every spec requirement has a corresponding task
- [ ] No placeholder/TBD patterns in the plan
- [ ] Type consistency: `slot: 'morning' | 'evening'` used everywhere, `entriesByDate` uses the correct `{ morning, evening }` shape
- [ ] JournalHeatmap receives correct `entries` type with nested morning/evening
- [ ] JournalEntryModal accepts `{ morning, evening }` entries shape
- [ ] JournalView passes slot to the save mutation and passes entries by slot to the modal
