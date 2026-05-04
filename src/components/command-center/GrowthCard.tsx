"use client";

import { BookOpen, Award } from "lucide-react";
import { SkeletonCard } from "./SkeletonCard";

interface CourseProgress {
  title: string;
  progress: number;
}

interface GrowthCardProps {
  courses?: CourseProgress[];
  latestAchievement?: string;
  level?: number;
  xp?: number;
  xpForNext?: number;
}

export function GrowthCard({ courses = [], latestAchievement = "", level = 1, xp = 0, xpForNext = 100 }: GrowthCardProps) {
  return (
    <div className="rounded-xl border p-5 h-full min-h-[140px] hover:shadow-md transition-all duration-200 hover:-translate-y-px cursor-pointer bg-[var(--cc-card)] border-[var(--cc-border)]">
      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--cc-text-secondary)" }}>Growth</p>
      <div className="space-y-2 mb-3">
        {courses.slice(0, 3).map((course, i) => (
          <div key={i}>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="font-medium truncate pr-2" style={{ color: "var(--cc-text)" }}>{course.title}</span>
              <span className="font-mono shrink-0" style={{ color: "var(--cc-text-secondary)" }}>{Math.round(course.progress)}%</span>
            </div>
            <div className="w-full rounded-full h-1 bg-[var(--cc-border)]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${course.progress}%`, backgroundColor: "var(--cc-accent)" }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        {latestAchievement ? (
          <div className="flex items-center gap-1.5">
            <Award size={14} style={{ color: "var(--cc-accent)" }} />
            <span className="text-xs truncate" style={{ color: "var(--cc-text-secondary)" }}>{latestAchievement}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <BookOpen size={14} style={{ color: "var(--cc-text-secondary)" }} />
            <span className="text-xs" style={{ color: "var(--cc-text-secondary)" }}>Level {level}</span>
          </div>
        )}
        <div className="text-[10px] font-mono" style={{ color: "var(--cc-text-secondary)" }}>{xp}/{xpForNext} XP</div>
      </div>
    </div>
  );
}

export function GrowthCardSkeleton() {
  return (
    <div className="rounded-xl border p-5 min-h-[140px] bg-[var(--cc-card)] border-[var(--cc-border)]">
      <SkeletonCard className="h-3 w-14 mb-3" />
      <div className="space-y-2 mb-3">
        <SkeletonCard className="h-3 w-full" />
        <SkeletonCard className="h-3 w-full" />
        <SkeletonCard className="h-3 w-3/4" />
      </div>
      <SkeletonCard className="h-3 w-32" />
    </div>
  );
}
