"use client";

import { Calendar } from "lucide-react";
import { SkeletonCard } from "./SkeletonCard";

interface ContentCardProps {
  postsThisWeek?: number;
  scheduledDays?: number[];
}

export function ContentCard({ postsThisWeek = 0, scheduledDays = [] }: ContentCardProps) {
  const days = ["S", "M", "T", "W", "T", "F", "S"];
  const today = new Date().getDay();

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 h-full min-h-[140px] hover:shadow-md transition-all duration-200 hover:-translate-y-px cursor-pointer">
      <p className="text-xs font-bold uppercase tracking-widest text-[#6B6560] mb-3">Content</p>
      <div className="flex items-center gap-2 mb-3">
        <Calendar size={16} className="text-[#C4A882]" />
        <span className="text-xl font-bold font-mono text-[#1A1A1A]">{postsThisWeek}</span>
        <span className="text-xs text-[#6B6560]">posts this week</span>
      </div>
      <div className="flex items-center justify-between">
        {days.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-[#6B6560]">{d}</span>
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                i === today
                  ? "bg-[#C4A882] text-white"
                  : scheduledDays.includes(i)
                  ? "bg-[#E8E4DE] text-[#1A1A1A]"
                  : "bg-transparent text-[#C8C4BE]"
              }`}
            >
              {scheduledDays.includes(i) ? "•" : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ContentCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 min-h-[140px]">
      <SkeletonCard className="h-3 w-14 mb-3" />
      <SkeletonCard className="h-7 w-24 mb-4" />
      <div className="flex justify-between">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <SkeletonCard key={i} className="w-6 h-6 rounded-full" />
        ))}
      </div>
    </div>
  );
}