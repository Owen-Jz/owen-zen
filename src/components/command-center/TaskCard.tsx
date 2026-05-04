"use client";

import { Target, AlertTriangle, CheckSquare } from "lucide-react";
import { SkeletonCard } from "./SkeletonCard";

interface TaskCardProps {
  mitCount?: number;
  overdueCount?: number;
  totalCount?: number;
}

export function TaskCard({ mitCount = 0, overdueCount = 0, totalCount = 0 }: TaskCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 h-full min-h-[140px] hover:shadow-md transition-all duration-200 hover:-translate-y-px cursor-pointer">
      <p className="text-xs font-bold uppercase tracking-widest text-[#6B6560] mb-3">Tasks</p>
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center gap-1">
          <Target size={20} className="text-[#C4A882]" />
          <span className="text-2xl font-bold font-mono text-[#1A1A1A]">{mitCount}</span>
          <span className="text-[10px] uppercase text-[#6B6560]">MITs</span>
        </div>
        {overdueCount > 0 && (
          <div className="flex flex-col items-center gap-1">
            <AlertTriangle size={20} className="text-[#D4915A]" />
            <span className="text-2xl font-bold font-mono text-[#D4915A]">{overdueCount}</span>
            <span className="text-[10px] uppercase text-[#D4915A]">overdue</span>
          </div>
        )}
        <div className="flex flex-col items-center gap-1 ml-auto">
          <CheckSquare size={20} className="text-[#7A9E7E]" />
          <span className="text-lg font-bold font-mono text-[#1A1A1A]">{totalCount}</span>
          <span className="text-[10px] uppercase text-[#6B6560]">total</span>
        </div>
      </div>
    </div>
  );
}

export function TaskCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 min-h-[140px]">
      <SkeletonCard className="h-3 w-12 mb-4" />
      <div className="flex gap-4">
        <SkeletonCard className="h-16 w-16 rounded-lg" />
        <SkeletonCard className="h-16 w-16 rounded-lg" />
        <SkeletonCard className="h-16 w-16 rounded-lg" />
      </div>
    </div>
  );
}