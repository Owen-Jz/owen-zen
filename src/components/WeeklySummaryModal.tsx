"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, RefreshCw, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface WeeklySummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WeeklySummaryModal = ({ isOpen, onClose }: WeeklySummaryModalProps) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [weekNumber, setWeekNumber] = useState(() => {
    const now = new Date();
    return getWeekNumber(now);
  });
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !summary) {
      generateSummary();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const generateSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/weekly-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekNumber, year })
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSummary(data.summary);
      }
    } catch (err) {
      setError("Failed to generate summary. Please try again.");
    }
    setLoading(false);
  };

  const goToPreviousWeek = () => {
    if (weekNumber === 1) {
      setYear(year - 1);
      setWeekNumber(52);
    } else {
      setWeekNumber(weekNumber - 1);
    }
    setSummary(null);
    generateSummary();
  };

  const goToNextWeek = () => {
    if (weekNumber === 52) {
      setYear(year + 1);
      setWeekNumber(1);
    } else {
      setWeekNumber(weekNumber + 1);
    }
    setSummary(null);
    generateSummary();
  };

  const goToCurrentWeek = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setWeekNumber(getWeekNumber(now));
    setSummary(null);
    generateSummary();
  };

  const getWeekRange = () => {
    const { startOfWeek, endOfWeek } = getWeekDateRange(weekNumber, year);
    return `${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl max-h-[90vh] bg-surface/95 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Weekly Summary</h2>
                  <p className="text-sm text-gray-400">Week {weekNumber} of {year}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPreviousWeek}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-sm font-medium text-gray-300 min-w-[120px] text-center">
                  {getWeekRange()}
                </span>
                <button
                  onClick={goToNextWeek}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white"
                >
                  <ChevronRight size={20} />
                </button>
                <button
                  onClick={goToCurrentWeek}
                  className="ml-2 px-3 py-1.5 text-xs font-medium bg-primary/20 text-primary hover:bg-primary/30 rounded-lg transition-colors"
                >
                  Current
                </button>
                <button
                  onClick={onClose}
                  className="ml-2 p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <RefreshCw className="w-8 h-8 text-primary animate-spin mb-4" />
                  <p className="text-gray-400">Generating your weekly summary...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <p className="text-red-400 mb-4">{error}</p>
                  <button
                    onClick={generateSummary}
                    className="px-4 py-2 bg-primary hover:brightness-110 text-white rounded-xl transition-all"
                  >
                    Try Again
                  </button>
                </div>
              ) : summary ? (
                <div className="prose prose-invert max-w-none">
                  {summary.split("\n").map((line, i) => {
                    const trimmed = line.trim();
                    if (trimmed.startsWith("### ")) {
                      return (
                        <h3 key={i} className="text-lg font-bold text-white mt-6 mb-3 flex items-center gap-2">
                          {trimmed.replace("### ", "")}
                        </h3>
                      );
                    }
                    if (trimmed.startsWith("## ")) {
                      return (
                        <h2 key={i} className="text-xl font-bold text-primary mt-8 mb-4 flex items-center gap-2">
                          {trimmed.replace("## ", "")}
                        </h2>
                      );
                    }
                    if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
                      return (
                        <p key={i} className="text-white font-semibold mt-4 mb-2">
                          {trimmed.replace(/\*\*/g, "")}
                        </p>
                      );
                    }
                    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                      return (
                        <li key={i} className="text-gray-300 ml-4 mb-1">
                          {trimmed.replace(/^[-*] /, "")}
                        </li>
                      );
                    }
                    if (trimmed === "") {
                      return <br key={i} />;
                    }
                    return (
                      <p key={i} className="text-gray-300 mb-2 leading-relaxed">
                        {trimmed}
                      </p>
                    );
                  })}
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Sparkles size={14} className="text-primary" />
                <span>AI-powered insights</span>
              </div>
              <button
                onClick={generateSummary}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:brightness-110 text-white rounded-xl transition-all disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                Regenerate
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getWeekDateRange(week: number, year: number): { startOfWeek: Date; endOfWeek: Date } {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  const startOfWeek = new Date(ISOweekStart);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(ISOweekStart);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  return { startOfWeek, endOfWeek };
}
