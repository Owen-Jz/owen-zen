"use client";

import { useState, useEffect } from "react";
import { Plus, Check, Circle, Clock, Trash2, LayoutDashboard, Calendar, Settings, Menu, X, GripVertical } from "lucide-react";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Types ---
type TaskStatus = "pending" | "in-progress" | "completed";

interface Task {
  _id: string; // MongoDB uses _id
  title: string;
  status: TaskStatus;
  createdAt: string;
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

// --- Utils ---
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const dropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

// --- Components ---

const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen }: SidebarProps) => {
  const links = [
    { id: "tasks", label: "Tasks", icon: LayoutDashboard },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full bg-surface border-r border-border z-50 transition-all duration-300 ease-in-out",
        // Width handling: 
        // Mobile: w-64 (default)
        // Tablet: w-20 
        // Desktop: w-64
        "w-64 md:w-20 lg:w-64",
        // Visibility handling:
        // Mobile: translate based on isOpen
        // Desktop: always translate-0
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0 md:shadow-none"
      )}>
        <div className="p-6 flex items-center justify-between md:justify-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-primary/20">
              Z
            </div>
            <span className={cn("font-bold text-lg tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 md:hidden lg:block")}>
              Owen Zen
            </span>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <nav className="mt-8 px-3 space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => {
                  setActiveTab(link.id);
                  setIsOpen(false); // Close on mobile select
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative",
                  isActive ? "bg-primary/10 text-primary" : "text-gray-400 hover:bg-surface-hover hover:text-white",
                  // Center icon on tablet where text is hidden
                  "md:justify-center lg:justify-start"
                )}
              >
                <Icon size={20} className={cn("shrink-0 transition-colors", isActive && "text-primary")} />
                <span className={cn("font-medium whitespace-nowrap overflow-hidden transition-all duration-300 md:hidden lg:block")}>
                  {link.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute left-0 w-1 h-6 bg-primary rounded-r-full md:left-1"
                  />
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

interface TaskItemProps {
  task: Task;
  onUpdate?: (id: string, status: TaskStatus) => void;
  onDelete?: (id: string) => void;
  isOverlay?: boolean;
}

const TaskItem = ({ task, onUpdate, onDelete, isOverlay }: TaskItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    data: {
      type: "Task",
      task,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const statusColors = {
    "pending": "text-gray-500",
    "in-progress": "text-yellow-500",
    "completed": "text-green-500 line-through opacity-50"
  };

  const nextStatus: Record<TaskStatus, TaskStatus> = {
    "pending": "in-progress",
    "in-progress": "completed",
    "completed": "pending"
  };

  if (isOverlay) {
    return (
      <div
        className="flex items-center justify-between p-4 bg-surface-hover border border-primary/50 shadow-2xl rounded-xl cursor-grabbing"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={cn("p-2 rounded-full transition-colors shrink-0", statusColors[task.status])}>
            {task.status === "completed" ? <Check size={20} /> : task.status === "in-progress" ? <Clock size={20} /> : <Circle size={20} />}
          </div>
          <span className={cn("text-sm md:text-base font-medium transition-all break-words", task.status === "completed" && "text-gray-500 line-through")}>
            {task.title}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center justify-between p-4 bg-surface hover:bg-surface-hover border border-border rounded-xl transition-colors mb-3 touch-manipulation",
        isDragging ? "opacity-30" : "opacity-100"
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div {...attributes} {...listeners} className="cursor-grab touch-none text-gray-600 hover:text-gray-300">
          <GripVertical size={16} />
        </div>
        <button
          onClick={() => onUpdate && onUpdate(task._id, nextStatus[task.status])}
          className={cn("p-2 rounded-full hover:bg-white/5 transition-colors shrink-0", statusColors[task.status])}
        >
          {task.status === "completed" ? <Check size={20} /> : task.status === "in-progress" ? <Clock size={20} /> : <Circle size={20} />}
        </button>
        <span className={cn("text-sm md:text-base font-medium transition-all break-words", task.status === "completed" && "text-gray-500 line-through")}>
          {task.title}
        </span>
      </div>
      <button
        onClick={() => onDelete && onDelete(task._id)}
        className="p-2 text-gray-500 hover:text-red-500 md:opacity-0 md:group-hover:opacity-100 transition-all shrink-0"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};


// --- Container Component ---
const TaskColumn = ({ id, title, tasks, onUpdate, onDelete }: {
  id: TaskStatus,
  title: string,
  tasks: Task[],
  onUpdate: (id: string, status: TaskStatus) => void,
  onDelete: (id: string) => void
}) => {
  const { setNodeRef } = useSortable({
    id: id,
    data: {
      type: "Column",
      status: id,
    },
  });

  return (
    <div ref={setNodeRef} className="flex-1 min-w-[300px] flex flex-col h-full bg-surface/30 rounded-2xl p-4 border border-white/5">
      <h3 className={cn(
        "text-sm font-semibold mb-4 uppercase tracking-wider flex items-center gap-2",
        id === "pending" ? "text-gray-400" :
          id === "in-progress" ? "text-yellow-500" :
            "text-green-500"
      )}>
        {id === "pending" && <Circle size={16} />}
        {id === "in-progress" && <Clock size={16} />}
        {id === "completed" && <Check size={16} />}
        {title}
        <span className="ml-auto bg-white/5 px-2 py-0.5 rounded text-xs text-gray-500">{tasks.length}</span>
      </h3>

      <div className="flex-1 overflow-y-auto min-h-[100px]">
        <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskItem key={task._id} task={task} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="h-full flex items-center justify-center text-gray-700 text-sm border-2 border-dashed border-white/5 rounded-xl p-4">
            Drop items here
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [activeTab, setActiveTab] = useState("tasks");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDragTask, setActiveDragTask] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requires 5px of movement to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load from API
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch("/api/tasks");

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const json = await res.json();
        if (json.success) {
          setTasks(json.data);
        }
      } catch (error: any) {
        console.error("Failed to fetch tasks", error);
        setError(error.message || "Failed to load tasks");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTask }),
      });
      const json = await res.json();

      if (json.success) {
        setTasks([json.data, ...tasks]);
        setNewTask("");
      }
    } catch (error) {
      console.error("Failed to add task", error);
    }
  };

  const updateTaskStatus = async (id: string, status: TaskStatus) => {
    // Optimistic update
    const oldTasks = [...tasks];
    setTasks(prev => prev.map(t => t._id === id ? { ...t, status } : t));

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        setTasks(oldTasks); // Revert on failure
      }
    } catch {
      setTasks(oldTasks);
    }
  };

  const deleteTask = async (id: string) => {
    const oldTasks = [...tasks];
    setTasks(tasks.filter(t => t._id !== id));

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setTasks(oldTasks);
      }
    } catch {
      setTasks(oldTasks);
    }
  };

  // Drag Handlers
  const onDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t._id === active.id);
    if (task) setActiveDragTask(task);
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const isActiveTask = active.data.current?.type === "Task";
    const isOverTask = over.data.current?.type === "Task";
    const isOverColumn = over.data.current?.type === "Column";

    if (!isActiveTask) return;

    // Moving a task over another task
    if (isActiveTask && isOverTask) {
      const activeTaskIndex = tasks.findIndex(t => t._id === activeId);
      const overTaskIndex = tasks.findIndex(t => t._id === overId);
      const activeTask = tasks[activeTaskIndex];
      const overTask = tasks[overTaskIndex];

      if (activeTask && overTask && activeTask.status !== overTask.status) {
        // Optimistically update status if dragging into a new list
        const updatedTasks = [...tasks];
        updatedTasks[activeTaskIndex].status = overTask.status;
        // Also reorder if needed, but dnd-kit arrayMove does that mostly onDragEnd
        // But for visual feedback across columns we need to change state here
        setTasks(arrayMove(updatedTasks, activeTaskIndex, overTaskIndex));
      }
    }

    // Moving a task over a column
    if (isActiveTask && isOverColumn) {
      const activeTaskIndex = tasks.findIndex(t => t._id === activeId);
      const activeTask = tasks[activeTaskIndex];
      const overColumnStatus = over.data.current?.status as TaskStatus;

      if (activeTask && activeTask.status !== overColumnStatus) {
        const updatedTasks = [...tasks];
        updatedTasks[activeTaskIndex].status = overColumnStatus;
        setTasks(updatedTasks);
      }
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveDragTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeIndex = tasks.findIndex((t) => t._id === activeId);
    const overIndex = tasks.findIndex((t) => t._id === overId);

    if (activeIndex !== -1) {
      // If the task status changed, we need to persist it
      const task = tasks[activeIndex];

      // Reorder if indices are different
      if (activeIndex !== overIndex) {
        setTasks((items) => arrayMove(items, activeIndex, overIndex));
      }

      // Ensure backend is updated with the final status
      // Note: onDragOver might have already updated the local state 'status'
      // We just need to ensure the backend knows.
      updateTaskStatus(task._id, task.status);
    }
  };


  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className={cn(
        "flex-1 transition-all duration-300 p-4 md:p-6 overflow-y-hidden flex flex-col h-screen w-full",
        "md:ml-20 lg:ml-64"
      )}>
        {/* Header */}
        <header className="flex items-center justify-between mb-6 shrink-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">Board</h1>
            <p className="text-sm md:text-base text-gray-400">Manage your tasks.</p>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-2 bg-surface border border-border rounded-lg text-gray-300 hover:text-white active:scale-95 transition-all"
          >
            <Menu size={24} />
          </button>
        </header>

        {/* Input */}
        <div className="max-w-3xl mx-auto w-full mb-6 shrink-0">
          <form onSubmit={addTask} className="relative">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full bg-surface border border-border rounded-xl pl-4 pr-14 py-3 md:px-6 md:py-4 md:pr-16 text-base md:text-lg focus:outline-none focus:border-primary transition-colors placeholder:text-gray-600"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 bottom-2 aspect-square bg-primary text-white rounded-lg flex items-center justify-center hover:brightness-110 transition-all active:scale-95"
            >
              <Plus size={20} className="md:w-6 md:h-6" />
            </button>
          </form>
        </div>

        {activeTab === "tasks" && (
          <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragEnd={onDragEnd}
            >
              {error ? (
                <div className="text-center py-8 text-red-400 w-full flex flex-col items-center gap-2">
                  <p>{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="text-sm underline hover:text-red-300"
                  >
                    Click to retry
                  </button>
                </div>
              ) : isLoading ? (
                <div className="text-center py-8 text-gray-500 w-full">Loading tasks...</div>
              ) : (
                <div className="flex gap-6 h-full min-w-max pb-8 md:pb-0 px-1">
                  <TaskColumn
                    id="pending"
                    title="To Do"
                    tasks={tasks.filter(t => t.status === "pending")}
                    onUpdate={updateTaskStatus}
                    onDelete={deleteTask}
                  />
                  <TaskColumn
                    id="in-progress"
                    title="In Progress"
                    tasks={tasks.filter(t => t.status === "in-progress")}
                    onUpdate={updateTaskStatus}
                    onDelete={deleteTask}
                  />
                  <TaskColumn
                    id="completed"
                    title="Completed"
                    tasks={tasks.filter(t => t.status === "completed")}
                    onUpdate={updateTaskStatus}
                    onDelete={deleteTask}
                  />
                </div>
              )}

              <DragOverlay dropAnimation={dropAnimation}>
                {activeDragTask ? (
                  <TaskItem task={activeDragTask} isOverlay />
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        )}

        {activeTab === "calendar" && (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            Calendar Module Coming Soon...
          </div>
        )}
      </main>
    </div>
  );
}
