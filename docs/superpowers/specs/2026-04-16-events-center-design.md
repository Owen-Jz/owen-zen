# Events Center — Google Calendar Integration

## Context

The Owen Zen dashboard has a mind map canvas (ZCanvas) used as a "focus board." Users want a lightweight, always-visible panel showing upcoming Google Calendar events — read-only, anchored top-right, minimal styling.

## Goals

- Display next N upcoming events from Google Calendar on the focus board
- Click event to open in Google Calendar
- Load on canvas mount, manual refresh only
- Incremental sync via Google sync tokens (efficient — only fetches changed events)
- Reusable service layer for all calendar operations

---

## Architecture

### New Files

```
src/
  lib/
    googleCalendar.ts       # GoogleCalendarService singleton (auth + operations)
  components/
    canvas/
      EventsCenter.tsx     # Canvas widget — floating panel top-right
  app/
    api/
      calendar/
        events/
          route.ts         # GET /api/calendar/events → upcoming events list
```

### Modified Files

- `src/app/page.tsx` — render `<EventsCenter />` inside `<ZCanvas>` (already imported there)
- Existing calendar sync route `src/app/api/calendar/sync/route.ts` — refactor to use `GoogleCalendarService`

---

## GoogleCalendarService (`src/lib/googleCalendar.ts`)

```typescript
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  location?: string;
  htmlLink: string;
  colorId?: string;
}

class GoogleCalendarService {
  private static instance: GoogleCalendarService;
  private syncToken: string | null = null;
  private lastSync: Date | null = null;

  // Singleton
  static getInstance(): GoogleCalendarService { ... }

  // Auth — same logic as existing sync/route.ts, centralized
  private async getCalendarClient() { ... }

  // Fetch upcoming events with incremental sync token support
  async getUpcomingEvents(maxResults = 10): Promise<CalendarEvent[]> { ... }

  // Save/restore sync token from localStorage (persists across sessions)
  saveSyncToken(token: string): void { ... }
  getSyncToken(): string | null { ... }

  // Force full sync (ignore sync token)
  async forceFullSync(): Promise<CalendarEvent[]> { ... }
}
```

### Sync Token Strategy

1. On first fetch: no sync token → full list fetch → store returned `nextSyncToken`
2. On subsequent fetches: send `syncToken` → Google returns only changes → update local list
3. If `syncToken` expires (410 Gone) → fallback to full fetch, start over
4. Token persisted to `localStorage` keyed by `gcal_sync_token`

---

## API Route — `GET /api/calendar/events`

**Request:** No body, no params.

**Response:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "abc123",
        "title": "Team Sync",
        "start": "2026-04-16T10:00:00.000Z",
        "end": "2026-04-16T11:00:00.000Z",
        "location": "https://meet.google.com/abc",
        "htmlLink": "https://calendar.google.com/calendar/r/eventid/abc123",
        "colorId": "1"
      }
    ],
    "lastSync": "2026-04-16T08:00:00.000Z",
    "isIncremental": true
  }
}
```

**Error handling:**
- 500 if Google Auth fails → `{ success: false, error: "..." }`
- 500 if API call fails → `{ success: false, error: "..." }`

---

## EventsCenter Component (`src/components/canvas/EventsCenter.tsx`)

**Visual:** Minimal floating card, fixed top-right of canvas viewport.

**Appearance (minimal — Option A):**
- 300px wide, max 5 events shown
- Each event: `HH:MM AM — Event Title` (one line, truncated)
- Subtle separator between events
- Top-right: refresh icon button + loading spinner state
- Bottom: "View in Google Calendar" link that opens `htmlLink` in new tab
- Badge showing total count when collapsed (future, not in v1)

**Layout:**
```
┌─────────────────────────────────┐
│  📅 Upcoming          [↻]       │
├─────────────────────────────────┤
│  10:00 AM — Team Sync           │
│  2:00 PM  — Project Review      │
│  4:30 PM  — 1:1 with Sarah      │
│  ...                            │
├─────────────────────────────────┤
│  ↗ Open in Google Calendar      │
└─────────────────────────────────┘
```

**States:**
- Loading: skeleton pulse rows (3 placeholder lines)
- Empty: "No upcoming events" centered message
- Error: small inline error message with retry button
- Default: event list

**Behavior:**
- Mount: fetch events once via `GET /api/calendar/events`
- Refresh button: re-fetch, show spinner while loading
- Each event row: `onClick` → `window.open(htmlLink, '_blank')`

**Positioning:** Fixed `top-4 right-4 z-50` inside the ZCanvas container. Does not scroll with canvas — stays in viewport corner.

**Styling:** Uses CSS variables from the existing design system (`--surface`, `--border`, `--foreground`, `--gray-500`).

---

## Data Flow

```
EventsCenter mounts
  → GET /api/calendar/events
    → GoogleCalendarService.getUpcomingEvents()
      → checks localStorage for sync token
      → calls google.calendar.events.list with syncToken (or without for full sync)
      → returns events list
      → stores new sync token in localStorage
  → renders event list
  → user clicks event
    → window.open(htmlLink, '_blank')
  → user clicks refresh
    → re-fetch (send current sync token for incremental)
```

---

## Dependencies

- `googleapis` package (already in use by sync route)
- No new runtime dependencies

---

## Scope v1

- Read-only event list
- Manual refresh (no auto-poll)
- Incremental sync token (efficient background updates when refresh is clicked)
- Single Google Calendar account (hardcoded `calendarId` as currently in sync route)
- No event creation, no event editing
- No webhook support (future enhancement)

---

## Open Questions

1. **Calendar ID** — currently hardcoded as `owendigitals@gmail.com`. Should this be configurable via env var?
2. **Max events** — default 10, configurable? (leaning toward keeping it simple: just 10, no config)
3. **Time zone** — events returned in UTC, display in local time. Confirm Lagos timezone (`Africa/Lagos`) from existing code is correct.

