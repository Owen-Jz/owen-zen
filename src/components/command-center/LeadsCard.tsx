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
  recentLead?: {
    name: string;
    timestamp: string; // ISO date string
  };
}

function formatRelativeTime(isoTimestamp: string): string {
  const now = new Date();
  const then = new Date(isoTimestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${diffWeeks}w ago`;
}

export function LeadsCard({ stages = [], recentLead }: LeadsCardProps) {
  const total = stages.reduce((sum, s) => sum + s.count, 0);

  // Build funnel segments only for stages with count > 0
  const funnelStages = stages.filter((s) => s.count > 0);
  const funnelSegments = funnelStages.map((s) => ({
    stage: s.stage,
    count: s.count,
    percentage: total > 0 ? (s.count / total) * 100 : 0,
  }));

  // Determine color based on stage name
  const getStageColor = (stageName: string): string => {
    const lower = stageName.toLowerCase();
    if (lower === "open") return "var(--cc-accent)";
    if (lower === "qualified") return "var(--cc-warning)";
    if (lower === "closed") return "var(--cc-success)";
    return "var(--cc-accent)";
  };

  return (
    <div className="rounded-xl border p-5 h-full min-h-[140px] hover:shadow-md transition-all duration-200 hover:-translate-y-px cursor-pointer bg-[var(--cc-card)] border-[var(--cc-border)]">
      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--cc-text-secondary)" }}>Leads</p>
      <div className="flex items-center gap-2 mb-3">
        <Users size={16} style={{ color: "var(--cc-accent)" }} />
        <span className="text-xl font-bold font-mono" style={{ color: "var(--cc-text)" }}>
          {total}
        </span>
        <span className="text-xs" style={{ color: "var(--cc-text-secondary)" }}>open leads</span>
      </div>
      <div className="flex gap-2 mb-3">
        {stages.map((stage, i) => (
          <div
            key={i}
            className="flex-1 rounded-lg p-2 text-center"
            style={{ backgroundColor: "var(--cc-bg)", borderLeft: `3px solid ${getStageColor(stage.stage)}` }}
          >
            <div className="text-xs font-mono font-bold" style={{ color: "var(--cc-text)" }}>{stage.count}</div>
            <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--cc-text-secondary)" }}>{stage.stage}</div>
          </div>
        ))}
      </div>

      {/* Funnel visualization */}
      <div className="mb-3">
        <div className="h-2 rounded-full overflow-hidden flex" style={{ backgroundColor: "var(--cc-bg)" }}>
          {funnelSegments.map((seg, i) => (
            <div
              key={i}
              className="h-full rounded-full"
              style={{
                width: `${seg.percentage}%`,
                backgroundColor: getStageColor(seg.stage),
              }}
              title={`${seg.stage}: ${seg.count}`}
            />
          ))}
          {total === 0 && (
            <div className="h-full w-full rounded-full" style={{ backgroundColor: "var(--cc-bg)" }} />
          )}
        </div>
      </div>

      {/* Recent lead */}
      {recentLead && (
        <div className="text-xs" style={{ color: "var(--cc-text-secondary)" }}>
          <span className="font-medium" style={{ color: "var(--cc-text)" }}>{recentLead.name}</span>
          {" — "}
          {formatRelativeTime(recentLead.timestamp)}
        </div>
      )}
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
