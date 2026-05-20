"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Focus, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskInsightsPanelProps {
  completedThisWeek: number[];
  completionRate: number;
  mitStreak: number;
  inFocusCount: number;
}

export const TaskInsightsPanel = ({ completedThisWeek, completionRate, mitStreak, inFocusCount }: TaskInsightsPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const max = Math.max(...completedThisWeek, 1);

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 mb-3 text-xs font-bold text-gray-400 uppercase tracking-wider hover:text-white transition-colors"
      >
        <ChevronDown size={14} className={cn("transition-transform", isExpanded ? "rotate-180" : "")} />
        Insights
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-surface/10 border border-white/5 rounded-2xl">
              {/* Weekly Chart */}
              <div className="bg-surface/20 backdrop-blur-md border border-white/5 rounded-xl p-4">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Weekly Completion</div>
                <div className="flex items-end gap-2 h-20">
                  {completedThisWeek.map((count, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max((count / max) * 64, count > 0 ? 8 : 0)}px` }}
                        transition={{ delay: i * 0.05 }}
                        className="w-full bg-gradient-to-t from-primary to-primary-light rounded-t-md"
                      />
                      <span className="text-[10px] text-gray-500">{days[i]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Completion Rate */}
              <div className="bg-surface/20 backdrop-blur-md border border-white/5 rounded-xl p-4">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Completion Rate</div>
                <div className="text-3xl font-bold text-white mb-2">{completionRate}%</div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completionRate}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={cn(
                      "h-full rounded-full",
                      completionRate >= 80 ? "bg-emerald-500" : completionRate >= 50 ? "bg-yellow-500" : "bg-red-500"
                    )}
                  />
                </div>
              </div>

              {/* Focus Zone */}
              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Focus Zone</div>
                  <div className="text-2xl font-bold text-white">{inFocusCount} tasks</div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  />
                  <span className="text-xs text-blue-400 font-medium">Stay focused</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
