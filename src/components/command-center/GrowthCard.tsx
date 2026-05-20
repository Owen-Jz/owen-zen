"use client";

import { useEffect, useState } from "react";
import { BookOpen, Award } from "lucide-react";
import { motion } from "framer-motion";

interface CourseProgress {
  title: string;
  progress: number;
  level?: number;
}

interface NextAchievement {
  title: string;
  xpNeeded: number;
}

interface GrowthCardProps {
  courses?: CourseProgress[];
  latestAchievement?: string;
  nextAchievement?: NextAchievement;
  level?: number;
  currentLevel?: number;
  xp?: number;
  xpForNext?: number;
}

export function GrowthCard({
  courses = [],
  latestAchievement = "",
  nextAchievement,
  level = 1,
  currentLevel,
  xp = 0,
  xpForNext = 100,
}: GrowthCardProps) {
  const [displayLevel, setDisplayLevel] = useState(currentLevel ?? level);

  useEffect(() => {
    setDisplayLevel(currentLevel ?? level);
  }, [currentLevel, level]);

  const displayCourse = courses[0];
  const xpProgress = xpForNext > 0 ? (xp / xpForNext) * 100 : 0;

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
          Growth
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          <BookOpen size={14} style={{ color: "var(--cc-accent)" }} />
        </motion.div>
      </div>

      {/* Hero: Level number + XP progress bar */}
      <motion.div
        className="flex items-center gap-4"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <motion.div
          className="flex flex-col items-center justify-center"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <span
            className="text-3xl font-extrabold"
            style={{ fontFamily: "var(--font-heading)", color: "var(--cc-accent)" }}
          >
            {displayLevel}
          </span>
          <span className="text-[10px] uppercase" style={{ color: "var(--cc-text-secondary)" }}>Level</span>
        </motion.div>
        <div className="flex-1 flex flex-col gap-1">
          <div className="h-2 rounded-full bg-[var(--cc-border)] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: "var(--cc-accent)" }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(xpProgress, 100)}%` }}
              transition={{ duration: 0.8, delay: 0.25, ease: "easeOut" }}
            />
          </div>
          <span className="text-[10px] font-mono" style={{ color: "var(--cc-text-secondary)" }}>
            {xp} / {xpForNext} XP
          </span>
        </div>
      </motion.div>

      {/* Current course title */}
      {displayCourse && (
        <motion.div
          className="text-xs pt-2 border-t"
          style={{ borderColor: "var(--cc-border)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <span className="truncate block" style={{ color: "var(--cc-text)" }}>
            {displayCourse.title}
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            <div className="h-1 flex-1 rounded-full bg-[var(--cc-border)] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: "var(--cc-accent)" }}
                initial={{ width: 0 }}
                animate={{ width: `${displayCourse.progress}%` }}
                transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              />
            </div>
            <span className="text-[10px] font-mono" style={{ color: "var(--cc-text-secondary)" }}>
              {Math.round(displayCourse.progress)}%
            </span>
          </div>
        </motion.div>
      )}

      {/* Next achievement + XP needed */}
      {nextAchievement && (
        <motion.div
          className="flex items-center gap-1.5 text-xs"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Award size={12} style={{ color: "var(--cc-accent)" }} className="drop-shadow-[0_0_4px_rgba(212,168,83,0.5)]" />
          <span className="truncate flex-1" style={{ color: "var(--cc-text)" }}>
            {nextAchievement.title}
          </span>
          <span className="text-[10px] font-mono" style={{ color: "var(--cc-text-secondary)" }}>
            +{nextAchievement.xpNeeded} XP
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}

export function GrowthCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border p-5 min-h-[200px]"
      style={{ backgroundColor: "var(--cc-card)", borderColor: "var(--cc-border)" }}
    >
      <div className="h-3 w-12 rounded mb-4" style={{ backgroundColor: "var(--cc-bg)" }} />
      <div className="flex gap-4 mb-3">
        <div className="h-12 w-12 rounded-full" style={{ backgroundColor: "var(--cc-bg)" }} />
        <div className="flex-1 flex flex-col gap-2 justify-center">
          <div className="h-2 w-full rounded" style={{ backgroundColor: "var(--cc-bg)" }} />
          <div className="h-3 w-20 rounded" style={{ backgroundColor: "var(--cc-bg)" }} />
        </div>
      </div>
      <div className="h-3 w-full rounded" style={{ backgroundColor: "var(--cc-bg)" }} />
    </motion.div>
  );
}