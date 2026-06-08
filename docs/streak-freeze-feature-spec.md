# Feature Spec: Streak Freeze — Protect Your Streak Without Breaking It

## PR Overview

> **Problem**: Owen loses his streak when he travels, gets sick, or has a genuinely off day. A broken streak is demoralizing and historically has triggered full habit collapse (the oscillation pattern). The fix is not motivation — it is a system that forgives the unavoidable without rewarding the avoidable.
>
> **Solution**: Add a **Streak Freeze** feature to daily habits. Owen can freeze 1–2 days per week, which pauses the streak countdown for those days without marking the habit as complete. The streak survives; the habit stays alive.

---

## 1. Problem Statement

- Owen's habit system uses a **consecutive-day streak** model (Habit.ts, streak field).
- The streak breaks when a day passes without a completion entry in `completedDates`.
- For a man who travels, gets sick, or has high-variance days, this is a structural problem — not a discipline problem.
- The convocation week collapse (May 30 – June 6, 2026) and the subsequent flatline pattern are symptoms of a system with no forgiveness valve.
- Owen needs a way to **intentionally skip days** without breaking the streak — not as a reward for laziness, but as a structural protection against the inevitable.

---

## 2. Proposed Solution

### Core Concept: Frozen Dates

Add a `frozenDates` array to the `Habit` model. Each frozen date is a YYYY-MM-DD string. When the streak calculation runs, any date in `frozenDates` is treated as if the habit was completed — the streak continues uninterrupted.

### Design Rules

| Rule | Value |
|------|-------|
| Max freezes per habit per rolling week | **2** |
| Freeze window | Current week (Sun–Sat, Lagos timezone) |
| Freeze granularity | 1 day = 1 freeze slot |
| Streak behavior during freeze | Streak counter does **not** advance, but does **not reset** |
| Frozen dates in heatmap | Shown with a **snowflake** indicator (❄️), distinct from ✅ completed |
| Telegram one-tap freeze | **No** — freeze requires intentional selection of the specific date |

### Why 2 per week?

- 1 freeze handles a sick day or a travel arrival day.
- 2 freezes handle a full travel day + recovery day.
- More than 2 enters "rewarding avoidance" territory. Owen's discipline is not the problem.

---

## 3. Data Model Change

### File: `src/models/Habit.ts`

```typescript
// Add to existing HabitSchema
frozenDates: {
  type: [Date], // Stored as full timestamps; compared as YYYY-MM-DD strings
  default: [],
},
```

### Streak Calculation Logic (update in `PUT /api/habits/[id]`)

When calculating the streak in the `toggle` action, the streak counter must:

1. Build the merged sorted list of `[...completedDates, ...frozenDates]`.
2. Deduplicate by YYYY-MM-DD string.
3. When iterating consecutive days, **skip frozen dates** for streak advancement but **do not break the chain** when a frozen date is encountered.
4. The frozen date itself does not increment the streak counter — it merely allows the chain to continue past it.

**Illustrative example**:
```
completedDates:  [June 1, June 2, June 5]
frozenDates:    [June 3]
streak:         June 1 (day 1) → June 2 (day 2) → [June 3 FROZEN - skip] → June 5 (day 3, chain unbroken)
Result: streak = 3
```

If June 3 is **not** frozen:
```
completedDates:  [June 1, June 2, June 5]
streak: June 1 → June 2 → [June 3 MISSING - chain broken]
Result: streak = 2
```

---

## 4. API Endpoints

### `POST /api/habits/[id]/freeze`

Freeze a specific date for a habit.

**Request body:**
```json
{
  "date": "2026-06-03"   // YYYY-MM-DD string
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "...",
    "streak": 3,
    "frozenDates": ["2026-06-03T00:00:00.000Z"],
    "completedDates": [...]
  }
}
```

**Error cases:**
- `400` — Date already frozen
- `400` — Weekly freeze limit (2) reached
- `400` — Date is in the future
- `404` — Habit not found

---

### `DELETE /api/habits/[id]/freeze`

Un-freeze (thaw) a specific date.

**Request body:**
```json
{
  "date": "2026-06-03"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { ...updated habit... }
}
```

**Error cases:**
- `400` — Date is not currently frozen
- `404` — Habit not found

---

### `GET /api/habits/[id]/freeze?token=SECRET` (optional future Telegram integration)

Returns HTML page confirming the freeze was applied. Same pattern as `complete/route.ts`.

---

## 5. UI Behavior

### Habit Card (HabitView.tsx)

Each habit card in the daily habits list gets a **❄️ Freeze** action in the `...` dropdown menu.

```
[Habit Card]
┌─────────────────────────────────────────────┐
│ 🔥 14  Morning Jog              [⋮] │
│     "Run before sunrise" │
│     [✅][✅][✅][✅][❄️][  ][  ]            │
└─────────────────────────────────────────────┘
 ↑ freezes shown in heatmap row
```

**Dropdown menu items:**
- ✅ Mark Complete Today
- ❄️ Freeze Today ← new
- ❄️ Freeze Yesterday      ← new (allows catching a missed day)
- 🗑️ Delete Habit

### Freeze Modal

When "Freeze Today" or "Freeze Yesterday" is clicked, a confirmation modal appears:

```
┌─────────────────────────────────────────────┐
│  ❄️  Freeze Streak? │
│                                             │
│  Your streak of 14 days will be protected. │
│  This does NOT mark the habit as complete.  │
│                                             │
│  Freezes remaining this week: 1 of 2 │
│                                             │
│  [ Cancel ] [ ❄️ Freeze Day ]      │
└─────────────────────────────────────────────┘
```

**Modal states:**
- **Default**: Show freezes remaining, confirm button enabled.
- **Limit reached**: Show "Weekly limit reached (2/2). Thaw a day to freeze another." Disable confirm.
- **Already frozen**: Show "This day is already frozen." Close modal.

### Heatmap Display

In the year grid heatmap (HabitView.tsx), frozen dates render with a distinct style:

| State | Color | Indicator |
|-------|-------|-----------|
| Completed | `#10b981` (green) | ✅ checkmark |
| Frozen | `#38bdf8` (ice blue) | ❄️ snowflake |
| Incomplete | `#1a1a1a` (dark) | empty |
| Future | `#0f0f0f` (darker) | empty, non-interactive |

Frozen dates in the heatmap are **not** clickable for toggle.

### Habit Detail Modal (HabitDetailModal.tsx)

Add a "Freeze" section in the detail modal showing:
- List of frozen dates (if any)
- "Thaw" button next to each frozen date
- Weekly freeze counter (X/2 remaining)

---

## 6. Wireframe Description

### Main Habit View (daily habits section)

```
┌──────────────────────────────────────────────────────────────────┐
│  Daily Habits          [+ Add Habit]           [Mark All Done]  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 🔥 14  Wake Up at Fixed Time                    [⋮] │  │
│  │        "6:00am, no snoozing" │  │
│  │  [S] [M] [T] [W] [T] [F] [S] │  │
│  │  [✅][✅][✅][✅][❄️][✅][  ]  ← this week's row │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 🔥 7   Move Your Body (Daily)                   [⋮]        │  │
│  │        "Gym or7k steps" │  │
│  │  [S] [M] [T] [W] [T] [F] [S]                               │  │
│  │  [✅][✅][✅][✅][✅][✅][  ]                              │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  [ Year Heatmap Grid — frozen dates shown in ice blue ❄️ ]      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Dropdown Menu

```
[⋮] menu on Wake Up at Fixed Time:
┌──────────────────────────┐
│ ✅ Mark Complete Today  │
│ ❄️ Freeze Today │  ← a habit with0 freezes left this week
│ ❄️ Freeze Yesterday     │     shows "Freeze Today (1 left)"
│ ──────────────────────  │
│ 🗑️ Delete Habit         │
└──────────────────────────┘
```

### Freeze Confirmation Modal

```
         ┌─────────────────────────────────┐
         │  ❄️  Freeze Streak?              │
         │                                  │
         │  "Wake Up at Fixed Time"         │
         │                                  │
         │  Your streak of 14 days will    │
         │  be protected through tomorrow. │
         │                                  │
         │  This does NOT mark the habit   │
         │  as complete.                   │
         │                                  │
         │  Freezes remaining: 1 of 2       │
         │  this week (Sun – Sat)           │
         │                                  │
         │  [ Cancel ] [ ❄️ Freeze ]     │
         └─────────────────────────────────┘
```

---

## 7. Implementation Phases

### Phase 1 — Data Model & API (backend-only)
- [ ] Add `frozenDates` field to `HabitSchema`
- [ ] Create `POST /api/habits/[id]/freeze` endpoint
- [ ] Create `DELETE /api/habits/[id]/freeze` endpoint
- [ ] Update streak calculation in `PUT /api/habits/[id]` to respect frozen dates
- [ ] Add unit tests for freeze/unfreeze and streak-through-freeze logic

### Phase 2 — UI (habit card + modal)
- [ ] Add ❄️ Freeze Today / Freeze Yesterday to habit card dropdown
- [ ] Build Freeze Confirmation Modal
- [ ] Show freeze count in dropdown (e.g. "Freeze Today (1 left)")
- [ ] Update Habit interface to include `frozenDates`

### Phase 3 — Heatmap + Detail Modal
- [ ] Render frozen dates in ice-blue ❄️ in year heatmap
- [ ] Make frozen heatmap cells non-interactive
- [ ] Add Freeze section to HabitDetailModal (list + thaw buttons)

### Phase 4 — Weekly Reset & Edge Cases
- [ ] Freeze counter resets every Sunday (Lagos timezone)
- [ ] Prevent freezing future dates
- [ ] Prevent freezing dates already in `completedDates`
- [ ] Telegram freeze confirmation page (GET endpoint, optional)

---

## 8. Open Questions for Owen

1. **Should frozen dates count toward the streak?** Proposed: No — frozen days are pauses, not completions. Streak only advances on actual completions. This keeps the integrity of the streak number.

2. **Should the freeze limit be per-habit or global?** Proposed: Per-habit. Some habits are easier to maintain while traveling (e.g. reading) while others are harder (e.g. gym). Owen should be able to freeze his gym habit without burning freezes on easier habits.

3. **Should there be a "freeze reason" field?** Nice-to-have. A short text field ("travel", "sick", "rest day") would help Owen review his patterns. Can be added in Phase 3.

4. **Should weekly habits (WeeklyHabit) also get freeze?** Separate decision. Weekly habits already have a different streak model (ISO week strings). Could be a follow-up PR.

---

## 9. Files to Create / Modify

| File | Action |
|------|--------|
| `src/models/Habit.ts` | Add `frozenDates` field |
| `src/app/api/habits/[id]/freeze/route.ts` | New — POST + DELETE freeze endpoints |
| `src/app/api/habits/[id]/route.ts` | Update streak calc to skip frozen dates |
| `src/components/HabitView.tsx` | Add freeze to dropdown, update heatmap |
| `src/components/habit/HabitDetailModal.tsx` | Add freeze section |
| `src/components/habit/FreezeModal.tsx` | New — freeze confirmation modal |
| `src/types/index.ts` | Add `frozenDates` to `Habit` type |
| `src/lib/__tests__/habitStreak.test.ts` | New — streak-through-freeze unit tests |

---

*Drafted by ZEAL while Owen sleeps. This spec is the starting point — Owen reviews, approves direction, and assigns to himself or a developer.*
