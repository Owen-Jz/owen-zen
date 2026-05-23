import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { GripVertical, MoreVertical, Edit2, Circle, Clock, Check, Archive, Trash2, Pin, Play, Pause, Timer, Maximize2, CalendarDays, ArrowUpToLine, Sparkles, Plus, Landmark, Copy, Flame, Grid3x3 } from "lucide-react";
import { useState, useRef, useEffect, forwardRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Task, TaskStatus, TaskPriority } from "@/types";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";

// Helper for formatting date
const formatDate = (dateString: string | Date | undefined) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
};

// --- Task Card Component ---
export const TaskCard = memo(forwardRef<HTMLDivElement, {
  task: Task;
  onDelete?: (id: string) => void;
  onUpdateStatus?: (id: string, status: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  onArchive?: (id: string) => void;
  onToggleSubtask?: (taskId: string, index: number) => void;
  onPromoteSubtask?: (taskId: string, subtaskIndex: number) => void;
  onUpdatePriority?: (id: string, priority: TaskPriority) => void;
  onStartTimer?: (id: string, sessionTitle?: string) => void;
  onStopTimer?: (id: string, note?: string) => void;
  onFocus?: (task: Task) => void;
  onBank?: (id: string) => void;
  onUpdateQuadrant?: (id: string, quadrant: "q1" | "q2" | "q3" | "q4") => void;
  onUpdateSubtaskDescription?: (taskId: string, subtaskIndex: number, description: string) => void;
  style?: React.CSSProperties;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attributes?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listeners?: any;
  isDragging?: boolean;
  isOverlay?: boolean;
  activeId?: string | null;
  isMultiSelectMode?: boolean;
  selectedTasks?: Set<string>;
  onToggleSelect?: (id: string) => void;
}>(({
  task,
  onDelete,
  onUpdateStatus,
  onEdit,
  onArchive,
  onToggleSubtask,
  onPromoteSubtask,
  onUpdatePriority,
  onStartTimer,
  onStopTimer,
  onFocus,
  onBank,
  onUpdateQuadrant,
  onUpdateSubtaskDescription,
  style,
  attributes,
  listeners,
  isDragging,
  isOverlay,
  activeId,
  isMultiSelectMode,
  selectedTasks,
  onToggleSelect
}, ref) => {

  const priorityColors = {
    "high": "border-l-4 border-red-500",
    "medium": "border-l-4 border-yellow-500",
    "low": "border-l-4 border-blue-500"
  };

  const [elapsedTime, setElapsedTime] = useState(0);
  const [expandedSubtaskId, setExpandedSubtaskId] = useState<number | null>(null);

  const { isOver: isSubtaskOver, setNodeRef: setSubtaskDropRef } = useDroppable({
    id: `subtask-${task._id}`,
    disabled: !activeId || activeId === task._id
  });

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
    <motion.div
      ref={ref}
      style={style}
      layout
      initial={task.isTemp ? { opacity: 0, y: -20, scale: 0.95 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={task.isTemp ? undefined : { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "group bg-surface/40 backdrop-blur-md hover:bg-surface/60 border border-white/5 rounded-2xl transition-all duration-300 mb-4 relative",
        "hover:shadow-[0_8px_30px_rgba(0,0,0,0.3),0_0_20px_rgba(var(--primary-rgb),0.1)]",
        "hover:scale-[1.02] hover:-translate-y-0.5 hover:border-white/10",
        "active:translate-y-0 active:scale-[0.98]",
        task.activeTimer?.isActive && "ring-2 ring-primary/50 shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)]",
        isOverlay && "shadow-3xl scale-105 rotate-2 cursor-grabbing ring-2 ring-primary z-50 bg-surface/80 backdrop-blur-2xl",
        isDragging && !isOverlay && "opacity-40 grayscale scale-95"
      )}
    >
      {/* Animated Priority Indicator */}
      <motion.div
        animate={{ width: [3, 4, 3] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className={cn(
          "absolute left-0 top-0 bottom-0 rounded-l-2xl z-20",
          task.priority === "high" ? "bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.9),0_0_40px_rgba(239,68,68,0.4)]" :
            task.priority === "medium" ? "bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.9),0_0_40px_rgba(245,158,11,0.4)]" :
              "bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.9),0_0_40px_rgba(59,130,246,0.4)]"
        )}
      />

      {/* MIT Flame Badge */}
      {task.isMIT && (
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 bg-red-500/20 border border-red-500/30 rounded-md">
          <Flame size={10} className="text-red-500 animate-pulse" />
          <span className="text-[9px] font-bold text-red-400 uppercase">MIT</span>
        </div>
      )}

      {/* Completion Celebration Effect */}
      {task.status === "completed" && task.completedAt && (
        <motion.div
          className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10"
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: ["-100%", "100%"], opacity: [0, 1, 0] }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </motion.div>
      )}

      {/* Make Subtask Drop Zone */}
      {
        activeId && activeId !== task._id && !isOverlay && (
          <div
            ref={setSubtaskDropRef}
            className={cn(
              "absolute right-0 top-0 bottom-0 w-1/3 z-30 rounded-r-2xl flex flex-col items-center justify-center p-2.5 transition-all duration-300 backdrop-blur-md border-l border-white/5",
              isSubtaskOver ? "bg-primary/50 border-primary shadow-[inset_0_0_30px_rgba(var(--primary-rgb),0.6)]" : "bg-black/60 opacity-0 group-hover:opacity-100 cursor-crosshair"
            )}
          >
            <div className={cn(
              "w-full h-full border-2 border-dashed rounded-xl flex items-center justify-center text-center transition-all duration-300",
              isSubtaskOver ? "border-white text-white bg-white/10" : "border-white/30 text-white/50 bg-transparent"
            )}>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest leading-tight w-full break-words scale-90 sm:scale-100 transition-all",
                isSubtaskOver ? "text-white" : "text-white/60"
              )}>
                {isSubtaskOver ? "Drop" : "+ Sub"}
              </span>
            </div>
          </div>
        )
      }

      <div className="p-5 pl-6 relative z-10">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {/* Drag Handle - Only functional if listeners provided */}
            <button {...attributes} {...listeners} className={cn("p-2 text-gray-500 hover:text-white shrink-0 mt-0.5 rounded-md hover:bg-white/5 transition-colors", listeners ? "cursor-grab active:cursor-grabbing" : "cursor-default")} aria-label="Drag to reorder task">
              <GripVertical size={16} />
            </button>
            {/* Multi-select checkbox */}
            {isMultiSelectMode && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleSelect?.(task._id); }}
                className={cn(
                  "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 mr-2",
                  selectedTasks?.has(task._id)
                    ? "bg-primary border-primary"
                    : "border-gray-600 hover:border-primary/50"
                )}
              >
                {selectedTasks?.has(task._id) && <Check size={12} className="text-white" />}
              </button>
            )}
            <h4
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(task);
              }}
              className={cn(
                "text-base font-semibold leading-tight break-words flex-1 mt-1 text-gray-100 cursor-pointer hover:text-primary transition-colors",
                task.status === "completed" && "text-gray-500 line-through"
              )}
            >
              {task.title}
            </h4>
          </div>

          {/* Category Badge */}
          {task.category && (
            <div className="absolute top-3 right-12 px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[9px] font-bold text-gray-400 uppercase tracking-wider">
              {task.category}
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            {task.activeTimer?.isActive && (
              <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-500 rounded-md text-xs font-mono">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                {formatTime(elapsedTime)}
              </div>
            )}

            {!isOverlay && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-white/5"
                  aria-label="Task options menu"
                >
                  <MoreVertical size={16} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onEdit?.(task)} className="cursor-pointer">
                    <Edit2 size={14} className="mr-2" /> View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onFocus?.(task)} className="cursor-pointer font-bold text-primary">
                    <Maximize2 size={14} className="mr-2" /> Focus Mode
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onUpdatePriority?.(task._id, "high")}
                    className={cn("cursor-pointer", task.priority === "high" && "text-red-500")}
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500 mr-2" /> High Priority
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onUpdatePriority?.(task._id, "medium")}
                    className={cn("cursor-pointer", task.priority === "medium" && "text-yellow-500")}
                  >
                    <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2" /> Medium Priority
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onUpdatePriority?.(task._id, "low")}
                    className={cn("cursor-pointer", task.priority === "low" && "text-blue-500")}
                  >
                    <div className="w-2 h-2 rounded-full bg-blue-500 mr-2" /> Low Priority
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onUpdateStatus?.(task._id, "pending")} className="cursor-pointer">
                    <Circle size={14} className="mr-2" /> Move to Backlog
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onUpdateStatus?.(task._id, "in-progress")} className="cursor-pointer">
                    <Clock size={14} className="mr-2" /> Move to In Focus
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onUpdateStatus?.(task._id, "completed")} className="cursor-pointer">
                    <Check size={14} className="mr-2" /> Move to Done
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onUpdateStatus?.(task._id, "pinned")} className="cursor-pointer">
                    <Pin size={14} className="mr-2" /> Pin for Later
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onUpdateStatus?.(task._id, "mind-map")} className="cursor-pointer">
                    <Sparkles size={14} className="mr-2" /> Mind Map
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onBank?.(task._id)} className="cursor-pointer">
                    <Landmark size={14} className="mr-2" /> Move to Bank
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onUpdateQuadrant?.(task._id, "q1")}
                    className={cn("cursor-pointer", task.quadrant === "q1" && "text-red-500")}
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500 mr-2" /> Do First (Urgent & Important)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onUpdateQuadrant?.(task._id, "q2")}
                    className={cn("cursor-pointer", task.quadrant === "q2" && "text-blue-500")}
                  >
                    <div className="w-2 h-2 rounded-full bg-blue-500 mr-2" /> Schedule (Not Urgent & Important)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onUpdateQuadrant?.(task._id, "q3")}
                    className={cn("cursor-pointer", task.quadrant === "q3" && "text-yellow-500")}
                  >
                    <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2" /> Delegate (Urgent & Not Important)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onUpdateQuadrant?.(task._id, "q4")}
                    className={cn("cursor-pointer", task.quadrant === "q4" && "text-gray-500")}
                  >
                    <div className="w-2 h-2 rounded-full bg-gray-500 mr-2" /> Eliminate (Not Urgent & Not Important)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {task.status === "completed" && (
                    <DropdownMenuItem onClick={() => onArchive?.(task._id)} className="cursor-pointer text-yellow-500">
                      <Archive size={14} className="mr-2" /> Archive
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => onDelete?.(task._id)} className="cursor-pointer text-red-500">
                    <Trash2 size={14} className="mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Hover Action Buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-2 pt-2 border-t border-white/5">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit?.(task); }}
            className="p-1.5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors"
            title="Edit"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(task._id); }}
            className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-500 transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); /* duplicate - could call API */ }}
            className="p-1.5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors"
            title="Duplicate"
          >
            <Copy size={14} />
          </button>
        </div>

        {/* Subtasks Section */}
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
                      onClick={() => {
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

        {/* Footer Row - Stats */}
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/5">
          {/* Left side: Date + Time */}
          <div className="flex items-center gap-4">
            {/* Creation or Completion Date */}
            {task.status === "completed" && task.completedAt ? (
              <div className="flex items-center gap-1.5 text-[10px] text-green-500 font-medium">
                <Check size={12} className="opacity-70" />
                <span>Finished {new Date(task.completedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
              </div>
            ) : task.createdAt ? (
              <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium">
                <CalendarDays size={12} className="opacity-70" />
                <span>{formatDate(task.createdAt)}</span>
              </div>
            ) : null}
            {/* Due Date */}
            {task.dueDate && (
              <div className={cn(
                "flex items-center gap-1.5 text-[10px] font-bold border px-2 py-1 rounded-md transition-colors",
                new Date().toISOString().split('T')[0] > new Date(task.dueDate).toISOString().split('T')[0] && task.status !== "completed"
                  ? "text-red-400 border-red-500/20 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.1)]"
                  : "text-gray-400 border-white/10 bg-black/20"
              )}>
                <CalendarDays size={12} />
                <span>
                  {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                  {new Date().toISOString().split('T')[0] > new Date(task.dueDate).toISOString().split('T')[0] && task.status !== "completed" && " (Overdue)"}
                </span>
              </div>
            )}
            {/* Time Stat */}
            {totalTime > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-gray-400 font-bold bg-white/5 px-2 py-1 rounded-md">
                <Clock size={12} className="text-primary opacity-80" />
                <span>{formatTime(totalTime)}</span>
              </div>
            )}
          </div>

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
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary rounded-lg hover:bg-primary hover:text-white hover:border-primary transition-all text-xs font-bold ml-auto opacity-0 group-hover:opacity-100 shadow-[0_0_10px_rgba(var(--primary-rgb),0.1)]"
                >
                  <Play size={12} /> Start
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div >
  );
}));

TaskCard.displayName = "TaskCard";

// --- Sortable Task Item ---
export const SortableTaskItem = ({
  task,
  onDelete,
  onUpdateStatus,
  onEdit,
  onArchive,
  onToggleSubtask,
  onPromoteSubtask,
  onUpdatePriority,
  onStartTimer,
  onStopTimer,
  onFocus,
  onBank,
  onUpdateQuadrant,
  onUpdateSubtaskDescription,
  activeId,
  isMultiSelectMode,
  selectedTasks,
  onToggleSelect
}: {
  task: Task;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onArchive: (id: string) => void;
  onToggleSubtask: (taskId: string, index: number) => void;
  onPromoteSubtask?: (taskId: string, subtaskIndex: number) => void;
  onUpdatePriority: (id: string, priority: TaskPriority) => void;
  onStartTimer: (id: string, sessionTitle?: string) => void;
  onStopTimer: (id: string, note?: string) => void;
  onFocus: (task: Task) => void;
  onBank?: (id: string) => void;
  onUpdateQuadrant?: (id: string, quadrant: "q1" | "q2" | "q3" | "q4") => void;
  onUpdateSubtaskDescription?: (taskId: string, subtaskIndex: number, description: string) => void;
  activeId?: string | null;
  isMultiSelectMode?: boolean;
  selectedTasks?: Set<string>;
  onToggleSelect?: (id: string) => void;
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
      onPromoteSubtask={onPromoteSubtask}
      onUpdatePriority={onUpdatePriority}
      onStartTimer={onStartTimer}
      onStopTimer={onStopTimer}
      onFocus={onFocus}
      onBank={onBank}
      onUpdateQuadrant={onUpdateQuadrant}
      onUpdateSubtaskDescription={onUpdateSubtaskDescription}
      attributes={attributes}
      listeners={listeners}
      isDragging={isDragging}
      activeId={activeId}
      isMultiSelectMode={isMultiSelectMode}
      selectedTasks={selectedTasks}
      onToggleSelect={onToggleSelect}
    />
  );
};

// --- Task Column ---
export const TaskColumn = ({ id, title, tasks, onDelete, onUpdateStatus, onEdit, onArchive, onToggleSubtask, onPromoteSubtask, onUpdatePriority, onStartTimer, onStopTimer, onFocus, onArchiveAll, onBank, onUpdateQuadrant, onUpdateSubtaskDescription, activeId, isMultiSelectMode, selectedTasks, onToggleSelect }: {
  id: string,
  title: string,
  tasks: Task[],
  onDelete: (id: string) => void,
  onUpdateStatus: (id: string, status: TaskStatus) => void,
  onEdit: (task: Task) => void,
  onArchive: (id: string) => void,
  onToggleSubtask: (taskId: string, index: number) => void,
  onPromoteSubtask?: (taskId: string, subtaskIndex: number) => void,
  onUpdatePriority: (id: string, priority: TaskPriority) => void,
  onStartTimer: (id: string, sessionTitle?: string) => void,
  onStopTimer: (id: string, note?: string) => void,
  onFocus: (task: Task) => void,
  onArchiveAll?: () => void,
  onBank?: (id: string) => void,
  onUpdateQuadrant?: (id: string, quadrant: "q1" | "q2" | "q3" | "q4") => void,
  onUpdateSubtaskDescription?: (id: string, subtaskIndex: number, description: string) => void,
  activeId?: string | null,
  isMultiSelectMode?: boolean,
  selectedTasks?: Set<string>,
  onToggleSelect?: (id: string) => void
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative p-4 md:p-5 rounded-3xl border border-white/5 min-h-[600px] flex flex-col transition-all duration-500 overflow-hidden",
        "before:absolute before:inset-x-4 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        isOver && [
          "bg-primary/5 border-primary/40 shadow-[0_0_50px_rgba(var(--primary-rgb),0.15)] scale-[1.02]",
          "before:bg-gradient-to-r before:from-primary/30 before:via-primary/50 before:to-primary/30"
        ]
      )}
    >
      {/* Animated drop target indicator */}
      {isOver && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          <div className="absolute inset-0 border-2 border-primary/50 rounded-3xl" />
        </motion.div>
      )}
      {/* Inner gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.15em] flex items-center gap-2">
          {id === "pending" && <Circle size={14} className="text-gray-500" />}
          {id === "in-progress" && <Clock size={14} className="text-primary" />}
          {id === "completed" && <Check size={14} className="text-green-500" />}
          {id === "pinned" && <Pin size={14} className="text-purple-500" />}
          {id === "ai-agent" && <Sparkles size={14} className="text-cyan-400" />}
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {id === "completed" && tasks.length > 0 && (
            <button
              onClick={onArchiveAll}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/20 hover:border-yellow-500/50 transition-all text-[10px] font-bold"
              title="Archive all completed tasks"
            >
              <Archive size={12} />
              <span>Archive All</span>
            </button>
          )}
          <span className="bg-surface/80 py-0.5 px-2.5 rounded-full text-[10px] font-mono font-bold text-gray-300 border border-white/10 shadow-inner">
            {tasks.length}
          </span>
        </div>
      </div>
      <SortableContext
        items={tasks.map((t: Task) => t._id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4 flex-1">
          <AnimatePresence>
            {tasks.map((task: Task) => (
              <SortableTaskItem
                key={task._id}
                task={task}
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
                onBank={onBank}
                onUpdateQuadrant={onUpdateQuadrant}
                onUpdateSubtaskDescription={onUpdateSubtaskDescription}
                activeId={activeId}
                isMultiSelectMode={isMultiSelectMode}
                selectedTasks={selectedTasks}
                onToggleSelect={onToggleSelect}
              />
            ))}
          </AnimatePresence>
          {/* Empty State */}
          {tasks.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="w-20 h-20 mb-4 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 flex items-center justify-center">
                <Check size={32} className="text-gray-600" />
              </div>
              <p className="text-sm text-gray-400 font-medium mb-1">All clear!</p>
              <p className="text-xs text-gray-600">No tasks here. Drag one in or create new.</p>
            </motion.div>
          )}
          {/* Invisible spacer */}
          <div className="h-10 w-full" />
        </div>
      </SortableContext>
    </div>
  );
};
