# Journal Morning & Evening Slots — Design

## Overview

Extend the journal to support two distinct writing slots per day: **morning** (intentions/plans) and **evening** (reflection/wins). Each slot has its own text, mood, and tags, but they share a single calendar day on the heatmap.

---

## Data Model

**Journal collection** — add a `slot` field to the existing schema:

```typescript
{
  date: String,      // "2026-04-16" — unique only within same slot
  slot: String,      // "morning" | "evening" — part of the unique compound key
  text: String,
  mood: Number,      // 1-5
  tags: [String],
  createdAt: Date,
  updatedAt: Date,
}
```

**Uniqueness constraint:** `{ date, slot }` must be unique together. The original schema had `unique: true` on `date` alone; this is replaced by a compound unique index on `{ date, slot }`.

**Backward compatibility:** Existing entries in the database have no `slot` field (they were the evening slot). On read, missing `slot` is treated as `"evening"`. On any upsert/write, if `slot` is not provided, default to `"evening"`. This ensures all existing entries slot into the evening category automatically.

**Compound index:** `{ date: 1, slot: 1 }` with unique: true.

---

## API Changes

### GET `/api/journal?year=2026&slot=morning|evening`

- `slot` param is optional; if omitted, returns all entries for the year (both slots).
- Response shape unchanged:
  ```json
  {
    "success": true,
    "data": [{ "_id", "date", "slot", "text", "mood", "tags", "updatedAt" }],
    "stats": { "currentStreak": 3, "longestStreak": 7, "totalEntries": 42 }
  }
  ```
- `totalEntries` counts individual slot entries (not days).
- `currentStreak` and `longestStreak` count days where **at least one slot has an entry**.

### POST `/api/journal`

Body:
```json
{
  "date": "2026-04-16",
  "slot": "morning",
  "text": "Plan to finish the report...",
  "mood": 4,
  "tags": ["work", "focus"]
}
```

Uses `findOneAndUpdate` with upsert on `{ date, slot }`. Validates `slot` is `"morning"` or `"evening"`.

### PUT/DELETE `/api/journal/[id]`

Work on individual slot entries by `_id` as before. No changes needed.

---

## Heatmap Changes

- A day is "lit" if it has **at least one entry** (morning OR evening).
- The color of the heatmap cell is determined by the **evening mood** if an evening entry exists; otherwise the **morning mood** if only morning exists.
- Days with only a morning entry (no evening) still appear lit.
- Streak calculation: a day counts toward streak if either slot has an entry.

---

## UI Changes

### JournalView

- **Today Entry button** opens the modal for today's date (no slot pre-selected yet).
- **Entry cards** in the list show the date once; cards are grouped but distinct entries still show separately.
- Cards show a label badge: "Morning" or "Evening" on the card.
- Empty state: if a date has no entries yet, show prompt to add either slot.

### JournalEntryModal

- **Two sections** inside the modal, stacked: Morning on top, Evening below.
- Each section has its own:
  - Mood selector (5 colored circles)
  - Tag input + tag display
  - Text area
  - Last saved indicator
- If only one slot exists for the date, show just that section.
- Section headers: "🌅 Morning" and "🌙 Evening" with sub-labels ("What's on your plate today?" / "What went well?")
- Modal height increases to accommodate both sections; modal becomes scrollable if needed.

### Prompt Labels

- Morning section prompt: "What will you do today? What are you grateful for?"
- Evening section prompt: "What went well? What did you learn?"

### Entry Card Display

- Show both slots on one card if both exist:
  ```
  ┌─────────────────────────┐
  │ Mon, Apr 16              │
  │ [🌅 Morning] [🌙 Evening]│
  │ [mood dot] [mood dot]    │
  │ "Plan to..."             │
  └─────────────────────────┘
  ```
- If only one slot exists, show it without the slot label toggle.

---

## Backward Compatibility

Existing entries in the database have no `slot` field. On read:
- Treat missing `slot` as `"evening"`.
- On any write to an existing entry (upsert path), set `slot: "evening"` if not present.

---

## Stats Changes

- `totalEntries`: counts individual slot entries (morning + evening combined).
- `currentStreak` / `longestStreak`: a day counts if it has at least one entry in either slot.
- Streak algorithm: build dateSet from unique dates (deduplicate same date across slots).

---

## Implementation Steps

1. Update `src/models/Journal.ts` — add `slot` field with compound unique index
2. Update `src/app/api/journal/route.ts` GET — filter by slot, fix stats counting
3. Update `src/app/api/journal/route.ts` POST — require and validate slot, upsert on `{ date, slot }`
4. Update `src/components/journal/JournalEntryModal.tsx` — two-section layout
5. Update `src/components/JournalView.tsx` — slot badges, grouped display
6. Update `src/components/journal/JournalHeatmap.tsx` — evening-mood-first coloring
7. Run existing tests; add tests for new slot behavior
