"use client";

import { useState, useEffect } from "react";
import { Plus, Check, Circle, Clock, Trash2, LayoutDashboard, Calendar, Settings, Menu, X, Target, Crosshair, TrendingUp, Users, Share2, Twitter, Linkedin, Instagram } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// --- Types ---
type TaskStatus = "pending" | "in-progress" | "completed";

interface Task {
  _id: string; 
  title: string;
  status: TaskStatus;
  createdAt: string;
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
    { id: "sniper", label: "Sniper System", icon: Target },
    { id: "socials", label: "Social Hub", icon: Share2 },
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

const SniperView = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [newWallet, setNewWallet] = useState("");
  const [newAlias, setNewAlias] = useState("");

  useEffect(() => {
    fetch("/api/wallets")
      .then(res => res.json())
      .then(data => {
        if(data.success) setWallets(data.data);
      });
  }, []);

  const addWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newWallet) return;
    
    const res = await fetch("/api/wallets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: newWallet, alias: newAlias || "Unknown Sniper" }),
    });
    const json = await res.json();
    if(json.success) {
      setWallets([json.data, ...wallets]);
      setNewWallet("");
      setNewAlias("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface border border-border p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Target size={64} />
          </div>
          <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Tracked Wallets</h3>
          <p className="text-3xl font-bold text-white">{wallets.length}</p>
        </div>
        <div className="bg-surface border border-border p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={64} />
          </div>
          <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Alpha Signals</h3>
          <p className="text-3xl font-bold text-green-500">0</p>
        </div>
        <div className="bg-surface border border-border p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Crosshair size={64} />
          </div>
          <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">System Status</h3>
          <p className="text-3xl font-bold text-yellow-500">Standby</p>
        </div>
      </div>

      {/* Add Wallet Form */}
      <div className="bg-surface/50 border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="text-primary" size={20} />
          Add Smart Wallet
        </h2>
        <form onSubmit={addWallet} className="flex flex-col md:flex-row gap-4">
          <input 
            type="text" 
            placeholder="Solana Address (e.g., 5Up...)" 
            className="flex-1 bg-background border border-border rounded-lg px-4 py-3 focus:border-primary outline-none"
            value={newWallet}
            onChange={e => setNewWallet(e.target.value)}
          />
          <input 
            type="text" 
            placeholder="Alias (e.g., 'Insane ROI Guy')" 
            className="md:w-64 bg-background border border-border rounded-lg px-4 py-3 focus:border-primary outline-none"
            value={newAlias}
            onChange={e => setNewAlias(e.target.value)}
          />
          <button type="submit" className="btn-primary">
            Track
          </button>
        </form>
      </div>

      {/* Wallet List */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Targets</h3>
        {wallets.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-xl text-gray-500">
            No wallets tracked yet. Run the Hunter Script to find some.
          </div>
        ) : (
          <div className="grid gap-3">
            {wallets.map(wallet => (
              <div key={wallet._id} className="bg-surface border border-border p-4 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">{wallet.alias}</div>
                  <div className="text-xs text-gray-500 font-mono">{wallet.address}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Win Rate</div>
                    <div className="text-green-500 font-bold">{wallet.winRate}%</div>
                  </div>
                  <button className="text-gray-500 hover:text-red-500"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const SocialHubView = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/posts")
      .then(res => res.json())
      .then(data => { if(data.success) setPosts(data.data); });
  }, []);

  const togglePlatform = (p: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const createDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!content) return;
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, platforms: selectedPlatforms }),
    });
    const json = await res.json();
    if(json.success) {
      setPosts([json.data, ...posts]);
      setContent("");
      setSelectedPlatforms([]);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">Create Content</h2>
        <form onSubmit={createDraft} className="space-y-4">
          <textarea 
            className="w-full bg-background border border-border rounded-lg p-4 h-32 focus:border-primary outline-none resize-none"
            placeholder="What's on your mind?"
            value={content}
            onChange={e => setContent(e.target.value)}
          />
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => togglePlatform('twitter')}
                className={cn("p-2 rounded-lg border", selectedPlatforms.includes('twitter') ? "bg-blue-500/20 border-blue-500 text-blue-500" : "border-border text-gray-500")}
              >
                <Twitter size={20} />
              </button>
              <button 
                type="button"
                onClick={() => togglePlatform('linkedin')}
                className={cn("p-2 rounded-lg border", selectedPlatforms.includes('linkedin') ? "bg-blue-700/20 border-blue-700 text-blue-700" : "border-border text-gray-500")}
              >
                <Linkedin size={20} />
              </button>
              <button 
                type="button"
                onClick={() => togglePlatform('instagram')}
                className={cn("p-2 rounded-lg border", selectedPlatforms.includes('instagram') ? "bg-pink-500/20 border-pink-500 text-pink-500" : "border-border text-gray-500")}
              >
                <Instagram size={20} />
              </button>
            </div>
            <button type="submit" className="btn-primary">Save Draft</button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Queue</h3>
        {posts.map(post => (
          <div key={post._id} className="bg-surface border border-border p-4 rounded-xl">
            <p className="text-white mb-3">{post.content}</p>
            <div className="flex gap-2">
              {post.platforms.map(p => (
                <span key={p} className="text-xs uppercase tracking-wide text-gray-500 bg-white/5 px-2 py-1 rounded">{p}</span>
              ))}
              <span className="ml-auto text-xs text-yellow-500 uppercase">{post.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [activeTab, setActiveTab] = useState("tasks");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
      await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
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
    pending: tasks.filter(t => t.status === "pending").length,
    inProgress: tasks.filter(t => t.status === "in-progress").length,
    completed: tasks.filter(t => t.status === "completed").length,
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
              {activeTab === 'sniper' ? 'Sniper Command' : activeTab === 'socials' ? 'Social HQ' : 'Good Morning, Owen.'}
            </h1>
            <p className="text-sm md:text-base text-gray-400">
              {activeTab === 'sniper' ? 'Tracking Smart Money flows.' : activeTab === 'socials' ? 'Drafting & Scheduling.' : "Let's stay focused today."}
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
          <div className="max-w-3xl mx-auto pb-20">
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

        {activeTab === "sniper" && <SniperView />}
        {activeTab === "socials" && <SocialHubView />}

        {activeTab === "calendar" && (
          <div className="flex items-center justify-center h-96 text-gray-500 text-sm">
            Calendar Module Coming Soon...
          </div>
        )}
      </main>
    </div>
  );
}
