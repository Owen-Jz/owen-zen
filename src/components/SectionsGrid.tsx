"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, LayoutTemplate, TrendingUp, Trophy, BarChart2, Shield,
  Dumbbell, UtensilsCrossed, Utensils,
  Target, Palette, Eye, Star, Calendar, Inbox,
  Crosshair, Wallet, Users, MessageSquare,
  Circle, FileText, Archive, Settings,
  BookOpen,
} from "lucide-react";
interface ViewItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface Section {
  title: string;
  links: ViewItem[];
}

interface SectionsGridProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
}

export function SectionsGrid({ isOpen, onClose, onSelect }: SectionsGridProps) {
  const [focusedRow, setFocusedRow] = useState(0);
  const [focusedCol, setFocusedCol] = useState(0);

  const sections: Section[] = useMemo(() => [
    {
      title: "Core",
      links: [
        { id: "tasks", label: "Focus Board", icon: LayoutDashboard },
        { id: "projects", label: "Project HQ", icon: LayoutTemplate },
        { id: "stats", label: "Stats", icon: TrendingUp },
        { id: "habits", label: "Habits", icon: Trophy },
        { id: "habit-analytics", label: "Habit Analytics", icon: BarChart2 },
        { id: "discipline", label: "Discipline Challenge", icon: Shield },
        { id: "daily-word", label: "Daily Word", icon: BookOpen },
      ]
    },
    {
      title: "Health",
      links: [
        { id: "gym", label: "Gym Tracker", icon: Dumbbell },
        { id: "mealplan", label: "Meal Plan", icon: UtensilsCrossed },
        { id: "food", label: "Food Tracker", icon: Utensils },
      ]
    },
    {
      title: "Planning",
      links: [
        { id: "weekly", label: "Weekly Goals", icon: Target },
        { id: "vision", label: "Vision Board", icon: Palette },
        { id: "reality", label: "Reality Check", icon: Eye },
        { id: "roadmap", label: "2026 Roadmap", icon: Target },
        { id: "bucket", label: "2026 Bucket List", icon: Star },
        { id: "calendar", label: "Calendar", icon: Calendar },
        { id: "post-bucket", label: "Post Bucket", icon: Inbox },
      ]
    },
    {
      title: "Tools",
      links: [
        { id: "inbox", label: "The Inbox", icon: Inbox },
        { id: "sniper", label: "Sniper System", icon: Crosshair },
        { id: "finance", label: "Finance Tracker", icon: Wallet },
        { id: "leads", label: "Leads CRM", icon: Users },
        { id: "prompts", label: "Prompt Library", icon: MessageSquare },
      ]
    },
    {
      title: "System",
      links: [
        { id: "watch", label: "Watch Later", icon: Circle },
        { id: "notes", label: "Notes", icon: FileText },
        { id: "archive", label: "Archive", icon: Archive },
        { id: "settings", label: "Settings", icon: Settings },
      ]
    }
  ], []);

  const maxRows = useMemo(() => Math.max(...sections.map(s => s.links.length)), [sections]);
  const numCols = sections.length;

  const clampRow = useCallback((row: number) => Math.max(0, Math.min(row, maxRows - 1)), [maxRows]);

  const getItem = useCallback((row: number, col: number) => {
    const section = sections[col];
    if (!section) return null;
    return section.links[row] || null;
  }, [sections]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        setFocusedRow(r => clampRow(r - 1));
        break;
      case "ArrowDown":
        e.preventDefault();
        setFocusedRow(r => clampRow(r + 1));
        break;
      case "ArrowLeft":
        e.preventDefault();
        setFocusedCol(c => {
          const newCol = c - 1;
          if (newCol < 0) return numCols - 1;
          return newCol;
        });
        break;
      case "ArrowRight":
        e.preventDefault();
        setFocusedCol(c => (c + 1) % numCols);
        break;
      case "Home":
        e.preventDefault();
        setFocusedRow(0);
        break;
      case "End":
        e.preventDefault();
        setFocusedRow(maxRows - 1);
        break;
      case "Enter": {
        e.preventDefault();
        const item = getItem(focusedRow, focusedCol);
        if (item) {
          onSelect(item.id);
          onClose();
        }
        break;
      }
      case "Escape":
        onClose();
        break;
    }
  }, [isOpen, focusedRow, focusedCol, clampRow, numCols, maxRows, getItem, onSelect, onClose]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center"
        onClick={onClose}
      >
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-4xl max-h-[85vh] bg-surface border border-white/10 rounded-2xl shadow-2xl p-6 overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex gap-6">
            {sections.map((section, colIndex) => (
              <div key={section.title} className="flex-1 min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                  {section.title}
                </div>
                <div className="flex flex-col gap-2">
                  {Array.from({ length: maxRows }).map((_, rowIndex) => {
                    const item = section.links[rowIndex];
                    const isFocused = focusedRow === rowIndex && focusedCol === colIndex;
                    if (!item) {
                      return <div key={rowIndex} className="h-[72px]" />;
                    }
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSelect(item.id);
                          onClose();
                        }}
                        className={`w-full flex flex-col items-center gap-2 p-3 rounded-xl text-center transition-all duration-150 bg-white/5 hover:bg-white/10 focus:outline-none ${
                          isFocused ? "ring-2 ring-primary scale-105 bg-white/10" : ""
                        }`}
                      >
                        <Icon size={20} className={isFocused ? "text-primary" : "text-gray-400"} />
                        <span className="text-xs text-gray-300 truncate w-full">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5 text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/5 rounded">←→</kbd>
                Columns
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/5 rounded">↑↓</kbd>
                Rows
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white/5 rounded">↵</kbd>
                Select
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/5 rounded">ESC</kbd>
              Close
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function useSectionsGrid() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { isOpen, setIsOpen };
}
