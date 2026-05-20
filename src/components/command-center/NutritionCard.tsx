"use client";

import { Utensils } from "lucide-react";
import { motion } from "framer-motion";

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

function MacroBar({ label, value, max, color, delay = 0 }: { label: string; value: number; max: number; color: string; delay?: number }) {
  const percent = Math.min((value / max) * 100, 100);

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase w-7" style={{ color: "var(--cc-text-secondary)" }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-[var(--cc-border)]">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, delay, ease: "easeOut" }}
        />
      </div>
      <span className="text-[10px] font-mono w-10 text-right" style={{ color: "var(--cc-text)" }}>{value}g</span>
    </div>
  );
}

export function NutritionCard({ mealsLogged = 0, mealsGoal = 3, protein = 0, carbs = 0, fat = 0, recentMeals = [] }: NutritionCardProps) {
  const displayMeals = recentMeals.slice(-2);
  const mealProgress = mealsGoal > 0 ? Math.min((mealsLogged / mealsGoal) * 100, 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ scale: 1.01, boxShadow: "0 4px 20px rgba(212,168,83,0.15)" }}
      className="rounded-2xl border p-5 h-full min-h-[200px] flex flex-col gap-3"
      style={{
        backgroundColor: "var(--cc-card)",
        borderColor: "var(--cc-border)",
        transition: "box-shadow 200ms ease",
      }}
    >
      <div className="flex items-center justify-between">
        <motion.p
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--cc-text-secondary)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          Nutrition
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          <Utensils size={14} style={{ color: "var(--cc-accent)" }} />
        </motion.div>
      </div>

      {/* Hero: meals logged */}
      <motion.div
        className="flex items-baseline gap-2"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <span
          className="text-2xl font-extrabold"
          style={{ fontFamily: "var(--font-heading)", color: "var(--cc-text)" }}
        >
          {mealsLogged}
        </span>
        <span className="text-xs" style={{ color: "var(--cc-text-secondary)" }}>/ {mealsGoal} meals</span>
      </motion.div>

      {/* Meal progress bar */}
      <motion.div
        className="h-1.5 rounded-full bg-[var(--cc-border)] overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: "var(--cc-accent)" }}
          initial={{ width: 0 }}
          animate={{ width: `${mealProgress}%` }}
          transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
        />
      </motion.div>

      {/* Macros as 3 horizontal bars */}
      <motion.div
        className="space-y-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <MacroBar label="protein" value={protein} max={150} color="var(--cc-accent)" delay={0.35} />
        <MacroBar label="carbs" value={carbs} max={200} color="var(--cc-success)" delay={0.4} />
        <MacroBar label="fat" value={fat} max={60} color="var(--cc-warning)" delay={0.45} />
      </motion.div>

      {/* Last meal time */}
      {displayMeals.length > 0 && (
        <motion.div
          className="flex items-center gap-1 text-[10px] pt-1 border-t"
          style={{ borderColor: "var(--cc-border)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span style={{ color: "var(--cc-text-secondary)" }}>Last meal:</span>
          <span style={{ color: "var(--cc-text)" }}>{displayMeals[displayMeals.length - 1].name}</span>
          <span style={{ color: "var(--cc-text-secondary)" }}>@</span>
          <span className="font-mono" style={{ color: "var(--cc-accent)" }}>{displayMeals[displayMeals.length - 1].time}</span>
        </motion.div>
      )}
    </motion.div>
  );
}

export function NutritionCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border p-5 min-h-[200px]"
      style={{ backgroundColor: "var(--cc-card)", borderColor: "var(--cc-border)" }}
    >
      <div className="h-3 w-14 rounded mb-4" style={{ backgroundColor: "var(--cc-bg)" }} />
      <div className="h-8 w-20 rounded mb-3" style={{ backgroundColor: "var(--cc-bg)" }} />
      <div className="h-1.5 w-full rounded mb-3" style={{ backgroundColor: "var(--cc-bg)" }} />
      <div className="h-3 w-full rounded" style={{ backgroundColor: "var(--cc-bg)" }} />
    </motion.div>
  );
}