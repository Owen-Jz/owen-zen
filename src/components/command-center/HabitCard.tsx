"use client";

import { useState, useEffect } from "react";
import { Flame, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { WeekBarChart } from "./MiniChart";

interface Habit {
  title: string;
  streak: number;
  completedToday: boolean;
}

interface HabitCardProps {
  todayPercent?: number;
  weeklyData?: number[];
  streak?: number;
  habits?: Habit[];
}

function CompletionArc({ percent, size = 56 }: { percent: number; size?: number }) {
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const strokeWidth = 6;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPercent(percent), 100);
    return () => clearTimeout(timer);
  }, [percent]);

  const offset = circ - (animatedPercent / 100) * circ;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--cc-border)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="var(--cc-accent)"
          strokeWidth={strokeWidth}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 4px rgba(212,168,83,0.4))" }}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (percent / 100) * circ }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold" style={{ color: "var(--cc-text)" }}>
          {Math.round(percent)}%
        </span>
      </div>
    </div>
  );
}

export function HabitCard({ todayPercent = 0, weeklyData = [], streak = 0, habits = [] }: HabitCardProps) {
  const displayHabits = habits.slice(0, 4);
  const labels = ["6d", "5d", "4d", "3d", "2d", "1d", "now"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ scale: 1.01, boxShadow: "0 4px 20px rgba(212,168,83,0.15)" }}
      className="rounded-2xl border p-5 h-full min-h-[200px] flex flex-col gap-3"
      style={{
        backgroundColor: "var(--cc-card)",
        borderColor: "var(--cc-border)",
        transition: "box-shadow 200ms ease",
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div>
          <motion.p
            className="text-xs font-bold uppercase tracking-widest mb-1"
            style={{ color: "var(--cc-text-secondary)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Habits
          </motion.p>
          {streak > 0 && (
            <motion.div
              className="flex items-center gap-1 mt-1"
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Flame size={12} style={{ color: "var(--cc-accent)" }} className="drop-shadow-[0_0_4px_rgba(212,168,83,0.5)]" />
              <span className="text-xs font-semibold" style={{ color: "var(--cc-accent)" }}>
                {streak} day streak
              </span>
            </motion.div>
          )}
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          <CompletionArc percent={todayPercent} size={56} />
        </motion.div>
      </div>

      {/* 7-day mini bar chart */}
      {weeklyData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp size={10} style={{ color: "var(--cc-text-secondary)" }} />
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--cc-text-secondary)" }}>
              7-day activity
            </span>
          </div>
          <WeekBarChart data={weeklyData} labels={labels} height={36} color="var(--cc-accent)" />
        </motion.div>
      )}

      {/* Habit list */}
      {displayHabits.length > 0 ? (
        <motion.div
          className="space-y-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {displayHabits.map((habit, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.05 }}
            >
              <span className="flex-1 text-xs truncate" style={{ color: "var(--cc-text)" }}>
                {habit.title}
              </span>
              <div className="flex items-center gap-1">
                <Flame size={10} style={{ color: "var(--cc-accent)" }} />
                <span className="text-[10px] font-medium" style={{ color: "var(--cc-text-secondary)" }}>
                  {habit.streak}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.p
          className="text-xs text-center py-2"
          style={{ color: "var(--cc-text-secondary)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          No habits tracked yet
        </motion.p>
      )}
    </motion.div>
  );
}

export function HabitCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border p-5 min-h-[200px]"
      style={{ backgroundColor: "var(--cc-card)", borderColor: "var(--cc-border)" }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="h-3 w-12 rounded mb-2" style={{ backgroundColor: "var(--cc-bg)" }} />
          <div className="h-3 w-20 rounded" style={{ backgroundColor: "var(--cc-bg)" }} />
        </div>
        <div className="rounded-full" style={{ width: 56, height: 56, backgroundColor: "var(--cc-bg)" }} />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded" style={{ backgroundColor: "var(--cc-bg)" }} />
        <div className="h-3 w-full rounded" style={{ backgroundColor: "var(--cc-bg)" }} />
        <div className="h-3 w-3/4 rounded" style={{ backgroundColor: "var(--cc-bg)" }} />
      </div>
    </motion.div>
  );
}