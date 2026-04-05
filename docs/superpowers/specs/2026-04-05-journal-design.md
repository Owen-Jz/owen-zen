# Daily Journal with Consistency Heatmap

## Status

Approved for implementation.

## Overview

A daily journaling feature integrated into the workspace dashboard. One entry per day with mood tracking and a GitHub-style consistency heatmap to visualize journaling habits over time. Includes search and tag filtering.

---

## Data Model

### `src/models/Journal.ts`

```ts
const JournalSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // "2026-04-05"
  text: { type: String, default: "" },
  mood: { type: Number, default: 3, min: 1, max: 5 }, // 1=red, 5=green
  tags: { type: [String], default: [] }, // e.g. ["work", "health"]
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Journal || mongoose.model('Journal', JournalSchema);
```

One entry per day, keyed by date string.

---

## API Routes

### `GET /api/journal`

Returns all entries for the specified year (defaults to current year). Supports search and tag filtering.

Query params:
- `year` (optional, default: current year)
- `search` (optional, matches against `text` field)
- `tag` (optional, filters entries containing the tag)

Response:
```json
{
  "success": true,
  "data": [
    { "date": "2026-04-05", "text": "...", "mood": 4, "tags": ["work"], "createdAt": "...", "updatedAt": "..." },
    { "date": "2026-04-04", "text": "...", "mood": 3, "tags": ["health"], "createdAt": "...", "updatedAt": "..." }
  ],
  "stats": { "currentStreak": 12, "longestStreak": 45, "totalEntries": 89 }
}
```

### `GET /api/journal?date=2026-04-05`

Returns a single entry for the specified date. Returns `{ success: true, data: null }` if no entry exists.

### `POST /api/journal`

Upsert — creates or updates an entry by date.

Request:
```json
{ "date": "2026-04-05", "text": "Today was great...", "mood": 4, "tags": ["work", "health"] }
```

### `DELETE /api/journal/[id]`

Deletes entry by MongoDB `_id`.

---

## Component Structure

### `src/components/JournalView.tsx`

Main view component. Manages:
- `year: number` — selected year for heatmap
- `entries: Record<string, { text, mood, tags }>` — keyed by date string for O(1) lookup
- `selectedDate: string | null` — currently open entry modal
- `searchQuery: string` — search filter
- `activeTag: string | null` — active tag filter

Fetches entries via React Query (`useQuery`) for the selected year.

### `src/components/journal/JournalHeatmap.tsx`

The GitHub-style heatmap grid. Props: `{ entries, onDateClick }`.

- Renders 52 weeks × 7 days grid
- Cell colors: no entry = `#161b22` (dark), mood 1 = `#c0392b` (red), mood 3 = `#f39c12` (yellow), mood 5 = `#27ae60` (green), interpolated for 2 and 4
- Hover tooltip: "April 5 — Mood 4"
- Click calls `onDateClick(date)`
- Year navigation

### `src/components/journal/JournalEntryModal.tsx`

Modal for viewing/editing an entry. Props: `{ date, entry, onClose, onSave }`.

- **Mood selector**: 5 clickable dots in gradient colors (red → yellow → green). Default is 3.
- **Tag editor**: Tag chips with ✕ to remove; input field to add new tags (press Enter to add)
- **Text area**: Free-form textarea with placeholder "Write your thoughts for today..."
- **Auto-save**: Debounced 1 second after last keystroke via POST
- **Empty state**: Shows empty mood dots (default 3) + empty textarea with placeholder when no entry exists
- **Close**: Backdrop click or Escape key

---

## Streak Calculation

```ts
function calculateStreaks(entries: { date: string }[]): { current: number, longest: number } {
  // Sort dates descending
  // Current streak: consecutive days ending at today or yesterday
  // Longest streak: longest run of consecutive dates in the dataset
}
```

---

## JournalView Layout

```
┌─────────────────────────────────────────────────────┐
│  📓 Journal                    [Year: 2026 ▼]  [🔍] │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐   │
│  │ 🔍 Search entries...                        │   │
│  │ Tag filter: [All ▼] [work] [health] [+]    │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │ Heatmap: 52 weeks × 7 days                  │   │
│  │ Color intensity by mood                     │   │
│  └─────────────────────────────────────────────┘   │
│  Legend: ○ No entry  ● Low mood  ●●● High mood    │
│  Current streak: 🔥 12 days  |  Longest: 45 days  │
└─────────────────────────────────────────────────────┘
```

Clicking any heatmap cell opens the Entry Modal.

---

## Entry Modal Layout

```
┌─────────────────────────────────────────────┐
│  April 5, 2026                         [✕] │
├─────────────────────────────────────────────┤
│  Mood:  ● ● ● ○ ○                          │
│         (5 dots, click to change)             │
│                                             │
│  Tags:  [work ✕] [health ✕] [+ Add tag]    │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Write your thoughts for today...    │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Last saved: 9:41 PM                        │
└─────────────────────────────────────────────┘
```

---

## Data Flow

```
User opens Journal tab
  → JournalView fetches GET /api/journal?year=2026
  → Heatmap renders cells colored by mood
  → Click cell → JournalEntryModal opens
    → If no entry: empty form, default mood=3
    → If entry exists: pre-filled
  → Type in textarea → debounced POST /api/journal
  → Click mood dot → immediate POST /api/journal
  → Add/remove tag → POST /api/journal
  → Modal closes → heatmap refreshes with new data
```

Search and tag filters update the visible entries in the heatmap in real-time via React Query re-fetch.

---

## Files to Create

1. `src/models/Journal.ts` — Mongoose model
2. `src/app/api/journal/route.ts` — GET (all/filtered) + POST (upsert)
3. `src/app/api/journal/[id]/route.ts` — DELETE by id
4. `src/components/journal/JournalHeatmap.tsx` — Heatmap grid component
5. `src/components/journal/JournalEntryModal.tsx` — Entry modal component
6. `src/components/JournalView.tsx` — Main view

## Files to Modify

1. `src/app/page.tsx` — Add JournalView to lazy-loaded views and navigation

---

## Out of Scope

- AI summaries or suggestions
- Multiple entries per day
- Export to PDF/CSV
- Entry date navigation (beyond year selector)
