"use client";

import { Inbox, Check, Flame } from "lucide-react";
import { SkeletonCard } from "./SkeletonCard";

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

export function LifeCard({ inboxCount = 0, bucketItems = [], journalStreak = 0, nextBucketItem }: LifeCardProps) {
  const topTwo = bucketItems.slice(0, 2);
  const motivational = getMotivationalLine({
    inboxCount,
    bucketCount: bucketItems.length,
    journalStreak,
    nextBucketItem,
  });

  return (
    <div className="rounded-xl border p-5 h-full min-h-[140px] flex flex-col gap-3 hover:shadow-md transition-all duration-200 hover:-translate-y-px cursor-pointer bg-[var(--cc-card)] border-[var(--cc-border)]">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--cc-text-secondary)" }}>
          Life
        </p>
        <div className="flex items-center gap-1">
          <Inbox size={13} style={{ color: "var(--cc-accent)" }} />
          <span className="text-xs font-mono font-bold" style={{ color: "var(--cc-text)" }}>
            {inboxCount}
          </span>
        </div>
      </div>

      {/* Body: journal + bucket list */}
      <div className="flex gap-4 flex-1">
        {/* Journal streak */}
        <div className="flex flex-col items-center justify-center gap-0.5 min-w-[44px]">
          <Flame size={15} style={{ color: "var(--cc-accent)" }} />
          <span className="text-xl font-bold font-mono leading-none" style={{ color: "var(--cc-text)" }}>
            {journalStreak}
          </span>
          <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--cc-text-secondary)" }}>
            journal
          </span>
        </div>

        {/* Vertical divider */}
        <div className="w-px self-stretch" style={{ backgroundColor: "var(--cc-border)" }} />

        {/* Bucket list items */}
        <div className="flex flex-col justify-center gap-1.5 flex-1 min-w-0">
          {topTwo.length === 0 ? (
            <p className="text-xs truncate italic" style={{ color: "var(--cc-text-secondary)" }}>
              No bucket list items yet
            </p>
          ) : (
            topTwo.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 min-w-0">
                <Check
                  size={12}
                  className="flex-shrink-0"
                  style={{ color: "var(--cc-accent)" }}
                />
                <span className="text-xs truncate" style={{ color: "var(--cc-text)" }}>
                  {item}
                </span>
              </div>
            ))
          )}
          {bucketItems.length > 2 && (
            <p className="text-[10px]" style={{ color: "var(--cc-text-secondary)" }}>
              +{bucketItems.length - 2} more
            </p>
          )}
        </div>
      </div>

      {/* Footer: next bucket item + motivational line */}
      <div className="space-y-1 pt-1 border-t" style={{ borderColor: "var(--cc-border)" }}>
        {nextBucketItem && (
          <p className="text-xs truncate" style={{ color: "var(--cc-accent)" }}>
            Next: {nextBucketItem}
          </p>
        )}
        <p
          className="text-xs italic"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--cc-text-secondary)",
          }}
        >
          {motivational}
        </p>
      </div>
    </div>
  );
}

export function LifeCardSkeleton() {
  return (
    <div className="rounded-xl border p-5 min-h-[140px] bg-[var(--cc-card)] border-[var(--cc-border)]">
      <SkeletonCard className="h-3 w-10 mb-3" />
      <div className="flex gap-4 mb-3">
        <SkeletonCard className="h-14 w-12 rounded-lg" />
        <SkeletonCard className="h-14 flex-1 rounded-lg" />
      </div>
      <SkeletonCard className="h-3 w-full mb-1" />
      <SkeletonCard className="h-3 w-3/4" />
    </div>
  );
}