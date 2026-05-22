# EditTaskModal Quadrant Selector — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an Eisenhower quadrant selector to the `EditTaskModal` so users can assign/edit a task's quadrant from the edit modal.

**Architecture:** Add `quadrant` state to `EditTaskModal`, render a quadrant selector UI in the sidebar (matching the one in `AddTaskModal`), pass `quadrant` through `onSave`, and update both `saveEditTask` (page.tsx) and `handleEditTaskSave` (ProjectView.tsx) to accept and persist the new field.

**Tech Stack:** Next.js, React, TypeScript, Framer Motion, Lucide icons, Tailwind CSS

---

## File Inventory

| File | Role |
|------|------|
| `src/components/EditTaskModal.tsx` | Add `quadrant` state, selector UI, update `onSave` call |
| `src/app/page.tsx:1708` | Update `saveEditTask` to accept and persist `quadrant` |
| `src/components/ProjectView.tsx:50` | Update `handleEditTaskSave` to accept `quadrant` param |

---

## Task 1: Add quadrant state and selector UI to EditTaskModal

**Files:**
- Modify: `src/components/EditTaskModal.tsx`

- [ ] **Step 1: Add quadrant state variable after existing state declarations (line ~48)**

```tsx
const [category, setCategory] = useState(task?.category || "Other");
const [quadrant, setQuadrant] = useState<"q1" | "q2" | "q3" | "q4" | null>(task?.quadrant ?? null);
```

- [ ] **Step 2: Add Quadrant Selector UI to the sidebar properties panel (after MIT Toggle section, around line 369)**

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

- [ ] **Step 3: Update `onSave` call in `handleSave` (around line 96-102)**

```tsx
const handleSave = () => {
    onSave(task._id, title, description, priority, subtasks, dueDate || undefined, category, quadrant);
    if (isMIT !== task.isMIT) {
        onToggleMIT(task._id, isMIT);
    }
    onClose();
};
```

- [ ] **Step 4: Verify `Grid3x3` is not needed — no import changes required (already has needed icons)**

---

## Task 2: Update onSave prop signature in EditTaskModal

**Files:**
- Modify: `src/components/EditTaskModal.tsx:13`

- [ ] **Step 1: Update the `onSave` interface (line 13)**

```tsx
onSave: (id: string, title: string, description: string, priority: TaskPriority, subtasks: SubTask[], dueDate?: string, category?: string, quadrant?: "q1" | "q2" | "q3" | "q4" | null) => void;
```

---

## Task 3: Update saveEditTask in page.tsx to persist quadrant

**Files:**
- Modify: `src/app/page.tsx:1708-1722`

- [ ] **Step 1: Update `saveEditTask` function signature and body**

```tsx
const saveEditTask = async (id: string, title: string, description: string, priority: TaskPriority, subtasks: SubTask[], dueDate?: string, category?: string, quadrant?: "q1" | "q2" | "q3" | "q4" | null) => {
    const oldTasks = [...tasks];
    setTasks(tasks.map(t => t._id === id ? { ...t, title, description, priority, subtasks, dueDate, category, quadrant } : t));
    setEditingTask(null);

    try {
      await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, priority, subtasks, dueDate, category, quadrant }),
      });
    } catch {
      setTasks(oldTasks);
    }
};
```

---

## Task 4: Update handleEditTaskSave in ProjectView.tsx to accept quadrant

**Files:**
- Modify: `src/components/ProjectView.tsx:50-62`

- [ ] **Step 1: Update `handleEditTaskSave` signature and API call**

```tsx
const handleEditTaskSave = async (id: string, title: string, description: string, priority: TaskPriority, subtasks: SubTask[], dueDate?: string, category?: string, quadrant?: "q1" | "q2" | "q3" | "q4" | null) => {
    try {
        await fetch(`/api/tasks/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, description, priority, subtasks, dueDate, category, quadrant })
        });
        setEditingTask(null);
        fetchProjects();
    } catch (e) {
        console.error("Failed to save task", e);
    }
};
```

---

## Task 5: Verify and commit

- [ ] **Step 1: Run the linter**

```bash
npm run lint
```

Expected: No errors related to the changed files.

- [ ] **Step 2: Start dev server and test manually**

```bash
npm run dev
```

Open a task's edit modal — verify:
1. Quadrant section appears in sidebar
2. Selecting a quadrant and saving persists it
3. Reopening the modal shows the previously selected quadrant pre-selected

- [ ] **Step 3: Commit**

```bash
git add src/components/EditTaskModal.tsx src/app/page.tsx src/components/ProjectView.tsx
git commit -m "$(cat <<'EOF'
feat: add quadrant selector to EditTaskModal

Add Eisenhower quadrant editing to the task edit modal. Users
can now assign or change a task's quadrant from the edit modal
sidebar, matching the experience in AddTaskModal.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```