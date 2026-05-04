"use client";

import { Utensils } from "lucide-react";
import { SkeletonCard } from "./SkeletonCard";

interface NutritionCardProps {
  mealsLogged?: number;
  mealsGoal?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

function MacroRing({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const offset = circ - Math.min(value / max, 1) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={40} height={40} className="transform -rotate-90">
        <circle cx={20} cy={20} r={r} fill="none" stroke="#E8E4DE" strokeWidth="4" />
        <circle cx={20} cy={20} r={r} fill="none" stroke={color} strokeWidth="4" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="text-xs font-mono font-semibold text-[#1A1A1A]">{value}g</span>
      <span className="text-[10px] text-[#6B6560] uppercase">{label}</span>
    </div>
  );
}

export function NutritionCard({ mealsLogged = 0, mealsGoal = 3, protein = 0, carbs = 0, fat = 0 }: NutritionCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 h-full min-h-[140px] hover:shadow-md transition-all duration-200 hover:-translate-y-px cursor-pointer">
      <p className="text-xs font-bold uppercase tracking-widest text-[#6B6560] mb-3">Nutrition</p>
      <div className="flex items-center gap-2 mb-3">
        <Utensils size={16} className="text-[#C4A882]" />
        <span className="text-sm font-semibold text-[#1A1A1A]">{mealsLogged}/{mealsGoal} meals</span>
      </div>
      <div className="flex items-center gap-4 justify-center">
        <MacroRing label="protein" value={protein} max={150} color="#3b82f6" />
        <MacroRing label="carbs" value={carbs} max={200} color="#22c55e" />
        <MacroRing label="fat" value={fat} max={60} color="#f59e0b" />
      </div>
    </div>
  );
}

export function NutritionCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#E8E4DE] p-5 min-h-[140px]">
      <SkeletonCard className="h-3 w-16 mb-3" />
      <SkeletonCard className="h-5 w-24 mb-4" />
      <div className="flex justify-center gap-4">
        <SkeletonCard className="w-10 h-10 rounded-full" />
        <SkeletonCard className="w-10 h-10 rounded-full" />
        <SkeletonCard className="w-10 h-10 rounded-full" />
      </div>
    </div>
  );
}
