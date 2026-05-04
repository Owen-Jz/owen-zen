"use client";

import { Flame } from "lucide-react";
import { SkeletonCard } from "./SkeletonCard";

interface HabitCardProps {
  todayPercent?: number;
  weeklyData?: number[];
  streak?: number;
}

function MiniRing({ percent, size = 48 }: { percent: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E8E4DE" strokeWidth="5" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="#C4A882" strokeWidth="5"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const h = 28;
  const w = 80;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        points={pts}
        fill="none"
        stroke="#C4A882"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HabitCard({ todayPercent = 0, weeklyData = [], streak = 0 }: HabitCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 h-full min-h-[140px] hover:shadow-md transition-all duration-200 hover:-translate-y-px cursor-pointer">
      <p className="text-xs font-bold uppercase tracking-widest text-[#6B6560] mb-3">Habits</p>
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-center">
          <MiniRing percent={todayPercent} size={56} />
          <span className="text-xs mt-1 font-semibold text-[#1A1A1A]">{Math.round(todayPercent)}%</span>
          <span className="text-[10px] text-[#6B6560]">today</span>
        </div>
        <div className="flex-1 ml-4">
          {weeklyData.length > 0 && (
            <div className="mb-2">
              <span className="text-[10px] uppercase tracking-wider text-[#6B6560]">7-day trend</span>
              <Sparkline data={weeklyData} />
            </div>
          )}
          {streak > 0 && (
            <div className="flex items-center gap-1">
              <Flame size={14} className="text-[#C4A882]" />
              <span className="text-xs font-semibold text-[#C4A882]">{streak} streak</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function HabitCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 min-h-[140px]">
      <SkeletonCard className="h-3 w-16 mb-4" />
      <div className="flex items-center gap-4">
        <SkeletonCard className="w-14 h-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonCard className="h-7 w-full" />
          <SkeletonCard className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}
