"use client";

import { useState, useEffect } from "react";
import { Plus, Check, Circle, Clock, Trash2, LayoutDashboard, Calendar, Settings, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// --- Types ---
type TaskStatus = "pending" | "in-progress" | "completed";

interface Task {
  _id: string; // MongoDB uses _id
  title: string;
  status: TaskStatus;
  createdAt: string;
}

// --- Utils ---
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen }: any) => {
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
          "fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full bg-surface border-r border-border transition-transform duration-300 z-50 w-64",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-20 lg:w-64"
      )}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white font-bold shrink-0">
              Z
            </div>
            <span className={cn("font-bold text-lg tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 md:hidden lg:block")}>
              Owen Zen
            </span>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-400 hover:text-white">
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
                  isActive ? "bg-primary/10 text-primary" : "text-gray-400 hover:bg-surface-hover hover:text-white"
                )}
              >
                <Icon size={20} className={cn("shrink-0", isActive && "text-primary")} />
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
      </div>
    </>
  );
};

const TaskItem = ({ task, onUpdate, onDelete }: { task: Task; onUpdate: (id: string, status: TaskStatus) => void; onDelete: (id: string) => void }) => {
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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group flex items-center justify-between p-4 bg-surface hover:bg-surface-hover border border-border rounded-xl transition-colors mb-3 touch-manipulation"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={() => onUpdate(task._id, nextStatus[task.status])}
          className={cn("p-2 rounded-full hover:bg-white/5 transition-colors shrink-0", statusColors[task.status])}
        >
          {task.status === "completed" ? <Check size={20} /> : task.status === "in-progress" ? <Clock size={20} /> : <Circle size={20} />}
        </button>
        <span className={cn("text-sm md:text-base font-medium transition-all truncate", task.status === "completed" && "text-gray-500 line-through")}>
          {task.title}
        </span>
      </div>
      <button
        onClick={() => onDelete(task._id)}
        className="p-2 text-gray-500 hover:text-red-500 md:opacity-0 md:group-hover:opacity-100 transition-all shrink-0"
      >
        <Trash2 size={18} />
      </button>
    </motion.div>
  );
};

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [activeTab, setActiveTab] = useState("tasks");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Closed by default on mobile
  const [isLoading, setIsLoading] = useState(true);

  // Load from API
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch("/api/tasks");
        const json = await res.json();
        if (json.success) {
          setTasks(json.data);
        }
      } catch (error) {
        console.error("Failed to fetch tasks", error);
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

  const updateTask = async (id: string, status: TaskStatus) => {
    const oldTasks = [...tasks];
    setTasks(tasks.map(t => t._id === id ? { ...t, status } : t));

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        setTasks(oldTasks);
      }
    } catch (error) {
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
    } catch (error) {
      setTasks(oldTasks);
    }
  };

  const stats = {
    pending: tasks.filter(t => t.status === "pending").length,
    inProgress: tasks.filter(t => t.status === "in-progress").length,
    completed: tasks.filter(t => t.status === "completed").length,
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className={cn(
        "flex-1 transition-all duration-300 p-4 md:p-8 overflow-y-auto h-screen w-full",
        "md:ml-20 lg:ml-64" // Fixed margin for desktop sidebar widths
      )}>
        {/* Header */}
        <header className="flex items-center justify-between mb-8 md:mb-12">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Good Morning, Owen.</h1>
            <p className="text-sm md:text-base text-gray-400">Let's stay focused today.</p>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-2 bg-surface border border-border rounded-lg text-gray-300 hover:text-white active:scale-95 transition-all"
          >
            <Menu size={24} />
          </button>
        </header>

        {activeTab === "tasks" && (
          <div className="max-w-3xl mx-auto pb-20"> {/* Added pb-20 for mobile bottom spacing */}
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6 md:mb-8">
              <div className="bg-surface border border-border p-3 md:p-4 rounded-xl text-center">
                <div className="text-xl md:text-2xl font-bold text-white mb-1">{stats.pending}</div>
                <div className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider">To Do</div>
              </div>
              <div className="bg-surface border border-border p-3 md:p-4 rounded-xl text-center">
                <div className="text-xl md:text-2xl font-bold text-yellow-500 mb-1">{stats.inProgress}</div>
                <div className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider">In Focus</div>
              </div>
              <div className="bg-surface border border-border p-3 md:p-4 rounded-xl text-center">
                <div className="text-xl md:text-2xl font-bold text-green-500 mb-1">{stats.completed}</div>
                <div className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider">Done</div>
              </div>
            </div>

            {/* Input */}
            <form onSubmit={addTask} className="mb-6 md:mb-8 relative">
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

            {/* Task List */}
            {isLoading ? (
                <div className="text-center py-8 text-gray-500">Loading tasks...</div>
            ) : (
                <div className="space-y-6">
                {stats.inProgress > 0 && (
                    <div>
                    <h3 className="text-xs md:text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider pl-1">In Focus</h3>
                    <div className="space-y-2">
                        <AnimatePresence>
                        {tasks.filter(t => t.status === "in-progress").map(task => (
                            <TaskItem key={task._id} task={task} onUpdate={updateTask} onDelete={deleteTask} />
                        ))}
                        </AnimatePresence>
                    </div>
                    </div>
                )}

                <div>
                    <h3 className="text-xs md:text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider pl-1">Backlog</h3>
                    <div className="space-y-2">
                    <AnimatePresence>
                        {tasks.filter(t => t.status === "pending").map(task => (
                        <TaskItem key={task._id} task={task} onUpdate={updateTask} onDelete={deleteTask} />
                        ))}
                        {tasks.filter(t => t.status === "pending").length === 0 && (
                        <div className="text-center py-8 text-gray-600 italic text-sm">No pending tasks. Clear mind. 🧘‍♂️</div>
                        )}
                    </AnimatePresence>
                    </div>
                </div>

                {stats.completed > 0 && (
                    <div>
                    <h3 className="text-xs md:text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider pl-1">Completed</h3>
                    <div className="space-y-2">
                        <AnimatePresence>
                        {tasks.filter(t => t.status === "completed").map(task => (
                            <TaskItem key={task._id} task={task} onUpdate={updateTask} onDelete={deleteTask} />
                        ))}
                        </AnimatePresence>
                    </div>
                    </div>
                )}
                </div>
            )}
          </div>
        )}

        {activeTab === "calendar" && (
          <div className="flex items-center justify-center h-96 text-gray-500 text-sm">
            Calendar Module Coming Soon...
          </div>
        )}
      </main>
    </div>
  );
}
