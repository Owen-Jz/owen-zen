"use client";

import { Flame, TrendingUp } from "lucide-react";
import { SkeletonCard } from "./SkeletonCard";

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

function CompletionRing({ percent, size = 64 }: { percent: number; size?: number }) {
  const strokeWidth = 6;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="var(--cc-border)" strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="var(--cc-accent)" strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

function MiniProgressBar({ completed }: { completed: boolean }) {
  return (
    <div className="w-16 h-2 rounded-full overflow-hidden bg-[var(--cc-border)]">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: completed ? "100%" : "0%",
          backgroundColor: "var(--cc-accent)"
        }}
      />
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const h = 36;
  const w = 140;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        points={pts}
        fill="none"
        stroke="var(--cc-accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <p className="text-sm font-medium mb-1" style={{ color: "var(--cc-text)" }}>
        Connect your habits
      </p>
      <p className="text-xs" style={{ color: "var(--cc-text-secondary)" }}>
        Track daily habits to see your progress
      </p>
    </div>
  );
}

export function HabitCard({ todayPercent = 0, weeklyData = [], streak = 0, habits = [] }: HabitCardProps) {
  const displayHabits = habits.slice(0, 4);

  return (
    <div className="rounded-xl border p-5 h-full min-h-[180px] hover:shadow-md transition-all duration-200 hover:-translate-y-px cursor-pointer bg-[var(--cc-card)] border-[var(--cc-border)]">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--cc-text-secondary)" }}>
            Habits
          </p>
          {streak > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Flame size={12} style={{ color: "var(--cc-accent)" }} />
              <span className="text-xs font-semibold" style={{ color: "var(--cc-accent)" }}>
                {streak} day streak
              </span>
            </div>
          )}
        </div>
        <div className="relative">
          <CompletionRing percent={todayPercent} size={56} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-bold" style={{ color: "var(--cc-text)" }}>
              {Math.round(todayPercent)}%
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 mb-4">
        {displayHabits.length > 0 ? (
          displayHabits.map((habit, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex-1 text-sm truncate" style={{ color: "var(--cc-text)" }}>
                {habit.title}
              </span>
              <div className="flex items-center gap-1">
                <Flame size={10} style={{ color: "var(--cc-accent)" }} />
                <span className="text-xs font-medium" style={{ color: "var(--cc-text-secondary)" }}>
                  {habit.streak}
                </span>
              </div>
              <MiniProgressBar completed={habit.completedToday} />
            </div>
          ))
        ) : (
          <EmptyState />
        )}
      </div>

      {weeklyData.length > 0 && (
        <div className="flex items-center gap-2 pt-2 border-t border-[var(--cc-border)]">
          <TrendingUp size={12} style={{ color: "var(--cc-text-secondary)" }} />
          <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--cc-text-secondary)" }}>
            7-day trend
          </span>
          <Sparkline data={weeklyData} />
        </div>
      )}
    </div>
  );
}

export function HabitCardSkeleton() {
  return (
    <div className="rounded-xl border p-5 min-h-[180px] bg-[var(--cc-card)] border-[var(--cc-border)]">
      <div className="flex items-start justify-between mb-4">
        <SkeletonCard className="h-3 w-16" />
        <SkeletonCard className="w-14 h-14 rounded-full" />
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <SkeletonCard className="h-4 flex-1" />
          <SkeletonCard className="h-4 w-16" />
        </div>
        <div className="flex items-center gap-2">
          <SkeletonCard className="h-4 flex-1" />
          <SkeletonCard className="h-4 w-16" />
        </div>
        <div className="flex items-center gap-2">
          <SkeletonCard className="h-4 flex-1" />
          <SkeletonCard className="h-4 w-16" />
        </div>
      </div>
      <div className="flex items-center gap-2 pt-2 border-t border-[var(--cc-border)]">
        <SkeletonCard className="h-3 w-12" />
        <SkeletonCard className="h-[36px] flex-1" />
      </div>
    </div>
  );
}
