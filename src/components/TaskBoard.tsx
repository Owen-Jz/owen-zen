// --- Task Board Component ---
import { useDroppable, DndContext, closestCenter, rectIntersection, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay, pointerWithin, CollisionDetection } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { GripVertical, MoreVertical, Edit2, Circle, Clock, Check, Archive, Trash2, Pin, Play, Pause, Timer, Maximize2 } from "lucide-react";
import { useState, useRef, useEffect, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { TaskColumn } from "./TaskColumn";
import { Task, TaskStatus, TaskPriority, Board } from "@/types";
import { TaskCard } from "./TaskColumn";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const customCollisionDetection: CollisionDetection = (args) => {
  // First, get all pointer intersections
  const pointerCollisions = pointerWithin(args);

  // See if any of the pointer collisions is a subtask dropzone
  const subtaskCollision = pointerCollisions.find(c => String(c.id).startsWith("subtask-"));
  if (subtaskCollision) {
    return [subtaskCollision];
  }

  // Otherwise, fallback to rectIntersection
  return rectIntersection(args);
};


export const TaskBoard = ({
  tasks,
  setTasks,
  onUpdateStatus,
  onDelete,
  onEdit,
  onArchive,
  onToggleSubtask,
  onPromoteSubtask,
  onUpdatePriority,
  onStartTimer,
  onStopTimer,
  onPauseTimer,
  onResumeTimer,
  onFocus,
  onMoveToBoard,
  boards,
  isZenMode,
  onBulkDelete,
  onBulkArchive,
  onBulkRestore,
  onBulkUpdateStatus,
  onBulkUpdatePriority
}: {
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  onUpdateStatus: (id: string, status: TaskStatus) => void | Promise<void>,
  onDelete: (id: string) => void | Promise<void>,
  onEdit: (task: Task) => void | Promise<void>,
  onArchive: (id: string) => void | Promise<void>,
  onToggleSubtask: (taskId: string, index: number) => void | Promise<void>,
  onPromoteSubtask?: (taskId: string, subtaskIndex: number) => void | Promise<void>,
  onUpdatePriority: (id: string, priority: TaskPriority) => void | Promise<void>,
  onStartTimer: (id: string, sessionTitle?: string) => void | Promise<void>,
  onStopTimer: (id: string, note?: string) => void | Promise<void>,
  onPauseTimer?: (id: string) => void | Promise<void>,
  onResumeTimer?: (id: string) => void | Promise<void>,
  onFocus: (task: Task) => void | Promise<void>,
  onMoveToBoard?: (taskId: string, boardId: string | null) => void | Promise<void>,
  boards?: Board[],
  isZenMode?: boolean,
  onBulkDelete?: (ids: string[]) => void | Promise<void>,
  onBulkArchive?: (ids: string[]) => void | Promise<void>,
  onBulkRestore?: (ids: string[]) => void | Promise<void>,
  onBulkUpdateStatus?: (ids: string[], status: TaskStatus) => void | Promise<void>,
  onBulkUpdatePriority?: (ids: string[], priority: TaskPriority) => void | Promise<void>
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeIdStr = active.id;
    const overIdStr = over.id;

    if (activeIdStr === overIdStr) return;

    const activeTask = tasks.find(t => t._id === activeIdStr);
    if (!activeTask) return;

    if (String(overIdStr).startsWith("subtask-")) {
      const targetTaskId = String(overIdStr).replace("subtask-", "");
      if (activeIdStr === targetTaskId) return;

      const targetTask = tasks.find(t => t._id === targetTaskId);
      if (!targetTask) return;

      // Make activeTask a subtask of targetTask
      const newSubtask = { title: activeTask.title, completed: false };
      const updatedSubtasks = [...(targetTask.subtasks || []), newSubtask];

      // Remove activeTask from main list and update targetTask
      let newTasks = tasks.filter(t => t._id !== activeIdStr).map(t => {
        if (t._id === targetTaskId) {
          return { ...t, subtasks: updatedSubtasks };
        }
        return t;
      });

      setTasks(newTasks);

      try {
        // Update the target task using specific endpoint
        await fetch(`/api/tasks/${targetTaskId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subtasks: updatedSubtasks })
        });

        // Delete the original task completely
        await fetch(`/api/tasks/${activeIdStr}`, {
          method: "DELETE"
        });
      } catch (e) {
        console.error("Failed to merge task", e);
      }

      return;
    }

    // Normal Reorder / Status Change
    let newStatus: TaskStatus | undefined;

    if (["pending", "in-progress", "completed", "pinned", "ai-agent"].includes(overIdStr)) {
      newStatus = overIdStr as TaskStatus;
    } else {
      const overTask = tasks.find(t => t._id === overIdStr);
      if (overTask) newStatus = overTask.status;
    }

    if (!newStatus) return;

    let newTasks = [...tasks];

    if (activeTask.status !== newStatus) {
      activeTask.status = newStatus;
      if (newStatus === "completed") {
        activeTask.completedAt = new Date().toISOString();
      } else {
        activeTask.completedAt = undefined;
      }
    }

    if (activeIdStr !== overIdStr) {
      const oldIndex = tasks.findIndex(t => t._id === activeIdStr);
      const newIndex = tasks.findIndex(t => t._id === overIdStr);
      newTasks = arrayMove(tasks, oldIndex, newIndex);
    }

    newTasks = newTasks.map((t, index) => ({ ...t, order: index }));
    setTasks(newTasks);

    await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tasks: newTasks.map(t => ({
          _id: t._id,
          order: t.order,
          status: t.status,
          priority: t.priority,
          isArchived: t.isArchived,
          title: t.title,
          completedAt: t.completedAt
        }))
      }),
    });
  };

  const columns: { id: TaskStatus | "ai-agent"; title: string }[] = [
    { id: "pending", title: "Backlog" },
    { id: "in-progress", title: "In Focus" },
    { id: "completed", title: "Done" },
    { id: "pinned", title: "Pin for Later" },
    { id: "ai-agent", title: "AI Agent" }
  ];

  // Only show non-archived tasks and apply filters
  const visibleTasks = tasks.filter(t =>
    !t.isArchived &&
    (priorityFilter === "all" || t.priority === priorityFilter) &&
    (categoryFilter === "all" || t.category === categoryFilter)
  );

  const totalTasks = visibleTasks.length;
  const completedTasks = visibleTasks.filter(t => t.status === "completed").length;
  const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="space-y-6">
      {/* Productivity Board Header: Progress & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/20 backdrop-blur-md border border-white/5 rounded-2xl p-4 shadow-lg">
        {/* Progress Bar */}
        <div className="flex-1 max-w-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Board Progress</span>
            <span className="text-xs font-mono font-bold text-primary">{progressPercent}%</span>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.8)]"
            />
          </div>
        </div>

        {/* Priority Filter Chips */}
        <div className="flex items-center gap-4 overflow-x-auto pb-1 scrollbar-hide">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mr-1 hidden sm:block">Priority:</span>
            {(["all", "high", "medium", "low"] as const).map(filter => (
              <button
                key={filter}
                onClick={() => setPriorityFilter(filter)}
                className={cn(
                  "px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border",
                  priorityFilter === filter
                    ? filter === 'high' ? "bg-[var(--priority-high)]/20 text-[var(--priority-high)] border-[var(--priority-high)]/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]" :
                      filter === 'medium' ? "bg-[var(--priority-medium)]/20 text-[var(--priority-medium)] border-[var(--priority-medium)]/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]" :
                        filter === 'low' ? "bg-[var(--priority-low)]/20 text-[var(--priority-low)] border-[var(--priority-low)]/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]" :
                          "bg-primary/20 text-primary border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.2)]"
                    : "bg-surface/50 text-gray-500 border-white/5 hover:bg-white/5 hover:text-white"
                )}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mr-1 hidden sm:block">Category:</span>
            {["all", "Work", "Personal", "Health", "Finance", "Other"].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  "px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border",
                  categoryFilter === cat
                    ? "bg-primary/20 text-primary border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.2)]"
                    : "bg-surface/50 text-gray-500 border-white/5 hover:bg-white/5 hover:text-white"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-4 md:gap-6">
          {columns.map(col => {
            const isFocusCol = col.id === "in-progress";
            return (
              <div
                key={col.id}
                className={cn(
                  "transition-all duration-700",
                  isZenMode && !isFocusCol ? "opacity-30 hover:opacity-100 grayscale hover:grayscale-0 blur-[2px] hover:blur-none scale-95 hover:scale-100" : "opacity-100 scale-100 blur-none"
                )}
              >
                <TaskColumn
                  id={col.id}
                  title={col.title}
                  tasks={visibleTasks.filter(t => t.status === col.id)}
                  onDelete={onDelete}
                  onUpdateStatus={onUpdateStatus}
                  onEdit={onEdit}
                  onArchive={onArchive}
                  onToggleSubtask={onToggleSubtask}
                  onPromoteSubtask={onPromoteSubtask}
                  onUpdatePriority={onUpdatePriority}
                  onStartTimer={onStartTimer}
                  onStopTimer={onStopTimer}
                  onFocus={onFocus}
                  activeId={activeId}
                />
              </div>
            );
          })}
        </div>

        <DragOverlay dropAnimation={{
          duration: 250,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}>
          {activeId ? (
            (() => {
              const task = tasks.find(t => t._id === activeId);
              return task ? <TaskCard task={task} isOverlay /> : null;
            })()
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
