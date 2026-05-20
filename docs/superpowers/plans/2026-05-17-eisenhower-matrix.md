# Eisenhower Matrix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A new "Eisenhower Matrix" dashboard section where the user drags tasks from a pool into a 2x2 matrix (Do First / Schedule / Delegate / Eliminate). Tasks that are completed auto-move to a collapsed "Done" section.

**Architecture:** Extend the existing Task model with a `quadrant` field (`'q1'|'q2'|'q3'|'q4'|null`). The pool is tasks with `quadrant: null`. Quadrant updates go through the existing PUT `/api/tasks/[id]` endpoint. The Eisenhower Matrix view is a new client component using `@dnd-kit` for drag-and-drop.

**Tech Stack:** Next.js 16, @dnd-kit/core + @dnd-kit/sortable, Framer Motion, Tailwind CSS v4, Mongoose

---

## File Map

```
CREATED:
  src/components/EisenhowerMatrixView.tsx   # Main view
  src/components/EisenhowerMatrixView.module.css  # 2x2 grid styles

MODIFIED:
  src/models/Task.ts                      # Add quadrant field
  src/types/index.ts                      # Add quadrant to Task interface
  src/app/api/tasks/route.ts              # Add pool/quadrant GET filters + quadrant in PUT bulk
  src/app/api/tasks/[id]/route.ts         # Already handles body.quadrant (no changes needed)
  src/components/SectionsGrid.tsx         # Add "eisenhower" link to Planning section
  src/app/page.tsx                        # Add eisenhower case + import
```

---

## Task 1: Add `quadrant` field to Task model and types

**Files:**
- Modify: `src/models/Task.ts`
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add `quadrant` to Task model**

Find the end of the schema fields (before the closing `});`), add after `isBanked`:

```typescript
quadrant: {
  type: String,
  enum: ['q1', 'q2', 'q3', 'q4', null],
  default: null,
},
```

Add an index for efficient pool queries:

```typescript
// After the existing index
TaskSchema.index({ quadrant: 1 });
```

- [ ] **Step 2: Add `quadrant` to Task interface in types**

Add to the `Task` interface:

```typescript
quadrant?: 'q1' | 'q2' | 'q3' | 'q4' | null;
```

- [ ] **Step 3: Commit**

```bash
git add src/models/Task.ts src/types/index.ts
git commit -m "feat(tasks): add quadrant field for Eisenhower Matrix"
```

---

## Task 2: Update API — GET pool filter + PUT quadrant

**Files:**
- Modify: `src/app/api/tasks/route.ts`

- [ ] **Step 1: Add GET pool/quadrant filters**

Replace the GET handler with:

```typescript
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const boardId = searchParams.get('boardId');
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const quadrant = searchParams.get('quadrant');
    const pool = searchParams.get('pool');

    await dbConnect();

    let query: Record<string, any>;
    if (pool === 'true') {
      // Pool = tasks with no quadrant, not banked, not archived
      query = {
        quadrant: null,
        isBanked: { $ne: true },
        isArchived: { $ne: true },
      };
    } else if (quadrant) {
      query = { quadrant };
    } else if (projectId) {
      query = { projectId };
    } else if (boardId) {
      query = { boardId };
    } else if (status) {
      query = { status };
    } else {
      query = { $or: [{ boardId: null }, { boardId: { $exists: false } }] };
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 400 });
  }
}
```

- [ ] **Step 2: Add `quadrant` to batch PUT**

In the bulk `updateOne`, add `quadrant` to the `$set` object alongside the other fields:

```typescript
update: {
  $set: {
    order: task.order,
    status: task.status,
    priority: task.priority,
    title: task.title,
    isArchived: task.isArchived,
    completedAt: task.completedAt,
    isBanked: task.isBanked,
    quadrant: task.quadrant,  // ADD THIS LINE
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/tasks/route.ts
git commit -m "feat(tasks): add pool/quadrant filters and quadrant in bulk PUT"
```

---

## Task 3: Add navigation link

**Files:**
- Modify: `src/components/SectionsGrid.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Add "Eisenhower Matrix" to Planning section in SectionsGrid**

Add to the `Planning` section `links` array in `SectionsGrid.tsx`:

```typescript
{ id: "eisenhower", label: "Eisenhower Matrix", icon: Grid3x3 },
```

Import `Grid3x3` from `lucide-react` (add to existing import).

- [ ] **Step 2: Add import and route case in page.tsx**

Find the imports section of `page.tsx`, add:

```typescript
import { EisenhowerMatrixView } from "@/components/EisenhowerMatrixView";
```

Find the view switch block (around line 2865), add:

```typescript
{activeTab === "eisenhower" && <EisenhowerMatrixView tasks={tasks} />}
```

The `tasks` prop is already passed at that level in page.tsx.

- [ ] **Step 3: Commit**

```bash
git add src/components/SectionsGrid.tsx src/app/page.tsx
git commit -m "feat(nav): add Eisenhower Matrix to Planning section"
```

---

## Task 4: Create EisenhowerMatrixView component

**Files:**
- Create: `src/components/EisenhowerMatrixView.tsx`
- Create: `src/components/EisenhowerMatrixView.module.css`

- [ ] **Step 1: Create the component file**

Create `src/components/EisenhowerMatrixView.tsx`:

```typescript
"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { Grid3x3, ChevronDown, ChevronUp, Circle } from "lucide-react";
import { Task } from "@/types";
import { cn } from "@/lib/utils";
import { TaskCard } from "./TaskColumn";
import styles from "./EisenhowerMatrixView.module.css";

const QUADRANTS = [
  { id: "q1", label: "Do First", sublabel: "Urgent & Important", color: "red" },
  { id: "q2", label: "Schedule", sublabel: "Not Urgent & Important", color: "blue" },
  { id: "q3", label: "Delegate", sublabel: "Urgent & Not Important", color: "yellow" },
  { id: "q4", label: "Eliminate", sublabel: "Not Urgent & Not Important", color: "gray" },
] as const;

const QUADRANT_STYLES: Record<string, string> = {
  red: "border-red-500/30 bg-red-500/5",
  blue: "border-blue-500/30 bg-blue-500/5",
  yellow: "border-yellow-500/30 bg-yellow-500/5",
  gray: "border-gray-500/30 bg-gray-500/5",
};

export const EisenhowerMatrixView = ({ tasks }: { tasks: Task[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  // Pool: quadrant === null, not banked, not archived
  const poolTasks = tasks.filter(
    t => !t.quadrant && !t.isBanked && !t.isArchived && t.status !== "completed"
  );

  const completedTasks = tasks.filter(
    t => t.status === "completed" && !t.isArchived
  );

  const tasksByQuadrant = (quadrantId: string) =>
    tasks.filter(t => t.quadrant === quadrantId && !t.isArchived);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Determine new quadrant: 'pool' means null, otherwise 'q1'-'q4'
    let newQuadrant: "q1" | "q2" | "q3" | "q4" | null = null;
    if (overId === "pool") {
      newQuadrant = null;
    } else if (["q1", "q2", "q3", "q4"].includes(overId)) {
      newQuadrant = overId as "q1" | "q2" | "q3" | "q4";
    } else {
      // Dropped on a task card — find that task's quadrant
      const overTask = tasks.find(t => t._id === overId);
      if (overTask) newQuadrant = overTask.quadrant;
    }

    if (newQuadrant === undefined) return;

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quadrant: newQuadrant }),
      });
    } catch (e) {
      console.error("Failed to update task quadrant", e);
    }
  };

  const handleComplete = async (taskId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
    } catch (e) {
      console.error("Failed to complete task", e);
    }
  };

  const activeTask = tasks.find(t => t._id === activeId);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Grid3x3 size={22} className="text-primary" />
        <h1 className="text-2xl font-bold">Eisenhower Matrix</h1>
      </div>

      {/* Task Pool */}
      <PoolSection taskIds={poolTasks.map(t => t._id)} activeId={activeId} />

      {/* Matrix Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className={styles.matrix}>
          {QUADRANTS.map((q, index) => (
            <QuadrantCard
              key={q.id}
              id={q.id}
              label={q.label}
              sublabel={q.sublabel}
              color={q.color}
              tasks={tasksByQuadrant(q.id)}
              isRight={index % 2 === 0}
              isBottom={index >= 2}
              activeId={activeId}
              onComplete={handleComplete}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <motion.div
              initial={{ scale: 1, rotate: 0 }}
              animate={{ scale: 1.05, rotate: 2 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <TaskCard task={activeTask} isOverlay />
            </motion.div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Completed Section */}
      <CompletedSection
        tasks={completedTasks}
        isOpen={showCompleted}
        onToggle={() => setShowCompleted(v => !v)}
      />
    </div>
  );
}

function PoolSection({
  taskIds,
  activeId,
}: {
  taskIds: string[];
  activeId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "pool" });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex gap-3 overflow-x-auto pb-2 px-1 min-h-[80px] border rounded-xl transition-colors",
        isOver ? "border-primary/50 bg-primary/5" : "border-white/5 bg-surface/30"
      )}
    >
      <div className="flex items-center gap-2 shrink-0 text-xs text-gray-500 font-bold uppercase tracking-wider self-center px-2">
        Pool
        <span className="bg-surface px-2 py-0.5 rounded-full border border-white/10 text-gray-400">
          {taskIds.length}
        </span>
      </div>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        {taskIds.map(id => (
          <PoolTaskCard key={id} taskId={id} isDragging={activeId === id} />
        ))}
      </SortableContext>
      {taskIds.length === 0 && (
        <div className="flex items-center text-gray-600 text-sm italic self-center">
          Drag tasks here to categorize
        </div>
      )}
    </div>
  );
}

function PoolTaskCard({
  taskId,
  isDragging,
}: {
  taskId: string;
  isDragging: boolean;
}) {
  // We need task data but PoolSection only has IDs — we use a context or prop
  // For simplicity, render a placeholder that gets task from the parent
  // Actually we need task data. Let's use a simpler approach: PoolSection receives task objects
  return null; // TODO: replaced in full implementation
}
```

- [ ] **Step 2: Rewrite PoolSection to accept full task objects**

The pool needs full `Task` objects to render `TaskCard`. Update the `PoolSection` props:

```typescript
function PoolSection({
  tasks,
  activeId,
}: {
  tasks: Task[];
  activeId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "pool" });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex gap-3 overflow-x-auto pb-2 min-h-[80px] border rounded-xl transition-colors p-3",
        isOver ? "border-primary/50 bg-primary/5" : "border-white/5 bg-surface/30"
      )}
    >
      <div className="flex items-center gap-2 shrink-0 text-xs text-gray-500 font-bold uppercase tracking-wider self-center">
        Pool
        <span className="bg-surface px-2 py-0.5 rounded-full border border-white/10 text-gray-400">
          {tasks.length}
        </span>
      </div>
      <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
        {tasks.map(task => (
          <motion.div
            key={task._id}
            layout
            whileHover={{ scale: 1.02 }}
            className="shrink-0 w-48"
          >
            <TaskCard task={task} />
          </motion.div>
        ))}
      </SortableContext>
      {tasks.length === 0 && (
        <div className="flex items-center text-gray-600 text-sm italic self-center">
          Drag tasks here to categorize
        </div>
      )}
    </div>
  );
}
```

Update `EisenhowerMatrixView` to pass `poolTasks` instead of `taskIds`.

- [ ] **Step 3: Create QuadrantCard with useDroppable**

Add this component below `EisenhowerMatrixView`:

```typescript
function QuadrantCard({
  id,
  label,
  sublabel,
  color,
  tasks,
  isRight,
  isBottom,
  activeId,
  onComplete,
}: {
  id: string;
  label: string;
  sublabel: string;
  color: string;
  tasks: Task[];
  isRight: boolean;
  isBottom: boolean;
  activeId: string | null;
  onComplete: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "p-4 rounded-2xl border transition-colors min-h-[160px] flex flex-col gap-2",
        QUADRANT_STYLES[color],
        isOver && "ring-2 ring-primary/50"
      )}
    >
      <div className="mb-2">
        <div className="text-sm font-bold uppercase tracking-wider text-gray-400">{label}</div>
        <div className="text-xs text-gray-600">{sublabel}</div>
      </div>
      <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
        {tasks.map(task => (
          <motion.div key={task._id} layout whileHover={{ scale: 1.02 }} className="w-full">
            <TaskCard task={task} />
          </motion.div>
        ))}
      </SortableContext>
      {tasks.length === 0 && (
        <div className="flex items-center justify-center h-16 text-gray-700 text-sm italic border border-dashed border-white/10 rounded-xl">
          Drag tasks here
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create CompletedSection**

```typescript
function CompletedSection({
  tasks,
  isOpen,
  onToggle,
}: {
  tasks: Task[];
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-white/5 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2 text-gray-400">
          <Circle size={16} className="text-gray-600" fill="currentColor" />
          <span className="text-sm font-bold">Completed</span>
          <span className="text-xs bg-surface px-2 py-0.5 rounded-full border border-white/10 text-gray-500">
            {tasks.length}
          </span>
        </div>
        {isOpen ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-2">
              {tasks.map(task => (
                <div key={task._id} className="flex items-center gap-3 p-3 bg-surface/30 rounded-xl border border-white/5 opacity-60">
                  <Circle size={14} className="text-gray-600 shrink-0" fill="currentColor" />
                  <p className="text-sm text-gray-400 line-through">{task.title}</p>
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-sm text-gray-600 italic text-center py-4">No completed tasks</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 5: Create CSS module for the matrix grid**

Create `src/components/EisenhowerMatrixView.module.css`:

```css
.matrix {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 12px;
}

/* Cross dividers via border on appropriate sides */
.matrix > div:nth-child(1),
.matrix > div:nth-child(3) {
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.matrix > div:nth-child(1),
.matrix > div:nth-child(2) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/EisenhowerMatrixView.tsx src/components/EisenhowerMatrixView.module.css
git commit -m "feat: add EisenhowerMatrixView component with drag-and-drop"
```

---

## Task 5: Wire up pool refresh after drag

**Files:**
- Modify: `src/app/page.tsx`

The `EisenhowerMatrixView` needs to call a refresh callback after a drag so `tasks` prop stays in sync. Update the component signature to accept `onTaskUpdate` and trigger a re-fetch on drag end.

- [ ] **Step 1: Update EisenhowerMatrixView props**

Add `onTaskUpdate?: () => void` prop to `EisenhowerMatrixView`. After each PUT in `handleDragEnd` and `handleComplete`, call `onTaskUpdate()`.

- [ ] **Step 2: Pass refresh callback from page.tsx**

In page.tsx, add `onTaskUpdate={() => refetchTasks()}` where `EisenhowerMatrixView` is rendered. Note: if `refetchTasks` doesn't exist at that level, use a simpler pattern — the component can handle its own re-fetch via `useQuery` or a local state update.

- [ ] **Step 3: Commit**

```bash
git add src/components/EisenhowerMatrixView.tsx src/app/page.tsx
git commit -m "feat: wire task refresh after drag in EisenhowerMatrixView"
```

---

## Task 6: Self-review checklist

Run through the spec and verify:

1. **Spec coverage:** Each section in the spec has a corresponding task above.
2. **Placeholder scan:** No TBD/TODO entries remain.
3. **Type consistency:** `quadrant` field type (`'q1'|'q2'|'q3'|'q4'|null`) is consistent across model, types, and component.
4. **Pool filtering:** Pool correctly excludes `isBanked`, `isArchived`, and `status === 'completed'`.
5. **One home per task:** Pool tasks have `quadrant: null`, quadrant tasks have `quadrant: 'qN'`. Drag updates always set exactly one value.

---

## Plan Complete

**Files created:** 2 (`EisenhowerMatrixView.tsx`, `EisenhowerMatrixView.module.css`)
**Files modified:** 6 (`Task.ts`, `types/index.ts`, `tasks/route.ts`, `SectionsGrid.tsx`, `page.tsx`, `EisenhowerMatrixView.tsx`)

**Execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?