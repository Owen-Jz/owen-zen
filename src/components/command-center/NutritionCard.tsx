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

function MacroRing({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const offset = circ - Math.min(value / max, 1) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={40} height={40} className="transform -rotate-90">
        <circle
          cx={20}
          cy={20}
          r={r}
          fill="none"
          stroke="var(--cc-border)"
          strokeWidth="4"
        />
        <circle
          cx={20}
          cy={20}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span
        className="text-xs font-mono font-semibold"
        style={{ color: "var(--cc-text)" }}
      >
        {value}g
      </span>
      <span className="text-[10px] uppercase" style={{ color: "var(--cc-text-secondary)" }}>
        {label}
      </span>
    </div>
  );
}

export function NutritionCard({
  mealsLogged = 0,
  mealsGoal = 3,
  protein = 0,
  carbs = 0,
  fat = 0,
}: NutritionCardProps) {
  return (
    <div
      className="rounded-xl border p-5 h-full min-h-[140px] hover:shadow-md transition-all duration-200 hover:-translate-y-px cursor-pointer"
      style={{
        backgroundColor: "var(--cc-card)",
        borderColor: "var(--cc-border)",
      }}
    >
      <p
        className="text-xs font-bold uppercase tracking-widest mb-3"
        style={{ color: "var(--cc-text-secondary)" }}
      >
        Nutrition
      </p>
      <div className="flex items-center gap-2 mb-3">
        <Utensils size={16} style={{ color: "var(--cc-accent)" }} />
        <span className="text-sm font-semibold" style={{ color: "var(--cc-text)" }}>
          {mealsLogged}/{mealsGoal} meals
        </span>
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
    <div
      className="rounded-xl border p-5 min-h-[140px]"
      style={{ backgroundColor: "var(--cc-card)", borderColor: "var(--cc-border)" }}
    >
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
