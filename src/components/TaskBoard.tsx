// --- Task Board Component ---
import { useSoundContext } from "@/components/SoundEffects";
import { useConfetti, Confetti } from "@/components/Confetti";
import { useDroppable, DndContext, closestCenter, rectIntersection, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay, pointerWithin, CollisionDetection } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { GripVertical, MoreVertical, Edit2, Circle, Clock, Check, Archive, Trash2, Pin, Play, Pause, Timer, Maximize2, Search } from "lucide-react";
import { useState, useRef, useEffect, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TaskColumn } from "./TaskColumn";
import { Task, TaskStatus, TaskPriority } from "@/types";
import { TaskCard } from "./TaskColumn";
import { cn } from "@/lib/utils";
import { QuickAddBar } from "./TaskBoard/QuickAddBar";
import { TaskStatsPanel } from "./TaskBoard/TaskStatsPanel";
import { TaskInsightsPanel } from "./TaskBoard/TaskInsightsPanel";

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
  isZenMode,
  onBulkDelete,
  onBulkArchive,
  onBulkRestore,
  onBulkUpdateStatus,
  onBulkUpdatePriority,
  onBank,
  onUpdateQuadrant,
  onUpdateSubtaskDescription,
  onAssignToZeal
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
  isZenMode?: boolean,
  onBulkDelete?: (ids: string[]) => void | Promise<void>,
  onBulkArchive?: (ids: string[]) => void | Promise<void>,
  onBulkRestore?: (ids: string[]) => void | Promise<void>,
  onBulkUpdateStatus?: (ids: string[], status: TaskStatus) => void | Promise<void>,
  onBulkUpdatePriority?: (ids: string[], priority: TaskPriority) => void | Promise<void>,
  onBank?: (id: string) => void,
  onUpdateQuadrant?: (id: string, quadrant: "q1" | "q2" | "q3" | "q4") => void,
  onUpdateSubtaskDescription?: (taskId: string, subtaskIndex: number, description: string) => void | Promise<void>,
  onAssignToZeal?: (id: string) => void | Promise<void>
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
  const [timeFilter, setTimeFilter] = useState<"all" | "today" | "thisWeek" | "overdue">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"priority" | "dueDate" | "created" | "alpha">("priority");
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  const { playSound } = useSoundContext();
  const { trigger, fire } = useConfetti();

  const handleArchiveAllCompleted = async () => {
    const completedIds = visibleTasks
      .filter(t => t.status === "completed")
      .map(t => t._id);
    if (completedIds.length === 0) return;
    await onBulkArchive?.(completedIds);
  };

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

    if (["pending", "in-progress", "completed", "pinned", "ai-agent", "mind-map"].includes(overIdStr)) {
      newStatus = overIdStr as TaskStatus;
    } else {
      const overTask = tasks.find(t => t._id === overIdStr);
      if (overTask) newStatus = overTask.status;
    }

    if (!newStatus) return;

    const previousStatus = activeTask.status;

    let newTasks = [...tasks];

    if (activeTask.status !== newStatus) {
      activeTask.status = newStatus;
      if (newStatus === "completed") {
        activeTask.completedAt = new Date().toISOString();
        fire(); // Trigger confetti on task completion
      } else {
        activeTask.completedAt = undefined;
      }
      // Play sound on column move
      playSound("TASK_MOVED");
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

    // Dragging a card into the "AI Agent" column hands the task to ZEAL.
    // Guard against re-assigning a task ZEAL is already handling.
    const alreadyWorking = ["queued", "routing", "working"].includes(activeTask.zeal?.status || "");
    if (newStatus === "ai-agent" && previousStatus !== "ai-agent" && !alreadyWorking) {
      onAssignToZeal?.(activeIdStr);
    }
  };

  const columns: { id: TaskStatus | "ai-agent" | "mind-map"; title: string }[] = [
    { id: "pending", title: "Backlog" },
    { id: "in-progress", title: "In Focus" },
    { id: "completed", title: "Done" },
    { id: "pinned", title: "Pin for Later" },
    { id: "ai-agent", title: "AI Agent" },
    { id: "mind-map", title: "Mind Map" }
  ];

  // Only show non-archived, non-banked tasks and apply filters
  const visibleTasks = tasks.filter(t => {
    if (t.isArchived || t.isBanked) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false;

    const todayStart = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    const weekEnd = new Date(todayStart); weekEnd.setDate(weekEnd.getDate() + 7);

    if (timeFilter === "today" && (!t.dueDate || new Date(t.dueDate) < todayStart || new Date(t.dueDate) >= new Date(todayStart.getTime() + 86400000))) return false;
    if (timeFilter === "thisWeek" && (!t.dueDate || new Date(t.dueDate) < todayStart || new Date(t.dueDate) >= weekEnd)) return false;
    if (timeFilter === "overdue" && (!t.dueDate || new Date(t.dueDate) >= todayStart || t.status === "completed")) return false;

    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

    return true;
  }).sort((a, b) => {
    if (sortBy === "priority") {
      const pOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
      return pOrder[a.priority] - pOrder[b.priority];
    }
    if (sortBy === "dueDate" && a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    if (sortBy === "dueDate" && a.dueDate) return -1;
    if (sortBy === "created") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === "alpha") return a.title.localeCompare(b.title);
    return a.order - b.order;
  });

  const totalTasks = visibleTasks.length;
  const completedTasks = visibleTasks.filter(t => t.status === "completed").length;
  const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart); weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(todayStart); monthStart.setMonth(now.getMonth() - 1);

  const visibleTasksForStats = tasks.filter(t => !t.isArchived && !t.isBanked);

  const completedToday = visibleTasksForStats.filter(t => t.status === "completed" && t.completedAt && t.completedAt.startsWith(todayStart.toISOString().split('T')[0])).length;
  const completedThisWeek = visibleTasksForStats.filter(t => t.status === "completed" && t.completedAt && new Date(t.completedAt) >= weekStart).length;
  const completedThisMonth = visibleTasksForStats.filter(t => t.status === "completed" && t.completedAt && new Date(t.completedAt) >= monthStart).length;
  const overdueCount = visibleTasksForStats.filter(t => t.dueDate && new Date(t.dueDate) < todayStart && t.status !== "completed").length;

  const mitTasks = visibleTasksForStats.filter(t => t.isMIT && t.status !== "completed" && !t.isArchived);
  const perfectDay = mitTasks.length === 0;

  const completedThisWeekArr = Array.from({ length: 7 }, (_, i) => {
    const dayStart = new Date(weekStart); dayStart.setDate(weekStart.getDate() + i);
    return visibleTasksForStats.filter(t => t.status === "completed" && t.completedAt && t.completedAt.startsWith(dayStart.toISOString().split('T')[0])).length;
  });

  const inFocusCount = visibleTasksForStats.filter(t => t.status === "in-progress" && !t.isArchived).length;
  const completionRate = totalTasks > 0 ? Math.round(((completedThisMonth + completedToday) / totalTasks) * 100) : 0;

  const handleQuickAdd = async (title: string, options: { isMIT: boolean; priority: "high" | "medium" | "low" }) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          isMIT: options.isMIT,
          priority: options.priority,
          status: "pending",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setTasks((prev: Task[]) => [...prev, json.data]);
      }
    } catch (err) {
      console.error("Failed to add task", err);
    }
  };

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
          <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full relative overflow-hidden",
                progressPercent === 100
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                  : "bg-gradient-to-r from-primary to-primary-light shadow-[0_0_15px_rgba(var(--primary-rgb),0.6)]"
              )}
            >
              <motion.div
                className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                animate={{ x: ['-100%', '400%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Particle trail effect on progress */}
              <motion.div
                className="absolute right-0 top-0 bottom-0 w-1 bg-white/30 blur-sm"
                animate={{ opacity: [0.3, 0.8, 0.3], x: [0, 5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </motion.div>
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
                aria-pressed={priorityFilter === filter}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border active:scale-95",
                  priorityFilter === filter
                    ? filter === 'high' ? "bg-red-500/20 text-red-400 border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.3)]" :
                      filter === 'medium' ? "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.3)]" :
                        filter === 'low' ? "bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.3)]" :
                          "bg-primary/20 text-primary border-primary/40 shadow-[0_0_20px_rgba(var(--primary),0.3)]"
                    : "bg-surface/50 text-gray-400 border-white/5 hover:bg-white/10 hover:text-gray-200 hover:border-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]"
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
                aria-pressed={categoryFilter === cat}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border active:scale-95",
                  categoryFilter === cat
                    ? "bg-primary/20 text-primary border-primary/40 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
                    : "bg-surface/50 text-gray-400 border-white/5 hover:bg-white/10 hover:text-gray-200 hover:border-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Smart Filter Chips */}
        <div className="flex items-center gap-2 flex-wrap mt-4 pt-4 border-t border-white/5">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mr-1">Quick:</span>
          {(["all", "today", "thisWeek", "overdue"] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border",
                timeFilter === filter
                  ? filter === 'overdue' ? "bg-red-500/20 text-red-400 border-red-500/40" :
                    filter === 'today' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" :
                    "bg-primary/20 text-primary border-primary/40"
                  : "bg-surface/50 text-gray-400 border-white/5 hover:bg-white/10"
              )}
            >
              {filter === 'all' ? 'All' : filter === 'today' ? 'Due Today' : filter === 'thisWeek' ? 'This Week' : 'Overdue'}
            </button>
          ))}

          {/* Search Input */}
          <div className="relative ml-2">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="bg-surface/50 border border-white/5 rounded-lg pl-7 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-primary/50 w-32 transition-all"
            />
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="bg-surface/50 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-gray-400 focus:outline-none focus:border-primary/50 cursor-pointer"
          >
            <option value="priority">Priority</option>
            <option value="dueDate">Due Date</option>
            <option value="created">Created</option>
            <option value="alpha">A-Z</option>
          </select>

          {/* Multi-select Toggle */}
          <button
            onClick={() => { setIsMultiSelectMode(!isMultiSelectMode); setSelectedTasks(new Set()); }}
            className={cn(
              "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ml-auto",
              isMultiSelectMode ? "bg-blue-500/20 text-blue-400 border-blue-500/40" : "bg-surface/50 text-gray-400 border-white/5 hover:bg-white/10"
            )}
          >
            Select
          </button>
        </div>
      </div>

      <TaskStatsPanel
        tasks={tasks}
        completedToday={completedToday}
        completedThisWeek={completedThisWeek}
        completedThisMonth={completedThisMonth}
        overdueCount={overdueCount}
        mitStreak={mitTasks.length}
        perfectDay={perfectDay}
      />

      <TaskInsightsPanel
        completedThisWeek={completedThisWeekArr}
        completionRate={completionRate}
        mitStreak={mitTasks.length}
        inFocusCount={inFocusCount}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4 md:gap-6">
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
                  onBank={onBank}
                  onUpdateQuadrant={onUpdateQuadrant}
                  onUpdateSubtaskDescription={onUpdateSubtaskDescription}
                  onAssignToZeal={onAssignToZeal}
                  onArchiveAll={col.id === "completed" ? handleArchiveAllCompleted : undefined}
                  activeId={activeId}
                />
              </div>
            );
          })}
        </div>

        {selectedTasks.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-4 mb-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-blue-400">{selectedTasks.size} selected</span>
              <button
                onClick={() => setSelectedTasks(new Set())}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { onBulkUpdateStatus?.(Array.from(selectedTasks), "completed"); setSelectedTasks(new Set()); }}
                className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-bold hover:bg-emerald-500/30 transition-all"
              >
                Complete
              </button>
              <button
                onClick={() => { onBulkUpdatePriority?.(Array.from(selectedTasks), "high"); setSelectedTasks(new Set()); }}
                className="px-3 py-1.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/30 transition-all"
              >
                High Priority
              </button>
              <button
                onClick={() => { if(confirm(`Delete ${selectedTasks.size} tasks?`)) { onBulkDelete?.(Array.from(selectedTasks)); setSelectedTasks(new Set()); } }}
                className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-all"
              >
                Delete
              </button>
            </div>
          </motion.div>
        )}

        <DragOverlay dropAnimation={{
          duration: 250,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}>
          {activeId ? (
            (() => {
              const task = tasks.find(t => t._id === activeId);
              return task ? (
                <motion.div
                  initial={{ scale: 1, rotate: 0 }}
                  animate={{ scale: 1.05, rotate: 2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="shadow-3xl cursor-grabbing"
                >
                  <TaskCard task={task} isOverlay />
                </motion.div>
              ) : null;
            })()
          ) : null}
        </DragOverlay>
        <Confetti trigger={trigger} />
      </DndContext>

      <QuickAddBar onAdd={handleQuickAdd} />
    </div>
  );
};
