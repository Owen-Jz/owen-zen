"use client";

import { Calendar } from "lucide-react";
import { motion } from "framer-motion";

interface ContentCardProps {
  postsThisWeek?: number;
  scheduledDays?: number[];
  scheduledPosts?: Array<{
    title: string;
    scheduledDate: string;
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
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

function ScheduledDot({ active }: { active: boolean }) {
  return (
    <motion.div
      className="w-2 h-2 rounded-full"
      style={{ backgroundColor: active ? "var(--cc-accent)" : "transparent" }}
      animate={active ? {
        scale: [1, 1.3, 1],
        opacity: [0.8, 1, 0.8],
        transition: { duration: 2, repeat: Infinity }
      } : {}}
    />
  );
}

export function ContentCard({ postsThisWeek = 0, scheduledDays = [], scheduledPosts = [] }: ContentCardProps) {
  const days = ["S", "M", "T", "W", "T", "F", "S"];
  const today = new Date().getDay();
  const nextPost = scheduledPosts[0];

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
          Content
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          <Calendar size={14} style={{ color: "var(--cc-accent)" }} />
        </motion.div>
      </div>

      {/* Hero: posts this week */}
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
          {postsThisWeek}
        </span>
        <span className="text-xs" style={{ color: "var(--cc-text-secondary)" }}>posts this week</span>
      </motion.div>

      {/* 7 dots for days of week */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {days.map((d, i) => {
          const isScheduled = scheduledDays.includes(i);
          const isToday = i === today;
          return (
            <motion.div
              key={i}
              className="flex flex-col items-center gap-0.5"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.04 }}
            >
              <span className="text-[9px]" style={{ color: "var(--cc-text-secondary)" }}>{d}</span>
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-all"
                style={{
                  backgroundColor: isToday
                    ? "var(--cc-accent)"
                    : isScheduled
                    ? "rgba(212,168,83,0.25)"
                    : "transparent",
                  color: isToday
                    ? "var(--cc-card)"
                    : isScheduled
                    ? "var(--cc-accent)"
                    : "var(--cc-border)",
                  border: isToday ? "none" : isScheduled ? "none" : "1px solid var(--cc-border)",
                }}
              >
                {isScheduled && <ScheduledDot active={isScheduled} />}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Next scheduled post */}
      {nextPost ? (
        <motion.div
          className="text-xs pt-2 border-t"
          style={{ borderColor: "var(--cc-border)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.span
            className="truncate block"
            style={{ color: "var(--cc-text)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
          >
            {nextPost.title.length > 24 ? `${nextPost.title.slice(0, 24)}...` : nextPost.title}
          </motion.span>
          <span className="text-[10px]" style={{ color: "var(--cc-accent)" }}>
            {getRelativePostDate(nextPost.scheduledDate)}
          </span>
        </motion.div>
      ) : (
        <motion.p
          className="text-xs italic"
          style={{ color: "var(--cc-text-secondary)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          No posts scheduled
        </motion.p>
      )}
    </motion.div>
  );
}

export function ContentCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border p-5 min-h-[200px]"
      style={{ backgroundColor: "var(--cc-card)", borderColor: "var(--cc-border)" }}
    >
      <div className="h-3 w-14 rounded mb-4" style={{ backgroundColor: "var(--cc-bg)" }} />
      <div className="h-9 w-20 rounded mb-4" style={{ backgroundColor: "var(--cc-bg)" }} />
      <div className="flex justify-between">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="w-5 h-5 rounded-full" style={{ backgroundColor: "var(--cc-bg)" }} />
        ))}
      </div>
    </motion.div>
  );
}