"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Plus, LayoutDashboard, Calendar, Settings, Menu, X, Target, Crosshair, TrendingUp, Users, Share2, Twitter, Linkedin, Instagram, Palette, GripVertical, AlertCircle, AlertTriangle, ArrowDown, MoreVertical, Archive, ArrowRightCircle, Edit2, ChevronDown, Check, Clock, Trash2, Circle, Trophy, Pause } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  DndContext,
  closestCorners,
  closestCenter,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  sortableKeyboardCoordinates,
  SortableContext,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskColumn, SortableTaskItem, TaskCard } from "@/components/TaskColumn";
import { EditTaskModal } from "@/components/EditTaskModal";
import { Task, TaskStatus, TaskPriority, SubTask, TimeLog, ActiveTimer, Board } from "@/types";
import { MITList } from "@/components/MITList";
import { TaskBoard } from "@/components/TaskBoard";
import { HabitView } from "@/components/HabitView";
import { VisionBoardView } from "@/components/VisionBoardView";
import { AnalyticsView } from "@/components/AnalyticsView";
import SandboxDashboard from "@/components/SandboxDashboard";
import { WatchLaterView } from "@/components/WatchLaterView";
import { SocialHubView } from "@/components/SocialHubView";

import { FocusOverlay } from "@/components/FocusOverlay"; // Import Focus Mode
import { CalendarView } from "@/components/CalendarView"; // Import Calendar View
import { RoadmapView } from "@/components/RoadmapView"; // Import Roadmap View
import { NotificationBell } from "@/components/NotificationBell"; // Import Notification Bell

import { TimeTracker } from "@/components/TimeTracker";

// --- Types ---
// Shared types imported from "@/types"

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
  const [isCollapsed, setIsCollapsed] = useState(false);

  const links = [
    { id: "tasks", label: "Focus Board", icon: LayoutDashboard },
    { id: "stats", label: "Stats", icon: TrendingUp }, // Added Stats
    { id: "habits", label: "Habits", icon: Trophy },
    { id: "roadmap", label: "2026 Roadmap", icon: Target }, // Replaced Vision
    { id: "watch", label: "Watch Later", icon: Circle }, // Watch Later
    { id: "archive", label: "Archive", icon: Archive },
    { id: "sniper", label: "Sniper System", icon: Crosshair },
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
        "fixed left-0 top-0 h-full bg-surface/80 backdrop-blur-xl border-r border-white/5 transition-all duration-300 z-50",
        isOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0",
        isCollapsed ? "md:w-20" : "md:w-64"
      )}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 relative shrink-0">
              <Image src="/logo.svg" alt="Owen Zen" fill className="object-contain" />
            </div>
            <span className={cn("font-bold text-lg tracking-tight whitespace-nowrap transition-all duration-300", isCollapsed && "md:hidden")}>
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
                <span className={cn("font-medium whitespace-nowrap overflow-hidden transition-all duration-300", isCollapsed && "md:hidden")}>
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

        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 p-2 bg-surface-hover border border-border rounded-lg hover:bg-white/10 transition-colors"
        >
          <Menu size={16} className="text-gray-400" />
        </button>
      </div>
    </>
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
const SniperView = () => <SandboxDashboard />;
// SocialHubView imported from components


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

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [boards, setBoards] = useState<Board[]>([]); // New: Boards state
  const [currentBoardId, setCurrentBoardId] = useState<string | null>(null); // New: Current Board
  const [isCreatingBoard, setIsCreatingBoard] = useState(false); // New: Create Board UI
  const [newBoardTitle, setNewBoardTitle] = useState(""); // New: New Board Title

  const [newTask, setNewTask] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("medium");
  const [activeTab, setActiveTab] = useState("tasks");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [focusedTask, setFocusedTask] = useState<Task | null>(null); // Focus Mode State
  const [greeting, setGreeting] = useState("Good Morning");
  const [isLofiPlaying, setIsLofiPlaying] = useState(false);
  const [, forceUpdate] = useState(0); // For live timer updates

  // Load Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);

    // Set Greeting (Lagos time: GMT+1)
    const lagosTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
    const hour = lagosTime.getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  // Live timer update for active tasks
  useEffect(() => {
    const hasActiveTimers = tasks.some(t => t.activeTimer?.isActive);
    if (!hasActiveTimers) return;

    const interval = setInterval(() => {
      forceUpdate(prev => prev + 1); // Trigger re-render every second
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks]);

  // Load Boards
  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const res = await fetch("/api/boards");
        const json = await res.json();
        if (json.success) {
          setBoards(json.data);
          // If we have boards and no current board, select the first one?
          // Or keep "All" / "Default" view as null?
          // Let's assume user wants to see specific boards.
          // If no board is selected, maybe default to the first one if available, or keep null for "uncategorized"
          if (json.data.length > 0 && !currentBoardId) {
            // Optional: Auto-select first board
            // setCurrentBoardId(json.data[0]._id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch boards", error);
      }
    };
    fetchBoards();
  }, []); // Run once on mount

  // Load Tasks (DEPENDS ON currentBoardId)
  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const url = currentBoardId ? `/api/tasks?boardId=${currentBoardId}` : "/api/tasks";
        const res = await fetch(url);
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
  }, [currentBoardId]);

  const createBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;
    try {
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newBoardTitle }),
      });
      const json = await res.json();
      if (json.success) {
        setBoards([...boards, json.data]);
        setCurrentBoardId(json.data._id); // Switch to new board
        setNewBoardTitle("");
        setIsCreatingBoard(false);
      }
    } catch (error) {
      console.error("Failed to create board", error);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTask,
          priority: newPriority,
          boardId: currentBoardId // Associate with current board
        }),
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

  const updateTaskPriority = async (id: string, priority: TaskPriority) => {
    const oldTasks = [...tasks];
    setTasks(tasks.map(t => t._id === id ? { ...t, priority } : t));
    try {
      await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority }),
      });
    } catch {
      setTasks(oldTasks);
    }
  };

  const saveEditTask = async (id: string, title: string, description: string, priority: TaskPriority, subtasks: SubTask[]) => {
    const oldTasks = [...tasks];
    setTasks(tasks.map(t => t._id === id ? { ...t, title, description, priority, subtasks } : t));
    setEditingTask(null);

    try {
      await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, priority, subtasks }),
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
    const deletedTask = tasks.find(t => t._id === id);

    // Optimistic update: remove immediately
    setTasks(tasks.filter(t => t._id !== id));

    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      // Success - task stays deleted
    } catch {
      // Rollback on error
      setTasks(oldTasks);
      alert('Failed to delete task. Please try again.');
    }
  };

  const toggleTaskSubtask = async (taskId: string, subtaskIndex: number) => {
    const task = tasks.find(t => t._id === taskId);
    if (!task || !task.subtasks) return;

    const newSubtasks = [...task.subtasks];
    newSubtasks[subtaskIndex].completed = !newSubtasks[subtaskIndex].completed;

    const oldTasks = [...tasks];
    setTasks(tasks.map(t => t._id === taskId ? { ...t, subtasks: newSubtasks } : t));

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtasks: newSubtasks }),
      });
    } catch {
      setTasks(oldTasks);
    }
  };

  const startTimer = async (taskId: string, sessionTitle?: string) => {
    const oldTasks = [...tasks];
    const now = new Date().toISOString();
    // New timer starts with 0 accumulated time
    const newActiveTimer: ActiveTimer = { startedAt: now, isActive: true, sessionTitle, accumulatedTime: 0 };
    setTasks(tasks.map(t => t._id === taskId ? { ...t, activeTimer: newActiveTimer } : t));

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeTimer: newActiveTimer }),
      });
    } catch {
      setTasks(oldTasks);
    }
  };

  const stopTimer = async (taskId: string, note?: string) => {
    const task = tasks.find(t => t._id === taskId);
    if (!task?.activeTimer) return; // Allow stopping even if paused

    const now = new Date().toISOString();
    let duration = (task.activeTimer.accumulatedTime || 0);

    // Add current elapsed time if active
    if (task.activeTimer.isActive && task.activeTimer.startedAt) {
      duration += Math.floor((new Date(now).getTime() - new Date(task.activeTimer.startedAt).getTime()) / 1000);
    }

    // Use original start time if available, or now if weirdly missing
    const originalStart = task.activeTimer.startedAt || now;

    // If note is passed (from UI modal), use it. otherwise fallback to session title
    const finalNote = note !== undefined ? note : task.activeTimer.sessionTitle;

    const newLog: TimeLog = {
      startedAt: originalStart,
      endedAt: now,
      duration,
      note: finalNote
    };

    const newTimeLogs = [...(task.timeLogs || []), newLog];
    const newTotalTime = (task.totalTimeSpent || 0) + duration;

    const oldTasks = [...tasks];
    setTasks(tasks.map(t => t._id === taskId ? {
      ...t,
      timeLogs: newTimeLogs,
      totalTimeSpent: newTotalTime,
      activeTimer: undefined // Timer cleared
    } : t));

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeLogs: newTimeLogs,
          totalTimeSpent: newTotalTime,
          activeTimer: null // Clear on server
        }),
      });
    } catch (error) {
      console.error("Failed to stop timer:", error);
      setTasks(oldTasks);
    }
  };

  const pauseTimer = async (taskId: string) => {
    const task = tasks.find(t => t._id === taskId);
    if (!task?.activeTimer?.isActive || !task.activeTimer.startedAt) return;

    const oldTasks = [...tasks];
    const now = new Date().toISOString();
    const currentElapsed = Math.floor((new Date(now).getTime() - new Date(task.activeTimer.startedAt).getTime()) / 1000);
    const newAccumulated = (task.activeTimer.accumulatedTime || 0) + currentElapsed;

    const updatedActiveTimer: ActiveTimer = {
      ...task.activeTimer,
      isActive: false,
      accumulatedTime: newAccumulated
      // startedAt remains, sessionTitle remains
    };

    setTasks(tasks.map(t => t._id === taskId ? { ...t, activeTimer: updatedActiveTimer } : t));

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeTimer: updatedActiveTimer }),
      });
    } catch {
      setTasks(oldTasks);
    }
  };

  const resumeTimer = async (taskId: string) => {
    const task = tasks.find(t => t._id === taskId);
    if (task?.activeTimer?.isActive) return; // Already running

    const oldTasks = [...tasks];
    const now = new Date().toISOString();

    // Resume: set startedAt to now, keep accumulatedTime
    const updatedActiveTimer: ActiveTimer = {
      ...(task?.activeTimer || { sessionTitle: "Resumed Session", accumulatedTime: 0 }),
      startedAt: now,
      isActive: true,
    };

    setTasks(tasks.map(t => t._id === taskId ? { ...t, activeTimer: updatedActiveTimer } : t));

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeTimer: updatedActiveTimer }),
      });
    } catch {
      setTasks(oldTasks);
    }
  };

  const deleteTimeLog = async (taskId: string, logIndex: number) => {
    const task = tasks.find(t => t._id === taskId);
    if (!task?.timeLogs) return;

    const deletedLog = task.timeLogs[logIndex];
    const newTimeLogs = task.timeLogs.filter((_, i) => i !== logIndex);
    const newTotalTime = (task.totalTimeSpent || 0) - deletedLog.duration;

    const oldTasks = [...tasks];
    const updatedTasks = tasks.map(t => t._id === taskId ? {
      ...t,
      timeLogs: newTimeLogs,
      totalTimeSpent: Math.max(0, newTotalTime)
    } : t);

    setTasks(updatedTasks);

    // Update focused task if it's the one being modified
    if (focusedTask && focusedTask._id === taskId) {
      setFocusedTask(updatedTasks.find(t => t._id === taskId) || null);
    }

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeLogs: newTimeLogs,
          totalTimeSpent: Math.max(0, newTotalTime)
        }),
      });
    } catch {
      setTasks(oldTasks);
    }
  };

  const toggleMIT = async (taskId: string, isMIT: boolean) => {
    const oldTasks = [...tasks];
    const updatedTasks = tasks.map(t => t._id === taskId ? { ...t, isMIT } : t);
    setTasks(updatedTasks);

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isMIT }),
      });
    } catch {
      setTasks(oldTasks);
    }
  };

  const deleteBoard = async (boardId: string) => {
    if (!confirm("Delete this board and all its tasks?")) return;

    try {
      await fetch(`/api/boards/${boardId}`, { method: "DELETE" });
      setBoards(boards.filter(b => b._id !== boardId));
      setCurrentBoardId(null); // Reset to All Tasks
      // Optionally refetch tasks to clear deleted ones from state if they were loaded
      const res = await fetch("/api/tasks");
      const json = await res.json();
      if (json.success) setTasks(json.data);
    } catch (error) {
      console.error("Failed to delete board", error);
    }
  };

  const moveTaskToBoard = async (taskId: string, boardId: string | null) => {
    const oldTasks = [...tasks];
    setTasks(tasks.map(t => t._id === taskId ? { ...t, boardId: boardId || undefined } : t));
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId: boardId }),
      });
      // If we moved the task away from the current board view, remove it from local state
      if (currentBoardId !== null && boardId !== currentBoardId) {
        setTasks(prev => prev.filter(t => t._id !== taskId));
      }
    } catch {
      setTasks(oldTasks);
    }
  };

  // Helper to sync focused task with main task list state updates
  useEffect(() => {
    if (focusedTask) {
      const updatedRef = tasks.find(t => t._id === focusedTask._id);
      if (updatedRef) {
        if (JSON.stringify(updatedRef) !== JSON.stringify(focusedTask)) {
          setFocusedTask(updatedRef);
        }
      }
    }
  }, [tasks, focusedTask]);

  // Helper to sync editing task with main task list state updates
  useEffect(() => {
    if (editingTask) {
      const updatedRef = tasks.find(t => t._id === editingTask._id);
      if (updatedRef) {
        if (JSON.stringify(updatedRef) !== JSON.stringify(editingTask)) {
          setEditingTask(updatedRef);
        }
      }
    }
  }, [tasks, editingTask]);

  const stats = {
    pending: tasks.filter(t => t.status === "pending" && !t.isArchived).length,
    inProgress: tasks.filter(t => t.status === "in-progress" && !t.isArchived).length,
    completed: tasks.filter(t => t.status === "completed" && !t.isArchived).length,
    pinned: tasks.filter(t => t.status === "pinned" && !t.isArchived).length,
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Edit Modal */}
      <AnimatePresence>
        {editingTask && (
          <EditTaskModal
            task={editingTask}
            boards={boards}
            onClose={() => setEditingTask(null)}
            onSave={saveEditTask}
            onStartTimer={startTimer}
            onStopTimer={stopTimer}
            onPauseTimer={pauseTimer}
            onResumeTimer={resumeTimer}
            onDeleteTimeLog={deleteTimeLog}
            onToggleMIT={toggleMIT}
            onMoveToBoard={moveTaskToBoard}
            onArchive={archiveTask}
            onDelete={deleteTask}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {focusedTask && (
          <FocusOverlay
            task={focusedTask}
            onClose={() => setFocusedTask(null)}
            onToggleSubtask={toggleTaskSubtask}
            onStartTimer={startTimer}
            onStopTimer={stopTimer}
            onCompleteTask={(id) => {
              updateTaskStatus(id, "completed");
              setFocusedTask(null);
            }}
          />
        )}
      </AnimatePresence>

      <main className="flex-1 transition-all duration-300 p-4 md:p-8 overflow-y-auto h-screen w-full md:ml-20">
        {/* Active Timer Bar */}
        <AnimatePresence>
          {tasks.filter(t => t.activeTimer?.isActive).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-0 left-0 md:left-20 right-0 z-50 bg-surface/30 backdrop-blur-xl border-b border-white/5 shadow-2xl"
            >
              <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-3">
                <div className="flex items-center gap-4 overflow-x-auto">
                  {tasks.filter(t => t.activeTimer?.isActive).map(task => {
                    const elapsed = Math.floor((Date.now() - new Date(task.activeTimer!.startedAt!).getTime()) / 1000);
                    const hours = Math.floor(elapsed / 3600);
                    const minutes = Math.floor((elapsed % 3600) / 60);
                    const seconds = elapsed % 60;
                    const timeStr = hours > 0
                      ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                      : `${minutes}:${seconds.toString().padStart(2, '0')}`;

                    return (
                      <div
                        key={task._id}
                        className="flex items-center gap-3 bg-primary/10 border border-primary/30 rounded-full px-4 py-2 hover:bg-primary/15 transition-all group whitespace-nowrap"
                      >
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                        <span className="text-sm font-medium text-white max-w-[200px] truncate">{task.title}</span>
                        <span className="text-base font-mono font-bold text-primary tabular-nums">
                          {timeStr}
                        </span>
                        <button
                          onClick={() => stopTimer(task._id)}
                          className="p-1.5 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                          title="Stop timer"
                        >
                          <Pause size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spacer when timer bar is active */}
        {tasks.filter(t => t.activeTimer?.isActive).length > 0 && (
          <div className="h-16 md:h-14" />
        )}

        {/* Header */}
        <header className="flex items-center justify-between mb-8 md:mb-12 max-w-[1600px] mx-auto">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">
              {activeTab === 'sniper' ? 'Sniper Command' : activeTab === 'socials' ? 'Social HQ' : activeTab === 'settings' ? 'System Settings' : activeTab === 'archive' ? 'The Vault' : activeTab === 'habits' ? 'Daily Protocols' : activeTab === 'vision' ? 'The Blueprint' : activeTab === 'watch' ? 'Watch Later' : `${greeting}, Owen.`}
            </h1>
            <p className="text-sm md:text-base text-gray-400">
              {activeTab === 'sniper' ? 'Tracking Smart Money flows.' : activeTab === 'archive' ? 'History of executed tasks.' : activeTab === 'habits' ? 'Consistency is the key to mastery.' : activeTab === 'vision' ? 'Eyes on the prize.' : activeTab === 'watch' ? 'Your curated video collection.' : "Let's stay focused today."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <NotificationBell />

            {/* Lofi Girl Button */}
            <button
              onClick={() => {
                if (isLofiPlaying) {
                  setIsLofiPlaying(false);
                } else {
                  window.open('https://www.youtube.com/watch?v=jfKfPfyJRdk', '_blank');
                  setIsLofiPlaying(true);
                }
              }}
              className={clsx(
                "hidden md:flex items-center gap-2 px-4 py-2 rounded-xl transition-all border",
                isLofiPlaying
                  ? "bg-primary/20 border-primary text-primary"
                  : "bg-surface border-border text-gray-400 hover:text-white hover:border-primary/50"
              )}
              title="Play Lofi Girl on YouTube"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm4.7 17.3l-4.6-2.7c-.2-.1-.3-.3-.3-.6V9c0-.5.4-.9.9-.9s.9.4.9.9v4.7l4.2 2.4c.4.2.5.7.3 1.1-.2.4-.7.5-1.1.3l-.3-.2z" />
              </svg>
              <span className="text-sm font-medium">Lofi Girl</span>
            </button>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 bg-surface border border-border rounded-lg text-gray-300 hover:text-white"
            >
              <Menu size={24} />
            </button>
          </div>
        </header>

        {activeTab === "tasks" && (
          <div className="max-w-[1600px] mx-auto pb-20">
            {/* Daily MIT Section */}
            <MITList
              tasks={tasks}
              setTasks={setTasks}
              onUpdateStatus={(id, status) => updateTaskStatus(id, status as TaskStatus)}
              onToggleMIT={toggleMIT}
            />

            {/* Board Selector */}
            <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setCurrentBoardId(null)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium border transition-all whitespace-nowrap",
                  currentBoardId === null
                    ? "bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(var(--primary),0.3)] backdrop-blur-md"
                    : "bg-surface/30 border-white/5 text-gray-400 hover:text-white hover:bg-white/5 backdrop-blur-sm"
                )}
              >
                All Tasks
              </button>

              {boards.map(board => (
                <button
                  key={board._id}
                  onClick={() => setCurrentBoardId(board._id)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium border transition-all whitespace-nowrap group relative flex items-center gap-2",
                    currentBoardId === board._id
                      ? "bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(var(--primary),0.3)] backdrop-blur-md"
                      : "bg-surface/30 border-white/5 text-gray-400 hover:text-white hover:bg-white/5 backdrop-blur-sm"
                  )}
                >
                  {board.title}
                  {currentBoardId === board._id && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteBoard(board._id);
                      }}
                      className="p-1 hover:bg-red-500/20 text-gray-500 hover:text-red-500 rounded-md transition-colors"
                      title="Delete Board"
                    >
                      <Trash2 size={12} />
                    </span>
                  )}
                </button>
              ))}

              {isCreatingBoard ? (
                <form onSubmit={createBoard} className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                  <input
                    autoFocus
                    type="text"
                    value={newBoardTitle}
                    onChange={(e) => setNewBoardTitle(e.target.value)}
                    placeholder="Board Name..."
                    className="w-32 bg-surface text-sm px-3 py-2 rounded-lg border border-primary focus:outline-none text-white placeholder-gray-500"
                    onBlur={() => !newBoardTitle && setIsCreatingBoard(false)}
                  />
                  <button type="submit" className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                    <Check size={14} />
                  </button>
                  <button type="button" onClick={() => setIsCreatingBoard(false)} className="p-2 text-gray-500 hover:text-white">
                    <X size={14} />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsCreatingBoard(true)}
                  className="px-3 py-2 rounded-lg border border-dashed border-border text-gray-500 hover:text-white hover:border-gray-400 transition-all flex items-center gap-1.5 text-xs uppercase font-bold tracking-wide ml-2 whitespace-nowrap"
                >
                  <Plus size={14} /> Add Board
                </button>
              )}
            </div>
            <form onSubmit={addTask} className="mb-8 max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full card-glass pl-4 pr-32 py-4 md:px-6 md:py-5 md:pr-36 text-base md:text-lg focus:outline-none focus:border-primary/50 focus:bg-black/40 transition-all placeholder:text-gray-600 shadow-xl"
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
                onToggleSubtask={toggleTaskSubtask}
                onUpdatePriority={updateTaskPriority}
                onStartTimer={startTimer}
                onStopTimer={stopTimer}
                onPauseTimer={pauseTimer}
                onResumeTimer={resumeTimer}
                onFocus={setFocusedTask}
                onMoveToBoard={moveTaskToBoard}
                boards={boards}
              />
            )}
          </div>
        )}

        {activeTab === "stats" && <AnalyticsView />}
        {activeTab === "habits" && <HabitView />}
        {activeTab === "roadmap" && <RoadmapView />}
        {activeTab === "watch" && <WatchLaterView />}
        {activeTab === "archive" && <ArchiveView tasks={tasks} onRestore={restoreTask} onDelete={deleteTask} />}
        {activeTab === "sniper" && <SniperView />}
        {activeTab === "socials" && <SocialHubView />}
        {activeTab === "settings" && <SettingsView />}

        {activeTab === "calendar" && <CalendarView />}
      </main>
    </div >
  );
}
