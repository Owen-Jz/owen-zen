# Daily Non-Negotiables Week Navigation — Design

## Problem

The daily habits section ("Daily Non-Negotiables") only shows the current week. Users cannot navigate to previous weeks to mark habits for days they missed.

## Solution

Add a single `<` arrow to navigate one week back from the current view. No forward navigation since future weeks aren't meaningful for daily tracking.

## Changes

### 1. Week State
- Add `displayedWeekOffset` state (number) — defaults to 0 (current week)
- `displayedWeekOffset = -1` means previous week, `-2` means two weeks back, etc.
- Week calculation derived from `displayedWeekOffset` applied to current week start

### 2. Week Label
- Show "Week of MMM D" (e.g., "Week of Mar 31") to clearly identify which week is displayed
- Calculate from current week's Monday + offset

### 3. Navigation Control
- Single `<` button next to section header (arrow pointing left)
- Button label/aria: "Previous week"
- Only rendered when `displayedWeekOffset < 0` (or always, but disabled at current week)
- Click increments `displayedWeekOffset` by -1

### 4. Habit Toggle Behavior
- No change — toggling records actual dates, so past week data is valid
- Streaks and analytics treat completions normally

## UI Layout

```
[Week of Mar 31]    Daily Non-Negotiables          < [button]
```

The week label is clickable too (resets to current week), or just the button — user's call.

## Files to Modify

- `src/components/HabitView.tsx` — add state, week calculation, navigation UI

## Out of Scope

- Forward navigation (future weeks)
- Multiple week lookback (only ±1 at a time via button)
- Read-only past weeks — completions are real and count normally