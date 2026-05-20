"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Flame, Keyboard, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAddBarProps {
  onAdd: (title: string, options: { isMIT: boolean; priority: "high" | "medium" | "low" }) => void;
}

export const QuickAddBar = ({ onAdd }: QuickAddBarProps) => {
  const [title, setTitle] = useState("");
  const [isMIT, setIsMIT] = useState(true);
  const [priority, setPriority] = useState<"high" | "medium" | "low">("high");
  const [isVisible, setIsVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "n" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA" && target.tagName !== "SELECT") {
          e.preventDefault();
          setIsVisible(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }
      }
      if (e.key === "Escape") {
        setIsVisible(false);
        setTitle("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title, { isMIT, priority });
    setTitle("");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4"
        >
          <form onSubmit={handleSubmit} className="bg-surface/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMIT(!isMIT)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border",
                  isMIT
                    ? "bg-red-500/20 border-red-500/30 text-red-400"
                    : "bg-white/5 border-white/10 text-gray-400"
                )}
              >
                <Flame size={14} className={isMIT ? "animate-pulse" : ""} />
                MIT
              </button>

              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as typeof priority)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-gray-300 focus:outline-none cursor-pointer"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <input
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add a task..."
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none border-none focus:ring-0"
              />

              <button
                type="button"
                onClick={() => { setIsVisible(false); setTitle(""); }}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>

              <button
                type="submit"
                disabled={!title.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-xl text-sm font-bold text-white transition-all"
              >
                <Plus size={16} />
                Add
              </button>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                <Keyboard size={10} />
                <span>Press <kbd className="px-1 py-0.5 bg-white/10 rounded">N</kbd> to quick add · <kbd className="px-1 py-0.5 bg-white/10 rounded">Esc</kbd> to close</span>
              </div>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
