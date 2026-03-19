# Work Hours Tracker — Daily Work Track Mode

**Date:** 2026-03-19
**Status:** Approved

---

## Overview

Add a "Daily Work Track" mode to the existing `PomodoroWidget`. This mode functions as a stopwatch that accumulates work time across pause/resume sessions throughout the day. Once 4 hours of total work are accumulated, it automatically marks a configured "Deep Work" habit as complete for that day.

The two modes (Pomodoro and Daily Track) are completely independent. Pomodoro does NOT feed into the 4-hour accumulator.

---

## Design

### 1. Data Model

Extend `src/models/PomodoroState.ts` with a new `dailyTrack` sub-document:

```typescript
dailyTrack: {
  accumulatedSeconds: number,      // total seconds tracked today
  sessionHistory: [{
    startedAt: Date,
    endedAt: Date,
    duration: number               // seconds
  }],
  deepWorkHabitId: string | null, // which habit ID to auto-complete
  lastResetDate: string,           // "YYYY-MM-DD" — reset accumulator on new day
  autoCompleteTriggered: boolean   // true once 4hr hit today
}
```

### 2. API

**PUT `/api/pomodoro`**

Accepts `dailyTrack` updates alongside existing Pomodoro fields. On each pause/resume, the frontend sends updated `dailyTrack` state to be persisted.

### 3. UI — `PomodoroWidget`

**Mode Toggle**
- Toggle button at the top: "Pomodoro" | "Daily Track"
- Clicking while a session is active prompts confirmation ("Switch mode? Current session will be saved.")
- Active mode is persisted in state and saved to DB

**Daily Track Mode UI**
- Large stopwatch display (HH:MM:SS)
- Start / Pause / Resume button (no separate Stop — pausing is the "save" moment)
- Circular progress ring: fraction of 4 hours (e.g., 2h = 50%)
- When 4-hour threshold crossed:
  - Calls `POST /api/habits/[deepWorkHabitId]/complete`
  - Sets `autoCompleteTriggered = true`
  - Shows completion feedback (checkmark/toast)
- If already triggered: shows "Deep Work Complete ✓" badge replacing the progress ring

**Accumulation Logic**
- Each pause creates a `sessionHistory` entry with `startedAt`, `endedAt`, `duration`
- `accumulatedSeconds` increments by session duration
- Closing/refreshing the tab: on reload, if `lastResetDate === today`, restore `accumulatedSeconds` and resume ability to continue

**Daily Reset**
- On app load: if `lastResetDate !== today`, reset all dailyTrack fields to zero
- On mode switch into Daily Track: also check and reset if new day

**Pomodoro Mode**
- Unchanged from current implementation (25/5/15 min, sessions counter)

---

## Files to Modify

1. `src/models/PomodoroState.ts` — add `dailyTrack` schema
2. `src/app/api/pomodoro/route.ts` — handle `dailyTrack` in PUT
3. `src/components/PomodoroWidget.tsx` — add mode toggle + Daily Track UI

---

## Auto-Complete Trigger Logic

```
on each pause in Daily Track mode:
  if (accumulatedSeconds >= 14400 && !autoCompleteTriggered):
    POST /api/habits/{deepWorkHabitId}/complete
    set autoCompleteTriggered = true
    show completion feedback
```

---

## Out of Scope

- Pomodoro sessions contributing to 4-hour total (they do not)
- Configuring the deep work habit from the UI (hardcoded initially, can be added later)
- Multiple daily trackers or date range views
