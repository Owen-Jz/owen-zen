"use client";

import { Inbox, Check, Flame } from "lucide-react";
import { motion } from "framer-motion";

interface LifeCardProps {
  inboxCount?: number;
  bucketItems?: string[];
  journalStreak?: number;
  nextBucketItem?: string;
}

function getMotivationalLine(params: {
  inboxCount: number;
  bucketCount: number;
  journalStreak: number;
  nextBucketItem?: string;
}): string {
  const { inboxCount, bucketCount, journalStreak } = params;

  if (inboxCount > 10) return "Tame the chaos — your inbox awaits.";
  if (inboxCount > 5) return "A few items left. You've got this.";
  if (inboxCount > 0) return "Keep the momentum going.";
  if (journalStreak >= 7) return "A week of reflections — keep it alive.";
  if (journalStreak >= 3) return "Building momentum one day at a time.";
  if (bucketCount > 0) return "One step closer to your goals.";
  return "Every day is a fresh start.";
}

function InboxBadge({ count }: { count: number }) {
  // Color-coded badge: green (<3), amber (3-7), red (>7)
  const color = count === 0 ? "var(--cc-success)" : count <= 3 ? "var(--cc-success)" : count <= 7 ? "var(--cc-warning)" : "var(--cc-error)";
  const bgOpacity = count === 0 ? 0.1 : count <= 3 ? 0.15 : count <= 7 ? 0.2 : 0.25;

  return (
    <motion.span
      className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold"
      style={{
        backgroundColor: color,
        opacity: 0.85,
        color: "var(--cc-card)",
      }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 15 }}
    >
      {count}
    </motion.span>
  );
}

export function LifeCard({ inboxCount = 0, bucketItems = [], journalStreak = 0, nextBucketItem }: LifeCardProps) {
  const topTwo = bucketItems.slice(0, 2);
  const motivational = getMotivationalLine({
    inboxCount,
    bucketCount: bucketItems.length,
    journalStreak,
    nextBucketItem,
  });

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
      {/* Header row */}
      <div className="flex items-center justify-between">
        <motion.p
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--cc-text-secondary)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          Life
        </motion.p>
        <motion.div
          className="flex items-center gap-1.5"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Inbox size={13} style={{ color: "var(--cc-accent)" }} />
          <span className="text-sm font-bold" style={{ color: "var(--cc-text)" }}>
            {inboxCount}
          </span>
          <span className="text-[10px]" style={{ color: "var(--cc-text-secondary)" }}>inbox</span>
          <InboxBadge count={inboxCount} />
        </motion.div>
      </div>

      {/* Body: journal streak + bucket list */}
      <div className="flex gap-4 flex-1">
        {/* Journal streak flame */}
        <motion.div
          className="flex flex-col items-center justify-center gap-0.5 min-w-[44px]"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
        >
          <Flame
            size={16}
            style={{ color: "var(--cc-accent)" }}
            className="drop-shadow-[0_0_6px_rgba(212,168,83,0.5)]"
          />
          <span
            className="text-2xl font-extrabold leading-none"
            style={{ fontFamily: "var(--font-heading)", color: "var(--cc-text)" }}
          >
            {journalStreak}
          </span>
          <span className="text-[9px] uppercase tracking-wide" style={{ color: "var(--cc-text-secondary)" }}>
            journal
          </span>
        </motion.div>

        {/* Vertical divider */}
        <div className="w-px self-stretch" style={{ backgroundColor: "var(--cc-border)" }} />

        {/* Bucket list items */}
        <div className="flex flex-col justify-center gap-2 flex-1 min-w-0">
          {topTwo.length === 0 ? (
            <motion.p
              className="text-xs truncate italic"
              style={{ color: "var(--cc-text-secondary)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              No bucket list items yet
            </motion.p>
          ) : (
            topTwo.map((item, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-1.5 min-w-0"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.35 + i * 0.08, type: "spring", stiffness: 400 }}
                >
                  <Check size={12} style={{ color: "var(--cc-accent)" }} className="drop-shadow-[0_0_3px_rgba(212,168,83,0.4)]" />
                </motion.div>
                <span className="text-xs truncate" style={{ color: "var(--cc-text)" }}>
                  {item}
                </span>
              </motion.div>
            ))
          )}
          {bucketItems.length > 2 && (
            <motion.p
              className="text-[10px]"
              style={{ color: "var(--cc-text-secondary)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
            >
              +{bucketItems.length - 2} more
            </motion.p>
          )}
        </div>
      </div>

      {/* Footer: next bucket item + motivational */}
      <motion.div
        className="space-y-1 pt-1 border-t"
        style={{ borderColor: "var(--cc-border)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {nextBucketItem && (
          <p className="text-xs truncate" style={{ color: "var(--cc-accent)" }}>
            Next: {nextBucketItem}
          </p>
        )}
        <p
          className="text-xs italic"
          style={{ fontFamily: "var(--font-heading)", color: "var(--cc-text-secondary)" }}
        >
          {motivational}
        </p>
      </motion.div>
    </motion.div>
  );
}

export function LifeCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border p-5 min-h-[200px]"
      style={{ backgroundColor: "var(--cc-card)", borderColor: "var(--cc-border)" }}
    >
      <div className="h-3 w-10 rounded mb-4" style={{ backgroundColor: "var(--cc-bg)" }} />
      <div className="flex gap-4 mb-3">
        <div className="h-14 w-12 rounded-lg" style={{ backgroundColor: "var(--cc-bg)" }} />
        <div className="h-14 flex-1 rounded-lg" style={{ backgroundColor: "var(--cc-bg)" }} />
      </div>
      <div className="h-3 w-full rounded mb-1" style={{ backgroundColor: "var(--cc-bg)" }} />
      <div className="h-3 w-3/4 rounded" style={{ backgroundColor: "var(--cc-bg)" }} />
    </motion.div>
  );
}