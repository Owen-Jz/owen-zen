"use client";

import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { SkeletonCard } from "./SkeletonCard";

interface TodayCardProps {
  streak?: number;
}

export function TodayCard({ streak = 0 }: TodayCardProps) {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      );
      setDate(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const dayName = new Date().toLocaleDateString("en-US", { weekday: "long" });

  return (
    <div className="rounded-xl border p-5 flex flex-col justify-between h-full min-h-[140px] hover:shadow-md transition-all duration-200 hover:-translate-y-px cursor-pointer bg-[var(--cc-card)] border-[var(--cc-border)]">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--cc-text-secondary)" }}>Today</p>
        <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-heading)", color: "var(--cc-text)" }}>
          {dayName}
        </h2>
        <p className="text-sm" style={{ color: "var(--cc-text-secondary)" }}>{date}</p>
      </div>
      {streak > 0 && (
        <div className="flex items-center gap-1.5 mt-3">
          <Flame size={16} style={{ color: "var(--cc-accent)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--cc-accent)" }}>{streak} day streak</span>
        </div>
      )}
    </div>
  );
}

export function TodayCardSkeleton() {
  return (
    <div className="rounded-xl border p-5 min-h-[140px] bg-[var(--cc-card)] border-[var(--cc-border)]">
      <SkeletonCard className="h-3 w-20 mb-3" />
      <SkeletonCard className="h-8 w-32 mb-2" />
      <SkeletonCard className="h-4 w-40" />
    </div>
  );
}
