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
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 h-full min-h-[140px] hover:shadow-md transition-all duration-200 hover:-translate-y-px cursor-pointer">
      <p className="text-xs font-bold uppercase tracking-widest text-[#6B6560] mb-3">Growth</p>
      <div className="space-y-2 mb-3">
        {courses.slice(0, 3).map((course, i) => (
          <div key={i}>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-[#1A1A1A] font-medium truncate pr-2">{course.title}</span>
              <span className="font-mono text-[#6B6560] shrink-0">{Math.round(course.progress)}%</span>
            </div>
            <div className="w-full bg-[#E8E4DE] rounded-full h-1">
              <div
                className="h-full rounded-full bg-[#C4A882] transition-all duration-500"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        {latestAchievement ? (
          <div className="flex items-center gap-1.5">
            <Award size={14} className="text-[#C4A882]" />
            <span className="text-xs text-[#6B6560] truncate">{latestAchievement}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <BookOpen size={14} className="text-[#6B6560]" />
            <span className="text-xs text-[#6B6560]">Level {level}</span>
          </div>
        )}
        <div className="text-[10px] font-mono text-[#6B6560]">{xp}/{xpForNext} XP</div>
      </div>
    </div>
  );
}

export function GrowthCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 min-h-[140px]">
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
