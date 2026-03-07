"use client";

import { useState, useEffect } from "react";
import { Sparkles, RefreshCw, Calendar, Clock, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface AISummaryWidgetProps {
  tasks: any[];
  habits?: any[];
}

export const AISummaryWidget = ({ tasks, habits }: AISummaryWidgetProps) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<"daily" | "weekly">("daily");
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleToggle = () => {
      setIsExpanded(prev => !prev);
      if (!summary && !isExpanded) {
        generateSummary("daily");
      }
    };
    window.addEventListener('toggle-ai-insights', handleToggle);
    return () => window.removeEventListener('toggle-ai-insights', handleToggle);
  }, [summary, isExpanded]);

  const generateSummary = async (summaryType: "daily" | "weekly") => {
    setLoading(true);
    setType(summaryType);
    try {
      const res = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks, habits, type: summaryType })
      });
      const data = await res.json();
      setSummary(data.summary);
    } catch (error) {
      setSummary("Unable to generate summary. Please try again.");
    }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className="fixed top-20 right-4 z-50 w-80"
        >
          <div className="bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <span className="font-medium">AI Insights</span>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 hover:bg-white/10 rounded-lg"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => generateSummary("daily")}
                  disabled={loading}
                  className={cn(
                    "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                    type === "daily" 
                      ? "bg-purple-500/20 text-purple-400" 
                      : "hover:bg-white/10 text-gray-400"
                  )}
                >
                  <Calendar className="w-4 h-4" />
                  Daily
                </button>
                <button
                  onClick={() => generateSummary("weekly")}
                  disabled={loading}
                  className={cn(
                    "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                    type === "weekly" 
                      ? "bg-purple-500/20 text-purple-400" 
                      : "hover:bg-white/10 text-gray-400"
                  )}
                >
                  <Clock className="w-4 h-4" />
                  Weekly
                </button>
              </div>

              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center py-6"
                  >
                    <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
                  </motion.div>
                ) : summary ? (
                  <motion.div
                    key="summary"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-background/50 border border-border/50 rounded-xl p-3"
                  >
                    <p className="text-gray-300 text-sm leading-relaxed">{summary}</p>
                  </motion.div>
                ) : (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    Click Daily or Weekly to generate insights
                  </div>
                )}
              </AnimatePresence>

              <button
                onClick={() => generateSummary(type)}
                disabled={loading}
                className="w-full mt-3 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                Regenerate
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
