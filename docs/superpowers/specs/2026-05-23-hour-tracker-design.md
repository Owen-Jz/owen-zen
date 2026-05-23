# Hour Tracker — Design Spec

## Concept & Vision

A standalone, freeform hourly log that maps every hour of your day to what you actually did. Works in two modes: **planning** (pre-fill future hours with intentions, shown faded) and **logging** (fill in retroactively as the day unfolds). The grid is the canonical "what did I do today" view — no task linking, just honest time accounting.

## Design

### Layout

**Single-day view** — one day visible at a time, with day navigation (prev/next arrows, or a date picker).

The grid shows **waking hours** (configurable, default 6am–11pm = 17 rows) or full 24h toggle.

Each row is one hour, labeled on the left (e.g., "9:00 AM"). The row has:
- A text input field (full width) that accepts free text
- A colored left-border indicator for entry type (see below)
- Planned entries shown with a dashed border and ghosted/opacity-50 text
- Actual/logged entries shown solid

**Planned vs. Logged distinction:**
- **Planned** — light background, dashed left border, italic text, e.g. `~Work on client pitch`
- **Logged** — solid background matching content type, solid left border
- Entries can transition from planned → logged by clicking and filling in actual text

### Entry Types (Color Coding)

Each entry gets a colored left border to categorize:
- 🟦 **Deep Work** (blue) — focused, high-cognitive tasks
- 🟩 **Routine** (green) — regular recurring tasks (email, standups, admin)
- 🟨 **Meetings** (yellow) — calls, syncs, collaborative time
- 🟧 **Breaks** (orange) — meals, walks, rest
- 🟥 **Distracted** (red) — social media, rabbit holes, lost time
- ⬜ **Default** (gray) — uncategorized or personal

A small color picker (6 dots) appears on entry focus. Selection persists for the session.

### Interaction

**Adding an entry:**
- Click any empty hour row → cursor lands in text input, ready to type
- Press Enter or click away → saves entry
- Entry becomes "logged" on save (solid style)

**Planning ahead:**
- Click an hour in the future → type intention, press Enter → saved as "planned"
- Planned entries show with `~` prefix in stored data (not displayed to user)

**Retroactive logging:**
- Click any past hour → type what happened → saves as logged entry for that hour
- Works for any past hour, even yesterday (via navigation)

**Editing:**
- Click an existing entry → inline edit
- Delete: clear the text and press Enter, or a small ×  appears on hover

**Quick templates:**
- "Copy yesterday" button at top → copies all logged entries from previous day into today's planned slots (as planned, not logged — user confirms what actually happened)

### Responsive Behavior

- Desktop: full grid with hour labels
- Mobile: compact mode — tap hour to expand inline input, no persistent grid lines until focused

## Data Model

**HourEntry**
```
{
  _id: ObjectId,
  date: Date,          // The day (no time component)
  hour: Number,        // 0–23
  text: String,        // What was done
  type: String,        // 'deep-work' | 'routine' | 'meetings' | 'breaks' | 'distracted' | 'default'
  isPlanned: Boolean,  // true = intention, false = logged
  createdAt: Date,
  updatedAt: Date
}
```

Index: `{ date: 1, hour: 1 }` — unique, one entry per hour per day.

## API

```
GET    /api/hour-entries?date=YYYY-MM-DD          → HourEntry[]
POST   /api/hour-entries                           → HourEntry (create or update by date+hour)
DELETE /api/hour-entries/:id                       → void
```

**POST payload:**
```json
{
  "date": "2026-05-23",
  "hour": 9,
  "text": "Worked on client pitch",
  "type": "deep-work",
  "isPlanned": false
}
```

If entry for `date+hour` already exists, update it (upsert).

## Features

### Core
1. Hourly grid view (single day)
2. Add/edit entries inline — click to edit, Enter to save
3. Color-coded entry types
4. Planned vs. logged visual distinction
5. Prev/next day navigation
6. Retroactive logging (any past day, any past hour)

### Secondary
7. "Copy yesterday" template action
8. Waking hours toggle (6–23 vs 0–23)
9. Mobile-optimized compact mode

## Technical Approach

- **Component**: `HourTrackerView` in `src/components/`
- **New model**: `HourEntry` in `src/models/HourEntry.ts`
- **New API routes**: `src/app/api/hour-entries/route.ts` and `src/app/api/hour-entries/[id]/route.ts`
- **Existing patterns**: Follow the same structure as `src/app/api/tasks/route.ts`
- **State**: React Query for server state, local `useState` for UI state (selected date, draft text)
- **Styling**: Tailwind CSS v4 per project convention
- **Persistence**: MongoDB via Mongoose

## Out of Scope

- Linking entries to tasks
- Pomodoro integration (keep it standalone)
- Analytics/reports (just the log view)
- Recurring templates beyond "copy yesterday"