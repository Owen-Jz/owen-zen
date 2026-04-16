# Events Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a minimal floating panel on the ZCanvas focus board showing upcoming Google Calendar events with click-to-open, manual refresh, and incremental sync via Google sync tokens.

**Architecture:** A `GoogleCalendarService` singleton (`src/lib/googleCalendar.ts`) centralizes auth and calendar operations. A read-only API route (`GET /api/calendar/events`) returns upcoming events using the service. The `EventsCenter` component renders a fixed top-right floating card on the canvas.

**Tech Stack:** Next.js App Router, TypeScript, `googleapis`, `framer-motion`, React Query

---

## File Structure

| File | Role |
|---|---|
| `src/lib/googleCalendar.ts` | **NEW** — GoogleCalendarService singleton: auth, getUpcomingEvents, forceFullSync, sync token management |
| `src/app/api/calendar/events/route.ts` | **NEW** — GET handler, returns upcoming events list |
| `src/app/api/calendar/sync/route.ts` | **MODIFY** — refactor to use GoogleCalendarService for auth |
| `src/components/canvas/EventsCenter.tsx` | **NEW** — floating top-right widget |
| `src/components/ZCanvas.tsx` | **MODIFY** — import and render EventsCenter |

---

## Task 1: Create GoogleCalendarService

**File:** Create `src/lib/googleCalendar.ts`

- [ ] **Step 1: Write the service file**

```typescript
import { google } from 'googleapis';
import path from 'path';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO string
  end: string;     // ISO string
  location?: string;
  htmlLink: string;
  colorId?: string;
}

interface SyncResult {
  events: CalendarEvent[];
  nextSyncToken: string | null;
  isIncremental: boolean;
}

class GoogleCalendarService {
  private static instance: GoogleCalendarService;
  private syncToken: string | null = null;
  private lastSync: Date | null = null;
  private readonly CALENDAR_ID = 'owendigitals@gmail.com';
  private readonly SYNC_TOKEN_KEY = 'gcal_sync_token';

  static getInstance(): GoogleCalendarService {
    if (!GoogleCalendarService.instance) {
      GoogleCalendarService.instance = new GoogleCalendarService();
    }
    return GoogleCalendarService.instance;
  }

  private async getCalendarClient() {
    // Priority 1: Environment variable
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      try {
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
        const auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/calendar'],
        });
        return google.calendar({ version: 'v3', auth });
      } catch (e) {
        throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_JSON format.');
      }
    }

    // Priority 2: Local service_account.json
    try {
      const keyFilePath = path.join(process.cwd(), 'service_account.json');
      const auth = new google.auth.GoogleAuth({
        keyFile: keyFilePath,
        scopes: ['https://www.googleapis.com/auth/calendar'],
      });
      return google.calendar({ version: 'v3', auth });
    } catch {
      throw new Error('Google Calendar credentials missing. Set GOOGLE_SERVICE_ACCOUNT_JSON or place service_account.json in project root.');
    }
  }

  saveSyncToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.SYNC_TOKEN_KEY, token);
    }
    this.syncToken = token;
  }

  getSyncToken(): string | null {
    if (this.syncToken) return this.syncToken;
    if (typeof window !== 'undefined') {
      this.syncToken = localStorage.getItem(this.SYNC_TOKEN_KEY);
    }
    return this.syncToken;
  }

  clearSyncToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.SYNC_TOKEN_KEY);
    }
    this.syncToken = null;
  }

  async getUpcomingEvents(maxResults = 10): Promise<SyncResult> {
    const calendar = await this.getCalendarClient();
    const now = new Date().toISOString();
    const token = this.getSyncToken();

    let response;
    try {
      if (token) {
        // Incremental sync
        response = await calendar.events.list({
          calendarId: this.CALENDAR_ID,
          maxResults,
          timeMin: now,
          singleEvents: true,
          orderBy: 'startTime',
          syncToken: token,
        });
      } else {
        // Full sync
        response = await calendar.events.list({
          calendarId: this.CALENDAR_ID,
          maxResults,
          timeMin: now,
          singleEvents: true,
          orderBy: 'startTime',
        });
      }
    } catch (error: any) {
      // 410 Gone = sync token expired, fall back to full sync
      if (error.code === 410) {
        this.clearSyncToken();
        return this.getUpcomingEvents(maxResults);
      }
      throw error;
    }

    const events: CalendarEvent[] = (response.data.items || []).map((item: any) => ({
      id: item.id,
      title: item.summary || '(No title)',
      start: item.start?.dateTime || item.start?.date,
      end: item.end?.dateTime || item.end?.date,
      location: item.location,
      htmlLink: item.htmlLink,
      colorId: item.colorId,
    }));

    const nextSyncToken = response.data.nextSyncToken || null;
    if (nextSyncToken) {
      this.saveSyncToken(nextSyncToken);
    }
    this.lastSync = new Date();

    return {
      events,
      nextSyncToken,
      isIncremental: !!token,
    };
  }

  async forceFullSync(maxResults = 10): Promise<SyncResult> {
    this.clearSyncToken();
    return this.getUpcomingEvents(maxResults);
  }
}

export default GoogleCalendarService;
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/googleCalendar.ts
git commit -m "feat(calendar): add GoogleCalendarService singleton"
```

---

## Task 2: Create GET /api/calendar/events route

**Files:**
- Create: `src/app/api/calendar/events/route.ts`
- Test: `src/app/api/calendar/events/route.test.ts` (optional if no existing test pattern for API routes)

- [ ] **Step 1: Write the API route**

```typescript
import { NextResponse } from 'next/server';
import GoogleCalendarService from '@/lib/googleCalendar';

export async function GET() {
  try {
    const service = GoogleCalendarService.getInstance();
    const result = await service.getUpcomingEvents(10);

    return NextResponse.json({
      success: true,
      data: {
        events: result.events,
        lastSync: new Date().toISOString(),
        isIncremental: result.isIncremental,
      },
    });
  } catch (error: any) {
    console.error('Calendar Events API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/calendar/events/route.ts
git commit -m "feat(calendar): add GET /api/calendar/events route"
```

---

## Task 3: Refactor existing sync route to use GoogleCalendarService

**File:** Modify `src/app/api/calendar/sync/route.ts`

- [ ] **Step 1: Replace auth + POST handler**

Replace the entire file content with:

```typescript
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Task from '@/models/Task';
import GoogleCalendarService from '@/lib/googleCalendar';

export async function POST(req: Request) {
  await dbConnect();
  try {
    const { taskId, date } = await req.json();

    if (!taskId || !date) {
      return NextResponse.json({ success: false, error: 'Missing taskId or date' }, { status: 400 });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    const service = GoogleCalendarService.getInstance();
    let calendar;
    try {
      calendar = await service['getCalendarClient']();
    } catch (authError: any) {
      return NextResponse.json({
        success: false,
        error: 'Google Calendar configuration missing.',
        details: authError.message,
      }, { status: 500 });
    }

    const calendarId = 'owendigitals@gmail.com';
    const startDate = new Date(date);
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + 1);

    const event = {
      summary: `🎯 Focus: ${task.title}`,
      description: `Task Priority: ${task.priority}\n\nScheduled via Owen Zen Dashboard.`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'Africa/Lagos',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'Africa/Lagos',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 10 },
          { method: 'email', minutes: 30 },
        ],
      },
    };

    const res = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    task.scheduledDate = startDate;
    task.googleEventId = res.data.id;
    await task.save();

    return NextResponse.json({ success: true, data: task, googleLink: res.data.htmlLink });
  } catch (error: any) {
    console.error('Calendar Sync Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
  }
}
```

Note: The `getCalendarClient()` method is private on the service. We need to make it public (or protected via a helper) so the sync route can reuse it. Update `GoogleCalendarService` to expose a public `getCalendar()` method:

- [ ] **Step 2: Update GoogleCalendarService — expose getCalendar() publicly**

In `src/lib/googleCalendar.ts`, add this public method to the class:

```typescript
async getCalendar() {
  return this.getCalendarClient();
}
```

Then update the sync route to call `service.getCalendar()` instead of accessing the private method:

```typescript
let calendar;
try {
  calendar = await service.getCalendar();
} catch (authError: any) {
  ...
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/googleCalendar.ts src/app/api/calendar/sync/route.ts
git commit -m "refactor(calendar): extract GoogleCalendarService, reuse in sync route"
```

---

## Task 4: Create EventsCenter component

**Files:**
- Create: `src/components/canvas/EventsCenter.tsx`
- Test: `src/components/canvas/EventsCenter.test.tsx` (if test patterns exist)

- [ ] **Step 1: Write the component**

```tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, RefreshCw, ExternalLink, ChevronRight, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  htmlLink: string;
  colorId?: string;
}

interface EventsResponse {
  success: boolean;
  data: {
    events: CalendarEvent[];
    lastSync: string;
    isIncremental: boolean;
  };
  error?: string;
}

function formatEventTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-2 animate-pulse">
      <div className="h-3 w-12 rounded bg-white/5" />
      <div className="h-3 flex-1 rounded bg-white/5" />
    </div>
  );
}

export function EventsCenter() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<EventsResponse>({
    queryKey: ['calendar-events'],
    queryFn: async () => {
      const res = await fetch('/api/calendar/events');
      return res.json();
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const events = data?.data?.events ?? [];
  const lastSync = data?.data?.lastSync;

  return (
    <div
      className="fixed top-4 right-4 z-50 w-72 flex flex-col rounded-2xl border backdrop-blur-md shadow-2xl overflow-hidden"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        maxHeight: 'calc(100vh - 80px)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <Calendar size={14} style={{ color: 'var(--primary)' }} />
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: 'var(--gray-400)' }}
          >
            Upcoming
          </span>
          {events.length > 0 && (
            <span
              className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold"
              style={{ background: 'var(--gray-800)', color: 'var(--gray-400)' }}
            >
              {events.length}
            </span>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
          className="p-1.5 rounded-lg transition-colors hover:bg-white/5 disabled:opacity-50"
          style={{ color: 'var(--gray-500)' }}
          title="Refresh events"
        >
          <RefreshCw
            size={14}
            className={isRefreshing ? 'animate-spin' : ''}
          />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ maxHeight: '300px' }}>
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 py-3 space-y-1"
            >
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </motion.div>
          )}

          {!isLoading && error && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 py-6 flex flex-col items-center gap-3 text-center"
            >
              <AlertCircle size={20} style={{ color: 'var(--color-error)' }} />
              <p className="text-xs" style={{ color: 'var(--gray-500)' }}>
                Could not load events
              </p>
              <button
                onClick={handleRefresh}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--gray-400)',
                }}
              >
                Retry
              </button>
            </motion.div>
          )}

          {!isLoading && !error && events.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 py-8 text-center"
            >
              <p className="text-sm" style={{ color: 'var(--gray-600)' }}>
                No upcoming events
              </p>
            </motion.div>
          )}

          {!isLoading && !error && events.length > 0 && (
            <motion.div
              key="events"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-2 py-2"
            >
              {events.slice(0, 5).map((event, i) => (
                <motion.button
                  key={event.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => window.open(event.htmlLink, '_blank')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all border border-transparent hover:border-border hover:bg-white/5 group"
                >
                  <span
                    className="text-xs font-mono font-semibold shrink-0 w-16"
                    style={{ color: 'var(--gray-500)' }}
                  >
                    {formatEventTime(event.start)}
                  </span>
                  <span
                    className="text-sm flex-1 truncate"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {event.title}
                  </span>
                  <ChevronRight
                    size={12}
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--gray-600)' }}
                  />
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {!isLoading && !error && events.length > 0 && (
        <div
          className="px-4 py-2.5 border-t text-center"
          style={{ borderColor: 'var(--border)' }}
        >
          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 text-xs font-medium transition-colors hover:text-primary"
            style={{ color: 'var(--gray-500)' }}
          >
            <ExternalLink size={11} />
            Open in Google Calendar
          </a>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/canvas/EventsCenter.tsx
git commit -m "feat(calendar): add EventsCenter canvas widget"
```

---

## Task 5: Integrate EventsCenter into ZCanvas

**File:** Modify `src/components/ZCanvas.tsx`

- [ ] **Step 1: Import and render EventsCenter**

Find where `BottomDock` is imported and rendered, and add `EventsCenter` alongside it:

```tsx
import BottomDock from './canvas/BottomDock';
import { EventsCenter } from './canvas/EventsCenter';
```

Find the JSX return in `CanvasInner` — add `<EventsCenter />` as a sibling inside the ReactFlow container (before the closing `</div>` of the canvas wrapper). The component is `position: fixed` so it renders outside normal flow but stays top-right of the viewport.

```tsx
{/* Canvas nodes, edges, controls */}

{/* Fixed overlay widgets */}
<EventsCenter />
<BottomDock onAddTaskNode={handleAddTaskNode} />
```

Exact location: after the `</div>` that closes the controls/overflow div but still inside the main canvas wrapper div. Reference the existing `BottomDock` placement in the file.

- [ ] **Step 2: Commit**

```bash
git add src/components/ZCanvas.tsx
git commit -m "feat(canvas): integrate EventsCenter into ZCanvas"
```

---

## Spec Coverage Check

| Spec section | Task |
|---|---|
| GoogleCalendarService singleton | Task 1 |
| Incremental sync token via localStorage | Task 1 |
| GET /api/calendar/events | Task 2 |
| EventsCenter minimal card, top-right, fixed | Task 4 |
| Loading/empty/error states | Task 4 |
| Manual refresh button | Task 4 |
| Click to open htmlLink | Task 4 |
| Open in Google Calendar footer link | Task 4 |
| ZCanvas integration | Task 5 |
| Refactor sync route to use service | Task 3 |

---

## Type Consistency Check

- `CalendarEvent` interface defined in `googleCalendar.ts` matches the shape returned by the API route
- `EventsResponse` in `EventsCenter.tsx` matches the API response shape
- `EventsCenter` default export is named (`export function EventsCenter`) not default — consistent with other named exports in the canvas components
