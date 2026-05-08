"use client";

import { Dumbbell, Flame, Calendar } from "lucide-react";
import { SkeletonCard } from "./SkeletonCard";

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

export function GymCard({
  sessionsThisWeek = 0,
  sessionsGoal = 4,
  streak = 0,
  nextWorkout = "",
  recentSessions = [],
}: GymCardProps) {
  const progress = sessionsGoal > 0 ? (sessionsThisWeek / sessionsGoal) * 100 : 0;
  const displaySessions = recentSessions.slice(0, 3);

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
      <div className="flex items-center justify-between mb-3">
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
      {displaySessions.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t" style={{ borderColor: "var(--cc-border)" }}>
          {displaySessions.map((session, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: getWorkoutColor(session.type) }}
              />
              <span className="flex-shrink-0" style={{ color: "var(--cc-text-secondary)" }}>
                {getRelativeDate(session.date)}
              </span>
              <span style={{ color: "var(--cc-text)" }}>{session.type || "Workout"}</span>
              {session.sets != null && session.reps != null && (
                <span className="ml-auto font-mono" style={{ color: "var(--cc-text-secondary)" }}>
                  {session.sets}×{session.reps}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
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
