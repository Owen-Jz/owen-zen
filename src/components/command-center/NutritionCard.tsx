"use client";

import { Utensils } from "lucide-react";
import { SkeletonCard } from "./SkeletonCard";

interface NutritionCardProps {
  mealsLogged?: number;
  mealsGoal?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  recentMeals?: Array<{
    name: string;
    time: string;
  }>;
}

function MacroRing({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const offset = circ - Math.min(value / max, 1) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={40} height={40} className="transform -rotate-90">
        <circle cx={20} cy={20} r={r} fill="none" stroke="var(--cc-border)" strokeWidth="4" />
        <circle cx={20} cy={20} r={r} fill="none" stroke={color} strokeWidth="4" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="text-xs font-mono font-semibold" style={{ color: "var(--cc-text)" }}>{value}g</span>
      <span className="text-[10px] uppercase" style={{ color: "var(--cc-text-secondary)" }}>{label}</span>
    </div>
  );
}

export function NutritionCard({ mealsLogged = 0, mealsGoal = 3, protein = 0, carbs = 0, fat = 0, recentMeals = [] }: NutritionCardProps) {
  const calories = Math.round(protein * 4 + carbs * 4 + fat * 9);
  const displayMeals = recentMeals.slice(-3);

  return (
    <div className="rounded-xl border p-5 h-full min-h-[140px] hover:shadow-md transition-all duration-200 hover:-translate-y-px cursor-pointer bg-[var(--cc-card)] border-[var(--cc-border)]">
      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--cc-text-secondary)" }}>Nutrition</p>
      <div className="flex items-center gap-2 mb-3">
        <Utensils size={16} style={{ color: "var(--cc-accent)" }} />
        <span className="text-sm font-semibold" style={{ color: "var(--cc-text)" }}>{mealsLogged}/{mealsGoal} meals</span>
      </div>
      {/* Mini progress bar */}
      <div className="h-1.5 rounded-full mb-3 bg-[var(--cc-border)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${mealsGoal > 0 ? Math.min((mealsLogged / mealsGoal) * 100, 100) : 0}%`, backgroundColor: "var(--cc-accent)" }}
        />
      </div>
      <div className="flex items-center gap-4 justify-center mb-3">
        <MacroRing label="protein" value={protein} max={150} color="var(--cc-accent)" />
        <MacroRing label="carbs" value={carbs} max={200} color="var(--cc-success)" />
        <MacroRing label="fat" value={fat} max={60} color="var(--cc-warning)" />
      </div>
      {/* Calorie estimate */}
      <p className="text-xs text-center font-mono" style={{ color: "var(--cc-text-secondary)" }}>
        ~{calories} kcal
      </p>
      {/* Last 3 meals */}
      {displayMeals.length > 0 && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--cc-border)" }}>
          {displayMeals.map((meal, i) => (
            <div key={i} className="flex justify-between text-xs py-1">
              <span style={{ color: "var(--cc-text)" }}>{meal.name}</span>
              <span style={{ color: "var(--cc-text-secondary)" }}>{meal.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function NutritionCardSkeleton() {
  return (
    <div className="rounded-xl border p-5 min-h-[140px] bg-[var(--cc-card)] border-[var(--cc-border)]">
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
