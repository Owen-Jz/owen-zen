# Task ↔ Mind Map Integration — Design Spec

## Overview

Add a **BottomDock** component to the mind map canvas that lets users move tasks between the focus board and the mind map bidirectionally.

- **Task Board → Mind Map:** Drag a task from the dock onto the canvas → creates a canvas node. Subtasks become sub-nodes. Task is deleted from the board.
- **Mind Map → Task Board:** Drag a canvas node onto the dock → creates a task in the "Mind Map" column. Canvas node is deleted.

---

## Component: BottomDock

**Location:** `src/components/canvas/BottomDock.tsx`

**Props:**
```typescript
interface BottomDockProps {
  onCreateNode: (task: Task, position: { x: number; y: number }) => void;
  onCreateTask: (nodeId: string, position: { x: number; y: number }) => void;
}
```

**State:**
- `collapsed: boolean` — dock collapsed vs expanded
- `dockTasks: Task[]` — tasks currently in "mind-map" status (loaded from API)

**Visual:**
- Fixed at bottom of viewport, full width
- Collapsed: ~40px — shows header bar with task count and expand toggle
- Expanded: ~80px — shows scrollable row of task pills
- Task pill: small card with title, subtask count badge, drag handle
- Drag-over state (for reverse direction): red highlight border

**Behavior:**

### Mode 1 — Staging (task → canvas node)
1. User drags task pill from dock onto the canvas
2. `onDragEnd` on pill fires, dispatching `canvas:addNode` with task data
3. `ZCanvas` creates a node at the drop position with:
   - `content` = task title
   - `subNodes` = task subtasks mapped to `{ id, content, color }`
   - position = drop coordinates
4. Task is deleted via `DELETE /api/tasks/:id`

### Mode 2 — Trash/reverse (canvas node → task)
1. User drags canvas node over the dock
2. Dock enters "drop target" mode — highlights red
3. User drops node on dock
4. `POST /api/tasks` creates a new task with title = node content, status = "mind-map"
5. Node is deleted from canvas via `DELETE /api/canvas/nodes/:id` (or via existing canvas delete mechanism)

---

## Data Flow

### Loading dock tasks
- `GET /api/tasks?status=mind-map` returns tasks with status "mind-map"
- These are NOT rendered in the TaskBoard's "Mind Map" column (they're in the dock instead)
- ZCanvas loads dock tasks on mount via React Query

### Creating a canvas node from task
- Task pill drag start sets `dataTransfer` with task ID
- On canvas drop: fetch task by ID, create canvas node with task data, delete task

### Creating a task from canvas node
- Node drag over dock → dock accepts drop via `onDragOver`
- On dock drop: `POST /api/tasks` with title from node content, status "mind-map"
- Dispatch `canvas:deleteNode` to remove node from canvas

---

## API Changes

### `GET /api/tasks/route.ts`
- Accept `?status=mind-map` query param to filter tasks

### `DELETE /api/tasks/[id]/route.ts`
- Already exists

### `POST /api/tasks/route.ts`
- Already exists; use for creating task from node

### Canvas nodes
- `POST /api/canvas/nodes` — create node (for future use)
- `DELETE /api/canvas/nodes/[id]` — delete node (for reverse direction)

---

## File Changes

| File | Change |
|------|--------|
| `src/components/canvas/BottomDock.tsx` | **New** — bottom dock component |
| `src/components/ZCanvas.tsx` | Import and render BottomDock; handle task→node creation |
| `src/app/api/tasks/route.ts` | Add `status` query filter |
| `src/app/api/canvas/nodes/route.ts` | Add DELETE endpoint for canvas nodes |

---

## Implementation Order

1. Add `status` filter to `GET /api/tasks`
2. Create `DELETE /api/canvas/nodes/[id]` endpoint
3. Build `BottomDock.tsx` component (props, state, pills, drag handling)
4. Wire BottomDock into `ZCanvas.tsx`
5. Implement task→node direction (drag from dock, create node, delete task)
6. Implement node→task direction (drag node to dock, create task, delete node)
