"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, LayoutDashboard, Calendar, Settings, Menu, X, Target, Crosshair, TrendingUp, Users, Share2, Twitter, Linkedin, Instagram, Palette, GripVertical, AlertCircle, AlertTriangle, ArrowDown, MoreVertical, Archive, ArrowRightCircle, Edit2, ChevronDown, Check, Clock, Trash2, Circle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// --- Types ---
type TaskStatus = "pending" | "in-progress" | "completed";
type TaskPriority = "high" | "medium" | "low";

interface Task {
  _id: string; 
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  order: number;
  isArchived?: boolean;
}

interface Wallet {
  _id: string;
  address: string;
  alias: string;
  winRate: number;
  tags: string[];
}

interface Post {
  _id: string;
  content: string;
  platforms: string[];
  status: 'draft' | 'scheduled' | 'published';
  scheduledFor?: string;
}

// --- Utils ---
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen }: any) => {
  const links = [
    { id: "tasks", label: "Focus Board", icon: LayoutDashboard },
    { id: "archive", label: "Archive", icon: Archive },
    { id: "sniper", label: "Sniper System", icon: Target },
    { id: "socials", label: "Social Hub", icon: Share2 },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

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
                  setIsOpen(false);
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

// --- Sortable Task Item with Edit & Menu ---
const SortableTaskItem = ({ 
  task, 
  onDelete, 
  onUpdateStatus, 
  onEdit, 
  onArchive 
}: { 
  task: Task; 
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onArchive: (id: string) => void;
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
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityColors = {
    "high": "border-l-4 border-red-500",
    "medium": "border-l-4 border-yellow-500",
    "low": "border-l-4 border-blue-500"
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center justify-between p-4 bg-surface hover:bg-surface-hover border border-border rounded-r-xl transition-colors mb-3 relative",
        priorityColors[task.priority] || priorityColors["medium"]
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button {...attributes} {...listeners} className="p-2 cursor-grab active:cursor-grabbing text-gray-500 hover:text-white shrink-0">
          <GripVertical size={16} />
        </button>
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <span className={cn("text-sm md:text-base font-medium transition-all break-words leading-relaxed pr-2", task.status === "completed" && "text-gray-500 line-through")}>
            {task.title}
          </span>
          <div className="flex items-center gap-2 md:hidden">
             <span className={cn("text-[10px] uppercase font-bold", task.priority === 'high' ? "text-red-500" : task.priority === 'medium' ? "text-yellow-500" : "text-blue-500")}>
               {task.priority}
             </span>
          </div>
        </div>
      </div>
      
      {/* Desktop Priority Badge */}
      <div className="hidden md:flex items-center gap-2 mr-2">
         <span className={cn(
             "text-[10px] uppercase font-bold px-2 py-1 rounded bg-white/5",
             task.priority === 'high' ? "text-red-500" : task.priority === 'medium' ? "text-yellow-500" : "text-blue-500"
         )}>
             {task.priority}
         </span>
      </div>

      {/* Menu Trigger */}
      <div className="relative" ref={menuRef}>
        <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-white/5">
          <MoreVertical size={18} />
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
                <button onClick={() => handleMenuAction(() => onEdit(task))} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-lg text-left">
                  <Edit2 size={14} /> Edit Task
                </button>
                <div className="h-px bg-border my-1" />
                <div className="px-3 py-1 text-[10px] text-gray-500 uppercase font-bold">Move To</div>
                <button onClick={() => handleMenuAction(() => onUpdateStatus(task._id, "pending"))} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-lg text-left">
                  <Circle size={14} /> Backlog
                </button>
                <button onClick={() => handleMenuAction(() => onUpdateStatus(task._id, "in-progress"))} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-lg text-left">
                  <Clock size={14} /> In Focus
                </button>
                <button onClick={() => handleMenuAction(() => onUpdateStatus(task._id, "completed"))} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-lg text-left">
                  <Check size={14} /> Done
                </button>
                <div className="h-px bg-border my-1" />
                {task.status === "completed" && (
                   <button onClick={() => handleMenuAction(() => onArchive(task._id))} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-yellow-500 hover:bg-yellow-500/10 rounded-lg text-left">
                     <Archive size={14} /> Archive
                   </button>
                )}
                <button onClick={() => handleMenuAction(() => onDelete(task._id))} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg text-left">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- Edit Modal ---
const EditTaskModal = ({ task, onClose, onSave }: { task: Task | null, onClose: () => void, onSave: (id: string, title: string, priority: TaskPriority) => void }) => {
  const [title, setTitle] = useState(task?.title || "");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || "medium");

  if (!task) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-surface border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl">
        <h3 className="text-lg font-bold mb-4">Edit Task</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase text-gray-500 font-bold mb-2 block">Title</label>
            <textarea 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className="w-full bg-background border border-border rounded-xl p-3 focus:border-primary outline-none min-h-[100px] resize-none"
            />
          </div>
          <div>
            <label className="text-xs uppercase text-gray-500 font-bold mb-2 block">Priority</label>
            <div className="grid grid-cols-3 gap-2">
              {(['high', 'medium', 'low'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium border transition-all capitalize",
                    priority === p 
                      ? p === 'high' ? "bg-red-500/20 border-red-500 text-red-500" : p === 'medium' ? "bg-yellow-500/20 border-yellow-500 text-yellow-500" : "bg-blue-500/20 border-blue-500 text-blue-500"
                      : "border-border text-gray-400 hover:bg-white/5"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-3 rounded-xl border border-border text-gray-400 hover:bg-white/5 transition-colors">Cancel</button>
            <button onClick={() => onSave(task._id, title, priority)} className="flex-1 px-4 py-3 rounded-xl bg-primary text-white hover:brightness-110 transition-all font-medium">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
};


// ... SettingsView, SniperView, SocialHubView (Unchanged) ...
const SettingsView = () => {
    const setTheme = (theme: string) => {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    };
  
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Palette className="text-primary" /> Theme
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={() => setTheme('')} className="p-4 rounded-lg border border-border hover:border-primary transition-all text-left group">
              <div className="w-full h-24 bg-[#0a0a0a] rounded-md mb-3 border border-[#333] relative overflow-hidden group-hover:scale-105 transition-transform">
                <div className="absolute top-2 left-2 w-8 h-8 rounded bg-[#b02222]"></div>
              </div>
              <div className="font-medium">Zen (Default)</div>
              <div className="text-xs text-gray-500">Dark, Red Accents</div>
            </button>
            
            <button onClick={() => setTheme('cyberpunk')} className="p-4 rounded-lg border border-border hover:border-primary transition-all text-left group">
              <div className="w-full h-24 bg-[#0f0a1e] rounded-md mb-3 border border-[#4c1d95] relative overflow-hidden group-hover:scale-105 transition-transform">
                <div className="absolute top-2 left-2 w-8 h-8 rounded bg-[#d946ef]"></div>
              </div>
              <div className="font-medium">Cyberpunk</div>
              <div className="text-xs text-gray-500">Neon Purple & Pink</div>
            </button>
  
            <button onClick={() => setTheme('matrix')} className="p-4 rounded-lg border border-border hover:border-primary transition-all text-left group">
              <div className="w-full h-24 bg-[#000000] rounded-md mb-3 border border-[#003b00] relative overflow-hidden group-hover:scale-105 transition-transform">
                <div className="absolute top-2 left-2 w-8 h-8 rounded bg-[#008f11]"></div>
              </div>
              <div className="font-medium">Matrix</div>
              <div className="text-xs text-gray-500">Terminal Green</div>
            </button>
          </div>
        </div>
      </div>
    );
};
const SniperView = () => <div className="p-12 text-center text-gray-500">Sniper View (Loaded)</div>;
const SocialHubView = () => <div className="p-12 text-center text-gray-500">Social Hub (Loaded)</div>;

const ArchiveView = ({ tasks, onRestore, onDelete }: { tasks: Task[], onRestore: (id: string) => void, onDelete: (id: string) => void }) => {
    const archivedTasks = tasks.filter(t => t.isArchived);
    
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-400">
                <Archive className="text-gray-500" /> Archived Tasks
            </h2>
            
            {archivedTasks.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-xl text-gray-600">
                    Archive is empty.
                </div>
            ) : (
                <div className="grid gap-3">
                    {archivedTasks.map(task => (
                        <div key={task._id} className="bg-surface/50 border border-border p-4 rounded-xl flex justify-between items-center opacity-70 hover:opacity-100 transition-opacity">
                            <span className="text-gray-400 line-through">{task.title}</span>
                            <div className="flex gap-2">
                                <button onClick={() => onRestore(task._id)} className="p-2 text-primary hover:bg-primary/10 rounded-lg text-xs font-bold uppercase">
                                    Restore
                                </button>
                                <button onClick={() => onDelete(task._id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// --- Kanban Board Component ---
const TaskBoard = ({ 
    tasks, 
    setTasks, 
    onUpdateStatus,
    onDelete,
    onEdit,
    onArchive
}: { 
    tasks: Task[], 
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
    onUpdateStatus: (id: string, status: TaskStatus) => void,
    onDelete: (id: string) => void,
    onEdit: (task: Task) => void,
    onArchive: (id: string) => void
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

    const activeTask = tasks.find(t => t._id === activeId);
    let newStatus: TaskStatus | undefined;
    
    if (["pending", "in-progress", "completed"].includes(overId)) {
        newStatus = overId as TaskStatus;
    } else {
        const overTask = tasks.find(t => t._id === overId);
        if (overTask) newStatus = overTask.status;
    }

    if (!activeTask || !newStatus) return;

    let newTasks = [...tasks];

    if (activeTask.status !== newStatus) {
        activeTask.status = newStatus;
    }
    
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
    { id: "completed", title: "Done" }
  ];

  // Only show non-archived tasks
  const visibleTasks = tasks.filter(t => !t.isArchived);

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map(col => (
          <div key={col.id} className="bg-surface/30 p-4 rounded-xl border border-border min-h-[200px] md:min-h-[500px]">
            <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider flex justify-between">
                {col.title}
                <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs text-white">
                    {visibleTasks.filter(t => t.status === col.id).length}
                </span>
            </h3>
            <SortableContext 
              items={visibleTasks.filter(t => t.status === col.id).map(t => t._id)} 
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {visibleTasks.filter(t => t.status === col.id).map(task => (
                  <SortableTaskItem 
                    key={task._id} 
                    task={task} 
                    onDelete={onDelete}
                    onUpdateStatus={onUpdateStatus}
                    onEdit={onEdit}
                    onArchive={onArchive}
                  />
                ))}
              </div>
            </SortableContext>
          </div>
        ))}
      </div>
      
      <DragOverlay>
        {activeId ? (
            <div className="p-4 bg-surface border border-primary rounded-xl shadow-2xl opacity-90 cursor-grabbing">
                {tasks.find(t => t._id === activeId)?.title}
            </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("medium");
  const [activeTab, setActiveTab] = useState("tasks");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Load Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // Load Tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch("/api/tasks");
        const json = await res.json();
        if (json.success) setTasks(json.data);
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
        body: JSON.stringify({ title: newTask, priority: newPriority }),
      });
      const json = await res.json();
      if (json.success) {
        setTasks([...tasks, json.data]);
        setNewTask("");
        setNewPriority("medium");
      }
    } catch (error) {
      console.error("Failed to add task", error);
    }
  };

  const updateTaskStatus = async (id: string, status: TaskStatus) => {
    const oldTasks = [...tasks];
    setTasks(tasks.map(t => t._id === id ? { ...t, status } : t));
    try {
      await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch {
      setTasks(oldTasks);
    }
  };

  const saveEditTask = async (id: string, title: string, priority: TaskPriority) => {
      const oldTasks = [...tasks];
      setTasks(tasks.map(t => t._id === id ? { ...t, title, priority } : t));
      setEditingTask(null);

      try {
        await fetch(`/api/tasks/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, priority }),
        });
      } catch {
        setTasks(oldTasks);
      }
  };

  const archiveTask = async (id: string) => {
      const oldTasks = [...tasks];
      setTasks(tasks.map(t => t._id === id ? { ...t, isArchived: true } : t));
      
      try {
        await fetch(`/api/tasks/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isArchived: true }),
        });
      } catch {
        setTasks(oldTasks);
      }
  };

  const restoreTask = async (id: string) => {
      const oldTasks = [...tasks];
      setTasks(tasks.map(t => t._id === id ? { ...t, isArchived: false } : t));
      
      try {
        await fetch(`/api/tasks/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isArchived: false }),
        });
      } catch {
        setTasks(oldTasks);
      }
  };

  const deleteTask = async (id: string) => {
    const oldTasks = [...tasks];
    setTasks(tasks.filter(t => t._id !== id));
    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    } catch {
      setTasks(oldTasks);
    }
  };

  const stats = {
    pending: tasks.filter(t => t.status === "pending" && !t.isArchived).length,
    inProgress: tasks.filter(t => t.status === "in-progress" && !t.isArchived).length,
    completed: tasks.filter(t => t.status === "completed" && !t.isArchived).length,
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      {/* Edit Modal */}
      <AnimatePresence>
        {editingTask && (
            <EditTaskModal 
                task={editingTask} 
                onClose={() => setEditingTask(null)} 
                onSave={saveEditTask} 
            />
        )}
      </AnimatePresence>

      <main className={cn(
        "flex-1 transition-all duration-300 p-4 md:p-8 overflow-y-auto h-screen w-full",
        "md:ml-20 lg:ml-64"
      )}>
        {/* Header */}
        <header className="flex items-center justify-between mb-8 md:mb-12">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">
              {activeTab === 'sniper' ? 'Sniper Command' : activeTab === 'socials' ? 'Social HQ' : activeTab === 'settings' ? 'System Settings' : activeTab === 'archive' ? 'The Vault' : 'Good Morning, Owen.'}
            </h1>
            <p className="text-sm md:text-base text-gray-400">
              {activeTab === 'sniper' ? 'Tracking Smart Money flows.' : activeTab === 'archive' ? 'History of executed tasks.' : "Let's stay focused today."}
            </p>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-2 bg-surface border border-border rounded-lg text-gray-300 hover:text-white"
          >
            <Menu size={24} />
          </button>
        </header>

        {activeTab === "tasks" && (
          <div className="max-w-6xl mx-auto pb-20">
            <form onSubmit={addTask} className="mb-8 max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full bg-surface border border-border rounded-xl pl-4 pr-32 py-3 md:px-6 md:py-4 md:pr-36 text-base md:text-lg focus:outline-none focus:border-primary transition-colors placeholder:text-gray-600"
                />
                
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <select 
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    className={cn(
                      "appearance-none bg-surface-hover border border-border rounded-lg px-2 py-1 text-xs font-bold uppercase outline-none cursor-pointer hover:border-primary transition-all",
                      newPriority === 'high' ? "text-red-500" : newPriority === 'medium' ? "text-yellow-500" : "text-blue-500"
                    )}
                  >
                    <option value="high">High</option>
                    <option value="medium">Med</option>
                    <option value="low">Low</option>
                  </select>
                  <button
                    type="submit"
                    className="aspect-square bg-primary text-white rounded-lg p-2 flex items-center justify-center hover:brightness-110 transition-all active:scale-95"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </form>

            {isLoading ? (
                <div className="text-center py-8 text-gray-500">Loading Board...</div>
            ) : (
                <TaskBoard 
                    tasks={tasks} 
                    setTasks={setTasks} 
                    onUpdateStatus={updateTaskStatus}
                    onDelete={deleteTask}
                    onEdit={setEditingTask}
                    onArchive={archiveTask}
                />
            )}
          </div>
        )}

        {activeTab === "archive" && <ArchiveView tasks={tasks} onRestore={restoreTask} onDelete={deleteTask} />}
        {activeTab === "sniper" && <SniperView />}
        {activeTab === "socials" && <SocialHubView />}
        {activeTab === "settings" && <SettingsView />}

        {activeTab === "calendar" && (
          <div className="flex items-center justify-center h-96 text-gray-500 text-sm">
            Calendar Module Coming Soon...
          </div>
        )}
      </main>
    </div>
  );
}
