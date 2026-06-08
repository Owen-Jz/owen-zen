# Streak Freeze Feature

**Date:** 2026-06-08
**Status:** Proposed
**Author:** ZEAL

---

## Problem Statement

Owen maintains strict habit streaks — jogging at 5 AM, gym sessions, journal entries — but life events (convocation, travel, illness) cause a missed day that breaks a weeks-long streak, discouraging continued discipline. The streak freeze lets a user protect one streak day per month so a single missed day does not erase weeks of consistency.

---

## User Story

**As a** habit tracker user
**I want to** freeze one missed day per month so my streak is not broken by a single gap
**So that** I stay motivated and keep showing up even when something unexpected happens

---

## Proposed Data Model

### Additive Only — No Breaking Changes

```typescript
// src/types/index.ts — Habit interface extension
streakFreeze: {
  count: number;       // freezes used this month, default 0
  lastUsed: Date | null; // timestamp of last freeze activation
};
```

```typescript
// src/models/Habit.ts — Mongoose schema addition
streakFreeze: {
  count: { type: Number, default: 0 },
  lastUsed: { type: Date, default: null },
},
```

**Rules:**
- `count` resets to `0` on the 1st of each month (calendar-month reset)
- A habit can only be frozen once — once `completedDates` has an entry for a given date, that date cannot be frozen
- Freezing applies to a specific date, not the habit as a whole — user selects which date to protect

---

## UI States

### 1. Freeze Badge (on habit card)

Shown on habits with `streakFreeze.count > 0`.

```
🔥 12 | ❄️ 1
```

- Snowflake icon + remaining freeze count
- Positioned alongside the streak counter
- Only visible when freezes remain

### 2. Freeze Button

Visible in the HabitDetail modal or habit row menu when:
- A day was missed (no completion for yesterday or today)
- `streakFreeze.count < 1` (freeze still available this month)

Button label: **"Freeze Missed Day"**
On click: prompts the user to confirm which date to freeze, then decrements the freeze count and preserves the streak as if that day was completed.

### 3. Freeze Limit Reached

When `streakFreeze.count >= 1` this month, the freeze button is hidden or disabled.

Text state: `No freezes remaining this month — back {1st}` with a countdown to the reset date.

---

## API Changes Needed

### `PUT /api/habits/[id]`

Accept a new body field to activate a freeze:

```json
{
  "activateFreeze": "2026-06-07"
}
```

When `activateFreeze` is present:
1. Verify the habit has `streakFreeze.count === 0`
2. Verify `completedDates` does not already contain the specified date
3. Verify the date is within the current calendar month
4. Set `streakFreeze.count = 1`, `streakFreeze.lastUsed = now`
5. Add the specified date to `completedDates` (so the streak calculation treats it as completed)

No changes to `GET /api/habits` or list endpoints — the freeze data is returned in the habit object as-is.

---

## Acceptance Criteria

| # | Criterion |
|---|---|
| 1 | Habit schema has `streakFreeze.count` (default 0) and `streakFreeze.lastUsed` (default null) |
| 2 | Freezing a day adds that date to `completedDates` and increments `streakFreeze.count` |
| 3 | Freeze button appears on habits when a day was missed and a freeze is still available |
| 4 | Freeze button is hidden/disabled when `streakFreeze.count >= 1` this month |
| 5 | Freeze count resets to 0 on the 1st of each month (not rolling 30 days) |
| 6 | `streakFreeze.lastUsed` is set to the timestamp when freeze is activated |
| 7 | A date that already has a completion entry cannot be frozen |
| 8 | Freezing does not affect the current streak count — it preserves it, never increments it |
| 9 | No breaking changes: existing habits without `streakFreeze` field behave identically |
| 10 | All API responses return `{ success, data?, error? }` consistent with existing pattern |