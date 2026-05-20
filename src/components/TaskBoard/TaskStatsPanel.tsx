"use client";

import { motion } from "framer-motion";
import { Check, Flame, AlertTriangle, TrendingUp, Trophy } from "lucide-react";
import { Task } from "@/types";
import { cn } from "@/lib/utils";

interface TaskStatsPanelProps {
  tasks: Task[];
  completedToday: number;
  completedThisWeek: number;
  completedThisMonth: number;
  overdueCount: number;
  mitStreak: number;
  perfectDay: boolean;
}

export const TaskStatsPanel = ({ tasks, completedToday, completedThisWeek, completedThisMonth, overdueCount, mitStreak, perfectDay }: TaskStatsPanelProps) => {
  const highPriority = tasks.filter(t => t.priority === 'high' && !t.isArchived).length;
  const mediumPriority = tasks.filter(t => t.priority === 'medium' && !t.isArchived).length;
  const lowPriority = tasks.filter(t => t.priority === 'low' && !t.isArchived).length;

  const stats = [
    {
      label: "Today",
      value: completedToday,
      icon: Check,
      color: "text-emerald-400",
      bg: "bg-emerald-500/20",
      border: "border-emerald-500/30",
    },
    {
      label: "This Week",
      value: completedThisWeek,
      icon: TrendingUp,
      color: "text-blue-400",
      bg: "bg-blue-500/20",
      border: "border-blue-500/30",
    },
    {
      label: "MIT Streak",
      value: mitStreak,
      icon: Flame,
      color: "text-orange-400",
      bg: "bg-orange-500/20",
      border: "border-orange-500/30",
      animate: mitStreak > 0,
    },
    {
      label: "Overdue",
      value: overdueCount,
      icon: AlertTriangle,
      color: "text-red-400",
      bg: "bg-red-500/20",
      border: "border-red-500/30",
      glow: overdueCount > 0,
    },
    {
      label: "High Priority",
      value: highPriority,
      icon: Flame,
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
    },
    {
      label: "All Time",
      value: completedThisMonth,
      icon: Trophy,
      color: "text-yellow-400",
      bg: "bg-yellow-500/20",
      border: "border-yellow-500/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              "bg-surface/20 backdrop-blur-xl border rounded-2xl p-4",
              stat.border,
              stat.glow && "shadow-[0_0_20px_rgba(239,68,68,0.2)]"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={cn("text-xs font-bold uppercase tracking-wider", stat.color)}>{stat.label}</span>
              <Icon size={14} className={stat.color} />
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            {stat.animate && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="inline-flex"
              >
                <Icon size={12} className={stat.color} />
              </motion.div>
            )}
          </motion.div>
        );
      })}

      {/* Perfect Day Badge - spans full width when active */}
      {perfectDay && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="col-span-2 md:col-span-3 lg:col-span-6 bg-gradient-to-r from-yellow-500/20 to-emerald-500/20 border border-yellow-500/30 rounded-2xl p-4 flex items-center justify-center gap-3"
        >
          <Trophy size={20} className="text-yellow-400 animate-pulse" />
          <span className="text-lg font-bold text-yellow-400">Perfect Day! All MITs completed!</span>
        </motion.div>
      )}
    </div>
  );
};
