"use client";

import { Users } from "lucide-react";
import { motion } from "framer-motion";

interface StageData {
  stage: string;
  count: number;
  value?: number;
}

interface LeadsCardProps {
  stages?: StageData[];
  recentLead?: {
    name: string;
    timestamp: string;
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

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function getStageColor(stageName: string): string {
  const lower = stageName.toLowerCase();
  if (lower === "open") return "var(--cc-accent)";
  if (lower === "qualified") return "var(--cc-warning)";
  if (lower === "closed") return "var(--cc-success)";
  return "var(--cc-accent)";
}

export function LeadsCard({ stages = [], recentLead }: LeadsCardProps) {
  const openStages = stages.filter(s => s.stage.toLowerCase() !== "closed");
  const total = openStages.reduce((sum, s) => sum + s.count, 0);

  // Build funnel segments only for stages with count > 0
  const funnelStages = stages.filter((s) => s.count > 0);
  const funnelSegments = funnelStages.map((s) => ({
    stage: s.stage,
    count: s.count,
    percentage: total > 0 ? (s.count / total) * 100 : 0,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ scale: 1.01, boxShadow: "0 4px 20px rgba(212,168,83,0.15)" }}
      className="rounded-2xl border p-5 h-full min-h-[200px] flex flex-col gap-3"
      style={{
        backgroundColor: "var(--cc-card)",
        borderColor: "var(--cc-border)",
        transition: "box-shadow 200ms ease",
      }}
    >
      <div className="flex items-center justify-between">
        <motion.p
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--cc-text-secondary)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          Leads
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          <Users size={14} style={{ color: "var(--cc-accent)" }} />
        </motion.div>
      </div>

      {/* Hero: total leads count */}
      <motion.div
        className="flex items-baseline gap-2"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <span
          className="text-3xl font-extrabold"
          style={{ fontFamily: "var(--font-heading)", color: "var(--cc-accent)" }}
        >
          {total}
        </span>
        <span className="text-xs" style={{ color: "var(--cc-text-secondary)" }}>open leads</span>
      </motion.div>

      {/* 3 pipeline stages as horizontal bars */}
      <motion.div
        className="flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {stages.map((stage, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-lg p-2 text-center"
            style={{ backgroundColor: "var(--cc-bg)", borderLeft: `3px solid ${getStageColor(stage.stage)}` }}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 + i * 0.08 }}
          >
            <div className="text-xs font-mono font-bold" style={{ color: "var(--cc-text)" }}>{stage.count}</div>
            <div className="text-[9px] uppercase tracking-wide" style={{ color: "var(--cc-text-secondary)" }}>{stage.stage}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Pipeline funnel bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="h-2 rounded-full overflow-hidden flex" style={{ backgroundColor: "var(--cc-bg)" }}>
          {funnelSegments.map((seg, i) => (
            <motion.div
              key={i}
              className="h-full rounded-full"
              style={{
                backgroundColor: getStageColor(seg.stage),
              }}
              initial={{ width: 0 }}
              animate={{ width: `${seg.percentage}%` }}
              transition={{ duration: 0.5, delay: 0.45 + i * 0.1, ease: "easeOut" }}
            />
          ))}
          {total === 0 && (
            <div className="h-full w-full rounded-full" style={{ backgroundColor: "var(--cc-bg)" }} />
          )}
        </div>
      </motion.div>

      {/* Most recent lead */}
      {recentLead && (
        <motion.div
          className="text-xs pt-1 border-t"
          style={{ borderColor: "var(--cc-border)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className="font-medium" style={{ color: "var(--cc-text)" }}>{recentLead.name}</span>
          <span style={{ color: "var(--cc-text-secondary)" }}> — {formatRelativeTime(recentLead.timestamp)}</span>
        </motion.div>
      )}
    </motion.div>
  );
}

export function LeadsCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border p-5 min-h-[200px]"
      style={{ backgroundColor: "var(--cc-card)", borderColor: "var(--cc-border)" }}
    >
      <div className="h-3 w-10 rounded mb-4" style={{ backgroundColor: "var(--cc-bg)" }} />
      <div className="h-9 w-20 rounded mb-3" style={{ backgroundColor: "var(--cc-bg)" }} />
      <div className="flex gap-2 mb-3">
        <div className="flex-1 h-10 rounded-lg" style={{ backgroundColor: "var(--cc-bg)" }} />
        <div className="flex-1 h-10 rounded-lg" style={{ backgroundColor: "var(--cc-bg)" }} />
        <div className="flex-1 h-10 rounded-lg" style={{ backgroundColor: "var(--cc-bg)" }} />
      </div>
      <div className="h-2 w-full rounded" style={{ backgroundColor: "var(--cc-bg)" }} />
    </motion.div>
  );
}