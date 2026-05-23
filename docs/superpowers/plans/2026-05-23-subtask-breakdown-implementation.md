# Subtask Breakdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a title + description breakdown to each subtask on the task board. Subtasks expand inline when clicked to reveal a description textarea. Auto-expands when editing. EditTaskModal shows description field by default when adding new subtasks.

**Architecture:** Additive-only migration. `description` field added as optional string to `SubTask` interface and Mongoose subtask schema. No API changes — existing PUT endpoints pass subtasks through via Mongoose body passthrough. Expand state tracked per-task in `TaskColumn` via `expandedSubtaskId` state variable.

**Tech Stack:** React useState for expand tracking, inline textarea for description input, existing TaskCard/TaskColumn component patterns.

---

### Task 1: Update SubTask Type

**Files:**
- Modify: `src/types/index.ts:4-7`

- [ ] **Step 1: Add description field to SubTask interface**

```typescript
export interface SubTask {
    title: string;
    completed: boolean;
    description?: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts && git commit -m "feat: add description field to SubTask interface"
```

---

### Task 2: Update Task Model Schema

**Files:**
- Modify: `src/models/Task.ts:50-56`

- [ ] **Step 1: Add description to subtask schema**

Find the subtasks field in TaskSchema (around line 50):
```typescript
subtasks: {
    type: [{
        title: String,
        completed: { type: Boolean, default: false },
        description: { type: String, default: "" }  // ADD THIS LINE
    }],
    default: []
},
```

- [ ] **Step 2: Commit**

```bash
git add src/models/Task.ts && git commit -m "feat: add description field to Task subtask schema"
```

---

### Task 3: Add Expandable Subtask Rows to TaskColumn

**Files:**
- Modify: `src/components/TaskColumn.tsx:400-450`

**Files to read first:**
- `src/components/TaskColumn.tsx:260-340` — SortableTaskItem function to understand how task card is rendered
- `src/components/TaskColumn.tsx:400-450` — existing subtask section

- [ ] **Step 1: Add expandedSubtaskId state to SortableTaskItem**

In the `SortableTaskItem` function, add state to track which subtask index is expanded:

```typescript
const [expandedSubtaskId, setExpandedSubtaskId] = useState<number | null>(null);
```

- [ ] **Step 2: Replace subtask list rendering with expandable version**

The existing subtask rendering (around line 400-450) currently shows `task.subtasks.slice(0, 2).map((st, i) => ...)` with a "+N more" button. Replace that block with:

1. A `handleSubtaskExpand` function that toggles the expanded index
2. An auto-expand on focus behavior
3. An expanded row showing the description textarea below the title

```tsx
{task.subtasks && task.subtasks.length > 0 && (
  <div className="mb-4 space-y-2.5">
    {/* Progress Bar */}
    <div className="flex items-center gap-3">
      <div className="relative flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full relative",
            (task.subtasks.filter(s => s.completed).length / task.subtasks.length) === 1
              ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              : "bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.4)]"
          )}
        />
      </div>
      <span className={cn(
        "text-[10px] font-mono font-bold tracking-wider tabular-nums",
        (task.subtasks.filter(s => s.completed).length / task.subtasks.length) === 1
          ? "text-emerald-400" : "text-gray-500"
      )}>
        {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
      </span>
    </div>

    {/* Subtask List */}
    <div className="space-y-1">
      {task.subtasks.slice(0, 2).map((st, i) => {
        const isExpanded = expandedSubtaskId === i;
        return (
          <div key={i} className="group/sub">
            <div
              onClick={(e) => {
                e.stopPropagation();
                // Toggle expand on row click (not on checkbox or buttons)
                if (isExpanded) {
                  setExpandedSubtaskId(null);
                } else {
                  setExpandedSubtaskId(i);
                }
              }}
              className="flex items-start gap-2.5 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors"
            >
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (onToggleSubtask) onToggleSubtask(task._id, i);
                }}
                className={cn(
                  "w-5 h-5 mt-0.5 rounded-md border flex items-center justify-center transition-all shrink-0 cursor-pointer",
                  st.completed ? "bg-primary border-primary shadow-[0_0_8px_rgba(var(--primary),0.4)]" : "border-gray-600 group-hover/sub:border-primary/50 bg-black/20"
                )}>
                {st.completed && <Check size={12} className="text-white" />}
              </div>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  if (isExpanded) {
                    setExpandedSubtaskId(null);
                  } else {
                    setExpandedSubtaskId(i);
                  }
                }}
                className={cn(
                  "text-xs leading-relaxed font-medium transition-colors flex-1 whitespace-normal break-words",
                  st.completed ? "text-gray-500 line-through" : "text-gray-300"
                )}>
                {st.title}
              </span>
              {onPromoteSubtask && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPromoteSubtask(task._id, i);
                }}
                className="opacity-0 group-hover/sub:opacity-100 p-1 hover:bg-white/10 rounded transition-all text-gray-500 hover:text-primary"
                title="Promote to main task"
              >
                <ArrowUpToLine size={12} />
              </button>
              )}
            </div>

            {/* Expanded description area */}
            {isExpanded && (
              <div className="ml-7 pr-2 mb-1">
                <textarea
                  value={st.description || ""}
                  onChange={(e) => {
                    if (onUpdateSubtaskDescription) {
                      onUpdateSubtaskDescription(task._id, i, e.target.value);
                    }
                  }}
                  onFocus={() => setExpandedSubtaskId(i)}
                  placeholder="Add a description..."
                  className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-xs text-gray-300 placeholder-gray-600 outline-none focus:border-primary/50 resize-none min-h-[60px] leading-relaxed"
                  rows={2}
                />
              </div>
            )}
          </div>
        );
      })}
      {task.subtasks.length > 2 && (
        <button
          onClick={() => onEdit && onEdit(task)}
          className="text-[10px] text-gray-500 font-bold uppercase hover:text-primary ml-6 mt-1 transition-colors tracking-wide"
        >
          +{task.subtasks.length - 2} more
        </button>
      )}
    </div>
  </div>
)}
```

- [ ] **Step 3: Add `onUpdateSubtaskDescription` prop to SortableTaskItem**

Add to the props interface and pass it through to TaskCard:
```typescript
onUpdateSubtaskDescription?: (taskId: string, subtaskIndex: number, description: string) => void;
```

- [ ] **Step 4: Add onUpdateSubtaskDescription to TaskColumn interface**

Add to TaskColumn props and pass it to SortableTaskItem.

- [ ] **Step 5: Commit**

```bash
git add src/components/TaskColumn.tsx && git commit -m "feat: add expandable subtask description rows to TaskColumn"
```

---

### Task 4: Add Description Input to EditTaskModal

**Files:**
- Modify: `src/components/EditTaskModal.tsx:208-265`

**Files to read first:**
- `src/components/EditTaskModal.tsx:44` — subtasks state
- `src/components/EditTaskModal.tsx:66-95` — addSubtask, toggleSubtask, removeSubtask, move functions
- `src/components/EditTaskModal.tsx:208-265` — existing subtask rows in the modal

- [ ] **Step 1: Update addSubtask to include empty description**

```typescript
const addSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    setSubtasks([...subtasks, { title: newSubtask, completed: false, description: "" }]);
    setNewSubtask("");
};
```

- [ ] **Step 2: Replace subtask row rendering in EditTaskModal**

Find the subtask row map (around line 208-265) and replace each row to include a description input below the title input:

```tsx
<div key={i} className="flex flex-col gap-2 group bg-surface hover:bg-surface-hover p-3 rounded-xl border border-border transition-all">
    <div className="flex items-center gap-3">
        <button
            onClick={() => toggleSubtask(i)}
            className={cn(
                "w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0",
                st.completed ? "bg-primary border-primary text-white" : "border-gray-600 hover:border-primary/50"
            )}
        >
            {st.completed && <Check size={12} />}
        </button>
        <input
            type="text"
            value={st.title}
            onChange={(e) => {
                const updated = [...subtasks];
                updated[i].title = e.target.value;
                setSubtasks(updated);
            }}
            className={cn(
                "flex-1 bg-transparent outline-none border-none text-sm focus:ring-0 p-0 whitespace-normal break-words",
                st.completed && "text-gray-500 line-through decoration-gray-600"
            )}
        />
        {onPromoteSubtask && (
            <button
                onClick={(e) => {
                    e.preventDefault();
                    onPromoteSubtask(task._id, i);
                    setSubtasks(subtasks.filter((_, idx) => idx !== i));
                }}
                className="text-gray-500 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1"
                title="Promote to main task"
            >
                <ArrowUpToLine size={14} />
            </button>
        )}
        <button
            onClick={() => moveSubtaskUp(i)}
            className="text-gray-500 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1"
            title="Move up"
            disabled={i === 0}
        >
            <ArrowUp size={14} />
        </button>
        <button
            onClick={() => moveSubtaskDown(i)}
            className="text-gray-500 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1"
            title="Move down"
            disabled={i === subtasks.length - 1}
        >
            <ArrowDown size={14} />
        </button>
        <button onClick={() => removeSubtask(i)} className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
            <Trash2 size={14} />
        </button>
    </div>
    {/* Description input — visible by default */}
    <div className="ml-7">
        <input
            type="text"
            value={st.description || ""}
            onChange={(e) => {
                const updated = [...subtasks];
                updated[i].description = e.target.value;
                setSubtasks(updated);
            }}
            placeholder="Description (optional)"
            className="w-full bg-transparent/50 outline-none border-none text-xs text-gray-400 placeholder-gray-600 focus:ring-0 p-0 leading-relaxed"
        />
    </div>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/EditTaskModal.tsx && git commit -m "feat: add description input to EditTaskModal subtask rows"
```

---

### Task 5: Wire onUpdateSubtaskDescription through page.tsx

**Files:**
- Modify: `src/app/page.tsx` — find the SortableTaskItem → TaskColumn → page.tsx chain
- Create: `src/app/api/tasks/[id]/route.ts` — No changes needed (batch API handles it)

**Files to read first:**
- `src/app/page.tsx` — find `updateTaskStatus` and similar handlers to follow the pattern

- [ ] **Step 1: Find or create the onUpdateSubtaskDescription handler in page.tsx**

Search for where other subtask handlers are defined. Look for `toggleTaskSubtask` and add nearby:

```typescript
const updateSubtaskDescription = async (taskId: string, subtaskIndex: number, description: string) => {
    const task = tasks.find(t => t._id === taskId);
    if (!task) return;

    const updatedSubtasks = task.subtasks?.map((st, i) =>
        i === subtaskIndex ? { ...st, description } : st
    ) || [];

    try {
        const res = await fetch(`/api/tasks/${taskId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subtasks: updatedSubtasks }),
        });
        const json = await res.json();
        if (json.success) {
            setTasks(tasks.map(t => t._id === taskId ? json.data : t));
        }
    } catch (e) {
        console.error("Failed to update subtask description", e);
    }
};
```

- [ ] **Step 2: Pass onUpdateSubtaskDescription to TaskColumn**

Find the TaskColumn usage in page.tsx and add the new prop:
```tsx
onUpdateSubtaskDescription={updateSubtaskDescription}
```

- [ ] **Step 3: Pass onUpdateSubtaskDescription through to SortableTaskItem in TaskColumn**

Already done in Task 3 steps 3-4.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx src/app/api/tasks/[id]/route.ts && git commit -m "feat: wire onUpdateSubtaskDescription handler through page.tsx"
```

---

### Task 6: Final Build Verification

- [ ] **Step 1: Run build**

```bash
npm run build
```

Expected: Clean build, no TypeScript errors.

- [ ] **Step 2: Commit final verification**

```bash
git add -a && git commit -m "chore: subtask breakdown feature complete

- Add description field to SubTask interface and Task model
- Expandable subtask rows in TaskColumn with inline description textarea
- Description input on EditTaskModal subtask rows (visible by default)
- Wire onUpdateSubtaskDescription through page.tsx → TaskColumn → SortableTaskItem

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```