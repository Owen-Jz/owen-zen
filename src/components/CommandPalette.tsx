"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, LayoutDashboard, Calendar, Trophy, Dumbbell, Wallet, Target, FileText, Inbox, Settings, BarChart2, Eye, Palette, Star, Archive, Users, Share2, Crosshair, Shield } from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  icon: React.ElementType;
  category: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
}

export function CommandPalette({ isOpen, onClose, onSelect }: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = useMemo(() => [
    { id: "tasks", label: "Focus Board", icon: LayoutDashboard, category: "Core" },
    { id: "stats", label: "Statistics", icon: BarChart2, category: "Core" },
    { id: "habits", label: "Daily Protocols", icon: Trophy, category: "Core" },
    { id: "habit-analytics", label: "Habit Analytics", icon: BarChart2, category: "Core" },
    { id: "discipline", label: "Discipline Challenge", icon: Shield, category: "Core" },
    { id: "calendar", label: "Calendar", icon: Calendar, category: "Planning" },
    { id: "weekly", label: "Weekly Goals", icon: Target, category: "Planning" },
    { id: "vision", label: "Vision Board", icon: Palette, category: "Planning" },
    { id: "reality", label: "Reality Check", icon: Eye, category: "Planning" },
    { id: "roadmap", label: "2026 Roadmap", icon: Target, category: "Planning" },
    { id: "bucket", label: "Bucket List", icon: Star, category: "Planning" },
    { id: "gym", label: "Gym Tracker", icon: Dumbbell, category: "Health" },
    { id: "mealplan", label: "Meal Plan", icon: Target, category: "Health" },
    { id: "inbox", label: "The Inbox", icon: Inbox, category: "Tools" },
    { id: "notes", label: "Notes", icon: FileText, category: "Tools" },
    { id: "finance", label: "Finance Tracker", icon: Wallet, category: "Tools" },
    { id: "leads", label: "Leads CRM", icon: Users, category: "Tools" },
    { id: "socials", label: "Social Hub", icon: Share2, category: "Tools" },
    { id: "sniper", label: "Sniper System", icon: Crosshair, category: "Tools" },
    { id: "watch", label: "Watch Later", icon: Archive, category: "System" },
    { id: "archive", label: "Archive", icon: Archive, category: "System" },
    { id: "settings", label: "Settings", icon: Settings, category: "System" },
  ], []);

  const filteredCommands = useMemo(() => {
    if (!search.trim()) return commands;
    const searchLower = search.toLowerCase();
    return commands.filter(
      cmd => cmd.label.toLowerCase().includes(searchLower) ||
             cmd.category.toLowerCase().includes(searchLower)
    );
  }, [commands, search]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        break;
      case "Enter":
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          onSelect(filteredCommands[selectedIndex].id);
          onClose();
        }
        break;
      case "Escape":
        onClose();
        break;
    }
  }, [isOpen, filteredCommands, selectedIndex, onSelect, onClose]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]"
        onClick={onClose}
      >
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5">
            <Search size={20} className="text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search views..."
              className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-lg"
              autoFocus
            />
            <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-white/5 rounded text-xs text-gray-500">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto p-2">
            {filteredCommands.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No results found
              </div>
            ) : (
              Object.entries(groupedCommands).map(([category, items]) => (
                <div key={category} className="mb-2">
                  <div className="px-3 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {category}
                  </div>
                  {items.map((cmd, idx) => {
                    const globalIdx = filteredCommands.indexOf(cmd);
                    const Icon = cmd.icon;
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => {
                          onSelect(cmd.id);
                          onClose();
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                          globalIdx === selectedIndex
                            ? "bg-primary/10 text-primary"
                            : "text-gray-300 hover:bg-white/5"
                        }`}
                      >
                        <Icon size={18} className={globalIdx === selectedIndex ? "text-primary" : "text-gray-500"} />
                        <span className="font-medium">{cmd.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/5 rounded">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/5 rounded">↵</kbd>
                Select
              </span>
            </div>
            <span>Quick Navigation</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { isOpen, setIsOpen };
}
