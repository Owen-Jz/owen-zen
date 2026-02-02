"use client";

import { useState, useEffect } from "react";
import { Plus, LayoutDashboard, Calendar, Settings, Menu, X, Target, Crosshair, TrendingUp, Users, Share2, Twitter, Linkedin, Instagram, Palette, GripVertical, AlertCircle, AlertTriangle, ArrowDown } from "lucide-react";
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
  defaultDropAnimationSideEffects,
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

// --- Sortable Item Component ---
const SortableTaskItem = ({ task, onDelete }: { task: Task; onDelete: (id: string) => void }) => {
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

  const priorityBadge = {
    "high": <AlertCircle size={14} className="text-red-500" />,
    "medium": <AlertTriangle size={14} className="text-yellow-500" />,
    "low": <ArrowDown size={14} className="text-blue-500" />
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center justify-between p-4 bg-surface hover:bg-surface-hover border border-border rounded-r-xl transition-colors mb-3 touch-manipulation",
        priorityColors[task.priority] || priorityColors["medium"]
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button {...attributes} {...listeners} className="p-2 cursor-grab active:cursor-grabbing text-gray-500 hover:text-white shrink-0">
          <GripVertical size={16} />
        </button>
        <div className="flex flex-col gap-1 min-w-0">
          <span className={cn("text-sm md:text-base font-medium transition-all break-words leading-relaxed pr-2", task.status === "completed" && "text-gray-500 line-through")}>
            {task.title}
          </span>
          {/* Mobile Priority Indicator */}
          <div className="flex items-center gap-1 md:hidden">
            {priorityBadge[task.priority]}
            <span className="text-[10px] uppercase text-gray-500 font-bold">{task.priority}</span>
          </div>
        </div>
      </div>
      
      {/* Desktop Priority Badge */}
      <div className="hidden md:flex items-center gap-2 mr-4">
         <span className={cn(
             "text-[10px] uppercase font-bold px-2 py-1 rounded bg-white/5",
             task.priority === 'high' ? "text-red-500" : task.priority === 'medium' ? "text-yellow-500" : "text-blue-500"
         )}>
             {task.priority}
         </span>
      </div>
    </div>
  );
};


// --- Components ---
// ... Sidebar, SettingsView, SniperView, SocialHubView (Unchanged) ...

const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen }: any) => {
    const links = [
      { id: "tasks", label: "Focus Board", icon: LayoutDashboard },
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

const SniperView = () => (
    <div className="p-12 text-center text-gray-500">Sniper View (Loaded)</div>
);
const SocialHubView = () => (
    <div className="p-12 text-center text-gray-500">Social Hub (Loaded)</div>
);

// --- Kanban Board Component ---
const TaskBoard = ({ tasks, setTasks }: { tasks: Task[], setTasks: React.Dispatch<React.SetStateAction<Task[]>> }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), // Add delay to prevent accidental drags on mobile
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
            tasks: newTasks.map(t => ({ _id: t._id, order: t.order, status: t.status })) 
        }),
    });
  };

  const columns: { id: TaskStatus; title: string }[] = [
    { id: "pending", title: "Backlog" },
    { id: "in-progress", title: "In Focus" },
    { id: "completed", title: "Done" }
  ];

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
                    {tasks.filter(t => t.status === col.id).length}
                </span>
            </h3>
            <SortableContext 
              items={tasks.filter(t => t.status === col.id).map(t => t._id)} 
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {tasks.filter(t => t.status === col.id).map(task => (
                  <SortableTaskItem key={task._id} task={task} onDelete={(id) => setTasks(tasks.filter(t => t._id !== id))} />
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
        setNewPriority("medium"); // Reset priority
      }
    } catch (error) {
      console.error("Failed to add task", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className={cn(
        "flex-1 transition-all duration-300 p-4 md:p-8 overflow-y-auto h-screen w-full",
        "md:ml-20 lg:ml-64"
      )}>
        {/* Header */}
        <header className="flex items-center justify-between mb-8 md:mb-12">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">
              {activeTab === 'sniper' ? 'Sniper Command' : activeTab === 'socials' ? 'Social HQ' : activeTab === 'settings' ? 'System Settings' : 'Good Morning, Owen.'}
            </h1>
            <p className="text-sm md:text-base text-gray-400">
              {activeTab === 'sniper' ? 'Tracking Smart Money flows.' : activeTab === 'settings' ? 'Customize your workspace.' : "Let's stay focused today."}
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
                <TaskBoard tasks={tasks} setTasks={setTasks} />
            )}
          </div>
        )}

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
