# Task Bank Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Task Bank tab — move tasks there via dropdown, restore to Backlog or delete permanently from the bank.

**Architecture:** Add `isBanked` boolean to Task model/interface. New top-level Task Bank view with bulk restore/delete. Dropdown menu in TaskColumn gets "Move to Bank" action.

**Tech Stack:** Next.js App Router, Mongoose, React state, Framer Motion, Tailwind CSS.

---

## Task 1: Add `isBanked` to TypeScript interface

**Files:**
- Modify: `src/types/index.ts:28-51`

- [ ] **Step 1: Add `isBanked?: boolean` to Task interface**

In `src/types/index.ts`, find the `Task` interface (around line 28) and add `isBanked?: boolean;` after `completedAt?: string;`:

```typescript
export interface Task {
    _id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    createdAt: string;
    order: number;
    isArchived?: boolean;
    isBanked?: boolean;        // <-- ADD THIS
    subtasks?: SubTask[];
    // ... rest unchanged
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(tasks): add isBanked field to Task interface"
```

---

## Task 2: Add `isBanked` to Mongoose schema

**Files:**
- Modify: `src/models/Task.ts:1-86`

- [ ] **Step 1: Add `isBanked` field to TaskSchema**

In `src/models/Task.ts`, add `isBanked` after `completedAt` in the schema (around line 83):

```typescript
completedAt: { type: Date },
isBanked: {
  type: Boolean,
  default: false,
},
```

Also add an index for fast bank queries. After the schema fields and before the model export, add:

```typescript
// Index for Task Bank queries
TaskSchema.index({ isBanked: 1 });
```

The file should end like:

```typescript
  isMIT: { type: Boolean, default: false },
  mitDate: { type: Date }, // To track which day it was assigned as MIT
  overdueNotified: { type: Boolean, default: false },
  completedAt: { type: Date },
  isBanked: {
    type: Boolean,
    default: false,
  }
});

// Index for Task Bank queries
TaskSchema.index({ isBanked: 1 });

export default mongoose.models.Task || mongoose.model('Task', TaskSchema);
```

- [ ] **Step 2: Commit**

```bash
git add src/models/Task.ts
git commit -m "feat(tasks): add isBanked field and index to Task schema"
```

---

## Task 3: Add `isBanked` to batch PUT API

**Files:**
- Modify: `src/app/api/tasks/route.ts:58-103`

- [ ] **Step 1: Add `isBanked` to bulk update allowed fields**

In `src/app/api/tasks/route.ts`, in the `bulkOps` update inside the PUT handler, add `isBanked` to the `$set` object (around line 84-91):

```typescript
const bulkOps = tasks.map((task: any) => ({
  updateOne: {
    filter: { _id: task._id },
    update: {
      $set: {
        order: task.order,
        status: task.status,
        priority: task.priority,
        title: task.title,
        isArchived: task.isArchived,
        completedAt: task.completedAt,
        isBanked: task.isBanked,   // <-- ADD THIS
      }
    }
  }
}));
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/tasks/route.ts
git commit -m "feat(api): support isBanked in batch task updates"
```

---

## Task 4: Add "Move to Bank" to task dropdown

**Files:**
- Modify: `src/components/TaskColumn.tsx:195-253`

- [ ] **Step 1: Import Bank icon**

In the imports from `lucide-react` at the top of `TaskColumn.tsx`, add `Bank`:

```typescript
import { GripVertical, MoreVertical, Edit2, Circle, Clock, Check, Archive, Trash2, Pin, Play, Pause, Timer, Maximize2, CalendarDays, ArrowUpToLine, Sparkles, Plus, Bank } from "lucide-react";
```

- [ ] **Step 2: Add `onBank` prop to TaskCard props**

In the TaskCard props (around line 42), add:

```typescript
onBank?: (id: string) => void;
```

- [ ] **Step 3: Pass `onBank` through to SortableTaskItem**

In the `SortableTaskItem` component props (around line 442), add:

```typescript
onBank: (id: string) => void;
```

Then in the `TaskCard` call inside `SortableTaskItem` (around line 464), pass `onBank`.

- [ ] **Step 4: Add `onBank` to TaskColumn props**

In the `TaskColumn` props (around line 487), add:

```typescript
onBank: (id: string) => void,
```

- [ ] **Step 5: Pass `onBank` to SortableTaskItem in TaskColumn**

In the `SortableTaskItem` call inside `TaskColumn` (around line 551), pass `onBank={onBank}`.

- [ ] **Step 6: Add "Move to Bank" dropdown item to TaskCard**

In the `DropdownMenuContent` inside `TaskCard` (around line 201), add after the existing items. Find the separator after the "Mind Map" item and before the "Archive" item, and add:

```typescript
<DropdownMenuItem onClick={() => onBank?.(task._id)} className="cursor-pointer">
  <Bank size={14} className="mr-2" /> Move to Bank
</DropdownMenuItem>
<DropdownMenuSeparator />
```

This goes after the status change items (after "Mind Map") and before the `{task.status === "completed" && (` archive block.

- [ ] **Step 7: Commit**

```bash
git add src/components/TaskColumn.tsx
git commit -m "feat(tasks): add Move to Bank dropdown action"
```

---

## Task 5: Create TaskBankView component

**Files:**
- Create: `src/components/TaskBankView.tsx`

- [ ] **Step 1: Write TaskBankView component**

Create `src/components/TaskBankView.tsx`:

```typescript
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Bank, RotateCcw, Trash2, CheckSquare, Square } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Task } from "@/types";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const priorityColors = {
  high: "border-l-4 border-red-500",
  medium: "border-l-4 border-yellow-500",
  low: "border-l-4 border-blue-500"
};

const priorityBg = {
  high: "bg-red-500/10 text-red-400",
  medium: "bg-yellow-500/10 text-yellow-400",
  low: "bg-blue-500/10 text-blue-400"
};

export const TaskBankView = ({
  tasks,
  onRestore,
  onDelete
}: {
  tasks: Task[];
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);

  const bankedTasks = tasks.filter(t => t.isBanked && t.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSelect = (id: string, selected: boolean) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (selected) newSet.add(id);
      else newSet.delete(id);
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedTasks(new Set(bankedTasks.map(t => t._id)));
  };

  const handleClearSelection = () => {
    setSelectedTasks(new Set());
  };

  const handleBulkRestore = () => {
    selectedTasks.forEach(id => onRestore(id));
    setSelectedTasks(new Set());
  };

  const handleBulkDelete = () => {
    selectedTasks.forEach(id => onDelete(id));
    setSelectedTasks(new Set());
    setConfirmDelete(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-400">
          <Bank size={20} className="text-primary" />
          Task Bank
          <span className="text-xs font-mono bg-surface px-2 py-0.5 rounded-full border border-white/10">
            {bankedTasks.length}
          </span>
        </h2>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search bank..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-hover border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        </div>
      </div>

      {/* Bulk Actions */}
      <AnimatePresence>
        {selectedTasks.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between bg-surface/80 border border-primary/30 rounded-xl p-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-primary">{selectedTasks.size} selected</span>
              <button onClick={handleClearSelection} className="text-gray-500 hover:text-white p-1">
                <X size={16} />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleBulkRestore}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg transition-colors"
              >
                <RotateCcw size={14} /> Restore to Backlog
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Delete Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setConfirmDelete(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface border border-border w-full max-w-sm rounded-2xl p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-2">Delete {selectedTasks.size} task{selectedTasks.size > 1 ? "s" : ""}?</h3>
              <p className="text-sm text-gray-400 mb-6">This is permanent. Tasks will be deleted from the bank and cannot be recovered.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border text-gray-400 hover:bg-white/5 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors font-bold"
                >
                  Delete Permanently
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task List */}
      {bankedTasks.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <Bank size={40} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-500 font-medium">No tasks in the bank</p>
          <p className="text-sm text-gray-600 mt-1">Move tasks here when they're not relevant right now</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bankedTasks.length > 0 && selectedTasks.size === 0 && (
            <div className="flex justify-end mb-2">
              <button
                onClick={handleSelectAll}
                className="text-xs text-gray-500 hover:text-white transition-colors"
              >
                Select All ({bankedTasks.length})
              </button>
            </div>
          )}
          {bankedTasks.map(task => (
            <motion.div
              key={task._id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex items-center gap-4 p-4 bg-surface/40 border border-white/5 rounded-2xl hover:bg-surface/60 transition-all group",
                priorityColors[task.priority],
                selectedTasks.has(task._id) && "border-primary/50 bg-primary/5"
              )}
            >
              {/* Selection */}
              <button
                onClick={() => handleSelect(task._id, !selectedTasks.has(task._id))}
                className={cn(
                  "shrink-0 p-1 rounded transition-colors",
                  selectedTasks.has(task._id) ? "text-primary" : "text-gray-600 hover:text-gray-400"
                )}
              >
                {selectedTasks.has(task._id) ? <CheckSquare size={18} /> : <Square size={18} />}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "text-sm font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                    priorityBg[task.priority]
                  )}>
                    {task.priority}
                  </span>
                </div>
                <p className="text-gray-200 font-medium truncate">{task.title}</p>
                {task.subtasks && task.subtasks.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtasks
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => { onRestore(task._id); handleSelect(task._id, false); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  title="Restore to Backlog"
                >
                  <RotateCcw size={14} /> Restore
                </button>
                <button
                  onClick={() => { onDelete(task._id); handleSelect(task._id, false); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Delete permanently"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TaskBankView.tsx
git commit -m "feat(tasks): add TaskBankView component"
```

---

## Task 6: Wire up Task Bank in page.tsx

**Files:**
- Modify: `src/app/page.tsx` (approximately at line 1265, 2340, 2783)

You need to:
1. Find `activeTab` state declaration and add `"taskbank"` to the tab union type
2. Add `bankTask` and `unbankTask` handler functions (similar to `archiveTask` / `restoreTask`)
3. Add the `TaskBankView` import
4. Add the TaskBank tab button to the tab bar (between "Tasks" and "Archive")
5. Add the TaskBankView render block (conditional on `activeTab === "taskbank"`)
6. Pass `onBank={bankTask}` to TaskBoard

Find where `archiveTask` and `restoreTask` are defined and add parallel handlers:

```typescript
const bankTask = async (id: string) => {
  await fetch(`/api/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isBanked: true, status: "pending" }),
  });
  setTasks(tasks.map(t => t._id === id ? { ...t, isBanked: true } : t));
};

const unbankTask = async (id: string) => {
  await fetch(`/api/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isBanked: false, status: "pending" }),
  });
  setTasks(tasks.map(t => t._id === id ? { ...t, isBanked: false } : t));
};
```

In the TaskBoard props, add `onBank={bankTask}`.

In the tab bar, find the Archive tab button and add a Task Bank tab button before it:

```tsx
<button
  onClick={() => setActiveTab("taskbank")}
  className={cn(
    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
    activeTab === "taskbank"
      ? "bg-primary/20 text-primary border border-primary/40"
      : "text-gray-400 hover:text-white hover:bg-white/5"
  )}
>
  <Bank size={16} />
  Task Bank
  {tasks.filter(t => t.isBanked).length > 0 && (
    <span className="bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-full font-mono">
      {tasks.filter(t => t.isBanked).length}
    </span>
  )}
</button>
```

Add to imports from lucide-react: `Bank`

Add to the `activeTab === "taskbank"` conditional render:

```tsx
{activeTab === "taskbank" && (
  <TaskBankView
    tasks={tasks}
    onRestore={unbankTask}
    onDelete={deleteTask}
  />
)}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(tasks): wire up Task Bank tab and handlers"
```

---

## Task 7: Final verification

- [ ] **Step 1: Review the spec against the implementation**

Check `docs/superpowers/specs/2026-05-08-task-bank-design.md` and verify:
1. `isBanked` field added to Task interface ✓
2. `isBanked` field added to Mongoose schema with index ✓
3. API supports `isBanked` in PUT ✓
4. "Move to Bank" dropdown item added ✓
5. TaskBankView component created ✓
6. New top-level Task Bank tab in page.tsx ✓
7. Restore to Backlog flow wired up ✓
8. Delete from bank wired up ✓

- [ ] **Step 2: Push commits**

```bash
git push origin main
```

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-08-task-bank-plan.md`. Two execution options:**

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?