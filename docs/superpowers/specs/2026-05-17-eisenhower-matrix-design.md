# Eisenhower Matrix View — Design Spec
**Date:** 2026-05-17
**Status:** Approved by user

---

## 1. Concept & Vision

A tactile, visual Eisenhower Matrix for the Owen Zen dashboard that lets the user drag tasks from a "pool" into four quadrants, organizing work by urgency and importance. The matrix renders as a classic 2x2 grid divided by a visible cross — immediately recognizable as the Eisenhower framework. Tasks that are completed automatically collapse into a "Done" section, keeping the matrix clean.

---

## 2. Data Model

### Task Model Extension

```typescript
// Added to src/models/Task.ts
quadrant: {
  type: String,
  enum: ['q1', 'q2', 'q3', 'q4', null],
  default: null
}
```

**Quadrant mapping:**
- `q1` → "Do First" (Urgent + Important)
- `q2` → "Schedule" (Not Urgent + Important)
- `q3` → "Delegate" (Urgent + Not Important)
- `q4` → "Eliminate" (Not Urgent + Not Important)
- `null` → In the task pool (uncategorized)

**Pool definition:** Tasks with `quadrant: null` and `status !== 'completed'` and `isBanked !== true`

---

## 3. API Changes

### GET /api/tasks
Support new query params:
- `?quadrant=q1` — filter tasks by quadrant
- `?pool=true` — return tasks with `quadrant: null` (excluding banked)

### PUT /api/tasks
Accept `quadrant` in the update body alongside existing fields.

### PUT /api/tasks (batch)
Support `quadrant` in batch update payload.

---

## 4. UI Layout

```
┌─────────────────────────────────────────────┐
│  Task Pool (horizontal scroll) [count badge]│
├─────────────────┬──────────────────────────┤
│                 │                          │
│   DO FIRST      │      SCHEDULE            │
│   (Q1)          │      (Q2)                │
│                 │                          │
│   [task cards]  │      [task cards]        │
│                 │                          │
├─────────────────┼──────────────────────────┤
│                 │                          │
│   DELEGATE      │      ELIMINATE           │
│   (Q3)          │      (Q4)                │
│                 │                          │
│   [task cards]  │      [task cards]        │
│                 │                          │
└─────────────────┴──────────────────────────┘
│  Completed (collapsed by default)           │
└─────────────────────────────────────────────┘
```

- **Pool** — horizontal scrollable strip above the matrix. Shows all `quadrant: null` tasks.
- **Matrix** — 2x2 grid with a visible cross divider between all four quadrants.
- **Completed section** — collapsed section below the matrix for completed tasks.
- **Empty quadrants** — show placeholder text "Drag tasks here".

---

## 5. Interactions

| Action | Result |
|---|---|
| Drag task from pool → quadrant | Sets task `quadrant: 'qN'` via PUT API |
| Drag task between quadrants | Updates `quadrant` field via PUT API |
| Drag task from quadrant → pool | Sets `quadrant: null` via PUT API |
| Mark task complete (checkbox) | Status → `completed`, task grays out |
| Click task card | Opens `EditTaskModal` |
| Keyboard drag | Space to pick up, arrows to move, space to drop |
| Completed section toggle | Collapsed by default, click to expand/collapse |

---

## 6. Navigation

Add to `SectionsGrid.tsx` under the "Planning" section:

```typescript
{ id: "eisenhower", label: "Eisenhower Matrix", icon: Grid3x3 }
```

Handle the route in `src/app/page.tsx` by importing and rendering `EisenhowerMatrixView`.

---

## 7. Component Structure

```
src/components/
  EisenhowerMatrixView.tsx   # Main view component
  EisenhowerMatrixView.module.css  # 2x2 grid styles
  TaskPool.tsx               # Horizontal pool strip
  EisenhowerQuadrant.tsx    # Individual quadrant (droppable)
```

**Key dependencies:**
- `@dnd-kit/core` + `@dnd-kit/sortable` — drag and drop
- Framer Motion — animations
- Existing `TaskCard.tsx` — reused for task cards within quadrants
- Existing `EditTaskModal.tsx` — for editing task details

---

## 8. Technical Notes

- Uses `@dnd-kit` with `PointerSensor` + `KeyboardSensor`, same pattern as `TaskBoard.tsx` and `MITList.tsx`
- Quadrant updates are optimistic — update local state immediately, then sync to API
- Pool queries `GET /api/tasks?pool=true` on mount and after each drop
- If dragging a task already in a quadrant, the quadrant drop zone accepts it and updates via PUT
- Tasks in the pool are NOT draggable to other places in the pool (only to quadrants) — they must first be placed in a quadrant to re-order