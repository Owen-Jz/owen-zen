"use client";

import { Users } from "lucide-react";
import { SkeletonCard } from "./SkeletonCard";

interface StageData {
  stage: string;
  count: number;
  value?: number;
}

interface LeadsCardProps {
  stages?: StageData[];
}

export function LeadsCard({ stages = [] }: LeadsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 h-full min-h-[140px] hover:shadow-md transition-all duration-200 hover:-translate-y-px cursor-pointer">
      <p className="text-xs font-bold uppercase tracking-widest text-[#6B6560] mb-3">Leads</p>
      <div className="flex items-center gap-2 mb-3">
        <Users size={16} className="text-[#C4A882]" />
        <span className="text-xl font-bold font-mono text-[#1A1A1A]">
          {stages.reduce((sum, s) => sum + s.count, 0)}
        </span>
        <span className="text-xs text-[#6B6560]">open leads</span>
      </div>
      <div className="flex gap-2">
        {stages.map((stage, i) => (
          <div
            key={i}
            className="flex-1 bg-[#F8F6F3] rounded-lg p-2 text-center"
          >
            <div className="text-xs font-mono font-bold text-[#1A1A1A]">{stage.count}</div>
            <div className="text-[10px] text-[#6B6560] uppercase tracking-wide">{stage.stage}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LeadsCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 min-h-[140px]">
      <SkeletonCard className="h-3 w-10 mb-3" />
      <SkeletonCard className="h-7 w-24 mb-4" />
      <div className="flex gap-2">
        <SkeletonCard className="flex-1 h-10 rounded-lg" />
        <SkeletonCard className="flex-1 h-10 rounded-lg" />
        <SkeletonCard className="flex-1 h-10 rounded-lg" />
      </div>
    </div>
  );
}