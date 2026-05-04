"use client";

import { Dumbbell, Flame, Calendar } from "lucide-react";
import { SkeletonCard } from "./SkeletonCard";

interface GymCardProps {
  sessionsThisWeek?: number;
  sessionsGoal?: number;
  streak?: number;
  nextWorkout?: string;
}

export function GymCard({
  sessionsThisWeek = 0,
  sessionsGoal = 4,
  streak = 0,
  nextWorkout = "",
}: GymCardProps) {
  const progress = sessionsGoal > 0 ? (sessionsThisWeek / sessionsGoal) * 100 : 0;

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 h-full min-h-[140px] hover:shadow-md transition-all duration-200 hover:-translate-y-px cursor-pointer">
      <p className="text-xs font-bold uppercase tracking-widest text-[#6B6560] mb-3">Gym</p>
      <div className="flex items-center gap-3 mb-3">
        <Dumbbell size={18} className="text-[#C4A882]" />
        <span className="text-lg font-bold font-mono text-[#1A1A1A]">
          {sessionsThisWeek}/{sessionsGoal}
        </span>
        <span className="text-xs text-[#6B6560]">sessions</span>
      </div>
      <div className="w-full bg-[#E8E4DE] rounded-full h-1.5 mb-3">
        <div
          className="h-full rounded-full bg-[#C4A882] transition-all duration-500"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        {streak > 0 && (
          <div className="flex items-center gap-1">
            <Flame size={14} className="text-[#C4A882]" />
            <span className="text-xs font-semibold text-[#C4A882]">{streak} streak</span>
          </div>
        )}
        {nextWorkout && (
          <div className="flex items-center gap-1 text-xs text-[#6B6560] ml-auto">
            <Calendar size={12} />
            <span>{nextWorkout}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function GymCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 min-h-[140px]">
      <SkeletonCard className="h-3 w-10 mb-3" />
      <SkeletonCard className="h-7 w-24 mb-3" />
      <SkeletonCard className="h-1.5 w-full mb-3" />
      <SkeletonCard className="h-3 w-28" />
    </div>
  );
}
