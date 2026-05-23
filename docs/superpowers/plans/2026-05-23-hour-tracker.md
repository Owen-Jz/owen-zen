# Hour Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone hourly time log (Hour Tracker) — a 24h grid view of one day where each hour can hold a free-text entry, with planned (faded) vs. logged (solid) distinction and color-coded entry types.

**Architecture:** MongoDB-backed with a Mongoose model, Next.js API routes following existing patterns, React component with React Query for server state and local `useState` for UI.

**Tech Stack:** Next.js 16, MongoDB/Mongoose, React Query, Tailwind CSS v4, Framer Motion, Lucide icons.

---

## File Map

- Create: `src/models/HourEntry.ts`
- Create: `src/app/api/hour-entries/route.ts`
- Create: `src/app/api/hour-entries/[id]/route.ts`
- Create: `src/components/HourTrackerView.tsx`
- Modify: `src/types/index.ts` — add `HourEntry` interface
- Modify: `src/app/page.tsx` — add nav item to access Hour Tracker

---

## Tasks

### Task 1: Model & Types

**Files:**
- Create: `src/models/HourEntry.ts`
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add HourEntry interface to types/index.ts**

```typescript
export interface HourEntry {
  _id: string;
  date: string;          // YYYY-MM-DD
  hour: number;         // 0–23
  text: string;
  type: 'deep-work' | 'routine' | 'meetings' | 'breaks' | 'distracted' | 'default';
  isPlanned: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

- [ ] **Step 2: Create HourEntry model**

```typescript
import mongoose from 'mongoose';

const HourEntrySchema = new mongoose.Schema({
  date: {
    type: String,
    required: [true, 'Date is required.'],
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format.'],
    index: true,
  },
  hour: {
    type: Number,
    required: [true, 'Hour is required.'],
    min: [0, 'Hour must be between 0 and 23.'],
    max: [23, 'Hour must be between 0 and 23.'],
  },
  text: {
    type: String,
    default: '',
    maxlength: [500, 'Entry cannot be more than 500 characters.'],
  },
  type: {
    type: String,
    enum: ['deep-work', 'routine', 'meetings', 'breaks', 'distracted', 'default'],
    default: 'default',
  },
  isPlanned: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Unique constraint: one entry per date+hour
HourEntrySchema.index({ date: 1, hour: 1 }, { unique: true });

export default mongoose.models.HourEntry || mongoose.model('HourEntry', HourEntrySchema);
```

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts src/models/HourEntry.ts
git commit -m "feat: add HourEntry model and types"
```

---

### Task 2: API Routes

**Files:**
- Create: `src/app/api/hour-entries/route.ts`
- Create: `src/app/api/hour-entries/[id]/route.ts`

- [ ] **Step 1: Create GET/POST route**

```typescript
import dbConnect from "@/lib/db";
import HourEntry from "@/models/HourEntry";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { success: false, error: 'Date is required (YYYY-MM-DD).' },
        { status: 400 }
      );
    }

    await dbConnect();
    const entries = await HourEntry.find({ date }).sort({ hour: 1 });
    return NextResponse.json({ success: true, data: entries });
  } catch (error) {
    console.error('GET /api/hour-entries error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch hour entries.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { date, hour, text, type, isPlanned } = body;

    if (!date || hour === undefined) {
      return NextResponse.json(
        { success: false, error: 'Date and hour are required.' },
        { status: 400 }
      );
    }

    if (hour < 0 || hour > 23) {
      return NextResponse.json(
        { success: false, error: 'Hour must be between 0 and 23.' },
        { status: 400 }
      );
    }

    // Upsert: update existing entry for this date+hour, or create new
    const entry = await HourEntry.findOneAndUpdate(
      { date, hour },
      { $set: { text: text || '', type: type || 'default', isPlanned: isPlanned || false } },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (error) {
    console.error('POST /api/hour-entries error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save hour entry.' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Create [id] GET/PUT/DELETE route**

```typescript
import dbConnect from "@/lib/db";
import HourEntry from "@/models/HourEntry";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    const entry = await HourEntry.findById(id);
    if (!entry) {
      return NextResponse.json({ success: false, error: 'Entry not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: entry });
  } catch (error) {
    console.error('GET /api/hour-entries/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch entry.' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    await dbConnect();

    const entry = await HourEntry.findByIdAndUpdate(
      id,
      { $set: { text: body.text, type: body.type, isPlanned: body.isPlanned } },
      { new: true, runValidators: true }
    );

    if (!entry) {
      return NextResponse.json({ success: false, error: 'Entry not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: entry });
  } catch (error) {
    console.error('PUT /api/hour-entries/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update entry.' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    const entry = await HourEntry.findByIdAndDelete(id);
    if (!entry) {
      return NextResponse.json({ success: false, error: 'Entry not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    console.error('DELETE /api/hour-entries/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete entry.' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/hour-entries/route.ts src/app/api/hour-entries/[id]/route.ts
git commit -m "feat: add hour-entries API routes"
```

---

### Task 3: HourTrackerView Component

**Files:**
- Create: `src/components/HourTrackerView.tsx`

- [ ] **Step 1: Write the HourTrackerView component**

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, Copy, LayoutGrid } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { HourEntry } from "@/types";

const ENTRY_TYPES = [
  { key: "deep-work", label: "Deep Work", color: "bg-blue-500" },
  { key: "routine", label: "Routine", color: "bg-green-500" },
  { key: "meetings", label: "Meetings", color: "bg-yellow-500" },
  { key: "breaks", label: "Breaks", color: "bg-orange-500" },
  { key: "distracted", label: "Distracted", color: "bg-red-500" },
  { key: "default", label: "Default", color: "bg-gray-500" },
] as const;

const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 || 12;
  const ampm = i < 12 ? "AM" : "PM";
  return `${h}:00 ${ampm}`;
});

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toDateString(date: Date) {
  return date.toISOString().split("T")[0];
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function tw(...classes: (string | undefined)[]) {
  return twMerge(clsx(classes));
}

export function HourTrackerView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingCell, setEditingCell] = useState<number | null>(null);
  const [draftText, setDraftText] = useState("");
  const [draftType, setDraftType] = useState<HourEntry["type"]>("default");
  const [showAllHours, setShowAllHours] = useState(false);
  const queryClient = useQueryClient();

  const dateString = toDateString(currentDate);

  const { data: entries = [] } = useQuery<HourEntry[]>({
    queryKey: ["hour-entries", dateString],
    queryFn: async () => {
      const res = await fetch(`/api/hour-entries?date=${dateString}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (payload: {
      date: string;
      hour: number;
      text: string;
      type: HourEntry["type"];
      isPlanned: boolean;
    }) => {
      const res = await fetch("/api/hour-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hour-entries", dateString] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/hour-entries/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hour-entries", dateString] });
    },
  });

  const copyYesterdayMutation = useMutation({
    mutationFn: async () => {
      const yesterday = toDateString(addDays(currentDate, -1));
      const res = await fetch(`/api/hour-entries?date=${yesterday}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as HourEntry[];
    },
    onSuccess: (yesterdayEntries) => {
      yesterdayEntries.forEach((entry) => {
        if (!entry.isPlanned) {
          // Copy as planned, not logged
          upsertMutation.mutate({
            date: dateString,
            hour: entry.hour,
            text: entry.text,
            type: entry.type,
            isPlanned: true,
          });
        }
      });
    },
  });

  const getEntryForHour = useCallback(
    (hour: number) => entries.find((e) => e.hour === hour),
    [entries]
  );

  const hours = showAllHours
    ? Array.from({ length: 24 }, (_, i) => i)
    : Array.from({ length: 18 }, (_, i) => i + 6); // 6am to 11pm

  const startEdit = (hour: number) => {
    const existing = getEntryForHour(hour);
    if (existing) {
      setDraftText(existing.text);
      setDraftType(existing.type);
    } else {
      setDraftText("");
      setDraftType("default");
    }
    setEditingCell(hour);
  };

  const saveEdit = () => {
    if (editingCell === null) return;
    const hour = editingCell;
    const existing = getEntryForHour(hour);
    const isPlanned = !showAllHours && hour > new Date().getHours();

    if (existing) {
      // Update existing
      upsertMutation.mutate({
        date: dateString,
        hour,
        text: draftText,
        type: draftType,
        isPlanned: existing.isPlanned,
      });
    } else if (draftText.trim()) {
      // Create new
      upsertMutation.mutate({
        date: dateString,
        hour,
        text: draftText,
        type: draftType,
        isPlanned,
      });
    }
    setEditingCell(null);
    setDraftText("");
  };

  const deleteEntry = (hour: number) => {
    const existing = getEntryForHour(hour);
    if (existing) {
      deleteMutation.mutate(existing._id);
    }
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setDraftText("");
  };

  const isFutureHour = (hour: number) => {
    const now = new Date();
    return (
      currentDate.toDateString() === now.toDateString() && hour > now.getHours()
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentDate(addDays(currentDate, -1))}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="text-sm font-bold">{formatDate(currentDate)}</div>
          </div>
          <button
            onClick={() => setCurrentDate(addDays(currentDate, 1))}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => copyYesterdayMutation.mutate()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white border border-border rounded-lg hover:bg-white/5 transition-all"
          >
            <Copy size={14} />
            Copy Yesterday
          </button>
          <button
            onClick={() => setShowAllHours(!showAllHours)}
            className={tw(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg transition-all",
              showAllHours
                ? "bg-primary/20 text-primary border-primary/30"
                : "text-gray-400 hover:text-white border-border hover:bg-white/5"
            )}
          >
            <LayoutGrid size={14} />
            {showAllHours ? "Waking Hours" : "24 Hours"}
          </button>
        </div>
      </div>

      {/* Hour Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-border/50">
          {hours.map((hour) => {
            const entry = getEntryForHour(hour);
            const isEditing = editingCell === hour;
            const future = isFutureHour(hour);
            const typeColor = entry
              ? ENTRY_TYPES.find((t) => t.key === entry.type)?.color ?? "bg-gray-500"
              : null;

            return (
              <div
                key={hour}
                className={tw(
                  "flex items-stretch min-h-[52px] hover:bg-white/[0.02] transition-colors group",
                  entry?.isPlanned && "opacity-80"
                )}
                style={entry && !entry.isPlanned ? { borderLeft: `3px solid ${typeColor}` } : { borderLeft: entry ? `3px dashed ${typeColor}` : undefined }}
              >
                {/* Hour Label */}
                <div className="w-16 shrink-0 flex items-center px-3 text-xs text-gray-500 font-medium">
                  {HOUR_LABELS[hour]}
                </div>

                {/* Content Area */}
                <div className="flex-1 py-2 pr-3">
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        autoFocus
                        value={draftText}
                        onChange={(e) => setDraftText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") cancelEdit();
                        }}
                        placeholder={future ? "Plan your intention..." : "What did you do?"}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
                      />
                      <div className="flex items-center gap-2">
                        {ENTRY_TYPES.map((t) => (
                          <button
                            key={t.key}
                            onClick={() => setDraftType(t.key)}
                            title={t.label}
                            className={tw(
                              "w-5 h-5 rounded-full transition-transform hover:scale-110",
                              t.color,
                              draftType === t.key && "ring-2 ring-white ring-offset-1 ring-offset-background"
                            )}
                          />
                        ))}
                        <div className="flex-1" />
                        <button
                          onClick={cancelEdit}
                          className="px-2 py-1 text-xs text-gray-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveEdit}
                          className="px-3 py-1 text-xs bg-primary text-white rounded-lg hover:brightness-110"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : entry ? (
                    <div
                      onClick={() => startEdit(hour)}
                      className={tw(
                        "cursor-pointer text-sm leading-snug",
                        entry.isPlanned
                          ? "italic text-gray-400"
                          : "text-white",
                        !entry.text && "text-gray-500 italic"
                      )}
                    >
                      {entry.text || "(no entry)"}
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(hour)}
                      className="w-full text-left text-sm text-gray-600 hover:text-gray-400 transition-colors"
                    >
                      {future ? "+ Add intention..." : "+ Log what happened..."}
                    </button>
                  )}
                </div>

                {/* Delete button on hover */}
                {entry && !isEditing && (
                  <button
                    onClick={() => deleteEntry(hour)}
                    className="opacity-0 group-hover:opacity-100 self-center mr-2 p-1 text-gray-500 hover:text-red-400 transition-all text-xs"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/HourTrackerView.tsx
git commit -m "feat: add HourTrackerView component"
```

---

### Task 4: Wire into page.tsx Navigation

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Find where views are registered and add HourTrackerView**

Locate the lazy-loaded view imports (around line 53–100 of page.tsx) and add:

```typescript
const HourTrackerView = dynamic(() => import("@/components/HourTrackerView").then(mod => ({ default: mod.HourTrackerView })), {
  loading: () => <Loading />
});
```

- [ ] **Step 2: Find the sections/state that controls which view is shown**

Look for the `activeSection` or `currentView` state and the nav items array. Add a nav item for "Hour Tracker" with the `Clock` icon, and handle the `hourTracker` section in the view-switching logic.

The exact implementation depends on existing patterns — look for how `ClientsView` or `InboxView` is wired in as a section.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: wire HourTrackerView into main nav"
```

---

### Self-Review Checklist

1. **Spec coverage:** Does every section in the spec have a corresponding task? ✅/❌
2. **Placeholder scan:** No TBD, TODO, "add appropriate error handling" or vague steps? ✅/❌
3. **Type consistency:** `HourEntry` interface fields match the component usage? ✅/❌
4. **Spec gaps found:** (fill in if any)

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-23-hour-tracker.md`.**

**Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?