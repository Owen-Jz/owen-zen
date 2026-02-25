// --- Task Board Component ---
import { useDroppable, DndContext, closestCenter, rectIntersection, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
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

export const TaskBoard = ({
  tasks,
  setTasks,
  onUpdateStatus,
  onDelete,
  onEdit,
  onArchive,
  onToggleSubtask,
  onUpdatePriority,
  onStartTimer,
  onStopTimer,
  onPauseTimer,
  onResumeTimer,
  onFocus,
  onMoveToBoard,
  boards
}: {
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  onUpdateStatus: (id: string, status: TaskStatus) => void,
  onDelete: (id: string) => void,
  onEdit: (task: Task) => void,
  onArchive: (id: string) => void,
  onToggleSubtask: (taskId: string, index: number) => void,
  onUpdatePriority: (id: string, priority: TaskPriority) => void,
  onStartTimer: (id: string, sessionTitle?: string) => void,
  onStopTimer: (id: string, note?: string) => void,
  onPauseTimer?: (id: string) => void,
  onResumeTimer?: (id: string) => void,
  onFocus: (task: Task) => void,
  onMoveToBoard?: (taskId: string, boardId: string | null) => void,
  boards?: Board[]
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all");

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Determine target status
    let newStatus: TaskStatus | undefined;

    if (["pending", "in-progress", "completed", "pinned"].includes(overId)) {
      // Dropped on a column
      newStatus = overId as TaskStatus;
    } else {
      // Dropped on a task
      const overTask = tasks.find(t => t._id === overId);
      if (overTask) newStatus = overTask.status;
    }

    if (!newStatus) return;

    const activeTask = tasks.find(t => t._id === activeId);
    if (!activeTask) return;

    let newTasks = [...tasks];

    // Status change?
    if (activeTask.status !== newStatus) {
      activeTask.status = newStatus;
    }

    // Reorder?
    if (activeId !== overId) {
      const oldIndex = tasks.findIndex(t => t._id === activeId);
      const newIndex = tasks.findIndex(t => t._id === overId);
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
          isArchived: t.isArchived
        }))
      }),
    });
  };

  const columns: { id: TaskStatus; title: string }[] = [
    { id: "pending", title: "Backlog" },
    { id: "in-progress", title: "In Focus" },
    { id: "completed", title: "Done" },
    { id: "pinned", title: "Pin for Later" }
  ];

  // Only show non-archived tasks and apply filters
  const visibleTasks = tasks.filter(t => !t.isArchived && (priorityFilter === "all" || t.priority === priorityFilter));

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
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-2 hidden sm:block">Filter:</span>
          {(["all", "high", "medium", "low"] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setPriorityFilter(filter)}
              className={cn(
                "px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border",
                priorityFilter === filter
                  ? filter === 'high' ? "bg-red-500/20 text-red-500 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]" :
                    filter === 'medium' ? "bg-amber-500/20 text-amber-500 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]" :
                      filter === 'low' ? "bg-blue-500/20 text-blue-500 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]" :
                        "bg-primary/20 text-primary border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.2)]"
                  : "bg-surface/50 text-gray-500 border-white/5 hover:bg-white/5 hover:text-white"
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
          {columns.map(col => (
            <TaskColumn
              key={col.id}
              id={col.id}
              title={col.title}
              tasks={visibleTasks.filter(t => t.status === col.id)}
              onDelete={onDelete}
              onUpdateStatus={onUpdateStatus}
              onEdit={onEdit}
              onArchive={onArchive}
              onToggleSubtask={onToggleSubtask}
              onUpdatePriority={onUpdatePriority}
              onStartTimer={onStartTimer}
              onStopTimer={onStopTimer}
              onFocus={onFocus}
            />
          ))}
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
