# Subtask Breakdown Feature

**Date:** 2026-05-23
**Status:** Approved
**Author:** Claude

## Overview

Add a title + description breakdown to each subtask on the task board. Subtasks expand inline when clicked to reveal a description textarea. Auto-expands when editing. The EditTaskModal shows the description field by default when adding new subtasks.

## Database Migration (Non-Breaking)

```typescript
// src/types/index.ts — SubTask interface
export interface SubTask {
    title: string;
    completed: boolean;
    description?: string; // NEW — optional, defaults to ""
}
```

```typescript
// src/models/Task.ts — Mongoose schema
subtasks: {
    type: [{
        title: String,
        completed: { type: Boolean, default: false },
        description: { type: String, default: "" } // NEW
    }],
    default: []
}
```

The migration is additive-only. Existing subtasks have `description: ""` by default. No breaking changes. API routes pass subtasks through via Mongoose's `findByIdAndUpdate` body passthrough — no route changes needed.

---

## Component Changes

### 1. TaskColumn.tsx — Expandable Subtask Rows

Each subtask row is clickable and expands inline to show the description textarea.

**State:** `expandedSubtaskId: string | null` — tracks which subtask index is expanded per task.

**Collapsed row:**
- Checkbox + title text + promote button (on hover)
- Full row is click target → expands

**Expanded row:**
- Below title: description textarea
- Auto-expands when textarea is focused
- Collapses on blur if description is empty; stays open if it has content
- Height auto-grows with textarea content

**Interaction behavior:**
| Action | Result |
|---|---|
| Click subtask row | Toggle expand/collapse |
| Focus description textarea | Auto-expand if collapsed |
| Blur description (empty) | Collapse |
| Blur description (has content) | Stay expanded |
| Toggle checkbox | Works as before |
| Promote button | Works as before |

### 2. EditTaskModal.tsx — Description on New Subtasks

Subtask rows in the modal gain an inline description input below the title. Always visible (not collapsed).

```tsx
// Per subtask row in EditTaskModal:
<input placeholder="Title" value={st.title} onChange={...} />
<input placeholder="Description (optional)" value={st.description || ""} onChange={...} />
```

### 3. Types and Schema

- `src/types/index.ts`: Add `description?: string` to `SubTask` interface
- `src/models/Task.ts`: Add `description: String` to subtask schema object

### 4. API Routes

No changes required. `PUT /api/tasks/[id]` and `PUT /api/tasks` both use `findByIdAndUpdate` and `findOneAndUpdate` which pass the full body through to Mongoose — the new `description` field flows through automatically.

---

## Implementation Notes

- The expand state (`expandedSubtaskId`) is tracked per-task in `TaskColumn`, not globally — multiple tasks can have their subtask expanded simultaneously
- The description textarea should use the same placeholder style as the main description field in EditTaskModal
- The "first 2 visible, +N more" behavior for collapsed subtasks remains unchanged — the expand toggle on "+N more" still opens the EditTaskModal