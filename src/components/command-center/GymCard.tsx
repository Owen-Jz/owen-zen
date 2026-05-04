"use client";

import { Dumbbell, Flame, Calendar } from "lucide-react";
import { SkeletonCard } from "./SkeletonCard";

interface GymCardProps {
  sessionsThisWeek?: number;
  sessionsGoal?: number;
  streak?: number;
  nextWorkout?: string;
}

export function GymCard({
  sessionsThisWeek = 0,
  sessionsGoal = 4,
  streak = 0,
  nextWorkout = "",
}: GymCardProps) {
  const progress = sessionsGoal > 0 ? (sessionsThisWeek / sessionsGoal) * 100 : 0;

  return (
    <div className="rounded-xl border p-5 h-full min-h-[140px] hover:shadow-md transition-all duration-200 hover:-translate-y-px cursor-pointer bg-[var(--cc-card)] border-[var(--cc-border)]">
      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--cc-text-secondary)" }}>Gym</p>
      <div className="flex items-center gap-3 mb-3">
        <Dumbbell size={18} style={{ color: "var(--cc-accent)" }} />
        <span className="text-lg font-bold font-mono" style={{ color: "var(--cc-text)" }}>
          {sessionsThisWeek}/{sessionsGoal}
        </span>
        <span className="text-xs" style={{ color: "var(--cc-text-secondary)" }}>sessions</span>
      </div>
      <div className="w-full rounded-full h-1.5 mb-3 bg-[var(--cc-border)]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: "var(--cc-accent)" }}
        />
      </div>
      <div className="flex items-center justify-between">
        {streak > 0 && (
          <div className="flex items-center gap-1">
            <Flame size={14} style={{ color: "var(--cc-accent)" }} />
            <span className="text-xs font-semibold" style={{ color: "var(--cc-accent)" }}>{streak} streak</span>
          </div>
        )}
        {nextWorkout && (
          <div className="flex items-center gap-1 text-xs ml-auto" style={{ color: "var(--cc-text-secondary)" }}>
            <Calendar size={12} />
            <span>{nextWorkout}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function GymCardSkeleton() {
  return (
    <div className="rounded-xl border p-5 min-h-[140px] bg-[var(--cc-card)] border-[var(--cc-border)]">
      <SkeletonCard className="h-3 w-10 mb-3" />
      <SkeletonCard className="h-7 w-24 mb-3" />
      <SkeletonCard className="h-1.5 w-full mb-3" />
      <SkeletonCard className="h-3 w-28" />
    </div>
  );
}
