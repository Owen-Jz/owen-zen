# Calorie Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simple calorie tracking where users log food items in free-form text, then analyze with Minimax AI to get total calories vs 2000 target.

**Architecture:** MongoDB/Mongoose for persistence, Minimax API for AI calorie analysis, React component for UI.

**Tech Stack:** Next.js, MongoDB, Mongoose, Minimax API

---

## File Structure

- Create: `src/models/FoodEntry.ts` - Mongoose model
- Create: `src/app/api/food/route.ts` - POST/GET endpoints
- Create: `src/app/api/food/analyze/route.ts` - AI analysis endpoint
- Create: `src/app/api/food/[id]/route.ts` - DELETE endpoint
- Create: `src/components/FoodTrackerView.tsx` - UI component
- Modify: `src/app/page.tsx` - Add to main dashboard

---

### Task 1: Create FoodEntry Model

**Files:**
- Create: `src/models/FoodEntry.ts`

- [ ] **Step 1: Write the model**

```typescript
import mongoose from 'mongoose';

const FoodEntrySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true,
  },
  items: {
    type: [String],
    default: [],
  },
  totalCalories: {
    type: Number,
    default: null,
  },
  analyzedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Normalize date to midnight for consistent querying
FoodEntrySchema.pre('save', function(next) {
  const date = new Date(this.date);
  date.setHours(0, 0, 0, 0);
  this.date = date;
  next();
});

export default mongoose.models.FoodEntry || mongoose.model('FoodEntry', FoodEntrySchema);
```

- [ ] **Step 2: Commit**

```bash
git add src/models/FoodEntry.ts
git commit -m "feat: add FoodEntry model for calorie tracking"
```

---

### Task 2: Create Food API Routes

**Files:**
- Create: `src/app/api/food/route.ts`
- Create: `src/app/api/food/analyze/route.ts`
- Create: `src/app/api/food/[id]/route.ts`

- [ ] **Step 1: Write POST/GET route**

```typescript
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import FoodEntry from '@/models/FoodEntry';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { items } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items required' }, { status: 400 });
    }

    // Get today's date normalized to midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find existing entry for today
    let entry = await FoodEntry.findOne({ date: today });

    if (entry) {
      // Append new items
      entry.items.push(...items);
      entry.totalCalories = null; // Reset analysis
      entry.analyzedAt = null;
      await entry.save();
    } else {
      // Create new entry
      entry = await FoodEntry.create({
        date: today,
        items,
      });
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Food POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    let date = new Date();
    if (dateParam) {
      date = new Date(dateParam);
    }
    date.setHours(0, 0, 0, 0);

    const entry = await FoodEntry.findOne({ date });
    return NextResponse.json(entry || { items: [], totalCalories: null });
  } catch (error) {
    console.error('Food GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Write analyze route**

```typescript
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import FoodEntry from '@/models/FoodEntry';

export async function POST() {
  try {
    await dbConnect();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const entry = await FoodEntry.findOne({ date: today });

    if (!entry || entry.items.length === 0) {
      return NextResponse.json({ error: 'No food items to analyze' }, { status: 400 });
    }

    // Call Minimax API
    const apiKey = process.env.MINIMAX_API_KEY;
    const itemsList = entry.items.join(', ');

    const prompt = `Analyze the following food items and estimate total calories. Return only the total number, nothing else.

Items: ${itemsList}`;

    const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_pro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'abab6.5s-chat',
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '';

    // Parse calorie number from response
    const calories = parseInt(content.replace(/[^0-9]/g, ''), 10);

    if (isNaN(calories)) {
      return NextResponse.json({ error: 'Failed to parse calories' }, { status: 500 });
    }

    // Update entry
    entry.totalCalories = calories;
    entry.analyzedAt = new Date();
    await entry.save();

    return NextResponse.json({ totalCalories: calories });
  } catch (error) {
    console.error('Food analyze error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Write DELETE route**

```typescript
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import FoodEntry from '@/models/FoodEntry';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    await FoodEntry.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Food DELETE error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/food/route.ts src/app/api/food/analyze/route.ts src/app/api/food/[id]/route.ts
git commit -m "feat: add food API routes"
```

---

### Task 3: Create FoodTrackerView Component

**Files:**
- Create: `src/components/FoodTrackerView.tsx`

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { useState, useEffect } from "react";
import { Flame, Plus, X, Loader2, Trash2 } from "lucide-react";

interface FoodEntry {
  _id?: string;
  date: string;
  items: string[];
  totalCalories: number | null;
  analyzedAt: string | null;
}

const DAILY_TARGET = 2000;

export function FoodTrackerView() {
  const [entry, setEntry] = useState<FoodEntry>({
    date: new Date().toISOString().split('T')[0],
    items: [],
    totalCalories: null,
    analyzedAt: null,
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchToday();
  }, []);

  const fetchToday = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/food');
      const data = await res.json();
      if (data._id) {
        setEntry(data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const addItems = async () => {
    if (!input.trim()) return;

    const newItems = input.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
    if (newItems.length === 0) return;

    setLoading(true);
    try {
      const res = await fetch('/api/food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: newItems }),
      });
      const data = await res.json();
      setEntry(data);
      setInput("");
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const analyzeFood = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch('/api/food/analyze', { method: 'POST' });
      const data = await res.json();
      if (data.totalCalories !== undefined) {
        setEntry(prev => ({
          ...prev,
          totalCalories: data.totalCalories,
          analyzedAt: new Date().toISOString(),
        }));
      }
    } catch (e) {
      console.error(e);
    }
    setAnalyzing(false);
  };

  const deleteItem = async (index: number) => {
    const newItems = entry.items.filter((_, i) => i !== index);
    setLoading(true);
    try {
      const res = await fetch('/api/food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: newItems }),
      });
      const data = await res.json();
      setEntry(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const getProgressColor = () => {
    if (!entry.totalCalories) return "bg-gray-500";
    const ratio = entry.totalCalories / DAILY_TARGET;
    if (ratio < 0.9) return "bg-emerald-500";
    if (ratio <= 1.1) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getStatusText = () => {
    if (!entry.totalCalories) return "";
    const ratio = entry.totalCalories / DAILY_TARGET;
    if (ratio < 0.9) return "Under target";
    if (ratio <= 1.1) return "On track";
    return "Over target";
  };

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
          <Flame className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Calorie Tracker</h1>
          <p className="text-sm text-gray-400">Daily target: {DAILY_TARGET} kcal</p>
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-surface border border-border rounded-2xl p-4 mb-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What did you eat? (e.g., 2 eggs, toast, banana)"
          className="w-full bg-transparent border-none outline-none resize-none text-sm placeholder:text-gray-500"
          rows={3}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              addItems();
            }
          }}
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={addItems}
            disabled={loading || !input.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Food
          </button>
        </div>
      </div>

      {/* Items List */}
      {entry.items.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <h3 className="font-medium mb-3">Today's Food</h3>
          <div className="space-y-2">
            {entry.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between group">
                <span className="text-sm">{item}</span>
                <button
                  onClick={() => deleteItem(i)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-opacity"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analyze Button */}
      <button
        onClick={analyzeFood}
        disabled={analyzing || entry.items.length === 0}
        className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 rounded-xl font-medium transition-all mb-4"
      >
        {analyzing ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Analyzing...
          </span>
        ) : (
          `Analyze Calories`
        )}
      </button>

      {/* Results */}
      {entry.totalCalories !== null && (
        <div className="bg-surface border border-border rounded-2xl p-6 text-center animate-in fade-in">
          <div className="text-sm text-gray-400 mb-1">Total Calories</div>
          <div className="text-5xl font-bold mb-4">{entry.totalCalories}</div>

          {/* Progress Bar */}
          <div className="mb-2">
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${getProgressColor()} transition-all duration-500`}
                style={{ width: `${Math.min((entry.totalCalories / DAILY_TARGET) * 100, 100)}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">{getStatusText()}</span>
            <span className="text-gray-400">{Math.round((entry.totalCalories / DAILY_TARGET) * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/FoodTrackerView.tsx
git commit -m "feat: add FoodTrackerView component"
```

---

### Task 4: Add to Main Dashboard

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Find where to add and add the import + component**

Look for existing views being imported (e.g., GymView, MealPlanView) and add FoodTrackerView in a similar pattern.

Add to imports:
```tsx
import { FoodTrackerView } from '@/components/FoodTrackerView';
```

Add to render (create a new section/tab or add to existing dashboard):
```tsx
{activeTab === 'food' && <FoodTrackerView />}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add calorie tracker to dashboard"
```

---

## Summary

Total tasks: 4
- Task 1: FoodEntry model (1 step)
- Task 2: API routes (3 steps)
- Task 3: UI component (2 steps)
- Task 4: Integration (2 steps)

Total steps: 8
