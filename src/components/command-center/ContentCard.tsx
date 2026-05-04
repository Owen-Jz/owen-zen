"use client";

import { Calendar } from "lucide-react";
import { SkeletonCard } from "./SkeletonCard";

interface ContentCardProps {
  postsThisWeek?: number;
  scheduledDays?: number[];
}

export function ContentCard({ postsThisWeek = 0, scheduledDays = [] }: ContentCardProps) {
  const days = ["S", "M", "T", "W", "T", "F", "S"];
  const today = new Date().getDay();

  return (
    <div
      className="rounded-xl border p-5 h-full min-h-[140px] hover:shadow-md transition-all duration-200 hover:-translate-y-px cursor-pointer"
      style={{
        backgroundColor: "var(--cc-card)",
        borderColor: "var(--cc-border)",
      }}
    >
      <p
        className="text-xs font-bold uppercase tracking-widest mb-3"
        style={{ color: "var(--cc-text-secondary)" }}
      >
        Content
      </p>
      <div className="flex items-center gap-2 mb-3">
        <Calendar size={16} style={{ color: "var(--cc-accent)" }} />
        <span
          className="text-xl font-bold font-mono"
          style={{ color: "var(--cc-text)" }}
        >
          {postsThisWeek}
        </span>
        <span className="text-xs" style={{ color: "var(--cc-text-secondary)" }}>
          posts this week
        </span>
      </div>
      <div className="flex items-center justify-between">
        {days.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-[10px]" style={{ color: "var(--cc-text-secondary)" }}>
              {d}
            </span>
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px]"
              style={{
                backgroundColor:
                  i === today
                    ? "var(--cc-accent)"
                    : scheduledDays.includes(i)
                    ? "var(--cc-border)"
                    : "transparent",
                color:
                  i === today
                    ? "var(--cc-card)"
                    : scheduledDays.includes(i)
                    ? "var(--cc-text)"
                    : "var(--cc-text-secondary)",
              }}
            >
              {scheduledDays.includes(i) ? "•" : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ContentCardSkeleton() {
  return (
    <div
      className="rounded-xl border p-5 min-h-[140px]"
      style={{ backgroundColor: "var(--cc-card)", borderColor: "var(--cc-border)" }}
    >
      <SkeletonCard className="h-3 w-14 mb-3" />
      <SkeletonCard className="h-7 w-24 mb-4" />
      <div className="flex justify-between">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <SkeletonCard key={i} className="w-6 h-6 rounded-full" />
        ))}
      </div>
    </div>
  );
}
