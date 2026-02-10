import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { GripVertical, MoreVertical, Edit2, Circle, Clock, Check, Archive, Trash2, Pin, Play, Pause, Timer } from "lucide-react";
import { useState, useRef, useEffect, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// Types needed here
type TaskStatus = "pending" | "in-progress" | "completed" | "pinned";
type TaskPriority = "high" | "medium" | "low";

interface SubTask {
  title: string;
  completed: boolean;
}

interface TimeLog {
  startedAt: string;
  endedAt?: string;
  duration: number;
  note?: string;
}

interface ActiveTimer {
  startedAt?: string;
  isActive: boolean;
}

interface Task {
  _id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  order: number;
  isArchived?: boolean;
  subtasks?: SubTask[];
  timeLogs?: TimeLog[];
  totalTimeSpent?: number;
  activeTimer?: ActiveTimer;
}

// --- Task Card Component ---
export const TaskCard = forwardRef<HTMLDivElement, {
  task: Task;
  onDelete?: (id: string) => void;
  onUpdateStatus?: (id: string, status: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  onArchive?: (id: string) => void;
  onToggleSubtask?: (taskId: string, index: number) => void;
  onUpdatePriority?: (id: string, priority: TaskPriority) => void;
  onStartTimer?: (id: string, sessionTitle?: string) => void;
  onStopTimer?: (id: string, note?: string) => void;
  style?: React.CSSProperties;
  attributes?: any;
  listeners?: any;
  isDragging?: boolean;
  isOverlay?: boolean;
}>(({
  task,
  onDelete,
  onUpdateStatus,
  onEdit,
  onArchive,
  onToggleSubtask,
  onUpdatePriority,
  onStartTimer,
  onStopTimer,
  style,
  attributes,
  listeners,
  isDragging,
  isOverlay
}, ref) => {

  const priorityColors = {
    "high": "border-l-4 border-red-500",
    "medium": "border-l-4 border-yellow-500",
    "low": "border-l-4 border-blue-500"
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  // Timer tick effect
  useEffect(() => {
    // If it's an overlay, we might want to just show the static time or animate it too.
    // Simpler to just animate it if active.
    if (!task.activeTimer?.isActive) return;

    // Initial calculation
    const calculateTime = () => {
      const start = new Date(task.activeTimer!.startedAt!).getTime();
      const now = Date.now();
      setElapsedTime(Math.floor((now - start) / 1000));
    };
    calculateTime();

    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [task.activeTimer]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuAction = (action: () => void) => {
    action();
    setMenuOpen(false);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const totalTime = (task.totalTimeSpent || 0) + (task.activeTimer?.isActive ? elapsedTime : 0);

  return (
    <div
      ref={ref}
      style={style}
      className={cn(
        "group bg-surface hover:bg-surface-hover border border-border rounded-xl transition-all mb-3 relative",
        task.activeTimer?.isActive && "ring-2 ring-primary/50",
        isOverlay && "shadow-2xl scale-105 rotate-1 cursor-grabbing ring-2 ring-primary z-50 bg-surface-hover",
        menuOpen && "z-40",
        isDragging && !isOverlay && "opacity-30 grayscale"
      )}
    >
      {/* Priority Bar */}
      <div className={cn(
        "h-1 w-full rounded-t-xl",
        task.priority === "high" ? "bg-red-500" : task.priority === "medium" ? "bg-yellow-500" : "bg-blue-500"
      )} />

      <div className="p-4">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {/* Drag Handle - Only functional if listeners provided */}
            <button {...attributes} {...listeners} className={cn("p-1 text-gray-500 hover:text-white shrink-0 mt-1", listeners ? "cursor-grab active:cursor-grabbing" : "cursor-default")}>
              <GripVertical size={14} />
            </button>
            <h4 className={cn(
              "text-base font-semibold leading-snug break-words flex-1",
              task.status === "completed" && "text-gray-500 line-through"
            )}>
              {task.title}
            </h4>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {task.activeTimer?.isActive && (
              <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-500 rounded-md text-xs font-mono">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                {formatTime(elapsedTime)}
              </div>
            )}

            {!isOverlay && (
              <div className="relative" ref={menuRef}>
                <button onClick={() => setMenuOpen(!menuOpen)} className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-white/5">
                  <MoreVertical size={16} />
                </button>

                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden"
                    >
                      <div className="p-1">
                        <button onClick={() => onEdit && handleMenuAction(() => onEdit(task))} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-lg text-left">
                          <Edit2 size={14} /> View Details
                        </button>
                        <div className="h-px bg-border my-1" />
                        <div className="px-3 py-1 text-[10px] text-gray-500 uppercase font-bold">Priority</div>
                        <button onClick={() => onUpdatePriority && handleMenuAction(() => onUpdatePriority(task._id, "high"))} className={cn("flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 rounded-lg text-left", task.priority === "high" ? "text-red-500" : "text-gray-300 hover:text-white")}>
                          <div className="w-2 h-2 rounded-full bg-red-500" /> High
                        </button>
                        <button onClick={() => onUpdatePriority && handleMenuAction(() => onUpdatePriority(task._id, "medium"))} className={cn("flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 rounded-lg text-left", task.priority === "medium" ? "text-yellow-500" : "text-gray-300 hover:text-white")}>
                          <div className="w-2 h-2 rounded-full bg-yellow-500" /> Medium
                        </button>
                        <button onClick={() => onUpdatePriority && handleMenuAction(() => onUpdatePriority(task._id, "low"))} className={cn("flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 rounded-lg text-left", task.priority === "low" ? "text-blue-500" : "text-gray-300 hover:text-white")}>
                          <div className="w-2 h-2 rounded-full bg-blue-500" /> Low
                        </button>
                        <div className="h-px bg-border my-1" />
                        <div className="px-3 py-1 text-[10px] text-gray-500 uppercase font-bold">Move To</div>
                        <button onClick={() => onUpdateStatus && handleMenuAction(() => onUpdateStatus(task._id, "pending"))} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-lg text-left">
                          <Circle size={14} /> Backlog
                        </button>
                        <button onClick={() => onUpdateStatus && handleMenuAction(() => onUpdateStatus(task._id, "in-progress"))} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-lg text-left">
                          <Clock size={14} /> In Focus
                        </button>
                        <button onClick={() => onUpdateStatus && handleMenuAction(() => onUpdateStatus(task._id, "completed"))} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-lg text-left">
                          <Check size={14} /> Done
                        </button>
                        <button onClick={() => onUpdateStatus && handleMenuAction(() => onUpdateStatus(task._id, "pinned"))} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-lg text-left">
                          <Pin size={14} /> Pin for Later
                        </button>
                        <div className="h-px bg-border my-1" />
                        {task.status === "completed" && (
                          <button onClick={() => onArchive && handleMenuAction(() => onArchive(task._id))} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-yellow-500 hover:bg-yellow-500/10 rounded-lg text-left">
                            <Archive size={14} /> Archive
                          </button>
                        )}
                        <button onClick={() => onDelete && handleMenuAction(() => onDelete(task._id))} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg text-left">
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Subtasks Section */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="mb-3 space-y-2">
            {/* Progress Bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-surface-hover rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 font-mono tabular-nums">
                {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
              </span>
            </div>

            {/* Subtask List (collapsed by default, first 2 visible) */}
            <div className="space-y-1.5">
              {task.subtasks.slice(0, 2).map((st, i) => (
                <div
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onToggleSubtask) onToggleSubtask(task._id, i);
                  }}
                  className="flex items-start gap-2 cursor-pointer hover:bg-white/5 p-1.5 rounded transition-colors"
                >
                  <div className={cn(
                    "w-3.5 h-3.5 mt-0.5 rounded border flex items-center justify-center transition-all shrink-0",
                    st.completed ? "bg-primary border-primary" : "border-gray-600 hover:border-primary"
                  )}>
                    {st.completed && <Check size={10} className="text-white" />}
                  </div>
                  <span className={cn(
                    "text-xs leading-tight",
                    st.completed ? "text-gray-600 line-through" : "text-gray-400"
                  )}>
                    {st.title}
                  </span>
                </div>
              ))}
              {task.subtasks.length > 2 && (
                <button
                  onClick={() => onEdit && onEdit(task)}
                  className="text-xs text-gray-500 hover:text-primary ml-5 transition-colors"
                >
                  +{task.subtasks.length - 2} more
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer Row - Stats */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          {/* Time Stat */}
          {totalTime > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock size={12} />
              <span className="font-mono">{formatTime(totalTime)}</span>
            </div>
          )}

          {/* Timer Controls - Hide in Overlay if needed, or keep static */}
          {!isOverlay && (
            <>
              {task.activeTimer?.isActive ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onStopTimer) onStopTimer(task._id);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-all text-xs font-medium ml-auto"
                >
                  <Pause size={12} /> Stop
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onStartTimer) onStartTimer(task._id);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-all text-xs font-medium ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Play size={12} /> Start
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
});

TaskCard.displayName = "TaskCard";

// --- Sortable Task Item ---
export const SortableTaskItem = ({
  task,
  onDelete,
  onUpdateStatus,
  onEdit,
  onArchive,
  onToggleSubtask,
  onUpdatePriority,
  onStartTimer,
  onStopTimer
}: {
  task: Task;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onArchive: (id: string) => void;
  onToggleSubtask: (taskId: string, index: number) => void;
  onUpdatePriority: (id: string, priority: TaskPriority) => void;
  onStartTimer: (id: string, sessionTitle?: string) => void;
  onStopTimer: (id: string, note?: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // When dragging, the original item stays in place but opacity is reduced
    // The DragOverlay shows the full opacity version
  };

  return (
    <TaskCard
      ref={setNodeRef}
      style={style}
      task={task}
      onDelete={onDelete}
      onUpdateStatus={onUpdateStatus}
      onEdit={onEdit}
      onArchive={onArchive}
      onToggleSubtask={onToggleSubtask}
      onUpdatePriority={onUpdatePriority}
      onStartTimer={onStartTimer}
      onStopTimer={onStopTimer}
      attributes={attributes}
      listeners={listeners}
      isDragging={isDragging}
    />
  );
};

// --- Task Column ---
export const TaskColumn = ({ id, title, tasks, onDelete, onUpdateStatus, onEdit, onArchive, onToggleSubtask, onUpdatePriority, onStartTimer, onStopTimer }: any) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "bg-surface/30 p-4 rounded-xl border border-border min-h-[500px] flex flex-col transition-all duration-200",
        isOver && "bg-surface-hover/50 border-primary/50 shadow-lg ring-1 ring-primary/20 scale-[1.01]"
      )}
    >
      <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider flex justify-between">
        {title}
        <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs text-white">
          {tasks.length}
        </span>
      </h3>
      <SortableContext
        items={tasks.map((t: any) => t._id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3 flex-1">
          {tasks.map((task: any) => (
            <SortableTaskItem
              key={task._id}
              task={task}
              onDelete={onDelete}
              onUpdateStatus={onUpdateStatus}
              onEdit={onEdit}
              onArchive={onArchive}
              onToggleSubtask={onToggleSubtask}
              onUpdatePriority={onUpdatePriority}
              onStartTimer={onStartTimer}
              onStopTimer={onStopTimer}
            />
          ))}
          {/* Invisible spacer */}
          <div className="h-10 w-full" />
        </div>
      </SortableContext>
    </div>
  );
};
