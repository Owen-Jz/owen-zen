"use client";

import { Users } from "lucide-react";
import { SkeletonCard } from "./SkeletonCard";

interface StageData {
  stage: string;
  count: number;
  value?: number;
}

interface LeadsCardProps {
  stages?: StageData[];
}

export function LeadsCard({ stages = [] }: LeadsCardProps) {
  return (
    <div className="rounded-xl border p-5 h-full min-h-[140px] hover:shadow-md transition-all duration-200 hover:-translate-y-px cursor-pointer bg-[var(--cc-card)] border-[var(--cc-border)]">
      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--cc-text-secondary)" }}>Leads</p>
      <div className="flex items-center gap-2 mb-3">
        <Users size={16} style={{ color: "var(--cc-accent)" }} />
        <span className="text-xl font-bold font-mono" style={{ color: "var(--cc-text)" }}>
          {stages.reduce((sum, s) => sum + s.count, 0)}
        </span>
        <span className="text-xs" style={{ color: "var(--cc-text-secondary)" }}>open leads</span>
      </div>
      <div className="flex gap-2">
        {stages.map((stage, i) => (
          <div
            key={i}
            className="flex-1 rounded-lg p-2 text-center"
            style={{ backgroundColor: "var(--cc-bg)" }}
          >
            <div className="text-xs font-mono font-bold" style={{ color: "var(--cc-text)" }}>{stage.count}</div>
            <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--cc-text-secondary)" }}>{stage.stage}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LeadsCardSkeleton() {
  return (
    <div className="rounded-xl border p-5 min-h-[140px] bg-[var(--cc-card)] border-[var(--cc-border)]">
      <SkeletonCard className="h-3 w-10 mb-3" />
      <SkeletonCard className="h-7 w-24 mb-4" />
      <div className="flex gap-2">
        <SkeletonCard className="flex-1 h-10 rounded-lg" />
        <SkeletonCard className="flex-1 h-10 rounded-lg" />
        <SkeletonCard className="flex-1 h-10 rounded-lg" />
      </div>
    </div>
  );
}
