# EditTaskModal Quadrant Selector — 2026-05-21

## Problem

The `EditTaskModal` (used when editing an existing task) lacks an Eisenhower quadrant selector. Users can assign a quadrant when creating a new task via `AddTaskModal`, and can drag tasks to quadrants on the Eisenhower board, but cannot edit the quadrant from the task's edit modal. This is a gap in the editing experience.

## Solution

Add a quadrant selector to `EditTaskModal`'s sidebar properties panel, mirroring the one already in `AddTaskModal`.

## Changes

### File: `src/components/EditTaskModal.tsx`

**Imports:** No new imports needed — `Grid3x3` is already imported (line 3).

**State:** Add `quadrant` state variable initialized from `task?.quadrant ?? null`.

**Props interface update:** `onSave` signature needs to accept `quadrant`:
```ts
// Before
onSave: (id: string, title: string, description: string, priority: TaskPriority, subtasks: SubTask[], dueDate?: string, category?: string) => void;

// After
onSave: (id: string, title: string, description: string, priority: TaskPriority, subtasks: SubTask[], dueDate?: string, category?: string, quadrant?: "q1" | "q2" | "q3" | "q4" | null) => void;
```

**UI:** Add a "Eisenhower Quadrant" section to the sidebar properties panel (after MIT Toggle), identical in structure to the quadrant selector in `AddTaskModal` (lines 246-277):

```tsx
{/* Quadrant Selector */}
<div>
  <label className="text-xs uppercase text-gray-500 font-bold mb-3 block">Eisenhower Quadrant</label>
  <div className="grid grid-cols-2 gap-2">
    {([
      { id: "q1", label: "Do First", color: "red" },
      { id: "q2", label: "Schedule", color: "blue" },
      { id: "q3", label: "Delegate", color: "yellow" },
      { id: "q4", label: "Eliminate", color: "gray" },
    ] as const).map((q) => (
      <button
        type="button"
        key={q.id}
        onClick={() => setQuadrant(quadrant === q.id ? null : q.id)}
        className={cn(
          "px-2 py-2 rounded-lg text-xs font-bold border transition-all flex flex-col items-center gap-1",
          quadrant === q.id
            ? q.color === 'red' ? "bg-red-500/20 border-red-500 text-red-500" :
              q.color === 'blue' ? "bg-blue-500/20 border-blue-500 text-blue-500" :
              q.color === 'yellow' ? "bg-yellow-500/20 border-yellow-500 text-yellow-500" :
              "bg-gray-500/20 border-gray-500 text-gray-400"
            : "border-white/5 bg-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10"
        )}
      >
        <div className={cn("w-2 h-2 rounded-full",
          q.color === 'red' ? "bg-red-500" : q.color === 'blue' ? "bg-blue-500" : q.color === 'yellow' ? "bg-yellow-500" : "bg-gray-500"
        )} />
        {q.label}
      </button>
    ))}
  </div>
</div>
```

**HandleSave:** Pass `quadrant` to `onSave`:
```ts
onSave(task._id, title, description, priority, subtasks, dueDate || undefined, category, quadrant);
```

**Callers of onSave:** Find and update all `onSave` implementations to accept the new `quadrant` parameter (likely a no-op if they ignore the extra arg, but needs verification).

## Verification

1. Open a task's edit modal — verify the quadrant section appears in the sidebar
2. Select a quadrant and save — verify the task's quadrant is persisted
3. Reopen the same task — verify the previously selected quadrant is pre-selected
4. Verify clicking the same quadrant again deselects it (toggles to null)