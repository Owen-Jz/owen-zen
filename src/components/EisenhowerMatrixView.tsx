"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  closestCorners,
  rectIntersection,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Grid3x3, ChevronDown, ChevronUp, Circle, Plus } from "lucide-react";
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

export const EisenhowerMatrixView = ({ tasks, onTasksChange, onAddTask, isAddTaskModalOpen, setIsAddTaskModalOpen }: { tasks: Task[]; onTasksChange?: (updatedTask: Task) => void; onAddTask?: () => void; isAddTaskModalOpen?: boolean; setIsAddTaskModalOpen?: (open: boolean) => void }) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const completedTasks = tasks.filter(t => t.status === "completed" && !t.isArchived);
  const tasksByQuadrant = (id: string) => tasks.filter(t => t.quadrant === id && !t.isArchived);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;
    const activeTask = tasks.find(t => t._id === taskId);
    if (!activeTask) return;

    const overTask = tasks.find(t => t._id === overId);

    let newQuadrant: "q1" | "q2" | "q3" | "q4" | null = null;
    if (["q1", "q2", "q3", "q4"].includes(overId)) {
      newQuadrant = overId as "q1" | "q2" | "q3" | "q4";
    } else if (overTask) {
      newQuadrant = overTask.quadrant ?? null;
    }

    // Cross-quadrant move — update quadrant and persist
    if (newQuadrant !== null && newQuadrant !== activeTask.quadrant) {
      try {
        const res = await fetch(`/api/tasks/${taskId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quadrant: newQuadrant }),
        });
        const json = await res.json();
        if (json.success && onTasksChange) {
          onTasksChange(json.data);
        }
      } catch (e) {
        console.error("Failed to update task quadrant", e);
      }
      return;
    }

    // Same-quadrant reorder — reorder within quadrant
    const targetQuadrant = activeTask.quadrant;
    const quadrantTasks = tasks.filter(
      t => t.quadrant === targetQuadrant && !t.isArchived && t.status !== "completed"
    );

    const oldIndex = quadrantTasks.findIndex(t => t._id === taskId);
    const newIndex = overTask
      ? quadrantTasks.findIndex(t => t._id === overId)
      : oldIndex;

    if (oldIndex !== newIndex && newIndex !== -1) {
      const reordered = arrayMove(quadrantTasks, oldIndex, newIndex);
      const newOrder = reordered.map((t, i) => ({ ...t, order: i }));

      try {
        await fetch("/api/tasks", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tasks: newOrder.map(t => ({
              _id: t._id,
              order: t.order,
              quadrant: t.quadrant,
              status: t.status,
              priority: t.priority,
              title: t.title,
              isArchived: t.isArchived,
              completedAt: t.completedAt,
              isBanked: t.isBanked,
            }))
          }),
        });
      } catch (e) {
        console.error("Failed to reorder tasks", e);
      }
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Grid3x3 size={22} className="text-primary" />
          <h1 className="text-2xl font-bold">Eisenhower Matrix</h1>
        </div>
        <button
          onClick={onAddTask}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary rounded-xl transition-all text-sm font-bold"
        >
          <Plus size={16} /> Add Task
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className={styles.eisenhowerMatrix}>
          {QUADRANTS.map((q) => (
            <QuadrantCard
              key={q.id}
              id={q.id}
              label={q.label}
              sublabel={q.sublabel}
              color={q.color}
              tasks={tasksByQuadrant(q.id)}
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

      <CompletedSection
        tasks={completedTasks}
        isOpen={showCompleted}
        onToggle={() => setShowCompleted(v => !v)}
      />
    </div>
  );
};

// --- QuadrantCard ---
function QuadrantCard({
  id,
  label,
  sublabel,
  color,
  tasks,
  activeId,
  onComplete,
}: {
  id: string;
  label: string;
  sublabel: string;
  color: string;
  tasks: Task[];
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
          <SortableTaskCard key={task._id} task={task} />
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

// --- SortableTaskCard ---
function SortableTaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} />
    </div>
  );
}

// --- CompletedSection ---
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
          <Circle size={16} className="text-gray-600 shrink-0" fill="currentColor" />
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