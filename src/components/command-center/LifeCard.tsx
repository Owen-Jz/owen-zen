"use client";

import { Inbox, Star, BookOpen } from "lucide-react";
import { SkeletonCard } from "./SkeletonCard";

interface LifeCardProps {
  inboxCount?: number;
  bucketItems?: string[];
  journalStreak?: number;
}

export function LifeCard({ inboxCount = 0, bucketItems = [], journalStreak = 0 }: LifeCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 h-full min-h-[140px] hover:shadow-md transition-all duration-200 hover:-translate-y-px cursor-pointer">
      <p className="text-xs font-bold uppercase tracking-widest text-[#6B6560] mb-3">Life</p>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center gap-1">
          <Inbox size={16} className="text-[#C4A882]" />
          <span className="text-xl font-bold font-mono text-[#1A1A1A]">{inboxCount}</span>
          <span className="text-[10px] text-[#6B6560] uppercase">inbox</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Star size={16} className="text-[#C4A882]" />
          <span className="text-lg font-bold font-mono text-[#1A1A1A]">{bucketItems.length}</span>
          <span className="text-[10px] text-[#6B6560] uppercase">bucket</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <BookOpen size={16} className="text-[#C4A882]" />
          <span className="text-lg font-bold font-mono text-[#1A1A1A]">{journalStreak}</span>
          <span className="text-[10px] text-[#6B6560] uppercase">journal</span>
        </div>
      </div>
      {bucketItems.length > 0 && (
        <div className="mt-2 pt-2 border-t border-[#E8E4DE]">
          <p className="text-xs text-[#6B6560] truncate">Next: {bucketItems[0]}</p>
        </div>
      )}
    </div>
  );
}

export function LifeCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 min-h-[140px]">
      <SkeletonCard className="h-3 w-10 mb-3" />
      <div className="grid grid-cols-3 gap-2">
        <SkeletonCard className="h-14 rounded-lg" />
        <SkeletonCard className="h-14 rounded-lg" />
        <SkeletonCard className="h-14 rounded-lg" />
      </div>
    </div>
  );
}