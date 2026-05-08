"use client";

import { Calendar } from "lucide-react";
import { SkeletonCard } from "./SkeletonCard";

interface ContentCardProps {
  postsThisWeek?: number;
  scheduledDays?: number[];
  scheduledPosts?: Array<{
    title: string;
    scheduledDate: string; // ISO date string
  }>;
}

function getRelativePostDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[date.getMonth()];
  const day = date.getDate();

  return `${month} ${day}`;
}

export function ContentCard({ postsThisWeek = 0, scheduledDays = [], scheduledPosts = [] }: ContentCardProps) {
  const days = ["S", "M", "T", "W", "T", "F", "S"];
  const today = new Date().getDay();
  const nextTwoPosts = scheduledPosts.slice(0, 2);

  return (
    <div className="rounded-xl border p-5 h-full min-h-[140px] hover:shadow-md transition-all duration-200 hover:-translate-y-px cursor-pointer bg-[var(--cc-card)] border-[var(--cc-border)]">
      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--cc-text-secondary)" }}>Content</p>
      <div className="flex items-center gap-2 mb-3">
        <Calendar size={16} style={{ color: "var(--cc-accent)" }} />
        <span className="text-xl font-bold font-mono" style={{ color: "var(--cc-text)" }}>{postsThisWeek}</span>
        <span className="text-xs" style={{ color: "var(--cc-text-secondary)" }}>posts this week</span>
      </div>
      <div className="flex items-center justify-between mb-3">
        {days.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-[10px]" style={{ color: "var(--cc-text-secondary)" }}>{d}</span>
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px]"
              style={{
                backgroundColor: i === today ? "var(--cc-accent)" : scheduledDays.includes(i) ? "var(--cc-border)" : "transparent",
                color: i === today ? "var(--cc-card)" : scheduledDays.includes(i) ? "var(--cc-text)" : "var(--cc-border)",
              }}
            >
              {scheduledDays.includes(i) ? "•" : ""}
            </div>
          </div>
        ))}
      </div>
      {nextTwoPosts.length > 0 ? (
        <div className="space-y-1">
          {nextTwoPosts.map((post, i) => (
            <p key={i} className="text-xs truncate" style={{ color: "var(--cc-text-secondary)" }}>
              {post.title} — <span style={{ color: "var(--cc-accent)" }}>{getRelativePostDate(post.scheduledDate)}</span>
            </p>
          ))}
        </div>
      ) : (
        <p className="text-xs" style={{ color: "var(--cc-text-secondary)" }}>No posts scheduled</p>
      )}
    </div>
  );
}

export function ContentCardSkeleton() {
  return (
    <div className="rounded-xl border p-5 min-h-[140px] bg-[var(--cc-card)] border-[var(--cc-border)]">
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
