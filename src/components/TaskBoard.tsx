import { Task, TaskStatus, TaskPriority, Board, ActiveTimer, TimeLog, SubTask } from "@/types";

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

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// Reuse TaskCard from TaskColumn if exported, but TaskColumn has it inside? 
// Wait, TaskColumn has TaskCard but it wasn't exported.
// Let's assume TaskColumn handles the card rendering, or we need to import TaskCard.
// Checking TaskColumn.tsx... it seems TaskCard IS exported.

// --- Task Board Component ---
import { TaskCard } from "./TaskColumn";

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
  boards = []
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

  // Only show non-archived tasks
  const visibleTasks = tasks.filter(t => !t.isArchived);

  return (
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
            onPauseTimer={onPauseTimer}
            onResumeTimer={onResumeTimer}
            onFocus={onFocus}
            onMoveToBoard={onMoveToBoard}
            boards={boards}
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
  );
};
