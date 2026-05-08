"use client";

import { Target, AlertTriangle, CheckSquare } from "lucide-react";
import { SkeletonCard } from "./SkeletonCard";

interface TaskCardProps {
  mitCount?: number;
  overdueCount?: number;
  totalCount?: number;
  // New props:
  topMits?: string[]; // Array of MIT task titles (max 3)
  priorityBreakdown?: { high: number; medium: number; low: number };
  dueBreakdown?: { today: number; thisWeek: number; later: number };
}

export function TaskCard({
  mitCount = 0,
  overdueCount = 0,
  totalCount = 0,
  topMits = [],
  priorityBreakdown,
  dueBreakdown,
}: TaskCardProps) {
  return (
    <div className="rounded-xl border p-5 h-full min-h-[140px] hover:shadow-md transition-all duration-200 hover:-translate-y-px cursor-pointer bg-[var(--cc-card)] border-[var(--cc-border)]">
      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--cc-text-secondary)" }}>Tasks</p>

      {/* Main stats row */}
      <div className="flex items-start gap-4 mb-4">
        <div className="flex flex-col items-center gap-1">
          <Target size={20} style={{ color: "var(--cc-accent)" }} />
          <span className="text-2xl font-bold font-mono" style={{ color: "var(--cc-accent)" }}>{mitCount}</span>
          <span className="text-[10px] uppercase" style={{ color: "var(--cc-text-secondary)" }}>MITs</span>
        </div>
        {overdueCount > 0 && (
          <div className="flex flex-col items-center gap-1">
            <AlertTriangle size={20} style={{ color: "var(--cc-warning)" }} />
            <span className="text-2xl font-bold font-mono" style={{ color: "var(--cc-warning)" }}>{overdueCount}</span>
            <span className="text-[10px] uppercase" style={{ color: "var(--cc-warning)" }}>overdue</span>
          </div>
        )}
        <div className="flex flex-col items-center gap-1 ml-auto">
          <CheckSquare size={20} style={{ color: "var(--cc-success)" }} />
          <span className="text-lg font-bold font-mono" style={{ color: "var(--cc-text)" }}>{totalCount}</span>
          <span className="text-[10px] uppercase" style={{ color: "var(--cc-text-secondary)" }}>total</span>
        </div>
      </div>

      {/* Priority breakdown - colored dots */}
      {priorityBreakdown && (
        <div className="flex items-center gap-3 mb-3 text-[10px]">
          <span className="uppercase" style={{ color: "var(--cc-text-secondary)" }}>Priority</span>
          <div className="flex items-center gap-2">
            {priorityBreakdown.high > 0 && (
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--cc-error)" }} />
                <span style={{ color: "var(--cc-text)" }}>{priorityBreakdown.high}</span>
              </div>
            )}
            {priorityBreakdown.medium > 0 && (
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--cc-warning)" }} />
                <span style={{ color: "var(--cc-text)" }}>{priorityBreakdown.medium}</span>
              </div>
            )}
            {priorityBreakdown.low > 0 && (
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--cc-success)" }} />
                <span style={{ color: "var(--cc-text)" }}>{priorityBreakdown.low}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top 3 MIT list */}
      {topMits.length > 0 && (
        <div className="mb-3">
          <span className="text-[10px] uppercase block mb-1" style={{ color: "var(--cc-text-secondary)" }}>Top MITs</span>
          <ul className="text-[11px] space-y-0.5">
            {topMits.slice(0, 3).map((title, idx) => (
              <li key={idx} className="truncate" style={{ color: "var(--cc-text)" }}>
                {title.length > 30 ? `${title.slice(0, 30)}...` : title}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Due breakdown - Today / This Week / Later */}
      {dueBreakdown && (
        <div className="flex items-center gap-3 text-[10px]">
          {dueBreakdown.today > 0 && (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--cc-accent)" }} />
              <span style={{ color: "var(--cc-text)" }}>{dueBreakdown.today} today</span>
            </div>
          )}
          {dueBreakdown.thisWeek > 0 && (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--cc-warning)" }} />
              <span style={{ color: "var(--cc-text)" }}>{dueBreakdown.thisWeek} week</span>
            </div>
          )}
          {dueBreakdown.later > 0 && (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--cc-success)" }} />
              <span style={{ color: "var(--cc-text)" }}>{dueBreakdown.later} later</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TaskCardSkeleton() {
  return (
    <div className="rounded-xl border p-5 min-h-[140px] bg-[var(--cc-card)] border-[var(--cc-border)]">
      <SkeletonCard className="h-3 w-12 mb-4" />
      <div className="flex gap-4">
        <SkeletonCard className="h-16 w-16 rounded-lg" />
        <SkeletonCard className="h-16 w-16 rounded-lg" />
        <SkeletonCard className="h-16 w-16 rounded-lg" />
      </div>
    </div>
  );
}
