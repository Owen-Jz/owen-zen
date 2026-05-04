"use client";

import { Target, AlertTriangle, CheckSquare } from "lucide-react";
import { SkeletonCard } from "./SkeletonCard";

interface TaskCardProps {
  mitCount?: number;
  overdueCount?: number;
  totalCount?: number;
}

export function TaskCard({ mitCount = 0, overdueCount = 0, totalCount = 0 }: TaskCardProps) {
  return (
    <div className="rounded-xl border p-5 h-full min-h-[140px] hover:shadow-md transition-all duration-200 hover:-translate-y-px cursor-pointer bg-[var(--cc-card)] border-[var(--cc-border)]">
      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--cc-text-secondary)" }}>Tasks</p>
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center gap-1">
          <Target size={20} style={{ color: "var(--cc-accent)" }} />
          <span className="text-2xl font-bold font-mono" style={{ color: "var(--cc-text)" }}>{mitCount}</span>
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
