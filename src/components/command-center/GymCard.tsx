"use client";

import { useEffect, useState } from "react";
import { Dumbbell, Flame, Calendar } from "lucide-react";
import { motion } from "framer-motion";

interface GymCardProps {
  sessionsThisWeek?: number;
  sessionsGoal?: number;
  streak?: number;
  nextWorkout?: string;
  recentSessions?: Array<{
    date: string;
    type?: string;
    sets?: number;
    reps?: number;
  }>;
}

function getWorkoutColor(type?: string): string {
  if (!type) return "var(--cc-text-secondary)";
  const lowerType = type.toLowerCase();
  if (lowerType === "chest" || lowerType === "push") return "var(--cc-error)";
  if (lowerType === "back" || lowerType === "pull") return "var(--cc-accent)";
  if (lowerType === "legs" || lowerType === "squats") return "var(--cc-success)";
  return "var(--cc-text-secondary)";
}

function getRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "1d ago";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 14) return "1w ago";
  return `${Math.floor(diffDays / 7)}w ago`;
}

function ProgressRing({ value, max, size = 56 }: { value: number; max: number; size?: number }) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const strokeWidth = 5;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  const offset = circ - (animatedValue / max) * circ;
  const progress = value / max;
  const isNearGoal = progress >= 0.75;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {isNearGoal && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(212,168,83,0.2) 0%, transparent 70%)",
            filter: "blur(6px)",
          }}
        />
      )}
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
          style={isNearGoal ? { filter: "drop-shadow(0 0 6px rgba(212,168,83,0.5))" } : {}}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (value / max) * circ }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--cc-text)" }}>
          {value}/{max}
        </span>
      </div>
    </div>
  );
}

export function GymCard({
  sessionsThisWeek = 0,
  sessionsGoal = 4,
  streak = 0,
  nextWorkout = "",
  recentSessions = [],
}: GymCardProps) {
  const displaySessions = recentSessions.slice(0, 2);
  const lastSession = displaySessions[0];

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
      <div className="flex items-center justify-between">
        <motion.p
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--cc-text-secondary)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          Gym
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          <Dumbbell size={14} style={{ color: "var(--cc-accent)" }} />
        </motion.div>
      </div>

      {/* Hero: progress ring */}
      <motion.div
        className="flex items-center gap-4"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <ProgressRing value={sessionsThisWeek} max={sessionsGoal} size={56} />
        <div className="flex flex-col gap-1">
          <span className="text-xs" style={{ color: "var(--cc-text-secondary)" }}>sessions this week</span>
          {streak > 0 && (
            <motion.div
              className="flex items-center gap-1"
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Flame size={12} style={{ color: "var(--cc-accent)" }} className="drop-shadow-[0_0_4px_rgba(212,168,83,0.5)]" />
              <span className="text-xs font-semibold" style={{ color: "var(--cc-accent)" }}>
                {streak} streak
              </span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Recent sessions */}
      {displaySessions.length > 0 && (
        <motion.div
          className="space-y-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          {displaySessions.map((session, idx) => (
            <motion.div
              key={idx}
              className="flex items-center gap-2 text-xs pt-2 border-t"
              style={{ borderColor: "var(--cc-border)" }}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + idx * 0.08 }}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: getWorkoutColor(session.type) }}
              />
              <span style={{ color: "var(--cc-text)" }}>{session.type || "Workout"}</span>
              {session.sets != null && session.reps != null && (
                <span className="font-mono" style={{ color: "var(--cc-text-secondary)" }}>
                  {session.sets}×{session.reps}
                </span>
              )}
              <span className="ml-auto" style={{ color: "var(--cc-text-secondary)" }}>
                {getRelativeDate(session.date)}
              </span>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Next workout */}
      {nextWorkout && (
        <motion.div
          className="flex items-center gap-1 text-xs"
          style={{ color: "var(--cc-text-secondary)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          <Calendar size={11} />
          <span>Next: {nextWorkout}</span>
        </motion.div>
      )}
    </motion.div>
  );
}

export function GymCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border p-5 min-h-[200px]"
      style={{ backgroundColor: "var(--cc-card)", borderColor: "var(--cc-border)" }}
    >
      <div className="h-3 w-10 rounded mb-4" style={{ backgroundColor: "var(--cc-bg)" }} />
      <div className="flex gap-4 mb-3">
        <div className="rounded-full" style={{ width: 56, height: 56, backgroundColor: "var(--cc-bg)" }} />
        <div className="flex flex-col gap-2 justify-center">
          <div className="h-3 w-20 rounded" style={{ backgroundColor: "var(--cc-bg)" }} />
          <div className="h-3 w-16 rounded" style={{ backgroundColor: "var(--cc-bg)" }} />
        </div>
      </div>
      <div className="h-3 w-full rounded" style={{ backgroundColor: "var(--cc-bg)" }} />
    </motion.div>
  );
}