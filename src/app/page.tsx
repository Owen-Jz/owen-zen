"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Plus, LayoutDashboard, Calendar, Settings, Menu, X, Target, Crosshair, TrendingUp, Users, Share2, Twitter, Linkedin, Instagram, Palette, GripVertical, AlertCircle, AlertTriangle, ArrowDown, MoreVertical, Archive, ArrowRightCircle, Edit2, ChevronDown, Check, Clock, Trash2, Circle, Trophy, Pause, Maximize2, ShoppingCart, Search, LayoutTemplate, Inbox, Star, Wallet } from "lucide-react";
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
import { AddTaskModal } from "@/components/AddTaskModal";
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
import { LeadsView } from "@/components/LeadsView"; // Import Leads CRM
import { InboxView } from "@/components/InboxView";
import { BucketListView } from "@/components/BucketListView";
import { NotificationBell } from "@/components/NotificationBell"; // Import Notification Bell
import { Loading } from "@/components/Loading";
import { ShoppingListModal } from "@/components/ShoppingListModal";
import { ProjectView } from "@/components/ProjectView";
import { FinanceView } from "@/components/FinanceView";
import { WeeklyGoalsView } from "@/components/WeeklyGoalsView";

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

interface QuickLinkItem {
  _id: string;
  label: string;
  url: string;
  emoji: string;
}

const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen, isCollapsed, setIsCollapsed }: any) => {
  const [quickLinks, setQuickLinks] = useState<QuickLinkItem[]>([]);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkEmoji, setNewLinkEmoji] = useState('🔗');

  useEffect(() => {
    fetch('/api/quick-links')
      .then(r => r.json())
      .then(j => { if (j.success) setQuickLinks(j.data); })
      .catch(() => { });
  }, []);

  const addQuickLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkLabel.trim() || !newLinkUrl.trim()) return;
    const url = newLinkUrl.startsWith('http') ? newLinkUrl : `https://${newLinkUrl}`;
    const res = await fetch('/api/quick-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newLinkLabel.trim(), url, emoji: newLinkEmoji }),
    });
    const json = await res.json();
    if (json.success) {
      setQuickLinks(prev => [...prev, json.data]);
      setNewLinkLabel('');
      setNewLinkUrl('');
      setNewLinkEmoji('🔗');
      setIsAddingLink(false);
    }
  };

  const deleteQuickLink = async (id: string) => {
    setQuickLinks(prev => prev.filter(l => l._id !== id));
    await fetch(`/api/quick-links/${id}`, { method: 'DELETE' });
  };

  const links = [
    { id: "tasks", label: "Focus Board", icon: LayoutDashboard },
    { id: "projects", label: "Project HQ", icon: LayoutTemplate },
    { id: "stats", label: "Stats", icon: TrendingUp }, // Added Stats
    { id: "habits", label: "Habits", icon: Trophy },
    { id: "weekly", label: "Weekly Goals", icon: Target },
    { id: "roadmap", label: "2026 Roadmap", icon: Target }, // Replaced Vision
    { id: "watch", label: "Watch Later", icon: Circle }, // Watch Later
    { id: "archive", label: "Archive", icon: Archive },
    { id: "sniper", label: "Sniper System", icon: Crosshair },
    { id: "socials", label: "Social Hub", icon: Share2 },
    { id: "leads", label: "Leads CRM", icon: Users },
    { id: "inbox", label: "The Inbox", icon: Inbox },
    { id: "finance", label: "Finance Tracker", icon: Wallet },
    { id: "bucket", label: "2026 Bucket List", icon: Star },
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

        {/* Quick Links (Mobile Only) */}
        <div className="px-3 mt-6 border-t border-white/5 pt-4 md:hidden">
          <div className="flex items-center justify-between mb-2 px-2">
            <p className="text-xs text-gray-500 uppercase tracking-widest">Quick Links</p>
            <button
              onClick={() => setIsAddingLink(v => !v)}
              className="text-gray-500 hover:text-white transition-colors"
              title="Add quick link"
            >
              <Plus size={14} />
            </button>
          </div>

          {quickLinks.map(link => (
            <div key={link._id} className="flex items-center group gap-1">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex-1 min-w-0"
              >
                <span className="text-base shrink-0">{link.emoji}</span>
                <span className="truncate">{link.label}</span>
              </a>
              <button
                onClick={() => deleteQuickLink(link._id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:text-red-500 transition-all shrink-0 mr-1"
                title="Remove"
              >
                <X size={12} />
              </button>
            </div>
          ))}

          {quickLinks.length === 0 && !isAddingLink && (
            <p className="text-xs text-gray-600 px-3 py-2">No links yet — add one!</p>
          )}

          {isAddingLink && (
            <form onSubmit={addQuickLink} className="mt-2 space-y-2 px-1">
              <div className="flex gap-1">
                <input
                  value={newLinkEmoji}
                  onChange={e => setNewLinkEmoji(e.target.value)}
                  placeholder="🔗"
                  className="w-10 bg-surface-hover border border-white/10 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-primary/50"
                />
                <input
                  autoFocus
                  value={newLinkLabel}
                  onChange={e => setNewLinkLabel(e.target.value)}
                  placeholder="Label"
                  className="flex-1 bg-surface-hover border border-white/10 rounded-lg px-2 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-primary/50"
                />
              </div>
              <input
                value={newLinkUrl}
                onChange={e => setNewLinkUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-surface-hover border border-white/10 rounded-lg px-2 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-primary/50"
              />
              <div className="flex gap-1">
                <button type="submit" className="flex-1 bg-primary/20 text-primary border border-primary/30 rounded-lg py-1.5 text-xs font-bold hover:bg-primary/30 transition-colors">
                  Add
                </button>
                <button type="button" onClick={() => setIsAddingLink(false)} className="px-3 text-gray-500 hover:text-white rounded-lg border border-white/5 text-xs transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

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
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-surface border border-border rounded-xl p-8">
        <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
          <Palette className="text-primary w-6 h-6" /> Appearance
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Zen */}
          <button onClick={() => setTheme('')} className="p-4 rounded-xl border border-border hover:border-primary transition-all text-left group bg-surface/30 hover:bg-surface/50">
            <div className="w-full h-28 bg-[#0a0a0a] rounded-lg mb-4 border border-[#262626] relative overflow-hidden group-hover:scale-[1.02] transition-transform shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/40"></div>
              <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-[#dc2626] shadow-[0_0_10px_rgba(220,38,38,0.5)]"></div>
              <div className="absolute bottom-3 right-3 text-[#525252] text-xs font-mono">ZEN</div>
            </div>
            <div className="font-bold text-lg">Zen (Default)</div>
            <div className="text-xs text-gray-500 mt-1">Dark Charcoal & Crimson</div>
          </button>

          {/* Cyberpunk */}
          <button onClick={() => setTheme('cyberpunk')} className="p-4 rounded-xl border border-border hover:border-primary transition-all text-left group bg-surface/30 hover:bg-surface/50">
            <div className="w-full h-28 bg-[#050508] rounded-lg mb-4 border border-[#334155] relative overflow-hidden group-hover:scale-[1.02] transition-transform shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-[#d946ef]/10 to-transparent"></div>
              <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-[#d946ef] shadow-[0_0_15px_rgba(217,70,239,0.6)]"></div>
              <div className="absolute bottom-3 right-3 text-[#22d3ee] text-xs font-mono">NEON</div>
            </div>
            <div className="font-bold text-lg">Cyberpunk</div>
            <div className="text-xs text-gray-500 mt-1">Deep Void & Neon Pink</div>
          </button>

          {/* Matrix */}
          <button onClick={() => setTheme('matrix')} className="p-4 rounded-xl border border-border hover:border-primary transition-all text-left group bg-surface/30 hover:bg-surface/50">
            <div className="w-full h-28 bg-[#000000] rounded-lg mb-4 border border-[#003b00] relative overflow-hidden group-hover:scale-[1.02] transition-transform shadow-lg">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,59,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,59,0,0.1)_1px,transparent_1px)] bg-[size:10px_10px]"></div>
              <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-[#008f11] shadow-[0_0_10px_rgba(0,143,17,0.8)]"></div>
              <div className="absolute bottom-3 right-3 text-[#00ff41] text-xs font-mono">CODE</div>
            </div>
            <div className="font-bold text-lg">Matrix</div>
            <div className="text-xs text-gray-500 mt-1">Pure Black & Terminal Green</div>
          </button>

          {/* Sapphire */}
          <button onClick={() => setTheme('sapphire')} className="p-4 rounded-xl border border-border hover:border-primary transition-all text-left group bg-surface/30 hover:bg-surface/50">
            <div className="w-full h-28 bg-[#020617] rounded-lg mb-4 border border-[#1e293b] relative overflow-hidden group-hover:scale-[1.02] transition-transform shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6]/10 to-transparent"></div>
              <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-[#3b82f6] shadow-[0_0_15px_rgba(59,130,246,0.6)]"></div>
              <div className="absolute bottom-3 right-3 text-[#60a5fa] text-xs font-mono">BLUE</div>
            </div>
            <div className="font-bold text-lg">Sapphire</div>
            <div className="text-xs text-gray-500 mt-1">Deep Ocean & Electric Blue</div>
          </button>

          {/* Emerald */}
          <button onClick={() => setTheme('emerald')} className="p-4 rounded-xl border border-border hover:border-primary transition-all text-left group bg-surface/30 hover:bg-surface/50">
            <div className="w-full h-28 bg-[#022c22] rounded-lg mb-4 border border-[#064e3b] relative overflow-hidden group-hover:scale-[1.02] transition-transform shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-[#10b981]/10 to-transparent"></div>
              <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
              <div className="absolute bottom-3 right-3 text-[#34d399] text-xs font-mono">WILD</div>
            </div>
            <div className="font-bold text-lg">Emerald</div>
            <div className="text-xs text-gray-500 mt-1">Forest Green & Menthol</div>
          </button>

          {/* Sunset */}
          <button onClick={() => setTheme('sunset')} className="p-4 rounded-xl border border-border hover:border-primary transition-all text-left group bg-surface/30 hover:bg-surface/50">
            <div className="w-full h-28 bg-[#1c1917] rounded-lg mb-4 border border-[#44403c] relative overflow-hidden group-hover:scale-[1.02] transition-transform shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-[#f59e0b]/10 to-transparent"></div>
              <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-[#f59e0b] shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
              <div className="absolute bottom-3 right-3 text-[#fbbf24] text-xs font-mono">HEAT</div>
            </div>
            <div className="font-bold text-lg">Sunset</div>
            <div className="text-xs text-gray-500 mt-1">Warm Stone & Amber</div>
          </button>

          {/* Light Mode */}
          <button onClick={() => setTheme('light')} className="p-4 rounded-xl border border-border hover:border-primary transition-all text-left group bg-surface/30 hover:bg-surface/50">
            <div className="w-full h-28 bg-[#ffffff] rounded-lg mb-4 border border-[#d4d4d8] relative overflow-hidden group-hover:scale-[1.02] transition-transform shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6]/10 to-transparent"></div>
              <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-[#3b82f6] shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
              <div className="absolute bottom-3 right-3 text-[#60a5fa] text-xs font-mono">LIGHT</div>
            </div>
            <div className="font-bold text-lg">Light Mode</div>
            <div className="text-xs text-gray-500 mt-1">Clean White & Blue</div>
          </button>

        </div>
      </div>
    </div>
  );
};
const SniperView = () => <SandboxDashboard />;
// SocialHubView imported from components


const ArchiveView = ({ tasks, onRestore, onDelete }: { tasks: Task[], onRestore: (id: string) => void, onDelete: (id: string) => void }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const archivedTasks = tasks.filter(t => t.isArchived && t.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-400">
          <Archive className="text-gray-500" /> Archived Tasks
        </h2>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search archive..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-hover border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        </div>
      </div>

      {archivedTasks.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-xl text-gray-600">
          {searchQuery ? "No matching archived tasks found." : "Archive is empty."}
        </div>
      ) : (
        <div className="grid gap-3">
          {archivedTasks.map(task => (
            <div key={task._id} className="bg-surface/50 border border-border p-4 rounded-xl flex justify-between items-center opacity-70 hover:opacity-100 transition-opacity">
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-gray-400 line-through truncate">{task.title}</span>
                {task.completedAt && (
                  <span className="text-[10px] text-green-500/80 font-mono">
                    Finished {new Date(task.completedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </span>
                )}
              </div>
              <div className="flex gap-2 shrink-0 ml-4">
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

const RightSidebar = ({
  isLofiPlaying,
  setIsLofiPlaying
}: {
  isLofiPlaying: boolean;
  setIsLofiPlaying: (v: boolean) => void;
}) => {
  const [quickLinks, setQuickLinks] = useState<QuickLinkItem[]>([]);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkEmoji, setNewLinkEmoji] = useState('🔗');
  const [isQuickLinksOpen, setIsQuickLinksOpen] = useState(true);
  const [spentToday, setSpentToday] = useState<number | null>(null);

  // Time states
  const [timeExt, setTimeExt] = useState({
    sf: '',
    on: '',
    local: ''
  });

  useEffect(() => {
    const updateTime = () => {
      const sfTime = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles", hour: '2-digit', minute: '2-digit', hour12: true });
      const onTime = new Date().toLocaleString("en-US", { timeZone: "America/Toronto", hour: '2-digit', minute: '2-digit', hour12: true });
      const localTime = new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos", hour: '2-digit', minute: '2-digit', hour12: true });
      setTimeExt({ sf: sfTime, on: onTime, local: localTime });
    };
    updateTime();
    const int = setInterval(updateTime, 10000);
    return () => clearInterval(int);
  }, []);

  // Fetch today's burn rate
  useEffect(() => {
    const fetchSpentToday = async () => {
      try {
        const today = new Date();
        const yyyymm = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        const res = await fetch(`/api/finance/expenses?month=${yyyymm}`);
        const json = await res.json();
        if (json.success && json.expenses) {
          const todayStr = today.toISOString().split('T')[0];
          const sum = json.expenses
            .filter((e: any) => e.date && e.date.startsWith(todayStr))
            .reduce((s: number, e: any) => s + e.amount, 0);
          setSpentToday(sum);
        }
      } catch (err) { }
    };
    fetchSpentToday();
  }, []);


  useEffect(() => {
    fetch('/api/quick-links')
      .then(r => r.json())
      .then(j => { if (j.success) setQuickLinks(j.data); })
      .catch(() => { });
  }, []);

  const addQuickLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkLabel.trim() || !newLinkUrl.trim()) return;
    const url = newLinkUrl.startsWith('http') ? newLinkUrl : `https://${newLinkUrl}`;
    const res = await fetch('/api/quick-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newLinkLabel.trim(), url, emoji: newLinkEmoji }),
    });
    const json = await res.json();
    if (json.success) {
      setQuickLinks(prev => [...prev, json.data]);
      setNewLinkLabel('');
      setNewLinkUrl('');
      setNewLinkEmoji('🔗');
      setIsAddingLink(false);
    }
  };

  const deleteQuickLink = async (id: string) => {
    setQuickLinks(prev => prev.filter(l => l._id !== id));
    await fetch(`/api/quick-links/${id}`, { method: 'DELETE' });
  };

  return (
    <div className="hidden md:flex flex-col fixed right-0 top-0 h-full w-64 bg-surface/80 backdrop-blur-xl border-l border-white/5 z-40 p-6 transition-all duration-300 overflow-y-auto scrollbar-hide">

      {/* 1. Multi-Timezone Clocks */}
      <div className="flex justify-between items-center bg-surface-hover/50 p-3 rounded-xl border border-white/5 mb-6">
        <div className="flex flex-col items-center flex-1">
          <span className="text-[10px] text-gray-500 font-bold tracking-widest mb-1">SF</span>
          <span className="text-xs font-mono text-gray-300">{timeExt.sf || '--:--'}</span>
        </div>
        <div className="w-px h-6 bg-white/10"></div>
        <div className="flex flex-col items-center flex-1">
          <span className="text-[10px] text-gray-500 font-bold tracking-widest mb-1">ON</span>
          <span className="text-xs font-mono text-gray-300">{timeExt.on || '--:--'}</span>
        </div>
        <div className="w-px h-6 bg-white/10"></div>
        <div className="flex flex-col items-center flex-1">
          <span className="text-[10px] text-gray-500 font-bold tracking-widest mb-1">YOU</span>
          <span className="text-xs font-mono text-gray-300">{timeExt.local || '--:--'}</span>
        </div>
      </div>

      {/* 2. Today's Financial Burn Rate */}
      <div className="bg-gradient-to-br from-red-500/10 to-orange-500/5 border border-red-500/20 p-4 rounded-xl mb-6 flex items-center gap-3">
        <div className="p-2 bg-red-500/20 rounded-lg text-red-400">
          <Wallet size={16} />
        </div>
        <div>
          <p className="text-[10px] text-red-500/70 uppercase tracking-widest font-bold">Spent Today</p>
          <p className="text-sm font-mono font-bold text-red-400/90 mt-0.5">
            ₦{spentToday !== null ? spentToday.toLocaleString() : '---'}
          </p>
        </div>
      </div>

      {/* 3. Zen Audio & Lofi Controls */}
      <div className="bg-surface-hover border border-white/5 p-4 rounded-xl mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-indigo-400">
            <Pause size={16} />
            <h3 className="text-xs font-bold uppercase tracking-widest">Focus Audio</h3>
          </div>
          {isLofiPlaying && (
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-indigo-500 rounded-full"
                  animate={{ height: ["4px", "12px", "4px"] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between group">
            <span className="text-xs text-gray-400 group-hover:text-gray-200 transition-colors">Lofi Beats</span>
            <button
              onClick={() => setIsLofiPlaying(!isLofiPlaying)}
              className={cn(
                "w-8 h-4 rounded-full transition-colors relative",
                isLofiPlaying ? "bg-indigo-500/50" : "bg-white/10"
              )}
            >
              <div className={cn(
                "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm",
                isLofiPlaying ? "left-[18px]" : "left-0.5"
              )} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Vol</span>
            <input type="range" min="0" max="100" defaultValue="50" className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
          </div>
        </div>
      </div>

      {/* 4. Quick Links Dropdown */}
      <div className="flex items-center justify-between mb-4 cursor-pointer group" onClick={() => setIsQuickLinksOpen(!isQuickLinksOpen)}>
        <h2 className="text-xs text-gray-500 uppercase tracking-widest group-hover:text-gray-300 transition-colors">Quick Links</h2>
        <div className="flex items-center gap-2">
          {isQuickLinksOpen && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsAddingLink(v => !v); }}
              className="text-gray-500 hover:text-white transition-colors"
              title="Add quick link"
            >
              <Plus size={14} />
            </button>
          )}
          <ChevronDown size={14} className={cn("text-gray-500 transition-transform duration-300", isQuickLinksOpen ? "rotate-180" : "rotate-0")} />
        </div>
      </div>

      <AnimatePresence>
        {isQuickLinksOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-2 overflow-hidden flex-shrink-0"
          >
            {quickLinks.map(link => (
              <div key={link._id} className="flex items-center group gap-1">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex-1 min-w-0"
                >
                  <span className="text-base shrink-0">{link.emoji}</span>
                  <span className="truncate">{link.label}</span>
                </a>
                <button
                  onClick={() => deleteQuickLink(link._id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:text-red-500 transition-all shrink-0 mr-1"
                  title="Remove"
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            {quickLinks.length === 0 && !isAddingLink && (
              <p className="text-xs text-gray-600 px-3 py-2">No links yet — add one!</p>
            )}

            {isAddingLink && (
              <form onSubmit={addQuickLink} className="mt-2 space-y-2 px-1">
                <div className="flex gap-1">
                  <input
                    value={newLinkEmoji}
                    onChange={e => setNewLinkEmoji(e.target.value)}
                    placeholder="🔗"
                    className="w-10 bg-surface-hover border border-white/10 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-primary/50"
                  />
                  <input
                    autoFocus
                    value={newLinkLabel}
                    onChange={e => setNewLinkLabel(e.target.value)}
                    placeholder="Label"
                    className="flex-1 bg-surface-hover border border-white/10 rounded-lg px-2 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-primary/50"
                  />
                </div>
                <input
                  value={newLinkUrl}
                  onChange={e => setNewLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-surface-hover border border-white/10 rounded-lg px-2 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-primary/50"
                />
                <div className="flex gap-1">
                  <button type="submit" className="flex-1 bg-primary/20 text-primary border border-primary/30 rounded-lg py-1.5 text-xs font-bold hover:bg-primary/30 transition-colors">
                    Add
                  </button>
                  <button type="button" onClick={() => setIsAddingLink(false)} className="px-3 text-gray-500 hover:text-white rounded-lg border border-white/5 text-xs transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [boards, setBoards] = useState<Board[]>([]); // New: Boards state
  const [currentBoardId, setCurrentBoardId] = useState<string | null>(null); // New: Current Board
  const [isCreatingBoard, setIsCreatingBoard] = useState(false); // New: Create Board UI
  const [newBoardTitle, setNewBoardTitle] = useState(""); // New: New Board Title

  const [newTask, setNewTask] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("medium");
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("tasks");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false); // Zen Mode
  const [isBrainDumpOpen, setIsBrainDumpOpen] = useState(false); // Brain Dump
  const [isShoppingListModalOpen, setIsShoppingListModalOpen] = useState(false); // Shopping List modal
  const [brainDumpText, setBrainDumpText] = useState("");
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

    // Global Brain Dump Shortcut (Ctrl+K or Cmd+K)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsBrainDumpOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsZenMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

  const handleSaveNewTask = async (title: string, description: string, priority: TaskPriority, subtasks: SubTask[], dueDate: string | undefined, boardId: string | null, isMIT: boolean, category: string) => {
    // Optimistic UI
    const tempId = crypto.randomUUID();
    const tempTask: Task = {
      _id: tempId,
      title,
      description,
      priority,
      boardId: boardId || undefined,
      status: "pending",
      order: 0,
      subtasks,
      dueDate,
      createdAt: new Date().toISOString(),
      isMIT,
      isArchived: false,
      isTemp: true,
      category,
    };

    const previousTasks = [...tasks];
    setTasks([tempTask, ...tasks]);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, description, priority, subtasks, dueDate, boardId, isMIT, category
        }),
      });
      const json = await res.json();
      if (json.success) {
        setTasks((prev) => prev.map(t => t._id === tempId ? json.data : t));
      } else {
        setTasks(previousTasks);
      }
    } catch (error) {
      console.error("Failed to add task", error);
      setTasks(previousTasks);
    }
  };

  const saveBrainDump = async () => {
    if (!brainDumpText.trim()) return;

    const tempId = crypto.randomUUID();
    const tempTask: Task = {
      _id: tempId,
      title: brainDumpText,
      priority: "medium",
      status: "pending",
      order: 0,
      subtasks: [],
      createdAt: new Date().toISOString(),
      isMIT: false,
      isArchived: false,
      isTemp: true,
    };

    const previousTasks = [...tasks];
    setTasks([tempTask, ...tasks]);
    setBrainDumpText("");
    setIsBrainDumpOpen(false);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: tempTask.title,
          priority: tempTask.priority,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setTasks((prev) => prev.map(t => t._id === tempId ? json.data : t));
      } else {
        setTasks(previousTasks);
      }
    } catch {
      setTasks(previousTasks);
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

  const saveEditTask = async (id: string, title: string, description: string, priority: TaskPriority, subtasks: SubTask[], dueDate?: string, category?: string) => {
    const oldTasks = [...tasks];
    setTasks(tasks.map(t => t._id === id ? { ...t, title, description, priority, subtasks, dueDate, category } : t));
    setEditingTask(null);

    try {
      await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, priority, subtasks, dueDate, category }),
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

  const addManualTimeLog = async (taskId: string, duration: number, note: string) => {
    const task = tasks.find(t => t._id === taskId);
    if (!task) return;

    const now = new Date();
    const endedAt = now.toISOString();
    // Approximate start time based on duration
    const startedAt = new Date(now.getTime() - duration * 1000).toISOString();

    const newLog: TimeLog = {
      startedAt,
      endedAt,
      duration,
      note
    };

    const newTimeLogs = [...(task.timeLogs || []), newLog];
    const newTotalTime = (task.totalTimeSpent || 0) + duration;

    const oldTasks = [...tasks];
    const updatedTasks = tasks.map(t => t._id === taskId ? {
      ...t,
      timeLogs: newTimeLogs,
      totalTimeSpent: newTotalTime
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
          totalTimeSpent: newTotalTime
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
    <div className={cn("flex min-h-screen bg-background text-foreground overflow-hidden transition-colors duration-500", isZenMode && "bg-black selection:bg-primary/30 relative")}>
      {/* Zen Mode Ambient Background */}
      {isZenMode && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-black animate-pulse duration-[10000ms]" />
        </div>
      )}

      {/* Sidebar hidden in Zen Mode */}
      {!isZenMode && (
        <>
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
          <RightSidebar isLofiPlaying={isLofiPlaying} setIsLofiPlaying={setIsLofiPlaying} />
        </>
      )}

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
            onAddManualTimeLog={addManualTimeLog}
            onToggleMIT={toggleMIT}
            onMoveToBoard={moveTaskToBoard}
            onArchive={archiveTask}
            onDelete={deleteTask}
          />
        )}
      </AnimatePresence>

      {/* Shopping List Modal */}
      <ShoppingListModal
        isOpen={isShoppingListModalOpen}
        onClose={() => setIsShoppingListModalOpen(false)}
      />

      {/* Add Task Modal */}
      <AnimatePresence>
        {isAddTaskModalOpen && (
          <AddTaskModal
            initialTitle=""
            boards={boards}
            defaultBoardId={currentBoardId}
            onClose={() => setIsAddTaskModalOpen(false)}
            onSave={handleSaveNewTask}
          />
        )}
      </AnimatePresence>

      {/* Brain Dump Modal */}
      <AnimatePresence>
        {isBrainDumpOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setIsBrainDumpOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-surface/80 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-3xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <span className="bg-primary/20 text-primary p-2 rounded-xl"><Plus size={20} /></span>
                  Quick Capture
                </h3>
                <span className="text-xs font-mono text-gray-500 bg-black/20 px-2 py-1 rounded">Ctrl + K</span>
              </div>
              <textarea
                autoFocus
                value={brainDumpText}
                onChange={(e) => setBrainDumpText(e.target.value)}
                placeholder="Dump your thoughts here... press Enter to save."
                className="w-full h-32 bg-black/20 border border-white/5 rounded-2xl p-4 text-lg focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all resize-none placeholder-gray-600"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    saveBrainDump();
                  }
                }}
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setIsBrainDumpOpen(false)}
                  className="px-6 py-2 rounded-xl text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveBrainDump}
                  className="px-6 py-2 bg-primary text-white rounded-xl shadow-lg hover:shadow-primary/25 hover:bg-primary/90 transition-all font-bold"
                >
                  Capture
                </button>
              </div>
            </motion.div>
          </motion.div>
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

      <main className={cn(
        "flex-1 transition-all duration-500 p-4 md:p-8 overflow-y-auto h-screen w-full relative",
        !isZenMode && (isSidebarCollapsed ? "md:ml-20 md:mr-64" : "md:ml-64 md:mr-64"),
        isZenMode && "mx-auto max-w-7xl md:p-12"
      )}>
        {/* Active Timer Bar */}
        <AnimatePresence>
          {tasks.filter(t => t.activeTimer?.isActive).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                "fixed top-0 left-0 right-0 z-50 bg-surface/30 backdrop-blur-xl border-b border-white/5 shadow-2xl transition-all duration-500",
                !isZenMode && (isSidebarCollapsed ? "md:left-20 md:right-64" : "md:left-64 md:right-64")
              )}
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
        <header className={cn("flex items-center justify-between mb-8 md:mb-12 max-w-[1600px] mx-auto transition-all duration-500", isZenMode && "opacity-0 hover:opacity-100 absolute top-4 left-4 right-4 z-40 bg-black/50 p-4 rounded-2xl backdrop-blur-md")}>
          <div className={cn(isZenMode && "hidden md:block")}>
            <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">
              {activeTab === 'projects' ? 'Project Command' : activeTab === 'sniper' ? 'Sniper Command' : activeTab === 'socials' ? 'Social HQ' : activeTab === 'leads' ? 'Leads CRM' : activeTab === 'inbox' ? 'The Inbox' : activeTab === 'bucket' ? '2026 Bucket List' : activeTab === 'settings' ? 'System Settings' : activeTab === 'archive' ? 'The Vault' : activeTab === 'habits' ? 'Daily Protocols' : activeTab === 'weekly' ? 'Weekly Goals' : activeTab === 'vision' ? 'The Blueprint' : activeTab === 'watch' ? 'Watch Later' : `${greeting}, Owen.`}
            </h1>
            <p className="text-sm md:text-base text-gray-400">
              {activeTab === 'projects' ? 'High-level view of your core initiatives.' : activeTab === 'sniper' ? 'Tracking Smart Money flows.' : activeTab === 'archive' ? 'History of executed tasks.' : activeTab === 'habits' ? 'Consistency is the key to mastery.' : activeTab === 'weekly' ? 'Track your weekly wins and habits.' : activeTab === 'vision' ? 'Eyes on the prize.' : activeTab === 'watch' ? 'Your curated video collection.' : activeTab === 'leads' ? 'Track, nurture and convert your leads.' : activeTab === 'inbox' ? 'Capture everything. Process deliberately.' : activeTab === 'bucket' ? 'Epic things to do before 2027.' : "Let's stay focused today."}
            </p>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            {/* Zen Mode Toggle */}
            <button
              onClick={() => setIsZenMode(!isZenMode)}
              className={cn(
                "hidden md:flex items-center gap-2 px-4 py-2 rounded-xl transition-all border",
                isZenMode ? "bg-primary text-white border-primary shadow-[0_0_20px_rgba(var(--primary),0.5)]" : "bg-surface border-border text-gray-400 hover:text-white hover:border-primary/50"
              )}
              title="Zen Mode (Hide Distractions)"
            >
              <Maximize2 size={16} />
              <span className="text-sm font-medium">Zen Mode</span>
            </button>
            <div className="w-px h-6 bg-white/10 mx-1 hidden md:block"></div>

            {/* Notification Bell */}
            {!isZenMode && <NotificationBell />}

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
            {!isZenMode && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-2 bg-surface border border-border rounded-lg text-gray-300 hover:text-white"
              >
                <Menu size={24} />
              </button>
            )}
          </div>
        </header>

        {isZenMode && <div className="h-12 md:h-0"></div>}

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
            <div className={cn("mb-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide transition-all", isZenMode && "opacity-0 pointer-events-none h-0 mb-0 overflow-hidden")}>
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
            <div className={cn("mb-8 max-w-3xl mx-auto transition-all", isZenMode && "opacity-0 pointer-events-none h-0 mb-0 overflow-hidden")}>
              <div className="flex gap-4">
                <div
                  onClick={() => setIsAddTaskModalOpen(true)}
                  className="relative group cursor-text flex-1"
                >
                  <div className="h-full w-full bg-surface/50 backdrop-blur-xl border border-white/5 pl-6 pr-4 py-5 rounded-2xl text-lg transition-all shadow-2xl font-medium tracking-wide text-gray-500 hover:bg-black/60 hover:border-primary/50 flex items-center justify-between">
                    <span>What needs to be done?</span>
                    <button
                      className="aspect-square bg-primary text-white rounded-xl p-2.5 flex items-center justify-center hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(var(--primary),0.5)] transition-all"
                    >
                      <Plus size={20} className="stroke-[3px]" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setIsShoppingListModalOpen(true)}
                  className="bg-surface/50 backdrop-blur-xl border border-white/5 px-6 py-5 rounded-2xl transition-all shadow-2xl tracking-wide text-gray-400 hover:text-white hover:bg-black/60 hover:border-primary/50 flex flex-col items-center justify-center gap-1.5 group"
                >
                  <ShoppingCart size={22} className="text-primary group-hover:drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                  <span className="text-[10px] uppercase font-bold tracking-widest leading-none">Cart</span>
                </button>
              </div>
            </div>

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
                isZenMode={isZenMode}
              />
            )}
          </div>
        )}

        {activeTab === "projects" && <ProjectView />}
        {activeTab === "stats" && <AnalyticsView />}
        {activeTab === "habits" && <HabitView />}
        {activeTab === "weekly" && <WeeklyGoalsView />}
        {activeTab === "roadmap" && <RoadmapView />}
        {activeTab === "watch" && <WatchLaterView />}
        {activeTab === "archive" && <ArchiveView tasks={tasks} onRestore={restoreTask} onDelete={deleteTask} />}
        {activeTab === "sniper" && <SniperView />}
        {activeTab === "socials" && <SocialHubView />}
        {activeTab === "leads" && <LeadsView />}
        {activeTab === "inbox" && <InboxView />}
        {activeTab === "finance" && <FinanceView />}
        {activeTab === "bucket" && <BucketListView />}
        {activeTab === "settings" && <SettingsView />}

        {activeTab === "calendar" && <CalendarView />}
      </main>
    </div >
  );
}
