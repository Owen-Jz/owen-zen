"use client";

import { Target, Circle } from "lucide-react";
import { motion } from "framer-motion";

interface TaskCardProps {
  mitCount?: number;
  overdueCount?: number;
  totalCount?: number;
  topMits?: string[];
  priorityBreakdown?: { high: number; medium: number; low: number };
  dueBreakdown?: { today: number; thisWeek: number; later: number };
}

function PriorityDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full"
      style={{ backgroundColor: color }}
    />
  );
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
          Tasks
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          <Target size={14} style={{ color: "var(--cc-accent)" }} />
        </motion.div>
      </div>

      {/* Hero: MIT count */}
      <motion.div
        className="flex items-baseline gap-2"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <motion.span
          className="text-3xl font-extrabold"
          style={{ fontFamily: "var(--font-heading)", color: "var(--cc-accent)" }}
          animate={mitCount > 0 ? {
            scale: [1, 1.05, 1],
            transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          } : {}}
        >
          {mitCount}
        </motion.span>
        <span className="text-sm" style={{ color: "var(--cc-text-secondary)" }}>
          MITs
        </span>
        {overdueCount > 0 && (
          <motion.span
            className="ml-auto text-xs font-mono px-2 py-0.5 rounded-full"
            style={{ color: "var(--cc-warning)", backgroundColor: "rgba(212,168,83,0.1)" }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            {overdueCount} overdue
          </motion.span>
        )}
      </motion.div>

      {/* Top MIT titles */}
      {topMits.length > 0 && (
        <motion.div
          className="space-y-0.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          {topMits.slice(0, 3).map((title, idx) => (
            <motion.p
              key={idx}
              className="text-xs truncate"
              style={{ color: "var(--cc-text)" }}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + idx * 0.05 }}
            >
              {idx + 1}. {title.length > 28 ? `${title.slice(0, 28)}...` : title}
            </motion.p>
          ))}
        </motion.div>
      )}

      {/* Priority breakdown — 3 colored dots with animated bars */}
      {priorityBreakdown && (
        <motion.div
          className="flex items-center gap-3 pt-2 border-t"
          style={{ borderColor: "var(--cc-border)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <span className="text-[10px] uppercase" style={{ color: "var(--cc-text-secondary)" }}>Priority</span>
          <div className="flex items-center gap-3">
            {priorityBreakdown.high > 0 && (
              <motion.div
                className="flex items-center gap-1"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "auto", opacity: 1 }}
                transition={{ delay: 0.45, duration: 0.3 }}
              >
                <PriorityDot color="var(--cc-error)" />
                <span className="text-[10px] font-mono" style={{ color: "var(--cc-text)" }}>{priorityBreakdown.high}</span>
              </motion.div>
            )}
            {priorityBreakdown.medium > 0 && (
              <motion.div
                className="flex items-center gap-1"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "auto", opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                <PriorityDot color="var(--cc-warning)" />
                <span className="text-[10px] font-mono" style={{ color: "var(--cc-text)" }}>{priorityBreakdown.medium}</span>
              </motion.div>
            )}
            {priorityBreakdown.low > 0 && (
              <motion.div
                className="flex items-center gap-1"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "auto", opacity: 1 }}
                transition={{ delay: 0.55, duration: 0.3 }}
              >
                <PriorityDot color="var(--cc-success)" />
                <span className="text-[10px] font-mono" style={{ color: "var(--cc-text)" }}>{priorityBreakdown.low}</span>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export function TaskCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border p-5 min-h-[200px]"
      style={{ backgroundColor: "var(--cc-card)", borderColor: "var(--cc-border)" }}
    >
      <div className="h-3 w-12 rounded mb-4" style={{ backgroundColor: "var(--cc-bg)" }} />
      <div className="h-9 w-20 rounded mb-3" style={{ backgroundColor: "var(--cc-bg)" }} />
      <div className="space-y-2">
        <div className="h-3 w-full rounded" style={{ backgroundColor: "var(--cc-bg)" }} />
        <div className="h-3 w-3/4 rounded" style={{ backgroundColor: "var(--cc-bg)" }} />
      </div>
    </motion.div>
  );
}